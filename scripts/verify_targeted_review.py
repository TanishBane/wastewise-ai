import asyncio
import json
import os
import subprocess
import sys
import urllib.request
from pathlib import Path
import websockets

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

async def run():
    port = 9399
    profile = Path(os.environ["TEMP"]) / "wastewise-targeted-review-profile"
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

            await cmd("Page.enable")
            await cmd("Runtime.enable")
            await cmd("Network.enable")

            # 1. Desktop 1440x900 on Kitchen Overview
            print("--- Checking Desktop 1440 Navigation & Alignment ---")
            await cmd("Emulation.setDeviceMetricsOverride", {
                "width": 1440, "height": 900, "deviceScaleFactor": 1, "mobile": False
            })
            await cmd("Page.navigate", {"url": "http://127.0.0.1:8000/#overview"})
            await wait("document.querySelector('.overview-page') && document.querySelector('.menu-table tbody tr')")
            await asyncio.sleep(1.0) # allow count-up to settle

            # Check 1: Top-Right Utilities present
            await check("Help button present in header utilities", 
                        "document.querySelector('.header-utilities .utility-nav-btn[title=\"Help & getting started\"]') !== null")
            await check("Transparency button present in header utilities", 
                        "document.querySelector('.header-utilities .utility-nav-btn[title=\"Model transparency\"]') !== null")

            # Check 2: Neither item duplicated in sidebar
            await check("Help link removed from sidebar", 
                        "document.querySelector('aside .sidebar-bottom a[href=\"#help\"]') === null")
            await check("Transparency link removed from sidebar", 
                        "document.querySelector('aside .sidebar-bottom a[href=\"#transparency\"]') === null")

            # Check 3: Search control and avatar remain working
            await check("Search trigger present in workspace tools", 
                        "document.querySelector('.workspace-tools .search-trigger') !== null")
            await check("Operator avatar present in workspace tools", 
                        "document.querySelector('.workspace-tools .operator-avatar').textContent.trim() === 'CG'")

            # Check 4: Clicking Help opens #help route
            await js("document.querySelector('.header-utilities .utility-nav-btn[title=\"Help & getting started\"]').click()")
            await wait("document.querySelector('h1') && location.hash === '#help'")
            await check("Help route loaded via top-right navigation", "location.hash === '#help'")
            await check("Help button has active state on #help", 
                        "document.querySelector('.header-utilities .utility-nav-btn[title=\"Help & getting started\"]').classList.contains('active')")

            # Check 5: Clicking Transparency opens #transparency route
            await js("document.querySelector('.header-utilities .utility-nav-btn[title=\"Model transparency\"]').click()")
            await wait("document.querySelector('h1') && location.hash === '#transparency'")
            await check("Transparency route loaded via top-right navigation", "location.hash === '#transparency'")
            await check("Transparency button has active state on #transparency", 
                        "document.querySelector('.header-utilities .utility-nav-btn[title=\"Model transparency\"]').classList.contains('active')")

            # Check 6: Return to Overview and check KPI values
            print("--- Checking Real KPI Values and Format on Overview ---")
            await js("location.hash = 'overview'")
            await wait("document.querySelector('.overview-page') && document.querySelector('.menu-table tbody tr')")
            await asyncio.sleep(1.0)

            # Check KPI values
            stats_texts = await js("[...document.querySelectorAll('.stats .stat .stat-value')].map(e => e.textContent.trim())")
            print(f"Rendered KPI stat values: {stats_texts}")
            assert "161portions" in stats_texts[0], f"Expected demand 161portions, got {stats_texts[0]}"
            assert "168portions" in stats_texts[1], f"Suggested prep 168portions, got {stats_texts[1]}"
            assert "7portions" in stats_texts[2], f"Potential surplus 7portions, got {stats_texts[2]}"
            assert "₹887" in stats_texts[3], f"Cost at risk ₹887, got {stats_texts[3]}"
            checks.append("All 4 KPI values end at exact API response numbers")
            print("PASS: All 4 KPI values end at exact API response numbers", flush=True)

            # Check 7: Shimmer class is replaced by is-revealed class
            await check("KPI counters have is-revealed class", 
                        "document.querySelectorAll('.stats .stat .animated-counter.is-revealed').length === 4")
            await check("No active skeleton shimmer after reveal", 
                        "document.querySelectorAll('.stats .stat .animated-counter-shimmer').length === 0")

            # Check 8: Responsive checks for top-right utilities
            print("--- Checking Responsive Header Layouts ---")
            for width, height in [(1024, 768), (768, 1024), (390, 844), (320, 568)]:
                await cmd("Emulation.setDeviceMetricsOverride", {
                    "width": width, "height": height, "deviceScaleFactor": 1, "mobile": width < 500
                })
                await asyncio.sleep(0.3)
                await check(f"No horizontal overflow at {width}px", "document.documentElement.scrollWidth <= window.innerWidth")
                # Ensure utilities are visible or gracefully styled
                await check(f"Header utilities visible at {width}px", 
                            "document.querySelector('.header-utilities').getClientRects().length > 0")

            # Check 9: Search modal still opens from header
            await js("document.querySelector('.search-trigger').click()")
            await wait("!!document.querySelector('dialog[open]')")
            await check("Search dialog opens correctly from header", "document.querySelector('dialog[open]') !== null")
            await js("document.querySelector('dialog[open] [aria-label=\"Close dialog\"]').click()")
            await wait("!document.querySelector('dialog[open]')")
            await check("Search dialog closes properly", "!document.querySelector('dialog[open]')")

            # Check 10: Zero console errors
            assert not errors, f"Uncaught errors during review: {errors}"
            checks.append("Zero uncaught browser errors during review")
            print("PASS: Zero uncaught browser errors during review", flush=True)

            print(f"\nALL {len(checks)} TARGETED REVIEW CHECKS PASSED!", flush=True)

    finally:
        proc.terminate()

if __name__ == "__main__":
    asyncio.run(run())
