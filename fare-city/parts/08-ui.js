/* ==========================================================================
   FARE CITY — UI, INPUT, LOOP
   ========================================================================== */
let prevScreen = 'scr-home', lastPlay = { city:'lagos', route:0 };
let toastTimer = null, bannerTimer = null;

function show(id){
  if (id === 'scr-hud'){ $$('.screen').forEach(s=>s.classList.remove('on')); $('#hud').className = 'on'; return; }
  const cur = $$('.screen').filter(s=>s.classList.contains('on'))[0];
  prevScreen = cur ? cur.id : 'scr-home';
  $$('.screen').forEach(s=>s.classList.remove('on'));
  const el = document.getElementById(id); if (el) el.classList.add('on');
  $('#hud').className = '';
  if (id === 'scr-home') renderHome();
  if (id === 'scr-map') renderMap();
  if (id === 'scr-garage') renderGarage();
  if (id === 'scr-board') renderBoard();
  if (id === 'scr-set') renderSettings();
  if (id === 'scr-account') renderAccount();
  if (id === 'scr-how') renderHow();
}
function toast(msg, ms){
  const el = $('#toast'); el.textContent = msg; el.classList.add('on');
  clearTimeout(toastTimer); toastTimer = setTimeout(()=>{ el.classList.remove('on'); }, ms || 1900);
}
function banner(msg){
  const el = $('#banner');
  if (el.textContent === msg && el.classList.contains('on')) return;
  el.textContent = msg; el.classList.add('on');
  clearTimeout(bannerTimer); bannerTimer = setTimeout(()=>{ el.classList.remove('on'); }, 1800);
}
/* ------------------------------------------------------------------ HOME */
/* ---------------- home city: yours from the first tap ---------------- */
function renderWhere(){
  const list = $('#whereList'); if (!list) return;
  list.innerHTML = CITY_PACKS.map(function(c){
    const here = save.home === c.id;
    const state = here ? 'HOME' : (cityOpen(c) ? 'OPEN' : c.starsReq + '★');
    return '<button class="wheretile' + (here ? ' here' : '') + '" data-city="' + c.id + '">' +
      '<span class="fl">' + c.flag + '</span>' +
      '<span class="grow"><b>' + c.name + '</b><span class="mt">' + (c.country || '') + ' · ' + c.vehicle + ' · ' +
        c.cur.sym + ' ' + c.cur.code + ' · ' + c.routes.length + ' routes</span></span>' +
      '<span class="chip' + (here ? ' y' : '') + '" style="flex:0 0 auto">' + state + '</span></button>';
  }).join('');
  $$('#whereList .wheretile').forEach(function(b){ b.onclick = function(){ pickHome(b.dataset.city); }; });
}
function pickHome(id){
  const c = cityById(id);
  save.home = id; save.pickedHome = 1; save.city = id; persist();
  renderHome();
  toast('🏠 Home city · ' + c.flag + ' ' + c.name + ' · ' + c.vehicle +
    (save.seenHow ? '' : '  — how to play next'), 3200);
  if (save.seenHow){ show('scr-home'); return; }
  /* first run: straight into how-to-play, and its ✕ must land on the home screen
     — the picker is a one-time gate, not somewhere you go back to */
  save.seenHow = true; persist();
  show('scr-how');
  prevScreen = 'scr-home';
}
let dailyLive = '';
function renderHome(){
  const city = cityById(save.city);
  const hc = cityById(save.home || save.city);
  if ($('#homeCityLbl')) $('#homeCityLbl').textContent = save.pickedHome ? hc.name + ' · home' : 'pick your city';
  $('#wNaira').textContent = money(save.wallet, city);
  $('#wGlobal').textContent = 'Fare index all-time ' + idx(save.total.credits);
  $('#wStars').textContent = totalStars();
  $('#wStreak').textContent = t('streak', {n:save.streak||0});
  $('#wRank').textContent = t('rank') + ' · ' + rankOf().name;
  const fleet = Object.keys(save.visited).length;
  $('#wFleet').textContent = fleet <= 1 ? t('fleet1') : t('fleet', {n:fleet}) + (LANG==='pcm' ? ' for road' : ' on the road');
  $('#homeCityLbl').textContent = city.flag + ' ' + city.name + ' · ' + city.cur.code;
  /* season / event banner */
  const week = Math.floor(Date.now()/6048e5), ev = ['Owambe season','Detty December rush','Rain season','School run week'][week%4];
  $('#bannerSeason').style.display = 'block';
  $('#seasonTitle').textContent = ev + ' · ' + city.name;
  $('#seasonBody').textContent = week%4===0 ? 'Fares x1.5 for the week. Everybody dey go party.'
    : week%4===1 ? 'December rush — passenger volume is up in every city.'
    : week%4===2 ? 'Wet roads: potholes are deeper and hop timing matters more.'
    : 'Morning school run: more students, smaller fares, bigger volume.';
  /* continue card */
  const lp = lastPlay, lc = cityById(lp.city), lr = lc.routes[lp.route] || lc.routes[0];
  const bst = save.cityBest[lr.id] || 0;
  $('#continueCard').innerHTML =
    '<div class="ticket" style="background:var(--y)">' +
      '<div class="row b"><div class="grow">' +
        '<div class="lbl" style="opacity:.75">'+lc.flag+' '+lc.name+' · '+lc.vehicle+'</div>' +
        '<div style="font-weight:900;font-size:17px;margin-top:2px">'+lr.name+'</div>' +
        '<div class="tiny" style="opacity:.75">'+lr.via+' · '+t('bestHere')+': '+(bst? idx(bst):'—')+'</div>' +
      '</div><span class="stars">'+starStr(save.routeStars[lr.id]||0)+'</span></div>' +
      '<div class="perf" style="border-color:rgba(20,20,26,.25)"></div>' +
      '<button class="btn dark" id="btnContinue">'+t('tapDrive')+'</button>' +
    '</div>';
  $('#btnContinue').onclick = ()=>{ A.init(); A.resume(); startRun(lc.id, lp.route); };
  /* missions */
  const list = save.missions.list;
  $('#missionDone').textContent = t('missionDone', {n:list.filter(m=>m.done).length});
  $('#dailyList').innerHTML = list.map(function(m){
    const pc = Math.min(100, m.prog/m.goal*100);
    return '<div class="setrow"><span style="font-size:17px;width:26px">'+(m.done?'✅':'🎯')+'</span>' +
      '<div class="grow"><b style="font-size:12.5px">'+m.text+'</b>' +
      '<div class="bar thin" style="margin-top:6px"><i style="width:'+pc+'%;background:'+(m.done?'var(--green)':'var(--y)')+'"></i></div></div>' +
      '<div style="text-align:right"><div style="font-weight:900;font-size:12.5px;color:var(--y)">+'+money(m.reward, city)+'</div>' +
      '<div class="tiny">'+m.prog+'/'+m.goal+'</div></div></div>';
  }).join('');
  /* daily run card */
  const dp = dailyPick(), dr = dp.cityObj.routes[dp.route];
  const played = dailyPlayed();
  $('#dailyTitle').textContent = dp.cityObj.flag + ' ' + dp.cityObj.name + ' · ' + dr.name;
  $('#dailySub').innerHTML = played
    ? 'Played today · fare index <b>' + idx(save.daily.score) + '</b>' + (save.daily.rank ? ' · world #' + save.daily.rank : '') +
      ' · resets in ' + dailyMsLeft()
    : '🌍 The whole world drives this route today · one attempt · resets in ' + dailyMsLeft();
  if ($('#dailyLive')) $('#dailyLive').textContent = dailyLive;
  if (netAvailable() && !played){
    netDailyInfo().then(function(info){
      if (!info || !info.runsToday) return;
      dailyLive = '🌍 ' + info.runsToday + ' run' + (info.runsToday === 1 ? '' : 's') + ' today by ' +
        info.drivers + ' driver' + (info.drivers === 1 ? '' : 's');
      if ($('#dailyLive')) $('#dailyLive').textContent = dailyLive;
    });
  }
  const dbtn = $('#btnDaily');
  dbtn.textContent = played ? 'Done' : 'Drive';
  dbtn.className = 'btn sm' + (played ? ' ghost' : '');
  dbtn.disabled = played;
  dbtn.style.opacity = played ? '.6' : '1';
  /* account CTA */
  const signed = !!(save.acct && save.acct.name);
  $('#acctCta').textContent = signed
    ? 'Signed in as ' + save.acct.name + ' · world board ' + (netAvailable() ? 'live' : 'offline')
    : 'Sign in for the world board';
  /* next unlock motivator */
  const nc = nextCity();
  const nxEl = document.getElementById('nextUnlock');
  if (nxEl){
    if (!nc){ nxEl.innerHTML = '<div class="row b"><span class="tiny">🏁 Every city is open. You run the world.</span><span class="chip y">FULL MAP</span></div>'; }
    else {
      const have = totalStars(), need = nc.starsReq, pc = Math.min(100, have/need*100);
      nxEl.innerHTML = '<div class="row"><span style="font-size:19px">'+nc.flag+'</span>' +
        '<div class="grow"><div class="row b"><b style="font-size:12.5px">Next unlock: '+nc.name+'</b>' +
        '<span class="tiny">'+have+'/'+need+'★</span></div>' +
        '<div class="bar thin" style="margin-top:5px"><i style="width:'+pc.toFixed(0)+'%"></i></div></div>' +
        '<span style="font-size:18px">'+nc.vehicleEmoji+'</span></div>';
    }
  }
  /* city strip */
  $('#cityStrip').innerHTML = CITY_PACKS.slice(0,8).map(function(c){
    const open = cityOpen(c), her = c.id === save.city;
    return '<button data-city="'+c.id+'" class="'+(open?'':'soon')+'" style="flex:0 0 auto;text-align:center;min-width:74px;opacity:'+(open?1:.42)+'">' +
      '<div style="font-size:26px">'+c.flag+'</div>' +
      '<div style="font-size:10.5px;font-weight:900;margin-top:3px">'+c.name+'</div>' +
      '<div class="stars" style="font-size:9.5px">'+starStr(cityStars(c.id))+'</div>' +
      (her?'<div class="chip y" style="margin-top:4px;font-size:8.5px;padding:2px 6px">HERE</div>':'')+'</button>';
  }).join('');
  $$('#cityStrip [data-city]').forEach(function(b){
    b.onclick = function(){ const c = cityById(b.dataset.city); if (!cityOpen(c)){ toast(t('needs',{n:c.starsReq})+' · '+c.name, 2200); return; } save.city = c.id; persist(); openCity(c.id); };
  });
}
function starStr(n){ let s=''; for (let i=0;i<3;i++) s += i<n ? '★' : '☆'; return s; }
/* ------------------------------------------------------------------ MAP */
function renderMap(){
  $('#mapProgress').textContent = rankOf().name + ' · ' + totalStars() + ' of ' + MAX_STARS + ' stars';
  const n = CITY_PACKS.filter(cityOpen).length;
  $('#mapUnlocked').textContent = n === 1 ? t('unlocked',{n:n}) : t('unlockedPl',{n:n});
  $('#cityList').innerHTML = CITY_PACKS.map(function(c){
    const open = cityOpen(c), cs = cityStars(c.id), here = c.id === save.city;
    return '<button class="city '+(open?'':'locked')+' '+(here?'here':'')+'" data-city="'+c.id+'">' +
      '<span class="flag">'+c.flag+'</span>' +
      '<span class="grow"><span class="nm">'+c.name+'</span>' +
      '<span class="mt">'+c.country+' · '+c.cur.code+' · '+c.vehicle+' · '+c.lanes+' lanes'+
        (c.weather? ' · '+c.weather : '')+' · <span style="opacity:.8">📻 '+c.radio.name+'</span></span>' +
      '<span class="mt stars">'+starStr(cs)+' <span style="opacity:.55;font-size:10px">'+cs+'/'+ (c.routes.length*3) +'</span></span></span>' +
      (here ? '<span class="pill">HERE</span>' : open ? '<span class="pill g">OPEN</span>' : '<span class="pill r">'+c.starsReq+'★</span>') +
      '</button>';
  }).join('');
  $$('#cityList [data-city]').forEach(function(b){
    b.onclick = function(){
      const c = cityById(b.dataset.city);
      if (!cityOpen(c)){ A.fail(); toast(t('needs',{n:c.starsReq}) + ' — ' + c.name + ' · ' + c.vehicle, 2600); return; }
      save.city = c.id; persist(); openCity(c.id);
    };
  });
}
function openCity(id){
  const c = cityById(id);
  $('#cityHeroFlag').textContent = c.flag;
  $('#cityTitle').textContent = c.name;
  $('#cityMeta').textContent = c.country + ' · ' + c.cur.code + ' · ' + c.vehicle + ' · ' + c.lanes + ' lanes';
  $('#cityBlurb').textContent = c.blurb;
  $('#cityHi').textContent = c.native.hi;
  $('#cityHiNote').textContent = c.native.lang + ' for “' + c.native.note + '” · “' + c.slang.horn + '” is the horn call here';
  $('#cityRadioName').textContent = c.radio.name + ' — ' + c.radio.tag;
  $('#legend').innerHTML = legendRows(c);
  renderCodex(c);
  $('#routeList').innerHTML = c.routes.map(function(r, i){
    const openr = routeOpen(c, i), st = save.routeStars[r.id] || 0, bst = save.cityBest[r.id] || 0;
    const tg = starTargets(c, r);
    return '<button class="city '+(openr?'':'locked')+' '+(st===3?'here':'')+'" data-route="'+i+'">' +
      '<span class="flag">'+(i+1)+'</span><span class="grow"><span class="nm">'+r.name+'</span>' +
      '<span class="mt">'+r.via+' · '+r.stops.length+' stops · '+t('fare')+' '+money(creditsPerPax(c,r), c)+'/pax</span>' +
      '<span class="mt stars">'+starStr(st)+' <span style="opacity:.55;font-size:10px">'+ (bst? t('bestHere')+': '+idx(bst) : (r.stops.length-1)+' stops') +'</span></span></span>' +
      (openr ? (st===3 ? '<span class="pill g">CLEARED</span>' : '<span class="pill">GO</span>')
             : '<span class="pill r">'+routeReqStars(i)+'★</span>') + '</button>';
  }).join('');
  $$('#routeList [data-route]').forEach(function(b){
    b.onclick = function(){
      const i = +b.dataset.route;
      if (!routeOpen(c, i)){ A.fail(); toast(c.name+' needs '+cityStars(c.id)+'★ — ' + t('needs',{n:routeReqStars(i)}), 2600); return; }
      A.init(); A.resume(); lastPlay = {city:c.id, route:i}; startRun(c.id, i);
    };
  });
  show('scr-city');
}
/* the city's own page: who taxes you, what the weather does, the local bonus */
function renderCodex(c){
  const st = c.street; if (!st){ $('#cityCodex').innerHTML = '<div class="tiny">No street pack for this city yet.</div>'; return; }
  const talk = st.talk || {};
  const talkHtml = [['board', talk.board, talk.boardEn], ['thanks', talk.thanks, talk.thanksEn],
    ['miss', talk.miss, talk.missEn]].filter(r=>r[1]).map(function(r){
      return '<span class="talkchip"><b>' + r[1] + '</b><span>' + (r[2]||'') + '</span></span>';
    }).join('');
  const evs = (st.events||[]).map(function(e){
    const fx = Object.keys(e.effects||{}).map(function(k){
      return { grip:'loose grip', visibility:'low visibility', traffic:'heavy traffic', pax:'passenger surge',
        speed:'slow going', drift:'side wind', checkpoint:'more checkpoints', hazards:'new hazards'}[k] || k;
    }).join(', ');
    return '<div class="codexrow"><div class="ic">' + e.emoji + '</div><div><b>' + e.name +
      ' <span style="opacity:.6;font-weight:700">· ' + e.nameEn + '</span></b><span>' + fx + ' · lasts ~' +
      (e.dur||18) + 's</span></div></div>';
  }).join('');
  $('#cityCodex').innerHTML =
    '<div class="codexrow"><div class="ic">' + (st.crew?st.crew.emoji:'🚏') + '</div><div><b>' +
      (st.crew ? st.crew.name + ' — ' + st.crew.line : 'No crew at these stops') + '</b><span>' +
      (st.crew ? 'They hold the yellow box and take ' + Math.round(st.crew.toll*100) + '% of a fare per second until you HORN them off. ' +
        'Clear them for a tip. <i>' + st.crew.lineEn + '</i>  ·  “' + st.crew.scatter + '”' : '') + '</span></div></div>' +
    '<div class="codexrow"><div class="ic">🌦️</div><div><b>City conditions</b><span>' + evs + '</span></div></div>' +
    '<div class="codexrow"><div class="ic">🏅</div><div><b>Signature · ' + st.bonus.name + '</b><span>' +
      st.bonus.desc + ' — pays ' + Math.round(st.bonus.mult*100) + '% of your fare again.</span></div></div>' +
    '<div class="codexrow"><div class="ic">🗣️</div><div><b>Street talk' +
      (st.script ? ' · ' + st.script : '') + '</b><span style="margin-top:5px">' + talkHtml + '</span></div></div>' +
    '<div class="codexrow"><div class="ic">🔤</div><div><b>Stop names in local script</b>' +
      '<span class="nat sm" style="margin-top:4px">' +
      (c.routes[0].stopsNative || c.routes[0].stops).join(' · ') + '</span>' +
      '<span>' + (st.scriptNote || '') + ' · turn this off in Settings if you prefer plain English.</span></div></div>';
}
function legendRows(c){
  const map = {pothole:'🕳️', bump:'⚡', bike:'🛵', ped:'🚶', hawker:'🧺', checkpoint:'🚧', cow:'🐄', cone:'🚧', flood:'🌊'};
  const rows = c.hazards.filter((v,i,a)=>a.indexOf(v)===i).map(function(h){
    return '<div class="legend"><b>'+map[h]+'</b><span>'+c.labels[h]+'</span></div>';
  });
  rows.push('<div class="legend"><b>📢</b><span>'+c.slang.horn+' — horn scatters them for combo</span></div>');
  return rows.join('');
}
function renderHow(){
  $('#howLegend').innerHTML = legendRows(cityById(save.city));
  /* the tutorial speaks in your city's words: a Nairobi player reads "manambas",
     not "agberos". Small thing, but it is the difference between visiting and living here. */
  const hc = cityById(save.home || save.city), st = hc.street || {}, tk = st.talk || {};
  if ($('#howHorn')) $('#howHorn').textContent = (hc.slang && hc.slang.horn) || 'OWA!';
  if ($('#howHornLine')) $('#howHornLine').textContent = tk.horn
    ? 'Here the street answers “' + tk.horn + '”' + (tk.hornEn ? ' (' + tk.hornEn + ')' : '') + '.' : '';
  if ($('#howCrew')) $('#howCrew').textContent = st.crew
    ? st.crew.name.toLowerCase() + 's here in ' + hc.name + ' — ' + (st.crew.lineEn || st.crew.line)
    : 'the people who work the stops';
  if ($('#howCrewLine')) $('#howCrewLine').textContent = st.crew && st.crew.line
    ? '“' + st.crew.line + '”' : '';
}
/* ------------------------------------------------------------------ GARAGE */
function renderGarage(){
  const city = cityById(save.city);
  $('#walletGarage').textContent = money(save.wallet, city);
  $('#liveryName').textContent = (PAINTS.filter(p=>p.id===save.paint)[0]||PAINTS[0]).name + ' · ' + city.vehicle;
  paintPreview();
  $('#shopList').innerHTML = PARTS.map(function(p){
    const lv = partLevel(p.id), maxed = partMaxed(p.id), cost = partCost(p.id), gate = partGate(p.id);
    const locked = totalStars() < gate;
    const can = !maxed && !locked && save.wallet >= cost;
    let pips = '';
    for (let i=0;i<p.levels.length;i++) pips += '<i class="'+(i<lv?'f':'')+'"></i>';
    return '<div class="shop"><div class="hd"><div><div class="nm">'+p.icon+' '+p.name+'</div>' +
      '<div class="tiny">'+p.stat+' · '+p.levels[Math.min(lv, p.levels.length-1)]+'</div></div>' +
      '<div style="text-align:right"><div class="lbl">'+t('level',{n:lv+1})+'</div>' +
      (maxed ? '<div class="chip g">MAX</div>' : locked ? '<div class="chip r">'+gate+'★</div>' :
        '<div style="font-weight:900;font-size:13px;color:var(--y)">'+money(cost, city)+'</div>') +
      '</div></div>' +
      '<div class="pips">'+pips+'</div>' +
      (maxed ? '' : '<button class="btn sm '+(can?'':'ghost')+'" data-part="'+p.id+'" '+(can?'':'disabled style="opacity:.55"')+'>' +
        (locked ? t('needs',{n:gate}) : t('buy')+' · '+money(cost, city))+'</button>') +
      '</div>';
  }).join('');
  $$('#shopList [data-part]').forEach(function(b){
    b.onclick = function(){
      const id = b.dataset.part, cost = partCost(id), gate = partGate(id);
      if (totalStars() < gate){ A.fail(); toast(t('needs',{n:gate}), 2000); return; }
      if (save.wallet < cost){ A.fail(); toast('You need ' + money(cost - save.wallet, city) + ' more', 2200); return; }
      save.wallet -= cost; save.parts[id] = partLevel(id)+1; persist();
      A.coin(); A.mission(); toast(PARTS.filter(p=>p.id===id)[0].name + ' → ' + PARTS.filter(p=>p.id===id)[0].levels[partLevel(id)], 2200);
      renderGarage(); renderHome();
    };
  });
  $('#paintList').innerHTML = PAINTS.map(function(p){
    const owned = save.paints.indexOf(p.id) >= 0, on = save.paint === p.id;
    return '<button data-paint="'+p.id+'" style="text-align:left">' +
      '<div class="swatch '+(on?'on':'')+'" style="background:linear-gradient(135deg,'+p.body+','+p.roof+')"></div>' +
      '<div style="font-size:11px;font-weight:900;margin-top:5px;color:var(--cream)">'+p.name+'</div>' +
      '<div class="tiny" style="opacity:.6">'+(owned ? (on?'IN USE':'TAP TO USE') : money(p.price, city))+'</div></button>';
  }).join('');
  $$('#paintList [data-paint]').forEach(function(b){
    b.onclick = function(){
      const id = b.dataset.paint, p = PAINTS.filter(x=>x.id===id)[0];
      if (save.paints.indexOf(id) < 0){
        if (save.wallet < p.price){ A.fail(); toast('You need ' + money(p.price - save.wallet, city), 2200); return; }
        save.wallet -= p.price; save.paints.push(id); A.coin(); toast(p.name + ' bought · ' + p.note, 2400);
      }
      save.paint = id; persist(); A.ui(); renderGarage(); renderHome();
    };
  });
}
/* ------------------------------------------------------------------ BOARD */
let boardTab = 'city';
async function renderBoard(){
  const city = cityById(save.city);
  if (boardTab === 'daily' && netAvailable()){
    const rows = await netBoard(city.id, 'daily') || [];
    paintBoard(rows, city, 'daily'); return;
  }
  if (boardTab === 'city' && netAvailable()){
    const rows = await netBoard(city.id, 'city');
    if (rows){ paintBoard(rows.concat(myBoardEntries(city.id)), city, 'city'); return; }
  }
  if (boardTab === 'global' && netAvailable()){
    const rows = await netBoard(city.id, 'global');
    if (rows){ paintBoard(rows.concat(save.runs.map(r=>({name:(save.name||'You'), idx:r.idx, me:true, tag:'you'})), city, 'global')); return; }
  }
  paintBoard(boardMerged(city.id, boardTab), city, boardTab);
}
function paintBoard(rows, city, tab){
  const merged = rows.slice().sort((a,b)=>b.idx-a.idx);
  const seen = {}; const out = [];
  merged.forEach(r=>{ const k = (r.me ? 'me' + r.idx : r.name); if (seen[k]) return; seen[k]=1; out.push(r); });
  paintRows(out.slice(0,40), city, tab);
}
function paintRows(rows, city, tab){
  $('#boardMeta').textContent = tab === 'daily'
    ? '📅 Daily run · everyone on the same route today'
    : tab === 'global' ? (netAvailable() ? 'Career fare index — the world board' : 'Fare index across every city — one number, whole world.')
    : tab === 'me' ? 'Your last runs, newest first.'
    : city.flag + ' ' + city.name + ' · ' + (netAvailable() ? 'live world board' : 'local board, refreshed daily');
  $$('#boardTabs button').forEach(b=>b.classList.toggle('on', b.dataset.tab === boardTab));
  void city;
  if (!rows.length){ $('#boardList').innerHTML = '<div class="ticket glass" style="text-align:center"><div class="tiny">'+
    'No runs yet. Finish a route and your name lands here.</div></div>'; }
  else {
    $('#boardList').innerHTML = rows.map(function(r, i){
      const medal = i===0?'g':i===1?'s':i===2?'b':'';
      return '<div class="board '+(r.me?'me':'')+'">' +
        '<span class="rk '+medal+'">'+(i<3?['🥇','🥈','🥉'][i]:i+1)+'</span>' +
        '<span class="grow"><span class="who">'+r.name+(r.me?' · you':'')+'</span>' +
        '<span class="tiny">'+(tab==='me'
            ? (cityById(r.city).flag + ' ' + r.rname + ' · ' + starStr(r.star||0) + ' · ' + ago(r.at) + (r.best?' · personal best':''))
            : (r.tag || (tab==='global' ? 'world driver' : tab==='daily' ? 'daily run' : city.vehicle + ' driver')))+'</span></span>' +
        '<span class="amt">'+idx(r.idx)+'</span></div>';
    }).join('');
  }
  $('#boardNote').textContent = netAvailable() ? 'Live world board · scores validated on the server.'
    : boardTab === 'global'
    ? 'Rivals are seeded locally while you play offline. Sign in for the real world board.'
    : 'Beats are personal. Your score posts the moment a run ends.';
}
/* ------------------------------------------------------------------ ACCOUNT */
function renderAccount(){
  const signed = !!(save.acct && save.acct.name);
  $('#acctOut').style.display = signed ? 'block' : 'none';
  $('#acctIn').style.display = signed ? 'none' : 'block';
  $('#acctSub').textContent = signed
    ? 'Your runs post to the world board.' : 'Optional. The game works offline without it.';
  if (signed){
    $('#acctName').textContent = save.acct.name;
    $('#acctMeta').innerHTML = rankOf().name + ' · ' + totalStars() + '★ · fare index ' + idx(save.total.credits) +
      ' · ' + (save.total.sigs||0) + ' signatures';
    $('#acctChip').textContent = netAvailable() ? 'LIVE' : 'OFFLINE';
    $('#acctChip').className = 'chip ' + (netAvailable() ? 'y' : 'd');
    $('#acctSyncNote').textContent = save.cloudAt
      ? 'Last sync: ' + ago(save.cloudAt) + '. Sync up copies this phone to the cloud; pull down replaces this phone.'
      : 'Never synced. Sync up copies this phone to the cloud; pull down replaces this phone.';
  }
  $('#boardModeNote').innerHTML = netAvailable()
    ? 'Board mode: <b>live world board</b> · ' + idx(NET.server.users||0) + ' driver(s) registered, ' +
      idx(NET.server.scores||0) + ' run(s) recorded, scores validated server-side.'
    : 'Board mode: <b>offline, this phone only</b>' +
      (netBase() ? ' — no API answered on ' + netBase() + '.' : ' — open the game over http(s) with the Fare City server to go live.') +
      ' Everything still saves locally.';
}
async function doRegister(){
  const n = ($('#inpUser').value||'').trim(), p = $('#inpPass').value||'';
  $('#acctErr').textContent = '';
  try{
    await acctRegister(n, p);
    save.name = save.acct.name; persist();
    A.mission(); toast('Welcome, ' + save.acct.name + '. You are on the world board.', 2600);
    renderAccount(); renderHome();
  }catch(e){ $('#acctErr').textContent = e.message; A.fail(); }
}
async function doLogin(){
  const n = ($('#inpUser').value||'').trim(), p = $('#inpPass').value||'';
  $('#acctErr').textContent = '';
  try{
    await acctLogin(n, p);
    save.name = save.acct.name; persist();
    toast('Signed in as ' + save.acct.name, 2200);
    renderAccount(); renderHome();
  }catch(e){ $('#acctErr').textContent = e.message; A.fail(); }
}
/* ------------------------------------------------------------------ SETTINGS */
function renderSettings(){
  $('#swSfx').className = 'sw' + (save.set.sfx?' on':'');
  $('#swRadio').className = 'sw' + (save.set.music?' on':'');
  $('#swAuto').className = 'sw' + (save.set.auto?' on':'');
  $('#swLeft').className = 'sw' + (save.set.left?' on':'');
  $('#swCalm').className = 'sw' + (save.set.calm?' on':'');
  $('#swBuzz').className = 'sw' + (save.set.buzz?' on':'');
  $('#swScript').className = 'sw' + (save.set.script?' on':'');
  $('#rngMusic').value = save.set.mv; $('#rngSfx').value = save.set.sv;
  $('#inpName').value = save.name || '';
  const q = $('#stQuality'); if (q) q.textContent = FX.eco ? 'Auto · eco (slower phone)' : 'Auto · high';
  $('#langEn').classList.toggle('on', LANG==='en'); $('#langPcm').classList.toggle('on', LANG==='pcm');
  document.body.classList.toggle('lefty', !!save.set.left);
}
/* ------------------------------------------------------------------ RESULT */
/* every finished run posts itself when a server is there */
async function postScoreNow(verbose){
  const payload = { city:G.city.id, route:G.route.id, idx:Math.round(G.credits), stars:G.starsEarned||0,
    pax:G.paxDropped||0, owa:G.owa||0, dist:Math.round(G.dist/UNITS_PER_M), ms:Math.round(G.t*1000),
    combo:G.topCombo||1, sig: G.sigDone ? 1 : 0, daily: G.dailyRun ? dailyPick().key : null,
    trail: (G.dailyRun && G.trail && G.trail.length > 2) ? G.trail.slice(0, 1200) : null,
    name: save.name, anon: !(save.acct && save.acct.token) };
  if (G.dailyRun){
    save.daily = { key:dailyPick().key, done:true, score:Math.round(G.credits), rank:0 };
    persist();
  }
  if (!netAvailable()){ if (verbose) toast('Saved on this phone. Sign in to post to the world board.', 2400); return; }
  const j = await netPostScore(payload);
  if (j && j.rank){
    if (G.dailyRun){ save.daily.rank = j.rank; persist(); }
    if (verbose || true) toast('Posted · world rank #' + j.rank + ' ' + (j.scope === 'daily' ? 'in today\'s daily run' : 'for ' + cityById(G.city.id).name), 2800);
  } else if (verbose) toast('Could not reach the board — score kept on this phone.', 2400);
}
/* ---------------- postcard: the place you just drove ----------------
   Every run ends with a small piece of a real city — who holds the stop, what the
   horn says, what people shout when they get off. That is the bit worth sending
   to a friend, and it is the same card in Lagos, Cairo or New York. */
