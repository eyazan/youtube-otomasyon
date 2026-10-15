# Apollo 13 engineering sequence: round 3 (root cause, render performance, anchor calibration), 2026-10-15

**What was rendered:** scene-level clips only (S02–S05, film time 5.26–27.91 s, 680 frames).

**Not done:** no full render, no publication, no merge, no workflow, voice, schedule or Cloudflare change, no paid API.

**Thresholds:** unchanged.

**Comparisons:** V1 = `8ff6ae20`, V2 = `36fec0bc`, V3 = this round. All three were rendered from their own code, on the same machine (Apple M1), with the same frames and encoder settings (1080×1920, 30 fps, libx264 slow, CRF 17).

## 1. Creative root cause: why the sequence still feels flat

| Factor | Finding (from stills, frame differences and the QA data) |
|---|---|
| **Camera continuity (bug)** | V2 computed its drift (5% push plus lateral pan) **per shot**, so it reset at every line boundary inside one continuous scene. The result was a visible zoom pop and a sideways jump at each cut. Frame-to-frame difference at the boundaries: V1 3.0–3.9, **V2 10.4–11.5** (about 30× the clip median). QA boundary correlation: V1 0.96 / 0.97 / 0.89, V2 0.74 / 0.69 / 0.74. V1 had the same bug with a smaller drift. |
| **Subject scale** | The documented state changes cover too little of the screen: a switch contact, a value mark, a sheath segment. Their measured residual peaks are 0.16–0.28 on a 0–255 scale in every version. The framing is limited by the band height: the switch housing fits at about 2×, so the 3× zoom cap rarely binds. |
| **Information density** | V2 showed up to 5–7 text items besides the caption: chip, disclosure line, two part labels, meter tags, value pills and a date stamp. That flattened the hierarchy. |
| **Motion timing** | V2 moved the camera in the first 0.8 s of each line, then held. S03's motion fell from 0.26 to 0.22 because its only state, the 28 V mark, came late on a held frame. |
| **Archival-to-diagram transition** | The plates are unmarked and unregistered (no verified geometry), so the dissolve cannot connect the drawing to the model spatially. |
| **Materials** | Adequate, and not the bottleneck. |
| **S07** | It did **not** materially lose motion (V1 0.21 → V2 0.20). It is a held document card by design, and its empty share improved from 77% to 46% in V2. |

**Smallest high-leverage set:**
1. Scene-continuous camera drift.
2. Camera moves that settle before the cue, never during a state change, and never cross into the next line.
3. A text budget (the chip doubles as the disclosure; one label at a time).
4. Label placement that avoids other parts.
5. Faster capture.

**The real ceiling** is the conceptual schematic itself. Without verified drawing geometry the mechanism stays a few small glyphs on a large plate (§7).

## 2. Changes kept (all reusable, no topic code)

**Camera** (`component-section` + planner):
- the drift runs on the scene span (`scene.span`), monotonic across the scene's shots;
- each line's move settles at least 0.6 s before its first spoken cue;
- if there is no room for that, the camera waits until the state has read (cue + 0.9 s) and moves after it;
- no move crosses into the next line (tested).

**Text:**
- in conceptual mode the chip shows the disclosure ("Conceptual · not to scale"), so the separate line is gone;
- one part label at a time, chosen as the part whose documented state changed last (a layer such as the insulation names itself);
- "ESTIMATE" / "REPORT" / "MEASURED" badges on meter values come from each claim's evidence kind, so estimates are distinguished from facts.

**Labels:** candidate positions around the part (above, below, inside the top) × (centred, left-aligned, right-aligned). The first position that crosses no other part wins.

**Renderer (`render-vertical.js`):**
- lossless fast capture by default (§3);
- `--profile` per-frame timing;
- a GIF media fix: drawings convert their first frame only. A fresh work directory used to fail on the multi-frame GIF and only "worked" from a leftover file.

**Reverted as cosmetic:** a plate-to-model "push-through" zoom. It added code with no measured benefit.

## 3. Render performance (identical machine, frames and encoder)

