# Premium engine: four-channel readiness report (2026-10-22, updated 2026-10-27, PR #316)

Every verdict below rests on real renders whose GitHub Actions logs were read, not on job status or storyboard
validation. **Pilot success is not production readiness**: a channel is production-ready only when its own daily entry
point has run end to end with the approved voice, a final render, objective QA, the publish gate and isolation, and
nothing upstream (research, approvals, channel state) blocks it. Nothing in this PR merges, changes a schedule, sets a
flag in production or uploads.

## 1. Four-channel readiness matrix

| | ImpossibleBrief | Failure Reconstructed | The Hidden Logic of Things | GoalLore Lab |
|---|---|---|---|---|
| Automatic topic/script loading | yes: the live lane's topic (CI) | yes: live lane or top unused A case (CI) | yes: VERIFIED record BTO-301 (CI) | **no**: hand-made pilot `topic.json` |
| Storyboard generation | automatic (`auto/impossible-brief.js`) | automatic (`auto/failure-reconstructed.js`) | automatic (`auto/behind-the-ordinary.js`) | automatic (`auto/goal-lore-lab.js`) |
| Approved narration | Edge Brian Multilingual | Edge Andrew Multilingual | Edge Emma Multilingual | Edge Ryan: pilot config only, **no listening test** |
| Final rendering | yes | yes | yes | yes (pilot) |
| Objective QA | PASS | PASS | PASS, QR decodes "HIDDEN LOGIC" on first and last frame | PASS |
| Evidence verification | IB research layers (adapter readiness) | FR case file layers | VERIFIED, every fact with a verbatim quote | **no**: facts without verbatim quotes (pilot warnings) |
| Creative approval | not signed | not signed | not signed | not signed |
| Publication package | SHADOW_OF_LIVE_NOT_PUBLISHABLE (duplicate by construction) | SHADOW_OF_LIVE_NOT_PUBLISHABLE | READY_FOR_HUMAN_REVIEW | PILOT_NOT_APPROVED_FOR_PUBLICATION |
| GitHub Actions integration | daily entry point dry run green (`ib-premium-dry-run.yml`) | daily entry point dry run green (`fr-studio-dry-run.yml`) | render check green; the live lane is not run (channel inactive) | render check green (pilot); no lane |
| **Premium shadow, daily** | **READY after merge** | **READY after merge** | built, BLOCKED (channel state, research) | BLOCKED (no lane) |
| **Premium publishing** | adapter built, off; needs approvals | adapter built, off; needs approvals | adapter built, off; channel publishing disabled | not possible (no lane) |

## 2. Latest CI results

### 2026-10-27: Edge outage and recovery (head `91b9edf`, logs read)

From about 13:00 UTC on 2026-10-27 Edge refused every msedge-tts 2.1.0 handshake (`Unexpected server response: 200`).
Every scheduled production run stopped at the health pre-flight with NARRATION_UNAVAILABLE for Failure Reconstructed,
ImpossibleBrief and CriticalThread (e.g. run 40535551278): nothing was uploaded and no other voice was used. The premium
render check failed the same way on `2a0dc53` (run 40551448475). `91b9edf` pins msedge-tts 2.1.1 (new endpoint,
Sec-MS-GEC v2). **This fix exists only on the PR branch; production on `main` stays without narration until it lands.**

| Run | Workflow | Result |
|---|---|---|
| 40552102905 | TTS availability check | production client: handshake 101, voices 200, 6/6 syntheses on each of three runners; Python edge-tts 7.3.1 6/6 |
| 40552102932 | FR dry run | live lane narration check passed (Edge en-US-AndrewNeural); mars-96-1996 rendered, quality gate PUBLISH 87, upload skipped (PUBLISH=0); alaska-261-2000 held for review (REVIEW 86); shadow on mars-96-1996: Edge Andrew Multilingual (approved), objective PASS, 174 s, **9 fresh Edge requests**, 32 MB intermediates removed |
| 40552102846 | Premium render check | BTO-301: Edge Emma (approved), objective PASS, READY_FOR_HUMAN_REVIEW, render 118.8 s; GLL-P01: Edge Ryan, objective PASS, PILOT_NOT_APPROVED_FOR_PUBLICATION, render 77.1 s |
| 40552102862 | Testler | green |
| 40552102872 | IB dry run | IB_RESULT |

