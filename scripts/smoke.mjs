// Test de fumée : ouvre index.html dans Chromium, parcourt chaque vue et joue un quiz complet.
//   node scripts/smoke.mjs [dossier-captures]
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { launch } from "./pw.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const shots = process.argv[2];
const url = pathToFileURL(path.join(root, "index.html")).href;
const browser = await launch();
const errors = [];
const fail = (m) => { errors.push(m); };

async function run(ctxOpts, label) {
  const ctx = await browser.newContext(ctxOpts);
  const page = await ctx.newPage();
  page.on("pageerror", (e) => fail(`${label} pageerror: ${e.message}`));
  page.on("console", (m) => { if (m.type() === "error" && !/fonts|ERR_|net::/.test(m.text())) fail(`${label} console: ${m.text()}`); });
  const go = async (h) => { await page.evaluate((x) => { location.hash = x; }, h); await page.waitForTimeout(60); };
  const text = () => page.locator("#main").textContent();
  const expect = async (h, needle) => { await go(h); const t = await text(); if (!t.includes(needle)) fail(`${label} #${h}: « ${needle} » introuvable`); };

  await page.goto(url);
  await page.waitForSelector("#main h2");
  if (!(await text()).includes("Bienvenue")) fail(`${label}: carte de bienvenue absente`);
  if (shots) await page.screenshot({ path: `${shots}/${label}-partie.png`, fullPage: false });
  await page.click('[data-act="vu"]');
  await expect("codex", "Personnages");
  await page.fill("#q", "zireael");
  if (!(await page.locator("#lst").innerText()).includes("Ciri")) fail(`${label}: recherche « zireael » sans Ciri`);
  await expect("ciri", "Princesse de Cintra");
  if (shots) await page.screenshot({ path: `${shots}/${label}-fiche.png` });
  await page.click('button[data-o="geralt"]'); await page.waitForTimeout(60);
  if (!(await text()).includes("Geralt de Riv")) fail(`${label}: lien Voir aussi vers Geralt cassé`);
  await page.click("[data-b]"); await page.waitForTimeout(60);
  if (!(await text()).includes("Princesse de Cintra")) fail(`${label}: Retour ne revient pas à Ciri`);
  await page.click("[data-b]"); await page.waitForTimeout(60);
  if (!(await text()).includes("Codex")) fail(`${label}: Retour ne revient pas au codex`);
  await expect("uma", "Fiche verrouillée");
  await page.click("[data-force]");
  if (!(await text()).includes("Créature maudite")) fail(`${label}: « Afficher quand même » sans effet`);
  await expect("bestiaire", "Bestiaire");
  await expect("m-griffon", "Huile contre les hybrides");
  await expect("livres", "sur 9 lus");
  await page.click('[data-lu="dernier-voeu"]');
  if (!(await text()).includes("1 sur 9 lus")) fail(`${label}: marquer comme lu sans effet`);
  await expect("frise", "La Conjonction des Sphères");
  await expect("ecrans", "Wiedźmin");
  await expect("quiz", "Défi entre amis");
  await page.click('[data-act="solo"]');
  for (let i = 0; i < 10; i++) {
    const q = await page.locator(".qq").innerText();
    if (!q) fail(`${label}: question ${i + 1} vide`);
    await page.locator("[data-qa]").first().click();
    await page.click('[data-act="next"]');
  }
  if (!(await text()).includes("Récapitulatif")) fail(`${label}: écran de résultat absent`);
  if (shots) await page.screenshot({ path: `${shots}/${label}-quiz.png` });
  // Un défi doit produire les mêmes questions quelle que soit l'avancée.
  await go("defi-abc12"); await page.click('[data-act="relever"]');
  const q1 = await page.locator(".qq").innerText();
  await page.click('[data-i="5"]');
  await go("partie"); await go("defi-abc12");
  await page.evaluate(() => { S.quiz = null; }).catch(() => {});
  await page.reload(); await page.waitForSelector("#main h2");
  await page.click('[data-act="relever"]');
  const q2 = await page.locator(".qq").innerText();
  if (q1 !== q2) fail(`${label}: le défi ne donne pas les mêmes questions (« ${q1} » / « ${q2} »)`);
  await page.click("#share-open");
  if (await page.locator("#sheet").isHidden()) fail(`${label}: panneau de partage fermé`);
  const link = await page.inputValue("#sh-l");
  if (!link.endsWith("#defi-abc12")) fail(`${label}: lien de partage inattendu ${link}`);
  await page.waitForTimeout(1500);
  if (shots) await page.screenshot({ path: `${shots}/${label}-partage.png` });
  await page.keyboard.press("Escape");
  const sw = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  if (sw > 0) fail(`${label}: défilement horizontal de ${sw}px`);
  await ctx.close();
}

await run({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: "light" }, "tel-clair");
await run({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: "dark" }, "tel-sombre");
await run({ viewport: { width: 1280, height: 860 }, colorScheme: "light" }, "bureau");
await browser.close();
if (errors.length) { console.error("Échecs :\n- " + errors.join("\n- ")); process.exit(1); }
console.log("Test de fumée réussi.");
