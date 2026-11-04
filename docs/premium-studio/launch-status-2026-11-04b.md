# Launch status (2026-11-04, session 2): operational changes

PR [#416](https://github.com/eyazan/youtube-otomasyon/pull/416), stacked on #411.

- Nothing is merged or uploaded, no variable was changed, and no approval was written.
- Tests on main + #411 + #416: 1057 JS + 31 Python, 0 failures.
- No merge conflicts with main.

## P0: publication safety

| item | state |
|---|---|
| Variables (read-only check, run 41881580429) | `FR_PREMIUM_PRIMARY=1`, `FR_PREMIUM_PUBLISH=1`, `IB_PREMIUM_PRIMARY=1`, `IB_PREMIUM_PUBLISH=1`, `PUBLISH=1`, `FR_PUBLISH=1`, `IB_PUBLISH=1`, `CF_PRODUCTION_DISPATCH=1`, `BTO_PUBLISH=0`. HLT/GLL/longform variables are unset. |
| Can legacy publish around the switch? | **No, while `*_PREMIUM_PRIMARY=1`.** Every scheduled path is routed through `core/pipeline/premium-lane.js`: the cron, the Cloudflare dispatch and the watchdog's IB recovery (all via `shorts-sira.js`). With `*_PREMIUM_PUBLISH=0` that lane renders a review candidate and runs the uploader in `--dogrula` (dry) mode only. **Do not set `*_PREMIUM_PRIMARY=0`:** that hands the day back to the legacy stock lane, which uploads with `PUBLISH=1`. |
| Pause applied? | **No.** This session has no tool that can set repository variables. Run the commands below. |
| `A-IgHh6J_ZU` El Faro | Private at 17:54 UTC, `publishAt` 18:00 UTC (now public by schedule). The description contradicts itself. Corrected text: `docs/premium-studio/corrections/A-IgHh6J_ZU-el-faro-description.txt`. |
| `b7LByhFrMMc` Venus | Private at 17:54 UTC, `publishAt` 18:00 UTC. The description is accurate (sources, disclosure). Narration L2 ("hotter than Mercury") is true but has no stored source. The drawing is the classifier's guess (no declared mechanism); judge it in Studio. |

Pause both channels' premium publishing (repository variables; reversible by setting them back to `1`):

```bash
gh variable set FR_PREMIUM_PUBLISH --body 0 --repo eyazan/youtube-otomasyon
```
```bash
gh variable set IB_PREMIUM_PUBLISH --body 0 --repo eyazan/youtube-otomasyon
```

Or use GitHub: Settings → Secrets and variables → Actions → Variables. Then verify with Actions → *Repository
variables check (read-only)* → Run workflow.

## P2: what each channel has

See the table in the session reply. MP4s, QA and frames are listed there with links.

## P4: three validation layers (`core/pipeline/validation-layers.js`)

| layer | blocks? | what is in it |
|---|---|---|
| **FACTUAL** | always | research standard, verbatim quotes and numbers, claim ledger, person-declared visual mechanism (IB), **creative fidelity** (FR: no crack drawn for a case that did not crack), owner research review. Unknown reasons fail closed here. |
| **TECHNICAL** | hard QA checks | resolution, decode, black/frozen frames, loudness, true peak, captions, text layout, speech, determinism, loop continuity |
| **CREATIVE** | never by itself | viral score as a ranking signal (a hard minimum only where it is calibrated PREDICTIVE); Creative Director flags; the owner's creative verdict is the decision |

Every premium-lane refusal and every `review-package.json` now carries its layer. Human approvals are unchanged and are
never written by code.
