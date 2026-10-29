// Render a deterministic HTML animation to MP4, frame by frame.
//
// The page must expose   window.seek(seconds)   (sync or async) that puts every
// animation at exactly that time, and   window.DURATION   in seconds.
// With GSAP:  const tl = gsap.timeline({paused:true}); window.seek = t => { tl.seek(t, false); }; window.DURATION = tl.duration();
//
// Usage:
//   npm i playwright && npx playwright install chromium
//   node render_html.mjs page.html out/anim_v001.mp4 [--w 1080 --h 1920 --fps 30 --from 0 --to <sec> --alpha]
//
// --alpha renders a transparent ProRes 4444 .mov (page background must be transparent).
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { pathToFileURL } from "node:url";
import path from "node:path";

const args = process.argv.slice(2);
const [input, output] = args;
const opt = (k, d) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : d; };
if (!input || !output) {
  console.error("usage: node render_html.mjs page.html out.mp4 [--w 1080 --h 1920 --fps 30 --from 0 --to S --alpha]");
  process.exit(1);
}
const W = +opt("w", 1920), H = +opt("h", 1080), FPS = +opt("fps", 30);
const alpha = args.includes("--alpha");

// Fall back to an installed Chrome/Edge when Playwright's own browser isn't downloaded.
async function launch() {
  for (const channel of [undefined, "chrome", "msedge"]) {
    try { return await chromium.launch(channel ? { channel } : {}); } catch (e) { if (!channel) console.error("bundled chromium missing, trying installed browsers…"); }
  }
  throw new Error("no browser: run `npx playwright install chromium`");
}
const browser = await launch();
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
const url = /^https?:/.test(input) ? input : pathToFileURL(path.resolve(input)).href;
await page.goto(url, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await page.waitForFunction(() => typeof window.seek === "function", null, { timeout: 15000 });

const duration = await page.evaluate(() => window.DURATION);
const from = +opt("from", 0), to = +opt("to", duration);
if (!(to > from)) throw new Error(`bad range: window.DURATION=${duration}, from=${from}, to=${to}`);
const frames = Math.round((to - from) * FPS);

const enc = alpha
  ? ["-c:v", "prores_ks", "-profile:v", "4444", "-pix_fmt", "yuva444p10le"]
  : ["-c:v", "libx264", "-crf", "16", "-preset", "medium", "-pix_fmt", "yuv420p", "-movflags", "+faststart"];
const ff = spawn("ffmpeg", ["-y", "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "png", "-i", "-", ...enc, output],
  { stdio: ["pipe", "inherit", "inherit"] });

for (let f = 0; f < frames; f++) {
  const t = from + f / FPS;
  // Only await real Promises: a GSAP timeline is a thenable that resolves on completion,
  // so awaiting tl.seek()'s return value would hang forever on a paused timeline.
  await page.evaluate(async (t) => { const r = window.seek(t); if (r instanceof Promise) await r; }, t);
  await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
  const png = await page.screenshot({ type: "png", omitBackground: alpha });
  if (!ff.stdin.write(png)) await new Promise(r => ff.stdin.once("drain", r));
  if (f % FPS === 0) process.stdout.write(`\rframe ${f}/${frames}`);
}
ff.stdin.end();
await browser.close();
const code = await new Promise(r => ff.on("close", r));
console.log(`\n${code === 0 ? "wrote" : "ffmpeg failed:"} ${output}`);
process.exit(code);
