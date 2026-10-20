# Premium AI Video Studio (shared engine; The Hidden Logic of Things first)

An **opt-in, offline** production path. It turns an existing researched topic and its unchanged narration into a premium motion-graphics Short, through these stages:

1. readiness check
2. directed storyboard
3. word-timed narration
4. scene-cached deterministic render
5. synthesised sound
6. measured QA
7. review package

It never uploads. No workflow, schedule, channel config, voice approval or publisher was changed. Nothing is committed or pushed.

## Commands (all run in this session)

```bash
BTO_PREMIUM_RENDER=preview npm run premium:video -- --channel behind-the-ordinary --topic BTO-301                                   # V1 preview
BTO_PREMIUM_RENDER=preview npm run premium:video -- --channel behind-the-ordinary --topic BTO-301 --storyboard storyboard.v2.json --quality final  # V2 final -> out/v2/
BTO_PREMIUM_RENDER=preview npm run premium:video -- --channel behind-the-ordinary --topic BTO-301 --storyboard storyboard.v2.json --stills 0,12.4    # quick looks
BTO_PREMIUM_RENDER=final   npm run premium:video -- --channel behind-the-ordinary --topic BTO-301 --storyboard storyboard.v2.json --quality final --voice edge  # approved voice only (needs Edge access: run on the Mac)
BTO_PREMIUM_RENDER=preview npm run premium:video -- --channel failure-reconstructed|impossible-brief|goal-lore-lab --topic X       # exits 3 with rollout status
BTO_PREMIUM_RENDER=preview npm run premium:compare -- --topic BTO-301                                                               # existing engine vs studio
node scripts/bto-studio/samples/render-sample.js scripts/bto-studio/samples/goal-lore-lab-board.json --video                        # GoalLore Lab design sample
node scripts/goal-lore-lab/build-candidates.js --write                                                                              # GoalLore Lab inventory
npm run test:premium-studio
```

In Claude Code, run `/premium-video-producer --channel behind-the-ordinary --topic BTO-301`. It routes by channel profile.

**Environment:**
- `SHORTS_KOKORO_DIR` points to the Kokoro model files (preview fallback only).
- `PD_CHROMIUM` (optional) sets the Chromium path.
- Python needs `numpy soundfile Pillow segno==1.6.6 zxing-cpp==2.3.0`.

## Deliverables (this and the previous session)

| # | Deliverable | Path | Status |
|---|---|---|---|
| 1 | Recovery report | `docs/premium-studio/recovery-report.md` | done |
| 2 | Verified implementation status | `recovery-report.md` (VERIFIED / PARTIAL / NOT VERIFIED / NOT IMPLEMENTED) | done |
| 3 | BTO issues list | `docs/premium-studio/v2-report.md` §1 | done |
| 4 | Improved BTO QR video V2 | `channels/behind-the-ordinary/premium/BTO-301/out/v2/why-qr-codes-have-three-corner-squares-premium-final-v2.mp4` (+ `-preview-v2.mp4`, `contact-sheet.png`, `scene-sheet.png`) | rendered; QA PASS; **preview voice** |
| 5 | V1 vs V2 comparison | `.../out/v2/compare/v1-vs-v2.mp4`, `v1-vs-v2-sheet.png`, `look-metrics.json`; `v2-report.md` §3 | done |
| 6 | Updated QA findings | `.../out/v2/qa-report.md`; `v2-report.md` §4 (UNVERIFIED handling fixed) | done |
| 7 | Rendering benchmarks | `v2-report.md` §5, `benchmarks.md` (Linux container; M1 not measured) | done |
| 8 | Skills status | 7 project Skills, discovered by a fresh Claude Code process; multi-channel routing documented; `skills-installation-report.md` | done |
| 9 | Shared premium architecture | `multi-channel-architecture.md`; `scripts/bto-studio/profiles/*.json` | design + profile routing implemented |
| 10 | GoalLore Lab setup status | `goal-lore-lab.md`; `channels/goal-lore-lab/`; `football.js`; design sample MP4 | proposed, inert, unregistered |
| 11 | GoalLore Lab topic inventory | `channels/goal-lore-lab/topics/topic-candidates.json`: 109 IDEA, 0 higher | done (no claims verified) |
| 12 | Daily automation design | `daily-automation.md`; `scripts/bto-studio/lifecycle.js` (tested) | design + guards implemented |
| 13 | Rollout checklist | below | done |
| 14 | Next milestone | below | done |

