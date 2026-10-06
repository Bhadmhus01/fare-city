/* API tests: accounts, validation, boards, cloud saves, daily run. Hits a running server. */
const BASE = process.env.BASE || 'http://localhost:8080/api';
const j = async (p, opts = {}) => {
  const r = await fetch(BASE + p, {
    method: opts.method || 'GET',
    headers: Object.assign({ 'Content-Type': 'application/json' }, opts.token ? { Authorization: 'Bearer ' + opts.token } : {}),
    body: opts.body ? JSON.stringify(opts.body) : undefined
  });
  let body = null; try { body = await r.json(); } catch (e) {}
  return { status: r.status, body };
};
let pass = 0, fail = 0;
const ok = (cond, label, extra) => {
  if (cond) { pass++; console.log('  ✓ ' + label); }
  else { fail++; console.log('  ✗ ' + label + (extra ? '  → ' + JSON.stringify(extra) : '')); }
};

(async () => {
  const stamp = Date.now().toString().slice(-6);
  const name = 'Ada' + stamp, pass1 = 'danfo-strong-1';

  console.log('\nHEALTH + DAILY');
  const h = await j('/health');
  ok(h.status === 200 && h.body.cities === 10, 'server health reports 10 cities', h.body);
  const d1 = await j('/daily');
  ok(!!d1.body.key && !!d1.body.city, 'daily endpoint returns a key and a city', d1.body);

  console.log('\nACCOUNTS');
  const reg = await j('/register', { method: 'POST', body: { name, pass: pass1 } });
  ok(reg.status === 200 && !!reg.body.token, 'register returns a token', reg.body);
  const token = reg.body.token;
  const dupe = await j('/register', { method: 'POST', body: { name, pass: pass1 } });
  ok(dupe.status === 409, 'duplicate name is refused', dupe.body);
  const weak = await j('/register', { method: 'POST', body: { name: 'x' + stamp, pass: '123' } });
  ok(weak.status === 400, 'short password is refused', weak.body);
  const badlogin = await j('/login', { method: 'POST', body: { name, pass: 'wrong-password' } });
  ok(badlogin.status === 401, 'wrong password refused', badlogin.body);
  const login = await j('/login', { method: 'POST', body: { name, pass: pass1 } });
  ok(login.status === 200 && !!login.body.token, 'login returns a token');
  const me = await j('/me', { token });
  ok(me.status === 200 && me.body.name === name, 'me returns the driver', me.body);
  const noauth = await j('/me');
  ok(noauth.status === 401, 'me without a token is refused');

  console.log('\nSCORE VALIDATION');
  const good = await j('/score', { method: 'POST', token,
    body: { city: 'lagos', route: 'lag-1', idx: 60000, stars: 3, pax: 11, owa: 9, dist: 3000, ms: 95000, combo: 2.5 } });
  ok(good.status === 200 && good.body.stars === 2,
     'realistic run accepted; server recomputes stars (client claimed 3, server says 2)', good.body);
  const inflated = await j('/score', { method: 'POST', token,
    body: { city: 'lagos', route: 'lag-1', idx: 990000000, ms: 95000, dist: 3000 } });
  ok(inflated.status === 400 && /ceiling/.test(inflated.body.error), 'absurd fare index rejected', inflated.body);
  const cheetah = await j('/score', { method: 'POST', token,
    body: { city: 'lagos', route: 'lag-1', idx: 2400, ms: 900, dist: 3000 } });
  ok(cheetah.status === 400 && /fast/.test(cheetah.body.error), 'impossibly fast run rejected', cheetah.body);
  const wrongDist = await j('/score', { method: 'POST', token,
    body: { city: 'lagos', route: 'lag-1', idx: 2400, ms: 95000, dist: 999999 } });
  ok(wrongDist.status === 400 && /distance/.test(wrongDist.body.error), 'distance that does not match the route rejected', wrongDist.body);
  const badRoute = await j('/score', { method: 'POST', token,
    body: { city: 'atlantis', route: 'atl-1', idx: 1000, ms: 90000, dist: 1000 } });
  ok(badRoute.status === 400, 'unknown city rejected', badRoute.body);

  console.log('\nBOARDS');
  await j('/score', { method: 'POST', token, body: { city: 'nairobi', route: 'nbo-1', idx: 5200, ms: 90000, dist: 1600, pax: 12 } });
  const board = await j('/board?city=lagos&scope=city');
  ok(board.body.rows.some(r => r.name === name), 'my run appears on the Lagos board', board.body.rows.slice(0, 3));
  const glob = await j('/board?city=lagos&scope=global');
  const myGlobal = glob.body.rows.find(r => r.name === name);
  ok(myGlobal && myGlobal.idx >= 60000 + 5200, 'global board sums my best per route (career index)', myGlobal);
  ok(/cit/.test(myGlobal ? myGlobal.tag : ''), 'global row is tagged with city count', myGlobal);

  console.log('\nDAILY RUN');
  const dl = await j('/daily');
  const dailyPost = await j('/score', { method: 'POST', token,
    body: { city: dl.body.city, route: dl.body.route, idx: 3100, ms: 100000, dist: 2100, daily: dl.body.key } });
  ok(dailyPost.status === 200 && dailyPost.body.scope === 'daily', 'daily run posts to the daily scope', dailyPost.body);
  const drain = await j('/board?city=lagos&scope=daily');
  ok(drain.body.rows.some(r => r.name === name), 'daily board lists today\'s drivers', drain.body.rows);
  const stale = await j('/score', { method: 'POST', token,
    body: { city: dl.body.city, route: dl.body.route, idx: 3100, ms: 100000, dist: 2100, daily: '2001-1-1' } });
  ok(stale.body.scope !== 'daily', "a stale daily key does not post to today's daily board", stale.body);

  console.log('\nCLOUD SAVE');
  const blob = { v: 1, wallet: 123456, routeStars: { 'lag-1': 3 }, name: 'Cloudy' };
  const push = await j('/progress', { method: 'POST', token, body: { progress: blob, at: Date.now() } });
  ok(push.status === 200, 'progress pushes', push.body);
  const pulledAgain = await j('/me', { token });
  ok(pulledAgain.body.progress && pulledAgain.body.progress.wallet === 123456, 'progress comes back on pull', pulledAgain.body.progress);
  const huge = await j('/progress', { method: 'POST', token, body: { progress: { junk: 'x'.repeat(300000) } } });
  ok(huge.status === 413 || huge.status === 400, 'oversized progress blob refused', huge.status);

  console.log('\nTOKEN HYGIENE');
  const out = await j('/logout', { method: 'POST', token });
  ok(out.status === 200, 'logout accepted');
  const afterOut = await j('/me', { token });
  ok(afterOut.status === 401, 'token is dead after logout');

  console.log('\n' + (fail === 0 ? 'ALL PASS' : 'FAILURES') + ': ' + pass + ' passed, ' + fail + ' failed');
  process.exit(fail === 0 ? 0 : 1);
})();
