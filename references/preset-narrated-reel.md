# Optional preset: narrated story Reel / Short (vertical, 1–3 min)

**This is one creator's tested style, not a rule.** It comes from five finished episodes of a Thai narrated
mystery channel (illustrated stills, 2.5D motion, TTS voice, real recorded sound) and the owner's corrections
along the way. Offer it when a user wants a narrated story / documentary-style Reel and has no style of their
own yet; ask before applying any of it, and drop whatever does not fit their brand or genre.

## Story and hook

- Hook inside the first 4 s: frame 0 already moving with sound playing; first line by 0.2 s, ≤ 12 words, a
  concrete anomaly; reveal around 3 s; title by ~4 s. No logo or channel name in the first 2 s.
- Start from the picture the audience already has, then break it ("the zombies you know bite and infect… the
  first zombie was a slave"). Write 6–8 hook options in groups (belief twist, flipped fear, strange fact, direct
  question, timely angle) and let the owner pick.
- Structure: hook → title → chapters (each ends on a small question) → reveal → closing question for the
  comments → end card with the brand.
- One shot per 4–8 s; each shot chosen for its narration line; no stock repeats across neighbours.

## Voice

- Audio tags such as `[whispering]` at most 1–2 times per episode; never on the hook, a single word or name, or
  the closing question. An over-excited read is retaken.
- Loanwords spelled as pronounced in the TTS prompt only; captions keep the normal spelling.
- Script passed through a language humanizer before voicing.

## Picture

- The look is layered depth planes with atmosphere between them, not dark edges; one light per shot chosen by
  the story beat (warm practical light only for safe / life beats).
- Images: dry matte surfaces, only the focal subject resolved, ordinary asymmetric faces, a value plan
  (two thirds dark mass, one mid zone, one small light), a fixed style block + an approved reference frame.
- Every shot is an event: camera move + 2–3 element motions + 1 light event; 1–3 jump scares per episode on the
  threat only (horror genre), never on a real victim.
- Kinetic "paper" graphics (stamps, case boards, dates) for facts.
- Graded contact sheets for review, never raw images.

## Sound

- Real recordings only (library sound, e.g. Artlist); TTS service for the voice only; no synths or code-made
  sound. A shared bank of sounds that passed the earshot gate.
- Ambience per location changing on the cut; effects only on visible motion; graphics that slam in get a short
  real whoosh into a paper / stamp touch (~-31 dB); pen scratch only when a line is visibly drawn.
- 2–3 big hits per episode, ≥ 40 s apart, each after a 0.7–1.5 s lull, placed in gaps between words; ≤ 1 smaller
  accent per 10–15 s; one recurring motif (heartbeat, drip, clock).
- Music under the world: ambience within 3 dB of the music or above it; music present from frame 0, following a
  gain curve (calm, build, lull, swell, question).
- Levels: voice lines -19 dB RMS (±4); music ~-25, ducked -12 under the voice; ambience -28 to -33, ducked -7;
  effects ducked -5; hits keep their first 0.25 s and fade out over 0.6–1.6 s; a brand sting on the end logo.
- `scripts/check_sfx.py` defaults are this preset's numbers (≤ 3 hits ≥ 40 s apart, ≤ 1 effect per 2 s of
  narration, voice ≥ 10 dB over the rest, ambience ≤ 6 dB under music).

## Delivery

- Cover uploaded separately; frame 0 stays the hook. Cover text inside the centre 3:4 crop.
- Publishing copy per platform with no external URLs, no timestamps (Shorts), and no "AI image / AI voice"
  lines in the text (the platform's AI-label setting instead).
- No corner logo during the film; the logo at the end only.
