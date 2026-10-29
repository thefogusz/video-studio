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

```bash
npx skills add thefogusz/video-studio -g
```
Or copy this folder to `~/.claude/skills/video-studio/`.

## Layout

```
SKILL.md                 router + shared workflow + craft principles
references/              one file per technique, loaded only when needed
scripts/render_html.mjs  renders a deterministic HTML/GSAP page to MP4 (Playwright + ffmpeg)
```

Requirements depend on the technique: ffmpeg for everything; Node and
Playwright for HTML rendering; Python for Whisper, Manim and auto-editor.

## Credits

The principles were distilled and rewritten from public sources, not copied:
heygen-com/hyperframes, greensock/gsap-skills, lottiefiles/motion-design-skill,
diffusionstudio/lottie, adithya-s-k/manim_skill, affaan-m/ecc,
digitalsamba/claude-code-video-toolkit, WyattBlue/auto-editor,
leonxlnx/taste-skill, Leonxlnx/earshot, smixs/creative-director-skill
(CC-BY-4.0) and nexu-io/open-design, plus the official Remotion, Manim,
Whisper and FFmpeg documentation.
