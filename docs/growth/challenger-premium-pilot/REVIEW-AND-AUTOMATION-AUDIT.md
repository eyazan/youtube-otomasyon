# Challenger premium pilot: review response, artifacts, and automation audit (2026-10-13)

**Status: offline prototype, NOT approved for production.**

- The premium renderer is not wired into any workflow, flag, scheduler or uploader.
- The 21:00 Europe/Istanbul Shorts schedule is unchanged.
- No video was published or uploaded to YouTube, and no paid service was called.

## 1. Artifact storage

The videos live in a **draft GitHub Release** on `eyazan/youtube-otomasyon`, tag `pilot-challenger-premium-v1-2026-10-12`.

**Why a draft release:**
- assets stay out of git history;
- assets have no expiry (Actions artifacts are capped at 90 days);
- the repository is public, but a *draft* release is visible only to people with write access. An anonymous API request returns 404 (verified).

**Retrieve everything:**

```bash
gh release download pilot-challenger-premium-v1-2026-10-12 --repo eyazan/youtube-otomasyon
```

```bash
shasum -a 256 -c SHA256SUMS.txt
```

**Assets** (all re-downloaded and checksum-verified on 2026-10-13):

| Asset | Contents | SHA-256 (prefix) |
|---|---|---|
| `challenger-premium-v1.mp4` | premium prototype, 51.70 s, from commit `661e49f3` | `65fabbe6` |
| `challenger-original.mp4` | version A: YouTube transcode of our Short `bqTpdauhlHo` | `1cacd5b9` |
| `challenger-craft-v2.mp4` | version B: Craft V2 on the original script | `b8007299` |
| `challenger-side-by-side.mp4` | A \| B \| C, with C's audio | `c87793d7` |
| `challenger-first-3-seconds-comparison.mp4` | A, B, C openings, each with its own audio | `30874043` |
| `challenger-premium-v1-review-bundle.zip` | narration script, storyboard, licence manifest, QA, frames, narration samples (the Kokoro one UNAPPROVED); local paths removed | `311c9d0c` |
| `challenger-premium-v1.1-validation-stills.zip` | the 27 stills used to validate the review fixes (§2) | `1e848881` |
| `SHA256SUMS.txt` | checksums for all of the above | — |

**Small records are also in git**, under `channels/failure-reconstructed/premium/challenger-1986/v1/`: storyboard, licence manifest, A/B/C QA, narration timelines, Craft V2 render data.

**Retention limits:**
- A draft release survives indefinitely, but a maintainer can delete it.
- **Publishing the release would make every file public**; keep it as a draft.
- The draft's web URL is `releases/tag/untagged-…`, which changes if the release is edited; retrieve by tag with `gh`.
- A second local copy sits in the original checkout under `reports/challenger-premium-2026-10-12/`. It is git-ignored and exists on that disk only.
- The session's temporary worktree will be deleted; nothing depends on it now.

## 2. Review findings: changes and validation

The fixes below are in the commit after `661e49f3` (shot list "v1.1").

**Validation method:** 27 stills rendered at the reviewed timestamps, inspected at phone scale, plus a first-frame/last-frame difference for the loop. **No full re-render was made** (instruction: validate focused, no full render). So `challenger-premium-v1.mp4` still shows v1. A v1.1 MP4 needs one render plus a human review before any test.

| # | Finding | Change (v1.1) | Validation | Status |
|---|---|---|---|---|
| 1 | Opening 0–3 s: too much in the first frame | The clock box is removed from S01. Frame 0 now shows only the photo, "CHALLENGER · 1986", the headline "Already leaking" and the provenance chip. The time moves into the evidence label, which arrives with the ring at 0.5–1.4 s. | stills at 0, 0.6, 1.3 and 2.6 s | fixed in source; needs a playback check |
| 2 | ~8 s: Rogers Fig. 14 unreadable on a phone | The figure is cropped to its joint detail (original px x 150–500, y 140–370) at about 2.9×. The Commission's own "Primary O-Ring" and "Secondary O-Ring" labels now read at about 40 px, and the two O-rings they point to are ringed. | stills at 7.4 and 8.6 s | fixed in source |
| 3 | 14–20 s: warm/cold and O-ring mechanism unclear | **S05:** each panel now shows the sealing job: a wall moves away as the joint does. Warm rubber follows ("follows: still sealed"); cold rubber lags, leaving a marked gap ("lags: gap left open"). **S06:** numbered steps land on their words: "1 Ignition flexes the joint open", "2 Cold O-rings can't follow", "3 Hot gas blows past both seals". | stills at 13.1, 13.8, 14.6, 15.6, 17.5 and 19.6 s | fixed in source |
| 4 | ~26 s: flame marker visibility at speed | The ring arrives by 0.5 s into the shot (was 0.9 s). It has a dark outline for contrast on the bright plume, pulses, and stays to the end of the shot. The label arrives at 0.3–0.7 s and is larger. | stills at 23.5, 23.8, 24.3 and 25.6 s: ring visible from 0.4 s into the shot | fixed in source; **needs a normal-speed human check** |
| 5 | 38–44 s: text-heavy | **S12:** about 40 words become about 15. A 53 °F vs 36 °F column comparison carries the point, under an exact short fragment of the quote, with no typing animation. **S13:** node text cut to "ENGINEERS / Don't launch below 53°F", "THEIR MANAGERS / Reversed it", "TOP NASA OFFICIALS / Never heard it"; the side annotation is removed. | stills at 37.2, 38.6, 39.6, 40.6, 42.6 and 45.4 s | fixed in source |
| 6 | 47–51 s: payoff and loop | **Real loop defect found and fixed.** v1's last shot framed the photo full-screen, while frame 0 uses a 1080×1400 box, so the loop jumped. S15 now ends on exactly the frame-0 framing, and the payoff fades out over the last 0.35 s. | last frame vs frame 0, photo region below the headline: mean difference **1.36 / 255**; stills at 48.6, 50.4, 51.36 and 51.66 s | fixed in source; needs a playback check |
| 7 | 51.7 s is unproven | A 30–35 s alternative is specified: `channels/failure-reconstructed/premium/challenger-1986/script-short.json`. It has 91 words, an estimated 34.5 s at the v1 read's measured rate (a test checks this), the same hook and evidence, and a shot reuse plan. It is not narrated or rendered. | `tests/js/fr-premium.test.js` checks the evidence references and the 30–35 s estimate | proposal for a controlled `length` test |
| 8 | Audio not human-approved | Unchanged, and not claimed. Technical checks only: no clipping, −14.1 LUFS, −1.8 dBTP, caption timing from Edge word boundaries. | — | **open: needs an owner listen** |

