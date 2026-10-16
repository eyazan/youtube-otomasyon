# Apollo 13 premium pilot: final round and close (2026-10-16)

**Outcome: HOLD.** The final storyboard is ready and passes every automatic gate that can run without a render. The complete pilot was **not rendered**, because required owner approvals and the recorded narration are missing (§2). Nothing new was built.

**Not done:** no new prototypes, no publication, no merge, no workflow, voice, schedule or Cloudflare change, no paid API.

## 1. Final storyboard (`plan/final/shot-plan.final.json`)

**Source:** the Creative Director V1 storyboard (`experimental/shot-plan.cd.json`, `b5332639`) with **one recorded edit**. The board's finding (S09) is now a plain typeset document card: the verbatim passage, its citation and the "typeset, not a scan" disclosure, with **no backdrop**.
- **Why:** the historical after-separation photo left the card on near-black (74% empty, slide-like, `CREATIVE-DIRECTOR-V1.md` §5).
- **Effect:** the test photo is not used anywhere, so the open "test-imagery backdrop" decision is gone.

| # | Time (estimated) | Narration | Visual (source) |
|---|---|---|---|
| S01 | 0.0–5.3 | "Apollo Thirteen's oxygen tank was already dangerous on the launch pad." | NASA launch photo S70-34852, full frame, slow push; headline "Doomed on the pad" readable to 1.5 s |
| S02 | 5.3–7.0 | "During ground tests, its…" | NASA drawing: SM and oxygen tank location (NSSDC); kicker "March 27, 1970" (claim) |
| S03 | 7.0–10.9 | "…heaters were powered from a sixty-five volt supply." | NASA drawing: SM oxygen tank (SP-4009); **65 V** · GSE POWER SUPPLY on "sixty-five" (claim) |
| S04–S06 | 10.9–28.9 | "But … rated for twenty-eight volts. … could not. … about a thousand degrees, damaging the insulation …" | Conceptual diagram, chipped "Conceptual · not to scale": 28 V rating; 80°F threshold; switch could not open; about 1000°F (**ESTIMATE**); insulation damaged. All values from claims. No dimensions, no placement. |
| S07 | 28.9–34.5 | "In flight, the crew switched on the tank's fans, and about ninety seconds later…" | Timeline **55:53:20 → 55:54:53 g.e.t.** (claims), over the blurred NASA drawing |
| S08 | 34.5–36.5 | "…the tank lost pressure." | NASA photo AS13-59-8500, the damaged SM after separation |
| S09 | 36.5–42.2 | "The board found an electrically initiated fire inside oxygen tank number two." | Review Board finding, typeset verbatim, highlight sweep, citation |
| S10 | 42.2–45.9 | "It was a near disaster, averted only by the crew and…" | NASA crew portrait (Lovell, Swigert, Haise) |
| S11 | 45.9–48.1 | "…the ground control team." | NASA photo, Mission Control (MOCR), 13 April 1970 |
| S12 | 48.1–53.9 | "The flight was saved in space. The tank was lost on the ground." | Launch photo, hook framing (loop) |

**Storyboard sheet:** `apollo13-final-storyboard.png` (one still per shot) on the draft release.

### Factual and licensing issues resolved in this round

| Item | Finding |
|---|---|
| Fire-test backdrop | **Removed** (S09 is a plain card). The test photo is no longer used. |
| Mission Control photo | NASA's own description, via Commons from the NASA Image and Video Library: the Apollo 13 MOCR, **13 April 1970**, Flight Director Eugene F. Kranz in view. The shot claims only "Mission Control", which the source supports. It does not claim the photo shows the rescue. |
| Tank drawing (`4-339a.gif`) | From NASA SP-4009, *The Apollo Spacecraft: A Chronology* (NASA History Office), captioned "Apollo 13's service module oxygen tank". Shown unmarked as "NASA drawing". |
| SM cutaway (`Apollo13_tank.jpg`) | From NASA NSSDC (D. R. Williams), "location of the oxygen tanks". Shown unmarked as "NASA drawing". |
| Licences | All 7 images used are NASA works, public domain (Commons metadata; NASA does not claim copyright). AS13-59-8500 is a scan of a NASA photo (scan by K. Teague). The sha256 of every file matches `assets.json`. |
| Geometry and claims | No dimensions, anchors or claims were added. 15 claims are used, each with a verbatim passage. "About 1000°F" is shown as an estimate. |

## 2. Approval package: blocking decisions only

