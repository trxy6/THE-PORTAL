import os
import sys
import json
from http.server import HTTPServer, BaseHTTPRequestHandler
import threading

# State machine for the local offline companion
# States: "not_installed", "downloading", "installed", "loading", "ready", "error"
status = "not_installed"
model_loaded = False
model = None
tokenizer = None
load_error = None

def is_model_downloaded():
    model_id = "Qwen/Qwen2.5-1.5B-Instruct"
    repo_folder = f"models--{model_id.replace('/', '--')}"
    try:
        from huggingface_hub import constants
        cache_dir = constants.HF_HUB_CACHE
    except Exception:
        cache_dir = os.path.expanduser("~/.cache/huggingface/hub")
        
    model_dir = os.path.join(cache_dir, repo_folder)
    
    if not os.path.exists(model_dir):
        return False
        
    snapshots_dir = os.path.join(model_dir, "snapshots")
    if not os.path.exists(snapshots_dir):
        return False
        
    try:
        snapshots = os.listdir(snapshots_dir)
        if not snapshots:
            return False
            
        for snapshot in snapshots:
            snapshot_path = os.path.join(snapshots_dir, snapshot)
            if os.path.isdir(snapshot_path):
                files = os.listdir(snapshot_path)
                # Check for weight files
                if any(f.endswith('.safetensors') or f.endswith('.bin') for f in files):
                    return True
    except Exception:
        pass
        
    return False

def load_model_in_background():
    global model, tokenizer, model_loaded, status, load_error
    try:
        print("[Companion Server] Loading tokenizer and model (Qwen/Qwen2.5-1.5B-Instruct)...")
        import torch
        # Avoid thread conflicts causing Windows segmentation faults
        torch.set_num_threads(1)
        
        from transformers import AutoModelForCausalLM, AutoTokenizer

        model_id = "Qwen/Qwen2.5-1.5B-Instruct"
        tokenizer = AutoTokenizer.from_pretrained(model_id, local_files_only=True)
        
        device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"[Companion Server] Using device: {device}")
        
        # Load model with low memory usage and thread protection
        model = AutoModelForCausalLM.from_pretrained(
            model_id,
            torch_dtype=torch.bfloat16 if device == "cpu" else torch.float16,
            low_cpu_mem_usage=True,
            local_files_only=True
        )
        if device != "cpu":
            model = model.to(device)

        model_loaded = True
        status = "ready"
        load_error = None
        print("[Companion Server] Model loaded successfully and ready for inference!")
    except Exception as e:
        import traceback
        traceback.print_exc()
        load_error = str(e)
        status = "error"
        model_loaded = False
        print(f"[Companion Server] ERROR loading model: {e}", file=sys.stderr)

def start_loading_thread():
    global status
    status = "loading"
    t = threading.Thread(target=load_model_in_background)
    t.daemon = True
    t.start()

def download_model_in_background():
    global status, load_error
    try:
        print("[Companion Server] Starting model download (Qwen/Qwen2.5-1.5B-Instruct)...")
        from huggingface_hub import snapshot_download
        snapshot_download(repo_id="Qwen/Qwen2.5-1.5B-Instruct")
        print("[Companion Server] Model download complete. Starting load...")
        load_model_in_background()
    except Exception as e:
        import traceback
        traceback.print_exc()
        load_error = str(e)
        status = "error"
        print(f"[Companion Server] ERROR downloading model: {e}", file=sys.stderr)

def start_downloading_thread():
    global status
    status = "downloading"
    t = threading.Thread(target=download_model_in_background)
    t.daemon = True
    t.start()

def unload_model():
    global model, tokenizer, model_loaded, status, load_error
    try:
        print("[Companion Server] Unloading model...")
        model = None
        tokenizer = None
        model_loaded = False
        
        import gc
        gc.collect()
        
        try:
            import torch
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
        except Exception:
            pass
            
        status = "installed"
        load_error = None
        print("[Companion Server] Model unloaded successfully.")
        return True
    except Exception as e:
        load_error = str(e)
        status = "error"
        print(f"[Companion Server] ERROR unloading model: {e}", file=sys.stderr)
        return False

