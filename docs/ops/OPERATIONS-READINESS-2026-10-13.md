# Shorts operations readiness (2026-10-13)

This is a read-only investigation. No schedule, workflow, voice, threshold or publishing setting was changed.

## 1. FR "YOUTUBE_AUTH_FAILURE" is stale text, not a live failure

- `icerik/bildirim-durum.json` `saglikOzet` still reads `YOUTUBE_AUTH_FAILURE ... UNKNOWN_AUTH_ERROR | YouTube yetkisi 3 Ekim 21:19 (TR) tarihinde bitecek`. That text refers to an authorization ending **3 October**.
- The live health record `icerik/saglik.json` (2026-10-12 23:06 UTC) has **0 non-OK findings**.
- The latest `youtube-oauth-health` run (2026-10-12 23:44 UTC) **succeeded**. The two failed runs earlier on 10-12 failed only for the inactive Behind the Ordinary channel's credentials.
- FR uploaded on 10-11, and the YouTube API confirmed it public at 18:09 UTC.
- **Cause:** `bildirim.js saglik()` returns early when the health file is `aggregateManaged` (OAuth health moved to `youtube-oauth-health.yml`), so it never clears `saglikOzet`.
- **Proposed fix (not applied):** set `d.saglikOzet = null` on that early return. It is a one-line change and affects only the display.

## 2. GitHub scheduled runs start 6–13 hours late

| Workflow | Cron (UTC) | Actual starts |
|---|---|---|
| `uretim.yml` (FR primary) | 08:53 | 10-04 18:24, 10-05 21:41, 10-06 19:52, 10-07 20:13 (cancelled), **10-08 no run at all**, 10-09 15:35, 10-10 14:48, 10-11 15:07, **10-12 18:14 (after the 18:00 publish time)** |
| `portfolio-production.yml` | 14 slots, 06:00–16:23 | On 10-12 the first run started at 15:03 and the last at 23:05: every slot about 6.5–9 h late |
| `yayin-kontrol.yml` (publication check) | 08:11, 11:37, 14:29, 16:47, 18:27 | 6–12 h late, so publication confirmations arrive late (for example CT on 10-06 was confirmed 26.8 h later) |
| Cloudflare `repository_dispatch` (16:35) | 16:35 | **On time** (watchdog run 38278515254 started at 16:35:56 on 10-12) |

The public release time is fixed at **21:00 Europe/Istanbul (18:00 UTC)**. The production window today is 09:00–21:00 Istanbul on the same day, and GitHub's delay regularly consumes most of it.

### Proposed design (not implemented)

The release time stays 21:00 Istanbul. What changes is when production *starts* and what *triggers* it:

1. **Pre-render one day ahead.**
   - During day D−1, produce, quality-check and **upload privately** the Short for day D, with `publishAt = D 18:00 UTC`.
   - YouTube makes it public at 21:00 Istanbul on day D.
   - Quality gates, the voice approval and the fail-closed upload guard are unchanged; only the lead time grows from about 9 h to about 33 h.
2. **Trigger from the on-time clock.**
   - Add Cloudflare Worker cron triggers, for example 06:05 and 10:05 UTC, that send `repository_dispatch`.
   - Keep the GitHub crons only as idempotent backups.
   - The existing concurrency group, registry, title and idempotency guards prevent duplicates.
3. **Check every stage with the right deadline.**

   | Stage | Deadline |
   |---|---|
   | Rendered and private-uploaded | D−1 23:59 Istanbul |
   | Scheduled (`publishAt` set) | D 16:30 UTC (the existing SLA, now with the #259 deadline guard) |
   | `PUBLICATION_CONFIRMED` | D 19:00 UTC, by a Cloudflare-dispatched publication check (the `publish.public` event) |

4. **A missed pre-render is recoverable on the day itself.** The 16:35 UTC watchdog still produces for day D when YouTube confirms the slot is empty.

**Changes this would need (owner approval, separate PRs):**

- Worker cron and dispatch types: `ops/production-watchdog-worker`, deployed through `deploy-watchdog.yml`.
- A one-day lead in `core/scheduling/calendar.js` (target the next unscheduled slot instead of today).
- The SLA check looking one day ahead.
- A dispatched publication check.

## 3. Narration provider (Shorts)

- Edge refuses GitHub runners, and every Kokoro fallback voice is unapproved.
- The details and licences are in `docs/ops/TTS-FALLBACK-OPTIONS.md` (#251).
- **Recommendation:** use a licensed provider with the same voices, such as Azure AI Speech (Andrew, Brian and Ava multilingual neural voices; its published free tier covers about 40 k characters a month). This needs an owner-created account and key, which is a new service and must be explicitly enabled. Nothing was called.
- Until then, days with Edge refusing runners end as `AWAITING_APPROVAL`, with nothing published.

## 4. CriticalThread qualified supply

Measured on main plus #234. The threshold stays at bucket A and viral score ≥ 75.

| Group | Topics |
|---|---|
| Qualified now | **1** (CT-219, 77): one day of runway |
| Bucket A, viral 70–74 (curated licensed pictures add the footage credit) | 4: CT-160 73 (excluded, overlaps FR Beirut), CT-234 72, CT-397 72, CT-166 71. Curating 3+ licensed Commons pictures each would make CT-234, CT-397 and CT-166 qualify, giving about 3 more days |
| Bucket B, viral ≥ 75 | 2: CT-437 (video potential 79; only diagrams exist), CT-265 (hook 77) |
| Unresearched (bucket D) | 362 |

**Supply plan (owner approval):**

1. Curate pictures for CT-234, CT-397 and CT-166.
2. Enable the researched-topic pipeline (`ct-research.yml`, `CT_RESEARCH_AUTO`, free Groq tier). It turns D-bucket records into sourced A/B records, and each record still has to pass the unchanged gates.
3. Until there is a supply of at least 7 days, CT days without a topic are reported as `CONTENT_BLOCKED`, not as failures.
