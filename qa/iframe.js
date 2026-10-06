const { chromium } = require('playwright');
const fs = require('fs');
fs.writeFileSync('/tmp/host.html', `<!doctype html><html><body style="margin:0;background:#000">
<iframe sandbox="allow-scripts" src="http://localhost:8080/index.html" style="border:0;width:100vw;height:100vh"></iframe>
</body></html>`);
(async () => {
  const b = await chromium.launch({ args:['--no-sandbox'] });
  const p = await b.newPage({ viewport:{width:540,height:960} });
  const errs=[];
  p.on('pageerror', e => errs.push('page: '+e.message));
  p.on('console', m => { if (m.type()==='error') errs.push('console: '+m.text()); });
  await p.goto('file:///tmp/host.html');
  await p.waitForTimeout(1500);
  const f = p.frames().find(x => x.url().includes('index.html'));
  let state = { err:'no frame' };
  if (f) {
    state = await f.evaluate(() => {
      const ls = (() => { try { localStorage.setItem('t','1'); return 'available'; } catch(e) { return 'blocked'; } })();
      return { ls, booted: !!document.querySelector('#btnStart'), cities: CITY_PACKS.length,
        persistSafe: (() => { try { persist(); return true; } catch(e) { return 'threw: '+e.message; } })() };
    }).catch(e => ({ err:e.message }));
    // try to actually start and drive
    try {
      await f.evaluate(() => { $('#btnCookYes') && $('#btnCookYes').click(); $('#btnStart').click(); });
      await p.waitForTimeout(400);
      const drove = await f.evaluate(() => { startRun('lagos',0); for (let i=0;i<240;i++){ G.gas=true; update(1/60); } return { speed: Math.round(G.speed*KMH), dist: Math.round(G.dist), mode:G.mode }; });
      state.drove = drove;
    } catch(e) { state.driveErr = e.message; }
  }
  console.log('IFRAME SANDBOX:', JSON.stringify(state));
  console.log('ERRORS', errs.length, errs.slice(0,4).join(' | '));
  await p.screenshot({ path:'/home/user/qa/shots/25-sandboxed-iframe.png' });
  await b.close();
})();
