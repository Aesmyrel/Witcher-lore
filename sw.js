// Garde le compagnon disponible hors ligne une fois visité.
// Pages du site : réseau d'abord (pour recevoir les mises à jour), cache en secours.
// Polices et bibliothèques externes : cache d'abord.
const VERSION = "compagnon-v2";
const ASSETS = ["./", "index.html", "manifest.webmanifest", "icons/icon.svg", "icons/icon-192.png", "icons/icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const put = (req, res) => {
  const copy = res.clone();
  caches.open(VERSION).then((c) => c.put(req, copy));
  return res;
};

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    e.respondWith(
      fetch(req).then((res) => put(req, res))
        .catch(() => caches.match(req).then((m) => m || caches.match("index.html")))
    );
  } else if (["fonts.googleapis.com", "fonts.gstatic.com", "cdnjs.cloudflare.com"].includes(url.host)) {
    e.respondWith(caches.match(req).then((m) => m || fetch(req).then((res) => put(req, res))));
  }
});
