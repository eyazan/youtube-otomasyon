# Apollo 13 premium pilot: evaluation render (2026-10-16)

**Status: evaluation pilot, not approved for publishing.**
- **Delivered:** one complete offline render.
- **Gates:** every factual and technical gate passes.
- **Creative QA:** WARNs on all 12 shots under unchanged thresholds (§3).

**Not done:** no upload, publication, merge, workflow, schedule, Cloudflare or channel-voice-approval change; no paid API; no new template, effect or renderer change.

## 1. Inputs approved by the owner (in chat, 2026-10-16)

**Script:** the nine draft lines with three owner corrections, L1, L4 and L9. `narration-script.json` has `status: approved`, with `approvedBy` noting "evaluation pilot only".

**Voice:** Kokoro `am_michael`, approved for this pilot only. The channel's `config.voice` and its fallback `approved` flag are untouched. The narration timeline records `"approved": false`.

**Storyboard:** the 12-shot Creative Director storyboard, with the S09 finding as a plain document card (`APOLLO-13-FINAL.md`).

| Line | Narration (final) | Source: Report of Apollo 13 Review Board (NASA; NSSDC text) |
|---|---|---|
| L1 | One of Apollo Thirteen's oxygen tanks was already in a hazardous condition on the launch pad. | "…including pad occupancy, the oxygen tank no. 2 was in a hazardous condition…" |
| L2 | During ground tests, its heaters were powered from a sixty-five volt supply. | "The heaters were energized with the 65 V dc. GSE power supply" (detanking, March 27, 1970) |
| L3 | But its thermostatic switches were rated for twenty-eight volts. | "…rated as satisfactory for the 28 V dc spacecraft power supply…" |
| L4 | They were meant to open at eighty degrees Fahrenheit, and at sixty-five volts they could not. | "…intended to open the heater circuit when it senses a temperature of 80 F"; "…could not open properly at 65 V dc." |
| L5 | The heater tube may have reached a thousand degrees, damaging the insulation on the fan wires. | "…probably permitted … to reach about 1000 F in spots…"; "…severely damage the Teflon insulation on the fan motor wires…" |
| L6 | In flight, the crew switched on the tank's fans, and about ninety seconds later the tank lost pressure. | Fan current at 55:53:20; "About 1-1/2 minutes later, at 55:54:53.555…"; "…lost pressure in this time period" |
| L7 | The board found an electrically initiated fire inside oxygen tank number two. | "All indications are that an electrically initiated fire in oxygen tank no. 2…" |
| L8 | It was a near disaster, averted only by the crew and the ground control team. | "…a near disaster, averted only by outstanding performance on the part of the crew and the ground control team…" |
| L9 | The danger began on the ground. The mission was saved in space. | Editorial summary (claim `C-a13-payoff`, kind editorial; its text updated to the new wording) |

## 2. Production run (Apple M1, local, actual times)

| Step | Tool | Wall time |
|---|---|---|
| Narration + measured word timings (54.8 s, 126 words) | `narrate_kokoro.py --voice am_michael` | 35 s |
| Planner + asset matcher + Creative Director + S09 card edit | existing engine | 0.45 s |
| Validation (auto and final plans) | `validate.js` | < 1 s each |
| Render, 1,668 frames, 1080×1920 at 30 fps (screenshot 139 s of 151 s) | `render-vertical.js`, fast capture | **154 s** |
| Mix and mux (narration levelled; silent effects stem, so no new audio effect) | `mix-audio.js` | 4 s |
| Technical, text and creative QA, word sync | existing QA tools | ≈ 3 min |
| **Total machine time** | | **≈ 7 min** |

**Cost:** $0. Everything ran locally: public-domain NASA assets, Kokoro under Apache-2.0, no paid API.

**Automation metrics:**
- the planner put 9 base shots on the measured timeline, 8 of them clean;
- its only open flag is the L1 hook MISSING_ANCHOR: a centred push is used and no aimed point is claimed;
- the planner generated 54 values; 0 values were entered by hand;
- the Creative Director made 8 rule decisions, giving 12 shots;
- one recorded manual edit: the S09 backdrop removal.

The SCRIPT_NOT_APPROVED and ESTIMATED_TIMELINE flags are cleared.

## 3. QA report (thresholds unchanged)

