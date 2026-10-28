# Future automated integration plan

**Current state, unchanged by this work:**
- BTO is `enabled: false` (owner decision 2026-10-11).
- No workflow, schedule, channel config, voice approval or publisher references the studio (enforced by `tests/js/bto-studio.test.js`).
- The studio runs only by hand with `BTO_PREMIUM_RENDER=preview|final`, writes only to `channels/behind-the-ordinary/premium/<topic>/`, and never uploads.

Each phase below is a **separate owner decision**; none is implied by this release.

## Phase 0: owner acceptance of the pilot (manual)

1. On the Mac, re-narrate with the approved voice:
   ```bash
   BTO_PREMIUM_RENDER=final npm run premium:video -- --channel behind-the-ordinary --topic BTO-301 --quality final --voice edge
   ```
   The animation re-times itself from Edge's measured word boundaries.
2. Listen. Review `out/qa-report.md`, `out/revision-history.md` (open items), the traceability table in `out/review-package.json`, and `out/compare/side-by-side.mp4`.
3. Record the creative, factual and voice sign-offs. If accepted, the owner hands the MP4 to the normal manual publish path. That path is the existing `bto-publish-short.yml` for a normal render; a premium MP4 needs Phase 2 first.

## Phase 1: more directed productions (manual, offline)

- Research more BTO topics to VERIFIED with the existing pipeline. The studio refuses anything else.
- Direct a storyboard per topic with `/visual-director`, starting from `--draft`.
- Build missing components from `components.md` (planned list) only when a topic needs them.
- **Exit criterion:** 3 premium Shorts accepted by the owner without component-level rewrites. This shows the library generalises beyond QR codes.

## Phase 2: premium contract and a publish hand-off (code change, reviewed PR)

- Add a BTO entry to a studio contract, mirroring `scripts/fr-premium/engine/premium-contract.js`:
  - technical PASS + evidence PASS + creative sign-off + voice approval + publish approval, each with `by`/`at`;
  - the verdict `PUBLISH_ELIGIBLE` only then.
- Teach `scripts/bto-publish-short.js` (manual dispatch) to accept `--premium-package <review-package.json>`. It would:
  - verify the contract and the MP4 sha256;
  - run the **existing** BTO quality gate on the package metadata;
  - upload private + scheduled exactly as today.
- Workflow change: a new `premium_package` input on `bto-publish-short.yml`, off by default. The isolation test is updated in the same PR, with the owner's approval.

## Phase 3: scheduled premium renders (only if BTO is re-enabled)

- A self-hosted runner on the M1, or a scheduled local job; GitHub-hosted runners also lack Edge access at times. It would render the next storyboard-ready topic in `preview` and post the package for review.
- **Never auto-publish.** Publication stays a human approval through Phase 2's hand-off.
- Claude-assisted drafts (`--plan-with-claude`) stay behind `llm-budget.json` (`paidEnabled` + single-use approval). Their usage and cost are logged per run.

## Rollback

Delete `scripts/bto-studio/`, `.claude/skills/{the seven}`, `channels/behind-the-ordinary/premium/`, `docs/premium-studio/`, `tests/js/bto-studio.test.js`, and the three npm scripts. Nothing else depends on them.
