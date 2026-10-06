# FARE CITY — one bus, every city

A browser game about the informal transit hustle. You start as a Lagos danfo
driver: load passengers in the yellow box, drop them where they asked, shout
**OWA!** with the horn, dodge potholes, obey LASTMA — and horn the **agberos**
off your stop before they drink your fares. Then you earn stars, unlock Accra,
Nairobi, Cairo, Cape Town, Mumbai, Jakarta, Bangkok, London and New York — each
one a real city with its own vehicle, streets, currency, slang, radio station,
weather, traffic, **street crew, local mishaps and signature bonus**.

`index.html` is the whole game: ~220 KB, no dependencies, no build step needed
to play, works offline and installs like an app.

```
fare-city/
├── index.html            ← the game. Open it. (server/ serves this same file)
├── parts/                ← the source it was stitched from
│   ├── 00-head.html      CSS + design tokens
│   ├── 01-body.html      every screen (boot, HUD, home, map, city+codex, garage, board, account, result, settings, pause)
│   ├── 02-cities.js      the 10 city packs (pure data — the growth lever)
│   ├── 02b-street.js     the STREET pack: per-city crews, mishaps, signature bonus, native stop names, talk
│   ├── 03-i18n.js        English + Nigerian Pidgin string tables
│   ├── 04-core.js        save file, economy, star tuning, progression, share
│   ├── 04b-net.js        the NET layer: accounts, cloud save, world board, daily run
│   ├── 05-audio.js       synthesised engine, horn, SFX and a per-city radio sequencer
│   ├── 06-render.js      canvas renderer (pseudo-3D road, traffic, skyline, bridges, weather, native-script signs)
│   ├── 07-game.js        physics, passengers, crews, conditions, checkpoints, scoring
│   └── 08-ui.js          screens, input, loop, PWA install
├── build.sh              ./build.sh  →  stitches parts/ into index.html
├── server/server.js      zero-dependency Node server: the game + /api (accounts, cloud save, world board, validation)
├── server/data/db.json   where the world lives (created on first run)
├── sw.js                 service worker (offline cache)
├── manifest.webmanifest  installable app metadata
├── icon.svg              app icon
├── ADD-A-CITY.md         paste-ready template + checklist for a new city
└── world-tour.png        contact sheet: the same engine driving 10 cities
```

Rebuild after editing any part:

```bash
cd fare-city && ./build.sh          # or: bash build.sh
```

---

## How to play

| Thing | How |
|---|---|
| Steer | drag anywhere on the road, or ← → |
| First run | pick your home city — all ten are open to choose from |
| Gas / Brake | the two pedals, or ↑ ↓ |
| Horn (OWA!) | 📢 or `H` |
| Hop | ⤴ or `Space` — clears potholes, bumps and cones |
| Overtake boost | ⚡ or `Shift` |
| Pause / radio / mute | `P` · `R` · `M` |

**Auto-pedal is on by default**, so on a phone one thumb is enough: you steer,
the bus drives, and it now *creeps up to a stop sign and parks on it* so you can
horn the crew off and load everyone without fighting the throttle. It releases
the moment the stop is served. Turn it off in Settings to drive everything
yourself.

Scoring rules that matter:

* **Yellow box** = bus stop. Stop *inside* it, under 46 km/h, and passengers board.
* **Drop passengers at their stop** and they pay full fare plus a tip. Miss their
  stop and they get off at the next one anyway, pay half, and your combo resets.
* **Horn near people** (okada, boda, tuk-tuk, pedestrians, hawkers) scatters them
  and builds a combo up to **x4**. Every OWA! is credits.