| # | Decision | Status in the repo | Why it blocks the render |
|---|---|---|---|
| **B1** | **Remake approval.** Apollo 13 is already published on the channel ("28 Volts vs 65: Apollo 13's Hidden Flaw", youtu.be/uqoAjXMbbls). | No approval recorded (`APOLLO-13-PILOT.md` §6.1) | A remake needs the owner's explicit decision. |
| **B2** | **Script approval** of the 9 lines (§1) | `narration-script.json` → `"status": "draft"`; flag SCRIPT_NOT_APPROVED | The complete pilot must render the approved words. |
| **B3** | **Narration source.** The channel voice is Edge TTS (`en-US-AndrewMultilingualNeural`), refused on runners since 2026-10-12 and intermittently at home. The Kokoro fallback (`am_michael`) is used only with the owner's `approved: true`. | Kokoro FR voice not approved; no narration recorded | Without narration the timings stay **estimated**. Every cut and state lands on a synthetic word time, so sync cannot be checked. Changing the voice is out of scope. |
| **B4** | **Storyboard approval** of §1, including the S09 card edit and the S11 Mission Control shot | Not approved | The planner rules call for it before a render. |

**Not blocking:**
- the measured-mode anchors (the storyboard is conceptual by design);
- the anchor review sheets;
- the launch-photo point of interest (the hook uses a centred push, not an aimed one).

## 3. Final production: not run

**B1–B4 are open, so no complete pilot was rendered.** No further prototypes were made.

**When B1–B4 are cleared, the render is one deterministic sequence:**
1. Record narration with the approved voice.
2. Measure the word timeline.
3. Re-run the planner, then `creative-director.js`, then re-apply the S09 card edit.
4. Validate, then run the text gate.
5. Render once with `render-vertical.js`, then mix.
6. Run the technical QA (`qa-vertical.js`) and creative QA on the full MP4.

## 4. Final quality review (everything that can run without the complete render)

| Area | Result | Evidence |
|---|---|---|
| Opening hook | **Improved, not proven.** The headline is readable to 1.5 s; full-frame launch photo; push 1.12. No verified point of interest, so the move is centred. | Stills; `creative-director.json` |
| Story clarity | Clear chain: setup on the real drawings → "But" contrast → mechanism → documented clock → consequence → finding → people → loop | Storyboard §1 |
| Visual continuity | 10 visual changes; longest hold 17.9 s (V3: 23.6 s). The scene-continuous camera from round 3 is kept (boundary correlation ≥ 0.995). | CD report; round 3 |
| Mobile readability | **Text gate PASS, 0 FAIL / 0 WARN** on the final plan (216 samples). Smallest essential text 28 px (the chip, as in all versions). Captions over the grey drawing plates still need a check on a real phone. | `qa/text-qa-final-plan.json` |
| Historical accuracy | Every number on screen is a claim; the estimate is badged; the conceptual diagram is disclosed; no test imagery; depictions sourced (§1) | Validator VALID; tests |
| Narration sync | **Cannot be verified: the timeline is estimated.** B3. | — |
| Creative QA | **Still WARN** in every measured window (same thresholds): empty background 36–40% vs the 35% limit; low subject motion on document beats; small mechanism states. The S09 plain card is expected to read as a document card; its emptiness metric is not measured because there is no render. | `qa/creative-qa-cd-round-*.json` |
| Technical QA | Final plan VALID (0 warnings); JS 714/714 and Python tests pass. `qa-vertical.js` needs the complete MP4, which is blocked. | — |

## 5. Close

**Production time (actual, this round):** about 1 hour of wall-clock work. Compute for the plan steps:

| Step | Time |
|---|---|
| Planner | 0.10 s |
| Creative Director | 0.07 s |
| Validation | < 1 s |
| 13 storyboard stills + full-plan text inspection | 12 s |

**Estimated time for one complete render** (not measured; based on measured rates of about 0.1 s/frame for the V3 fast capture on an M1):
- about 1,620 frames → **about 3 min**;
- plus narration and mix, a few minutes.

**Estimated production cost:**
- **$0 in paid services:** public-domain NASA assets, local rendering, free TTS (Edge or Kokoro, once approved);
- the human time is the real cost, about 45–75 min of owner time: B1 and B2 about 15 min; listening and approving a voice about 10 min; storyboard approval about 15 min; final creative sign-off of the render about 15–20 min.

## Recommendation: **HOLD**

**The storyboard is the strongest the engine can produce honestly:**
- every gate that can run passes;
- the historical and licensing issues are resolved;
- no geometry was invented.

**Why it cannot be READY:**
- the owner decisions B1–B4 (remake, script, narration voice, storyboard) are missing;
- creative QA still WARNs under unchanged thresholds.

**Why not REJECT:** nothing found blocks the topic on accuracy or licensing.

**Development is closed.** The next step belongs to the owner, not to more engineering.
