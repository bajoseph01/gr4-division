const CACHE_NAME = "jogo-gr4-division-v25";
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./styles.css",
  "./board.js",
  "./DivisionVocab.html",
  "./manifest.json",
  "./icon-192x192.png",
  "./icon-512x512.png",
  "./apple-touch-icon.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS_TO_CACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(cacheNames => Promise.all(
      cacheNames
        .filter(cacheName => cacheName !== CACHE_NAME)
        .map(cacheName => caches.delete(cacheName))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request).catch(error => {
      if (event.request.mode === "navigate") return caches.match("./index.html");
      throw error;
    }))
  );
});
