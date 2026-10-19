import asyncio
import base64
import json
import os
import subprocess
import time
import requests
import websockets

SCREENSHOT_DIR = r"C:\Users\gmatr\.gemini\antigravity\scratch\wastewise-ai\screenshots"
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

async def capture_views():
    chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
    user_data = r"C:\Users\gmatr\AppData\Local\Temp\chrome_cdp_profile_ui_2"
    
    proc = subprocess.Popen([
        chrome_path,
        "--headless=new",
        "--remote-debugging-port=9224",
        f"--user-data-dir={user_data}",
        "--disable-gpu",
        "--window-size=1440,1080"
    ])
    
    try:
        # Wait for CDP
        for _ in range(25):
            try:
                r = requests.get("http://127.0.0.1:9224/json/version", timeout=1)
                if r.status_code == 200:
                    break
            except Exception:
                time.sleep(0.2)
        
        # Open fresh React app
        r = requests.put("http://127.0.0.1:9224/json/new?http://127.0.0.1:3000")
        page_info = r.json()
        ws_url = page_info["webSocketDebuggerUrl"]
        
        async with websockets.connect(ws_url) as ws:
            msg_id = 0
            
            async def send_cmd(method, params=None):
                nonlocal msg_id
                msg_id += 1
                curr_id = msg_id
                payload = {"id": curr_id, "method": method}
                if params:
                    payload["params"] = params
                await ws.send(json.dumps(payload))
                while True:
                    m = json.loads(await ws.recv())
                    if m.get("id") == curr_id:
                        return m.get("result", {})

            await send_cmd("Page.enable")
            await send_cmd("Runtime.enable")
            
            # 1. Capture Brand Intro immediately
            await asyncio.sleep(0.8)
            intro_shot = await send_cmd("Page.captureScreenshot", {"format": "png"})
            with open(os.path.join(SCREENSHOT_DIR, "01_brand_intro.png"), "wb") as f:
                f.write(base64.b64decode(intro_shot["data"]))
            print("Captured 01_brand_intro.png")
            
            # Wait for intro to finish and overview data to load
            await asyncio.sleep(2.5)
            
            # 2. Capture Overview View
            overview_shot = await send_cmd("Page.captureScreenshot", {"format": "png"})
            with open(os.path.join(SCREENSHOT_DIR, "02_overview.png"), "wb") as f:
                f.write(base64.b64decode(overview_shot["data"]))
            print("Captured 02_overview.png")
            
            # Helper to click a nav item by text
            async def click_nav(label):
                js = f"""
                (() => {{
                    const buttons = Array.from(document.querySelectorAll('nav button'));
                    const target = buttons.find(b => b.innerText.toLowerCase().includes('{label.lower()}'));
                    if (target) {{
                        target.click();
                        return true;
                    }}
                    return false;
                }})()
                """
                res = await send_cmd("Runtime.evaluate", {"expression": js})
                return res.get("result", {}).get("value")

            # 3. Demand Forecast
            await click_nav("Demand forecast")
            await asyncio.sleep(1.8)
            shot = await send_cmd("Page.captureScreenshot", {"format": "png"})
            with open(os.path.join(SCREENSHOT_DIR, "03_demand_forecast.png"), "wb") as f:
                f.write(base64.b64decode(shot["data"]))
            print("Captured 03_demand_forecast.png")
            
            # 4. Preparation Planner
            await click_nav("Preparation planner")
            await asyncio.sleep(1.8)
            shot = await send_cmd("Page.captureScreenshot", {"format": "png"})
            with open(os.path.join(SCREENSHOT_DIR, "04_prep_planner.png"), "wb") as f:
                f.write(base64.b64decode(shot["data"]))
            print("Captured 04_prep_planner.png")
            
            # 5. Waste-risk monitoring
            await click_nav("Waste-risk monitoring")
            await asyncio.sleep(1.8)
            shot = await send_cmd("Page.captureScreenshot", {"format": "png"})
            with open(os.path.join(SCREENSHOT_DIR, "05_waste_risk.png"), "wb") as f:
                f.write(base64.b64decode(shot["data"]))
            print("Captured 05_waste_risk.png")
            
            # 6. Performance & impact
            await click_nav("Performance & impact")
            await asyncio.sleep(1.8)
            shot = await send_cmd("Page.captureScreenshot", {"format": "png"})
            with open(os.path.join(SCREENSHOT_DIR, "06_performance.png"), "wb") as f:
                f.write(base64.b64decode(shot["data"]))
            print("Captured 06_performance.png")
            
            # 7. Data & model
            await click_nav("Data & model")
            await asyncio.sleep(1.8)
            shot = await send_cmd("Page.captureScreenshot", {"format": "png"})
            with open(os.path.join(SCREENSHOT_DIR, "07_data_model.png"), "wb") as f:
                f.write(base64.b64decode(shot["data"]))
            print("Captured 07_data_model.png")
            
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=3)
        except Exception:
            proc.kill()

if __name__ == "__main__":
    asyncio.run(capture_views())
