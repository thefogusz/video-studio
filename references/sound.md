# Sound: sources, spotting, mix, and checking it without ears

Picture is half the film. Most code-made videos fail on sound: effects with nothing on screen causing them, music
on top of a silent world, hits that bury the word they answer, clicks at every cut. The agent cannot hear, so
every decision here is derived from the picture code and checked with measurements (and earshot, if installed).

## 1. Sources: decide real vs generated with the user first

Ask once: does the brief want **real recorded / professionally produced sound**, or is a designed synthetic
palette fine? Story and documentary work often wants the first; a tech launch film may want the second.

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

## 3. Spotting from the picture code

Get the visual events from the page itself (`scripts/extract_events.mjs film.html events.json`: cuts, appear /
vanish, moves, strokes being drawn), then write a spotting table into the mixer (shot, in, out, place, what
moves) instead of placing sounds from memory. How dense, how many hits, music over or under the world: those are
style choices for the brief (one tested set is in `preset-narrated-reel.md`).

Technical rules that hold for any style:
- **Trim every one-shot.** A 120 s ambience file placed as a short event ran under a whole film and was heard as
  a music bug. `x[:int(sec*SR)]` + fade, always.
- **Cue times are event times:** whooshes align on their peak, risers on their end, impacts on their attack
  (measured, not the file start). Write that time into `cues.json` with `align` (`onset` / `peak` / `end` /
  `bed`), or every checker reports false misses.
- Ambience beds that change with a cut usually start 0.2–0.5 s before it (sound leads picture).
- A hit on a key word buries the word: use word times from the timeline to place hits in gaps.

## 4. Mix and master

- Voice always wins: duck music 12–18 dB under speech with an envelope follower (or `sidechaincompress`).
- A deterministic numpy mixer (place clips by time, duck, write stems + `cues.json`) is reproducible and cheap
  to re-run; vectorise the envelope (a per-sample Python loop took 50 s for 2.5 min).
- Master: two-pass loudnorm to -14 LUFS for social, TP -2.0 in the WAV so the AAC upload stays ≤ -1.0 dBTP;
  check the encoded MP4, not only the WAV. A late addition (a sting) is lowered on its own, never the whole master.
- earshot's critique flags an ending far quieter than the body (a 5 s fade into silence scored "major"); end on a
  sound if the brief allows.

## 5. Check before anyone listens

```bash
node <skill-dir>/scripts/extract_events.mjs film.html events.json
python <skill-dir>/scripts/check_sfx.py --cues mix/cues.json --events events.json --stems mix/stems [thresholds]
earshot timeline out/film.mp4 --cues mix/cues.json      # every cue OK or "near" (≤ 100 ms); fix NO HIT / CHECK
earshot critique mix/master.wav                          # scorecard; run it BEFORE the full picture render
```
- `check_sfx.py` measures orphans (effects with no picture event), hit count and spacing, density during
  narration, voice clarity per line and ambience vs music. Its default thresholds are the narrated-reel preset;
  pass your own for other styles.
- Sync: sound onset within -20 / +40 ms of the event frame; fail beyond -40 / +60 ms (EBU R37). Hits 0 to +1 frame.
- Run the critique before the full render: a problem found after a long render started costs the whole render.

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
