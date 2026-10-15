// Service Worker for Multitools - LottoBook
const CACHE_NAME = 'lotto-book-cache-v6';
const ASSETS = [
    './',
    './index.html',
    './css/style.css',
    './tokens.css',
    './data/glo_results.json',
    './src/storage.js',
    './src/draws.js',
    './src/scanner.js',
    './src/scan-ui.js',
    './src/sync.js',
    './src/checker.js',
    './src/stats.js',
    './src/views/myTickets.js',
    './src/views/checkResults.js',
    './src/views/historicalStats.js',
    './src/app.js',
    './src/theme.js',
    './favicon.ico',
    './favicon.svg'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS).catch(err => {
                console.warn('[SW] Cache addAll warning:', err);
            });
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    // Result sync must reach the server; HTTP cache headers on the API control freshness.
    if (new URL(event.request.url).pathname.startsWith('/api/')) {
        event.respondWith(fetch(event.request));
        return;
    }
    
    event.respondWith(
        caches.match(event.request).then((cached) => {
            const fetchPromise = fetch(event.request).then((response) => {
                if (response && response.status === 200 && response.type === 'basic') {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, clone);
                    });
                }
                return response;
            }).catch(() => cached);

            return cached || fetchPromise;
        })
    );
});
