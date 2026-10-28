# QA report: why-qr-codes-have-three-corner-squares-premium-preview.mp4

Objective verdict: **PASS (hard checks)** · measured 2026-10-19T11:24:30.554Z

| Check | Result | Measured | Target |
|---|---|---|---|
| resolution | PASS | 540x960 30/1 h264 | 540x960 |
| frame rate | PASS | 30/1 | 30/1 |
| codec | PASS | h264 High yuv420p | h264 yuv420p |
| full decode errors | PASS | 0 | 0 |
| duration (channel Shorts target) | PASS | 31.6 s | 30-50 s |
| black frames >= 0.1 s | PASS | none | none |
| first frame not empty | PASS | mean luma 77.6, detail sd 84.5, edge 5.15 | mean > 25, sd > 20 |
| static holds >= 2 s (freezedetect n=0.003) | PASS | none | none |
| audio clipping | PASS | clipped , flat 0/0/0 | 0 |
| integrated loudness | PASS | -14.1 LUFS | -14 +/- 1 |
| true peak | PASS | -1.8 dBTP | <= -1 dBTP |
| silence >= 1.0 s at -45 dB | PASS | none | reported (designed pauses allowed) |
| a/v duration match | PASS | 0.000 s | <= 0.1 s |
| caption layout | PASS | 15 cues, 0 over 2 lines x 26 chars | <= 2 x 26 |
| caption reading speed | WARN | 2 cues over 22 chars/s (max 24.2) | <= 22 chars/s |
| captions within video | PASS | last cue ends 30.71 s | <= 31.60 s |
| loop continuity (last -> first frame) | PASS | whole 0.78, photo region 1.33, final-second step 5.42, ratio 0.22 | whole <= 25; not (ratio > 3 and > 4) |
| first spoken word within 0.5 s | PASS | 0.00 s | <= 0.5 s |
| caption sync vs narration onsets (cues after a pause) | WARN | 10 cues: max 499 ms, mean 85 ms | max <= 150 ms |
| text gate (collisions, caption band, edges, size) | PASS | 0 FAIL / 1 WARN groups; min essential 24px | 0 FAIL |
| essential text >= style minimum | WARN | 24px | >= 30px |
| no static hold >= 1.5 s inside a scene (visual change target) | WARN | longest 1.73 s (s5-why-squares) | < 1.5 s |
| no two scenes look alike (key-frame correlation <= 0.92; hook/payoff loop pair exempt) | PASS | max 0.684 | <= 0.92 |
| on-screen QR decodes (first and last frame) | PASS | 0.0s: HIDDEN LOGIC; 31.5s: HIDDEN LOGIC | HIDDEN LOGIC |
| deterministic frames (two fresh pages, any order) | PASS | 0.7s same, 12.3s same, 24.9s same, 29.1s same | identical |

## Motion per scene

| Scene | Seconds | Mean motion | Static share | Longest static |
|---|---|---|---|---|
| s1-hook | 2.49 | 0.782 | 0.32 | 0.5 s |
| s2-locate | 1.87 | 3.763 | 0.4 | 0.47 s |
| s3-origin | 5.52 | 1.276 | 0.59 | 1.3 s |
| s4-anatomy | 5.72 | 4.795 | 0.5 | 0.53 s |
| s5-why-squares | 4.84 | 0.712 | 0.51 | 1.73 s |
| s6-ratio | 6.15 | 0.952 | 0.63 | 0.87 s |
| s7-any-angle | 5.01 | 4.627 | 0.36 | 0.8 s |

## Text gate findings

- WARN 10.00–10.00 s text under right UI buttons: "esponse" x=516-952


Contact sheet: `channels/behind-the-ordinary/premium/BTO-301/out/contact-sheet.png` · Scene sheet: `channels/behind-the-ordinary/premium/BTO-301/out/scene-sheet.png`

Subjective creative evaluation is separate (revision-history.md).
