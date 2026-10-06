const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args:['--no-sandbox'] });
  const p = await b.newPage({ viewport:{width:540,height:960} });
  p.on('pageerror', e => console.log('PAGEERR', e.message));
  await p.goto('http://localhost:8080/index.html', { waitUntil:'load' });
  await p.waitForTimeout(1000);
  const out = await p.evaluate(() => {
    startRun('lagos', 0);
    const s1 = G.stops[1];
    s1.crew = { cfg: G.city.street.crew, alive: 3, taxed: 0 };
    for (let k=0;k<3;k++) G.agents.push({ z:s1.z, lat: k===1?0:(k-1)*120, kind:'crew', t:'agent',
      scared:false, pat:k, colour:'#FFD23D', crewRef:s1.crew });
    G.dist = s1.z - 40; G.speed = 0;
    const before = G.agents.filter(o=>o.kind==='crew').length;
    // instrument: what does horn() see?
    const seen = [];
    G.agents.filter(o=>o.kind==='crew').forEach(o => seen.push({ t:o.t, dz: Math.round(o.z-G.dist), lat: Math.round(o.lat) }));
    G.lastHorn = -1;
    horn();
    return { before, seen, aliveAfter: s1.crew.alive, scattered: G.crewScattered,
      doneFlags: G.agents.filter(o=>o.kind==='crew').map(o=>o.done|0),
      hornFn: horn.toString().indexOf('crewRef') >= 0 };
  });
  console.log(JSON.stringify(out, null, 1));
  await b.close();
})();
