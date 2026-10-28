# QA report: vajont-dam-1963-premium-final.mp4

Objective verdict: **PASS (hard checks)** · measured 2026-10-28T12:15:05.254Z
UNVERIFIED (could not be measured, not counted as pass): audio samples clipped

| Check | Result | Measured | Target |
|---|---|---|---|
| resolution | PASS | 1080x1920 30/1 h264 | 1080x1920 |
| frame rate | PASS | 30/1 | 30/1 |
| codec | PASS | h264 High yuv420p | h264 yuv420p |
| full decode errors | PASS | 0 | 0 |
| duration (channel Shorts target) | PASS | 30.233 s | 20-60 s |
| black frames >= 0.1 s | PASS | none | none |
| first frame not empty | PASS | mean luma 33.7, detail sd 26.1, edge 2.17 | mean > 25, sd > 20 |
| static holds >= 2 s (freezedetect n=0.003) | PASS | none | none |
| audio samples clipped | *UNVERIFIED* | not reported by this FFmpeg build (astats has no clipped-sample count) | 0 |
| sample peak below full scale (decoded AAC) | PASS | -1.97 dBFS | <= -0.1 dBFS |
| flat factor (sustained full-scale runs) | PASS | 0/0/0 | 0 |
| integrated loudness | PASS | -14 LUFS | -14 +/- 1 |
| true peak | PASS | -2 dBTP | <= -1 dBTP |
| silence >= 1.0 s at -45 dB | PASS | none | reported (designed pauses allowed) |
| a/v duration match | PASS | 0.000 s | <= 0.1 s |
| caption layout | PASS | 16 cues, 0 over 2 lines x 26 chars | <= 2 x 26 |
| caption reading speed | PASS | 0 cues over 22 chars/s (max 19.7) | <= 22 chars/s |
| captions within video | PASS | last cue ends 29.80 s | <= 30.23 s |
| loop continuity (last -> first frame) | PASS | whole 0.87, photo region 0.85, final-second step 0.01, ratio 2.66 | whole <= 25; not (ratio > 3 and > 4) |
| first spoken word within 0.5 s | PASS | 0.00 s | <= 0.5 s |
| caption sync vs narration onsets (cues after a pause) | PASS | 12 cues: max 74 ms, mean 46 ms | max <= 150 ms |
| narration is real speech (lib/speech-check) | PASS | voiced 0.726, 2.5 words/s, longest silence 0.7 s | speech-check ok |
| narration voice approved for publishing | PASS | en-US-AndrewMultilingualNeural | approved channel voice |
| text gate (collisions, caption band, edges, size) | PASS | 0 FAIL / 0 WARN groups; min essential 30px | 0 FAIL |
| essential text >= style minimum | PASS | 30px | >= 30px |
| no static hold >= 1.5 s inside a scene (visual change target) | PASS | longest 1.3 s (s2-chain) | < 1.5 s |
| no two scenes look alike (key-frame correlation <= 0.92; hook/payoff loop pair exempt) | PASS | max 0.833 | <= 0.92 |
| deterministic frames (two fresh pages, any order) | PASS | 0.7s same, 12.3s same, 24.9s same, 29.1s same | identical |

## Motion per scene

| Scene | Seconds | Mean motion | Static share | Longest static |
|---|---|---|---|---|
| s1-hook | 4.29 | 0.352 | 0.45 | 0.53 s |
| s2-chain | 4.26 | 1.151 | 0.67 | 1.3 s |
| s3-chain | 3.08 | 0.194 | 0.85 | 1.23 s |
| s4-mechanism | 2.55 | 1.324 | 0.01 | 0.03 s |
| s5-chain | 3.86 | 0.408 | 0.87 | 0.87 s |
| s6-mechanism | 3.69 | 0.99 | 0.23 | 0.57 s |
| s7-chain | 3.59 | 0.341 | 0.87 | 1.07 s |
| s8-payoff | 4.92 | 0.493 | 0.5 | 1.1 s |

## Text gate findings

- none

Contact sheet: `../../_temp/review/FR-vajont-dam-1963/out/contact-sheet.png` · Scene sheet: `../../_temp/review/FR-vajont-dam-1963/out/scene-sheet.png`

Subjective creative evaluation is separate (revision-history.md).
