# QA report: what-if-earth-stopped-spinning-for-one-second-premium-final.mp4

Objective verdict: **FAIL** · measured 2026-10-30T05:09:25.714Z
UNVERIFIED (could not be measured, not counted as pass): audio samples clipped

| Check | Result | Measured | Target |
|---|---|---|---|
| resolution | PASS | 1080x1920 30/1 h264 | 1080x1920 |
| frame rate | PASS | 30/1 | 30/1 |
| codec | PASS | h264 High yuv420p | h264 yuv420p |
| full decode errors | PASS | 0 | 0 |
| duration (channel Shorts target) | PASS | 29.9 s | 18-42 s |
| black frames >= 0.1 s | PASS | none | none |
| first frame not empty | PASS | mean luma 38.7, detail sd 33.2, edge 1.36 | mean > 25, sd > 20 |
| static holds >= 2 s (freezedetect n=0.003) | PASS | none | none |
| audio samples clipped | *UNVERIFIED* | not reported by this FFmpeg build (astats has no clipped-sample count) | 0 |
| sample peak below full scale (decoded AAC) | PASS | -1.99 dBFS | <= -0.1 dBFS |
| flat factor (sustained full-scale runs) | PASS | 0/0/0 | 0 |
| integrated loudness | PASS | -14.1 LUFS | -14 +/- 1 |
| true peak | PASS | -1.9 dBTP | <= -1 dBTP |
| silence >= 1.0 s at -45 dB | PASS | none | reported (designed pauses allowed) |
| a/v duration match | PASS | 0.000 s | <= 0.1 s |
| caption layout | PASS | 13 cues, 0 over 2 lines x 26 chars | <= 2 x 26 |
| caption reading speed | PASS | 0 cues over 22 chars/s (max 18.9) | <= 22 chars/s |
| captions within video | PASS | last cue ends 29.48 s | <= 29.90 s |
| loop continuity (last -> first frame) | WARN | whole 8.02, photo region 16.19, final-second step 0.45, ratio 8.96 | whole <= 25; not (ratio > 3 and > 4) |
| first spoken word within 0.5 s | PASS | 0.05 s | <= 0.5 s |
| caption sync vs narration onsets (cues after a pause) | PASS | 9 cues: max 122 ms, mean 67 ms | max <= 150 ms |
| narration is real speech (lib/speech-check) | PASS | voiced 0.762, 2.05 words/s, longest silence 0.62 s | speech-check ok |
| narration voice approved for publishing | PASS | en-US-BrianMultilingualNeural | approved channel voice |
| text gate (collisions, caption band, edges, size) | **FAIL** | 21 FAIL / 0 WARN groups; min essential 30px | 0 FAIL |
| essential text >= style minimum | PASS | 30px | >= 30px |
| no static hold >= 1.5 s inside a scene (visual change target) | WARN | longest 3.3 s (s6-measure) | < 1.5 s |
| no two scenes look alike (key-frame correlation <= 0.92; hook/payoff loop pair exempt) | PASS | max 0.788 | <= 0.92 |
| deterministic frames (two fresh pages, any order) | PASS | 0.7s same, 12.3s same, 24.9s same, 29.1s same | identical |

## Motion per scene

| Scene | Seconds | Mean motion | Static share | Longest static |
|---|---|---|---|---|
| s1-hook | 2.36 | 0.317 | 0.57 | 1.2 s |
| s2-measure | 4.06 | 0.46 | 0.64 | 1.27 s |
| s3-mechanism | 6.67 | 0.391 | 0.64 | 0.97 s |
| s4-measure | 4.07 | 0.551 | 0.64 | 1.23 s |
| s5-mechanism | 2.43 | 0.733 | 0.56 | 0.8 s |
| s6-measure | 6.74 | 0.296 | 0.88 | 3.3 s |
| s7-payoff | 3.57 | 0.732 | 0.05 | 0.07 s |

## Creative checks (advisory: a WARN does not block; not a quality verdict)

| Check | Status | Measured | Target |
|---|---|---|---|
| motion in the first 2 s | PASS | 0.358 | >= 0.3 mean frame change |
| scene variety | PASS | 4 types (hook, measure, mechanism, payoff); longest run 1 | >= 4 types, no type 3x in a row |
| headlines read as complete phrases | PASS | 4 headlines | no repeat, no dangling end word |
| headline hand-over at cuts | PASS | clean | outgoing headline exits before the next one |
| object on screen | PASS | 7/7 scenes show the object | >= half the scenes |
| Is the drawn object the right type for this case (structure type, vehicle class), with no invented detail? | HUMAN | not measurable by script | reviewer answers before publication |
| Does the mechanism shown (load path, spin, breach, slide) match the cited cause, step by step? | HUMAN | not measurable by script | reviewer answers before publication |
| Is the hook strong enough to stop a scroll, and is the payoff a real lesson rather than a restatement? | HUMAN | not measurable by script | reviewer answers before publication |
| Do the on-screen words read as natural English for a viewer who has not heard the narration? | HUMAN | not measurable by script | reviewer answers before publication |

## Text gate findings

- FAIL 23.25–23.25 s text at/over frame edge: "45° LATITUDE" x=29-312
- FAIL 23.25–23.25 s text at/over frame edge: "EQUATOR" x=29-224
- FAIL 23.50–23.50 s text at/over frame edge: "45° LATITUDE" x=24-308
- FAIL 23.50–23.50 s text at/over frame edge: "EQUATOR" x=24-220
- FAIL 23.75–23.75 s text at/over frame edge: "45° LATITUDE" x=21-306
- FAIL 23.75–23.75 s text at/over frame edge: "EQUATOR" x=21-218
- FAIL 24.00–24.00 s text at/over frame edge: "45° LATITUDE" x=18-303
- FAIL 24.00–24.00 s text at/over frame edge: "EQUATOR" x=18-215
- FAIL 24.25–24.25 s text at/over frame edge: "45° LATITUDE" x=15-301
- FAIL 24.25–24.25 s text at/over frame edge: "EQUATOR" x=15-213
- FAIL 24.50–24.50 s text at/over frame edge: "45° LATITUDE" x=13-299
- FAIL 24.50–24.50 s text at/over frame edge: "EQUATOR" x=13-211
- FAIL 24.75–24.75 s text at/over frame edge: "45° LATITUDE" x=12-299
- FAIL 24.75–24.75 s text at/over frame edge: "EQUATOR" x=12-210
- FAIL 25.00–25.00 s text at/over frame edge: "45° LATITUDE" x=11-298
- FAIL 25.00–25.00 s text at/over frame edge: "EQUATOR" x=11-209
- FAIL 25.25–25.25 s text at/over frame edge: "45° LATITUDE" x=10-297
- FAIL 25.25–25.25 s text at/over frame edge: "EQUATOR" x=10-208
- FAIL 25.50–25.50 s text at/over frame edge: "45° LATITUDE" x=9-296
- FAIL 25.50–26.75 s text at/over frame edge: "EQUATOR" x=9-208
- FAIL 25.75–26.75 s text at/over frame edge: "45° LATITUDE" x=9-297


Contact sheet: `../../_temp/review/IB-EAR-001/out/contact-sheet.png` · Scene sheet: `../../_temp/review/IB-EAR-001/out/scene-sheet.png`

Subjective creative evaluation is separate (revision-history.md).
