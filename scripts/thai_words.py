"""Merge Whisper's Thai sub-word timestamps into real words.

Whisper --word_timestamps on Thai returns token fragments, not words. This
re-segments the text with PyThaiNLP and gives each word the start of its
first fragment and the end of its last.

Usage:
    pip install pythainlp
    python thai_words.py audio.json words.json [--text corrected.txt]

--text: proof-read transcript of the same speech (spelling fixed, fillers
dropped or reworded). Its characters are aligned to the characters Whisper
heard with a sequence match, so a stretch Whisper mis-heard, or words the
speaker said but the text leaves out, only affect the words nearby instead of
shifting every later word. Words with no matched character get times
interpolated between their neighbours and are flagged "matched": false.
Output: [{"word": "สวัสดี", "start": 0.18, "end": 0.66, "matched": true}, ...]
"""
import argparse
import difflib
import json

from pythainlp.tokenize import word_tokenize


def heard_chars(frags):
    """Every heard character with a time, spread evenly across its fragment."""
    chars, times = [], []
    for f in frags:
        text = f["word"].replace(" ", "")
        for k in range(len(text)):
            chars.append(text[k])
            times.append((f["start"] + (f["end"] - f["start"]) * k / len(text),
                          f["start"] + (f["end"] - f["start"]) * (k + 1) / len(text)))
    return "".join(chars), times


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
    heard, times = heard_chars(frags)

    text = open(a.text, encoding="utf-8").read() if a.text else heard
    words = [w for w in word_tokenize("".join(text.split()), engine="newmm") if w.strip()]
    proof = "".join(words)

    # proof character index -> heard character index; blocks of 1 are mostly coincidence
    hit = {}
    for blk in difflib.SequenceMatcher(None, proof, heard, autojunk=False).get_matching_blocks():
        if blk.size >= 2 or not a.text:
            for k in range(blk.size):
                hit[blk.a + k] = blk.b + k

    out, c = [], 0
    for w in words:
        idx = [hit[i] for i in range(c, c + len(w)) if i in hit]
        c += len(w)
        if idx:
            out.append({"word": w, "start": round(times[idx[0]][0], 3), "end": round(times[idx[-1]][1], 3), "matched": True})
        else:
            out.append({"word": w, "start": None, "end": None, "matched": False})

    # fill unmatched words between the matched words around them
    known = [i for i, o in enumerate(out) if o["matched"]]
    if not known:
        raise SystemExit("the text and the transcript share nothing: is it the same speech?")
    for i, o in enumerate(out):
        if o["matched"]:
            continue
        lo = max((k for k in known if k < i), default=None)
        hi = min((k for k in known if k > i), default=None)
        t0 = out[lo]["end"] if lo is not None else frags[0]["start"]
        t1 = out[hi]["start"] if hi is not None else frags[-1]["end"]
        n0 = lo if lo is not None else -1
        n1 = hi if hi is not None else len(out)
        step = (t1 - t0) / (n1 - n0)
        o["start"], o["end"] = round(t0 + step * (i - n0 - 1), 3), round(t0 + step * (i - n0), 3)

    json.dump(out, open(a.out_json, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"{len(frags)} fragments -> {len(out)} words ({len(known)} matched) -> {a.out_json}")


if __name__ == "__main__":
    main()
