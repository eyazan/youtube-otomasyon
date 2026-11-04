# QA report: hand-of-god-and-goal-of-the-century-premium-final.mp4

Objective verdict: **PASS (hard checks)** · measured 2026-11-04T19:59:01.043Z
UNVERIFIED (could not be measured, not counted as pass): audio samples clipped

| Check | Result | Measured | Target |
|---|---|---|---|
| resolution | PASS | 1080x1920 30/1 h264 | 1080x1920 |
| frame rate | PASS | 30/1 | 30/1 |
| codec | PASS | h264 High yuv420p | h264 yuv420p |
| full decode errors | PASS | 0 | 0 |
| duration (channel Shorts target) | PASS | 25.1 s | 25-55 s |
| black frames >= 0.1 s | PASS | none | none |
| first frame not empty | PASS | mean luma 77.9, detail sd 21.8, edge 2.48 | mean > 25, sd > 20 |
| static holds >= 2 s (freezedetect n=0.003) | PASS | none | none |
| audio samples clipped | *UNVERIFIED* | not reported by this FFmpeg build (astats has no clipped-sample count) | 0 |
| sample peak below full scale (decoded AAC) | PASS | -2.94 dBFS | <= -0.1 dBFS |
| flat factor (sustained full-scale runs) | PASS | 0/0/0 | 0 |
| integrated loudness | PASS | -14.6 LUFS | -14 +/- 1 |
| true peak | PASS | -2.9 dBTP | <= -1 dBTP |
| silence >= 1.0 s at -45 dB | PASS | none | reported (designed pauses allowed) |
| a/v duration match | PASS | 0.000 s | <= 0.1 s |
| caption layout | PASS | 14 cues, 0 over 2 lines x 26 chars | <= 2 x 26 |
| caption reading speed | PASS | 0 cues over 22 chars/s (max 20.2) | <= 22 chars/s |
| captions within video | PASS | last cue ends 24.90 s | <= 25.10 s |
| loop continuity (last -> first frame) | WARN | whole 23.95, photo region 17.95, final-second step 4.23, ratio 5.17 | whole <= 25; not (ratio > 3 and > 4) |
| first spoken word within 0.5 s | PASS | 0.00 s | <= 0.5 s |
| caption sync vs narration onsets (cues after a pause) | PASS | 10 cues: max 122 ms, mean 104 ms | max <= 150 ms |
| narration is real speech (lib/speech-check) | PASS | voiced 0.656, 2.39 words/s, longest silence 0.98 s | speech-check ok |
| narration voice approved for publishing | WARN | en-GB-ThomasNeural (preview fallback) | approved channel voice |
| text gate (collisions, caption band, edges, size) | PASS | 0 FAIL / 0 WARN groups; min essential 30px | 0 FAIL |
| essential text >= style minimum | PASS | 30px | >= 30px |
| no static hold >= 1.5 s inside a scene (visual change target) | WARN | longest 1.7 s (s2-when) | < 1.5 s |
| no two scenes look alike (key-frame correlation <= 0.92; hook/payoff loop pair exempt) | PASS | max 0.786 | <= 0.92 |
| deterministic frames (two fresh pages, any order) | PASS | 0.7s same, 12.3s same, 24.9s same | identical |

## Motion per scene

| Scene | Seconds | Mean motion | Static share | Longest static |
|---|---|---|---|---|
| s1-hook | 5.12 | 2.607 | 0.27 | 0.7 s |
| s2-when | 5.34 | 0.437 | 0.82 | 1.7 s |
| s3-hand | 3.38 | 1.011 | 0.51 | 1.1 s |
| s4-hand | 2.32 | 0.978 | 0.36 | 0.67 s |
| s5-dribble | 3.71 | 2.63 | 0.15 | 0.3 s |
| s6-payoff | 5.25 | 2.422 | 0.22 | 0.63 s |

## Creative checks (advisory: a WARN does not block; not a quality verdict)

| Check | Status | Measured | Target |
|---|---|---|---|
| motion in the first 2 s | PASS | 5.090 | >= 0.3 mean frame change |
| scene variety | PASS | 5 types (hook, when, hand, dribble, payoff); longest run 2 | >= 4 types, no type 3x in a row |
| headlines read as complete phrases | PASS | 2 headlines | no repeat, no dangling end word |
| headline hand-over at cuts | PASS | clean | outgoing headline exits before the next one |
| object on screen | PASS | 6/6 scenes show the object | >= half the scenes |
| Is the drawn object the right type for this case (structure type, vehicle class), with no invented detail? | HUMAN | not measurable by script | reviewer answers before publication |
| Does the mechanism shown (load path, spin, breach, slide) match the cited cause, step by step? | HUMAN | not measurable by script | reviewer answers before publication |
| Is the hook strong enough to stop a scroll, and is the payoff a real lesson rather than a restatement? | HUMAN | not measurable by script | reviewer answers before publication |
| Do the on-screen words read as natural English for a viewer who has not heard the narration? | HUMAN | not measurable by script | reviewer answers before publication |

## Text gate findings

- none

Contact sheet: `../../_temp/review/GLL-021/out/contact-sheet.png` · Scene sheet: `../../_temp/review/GLL-021/out/scene-sheet.png`

Subjective creative evaluation is separate (revision-history.md).
