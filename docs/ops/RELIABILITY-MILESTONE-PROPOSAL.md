# Reliability milestone: unattended FR / IB / CT Shorts (proposal)

**Status:** proposal only. Nothing here is deployed, enabled or merged.

**Fixed constraints:**

- The public release stays at **21:00 Europe/Istanbul (18:00 UTC)**.
- CT stays at bucket A with viral ≥ 75.
- No unapproved voice, paid API or experiment is enabled.

**Prerequisites:** merge #251 (which includes #261), then #234 and #235.

## What was validated on current code (scratch copy, no writes)

| Check | Result |
|---|---|
| Upload ahead: today's slot is taken and a Short is uploaded at 13:00 UTC on D−1 | `calendar.publishSlot()` returns **D 18:00 UTC** for FR, IB and CT. `youtube-yukle.js` already uploads private with that `publishAt` and refuses past or non-private `publishAt`. |
| Day D with a pre-uploaded Short | `shortDecision()` returns *not due* ("today's Short already exists"), so no second production. `production-sla-check` reports `scheduled: true` and `safeToRecover: false`, so no recovery upload. |
| Missing piece | `shortDecision()` only ever marks **today** as due. A one-day lead needs the change in M2. |
| Duplicate protection already on `main` | Idempotency journal, resumable-session match and remote title/registry guard (`youtube-yukle.js`, `publish.duplicate_prevented` events), plus the shared `portfolio-production` concurrency group. |
| Publication evidence | `publish.public` events (YouTube API `privacyStatus: "public"`) exist for all 16 Shorts from 10-05 to 10-11. `lib/publication-evidence.js` (#261) turns them into `PUBLICATION_CONFIRMED`. |

Measured scheduler behaviour, from `OPERATIONS-READINESS-2026-10-13.md`:

- GitHub crons start 6–13 h late, and `uretim.yml` did not run at all on 10-08. GitHub documents that scheduled runs can be delayed at high load, especially at the top of the hour, and dropped.
- The Cloudflare `repository_dispatch` trigger started on time.
- Cloudflare allows 5 cron triggers per account on the Workers Free plan; 1 is in use.

## Design

| # | Requirement | Mechanism |
|---|---|---|
| 1 | Reliable trigger | The Cloudflare Worker sends `shorts-production` at **07:05 and 13:05 UTC** (10:05 and 16:05 Istanbul, after every channel's production time: FR 09:00, IB 09:30, CT 10:00 Istanbul), keeps `production-sla-watchdog` at 16:35 UTC, and adds `publication-check` at **19:05 UTC**. That is 4 of the 5 free cron triggers. GitHub crons stay as idempotent backups. |
| 2 | Produce before publication day | Per-channel `leadDays` (default 0, which is today's behaviour). With `leadDays: 1`, a run is *due* when today's slot is free and still inside its window, **or** tomorrow's slot is free. `publishSlot()` already picks the earliest free day, so tomorrow's Short is uploaded private with `publishAt = tomorrow 18:00 UTC`. |
| 3 | Private upload and scheduled publication | Existing `youtube-yukle.js`. **Add a read-back:** after `videos.insert`, call `videos.list` and require `privacyStatus: private` and the same `publishAt`; otherwise `PUBLISH_VERIFICATION_FAILED`, an alert, and no retry upload. |
| 4 | Idempotent recovery | Existing guards. The target day is derived from the registry and the YouTube API, never from "now", so a late or duplicate trigger finds the slot taken and exits `NOT_DUE`. |
| 5 | Per-channel state and retry budget | New `channels/<slug>/state/ops/attempts.json` (FR: `icerik/ops/attempts.json`), counting attempts per **target day**. Limits: render attempts 3, upload attempts 2, topics tried 5. A spent budget gives `PRODUCTION_FAILED` with the reason "retry budget exhausted" and an alert, and leaves the other channels unaffected. |
| 6 | Verified publication | A `publication-check` dispatch at 19:05 UTC runs `bildirim.js --yayin-kontrol` for each channel, which writes `publish.public` from the YouTube API. Then `production-outcome.js --publication` reports, and an issue opens on `PUBLICATION_NOT_CONFIRMED` (already at publishAt + 60 min). |
| 7 | Content-blocked vs failure | Already in #251/#261: `CONTENT_BLOCKED` and `QUALITY_REJECTED` are warnings; `PRODUCTION_FAILED`, `UPLOAD_FAILED`, `PUBLISH_VERIFICATION_FAILED` and `AWAITING_APPROVAL` are actionable. |
| 8 | Missed-window recovery | See "Missed production windows" below. |
| 9 | No unapproved voice, paid API or experiment | Unchanged guards: `fallback.approved=false`, the fail-closed upload guard, `paidEnabled=false`, `SHORTS_CRAFT_V2` off. A new provider (Azure) stays behind an explicit `SHORTS_TTS_PROVIDER` variable that is unset by default. |

### Missed production windows

1. If the D−1 pre-render fails, the next cron on D−1 (13:05 UTC) retries within the budget.
2. On day D, the 07:05 and 13:05 UTC dispatches produce for D if the slot is still free. That is today's behaviour, with a window from the channel's production time (06:00–07:00 UTC) to 17:50 UTC.
3. At 16:35 UTC the watchdog verifies through the YouTube API and recovers once, only if the slot is confirmed empty (with the #259 deadline guard).
4. After `publishAt − minLeadMinutes`, nothing is uploaded for day D. The day is **missed, not moved**: no late upload goes public at another time and no second video appears the next day, because `publishSlot` gives one Short per day. The miss is recorded with its category, and an issue opens for the owner.

## Exact files

| File | Change |
|---|---|
| `ops/production-watchdog-worker/wrangler.toml` | `crons = ["5 7 * * *", "5 13 * * *", "35 16 * * *", "5 19 * * *"]` |
| `ops/production-watchdog-worker/src/index.mjs` | Map `controller.cron` to `event_type` (`shorts-production`, `production-sla-watchdog`, `publication-check`). Payload: `{source, fired_at, cron}`. `/health` lists all crons. |
| `.github/workflows/deploy-watchdog.yml` | The cron check asserts the set of four, and that the SLA cron is still deadline + 5 min. |
| `.github/workflows/portfolio-production.yml` | `repository_dispatch: types: [shorts-production]`. The existing `schedule` stays as a backup. |
| `.github/workflows/yayin-kontrol.yml` | `repository_dispatch: types: [publication-check]` |
| `core/scheduling/calendar.js` | `shortDecision()` gains `leadDays` and `targetDay`. Cadence gap and window are computed against the target day. `publishSlot()` is unchanged. |
| `channels/{failure-reconstructed,impossible-brief,critical-thread}/config.json` | `publishingCadence.shorts.leadDays` (owner sets 1, per channel) |
| `shorts-sira.js`, `core/pipeline/impossible-brief.js` | Pass `targetDay` and refuse if `publishSlot()` ≠ `targetDay`. Read and write the attempt budget. |
| `lib/attempt-budget.js` (new) | Per-channel, per-target-day counters and limits |
| `youtube-yukle.js` | Read back `videos.list` after insert and verify `privacyStatus` and `publishAt` |
| `production-sla-check.js` | `--ahead`: is tomorrow's slot scheduled? (warning only; D−1 20:00 UTC check) |

## Acceptance tests (offline; no upload)

1. **Calendar.**
   - With `leadDays: 0`, `shortDecision` is unchanged: every existing calendar test passes as is.
   - With `leadDays: 1`, today taken and tomorrow free gives `due`, target = tomorrow.
   - Both taken gives `NOT_DUE`.
   - After today's window, with today free, the target is tomorrow, never today.
   - Across Istanbul midnight, the target day uses the Istanbul calendar.
2. **Duplicate safety.**
   - Two dispatches for the same target day, with the second starting after the first committed, gives one upload and one `NOT_DUE`.
   - A recovery run after a pre-upload gives `safeToRecover: false`.
3. **Budget.**
   - The 4th render attempt for the same target day is refused with "retry budget exhausted".
   - Another channel's budget is untouched.
4. **Read-back.**
   - A mock API returning `public` or a different `publishAt` gives `PUBLISH_VERIFICATION_FAILED` and no second insert.
5. **Worker.** Each cron maps to its event type, and an unknown cron sends nothing.
6. **Publication.**
   - With no `publish.public` event 61 min after `publishAt`, the state is `PUBLICATION_NOT_CONFIRMED` and the issue path fires.
   - With the event, the state is `PUBLICATION_CONFIRMED` (#261 tests).
7. **Regression.** The full suite passes, and `PUBLISH` is unset in every new test.

## Budget assumptions

| Item | Assumption |
|---|---|
| Narration length | Median 414 (FR), 395 (IB), 371 (CT) characters per Short, measured from the topic files; maximum 587. |
| Daily TTS volume | 3 Shorts × ≈ 400 characters × up to 4× (retries, re-reads) ≈ **5 k characters a day, ≈ 150 k a month** |
| Azure AI Speech F0 | 0.5 M neural characters a month free (official). 20 requests per 60 s, not adjustable. No SLA on the free tier. Our use is about 30% of the allowance. |
| Azure S0 (if needed) | Pay as you go. Third-party 2026 sources say about **$16 per 1 M** neural characters; I could not confirm the USD rate on Microsoft's own page. 150 k characters ≈ **$2.40 a month**. The SLA is 99.9% (paid tiers). |
| Cloudflare | Workers Free: 4 of 5 cron triggers, a handful of requests a day. $0. |
| GitHub Actions | One extra run per trigger, all idempotent. No new paid service. |

## Narration providers (facts as of 2026-10-13)

| Provider | Licence and terms | Reliability | Cost | Verdict |
|---|---|---|---|---|
| **Edge read-aloud** (`speech.platform.bing.com`, msedge-tts) | An undocumented endpoint behind Microsoft's browser Read Aloud feature. It has no API terms or SLA and needs a rotating `Sec-MS-GEC` token, which client libraries reverse-engineer. The repo already labels it "not licensed for monetised use". | It has refused GitHub runners with 403 since 2026-10-12 (18 of 18 handshakes). | $0 | **Unsuitable as a production dependency.** |
| **Kokoro-82M** (kokoro-onnx 0.6.1) | Weights: Apache-2.0. kokoro-onnx and ONNX Runtime: MIT. **phonemizer 3.4.0: GPLv3+**, and **espeak-ng (GPL-3.0)** is bundled as `libespeak-ng.so` in `espeakng-loader` and loaded in-process (installed package metadata). Running on our own runners is generally not distribution; this needs an owner and legal decision. The misaki G2P (Apache-2.0) can replace espeak with `fallback=None`; that is not implemented yet. | Offline, 0 of 81 failures on the runner. Our sandbox runs passed the speech check. | $0 | **Emergency fallback only**, after listening approval per channel and the GPL decision. |
| **Azure AI Speech** (prebuilt neural) | Documented commercial API with published terms. The same Andrew, Brian and Ava multilingual voices are available (reported generally available in all regions). Needs an Azure resource, a key and a region, held as repository secrets. | 99.9% SLA on paid tiers, none on F0. 429 errors are usually per-voice regional capacity, so retry with backoff and optionally use a second region. | F0 free: 0.5 M characters a month. S0 about $16 per 1 M (unconfirmed USD rate). | **Recommended primary.** |

### Recommended safest low-cost approach (not activated)

1. The owner creates an Azure Speech resource and decides F0 or S0. Two keys are stored as `AZURE_SPEECH_KEY` and `AZURE_SPEECH_REGION`, both owner-only secrets.
2. Add an `azure` provider to the narration layer, with the **same voice names** as today. It runs only when `SHORTS_TTS_PROVIDER=azure`. Every output still goes through `lib/speech-check.js`, and the upload guard is unchanged.
3. Before enabling it: a listening comparison, Edge versus Azure, on 3 scripts per channel. The owner approves.
4. Kokoro stays as the approval-gated emergency fallback, or is removed if the GPL question is not accepted.

## Owner decisions

1. Approve this milestone and its order:
   1. M1 trigger plus M2 lead day, behind `leadDays` (default 0);
   2. then the read-back and budget;
   3. then the publication-check dispatch.
2. Set `leadDays: 1` per channel (FR first) after one dry-run day.
3. Choose the narration provider: Azure F0/S0 (account and key), Kokoro (listening and GPL), or both.
4. Approve the Cloudflare Worker redeploy (`deploy-watchdog.yml`) with the new crons.
5. Approve CT picture curation (CT-234, CT-397, CT-166) and the research pipeline for CT supply.

## Sources

- [Azure Speech pricing (official, 0.5 M free neural characters on F0)](https://azure.microsoft.com/en-au/pricing/details/cognitive-services/speech-services/)
- [Azure China pricing (¥95.4 per 1 M neural characters)](https://www.azure.cn/en-us/pricing/details/cognitive-services/)
- [Third-party 2026 USD rate, $16 per 1 M](https://texttolab.com/blog/azure-text-to-speech-pricing)
- [Speech quotas and limits (F0 20 per 60 s; 10 min of audio per request)](https://docs.azure.cn/en-us/ai-services/speech-service/speech-services-quotas-and-limits)
- [Cognitive Services SLA, 99.9% with no free-tier SLA (Azure China copy)](https://www.azure.cn/en-us/support/sla/cognitive-services/)
- [Azure voice availability report (Ava, Andrew, Brian in all regions)](https://windowsreport.com/microsoft-brings-9-more-ai-voices-for-azure-ai-service-users-in-all-regions/)
- [misaki, Apache-2.0, with an optional espeak fallback](https://github.com/hexgrad/misaki)
- [Cloudflare Workers limits (5 cron triggers per account on Free)](https://developers.cloudflare.com/workers/platform/limits/)
- [GitHub Actions troubleshooting: schedule delays and drops](https://docs.github.com/en/enterprise-cloud@latest/actions/monitoring-and-troubleshooting-workflows/troubleshooting-workflows/about-troubleshooting-workflows)
- [Edge TTS 403 reports (community)](https://bbs.pyvideotrans.com/show/2828)

Microsoft's own pages could not be fetched from this environment. Re-check the pricing on the official page before enabling.