* **Crews hold your stop** — and every city's crew is its own local phenomenon:
  Lagos **agberos**, Accra **trotro mates**, Nairobi **manambas** (the touts who
  hang out of the matatu door), Cairo's **sarfagi**, Cape Town's **gaartjie**,
  Mumbai's **khalasi**, Jakarta's **Pak Ogah**, Bangkok's **noodle cart**, London's
  **scaffold crew**, New York's **tour group**. While they are at a
  stop they block boarding and skim a cut of your fare every second. Horn them
  off and they scatter for good, paying you a tip and +2 combo. They take 6% of a
  fare per second while they hold you, so horn early — and if you ignore them
  completely they get bored after 12 seconds and drift off, which costs you
  everything they already took and the tip.
* **Conditions hit mid-run** every 16–30 s for ~18 s: Yorùbá **Òjò ń rọ̀** (rain),
  Lagos **fuel queue**, Accra's **trotro races**, Nairobi **graffiti pride**,
  Cairo **sandstorm**, Cape Town **load-shedding**, Mumbai **monsoon**, Jakarta
  **banjir**, Bangkok **songkran**, London **tube strike**, New York **gridlock**.
  Each changes grip, visibility, traffic, hazard mix or passenger demand, and is
  announced on the radio and in the `#cond` chip with a countdown.
* **Signature bonus per city.** Every route belongs to a city with one signature
  scoring trick — Lagos *Conductor's cut* (finish with x2+ combo), Accra *Mate's
  call* (horn 4× while loading), Bangkok *Merit* (no missed stops), New York
  *Express run* (5 overtakes)… paying 18–22% of the run. The city screen's codex
  tells you what it is before you drive.
* **Pink box** = checkpoint (LASTMA, police, wardens). Crawl through under
  90 km/h and you get waved on and paid a small courtesy bonus; blast past and
  you pay a fine.
* **Clean run** (no fines, no crashes, no missed stops) adds 15% at the end.

Each route has three star targets in **fare index** — a currency-neutral score,
which is how Lagos, London and New York end up on the same leaderboard. The
targets were recalibrated from measured play (see *Balance* below): finishing and
dropping your passengers is **1 star**, serving every stop tidily is **2 stars**,
and the third star is for working the street — horn, combos, overtakes, boost,
signature.

---

## Mobile, properly

This is a phone game first, and `qa/mobile.js` drives two emulated devices
(360×640 Android, 430×932 iPhone) with real touch events rather than mouse
clicks. **62/62 assertions pass on both.** What that suite covers, and what it
cost to get there:

* **Drag-to-steer works on touch.** This was broken and the suite is what caught
  it: the UI layer sits above the canvas, and its container ate every pointer
  event before the steering handler saw it. The container is now
  `pointer-events:none` with only the screens and `.touch` controls opting back
  in — and the suite asserts that no button anywhere is left inert by a
  transparent ancestor, so the class of bug can't come back quietly.
* **Notches and home bars.** `fit()` reads `env(safe-area-inset-*)` (via the
  `--sat/--sab/--sal/--sar` variables, which a harness can override to simulate a
  notch) and keeps the whole 540×960 stage inside the safe box. Pedals clear the
  home bar; the HUD clears the notch.
* **Thumb targets that stay thumb-sized.** The stage scales to fit any screen,
  which used to shrink the horn and pause buttons to ~27 real pixels on a small
  Android. `fit()` now publishes a `--tap` variable (44 real px ÷ stage scale) and
  buttons, icon controls, tabs and chips all respect it. The suite fails if any
  control measures under 40 px or isn't the top-most element at its own centre.
* **One-thumb play is verified, not assumed.** The suite never touches the pedals:
  it steers, taps the horn when a crew blocks the door, and plays a real 45-second
  run — stops get served and passengers get dropped. That test found the worst bug
  of this pass: the auto-pedal's stop-hold wrote to the player's `G.brake` flag and
  never cleared it, so with auto-pedal on (the default) the bus parked at the first
  stop **and stayed parked for ever**. The hold now uses its own `G.autoBrake` flag,
  re-evaluated every frame.
