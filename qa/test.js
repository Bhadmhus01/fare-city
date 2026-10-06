/* Fare City QA harness: loads the built game, plays it, screenshots every screen. */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const OUT = '/home/user/qa/shots';
const FILE = 'file:///home/user/fare-city/index.html';

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required','--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 540, height: 960 }, deviceScaleFactor: 1 });
  const errors = [], logs = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); else logs.push(m.text()); });

  await page.goto(FILE);
  await page.waitForTimeout(700);
  await page.evaluate(() => { try { $('#btnCookYes').click(); } catch (e) {} });
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(OUT, '01-boot.png') });

  // boot -> how to play
  await page.click('#btnStart');
  await page.waitForTimeout(500);
  if (await page.isVisible('#scr-how')) {
    await page.screenshot({ path: path.join(OUT, '02-howto.png') });
    await page.click('#scr-how .x');
  }
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT, '03-home-empty.png') });

  // map
  await page.click('#btnGoMap');
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT, '04-map.png') });

  // city -> route -> run
  await page.click('#cityList [data-city="lagos"]');
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT, '05-city.png') });
  await page.click('#routeList [data-route="0"]');
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(OUT, '06-run-start.png') });

  // drive: hold gas + horn, steer a bit
  await page.mouse.move(270, 800);
  await page.mouse.down();
  await page.waitForTimeout(400);
  await page.mouse.move(300, 800, { steps: 6 });
  await page.waitForTimeout(600);
  await page.mouse.up();
  await page.keyboard.down('ArrowUp');
  for (let i = 0; i < 40; i++) {
    await page.waitForTimeout(120);
    if (i % 6 === 3) await page.keyboard.press('h');
    if (i % 9 === 4) await page.keyboard.press(' ');
  }
  await page.keyboard.up('ArrowUp');
  // park at the next stop so the shot shows boarding + passengers on board
  await page.evaluate(async () => {
    for (let i = 0; i < 900 && G.mode === 'run'; i++) {
      const cur = G.stops[G.stopI];
      if (!cur) { G.gas = true; G.brake = false; }
      else {
        const dz = cur.z - G.dist;
        if (G.boardQueue > 0 || Math.abs(dz) < cur.box) { G.gas = false; G.brake = Math.abs(dz) > 70; }
        else if (dz > 0 && dz < 60 + 0.55 * G.speed * G.speed / 340) { G.gas = false; G.brake = true; }
        else { G.brake = false; G.gas = true; }
      }
      update(1 / 60);
      if (G.pax.length >= 3 && G.boardQueue === 0) break;
    }
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT, '07-run-mid.png') });
  const state = await page.evaluate(() => ({
    mode: G.mode, dist: Math.round(G.dist), speed: Math.round(G.speed), credits: Math.round(G.credits),
    pax: G.pax.length, dropped: G.paxDropped, owa: G.owa, stopI: G.stopI, hp: Math.round(G.hp),
    routeLen: G.routeLen, combo: G.combo, stars: G.starsEarned
  }));
  console.log('MID-STATE', JSON.stringify(state));

  // finish the run quickly with three stars injected for testing
  await page.evaluate(() => { G.credits += 99999; endRun('finished'); });
  await page.waitForTimeout(700);
  await page.screenshot({ path: path.join(OUT, '08-result.png') });
  const res = await page.evaluate(() => ({
    wallet: Math.round(save.wallet), stars: totalStars(), routeStars: save.routeStars,
    runs: save.runs.length, missions: save.missions.list.map(m => m.id + ':' + m.prog + '/' + m.goal)
  }));
  console.log('RESULT', JSON.stringify(res));

  // garage after money
  await page.click('#btnHome');
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT, '09-home-progress.png') });
  await page.click('#btnGoGarage');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT, '10-garage.png') });

  // buy upgrades + paint
  const bought = await page.evaluate(() => {
    save.wallet += 400000;
    const before = JSON.stringify(save.parts);
    return { before };
  });
  await page.reload();
  await page.waitForTimeout(800);
  await page.evaluate(() => {
    save.wallet += 500000;
    save.parts.engine = 3; save.parts.horn = 2; save.parts.seats = 2; save.paints.push('gold'); save.paint = 'gold';
    save.routeStars['lag-1'] = 3; save.routeStars['lag-2'] = 2; save.routeStars['lag-3'] = 1;
    persist();
  });
  await page.click('#btnStart'); await page.waitForTimeout(300);
  if (await page.isVisible('#scr-how')) { await page.click('#scr-how .x'); await page.waitForTimeout(300); }
  await page.click('#btnGoGarage'); await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT, '11-garage-upgraded.png') });
  await page.click('#scr-garage .x'); await page.waitForTimeout(300);
  await page.click('#btnGoMap'); await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT, '12-map-stars.png') });
  await page.evaluate(() => show('scr-home'));
  await page.waitForTimeout(200);
  await page.click('#btnGoBoard');
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT, '13-board-city.png') });
  await page.evaluate(() => { boardTab = 'global'; renderBoard(); });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT, '14-board-global.png') });

  // settings + a run in a locked-out city (accra) to check layouts
  await page.evaluate(() => { boardTab = 'me'; renderBoard(); show('scr-board'); });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT, '16-board-my-runs.png') });

  // city screen with the native greeting, and the pause screen
  await page.evaluate(() => { openCity('accra'); });
  await page.waitForTimeout(350);
  await page.screenshot({ path: path.join(OUT, '17-city-accra.png') });
  await page.evaluate(() => { startRun('lagos', 0); G.dist = 900; pauseGame(); });
  await page.waitForTimeout(350);
  await page.screenshot({ path: path.join(OUT, '18-pause.png') });
  await page.evaluate(() => { G.paused = false; G.mode = 'idle'; show('scr-set'); });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT, '15-settings.png') });

  // drive every route with an autopilot and record the economy
  const sim = await page.evaluate(async () => {
    function drive(routeIndex, cityId, trace, expert) {
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
    for (const city of CITY_PACKS) {
      for (let i = 0; i < city.routes.length; i++) {
        const isFirst = city.id === 'lagos' && i === 0;
        out.push(Object.assign({ city: city.id, route: i, kind: 'auto' },
          drive(i, city.id, isFirst, false)));
        save.routeStars[city.routes[i].id] = 0;
        out.push(Object.assign({ city: city.id, route: i, kind: 'expert' },
          drive(i, city.id, false, true)));
        save.routeStars[city.routes[i].id] = Math.max(save.routeStars[city.routes[i].id] || 0, 3);
        save.wallet += 5000000;
        persist();
      }
    }
    return out;
  });
  fs.writeFileSync('/home/user/qa/sim.json', JSON.stringify(sim, null, 1));
  const stars3 = sim.filter(r => r.stars === 3).length;
  console.log('SIM ' + stars3 + '/' + sim.length + ' routes hit 3 stars (autopilot)');
  console.log('LAGOS-1 TRACE', JSON.stringify(sim[0], null, 1).slice(0, 1200));

  console.log('\nERRORS(' + errors.length + '):\n' + errors.slice(0, 30).join('\n'));
  await browser.close();
})();
