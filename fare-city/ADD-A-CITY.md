# Adding a city

One city is **one object in `parts/02-cities.js`** (geography, look, traffic,
stops) plus, optionally, **one block in `parts/02b-street.js`** (its street crew,
local mishaps, signature bonus and native stop names — see the second half of
this file). Copy the block below, change the values, run `./build.sh`, then play
it once with `qa/world.js` to check the art direction.

```js
{
  id:'manila', name:'Manila', country:'Philippines', flag:'🇵🇭',
  unlocked:false, starsReq:70, order:11,
  cur:{ sym:'₱', code:'PHP', fx:0.037, step:1 },   // local units per 1 credit
  vehicle:'Jeepney', vehicleEmoji:'🚐',
  native:{ hi:'Kumusta', lang:'Tagalog', note:'welcome' },
  blurb:'Chrome jeepneys, hand-painted and holy. Traffic in Manila is a test of faith and the horn is the prayer.',
  radio:{ name:'Wish 107.5', tag:'OPM', bpm:100, scale:[0,2,4,5,7,10], style:'opm', lead:'guitar' },
  slang:{
    horn:'Beep! Beep!',
    pick:['Sakay na, sakay na!','Quiapo, Quiapo!','Bayad po!','Siksik na, sige lang!'],
    ok:['Ang galing!','Ayos!','Sige po!'],
    miss:['Naku! Nalampasan mo!','Para! Para!','Hoy, driver!'],
    crash:['Naku po!','Ingat naman!','Aray!']
  },
  pal:{
    skyTop:'#9FD3E8', skyBot:'#EAF6FB', road:'#3C3F45', kerb:'#E2DCCE',
    ground:'#5E7A4E', ground2:'#4C653F', accent:'#C9A227',
    bldg:['#D6D0C2','#C2BCAE','#E0D8C8','#ADA79A'], water:'#3E6E86'
  },
  lanes:3, traffic:1.3, paxPerStop:2, density:1.2, scenery:'city',
  hazards:['pothole','bump','bike','ped','hawker','checkpoint','flood'],
  labels:{ pothole:'Pothole', bump:'Hump', bike:'Tricycle', ped:'Pedestrian',
           hawker:'Sorbetes vendor', checkpoint:'Traffic enforcer', flood:'Flood patch' },
  trafficColours:['#C9A227','#E8453C','#2E6BE6','#FFFFFF','#1FA85C'],
  fleetName:'Jeepney',
  stops:['Quiapo','Espana','Cubao','Ortigas'],
  stopsNative:{ 'mnl-1':['Quiapo','España','Cubao'] },   // optional, see the street block below
  routes:[
    { id:'mnl-1', name:'Quiapo → Cubao', via:'Quezon Blvd', stops:['Quiapo','Espana','Cubao'],
      localFare:13, fareMult:1.0, scenery:'city', short:'Quiapo to Cubao', dist:1550 },
    { id:'mnl-2', name:'Divisoria → Ortigas', via:'C.M. Recto', stops:['Divisoria','Sta Cruz','Cubao','Ortigas'],
      localFare:13, fareMult:1.2, scenery:'city', short:'Divisoria to Ortigas', dist:1600 },
    { id:'mnl-3', name:'Roxas Blvd → Intramuros', via:'Baywalk', stops:['Roxas Blvd','Ermita','Manila Bay','Intramuros'],
      localFare:13, fareMult:1.45, scenery:'coast', short:'Roxas to Intramuros', dist:1620 }
  ]
}
```

## Field-by-field

