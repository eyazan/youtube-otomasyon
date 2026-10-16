# Apollo 13: Creative Director V1, a creative-direction experiment (2026-10-16)

**Question:** can the current engine make a compelling documentary Short by *re-sequencing what it already has* (existing templates, verified claims, licensed assets), without another round of engineering-specific animation?

**What was rendered:** two scene-level clips only: lines 2–3 (5.26–15.33 s) and lines 6–7 (28.86–41.78 s). The hook and the outcome are compared as stills.

**Not done:** no full render, no publication, no merge, no workflow, voice, schedule or Cloudflare change, no paid service.

**Thresholds:** unchanged. **Comparison:** V3 is `d299ede6`. Both versions were rendered with the same code, machine and settings. Viewer retention was **not measured**: no viewer data exists, and every score here is a rule-based heuristic.

## 1. Shot-by-shot diagnosis (V3 auto plan)

| Shot | Line, time | What V3 shows | Diagnosis |
|---|---|---|---|
| S01 | L1, 0–5.3 s | Launch photo, headline "Doomed on the pad" | **Weak opening.** The headline is readable for **0.5 s** only. The picture ends at y 1400, so 27% of the frame is flat ink. The camera only reaches zoom 1.06. Curiosity is high (an "already dangerous" premise), but the visual is static. |
| S02–S05 | L2–L5, 5.3–28.9 s | One conceptual diagram | **The main retention risk.** The same mode is held for **23.6 s over 4 lines** (44% of the film). The archival plates inside the scene last only about 3 s. The states are documented but small (round 3, §1). Visual novelty after S02 is 0. |
| S06 | L6, 28.9–36.5 s | Damaged-SM photo, held 7.6 s | **Visual ahead of the narration:** the result of the accident is shown while the narration is still on "the crew switched on the fans". **Times not shown:** the two documented times (55:53:20 and 55:54:53 g.e.t.) carry the "ninety seconds" beat, but neither appears on screen. |
| S07 | L7, 36.5–42.2 s | Finding card over the fire-*test* photo | Strong evidence beat. The backdrop is test imagery: it needs a "not the accident" line, which adds text, and it is open human decision #5. |
| S08 | L8, 42.2–48.1 s | Crew portrait | **Named but not shown:** "the ground control team". An unused, on-topic Mission Control photo is in `assets.json`. |
| S09 | L9, 48.1–53.9 s | Payoff over the launch photo | Good loop. Repeating the launch photo is intentional. |

**Visual modes in V3:** 6 changes in 54 s; longest hold 23.6 s; mean hold 9.0 s.

**Where the story should switch modes:**
- archival → document at L2 (the ground test is where the drawing belongs);
- document → conceptual at L3 ("**But** … rated for twenty-eight volts": the contrast is the mechanism reveal);
- conceptual → evidence at L6 (documented times);
- evidence → consequence on "the tank lost pressure";
- consequence → human outcome at L8.

## 2. Creative Director V1 (`scripts/fr-premium/engine/experimental/creative-director.js`)

**Scope:** experimental and outside production. The planner never calls it, and no workflow runs it.

**How it works.** It reads the planner's plan plus the evidence, assets, timeline and asset-matcher verdicts. It writes:
- `experimental/creative-director.json`: the diagnosis before and after, every decision with its reason, and per-line recommendations (visual mode, archival vs reconstruction, camera, emphasis, duration, transition, caption density, emotional stage, mechanism-reveal times);
- `experimental/shot-plan.cd.json`: the storyboard.

**What it may change.** It only re-sequences existing templates, claims and assets:
- it adds no claim, number, geometry, anchor or asset (tested);
- every number on screen stays a `{claim}` placeholder (tested);
- its plan goes through `validate.js` like any other.

| Rule | Condition, then action |
|---|---|
| R1 mode cap | A mode held for more than 18 s or more than 3 lines: the leading setup line moves onto the scene's own historical drawings. The value the line names lands on the last drawing as a stat; the conceptual model enters on the next line. |
| R2 documented times | A line with 2 or more time claims becomes a timeline whose ticks are those claims. Its ground is a historical **drawing**, never a photo, because a photo under a clock reads as "taken at that time". An image depicting a later claim in the line moves to that claim's spoken word. |
| R3 finding backdrop | A test-imagery backdrop is replaced by a licensed, on-topic historical photo of the event's result, if one exists. Otherwise it stays (tested). |
| R4 named people or places | If the line names what an unused on-topic portrait or setting photo shows, that photo starts at the naming phrase and is flagged CONFIRM_DEPICTION. Objects never trigger this; a test checks that "damaging" does not pull in a damage photo. |
| R5 hook | The headline is held to 1.5 s and captions start after it. The photo goes full-bleed with a caption shade, and the camera pushes to 1.12 on the centre (no aimed move without a VERIFIED point of interest). The payoff mirrors this framing for the loop. A hook with a verified marked anchor keeps the planner's framing. |
| R8 | No shot shorter than 1.5 s. |

