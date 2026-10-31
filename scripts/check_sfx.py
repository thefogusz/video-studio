"""Check a sound mix against the picture, with numbers instead of ears.

usage: python check_sfx.py --cues mix/cues.json --events events.json --stems mix/stems
           [--lines lines.json] [--hit-max 3 --hit-gap 40 --density 1.0 --clarity 10 --world 6]

Inputs
  cues.json    what the mixer placed: a list (or {"cues": [...]}) of {"id", "t", "align"}; t is the EVENT time
               (whoosh apex, impact onset), not the file start. Conventions in the id / fields:
                 kind "hit" or id starting "hit" / "boom"  -> a big hit (budgeted)
                 align "bed" or id starting "amb" / "bed"  -> ambience bed (not checked for orphans)
                 id starting "vo"                          -> narration
                 id starting "offscreen:"                  -> deliberate off-screen sound (exempt)
  events.json  from extract_events.mjs (cut / appear / move / draw events)
  stems/       vo.wav, music.wav, fx.wav, amb.wav (any missing stem counts as silence)
  lines.json   optional narration lines [[start, end], ...] or [{"start", "end"}, ...]; without it the lines
               are found from the vo stem (speech = 50 ms frames within 20 dB of its peak)

Checks (defaults = the optional narrated-reel preset, references/preset-narrated-reel.md; pass your own per style)
  1 ORPHAN   every one-shot has a picture event within 100 ms (or lands inside a move it can carry)
  2 HITS     at most --hit-max big hits, at least --hit-gap s apart
  3 DENSITY  hard effects during narration <= --density per 2 s
  4 CLARITY  voice minus everything else >= --clarity dB on each line (fail below clarity - 3)
  5 WORLD    in each shot, ambience no more than --world dB under the music (the "sound doesn't belong to the
             picture" complaint was music over a silent world)
Prints a report; exit 1 on any FAIL."""
import argparse
import json
import os
import subprocess
import sys

import numpy as np

ap = argparse.ArgumentParser()
ap.add_argument("--cues", required=True)
ap.add_argument("--events", required=True)
ap.add_argument("--stems", required=True)
ap.add_argument("--lines")
ap.add_argument("--hit-max", type=int, default=3)
ap.add_argument("--hit-gap", type=float, default=40)
ap.add_argument("--density", type=float, default=1.0)
ap.add_argument("--clarity", type=float, default=10)
ap.add_argument("--world", type=float, default=6)
a = ap.parse_args()
SR = 48000


def load(name):
    for ext in ("wav", "flac", "mp3"):
        f = os.path.join(a.stems, f"{name}.{ext}")
        if os.path.exists(f):
            raw = subprocess.run(["ffmpeg", "-v", "error", "-i", f, "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"],
                                 capture_output=True, check=True).stdout
            return np.frombuffer(raw, np.float32).astype(np.float64)
    return None


C = json.load(open(a.cues, encoding="utf-8"))
C = C["cues"] if isinstance(C, dict) else C
E = json.load(open(a.events, encoding="utf-8"))
dur, E = E.get("duration"), E["events"]
S = {k: load(k) for k in ("vo", "music", "fx", "amb")}
n = max(len(x) for x in S.values() if x is not None)
S = {k: (np.zeros(n) if x is None else np.pad(x, (0, n - len(x)))) for k, x in S.items()}
dur = dur or n / SR
db = lambda x: 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)
cid = lambda c: c.get("id", "")
is_hit = lambda c: c.get("kind") == "hit" or cid(c).startswith(("hit", "boom"))
is_bed = lambda c: c.get("align") == "bed" or cid(c).startswith(("amb", "bed"))
fails = []

ev_t = np.array([e["t"] for e in E if e["kind"] in ("cut", "appear", "vanish", "move_start", "move_end", "draw_start", "draw_end")])
spans = []
for k0, k1 in (("move_start", "move_end"), ("draw_start", "draw_end")):
    open_ = {}
    for e in E:
        if e["kind"] == k0:
            open_[e["id"]] = e["t"]
        elif e["kind"] == k1 and e["id"] in open_:
            spans.append((open_.pop(e["id"]), e["t"]))

# narration lines
if a.lines:
    L = json.load(open(a.lines, encoding="utf-8"))
    lines = [(x["start"], x["end"]) if isinstance(x, dict) else tuple(x) for x in L]
