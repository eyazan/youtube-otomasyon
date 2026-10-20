# QA report: why-qr-codes-have-three-corner-squares-premium-final.mp4

Objective verdict: **PASS (hard checks)** · measured 2026-10-19T11:33:48.118Z

| Check | Result | Measured | Target |
|---|---|---|---|
| resolution | PASS | 1080x1920 30/1 h264 | 1080x1920 |
| frame rate | PASS | 30/1 | 30/1 |
| codec | PASS | h264 High yuv420p | h264 yuv420p |
| full decode errors | PASS | 0 | 0 |
| duration (channel Shorts target) | PASS | 31.6 s | 30-50 s |
| black frames >= 0.1 s | PASS | none | none |
| first frame not empty | PASS | mean luma 78.1, detail sd 84.5, edge 5.41 | mean > 25, sd > 20 |
| static holds >= 2 s (freezedetect n=0.003) | PASS | none | none |
| audio clipping | PASS | clipped , flat 0/0/0 | 0 |
| integrated loudness | PASS | -14.1 LUFS | -14 +/- 1 |
| true peak | PASS | -1.8 dBTP | <= -1 dBTP |
| silence >= 1.0 s at -45 dB | PASS | none | reported (designed pauses allowed) |
| a/v duration match | PASS | 0.000 s | <= 0.1 s |
| caption layout | PASS | 15 cues, 0 over 2 lines x 26 chars | <= 2 x 26 |
| caption reading speed | WARN | 1 cues over 22 chars/s (max 23.8) | <= 22 chars/s |
| captions within video | PASS | last cue ends 30.71 s | <= 31.60 s |
| loop continuity (last -> first frame) | PASS | whole 0.32, photo region 0.37, final-second step 5.42, ratio 0.14 | whole <= 25; not (ratio > 3 and > 4) |
| first spoken word within 0.5 s | PASS | 0.00 s | <= 0.5 s |
| caption sync vs narration onsets (cues after a pause) | PASS | 8 cues: max 8 ms, mean 4 ms | max <= 150 ms |
| text gate (collisions, caption band, edges, size) | PASS | 0 FAIL / 1 WARN groups; min essential 30px | 0 FAIL |
| essential text >= style minimum | PASS | 30px | >= 30px |
| no static hold >= 1.5 s inside a scene (visual change target) | PASS | longest 1.3 s (s3-origin) | < 1.5 s |
| no two scenes look alike (key-frame correlation <= 0.92; hook/payoff loop pair exempt) | PASS | max 0.667 | <= 0.92 |
| on-screen QR decodes (first and last frame) | PASS | 0.0s: HIDDEN LOGIC; 31.5s: HIDDEN LOGIC | HIDDEN LOGIC |
| deterministic frames (two fresh pages, any order) | PASS | 0.7s same, 12.3s same, 24.9s same, 29.1s same | identical |

## Motion per scene

| Scene | Seconds | Mean motion | Static share | Longest static |
|---|---|---|---|---|
| s1-hook | 2.49 | 0.788 | 0.3 | 0.43 s |
| s2-locate | 1.87 | 3.799 | 0.4 | 0.4 s |
| s3-origin | 5.52 | 1.302 | 0.56 | 1.3 s |
| s4-anatomy | 5.72 | 4.823 | 0.49 | 0.67 s |
| s5-why-squares | 4.84 | 0.963 | 0.22 | 0.47 s |
| s6-ratio | 6.15 | 0.978 | 0.59 | 0.87 s |
| s7-any-angle | 5.01 | 5.016 | 0.33 | 0.67 s |

## Text gate findings

- WARN 10.00–10.00 s text under right UI buttons: "esponse" x=516-952


Contact sheet: `channels/behind-the-ordinary/premium/BTO-301/out/contact-sheet.png` · Scene sheet: `channels/behind-the-ordinary/premium/BTO-301/out/scene-sheet.png`

Subjective creative evaluation is separate (revision-history.md).
