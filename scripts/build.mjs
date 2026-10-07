// Assemble le compagnon à partir de src/ et vérifie les données.
//   node scripts/build.mjs
// Produit :
//   index.html               l'application (GitHub Pages, installable sur téléphone)
//   sw.js                    le service worker qui la garde disponible hors ligne
//   artifact/compagnon.html  même page, sans squelette HTML, pour la publier sur Claude
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (f) => fs.readFileSync(path.join(root, f), "utf8");
const codexSrc = read("src/codex.js");
const appSrc = read("src/app.js");
const css = read("src/style.css");
const body = read("src/body.html").trim();

// ---------- Vérification des données ----------
const sandbox = { window: {} };
vm.runInNewContext(codexSrc, sandbox, { filename: "src/codex.js" });
const C = sandbox.window.CODEX;
new vm.Script(appSrc, { filename: "src/app.js" }); // erreur de syntaxe = échec du build

const errors = [];
const ids = new Map();
for (const e of C.entrees) {
  if (ids.has(e.id)) errors.push(`id en double : ${e.id}`);
  ids.set(e.id, e);
  for (const k of ["id", "t", "src", "nom", "role", "resume"]) if (!e[k]) errors.push(`${e.id} : champ « ${k} » manquant`);
  if (!["L", "J", "LJ"].includes(e.src)) errors.push(`${e.id} : src inconnu « ${e.src} »`);
}
for (const m of C.bestiaire) {
  if (ids.has(m.id)) errors.push(`id en double : ${m.id}`);
  ids.set(m.id, m);
  if (!C.classes[m.cl]) errors.push(`${m.id} : classe inconnue « ${m.cl} »`);
}
const nch = C.chapitres.length;
const ref = (where, id) => { if (!ids.has(id)) errors.push(`${where} : renvoi cassé vers « ${id} »`); };
const book = (where, id) => { ref(where, id); if (ids.has(id) && ids.get(id).t !== "livre") errors.push(`${where} : « ${id} » n'est pas un livre`); };
const porte = (where, p) => {
  if (!p) return;
  if (p.d && !C.dlc[p.d]) errors.push(`${where} : extension inconnue « ${p.d} »`);
  if (!p.d && !(p.c >= 0 && p.c < nch)) errors.push(`${where} : chapitre invalide ${p.c}`);
};
for (const [i, c] of C.chapitres.entries()) {
  c.lireIds.forEach((id) => book(`chapitre ${i}`, id));
  c.entrees.forEach((id) => ref(`chapitre ${i}`, id));
  (c.monstres || []).forEach((id) => ref(`chapitre ${i}`, id));
}
for (const [k, d] of Object.entries(C.dlc)) {
  d.lireIds.forEach((id) => book(`dlc ${k}`, id));
  d.entrees.forEach((id) => ref(`dlc ${k}`, id));
  (d.monstres || []).forEach((id) => ref(`dlc ${k}`, id));
}
for (const e of C.entrees) {
  (e.voir || []).forEach((id) => ref(e.id, id));
  (e.dans || []).forEach((id) => book(e.id, id));
  porte(e.id, e.porte);
  if (e.rev && !e.rl) errors.push(`${e.id} : « rev » sans « rl » (livre qui dévoile le rebondissement)`);
  if (e.rl) book(e.id, e.rl);
  for (const j of e.jeu || []) {
    if (j.d && !C.dlc[j.d]) errors.push(`${e.id} : extension inconnue « ${j.d} »`);
    if (!(j.c >= 0 && j.c < nch)) errors.push(`${e.id} : note de jeu au chapitre invalide ${j.c}`);
  }
}
for (const m of C.bestiaire) { if (m.lien) ref(m.id, m.lien); porte(m.id, m.porte); }
for (const [n, l] of [["chrono", C.chrono], ["anecdotes", C.anecdotes], ["lexique", C.lexique]])
  for (const x of l) if (x.lien) ref(n, x.lien);