**Listening checklist for the owner** (`challenger-premium-v1.mp4`, then the narration samples in the bundle):
- Is Edge Andrew's pacing right for the subject (158 wpm overall)?
- Is the silence under the breakup still and the crew portrait right?
- Is the drone too present in S06–S09?
- Are "O-rings", "seventy-three" and "fifty-three" clear?
- Is the Kokoro `am_michael` sample acceptable as a fallback? It is not approved.

## 3. Automation reusability audit

### A. Generic: reusable by all Shorts channels

| Component | Role | Ready? |
|---|---|---|
| `scripts/fr-premium/render-vertical.js` + `fr-lib.js` | deterministic 1080×1920 renderer: photo and film layers with camera crops, SVG, provenance chips, word-highlight captions, drift against frozen holds | engine yes; reads hand-written `scenes.js` only |
| `narrate-edge.js` | beat narration, Edge word boundaries, no placeholder audio | yes (Edge itself is unreliable; see D) |
| `narrate_kokoro.py` | offline narration with exact word timing from model durations | yes, technically; voice not approved; macOS/MLX only (CI uses kokoro-onnx) |
| `mix-audio.js` | levelling, ducking, −14 LUFS master | yes |
| `sound_design.py` | procedural bed and cues from shot and word times | parameterised by shot ids; needs a cue schema |
| `qa-vertical.js` | independent final-MP4 checks: decode, black, freeze, frame-0 detail and sharpness, motion, loudness, peaks, captions, acoustic sync | yes; thresholds need calibration per channel |
| `compare.sh`, `build_manifests.py` | A/B comparisons; storyboard and licence manifest from the render | yes |
| `FR.cover` / `FR.toScreen` / `FR.clip`, `FR.callout`, `FR.ring`, `FR.chip` | phone-scale framing and annotation primitives | yes |

### B. Channel-specific (Failure Reconstructed)

- `FR.stack` (shuttle stack) and the field-joint cross-section are aerospace mechanism diagrams. The pattern (a numbered mechanism with steps tied to words) generalises; the drawings do not.
- The mission-clock HUD ("T+…") fits FR timelines; IB and CT would need their own readouts.
- Provenance chip vocabulary (NASA photo, Commission record, reconstruction) is FR's evidence model. CT is close; IB needs "illustration / model" labels.

### C. Challenger-specific

- `script.json` (lines, evidence, hooks) and `script-short.json`.
- `scenes.js` (15 hand-composed shots), `media.json` (Commons files, clip ranges and crops), `storyboard-notes.json`.
- All measured coordinates:
  - smoke position in GPN-2000-001347;
  - O-ring and label positions in Fig. 14;
  - flame position in the E-207 frames;
  - letterbox crop of the launch film.

### D. Manual editorial steps not yet automated

