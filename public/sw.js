const CACHE = "train-and-track-v22";
const SHELL = ["/", "/manifest.webmanifest", "/icon.svg"];

function isNextAsset(url) {
  return url.pathname.startsWith("/_next/") || url.pathname.startsWith("/__next");
}

function isAppDataRequest(url, request) {
  if (url.searchParams.has("_rsc")) return true;
  const accept = request.headers.get("accept") ?? "";
  if (accept.includes("text/x-component")) return true;
  if (request.headers.get("rsc") === "1") return true;
  if (request.headers.get("next-router-prefetch")) return true;
  if (request.headers.get("next-router-state-tree")) return true;
  if (request.headers.get("next-action")) return true;
  return false;
}

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (isNextAsset(url) || isAppDataRequest(url, event.request)) {
    event.respondWith(fetch(event.request));
    return;
  }

  const accept = event.request.headers.get("accept") ?? "";
  const isDocument = event.request.mode === "navigate" || accept.includes("text/html");

  if (isDocument) {
    event.respondWith(
      fetch(event.request)
        .then((response) => response)
        .catch(() => caches.match(event.request).then((cached) => cached ?? caches.match("/"))),
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (!response.ok || response.type === "opaque") return response;
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(event.request, copy));
        return response;
      });
    }),
  );
});
