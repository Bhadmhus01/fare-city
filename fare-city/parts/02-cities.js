/* ==========================================================================
   FARE CITY — CITY PACKS
   Every city below is pure data. The engine above it knows nothing about
   Lagos or London. To add a city: copy a block, change the numbers.
   fx  = local currency units per 1 credit (credit is the game's base unit).
   fx rates are rough 2026 neighbourhoods, tuned for arcade play not trading.
   ========================================================================== */
const CITY_PACKS = [
  {
    id:'lagos', name:'Lagos', country:'Nigeria', flag:'🇳🇬', unlocked:true, order:1,
    cur:{sym:'₦', code:'NGN', fx:1, step:1},
    native:{ hi:'Ẹ káàbọ̀', lang:'Yoruba', note:'welcome'},
    vehicle:'Danfo', vehicleEmoji:'🚌', blurb:'Yellow danfo, red roads, one conductor shouting your stop. Traffic is a lifestyle — but the conductor never lets the bus run empty.',
    radio:{name:'Wazobia FM', tag:'Afrobeats & gist', bpm:104, scale:[0,2,3,5,7,10], style:'afro', lead:'pluck'},
    slang:{horn:'OWA!', pick:['Enter with your change!','Sit well, we dey go!','One chance? Not today.','Conductor, collect!'],
           ok:['Sharp sharp.','Na you biko.','Correct!'], miss:['Ah! You pass my stop!','Conductor, I no reach o!','Oga, respect yourself!'],
           crash:['Wetin dey do you?!','You no see road?','Ah! My bumper!']},
    pal:{skyTop:'#F6C978', skyBot:'#FFE9B8', road:'#3A3A44', kerb:'#E9E2D0', ground:'#7C6E57',
         ground2:'#6A5D49', accent:'#FFD23D', bldg:['#C9B79A','#D8C4A4','#B8A488','#CFC0A8'], water:'#5C7A6A'},
    lanes:3, traffic:1.05, paxPerStop:1, density:1, scenery:'city',
    hazards:['pothole','bump','bike','ped','hawker','checkpoint'],
    labels:{bike:'Okada', ped:'Pedestrian', hawker:'Pure water hawker', checkpoint:'LASTMA', pothole:'Pothole', bump:'Speed bump'},
    trafficColours:['#F2A900','#E8453C','#2E6BE6','#FFFFFF','#1FA85C','#8E44AD'],
    fleetName:'Danfo', stops:['Ojuelegba','Barracks','Sabo','Yaba','Oyingbo'],
    routes:[
      { id:'lag-1', name:'Ojuelegba → Yaba', via:'Herbert Macaulay Way', stops:['Ojuelegba','Barracks','Sabo','Yaba'],
        localFare:150, fareMult:1.0, scenery:'city', short:'Ojuelegba to Yaba', dist:1500 },
      { id:'lag-2', name:'Oshodi → Ikeja Along', via:'Agege Motor Rd', stops:['Oshodi','Ilupeju','Town Planning','Ikeja Along'],
        localFare:150, fareMult:1.15, scenery:'city', short:'Oshodi to Ikeja', dist:1550 },
      { id:'lag-3', name:'Yaba → CMS', via:'Carter Bridge', stops:['Yaba','Oyingbo','Iddo','Carter Bridge','CMS'],
        localFare:150, fareMult:1.45, scenery:'bridge', short:'Yaba to Lagos Island', dist:1620 }
    ]
  },
  {
    id:'accra', name:'Accra', country:'Ghana', flag:'🇬🇭', unlocked:false, starsReq:3, order:2,
    cur:{sym:'GH₵ ', code:'GHS', fx:0.0095, step:1},
    native:{ hi:'Akwaaba', lang:'Twi', note:'welcome'},
    vehicle:'Trotro', vehicleEmoji:'🚐', blurb:'Trotro mates hang out the door calling destinations. Slower city, sweeter highlife, and the Circle is always jammed.',
    radio:{name:'Joy FM', tag:'Highlife & azonto', bpm:92, scale:[0,2,4,5,7,9], style:'highlife', lead:'guitar'},
    slang:{horn:'Ta! Ta!', pick:['Mate, I dey go Circle!','Come, come, we dey go!','Change dey?','Sit, we move.'],
           ok:['Chaley, you try!','Eii, correct!','Sharp!'], miss:['Eii! You pass my stop!','Mate, stop the car!','My money!'],
           crash:['Chaley!','You dey sleep?','Wetin happen?!']},
    pal:{skyTop:'#8EC9EE', skyBot:'#E6F6FF', road:'#3E3E46', kerb:'#EFEADF', ground:'#5E8040',
         ground2:'#4E6C36', accent:'#1B8A5A', bldg:['#E5D6BE','#CBB79A','#D9C4A0','#BFA98C'], water:'#3E7C93'},
    lanes:3, traffic:0.95, paxPerStop:1, density:0.95, scenery:'city',
    hazards:['pothole','bump','bike','ped','hawker','checkpoint'],
    labels:{bike:'Okada', ped:'Pedestrian', hawker:'Plantain seller', checkpoint:'Police barrier', pothole:'Pothole', bump:'Speed bump'},
    trafficColours:['#1B8A5A','#E8C13C','#C0392B','#FFFFFF','#2C6FA8'],
    fleetName:'Trotro', stops:['Kwame Nkrumah Circle','Obetsebi','Kaneshie','Odorkor'],
    routes:[
      { id:'acc-1', name:'Circle → Kaneshie', via:'Winneba Rd', stops:['Kwame Nkrumah Circle','Obetsebi','Kaneshie'],
        localFare:3, fareMult:1.0, scenery:'city', short:'Circle to Kaneshie', dist:1550 },
      { id:'acc-2', name:'Madina → Legon', via:'Atomic Junction', stops:['Madina Market','Atomic','Shiashie','Legon'],
        localFare:3, fareMult:1.15, scenery:'city', short:'Madina to Legon', dist:1600 },
      { id:'acc-3', name:'Osu → Tema', via:'Beach Rd', stops:['Osu','Nungua','Kpone','Tema Station'],
        localFare:3, fareMult:1.4, scenery:'coast', short:'Osu to Tema', dist:1650 }
    ]
  },
  {
    id:'nairobi', name:'Nairobi', country:'Kenya', flag:'🇰🇪', unlocked:false, starsReq:8, order:3,
    cur:{sym:'KSh ', code:'KES', fx:0.08, step:1},
    native:{ hi:'Karibu', lang:'Swahili', note:'welcome'},
    vehicle:'Matatu', vehicleEmoji:'🚐', blurb:'Graffiti matatus with screens and subwoofers. The Green City in the Sun moves fast and complains loudly.',
    radio:{name:'Ghetto Radio', tag:'Gengetone', bpm:100, scale:[0,3,5,7,10], style:'gengetone', lead:'square'},
    slang:{horn:'Beep! Beep!', pick:['Sasa! Ingia haraka!','CBD, CBD!','Ni fifty bob!','Twende!'],
           ok:['Poa sana!','Sawa sawa!','Freshi!'], miss:['Eeh! Umenipita!','Shukisha hapa!','Aii, my stop!'],
           crash:['Wewe! Unaona?','Pole pole!','Aii bana!']},
    pal:{skyTop:'#BEE3FF', skyBot:'#EDF8FF', road:'#3C3C44', kerb:'#E8E4DA', ground:'#6B7F4A',
         ground2:'#59693C', accent:'#0B5D3B', bldg:['#D3D8E0','#BEC6CF','#E2D9C6','#A9B2BB'], water:'#4A7B8C'},
    lanes:4, traffic:1.15, paxPerStop:1, density:1.05, scenery:'city',
    hazards:['pothole','bump','bike','ped','hawker','checkpoint'],
    labels:{bike:'Boda boda', ped:'Pedestrian', hawker:'Maize vendor', checkpoint:'Traffic police', pothole:'Pothole', bump:'Hump'},
    trafficColours:['#1F8A4C','#E03A3E','#F4C63D','#FFFFFF','#2A2F3A'],
    fleetName:'Matatu', stops:['Kencom','Museum Hill','Westlands','Parklands'],
    routes:[
      { id:'nbo-1', name:'CBD → Westlands', via:'Uhuru Highway', stops:['Kencom','Railways','Museum Hill','Westlands'],
        localFare:30, fareMult:1.0, scenery:'city', short:'CBD to Westlands', dist:1550 },
      { id:'nbo-2', name:'Ngong Rd → Karen', via:'Ngong Road', stops:['Kencom','Ngong Rd','Junction','Karen'],
        localFare:30, fareMult:1.2, scenery:'city', short:'Ngong Road to Karen', dist:1620 },
      { id:'nbo-3', name:'Eastlands → CBD', via:'Jogoo Rd', stops:['Kayole','Donholm','Jogoo Rd','Kencom'],
        localFare:30, fareMult:1.35, scenery:'city', short:'Eastlands to town', dist:1650 }
    ]
  },
  {
    id:'cairo', name:'Cairo', country:'Egypt', flag:'🇪🇬', unlocked:false, starsReq:14, order:4,
    cur:{sym:'E£', code:'EGP', fx:0.031, step:1},
    native:{ hi:'Ahlan wa sahlan', lang:'Arabic', note:'welcome'} ,
    vehicle:'Microbus', vehicleEmoji:'🚐', blurb:'White microbus, seven seats, driver keeps the door open and the hand out. Horn first, brake later.',
    radio:{name:'Nile FM', tag:'Mahraganat', bpm:110, scale:[0,1,4,5,7,8], style:'mahragan', lead:'saw'},
    slang:{horn:'Beep beep!', pick:['Yalla, yalla!','Come in, same price!','Ramses, Ramses!','Sit, we go now.'],
           ok:['Ayez keda!','Tayeb!','Helw!'], miss:['Ya salamo! You passed!','Stop here, ya basha!','Ya nhar!'],
           crash:['Ya satir!','Inta magnoon?','Khalas!']},
    pal:{skyTop:'#F2C77E', skyBot:'#FBE9C9', road:'#4A4742', kerb:'#E4D9BE', ground:'#D6B479',
         ground2:'#C3A166', accent:'#C8A24A', bldg:['#D9C39A','#C9AF85','#E3D2AE','#B79D74'], water:'#4E7F92'},
    lanes:4, traffic:1.25, paxPerStop:1, density:1.1, scenery:'city',
    hazards:['pothole','bump','bike','ped','hawker','checkpoint'],
    labels:{bike:'Motorbike', ped:'Crossing family', hawker:'Tea seller', checkpoint:'Police post', pothole:'Broken tar', bump:'Hump'},
    trafficColours:['#FFFFFF','#D9D9DE','#1B6CA8','#C9A227','#7A2E2E'],
    fleetName:'Microbus', stops:['Tahrir','Ramses','Abbasiya','Nasr City'],
    routes:[
      { id:'cai-1', name:'Tahrir → Ramses', via:'Corniche El Nil', stops:['Tahrir','Abdel Moneim','Ramses','Abbasiya'],
        localFare:8, fareMult:1.0, scenery:'city', short:'Tahrir to Ramses', dist:1550 },
      { id:'cai-2', name:'Giza → Maadi', via:'Nile Corniche', stops:['Giza','Dokki','Zamalek','Maadi'],
        localFare:8, fareMult:1.25, scenery:'bridge', short:'Giza to Maadi', dist:1620 },
      { id:'cai-3', name:'Heliopolis → Nasr City', via:'El Nasr Rd', stops:['Heliopolis','Roxy','Stadium','Nasr City'],
        localFare:8, fareMult:1.3, scenery:'city', short:'Heliopolis to Nasr City', dist:1600 }
    ]
  },
  {
    id:'capetown', name:'Cape Town', country:'South Africa', flag:'🇿🇦', unlocked:false, starsReq:21, order:5,
    cur:{sym:'R', code:'ZAR', fx:0.0118, step:1},
    native:{ hi:'Welkom', lang:'Afrikaans', note:'welcome'},
    vehicle:'Minibus Taxi', vehicleEmoji:'🚐', blurb:'Fourteen seats, fifteen people, mountain on the horizon. The taxi rank is a whole economy of its own.',
    radio:{name:'Good Hope FM', tag:'Amapiano', bpm:112, scale:[0,2,3,5,7,9], style:'amapiano', lead:'log'},
    slang:{horn:'Tu! Tu!', pick:['Hurry, hurry, seun!','CBD! CBD!','Climb in, R18!','Sharp sharp.'],
           ok:['Lekker!','Eish, nice one!','Sharp!'], miss:['Eish, you passed my stop!','Stop here, driver!','Haibo!'],
           crash:['Haibo!','Voetsek, driver!','Yoh!']},
    pal:{skyTop:'#8FD0F0', skyBot:'#E9F6FF', road:'#3E4046', kerb:'#E2DED2', ground:'#4E7A4A',
         ground2:'#3F6540', accent:'#1F6FB2', bldg:['#E6E2D8','#CFCBC0','#DBD3C3','#B9B4A8'], water:'#2E6B8A'},
    lanes:3, traffic:0.95, paxPerStop:1, density:0.95, scenery:'coast',
    hazards:['pothole','bump','bike','ped','hawker','checkpoint'],
    labels:{bike:'Delivery bike', ped:'Pedestrian', hawker:'Fruit hawker', checkpoint:'Metro police', pothole:'Pothole', bump:'Speed bump'},
    trafficColours:['#FFFFFF','#2E6BE6','#C0392B','#1FA85C','#D9D9DE'],
    fleetName:'Minibus', stops:['Wynberg','Salt River','CBD','Woodstock'],
    routes:[
      { id:'cpt-1', name:'Wynberg → CBD', via:'Main Rd', stops:['Wynberg','Salt River','Woodstock','CBD'],
        localFare:18, fareMult:1.0, scenery:'city', short:'Wynberg to town', dist:1550 },
      { id:'cpt-2', name:'Khayelitsha → Mitchells Plain', via:'Spine Rd', stops:['Khayelitsha','Harare','Town Centre','Mitchells Plain'],
        localFare:18, fareMult:1.2, scenery:'city', short:'Khayelitsha to MP', dist:1620 },
      { id:'cpt-3', name:'Sea Point → Camps Bay', via:'Victoria Rd', stops:['Sea Point','Bantry Bay','Clifton','Camps Bay'],
        localFare:18, fareMult:1.5, scenery:'coast', short:'Sea Point to Camps Bay', dist:1650 }
    ]
  },
  {
    id:'mumbai', name:'Mumbai', country:'India', flag:'🇮🇳', unlocked:false, starsReq:28, order:6,
    cur:{sym:'₹', code:'INR', fx:0.057, step:1},
    native:{ hi:'नमस्ते', lang:'Hindi / Marathi', note:'namaste'},
    vehicle:'BEST Bus', vehicleEmoji:'🚌', blurb:'Red double-decker under monsoon clouds. Density beyond anything in Africa — but the volume makes the meter sing.',
    radio:{name:'Radio Mirchi', tag:'Bollywood', bpm:120, scale:[0,2,4,5,7,10], style:'bollywood', lead:'sitar'},
    slang:{horn:'Pom! Pom!', pick:['Chalo, chalo!','Andheri, Andheri!','Baitho, jaldi!','Ek rupaya change?'],
           ok:['Bahut accha!','Shabaash!','Perfect!'], miss:['Arre! Stop karo!','Mera stop aa gaya!','Ae! Mera stop!'],
           crash:['Arre baba!','Kya kar rahe ho?','Uff!']},
    pal:{skyTop:'#C6C9CE', skyBot:'#EFF1F4', road:'#42444A', kerb:'#DCDCD4', ground:'#6E6A5E',
         ground2:'#5E5B51', accent:'#E8592F', bldg:['#CBC3B4','#B8B2A6','#D6CFC0','#A79F92'], water:'#54636E'},
    lanes:4, traffic:1.4, paxPerStop:2, density:1.25, scenery:'city',
    hazards:['pothole','bump','bike','ped','hawker','checkpoint','cow'],
    labels:{bike:'Auto rickshaw', ped:'Crossing crowd', hawker:'Chai wallah', checkpoint:'Traffic constable', pothole:'Monsoon crater', bump:'Breaker', cow:'Sacred cow'},
    trafficColours:['#F2C230','#1B8A3A','#E8592F','#FFFFFF','#2A5E9E'],
    fleetName:'BEST', stops:['Andheri','Bandra','Dadar','CST'],
    routes:[
      { id:'bom-1', name:'Andheri → Bandra', via:'SV Rd', stops:['Andheri','Vile Parle','Khar','Bandra'],
        localFare:12, fareMult:1.0, scenery:'city', short:'Andheri to Bandra', dist:1550 },
      { id:'bom-2', name:'Dadar → CST', via:'Dr Ambedkar Rd', stops:['Dadar','Parel','Byculla','CST'],
        localFare:12, fareMult:1.2, scenery:'city', short:'Dadar to CST', dist:1600 },
      { id:'bom-3', name:'Marine Drive → Colaba', via:'Queens Necklace', stops:['Marine Drive','Churchgate','Regal','Colaba'],
        localFare:12, fareMult:1.5, scenery:'coast', short:'Marine Drive to Colaba', dist:1620 }
    ]
  },
  {
    id:'jakarta', name:'Jakarta', country:'Indonesia', flag:'🇮🇩', unlocked:false, starsReq:36, order:7,
    cur:{sym:'Rp', code:'IDR', fx:11.1, step:100},
    native:{ hi:'Selamat datang', lang:'Indonesian', note:'welcome'},
    vehicle:'Angkot', vehicleEmoji:'🚐', blurb:'Orange angkot, ojol swarm, three-in-one rules. Passengers pile in — get them all moving and the volume pays.',
    radio:{name:'Prambors', tag:'Dangdut koplo', bpm:118, scale:[0,2,3,7,9], style:'dangdut', lead:'organ'},
    slang:{horn:'Tiiin!', pick:['Naik, naik!','Blok M! Blok M!','Cepat, pak!','Tiga ribu saja!'],
           ok:['Bagus!','Mantap!','Sip!'], miss:['Aduh, kelewatan!','Stop di sini, pak!','Pak! Pak!'],
           crash:['Aduh!','Hati-hati dong!','Ya ampun!']},
    pal:{skyTop:'#BFD9E8', skyBot:'#F1F7FB', road:'#3F4248', kerb:'#DFDCD2', ground:'#4F6B4A',
         ground2:'#3F573D', accent:'#C0392B', bldg:['#CFD3D8','#BFC4CB','#DED8CC','#AEB4BB'], water:'#4C7285'},
    lanes:4, traffic:1.35, paxPerStop:2, density:1.3, scenery:'city',
    hazards:['pothole','bump','bike','ped','hawker','checkpoint','flood'],
    labels:{bike:'Ojol rider', ped:'Pedestrian', hawker:'Bakso seller', checkpoint:'Polisi', pothole:'Pothole', bump:'Polisi tidur', flood:'Flood patch'},
    trafficColours:['#C0392B','#2E6BE6','#1FA85C','#FFFFFF','#E8A33D'],
    fleetName:'Angkot', stops:['Blok M','Sudirman','Tanah Abang','Kota'],
    routes:[
      { id:'jkt-1', name:'Blok M → Sudirman', via:'Jl. Sudirman', stops:['Blok M','Senayan','Karet','Sudirman'],
        localFare:5000, fareMult:1.0, scenery:'city', short:'Blok M to Sudirman', dist:1550 },
      { id:'jkt-2', name:'Tanah Abang → Kota', via:'Jl. Thamrin', stops:['Tanah Abang','Thamrin','Monas','Kota'],
        localFare:5000, fareMult:1.2, scenery:'city', short:'Tanah Abang to Kota', dist:1600 },
      { id:'jkt-3', name:'Ancol → Pantai Indah', via:'Coastal Rd', stops:['Ancol','Penjaringan','Kapuk','Pantai Indah'],
        localFare:5000, fareMult:1.4, scenery:'coast', short:'Ancol to PIK', dist:1630 }
    ]
  },
  {
    id:'bangkok', name:'Bangkok', country:'Thailand', flag:'🇹🇭', unlocked:false, starsReq:44, order:8,
    cur:{sym:'฿', code:'THB', fx:0.021, step:1},
    native:{ hi:'ยินดีต้อนรับ', lang:'Thai', note:'welcome'},
    vehicle:'City Bus', vehicleEmoji:'🚌', blurb:'Pink bus, monk in saffron, tuk-tuk in your blind spot. Wet season means shiny roads and short tempers.',
    radio:{name:'Cool Fahrenheit', tag:'Mor lam', bpm:124, scale:[0,2,4,7,9], style:'morlam', lead:'reed'},
    slang:{horn:'Peep! Peep!', pick:['Pai, pai!','Welcome, welcome!','Siam, Siam!','Fifteen baht!'],
           ok:['Dee mak!','Khop khun!','Suay!'], miss:['Oiii! You passed!','Lot tee nee!','Aow laew!'],
           crash:['Oiii!','Mai dee!','Jai yen yen!']},
    pal:{skyTop:'#F7C3A0', skyBot:'#FFE7CE', road:'#3D4046', kerb:'#E3DCD0', ground:'#5E6B4A',
         ground2:'#4C5A3C', accent:'#D4457B', bldg:['#DAD3C6','#C6BFB2','#E4DCCD','#B2AA9E'], water:'#4B6E7E'},
    lanes:4, traffic:1.3, paxPerStop:1, density:1.15, scenery:'city',
    hazards:['pothole','bump','bike','ped','hawker','checkpoint','flood'],
    labels:{bike:'Tuk-tuk', ped:'Pedestrian', hawker:'Noodle cart', checkpoint:'Tourist police', pothole:'Pothole', bump:'Speed bump', flood:'Wet patch'},
    trafficColours:['#D4457B','#F2C230','#1FA85C','#FFFFFF','#E8592F'],
    fleetName:'City Bus', stops:['Chatuchak','Siam','Silom','Asok'],
    routes:[
      { id:'bkk-1', name:'Chatuchak → Siam', via:'Phahonyothin', stops:['Chatuchak','Saphan Khwai','Ari','Siam'],
        localFare:15, fareMult:1.0, scenery:'city', short:'Chatuchak to Siam', dist:1550 },
      { id:'bkk-2', name:'Khaosan → Silom', via:'Ratchadamnoen', stops:['Khaosan','Phra Athit','Hua Lamphong','Silom'],
        localFare:15, fareMult:1.2, scenery:'city', short:'Khaosan to Silom', dist:1600 },
      { id:'bkk-3', name:'Asok → Bang Na', via:'Sukhumvit', stops:['Asok','Phrom Phong','On Nut','Bang Na'],
        localFare:15, fareMult:1.4, scenery:'city', short:'Asok to Bang Na', dist:1630 }
    ]
  },
  {
    id:'london', name:'London', country:'United Kingdom', flag:'🇬🇧', unlocked:false, starsReq:52, order:9,
    cur:{sym:'£', code:'GBP', fx:0.000513, step:0.01},
    native:{ hi:'Mind the gap', lang:'London', note:'standing order'},
    vehicle:'Routemaster', vehicleEmoji:'🚌', blurb:'Red double-decker, drizzle on the glass, a queue that forms itself. Buses run on time here — imagine that.',
    radio:{name:'Time Out Radio', tag:'UK garage & drill', bpm:134, scale:[0,2,3,5,7,10], style:'ukg', lead:'stab'},
    slang:{horn:'Beep!', pick:['Mind the doors, please!','Oxford Circus, love.','Tap in, tap out.','Plenty of room upstairs.'],
           ok:['Cheers, mate!','Lovely stuff.','Bang on.'], miss:['Oi! You missed my stop!','Driver! Driver!','Oh, brilliant.'],
           crash:['Oi! Watch it!','Are you alright?!','Bloomin heck.']},
    pal:{skyTop:'#9AA7B4', skyBot:'#DCE3EA', road:'#3E4047', kerb:'#D8D8D2', ground:'#5B6B52',
         ground2:'#4A5742', accent:'#C8102E', bldg:['#C9C2B4','#B5AEA1','#D4CDBF','#A69F93'], water:'#43535F'},
    lanes:4, traffic:0.9, paxPerStop:2, density:1.0, scenery:'city',
    hazards:['pothole','bump','bike','ped','checkpoint','cone'],
    labels:{bike:'Delivery cyclist', ped:'Pedestrian', checkpoint:'Congestion charge camera', pothole:'Pothole', bump:'Hump', cone:'Roadworks cone'},
    trafficColours:['#C8102E','#1D1D1D','#3A6EA5','#FFFFFF','#8A8F98'],
    fleetName:'Routemaster', stops:['Peckham','Elephant & Castle','Oxford Circus','Victoria'],
    routes:[
      { id:'lon-1', name:'Peckham → Oxford Circus', via:'Walworth Rd', stops:['Peckham','Camberwell','Elephant','Oxford Circus'],
        localFare:3.2, fareMult:1.0, scenery:'city', short:'Peckham to Oxford Circus', dist:1550 },
      { id:'lon-2', name:'Brixton → Victoria', via:'Vauxhall Bridge Rd', stops:['Brixton','Stockwell','Vauxhall','Victoria'],
        localFare:3.2, fareMult:1.2, scenery:'city', short:'Brixton to Victoria', dist:1600 },
      { id:'lon-3', name:'Canary Wharf → Westminster', via:'Westminster Bridge', stops:['Canary Wharf','Tower Hill','Embankment','Westminster'],
        localFare:3.2, fareMult:1.5, scenery:'bridge', short:'Canary Wharf to Westminster', dist:1650 }
    ]
  },
  {
    id:'newyork', name:'New York', country:'United States', flag:'🇺🇸', unlocked:false, starsReq:60, order:10,
    cur:{sym:'$', code:'USD', fx:0.000658, step:0.01},
    native:{ hi:'Step in, doors closing', lang:'New York', note:'the only order'},
    vehicle:'MTA Bus', vehicleEmoji:'🚌', blurb:'The M10 grinding up Broadway. Gridlock, hydrants, squealing brakes — and the best fare box in the world.',
    radio:{name:'Hot 97', tag:'Hip hop', bpm:96, scale:[0,3,5,6,7,10], style:'hiphop', lead:'horn'},
    slang:{horn:'HONK!', pick:['M10, cmon, move it!','Plenty of seats in the back!','Times Square, Times Square!','Step in, doors closing.'],
           ok:['Yo, that was clean!','Nice one!','Facts.'], miss:['Yo! My stop!','Hey, back door!','Cmon driver!'],
           crash:['AY! Watch the bus!','You good?!','Yo!']},
    pal:{skyTop:'#A7C3E0', skyBot:'#E8F1F8', road:'#3B3D42', kerb:'#CFCFC9', ground:'#6F7276',
         ground2:'#5C6065', accent:'#F2B705', bldg:['#B9B7B2','#A6A4A0','#C7C5C0','#96948F'], water:'#43606F'},
    lanes:4, traffic:1.1, paxPerStop:2, density:1.15, scenery:'city',
    hazards:['pothole','bump','bike','ped','checkpoint','cone'],
    labels:{bike:'Citi Bike rider', ped:'Pedestrian', checkpoint:'NYPD', pothole:'Pothole', bump:'Hump', cone:'Roadworks cone'},
    trafficColours:['#F2B705','#1D1D1D','#2E6BE6','#FFFFFF','#B03A3A'],
    fleetName:'MTA Bus', stops:['Harlem','Columbus Circle','Times Square','Midtown'],
    routes:[
      { id:'nyc-1', name:'Harlem → Times Sq', via:'Broadway', stops:['Harlem','Columbia','Columbus Circle','Times Sq'],
        localFare:3.2, fareMult:1.05, scenery:'city', short:'Harlem to Times Square', dist:1550 },
      { id:'nyc-2', name:'Queens Plaza → Midtown', via:'Queensboro Bridge', stops:['Queens Plaza','Bridge Plaza','Lexington','Midtown'],
        localFare:3.2, fareMult:1.3, scenery:'bridge', short:'Queens to Midtown', dist:1620 },
      { id:'nyc-3', name:'Brooklyn Bridge → City Hall', via:'Brooklyn Bridge', stops:['Cadman Plaza','Brooklyn Br','City Hall','Foley Sq'],
        localFare:3.2, fareMult:1.55, scenery:'bridge', short:'Brooklyn to City Hall', dist:1660 }
    ]
  }
];

