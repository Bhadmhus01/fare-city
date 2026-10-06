/* ==========================================================================
   FARE CITY — LANGUAGE PACKS
   Add a language: copy the object, translate, add the code to LANGS.
   ========================================================================== */
const LANGS = [
  {code:'en',  label:'EN',  name:'English'},
  {code:'pcm', label:'PCM', name:'Nigerian Pidgin'}
];
const STR = {
  en:{
    tapDrive:'Tap to drive', cities:'Cities', garage:'Garage', play:'Play',
    wallet:'Wallet', stars:'Stars', streak:'{n}-day streak', rank:'Rank', fleet:'Fleet of {n}', fleet1:'One bus',
    continueDrive:'Continue driving', todaysMissions:'Today\u2019s missions',
    world:'The world', worldSub:'Start in Lagos. Earn stars, ship your bus to new cities. The map scales with you.',
    unlocked:'{n} city open', unlockedPl:'{n} cities open', routes:'Routes', streetLegend:'Street legend',
    radio:'Radio', parts:'Parts', paint:'Paint & livery', yourBus:'Your bus',
    leaderboard:'Leaderboard', thisCity:'This city', global:'Global', myRuns:'My runs',
    howTo:'How to hustle', settings:'Settings', paused:'Paused', keepDriving:'Keep driving', endRun:'End this run',
    again:'Again', home:'Home', postScore:'Post score', ticket:'Ticket',
    fare:'Fare', passengers:'Passengers', topCombo:'Top combo', owaCalls:'OWA! calls', distance:'Distance',
    fareIndex:'Fare index', route:'Route', bestHere:'Best here', runEnded:'Run ended',
    nextStop:'Next: {s}', toLoad:'{n} to load', full:'FULL', empty:'EMPTY',
    newCity:'{c} is open!', newRoute:'New route unlocked: {r}', starsEarned:'{n} stars earned',
    ownStop:'Own stop', skipStop:'Missed {s}\u2019 stop', allDropped:'All passengers dropped \u2014 perfect run bonus',
    checkpointAhead:'Checkpoint ahead \u2014 brake!', ticketIssued:'Ticket issued: {v} fine',
    wakeUp:'Wake up! You drove off the road', outOfFuel:'Out of fuel',
    bankrupt:'Too many fines \u2014 run ended', finished:'Route completed!',
    driveAgain:'Again', selectRoute:'Pick a route', buy:'Buy', owned:'Owned', level:'Level {n}',
    locked:'Locked', needs:'Needs {n} stars', startRoute:'Start route', back:'Back',
    missionDone:'{n}/3 done', daily:'Daily', storeLocal:'Saves on this phone',
    shareText:'I made {v} driving a {bus} in {city} on Fare City. Fare index {idx}.',
    tapTune:'Tap them to tune in', noAds:'No ads, no trackers, nothing sold.',
    install:'Install app', reset:'Reset progress', keepSafe:'Your fare and passengers are kept.',
    pressStart:'Press Gas to pull out of the garage', stopHere:'Stop in the yellow box',
    tagline:'One bus. Every city.<br>Load them, drop them, collect your money.'
  },
  pcm:{
    tapDrive:'Tap to drive', cities:'Cities', garage:'Garage', play:'Play',
    wallet:'Money', stars:'Stars', streak:'{n} day wey you dey play', rank:'Level', fleet:'Fleet of {n}', fleet1:'One bus',
    continueDrive:'Continue dey drive', todaysMissions:'Today work',
    world:'The whole world', worldSub:'Start for Lagos. Gather stars, carry your bus go other city. Map dey grow with you.',
    unlocked:'{n} city open', unlockedPl:'{n} cities open', routes:'Routes', streetLegend:'Wetin dey road',
    radio:'Radio', parts:'Parts', paint:'Paint', yourBus:'Your bus',
    leaderboard:'Leaderboard', thisCity:'This city', global:'Global', myRuns:'Your runs',
    howTo:'How to hustle', settings:'Settings', paused:'You pause', keepDriving:'Continue drive', endRun:'Stop this run',
    again:'Again', home:'Home', postScore:'Post score', ticket:'Ticket',
    fare:'Money', passengers:'Passengers', topCombo:'Best combo', owaCalls:'OWA! shout', distance:'Distance',
    fareIndex:'Fare index', route:'Route', bestHere:'Your best here', runEnded:'Run finish',
    nextStop:'Next: {s}', toLoad:'{n} to load', full:'FULL', empty:'EMPTY',
    newCity:'{c} don open!', newRoute:'New route open: {r}', starsEarned:'You collect {n} stars',
    ownStop:'Him stop', skipStop:'You pass {s} stop', allDropped:'Everybody land \u2014 correct run bonus',
    checkpointAhead:'Checkpoint dey front \u2014 brake!', ticketIssued:'Dem give you ticket: {v}',
    wakeUp:'You wake up! You comot road', outOfFuel:'Fuel don finish',
    bankrupt:'Fine too much \u2014 run finish', finished:'Route complete!',
    driveAgain:'Again', selectRoute:'Choose route', buy:'Buy', owned:'You get am', level:'Level {n}',
    locked:'Lock', needs:'You need {n} stars', startRoute:'Start route', back:'Back',
    missionDone:'{n}/3 done', daily:'Daily', storeLocal:'Everything dey this phone',
    shareText:'I make {v} with {bus} for {city} on Fare City. Fare index {idx}.',
    tapTune:'Tap am to tune', noAds:'No ads, no tracker, nothing sold.',
    install:'Install app', reset:'Wipe progress', keepSafe:'Your money and passengers safe.',
    pressStart:'Press Gas make we comot garage', stopHere:'Stop inside yellow box',
    tagline:'One bus. Every city.<br>Load them, drop them, collect your money. Na so we dey move.'
  }
};
let LANG = 'en';
function t(key, vars){
  const pack = STR[LANG] || STR.en;
  let s = pack[key] != null ? pack[key] : (STR.en[key] != null ? STR.en[key] : key);
  if (vars) for (const k in vars) s = s.split('{'+k+'}').join(vars[k]);
  return s;
}
