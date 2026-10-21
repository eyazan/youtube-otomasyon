# Challenger premium: final scene refinement and V3 decision (2026-10-13)

**Scene-level work only.**
- No full V3 render. Nothing published or uploaded; no paid API.
- No change to workflows, schedules, channel settings or voice approvals.
- Preserved: V2, all Phase 1 assets and reports, and the r2 prototype D (`phase1/archive/proto-d-r2-*.js`; its videos stay in `reports/…/phase1/`).
- Byte-identical stills: V2 from today's code matches commit `0691071e`; prototype A from today's code matches commit `a74f9fc9`.

## 1. What changed in this pass

| Scene | Change | Why (measured defect) | Repairs |
|---|---|---|---|
| A | none (kept as baseline) | no blocking defect | — |
| B | text only: notes and clock removed; the source line now carries "75°F test, 28°F est."; the animation is unchanged | 7 labels / 29 words at once (V2 window 6 / 18) | 0 |
| C | one framing parameter: S09 camera on the aft ~22 m (zoom 1.32 → 1.9); orbiter outline 0.35 → 0.16 | S09 58% empty ground | 0 |
| D | **rebuilt as a document camera** (r3, below) | r2 still slide-like: S13 subject motion 0.11, 5 tiers | **2 (maximum)** |

**D's two repairs:**
1. **Hard text gate.** The finding's two lines' boxes overlapped, the clipping reached under the right-side UI, and its citation crossed the caption band while sliding in. Fixed: 56 px type, 96 px line spacing, and the clipping rises in place.
2. **Phone-scale review.** At about 41.8 s, a 0.4 s zoom-out left a small chart strip on an empty desk. Fixed with one camera key (zoom 1.05 → 1.35).

**D r3: document camera** (`phase1/proto-d-warning-and-decision.js`). The two Thiokol documents lie on a desk, and the camera reads them with the narration:

| Narration | Camera and evidence |
|---|---|
| "engineers had recommended not launching below fifty-three degrees" | the camera travels along the engineers' handwritten line on the p. 90 chart, the highlight follows the words, and the camera lands on "≥ 53 °F"; then it pulls back to the engineers' stated reason (development motors at 47–52°F with no blow-by) |
| "their managers reversed that advice" | the **signed telefax slides over the engineers' chart and covers it** (cause and effect made physical); the camera reads "MTI recommends STS-51L launch proceed on 28 January 1986", then the signature (p. 97) |
| "NASA's top launch officials never heard it" | the clock runs to the launch (11:38 AM) and the Commission's finding is laid on top: "Those who made that decision were unaware…", with "unaware" highlighted on "never" (p. 82) |

- **No flowchart, bar chart or information card.** Every page is an authentic NASA reproduction; the finding is typeset and cited.
- **Typography:** three sizes only — 64 px time stamp, 56 px finding, 24 px source lines (captions and the provenance chip are system elements).
- **New generic support:**
  - `FR.X.desk`: real scans on a desk, a camera path, highlights in page coordinates.
  - Optional `rotate` on media layers in `fr-lib.js` (absent on all V1/V2 layers, hence the byte-identical stills).

## 2. Independent creative QA: each scene against the same V2 window

**Measured:**
- `creative_qa.py`, WARN-only, thresholds unchanged.
- The unchanged hard text gate passes on the final prototype film: **0 FAIL / 0 WARN, 207 samples**.
- Records: `phase1/qa-final/`.

| Shot | Empty | Subject motion | States verified | Registered | Tiers / labels / words | Slide-like |
|---|---|---|---|---|---|---|
| A S02 | 78% → **16%** | 0.43 → **1.25** | – → 4/4 | N → **Y** | 1/2/4 → 1/2/5 | N → N |
| A S03 | 67% → 65%¹ | 0.11 → **0.75** | – → 2/2 | N → **Y** | 1/1/8 → 1/1/11 | **Y → N** |
| B S05 | 79% → **35%** | 0.19 → **0.35** | – → 3/4² | N → N (reason declared) | 4/6/18 → 4³/**3**/20³ | **Y → N** |
| C S08 | 76% → 71%¹ | 0.33 → 0.49 | – → 0/2² | n/a | 4/4/15 → 4/3/10 | N → N |
| C S09 | 71% → **52%** | 0.16 → **0.53** | – → 3/4² | N → **Y** | 4/3/11 → 3/4/19 | **Y → N** |
| D S12 | 69% → 73%¹ | 0.23 → **0.54** | – → 2/3² | n/a | 5/5/30 → **2/1/8** | **Y → N** |
| D S13 | 81% → **51%** | 0.12 → **0.50** | – → 4/4 | n/a | 3/7/23 → 3/3/15 | **Y → N** |

¹ The "empty" measure counts white document paper and dark sky in real film as bare ground (a known limitation, §5 of the Phase 1 report).
² Unverified states are small changes (highlight sweeps, the leak glow, the ring) below the mean-motion sensitivity; they are visible in the contact sheets.
³ B's window includes the dissolve from S04, whose "36°F" headline adds a tier and words for 0.3 s. B's own text is 2 temperatures, GAP and one source line.

**Window totals (V2 → final):**

| Window | Time-weighted empty | Creative warnings | Slide-like shots |
|---|---|---|---|
| A | 53% → 33% | 16 → 9 | 1 → 0 |
| B | 64% → 34% | 21 → 17 | 2 → 0 |
| C | 71% → 57% | 24 → 18 | 1 → 0 |
| D | 72% → 60% | 26 → 13 | 2 → 0 |

Across the four windows, **slide-like shots go from 6 to 0**. Two rebuilt mechanism shots are now registered to archival media (S02, S09; none were in V2). S05 is unregistered by design, with the reason declared, and V2's S13 flowchart is now a document shot.

