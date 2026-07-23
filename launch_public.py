# -*- coding: utf-8 -*-
"""
launch_public.py - Starts FinFlow with a public ngrok tunnel.
Anyone with the printed URL can access the app from anywhere.
"""

import subprocess
import sys
import time
import threading
import os

def install_deps():
    subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt", "-q"])

def start_server():
    """Start uvicorn in a subprocess bound to all interfaces."""
    proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "app.main:app",
         "--host", "0.0.0.0", "--port", "8000", "--reload"],
        cwd=os.path.dirname(os.path.abspath(__file__))
    )
    return proc

def open_tunnel():
    from pyngrok import ngrok

    # Give uvicorn a moment to start
    time.sleep(3)

    print("\n[*] Opening public tunnel via ngrok...")
    try:
        public_url = ngrok.connect(8000, "http")
        url_str = str(public_url)
        print("\n" + "="*60)
        print("[OK] FinFlow is now PUBLIC!")
        print("[LINK] Share this link:  " + url_str)
        print("="*60)
        print("\nAnyone with this link can access your FinFlow app.")
        print("Press CTRL+C to stop the server and close the tunnel.\n")
    except Exception as e:
        print("\n[WARNING] Could not open ngrok tunnel: " + str(e))
        print("The app is still running locally at http://127.0.0.1:8000")
        print("To share publicly, sign up at https://ngrok.com and run:")
        print("   ngrok authtoken <YOUR_TOKEN>")
        print("   ngrok http 8000")

if __name__ == "__main__":
    print("Installing dependencies...")
    install_deps()

    print("Starting FinFlow server...")
    server_proc = start_server()

    # Open tunnel in a thread so we can catch KeyboardInterrupt cleanly
    tunnel_thread = threading.Thread(target=open_tunnel, daemon=True)
    tunnel_thread.start()
    tunnel_thread.join()

    try:
        server_proc.wait()
    except KeyboardInterrupt:
        print("\nShutting down...")
        server_proc.terminate()
        from pyngrok import ngrok
        ngrok.kill()
        print("Goodbye!")
