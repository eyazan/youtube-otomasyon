# Engine comparison: BTO-301 rendered by both engines

Same topic, same narration text, same preview voice (Kokoro `af_heart`, because Edge was blocked from the container), same machine: Linux x86-64, 4 vCPU, 16 GB. Produced by `npm run premium:compare` (`scripts/bto-studio/compare.js`); measured on 2026-10-19.

- **A**: the existing production renderer, `core/rendering#buildPackage`, exactly as `e2e-behind-the-ordinary.js` runs it: FFmpeg filtergraph, Pillow explainer clips, licensed stills. It rendered into `premium/BTO-301/out/compare/engine-a/`, with `recordState: false` and nothing uploaded. Its fallback voice was set in memory only.
- **B**: the new premium studio (`scripts/bto-studio`).

## Artefacts

| What | Path |
|---|---|
| Side-by-side MP4 (B left, A right; B's soundtrack) | `channels/behind-the-ordinary/premium/BTO-301/out/compare/side-by-side.mp4` |
| Side-by-side sheet (every 2 s) | `channels/behind-the-ordinary/premium/BTO-301/out/compare/side-by-side-sheet.png` |
| Raw numbers | `channels/behind-the-ordinary/premium/BTO-301/out/compare/comparison.json` |

## Measured

| | A: existing | B: premium studio |
|---|---|---|
| Output | 1080×1920, 30 fps, H.264 + AAC, 30.4 s | 1080×1920, 30 fps, H.264 + AAC, 31.6 s |
| Shots / scenes | 7 shots: 1 licensed still + 6 Pillow explainers | 7 scenes, 12 component types, 4 distinct transitions + 2 continuity cuts |
| Whole-video static share (frames with mean abs luma change < 0.5) | **0.82** | **0.57** |
| Mean frame-to-frame change | 0.75 | 2.55 |
| Longest static run | 2.0 s (frozen 24.7–26.7 s) | 1.5 s; longest within a scene 1.3 s |
| Loop continuity, last → first frame (MAD) | 79.1 (hard cut) | 0.78 (seamless) |
| Loudness / true peak | −14.5 LUFS / −4.1 dBTP | −14.1 LUFS / −1.8 dBTP |
| Premium QA hard checks (`qa-vertical.js`) | FAIL: freeze ≥ 2 s; loop cut | PASS |
| Existing production gate (`quality-gate.json`, earlier dry run) | PUBLISH 94 | n/a (B goes through its own contract) |
| Animation beats tied to spoken words | line start only (clips are time-stretched) | every beat anchored to a word (`L5:least`) |
| Sound effects synchronised to motion | music bed + generic cues | 94 cues emitted by the components at their own motion times |
| On-screen code decodes | not checked | yes, first and last frame (`HIDDEN LOGIC`) |
| Render wall time (cold) | 215 s (whole package, incl. narration) | 147 s render (3 workers) + 28 s narration + ~45 s audio/QA |
| Peak memory | 839 MB | 3.9 GB at 1080p with 3 workers; ~2.0 GB with 1 worker |
| Incremental re-render | none (whole video) | per scene: one-scene edit 33 s (final) / 51 s for 2 scenes (preview) |
| Cost | $0 | $0 (no LLM call; local render; free/offline TTS) |
| Reusable component coverage | 7 Pillow kinds | 15 generic components + runtime, plus style pack, validator, QA |

## What the side-by-side shows (looked at, not inferred)

**A's real strengths:**
- It opens on a real photograph of a QR code on a product.
- Its `qr-finder` explainers are clean.
- It already shows the 1:1:3:1:1 stripe and a rotated code labelled "found at any angle".

The pilot topic's idea was already partly visualised in production.

**Where B adds explanatory value:**
1. The **data modules drop away** in the first second, so "not decoration" is *seen*. A's hook frame is a branded soft-drink can, so a third-party trademark appears on screen.
2. A reader's scan line sweeps a package and **locks onto exactly three squares**.
3. One pattern **lifts into its three layers** (exact geometry from the encoder), then the data is **read in a sweep**.
4. A template search over a business form **rejects every square-ish feature**, and the verbatim quote card underlines "least likely" as it is spoken.
5. Printed matter becomes **run-length strips** under a scan line; then the corner pattern measures 1:1:3:1:1.
6. **Payoff:** the code turns −33° → +27° while the strip under the scan line changes total length but keeps exactly 1:1:3:1:1, computed from exact geometry. The empty fourth corner planted in the hook is resolved, and the code snaps upright into a seamless loop.

A uses large dark frames with centred text for the name cards (1994 / DENSO WAVE / QR = Quick Response, "Why squares?" / "least likely to appear"). B gives those beats motion: a ruler that lands on 1994, letters that unfold, a search.

## Verdict

B is a genuine improvement in explanatory animation, motion density, sync, continuity and measured technical QA. A remains cheaper in memory and has the authenticity of a real photo.

**Recommendation:** keep B's drawn mechanism scenes and consider one licensed real-object plate in B's hook (open item 4 in `revision-history.md`).

Engine A's numbers come from the premium QA instrument, which is stricter than A's own production gate. A is not broken; it was simply not built to meet these thresholds.
