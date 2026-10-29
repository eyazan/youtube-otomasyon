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
| current (warm/cold streams that slow) | 70 | dedicated component |
| lake / ocean-depth (depth slice, strata) | 66 | depth-probe component |
| micro (population that thins) | 62 | microbes component |
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
- Viral ≥75: 7 → 12. All 5 new ones come from the 70–74 band. IB-HUM-010 is bucket B because its hook is 76 < 78, not
  because of its category.
- Selectable and unheld at ≥75: IB-PHY-065 (already qualified), IB-EAR-019, IB-EAR-071, IB-HUM-050, IB-EAR-066.
- Held topics keep their holds: IB-EXT-050, IB-HUM-025, IB-EXT-047, IB-HUM-004.

## The 42 topics in the 70–74 band
Claim check: `ib-claim-check` run 40824701698 (main, 14 topics).

| # | Konu | Eski | Yeni | Fark | Animasyon | Motorun çizimi | Fact / kaynak | İddia kontrolü | Değerlendirme |
|---|---|---|---|---|---|---|---|---|---|
| 1 | IB-EAR-019 — Could Earth survive one day without Earth's magnetic field? | 73 | 76 | +3 | 82 | magnetic | 5 / 2 | PASS | ≥75: render incelemesi gerekli |
| 2 | IB-EAR-071 — What If the Atlantic Ocean Current Shut Down? | 73 | 76 | +3 | 78 | current | 5 / 1 | PASS | ≥75: render incelemesi gerekli |
| 3 | IB-HUM-050 — What If Your Microbes Disappeared? | 74 | 75 | +1 | 66 | micro | 4 / 1 | PASS | ≥75: render incelemesi gerekli |
| 4 | IB-EAR-066 — What If Lake Baikal Drained? | 73 | 75 | +2 | 74 | lake | 5 / 1 | PASS | ≥75: render incelemesi gerekli |
| 5 | IB-HUM-010 — What If You Stood at the Bottom of the Mariana Trench? | 73 | 75 | +2 | 70 | ocean-depth | 5 / 1 | PASS | ≥75 ama kova B (hook 76 < 78): seçilemez |
| 6 | IB-OTH-020 — What If Synthetic Fertilizer Disappeared? | 74 | 74 | 0 | 0 | cosmos(mismatch) | 4 / 1 | — | kredi yok (motor bu konuyu gösteremez) |
| 7 | IB-EAR-054 — What If a Tornado Lasted Three Hours? | 73 | 74 | +1 | 56 | sky | 5 / 1 | PASS | yükseldi, hâlâ <75 |
| 8 | IB-EAR-059 — What If the Dust Bowl Returned? | 73 | 73 | 0 | 0 | sky(mismatch) | 4 / 1 | — | kredi yok (motor bu konuyu gösteremez) |
| 9 | IB-EAR-086 — What If a Volcano Blew Out Sideways? | 73 | 73 | 0 | 0 | earth-interior(mismatch) | 4 / 1 | FAIL (L1 "1 landslide") | kredi yok (motor bu konuyu gösteremez) |
| 10 | IB-EAR-096 — What If a Volcano Poisoned a Country? | 73 | 73 | 0 | 0 | earth-interior(mismatch) | 4 / 1 | PASS | kredi yok (motor bu konuyu gösteremez) |
| 11 | IB-OTH-006 — What If a Whale Fed the Deep Sea for Decades? | 72 | 73 | +1 | 66 | ocean-depth | 4 / 1 | PASS | yükseldi, hâlâ <75 |
| 12 | IB-SPA-031 — What If Earth Became Like Venus? | 72 | 72 | 0 | 62 | orbit-body | 4 / 1 | PASS | değişmedi |
| 13 | IB-HUM-020 — What If You Jumped From the Edge of Space? | 72 | 72 | 0 | 52 | sky | 4 / 1 | PASS | değişmedi |
| 14 | IB-HUM-024 — What If You Never Stopped Growing? | 72 | 72 | 0 | 0 | body(mismatch) | 4 / 1 | — | kredi yok (motor bu konuyu gösteremez) |
| 15 | IB-OTH-004 — What If All the Ants Disappeared? | 72 | 72 | 0 | 0 | earth-surface(mismatch) | 4 / 1 | — | kredi yok (motor bu konuyu gösteremez) |
| 16 | IB-EXT-046 — What If a Year Lasted 18 Hours? | 72 | 72 | 0 | 40 | orbit | 4 / 1 | — | değişmedi |
| 17 | IB-PHY-035 — What If Lightning Were Hotter Than the Sun? | 72 | 72 | 0 | 48 | sky | 5 / 2 | — | değişmedi |
| 18 | IB-EAR-001 — What If Earth Stopped Spinning for One Second? | 71 | 71 | 0 | 0 | orbit(mismatch) | 4 / 2 | — | kredi yok (motor bu konuyu gösteremez) |
| 19 | IB-PHY-080 — What If You Melted a Diamond? | 71 | 71 | 0 | 0 | micro(mismatch) | 4 / 1 | — | kredi yok (motor bu konuyu gösteremez) |
| 20 | IB-EAR-026 — What If Another Tambora Erupted Today? | 71 | 71 | 0 | 0 | orbit(mismatch) | 4 / 1 | — | kredi yok (motor bu konuyu gösteremez) |
| 21 | IB-PHY-007 — What happens if the speed of light doubles everywhere? | 71 | 71 | 0 | 0 | orbit(mismatch) | 4 / 2 | — | kredi yok (motor bu konuyu gösteremez) |
| 22 | IB-PHY-030 — What If Toilets Really Flushed Backwards Down Under? | 71 | 71 | 0 | 0 | orbit(mismatch) | 4 / 1 | — | kredi yok (motor bu konuyu gösteremez) |
| 23 | IB-FUT-042 — What If We Beamed Solar Power From Space? | 71 | 71 | 0 | 0 | orbit(mismatch) | 5 / 1 | — | kredi yok (motor bu konuyu gösteremez) |
| 24 | IB-EAR-044 — What If the Ice Age Came Back? | 71 | 71 | 0 | 52 | earth-surface | 4 / 1 | — | değişmedi |
| 25 | IB-PHY-045 — What If You Cooked Pasta on a Mountain? | 71 | 71 | 0 | 0 | sky(mismatch) | 4 / 1 | — | kredi yok (motor bu konuyu gösteremez) |
| 26 | IB-EXT-039 — What If Something Was Pulling Our Galaxy? | 71 | 71 | 0 | 0 | cosmos(mismatch) | 4 / 1 | — | kredi yok (motor bu konuyu gösteremez) |
| 27 | IB-HUM-035 — What If Your Brain Used Less Energy? | 71 | 71 | 0 | 0 | body(mismatch) | 4 / 1 | — | kredi yok (motor bu konuyu gösteremez) |
| 28 | IB-EXT-037 — What If a Black Hole Shredded a Star? | 71 | 71 | 0 | 0 | cosmos(mismatch) | 4 / 1 | — | kredi yok (motor bu konuyu gösteremez) |
| 29 | IB-EXT-045 — What If a Particle Beam Passed Through Your Head? | 71 | 71 | 0 | 0 | cosmos(mismatch) | 4 / 1 | — | kredi yok (motor bu konuyu gösteremez) |
| 30 | IB-EAR-029 — What If Antarctica's Ice Sheet Melted? | 71 | 71 | 0 | 0 | ocean-depth(mismatch) | 4 / 1 | — | kredi yok (motor bu konuyu gösteremez) |
| 31 | IB-PHY-070 — What If Magnets Could Make You Float? | 71 | 71 | 0 | 0 | magnetic(mismatch) | 4 / 1 | — | kredi yok (motor bu konuyu gösteremez) |
| 32 | IB-SPA-021 — What If You Lived on Mars? | 70 | 71 | +1 | 66 | orbit-body | 4 / 1 | PASS | yükseldi, hâlâ <75 |
| 33 | IB-EAR-076 — What If a Tsunami Crossed an Entire Ocean? | 70 | 71 | +1 | 66 | ocean-depth | 6 / 1 | FAIL (F3 magnitude) | yükseldi, hâlâ <75 |
| 34 | IB-SPA-101 — What If We Lived on Proxima b? | 70 | 70 | 0 | 0 | orbit-body(mismatch) | 4 / 1 | — | kredi yok (motor bu konuyu gösteremez) |
| 35 | IB-SPA-116 — What If a 90-Day Rover Lasted 14 Years? | 70 | 70 | 0 | 0 | orbit(mismatch) | 4 / 1 | — | kredi yok (motor bu konuyu gösteremez) |
| 36 | IB-PHY-055 — What If Sound Could Travel Through Space? | 70 | 70 | 0 | 0 | cosmos(mismatch) | 4 / 1 | — | kredi yok (motor bu konuyu gösteremez) |
| 37 | IB-EXT-043 — What If Earth Sat in the Great Void? | 70 | 70 | 0 | 0 | sky(mismatch) | 4 / 1 | — | kredi yok (motor bu konuyu gösteremez) |
| 38 | IB-HUM-014 — What If You Could Run Like Usain Bolt? | 70 | 70 | 0 | 0 | cosmos(mismatch) | 4 / 1 | — | kredi yok (motor bu konuyu gösteremez) |
| 39 | IB-EXT-041 — What If Our Sun Were as Big as UY Scuti? | 70 | 70 | 0 | 40 | orbit | 4 / 1 | — | değişmedi |
| 40 | IB-HUM-001 — What if the human need for sleep doubled overnight? | 70 | 70 | 0 | 0 | body(mismatch) | 5 / 1 | — | kredi yok (motor bu konuyu gösteremez) |
| 41 | IB-EXT-044 — What If a Star Were Flung Out of the Galaxy? | 70 | 70 | 0 | 0 | cosmos(mismatch) | 4 / 1 | — | kredi yok (motor bu konuyu gösteremez) |
| 42 | IB-HUM-019 — What If You Could See More Colours? | 70 | 70 | 0 | 0 | body(mismatch) | 4 / 1 | — | kredi yok (motor bu konuyu gösteremez) |

## False positives and false negatives
- **False positives removed by the signal:**
  - IB-EAR-086 St. Helens: the lateral blast after a landslide would be drawn as a cutaway.
  - IB-EAR-096 Laki: fluorine gas and famine would be drawn as a cutaway.
  - Superconductors (IB-FUT-045) put in the "current" world.
  - Io (IB-SPA-061) drawn as Earth.
  - Fertilizer put in the "cosmos" world.
  - All of these now score 0 and are tested.
- **Remaining false-positive risk:** IB-HUM-050 (micro, 66) shows a microbe cluster thinning. It is the right object,
  but its narration is mostly counts (genes, species). The review render decides.
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

## Review renders
Pending (premium-review-render run 40824721338): IB-EAR-019, IB-EAR-071, IB-HUM-050, IB-EAR-066.
