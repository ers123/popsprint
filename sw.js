const CACHE_NAME = "popsprint-pals-v2";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./privacy.html",
  "./parents.html",
  "./styles.css",
  "./game.js",
  "./ads-config.js",
  "./manifest.webmanifest",
  "./public/images/icon-192.png",
  "./public/images/icon-512.png",
  "./public/images/maskable-512.png",
  "./public/images/apple-touch-icon.png",
  "./public/images/favicon-32.png",
  "./public/images/og-image-1200x630.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        return cached;
      }

      return fetch(event.request).then((networkResponse) => {
        if (networkResponse.status !== 200 || networkResponse.type !== "basic") {
          return networkResponse;
        }

        const cloned = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
        return networkResponse;
      });
    })
  );
});
