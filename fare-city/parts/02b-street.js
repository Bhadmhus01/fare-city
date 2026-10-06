/* ==========================================================================
   FARE CITY — STREET PACK
   The layer that makes each city behave differently, not just look different.
   Three things per city, all data:
     native   — city name + stop names in the local script/orthography
     talk     — what the street actually says (board / thanks / miss / horn)
     crew     — the named people who tax, block or help you at the stops
     events   — conditions that change how the city drives for ~15s at a time
     bonus    — one signature scoring route unique to that city
   Add a city: add a key here. Nothing else in the engine changes.
   ========================================================================== */
const STREET = {
  /* ------------------------------------------------------------------ Lagos */
  lagos: {
    cityNative:'Èkó', script:'Yorùbá', scriptNote:'Yorùbá tone marks',
    stops:{ 'Ojuelegba':'Ojúelégbá','Barracks':'Bárákù','Sabo':'Sábó','Yaba':'Yàbà','Oyingbo':'Ọ̀yị̀ngbọ̀',
      'Oshodi':'Ọ̀shọ́dì','Ilupeju':'Ìlúpẹ̀jú','Town Planning':'Táùn Pláníng','Ikeja Along':'Ìkẹ́já Alọ́ng',
      'Iddo':'Ìdọ̀','Carter Bridge':'Kátà Bíríjì','CMS':'C.M.S' },
    talk:{ board:'Ẹ wọlé o!', boardEn:'Come inside!', thanks:'Ẹ ṣé!', thanksEn:'Thank you!',
      miss:'Ẹ gbà mí o!', missEn:'I have passed my stop!', horn:'OWA!' },
    crew:{ emoji:'🧑🏾‍🦱', name:'Agbero', nameLocal:'Agbero', count:3, toll:0.055,
      line:'Owo mi da?', lineEn:'Where is my money?', tip:1.6, scatter:'Agberos don run!' },
    events:[
      { id:'rain',  emoji:'🌧️', name:'Òjò ń rọ̀', nameEn:'Rain don come', dur:20,
        effects:{ grip:0.62, visibility:0.72, hazards:['flood'] } },
      { id:'fuel',  emoji:'⛽', name:'Fuel queue', nameEn:'Petrol queue spill onto the road', dur:18,
        effects:{ traffic:1.7, speed:0.86 } },
      { id:'owambe',emoji:'🎉', name:'Owambe convoy', nameEn:'A party convoy is rolling', dur:16,
        effects:{ traffic:1.3, pax:1.6 } }
    ],
    bonus:{ kind:'combo', target:2, mult:0.18, name:"Conductor's cut",
      desc:'Finish with a x2 combo or better' }
  },

  /* ------------------------------------------------------------------ Accra */
  accra: {
    cityNative:'Nkran', script:'Twi / Ga', scriptNote:'no separate script — local spelling',
    stops:{ 'Kwame Nkrumah Circle':'Nkran Kwame Nkrumah','Obetsebi':'Obetsebi','Kaneshie':'Kaneshie',
      'Odorkor':'Odorkor','Madina Market':'Madina Zongo','Atomic':'Atomic','Shiashie':'Shiashie','Legon':'Legon',
      'Osu':'Osu','Nungua':'Nungua','Kpone':'Kpone','Tema Station':'Tema Station' },
    talk:{ board:'Bra, bra!', boardEn:'Come, come!', thanks:'Medaase!', thanksEn:'Thank you!',
      miss:'Wo twam me kwan!', missEn:'You passed my stop!', horn:'Ta! Ta!' },
    crew:{ emoji:'🙋🏾‍♂️', name:'Trotro mate', nameLocal:'Mate', count:2, toll:0.04,
      line:'Mate, we dey go Circle!', lineEn:'Mate, we are going to Circle!', tip:1.5, scatter:'Mate don go!' },
    events:[
      { id:'harmattan', emoji:'🌫️', name:'Harmattan', nameEn:'Harmattan haze', dur:20,
        effects:{ visibility:0.62 } },
      { id:'circle',    emoji:'🚧', name:'Circle jam', nameEn:'Kwame Nkrumah Circle is choked', dur:18,
        effects:{ traffic:1.6, speed:0.88 } },
      { id:'funeral',   emoji:'⚫', name:'Funeral convoy', nameEn:'Slow convoy, everyone pays respect', dur:16,
        effects:{ speed:0.8, pax:1.4 } }
    ],
    bonus:{ kind:'boardHorn', target:4, mult:0.18, name:"Mate's call",
      desc:'Horn 4 times while loading passengers' }
  },

  /* ---------------------------------------------------------------- Nairobi */
  nairobi: {
    cityNative:'Nairobi', script:'Kiswahili', scriptNote:'no separate script — Swahili names',
    stops:{ 'Kencom':'Kencom','Railways':'Reli','Museum Hill':'Milima ya Makumbusho','Westlands':'Westlands',
      'Ngong Rd':'Njia ya Ngong','Junction':'Junction','Karen':'Karen','Kayole':'Kayole','Donholm':'Donholm',
      'Jogoo Rd':'Njia ya Jogoo' },
    talk:{ board:'Karibu, ingia!', boardEn:'Welcome, get in!', thanks:'Asante sana!', thanksEn:'Thank you!',
      miss:'Umenipita!', missEn:'You have passed me!', horn:'Beep! Beep!' },
    crew:{ emoji:'🧑🏿‍🦱', name:'Manamba', nameLocal:'Manamba', count:3, toll:0.05,
      line:'Twende, twende!', lineEn:'Let us move! (the matatu tout who hangs out of the door)', tip:1.6,
      scatter:'Manamba zimekimbia!' },
    events:[
      { id:'kanjo',  emoji:'🚨', name:'Kanjo raid', nameEn:'Council askaris raid the stage', dur:17,
        effects:{ checkpoint:2.2 } },
      { id:'jam',    emoji:'🚧', name:'Jogoo Road jam', nameEn:'Jogoo Road is a car park', dur:18,
        effects:{ traffic:1.7, speed:0.85 } },
      { id:'matatu', emoji:'🔊', name:'Party matatu', nameEn:'A sound-system matatu is cruising', dur:16,
        effects:{ traffic:1.25, pax:1.6 } }
    ],
    bonus:{ kind:'cleanRun', target:0, mult:0.2, name:'Graffiti pride',
      desc:'Finish a route with no crash and no fines' }
  },

  /* ------------------------------------------------------------------ Cairo */
  cairo: {
    cityNative:'القاهرة', script:'العربية', scriptNote:'Arabic script · right to left',
    stops:{ 'Tahrir':'التحرير','Abdel Moneim':'عبد المنعم','Ramses':'رمسيس','Abbasiya':'العباسية',
      'Giza':'الجيزة','Dokki':'الدقي','Zamalek':'الزمالك','Maadi':'المعادي','Heliopolis':'مصر الجديدة',
      'Roxy':'روكسي','Stadium':'الاستاد','Nasr City':'مدينة نصر' },
    talk:{ board:'يلا، يلا!', boardEn:'Hurry, hurry!', thanks:'شكراً!', thanksEn:'Thank you!',
      miss:'عدّيت الموقف!', missEn:'You passed my stop!', horn:'بييب بييب' },
    crew:{ emoji:'🧔🏻‍♂️', name:'Sarfagi', nameLocal:'صرفجي', count:3, toll:0.05,
      line:'رَمْسيس، رَمْسيس!', lineEn:'Ramses, Ramses! (the caller who works the microbus door)', tip:1.55,
      scatter:'الصرفجي جري!' },
    events:[
      { id:'khamsin', emoji:'🌪️', name:'خماسين (Khamsin)', nameEn:'Khamsin dust storm', dur:18,
        effects:{ visibility:0.5, grip:0.9 } },
      { id:'zahma',   emoji:'🚗', name:'زحمة (Zahma)', nameEn:'Rush hour crush', dur:20,
        effects:{ traffic:1.8, speed:0.84 } },
      { id:'tar',     emoji:'🕳️', name:'شارع متكسر', nameEn:'Broken tar everywhere', dur:16,
        effects:{ hazards:['pothole'] } }
    ],
    bonus:{ kind:'fullBus', target:0, mult:0.22, name:'Full house',
      desc:'Fill the microbus to the last seat' }
  },

  /* -------------------------------------------------------------- Cape Town */
  capetown: {
    cityNative:'Kaapstad / iKapa', script:'Afrikaans / isiXhosa', scriptNote:'no separate script — local spelling',
    stops:{ 'Wynberg':'Wynberg','Salt River':'Salt River','Woodstock':'Woodstock','CBD':'iKapa CBD',
      'Khayelitsha':'Khayelitsha','Harare':'Harare','Town Centre':'Town Centre','Mitchells Plain':'Mitchells Plain',
      'Sea Point':'Sea Point','Bantry Bay':'Bantry Bay','Clifton':'Clifton','Camps Bay':'Camps Bay' },
    talk:{ board:'Klim in, seun!', boardEn:'Climb in, son!', thanks:'Dankie!', thanksEn:'Thanks!',
      miss:'Eish, my stop!', missEn:'You passed my stop!', horn:'Tu! Tu!' },
    crew:{ emoji:'🧢', name:'Gaartjie', nameLocal:'Gaartjie (conductor)', count:2, toll:0.045,
      line:'Vol, vol, vol!', lineEn:'Fill up, fill up!', tip:1.7, scatter:'Sharp sharp!' },
    events:[
      { id:'easter', emoji:'🌬️', name:'South Easter', nameEn:'The wind is pushing you around', dur:18,
        effects:{ drift:1.0, grip:0.7 } },
      { id:'taxi',   emoji:'🚐', name:'Taxi rush', nameEn:'Every taxi in the city is out', dur:18,
        effects:{ traffic:1.6, pax:1.5 } },
      { id:'rain',   emoji:'🌧️', name:'Kaapse reën', nameEn:'Cape winter rain', dur:18,
        effects:{ grip:0.66, visibility:0.75, hazards:['flood'] } }
    ],
    bonus:{ kind:'perfectStops', target:3, mult:0.2, name:'Rank discipline',
      desc:'Make 3 clean stops inside the yellow box' }
  },

  /* ----------------------------------------------------------------- Mumbai */
  mumbai: {
    cityNative:'मुंबई', script:'देवनागरी', scriptNote:'Devanagari script',
    stops:{ 'Andheri':'अंधेरी','Vile Parle':'विले पार्ले','Khar':'खार','Bandra':'बांद्रा','Dadar':'दादर',
      'Parel':'परेल','Byculla':'भायखला','CST':'सीएसटी','Marine Drive':'मरीन ड्राइव','Churchgate':'चर्चगेट',
      'Regal':'रीगल','Colaba':'कुलाबा' },
    talk:{ board:'चलो, बैठो!', boardEn:'Come, sit!', thanks:'धन्यवाद!', thanksEn:'Thank you!',
      miss:'मेरा स्टॉप आ गया!', missEn:'My stop has come!', horn:'पों पों' },
    crew:{ emoji:'🧑🏽', name:'Khalasi', nameLocal:'खलासी', count:4, toll:0.04,
      line:'जगह है, आ जाओ!', lineEn:'There is room, come! (the conductor\'s mate at the door)', tip:1.5,
      scatter:'खलासी भाग गया!' },
    events:[
      { id:'monsoon', emoji:'🌧️', name:'मानसून (Monsoon)', nameEn:'Monsoon downpour — craters hidden', dur:20,
        effects:{ grip:0.6, visibility:0.6, hazards:['flood','pothole'] } },
      { id:'ganpati', emoji:'🛕', name:'गणपती (Ganpati)', nameEn:'Ganpati procession fills the road', dur:18,
        effects:{ traffic:1.5, pax:1.8, speed:0.85 } },
      { id:'peak',    emoji:'🚌', name:'ऑफिस टाइम', nameEn:'Office peak — everyone wants your bus', dur:16,
        effects:{ pax:2.0 } }
    ],
    bonus:{ kind:'perfectStops', target:3, mult:0.2, name:'Two bells',
      desc:'3 clean stops — the way a conductor rings twice' }
  },

  /* ---------------------------------------------------------------- Jakarta */
  jakarta: {
    cityNative:'Jakarta', script:'Bahasa Indonesia', scriptNote:'no separate script — local spelling',
    stops:{ 'Blok M':'Blok M','Senayan':'Senayan','Karet':'Karet','Sudirman':'Sudirman','Tanah Abang':'Tanah Abang',
      'Thamrin':'Thamrin','Monas':'Monas','Kota':'Kota','Ancol':'Ancol','Penjaringan':'Penjaringan',
      'Kapuk':'Kapuk','Pantai Indah':'Pantai Indah' },
    talk:{ board:'Naik, naik!', boardEn:'Get in, get in!', thanks:'Terima kasih!', thanksEn:'Thank you!',
      miss:'Kelewatan, pak!', missEn:'You passed it, boss!', horn:'Tiiin!' },
    crew:{ emoji:'🧑🏻‍✈️', name:'Pak Ogah', nameLocal:'Pak Ogah', count:3, toll:0.05,
      line:'Hati-hati, pak!', lineEn:'Careful, boss!', tip:1.6, scatter:'Pak Ogah minggir!' },
    events:[
      { id:'banjir', emoji:'🌊', name:'Banjir', nameEn:'Flood came in overnight', dur:19,
        effects:{ hazards:['flood'], grip:0.72, speed:0.9 } },
      { id:'ojol',   emoji:'🛵', name:'Ojol surge', nameEn:'Ojek online swarm', dur:17,
        effects:{ traffic:1.7 } },
      { id:'pulang', emoji:'🌆', name:'Jam pulang', nameEn:'Going-home crush', dur:18,
        effects:{ pax:2.0, traffic:1.3 } }
    ],
    bonus:{ kind:'fullBus', target:0, mult:0.22, name:'Three in one',
      desc:'Fill the angkot completely' }
  },

  /* ---------------------------------------------------------------- Bangkok */
  bangkok: {
    cityNative:'กรุงเทพฯ', script:'ไทย', scriptNote:'Thai script',
    stops:{ 'Chatuchak':'จตุจักร','Saphan Khwai':'สะพานควาย','Ari':'อารีย์','Siam':'สยาม',
      'Khaosan':'เขาซาน','Phra Athit':'พระอาทิตย์','Hua Lamphong':'หัวลำโพง','Silom':'สีลม',
      'Asok':'อโศก','Phrom Phong':'พร้อมพงษ์','On Nut':'อ่อนนุช','Bang Na':'บางนา' },
    talk:{ board:'ขึ้นมาเลย!', boardEn:'Get on up!', thanks:'ขอบคุณครับ!', thanksEn:'Thank you!',
      miss:'เลยป้ายแล้ว!', missEn:'You passed the stop!', horn:'ปี๊น ปี๊น' },
    crew:{ emoji:'🧑🏽‍🍳', name:'Noodle cart', nameLocal:'รถก๋วยเตี๋ยว', count:3, toll:0.045,
      line:'ก๋วยเตี๋ยว ก๋วยเตี๋ยว!', lineEn:'Noodles, noodles!', tip:1.5, scatter:'รถเข็นหลบแล้ว!' },
    events:[
      { id:'songkran', emoji:'💦', name:'สงกรานต์ (Songkran)', nameEn:'Water everywhere — the road is wet', dur:20,
        effects:{ grip:0.6, hazards:['flood'] } },
      { id:'peak',     emoji:'🌆', name:'ชั่วโมงเร่งด่วน', nameEn:'Peak hour', dur:18,
        effects:{ traffic:1.7, pax:1.6 } },
      { id:'rain',     emoji:'🌧️', name:'ฝนตก', nameEn:'Rain season downpour', dur:18,
        effects:{ grip:0.68, visibility:0.7, hazards:['flood'] } }
    ],
    bonus:{ kind:'noMiss', target:0, mult:0.2, name:'Merit · ไม่ทิ้งใคร',
      desc:'Finish without leaving a single passenger behind' }
  },

  /* ----------------------------------------------------------------- London */
  london: {
    cityNative:'London', script:'English', scriptNote:'no separate script',
    stops:{ 'Peckham':'Peckham','Camberwell':'Camberwell','Elephant':'Elephant & Castle','Oxford Circus':'Oxford Circus',
      'Brixton':'Brixton','Stockwell':'Stockwell','Vauxhall':'Vauxhall','Victoria':'Victoria',
      'Canary Wharf':'Canary Wharf','Tower Hill':'Tower Hill','Embankment':'Embankment','Westminster':'Westminster' },
    talk:{ board:'Mind the doors!', boardEn:'Mind the doors!', thanks:'Cheers, love!', thanksEn:'Thanks!',
      miss:'Oi! That was my stop!', missEn:'You missed my stop!', horn:'Beep!' },
    crew:{ emoji:'👷🏻', name:'Scaffold crew', nameLocal:'Roadworks crew', count:3, toll:0.04,
      line:'Sorry mate, two minutes', lineEn:'Sorry mate, two minutes', tip:1.4,
      scatter:'Kettles down, they moved!' },
    events:[
      { id:'tube',  emoji:'🚇', name:'Tube strike', nameEn:'The Tube is down — the whole city is on buses', dur:20,
        effects:{ pax:2.2 } },
      { id:'works', emoji:'🚧', name:'Roadworks', nameEn:'Cones everywhere', dur:18,
        effects:{ hazards:['cone'], speed:0.9 } },
      { id:'drizzle', emoji:'🌦️', name:'Drizzle', nameEn:'Light rain, slick tarmac', dur:18,
        effects:{ grip:0.72, visibility:0.85 } }
    ],
    bonus:{ kind:'cleanRun', target:0, mult:0.2, name:'Congestion-free',
      desc:'Finish with no fines and no crashes' }
  },

  /* --------------------------------------------------------------- New York */
  newyork: {
    cityNative:'New York', script:'English', scriptNote:'no separate script',
    stops:{ 'Harlem':'Harlem','Columbia':'Columbia','Columbus Circle':'Columbus Circle','Times Sq':'Times Sq',
      'Queens Plaza':'Queens Plaza','Bridge Plaza':'Bridge Plaza','Lexington':'Lexington','Midtown':'Midtown',
      'Cadman Plaza':'Cadman Plaza','Brooklyn Br':'Brooklyn Br','City Hall':'City Hall','Foley Sq':'Foley Sq' },
    talk:{ board:'Step in, doors closing!', boardEn:'Step in, doors closing!', thanks:'You good, driver!',
      thanksEn:'Nice driving!', miss:'Yo! My stop!', missEn:'You blew past my stop!', horn:'HONK!' },
    crew:{ emoji:'🧑🏿‍🎤', name:'Tour group', nameLocal:'Tour group', count:4, toll:0.045,
      line:'Wait, we want photos!', lineEn:'Wait, we want photos!', tip:1.6, scatter:'They moved on!' },
    events:[
      { id:'rush',   emoji:'🏙️', name:'Rush hour', nameEn:'Rush hour — pack them in', dur:20,
        effects:{ pax:2.2, traffic:1.35 } },
      { id:'alt',    emoji:'🚧', name:'Alternate side', nameEn:'Alternate-side parking sweep', dur:17,
        effects:{ hazards:['cone'], speed:0.88 } },
      { id:'hydrant',emoji:'🚒', name:'Hydrant break', nameEn:'A hydrant is open — river on 5th', dur:16,
        effects:{ grip:0.68, hazards:['flood'] } }
    ],
    bonus:{ kind:'overtake', target:5, mult:0.2, name:'Express run',
      desc:'Overtake 5 vehicles on one run' }
  }
};
/* graft the street pack onto the city packs the engine already knows */
CITY_PACKS.forEach(function(c){
  const s = STREET[c.id]; if (!s) return;
  c.street = s; c.cityNative = s.cityNative; c.nativeStops = s.stops;
  c.script = s.script; c.scriptNote = s.scriptNote;
  /* native name for every stop on every route */
  c.routes.forEach(function(r){
    r.stopsNative = r.stops.map(function(n){ return s.stops[n] || n; });
  });
});
/* what each signature bonus actually checks, in one place */
function sigCheck(kind, target){
  switch (kind){
    case 'combo':        return (G.topCombo || 1) >= target;
    case 'cleanRun':     return G.crashes === 0 && G.fines === 0;
    case 'fullBus':      return (G.maxPax || 0) >= capacity() - 1;
    case 'perfectStops': return (G.perfectStops || 0) >= target;
    case 'overtake':     return (G.overtakes || 0) >= target;
    case 'boardHorn':    return (G.boardHorn || 0) >= target;
    case 'paxVolume':    return (G.paxDropped || 0) >= target;
    case 'noMiss':       return (G.missed || 0) === 0;
  }
  return false;
}
function sigProgress(kind, target){
  const v = { combo:G.topCombo||1, cleanRun:(G.crashes===0&&G.fines===0)?1:0, fullBus:G.maxPax||0,
    perfectStops:G.perfectStops||0, overtake:G.overtakes||0, boardHorn:G.boardHorn||0,
    paxVolume:G.paxDropped||0, noMiss:(G.missed||0)===0?1:0 }[kind];
  if (kind === 'cleanRun' || kind === 'noMiss') return v ? 1 : 0;
  if (kind === 'fullBus') return capacity() - 1;
  return target;
}