| Step | What I did by hand | Must become, before daily autonomous use |
|---|---|---|
| Evidence research | read Rogers Ch. III–V; extracted times and quotes | a research step that stores claim → source passage → URL, and fails closed when a line has no passage (the `script.json` evidence schema is the target format) |
| Script and hook | wrote 3 hooks, chose one, cut unsupported lines | LLM-drafted alternatives (paid, approval-gated), plus automatic checks: every line cites an evidence id; no title echo; at most N numbers per 10 s; length within the target. Then blind human review until calibrated. |
| Source selection | Commons search, read captions, rejected 2 misleading files | an automatic Commons/NASA search scored on caption semantics. Bounded: a rejection list keyed on caption phrases such as "not composed of", "artist", or a hearing cover. Licence read from metadata. |
| Licensing verification | read `LicenseShortName` per file | automatic: allow only Public domain / CC0 / CC-BY(-SA) with an attribution string; fail closed otherwise (`commons-metadata.json` already has the fields) |
| Visual-semantic alignment | chose a picture per line | a shot planner mapping line → evidence → asset with a relevance score; reject below threshold; fall back to a labelled diagram, never an unrelated photo |
| Evidence-first opening | picked GPN-2000-001347 and located the smoke by eye | frame-0 candidate ranking (subject named in the hook, sharpness, edge energy > threshold) plus a *located* point of interest. Detecting the point automatically is unsolved; bound it with a per-topic hand-placed marker or skip the ring. |
| Mechanism animation | drew the joint, stack and decision chain in SVG | a small library of parameterised mechanism templates (seal or joint, flow path, chain, timeline, comparison bars) chosen from a script step type. Hand-drawn topic diagrams cannot scale. |
| Phone-scale typography | iterated over stills (O-rings too small, labels colliding) | automatic checks in the renderer: minimum rendered text height ≥ about 30 px at 1080 width, no overlap between text boxes, no text in the caption band or right-side UI zone. ProfitDecoded's `inspectShotFrames` already measures text heights; port it. |
| Caption timing | Edge word boundaries (automatic) | already automatic; add the acoustic-sync check as a gate that ignores mid-sentence cues |
| Final-MP4 QA | `qa-vertical.js` (automatic) plus my frame inspection | automatic hard gate. Human frame review stays required until the creative checks are calibrated against audience data. |
| Repair loop | 6 render passes, about 12 fixes by hand | bounded repair: at most 2 automatic re-render attempts, each targeting one failed check (e.g. a freeze triggers drift), then stop and report. Never loop on creative judgement. |
| Narration provider | Edge 403 throttling; retried manually | the existing PR #251 approach: a speech check plus an approval-gated fallback. Never silent audio. |
| Cost control | $0 (free Edge, local Kokoro, Commons) | per-video budget enforced in code; any paid LLM or TTS step behind `MALIYET-VE-YETKILER` approvals |
| Publishing gate | nothing published | an unchanged gate: readiness and quality gates, approved voice only, provenance manifest present, licence check passed, plus a human approval flag for premium renders until a live test shows they help |

## 4. Validation (2026-10-13)

**Focused tests:** `tests/js/fr-premium.test.js`, 9/9 pass. It checks:
- every spoken line cites defined evidence (long and short scripts);
- the chosen hook is spoken first;
- the short script estimates to 30–35 s;
- every script word is timed, in order;
- every scene anchor resolves and shots tile the film with provenance labels;
- captions are at most 2 lines of 26 characters and every word is shown once;
- framing stays inside the image;
- **isolation:** no upload, paid-provider or credential reference in the prototype, and no production file (`.github/workflows`, `core`, `lib`, root scripts) references it.

**Full suite:** `node --test tests/js/*.test.js` passes 626/626, and `python3 -m unittest discover -s tests` passes 24/24.

**Branch diff vs `main`:** additions only, under:
- `scripts/fr-premium/`
- `channels/failure-reconstructed/premium/`
- `docs/growth/challenger-premium-pilot/`
- `tests/js/fr-premium.test.js`

Nothing changed in workflows, config, publishing, OAuth, schedules, `CLAUDE.md` or `docs/PROJECT_VISION.md` (PR #254 owns the latter two).

**Other checks:**
- No paid API was invoked: Edge free endpoint, local Kokoro, Commons.
- No credentials appear in committed files; local paths were removed from QA records.

## 5. Outstanding quality issues

1. v1.1 fixes are validated on stills only. A v1.1 MP4 render and a human review at phone size and normal speed are still needed: especially the flame marker, the opening's pace, and the loop.
2. Human listening approval is not done (voice, mix, silence).
3. One caption cue reads at 22.6 characters per second (limit 22).
4. Whole-video near-static share is 0.46, higher than B's 0.38: diagram shots move slowly by design. It is not a hard failure, but worth watching against retention.
5. The upscaled Fig. 14 detail is soft (the source is a 527 px scan). Readable, not crisp.
6. Length and the premium treatment are unproven with viewers; see `script-short.json` and the test design inside it.

## 6. Proposed next phase (not started)

1. **Render v1.1 and get human review.** Render v1.1 (and optionally the 35 s cut) offline. Get an owner listen and review at phone size. Record decisions.
2. **Automate the bounded parts first:**
   - port ProfitDecoded's text-size inspection into `render-vertical.js` as a hard check;
   - add licence and caption-semantic gates to source selection;
   - add the acoustic-sync gate;
   - cap repair attempts at 2.
3. **Template the mechanism animations:** joint or seal, flow path, chain, timeline, comparison. Each is driven by a structured script step, so a new FR topic needs data, not new SVG.
4. **Pilot on 2–3 more FR topics** offline. Measure how much manual work remains per video.
5. **Only then run a live test.** Run a controlled experiment through `core/growth/experiments.js`: premium vs current, and long vs short, with 5+ per arm. Gate it behind an explicit owner approval flag, keep the 21:00 schedule unchanged, and decide only on audience metrics.
