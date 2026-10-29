---
name: video-studio
description: >-
  All-in-one video studio: direction, editing, animation, sound. Acts as
  creative/art/film director (concept, style bible, shot list, storyboard,
  critique), then cuts with ffmpeg/auto-editor, recuts talking heads, makes
  Whisper captions, animates with HTML+GSAP, Remotion, Lottie or Manim, syncs
  SFX/music (earshot), and hands off to Premiere/Resolve/After Effects/CatCut.
  Use whenever the user wants to edit, trim, join, resize, subtitle, animate or
  render a video, or make motion graphics, a logo reveal, kinetic type, an
  explainer, an ad, a Reel/Short/TikTok — even if they name no tool.
  Thai triggers: ตัดต่อ, ตัดคลิป, ต่อคลิป, ทำซับ, ใส่ซับ, ตัดช่วงเงียบ,
  ทำแอนิเมชัน, โมชันกราฟิก, ทำวิดีโอ, เรนเดอร์, คลิปสั้น, ตัวหนังสือวิ่ง,
  กำกับ, ไดเรกชัน, อาร์ตไดเรกชัน, สตอรี่บอร์ด, ช็อตลิสต์, ซาวด์, เอฟเฟกต์เสียง.
---

# Video Studio — editing + animation

This skill is a router plus a shared discipline. First decide *what kind of
video work* this is, then read only the matching reference file, then follow
the shared workflow below. The shared workflow is what keeps edits
reproducible and stops "it's done" claims that aren't true.

## 0. Direct before you build (original work only)

For anything original — an ad, launch film, brand video, motion piece,
explainer — or when a result "looks generic/AI-made", read
`references/direction.md` first: creative idea from the subject (not the
category), a style bible (palette, type, composition, motion tone), a shot
list/storyboard, and a director's review at the end. Plan sound at the same
time (`references/sound.md`). Skip this for mechanical edits like trimming,
resizing or subtitling an existing video.

## 1. Pick the technique

| The user wants… | Technique | Read |
|---|---|---|
| Concept, art direction, shot list, storyboard, critique of a cut | Direction | `references/direction.md` |
| Music, SFX, sync of sound to cuts, checking what the audio sounds like | Sound (+ earshot) | `references/sound.md` |
| Trim, join, resize, re-encode, speed, audio level, 9:16 from 16:9 | ffmpeg | `references/ffmpeg-cutting.md` |
| Remove silences / dead air automatically | auto-editor (or ffmpeg silencedetect) | `references/ffmpeg-cutting.md` §Silence |
| Clean up a person talking to camera: fillers, retakes, jump cuts, punch-ins | transcript-driven recut | `references/talking-head.md` |
| Subtitles, burned-in captions, word-by-word karaoke captions | Whisper + SRT/ASS | `references/captions.md` |
| Motion graphics, kinetic type, logo reveal, promo/ad, lower thirds, data callouts | HTML + GSAP rendered to video | `references/html-gsap-motion.md` |
| Same, but the user works in React or wants a reusable parametric template | Remotion | `references/remotion.md` |
| Animation that must play inside an app/website, or go to After Effects later | Lottie JSON | `references/lottie.md` |
| Math, science, diagrams, step-by-step teaching animation | Manim | `references/manim.md` |
| Finish in Premiere / Resolve / After Effects / CatCut, or round-trip with an editor | XML/EDL handoff | `references/nle-handoff.md` |

Mixed jobs are normal (e.g. talking-head recut → captions → animated intro →
9:16 export). Chain the references in that order: **direction first (if
original), then cut, then graphics, then sound/SFX, then captions, then the
final format/loudness pass.** Captions go late because every cut shifts their
timing.

How to choose between the animation engines when more than one fits:
- **HTML+GSAP** — fastest to iterate, best for typography and flat/vector
  motion design, anything that looks like a modern web ad. Default choice.
- **Remotion** — choose when the user already uses React, needs data-driven
  batches (100 personalised videos), or wants a template with props.
- **Lottie** — choose only when the *deliverable* is an animation file for an
  app/web, not a video. Lottie files are tiny and scalable but hand-writing
  them is error-prone, so keep shapes simple.
- **Manim** — choose for equations, graphs, geometry, algorithm walk-throughs.
- **After Effects (via CatCut or Higgsfield `ae_*` tools)** — choose when the
  user has AE and wants an editable project, or needs AE-only effects.

If a more specific skill or tool is installed, prefer it for the deep work and
use this skill for routing and discipline: the `ffmpeg` skill for complex
ffmpeg pipelines, the CatCut MCP / `catcut-editor` for AE-based projects,
Higgsfield `pr_*`/`ae_*` MCP tools for driving a live Premiere/After Effects,
and official `hyperframes` / `remotion-*` skills if present.

## 2. Shared workflow (all techniques)

1. **Brief before tools.** Pin down: platform and aspect ratio (9:16, 1:1,
   16:9), duration, fps, language of captions, brand colours/fonts, and where
   the output goes. If the user gave a reference video or storyboard, read it
   first. Ask only for what you cannot sensibly default; otherwise state the
   defaults you chose (1080×1920 @30fps for Shorts/Reels/TikTok, 1920×1080
   @30fps otherwise, H.264 + AAC, -14 LUFS for social).
