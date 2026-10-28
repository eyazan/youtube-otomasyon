# BTO-301 V2: issues, changes, V1 vs V2, QA, benchmarks

**Same verified script and narration** (sourceHash unchanged), same evidence, same voice (Kokoro preview: Edge is still unreachable).

| File | Path |
|---|---|
| V2 storyboard | `channels/behind-the-ordinary/premium/BTO-301/storyboard.v2.json` (V1 kept as `storyboard.json`) |
| V2 final (1080×1920) | `channels/behind-the-ordinary/premium/BTO-301/out/v2/why-qr-codes-have-three-corner-squares-premium-final-v2.mp4` |
| V2 preview | `.../out/v2/why-qr-codes-have-three-corner-squares-premium-preview-v2.mp4` |
| Contact sheet / scene sheet | `.../out/v2/contact-sheet.png`, `.../out/v2/scene-sheet.png` |
| QA report | `.../out/v2/qa-report.md` |
| V1 vs V2 | `.../out/v2/compare/v1-vs-v2.mp4`, `v1-vs-v2-sheet.png`, `look-metrics.json` |
| V1 archive | `.../out/revisions/v1-final/` |

## 1. BTO issues list (owner review of V1, confirmed by inspecting V1 frames)

| # | Issue | Confirmed in V1 by |
|---|---|---|
| 1 | Similar dark backgrounds | 6 of 7 scenes on the same lamp gradient; 52% of frames have mean luma < 60 |
| 2 | Centred, static compositions | Every subject centred; the only camera motion is small push-ins |
| 3 | Slide-like scenes | S3 (title + ruler + text on dark) and S5 (title + form) read as slides; S3 static share 0.56 |
| 4 | Weak opening | Frame 0 was a flat code on a card, with no context or action |
| 5 | Transitions not meaningful enough | push/iris were generic |
| 6 | Technical explanation could be stronger | "where to look" and "how a scanner reads" were asserted, not shown |
| 7 | Labels too small for mobile | 24–30 px labels, 58 px captions; "position detection pattern" at 25 px world |
| 8 | Little cinematic variety | No perspective, depth or environment change |

## 2. Change summary (engine + direction)

### Engine (reusable, all channels)

| Change | Where |
|---|---|
| **2.5D projection engine**: perspective planes with straight edges kept straight | `page/components/projection.js` (`BTO.projector`) |
| `qr-3d`: real matrix in perspective; peel-off physics (modules lift towards the camera, spin, fade); exploded finder physically lifted with side walls; pill labels; locks, links, ghost corner; in-plane rotation for exact measurement | projection.js |
| `row-signal`: the scanner's view, built from **exact** run lengths of the real matrix rows; 1:1:3:1:1 found by module count (unit-tested) | projection.js |
| **Scene environments** `desk/spot/paper/amber/teal/scanner`, plus `envShift` | `page/motion.js` |
| **New transitions**: `decode-flash`, `square-iris`, `whip` (motion blur), coloured `scan-wipe` | motion.js |
| Readability: captions 58 → 62 px; label pills; validator warns on labels < 40 px; handle switches to ink on light scenes | style pack, motion.js, validate.js |
| Cache keys hash only the component files a storyboard uses (adding football did not invalidate BTO) | `render.js` |
| QA: tri-state **UNVERIFIED**; sample-peak and flat-factor substitutes; speech check; approved-voice row | `qa.js` |
| Versioned storyboards (`--storyboard storyboard.v2.json` → `out/v2/`, shared narration cache) | `studio.js` |

### Direction (per scene)

