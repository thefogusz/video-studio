"""Merge Whisper's Thai sub-word timestamps into real words.

Whisper --word_timestamps on Thai returns token fragments, not words. This
re-segments the text with PyThaiNLP and gives each word the start of its
first fragment and the end of its last.

Usage:
    pip install pythainlp
    python thai_words.py audio.json words.json [--text corrected.txt]

--text: proof-read transcript (same speech, spelling fixed). Its characters
are aligned to the fragments by position, so keep fixes roughly the same
length; for big rewrites, re-time by hand instead.
Output: [{"word": "สวัสดี", "start": 0.18, "end": 0.66}, ...]
"""
import argparse
import json

from pythainlp.tokenize import word_tokenize


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("whisper_json")
    ap.add_argument("out_json")
    ap.add_argument("--text", help="proof-read transcript to segment instead of Whisper's text")
    a = ap.parse_args()

    data = json.load(open(a.whisper_json, encoding="utf-8"))
    frags = [w for s in data["segments"] for w in s.get("words", [])]
    if not frags:
        raise SystemExit("no word timestamps: run whisper with --word_timestamps True")

    spans, pos = [], 0
    for f in frags:
        t = f["word"].replace(" ", "")
        spans.append((pos, pos + len(t), f))
        pos += len(t)

    text = open(a.text, encoding="utf-8").read() if a.text else "".join(f["word"] for f in frags)
    text = "".join(text.split())
    scale = pos / max(len(text), 1)  # tolerate small length differences after corrections

    out, c = [], 0
    for w in word_tokenize(text, engine="newmm"):
        if not w.strip():
            continue
        a0, b0 = c * scale, (c + len(w)) * scale
        c += len(w)
        cov = [f for (s, e, f) in spans if s < b0 and e > a0] or [spans[-1][2]]
        out.append({"word": w, "start": round(cov[0]["start"], 3), "end": round(cov[-1]["end"], 3)})

    json.dump(out, open(a.out_json, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"{len(frags)} fragments -> {len(out)} words -> {a.out_json}")


if __name__ == "__main__":
    main()
