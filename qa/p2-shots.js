/* Phase-2 screen shots: codex, crew at the stop, condition, account, daily, result. */
const { chromium } = require('playwright');
const OUT = '/home/user/qa/shots';
(async () => {
  const b = await chromium.launch({ args:['--no-sandbox','--autoplay-policy=no-user-gesture-required'] });
  const p = await b.newPage({ viewport:{ width:540, height:960 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://127.0.0.1:8080/index.html', { waitUntil:'load' });
  await p.waitForTimeout(1100);
  await p.evaluate(() => { try { $('#btnCookYes').click(); } catch(e){} });

  await p.screenshot({ path: OUT + '/40-home-daily.png' });

  /* city screen with the codex open */
  await p.evaluate(() => { openCity('lagos'); setTimeout(() => { try { renderCodex(cityById('lagos')); } catch(e){} }, 60); });
  await p.waitForTimeout(600);
  await p.screenshot({ path: OUT + '/41-city-codex.png' });

  /* a run: park on a crewed stop and let the crew tax + condition fire */
  await p.evaluate(() => {
    startRun('lagos', 0);
    const s = G.stops[1];
    s.crew = { cfg: G.city.street.crew, alive: 3, taxed: 0 };
    for (let k=0;k<3;k++) G.agents.push({ z:s.z - 40 + k*40, lat:(k-1)*95, kind:'crew', t:'agent',
      scared:false, pat:k, colour:'#FFD23D', crewRef:s.crew });
    G.dist = s.z - 70; G.speed = 0; G.gas = false; G.brake = true;
    for (let i=0;i<150;i++) update(1/60);
  });
  await p.waitForTimeout(300);
  await p.screenshot({ path: OUT + '/42-crew-at-stop.png' });

  /* a condition on screen */
  await p.evaluate(() => {
    startRun('cairo', 0);
    G.dist = 900; G.speed = 40;
    G.evT = 0.05;
    for (let i=0;i<200;i++) update(1/60);
  });
  await p.waitForTimeout(400);
  await p.screenshot({ path: OUT + '/43-condition.png' });

  /* result screen with the signature line */
  await p.evaluate(() => {
    startRun('accra', 0);
    G.dist = 800; G.credits = 900000; G.paxDropped = 12; G.maxPax = 6; G.isPerfect = true;
    G.boardHorn = 5; G.topCombo = 3;
    G.dist = G.routeLen; update(1/60);
  });
  await p.waitForTimeout(600);
  await p.screenshot({ path: OUT + '/44-result-signature.png' });

  /* account screen, signed out */
  await p.evaluate(() => { show('scr-account'); renderAccount(); });
  await p.waitForTimeout(400);
  await p.screenshot({ path: OUT + '/45-account.png' });

  /* register, then show the signed-in state + board */
  const nm = 'Ada' + Date.now().toString().slice(-5);
  await p.fill('#inpUser', nm); await p.fill('#inpPass', 'lagos-danfo-1');
  await p.click('#btnRegister');
  await p.waitForTimeout(1200);
  await p.screenshot({ path: OUT + '/46-account-live.png' });
  await p.evaluate(() => { boardTab='city'; show('scr-board'); });
  await p.waitForTimeout(900);
  await p.screenshot({ path: OUT + '/47-board-live.png' });

  console.log('SHOTS 40-47 written · errors', errs.length, errs.slice(0,3).join(' | '));
  await b.close();
})();
