# ffmpeg cutting, joining and reformatting

Compact cookbook. For deep pipelines (complex filtergraphs, EDL rendering,
media manifests) the installed `ffmpeg` skill goes further — use it.

## Probe first

```bash
ffprobe -v error -show_entries format=duration:stream=index,codec_type,codec_name,width,height,r_frame_rate,avg_frame_rate,sample_rate,channels:stream_side_data=rotation -of json in.mp4
```
- `r_frame_rate` ≠ `avg_frame_rate` → variable frame rate (phones, screen
  recordings). Normalise before editing:
  `ffmpeg -i in.mp4 -vf fps=30 -c:v libx264 -crf 18 -preset medium -c:a aac -b:a 192k work/in_cfr.mp4`
- A rotation value means the player rotates it; ffmpeg auto-rotates on
  re-encode, but stream-copy keeps the tag.

## Trim

```bash
# Frame-accurate (re-encode). -ss after -i = accurate; put a coarse -ss before -i to speed up long files.
ffmpeg -ss 00:01:00 -i in.mp4 -ss 5.000 -t 12.500 -c:v libx264 -crf 18 -c:a aac -b:a 192k out/clip_v001.mp4
# Fast, lossless, but snaps to the previous keyframe (may start early / freeze).
ffmpeg -ss 65 -i in.mp4 -t 12.5 -c copy out/clip_copy.mp4
```
Use stream copy only for rough pulls; anything delivered gets re-encoded.

## Join

Same codec/resolution/fps → concat demuxer:
```bash
# list.txt:  file 'a.mp4'\nfile 'b.mp4'
ffmpeg -f concat -safe 0 -i list.txt -c copy out/joined_v001.mp4
```
Different sources → concat filter (re-encodes, normalise first):
```bash
ffmpeg -i a.mp4 -i b.mp4 -filter_complex "[0:v]scale=1920:1080,setsar=1,fps=30[v0];[1:v]scale=1920:1080,setsar=1,fps=30[v1];[v0][0:a][v1][1:a]concat=n=2:v=1:a=1[v][a]" -map "[v]" -map "[a]" -c:v libx264 -crf 18 -c:a aac out/joined_v001.mp4
```
Crossfade between two clips: `xfade=transition=fade:duration=0.5:offset=<len_a-0.5>` for video and `acrossfade=d=0.5` for audio.

## Reformat for platforms

```bash
# 16:9 → 9:16 centre crop (subject in the middle)
ffmpeg -i in.mp4 -vf "crop=ih*9/16:ih,scale=1080:1920" -c:a copy out/vertical_v001.mp4
# 16:9 → 9:16 with blurred background (nothing cropped)
ffmpeg -i in.mp4 -filter_complex "[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=20:2[bg];[0:v]scale=1080:-2[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2" -c:a copy out/vertical_blur_v001.mp4
```
Move the crop's x offset (`crop=w:h:x:0`) if the subject is off-centre;
check a frame to confirm.

Delivery defaults: `-c:v libx264 -crf 18 -preset medium -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 192k -ar 48000`.
`yuv420p` matters: without it many phones/browsers show black video.

## Speed

```bash
ffmpeg -i in.mp4 -filter_complex "[0:v]setpts=PTS/1.5[v];[0:a]atempo=1.5[a]" -map "[v]" -map "[a]" out/fast_v001.mp4
```
`atempo` accepts 0.5–2.0 per instance; chain for more (`atempo=2,atempo=1.5`).

## Audio

```bash
# Measure loudness
ffmpeg -i out.mp4 -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=summary -f null -
# Normalise (social -14 LUFS; broadcast EBU R128 -23; podcasts -16)
ffmpeg -i in.mp4 -af loudnorm=I=-14:TP=-1.5:LRA=11 -c:v copy out/norm_v001.mp4
# Music bed ducked under voice (sidechain)
ffmpeg -i voice.mp4 -i music.mp3 -filter_complex "[1:a]volume=0.5[m];[m][0:a]sidechaincompress=threshold=0.03:ratio=8:attack=20:release=300[duck];[0:a][duck]amix=inputs=2:duration=first[a]" -map 0:v -map "[a]" -c:v copy out/mixed_v001.mp4
```
For best accuracy run loudnorm in two passes (measure, then feed
`measured_*` values back).

## Silence

Detect only (gives a cut list you can review):
```bash
ffmpeg -i in.mp4 -af silencedetect=noise=-35dB:d=0.4 -f null - 2>&1 | grep silence_
```
Automatic removal with auto-editor (`pip install auto-editor`):
```bash
auto-editor in.mp4 --margin 0.15sec --output out/nosilence_v001.mp4
auto-editor in.mp4 --edit audio:threshold=0.04 --margin 0.2sec --export premiere   # editable timeline instead of a render
```
Flags change between auto-editor versions — run `auto-editor --help` first.
Tune by the result: speech chopped mid-word → raise margin / lower threshold;
too many pauses left → raise threshold. Keep a margin of at least ~0.1 s.

## Evidence

```bash
ffprobe -v error -show_entries format=duration:stream=codec_name,width,height,r_frame_rate -of compact out.mp4
ffmpeg -ss 3 -i out.mp4 -frames:v 1 work/check_003s.png
ffmpeg -i out.mp4 -vf "fps=1/2,scale=320:-1,tile=6x4" -frames:v 1 work/contact_sheet.png   # whole video at a glance
ffmpeg -i out.mp4 -vf blackdetect=d=0.1:pix_th=0.1 -an -f null - 2>&1 | grep black_
```

## Windows notes

Use forward slashes in paths. In the `subtitles=` filter, escape the drive
colon: `subtitles='C\:/work/subs.srt'`. Quote filtergraphs with double quotes
in PowerShell/cmd.
