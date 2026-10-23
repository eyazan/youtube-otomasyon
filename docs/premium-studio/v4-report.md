# Premium Studio V4: status report

Date: 2026-10-21. Branch `feat/premium-studio`, local commits only. Nothing has been pushed, merged, deployed, uploaded or scheduled.
Measured results are kept apart from judgement. Every number below was measured in this container unless it is marked otherwise.

## 1. Recovered state
- **Recovery:** the work was recovered onto `feat/premium-studio` with nothing discarded. The branch was fast-forwarded to `origin/main` (`ecd08ac`). Upstream had 45 state-only commits that touched none of the studio's files.
- **Commits:** the earlier session's work is in local commits `76c86ea` to `f1f4e39`.
- **Backup:** a tar archive of the uncommitted tree was written to the session scratchpad before any change was made.
- **Live channels:** live automation, workflows, schedules, `config/channels.json` and every `channels/*/state` file are unchanged. A test asserts that the daily report leaves state and config untouched.

## 2. Branch and commit plan
V4 adds four local commits on top of the five recovery commits:
1. `feat(premium-studio)`: Creative Director, asset manager, licensed-media `image-plate`, signature components, publish gate, and the QA check of decoded QR codes against registered values.
2. `feat(bto)`: BTO-301 storyboard V3, the asset registry and the V3 QA and review reports.
3. `feat(goal-lore-lab)`: physics kicks, standing tokens, `stadium`, `airflow`, `modelLabel` and the physics pilot design board.
4. `feat(premium-studio)`: daily readiness report, growth evidence, tests, Skills and this report.

The PR proposal is at the end of this report. A PR is opened only when the owner asks for one.

## 3. Premium quality gap analysis
The V1 and V2 problem was a slideshow look: a centred flat card on a dark desk, scene after scene, with type carrying the story. V4 adds:
- **Creative Director:** `scripts/bto-studio/creative-director.js`. `plan` picks one technique per beat from a catalogue of 14 (real object, documentary photo, sensor POV, exploded 2.5D, cross-section, technical diagram, physics model, data, comparison, timeline, quote document, tactical pitch, stadium, kinetic type). It enforces diversity rules: no technique twice in a row, at most two uses of any technique, type never alone, a cinematic hook, and a demonstration as the payoff. `audit` flags slideshow risks with reasons; it does not produce a score.
- **Bug fixed this session:** when every signalled technique would repeat the previous beat, the plan used to repeat it. It now falls back to an explanation technique.
- **Audit results for BTO-301 (measured):**

| | V1 | V2 | V3 |
|---|---|---|---|
| Audit flags | about 20 | 5 | 3 |
| Repeated lead technique | not recorded | not recorded | 0 |

  The V3 flags left are:
  - S2 scanner view: CENTRED_FLAT and THIN. This is deliberate: it shows what the sensor sees.
  - S1 hook: THIN. The flag counts only two layers, but one of them is a full-frame real photo.

## 4. Components (new in V4)
| Component | Use | Notes |
|---|---|---|
| `image-plate` (`media.js`) | licensed real-world photo | Ken Burns keyed in image pixels, marks placed in image coordinates, credit on frame, pre-decoded before capture |
| `signature-compare` (`signatures.js`) | this vs that run-length comparison | the verdicts are computed (`BTO.signatureMatch`), not hard-coded |
| `signature-ledger` | survey ledger with a search head | seeded rows; any row containing the template is regenerated, so "no match" is true by construction |
| `football-pitch` kicks | free-kick flight | RK4 with drag and Magnus lift at a fixed 1/240 s step, spin-free ghost, follow camera, `ppmKeys`/`distKeys`/`focusKeys`, standing silhouettes for low cameras |
| `stadium` (`football-atmos.js`) | night floodlit stadium | original drawing: seeded crowd texture, phone lights, beams that ramp on; world layer |
| `airflow` | Magnus mechanism | 2D potential flow past a rotating cylinder; tracers move at the model's local speed; Bernoulli pressure tint; Kutta–Joukowski lift arrow |

The physics tests check that a kick is deterministic, that sidespin brings the ball inside the post while the spin-free ghost goes wide, and that the spin-free flight stays in its vertical plane. They also check three properties of the flow model: faster flow on the spin side, uniform flow far from the ball, and no flow through the ball's surface.

