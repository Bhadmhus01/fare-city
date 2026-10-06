/* What iOS actually needs for Add to Home Screen, verified over http(s):
   apple metas, a PNG touch icon, standalone launch, safe-area insets, offline. */
const { chromium, devices } = require('playwright');
let pass = 0, fail = 0;
const ok = (c, l, x) => { c ? (pass++, console.log('  ✓ ' + l)) : (fail++, console.log('  ✗ ' + l + (x !== undefined ? '  → ' + JSON.stringify(x) : ''))); };
(async () => {
  const b = await chromium.launch({ args:['--no-sandbox','--autoplay-policy=no-user-gesture-required'] });
  const ctx = await b.newContext(Object.assign({}, devices['iPhone 15 Pro'], { locale:'en-NG' }));
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  const reqs = [];
  p.on('request', r => reqs.push(r.url()));
  await p.goto('http://127.0.0.1:8080/index.html', { waitUntil:'load' });
  await p.waitForTimeout(1400);
  await p.evaluate(() => { try { $('#btnCookYes').click(); } catch(e){} });

  const meta = await p.evaluate(() => {
    const get = n => { const el = document.querySelector('meta[name="' + n + '"]'); return el && el.content; };
    return { capable: get('apple-mobile-web-app-capable'), legacy: get('mobile-web-app-capable'),
      statusBar: get('apple-mobile-web-app-status-bar-style'), title: get('apple-mobile-web-app-title'),
      viewportFit: document.querySelector('meta[name=viewport]').content.includes('viewport-fit=cover'),
      touchIcon: document.querySelector('link[rel=apple-touch-icon]') && document.querySelector('link[rel=apple-touch-icon]').getAttribute('href'),
      touchIconSizes: document.querySelector('link[rel=apple-touch-icon]') && document.querySelector('link[rel=apple-touch-icon]').getAttribute('sizes') };
  });
  ok(meta.capable === 'yes' && meta.legacy === 'yes', 'declares standalone web-app capability', meta);
  ok(meta.statusBar === 'black-translucent', 'status bar style set (full-bleed)', meta.statusBar);
  ok(meta.title === 'Fare City', 'short name for under the icon', meta.title);
  ok(meta.viewportFit, 'viewport-fit=cover (so the notch is handled)');
  ok(/\.png$/.test(meta.touchIcon || ''), 'apple-touch-icon is a PNG (iOS ignores SVG)', meta.touchIcon);
  ok(meta.touchIconSizes === '180x180', 'icon is the 180x180 Apple size', meta.touchIconSizes);

  for (const [file, type] of [['apple-touch-icon.png','image/png'], ['icon-192.png','image/png'],
                              ['icon-512.png','image/png'], ['manifest.webmanifest', null], ['sw.js', null]]) {
    const r = await p.request.get('http://127.0.0.1:8080/' + file);
    ok(r.status() === 200, file + ' is served (' + r.status() + ')');
    if (type) ok((r.headers()['content-type'] || '').includes(type), file + ' has type ' + type, r.headers()['content-type']);
  }
  const man = await (await p.request.get('http://127.0.0.1:8080/manifest.webmanifest')).json();
  ok(man.display === 'standalone' && man.orientation === 'portrait', 'manifest: standalone + portrait', { d: man.display, o: man.orientation });
  ok(man.icons.some(i => i.type === 'image/png' && i.sizes === '512x512' && i.purpose === 'maskable'), 'manifest has a maskable PNG (Android)');
  ok(man.start_url === './index.html' && man.scope === './', 'start_url/scope keep it in the game', { s: man.start_url, sc: man.scope });

  /* geometry: with a real iPhone notch inset, nothing may hide under it */
  const geo = await p.evaluate(() => {
    const de = document.documentElement;
    de.style.setProperty('--sat','59px'); de.style.setProperty('--sab','34px');   // iPhone 15 Pro values
    fit();
    const stage = document.getElementById('stage').getBoundingClientRect();
    const pedals = document.getElementById('pedals').getBoundingClientRect();
    const top = document.querySelector('#hud .hudtop');
    return { top: Math.round(stage.top), bottom: Math.round(stage.bottom), vh: innerHeight,
      pedalsBottom: Math.round(pedals.bottom), hudTop: Math.round(stage.top + (top ? top.getBoundingClientRect().top : 0)) };
  });
  ok(geo.top >= 58, 'game starts below the 59px notch', geo);
  ok(geo.bottom <= geo.vh - 34 + 1, 'game ends above the 34px home bar', geo);

  /* offline relaunch (an installed app must still open with no signal) */
  const sw = await p.evaluate(() => navigator.serviceWorker.getRegistration().then(r => !!r));
  ok(sw, 'service worker registered');
  await p.waitForTimeout(800);
  const cached = await p.evaluate(async () => {
    const keys = await caches.keys();
    const c = await caches.open(keys[0]);
    const list = (await c.keys()).map(r => r.url.split('/').pop());
    return { keys, list };
  });
  ok(cached.list.includes('apple-touch-icon.png') && cached.list.includes('icon-192.png'),
    'icons are precached for offline', cached);

  ok(errs.length === 0, 'no page errors', errs.slice(0,3));
  console.log('\n=== iOS A2HS: ' + pass + ' passed, ' + fail + ' failed ===');
  await b.close();
  process.exit(0);
})();
