// Génère les icônes PNG et l'image d'aperçu des liens (og.png) avec Playwright.
//   node scripts/assets.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { launch } from "./pw.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const svg = (f) => fs.readFileSync(path.join(root, "icons", f), "utf8");
const browser = await launch();
const page = await browser.newPage();

for (const [file, src, size] of [
  ["icon-192.png", "icon.svg", 192], ["icon-512.png", "icon.svg", 512],
  ["apple-touch-icon.png", "icon-maskable.svg", 180], ["icon-maskable-512.png", "icon-maskable.svg", 512],
]) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>${svg(src)}`);
  await page.screenshot({ path: path.join(root, "icons", file), omitBackground: true });
}

await page.setViewportSize({ width: 1200, height: 630 });
await page.setContent(`<!doctype html><html><head>
<link href="https://fonts.googleapis.com/css2?family=Alegreya+Sans:wght@400;700&family=IM+Fell+English&display=swap" rel="stylesheet">
<style>
body{margin:0;width:1200px;height:630px;background:#141b1f;color:#e4e9e7;font-family:"Alegreya Sans",sans-serif;display:flex;align-items:center;gap:64px;padding:0 80px;box-sizing:border-box}
.m{flex:0 0 300px;height:300px}
h1{font:400 84px/1 "IM Fell English",serif;margin:0 0 22px}
p{font-size:32px;line-height:1.35;color:#8fa1a2;margin:0 0 30px;max-width:640px}
ul{display:flex;flex-wrap:wrap;gap:12px;list-style:none;margin:0;padding:0}
li{border:2px solid #2b3a40;border-radius:99px;padding:6px 18px;font-size:24px;font-weight:700}
li:nth-child(odd){color:#8fb8d1}li:nth-child(even){color:#e2b04a}
</style></head><body>
<div class="m">${svg("icon.svg").replace("<svg ", '<svg width="300" height="300" ')}</div>
<div><h1>Compagnon du Sorceleur</h1><p>Le lore des livres de Sapkowski, au rythme de votre partie de The Witcher 3.</p>
<ul><li>Codex sans spoilers</li><li>Bestiaire</li><li>Ordre de lecture</li><li>Quiz entre amis</li></ul></div>
</body></html>`, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: path.join(root, "og.png") });
await browser.close();
console.log("Icônes et og.png générés.");
