# Challenger premium V3: evaluation report (2026-10-13)

**Owner decision:** V3 is the current **evaluation baseline. Not approved for production.**
- Nothing was published or uploaded to YouTube; no paid API.
- No change to workflows, schedules or voice approvals.
- V3 was rendered **once**. It is not re-rendered here.

## 1. The video

| | |
|---|---|
| File | `challenger-premium-v3.mp4` (draft release `pilot-challenger-premium-v1-2026-10-12`) |
| SHA-256 | `cd25df59f7fb902c115bdf20c8849beadf7ea7a30294149a257b03db24852151` |
| Source | `594a7067` plus the working tree committed as `9172f625` (`v3/qa/SOURCE.txt`) |
| Format | 1080×1920, 30 fps, H.264 High, 1551 frames, 51.70 s |
| Audio | copied unchanged from V2 (decoded PCM identical): Edge `en-US-AndrewNeural`, **voice not approved** |

**V3 = V2 + the Phase 1B scenes + two V3 changes:**

| Part | Change from V2 |
|---|---|
| Opening (S01) | photo, ring and evidence label unchanged. "Already leaking" alone for 0.75 s and gone by 1.0 s; captions from 1.0 s. Frame 0 is byte-identical to V2's. |
| A (S02–S03) | one camera from the NASA photo: traced right booster and aft field joint → push into Rogers Fig. 14 |
| B (S05) | warm and cold O-ring in real time (0.6 s opening); 2 temperatures, GAP and one source line |
| C (S08–S09) | E-207 full width; match cut on flame point and angle; Commission event clock. **V3:** localized push onto the aft attachment and dome from the strut event (phone readability); drawing clipped above the captions |
| D (S12–S13) | document camera over the Thiokol p. 90 chart; the p. 97 telefax slides over it; p. 82 finding |
| Rest (S04, S06, S07, S10, S11, S14, S15) | unchanged V2 shots |

## 2. V2 vs V3 contact sheets

`reports/challenger-premium-2026-10-12/v3-contact/challenger-v2-vs-v3-contact-{1..4}.png` (also in the draft release).
- 1 frame per second, 216×384 (phone scale): V2 on top, V3 below.
- Sheets cover 0–13 s, 13–26 s, 26–39 s and 39–52 s.

## 3. Technical QA (final MP4; thresholds unchanged)

| Check | Result |
|---|---|
| Full decode | PASS: 0 errors, 1551 frames |
| Resolution / fps / codec / duration | PASS: 1080×1920, 30/1, H.264 High yuv420p, 51.70 s (45–55 s) |
| Black frames ≥ 0.1 s | PASS: none |
| Frozen frames (freezedetect n = 0.003, ≥ 2 s) | PASS: none |
| Loudness / true peak / clipping | PASS: −14.1 LUFS, −1.8 dBTP, flat factor 0 |
| A/V sync | PASS: duration difference 0.000 s |
| Caption layout / within video | PASS: 26 cues ≤ 2 × 26 characters |
| Caption reading speed | **WARN**: 2 cues over 22 characters/s; the first cue **34.8** (caused by the V3 caption hold, §6) and V2's existing 22.6 |
| Caption sync vs acoustic onsets | **WARN**: mean 59 ms, max 287 ms (unchanged V2 measurement limit: the max is a mid-sentence cue) |
| Text overlap / caption band / edges / Shorts UI zones | PASS: 0 FAIL / 0 WARN on 207 samples; smallest essential text 24 px |
| Loop continuity | PASS: last → first 2.95 / 255 (identical to V2) |
| First speech | PASS: 0.11 s |

Records: `channels/failure-reconstructed/premium/challenger-1986/v3/qa/`.

## 4. Creative QA: V2 vs V3 (WARN-only, `creative_qa.py`)

| | V2 | V3 |
|---|---|---|
| Time-weighted empty background | 54% | **43%** |
| Shots with creative warnings / warnings | 15 / 91 | 14 / 60 |
| Mechanism shots registered to archival media | 0 / 5 | **2 / 4** (S02, S09; S05 declared unregistered) |
| Slide-like shots | 6 | **1** (S06, unchanged from V2: numbered step titles) |
| S01 headline competing with captions (samples) | 15 | **0** |

| Shot | Empty | Subject motion | Tiers / labels / words |
|---|---|---|---|
| S02 | 78% → 16% | 0.43 → 1.25 | 1/2/4 → 1/2/5 |
| S03 | 67% → 65%¹ | 0.11 → 0.76 | 1/1/8 → 1/1/11 |
| S05 | 79% → 35% | 0.19 → 0.35 | 4/6/18 → 4/3/20² |
| S08 | 76% → 71%¹ | 0.33 → 0.49 | 4/4/15 → 4/3/10 |
| S09 | 71% → 50% | 0.16 → 0.71 | 4/3/11 → 3/4/19 |
| S12 | 69% → 73%¹ | 0.23 → 0.54 | 5/5/30 → 2/1/8 |
| S13 | 81% → 52% | 0.12 → 0.50 | 3/7/23 → 3/3/15 |

¹ "Empty" counts white document paper and dark sky in real film as bare ground (known limitation).
² Includes the 0.3 s dissolve from S04.

The unchanged shots measure the same as V2.

