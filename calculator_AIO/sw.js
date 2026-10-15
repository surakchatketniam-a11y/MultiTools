const CACHE_NAME = 'multitools-calculator-v11';
const STATIC_ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './src/catalog.js',
    './src/core/formatters.js',
    './src/core/dates.js',
    './src/core/rates.js',
    './src/core/export.js',
    './src/core/history.js',
    './src/core/compare.js',
    './src/core/lotto.js',
    './src/ui/theme.js',
    './src/ui/drawer.js',
    './src/ui/keypad.js',
    './src/tools/shop.js',
    './src/tools/biz.js',
    './src/tools/finance.js',
    './src/tools/work.js',
    './src/tools/special.js',
    './src/tools/lotto.js',
    './src/ui/actions.js',
    './src/ui/modals.js'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        }).catch((err) => {
            console.warn('Pre-caching assets failed:', err);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    // Navigation requests (HTML page): Network-first with cache fallback
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    if (response && response.status === 200) {
                        const copy = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
                    }
                    return response;
                })
                .catch(() => caches.match('./index.html') || caches.match(event.request))
        );
        return;
    }

    // Static assets (CSS, Fonts, Scripts, Images): Stale-while-revalidate / Cache-first
    event.respondWith(
        caches.match(event.request).then((cached) => {
            if (cached) {
                // Background update
                fetch(event.request).then((response) => {
                    if (response && (response.status === 200 || response.type === 'opaque')) {
                        const copy = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
                    }
                }).catch(() => {});
                return cached;
            }

            return fetch(event.request).then((response) => {
                if (response && (response.status === 200 || response.type === 'opaque')) {
                    const copy = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
                }
                return response;
            }).catch(() => {
                // Fallback gracefully when completely offline
            });
        })
    );
});
