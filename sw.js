const CACHE_NAME = 'pixora-v1';
const LOCAL_ASSETS = [
  '/Pixora/',
  '/Pixora/index.html',
  '/Pixora/icon.svg',
  '/Pixora/icon-192.png',
  '/Pixora/icon-512.png',
  '/Pixora/manifest.json',
  '/Pixora/css/themes.css',
  '/Pixora/css/style.css',
  '/Pixora/js/app.js',
  '/Pixora/js/core/canvas.js',
  '/Pixora/js/core/state.js',
  '/Pixora/js/core/history.js',
  '/Pixora/js/io/exporter.js',
  '/Pixora/js/io/importer.js',
  '/Pixora/js/tools/adjust.js',
  '/Pixora/js/tools/brighten.js',
  '/Pixora/js/tools/blur.js',
  '/Pixora/js/tools/clone.js',
  '/Pixora/js/tools/color-picker.js',
  '/Pixora/js/tools/ellipse-select.js',
  '/Pixora/js/tools/eraser.js',
  '/Pixora/js/tools/fill.js',
  '/Pixora/js/tools/heal.js',
  '/Pixora/js/tools/lasso-select.js',
  '/Pixora/js/tools/line.js',
  '/Pixora/js/tools/magic-select.js',
  '/Pixora/js/tools/pencil.js',
  '/Pixora/js/tools/selector.js',
  '/Pixora/js/tools/shape.js',
  '/Pixora/js/tools/smudge.js',
  '/Pixora/js/tools/text.js',
  '/Pixora/js/tools/transform.js',
  '/Pixora/js/ui/colorpicker.js',
  '/Pixora/js/ui/colorpicker-simple.js',
  '/Pixora/js/ui/icons.js',
  '/Pixora/js/ui/layers.js',
  '/Pixora/js/ui/menu.js',
  '/Pixora/js/ui/statusbar.js',
  '/Pixora/js/ui/toolbar.js',
  '/Pixora/js/ui/toolsettings.js'
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
