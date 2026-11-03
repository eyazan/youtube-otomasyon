# Four-channel premium production — status and changes (2026-11-03)

Branch `claude/festive-albattani-89xfxx`, built on PR #387 (`fix/ib-units-visual-mechanism`, head 66eaa508) and
PR #386 (`feat/ib-hook-gate`). Nothing here merges, publishes, uploads, changes a video or flips a production
flag. Every verdict below comes from real renders and read CI logs, not from job status alone.

## 1. Readiness decision per channel

| Channel | Decision | Evidence | What blocks production |
|---|---|---|---|
| ImpossibleBrief | **READY_FOR_HUMAN_REVIEW** (EAR-001, EAR-019) | CI run 41688507762: final 1080×1920, approved Edge voice, objective QA PASS on both, text gate 0 FAIL | named Creative Director PASS + human review of the HUMAN lines (`research/reviews/<id>.json`); merge of this branch |
| Failure Reconstructed | **BLOCKED_WITH_ACTIONABLE_FIX** (premium); legacy lane keeps publishing | El Faro preview: QA PASS, creatively weak (below) | forensic visual grammar; case files without verbatim quotes |
| The Hidden Logic of Things | **BLOCKED_WITH_ACTIONABLE_FIX** | BTO-156 renders after two P0 fixes; creatively fails the brief | mechanism drawings instead of paper cards; channel inactive by owner decision |
| GoalLore Lab | **BLOCKED_WITH_ACTIONABLE_FIX** | GLL-021 preview: distinctive, validates; 21.6 s < 25 s minimum with the preview voice | owner voice approval, research review, channel `enabled:false` |

No channel is PRODUCTION_READY: none has a recorded human creative approval, and that approval is not something
this system may produce.

## 2. Blockers found (verified, not assumed)

**P0 — production blocking**
- IB NO_TOPIC every run (production-stages.json, 2026-11-03): of 500 topics, 498 had no declared visual mechanism,
  485 no claim ledger, 474 below the viral minimum 75, 346 unresearched. 0 qualified.
- The viral minimum is a hard gate on a predictor the channel's own calibration calls WEAK: Spearman ρ = 0.05
  (n = 17) against published outcomes (`state/growth/predictions.json`). It refused 130 of 135 researched topics.
- BTO-156 (the only renderable Hidden Logic topic) could not render: the schema refused primary-source fact ids
  (`P1–P3`) and the validator read a quote card's revision id as an unevidenced claim.
- Mastering let intersample peaks through: −0.5 dBTP after AAC on a brighter voice (limit −1).

**P1 — visual and creative quality**
- IB-EAR-001 (Creative Director, 66eaa508): 6 of 9 shots the same globe; gravity line without a visual; poles payoff
  not visible. The "planet" was random blobs, not Earth.
- IB-EAR-019: "takes far longer" showed no atmosphere; "183 times" overstated a lower bound ("at least 183").
- FR premium grammar: one wireframe ship ×4, failure-chain cards ×3; no storm, flooding, list or sinking shown.
- HLT auto grammar: paper cards and quote slides — the "text slides" the brief rules out.

**P2 — audience and packaging**
- Median average view duration 6.8–8.3 s on 25–30 s Shorts (below): viewers leave in the opening.
- API uploads send no `defaultLanguage`/`defaultAudioLanguage`; every channel uploads as category 27.

**P3 — operations**
- `premium-review-render.yml` shares one concurrency group: GitHub keeps one pending run, extra dispatches are cancelled.

## 3. Changes implemented

