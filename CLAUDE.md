# CLAUDE.md

Autonomous YouTube production and growth platform for four active channels:
Failure Reconstructed, ImpossibleBrief, CriticalThread (daily Shorts) and
ProfitDecoded (long-form). Behind the Ordinary is inactive.

## Read first

- [docs/PROJECT_VISION.md](docs/PROJECT_VISION.md): mission, channels,
  priorities (P0–P5) and the non-negotiable rules.
- [docs/CURRENT_STATUS.md](docs/CURRENT_STATUS.md): what is verified, what is
  in progress, what is planned, open risks and pending owner decisions.

Update `docs/CURRENT_STATUS.md` in the same PR when status changes.

## Key rules (details in PROJECT_VISION)

- Work on a branch, open a PR, never merge it yourself.
- Do not trigger production or publishing, enable paid APIs, change publish
  flags, or edit Actions schedules unless the owner asks.
- Never lower quality thresholds to force a daily upload. Fail closed.
- Daily Shorts publish at 21:00 Europe/Istanbul (18:00 UTC).
- Other sessions may run in parallel. Do not touch their files.

## Commands

```bash
npm test                         # JS + Python test suites
node daily-operations-report.js  # per-channel status → reports/daily-operations.md
```

Other docs: [docs/MULTI-CHANNEL-ARCHITECTURE.md](docs/MULTI-CHANNEL-ARCHITECTURE.md),
[docs/OPERATIONS.md](docs/OPERATIONS.md), [docs/PROFITDECODED.md](docs/PROFITDECODED.md).
