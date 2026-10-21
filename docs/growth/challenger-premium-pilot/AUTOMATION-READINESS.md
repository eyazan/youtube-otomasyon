# Premium Shorts engine: foundation and automation readiness (2026-10-13, updated 2026-10-14)

## Update 2026-10-14: automation measurement (six separate measures)

| # | Measure | Value | What it means |
|---|---|---|---|
| 1 | **Data-driven rendering coverage** | **15 / 15 shots (100%)**; 0 legacy-code shots; plan VALID (0 errors, 0 warnings) | every Challenger shot renders from `shot-plan.json` through registered templates; no hand-written scene code is executed |
| 2 | **Automatically generated shot plans** | **0 / 15** | the plan is **hand-authored JSON** (by Claude, in this session). The planner (beat → template → parameters) is not built. This is data-driven rendering, **not automated production**. |
| 3 | **Manual visual anchor work** | 21 anchors, all hand-measured (6 manual-measure on photos and film, 14 document-layout on scans, 1 caption-located) | about 5–10 min each; anchor suggestion is not built |
| 4 | **Manual research** | 38 claims from 12 sources, all verified. Passages are extracted verbatim by script (`plan/build_evidence.py` fails if a passage is not found), but **finding sources and choosing claims is manual**. This round needed 1 web search plus a PDF read for the SRB length, and 1 caption check for the film time base. | |
| 5 | **Manual storyboard adjustments** | 113 narration time anchors, 37 timing windows, 33 camera keys and 293 numeric visual parameters, all set by hand. **This round:** S06 took 4 still or clip iterations (ring rim, gas stream, combustion pressure, label overlap); S05 and S07 needed 1 label or framing fix each. | the largest remaining manual cost |
| 6 | **Human approval requirements** | topic; claim verification; anchors; plan or storyboard review; final video at phone size; narration voice (still unapproved); the existing publishing gate | unchanged by the engine; the engine makes each gate checkable (validator, text gate, creative QA) |

**Rendering comparison with V3** (`plan/qa/stills-vs-v3.json`):
- **Byte-identical:** S01, S04, S10, S11, S14, S15.
- **Essentially identical:** S03, now the data-driven `document-zoom` (78 / 41 dB).
- **Intended changes:**
  - S05: the "GAP ×2.6" disclosure;
  - S06: the new `joint-mechanism`;
  - S07: the documented film clock, full-width framing;
  - S09: the evidenced dimensions, the "APPROX." clock and "proportions approximate";
  - S12 and S13: "~" on approximate times.
- **Generic curve differences:** S02, S08.

**Scene clip S03–S07** (`reports/…/engine-s03-s07/`, creative QA in `plan/qa/creative-qa-S03-S07.json`):

| | Empty | Subject motion | Labels / words | Slide-like |
|---|---|---|---|---|
| S07 | 46% → **13%** | 0.27 → 0.30 | — | — |
| S06 (V3 → engine) | 45% → 48% | 0.13 → **0.22** (target 0.25) | 7 / 19 → 4 / 19 | **numbered step titles removed** |
| Window | — | — | — | 1 → **0** |

**S06 remains the weakest shot.** It is below the motion target, and its empty background is slightly worse than V3. Owner review is needed before any further tuning.

**Remaining manual workload for a second topic:** claims (3–5 h), anchors (about 2 h), hand-authored plan (4–6 h), storyboard iterations (1–3 h), review (1–2 h). That is **about 1.5–2 working days**, with the planner and anchor suggestion as the next reductions.

---


**Implementation of phases 1–4** of `AUTOMATION-ARCHITECTURE.md`.
- No video rendered: stills and text inspection only.
- Nothing published; no paid API; no change to workflows, Cloudflare, schedules or voice approvals.
- V3 is preserved: its source is untouched, and the data-driven version runs beside it.

## 1. What was built

