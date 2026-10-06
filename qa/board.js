const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args:['--no-sandbox'] });
  const p = await b.newPage({ viewport:{width:540,height:960} });
  p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto('file:///home/user/fare-city/index.html');
  await p.waitForTimeout(600);
  const out = await p.evaluate(() => {
    save.name = 'Omo Eko';
    save.runs = [];
    for (let i=0;i<40;i++) save.runs.push({city:'lagos',route:'lag-1',rname:'Ojuelegba → Yaba',idx:9000+i*700,star:2,at:Date.now()-i*1000,pax:9});
    boardTab='global'; renderBoard();
    const rows = $$('#boardList .board');
    return { n: rows.length, sample: rows.slice(0,6).map(r=>r.innerText.replace(/\n/g,'|')),
      tail: rows.slice(-4).map(r=>r.innerText.replace(/\n/g,'|')),
      tailHTML: rows[rows.length-1] ? rows[rows.length-1].outerHTML.slice(0,220) : 'none' };
  });
  console.log(JSON.stringify(out, null, 1));
  await b.close();
})();
