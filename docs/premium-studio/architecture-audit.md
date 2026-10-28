# Premium Studio — Architecture Audit (The Hidden Logic of Things)

Audit date: 2026-10-19 · Branch: working tree on `main` @ `2058954` (uncommitted) · Auditor: Claude Code session

Everything below was observed in the local checkout or measured in this session's Linux container. Nothing is inferred from file names alone. Where something could not be checked, the reason is given.

## 1. Topic and research inventory (`channels/behind-the-ordinary/`)

| Measure | Value | Source |
|---|---|---|
| Topics in the universe | 525 (105 in each of 5 pillars) | `topics/topic-universe.json` `stats` |
| `researchStatus: VERIFIED` | **5** | same |
| `NEEDS_PRIMARY_SOURCE` | 2 (BTO-040 shopping cart, BTO-226 barcode bars) | same |
| `QUESTION_ONLY` (research backlog) | 518 | same |
| Topics with a finished narration (`narration[]`) | 7 | same |
| Topics with verbatim-quote facts (`facts[].quote`) | 7 | same; quotes checked by `scripts/ib-ct-library/build.js` per `research-seeds/launch-batch-1.json` |
| Topics declaring `explainerScenes` | 3 (BTO-017, BTO-256, BTO-301) | same |

**Publication state** (`state/published.json`, `state/generated.json`): BTO-135 (road studs; later replaced), BTO-016 (tiny pocket), BTO-256 (Bluetooth, twice), BTO-017 (rivets). All of them were uploaded **private + scheduled**.

**Ready and unpublished:** only **BTO-301 `why-qr-codes-have-three-corner-squares`**, which is:

