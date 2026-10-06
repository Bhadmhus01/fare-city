/* ==========================================================================
   FARE CITY — AUDIO
   Everything is synthesised at runtime: no audio files, no downloads.
   Each city gets its own radio station built from a groove + scale + lead.
   ========================================================================== */
const GROOVES = {
  afro:      {kick:[0,6,8,14,16,22,24,30], clap:[4,12,20,28], hat:[2,3,10,11,18,19,26,27], bass:2, lead:4, voice:'pluck'},
  highlife:  {kick:[0,8,16,24], clap:[4,12,20,28], hat:[2,6,10,14,18,22,26,30], bass:4, lead:2, voice:'guitar'},
  gengetone: {kick:[0,3,8,11,16,19,24,27], clap:[4,12,20,28], hat:[2,6,10,14,18,22,26,30], bass:2, lead:4, voice:'square'},
  mahragan:  {kick:[0,4,6,8,12,14,16,20,22,24,28,30], clap:[4,12,20,28], hat:[1,3,5,7,9,11,13,15,17,19,21,23], bass:1, lead:3, voice:'saw'},
  amapiano:  {kick:[0,8,16,24], clap:[8,24], hat:[2,6,10,14,18,22,26,30], bass:2, lead:8, voice:'log'},
  bollywood: {kick:[0,8,16,24], clap:[4,12,20,28], hat:[2,3,6,7,10,11,14,15,18,19,22,23], bass:4, lead:2, voice:'sitar'},
  dangdut:   {kick:[0,6,8,14,16,22,24,30], clap:[4,12,20,28], hat:[2,3,10,11,18,19,26,27], bass:2, lead:3, voice:'organ'},
  morlam:    {kick:[0,4,8,12,16,20,24,28], clap:[4,12,20,28], hat:[2,6,10,14,18,22,26,30], bass:2, lead:3, voice:'reed'},
  ukg:       {kick:[0,8,20,26], clap:[4,12], hat:[3,7,11,15,19,23,27,31], bass:2, lead:4, voice:'stab'},
  hiphop:    {kick:[0,6,16,22], clap:[4,12,20,28], hat:[2,6,10,14,18,22,26,30], bass:4, lead:4, voice:'horn'}
};
const VOICES = {
  pluck: {type:'triangle', cut:2600, dur:.18, att:.004},
  guitar:{type:'sawtooth', cut:2000, dur:.26, att:.006},
  square:{type:'square',   cut:1800, dur:.16, att:.004},
  saw:   {type:'sawtooth', cut:2400, dur:.20, att:.005},
  log:   {type:'triangle', cut:1200, dur:.34, att:.010},
  sitar: {type:'sawtooth', cut:3000, dur:.24, att:.003},
  organ: {type:'square',   cut:1500, dur:.30, att:.020},
  reed:  {type:'sawtooth', cut:1700, dur:.22, att:.008},
  stab:  {type:'square',   cut:2800, dur:.12, att:.002},
  horn:  {type:'sawtooth', cut:1400, dur:.30, att:.030}
};
const A = {
  ctx:null, master:null, sfx:null, mus:null, ready:false, engine:null, engineGain:null, noiseBuf:null,
  init(){
    if (this.ready) return;
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    try{ this.ctx = new AC(); }catch(e){ return; }
    this.master = this.ctx.createGain(); this.master.gain.value = 0.9; this.master.connect(this.ctx.destination);
    this.sfx = this.ctx.createGain(); this.sfx.gain.value = save.set.sfx ? save.set.sv/100 : 0; this.sfx.connect(this.master);
    this.mus = this.ctx.createGain(); this.mus.gain.value = save.set.music ? save.set.mv/100*0.5 : 0; this.mus.connect(this.master);
    const len = this.ctx.sampleRate * 2, buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate), d = buf.getChannelData(0);
    for (let i=0;i<len;i++) d[i] = Math.random()*2-1;
    this.noiseBuf = buf; this.ready = true;
  },
  resume(){ if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); },
  at(){ return this.ctx ? this.ctx.currentTime : 0; },
  vol(){
    if (!this.ready) return;
    this.sfx.gain.value = save.set.sfx ? save.set.sv/100 : 0;
    this.mus.gain.value = save.set.music ? save.set.mv/100*0.5 : 0;
  },
  tone(f, dur, type, gain, when, glide, dest){
    if (!this.ready) return;
    const t0 = when != null ? when : this.at(), o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, t0);
    if (glide) o.frequency.exponentialRampToValueAtTime(Math.max(20,glide), t0+dur);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(gain==null?0.25:gain, t0+0.006);
    g.gain.exponentialRampToValueAtTime(0.0008, t0+dur);
    o.connect(g); g.connect(dest||this.sfx); o.start(t0); o.stop(t0+dur+0.03);
  },
  noise(dur, gain, hp, lp, when, q, dest){
    if (!this.ready) return;
    const t0 = when != null ? when : this.at(), s = this.ctx.createBufferSource(), g = this.ctx.createGain();
    s.buffer = this.noiseBuf; s.playbackRate.value = 1;
    let node = s;
    if (lp){ const f = this.ctx.createBiquadFilter(); f.type='lowpass'; f.frequency.value=lp; node.connect(f); node=f; }
    if (hp){ const f = this.ctx.createBiquadFilter(); f.type='highpass'; f.frequency.value=hp; f.Q.value=q||0.8; node.connect(f); node=f; }
    g.gain.setValueAtTime(gain==null?0.2:gain, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0+dur);
    node.connect(g); g.connect(dest||this.sfx); s.start(t0, Math.random()); s.stop(t0+dur+0.02);
  },
  /* ------- one-shots ------- */
  ui(){ this.tone(660, .07, 'triangle', .16); },
  coin(){ this.tone(1180, .07, 'square', .14); this.tone(1760, .09, 'square', .1, this.at()+.06); },
  load(){ this.tone(300, .16, 'sine', .2, null, 520); },
  drop(){ this.tone(520, .2, 'sine', .18, null, 240); this.noise(.12,.12,900); },
  hop(){ this.tone(420, .16, 'triangle', .2, null, 900); },
  crash(){
    this.noise(.45,.4,180,2600); this.tone(90,.35,'sawtooth',.28,null,45);
    if (save.set.buzz && navigator.vibrate) navigator.vibrate([40,30,60]);
  },
  horn(city){
    const base = {lagos:340, accra:300, nairobi:420, cairo:380, capetown:320, mumbai:460,
      jakarta:300, bangkok:520, london:250, newyork:180}[city] || 340;
    if (navigator.vibrate && save.set.buzz) navigator.vibrate(18);
    this.tone(base, .26, 'sawtooth', .26);
    this.tone(base*1.5, .22, 'square', .16, this.at()+.02);
  },
  owa(){
    const t0=this.at();
    this.tone(560,.10,'square',.2,t0); this.tone(760,.10,'square',.2,t0+.09); this.tone(980,.22,'square',.2,t0+.18);
  },
  whistle(){ const t0=this.at(); this.tone(1750,.16,'sine',.22,t0,2300); this.tone(2100,.22,'sine',.2,t0+.18,1500); },
  siren(){ const t0=this.at(); for(let i=0;i<4;i++){ this.tone(700,.28,'triangle',.13,t0+i*.3,1250); } },
  mission(){ const t0=this.at(); [660,830,990,1320].forEach((f,i)=>this.tone(f,.2,'triangle',.17,t0+i*.1)); },
  unlock(){ const t0=this.at(); [520,660,780,1040,1310].forEach((f,i)=>this.tone(f,.4,'square',.14,t0+i*.12)); },
  fail(){ const t0=this.at(); [420,330,250,180].forEach((f,i)=>this.tone(f,.34,'sawtooth',.18,t0+i*.13)); },
  squeal(){ this.tone(1400,.32,'sawtooth',.09,null,700); this.noise(.3,.08,2200); },
  tumble(){ this.noise(.5,.3,120,1800); this.tone(150,.4,'square',.2,null,60); },
  /* ------- engine loop ------- */
  engineStart(){
    if (!this.ready || this.engine) return;
    const o = this.ctx.createOscillator(), o2 = this.ctx.createOscillator(), f = this.ctx.createBiquadFilter(), g = this.ctx.createGain();
    o.type='sawtooth'; o.frequency.value=52; o2.type='square'; o2.frequency.value=26;
    f.type='lowpass'; f.frequency.value=340; f.Q.value=3;
    g.gain.value = 0.0001;
    o.connect(f); o2.connect(f); f.connect(g); g.connect(this.sfx); o.start(); o2.start();
    this.engine={o:o,o2:o2,f:f}; this.engineGain=g;
  },
  engineSet(rev, load){
    if (!this.engine) return;
    const f = 48 + rev*130, cut = 260 + rev*900;
    this.engine.o.frequency.value = f; this.engine.o2.frequency.value = f/2;
    this.engine.f.frequency.value = cut;
    if (this.engineGain) this.engineGain.gain.value = save.set.sfx ? (0.020 + load*0.045) : 0.0001;
  },
  engineStop(){ if (this.engine){ try{ this.engine.o.stop(); this.engine.o2.stop(); }catch(e){} this.engine=null; this.engineGain=null; } }
};
/* ---------------- radio ----------------
   A tiny sequencer with lookahead so timing stays solid on phones. */
