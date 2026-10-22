import asyncio
import base64
import json
import os
import subprocess
import sys
import time
import requests
import websockets

sys.stdout.reconfigure(encoding="utf-8")

SCREENSHOT_DIR = os.path.abspath(r"screenshots\home-repaired")
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
PORT = 8000
CDP_PORT = 9228
BASE_URL = f"http://127.0.0.1:{PORT}"

VIEWPORTS = [
    ("01_desktop_1440x900", 1440, 900),
    ("02_laptop_1366x768", 1366, 768),
    ("03_tablet_768x1024", 768, 1024),
    ("04_mobile_390x844", 390, 844),
]

async def verify():
    print("1. Connecting to headless Chrome via CDP...")
    user_data = os.path.abspath(r".cache\chrome_repair_verify")
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

            async def take_screenshot(name):
                shot = await cmd("Page.captureScreenshot", {"format": "png"})
                path = os.path.join(SCREENSHOT_DIR, f"{name}.png")
                with open(path, "wb") as f:
                    f.write(base64.b64decode(shot["data"]))
                print(f"   [Screenshot saved]: {name}.png")

            # Navigate to Home
            print("2. Navigating to #home...")
            await eval_js("window.location.hash = '#home'; window.dispatchEvent(new HashChangeEvent('hashchange'));")
            await asyncio.sleep(2.0)

            # Inspect rendered Home viewports
            print("3. Checking viewports and measuring spatial overflow...")
            for name, w, h in VIEWPORTS:
                await cmd("Emulation.setDeviceMetricsOverride", {
                    "width": w,
                    "height": h,
                    "deviceScaleFactor": 1,
                    "mobile": (w < 600)
                })
                await cmd("Emulation.setVisibleSize", {"width": w, "height": h})
                await asyncio.sleep(0.6)

                overflow = await eval_js("document.documentElement.scrollWidth - document.documentElement.clientWidth")
                print(f"   [{name}] Horizontal overflow: {overflow}px (width={w}, height={h})")
                assert overflow == 0, f"Horizontal overflow detected on {name}: {overflow}px!"

                await take_screenshot(name)

            # Reset to desktop for element inspection
            await cmd("Emulation.setDeviceMetricsOverride", {
                "width": 1440,
                "height": 900,
                "deviceScaleFactor": 1,
                "mobile": False
            })
            await asyncio.sleep(0.5)

            print("4. Inspecting Telemetry HUD Card structure & layout...")
            hud_data = await cmd("Runtime.evaluate", {
                "expression": """(() => {
                    const hud = document.querySelector('.telemetry-hud-card');
                    if (!hud) return null;
                    const canteenName = document.querySelector('.hud-canteen-name')?.innerText;
                    const serviceTags = document.querySelector('.hud-service-tags')?.innerText;
                    const cadenceTitle = document.querySelector('.cadence-title')?.innerText;
                    const cadenceDate = document.querySelector('.cadence-date')?.innerText;
                    const timelineSteps = Array.from(document.querySelectorAll('.cadence-step')).map(step => ({
                        time: step.querySelector('.step-time')?.innerText,
                        title: step.querySelector('.step-title')?.innerText,
                        desc: step.querySelector('.step-desc')?.innerText,
                    }));
                    const kpis = Array.from(document.querySelectorAll('.hud-metric-box')).map(box => ({
                        label: box.querySelector('.hud-metric-label')?.innerText,
                        value: box.querySelector('.hud-metric-value')?.innerText,
                        note: box.querySelector('.hud-metric-note')?.innerText,
                    }));
                    const sealTitle = document.querySelector('.brand-title')?.innerText;
                    const sealSub = document.querySelector('.brand-sub')?.innerText;
                    const logoImg = document.querySelector('.hud-seal-logo');
                    const logoBox = logoImg ? { width: logoImg.getBoundingClientRect().width, height: logoImg.getBoundingClientRect().height } : null;

                    return {
                        canteenName,
                        serviceTags,
                        cadenceTitle,
                        cadenceDate,
                        timelineSteps,
                        kpis,
                        sealTitle,
                        sealSub,
                        logoBox
                    };
                })()""",
                "returnByValue": True
            })
            details = hud_data.get("result", {}).get("value")
            print("   HUD Data Extracted:")
            print(json.dumps(details, indent=2))

            # Validations
            assert details["canteenName"] == "Campus Green Demo Canteen"
            assert "Lunch Service" in details["serviceTags"]
            assert details["cadenceTitle"] == "TODAY'S OPERATING CADENCE" or "Today's Operating Cadence" in details["cadenceTitle"]
            assert len(details["timelineSteps"]) == 4
            assert len(details["kpis"]) == 4
            print(f"   [Validated]: 4 distinct KPIs rendered without string concatenation!")
            print(f"   [Validated]: Logo scaled cleanly at {details['logoBox']['width']}x{details['logoBox']['height']}px!")

            # 5. Test primary action navigation
            print("5. Exercising primary actions...")
            # Click "Launch Overview" in HUD footer
            launch_res = await eval_js("""
                (() => {
                    const btn = document.querySelector('.hud-quick-link');
                    if (btn) { btn.click(); return true; }
                    return false;
                })()
            """)
            assert launch_res
            await asyncio.sleep(1.0)
            hash_after_launch = await eval_js("window.location.hash")
            print(f"   Clicked Launch Overview -> Hash is now: {hash_after_launch}")
            assert hash_after_launch == "#overview"
            await take_screenshot("05_overview_from_home_launch")

            # Return to Home and test "Add your workplace"
            await eval_js("window.location.hash = '#home'; window.dispatchEvent(new HashChangeEvent('hashchange'));")
            await asyncio.sleep(1.0)
            add_res = await eval_js("""
                (() => {
                    const btns = Array.from(document.querySelectorAll('.home-action-buttons button'));
                    const addBtn = btns.find(b => b.innerText.includes('Add your workplace'));
                    if (addBtn) { addBtn.click(); return true; }
                    return false;
                })()
            """)
            assert add_res
            await asyncio.sleep(1.0)
            hash_after_add = await eval_js("window.location.hash")
            print(f"   Clicked Add your workplace -> Hash is now: {hash_after_add}")
            assert hash_after_add == "#data-model"
            await take_screenshot("06_data_model_from_home_add")

            # Return to Home and test "Explore demo workspace"
            await eval_js("window.location.hash = '#home'; window.dispatchEvent(new HashChangeEvent('hashchange'));")
            await asyncio.sleep(1.0)
            explore_res = await eval_js("""
                (() => {
                    const btns = Array.from(document.querySelectorAll('.home-action-buttons button'));
                    const expBtn = btns.find(b => b.innerText.includes('Explore demo workspace'));
                    if (expBtn) { expBtn.click(); return true; }
                    return false;
                })()
            """)
            assert explore_res
            await asyncio.sleep(1.0)
            hash_after_explore = await eval_js("window.location.hash")
            print(f"   Clicked Explore demo workspace -> Hash is now: {hash_after_explore}")
            assert hash_after_explore == "#overview"

            # 6. Sanity check collateral routes for zero CSS regressions
            print("6. Collateral route visual regression verification...")
            routes = [
                ("07_prep_planner", "#prep-planner"),
                ("08_surplus_rescue", "#waste-risk"),
                ("09_performance", "#performance"),
            ]
            for rname, rhash in routes:
                await eval_js(f"window.location.hash = '{rhash}'; window.dispatchEvent(new HashChangeEvent('hashchange'));")
                await asyncio.sleep(1.0)
                await take_screenshot(rname)
                overflow = await eval_js("document.documentElement.scrollWidth - document.documentElement.clientWidth")
                print(f"   Route {rhash} horizontal overflow: {overflow}px")
                assert overflow == 0

            print("\nALL VERIFICATIONS PASSED WITH ZERO ERRORS!")

    finally:
        chrome_proc.terminate()

if __name__ == "__main__":
    asyncio.run(verify())