### 2026-10-22 (head `a955dce`, all green; logs read)

| Run | Workflow | Result |
|---|---|---|
| 39851796042 | IB dry run | live lane PUBLISH 88 (upload skipped, PUBLISH=0); shadow Edge Brian Multilingual (approved), objective PASS, 184 s (render 100.2 s), PSS 4287 MB; gate BLOCK at TOPIC_READY (duplicate of the live topic, by design); no premium output in the state diff |
| 39851796007 | FR dry run | live lane: two A cases (avianca-52-1990, usair-1016-1994) rendered and held for human review (quality gate REVIEW 89 and 88), not uploaded; standalone shadow on alaska-261-2000: Edge Andrew (approved), objective PASS, **90 s with 8/8 narration beats from the cache, 0 Edge requests**; 33 MB of intermediates removed; gate BLOCK at QA_PASSED |
| 39851795975 | Premium render check | BTO-301: Edge Emma (approved), objective PASS, QR "HIDDEN LOGIC" on both frames, READY_FOR_HUMAN_REVIEW, render 140.2 s; GLL-P01: Edge Ryan, objective PASS, PILOT_NOT_APPROVED_FOR_PUBLICATION, render 87.9 s; dependency preflight OK incl. zxingcpp and segno; dependencies installed in 19 s |
| 39851796067 | Testler | green: 978 JS tests, Python tests, actionlint, dry-run packages |
| 39851796065 | BTO integration load | green |

Earlier confirmations: BTO-301 QR decode first passed in run 39840693330 attempt 2 (`a6820d5`) and again in 39846282785
(`0a5f80e`); the IB and FR shadows passed on `af6bbd3`, `a6820d5`, `e466d76`.

## 3. Edge TTS reliability

`scripts/fr-premium/edge-client.js`, used by every premium channel's narration:

| Requirement | Implementation | Evidence |
|---|---|---|
| Bounded concurrency | `EDGE_TTS_MAX_CONCURRENCY` (default 1) lock slots per machine (`lib/slot-lock.js`, dead holders reclaimed) | `tests/js/edge-client.test.js` |
| Retry-After | honoured when the error carries it (seconds or HTTP date) | test; note: msedge-tts 2.1.x keeps the status code but drops the header, so on Edge today the backoff applies |
| Exponential backoff with jitter | rate limit from 15 s, other failures from 2.5 s, doubling, half fixed + half random, cap 120 s | test |
| Maximum retry budget | `EDGE_TTS_RETRY_BUDGET_S` (default 180 s, 30–900) shared by all beats, plus attempt caps; the narrator's timeout grows with it | tests; offline run: 3 bounded attempts then one named error |
| Narration caching / reuse | content-addressed beats (voice, rate, text, format, client version) in `.cache/edge-tts`, LRU under 200 MB, git-ignored; restored and saved by `actions/cache` in the three premium workflows | **FR run 39851796007: 8 beats cached, 0 requested, 90 s vs 142 s for the same case one run earlier** |
| No unapproved voice fallback | the client never substitutes; `BTO_PREMIUM_RENDER=final` (publishing) never falls back; preview shadows may use the marked-unapproved Kokoro preview only | tests; adapter test asserts `final` |
| Clear errors | `Edge narration failed for beat b3: rate-limited (HTTP 429) after 4 attempt(s) …; no other voice is substituted`; the studio reports that line, not Node's version banner | tests |

