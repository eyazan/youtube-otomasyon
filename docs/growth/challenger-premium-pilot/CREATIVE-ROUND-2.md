# Apollo 13 prototype: creative round 2 (2026-10-15)

**Goal:** better visual quality for the engineering sequence (S02–S05) and the finding (S07), with no loss of automation or accuracy.

**What was rendered:** scene-level clips only, video only, on the estimated timeline.

**Not done:** no full render, no publication, no workflow, voice, schedule or Cloudflare change, no paid API, no merge.

**Thresholds:** unchanged. One gate was **tightened** (§6).

## 1. What changed (template-level, no topic code)

| Area | Change (`component-section`, `document-excerpt`, `planner.js`) |
|---|---|
| Composition | The model sits in a band from y 430 to 1030, framed to fit that band. A lit backing plate (one key light from the upper left, a fine grid, presentation only, not part geometry) gives the parts a surface. Drop shadows separate the parts from the plate. |
| Camera | Continuous travel on every line: a 5% push and a small lateral drift on top of the planned keys. No line holds still. |
| Labels | Labels sit on dark pills. The row is chosen so a label never crosses a part on screen (rows y 372 / 434 / 1010). |
| Mechanism states | **Evidence meters**: one bar per quantity. Fills and marks are claim values, drawn proportionally; no other numbers are drawn. **Voltage:** the bar fills to "ENERGIZED 65 V". Then the "RATED 28 V" mark appears, and the section of the fill beyond the rating turns red. **Temperature:** the "OPEN AT 80°F" mark appears. The bar reaches it at "could not", where the contact flashes red and stays closed while the dashed ghost shows the intended opening. The bar then climbs to "ABOUT 1000°F" at "thousand". Value pills are no longer repeated where a meter already shows the value. |
| Archival integration | **Archival plates** before the model. The planner picks, by rule, images that pass all of these: their own title or caption names the topic **and** the system the parts belong to; they pass the matcher gates (subject, period, licence, duplicates); they are not a test or concept. For Apollo it chose the NASA SM cutaway that shows oxygen tank 2 (`tank-location`), then the NASA tank internals drawing (`tank-diagram`). Both are unmarked and unregistered, chipped "NASA drawing", and the conceptual model fades in after them. |
| Test imagery | `document-excerpt` can show a dimmed backdrop. For S07 the planner chose the NASA fire-propagation **test** photo. It is labelled "NASA photo · fire propagation test · not the accident". |
| Image kinds | Plates and backdrops declare `historical-photo`, `historical-drawing`, `historical-footage` or `test-imagery`. The chip shows "archival" for historical images and "reconstruction" for tests. The model keeps "Explanatory animation" and "Conceptual diagram · not to scale". No historical footage of this subject is in `assets.json`. |

**Asset metadata change:** `tank-fire-test` `provenanceLabel` changed from "NASA photo · board test" to **"NASA photo · fire propagation test"**. The Commons caption calls it a full-scale propagation test at MSC; it does not say it was the Review Board's test.

## 2. Before and after (same film times)

**Files** (draft release):
- `apollo13-proto-before-after.png`: top row v1 (`8ff6ae20`), bottom row v2;
- `apollo13-proto-component.mp4` (v2, 22.7 s);
- `apollo13-proto-excerpt.mp4` (v2, 5.7 s);
- `apollo13-proto-contact.png` is still the v1 sheet.

## 3. Creative QA (`qa/creative-qa-proto-*-v1.json` vs `-v2.json`)

| Shot | Empty background (≤ 35%) | Subject motion (≥ 0.25) | Visible states | Slide-like |
|---|---|---|---|---|
| S02 heaters / 65 V | 73% → **47%** | 0.15 → **0.47** ✓ | 0/1 → 0/2 | yes → **no** |
| S03 28 V rating | 67% → 57% | 0.26 → **0.22** ✗ (worse) | 0/1 → 0/1 | no → **yes** (worse) |
| S04 80 °F / could not open | 65% → 57% | 0.08 → 0.12 | 0/2 → 1/2 | yes → yes |
| S05 1000 °F / insulation | 66% → 62% | 0.27 → 0.32 ✓ | 1/2 → **2/2** | no → no |
| **Component, time-weighted** | **68% → 56%** | | **1/6 → 3/7** | 2 → 2 |
| S07 finding | 77% → **46%** | 0.21 → 0.20 | 1/2 → 1/2 | yes → **no** |