2. **Probe every source** with `ffprobe` before cutting: fps (and whether it is
   variable), resolution, rotation metadata, audio channels/sample rate,
   duration. Mismatched fps or VFR phone footage is the #1 cause of drift and
   stutter — normalise it first (see ffmpeg reference).
3. **Never touch the originals.** Work in `work/`, render to `out/` with a new
   versioned name each time (`v001`, `v002` …). Never overwrite a previous
   render — the user may want to compare.
4. **Think in frames, not seconds.** Cut points, animation keyframes and
   caption timings are frames at the project fps. Converting late from seconds
   causes off-by-one flashes and audio pops.
5. **Write the plan as data.** Keep cuts as a list (EDL/JSON/CSV) and animations
   as source files (HTML, .tsx, .py, .json) so any change is a small re-render,
   not a redo. Save the plan next to the output.
6. **Render small first.** Preview at half resolution or a 3–5 s range before a
   full render, especially for animation.
7. **Verify with evidence before saying it's done:**
   - `ffprobe` the output: duration, resolution, fps, codecs, audio present.
   - Extract frames at the start, each cut/transition, and the end
     (`ffmpeg -ss T -i out.mp4 -frames:v 1 f.png`) and actually look at them —
     check for black frames, cut-off text, captions outside the safe area,
     wrong fonts (tofu boxes for Thai).
   - Check loudness (`loudnorm` print or `ebur128`) when audio matters.
   Report what you checked. If something couldn't be checked, say so.
8. **Hand over** the output path, the editable source (plan/HTML/project),
   and how to re-render.

## 3. Craft principles (apply to everything)

- **Pacing:** cut on action or on the end of a thought; remove breaths longer
  than ~0.3 s for social, keep them for documentary. Keep 2–4 frame handles
  around speech so words aren't clipped.
- **Easing:** almost nothing in good motion design moves linearly. Ease-out
  for things entering, ease-in for things leaving, ease-in-out for moves
  across the frame. Overshoot (back/elastic) only for playful brands.
- **Timing:** ~0.3–0.6 s for UI-scale moves, ~0.8–1.2 s for full-frame
  transitions; stagger lists by 0.05–0.12 s. Hold text on screen long enough
  to read twice (≈ 0.3 s per word, minimum 1.2 s).
- **Hierarchy:** one focal point per moment. Animate the most important
  element first or biggest.
- **Safe areas:** for 9:16 social, keep text out of the top ~14% and bottom
  ~20% (platform UI) and ~6% from the sides.
- **Fonts:** Thai text needs a font with Thai glyphs (e.g. Noto Sans Thai,
  Sarabun, Prompt, Kanit, Tahoma). Name it explicitly in every renderer; a
  missing font silently produces boxes.
- **Audio:** fade every audio edit by a few ms to avoid clicks; duck music
  under speech by 12–18 dB; normalise last.
- **Determinism:** animations must be a pure function of the frame number.
  No `setTimeout`, CSS transitions, `Math.random()` without a seed, or
  real-time clocks — they render differently every time.

## 4. Platforms and agents

The skill works in Claude Code and Codex (same `SKILL.md` format; Codex also
reads `agents/openai.yaml`), on Windows, macOS and Linux. `<skill-dir>` in the
references means wherever this folder is installed. Differences that matter:
- **Python:** `python3` on macOS/Linux, `python` (or `py`) on Windows.
- **Install tools:** macOS `brew install ffmpeg` · Windows
  `winget install Gyan.FFmpeg` · Linux `apt install ffmpeg`. Python packages
  via pip, Node packages via npm in the project folder.
- **Thai fonts:** Windows has Leelawadee UI/Tahoma; macOS has Thonburi,
  Sukhumvit Set, Ayuthaya; Noto Sans Thai/Prompt/Kanit must be installed
  (Google Fonts, or `brew install --cask font-noto-sans-thai`).
- **Windows only:** set `PYTHONUTF8=1` before Python tools that print Thai
  (Whisper crashes otherwise); keep working folders on short paths.
- MCP tools named here (CatCut, Higgsfield `pr_*`/`ae_*`) are optional: use
  them only if they're connected in the current agent; otherwise use the
  file-based routes.

## 5. Paid services and installs

Ask before using anything that costs money (AI video/voice generation,
cloud renders) or installing large tools. Free local tools (ffmpeg, Python
packages, npm packages) can be installed after telling the user what and why.

## Credits

Principles distilled (rewritten, not copied) from public skills and docs:
heygen-com/hyperframes (Apache-2.0), greensock/gsap-skills (MIT),
lottiefiles/motion-design-skill (MIT), diffusionstudio/lottie (MIT),
adithya-s-k/manim_skill (MIT), affaan-m/ecc (MIT),
digitalsamba/claude-code-video-toolkit (MIT), WyattBlue/auto-editor
(Unlicense), leonxlnx/taste-skill (MIT), Leonxlnx/earshot (MIT),
smixs/creative-director-skill (CC-BY-4.0, idea-generation methods adapted),
nexu-io/open-design (Apache-2.0), plus the official Remotion, Manim, Whisper
and FFmpeg docs.
