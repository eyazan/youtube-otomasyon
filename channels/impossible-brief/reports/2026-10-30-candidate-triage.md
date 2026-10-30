# ImpossibleBrief: triage of the 17 visual-survey candidates (2026-10-30)

The 17 topics at viral ≥ 75 in the visual survey (dry run, runner-local, **not written to main**), checked against the
rules on this branch:
- claim-source ledger: `channels/impossible-brief/research/claim-sources/<id>.json`;
- visual mechanism: `topic.visualMechanism` in `scripts/bto-studio/auto/impossible-brief.js` MECHANISMS;
- readiness: `scripts/bto-studio/adapter.js`.

A survey score is never a production approval. Only group 1 counts as publishable premium stock.

Column notes:
- **ledger**: facts VERIFIED / facts.
- **HUMAN**: narration lines without a number. A person must check each one; the ledger cannot verify them.
- **inferred**: the drawing a word match would choose. It is shown only for comparison; it is never used.

## Group 1 — source, mechanism and real MP4 verified: **0**

No topic has all of these:
- a VERIFIED ledger;
- a declared and supported mechanism;
- a technical QA PASS on a real MP4;
- a Creative Director PASS;
- reviewed HUMAN lines.

IB-EAR-001 and IB-EAR-019 come closest. See the review render below.

## Group 2 — fixable gaps

| topic | ledger | HUMAN | declared | inferred | gap to close |
|---|---|---|---|---|---|
| IB-EAR-001 Earth stops spinning | 4/4 | 3/7 | planet-rotation | orbit (wrong) | creative review of the new render; HUMAN lines |
| IB-EAR-019 one day without the magnetic field | 5/5 | 5/8 | magnetic-field | magnetic | no fact supports "Satellites and power grids would take more charged particles" (L6) or the claim that the air would not vanish in a day (L7); L3 says "flipped 183 times", but the source says "at least 183"; creative review |
| IB-EAR-066 Lake Baikal drained | 5/5 | 3/8 | — | lake | declare `lake-water`; render; review |
| IB-EAR-071 Atlantic current shuts down | 5/5 | 3/7 | — | current | declare `ocean-current`; render; review |
| IB-OTH-006 whale fall | 4/4 | 4/7 | — | ocean-depth | declare `ocean-depth`; check a whale carcass is drawable (today only a depth slice) |
| IB-HUM-024 never stopped growing | 4/4 | 4/8 | — | body | declare `human-body`; render; review |
| IB-EXT-046 a year of 18 hours | 4/4 | 3/8 | — | orbit | declare `planet-orbit` (an orbital period, so an orbit is correct here); render; review |
| IB-SPA-031 Earth like Venus | 4/4 | 4/8 | — | orbit | declare `named-body` (Venus drawn as Venus); render; review |
| IB-EAR-059 Dust Bowl returns | 4/4 | 3/7 | — | sky | `atmosphere` draws only a sky arc; a dust-storm drawing is missing; may move to group 3 |
| IB-HUM-020 jump from the edge of space | none | — | — | sky | needs a ledger, a mechanism (`human-body` + atmosphere) and a review |

A mechanism is declared only after a person agrees the drawing matches the research. This branch declares it only
for the two priority topics (EAR-001, EAR-019).

## Group 3 — blocked on scientific or visual accuracy

| topic | why |
|---|---|
| IB-EXT-036 tardigrades in open space (PR #384 only) | `organism-microscope` is not supported: there is no microscopic-animal drawing. Readiness: `CREATIVE_REVIEW_REQUIRED`. Without a declaration, word matching picks **orbit**. There is no ledger, and it is not on main. |
| IB-PHY-080 melting a diamond | Word matching picks **micro** (microbes) for a crystal melting. No drawing exists for a phase change. |
| IB-EAR-054 tornado for three hours | No vortex drawing exists; the atmosphere arc does not show the mechanism. |
| IB-OTH-004 all the ants disappear | The organism has no drawing; earth-surface shows only a globe. |
| IB-OTH-020 synthetic fertiliser disappears | No drawing for the nitrogen cycle (inferred: cosmos). No ledger. |
| IB-EAR-086 sideways eruption | Held by the owner. A surface eruption would be drawn as an interior cutaway. |
| IB-EAR-096 Laki poisons a country | Held by the owner. Same drawing problem. |
| IB-HUM-050 microbes disappear | Held by the owner. No ledger. |
| IB-PHY-007 (ledger request, not in the 17) | Ledger F3 is UNVERIFIED: the fine-structure constant numbers are not in one passage. |

## Selectable count

- Today, under the rules on this branch: **0** in group 1.
- Up to 2 more (EAR-001, EAR-019) if the new render passes both reviews and a person clears the HUMAN lines.
- Main still has 0 qualified topics, because no survey file is committed. Nothing is released automatically.
