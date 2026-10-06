const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args:['--no-sandbox'] });
  const ctx = await b.newContext({ viewport:{width:430,height:932}, deviceScaleFactor:3, isMobile:true, hasTouch:true });
  const p = await ctx.newPage();
  const cdp = await ctx.newCDPSession(p);
  await p.goto('http://127.0.0.1:8080/index.html', { waitUntil:'load' });
  await p.waitForTimeout(1200);
  await p.evaluate(() => { try { $('#btnCookYes').click(); } catch(e){} show('scr-home'); });
  await p.touchscreen.tap(215, 700).catch(()=>{});
  await p.waitForTimeout(300);
  // instrument: log every input event the canvas sees
  await p.evaluate(() => {
    window.__log = [];
    const cv = document.getElementById('cv');
    ['pointerdown','pointermove','pointerup','touchstart','touchmove','touchend','mousedown'].forEach(t => {
      cv.addEventListener(t, e => window.__log.push(t + ' @' + Math.round(e.clientX||0) + ',' + Math.round(e.clientY||0) +
        ' type=' + (e.pointerType||'-') + ' target=' + (e.target.id||e.target.tagName)), true);
    });
    window.__before = { mode: G.mode, dragging: !!dragging };
  });
  const st = await p.evaluate(() => window.__before);
  const cvb = await (await p.$('#cv')).boundingBox();
  const x = cvb.x + cvb.width/2, y = cvb.y + cvb.height*0.55;
  console.log('canvas box', JSON.stringify(cvb), '→ touching', Math.round(x), Math.round(y), 'game', JSON.stringify(st));
  await cdp.send('Input.dispatchTouchEvent', { type:'touchStart', touchPoints:[{ x, y }] });
  await p.waitForTimeout(80);
  for (let i=1;i<=8;i++){ await cdp.send('Input.dispatchTouchEvent', { type:'touchMove', touchPoints:[{ x: x+i*10, y }] }); await p.waitForTimeout(20); }
  const mid = await p.evaluate(() => ({ dragging: dragging ? { x:Math.round(dragging.x), moved:Math.round(dragging.moved) } : null, steer:+G.steer.toFixed(2), lat:Math.round(G.lat), mode:G.mode, log: window.__log.slice(0,8) }));
  await cdp.send('Input.dispatchTouchEvent', { type:'touchEnd', touchPoints:[] });
  console.log('DURING', JSON.stringify(mid, null, 1));
  // what element is actually at that point?
  const hit = await p.evaluate(([x,y]) => { const el = document.elementFromPoint(x,y); return el ? (el.id||el.tagName) + ' class=' + el.className + ' pe=' + getComputedStyle(el).pointerEvents : 'none'; }, [x,y]);
  console.log('elementFromPoint:', hit);
  // and does a plain mouse drag work (sanity check of the handler itself)?
  await p.mouse.move(x, y); await p.mouse.down();
  for (let i=1;i<=8;i++){ await p.mouse.move(x+i*10, y); await p.waitForTimeout(20); }
  const mouse = await p.evaluate(() => ({ dragging: !!dragging, steer: +G.steer.toFixed(2), lat: Math.round(G.lat) }));
  await p.mouse.up();
  console.log('MOUSE DRAG', JSON.stringify(mouse));
  await b.close();
})();
