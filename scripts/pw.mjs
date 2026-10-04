// Charge Playwright (installé localement ou globalement) et lance Chromium.
// Les polices Google et les scripts cdnjs sont récupérés avec curl puis servis à la page :
// curl suit la configuration réseau du système (proxy, certificats), ce que Chromium ne fait pas toujours.
import { createRequire } from "node:module";
import { execSync, execFileSync } from "node:child_process";

async function load() {
  try { return (await import("playwright")).chromium; } catch {}
  const g = execSync("npm root -g").toString().trim();
  return createRequire(g + "/")("playwright").chromium;
}

const EXT = /^https:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com|cdnjs\.cloudflare\.com)\//;
const cache = new Map();
const typeOf = (u) => u.includes("fonts.googleapis.com") ? "text/css" : u.endsWith(".js") ? "application/javascript" : u.endsWith(".woff2") ? "font/woff2" : "application/octet-stream";

export async function launch() {
  const browser = await (await load()).launch();
  const newContext = browser.newContext.bind(browser);
  browser.newContext = async (opts) => {
    const ctx = await newContext(opts);
    await ctx.route(EXT, async (route) => {
      const u = route.request().url();
      try {
        if (!cache.has(u)) cache.set(u, execFileSync("curl", ["-sSfL", "-A", route.request().headers()["user-agent"] || "Mozilla/5.0", u], { maxBuffer: 1 << 26 }));
        await route.fulfill({ status: 200, body: cache.get(u), contentType: typeOf(u), headers: { "access-control-allow-origin": "*" } });
      } catch { await route.abort(); }
    });
    return ctx;
  };
  browser.newPage = async (opts) => (await browser.newContext(opts)).newPage();
  return browser;
}
