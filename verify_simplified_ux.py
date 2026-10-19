import asyncio
import base64
import json
import os
import subprocess
import time
import requests
import websockets

SCREENSHOT_DIR = r"C:\Users\gmatr\.gemini\antigravity\scratch\wastewise-ai\screenshots_ux_refactor"
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

async def verify_ux_simplification():
    chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
    user_data = r"C:\Users\gmatr\AppData\Local\Temp\chrome_cdp_profile_ux"
    
    proc = subprocess.Popen([
        chrome_path,
        "--headless=new",
        "--remote-debugging-port=9227",
        f"--user-data-dir={user_data}",
        "--disable-gpu",
        "--window-size=1440,1080"
    ])
    
    try:
        # Wait for CDP
        for _ in range(25):
            try:
                r = requests.get("http://127.0.0.1:9227/json/version", timeout=1)
                if r.status_code == 200:
                    break
            except Exception:
                time.sleep(0.2)
        
        # Open fresh page
        r = requests.put("http://127.0.0.1:9227/json/new?http://127.0.0.1:3000#overview")
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
            
            # Wait for brand intro to auto-advance
            await asyncio.sleep(2.8)
            
            # 1. Desktop 1440px - Overview with simplified TopBar and Contextual PageHeader
            shot = await send_cmd("Page.captureScreenshot", {"format": "png"})
            with open(os.path.join(SCREENSHOT_DIR, "01_overview_desktop_clean_topbar.png"), "wb") as f:
                f.write(base64.b64decode(shot["data"]))
            print("[1. OVERVIEW CAPTURED]")

            # 2. Test Sidebar Collapse toggle
            await send_cmd("Runtime.evaluate", {
                "expression": "document.querySelector('button[title*=\"Collapse sidebar\"]')?.click()"
            })
            await asyncio.sleep(0.5)
            shot = await send_cmd("Page.captureScreenshot", {"format": "png"})
            with open(os.path.join(SCREENSHOT_DIR, "02_sidebar_collapsed_desktop.png"), "wb") as f:
                f.write(base64.b64decode(shot["data"]))
            print("[2. SIDEBAR COLLAPSED CAPTURED]")

            # Expand sidebar back
            await send_cmd("Runtime.evaluate", {
                "expression": "document.querySelector('button[title*=\"Expand sidebar\"]')?.click()"
            })
            await asyncio.sleep(0.5)

            # 3. Open Utility Menu
            await send_cmd("Runtime.evaluate", {
                "expression": "document.querySelector('button[aria-label*=\"utilities\"]')?.click()"
            })
            await asyncio.sleep(0.5)
            shot = await send_cmd("Page.captureScreenshot", {"format": "png"})
            with open(os.path.join(SCREENSHOT_DIR, "03_utility_menu_dropdown.png"), "wb") as f:
                f.write(base64.b64decode(shot["data"]))
            print("[3. UTILITY MENU DROPDOWN CAPTURED]")

            # Close menu by clicking outside or pressing Escape
            await send_cmd("Input.dispatchKeyEvent", {"type": "keyDown", "key": "Escape"})
            await asyncio.sleep(0.3)

            # 4. Open Keyboard Shortcuts Modal
            await send_cmd("Input.dispatchKeyEvent", {"type": "keyDown", "key": "?"})
            await asyncio.sleep(0.5)
            shot = await send_cmd("Page.captureScreenshot", {"format": "png"})
            with open(os.path.join(SCREENSHOT_DIR, "04_keyboard_shortcuts_modal.png"), "wb") as f:
                f.write(base64.b64decode(shot["data"]))
            print("[4. KEYBOARD SHORTCUTS MODAL CAPTURED]")

            # Close modal by clicking the close button or Escape
            await send_cmd("Runtime.evaluate", {
                "expression": "document.querySelector('button[aria-label=\"Close shortcuts\"]')?.click()"
            })
            await asyncio.sleep(0.4)

            # 5. Navigate to Privacy Policy
            await send_cmd("Runtime.evaluate", {"expression": "window.location.hash = 'privacy'"})
            await asyncio.sleep(1.0)
            shot = await send_cmd("Page.captureScreenshot", {"format": "png"})
            with open(os.path.join(SCREENSHOT_DIR, "05_privacy_policy_page.png"), "wb") as f:
                f.write(base64.b64decode(shot["data"]))
            print("[5. PRIVACY POLICY VIEW CAPTURED]")

            # 6. Navigate to Terms of Use
            await send_cmd("Runtime.evaluate", {"expression": "window.location.hash = 'terms'"})
            await asyncio.sleep(1.0)
            shot = await send_cmd("Page.captureScreenshot", {"format": "png"})
            with open(os.path.join(SCREENSHOT_DIR, "06_terms_of_use_page.png"), "wb") as f:
                f.write(base64.b64decode(shot["data"]))
            print("[6. TERMS OF USE VIEW CAPTURED]")

            # 7. Navigate to AI & Data Transparency
            await send_cmd("Runtime.evaluate", {"expression": "window.location.hash = 'transparency'"})
            await asyncio.sleep(1.0)
            shot = await send_cmd("Page.captureScreenshot", {"format": "png"})
            with open(os.path.join(SCREENSHOT_DIR, "07_ai_transparency_page.png"), "wb") as f:
                f.write(base64.b64decode(shot["data"]))
            print("[7. AI TRANSPARENCY VIEW CAPTURED]")

            # 8. Navigate to Help Center & Playbook
            await send_cmd("Runtime.evaluate", {"expression": "window.location.hash = 'help'"})
            await asyncio.sleep(1.0)
            shot = await send_cmd("Page.captureScreenshot", {"format": "png"})
            with open(os.path.join(SCREENSHOT_DIR, "08_help_center_playbook_page.png"), "wb") as f:
                f.write(base64.b64decode(shot["data"]))
            print("[8. HELP CENTER PLAYBOOK VIEW CAPTURED]")

            # 9. Navigate to Preparation Planner and verify Advanced Settings panel
            await send_cmd("Runtime.evaluate", {"expression": "window.location.hash = 'prep-planner'"})
            await asyncio.sleep(1.5)
            shot = await send_cmd("Page.captureScreenshot", {"format": "png"})
            with open(os.path.join(SCREENSHOT_DIR, "09_prep_planner_simplified.png"), "wb") as f:
                f.write(base64.b64decode(shot["data"]))
            print("[9. PREP PLANNER SIMPLIFIED CAPTURED]")

            # Expand advanced planning settings
            await send_cmd("Runtime.evaluate", {
                "expression": "document.querySelector('button[aria-expanded]')?.click()"
            })
            await asyncio.sleep(0.5)
            shot = await send_cmd("Page.captureScreenshot", {"format": "png"})
            with open(os.path.join(SCREENSHOT_DIR, "10_prep_planner_advanced_expanded.png"), "wb") as f:
                f.write(base64.b64decode(shot["data"]))
            print("[10. PREP PLANNER ADVANCED EXPANDED CAPTURED]")

            # 11. Tablet 768px Viewport
            await send_cmd("Runtime.evaluate", {"expression": "window.location.hash = 'overview'"})
            await asyncio.sleep(1.0)
            await send_cmd("Emulation.setDeviceMetricsOverride", {
                "width": 768,
                "height": 1024,
                "deviceScaleFactor": 1,
                "mobile": False
            })
            await asyncio.sleep(0.8)
            shot = await send_cmd("Page.captureScreenshot", {"format": "png"})
            with open(os.path.join(SCREENSHOT_DIR, "11_tablet_768px.png"), "wb") as f:
                f.write(base64.b64decode(shot["data"]))
            print("[11. TABLET 768px CAPTURED]")

            # 12. Mobile 390px Viewport
            await send_cmd("Emulation.setDeviceMetricsOverride", {
                "width": 390,
                "height": 844,
                "deviceScaleFactor": 2,
                "mobile": True
            })
            await asyncio.sleep(0.8)
            shot = await send_cmd("Page.captureScreenshot", {"format": "png"})
            with open(os.path.join(SCREENSHOT_DIR, "12_mobile_390px.png"), "wb") as f:
                f.write(base64.b64decode(shot["data"]))
            print("[12. MOBILE 390px CAPTURED]")

            print("\n>>> ALL 12 UX REFACTOR SCREENSHOTS CAPTURED SUCCESSFULLY! <<<")

    finally:
        proc.terminate()
        try:
            proc.wait(timeout=3)
        except Exception:
            proc.kill()

if __name__ == "__main__":
    asyncio.run(verify_ux_simplification())