| Field | Notes |
|---|---|
| `id` | lowercase, no spaces. Used for saves, seeds, and the leaderboard partition. |
| `starsReq` | total stars needed to open the city. There are **90 stars in the game** (30 routes × 3). Keep the ladder: 3, 8, 14, 21, 28, 36, 44, 52, 60 for the shipped nine, so anything you add sits above 60 — and lower existing gates if you want more room. |
| `cur.fx` | **local units per 1 credit.** Rough 2026 neighbourhoods: NGN 1, GHS 0.0095, KES 0.08, EGP 0.031, ZAR 0.0118, INR 0.057, IDR 11.1, THB 0.021, GBP 0.000513, USD 0.000658. Pick fx so that `localFare / fx` lands around **130–230 credits** — that is the band the star targets and part prices were tuned for. |
| `cur.step` | 1 for whole-unit currencies, `0.01` for £/$ (controls decimals shown). |
| `radio.style` | must exist in `GROOVES` in `05-audio.js` (`afro`, `highlife`, `gengetone`, `mahragan`, `amapiano`, `bollywood`, `dangdut`, `morlam`, `ukg`, `hiphop`) or add a new groove — it is a kick/clap/hat step pattern, a scale and a lead voice. |
| `pal` | the whole art direction in nine colours. `skyTop/skyBot` gradient, `road`, `kerb`, `ground` (or `water` on bridge/coast routes), `bldg[4]` for the skyline, `accent` for signs and props. |
| `lanes` | 3 or 4. More lanes = more traffic to thread. |
| `traffic` / `density` | spawn multipliers. Nairobi 1.15, Jakarta 1.35, Mumbai 1.4 are the busy ones. |
| `paxPerStop` | 1 for most, 2 for very high-volume cities (Mumbai, London, New York). This is the main lever on how rich a city feels. |
| `hazards` | any of `pothole`, `bump`, `bike`, `ped`, `hawker`, `checkpoint`, `cow`, `cone`, `flood`. Checkpoints are scheduled automatically per route leg. |
| `labels` | the native word for each hazard plus the checkpoint authority. This is where local flavour lives — `LASTMA`, `polisi`, `NYPD`. |
| `stops` | 3–5 named stops. Each gap between stops is one leg; passengers board at one and pay at another. |
| `routes[].localFare` | what a passenger pays in the local currency. |
| `routes[].fareMult` | difficulty/reward multiplier per route (1.0 → 1.55). |
| `routes[].scenery` | `city`, `bridge` (river, parapets, suspension towers) or `coast`. |
| `routes[].dist` | world units between stops — 1500–1660 keeps a run at ~1.5–2 minutes. |

## Checklist

1. `./build.sh`
2. `node qa/world.js` (add your city to `PLAN` in that file) — screenshots to
   `qa/world/<id>.png`, confirms 0 console errors.
3. `node qa/test.js` — the autopilot drives every route; check `qa/sim.json` that
   your city's routes complete, most land on 2–3 stars, and 1 star is always
   reachable. If your city overshoots, adjust `fareMult` before touching the
   global star curve.
4. `node qa/perf.js` if you added heavy props.

## Adding the street (the Phase-2 block)

A second data block in `parts/02b-street.js` gives a city its own **crew**, its
own **mishaps**, one **signature bonus**, and **native stop names**. Key it by the
same `id` as the city pack. Nothing here is required: a city with no street block
simply has no crew, no local mishaps, and English stop names.

```js
manila: {
  crew:{ name:'Barker', role:'They wave you in, then want a cut of it.',
    count:3, toll:0.06, tip:1.1, scatter:'AYOS! Libre na!' },
  events:[
    { id:'bagyo',  label:'Bagyo',        emoji:'🌧️', dur:20, rain:1,
      line:'Rain hard. Slippery, can\'t see, new hazards.', fx:{ grip:0.72, visibility:0.62, hazards:1.5 } },
    { id:'traffic', label:'Walang galaw', emoji:'🚧', dur:18,
      line:'Gridlock. Heavy traffic, slow going.',         fx:{ traffic:1.6, slow:0.72 } },
    { id:'fiesta', label:'Fiesta',        emoji:'🎉', dur:16,
      line:'Street party. Traffic and passengers both.',   fx:{ traffic:1.35, pax:1.5 } }
  ],
  bonus:{ kind:'boardHorn', target:4, mult:0.2, name:'Barker\'s cut',
    how:'Horn 4 times while loading passengers' },
  talk:{ horn:'Beep! Beep!', thanks:'Salamat po!', miss:'Naku, nalampasan mo!' },
  native:{ script:'Baybayin', city:'Maynila' },
  stopsNative:{ mnl-1:['Quiapo','España','Cubao'] }
}
```

