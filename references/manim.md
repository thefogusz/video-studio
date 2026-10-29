# Manim (Community Edition) — explainer and math animation

## Setup and render

```bash
pip install manim            # needs ffmpeg; LaTeX (MiKTeX/TeX Live) only for MathTex/Tex
manim -pql scene.py Intro    # preview, 480p15 — fast iteration
manim -qh scene.py Intro     # 1080p60 final
manim -qh -r 1080,1920 scene.py Intro   # vertical 9:16
manim -s -qh scene.py Intro  # save last frame as PNG (evidence)
```
Output lands in `media/videos/scene/<quality>/Intro.mp4`; copy to `out/` with
a version name.

**LaTeX check first:** `MathTex`/`Tex` need a LaTeX install (`latex --version`).
Without it Manim fails with an unhelpful `FileNotFoundError: [WinError 2]`.
Either install MiKTeX/TeX Live (ask the user, it's large), or avoid LaTeX:
`Text("a² + b² = c²")` with Unicode superscripts covers simple formulas.

## Pattern

```python
from manim import *

class Intro(Scene):
    def construct(self):
        title = Text("ทฤษฎีบทพีทาโกรัส", font="Noto Sans Thai", font_size=56)
        eq = MathTex(r"a^2 + b^2 = c^2").next_to(title, DOWN, buff=0.6)
        self.play(Write(title), run_time=1.2)
        self.play(FadeIn(eq, shift=UP * 0.3))
        self.wait(1)

        tri = Polygon(ORIGIN, RIGHT * 3, UP * 2, color=YELLOW).shift(DOWN * 1.5)
        self.play(FadeOut(title), eq.animate.to_edge(UP), Create(tri))
        self.play(Indicate(eq[0][0:2]))          # highlight a^2
        self.wait(2)
```

Principles (3Blue1Brown style):
- **One idea per animation call**; let each new idea arrive while old ones
  stay visible as context, then clear deliberately.
- **Transform, don't replace:** `TransformMatchingTex` / `ReplacementTransform`
  show *how* one expression becomes the next — that's the teaching.
- Colour-code consistently (the same quantity keeps the same colour in text,
  equation and diagram). `MathTex(..., tex_to_color_map={"a": BLUE})`.
- Pace with `run_time` and `self.wait()`; ~1 s per motion, 1–2 s of rest after
  a key point. Use `rate_func=smooth` (default) or `there_and_back` for pulses.
- Build scenes as small classes (one per beat), render each, join with ffmpeg
  — faster iteration than one giant scene.
- Narration sync: if there's a voice-over, get its segment durations first
  and set `run_time`/`wait` from them.

Thai text: use `Text(...)` (Pango) with a Thai font name; `Tex/MathTex` can't
render Thai. If glyphs show as boxes the font name is wrong — check installed
fonts: Linux `fc-list :lang=th`, macOS Font Book (built-in Thai: Thonburi,
Sukhumvit Set, Ayuthaya), Windows `C:\Windows\Fonts` (Leelawadee UI, Tahoma,
plus any installed Noto Sans Thai). Tested on Windows: `font="Noto Sans Thai"`
renders correctly.

## Verify

`-s` last-frame PNGs per scene, ffprobe the joined MP4, contact sheet.
