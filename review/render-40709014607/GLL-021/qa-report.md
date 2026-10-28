# QA report: hand-of-god-and-goal-of-the-century-premium-final.mp4

Objective verdict: **PASS (hard checks)** · measured 2026-10-28T14:48:01.053Z
UNVERIFIED (could not be measured, not counted as pass): audio samples clipped

| Check | Result | Measured | Target |
|---|---|---|---|
| resolution | PASS | 1080x1920 30/1 h264 | 1080x1920 |
| frame rate | PASS | 30/1 | 30/1 |
| codec | PASS | h264 High yuv420p | h264 yuv420p |
| full decode errors | PASS | 0 | 0 |
| duration (channel Shorts target) | PASS | 25.6 s | 25-55 s |
| black frames >= 0.1 s | PASS | none | none |
| first frame not empty | PASS | mean luma 55.2, detail sd 34.6, edge 2.17 | mean > 25, sd > 20 |
| static holds >= 2 s (freezedetect n=0.003) | PASS | none | none |
| audio samples clipped | *UNVERIFIED* | not reported by this FFmpeg build (astats has no clipped-sample count) | 0 |
| sample peak below full scale (decoded AAC) | PASS | -1.95 dBFS | <= -0.1 dBFS |
| flat factor (sustained full-scale runs) | PASS | 0/0/0 | 0 |
| integrated loudness | PASS | -14.1 LUFS | -14 +/- 1 |
| true peak | PASS | -2 dBTP | <= -1 dBTP |
| silence >= 1.0 s at -45 dB | PASS | none | reported (designed pauses allowed) |
| a/v duration match | PASS | 0.000 s | <= 0.1 s |
| caption layout | PASS | 14 cues, 0 over 2 lines x 26 chars | <= 2 x 26 |
| caption reading speed | PASS | 0 cues over 22 chars/s (max 19.6) | <= 22 chars/s |
| captions within video | PASS | last cue ends 25.37 s | <= 25.60 s |
| loop continuity (last -> first frame) | WARN | whole 11.73, photo region 17.96, final-second step 0.01, ratio 23.88 | whole <= 25; not (ratio > 3 and > 4) |
| first spoken word within 0.5 s | PASS | 0.00 s | <= 0.5 s |
| caption sync vs narration onsets (cues after a pause) | WARN | 10 cues: max 169 ms, mean 136 ms | max <= 150 ms |
| narration is real speech (lib/speech-check) | PASS | voiced 0.665, 2.34 words/s, longest silence 1.02 s | speech-check ok |
| narration voice approved for publishing | WARN | en-GB-RyanNeural (preview fallback) | approved channel voice |
| text gate (collisions, caption band, edges, size) | PASS | 0 FAIL / 0 WARN groups; min essential 30px | 0 FAIL |
| essential text >= style minimum | PASS | 30px | >= 30px |
| no static hold >= 1.5 s inside a scene (visual change target) | WARN | longest 1.77 s (s2-when) | < 1.5 s |
| no two scenes look alike (key-frame correlation <= 0.92; hook/payoff loop pair exempt) | PASS | max 0.889 | <= 0.92 |
| deterministic frames (two fresh pages, any order) | PASS | 0.7s same, 12.3s same, 24.9s same | identical |

## Motion per scene

| Scene | Seconds | Mean motion | Static share | Longest static |
|---|---|---|---|---|
| s1-hook | 5.34 | 0.773 | 0.24 | 0.73 s |
| s2-when | 5.53 | 0.422 | 0.85 | 1.77 s |
| s3-story | 3.52 | 0.373 | 0.6 | 1.13 s |
| s4-story | 2.35 | 0.479 | 0.46 | 0.73 s |
| s5-story | 3.7 | 0.383 | 0.56 | 1.23 s |
| s6-payoff | 5.14 | 1.087 | 0.26 | 1 s |

## Creative checks (advisory: a WARN does not block; not a quality verdict)

| Check | Status | Measured | Target |
|---|---|---|---|
| motion in the first 2 s | PASS | 1.149 | >= 0.3 mean frame change |
| scene variety | WARN | 4 types (hook, when, story, payoff); longest run 3 | >= 4 types, no type 3x in a row |
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