**Profile** (V2, 90-frame ranges): about 93% of render time is the **screenshot**, that is, paint plus PNG encoding. Scene build is about 1 ms per frame; the scene-to-page step is about 2–3 ms.

**Ablations** (seconds for 90 frames):

| Ablation | Effect |
|---|---|
| SVG drop shadows removed | 23.7 → 23.0 |
| Heat-glow blur removed | → 22.6 |
| Both removed | → 22.7 (within noise) |
| Plate CSS blur removed | 31.8 → 27.6 |
| Plate drop shadow removed | → 27.8 |

The plate filters affect plate frames only. **Effects are not the cost.** V2 was slower than V1 because richer frames (gradients, grid, blurred photo) take longer to compress as PNG.

**Fix:** capture through Chrome's speed-optimized PNG encoder (CDP `optimizeForSpeed`). It is lossless.

| Full component clip (680 frames) | Wall time |
|---|---|
| V1 code (Playwright capture) | 100.7 s |
| V2 code (Playwright capture) | 186.4 s |
| V3 code, `--capture playwright` | 185.0 s |
| **V3 code, default fast capture** | **64.9–69.1 s** (three runs) |

**Same pixels:** the V3 fast and Playwright captures produce **680 / 680 bit-identical decoded frames** (framemd5). This is a **2.7–2.9× speed-up with no quality change**, and V3 renders faster than V1 despite richer frames. The per-frame screenshot cost is about 90 ms (fast) vs about 270 ms.

## 4. QA: V1 / V2 / V3 at the same timestamps

| Metric (limit) | V1 | V2 | V3 |
|---|---|---|---|
| Empty background, time-weighted (≤ 35%) | 68% | 56% | 59.5% |
| Subject motion S02 / S03 / S04 / S05 (≥ 0.25) | 0.15 / 0.26 / 0.08 / 0.27 | 0.47 / **0.22** / 0.12 / 0.32 | 0.45 / **0.26** / 0.10 / 0.33 |
| States "verified" by creative QA | 1/6 | 3/7 | 1/7 |
| Boundary correlation S03 / S04 / S05 | 0.96 / 0.97 / 0.89 | 0.74 / 0.69 / 0.74 | **1.00 / 0.995 / 0.997** |
| Max frame difference at line cuts | 3.0–3.9 | 10.4–11.5 | **0.66–2.1** |
| Non-caption words on screen (S02) | — | 20 | 14 |
| Text tiers / labels at once (S02) | — | 5 / 5 | 4 / 3 |
| Text gate | — | PASS | **PASS (0 / 0)** |
| Slide-like shots | 2 | 2 | 1 |
| Render, 680 frames | 100.7 s | 186.4 s | **≈ 65–69 s** |

**How to read the "states verified" row.** It is relative: a peak must reach 1.5× the shot's mean residual. Absolute peaks, V2 → V3:
- 28 V rating: 0.21 → 0.18;
- 80°F threshold: 0.28 → 0.22;
- 1000°F heat: 0.28 → 0.25;
- insulation damage: 0.25 → 0.19.

These are similar sizes. V3 states are slightly less salient, partly because the camera keeps moving. **Neither version makes the states big enough;** that is the subject-scale ceiling, not a tuning problem.

**Excerpt (S07):** the template is unchanged since V2. Empty 46%, motion 0.20, text gate PASS.

**Files** (draft release):
- `apollo13-v1-v2-v3-contact.png` (8 identical film times per row);
- `apollo13-proto-component-v3.mp4`.

## 5. Historical accuracy and phone readability

**Every animated state still cites a verified claim.** The 65 V fill, 28 V rating, 80°F threshold, "could not open" and "about 1000°F" values come from claims, and "about 1000°F" carries the ESTIMATE badge (claim kind estimate). The insulation damage is tagged only when the narration says "damaging". The switch is never drawn reopening.

**How the four kinds are told apart on screen:**
- historical drawings: chip "NASA drawing";
- conceptual reconstruction: chip "Conceptual · not to scale";
- test imagery: "… · not the accident";
- estimate: badge.

