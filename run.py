import subprocess
import sys
import time
import webbrowser
import os

def install_dependencies():
    print("Checking and installing dependencies from requirements.txt...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("Dependencies verified and installed.")
    except Exception as e:
        print("Warning: Failed to auto-install dependencies via script:", e)
        print("Please run manually: pip install -r requirements.txt")

def start_server():
    print("Starting FinFlow web server...")
    
    import threading
    def open_browser():
        time.sleep(1.5)
        print("Opening app in browser: http://127.0.0.1:8000")
        webbrowser.open("http://127.0.0.1:8000")
        
    threading.Thread(target=open_browser, daemon=True).start()
    
    try:
        # Try running directly via uvicorn if installed in system python path
        import uvicorn
        uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
    except ImportError:
        # Fallback to subprocess call
        subprocess.run([sys.executable, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000", "--reload"])

if __name__ == "__main__":
    # Change CWD to script directory to ensure path references work correctly
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    install_dependencies()
    start_server()
