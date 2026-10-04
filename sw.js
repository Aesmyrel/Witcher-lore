// Généré par scripts/build.mjs : ne pas modifier à la main.
// Le compagnon s'ouvre instantanément depuis le cache, même hors ligne, puis se met à jour en arrière-plan.
const VERSION = "compagnon-da0e7b419b";
const ASSETS = ["./","manifest.webmanifest","icons/icon.svg","icons/icon-192.png","icons/icon-512.png","icons/apple-touch-icon.png","img/blanche-neige.webp","img/belle-bete.webp","img/herisson.webp","img/sirene.webp","img/reine-neiges.webp","img/djinn.webp","img/baba-yaga.webp","img/leshy.webp","img/kikimora.webp","img/sirin.webp"];
const EXTERNES = ["fonts.googleapis.com", "fonts.gstatic.com", "cdnjs.cloudflare.com"];

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

const prevenir = () => self.clients.matchAll({ type: "window" }).then((cs) => cs.forEach((c) => c.postMessage("maj")));

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    const page = req.mode === "navigate";
    const cle = page ? new Request(self.registration.scope) : req;
    e.respondWith(caches.open(VERSION).then(async (cache) => {
      const enCache = await cache.match(cle, { ignoreSearch: true });
      const reseau = fetch(req).then(async (res) => {
        if (res.ok) {
          if (page && enCache) {
            const [avant, apres] = await Promise.all([enCache.clone().text(), res.clone().text()]);
            if (avant !== apres) prevenir();
          }
          await cache.put(cle, res.clone());
        }
        return res;
      }).catch(() => null);
      if (enCache) { e.waitUntil(reseau); return enCache; }
      return (await reseau) || (page ? cache.match(self.registration.scope) : undefined) || Response.error();
    }));
  } else if (EXTERNES.includes(url.host)) {
    e.respondWith(caches.open(VERSION).then(async (cache) => {
      const enCache = await cache.match(req);
      if (enCache) return enCache;
      const res = await fetch(req);
      if (res.ok || res.type === "opaque") cache.put(req, res.clone());
      return res;
    }));
  }
});
