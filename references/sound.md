# Sound: music, SFX, sync — and letting the agent "hear"

Picture is half the film. Most code-made videos fail on sound: effects that
land late, music that swells in the wrong place, clicks at every cut.

## Craft

- **Layers:** dialogue/voice-over (always wins) → SFX (whooshes, hits, UI
  pops, foley) → music bed. Mix voice around -16 to -14 LUFS short-term,
  duck music 12–18 dB under speech (`ffmpeg-cutting.md` §Audio).
- **Sync:** hits/impacts land *on* the cut frame; taps and clicks slightly
  lead the visual (1–2 frames) so they feel causal; whooshes peak just after
  the cut they carry. A hit 80 ms late reads as wrong.
- **Music:** cut picture to the beat — get beat times first (from the user,
  `aubio beat`, `librosa.beat.beat_track`, or earshot `timeline`), then place
  cuts on beats/bars. Edit music at bar lines with short crossfades; end on a
  musical resolution, not a fade-out mid-phrase, where possible.
- **Restraint:** not every motion needs a sound. Sound the important beats.
- **Fades:** a few ms fade on every audio edit removes clicks.
- **Rights:** only use music/SFX the user owns, licensed, or generated.
  Never pull tracks from YouTube/Spotify for a deliverable.

## Placing SFX with ffmpeg

```bash
# whoosh at 2.40 s, hit at 3.00 s, mixed under existing audio
ffmpeg -i video.mp4 -i whoosh.wav -i hit.wav -filter_complex \
 "[1:a]adelay=2400|2400,volume=0.6[w];[2:a]adelay=3000|3000,volume=0.9[h];[0:a][w][h]amix=inputs=3:duration=first:normalize=0[a]" \
 -map 0:v -map "[a]" -c:v copy out/sfx_v001.mp4
```
`adelay` is in milliseconds per channel; `normalize=0` stops amix from
lowering everything.

## earshot — ears for the agent (optional, recommended)

[earshot](https://github.com/Leonxlnx/earshot) (MIT, CPU-only, CLI + Python +
MCP server) turns audio into evidence an agent can reason about, and can
synthesise sound effects in code. Use it when sound quality or sync matters
and you otherwise couldn't check it.

Install (Python 3.10+, ffmpeg on PATH; first use downloads ~1.1 GB of models;
tell the user before installing):
```bash
git clone https://github.com/Leonxlnx/earshot && cd earshot
python -m venv .venv
.venv/Scripts/python -m pip install torch --index-url https://download.pytorch.org/whl/cpu
.venv/Scripts/python -m pip install -e ".[mcp]"
.venv/Scripts/python -m earshot doctor --load
```
Useful commands (check `earshot --help`; the tool is evolving):
- `earshot describe FILE` — what a sound is, in words.
- `earshot match FILE "description"` / `rank QUERY files…` — pick the best
  SFX candidate for a moment.
- `earshot find LONG.wav "a single key press" --top 4` — pull the best
  moments out of a recording.
- `earshot timeline film.mp4 --video film.mp4` — listening transcript with
  events, loudness, beat grid and sound-to-cut sync.
- `earshot critique film.mp4` — scorecard against professional launch films
  with prioritised fixes.
- `earshot sfx` / `earshot kit` — render whooshes, hits, clicks, notes from
  its code-made bank aimed at picture moments; `earshot forge` makes new
  sounds by listening and iterating.
For many calls, run it as an MCP server (`earshot mcp`) so the models load
once.

Without earshot, verify sync by extracting audio around each cut and
checking waveform peaks against cut frames:
```bash
ffmpeg -ss 2.8 -t 0.6 -i out.mp4 -filter_complex "showwavespic=s=1200x200" -frames:v 1 work/wave_cut3.png
```
