# Premium Shorts Engine: generalization round V1 (2026-10-15)

**Goal:** less human work on *new* topics, tested on Apollo 13 rather than tuned on Challenger.

**Scope and restrictions:**
- Rendered: scene-level prototypes only (Apollo S02–S05 and S07, video only, estimated timings).
- Not done: no full Apollo or Challenger render, no upload, no workflow, schedule, voice or Cloudflare change, no paid API, no merge.
- No validation rule or QA threshold was relaxed. The Apollo auto plan was **not edited by hand**: every number below comes from `planner.js` output.

## 1. Root cause of the 33% (baseline `56e16992`: 3/9 clean)

| Line | Baseline code | Category | Who can solve it |
|---|---|---|---|
| L1 hook | MISSING_ANCHOR | Missing image anchor | **Human:** someone must confirm a point of interest. Software can only suggest it. |
| L2 heaters / 65 V | MISSING_ASSET | Missing visual asset | **Software.** No photo exists of a 1970 ground-test power supply. The claims describe a component and its states, so an evidenced explanatory diagram fits; nothing archival is missing that could be found. |
| L3 switch rating | MISSING_ASSET | Missing visual asset | **Software** (same) |
| L4 80 °F threshold | MISSING_ASSET | Missing visual asset, plus a beat misclassified as "setting" because of "degrees" | **Software** (classifier and diagram) |
| L5 heater tube / insulation | MISSING_EVIDENCE + NO_TEMPLATE | Missing template. The "missing evidence" was the joint template asking for O-ring claims, a planner artifact rather than a real gap. | **Software** |
| L7 finding | MISSING_ANCHOR | Missing document region (no scan of the report page) | **Software** for a disclosed typeset excerpt. A scan with a measured region is still the better visual, and needs a human. |
| global | SCRIPT_NOT_APPROVED, ESTIMATED_TIMELINE | Narration timing uncertainty | **Human** (approval and recording) |

The 24 baseline VALIDATION errors were all placeholders with empty parameters for those six shots, not separate defects.

**No blocker was a creative-quality failure.** Creative quality is still the weakest part of the new output (§6). That is an editorial judgement and stays with a human.

**Correction to `APOLLO-13-PILOT.md` §5:** that table listed L6 as "event-sequence, timeline, clean". The committed baseline plan actually made L6 a **human-cost archival plate** (sm-damage). The trigger was the word "crew"; the plan was still valid and clean. The 3/9 total was right. Only the description of L6 was wrong.

## 2. Asset Matching Engine V1 (`engine/asset-matcher.js`)

For each beat, the matcher ranks every licensed asset on eight recorded criteria:
- evidence relevance;
- historical subject;
- exact depiction;
- resolution;
- aspect ratio;
- licensing;
- mobile readability (from OCR box heights, or marked *estimated*);
- template compatibility.

**Hard rules (never scores):**
- **WRONG_SUBJECT.** A title or caption naming another designation of the same family is rejected (for example Apollo 14 or Apollo 10 against "APOLLO 13"). The topic identity comes from the verified designation and date claims, not from configuration.
- **WRONG_PERIOD.** An asset is rejected for a written date outside the documented period. Archive IDs such as GPN-2000-… are not read as dates.
- **DISCLOSURE_REQUIRED.** A test, concept, model, simulation or redesign is never accepted as a depiction of the event.
- **CONFIRM_DEPICTION.** Caption word overlap alone is only a candidate. Only a human-entered `depicts` entry makes an ACCEPT.
- **LICENCE.** An unknown licence, or CC BY without an attribution, is rejected.
- **DUPLICATE.** Same sha256, or the same source page, title and file.
- **NO_SUITABLE_VISUAL.** Returned when nothing fits; the matcher never substitutes another asset.
- The matcher never writes provenance; it only reads `assets.json`.

**Apollo 13 results (`auto/asset-matches.json`, 11 ms):**

| Status | Lines |
|---|---|
| MATCHED | L1 launch, L6 sm-damage-2, L8 crew |
| NEEDS_HUMAN_REVIEW | L5 (sm-damage-2 shares "damage" words with the claims; overlap is not depiction) |
| NO_SUITABLE_VISUAL | L2, L3, L4, L7 and L9 (L9 reuses the hook by design) |

