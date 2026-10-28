# QA report: what-if-you-could-touch-earths-core-premium-final.mp4

Objective verdict: **PASS (hard checks)** · measured 2026-10-28T16:22:20.612Z
UNVERIFIED (could not be measured, not counted as pass): audio samples clipped

| Check | Result | Measured | Target |
|---|---|---|---|
| resolution | PASS | 1080x1920 30/1 h264 | 1080x1920 |
| frame rate | PASS | 30/1 | 30/1 |
| codec | PASS | h264 High yuv420p | h264 yuv420p |
| full decode errors | PASS | 0 | 0 |
| duration (channel Shorts target) | PASS | 31.9 s | 18-42 s |
| black frames >= 0.1 s | PASS | none | none |
| first frame not empty | PASS | mean luma 39.8, detail sd 35.3, edge 1.47 | mean > 25, sd > 20 |
| static holds >= 2 s (freezedetect n=0.003) | PASS | none | none |
| audio samples clipped | *UNVERIFIED* | not reported by this FFmpeg build (astats has no clipped-sample count) | 0 |
| sample peak below full scale (decoded AAC) | PASS | -1.96 dBFS | <= -0.1 dBFS |
| flat factor (sustained full-scale runs) | PASS | 0/0/0 | 0 |
| integrated loudness | PASS | -14.1 LUFS | -14 +/- 1 |
| true peak | PASS | -1.9 dBTP | <= -1 dBTP |
| silence >= 1.0 s at -45 dB | PASS | none | reported (designed pauses allowed) |
| a/v duration match | PASS | 0.000 s | <= 0.1 s |
| caption layout | PASS | 17 cues, 0 over 2 lines x 26 chars | <= 2 x 26 |
| caption reading speed | PASS | 0 cues over 22 chars/s (max 19.4) | <= 22 chars/s |
| captions within video | PASS | last cue ends 31.47 s | <= 31.90 s |
| loop continuity (last -> first frame) | WARN | whole 7.04, photo region 12.1, final-second step 0.14, ratio 11.79 | whole <= 25; not (ratio > 3 and > 4) |
| first spoken word within 0.5 s | PASS | 0.05 s | <= 0.5 s |
| caption sync vs narration onsets (cues after a pause) | PASS | 11 cues: max 107 ms, mean 80 ms | max <= 150 ms |
| narration is real speech (lib/speech-check) | PASS | voiced 0.753, 2.17 words/s, longest silence 0.68 s | speech-check ok |
| narration voice approved for publishing | PASS | en-US-BrianMultilingualNeural | approved channel voice |
| text gate (collisions, caption band, edges, size) | PASS | 0 FAIL / 10 WARN groups; min essential 30px | 0 FAIL |
| essential text >= style minimum | PASS | 30px | >= 30px |
| no static hold >= 1.5 s inside a scene (visual change target) | WARN | longest 1.83 s (s5-measure) | < 1.5 s |
| no two scenes look alike (key-frame correlation <= 0.92; hook/payoff loop pair exempt) | PASS | max 0.755 | <= 0.92 |
| deterministic frames (two fresh pages, any order) | PASS | 0.7s same, 12.3s same, 24.9s same, 29.1s same | identical |

## Motion per scene

| Scene | Seconds | Mean motion | Static share | Longest static |
|---|---|---|---|---|
| s1-hook | 3.06 | 0.407 | 0.44 | 0.57 s |
| s2-measure | 3.67 | 0.536 | 0.58 | 1.23 s |
| s3-cut | 2.82 | 0.653 | 0.38 | 0.97 s |
| s4-flow | 2.96 | 0.686 | 0.45 | 0.97 s |
| s5-measure | 6.15 | 0.287 | 0.7 | 1.83 s |
| s6-year | 4.37 | 0.449 | 0.48 | 0.6 s |
| s7-mechanism | 4.37 | 0.699 | 0.29 | 0.37 s |
| s8-payoff | 4.5 | 0.542 | 0.73 | 1.27 s |

## Creative checks (advisory: a WARN does not block; not a quality verdict)

| Check | Status | Measured | Target |
|---|---|---|---|
| motion in the first 2 s | PASS | 0.523 | >= 0.3 mean frame change |
| scene variety | PASS | 7 types (hook, measure, cut, flow, year, mechanism, payoff); longest run 1 | >= 4 types, no type 3x in a row |
| headlines read as complete phrases | PASS | 5 headlines | no repeat, no dangling end word |
| headline hand-over at cuts | WARN | s3-cut, s7-mechanism | outgoing headline exits before the next one |
| object on screen | PASS | 8/8 scenes show the object | >= half the scenes |
| Is the drawn object the right type for this case (structure type, vehicle class), with no invented detail? | HUMAN | not measurable by script | reviewer answers before publication |
| Does the mechanism shown (load path, spin, breach, slide) match the cited cause, step by step? | HUMAN | not measurable by script | reviewer answers before publication |
| Is the hook strong enough to stop a scroll, and is the payoff a real lesson rather than a restatement? | HUMAN | not measurable by script | reviewer answers before publication |
| Do the on-screen words read as natural English for a viewer who has not heard the narration? | HUMAN | not measurable by script | reviewer answers before publication |

## Text gate findings

- WARN 15.75–15.75 s text under right UI buttons: "1,230 km" x=752-951
- WARN 16.00–16.00 s text under right UI buttons: "1,230 km" x=756-956
- WARN 16.25–16.25 s text under right UI buttons: "1,230 km" x=759-959
- WARN 16.50–16.50 s text under right UI buttons: "1,230 km" x=761-962
- WARN 16.75–16.75 s text under right UI buttons: "1,230 km" x=763-965
- WARN 17.00–17.00 s text under right UI buttons: "1,230 km" x=765-967
- WARN 17.25–17.25 s text under right UI buttons: "1,230 km" x=766-968
- WARN 17.50–17.50 s text under right UI buttons: "1,230 km" x=767-969
- WARN 17.75–17.75 s text under right UI buttons: "1,230 km" x=767-970
- WARN 18.00–19.00 s text under right UI buttons: "1,230 km" x=768-971


Contact sheet: `../../_temp/review/IB-PHY-065/out/contact-sheet.png` · Scene sheet: `../../_temp/review/IB-PHY-065/out/scene-sheet.png`

Subjective creative evaluation is separate (revision-history.md).
