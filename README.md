# video-studio

An all-in-one Claude Code skill for video work: **direction, editing,
animation and sound** in one place.

| Area | What it covers |
|---|---|
| Direction | Creative concept from the subject, art-direction style bible, shot list, storyboard, director's critique |
| Editing | ffmpeg trim, join, reformat (9:16), speed and loudness; silence removal (auto-editor); talking-head recuts |
| Captions | Whisper transcription, burned-in and karaoke ASS subtitles, Thai-safe fonts |
| Animation | HTML + GSAP motion graphics rendered to video, Remotion, Lottie, Manim |
| Sound | Music beds, SFX placement, sync to cuts, optional [earshot](https://github.com/Leonxlnx/earshot) for listening checks |
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
scripts/render_html.mjs   renders a deterministic HTML/GSAP/Lottie page to MP4 (Playwright + ffmpeg)
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

Not yet tested: macOS, Remotion, earshot, auto-editor, Manim with LaTeX.

## Credits

The principles were distilled and rewritten from public sources, not copied:
heygen-com/hyperframes, greensock/gsap-skills, lottiefiles/motion-design-skill,
diffusionstudio/lottie, adithya-s-k/manim_skill, affaan-m/ecc,
digitalsamba/claude-code-video-toolkit, WyattBlue/auto-editor,
leonxlnx/taste-skill, Leonxlnx/earshot, smixs/creative-director-skill
(CC-BY-4.0) and nexu-io/open-design, plus the official Remotion, Manim,
Whisper and FFmpeg documentation.
