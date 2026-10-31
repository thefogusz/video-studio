"""Re-render only the changed time ranges of a seekable HTML film and splice them into an existing render.

usage: python splice.py page.html base.mp4 out.mp4 "25.5-27.1" "42.6-44.5" ... [--fps 30] [--workers 6]
           [--w 1080 --h 1920]
Run from a folder whose node_modules has playwright. Ranges are in seconds; each edge is rounded to a frame.
The base render must come from the same page (same duration, size and fps). Picture only: mux the audio after.
A late fix that touches 5 s of a 150 s film costs 5 s of rendering instead of a full re-render."""
import os
import shutil
import subprocess
import sys
import tempfile

args = sys.argv[1:]


def take(name, default):
    if f"--{name}" in args:
        k = args.index(f"--{name}")
        v = args[k + 1]
        del args[k:k + 2]
        return v
    return default


fps = float(take("fps", "30"))
workers = take("workers", "6")
w, h = take("w", "1080"), take("h", "1920")
if len(args) < 4:
    sys.exit(__doc__)
page, base, out, *ranges = args
here = os.path.dirname(os.path.abspath(__file__))
probe = subprocess.run(["ffprobe", "-v", "error", "-count_packets", "-select_streams", "v:0", "-show_entries",
                        "stream=nb_read_packets", "-of", "csv=p=0", base], capture_output=True, text=True, check=True)
total = int(probe.stdout.strip().split(",")[0])
spans = sorted((round(float(a) * fps), round(float(b) * fps)) for a, b in (r.split("-") for r in ranges))
for (a0, a1), (b0, _) in zip(spans, spans[1:]):
    if b0 < a1:
        sys.exit(f"ranges overlap: frames {a0}-{a1} and {b0}-...")
tmp = tempfile.mkdtemp(prefix="splice_")
segs = []
for k, (f0, f1) in enumerate(spans):
    seg = os.path.join(tmp, f"seg{k}.mp4")
    subprocess.run(["node", os.path.join(here, "render_fast.mjs"), page, seg, "--from", str(f0 / fps),
                    "--to", str(f1 / fps), "--fps", str(fps), "--workers", workers, "--w", w, "--h", h], check=True)
    segs.append((f0, f1, seg))
# filter graph: base pieces between the new segments, all concatenated in order
inputs, parts, pos = ["-i", base], [], 0
for k, (f0, f1, seg) in enumerate(segs):
    if f0 > pos:
        parts.append(f"[0:v]trim=start_frame={pos}:end_frame={f0},setpts=PTS-STARTPTS[p{len(parts)}]")
    inputs += ["-i", seg]
    parts.append(f"[{k + 1}:v]setpts=PTS-STARTPTS[p{len(parts)}]")
    pos = f1
if pos < total:
    parts.append(f"[0:v]trim=start_frame={pos}:end_frame={total},setpts=PTS-STARTPTS[p{len(parts)}]")
graph = ";".join(parts) + ";" + "".join(f"[p{i}]" for i in range(len(parts))) + f"concat=n={len(parts)}:v=1:a=0[v]"
subprocess.run(["ffmpeg", "-v", "error", "-y", *inputs, "-filter_complex", graph, "-map", "[v]", "-c:v", "libx264",
                "-crf", "16", "-preset", "medium", "-pix_fmt", "yuv420p", "-movflags", "+faststart", out], check=True)
shutil.rmtree(tmp, ignore_errors=True)
print(f"wrote {out}: {len(segs)} new ranges, {sum(b - a for a, b, _ in segs)} of {total} frames re-rendered")