| Part | Files | Notes |
|---|---|---|
| Evidence schema | `scripts/fr-premium/engine/schemas/evidence.schema.json` | sources and claims; each claim has kind, source, verbatim passage, value/unit/display and status (verified / unverified / disputed) |
| Asset schema | `…/schemas/assets.schema.json` | licence (public-domain, cc0, cc-by, cc-by-sa; attribution required for BY), dimensions, clip window, **anchors** (point / rect / angle / length, space, method, basis, optional claim) |
| Shot-plan schema | `…/schemas/shot-plan.schema.json` | per shot: beat, line, template, start/end narration anchors, provenance, evidence ids, assets, params, transition (type, reason, fade), QA expectations (narration-timed states, min states, registered), manual reason |
| Channel pack | `…/schemas/channel-pack.schema.json`, `…/channels/failure-reconstructed.json` | allowed styles, templates, transitions, provenance kinds, illustrative labels |
| JSON Schema validator | `…/engine/jsonschema.js` | no new dependency; standard draft 2020-12 keyword subset, so it can be swapped for a full library like Ajv later |
| Narration time references | `…/engine/timeref.js` | `line:L4 -0.1`, `word:L10:fifty-three +0.2`, `wordEnd:…`, `end -0.35`; shared by the validator and the page |
| Template registry | `…/engine/templates/*.js` | `archival-plate`, `trace-over-photo`, `joint-section`, `document-desk`, `event-sequence`, `timeline`, `payoff`, plus the `legacy-code` bridge. Each declares a parameter schema with `x-factual` / `x-onscreen` / `x-anchor` / `x-time` / `x-illustrative` annotations, allowed provenance, emitted states and a builder that reuses `fr-lib` / `fr-forensic` |
| Resolver | `…/engine/fr-plan.js` | turns a plan into renderer shots; registered matches via the previous shot's `screenOf(anchor)` |
| Validator CLI | `…/engine/validate.js` | `node scripts/fr-premium/engine/validate.js <shot-plan.json>`; exit 1 on errors |
| Renderer | `render-vertical.js --plan` | media from `assets.json`; existing modes unchanged |
| Challenger data | `channels/…/challenger-1986/plan/{evidence,assets,shot-plan}.json` | 35 claims from 11 sources, 10 assets, 17 anchors, 15 shots |
| Tests | `tests/js/fr-engine.test.js` (27 tests) | §4 |

### Validation rules (all blocking unless marked)

1. **Schemas:** evidence, assets, plan and channel pack.
2. **Channel:**
   - `channels/<slug>/config.json` exists, matches the plan and is enabled;
   - a channel pack exists;
   - the style, templates, transitions and provenance kinds are allowed for that channel.
3. **Claims:**
   - the source exists;
   - a verified fact, estimate, quote or measurement has a passage;
   - **the value appears in its passage** as written (`valueAsWritten` for forms like "27 1/2");
   - **every number in the claim's on-screen display** is its value or appears in the passage;
   - referenced claims must be **verified**.
4. **Assets:**
   - a licence from the allowed list, with attribution for BY licences;
   - every anchor is inside the image or clip frame;
   - an anchor's claim must exist and be verified.
5. **Shots:**
   - the template exists and may carry the shot's provenance;
   - parameters pass the template schema (an unknown key is an error);
   - **factual parameters must be `claim:` references**;
   - **on-screen numbers must come from claim placeholders.** Citation locators (Vol. 1, p. 90, Ch. III) and identifiers taken from the asset's own label or title (E-207, STS-51-L) are allowed; bare numbers never are;
   - anchors exist and their asset is listed;
   - **traced paths and callouts must lie on the anchor they cite**;
   - explanatory or reconstruction shots must cite evidence;
   - illustrative parameters require a visible label (not to scale / illustrative / approximate / reconstruction);
   - a declared exaggeration must show its factor on screen.
6. **Timing:**
   - every narration anchor resolves (line or word spoken);
   - start < end;
   - shots tile from 0 to the film end;
   - QA states fall inside their shot;
   - the template's minimum number of narration-timed states is met.
