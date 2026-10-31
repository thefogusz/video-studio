// The picture code is the spotting sheet: step a seekable HTML film every frame and write the visual events
// a sound designer would spot - cut, appear / vanish (opacity crosses .5), move_start / move_end (box speed),
// draw_start / draw_end (an SVG stroke being drawn via stroke-dashoffset).
// usage: node extract_events.mjs page.html events.json [--fps 30 --w 1080 --h 1920]
//          [--watch "#world [id], .shot img"] [--shot ".shot"] [--skip "#fog,#grain"] [--speed 4]
// --watch  elements to track (default: every element with an id)
// --shot   selector of shot containers; the topmost visible one defines cuts
// --skip   ancestors to ignore (particles, grain, fog layers that always move)
// Feed events.json to check_sfx.py. Optical flow on the rendered video is unreliable for parallax and slow
// camera moves; reading the page's own transforms is exact.
import fs from "node:fs";
import { loadChromium, openFilm, seek, cli } from "./_page.mjs";

const { pos: [page, out], num, str } = cli(process.argv);
if (!page || !out) { console.error("usage: node extract_events.mjs page.html events.json [options]"); process.exit(1); }
const FPS = num("fps", 30), SPEED = num("speed", 4);
const WATCH = str("watch", "[id]"), SHOT = str("shot", ".shot"), SKIP = str("skip", "");
const chromium = await loadChromium();
const { browser, page: p, duration } = await openFilm(chromium, page, { w: num("w", 1080), h: num("h", 1920) });

const sample = () => p.evaluate(([WATCH, SHOT, SKIP]) => {
  const r = {};
  const vis = el => { let o = 1; for (let e = el; e && e !== document.body; e = e.parentElement) o *= +getComputedStyle(e).opacity; return o; };
  for (const el of document.querySelectorAll(WATCH)) {
    if (SKIP && el.closest(SKIP)) continue;
    const id = el.id || `${el.closest("[id]")?.id || "-"}>${(el.getAttribute("src") || el.className?.baseVal || el.className || el.tagName).toString().split("/").pop()}`;
    const bb = el.getBoundingClientRect(); r[id] = [vis(el), bb.x + bb.width / 2, bb.y + bb.height / 2, bb.width];
  }
  for (const el of document.querySelectorAll("svg [id]")) {
    const d = getComputedStyle(el).strokeDasharray;
    if (d && d !== "none") r["draw:" + el.id] = [parseFloat(getComputedStyle(el).strokeDashoffset) || 0, 0, 0, 0];
  }
  let top = null; for (const s of document.querySelectorAll(SHOT)) if (+getComputedStyle(s).opacity > .5) top = s.id || s.className;
  r.__top = top; return r;
}, [WATCH, SHOT, SKIP]);

const ev = []; let prev = null; const sp = {};
for (let f = 0; f <= Math.round(duration * FPS); f++) {
  const t = +(f / FPS).toFixed(4); await seek(p, t); const s = await sample();
  if (prev) {
    if (s.__top !== prev.__top && s.__top) ev.push({ t, kind: "cut", id: s.__top });
    for (const id in s) {
      if (id === "__top" || !prev[id]) continue;
      if (id.startsWith("draw:")) {
        const d1 = s[id][0], d0 = prev[id][0];
        if (d1 < d0 - 1 && !(sp[id] > 0)) { ev.push({ t, kind: "draw_start", id: id.slice(5) }); sp[id] = 1; }
        if (sp[id] > 0 && Math.abs(d1 - d0) <= 1) { ev.push({ t, kind: "draw_end", id: id.slice(5) }); sp[id] = 0; }
        continue;
      }
      const [o, x, y, w] = s[id], [o0, x0, y0, w0] = prev[id];
      if (o0 < .5 && o >= .5) ev.push({ t, kind: "appear", id });
      if (o0 >= .5 && o < .5) ev.push({ t, kind: "vanish", id });
      if (o < .3) { sp[id] = 0; continue; }
      const v = Math.hypot(x - x0, y - y0) + Math.abs(w - w0);   // px per frame (position + growth)
      const was = sp[id] || 0;
      if (was < SPEED && v >= SPEED) ev.push({ t, kind: "move_start", id, v: +v.toFixed(1) });
      if (was >= SPEED && v < SPEED) ev.push({ t, kind: "move_end", id, v: +was.toFixed(1) });
      sp[id] = v;
    }
  }
  prev = s;
}
await browser.close();
fs.writeFileSync(out, JSON.stringify({ fps: FPS, duration, events: ev }, null, 1));
console.log(`${ev.length} events -> ${out}`);