**Still failing:**
- empty background on every shot (best 46%, limit 35%);
- motion on S03 and S04;
- the label and word counts (5–7 labels, 13–20 words, limit 3 / 8). The meters added text: they explain the mechanism, but they push past the channel's label budget;
- "mechanism not registered to archival media" on S02–S05. This is true by design: conceptual mode has no verified geometry.

**Better:** S02, S05 and S07 clearly improved. **Worse:** S03 lost motion; its camera travel now happens at the start of S04. That is a real regression to fix.

## 4. Technical QA

| Check | Result |
|---|---|
| Text gate (Apollo auto plan) | **PASS, 0 FAIL / 0 WARN**. One WARN appeared mid-round (a meter label under the right-side UI zone) and was fixed by clamping. |
| Text gate (Challenger production plan, after the §6 correction) | **PASS, 0 FAIL / 0 WARN** (text inspection only, no video) |
| Validator: Apollo auto plan | VALID |
| Validator: Challenger production plan | VALID |
| Planner | Apollo 8/9 clean (unchanged); Challenger 9/12 (unchanged) |
| Tests | JS 703/703 pass (4 new tests for plates, test-imagery labels, meters, approximation); Python OK |
| Render time | 193 s for 22.7 s of video (v1: 115 s). The drop shadows and blur filters roughly double the render cost. |

## 5. Anchor review package (`plan/review/anchor-review.json` + `anchor-review-sheet-1…7.png` on the draft release)

The package has **41 cards**. Each card shows:
- the whole image with the suggestion drawn, and a close-up;
- the suggested anchor;
- the intended component;
- the supporting source: a claim passage, or "no claim; image caption only";
- the engine's confidence;
- its expected use in the current plan;
- VERIFY / REJECT boxes with a name and a date.

**Generator:** `scripts/fr-premium/anchor_review.py` (generic).

**Status:** all 41 remain **SUGGESTED**. Nothing was approved.

**Cards that matter for the plan:**
- **SG-launch-1** (L1 hook point of interest). The suggested box is on the tower, not the vehicle. A reviewer would likely reject it and mark the point by hand.
- **SG-tank-diagram-37 / -38** (L2 measured mode, "heater"). Card 37 boxes the **"TO HEATER" label**, not the heater. Card 38's leader-target lands on wiring near the temperature sensor. Neither is heater geometry, so measured mode needs a manual measurement.
- The other 38 cards are not used by the current plan (labels on the SM cutaway, subject boxes, figure boundaries).

## 6. Accuracy finding (Challenger): an estimate shown as exact

**Gate gap and fix.** The approximation gate accepted `{C-x.value}` if the claim's *display* carried a marker, even though the bare number was what appeared on screen. The gate now checks the number actually shown.

**What it found.** Challenger S05 (cold panel) showed **"28°F"** for `C-joint-28f`, a **calculated estimate** ("28°F est.").
- **Fixed** in `shot-plan.json` (now `{C-joint-28f}`, shown as "28°F est.") and in the planner's `joint-section` rule: approximate claims use their display.
- **V2/V3 and earlier renders still show "28°F" without "est."** They are not re-rendered in this round.

## 7. Remaining human review

- Topic and remake approval.
- Script approval and recorded narration.
- The hook point of interest: the suggestion is wrong.
- Heater and switch geometry on the tank figure, for measured mode.
- Confirming that `tank-location` and `tank-diagram` depict the Apollo 13 SM and its tank design. The plates use Commons metadata only.
- Whether the test-photo backdrop belongs under the board's finding at all.
- Creative sign-off.

**Verdict:** a measurable step up, but **still not production quality** (§3).
