/* Rasterise icon.svg to the PNG sizes iOS and Android actually use. */
const { chromium } = require('playwright');
const fs = require('fs');
const svg = fs.readFileSync('/home/user/fare-city/icon.svg', 'utf8');
const iosSvg = fs.readFileSync('/home/user/fare-city/icon-ios-src.svg', 'utf8');
const JOBS = [ { size:180, src:iosSvg, name:'apple-touch-icon.png' },   // full-bleed for the iOS mask
               { size:192, src:svg,    name:'icon-192.png' },
               { size:512, src:svg,    name:'icon-512.png' } ];
(async () => {
  const b = await chromium.launch({ args:['--no-sandbox'] });
  for (const job of JOBS) {
    const size = job.size;
    const p = await b.newPage({ viewport:{ width:size, height:size }, deviceScaleFactor:1 });
    const inner = job.src.replace('<svg ', '<svg width="' + size + '" height="' + size + '" ');
    await p.setContent('<html><body style="margin:0;background:#14141A">' + inner + '</body></html>');
    await p.waitForTimeout(120);
    const file = '/home/user/fare-city/' + job.name;
    await p.screenshot({ path:file });
    const bytes = fs.statSync(file).size;
    console.log('wrote ' + job.name + '  ' + size + 'px  ' + bytes + ' bytes');
    await p.close();
  }
  await b.close();
})();
