// Test de fumée : ouvre index.html dans Chromium au format téléphone, parcourt chaque écran et joue un quiz.
//   node scripts/smoke.mjs [dossier-captures] [--captures]
//   --captures régénère aussi les captures d'écran du manifeste (captures/*.png).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { launch } from "./pw.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const captures = args.includes("--captures");
const shots = args.find((a) => !a.startsWith("--"));
const url = pathToFileURL(path.join(root, "index.html")).href;
const browser = await launch();
const errors = [];
const fail = (m) => errors.push(m);
const pause = (p, ms = 160) => p.waitForTimeout(ms);

async function run(ctxOpts, label, capture) {
  const ctx = await browser.newContext(ctxOpts);
  // Chromium sans interface n'a pas de voix : une synthèse factice permet de vérifier le lecteur.
  await ctx.addInitScript(() => {
    const fake = { speaking: false, getVoices: () => [], cancel() {}, pause() {}, resume() {},
      speak(u) { setTimeout(() => u.onstart && u.onstart(), 10); setTimeout(() => u.onend && u.onend(), 800); } };
    Object.defineProperty(window, "speechSynthesis", { value: fake, configurable: true });
  });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => fail(`${label} pageerror: ${e.message}`));
  page.on("console", (m) => { if (m.type() === "error" && !/fonts|ERR_|net::|Failed to load resource/.test(m.text())) fail(`${label} console: ${m.text()}`); });
  const go = async (h) => { await page.evaluate((x) => { location.hash = x; }, h); await pause(page); };
  const text = () => page.locator("#main").textContent();
  // On attend l'affichage (jusqu'à 3 s) plutôt qu'une durée fixe : le rendu prend plus ou moins de temps selon l'écran.
  const expect = async (h, needle) => { await go(h); try { await page.waitForFunction((n) => document.querySelector("#main").textContent.includes(n), needle, { timeout: 3000 }); } catch { fail(`${label} #${h}: « ${needle} » introuvable`); } };
  const snap = async (name) => { await pause(page, 450); await page.evaluate(() => { const t = document.querySelector("#toast"); if (t) t.hidden = true; }); if (shots) await page.screenshot({ path: `${shots}/${label}-${name}.png` }); if (capture && ["partie", "carte", "fiche"].includes(name)) await page.screenshot({ path: path.join(root, "captures", `${name}.png`) }); };

  await page.goto(url);
  await page.waitForSelector("#onb:not([hidden])");
  if (shots) await page.screenshot({ path: `${shots}/${label}-accueil.png` });
  await page.click('[data-onb="next"]'); await pause(page, 60);
  await page.click('[data-onbch="1"]'); await pause(page, 60);
  await page.click('[data-onb="next"]'); await pause(page, 60);
  await page.check("#onb-lu-dernier-voeu");
  await page.locator('#onb [data-onb="next"], #onb [data-onb="done"]').last().click(); await pause(page, 60);
  if (await page.locator('#onb [data-onb="done"]').count()) await page.click('#onb [data-onb="done"]');
  await pause(page);
  if (!(await page.locator("#onb").isHidden())) fail(`${label}: l'accueil guidé ne se ferme pas`);
  if (!(await text()).includes("Velen")) fail(`${label}: l'étape choisie à l'accueil n'est pas appliquée`);
  await page.evaluate(() => scrollTo(0, 0));
  await snap("partie");

  // Recherche et navigation dans les fiches
  await page.click('[data-tab="codex"]'); await pause(page);
  if (!(await text()).includes("Lignée de Ciri")) fail(`${label}: codex incomplet`);
  await page.click('.bar [data-act="search"]'); await pause(page, 60);
  await page.keyboard.type("zireael");
  if (!(await page.locator("#lst").textContent()).includes("Ciri")) fail(`${label}: recherche « zireael » sans Ciri`);
  await page.locator('#lst [data-o="ciri"]').first().click(); await pause(page);
  if (!(await text()).includes("Princesse de Cintra")) fail(`${label}: fiche Ciri non ouverte`);
  await snap("fiche");
  await page.locator('#main [data-o="geralt"]').first().click(); await pause(page);
  if (!(await text()).includes("Geralt de Riv")) fail(`${label}: lien vers Geralt cassé`);
  await page.click(".bar [data-b]"); await pause(page);
  if (!(await text()).includes("Princesse de Cintra")) fail(`${label}: Retour ne revient pas à Ciri`);
  await page.click(".bar [data-b]"); await pause(page);
  if (!(await page.locator("#q").count())) fail(`${label}: Retour ne revient pas à la recherche`);

  // Spoilers : fiche verrouillée, puis révélation par livre lu
  await expect("generaux", "Fiche verrouillée");
  await page.click("[data-force]"); await pause(page);
  if (!(await text()).includes("Lieutenants d'Eredin")) fail(`${label}: « Afficher quand même » sans effet`);
  await expect("renfri", "Affiché car vous avez lu");
  await expect("duny", "Révéler la suite");
  await go("livres"); await page.click('[data-lu="dame-lac"]'); await pause(page);
  await expect("duny", "Emhyr var Emreis");

  // Carte
  await go("carte");
  await page.waitForSelector("#map");
  await page.locator('#map [data-pin="novigrad"] .dot').click(); await pause(page);
  if (!(await page.locator("#mapcard").count())) fail(`${label}: la carte ne réagit pas au toucher`);
  await page.click('[data-zoom="reset"]');
  await page.click('[data-act="mapclose"]'); await pause(page, 60);
  await snap("carte");
  await page.locator('#map [data-pin="kaer-morhen"] .dot').click(); await pause(page);
  await page.click('#mapcard [data-o="kaer-morhen"]'); await pause(page);
  if (!(await text()).includes("Forteresse des sorceleurs")) fail(`${label}: fiche ouverte depuis la carte introuvable`);

  // Lignée, contes, bestiaire
  await expect("lignee", "Lara Dorren");
  await expect("contes", "Hans mon hérisson");
  const img = await page.evaluate(async () => { const i = document.querySelector("#main .fig img"); i.loading = "eager"; await i.decode().catch(() => {}); return i.naturalWidth; });
  if (!img) fail(`${label}: illustration non chargée`);
  await expect("m-sirenes", "Sirine et Alkonost");
  await expect("bestiaire", "Noyeurs");

  // Quiz complet
  await expect("quiz", "Défi entre amis");
  await page.click('[data-act="solo"]'); await pause(page, 60);
  for (let i = 0; i < 10; i++) {
    if (!(await page.locator(".qq").textContent())) fail(`${label}: question ${i + 1} vide`);
    await page.locator("[data-qa]").first().click(); await pause(page, 40);
    await page.click('[data-act="next"]'); await pause(page, 40);
  }
  if (!(await text()).includes("Récapitulatif")) fail(`${label}: écran de résultat absent`);
  if (shots) await page.screenshot({ path: `${shots}/${label}-quiz.png` });

  // Un défi donne les mêmes questions quelle que soit l'avancée
  await go("defi-abc12"); await page.click('[data-act="relever"]'); await pause(page, 60);
  const q1 = await page.locator(".qq").textContent();
  await go("partie"); await page.click('[data-i="5"]'); await pause(page, 60);
  if (!(await text()).includes("Oui, j'y suis")) fail(`${label}: pas de confirmation avant d'avancer`);
  await page.click('[data-act="pend-ok"]'); await pause(page, 60);
  await page.reload(); await page.waitForSelector("#main h2");
  await go("defi-abc12"); await page.click('[data-act="relever"]'); await pause(page, 60);
  if (q1 !== (await page.locator(".qq").textContent())) fail(`${label}: le défi ne redonne pas les mêmes questions`);

  // Partage et réglages
  await page.click('.bar [data-share]'); await pause(page, 60);
  if (!(await page.inputValue("#sh-l")).endsWith("#defi-abc12")) fail(`${label}: lien de partage inattendu`);
  await page.waitForTimeout(800);
  if (shots) await page.screenshot({ path: `${shots}/${label}-partage.png` });
  await page.keyboard.press("Escape");
  await go("reglages");
  await page.click('[data-theme="dark"]'); await pause(page, 60);
  if ((await page.evaluate(() => document.documentElement.dataset.theme)) !== "dark") fail(`${label}: le thème sombre ne s'applique pas`);
  if (shots) await page.screenshot({ path: `${shots}/${label}-reglages.png` });
  await page.click('[data-theme="oled"]'); await pause(page, 60);
  if ((await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--bg").trim())) !== "#000") fail(`${label}: le thème Noir ne s'applique pas`);
  await page.click('[data-theme="auto"]'); await pause(page, 60);

  // Capacités du téléphone : lecture à voix haute, dictée, partage reçu d'une autre application
  await go("ciri");
  await page.locator('#main [data-lire="ciri"]').click(); await pause(page, 120);
  if (await page.locator("#player").isHidden()) fail(`${label}: le lecteur à voix haute n'apparaît pas`);
  await page.click('#player [data-act="lire-stop"]'); await pause(page, 60);
  if (!(await page.locator("#player").isHidden())) fail(`${label}: le lecteur ne s'arrête pas`);
  await page.click('.bar [data-act="search"]'); await pause(page, 60);
  if (!(await page.locator('[data-mic="q"]').count())) fail(`${label}: bouton de dictée absent`);
  await page.goto(url + "?texte=" + encodeURIComponent("Qui est Avallac'h ?")); await page.waitForSelector("#main #q");
  if (!(await page.locator("#lst").textContent()).includes("Sage des Aen Elle")) fail(`${label}: le texte partagé n'ouvre pas la recherche`);
  if (await page.evaluate(() => location.search)) fail(`${label}: les paramètres du partage restent dans l'adresse`);
  const sw = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  if (sw > 0) fail(`${label}: défilement horizontal de ${sw}px`);
  await ctx.close();
}

if (captures) fs.mkdirSync(path.join(root, "captures"), { recursive: true });
const phone = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
await run({ ...phone, colorScheme: "light" }, "tel-clair", captures);
// Format proche d'un Pixel 10 Pro XL sous Chrome Android.
await run({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 3.5, isMobile: true, hasTouch: true, colorScheme: "dark",
  userAgent: "Mozilla/5.0 (Linux; Android 16; Pixel 10 Pro XL) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36" }, "pixel");
await run({ ...phone, colorScheme: "dark" }, "tel-sombre");
await run({ viewport: { width: 360, height: 740 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: "light" }, "petit");
await run({ viewport: { width: 1280, height: 860 }, colorScheme: "light" }, "bureau");
await browser.close();
if (errors.length) { console.error("Échecs :\n- " + errors.join("\n- ")); process.exit(1); }
console.log("Test de fumée réussi.");
