// FigTalent — service worker: permite instalar la app y abrirla sin conexión.
const CACHE = 'figtalent-v1';
const ARCHIVOS = [
  './', 'index.html', 'validacion.js', 'vendor/libphonenumber-max-1.11.4.js',
  'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Solo archivos propios: primero la red (para ver cambios), si no hay conexión se usa la copia guardada.
// Los envíos de formularios y consultas DNS van a otros dominios y nunca se guardan.
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then(r => { const copia = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copia)); return r; })
      .catch(() => caches.match(e.request).then(r => r || caches.match('index.html')))
  );
});
