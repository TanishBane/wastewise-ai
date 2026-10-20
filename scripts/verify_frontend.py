"""Browser checks for WasteWise using an installed Chrome and the CDP protocol.
Run against an isolated demo backend; upload tests replace its in-memory dataset.
"""
import argparse, asyncio, base64, json, os, subprocess, urllib.request
from pathlib import Path
import websockets

async def run(url, mutate):
    out=Path('screenshots/frontend-review'); out.mkdir(parents=True,exist_ok=True)
    port=9341
    profile=Path(os.environ['TEMP'])/'wastewise-frontend-checks'
    chrome=Path(os.environ.get('PROGRAMFILES',r'C:\Program Files'))/'Google/Chrome/Application/chrome.exe'
    proc=subprocess.Popen([str(chrome),'--headless=new',f'--remote-debugging-port={port}',f'--user-data-dir={profile}','--no-first-run','--disable-gpu','about:blank'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
    errors=[]; checks=[]
    try:
        for _ in range(60):
            try: pages=json.load(urllib.request.urlopen(f'http://127.0.0.1:{port}/json')); break
            except Exception: await asyncio.sleep(.2)
        page=next(p for p in pages if p['type']=='page')
        async with websockets.connect(page['webSocketDebuggerUrl'],max_size=25000000) as ws:
            seq=0
            async def cmd(method,params=None):
                nonlocal seq
                seq+=1; n=seq
                await ws.send(json.dumps(dict(id=n,method=method,params=params or {})))
                while True:
                    msg=json.loads(await ws.recv())
                    if msg.get('method')=='Runtime.exceptionThrown': errors.append(msg['params']['exceptionDetails'].get('text','Runtime error'))
                    if msg.get('id')==n:
                        if 'error' in msg: raise RuntimeError(msg['error'])
                        return msg.get('result',{})
            async def js(expression):
                result=await cmd('Runtime.evaluate',dict(expression=f'Promise.resolve(({expression})).then(value => value instanceof Node ? true : value)',returnByValue=True,awaitPromise=True))
                if result.get('exceptionDetails'): raise RuntimeError(result['exceptionDetails'])
                return result.get('result',{}).get('value')
            async def wait(expression,timeout=15):
                for _ in range(int(timeout*5)):
                    if await js(expression): return
                    await asyncio.sleep(.2)
                raise AssertionError('Timed out: '+expression)
            async def check(name,expression):
                assert await js(expression),name
                checks.append(name); print('PASS',name,flush=True)
            async def click(text,selector='button'):
                assert await js(f"(() => {{const el=[...document.querySelectorAll({json.dumps(selector)})].find(e=>e.textContent.trim().includes({json.dumps(text)}) && e.getClientRects().length); if(!el)return false; el.click(); return true;}})()"),text
            async def set_input(selector,value):
                await js(f"(() => {{const el=document.querySelector({json.dumps(selector)}); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,{json.dumps(value)}); el.dispatchEvent(new Event('input',{{bubbles:true}}));}})()")
            async def nav(route):
                await js(f"location.hash={json.dumps(route)}")
                await wait("(document.querySelector('h1') || document.querySelector('.error-state')) && !document.querySelector('.loading-state')")
            async def screenshot(name):
                await js("window.scrollTo(0,0)")
                await js('document.fonts.ready'); await asyncio.sleep(.2)
                result=await cmd('Page.captureScreenshot',dict(format='png',captureBeyondViewport=False))
                (out/f'{name}.png').write_bytes(base64.b64decode(result['data']))
            await cmd('Page.enable'); await cmd('Runtime.enable'); await cmd('Network.enable')
            await cmd('Emulation.setDeviceMetricsOverride',dict(width=1440,height=1000,deviceScaleFactor=1,mobile=False))
            await cmd('Page.navigate',dict(url=url))
            await wait("document.querySelector('.menu-table tbody tr')")
            await check('overview renders eight real menu dishes',"document.querySelectorAll('.menu-table tbody tr').length===8")
            await check('self-hosted font loaded',"document.fonts.check('14px \"IBM Plex Sans\"')")
            await check('no desktop overflow',"document.documentElement.scrollWidth<=innerWidth")
            await screenshot('overview-desktop')
            await click('Review','.review-button')
            await check('review mark changes accessible state',"document.querySelector('.review-button').getAttribute('aria-pressed')==='true'")
            await set_input('[aria-label="Search menu"]','zzzzmissingdish')
            await check('empty menu search state',"!!document.querySelector('.empty-state') && document.querySelectorAll('.menu-table tbody tr').length===0")
            await set_input('[aria-label="Search menu"]','')
            await click('Find a page','.search-trigger')
            await wait("!!document.querySelector('dialog[open]')")
            await check('dialog has keyboard focus',"document.querySelector('dialog[open]').contains(document.activeElement)")
            await set_input('[aria-label="Search pages"]','forecast')
            await click('Demand forecast','.search-results button')
            await wait("!!document.querySelector('.forecast-range')")
            await check('forecast is calculated',"Number(document.querySelector('.stat-value').textContent.replace(/[^0-9.]/g,''))>0")
            await click('Event','.preset-buttons button')
            await check('changed conditions hide prior calculations',"!document.querySelector('.forecast-range') && document.querySelector('.notice.warning').textContent.includes('Conditions changed')")
            await click('Generate forecast')
            await wait("!!document.querySelector('.forecast-range')")
            await screenshot('forecast-desktop')
            await click('Compare three scenarios')
            await wait("document.querySelectorAll('.scenario-comparison-table tbody tr').length===3")
            await check('three scenario comparison returns backend results',"document.querySelectorAll('.scenario-comparison-table tbody tr').length===3")
            await click('Open planner')
            await wait("!!document.querySelector('.batch-detail')")
            await check('restored preset matches event conditions',"document.querySelector('.preset-buttons button.selected').textContent.includes('Event')")
            await check('forecast conditions carry into planner',"document.querySelector('input[type=range]').value==='130' && document.querySelector('input[type=checkbox]').checked")
            await js("document.querySelector('a.skip-link').click()")
            await check('skip link retains the current route', "location.hash==='#prep-planner' && document.activeElement.id==='main'")
            await set_input('input[type=number]','1000')
            await click('Calculate preparation plan')
            await wait("!!document.querySelector('.batch-detail')")
            await check('stock is reflected in new prep',"document.querySelector('.scenario-results .stat-value').textContent.trim().startsWith('0')")
            await screenshot('planner-desktop')
            await cmd('Browser.setDownloadBehavior',dict(behavior='allow',downloadPath=str((out/'downloads').resolve())))
            await click('Export this plan')
            await check('plan export feedback',"document.querySelector('.saved-note').textContent.includes('Plan exported')")
            for route in ['waste-risk','performance','data-model','help','privacy','terms','transparency']:
                await nav(route)
                await check(f'{route} page renders without view error',"!!document.querySelector('h1') && !document.querySelector('.error-state')")
                await check(f'{route} has no desktop overflow',"document.documentElement.scrollWidth<=innerWidth")
                if route in ['performance','data-model','waste-risk']: await screenshot(route+'-desktop')
            await nav('overview'); await click('Export menu')
            await asyncio.sleep(.7)
            await check('menu export file created',"true")
            assert list((out/'downloads').glob('wastewise-menu-*.csv')),'Menu CSV missing'
            checks.append('menu CSV contains live data')
            menu=next((out/'downloads').glob('wastewise-menu-*.csv')).read_text(encoding='utf-8-sig')
            assert 'Pav Bhaji' in menu and 'Synthetic demonstration' in menu
            # Responsive checks for each operational surface.
            for width in [768,390,320]:
                await cmd('Emulation.setDeviceMetricsOverride',dict(width=width,height=900 if width>400 else 844,deviceScaleFactor=1,mobile=width<500))
                for route in ['overview','demand-forecast','prep-planner','waste-risk','performance','data-model']:
                    await nav(route)
                    await check(f'{route}: no page overflow at {width}px',"document.documentElement.scrollWidth<=innerWidth")
                    if width==390: await screenshot(route+'-mobile')
            await cmd('Emulation.setDeviceMetricsOverride',dict(width=390,height=844,deviceScaleFactor=1,mobile=True))
            await click('','[aria-label="Open navigation"]')
            await check('mobile menu opens',"!!document.querySelector('dialog[open] .mobile-navigation')")
            await click('Kitchen overview','.mobile-navigation a')
            await check('mobile navigation closes after selection',"!document.querySelector('dialog[open]') && location.hash==='#overview'")
            await cmd('Emulation.setEmulatedMedia',dict(features=[dict(name='prefers-reduced-motion',value='reduce')]))
            await click('','[aria-label="Open navigation"]')
            await check('reduced motion uses gentle opacity animation',"getComputedStyle(document.querySelector('dialog[open]')).animationName==='dialog-fade'")
            await click('','dialog[open] [aria-label="Close dialog"]')
            if mutate:
                await nav('data-model')
                # Send an invalid file through the real input and React upload handler.
                await js("(() => {const dt=new DataTransfer();dt.items.add(new File(['bad,column\\n1,2'],'invalid.csv',{type:'text/csv'}));const el=document.querySelector('input[type=file]');el.files=dt.files;el.dispatchEvent(new Event('change',{bubbles:true}));})()")
                await wait("!!document.querySelector('.inline-error')")
                await check('invalid upload gives readable validation',"document.querySelector('.inline-error').textContent.includes('Missing required columns')")
                await js("(async () => {const response=await fetch(document.querySelector('a[download]').href);const csv=await response.text();const dt=new DataTransfer();dt.items.add(new File([csv],'service-history.csv',{type:'text/csv'}));const el=document.querySelector('input[type=file]');el.files=dt.files;el.dispatchEvent(new Event('change',{bubbles:true}));})()")
                await wait("document.querySelector('.source-bar').textContent.includes('Operator dataset')",30)
                await check('upload refreshes source across workspace',"document.querySelector('.saved-note').textContent.includes('Successfully ingested')")
                await click('Restore demonstration data')
                await wait("!!document.querySelector('dialog[open]')")
                await click('Keep current data')
                await check('cancel reset retains operator dataset',"document.querySelector('.source-bar').textContent.includes('Operator dataset')")
                await click('Restore demonstration data'); await click('Restore demo data','dialog[open] button')
                await wait("document.querySelector('.source-bar').textContent.includes('Demo workspace')",30)
                checks.append('restore demo updates provenance')
            await nav('help')
            await js("(() => {window.__originalFetch=window.fetch;window.fetch=(url,...rest)=>String(url).includes('/api/overview')?Promise.reject(new TypeError('Connection failed')):window.__originalFetch(url,...rest);})()")
            await nav('overview')
            await check('offline state explains recovery', "document.querySelector('.error-state').textContent.includes('Cannot reach the WasteWise backend')")
            await js("window.fetch=window.__originalFetch")
            await click('Try again')
            await wait("!!document.querySelector('.menu-table tbody tr')")
            await check('retry recovers from connection failure', "document.querySelectorAll('.menu-table tbody tr').length===8")
            await js("location.hash='unknown-page'")
            await wait("!!document.querySelector('.menu-table tbody tr')")
            await check('unknown route safely falls back to overview', "document.title.includes('Kitchen overview')")
            assert not errors, errors
            checks.append('no uncaught browser exceptions')
            (out/'results.json').write_text(json.dumps(dict(passed=len(checks),checks=checks,errors=errors),indent=2),encoding='utf-8')
            print(f'ALL {len(checks)} BROWSER CHECKS PASSED',flush=True)
    finally: proc.terminate()

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--url',default='http://127.0.0.1:3002');parser.add_argument('--test-upload',action='store_true');args=parser.parse_args()
    asyncio.run(run(args.url,args.test_upload))
