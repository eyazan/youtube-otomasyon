# CriticalThread → GoalLore Lab migration (2026-10-27)

**Owner decision:** the YouTube channel behind the `CT_*` credentials was renamed **GoalLore Lab** and its CriticalThread
videos were deleted. GoalLore Lab replaces CriticalThread completely, on the same channel id, with the same OAuth
client and refresh token. It carries football content only. CriticalThread topics, scripts, publishing logic and
branding never produce another upload.

The migration is split across two branches so that each release stays small.

| Change | Branch / PR | Why separate |
|---|---|---|
| CriticalThread publishing retired, fail closed | `fix/retire-critical-thread-publishing`, PR #353 against `main` | It must land before or with the Edge fix (#352). Otherwise the scheduled lane, which forces `PUBLISH=1`, would upload old CriticalThread topics to the renamed channel as soon as narration recovers. |
| GoalLore Lab registry entry, lane, research, voice samples | `feat/goal-lore-lab-lane`, built on #316 and #353 | It needs the premium studio, the adapter and the auto storyboard from #316. |

## Reference classification

The inventory comes from `git grep` for `critical-thread`, `CriticalThread`, `CT_PUBLISH`, `CT_YT_CHANNEL_ID`,
`CT_YT_REFRESH_TOKEN` and `CT_CLIENT`. It found 80 code/config files outside `channels/critical-thread`, 275 tracked
files in `channels/critical-thread`, and 53 test files. No blind search-and-replace was done: each reference is in one
of the four groups below.

### 1. Historical data that must remain (untouched)

- `channels/critical-thread/**`:
  - the `state/published.json` ledger (8 records; it shows one topic uploaded twice on 2026-10-03, which is history and is kept);
  - generated and blocked lists;
  - analytics warehouse, growth state and topics.
- `analysis/*`, `reports/*`, `benchmarks/tts/scripts.json`, `schemas/ct-evidence-package-v1.schema.json`, docs.
- The registry entry `critical-thread` itself stays, with `enabled: false` and a `retired` block. It stays addressable,
  so history can be read and nothing is orphaned.

### 2. Credential compatibility that may temporarily remain

These keep the same channel's credentials working with no new OAuth. They can be renamed `GLL_*` later, by the owner,
without a code change: `GLL_*` names take precedence.

- GitHub secrets and variables: `CT_CLIENT_ID`, `CT_CLIENT_SECRET`, `CT_YT_REFRESH_TOKEN`, `CT_YT_CHANNEL_ID`.
- `channels/goal-lore-lab/config.json` `credentialEnv`: `GLL_*` first, then the `CT_*` names.
- Workflow `env:` blocks that pass `CT_*`:
  - `portfolio-production.yml`, `youtube-oauth-health.yml` (the identity check of the same channel), `growth-feedback-loop.yml`, `competitor-intelligence.yml`, `yorum-yanitla.yml`;
  - `.env.ornek`.

### 3. Active production logic, migrated

- `config/channels.json`: `critical-thread` is retired; `goal-lore-lab` is registered with `enabled: false` and `lane: premium`.
- Uploader `youtube-yukle.js`: refuses a retired channel, twice.
- `lib/yt.js`: refuses every YouTube write for a retired channel; reads still work.
- `shorts-sira.js`, the isolated `runChannel` and `growth.js longform`: produce nothing for a retired channel.
- `shorts-sira.js` also routes `lane: premium` to `core/pipeline/goal-lore-lab.js`.
- `portfolio-production.yml`: the CriticalThread Short step is replaced by **one** "GoalLore Lab Short (premium)" step
  (`GLL_ACTIVE` / `GLL_PUBLISH`). The `critical-thread` dispatch option is removed; `goal-lore-lab` is added.
- `production-watchdog.yml`: the CriticalThread SLA, recovery and verify jobs are removed. GoalLore Lab SLA monitoring
  is added at activation, once it publishes.
- `yorum-yanitla.yml`: CriticalThread replies and seed comments removed. `yayin-kontrol.yml`: CriticalThread
  publish-day check removed.
- The analytics, plan, long-form and daily report loops drop CriticalThread.
- Premium adapters: the `GLL` prefix is added (`core/pipeline/premium-shadow.js` and `premium-publish.js`).

### 4. Obsolete functionality, retired

- `ct-research.yml`: schedule removed; manual runs only, and only on historical records.
- Dormant code paths that are inert now that the channel is retired. They are left for a separate cleanup PR, so this
  release stays small:
  - `scripts/ct-*.js`, `scripts/generate-critical-thread-topics.js`, `core/quality/critical-thread.js`;
  - CriticalThread branches keyed on the slug in `core/growth/*`, `core/rendering/*` and `core/llm/*`.
