// Test du service worker sur un serveur local qui imite GitHub Pages (max-age=600) :
// hors ligne, mise à jour à l'ouverture, mise à jour au retour au premier plan, et passage depuis les anciennes versions.
//   node scripts/sw-test.mjs
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { launch } from "./pw.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "compagnon-sw-"));
const actuel = () => { const d = fs.mkdtempSync(path.join(tmp, "v-")); for (const f of ["index.html", "sw.js", "manifest.webmanifest"]) fs.copyFileSync(path.join(root, f), path.join(d, f)); for (const x of ["icons", "img"]) fs.cpSync(path.join(root, x), path.join(d, x), { recursive: true }); return d; };
const ancien = (commit) => { const d = fs.mkdtempSync(path.join(tmp, "v-")); execSync(`git archive ${commit} | tar -x -C "${d}"`, { cwd: root }); return d; };
const version = (d) => (fs.readFileSync(path.join(d, "sw.js"), "utf8").match(/VERSION = "([^"]+)"/) || [])[1];
const modifier = (d, f, avant, apres) => { const p = path.join(d, f); fs.writeFileSync(p, fs.readFileSync(p, "utf8").replace(avant, apres)); };

const types = { ".html": "text/html", ".js": "text/javascript", ".webmanifest": "application/manifest+json", ".png": "image/png", ".svg": "image/svg+xml", ".webp": "image/webp" };
let site = null, enLigne = true, lenteur = 0;
const server = http.createServer((req, res) => {
  if (!enLigne) { req.socket.destroy(); return; }
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname).replace(/^\/app\//, "/");
  if (p === "/" || p === "") p = "/index.html";
  const f = path.join(site, p);
  if (!f.startsWith(site) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  const envoyer = () => { res.writeHead(200, { "content-type": types[path.extname(f)] || "application/octet-stream", "cache-control": "max-age=600" }); res.end(fs.readFileSync(f)); };
  if (p === "/index.html" && lenteur) setTimeout(envoyer, lenteur); else envoyer();
});
await new Promise((ok) => server.listen(0, "127.0.0.1", ok));
const base = `http://127.0.0.1:${server.address().port}/app/`;

const errors = [];
const browser = await launch();
const attendre = (ms) => new Promise((ok) => setTimeout(ok, ms));
// Interroge la page même pendant qu'elle se recharge d'elle-même.
async function jusqua(page, fn, arg, ms = 15000) {
  for (const fin = Date.now() + ms; Date.now() < fin; await attendre(200)) { try { if (await page.evaluate(fn, arg)) return true; } catch {} }
  return false;
}
const affiche = (page, marque) => jusqua(page, (m) => document.documentElement.outerHTML.includes(m), marque);
const annonce = (page, ms) => jusqua(page, () => /Nouvelle version/.test(document.querySelector("#toast")?.textContent || ""), null, ms);
const toastMaj = (page) => page.evaluate(() => { const t = document.querySelector("#toast"); return !!t && !t.hidden && /Nouvelle version/.test(t.textContent); }).catch(() => false);

async function installer(dir) {
  site = dir;
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.addInitScript(() => { try { localStorage.setItem("cs", JSON.stringify({ vu: true })); } catch (e) {} });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  await page.goto(base);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  return { ctx, page };
}

// ---------- Version actuelle ----------
{
  const dir = actuel();
  const { ctx, page } = await installer(dir);

  // 1. Hors ligne : l'application s'ouvre depuis le cache.
  enLigne = false;
  await page.reload();
  if (!(await page.locator("#main h2").count())) errors.push("l'application ne s'ouvre pas hors ligne");
  enLigne = true;

  // 2. À l'ouverture, une page modifiée sur le serveur remplace d'elle-même l'ancienne, sans geste.
  modifier(dir, "index.html", "</body>", "<!-- version 2 --></body>");
  await page.reload();
  if (!(await affiche(page, "version 2"))) errors.push("à l'ouverture, la nouvelle version ne s'affiche pas d'elle-même");
  await page.waitForSelector("#main h2");

  // 3. Si l'on a déjà commencé à s'en servir, on propose la nouvelle version au lieu d'interrompre.
  await page.evaluate(() => sessionStorage.clear());
  modifier(dir, "index.html", "<!-- version 2 -->", "<!-- version 3 -->");
  lenteur = 1500;
  await page.reload();
  await page.evaluate(() => dispatchEvent(new PointerEvent("pointerdown")));
  if (!(await annonce(page, 8000))) errors.push("après un geste, la nouvelle version n'est pas proposée (toast absent)");
  lenteur = 0;
  if (await page.evaluate(() => document.documentElement.outerHTML.includes("version 3"))) errors.push("la page s'est rechargée malgré le geste");
  await page.click('#toast [data-act="reload"]');
  if (!(await affiche(page, "version 3"))) errors.push("« Recharger » n'affiche pas la nouvelle version");
  await page.waitForSelector("#main h2");

  // 4. Application restée ouverte en arrière-plan : au retour au premier plan, elle trouve et applique la nouvelle version.
  await page.evaluate(() => sessionStorage.clear());
  modifier(dir, "index.html", "<!-- version 3 -->", "<!-- version 4 -->");
  modifier(dir, "sw.js", /VERSION = "[^"]+"/, 'VERSION = "compagnon-test4"');
  await attendre(300);
  await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
  if (!(await affiche(page, "version 4"))) errors.push("au retour au premier plan, la nouvelle version ne s'applique pas");
  await page.waitForSelector("#main h2");

  // 5. Une fois à jour, aucune fausse annonce.
  await attendre(2500);
  if (await toastMaj(page)) errors.push("fausse annonce de nouvelle version sur une page à jour");
  await page.reload(); await attendre(2500);
  if (await toastMaj(page)) errors.push("fausse annonce de nouvelle version après rechargement");

  // 6. Les autres fichiers restent eux-mêmes (une image n'est pas remplacée par l'application).
  const img = await page.goto(base + "icons/icon-192.png");
  if (!/image\/png/.test(img.headers()["content-type"] || "")) errors.push("une image est servie comme page de l'application");
  await ctx.close();
}

// ---------- Passage depuis les versions déjà publiées ----------
// Ces versions ne vérifient rien d'elles-mêmes au retour au premier plan : il faut rouvrir l'application une fois.
const nouvelle = actuel();
const attendue = version(nouvelle).replace("compagnon-", "");
for (const commit of ["3be8e4d", "fdd615c", "654f2ed", "f2445bb"]) {
  try { execSync(`git cat-file -e ${commit}^{commit}`, { cwd: root, stdio: "ignore" }); } catch { continue; }
  const { ctx, page } = await installer(ancien(commit));
  site = nouvelle;
  await page.reload();
  if (!(await annonce(page, 15000))) {
    errors.push(`depuis ${commit} : la nouvelle version n'est pas proposée à la réouverture`);
  } else {
    await page.click('#toast [data-act="reload"]');
    if (!(await jusqua(page, (v) => document.querySelector('meta[name="compagnon-version"]')?.content === v, attendue, 10000))) errors.push(`depuis ${commit} : « Recharger » n'affiche pas la nouvelle version`);
    await attendre(2500);
    if (await toastMaj(page)) errors.push(`depuis ${commit} : fausse annonce après la mise à jour`);
  }
  await ctx.close();
}

await browser.close();
server.close();
fs.rmSync(tmp, { recursive: true, force: true });
if (errors.length) { console.error("Échecs :\n- " + errors.join("\n- ")); process.exit(1); }
console.log("Service worker : hors ligne, mises à jour et passage depuis les anciennes versions vérifiés.");
