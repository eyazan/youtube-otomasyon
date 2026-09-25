# Growth architecture

Failure Reconstructed is a **data-driven forensic engineering documentary production and growth system**. Automation handles the tedious parts (footage, voice, render, packaging, measurement). Quality and editorial value decide what gets published.

## 1. Two production formats, one packaging and quality layer

```
                    icerik/konular/<slug>.json  (script + CASE FILE "vaka")
                                   │
        ┌──────────────────────────┴───────────────────────────┐
   SHORTS (daily, GitHub Actions)                     LONG-FORM (every 5 days, local / ShortsLab)
   shorts-sira.js                                      python -m shortslab run <job>
     ├─ yayin-plani.js      cadence due?                 script  senaryo-claude.js  (+ story-structure brief)
     ├─ quality-gate.js     PRE gate  ── BLOCK ─▶ skip   voice   seslendir.js       (+ pronunciation dict, ## chapters)
     ├─ arsiv-bul / stok-bul footage + source metadata   visuals gorsel-bul.js      (evidence-first tiers + metadata)
     ├─ shorts-yap.js       render                          └─ engineering-visuals.js (4–8 diagrams into scenes)
     │     pacing · overlays · stamps · music profile     render  video-yap.js       (pacing plan, cold open, chapters,
     ├─ quality-gate.js     FINAL gate ── BLOCK ─▶ skip                                 disclosure labels, next-episode outro)
     └─ youtube-yukle.js    private upload             publish thumbnail-strategy --render → quality-gate --final
                                                                → youtube-yukle.js (BLOCK stops it)
```

Everything shares the same packaging engines and the same registry.

## 2. Packaging engines (per video → `icerik/paket/<slug>/`)

| Engine | Output | Purpose |
|---|---|---|
| `title-engine.js` | `titles.json` | ≥10 candidates, 11 scored criteria, support/clickbait check, channel-wide pattern penalty |
| `thumbnail-strategy.js` | `thumbnails.json`, `uretim/<slug>/thumbnails/*.jpg` | 3 concepts (≤4 words, mobile check), rotating primary layout, rendered from real frames |
| `hook-engine.js` | `hook.json` | first-30-second scoring (0–5 / 5–12 / 12–20 / 20–30 s), forbidden openers, draft hook from the case file |
| `scene-pacing.js` | `pacing.json` | role per scene → shot length, motion, transition, overlay |
| `story-structure.js` | `story.json` | adaptive sections, open loops that must resolve later, CTA placement (`ctaStrategy`) |
| `pronunciation-check.js` | `pronunciation-report.md` | dictionary matches, risky words, AI clichés |
| `description-engine.js` | `description.txt`, `tags.json` | summary, failure chain, credits, references, related episode, series, chapters, disclosure, ≤3 hashtags |
| `pinned-comment.js` | `pinned-comment.txt` | technical debate prompt + next-case request |
| `originality-check.js` | `originality.json` | 10 similarity measures vs the channel → PASS/REVIEW/BLOCK |
| `quality-gate.js` | `quality-gate.json/.md` | 9 components /100 → PUBLISH (≥85) / REVIEW (70–84) / BLOCK (<70) |

## 3. Channel structure & session growth

- **Clusters** (`lib/kutuphane.js`, `channel-plan.js`): 11 topic families. Each video gets previous/next, an end-screen/related video, a pinned-comment video, a description link and a playlist.
- **Playlists** (`youtube-playlist.js`): format series (existing), plus a cluster playlist once a cluster has ≥3 published videos. Playlist IDs are stored in `icerik/playlistler.json`.
- **Manual Studio actions** (the API cannot do these): pin the posted comment, set the Shorts "related video", and add long-form end screens. `channel/internal-linking-plan.md` lists them.

## 4. Measurement loop

```
 upload ──▶ icerik/yayinlananlar.json (slug ↔ videoId)
   │
   ├─ post-publish-analyzer.js --due   (daily)  → analytics/<id>/{1d,3d,7d,14d,30d}.json + report.md
   │                                             + analytics/kanal/<date>.json (subscriber growth)
   ├─ existing-video-optimizer.js --all (weekly) → analysis/<id>/optimization-report.md
   │                                             → migration/current-videos.json + EXISTING-VIDEOS-PLAN.md
   ├─ experiments.js (auto-logs title style on upload; ≥5/arm before any reading)
   └─ panel → /buyume.html (dashboard; low-confidence labels, "unavailable" never guessed)
```

- Sources: YouTube Data API (public counters), YouTube Analytics API (`yt-analytics.readonly`: watch time, % viewed, subscribers, traffic sources, retention curve) and optional manual Studio entries (impressions/CTR). The API does not expose these; manual entries are labelled as such.
- Diagnoses: `INSUFFICIENT_DATA`, `LOW_IMPRESSIONS_GOOD_RETENTION`, `HIGH_IMPRESSIONS_LOW_CTR`, `GOOD_CTR_LOW_RETENTION`, `GOOD_HOOK_WEAK_MIDDLE`, `HIGH_VIEWS_LOW_SUB_CONVERSION`, `SEARCH_DEPENDENT`, `NO_SUGGESTED_TRAFFIC`, `HIGH_SUGGESTED`, `SHORTS_FEED_NOT_PICKED_UP`, `WEAK_TOPIC_PACKAGING`, `OUTPERFORMER`, `HEALTHY`. Measured performance always outranks heuristic scores: an outperformer is never "repackaged".

