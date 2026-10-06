const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args:['--no-sandbox','--autoplay-policy=no-user-gesture-required'] });
  const ctx = await b.newContext({ viewport:{width:430,height:932}, deviceScaleFactor:3, isMobile:true, hasTouch:true });
  const p = await ctx.newPage();
  await p.goto('http://127.0.0.1:8080/index.html', { waitUntil:'load' });
  await p.waitForTimeout(1200);
  await p.evaluate(() => { try { $('#btnCookYes').click(); } catch(e){}; startRun('lagos', 0); });
  const out = await p.evaluate(async () => {
    const log = [];
    const t0 = performance.now();
    while (performance.now() - t0 < 70000) {
      await new Promise(r => setTimeout(r, 100));
      const curb = G.stops[G.stopI];
      if (curb && curb.crew && curb.crew.alive > 0 && Math.abs(curb.z - G.dist) < curb.box + 60 && !curb.crew.tapped) {
        const btn = document.getElementById('btnHorn');
        const bb = btn.getBoundingClientRect();
        const ev = t => new PointerEvent(t, { bubbles:true, cancelable:true, clientX: bb.x+bb.width/2, clientY: bb.y+bb.height/2, pointerId:7, pointerType:'touch', isPrimary:true });
        btn.dispatchEvent(ev('pointerdown')); btn.dispatchEvent(ev('pointerup'));
        curb.crew.tapped = 1;
      }
      if (Math.round((performance.now()-t0)/1000) % 3 === 0) {
        const last = log[log.length-1];
        const snap = { t: Math.round((performance.now()-t0)/1000), z: Math.round(G.dist), kmh: Math.round(G.speed*KMH),
          stopI: G.stopI, touched: G.stops.filter(s=>s.touched).length, q: G.boardQueue||0, pax: G.pax.length,
          cap: capacity(), dropped: G.paxDropped, crew: curb && curb.crew ? (curb.crew.alive + '/' + Math.round(curb.crew.held||0)) : '—',
          blocked: !!(curb && curb.crew && curb.crew.alive > 0) };
        if (!last || last.t !== snap.t || last.z !== snap.z || last.q !== snap.q) log.push(snap);
      }
    }
    return { log, dropped: G.paxDropped, dist: Math.round(G.dist), mode: G.mode };
  });
  out.log.forEach(l => console.log(JSON.stringify(l)));
  console.log('END dropped=' + out.dropped + ' dist=' + out.dist);
  await b.close();
})();
