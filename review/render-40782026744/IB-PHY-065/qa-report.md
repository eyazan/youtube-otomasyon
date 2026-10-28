# QA report: what-if-you-could-touch-earths-core-premium-final.mp4

Objective verdict: **PASS (hard checks)** · measured 2026-10-28T22:47:01.453Z
UNVERIFIED (could not be measured, not counted as pass): audio samples clipped

| Check | Result | Measured | Target |
|---|---|---|---|
| resolution | PASS | 1080x1920 30/1 h264 | 1080x1920 |
| frame rate | PASS | 30/1 | 30/1 |
| codec | PASS | h264 High yuv420p | h264 yuv420p |
| full decode errors | PASS | 0 | 0 |
| duration (channel Shorts target) | PASS | 37.6 s | 18-42 s |
| black frames >= 0.1 s | PASS | none | none |
| first frame not empty | PASS | mean luma 50.3, detail sd 50.9, edge 1.57 | mean > 25, sd > 20 |
| static holds >= 2 s (freezedetect n=0.003) | PASS | none | none |
| audio samples clipped | *UNVERIFIED* | not reported by this FFmpeg build (astats has no clipped-sample count) | 0 |
| sample peak below full scale (decoded AAC) | PASS | -1.96 dBFS | <= -0.1 dBFS |
| flat factor (sustained full-scale runs) | PASS | 0/0/0 | 0 |
| integrated loudness | PASS | -14.1 LUFS | -14 +/- 1 |
| true peak | PASS | -1.9 dBTP | <= -1 dBTP |
| silence >= 1.0 s at -45 dB | PASS | none | reported (designed pauses allowed) |
| a/v duration match | PASS | 0.000 s | <= 0.1 s |
| caption layout | PASS | 19 cues, 0 over 2 lines x 26 chars | <= 2 x 26 |
| caption reading speed | PASS | 0 cues over 22 chars/s (max 19.4) | <= 22 chars/s |
| captions within video | PASS | last cue ends 37.17 s | <= 37.60 s |
| loop continuity (last -> first frame) | WARN | whole 20.07, photo region 41.94, final-second step 0.13, ratio 32.48 | whole <= 25; not (ratio > 3 and > 4) |
| first spoken word within 0.5 s | PASS | 0.05 s | <= 0.5 s |
| caption sync vs narration onsets (cues after a pause) | PASS | 12 cues: max 107 ms, mean 77 ms | max <= 150 ms |
| narration is real speech (lib/speech-check) | PASS | voiced 0.776, 2.27 words/s, longest silence 0.68 s | speech-check ok |
| narration voice approved for publishing | PASS | en-US-BrianMultilingualNeural | approved channel voice |
| text gate (collisions, caption band, edges, size) | PASS | 0 FAIL / 0 WARN groups; min essential 30px | 0 FAIL |
| essential text >= style minimum | PASS | 30px | >= 30px |
| no static hold >= 1.5 s inside a scene (visual change target) | WARN | longest 1.8 s (s5-measure) | < 1.5 s |
| no two scenes look alike (key-frame correlation <= 0.92; hook/payoff loop pair exempt) | PASS | max 0.751 | <= 0.92 |
| deterministic frames (two fresh pages, any order) | PASS | 0.7s same, 12.3s same, 24.9s same, 29.1s same | identical |

## Motion per scene

| Scene | Seconds | Mean motion | Static share | Longest static |
|---|---|---|---|---|
| s1-hook | 3.07 | 0.364 | 0.48 | 0.57 s |
| s2-heat | 7.34 | 0.449 | 0.7 | 1.7 s |
| s3-mechanism | 2.82 | 0.661 | 0.47 | 0.93 s |
| s4-mechanism | 2.96 | 0.813 | 0.38 | 0.5 s |
| s5-measure | 6.15 | 0.389 | 0.58 | 1.8 s |
| s6-year | 6.37 | 0.429 | 0.61 | 0.77 s |
| s7-mechanism | 4.37 | 1.035 | 0.18 | 0.3 s |
| s8-payoff | 4.5 | 0.63 | 0.77 | 1.27 s |

## Creative checks (advisory: a WARN does not block; not a quality verdict)

| Check | Status | Measured | Target |
|---|---|---|---|
| motion in the first 2 s | PASS | 0.491 | >= 0.3 mean frame change |
| scene variety | PASS | 6 types (hook, heat, mechanism, measure, year, payoff); longest run 2 | >= 4 types, no type 3x in a row |
| headlines read as complete phrases | PASS | 4 headlines | no repeat, no dangling end word |
| headline hand-over at cuts | PASS | clean | outgoing headline exits before the next one |
| object on screen | PASS | 8/8 scenes show the object | >= half the scenes |
| Is the drawn object the right type for this case (structure type, vehicle class), with no invented detail? | HUMAN | not measurable by script | reviewer answers before publication |
| Does the mechanism shown (load path, spin, breach, slide) match the cited cause, step by step? | HUMAN | not measurable by script | reviewer answers before publication |
| Is the hook strong enough to stop a scroll, and is the payoff a real lesson rather than a restatement? | HUMAN | not measurable by script | reviewer answers before publication |
| Do the on-screen words read as natural English for a viewer who has not heard the narration? | HUMAN | not measurable by script | reviewer answers before publication |

## Text gate findings

- none

Contact sheet: `../../_temp/review/IB-PHY-065/out/contact-sheet.png` · Scene sheet: `../../_temp/review/IB-PHY-065/out/scene-sheet.png`

Subjective creative evaluation is separate (revision-history.md).