else:
    fr = 2400
    v = S["vo"][: len(S["vo"]) // fr * fr].reshape(-1, fr)
    rms = np.sqrt((v ** 2).mean(1))
    on = rms > rms.max() * 10 ** (-20 / 20) if rms.max() > 0 else np.zeros(len(rms), bool)
    lines, start, gap = [], None, 0
    for i, s in enumerate(on):          # join speech frames; a pause > 0.4 s ends a line
        if s:
            start = i if start is None else start
            gap = 0
        elif start is not None:
            gap += 1
            if gap > 8:
                lines.append((start * fr / SR, (i - gap + 1) * fr / SR)); start, gap = None, 0
    if start is not None:
        lines.append((start * fr / SR, len(on) * fr / SR))

fx = [c for c in C if not cid(c).startswith(("vo", "offscreen:")) and not is_bed(c)]

print("1. orphans (picture event within 100 ms of each effect)")
for c in fx:
    dt = float(np.min(np.abs(ev_t - c["t"]))) if len(ev_t) else 9.0
    if any(s0 <= c["t"] <= s1 for s0, s1 in spans if s1 - s0 >= .3):
        dt = 0.0                         # a whoosh may peak in the middle of a move it carries
    tag = "ok" if dt <= .10 else ("near" if dt <= .25 else "ORPHAN")
    if tag != "ok":
        print(f"   {tag:6s} {cid(c):30s} t={c['t']:.2f}  nearest event {dt * 1000:.0f} ms")
    if tag == "ORPHAN":
        fails.append(f"orphan {cid(c)}")

hits = sorted(c["t"] for c in C if is_hit(c))
gaps = list(np.diff(hits)) if len(hits) > 1 else []
print(f"2. big hits {[round(h, 2) for h in hits]}  gaps {[round(g, 1) for g in gaps]}  (max {a.hit_max}, >= {a.hit_gap} s apart)")
if len(hits) > a.hit_max or any(g < a.hit_gap for g in gaps):
    fails.append("hit budget")

talk = sum(b - s for s, b in lines)
inside = [c for c in fx if any(s <= c["t"] <= b for s, b in lines)]
rate = len(inside) / talk * 2 if talk else 0
print(f"3. effects during narration: {len(inside)} in {talk:.0f} s = {rate:.2f} per 2 s (limit {a.density})")
if rate > a.density:
    fails.append("density")

print(f"4. voice clarity per line (voice - rest, target >= {a.clarity} dB)")
low = []
rest = S["music"] + S["fx"] + S["amb"]
for s, b in lines:
    i, j = int(s * SR), int(b * SR)
    v, r = S["vo"][i:j], rest[i:j]
    m = len(v) // 2400 * 2400
    if m == 0:
        continue
    fv = np.sqrt((v[:m] ** 2).reshape(-1, 2400).mean(1))
    fr_ = np.sqrt((r[:m] ** 2).reshape(-1, 2400).mean(1))
    on = fv > fv.max() * 10 ** (-20 / 20)
    margin = 20 * np.log10(np.sqrt((fv[on] ** 2).mean()) / (np.sqrt((fr_[on] ** 2).mean()) + 1e-12))
    if margin < a.clarity:
        low.append((s, margin))
for s, m in low:
    print(f"   {s:7.2f} s  {m:+.1f} dB")
print(f"   {len(lines) - len(low)}/{len(lines)} lines clear")
if any(m < a.clarity - 3 for _, m in low):
    fails.append("voice clarity")

cuts = sorted({0.0, *[e["t"] for e in E if e["kind"] == "cut"], dur})
print(f"5. world vs music per shot (flag when ambience < music - {a.world} dB)")
for s, b in zip(cuts[:-1], cuts[1:]):
    i, j = int(s * SR), int(b * SR)
    if j - i < SR // 2:
        continue
    A, M = db(S["amb"][i:j]), db(S["music"][i:j])
    if A < -60 or M < -60:
        continue                         # boards / titles with no ambience by design, or no music
    if A < M - a.world:
        print(f"   {s:7.2f}-{b:7.2f}  amb {A:.1f}  music {M:.1f}")
        fails.append(f"buried world {s:.1f}")

print("RESULT:", "PASS" if not fails else "FAIL " + "; ".join(fails))
sys.exit(1 if fails else 0)
