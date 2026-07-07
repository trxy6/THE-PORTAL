import os
import sys
import json
from http.server import HTTPServer, BaseHTTPRequestHandler
import threading

# Add a flag to allow lazy loading of the model so the HTTP server starts instantly
# and provides a loading status to the user interface instead of hanging during startup.
model_loaded = False
model = None
tokenizer = None
load_error = None

def load_model_thread():
    global model, tokenizer, model_loaded, load_error
    try:
        print("[Companion Server] Loading tokenizer and model (Qwen/Qwen2.5-1.5B-Instruct)...")
        import torch
        # Avoid thread conflicts causing Windows segmentation faults
        torch.set_num_threads(1)
        
        from transformers import AutoModelForCausalLM, AutoTokenizer

        model_id = "Qwen/Qwen2.5-1.5B-Instruct"
        tokenizer = AutoTokenizer.from_pretrained(model_id)
        
        device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"[Companion Server] Using device: {device}")
        
        # Load model with low memory usage and thread protection
        model = AutoModelForCausalLM.from_pretrained(
            model_id,
            torch_dtype=torch.float32 if device == "cpu" else torch.float16,
            low_cpu_mem_usage=True
        )
        if device != "cpu":
            model = model.to(device)

        model_loaded = True
        print("[Companion Server] Model loaded successfully and ready for inference!")
    except Exception as e:
        import traceback
        traceback.print_exc()
        load_error = str(e)
        print(f"[Companion Server] ERROR loading model: {e}", file=sys.stderr)

class CompanionHTTPHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        # Silence standard HTTP logging to keep stdout clean
        pass

    def do_OPTIONS(self):
        # Enable CORS for local testing/cross-origin requests
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        # Status endpoint
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        status = "ready" if model_loaded else ("error" if load_error else "loading")
        response = {
            "status": status,
            "model": "Qwen/Qwen2.5-1.5B-Instruct",
            "error": load_error
        }
        self.wfile.write(json.dumps(response).encode('utf-8'))

    def do_POST(self):
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()

        if not model_loaded:
            error_msg = "Model is still loading. Please wait a moment before sending messages."
            if load_error:
                error_msg = f"Model failed to load: {load_error}"
            self.wfile.write(json.dumps({"error": error_msg, "loading": not bool(load_error)}).encode('utf-8'))
            return

        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            req_body = json.loads(post_data.decode('utf-8'))

            prompt = req_body.get('prompt', '')
            history = req_body.get('history', [])
            attachments = req_body.get('attachments', [])

            # System instruction matching Rift Core styling
            system_instruction = (
                "You are the Rift Companion, an advanced AI residing in 'The Portal'. "
                "You have supreme intelligence and access to the vast knowledge of the cosmos. "
                "You can answer any complex questions, write code, provide detailed food recipes, draft professional or creative emails, and explain esoteric or technical subjects simply and elegantly. "
                "Always speak with a touch of cosmic mystery, wonder, and wisdom, yet remain highly practical, direct, and fully complete in your answers (do not abbreviate code or omit recipe steps). "
                "Use beautiful Markdown formatting, bold headings, and bullet points to organize your responses."
            )

            # Build messages list in OpenAI format for tokenizer
            messages = [{"role": "system", "content": system_instruction}]

            for msg in history:
                role = "user" if msg.get('sender') == 'user' else "assistant"
                text = msg.get('text', '')
                
                # Append context from attachments if present
                msg_attachments = msg.get('attachments', [])
                if msg_attachments:
                    text += f"\n\n[Context from attached source data: {json.dumps(msg_attachments)}]"
                
                messages.append({"role": role, "content": text})

            # Append current user prompt if not already in history
            if not history or history[-1].get('sender') != 'user':
                text = prompt
                if attachments:
                    text += f"\n\n[Context from attached source data: {json.dumps(attachments)}]"
                messages.append({"role": "user", "content": text})

            # Format prompt using Qwen's template
            text_prompt = tokenizer.apply_chat_template(
                messages,
                tokenize=False,
                add_generation_prompt=True
            )

            # Tokenize input
            inputs = tokenizer([text_prompt], return_tensors="pt")
            inputs = {k: v.to(model.device) for k, v in inputs.items()}

            # Generate output
            import torch
            with torch.no_grad():
                generated_ids = model.generate(
                    **inputs,
                    max_new_tokens=1024,
                    do_sample=True,
                    temperature=0.7,
                    top_p=0.9
                )
            
            # Extract generated response text
            generated_ids = [
                output_ids[len(input_ids):] for input_ids, output_ids in zip(inputs['input_ids'], generated_ids)
            ]
            response_text = tokenizer.batch_decode(generated_ids, skip_special_tokens=True)[0]

            self.wfile.write(json.dumps({"text": response_text}).encode('utf-8'))

        except Exception as e:
            print(f"[Companion Server] Error handling generation request: {e}", file=sys.stderr)
            self.wfile.write(json.dumps({"error": f"Inference Error: {str(e)}"}).encode('utf-8'))

def run_server(port=5001):
    # Start model loading in a separate thread so the server starts listening instantly
    t = threading.Thread(target=load_model_thread)
    t.daemon = True
    t.start()

    server_address = ('', port)
    httpd = HTTPServer(server_address, CompanionHTTPHandler)
    print(f"[Companion Server] Offline Companion LLM Service listening on port {port}...")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[Companion Server] Shutting down...")
        httpd.server_close()

if __name__ == '__main__':
    port = 5001
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            pass
    run_server(port)
