// Capture stills of a seekable HTML film at given times, or every N seconds.
// usage: node stills.mjs page.html outdir 1.5 4 20.9 ...        (times in seconds)
//        node stills.mjs page.html outdir --every 1.5 [--sheet sheet.png --cols 6]
//        [--w 1080 --h 1920] [--q "grade=1"]   (--q adds a query string, e.g. to turn on a preview grade)
// --sheet also writes a contact sheet of all stills with ffmpeg (time-ordered).
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { loadChromium, openFilm, seek, paint, cli } from "./_page.mjs";

const { pos: [page, out, ...ts], o, num, str } = cli(process.argv);
if (!page || !out) { console.error("usage: node stills.mjs page.html outdir t1 t2 ... | --every S"); process.exit(1); }
fs.mkdirSync(out, { recursive: true });
const chromium = await loadChromium();
const { browser, page: p, duration } = await openFilm(chromium, page, { w: num("w", 1080), h: num("h", 1920), query: str("q", "") });
let times = ts.map(Number);
if (o.every) { times = []; for (let t = 0; t < duration; t += +o.every) times.push(+t.toFixed(3)); }
const files = [];
for (const t of times) {
  await seek(p, t); await paint(p);
  const f = path.join(out, `s_${String(t.toFixed(2)).padStart(7, "0")}.png`);
  await p.screenshot({ path: f }); files.push(f); console.log(f);
}
await browser.close();
if (o.sheet) {
  // a concat list instead of a glob pattern: Windows ffmpeg builds often lack glob support
  const cols = num("cols", 6), rows = Math.ceil(files.length / cols);
  const list = path.join(out, "list.txt");
  fs.writeFileSync(list, files.map(f => `file '${path.resolve(f).replace(/\\/g, "/")}'`).join("\n"));
  const r = spawnSync("ffmpeg", ["-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", list,
    "-vf", `scale=270:-1,tile=${cols}x${rows}`, "-frames:v", "1", o.sheet], { stdio: "inherit" });
  console.log(r.status === 0 ? `sheet ${o.sheet}` : "sheet failed");
}
