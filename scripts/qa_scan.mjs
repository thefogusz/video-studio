// Frame-by-frame QA of a seekable HTML film, before the full render. One pass, four checks:
//   DOUBLE  an element shows, drops to ~0 and shows again within --window s (the "appears twice" bug:
//           usually a reused element animated with immediateRender:false and never hidden first)
//   JUMP    visible opacity changes by more than --jump in one frame (fine on a hard cut or flash;
//           a bug anywhere else) - reported, not failed
//   OVERLAP caption text touches another visible text / logo element
//   SAFE    visible text sits in the platform UI zones (9:16 default: top 14%, bottom 35%, sides 6%)
// usage: node qa_scan.mjs page.html [--w 1080 --h 1920 --fps 10 --from 0 --to DUR]
//          [--root "#stage"] [--cap "#cap"] [--top .14 --bottom .35 --side .06 | --nosafe]
//          [--jump .5 --window .6]
// Mark decorative text that may sit anywhere with data-qa-ignore. Exit 1 on DOUBLE / OVERLAP / SAFE.
// --fps 10 is a quick pass; use --fps 30 before a final render (a 1-frame double pop hides between samples).
import { loadChromium, openFilm, seek, cli } from "./_page.mjs";

const { pos: [page], o, num, str } = cli(process.argv);
if (!page) { console.error("usage: node qa_scan.mjs page.html [options]"); process.exit(1); }
const W = num("w", 1080), H = num("h", 1920), FPS = num("fps", 10), JUMP = num("jump", .5), WIN = num("window", .6);
const ROOT = str("root", "#stage"), CAP = str("cap", "#cap");
const zone = o.nosafe ? null : { top: num("top", .14) * H, bottom: (1 - num("bottom", .35)) * H, side: num("side", .06) * W };
const chromium = await loadChromium();
const { browser, page: p, duration } = await openFilm(chromium, page, { w: W, h: H });
const from = num("from", 0), to = num("to", duration);

const names = await p.evaluate(ROOT => {
  const root = document.querySelector(ROOT) || document.body;
  window.__root = root;
  window.__els = [...root.querySelectorAll("*")].filter(e => (e.id || e.className) && e !== root);
  return window.__els.map(e => e.id ? "#" + e.id : `${e.tagName.toLowerCase()}.${String(e.className.baseVal ?? e.className).split(" ")[0]}@${e.parentElement?.closest("[id]")?.id || "-"}`);
}, ROOT);

const series = names.map(() => []);
const overlaps = new Map(), unsafe = new Map();
const note = (m, k, t) => { const a = m.get(k) || []; a.push(t); m.set(k, a); };
for (let f = Math.round(from * FPS); f <= Math.round(to * FPS); f++) {
  const t = f / FPS;
  await seek(p, t);
  const r = await p.evaluate(([CAP, zone, W, H]) => {
    const root = window.__root;
    const vis = e => { let o = 1; for (let n = e; n && n !== root.parentElement; n = n.parentElement) { const c = getComputedStyle(n); if (c.display === "none" || c.visibility === "hidden") return 0; o *= +c.opacity; } return o; };
    const onScreen = b => b.width > 1 && b.height > 1 && b.right > 0 && b.left < W && b.bottom > 0 && b.top < H;
    const textRects = e => { const g = document.createRange(); g.selectNodeContents(e); return [...g.getClientRects()].filter(onScreen); };
    const ops = window.__els.map(e => onScreen(e.getBoundingClientRect()) ? +vis(e).toFixed(3) : 0);
    // elements that own visible text directly (not just through a child)
    const texty = window.__els.map((e, i) => [e, i]).filter(([e, i]) => ops[i] > .3 && !e.closest("[data-qa-ignore]") &&
      [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()));
    const cap = document.querySelector(CAP);
    const inter = (x, y) => x.left < y.right && y.left < x.right && x.top < y.bottom && y.top < x.bottom;
    const over = [], bad = [];
    if (cap && cap.textContent.trim() && vis(cap) > .3) {
      const cr = textRects(cap);
      for (const [e, i] of texty) if (!cap.contains(e) && !e.contains(cap) && textRects(e).some(x => cr.some(c => inter(c, x)))) over.push(i);
      for (const img of document.querySelectorAll("img[data-qa-logo]")) if (vis(img) > .3 && cr.some(c => inter(c, img.getBoundingClientRect()))) over.push(window.__els.indexOf(img));
    }
    if (zone) for (const [e, i] of texty) if (textRects(e).some(b => b.top < zone.top || b.bottom > zone.bottom || b.left < zone.side || b.right > W - zone.side)) bad.push(i);
    return { ops, over, bad };
  }, [CAP, zone, W, H]);
  r.ops.forEach((v, i) => series[i].push([t, v]));
  r.over.forEach(i => note(overlaps, names[i], t));
  r.bad.forEach(i => note(unsafe, names[i], t));
}
await browser.close();

const fails = [], info = [];
series.forEach((s, i) => {
  let lastShown = -1e9, armed = false;
  for (let k = 1; k < s.length; k++) {
    const [t, v] = s[k], d = v - s[k - 1][1];
    if (Math.abs(d) > JUMP) info.push(`${t.toFixed(2)}  JUMP    ${names[i]}  ${s[k - 1][1]} -> ${v}`);
    if (s[k - 1][1] > .4) { lastShown = s[k - 1][0]; armed = true; }
    // went out quickly (within 0.25 s of being shown) - does it come back soon?
    if (armed && v < .05 && t - lastShown <= .25) {
      armed = false;
      const back = s.slice(k, k + Math.max(1, Math.round(WIN * FPS))).find(([, x]) => x > .4);
      if (back) fails.push(`${t.toFixed(2)}  DOUBLE  ${names[i]}  out at ${t.toFixed(2)}, back at ${back[0].toFixed(2)}`);
    }
  }
});
const span = ts => `${ts[0].toFixed(2)}-${ts[ts.length - 1].toFixed(2)} s (${ts.length} samples)`;
for (const [n, ts] of overlaps) fails.push(`OVERLAP caption x ${n}: ${span(ts)}`);
for (const [n, ts] of unsafe) fails.push(`SAFE    ${n} in the UI zone: ${span(ts)}`);
console.log(`scanned ${from}-${to} s at ${FPS} fps, ${names.length} elements`);
if (info.length) console.log(info.join("\n"));
console.log(fails.length ? fails.join("\n") : "no DOUBLE / OVERLAP / SAFE problems");
process.exit(fails.length ? 1 : 0);