## 5. BTO validation (BTO-301 V3; script and evidence unchanged)
Only the weak scenes were changed:
- **S1:** real CC0 photo hook. Brackets sit on the photo's actual finder patterns, which were located with zxing.
- **S2:** a centred camera push.
- **S5:** a signature comparison of the corner square against a logo, a table cell and a checkbox.
- **S6:** a survey ledger.
- **S7:** a loop match-dissolve back to the photo.

**Measured QA (final, 1080x1920):**
- Hard checks: PASS. No black frames.
- Loudness: −14.1 LUFS, true peak −1.8 dBTP, sample peak −1.89 dBFS.
- Text and loop: text gate 0 FAIL / 0 WARN; loop continuity 1.69.
- Audio sync and speech: first word at 0.00 s; caption sync maximum 42 ms; the narration passes the speech check.
- Similarity: the maximum correlation between scenes is 0.55.
- QR: both the first and last frames decode to the registered value.
- Determinism: 4 out of 4 test frames are identical across fresh pages.
- **UNVERIFIED:** the clipped-sample count, because FFmpeg 6.1 does not report it.
- **Warnings:** one caption cue is too fast (23.8 chars/s); the longest static hold is 1.77 s; the narration is the preview voice.

**Voice:** the approved voice is Edge `en-US-EmmaMultilingualNeural`. It cannot be reached from this container (`api.msedgeservices.com` fails through the proxy), so the narration is the Kokoro `af_heart` preview fallback with `approved:false`.

**Publish gate:** `publish-gate.js` on the V3 package gives `SCRIPT_READY` and blocks at `VISUAL_READY`, because the photo is `approved-preview` and not owner-`approved`. Even with test sign-offs, it still blocks on the preview voice and on channel publishing being disabled. The V2 package blocks at `QA_PASSED` because the creative sign-off is missing.

## 6. GoalLore Lab improvements
`scripts/bto-studio/samples/goal-lore-lab-physics-board.json` is the GLL-069 treatment: *how does a free kick curve?* It is a design sample with no narration and is never published. It has three scenes:
1. **Low floodlit camera:** behind the ball, with the wall and the keeper; the kick curls over the wall to the post.
2. **Airflow mechanism:** faster air on one side, slower air on the other, and a force arrow (`PHYSICS MODEL` chip).
3. **Overhead view:** spin flight against the spin-free ghost. Only spin brings the ball inside the post.

There is no likeness, crest or footage, and no measured number appears on screen. The model parameters are stated in `treatment.factualRisks`.

Render: 390 frames in 28.1 s (preview). I reviewed the stills and fixed three things before the video render:
- the camera was not behind the ball;
- the goal was too small for a telephoto feel;
- the stadium was a screen layer drawn over the pitch.

GLL is still unregistered and disabled, and its 109 candidates have no verified research yet.

## 7. Shared engine progress
One engine serves all channels through `profiles/<channel>.json`. Each channel has its own style pack, chips, identity, topic source and evidence policy.

| Channel | Studio status | Rollout stage |
|---|---|---|
| The Hidden Logic of Things (BTO) | renders | 1 |
| Failure Reconstructed (FR) | keeps its existing `fr-premium` engine; migration is planned | 4 |
| ImpossibleBrief (IB) | not integrated | 5 |
| GoalLore Lab (GLL) | design samples only | 6 |

CriticalThread stays live and outside the studio. No credential is shared or assumed.

## 8. Skills report
All 7 Skills are present and valid, and they are discovered headless (`claude -p` lists `premium-video-producer`, `visual-director` and `technical-animation`).
- **`premium-video-producer`:** now covers channel routing (including the GLL physics board), the Creative Director plan and audit step, the publish-gate step, the licensed-media rules, and routine operation without an interactive session.
- **`visual-director`:** audit step and technique variety.
- **`technical-animation`:** the physics models and their labelling rules.

## 9. Automation readiness (`node scripts/bto-studio/daily.js`; read-only, never uploads)
Today's output, with a target of 1 per day and a 7-day buffer:

| Channel | Status | Topics | Ready for studio | Buffer |
|---|---|---|---|---|
| FR | live | 500 | 0 (none have verified research, narration or facts) | 0/7; premium is not on the studio yet |
| IB | live | 500 | 0 (facts lack verbatim quotes; layer is KNOWN SCIENCE) | 0/7 |
| BTO | inactive by owner decision | 525 | 1 (BTO-301) | 0/7; two packages, both blocked by the gate |
| GLL | not registered | 109 candidates | 0 | 0/7 |

FR's published count is reported as unknown because this checkout has no `state/published.json` for it, so the duplicate check is not possible from here. The report says this rather than showing 0.