- CI only, no upload:
  - `e2e-critical-thread.js` and its `test.yml` step;
  - the CriticalThread entries in `quality-preview.yml` and `shorts-recovery-preview.yml` (no credentials, `PUBLISH=0`);
  - the CriticalThread voice in `tts-fallback-check.yml`.
- `live-replacements-2026-10-04.yml`: one-shot and manual. Its uploader path is refused by the guard.

## Fail-closed guarantees, with tests

| Requirement | Enforcement | Test |
|---|---|---|
| Scheduled jobs cannot publish CriticalThread content | no workflow runs a CriticalThread production or write step, and the code refuses anyway | `critical-thread-retired.test.js` "scheduled jobs" |
| Manual jobs cannot | `critical-thread` is not a dispatch option; `youtube-yukle.js --channel critical-thread` exits `CHANNEL_RETIRED` (also with `--dogrula` or `--herkese-acik`) | "manual jobs" |
| Recovery and retry jobs cannot | the watchdog jobs are removed; lanes and long-form produce nothing; the `lib/yt.js` POST/PUT guard runs before any request | "recovery and retry jobs" |
| GoalLore Lab cannot select old CriticalThread topics | `core/pipeline/goal-lore-lab.js` refuses any CriticalThread slug or id and any record not tagged `goal-lore-lab` | `goal-lore-lab-lane.test.js` |
| Only approved GoalLore Lab content reaches the channel | the uploader is reached only through `premium-publish.js`: `GLL_PREMIUM_PUBLISH=1`, signed approvals over the content hash, the approved voice (`BTO_PREMIUM_RENDER=final`) and the registry entry enabled; review candidates never upload | `goal-lore-lab-lane.test.js` |
| One active lane per YouTube identity | no two non-retired channels resolve the same channel-id variable; one workflow step | `goal-lore-lab-lane.test.js` |
| A candidate voice is never approved by code | the adapter marks `ownerApproved: false` and `narrate.js` keeps the timeline unapproved, so the package is PREVIEW_ONLY and the gate refuses | `goal-lore-lab-lane.test.js` |

## GoalLore Lab production path

football topic → research (`scripts/gll-research/verify.js`) → script (studio adapter) → automatic storyboard
(`scripts/bto-studio/auto/goal-lore-lab.js`) → Edge narration → premium render → objective QA → review package →
publish gate (`scripts/bto-studio/publish-gate.js`) → existing uploader (`youtube-yukle.js`). The last two steps
happen only through `core/pipeline/premium-publish.js`.

**Research.** Claims are drafted by hand. In CI, every quote is copied verbatim by code from the live Wikipedia article,
pinned to the revision it read. A quote must:
- be prose;
- share at least half of the claim's content words;
- carry every number in the claim.

Narration may state only numbers that its cited quotes carry, and never quotes anyone. Anything that fails stays
RESEARCHED, and the studio refuses it. The owner's factual sign-off still reads every quote. Wikipedia plus the
primary references it cites is the same source standard the IB and CriticalThread research used. A primary-source
upgrade is a listed blocker.

## Activation, each step approved by the owner

1. Merge #352 (Edge) **together with or after** #353 (CriticalThread retired), then #316, then this branch.
2. Listen to the `gll-voice-*` artifacts and record the chosen voice in `channels/goal-lore-lab/config.json`:
   set `voice.voice` and change `voice.status` from `CANDIDATE…` to `APPROVED by <owner> <date>`.
3. Dispatch `portfolio-production.yml` with `channel: goal-lore-lab` and `dry_run: true`. Review the candidate MP4
   (artifact `portfolio-preview`).
4. Reserve the topic, sign `creative`, `factual` and `publish` against the printed content hash, and write the title,
   description and tags (`node core/pipeline/premium-publish.js reserve|hash --channel goal-lore-lab ...`).
5. Set `config/channels.json` `goal-lore-lab.enabled: true` (this opens the publish gate). Set repository variables
   `GLL_ACTIVE=1`, `GLL_PUBLISH=1` and `GLL_PREMIUM_PUBLISH=1` (the workflow passes the variable through). For unattended
   operation instead of step 4, sign `channels/goal-lore-lab/premium/publication-policy.json` (see `go-live.md`).
6. Watch one scheduled run, then the video id, the scheduled publish time (`publishAt`) and that YouTube reports it
   public.

**Rollback:**
- Unset `GLL_ACTIVE` and `GLL_PUBLISH` (the lane stops).
- Set `goal-lore-lab.enabled: false` (the gate closes).
- Delete an approvals file to release a reservation.

CriticalThread stays retired: re-enabling it would mean reverting #353, which needs an explicit owner decision.
