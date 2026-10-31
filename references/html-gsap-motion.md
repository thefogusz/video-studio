# HTML + GSAP motion graphics → video

The approach popularised by Hyperframes: build each scene as an HTML page,
animate with a **paused** GSAP timeline, then step the timeline frame by frame
in a headless browser and encode the screenshots. Web layout + typography +
SVG make it the fastest way to good-looking motion design.

If the official `hyperframes` skill/CLI is installed, follow its docs for the
render command and composition format. Otherwise use the bundled
`scripts/render_html.mjs` (Playwright + ffmpeg), which only needs the page to
expose `window.seek(t)` and `window.DURATION`.

## Page template

```html
<!doctype html>
<html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Prompt:wght@400;800&display=block" rel="stylesheet">
<style>
  html,body{margin:0;width:1080px;height:1920px;overflow:hidden;background:#0d0d12;font-family:'Prompt',sans-serif}
  .stage{position:relative;width:100%;height:100%}
  .title{position:absolute;left:80px;right:80px;top:700px;color:#fff;font-size:120px;font-weight:800;line-height:1.15}
  .word{display:inline-block}
</style></head>
<body><div class="stage">
  <div class="title"><span class="word">ทำวิดีโอ</span> <span class="word">ด้วยโค้ด</span></div>
</div>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"></script>
<script>
  const tl = gsap.timeline({ paused: true });
  tl.from(".word", { y: 140, opacity: 0, duration: 0.6, ease: "power3.out", stagger: 0.12 })
    .to({}, { duration: 2 })                                   // hold
    .to(".word", { y: -80, opacity: 0, duration: 0.4, ease: "power2.in", stagger: 0.06 });
  window.seek = t => { tl.seek(t, false); };   // braces: don't return the timeline (it's a thenable)
  window.DURATION = tl.duration();
</script></body></html>
```
Render:
```bash
# <skill-dir> = where this skill is installed (~/.claude/skills/video-studio, ~/.codex/skills/video-studio, ~/.agents/skills/video-studio …)
# Install the npm package in the project (not in the skill folder): npm i playwright && npx playwright install chromium
node <skill-dir>/scripts/render_html.mjs scene.html out/scene_v001.mp4 --w 1080 --h 1920 --fps 30
```
Preview a range first: `--from 0 --to 1.5`. Transparent overlay for
compositing on footage: give `body` `background:transparent` and add
`--alpha` (outputs ProRes 4444 `.mov`), then:
`ffmpeg -i footage.mp4 -i overlay.mov -filter_complex "[0:v][1:v]overlay" -c:a copy out/comp_v001.mp4`.

## Rules that make it render correctly

- **Everything on the one paused timeline.** No CSS `transition`/`animation`,
  no `setTimeout`, no `requestAnimationFrame` loops, no autoplaying `<video>`.
  Anything not driven by `seek(t)` will be frozen or random in the render.
- **Randomness must be seeded** (write a tiny mulberry32 and seed it), so
  particles look the same in every render.
- **Fonts:** use `display=block` and the script waits on `document.fonts.ready`;
  prefer local font files in a `fonts/` folder for offline, reproducible renders.
- **Size the page in pixels** equal to the output resolution; don't rely on
  `vw/vh` responsive tricks.
- **Video inside the page:** set `video.currentTime = t` inside `seek` and
  `await` the `seeked` event — or better, composite footage in ffmpeg.
- **Split long pieces into scenes** (one HTML per scene, 3–10 s each) and join
  with ffmpeg; it keeps iteration fast.

## Motion-design craft with GSAP

- Eases: `power2/3.out` to enter, `power2.in` to exit, `power3.inOut` to move,
  `back.out(1.6)` for playful pops, `expo.out` for snappy premium UI.
- Stagger text by word or character (split manually into `<span>`s; GSAP's
  SplitText plugin is free since 3.13 if available). For Thai, split by
  *word*, never by character — splitting separates vowels and tone marks from
  their consonants.
- Use labels for structure: `tl.addLabel("logo", 2.0)` then position tweens
  at `"logo"` / `"logo+=0.2"`; changes in one scene then don't shift everything.
- Overlap tweens (`"-=0.2"`) so movement flows instead of queuing.
- SVG: animate `strokeDashoffset` for line drawing, `transformOrigin` for
  rotations, `motionPath` (plugin) for paths.
- Keep 0.3–0.5 s of stillness at the start and end of every scene — it gives
  editors room for transitions.

