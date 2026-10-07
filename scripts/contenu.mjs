// Applique des lots de contenu (JSON) aux données du codex, les vérifie et, sur demande, réécrit src/codex.js.
//   node scripts/contenu.mjs lot1.json [lot2.json …]            vérifie seulement
//   node scripts/contenu.mjs --ecrire lot1.json [lot2.json …]   vérifie puis réécrit src/codex.js
//
// Format d'un lot :
// {
//   "maj":       [{ "id": "geralt", "champs": { "livres": "…", "jeu": [{ "c": 0, "t": "…" }] } }],   // fiches ou créatures existantes
//   "nouvelles": [{ "id": "…", "t": "perso", "src": "L", "nom": "…", "role": "…", "resume": "…", … }], // nouvelles fiches
//   "nouveaux":  [{ "id": "m-…", "nom": "…", "cl": "Nécrophages", "conseil": "…", … }],               // nouvelles créatures
//   "rattacher": { "chapitres": { "2": { "entrees": ["id"], "monstres": ["m-…"] } }, "dlc": { "bw": { "monstres": ["m-…"] } } }
// }
// Dans « champs », une valeur null supprime le champ ; un tableau remplace entièrement l'ancien.
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fichier = process.env.CODEX ? path.resolve(process.env.CODEX) : path.join(root, "src/codex.js");
const args = process.argv.slice(2);
const ecrire = args.includes("--ecrire");
const lots = args.filter((a) => !a.startsWith("--")).map((f) => ({ f, d: JSON.parse(fs.readFileSync(f, "utf8")) }));
if (!lots.length) { console.error("Usage : node scripts/contenu.mjs [--ecrire] lot.json …"); process.exit(2); }

let src = fs.readFileSync(fichier, "utf8");
const charger = (s) => { const sb = { window: {} }; vm.runInNewContext(s, sb, { filename: "codex.js" }); return sb.window.CODEX; };
const C = charger(src);
const errors = [];
const parId = new Map([...C.entrees, ...C.bestiaire].map((x) => [x.id, x]));
const modifies = new Set();

// ---------- Application en mémoire ----------
for (const { f, d } of lots) {
  for (const { id, champs } of d.maj || []) {
    const x = parId.get(id);
    if (!x) { errors.push(`${f} : maj d'un id inconnu « ${id} »`); continue; }
    for (const [k, v] of Object.entries(champs || {})) { if (k === "id") continue; if (v === null) delete x[k]; else x[k] = v; }
    modifies.add(id);
  }
  for (const e of d.nouvelles || []) {
    if (parId.has(e.id)) { errors.push(`${f} : nouvelle fiche avec un id déjà pris « ${e.id} »`); continue; }
    C.entrees.push(e); parId.set(e.id, e); modifies.add(e.id);
  }
  for (const m of d.nouveaux || []) {
    if (parId.has(m.id)) { errors.push(`${f} : nouvelle créature avec un id déjà pris « ${m.id} »`); continue; }
    if (!/^m-[a-z0-9-]+$/.test(m.id || "")) errors.push(`${f} : id de créature invalide « ${m.id} » (m-…)`);
    C.bestiaire.push(m); parId.set(m.id, m); modifies.add(m.id);
  }
  const r = d.rattacher || {};
  for (const [i, v] of Object.entries(r.chapitres || {})) {
    const c = C.chapitres[+i]; if (!c) { errors.push(`${f} : chapitre inconnu ${i}`); continue; }
    for (const k of ["entrees", "monstres"]) for (const id of v[k] || []) { c[k] = c[k] || []; if (!c[k].includes(id)) c[k].push(id); }
  }
  for (const [k0, v] of Object.entries(r.dlc || {})) {
    const c = C.dlc[k0]; if (!c) { errors.push(`${f} : extension inconnue ${k0}`); continue; }
    for (const k of ["entrees", "monstres"]) for (const id of v[k] || []) { c[k] = c[k] || []; if (!c[k].includes(id)) c[k].push(id); }
  }
}