/* ---------- progression ----------
   Stars are attached to routes: 3 per route. Cities unlock on stars earned. */
const STAR_GATE = CITY_PACKS.map(c => ({id:c.id, name:c.name, req:c.starsReq||0}));
const MAX_STARS = CITY_PACKS.reduce((n,c)=>n + c.routes.length*3, 0);
const RANKS = [
  {at:0,    name:'Learner'},
  {at:4,    name:'Conductor'},
  {at:12,   name:'Danfo Driver'},
  {at:24,   name:'Fleet Man'},
  {at:40,   name:'Route Master'},
  {at:60,   name:'Transport Oga'},
  {at:84,   name:'City Baron'},
  {at:110,  name:'Global Operator'},
  {at:MAX_STARS, name:'Fare City Legend'}
];
const PAINTS = [
  {id:'danfo',  name:'Danfo Yellow', body:'#FFD23D', trim:'#14141A', roof:'#F2A900', price:0,     note:'Classic Lagos'},
  {id:'tokunbo',name:'Tokunbo Fresh',body:'#3B82F6', trim:'#0B2545', roof:'#93C5FD', price:6000,  note:'Imported, clean'},
  {id:'keke',   name:'Keke Green',   body:'#16A34A', trim:'#052E16', roof:'#86EFAC', price:9000,  note:'Fast, loud'},
  {id:'asphalt',name:'Asphalt Ghost',body:'#2B2F36', trim:'#E8453C', roof:'#4B5563', price:22000, note:'Midnight runner'},
  {id:'royal',  name:'Royal Fleet',  body:'#7C3AED', trim:'#F5D0FE', roof:'#A78BFA', price:45000, note:'Lagos Island energy'},
  {id:'chrome', name:'Showroom Chrome',body:'#E5E7EB',trim:'#0EA5E9', roof:'#FFFFFF', price:90000, note:'Wedding hire rate'},
  {id:'brt',    name:'BRT Lagos Blue',body:'#0E7490', trim:'#F2A900', roof:'#22D3EE', price:140000,note:'Government contract'},
  {id:'gold',   name:'Owambe Gold',  body:'#F59E0B', trim:'#7C2D12', roof:'#FCD34D', price:320000,note:'Aso ebi on wheels'}
];
const PARTS = [
  {id:'engine', name:'Engine',    icon:'🌀', stat:'Accel & top speed',   unit:'km/h'
    ,levels:['Tokunbo block','Overhauled','Turbo fitted','Race swap','Unbreakable']},
  {id:'brakes', name:'Brakes',    icon:'🛑', stat:'Stopping power',      unit:'m'
    ,levels:['Worn pads','New pads','Vented discs','ABS fitted','Rally spec']},
  {id:'tyres',  name:'Tyres',     icon:'🛞', stat:'Grip, less pothole hurt', unit:'dmg'
    ,levels:['Tokunbo tyres','Bald but free','Plus size','Run-flat','Bulletproof']},
  {id:'horn',   name:'Horn',      icon:'📢', stat:'OWA! range & combo',  unit:'pts'
    ,levels:['Baby honk','Danfo tone','Air horn','Train horn','One-chance special']},
  {id:'seats',  name:'Seats',     icon:'🪑', stat:'Extra passengers',    unit:'seats'
    ,levels:['14 seats','16 seats','18 seats','20 seats','Standing room 24']},
  {id:'tank',   name:'Fuel tank', icon:'⛽', stat:'Nitro boost length',  unit:'s'
    ,levels:['Small tank','Regular tank','Long range','Cargo tank','Infinite reserve']}
];
