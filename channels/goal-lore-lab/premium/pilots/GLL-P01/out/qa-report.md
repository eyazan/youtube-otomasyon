# QA report: the-free-kick-that-turned-into-a-spiral-premium-final.mp4

Objective verdict: **PASS (hard checks)** · measured 2026-10-21T16:33:54.781Z
UNVERIFIED (could not be measured, not counted as pass): audio samples clipped

| Check | Result | Measured | Target |
|---|---|---|---|
| resolution | PASS | 1080x1920 30/1 h264 | 1080x1920 |
| frame rate | PASS | 30/1 | 30/1 |
| codec | PASS | h264 High yuv420p | h264 yuv420p |
| full decode errors | PASS | 0 | 0 |
| duration (channel Shorts target) | PASS | 38.467 s | 30-50 s |
| black frames >= 0.1 s | PASS | none | none |
| first frame not empty | PASS | mean luma 55.5, detail sd 35.9, edge 2.83 | mean > 25, sd > 20 |
| static holds >= 2 s (freezedetect n=0.003) | PASS | none | none |
| audio samples clipped | *UNVERIFIED* | not reported by this FFmpeg build (astats has no clipped-sample count) | 0 |
| sample peak below full scale (decoded AAC) | PASS | -1.99 dBFS | <= -0.1 dBFS |
| flat factor (sustained full-scale runs) | PASS | 0/0/0 | 0 |
| integrated loudness | PASS | -14 LUFS | -14 +/- 1 |
| true peak | PASS | -1.9 dBTP | <= -1 dBTP |
| silence >= 1.0 s at -45 dB | PASS | none | reported (designed pauses allowed) |
| a/v duration match | PASS | 0.000 s | <= 0.1 s |
| caption layout | PASS | 22 cues, 0 over 2 lines x 26 chars | <= 2 x 26 |
| caption reading speed | PASS | 0 cues over 22 chars/s (max 18.0) | <= 22 chars/s |
| captions within video | PASS | last cue ends 38.35 s | <= 38.47 s |
| loop continuity (last -> first frame) | WARN | whole 16.36, photo region 22.28, final-second step 0, ratio 33.48 | whole <= 25; not (ratio > 3 and > 4) |
| first spoken word within 0.5 s | PASS | 0.00 s | <= 0.5 s |
| caption sync vs narration onsets (cues after a pause) | PASS | 16 cues: max 30 ms, mean 5 ms | max <= 150 ms |
| narration is real speech (lib/speech-check) | PASS | voiced 0.802, 2.52 words/s, longest silence 0.48 s | speech-check ok |
| narration voice approved for publishing | WARN | kokoro bm_george (preview fallback) | approved channel voice |
| text gate (collisions, caption band, edges, size) | PASS | 0 FAIL / 0 WARN groups; min essential 30px | 0 FAIL |
| essential text >= style minimum | PASS | 30px | >= 30px |
| no static hold >= 1.5 s inside a scene (visual change target) | WARN | longest 2.5 s (s2-when) | < 1.5 s |
| no two scenes look alike (key-frame correlation <= 0.92; hook/payoff loop pair exempt) | PASS | max 0.736 | <= 0.92 |
| deterministic frames (two fresh pages, any order) | PASS | 0.7s same, 12.3s same, 24.9s same, 29.1s same | identical |

## Motion per scene

| Scene | Seconds | Mean motion | Static share | Longest static |
|---|---|---|---|---|
| s1-hook | 3.2 | 1.743 | 0.11 | 0.33 s |
| s2-when | 4.62 | 0.698 | 0.88 | 2.5 s |
| s3-strike | 4.85 | 3.014 | 0.63 | 1.03 s |
| s4-wide | 3.57 | 2.053 | 0 | 0 s |
| s5-in | 3.73 | 0.442 | 0.37 | 0.9 s |
| s6-paper | 3.29 | 2.809 | 0.6 | 0.9 s |
| s7-forces | 6.04 | 1.947 | 0.01 | 0.03 s |
| s8-spiral | 4.48 | 0.381 | 0.81 | 1.23 s |
| s9-story | 4.68 | 1.093 | 0.5 | 0.93 s |

## Text gate findings

- none

Contact sheet: `channels/goal-lore-lab/premium/pilots/GLL-P01/out/contact-sheet.png` · Scene sheet: `channels/goal-lore-lab/premium/pilots/GLL-P01/out/scene-sheet.png`

Subjective creative evaluation is separate (revision-history.md).