7. **Manual work:** `legacy-code` shots must state `manual.reason`. They are reported as **warnings** and counted.

## 2. Challenger migration result

```
$ node scripts/fr-premium/engine/validate.js channels/failure-reconstructed/premium/challenger-1986/plan/shot-plan.json
ERROR  S09: evidence: claim C-srb-length is unverified (V3 used 45.6 m from general knowledge; no primary source recorded yet …)
ERROR  S09: params.dims.srbLength: claim C-srb-length is unverified (…)
WARN   S03: custom code (manual): Fig. 14 grows out of S02's traced band …; needs a document-zoom template
WARN   S06: custom code (manual): hand-drawn joint rotation and blow-by with numbered step titles …
WARN   S07: custom code (manual): running clock from 2.7 s to 58 s …: the 2.7 s start value has no evidence
shots 15: 12 data-driven, 3 legacy code; claims used 35; assets used 10
INVALID (2 errors, 3 warnings)
```

**The single blocking error is real.**
- V3's flame-to-tank reconstruction draws the booster at 45.6 m. That value came from general knowledge, and no primary source is recorded. The Rogers report gives the External Tank (154 ft × 27 ½ ft, Ch. I) and the motor case diameter (about 12 ft), but not the booster's overall length.
- The engine therefore refuses to approve the shot until someone records a primary source. This is an accuracy gap in V3 that the hand-written code did not expose. It is now listed in V3's to-dos.
- A test shows that recording a verified passage for that claim makes the whole plan valid.

**Data-driven output vs V3** (stills at 35% and 80% of every shot; `plan/qa/stills-vs-v3.json`):

