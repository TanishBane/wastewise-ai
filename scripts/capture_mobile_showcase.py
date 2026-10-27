import asyncio
import base64
import json
import os
import subprocess
import requests
import websockets

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
USER_DATA = r"C:\Users\gmatr\AppData\Local\Temp\chrome_cdp_mobile_showcase_fixed"
OUTPUT_DIR = r"c:\Users\gmatr\.gemini\antigravity\scratch\wastewise-ai\docs\assets\showcase"

async def capture_screen(ws, req_id, file_name):
    await ws.send(json.dumps({
        "id": req_id,
        "method": "Page.captureScreenshot",
        "params": {"format": "png"}
    }))
    while True:
        msg = await ws.recv()
        data = json.loads(msg)
        if data.get("id") == req_id:
            raw_bytes = base64.b64decode(data["result"]["data"])
            out_path = os.path.join(OUTPUT_DIR, file_name)
            with open(out_path, "wb") as f:
                f.write(raw_bytes)
            print(f"Captured {file_name}: {len(raw_bytes)} bytes")
            break

async def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    proc = subprocess.Popen([
        CHROME_PATH,
        "--headless=new",
        "--remote-debugging-port=9232",
        f"--user-data-dir={USER_DATA}",
        "--disable-gpu",
        "--window-size=390,844"
    ])
    await asyncio.sleep(2.0)

    try:
        r = requests.put("http://127.0.0.1:9232/json/new?http://localhost:4173")
        ws_url = r.json()["webSocketDebuggerUrl"]

        async with websockets.connect(ws_url, max_size=25 * 1024 * 1024) as ws:
            await ws.send(json.dumps({"id": 1, "method": "Page.enable"}))
            await ws.recv()
            await ws.send(json.dumps({
                "id": 2,
                "method": "Emulation.setDeviceMetricsOverride",
                "params": {"width": 390, "height": 844, "deviceScaleFactor": 2, "mobile": True}
            }))
            await ws.recv()

            targets = [
                ("#home", "mobile-home.png", None),
                ("#overview", "mobile-overview.png", None),
                ("#prep-planner", "mobile-prep-planner.png", None),
                ("#waste-risk", "mobile-rescue.png", None),
                ("#overview", "mobile-drawer.png", "document.querySelector('.mobile-menu-trigger')?.click()"),
            ]

            req_counter = 100
            for route, filename, action_js in targets:
                req_counter += 1
                await ws.send(json.dumps({
                    "id": req_counter,
                    "method": "Page.navigate",
                    "params": {"url": f"http://localhost:4173/{route}"}
                }))
                await asyncio.sleep(2.5)

                if action_js:
                    req_counter += 1
                    await ws.send(json.dumps({
                        "id": req_counter,
                        "method": "Runtime.evaluate",
                        "params": {"expression": action_js}
                    }))
                    await asyncio.sleep(0.8)

                req_counter += 1
                await capture_screen(ws, req_counter, filename)

    finally:
        proc.terminate()
        try:
            proc.wait(timeout=3)
        except Exception:
            proc.kill()

if __name__ == "__main__":
    asyncio.run(main())
