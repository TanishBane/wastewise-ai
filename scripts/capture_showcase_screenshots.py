import asyncio
import base64
import json
import os
import shutil
import subprocess
import time
import requests
import websockets

TARGET_DIR_ASSETS = os.path.abspath("docs/assets/screenshots")
TARGET_DIR_DOCS = os.path.abspath("docs/screenshots")
TARGET_DIR_SHOWCASE = os.path.abspath("docs/assets/showcase")
os.makedirs(TARGET_DIR_ASSETS, exist_ok=True)
os.makedirs(TARGET_DIR_DOCS, exist_ok=True)
os.makedirs(TARGET_DIR_SHOWCASE, exist_ok=True)

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
USER_DATA = r"C:\Users\gmatr\AppData\Local\Temp\chrome_cdp_profile_showcase"

async def wait_for_view_ready(ws, min_wait=2.5, max_wait=10.0):
    await asyncio.sleep(min_wait)
    start = time.time()
    while time.time() - start < max_wait:
        check_js = """
        (() => {
            const text = document.body.innerText;
            const hasError = text.includes("We couldn't load this view") || text.includes("Failed to fetch") || text.includes("Cannot reach the WasteWise backend");
            const isLoading = document.querySelector('.animate-spin') !== null;
            return { hasError, isLoading, textLen: text.length };
        })()
        """
        await ws.send(json.dumps({
            "id": 50,
            "method": "Runtime.evaluate",
            "params": {"expression": check_js, "returnByValue": True}
        }))
        while True:
            msg = await ws.recv()
            data = json.loads(msg)
            if data.get("id") == 50:
                val = data.get("result", {}).get("result", {}).get("value", {})
                if not val.get("hasError") and not val.get("isLoading"):
                    print(f"  View content loaded cleanly ({val.get('textLen')} chars).")
                    return True
                if val.get("hasError"):
                    print("  Warning: Detected error state in view, waiting for resolution...")
                break
        await asyncio.sleep(0.5)
    return False

async def capture_item(ws, file_name, width=1440, height=900, device_scale=1):
    # Set viewport
    await ws.send(json.dumps({
        "id": 10,
        "method": "Emulation.setDeviceMetricsOverride",
        "params": {
            "width": width,
            "height": height,
            "deviceScaleFactor": device_scale,
            "mobile": width < 500
        }
    }))
    await ws.recv()
    await asyncio.sleep(0.5)

    # Capture
    await ws.send(json.dumps({
        "id": 20,
        "method": "Page.captureScreenshot",
        "params": {"format": "png"}
    }))
    
    while True:
        msg = await ws.recv()
        data = json.loads(msg)
        if data.get("id") == 20:
            raw_bytes = base64.b64decode(data["result"]["data"])
            path_assets = os.path.join(TARGET_DIR_ASSETS, file_name)
            path_docs = os.path.join(TARGET_DIR_DOCS, file_name)
            path_showcase = os.path.join(TARGET_DIR_SHOWCASE, file_name)
            with open(path_assets, "wb") as f:
                f.write(raw_bytes)
            with open(path_docs, "wb") as f:
                f.write(raw_bytes)
            with open(path_showcase, "wb") as f:
                f.write(raw_bytes)
            print(f"Captured {file_name}: {len(raw_bytes)} bytes")
            break

