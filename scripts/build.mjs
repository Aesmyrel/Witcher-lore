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
const pagesUrl = "https://couefficguillaume-collab.github.io/Witcher-lore/";
const fonts = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Alegreya+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=IM+Fell+English:ital@0;1&display=swap" rel="stylesheet">`;
const scripts = `<script>\n${codexSrc.trim()}\n</script>\n<script>\n${appSrc.trim()}\n</script>`;

const fragment = `<title>${title}</title>
${fonts}
<style>
${css.trim()}
</style>
${body}
${scripts}
`;

const index = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${title}</title>
<meta name="description" content="${description}">
<meta name="theme-color" content="#e8ecea" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#141b1f" media="(prefers-color-scheme: dark)">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Sorceleur">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="format-detection" content="telephone=no">
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
const version = crypto.createHash("sha256").update(index).update(images.join()).digest("hex").slice(0, 10);
const assets = ["./", "manifest.webmanifest", "icons/icon.svg", "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png", "icons/badge-96.png", ...images];
// Anecdotes sans spoiler du jeu, pour accompagner le rappel quotidien.
const anecdotes = C.anecdotes.filter((a) => !a.c && !(ids.get(a.lien) || {}).porte).map((a) => a.t);
const sw = `// Généré par scripts/build.mjs : ne pas modifier à la main.
// Le compagnon s'ouvre instantanément depuis le cache, même hors ligne, puis se met à jour en arrière-plan.
const VERSION = "compagnon-${version}";
const ASSETS = ${JSON.stringify(assets)};
const EXTERNES = ["fonts.googleapis.com", "fonts.gstatic.com", "cdnjs.cloudflare.com"];
const ANECDOTES = ${JSON.stringify(anecdotes)};

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
