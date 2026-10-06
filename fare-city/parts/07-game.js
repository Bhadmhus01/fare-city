/* ==========================================================================
   FARE CITY — GAME ENGINE
   ========================================================================== */
const UNITS_PER_M = 1.5, KMH = 0.20;
const G = {
  mode:'idle', t:0, dist:0, speed:0, lat:0, latV:0, air:0, airV:0, bounce:0, tilt:0, shake:0,
  hazards:[], agents:[], npc:[], parts:[], wx:[], wxAcc:0, sky:[], road:[],
  stops:[], stopI:0, pax:[], credits:0, tips:0, fines:0, owa:0, combo:1, comboCalls:0,
  overtakes:0, hops:0, hp:100, fuel:100, boostT:0, boostCd:0, doorsT:0, doorsI:-1,
  clean:true, missed:0, crashes:0, idle:0, topCombo:1, perfectStops:0, spawnedTo:900, npcTo:700,
  gas:false, brake:false, steer:0, lastHorn:-1, skid:0, city:null, route:null, paint:null,
  weather:null, dusk:false, daySeed:1, waveN:0, best:{}
};
function paintOf(){ return PAINTS.filter(p=>p.id===save.paint)[0] || PAINTS[0]; }
function capacity(){ return 14 + partLevel('seats')*2; }
function speedMax(){ return 400 + partLevel('engine')*20; }
function brakePower(){ return 340 + partLevel('brakes')*55; }
function tyreArmour(){ return 1 - Math.min(0.6, partLevel('tyres')*0.12); }
function hornRange(){ return 900 + partLevel('horn')*220; }
function boostLen(){ return 1.6 + partLevel('tank')*0.5; }

function startRun(cityId, routeIndex){
  const city = cityById(cityId), route = city.routes[routeIndex];
  G.city = city; G.route = route; G.paint = paintOf();
  G.mode = 'run'; G.t = 0; G.dist = 0; G.speed = 0; G.lat = 0; G.latV = 0; G.air = 0; G.airV = 0;
  G.bounce = 0; G.tilt = 0; G.shake = 0; G.hazards = []; G.agents = []; G.npc = []; G.parts = [];
  G.wx = []; G.wxAcc = 0; G.pax = []; G.credits = 0; G.tips = 0; G.fines = 0; G.owa = 0;
  G.combo = 1; G.comboCalls = 0; G.overtakes = 0; G.hops = 0; G.hp = 100; G.fuel = 100;
  G.boostT = 0; G.boostCd = 0; G.doorsT = 0; G.clean = true; G.missed = 0; G.crashes = 0;
  G.idle = 0; G.topCombo = 1; G.perfectStops = 0; G.spawnedTo = 700; G.npcTo = 500;
  G.paxDropped = 0; G.boardQueue = 0; G.boardAcc = 0; G.waveN = 0; G.potholeSlow = 0;
  G.maxPax = 0; G.boardHorn = 0; G.crewsTax = 0; G.crewScattered = 0; G.sigDone = null;
  G.ev = null; G.evLeft = 0; G.evFx = {}; G.evT = 14 + rnd(0, 10);
  G.daySeed = hashStr(city.id + route.id + todayKey());
  G.sky = makeSkyline(city, G.daySeed); G.road = makeRoadside(city, G.daySeed);
  G.weather = (city.id==='london'||city.id==='bangkok'||city.id==='mumbai') ? 'rain'
            : (city.id==='cairo' ? 'dust' : (city.id==='lagos'||city.id==='jakarta' ? 'haze' : null));
  G.dusk = false;
  /* stops: one leg per gap between named stops */
  G.stops = route.stops.map(function(name, i){
    return { i:i, z:i*route.dist, name:name, box:180, done:false, boards:0,
      native: (route.stopsNative && route.stopsNative[i]) || name };
  });
  G.stopI = 1; /* heading to stop index 1 first */
  /* the city's crew: they hold the stop until you horn them off */
  const crewCfg = G.city.street && G.city.street.crew;
  if (crewCfg){
    G.stops.forEach(function(s, i){
      if (i === 0 || Math.random() > 0.75) return;
      s.crew = { cfg: crewCfg, alive: 0, taxed: 0 };
      for (let k=0;k<crewCfg.count;k++){
        G.agents.push({ z: s.z + rnd(-s.box*0.7, s.box*0.7), lat: rnd(-195,195), kind:'crew',
          t:'agent', scared:false, pat: rnd(0,6), colour: G.city.pal.accent, crewRef: s.crew });
        s.crew.alive++;
      }
    });
  }
  G.routeLen = route.dist * (route.stops.length-1);
  save.visited[city.id] = true;
  $('#hudRouteName').textContent = route.name + (save.set.script && city.cityNative && city.cityNative !== city.name
    ? '  ·  ' + city.cityNative : '');
  $('#cityTag').textContent = city.flag + ' ' + city.name.toUpperCase();
  $('#hudTicks').innerHTML = G.stops.map(function(s,i){
    return '<div class="tk" style="left:'+(i/(G.stops.length-1)*100)+'%" id="tk'+i+'"></div>'; }).join('');
  buildHudSeats();
  radio.tune(city); radio.start();
  if (!radio.started){ radio.tuneSound(); radio.started = true; }
  A.engineStart();
  show('scr-hud'); hudShow(true);
  toast(t('pressStart'), 2200);
  persist();
}
/* what the street says, in the street's language when the player wants it */
function streetLine(kind, seed){
  const st = G.city && G.city.street; if (!st) return '';
  const t2 = st.talk || {};
  const natives = { horn:t2.horn, board:t2.board, thanks:t2.thanks, miss:t2.miss };
  const english = { board:t2.boardEn, thanks:t2.thanksEn, miss:t2.missEn, horn:t2.horn };
  if (save.set.script && natives[kind]) return natives[kind];
  return english[kind] || natives[kind] || '';
}
function stub(){ return { z:0, lat:0, t:'', life:1, max:1, r:6, col:'#333', h:0, vz:0, vlat:0 }; }
function addPart(o){ const p = Object.assign(stub(), o); p.max = p.life; G.parts.push(p); if (G.parts.length > 220) G.parts.splice(0, G.parts.length-220); }
function floatText(z, lat, txt, col, size){ addPart({z:z, lat:lat, txt:txt, col:col||'#FFD23D', size:size||26, h:74, vz:40, life:1.15, r:0}); }
function puff(z, lat, col, n, spd){
  for (let i=0;i<(n||3);i++) addPart({z:z+rnd(-20,20), lat:lat+rnd(-24,24), col:col||'rgba(40,40,44,.5)',
    r:rnd(4,11), vz:rnd(-60,-140)*(spd||1), vlat:rnd(-40,40), latV:rnd(-30,30), h:rnd(0,10), life:rnd(.4,.9)});
}
function hudShow(on){
  $('#hud').className = on ? 'on' : '';
  $('#seats').innerHTML = '';
}
function buildHudSeats(){
  const el = $('#seats'); el.innerHTML = '';
  G.pax.forEach(function(p, i){
    const d = document.createElement('div');
    d.className = 'seat' + (p.mood >= 2 ? ' angry' : '');
    d.innerHTML = '<span class="p"></span><span>'+p.who+'</span><span class="d">'+
      (p.mood>=2 ? t('skipStop',{s:G.stops[p.dest].name}) : '→ '+G.stops[p.dest].name)+'</span>';
    el.appendChild(d);
  });
}
/* ---------------- city conditions: the street changes on you ---------------- */
const EV_TINT = { khamsin:'#D8B98A', harmattan:'#D8B98A', rain:'#8FA6B8', monsoon:'#8FA6B8',
  songkran:'#9EC4D8', drizzle:'#8FA6B8', easter:'#D8CFC0', banjir:'#8FA6B8', hydrant:'#8FA6B8' };