// ---------- Vérifications (mêmes règles que scripts/build.mjs, plus quelques garde-fous) ----------
const ids = new Map();
const nch = C.chapitres.length;
const TYPES = ["perso", "lieu", "faction", "concept", "livre"];
const texte = (where, k, v, max) => {
  if (typeof v !== "string" || !v.trim()) { errors.push(`${where} : « ${k} » doit être un texte non vide`); return; }
  if (v.length > max) errors.push(`${where} : « ${k} » trop long (${v.length} > ${max} caractères)`);
  if (/<\/?[a-z]/i.test(v)) errors.push(`${where} : « ${k} » contient du HTML`);
  if (/\s[,.]/.test(v) || / {2}/.test(v)) errors.push(`${where} : « ${k} » : espace avant une virgule ou un point, ou espace double`);
};
for (const e of C.entrees) {
  if (ids.has(e.id)) errors.push(`id en double : ${e.id}`);
  ids.set(e.id, e);
  for (const k of ["id", "t", "src", "nom", "role", "resume"]) if (!e[k]) errors.push(`${e.id} : champ « ${k} » manquant`);
  if (!["L", "J", "LJ"].includes(e.src)) errors.push(`${e.id} : src inconnu « ${e.src} »`);
  if (!TYPES.includes(e.t)) errors.push(`${e.id} : type inconnu « ${e.t} »`);
}
for (const m of C.bestiaire) {
  if (ids.has(m.id)) errors.push(`id en double : ${m.id}`);
  ids.set(m.id, m);
  if (!C.classes[m.cl]) errors.push(`${m.id} : classe inconnue « ${m.cl} »`);
  for (const k of ["nom", "conseil"]) if (!m[k]) errors.push(`${m.id} : champ « ${k} » manquant`);
}
const ref = (where, id) => { if (!ids.has(id)) errors.push(`${where} : renvoi cassé vers « ${id} »`); };
const book = (where, id) => { ref(where, id); if (ids.has(id) && ids.get(id).t !== "livre") errors.push(`${where} : « ${id} » n'est pas un livre`); };
const porte = (where, p) => {
  if (!p) return;
  if (p.d && !C.dlc[p.d]) errors.push(`${where} : extension inconnue « ${p.d} »`);
  if (!p.d && !(p.c >= 0 && p.c < nch)) errors.push(`${where} : chapitre invalide ${p.c}`);
};
for (const [i, c] of C.chapitres.entries()) { c.entrees.forEach((id) => ref(`chapitre ${i}`, id)); (c.monstres || []).forEach((id) => ref(`chapitre ${i}`, id)); }
for (const [k, d] of Object.entries(C.dlc)) { d.entrees.forEach((id) => ref(`dlc ${k}`, id)); (d.monstres || []).forEach((id) => ref(`dlc ${k}`, id)); }
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
  if (!modifies.has(e.id)) continue;
  texte(e.id, "role", e.role, 80); texte(e.id, "resume", e.resume, 360);
  if (e.livres !== undefined) texte(e.id, "livres", e.livres, 1100);
  if (e.rev !== undefined) texte(e.id, "rev", e.rev, 800);
  for (const j of e.jeu || []) texte(e.id, "jeu.t", j.t, 360);
  if (e.alias && !Array.isArray(e.alias)) errors.push(`${e.id} : « alias » doit être une liste`);
  if (e.src === "J" && e.livres) errors.push(`${e.id} : fiche du jeu seul (src J) avec un texte « livres »`);
  if (e.src === "L" && (e.jeu || []).length) errors.push(`${e.id} : fiche des livres seuls (src L) avec des notes de jeu : passer en src LJ ?`);
}
for (const m of C.bestiaire) {
  if (m.lien) ref(m.id, m.lien);
  porte(m.id, m.porte);
  if (!modifies.has(m.id)) continue;
  texte(m.id, "conseil", m.conseil, 420);
  for (const k of ["origine", "livres"]) if (m[k] !== undefined) texte(m.id, k, m[k], 700);
  for (const k of ["signes", "bombes", "potions", "autres"]) if (m[k] !== undefined && !(Array.isArray(m[k]) && m[k].every((s) => typeof s === "string" && s))) errors.push(`${m.id} : « ${k} » doit être une liste de noms`);
  for (const s of m.signes || []) if (!["Aard", "Igni", "Yrden", "Quen", "Axii"].includes(s)) errors.push(`${m.id} : signe inconnu « ${s} »`);
}
if (errors.length) { console.error("Lot invalide :\n- " + errors.join("\n- ")); process.exit(1); }
console.log(`Lot valide : ${modifies.size} fiches ou créatures touchées.`);
if (!ecrire) process.exit(0);