The repeated-identical-narration problem is solved by the cache: a re-run of the same topic and two jobs narrating the
same text call Edge once. The live lanes' own narration (`lib/shorts-tts.js`) is unchanged.

## 4. Dependency installation reliability

| Measure | Status |
|---|---|
| Dependency caching | `scripts/ci-apt.sh` `CI_APT_ARCHIVES`: downloaded `.deb` files kept in `.cache/apt`, restored by `actions/cache` (weekly key per package set) in the premium workflows, `test.yml` and `portfolio-production.yml`; pip cached by `setup-python` |
| Measured effect | cold runs on 2026-10-22: up to 43 min stalled, three failed attempts; warm run `a955dce`: render check dependencies 19 s, IB 22 s, FR 20 s |
| Version pinning | `scripts/bto-studio/requirements.txt`: numpy 2.5.3, soundfile 0.14.0, Pillow 12.3.0, segno 1.6.6, zxing-cpp 2.3.0 (wheels verified for Python 3.12) |
| Required dependency checks | `scripts/bto-studio/preflight-deps.js`: ffmpeg, ffprobe, Chromium, numpy, soundfile, PIL, plus zxingcpp and segno for QR topics; studio.js runs it before narration and fails by name; CI runs it as a step |
| Bounded retries | unchanged: three bounded apt attempts, the second and third via archive.ubuntu.com |
| Prebuilt runner image | evaluated, not built: a container image on GHCR would remove apt entirely, but needs a registry write and image maintenance; the cache gives most of the benefit without either |

## 5. Premium publishing adapter status

`core/pipeline/premium-publish.js`, **disabled**: active only with `IB_PREMIUM_PUBLISH=1`, `FR_PREMIUM_PUBLISH=1` or
`HLT_PREMIUM_PUBLISH=1`; no workflow sets one (asserted by tests).

1. **Reserve** (owner): `node core/pipeline/premium-publish.js reserve --channel <c> --topic <id> --by <name>` writes
   `channels/<c>/premium/approvals/<id>.json`. Live selection never picks a reserved topic.
2. **Review**: render the candidate (`BTO_PREMIUM_RENDER=final`, approved Edge voice); `… hash --channel <c> --topic <id>`
   prints its content hash (storyboard, narration source and lines, voice). The owner signs `creative`, `factual` and
   `publish` ({ by, at }) for exactly that hash, and writes the title, description and tags.
3. **Publish** (due day, flag on): fresh final render with the approved voice only; it must match the approved hash, pass
   objective QA, reach PUBLISH_APPROVED in the existing gate (licensed media, channel publishing enabled) and not be in
   published.json. The MP4 is then staged as a normal package, and **`youtube-yukle.js` runs unchanged**: identity check,
   quality gate, narration approval, idempotent journal, remote duplicate reconciliation, target-day publishAt.
   `PUBLISH!=1` runs `--dogrula`.
4. Any refusal returns the day to the live lane and keeps the reservation; a published premium topic is recorded and
   never uploaded again.

Tested: `tests/js/premium-publish.test.js` (7 tests). A package staged by the adapter passed the real
`youtube-yukle.js --dogrula`: MP4 found, metadata validated, the PUBLISH gate scheduled the next 21:00 slot, narration
approval ok. Nothing was uploaded.

## 6. Daily automation integration status

The production workflow runs the channels one after another on one runner, under one concurrency group, so rendering
is already serial. The shadow (`core/pipeline/premium-shadow.js`) adds:

| Requirement | How |
|---|---|
| Resource-aware scheduling | skipped, with the reason recorded, below 2.5 GB free memory or 1.5 GB free disk (configurable) |
| Bounded rendering concurrency | one premium render per machine (`PREMIUM_RENDER_MAX_CONCURRENCY`), waits up to 10 min, then skips |
| Independent failure handling | try/catch around the child; the live lane's result is never changed; each channel's step is separate |
| Idempotent jobs, safe retries | a topic whose shadow already passed is not re-rendered (`<P>_PREMIUM_FORCE=1` overrides); publishing is idempotent through the reservation record and the uploader's journal |
| Artifact cleanup | only this render's intermediates are removed (33 MB per FR Short); MP4 and reports kept in git-ignored folders |
| No secret leakage | the studio child receives no tokens, secrets, client IDs or API keys |
| No duplicate uploads, no unapproved publishing | the shadow never uploads; the adapter requires signed approvals, the hash match and the gate, and uses the existing uploader's duplicate protection |

