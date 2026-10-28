# QA report: what-if-you-remembered-every-day-of-your-life-premium-final.mp4

Objective verdict: **FAIL** · measured 2026-10-28T16:53:42.397Z
UNVERIFIED (could not be measured, not counted as pass): audio samples clipped

| Check | Result | Measured | Target |
|---|---|---|---|
| resolution | PASS | 1080x1920 30/1 h264 | 1080x1920 |
| frame rate | PASS | 30/1 | 30/1 |
| codec | PASS | h264 High yuv420p | h264 yuv420p |
| full decode errors | PASS | 0 | 0 |
| duration (channel Shorts target) | PASS | 26.2 s | 18-42 s |
| black frames >= 0.1 s | PASS | none | none |
| first frame not empty | PASS | mean luma 33.5, detail sd 37.1, edge 1.56 | mean > 25, sd > 20 |
| static holds >= 2 s (freezedetect n=0.003) | PASS | none | none |
| audio samples clipped | *UNVERIFIED* | not reported by this FFmpeg build (astats has no clipped-sample count) | 0 |
| sample peak below full scale (decoded AAC) | PASS | -1.99 dBFS | <= -0.1 dBFS |
| flat factor (sustained full-scale runs) | PASS | 0/0/0 | 0 |
| integrated loudness | PASS | -14 LUFS | -14 +/- 1 |
| true peak | PASS | -1.9 dBTP | <= -1 dBTP |
| silence >= 1.0 s at -45 dB | PASS | none | reported (designed pauses allowed) |
| a/v duration match | PASS | 0.000 s | <= 0.1 s |
| caption layout | PASS | 13 cues, 0 over 2 lines x 26 chars | <= 2 x 26 |
| caption reading speed | PASS | 0 cues over 22 chars/s (max 18.1) | <= 22 chars/s |
| captions within video | PASS | last cue ends 25.79 s | <= 26.20 s |
| loop continuity (last -> first frame) | WARN | whole 6.92, photo region 11.03, final-second step 0.03, ratio 14.02 | whole <= 25; not (ratio > 3 and > 4) |
| first spoken word within 0.5 s | PASS | 0.00 s | <= 0.5 s |
| caption sync vs narration onsets (cues after a pause) | PASS | 8 cues: max 103 ms, mean 65 ms | max <= 150 ms |
| narration is real speech (lib/speech-check) | PASS | voiced 0.786, 2.38 words/s, longest silence 0.66 s | speech-check ok |
| narration voice approved for publishing | PASS | en-US-BrianMultilingualNeural | approved channel voice |
| text gate (collisions, caption band, edges, size) | **FAIL** | 1 FAIL / 0 WARN groups; min essential 30px | 0 FAIL |
| essential text >= style minimum | PASS | 30px | >= 30px |
| no static hold >= 1.5 s inside a scene (visual change target) | WARN | longest 1.57 s (s3-measure) | < 1.5 s |
| no two scenes look alike (key-frame correlation <= 0.92; hook/payoff loop pair exempt) | PASS | max 0.864 | <= 0.92 |
| deterministic frames (two fresh pages, any order) | PASS | 0.7s same, 12.3s same, 24.9s same | identical |

## Motion per scene

| Scene | Seconds | Mean motion | Static share | Longest static |
|---|---|---|---|---|
| s1-hook | 3.32 | 0.223 | 0.62 | 0.97 s |
| s2-mechanism | 2.69 | 0.636 | 0.52 | 1.03 s |
| s3-measure | 3.16 | 0.6 | 0.57 | 1.57 s |
| s4-measure | 3.2 | 0.743 | 0.56 | 1.23 s |
| s5-year | 3.78 | 0.525 | 0.55 | 1.57 s |
| s6-mechanism | 2.71 | 0.508 | 0.58 | 1.07 s |
| s7-mechanism | 3.61 | 0.742 | 0.49 | 0.8 s |
| s8-payoff | 3.75 | 0.474 | 0.83 | 1.2 s |

## Creative checks (advisory: a WARN does not block; not a quality verdict)

| Check | Status | Measured | Target |
|---|---|---|---|
| motion in the first 2 s | WARN | 0.286 | >= 0.3 mean frame change |
| scene variety | PASS | 5 types (hook, mechanism, measure, year, payoff); longest run 2 | >= 4 types, no type 3x in a row |
| headlines read as complete phrases | PASS | 4 headlines | no repeat, no dangling end word |
| headline hand-over at cuts | WARN | s7-mechanism | outgoing headline exits before the next one |
| object on screen | PASS | 8/8 scenes show the object | >= half the scenes |
| Is the drawn object the right type for this case (structure type, vehicle class), with no invented detail? | HUMAN | not measurable by script | reviewer answers before publication |
| Does the mechanism shown (load path, spin, breach, slide) match the cited cause, step by step? | HUMAN | not measurable by script | reviewer answers before publication |
| Is the hook strong enough to stop a scroll, and is the payoff a real lesson rather than a restatement? | HUMAN | not measurable by script | reviewer answers before publication |
| Do the on-screen words read as natural English for a viewer who has not heard the narration? | HUMAN | not measurable by script | reviewer answers before publication |

## Text gate findings

- FAIL 12.75–12.75 s text collision: "seconds" x "2002" (20%)


Contact sheet: `../../_temp/review/IB-HUM-004/out/contact-sheet.png` · Scene sheet: `../../_temp/review/IB-HUM-004/out/scene-sheet.png`

Subjective creative evaluation is separate (revision-history.md).