**Generalization.** The rules contain no topic code. On Challenger, the storyboard adds no new validation error (tested). The planner's own open S06 needs-asset issue remains.

**Template changes** (small, reusable; the Challenger text gate re-checked as PASS):
- `archival-plate`: the blurred backing plate now accepts still images (before, it rendered only for film clips);
- the stat sub-line has more clearance (the text gate measured a collision with the 220 px value);
- `timeline`: new `hero` layout (the current documented time large and centred, the rail beneath) and a `soft` ground grade (blurred and dimmed).

## 3. Mechanism strategy (Apollo 13)

**Kept conceptual and disclosed** ("Conceptual · not to scale"):
- no dimensions, no component placement, no claim that the diagram is the Apollo 13 tank drawing;
- the electrical relationship (65 V supply vs 28 V rating) and the thermal relationship (80°F opening threshold, the switch could not open, "about 1000°F" marked ESTIMATE) come from claims, as in V3.

**What changed is timing, not geometry:**
- the real NASA drawings now carry the setup line (L2) on their own for 5.7 s, with the 65 V value from its claim;
- the conceptual model enters on "**But**" (L3), where the contrast lives;
- the drawings stay unmarked and unregistered.

## 4. Improved storyboard (12 shots)

| # | Line | Mode | Visual | Transition and reason |
|---|---|---|---|---|
| 1 | L1 | Archival | Launch photo, full-bleed, push to 1.12; headline to 1.5 s | Cut |
| 2 | L2 | Historical document | NASA drawing: SM tank location; date kicker (claim) | Cut: the setup line on the drawing |
| 3 | L2 "heaters" | Historical document | NASA drawing: tank internals; **65 V** stat on "sixty-five" | Cut on the subject word |
| 4–6 | L3–L5 | Conceptual mechanism | V3 component scene from "But": 28 V mark, 80°F threshold, could not open, about 1000°F (ESTIMATE), insulation damaged | Cut into the model; then continuous |
| 7 | L6 | Evidence highlight | **55:53:20 → 55:54:53 g.e.t.** (claims), clock advances on "later", over the blurred NASA drawing | Cut |
| 8 | L6 "the tank lost pressure" | Event consequence | Damaged SM photo | Hard cut on the consequence |
| 9 | L7 | Document | Board's finding typeset verbatim, over the historical after-separation photo (no test imagery) | Dip |
| 10 | L8 | Human outcome | Crew portrait | Dip |
| 11 | L8 "the ground control team" | Human outcome | Mission Control photo (**CONFIRM_DEPICTION**) | Cut on the naming phrase |
| 12 | L9 | Payoff | Launch photo, hook framing (loop) | Loop |

**Rhythm:** 10 visual changes (V3: 6); longest hold 17.9 s (V3: 23.6 s); mean hold 5.4 s (V3: 9.0 s); 8 distinct modes (V3: 6).

## 5. Before and after (existing QA metrics, same windows)

| Window | Metric (limit) | V3 | CD |
|---|---|---|---|
| A: L2–L3 | Empty background, time-weighted (≤ 35%) | 56.1% | **36.4%** |
| | Non-caption words / text tiers on the L2 shots (≤ 8 / ≤ 3) | 14 / 4 | within limits |
| | States the QA detects | 0/3 | 1/4 |
| | WARN count | 15 | 16 |
| | New WARN | — | subject motion on the drawings: 0.21 and 0.07 (static documents) |
| B: L6–L7 | Empty background, time-weighted (≤ 35%) | 54.1% | **39.9%** |
| | Timeline shot, empty | — | 0.3% |
| | Finding card, empty | 46% | **74%, now slide-like** (worse) |
| | States the QA detects | 2/3 | 2/5 |
| | WARN count | 10 | 15 |
| | Timeline WARNs | — | subject motion 0.03; headline competes with caption (the clock) |
| Full plan | Text gate | PASS 0/0 | **PASS 0/0** |
| Full plan | Validator | VALID | **VALID** |
| | Render time (fast capture, M1) | — | 302 frames 34 s, 388 frames 42 s, incl. browser start (≈ 0.1 s/frame, same as V3) |