Tested: `tests/js/premium-daily.test.js` (6 tests); production installs packages through the cache; no premium flag is
set in `portfolio-production.yml`.

## 7. Remaining blockers

- **All channels:** PR #316 not merged; no package has a creative, factual or publish sign-off; premium publishing has
  never run with the flag on.
- **ImpossibleBrief:** none beyond merge and the owner's choice to enable the shadow.
- **Failure Reconstructed:** none for the shadow. Live supply is no longer zero (two A cases reached the bar in today's
  runs, held for human review); the bar was not lowered.
- **The Hidden Logic of Things:** channel inactive (owner decision); 1 of 525 topics evidence-qualified; the live lane has
  never been run end to end in CI; channel publishing disabled, so the gate cannot reach PUBLISH_APPROVED.
- **GoalLore Lab:** identity decision (the CriticalThread credentials sign in to a channel titled GoalLore Lab; its 8
  recorded videos are not publicly visible); the CriticalThread lane still runs with PUBLISH=1; no registry entry or
  lane; no quoted research; voice not approved by listening test.
- **Production on `main` (urgent):** narration has been unavailable since 2026-10-27 13:00 UTC; the msedge-tts 2.1.1
  pin (`91b9edf`) restores it and is verified in CI on this branch, but must reach `main` (this PR or a one-commit
  hotfix) before any channel produces again.
- **Infrastructure:** Edge does not expose Retry-After through the client; the first run after a cache-key change still
  downloads from the mirror.

## 8. Exact next production activation actions (owner)

1. Review and merge PR #316. The production workflow then only gains the apt cache.
2. ImpossibleBrief shadow: in `portfolio-production.yml`, IB step env, add `IB_PREMIUM_RENDER: preview` and
   `IB_PREMIUM_QUALITY: final`; add `python -m pip install -r scripts/bto-studio/requirements.txt` and
   `node scripts/bto-studio/preflight-deps.js` to the dependency step; add the `.cache/edge-tts` cache step; upload
   `channels/impossible-brief/premium/*/out/*.mp4` as an artifact. Watch one scheduled run.
3. Failure Reconstructed shadow: the same with `FR_PREMIUM_RENDER: preview`.
4. First premium publication, per channel: reserve a topic, render the candidate, review it, sign the three approvals
   against the printed hash, then add `IB_PREMIUM_PUBLISH: '1'` (or `FR_`) to that channel's step.
5. The Hidden Logic of Things: reactivate the channel, run research to qualify more topics, enable publishing in the
   registry, then `HLT_PREMIUM_RENDER` (with `--qr` in the preflight).
6. GoalLore Lab: decide the identity, pause the CriticalThread lane, retarget its registry entry; then research with
   quotes and a voice listening test.

**Rollback:** remove the flag line from the step env. Neither the shadow nor the adapter touches published history,
analytics, credentials or ledgers; an approvals file can be deleted to release a reservation.

## Appendix: evidence per channel (real renders, CI logs read, not just job status)

### ImpossibleBrief

- **Entry point:**
  - `node shorts-sira.js --channel impossible-brief` → `core/pipeline/impossible-brief.js`.
  - The shadow runs after the live lane has finished, inside try/catch.
