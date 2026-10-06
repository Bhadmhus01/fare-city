const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args:['--no-sandbox'] });
  // iPhone-ish viewport, touch enabled
  const ctx = await b.newContext({ viewport:{width:390,height:844}, deviceScaleFactor:3,
    isMobile:true, hasTouch:true, userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15' });
  const p = await ctx.newPage();
  const errs=[]; p.on('pageerror', e=>errs.push(e.message));
  await p.goto('file:///home/user/fare-city/index.html');
  await p.waitForTimeout(800);
  await p.screenshot({ path:'/home/user/qa/shots/20-phone-boot.png' });
  await p.click('#btnCookYes').catch(()=>{});
  await p.click('#btnStart'); await p.waitForTimeout(300);
  if (await p.isVisible('#scr-how')) { await p.click('#scr-how .x'); await p.waitForTimeout(300); }
  await p.screenshot({ path:'/home/user/qa/shots/21-phone-home.png' });
  await p.click('#btnContinue'); await p.waitForTimeout(600);
  // tap-and-hold the gas pedal like a thumb, then drag to steer
  const gas = await p.$('#btnGas'); const box = await gas.boundingBox();
  await p.mouse.move(box.x + box.width/2, box.y + box.height/2);
  await p.mouse.down();
  await p.waitForTimeout(2500);
  await p.mouse.up();
  const mid = await p.evaluate(() => ({ speed: Math.round(G.speed*KMH), auto: save.set.auto, mode: G.mode, lat: Math.round(G.lat) }));
  await p.screenshot({ path:'/home/user/qa/shots/22-phone-drive.png' });
  console.log('PHONE DRIVE', JSON.stringify(mid));
  console.log('ERRORS', errs.length, errs.slice(0,3).join(' | '));
  await b.close();
})();