* **Portrait only, and it says so.** In landscape the game shows a rotate prompt
  and auto-pauses a run rather than letting you drive blind behind it. (The
  manifest already declares `"orientation": "portrait"`.)
* **Installable as a standalone app** (`display: standalone`, service worker,
  offline boot re-verified after the change). **iOS specifics** (added after
  testing the A2HS path, `qa/ios-a2hs.js`, 22 assertions): iOS ignores SVG
  touch icons, so there is now a rasterised, full-bleed 180×180
  `apple-touch-icon.png` (iOS applies its own squircle mask itself), PNG icons in
  the manifest for Android plus a maskable one, `apple-mobile-web-app-title` for
  the label under the icon, `black-translucent` status bar so the game runs
  full-bleed, and `--sat/--sab` driven by the real iPhone 15 Pro insets
  (59 px notch, 34 px home bar). The service worker precaches the icons too, so an
  installed app still opens with no signal.

---

## Any city is your city (Phase 3)

The game used to *start* in Lagos and *earn* the rest of the world. That is the
wrong first sentence for a game that claims to be for everybody: a player in
Nairobi, Mumbai or New York opened it and was told they were a guest.

Now you pick. **Every city is open from the first tap** — your home city — and the
other nine unlock on stars exactly as before. The bus, the crew, the street, the
radio and the currency are the same in all ten; what changes is whose game it is.

* **Pick your home** (one screen, all ten tiles with country, vehicle, currency
  and route count). Lagos is the default for a brand-new save, but nothing forces
  it. You can move home later from Settings → *Change home city*, and the city you
  leave gates again — no free unlocks.
* **Every run ends with a postcard from the place you drove**: the vehicle, the
  currency, the radio station, what the horn says, who holds the stop, what people
  shout when they get off (with the English), the last stop in its own script, and
  the city's signature trick. It has a stamp, and a share button. This is the piece
  that travels in a group chat — the same card in Cairo and Cape Town.
* **The daily run is a world event.** Everyone gets the same route for the day (the
  server picks it), and the board tells you how many drivers have played today.
  Best of all: **the leading line is a ghost you can race.** The server keeps the
  best daily driver's line (a distance sample every half second, validated against
  the route's length), and while you drive you see a marker on your route bar with
  the live gap — *🌍 +142m* behind, *🌍 38m up* ahead. One line per day is stored,
  not one per player, and it is dropped automatically when a better run lands.
* **Share text carries local speech.** The ticket you send says *Ẹ ṣé! (Thank
  you!)* in Lagos, *شكراً! (Thank you!)* in Cairo — so the thing you post is a
  little piece of somewhere, not a scoreboard screenshot.

Server additions: `GET /api/daily` now reports `runsToday` / `drivers`,
`GET /api/ghost?key=` returns the day's leading line, and `POST /api/score` accepts
a `trail`. A daily claim is pinned to **today's exact route** — posting a fat run
from an easier city and labelling it your daily is rejected (tested in
`qa/world-race.js`).

---

## Native script, honestly

Stop names and city names render in their own script where it matters:
**العربية** (Cairo, التح رير), **देवनागरी** (Mumbai, अंधेरी), **ไทย** (Bangkok,
จตุจักร) and **Yorùbá** with tone marks (Lagos, Ojúelégbá). The English name
stays small underneath, so nobody is lost. The street talk (horn calls, thanks,
missed-stop shouts) is localised the same way, and a **Settings → Local script**
toggle switches the whole thing back to plain English.

This is deliberately done with system fonts and no downloads: the game stays one
file and keeps working offline. On a device with no Arabic/Devanagari/Thai font
installed, the glyphs fall back to the English line underneath rather than
showing boxes.

---

## What each city carries (the scaling point)

Every city is one data block. Nothing in the engine knows the word "Lagos".

