# Captions and subtitles

## Transcribe

```bash
ffmpeg -i in.mp4 -vn -ac 1 -ar 16000 work/audio.wav
pip install -U openai-whisper          # or faster-whisper for ~4x speed
whisper work/audio.wav --model medium --language th --word_timestamps True --output_format all --output_dir work/
```
- **Windows:** prefix with `PYTHONUTF8=1` (PowerShell: `$env:PYTHONUTF8=1`),
  otherwise Whisper crashes printing Thai to the console
  (`UnicodeEncodeError: 'charmap'`) and writes no files.
- Model: `small` is fine for clear English; Thai and noisy audio need
  `medium` or `large-v3`. Tested: `small` on clean Thai TTS still turned
  ค่ะ→ข้าว, โค้ด→โคตร, เงียบ→เฉียบ, ซับไตเติล→garbage. The first run
  downloads the model (small ≈ 460 MB, medium ≈ 1.5 GB, large ≈ 3 GB).
- Always proof-read: names, brand terms and Thai spelling are where Whisper
  fails. Fix in the JSON/SRT, not by re-running.
- Thai has no spaces between words, so Whisper segments can be long (one
  5 s segment in testing). Re-split lines yourself.
- Thai `--word_timestamps` come back as sub-word token fragments (76 pieces
  for one sentence), not words. Before karaoke/word-pop captions, merge them
  into real words with the bundled script (segments with PyThaiNLP, gives
  each word the start of its first fragment and the end of its last; tested:
  76 fragments → 22 words):
  `python <skill-dir>/scripts/thai_words.py work/audio.json work/words.json --text work/corrected.txt`

## Line rules

- Max ~42 Latin characters or ~20–25 Thai characters per line, max 2 lines
  (social vertical: 1 line, 2–5 words, big).
- Each caption on screen ≥ 1 s and ≤ 6 s; ≥ 2 frames gap between captions.
- Break lines at phrase boundaries, never between a number and its unit or
  inside a name.

## Burn in (simple)

```bash
ffmpeg -i in.mp4 -vf "subtitles=work/subs.srt:force_style='FontName=Noto Sans Thai,FontSize=18,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=1,Outline=2,Shadow=0,Alignment=2,MarginV=60'" -c:a copy out/subbed_v001.mp4
```
ASS colours are `&HAABBGGRR` (blue-green-red, alpha first). On Windows escape
the path: `subtitles='C\:/proj/work/subs.srt'`. If the font isn't installed
system-wide, add `:fontsdir=fonts/`.

For 9:16 social, `MarginV` ~ 25–35% of height keeps captions above the
platform UI.

## Word-by-word / karaoke (ASS)

Write an `.ass` file. Per line, use `\k` (centiseconds per word) for a fill
sweep, or emit one Dialogue per word with the active word coloured:

```
[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Pop,Noto Sans Thai,84,&H0000FFFF,&H00FFFFFF,&H00000000,&H64000000,-1,0,0,0,100,100,0,0,1,6,0,2,60,60,520,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:00:01.00,0:00:02.20,Pop,,0,0,0,,{\k30}สวัสดี{\k40}ครับ{\k50}ทุกคน
```
`PrimaryColour` is the sung/filled colour, `SecondaryColour` the not-yet
colour. Generate these lines from Whisper word timestamps; add a pop-in with
`{\fscx80\fscy80\t(0,80,\fscx100\fscy100)}` at the start of a word if wanted.

For richer animated captions (bouncing, per-word emoji, highlight boxes),
render them as an HTML+GSAP overlay instead (`html-gsap-motion.md`) and
composite with ffmpeg `overlay`.

## Soft subtitles (selectable, not burned)

```bash
ffmpeg -i in.mp4 -i subs.srt -c copy -c:s mov_text -metadata:s:s:0 language=tha out/softsub_v001.mp4
```

## Verify

Grab frames at several caption times; check the text is fully inside the safe
area, the Thai glyphs render (no boxes, vowels/tone marks not clipped at the
top — increase line spacing/MarginV if they are), and the timing matches the
audio by listening around 2–3 captions.
