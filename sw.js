const CACHE = 'escalade-pro-v1';
const ASSETS = [
    './',
    './index.html',
    './manifest.webmanifest',
    './icons/icon-180.png',
    './icons/icon-192.png',
    './icons/icon-512.png'
];

// Installation : préchargement de l'app shell
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE)
            .then((cache) => cache.addAll(ASSETS))
            .then(() => self.skipWaiting())
    );
});

// Activation : suppression des anciens caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
            .then(() => self.clients.claim())
    );
});

// Stratégie : cache-first avec mise à jour en arrière-plan
self.addEventListener('fetch', (event) => {
    const req = event.request;
    if (req.method !== 'GET') return;

    event.respondWith(
        caches.match(req).then((cached) => {
            const networkFetch = fetch(req)
                .then((res) => {
                    if (res && res.ok && res.type === 'basic') {
                        const copy = res.clone();
                        caches.open(CACHE).then((cache) => cache.put(req, copy)).catch(() => {});
                    }
                    return res;
                })
                .catch(() => cached);
            return cached || networkFetch;
        })
    );
});