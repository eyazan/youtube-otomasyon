---
name: technical-animation
description: Design accurate technical animation for everyday-object explainers in the BTO premium studio - cross-sections, exploded views, mechanisms, forces, flows, cause and effect - matched to the verified research, with conceptual geometry clearly labelled. Use when a BTO scene must show how something works inside.
allowed-tools: Read Grep Glob Edit Write Bash(node scripts/bto-studio/*) Bash(BTO_PREMIUM_RENDER=preview node scripts/bto-studio/*) Bash(python3 -I scripts/bto-studio/tools/*)
---

# Technical Animation

## Accuracy first
1. List what the evidence (facts with verbatim quotes) actually establishes about the mechanism: parts, order of events, cause and effect, numbers.
2. Classify each drawn element:
   - **exact**: geometry from a real source or generator, e.g. the QR matrix from `tools/qr_matrix.py`, decoded back in QA;
   - **evidenced**: stated in a cited fact;
   - **conceptual**: needed for clarity but not documented. Mark the scene `conceptual: true` and add the `conceptualLabel` chip.
3. Never invent precise dimensions, tolerances, part counts or speeds. If geometry is unknown, simplify the shape and label it conceptual. Do not draw a detailed-looking guess.
4. Write the risks into `treatment.factualRisks`.

## Available technical components (`scripts/bto-studio/page/components/`)
- `qr-3d` (projection.js): exact matrix code on a perspective plane (`BTO.projector`): peel-off/assemble physics, read sweep, a physically lifted exploded finder with side walls and pill labels, locks, ghost corner, in-plane rotation for exact measurements. Keep `rx = 0` while measuring anything.
- `row-signal` (projection.js): the scanner's view; exact run lengths of the real matrix rows and exact 1:1:3:1:1 detection.
- `football-pitch` (football.js): IFAB Law 1 pitch in true proportion, projected; player tokens, passes, parabolic ball flights with shadows.
- `qr-symbol`: an exact matrix code; dissolve, assemble, read sweep, finder highlight, lock brackets, links, ghost corner, an exploded finder, rotation. It publishes exact geometry (`BTO.geo`) and run lengths (`BTO.runsFrom`).
- `exploded-layers` / `BTO.isoStack`: planar layers lifting into an isometric stack, for cross-section and layer reveals.
- `scan-line`, `run-length-strip`: measurement along a line, with ratio labels.
- `search-window`: template matching over candidate features (conceptual).
- `print-surface`: procedural printed matter (box, flyer, magazine, form, label).

Planned next (see `docs/premium-studio/components.md`): `gear-train`, `flow-field` (air/fluid), `pressure-vessel`, `circuit-path`, `force-arrows`, `optical-path`. Build each when a production needs it, generic and props-driven.

## Showing a mechanism
State 0 → cause → internal change → effect → resolved state, each on a spoken anchor. Show cause and effect in the same frame (no cut between them). Use teal for the second state, amber for the active part and coral only for a failed or rejected candidate.
