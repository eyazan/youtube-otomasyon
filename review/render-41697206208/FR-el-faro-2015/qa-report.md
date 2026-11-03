# QA report: el-faro-2015-premium-final.mp4

Objective verdict: **PASS (hard checks)** · measured 2026-11-03T18:54:57.626Z
UNVERIFIED (could not be measured, not counted as pass): audio samples clipped

| Check | Result | Measured | Target |
|---|---|---|---|
| resolution | PASS | 1080x1920 30/1 h264 | 1080x1920 |
| frame rate | PASS | 30/1 | 30/1 |
| codec | PASS | h264 High yuv420p | h264 yuv420p |
| full decode errors | PASS | 0 | 0 |
| duration (channel Shorts target) | PASS | 26.9 s | 20-60 s |
| black frames >= 0.1 s | PASS | none | none |
| first frame not empty | PASS | mean luma 33.9, detail sd 29.1, edge 1.91 | mean > 25, sd > 20 |
| static holds >= 2 s (freezedetect n=0.003) | PASS | none | none |
| audio samples clipped | *UNVERIFIED* | not reported by this FFmpeg build (astats has no clipped-sample count) | 0 |
| sample peak below full scale (decoded AAC) | PASS | -2.89 dBFS | <= -0.1 dBFS |
| flat factor (sustained full-scale runs) | PASS | 0/0/0 | 0 |
| integrated loudness | PASS | -14.3 LUFS | -14 +/- 1 |
| true peak | PASS | -2.9 dBTP | <= -1 dBTP |
| silence >= 1.0 s at -45 dB | PASS | none | reported (designed pauses allowed) |
| a/v duration match | PASS | 0.000 s | <= 0.1 s |
| caption layout | PASS | 16 cues, 0 over 2 lines x 26 chars | <= 2 x 26 |
| caption reading speed | PASS | 0 cues over 22 chars/s (max 21.9) | <= 22 chars/s |
| captions within video | PASS | last cue ends 26.49 s | <= 26.90 s |
| loop continuity (last -> first frame) | WARN | whole 15.44, photo region 16.93, final-second step 0.18, ratio 23.48 | whole <= 25; not (ratio > 3 and > 4) |
| first spoken word within 0.5 s | PASS | 0.05 s | <= 0.5 s |
| caption sync vs narration onsets (cues after a pause) | PASS | 9 cues: max 51 ms, mean 43 ms | max <= 150 ms |
| narration is real speech (lib/speech-check) | PASS | voiced 0.717, 2.74 words/s, longest silence 0.7 s | speech-check ok |
| narration voice approved for publishing | PASS | en-US-AndrewMultilingualNeural | approved channel voice |
| text gate (collisions, caption band, edges, size) | PASS | 0 FAIL / 0 WARN groups; min essential 30px | 0 FAIL |
| essential text >= style minimum | PASS | 30px | >= 30px |
| no static hold >= 1.5 s inside a scene (visual change target) | PASS | longest 0.73 s (s5-flooding) | < 1.5 s |
| no two scenes look alike (key-frame correlation <= 0.92; hook/payoff loop pair exempt) | PASS | max 0.507 | <= 0.92 |
| deterministic frames (two fresh pages, any order) | PASS | 0.7s same, 12.3s same, 24.9s same | identical |

## Motion per scene

| Scene | Seconds | Mean motion | Static share | Longest static |
|---|---|---|---|---|
| s1-hook | 4.25 | 1.091 | 0 | 0 s |
| s2-toll | 3.4 | 0.483 | 0.69 | 0.47 s |
| s3-storm | 2.97 | 0.749 | 0.25 | 0.47 s |
| s4-forecast | 2.86 | 0.85 | 0.18 | 0.23 s |
| s5-flooding | 3.67 | 0.59 | 0.31 | 0.73 s |
| s6-propulsion | 2.61 | 0.817 | 0.28 | 0.47 s |
| s7-sinking | 2.93 | 1.149 | 0.01 | 0.03 s |
| s8-payoff | 4.22 | 0.533 | 0.3 | 0.43 s |

## Creative checks (advisory: a WARN does not block; not a quality verdict)

| Check | Status | Measured | Target |
|---|---|---|---|
| motion in the first 2 s | PASS | 1.264 | >= 0.3 mean frame change |
| scene variety | PASS | 8 types (hook, toll, storm, forecast, flooding, propulsion, sinking, payoff); longest run 1 | >= 4 types, no type 3x in a row |
| headlines read as complete phrases | PASS | 3 headlines | no repeat, no dangling end word |
| headline hand-over at cuts | PASS | clean | outgoing headline exits before the next one |
| object on screen | PASS | 8/8 scenes show the object | >= half the scenes |
| Is the drawn object the right type for this case (structure type, vehicle class), with no invented detail? | HUMAN | not measurable by script | reviewer answers before publication |
| Does the mechanism shown (load path, spin, breach, slide) match the cited cause, step by step? | HUMAN | not measurable by script | reviewer answers before publication |
| Is the hook strong enough to stop a scroll, and is the payoff a real lesson rather than a restatement? | HUMAN | not measurable by script | reviewer answers before publication |
| Do the on-screen words read as natural English for a viewer who has not heard the narration? | HUMAN | not measurable by script | reviewer answers before publication |

## Text gate findings

- none

Contact sheet: `../../_temp/review/FR-el-faro-2015/out/contact-sheet.png` · Scene sheet: `../../_temp/review/FR-el-faro-2015/out/scene-sheet.png`

Subjective creative evaluation is separate (revision-history.md).
