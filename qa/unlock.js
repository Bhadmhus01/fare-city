/* Can you actually drive everywhere? Gates, unlocks, and a wheel-turn in all 30 routes. */
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args:['--no-sandbox','--autoplay-policy=no-user-gesture-required'] });
  const p = await b.newPage({ viewport:{width:540,height:960} });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://127.0.0.1:8080/index.html', { waitUntil:'load' });
  await p.waitForTimeout(1100);
  await p.evaluate(() => { try { $('#btnCookYes').click(); } catch(e){} });

  const gate = await p.evaluate(() => {
    const fresh = JSON.parse(JSON.stringify(save.routeStars));
    save.routeStars = {}; persist();
    const closedInitially = CITY_PACKS.filter(c => !cityOpen(c)).map(c => c.id);
    const ladder = CITY_PACKS.map(c => ({ city: c.id, req: c.starsReq || 0, openAt0: cityOpen(c) }));
    /* award stars route by route, in the shipped order, and record when each city opens */
    const opens = {};
    let awarded = 0;
    for (const c of CITY_PACKS) for (const r of c.routes) for (let s = 1; s <= 3; s++) {
      save.routeStars[r.id] = s; awarded++;
      CITY_PACKS.forEach(x => { if (!cityOpen(x)) return; if (opens[x.id] === undefined) opens[x.id] = awarded; });
    }
    const totalEarnable = CITY_PACKS.reduce((n,c)=>n + c.routes.length*3, 0);
    const allOpen = CITY_PACKS.every(cityOpen);
    save.routeStars = fresh; persist();
    return { closedInitially, ladder, opens, totalEarnable, allOpen, starsAtEnd: awarded };
  });
  console.log('FRESH SAVE: open =', ['lagos'].concat([]).join(','), '· closed =', gate.closedInitially.join(', '));
  console.log('GATES:', gate.ladder.map(l => l.city + ' ' + l.req).join(' · '));
  console.log('OPENS AFTER N STARS:', CITY_PACKS_ORDER(gate.opens));
  console.log('STARS EARMABLE:', gate.totalEarnable, '· everything open at the end:', gate.allOpen);

  /* now actually drive: every route of every city, wheels turning, nothing on fire */
  const drive = await p.evaluate(() => {
    const out = [];
    const bad = [];
    CITY_PACKS.forEach(c => {
      save.routeStars = {};                       // gate state must not matter for the drive test
      c.routes.forEach((r, i) => {
        try {
          startRun(c.id, i);
          G.gas = true;
          for (let k = 0; k < 240; k++) update(1/60);   // 4 seconds of driving
          out.push({ city: c.id, route: r.id, veh: G.city.vehicle, cur: G.city.cur.sym,
            hazards: (G.city.hazards||[]).length, stops: G.stops.length, crew: !!G.city.street,
            native: !!(r.stopsNative && r.stopsNative[0]), dist: Math.round(G.dist), speed: Math.round(G.speed*KMH),
            mode: G.mode });
        } catch (e) { bad.push(c.id + '/' + r.id + ': ' + e.message); }
      });
    });
    return { out, bad };
  });
  const byCity = {};
  drive.out.forEach(r => { (byCity[r.city] = byCity[r.city] || []).push(r); });
  console.log('\nDRIVE TEST (4 s of gas on each route):');
  Object.keys(byCity).forEach(k => {
    const rs = byCity[k];
    console.log('  ' + k.padEnd(9) + rs.map(r => r.route + ' ' + r.veh.padEnd(13) +
      String(r.speed).padStart(2) + 'km/h d=' + String(r.dist).padStart(4) + ' ' + r.cur +
      (r.crew ? ' crew' : '     ') + (r.native ? ' script' : '       ') +
      ' haz' + r.hazards).join('\n' + ' '.repeat(11)));
  });
  const moving = drive.out.filter(r => r.dist > 100 && r.mode === 'run').length;
  console.log('\nMOVED: ' + moving + '/' + drive.out.length + ' routes drove 4 s without stalling');
  console.log('EXCEPTIONS:', drive.bad.length ? drive.bad.join(' | ') : 'none');
  console.log('PAGE ERRORS:', errs.length ? errs.slice(0,3).join(' | ') : 'none');
  await b.close();
})();
function CITY_PACKS_ORDER(o){ return Object.keys(o).map(k => k + '@' + o[k] + '★').join(' · '); }
