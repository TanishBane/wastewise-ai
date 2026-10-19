import asyncio
import json
import requests
import websockets

async def check():
    url = "http://localhost:8501"
    r = requests.put("http://127.0.0.1:9222/json/new?" + url).json()
    async with websockets.connect(r["webSocketDebuggerUrl"]) as ws:
        await asyncio.sleep(4)
        expr = 'document.querySelector("[data-testid=\'stRadioGroup\']").firstElementChild.outerHTML'
        await ws.send(json.dumps({
            "id": 1,
            "method": "Runtime.evaluate",
            "params": {"expression": expr}
        }))
        res = json.loads(await ws.recv())
        print("OPTION HTML:", res.get("result", {}).get("result", {}).get("value", ""))

if __name__ == "__main__":
    asyncio.run(check())
