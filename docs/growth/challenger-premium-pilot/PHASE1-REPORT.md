# Premium Shorts engine: Phase 0 + Phase 1 report (2026-10-13)

> **Superseded in part by [PHASE1B-REVIEW.md](PHASE1B-REVIEW.md):** prototype D was rebuilt (r3), B's text was simplified and C's framing was tightened. The r2 numbers below are kept as the record of that pass.

**Offline prototypes only.**
- No full V3 render.
- Nothing published or uploaded; no paid API.
- No change to workflows, schedules or channel settings.
- Challenger V2 (`a832a220…`) is untouched. Stills rendered from V2's commit and from today's code are **byte-identical** (4 sampled times), so the library changes affect only the new prototypes.

## 1. Summary

| Prototype | Replaces | Result (measured, then my judgement) |
|---|---|---|
| **A** Opening → joint | S02 clip-art stack, S03 Fig. 14 card | **Clear win.** S02 empty background 78% → 16%, 0 creative warnings. One continuous camera from the NASA photo into the Commission's drawing. |
| **B** Warm vs cold seal | S05 static shapes | **Win, text-heavy.** Empty 79% → 35%, subject motion 0.19 → 0.33, 3 of 4 states visible. The mechanical difference now happens on screen in real time (0.6 s), but there is too much text (7 labels). |
| **C** Flame → tank | S08 film in a box, S09 grey tank | **Win.** Registered match from film to reconstruction; the Commission's event sequence plays on its own clock. S09 subject motion 0.16 → 0.35. The empty metric overstates (dark sky). |
| **D** Warning & decision | S12 bar chart, S13 flowchart | **Partial.** Bar chart and flowchart gone, replaced by the authentic Thiokol chart, the signed fax and the Commission's finding on a timeline. Still mostly static pages; S13 subject motion unchanged (0.11). Both repairs used. |

**Recommendation:** owner review of the four clips, then one design pass on D, then a single V3 render (§8).

## 2. Phase 0: creative measurement (WARN-only)

**New:** `scripts/fr-premium/creative_qa.py` (numpy; never fails a build).
- Existing hard gates (`qa-vertical.js`, `text-qa.js`) are unchanged and were run on the prototypes: **text QA 0 FAIL / 0 WARN**.
- Shots now carry plan metadata: `transReason`, `states`, `register`, `primitives`, `framing`. It is exported in `shots.json`.

| Check | How it is measured | WARN when |
|---|---|---|
| Empty background | 6×6 blocks at 270×480 that are flat (sd < 2.5) and bare (luma < 45 or > 215); caption band excluded | > 35% |
| Subject motion excluding camera | best global camera move fitted per frame pair (scale + sub-pixel translation); residual normalised by texture | < 0.25 on non-archival shots |
| Narration-timed states | plan states; each is *verified* when the subject residual peaks in −0.15…+0.6 s | < 2 per shot, < 1 per 2 s, or any unverified |
| Archival framing | empty share on archival shots (inset over void); framing class reported | > 25% |
| Registered continuity | plan `register.from`; plus picture correlation across the boundary | mechanism shot not registered |
| Text hierarchy | from render text inspection: tiers, labels, words, smallest label, headline vs caption | > 3 tiers, > 3 labels, > 8 words, label < 32 px |
| Slide-like composition | plan primitives {bar-chart, flowchart, bullets}, or empty > 50% with drift-only motion | any |
| Unmotivated transition | plan transition type in the grammar {match, push-in, follow-cause, cut, hard-cut, dip, loop, continuous} with a reason; cut or dissolve measured from the MP4 | missing reason or type |

**Calibration (stated plainly):**
- The thresholds come from the proposal, except subject motion.
- The first motion measure was confounded by texture: sub-pixel misfit on detailed photos. I fixed the method (sub-pixel fit, texture normalisation) and set the subject-motion threshold at **0.25 on the V2 baseline only, before any prototype was measured**. On V2, drift-only diagrams measure 0.11–0.16.
- A second fix added a one-frame margin at shot boundaries, after one sample landed across a V2 hard cut.
- Both fixes apply equally to V2 and the prototypes. No threshold was changed after the prototypes were measured.

**V2 baseline** (`phase0/creative-qa-v2-baseline.json`):

| Measure | V2 |
|---|---|
| Shots with creative warnings | 15 / 15 (91 warnings) |
| Time-weighted empty background | 54% |
| Mechanism shots registered to archival media | 0 / 5 |
| Slide-like shots | 6 (3 by primitive: S06 bullets, S12 bar chart, S13 flowchart; 3 by sparse and drift-only) |

The V2 slide primitives are a hand annotation (`phase0/v2-plan-annotations.json`); everything else is measured.