| Change | Files |
|---|---|
| `globe`: orthographic Earth from Natural Earth 1:110m coastlines (public domain), physical west→east spin, terminator, atmosphere shell, parallels, east arrows of length cos(latitude), markers | `scripts/bto-studio/page/components/globe.js` |
| `ground-frame`: inertia from the surface (ground stops, person keeps speed), gravity/velocity vectors with units; conceptual-labelled | `page/components/inertia.js`, `validate.js` |
| planet-rotation grammar: hook stop → inertia → equator → forces → slide → latitudes → pole tilt (7 distinct views) | `auto/impossible-brief.js` |
| magnetic world on the real globe; air line shows a labelled atmosphere under arriving particles; "at least" kept | `auto/impossible-brief.js` |
| narration fixes: EAR-001 L5 "only the ground can slow you down" (friction); EAR-019 L3 "at least 183" | `topic-universe.json` |
| new component labels are evidence-checked like all on-screen numbers (tested) | `validate.js`, tests |
| 4× oversampled limiter at −3 dBFS (true peak −0.5 → −3.0 dBTP in CI) | `scripts/fr-premium/mix-audio.js` |
| calibration-aware viral gate: ranks above a floor (62) while ρ is not PREDICTIVE; opt-in per channel (IB only) | `core/pipeline/premium-lane.js`, `channels/impossible-brief/growth-engine.json` |
| topic funnel + remediation queue (six stages, nothing dropped) | `scripts/growth/topic-funnel.js`, `reports/premium-topic-funnel.md` |
| claim ledgers for 91 more IB topics, generated in CI (92 of 105 fully VERIFIED) | `channels/impossible-brief/research/claim-sources/` |
| attributed visual-mechanism decisions (refuses undrawable mechanisms, requires `--by`) | `scripts/ib-research/declare-mechanism.js` |
| BTO: `P` fact ids citable; credit lines are attribution | `schemas/storyboard.schema.json`, `validate.js` |
| upload `categoryId`, `defaultLanguage`, `defaultAudioLanguage` per channel (GLL → 17 Sports) | `youtube-yukle.js`, `channels/*/config.json` |
| baseline analytics, format-separated | `scripts/growth/premium-baseline.js`, `reports/premium-baseline.md` |

ProfitDecoded: untouched.

## 4. Topic supply after the changes (IB)

| stage | before | after |
|---|---|---|
| RENDERABLE | 0 | 2 (EAR-001, EAR-019) |
| one human decision away (mechanism only) | 0 | 90 |
| needs verification | 485 | 39 |
| unresearched | 346 | 344 |

The 90 need one attributed call each, e.g.
`node scripts/ib-research/declare-mechanism.js IB-SPA-001 planet-orbit --by "<name>"` after reviewing
`--list`. Proposals come from the word classifier and are wrong often enough (e.g. "Ceres a planet → orbit") that a
person must choose; topics whose mechanism has no drawing stay held.

## 5. Real MP4 validation

| Topic | Where | Voice | Objective QA | Notes |
|---|---|---|---|---|
| IB-EAR-001 | CI run 41688507762 (artifact `premium-review-render`), frames `review/render-41688507762` | Edge Brian Multilingual (approved) | PASS | sha256 `7a792484…f2bc` |
| IB-EAR-019 | same run | same | PASS | sha256 `22e2c5dd…0e65` |
| FR-el-faro-2015 | CI run 41688512604, frames `review/render-41688512604` | approved Edge voice | PASS | sha256 `f0541c3e…0641`; Creative Director flags THIN on 8/8 scenes, LOW_NOVELTY, LOW_MOTION: creative FAIL, below |
| GLL-021 | CI dispatch (see PR) + local preview | Edge Ryan (not approved) / Kokoro | FAIL duration (preview voice) | |
| BTO-156 | local preview | Kokoro (preview) | FAIL duration 25.3 s < 30 s | creative FAIL |

Before/after (EAR-001): `docs/premium-studio/evidence/2026-11-03/ib-ear-001-before-after.jpg`.

## 6. Creative review findings (preliminary, AI; not an approval)

- **EAR-001** — resolved: seven distinct views; gravity has its own force diagram; payoff tilts over the pole with
  arrows shrinking as cos(latitude) to "ZERO AT THE POLE"; Earth is the real coastline. Open: the inertia shot keeps
  the figure upright while gliding (the feet would be dragged); loop continuity WARN (payoff ends over the pole).
- **EAR-019** — resolved: atmosphere drawn and labelled under arriving particles; "AT LEAST 183 TIMES". Open: L6
  (satellites, power grids) and L7 (air not lost in a day) are ESTIMATED CONSEQUENCE lines with no claim-specific
  fact — a person must accept them or research must add sources; the satellites line shows no satellite.
- **FR El Faro** — fails "the viewer should understand the failure through the visuals": no hurricane, route, open
  scuttle, list, or sinking. Fix: a forensic ship grammar (route vs storm track, hull section with flooding and list,
  propulsion state) — and verbatim-quoted case facts first, so the drawing never exceeds the sources.
- **HLT BTO-156** — fails the brief: blank paper cards and quote slides, no door mesh or wavelength comparison.
  Fix: a declared-mechanism layer like IB's (here: aperture vs wavelength), before reactivating the channel.
