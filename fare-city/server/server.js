#!/usr/bin/env node
/* ==========================================================================
   FARE CITY SERVER
   Zero dependencies. Serves the game, and turns it into a world game:
   accounts, cloud saves, a validated world leaderboard and the daily run.

     node server/server.js            # then open http://localhost:8080
     PORT=3000 node server/server.js

   Design notes, because the details matter if this ever gets popular:
   - Passwords: scrypt, per-user salt, constant-time compare.
   - Tokens: 32 random bytes, stored HASHED at rest, 30-day expiry.
   - Scores are validated server-side against the game's own city packs
     (route length, fare ceiling, minimum realistic run time) so a hacked
     client cannot post 99 billion to the world board.
   - Storage is a JSON file with atomic writes: fine for a friend group or a
     single city. Swap `readDB/writeDB` for Postgres, D1 or Redis to scale
     out; nothing else in here changes.
   ========================================================================== */
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || '0.0.0.0';

/* ---------------------------------------------------------------- city data
   Validate against the very same packs the game plays. One source of truth. */
function loadGameData(){
  const citySrc = fs.readFileSync(path.join(ROOT, 'parts', '02-cities.js'), 'utf8');
  let streetSrc = fs.readFileSync(path.join(ROOT, 'parts', '02b-street.js'), 'utf8');
  const fn = new Function(citySrc + '\n' + streetSrc + '\nreturn { CITY_PACKS: CITY_PACKS, STREET: STREET };');
  return fn();
}
const GAME = loadGameData();
const PACKS = GAME.CITY_PACKS;
const findCity = id => PACKS.filter(c => c.id === id)[0];
const findRoute = (c, id) => c.routes.filter(r => r.id === id)[0];

/* the same economy maths the client uses (kept in sync deliberately: if you
   change one, change the other — STAR_TUNE and paxPotential live in the client) */
const STAR_TUNE = [1.6, 11, 44];   /* keep in lockstep with parts/04-core.js */
const creditsPerPax = (c, r) => (r.localFare / c.cur.fx) * r.fareMult;
const paxPotential = (c, r) => (r.stops.length - 1) * (3 + c.paxPerStop);
function starTargets(c, r){
  const pot = creditsPerPax(c, r) * paxPotential(c, r) * 1.45;
  return STAR_TUNE.map(k => Math.round(pot * k / 10) * 10);
}
function starsFor(c, r, idx){
  const t = starTargets(c, r); let n = 0; t.forEach(x => { if (idx >= x) n++; }); return n;
}

/* ------------------------------------------------------------------- store */
let db = { users:{}, tokens:{}, progress:{}, scores:[], meta:{ created: Date.now() } };
function readDB(){
  try{
    if (fs.existsSync(DB_FILE)) db = Object.assign(db, JSON.parse(fs.readFileSync(DB_FILE, 'utf8')));
  }catch(e){ console.error('db read failed, starting fresh:', e.message); }
}
let savePending = null;
function writeDB(){
  if (savePending) return;
  savePending = setTimeout(() => {
    savePending = null;
    try{
      fs.mkdirSync(DATA_DIR, { recursive:true });
      const tmp = DB_FILE + '.tmp';
      fs.writeFileSync(tmp, JSON.stringify(db));
      fs.renameSync(tmp, DB_FILE);
    }catch(e){ console.error('db write failed:', e.message); }
  }, 250);
}
readDB();

