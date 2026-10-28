# QA report: gemini-8-1966-premium-final.mp4

Objective verdict: **PASS (hard checks)** · measured 2026-10-28T14:30:45.005Z
UNVERIFIED (could not be measured, not counted as pass): audio samples clipped

| Check | Result | Measured | Target |
|---|---|---|---|
| resolution | PASS | 1080x1920 30/1 h264 | 1080x1920 |
| frame rate | PASS | 30/1 | 30/1 |
| codec | PASS | h264 High yuv420p | h264 yuv420p |
| full decode errors | PASS | 0 | 0 |
| duration (channel Shorts target) | PASS | 27.067 s | 20-60 s |
| black frames >= 0.1 s | PASS | none | none |
| first frame not empty | PASS | mean luma 31.0, detail sd 22.5, edge 2.54 | mean > 25, sd > 20 |
| static holds >= 2 s (freezedetect n=0.003) | PASS | none | none |
| audio samples clipped | *UNVERIFIED* | not reported by this FFmpeg build (astats has no clipped-sample count) | 0 |
| sample peak below full scale (decoded AAC) | PASS | -1.99 dBFS | <= -0.1 dBFS |
| flat factor (sustained full-scale runs) | PASS | 0/0/0 | 0 |
| integrated loudness | PASS | -14.2 LUFS | -14 +/- 1 |
| true peak | PASS | -2 dBTP | <= -1 dBTP |
| silence >= 1.0 s at -45 dB | PASS | none | reported (designed pauses allowed) |
| a/v duration match | PASS | 0.000 s | <= 0.1 s |
| caption layout | PASS | 15 cues, 0 over 2 lines x 26 chars | <= 2 x 26 |
| caption reading speed | WARN | 1 cues over 22 chars/s (max 29.7) | <= 22 chars/s |
| captions within video | PASS | last cue ends 26.65 s | <= 27.07 s |
| loop continuity (last -> first frame) | WARN | whole 6.13, photo region 14.34, final-second step 0.01, ratio 13.13 | whole <= 25; not (ratio > 3 and > 4) |
| first spoken word within 0.5 s | PASS | 0.00 s | <= 0.5 s |
| caption sync vs narration onsets (cues after a pause) | PASS | 10 cues: max 67 ms, mean 46 ms | max <= 150 ms |
| narration is real speech (lib/speech-check) | PASS | voiced 0.75, 2.57 words/s, longest silence 0.7 s | speech-check ok |
| narration voice approved for publishing | PASS | en-US-AndrewMultilingualNeural | approved channel voice |
| text gate (collisions, caption band, edges, size) | PASS | 0 FAIL / 0 WARN groups; min essential 30px | 0 FAIL |
| essential text >= style minimum | PASS | 30px | >= 30px |
| no static hold >= 1.5 s inside a scene (visual change target) | PASS | longest 1.43 s (s7-chain) | < 1.5 s |
| no two scenes look alike (key-frame correlation <= 0.92; hook/payoff loop pair exempt) | PASS | max 0.501 | <= 0.92 |
| deterministic frames (two fresh pages, any order) | PASS | 0.7s same, 12.3s same, 24.9s same | identical |

## Motion per scene

| Scene | Seconds | Mean motion | Static share | Longest static |
|---|---|---|---|---|
| s1-hook | 4.5 | 2.397 | 0.09 | 0.4 s |
| s2-toll | 5.01 | 3.46 | 0 | 0 s |
| s3-chain | 2.2 | 0.932 | 0.09 | 0.07 s |
| s4-trigger | 2.7 | 4.188 | 0 | 0 s |
| s5-mechanism | 2.7 | 4.827 | 0 | 0 s |
| s6-mechanism | 3.23 | 3.641 | 0.28 | 0.83 s |
| s7-chain | 2.18 | 0.706 | 0.81 | 1.43 s |
| s8-payoff | 4.57 | 0.531 | 0.43 | 0.77 s |

## Creative checks (advisory: a WARN does not block; not a quality verdict)

| Check | Status | Measured | Target |
|---|---|---|---|
| motion in the first 2 s | PASS | 2.145 | >= 0.3 mean frame change |
| scene variety | PASS | 6 types (hook, toll, chain, trigger, mechanism, payoff); longest run 2 | >= 4 types, no type 3x in a row |
| headlines read as complete phrases | PASS | 5 headlines | no repeat, no dangling end word |
| headline hand-over at cuts | PASS | clean | outgoing headline exits before the next one |
| object on screen | PASS | 6/8 scenes show the object | >= half the scenes |
| Is the drawn object the right type for this case (structure type, vehicle class), with no invented detail? | HUMAN | not measurable by script | reviewer answers before publication |
| Does the mechanism shown (load path, spin, breach, slide) match the cited cause, step by step? | HUMAN | not measurable by script | reviewer answers before publication |
| Is the hook strong enough to stop a scroll, and is the payoff a real lesson rather than a restatement? | HUMAN | not measurable by script | reviewer answers before publication |
| Do the on-screen words read as natural English for a viewer who has not heard the narration? | HUMAN | not measurable by script | reviewer answers before publication |

## Text gate findings

- none

Contact sheet: `../../_temp/review/FR-gemini-8-1966/out/contact-sheet.png` · Scene sheet: `../../_temp/review/FR-gemini-8-1966/out/scene-sheet.png`

Subjective creative evaluation is separate (revision-history.md).
