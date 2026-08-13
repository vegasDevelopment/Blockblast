const CACHE_NAME = 'blockblast-game';
const ASSETS = [
  '/',
  '/index.html',
  'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@400;500;700&display=swap'
];

// Install: cache assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate: clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch: network first, fallback to cache
self.addEventListener('fetch', e => {
  // Skip non-GET requests
  if (e.request.method !== 'GET') return;

  // HTML dosyaları için network-first stratejisi
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(response => {
          // Başarılı yanıtı cache'e ekle
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
          return response;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Diğer dosyalar için cache-first stratejisi
  e.respondWith(
    caches.match(e.request)
      .then(cached => {
        if (cached) return cached;
        
        return fetch(e.request)
          .then(response => {
            // Sadece başarılı yanıtları cache'e ekle
            if (response && response.status === 200) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
            }
            return response;
          })
          .catch(() => {
            // CSS/JS dosyaları için boş yanıt
            if (e.request.url.includes('.css')) {
              return new Response('', { status: 200, statusText: 'OK' });
            }
            if (e.request.url.includes('.js')) {
              return new Response('', { status: 200, statusText: 'OK' });
            }
            return new Response('Offline', { status: 503 });
          });
      })
  );
});