### Retention rules learned from the channel (`lib/tutunma.js`)

Measured on 2026-09-25 from the YouTube Analytics audience-retention curves of the first four Shorts: the steepest drop is at 11–21 % of the video (~4–7 s), exactly the second sentence, which was a date/setting setup every time. The longest video (38 s) had the lowest average view percentage (47 %); the video with 75.6 % got the only large Shorts-feed push. Rules for every new Short, scored in the quality gate (SCRIPT −12 each) and enforced by a test for every unproduced topic:

1. **Second beat** — scene 2 is an event, escalation, countdown or casualty line, never a date/setting setup (the date stamp already shows it on screen).
2. **Length** — ≤ 80 words (~28–30 s).
3. **Archive opening** — scene 1 of an archive film has an explicit `baslangic` at the most striking moment of the film.

The production queue takes topics with real archive film first, then stock explainers.

## 5. Topic selection

`konu-puan.js` scores a topic on 11 criteria from free signals: Wikipedia pageviews and full text, Commons/NASA/archive.org counts, and YouTube search when authorised. `PRIORITY` = engineering depth ≥ 6 **and** audience appeal ≥ 6. It is used by `trend-ara.js`, `viral-analiz.js` and `node konu-puan.js --adaylar` (`icerik/aday-konular-puan.md`).

## 6. Publishing cadence

`yayin-plani.js` + `config/growth.json → publishing`: Shorts every 1 day, long-form every 5 days, with a 3 h cron tolerance. Two BLOCKs in the last three real productions stretch the interval (Shorts up to 3 days, long-form up to 10). REVIEW does not slow the cadence (`stretchOnReview: false`): it already means "private upload, a human publishes".

### Fixed publish time + notification

- Production starts at **10:00 UTC** (13:00 TR). GitHub may delay scheduled jobs by hours, so it starts early.
- The video is uploaded private with `status.publishAt`. YouTube makes it public at **18:00 UTC**: 21:00 TR, 14:00 ET, 11:00 PT. The audience was ~93 % US on 2026-09-25.
- Which gate verdicts are scheduled is set in `config/growth.json → publishing.schedule` (default PUBLISH + REVIEW). Anything else stays private, and BLOCK is never uploaded.
- `bildirim.js` opens a GitHub issue that @mentions the owner (email + GitHub mobile push). It gives the title, gate verdict, publish time, Studio link and how to cancel. Older "yeni-video" issues are closed automatically; blocked topics get a "kalite-engeli" issue.
- Once enough data exists, re-tune `hourUTC` from the dashboard's "Publish hour" pattern and the analytics country mix.

### Pre-publish visual check (every Short, before it is scheduled)

`shorts-yap.js` measures the rendered output with `lib/gorsel-denetim.js`. These are measurements, not guesses:

- **Text fit:** every on-screen text (hook, captions, question, date stamp) is sized to fit. The whole text layer is then rendered with the real font on black, and the left and right edge strips are measured frame by frame. If any text touches an edge, all text is shrunk 10 % and re-measured (up to 3 times).
- **Audio/video length:** a mismatch over 0.5 s is critical. On 2026-09-25 this caught a mux bug that produced 57 s of video with 19 s of audio.
- **Black frames and frozen picture:** blackdetect / freezedetect.
- **Loudness:** measured at the final gate. The mix is normalised to −14 LUFS; it was −22 before.
- **Preview:** an 8-frame contact sheet (`icerik/paket/<slug>/onizleme.jpg`) is embedded in the GitHub notification, so you can check the video from your phone before the 21:00 publish.

Any critical finding (text still overflowing, A/V mismatch, >1.5 s of black) makes the final gate **BLOCK**. The video is not uploaded and you get a "kalite-engeli" notification. Stock footage gets the channel's **strong documentary grade** (`config/growth.json → renk.stok`: colour halved, cool steel shadows). It sits with the archival films but stays clearly colour: modern stock is never disguised as historical black-and-white film. Archival film keeps its original tone.

## 7. Configuration & state

| File | Role |
|---|---|
| `config/growth.json` | brand, `ctaStrategy`, disclosure, gate thresholds and weights, cadence, originality thresholds, analytics checkpoints |
| `config/pronunciation.json` | pronunciation dictionary, known words, banned clichés |
| `icerik/konular/*.json` | scripts + case files (`vaka`: cluster, mechanism, chain, timeline, misconception, debate, editorial titles, thumbnail text, references) |
| `icerik/yayinlananlar.json`, `kaynak-defteri.json`, `kalite-kayitlari.json`, `engellenen.json`, `playlistler.json`, `sabit-yorumlar.json` | durable state (committed back by Actions) |
| `.env` | secrets only (never committed) |

## 8. Daily GitHub Actions run (`.github/workflows/uretim.yml`)

1. `shorts-sira.js`: cadence → pre gate → footage → render → final gate → private upload (registry, playlists, experiment log).
2. `yorum-yanitla.js`: measured comment replies.
3. `post-publish-analyzer.js --due`: checkpoints.
4. `pinned-comment.js --post-pending`: debate comment on videos that became public.
5. `channel-plan.js`, then `experiments.js degerlendir`.
6. Mondays: `existing-video-optimizer.js --all`.
7. Commit state and reports back (`icerik channel analysis analytics experiments migration`).

`.github/workflows/test.yml` runs the JS and Python tests on every push and PR.
