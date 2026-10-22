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
