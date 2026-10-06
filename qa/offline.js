const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args:['--no-sandbox'] });
  const ctx = await b.newContext({ viewport:{width:540,height:960} });
  const p = await ctx.newPage();
  const errs=[]; p.on('pageerror', e=>errs.push(e.message));
  await p.goto('http://localhost:8080/index.html', { waitUntil:'load' });
  await p.waitForTimeout(1200);
  const sw = await p.evaluate(async () => {
    const r = await navigator.serviceWorker.getRegistration();
    if (!r) return { registered:false };
    await navigator.serviceWorker.ready;
    const keys = await caches.keys();
    const c = await caches.open(keys[0]);
    const items = (await c.keys()).map(x => x.url.split('/').slice(-2).join('/'));
    return { registered:true, scope:r.scope.split('/').slice(-2).join('/'), caches:keys, cached:items };
  });
  console.log('SW', JSON.stringify(sw));
  // now go offline and reload — a real phone in a dead zone
  await ctx.setOffline(true);
  const resp = await p.reload({ waitUntil:'load' }).catch(e => ({ err:e.message }));
  await p.waitForTimeout(900);
  const state = await p.evaluate(() => ({
    title: document.title,
    booted: typeof save !== 'undefined' && !!document.querySelector('#btnStart'),
    cities: typeof CITY_PACKS !== 'undefined' ? CITY_PACKS.length : 0,
    playable: typeof startRun === 'function'
  })).catch(e => ({ err:e.message }));
  console.log('OFFLINE RELOAD', JSON.stringify(state), 'resp', resp && resp.err ? resp.err : 'ok');
  await p.screenshot({ path:'/home/user/qa/shots/19-offline.png' });
  console.log('ERRORS', errs.length, errs.slice(0,3).join(' | '));
  await b.close();
})();
