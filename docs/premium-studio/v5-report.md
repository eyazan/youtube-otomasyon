# Premium Studio V5: status report

Date: 2026-10-21. Branch `feat/premium-studio`, pushed. Draft PR: https://github.com/eyazan/youtube-otomasyon/pull/316 (not merged, not deployed).

Throughout this report, measured results are kept apart from judgement. Nothing was published, scheduled or uploaded, and no live workflow, schedule, registry entry, credential or channel state file was changed.

## 1. Git preservation status
- **Working tree:** was clean at the start of V5. The 9 local commits (5 recovery plus 4 from V4) were inspected and preserved.
- **Secret scan:** of the branch diff. The only hits were environment-variable *names* (for example `GLL_YT_REFRESH_TOKEN` in an unset config map). The committed logs contain no token, bearer string, proxy credential or key.
- **Push:** a normal `git push -u origin feat/premium-studio` as a new branch. There was no force-push and no remote work was overwritten.
- **Commits:** V5 adds its commits on top; see the PR.

## 2. Compatibility with origin/main
| Check | Result |
|---|---|
| Divergence | the branch base is `ecd08ac`; origin/main is now 27 commits ahead (`d119a84`) |
| What upstream changed | 124 files, all automated: channel state, analytics warehouses, growth and memory files, reports, `icerik/` content packages |
| Merge conflicts | **none**: `git merge-tree` is clean, and no file is changed on both sides |
| Workflow differences | none: upstream changed no `.github/workflows` file in this range, and neither did the branch |
| Channel registry differences | none: `config/channels.json` is unchanged on both sides |
| Breaking changes | none found: the branch touches no `core/`, `lib/` or production `scripts/` file outside `scripts/bto-studio`. It adds `premium:*` npm scripts and a `test:premium-studio` script to `package.json`. |
| Required migration changes | none to merge the code. Using GoalLore Lab in production needs the identity work in §5. |

## 3. Second BTO premium Short: BTO-040 "The Shopping Cart Started as a Folding Chair"
**Topic selection, honestly reported.** No second BTO topic is production-ready:
- **The 7 researched topics:**
  - BTO-016, BTO-017, BTO-135 and BTO-256 are already published. BTO-016 (`ZTtPwqBSxpA`) was a duplicate that the adapter correctly blocks.
  - BTO-301 is the QR topic.
  - BTO-040 and BTO-226 are demoted to `NEEDS_PRIMARY_SOURCE`.
- **The other 518 topics:** `QUESTION_ONLY`.
- **This session's research attempt:** the build environment cannot fetch levistrauss.com, okhistory.org, Wikipedia or archive.org (the proxy refuses them). So the missing primary-source quotes could not be captured here, and none were written.

I chose BTO-040 (the most distinct story from the QR video) and rendered it with a new, guarded `--research-pending` mode:
- It is preview-only.
- It tolerates only the primary-source gap; published, question-only and unquoted topics are still refused (tested).
- Every frame carries `RESEARCH PENDING · NOT FOR PUBLICATION`.
- The verdict is `RESEARCH_PENDING_NOT_PUBLISHABLE`, and the gate blocks it at TOPIC_READY.

The evidence gaps are listed line by line in `channels/behind-the-ordinary/premium/BTO-040/out/evidence-report.md`. In particular, L2 "shoppers refused" and the end of L6 "pushed her last baby" are not in any captured quote.

**Creative treatment:** 8 scenes, all original code drawings, built from 4 new generic components (`rig-3d`, `store-aisle`, `figure`, `floor-plan`) plus `line-art`.
1. A 1930s grocery aisle with a folding chair on wheels rolling toward the camera.
2. Silhouetted shoppers walking past it.
3. The 1936 timeline, with Goldman and an overflowing hand basket.
4. A spotlit exploded assembly: chair, then basket, then wheels, each part named.
5. The seat folding up as the year moves to 1937, with the verbatim "folding basket carriers" quote.
6. A dashed pram outline drawn over the cart (marked conceptual).
7. A store plan where models push carts and shoppers follow.
8. Carts multiplying in the aisle, then the loop back to frame 0.

**Outputs** (local; MP4s and PNGs are git-ignored and were sent to the owner):
- `the-shopping-cart-started-as-a-folding-chair-premium-final.mp4` (1080x1920, 30 fps) and `...-premium-preview.mp4` (540x960, the mobile preview);
- `contact-sheet.png`, `scene-sheet.png`;
- `qa-report.md`, `creative-review.md`, `evidence-report.md`, `review-package.json`.

