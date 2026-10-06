/* End-to-end: the real game, served by the real server, signed in, posting, syncing. */
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args:['--no-sandbox','--autoplay-policy=no-user-gesture-required'] });
  const p = await b.newPage({ viewport:{width:540,height:960} });
  const errs=[]; p.on('pageerror', e=>errs.push('page: '+e.message));
  p.on('console', m => { if (m.type()==='error') errs.push('console: '+m.text()); });
  await p.goto('http://127.0.0.1:8080/index.html', { waitUntil:'load' });
  await p.waitForTimeout(1400);

  const mode = await p.evaluate(() => ({ mode: NET.mode, base: NET.base, server: NET.server }));
  console.log('BOARD MODE', JSON.stringify(mode));

  // does the client agree with the server about today's route?
  const agree = await p.evaluate(async () => {
    const local = dailyPick();
    const r = await fetch('/api/daily'); const remote = await r.json();
    return { local: local.city + ':' + local.route, remote: remote.city + ':' + remote.route,
      localCityId: local.cityObj.routes[local.route].id,
      same: local.cityObj.routes[local.route].id === remote.route };
  });
  console.log('DAILY PICK', JSON.stringify(agree));

  // sign in through the real UI
  const name = 'Driver' + Date.now().toString().slice(-5);
  await p.evaluate(() => $('#btnCookYes') && $('#btnCookYes').click());
  await p.evaluate(() => show('scr-account'));
  await p.fill('#inpUser', name);
  await p.fill('#inpPass', 'correct-horse-1');
  await p.click('#btnRegister');
  await p.waitForTimeout(900);
  const signed = await p.evaluate(() => ({ acct: save.acct && save.acct.name, chip: $('#acctChip').textContent,
    cta: $('#acctCta').textContent, note: $('#boardModeNote').textContent.slice(0,90) }));
  console.log('SIGNED IN', JSON.stringify(signed));
  await p.screenshot({ path:'/home/user/qa/shots/30-account.png' });

  // play a real route, then let the run end and post
  const run = await p.evaluate(async () => {
    startRun('lagos', 0);
    let guard = 0;
    while (G.mode === 'run' && guard++ < 9000) {
      const dt = 1/60, cur = G.stops[G.stopI];
      if (cur) {
        const dz = cur.z - G.dist;
        const dwelling = Math.abs(dz) < cur.box && G.speed < 46 && !cur.touched;
        const crew = cur.crew && cur.crew.alive > 0;
        if (crew && Math.abs(dz) < cur.box) { G.lastHorn = -1; horn(); }
        if (G.boardQueue > 0 || dwelling) { G.gas=false; G.brake=Math.abs(dz)>90; }
        else if (cur.touched) { G.gas=true; G.brake=false; }
        else if (dz > 0 && dz < 60 + 0.55*G.speed*G.speed/340) { G.gas=false; G.brake=true; }
        else { G.gas=true; G.brake=false; }
      } else { G.gas = true; }
      const near = G.hazards.concat(G.agents).filter(o => o.t!=='checkpoint' && o.kind!=='crew' &&
        o.z-G.dist>40 && o.z-G.dist<620 && Math.abs(o.lat-G.lat)<66)[0];
      G.steer = near ? (near.lat >= G.lat ? -1 : 1) : 0;
      update(dt);
    }
    return { credits: Math.round(G.credits), stars: G.starsEarned, pax: G.paxDropped,
      crewTax: Math.round(G.crewsTax||0), scattered: G.crewScattered||0, sig: G.sigDone,
      crews: G.stops.filter(s=>s.crew).length, evFired: !!G.ev || G.evT < 20, mode: G.mode };
  });
  console.log('RUN', JSON.stringify(run));
  await p.waitForTimeout(1500);   // let the post land
  const posted = await p.evaluate(async () => {
    const r = await fetch('/api/board?city=lagos&scope=city'); const j = await r.json();
    return { mine: j.rows.filter(x => x.name === save.acct.name), count: j.rows.length };
  });
  console.log('POSTED', JSON.stringify(posted));

  // cloud save round trip
  const cloud = await p.evaluate(async () => {
    save.wallet = 987654; persist();
    await netPushProgress();
    return { cloudAt: !!save.cloudAt };
  });
  console.log('CLOUD PUSH', JSON.stringify(cloud));

  // boards rendered from the server
  await p.evaluate(() => { boardTab = 'city'; show('scr-board'); });
  await p.waitForTimeout(900);
  const boardTxt = await p.evaluate(() => ({ rows: $$('#boardList .board').length, meta: $('#boardMeta').textContent,
    note: $('#boardNote').textContent.slice(0,60) }));
  console.log('LIVE BOARD', JSON.stringify(boardTxt));
  await p.screenshot({ path:'/home/user/qa/shots/31-live-board.png' });
  await p.evaluate(() => { boardTab='daily'; renderBoard(); });
  await p.waitForTimeout(700);
  await p.screenshot({ path:'/home/user/qa/shots/32-live-daily.png' });

  // home shows the daily card + signed-in CTA
  await p.evaluate(() => show('scr-home'));
  await p.waitForTimeout(500);
  const home = await p.evaluate(() => ({ daily: $('#dailyTitle').textContent, sub: $('#dailySub').textContent,
    cta: $('#acctCta').textContent }));
  console.log('HOME', JSON.stringify(home));
  await p.screenshot({ path:'/home/user/qa/shots/33-home-live.png' });

  console.log('ERRORS', errs.length, errs.slice(0,4).join(' | '));
  await b.close();
})();
