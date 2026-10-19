import asyncio
import base64
import json
import subprocess
import time
import requests
import websockets

PAGES = [
    ("Demand forecast", "page_demand_forecast.png"),
    ("Preparation planner", "page_prep_planner.png"),
    ("Waste-risk monitoring", "page_waste_monitoring.png"),
    ("Performance & impact", "page_performance_impact.png"),
    ("Data & model", "page_data_model.png"),
]

async def capture_pages():
    chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
    user_data = r"C:\Users\gmatr\AppData\Local\Temp\chrome_cdp_profile_pages"
    
    proc = subprocess.Popen([
        chrome_path,
        "--headless=new",
        "--remote-debugging-port=9224",
        f"--user-data-dir={user_data}",
        "--disable-gpu",
        "--window-size=1440,1100"
    ])
    
    try:
        for _ in range(25):
            try:
                r = requests.get("http://127.0.0.1:9224/json/version", timeout=1)
                if r.status_code == 200:
                    break
            except Exception:
                time.sleep(0.2)
        
        r = requests.put("http://127.0.0.1:9224/json/new?http://localhost:8501")
        page_info = r.json()
        ws_url = page_info["webSocketDebuggerUrl"]
        
        async with websockets.connect(ws_url) as ws:
            await ws.send(json.dumps({"id": 1, "method": "Page.enable"}))
            await ws.recv()
            await ws.send(json.dumps({"id": 2, "method": "Runtime.enable"}))
            await ws.recv()
            
            # Initial load
            await asyncio.sleep(5)
            
            for page_name, output_path in PAGES:
                # Click radio option by text
                click_js = f"""
                (() => {{
                    const labels = Array.from(document.querySelectorAll('label[data-testid="stRadioOption"]'));
                    const target = labels.find(l => l.textContent.includes("{page_name}"));
                    if (target) {{
                        target.click();
                        return "clicked " + "{page_name}";
                    }}
                    return "not found";
                }})()
                """
                await ws.send(json.dumps({
                    "id": 100,
                    "method": "Runtime.evaluate",
                    "params": {"expression": click_js}
                }))
                click_res = json.loads(await ws.recv())
                print(f"Navigation to {page_name}:", click_res.get("result", {}).get("result", {}).get("value", ""))
                
                # Wait for Streamlit re-render
                await asyncio.sleep(4)
                
                # Capture screenshot
                await ws.send(json.dumps({
                    "id": 200,
                    "method": "Page.captureScreenshot",
                    "params": {"format": "png"}
                }))
                while True:
                    msg = await ws.recv()
                    data = json.loads(msg)
                    if data.get("id") == 200:
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
    asyncio.run(capture_pages())
