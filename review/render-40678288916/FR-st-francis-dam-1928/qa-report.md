# QA report: st-francis-dam-1928-premium-final.mp4

Objective verdict: **PASS (hard checks)** · measured 2026-10-28T11:23:21.636Z
UNVERIFIED (could not be measured, not counted as pass): audio samples clipped

| Check | Result | Measured | Target |
|---|---|---|---|
| resolution | PASS | 1080x1920 30/1 h264 | 1080x1920 |
| frame rate | PASS | 30/1 | 30/1 |
| codec | PASS | h264 High yuv420p | h264 yuv420p |
| full decode errors | PASS | 0 | 0 |
| duration (channel Shorts target) | PASS | 28.433 s | 20-60 s |
| black frames >= 0.1 s | PASS | none | none |
| first frame not empty | PASS | mean luma 29.7, detail sd 20.4, edge 2.11 | mean > 25, sd > 20 |
| static holds >= 2 s (freezedetect n=0.003) | PASS | none | none |
| audio samples clipped | *UNVERIFIED* | not reported by this FFmpeg build (astats has no clipped-sample count) | 0 |
| sample peak below full scale (decoded AAC) | PASS | -1.89 dBFS | <= -0.1 dBFS |
| flat factor (sustained full-scale runs) | PASS | 0/0/0 | 0 |
| integrated loudness | PASS | -14.1 LUFS | -14 +/- 1 |
| true peak | PASS | -1.9 dBTP | <= -1 dBTP |
| silence >= 1.0 s at -45 dB | PASS | none | reported (designed pauses allowed) |
| a/v duration match | PASS | 0.000 s | <= 0.1 s |
| caption layout | PASS | 16 cues, 0 over 2 lines x 26 chars | <= 2 x 26 |
| caption reading speed | WARN | 1 cues over 22 chars/s (max 24.9) | <= 22 chars/s |
| captions within video | PASS | last cue ends 28.03 s | <= 28.43 s |
| loop continuity (last -> first frame) | PASS | whole 0.2, photo region 0.2, final-second step 0.02, ratio 1.33 | whole <= 25; not (ratio > 3 and > 4) |
| first spoken word within 0.5 s | PASS | 0.00 s | <= 0.5 s |
| caption sync vs narration onsets (cues after a pause) | PASS | 12 cues: max 81 ms, mean 43 ms | max <= 150 ms |
| narration is real speech (lib/speech-check) | PASS | voiced 0.704, 2.44 words/s, longest silence 0.7 s | speech-check ok |
| narration voice approved for publishing | PASS | en-US-AndrewMultilingualNeural | approved channel voice |
| text gate (collisions, caption band, edges, size) | PASS | 0 FAIL / 0 WARN groups; min essential 30px | 0 FAIL |
| essential text >= style minimum | PASS | 30px | >= 30px |
| no static hold >= 1.5 s inside a scene (visual change target) | PASS | longest 1.27 s (s8-payoff) | < 1.5 s |
| no two scenes look alike (key-frame correlation <= 0.92; hook/payoff loop pair exempt) | PASS | max 0.871 | <= 0.92 |
| deterministic frames (two fresh pages, any order) | PASS | 0.7s same, 12.3s same, 24.9s same | identical |

## Motion per scene

| Scene | Seconds | Mean motion | Static share | Longest static |
|---|---|---|---|---|
| s1-hook | 3.32 | 0.244 | 0.63 | 1 s |
| s2-chain | 5.32 | 0.975 | 0.72 | 0.9 s |
| s3-chain | 3.64 | 0.167 | 0.86 | 0.9 s |
| s4-mechanism | 2.22 | 1.058 | 0.33 | 0.7 s |
| s5-mechanism | 2.09 | 1.261 | 0.31 | 0.37 s |
| s6-mechanism | 3.98 | 0.674 | 0.36 | 0.7 s |
| s7-mechanism | 3.1 | 0.828 | 0.34 | 0.73 s |
| s8-payoff | 4.77 | 0.465 | 0.56 | 1.27 s |

## Text gate findings

- none

Contact sheet: `../../_temp/review/FR-st-francis-dam-1928/out/contact-sheet.png` · Scene sheet: `../../_temp/review/FR-st-francis-dam-1928/out/scene-sheet.png`

Subjective creative evaluation is separate (revision-history.md).
