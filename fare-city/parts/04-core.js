/* ==========================================================================
   FARE CITY — CORE: utils, save, economy, progression
   ========================================================================== */
const $  = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.prototype.slice.call((r || document).querySelectorAll(s));
const clamp = (v,a,b) => v<a?a:(v>b?b:v);
const lerp  = (a,b,k) => a+(b-a)*k;
const rnd   = (a,b) => a + Math.random()*(b-a);
const ri    = (a,b) => Math.floor(rnd(a,b+1));
const pick  = arr => arr[Math.floor(Math.random()*arr.length)];
const todayKey = () => { const d=new Date(); return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate(); };
function mulberry32(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; let x=Math.imul(a^a>>>15,1|a); x=x+Math.imul(x^x>>>7,61|x)^x; return ((x^x>>>14)>>>0)/4294967296; }; }
function hashStr(s){ let h=2166136261; for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619);} return h>>>0; }
function commas(n){ return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }

/* ---------------- economy ---------------- */
function cityById(id){ return CITY_PACKS.filter(c=>c.id===id)[0] || CITY_PACKS[0]; }
function creditsPerPax(city, route){ return (route.localFare / city.cur.fx) * route.fareMult; }
/* local currency value of a credit amount */
function toLocal(credits, city){ return credits * city.cur.fx; }
/* money, shown in whatever city you are standing in */
function money(credits, city){
  /* during a run the money on screen belongs to the city under the wheels */
  city = city || ((typeof G !== 'undefined' && G.mode === 'run' && G.city) ? G.city : cityById(save.city));
  const v = toLocal(credits, city), s = city.cur.sym;
  if (v >= 1e9) return s + (v/1e9).toFixed(2) + 'B';
  if (v >= 1e6) return s + (v/1e6).toFixed(2) + 'M';
  if (v >= 1e4) return s + commas(v);
  if (city.cur.step < 1) return s + v.toFixed(2);
  return s + commas(v);
}
function idx(n){ return commas(Math.max(0, Math.round(n))); }
function paxPotential(city, route){ return (route.stops.length-1) * (3 + city.paxPerStop); }
/* bands are multiples of the route's fare potential; calibrated against the
   autopilot sim (qa/econ.js): a tidy run that serves every stop scores ~12x,
   a run that also works the street with horn, overtakes and boost scores 50x+ */
const STAR_TUNE = [1.6, 11, 44];
function starTargets(city, route){
  const pot = creditsPerPax(city, route) * paxPotential(city, route) * 1.45;
  return STAR_TUNE.map(k => Math.round(pot*k/10)*10);
}
function routeReqStars(i){ return [0,2,4][i] || 99; }

/* ---------------- progression ---------------- */
function totalStars(){ let n=0; for (const k in save.routeStars) n += save.routeStars[k]; return n; }
function cityStars(cityId){ const c=cityById(cityId); let n=0; c.routes.forEach(r=>n += save.routeStars[r.id]||0); return n; }
/* your home city is always open: whatever you picked at the start is yours to
   drive, wherever in the world you are. the rest unlock on stars. */
function cityOpen(c){ return !c.starsReq || c.id === save.home || totalStars() >= c.starsReq; }
function routeOpen(c, i){ return i===0 || cityStars(c.id) >= routeReqStars(i); }
function nextCity(){ return CITY_PACKS.filter(c=>!cityOpen(c)).sort((a,b)=>a.starsReq-b.starsReq)[0]; }
function rankOf(){ let r=RANKS[0]; RANKS.forEach(x=>{ if(totalStars()>=x.at) r=x; }); return r; }
function fleetCount(){ const owned = ['danfo'].concat(save.paints); let n=1; for (const c of CITY_PACKS) if (save.visited[c.id]) n++; return n; }
function partLevel(id){ return save.parts[id]||0; }
function partMaxed(id){ return partLevel(id) >= PARTS.filter(p=>p.id===id)[0].levels.length-1; }
function partCost(id){ return partMaxed(id) ? 0 : PART_COSTS[partLevel(id)]; }
function partGate(id){ return PART_STAR_GATE[partLevel(id)] || 0; }
const PART_COSTS = [6000, 20000, 70000, 220000, 600000];
const PART_STAR_GATE = [0, 5, 16, 38, 66];

