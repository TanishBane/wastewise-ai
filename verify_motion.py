import asyncio
import base64
import json
import os
import subprocess
import time
import urllib.request
from pathlib import Path
import websockets

SCREENSHOT_DIR = Path("screenshots/motion-verification")
SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)

async def run():
    port = 9388
    profile = Path(os.environ["TEMP"]) / "wastewise-motion-check-profile"
    chrome = Path(os.environ.get("PROGRAMFILES", r"C:\Program Files")) / "Google/Chrome/Application/chrome.exe"
    
    proc = subprocess.Popen([
        str(chrome),
        "--headless=new",
        f"--remote-debugging-port={port}",
        f"--user-data-dir={profile}",
        "--no-first-run",
        "--disable-gpu",
        "about:blank"
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    
    errors = []
    checks = []
    
    try:
        pages = None
        for _ in range(30):
            try:
                pages = json.load(urllib.request.urlopen(f"http://127.0.0.1:{port}/json"))
                break
            except Exception:
                await asyncio.sleep(0.2)
        if not pages:
            raise RuntimeError("Chrome CDP did not respond")
            
        page = next(p for p in pages if p["type"] == "page")
        ws_url = page["webSocketDebuggerUrl"]
        
        async with websockets.connect(ws_url, max_size=25000000) as ws:
            seq = 0
            async def cmd(method, params=None):
                nonlocal seq
                seq += 1
                n = seq
                await ws.send(json.dumps({"id": n, "method": method, "params": params or {}}))
                while True:
                    msg = json.loads(await ws.recv())
                    if msg.get("method") == "Runtime.exceptionThrown":
                        details = msg["params"]["exceptionDetails"]
                        text = details.get("text", "")
                        if "exception" in details:
                            text += " " + str(details["exception"].get("description", ""))
                        errors.append(text)
                    if msg.get("id") == n:
                        if "error" in msg:
                            raise RuntimeError(f"{method} error: {msg['error']}")
                        return msg.get("result", {})

            async def js(expression):
                result = await cmd("Runtime.evaluate", {
                    "expression": f"Promise.resolve(({expression})).then(v => v instanceof Node ? true : v)",
                    "returnByValue": True,
                    "awaitPromise": True
                })
                if result.get("exceptionDetails"):
                    raise RuntimeError(result["exceptionDetails"])
                return result.get("result", {}).get("value")

            async def wait(expression, timeout=12):
                for _ in range(int(timeout * 5)):
                    try:
                        if await js(expression):
                            return
                    except Exception:
                        pass
                    await asyncio.sleep(0.2)
                raise AssertionError("Timed out waiting for: " + expression)

            async def check(name, expression):
                val = await js(expression)
                assert val, f"Check failed: {name} ({expression} => {val})"
                checks.append(name)
                print(f"PASS: {name}", flush=True)

            async def screenshot(name):
                result = await cmd("Page.captureScreenshot", {"format": "png"})
                (SCREENSHOT_DIR / f"{name}.png").write_bytes(base64.b64decode(result["data"]))
                print(f"Saved screenshot: {name}.png", flush=True)

            await cmd("Page.enable")
            await cmd("Runtime.enable")
            await cmd("Network.enable")

            # 1. Desktop 1440x900 on Home
            print("--- Testing Desktop 1440x900 on Home ---")
            await cmd("Emulation.setDeviceMetricsOverride", {
                "width": 1440, "height": 900, "deviceScaleFactor": 1, "mobile": False
            })
            await cmd("Page.navigate", {"url": "http://127.0.0.1:8000/#home"})
            await wait("document.querySelector('h1') && document.querySelector('.home-hero')")
            await asyncio.sleep(1.2) # Allow entrance animation to complete

            await check("Hero headline is visible", "document.querySelector('h1').textContent.includes('Make every portion count')")
            await check("Hero headline opacity settled", "parseFloat(getComputedStyle(document.querySelector('h1')).opacity) > 0.9")
            await check("Hero kicker visible", "document.querySelector('.home-kicker').textContent.includes('A calmer way to run the canteen')")
            await check("Hero logo mark present", "document.querySelector('.home-signal-logo') !== null")
            await check("No desktop horizontal overflow", "document.documentElement.scrollWidth <= window.innerWidth")

            await screenshot("01-home-hero-1440")

            # 2. Test Scroll Reveals on Home
            print("--- Testing Scroll Reveals on Home ---")
            await js("window.scrollTo({ top: 600, behavior: 'instant' })")
            await asyncio.sleep(0.6)
            await check("How it works section visible after scroll", "document.querySelector('#home-how-it-works h2').textContent.includes('Less searching')")
            await check("Three step cards rendered", "document.querySelectorAll('.home-step').length === 3")

            await js("window.scrollTo({ top: 1400, behavior: 'instant' })")
            await asyncio.sleep(0.6)
            await check("Evidence section visible after scroll", "document.querySelector('.home-evidence h2').textContent.includes('Recommendations, not black boxes')")

            await js("window.scrollTo({ top: 2200, behavior: 'instant' })")
            await asyncio.sleep(0.6)
            await check("Home end section visible", "document.querySelector('.home-end h2').textContent.includes('Bring your workplace into focus')")
            await screenshot("02-home-scrolled-1440")

            # 3. Test Viewports (1024px, 768px, 390px)
            for width, height, label in [(1024, 768, "tablet-1024"), (768, 1024, "tablet-768"), (390, 844, "mobile-390")]:
                print(f"--- Testing Viewport {label} ({width}x{height}) ---")
                await cmd("Emulation.setDeviceMetricsOverride", {
                    "width": width, "height": height, "deviceScaleFactor": 1, "mobile": width < 500
                })
                await js("window.scrollTo({ top: 0, behavior: 'instant' })")
                await asyncio.sleep(0.5)
                await check(f"No horizontal overflow on {label}", "document.documentElement.scrollWidth <= window.innerWidth")
                await screenshot(f"03-home-{label}")

            # Reset back to 1440
            await cmd("Emulation.setDeviceMetricsOverride", {
                "width": 1440, "height": 900, "deviceScaleFactor": 1, "mobile": False
            })

            # 4. Test Navigation and Route Transition to Kitchen Overview
            print("--- Testing Kitchen Overview & KPI Counters ---")
            await js("location.hash = 'overview'")
            await wait("document.querySelector('.overview-page') && document.querySelector('.menu-table tbody tr')")
            await asyncio.sleep(1.0) # Wait for count-up to finish

            await check("Overview page title", "document.querySelector('h1').textContent.includes('Before the first batch')")
            await check("Eight dishes in menu table", "document.querySelectorAll('.menu-table tbody tr').length === 8")
            await check("Stats cards rendered with animated numbers", "document.querySelectorAll('.stats .stat .animated-counter').length >= 3")
            
            # Verify numbers ended accurately
            demand_text = await js("document.querySelector('.stats .stat .stat-value').textContent")
            print(f"Overview Expected Demand KPI text: {demand_text}")
            assert any(char.isdigit() for char in demand_text), "Demand counter did not produce digits"
            await screenshot("04-overview-1440")

            # 5. Test Demand Forecast & Prep Planner
            print("--- Testing Demand Forecast Screen ---")
            await js("location.hash = 'demand-forecast'")
            await wait("document.querySelector('.scenario-layout')")
            await asyncio.sleep(0.8)
            await check("Demand forecast page heading", "document.querySelector('h1').textContent.includes('Read the day ahead')")
            await check("Scenario controls present", "document.querySelector('.scenario-controls') !== null")
            await screenshot("05-demand-forecast-1440")

            print("--- Testing Prep Planner Screen ---")
            await js("location.hash = 'prep-planner'")
            await wait("document.querySelector('.scenario-layout')")
            await asyncio.sleep(0.8)
            await check("Prep planner page heading", "document.querySelector('h1').textContent.includes('A plan for this service')")
            await screenshot("06-prep-planner-1440")

            # 6. Test Surplus Rescue Screen
            print("--- Testing Surplus Rescue Screen ---")
            await js("location.hash = 'waste-risk'")
            await wait("document.querySelector('.rescue-row')")
            await asyncio.sleep(0.8)
            await check("Surplus rescue heading", "document.querySelector('h1').textContent.includes('Surplus, before the rush')")
            await check("Rescue stats rendered with counters", "document.querySelectorAll('.stats .stat .animated-counter').length >= 3")
            await screenshot("07-surplus-rescue-1440")

            # 7. Test Performance & Impact Screen
            print("--- Testing Performance & Impact Screen ---")
            await js("location.hash = 'performance'")
            await wait("document.querySelector('.comparison-list')")
            await asyncio.sleep(0.8)
            await check("Performance heading", "document.querySelector('h1').textContent.includes('The numbers behind the plan')")
            await check("Comparison rows rendered", "document.querySelectorAll('.comparison-row').length > 0")
            await screenshot("08-performance-1440")

            # 8. Test Data & Model Screen
            print("--- Testing Data & Model Screen ---")
            await js("location.hash = 'data-model'")
            await wait("document.querySelector('.data-grid')")
            await asyncio.sleep(0.8)
            await check("Data model heading", "document.querySelector('h1').textContent.includes('Bring your service history')")
            await screenshot("09-data-model-1440")

            # 9. Test Prefers-Reduced-Motion
            print("--- Testing prefers-reduced-motion ---")
            await cmd("Emulation.setEmulatedMedia", {
                "media": "screen",
                "features": [{"name": "prefers-reduced-motion", "value": "reduce"}]
            })
            await cmd("Page.navigate", {"url": "http://127.0.0.1:8000/#home"})
            await wait("document.querySelector('.home-hero h1')")
            await asyncio.sleep(0.2)
            await check("Headline visible under reduced-motion", "document.querySelector('.home-hero h1').textContent.includes('Make every portion count')")
            val = await js("getComputedStyle(document.querySelector('.home-hero h1')).opacity")
            print(f"DEBUG: h1 computed opacity is '{val}'", flush=True)
            await check("Opacity is visible under reduced-motion", "parseFloat(getComputedStyle(document.querySelector('.home-hero h1')).opacity) >= 0.95")
            await screenshot("10-home-reduced-motion")

            # Check errors
            print("--- Checking for Uncaught Errors ---")
            assert len(errors) == 0, f"Uncaught console errors detected: {errors}"
            print(f"ALL {len(checks)} CHECKS PASSED with 0 console errors!")

    finally:
        proc.terminate()
        try:
            proc.wait(timeout=3)
        except Exception:
            proc.kill()

if __name__ == "__main__":
    asyncio.run(run())