## 4. GoalLore Lab full pilot: GLL-P01 "The Free Kick That Turned Into a Spiral"
**Topic:** Roberto Carlos's free kick for Brazil against France in Lyon on 3 June 1997, and the 2010 *New Journal of Physics* paper "The spinning ball spiral" (Dupeux, Le Goff, Quéré, Clanet), which explains why the bend came late. It is a legendary moment and real physics with broad international appeal.

**Research:** web search only. Pages could not be fetched, so **no verbatim quote was captured** and the GLL rule `requiresVerbatimQuotes` is not met.
- **Used:** claims corroborated by several outlets.
- **Single-source and used:** "the goalkeeper never moved". It is marked as single-source, to be re-checked.
- **Single-source and dropped:** the ball boy and off-the-post details.
- **Not used:** any distance, speed or spin figure, because reported distances disagree (33 m to 40 yards).

The pilot lives in `channels/goal-lore-lab/premium/pilots/GLL-P01/` (`topic.json` with the research note, `evidence-report.md`). It is rendered through the new `--pilot` mode:
- The channel object is built from GLL's own config; there is no registry entry, state or credentials.
- It is preview-only.
- Every frame carries `PILOT · NOT APPROVED FOR PUBLICATION`.
- The verdict is `PILOT_NOT_APPROVED_FOR_PUBLICATION`, and the gate refuses pilot packages.

**Script:** 9 lines, 38.1 s; the GLL target is 35–55 s. It ends on the slogan "Every goal has a story."

**Hybrid visuals:**
1. **Hook:** a floodlit original stadium from a low camera behind the ball and a four-man wall. The model kick sails wide of the post, then turns.
2. **Scoreboard:** an original LED dot-matrix board reads LYON / 3 JUNE 1997 / BRAZIL V FRANCE.
3. **Strike close-up:** the outside of the boot meets the ball and sets it spinning.
4. **Follow camera:** the ball swinging around the wall and heading wide.
5. **Goal-mouth view:** the ball bends back in past a keeper who stays planted.
6. **Journal page:** the timeline runs from 1997 to 2010.
7. **Airflow model:** in the ball's frame, spin produces a sideways push; drag slows the ball (the speed gauge falls) while the spin gauge holds.
8. **Spiral plot:** a top view of the drag + Magnus model. The stretch a real kick flies is solid; the rest is the model's spiral, with turning circles shrinking.
9. **Payoff:** back behind the ball, then the brand line.

The trajectories come from the RK4 drag + Magnus model with illustrative launch values and are labelled RECONSTRUCTION and PHYSICS MODEL. There is no likeness, kit, crest, footage or photograph.

New generic components: `dot-board` and `spiral-plot`, plus `slowKeys`, a drag arrow and gauges on `airflow`.

**Outputs** (local; sent to the owner):
- `the-free-kick-that-turned-into-a-spiral-premium-final.mp4` (1080x1920) and the preview;
- `contact-sheet.png`;
- `qa-report.md`, `creative-review.md`, `evidence-report.md`.

