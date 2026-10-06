const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args:['--no-sandbox'] });
  for (const [w,h,tag] of [[1280,720,'wide'],[900,1400,'tall']]) {
    const p = await b.newPage({ viewport:{width:w,height:h} });
    await p.goto('http://localhost:8080/', { waitUntil:'load' });
    await p.waitForTimeout(900);
    await p.evaluate(() => $('#btnCookYes') && $('#btnCookYes').click());
    await p.screenshot({ path:`/home/user/qa/shots/24-preview-${tag}.png` });
    const s = await p.evaluate(() => { const r = $('#stage').getBoundingClientRect();
      return { x:Math.round(r.x), y:Math.round(r.y), w:Math.round(r.width), h:Math.round(r.height),
        centred: Math.abs((r.x + r.width/2) - innerWidth/2) < 2, fits: r.height <= innerHeight + 1 }; });
    console.log(tag, w+'x'+h, JSON.stringify(s));
    await p.close();
  }
  await b.close();
})();
