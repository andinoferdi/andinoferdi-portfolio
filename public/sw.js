const STATIC_CACHE = 'portfolio-static-v1';
const DYNAMIC_CACHE = 'portfolio-dynamic-v1';

const STATIC_ASSETS = [
  '/',
  '/projects',
  '/about',
  '/images/Logo.png',
  '/images/projects/FreshKo.webp',
  '/images/projects/portfolio-v2.webp',
  '/images/projects/anro.webp',
  '/images/self/1.webp',
  '/images/self/2.webp',
  '/images/self/3.webp',
  '/images/self/4.webp'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => {
      return cache.addAll(STATIC_ASSETS).catch(error => {
        console.warn('Failed to cache some assets:', error);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE)
          .map(cacheName => caches.delete(cacheName))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;

  if (url.pathname.startsWith('/images/')) {
    event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
    return;
  }

  if (url.pathname === '/' || url.pathname === '/projects' || url.pathname === '/about') {
    event.respondWith(networkFirstStrategy(request, DYNAMIC_CACHE));
    return;
  }

  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
    return;
  }

  event.respondWith(
    caches.match(request).then(response => {
      return response || fetch(request);
    })
  );
});

const cacheFirstStrategy = async (request, cacheName) => {
  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    if (networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.warn('Cache first strategy failed:', error);
    const cache = await caches.open(cacheName);
    return await cache.match(request);
  }
};

const networkFirstStrategy = async (request, cacheName) => {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.warn('Network first strategy failed:', error);
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    return cachedResponse || new Response('Network error occurred', {
      status: 408,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
};
