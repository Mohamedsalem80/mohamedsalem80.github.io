const CACHE_VERSION = 'metrom-static-v9';
const CORE_ASSETS = [
  './',
  './index.html',
  './main.html',
  './recorder.html',
  './css/leaflet.css',
  './css/metro.min.css',
  './css/metrom-ui.css',
  './js/leaflet.js',
  './js/parallax.min.js',
  './js/metrom-home.js',
  './js/metrom-i18n.js',
  './js/metro-script.js',
  './js/cairo_metro_station_points.geojson',
  './js/cairo_metro_station_bounds.geojson',
  './favicon/site.webmanifest',
  './favicon/apple-icon-180x180.png',
  './favicon/web-app-manifest-192x192.png',
  './favicon/web-app-manifest-512x512.png',
  './img/metrom-layer-1.png',
  './img/metrom-layer-2.png',
  './img/metrom-layer-3.png',
  './img/metrom-layer-4-1.png',
  './img/metrom-layer-4-2.png',
  './img/metrom-layer-5.png',
  './img/metrom-layer-6.png',
  './img/metrom-layer-7.png',
  './img/metrom-layer-8.png'
];

const STATIC_EXTENSIONS = /\.(?:css|js|json|geojson|webmanifest|png|jpg|jpeg|gif|webp|svg|ico|woff2?)$/i;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith('metrom-') && key !== CACHE_VERSION)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Let the browser honor the tile provider's HTTP cache headers; never prefetch tiles.
  if (url.origin !== self.location.origin) return;

  const isStaticAsset = STATIC_EXTENSIONS.test(url.pathname);
  const isPage = request.mode === 'navigate';

  if (!isStaticAsset && !isPage) return;

  event.respondWith(
    caches.match(request, { ignoreSearch: true }).then((cached) => {
      const networkFetch = fetch(request)
        .then((response) => {
          if (!response || response.status !== 200) return response;
          const cloned = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, cloned));
          return response;
        })
        .catch(() => cached);

      if (cached) {
        return cached;
      }

      return networkFetch;
    })
  );
});
