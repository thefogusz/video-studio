# video-studio

An all-in-one Claude Code skill for video work: **direction, editing,
animation and sound** in one place.

| Area | What it covers |
|---|---|
| Direction | Creative concept from the subject, style bible, 4-second hook, shot list, storyboard, director's critique, series memory |
| Narration | Script for the ear, TTS takes, audio-tag restraint, forced-alignment timing |
| Images | Generated stills on a budget, style consistency, fixing the "AI look" |
| 2.5D parallax | Layered stills with element motion, light events and physical-sense rules |
| Editing | ffmpeg trim, join, reformat (9:16), speed and loudness; silence removal (auto-editor); talking-head recuts |
| Captions | Whisper transcription, burned-in and karaoke ASS subtitles, Thai-safe fonts |
| Animation | HTML + GSAP motion graphics rendered to video, Remotion, Lottie, Manim |
| Sound | Licensed sources, spotting from the picture code, mix numbers, hit budget, measured checks, optional [earshot](https://github.com/Leonxlnx/earshot) |
| Render + QA | Parallel render (~8x), partial re-render, scans for double pops, caption overlaps and UI safe zones |
| Delivery | Final checks on the encoded file, cover, per-platform copy, safe clean-up |
| Handoff | Premiere, Resolve, After Effects and CatCut via FCP7 XML, FCPXML or EDL |

## Install

Works with **Claude Code** and **Codex** on **Windows, macOS and Linux**.

```bash
npx skills add thefogusz/video-studio -g -a claude-code codex
```
Or clone and copy the folder:

| Agent | Folder |
|---|---|
| Claude Code | `~/.claude/skills/video-studio/` |
| Codex | `~/.codex/skills/video-studio/` (or `~/.agents/skills/video-studio/`) |

Codex reads `agents/openai.yaml` for its display name and starter prompt
(`$video-studio`).

## Requirements

Install only what the technique you use needs:

| Tool | macOS | Windows | Used for |
|---|---|---|---|
| ffmpeg | `brew install ffmpeg` | `winget install Gyan.FFmpeg` | everything |
| Node + Playwright | `npm i playwright && npx playwright install chromium` (in your project) | same | HTML/GSAP and Lottie rendering |
| Whisper | `pip3 install openai-whisper` | `pip install openai-whisper` (run with `PYTHONUTF8=1`) | captions |
| PyThaiNLP | `pip3 install pythainlp` | `pip install pythainlp` | Thai word timing |
| Manim | `pip3 install manim` (+ MacTeX for formulas) | `pip install manim` (+ MiKTeX for formulas) | explainer animation |
| auto-editor | `pip3 install auto-editor` | `pip install auto-editor` | silence removal |

## Layout

```
SKILL.md                  router, shared workflow, craft and platform notes
agents/openai.yaml        Codex UI metadata
references/               one file per technique, loaded only when needed
scripts/render_html.mjs   renders a deterministic HTML/GSAP/Lottie page to MP4 (single browser, --alpha)
scripts/render_fast.mjs   the same in parallel chunks (~8x faster)
scripts/splice.py         re-renders only changed seconds and splices them into a render
scripts/stills.mjs        stills at given times or every N s, plus a contact sheet
scripts/qa_scan.mjs       double pops, caption overlaps, text in the platform UI zones
scripts/extract_events.mjs  visual events (cuts, appear, moves, strokes) for sound spotting
scripts/check_sfx.py      mix vs picture: orphans, hit budget, density, voice clarity, world vs music
scripts/_page.mjs         shared Playwright helpers
scripts/thai_words.py     merges Whisper's Thai sub-word timestamps into words
```

## Tested

Tested on Windows 11 with ffmpeg 9.0.1, Python 3.11, Node 25 and
Playwright 1.64:

- ffmpeg recipes: trim, join, 9:16, speed, loudnorm, burned and karaoke Thai subtitles
- talking-head recut script
- HTML/GSAP render and Lottie render
- Manim with Thai text (without LaTeX)
- Whisper Thai transcription and `thai_words.py`
- `render_fast.mjs`, `splice.py`, `stills.mjs`, `qa_scan.mjs`, `extract_events.mjs`, `check_sfx.py` on a test page
  (each check proven to fire); the rules come from five finished 2–3 minute narrated shorts

Not yet tested: macOS, Remotion, auto-editor, Manim with LaTeX.

## Credits

The principles were distilled and rewritten from public sources, not copied:
heygen-com/hyperframes, greensock/gsap-skills, lottiefiles/motion-design-skill,
diffusionstudio/lottie, adithya-s-k/manim_skill, affaan-m/ecc,
digitalsamba/claude-code-video-toolkit, WyattBlue/auto-editor,
leonxlnx/taste-skill, Leonxlnx/earshot, smixs/creative-director-skill
(CC-BY-4.0) and nexu-io/open-design, plus the official Remotion, Manim,
Whisper and FFmpeg documentation.
