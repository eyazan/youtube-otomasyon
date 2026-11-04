# QA report: hand-of-god-and-goal-of-the-century-premium-final.mp4

Objective verdict: **PASS (hard checks)** · measured 2026-11-04T19:59:01.299Z
UNVERIFIED (could not be measured, not counted as pass): audio samples clipped

| Check | Result | Measured | Target |
|---|---|---|---|
| resolution | PASS | 1080x1920 30/1 h264 | 1080x1920 |
| frame rate | PASS | 30/1 | 30/1 |
| codec | PASS | h264 High yuv420p | h264 yuv420p |
| full decode errors | PASS | 0 | 0 |
| duration (channel Shorts target) | PASS | 26.4 s | 25-55 s |
| black frames >= 0.1 s | PASS | none | none |
| first frame not empty | PASS | mean luma 77.9, detail sd 21.8, edge 2.48 | mean > 25, sd > 20 |
| static holds >= 2 s (freezedetect n=0.003) | PASS | none | none |
| audio samples clipped | *UNVERIFIED* | not reported by this FFmpeg build (astats has no clipped-sample count) | 0 |
| sample peak below full scale (decoded AAC) | PASS | -2.94 dBFS | <= -0.1 dBFS |
| flat factor (sustained full-scale runs) | PASS | 0/0/0 | 0 |
| integrated loudness | PASS | -14.4 LUFS | -14 +/- 1 |
| true peak | PASS | -2.9 dBTP | <= -1 dBTP |
| silence >= 1.0 s at -45 dB | PASS | none | reported (designed pauses allowed) |
| a/v duration match | PASS | 0.000 s | <= 0.1 s |
| caption layout | PASS | 14 cues, 0 over 2 lines x 26 chars | <= 2 x 26 |
| caption reading speed | PASS | 0 cues over 22 chars/s (max 19.3) | <= 22 chars/s |
| captions within video | PASS | last cue ends 26.17 s | <= 26.40 s |
| loop continuity (last -> first frame) | WARN | whole 23.95, photo region 17.94, final-second step 3.6, ratio 5.96 | whole <= 25; not (ratio > 3 and > 4) |
| first spoken word within 0.5 s | PASS | 0.00 s | <= 0.5 s |
| caption sync vs narration onsets (cues after a pause) | WARN | 10 cues: max 161 ms, mean 113 ms | max <= 150 ms |
| narration is real speech (lib/speech-check) | PASS | voiced 0.667, 2.27 words/s, longest silence 1.02 s | speech-check ok |
| narration voice approved for publishing | WARN | en-US-ChristopherNeural (preview fallback) | approved channel voice |
| text gate (collisions, caption band, edges, size) | PASS | 0 FAIL / 0 WARN groups; min essential 30px | 0 FAIL |
| essential text >= style minimum | PASS | 30px | >= 30px |
| no static hold >= 1.5 s inside a scene (visual change target) | PASS | longest 1.1 s (s2-when) | < 1.5 s |
| no two scenes look alike (key-frame correlation <= 0.92; hook/payoff loop pair exempt) | PASS | max 0.784 | <= 0.92 |
| deterministic frames (two fresh pages, any order) | PASS | 0.7s same, 12.3s same, 24.9s same | identical |

## Motion per scene

| Scene | Seconds | Mean motion | Static share | Longest static |
|---|---|---|---|---|
| s1-hook | 5.45 | 2.434 | 0.3 | 0.8 s |
| s2-when | 5.58 | 0.417 | 0.85 | 1.1 s |
| s3-hand | 3.41 | 1.001 | 0.48 | 1.03 s |
| s4-hand | 2.43 | 0.942 | 0.39 | 0.7 s |
| s5-dribble | 3.92 | 2.466 | 0.2 | 0.73 s |
| s6-payoff | 5.61 | 2.25 | 0.27 | 0.87 s |

## Creative checks (advisory: a WARN does not block; not a quality verdict)

| Check | Status | Measured | Target |
|---|---|---|---|
| motion in the first 2 s | PASS | 5.088 | >= 0.3 mean frame change |
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
