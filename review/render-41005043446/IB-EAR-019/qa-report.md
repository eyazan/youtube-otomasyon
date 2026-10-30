# QA report: could-earth-survive-one-day-without-earth-s-magnetic-field-premium-final.mp4

Objective verdict: **PASS (hard checks)** · measured 2026-10-30T04:54:23.573Z
UNVERIFIED (could not be measured, not counted as pass): audio samples clipped

| Check | Result | Measured | Target |
|---|---|---|---|
| resolution | PASS | 1080x1920 30/1 h264 | 1080x1920 |
| frame rate | PASS | 30/1 | 30/1 |
| codec | PASS | h264 High yuv420p | h264 yuv420p |
| full decode errors | PASS | 0 | 0 |
| duration (channel Shorts target) | PASS | 31.133 s | 18-42 s |
| black frames >= 0.1 s | PASS | none | none |
| first frame not empty | PASS | mean luma 32.3, detail sd 27.2, edge 1.93 | mean > 25, sd > 20 |
| static holds >= 2 s (freezedetect n=0.003) | PASS | none | none |
| audio samples clipped | *UNVERIFIED* | not reported by this FFmpeg build (astats has no clipped-sample count) | 0 |
| sample peak below full scale (decoded AAC) | PASS | -1.97 dBFS | <= -0.1 dBFS |
| flat factor (sustained full-scale runs) | PASS | 0/0/0 | 0 |
| integrated loudness | PASS | -14.1 LUFS | -14 +/- 1 |
| true peak | PASS | -2 dBTP | <= -1 dBTP |
| silence >= 1.0 s at -45 dB | PASS | none | reported (designed pauses allowed) |
| a/v duration match | PASS | 0.000 s | <= 0.1 s |
| caption layout | PASS | 15 cues, 0 over 2 lines x 26 chars | <= 2 x 26 |
| caption reading speed | PASS | 0 cues over 22 chars/s (max 21.4) | <= 22 chars/s |
| captions within video | PASS | last cue ends 30.71 s | <= 31.13 s |
| loop continuity (last -> first frame) | WARN | whole 5.71, photo region 10.78, final-second step 0.26, ratio 8.13 | whole <= 25; not (ratio > 3 and > 4) |
| first spoken word within 0.5 s | PASS | 0.00 s | <= 0.5 s |
| caption sync vs narration onsets (cues after a pause) | PASS | 9 cues: max 144 ms, mean 84 ms | max <= 150 ms |
| narration is real speech (lib/speech-check) | PASS | voiced 0.761, 2.33 words/s, longest silence 0.62 s | speech-check ok |
| narration voice approved for publishing | PASS | en-US-BrianMultilingualNeural | approved channel voice |
| text gate (collisions, caption band, edges, size) | PASS | 0 FAIL / 0 WARN groups; min essential 30px | 0 FAIL |
| essential text >= style minimum | PASS | 30px | >= 30px |
| no static hold >= 1.5 s inside a scene (visual change target) | PASS | longest 1.47 s (s3-count) | < 1.5 s |
| no two scenes look alike (key-frame correlation <= 0.92; hook/payoff loop pair exempt) | PASS | max 0.681 | <= 0.92 |
| deterministic frames (two fresh pages, any order) | PASS | 0.7s same, 12.3s same, 24.9s same, 29.1s same | identical |

## Motion per scene

| Scene | Seconds | Mean motion | Static share | Longest static |
|---|---|---|---|---|
| s1-hook | 2.89 | 0.512 | 0.41 | 0.53 s |
| s2-measure | 4.37 | 0.576 | 0.57 | 1.13 s |
| s3-count | 4.57 | 0.45 | 0.85 | 1.47 s |
| s4-measure | 3.57 | 0.719 | 0.51 | 0.77 s |
| s5-mechanism | 3.55 | 0.733 | 0.4 | 0.73 s |
| s6-mechanism | 3.9 | 1.412 | 0.01 | 0.03 s |
| s7-mechanism | 4.12 | 0.641 | 0.74 | 1.47 s |
| s8-payoff | 4.16 | 0.53 | 0.2 | 0.37 s |

## Creative checks (advisory: a WARN does not block; not a quality verdict)

| Check | Status | Measured | Target |
|---|---|---|---|
| motion in the first 2 s | PASS | 0.658 | >= 0.3 mean frame change |
| scene variety | WARN | 5 types (hook, measure, count, mechanism, payoff); longest run 3 | >= 4 types, no type 3x in a row |
| headlines read as complete phrases | PASS | 6 headlines | no repeat, no dangling end word |
| headline hand-over at cuts | PASS | clean | outgoing headline exits before the next one |
| object on screen | PASS | 8/8 scenes show the object | >= half the scenes |
| Is the drawn object the right type for this case (structure type, vehicle class), with no invented detail? | HUMAN | not measurable by script | reviewer answers before publication |
| Does the mechanism shown (load path, spin, breach, slide) match the cited cause, step by step? | HUMAN | not measurable by script | reviewer answers before publication |
| Is the hook strong enough to stop a scroll, and is the payoff a real lesson rather than a restatement? | HUMAN | not measurable by script | reviewer answers before publication |
| Do the on-screen words read as natural English for a viewer who has not heard the narration? | HUMAN | not measurable by script | reviewer answers before publication |

## Text gate findings

- none

Contact sheet: `../../_temp/review/IB-EAR-019/out/contact-sheet.png` · Scene sheet: `../../_temp/review/IB-EAR-019/out/scene-sheet.png`

Subjective creative evaluation is separate (revision-history.md).