function renderPostcard(c, r){
  const box = $('#postcard'); if (!box) return;
  const st = c.street, tk = (st && st.talk) || {};
  const say = [['board', tk.board, tk.boardEn], ['thanks', tk.thanks, tk.thanksEn]]
    .filter(function(x){ return !!x[1]; })
    .map(function(x){ return '<span class="pcsay">' + x[1] + ' <i>' + (x[2] || '') + '</i></span>'; })
    .join('  ·  ');
  const crew = st && st.crew ? st.crew.name + ' <i>' + (st.crew.lineEn || '') + '</i>' : null;
  const lastStop = (r.stopsNative && r.stopsNative[r.stopsNative.length - 1]) || r.stops[r.stops.length - 1];
  box.innerHTML =
    '<div class="postcard">' +
      '<div class="pcstamp">' + c.flag + '</div>' +
      '<h4>Postcard · ' + c.name + '</h4>' +
      '<div class="pcsub">' + r.name + ' · ' + (c.country || '') + '</div>' +
      '<div class="pcrow"><b>You drove</b><span>' + c.vehicle + ' · ' + c.cur.sym + ' ' + c.cur.code +
        ' · ' + c.radio.name + '</span></div>' +
      '<div class="pcrow"><b>Horn says</b><span class="nat">' + (c.slang ? c.slang.horn : '—') + '</span></div>' +
      (crew ? '<div class="pcrow"><b>At the stop</b><span>' + crew + '</span></div>' : '') +
      (say ? '<div class="pcrow"><b>They say</b><span>' + say + '</span></div>' : '') +
      '<div class="pcrow"><b>Last stop</b><span class="nat sm">' + lastStop + '</span></div>' +
      (st && st.bonus ? '<div class="pcrow"><b>Local trick</b><span>' + st.bonus.name + ' — ' + st.bonus.desc + '</span></div>' : '') +
      '<button class="btn ghost sm pcshare" id="btnSharePc">📤 Send this postcard</button>' +
    '</div>';
  const b = $('#btnSharePc');
  if (b) b.onclick = function(){ doShare({ credits:G.credits, city:c.id, idx:G.credits }); };
}
function showResult(d){
  const c = G.city, r = G.route;
  const stopped = d.reason === 'stopped';
  $('#resKicker').textContent = d.reason==='wahala' ? 'Wahala!' : stopped ? 'You packed up' : d.stars===3 ? 'Correct driver!' : 'Route complete';
  $('#resTitle').textContent = d.reason==='wahala' ? (LANG==='pcm' ? 'Bus don spoil' : 'Bus is out') : t('runEnded');
  $('#resStamp').textContent = (save.name||'DANFO').slice(0,9).toUpperCase() + ' ' + String(new Date().getDate()).padStart(2,'0');
  $('#resStars').innerHTML = starStr(d.stars).split('').map(s=>'<span style="color:'+(s==='★'?'#F2A900':'rgba(20,20,26,.18)')+'">'+s+'</span>').join('');
  $('#resFare').textContent = money(G.credits, c);
  $('#resPax').textContent = G.paxDropped || 0;
  $('#resCombo').textContent = 'x' + (G.topCombo||1).toFixed(1);
  $('#resOwa').textContent = G.owa;
  $('#resDist').textContent = commas(Math.round(G.dist/UNITS_PER_M)) + 'm';
  $('#resGlobal').textContent = idx(d.idxScore);
  $('#resRouteLbl').textContent = c.flag + ' ' + c.name + ' · ' + r.via;
  $('#resRoute').textContent = r.name;
  $('#resBest').textContent = idx(d.best);
  const un = [];
  if (G.sigDone) un.push('🏅 ' + c.name + ' signature · ' + G.sigDone.name + ' — ' + G.sigDone.desc + '  +' +
    money(G.sigDone.amt, c));
  if (G.dailyRun) un.push('📅 Daily run posted · resets in ' + dailyMsLeft() + '.');
  if (G.crewsTax > 0) un.push('🤑 ' + c.street.crew.name + ' collected ' + money(G.crewsTax, c) +
    ' at the stops. Horn them off next time.');
  if (d.opened) un.push('🎉 ' + t('newCity', {c:d.opened.flag + ' ' + d.opened.name}) + ' — ' + d.opened.vehicle + ' dey wait.');
  if (d.newRoute) un.push('🔓 ' + t('newRoute', {r:d.newRoute.city.routes[d.newRoute.i].name}) + ' in ' + d.newRoute.city.flag + ' ' + d.newRoute.city.name + '.');
  if (d.bonus > 0) un.push('💸 End-of-route bonus ' + money(d.bonus, c) + (G.perfectRun ? ' — clean run, no fines.' : '.'));
  if (d.stars < 3) un.push('⭐ Next star here needs fare index ' + idx(d.targets[d.stars]) + '.');
  else un.push('⭐ Three stars on ' + c.name + ' route ' + (lastPlay.route+1) + '. Try the next route for a bigger fare.');
  $('#resUnlock').style.display = 'block';
  $('#resUnlockTxt').innerHTML = un.join('<br>');
  const tg = d.targets;
  $('#resHint').innerHTML = d.stars >= 3
    ? 'Three stars. ' + money(creditsPerPax(c,r), c) + ' a passenger is route money — try a harder route.'
    : 'Next star at <b>' + idx(tg[d.stars] != null ? tg[d.stars] : tg[2]) + '</b> fare index. ' +
      (G.missed ? 'You missed ' + G.missed + ' stop' + (G.missed>1?'s':'') + ' — drop them where they asked.' : 'Use the horn for OWA! combos to stack fare.');
  $('#btnPost').textContent = t('postScore');
  renderPostcard(c, r);
  show('scr-result');
  renderHome();
  if (G.dailyRun || netAvailable()) postScoreNow(false);
}
/* ------------------------------------------------------------------ INPUT */
let dragging = null;
function canvasPos(e){
  const r = cv.getBoundingClientRect();
  return { x:(e.clientX - r.left) / (r.width/W), y:(e.clientY - r.top) / (r.height/H) };
}
function bindInput(){
  cv.addEventListener('pointerdown', function(e){
    A.init(); A.resume();
    const p = canvasPos(e); dragging = {x:p.x, y:p.y, t:performance.now(), moved:0};
    cv.setPointerCapture(e.pointerId);
  });
  cv.addEventListener('pointermove', function(e){
    if (!dragging) return;
    const p = canvasPos(e);
    dragging.moved = Math.max(dragging.moved, Math.abs(p.x - dragging.x));
    if (G.mode === 'run' && !G.paused){
      const lim = (G.city.lanes-1)/2*253 + 40;
      const want = clamp((p.x - CX) * 1.18, -lim, lim);
      G.steer = clamp((want - G.lat)/140, -1, 1);
    }
    dragging.x = p.x; dragging.y = p.y;
  });
  cv.addEventListener('pointerup', function(e){
    if (!dragging) return;
    const dy = canvasPos(e).y - dragging.y, dt = (performance.now() - dragging.t)/1000;
    if (dragging.moved < 26 && dt < 0.35 && dy < 0) hop();
    else if (dy < -34 && dt < 0.34) hop();
    G.steer = 0; dragging = null;
  });
  cv.addEventListener('pointercancel', function(){ dragging = null; G.steer = 0; });
  const hold = function(el, on, off){
    el.addEventListener('pointerdown', function(e){ e.preventDefault(); A.init(); A.resume(); on(); });
    ['pointerup','pointercancel','pointerleave'].forEach(function(ev){ el.addEventListener(ev, function(){ if (off) off(); }); });
  };
  hold($('#btnGas'),   function(){ G.gas = true; },  function(){ G.gas = false; });
  hold($('#btnBrake'), function(){ G.brake = true; },function(){ G.brake = false; });
  hold($('#btnHorn'),  horn);
  hold($('#btnHop'),   hop);
  hold($('#btnBoost'), boost);
  $('#btnPause').onclick = function(){ pauseGame(); };
  window.addEventListener('keydown', function(e){
    if (e.target && e.target.tagName === 'INPUT') return;
    if (e.key === 'ArrowLeft'){ G.steer = -1; }
    else if (e.key === 'ArrowRight'){ G.steer = 1; }
    else if (e.key === 'ArrowUp'){ G.gas = true; }
    else if (e.key === 'ArrowDown'){ G.brake = true; }
    else if (e.key === ' '){ e.preventDefault(); hop(); }
    else if (e.key === 'h' || e.key === 'H'){ horn(); }
    else if (e.key === 'Shift'){ boost(); }
    else if (e.key === 'p' || e.key === 'P'){ pauseGame(); }
    else if (e.key === 'Escape'){ pauseGame(); }
    else if (e.key === 'm' || e.key === 'M'){ save.set.music = save.set.music?0:1; A.vol(); persist(); toast(save.set.music?'Radio on':'Radio off', 1200); }
    else if (e.key === 'r' || e.key === 'R'){ nextStation(); }
  });
  window.addEventListener('keyup', function(e){
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') G.steer = 0;
    if (e.key === 'ArrowUp') G.gas = false;
    if (e.key === 'ArrowDown') G.brake = false;
  });
  $('#radio').onclick = nextStation;
  document.addEventListener('visibilitychange', function(){ if (document.hidden && G.mode === 'run' && !G.paused) pauseGame(); });
  $$('[data-back]').forEach(function(b){
    b.onclick = function(){
      let tgt = b.dataset.back;
      if (tgt === '__prev') tgt = (prevScreen === 'scr-boot' || !prevScreen) ? 'scr-home' : prevScreen;
      if (tgt === 'scr-pause' && G.mode !== 'run') tgt = 'scr-home';
      show(tgt);
      A.ui();
    };
  });
}
function nextStation(){
  const open = CITY_PACKS.filter(cityOpen);
  if (open.length < 2) { radio.tuneSound(); banner('📻 ' + cityById(save.city).radio.name); return; }
  const i = open.map(c=>c.id).indexOf(save.city);
  const nxt = open[(i + 1 + open.length) % open.length];
  save.city = nxt.id; persist();
  radio.tuneSound(); radio.tune(nxt, true);
  banner('📻 ' + nxt.flag + ' ' + nxt.radio.name + ' · ' + nxt.radio.tag);
  toast('Tuned to ' + nxt.name + ' — drive there from Cities', 2200);
}
function pauseGame(){
  if (G.mode !== 'run'){ return; }
  if (G.paused){ resumeGame(); return; }
  G.paused = true; radio.stop(); A.engineSet(0,0);
  $('#pauseGrid').innerHTML =
    '<button class="btn" id="btnResume2">'+t('keepDriving')+'</button>' +
    '<div class="grid g2"><button class="btn ghost sm" id="btnPauseSet2">⚙️ '+t('settings')+'</button>' +
    '<button class="btn ghost sm" id="btnPauseHow2">❓ '+t('howTo')+'</button></div>' +
    '<button class="btn red sm" id="btnEndRun2">'+t('endRun')+'</button>';
  $('#btnResume2').onclick = resumeGame;
  $('#btnEndRun2').onclick = function(){ G.paused = false; endRun('stopped'); };
  $('#btnPauseSet2').onclick = function(){ pausePrev = 'scr-pause'; show('scr-set'); };
  $('#btnPauseHow2').onclick = function(){ pausePrev = 'scr-pause'; show('scr-how'); };
  show('scr-pause');
}
let pausePrev = 'scr-home';
function resumeGame(){
  G.paused = false;
  if (G.mode === 'run'){ radio.start(); show('scr-hud'); }
  else show('scr-home');
}
/* ------------------------------------------------------------------ BOOT */
function boot(){
  loadGame();
  CITY_PACKS.forEach(function(c){ openCache[c.id] = cityOpen(c); });
  rollMissions();
  if (!save.name) save.name = pick(['Omo Eko','Tokunbo','Danfo Baba','Conductor','Baba Nkechi','Oga Driver']);
  renderHome();
  $('#btnStart').onclick = function(){
    A.init(); A.resume();
    if (!save.pickedHome){ renderWhere(); show('scr-where'); }
    else if (!save.seenHow){ save.seenHow = true; persist(); show('scr-how'); }
    else show('scr-home');
  };
  $('#btnHowBoot').onclick = function(){ save.seenHow = true; persist(); show('scr-how'); };
  $('#btnLangBoot').onclick = function(){ LANG = LANG === 'en' ? 'pcm' : 'en'; save.lang = LANG; persist();
    $('#btnLangBoot').textContent = LANG === 'en' ? 'EN / Pidgin' : 'Pidgin / EN';
    $('#bootTag').innerHTML = t('tagline');
    toast(LANG==='pcm' ? 'Pidgin dey on' : 'English on', 1400);
  };
  $('#btnGoMap').onclick = function(){ show('scr-map'); };
  $('#btnGoGarage').onclick = function(){ show('scr-garage'); };
  $('#btnGoHow2').onclick = function(){ show('scr-how'); };
  $('#btnGoBoard').onclick = function(){ show('scr-board'); };
  $('#btnGoSet').onclick = function(){ show('scr-set'); };
  $('#againFromResult');
  $('#btnAgain').onclick = function(){ A.init(); A.resume(); startRun(lastPlay.city, lastPlay.route); };
  $('#btnHome').onclick = function(){ show('scr-home'); };
  $('#btnShareRes').onclick = function(){ doShare({credits:G.credits, city:G.city.id, idx:Math.round(G.credits)}); };
  $('#btnShareHome').onclick = function(){ doShare({credits:save.total.credits, city:save.city, idx:Math.round(save.total.credits)}); };
  $('#btnPost').onclick = function(){
    A.mission();
    postWorldScore({ name:save.name, city:G.city.id, route:G.route.id, idx:Math.round(G.credits), stars:G.starsEarned||0 });
    postScoreNow(true);
  };
  /* settings widgets */
  const toggles = [['swSfx','sfx'],['swRadio','music'],['swAuto','auto'],['swLeft','left'],
    ['swCalm','calm'],['swBuzz','buzz'],['swScript','script']];
  toggles.forEach(function(pair){
    $('#'+pair[0]).onclick = function(){
      save.set[pair[1]] = save.set[pair[1]] ? 0 : 1;
      this.className = 'sw' + (save.set[pair[1]] ? ' on' : '');
      if (pair[1] === 'left') document.body.classList.toggle('lefty', !!save.set.left);
      if (pair[1] === 'script'){ hudCache.nxt = null; toast(save.set.script ? 'Local script on' : 'English names only', 1500); }
      A.vol(); persist(); A.ui();
    };
  });
  $('#rngMusic').oninput = function(){ save.set.mv = +this.value; A.vol(); persist(); };
  $('#rngSfx').oninput = function(){ save.set.sv = +this.value; A.vol(); persist(); };
  $('#inpName').oninput = function(){ save.name = this.value.slice(0,14); persist(); };
  $('#langEn').onclick = function(){ LANG = 'en'; save.lang = 'en'; persist(); renderSettings(); renderHome(); };
  $('#langPcm').onclick = function(){ LANG = 'pcm'; save.lang = 'pcm'; persist(); renderSettings(); renderHome(); };
  $('#btnWipe').onclick = function(){
    if (!confirm('Wipe all progress? Wallet, stars, fleet and leaderboard go.')) return;
    try { localStorage.removeItem(SAVE_KEY); } catch(e){}
    save = blankSave(); rollMissions(); persist(); renderHome(); toast('Fresh start', 1600);
  };
  $('#btnInstall').onclick = installApp;
  $$('#boardTabs button').forEach(function(b){
    b.onclick = function(){ boardTab = b.dataset.tab; A.ui(); renderBoard(); };
  });
  /* cookie line */
  if (!save.cookie){
    $('#cookie').style.display = 'block';
    $('#btnCookYes').onclick = finishCookie; $('#btnCookNo').onclick = finishCookie;
  }
  function finishCookie(){ save.cookie = true; persist(); $('#cookie').style.display = 'none'; }
  renderAccount();
  netProbe().then(function(){
    renderAccount(); renderHome();
    if (netAvailable() && save.acct && save.acct.token) acctRefresh().then(renderAccount);
  });
  bindInput();
  /* account + daily wiring */
  $('#btnGoAcct').onclick = function(){ show('scr-account'); };
  $('#btnGoAcct2').onclick = function(){ show('scr-account'); };
  if ($('#btnGoWhere')) $('#btnGoWhere').onclick = function(){ renderWhere(); show('scr-where'); };
  $('#btnRegister').onclick = doRegister;
  $('#btnLogin').onclick = doLogin;
  $('#btnSignOut').onclick = function(){ acctSignOut(); toast('Signed out. Still playing offline.', 2000); renderAccount(); renderHome(); };
  $('#btnAcctDaily').onclick = function(){ playDaily(); };
  $('#btnPush').onclick = async function(){
    try{ await netPushProgress(); toast('Progress synced to the cloud.', 2400); renderAccount(); }
    catch(e){ toast('Could not sync: ' + e.message, 2600); }
  };
  $('#btnPull').onclick = async function(){
    if (!confirm('Replace this phone\'s progress with the cloud copy?')) return;
    try{ const m = await netPullProgress(); if (m){ rollMissions(); renderAccount(); renderHome(); toast('Pulled from the cloud.', 2400); } else toast('Nothing saved in the cloud yet.', 2200); }
    catch(e){ toast('Could not pull: ' + e.message, 2600); }
  };
  $('#btnDaily').onclick = function(){ playDaily(); };

  /* install prompt */
  window.addEventListener('beforeinstallprompt', function(e){ e.preventDefault(); deferredPrompt = e; });
  /* register the offline cache where it is allowed; sandboxed frames throw on
     even reading navigator.serviceWorker, so the whole probe is guarded */
  try {
    if (location.protocol.indexOf('http') === 0 && navigator.serviceWorker){
      navigator.serviceWorker.register('sw.js').catch(function(){});
    }
  } catch(e){ /* sandboxed preview: play offline caching just stays off */ }
}
let deferredPrompt = null;
function playDaily(){
  if (dailyPlayed()){ toast('Daily run already done. Resets in ' + dailyMsLeft() + '.', 2400); return; }
  const dp = dailyPick();
  const c = dp.cityObj, r = c.routes[dp.route];
  if (G.mode === 'run') return;
  if (!confirm('Daily run\n\n' + c.flag + ' ' + c.name + ' · ' + r.name + '\nOne attempt for the whole world today.\n\nDrive now?')) return;
  A.init(); A.resume();
  G.dailyRun = true;
  lastPlay = { city:c.id, route:dp.route };
  startRun(c.id, dp.route);
  toast('📅 Daily run · one shot · racing the world', 2600);
  netGhost(dp.key).then(function(g){
    if (g && g.trail && g.trail.length > 2 && G.dailyRun){ G.ghost = g; }
  });
}
function installApp(){
  if (deferredPrompt){ deferredPrompt.prompt(); deferredPrompt = null; return; }
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
  toast(ios ? 'Tap Share ⇪ then “Add to Home Screen”' : 'Open the browser menu → Install app', 3600);
}
/* ------------------------------------------------------------------ LOOP */
let last = 0, running = true;
function loop(ts){
  const dt = Math.min(0.05, (ts - last)/1000 || 0.016); last = ts;
  qualityTick(dt*1000);
  if (G.mode === 'run' || G.mode === 'done'){ update(dt); render(dt); }
  else {
    /* idle garage scene: gentle bus idle for the menu backdrop */
    G.t += dt; G.city = G.city || cityById(save.city); G.route = G.route || G.city.routes[0];
    G.dist += dt*90; G.paint = paintOf();
    if (!G.sky.length){ G.sky = makeSkyline(G.city, 99); G.road = makeRoadside(G.city, 99); }
    updateIdle(dt);
    render(dt);
  }
  requestAnimationFrame(loop);
}
function updateIdle(dt){
  G.speed = 90; G.lat = Math.sin(G.t*0.4)*40; G.bounce = Math.sin(G.t*8)*1.2; G.tilt = Math.cos(G.t*0.4)*0.03;
  const city = G.city;
  if (G.npc.length < 8 && Math.random() < dt*3){
    G.npc.push({ z:G.dist + rnd(1200,2600), lat:laneLat(ri(0,city.lanes-1), city.lanes),
      sp:rnd(150,260), colour:pick(city.trafficColours), big:Math.random()<.2, toward:true, passed:true });
  }
  G.npc.forEach(function(n){ n.z += (n.sp - G.speed)*dt; });
  G.npc = G.npc.filter(n=>n.z > G.dist - 300);
  if (Math.random() < dt*3) puff(G.dist - 96, G.lat - 60, 'rgba(70,70,74,.3)', 1, .7);
}
function fit(){
  applyRaster();
  /* keep the whole stage inside the device safe area (notch, home bar, rounded corners) */
  const cs = getComputedStyle(document.documentElement);
  const num = function(v){ const n = parseFloat(cs.getPropertyValue(v)); return isNaN(n) ? 0 : n; };
  const sat = num('--sat'), sab = num('--sab'), sal = num('--sal'), sar = num('--sar');
  const availW = Math.max(1, window.innerWidth - sal - sar);
  const availH = Math.max(1, window.innerHeight - sat - sab);
  const stage = $('#stage'), s = Math.min(availW/W, availH/H);
  const dx = sal + (availW - W*s)/2, dy = sat + (availH - H*s)/2;
  stage.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(' + s + ')';
  /* thumb targets: 44 real px minimum, exactly what the finger covers */
  document.documentElement.style.setProperty('--tap',
    Math.round(Math.min(88, Math.max(40, 44/s))) + 'px');
}
/* portrait-only: if the phone is on its side mid-run, stop the bus rather than
   let the player drive blind behind the rotate hint */
function portraitOnly(){
  return window.matchMedia('(orientation:landscape) and (max-height:560px)').matches;
}
window.addEventListener('orientationchange', function(){
  if (portraitOnly() && G.mode === 'run' && !G.paused) pauseGame();
  fit();
});
window.addEventListener('resize', function(){ if (portraitOnly() && G.mode === 'run' && !G.paused) pauseGame(); fit(); });
fit();
boot();
requestAnimationFrame(loop);
window.addEventListener('pointerdown', function once(){ A.init(); A.resume(); A.vol(); window.removeEventListener('pointerdown', once); });