**Judged on the contact sheets at 180×320 and the 540×960 side-by-sides (my judgement, not audience evidence):**

| | Mobile readability | Narrative clarity | Continuity | Source accuracy |
|---|---|---|---|---|
| A | traced lines and Fig. 14 labels read; no sliced Commission labels | clear: where the leak was, then what seals it | one camera, no cut | right SRB identification and smoke position as in V2; Fig. 14 not mirrored |
| B | temperatures and GAP read at a glance; one small source line | the difference (springs back vs stays squeezed) is the only thing on screen | dissolve with frost from the icicle photo | 0.6 s and 28°F est. cited; speeds labelled illustrative |
| C | clock, labels and states read; the leak glow is small | the documented sequence in order, one label at a time | the film's flame becomes the joint (match on point and angle) | Ch. III times; no explosion; proportions approximate |
| D | the handwriting is legible while the camera is close; the typed fax line and signature read | engineers' line → reversal on top of it → decision-makers unaware | one continuous desk | p. 90, p. 97 and p. 82 verbatim; times are the Commission's approximate EST chronology |

## 3. Remaining creative defects

| Scene | Defect | Severity |
|---|---|---|
| A | S01 headline and caption compete (V2's hook, unchanged; the owner's call) | medium |
| A | Fig. 14 is a white rectangle on the dimmed photo; source line 24 px | low |
| B | 112 px temperatures trip the "headline competes" rule (numerals, not a sentence; a rule false positive) | low |
| B | not registered to archival media (generic seal behaviour; declared) | low |
| C | E-207 is dark sky (authentic; no fix); S09 still 52% blueprint ground; up to 4 labels (clock label and value, one callout, source) | low |
| C | leak and dome states small at phone scale | medium |
| D | the first second is the whole chart as a strip on the desk before the camera moves in | low |
| D | "11:38 AM" relies on the narration and the rail for "next morning" (no date on screen) | low |
| D | the finding plus its citation is 15 words on screen | low |
| All | the motion measure misses small changes; "empty" counts paper and sky (calibrate before making gates FAIL) | tooling |

## 4. Automation readiness: component reuse

| Class | Components | Reusable for the next FR topic? |
|---|---|---|
| **Reusable engine code** | `render-vertical.js` (overrides, extra media); `fr-lib.js` (camera crops, media pool with rotation, captions, chip, clock, crossfades, text inspection); `qa-vertical.js`; `text-qa.js`; `creative_qa.py`; `compare-scene.sh`; `mix-audio.js`; `narrate-edge.js`; `sound_design.py`; `build_manifests.py` | yes, unchanged |
| **Parameterised templates** | `X.trace` + camera hand-off (photo → trace → drawing); `X.groove` (seal recovery); `X.stack` (failure states from an event table); `X.events` (evidence clock); `X.desk` / `X.doc` (document camera, page highlights); `X.rail` / `X.stamp` (chronology); `X.scale`; `X.plate` | yes, with topic data; `X.stack` and `X.groove` cover aerospace stacks and seals; other FR mechanisms (beam, weld, valve, cable) need new templates of the same shape |
| **Challenger-specific data** | anchors (booster edges, joint, smoke, flame point, vehicle angle); the Ch. III event table; document highlight rectangles (p. 90, p. 97); quote text (p. 82); stack dimensions; word anchors; the 11 V2 shots still hand-written in `scenes.js` | no; must be produced per topic |
| **Manual intervention** | evidence research and script; source and licence choice (automated checks exist for licences); anchor placement (about 5–10 min per asset); highlight rectangles (about 3 min per page); scene composition while shots are still code; creative review; owner approval and listening | today, all; target: anchors and rectangles become confirm-only |

**Second premium video, human effort (estimate):**
- **Today:** about 1.5–2.5 working days. The templates remove most of the drawing work, but each shot is still written as code, and research and anchors are manual.
- **After the shot-plan schema and planner** (proposal phases 2–4): about 2–4 hours, mostly research review, anchor confirmation and final approval.
- **Machine time:** about 7 min of render per 52 s film (measured scene renders: 31–109 s each) plus about 2 min of QA.

## 5. GO / NO-GO for one V3 render

**GO, conditional on the owner's review of the four final prototypes**, which is required before any V3 render.

**Ready:**
- Each rebuilt scene beats V2 on its measured defects. Slide-like shots go from 6 to 0 across the windows.
- The hard text gate passes. V2 and A reproduce byte-identically.
- Every change is scene-local and already rendered at full quality.

**Before V3:**
1. The owner watches `phase1-final/*-vs-v2.mp4` at phone size and approves, or names changes.
2. The owner decides on S01 (headline vs caption).
3. V3 reuses V2's audio unchanged. **The voice is still not approved**: listening approval remains a production blocker, separate from the V3 render.

**NO-GO if:** the owner rejects D r3 or C's tighter framing. Revert to the measured alternative (D r2, C at zoom 1.32) rather than iterating without a defect.

## 6. Artifacts

| Location | Contents |
|---|---|
| Local, git-ignored: `reports/challenger-premium-2026-10-12/phase1-final/` | for A–D: the prototype `.mp4` (V2 audio), the `-v2.mp4` window, the `-vs-v2.mp4` side by side, and the `-contact.png` before/after. A is copied unchanged from `phase1/` |
| Draft release `pilot-challenger-premium-v1-2026-10-12` | the final prototypes and comparisons zip, with an updated `SHA256SUMS.txt` |
| Records | `channels/failure-reconstructed/premium/challenger-1986/phase1/qa-final/` |
