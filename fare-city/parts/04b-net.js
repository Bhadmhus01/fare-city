/* ==========================================================================
   FARE CITY — NETWORK LAYER
   The game is fully playable with no server at all. When it IS served over
   http(s) and an API answers on /api, accounts, cloud saves, the world
   leaderboard and the daily run switch on. Nothing breaks when they can't.
   ========================================================================== */
const NET = {
  base:null, token:'', user:null, mode:'offline', probed:false, err:null,
  server:{ users:0, scores:0 }
};
function netBase(){
  if (NET.base === null){
    NET.base = (location.protocol.indexOf('http') === 0) ? (location.origin + '/api') : '';
  }
  return NET.base;
}
function netAvailable(){ return netBase() !== '' && NET.mode === 'live'; }
async function netProbe(){
  if (NET.probed) return NET.mode;
  NET.probed = true;
  if (!netBase()){ NET.mode = 'offline'; return NET.mode; }
  try{
    const r = await fetch(netBase() + '/health', { cache:'no-store' });
    if (!r.ok) throw new Error('bad status');
    const j = await r.json();
    NET.mode = 'live'; NET.server = j;
  }catch(e){ NET.mode = 'offline'; NET.err = e; }
  return NET.mode;
}
async function netCall(path, opts){
  if (!netAvailable()) throw new Error('offline');
  opts = opts || {};
  const headers = { 'Content-Type':'application/json' };
  const tok = save.acct && save.acct.token;
  if (tok) headers['Authorization'] = 'Bearer ' + tok;
  const r = await fetch(netBase() + path, { method: opts.method || 'GET', headers: headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined, cache:'no-store' });
  let j = null;
  try{ j = await r.json(); }catch(e){}
  if (!r.ok){ const e2 = new Error((j && j.error) || ('HTTP ' + r.status)); e2.status = r.status; throw e2; }
  return j;
}
/* ---------------- accounts ---------------- */
async function acctRegister(name, pass){
  const j = await netCall('/register', { method:'POST', body:{ name:name, pass:pass } });
  save.acct = { name:j.name, token:j.token, since:Date.now() };
  NET.user = j.name; persist(); return j;
}
async function acctLogin(name, pass){
  const j = await netCall('/login', { method:'POST', body:{ name:name, pass:pass } });
  save.acct = { name:j.name, token:j.token, since:Date.now() };
  NET.user = j.name; persist(); return j;
}
async function acctRefresh(){
  if (!netAvailable() || !(save.acct && save.acct.token)) return null;
  try{ const j = await netCall('/me'); NET.user = j.name; return j; }
  catch(e){ if (e.status === 401){ save.acct = null; persist(); } return null; }
}
function acctSignOut(){ save.acct = null; NET.user = null; persist(); }
/* ---------------- scores, boards, daily ---------------- */
async function netPostScore(payload){
  if (!netAvailable()) return null;
  try{ return await netCall('/score', { method:'POST', body:payload }); }
  catch(e){ NET.err = e; return null; }
}
async function netBoard(city, scope){
  if (!netAvailable()) return null;
  try{ const j = await netCall('/board?city=' + encodeURIComponent(city) + '&scope=' + (scope || 'city'));
    return j.rows || []; }
  catch(e){ NET.err = e; return null; }
}
async function netPushProgress(){
  const blob = JSON.parse(JSON.stringify(save));
  if (blob.acct) delete blob.acct.token;           /* never send the token back up */
  const j = await netCall('/progress', { method:'POST', body:{ progress: blob, at: Date.now() } });
  save.cloudAt = Date.now(); persist(); return j;
}
async function netPullProgress(){
  const j = await netCall('/me');
  if (!j || !j.progress) return null;
  const token = save.acct && save.acct.token, name = save.acct && save.acct.name;
  const merged = Object.assign(blankSave(), j.progress);
  merged.acct = { name:name, token:token, since: (save.acct && save.acct.since) || Date.now() };
  merged.cloudAt = Date.now();
  save = merged; persist(); return merged;
}
/* ---------------- the daily run ----------------
   Same route for the whole world, decided by the UTC date, so a driver in
   Lagos and one in London are on the same street at the same time. */
function dailyPick(){
  const d = new Date();
  const key = d.getUTCFullYear() + '-' + (d.getUTCMonth()+1) + '-' + d.getUTCDate();
  const r = hashStr('farecity:daily:' + key) % (CITY_PACKS.length * 3);
  let i = r;
  for (let a=0;a<CITY_PACKS.length;a++){
    for (let b=0;b<CITY_PACKS[a].routes.length;b++){
      if (i === 0) return { key:key, city:CITY_PACKS[a].id, route:b, cityObj:CITY_PACKS[a] };
      i--;
    }
  }
  return { key:key, city:'lagos', route:0, cityObj:CITY_PACKS[0] };
}
function dailyMsLeft(){
  const now = new Date();
  const end = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()+1, 0, 0, 0);
  const ms = end - now.getTime();
  const h = Math.floor(ms/3600000), m = Math.floor((ms%3600000)/60000);
  return h + 'h ' + m + 'm';
}
function dailyPlayed(){ return !!(save.daily && save.daily.key === dailyPick().key && save.daily.done); }
