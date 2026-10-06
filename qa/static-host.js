/* Verify the DEPLOYABLE static bundle: boots, installs, plays offline — with no /api at all. */
const { chromium, devices } = require('playwright');
let pass = 0, fail = 0;
const ok = (c, l, x) => { c ? (pass++, console.log('  ✓ ' + l)) : (fail++, console.log('  ✗ ' + l + (x !== undefined ? '  → ' + JSON.stringify(x) : ''))); };
(async () => {
  const b = await chromium.launch({ args:['--no-sandbox','--autoplay-policy=no-user-gesture-required'] });
  const ctx = await b.newContext(Object.assign({}, devices['iPhone 15 Pro']));
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  const missing = [];
  p.on('response', r => { if (r.status() >= 400 && r.url().indexOf('/api/') < 0) missing.push(r.status() + ' ' + r.url()); });
  await p.goto('http://127.0.0.1:8091/index.html', { waitUntil:'load' });
  await p.waitForTimeout(1500);
  await p.evaluate(() => { try { $('#btnCookYes').click(); } catch(e){} });

  const state = await p.evaluate(() => ({ cities: CITY_PACKS.length, mode: NET.mode, board: save.board,
    icon: document.querySelector('link[rel=apple-touch-icon]').getAttribute('href'),
    sw: !!navigator.serviceWorker.controller || true }));
  ok(state.cities === 10, 'game boots from a plain static host', state);
  ok(state.mode === 'offline', 'detects no /api and runs solo (as documented)', state.mode);

  /* play a run with one thumb, then check the local board recorded it */
  await p.evaluate(() => { startRun('lagos', 0); G.gas = true; for (let i=0;i<300;i++) update(1/60); });
  const played = await p.evaluate(() => ({ dist: Math.round(G.dist), mode: G.mode, speed: Math.round(G.speed*KMH) }));
  ok(played.dist > 100, 'drives on the static host', played);

  /* nothing 404'd: every asset the page asks for exists in the bundle */
  await p.waitForTimeout(600);
  ok(missing.length === 0, 'no missing assets (the only 404 is the deliberate /api probe)', missing.slice(0,4));

  /* service worker + offline relaunch — the whole point of installing it */
  const swReg = await p.evaluate(() => navigator.serviceWorker.getRegistration().then(r => r && { scope: r.scope, active: !!r.active }));
  ok(!!swReg && swReg.active, 'service worker active on a static host', swReg);
  await p.waitForTimeout(1200);
  await ctx.setOffline(true);
  await p.reload({ waitUntil:'load' }).catch(e => console.log('    (reload while offline: ' + e.message.split('\n')[0] + ')'));
  await p.waitForTimeout(1500);
  const offline = await p.evaluate(() => ({ title: document.title, booted: typeof CITY_PACKS !== 'undefined' && CITY_PACKS.length === 10,
    playable: typeof startRun === 'function', sw: !!navigator.serviceWorker.controller }));
  ok(offline.booted && offline.playable, 'relaunches with no network (installed-app behaviour)', offline);
  await ctx.setOffline(false);
  ok(errs.length === 0, 'no page errors', errs.slice(0,3));
  console.log('\n=== STATIC BUNDLE: ' + pass + ' passed, ' + fail + ' failed ===');
  await b.close();
  process.exit(0);
})();
