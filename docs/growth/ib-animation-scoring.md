# ImpossibleBrief: animation potential instead of archival footage (analysis, not in production)

Status: **analysis only**. IB production scoring is unchanged (`channels/impossible-brief/growth-engine.json` has no
`visuals.source`); the signal lives in `core/growth/animation-potential.js` (`forImpossibleBrief`) and is used only by
`scripts/growth/ib-animation-analysis.js`. The 2026-10-29 first publication (IB-PHY-065) is untouched.

## Problem
42 researched IB topics sit at viral 70–74. Their `archival_footage_potential` (35) and `weak_footage_risk` come from
the count of licensed photos/clips in the inventory, but the premium engine draws every IB Short from code.

## Signal (what the automatic storyboard really draws)
Each topic's storyboard is built by the real generator (`scripts/bto-studio/auto/impossible-brief.js`) and scored on
what it shows:

| World the generator draws | Base | Evidence |
|---|---|---|
| earth-interior (cutaway, depth probe, heat slice) | 70 | IB-PHY-065 review renders, PASS |
| magnetic (dipole field that weakens, solar wind) | 70 | dedicated component |
| current (warm/cold streams that slow) | 0 | IB-EAR-071 render: contradicting headline, one globe in every scene |
| lake (depth slice, strata) | 0 | IB-EAR-066 render: 3 °C water drawn red-hot, the lake never shown |
| ocean-depth (depth probe below sea level) | 66 | provisional: no render yet |
| micro (population that thins) | 0 | IB-HUM-050 render: restoring microbes drawn as a thinning population |
| named body (Venus, Mars, Moon, gas giant) | 62 | planet kinds |
| bare orbit diagram | 40 | |
| generic globe (earth-surface, sky) | 48 | shows the planet, not the mechanism |
| generic ringed planet (cosmos), human silhouette (body) | 0 | IB-HUM-004 review: FAIL |

- +4 per distinct drawn mechanism (cutaway, zoom, flow, heat, count, year, ladder, field change), up to +16.
- −10 when more than half the scenes are only the bare subject.
- Capped at 88.
- **Score 0, never a lift**, when the drawing would be wrong:
  - the world is inferred from body text, not the title's subject;
  - an Earth drawing for another body (Io);
  - a spin drawn as an orbit (IB-EXT-047);
  - a surface eruption (lateral blast, gas, ash) drawn as a cutaway: Mount St. Helens IB-EAR-086, Laki IB-EAR-096.
- Scoring rule as for FR: `archival_footage_potential` and `first_frame_potential` take the larger of archival and
  animation; `weak_footage_risk` takes the smaller. Hook, story, stakes, recognizability and all other components are
  unchanged. Threshold 75 and weights are unchanged.
- Regression tests: `tests/js/ib-animation-potential.test.js`.

## Old vs new (136 researched topics)
- 0 lowered.
- Viral ≥75: 7 → 9 with the render-validated world list (it was 12 before the review renders). See the render section below.
- Selectable, unheld and correctly drawn at ≥75: IB-PHY-065 (published 2026-10-29) and IB-EAR-019.
- Held topics keep their holds: IB-EXT-050, IB-HUM-025, IB-EXT-047, IB-HUM-004.

## The 42 topics in the 70–74 band
Claim check: `ib-claim-check` run 40824701698 (main, 14 topics).