- **CI run 39790677787** (`ce4c159`):
  - **Survey:** visual survey buffer 0 → 18.
  - **Live lane:** IB-EAR-019 PUBLISH 88; upload skipped (`PUBLISH=0`).
  - **Shadow:**
    - Edge **en-US-BrianNeural (approved)**, final quality.
    - Objective QA **PASS**, −14 LUFS.
    - 198 s total (render 129.6 s), Chromium PSS ≈ 3.95 GB.
    - Gate blocks at TOPIC_READY (already generated: a duplicate by construction).
    - State diff shows no premium output.
- **Re-run 39831804659** (`72a4008`, after the shadow-module change for HLT, log read):
  - **Live lane:** could-earth-survive-one-day-without-earth-s-magnetic-field, PUBLISH 88, render 44 s; upload skipped
    (`PUBLISH=0`).
  - **Shadow:** exit 0, Edge **en-US-BrianMultilingualNeural (approved)**, final quality; objective QA **PASS**
    (text gate 0/0, −14.1 LUFS, −2 dBTP, caption sync max 144 ms, longest in-scene hold 1.47 s, max scene
    correlation 0.684, deterministic frames); 189 s total (render 122 s), Chromium PSS 4163 MB.
  - Gate blocks at TOPIC_READY (already generated by the live lane), as designed.
  - **State diff:** only the live lane's own state and package files; no premium output.
  - Creative Director: one THIN scene (s4), CENTRED_FLAT payoff; for human review.
  - Confirmed again on `af6bbd3` (run 39837070274: shadow PASS, 175 s, render 117.3 s, PSS 4062 MB) and `a6820d5`
    (run 39840693247, green).
  - Two earlier runs on `6bda7e5` and `149b9ea` were cancelled by pushes while the runner's Azure apt mirror was
    trickling packages (9 MB in ~4 min); not a code defect.
- **Storyboards:** all 136 studio-ready topics validate with 0 errors. 346 of 500 are not researched for the studio;
  18 are already published.
- **Local frame review** (EAR-019, HUM-050, SPA-031): objective PASS. The Creative Director flags
  CENTRED_FLAT on payoffs and THIN on single scenes. These are not hard failures; they are for human review.

### Failure Reconstructed

- **Entry point:**
  - `node shorts-sira.js --channel failure-reconstructed` (legacy lane).
  - The shadow runs after the live outcome is recorded.
- **CI run 39828652879** (`6bda7e5`, log read):
  - **Live lane:** `NO_QUALIFIED_TOPIC: 79 unused A topic(s), best viral score 74 < minimum 75`. It skipped; the bar
    was not lowered.
  - **Standalone shadow** on the top unused A case (avianca-52-1990):
    - Edge **en-US-AndrewMultilingualNeural (approved)**, final quality.
    - All hard QA checks PASS:
      - text gate 0 FAIL / 0 WARN;
      - −14.1 LUFS, −2 dBTP;
      - caption sync max 90 ms;
      - deterministic frames;
      - longest in-scene hold 1.2 s;
      - max scene correlation 0.769.
    - 88 s total (render 54.4 s), Chromium PSS 3871 MB.
    - Gate: TOPIC/SCRIPT/VISUAL_READY, RENDERED, then **BLOCK at QA_PASSED** (creative sign-off missing).
  - **State diff:** only growth logs and stage files. No premium output, and the run commits nothing.
- **Re-run 39830171039** (`149b9ea`, after the shadow-module change, log read): same case, Edge Andrew (approved),
  objective PASS, text gate 0/0, 84 s (render 51 s), Chromium PSS 4022 MB; gate BLOCK at QA_PASSED; state diff again
  only growth state and stage files.
- **Run 39834813659** (`2a10b6f`): the shadow failed safely on Edge HTTP 429 (it narrated at the same time as the
  render check); no placeholder voice, live lane unaffected. Fixed by the CI rate-limit budget below.
- **Runs 39837070184** (`af6bbd3`) **and 39840693537** (`a6820d5`): shadow PASS again, Edge Andrew (approved), gate
  BLOCK at QA_PASSED, state diff without premium output.
