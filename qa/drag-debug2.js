const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args:['--no-sandbox'] });
  const ctx = await b.newContext({ viewport:{width:430,height:932}, deviceScaleFactor:3, isMobile:true, hasTouch:true });
  const p = await ctx.newPage();
  const cdp = await ctx.newCDPSession(p);
  await p.goto('http://127.0.0.1:8080/index.html', { waitUntil:'load' });
  await p.waitForTimeout(1200);
  await p.evaluate(() => { try { $('#btnCookYes').click(); } catch(e){}; startRun('lagos', 0); });
  await p.waitForTimeout(400);
  const cvb = await (await p.$('#cv')).boundingBox();
  const x = cvb.x + cvb.width/2, y = cvb.y + cvb.height*0.55;
  const probe = await p.evaluate(([x,y]) => {
    const chain = []; let el = document.elementFromPoint(x,y);
    while (el && chain.length < 6) { chain.push(el.tagName + '#' + (el.id||'-') + '.' + (el.className||'-') +
      ' pe=' + getComputedStyle(el).pointerEvents + ' z=' + getComputedStyle(el).zIndex + ' pos=' + getComputedStyle(el).position); el = el.parentElement; }
    const scr = [].slice.call(document.querySelectorAll('.screen')).filter(s => getComputedStyle(s).display !== 'none').map(s => s.id);
    return { chain, mode: G.mode, hudOn: document.getElementById('hud').classList.contains('on'), visibleScreens: scr };
  }, [x,y]);
  console.log('AT CENTRE (' + Math.round(x) + ',' + Math.round(y) + '):', JSON.stringify(probe, null, 1));
  await cdp.send('Input.dispatchTouchEvent', { type:'touchStart', touchPoints:[{ x, y }] });
  await p.waitForTimeout(60);
  for (let i=1;i<=8;i++){ await cdp.send('Input.dispatchTouchEvent', { type:'touchMove', touchPoints:[{ x:x+i*10, y }] }); await p.waitForTimeout(20); }
  console.log('TOUCH DRAG →', JSON.stringify(await p.evaluate(() => ({ dragging: !!dragging, steer:+G.steer.toFixed(2), lat: Math.round(G.lat) }))));
  await cdp.send('Input.dispatchTouchEvent', { type:'touchEnd', touchPoints:[] });
  await p.mouse.move(x,y); await p.mouse.down();
  for (let i=1;i<=8;i++){ await p.mouse.move(x+i*10,y); await p.waitForTimeout(20); }
  console.log('MOUSE DRAG →', JSON.stringify(await p.evaluate(() => ({ dragging: !!dragging, steer:+G.steer.toFixed(2), lat: Math.round(G.lat) }))));
  await p.mouse.up();
  await b.close();
})();
