# QA report: could-earth-survive-one-day-without-earth-s-magnetic-field-premium-preview.mp4

Objective verdict: **PASS (hard checks)** · measured 2026-10-22T03:59:07.482Z
UNVERIFIED (could not be measured, not counted as pass): audio samples clipped

| Check | Result | Measured | Target |
|---|---|---|---|
| resolution | PASS | 540x960 30/1 h264 | 540x960 |
| frame rate | PASS | 30/1 | 30/1 |
| codec | PASS | h264 High yuv420p | h264 yuv420p |
| full decode errors | PASS | 0 | 0 |
| duration (channel Shorts target) | PASS | 28.233 s | 18-42 s |
| black frames >= 0.1 s | PASS | none | none |
| first frame not empty | PASS | mean luma 39.2, detail sd 35.2, edge 1.40 | mean > 25, sd > 20 |
| static holds >= 2 s (freezedetect n=0.003) | PASS | none | none |
| audio samples clipped | *UNVERIFIED* | not reported by this FFmpeg build (astats has no clipped-sample count) | 0 |
| sample peak below full scale (decoded AAC) | PASS | -1.52 dBFS | <= -0.1 dBFS |
| flat factor (sustained full-scale runs) | PASS | 0/0/0 | 0 |
| integrated loudness | PASS | -14.3 LUFS | -14 +/- 1 |
| true peak | PASS | -1.5 dBTP | <= -1 dBTP |
| silence >= 1.0 s at -45 dB | PASS | none | reported (designed pauses allowed) |
| a/v duration match | PASS | 0.000 s | <= 0.1 s |
| caption layout | PASS | 17 cues, 0 over 2 lines x 26 chars | <= 2 x 26 |
| caption reading speed | WARN | 1 cues over 22 chars/s (max 23.7) | <= 22 chars/s |
| captions within video | PASS | last cue ends 27.94 s | <= 28.23 s |
| loop continuity (last -> first frame) | WARN | whole 8.88, photo region 14.38, final-second step 0.21, ratio 13.2 | whole <= 25; not (ratio > 3 and > 4) |
| first spoken word within 0.5 s | PASS | 0.00 s | <= 0.5 s |
| caption sync vs narration onsets (cues after a pause) | PASS | 9 cues: max 38 ms, mean 11 ms | max <= 150 ms |
| narration is real speech (lib/speech-check) | PASS | voiced 0.841, 2.57 words/s, longest silence 0.34 s | speech-check ok |
| narration voice approved for publishing | WARN | kokoro am_fenrir (preview fallback) | approved channel voice |
| text gate (collisions, caption band, edges, size) | PASS | 0 FAIL / 0 WARN groups; min essential 30px | 0 FAIL |
| essential text >= style minimum | PASS | 30px | >= 30px |
| no static hold >= 1.5 s inside a scene (visual change target) | WARN | longest 1.5 s (s2-measure) | < 1.5 s |
| no two scenes look alike (key-frame correlation <= 0.92; hook/payoff loop pair exempt) | PASS | max 0.799 | <= 0.92 |
| deterministic frames (two fresh pages, any order) | PASS | 0.7s same, 12.3s same, 24.9s same | identical |

## Motion per scene

| Scene | Seconds | Mean motion | Static share | Longest static |
|---|---|---|---|---|
| s1-hook | 2.26 | 0.479 | 0.36 | 0.47 s |
| s2-measure | 4.26 | 0.442 | 0.78 | 1.5 s |
| s3-measure | 4.57 | 0.446 | 0.42 | 0.97 s |
| s4-measure | 3.39 | 0.542 | 0.61 | 0.8 s |
| s5-mechanism | 2.91 | 0.514 | 0.43 | 0.57 s |
| s6-mechanism | 3.56 | 0.625 | 0.26 | 0.47 s |
| s7-mechanism | 3.43 | 0.934 | 0.01 | 0.03 s |
| s8-payoff | 3.86 | 0.815 | 0.64 | 0.67 s |

## Text gate findings

- none

Contact sheet: `channels/impossible-brief/premium/IB-EAR-019/out/contact-sheet.png` · Scene sheet: `channels/impossible-brief/premium/IB-EAR-019/out/scene-sheet.png`

Subjective creative evaluation is separate (revision-history.md).
