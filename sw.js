/* Fluxo — service worker: permite abrir a app sem internet quando está instalada no telemóvel.
   Estratégia "rede primeiro": com internet recebe sempre a versão mais recente do index.html;
   sem internet usa a última cópia guardada. Os dados (localStorage) não passam por aqui. */
const CACHE = 'fluxo-v3'; // subir a versão quando mudam ficheiros (ícones, nomes, etc.) para limpar a cópia antiga
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/apple-touch-icon.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(
    fetch(req)
      .then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true })
        .then(hit => hit || (req.mode === 'navigate'
          ? caches.match('./index.html').then(page => page || caches.match('./'))
          : undefined)))
  );
});