- **Previous run 39790677333** (`ce4c159`): same case, 141 s, PASS.
- **Storyboards:** all 332 ready case files (of 377) validate.
- **Creative Director:** THIN on every scene; LOW_MOTION on chain scenes s3/s7; s7 LOW_NOVELTY and SAME_ENV.
  - The forensic grammar is legible but sparse.
  - A human reviewer should judge it before any premium publishing is built; it does not block the shadow.
  - No new component was added, because no failed real video demonstrated the need.
- **Supply (blocker for daily output, live and shadow):**
  - 0 A cases at the bar today. The same-family recent-fatigue penalty is −22 per upload in 30 days.
  - A 7-day simulation on main state still selects daily as fatigue ages out, but with one topic of margin.
  - The fix is researched case files, not a lower bar.

### The Hidden Logic of Things (behind-the-ordinary)

- **Generator:** `scripts/bto-studio/auto/behind-the-ordinary.js`, a documentary-desk grammar.
  - Quote cards are verbatim from the cited fact.
  - On-screen digits must appear in cited facts.
  - The real, decodable QR symbol appears when the topic prepared one.
- **Evidence-qualified render (BTO-301, VERIFIED, every fact quoted):**
  - **First CI render, run 39790677366** (Edge Emma, final): QA **FAIL**: 2.3 s static hold on a quote scene, text
    collisions (rotated cards), no on-screen QR. Fixed in `6bda7e5`. A literal "factLabel" chip is now also a
    validation error.
  - **Local re-render** (Kokoro preview, marked unapproved): objective QA PASS, QR decodes first and last frame,
    text gate 0/0.
  - **CI re-render, run 39835922184** (`8b50137`, log read): Edge **en-US-EmmaMultilingualNeural (approved)**, final
    render 94.8 s, Chromium PSS 2370 MB. Every hard check PASS (text gate 0/0, −13.9 LUFS, −2.8 dBTP, caption sync
    max 60 ms, max scene correlation 0.844, deterministic frames) **except** "on-screen QR decodes": "no decode" on
    both frames. Root cause: the CI job installed Python without `zxing-cpp`, so the decoder import failed and every
    decode read as an unreadable symbol; the same render decodes "HIDDEN LOGIC" locally. Fixed in `af6bbd3` (pinned
    `zxing-cpp` installed; QA now names a decoder failure, and the check still fails closed). WARNs for review: two
    caption cues at 23.3 chars/s, one 1.7 s in-scene hold (s3-year); Creative Director flags SMALL_TEXT on the quote
    and year scenes and SAME_ENV (desk) across the Short.
  - **CI re-render with the decoder, run 39840693330 attempt 2** (`a6820d5`, log read; attempt 1 died in `apt`
    before rendering and was re-run once): objective QA **PASS**, Edge **Emma (approved)**, render 96.8 s, Chromium
    PSS 2390 MB, **QR decodes "HIDDEN LOGIC" on the first and last frame**, text gate 0/0, deterministic frames.
    Package **READY_FOR_HUMAN_REVIEW**; nothing uploaded. Same WARNs and Creative Director flags as above.
    This is the evidence-qualified BTO topic rendered automatically end to end; it is not production-ready
    (channel inactive, 1 of 525 topics qualified, no live-lane CI dry run).
- **Daily entry point:**
  - `shorts-sira.js --channel behind-the-ordinary`, manual dispatch only (`portfolio-production.yml`; `BTO_ACTIVE`
    gate). It now carries the disabled shadow `HLT_PREMIUM_RENDER=preview` (`01c6691`).
  - **Defect found and fixed first:** `premium/BTO-301/` holds tracked pilots, so a shadow render there would have been
    committed by the production `git add channels`. Shadows now render into git-ignored `premium/shadow/<topic>/`.
  - **Local run of the real shadow module on BTO-301:** exit 0 in 190 s (render 138.7 s, PSS 1897 MB), objective
    PASS, SHADOW_OF_LIVE_NOT_PUBLISHABLE, **no tracked file changed**.
  - **Not exercised in CI:** the live BTO lane, because the channel is inactive.
