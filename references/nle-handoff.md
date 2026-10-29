# Handoff to Premiere, DaVinci Resolve, After Effects, CatCut

Hand over an editable timeline instead of (or as well as) a render when a
human editor will finish the job, needs to tweak cuts, or wants to grade.

## Which format

| Target | Best exchange format |
|---|---|
| Premiere Pro | FCP7 XML (`.xml`, xmeml) — imports with clips, cuts, tracks, basic transitions |
| DaVinci Resolve | FCPXML (`.fcpxml`) or FCP7 XML; EDL for simple single-track cuts |
| Final Cut Pro | FCPXML |
| Any NLE, single video track | CMX3600 EDL |
| After Effects | Render graphics as ProRes 4444 with alpha, or build in AE via CatCut / Higgsfield `ae_*` tools |

Media paths in XML must be absolute and point at the original files on the
user's machine; relative or moved paths = offline media.

## Ready-made routes (prefer these over hand-writing XML)

- **auto-editor**: `auto-editor in.mp4 --export premiere` / `--export resolve`
  / `--export final-cut-pro` writes a silence-cut timeline.
- **CatCut MCP** (if connected): `project_new` → `asset_add` → `timeline_set`
  → `export_premiere_xml`; after the editor changes things in Premiere,
  `import_premiere_xml` (dry run first, show the summary) brings edits back.
  The Premiere bridge (`premiere_push` / `premiere_pull`) avoids XML files.
- **Higgsfield Premiere/AE MCP** (`pr_*`, `ae_*` tools, if connected):
  drives a running Premiere/After Effects directly — import media, place on
  timeline, trim, add markers, export. Read its skill (`pr_get_skill`,
  `ae_get_skill`) before the first change.

## CMX3600 EDL (simple, robust)

```
TITLE: RECUT_V001
FCM: NON-DROP FRAME

001  AX       V     C        00:00:01:05 00:00:04:12 00:00:00:00 00:00:03:07
* FROM CLIP NAME: interview_A.mp4
002  AX       V     C        00:00:06:00 00:00:09:20 00:00:03:07 00:00:07:03
* FROM CLIP NAME: interview_A.mp4
```
Columns: event, reel, track (V/A/AA/B), transition (C = cut),
source in, source out, record in, record out — timecode at the project fps.
Record-in of each event = record-out of the previous one. Duplicate events
with track `AA` for stereo audio, or use `B` for video+audio.

## FCP7 XML essentials

A `<xmeml version="4">` → `<sequence>` with `<rate><timebase>30</timebase><ntsc>FALSE</ntsc></rate>`,
`<media><video><track><clipitem>` per cut, each with `<start>/<end>`
(timeline frames), `<in>/<out>` (source frames) and a `<file id=…>` holding
`<pathurl>file:///C:/footage/interview_A.mp4</pathurl>` (Windows) or
`file:///Users/name/footage/interview_A.mp4` (macOS; URL-encode spaces as
`%20`) plus the file's
rate/duration. Define each `<file>` fully once, then reference it by id.
Mirror the video clipitems in `<audio>` tracks with the same timings.
For 29.97/23.976 footage set `<ntsc>TRUE</ntsc>` with timebase 30/24.

## Verify

Re-import is the only real test — if you can't open the NLE, at least
validate the XML parses, every `pathurl` exists on disk, and the sum of clip
durations equals the intended sequence length. Tell the user to relink if
they move footage.