**Judged on the contact sheets and side-by-sides (my judgement):**
- **Continuity:** archival-to-diagram transitions are now continuous in A (same photo) and C (match on the film's flame point and angle).
- **Narrative clarity:** the failure chain reads in order: joint → cold rubber → gap → flame → tank → the warning overridden.
- **Pacing:** narration and timing are unchanged from V2 (51.7 s).
- **Mobile readability:** improved in A, B, C and D. The owner's review found documentary text still small (§7).

**No audience-performance claim** is made. That needs a live controlled test.

## 5. Historical accuracy assessment

| On screen | Source | Status |
|---|---|---|
| Smoke at the right SRB aft field joint, 0.678 s | Rogers Vol. 1 Ch. III (E1) | verbatim time; ring placed on the photographed smoke |
| Near booster in GPN-2000-001347 = right SRB | geometry (orbiter belly to the tank, nose up) | reasoned, not stated in a caption; low risk; worth a second check by the owner |
| 36°F, "15° colder than any launch before" | E1 (V1 script evidence) | unchanged from V2 |
| Fig. 14 cross-section and its labels | Rogers Vol. 1 Fig. 14 | authentic scan; not mirrored; crop leaves no label sliced |
| 0.6 s joint opening | Rogers Ch. IV Finding 8a ("essentially complete at 600 milliseconds") | real-time on screen |
| 28°F (cold ring) | Finding 6a (estimate, ±5°F) | labelled "est." in the source line |
| 75°F (warm ring) | Ch. IV tests ran 10–75°F | labelled "test" in the source line |
| Ring recovery speeds; gap size | illustrative | labelled "speeds illustrative"; **the gap is exaggerated and not labelled with a factor** (§7) |
| Event times 59.262 / 60.238 / 64.660 / 72.204 / 73.124 | Ch. III event table | verbatim; one label at a time |
| Booster rotation 5°, plume shape, leak glow | illustrative | labelled "Reconstruction"; no explosion drawn |
| Stack proportions (ET 46.9 × 8.4 m, SRB 45.6 × 3.7 m) | published NASA dimensions; booster offset approximate | labelled "proportions approximate" in the Phase 1 version; the V3 source line names only the times |
| Thiokol chart "≥ 53°F at launch" | Rogers Vol. 1 p. 90 | authentic scan |
| Telefax "MTI recommends STS-51L launch proceed", Kilminster | Rogers Vol. 1 p. 97 | authentic scan |
| "Those who made that decision were unaware…" | Rogers Vol. 1 Ch. V p. 82 | verbatim, typeset, cited |
| 8:45 PM / 11:00 PM / 11:45 PM / 11:38 AM (EST) | Ch. V chronology | the Commission marks these as approximate (~); shown without "~" |

**Accuracy to-dos before production:**
1. Label B's gap exaggeration, or draw it to true scale (§ engineering spec). The true gap is 0.017–0.029 in against a 0.280 in ring (Findings 8 and 5c; Ch. IV).
2. Restore "proportions approximate" in C's source line.
3. Mark the chronology times as approximate.

## 6. Caption correction (proposal; in source, not rendered)

**Cause:**
- The first cue, "Less than a second after liftoff," is 33 characters, scheduled 0.06–1.948 s. It must end at 1.948 s, when "Challenger" is spoken.
- V3 hides captions until the headline clears (1.0 s), so the cue was on screen for 0.948 s: **34.8 characters/s**.

**Options measured** (text inspection only; no render, no audio change):

| Option | Headline alone | First cue on screen | Reading speed | Every word captioned |
|---|---|---|---|---|
| V3 as rendered | 0–1.0 s | 1.0–1.948 s | 34.8 | yes |
| **A. Captions from 0.5 s (recommended)** | 0–0.5 s (minimum of the owner's 0.5–1.0 s) | 0.5–1.948 s | **22.8** | **yes** |
| B. Captions from 0.86 s, the first 4 words uncaptioned | 0–0.86 s | "after liftoff," 0.88–1.948 s | 13.1 | **no** ("Less than a second" missing) |
| C. Re-split the cue | — | the parts become shorter, so faster (≥ 36 chars/s) | — | yes |

**Recommendation: option A**, applied in source (`v3/v3-opening.js`: headline hold 0.3 s, captions from 0.5 s).
- The hard text gate still passes.
- The first cue leaves 0.8 over the 22 limit, so it stays a WARN, like V2's 22.6 cue. The threshold is not changed.
- B passes the speed check but drops spoken words from the captions (accessibility and accuracy), so it is not recommended.

## 7. Remaining defects

The owner's review findings come first.

| # | Defect | Where | Plan |
|---|---|---|---|
| 1 | **Flat engineering animation aesthetics** | B, S06, C | `ENGINEERING-VISUAL-SYSTEM.md` |
| 2 | **Archival vs reconstruction inconsistency** (grade, grain, light) | A↔B, C | same spec, §4 (continuity grade) |
| 3 | **Small documentary text on mobile** (24 px source lines, Fig. 14 labels about 29–40 px) | all | spec §5: 30 px floor for source lines, 36 px for labels |
| 4 | **First caption 34.8 characters/s** | S01 | §6, option A (22.8) |
| 5 | S06 still has numbered step titles (slide-like) | S06 (V2 shot) | rebuild with the groove/joint template |
| 6 | B's gap exaggeration is unlabelled | B | true-scale inset or "×N" label |
| 7 | "Approximate" missing from C's proportions and D's times | C, D | source-line text |
| 8 | Caption sync max 287 ms (measurement limit) | S06 | unchanged |
| 9 | Narration voice not approved; owner listening still pending | all | separate production blocker |

## 8. Production readiness

**Not production-ready.** V3 is the evaluation baseline.

**Blockers:**
1. The voice is not approved, and the owner listening checklist (V2 report §4) is not done.
2. The engineering visual system (defects 1–3, 5–6).
3. Every shot is still written as code. A second topic needs the data-driven planner (`AUTOMATION-ARCHITECTURE.md`).
4. There is no audience evidence; a controlled test needs explicit approval.

Technically, the pipeline is ready: all hard checks pass, it is deterministic and reproducible, and it costs $0.