## Common pieces

- **Lower third:** bar scales in from `scaleX:0` (transformOrigin left) 0.4 s
  → name slides up 0.3 s → title fades 0.25 s; hold; reverse to exit.
- **Logo reveal:** mask/clip-path wipe or stroke draw → fill fade → slight
  scale 0.96→1 settle → tagline stagger.
- **Kinetic typography:** one idea per beat; vary scale/weight for emphasis;
  cut on the music beat (get beat times from the user or `aubio`).
- **Data callout:** count numbers by tweening an object `{v:0}` and writing
  `Math.round(v)` into the DOM in `onUpdate`.

## One timeline for picture, captions and sound (films longer than ~30 s)

Keep every time in one data file (`timeline.json`): section offsets, chosen voice takes, named beats
(`"reveal": {"sec": 4, "t": 8.15}`), shots, captions (text from the script, times from alignment), sound cues
by beat name. The page loads it (inline it at build time with a small `build_film.py`, or `fetch` it) and the
mixer imports the same file; `cues.json` for the sound checks is generated from it. In one 2:30 film the
section offsets, shot times and hit times were typed into both the page and the mixer by hand; the copies
drifted and every re-timed voice take meant editing literals in three places.

Split the page into a reusable runtime (seek, camera, grain, fog, captions engine, chapter cards, hits) and the
story-specific scenes, so the next film copies the runtime instead of starting over.

## Render: fast, partial, previews

| Need | Command (run where `node_modules/playwright` is) |
|---|---|
| Full film, parallel (≈8× faster: 6 browsers + ffmpeg, chunks joined without re-encode) | `node <skill-dir>/scripts/render_fast.mjs film.html out/film_v001.mp4 --workers 6` |
| Re-render only changed seconds and splice them in | `python <skill-dir>/scripts/splice.py film.html out/film_v001.mp4 out/film_v002.mp4 "25.5-27.1"` |
| Stills every 1.5 s + contact sheet | `node <skill-dir>/scripts/stills.mjs film.html work/stills --every 1.5 --sheet work/sheet.png` |
| Transparent overlay (ProRes 4444) | `render_html.mjs ... --alpha` (single browser) |

A full single-browser render of 150 s took ~94 min; a 5 s test went from 164 s to 21 s with 6 workers, which
scales to ~11 min for the same film (CPU-bound: measure on your machine). Don't use `--gpu` on
Windows (headless Chrome hung). A partially written MP4 can't be probed ("moov atom not found") until the
render ends.

## QA scans before the full render

```bash
node <skill-dir>/scripts/qa_scan.mjs film.html --fps 30        # DOUBLE pops, caption overlaps, text in UI zones
node <skill-dir>/scripts/extract_events.mjs film.html events.json   # the spotting sheet for sound (sound.md)
```
`qa_scan` exits 1 on a problem; JUMP lines are informational (expected on hard cuts and flashes). Mark text that
may sit anywhere with `data-qa-ignore`, a logo the caption must not touch with `data-qa-logo`. For 16:9 add
`--nosafe` or set `--top/--bottom/--side`.

## Known traps (each cost a re-render once)

- **Double pop:** `fromTo(..., {immediateRender:false})` on an element reused later leaves it visible from its
  previous use: it flashes, vanishes, then animates in. `tl.set(el, {opacity:0}, start)` first.
- A CSS rule like `#shot img{...}` hits every image inside, overlays included: give overlays their own selector.
- Text on a zooming layer drifts off-frame: set `transform-origin` near the text. Text on a slanted sign: skew,
  never rotate.
- Stacked title lines appear top to bottom (line 1, then line 2); a bottom-first build reads as a mistake.
- A "lights out" overlay goes above drawn marks (rings, stamps, notes) or they float lit in a dark frame.
- Things entering from under/behind something need a clip-path at that edge.
- Fonts and GSAP from a CDN make renders depend on the network: vendor `gsap.min.js` and font files for
  long jobs; emoji need a font that has them (Thai faces don't).
- Captions and labels in the bottom ~35% of a 9:16 frame sit under TikTok/Reels/Shorts UI (`SKILL.md` §3).
- Elements that animate `from` must be hidden in their initial state, or they flash at frame 0.

## Verify

Contact sheet of the render (`ffmpeg-cutting.md` §Evidence) + frames at every label time and every event;
`qa_scan.mjs` clean; frame count = fps × duration; fonts render (no tofu boxes).
