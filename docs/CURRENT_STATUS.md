# Current status

**Last updated:** 2026-10-12, from `main` at `b571d86` and the open PRs
listed below. All checks were read-only.

This file shows where the project stands right now. Update it in the same PR
whenever a capability, blocker or priority changes. For goals and rules, see
[PROJECT_VISION.md](PROJECT_VISION.md).

Labels:

- **Verified:** working in production, with evidence (registry entries,
  workflow runs or a read-only API check).
- **Built, off:** merged, but disabled by a flag or awaiting approval.
- **In progress:** an open PR or an active session.
- **Planned:** agreed direction, nothing merged yet.

## Channels at a glance

| Channel | Production state | Last scheduled Short | Notes |
|---|---|---|---|
| Failure Reconstructed | Verified: daily automatic Shorts | 2026-10-11 18:00 UTC | 21 registry entries. No Short on 2026-10-12 (Edge TTS incident, see risks) |
| ImpossibleBrief | Verified: daily automatic Shorts | 2026-10-11 18:00 UTC | 12 registry entries. No Short on 2026-10-12 (same incident) |
| CriticalThread | Verified pipeline, **intermittent** | 2026-10-06 18:00 UTC | 7 entries. No topic meets bucket A + viral ≥ 75; fix in PR #234 |
| ProfitDecoded | Long-form, **manual upload only** | n/a | Documentary #1 (gift cards, `yENBwtfuPyU`) uploaded by the owner on 2026-10-10. Documentary #2 (airline miles) is scripted, not narrated. `config/channels.json` still lists it as `enabled: false`, `status: shadow` |
| Behind the Ordinary | **Inactive** (owner decision 2026-10-11, PR #230) | 2026-10-09 | Not an active channel. Do not schedule |

Sources: `icerik/yayinlananlar.json`, `channels/<slug>/state/published.json`,
[llm/AUTOMATION.md](llm/AUTOMATION.md), `reports/daily-operations.md`.

## Implemented and verified

- **Multi-channel isolation.** One registry, per-channel state, credentials,
  analytics and learning. Unknown slugs fail closed.
  [MULTI-CHANNEL-ARCHITECTURE.md](MULTI-CHANNEL-ARCHITECTURE.md)
- **Daily Shorts pipeline (FR, IB, CT).** `portfolio-production.yml` and
  `uretim.yml` run topic selection, render, quality gate and a private upload
  with `publishAt` 18:00 UTC (21:00 Istanbul). Renders and uploads run one at
  a time.
- **Quality gate.** `quality-gate.js`: only `PUBLISH` (≥ 85) uploads.
  `REVIEW` and `BLOCK` are quarantined by spec hash and never uploaded.
- **Publishing safety.** The authenticated channel ID must match before any
  write. Duplicate guards check the registry, the title and an idempotency
  key.
- **SLA watchdog.** `production-sla-check.js` runs at the 16:30 UTC deadline.
  The Cloudflare Worker trigger at 16:35 UTC was deployed on 2026-09-28
  (`deploy-watchdog.yml`, run 36483342904, success). The GitHub cron at 17:07
  UTC is a secondary fallback. Recovery only starts after YouTube confirms
  that today's video is missing. [SCHEDULER-RECOVERY.md](SCHEDULER-RECOVERY.md)
- **OAuth health.** `youtube-oauth-health.yml` checks every enabled channel
  each day.
- **Analytics ingestion.** Per-channel warehouse, synced through 2026-10-10
  (2-day lag). Post-publish checkpoints at 24 h, 72 h, 7 d, 14 d and 30 d.
  YouTube Studio exports can be imported (PR #189).
- **Topic libraries.** Ready backlog: FR 327, IB 481, CT 513
  (`reports/daily-operations.md`).
- **ProfitDecoded research and story gates.** Dossier gate (primary sources),
  story review, AI-pattern check, single-use paid approvals and a
  fail-closed budget ledger. [PROFITDECODED.md](PROFITDECODED.md)

## Built, off (flags or approval)

| Capability | Switch | Doc |
|---|---|---|
| Shorts craft v2: motion, continuous narration, relevance | `SHORTS_CRAFT_V2` (off) | [growth/SHORTS-CREATIVE-AUDIT.md](growth/SHORTS-CREATIVE-AUDIT.md) |
| LLM routing and Haiku Shorts pilot | `paidEnabled: false` | [llm/AUTOMATION.md](llm/AUTOMATION.md) |
| Long-form lane for the Shorts channels | `longform.render.enabled` + `<PREFIX>_LONGFORM_PUBLISH=1` | [GROWTH-ENGINE.md](GROWTH-ENGINE.md) |
| ProfitDecoded automatic production | `vars.PD_AUTO_SCHEDULE` (off) | [profitdecoded/AUTONOMOUS-BLOCKERS.md](profitdecoded/AUTONOMOUS-BLOCKERS.md) |
| ImpossibleBrief opening experiment | prepared, not created | [growth/IB-OPENING-EXPERIMENT.md](growth/IB-OPENING-EXPERIMENT.md) |
| CriticalThread automated research | `CT_RESEARCH_AUTO` (unset) | [growth/CRITICALTHREAD-THRESHOLD.md](growth/CRITICALTHREAD-THRESHOLD.md) |

## Work in progress

### Open PRs (2026-10-12)

None is merged. The visible CI checks on PRs #234, #235 and #251 were
green.

| PR | Scope | Priority | Waiting on |
|---|---|---|---|
| [#251](https://github.com/eyazan/youtube-otomasyon/pull/251) | Edge TTS outage: stop spending topics, a speech check, an offline Kokoro fallback gated by approval, stage tracking. Restores 28 FR topics | P0 | Owner review. The owner must listen to and approve a fallback voice per channel. espeak-ng GPL-3.0 runtime use needs owner sign-off |
| [#234](https://github.com/eyazan/youtube-otomasyon/pull/234) | CT skip-reason logging, curated pictures for CT-219, CT research search fix | P0 | Owner review |
| [#235](https://github.com/eyazan/youtube-otomasyon/pull/235) | IB/CT spoken openings that don't restate the title; craft-v2 motion tweaks (flagged); CT figure cap | P0/P2 | Owner review |
| [#195](https://github.com/eyazan/youtube-otomasyon/pull/195) (draft) | FR and IB long-form pilot plan (docs only) | P5 | Dry runs before any decision |

### Active sessions

- **Challenger premium prototype (P1).** A separate Claude Code session is
  building it. Its uncommitted work is **not** on `main`. Do not recreate,
  edit or depend on it. The existing `channels/failure-reconstructed/state/longform/*/challenger-1986*.json`
  files belong to the earlier long-form lane. Leave them unchanged.

## Planned (not started on `main`)

- **P2:** one reusable creative production architecture shared by the Shorts
  channels and ProfitDecoded, informed by the Challenger evaluation.
- **P3:** independent automated QA of the rendered MP4 for all channels,
  with bounded, cost-capped repair. ProfitDecoded motion-film QA is still
  advisory (blocker #5 in AUTONOMOUS-BLOCKERS).
- **ProfitDecoded autonomy:** blockers 1–7 in
  [profitdecoded/AUTONOMOUS-BLOCKERS.md](profitdecoded/AUTONOMOUS-BLOCKERS.md).
  The first 5 films need human approval before upload.
- **P5:** use Analytics to drive topic and packaging choices. The 2026-10-11
  audit found that viewers staying past the opening and percentage watched
  track views; internal scores do not.

## Known risks and blockers

| Risk | Impact | Status |
|---|---|---|
| Edge TTS refuses GitHub runner traffic (403 since 2026-10-12 ~14:55 UTC) | No Shorts on any channel, and FR spent 28 topics | Fix in PR #251; the fallback voice still needs owner approval |
| CT topic pool below the selection threshold | CT skips days | PR #234 adds curated pictures. The threshold stays at 75 and must not be lowered |
| Scheduled runs can end green with nothing uploaded | Silent missed days | PR #251 fails the run when a due channel uploads nothing |
| GitHub cron delays | Late or missed slots | Mitigated by the Cloudflare watchdog and SLA recovery |
| ProfitDecoded listed as `shadow` in the registry while it is an active channel | Portfolio reports and loops skip it | Needs an owner decision on how to represent a manual long-form channel |
| ProfitDecoded long-form scripts fail gates on free models | No unattended films | Needs a paid route with per-film approval (owner decision) |
| Low reach: Shorts top out around 1–1.7k views; subscribers FR 25, IB 10, CT 0 | Far from YPP | P5 work; see the creative audit |
| Analytics lag (2 days) and Studio-only metrics | Slower feedback | Studio export import exists; it is manual |

## Owner decisions pending

1. Review and merge (or reject) #251, #234 and #235.
2. Listen to and approve, or reject, a Kokoro fallback voice per channel.
3. Accept or reject espeak-ng (GPL-3.0) as a runtime tool.
4. Decide on ProfitDecoded's registry status and its paid script and
   narration route.
5. Evaluate the Challenger premium prototype when its session delivers.
