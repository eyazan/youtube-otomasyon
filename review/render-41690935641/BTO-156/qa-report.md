# QA report: microwave-doors-what-explains-metal-mesh-premium-final.mp4

Objective verdict: **FAIL** · measured 2026-11-03T18:16:36.300Z
UNVERIFIED (could not be measured, not counted as pass): audio samples clipped

| Check | Result | Measured | Target |
|---|---|---|---|
| resolution | PASS | 1080x1920 30/1 h264 | 1080x1920 |
| frame rate | PASS | 30/1 | 30/1 |
| codec | PASS | h264 High yuv420p | h264 yuv420p |
| full decode errors | PASS | 0 | 0 |
| duration (channel Shorts target) | **FAIL** | 27.333 s | 30-50 s |
| black frames >= 0.1 s | PASS | none | none |
| first frame not empty | PASS | mean luma 76.0, detail sd 82.3, edge 1.29 | mean > 25, sd > 20 |
| static holds >= 2 s (freezedetect n=0.003) | PASS | none | none |
| audio samples clipped | *UNVERIFIED* | not reported by this FFmpeg build (astats has no clipped-sample count) | 0 |
| sample peak below full scale (decoded AAC) | PASS | -3.00 dBFS | <= -0.1 dBFS |
| flat factor (sustained full-scale runs) | PASS | 0/0/0 | 0 |
| integrated loudness | PASS | -14 LUFS | -14 +/- 1 |
| true peak | PASS | -3 dBTP | <= -1 dBTP |
| silence >= 1.0 s at -45 dB | PASS | none | reported (designed pauses allowed) |
| a/v duration match | PASS | 0.000 s | <= 0.1 s |
| caption layout | PASS | 15 cues, 0 over 2 lines x 26 chars | <= 2 x 26 |
| caption reading speed | WARN | 2 cues over 22 chars/s (max 23.5) | <= 22 chars/s |
| captions within video | PASS | last cue ends 26.91 s | <= 27.33 s |
| loop continuity (last -> first frame) | PASS | whole 2.2, photo region 3.73, final-second step 0, ratio 5.4 | whole <= 25; not (ratio > 3 and > 4) |
| first spoken word within 0.5 s | PASS | 0.00 s | <= 0.5 s |
| caption sync vs narration onsets (cues after a pause) | PASS | 8 cues: max 76 ms, mean 57 ms | max <= 150 ms |
| narration is real speech (lib/speech-check) | PASS | voiced 0.763, 2.96 words/s, longest silence 0.68 s | speech-check ok |
| narration voice approved for publishing | PASS | en-US-EmmaMultilingualNeural | approved channel voice |
| text gate (collisions, caption band, edges, size) | PASS | 0 FAIL / 0 WARN groups; min essential 30px | 0 FAIL |
| essential text >= style minimum | PASS | 30px | >= 30px |
| no static hold >= 1.5 s inside a scene (visual change target) | WARN | longest 2.3 s (s3-quote) | < 1.5 s |
| no two scenes look alike (key-frame correlation <= 0.92; hook/payoff loop pair exempt) | PASS | max 0.911 | <= 0.92 |
| deterministic frames (two fresh pages, any order) | PASS | 0.7s same, 12.3s same, 24.9s same | identical |

## Motion per scene

| Scene | Seconds | Mean motion | Static share | Longest static |
|---|---|---|---|---|
| s1-hook | 3.95 | 0.262 | 0.6 | 1.27 s |
| s2-quote | 3.62 | 0.721 | 0.48 | 1.53 s |
| s3-quote | 4.09 | 0.747 | 0.62 | 2.3 s |
| s4-detail | 4.26 | 0.613 | 0.44 | 0.97 s |
| s5-detail | 2.89 | 0.712 | 0.44 | 0.87 s |
| s6-detail | 4.56 | 0.392 | 0.64 | 2 s |
| s7-payoff | 3.95 | 0.403 | 0.69 | 1.6 s |

## Creative checks (advisory: a WARN does not block; not a quality verdict)

| Check | Status | Measured | Target |
|---|---|---|---|
| motion in the first 2 s | PASS | 0.403 | >= 0.3 mean frame change |
| scene variety | WARN | 4 types (hook, quote, detail, payoff); longest run 3 | >= 4 types, no type 3x in a row |
| headlines read as complete phrases | PASS | 2 headlines | no repeat, no dangling end word |
| headline hand-over at cuts | PASS | clean | outgoing headline exits before the next one |
| object on screen | PASS | 7/7 scenes show the object | >= half the scenes |
| Is the drawn object the right type for this case (structure type, vehicle class), with no invented detail? | HUMAN | not measurable by script | reviewer answers before publication |
| Does the mechanism shown (load path, spin, breach, slide) match the cited cause, step by step? | HUMAN | not measurable by script | reviewer answers before publication |
| Is the hook strong enough to stop a scroll, and is the payoff a real lesson rather than a restatement? | HUMAN | not measurable by script | reviewer answers before publication |
| Do the on-screen words read as natural English for a viewer who has not heard the narration? | HUMAN | not measurable by script | reviewer answers before publication |

## Text gate findings

- none

Contact sheet: `../../_temp/review/BTO-156/out/contact-sheet.png` · Scene sheet: `../../_temp/review/BTO-156/out/scene-sheet.png`

Subjective creative evaluation is separate (revision-history.md).
