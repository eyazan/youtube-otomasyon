# Project vision

The stable reference for what this repository is for and the rules it must
keep. It changes only when the owner changes direction. For what is true
today, see [CURRENT_STATUS.md](CURRENT_STATUS.md).

## Mission

Build a fully autonomous, AI-assisted YouTube content production and growth
platform. The goal is **sustainable USD revenue through real audience
growth**: satisfied viewers, retention and subscribers, not volume.

Primary audience: **US and UK** viewers. All published content is in English.

## Channel portfolio

| Channel | Slug | Format | Cadence | Editorial lane |
|---|---|---|---|---|
| Failure Reconstructed | `failure-reconstructed` | Shorts | Daily, 21:00 Europe/Istanbul | Engineering disasters told as cinematic, factual reconstructions |
| ImpossibleBrief | `impossible-brief` | Shorts | Daily, 21:00 Europe/Istanbul | Mass-market science and what-if scenarios |
| CriticalThread | `critical-thread` | Shorts | Daily, 21:00 Europe/Istanbul | Hidden infrastructure and surprising mechanisms |
| ProfitDecoded | `profitdecoded` | Long-form documentaries | Own schedule, separate from Shorts | Premium business and money documentaries |

**Behind the Ordinary / The Hidden Logic of Things (`behind-the-ordinary`) is
not an active channel.** The owner deactivated it on 2026-10-11. Its code and
state stay in the repository, but it gets no scheduled production, research,
analytics or OAuth checks. Do not reactivate it without an explicit owner
decision.

`config/channels.json` is the only channel registry. All channel-specific
state, credentials (`FR_`, `IB_`, `CT_`, `PD_` prefixes) and learning stay
isolated per channel. See [MULTI-CHANNEL-ARCHITECTURE.md](MULTI-CHANNEL-ARCHITECTURE.md).

## Target pipeline

```text
topic discovery → research and source verification → script → visuals
  → narration and sound design → render → independent QA on the rendered MP4
  → bounded repair (if allowed) → publish decision → scheduled upload
  → YouTube Analytics feedback → topic and creative learning
```

Every stage must be able to stop the video. A missed day is preferred to a
weak, inaccurate or unlicensed upload.

## Non-negotiable rules

These hold for every channel, every session and every automated run.

### Content and audience

- Original, visually compelling videos with natural narration and
  professional sound design.
- Factual accuracy is checked against credible sources before scripting.
- No misleading titles, thumbnails or metadata. No fake engagement.
- Synthetic or altered content is disclosed where YouTube requires it.

### Quality gates

- QA runs on the actual rendered MP4, not only on the plan or script.
- QA is independent of the step that produced the video.
- Only a `PUBLISH` verdict can be uploaded. `REVIEW` and `BLOCK` never leave
  the runner.
- Repair attempts are bounded in count and cost, then the video is rejected.
- **Never lower qualification thresholds to force a daily publication.**
- Fail closed when quality, facts or licensing are uncertain.

### Publishing safety

- Daily Shorts target **21:00 Europe/Istanbul** (`publishTimeUtc: 18:00`).
  Keep this time unless the owner changes it.
- ProfitDecoded long-form keeps its own schedule; do not fold it into the
  Shorts portfolio cron.
- No duplicate uploads or duplicate publishing (registry, title and
  idempotency guards).
- The authenticated YouTube channel ID must match the expected channel ID
  before any write.
- Never publish an unapproved experimental video. Experiments stay behind
  flags until the owner approves them.

### Cost and change control

- Never silently enable paid services. Every paid call needs an explicit
  budget and approval (see [llm/AUTOMATION.md](llm/AUTOMATION.md)).
- Never merge unreviewed production changes.
- Do not change GitHub Actions schedules, publish flags or credentials
  without the owner's instruction.

## Priorities

Owner-set order. Reassess only when the owner says so.

| | Priority | Meaning |
|---|---|---|
| P0 | Production reliability and pending PR verification | Daily Shorts must actually ship; open fixes must be verified before merge |
| P1 | Challenger Premium prototype evaluation | Decide whether the premium production approach is worth generalising |
| P2 | Reusable creative production architecture | One shared creative pipeline instead of per-channel one-offs |
| P3 | Independent automated QA and bounded repair | QA on the real MP4, with capped, cost-controlled repair |
| P4 | Reliable daily production and publishing | Every active channel ships daily without manual triggers |
| P5 | Audience intelligence and revenue optimisation | Use real Analytics to steer topics, packaging and revenue |

## Working rules for Claude Code sessions

- Start by reading [CURRENT_STATUS.md](CURRENT_STATUS.md), then the
  channel-specific doc you need.
- Work on a branch and open a PR. Do not merge it yourself.
- Do not trigger production, publishing or paid workflows unless the owner
  asks in that session.
- Other sessions may be working in parallel (for example the Challenger
  premium prototype). Do not edit their files or assume their uncommitted
  work exists.
- Report outcomes honestly: if something is unverified, say so.
- When the status of a capability changes, update
  [CURRENT_STATUS.md](CURRENT_STATUS.md) in the same PR.
