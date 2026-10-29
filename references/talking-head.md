# Talking-head recut

Goal: turn a raw take of someone speaking to camera into a tight, watchable
cut — fillers, false starts, retakes and long pauses removed — without
clipping words or making it feel robotic.

## Pipeline

1. **Probe and normalise** the source (CFR, 48 kHz audio) — see
   `ffmpeg-cutting.md`.
2. **Transcribe with word timestamps** (see `captions.md`):
   `whisper work/audio.wav --model medium --language th --word_timestamps True --output_format json`
   For Thai use `medium` or `large-v3`; `small` misses many words.
3. **Build the keep-list as data** (`work/cuts.json`): a list of
   `{start, end, text}` segments to keep, derived from the words.
   Remove:
   - fillers — Thai: เอ่อ, อ่า, อืม, แบบว่า, คือแบบ, ก็คือ (only when used as a
     filler); English: um, uh, like, you know, so (sentence-initial)
   - false starts and repeated sentences — when a sentence is said twice,
     keep the **last** complete take (it's usually the one the speaker meant)
   - pauses longer than ~0.35 s (social) / ~0.7 s (YouTube long-form)
   Show the user the removed text before rendering when the content matters.
4. **Pad every kept segment** with 2–4 frames of handle at each side and merge
   segments whose gap is under ~3 frames. This prevents clipped consonants.
5. **Render** with the concat approach: either a trim/atrim filtergraph or one
   file per segment + concat demuxer. Add a 5–10 ms `afade` in/out on each
   audio segment to kill clicks.
6. **Hide jump cuts** (optional, recommended for social): alternate a subtle
   punch-in (scale 1.0 ↔ 1.12, crop centred on the face) on every other
   segment, or cover the cut with B-roll/graphics.
7. **Captions last** — regenerate them from the *edited* audio, not the
   original, so timing matches.
8. **Verify**: watch frames at 5–10 cut points; listen for clipped words
   (extract 2 s of audio around a cut if unsure); check total duration
   matches the plan.

## Segment render sketch (Python generating the ffmpeg command)

```python
import json, subprocess
fps = 30
segs = json.load(open("work/cuts.json"))      # [{"start": 1.23, "end": 4.56}, ...]
parts, labels = [], []
for i, s in enumerate(segs):
    a, b = round(s["start"]*fps)/fps, round(s["end"]*fps)/fps   # snap to frames
    d = b - a
    parts.append(f"[0:v]trim={a}:{b},setpts=PTS-STARTPTS[v{i}];"
                 f"[0:a]atrim={a}:{b},asetpts=PTS-STARTPTS,afade=t=in:d=0.008,afade=t=out:st={d-0.008}:d=0.008[a{i}];")
    labels.append(f"[v{i}][a{i}]")
graph = "".join(parts) + "".join(labels) + f"concat=n={len(segs)}:v=1:a=1[v][a]"
open("work/graph.txt", "w").write(graph)
subprocess.run(["ffmpeg", "-y", "-i", "work/in_cfr.mp4", "-/filter_complex", "work/graph.txt",
                "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-crf", "18", "-pix_fmt", "yuv420p",
                "-c:a", "aac", "-b:a", "192k", "out/recut_v001.mp4"], check=True)
```
`-/filter_complex <file>` reads the graph from a file, which avoids
command-line length limits on Windows when there are hundreds of cuts. That
syntax needs ffmpeg 7+; older builds use `-filter_complex_script <file>`
(removed in newer builds) — check `ffmpeg -version` first.

## Alternatives

- `auto-editor` for a quick silence-only pass (no filler detection).
- Send the cut list to Premiere/Resolve instead of rendering
  (`nle-handoff.md`) when a human editor will finish it.
