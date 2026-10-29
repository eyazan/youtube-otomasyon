# QA report: what-if-the-atlantic-ocean-current-shut-down-premium-final.mp4

Objective verdict: **PASS (hard checks)** · measured 2026-10-29T05:47:05.457Z
UNVERIFIED (could not be measured, not counted as pass): audio samples clipped

| Check | Result | Measured | Target |
|---|---|---|---|
| resolution | PASS | 1080x1920 30/1 h264 | 1080x1920 |
| frame rate | PASS | 30/1 | 30/1 |
| codec | PASS | h264 High yuv420p | h264 yuv420p |
| full decode errors | PASS | 0 | 0 |
| duration (channel Shorts target) | PASS | 29.3 s | 18-42 s |
| black frames >= 0.1 s | PASS | none | none |
| first frame not empty | PASS | mean luma 41.3, detail sd 34.3, edge 1.49 | mean > 25, sd > 20 |
| static holds >= 2 s (freezedetect n=0.003) | PASS | none | none |
| audio samples clipped | *UNVERIFIED* | not reported by this FFmpeg build (astats has no clipped-sample count) | 0 |
| sample peak below full scale (decoded AAC) | PASS | -1.93 dBFS | <= -0.1 dBFS |
| flat factor (sustained full-scale runs) | PASS | 0/0/0 | 0 |
| integrated loudness | PASS | -14.1 LUFS | -14 +/- 1 |
| true peak | PASS | -1.9 dBTP | <= -1 dBTP |
| silence >= 1.0 s at -45 dB | PASS | none | reported (designed pauses allowed) |
| a/v duration match | PASS | 0.000 s | <= 0.1 s |
| caption layout | PASS | 15 cues, 0 over 2 lines x 26 chars | <= 2 x 26 |
| caption reading speed | PASS | 0 cues over 22 chars/s (max 18.0) | <= 22 chars/s |
| captions within video | PASS | last cue ends 28.87 s | <= 29.30 s |
| loop continuity (last -> first frame) | WARN | whole 6.72, photo region 13.64, final-second step 0.09, ratio 12.19 | whole <= 25; not (ratio > 3 and > 4) |
| first spoken word within 0.5 s | PASS | 0.00 s | <= 0.5 s |
| caption sync vs narration onsets (cues after a pause) | PASS | 8 cues: max 113 ms, mean 78 ms | max <= 150 ms |
| narration is real speech (lib/speech-check) | PASS | voiced 0.749, 2.41 words/s, longest silence 0.72 s | speech-check ok |
| narration voice approved for publishing | PASS | en-US-BrianMultilingualNeural | approved channel voice |
| text gate (collisions, caption band, edges, size) | PASS | 0 FAIL / 0 WARN groups; min essential 30px | 0 FAIL |
| essential text >= style minimum | PASS | 30px | >= 30px |
| no static hold >= 1.5 s inside a scene (visual change target) | WARN | longest 1.7 s (s7-payoff) | < 1.5 s |
| no two scenes look alike (key-frame correlation <= 0.92; hook/payoff loop pair exempt) | PASS | max 0.827 | <= 0.92 |
| deterministic frames (two fresh pages, any order) | PASS | 0.7s same, 12.3s same, 24.9s same, 29.1s same | identical |

## Motion per scene

| Scene | Seconds | Mean motion | Static share | Longest static |
|---|---|---|---|---|
| s1-hook | 3.82 | 0.298 | 0.49 | 1.03 s |
| s2-mechanism | 3.08 | 0.624 | 0.51 | 0.93 s |
| s3-heat | 3.78 | 0.684 | 0.38 | 0.4 s |
| s4-heat | 4.94 | 0.497 | 0.65 | 0.73 s |
| s5-mechanism | 4.01 | 0.58 | 0.48 | 1.07 s |
| s6-heat | 5.65 | 0.472 | 0.55 | 1.53 s |
| s7-payoff | 4.01 | 0.511 | 0.81 | 1.7 s |

## Creative checks (advisory: a WARN does not block; not a quality verdict)

| Check | Status | Measured | Target |
|---|---|---|---|
| motion in the first 2 s | PASS | 0.383 | >= 0.3 mean frame change |
| scene variety | PASS | 4 types (hook, mechanism, heat, payoff); longest run 2 | >= 4 types, no type 3x in a row |
| headlines read as complete phrases | PASS | 3 headlines | no repeat, no dangling end word |
| headline hand-over at cuts | PASS | clean | outgoing headline exits before the next one |
| object on screen | PASS | 7/7 scenes show the object | >= half the scenes |
| Is the drawn object the right type for this case (structure type, vehicle class), with no invented detail? | HUMAN | not measurable by script | reviewer answers before publication |
| Does the mechanism shown (load path, spin, breach, slide) match the cited cause, step by step? | HUMAN | not measurable by script | reviewer answers before publication |
| Is the hook strong enough to stop a scroll, and is the payoff a real lesson rather than a restatement? | HUMAN | not measurable by script | reviewer answers before publication |
| Do the on-screen words read as natural English for a viewer who has not heard the narration? | HUMAN | not measurable by script | reviewer answers before publication |

## Text gate findings

- none

Contact sheet: `../../_temp/review/IB-EAR-071/out/contact-sheet.png` · Scene sheet: `../../_temp/review/IB-EAR-071/out/scene-sheet.png`

Subjective creative evaluation is separate (revision-history.md).