**Earlier deliverables:**
- `architecture-audit.md`
- `components.md`
- `engine-comparison.md`
- `visual-qa-report.md` (V1)
- `integration-plan.md`
- V1 files in `.../out/` and `.../out/revisions/`

## Rollout checklist

**Stage 1: Validate BTO premium V2**
- [x] V2 rendered and passes objective QA.
- [ ] Re-narrate with approved Edge Emma (`--voice edge`, on the Mac).
- [ ] Listen to the mix.
- [ ] Owner creative and factual sign-off.
- [ ] Redesign S5/S6 (open finding).

**Stage 2: BTO daily dry runs**
- [ ] Research ≥ 10 BTO topics to VERIFIED (only BTO-301 is ready and unpublished today).
- [ ] Storyboard each.
- [ ] Nightly preview renders with lifecycle state files.
- [ ] No uploads.

**Stage 3: BTO controlled rollout**
- [ ] Owner re-enables BTO.
- [ ] Hand-off of a premium package to `bto-publish-short.yml` (integration-plan Phase 2).
- [ ] ≥ 7-day approved buffer before the first scheduled slot.

**Stage 4: Failure Reconstructed premium integration**
- [ ] Port FR evidence/assets into the studio adapter.
- [ ] Parity on one FR remake (owner-approved).

**Stage 5: ImpossibleBrief premium integration**
- [ ] IB pack with a FACT/PROJECTION layer.
- [ ] Schema and validator support.

**Stage 6: GoalLore Lab setup and pilot generation**
- [ ] Registration checklist (`goal-lore-lab.md`).
- [ ] Verify 10 topics.
- [ ] Build `passing-network` and `career-timeline`.
- [ ] 3 pilots.

**Stage 7: Controlled multi-channel automation**
- [ ] Per-channel queues.
- [ ] Buffer ≥ 7 days.
- [ ] Analytics feedback tags.

## Exact next recommended milestone

**Make V2 publish-reviewable for BTO-301.** On the M1, with Edge access:

```bash
BTO_PREMIUM_RENDER=final npm run premium:video -- --channel behind-the-ordinary --topic BTO-301 --storyboard storyboard.v2.json --quality final --voice edge
```

Then:
1. Listen.
2. Review `out/v2/qa-report.md` and the traceability in `out/v2/review-package.json`.
3. Record the creative, factual and voice sign-offs.
4. Redesign S5/S6 as storyboard v3 if wanted.

**After that:** research the next 9 BTO topics to VERIFIED, so that Stage 2 dry runs have a real queue.

## Checkpoint (if interrupted)

| Category | State |
|---|---|
| Completed | Recovery; UNVERIFIED fix; speech check in QA; projection engine; row-signal; environments; 3 new transitions; V2 storyboard; V2 preview + final + QA + comparison; lifecycle module; channel profiles + routing; GoalLore Lab profile, style pack, football component, design sample, 109-topic inventory; Skills updated; docs. |
| Failed / blocked | Edge narration (host blocked); M1 benchmark (no M1); BTO-016 quote enrichment (source host blocked); listening review (no audio playback here). |
| Remaining | Stages 1 (sign-offs) to 7 above. |
| Tests | `npm test`: 921/921 JS (903 existing + 18 studio) + Python OK. |
| Next command | The milestone command above. |
