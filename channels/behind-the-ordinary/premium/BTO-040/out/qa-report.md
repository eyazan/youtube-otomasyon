# QA report: the-shopping-cart-started-as-a-folding-chair-premium-final.mp4

Objective verdict: **PASS (hard checks)** · measured 2026-10-21T16:44:18.119Z
UNVERIFIED (could not be measured, not counted as pass): audio samples clipped

| Check | Result | Measured | Target |
|---|---|---|---|
| resolution | PASS | 1080x1920 30/1 h264 | 1080x1920 |
| frame rate | PASS | 30/1 | 30/1 |
| codec | PASS | h264 High yuv420p | h264 yuv420p |
| full decode errors | PASS | 0 | 0 |
| duration (channel Shorts target) | PASS | 32.067 s | 30-50 s |
| black frames >= 0.1 s | PASS | none | none |
| first frame not empty | PASS | mean luma 67.3, detail sd 60.5, edge 4.76 | mean > 25, sd > 20 |
| static holds >= 2 s (freezedetect n=0.003) | PASS | none | none |
| audio samples clipped | *UNVERIFIED* | not reported by this FFmpeg build (astats has no clipped-sample count) | 0 |
| sample peak below full scale (decoded AAC) | PASS | -1.88 dBFS | <= -0.1 dBFS |
| flat factor (sustained full-scale runs) | PASS | 0/0/0 | 0 |
| integrated loudness | PASS | -14.1 LUFS | -14 +/- 1 |
| true peak | PASS | -1.8 dBTP | <= -1 dBTP |
| silence >= 1.0 s at -45 dB | PASS | none | reported (designed pauses allowed) |
| a/v duration match | PASS | 0.000 s | <= 0.1 s |
| caption layout | PASS | 19 cues, 0 over 2 lines x 26 chars | <= 2 x 26 |
| caption reading speed | WARN | 1 cues over 22 chars/s (max 23.9) | <= 22 chars/s |
| captions within video | PASS | last cue ends 32.02 s | <= 32.07 s |
| loop continuity (last -> first frame) | PASS | whole 0.26, photo region 0.37, final-second step 0.19, ratio 1.11 | whole <= 25; not (ratio > 3 and > 4) |
| first spoken word within 0.5 s | PASS | 0.00 s | <= 0.5 s |
| caption sync vs narration onsets (cues after a pause) | PASS | 10 cues: max 7 ms, mean 3 ms | max <= 150 ms |
| narration is real speech (lib/speech-check) | PASS | voiced 0.784, 2.68 words/s, longest silence 0.58 s | speech-check ok |
| narration voice approved for publishing | WARN | kokoro af_heart (preview fallback) | approved channel voice |
| text gate (collisions, caption band, edges, size) | PASS | 0 FAIL / 0 WARN groups; min essential 30px | 0 FAIL |
| essential text >= style minimum | PASS | 30px | >= 30px |
| no static hold >= 1.5 s inside a scene (visual change target) | PASS | longest 1.37 s (s3-idea) | < 1.5 s |
| no two scenes look alike (key-frame correlation <= 0.92; hook/payoff loop pair exempt) | PASS | max 0.846 | <= 0.92 |
| deterministic frames (two fresh pages, any order) | PASS | 0.7s same, 12.3s same, 24.9s same, 29.1s same | identical |

## Motion per scene

| Scene | Seconds | Mean motion | Static share | Longest static |
|---|---|---|---|---|
| s1-aisle | 2.69 | 2.298 | 0.04 | 0.07 s |
| s2-refused | 2.37 | 1.664 | 0.04 | 0.1 s |
| s3-idea | 6.08 | 2.114 | 0.6 | 1.37 s |
| s4-assembly | 3.87 | 2.038 | 0.33 | 0.33 s |
| s5-folding | 5.73 | 1.018 | 0.71 | 1.07 s |
| s6-baby | 3.52 | 2.533 | 0.83 | 0.97 s |
| s7-models | 3.62 | 2.035 | 0.3 | 0.53 s |
| s8-popular | 4.2 | 5.451 | 0.14 | 0.53 s |

## Text gate findings

- none

Contact sheet: `channels/behind-the-ordinary/premium/BTO-040/out/contact-sheet.png` · Scene sheet: `channels/behind-the-ordinary/premium/BTO-040/out/scene-sheet.png`

Subjective creative evaluation is separate (revision-history.md).