| Gate | Result |
|---|---|
| Evidence and validation | **VALID, 0 errors, 0 warnings** (15 claims, 6 NASA public-domain images, sha256-checked) |
| Technical QA (`qa-vertical.js`) | **PASS, all hard checks.** 1080×1920, 30 fps, h264, 0 decode errors, no black frames or freezes, −14.3 LUFS, −1.3 dBTP, A/V match 0.000 s, first word at 0.38 s |
| Text gate (`text-qa.js`, 223 samples) | **PASS, 0 FAIL / 0 WARN** (smallest essential text 28 px, the chip) |
| Narration sync (word level) | 18 acoustic onsets after pauses vs the timeline's word starts: **mean 50 ms, max 170 ms, 17/18 ≤ 150 ms** (`qa/pilot-eval-word-sync.json`) |
| Creative QA (`creative_qa.py`, full film) | **WARN on 12/12 shots, 54 warnings**; time-weighted empty background 39% (limit 35%); 2 slide-like shots; mechanism registered 0/3 |

**Unresolved warnings, all reported:**

1. **Duration 55.6 s**, against a 45–55 s target. The measured narration is 54.8 s; the corrected L1 and L4 are longer.
2. **Caption reading speed:** one cue reaches 27.2 characters per second (limit 22).
3. **Caption sync vs acoustic onsets: max 571 ms** (mean 85 ms, 14 cues).
   - The worst cue is "for twenty-eight volts."
   - That cue starts mid-phrase, and the check pairs it with the nearest pause onset, which belongs to the word "were" 0.57 s earlier.
   - At the word level, the timings match the audio (row above), so this reads as a matching artefact. It is still a WARN under the existing threshold.
4. **Loop continuity:** the last-to-first-frame ratio is 8.13, triggering the ratio rule. The payoff ends dimmed with its text on screen, while frame 0 shows the headline.
5. **Creative QA, by shot:**

| Shot | Remaining warnings |
|---|---|
| S04–S06 (conceptual mechanism) | Empty 61–63%; 4–6 text tiers and labels; 13–15 words; not registered to archival media; S05 slide-like; small state salience |
| S02, S03, S07 (documents, clock) | Low subject motion (0.03–0.22) |
| S09 (plain finding card, as decided) | Empty 76%; slide-like; the full passage is counted as on-screen words |
| S08, S10, S11 (archival insets) | Inset over void 31–59% |
| S12 (payoff) | The narration's own lines on screen count as 12 non-caption words |
| S01, S02, S04–S06, S08, S11 | Smallest label 28–30 px, below the 32 px creative target. The text gate's own minimum is met. |

**Phone readability:** checked on `apollo13-premium-pilot-eval-mobile-540p.mp4` and the contact sheet. Captions, the 65 V stat, the clock and the finding card are legible. The chip and mechanism labels are the smallest text.

## 4. Deliverables (private draft release `pilot-challenger-premium-v1-2026-10-12`)

All checksums were verified after download.
- `apollo13-premium-pilot-eval.mp4`: final evaluation MP4, 55.6 s, 1080×1920, narration-only mix;
- `apollo13-premium-pilot-eval-mobile-540p.mp4`: mobile preview;
- `apollo13-premium-pilot-eval-contact.png`: one frame every 2 s;
- `apollo13-narration-am_michael.wav` and `apollo13-narration-am_michael.m4a`: the narration;
- `SHA256SUMS-apollo-pilot-eval.txt`.

**In the repo:**
- `plan/timeline-kokoro-am_michael.json`;
- `plan/final/shot-plan.final.json`;
- `plan/qa/pilot-eval-*`.

## 5. Remaining human approvals

1. **Creative sign-off of this evaluation MP4**, in particular the warnings in §3.
2. **Voice for publishing.** `am_michael` is approved for this pilot only. Publishing with Kokoro needs the channel's fallback approval; the channel voice is otherwise Edge TTS.
3. **Publishing decision** for the remake, if one is ever wanted. Nothing is scheduled.
4. **Optional:** a sound bed. The existing `sound_design.py` is Challenger-specific, so this pilot has narration only.

## 6. Verdict: **EVALUATION PILOT DELIVERED, NOT PRODUCTION-READY**

**What holds:**
- the factual, evidence, licensing, technical and text gates all pass;
- the narration matches the word timings.

**What does not:**
- creative QA warns on every shot under unchanged thresholds;
- the duration and two caption checks warn.

**Status:** per the brief, this is not called production-ready. Apollo 13 development is **frozen**: no V4 or V5, no further iteration without explicit approval.
