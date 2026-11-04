# QA report: why-qr-codes-have-three-corner-squares-premium-final.mp4

Objective verdict: **FAIL** · measured 2026-11-04T20:40:27.699Z
UNVERIFIED (could not be measured, not counted as pass): audio samples clipped

| Check | Result | Measured | Target |
|---|---|---|---|
| resolution | PASS | 1080x1920 30/1 h264 | 1080x1920 |
| frame rate | PASS | 30/1 | 30/1 |
| codec | PASS | h264 High yuv420p | h264 yuv420p |
| full decode errors | PASS | 0 | 0 |
| duration (channel Shorts target) | PASS | 32.533 s | 30-50 s |
| black frames >= 0.1 s | PASS | none | none |
| first frame not empty | PASS | mean luma 64.6, detail sd 74.1, edge 5.48 | mean > 25, sd > 20 |
| static holds >= 2 s (freezedetect n=0.003) | PASS | none | none |
| audio samples clipped | *UNVERIFIED* | not reported by this FFmpeg build (astats has no clipped-sample count) | 0 |
| sample peak below full scale (decoded AAC) | PASS | -3.00 dBFS | <= -0.1 dBFS |
| flat factor (sustained full-scale runs) | PASS | 0/0/0 | 0 |
| integrated loudness | PASS | -14 LUFS | -14 +/- 1 |
| true peak | PASS | -3 dBTP | <= -1 dBTP |
| silence >= 1.0 s at -45 dB | PASS | none | reported (designed pauses allowed) |
| a/v duration match | PASS | 0.000 s | <= 0.1 s |
| caption layout | PASS | 16 cues, 0 over 2 lines x 26 chars | <= 2 x 26 |
| caption reading speed | PASS | 0 cues over 22 chars/s (max 20.2) | <= 22 chars/s |
| captions within video | PASS | last cue ends 32.13 s | <= 32.53 s |
| loop continuity (last -> first frame) | WARN | whole 9.18, photo region 13.25, final-second step 0, ratio 19.23 | whole <= 25; not (ratio > 3 and > 4) |
| first spoken word within 0.5 s | PASS | 0.00 s | <= 0.5 s |
| caption sync vs narration onsets (cues after a pause) | PASS | 10 cues: max 76 ms, mean 57 ms | max <= 150 ms |
| narration is real speech (lib/speech-check) | PASS | voiced 0.781, 2.44 words/s, longest silence 0.7 s | speech-check ok |
| narration voice approved for publishing | PASS | en-US-EmmaMultilingualNeural | approved channel voice |
| text gate (collisions, caption band, edges, size) | **FAIL** | 1 FAIL / 0 WARN groups; min essential 30px | 0 FAIL |
| essential text >= style minimum | PASS | 30px | >= 30px |
| no static hold >= 1.5 s inside a scene (visual change target) | WARN | longest 2.43 s (s5-detail) | < 1.5 s |
| no two scenes look alike (key-frame correlation <= 0.92; hook/payoff loop pair exempt) | PASS | max 0.84 | <= 0.92 |
| on-screen QR decodes to a registered value (first and last frame) | PASS | 0.0s: HIDDEN LOGIC; 32.4s: HIDDEN LOGIC | HIDDEN LOGIC |
| deterministic frames (two fresh pages, any order) | PASS | 0.7s same, 12.3s same, 24.9s same, 29.1s same | identical |

## Motion per scene

| Scene | Seconds | Mean motion | Static share | Longest static |
|---|---|---|---|---|
| s1-hook | 2.87 | 0.647 | 0.41 | 0.73 s |
| s2-quote | 2.37 | 1.205 | 0.47 | 0.93 s |
| s3-year | 5.68 | 0.396 | 0.8 | 1.7 s |
| s4-quote | 5.85 | 0.49 | 0.6 | 1.17 s |
| s5-detail | 5.48 | 0.499 | 0.6 | 2.43 s |
| s6-detail | 5.79 | 0.335 | 0.74 | 1.13 s |
| s7-payoff | 4.51 | 0.623 | 0.46 | 1.27 s |

## Creative checks (advisory: a WARN does not block; not a quality verdict)

| Check | Status | Measured | Target |
|---|---|---|---|
| motion in the first 2 s | PASS | 0.888 | >= 0.3 mean frame change |
| scene variety | PASS | 5 types (hook, quote, year, detail, payoff); longest run 2 | >= 4 types, no type 3x in a row |
| headlines read as complete phrases | PASS | 4 headlines | no repeat, no dangling end word |
| headline hand-over at cuts | WARN | s5-detail, s6-detail | outgoing headline exits before the next one |
| object on screen | PASS | 7/7 scenes show the object | >= half the scenes |
| Is the drawn object the right type for this case (structure type, vehicle class), with no invented detail? | HUMAN | not measurable by script | reviewer answers before publication |
| Does the mechanism shown (load path, spin, breach, slide) match the cited cause, step by step? | HUMAN | not measurable by script | reviewer answers before publication |
| Is the hook strong enough to stop a scroll, and is the payoff a real lesson rather than a restatement? | HUMAN | not measurable by script | reviewer answers before publication |
| Do the on-screen words read as natural English for a viewer who has not heard the narration? | HUMAN | not measurable by script | reviewer answers before publication |

## Text gate findings

- FAIL 28.50–28.50 s text collision: "RAREST BLACK-AND-WHITE RATIO" x "ANY ANGLE" (83%)


Contact sheet: `../../_temp/review/BTO-301/out/contact-sheet.png` · Scene sheet: `../../_temp/review/BTO-301/out/scene-sheet.png`

Subjective creative evaluation is separate (revision-history.md).