| # | Topic | Old | New | Δ | Animation | Engine drawing | Facts / sources | Claim check | Assessment |
|---|---|---|---|---|---|---|---|---|---|
| 1 | IB-EAR-019 — Could Earth survive one day without Earth's magnetic field? | 73 | 76 | +3 | 82 | magnetic | 5 / 2 | PASS | render: correct; ≥75, selectable |
| 2 | IB-HUM-010 — What If You Stood at the Bottom of the Mariana Trench? | 73 | 75 | +2 | 70 | ocean-depth | 5 / 1 | PASS | ≥75 but bucket B: not selectable |
| 3 | IB-OTH-020 — What If Synthetic Fertilizer Disappeared? | 74 | 74 | 0 | 0 | cosmos(mismatch) | 4 / 1 | — | no credit (engine cannot show it) |
| 4 | IB-HUM-050 — What If Your Microbes Disappeared? | 74 | 74 | 0 | 0 | micro(mismatch) | 4 / 1 | PASS | render: restore drawn as depletion; no credit (engine cannot show it) |
| 5 | IB-EAR-054 — What If a Tornado Lasted Three Hours? | 73 | 74 | +1 | 56 | sky | 5 / 1 | PASS | raised, still <75 |
| 6 | IB-EAR-071 — What If the Atlantic Ocean Current Shut Down? | 73 | 73 | 0 | 0 | current(mismatch) | 5 / 1 | PASS | render: ICE AGE headline contradicts; no credit (engine cannot show it) |
| 7 | IB-EAR-059 — What If the Dust Bowl Returned? | 73 | 73 | 0 | 0 | sky(mismatch) | 4 / 1 | — | no credit (engine cannot show it) |
| 8 | IB-EAR-066 — What If Lake Baikal Drained? | 73 | 73 | 0 | 0 | lake(mismatch) | 5 / 1 | PASS | render: cold water drawn hot; no credit (engine cannot show it) |
| 9 | IB-EAR-086 — What If a Volcano Blew Out Sideways? | 73 | 73 | 0 | 0 | earth-interior(mismatch) | 4 / 1 | FAIL (L1 "1 landslide") | no credit (engine cannot show it) |
| 10 | IB-EAR-096 — What If a Volcano Poisoned a Country? | 73 | 73 | 0 | 0 | earth-interior(mismatch) | 4 / 1 | PASS | no credit (engine cannot show it) |
| 11 | IB-OTH-006 — What If a Whale Fed the Deep Sea for Decades? | 72 | 73 | +1 | 66 | ocean-depth | 4 / 1 | PASS | raised, still <75 |
| 12 | IB-SPA-031 — What If Earth Became Like Venus? | 72 | 72 | 0 | 62 | orbit-body | 4 / 1 | PASS | unchanged |
| 13 | IB-HUM-020 — What If You Jumped From the Edge of Space? | 72 | 72 | 0 | 52 | sky | 4 / 1 | PASS | unchanged |
| 14 | IB-HUM-024 — What If You Never Stopped Growing? | 72 | 72 | 0 | 0 | body(mismatch) | 4 / 1 | — | no credit (engine cannot show it) |
| 15 | IB-OTH-004 — What If All the Ants Disappeared? | 72 | 72 | 0 | 0 | earth-surface(mismatch) | 4 / 1 | — | no credit (engine cannot show it) |
| 16 | IB-EXT-046 — What If a Year Lasted 18 Hours? | 72 | 72 | 0 | 40 | orbit | 4 / 1 | — | unchanged |
| 17 | IB-PHY-035 — What If Lightning Were Hotter Than the Sun? | 72 | 72 | 0 | 48 | sky | 5 / 2 | — | unchanged |
| 18 | IB-EAR-001 — What If Earth Stopped Spinning for One Second? | 71 | 71 | 0 | 0 | orbit(mismatch) | 4 / 2 | — | no credit (engine cannot show it) |
| 19 | IB-PHY-080 — What If You Melted a Diamond? | 71 | 71 | 0 | 0 | micro(mismatch) | 4 / 1 | — | no credit (engine cannot show it) |
| 20 | IB-EAR-026 — What If Another Tambora Erupted Today? | 71 | 71 | 0 | 0 | orbit(mismatch) | 4 / 1 | — | no credit (engine cannot show it) |
| 21 | IB-PHY-007 — What happens if the speed of light doubles everywhere? | 71 | 71 | 0 | 0 | orbit(mismatch) | 4 / 2 | — | no credit (engine cannot show it) |
| 22 | IB-PHY-030 — What If Toilets Really Flushed Backwards Down Under? | 71 | 71 | 0 | 0 | orbit(mismatch) | 4 / 1 | — | no credit (engine cannot show it) |
| 23 | IB-FUT-042 — What If We Beamed Solar Power From Space? | 71 | 71 | 0 | 0 | orbit(mismatch) | 5 / 1 | — | no credit (engine cannot show it) |
| 24 | IB-EAR-044 — What If the Ice Age Came Back? | 71 | 71 | 0 | 52 | earth-surface | 4 / 1 | — | unchanged |
| 25 | IB-PHY-045 — What If You Cooked Pasta on a Mountain? | 71 | 71 | 0 | 0 | sky(mismatch) | 4 / 1 | — | no credit (engine cannot show it) |
| 26 | IB-EXT-039 — What If Something Was Pulling Our Galaxy? | 71 | 71 | 0 | 0 | cosmos(mismatch) | 4 / 1 | — | no credit (engine cannot show it) |
| 27 | IB-HUM-035 — What If Your Brain Used Less Energy? | 71 | 71 | 0 | 0 | body(mismatch) | 4 / 1 | — | no credit (engine cannot show it) |
| 28 | IB-EXT-037 — What If a Black Hole Shredded a Star? | 71 | 71 | 0 | 0 | cosmos(mismatch) | 4 / 1 | — | no credit (engine cannot show it) |
| 29 | IB-EXT-045 — What If a Particle Beam Passed Through Your Head? | 71 | 71 | 0 | 0 | cosmos(mismatch) | 4 / 1 | — | no credit (engine cannot show it) |
| 30 | IB-EAR-029 — What If Antarctica's Ice Sheet Melted? | 71 | 71 | 0 | 0 | ocean-depth(mismatch) | 4 / 1 | — | no credit (engine cannot show it) |
| 31 | IB-PHY-070 — What If Magnets Could Make You Float? | 71 | 71 | 0 | 0 | magnetic(mismatch) | 4 / 1 | — | no credit (engine cannot show it) |
| 32 | IB-SPA-021 — What If You Lived on Mars? | 70 | 71 | +1 | 66 | orbit-body | 4 / 1 | PASS | raised, still <75 |
| 33 | IB-EAR-076 — What If a Tsunami Crossed an Entire Ocean? | 70 | 71 | +1 | 66 | ocean-depth | 6 / 1 | FAIL (F3 magnitude) | raised, still <75 |
| 34 | IB-SPA-101 — What If We Lived on Proxima b? | 70 | 70 | 0 | 0 | orbit-body(mismatch) | 4 / 1 | — | no credit (engine cannot show it) |
| 35 | IB-SPA-116 — What If a 90-Day Rover Lasted 14 Years? | 70 | 70 | 0 | 0 | orbit(mismatch) | 4 / 1 | — | no credit (engine cannot show it) |
| 36 | IB-PHY-055 — What If Sound Could Travel Through Space? | 70 | 70 | 0 | 0 | cosmos(mismatch) | 4 / 1 | — | no credit (engine cannot show it) |
| 37 | IB-EXT-043 — What If Earth Sat in the Great Void? | 70 | 70 | 0 | 0 | sky(mismatch) | 4 / 1 | — | no credit (engine cannot show it) |
| 38 | IB-HUM-014 — What If You Could Run Like Usain Bolt? | 70 | 70 | 0 | 0 | cosmos(mismatch) | 4 / 1 | — | no credit (engine cannot show it) |
| 39 | IB-EXT-041 — What If Our Sun Were as Big as UY Scuti? | 70 | 70 | 0 | 40 | orbit | 4 / 1 | — | unchanged |
| 40 | IB-HUM-001 — What if the human need for sleep doubled overnight? | 70 | 70 | 0 | 0 | body(mismatch) | 5 / 1 | — | no credit (engine cannot show it) |
| 41 | IB-EXT-044 — What If a Star Were Flung Out of the Galaxy? | 70 | 70 | 0 | 0 | cosmos(mismatch) | 4 / 1 | — | no credit (engine cannot show it) |
| 42 | IB-HUM-019 — What If You Could See More Colours? | 70 | 70 | 0 | 0 | body(mismatch) | 4 / 1 | — | no credit (engine cannot show it) |