// ---------- Réécriture de src/codex.js, dans le style du fichier ----------
const q = (v) => JSON.stringify(v);
const val = (v) => Array.isArray(v) ? (v.length && typeof v[0] === "object" ? "[" + v.map(obj).join(", ") + "]" : "[" + v.map(q).join(", ") + "]") : v && typeof v === "object" ? obj(v) : q(v);
const obj = (o) => "{ " + Object.entries(o).map(([k, v]) => `${k}: ${val(v)}`).join(", ") + " }";
const jeuVal = (l, ind) => l.length > 1 ? "[\n" + l.map((j) => ind + "  " + obj(j)).join(",\n") + "]" : val(l);
function fiche(e) {
  const tete = ["id", "t", "src", "nom", "alias", "porte", "ordre"].filter((k) => e[k] !== undefined);
  const corps = Object.keys(e).filter((k) => !tete.includes(k));
  const ordre = ["genre", "vo", "annee", "role", "resume", "livres", "nouvelles", "rl", "rev", "jeu", "dans", "voir"];
  corps.sort((a, b) => (ordre.indexOf(a) + 1 || 99) - (ordre.indexOf(b) + 1 || 99));
  const ligne = (k) => k === "jeu" ? `jeu: ${jeuVal(e.jeu, "  ")}` : k === "nouvelles" ? `nouvelles: [\n${e.nouvelles.map((n) => "    " + obj(n)).join(",\n")}]` : `${k}: ${val(e[k])}`;
  return "{ " + tete.map((k) => `${k}: ${val(e[k])}`).join(", ") + (corps.length ? ",\n  " + corps.map(ligne).join(",\n  ") : "") + " }";
}
function creature(m) {
  const tete = ["id", "nom", "en", "cl", "signes", "bombes", "potions", "autres", "immun", "porte"].filter((k) => m[k] !== undefined);
  const corps = Object.keys(m).filter((k) => !tete.includes(k));
  const ordre = ["conseil", "origine", "livres", "lien"];
  corps.sort((a, b) => (ordre.indexOf(a) + 1 || 99) - (ordre.indexOf(b) + 1 || 99));
  return "{ " + tete.map((k) => `${k}: ${val(m[k])}`).join(", ") + (corps.length ? ",\n    " + corps.map((k) => `${k}: ${val(m[k])}`).join(",\n    ") : "") + " }";
}
// Repère l'objet littéral qui commence à l'indice i (accolade ouvrante) et rend l'indice de sa fin.
function finObjet(s, i) {
  let p = 0, chaine = false;
  for (let j = i; j < s.length; j++) {
    const c = s[j];
    if (chaine) { if (c === "\\") j++; else if (c === '"') chaine = false; continue; }
    if (c === '"') chaine = true; else if (c === "{" || c === "[") p++; else if (c === "}" || c === "]") { p--; if (p === 0) return j + 1; }
  }
  throw new Error("objet non fermé à " + i);
}
function remplacerObjet(cle, id, texteNeuf) {
  const m = new RegExp(`\\{ id: "${id.replace(/[-]/g, "\\-")}",`).exec(src);
  if (!m) throw new Error(`${cle} introuvable dans codex.js : ${id}`);
  src = src.slice(0, m.index) + texteNeuf + src.slice(finObjet(src, m.index));
}
const nouvellesIds = new Set(lots.flatMap(({ d }) => (d.nouvelles || []).map((e) => e.id)));
const nouveauxIds = new Set(lots.flatMap(({ d }) => (d.nouveaux || []).map((m) => m.id)));
for (const id of modifies) {
  if (nouvellesIds.has(id) || nouveauxIds.has(id)) continue;
  const x = parId.get(id);
  remplacerObjet(id.startsWith("m-") ? "créature" : "fiche", id, id.startsWith("m-") ? creature(x) : fiche(x));
}
// Nouvelles fiches : à la fin du tableau entrees ; nouvelles créatures : à la fin du bestiaire.
const insererFin = (cle, textes) => {
  if (!textes.length) return;
  const i = src.indexOf(`\n${cle}: [`); if (i < 0) throw new Error(`tableau ${cle} introuvable`);
  const fin = finObjet(src, src.indexOf("[", i)) - 1;
  const avant = src.slice(0, fin).replace(/\s*$/, "");
  src = avant + (avant.endsWith(",") ? "" : ",") + "\n" + textes.join(",\n") + "\n" + src.slice(fin);
};
insererFin("entrees", C.entrees.filter((e) => nouvellesIds.has(e.id)).map((e) => "\n" + fiche(e)));
insererFin("bestiaire", C.bestiaire.filter((m) => nouveauxIds.has(m.id)).map((m) => "  " + creature(m)));
// Rattachements : on réécrit les listes entrees/monstres des chapitres et extensions concernés.
function remplacerListe(debutBloc, cle, liste) {
  const fin = finObjet(src, debutBloc);
  const bloc = src.slice(debutBloc, fin);
  const re = new RegExp(`${cle}: \\[[^\\]]*\\]`);
  const neuf = re.test(bloc) ? bloc.replace(re, `${cle}: ${val(liste)}`) : bloc.replace(/\s*\}$/, `,\n    ${cle}: ${val(liste)} }`);
  src = src.slice(0, debutBloc) + neuf + src.slice(fin);
}
for (const { d } of lots) {
  const r = d.rattacher || {};
  for (const i of Object.keys(r.chapitres || {})) {
    const debut = src.indexOf("\nchapitres: ["); let pos = src.indexOf("[", debut) + 1;
    for (let n = 0; n <= +i; n++) { pos = src.indexOf("{ nom: ", pos); if (n < +i) pos = finObjet(src, pos); }
    for (const cle of ["entrees", "monstres"]) if ((r.chapitres[i][cle] || []).length) remplacerListe(pos, cle, C.chapitres[+i][cle]);
  }
  for (const k of Object.keys(r.dlc || {})) {
    const pos = src.indexOf(`  ${k}: { nom: `, src.indexOf("\ndlc: {")) + `  ${k}: `.length;
    for (const cle of ["entrees", "monstres"]) if ((r.dlc[k][cle] || []).length) remplacerListe(pos, cle, C.dlc[k][cle]);
  }
}
// Contrôle final : le fichier réécrit redonne exactement les données attendues.
const relu = charger(src);
// Comparaison indépendante de l'ordre des champs (l'outil les range dans un ordre fixe), mais pas de celui des listes.
const canon = (v) => Array.isArray(v) ? v.map(canon) : v && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, canon(v[k])])) : v;
if (JSON.stringify(canon(relu)) !== JSON.stringify(canon(C))) {
  // Indique le premier écart, pour corriger l'outil plutôt que les données.
  const ecart = (a, b, ch) => { if (JSON.stringify(a) === JSON.stringify(b)) return null; if (a && b && typeof a === "object" && typeof b === "object") { for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) { const r = ecart(a[k], b[k], ch + "." + k); if (r) return r; } } return `${ch} : ${JSON.stringify(a)?.slice(0, 160)} ≠ ${JSON.stringify(b)?.slice(0, 160)}`; };
  console.error("La réécriture ne redonne pas les mêmes données : rien n'est écrit.\n" + ecart(canon(relu), canon(C), "CODEX")); process.exit(1);
}
fs.writeFileSync(fichier, src);
console.log("src/codex.js réécrit.");
