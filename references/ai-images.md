# Generated images for video: cost, consistency and not looking "AI-made"

Read before generating a set of stills for a video (illustrated story, explainer, storyboard frames, B-roll
plates). The two most common complaints are "this looks AI-made" and "it doesn't match our look".

## 1. Pick the source by budget (ask before anything paid)

| Route | Cost | Notes |
|---|---|---|
| Codex CLI `image_gen` (GPT-image) on the user's ChatGPT plan | inside the plan's quota | batch briefs in a TASK.md, several `codex exec` jobs in parallel; good at following a style reference image |
| Paid image APIs / MCP connectors (ElevenLabs, Krea, fal, Replicate …) | per image; **2K costs ~4× 1K** (one run: 603 vs 151 credits) | aspect ratio and size are often *model parameters*, not prompt words (a 9:16 prompt still came back landscape) |
| Stock / public-domain archives | free or licensed | real photos for documentary; check the licence per item |
| The user's own art | free | ask first; nothing beats it for brand fit |

Cost levers, measured on one 2:30 film where images were 71% of the generation spend:
- **1 take per shot first**, at preview size; regenerate only the shots that fail. Two takes of every shot at 2K
  doubled the bill for images that were never used.
- Generate only shots that survive the shot list; an unused image is the most expensive frame.
- Quote the real unit price for the size you will use before launching a batch.
- Download every result at once: signed download URLs often expire within hours. Write URLs to a file rather than
  pasting them into a shell command (long signed URLs broke a heredoc).

## 2. Consistency: a style block + a reference image

- Write the style once (`STYLE`, `RULES`, `LAYERED`, `FACES` blocks in the batch script) and prepend it to every
  prompt. Keep a **reference image** (an approved frame) and pass it to the model on every call; words alone drift.
- When a new style is proposed, test it on 3 shots (an opening shot, a face, an object) next to an approved frame
  before redrawing a whole film.
- Changing the *medium* words ("gouache on watercolour paper", pigment names) moved the whole palette brown-orange
  and added deckled paper borders the model would not stop drawing even when told "edge to edge" (27 of 27 images).
  Keep the approved style wording; fix the "AI look" with the rules below, not with a new medium.

## 3. What reads as "AI" and the fix

| Tell | Fix in the prompt |
|---|---|
| Glossy wet streets / shiny everything | name the surfaces you want positively (e.g. "dry asphalt, matte wood"); drop wet / reflections / shiny unless wanted |
| Detail spread evenly to every corner | "only the focal subject resolved; the rest loose big shapes, unfinished" |
| Teal-orange "cinematic" light, the same lamp in every shot | one motivated light per shot, planned in the shot list for what that line needs |
| Pretty symmetric model faces | a specific ordinary person with named irregular features (crooked smile, uneven brows, stubble), "no glamour" |
| Two people with the same face | a FACES table: different age, build, face shape, hair, headwear per person |
| Props with an invented shape | name the real object and its real proportions; check props, not only faces |
| Same polish and framing in every shot | vary shot size, angle and light between neighbours (the shot list says why for each line) |
| Value soup | a value plan in numbers: two thirds one dark mass, one mid zone, one small light area |

Also: drop praise words (cinematic, highly detailed, 8k, masterpiece); phrase positively (models draw what a
negation names), but keep "no text or letters". For a layered film, ask for separated depth planes
(`parallax-2.5d.md`).

Fix the look in the prompt rather than with a code filter: in one test a Kuwahara + colour-quantise "painterly"
pass read as a cheap filter (blocky, speckled, low contrast).

## 4. Review like the viewer will see it

- Show contact sheets with the film's grade applied, next to an approved frame for tone; raw sheets can mislead
  the review.
- Per image: matches the style reference, no border, no text, faces distinct, props real, the subject reads at
  phone size.
- Content filters fail some shots silently (a lodging-house interior failed twice): plan a fallback composition.
- Never present a generated portrait as a real person's photo; describe it as an illustration.
