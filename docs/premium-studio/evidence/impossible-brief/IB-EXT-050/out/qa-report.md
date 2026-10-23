# QA report: what-if-we-tried-to-drill-through-the-earth-premium-preview.mp4

Objective verdict: **PASS (hard checks)** · measured 2026-10-22T04:00:51.046Z
UNVERIFIED (could not be measured, not counted as pass): audio samples clipped

| Check | Result | Measured | Target |
|---|---|---|---|
| resolution | PASS | 540x960 30/1 h264 | 540x960 |
| frame rate | PASS | 30/1 | 30/1 |
| codec | PASS | h264 High yuv420p | h264 yuv420p |
| full decode errors | PASS | 0 | 0 |
| duration (channel Shorts target) | PASS | 29.6 s | 18-42 s |
| black frames >= 0.1 s | PASS | none | none |
| first frame not empty | PASS | mean luma 39.2, detail sd 35.2, edge 1.40 | mean > 25, sd > 20 |
| static holds >= 2 s (freezedetect n=0.003) | PASS | none | none |
| audio samples clipped | *UNVERIFIED* | not reported by this FFmpeg build (astats has no clipped-sample count) | 0 |
| sample peak below full scale (decoded AAC) | PASS | -1.46 dBFS | <= -0.1 dBFS |
| flat factor (sustained full-scale runs) | PASS | 0/0/0 | 0 |
| integrated loudness | PASS | -14.3 LUFS | -14 +/- 1 |
| true peak | PASS | -1.5 dBTP | <= -1 dBTP |
| silence >= 1.0 s at -45 dB | PASS | none | reported (designed pauses allowed) |
| a/v duration match | PASS | 0.000 s | <= 0.1 s |
| caption layout | PASS | 17 cues, 0 over 2 lines x 26 chars | <= 2 x 26 |
| caption reading speed | PASS | 0 cues over 22 chars/s (max 19.5) | <= 22 chars/s |
| captions within video | PASS | last cue ends 29.31 s | <= 29.60 s |
| loop continuity (last -> first frame) | WARN | whole 8.49, photo region 15.2, final-second step 0.19, ratio 13.08 | whole <= 25; not (ratio > 3 and > 4) |
| first spoken word within 0.5 s | PASS | 0.00 s | <= 0.5 s |
| caption sync vs narration onsets (cues after a pause) | PASS | 8 cues: max 20 ms, mean 5 ms | max <= 150 ms |
| narration is real speech (lib/speech-check) | PASS | voiced 0.831, 2.31 words/s, longest silence 0.42 s | speech-check ok |
| narration voice approved for publishing | WARN | kokoro am_fenrir (preview fallback) | approved channel voice |
| text gate (collisions, caption band, edges, size) | PASS | 0 FAIL / 0 WARN groups; min essential 30px | 0 FAIL |
| essential text >= style minimum | PASS | 30px | >= 30px |
| no static hold >= 1.5 s inside a scene (visual change target) | WARN | longest 1.83 s (s5-heat) | < 1.5 s |
| no two scenes look alike (key-frame correlation <= 0.92; hook/payoff loop pair exempt) | PASS | max 0.739 | <= 0.92 |
| deterministic frames (two fresh pages, any order) | PASS | 0.7s same, 12.3s same, 24.9s same, 29.1s same | identical |

## Motion per scene

| Scene | Seconds | Mean motion | Static share | Longest static |
|---|---|---|---|---|
| s1-hook | 4.72 | 0.301 | 0.55 | 0.67 s |
| s2-zoom | 1.61 | 2.863 | 0.04 | 0.03 s |
| s3-year | 4.75 | 0.617 | 0.56 | 1.33 s |
| s4-measure | 3.16 | 0.465 | 0.44 | 0.63 s |
| s5-heat | 4.62 | 0.525 | 0.43 | 1.83 s |
| s6-flow | 3.63 | 0.463 | 0.59 | 1.2 s |
| s7-cut | 2.63 | 0.682 | 0.35 | 0.73 s |
| s8-payoff | 4.46 | 0.4 | 0.66 | 0.47 s |

## Text gate findings

- none

Contact sheet: `channels/impossible-brief/premium/IB-EXT-050/out/contact-sheet.png` · Scene sheet: `channels/impossible-brief/premium/IB-EXT-050/out/scene-sheet.png`

Subjective creative evaluation is separate (revision-history.md).