/* ---------------------------------------------------------------- security */
const hash = (s, salt) => crypto.scryptSync(String(s), salt, 64).toString('hex');
const newToken = () => crypto.randomBytes(32).toString('hex');
const tokenKey = tok => crypto.createHash('sha256').update(tok).digest('hex');
function safeEqual(a, b){
  const A = Buffer.from(String(a)), B = Buffer.from(String(b));
  if (A.length !== B.length) return false;
  return crypto.timingSafeEqual(A, B);
}
function authUser(req){
  const h = req.headers['authorization'] || '';
  const tok = h.indexOf('Bearer ') === 0 ? h.slice(7) : null;
  if (!tok) return null;
  const rec = db.tokens[tokenKey(tok)];
  if (!rec) return null;
  if (rec.exp < Date.now()){ delete db.tokens[tokenKey(tok)]; writeDB(); return null; }
  return db.users[rec.user] ? rec.user : null;
}
/* crude but real: sliding-window limits per key */
const hits = {};
const isLocal = ip => ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1' || ip === 'localhost';
function limited(key, max, windowMs, ip){
  /* localhost is the developer's own machine: limits there just get in the way
     of testing. Behind a proxy (real users) they always apply. */
  if (isLocal(ip) && !process.env.STRICT_LIMITS) return false;
  const now = Date.now();
  const arr = (hits[key] = (hits[key] || []).filter(t => now - t < windowMs));
  if (arr.length >= max) return true;
  arr.push(now); return false;
}
const clean = s => String(s == null ? '' : s).replace(/[\u0000-\u001f\u007f]/g, '').trim();
const validName = n => /^[\p{L}\p{N} _.\-@]{2,14}$/u.test(n);