- VERIFIED and `productionReady`;
- has 11 facts with verbatim quotes (9 from DENSO WAVE *History of QR Code*, the inventor's own page, and 2 from Wikipedia);
- has a 7-line narration of 78 words;
- passed the existing quality gate in dry run (`reports/dry-runs/…/quality-gate.json`: PUBLISH 94).

It is also a physical/optical mechanism (scan-line ratio geometry) that animation explains far better than narration. **It is the pilot topic.**

**Channel status:** `config/channels.json` has `behind-the-ordinary.enabled = false`, an owner decision of 2026-10-11 enforced by `tests/js/bto-inactive.test.js`. BTO has **no scheduled automation**. Publishing is only possible through the manual `bto-publish-short.yml` dispatch.

## 2. Production entry points

| Path | Role | BTO use |
|---|---|---|
| `e2e-behind-the-ordinary.js` → `core/rendering/index.js#buildPackage` | Topic → script → narration → visuals → `renderVideo` (FFmpeg filtergraph) → package | Dry runs (`npm run test:behind-the-ordinary`) |
| `scripts/bto-publish-short.js` (via `bto-publish-short.yml`, manual only) | Same render + all gates + private upload | Manual publication |
| `core/rendering/explainers.js` + `channels/behind-the-ordinary/explainer/render_explainer.py` | Pillow 2D explainer clips (`glyph-merge, unite, name-card, shortlist, diagram, timeline, qr-finder`), cached by spec hash, cut into the FFmpeg timeline | BTO explainer shots |
| `shorts-yap.js` | Legacy FR/IB Shorts maker from `uretim/<job>/konu.json` (archival/stock clips + kinetic captions) | Not the BTO path |
| `video-yap.js` | Legacy long-form FFmpeg builder | Not the BTO path |
| `scripts/fr-premium/*` | Premium Shorts engine v1 (FR only; see §5) | `premium-policy.json` marks BTO `not-available` |
| `scripts/profitdecoded/motion/*` | ProfitDecoded Chromium motion renderer + OFL font embedding (`fonts.js`) | Fonts reused by FR premium |

## 3. Existing animation components

- **BTO Pillow explainers** (`render_explainer.py`, 421 lines):
  - drawn at 2× supersampling with smoothstep easing only;
  - a single fixed composition (`CY = 680`);
  - no camera, no spring/overshoot, no parallax, no per-word sync;
  - each clip is time-stretched to its shot length (`lead + frame/FPS*(T-lead)/T`), so beats do not land on spoken words.
- **FR premium library** (`fr-lib.js`, `fr-forensic.js`, `engine/templates/*`):
  - pure function of *t*;
  - word-anchored timing (`FR.Wd`);
  - cubic/sine/back easing;
  - callouts, rings, captions with word highlight;
  - crossfades with sequenced HUD text;
  - text inspection (`FR.inspectText`).

  The templates (`joint-section`, `document-desk`, `archival-plate` …) and the palette, handle and chips are Failure-Reconstructed-specific: forensic, archival, NASA.
- **ProfitDecoded motion** (`brand-lib.js`, `spec-scenes.js`): a spec-driven scene renderer with its own brand.

## 4. Current rendering limitations (BTO)

1. The explainer clips are rendered independently and time-stretched, so animation beats are not tied to spoken words. Only the line start is aligned (claim-timed takes).
2. **The only motion vocabulary is 2D Pillow.** There are no springs, camera moves, depth, kinetic typography or transition choreography; every scene is a centred card on the same charcoal field.
3. **Licensed-still shots** (2 of 8 shots for BTO-301) depend on Wikimedia/Openverse search and a visual pre-check. BTO-256 was blocked once with "2 licensed pictures/clips < 4".
4. **There is no scene-level QA.** The existing gate scores metadata, evidence and storyboard coverage. It does not look at rendered frames (no contact sheet, text-collision or motion analysis on BTO).
5. Fonts are system fallbacks (`DIN Alternate`/`Arial` on the Mac, `DejaVu Sans` on Linux). A Mac render and a CI render therefore differ.

## 5. Premium Shorts Engine v1 (reviewed)

**Reused as is** (imported or invoked, never copied):

| What | Where | Notes |
|---|---|---|
| Deterministic capture loop | `render-vertical.js` | Page = pure function of *t*; CDP `Page.captureScreenshot optimizeForSpeed`; PNG pipe to x264. Documented at 0.09 s/frame on M1. |
| Narration with measured word boundaries | `narrate-edge.js` | Edge TTS. |
| Mix and master | `mix-audio.js` | Narration levelled, SFX stem side-chain-ducked, −14 LUFS, limiter at −1 dBTP. |
| Technical QA | `qa-vertical.js` `qa()` | Black frames, freezes, loudness, clipping, A/V match, loop continuity, caption sync. |
| Text gate | `text-qa.js` | Collision, caption band, edge margin, minimum font size, Shorts UI zones. |
| Fonts | `fonts.js` | Exact-pinned OFL @fontsource faces, licence-checked, embedded as data URIs. |
| Kokoro preview voice | `lib/shorts-tts.js` `kokoroLines` + `scripts/kokoro_lines.py` | Same pinned `kokoro-onnx==0.6.1` model with sha256 checks. |

**Not reused:**

- FR channel pack, templates, palette, `@FailureReconstructed` handle, provenance chips and forensic layers;
- `premium-contract.js` approvals: FR-specific remake rules. BTO gets its own contract file.

**Isolation rule kept:** `tests/js/fr-premium-contract.test.js` forbids any workflow, root `.js` production script or channel config from referencing the premium engine. The BTO studio follows the same rule and adds its own isolation test.

## 6. Performance benchmarks found

| Benchmark | Value | Source |
|---|---|---|
| FR premium | 1,668 frames in 154 s on an M1 (0.09 s/frame), lossless capture | `docs/premium/README.md` |
| TTS | Benchmarks under `benchmarks/tts` | `scripts/tts-benchmark.js` |

There was no BTO render benchmark. This session adds one (see `benchmarks.md`).

## 7. Dependencies and licences

| Dependency | Version | Licence | Use |
|---|---|---|---|
| `playwright-core` | 1.56.1 (dev) | Apache-2.0 | Headless Chromium driver |
| `msedge-tts` | 2.1.0 | MIT | Free Edge TTS endpoint |
| `@anthropic-ai/sdk` | 0.115.0 | MIT | Optional LLM planning |
| `@fontsource/inter`, `source-serif-4`, `barlow-semi-condensed` | 5.3.0 | SIL OFL 1.1 (checked at runtime) | Fonts |
| FFmpeg | 6.1.1 here (system) | LGPL/GPL build | Encode, mux, analysis |
| Python Pillow | 12.3, numpy 2.5 | HPND / BSD | Existing explainers; analysis |
| `kokoro-onnx` 0.6.1 + Kokoro-82M v1.0 | — | MIT / Apache-2.0 | Offline fallback, preview only |

**Evaluated and not adopted** (§8): Remotion, GSAP, Three.js.

## 8. Rendering architecture evaluation

| Option | Finding | Decision |
|---|---|---|
| Existing Chromium deterministic renderer (FR premium) | Already in the repo, proven on M1, frame-exact, SVG+HTML, fonts embedded, no licence cost. Its weakness is one serial page with no caching or scene split. | **Base**: extend with scene-level caching, bounded parallel workers and resume. |
| Existing FFmpeg pipeline (`core/rendering`) | Good packaging and encode; limited to filtergraph motion and Pillow clips. | Kept for the normal pipeline; used as engine **A** in the comparison. |
| Remotion | React compositions, `spring()`/`interpolate()`, excellent DX. The licence is free for individuals and companies of up to 3 employees; 4+ need a paid Company License ([remotion.dev/license](https://remotion.dev/license), [LICENSE.md](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md)). It would add a React/bundler toolchain that duplicates the existing capture loop. `remotion.dev` was unreachable from this container (proxy DNS). | **Not adopted.** Its useful ideas (frame = f(t), closed-form spring, interpolate with clamping, sequences) are implemented natively in `motion.js`. Revisit only if a React component ecosystem becomes necessary. |
| GSAP | High-quality easing and timelines, but built around wall-clock tweening; deterministic seeking is possible yet adds a layer we don't need. | Not adopted. Cubic-bézier easing (CSS-equivalent solver) and closed-form springs are implemented in ~60 lines. |
| Three.js | Real 3D. The QR pilot is planar; the BTO style values 2D clarity. | Not adopted for the pilot. The component registry can host a WebGL component later. In headless Chromium WebGL uses SwiftShader (slow), so measure before use. |
| Canvas 2D | Fast raster, weaker text metrics and inspection. | Not needed; SVG + HTML keeps text inspectable for QA. |

## 9. Compatibility requirements (must not change)

- No workflow, schedule, channel config, voice approval or publishing code is modified.
- `config/channels.json` keeps BTO `enabled: false`.
- The studio is **opt-in**: `BTO_PREMIUM_RENDER=preview` (the default and only mode accepted today). `final` renders 1080×1920 but still writes only to `channels/behind-the-ordinary/premium/<topic>/out/`, never to `reports/packages`, `uretim/` or state files.
- Topic data is read-only: the studio never edits `topic-universe.json` or the narration.
- The approved voice is Edge `en-US-EmmaMultilingualNeural +1%`. If Edge is unreachable, preview mode may use the repo's pinned Kokoro fallback, recorded as `approved: false`. Such an output is never review-ready for publishing.

## 10. Environment limitations observed in this session

| Limitation | Effect |
|---|---|
| Edge TTS host `api.msedgeservices.com`: `CONNECT 403` from the session proxy | The approved Emma voice cannot be synthesised here. The pilot is narrated with Kokoro `af_heart` (preview only). Re-narrate on the Mac with `--voice edge` before any review for publishing. |
| `movez.substack.com`, `x.com`, `remotion.dev`: DNS blocked | The two reference articles **were not read**. Their contents are not summarised anywhere in this work. |
| Container hardware | Linux x86-64, 4 vCPU, 15 GB RAM (not the M1). Benchmarks are labelled with the machine they ran on. |
