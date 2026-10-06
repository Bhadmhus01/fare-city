/* Economy sim (memory-safe): the proven test.js autopilot, driven one city at a time. */
const { chromium } = require('playwright');
const FILE = 'http://127.0.0.1:8080/index.html';
const DRIVE_SRC = `    function drive(routeIndex, cityId, trace, expert) {
      startRun(cityId, routeIndex);
      const lap = { stops: [], events: [], guard: 0 };
      let dwell = 0;
      while (G.mode === 'run' && lap.guard++ < 12000) {
        const dt = 1 / 60;
        const cur = G.stops[G.stopI];
        const lastStop = G.stops[G.stops.length - 1];
        // checkpoint etiquette: slow to under 90 through the pink box
        const cp = G.hazards.filter(o => o.t === 'checkpoint' && !o.passed && !o.fined &&
          o.z - G.dist > -100 && o.z - G.dist < 700)[0];
        if (cur) {
          const dz = cur.z - G.dist;
          const dwelling = Math.abs(dz) < cur.box && G.speed < 46 && !cur.touched;
          if (G.boardQueue > 0 || dwelling) { dwell += dt; G.gas = false; G.brake = Math.abs(dz) > 90; }
          else if (cur.touched) { G.brake = false; G.gas = true; dwell = 0; }
          else if (cp && G.speed > 80) { G.gas = false; G.brake = true; }
          else if (dz > 0 && dz < 60 + 0.55 * G.speed * G.speed / 340) { G.gas = false; G.brake = true; }
          else { G.brake = false; G.gas = true; dwell = 0; }
        } else { G.brake = false; G.gas = true; }
        // dodge anything on our lane
        const near = G.hazards.concat(G.agents).filter(o => o.t !== 'checkpoint' && o.z - G.dist > 40 &&
          o.z - G.dist < 620 && Math.abs(o.lat - G.lat) < 66)[0];
        G.steer = near ? (near.lat >= G.lat ? -1 : 1) : 0;
        // expert line: horn constantly to scatter the street and stack combo
        // horn has a wall-clock cooldown (correct in real play); the sim runs faster
        // than real time so clear it to model a player mashing the horn every 0.32s
        if (expert) { G.lastHorn = -1; horn(); if (Math.random() < 0.25) boost(); if (G.topCombo > 3.5) {} }
        else if (Math.random() < 0.03) { G.lastHorn = -1; horn(); }
        const before = G.stopI;
        update(dt);
        if (G.stopI !== before && trace) lap.stops.push({ stop: before, credits: Math.round(G.credits),
          pax: G.pax.length, dropped: G.paxDropped });
      }
      return { credits: Math.round(G.credits), pax: G.paxDropped, stars: G.starsEarned,
        missed: G.missed, fines: Math.round(G.fines), hp: Math.round(G.hp), mode: G.mode,
        ticks: lap.guard, owa: G.owa, stops: lap.stops, targets: starTargets(G.city, G.route),
        dist: Math.round(G.dist), combo: G.topCombo, tips: G.tips, cpp: creditsPerPax(G.city, G.route) };
    }
    const out = [];
    const city = CITY_PACKS[idx];
    for (let i = 0; i < city.routes.length; i++) {
      out.push(Object.assign({ city: city.id, route: i, kind: 'auto' }, drive(i, city.id, false, false)));
      out.push(Object.assign({ city: city.id, route: i, kind: 'expert' }, drive(i, city.id, false, true)));
    }
    return out;`;
(async () => {
  const b = await chromium.launch({ args:['--no-sandbox','--disable-dev-shm-usage','--autoplay-policy=no-user-gesture-required'] });
  const all = [];
  for (let i = 0; i < 10; i++) {
    const p = await b.newPage({ viewport:{width:540,height:960} });
    const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto(FILE, { waitUntil:'load' });
    await p.waitForTimeout(900);
    await p.evaluate(() => { try { $('#btnCookYes').click(); } catch(e){} });
    const rows = await p.evaluate(new Function('idx', DRIVE_SRC), i);
    rows.forEach(r => { all.push(r); });
    const c = rows.filter(r => r.kind === 'expert');
    console.log(rows[0].city.padEnd(9) +
      c.map(r => 'r' + r.route + ' ' + r.stars + '★ ₦' + String(r.credits).padStart(6) +
        ' pax' + String(r.pax).padStart(3) + ' owa' + String(r.owa).padStart(4) +
        ' cpp' + r.cpp.toFixed(0)).join(' | ') +
      (errs.length ? '  ERRORS ' + errs.length : ''));
    await p.close();
  }
  const three = all.filter(r => r.stars === 3).length;
  const two = all.filter(r => r.stars === 2).length;
  const one = all.filter(r => r.stars <= 1).length;
  console.log('\nTOTAL ' + all.length + ' runs: 3★ ' + three + ' \u00b7 2★ ' + two + ' \u00b7 \u22641★ ' + one);
  const x = all.filter(r => r.kind === 'expert');
  console.log('EXPERT only: ' + x.filter(r => r.stars === 3).length + '/' + x.length + ' hit 3★');
  const a = all.filter(r => r.kind === 'auto');
  console.log('AUTO only:   ' + a.filter(r => r.stars === 3).length + '/' + a.length + ' hit 3★');
  console.log('Sample targets (expert):', JSON.stringify(x[0].targets), 'example idx', x[0].credits);
  require('fs').writeFileSync('/home/user/qa/sim2.json', JSON.stringify(all, null, 1));
  await b.close();
  process.exit(0);
})();
