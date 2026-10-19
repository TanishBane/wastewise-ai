import asyncio
import base64
import json
import os
import subprocess
import time
import requests
import websockets

SCREENSHOT_DIR = r"C:\Users\gmatr\.gemini\antigravity\scratch\wastewise-ai\screenshots_step2"
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

async def verify_pages():
    chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
    user_data = r"C:\Users\gmatr\AppData\Local\Temp\chrome_cdp_profile_step2"
    
    proc = subprocess.Popen([
        chrome_path,
        "--headless=new",
        "--remote-debugging-port=9225",
        f"--user-data-dir={user_data}",
        "--disable-gpu",
        "--window-size=1440,1080"
    ])
    
    try:
        # Wait for CDP
        for _ in range(25):
            try:
                r = requests.get("http://127.0.0.1:9225/json/version", timeout=1)
                if r.status_code == 200:
                    break
            except Exception:
                time.sleep(0.2)
        
        # Open fresh page
        r = requests.put("http://127.0.0.1:9225/json/new?http://127.0.0.1:3000")
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
            
            # Wait for brand intro to auto-advance to overview
            await asyncio.sleep(2.8)
            
            # 1. Overview Page
            overview_shot = await send_cmd("Page.captureScreenshot", {"format": "png"})
            with open(os.path.join(SCREENSHOT_DIR, "01_overview.png"), "wb") as f:
                f.write(base64.b64decode(overview_shot["data"]))
            
            # Read values from Overview DOM
            js_extract = """
            (() => {
                const text = document.body.innerText;
                return {
                    has161: text.includes('161'),
                    has168: text.includes('168'),
                    has7: text.includes('7'),
                    has887: text.includes('887') || text.includes('₹887'),
                    hasHoldoutWape: text.includes('8.4%')
                };
            })()
            """
            dom_check = await send_cmd("Runtime.evaluate", {"expression": js_extract})
            overview_vals = dom_check.get("result", {}).get("value", {})
            print("OVERVIEW DOM VALUES CHECK:", overview_vals)

            # Helper to click nav item
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

            # 2. Demand Forecast
            await click_nav("Demand forecast")
            await asyncio.sleep(1.8)
            shot = await send_cmd("Page.captureScreenshot", {"format": "png"})
            with open(os.path.join(SCREENSHOT_DIR, "02_demand_forecast.png"), "wb") as f:
                f.write(base64.b64decode(shot["data"]))

            # 3. Preparation Planner
            await click_nav("Preparation planner")
            await asyncio.sleep(1.8)
            shot = await send_cmd("Page.captureScreenshot", {"format": "png"})
            with open(os.path.join(SCREENSHOT_DIR, "03_prep_planner.png"), "wb") as f:
                f.write(base64.b64decode(shot["data"]))

            # 4. Waste-risk Monitoring
            await click_nav("Waste-risk monitoring")
            await asyncio.sleep(1.8)
            shot = await send_cmd("Page.captureScreenshot", {"format": "png"})
            with open(os.path.join(SCREENSHOT_DIR, "04_waste_risk.png"), "wb") as f:
                f.write(base64.b64decode(shot["data"]))

            # 5. Performance & Impact
            await click_nav("Performance & impact")
            await asyncio.sleep(1.8)
            shot = await send_cmd("Page.captureScreenshot", {"format": "png"})
            with open(os.path.join(SCREENSHOT_DIR, "05_performance.png"), "wb") as f:
                f.write(base64.b64decode(shot["data"]))
            
            # Read Holdout WAPE on Performance page
            js_perf = """
            (() => {
                const text = document.body.innerText;
                return {
                    has8_4: text.includes('8.4%'),
                    has10_8: text.includes('10.8%'),
                    has48324: text.includes('48,324')
                };
            })()
            """
            perf_check = await send_cmd("Runtime.evaluate", {"expression": js_perf})
            print("PERFORMANCE DOM VALUES CHECK:", perf_check.get("result", {}).get("value", {}))

            # 6. Data & Model
            await click_nav("Data & model")
            await asyncio.sleep(1.8)
            shot = await send_cmd("Page.captureScreenshot", {"format": "png"})
            with open(os.path.join(SCREENSHOT_DIR, "06_data_model.png"), "wb") as f:
                f.write(base64.b64decode(shot["data"]))
            print("Captured all 6 pages into screenshots_step2/")

    finally:
        proc.terminate()
        try:
            proc.wait(timeout=3)
        except Exception:
            proc.kill()

if __name__ == "__main__":
    asyncio.run(verify_pages())
