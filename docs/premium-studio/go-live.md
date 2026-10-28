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

## First controlled premium publication: Failure Reconstructed, then ImpossibleBrief

Do FR first. Start IB only after FR's first premium Short is confirmed public.

### Evidence before signing

**Dry run 40638404814** (`engine=premium`), on the real packages FR-gemini-8-1966 and IB-EXT-050:
- objective QA PASS, approved voice, READY_FOR_HUMAN_REVIEW;
- the uploader's `--dogrula` exit 0, with identity verified;
- with the policy's sign-offs simulated, the publish gate reaches **PUBLISH_APPROVED**.

**Local staging test:** a package staged exactly as on a publication day passes every gate of the real uploader before OAuth:
- quality gate PUBLISH;
- approved narration voice;
- the target day's 21:00 Istanbul `publishAt`.

### Steps per channel (`P` = `FR`, then `IB`)

1. **Sign the policy.** In `channels/<channel>/premium/publication-policy.json` on main, set:
   - `"status": "SIGNED"`
   - `"signedBy": "<your name>"`
   - `"signedAt": "<ISO time>"`

   Commit it. The commit is the authorization record, and every approval names this file's sha256.
2. **Set the repository variables.** Under Settings → Secrets and variables → Actions → Variables, set `P_PREMIUM_PUBLISH=1` and `P_PREMIUM_PRIMARY=1`. From the next run, the legacy renderer stops for this channel.
3. **Pre-flight.** Dispatch `portfolio-production.yml` with `channel=<channel>`, `dry_run=true` and `engine=default`. Expect these lines:
   - `reserved under the signed publication policy <sha> (dry run: not written)`;
   - a final render with the approved voice;
   - `youtube-yukle.js --dogrula`.

   Nothing is written. Any other outcome: stop and unset the two variables.
4. **First publication.** The next scheduled run after the channel's production slot does it. FR's slot is 09:00 Istanbul and IB's is 09:30; the hourly schedule retries until 21:00. That run:
   - reserves the best qualified topic and binds the policy to its rendered content hash;
   - uploads it **private**, with `publishAt` on that day's 21:00 Istanbul slot.
5. **Verify.** In the run summary, `production-outcome` shows `UPLOADED premium <topicId> <videoId>`. Then check:
   - `channels/<channel>/premium/approvals/<topicId>.json` carries `publishedVideoId`, and the published ledger has the video id;
   - YouTube Studio shows the video private and scheduled for 21:00;
   - after 21:00, YouTube reports it public (`PUBLICATION_CONFIRMED`).

   Only then is the channel LIVE on premium.
6. **IB.** Repeat steps 1–5 for IB on a later day.

**If a step fails:** unset `P_PREMIUM_PRIMARY` and the legacy lane takes the next run. Unset `P_PREMIUM_PUBLISH` to stop premium publication altogether. A reserved topic that was not published stays reserved. Delete its approvals file to release it.

## Rollback

| Scope | Action |
|---|---|
| A channel's renderer | Unset `<P>_PREMIUM_PRIMARY`. The legacy lane runs again on the next scheduled run. |
| Unattended publication | Set the policy `status` to `REVOKED`, or unset `<P>_PREMIUM_PUBLISH`. |
| A channel's publication | Set `enabled: false` in `config/channels.json`. For GLL also unset `GLL_ACTIVE`; for HLT, unset `HLT_PREMIUM_PRIMARY`. |
| A wrongly reserved or refused topic | Delete `channels/<c>/premium/approvals/<topicId>.json`. |
| A release | Revert the go-live merge commit. #352 and #353 are independent of it. |

CriticalThread cannot be re-enabled by any switch. That needs a revert of #353.
