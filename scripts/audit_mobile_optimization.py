import asyncio
import json
import os
import subprocess
import time
import requests
import websockets

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
USER_DATA = r"C:\Users\gmatr\AppData\Local\Temp\chrome_cdp_profile_mobile_audit"

VIEWPORTS = [
    ("iPhone SE (375x667)", 375, 667),
    ("iPhone 14 (390x844)", 390, 844),
    ("Android Standard (360x740)", 360, 740),
]

ROUTES = [
    ("#home", "Home"),
    ("#overview", "Overview"),
    ("#demand-forecast", "Demand Forecast"),
    ("#prep-planner", "Prep Planner"),
    ("#waste-risk", "Surplus Rescue"),
    ("#performance", "Performance"),
    ("#data-model", "Data & Model"),
]

AUDIT_JS = """
(() => {
    const docWidth = document.documentElement.clientWidth;
    const scrollWidth = document.documentElement.scrollWidth;
    const bodyScrollWidth = document.body.scrollWidth;
    const isOverflowing = scrollWidth > docWidth || bodyScrollWidth > docWidth;
    
    // Find any overflowing elements
    const overflowingElements = [];
    document.querySelectorAll('*').forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.right > docWidth + 1 && rect.width > 0) {
            overflowingElements.push({
                tag: el.tagName,
                className: (el.className || '').toString().slice(0, 50),
                right: Math.round(rect.right),
                docWidth: docWidth,
                diff: Math.round(rect.right - docWidth)
            });
        }
    });

    // Check small touch targets (<40px)
    const smallTouchTargets = [];
    document.querySelectorAll('button, a, input, select').forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0 && (rect.width < 40 || rect.height < 40)) {
            // ignore if hidden, aria-hidden, visually-hidden, file or range input
            const isVisuallyHidden = el.classList.contains('visually-hidden') || el.closest('.visually-hidden');
            const isRangeOrFile = el.getAttribute('type') === 'range' || el.getAttribute('type') === 'file';
            if (window.getComputedStyle(el).display !== 'none' && !el.closest('[aria-hidden="true"]') && !isVisuallyHidden && !isRangeOrFile) {
                smallTouchTargets.push({
                    tag: el.tagName,
                    text: (el.innerText || el.getAttribute('aria-label') || '').slice(0, 30),
                    className: (el.className || '').toString().slice(0, 40),
                    w: Math.round(rect.width),
                    h: Math.round(rect.height)
                });
            }
        }
    });

    // Check font size < 16px on text inputs (causes iOS zoom)
    const smallInputs = [];
    document.querySelectorAll('input, select, textarea').forEach(el => {
        const isVisuallyHidden = el.classList.contains('visually-hidden') || el.closest('.visually-hidden');
        const isExcluded = el.getAttribute('type') === 'range' || el.getAttribute('type') === 'file' || el.getAttribute('type') === 'checkbox' || el.getAttribute('type') === 'radio';
        if (!isVisuallyHidden && !isExcluded && window.getComputedStyle(el).display !== 'none') {
            const fontSize = parseFloat(window.getComputedStyle(el).fontSize);
            if (fontSize < 15.5) {
                smallInputs.push({
                    tag: el.tagName,
                    name: el.name || el.id || el.placeholder,
                    fontSize: fontSize
                });
            }
        }
    });

    return {
        docWidth,
        scrollWidth,
        bodyScrollWidth,
        hasHorizontalOverflow: isOverflowing,
        overflowCount: overflowingElements.length,
        overflowingElements: overflowingElements.slice(0, 5),
        smallTouchTargetsCount: smallTouchTargets.length,
        smallTouchTargets: smallTouchTargets.slice(0, 8),
        smallInputsCount: smallInputs.length,
        smallInputs: smallInputs.slice(0, 5)
    };
})()
"""

async def main():
    proc = subprocess.Popen([
        CHROME_PATH,
        "--headless=new",
        "--remote-debugging-port=9229",
        f"--user-data-dir={USER_DATA}",
        "--disable-gpu",
        "--window-size=390,844"
    ])

    try:
        for _ in range(30):
            try:
                r = requests.get("http://127.0.0.1:9229/json/version", timeout=1)
                if r.status_code == 200:
                    break
            except Exception:
                time.sleep(0.2)

        r = requests.put("http://127.0.0.1:9229/json/new?http://localhost:4173")
        page_info = r.json()
        ws_url = page_info["webSocketDebuggerUrl"]

        async with websockets.connect(ws_url, max_size=25 * 1024 * 1024) as ws:
            await ws.send(json.dumps({"id": 1, "method": "Page.enable"}))
            await ws.recv()
            await ws.send(json.dumps({"id": 2, "method": "Runtime.enable"}))
            await ws.recv()

            results = {}

            for vp_name, w, h in VIEWPORTS:
                print(f"\n==================== Testing Viewport: {vp_name} ({w}x{h}) ====================")
                await ws.send(json.dumps({
                    "id": 10,
                    "method": "Emulation.setDeviceMetricsOverride",
                    "params": {"width": w, "height": h, "deviceScaleFactor": 2, "mobile": True}
                }))
                await ws.recv()

                for hash_route, label in ROUTES:
                    await ws.send(json.dumps({
                        "id": 20,
                        "method": "Page.navigate",
                        "params": {"url": f"http://localhost:4173/{hash_route}"}
                    }))
                    await asyncio.sleep(1.8)

                    await ws.send(json.dumps({
                        "id": 30,
                        "method": "Runtime.evaluate",
                        "params": {"expression": AUDIT_JS, "returnByValue": True}
                    }))
                    res = json.loads(await ws.recv())
                    val = res.get("result", {}).get("result", {}).get("value", {})
                    
                    status = "PASS_CLEAN" if not val.get("hasHorizontalOverflow") else "FAIL_OVERFLOW"
                    print(f"[{status}] {label} ({hash_route}): clientWidth={val.get('docWidth')} scrollWidth={val.get('scrollWidth')}")
                    if val.get("hasHorizontalOverflow"):
                        print(f"   Overflowing elements: {json.dumps(val.get('overflowingElements'), indent=2)}")
                    if val.get("smallTouchTargetsCount", 0) > 0:
                        print(f"   Small touch targets ({val.get('smallTouchTargetsCount')}): {val.get('smallTouchTargets')[:3]}")
                    if val.get("smallInputsCount", 0) > 0:
                        print(f"   Small inputs (<16px, causes iOS zoom): {val.get('smallInputs')}")

    finally:
        proc.terminate()
        try:
            proc.wait(timeout=3)
        except Exception:
            proc.kill()

if __name__ == "__main__":
    asyncio.run(main())
