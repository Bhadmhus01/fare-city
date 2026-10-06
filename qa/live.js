const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args:['--no-sandbox'] });
  const p = await b.newPage({ viewport:{width:1280,height:860} });  // desktop-ish preview proportions
  const errs=[]; p.on('pageerror', e=>errs.push(e.message));
  p.on('console', m => { if (m.type()==='error') errs.push('console: '+m.text()); });
  await p.goto('http://localhost:8080/', { waitUntil:'load' });
  await p.waitForTimeout(1200);
  await p.screenshot({ path:'/home/user/qa/shots/23-live-desktop.png' });
  const st = await p.evaluate(() => ({ title:document.title, start:!!document.querySelector('#btnStart'),
    canvas:[cv.width,cv.height], raster:FX.raster, cit: typeof CITY_PACKS!=='undefined'?CITY_PACKS.length:0 }));
  console.log('LIVE', JSON.stringify(st), 'errors', errs.length, errs.slice(0,3).join(' | '));
  await b.close();
})();