| Scene | V1 | V2 |
|---|---|---|
| S1 hook | flat card, modules shrink | **frame 0 = phone viewfinder locked on a real code on a tilted package**; modules peel off towards the viewer; the camera straightens; "?" corner |
| S2 | box + generic scan line | **scanner vision**: black-and-white world, a line stepping through the real rows, strip showing "WHAT THE SCANNER READS"; signatures light up; squares marked |
| S3 | dark, centred slide | **decode-flash** into bright paper; diagonal tape ruler; code stamped; camera dolly tracks the ruler and drops to "Quick Response" |
| S4 | 2D iso stack, cropped zoom | spotlit **perspective orbit**; finder physically lifts into 3 labelled layers; collapse; read sweep |
| S5 | dark form, iris | **square-iris** (the square opens into the form); teal; the camera follows the template search; quote pinned and underlined |
| S6 | dark, items pop in | **whip** pan; full amber; prints thrown onto the table from three sides; strip on a paper panel, 76 px numbers |
| S7 | flat rotation | lights go down mid-scene (`envShift`); exact rotation demo; then the code **tilts back onto its package with the viewfinder**, so the last frame is the first |

## 3. V1 vs V2 (measured on the two final MP4s)

| Metric | V1 | V2 |
|---|---|---|
| Frames with mean luma < 60 ("dark") | **52%** | **2%** |
| Frames with mean luma > 140 ("bright") | 0% | 40% |
| Distinct background colours (border, quantised) | 4 | 12 |
| Luma variation across the video (std) | 25.3 | 52.7 |
| Mean frame-to-frame motion (4 fps proxy) | 7.96 | 12.87 |
| Longest static hold inside a scene | 1.3 s (S3) | 0.9 s (S5) |
| S3 static share | 0.56 | 0.10 |
| Environments / distinct transitions | 1 / 4 | 6 / 6 |
| Smallest label (screen px) | 30 | 30 (chips); labels 40–56; captions 62 |
| Caption sync (cues after a pause) | max 8 ms | max 42 ms |
| Hard QA | PASS | PASS (1 UNVERIFIED, substitutes measured) |

**Honest assessment.** V2 fixes issues 1–8 for S1–S4 and S7. **S5 and S6 keep V1's layout**: the improvement there is palette, camera and transition, not a new idea. They are the next candidates for redesign. Audio has not been listened to.

## 4. Updated QA findings (V2 final, `out/v2/qa-report.md`)

| Result | Checks |
|---|---|
| PASS | resolution, fps, codec, decode, duration 31.6 s, black frames, freezes, sample peak −1.89 dBFS, flat factor 0, −14.1 LUFS, −1.8 dBTP, A/V match, caption layout, captions in video, loop (0.63), first word 0.00 s, caption sync (max 42 ms), **speech check**, text gate (0 FAIL / 0 WARN), min text 30 px, static hold < 1.5 s, scene similarity ≤ 0.668, **QR decodes** first and last frame, determinism |
| WARN | caption reading speed (23.8 chars/s, estimated Kokoro timing); narration voice not approved (preview fallback) |
| UNVERIFIED | audio samples clipped (not reported by this FFmpeg build) |

During V2 the QA blocked three real defects that the stills review had missed. Each was fixed at the cause:

1. text leaving the frame during a match-zoom;
2. quote lines too tight for the serif's bounding box;
3. a 27-char caption line.

## 5. Rendering benchmarks (4-vCPU Linux container, Chromium 1194)

| Run | Frames | Wall | ms/frame | Peak RSS |
|---|---|---|---|---|
| V1 final, cold, 3 workers | 948 | 146.9 s | 155 | 3.9 GB |
| V2 preview, cold, 3 workers | 948 | 109–111 s | 115–117 | 2.5–2.6 GB |
| V2 final, cold, 3 workers | 948 | 120 s | 126.6 | 4.0 GB |
| V2 preview, 2 scenes changed (5/7 cached) | 337 | 38.7 s | 115 | 2.2 GB |
| GoalLore Lab design sample, 1 worker | 210 | 25.1 s | 120 | – |

V2 rendered faster than V1 despite more motion. That was not profiled per stage; a likely cause is that the flat scanner, paper and amber scenes are cheaper to rasterise than V1's large blurred shadows. The full V2 pipeline (render + audio + QA + package) took 177 s cold. Cost was $0 (no LLM; local render; offline TTS).
