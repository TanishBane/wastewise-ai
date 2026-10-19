import asyncio
import base64
import json
import subprocess
import time
import requests
import websockets

async def capture_scrolled(output_path="rendered_overview_scrolled.png"):
    chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
    user_data = r"C:\Users\gmatr\AppData\Local\Temp\chrome_cdp_profile_scroll"
    
    proc = subprocess.Popen([
        chrome_path,
        "--headless=new",
        "--remote-debugging-port=9223",
        f"--user-data-dir={user_data}",
        "--disable-gpu",
        "--window-size=1440,900"
    ])
    
    try:
        for _ in range(25):
            try:
                r = requests.get("http://127.0.0.1:9223/json/version", timeout=1)
                if r.status_code == 200:
                    break
            except Exception:
                time.sleep(0.2)
        
        r = requests.put("http://127.0.0.1:9223/json/new?http://localhost:8501")
        page_info = r.json()
        ws_url = page_info["webSocketDebuggerUrl"]
        
        async with websockets.connect(ws_url) as ws:
            await ws.send(json.dumps({"id": 1, "method": "Page.enable"}))
            await ws.recv()
            await ws.send(json.dumps({"id": 2, "method": "Runtime.enable"}))
            await ws.recv()
            
            await asyncio.sleep(6)
            
            # Scroll main container
            scroll_js = """
            (() => {
                const main = document.querySelector('section.main') || document.querySelector('[data-testid="stAppViewContainer"]');
                if (main) main.scrollTop = 480;
                window.scrollTo(0, 480);
            })()
            """
            await ws.send(json.dumps({
                "id": 15,
                "method": "Runtime.evaluate",
                "params": {"expression": scroll_js}
            }))
            await ws.recv()
            await asyncio.sleep(1)
            
            # Capture screenshot
            await ws.send(json.dumps({
                "id": 20,
                "method": "Page.captureScreenshot",
                "params": {"format": "png"}
            }))
            
            while True:
                msg = await ws.recv()
                data = json.loads(msg)
                if data.get("id") == 20:
                    img_data = base64.b64decode(data["result"]["data"])
                    with open(output_path, "wb") as f:
                        f.write(img_data)
                    print(f"Captured {output_path} ({len(img_data)} bytes)")
                    break
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=3)
        except Exception:
            proc.kill()

if __name__ == "__main__":
    asyncio.run(capture_scrolled())
