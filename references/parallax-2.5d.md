# 2.5D parallax: making still images feel alive

Use this when a video is built from illustrations, paintings, photos or generated images: story and history
channels, documentaries, explainers, mystery and true crime, children's stories, product "worlds". The page is
the HTML/GSAP film (`html-gsap-motion.md`); this file is what to put on it.

A slow zoom on stacked layers reads as "just zooming in and out". Stills feel alive mostly through motion
*inside* the frame (light, atmosphere, a small prop move), tied to the story beat and, where it would make a
noise, to a sound. How much motion is a style choice for the brief.

## 1. Plan layers before generating images

- Ask for **separated depth planes** in the image prompt (foreground object, subject, midground, far background,
  atmosphere between them). A flat composition cannot be split convincingly later.
- Split routes, best first:
  1. generate the plate and each layer as separate images from the same prompt and reference (subject on a plain
     background, then cut out);
  2. an image-edit model asked to "remove the subject, fill the background" (plate) + "the subject alone on flat
     grey" (cut-out);
  3. a segmentation / depth model (SAM, Depth Anything) on the finished image, then inpaint the hole.
- **Align every cut-out to its plate** (edit models return layers resized or re-framed). Measure the pixel error
  of cut-out vs the original; if it stays high, do not animate that layer: use the full image as the plate.
- Some subjects are refused by edit models (a hooded killer, weapons): plan that shot's motion as light, fog and
  sound instead of figure motion.

## 2. Physical sense (viewers report these as bugs, in any style)

Stylised motion is fine; it has to be *seamless*.
- Things standing on ground painted in the plate (people, cars, chairs) get the **same parallax depth as that
  ground**. Depth comes from true foreground objects (branches, railings, a car close to camera), fog and sky.
- Zoom ground-touching layers **around their feet**, or the feet slide.
- Motion follows the pose: a figure walking away shrinks and rises; never scale it toward camera while its legs
  walk away; no sideways slides of standing figures or parked cars.
- Rigid things (poles, walls, door frames, parked cars) never skew, bend or bounce. Only cloth, paper corners,
  smoke, light and particles move freely.
- A **shadow drawn in code** = its owner's opacity × its light's level. When the person vanishes, the shadow
  vanishes; when the lamp flickers, the shadow flickers.
- **A light that dies** dims the whole area it lit, strongest near the source (use the image's own bright pixels
  as the mask). A black blob on the bulb leaves the scene lit.
- A light painted static (flashlight pool, light shaft) flickers in place; it never swings or slides.
- Anything entering "from under / behind" something (an envelope under a door) needs a clip-path at that edge, or
  it slides in on top.
- Smoke is thin rising strands from a source, not round puffs. Foreground slides ~50 px, not 140.
- Props keep their real shape; different people look different (age, build, face, hair, headwear). Check objects
  and faces in every multi-person shot before anyone else sees it.

## 3. A starting per-shot template (a 6–10 s shot; adjust to the style)

- 1 camera move, different from the previous shot's (truck / crane / orbit / push / pull / static) + handheld drift
- 2–3 element motions (from the table below)
- 1 light or atmosphere event on a narration beat
- sound: a location bed starting 0.3–0.5 s before the cut + 1–2 real sounds for the moving elements (`sound.md`)
- optional accent (≤ 3–4 big hits and ≤ 3 whip pans per film)

## 4. Techniques (parameters for 30 fps, 1080×1920; starting points)

| Technique | Parameters | Layers | Sound |
|---|---|---|---|
| Practical-light flicker relighting the scene (glow + warm overlay + shadow on ONE noise signal) | 5–9 Hz, ±5–10% | light-only layer or gradient mask | lantern / gas hiss |
| Fog sheets between layers, speed by depth; a gust speeds them 3× | 6–50 px/s | none | wind gust on the speed-up |
| Truck / crane / orbit instead of push | depth factors .15 / .45 / 1 / 1.7; subject travel 40–90 px; total zoom ≤ 4% | bg / subject / fg | — |
| Handheld drift on every shot | 3–6 px, 0.15–0.3°, sum of 2–3 sines, periods 7–12 s | none | — |
| Pendulum swing (lantern, sign) | 2–5°, period 1.6–2.4 s, around the pivot | prop + plate without it | creak at each end |
| Particles per depth plane (rain, dust in a beam, embers, snow) | positions from t | none | rain / room bed |
| Rack focus between layers (pre-blurred copies crossfaded) | 0.8–1.2 s, lands on a keyword | layers | — |
| Breathing on figures | scaleY +0.6–1.2%, 3.5–4.5 s, origin at the feet | subject | — |
| Cloth flutter (SVG feDisplacementMap under a mask) | 3–8 px | subject + mask | cloth rustle |
| Shadow passing across a wall | gradient shape over 1–2 s | none | footsteps on each step |
| Lightning reveal: lit plate + hidden figure for 2–4 frames | thunder 0.3–1.5 s after | lit plate, figure | thunder |
| Door opening with a light wedge | 25–40°, stutters | door + plate | creak per stutter |
| Whip pan between shots | 1200–1600 px over 6–8 frames + blur | — | whoosh peaking on the cut |
| Big reveal: speed ramp, 3–4 frame hit-pause, shake 18–30 px decaying ~0.12 s, RGB split 4–8 px | after 0.4–1 s of near-silence | — | impact on the frame |
| Film burn / flicker | chapter breaks only | — | — |
| Eyes blink in darkness | 4–5 frames per blink | eyes layer | — |

All motion is a pure function of t: sines, seeded noise (`mulberry32`, a hash), positions computed from t. Never
accumulate state frame to frame, or `seek` breaks.

## 5. Genre dials (swap these; the method stays)

| Genre | Camera | Element motion | Light | Accents |
|---|---|---|---|---|
| Mystery / horror / true crime | slow, low, uneasy; drift always | fog, flicker, shadows, a figure that should not be there | one source chosen by the beat; light dies on bad news | 1–3 jump scares on the threat, never on a real victim |
| History / documentary | measured trucks and cranes, map moves | smoke, flags, crowds breathing, paper and ink | daylight, period practicals | stamps, map pins, date cards |
| Science / explainer | clean pushes to the detail | diagrams drawing on, labels, particles with meaning | flat, even | counters, highlights |
| Kids / whimsical | bouncy, overshoot, squash | everything breathes, wiggles | warm, saturated | pops, sparkles, cartoon foley |
| Product / brand world | smooth orbits, macro pushes | the product's own moving parts, steam, light sweeps | studio key + rim | one reveal hit + logo |

## 6. Check before rendering the whole film

- Stills at the start, middle and end of every shot (`scripts/stills.mjs --every 1.5 --sheet`): something other
  than the camera has moved; every multi-person shot checked for faces and props.
- `scripts/qa_scan.mjs`: no DOUBLE, no caption overlap, nothing in the UI zones.
- `scripts/extract_events.mjs` → `scripts/check_sfx.py`: every moving element that makes noise in the world has
  its sound, and no sound has nothing moving.