**Known limitations** (they matter when reading §3):
- "Empty" counts flat dark sky in real footage and the white paper of line-art documents as bare ground. It overstates for E-207 (S08) and Fig. 14 / Commission scans (S03, S12, S13).
- Boundary correlation measures pixel continuity, not semantic registration. A film-to-drawing match (C) scores low by design.
- Subject motion is a frame mean: small moving elements (gas dots, highlight sweeps) barely register. Two of D's highlight states and one of C's leak states read as "not visible" for this reason. They are visible in the stills.

## 3. Phase 1 scene prototypes (scene-only renders)

Each is rendered for its window only with `render-vertical.js --overrides … --from --to`. It is muxed with **V2's own audio** for that window and compared against the same V2 window (`compare-scene.sh`).

| | Window (s) | Frames | Render time | Repairs |
|---|---|---|---|---|
| A | 0–9.3 | 279 | 109 s | 1 (pre-render: ring position, photo reveal) |
| B | 12.2–15.43 | 97 | 32 s | 0 |
| C | 23.0–32.8 | 294 | 74 s | 1 (hard text gate: shorter source line) |
| D | 36.3–47.1 | 324 | 35 s | **2 (maximum):** (1) text gate before render: rail labels at the frame edge; (2) after render: case-file layout, fewer labels |

### Creative QA, rebuilt shots: V2 → Phase 1

| Shot | Empty | Subject motion | States verified | Registered | Labels / words | Slide-like | Warnings |
|---|---|---|---|---|---|---|---|
| A S02 | 78% → **16%** | 0.43 → **1.25** | – → **4/4** | N → **Y** | 2/4 → 2/5 | N → N | 4 → **0** |
| A S03 | 67% → 65%¹ | 0.11 → **0.75** | – → **2/2** | N → **Y** | 1/8 → 1/11 | Y → **N** | 6 → 3 |
| B S05 | 79% → **35%** | 0.19 → **0.33** | – → 3/4 | N → N (reason declared) | 6/18 → **7/29** ✗ | Y → **N** | 10 → 7 |
| C S08 | 76% → 71%¹ | 0.33 → 0.49 | – → 0/2² | n/a (archival) | 4/15 → 3/10 | N → N | 7 → 5 |
| C S09 | 71% → 58% | 0.16 → **0.35** | – → 3/4 | N → **Y** | 3/11 → 4/19 | Y → **N** | 9 → 5 |
| D S12 | 69% → 70%¹ | 0.23 → 0.29 | – → 1/3² | n/a (document) | 5/30 → 5/26 | Y → **N** | 10 → 7 |
| D S13 | 81% → 69%¹ | 0.12 → 0.11 ✗ | – → 3/4 | n/a (document) | 7/23 → 5/28 | Y → **Y** ✗ | 9 → 8 |

¹ Overstated by the paper/sky limitation (§2). ² Small highlight or ring changes below the motion measure's sensitivity; visible in the stills.

**Window totals (time-weighted empty):**
- A 53% → 33%
- B 64% → 33%
- C 71% → 61%
- D 72% → 67%

Mechanism shots registered: A 0/1 → 1/1, C 0/1 → 1/1.

### A — Opening to joint

- **Change:**
  - S01 is unchanged (the hook is protected).
  - The camera never cuts. The same NASA photo continues; the frame reveals downward to fill 9:16, the photo desaturates, and the right booster's edges and its aft field joint are traced at measured positions.
  - The camera then follows the joint band to the booster wall, and the Commission's Fig. 14 grows out of the band (push-in), first whole, then closing on the two O-rings.
