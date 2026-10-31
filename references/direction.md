# Direction: creative director → art director → film director

Read this before making anything original (an ad, launch film, brand video,
motion piece, explainer), or when the user says the result looks generic,
"AI-made", flat, or "not premium". Skip it for purely mechanical edits
(trim, resize, subtitle an existing video).

The tools in the other references make *how*. This file decides *what* and
*why*. A technically clean video with a category-default idea loses to a
rougher one with a real idea.

## 1. Creative director — the idea

1. **Brief in one page:** audience, the one thing they should feel/do after
   watching, the single message (one sentence), mandatories (logo, legal,
   product shot), platform and length, tone in 3 words, what to avoid.
2. **Inventory the subject:** list 8–12 things that belong to *this* brand or
   product and no competitor — its name and what it means, where it's made,
   materials, numbers (price, minutes, year), the constraint it lives with,
   rituals, sounds, printed things of its world (labels, tickets, receipts).
   The idea comes from this list, not from the category ("tech = blue glow",
   "food = slow-mo pour").
3. **Generate, then choose:** produce 3 distinct concepts, each a one-line
   idea + how the video opens + how it ends. Push past the first idea with a
   technique: *exaggerate* a true property, *remove* something expected,
   *swap* the context (show the product in another world), *literalise* a
   phrase, *combine* two unrelated items from the inventory. Recommend one and
   say why it fits the brief; let the user pick when it's their brand.
4. **Test the idea:** Could a competitor run this exact video? (If yes, it's
   not an idea yet.) Does the first 2 seconds earn the next 5? Can someone
   retell it in one sentence?

## 2. Art director — the look

Write a short **style bible** before building, and keep every scene to it:
- **Palette:** 1 dominant, 1 accent, 1–2 neutrals, with hex codes; say what
  the accent is *for* (only highlights / only the product). Take colours from
  the subject (its packaging, place, material) rather than a trendy gradient.
- **Type:** one display face + one text face max; sizes as a scale; for Thai
  pick a family with real Thai design (Prompt, Kanit, IBM Plex Sans Thai,
  Noto Sans Thai, Sarabun). Big type is a picture — set it large.
- **Composition:** grid/margins per aspect ratio, where the focal point sits,
  how much empty space. Decide a signature move (a recurring frame, crop,
  wipe or transition) and repeat it — consistency reads as design.
- **Imagery:** what real footage, product shots or photos exist. Plan around
  what you have; if generating images/video, write the prompts from the
  style bible so every shot matches.
- **Motion tone:** easing family and speed (calm luxury = slow ease-in-out,
  long holds; energetic = snappy expo/back, short holds; playful = overshoot).
- **Anti-patterns to avoid:** generic purple/blue AI gradients, glowing
  particles for no reason, centred-everything symmetry, stock "icon in a
  rounded square" cards, lorem/placeholder numbers, five fonts, everything
  moving at once.

Show the user 1–3 style frames (single rendered stills) before animating a
whole piece — it's the cheapest moment to change direction.

## 3. Film director — the telling

**Structure (short-form ad / launch, 15–60 s):**
hook (0–2 s: an image or line that creates a question) → tension/problem or
curiosity → reveal (product/idea) → proof (1–3 concrete beats) → payoff and
call to action → end card with logo held ≥ 1.5 s.
Long-form explainer: promise → context → 3–5 steps, each one idea → recap.
**The hook.** On social feeds the first seconds decide the view: open on movement and a line that creates a
question, not a logo or "today we'll talk about…". Offer the user a few hook options and let them choose; their
channel's own rules win. (A tested 4-second hook recipe for narrated Reels is in `preset-narrated-reel.md`.)

| Genre | Hook pattern |
|---|---|
| Mystery / true crime | the anomaly, then the twist ("a body, and a letter signed by the killer") |
| History / documentary | the familiar version, then the surprising truth |
| Explainer / education | the wrong belief most people hold, or the result first |
| Product / ad | the problem in one image, or the product doing the impossible |
| Tutorial | the finished result in the first second |

**Shot list** — one row per shot, written before building:

| # | Dur | Line / beat | Shot size | Camera move | Subject / on-screen event | Light | Text | Sound | Why for this line |
|---|-----|-------------|-----------|-------------|---------------------------|-------|------|-------|-------------------|

Each shot serves its line: choose size, angle, light and the on-screen event *for that line*, and avoid stock
repeats across neighbours (the same light, pose or camera move shot after shot).

- Shot sizes: wide/establishing (where), medium (who/what), close-up
  (emotion/detail), macro/insert (product truth). Vary sizes between
  consecutive shots; two identical sizes back-to-back feel like a jump cut.
- Camera language: push-in = importance/realisation, pull-out = reveal
  context, pan/track = follow or connect, static = confidence, handheld =
  intimacy/urgency, top-down = order/process. In motion graphics, the
  "camera" is a scale/position move on the whole stage — use it the same way.
- Screen direction: keep movement direction consistent within a sequence
  (180° rule); reverse it deliberately to signal a turn.

**Storyboard:** for anything over ~15 s, make a board (one frame per shot —
quick sketches, rendered style frames or generated images) and check the
sequence reads with the sound off.

**Editing rhythm:** cut on action or on the beat; shorten shots as energy
builds and let the reveal/end card breathe; hold a shot until its information
is read, then leave. Put the strongest image first and the logo last. Average
shot length for social ads is ~0.8–2 s; for brand films 2–4 s.

## 4. Review like a director

Before calling it done, watch the render (contact sheet + frames at each
cut) and score honestly:
- **Idea:** retellable in one sentence? ownable by this brand?
- **First 2 s:** would a scrolling viewer stop?
- **Clarity:** one focal point per moment; text readable at phone size and
  held long enough.
- **Craft:** consistent palette/type/motion tone; no flashes, no clipped
  text, no dead frames; sound hits land on the cuts (see `sound.md`).
- **Ending:** clear call to action and logo hold.
- **Physical sense:** shadows, lights, feet, props and faces behave like the
  real thing (`parallax-2.5d.md` §2) — viewers report these as bugs.
List the top 3 fixes, fix them, re-check. Say which items you could not judge
(e.g. you can't hear audio without a tool like earshot).

**Review the preview yourself before the user sees it.** Show what the film will
really look like (graded sheets, stills every ~1.5 s and at every event) only
after you have checked them; a preview with a bug you could have caught costs
the user's trust and a round trip.

## 5. Brief, budget and series memory

- **Before the first render**, agree the look, the sound policy (real recordings
  vs generated) and the budget (paid generation per image / voice / music, how
  many takes). A first version made without these in the brief is often thrown
  away.
- **For a series**, save the decisions in the project (an `AGENTS.md` / project
  skill: style block + reference frame, voice and settings, mix numbers, hook
  rules, delivery rules, a reference episode to copy). Each finished episode
  should make the next one cheaper; record every correction the user makes as
  a rule with its reason.
