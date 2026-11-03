# Four-channel premium production: session 2 (2026-11-03)

Builds on `four-channel-production-2026-11-03.md` (PR #409, merged into this branch, not into main). This session
judged every channel on **real CI renders with the approved Edge voices**, reviewed the actual frames, fixed what the
frames showed, re-rendered, and measured live YouTube data. Nothing was merged, published, uploaded or approved.

## 1. What the real frames showed, and what changed

| Channel | Defect seen in the frames (CI runs 41688512604 / 41690935641 / 41690253051 / 41688507762) | Fix (this branch) |
|---|---|---|
| Failure Reconstructed (El Faro) | One wireframe ship four times and three chain cards. No storm, route, flooding, list or sinking. | **Forensic maritime kit** (`page/components/maritime.js`), applied per line from the line's own words to all 43 ship cases:<br>- hook: a sea breaks over the ship;<br>- toll: the hull under the surface;<br>- route vs storm track on a chart;<br>- stale forecast ghosted behind the real storm;<br>- hull cross-section flooding through the opening, with an inclinometer showing the list;<br>- oil-pressure needle falls and the propeller spins down;<br>- broadside and overwhelmed;<br>- payoff: the route redrawn around the storm. |
| The Hidden Logic of Things (BTO-156) | Blank paper cards and quote slides. The mesh-vs-wavelength mechanism was never drawn. | **Aperture-vs-wavelength mechanism** (`page/components/waves.js`):<br>- a loupe opens on the door mesh;<br>- body and mesh glow as one shield;<br>- the magnetron launches waves that reflect inside the cage (continuous shot);<br>- hole vs a braced 12.2 cm wavelength (cited);<br>- "CANNOT PASS";<br>- visible light threads a hole;<br>- the viewer sees in while the energy stays in.<br>Duration was 27.3 s < 30 s minimum. Fixed by adding one verified line (fact P1, magnetron) instead of lowering the bar. |
| GoalLore Lab (GLL-021) | "Past five England players" was not countable. Hook ≈ payoff (0.936). | A five-token **tally** struck off as each defender is passed (`tally.js`). The payoff replays from the higher camera. |
| ImpossibleBrief (EAR-019) | "Satellites and power grids" showed neither. The payoff redrew the full field under "technology would feel it first". | **tech-hits**: satellites on orbit and pylons on the limb, struck by the particles. The technology payoff keeps the field off. |
| ImpossibleBrief (EAR-001) | Good. Re-rendered byte-identical (sha256 `7a792484…`): the render is deterministic. | — |

Regression tests: `tests/js/premium-mechanisms.test.js` (7). Full suite: 1044 + 7 pass.

## 2. Real MP4s (CI, final 1080×1920, approved Edge voice except GLL's candidate)

See the final run's table in the PR description (run 41700131525; MP4s in its `premium-review-render` artifact, frames
on `review/render-41700131525`).

## 3. ImpossibleBrief starvation: root cause and fix

- **Cause:**
  - IB is premium-only (`premiumOnlyUploads: true`), and every IB research record needs a person-declared visual
    mechanism (PR #387).
  - 0 records had one. The funnel called 90 topics "one decision away", but the word-classifier proposals were often
    wrong (Tambora → orbit; GPS → microbes).
  - The live audit confirms the effect: the last IB upload was 2026-10-29 (6 views), and nothing since.
- **Fix:**
  - `scripts/ib-research/mechanism-board.js` proposes only what the drawing literally shows (47 STRONG, 43 NO_DRAWING).
  - It renders real stills of each proposal (`studio.js --propose-mechanism`: preview, shadow, stills only; records unchanged).
  - It prints the exact declare command for the reviewer.
- **The board exposed drawing defects, fixed this session:**
  - a new **volcano-eruption** mechanism: 7 topics had been drawn as a globe with numbers;
  - Ceres drawn as a gas giant;
  - Neptune not blue;
  - Great Red Spot missing.
- **Result:**
  - About 18 topics look viable on their frames (non-binding pre-screen in `reports/ib-mechanism-board/README.md`).
  - That's roughly 18 days at one Short per day, after a person declares them.
  - The NO_DRAWING half needs new components (tornado, skydiver, debris around Earth, supergiant, comet impact), not
    declarations.
  - Quality bars are unchanged.

## 4. Live YouTube data

`docs/premium-studio/youtube-performance-audit-2026-11-03.md`.

- **Openings:** median rel@10% is 0.42 (IB) and 0.41 (FR), so our openings lose viewers faster than comparable Shorts.
  The mid-video holds.
- **BTO:** unmeasurable (OAuth `INVALID_CLIENT`; Analytics API disabled in its GCP project).
- **Channel copy to fix in Studio:**
  - FR's description promises "real archival footage";
  - GLL's description ends with the old name "PitchLore".
- **Missing everywhere:** channel language and keywords.

## 5. What remains before each channel publishes (owner actions; none can be done by code)

| Channel | Remaining |
|---|---|
| ImpossibleBrief | Creative Director verdict + HUMAN-line review for EAR-001/EAR-019 (`research/reviews/<id>.json`); mechanism declarations from the board; merge |
| Failure Reconstructed | Creative review of El Faro; per-case review is still needed for verbatim-quote-less case files (FR live standard); signed publication policy; `FR_PREMIUM_PUBLISH`/`PRIMARY` |
| Hidden Logic | Fix OAuth client + enable Analytics API; channel `enabled:true`; signed policy; `BTO_PUBLISH`; creative review of BTO-156; more VERIFIED research (`bto-research.yml`) |
| GoalLore Lab | Voice approval (Ryan is a candidate); research review (`docs/review/goal-lore-lab-approval.md`); `enabled:true`, `GLL_ACTIVE`, `GLL_PUBLISH` |