## False positives and false negatives
- **False positives removed by the signal:**
  - IB-EAR-086 St. Helens: the lateral blast after a landslide would be drawn as a cutaway.
  - IB-EAR-096 Laki: fluorine gas and famine would be drawn as a cutaway.
  - Superconductors (IB-FUT-045) put in the "current" world.
  - Io (IB-SPA-061) drawn as Earth.
  - Fertilizer put in the "cosmos" world.
  - All of these now score 0 and are tested.
- **False positives found by real MP4s:** IB-EAR-071, IB-HUM-050, IB-EAR-066. Technical QA PASS, but the science is
  misshown (see the render section). Their worlds now score 0.
- **False negatives (conservative on purpose):**
  - IB-EAR-006 Yellowstone: the title has no world word, so it gets no credit, although a magma-reservoir cutaway
    would fit. Its claim check also FAILs ("2.1 million").
  - Dust Bowl (sky, mismatch) and Antarctica ice sheet (ocean-depth, mismatch): the generator has no drawing for these
    mechanisms. Correctly no credit.

## Category check (IB-HUM-010 Mariana Trench, IB-HUM-050 microbes)
- The category (cluster) does not change the storyboard: the world comes from the text (ocean-depth, micro).
- In scoring, the category moves audience fit (priority clusters exclude HUMAN), series depth (50 vs 100 topics) and
  learned cluster performance.