- **GLL-021** — on-brand and distinct (floodlit pitch, scoreboard, tokens, RECONSTRUCTION chip). Open: the dribble
  doesn't show five distinct defenders being passed; runtime under the 25 s floor with the preview voice.

## 7. Approvals still required (owner)

1. EAR-001, EAR-019: review the CI MP4s; record `research/reviews/<id>.json` with the HUMAN-line review and a named
   Creative Director verdict (`core/research/claim-sources.js` publicationHolds).
2. Merge decision for this branch (and #386/#387, which it contains). #386's gate stays `enabled:false` until approved.
3. Mechanism decisions for the 90 IB topics (section 4).
4. GoalLore Lab: voice choice, research review (`docs/review/goal-lore-lab-approval.md`), channel activation.

## 8. Baseline analytics (warehouse through 2026-10-31; `reports/premium-baseline.md`)

| Channel | Shorts | Views | Median views | Median % viewed | Median avg view | Net subs |
|---|---|---|---|---|---|---|
| ImpossibleBrief | 20 | 14,445 | 700 | 64.4 % | 8.3 s | 12 |
| Failure Reconstructed | 36 | 21,206 | 442 | 64.2 % | 6.8 s | 33 |
| GoalLore Lab (CT history, deleted) | 8 | 1,583 | 47 | 61.5 % | 5.6 s | 0 |
| Hidden Logic | 0 measured | — | — | — | — | — |

Shorts-feed traffic is 81–92 % of views. Not in the warehouse (reported unavailable, not zero): viewed-vs-swiped,
impressions, CTR, retention curves, returning viewers, geography. Patterns, not conclusions (n is small):
top IB Shorts are concrete, high-stakes scenarios (ITER, fungi, Death Valley); top FR are famous disasters with a
named moment (Challenger "73 seconds"). Two IB and two FR uploads show 0 views — check their visibility in Studio.

## 9. Proposed 30-day experiments (hypothesis-driven; none conclusive at current n)

1. **Opening visual** (H: average view duration is lost in the first seconds). Alternate premium Shorts whose frame 0
   is the mechanism in motion (EAR-001-style stop) against title-card openings; compare viewed-vs-swiped in Studio
   (not in the API warehouse) and avg view duration per format. Minimum 8 per arm before reading.
2. **Topic class** (H: concrete named-place/object scenarios beat abstract ones). Tag published IB Shorts by class;
   rank selection by class only after ≥ 10 per class.
3. **Re-calibrate the viral score** monthly; restore the hard minimum automatically when ρ becomes PREDICTIVE (built in).
4. **Title test** only where YouTube's own Test & Compare is available for the format; no metadata churn otherwise.

## 10. Channel optimisation

Done in code (affects future uploads only): explicit language and category per channel. `containsSyntheticMedia`
logic unchanged (still declared for realistic synthetic scenes); `selfDeclaredMadeForKids:false` unchanged — none of
the four is child-directed.

Needs YouTube Studio (not available through our API scopes; vidIQ is connected to GoalLore Lab only):
- Settings → Channel → Basic info: channel language English for all four; descriptions that state the format.
- Settings → Upload defaults: language English, captions certification N/A; note API uploads ignore these.
- Customisation → Layout: a Shorts shelf and a featured section once ≥ 6 premium Shorts exist.
- Content → the 0-view IB/FR videos: confirm they are public (no visibility change was made).
- Do not change country to the US for reach; it does not grant it.

## 11. Costs

No paid service was added. Edge TTS is free; Kokoro is a local preview fallback. A premium Short renders in
~2.5–5 min on a standard GitHub runner (CI run: 2 IB Shorts in 5 min 12 s, 1080×1920, no GPU). Four channels × one
Short/day ≈ 20 runner-minutes/day plus QA (~600 min/month), within the free tier for public repositories; for a
private repository at $0.008/min ≈ $5/month. Blender/GPU rendering is not needed for the current motion-graphics
approach and was not introduced.

## 12. Rollback

Every change is on this branch. Selection: delete `premiumSelection` in `channels/impossible-brief/growth-engine.json`
to restore the hard minimum. Upload metadata: remove the `upload` block (falls back to category 27, no language).
Renderer: the globe/ground-frame are used only by the `planet-rotation` and `magnetic-field` grammars; reverting
`auto/impossible-brief.js` restores the previous drawings. Duplicate protection is unchanged (`youtube-yukle.js`
idempotency journal and remote reconciliation).