def delete_model_files():
    global model, tokenizer, model_loaded, status, load_error
    try:
        # First unload from memory
        unload_model()
        
        print("[Companion Server] Deleting model files...")
        model_id = "Qwen/Qwen2.5-1.5B-Instruct"
        repo_folder = f"models--{model_id.replace('/', '--')}"
        
        try:
            from huggingface_hub import constants
            cache_dir = constants.HF_HUB_CACHE
        except Exception:
            cache_dir = os.path.expanduser("~/.cache/huggingface/hub")
            
        model_dir = os.path.join(cache_dir, repo_folder)
        if os.path.exists(model_dir):
            import shutil
            shutil.rmtree(model_dir)
            
        status = "not_installed"
        load_error = None
        print("[Companion Server] Model files deleted successfully.")
        return True
    except Exception as e:
        load_error = str(e)
        status = "error"
        print(f"[Companion Server] ERROR deleting model: {e}", file=sys.stderr)
        return False

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
        # Status endpoint at '/' or '/status'
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        response = {
            "status": status,
            "model": "Qwen/Qwen2.5-1.5B-Instruct",
            "error": load_error
        }
        self.wfile.write(json.dumps(response).encode('utf-8'))

    def handle_download(self):
        global status
        if status in ["downloading", "loading", "ready"]:
            return {"success": False, "message": f"Cannot download. Current status is: {status}"}
        
        start_downloading_thread()
        return {"success": True, "message": "Download started in background."}

    def handle_start(self):
        global status
        if status in ["ready", "loading", "downloading"]:
            return {"success": False, "message": f"Cannot start. Current status is: {status}"}
        if not is_model_downloaded():
            return {"success": False, "message": "Model not downloaded."}
            
        start_loading_thread()
        return {"success": True, "message": "Model loading started in background."}

    def handle_stop(self):
        global status
        if status != "ready" and status != "loading":
            return {"success": False, "message": f"Cannot stop. Model is not running (status: {status})"}
            
        success = unload_model()
        return {"success": success, "message": "Model stopped." if success else "Failed to stop model."}

    def handle_delete(self):
        success = delete_model_files()
        return {"success": success, "message": "Model deleted." if success else "Failed to delete model."}

    def do_POST(self):
        # Route to different functions based on the request path
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
        elif path == '/stop':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            res = self.handle_stop()
            self.wfile.write(json.dumps(res).encode('utf-8'))
            return
        elif path == '/delete':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            res = self.handle_delete()
            self.wfile.write(json.dumps(res).encode('utf-8'))
            return

        # Otherwise, this is a generation request
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length) if content_length > 0 else b'{}'
            req_body = json.loads(post_data.decode('utf-8'))
        except Exception as e:
            self.send_response(400)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"error": f"Failed to parse request JSON: {str(e)}"}).encode('utf-8'))
            return

        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()

        if status != "ready":
            error_msg = f"Model is not ready. Status: {status}"
            if load_error:
                error_msg = f"Model failed to load: {load_error}"
            self.wfile.write(json.dumps({
                "error": error_msg,
                "status": status,
                "loading": (status in ["downloading", "loading"])
            }).encode('utf-8'))
            return

        try:

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
            num_cores = max(1, os.cpu_count() // 2) if hasattr(os, 'cpu_count') else 4
            torch.set_num_threads(num_cores)
            with torch.no_grad():
                generated_ids = model.generate(
                    **inputs,
                    max_new_tokens=512,
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
    # Check status on startup and load model if available
    global status
    if is_model_downloaded():
        status = "installed"
        print("[Companion Server] Model found in local cache. Auto-loading in background...")
        start_loading_thread()
    else:
        status = "not_installed"
        print("[Companion Server] Model not found in local cache. Running in offline/uninstalled mode.")

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
