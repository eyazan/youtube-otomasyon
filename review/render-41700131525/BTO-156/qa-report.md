# QA report: microwave-doors-what-explains-metal-mesh-premium-final.mp4

Objective verdict: **PASS (hard checks)** · measured 2026-11-03T19:20:23.924Z
UNVERIFIED (could not be measured, not counted as pass): audio samples clipped

| Check | Result | Measured | Target |
|---|---|---|---|
| resolution | PASS | 1080x1920 30/1 h264 | 1080x1920 |
| frame rate | PASS | 30/1 | 30/1 |
| codec | PASS | h264 High yuv420p | h264 yuv420p |
| full decode errors | PASS | 0 | 0 |
| duration (channel Shorts target) | PASS | 31.9 s | 30-50 s |
| black frames >= 0.1 s | PASS | none | none |
| first frame not empty | PASS | mean luma 59.9, detail sd 58.5, edge 4.77 | mean > 25, sd > 20 |
| static holds >= 2 s (freezedetect n=0.003) | PASS | none | none |
| audio samples clipped | *UNVERIFIED* | not reported by this FFmpeg build (astats has no clipped-sample count) | 0 |
| sample peak below full scale (decoded AAC) | PASS | -3.00 dBFS | <= -0.1 dBFS |
| flat factor (sustained full-scale runs) | PASS | 0/0/0 | 0 |
| integrated loudness | PASS | -14 LUFS | -14 +/- 1 |
| true peak | PASS | -3 dBTP | <= -1 dBTP |
| silence >= 1.0 s at -45 dB | PASS | none | reported (designed pauses allowed) |
| a/v duration match | PASS | 0.000 s | <= 0.1 s |
| caption layout | PASS | 17 cues, 0 over 2 lines x 26 chars | <= 2 x 26 |
| caption reading speed | WARN | 2 cues over 22 chars/s (max 23.5) | <= 22 chars/s |
| captions within video | PASS | last cue ends 31.48 s | <= 31.90 s |
| loop continuity (last -> first frame) | WARN | whole 5.42, photo region 11.08, final-second step 0.39, ratio 6.67 | whole <= 25; not (ratio > 3 and > 4) |
| first spoken word within 0.5 s | PASS | 0.32 s | <= 0.5 s |
| caption sync vs narration onsets (cues after a pause) | PASS | 9 cues: max 76 ms, mean 56 ms | max <= 150 ms |
| narration is real speech (lib/speech-check) | PASS | voiced 0.76, 2.81 words/s, longest silence 0.68 s | speech-check ok |
| narration voice approved for publishing | PASS | en-US-EmmaMultilingualNeural | approved channel voice |
| text gate (collisions, caption band, edges, size) | PASS | 0 FAIL / 0 WARN groups; min essential 30px | 0 FAIL |
| essential text >= style minimum | PASS | 30px | >= 30px |
| no static hold >= 1.5 s inside a scene (visual change target) | PASS | longest 0.73 s (s1-hook) | < 1.5 s |
| no two scenes look alike (key-frame correlation <= 0.92; hook/payoff loop pair exempt) | PASS | max 0.816 | <= 0.92 |
| deterministic frames (two fresh pages, any order) | PASS | 0.7s same, 12.3s same, 24.9s same, 29.1s same | identical |

## Motion per scene

| Scene | Seconds | Mean motion | Static share | Longest static |
|---|---|---|---|---|
| s1-hook | 3.95 | 0.603 | 0.38 | 0.73 s |
| s2-shield | 3.62 | 0.648 | 0.21 | 0.13 s |
| s3-source | 4.56 | 0.826 | 0.13 | 0.53 s |
| s4-cage | 4.09 | 1.2 | 0 | 0 s |
| s5-aperture | 4.25 | 1.128 | 0.02 | 0.03 s |
| s6-blocked | 2.89 | 1.291 | 0.02 | 0.03 s |
| s7-light | 4.56 | 1.426 | 0 | 0 s |
| s8-payoff | 3.95 | 1.447 | 0.13 | 0.13 s |

## Creative checks (advisory: a WARN does not block; not a quality verdict)

| Check | Status | Measured | Target |
|---|---|---|---|
| motion in the first 2 s | PASS | 0.967 | >= 0.3 mean frame change |
| scene variety | PASS | 8 types (hook, shield, source, cage, aperture, blocked, light, payoff); longest run 1 | >= 4 types, no type 3x in a row |
| headlines read as complete phrases | PASS | 0 headlines | no repeat, no dangling end word |
| headline hand-over at cuts | PASS | clean | outgoing headline exits before the next one |
| object on screen | PASS | 8/8 scenes show the object | >= half the scenes |
| Is the drawn object the right type for this case (structure type, vehicle class), with no invented detail? | HUMAN | not measurable by script | reviewer answers before publication |
| Does the mechanism shown (load path, spin, breach, slide) match the cited cause, step by step? | HUMAN | not measurable by script | reviewer answers before publication |
| Is the hook strong enough to stop a scroll, and is the payoff a real lesson rather than a restatement? | HUMAN | not measurable by script | reviewer answers before publication |
| Do the on-screen words read as natural English for a viewer who has not heard the narration? | HUMAN | not measurable by script | reviewer answers before publication |

## Text gate findings

- none

Contact sheet: `../../_temp/review/BTO-156/out/contact-sheet.png` · Scene sheet: `../../_temp/review/BTO-156/out/scene-sheet.png`

Subjective creative evaluation is separate (revision-history.md).
