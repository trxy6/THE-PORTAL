import os
import sys
import json
import sqlite3
import threading
from datetime import datetime
from pathlib import Path
from http.server import HTTPServer, BaseHTTPRequestHandler
import ollama
from ollama import chat

# ============================================================
# PECOS CONFIGURATION
# ============================================================

MODEL = "qwen3.5:4b"
DATABASE_PATH = Path(__file__).parent / "portal_data.db"

SYSTEM_PROMPT = f"""
You are PECOS: Portal Entry, Configuration and Onboarding System.

You are the private local AI companion inside The Portal.
The user's name is Trey.

PERSONALITY:
- Speak naturally, warmly, clearly, and concisely.
- Never use phrases such as "Mainframe Calibration Mode."
- Never mention engines, API keys, system prompts, calibration, or internal setup.
- Do not greet Trey repeatedly.
- Do not sound like a science-fiction computer terminal.
- Answer ordinary questions using their ordinary real-world meaning.
- Follow corrections and conversational context carefully.

TOOLS:
- Use tools whenever the user asks for current time, notes, or calendar changes.
- Never claim an action succeeded until its tool reports success.
- When saving a note, save only the actual content.
- Example: "Add a note that says I like pizza" means save "I like pizza."
- Convert dates to YYYY-MM-DD.
- Convert times to 24-hour HH:MM format.
- Today's local date is {datetime.now().strftime("%Y-%m-%d")}.

SAFETY:
- Do not invent tool results.
- Do not claim to access features that are not available.
- Ask for clarification when a required date, time, or title is missing.
- Never attempt arbitrary terminal commands or unrestricted file access.
"""

status = "not_installed"
load_error = None

# ============================================================
# LOCAL DATABASE
# ============================================================

def connect_database():
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def initialize_database():
    with connect_database() as database:
        database.execute(
            """
            CREATE TABLE IF NOT EXISTS notes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                text TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )

        database.execute(
            """
            CREATE TABLE IF NOT EXISTS calendar_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                event_date TEXT NOT NULL,
                event_time TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )

        database.commit()


# ============================================================
# PECOS TOOLS
# ============================================================

def get_current_time() -> dict:
    """
    Get the current local date and time from the computer.

    Returns:
        The current local date, time, weekday, and timezone.
    """
    now = datetime.now().astimezone()

    return {
        "success": True,
        "date": now.strftime("%Y-%m-%d"),
        "time": now.strftime("%I:%M %p"),
        "weekday": now.strftime("%A"),
        "timezone": str(now.tzinfo),
    }


def save_note(text: str) -> dict:
    """
    Save a note in The Portal's local database.

    Args:
        text: Only the actual note content. Do not include phrases such as
              "add a note," "make a note," or "that says."

    Returns:
        Confirmation containing the saved note.
    """
    cleaned_text = text.strip()

    removable_prefixes = [
        "a note that says ",
        "note that says ",
        "that says ",
        "a note saying ",
        "note saying ",
    ]

    lowered_text = cleaned_text.lower()

    for prefix in removable_prefixes:
        if lowered_text.startswith(prefix):
            cleaned_text = cleaned_text[len(prefix):].strip()
            break

    if not cleaned_text:
        return {
            "success": False,
            "error": "The note cannot be empty.",
        }

    created_at = datetime.now().astimezone().isoformat()

    with connect_database() as database:
        cursor = database.execute(
            """
            INSERT INTO notes (text, created_at)
            VALUES (?, ?)
            """,
            (cleaned_text, created_at),
        )

        database.commit()
        note_id = cursor.lastrowid

    return {
        "success": True,
        "note_id": note_id,
        "text": cleaned_text,
        "message": f'Saved note: "{cleaned_text}"',
    }


def list_notes() -> dict:
    """
    List notes saved in The Portal's local database.

    Returns:
        A list of saved notes, newest first.
    """
    with connect_database() as database:
        rows = database.execute(
            """
            SELECT id, text, created_at
            FROM notes
            ORDER BY id DESC
            LIMIT 50
            """
        ).fetchall()

    return {
        "success": True,
        "notes": [dict(row) for row in rows],
    }