- tank-fire-test is always DISCLOSURE_REQUIRED: it is the board's test, not the accident.

**Planner integration:**
- The planner refuses any asset the matcher rejects (subject, period, licence) and any test or concept image.
- The planner keeps its own pick among the remaining assets. There is one recorded disagreement on L6: the matcher prefers sm-damage-2 (higher resolution) and the planner uses sm-damage. Both depict C-a13-pressure.

## 3. Anchor Suggestion Engine V1 (`scripts/fr-premium/anchor_suggest.py`)

**Methods (local and free: tesseract, ImageMagick, numpy):**
- ocr-text;
- document-heading;
- diagram-label;
- claim-line (the OCR line's words are in a claim passage);
- leader-target (follows a label's straight leader line to the component);
- figure-boundary;
- subject-box;
- region-of-interest.

**Separation of states:**
- Everything is written to `anchor-suggestions.json` with status **SUGGESTED**.
- A human sets VERIFIED or REJECTED, with `review.by` and `review.at`.
- New validator gates:
  - an `assets.json` anchor may cite a suggestion only if it is VERIFIED;
  - an anchor that copies the coordinates of a SUGGESTED or REJECTED suggestion fails ("suggested anchor used as verified");
  - VERIFIED without a reviewer fails.
- Suggestions never switch a component scene to measured mode (tested).

**Accuracy on the 18 verified Challenger anchors** (`challenger-1986/plan/qa/anchor-suggestion-eval.json`). Matching rules:
- only role-compatible methods count (a text box centred on a ring is not a ring suggestion);
- leader targets must name the part;
- rect anchors need IoU ≥ 0.5 or a correctly named point inside the rect;
- point anchors need to be within max(12 px, 3% of the diagonal).

| Anchor role | Hits |
|---|---|
| document-line (chart "53 °F" line, fax "recommend" line) | 2 / 3 (value-53f missed, IoU 0.23) |
| document-block (labels, chart reason, fax signature) | 4 / 4 |
| mechanism-ring (fig. 14 O-rings) | 1 / 2 (primary 16 px; secondary 65 px, miss) |
| mechanism-part (tang, clevis legs, pin) | 1 / 4 (clevis pin, via its leader) |
| photo POI / subject / traceable part (liftoff smoke, aft joint, right SRB) | 0 / 3 |
| registration (2) | not in scope |
| **Total** | **8 / 18 (8 / 16 in scope, 50%)** |

**Honest caveats:**
- The leader-line and label parameters were tuned on fig. 14, so this is a development-set figure. There is no held-out ground truth.
- On photos the method finds nothing useful: the smoke point is about 2,000 px off.
- Apollo 13: 122 suggestions on 8 assets in 4.4 s, **0 verified**. Leader targets on the 394 px tank figure look unreliable on inspection (for example "Fan Motor" lands at the top edge).

## 4. `component-section` template (`engine/templates/component-section.js` + `engine/component-extract.js`)

**Component extraction.** Deterministic rules over the verified passages, using a shared vocabulary of supplies, switches, heaters, insulation, wires, motors, vessels, valves, sensors and seals. It returns parts, relations and documented states, each with its claim and the exact supporting phrase:
- relations: powered-by, in-series, mounted-on, near, rated-for, layer-of, inside;
- states: on, rated, threshold, stuck-closed, hot, damaged, pressure-loss.

For Apollo L2–L5 it finds:
- heater **powered-by** GSE power supply;
- switch **in-series** heater, and switch **mounted-on** heater tube;
- switch **rated-for** spacecraft power supply;
- insulation **layer-of** fan motor wires, and wires **near** heater;
- six states timed to spoken words: sixty-five, twenty-eight, eighty, not, thousand, damaging.

**Modes.**
- **conceptual:** a neutral schematic laid out from topology only. It carries no coordinates, and a "Conceptual diagram · not to scale" disclosure is required.
- **measured:** parts sit on VERIFIED mechanism-part anchors of a drawing. The drawing is registered under the model.

**What it shows.**
- Layered materials: copper core under the insulation sheath, a brushed-metal tube, the switch housing.
- Controlled camera travel across the parts each line names.
- State transitions:
  - current flows when the circuit is energized;
  - value tags appear;
  - the contact stays closed while a dashed ghost shows the intended opening, then a weld glow and "COULD NOT OPEN";
  - heat tint and glow on the tube;
  - the sheath chars and cracks.
- Labels of at least 40 px in a clear band, with leaders down to the parts.

**Validator gates.**
- Every part label and state tag must use only words from its claim's passage.
- Every link must be stated in its passage.
- At least 3 states per scene.
- Conceptual scenes need the conceptual disclosure and schematic scale, and take no anchors.
- Measured parts need verified mechanism-part anchors on the scene drawing.

**Also new: `document-excerpt`.** When no scan region exists, it typesets a finding or quote verbatim from its passage on a plain card marked "Report text · typeset, not a scan". The highlight must be verbatim in the passage.

**Generic beyond Apollo:** the vocabulary covers valves, sensors, seals and pressure loss, and nothing in either template names a topic.

**Not exercised:**
- Measured mode was tested only in the validator and planner. It has not been rendered, because no verified tank anchors exist.
- The layout handles one host part with mounted, near and supply relations. Other graph shapes fall back to a row of boxes.

## 5. Apollo 13 re-run (no manual plan edits)

| Measure | Before (`56e16992`) | After |
|---|---|---|
| Clean auto-planned shots | **3 / 9 (33%)** | **8 / 9 (89%)** |
| Review shots | 6 | 1 (S01 hook anchor) |
| Validation errors in the auto plan | 24 | 0 (VALID) |
| Shots with a template and real parameters | 4 / 9 | 9 / 9 |
| Archival assets auto-matched by the matcher (ACCEPT) | n/a | 3 lines (L1, L6, L8) |
| Suggested anchors | 0 | 122 (all SUGGESTED) |
| Verified anchors | 0 | **0** |
| MISSING_EVIDENCE issues | 1 | 0 |
| Lines without archival visual coverage | 5 (L2–L5, L7) | still 5. They are now covered by a disclosed conceptual diagram (L2–L5) and a typeset excerpt (L7), **not** by archival imagery. |
| Generated values (camera, time, layout) | 53 | 54 |
| Manually entered plan values | 0 | 0 |

**Global gates unchanged:**
- SCRIPT_NOT_APPROVED;
- ESTIMATED_TIMELINE.

**Challenger with the same engine:**
- planner still 9 / 12 clean, with the same templates;
- no component or excerpt shots are introduced;
- production plan still VALID.

**How the gain was made:**
- general rules (component scenes, typeset excerpts, temperature-beat classification, the "a thousand" spoken number, matcher gates);
- no Apollo-specific code or data, beyond recording each asset's real file name, size and sha256.

## 6. Scene-level prototypes and creative evaluation

**Files** (draft release, not in git):
- `apollo13-proto-component.mp4`: film time 5.26–27.91 s (S02–S05, 22.7 s);
- `apollo13-proto-excerpt.mp4`: 36.45–42.18 s (S07, 5.7 s);
- `apollo13-proto-contact.png`.

Both are video only, rendered on the estimated timeline.

**Measured gates:**
- **Text gate:** PASS (0 FAIL / 0 WARN) after fixing one collision found in round 1 (the "+ −" glyph against a label).
- **Creative QA:** still WARN on every shot (`qa/creative-qa-proto-*.json`):

| Shot | Empty background | Subject motion | Visible states | Main warnings |
|---|---|---|---|---|
| S02 | 73% | 0.15 | 0/1 | slide-like, 5 labels, 20 words |
| S03 | 67% | 0.26 | 0/1 | 5 labels |
| S04 | 65% | 0.08 | 0/2 | slide-like, still subject |
| S05 | 66% | 0.27 | 1/2 | heat and damage visible |
| S07 excerpt | 77% | 0.20 | 1/2 | slide-like, 26 words (it quotes a sentence) |

Thresholds: empty ≤ 35%; motion ≥ 0.25. Every component shot also reports "mechanism not registered to archival media", which is true by design in conceptual mode.

**Editorial review (human judgement, not the numbers):**

| Criterion | Assessment |
|---|---|
| **Historical accuracy** | Good. Every label and tag is in its passage. The switch is never drawn reopening. No fire is drawn before the board's finding. "About 1000°F" keeps its marker. The 80°F threshold is shown as intended behaviour (dashed ghost), not as an event. |
| **Storytelling and continuity** | The four lines read as one continuous machine, and the camera travels supply → switch → tube. This is the strongest part. |
| **Visual hierarchy** | The caption is clear, and one state tag shows at a time. The chip and the disclosure line say nearly the same thing; that is redundant. |
| **Camera motion** | Purposeful moves, but S04 holds almost still for about 6 s. |
| **Material depth** | Basic: flat panels on a blueprint ground. The heat glow and charred sheath read well; the rest looks like a diagram. |
| **Phone readability** | Labels are 40 px and tags 44 px. The 28 px chip is shared by all templates. At the S03–S04 zoom, the switch label crosses the supply box. |
| **Caption placement** | Clear. A shade band keeps the model from competing with the caption. |
| **Archival integration** | **Missing.** There is no NASA imagery in 22 s. The tank drawing and the SM location drawing exist, but confirming their depiction and verifying anchors is human work. Without that, the sequence is honest but not premium. |

**Verdict: not production quality.** The planning gain is real. Visually it is a correct explainer that is too sparse: about 67% empty against a 35% limit. The next steps are measured mode on the tank figure (after a human verifies about 4 part anchors), a brief archival inset of the SM location drawing, and denser materials.

## 7. Time and cost

| Item | Value | Basis |
|---|---|---|
| Asset retrieval (8 Commons files, 13.8 MB) | **about 14 s** of transfer, plus about 10–30 s of backoff after an HTTP 429 | measured (per-file seconds in `downloads.json`; one 429 retry) |
| Anchor suggestion | **4.4 s** (Apollo, 8 assets); 5.6 s (Challenger, 8 assets) | measured |
| Asset matching | 11 ms | measured |
| Planning and validation | about 0.1 s | measured |
| Prototype render | 115 s for 22.7 s of video; 27.5 s for 5.7 s (**about 5 s of render per second of video**) | measured (M-series laptop, local Chromium + x264) |
| Full 53 s render (not done) | about 4.5 min | estimate from the above |
| Human verification | **not measured.** No human verified anything this round. | — |
| Human verification (estimate) | hook POI: 1 suggestion, about 1–2 min; measured tank mode: about 4 part anchors, about 10–20 min; depiction confirmation for 2 drawings: about 5 min | estimate |
| Template reuse | Apollo uses 4 existing templates for 4 of 9 shots, and the 2 new generic templates for 5. Challenger needs no new template. | measured from the plans |
| Manual plan adjustments | 0 | measured (the plan file is planner output) |
| Total human effort per new topic (estimate) | **about 0.5–1 working day**: research and claim selection about 2–4 h; anchor and depiction review about 0.5 h; storyboard approval about 0.5 h; plus voice and approval. The previous estimate was about 1 day, conditional on this template. | estimate |
| Cost per video | **$0**: public-domain sources, local tools, no paid API | measured (no paid calls made) |

Template development time (this round) is engineering, not per-video cost, and is not counted.

## 8. Validation tests

| Test file | Count |
|---|---|
| `tests/js/fr-generalization.test.js` | 22 |
| `tests/test_fr_anchor_suggest.py` | 4 (the OCR test skips without tesseract) |

What they cover:
- incorrect asset matching;
- wrong mission imagery (matcher and validator);
- unsupported visual claims (labels, tags, links, excerpt highlight);
- invalid anchors (out of bounds; suggested-as-verified by coordinates and by reference; VERIFIED without a reviewer; unknown status);
- duplicate assets (sha256);
- unsupported geometry (conceptual with anchors, non-schematic scale, measured without anchors);
- incorrect licensing (CC BY without attribution; unknown licence);
- misleading reconstruction visuals (a test photo as archival; missing conceptual and typeset disclosures);
- unsafe document extraction (a disguised HTML file refused by magic bytes; OCR text stays data);
- missing evidence (a removed claim);
- no fabricated provenance;
- a Challenger non-regression test.

**Full suite:** JS 699 / 699 pass; Python 30 tests OK (3 skipped).

Existing gates are unchanged. The one updated assertion is the Apollo planner test, which now expects the new 8/9 plan.

## 9. Still human

- Topic and remake approval.
- Script approval and narration recording; timings are still estimated.
- Verifying the hook POI.
- Confirming the depiction of the tank drawings, and verifying their part anchors for measured mode.
- A scan of the report page, if the original page should replace the typeset excerpt.
- Creative sign-off.
