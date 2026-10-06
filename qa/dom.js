const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args:['--no-sandbox'] });
  const p = await b.newPage({ viewport:{width:1280,height:860} });
  await p.goto('http://localhost:8080/', { waitUntil:'load' });
  await p.waitForTimeout(800);
  const chain = await p.evaluate(() => {
    const pick = (sel) => {
      let el = document.querySelector(sel), out = [];
      while (el && out.length < 8) { out.push(el.tagName + (el.id?'#'+el.id:'') + (el.className?'.'+String(el.className).split(' ').join('.'):'')); el = el.parentElement; }
      return out;
    };
    const ck = document.querySelector('#cookie');
    const cs = ck ? getComputedStyle(ck) : null;
    return { cookie: pick('#cookie'), toast: pick('#toast'),
      cookieStyle: cs ? { pos:cs.position, l:cs.left, r:cs.right, b:cs.bottom, w:cs.width } : null,
      stageBox: document.querySelector('#stage').getBoundingClientRect().toJSON(),
      cookieBox: ck ? ck.getBoundingClientRect().toJSON() : null };
  });
  console.log(JSON.stringify(chain, null, 1));
  await b.close();
})();
