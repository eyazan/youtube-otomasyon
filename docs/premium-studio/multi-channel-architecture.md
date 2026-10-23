# Shared premium video engine: multi-channel architecture

**Goal:** one engine with per-channel profiles, not separate engines per channel.

**Status labels used below:**
- **IMPLEMENTED**: code that runs and is tested
- **DESIGN**: specified here, not built
- **EXISTING**: reused from the repository

## Strategic portfolio and current state

| Channel | Registry | Premium today | Rollout stage |
|---|---|---|---|
| Failure Reconstructed | enabled | own offline-review engine `scripts/fr-premium` (EXISTING) | 4: migrate onto the shared studio |
| ImpossibleBrief | enabled | none (`premium-policy.json`: not-available) | 5 |
| The Hidden Logic of Things | disabled (owner, 2026-10-11) | shared studio, preview (IMPLEMENTED) | 1–3 |
| GoalLore Lab | **not registered** (proposed) | design profile + `football-pitch` component + design sample (IMPLEMENTED); no topics verified | 6 |
| CriticalThread | **enabled, live** (38 workflow references) | none | Strategic replacement by GoalLore Lab is a **separate migration decision**. Nothing about CriticalThread was changed. |

## Layers (one engine)

| # | Responsibility | Module | Status |
|---|---|---|---|
| 1 | Channel profile | `scripts/bto-studio/profiles/<channel>.json`: premium mode, style pack, components, evidence policy, narration, quality, publishing | IMPLEMENTED (4 profiles; studio routes and refuses by profile) |
| 2 | Script adapter | `adapter.js`: topic → narration script + fact ids; readiness (VERIFIED, productionReady, verbatim quotes, unpublished) | IMPLEMENTED (needs a registered channel; GoalLore Lab is unregistered) |
| 3 | Evidence validator | `validate.js` + `schemas/storyboard.schema.json`: numbers on screen from cited facts, verbatim quotes, conceptual marking, coverage, craft rules | IMPLEMENTED (schema channel enum still BTO-only; widen per channel at its rollout) |
| 4 | Storyboard planner / creative director | `storyboard.js` (deterministic draft; budget-guarded Claude draft) + `/visual-director`, `/cinematic-composition` Skills | IMPLEMENTED (drafts); direction is human/Claude-in-the-loop |
| 5 | Motion design engine | `page/motion.js`: easing, springs, anchors, camera, environments, transitions, captions | IMPLEMENTED |
| 6 | Technical animation engine | `page/components/projection.js` (2.5D), `matrix-code.js`, `core.js` | IMPLEMENTED for BTO's needs |
| 6b | Football components | `page/components/football.js`: `football-pitch` | IMPLEMENTED (design sample only) |
| 7 | Asset selection | Generated assets (`tools/qr_matrix.py` + decode check). Licensed stills: reuse the existing `core/rendering` licensed-still pipeline. | PARTIAL (no licensed-media layer in the studio yet) |
| 8 | Audio director | `narrate.js` (approved voice → preview fallback), `audio/sound_design.py`, `scripts/fr-premium/mix-audio.js` | IMPLEMENTED |
| 9 | Renderer | `render.js`: deterministic, scene-cached, parallel, resumable | IMPLEMENTED |
| 10 | Automated QA | `qa.js` (+ `qa-vertical.js`, `text-qa.js`, `lib/speech-check.js`) | IMPLEMENTED |
| 11 | Publishing gate | `lifecycle.js` guards + `package.js` verdict. Hand-off to the existing uploader is DESIGN (integration-plan Phase 2). | PARTIAL |
| 12 | Analytics feedback | EXISTING growth/analytics per channel (`growth.js`, `channels/<c>/analytics`). Premium-specific feedback is DESIGN: tag uploads with `storyboardVersion`, components and transitions; compare retention per component. | DESIGN |

## What stays per channel (never shared)

- **Identity:** `channels/<c>/brand.json`, handle, chips.
- **Content rules and topic inventory:** `channels/<c>/config.json`, `channels/<c>/topics/`.
- **Narration profile:** `config.voice` (approved voice) plus the preview fallback policy.
- **Visual style:** `channels/<c>/premium/style-pack.json` (palette, type, motion tokens, zones, rules).
- **Quality criteria:** profile `quality` plus `config.qualityThresholds`.
- **Publishing settings:** registry and config (`enabled`, schedule, credentials prefix). The studio never reads credentials.
- **Analytics history:** `channels/<c>/analytics`, `state/`.

## Channel visual profiles (summary; full files in `scripts/bto-studio/profiles/`)

| Channel | Profile |
|---|---|
| **Failure Reconstructed** | failure-chain storytelling; exploded technical diagrams; chronology; a hook that shows the consequence or critical fault first; archival media with provenance chips. Studio components to bring over: projection engine, labels, scan/measurement. To build: `failure-chain`, load gauges, fracture propagation. |
| **ImpossibleBrief** | scale comparisons; closed-form simulations; cinematic science; **FACT vs PROJECTION** chip on every frame; each projection cites its assumption. To build: `scale-ladder`, `orbit-simulation`, `projection-band`. |
| **The Hidden Logic of Things** | cross-sections; mechanisms; exploded product views (2.5D); clean labels; sensor and scanner points of view; printed-matter environments. |
| **GoalLore Lab** | story first; tactical pitches; tokens, not likenesses; real ball physics; passing networks; career timelines; cited stats; stadium storytelling; **no broadcast footage**; WHAT IF chip on hypotheticals. |

## Migration path (no big-bang rewrite)

1. **Rename later, not now.** `scripts/bto-studio` is already channel-neutral in code. Rename it to `scripts/premium-studio` when a second channel renders, with a shim, so Skills and docs keep working.
2. **Widen the schema channel enum and the profile routing per channel** at its stage, each with its own tests.
3. **FR:** wrap FR's evidence/assets JSON in the studio adapter; port FR templates as components, or keep FR's renderer behind the profile until parity is shown on one FR remake.