Four Shorts a day need a buffer of 28 `PUBLISH_APPROVED` packages and at least two channels with verified topics; neither exists yet.

**Growth evidence:** `node scripts/bto-studio/growth-evidence.js` reads each channel's own warehouse data. It counts a video only after 7 days of data and needs 10 matured videos before treating a group as a baseline.
- **IB:** 12 matured Shorts, median 614 views and 67.0% average viewed. These can be used as the baseline, with one pre-registered A/B test at a time.
- **CriticalThread:** 7 matured videos. The tool describes them but draws no conclusion.
- **FR and BTO:** no rows.

The tool makes no virality claims.

## 10. Benchmarks
Measured in this container (4 vCPU Intel Xeon 2.1 GHz, 15 GB RAM). This is **not the M1**, and no M1 figure is claimed.

| Run | Frames | Wall time | ms per frame | Peak Chromium RSS |
|---|---|---|---|---|
| BTO-301 V3 preview, cold | 948 | about 110 s | about 115 | 2.6 GB |
| V3 preview, incremental (5 of 7 segments cached) | 330 | 44.7 s | 135.5 | 2.1 GB |
| V3 final, cold (3 workers) | 948 | 130.2 s | 137.3 | 4.1 GB |
| Final audio mastering | – | 11.8 s | – | – |
| GLL physics sample (preview) | 390 | 28.1 s | – | – |

**Cost per video:** LLM $0, TTS $0, render $0. The storyboard direction was done in this interactive session and is not costed per video.

## 11. Publishing safety checklist
- [x] Packages are never auto-published; `autoPublish:false` and `uploadAttempted:false` are recorded in every package.
- [x] The gate exits 0 only at `PUBLISH_APPROVED`. Even then, the owner hands the MP4 to the existing uploader.
- [x] A preview voice cannot pass the gate (tested).
- [x] Licensed media need owner `approved` status, a licence on the allowlist (no NC, ND or unknown), a pinned sha256, cleared trademarks and people, and a credit on frame.
- [x] Duplicates are checked against `published.json` by slug, topic ID and media sha256.
- [x] Failed QA blocks the gate; UNVERIFIED results are shown as such and never upgraded to PASS.
- [x] No new channel publishing is enabled; GLL is unregistered and BTO stays inactive.
- [ ] Owner approvals still needed: the CC0 photo, the creative sign-off, the factual sign-off, the voice (Edge), and the publish approval.

## 12. Working commands
```
BTO_PREMIUM_RENDER=preview node scripts/bto-studio/studio.js --channel behind-the-ordinary --topic BTO-301 --storyboard storyboard.v3.json --quality preview|final
node scripts/bto-studio/creative-director.js plan|audit --channel behind-the-ordinary --topic BTO-301 [--storyboard storyboard.v3.json]
node scripts/bto-studio/asset-manager.js verify --channel behind-the-ordinary
node scripts/bto-studio/publish-gate.js channels/behind-the-ordinary/premium/BTO-301/out/v3/review-package.json [--approvals approvals.json]
node scripts/bto-studio/samples/render-sample.js scripts/bto-studio/samples/goal-lore-lab-physics-board.json [--stills 0.5,3.6] [--video]
node scripts/bto-studio/daily.js [--json]
node scripts/bto-studio/growth-evidence.js [--channel impossible-brief] [--json]
npm run test:premium-studio      # 24 studio tests
npm test                         # 927 JS tests + Python suite, all passing
```

## 13. Blockers
1. **Approved narration:** the Edge voice cannot be reached from this container. Fix: run narration on a machine with Edge TTS access, or approve another voice.
2. **M1 benchmarks:** they cannot be measured here.
3. **Licensed-asset sources:** Wikimedia, Commons and Openverse are blocked by the proxy. Only assets already in the repository can be registered.
4. **Owner decisions:**
   - approve or reject the CC0 photo;
   - creative and factual sign-off for BTO-301 V3;
   - whether BTO becomes active again;
   - whether to register GLL, after its YouTube identity has been verified;
   - CriticalThread's future (it is not to be deleted blindly).
5. **FR and IB topics:** both need verified narration and facts with verbatim quotes before the studio can produce them.

## PR proposal (not opened)
**Title:** Premium studio V4: Creative Director, licensed media, publish gate, GLL physics components

**Body:** sections 1 to 13 above.

**Risk:** the change is isolated to `scripts/bto-studio`, `channels/*/premium`, `.claude/skills`, `docs/premium-studio` and the tests. A test asserts that no workflow, production script or channel config references the studio.
