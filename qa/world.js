/* World tour: drive every city pack and screenshot gameplay, for the contact sheet. */
const { chromium } = require('playwright');
const fs = require('fs');
const OUT = '/home/user/qa/world';
fs.mkdirSync(OUT, { recursive: true });

const PLAN = [
  { city: 'lagos',    route: 0, at: 1400 },
  { city: 'accra',    route: 1, at: 1500 },
  { city: 'nairobi',  route: 2, at: 1600 },
  { city: 'cairo',    route: 1, at: 1500 },
  { city: 'capetown', route: 2, at: 1500 },
  { city: 'mumbai',   route: 1, at: 1500 },
  { city: 'jakarta',  route: 0, at: 1500 },
  { city: 'bangkok',  route: 2, at: 1600 },
  { city: 'london',   route: 1, at: 1500 },
  { city: 'newyork',  route: 2, at: 1500 }
];

(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage({ viewport: { width: 540, height: 960 }, deviceScaleFactor: 2 });
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.goto('file:///home/user/fare-city/index.html');
  await page.waitForTimeout(700);
  await page.evaluate(() => { $('#btnCookYes') && $('#btnCookYes').click(); save.cookie = true; persist(); });

  for (const step of PLAN) {
    const info = await page.evaluate(async (s) => {
      // unlock everything, buy a mid-tier rig so shots show a lived-in bus
      CITY_PACKS.forEach(c => c.routes.forEach(r => { save.routeStars[r.id] = 2; }));
      save.parts = { engine: 3, brakes: 2, tyres: 2, horn: 3, seats: 1, tank: 2 };
      save.paints = ['danfo', 'tokunbo', 'keke', 'asphalt', 'royal', 'chrome', 'brt', 'gold'];
      save.paint = { lagos: 'danfo', accra: 'keke', nairobi: 'royal', cairo: 'asphalt',
        capetown: 'brt', mumbai: 'chrome', jakarta: 'keke', bangkok: 'gold',
        london: 'tokunbo', newyork: 'chrome' }[s.city] || 'danfo';
      save.name = 'Omo Eko';
      persist();
      startRun(s.city, s.route);
      const g = {
        drive(dist) {
          let guard = 0;
          while (G.dist < dist && G.mode === 'run' && guard++ < 9000) {
            const dt = 1 / 60;
            const cur = G.stops[G.stopI];
            if (cur) {
              const dz = cur.z - G.dist;
              const dwelling = Math.abs(dz) < cur.box && G.speed < 46 && !cur.touched;
              if (G.boardQueue > 0 || dwelling) { G.gas = false; G.brake = Math.abs(dz) > 90; }
              else if (cur.touched) { G.gas = true; G.brake = false; }
              else if (dz > 0 && dz < 60 + 0.55 * G.speed * G.speed / 340) { G.gas = false; G.brake = true; }
              else { G.gas = true; G.brake = false; }
            } else { G.gas = true; }
            const near = G.hazards.concat(G.agents).filter(o => o.t !== 'checkpoint' &&
              o.z - G.dist > 40 && o.z - G.dist < 620 && Math.abs(o.lat - G.lat) < 66)[0];
            G.steer = near ? (near.lat >= G.lat ? -1 : 1) : 0;
            G.lastHorn = -1; if (Math.random() < 0.05) horn();
            update(dt);
          }
        }
      };
      g.drive(s.at);
      // one boarding beat so passengers are on board in the shot
      G.lastHorn = -1; horn();
      return { city: cityById(s.city).name, flag: cityById(s.city).flag, veh: cityById(s.city).vehicle,
        radio: cityById(s.city).radio.name, speed: Math.round(G.speed * KMH), pax: G.pax.length,
        credits: Math.round(G.credits), weather: G.weather, lanes: cityById(s.city).lanes,
        mode: G.mode, natives: Object.keys(PAX_KINDS).length };
    }, step);
    await page.waitForTimeout(420); // let a couple of frames draw
    await page.screenshot({ path: `${OUT}/${step.city}.png` });
    console.log('SHOT', JSON.stringify(info));
  }
  console.log('ERRORS', errs.length, errs.slice(0, 5).join(' | '));
  await browser.close();
})();
