/* Fare City service worker — offline-first, but the page itself is
   network-first: an installed copy must pick up a new build the next time the
   player is online, and still open with no signal after that. */
const CACHE = 'farecity-v3';
const ASSETS = ['./', './index.html', './icon.svg', './icon-192.png', './icon-512.png',
                './apple-touch-icon.png', './manifest.webmanifest'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
function isPage(req){
  return req.mode === 'navigate' || (req.headers.get('accept') || '').indexOf('text/html') >= 0;
}
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (isPage(req)){
    /* page: try the network (so a new build arrives), fall back to the cache,
       then to the cached shell — a daily player never sees a stale game twice */
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => caches.match(req).then(hit => hit || caches.match('./index.html')))
    );
    return;
  }
  /* everything else: cache first, refresh in the background */
  e.respondWith(
    caches.match(req).then(hit => {
      const net = fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