/* --------------------------------------------------------------- validation */
function validateRun(e, user){
  const c = findCity(clean(e.city));
  if (!c) return { ok:false, why:'unknown city' };
  const r = findRoute(c, clean(e.route));
  if (!r) return { ok:false, why:'unknown route' };
  const idx = Math.round(Number(e.idx));
  if (!isFinite(idx) || idx < 0) return { ok:false, why:'bad fare index' };
  /* ceiling: far above a perfect run, far below nonsense. Measured strong play
     reaches ~640x the route potential (qa/econ.js), so 1200x leaves room for a
     better driver while still catching a doctored fare index. */
  const ceiling = Math.round(creditsPerPax(c, r) * paxPotential(c, r) * 1200 + 3000);
  if (idx > ceiling) return { ok:false, why:'fare index above the ceiling for this route' };
  const ms = Math.round(Number(e.ms) || 0);
  const routeLen = r.dist * (r.stops.length - 1);
  /* the bus cannot beat ~1.42x top speed with nitro and never stop for anyone */
  const minMs = Math.max(12000, (routeLen / (400 * 1.42)) * 1000 * 0.5);
  if (ms && ms < minMs) return { ok:false, why:'run completed impossibly fast' };
  const expectM = routeLen / 1.5;                       /* world units -> metres */
  const dist = Math.round(Number(e.dist) || 0);
  if (dist && (dist < expectM * 0.5 || dist > expectM * 1.9)) return { ok:false, why:'distance does not match the route' };
  const pax = Math.max(0, Math.round(Number(e.pax) || 0));
  if (pax > 120) return { ok:false, why:'impossible passenger count' };
  const stars = starsFor(c, r, idx);                    /* server decides the stars */
  return { ok:true, city:c, route:r, idx:idx, stars:stars, ms:ms };
}
/* --------------------------------------------------------------- leadership */
function boardCity(cityId){
  const best = {};
  db.scores.forEach(s => {
    if (s.city !== cityId) return;
    const cur = best[s.name];
    if (!cur || s.idx > cur.idx || (s.idx === cur.idx && s.at < cur.at)) best[s.name] = s;
  });
  return Object.values(best).sort((a, b) => b.idx - a.idx || a.at - b.at).slice(0, 50)
    .map(r => ({ name:r.name, idx:r.idx, tag:(findCity(r.city) ? findCity(r.city).vehicle : 'bus') + ' driver' }));
}
function boardGlobal(){
  const per = {};
  db.scores.forEach(s => {
    const c = findCity(s.city); if (!c) return;
    const u = per[s.name] = per[s.name] || { name:s.name, idx:0, cities:{}, routes:{} };
    const key = s.city + ':' + s.route;
    if (!u.routes[key] || s.idx > u.routes[key]) u.routes[key] = s.idx;
  });
  const rows = Object.values(per).map(u => {
    let total = 0, cities = {};
    Object.keys(u.routes).forEach(k => {
      total += u.routes[k];
      const cid = k.split(':')[0];
      cities[cid] = (cities[cid] || 0) + u.routes[k];
    });
    const topCity = Object.keys(cities).sort((a, b) => cities[b] - cities[a])[0];
    const c = findCity(topCity);
    return { name:u.name, idx:Math.round(total),
      tag:(c ? c.flag + ' ' + Object.keys(cities).length + ' cit' + (Object.keys(cities).length === 1 ? 'y' : 'ies')
            : 'world driver') };
  });
  return rows.sort((a, b) => b.idx - a.idx).slice(0, 50);
}
function dailyKeyServer(){
  const d = new Date();
  return d.getUTCFullYear() + '-' + (d.getUTCMonth() + 1) + '-' + d.getUTCDate();
}
function hashStrServer(s){
  let h = 2166136261;
  for (let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function dailyPickServer(){
  const key = dailyKeyServer();
  const r = hashStrServer('farecity:daily:' + key) % (PACKS.length * 3);
  let i = r;
  for (const c of PACKS) for (let b = 0; b < c.routes.length; b++){
    if (i === 0) return { key:key, city:c.id, route:c.routes[b].id };
    i--;
  }
  return { key:key, city:'lagos', route:'lag-1' };
}
function boardDaily(){
  const key = dailyKeyServer(), best = {};
  db.scores.forEach(s => {
    if (!s.daily || s.daily !== key) return;
    if (!best[s.name] || s.idx > best[s.name].idx) best[s.name] = s;
  });
  return Object.values(best).sort((a, b) => b.idx - a.idx).slice(0, 50)
    .map(r => ({ name:r.name, idx:r.idx, tag:'daily · ' + (findCity(r.city) || {}).name }));
}

/* ------------------------------------------------------------------ static */
const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8', '.svg':'image/svg+xml', '.png':'image/png',
  '.webmanifest':'application/manifest+json', '.json':'application/json', '.md':'text/markdown; charset=utf-8' };
function serveStatic(req, res, pathname){
  let rel = decodeURIComponent(pathname);
  if (rel === '/' || rel === '') rel = '/index.html';
  const full = path.normalize(path.join(ROOT, rel));
  if (full.indexOf(ROOT) !== 0 || !fs.existsSync(full) || fs.statSync(full).isDirectory()){
    res.writeHead(404, { 'Content-Type':'text/plain' }); res.end('not found'); return;
  }
  const type = MIME[path.extname(full).toLowerCase()] || 'application/octet-stream';
  const body = fs.readFileSync(full);
  res.writeHead(200, { 'Content-Type':type, 'Content-Length':body.length,
    'Cache-Control': /index\.html$|sw\.js$/.test(full) ? 'no-cache' : 'public, max-age=300' });
  res.end(body);
}
function json(res, code, obj){
  const body = Buffer.from(JSON.stringify(obj));
  res.writeHead(code, { 'Content-Type':'application/json; charset=utf-8', 'Content-Length':body.length,
    'Access-Control-Allow-Origin':'*', 'Access-Control-Allow-Headers':'Content-Type, Authorization',
    'Access-Control-Allow-Methods':'GET, POST, OPTIONS' });
  res.end(body);
}
function body(req, cb, limit){
  let size = 0; const chunks = [];
  req.on('data', d => {
    size += d.length;
    if (size > (limit || 64 * 1024)){ req.destroy(); return; }
    chunks.push(d);
  });
  req.on('end', () => {
    try{ cb(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {}); }
    catch(e){ cb(null); }
  });
}
const ipOf = req => (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress || 'x';

/* -------------------------------------------------------------------- routes */
const server = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  const p = u.pathname, ip = ipOf(req);

  if (req.method === 'OPTIONS'){ json(res, 204, {}); return; }
  if (p.indexOf('/api/') !== 0){ serveStatic(req, res, p); return; }

  if (p === '/api/health'){
    json(res, 200, { ok:true, game:'Fare City', cities:PACKS.length,
      users:Object.keys(db.users).length, scores:db.scores.length, serverTime:Date.now() });
    return;
  }
  if (p === '/api/daily'){
    const d = dailyPickServer(), rows = db.scores.filter(r => r.daily === d.key);
    json(res, 200, Object.assign({}, d, { runsToday: rows.length,
      drivers: new Set(rows.map(r => r.name)).size }));
    return;
  }
  /* the leading line of today's daily run, so players race the world */
  if (p === '/api/ghost'){
    const key = u.searchParams.get('key') || dailyKeyServer();
    if (key !== dailyKeyServer()){ json(res, 404, { error:'No ghost for that day.' }); return; }
    const rows = db.scores.filter(r => r.daily === key && Array.isArray(r.trail) && r.trail.length > 2);
    if (!rows.length){ json(res, 404, { error:'Nobody has posted today yet — you can be the ghost.' }); return; }
    const lead = rows.reduce((m, r) => (r.idx > m.idx ? r : m), rows[0]);
    json(res, 200, { name:lead.name, idx:lead.idx, stars:lead.stars, trail:lead.trail, at:lead.at });
    return;
  }

  if (p === '/api/register' && req.method === 'POST'){
    if (limited('reg:' + ip, 10, 3600e3, ip)){ json(res, 429, { error:'Too many accounts from this network. Try later.' }); return; }
    body(req, b => {
      if (!b) return json(res, 400, { error:'Bad request body.' });
      const name = clean(b.name), pass = String(b.pass || '');
      if (!validName(name)) return json(res, 400, { error:'Name: 2-14 letters, numbers, spaces or _ . - @' });
      if (pass.length < 6) return json(res, 400, { error:'Password needs at least 6 characters.' });
      if (db.users[name]) return json(res, 409, { error:'That driver name is taken.' });
      const salt = crypto.randomBytes(16).toString('hex');
      db.users[name] = { name:name, salt:salt, hash:hash(pass, salt), created:Date.now(), lastSeen:Date.now() };
      const tok = newToken();
      db.tokens[tokenKey(tok)] = { user:name, exp:Date.now() + 30 * 864e5 };
      writeDB();
      json(res, 200, { name:name, token:tok, stars:0 });
    });
    return;
  }
  if (p === '/api/login' && req.method === 'POST'){
    if (limited('login:' + ip, 20, 3600e3, ip)){ json(res, 429, { error:'Too many attempts. Try later.' }); return; }
    body(req, b => {
      if (!b) return json(res, 400, { error:'Bad request body.' });
      const name = clean(b.name), pass = String(b.pass || '');
      const u2 = db.users[name];
      if (!u2 || !safeEqual(hash(pass, u2.salt), u2.hash)) return json(res, 401, { error:'Wrong name or password.' });
      u2.lastSeen = Date.now();
      const tok = newToken();
      db.tokens[tokenKey(tok)] = { user:name, exp:Date.now() + 30 * 864e5 };
      writeDB();
      json(res, 200, { name:name, token:tok });
    });
    return;
  }
  if (p === '/api/logout' && req.method === 'POST'){
    const h = req.headers['authorization'] || '';
    if (h.indexOf('Bearer ') === 0) delete db.tokens[tokenKey(h.slice(7))];
    writeDB(); json(res, 200, { ok:true }); return;
  }
  if (p === '/api/me'){
    const user = authUser(req);
    if (!user) return json(res, 401, { error:'Not signed in.' });
    const pr = db.progress[user];
    json(res, 200, { name:user, progress: pr ? pr.blob : null, at: pr ? pr.at : 0,
      scores: db.scores.filter(s => s.name === user).length });
    return;
  }
  if (p === '/api/progress' && req.method === 'POST'){
    const user = authUser(req);
    if (!user) return json(res, 401, { error:'Not signed in.' });
    body(req, b => {
      if (!b || typeof b.progress !== 'object') return json(res, 400, { error:'Bad progress blob.' });
      const size = Buffer.byteLength(JSON.stringify(b.progress));
      if (size > 256 * 1024) return json(res, 413, { error:'Progress blob too big.' });
      db.progress[user] = { blob:b.progress, at: Date.now() };
      writeDB();
      json(res, 200, { ok:true, at:db.progress[user].at, bytes:size });
    }, 512 * 1024);
    return;
  }
  if (p === '/api/score' && req.method === 'POST'){
    const user = authUser(req);
    if (limited('score:' + (user || ip), 60, 3600e3, ip)){ json(res, 429, { error:'Slow down — too many runs posted.' }); return; }
    body(req, b => {
      if (!b) return json(res, 400, { error:'Bad request body.' });
      const v = validateRun(b, user);
      if (!v.ok) return json(res, 400, { error:'Run rejected: ' + v.why });
      const name = user || (validName(clean(b.name)) ? clean(b.name) : 'Anon-' + tokenKey(ip).slice(0, 4));
      /* a daily claim must be *today's* route, not just today's key — otherwise a
         player could post a fat run from an easy city and rank it as their daily */
      let daily = null;
      if (b.daily && b.daily === dailyKeyServer()){
        const dp = dailyPickServer();
        if (v.city.id !== dp.city || v.route.id !== dp.route)
          return json(res, 400, { error:'Run rejected: not today\'s daily route (' + dp.city + ' / ' + dp.route + ').' });
        daily = b.daily;
      }
      /* a daily run may carry the driver's line (distance every half second) so
         everyone else can race it. Validate hard, then drop it if it is not the
         leader — the db keeps one line per daily key, not one per player. */
      let trail = null;
      if (daily && Array.isArray(b.trail)){
        const routeLen = v.route.dist * (v.route.stops.length - 1);
        trail = b.trail.slice(0, 1200).map(Number).filter(n => isFinite(n) && n >= 0 && n <= routeLen * 1.5);
        if (trail.length < 3) trail = null;
      }
      db.scores.push({ name:name, city:v.city.id, route:v.route.id, idx:v.idx, stars:v.stars,
        pax:Math.max(0, Math.round(Number(b.pax) || 0)), owa:Math.max(0, Math.round(Number(b.owa) || 0)),
        dist:Math.max(0, Math.round(Number(b.dist) || 0)), ms:v.ms, combo:Math.min(4, Number(b.combo) || 1),
        sig: b.sig ? 1 : 0, daily:daily, at:Date.now(), anon: !user, trail:trail });
      if (db.scores.length > 60000) db.scores.splice(0, db.scores.length - 60000);
      if (daily){
        const day = db.scores.filter(r => r.daily === daily);
        const lead = day.reduce((m, r) => (r.idx > m.idx ? r : m), day[0]);
        day.forEach(r => { if (r !== lead) delete r.trail; });
      }
      writeDB();
      /* rank: personal best in the city, and career position */
      const cityRows = boardCity(v.city.id);
      const rank = cityRows.findIndex(r => r.name === name) + 1 || cityRows.length + 1;
      const dailyRows = daily ? boardDaily() : [];
      json(res, 200, { ok:true, idx:v.idx, stars:v.stars, rank:rank,
        scope: daily ? 'daily' : 'city',
        dailyRank: daily ? (dailyRows.findIndex(r => r.name === name) + 1) : null,
        best: cityRows.filter(r => r.name === name).map(r => r.idx)[0] || v.idx });
    });
    return;
  }
  if (p === '/api/board'){
    const cityId = clean(u.searchParams.get('city') || 'lagos');
    const scope = clean(u.searchParams.get('scope') || 'city');
    const rows = scope === 'daily' ? boardDaily() : scope === 'global' ? boardGlobal() : boardCity(cityId);
    json(res, 200, { scope:scope, city:cityId, rows:rows, count:rows.length });
    return;
  }
  json(res, 404, { error:'No such endpoint.' });
});
server.listen(PORT, HOST, () => {
  console.log('Fare City server');
  console.log('  game + API : http://localhost:' + PORT);
  console.log('  world data : ' + DB_FILE);
  console.log('  cities     : ' + PACKS.length + ' · routes ' + PACKS.reduce((n, c) => n + c.routes.length, 0));
});
