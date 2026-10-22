import asyncio
import base64
import json
import os
import shutil
import subprocess
import sys
import time
import requests
import websockets

sys.stdout.reconfigure(encoding="utf-8")

DEST_DIRS = [
    os.path.abspath(r"docs\screenshots"),
    os.path.abspath(r"C:\Users\gmatr\.gemini\antigravity\scratch\wastewise-ai\docs\screenshots"),
]

for d in DEST_DIRS:
    os.makedirs(d, exist_ok=True)

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
PORT = 8000
CDP_PORT = 9229
BASE_URL = f"http://127.0.0.1:{PORT}"

SCREENS = [
    ("home-desktop.png", "#home", 1440, 900, False),
    ("home-mobile.png", "#home", 390, 844, True),
    ("kitchen-overview.png", "#overview", 1440, 900, False),
    ("demand-forecast.png", "#demand-forecast", 1440, 900, False),
    ("preparation-planner.png", "#prep-planner", 1440, 900, False),
    ("surplus-rescue.png", "#waste-risk", 1440, 900, False),
    ("performance-impact.png", "#performance", 1440, 900, False),
    ("data-model.png", "#data-model", 1440, 900, False),
]

async def capture_all():
    print("Launching headless Chrome for docs screenshots...")
    user_data = os.path.abspath(r".cache\chrome_docs_profile")
    chrome_proc = subprocess.Popen([
        CHROME_PATH,
        "--headless=new",
        f"--remote-debugging-port={CDP_PORT}",
        f"--user-data-dir={user_data}",
        "--disable-gpu",
        "--window-size=1440,900"
    ])

    try:
        for _ in range(30):
            try:
                r = requests.get(f"http://127.0.0.1:{CDP_PORT}/json/version", timeout=1)
                if r.status_code == 200:
                    break
            except Exception:
                time.sleep(0.3)

        r = requests.put(f"http://127.0.0.1:{CDP_PORT}/json/new?{BASE_URL}/")
        page_info = r.json()
        ws_url = page_info["webSocketDebuggerUrl"]

        async with websockets.connect(ws_url) as ws:
            msg_id = 0
            async def cmd(method, params=None):
                nonlocal msg_id
                msg_id += 1
                curr_id = msg_id
                p = {"id": curr_id, "method": method}
                if params:
                    p["params"] = params
                await ws.send(json.dumps(p))
                while True:
                    m = json.loads(await ws.recv())
                    if m.get("id") == curr_id:
                        return m.get("result", {})

            await cmd("Page.enable")
            await cmd("Runtime.enable")
            await asyncio.sleep(1.0)

            async def eval_js(expr):
                res = await cmd("Runtime.evaluate", {"expression": expr})
                return res.get("result", {}).get("value")

            for filename, route, w, h, is_mobile in SCREENS:
                print(f"Capturing {filename} at {route} ({w}x{h})...")
                # Set viewport
                await cmd("Emulation.setDeviceMetricsOverride", {
                    "width": w,
                    "height": h,
                    "deviceScaleFactor": 1,
                    "mobile": is_mobile
                })
                await cmd("Emulation.setVisibleSize", {"width": w, "height": h})
                
                # Navigate
                await eval_js(f"window.location.hash = '{route}'; window.dispatchEvent(new HashChangeEvent('hashchange'));")
                await asyncio.sleep(1.6)

                # Capture screenshot
                shot = await cmd("Page.captureScreenshot", {"format": "png"})
                img_data = base64.b64decode(shot["data"])

                for dest_dir in DEST_DIRS:
                    file_path = os.path.join(dest_dir, filename)
                    with open(file_path, "wb") as f:
                        f.write(img_data)
                    print(f"  -> Saved {file_path} ({len(img_data):,} bytes)")

        print("\nAll 8 documentation screenshots captured successfully!")

    finally:
        chrome_proc.terminate()

if __name__ == "__main__":
    asyncio.run(capture_all())
