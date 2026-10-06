/* Mobile suite: two emulated devices, real touch events, one-thumb play, tap targets,
   safe-area handling, landscape hint, PWA metadata. */
const { chromium } = require('playwright');
const URL = 'http://127.0.0.1:8080/index.html';
const DEVICES = [
  { name:'small-android', w:360, h:640, dpr:3, ua:'Mozilla/5.0 (Linux; Android 12; SM-A115F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Mobile Safari/537.36' },
  { name:'iphone15pro',   w:430, h:932, dpr:3, ua:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' }
];
let pass = 0, fail = 0;
const ok = (c, label, extra) => { c ? (pass++, console.log('    ✓ ' + label))
  : (fail++, console.log('    ✗ ' + label + (extra !== undefined ? '  → ' + JSON.stringify(extra) : ''))); };

async function drag(cdp, x0, y0, x1, y1, steps = 12){
  await cdp.send('Input.dispatchTouchEvent', { type:'touchStart', touchPoints:[{ x:x0, y:y0 }] });
  for (let i = 1; i <= steps; i++)
    await cdp.send('Input.dispatchTouchEvent', { type:'touchMove',
      touchPoints:[{ x: x0 + (x1-x0)*i/steps, y: y0 + (y1-y0)*i/steps }] });
  await cdp.send('Input.dispatchTouchEvent', { type:'touchEnd', touchPoints:[] });
}

(async () => {
  const b = await chromium.launch({ args:['--no-sandbox','--autoplay-policy=no-user-gesture-required'] });
  for (const d of DEVICES) {
    console.log('\n================ ' + d.name + '  ' + d.w + 'x' + d.h + ' @' + d.dpr + 'x ================');
    const ctx = await b.newContext({ viewport:{ width:d.w, height:d.h }, deviceScaleFactor:d.dpr,
      isMobile:true, hasTouch:true, userAgent:d.ua });
    const p = await ctx.newPage();
    const errs = []; p.on('pageerror', e => errs.push(e.message));
    const cdp = await ctx.newCDPSession(p);
    await p.goto(URL, { waitUntil:'load' });
    await p.waitForTimeout(1200);
    console.log('  #ui children: ' + JSON.stringify(await p.evaluate(() =>
      [].slice.call(document.getElementById('ui').children)
        .map(el => (el.id || el.className || el.tagName) +
          (getComputedStyle(el).pointerEvents === 'none' ? ' (transparent)' : '')))));

    /* ---------- PWA metadata + offline plumbing ---------- */
    const pwa = await p.evaluate(async () => {
      const man = document.querySelector('link[rel=manifest]');
      const reg = ('serviceWorker' in navigator) ? await navigator.serviceWorker.getRegistration() : null;
      const m = man ? await (await fetch(man.href)).json() : null;
      return { manifest: !!man, name: m && m.name, display: m && m.display, icons: m ? m.icons.length : 0,
        sw: !!reg, standalone: ('standalone' in navigator) };
    });
    ok(pwa.manifest && pwa.icons >= 1, 'manifest with icons', pwa);
    ok(pwa.display === 'standalone', 'installs as a standalone app', pwa.display);
    ok(pwa.sw, 'service worker registered (offline play)');

    /* ---------- boot with a real tap, not a JS click ---------- */
    const tapAt = async sel => { const bb = await (await p.$(sel)).boundingBox();
      await p.touchscreen.tap(bb.x + bb.width/2, bb.y + bb.height/2); };
    const cookie = await p.evaluate(() => {
      const btn = document.getElementById('btnCookYes'), r = btn.getBoundingClientRect();
      const hit = document.elementFromPoint(r.x + r.width/2, r.y + r.height/2);
      return { visible: getComputedStyle(document.getElementById('cookie')).display !== 'none', reachable: hit === btn || btn.contains(hit) };
    });
    if (cookie.visible) { await tapAt('#btnCookYes'); await p.waitForTimeout(250); }
    const cookieGone = await p.evaluate(() => getComputedStyle(document.getElementById('cookie')).display === 'none');
    ok(cookie.visible && cookie.reachable && cookieGone, 'consent notice is tappable and dismisses', cookie);
    await p.waitForTimeout(200);
    await tapAt('#btnStart'); await p.waitForTimeout(400);
    if (await p.isVisible('#scr-how')) { await tapAt('#scr-how .x'); await p.waitForTimeout(300); }
    const booted = await p.evaluate(() => document.querySelector('#scr-home').classList.contains('on'));
    ok(booted, 'boots and reaches home with finger taps only');

    /* ---------- layout: fits the screen, nothing scrolls away ---------- */
    const layout = await p.evaluate(() => {
      const de = document.documentElement, stage = document.getElementById('stage').getBoundingClientRect();
      return { overflowX: de.scrollWidth - window.innerWidth, overflowY: de.scrollHeight - window.innerHeight,
        stage: { x:Math.round(stage.x), y:Math.round(stage.y), w:Math.round(stage.width), h:Math.round(stage.height) },
        vw: window.innerWidth, vh: window.innerHeight,
        insideX: stage.x >= -1 && stage.right <= window.innerWidth + 1,
        insideY: stage.y >= -1 && stage.bottom <= window.innerHeight + 1 };
    });
    ok(layout.overflowX <= 1 && layout.overflowY <= 1, 'page does not scroll (no overflow)', layout);
    ok(layout.insideX && layout.insideY, 'stage fits inside the viewport', layout.stage);

    /* ---------- tap targets: >=40 device px and not covered ---------- */
    await tapAt('#btnContinue').catch(()=>{});
    await p.waitForTimeout(700);
    const targets = await p.evaluate(() => {
      const out = [];
      document.querySelectorAll('#hud .touch, #hud .ico, #hud button, .screen.on button, .screen.on .ico').forEach(el => {
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height || getComputedStyle(el).pointerEvents === 'none') return;
        const cx = r.x + r.width/2, cy = r.y + r.height/2;
        const hit = document.elementFromPoint(cx, cy);
        out.push({ id: el.id || el.className, w: Math.round(r.width), h: Math.round(r.height),
          reachable: !!hit && (hit === el || el.contains(hit)),
          onScreen: r.x >= 0 && r.y >= 0 && r.right <= innerWidth + 1 && r.bottom <= innerHeight + 1 });
      });
      return out;
    });
    const tiny = targets.filter(t => t.h < 40 || t.w < 40);
    const covered = targets.filter(t => !t.reachable);
    const off = targets.filter(t => !t.onScreen);
    const deadButtons = await p.evaluate(() => {
      const out = [];
      document.querySelectorAll('#ui *').forEach(el => {
        if (getComputedStyle(el).pointerEvents !== 'none') return;
        el.querySelectorAll('button').forEach(bt => {
          const r = bt.getBoundingClientRect();
          if (!r.width || !r.height) return;
          const hit = document.elementFromPoint(r.x + r.width/2, r.y + r.height/2);
          if (hit !== bt && !bt.contains(hit)) out.push(bt.id || bt.textContent.trim().slice(0,14));
        });
      });
      return out;
    });
    ok(deadButtons.length === 0, 'no button is made inert by a transparent ancestor', deadButtons);
    ok(targets.length >= 4, 'interactive controls are present', targets.length);
    ok(tiny.length === 0, 'every control is a ≥40px thumb target', tiny);
    ok(covered.length === 0, 'no control is covered by another element', covered);
    ok(off.length === 0, 'every control is fully on screen', off);

    /* ---------- touch steering (real touch events on the canvas) ---------- */
    const cv = await p.$('#cv');
    const cb = await cv.boundingBox();
    const midX = cb.x + cb.width/2, midY = cb.y + cb.height*0.55;
    /* hold the finger down and sample DURING the hold — a released drag is meant to reset */
    const before = await p.evaluate(() => ({ lat: Math.round(G.lat*10), steer: +G.steer.toFixed(2) }));
    await cdp.send('Input.dispatchTouchEvent', { type:'touchStart', touchPoints:[{ x:midX, y:midY }] });
    for (let i = 1; i <= 14; i++) {
      await cdp.send('Input.dispatchTouchEvent', { type:'touchMove', touchPoints:[{ x: midX + i*9, y: midY }] });
      await p.waitForTimeout(16);
    }
    const right = await p.evaluate(() => ({ lat: Math.round(G.lat*10), steer: +G.steer.toFixed(2), dragging: !!dragging }));
    for (let i = 14; i >= -14; i--) {
      await cdp.send('Input.dispatchTouchEvent', { type:'touchMove', touchPoints:[{ x: midX + i*9, y: midY }] });
      await p.waitForTimeout(16);
    }
    const left = await p.evaluate(() => ({ lat: Math.round(G.lat*10), steer: +G.steer.toFixed(2) }));
    await cdp.send('Input.dispatchTouchEvent', { type:'touchEnd', touchPoints:[] });
    await p.waitForTimeout(150);
    const released = await p.evaluate(() => ({ steer: +G.steer.toFixed(2), dragging: !!dragging }));
    ok(right.dragging, 'touch press is picked up by the steering layer', right);
    ok(right.lat > before.lat || right.steer !== before.steer, 'dragging right steers right', { before, right });
    ok(left.lat < right.lat || left.steer !== right.steer, 'dragging back left steers left', { right, left });
    ok(released.steer === 0 && !released.dragging, 'lifted finger releases the steering', released);

    /* ---------- horn by tap (crews depend on it) ---------- */
    const horn = await p.evaluate(() => G.owa);
    await tapAt('#btnHorn'); await p.waitForTimeout(200);
    ok(await p.evaluate(h => G.owa > h, horn), 'horn fires from a thumb tap');

    /* ---------- one-thumb play: never touch gas or brake ---------- */
    const play = await p.evaluate(async () => {
      const t0 = performance.now(); const d0 = G.dist;
      let stops = 0, queueSeen = 0;
      while (performance.now() - t0 < 45000) {
        await new Promise(r => setTimeout(r, 100));
        stops = G.stops.filter(s => s.touched).length;
        queueSeen = Math.max(queueSeen, G.boardQueue || 0);
        const curb = G.stops[G.stopI];
        if (curb && curb.crew && curb.crew.alive > 0 &&
            Math.abs(curb.z - G.dist) < curb.box + 60 && !curb.crew.tapped) {
          const b = document.getElementById('btnHorn').getBoundingClientRect();
          const ev = t => new PointerEvent(t, { bubbles:true, cancelable:true,
            clientX: b.x + b.width/2, clientY: b.y + b.height/2, pointerId: 7, pointerType: 'touch', isPrimary: true });
          document.getElementById('btnHorn').dispatchEvent(ev('pointerdown'));
          document.getElementById('btnHorn').dispatchEvent(ev('pointerup'));
          curb.crew.tapped = 1;
        }
      }
      return { dist: Math.round(G.dist - d0), speed: Math.round(G.speed*KMH), stopsServed: stops,
        dropped: G.paxDropped, queueSeen, mode: G.mode, hp: Math.round(G.hp), credits: Math.round(G.credits) };
    });
    ok(play.dist > 500, 'bus drives itself while you only steer', play);
    ok(play.stopsServed >= 1, 'at least one stop served one-handed', play);
    ok(play.dropped >= 1, 'passengers were dropped off one-handed', play);
    await p.screenshot({ path:'/home/user/qa/shots/50-' + d.name + '-drive.png' });

    /* ---------- safe areas: HUD must respect a notch and a home bar ---------- */
    const safe = await p.evaluate(() => {
      const de = document.documentElement;
      const hasVars = ['--sat','--sab','--sal','--sar'].every(v => getComputedStyle(de).getPropertyValue(v).trim() !== '');
      const before = document.getElementById('stage').getBoundingClientRect();
      de.style.setProperty('--sat', '47px'); de.style.setProperty('--sab', '34px');
      de.style.setProperty('--sal', '0px');  de.style.setProperty('--sar', '0px');
      fit();
      const after = document.getElementById('stage').getBoundingClientRect();
      const hudTop = document.querySelector('#hud .top') || document.getElementById('hud');
      const pedals = document.getElementById('pedals').getBoundingClientRect();
      return { hasVars, dy: Math.round(after.y - before.y), shrankBy: Math.round(before.height - after.height),
        notch: 47, homeBar: 34,
        pedalsInside: pedals.bottom <= window.innerHeight - 34 + 1,
        hudInside: hudTop.getBoundingClientRect().y >= 47 - 1,
        stageInside: after.y >= 47 - 1 && after.bottom <= window.innerHeight - 34 + 1 };
    });
    ok(safe.hasVars, 'safe-area custom properties are defined');
    ok(safe.stageInside && safe.dy >= 0, 'the game stays clear of a 47px notch', safe);
    ok(safe.stageInside, 'notch + home bar stay clear of the game area', safe);
    ok(safe.pedalsInside, 'pedals sit above the home bar', safe);

    /* ---------- landscape: tell the player to rotate ---------- */
    await p.setViewportSize({ width:d.h, height:d.w });
    await p.waitForTimeout(400);
    const land = await p.evaluate(() => {
      const el = document.getElementById('rotateHint');
      const vis = el ? getComputedStyle(el).display !== 'none' && getComputedStyle(el).visibility !== 'hidden' : false;
      const r = document.getElementById('stage').getBoundingClientRect();
      return { exists: !!el, visible: vis, stageW: Math.round(r.width), vw: innerWidth };
    });
    ok(land.exists && land.visible, 'landscape shows a rotate hint', land);
    await p.screenshot({ path:'/home/user/qa/shots/51-' + d.name + '-landscape.png' });
    await p.setViewportSize({ width:d.w, height:d.h });
    await p.waitForTimeout(300);
    const back = await p.evaluate(() => {
      const el = document.getElementById('rotateHint');
      return el ? getComputedStyle(el).display === 'none' : false; });
    ok(back, 'rotate hint goes away in portrait');

    /* ---------- the menu screens are usable by thumb ---------- */
    for (const [scr, sel] of [['home','#scr-home'], ['account','#scr-account'], ['board','#scr-board'], ['set','#scr-set']]) {
      await p.evaluate(s => show('scr-' + s), scr);
      await p.waitForTimeout(350);
      const bad = await p.evaluate(sel => {
        const root = document.querySelector(sel);
        const over = document.documentElement.scrollWidth - innerWidth;
        const small = [], unreachable = [];
        const scrollables = [].slice.call(root.querySelectorAll('.scroll, [style*="overflow-x"]'));
        const scroller = scrollables.find(s => s.scrollHeight > s.clientHeight + 1);
        if (scroller) scroller.scrollTop = scroller.scrollHeight;   // audit the bottom of the list too
        root.querySelectorAll('button').forEach(bt => {
          const r = bt.getBoundingClientRect();
          if (!r.width) return;
          if (r.height < 34) small.push(bt.id || bt.textContent.slice(0,12));
          else if (r.right > innerWidth + 1 && !bt.closest('[style*="overflow-x"]') &&
                   !bt.closest('.strip')) unreachable.push(bt.id || bt.textContent.slice(0,12));
        });
        return { over, small, unreachable, visible: root.classList.contains('on'),
          scrollable: !!scroller, belowFold: scroller ? scroller.scrollHeight - scroller.clientHeight : 0 };
      }, sel);
      ok(bad.visible && bad.over <= 1 && bad.small.length === 0 && bad.unreachable.length === 0,
        scr + ' screen fits and its buttons are tappable (scrolls if long: ' + bad.scrollable + ')', bad);
    }
    await p.screenshot({ path:'/home/user/qa/shots/52-' + d.name + '-account.png' });

    ok(errs.length === 0, 'no page errors during the whole session', errs.slice(0,3));
    await ctx.close();
  }
  console.log('\n=== MOBILE: ' + pass + ' passed, ' + fail + ' failed ===');
  await b.close();
  process.exit(0);
})();
