# QA report: what-if-you-stopped-eating-for-a-year-premium-final.mp4

Objective verdict: **PASS (hard checks)** · measured 2026-10-28T14:27:14.789Z
UNVERIFIED (could not be measured, not counted as pass): audio samples clipped

| Check | Result | Measured | Target |
|---|---|---|---|
| resolution | PASS | 1080x1920 30/1 h264 | 1080x1920 |
| frame rate | PASS | 30/1 | 30/1 |
| codec | PASS | h264 High yuv420p | h264 yuv420p |
| full decode errors | PASS | 0 | 0 |
| duration (channel Shorts target) | PASS | 30.967 s | 18-42 s |
| black frames >= 0.1 s | PASS | none | none |
| first frame not empty | PASS | mean luma 33.5, detail sd 37.1, edge 1.56 | mean > 25, sd > 20 |
| static holds >= 2 s (freezedetect n=0.003) | PASS | none | none |
| audio samples clipped | *UNVERIFIED* | not reported by this FFmpeg build (astats has no clipped-sample count) | 0 |
| sample peak below full scale (decoded AAC) | PASS | -1.98 dBFS | <= -0.1 dBFS |
| flat factor (sustained full-scale runs) | PASS | 0/0/0 | 0 |
| integrated loudness | PASS | -14 LUFS | -14 +/- 1 |
| true peak | PASS | -1.9 dBTP | <= -1 dBTP |
| silence >= 1.0 s at -45 dB | PASS | none | reported (designed pauses allowed) |
| a/v duration match | PASS | 0.000 s | <= 0.1 s |
| caption layout | PASS | 18 cues, 0 over 2 lines x 26 chars | <= 2 x 26 |
| caption reading speed | PASS | 0 cues over 22 chars/s (max 19.9) | <= 22 chars/s |
| captions within video | PASS | last cue ends 30.54 s | <= 30.97 s |
| loop continuity (last -> first frame) | WARN | whole 6.3, photo region 11, final-second step 0.03, ratio 12.87 | whole <= 25; not (ratio > 3 and > 4) |
| first spoken word within 0.5 s | PASS | 0.05 s | <= 0.5 s |
| caption sync vs narration onsets (cues after a pause) | PASS | 9 cues: max 144 ms, mean 76 ms | max <= 150 ms |
| narration is real speech (lib/speech-check) | PASS | voiced 0.759, 2.31 words/s, longest silence 0.68 s | speech-check ok |
| narration voice approved for publishing | PASS | en-US-BrianMultilingualNeural | approved channel voice |
| text gate (collisions, caption band, edges, size) | PASS | 0 FAIL / 0 WARN groups; min essential 30px | 0 FAIL |
| essential text >= style minimum | PASS | 30px | >= 30px |
| no static hold >= 1.5 s inside a scene (visual change target) | WARN | longest 2.07 s (s4-measure) | < 1.5 s |
| no two scenes look alike (key-frame correlation <= 0.92; hook/payoff loop pair exempt) | PASS | max 0.784 | <= 0.92 |
| deterministic frames (two fresh pages, any order) | PASS | 0.7s same, 12.3s same, 24.9s same, 29.1s same | identical |

## Motion per scene

| Scene | Seconds | Mean motion | Static share | Longest static |
|---|---|---|---|---|
| s1-hook | 3.91 | 0.213 | 0.67 | 1.2 s |
| s2-mechanism | 3.52 | 0.508 | 0.56 | 0.93 s |
| s3-measure | 2.91 | 0.612 | 0.51 | 1.37 s |
| s4-measure | 4.52 | 0.509 | 0.67 | 2.07 s |
| s5-mechanism | 3.7 | 0.451 | 0.55 | 1.13 s |
| s6-mechanism | 2.94 | 0.695 | 0.45 | 0.53 s |
| s7-measure | 4.05 | 0.622 | 0.79 | 1.63 s |
| s8-payoff | 5.41 | 0.301 | 0.86 | 1.97 s |

## Creative checks (advisory: a WARN does not block; not a quality verdict)

| Check | Status | Measured | Target |
|---|---|---|---|
| motion in the first 2 s | PASS | 0.311 | >= 0.3 mean frame change |
| scene variety | PASS | 4 types (hook, mechanism, measure, payoff); longest run 2 | >= 4 types, no type 3x in a row |
| headlines read as complete phrases | PASS | 5 headlines | no repeat, no dangling end word |
| headline hand-over at cuts | WARN | s5-mechanism | outgoing headline exits before the next one |
| object on screen | PASS | 8/8 scenes show the object | >= half the scenes |
| Is the drawn object the right type for this case (structure type, vehicle class), with no invented detail? | HUMAN | not measurable by script | reviewer answers before publication |
| Does the mechanism shown (load path, spin, breach, slide) match the cited cause, step by step? | HUMAN | not measurable by script | reviewer answers before publication |
| Is the hook strong enough to stop a scroll, and is the payoff a real lesson rather than a restatement? | HUMAN | not measurable by script | reviewer answers before publication |
| Do the on-screen words read as natural English for a viewer who has not heard the narration? | HUMAN | not measurable by script | reviewer answers before publication |

## Text gate findings

- none

Contact sheet: `../../_temp/review/IB-HUM-025/out/contact-sheet.png` · Scene sheet: `../../_temp/review/IB-HUM-025/out/scene-sheet.png`

Subjective creative evaluation is separate (revision-history.md).
