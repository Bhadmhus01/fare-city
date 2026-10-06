const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args:['--no-sandbox'] });
  // mid-range Android-ish: 4x CPU throttle + 2x DPR
  const p = await b.newPage({ viewport:{width:412,height:915}, deviceScaleFactor:2 });
  const cdp = await p.context().newCDPSession(p);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  const errs=[]; p.on('pageerror', e=>errs.push(e.message));
  await p.goto('file:///home/user/fare-city/index.html');
  await p.waitForTimeout(700);
  const res = await p.evaluate(async () => {
    $('#btnCookYes') && $('#btnCookYes').click();
    A.init(); startRun('mumbai', 0);
    // warm up, then time 240 real animation frames while driving
    await new Promise(r => setTimeout(r, 400));
    const times = [];
    let lastT = performance.now();
    return await new Promise(resolve => {
      let n = 0;
      function tick(){
        const now = performance.now();
        times.push(now - lastT); lastT = now;
        // autopilot
        G.gas = true; G.brake = G.stops[G.stopI] && (G.stops[G.stopI].z - G.dist) < 300;
        G.lastHorn = -1; if (n % 40 === 0) horn();
        n++;
        if (n < 700) requestAnimationFrame(tick);
        else {
          times.shift();
          const avg = times.reduce((a,c)=>a+c,0)/times.length;
          const sorted = times.slice().sort((a,c)=>a-c);
          const tail = times.slice(-240);
          const tAvg = tail.reduce((a,c)=>a+c,0)/tail.length;
          resolve({ settledFps: +(1000/tAvg).toFixed(1), eco: !!FX.eco, raster: FX.raster,
            frames: times.length, avgMs: +avg.toFixed(2),
            fps: +(1000/avg).toFixed(1), p50: +sorted[Math.floor(sorted.length/2)].toFixed(2),
            p95: +sorted[Math.floor(sorted.length*0.95)].toFixed(2), worst: +sorted[sorted.length-1].toFixed(2),
            particles: G.parts.length, hazards: G.hazards.length, agents: G.agents.length, npc: G.npc.length,
            potholesDrawn: G.hazards.length + G.agents.length + G.npc.length });
        }
      }
      requestAnimationFrame(tick);
    });
  });
  console.log('PERF (4x CPU throttle, 412x915 @2x):', JSON.stringify(res));
  console.log('ERRORS', errs.length, errs.slice(0,3).join(' | '));
  await b.close();
})();