/* ---------------- save ---------------- */
const SAVE_KEY = 'farecity.v1';
function blankSave(){
  return {
    v:1, name:'', city:'lagos', wallet:0, paint:'danfo', paints:['danfo'],
    routeStars:{}, cityBest:{}, parts:{engine:0,brakes:0,tyres:0,horn:0,seats:0,tank:0},
    visited:{lagos:true}, missions:{date:'', list:[]}, mprog:{},
    streak:0, lastDay:'', runs:[], total:{runs:0,pax:0,credits:0,dist:0,owa:0,sigs:0},
    home:'', pickedHome:0,
    lang:'en', acct:null, cloudAt:0, daily:{key:'',done:false,score:0,rank:0},
    set:{sfx:1,music:1,auto:1,left:0,calm:0,buzz:1,mv:70,sv:80,script:1},
    cookie:false, seenHow:false
  };
}
let save = blankSave();
function loadGame(){
  try{ const raw = localStorage.getItem(SAVE_KEY); if (raw){ const p=JSON.parse(raw); save = Object.assign(blankSave(), p);
    save.set = Object.assign(blankSave().set, p.set||{});
    save.total = Object.assign(blankSave().total, p.total||{});
    save.daily = Object.assign(blankSave().daily, p.daily||{});
    save.parts = Object.assign(blankSave().parts, p.parts||{});
  } }catch(e){}
  /* saves from before home cities existed: keep Lagos, never re-ask a player
     who has already made progress */
  if (!save.home) save.home = 'lagos';
  if (!save.pickedHome && (save.total.runs > 0 || totalStars() > 0)) save.pickedHome = 1;
  LANG = save.lang || 'en';
}
function persist(){ try{ localStorage.setItem(SAVE_KEY, JSON.stringify(save)); }catch(e){} }

/* ---------------- daily missions ---------------- */
const MISSION_POOL = [
  {id:'pax',   make:(r)=>({goal: 14 + Math.floor(r()*8),  unit:'pax',   xp:2600}),
   text:(g)=>'Drop '+g.goal+' passengers at their stops'},
  {id:'owa',   make:(r)=>({goal: 12 + Math.floor(r()*10), unit:'owa',   xp:2200}),
   text:(g)=>'Shout OWA! with the horn '+g.goal+' times'},
  {id:'combo', make:(r)=>({goal: 5 + Math.floor(r()*3),   unit:'combo', xp:3000}),
   text:(g)=>'Reach combo x'+g.goal+' in one run'},
  {id:'runs',  make:(r)=>({goal: 2 + Math.floor(r()*3),   unit:'runs',  xp:2400}),
   text:(g)=>'Complete '+g.goal+' routes'},
  {id:'clean', make:(r)=>({goal: 1,                       unit:'clean', xp:3600}),
   text:(g)=>'Finish a route with zero fines'},
  {id:'tips',  make:(r)=>({goal: 3 + Math.floor(r()*4),   unit:'tips',  xp:2600}),
   text:(g)=>'Collect '+g.goal+' passenger tips'},
  {id:'hop',   make:(r)=>({goal: 10 + Math.floor(r()*12), unit:'hop',   xp:2000}),
   text:(g)=>'Hop '+g.goal+' times over potholes and bumps'},
  {id:'perfect',make:(r)=>({goal: 1,                      unit:'perfect',xp:4200}),
   text:(g)=>'Complete a route without missing any stop'}
];
function rollMissions(){
  const key = todayKey();
  if (save.missions.date === key && save.missions.list.length === 3) return;
  const r = mulberry32(hashStr(key + 'fc'));
  const pool = MISSION_POOL.slice(); const list = [];
  for (let i=0;i<3;i++){
    const m = pool.splice(Math.floor(r()*pool.length),1)[0];
    const g = m.make(r);
    list.push({id:m.id, goal:g.goal, unit:g.unit, reward:Math.round(g.xp*(0.8+r()*0.5)/50)*50,
               text:m.text(g), prog:0, done:false});
  }
  save.missions = {date:key, list:list};
  save.mprog = save.mprog || {};
  persist();
}
function missionById(id){ return save.missions.list.filter(m=>m.id===id)[0]; }
function bump(id, amount, mode){
  const m = missionById(id); if (!m || m.done) return;
  m.prog = (mode==='max') ? Math.max(m.prog, amount) : m.prog + amount;
  if (m.prog >= m.goal){ m.prog = m.goal; m.done = true; m.doneAt = Date.now();
    save.wallet += m.reward; toast('Mission done · ' + m.text + ' · +' + money(m.reward), 2400); }
  persist();
}
function streakTick(){
  const key = todayKey();
  if (save.lastDay === key) return;
  const y = new Date(Date.now() - 864e5);
  const yKey = y.getFullYear()+'-'+(y.getMonth()+1)+'-'+y.getDate();
  save.streak = (save.lastDay === yKey) ? (save.streak||0)+1 : 1;
  save.lastDay = key; persist();
}