async def main():
    proc = subprocess.Popen([
        CHROME_PATH,
        "--headless=new",
        "--remote-debugging-port=9227",
        f"--user-data-dir={USER_DATA}",
        "--disable-gpu",
        "--window-size=1440,900"
    ])

    try:
        for _ in range(30):
            try:
                r = requests.get("http://127.0.0.1:9227/json/version", timeout=1)
                if r.status_code == 200:
                    break
            except Exception:
                time.sleep(0.2)

        r = requests.put("http://127.0.0.1:9227/json/new?http://localhost:4173")
        page_info = r.json()
        ws_url = page_info["webSocketDebuggerUrl"]

        async with websockets.connect(ws_url, max_size=25 * 1024 * 1024) as ws:
            await ws.send(json.dumps({"id": 1, "method": "Page.enable"}))
            await ws.recv()
            await ws.send(json.dumps({"id": 2, "method": "Runtime.enable"}))
            await ws.recv()

            # 1. Home Hero
            print("Capturing 1: home-hero.png...")
            await ws.send(json.dumps({
                "id": 3,
                "method": "Page.navigate",
                "params": {"url": "http://localhost:4173/#home"}
            }))
            await wait_for_view_ready(ws)
            await capture_item(ws, "home-hero.png", 1440, 900)
            shutil.copyfile(os.path.join(TARGET_DIR_SHOWCASE, "home-hero.png"), os.path.join(TARGET_DIR_SHOWCASE, "home-desktop.png"))

            # 2. Kitchen Overview
            print("Capturing 2: kitchen-overview.png...")
            await ws.send(json.dumps({
                "id": 4,
                "method": "Page.navigate",
                "params": {"url": "http://localhost:4173/#overview"}
            }))
            await wait_for_view_ready(ws)
            await capture_item(ws, "kitchen-overview.png", 1440, 900)

            # 3. Demand Forecast
            print("Capturing 3: demand-forecast.png...")
            await ws.send(json.dumps({
                "id": 5,
                "method": "Page.navigate",
                "params": {"url": "http://localhost:4173/#demand-forecast"}
            }))
            await wait_for_view_ready(ws)
            await capture_item(ws, "demand-forecast.png", 1440, 900)

            # 4. Preparation Planner
            print("Capturing 4: preparation-planner.png...")
            await ws.send(json.dumps({
                "id": 6,
                "method": "Page.navigate",
                "params": {"url": "http://localhost:4173/#prep-planner"}
            }))
            await wait_for_view_ready(ws)
            await capture_item(ws, "preparation-planner.png", 1440, 900)

            # 5. Surplus Rescue
            print("Capturing 5: surplus-rescue.png...")
            await ws.send(json.dumps({
                "id": 7,
                "method": "Page.navigate",
                "params": {"url": "http://localhost:4173/#waste-risk"}
            }))
            await wait_for_view_ready(ws)
            await capture_item(ws, "surplus-rescue.png", 1440, 900)

            # 6. Performance Impact
            print("Capturing 6: performance-impact.png...")
            await ws.send(json.dumps({
                "id": 8,
                "method": "Page.navigate",
                "params": {"url": "http://localhost:4173/#performance"}
            }))
            await wait_for_view_ready(ws)
            await capture_item(ws, "performance-impact.png", 1440, 900)

            # 7. Data Model
            print("Capturing 7: data-model.png...")
            await ws.send(json.dumps({
                "id": 9,
                "method": "Page.navigate",
                "params": {"url": "http://localhost:4173/#data-model"}
            }))
            await wait_for_view_ready(ws)
            await capture_item(ws, "data-model.png", 1440, 900)

            # 8. Bento Grid (scrolled view on home)
            print("Capturing 8: canteen-bento.png...")
            await ws.send(json.dumps({
                "id": 11,
                "method": "Page.navigate",
                "params": {"url": "http://localhost:4173/#home"}
            }))
            await wait_for_view_ready(ws)
            scroll_script = """
            (() => {
                const bento = document.querySelector('.bento-grid-botanical') || document.querySelector('.bento-grid-container');
                if (bento) {
                    bento.scrollIntoView({ behavior: 'instant', block: 'start' });
                    return "scrolled to bento";
                }
                window.scrollTo(0, 1900);
                return "scrolled 1900px";
            })()
            """
            await ws.send(json.dumps({
                "id": 12,
                "method": "Runtime.evaluate",
                "params": {"expression": scroll_script}
            }))
            await ws.recv()
            await asyncio.sleep(1.2)
            await capture_item(ws, "canteen-bento.png", 1440, 900)

            # 9. Quick Search Modal (open full width search dialog)
            print("Capturing 9: quick-search-modal.png...")
            open_search_script = """
            (() => {
                window.scrollTo(0, 0);
                const searchBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Search') || b.querySelector('svg.lucide-search'));
                if (searchBtn) {
                    searchBtn.click();
                    return "clicked search button";
                }
                window.dispatchEvent(new KeyboardEvent('keydown', { key: '/', bubbles: true }));
                return "dispatched slash";
            })()
            """
            await ws.send(json.dumps({
                "id": 13,
                "method": "Runtime.evaluate",
                "params": {"expression": open_search_script}
            }))
            await ws.recv()
            await asyncio.sleep(1.5)
            await capture_item(ws, "quick-search-modal.png", 1440, 900)

            # 10. Mobile Home Viewport (390x844)
            print("Capturing 10: mobile-home.png...")
            await ws.send(json.dumps({
                "id": 14,
                "method": "Page.navigate",
                "params": {"url": "http://localhost:4173/#home"}
            }))
            await wait_for_view_ready(ws)
            await capture_item(ws, "mobile-home.png", 390, 844)
            shutil.copyfile(os.path.join(TARGET_DIR_SHOWCASE, "mobile-home.png"), os.path.join(TARGET_DIR_SHOWCASE, "home-mobile.png"))

            print("All screenshots successfully captured with real live backend data!")

    finally:
        proc.terminate()
        try:
            proc.wait(timeout=3)
        except Exception:
            proc.kill()

if __name__ == "__main__":
    asyncio.run(main())
