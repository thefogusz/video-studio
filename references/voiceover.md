# Voice-over: script, TTS, takes and timing

For narrated videos (stories, explainers, ads) voiced with TTS (ElevenLabs or similar) or a human recording.
The voice is the time axis of the whole film: picture, captions and sound all hang off its timing.

## 1. Script

- Write for the ear: short sentences, one idea each, the number or name the viewer must remember said once,
  clearly. Read it aloud for length: ~150 Thai syllables or ~150 English words per minute for calm narration.
- **The hook is the first line** (`direction.md` §Hook). Offer the user several hook options; it is their call.
- For Thai (or any language with a humanizer skill installed, e.g. `thai-humanizer`), pass the script through it
  before voicing: spoken phrasing, no translated-English rhythm. Keep facts and audio tags unchanged.
- Keep one script file with three things clearly separated: the caption text, the TTS prompt text and the audio
  tags. Drift between those three strings caused most caption errors.

## 2. TTS

- Generate **per section / chapter**, not one long file: retakes are cheap, and the gaps between sections become
  edit points.
- 2 takes per section is enough; pick by ear-proxy (transcribe both, compare with the script, check names), then
  keep the pick in a data file (`vo/picks.json`), not hard-coded in the mixer.
- **Audio tags sparingly.** `[whispering]` and similar effects at most 1–2 times per film, on a line that earns it;
  never on the hook, a single word or a name, or the closing question. An over-excited read ("too much for the
  mood") is a retake, not a mix fix.
- **Loanwords and names: write them as pronounced in the TTS prompt only** (Thai example: การ์ด → ก๊าด); captions
  keep the normal spelling.
- Keep every generated file organised in one place (one project / folder / "flow" in the TTS tool), named by
  section and take. Ask the user before paid generation.

## 3. Timing (for captions and cues)

- Prefer **forced alignment of the known script** over speech recognition for caption times: the text is already
  correct. ElevenLabs' transcription on a generated clip returns the prompt's phrases with word times and (in one
  account) cost nothing; any forced aligner works. Whisper invents spellings for Thai names, so its text is never
  the caption text.
- Use Whisper only to compare takes, in ONE process with the model loaded once, and only on takes still in play.
  Two parallel `whisper` CLI loops on a busy machine took 25 minutes for 5 files.
- Write the result to one `timeline.json` (sections, lines, word times, chosen takes). The film page and the mixer
  both read it (`html-gsap-motion.md` §One timeline).
- Windows: `PYTHONUTF8=1` (Whisper crashes printing Thai otherwise).

## 4. Level

- Level each line toward about -19 dB RMS (±4 dB) before the mix so no line sinks under the music.
- Under the voice, music and ambience sit ≥ 10 dB lower (`sound.md`); measure it with `scripts/check_sfx.py`.
