# Lottie animations

Use when the deliverable is an animation **file** for an app or website
(tiny, scalable, interactive), or something an After Effects user will open
later. If the user just needs a video, HTML+GSAP is easier and safer.

## File anatomy (Bodymovin JSON)

```json
{
  "v": "5.7.0", "fr": 30, "ip": 0, "op": 90, "w": 512, "h": 512, "nm": "pulse",
  "assets": [],
  "layers": [{
    "ddd": 0, "ind": 1, "ty": 4, "nm": "dot", "ip": 0, "op": 90, "st": 0, "sr": 1,
    "ks": {
      "o": {"a": 0, "k": 100},
      "r": {"a": 0, "k": 0},
      "p": {"a": 0, "k": [256, 256, 0]},
      "a": {"a": 0, "k": [0, 0, 0]},
      "s": {"a": 1, "k": [
        {"t": 0,  "s": [60, 60, 100],  "o": {"x": [0.33], "y": [0]}, "i": {"x": [0.67], "y": [1]}},
        {"t": 45, "s": [100, 100, 100], "o": {"x": [0.33], "y": [0]}, "i": {"x": [0.67], "y": [1]}},
        {"t": 90, "s": [60, 60, 100]}
      ]}
    },
    "shapes": [
      {"ty": "el", "nm": "circle", "p": {"a": 0, "k": [0, 0]}, "s": {"a": 0, "k": [200, 200]}},
      {"ty": "fl", "nm": "fill", "c": {"a": 0, "k": [0.98, 0.36, 0.25, 1]}, "o": {"a": 0, "k": 100}}
    ]
  }]
}
```
Key facts:
- `fr` fps, `ip`/`op` in/out frame; layer `ty`: 4 shape, 0 precomp, 1 solid,
  2 image, 3 null, 5 text (avoid text — fonts are fragile; convert to shapes).
- `ks` transform: `o` opacity, `r` rotation, `p` position, `a` anchor,
  `s` scale (percent, 3 values). `"a": 1` = animated with keyframes.
- Keyframe easing: `o` = out-tangent of this key, `i` = in-tangent of the next
  segment, as cubic-bezier handles (0.33/0 → 0.67/1 ≈ ease-in-out).
- Colours are 0–1 RGBA floats.
- Shape items: `el` ellipse, `rc` rect, `sh` path, `fl` fill, `st` stroke,
  `tm` trim paths (line drawing), `gr` group (with its own `tr` transform as
  the last item).

## Workflow

1. Sketch the motion as a list: element, property, start/end frame, ease.
2. Generate the JSON programmatically (Python/JS building dicts) rather than
   hand-typing — fewer bracket errors, reusable easing helpers.
3. Validate by rendering. Make an HTML page with lottie-web and the JSON
   **inlined** (a `file://` page can't fetch `path:"anim.json"`):
   ```html
   <div id="c" style="width:512px;height:512px"></div>
   <script src="https://cdn.jsdelivr.net/npm/lottie-web@5.12.2/build/player/lottie.min.js"></script>
   <script>
     const anim = lottie.loadAnimation({container: document.getElementById("c"), renderer: "svg",
       loop: false, autoplay: false, animationData: /* paste anim.json here */ {}});
     anim.addEventListener("DOMLoaded", () => {
       window.seek = t => { anim.goToAndStop(t * 1000, false); };
       window.DURATION = anim.totalFrames / anim.frameRate;
     });
   </script>
   ```
   Then `node scripts/render_html.mjs lottie.html out/lottie_v001.mp4 --w 512 --h 512`
   gives a preview MP4 to inspect with a contact sheet.
4. Check it in the LottieFiles preview or the target app runtime when
   possible — each player supports a slightly different feature set
   (expressions, effects, some masks are not supported on mobile).

Keep it light: few layers, no raster images, no expressions, under ~100 KB.
For complex illustration animation, recommend designing in After Effects and
exporting with Bodymovin instead.
