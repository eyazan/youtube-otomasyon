# QA report: gemini-8-1966-premium-final.mp4

Objective verdict: **PASS (hard checks)** · measured 2026-10-28T11:56:28.756Z
UNVERIFIED (could not be measured, not counted as pass): audio samples clipped

| Check | Result | Measured | Target |
|---|---|---|---|
| resolution | PASS | 1080x1920 30/1 h264 | 1080x1920 |
| frame rate | PASS | 30/1 | 30/1 |
| codec | PASS | h264 High yuv420p | h264 yuv420p |
| full decode errors | PASS | 0 | 0 |
| duration (channel Shorts target) | PASS | 27.067 s | 20-60 s |
| black frames >= 0.1 s | PASS | none | none |
| first frame not empty | PASS | mean luma 30.3, detail sd 20.2, edge 2.55 | mean > 25, sd > 20 |
| static holds >= 2 s (freezedetect n=0.003) | PASS | none | none |
| audio samples clipped | *UNVERIFIED* | not reported by this FFmpeg build (astats has no clipped-sample count) | 0 |
| sample peak below full scale (decoded AAC) | PASS | -1.99 dBFS | <= -0.1 dBFS |
| flat factor (sustained full-scale runs) | PASS | 0/0/0 | 0 |
| integrated loudness | PASS | -14.2 LUFS | -14 +/- 1 |
| true peak | PASS | -2 dBTP | <= -1 dBTP |
| silence >= 1.0 s at -45 dB | PASS | none | reported (designed pauses allowed) |
| a/v duration match | PASS | 0.000 s | <= 0.1 s |
| caption layout | PASS | 15 cues, 0 over 2 lines x 26 chars | <= 2 x 26 |
| caption reading speed | WARN | 1 cues over 22 chars/s (max 29.7) | <= 22 chars/s |
| captions within video | PASS | last cue ends 26.65 s | <= 27.07 s |
| loop continuity (last -> first frame) | WARN | whole 4.84, photo region 11.29, final-second step 0, ratio 10.61 | whole <= 25; not (ratio > 3 and > 4) |
| first spoken word within 0.5 s | PASS | 0.00 s | <= 0.5 s |
| caption sync vs narration onsets (cues after a pause) | PASS | 10 cues: max 67 ms, mean 46 ms | max <= 150 ms |
| narration is real speech (lib/speech-check) | PASS | voiced 0.75, 2.57 words/s, longest silence 0.7 s | speech-check ok |
| narration voice approved for publishing | PASS | en-US-AndrewMultilingualNeural | approved channel voice |
| text gate (collisions, caption band, edges, size) | PASS | 0 FAIL / 0 WARN groups; min essential 30px | 0 FAIL |
| essential text >= style minimum | PASS | 30px | >= 30px |
| no static hold >= 1.5 s inside a scene (visual change target) | PASS | longest 1.43 s (s7-chain) | < 1.5 s |
| no two scenes look alike (key-frame correlation <= 0.92; hook/payoff loop pair exempt) | PASS | max 0.528 | <= 0.92 |
| deterministic frames (two fresh pages, any order) | PASS | 0.7s same, 12.3s same, 24.9s same | identical |

## Motion per scene

| Scene | Seconds | Mean motion | Static share | Longest static |
|---|---|---|---|---|
| s1-hook | 4.5 | 1.96 | 0.09 | 0.4 s |
| s2-toll | 5.01 | 2.829 | 0 | 0 s |
| s3-chain | 2.2 | 0.832 | 0.45 | 0.23 s |
| s4-trigger | 2.7 | 3.476 | 0 | 0 s |
| s5-mechanism | 2.7 | 4.033 | 0 | 0 s |
| s6-mechanism | 3.23 | 3 | 0.28 | 0.83 s |
| s7-chain | 2.18 | 0.696 | 0.81 | 1.43 s |
| s8-payoff | 4.57 | 0.495 | 0.45 | 0.77 s |

## Text gate findings

- none

Contact sheet: `../../_temp/review/FR-gemini-8-1966/out/contact-sheet.png` · Scene sheet: `../../_temp/review/FR-gemini-8-1966/out/scene-sheet.png`

Subjective creative evaluation is separate (revision-history.md).
