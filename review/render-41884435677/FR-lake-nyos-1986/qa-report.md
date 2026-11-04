# QA report: lake-nyos-1986-premium-final.mp4

Objective verdict: **FAIL** · measured 2026-11-04T18:15:37.132Z
UNVERIFIED (could not be measured, not counted as pass): audio samples clipped

| Check | Result | Measured | Target |
|---|---|---|---|
| resolution | PASS | 1080x1920 30/1 h264 | 1080x1920 |
| frame rate | PASS | 30/1 | 30/1 |
| codec | PASS | h264 High yuv420p | h264 yuv420p |
| full decode errors | PASS | 0 | 0 |
| duration (channel Shorts target) | PASS | 29.2 s | 20-60 s |
| black frames >= 0.1 s | PASS | none | none |
| first frame not empty | PASS | mean luma 31.8, detail sd 26.1, edge 2.81 | mean > 25, sd > 20 |
| static holds >= 2 s (freezedetect n=0.003) | PASS | none | none |
| audio samples clipped | *UNVERIFIED* | not reported by this FFmpeg build (astats has no clipped-sample count) | 0 |
| sample peak below full scale (decoded AAC) | PASS | -2.94 dBFS | <= -0.1 dBFS |
| flat factor (sustained full-scale runs) | PASS | 0/0/0 | 0 |
| integrated loudness | PASS | -14.4 LUFS | -14 +/- 1 |
| true peak | PASS | -2.9 dBTP | <= -1 dBTP |
| silence >= 1.0 s at -45 dB | PASS | none | reported (designed pauses allowed) |
| a/v duration match | PASS | 0.000 s | <= 0.1 s |
| caption layout | PASS | 15 cues, 0 over 2 lines x 26 chars | <= 2 x 26 |
| caption reading speed | PASS | 0 cues over 22 chars/s (max 20.0) | <= 22 chars/s |
| captions within video | PASS | last cue ends 28.77 s | <= 29.20 s |
| loop continuity (last -> first frame) | PASS | whole 2.07, photo region 1.94, final-second step 0.01, ratio 5.08 | whole <= 25; not (ratio > 3 and > 4) |
| first spoken word within 0.5 s | PASS | 0.00 s | <= 0.5 s |
| caption sync vs narration onsets (cues after a pause) | PASS | 10 cues: max 74 ms, mean 44 ms | max <= 150 ms |
| narration is real speech (lib/speech-check) | PASS | voiced 0.751, 2.48 words/s, longest silence 0.68 s | speech-check ok |
| narration voice approved for publishing | PASS | en-US-AndrewMultilingualNeural | approved channel voice |
| text gate (collisions, caption band, edges, size) | **FAIL** | 3 FAIL / 5 WARN groups; min essential 30px | 0 FAIL |
| essential text >= style minimum | PASS | 30px | >= 30px |
| no static hold >= 1.5 s inside a scene (visual change target) | WARN | longest 1.53 s (s5-chain) | < 1.5 s |
| no two scenes look alike (key-frame correlation <= 0.92; hook/payoff loop pair exempt) | PASS | max 0.616 | <= 0.92 |
| deterministic frames (two fresh pages, any order) | PASS | 0.7s same, 12.3s same, 24.9s same, 29.1s same | identical |

## Motion per scene

| Scene | Seconds | Mean motion | Static share | Longest static |
|---|---|---|---|---|
| s1-hook | 5.02 | 0.23 | 0.66 | 0.77 s |
| s2-toll | 5.22 | 0.379 | 0.66 | 0.67 s |
| s3-chain | 2.14 | 0.486 | 0.73 | 0.63 s |
| s4-trigger | 4.46 | 1.092 | 0.01 | 0.03 s |
| s5-chain | 3.46 | 1.506 | 0.6 | 1.53 s |
| s6-chain | 3.35 | 1.71 | 0.56 | 0.7 s |
| s7-mechanism | 2.51 | 1.211 | 0.12 | 0.23 s |
| s8-payoff | 3.02 | 0.631 | 0.51 | 0.63 s |

## Creative checks (advisory: a WARN does not block; not a quality verdict)

| Check | Status | Measured | Target |
|---|---|---|---|
| motion in the first 2 s | PASS | 0.357 | >= 0.3 mean frame change |
| scene variety | PASS | 6 types (hook, toll, chain, trigger, mechanism, payoff); longest run 2 | >= 4 types, no type 3x in a row |
| headlines read as complete phrases | PASS | 4 headlines | no repeat, no dangling end word |
| headline hand-over at cuts | PASS | clean | outgoing headline exits before the next one |
| object on screen | PASS | 5/8 scenes show the object | >= half the scenes |
| Is the drawn object the right type for this case (structure type, vehicle class), with no invented detail? | HUMAN | not measurable by script | reviewer answers before publication |
| Does the mechanism shown (load path, spin, breach, slide) match the cited cause, step by step? | HUMAN | not measurable by script | reviewer answers before publication |
| Is the hook strong enough to stop a scroll, and is the payoff a real lesson rather than a restatement? | HUMAN | not measurable by script | reviewer answers before publication |
| Do the on-screen words read as natural English for a viewer who has not heard the narration? | HUMAN | not measurable by script | reviewer answers before publication |

## Text gate findings

- FAIL 14.50–14.50 s text at/over frame edge: "CO2" x=1037-1141
- FAIL 25.75–25.75 s text at/over frame edge: "CO2" x=1001-1100
- FAIL 26.00–26.50 s text at/over frame edge: "CO2" x=1075-1174
- WARN 14.25–14.25 s text under right UI buttons: "CO2" x=925-1025
- WARN 14.50–14.50 s text under right UI buttons: "CO2" x=1037-1141
- WARN 25.50–25.50 s text under right UI buttons: "CO2" x=910-1008
- WARN 25.75–25.75 s text under right UI buttons: "CO2" x=1001-1100
- WARN 26.00–26.50 s text under right UI buttons: "CO2" x=1075-1174


Contact sheet: `../../_temp/review/FR-lake-nyos-1986/out/contact-sheet.png` · Scene sheet: `../../_temp/review/FR-lake-nyos-1986/out/scene-sheet.png`

Subjective creative evaluation is separate (revision-history.md).
