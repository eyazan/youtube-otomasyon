# Premium engine: checkpoint (resume here)

Each priority appends a section: completed work, test results, commit, blockers, exact next action. Nothing here
changes a schedule, a credential or a publish flag; production changes are owner actions.

## Priority 1: IB release state (2026-10-22, `b775dba`)

- PR #316 on `e53c210`: all 7 checks green, verified via GitHub:
  - Testler run 39744749874: `test`, `hazirla`, `denetim-testi`, `uctan-uca` ×2.
  - `load` run 39744749880.
  - IB dry run 39744749960: success.
- **What the dry run measured, from the job log:**
  - **Survey:** 30 topics; 6 formerly blocked topics fail again and stay blocked, 21 pass.
  - **Buffer:** 0 → 21 days, runner-local only (nothing persisted to main).
  - **Live lane:** selected IB-EAR-019 (viral 77, A); production score 88 → PUBLISH; upload skipped.
  - **Premium shadow:**
    - Started only after the live lane finished, on the same topic.
    - Approved Edge voice; objective QA PASS (−14.1 LUFS, −2 dBTP).
    - Verdict SHADOW_OF_LIVE_NOT_PUBLISHABLE; the publish gate blocks it at TOPIC_READY.
    - 195 s total, 137.5 s render.
- **Defects found by that run and fixed in `b775dba`:**
  - Tracked evidence under `channels/impossible-brief/premium/` was rewritten by the shadow, and production
    (`git add channels`) would have committed it. Fixed by moving the evidence to
    `docs/premium-studio/evidence/impossible-brief/`.
  - Chromium memory was an RSS sum (5539 MB) and overstated real use; it is now a PSS sum.
  - The frame review crashed when a package had no MP4; it now runs only where a video exists.
- **Next action:** CI on `b775dba`; owner merge → Topic buffer `commit=false` → `commit=true` (`ib-activation.md` §3).

## Priority 2: production gap inventory (verified 2026-10-22)

**Pipeline**

1. Scheduler (`portfolio-production.yml`, 16 cron slots, `PUBLISH` per channel).
2. Topic selection (`core/growth`).
3. Research or readiness (per channel).
4. Script (per channel).
5. Premium storyboard (`scripts/bto-studio/auto/<channel>.js`).
6. Narration (Edge, CI only).
7. Render (`scripts/bto-studio/render.js`).
8. QA (`qa.js`).
9. Publish gate (`publish-gate.js` and `lifecycle.js`).
10. Uploader (`youtube-yukle.js`, existing).
11. Publication verification (existing).
12. Analytics (existing warehouse and growth feedback).

**Status per channel**

| Responsibility | FR | IB | BTO (Hidden Logic) | GoalLore Lab |
|---|---|---|---|---|
| Live production (stock renderer) | PRODUCTION (29 uploads, last ajka-red-mud-2010 2026-10-21) | PRODUCTION (19 uploads; skipping since 10-20, fix in PR) | INACTIVE by owner decision 2026-10-11 | the channel is CriticalThread's (see identity) |
| Topic inventory | PRODUCTION `icerik/konular` 377 + library | PRODUCTION 500, 21 qualified (dry run) | 525, 518 QUESTION_ONLY | 109 candidates, no research |
| Research and evidence for the studio | NOT IMPLEMENTED: the studio adapter reads the legacy universe, not `icerik/konular` (sahneler, kaynakca, vaka.zincir) | DRY RUN (136 ready) | ISOLATED PILOT (5 VERIFIED, 4 quoted) | BLOCKED (no research) |
| Automatic storyboard | NOT IMPLEMENTED (fr-premium planner needs human anchors) | DRY RUN | NOT IMPLEMENTED (hand-authored pilots) | NOT IMPLEMENTED (hand-authored pilot) |
| Components | ISOLATED PILOT (`fr-premium` templates; studio has timeline, image-plate, exploded-layers) | DRY RUN (space pack) | ISOLATED PILOT | ISOLATED PILOT (pitch, stadium, spiral) |
| Approved narration | PRODUCTION (Edge Andrew, live) | PRODUCTION / DRY RUN (Edge Brian) | Edge Emma (approved for BTO) | BLOCKED (Ryan is a candidate, not approved) |
| Premium shadow in the daily entry point | NOT IMPLEMENTED | DRY RUN (`IB_PREMIUM_RENDER=preview`) | n/a (inactive) | n/a |
| Premium publishing | NOT IMPLEMENTED (by design) | NOT IMPLEMENTED (by design) | NOT IMPLEMENTED | NOT IMPLEMENTED |

**GoalLore Lab identity (verified)**

- **ID match:** the CriticalThread credentials authenticate as `UCBTEWcPZvo4B71hFw9Do_NA` (`saglik.js` health check on
  main, 2026-10-21).