/* ---------------- leaderboard (local, seeded) ---------------- */
const BOARD_NAMES = {
  lagos:['Tokunbo','Wale Danfo','Chidinma','Omo Eko','Baba Nkechi','Ifeanyi','Segun Owa','Yetunde','Kunle Kesh','@dudu'],
  accra:['Kwame T','Ama Serwaa','Kojo Trotro','Abena','Yaw Deh','Efua','Nii Ayi','Adjoa'],
  nairobi:['Wanjiru','Otieno M','Mwalimu','Njeri','Kamau Mat','Achieng','Onana'],
  cairo:['Youssef','Mona H','Ahmed T','Nour','Mostafa','Salma','Karim M'],
  capetown:['Lindiwe','Sipho','Thabo','Anele','Zanele','Bongani','Chantel'],
  mumbai:['Raju','Priya','Sanjay','Meera','Vikram','Aisha B','Ganesh'],
  jakarta:['Budi','Siti','Agus','Dewi','Rina','Pak Joko','Wawan'],
  bangkok:['Somchai','Ploy','Nok','Anan','Kanya','Bank','Mee'],
  london:['Trevor B','Big Femi','Ade O','Sasha','Kwabena','Priya L','Danny','Nadia'],
  newyork:['Mikey B','Tasha','Hector','DJ Rozay','Big E','Karen','Shawn','Lupita']
};
const DIASPORA = ['@chidi_lagos','@naijaboy_ldn','@eze_nyc','@amaka_yyz','@kweku_gh','@bonga_jhb',
  '@jozi_mat','@accra_ghost','@mumbai_express','@cairo_nights','@bangkok_tha','@sleman_jkt','@dubai_ade'];
function boardFor(cityId, mode){
  const r = mulberry32(hashStr(cityId + '|' + mode + '|' + todayKey()));
  const c = cityById(cityId);
  /* scale a city's plausible top score off its own fare level */
  const unit = creditsPerPax(c, c.routes[c.routes.length-1]) * 14;
  const rows = [];
  const names = BOARD_NAMES[cityId] || BOARD_NAMES.lagos;
  names.forEach((n,i) => {
    const v = unit * (5.5 - i*0.45) * (0.75 + r()*0.6);
    rows.push({name:n, idx:Math.round(v), tag:c.vehicle + ' driver'});
  });
  if (mode === 'global'){
    DIASPORA.forEach((n,i)=>{ rows.push({name:n, idx:Math.round(9000 + r()*38000), tag:'diaspora'}); });
  }
  rows.sort((a,b)=>b.idx-a.idx);
  return rows;
}
function myBoardEntries(cityId){
  const fl = cityById(cityId).flag;
  return save.runs.filter(r=>r.city===cityId).map(r=>({name:(save.name||'You'), idx:r.idx, me:true, at:r.at,
    tag: fl + ' ' + (r.rname||'')}));
}
function ago(ts){
  const s = Math.max(1, Math.round((Date.now() - ts)/1000));
  if (s < 60) return s + 's ago';
  if (s < 3600) return Math.round(s/60) + 'm ago';
  if (s < 86400) return Math.round(s/3600) + 'h ago';
  return Math.round(s/86400) + 'd ago';
}
function boardMerged(cityId, mode){
  let rows;
  if (mode === 'me') return myRunsRows();
  if (mode === 'global'){
    rows = boardFor(cityId,'global').concat(save.runs.map(r=>({name:(save.name||'You'), idx:r.idx, me:true, at:r.at,
      tag:'you · ' + cityById(r.city).flag + ' ' + (r.rname||'')})));
  } else {
    const world = WORLD_BOARD.data[cityId];
    rows = (world && world.length ? world : boardFor(cityId,'city')).concat(myBoardEntries(cityId));
  }
  rows.sort((a,b)=>b.idx-a.idx);
  const seen = {}; const out = [];
  rows.forEach(r=>{ const k = (r.me?'me':r.name); if (seen[k]) return; seen[k]=1; out.push(r); });
  return out.slice(0,30);
}
function myRunsRows(){
  const mine = save.runs.slice().sort((a,b)=>b.at-a.at).slice(0,12);
  if (!mine.length) return [];
  const best = Math.max.apply(null, mine.map(r=>r.idx));
  return mine.map(r=>({name:(save.name||'You'), idx:r.idx, me:true, city:r.city, route:r.route,
    star:r.star, at:r.at, best:r.idx===best}));
}

