const CACHE_NAME = 'pixora-v1';
const LOCAL_ASSETS = [
  '/',
  '/index.html',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/manifest.json',
  '/css/themes.css',
  '/css/style.css',
  '/js/app.js',
  '/js/core/canvas.js',
  '/js/core/state.js',
  '/js/core/history.js',
  '/js/io/exporter.js',
  '/js/io/importer.js',
  '/js/tools/adjust.js',
  '/js/tools/blur.js',
  '/js/tools/clone.js',
  '/js/tools/color-picker.js',
  '/js/tools/ellipse-select.js',
  '/js/tools/eraser.js',
  '/js/tools/fill.js',
  '/js/tools/heal.js',
  '/js/tools/lasso-select.js',
  '/js/tools/line.js',
  '/js/tools/magic-select.js',
  '/js/tools/pencil.js',
  '/js/tools/selector.js',
  '/js/tools/shape.js',
  '/js/tools/smudge.js',
  '/js/tools/text.js',
  '/js/tools/transform.js',
  '/js/ui/colorpicker.js',
  '/js/ui/colorpicker-simple.js',
  '/js/ui/icons.js',
  '/js/ui/layers.js',
  '/js/ui/menu.js',
  '/js/ui/statusbar.js',
  '/js/ui/toolbar.js',
  '/js/ui/toolsettings.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(LOCAL_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.match(event.request).then(cached => {
        const fetchPromise = fetch(event.request).then(response => {
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, response.clone()));
          return response;
        });
        return cached || fetchPromise;
      })
    );
    return;
  }

  if (LOCAL_ASSETS.includes(url.pathname)) {
    event.respondWith(
      caches.match(event.request).then(cached => cached || fetch(event.request))
    );
  }
});
