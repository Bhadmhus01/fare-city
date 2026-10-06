/* Mechanics tests for the street pack: crews, conditions, signatures, local script. */
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args:['--no-sandbox'] });
  const p = await b.newPage({ viewport:{width:540,height:960} });
  const errs=[]; p.on('pageerror', e=>errs.push(e.message));
  await p.goto('http://localhost:8080/index.html', { waitUntil:'load' });
  await p.waitForTimeout(1200);

  const res = await p.evaluate(() => {
    $('#btnCookYes') && $('#btnCookYes').click();
    const out = {};
    /* ---- 1. crew: blocks the box, taxes you, disperses on horn ---- */
    startRun('lagos', 0);
    const s1 = G.stops[1];
    s1.crew = { cfg: G.city.street.crew, alive: 3, taxed: 0 };
    for (let k=0;k<3;k++) G.agents.push({ z:s1.z, lat: k===1?0:(k-1)*120, kind:'crew', t:'agent',
      scared:false, pat:k, colour:'#FFD23D', crewRef:s1.crew });
    G.dist = s1.z - 40; G.speed = 0; G.boardQueue = 4; G.credits = 5000;
    G.gas = false; G.brake = true;                    // hold station like a real driver
    for (let i=0;i<180;i++) update(1/60);            // 3 seconds sitting in the box
    out.taxed = Math.round(G.crewsTax);
    out.autoHeldStation = Math.abs(G.stops[G.stopI].z - G.dist) < G.stops[G.stopI].box;
    out.blockedBoarding = G.pax.length === 0;
    G.lastHorn = -1; horn();
    for (let i=0;i<60;i++) update(1/60);
    out.crewAlive = s1.crew.alive;
    out.scattered = G.crewScattered;
    out.creditsAfterHorn = Math.round(G.credits);
    for (let i=0;i<400;i++) update(1/60);
    out.boardingAfterClear = G.pax.length > 0;
    /* auto-pedal must release the bus once the stop is served and the queue is aboard */
    G.gas = false; G.brake = false;
    const z0 = G.dist;
    for (let i=0;i<180;i++) update(1/60);
    out.autoReleased = G.dist - z0 > 200;

    /* ---- 2. conditions fire, change the drive, and end ---- */
    startRun('cairo', 0);
    G.evT = 0.5;
    for (let i=0;i<40;i++) update(1/60);
    out.eventFired = G.ev ? G.ev.id : null;
    out.evVisible = G.evFx.visibility || 1;
    const before = G.npcTo;
    for (let i=0;i<60;i++) update(1/60);
    out.conditionChangesWorld = (G.evFx.visibility < 1) || (G.evFx.traffic > 1) || (G.evFx.grip < 1) || !!G.evFx.hazards;
    G.evLeft = 0.05; for (let i=0;i<10;i++) update(1/60);
    out.eventEnded = G.ev === null;

    /* ---- 3. every city's signature bonus is reachable & pays ---- */
    out.sigs = [];
    CITY_PACKS.forEach(function (c) {
      startRun(c.id, 0);
      /* forge the condition the signature asks for, then finish the run */
      const bn = c.street.bonus;
      G.credits = 4000; G.crashes = 0; G.fines = 0; G.missed = 0;
      G.topCombo = Math.max(G.topCombo, bn.kind === 'combo' ? bn.target : 1);
      G.maxPax = bn.kind === 'fullBus' ? capacity() : 0;
      G.perfectStops = bn.kind === 'perfectStops' ? bn.target : 0;
      G.overtakes = bn.kind === 'overtake' ? bn.target : 0;
      G.boardHorn = bn.kind === 'boardHorn' ? bn.target : 0;
      G.paxDropped = bn.kind === 'paxVolume' ? bn.target : 0;
      G.missed = bn.kind === 'noMiss' ? 0 : 0;
      G.crashes = bn.kind === 'cleanRun' ? 0 : 1;
      endRun('finished');
      out.sigs.push({ city:c.id, kind:bn.kind, name:bn.name, paid: G.sigDone ? Math.round(G.sigDone.amt) : 0,
        got: !!G.sigDone });
    });

    /* ---- 4. local script is present for the script cities ---- */
    out.scripts = ['cairo','mumbai','bangkok','lagos'].map(function (id) {
      const c = cityById(id);
      const r = c.routes[0];
      return { id: id, city: c.cityNative, firstStop: r.stopsNative[0], differs: r.stopsNative[0] !== r.stops[0],
        script: c.script };
    });
    return out;
  });
  console.log(JSON.stringify(res, null, 1));
  console.log('ERRORS', errs.length, errs.slice(0,4).join(' | '));
  await b.close();
})();
