const CACHE_NAME = 'dfb-prueba-v1';
const BASE_PATH = '/DFB-Prueba';

// Archivos que se guardarán en caché para uso offline
const urlsToCache = [
  `${BASE_PATH}/`,
  `${BASE_PATH}/index.html`,
  `${BASE_PATH}/notes.html`,
  `${BASE_PATH}/perform.html`,
  `${BASE_PATH}/settings.html`,
  `${BASE_PATH}/app.js`,
  `${BASE_PATH}/css/style.css`
];

// Instalación del Service Worker
self.addEventListener('install', event => {
  console.log('Service Worker: Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Archivos en caché');
        return cache.addAll(urlsToCache);
      })
      .catch(err => console.log('Error al cachear:', err))
  );
  self.skipWaiting();
});

// Activación del Service Worker
self.addEventListener('activate', event => {
  console.log('Service Worker: Activado');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Eliminando caché antigua');
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Interceptar peticiones de red
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Devolver del caché si existe, sino hacer fetch
        if (response) {
          return response;
        }
        return fetch(event.request).then(response => {
          // Guardar en caché las nuevas peticiones
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
          return response;
        });
      })
      .catch(() => {
        // Si falla, mostrar página offline básica
        return caches.match(`${BASE_PATH}/index.html`);
      })
  );
});
