/* ==========================================================================
   FARE CITY — RENDERER (canvas 2D, no image assets, everything procedural)
   Pseudo-3D: world runs along z. z=0 is the bus, big z is the horizon.
   ========================================================================== */
const W = 540, H = 960, CX = 270, HORIZON = 318, PLAYER_Y = 748, ZOOM = 940;
/* scripts first: Arabic, Devanagari and Thai need their own faces on some phones */
const SCRIPT_FONT = '"Noto Sans Arabic","Geeza Pro","Noto Naskh Arabic","Noto Sans Devanagari",' +
  '"Kohinoor Devanagari","Noto Sans Thai","Thonburi",system-ui,sans-serif';
const cv = document.getElementById('cv'), ctx = cv.getContext('2d');
const busCv = document.getElementById('busPreview');
const pz = z => { const s = 1/(1 + Math.max(-0.9, z)/ZOOM); return { y: PLAYER_Y - (PLAYER_Y-HORIZON)*(1-s), s: s }; };
const px = (lat, s) => CX + lat*s;
/* ---- caches: gradients and full-screen fills are the expensive part on phones ---- */
const FX = { sky:null, skyKey:'', ground:null, groundKey:'', fog:null, fogKey:'', vig:null, vigW:0, vigH:0,
  q:1, ft:16.7, eco:0 };
function qualityTick(ms){
  FX.n = (FX.n || 0) + 1;
  FX.ft = FX.ft*0.90 + Math.min(60, ms)*0.10;      /* smoothed frame time */
  if (FX.n < 120) return;                          /* let the page settle before judging it */
  if (FX.ft > 26 && FX.q > 0 && FX.n > (FX.coolQ || 0)){
    FX.q = 0; FX.eco = 1; FX.coolQ = FX.n + 320;   /* sustained slowness: drop effects + raster */
    applyRaster();
  } else if (FX.ft < 14.5 && FX.q < 1 && FX.n > (FX.coolQ || 0)){
    FX.q = 1; FX.eco = 0; FX.coolQ = FX.n + 320;   /* it recovered: put the polish back */
    applyRaster();
  }
}
/* Phones in this market vary wildly. Render the whole game into a smaller
   raster and let CSS stretch it: 44% fewer pixels to fill, same layout. */
