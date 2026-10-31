# Delivery: final checks, cover, platform copy, clean-up

Read when the user approves a cut ("final", "ไฟนอล", "approve"). Order matters: finish and verify everything,
then publish copy, then clean up last.

## 1. Final technical checks (on the encoded MP4, not the WAV)

```bash
ffprobe -v error -show_entries format=duration:stream=codec_name,width,height,r_frame_rate,pix_fmt -of compact out/film_v007.mp4
ffmpeg -i out/film_v007.mp4 -af ebur128=peak=true -f null - 2>&1 | tail -12      # I ≈ -14 LUFS, true peak ≤ -1.0 dBTP
ffmpeg -i out/film_v007.mp4 -vf blackdetect=d=0.3:pix_th=0.05 -an -f null - 2>&1 | grep black_start
```
- Frame count = fps × duration (a dropped chunk in a parallel render shows here).
- AAC adds ~0.5–1 dB of true peak: master the WAV to -2.0 dBTP so the upload stays ≤ -1.0.
- Contact sheet of the final file; the last frame holds the logo / end card.

## 2. Cover / thumbnail

- Make the cover a **separate image upload**, not baked into frame 0: the first frame belongs to the hook.
  (Trimming a slow first second is a script/edit fix, not a cover fix.)
- Vertical-feed covers are cropped to 3:4 in grids: keep text inside the centre 3:4 (y 240–1680 on 1080×1920).
- One short line, heavy type with an outline, one key word highlighted.

## 3. Platform copy (write per platform, in the video's language)

| Platform | What to write |
|---|---|
| YouTube / Shorts | title + short description (story in 3–4 lines, a comment question, sources by name, 3–5 hashtags) + tags + playlist |
| TikTok | short caption + hashtags; Duet / Stitch on |
| Instagram Reels | caption + ≤ 5 hashtags |
| Facebook | a story-style post |

Rules the user set after seeing drafts (likely to hold for other creators too; confirm once):
- **No external URLs** in any copy: cite sources by name only.
- **No timestamps** for Shorts-length videos (they are not clickable there).
- AI disclosure through the platform's own AI-content setting, not as text in the copy; ask the user which they want.
- Facts in the copy must match the script's fact sheet; run the copy through the language humanizer if installed.

## 4. Final folder, asset bank, clean-up

1. Create `final/`: the video, audio master, script, contact sheet, cover, `publish.md`.
2. Verify `final/` (ffprobe the copies) **before** deleting anything. Cleaning up before the last re-render once
   forced a full rebuild.
3. Add reusable assets that passed review (sounds that passed the earshot gate, approved style references) to the
   user's shared bank, with source, licence and gate scores.
4. Move intermediate renders, old versions and stills to the Recycle Bin / Trash; never delete permanently. Keep
   anything that cost money or cannot be regenerated: voice takes, music, effects, stems, image layers, source
   scripts.
5. Clear tool caches that grow per run (e.g. earshot `.cache/decoded` and `.cache/emb`; keep model caches).
6. Never kill all `node` / `python` processes to stop a render: stop only the task you started.
