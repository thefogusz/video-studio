// Parallel renderer for a seekable HTML film (window.seek(t) + window.DURATION).
// Splits the frame range into contiguous chunks, renders each in its own headless browser + ffmpeg,
// then joins the chunks without re-encoding. Measured on a 150 s 1080x1920 film: ~8x faster than
// render_html.mjs with 6 workers (5 s test: 164 s -> 21 s; PSNR vs the PNG path ~42 dB).
//
// usage: node render_fast.mjs page.html out/film_v001.mp4 [--w 1080 --h 1920 --fps 30]
//          [--workers N] [--jpeg 92 | --png] [--from S --to S] [--nvenc] [--gpu]
// Run from a folder whose node_modules has playwright. Use render_html.mjs for --alpha output.
// --gpu: GPU rasterisation flags. It hung headless Chrome on Windows in testing; try it only elsewhere.
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { loadChromium, openFilm, seek, paint, cli } from "./_page.mjs";

const { pos: [input, output], o, num } = cli(process.argv);
if (!input || !output) { console.error("usage: node render_fast.mjs page.html out.mp4 [options]"); process.exit(1); }
const W = num("w", 1080), H = num("h", 1920), FPS = num("fps", 30);
const WORKERS = Math.max(1, num("workers", Math.min(6, os.cpus().length >> 1)));
const PNG = !!o.png, Q = num("jpeg", 92);
const GPU = o.gpu ? ["--use-angle=d3d11", "--ignore-gpu-blocklist", "--enable-gpu-rasterization", "--enable-zero-copy"] : undefined;
const enc = o.nvenc
  ? ["-c:v", "h264_nvenc", "-preset", "p5", "-cq", "18", "-pix_fmt", "yuv420p"]
  : ["-c:v", "libx264", "-crf", "16", "-preset", "medium", "-pix_fmt", "yuv420p"];
const chromium = await loadChromium();

async function renderChunk(i, f0, f1, from, tmp) {
  const { browser, page } = await openFilm(chromium, input, { w: W, h: H, launchArgs: GPU });
  const cdp = await page.context().newCDPSession(page);
  const file = path.join(tmp, `chunk_${String(i).padStart(3, "0")}.mp4`);
  const ff = spawn("ffmpeg", ["-y", "-v", "error", "-f", "image2pipe", "-framerate", String(FPS),
    "-c:v", PNG ? "png" : "mjpeg", "-i", "-", ...enc, file], { stdio: ["pipe", "inherit", "inherit"] });
  // Listen for exit now: if ffmpeg finishes while the browser is closing, a later listener misses it and hangs.
  const ffDone = new Promise(r => ff.on("close", r));
  // A stuck step must fail loudly with its worker and frame, not hang the whole render.
  const step = (what, f, p) => Promise.race([p, new Promise((_, no) =>
    setTimeout(() => no(new Error(`worker ${i} frame ${f}: ${what} timed out`)), 30000))]);
  for (let f = f0; f < f1; f++) {
    await step("seek", f, seek(page, from + f / FPS));
    await step("paint", f, paint(page));
    const { data } = await step("capture", f, cdp.send("Page.captureScreenshot",
      PNG ? { format: "png" } : { format: "jpeg", quality: Q, optimizeForSpeed: true }));
    if (!ff.stdin.write(Buffer.from(data, "base64"))) await new Promise(r => ff.stdin.once("drain", r));
    done++;
  }
  ff.stdin.end();
  await browser.close();
  if (await ffDone !== 0) throw new Error(`ffmpeg failed on chunk ${i}`);
  return file;
}

const t0 = Date.now();
const probe = await openFilm(chromium, input, { w: W, h: H });
await probe.browser.close();
const from = num("from", 0), to = num("to", probe.duration);
if (!(to > from)) throw new Error(`bad range: window.DURATION=${probe.duration}, from=${from}, to=${to}`);
const frames = Math.round((to - from) * FPS);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "render_fast_"));
let done = 0;
const timer = setInterval(() => process.stdout.write(`\rframe ${done}/${frames}`), 2000);

const per = Math.ceil(frames / WORKERS), jobs = [];
for (let i = 0; i < WORKERS; i++) {
  const f0 = i * per, f1 = Math.min(frames, f0 + per);
  if (f0 < f1) jobs.push(renderChunk(i, f0, f1, from, tmp));
}
const files = await Promise.all(jobs);
clearInterval(timer);

const list = path.join(tmp, "list.txt");
fs.writeFileSync(list, files.map(f => `file '${f.replace(/\\/g, "/")}'`).join("\n"));
fs.mkdirSync(path.dirname(path.resolve(output)), { recursive: true });
const code = await new Promise(r => spawn("ffmpeg", ["-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", list,
  "-c", "copy", "-movflags", "+faststart", output], { stdio: "inherit" }).on("close", r));
fs.rmSync(tmp, { recursive: true, force: true });
const secs = (Date.now() - t0) / 1000;
console.log(`\n${code === 0 ? "wrote" : "concat failed:"} ${output}  ${frames} frames, ${jobs.length} workers, ${secs.toFixed(1)} s (${(secs / frames * 1000).toFixed(0)} ms/frame)`);
process.exit(code);