**Reading the table:**
- **Better:** empty background in both windows (−20 and −14 points); hold length; mode diversity; narration-to-visual alignment (times shown; the consequence lands on its word; "ground control" is shown); the hook headline is readable; no test imagery.
- **Worse:**
  - the finding card over the real after-separation photo. That photo is mostly black space, so the dimmed backdrop leaves the card on near-black: 74% empty, slide-like. This is the price of dropping the test photo;
  - document beats (drawings, clock) have little subject motion, which raises the WARN count.
- **Not fixed:** creative QA still WARNs on every shot; the mechanism scene keeps its round-3 limits.

**Files** (draft release):
- `apollo13-cd-vs-v3-contact.png`: 1 frame per second; rows V3 A, CD A, V3 B, CD B;
- `apollo13-cd-vs-v3-hook-outcome.png`;
- `apollo13-cd-vs-v3-a.mp4` and `apollo13-cd-vs-v3-b.mp4`: side by side;
- `apollo13-cd-proto-a.mp4` and `apollo13-cd-proto-b.mp4`.

## 6. Comparison summary

| | V3 | Creative Director storyboard |
|---|---|---|
| Historical accuracy | All claims cited; test photo with disclosure | All claims cited; **no test imagery**; times shown from claims; Mission Control photo needs depiction confirmation |
| Visual clarity | One long diagram | The drawings show the real tank before the model; one large number per beat |
| Narrative comprehension | Mechanism explained; "ninety seconds" told only | Setup → contrast → mechanism → clock → consequence → finding → people |
| Shot diversity | 6 changes, longest hold 23.6 s | 10 changes, longest hold 17.9 s |
| Mobile readability | Text gate PASS; 14 words on L2 | Text gate PASS; large stat and clock; captions on grey plates need a human check |
| Retention structure (heuristic) | Slow middle, static opening | Faster mode changes; the reveal on "But"; payoff loop kept |
| Production complexity | Planner only | Planner + one deterministic pass (≈ 210 lines); no new animation |
| Human intervention | As round 3 | As round 3, **minus** the test-photo decision, **plus** confirming the Mission Control depiction |

## 7. Estimated human effort per new topic (estimate, not measured)

| Task | Effort |
|---|---|
| Storyboard review of `creative-director.json` | 10–15 min |
| Depiction confirmations (CONFIRM_DEPICTION shots and plates) | 5 min each |
| Script approval and recorded narration | Unchanged (timings are still estimated) |
| Creative sign-off of a full render | 15–20 min |
| Measured-mode anchors | Not needed: the storyboard does not depend on them |

## 8. Remaining creative risks

1. **The finding backdrop:** with real photos it is either dark (space photos) or a disclosed test photo. A human choice remains: keep the historical photo and accept the darker card, or use a backdrop treatment that brightens it, which the template does not offer today.
2. **Static document beats:** the drawings and the clock are deliberately still, and creative QA flags them. This is by design, not a threshold to relax.
3. **The mechanism scene** still has the round-3 limits (small states, about 60% empty).
4. **Estimated timings:** every cut lands on an estimated word time. Real narration will move them, and the rules re-run deterministically.
5. **Mission Control depiction:** it rests on Commons metadata (it shows the Apollo 13 MOCR during the fourth TV transmission). The cut does not claim the photo shows the rescue.
6. Captions over light grey drawing plates: contrast should be checked on a phone.

## 9. Recommendation: **SIMPLIFY VISUAL STRATEGY**

**Reasons:**
- re-sequencing existing material removed every diagnosed structural risk (hold, static hook, times not shown, people not shown, test imagery), with no new animation code and no unverified geometry;
- it cut empty background by 14–20 points in both windows;
- the remaining failures are local and known (the dark finding card; still documents).

**Proposed direction:**
- keep the current engine as the renderer and the evidence gates;
- keep the conceptual mechanism to one contrast-led section of at most about 18 s;
- carry the rest of the story on real documents, documented times and archival people;
- stop investing in engineering-specific animation for topics without verified geometry.

**Not a production change.** Adopting the Creative Director pass into the planner is a human decision. A full render and its creative sign-off come first.
