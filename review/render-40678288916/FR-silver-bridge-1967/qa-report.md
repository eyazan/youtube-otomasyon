# QA report: silver-bridge-1967-premium-final.mp4

Objective verdict: **FAIL** · measured 2026-10-28T11:20:43.317Z
UNVERIFIED (could not be measured, not counted as pass): audio samples clipped

| Check | Result | Measured | Target |
|---|---|---|---|
| resolution | PASS | 1080x1920 30/1 h264 | 1080x1920 |
| frame rate | PASS | 30/1 | 30/1 |
| codec | PASS | h264 High yuv420p | h264 yuv420p |
| full decode errors | PASS | 0 | 0 |
| duration (channel Shorts target) | PASS | 28.567 s | 20-60 s |
| black frames >= 0.1 s | PASS | none | none |
| first frame not empty | **FAIL** | mean luma 29.6, detail sd 19.1, edge 2.17 | mean > 25, sd > 20 |
| static holds >= 2 s (freezedetect n=0.003) | PASS | none | none |
| audio samples clipped | *UNVERIFIED* | not reported by this FFmpeg build (astats has no clipped-sample count) | 0 |
| sample peak below full scale (decoded AAC) | PASS | -1.94 dBFS | <= -0.1 dBFS |
| flat factor (sustained full-scale runs) | PASS | 0/0/0 | 0 |
| integrated loudness | PASS | -14.1 LUFS | -14 +/- 1 |
| true peak | PASS | -1.9 dBTP | <= -1 dBTP |
| silence >= 1.0 s at -45 dB | PASS | none | reported (designed pauses allowed) |
| a/v duration match | PASS | 0.000 s | <= 0.1 s |
| caption layout | PASS | 16 cues, 0 over 2 lines x 26 chars | <= 2 x 26 |
| caption reading speed | PASS | 0 cues over 22 chars/s (max 19.4) | <= 22 chars/s |
| captions within video | PASS | last cue ends 28.15 s | <= 28.57 s |
| loop continuity (last -> first frame) | PASS | whole 0.2, photo region 0.22, final-second step 0.03, ratio 1.33 | whole <= 25; not (ratio > 3 and > 4) |
| first spoken word within 0.5 s | PASS | 0.00 s | <= 0.5 s |
| caption sync vs narration onsets (cues after a pause) | PASS | 11 cues: max 76 ms, mean 48 ms | max <= 150 ms |
| narration is real speech (lib/speech-check) | PASS | voiced 0.74, 2.57 words/s, longest silence 0.78 s | speech-check ok |
| narration voice approved for publishing | PASS | en-US-AndrewMultilingualNeural | approved channel voice |
| text gate (collisions, caption band, edges, size) | PASS | 0 FAIL / 0 WARN groups; min essential 30px | 0 FAIL |
| essential text >= style minimum | PASS | 30px | >= 30px |
| no static hold >= 1.5 s inside a scene (visual change target) | PASS | longest 1.27 s (s6-chain) | < 1.5 s |
| no two scenes look alike (key-frame correlation <= 0.92; hook/payoff loop pair exempt) | PASS | max 0.564 | <= 0.92 |
| deterministic frames (two fresh pages, any order) | PASS | 0.7s same, 12.3s same, 24.9s same | identical |

## Motion per scene

| Scene | Seconds | Mean motion | Static share | Longest static |
|---|---|---|---|---|
| s1-hook | 3.98 | 0.216 | 0.68 | 1.17 s |
| s2-toll | 4.69 | 0.356 | 0.71 | 0.93 s |
| s3-chain | 2.16 | 0.442 | 0.86 | 0.67 s |
| s4-trigger | 3.47 | 1.154 | 0.27 | 0.57 s |
| s5-chain | 3.62 | 1.117 | 0.64 | 0.63 s |
| s6-chain | 3.4 | 1.339 | 0.59 | 1.27 s |
| s7-mechanism | 2.45 | 1.032 | 0.36 | 0.8 s |
| s8-payoff | 4.8 | 0.461 | 0.52 | 0.77 s |

## Text gate findings

- none

Contact sheet: `../../_temp/review/FR-silver-bridge-1967/out/contact-sheet.png` · Scene sheet: `../../_temp/review/FR-silver-bridge-1967/out/scene-sheet.png`

Subjective creative evaluation is separate (revision-history.md).
