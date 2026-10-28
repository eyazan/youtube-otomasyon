# QA report: i-35w-bridge-2007-premium-final.mp4

Objective verdict: **PASS (hard checks)** · measured 2026-10-28T14:33:27.579Z
UNVERIFIED (could not be measured, not counted as pass): audio samples clipped

| Check | Result | Measured | Target |
|---|---|---|---|
| resolution | PASS | 1080x1920 30/1 h264 | 1080x1920 |
| frame rate | PASS | 30/1 | 30/1 |
| codec | PASS | h264 High yuv420p | h264 yuv420p |
| full decode errors | PASS | 0 | 0 |
| duration (channel Shorts target) | PASS | 31.533 s | 20-60 s |
| black frames >= 0.1 s | PASS | none | none |
| first frame not empty | PASS | mean luma 31.2, detail sd 22.7, edge 3.12 | mean > 25, sd > 20 |
| static holds >= 2 s (freezedetect n=0.003) | PASS | none | none |
| audio samples clipped | *UNVERIFIED* | not reported by this FFmpeg build (astats has no clipped-sample count) | 0 |
| sample peak below full scale (decoded AAC) | PASS | -1.98 dBFS | <= -0.1 dBFS |
| flat factor (sustained full-scale runs) | PASS | 0/0/0 | 0 |
| integrated loudness | PASS | -14.1 LUFS | -14 +/- 1 |
| true peak | PASS | -1.9 dBTP | <= -1 dBTP |
| silence >= 1.0 s at -45 dB | PASS | none | reported (designed pauses allowed) |
| a/v duration match | PASS | 0.000 s | <= 0.1 s |
| caption layout | PASS | 17 cues, 0 over 2 lines x 26 chars | <= 2 x 26 |
| caption reading speed | WARN | 1 cues over 22 chars/s (max 32.6) | <= 22 chars/s |
| captions within video | PASS | last cue ends 31.10 s | <= 31.53 s |
| loop continuity (last -> first frame) | PASS | whole 0.7, photo region 1.09, final-second step 0.03, ratio 2.28 | whole <= 25; not (ratio > 3 and > 4) |
| first spoken word within 0.5 s | PASS | 0.05 s | <= 0.5 s |
| caption sync vs narration onsets (cues after a pause) | PASS | 11 cues: max 57 ms, mean 43 ms | max <= 150 ms |
| narration is real speech (lib/speech-check) | PASS | voiced 0.712, 2.59 words/s, longest silence 0.74 s | speech-check ok |
| narration voice approved for publishing | PASS | en-US-AndrewMultilingualNeural | approved channel voice |
| text gate (collisions, caption band, edges, size) | PASS | 0 FAIL / 1 WARN groups; min essential 30px | 0 FAIL |
| essential text >= style minimum | PASS | 30px | >= 30px |
| no static hold >= 1.5 s inside a scene (visual change target) | PASS | longest 1.27 s (s1-hook) | < 1.5 s |
| no two scenes look alike (key-frame correlation <= 0.92; hook/payoff loop pair exempt) | PASS | max 0.66 | <= 0.92 |
| deterministic frames (two fresh pages, any order) | PASS | 0.7s same, 12.3s same, 24.9s same, 29.1s same | identical |

## Motion per scene

| Scene | Seconds | Mean motion | Static share | Longest static |
|---|---|---|---|---|
| s1-hook | 4.76 | 0.45 | 0.57 | 1.27 s |
| s2-toll | 4.37 | 0.444 | 0.59 | 0.73 s |
| s3-chain | 2.73 | 0.446 | 0.73 | 1.27 s |
| s4-trigger | 4.13 | 2.051 | 0.2 | 0.47 s |
| s5-chain | 3.97 | 1.211 | 0.62 | 0.97 s |
| s6-chain | 4 | 1.347 | 0.63 | 1.03 s |
| s7-mechanism | 3.15 | 2.168 | 0.06 | 0.13 s |
| s8-payoff | 4.41 | 0.592 | 0.44 | 0.4 s |

## Creative checks (advisory: a WARN does not block; not a quality verdict)

| Check | Status | Measured | Target |
|---|---|---|---|
| motion in the first 2 s | PASS | 0.882 | >= 0.3 mean frame change |
| scene variety | PASS | 6 types (hook, toll, chain, trigger, mechanism, payoff); longest run 2 | >= 4 types, no type 3x in a row |
| headlines read as complete phrases | PASS | 4 headlines | no repeat, no dangling end word |
| headline hand-over at cuts | PASS | clean | outgoing headline exits before the next one |
| object on screen | PASS | 5/8 scenes show the object | >= half the scenes |
| Is the drawn object the right type for this case (structure type, vehicle class), with no invented detail? | HUMAN | not measurable by script | reviewer answers before publication |
| Does the mechanism shown (load path, spin, breach, slide) match the cited cause, step by step? | HUMAN | not measurable by script | reviewer answers before publication |
| Is the hook strong enough to stop a scroll, and is the payoff a real lesson rather than a restatement? | HUMAN | not measurable by script | reviewer answers before publication |
| Do the on-screen words read as natural English for a viewer who has not heard the narration? | HUMAN | not measurable by script | reviewer answers before publication |

## Text gate findings

- WARN 16.75–20.25 s text under right UI buttons: "CONSTRUCTION LOAD PARKED" x=274-980


Contact sheet: `../../_temp/review/FR-i-35w-bridge-2007/out/contact-sheet.png` · Scene sheet: `../../_temp/review/FR-i-35w-bridge-2007/out/scene-sheet.png`

Subjective creative evaluation is separate (revision-history.md).
