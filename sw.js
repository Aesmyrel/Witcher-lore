// Généré par scripts/build.mjs : ne pas modifier à la main.
// Le compagnon s'ouvre instantanément depuis le cache, même hors ligne, puis se met à jour en arrière-plan.
const VERSION = "compagnon-ebcfdeee06";
const ASSETS = ["./","manifest.webmanifest","icons/icon.svg","icons/icon-192.png","icons/icon-512.png","icons/apple-touch-icon.png","icons/badge-96.png","img/blanche-neige.webp","img/belle-bete.webp","img/herisson.webp","img/sirene.webp","img/reine-neiges.webp","img/djinn.webp","img/baba-yaga.webp","img/leshy.webp","img/kikimora.webp","img/sirin.webp"];
const EXTERNES = ["fonts.googleapis.com", "fonts.gstatic.com", "cdnjs.cloudflare.com"];
const ANECDOTES = ["Le nom elfique de Ciri, Zireael, signifie « hirondelle », comme la potion de soin des sorceleurs.","Geralt s'est choisi lui-même le nom « de Riv », pour inspirer confiance à ses clients.","Toutes les juments de Geralt s'appellent Ablette, de livre en livre.","Triss est surnommée « la Quatorzième de la Colline » : on l'a crue morte à la bataille de Sodden.","Coën fait partie des sorceleurs qui ont entraîné Ciri à Kaer Morhen, mais on ne le croise pas dans TW3.","Zoltan Chivay vient du « Baptême du feu » : dans TW3, il est l'un des alliés les plus fidèles de Geralt.","Le journal de quêtes de TW3 est rédigé du point de vue de Jaskier.","Le nom complet d'Emhyr signifie « la Flamme Blanche qui danse sur les tumulus de ses ennemis ».","La deuxième quête de TW3, juste après le rêve de Kaer Morhen, s'intitule « Lilas et groseilles à maquereau » : c'est le parfum de Yennefer.","Sapkowski a publié la première nouvelle du Sorceleur en 1986, dans le magazine polonais Fantastyka.","Dans « Les Limites du possible », Geralt rappelle qu'il ne tue pas les dragons.","Dans les légendes du Nord, l'apparition de la Chasse sauvage annonce la guerre.","Le Hérisson d'Erlenwald, chevalier maudit du « Dernier Vœu », cache un secret que la saga ne dévoile qu'à la toute fin.","Regis distille une eau-de-vie de mandragore dont ses compagnons de route se souviennent longtemps.","« La Croisée des corbeaux » raconte les débuts de Geralt à dix-huit ans, au sortir de Kaer Morhen.","Les sorceleurs recrutaient parfois leurs apprentis grâce à la Loi de la Surprise.","Le titre polonais, « Wiedźmin », est un mot forgé par Sapkowski à partir de « wiedźma », la sorcière.","« Le Moindre Mal » détourne Blanche-Neige : Renfri, princesse chassée par sa belle-mère, a vécu un temps parmi sept gnomes.","« Un grain de vérité » revisite La Belle et la Bête, et « Une once d'abnégation » La Petite Sirène.","Gwynbleidd, le nom elfe de Geralt, signifie « Loup Blanc ».","Le gwynt, mini-jeu de cartes de TW3, a eu droit à ses propres jeux : Gwent et Thronebreaker."];

// Chaque page porte son numéro de version : le service worker ne met en cache que la sienne.
const MARQUE = 'name="compagnon-version" content="' + VERSION.slice("compagnon-".length) + '"';

