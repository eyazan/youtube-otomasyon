# QA report: what-if-earth-spun-like-the-fastest-pulsar-premium-final.mp4

Objective verdict: **FAIL** · measured 2026-10-28T16:18:48.698Z
UNVERIFIED (could not be measured, not counted as pass): audio samples clipped

| Check | Result | Measured | Target |
|---|---|---|---|
| resolution | PASS | 1080x1920 30/1 h264 | 1080x1920 |
| frame rate | PASS | 30/1 | 30/1 |
| codec | PASS | h264 High yuv420p | h264 yuv420p |
| full decode errors | PASS | 0 | 0 |
| duration (channel Shorts target) | PASS | 31.267 s | 18-42 s |
| black frames >= 0.1 s | PASS | none | none |
| first frame not empty | **FAIL** | mean luma 26.3, detail sd 15.7, edge 1.05 | mean > 25, sd > 20 |
| static holds >= 2 s (freezedetect n=0.003) | PASS | none | none |
| audio samples clipped | *UNVERIFIED* | not reported by this FFmpeg build (astats has no clipped-sample count) | 0 |
| sample peak below full scale (decoded AAC) | PASS | -1.95 dBFS | <= -0.1 dBFS |
| flat factor (sustained full-scale runs) | PASS | 0/0/0 | 0 |
| integrated loudness | PASS | -14.1 LUFS | -14 +/- 1 |
| true peak | PASS | -1.9 dBTP | <= -1 dBTP |
| silence >= 1.0 s at -45 dB | PASS | none | reported (designed pauses allowed) |
| a/v duration match | PASS | 0.000 s | <= 0.1 s |
| caption layout | PASS | 15 cues, 0 over 2 lines x 26 chars | <= 2 x 26 |
| caption reading speed | PASS | 0 cues over 22 chars/s (max 17.9) | <= 22 chars/s |
| captions within video | PASS | last cue ends 30.86 s | <= 31.27 s |
| loop continuity (last -> first frame) | PASS | whole 2.78, photo region 6.94, final-second step 0.1, ratio 5.43 | whole <= 25; not (ratio > 3 and > 4) |
| first spoken word within 0.5 s | PASS | 0.00 s | <= 0.5 s |
| caption sync vs narration onsets (cues after a pause) | PASS | 7 cues: max 106 ms, mean 79 ms | max <= 150 ms |
| narration is real speech (lib/speech-check) | PASS | voiced 0.795, 2.28 words/s, longest silence 0.64 s | speech-check ok |
| narration voice approved for publishing | PASS | en-US-BrianMultilingualNeural | approved channel voice |
| text gate (collisions, caption band, edges, size) | PASS | 0 FAIL / 0 WARN groups; min essential 30px | 0 FAIL |
| essential text >= style minimum | PASS | 30px | >= 30px |
| no static hold >= 1.5 s inside a scene (visual change target) | PASS | longest 1.43 s (s7-mechanism) | < 1.5 s |
| no two scenes look alike (key-frame correlation <= 0.92; hook/payoff loop pair exempt) | PASS | max 0.685 | <= 0.92 |
| deterministic frames (two fresh pages, any order) | PASS | 0.7s same, 12.3s same, 24.9s same, 29.1s same | identical |

## Motion per scene

| Scene | Seconds | Mean motion | Static share | Longest static |
|---|---|---|---|---|
| s1-hook | 3.91 | 0.258 | 0.6 | 1.33 s |
| s2-measure | 3.95 | 0.456 | 0.65 | 0.9 s |
| s3-measure | 3.4 | 0.521 | 0.85 | 1.4 s |
| s4-measure | 3.93 | 0.495 | 0.76 | 0.8 s |
| s5-measure | 4.14 | 0.365 | 0.75 | 0.8 s |
| s6-mechanism | 3.45 | 0.439 | 0.73 | 0.63 s |
| s7-mechanism | 3.99 | 0.427 | 0.82 | 1.43 s |
| s8-payoff | 4.52 | 0.329 | 0.88 | 1.4 s |

## Creative checks (advisory: a WARN does not block; not a quality verdict)

| Check | Status | Measured | Target |
|---|---|---|---|
| motion in the first 2 s | PASS | 0.340 | >= 0.3 mean frame change |
| scene variety | WARN | 4 types (hook, measure, mechanism, payoff); longest run 4 | >= 4 types, no type 3x in a row |
| headlines read as complete phrases | PASS | 2 headlines | no repeat, no dangling end word |
| headline hand-over at cuts | PASS | clean | outgoing headline exits before the next one |
| object on screen | PASS | 8/8 scenes show the object | >= half the scenes |
| Is the drawn object the right type for this case (structure type, vehicle class), with no invented detail? | HUMAN | not measurable by script | reviewer answers before publication |
| Does the mechanism shown (load path, spin, breach, slide) match the cited cause, step by step? | HUMAN | not measurable by script | reviewer answers before publication |
| Is the hook strong enough to stop a scroll, and is the payoff a real lesson rather than a restatement? | HUMAN | not measurable by script | reviewer answers before publication |
| Do the on-screen words read as natural English for a viewer who has not heard the narration? | HUMAN | not measurable by script | reviewer answers before publication |

## Text gate findings

- none

Contact sheet: `../../_temp/review/IB-EXT-047/out/contact-sheet.png` · Scene sheet: `../../_temp/review/IB-EXT-047/out/scene-sheet.png`

Subjective creative evaluation is separate (revision-history.md).