**Phone readability:** labels 40 px, tags 44 px, meter text 36–38 px. The smallest essential text is the 28 px chip, shared by all templates. The labels no longer cross other parts in the sampled frames.

## 6. Anchor accuracy: why the three critical suggestions were wrong

| Card | What it found | Why it is wrong | Calibration (V1.1) |
|---|---|---|---|
| SG-launch-1 (L1 hook) | The densest-edge window, on the **gantry lattice** | Region-of-interest has no subject model: on a launch photo the tower has the most edges | Confidence ceiling 0.15 (raw 0.52); always **NEEDS_HUMAN_REVIEW** |
| SG-tank-diagram-37 ("heater") | The word **HEATER** of the lead label "TO HEATER" | OCR missed the "TO" above it. The word names where a wire goes, not the heater. The drawing's actual heater label, "HEATING ELEMENT", was not read at all. | A label inside a cluster of "TO …" lead labels is **NEEDS_HUMAN_REVIEW**; "TO …" labels get no component |
| SG-tank-diagram-38 ("heater") | The far end of that label's leader line, on wiring near the temperature sensor | A leader ends where a line stops; no held-out accuracy says it reaches the named part | Leader targets: ceiling 0.35; always **NEEDS_HUMAN_REVIEW** |

**Method ceilings:**
- claim-line 0.8; ocr-text 0.7; figure-boundary 0.6; diagram-label 0.6; heading 0.5;
- leader-target 0.35; subject-box 0.3; region-of-interest 0.15.

Leader-target, subject-box and region-of-interest are always NEEDS_HUMAN_REVIEW. The ceilings came from this failure analysis of the Apollo cards, **not by re-tuning on the Challenger evaluation images**. Challenger recall is reported unchanged: **8/18 (8/16 in scope)**, still a development-set figure.

**Status:** all 122 suggestions remain **SUGGESTED**; 25 are assessed NEEDS_HUMAN_REVIEW.

**Planner effect:** unreliable suggestions are never offered as geometry. L2's upgrade is now **MEASURED_MODE_NEEDS_MANUAL_ANCHORS**, citing the two tank cards and their reasons.

**Review package:** `plan/review/anchor-review.json` plus `anchor-review-sheet-1…7.png`. 41 cards, each showing the calibrated and raw confidence and the reason for its assessment.

## 7. Decision

**Kept** (genuine fixes, not cosmetics):
- camera continuity;
- cue-settled camera moves (restores S03 motion);
- the text budget;
- labels that avoid other parts;
- lossless 2.8× faster capture;
- the GIF fix;
- calibrated anchors.

**Reverted:** the push-through zoom.

**Stop point reached.** The remaining creative-QA failures cannot be fixed honestly in conceptual mode:
- empty background 50–64%;
- small state salience;
- "not registered to archival media".

More fill or effects would only move the numbers. The next real improvement needs **verified drawing geometry**, for which the local engine has no reliable suggestion.

## 8. Human decisions and review items

1. **Find a figure that shows the thermostatic switches.** The 394 px tank figure (`4-339a.gif`) labels a "HEATING ELEMENT" and two "TEMPERATURE SENSOR"s but **no thermostatic switch**. Measured mode needs the Review Board's own figure showing the switches on the heater tube (the report text cites "figure 4-2"), or a decision to keep the switch conceptual.
2. **Measure by hand on the chosen figure:** heater tube, thermostatic switch(es), fan-motor wire run (about 3–4 anchors). Verify, or reject, cards SG-tank-diagram-37 / -38.
3. **Mark the hook's point of interest** on the launch photo by hand. Reject SG-launch-1.
4. **Confirm the plates' depiction:** that `tank-location` and `tank-diagram` show the Apollo 13 SM and its tank design. Today this rests on Commons metadata.
5. Decide whether the **test-photo backdrop** belongs under the board's finding.
6. Topic and remake approval, script approval and recorded narration (the timings are still estimated).
7. Creative sign-off.