| Shots | Result |
|---|---|
| S01, S04, S05, S10, S11, S14, S15 | **byte-identical** to V3 (14 / 14 stills) |
| S12, S13 | 2 of 4 identical; 64 dB / 28 dB on the others: the timeline rail's moving marker starts its step 0.1 s earlier (generic step lead-in) |
| S08 | 47–56 dB: a camera key 0.02 s later (V3 used two slightly different times for zoom and centre) |
| S09 | 32–34 dB: **intended**. The plan uses the evidence values (tank diameter 27 ½ ft = 8.38 m and case diameter 12 ft = 3.66 m, instead of V3's rounded 8.4 / 3.7; strut "about 72.20 s" instead of 72.204) |
| S02 | 20–21 dB: the generic log-zoom camera curve differs from V3's hand-blended curve, so the photo sits a few pixels differently; trace, callouts and timing match |
| S03, S06, S07 (legacy) | identical by construction (same code) |

The unchanged hard text gate passes on the plan-driven film: **0 FAIL / 0 WARN, 207 samples**. The first caption starts at 0.5 s (the V3.1 correction).

## 3. Automation readiness

| Measure | Value |
|---|---|
| Challenger shots expressed without custom scene code | **12 / 15 (80%)** |
| Shots that still need manual (custom) code | 3: S03 (document-zoom registration), S06 (joint rotation; to be rebuilt per the visual spec), S07 (film clock without a documented time base) |
| Blocking evidence gaps found | 1 (SRB overall length) |
| Claims | 35 from 11 sources: 34 verified (31 with passages extracted verbatim from the Commission pages and NASA captions, 2 transcribed from the scanned Thiokol documents, 1 editorial line without a passage), 1 unverified |
| Assets | 10 (all public domain, licence recorded); 17 measured anchors, each with method and basis |
| Templates | 7 + legacy bridge; 6 used by Challenger, `timeline` covered by tests |

**What is reusable vs topic-specific:**

| Class | Contents |
|---|---|
| **Reusable rendering engine** | `render-vertical.js` (incl. `--plan`), `fr-lib.js`, `fr-forensic.js`, `engine/jsonschema.js`, `timeref.js`, `fr-plan.js`, `validate.js`, `qa-vertical.js`, `text-qa.js`, `creative_qa.py`, audio tools |
| **Parameterised templates** | `archival-plate`, `trace-over-photo`, `joint-section`, `document-desk`, `event-sequence`, `timeline`, `payoff` (channel-scoped through the pack) |
| **Topic-specific evidence** | `plan/evidence.json` (claims and passages), `plan/assets.json` (licences and anchors) |
| **Scene parameters** | `plan/shot-plan.json`: camera keys, windows on narration words, layout numbers. Data, but still hand-authored today |
| **Human approval** | claims and passages (verification), anchors (measurement), the shot plan (until the planner exists), storyboard and final review, voice |

**Manual intervention still required today:**
1. Extracting and checking claim passages. `plan/build_evidence.py` extracts them verbatim and fails if a passage is not found, but choosing the claims is manual.
2. Measuring anchors (17 for Challenger).
3. Writing the shot plan's visual parameters (camera keys, windows).
4. The three legacy shots.

## 4. Tests (`tests/js/fr-engine.test.js`, 27; full JS suite 657/657, Python OK)

| Area | What fails as expected |
|---|---|
| Missing evidence | an undefined claim; an explanatory shot citing nothing |
| Invalid claims | an unverified claim used; a value not in its passage (value checked separately from the display); a verified fact without a passage; an unknown source |
| Asset licences | a licence missing; CC-BY without attribution; a licence id not allowed |
| Anchors | an unknown anchor; an anchor outside the image; an asset not listed; **a traced path off its anchor** |
| Unsupported reconstruction | illustrative values without a visible label; a declared exaggeration without its on-screen factor |
| Unsupported parameters | an unknown key; a value outside its enum; a literal factual value; an on-screen number not from a claim (citations and identifiers allowed, bare numbers not) |
| Transitions | a type outside the channel grammar; a missing reason |
| Templates | an unknown template; legacy without a reason; provenance the template cannot carry |
| Narration anchors | an unknown word; an unknown line |
| Timing | end ≤ start; a gap or overlap; past the film end; a QA state outside its shot; too few states |
| Channel configuration | an unknown channel; a channel without a pack; the wrong style |
| Registry / schemas / resolver | every template has a schema and a builder; Challenger data passes the schemas; the resolver builds 15 tiled shots with the registered match; the engine is isolated from publishing, paid or credential paths |

The existing QA gates are unchanged. The isolation test now also walks `scripts/fr-premium/engine/`.

## 5. Remaining development effort

| Work | Estimate |
|---|---|
| `document-zoom` template (S03: a document grows out of a traced anchor) | 2–3 days |
| Film clock with an evidenced time base (S07) | 1 day + finding the time base in the record |
| Joint-section v2 with rotation and blow-by + the engineering visual system (S06, `ENGINEERING-VISUAL-SYSTEM.md`) | 2–2.5 weeks |
| Planner: beat → template choice, default parameters per template (camera keys from anchors and words), so plans are generated, not written | 1–1.5 weeks |
| Anchor-suggestion and confirm UI | 4–6 days |
| Claim-extraction assist (passage search across sources, value checks) | 3 days |
| Storyboard-stills gate and approvals record | 2 days |
| Second-topic mechanism template (e.g. load path) | about 1 week |
| **Total** | **about 6–7 weeks** (visual system and planner in parallel) |

## 6. Expected human effort for a second topic

| Stage | Today (with this foundation) | After the planner and assist tools |
|---|---|---|
| Claims and passages | 3–5 h (the validator now guarantees completeness) | 2–3 h |
| Assets, licences, anchors | 2–3 h | about 45 min |
| Shot plan | 4–6 h of JSON parameters (no code) | about 30 min of review |
| New mechanism template (if the topic needs one) | part of development, not per video | — |
| Storyboard and final review | 1–2 h | 1 h |
| **Total** | **about 1.5 working days** (was 2–3 days with hand-written code) | **about 5–6 h** |
