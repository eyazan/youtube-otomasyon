#!/usr/bin/env python3
"""Real QR symbol as data for the studio's qr-symbol component.

    python3 -I qr_matrix.py "<text>" <out.json> [--error m] [--version 1]

Encodes with segno (BSD-3-Clause, pinned 1.6.6) and decodes the encoded matrix back with zxing-cpp
(Apache-2.0, pinned 2.3.0) before writing, so the code shown on screen is a valid, scannable symbol.
Output: {text, version, error, size, matrix: ["0101..", ...], finders: [{row, col, size}], provenance}.
"""
import json, sys
import segno
import zxingcpp
from PIL import Image

args = sys.argv[1:]
opt = lambda k, d: args[args.index(k) + 1] if k in args else d
text, out = args[0], args[1]
q = segno.make(text, error=opt("--error", "m"), version=int(opt("--version", "1")), micro=False, boost_error=False)
rows = [''.join('1' if c else '0' for c in r) for r in q.matrix]
n = len(rows)
# decode check on a rendered image of the same matrix (quiet zone 4, 10 px modules)
s = 10; img = Image.new("L", ((n + 8) * s, (n + 8) * s), 255)
for y, r in enumerate(rows):
    for x, c in enumerate(r):
        if c == "1":
            img.paste(0, ((x + 4) * s, (y + 4) * s, (x + 5) * s, (y + 5) * s))
dec = zxingcpp.read_barcodes(img)
assert dec and dec[0].text == text, f"decode check failed: {[d.text for d in dec]}"
finders = [{"row": 0, "col": 0, "size": 7}, {"row": 0, "col": n - 7, "size": 7}, {"row": n - 7, "col": 0, "size": 7}]
json.dump({"text": text, "version": q.version, "error": q.error, "mode": q.mode, "size": n, "matrix": rows, "finders": finders,
           "provenance": {"generator": "segno 1.6.6 (BSD-3-Clause)", "decodeCheck": "zxing-cpp 2.3.0 decoded the matrix to the same text",
                          "kind": "original generated symbol (no third-party asset)"}}, open(out, "w"), indent=1)
print(f"QR v{q.version}-{q.error} {n}x{n} '{text}' -> {out} (decoded OK)")