| | Lagos | Accra | Nairobi | Cairo | Cape Town | Mumbai | Jakarta | Bangkok | London | New York |
|---|---|---|---|---|---|---|---|---|---|---|
| Vehicle | Danfo | Trotro | Matatu | Microbus | Minibus taxi | BEST bus | Angkot | City bus | Routemaster | MTA bus |
| Currency | ₦ | GH₵ | KSh | E£ | R | ₹ | Rp | ฿ | £ | $ |
| Horn call | OWA! | Ta! Ta! | Beep! Beep! | Beep beep! | Tu! Tu! | Pom! Pom! | Tiiin! | Peep! Peep! | Beep! | HONK! |
| Crew | Agbero | Trotro mate | Manamba | Sarfagi | Gaartjie | Khalasi | Pak Ogah | Noodle cart | Scaffold crew | Tour group |
| Signature | Conductor's cut | Mate's call | Graffiti pride | Full house | Rank discipline | Two bells | Three in one | Merit | Congestion-free | Express run |
| Script | Yorùbá | – | – | العربية | – | देवनागरी | – | ไทย | – | – |
| Station | Wazobia FM | Joy FM | Ghetto Radio | Nile FM | Good Hope FM | Radio Mirchi | Prambors | Cool Fahrenheit | Time Out Radio | Hot 97 |
| Weather | haze | – | – | dust | – | rain | haze | rain | rain | – |

Adding an eleventh city is one data block plus one street block — see
`ADD-A-CITY.md`. The engine has no per-city branches: a city that doesn't name a
crew simply has no crew, and a city without a `stopsNative` array just shows the
English names.

---

## Updating an installed copy

A game you install to the home screen is a game you have to be able to update.
The first service worker was cache-first with no revalidation, which meant an
installed player would have kept **this** build for ever — a real bug, found by
testing the upgrade path instead of assuming it.

The worker now does the right thing per request type:

* **Navigations: network-first.** Load the page from the network so a new build
  arrives, refresh both the navigation entry *and* `./index.html` in the cache,
  then fall back to the cache when there is no signal. The offline shell can
  never lag behind the live build.
* **Everything else (icons, manifest): cache-first**, refreshed in the background.

`qa/live-update.js` proves it against the **deployed** site: it poisons the cache
with a fake old build, reloads, and asserts the new build wins *and* that the
stale entry was replaced — then cuts the network and checks the game still opens.
10/10.

## Accounts, cloud saves and the world board (what is actually real)

The game ships with a **working server**, not a stub: `server/server.js`, ~370
lines of zero-dependency Node, serving the game and the API on one port.

```bash
node server/server.js            # game + API on http://localhost:8080
PORT=9000 HOST=127.0.0.1 node server/server.js
```

| Endpoint | What it does |
|---|---|
| `GET /api/health` | `{ ok, game, cities, users, scores, serverTime }` — also how the client detects live mode |
| `GET /api/daily` | today's city + route (world-wide, same for everyone, computed server-side) |
| `POST /api/register` | `{name, pass}` → `{name, token}`; names 2–14 chars, passwords ≥6, 10/hour/IP |
| `POST /api/login` / `POST /api/logout` | token issue / revocation |
| `GET /api/me` | `{name, progress, at, scores}` — your cloud save and your runs |
| `POST /api/progress` | pushes the save file (≤256 KB) |
| `GET /api/board?city=&scope=city\|global\|daily` | the world board, career index, or today's run |
| `POST /api/score` | a finished run, **validated server-side** |

What is genuinely real here:

* **Server-side score validation.** The server ignores the stars the client
  claims and recomputes them from the fare index against the route's own
  potential, then rejects runs that fail any of: fare index above a credible
  ceiling for that route, a run time faster than the route can physically be
  driven, a distance that doesn't match the route length, passenger counts above
  capacity, or an unknown city/route. (Rejecting a doctored board entry is
  tested: `qa/api.js`.)
* **Passwords are scrypt-hashed with a per-user salt**, tokens are stored as
  SHA-256 hashes with a 30-day expiry, comparisons are `timingSafeEqual`, and the
  write path is a debounced atomic `tmp`+`rename` into `server/data/db.json`.
