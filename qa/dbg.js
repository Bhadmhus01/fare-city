const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args:['--no-sandbox'] });
  const p = await b.newPage({ viewport:{width:540,height:960} });
  p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto('file:///home/user/fare-city/index.html');
  await p.waitForTimeout(600);
  const out = await p.evaluate(() => {
    $('#btnCookYes') && $('#btnCookYes').click();
    A.init(); startRun('lagos', 0);
    const log = [];
    let guard = 0;
    while (G.mode === 'run' && guard++ < 6000) {
      const dt = 1/60;
      const cur = G.stops[G.stopI];
      const dz = cur ? cur.z - G.dist : 0;
      if (cur) {
        const dwelling = Math.abs(dz) < cur.box && G.speed < 46 && !cur.touched;
        if (G.boardQueue > 0 || dwelling) { G.gas=false; G.brake=Math.abs(dz)>90; }
        else if (cur.touched) { G.brake=false; G.gas=true; }
        else if (dz > 0 && dz < 60 + 0.55*G.speed*G.speed/340) { G.gas=false; G.brake=true; }
        else { G.brake=false; G.gas=true; }
      }
      update(dt);
      if (guard % 120 === 0) log.push([guard, Math.round(G.dist), Math.round(G.speed), Math.round(dz),
        cur ? cur.touched|0 : '-', G.boardQueue, G.pax.length, G.paxDropped, Math.round(G.credits)]);
    }
    return { log: log.slice(0, 60), mode: G.mode, paused: G.paused, stopI: G.stopI,
      stops: G.stops.map(s=>({i:s.i,z:s.z,touched:!!s.touched,done:!!s.done,missed:!!s.missed})) };
  });
  console.log(JSON.stringify(out, null, 0));
  await b.close();
})();