- **Blocks:**
  1. The owner decision to reactivate BTO.
  2. Research: dispatch `bto-research.yml` (it commits records to main, so it is a production write).
  3. The CI entry-point dry run, once a second VERIFIED topic exists.

  Evidence requirements were not weakened: QUESTION_ONLY and unquoted records are refused (tested).

### GoalLore Lab

- **Generator:** `scripts/bto-studio/auto/goal-lore-lab.js`. It reuses the football components (stadium, pitch with
  generic model kick, dot-board, timeline ruler, airflow, spiral plot, line-art boot and ball). The grammar branches by
  what the line carries:
  - physics (airflow → spiral);
  - strike / flight (two views);
  - "when" (dot-board);
  - year (ruler);
  - number;
  - story (narrative text over the stadium).

  Football physics, player stories, tactics and historical narratives therefore get different scene types rather than
  one style. Every kick is chipped MODEL plus CONCEPTUAL. Players are never drawn as likenesses, and no broadcast
  footage is used.
- **Renders:**
  - Local auto render of the GLL-P01 pilot: objective PASS.
  - **CI render, run 39835922184** (`8b50137`, log read): Edge **en-GB-RyanNeural**, objective QA **PASS** (text gate
    0/0, −14.2 LUFS, −1.8 dBTP, longest in-scene hold 1.37 s, max scene correlation 0.824, deterministic frames),
    render 65.1 s for 1167 frames, Chromium PSS 2416 MB; package PILOT_NOT_APPROVED_FOR_PUBLICATION. WARNs: caption
    sync max 154 ms; Creative Director flags LOW_MOTION on s3/s8 and CENTRED_FLAT/THIN on four scenes. Ryan is
    marked approved in the pilot config only; a listening test is still owed before any production use.
  - Earlier runs failed safely on Edge HTTP 429 (the studio never substitutes another voice). The CI checks now
    allow up to 6 rate-limit retries (`EDGE_RATE_LIMIT_RETRIES`); production keeps the default 3.
- **Identity validation (step 4):**
  - CriticalThread's credentials authenticate as `UCBTEWcPZvo4B71hFw9Do_NA`: the `saglik.js` health check on main,
    2026-10-21.
  - Public metadata of that ID: title **GoalLore Lab**, 0 public videos.
  - **New today:** none of CriticalThread's 8 recorded video IDs resolves publicly:
    - 7q3E09HMIGI, fGE8kZOaQZ4, hsuWhB8lCvU, wG9a6kQL8Kc, rAZ4cE4A0DE, 7g6pgV-E0PE, 24eJvZ2cswc, OOFFfcr0rC4
    - Source: vidIQ video lookup, 2026-10-22.
  - Whether they were made private or deleted cannot be seen without the channel's own credentials. The owner should
    confirm in YouTube Studio before any migration.
  - The historical records are preserved: `channels/critical-thread/state/published.json` (8 rows) and analytics
    state are untouched. The migration plan retargets the existing `critical-thread` registry entry. It does not add a
    second entry for the same account.
  - **Live risk, still open:** the `critical-thread` lane is scheduled with `PUBLISH=1`. Any qualifying engineering
    topic would be uploaded into the GoalLore Lab channel. It produces nothing today (0 qualified topics). Pausing it
    is a schedule change, and the owner's to make.
- **Blocks:**
  1. The owner identity decision, and confirmation of the 8 videos' status.
  2. Pausing the CriticalThread lane.
  3. Retargeting the registry entry.
  4. Research with verbatim quotes (a `--channel goal-lore-lab` mode for `bto-research.js`).
  5. A voice approved by listening test.
  6. Only then a live lane and shadow flag.

  `studioRenders` stays false; pilot renders only.