self.addEventListener("install", (e) => {
  // cache: "reload" contourne le cache HTTP de GitHub Pages (max-age=600) pour bien stocker la nouvelle version.
  e.waitUntil((async () => {
    // Juste après une publication, le serveur peut encore servir l'ancienne page : l'installation échoue alors,
    // et le navigateur réessaiera à la prochaine vérification.
    const page = await fetch(new Request("./", { cache: "reload" }));
    if (!page.ok || !(await page.clone().text()).includes(MARQUE)) throw new Error("La page en ligne n'est pas encore celle de " + VERSION);
    const cache = await caches.open(VERSION);
    await cache.put("./", page);
    await cache.addAll(ASSETS.filter((u) => u !== "./").map((u) => new Request(u, { cache: "reload" })));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    // Seuls les caches du compagnon sont concernés : d'autres sites GitHub Pages partagent la même origine.
    const anciens = (await caches.keys()).filter((k) => k.startsWith("compagnon-") && k !== VERSION);
    // Les pages publiées avant le numéro de version ne cherchent pas de mise à jour d'elles-mêmes.
    // On les reconnaît au nom de leur cache : leur service worker y recopiait la page en ligne, même plus récente.
    const SANS_NUMERO = ["compagnon-da0e7b419b", "compagnon-93fdae5799", "compagnon-53112f08f2", "compagnon-9112ce6611"];
    const pagesAnciennes = anciens.some((k) => SANS_NUMERO.includes(k));
    await Promise.all(anciens.map((k) => caches.delete(k)));
    await self.clients.claim();
    if (!anciens.length) return;
    // Les pages déjà ouvertes affichent l'ancienne version : on leur annonce la nouvelle.
    // « maj » est compris par les anciennes versions de la page ; les récentes comparent le numéro de version.
    for (const c of await self.clients.matchAll({ type: "window" })) {
      c.postMessage("maj");
      c.postMessage({ maj: VERSION });
      // Une ancienne page ne se rechargerait jamais d'elle-même : on la recharge, visible ou en arrière-plan.
      if (pagesAnciennes && c.navigate) c.navigate(c.url).catch(() => {});
    }
  })());
});

// Prévient la page qui vient d'être ouverte que son contenu a changé sur le serveur.
// Elle n'existe pas toujours encore quand la réponse réseau arrive : on l'attend un peu.
// Si elle a disparu entre-temps (rechargée ou fermée), il n'y a personne à prévenir.
const prevenir = async (id) => {
  if (!id) { (await self.clients.matchAll({ type: "window" })).forEach((c) => c.postMessage({ maj: "contenu" })); return; }
  for (let i = 0; i < 40; i++) {
    const c = await self.clients.get(id);
    if (c) { c.postMessage({ maj: "contenu" }); return; }
    await new Promise((ok) => setTimeout(ok, 250));
  }
};

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    // Seule la page d'accueil est servie comme application ; les autres fichiers (images, captures) restent eux-mêmes.
    const page = req.mode === "navigate" && (url.pathname === new URL(self.registration.scope).pathname || url.pathname.endsWith("/index.html"));
    const cle = page ? new Request(self.registration.scope) : req;
    e.respondWith(caches.open(VERSION).then(async (cache) => {
      const enCache = await cache.match(cle, { ignoreSearch: true });
      // Copie faite avant que la réponse en cache ne soit lue par la page.
      const copie = page && enCache ? enCache.clone() : null;
      const reseau = fetch(page ? new Request(req.url, { cache: "no-cache" }) : req).then(async (res) => {
        if (res.ok && !page) await cache.put(cle, res.clone());
        else if (res.ok) {
          const texte = await res.clone().text();
          if (!texte.includes(MARQUE)) {
            // Une autre version est en ligne : c'est au service worker de cette version de l'installer en entier.
            self.registration.update().catch(() => {});
          } else if (!copie || (await copie.text()) !== texte) {
            // Mise en cache avant l'annonce : la page rechargée doit trouver la nouvelle version.
            await cache.put(cle, res.clone());
            if (copie) await prevenir(e.resultingClientId);
          }
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

// Rappel quotidien, déclenché par la synchronisation périodique d'Android.
self.addEventListener("periodicsync", (e) => {
  if (e.tag !== "question-du-jour") return;
  const jour = Math.floor(Date.now() / 864e5);
  e.waitUntil(self.registration.showNotification("Question du jour", {
    body: "Une nouvelle question vous attend. Le saviez-vous ? " + ANECDOTES[jour % ANECDOTES.length],
    icon: "icons/icon-192.png", badge: "icons/badge-96.png", tag: "question-du-jour", data: { url: "./#partie" },
  }));
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const cible = new URL(e.notification.data && e.notification.data.url || "./", self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((cs) => {
    const c = cs.find((x) => x.url.startsWith(self.registration.scope));
    if (c) return c.focus().then((w) => w && w.navigate ? w.navigate(cible) : w);
    return self.clients.openWindow(cible);
  }));
});