- **Public metadata:** that channel is now titled **GoalLore Lab** and says "Every goal has a story". It reports 0 public
  videos, and its description says "PitchLore" in one place (an owner's copy-edit).
- **Migration needed:** CriticalThread's 8 published rows are preserved in its state. GoalLore Lab is not registered.
  The safe migration is to retarget the existing `critical-thread` registry entry (same credentials, same channel ID),
  not to add a second entry pointing at the same account.
- **Live risk (owner decision, not changed here):** the `critical-thread` lane is still scheduled with `PUBLISH=1`. It
  produces nothing today (0 qualified topics; last upload 2026-10-13), but any qualifying CriticalThread topic would be
  uploaded into the GoalLore Lab channel. Pausing it is a production change: remove `critical-thread` from the
  schedule's channel loop, or skip the "CriticalThread Short" step.

**Exact next action:** Priority 3, IB storyboard variety. The Creative Director flags SAME_ENV_AS_PREVIOUS on every
IB-EAR-019 scene, and two scenes are THIN.

## Priority 3: IB storyboard variety (`2328006` + follow-ups)

- Worlds chosen from the topic's own words: magnetic, current, lake, micro, body (generic figure), earth-surface, named
  bodies (Venus/Mars/Moon), plus the earlier earth-interior, ocean-depth, orbit, sky and cosmos.
- New space components: magnetosphere, flow-arrows, microbes, event-ticks.
- **Fixes from frame review** (IB-EAR-019, IB-EAR-071 local preview renders, Kokoro voice marked unapproved):
  - Plates alternate instead of every scene using "space".
  - The field stays off after "switch it off".
  - Ranges show as one figure.
  - Refuted figures are struck through.
  - No % ladders; log scale for wide ladders.
  - Composite worlds reframe instead of repeating one composition.
  - Contractions are kept whole.
- **Evidence guard:** every on-screen digit group must be in a cited fact, checked with the validator's rule.
- **Results:** all 136 ready IB topics validate (0 errors). Tests: `tests/js/ib-premium.test.js` 8/8.

## Priority 4: Failure Reconstructed on the shared studio

- `adapter.loadTopic("failure-reconstructed", slug)` reads the researched case file `icerik/konular/<slug>.json`.
  Readiness uses FR's own ledgers; 332 of 377 case files are ready (unpublished, not produced/failed/in review/blocked).
- **Generator:** `scripts/bto-studio/auto/failure-reconstructed.js`. Grammar:
  - hook: the object class gives way;
  - toll: the case count;
  - chain: the five-link chain scrolls;
  - trigger close-up;
  - contrast;
  - lesson payoff.
- **Components** (`page/components/engineering.js`): failure-chain (scrolling screen window), object-silhouette
  (13 generic classes), blueprint plate.
- **Results:** all 332 ready cases validate. Tests: `tests/js/fr-studio.test.js`.
- **Shadow:** shared module `core/pipeline/premium-shadow.js` (IB and FR). FR hook in `shorts-sira.js`, after the
  live outcome, `FR_PREMIUM_RENDER=preview`, default OFF. FR studio output (`premium/FR-*/`) and the comparison
  (`uretim/<slug>/premium-shadow.json`) are git-ignored.
- **CI:** `.github/workflows/fr-studio-dry-run.yml` runs the real FR entry point with `PUBLISH=0`, no credentials and
  no commit.
- **Open:** licensed archival photos in the automatic FR grammar need assets reviewed in `premium/assets.json`
  (licence, people, trademarks). That is per-asset human review by design.

## Priorities 5 and 6: research is the blocker, not code

- **BTO:** a complete research→production pipeline already exists (`scripts/bto-research.js` via `bto-research.yml`):
  Wikipedia text, provider draft, verbatim quotes verified in the source text, numbers traced, quality gate.
  - Only 1 of 525 topics is ready for the studio (BTO-301). The channel is inactive by owner decision and research is
    manual-dispatch only.
  - **Next action (owner):** dispatch `bto-research.yml` (limit 4). It commits researched records to main, so it is a
    production write.
- **GoalLore Lab:** 109 candidates are IDEA with empty evidence; the pilot has no verbatim quotes, and the channel rule
  requires them.
  - **Next action:** generalise `scripts/bto-research.js` to a `--channel goal-lore-lab` mode. Do this after the owner
    decides the CriticalThread → GoalLore Lab migration (same YouTube channel `UCBTEWcPZvo4B71hFw9Do_NA`).

## Local render verification (2026-10-22, Kokoro preview voice marked unapproved; Edge only in CI)

| Render | Objective QA | Creative Director flags | Render | Chromium PSS |
|---|---|---|---|---|
| FR-air-france-447-2009 (auto forensic grammar) | PASS, text gate 0/0 | THIN everywhere, LOW_NOVELTY on continuous chain scenes, LOW_MOTION s4/s7 | 72 s, 85 ms/frame | 1950 MB |
| IB-EAR-019 (magnetic world) | PASS | THIN s4, CENTRED_FLAT payoff | 75 s | 2049 MB |
| IB-HUM-050 (microbes) | PASS | CENTRED_FLAT payoff | 71 s (1/7 cached) | 1979 MB |
| IB-SPA-031 (Venus) | PASS | CENTRED_FLAT payoff | 23 s (7/8 segments cached) | 1342 MB |

Earlier IB renders (same day, before the variety fixes) carried SAME_ENV on every scene, LOW_MOTION and text-gate FAILs.
The fixes removed all of them. An objective pass is not creative approval; every package still needs a human verdict.

## FR topic supply (found by the FR dry run, verified on main 2026-10-22)

- **Today:** FR produced `ss-arctic-1854` (scheduled, `zq07sKTZmCs`). After it, current main has **0** unused A topics
  at the 75 bar. The 88 unused A topics sit at 69–74.
- **Cause:** the same-family recent-fatigue penalty (−22 per same-cluster upload in 30 days). This is by design,
  not a defect: visual availability is a real stills-vs-film classification, unlike IB's constant penalty.
- **Simulation on main state:** FR still selects every day for the next 7 days as fatigue ages out
  (10-23 avianca-52-1990 at 75, then usair-1016-1994, lahaina-fire-2023 at 76–77). But the margin is one topic at the bar.
- **Now visible before the production slot:** `scripts/growth/topic-buffer.js` covers the FR legacy lane.
- **Next action (owner):** if FR shows CRITICAL in the preflight, add researched FR case files. Do not lower the bar.
