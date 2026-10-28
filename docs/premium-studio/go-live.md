# Premium primary go-live (four channels)

The four production channels are Failure Reconstructed (FR), ImpossibleBrief (IB), The Hidden Logic of Things (HLT)
and GoalLore Lab (GLL). CriticalThread is retired: GoalLore Lab is the same YouTube channel.

All four produce through one lane, `core/pipeline/premium-lane.js`:

qualified topic → verified research → studio script → automatic storyboard → approved Edge voice → premium final
render → objective QA → publish gate → publication policy → `youtube-yukle.js` → publication verification.

When premium is a channel's primary renderer, the legacy stock renderer does not run. A premium refusal is that day's
result, reported as `BLOCKED`, `FAILED` or `NO_TOPIC` by `scripts/production-outcome.js`. There is no silent legacy
upload. The legacy renderer remains for rollback only.

## Switches (all owner-controlled; none is set by code)

| Switch | Where | Effect |
|---|---|---|
| `FR_PREMIUM_PRIMARY` / `IB_PREMIUM_PRIMARY` / `HLT_PREMIUM_PRIMARY` = `1` | repository variable | Premium becomes the channel's renderer. GoalLore Lab is premium-only. |
| `FR_` / `IB_` / `HLT_` / `GLL_PREMIUM_PUBLISH` = `1` | repository variable | The premium publisher may hand an approved package to the uploader. |
| `channels/<c>/premium/publication-policy.json` with status `SIGNED`, `signedBy`, `signedAt` | repository file | Unattended operation: no per-video sign-off. Each approval record names the policy's sha256. Shipped `UNSIGNED`. |
| `config/channels.json` `enabled: true` | repository file | The publish gate allows the channel (HLT and GLL are `false` today). |
| `GLL_ACTIVE` / `GLL_PUBLISH` = `1`; `BTO_PUBLISH` = `1` | repository variable | GLL scheduling and publication; HLT publication. FR/IB scheduled runs always publish. |
| Voice | `channels/goal-lore-lab/config.json` `voice.status` | GLL needs `APPROVED by <owner> <date>`. Listen to the `gll-voice-*` artifacts. |

Without a signed policy, the lane renders one review candidate per run. It evaluates the publish gate and runs the
uploader in `--dogrula` mode on a temporary copy. Nothing is uploaded or approved.

## Activation, one channel at a time

1. Merge in this order: #353 (CriticalThread retired) → #352 (Edge 2.1.1) → #316 (Premium Studio) → the go-live PR.
2. On the merged main, dispatch `portfolio-production.yml` with `channel=<c>`, `dry_run=true` and `engine=premium`.
   Check the following:
   - the `portfolio-preview` MP4;
   - `Kanal kimligi dogrulandi` with the right channel id;
   - the blocker list.
3. Sign `channels/<c>/premium/publication-policy.json`. Set `<P>_PREMIUM_PUBLISH=1`, then `<P>_PREMIUM_PRIMARY=1`.
   - For HLT, also set `enabled: true` in `config/channels.json` and `BTO_PUBLISH=1`.
   - For GLL, approve the voice, set `enabled: true`, and set `GLL_ACTIVE=1` and `GLL_PUBLISH=1`.
4. Watch the next scheduled run until it reports `UPLOADED`. Check the following:
   - the video id;
   - `publishAt` on the due day at 21:00 Istanbul;
   - YouTube reports the video public after `publishAt` (`PUBLICATION_CONFIRMED`).

   Only then is the channel LIVE. Move on to the next channel.

## Rollback

| Scope | Action |
|---|---|
| A channel's renderer | Unset `<P>_PREMIUM_PRIMARY`. The legacy lane runs again on the next scheduled run. |
| Unattended publication | Set the policy `status` to `REVOKED`, or unset `<P>_PREMIUM_PUBLISH`. |
| A channel's publication | Set `enabled: false` in `config/channels.json`. For GLL also unset `GLL_ACTIVE`; for HLT, unset `HLT_PREMIUM_PRIMARY`. |
| A wrongly reserved or refused topic | Delete `channels/<c>/premium/approvals/<topicId>.json`. |
| A release | Revert the go-live merge commit. #352 and #353 are independent of it. |

CriticalThread cannot be re-enabled by any switch. That needs a revert of #353.
