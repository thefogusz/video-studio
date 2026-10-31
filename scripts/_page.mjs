// Shared helpers for the scripts that drive a seekable HTML film (window.seek(t) + window.DURATION).
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import path from "node:path";

// Resolve playwright from the project (cwd) first: these scripts live in the skill folder,
// where a bare import would not find the project's node_modules.
export async function loadChromium() {
  try { return createRequire(path.join(process.cwd(), "index.js"))("playwright").chromium; }
  catch {
    try { return (await import("playwright")).chromium; }
    catch { console.error("playwright not found: run `npm i playwright && npx playwright install chromium` in this folder"); process.exit(1); }
  }
}

// Fall back to an installed Chrome/Edge when Playwright's own browser isn't downloaded.
export async function launch(chromium, extra = {}) {
  for (const channel of [undefined, "chrome", "msedge"]) {
    try { return await chromium.launch({ ...extra, ...(channel ? { channel } : {}) }); } catch { }
  }
  throw new Error("no browser: run `npx playwright install chromium`");
}

export const toUrl = p => /^https?:|^file:/.test(p) ? p : pathToFileURL(path.resolve(p)).href;

export async function openFilm(chromium, page, { w = 1080, h = 1920, query = "", launchArgs } = {}) {
  const browser = await launch(chromium, launchArgs ? { args: launchArgs } : {});
  const p = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  await p.goto(toUrl(page) + (query ? "?" + query : ""), { waitUntil: "networkidle" });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForFunction(() => typeof window.seek === "function", null, { timeout: 15000 });
  const duration = await p.evaluate(() => window.DURATION);
  return { browser, page: p, duration };
}

// Only await real Promises: a GSAP timeline is a thenable that never resolves while paused.
export const seek = (p, t) => p.evaluate(async t => { const r = window.seek(t); if (r instanceof Promise) await r; }, t);
export const paint = p => p.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));

export function cli(argv) {
  const a = argv.slice(2), pos = [];
  const o = {};
  for (let i = 0; i < a.length; i++) {
    if (a[i].startsWith("--")) { const k = a[i].slice(2); const v = a[i + 1]; if (v === undefined || v.startsWith("--")) o[k] = true; else { o[k] = v; i++; } }
    else pos.push(a[i]);
  }
  return { pos, o, num: (k, d) => (o[k] === undefined ? d : +o[k]), str: (k, d) => (o[k] === undefined ? d : String(o[k])) };
}