function rasterScale(){
  const narrow = Math.min(window.innerWidth || W, 700) < 460;  /* phone-shaped viewport */
  if (FX.q > 0) return narrow ? 0.86 : 1;
  return narrow ? 0.62 : 0.82;                                 /* keep desktops from going blurry */
}
function applyRaster(){
  const k = rasterScale();
  if (Math.abs((FX.raster||0) - k) < 0.01) return;
  FX.raster = k;
  cv.width = Math.max(200, Math.round(W*k));
  cv.height = Math.max(360, Math.round(H*k));
  ctx.setTransform(k, 0, 0, k, 0, 0);
  ctx.imageSmoothingEnabled = true;
}
function radialVignette(){
  /* one small pre-rendered vignette, stretched — far cheaper than a per-frame 540x960 gradient */
  const w = 180, h = 320;
  if (FX.vig && FX.vigW === w) return FX.vig;
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g2 = c.getContext('2d');
  const rg = g2.createRadialGradient(w/2, h*0.45, h*0.18, w/2, h*0.5, h*0.72);
  rg.addColorStop(0,'rgba(0,0,0,0)'); rg.addColorStop(1,'rgba(0,0,0,.46)');
  g2.fillStyle = rg; g2.fillRect(0,0,w,h);
  FX.vig = c; FX.vigW = w; FX.vigH = h;
  return c;
}
function shade(hex, amt){
  const n = parseInt(hex.slice(1),16);
  let r=(n>>16)&255, g=(n>>8)&255, b=n&255;
  r = clamp(Math.round(r+amt),0,255); g = clamp(Math.round(g+amt),0,255); b = clamp(Math.round(b+amt),0,255);
  return '#'+((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1);
}
function roundRect(c, x, y, w, h, r){
  r = Math.min(r, Math.abs(w)/2, Math.abs(h)/2);
  c.beginPath();
  c.moveTo(x+r,y); c.lineTo(x+w-r,y); c.quadraticCurveTo(x+w,y,x+w,y+r);
  c.lineTo(x+w,y+h-r); c.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  c.lineTo(x+r,y+h); c.quadraticCurveTo(x,y+h,x,y+h-r);
  c.lineTo(x,y+r); c.quadraticCurveTo(x,y,x+r,y); c.closePath();
}
/* ---------- sky, skyline, roadside ---------- */
function makeSkyline(city, seed){
  const r = mulberry32(seed), out = [];
  for (let i=0;i<90;i++){
    out.push({ z: i*230 + r()*120, w: 90 + r()*200, h: 90 + r()*230,
      c: city.pal.bldg[Math.floor(r()*city.pal.bldg.length)], side: r()<.5?-1:1,
      win: r()<.8, lit: r() });
  }
  return out;
}
function makeRoadside(city, seed){
  const r = mulberry32(seed+7), out = [];
  const props = city.id==='lagos' ? ['danfo','hawker','lamp','sign','bin']
    : city.id==='london' ? ['lamp','redbox','sign','stop'] : ['lamp','sign','bin','stop','tree'];
  for (let i=0;i<120;i++){
    out.push({ z: i*170 + r()*80, side: r()<.5?-1:1, kind: props[Math.floor(r()*props.length)], seed: r() });
  }
  return out;
}
function drawSky(city, route){
  if (FX.skyKey !== city.id){
    FX.skyKey = city.id;
    const g = ctx.createLinearGradient(0,0,0,HORIZON+80);
    g.addColorStop(0, city.pal.skyTop); g.addColorStop(1, city.pal.skyBot);
    FX.sky = g;
  }
  ctx.fillStyle = FX.sky; ctx.fillRect(0,0,W,HORIZON+90);
  /* sun / haze */
  ctx.globalAlpha = .5; ctx.fillStyle = '#FFF3CC';
  ctx.beginPath(); ctx.arc(400, 130, 62, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
  /* parallax far skyline */
  const off = (G.dist*0.055)%W;
  ctx.fillStyle = shade(city.pal.bldg[1], -22);
  for (let i=0;i<26;i++){
    const x = ((i*74 - off)%(W+120)) - 60;
    const hh = 60 + (Math.sin(i*12.9898)*43758.5453 % 1 + 1)%1 * 90;
    ctx.fillRect(x, HORIZON-hh, 66, hh+16);
  }
  ctx.globalAlpha = .35; ctx.fillStyle = city.pal.skyBot;
  ctx.fillRect(0,HORIZON-46,W,60); ctx.globalAlpha = 1;
}
function drawGround(city, route){
  const ground = route.scenery==='bridge' ? city.pal.water : city.pal.ground;
  const near = pz(-260).y;
  const gk = city.id + ':' + route.scenery;
  if (FX.groundKey !== gk){
    FX.groundKey = gk;
    const gg = ctx.createLinearGradient(0,HORIZON,0,near);
    gg.addColorStop(0, shade(ground,-26)); gg.addColorStop(1, ground);
    FX.ground = gg;
  }
  ctx.fillStyle = FX.ground; ctx.fillRect(0,HORIZON-30,W,near-HORIZON+120);
  if (route.scenery === 'bridge'){
    /* glassy river: broken reflections under the deck */
    ctx.globalAlpha = .22; ctx.fillStyle = '#FFFFFF';
    for (let i=0;i<26;i++){
      const zz = pz(i*240 - (G.dist%240));
      if (zz.s < .05) continue;
      ctx.fillRect(0, zz.y, W, 1.6*zz.s + 0.5);
    }
    ctx.globalAlpha = 1;
  }
}
function drawStreet(city, route){
  const nearW = 400, far = 26;
  const yN = pz(-300).y, yF = HORIZON;
  /* kerbs */
  ctx.beginPath();
  ctx.moveTo(CX-nearW, yN); ctx.lineTo(CX-far, yF); ctx.lineTo(CX+far, yF); ctx.lineTo(CX+nearW, yN); ctx.closePath();
  ctx.fillStyle = city.pal.kerb; ctx.fill();
  /* asphalt */
  const sh = city.id==='london'||city.id==='bangkok'||city.id==='mumbai' ? 26 : 8;
  ctx.beginPath();
  ctx.moveTo(CX-nearW+22, yN+6); ctx.lineTo(CX-far+8, yF+2); ctx.lineTo(CX+far-8, yF+2); ctx.lineTo(CX+nearW-22, yN+6); ctx.closePath();
  const rk = city.id + ':' + sh;
  if (FX.roadKey !== rk){
    FX.roadKey = rk;
    const g = ctx.createLinearGradient(0,yF,0,yN);
    g.addColorStop(0, shade(city.pal.road,14)); g.addColorStop(1, shade(city.pal.road,-sh));
    FX.road = g;
  }
  ctx.fillStyle = FX.road; ctx.fill();
  /* lane dashes */
  const lanes = city.lanes, sp = 260;
  const z0 = Math.floor((G.dist - 200)/sp)*sp;
  ctx.fillStyle = 'rgba(255,248,220,.72)';
  for (let l=1;l<lanes;l++){
    const lat = laneLat(l, lanes);
    for (let i=0;i<26;i++){
      const wz = z0 + i*sp - G.dist;
      const a = pz(wz), b = pz(wz-110);
      if (a.s<.05 || wz < -900 || wz > 4200) continue;
      const hw = (5*a.s + .7);
      ctx.beginPath();
      ctx.moveTo(px(lat-hw/1.6, a.s), a.y); ctx.lineTo(px(lat+hw/1.6, a.s), a.y);
      ctx.lineTo(px(lat+hw/2, b.s), b.y); ctx.lineTo(px(lat-hw/2, b.s), b.y);
      ctx.closePath(); ctx.fill();
    }
  }
  /* kerb stones: regular blocks give the eye a speed and depth cue */
  if (FX.q > 0){
  const kerbSp = 120, kz0 = Math.floor((G.dist - 200)/kerbSp)*kerbSp;
  for (let i=0;i<40;i++){
    const wz = kz0 + i*kerbSp - G.dist;
    const a = pz(wz), b = pz(wz-kerbSp+16);
    if (a.s < .05 || wz < -400 || wz > 4200) continue;
    const lat = (253*(lanes-1)/2) + 26;
    if ((i + Math.round(G.dist/kerbSp)) % 2 === 0) continue;
    ctx.fillStyle = 'rgba(255,255,255,.16)';
    [[-1],[1]].forEach(function(sd){
      const l0 = sd[0]*lat;
      ctx.beginPath();
      ctx.moveTo(px(l0-24, a.s), a.y); ctx.lineTo(px(l0+24, a.s), a.y);
      ctx.lineTo(px(l0+30, b.s), b.y); ctx.lineTo(px(l0-18, b.s), b.y);
      ctx.closePath(); ctx.fill();
    });
  }
  }
  /* road edge lines */
  ctx.fillStyle = 'rgba(255,255,255,.5)';
  [-(253*(lanes-1)/2)-126, (253*(lanes-1)/2)+126].forEach(function(lat){
    ctx.beginPath();
    const a0 = pz(-300), a1 = pz(1400);
    ctx.moveTo(px(lat-6,a0.s), a0.y); ctx.lineTo(px(lat+6,a0.s), a0.y);
    ctx.lineTo(px(lat+3,a1.s), a1.y); ctx.lineTo(px(lat-3,a1.s), a1.y);
    ctx.closePath(); ctx.fill();
  });
  /* horizon haze so the road melts into the distance */
  if (FX.fogKey !== city.id){
    FX.fogKey = city.id;
    const fog = ctx.createLinearGradient(0, HORIZON-46, 0, HORIZON+120);
    fog.addColorStop(0, city.pal.skyBot); fog.addColorStop(0.5, 'rgba(255,255,255,.34)');
    fog.addColorStop(1, 'rgba(255,255,255,0)');
    FX.fog = fog;
  }
  ctx.fillStyle = FX.fog; ctx.fillRect(0, HORIZON-46, W, 166);
}
function laneLat(i, lanes){ return (i - (lanes-1)/2) * 253; }
/* suspension deck: parapets, towers, cables. Drawn before the road so the
   asphalt sits on top of the deck. */
function drawBridgeDeck(city){
  const latW = (city.lanes-1)/2*253 + 118;
  const postSp = 210, pz0 = Math.floor((G.dist - 200)/postSp)*postSp;
  [[-1],[1]].forEach(function(sd){
    const lat = sd[0]*latW;
    const nearP = pz(-300), farP = pz(3400);
    ctx.fillStyle = shade(city.pal.kerb, -16);
    ctx.beginPath();
    ctx.moveTo(px(lat - sd[0]*9, nearP.s), nearP.y);
    ctx.lineTo(px(lat + sd[0]*9, nearP.s), nearP.y);
    ctx.lineTo(px(lat + sd[0]*4, farP.s), farP.y);
    ctx.lineTo(px(lat - sd[0]*4, farP.s), farP.y);
    ctx.closePath(); ctx.fill();
    for (let i=0;i<26;i++){
      const wz = pz0 + i*postSp - G.dist;
      if (wz < -260 || wz > 3400) continue;
      const p = pz(wz); if (p.s < .05) continue;
      const w = 13*p.s, h = 70*p.s;
      ctx.fillStyle = city.pal.kerb;
      ctx.fillRect(px(lat, p.s) - w/2, p.y - h, w, h + 4);
      ctx.fillStyle = shade(city.pal.kerb, -52);
      ctx.fillRect(px(lat, p.s) - w/2, p.y - h, w, 5*p.s + 1);
    }
  });
  const towSp = 1500, t0 = Math.floor((G.dist - 600)/towSp)*towSp;
  for (let i=0;i<6;i++){
    const wz = t0 + i*towSp - G.dist;
    if (wz < -500 || wz > 4200) continue;
    const p = pz(wz); if (p.s < .05) continue;
    const tw = 30*p.s, th = 640*p.s;
    [[-1],[1]].forEach(function(sd){
      const bx = px(sd[0]*(latW + 46), p.s);
      ctx.fillStyle = shade(city.pal.kerb, -60);
      ctx.fillRect(bx - tw/2, p.y - th, tw, th);
      ctx.fillStyle = city.pal.kerb;
      ctx.fillRect(bx - tw/2, p.y - th, tw, 10*p.s + 1);
      /* cable sweeping from this tower head across the span */
      const pFar = pz(wz + towSp - G.dist);
      ctx.strokeStyle = 'rgba(30,32,38,.7)';
      ctx.lineWidth = Math.max(1, 3.2*p.s);
      ctx.beginPath();
      ctx.moveTo(bx, p.y - th);
      ctx.quadraticCurveTo((bx + px(sd[0]*(latW+46), pFar.s))/2, p.y - th*0.2,
        px(sd[0]*(latW+46), pFar.s), pFar.y - 40*pFar.s);
      ctx.stroke();
    });
  }
}
function drawSkylineNear(city, route){
  if (route.scenery === 'bridge') return; /* the deck carries the view */
  for (let i=0;i<G.sky.length;i++){
    const b = G.sky[i], z = b.z - G.dist;
    if (z < -300 || z > 3200) continue;
    const p = pz(z);
    if (p.s < .045) continue;
    const w = Math.max(6, b.w*p.s), h = Math.max(8, b.h*p.s);
    const lat = b.side * (470 + (1-b.win?120:0));
    const bx = px(lat, p.s);
    ctx.fillStyle = b.c;
    ctx.fillRect(bx-w/2, p.y-h, w, h+8);
    ctx.fillStyle = shade(b.c,-38);
    ctx.fillRect(bx-w/2, p.y-h, w, h*0.10);
    if (b.win && p.s > .13){
      ctx.fillStyle = 'rgba(255,240,190,'+(0.16+0.5*b.lit)+')';
      const cols = Math.max(2, Math.floor(w/16)), rows = Math.max(2, Math.floor(h/26));
      for (let c=0;c<cols;c++) for (let r2=0;r2<rows;r2++){
        if ((c+r2+Math.floor(b.lit*10))%3===0) continue;
        ctx.fillRect(bx-w/2+5+c*(w-10)/cols, p.y-h+8+r2*(h-12)/rows, Math.max(2,(w-10)/cols*.5), Math.max(2,(h-12)/rows*.5));
      }
    }
  }
}
function drawRoadside(city, route){
  const bridge = route.scenery === 'bridge';
  for (let i=0;i<G.road.length;i++){
    const o = G.road[i], z = o.z - G.dist;
    if (z < -200 || z > 2600) continue;
    if (bridge && o.kind !== 'lamp') continue;
    const p = pz(z); if (p.s < .05) continue;
    const lat = o.side * (392 + o.seed*20);
    const x = px(lat, p.s), s = p.s;
    if (o.kind === 'lamp'){
      ctx.fillStyle = '#4B4F57'; ctx.fillRect(x-2*s, p.y-150*s, 4*s, 150*s);
      ctx.fillStyle = '#FFE6A8'; ctx.beginPath(); ctx.arc(x, p.y-152*s, 7*s+1, 0, 7); ctx.fill();
      ctx.globalAlpha = .14; ctx.fillStyle='#FFE6A8'; ctx.beginPath(); ctx.arc(x,p.y-150*s,34*s,0,7); ctx.fill(); ctx.globalAlpha=1;
    } else if (o.kind === 'sign'){
      const w = 78*s, h = 46*s;
      ctx.fillStyle = '#3C3F45'; ctx.fillRect(x-2*s, p.y-h-40*s, 3*s, h+40*s);
      ctx.fillStyle = city.pal.accent; ctx.fillRect(x-w/2, p.y-h-52*s, w, h);
      ctx.fillStyle = 'rgba(0,0,0,.55)';
      ctx.font = '900 ' + Math.max(5, 13*s) + 'px system-ui';
      ctx.textAlign = 'center'; ctx.fillText(city.slang.horn, x, p.y-h-24*s);
    } else if (o.kind === 'tree'){
      ctx.fillStyle = '#6B4F2A'; ctx.fillRect(x-3*s, p.y-58*s, 6*s, 58*s);
      ctx.fillStyle = shade(city.pal.ground, 22);
      ctx.beginPath(); ctx.arc(x, p.y-70*s, 30*s, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.arc(x-18*s, p.y-56*s, 20*s, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.arc(x+18*s, p.y-56*s, 20*s, 0, 7); ctx.fill();
    } else if (o.kind === 'redbox'){
      ctx.fillStyle = '#B3221C'; ctx.fillRect(x-13*s, p.y-72*s, 26*s, 72*s);
      ctx.fillStyle = '#7E1512'; ctx.fillRect(x-13*s, p.y-78*s, 26*s, 8*s);
    } else if (o.kind === 'bin'){
      ctx.fillStyle = '#4C5560'; ctx.fillRect(x-9*s, p.y-30*s, 18*s, 30*s);
    } else if (o.kind === 'stop'){
      ctx.fillStyle = '#3C3F45'; ctx.fillRect(x-2*s, p.y-96*s, 4*s, 96*s);
      ctx.fillStyle = '#E8453C'; ctx.beginPath(); ctx.arc(x, p.y-104*s, 12*s, 0, 7); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font='900 '+(11*s)+'px system-ui'; ctx.textAlign='center'; ctx.fillText('H', x, p.y-100*s);
    } else if (o.kind === 'hawker'){
      const bob = Math.sin(G.t*6 + o.z)*3*s;
      ctx.fillStyle = '#2C2F36'; ctx.fillRect(x-7*s, p.y-40*s+bob, 14*s, 40*s);
      ctx.fillStyle = '#8A5A2B'; ctx.beginPath(); ctx.arc(x, p.y-48*s+bob, 9*s, 0, 7); ctx.fill();
      ctx.fillStyle = city.pal.accent; ctx.fillRect(x-12*s, p.y-30*s+bob, 24*s, 12*s);
    } else if (o.kind === 'danfo'){
      drawVehicle(x, p.y, s*1.05, city.pal.accent, 'bus', true);
    }
  }
}
/* ---------- vehicles & people ---------- */
function drawVehicle(x, y, s, colour, kind, parked){
  const w = 96*s, h = 66*s;
  ctx.save();
  if (kind === 'bike'){
    ctx.fillStyle = '#2B2E34';
    ctx.fillRect(x-5*s, y-40*s, 10*s, 40*s);
    ctx.beginPath(); ctx.arc(x, y-44*s, 10*s, 0, 7); ctx.fill();
    ctx.fillStyle = colour; ctx.fillRect(x-14*s, y-44*s, 28*s, 16*s);
  } else {
    ctx.fillStyle = shade(colour,-30);
    roundRect(ctx, x-w/2, y-h, w, h, 10*s); ctx.fill();
    ctx.fillStyle = colour;
    roundRect(ctx, x-w/2, y-h-14*s, w, h*0.9, 9*s); ctx.fill();
    ctx.fillStyle = 'rgba(180,220,255,.75)';
    roundRect(ctx, x-w*0.34, y-h-6*s, w*0.68, 22*s, 4*s); ctx.fill();
    ctx.fillStyle = '#E8453C';
    ctx.fillRect(x-w*0.44, y-16*s, 12*s, 7*s); ctx.fillRect(x+w*0.32, y-16*s, 12*s, 7*s);
    ctx.fillStyle = '#26282D';
    ctx.fillRect(x-w*0.5, y-8*s, w, 8*s);
    if (kind === 'bus'){
      ctx.fillStyle = 'rgba(255,255,255,.9)';
      ctx.fillRect(x-w*0.22, y-h-30*s, w*0.5, 15*s);
      ctx.fillStyle = '#1B1B22'; ctx.font = '900 ' + (11*s) + 'px system-ui'; ctx.textAlign = 'center';
      ctx.fillText('LAGOS', x, y-h-19*s);
    }
    ctx.fillStyle = '#15161A';
    ctx.beginPath(); ctx.arc(x-w*0.32, y-2*s, 9*s, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(x+w*0.32, y-2*s, 9*s, 0, 7); ctx.fill();
  }
  ctx.restore();
}
function drawBus(opts){
  const c = opts || {}, s = c.s || 1, x = c.x || CX, y = c.y || PLAYER_Y;
  const g = c.ctx || ctx;
  const paint = c.paint || {body:'#FFD23D', trim:'#14141A', roof:'#F2A900'};
  const tilt = (c.tilt||0), bounce = (c.bounce||0);
  g.save();
  g.translate(x, y+bounce);
  g.rotate(tilt);
  g.scale(s, s);
  const w = 190, h = 150;
  /* shadow */
  g.globalAlpha = .35; g.fillStyle = '#000';
  g.beginPath(); g.ellipse(0, 4, w*0.56, 14, 0, 0, 7); g.fill(); g.globalAlpha = 1;
  /* exhaust */
  if (c.smoke){
    g.globalAlpha = .32; g.fillStyle = '#3A3A3A';
    for (let i=0;i<4;i++){ g.beginPath(); g.arc(-w*0.5 - i*9, -14 - i*7, 8+i*2.4, 0, 7); g.fill(); }
    g.globalAlpha = 1;
  }
  /* body (wheels are drawn after it so they peek out underneath) */
  const grd = g.createLinearGradient(0,-h,0,0);
  grd.addColorStop(0, shade(paint.body, 18)); grd.addColorStop(1, shade(paint.body,-14));
  g.fillStyle = grd;
  roundRect(g, -w/2, -h-8, w, h+8, 14); g.fill();
  /* roof band */
  g.fillStyle = paint.roof;
  roundRect(g, -w/2+8, -h-26, w-16, 26, 10); g.fill();
  /* rear window */
  g.fillStyle = 'rgba(150,200,235,.9)';
  roundRect(g, -w*0.38, -h+4, w*0.76, 52, 8); g.fill();
  /* passengers seen through glass */
  const n = c.seats || 0;
  g.fillStyle = 'rgba(20,20,26,.55)';
  for (let i=0;i<Math.min(7,n);i++){
    const bx = -w*0.32 + i*(w*0.64/6.5);
    g.beginPath(); g.arc(bx, -h+38, 8, 0, 7); g.fill();
    g.fillRect(bx-8, -h+34, 16, 22);
  }
  /* door */
  if (c.doors){
    g.fillStyle = shade(paint.body, -34);
    roundRect(g, w*0.16, -h+56, 32, 62, 6); g.fill();
  }
  /* wheels, poking out below the bumper */
  g.fillStyle = '#15161A';
  roundRect(g, -w*0.47, -26, 36, 36, 9); g.fill();
  roundRect(g, w*0.16, -26, 36, 36, 9); g.fill();
  g.fillStyle = '#3A3D44';
  roundRect(g, -w*0.47+9, -18, 18, 18, 5); g.fill();
  roundRect(g, w*0.16+9, -18, 18, 18, 5); g.fill();
  /* trim + details */
  g.strokeStyle = paint.trim; g.lineWidth = 3;
  roundRect(g, -w/2, -h-8, w, h+8, 14); g.stroke();
  g.fillStyle = paint.trim;
  g.fillRect(-w/2, -46, w, 7);
  /* lights */
  g.fillStyle = '#E8453C';
  roundRect(g, -w*0.47, -44, 22, 13, 4); g.fill();
  roundRect(g, w*0.30, -44, 22, 13, 4); g.fill();
  /* plate + route board */
  g.fillStyle = '#F6F6F0'; roundRect(g, -26, -40, 52, 17, 3); g.fill();
  g.fillStyle = '#14141A'; g.font = '900 12px system-ui'; g.textAlign = 'center';
  g.fillText(c.plate || 'FARE CITY', 0, -27);
  g.fillStyle = 'rgba(20,20,26,.92)'; roundRect(g, -62, -h-22, 124, 20, 5); g.fill();
  g.fillStyle = paint.body; g.font = '900 12px system-ui';
  g.fillText(c.board || 'OWA!', 0, -h-8);
  /* horn decal from upgrades */
  if (c.hornLv >= 2){ g.fillStyle = '#FFF3CC'; g.font = '900 13px system-ui'; g.fillText('♫', -w*0.42, -h-2); }
  if (c.hornLv >= 4){ g.fillStyle = '#FFD23D'; g.font = '900 12px system-ui'; g.fillText('★', w*0.40, -h-2); }
  g.restore();
}
/* ---------- bus stops: the yellow box you must stop inside ---------- */
function drawStops(){
  const latW = (G.city.lanes-1)/2*253 + 128;
  for (let i=0;i<G.stops.length;i++){
    const s = G.stops[i], dz = s.z - G.dist;
    if (dz < -320 || dz > 3000) return;
    const zA = s.z - s.box, zB = s.z + s.box;
    const pA = pz(zA - G.dist), pB = pz(zB - G.dist);
    /* the box itself */
    ctx.globalAlpha = s.done ? 0.22 : 0.62;
    ctx.fillStyle = '#FFD23D';
    ctx.beginPath();
    ctx.moveTo(px(-latW, pA.s), pA.y); ctx.lineTo(px(latW, pA.s), pA.y);
    ctx.lineTo(px(latW, pB.s), pB.y); ctx.lineTo(px(-latW, pB.s), pB.y);
    ctx.closePath(); ctx.fill();
    /* black chevrons on the box mouth */
    ctx.globalAlpha = s.done ? 0.15 : 0.5;
    ctx.fillStyle = '#14141A';
    const n = 5;
    for (let k=0;k<n;k++){
      const f = (k+0.5)/n;
      const lat0 = -latW + f*(latW*2);
      const wdt = 40;
      ctx.beginPath();
      ctx.moveTo(px(lat0-wdt, pA.s), pA.y); ctx.lineTo(px(lat0+wdt, pA.s), pA.y);
      ctx.lineTo(px(lat0+wdt+8, pB.s), pB.y); ctx.lineTo(px(lat0-wdt-8, pB.s), pB.y);
      ctx.closePath(); ctx.fill();
    }
    ctx.globalAlpha = 1;
    /* name board on the near kerb */
    const p = pz(zB - G.dist);
    if (p.s > 0.08){
      const x = px(latW+92, p.s), poleH = 150*p.s;
      ctx.fillStyle = '#3C3F45'; ctx.fillRect(x-3*p.s, p.y-poleH, 6*p.s, poleH);
      const bw = Math.max(30, 200*p.s), bh = Math.max(9, 44*p.s);
      ctx.fillStyle = '#FFD23D'; roundRect(ctx, x-bw/2, p.y-poleH-bh, bw, bh, 4*p.s); ctx.fill();
      ctx.strokeStyle = '#14141A'; ctx.lineWidth = Math.max(1,2.4*p.s); 
      roundRect(ctx, x-bw/2, p.y-poleH-bh, bw, bh, 4*p.s); ctx.stroke();
      if (p.s > 0.22){
        ctx.fillStyle = '#14141A'; ctx.textAlign = 'center';
        const native = s.native || s.name;
        const hasNative = save.set.script && native !== s.name;
        if (hasNative){
          ctx.font = '900 ' + Math.min(24, 16*p.s) + 'px ' + SCRIPT_FONT;
          ctx.fillText(native, x, p.y-poleH-bh*0.52);
          ctx.font = '700 ' + Math.min(13, 9.5*p.s) + 'px ' + SCRIPT_FONT;
          ctx.fillStyle = 'rgba(20,20,26,.72)';
          ctx.fillText(s.name.toUpperCase(), x, p.y-poleH-bh*0.10);
        } else {
          ctx.font = '900 ' + Math.min(26, 17*p.s) + 'px ' + SCRIPT_FONT;
          ctx.fillText(s.name.toUpperCase(), x, p.y-poleH-bh*0.3);
        }
      }
    }
    /* progress flag on the road while you are close */
    if (dz > 0 && dz < 900 && !s.done){
      const pc = pz(dz);
      ctx.fillStyle = 'rgba(255,210,61,.9)';
      ctx.font = '900 ' + Math.max(11, 26*pc.s) + 'px system-ui'; ctx.textAlign = 'center';
      ctx.fillText(Math.round(dz/UNITS_PER_M) + 'm', px(0, pc.s), pc.y - 22*pc.s);
    }
  }
}
/* ---------- world objects ---------- */
function drawHazard(o){
  const p = pz(o.z), s = p.s; if (s < .045) return;
  const x = px(o.lat, s), y = p.y;
  if (o.t === 'pothole'){
    ctx.fillStyle = 'rgba(10,10,14,.85)';
    ctx.beginPath(); ctx.ellipse(x, y, 46*s, 15*s, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.16)'; ctx.lineWidth = 2.4*s;
    ctx.beginPath(); ctx.ellipse(x, y, 46*s, 15*s, 0, 0, 7); ctx.stroke();
  } else if (o.t === 'bump'){
    ctx.fillStyle = '#C9A227';
    roundRect(ctx, x-64*s, y-13*s, 128*s, 13*s, 5*s); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,.45)';
    for (let i=0;i<4;i++) ctx.fillRect(x-56*s + i*32*s, y-12*s, 12*s, 11*s);
  } else if (o.t === 'cone'){
    ctx.fillStyle = '#F26A21';
    ctx.beginPath(); ctx.moveTo(x, y-42*s); ctx.lineTo(x+17*s, y); ctx.lineTo(x-17*s, y); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#FFF'; ctx.fillRect(x-11*s, y-22*s, 22*s, 7*s);
  } else if (o.t === 'flood'){
    ctx.fillStyle = 'rgba(90,140,160,.55)';
    ctx.beginPath(); ctx.ellipse(x, y, 62*s, 18*s, 0, 0, 7); ctx.fill();
  } else if (o.t === 'cow'){
    ctx.fillStyle = '#EFE7DA';
    roundRect(ctx, x-46*s, y-52*s, 92*s, 40*s, 12*s); ctx.fill();
    ctx.fillStyle = '#4A3B2A';
    ctx.beginPath(); ctx.arc(x+40*s, y-56*s, 17*s, 0, 7); ctx.fill();
    ctx.fillStyle = '#EFE7DA'; ctx.beginPath(); ctx.arc(x+34*s, y-46*s, 12*s, 0, 7); ctx.fill();
    ctx.fillStyle = '#3A2E22';
    ctx.fillRect(x-34*s, y-14*s, 8*s, 15*s); ctx.fillRect(x+22*s, y-14*s, 8*s, 15*s);
  } else if (o.t === 'barrier'){
    ctx.fillStyle = '#E8453C'; roundRect(ctx, x-70*s, y-30*s, 140*s, 16*s, 4*s); ctx.fill();
    ctx.fillStyle = '#FFF';
    for (let i=0;i<4;i++) ctx.fillRect(x-64*s+i*34*s, y-30*s, 18*s, 16*s);
    ctx.fillStyle = '#5B5F66'; ctx.fillRect(x-70*s, y-30*s, 6*s, 30*s); ctx.fillRect(x+64*s, y-30*s, 6*s, 30*s);
  } else if (o.t === 'checkpoint'){
    /* pink box on road */
    ctx.globalAlpha = .8; ctx.fillStyle = '#F472D0';
    roundRect(ctx, x-150*s, y-6*s, 300*s, 30*s, 6*s); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#2B2E34';
    ctx.fillRect(x-180*s, y-92*s, 9*s, 92*s); ctx.fillRect(x+171*s, y-92*s, 9*s, 92*s);
    ctx.fillStyle = G.city.pal.accent;
    roundRect(ctx, x-180*s, y-118*s, 360*s, 30*s, 5*s); ctx.fill();
    ctx.fillStyle = '#14141A'; ctx.font = '900 ' + (16*s) + 'px system-ui'; ctx.textAlign = 'center';
    ctx.fillText((G.city.labels.checkpoint||'Checkpoint').toUpperCase(), x, y-97*s);
  } else if (o.t === 'agent'){
    if (o.kind === 'bike'){
      const w = 40*s;
      ctx.fillStyle = o.colour || '#E8453C';
      roundRect(ctx, x-w/2, y-40*s, w, 18*s, 6*s); ctx.fill();
      ctx.fillStyle = '#22242A';
      ctx.beginPath(); ctx.arc(x, y-46*s, 11*s, 0, 7); ctx.fill();
      ctx.fillRect(x-3*s, y-64*s, 6*s, 8*s);
      ctx.fillStyle = '#15161A';
      ctx.beginPath(); ctx.arc(x, y-6*s, 9*s, 0, 7); ctx.fill();
    } else if (o.kind === 'ped'){
      const swing = Math.sin(G.t*9 + o.seed)*4*s;
      ctx.fillStyle = o.colour || '#2E6BE6';
      ctx.fillRect(x-8*s, y-46*s, 16*s, 30*s);
      ctx.fillStyle = '#3A2E22';
      ctx.fillRect(x-8*s, y-16*s, 6*s, 16*s+swing); ctx.fillRect(x+2*s, y-16*s, 6*s, 16*s-swing);
      ctx.fillStyle = '#8A5A2B'; ctx.beginPath(); ctx.arc(x, y-54*s, 10*s, 0, 7); ctx.fill();
    } else if (o.kind === 'crew'){
      const bob = Math.sin(G.t*5 + o.pat)*4*s, lean = Math.sin(G.t*3 + o.pat)*3*s;
      ctx.fillStyle = '#262A31'; ctx.fillRect(x-9*s, y-42*s+bob, 18*s, 42*s);
      ctx.fillStyle = G.city.pal.accent; ctx.fillRect(x-15*s, y-34*s+bob, 30*s, 12*s);   /* sash */
      ctx.fillStyle = '#8A5A2B'; ctx.beginPath(); ctx.arc(x+lean, y-50*s+bob, 11*s, 0, 7); ctx.fill();
      ctx.fillStyle = '#14141A'; ctx.fillRect(x-11*s+lean, y-60*s+bob, 22*s, 6*s);       /* cap */
      if (s > 0.22 && G.hazardsMarked !== 0 && o.crewRef && o.crewRef.alive > 0){
        ctx.font = '900 ' + Math.min(20, 15*s) + 'px ' + SCRIPT_FONT;
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(255,210,61,.95)';
        ctx.fillText(o.crewRef.cfg.emoji, x, y-66*s);
      }
    } else {
      const bob = Math.sin(G.t*7 + o.seed)*3*s;
      ctx.fillStyle = '#39404A'; ctx.fillRect(x-10*s, y-44*s+bob, 20*s, 44*s);
      ctx.fillStyle = '#8A5A2B'; ctx.beginPath(); ctx.arc(x, y-52*s+bob, 11*s, 0, 7); ctx.fill();
      ctx.fillStyle = G.city.pal.accent; ctx.fillRect(x-16*s, y-30*s+bob, 32*s, 13*s);
    }
    if (o.scared){ ctx.fillStyle = '#FFF'; ctx.font='900 '+(13*s)+'px system-ui'; ctx.textAlign='center';
      ctx.fillText('!', x, y-72*s); }
    if (o.honked){ ctx.fillStyle = 'rgba(255,255,255,.92)'; ctx.font='900 '+(12*s)+'px system-ui';
      ctx.textAlign='center'; ctx.fillText(G.city.slang.horn, x, y-78*s); }
  }
}
function drawParticles(dt, zMin, zMax){
  for (let i=G.parts.length-1;i>=0;i--){
    const p = G.parts[i];
    p.life -= dt; if (p.life <= 0){ G.parts.splice(i,1); continue; }
    if (p.z < (zMin==null?-1e9:zMin) || p.z > (zMax==null?1e9:zMax)) continue;
    p.z += p.vz*dt; p.lat += p.vlat*dt; p.latV = (p.latV||0); p.vlat += p.latV*dt;
    p.vy = (p.vy||0) - 300*dt;
    const q = pz(p.z);
    if (q.s < .04) continue;
    const x = px(p.lat, q.s), y = q.y + (p.h||0)*q.s;
    ctx.globalAlpha = clamp(p.life/p.max,0,1) * (p.a==null?1:p.a);
    if (p.txt){
      ctx.fillStyle = p.col || '#FFD23D'; ctx.font = '900 ' + Math.max(11,(p.size||26)*q.s) + 'px system-ui';
      ctx.textAlign = 'center'; ctx.fillText(p.txt, x, y);
    } else {
      ctx.fillStyle = p.col || '#333';
      const r = (p.r||5)*q.s;
      ctx.beginPath(); ctx.arc(x, y, Math.max(1,r), 0, 7); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}
/* ---------- weather ---------- */
function drawWeather(dt){
  const w = G.weather;
  if (!w || save.set.calm) return;
  for (let i=G.wx.length-1;i>=0;i--){
    const d = G.wx[i];
    d.x += d.vx*dt; d.y += d.vy*dt; d.life -= dt;
    if (d.life <= 0 || d.y > H+20 || d.x < -40 || d.x > W+40){ G.wx.splice(i,1); continue; }
    if (w === 'rain'){
      ctx.strokeStyle = 'rgba(200,225,245,.5)'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(d.x, d.y); ctx.lineTo(d.x - d.vx*0.02, d.y - d.vy*0.02); ctx.stroke();
    } else {
      ctx.fillStyle = 'rgba(214,180,120,.4)';
      ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, 7); ctx.fill();
    }
  }
}
function spawnWeather(dt){
  const w = G.weather;
  if (!w || save.set.calm) return;
  const rate = (w === 'rain' ? 60 : 22) * (FX.q > 0 ? 1 : 0.45);
  G.wxAcc = (G.wxAcc||0) + dt*rate;
  while (G.wxAcc > 1 && G.wx.length < (FX.q > 0 ? 190 : 80)){
    G.wxAcc -= 1;
    if (w === 'rain') G.wx.push({x:rnd(-40,W), y:rnd(-60,HORIZON), vx:-90, vy:rnd(700,1000), life:3});
    else G.wx.push({x:rnd(-40,W), y:rnd(HORIZON,H), vx:rnd(-70,-20), vy:rnd(-40,10), r:rnd(1,2.6), life:4});
  }
  if (w === 'rain'){
    ctx.fillStyle = 'rgba(120,150,175,.12)'; ctx.fillRect(0,HORIZON,W,H-HORIZON);
  }
}
function drawNightLights(){
  if (!G.dusk) return;
  ctx.fillStyle = 'rgba(24,20,44,.28)'; ctx.fillRect(0,0,W,H);
}
/* ---------- full frame ---------- */
function render(dt){
  const city = G.city, route = G.route;
  ctx.save();
  if (G.shake > 0.1 && !save.set.calm){
    ctx.translate(rnd(-G.shake,G.shake), rnd(-G.shake,G.shake));
  }
  drawSky(city, route);
  drawGround(city, route);
  if (route.scenery === 'bridge') drawBridgeDeck(city);
  drawSkylineNear(city, route);
  drawRoadside(city, route);
  drawStreet(city, route);
  drawStops();
  /* hazards & agents, far to near */
  const objs = G.hazards.concat(G.agents).sort((a,b)=>b.z-a.z);
  for (let i=0;i<objs.length;i++) drawHazard(objs[i]);
  /* NPC traffic */
  for (let i=0;i<G.npc.length;i++){
    const n = G.npc[i], p = pz(n.z);
    if (p.s < .05 || n.z < -260 || n.z > 3000) continue;
    drawVehicle(px(n.lat,p.s), p.y, p.s*(n.big?1.1:0.92), n.colour, n.big?'bus':'car', false);
  }
  /* particles that happen behind the bus */
  drawParticles(dt, -1e9, 40);
  /* the bus */
  if (G.hp > 0){
    drawBus({ x: CX + G.lat, y: PLAYER_Y, s: 1 + G.air*0.02, tilt: G.tilt*0.6,
      bounce: G.bounce, smoke: G.speed > 8 || G.boostT > 0, seats: G.pax.length,
      paint: G.paint, board: route.short, plate: (save.name||'FARE CITY').slice(0,10).toUpperCase(),
      doors: G.doorsT > 0, hornLv: partLevel('horn') });
  }
  drawParticles(dt, 40, 1e9);
  spawnWeather(dt);
  drawWeather(dt);
  /* a city condition can take your visibility away */
  if (G.evFx && G.evFx.visibility && G.evFx.visibility < 1 && !save.set.calm){
    const a = (1 - G.evFx.visibility) * 0.72;
    ctx.fillStyle = EV_TINT[G.ev && G.ev.id] || '#E8E4DA';
    ctx.globalAlpha = a; ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
    /* a band of haze near the horizon so the road really does disappear */
    const hz = ctx.createLinearGradient(0, HORIZON-60, 0, HORIZON+220);
    hz.addColorStop(0, 'rgba(255,255,255,.55)'); hz.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.globalAlpha = 1 - G.evFx.visibility;
    ctx.fillStyle = hz; ctx.fillRect(0, HORIZON-60, W, 280);
    ctx.globalAlpha = 1;
  }
  drawNightLights();
  /* radio-safe darkening at edges */
  if (FX.q > 0) ctx.drawImage(radialVignette(), 0, 0, W, H);
  ctx.restore();
}
function paintPreview(){
  if (!busCv) return;
  const c = busCv.getContext('2d');
  c.clearRect(0,0,440,150);
  const sky = c.createLinearGradient(0,0,0,150);
  sky.addColorStop(0,'#23242E'); sky.addColorStop(1,'#12131A');
  c.fillStyle = sky; c.fillRect(0,0,440,150);
  c.fillStyle = 'rgba(255,255,255,.06)'; c.fillRect(0,104,440,3);
  const paint = PAINTS.filter(p=>p.id===save.paint)[0] || PAINTS[0];
  drawBus({ ctx:c, x:220, y:132, s:0.60, paint:{body:paint.body,trim:paint.trim,roof:paint.roof},
    seats:0, board:cityById(save.city).vehicle, plate:(save.name||'FARE CITY').slice(0,10).toUpperCase(), smoke:false });
}
