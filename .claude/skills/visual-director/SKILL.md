---
name: visual-director
description: Turn an existing, fact-checked BTO (The Hidden Logic of Things) narration into a directed, schema-valid storyboard - educational objective, visual hook, mechanisms to animate, per-scene purpose, composition, camera, transitions, evidence citations and factual risks. Use before rendering a premium BTO video or when revising its scene plan.
argument-hint: <BTO-id>
allowed-tools: Read Grep Glob Edit Write Bash(node scripts/bto-studio/*) Bash(BTO_PREMIUM_RENDER=preview node scripts/bto-studio/*)
---

# Visual Director

Topic: `$ARGUMENTS`. Output: `channels/behind-the-ordinary/premium/<id>/storyboard.json` (schema `scripts/bto-studio/schemas/storyboard.schema.json`).

## Inputs (read, never edit)
- `channels/behind-the-ordinary/premium/<id>/out/studio-script.json`: narration lines `L1..Ln` and facts `F1..Fn` with verbatim quotes. Generate it with a studio run, or with `scripts/bto-studio/adapter.js`.
- `out/narration/timeline.json`: word times. Anchors such as `L3:QR#2` and `L5:least-0.05` follow the voice automatically.
- `channels/behind-the-ordinary/premium/style-pack.json`.

## Method
1. **Treatment.** State the one understanding the viewer must leave with. Choose the mechanism(s) only animation can show. Design frame 0: the real object plus the unexpected detail, and no branded intro. Plant something early that the payoff resolves.
2. **Scenes.** One scene per idea; a line may span scenes and a scene may hold lines, in order. Each scene gets:
   - a `visualPurpose`: what the viewer *sees* that the narration alone cannot give;
   - `evidence` fact ids;
   - a camera with eased keys (push in on detail, pull out to context; at most one move per beat);
   - 2–3 internal state changes, keeping the visual change interval at 1.5–3 s.
3. **Transitions** carry meaning:
   - `continuity`: the same object persists;
   - `match-zoom`: dive into a detail;
   - `push`: a new topic;
   - `scan-wipe`: reading or scanning;
   - `iris`: focus on one element.

   Never repeat one twice in a row; at most one `dissolve`.
4. **Text.** Captions carry the narration. On-screen text is labels of 6 words or fewer, a year, a ratio, or a verbatim quote card. When a headline or quote repeats the narration, add a `captionsOff` window so it is never on screen twice.
5. **Factual guardrails.**
   - Numbers on screen must appear in a cited fact.
   - Quotes must be verbatim (`quoteOf`).
   - Geometry not in the evidence is drawn as `conceptual: true` with the `conceptualLabel` chip.
   - List every factual risk in `treatment.factualRisks`.
6. **Validate**: `BTO_PREMIUM_RENDER=preview node scripts/bto-studio/studio.js --channel behind-the-ordinary --topic <id> --stills 0` runs validation and one still. Fix every error before rendering.

7. **Audit**: `node scripts/bto-studio/creative-director.js audit --channel <c> --topic <id> --storyboard <file>`; treat every flag as a question (a deliberate continuity shot is marked with `envShift` or explained in `visualPurpose`), not a score.

Technique variety: each beat picks its own technique (`creative-director.js plan`): real object or licensed photo (`image-plate`, asset registry only), cross-section, exploded 2.5D, technical diagram, physics model, data comparison (`signature-compare`, `signature-ledger`), documentary timeline, tactical pitch, stadium. Kinetic type never carries a scene alone.

Worked examples: `channels/behind-the-ordinary/premium/BTO-301/storyboard.json` (V1), `storyboard.v2.json`, `storyboard.v3.json` (real CC0 photo hook, signature comparison, loop to the photo).
