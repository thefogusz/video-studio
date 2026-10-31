# Delivery: final checks, cover, platform copy, clean-up

Read when the user approves a cut ("final", "ไฟนอล", "approve"). Order matters: finish and verify everything,
then publishing copy, then clean up last.

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

- Ask whether the cover is a separate upload or the first frame; a separate cover keeps frame 0 for the hook.
- Vertical-feed covers are often cropped to 3:4 in profile grids: keep cover text inside the centre 3:4
  (y 240–1680 on 1080×1920).

## 3. Platform copy (write per platform, in the video's language)

| Platform | What to write |
|---|---|
| YouTube / Shorts | title + description + tags + playlist |
| TikTok | short caption + hashtags; Duet / Stitch setting |
| Instagram Reels | caption + a few hashtags |
| Facebook | a post |

Ask the user's house rules once and save them in the project (links allowed or not, timestamps, sources, AI
disclosure as text or through the platform's AI-label setting, hashtag count). Facts in the copy must match the
script's sources. One tested set of rules is in `preset-narrated-reel.md`.

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
