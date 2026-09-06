/* Cap 27 — service worker.
   L'app doit s'ouvrir dans le TGV, dans l'usine, dans le métro : la coque est mise en cache,
   les données sont prises sur le réseau quand il est là, et servies depuis le cache sinon. */
const CACHE = 'cap27-v1';
const COQUE = ['./index.html', './manifest.webmanifest', './icone-192.png', './icone-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(COQUE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(cles => Promise.all(cles.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const estDonnees = req.url.indexOf('cap27.json') >= 0;

  if (estDonnees) {
    // Le réseau d'abord : on veut la version fraîche. Sinon la dernière connue.
    e.respondWith(
      fetch(req).then(rep => {
        const copie = rep.clone();
        caches.open(CACHE).then(c => c.put(req, copie));
        return rep;
      }).catch(() => caches.match(req).then(r => r || Response.error()))
    );
    return;
  }
  // La coque : le cache d'abord, c'est instantané.
  e.respondWith(caches.match(req).then(r => r || fetch(req).then(rep => {
    if (rep.ok && rep.type === 'basic') {
      const copie = rep.clone();
      caches.open(CACHE).then(c => c.put(req, copie));
    }
    return rep;
  })));
});