| Field | Notes |
|---|---|
| `crew.name` / `role` | what they are called locally and what they do, shown in the in-game codex. |
| `crew.count` | 3 for most cities. They spawn at 75% of stops (never the first) and each one you horn off for good counts down. |
| `crew.toll` | fraction of a fare per **second** while you sit in the box: 0.06 is the house value. Below 0.05 and the stop barely bites; above 0.09 it feels unfair on short routes. |
| `crew.tip` | credits paid (× the route's credits-per-passenger) when the last one scatters, plus +2 combo. 1.0–1.2. |
| `crew.scatter` | the line that floats when they clear out. |
| `events[].fx` | any of `grip` (<1 slippery), `visibility` (<1 fog/rain haze), `traffic` (>1 more traffic), `hazards` (>1 more junk on the road), `pax` (>1 more demand), `slow` (<1 caps speed). Omit what you don't want. |
| `events[].id` | must be unique in the file: it is the seed for the condition's colour and HUD chip. |
| `bonus.kind` | one of `combo`, `cleanRun`, `fullBus`, `perfectStops`, `overtake`, `boardHorn`, `paxVolume`, `noMiss` — see `sigCheck()` in `02b-street.js`. |
| `bonus.mult` | 0.18–0.22 of the run's fare index. |
| `talk.*` | the floating street lines: horn call, thanks, and missed-stop shout, in the local language. |
| `native.stopsNative` | optional per-route array of native stop names, index-matched to `stops`. The English name stays visible small underneath, and Settings → Local script turns it all off. |

Rules of thumb that came out of building the ten shipped cities:

* **The crew must be solvable with the button you already have.** They gate
  boarding and skim fares; the horn clears them. Never make a crew that needs a
  new control.
* **Conditions should change a decision, not a number.** "Rain" that only lowers
  grip is a nuisance; rain that kills visibility and spawns hazards makes you
  pick a lane and slow down. Aim for one sentence a player could repeat.
* **One signature per city, and it should rhyme with the city's identity.**
  Accra's mate works the door — so Accra's bonus is about the horn at boarding.
  Nairobi's matatus are rolling galleries — so Nairobi's bonus is a clean run.

## Checklist

1. `./build.sh`
2. `node qa/world.js` (add your city to `PLAN` in that file) — screenshots to
   `qa/world/<id>.png`, confirms 0 console errors.
3. `node qa/street.js` — checks the crew taxes, blocks boarding, scatters on the
   horn, that your conditions fire and end, and that **every city's signature
   bonus can actually be earned and paid**.
4. `node qa/econ.js` (needs `node server/server.js` running) — drives all 30
   routes with an ordinary and a horn-happy autopilot and prints the star spread.
   Your city's routes should land at 1–2 stars for the ordinary driver and 3 for
   the expert one. If your city overshoots, adjust `fareMult` before touching the
   global `STAR_TUNE` curve — and if you *do* retune the curve, mirror the numbers
   in `server/server.js`, because the world board re-scores runs server-side.
5. `node qa/perf.js` if you added heavy props.

## Other ways to extend it

* **Language:** copy one object in `STR` (`03-i18n.js`) and add the code to `LANGS`.
  Add a button in Settings next to `langEn` / `langPcm`.
* **Vehicle:** paints live in `PAINTS` (body, trim, roof, price). Upgrades live in
  `PARTS`; each level has a name and the effects are read in `07-game.js`
  (`speedMax`, `capacity`, `brakePower`, `tyreArmour`, `hornRange`, `boostLen`).
* **New mechanic:** hazards are a `t` string drawn in `drawHazard()` and resolved
  in the collision pass in `update()`. One new hazard is ~15 lines across two
  files, and it works in every city automatically.