for (const x of C.chrono) if (x.rev && !x.rl) errors.push(`chrono « ${x.titre} » : « rev » sans « rl »`);
const images = [];
for (const s of C.sources) {
  s.liens.forEach((id) => ref(s.id, id));
  if (!fs.existsSync(path.join(root, s.img))) errors.push(`${s.id} : image introuvable ${s.img}`);
  else images.push(s.img);
}
for (const g of C.gravures || []) {
  for (const k of ["id", "img", "titre", "artiste", "annee", "page"]) if (!g[k]) errors.push(`${g.id} : champ « ${k} » manquant`);
  g.liens.forEach((id) => ref(g.id, id));
  if (!fs.existsSync(path.join(root, g.img))) errors.push(`${g.id} : image introuvable ${g.img}`);
}
for (const id of Object.keys(C.carte.lieux)) ref("carte", id);
for (const id of C.carte.horsCarte) ref("carte hors carte", id);
for (const s of [codexSrc, appSrc]) if (/<\/script/i.test(s)) errors.push("« </script » interdit dans les scripts");
if (errors.length) {
  console.error("Données invalides :\n- " + errors.join("\n- "));
  process.exit(1);
}

// ---------- Assemblage ----------
const title = "Compagnon du Sorceleur";
const description = "Le lore des livres de Sapkowski au rythme de votre partie de The Witcher 3 : codex sans spoilers, carte, bestiaire, lignée de Ciri et défis entre amis.";
const pagesUrl = "https://aesmyrel.github.io/Witcher-lore/";
const fonts = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Alegreya+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Cinzel:wght@600;700&family=IM+Fell+English:ital@0;1&display=swap" rel="stylesheet">`;
const scripts = `<script>\n${codexSrc.trim()}\n</script>\n<script>\n${appSrc.trim()}\n</script>`;

const fragment = `<title>${title}</title>
${fonts}
<style>
${css.trim()}
</style>
${body}
${scripts}
`;

const modele = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${title}</title>
<meta name="description" content="${description}">
<meta name="theme-color" content="#2b2017" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0f0c08" media="(prefers-color-scheme: dark)">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Sorceleur">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="format-detection" content="telephone=no">
<meta name="compagnon-version" content="__VERSION__">
<meta property="og:type" content="website">
<meta property="og:locale" content="fr_FR">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:url" content="${pagesUrl}">
<meta property="og:image" content="${pagesUrl}og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="icons/icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<link rel="manifest" href="manifest.webmanifest">
${fonts}
<style>
:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}
img{max-width:100%}
${css.trim()}
</style>
</head>
<body>
${body}
${scripts}
<script>
if("serviceWorker" in navigator&&/^https?:$/.test(location.protocol))addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));
</script>
</body>
</html>
`;

// ---------- Service worker ----------
// La version change avec le contenu : les téléphones récupèrent la nouvelle version et nettoient l'ancienne.
const version = crypto.createHash("sha256").update(modele).update(images.join()).digest("hex").slice(0, 10);
// La page connaît sa version : elle ignore l'annonce d'une version qu'elle affiche déjà.
const index = modele.replace("__VERSION__", version);
const assets = ["./", "manifest.webmanifest", "icons/icon.svg", "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png", "icons/badge-96.png", ...images];
// Anecdotes sans spoiler du jeu, pour accompagner le rappel quotidien.
const anecdotes = C.anecdotes.filter((a) => !a.c && !(ids.get(a.lien) || {}).porte).map((a) => a.t);
const sw = `// Généré par scripts/build.mjs : ne pas modifier à la main.
// Le compagnon s'ouvre instantanément depuis le cache, même hors ligne, puis se met à jour en arrière-plan.
const VERSION = "compagnon-${version}";
const ASSETS = ${JSON.stringify(assets)};
const EXTERNES = ["fonts.googleapis.com", "fonts.gstatic.com", "cdnjs.cloudflare.com"];
const ANECDOTES = ${JSON.stringify(anecdotes)};

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
`;

fs.mkdirSync(path.join(root, "artifact"), { recursive: true });
fs.writeFileSync(path.join(root, "artifact/compagnon.html"), fragment);
fs.writeFileSync(path.join(root, "index.html"), index);
fs.writeFileSync(path.join(root, "sw.js"), sw);
console.log(`OK : ${C.entrees.length} fiches, ${C.bestiaire.length} créatures, ${C.lexique.length} mots, ${C.sources.length} illustrations, ${Object.keys(C.carte.lieux).length} lieux sur la carte.`);
console.log(`index.html ${(index.length / 1024).toFixed(0)} Ko, artifact/compagnon.html ${(fragment.length / 1024).toFixed(0)} Ko, version ${version}`);