- **Phone scale:**
  - The traced lines sit on the real booster edges.
  - Fig. 14's own labels read at about 29 px in the wide view and about 40 px close up.
  - The crops were chosen so no Commission label is sliced (fixes V2's cosmetic issue).
- **Accuracy:**
  - The near booster in GPN-2000-001347 is the right SRB: the orbiter's belly faces the tank and its nose is up, so its right side faces the camera.
  - The smoke ring is V2's. The joint band is at the smoke's height (measured).
  - Fig. 14 is a generic cross-section of the joint, anchored to the wall whose orientation matches the drawing (outside on the left). It is not mirrored.
- **Remaining presentation-like elements:**
  - The Fig. 14 scan is still a white rectangle on a dimmed photo.
  - S01's headline and caption compete (unchanged V2 issue; 15 samples).

### B — Warm vs cold seal

- **Change:**
  - Two full-width groove cross-sections share one event. The sealing face moves away over **0.6 s in real time** (Commission, Finding 8a: opening "essentially complete at 600 milliseconds").
  - The warm ring springs out and keeps contact (green line); hot gas stops at it.
  - The cold ring stays squeezed, a gap opens, and the gas goes through.
  - Frost carries across from the icicle photo.
- **Phone scale:** temperatures 112 px, labels 32–44 px; the gap and gas path read clearly.
- **Accuracy:**
  - 28°F is the Commission's estimate for the right SRB aft joint (Finding 6a, ±5°F). 75°F is the top of its test range (Ch. IV).
  - **Recovery speeds are illustrative** and labelled so.
- **Remaining presentation-like elements:** 7 text elements at once (2 temperatures, 2 notes, clock label and value, GAP, source line). The next pass should merge the notes into the source line.

### C — Flame to tank

- **Change:**
  - **Film:** E-207 is full width over a blurred plate of itself (no void box). The camera closes on the flame, under a documented time stamp ("first flame T+58.788"; no invented running clock, since the film's playback speed is not documented here).
  - **Match cut:** the reconstruction starts at the flame's screen point and at the vehicle's angle in the film (−28°), then rights itself.
  - **Event clock (Commission Ch. III):**

    | Time | Event |
    |---|---|
    | 60.238 | plume deflects onto the tank |
    | 64.660 | hydrogen tank leak |
    | 72.204 | lower strut severed; the right booster rotates about its upper attachment |
    | 73.124 | aft dome drops away |

  - The film then cuts to the authentic breakup photo (V2 S10). No explosion is drawn.
- **Accuracy:**
  - Proportions come from published dimensions (ET 46.9 × 8.4 m, SRB 45.6 × 3.7 m); the booster offset is approximate.
  - The rotation direction and magnitude (5°) are illustrative.
  - The orbiter is drawn as an outline so the tank stays visible. Labelled "Reconstruction".
- **Remaining presentation-like elements:**
  - The stack is a symmetric technical drawing on a blueprint grid (58% of the frame is ground).
  - The leak and dome states are small at phone scale.

### D — Warning and decision chain

- **Change:**
  - **Evidence:** bar chart and flowchart replaced by authentic Commission reproductions:
    - Thiokol's initial chart (p. 90: "O-ring temp must be ≥ 53°F at launch");
    - the signed telefax (p. 97: "MTI recommends STS-51L launch proceed on 28 January 1986", Kilminster);
    - the Commission's finding, typeset (p. 82: "Those who made that decision were unaware…").
  - **Timeline:** a rail and stamp of the Ch. V chronology (EST): 8:45 PM → ~11:00 PM → ~11:45 PM → 11:38 AM launch.
  - **Scale:** one 25–65°F scale (53 vs 36) replaces the bars.
  - **Repair 2 (after the first render):** the evidence now accumulates as a case file instead of replacing itself, and rail labels are reduced to the endpoint. No further repair allowed.
- **Accuracy:**
  - "Their managers reversed" = Thiokol management (Finding 4: "reversed its position … contrary to the views of its engineers").
  - "Never heard it" is supported by p. 82 and by Ch. V's "never reached Jesse Moore or Arnold Aldrich, the Levels I and II program officials".
  - Times are approximate (~) in the source.
- **Remaining presentation-like elements (the main open item):**
  - The pages are static, with highlight sweeps; S13 is still measured slide-like.
  - 5 text tiers.
  - Needs real document motion (pages sliding into the stack, the camera travelling along the line) and fewer simultaneous text sizes.

## 4. Historical accuracy notes

- **New sources:** Rogers Commission Report Vol. 1, Ch. III (event table), Ch. IV (Findings 6a and 8a, resiliency tests) and Ch. V (chronology, findings, p. 82). New NASA scans: v1p90 (chart) and v1p97 (telefax), both public domain (US Government work). Recorded in `phase1/media-p1.json`.
- **No archival imagery was generated.** Every drawn element is labelled:
  - "NASA photo · traced";
  - "Animation · not to scale" (B, with "recovery speeds illustrative");
  - "Reconstruction · proportions approximate".
- **Corrected while working:**
  - V2's Fig. 14 primary O-ring coordinate (305) was right; my first re-measurement (289) was wrong and was reverted after the still check.
  - The flame-clock continuity of V2 (S08 running to about 61 s, then S09 restarting at 60.2 s, so time ran backwards) is removed in C.

## 5. Reusable animation components (`scripts/fr-premium/fr-forensic.js`)

| Component | Reusable parameters | Required source evidence | Required visual anchors | Human input | Automation opportunity | Generation time |
|---|---|---|---|---|---|---|
| `X.trace` + `X.mix/X.xf/X.apply` (registered trace and camera hand-off) | paths in source px, draw-on window, colour; camera {fx, fy, z, rot} keys | the photo's caption (what is shown) | 2–4 points per asset (edges, joint, point of interest) | place anchors (about 5–10 min per asset) | edge or line detection to *suggest* anchors; human confirms | in render; about 0.4 s per frame |
| `X.groove` (seal mechanics) | geometry box, gap(t), recovery τ, squeeze, follow, tint, frost, gas | the documented timing (e.g. 0.6 s) and temperatures; τ labelled illustrative | none (generic) | choose temperatures with citations | step type "seal-recovery" in the script schema → template | about 0.3 s per frame |
| `X.stack` (failure-state vehicle) | published dimensions, joint position, states plume / deflect / leak / strut / rot / dome | dimension source; event table | joint location; the film's flame point and axis for the match | confirm dimensions and states | other stacked vehicles via dimension sets; states from event tables | about 0.25 s per frame |
| `X.events` (evidence clock) | events {at, screen, key, dur, label, ev} | an event table with times (claim → passage) | word anchors from the narration timeline | none once events are extracted | fully automatic from structured event tables | negligible |
| `X.doc` (document plate with highlights) | media key, crop windows, highlight rects in source px | the scan and its page reference | highlight rectangles (the quoted line) | mark 1–3 rectangles per page (about 3 min) | OCR on the scan to find the quoted string's box | in render |
| `X.rail` + `X.stamp` (timeline) | ticks (ordinal), now(t), labels | a chronology with times and timezone | none | none | automatic from the chronology | negligible |
| `X.scale` (measure on one axis) | range, unit, markers {value, label, colour} | values with citations | none | none | automatic | negligible |
| `X.plate` (fill 9:16 behind non-9:16 media) | blur, dim | — | — | none | automatic for any inset film or photo | in render |

**What stays topic data, not code:** the anchors, events, document rectangles and dimensions sit at the top of each `phase1/proto-*.js` file with their evidence ids. The components are topic-free; there is no Challenger-specific geometry in `fr-forensic.js`.

## 6. Estimated automation effort

| Step to automate | Effort | Note |
|---|---|---|
| Plan schema (shot type, states, transition, register, primitives) produced by the shot planner instead of hand-written | 3–4 days | the format exists now; the planner does not |
| Anchor suggestion (photo edges, flame or point of interest) with human confirm UI | 4–6 days | the biggest human step; keep human confirmation |
| Event-table and document-rectangle extraction (OCR on Commission scans) | 3–5 days | fails closed when a quote is not found on the page |
| Templates from step types (seal, flow, stack-failure, document-trail, timeline, measure) | 1–2 weeks | B, C and D are the first instances |
| Creative QA from WARN to calibrated gates | after ≥ 5 films with owner scores | needs the sensitivity fixes in §2 |

**Per-video estimate once built:**
- **Machine:** about 25–35 min (full render about 7 min).
- **Human:** about 30–45 min (topic, script, anchors, final approval).
- **Cost:** $0 by default.

## 7. Validation

- **Focused tests:** `tests/js/fr-premium.test.js`, 13/13. New tests check:
  - the prototypes replace exactly the intended shots and the film still tiles;
  - every rebuilt shot declares a grammar transition, states with evidence and registration (or a reason);
  - the event clock uses the Commission's times in order;
  - the components behave (warm seals, cold leaks).
- **Full suites:** JS 630/630; Python passes (`tests/test_fr_creative_qa.py` runs with numpy and is skipped without it).
- **Hard gates on the prototype film:** `text-qa.js` 0 FAIL / 0 WARN on 207 samples.
- **Isolation:** the test now also scans `phase1/`. No upload, paid-provider or credential path appears; production does not reference the prototype.

## 8. Recommendation for one final V3 render

Render V3 **once**, after:
1. The owner watches the four clips (`*-vs-v2.mp4`) at phone size and approves A, B and C, or names changes.
2. **D gets one design pass:** physical document motion (pages slide into a stack, the camera travels along the quoted line), at most 3 text sizes, the rail without labels except LAUNCH.
3. **B's text is merged:** the notes go into the source line, leaving at most 4 text elements.
4. Optionally, the S01 headline and caption no longer compete. This is V2's remaining hierarchy issue; it touches the protected hook, so it is the owner's decision.

Then run every gate on the full V3: technical hard gates, text QA, creative QA as WARN, and owner listening (still pending from V2; audio is unchanged). Do not render V3 before step 1: the prototypes exist so that decision can be made on 33 s of footage instead of 52.

## 9. Artifacts

| Location | Contents |
|---|---|
| Local, git-ignored: `reports/challenger-premium-2026-10-12/phase1/` | for each of A–D: the prototype `.mp4` (V2 audio), the `-v2.mp4` window, the `-vs-v2.mp4` side by side, and the `-contact.png` before/after |
| Draft release `pilot-challenger-premium-v1-2026-10-12` | the same files plus an updated `SHA256SUMS.txt` (see the PR) |
| Records | `channels/failure-reconstructed/premium/challenger-1986/phase0/` (V2 baseline) and `phase1/qa/` (per-window creative QA, text QA, shots) |
