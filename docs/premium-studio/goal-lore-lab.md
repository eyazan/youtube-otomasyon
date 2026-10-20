# GoalLore Lab: channel setup status

**Brand idea:** *Every Goal Has a Story.*

**Status: PROPOSED, inert.**
- Not in `config/channels.json`.
- `enabled: false`, `publishingEnabled: false`, `credentialsCreated: false`.
- No `state/` directory (workflow globs use `channels/*/state`).
- No workflow references it (test-enforced).

## What exists (all verified in this session)

| Item | Path |
|---|---|
| Channel config (rules, cadence intent, candidate voice marked not approved) | `channels/goal-lore-lab/config.json` |
| Brand | `channels/goal-lore-lab/brand.json` |
| Premium style pack (floodlit night pitch, chalk, gold; tokens not likenesses; WHAT IF chip) | `channels/goal-lore-lab/premium/style-pack.json` |
| Premium profile (mode `design-only`, rollout stage 6) | `scripts/bto-studio/profiles/goal-lore-lab.json` |
| Football component: IFAB Law 1 pitch in true proportion, perspective tactics camera, player tokens on runs, passes, parabolic flights with shadows | `scripts/bto-studio/page/components/football.js` |
| Design sample: illustrative counter-attack, no narration, never published | `scripts/bto-studio/samples/goal-lore-lab-board.json` → `channels/goal-lore-lab/premium/samples/out/design-sample.mp4` |
| Candidate inventory: 109 topics, **all IDEA** | `channels/goal-lore-lab/topics/topic-candidates.json` (generator: `scripts/goal-lore-lab/build-candidates.js`) |

```bash
node scripts/bto-studio/samples/render-sample.js scripts/bto-studio/samples/goal-lore-lab-board.json --video   # design sample (tested)
node scripts/goal-lore-lab/build-candidates.js --write                                                          # rebuild inventory (tested)
BTO_PREMIUM_RENDER=preview node scripts/bto-studio/studio.js --channel goal-lore-lab --topic X                  # exits 3 with its status (tested)
```

## Topic inventory status

| Status | Count | Meaning |
|---|---|---|
| IDEA | 109 | a question with a source plan; **no evidence attached** |
| RESEARCHED | 0 | sources found and recorded |
| VERIFIED | 0 | every claim has a verbatim quote verified against its fetched source |
| SCRIPT_READY | 0 | narration written only from verified facts |
| PRODUCTION_READY | 0 | storyboard directed and validated |

**Pillars:**

| Pillar | Topics |
|---|---|
| Legends | 20 |
| Moments | 18 |
| History | 18 |
| Physics | 14 |
| Tactics | 14 |
| Mysteries | 12 |
| What-if (all flagged `hypothetical`) | 8 |
| Stadiums | 5 |

Every topic carries:
- explainable heuristic scores: appeal, curiosity, source, animation, shorts, long-form;
- copyright risk and production cost;
- notes (likeness handling, archive licensing, WHAT IF labelling).

The scores are computed from listed attributes in the generator header. They are not predictions.

## Content research architecture (DESIGN, reusing the existing research path)

1. **IDEA → RESEARCHED.** Collect sources per the topic's `sourcePlan`:
   - FIFA/UEFA/league records;
   - contemporary press and club archives;
   - peer-reviewed physics;
   - IFAB Laws.
2. **RESEARCHED → VERIFIED.** Run the existing verbatim-quote verifier pattern (`scripts/ib-ct-library/build.js`: ≥ 5-word quotes found verbatim in fetched source text, with primary-host allowlists), configured with a GoalLore host list.
3. **VERIFIED → SCRIPT_READY.** Use the existing script tooling with GoalLore rules:
   - no rumours;
   - no claims about private lives;
   - stats only from cited records;
   - hypotheticals labelled.
4. **SCRIPT_READY → PRODUCTION_READY.** A `/visual-director` storyboard validated by the evidence gate.

## Copyright and safety rules (in config `topicRules`)

- No broadcast or match footage.
- No unlicensed player photos: tokens and silhouettes only.
- No club crests or kits as branding.
- No clip reposting.
- Reconstructions are labelled RECONSTRUCTION unless they use cited tracking data.
- What-ifs are labelled WHAT IF throughout.

## Registration checklist (owner decision; not done)

1. Owner approves the name, handle, voice (blind listening test) and the CriticalThread migration plan.
2. Add `goal-lore-lab` to `config/channels.json` with `enabled: false`.
3. Update `tests/js/multi-channel.test.js`, which pins the registry key set.
4. Audit every registry consumer before enabling:
   - `core/channel-context.js`
   - `oauth-health.js --check-all`
   - `scripts/production-outcome.js`
   - `simulate-portfolio.js`
   - `scripts/intel/collect-competitors.js`
   - `core/simulation/two-channel.js`
   - the portfolio and growth workflows
5. Create the YouTube channel and credentials (`GLL_YT_*` secrets) only after step 4.
6. Research the first 10 topics to VERIFIED. Produce 3 pilots in preview, with owner review. Only then schedule.
