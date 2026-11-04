# Four-channel launch readiness (2026-11-04)

Builds on PR #411 (`four-channel-production-2026-11-03b.md`). This session:

- did not merge, approve, sign, declare or upload anything;
- did not change any repository variable or write to YouTube.

Evidence:

- live read-only audit, run [41877809945](https://github.com/eyazan/youtube-otomasyon/actions/runs/41877809945), branch `review/youtube-audit-41877809945`;
- variables check, same run;
- real MP4s from run [41703791696](https://github.com/eyazan/youtube-otomasyon/actions/runs/41703791696);
- frame branches `review/render-41703791696-<topic>`.

## 0. Already happening on main (read first)

- `FR_PREMIUM_PRIMARY`, `FR_PREMIUM_PUBLISH`, `IB_PREMIUM_PRIMARY` and `IB_PREMIUM_PUBLISH` are all `1`.
- The FR and IB publication policies are SIGNED (eyazan, 28 and 29 Oct).
- **So FR and IB already publish one premium Short a day from main's code, unattended.** PR #411's improvements are not
  in that code: the maritime kit, the mechanism-declaration gate and the corrected metadata.

Today (2026-11-04), main uploaded two Shorts, both private and scheduled for 18:00 UTC:

| channel | video | issue |
|---|---|---|
| FR | `A-IgHh6J_ZU` "The Cargo Ship That Sailed Into a Hurricane" (El Faro) | The description lists 7 "Archival film: Wikimedia…" credits and then says "Original animation: no archival or stock footage" (fixed in code on this branch, see §1). It was rendered by main's older FR engine: the frame review found one wireframe ship repeated, which is what PR #411's maritime kit replaces. |
| IB | `b7LByhFrMMc` "What If Earth Became Like Venus" (IB-SPA-031) | Main has no mechanism-declaration gate. The board rates this topic NO_DRAWING: the existing drawings cannot show it. |

**Owner decision:** keep both lanes running, or pause them until #411 merges by setting `FR_PREMIUM_PUBLISH` and
`IB_PREMIUM_PUBLISH` to `0`. A controlled rollout ("one owner-approved video per channel first") is not what is running
now. Studio edit for `A-IgHh6J_ZU`: delete the "Footage & sources" block (§3.3).

## 1. Fixes completed on this branch (`claude/jolly-galileo-538eda`, stacked on #411)

| fix | file | effect |
|---|---|---|
| Premium FR descriptions no longer list archival or stock credits | `description-engine.js` (`tur: "premium"`) | El Faro's description loses the 7 false "Archival film" lines. Applies to all FR premium uploads. |
| Source titles: HTML entities decoded | `core/pipeline/premium-publish.js` | BTO-156: `21 CFR &sect;` becomes `21 CFR §`. |
| Subject hashtag from revision-pinned Wikipedia URLs; GLL broad tags | `core/hashtags.js` | GLL-021 had only `#shorts`; it now has `#shorts #football #ArgentinaVEngland #soccer` and the tag `Argentina v England`. |
| Opening caption fully visible at frame 0 | `scripts/bto-studio/page/motion.js` | Frame 0, the first impression in the feed, showed a half-faded caption on all 5 MP4s. |
| Board stills renderable in CI | `.github/workflows/premium-review-render.yml` (`board:<IB id>`) | The board's stills were gitignored, so the owner could not see them. Stills only; no MP4; the record is unchanged. |
| Batch mechanism review | `reports/ib-mechanism-board/decisions.json`, `declare-mechanism.js --from/--queue` | One file, one command; HOLD rows are refused (§4). |
| Tests | `premium-primary`, `hashtags`, `premium-mechanisms` | No archival claim on any channel's premium description; the review sheet ships undecided. |

`npm test`: 1053 JS + 31 Python, 0 fail.

**Searched and not found:** "PitchLore" exists nowhere in code or metadata, only in GLL's live channel description
(Studio, §3.2).

### Upload metadata audit (what the API path sends, per channel, first qualified topic)

| channel | title | language / audio / category | description | tags / hashtags | verdict |
|---|---|---|---|---|---|
| IB (EAR-019) | What One Day Without Earth's Magnetic Field Would Do | en / en / 27 (#411) | question, verified claim sources, animation + synthetic-voice disclosure | `#shorts #science #EarthsMagneticField #earthscience #whatif` | OK |
| FR (El Faro) | The Cargo Ship That Sailed Into a Hurricane | en / en / 27 (#411) | failure chain, technical references, disclosure; archival credits removed | 5 hashtags, 7 tags | fixed here |
| BTO (BTO-156) | Microwave doors: what explains metal mesh? | en / en / 27 | 4 sources, disclosure | `#shorts #design #MicrowaveDoors #engineering #howitworks` | **Title is machine-phrased.** Write the upload title in the approval file (proposed in §2). |
| GLL (GLL-021) | Two Goals, Four Minutes Apart | en / en / 17 Sports | question, pinned source, disclosure | now `#shorts #football #ArgentinaVEngland #soccer` | fixed here |

**Main's live uploads lack `defaultLanguage` / `defaultAudioLanguage`** (audit: ∅ on today's two videos). The fix is in
#411's `upload` block and lands with the merge.

## 2. Channel readiness

| | ImpossibleBrief | Failure Reconstructed | Hidden Logic (BTO) | GoalLore Lab |
|---|---|---|---|---|
| latest real premium MP4 | [IB-EAR-001](https://github.com/eyazan/youtube-otomasyon/actions/runs/41703791696/artifacts/13264262698) 30.6 s, [IB-EAR-019](https://github.com/eyazan/youtube-otomasyon/actions/runs/41703791696/artifacts/13264207883) 31.5 s | [El Faro](https://github.com/eyazan/youtube-otomasyon/actions/runs/41703791696/artifacts/13265451771) 26.9 s (now published from main's older render); Lake Nyos and Moore tornado render queued, see §7 | [BTO-156](https://github.com/eyazan/youtube-otomasyon/actions/runs/41703791696/artifacts/13265237338) 31.9 s | [GLL-021](https://github.com/eyazan/youtube-otomasyon/actions/runs/41703791696/artifacts/13264817418) 25.6 s |
| objective QA | PASS / PASS (loop WARN; EAR-019 static-hold WARN 1.87 s) | PASS (loop WARN) | PASS (caption speed WARN 23.5 c/s, loop WARN) | PASS, **voice WARN** (Ryan not approved), caption-sync WARN 169 ms |
| Creative Director package | frames, contact sheet, `creative-review.md` on `review/render-41703791696-<id>`; all scenes "not reviewed" | same; 6 of 8 scenes LOW_NOVELTY | same; 6 scenes SAME_ENV (desk), 5 LOW_NOVELTY | same |
| exact outstanding approvals | 1. Creative verdict on EAR-001 (`creative-notes.json`). 2. HUMAN-line review (`research/reviews/IB-EAR-001.json`). 3. Mechanism declarations (§4). 4. Merge #411. | 1. Creative verdict on Lake Nyos or Moore (once rendered). 2. Merge #411 (the maritime kit is not on main). | 1. Fix OAuth (§3.1). 2. Enable Analytics API. 3. Research review of BTO-156 (`premium-publish.js review-research`). 4. Creative verdict. 5. Sign the policy. 6. `HLT_PREMIUM_PUBLISH`, `BTO_PUBLISH`. 7. Merge. | 1. Voice approval (Ryan, or pick another: `gll-voice-review.yml`). 2. Research review (`docs/review/goal-lore-lab-approval.md`). 3. Creative verdict. 4. Policy, `enabled:true`, `GLL_ACTIVE`, `GLL_PUBLISH`, `GLL_PREMIUM_PUBLISH`. 5. Merge. |
| publishing config | policy SIGNED; switches ON; at most 1/day; 21:00 Istanbul (18:00 UTC) | same | policy UNSIGNED; switches off; **OAuth broken** | policy UNSIGNED; `enabled:false`; switches off |
| duplicate protection | Verified in code: `published.json` slug/topicId; reservation file; journal + resumable-session + remote title/publishAt reconciliation (`youtube-yukle.js` 370–423); tests `publish-safety`, `premium-primary` | same | same. **Owner check:** two Bluetooth videos exist in `published.json` (`Q98e12I0NFA` via duplicate-guard on 5 Oct, `Dibi31XmolY` uploaded 8 Oct with a new title). Check in Studio that only one is public. | same |
| scheduled publication | Verified live today: uploaded private, `publishAt` 18:00 UTC, read-back verified (`b7LByhFrMMc`) | Verified live today (`A-IgHh6J_ZU`) | not verifiable (auth) | no uploads yet |
| **readiness** | **Lane live; #411's gate not live** | **Lane live; #411's renderer not live** | **Blocked: owner credentials** | **Blocked: voice + research approvals** |

Proposed BTO-156 upload title (for the approval file; accurate, not clickbait): **"Why Microwaves Can't Escape
Through the Holes in Your Door"**. The holes are far smaller than the 12.2 cm wavelength (fact in the record).

## 3. Operational issues

### 3.1 BTO OAuth `INVALID_CLIENT` and the Analytics API

- **Re-confirmed today** (audit 41877809945): `INVALID_CLIENT` (HTTP 401) on token refresh.
- **Cause, unchanged:** `docs/ops/BTO-OAUTH-REPAIR.md`. The client ID set on 3 Oct and the secret set on 8 Oct are not one
  OAuth client pair.
- **Why code can't fix it:** secrets are write-only and this environment has no Google Cloud credentials (`gcloud auth list`:
  none).
- **Analytics API, same reason:** enabling it needs `serviceusage.services.enable` in GCP project **739767423116**. The
  YouTube OAuth scopes the pipeline holds cannot enable APIs, so the existing permissions are not enough.

**Owner steps (about 10 minutes):**

1. Open https://console.cloud.google.com/apis/api/youtubeanalytics.googleapis.com/overview?project=739767423116
   and click **Enable**. Also confirm *YouTube Data API v3* is enabled there.
2. In that project, go to *APIs & Services → Credentials* and pick one *Desktop app* OAuth client, or create one.
3. Go to *Google Auth Platform → Audience* and set the status to **In production**. Testing mode expires refresh tokens after 7 days.
4. Confirm the scopes `youtube.force-ssl` and `yt-analytics.readonly` are listed.
5. Locally, put that client's ID and secret in `.env` as `BTO_YT_CLIENT_ID` and `BTO_YT_CLIENT_SECRET`, then run:
   `node youtube-yetki.js --channel behind-the-ordinary --github --oauth-mode=production`
   and choose the Hidden Logic channel (`UCBkloTDoYhsNbswwPkvqLIg`). All three secrets are written together.
6. Verify, read-only: Actions → *Repository variables check* → `audit=1`. The BTO section should show the channel and
   analytics instead of `INVALID_CLIENT`.

### 3.2 YouTube Studio changes (owner; we do not write channel branding through the API)

**Failure Reconstructed: replace the whole description** (it says "using real archival footage"; premium Shorts are
animated; earlier Shorts used credited archival media):

```
Failure Reconstructed — the story behind history's greatest disasters and engineering failures, in under a minute.

Every day we reconstruct one failure from published investigations and sources: what went wrong, why it happened, and what it taught us. Bridge collapses, ship losses, aviation accidents, blackouts and industrial disasters, rebuilt as original animated reconstructions. Some earlier episodes use archival photos and film, credited in their descriptions.

Reconstructions are labelled on screen, sources are listed under every video, and narration uses a synthetic voice.

New Short every day. Subscribe so you don't miss the next one.

#engineering #disasters #history #shorts
```

**GoalLore Lab: change one line.** The last line `PitchLore — Every Goal Has a Story.` becomes
`GoalLore Lab — Every Goal Has a Story.` Nothing else needs to change.

**All four channels:** go to *Settings → Channel → Basic info*, set *Language: English*, and add keywords:

- IB: `science, what if, space, physics, earth science, astronomy, volcanoes, science explained`
- FR: `engineering failures, disasters, forensic engineering, accident investigation, engineering history, shipwrecks, bridge collapse`
- BTO: `how things work, everyday objects, design, hidden engineering, everyday science, product design`
- GLL: `football, soccer, football history, world cup, iconic goals, football stories`

### 3.3 Single-video Studio edits

- `A-IgHh6J_ZU` (El Faro, FR): in the description, delete the block from `Footage & sources:` through the last
  `• Archival film: …` line. Keep "Technical references" and the disclosure.
- BTO: confirm only one of `Q98e12I0NFA` / `Dibi31XmolY` (both Bluetooth logo) is public. If both are, set the older one
  to unlisted.

## 4. ImpossibleBrief supply: owner review in one pass

- **Stills:** CI run [41878442797](https://github.com/eyazan/youtube-otomasyon/actions/runs/41878442797) renders all 47 STRONG
  proposals. Each topic's 4 stills and contact sheet go to `review/render-41878442797-<IB id>`. The links are collected in
  `reports/ib-mechanism-board/OWNER-REVIEW.md`.
- **Sheet:** `reports/ib-mechanism-board/decisions.json` lists the 18 pre-screened topics in proposed queue order. Each row
  has a hook note and an accuracy note, and every `decision` is `null`.
- **Process:**
  1. Look at the contact sheets.
  2. Set `"decision": "APPROVE"` or `"REJECT"` on each row.
  3. Run `node scripts/ib-research/declare-mechanism.js --from reports/ib-mechanism-board/decisions.json --by "<your name>"`.
  4. Run `node scripts/ib-research/declare-mechanism.js --queue` to print the real production order.
- **Accuracy review of the 18:**
  - **15 are clean**, or have only a minor wording suggestion noted in the row.
  - **3 are HOLD.** The tool refuses them until the research is fixed:
    - **IB-SPA-036:** line 3 dates the 40,000 km Great Red Spot to 2017. The 2017 width is 16,350 km.
    - **IB-SPA-066:** Halley's orbit is drawn as a circle (eccentricity ≈ 0.97), and the "8,030 km" probe line omits
      Giotto's ~600 km pass.
    - **IB-HUM-014:** "most people would need well over twice as long" has no source.
- **Supply:** 15 topics plus the already-declared EAR-001/019 gives 17 Shorts, about 17 days at 1/day. Tested on a copy:
  approving all 15 yields a 17-topic queue. The rest of the 47 STRONG rows have stills now; look before adding them.
- **After the merge:** the queue only feeds production once #411 merges. Main has no declaration gate.

## 5. Retention: what the openings actually show, and three hooks per channel

**Opening frames inspected** (`first-2s.jpg`, 0–2 s at 6 fps, all 5 MP4s):

- In every video, frame 0 is a mostly static drawing under a half-faded caption.
- The event starts at 0.7–1.0 s, or never within 2 s:
  - BTO: a still microwave, then the loupe.
  - FR: the ship rocks; the sea break is subtle.
  - GLL: a wide pitch with tiny players.
  - IB-EAR-001: a still globe, with arrows from ~1 s.
  - IB-EAR-019: a still globe with field lines; nothing changes in 2 s.
- The spoken openers are setups, not events: "Look closely at a microwave door", "A US cargo ship sailed".
- The live best openers show the opposite pattern: a concrete physical event with stakes. Examples are the CO2 lake overturn (rel@10% 0.54) and
  Gemini 8 spinning (0.51).

**Rule for every hook below:** the motion starts at frame 0, and the on-screen claim is one of the topic's verified facts.
No hook may promise something the video doesn't show.

| channel | A: event in motion at 0 s | B: scale or the single part | C: outcome first, then rewind / myth vs measured |
|---|---|---|---|
| IB | The consequence already moving: oceans and buildings sliding east at the equator speed (EAR-001); the ash column already rising (volcano set) | A familiar object drawn to scale beside the phenomenon: an airliner at 10 km under an aurora at 100 km (SPA-010); a 1 mm mesh hole vs a planet-sized storm | Only where the research debunks: "Overdue?" stamped on a Yellowstone timeline, struck by the measured fact (EAR-006); AMOC "15–20 °C crash" struck by "4–10 °C" (EAR-071) |
| FR | The last normal second: the failing part highlighted, with a clock running (the open scuttle; the undersized plate) | Macro on the single failed component with a scale reference, then pull out to the whole structure (the best FR opener was "The Undersized Steel Plate", 0.47) | The outcome in the first second (route line ends; span in the river; no people shown), then a visible rewind to the cause |
| BTO | Microwaves already bouncing inside the cavity and hitting the mesh at 0 s | 12.2 cm wavelength drawn against the 1 mm hole: the size gap is the hook | "Remove it": the door without mesh, waves leaving, labelled CONCEPTUAL, then the mesh snaps back |
| GLL | Tight on the ball at the decisive touch, the tally/clock already visible, then cut wide | The counter is the hook: 5 defender tokens already on screen at 0 s (GLL-021), "60 m" drawn on the pitch | Two frames, one question: split screen "51'" and "55'" (both 1986 goals, from the record) |

### 14-day experiment (5–18 Nov)

**Baseline:** YouTube Analytics, audit 41877809945, latest uploads, lifetime to 2026-11-02 UTC.

| channel | n | median views | median avg view | median % viewed | rel@5% | **rel@10%** | rel@25% | watch@25% | watch@50% |
|---|---|---|---|---|---|---|---|---|---|
| ImpossibleBrief | 11 (10 with curves) | 781 | 17 s | 61.8 % | 0.49 | **0.43** | 0.38 | 0.71 | 0.50 |
| Failure Reconstructed | 9 | 321 | 15 s | 59.3 % | 0.47 | **0.42** | 0.36 | 0.88 | 0.50 |
| Hidden Logic | — | not measurable until §3.1 | | | | | | | |
| GoalLore Lab | 0 videos | first 3 Shorts set the baseline | | | | | | | |

- **Primary metric:** `relativeRetentionPerformance` at 10 % (≈ 3 s), read at D+3 (Analytics lags about 2 days).
- **Secondary metrics:** watch@25 %, average % viewed, views at D+3, subscribers per 1,000 views.
- **Arms:**
  - **Days 1–7, IB and FR:** arm A (event in motion at 0 s) on every Short, plus the frame-0 caption fix. This is the
    cheapest change and the strongest prior.
  - **Days 8–14:** alternate B and C by day.
- **Controls held fixed:** publish time (18:00 UTC), duration 26–34 s, the title-structure rotation, and no edits to
  published videos.
- **Decision rule, at day 14 (n ≈ 7 per channel, small: a direction, not proof):**
  - **Adopt** the arm when its median rel@10% is at least baseline + 0.05 on ≥ 4 Shorts and watch@50% doesn't drop.
  - **Drop** it when its median is below baseline on ≥ 4 Shorts.
  - Otherwise, extend the test.
- **Readout:** run *Repository variables check* with `audit=1` on day 7 and day 14. Tables land on
  `review/youtube-audit-<run>`.
- **What is real today:**
  - The frame-0 caption fix is real.
  - Arms A–C need per-grammar hook variants in each channel's automatic storyboard (`scripts/bto-studio/auto/*`, the
    `s1-hook` scene). That's the next engineering step, about one grammar per day, and it only applies after the merge.
  - Until then, IB and FR on main keep their current openings, which is the control.

## 6. Controlled rollout

1. **Now (owner):**
   - Decide on pausing FR and IB on main (§0).
   - Make the Studio edits (§3).
   - Fix BTO OAuth and the Analytics API.
2. **One approved premium Short per channel**, each signed by the owner on its own MP4:
   - **IB:** IB-EAR-001 "What If Earth Stopped Spinning for One Second?" (QA PASS, declared mechanism). Needs a creative verdict + HUMAN-line review.
   - **FR:** FR-lake-nyos-1986 (a concrete event; render queued, §7), or Moore tornado as the alternative.
   - **BTO:** BTO-156 microwave door (QA PASS, mechanism drawn), with the title above. Needs OAuth, research review and the policy.
   - **GLL:** GLL-021 "Two Goals, Four Minutes Apart" (QA PASS). Needs an approved voice: re-render after approval, because the content hash binds the voice.
3. **Then 1/day per channel under the signed policies**, only after the merge. Read the audit at day 7:
   - if rel@10% ≥ baseline and no QA or factual issues, keep 1/day;
   - grow IB supply through more declarations, not lower bars;
   - no channel goes above 1/day before the day-14 readout.

## 7. Pending at the time of writing

- **CI runs:**
  - [41878442797](https://github.com/eyazan/youtube-otomasyon/actions/runs/41878442797): 47 board stills.
  - FR Lake Nyos + Moore tornado MP4s, at the commit with the frame-0 caption fix.
  - Both were queued on GitHub runners. Their branches appear as `review/render-<run>-<topic>`.
- **PR #411:** open, draft, `mergeable_state: unstable`. This branch is stacked on it.
