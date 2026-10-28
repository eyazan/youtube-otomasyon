# QA report: why-qr-codes-have-three-corner-squares-premium-final-v2.mp4

Objective verdict: **PASS (hard checks)** · measured 2026-10-20T17:28:33.578Z
UNVERIFIED (could not be measured, not counted as pass): audio samples clipped

| Check | Result | Measured | Target |
|---|---|---|---|
| resolution | PASS | 1080x1920 30/1 h264 | 1080x1920 |
| frame rate | PASS | 30/1 | 30/1 |
| codec | PASS | h264 High yuv420p | h264 yuv420p |
| full decode errors | PASS | 0 | 0 |
| duration (channel Shorts target) | PASS | 31.6 s | 30-50 s |
| black frames >= 0.1 s | PASS | none | none |
| first frame not empty | PASS | mean luma 102.1, detail sd 71.7, edge 5.49 | mean > 25, sd > 20 |
| static holds >= 2 s (freezedetect n=0.003) | PASS | none | none |
| audio samples clipped | *UNVERIFIED* | not reported by this FFmpeg build (astats has no clipped-sample count) | 0 |
| sample peak below full scale (decoded AAC) | PASS | -1.89 dBFS | <= -0.1 dBFS |
| flat factor (sustained full-scale runs) | PASS | 0/0/0 | 0 |
| integrated loudness | PASS | -14.1 LUFS | -14 +/- 1 |
| true peak | PASS | -1.8 dBTP | <= -1 dBTP |
| silence >= 1.0 s at -45 dB | PASS | none | reported (designed pauses allowed) |
| a/v duration match | PASS | 0.000 s | <= 0.1 s |
| caption layout | PASS | 15 cues, 0 over 2 lines x 26 chars | <= 2 x 26 |
| caption reading speed | WARN | 1 cues over 22 chars/s (max 23.8) | <= 22 chars/s |
| captions within video | PASS | last cue ends 30.71 s | <= 31.60 s |
| loop continuity (last -> first frame) | PASS | whole 0.63, photo region 0.56, final-second step 9.27, ratio 0.12 | whole <= 25; not (ratio > 3 and > 4) |
| first spoken word within 0.5 s | PASS | 0.00 s | <= 0.5 s |
| caption sync vs narration onsets (cues after a pause) | PASS | 9 cues: max 42 ms, mean 8 ms | max <= 150 ms |
| narration is real speech (lib/speech-check) | PASS | voiced 0.782, 2.56 words/s, longest silence 0.56 s | speech-check ok |
| narration voice approved for publishing | WARN | kokoro af_heart (preview fallback) | approved channel voice |
| text gate (collisions, caption band, edges, size) | PASS | 0 FAIL / 0 WARN groups; min essential 30px | 0 FAIL |
| essential text >= style minimum | PASS | 30px | >= 30px |
| no static hold >= 1.5 s inside a scene (visual change target) | PASS | longest 0.9 s (s5-why-squares) | < 1.5 s |
| no two scenes look alike (key-frame correlation <= 0.92; hook/payoff loop pair exempt) | PASS | max 0.668 | <= 0.92 |
| on-screen QR decodes (first and last frame) | PASS | 0.0s: HIDDEN LOGIC; 31.5s: HIDDEN LOGIC | HIDDEN LOGIC |
| deterministic frames (two fresh pages, any order) | PASS | 0.7s same, 12.3s same, 24.9s same, 29.1s same | identical |

## Motion per scene

| Scene | Seconds | Mean motion | Static share | Longest static |
|---|---|---|---|---|
| s1-hook | 2.49 | 3.667 | 0.41 | 0.7 s |
| s2-scanner-view | 1.87 | 3.874 | 0.29 | 0.3 s |
| s3-origin | 5.52 | 2.322 | 0.1 | 0.27 s |
| s4-anatomy | 5.72 | 6.809 | 0.36 | 0.63 s |
| s5-why-squares | 4.84 | 2.647 | 0.19 | 0.9 s |
| s6-ratio | 6.15 | 2.185 | 0.45 | 0.8 s |
| s7-any-angle | 5.01 | 5.903 | 0.28 | 0.67 s |

## Text gate findings

- none

Contact sheet: `channels/behind-the-ordinary/premium/BTO-301/out/v2/contact-sheet.png` · Scene sheet: `channels/behind-the-ordinary/premium/BTO-301/out/v2/scene-sheet.png`

Subjective creative evaluation is separate (revision-history.md).