* **Rate limits** by IP on register/login/score, with a localhost exemption so a
  developer testing on their own machine isn't locked out (`STRICT_LIMITS=1`
  turns that off to verify the limits).
* **Cloud saves round-trip.** Sign in on a second device, pull your save down;
  the token is stripped before the save is pushed.
* **A daily run** — one route for the whole world, one attempt, ranked on its own
  board, with the pick computed identically on both sides (same FNV-1a hash of
  the UTC date, same walk through the city packs).
* **Offline is still first-class.** Signed out or server unreachable, the game
  plays exactly the same and uses the local board, labelled "this phone only".
  `netProbe()` decides live vs offline at boot; nothing blocks on the network.

What a real launch would still need (deliberately out of scope here):

* **Deployment**: TLS in front of it, a real domain, and a process manager. A
  single Node process with a JSON file is fine for the first few thousand
  players; past that, move `db` to Postgres and the token table to Redis — the
  store is isolated in one section of `server.js` on purpose.
* **Account hygiene**: email or phone verification, password reset, session list,
  device revocation, and a report/block path for names on the world board.
* **Moderation and fair play beyond statistics**: the validator catches arithmetic
  cheats, not a human with a script that plays well. A launch with prizes needs a
  replay/telemetry check.
* **Localisation plumbing**: number/date formatting per locale and RTL layout for
  an Arabic UI (the script rendering for place names ships today; an Arabic
  *interface* does not).

---

## Balance (measured, not guessed)

`qa/econ.js` drives the game the way `qa/test.js` always did — an ordinary
autopilot and a horn-mashing "expert" over all 30 routes — but one city at a time
so it fits on a small machine. It writes `qa/sim2.json`.

Current numbers on this build:

* **30/30 expert runs reach 3 stars; 0/30 ordinary runs do.** Across all 60 runs
  the split is 30 / 22 / 8 — the ordinary driver lands 1–2 stars, which is where a
  tidy driver should sit.
* The star bands are multiples of each route's fare potential
  (`STAR_TUNE = [1.6, 11, 44]` in `04-core.js`, mirrored in the server's
  validator). Calibrated against measured play: a bare run that just finishes and
  drops its passengers scores ≈1.7× potential (**1★**), a tidy run that serves
  every stop scores 5–24×, median 12× (**2★**), and a run that works the horn,
  combos, overtakes and boost scores 50×+ (**3★**). The original numbers were
  ~25× too low, which is why the first pass handed out three stars for free.
* Zero page errors across the sweep; parts cost 6k → 600k credits and are
  star-gated at 0 / 5 / 16 / 38 / 66 stars, pacing upgrades against the city
  unlock order (Accra at 3★, New York at 60★).

Also verified: 46 fps settled (p50 25 ms) at a **4× CPU throttle** with software
rendering (real GPUs are far faster), adaptive quality governor, full offline boot
after the service worker caches the game, sandboxed-iframe play (`qa/iframe.js`),
live-mode end-to-end against the real server (register → play → validated post →
world board → cloud save), and 25 API assertions in `qa/api.js`.

**Three stars now means something.** That was the biggest single change in this
pass, and it only showed up because the sim is run on every build.

---

## Why it looks like this

The reference points were `danfo.horpey.dev` (an arcade Lagos driving game) and
`lagoslife.eliysites.com` (a Lagos life-sim). This takes the arcade core that
makes those fun to pick up — one thumb, instant feedback, a reason to send a
screenshot to a friend — and puts a progression spine under it: stars, a fleet,
upgrades, cities, crews, a daily run and a world board. Nigeria first, because
the detail is the fun (you know what LASTMA is, you know why the horn matters,
you know who is holding your stop), but the engine is deliberately dumb about
geography so the same love can be pointed at Accra, Nairobi or Jakarta with a
data pack, not a rewrite.