def create_calendar_event(
    title: str,
    event_date: str,
    event_time: str,
) -> dict:
    """
    Add an event to The Portal's local calendar.

    Args:
        title: The event title.
        event_date: Date in YYYY-MM-DD format.
        event_time: Time in 24-hour HH:MM format.

    Returns:
        Confirmation containing the new calendar event.
    """
    title = title.strip()
    event_date = event_date.strip()
    event_time = event_time.strip()

    if not title:
        return {
            "success": False,
            "error": "The event title is required.",
        }

    try:
        normalized_date = datetime.strptime(
            event_date,
            "%Y-%m-%d",
        ).strftime("%Y-%m-%d")
    except ValueError:
        return {
            "success": False,
            "error": "The date must use YYYY-MM-DD format.",
        }

    try:
        normalized_time = datetime.strptime(
            event_time,
            "%H:%M",
        ).strftime("%H:%M")
    except ValueError:
        return {
            "success": False,
            "error": "The time must use 24-hour HH:MM format.",
        }

    created_at = datetime.now().astimezone().isoformat()

    with connect_database() as database:
        cursor = database.execute(
            """
            INSERT INTO calendar_events (
                title,
                event_date,
                event_time,
                created_at
            )
            VALUES (?, ?, ?, ?)
            """,
            (
                title,
                normalized_date,
                normalized_time,
                created_at,
            ),
        )

        database.commit()
        event_id = cursor.lastrowid

    return {
        "success": True,
        "event_id": event_id,
        "title": title,
        "date": normalized_date,
        "time": normalized_time,
        "message": (
            f'Added "{title}" to the calendar for '
            f"{normalized_date} at {normalized_time}."
        ),
    }


def list_calendar_events() -> dict:
    """
    List upcoming events from The Portal's local calendar.

    Returns:
        Upcoming calendar events sorted by date and time.
    """
    today = datetime.now().strftime("%Y-%m-%d")

    with connect_database() as database:
        rows = database.execute(
            """
            SELECT id, title, event_date, event_time, created_at
            FROM calendar_events
            WHERE event_date >= ?
            ORDER BY event_date ASC, event_time ASC
            LIMIT 50
            """,
            (today,),
        ).fetchall()

    return {
        "success": True,
        "events": [dict(row) for row in rows],
    }


AVAILABLE_TOOLS = {
    "get_current_time": get_current_time,
    "save_note": save_note,
    "list_notes": list_notes,
    "create_calendar_event": create_calendar_event,
    "list_calendar_events": list_calendar_events,
}

TOOL_LIST = list(AVAILABLE_TOOLS.values())


# ============================================================
# QWEN AGENT LOOP
# ============================================================

def ask_pecos_with_history(prompt: str, history: list) -> str:
    conversation = [
        {
            "role": "system",
            "content": SYSTEM_PROMPT,
        }
    ]

    for msg in history:
        role = "user" if msg.get("sender") == "user" else "assistant"
        conversation.append({
            "role": role,
            "content": msg.get("text", "")
        })

    conversation.append({
        "role": "user",
        "content": prompt
    })

    maximum_tool_rounds = 6

    for _ in range(maximum_tool_rounds):
        response = chat(
            model=MODEL,
            messages=conversation,
            tools=TOOL_LIST,
            options={
                "temperature": 0.2,
                "num_ctx": 8192,
            },
        )

        conversation.append(response.message)

        tool_calls = response.message.tool_calls or []

        if not tool_calls:
            answer = response.message.content.strip()
            if answer:
                return answer
            return "I couldn't create a response for that request."

        for tool_call in tool_calls:
            tool_name = tool_call.function.name
            arguments = tool_call.function.arguments or {}

            tool_function = AVAILABLE_TOOLS.get(tool_name)

            if tool_function is None:
                tool_result = {
                    "success": False,
                    "error": f"Unknown tool: {tool_name}",
                }
            else:
                try:
                    tool_result = tool_function(**arguments)
                except TypeError as error:
                    tool_result = {
                        "success": False,
                        "error": f"Invalid tool arguments: {error}",
                    }
                except Exception as error:
                    tool_result = {
                        "success": False,
                        "error": f"Tool failed: {error}",
                    }

            conversation.append(
                {
                    "role": "tool",
                    "name": tool_name,
                    "tool_name": tool_name,
                    "content": json.dumps(tool_result),
                }
            )

    return "I reached the tool-operation limit. Please try the request again."


# ============================================================
# OLLAMA STATE MANAGEMENT
# ============================================================

def get_model_status():
    try:
        models = ollama.list().get("models", [])
        for m in models:
            model_name = m.get("model", "")
            if MODEL in model_name or "qwen3.5:4b" in model_name:
                return "ready", None
        return "not_installed", "Model qwen3.5:4b is not pulled. Run 'ollama pull qwen3.5:4b'"
    except Exception as e:
        return "error", f"Ollama is offline. Ensure it is running: {e}"


def pull_model_in_background():
    global status, load_error
    status = "downloading"
    try:
        ollama.pull(MODEL)
        status = "ready"
        load_error = None
    except Exception as e:
        status = "error"
        load_error = str(e)


def start_pulling_thread():
    t = threading.Thread(target=pull_model_in_background)
    t.daemon = True
    t.start()


# ============================================================
# HTTP SERVER FOR PORTAL INTEGRATION
# ============================================================

class CompanionHTTPHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        global status, load_error
        # Dynamically verify Ollama status
        status, load_error = get_model_status()
        
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        response = {
            "status": status,
            "model": MODEL,
            "error": load_error
        }
        self.wfile.write(json.dumps(response).encode('utf-8'))

    def handle_download(self):
        global status
        if status in ["downloading", "ready"]:
            return {"success": False, "message": f"Cannot download. Status is: {status}"}
        start_pulling_thread()
        return {"success": True, "message": "Download started in background."}

    def handle_start(self):
        global status, load_error
        status, load_error = get_model_status()
        if status == "ready":
            return {"success": True, "message": "Model is ready."}
        elif status == "not_installed":
            start_pulling_thread()
            return {"success": True, "message": "Model not found. Pulling initiated."}
        else:
            return {"success": False, "message": f"Cannot start. Status: {status}. Error: {load_error}"}

    def do_POST(self):
        path = self.path
        if path == '/download':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            res = self.handle_download()
            self.wfile.write(json.dumps(res).encode('utf-8'))
            return
        elif path == '/start':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            res = self.handle_start()
            self.wfile.write(json.dumps(res).encode('utf-8'))
            return
        elif path in ['/stop', '/delete']:
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"success": True, "message": f"Operation {path} acknowledged."}).encode('utf-8'))
            return

        # Inference / generation request at '/'
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length) if content_length > 0 else b'{}'
            req_body = json.loads(post_data.decode('utf-8'))
        except Exception as e:
            self.send_response(400)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"error": f"Failed to parse JSON: {e}"}).encode('utf-8'))
            return

        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()

        global status, load_error
        status, load_error = get_model_status()
        if status != "ready":
            self.wfile.write(json.dumps({
                "error": f"Companion is not ready. Status: {status}. Error: {load_error}",
                "status": status
            }).encode('utf-8'))
            return

        try:
            prompt = req_body.get('prompt', '')
            history = req_body.get('history', [])
            response_text = ask_pecos_with_history(prompt, history)
            self.wfile.write(json.dumps({"text": response_text}).encode('utf-8'))
        except Exception as e:
            self.wfile.write(json.dumps({"error": f"Inference Error: {e}"}).encode('utf-8'))


# ============================================================
# TERMINAL TEST MODE
# ============================================================

def run_terminal_chat():
    print("PECOS is ready. Type 'exit' to close.\n")

    cli_conversation = [
        {
            "role": "system",
            "content": SYSTEM_PROMPT,
        }
    ]

    while True:
        try:
            user_message = input("Trey: ").strip()
        except (KeyboardInterrupt, EOFError):
            print("\nPECOS: Goodbye.")
            break

        if not user_message:
            continue

        if user_message.lower() in {"exit", "quit", "close"}:
            print("PECOS: Goodbye.")
            break

        cli_conversation.append({
            "role": "user",
            "content": user_message
        })

        try:
            maximum_tool_rounds = 6
            for _ in range(maximum_tool_rounds):
                response = chat(
                    model=MODEL,
                    messages=cli_conversation,
                    tools=TOOL_LIST,
                    options={
                        "temperature": 0.2,
                        "num_ctx": 8192,
                    },
                )

                cli_conversation.append(response.message)
                tool_calls = response.message.tool_calls or []

                if not tool_calls:
                    answer = response.message.content.strip()
                    if not answer:
                        answer = "I couldn't create a response for that request."
                    print(f"PECOS: {answer}\n")
                    break

                for tool_call in tool_calls:
                    tool_name = tool_call.function.name
                    arguments = tool_call.function.arguments or {}

                    tool_function = AVAILABLE_TOOLS.get(tool_name)

                    if tool_function is None:
                        tool_result = {"success": False, "error": f"Unknown tool: {tool_name}"}
                    else:
                        try:
                            tool_result = tool_function(**arguments)
                        except TypeError as error:
                            tool_result = {"success": False, "error": f"Invalid tool arguments: {error}"}
                        except Exception as error:
                            tool_result = {"success": False, "error": f"Tool failed: {error}"}

                    cli_conversation.append({
                        "role": "tool",
                        "name": tool_name,
                        "tool_name": tool_name,
                        "content": json.dumps(tool_result),
                    })
            else:
                print("PECOS: I reached the tool-operation limit. Please try the request again.\n")
        except Exception as error:
            print(f"PECOS: I encountered a local error: {error}\n")


if __name__ == "__main__":
    initialize_database()
    # Check if run with --cli, --terminal, or --interactive
    if any(arg in sys.argv for arg in ["--cli", "--terminal", "--interactive"]):
        status, load_error = get_model_status()
        if status != "ready":
            print(f"Warning: model status is {status}. Error details: {load_error}")
        run_terminal_chat()
    else:
        status, load_error = get_model_status()
        port = 5001
        if len(sys.argv) > 1:
            try:
                port = int(sys.argv[1])
            except ValueError:
                pass
        
        server_address = ('', port)
        httpd = HTTPServer(server_address, CompanionHTTPHandler)
        print(f"[Companion Server] Offline Companion LLM Service listening on port {port}...")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n[Companion Server] Shutting down...")
            httpd.server_close()