- Re-scoring IB-HUM-010 as EARTH gives viral 73 → 71 and bucket still B, because EARTH carries more published-topic
  saturation and the hook is still 76 < 78. Its HUMAN framing ("if you stood") is defensible.
- IB-HUM-050 (human microbiome) is HUMAN correctly. No reclassification proposed.

## Review renders (real MP4s, premium-review-render run 40824721338, branch review/render-40824721338)
Technical QA was PASS for all four. That is not enough on its own: three of them misshow the science.

| Topic | Technical QA | Mechanism / science | Visual–script fit | Creative | Verdict |
|---|---|---|---|---|---|
| IB-EAR-019 magnetic field | PASS (31.1 s, 0 text WARN; WARN: loop, three mechanism scenes in a row) | **Correct.** Field lines around Earth; 183 ticks over 83 million years; the field is gone after "switch it off"; charged particles arrive; the field returns only in the payoff | Good. One weakness: the s4 bar ladder (150 / 450,000 / 780,000 / 83 million years) is log-scaled without saying so and shows values the narration never speaks | Good: first 2 s 0.658; 6 complete headlines | **Candidate** (ladder fix advised) |
| IB-EAR-071 Atlantic current | PASS (29.3 s; WARN: 1.7 s hold) | Partly right: warm north and cold south streams, and the "15–20 °C crash" correctly struck through. But the payoff headline **ICE AGE** says the opposite of "the danger isn't an ice age" | The same globe with two arrows in all 7 scenes; no Atlantic geography | Weak variety | **Not ready**: contradicting headline |
| IB-HUM-050 microbes | PASS (27.9 s; WARN: 1.6 s hold) | **Wrong** at s6: "restoring gut microbes cures 85–90%" is drawn as a thinning population | Counts land on a microbe cloud; "harmful microbes move in" is not shown | Broken headline **PARTNERSHIP, NOT A SOLO** (missing "act") | **Not ready** |
| IB-EAR-066 Lake Baikal | PASS (36.4 s; WARN: 2.47 s hold, three in a row) | **Wrong** at s6: water at 3.1–3.4 °C is drawn as a glowing red-hot slice | The lake is never shown (only a gridded globe under "LAKE BAIKAL"); the s3 ladder compares "25–30 million" with "30 million"; "drain it" shows no draining | The depth probe with 900 / 1,400 / 1,600 m markers is good | **Not ready** |

Consequence for the signal: current, lake and micro now score 0 (reasons cite these renders), and a test pins it.
Only earth-interior (IB-PHY-065) and magnetic (IB-EAR-019) have a render showing the mechanism right. ocean-depth
(IB-HUM-010) has no render yet and is bucket B anyway.

## Why 12 → 9 at ≥75 and only 2 usable
After the render evidence, 9 topics reach ≥75:

| Group | Topics |
|---|---|
| Selectable and correctly drawn | IB-PHY-065 (published today), IB-EAR-019 |
| Held | IB-EXT-050 (unsourced narration lines), IB-HUM-025 (health review), IB-EXT-047 (spin drawn as orbit, QA FAIL), IB-HUM-004 (QA FAIL, one silhouette) |
| Bucket B, not selectable | IB-PHY-020, IB-HUM-039 (animation 0; their score is not from animation), IB-HUM-010 (hook 76 < 78) |

Real stock after today: 1 (IB-EAR-019). Nothing else counts as qualified stock.

## Claim checks and the candidates
All selectable candidates PASS (IB-PHY-065 on 2026-10-28; IB-EAR-019, EAR-071, HUM-050, EAR-066 in run 40824701698).
The 3 FAILs (EAR-086, EAR-006, EAR-076) are all below 75 and do not change the stock.

## Production proposal (needs the owner's approval)
1. Adopt the signal for the **premium lane only**, with the world list above: credit only for render-validated
   worlds. Wire it through `core/pipeline/premium-lane.js` `growthBar` (a premium-only context), not
   `growth-engine.json`, so the legacy lane's selection is unchanged. Test both lanes separately.
2. Before IB-EAR-071, IB-HUM-050 and IB-EAR-066 count as stock, the generator needs four targeted fixes, each with
   a re-render:
   - a headline never drops the negation of "isn't an X";
   - "not a solo act" stays a whole phrase;
   - a heat slice for a cold temperature is drawn cold;
   - a "restore / return" line grows the population.

   Each fix restores credit for its world only after a passing render.
3. Stock growth toward 14 needs new topics in validated worlds (earth-interior, magnetic): drafted claims verified by
   the CI claim check at the same research standard and the same 75 threshold.
