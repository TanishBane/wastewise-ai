import asyncio
import base64
import json
import subprocess
import time
import requests
import websockets

async def inspect_and_capture(url="http://localhost:8501", screenshot_path="rendered_overview.png", get_sidebar_html=True):
    chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
    user_data = r"C:\Users\gmatr\AppData\Local\Temp\chrome_cdp_profile"
    
    proc = subprocess.Popen([
        chrome_path,
        "--headless=new",
        "--remote-debugging-port=9222",
        f"--user-data-dir={user_data}",
        "--disable-gpu",
        "--window-size=1440,1300"
    ])
    
    try:
        # Wait for CDP
        for _ in range(25):
            try:
                r = requests.get("http://127.0.0.1:9222/json/version", timeout=1)
                if r.status_code == 200:
                    break
            except Exception:
                time.sleep(0.2)
        
        r = requests.put("http://127.0.0.1:9222/json/new?" + url)
        page_info = r.json()
        ws_url = page_info["webSocketDebuggerUrl"]
        
        async with websockets.connect(ws_url) as ws:
            await ws.send(json.dumps({"id": 1, "method": "Page.enable"}))
            await ws.recv()
            await ws.send(json.dumps({"id": 2, "method": "Runtime.enable"}))
            await ws.recv()
            
            # Wait for Streamlit rendering and Plotly charts
            await asyncio.sleep(6.5)
            
            if get_sidebar_html:
                js_eval = """
                (() => {
                    const group = document.querySelector('div[data-testid="stRadioGroup"]');
                    if (!group) return 'no radio group found';
                    const firstOption = group.firstElementChild;
                    return firstOption ? firstOption.outerHTML : 'no option';
                })()
                """
                await ws.send(json.dumps({
                    "id": 10,
                    "method": "Runtime.evaluate",
                    "params": {"expression": js_eval}
                }))
                while True:
                    m = json.loads(await ws.recv())
                    if m.get("id") == 10:
                        print("FIRST OPTION HTML:", m.get("result", {}).get("result", {}).get("value", ""))
                        break
            
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
                    with open(screenshot_path, "wb") as f:
                        f.write(img_data)
                    print(f"Captured {screenshot_path} ({len(img_data)} bytes)")
                    break
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=3)
        except Exception:
            proc.kill()

if __name__ == "__main__":
    asyncio.run(inspect_and_capture())
