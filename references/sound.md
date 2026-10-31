# Sound: sources, spotting, mix, and checking it without ears

Picture is half the film. Most code-made videos fail on sound: effects with nothing on screen causing them, music
on top of a silent world, hits that bury the word they answer, clicks at every cut. The agent cannot hear, so
every decision here is derived from the picture code and checked with measurements (and earshot, if installed).

## 1. Sources: decide real vs generated with the user first

Ask once: does the brief want **real recorded / professionally produced sound**, or is a designed synthetic
palette fine? A narrated story channel rejected synths and code-made sound outright ("our stories don't suit
digital sound"); a tech launch film may want exactly that.

| Source | Use | Licence |
|---|---|---|
| The user's shared asset bank (if they keep one) | first look; already reviewed | recorded per file |
| Artlist / Epidemic / other paid libraries (Artlist has an MCP) | ambience, foley, hits, music for monetised channels | per subscription; log each file in `sfx/SOURCES.md`. Artlist links returned 403 after ~25 downloads a day: fetch the essentials first |
| Freesound | gaps | CC0 or CC BY only (credit it); skip NC |
| Sonniss GDC bundles | hits, foley, ambience | free, no attribution; multi-GB, ask before downloading |
| Generative SFX / music (ElevenLabs, etc.) | fast drafts, sounds no library has | paid; output can read synthetic: gate it |
| earshot `sfx` / `kit` bank, `forge` | UI / launch-film sounds made in code | only when synthetic is acceptable |
| BBC Sound Effects | personal / research only | RemArc licence is non-commercial |
| Music from YouTube / Spotify | never | not licensed for delivery |

Keep a **shared bank** across projects (folder + `bank.json` with source, licence, gate scores): a sound that
passed review once is reused instead of regenerated.

## 2. Gate every file (earshot)

[earshot](https://github.com/Leonxlnx/earshot) (MIT, CPU, CLI + Python + MCP) gives the agent measurements of what
a sound is. Install (tell the user: ~1.1 GB of models):
```bash
git clone https://github.com/Leonxlnx/earshot && cd earshot && python3 -m venv .venv
# macOS/Linux: PY=.venv/bin/python   Windows: PY=.venv/Scripts/python
$PY -m pip install torch --index-url https://download.pytorch.org/whl/cpu   # macOS: plain `pip install torch`
$PY -m pip install -e ".[mcp]" && $PY -m earshot doctor --load
```
Keep ONE install per machine and point every project at it. Many calls → one Python script or the MCP server
(models load once). Windows: `PYTHONUTF8=1`, `EARSHOT_THREADS=2-3`.

Per file: `find` the best trim → `describe` it → `match` z ≥ 3 for what it should be (with realistic `--alts`, e.g.
whistle vs kettle) → `realness` on the trim when the brief wants real sound. Failed files: re-source or drop.
Measured once: hounds were heard as insects, a police whistle as a kettle, a bell matched at z 1.6 and was dropped.

## 3. Spotting: one row per shot, from the picture code

Get the visual events from the page itself (`scripts/extract_events.mjs film.html events.json`), then write the
spotting table into the mixer (never from memory): shot, in, out, place, what moves, off-screen threat.

1. **Ambience per place.** One bed per location, starting 0.3 s before the cut and ending ~0.1 s after the next,
   so the sound changes with the picture. Title cards and graphic boards get no ambience (paper / pen only).
2. **Effects only on visible motion.** Each thing that moves and would make a noise gets one sound whose attack
   lands on the frame the motion peaks or ends. No sound for things that do not move. Off-screen sounds only as
   deliberate implied events, quiet, labelled `offscreen:` in the cue id.
3. **Graphics (kinetic type, stamps, boards):** text that slams in gets a short real whoosh into a real paper /
   stamp touch at about -31 dB — silence there was heard as "the motion sounds are missing". A pen scratch only
   where a line is visibly drawn by hand (≥ 0.4 s); highlighter swipes and things that just appear get none. Choose
   by what the viewer *sees*, not by the element type in the code. One sound per group appearing together.
4. **Hit budget.** 2–3 big hits per 2–3 min, ≥ 40 s apart, each after a 0.7–1.5 s lull (music -16 dB, ambience
   -12 dB). Smaller accents ≤ 1 per 10–15 s. Put hits in the **gaps between words** (word times from the
   timeline): a hit on a key word buries it.
5. **One recurring motif** (heartbeat, drip, clock, a musical figure) that returns 2–3 times and grows.
6. **Music under the world:** in every picture shot the ambience is within 3 dB of the music or above it; music is
   present from frame 0 and follows the story's energy with a gain curve (calm, build, lull, swell, question).
7. **At most voice + music + 1–3 effects at once.**
8. **Trim every one-shot.** A 120 s ambience file placed as a "stutter" event ran under the whole film and the
   owner heard it as a music bug. `x[:int(sec*SR)]` + fade, always.
9. **Cue times are event times:** whooshes align on their peak, risers on their end, impacts on their attack
   (measured, not the file start). Write that time into `cues.json` with `align` (`onset` / `peak` / `end` / `bed`),
   or every checker reports false misses.

## 4. Mix numbers (narrated shorts; starting points)

| Element | Level |
|---|---|
| Voice | each line toward -19 dB RMS (±4) |
| Music | ~-25 dB RMS, ducked -12 dB under the voice (envelope follower) |
| Ambience | -28 to -33 dB RMS, ducked -7 under the voice |
| Effects | duck -5 under the voice; drop 3–6 dB when landing on a word |
| Hits | keep their first 0.25 s through the duck; tail fade 0.6–1.6 s so they never ring under the next line |
| Ending | not more than ~10 LU below the body; no 5 s fade into silence (end on a sting / logo hit) |
| Master | two-pass loudnorm to -14 LUFS, TP -2.0 in the WAV (≤ -1.0 on the AAC); a late sting is lowered alone, never the whole master |

A deterministic numpy mixer (place clips by time, duck with an envelope follower, write stems + `cues.json`) is
reproducible and cheap to re-run; vectorise the envelope (a per-sample Python loop took 50 s for 2.5 min).

## 5. Check before anyone listens

```bash
node <skill-dir>/scripts/extract_events.mjs film.html events.json
python <skill-dir>/scripts/check_sfx.py --cues mix/cues.json --events events.json --stems mix/stems
earshot timeline out/film.mp4 --cues mix/cues.json      # every cue OK or "near" (≤ 100 ms); fix NO HIT / CHECK
earshot critique mix/master.wav                          # scorecard; run it BEFORE the full picture render
```
- `check_sfx.py` must print PASS (orphans, hit budget, density, voice clarity, world vs music).
- Sync: sound onset within -20 / +40 ms of the event frame; fail beyond -40 / +60 ms (EBU R37). Big hits 0 to +1 frame.
- Run the critique before the full render: a quiet ending found after the render started cost a full re-render.
- Then the human question: "does every sound belong to something on screen?"

Without earshot, check sync from waveforms around each cut:
```bash
ffmpeg -ss 2.8 -t 0.6 -i out.mp4 -filter_complex "showwavespic=s=1200x200" -frames:v 1 work/wave_cut3.png
```

## 6. Placing a few effects with ffmpeg only

```bash
ffmpeg -i video.mp4 -i whoosh.wav -i hit.wav -filter_complex \
 "[1:a]adelay=2400|2400,volume=0.6[w];[2:a]adelay=3000|3000,volume=0.9[h];[0:a][w][h]amix=inputs=3:duration=first:normalize=0[a]" \
 -map 0:v -map "[a]" -c:v copy out/sfx_v001.mp4
```
`adelay` is milliseconds per channel; `normalize=0` stops amix lowering everything. Fade every edit a few ms.