/* ---------------- live leaderboard ----------------
   With a server: rows come from the world board. Without one: the local,
   offline board below. Same UI either way. ----------------
   The game ships with a local, offline-friendly board so it works in a danfo
   with no data. Flip BOARD_API to your own server and the same board becomes a
   real world board — nothing else in the game changes.

     GET  BOARD_API + '/board?city=lagos'  -> [{ name:"Ada", idx: 12345 }]
     POST BOARD_API + '/score'             <- { name, city, route, idx, stars }

   A 40-line Worker/D1 or Express/SQLite backend is enough; see README. */
const BOARD_API = null;
const WORLD_BOARD = { loading:false, data:{}, err:null };
function fetchWorldBoard(cityId, cb){
  if (!BOARD_API) return false;
  if (WORLD_BOARD.data[cityId]){ cb(WORLD_BOARD.data[cityId]); return true; }
  if (WORLD_BOARD.loading) return true;
  WORLD_BOARD.loading = true;
  fetch(BOARD_API + '/board?city=' + encodeURIComponent(cityId))
    .then(r => r.json())
    .then(rows => {
      WORLD_BOARD.data[cityId] = (rows || []).map(r => ({ name:r.name, idx:Math.round(r.idx), tag:'live · ' + cityById(cityId).name }));
      WORLD_BOARD.loading = false; cb(WORLD_BOARD.data[cityId]);
    })
    .catch(err => { WORLD_BOARD.loading = false; WORLD_BOARD.err = err; cb(null); });
  return true;
}
function postWorldScore(entry){
  if (!BOARD_API) return;
  fetch(BOARD_API + '/score', { method:'POST', headers:{ 'Content-Type':'application/json' },
    body: JSON.stringify(entry) }).then(function(){
      delete WORLD_BOARD.data[entry.city];
    }).catch(function(){ /* offline: the local board already has it */ });
}

/* ---------------- share ---------------- */
function shareText(o){
  const c = cityById(o.city), st = c.street || {}, tk = st.talk || {};
  const phrase = tk.thanks ? '  ' + tk.thanks + ' (' + (tk.thanksEn || '') + ')' : '';
  return t('shareText', {v:money(o.credits||0, c), bus:c.vehicle, city:c.name, idx:idx(o.idx||0)}) + phrase;
}
function doShare(o){
  const txt = shareText(o);
  const url = (location.origin && location.origin.indexOf('http')===0) ? location.href.split('#')[0] : '';
  if (navigator.share){
    navigator.share({title:'Fare City', text:txt + (url?' '+url:'')}).catch(()=>{});
  } else if (navigator.clipboard){
    navigator.clipboard.writeText(txt + ' ' + url).then(()=>toast('Copied — paste it anywhere', 2000)).catch(()=>toast(txt, 3000));
  } else toast(txt, 3000);
}