function startCondition(){
  const st = G.city.street; if (!st || !st.events || !st.events.length) return;
  const ev = st.events[ri(0, st.events.length - 1)];
  G.ev = ev; G.evLeft = ev.dur || 18; G.evFx = ev.effects || {};
  A.mission();
  banner(ev.emoji + ' ' + ev.name + ' — ' + ev.nameEn);
  toast(ev.emoji + '  ' + ev.name + '  ·  ' + ev.nameEn, 2800);
  hudCache.radio = null; hudCache.cond = null;
}
function endCondition(){
  G.ev = null; G.evFx = {}; G.evLeft = 0; G.evT = 16 + rnd(0, 14);
  hudCache.cond = null; hudCache.radio = null;
}
/* ---------------- spawning ---------------- */
function spawnAhead(){
  while (G.spawnedTo < G.dist + 3400){
    const z = G.spawnedTo;
    G.spawnedTo += rnd(150, 330);
    if (!save.set.calm || true){}
    const hz = G.city.hazards.concat(G.evFx.hazards || []);
    /* checkpoints on a schedule, not random */
    const legPos = z % G.route.dist;
    const cpEvery = 60 / (G.evFx.checkpoint || 1);
    if (legPos < cpEvery && z > 400 && Math.random() < (G.evFx.checkpoint ? 0.85 : 0.55)){
      G.hazards.push({z:z, lat:0, t:'checkpoint', passed:false, box:300, wave:0});
      continue;
    }
    const t0 = pick(hz);
    const lane = laneLat(ri(0, G.city.lanes-1), G.city.lanes);
    if (t0 === 'pothole') G.hazards.push({z:z, lat:lane + rnd(-40,40), t:'pothole'});
    else if (t0 === 'bump') G.hazards.push({z:z, lat:lane, t:'bump'});
    else if (t0 === 'cone') G.hazards.push({z:z, lat:lane, t:'cone'});
    else if (t0 === 'flood') G.hazards.push({z:z, lat:lane, t:'flood', w:120});
    else if (t0 === 'cow') G.agents.push({z:z, lat:lane, kind:'cow', t:'agent', scared:false, pat:rnd(0,6)});
    else if (t0 === 'hawker') G.agents.push({z:z, lat:(Math.random()<.5?-1:1)*330, kind:'hawker', t:'agent', scared:false, pat:rnd(0,6)});
    else if (t0 === 'bike') G.agents.push({z:z, lat:lane, kind:'bike', t:'agent', scared:false, pat:rnd(0,6), colour:pick(G.city.trafficColours)});
    else G.agents.push({z:z, lat:(Math.random()<.5?-1:1)*rnd(120,340), kind:'ped', t:'agent', scared:false, pat:rnd(0,6)});
  }
  while (G.npcTo < G.dist + 3200){
    const z = G.npcTo;
    G.npcTo += rnd(220, 520) / ((G.city.traffic || 1) * (G.evFx.traffic || 1));
    const toward = Math.random() < 0.55;
    const lane = toward ? laneLat(ri(0, Math.floor((G.city.lanes-1)/2)), G.city.lanes)
                        : laneLat(ri(Math.ceil(G.city.lanes/2), G.city.lanes-1), G.city.lanes);
    G.npc.push({ z:z, lat:lane + rnd(-18,18), sp: toward ? rnd(140,300) : rnd(190,330) * -1,
      colour: pick(G.city.trafficColours), big: Math.random()<0.18, toward:toward, passed:false });
  }
}
/* ---------------- passenger logic ---------------- */
const PAX_KINDS = [
  {id:'worker', who:'Worker',   mult:1.0, patience:70},
  {id:'trader', who:'Trader',   mult:1.25, patience:60},
  {id:'student',who:'Student',  mult:0.85, patience:85},
  {id:'aunty',  who:'Aunty',    mult:1.15, patience:55},
  {id:'oga',    who:'Oga',      mult:1.6, patience:45},
  {id:'tourist',who:'Tourist',  mult:1.75, patience:95}
];
function boardPax(){
  const free = capacity() - G.pax.length;
  const willing = 3 + G.city.paxPerStop + ri(0,2);
  const k = Math.min(free, willing);
  G.waveN = k;
  return k;
}
function doBoard(){
  if (G.waveN <= 0) return;
  G.waveN--;
  const kinds = PAX_KINDS.slice();
  const kind = pick(kinds);
  const dest = ri(G.stops[G.stopI].i + 1, G.stops.length-1);
  const p = { who:kind.who, kind:kind, dest:dest, mood:0, patience:kind.patience, waited:0, paid:false };
  G.pax.push(p);
  G.doorsT = 0.5; G.doorsI = G.stopI;
  A.load(); puff(G.dist - 40, G.lat, 'rgba(200,200,190,.5)', 2, .4);
  if (Math.random() < 0.5) floatText(G.dist + 30, rnd(-160,160), streetLine('board'), '#FFF3CC', 21);
  bump('pax', 0);
  buildHudSeats();
}
function payPax(p, full){
  const cpp = creditsPerPax(G.city, G.route);
  const amt = cpp * (full ? 1 : 0.5) * (p.kind ? p.kind.mult : 1) * (p.paid ? 0 : 1);
  p.paid = true;
  const combo = G.combo;
  const total = amt * (full ? combo : 1);
  G.credits += total;
  if (full && p.mood === 0){ const tip = amt * 0.20; G.credits += tip; G.tips++; bump('tips', 1);
    floatText(G.dist+40, p.latAtDrop || rnd(-160,160), streetLine('thanks') + '  +' + money(tip), '#7CFFB2', 22); }
  floatText(G.dist+30, rnd(-200,200), '+'+money(total), '#FFD23D', 30);
  A.coin(); save.total.pax++;
  if (full) bump('pax', 1);
}
function dropPax(perfect){
  const here = G.pax.filter(p=>p.dest === G.stopI);
  here.forEach(function(p){ payPax(p, perfect); });
  G.pax = G.pax.filter(p=>p.dest !== G.stopI);
  if (here.length){ G.doorsT = 0.5; A.drop(); }
  buildHudSeats();
  return here.length;
}
function missStops(){
  /* anyone whose stop we just drove past pays half and complains */
  G.pax.forEach(function(p){
    if (p.dest <= G.stopI - 1 && !p.paid){
      p.mood = 2; missPax(p);
    }
  });
}
function missPax(p){
  floatText(G.dist+40, 0, streetLine('miss'), '#FF8A80', 22);
  payPax(p, false); G.missed++; G.clean = false; G.combo = 1; G.comboCalls = 0;
  G.pax = G.pax.filter(q => q !== p);
  A.squeal(); if (save.set.buzz && navigator.vibrate) navigator.vibrate(30);
  buildHudSeats();
}
/* ---------------- events ---------------- */
function horn(){
  if (G.mode !== 'run' || G.paused) return;
  const now = performance.now() / 1000;
  if (now - G.lastHorn < 0.32) return;
  G.lastHorn = now;
  if (G.boardQueue > 0) G.boardHorn++;
  A.horn(G.city.id); bump('owa', 1);
  const range = hornRange();
  let hits = 0;
  G.agents.concat(G.hazards).forEach(function(o){
    if (o.t !== 'agent') return;
    const dz = o.z - G.dist;
    if (dz < -120 || dz > range) return;
    if (Math.abs(o.lat - G.lat) > 340) return;
    o.honked = 1; o.scared = true;
    if (!o.done){
      o.done = 1; hits++;
      const side = (o.lat >= G.lat) ? 1 : -1;
      o.latV = side * rnd(160, 300);
      o.zV = rnd(60, 160);
      puff(o.z, o.lat, 'rgba(220,210,190,.55)', 3, .3);
      if (hits <= 2) floatText(o.z, o.lat + side*40, streetLine('horn'), '#FFF3CC', 24);
    }
    if (o.crewRef){
      /* the city's crew scatters for good once every one of them runs */
      o.crewRef.alive = Math.max(0, o.crewRef.alive - 1);
      if (o.crewRef.alive === 0){
        const b = creditsPerPax(G.city, G.route) * o.crewRef.cfg.tip;
        G.credits += b; G.crewScattered++; G.comboCalls += 2;
        floatText(G.dist + 140, rnd(-120,120), o.crewRef.cfg.scatter + '  +' + money(b), '#7CFFB2', 26);
        A.owa(); if (save.set.buzz && navigator.vibrate) navigator.vibrate(25);
      }
    }
  });
  if (hits){
    G.owa += hits;
    G.comboCalls += hits;
    const newCombo = Math.min(4, 1 + Math.floor(G.comboCalls/4)*0.5);
    if (newCombo > G.combo){ G.combo = newCombo; G.topCombo = Math.max(G.topCombo, G.combo);
      A.owa(); showBig('OWA! x' + G.combo); bump('combo', G.combo, 'max'); }
    const bonus = creditsPerPax(G.city, G.route) * 0.10 * hits * G.combo;
    G.credits += bonus; G.tips += hits;
    floatText(G.dist + 300, rnd(-140,140), (G.city.street ? G.city.street.talk.horn : 'OWA!') + ' x' + hits + '  +' + money(bonus), '#7CFFB2', 24);
    bump('tips', hits);
    setComboHud();
  }
}
function hop(){
  if (G.mode !== 'run' || G.paused) return;
  if (G.air > 0.05) return;
  G.airV = 340 + partLevel('tyres')*12;
  G.air = 0.001; A.hop(); G.hops++; bump('hop', 1);
  puff(G.dist - 30, G.lat, 'rgba(200,190,170,.5)', 4, .5);
}
function boost(){
  if (G.mode !== 'run' || G.paused) return;
  if (G.boostT > 0 || G.boostCd > 0 || G.fuel < 12) return;
  G.boostT = boostLen(); G.boostCd = 1.2; G.fuel -= 10;
  A.tone(180, .5, 'sawtooth', .18, null, 420);
}
function setComboHud(){
  const el = $('#combo');
  if (G.combo > 1){ el.textContent = 'x' + G.combo.toFixed(1); el.classList.add('on'); }
  else el.classList.remove('on');
}
function showBig(txt){
  const el = $('#bigmsg'); el.textContent = txt; el.className = ''; void el.offsetWidth; el.className = 'on';
}
function hit(o, kind){
  const dmg = kind === 'pothole' ? 9*tyreArmour() : kind === 'cone' ? 4 : kind === 'cow' ? 14 : 11;
  G.hp -= dmg; G.shake = 7; G.crashes++; G.clean = false;
  G.speed *= (kind==='cow' ? 0.45 : 0.72);
  puff(o.z, o.lat, 'rgba(150,140,120,.6)', 6, 1);
  floatText(o.z + 40, o.lat, '-' + Math.round(dmg), '#FF8A80', 22);
  A.crash();
  if (G.pax.length && Math.random() < .5){ floatText(G.dist + 60, 0, pick(G.city.slang.crash), '#FFD23D', 20); }
  $('#damage').style.opacity = Math.min(1, (100-G.hp)/100 + .25);
  setTimeout(function(){ $('#damage').style.opacity = 0; }, 220);
  if (G.hp <= 0) endRun('wahala');
}
/* ---------------- update ---------------- */
function update(dt){
  if (G.mode !== 'run' || G.paused) return;
  G.t += dt;
  const city = G.city;
  const auto = save.set.auto;
  const pedals = G.gas || G.brake;
  const wantGas = G.gas || (auto && !pedals);
  const fx = G.evFx || {};
  const max = speedMax() * (G.boostT > 0 ? 1.42 : 1) * (G.potholeSlow > 0 ? .72 : 1) * (fx.speed || 1);
  /* longitudinal */
  /* auto-pedal creeps up to the sign and parks on it, so one thumb is enough to
     serve a stop, horn the crew off and load everyone. It keeps its own flag —
     writing the player's G.brake here once parked the bus for good. Re-evaluated
     every frame, so the bus always pulls away once the stop is done. */
  G.autoBrake = false;
  if (auto && !pedals){
    const cue0 = G.stops[G.stopI];
    if (cue0 && (!cue0.touched || G.boardQueue > 0)){
      const dz0 = cue0.z - G.dist;
      if (dz0 > -cue0.box && dz0 < cue0.box + 40){
        if (dz0 > 28) G.speed = Math.min(G.speed, Math.max(14, dz0 * 0.6));  /* creep in */
        else G.autoBrake = true;                                             /* park on the sign */
      }
    }
  }
  const braking = G.brake || G.autoBrake;
  if (wantGas && !braking) G.speed += (130 + partLevel('engine')*12) * dt;
  if (braking) G.speed -= brakePower() * dt;
  if (!wantGas && !braking) G.speed -= 70 * dt;
  if (G.speed > max) G.speed -= 200*dt;
  G.speed = clamp(G.speed, 0, max);
  G.dist += G.speed * dt;
  /* lateral steering */
  const grip = fx.grip == null ? 1 : fx.grip;
  if (G.steer !== 0){ G.latV += G.steer * 780 * dt * grip; }
  else if (auto){ G.latV += -G.lat * 1.2 * dt * grip; }
  if (fx.drift) G.latV += Math.sin(G.t*1.6) * 105 * fx.drift * dt;   /* South Easter shove */
  G.latV -= G.latV * Math.min(1, 5.2*dt);
  G.lat += G.latV * dt;
  const lim = (G.city.lanes-1)/2 * 253 + 40;
  if (G.lat > lim){ G.lat = lim; G.latV *= -0.25; if (Math.abs(G.latV) > 120) A.squeal(); }
  if (G.lat < -lim){ G.lat = -lim; G.latV *= -0.25; if (Math.abs(G.latV) > 120) A.squeal(); }
  G.tilt = lerp(G.tilt, clamp(G.latV/1500, -0.16, 0.16), Math.min(1, 8*dt));
  /* airtime */
  if (G.air > 0){
    G.air += G.airV*dt/100; G.airV -= 900*dt;
    if (G.air <= 0){ G.air = 0; G.airV = 0; G.shake = 4; puff(G.dist-20, G.lat, 'rgba(190,180,160,.6)', 5, .6); }
  }
  G.bounce = (G.air > 0 ? -G.air*0.55 : 0) + Math.sin(G.t*9)*0.7*(1+G.speed/500);
  if (G.boostT > 0){ G.boostT -= dt; puff(G.dist-90, G.lat-60, 'rgba(60,60,64,.45)', 2, 1.4); }
  if (G.boostCd > 0) G.boostCd -= dt;
  if (G.potholeSlow > 0) G.potholeSlow -= dt;
  if (G.doorsT > 0) G.doorsT -= dt;
  G.shake = Math.max(0, G.shake - dt*22);
  G.idle = (G.speed < 12) ? G.idle + dt : 0;
  /* engine + particles */
  A.engineSet(clamp(G.speed/speedMax(),0,1), wantGas && !braking ? 1 : .4);
  if (G.speed > 40 && Math.random() < dt*10) puff(G.dist - 96, G.lat - 60, 'rgba(70,70,74,.35)', 1, .8);
  spawnAhead();
  /* cull */
  G.hazards = G.hazards.filter(o => o.z > G.dist - 300);
  G.agents = G.agents.filter(o => o.z > G.dist - 300);
  G.npc = G.npc.filter(o => o.z > G.dist - 400 && o.z < G.dist + 3600);
  /* agents move */
  G.agents.forEach(function(o){
    if (o.latV) o.lat += o.latV*dt;
    if (o.latV) o.latV -= o.latV*1.6*dt;
    if (o.zV) o.z += o.zV*dt;
    if (o.kind === 'hawker' || o.kind === 'ped') o.lat += Math.sin(G.t*2 + o.pat)*24*dt;
  });
  /* npc traffic */
  G.npc.forEach(function(n){
    n.z += (n.toward ? (n.sp - G.speed) : (-n.sp - G.speed)) * dt;
    if (!n.toward) n.lat += Math.sin(G.t + n.lat)*2*dt;
  });
  /* ---------- collisions ---------- */
  G.hazards.forEach(function(o){
    const dz = o.z - G.dist;
    const near = Math.abs(dz) < 62, onLane = Math.abs(o.lat - G.lat) < 66;
    if (o.t === 'checkpoint'){
      const inBox = dz < 60 && dz > -o.box;
      if (inBox && !o.passed){
        if (G.speed <= 90){ o.passed = true; G.perfectStops++; G.credits += creditsPerPax(G.city,G.route)*0.6;
          floatText(G.dist+90, 0, '+'+money(creditsPerPax(G.city,G.route)*0.6), '#7CFFB2', 24);
          A.whistle(); G.fuel = Math.min(100, G.fuel + 12); banner(t('checkpointAhead').replace('!',' ✓'));
        } else if (dz < -40 && !o.fined){
          o.fined = true; const fine = Math.max(creditsPerPax(G.city,G.route)*1.5, G.credits*0.12);
          G.fines += fine; G.credits = Math.max(0, G.credits - fine); G.clean = false;
          A.siren(); showBig(t('ticketIssued', {v:money(fine)}));
          floatText(G.dist + 60, 0, '-'+money(fine), '#FF8A80', 26);
          if (save.set.buzz && navigator.vibrate) navigator.vibrate([20,40,20]);
        }
      } else if (dz < 300 && dz > 60 && G.speed > 130) banner(t('checkpointAhead'));
      return;
    }
    if (near && onLane && !o.hit){
      if (o.t === 'pothole' || o.t === 'flood' || o.t === 'cone' || o.t === 'bump'){
        if (G.air > 0.25 || (o.t === 'bump')){ /* cleared */ }
        else if (o.t === 'flood'){ G.potholeSlow = 0.6; G.speed *= .8; }
        else if (o.t === 'bump'){ G.shake = 5; G.air = 0.25; G.airV = 150; G.hops++; bump('hop',1);
          floatText(o.z, o.lat, 'AIR!', '#FFF3CC', 24); }
        else { o.hit = 1; hit(o, o.t); if (o.t==='pothole') G.potholeSlow = 1.1; }
      }
    }
  });
  G.agents.forEach(function(o){
    if (o.kind === 'crew') return;   /* they block, they do not sue */
    const dz = o.z - G.dist, onLane = Math.abs(o.lat - G.lat) < 70;
    if (Math.abs(dz) < 60 && onLane && !o.hit && G.air < 0.2){
      o.hit = 1;
      if (o.kind === 'cow'){ hit(o, 'cow'); }
      else {
        const fine = creditsPerPax(G.city, G.route) * 0.9;
        G.fines += fine; G.credits = Math.max(0, G.credits - fine); G.clean = false;
        G.speed *= .78; G.shake = 5; floatText(o.z, o.lat, '-'+money(fine), '#FF8A80', 22);
        A.tumble(); if (o.kind==='ped') floatText(G.dist+80, 0, G.city.slang.crash[0], '#FFD23D', 20);
      }
    }
  });
  /* overtakes */
  G.npc.forEach(function(n){
    if (!n.toward || n.passed) return;
    const dz = n.z - G.dist;
    if (dz < 40 && dz > -60 && Math.abs(n.lat - G.lat) < 150){
      n.passed = true; G.overtakes++;
      if (G.speed > n.sp + 60){
        const b = creditsPerPax(G.city,G.route)*0.35*G.combo;
        G.credits += b; floatText(G.dist+70, n.lat, 'OVERTAKE +'+money(b), '#9BD4FF', 20);
      }
    }
  });
  /* ---------- stops ---------- */
  const lastI = G.stops.length - 1, last = G.stops[lastI];
  const cur = G.stops[G.stopI];
  if (cur){
    const dz = cur.z - G.dist;
    if (dz < -cur.box - 70){
      const stranded = G.pax.filter(p => p.dest === G.stopI);
      if (stranded.length) stranded.forEach(missPax);
      else if (!cur.touched){ G.clean = false; }
      cur.missed = !cur.touched;
      G.stopI++;
      hudCache.ticks = -1;
    } else if (Math.abs(dz) < cur.box && G.speed < 46 && !cur.touched){
      cur.touched = true;
      const dropped = dropPax(true);
      if (dropped){ G.paxDropped += dropped; G.perfectStops++; }
      const n = (G.stopI < lastI) ? boardPax() : 0;
      if (n > 0){ G.boardQueue = n; banner(n + ' ' + (LANG==='pcm' ? 'dey enter' : 'to load')); }
      else if (dropped){ banner(dropped + ' ' + (LANG==='pcm' ? 'land' : 'drop, well done')); }
      hudCache.ticks = -1;
    }
  }
  /* terminus */
  if (last.touched || G.stopI > lastI || G.dist > last.z + last.box + 140){
    if (!last.touched && Math.abs(last.z - G.dist) < last.box && G.speed < 46){
      last.touched = true;
      const d2 = dropPax(true); if (d2){ G.paxDropped += d2; G.perfectStops++; }
    }
    if (G.pax.length) G.pax.slice().forEach(missPax);
    endRun('finished');
    return;
  }
  /* conditions tick */
  if (G.evLeft > 0){ G.evLeft -= dt; if (G.evLeft <= 0) endCondition(); }
  else { G.evT -= dt; if (G.evT <= 0) startCondition(); }
  /* the city's crew taxes you while you sit in the box */
  const curb = G.stops[G.stopI];
  if (curb && curb.crew && curb.crew.alive > 0){
    const dzc = curb.z - G.dist;
    if (Math.abs(dzc) < curb.box && G.speed < 46){
      const rate = creditsPerPax(G.city, G.route) * curb.crew.cfg.toll;
      const take = rate * dt;
      G.credits = Math.max(0, G.credits - take);
      G.crewsTax += take; curb.crew.taxed += take; G.clean = false;
      G.crewFloat = (G.crewFloat || 0) + dt;
      if (G.crewFloat > 0.7){ G.crewFloat = 0;
        floatText(G.dist + 80, rnd(-140,140), '-' + money(take*0.7), '#FF8A80', 22); }
      /* they will not hold the door open for ever: horn them off for the tip and
         the combo, or wait them out and just lose what they already took */
      curb.crew.held = (curb.crew.held || 0) + dt;
      const bored = Math.max(0, 12 - curb.crew.held);
      hudCond(curb.crew.cfg.emoji + ' ' + curb.crew.cfg.name,
        (LANG==='pcm' ? 'Dey collect! HORN to scatter them.' : 'Collecting! HORN to scatter them.')
        + '  ·  ' + money(curb.crew.taxed) + (LANG==='pcm' ? ' gone' : ' lost')
        + (bored > 0 ? '  ·  ' + Math.ceil(bored) + 's' : ''));
      if (curb.crew.held > 12){
        curb.crew.alive = 0;
        curb.crew.bored = true;
        G.agents.forEach(function(o){
          if (o.crewRef === curb.crew && !o.done){
            o.done = 1; o.scared = true;
            o.latV = (o.lat >= G.lat ? 1 : -1) * rnd(150, 260); o.zV = rnd(50, 130);
          }
        });
        banner(LANG==='pcm' ? 'Dem don waka — load your people' : 'They got bored and left — board now');
        floatText(G.dist + 120, 0, money(curb.crew.taxed) + (LANG==='pcm' ? ' gone' : ' lost'), '#FF8A80', 24);
      }
    } else if (curb.crew) curb.crew.held = 0;
  }
  if (G.pax.length > G.maxPax) G.maxPax = G.pax.length;
  /* brake prompt + boarding cue */
  const cue = G.stops[G.stopI];
  if (cue && !cue.touched){
    const dz2 = cue.z - G.dist;
    if (dz2 > 0 && dz2 < 620 && G.speed > 150) banner((LANG==='pcm'?'Brake! ':'Brake — ') + t('stopHere'));
    else if (dz2 > 0 && dz2 < 240 && G.speed > 60) banner(t('stopHere'));
  }
  /* boarding drip: passengers climb in one by one while you are stopped */
  const doorBlocked = !!(curb && curb.crew && curb.crew.alive > 0);
  if (G.boardQueue > 0 && G.speed < 46 && !doorBlocked){
    G.boardAcc = (G.boardAcc || 0) + dt;
    if (G.boardAcc > 0.30){ G.boardAcc = 0; doBoard(); G.boardQueue--; }
  }
  /* ------------------ patience ------------------ */
  G.pax.slice().forEach(function(p){
    p.waited += dt * (G.idle > 4 ? 2.2 : 1);
    if (p.waited > p.patience && p.mood === 0){
      p.mood = 1; buildHudSeats();
      floatText(G.dist + 40, rnd(-180,180), (LANG==='pcm' ? 'We dey wait o!' : 'Any time now...'), '#FFD23D', 21);
    } else if (p.waited > p.patience * 1.9 && p.mood === 1){
      p.mood = 2; buildHudSeats(); missPax(p);
    }
  });
  updateHud();
}
let hudCache = {};
function hudCond(title, sub){
  const key = title + '|' + (sub || '');
  if (hudCache.condKey === key) return;
  hudCache.condKey = key;
  const el = $('#cond'); el.innerHTML = title + (sub ? '<small>' + sub + '</small>' : '');
  el.classList.add('on');
}
function hudCondOff(){
  if (hudCache.condKey === null) return;
  hudCache.condKey = null;
  $('#cond').classList.remove('on');
}
function updateHud(){
  /* show the active city condition, otherwise clear the chip */
  if (G.ev){
    const left = Math.ceil(G.evLeft);
    hudCond(G.ev.emoji + ' ' + G.ev.name, G.ev.nameEn + '  ·  ' + left + 's');
  } else if (!(G.stops[G.stopI] && G.stops[G.stopI].crew && G.stops[G.stopI].crew.alive > 0)){
    hudCondOff();
  }
  const kmh = Math.round(G.speed * KMH);
  if (hudCache.kmh !== kmh){ $('#hudSpeed').textContent = kmh; hudCache.kmh = kmh; }
  const frac = clamp(G.dist / G.routeLen, 0, 1) * 100;
  $('#hudProg').style.width = frac.toFixed(1) + '%';
  const money1 = money(G.credits, G.city);
  if (hudCache.money !== money1){ $('#fare').innerHTML = money1 + '<small id="fareLbl">' + t('fare').toUpperCase() + '</small>'; hudCache.money = money1; }
  const nxt = G.stops[Math.min(G.stopI, G.stops.length-1)];
  const nxtNative = save.set.script && G.city.nativeStops && G.city.nativeStops[nxt.name];
  const nxtTxt = t('nextStop', {s: (nxtNative && nxtNative !== nxt.name)
    ? nxtNative + ' (' + nxt.name + ')' : nxt.name});
  if (hudCache.nxt !== nxtTxt){ $('#hudNext').textContent = nxtTxt; hudCache.nxt = nxtTxt; }
  const hp = clamp(Math.round(G.hp),0,100);
  if (hudCache.hp !== hp){ $('#hudHp').style.width = hp + '%';
    $('#hudHp').style.background = hp > 55 ? 'var(--green)' : hp > 25 ? 'var(--yellow, #FFD23D)' : 'var(--red)'; hudCache.hp = hp; }
  const seats = G.pax.length + '/' + capacity();
  if (hudCache.seats !== seats){ $('#hudSeatsTxt') && ($('#hudSeatsTxt').textContent = seats); hudCache.seats = seats; }
  if (hudCache.ticks !== G.stopI){
    for (let i=0;i<G.stops.length;i++){
      const el = document.getElementById('tk'+i);
      if (el) el.className = 'tk' + (i < G.stopI ? ' done' : '');
    }
    hudCache.ticks = G.stopI;
  }
  const rname = G.city.radio.name + (G.ev ? ' · ' + G.ev.name : '');
  if (hudCache.radio !== rname){
    $('#radioName').textContent = rname + (G.ev ? '' : ' · ' + G.city.radio.tag);
    hudCache.radio = rname;
  }
}
/* ---------------- end ---------------- */
function endRun(reason){
  if (G.mode !== 'run') return;
  G.mode = 'done';
  A.engineStop(); radio.stop();
  /* end-of-route bonuses */
  let bonus = 0;
  const cpps = creditsPerPax(G.city, G.route);
  if (G.clean && !G.missed && G.crashes === 0){ bonus += G.credits * 0.15; G.perfectRun = true; }
  if (G.overtakes >= 3) bonus += cpps * G.overtakes * 0.2;
  if (G.perfectStops >= 2) bonus += cpps * 1.2;
  /* the city's own signature: one bonus only a driver of THIS city can earn */
  const st = G.city.street;
  if (st && st.bonus && sigCheck(st.bonus.kind, st.bonus.target)){
    const sb = G.credits * st.bonus.mult;
    G.credits += sb;
    G.sigDone = { name: st.bonus.name, amt: sb, desc: st.bonus.desc };
    save.total.sigs = (save.total.sigs || 0) + 1;
  }
  G.credits += bonus;
  const idxScore = Math.round(G.credits);
  const targets = starTargets(G.city, G.route);
  let stars = 0; targets.forEach(function(tt){ if (idxScore >= tt) stars++; });
  G.starsEarned = stars;
  const before = save.routeStars[G.route.id] || 0;
  if (stars > before) save.routeStars[G.route.id] = stars;
  if (idxScore > (save.cityBest[G.route.id] || 0)) save.cityBest[G.route.id] = idxScore;
  save.wallet += G.credits;
  save.total.runs++; save.total.credits += G.credits;
  save.total.dist += G.dist / UNITS_PER_M; save.total.owa += G.owa;
  save.runs.push({ city:G.city.id, route:G.route.id, rname:G.route.name, idx:idxScore,
    star:stars, at:Date.now(), pax:G.paxDropped||0 });
  if (save.runs.length > 60) save.runs.shift();
  bump('runs', 1);
  if (G.clean && G.crashes === 0 && reason === 'finished') bump('clean', 1);
  if (!G.missed && reason === 'finished') bump('perfect', 1);
  const unlockedBefore = {};
  CITY_PACKS.forEach(function(c){ unlockedBefore[c.id] = openCache[c.id]; });
  /* which city just opened because of these stars? */
  let opened = null;
  CITY_PACKS.forEach(function(c){
    if (!c.unlocked && c.starsReq && totalStars() >= c.starsReq && !openCache[c.id]) opened = c;
  });
  CITY_PACKS.forEach(function(c){ openCache[c.id] = cityOpen(c); });
  streakTick(); persist();
  if (opened){ A.unlock(); toast(t('newCity', {c:opened.flag + ' ' + opened.name}), 3400); }
  else if (stars > before) A.mission();
  const newRoute = nextRouteOpened();
  showResult({ reason:reason, bonus:bonus, targets:targets, stars:stars, idxScore:idxScore,
    opened:opened, newRoute:newRoute, best: save.cityBest[G.route.id] || idxScore });
}
let openCache = {};
function nextRouteOpened(){
  for (let i=0;i<CITY_PACKS.length;i++){
    const c = CITY_PACKS[i];
    for (let j=1;j<c.routes.length;j++){
      const key = c.id+':'+j;
      if (!routeSeen[key] && cityOpen(c) && routeOpen(c, j)){ routeSeen[key] = 1; return {city:c, i:j}; }
      routeSeen[key] = routeSeen[key] || !cityOpen(c);
    }
  }
  return null;
}
let routeSeen = {};
