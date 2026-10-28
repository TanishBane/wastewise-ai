import asyncio
import base64
import json
import os
import subprocess
import requests
import websockets

OUTPUT_DIR = r"c:\Users\gmatr\.gemini\antigravity\brain\bc2058be-c5f8-46fc-8f8f-a24828710da6"

async def verify_bento():
    proc = subprocess.Popen([
        r'C:\Program Files\Google\Chrome\Application\chrome.exe',
        '--headless=new',
        '--remote-debugging-port=9248',
        '--user-data-dir=C:/Users/gmatr/AppData/Local/Temp/chrome_cdp_bento_verify',
        '--disable-gpu',
        '--window-size=1440,900'
    ])
    await asyncio.sleep(2.0)
    try:
        r = requests.put('http://127.0.0.1:9248/json/new?http://localhost:3000/#overview')
        ws_url = r.json()['webSocketDebuggerUrl']
        async with websockets.connect(ws_url, max_size=25*1024*1024) as ws:
            await ws.send(json.dumps({'id': 1, 'method': 'Page.enable'}))
            await ws.recv()
            # Navigate to overview
            await ws.send(json.dumps({'id': 2, 'method': 'Runtime.evaluate', 'params': {'expression': 'window.location.hash = "overview"'}}))
            await asyncio.sleep(2.0)

            # Check current location and DOM
            await ws.send(json.dumps({'id': 5, 'method': 'Runtime.evaluate', 'params': {'expression': '({ href: window.location.href, body: document.body.innerText.slice(0, 300) })', 'returnByValue': True}}))
            while True:
                msg = await ws.recv()
                data = json.loads(msg)
                if data.get('id') == 5:
                    print("Page state:", data.get('result', {}).get('result', {}).get('value'))
                    break
            measure_js = """
            (() => {
                const bentoGrid = document.querySelector('.bento-12-grid');
                const cards = document.querySelectorAll('.bento-card-block');
                const cardDetails = [];
                cards.forEach(c => {
                    const r = c.getBoundingClientRect();
                    cardDetails.push({
                        id: c.id || c.getAttribute('aria-label') || 'card',
                        width: Math.round(r.width),
                        height: Math.round(r.height),
                        top: Math.round(r.top),
                        left: Math.round(r.left)
                    });
                });
                return {
                    gridWidth: bentoGrid ? Math.round(bentoGrid.getBoundingClientRect().width) : 0,
                    cardCount: cards.length,
                    cards: cardDetails
                };
            })()
            """
            await ws.send(json.dumps({'id': 10, 'method': 'Runtime.evaluate', 'params': {'expression': measure_js, 'returnByValue': True}}))
            while True:
                msg = await ws.recv()
                data = json.loads(msg)
                if data.get('id') == 10:
                    val = data.get('result', {}).get('result', {}).get('value', {})
                    print("Desktop (1440px) Bento Measurements:")
                    print(json.dumps(val, indent=2))
                    break

            # Verify Footer ADAPPT link
            footer_js = """
            (() => {
                const footer = document.querySelector('.workspace-footer');
                const adappt = footer ? footer.querySelector('a.adappt-footer-link') : null;
                return {
                    footerText: footer ? footer.innerText : null,
                    adapptHref: adappt ? adappt.href : null,
                    adapptTarget: adappt ? adappt.target : null,
                    adapptRel: adappt ? adappt.rel : null
                };
            })()
            """
            await ws.send(json.dumps({'id': 15, 'method': 'Runtime.evaluate', 'params': {'expression': footer_js, 'returnByValue': True}}))
            while True:
                msg = await ws.recv()
                data = json.loads(msg)
                if data.get('id') == 15:
                    print("Footer ADAPPT Link Verification:")
                    print(json.dumps(data.get('result', {}).get('result', {}).get('value'), indent=2))
                    break
            await ws.send(json.dumps({'id': 20, 'method': 'Page.captureScreenshot', 'params': {'format': 'png', 'captureBeyondViewport': True}}))
            while True:
                msg = await ws.recv()
                data = json.loads(msg)
                if data.get('id') == 20:
                    raw = base64.b64decode(data['result']['data'])
                    out_path = os.path.join(OUTPUT_DIR, "bento_live_desktop_verified.png")
                    with open(out_path, "wb") as f:
                        f.write(raw)
                    print(f"Captured {out_path}")
                    break

            # 2. Emulate Mobile (390x844) and verify
            await ws.send(json.dumps({'id': 30, 'method': 'Emulation.setDeviceMetricsOverride', 'params': {'width': 390, 'height': 844, 'deviceScaleFactor': 2, 'mobile': True}}))
            await ws.recv()
            await asyncio.sleep(1.0)

            # Scroll bento into view
            await ws.send(json.dumps({'id': 301, 'method': 'Runtime.evaluate', 'params': {'expression': 'document.querySelector(".canteen-bento-dashboard")?.scrollIntoView({ behavior: "instant" })'}}))
            await asyncio.sleep(1.0)

            await ws.send(json.dumps({'id': 31, 'method': 'Runtime.evaluate', 'params': {'expression': measure_js, 'returnByValue': True}}))
            while True:
                msg = await ws.recv()
                data = json.loads(msg)
                if data.get('id') == 31:
                    val_mob = data.get('result', {}).get('result', {}).get('value', {})
                    print("\nMobile (390px) Bento Measurements:")
                    print(json.dumps(val_mob, indent=2))
                    break

            await ws.send(json.dumps({'id': 32, 'method': 'Page.captureScreenshot', 'params': {'format': 'png'}}))
            while True:
                msg = await ws.recv()
                data = json.loads(msg)
                if data.get('id') == 32:
                    raw = base64.b64decode(data['result']['data'])
                    out_path_mob = os.path.join(OUTPUT_DIR, "bento_live_mobile_verified.png")
                    with open(out_path_mob, "wb") as f:
                        f.write(raw)
                    print(f"Captured {out_path_mob}")
                    break

    finally:
        proc.terminate()
        try:
            proc.wait(timeout=3)
        except Exception:
            proc.kill()

if __name__ == "__main__":
    asyncio.run(verify_bento())
