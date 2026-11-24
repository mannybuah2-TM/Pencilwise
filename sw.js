/* Pencilwise offline cache. Change VERSION whenever any file changes. */
const VERSION = 'pencilwise-1.5.0';
const FILES = ['./', 'index.html', 'app.css', 'js/lessons.js', 'js/bible.js', 'js/engine.js', 'js/app.js', 'js/quiz-data.js', 'js/quiz-more.js', 'js/quiz.js', 'js/live.js', 'manifest.webmanifest', 'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES.map(f => new Request(f + (f.includes('?') ? '&' : '?') + 'v=' + VERSION, { cache: 'reload' })))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const u = new URL(e.request.url);
  if (u.origin !== location.origin || u.pathname.startsWith('/live/')) return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(hit => hit || fetch(e.request).then(r => {
    if (r.ok && new URL(e.request.url).origin === location.origin) { const copy = r.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); }
    return r;
  }).catch(() => caches.match('index.html'))));
});