## 5. Contact sheets and audio/visual QA
### Measured (objective QA)
| Check | BTO-040 final | GLL-P01 final |
|---|---|---|
| Resolution, codec, decode | 1080x1920 30 fps h264, 0 errors | 1080x1920 30 fps h264, 0 errors |
| Duration | 32.07 s (BTO target 30–50 s) | 38.47 s (inside both the QA default 30–50 s and GLL's 35–55 s) |
| Loudness / true peak | −14.1 LUFS / −1.8 dBTP | −14.0 LUFS / −1.9 dBTP |
| Clipped samples | UNVERIFIED (FFmpeg 6.1 has no counter); sample peak and flat factor PASS | UNVERIFIED; sample peak and flat factor PASS |
| Black frames, silence ≥ 1 s, static holds ≥ 2 s | none | none |
| Text gate (collisions, caption band, edges, size) | PASS, min 30 px | PASS, min 30 px |
| Caption sync vs narration | PASS | PASS (max 30 ms) |
| Loop continuity | PASS | **WARN**: ends on the brand line, not the opening frame |
| Scene similarity (max key-frame correlation) | 0.846 (PASS ≤ 0.92) | 0.736 |
| Determinism (fresh pages) | 4/4 identical | 4/4 identical |
| Narration voice | **WARN**: Kokoro af_heart preview; the approved Edge voice is unreachable | **WARN**: Kokoro bm_george preview; GLL's voice is still a candidate |
| Hard-check verdict | PASS (package `RESEARCH_PENDING_NOT_PUBLISHABLE`) | PASS (package `PILOT_NOT_APPROVED_FOR_PUBLICATION`) |

### Creative review (judgement, not measurement)
`creative-director.js review` measures every scene from 3 decoded frames: motion, novelty against the previous scene, on-screen text share, and the smallest text. It puts those next to the human rubric (storytelling, clarity, emotion, transition motivation, asset relevance).

The reviewer notes in each `creative-notes.json` are mine, marked `Claude (AI reviewer…; human review pending)`. No automated score replaces them, and passing the technical checks does not make either video premium.
- **BTO-040:**
  - Keep: S1, S4, S5, S8.
  - Revise: S2 (the refusal is only implied), S6 (lowest measured motion), S7 (flat plan with small movers).
- **GLL-P01:**
  - Keep: S1, S4, S5, S7, S8.
  - Revise: S2 (the board holds still for 2.5 s), S3 (crude boot outline).

**Defects found and fixed during V5:**
- The rig's back-face test and light direction were inverted: it drew far faces and left tops unlit. Fixed and re-rendered.
- A depth-axis sign mistake left the hook cart off-screen at frame 0.
- An unresolved time anchor (`drawEnd`) blanked the spiral plot.
- The schema hard-coded BTO.
- An automatic "CENTRED" composition flag proved unreliable on textured frames, so it was removed and the raw offset is reported instead.

## 6. Rendering performance
Measured in this container: 4 vCPU Intel Xeon 2.1 GHz, 15 GB RAM. This is **not the M1**, and no M1 number is claimed.

| Run | Frames | Wall time | ms per frame | Peak Chromium RSS |
|---|---|---|---|---|
| BTO-040 preview, cold | 962 | 89.4 s | 92.9 | 2.5 GB |
| BTO-040 preview, incremental (5 of 8 cached) | 470 | 51.0 s | 108.5 | 2.4 GB |
| BTO-040 final, cold (3 workers) | 962 | 100.7 s | 104.7 | 4.0 GB |
| GLL-P01 preview, cold | 1154 | 89.1 s | 77.2 | 2.5 GB |
| GLL-P01 preview, incremental (6 of 9 cached) | 375 | 30.3 s | 80.7 | 2.4 GB |
| GLL-P01 final, cold (3 workers) | 1154 | 111.8 s | 96.9 | 3.9 GB |

Other stages:
- **Kokoro narration (CPU):** 28.8–59.4 s per video.
- **Audio mastering:** 10–12 s.

**Costs:** model $0, TTS $0, render $0. The storyboards were directed in this interactive session, which is not metered per video.

## 7. Verified channel migration checklist (GoalLore Lab replacing CriticalThread)
**Verified from the repository, without reading any secret:**
- **CriticalThread is live:**
  - registry `enabled: true`;
  - its own `CT_*` credentials (`CT_CLIENT_ID`, `CT_CLIENT_SECRET`, `CT_YT_REFRESH_TOKEN`, `CT_YT_CHANNEL_ID`);
  - publishing gated by the repository variable `CT_PUBLISH`;
  - `allowLegacyYouTubeEnv: false`;
  - isolated paths.
  - 8 rows in its published history (2026-09-30 to 2026-10-13).
  - The latest health check (2026-10-20) reports "NO_QUALIFIED_TOPIC" (it skips rather than publishing weak topics).
- **The CriticalThread token's identity:** the 2026-10-20 production health check recorded the authenticated YouTube channel as **`UCBTEWcPZvo4B71hFw9Do_NA`**. The same ID appears in CT package metadata as `expectedYouTubeChannelId`.
- **Isolation between channels:** each live channel authenticates as a different YouTube channel:
  - FR `UC2ruKNeR_C9JEpjWJGWbFYg`;
  - IB `UCPNyvGBI4JdQElc7ljuIuMw`;
  - CT `UCBTEWcPZvo4B71hFw9Do_NA`.
- **The identity gate:** `lib/yt.js` `verifyChannelIdentity` blocks every upload or write when `channels.list(mine=true)` differs from `<PREFIX>_YT_CHANNEL_ID` (CHANNEL_MISMATCH), or when that ID is missing.
- **CriticalThread's dependencies:** 10 workflows reference CriticalThread or `CT_*` (including portfolio-production, production-watchdog, growth-feedback-loop, ct-research, test).
- **Analytics isolation:** per-channel warehouses (`channels/critical-thread/analytics/warehouse`).
- **GoalLore Lab:** unregistered, `enabled: false`, `publishingEnabled: false`, `credentialsCreated: false`. `GLL_YT_CHANNEL_ID` is unset and there is no `youtubeChannelId`. The handle `@GoalLoreLab` and the slogan are only in config.

**Not verifiable here:** whether `UCBTEWcPZvo4B71hFw9Do_NA` is the channel the owner intends to rebrand as GoalLore Lab, or whether GoalLore Lab is a different, new channel. Its current title, handle and branding cannot be read without the API.

**Checklist** (nothing here is done automatically):
1. **Owner:** state the intended GoalLore Lab channel ID (YouTube Studio → Settings → Channel → Advanced settings). Is it `UCBTEWcPZvo4B71hFw9Do_NA` (rebrand CriticalThread) or a new channel?
2. **If it is a rebrand of the same channel:**
   - Keep the `CT_*` token (it already proves that identity).
   - Plan a separate config change that gives GoalLore Lab its own slug, paths and prefix, *or* renames CriticalThread in place. Either way, `expectedChannelId` must equal `UCBTEWcPZvo4B71hFw9Do_NA`.
   - Do not copy `CT_*` values into `GLL_*` without re-running the identity check.
3. **If it is a new channel:** create GLL OAuth credentials for that channel and set `GLL_YT_CHANNEL_ID`. A dry-run `verifyChannelIdentity` must return the intended ID before anything else.
4. **Before any change:**
   - set `CT_PUBLISH` to 0 by owner decision (pausing CT schedules is a production-schedule change and needs explicit approval);
   - archive CT history in place: `channels/critical-thread/state`, `analytics` and `reports` stay in git.
5. **Branding:** update the YouTube channel name, handle, avatar and banner in YouTube Studio (owner). Only then register `goal-lore-lab` in `config/channels.json` with `enabled: false`.
6. **Workflows:** add GLL to the workflows one at a time in reviewed PRs, with `GLL_PUBLISH` off. Leave the CT references until GLL publishes successfully on its own.
7. **First publish:** enable `GLL_PUBLISH` only after:
   - a verified topic with verbatim quotes;
   - an approved voice;
   - a gate result of PUBLISH_APPROVED;
   - a passing health check that prints the intended channel ID.
8. **Retire CriticalThread code:** only after N successful GLL publishes and an owner decision. Never delete its history.

## 8. Daily automation readiness matrix
Run `node scripts/bto-studio/daily.js --matrix`. It reads files only; it never renders, uploads or schedules.

| Dimension | Failure Reconstructed | ImpossibleBrief | Hidden Logic (BTO) | GoalLore Lab |
|---|---|---|---|---|
| Topic readiness (studio rules) | BLOCKED 0/500 | BLOCKED 0/500 | READY 1/525 | BLOCKED 0/109 candidates |
| Research completeness | BLOCKED (no VERIFIED, quoted facts in the studio format) | BLOCKED (facts lack verbatim quotes) | PARTIAL 5 verified, 4 fully quoted | BLOCKED (pilot only) |
| Script readiness | BLOCKED (0 narration scripts in the universe) | READY (154) | READY (7) | BLOCKED |
| Narration | READY in CI (Edge Andrew); unreachable here | READY in CI (Edge Brian) | PARTIAL (Edge Emma approved, unreachable here) | BLOCKED (voice is a candidate) |
| Premium renderer | PARTIAL (`fr-premium` engine; studio migration is stage 4) | BLOCKED (stage 5) | READY (studio) | BLOCKED for production (pilot mode only) |
| Quality gates | PARTIAL (production gates; premium gate not wired) | PARTIAL | READY (QA + publish gate) | BLOCKED |
| Channel credentials | READY (identity verified 2026-10-20) | READY (identity verified 2026-10-20) | UNKNOWN (no health check since deactivation) | BLOCKED (none) |
| Duplicate prevention | READY (28 rows, `icerik/yayinlananlar.json`) | READY (19 rows) | READY (5 rows) | PARTIAL (no state yet) |
| Publishing permission | PARTIAL (registry on; `FR_PUBLISH` variable not readable here) | PARTIAL (`IB_PUBLISH`) | BLOCKED (owner made it inactive) | BLOCKED (unregistered) |
| Scheduler compatibility | PARTIAL (13 workflows; studio not wired) | PARTIAL (13) | PARTIAL (12) | BLOCKED (no workflow) |

Each channel is independently deployable by design: separate prefix, paths, identity, publish flag and profile. One premium Short per day per channel is **not** achievable yet. The binding constraints are verified topics with verbatim quotes (all four channels), the approved voice being reachable from where rendering runs, and wiring the studio into a scheduler (which needs explicit authorisation). No live workflow was modified.

## 9. YouTube growth experiments
These are measured from each channel's own warehouse (`growth-evidence.js`), with no promises. Current evidence:
- **IB:** 12 matured Shorts, median 614 views, 67.0% average viewed. These can serve as a baseline.
- **CriticalThread:** 7 matured videos, so the tool describes them without concluding anything.
- **FR and BTO:** no warehouse rows.

Rules for every experiment:
- one variable at a time;
- pre-registered;
- at least 10 matured videos (7 days or more) per arm;
- judged on average view percentage, average view duration, net subscribers per 1,000 views, and shares per 1,000 views;
- stopped early only on a QA or policy problem.

| Experiment | Arm A | Arm B | Primary metric | Notes |
|---|---|---|---|---|
| Opening visual | object or event on screen at frame 0 (BTO-040, GLL-P01 style) | title or text card first | average view % | the hook frame is measurable from the creative review |
| Topic selection | "everyday object, surprising origin" | "how it works inside" | views per impression where available; otherwise median views | one channel at a time |
| Story pacing | 7–8 beats over about 32 s | 9 beats over about 38 s | average view % and drop-off timing | same voice and look |
| Narration | approved voice A | approved voice B (blind-tested first) | average view duration | never a preview voice in production |
| Video duration | 30–35 s | 40–50 s | average view duration and % | report both, since they trade off |
| Packaging | title as a question | title as a statement | views in the first 72 h (matured comparison) | thumbnail and frame-0 still held constant |

Subscriber conversion is tracked as net subscribers per 1,000 views per arm. Monetisation potential is reported only from real watch-time data, never forecast.

## 10. Remaining blockers
1. **Verified research:**
   - No second BTO topic has quotes from non-Wikipedia primary sources.
   - GLL has no quote-verified topic.
   - The source sites are unreachable from this container.
2. **Approved narration:** Edge TTS is unreachable here, and GLL has no approved voice.
3. **Owner decisions:**
   - the GoalLore Lab channel identity (rebrand of `UCBTEWcPZvo4B71hFw9Do_NA`, or a new channel);
   - pausing CriticalThread, if it is a rebrand;
   - creative and factual sign-offs;
   - the CC0 photo for BTO-301;
   - BTO reactivation.
4. **Scheduler wiring:** the studio is in no workflow. Wiring it needs explicit authorisation.
5. **M1 benchmarks:** they cannot be measured here.

## 11. Exact next steps
1. **Research (needs network access to sources):** for BTO-040, capture verbatim quotes for L2, L3, L6 and L8 from okhistory.org GO004 or another non-Wikipedia source. Settle 1936 vs 1937. Then set VERIFIED through the research pipeline and re-render without `--research-pending`.
2. **GLL-P01 research:** open the 7 URLs in `topic.json` and copy one verbatim quote per fact. Re-check the two single-source details. Read the HAL paper and quote its spiral statement.
3. **Narration:** run `node scripts/bto-studio/narrate.js` with `--voice edge` (or the studio with `--voice edge`) from a machine or CI runner that reaches `api.msedgeservices.com`. Blind-test GLL voice candidates and approve one.
4. **Owner:** answer checklist item 7.1 (the GLL channel ID) and choose rebrand or new channel.
5. **Creative revisions** (one pass each, from the review): BTO-040 S2, S6, S7; GLL-P01 S2, S3.
6. **After 1–5:** run the publish gate. Only on PUBLISH_APPROVED may the owner hand an MP4 to the existing uploader.
7. **Then:** a reviewed PR that wires `daily.js --matrix` into a read-only scheduled report (no uploads).

## Working commands
```
BTO_PREMIUM_RENDER=preview node scripts/bto-studio/studio.js --channel behind-the-ordinary --topic BTO-040 --research-pending --quality preview|final
BTO_PREMIUM_RENDER=preview node scripts/bto-studio/studio.js --pilot channels/goal-lore-lab/premium/pilots/GLL-P01 --kokoro-voice bm_george --quality preview|final
node channels/behind-the-ordinary/premium/BTO-040/build-storyboard.js           # regenerate the BTO-040 storyboard
node channels/goal-lore-lab/premium/pilots/GLL-P01/build-storyboard.js          # regenerate the pilot storyboard
node scripts/bto-studio/creative-director.js plan --channel behind-the-ordinary --topic BTO-040
node scripts/bto-studio/creative-director.js review --out channels/behind-the-ordinary/premium/BTO-040/out
node scripts/bto-studio/publish-gate.js <out>/review-package.json
node scripts/bto-studio/daily.js --matrix
node scripts/bto-studio/growth-evidence.js
npm test
```
(Kokoro preview narration needs `SHORTS_KOKORO_DIR` pointing at the model files; see `scripts/kokoro-model.sh`.)
