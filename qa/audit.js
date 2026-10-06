const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args:['--no-sandbox'] });
  const p = await b.newPage({ viewport:{width:540,height:960} });
  p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto('file:///home/user/fare-city/index.html');
  await p.waitForTimeout(500);
  const out = await p.evaluate(() => {
    $('#btnCookYes') && $('#btnCookYes').click();
    A.init(); startRun('lagos', 0);
    G.dist = 1200; G.credits = 4321; G.pax = [{who:'Oga',kind:PAX_KINDS[4],dest:2,mood:0,patience:45,waited:0}];
    G.boardQueue = 3; G.combo = 2; buildHudSeats(); updateHud(); toast('Press Gas to pull out of the garage', 9000);
    banner('Brake — stop in the yellow box');
    const els = ['#hudRoute','#hudSpeed','#radio','#combo','#seats','#banner','#fare','#btnHorn','#btnHop','#btnBoost','#btnPause','#btnGas','#btnBrake','#toast','#bigmsg'];
    const r = els.map(sel => {
      const el = document.querySelector(sel); if (!el) return { sel, miss:true };
      const b = el.getBoundingClientRect();
      return { sel, x:Math.round(b.x), y:Math.round(b.y), w:Math.round(b.width), h:Math.round(b.height),
        off: (b.x < 0 || b.y < 0 || b.right > 540 || b.bottom > 960) };
    });
    return r;
  });
  out.forEach(o => console.log(JSON.stringify(o)));
  await b.close();
})();
