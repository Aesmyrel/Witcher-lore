// Test du service worker : hors ligne et mise à jour, sur un serveur local qui imite GitHub Pages (max-age=600).
//   node scripts/sw-test.mjs
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { fileURLToPath } from "node:url";
import { launch } from "./pw.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "compagnon-sw-"));
for (const f of ["index.html", "sw.js", "manifest.webmanifest"]) fs.copyFileSync(path.join(root, f), path.join(dir, f));
for (const d of ["icons", "img"]) fs.cpSync(path.join(root, d), path.join(dir, d), { recursive: true });

const types = { ".html": "text/html", ".js": "text/javascript", ".webmanifest": "application/manifest+json", ".png": "image/png", ".svg": "image/svg+xml", ".webp": "image/webp" };
let enLigne = true;
const server = http.createServer((req, res) => {
  if (!enLigne) { req.socket.destroy(); return; }
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname).replace(/^\/app\//, "/");
  if (p === "/" || p === "") p = "/index.html";
  const f = path.join(dir, p);
  if (!f.startsWith(dir) || !fs.existsSync(f)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { "content-type": types[path.extname(f)] || "application/octet-stream", "cache-control": "max-age=600" });
  res.end(fs.readFileSync(f));
});
await new Promise((ok) => server.listen(0, "127.0.0.1", ok));
const base = `http://127.0.0.1:${server.address().port}/app/`;

const errors = [];
const browser = await launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
await ctx.addInitScript(() => { try { localStorage.setItem("cs", JSON.stringify({ vu: true })); } catch (e) {} });
const page = await ctx.newPage();
page.on("pageerror", (e) => errors.push("pageerror: " + e.message));

await page.goto(base);
await page.evaluate(() => navigator.serviceWorker.ready);
await page.reload();
await page.waitForFunction(() => !!navigator.serviceWorker.controller);

// 1. Hors ligne : l'application s'ouvre depuis le cache.
enLigne = false;
await page.reload();
if (!(await page.locator("#main h2").count())) errors.push("l'application ne s'ouvre pas hors ligne");
enLigne = true;

// 2. Mise à jour : une nouvelle version de la page est détectée et proposée.
const html = fs.readFileSync(path.join(dir, "index.html"), "utf8");
fs.writeFileSync(path.join(dir, "index.html"), html.replace("</body>", "<!-- version 2 --></body>"));
await page.reload();
try {
  await page.waitForFunction(() => /Nouvelle version/.test(document.querySelector("#toast")?.textContent || ""), null, { timeout: 8000 });
} catch { errors.push("la nouvelle version n'est pas proposée (toast absent)"); }
await page.reload();
const v2 = await page.evaluate(() => document.documentElement.outerHTML.includes("version 2"));
if (!v2) errors.push("la nouvelle version ne s'affiche pas après rechargement");

// 3. Les autres fichiers restent eux-mêmes (une image n'est pas remplacée par l'application).
const img = await page.goto(base + "icons/icon-192.png");
if (!/image\/png/.test(img.headers()["content-type"] || "")) errors.push("une image est servie comme page de l'application");

await browser.close();
server.close();
fs.rmSync(dir, { recursive: true, force: true });
if (errors.length) { console.error("Échecs :\n- " + errors.join("\n- ")); process.exit(1); }
console.log("Service worker : hors ligne et mise à jour vérifiés.");
