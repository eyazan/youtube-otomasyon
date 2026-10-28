# QA report: st-francis-dam-1928-premium-final.mp4

Objective verdict: **PASS (hard checks)** · measured 2026-10-28T12:01:19.596Z
UNVERIFIED (could not be measured, not counted as pass): audio samples clipped

| Check | Result | Measured | Target |
|---|---|---|---|
| resolution | PASS | 1080x1920 30/1 h264 | 1080x1920 |
| frame rate | PASS | 30/1 | 30/1 |
| codec | PASS | h264 High yuv420p | h264 yuv420p |
| full decode errors | PASS | 0 | 0 |
| duration (channel Shorts target) | PASS | 28.433 s | 20-60 s |
| black frames >= 0.1 s | PASS | none | none |
| first frame not empty | PASS | mean luma 32.5, detail sd 22.4, edge 2.21 | mean > 25, sd > 20 |
| static holds >= 2 s (freezedetect n=0.003) | PASS | none | none |
| audio samples clipped | *UNVERIFIED* | not reported by this FFmpeg build (astats has no clipped-sample count) | 0 |
| sample peak below full scale (decoded AAC) | PASS | -1.88 dBFS | <= -0.1 dBFS |
| flat factor (sustained full-scale runs) | PASS | 0/0/0 | 0 |
| integrated loudness | PASS | -14.1 LUFS | -14 +/- 1 |
| true peak | PASS | -1.9 dBTP | <= -1 dBTP |
| silence >= 1.0 s at -45 dB | PASS | none | reported (designed pauses allowed) |
| a/v duration match | PASS | 0.000 s | <= 0.1 s |
| caption layout | PASS | 15 cues, 0 over 2 lines x 26 chars | <= 2 x 26 |
| caption reading speed | PASS | 0 cues over 22 chars/s (max 17.4) | <= 22 chars/s |
| captions within video | PASS | last cue ends 28.03 s | <= 28.43 s |
| loop continuity (last -> first frame) | PASS | whole 0.33, photo region 0.64, final-second step 0.02, ratio 1.59 | whole <= 25; not (ratio > 3 and > 4) |
| first spoken word within 0.5 s | PASS | 0.00 s | <= 0.5 s |
| caption sync vs narration onsets (cues after a pause) | PASS | 13 cues: max 100 ms, mean 47 ms | max <= 150 ms |
| narration is real speech (lib/speech-check) | PASS | voiced 0.704, 2.44 words/s, longest silence 0.7 s | speech-check ok |
| narration voice approved for publishing | PASS | en-US-AndrewMultilingualNeural | approved channel voice |
| text gate (collisions, caption band, edges, size) | PASS | 0 FAIL / 0 WARN groups; min essential 30px | 0 FAIL |
| essential text >= style minimum | PASS | 30px | >= 30px |
| no static hold >= 1.5 s inside a scene (visual change target) | PASS | longest 1.43 s (s7-chain) | < 1.5 s |
| no two scenes look alike (key-frame correlation <= 0.92; hook/payoff loop pair exempt) | PASS | max 0.863 | <= 0.92 |
| deterministic frames (two fresh pages, any order) | PASS | 0.7s same, 12.3s same, 24.9s same | identical |

## Motion per scene

| Scene | Seconds | Mean motion | Static share | Longest static |
|---|---|---|---|---|
| s1-hook | 3.32 | 0.245 | 0.65 | 1 s |
| s2-chain | 5.32 | 0.971 | 0.72 | 0.9 s |
| s3-chain | 3.64 | 0.148 | 0.87 | 1.23 s |
| s4-mechanism | 2.22 | 1.158 | 0.3 | 0.63 s |
| s5-chain | 2.09 | 0.677 | 0.66 | 0.67 s |
| s6-mechanism | 3.98 | 0.758 | 0.39 | 0.9 s |
| s7-chain | 3.1 | 0.362 | 0.84 | 1.43 s |
| s8-payoff | 4.77 | 0.458 | 0.53 | 1.37 s |

## Text gate findings

- none

Contact sheet: `../../_temp/review/FR-st-francis-dam-1928/out/contact-sheet.png` · Scene sheet: `../../_temp/review/FR-st-francis-dam-1928/out/scene-sheet.png`

Subjective creative evaluation is separate (revision-history.md).