function Radio(){
  this.cfg = null; this.step = 0; this.next = 0; this.timer = null; this.seed = 1;
}
Radio.prototype.tune = function(city, keepStep){
  this.city = city; this.g = GROOVES[city.radio.style] || GROOVES.afro;
  this.cfg = city.radio; this.seed = hashStr(city.id); if (!keepStep) this.step = 0;
};
Radio.prototype.start = function(){
  if (!A.ready || this.timer) return;
  this.next = A.at() + 0.12; const self = this;
  this.timer = setInterval(function(){ self.tick(); }, 25);
};
Radio.prototype.stop = function(){ if (this.timer){ clearInterval(this.timer); this.timer = null; } };
Radio.prototype.tick = function(){
  if (!A.ready || !this.cfg) return;
  const spb = 60/this.cfg.bpm/4;
  while (this.next < A.at() + 0.22){
    this.play(this.step, this.next);
    this.step = (this.step+1) % 32; this.next += spb;
  }
};
Radio.prototype.play = function(i, when){
  const g = this.g, cfg = this.cfg, sc = cfg.scale, R = mulberry32(this.seed + Math.floor(this.step/32));
  const root = 110;
  const chordDeg = [0,0,5,3][Math.floor(i/8)%4];
  const deg = (d) => { const o = Math.floor(d/sc.length); return root * Math.pow(2, (sc[((d%sc.length)+sc.length)%sc.length] + chordDeg + o*12)/12); };
  const mus = A.mus;
  if (g.kick.indexOf(i) >= 0) A.tone(120, .20, 'sine', .5, when, 45, mus);
  if (g.clap.indexOf(i) >= 0) A.noise(.13, .30, 1500, null, when, 1.2, mus);
  if (g.hat.indexOf(i) >= 0) A.noise(.045, .10, 7600, null, when, .7, mus);
  if (i % g.bass === 0){
    const f = deg(Math.floor(i/8)%4 === 1 ? 3 : 0) / 2;
    A.tone(f, g.bass === 1 ? .16 : .26, 'triangle', .34, when, null, mus);
  }
  if (i % g.lead === 0){
    const v = VOICES[g.voice] || VOICES.pluck;
    const n = Math.floor(R()*3);
    const f = deg([0,4,7,2,9][Math.floor(R()*5)] + n);
    const o = A.ctx.createOscillator(), gg = A.ctx.createGain(), f2 = A.ctx.createBiquadFilter();
    o.type = v.type; o.frequency.value = f * 2; f2.type='lowpass'; f2.frequency.value = v.cut;
    gg.gain.setValueAtTime(0, when); gg.gain.linearRampToValueAtTime(.16, when + v.att);
    gg.gain.exponentialRampToValueAtTime(.001, when + v.dur);
    o.connect(f2); f2.connect(gg); gg.connect(mus); o.start(when); o.stop(when + v.dur + .05);
  }
  if (i === 0 || i === 16) A.noise(.5, .06, 3200, null, when, .6, mus); /* air */
};
Radio.prototype.tuneSound = function(){ A.noise(.22,.16,600,null, null, .7); A.tone(880,.3,'sine',.12,null,1500); };
const radio = new Radio();
