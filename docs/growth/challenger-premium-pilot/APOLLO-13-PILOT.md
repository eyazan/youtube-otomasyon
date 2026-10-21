# Apollo 13 premium pilot: inventory and automatically planned shots (2026-10-14)

> **Update 2026-10-15:** see `GENERALIZATION-V1.md`. The planner now makes 8/9 clean shots (component-section + document-excerpt). Correction: in §5 below, L6 was actually planned as a human-cost archival plate (sm-damage), not a timeline; the 3/9 total was right.

**Offline pilot.** Nothing was rendered, published or downloaded beyond Commons metadata and the Review Board text. Files: `channels/failure-reconstructed/premium/apollo-13-1970/plan/`.

## 1. Duplicate check (done first)

| Channel | Finding |
|---|---|
| **Failure Reconstructed** | **Already covered.** The published Short "28 Volts vs 65: Apollo 13's Hidden Flaw" (https://youtu.be/uqoAjXMbbls, 14 d: 1,286 views, 53.9% average viewed, Shorts feed 88%). There is also a long-form package and generation record (`state/longform/packages/apollo-13-1970.json`) and Wikipedia-based research (`state/longform/research/apollo-13-1970.deep.json`, 160 secondary claims). |
| ImpossibleBrief | No Apollo 13 topic. |
| CriticalThread | Mentioned in `topics/topic-universe.json` and `research-seeds/batch-02.json`, which are seeds, not videos. |

**Consequence:**
- This pilot is a **premium remake** of an existing Failure Reconstructed Short, exactly like the Challenger pilot (a remake of the published original).
- It can be compared against a real published baseline. Publishing it would need an explicit remake decision by the owner; nothing here schedules it.
- The existing research is **not reused as evidence**: it is secondary (Wikipedia, CC BY-SA), and the evidence gate requires primary passages.

## 2. Evidence inventory (primary source only)

**Source:** E1, the *Report of Apollo 13 Review Board* (NASA), NSSDC plain-text edition.

**Claims:** 15, all extracted **verbatim** by `build_evidence.py`, which fails if a passage is not found. All are verified and each has a planner role.

| Claim | What it states (the board's words in the passage) |
|---|---|
| C-a13-launch / C-a13-mission | launched "at 2:13 p.m. e.s.t., April 11, 1970" |
| C-a13-detank-date | "On Friday, March 27, 1970, detanking operations were resumed" |
| C-a13-heaters-65v | "The heaters were energized with the 65 V dc. GSE power supply" |
| C-a13-switch-rating | switches "rated as satisfactory for the 28 V dc spacecraft power supply, could not open properly at 65 V dc" |
| C-a13-switch-80f | "intended to open the heater circuit when it senses a temperature of 80 F" |
| C-a13-1000f (estimate) | "…reach about 1000 F in spots during the continuous 8-hour period of heater operation" |
| C-a13-teflon | "severely damage the Teflon insulation on the fan motor wires" |
| C-a13-hazard | "From that time on, including pad occupancy, the oxygen tank no. 2 was in a hazardous condition…" |
| C-a13-fans | "current was applied to the oxygen tank no. 2 fan motors at 55:53:20" |
| C-a13-dataloss | "at 55:54:53.555, telemetry from the spacecraft was lost almost totally for 1.8 seconds" |
| C-a13-pressure | "oxygen tank no. 2 lost pressure in this time period and the panel separated" |
| C-a13-cause (finding) | "an electrically initiated fire in oxygen tank no. 2 … was the cause of the accident" |
| C-a13-averted | "a near disaster, averted only by outstanding performance on the part of the crew and the ground control team" |
| C-a13-payoff | editorial summary (labelled, not a quote) |

## 3. Asset inventory and licensing (Commons metadata; nothing downloaded)

| Key | File | Licence | Use |
|---|---|---|---|
| sm-damage | Apollo 13 Service Module - AS13-59-8500 (2946×2399) | Public domain (NASA) | hook / payoff: the missing panel |
| sm-damage-2 | AS13-58-8458 (3928×3928) | Public domain | alternate damage view |
| tank-location | Apollo13 tank.jpg (606×794) | Public domain | where tank 2 sits in the SM |
| tank-diagram | 4-339a.gif (394×217) | Public domain | the tank (low resolution) |
| tank-fire-test | S70-41984 (3398×4340) | Public domain | the board's full-scale fire test, labelled as a **test** |
| crew | The Actual Apollo 13 Prime Crew (GPN-2000-001167) | Public domain | human beat |
| mission-control | 1970 Mission Control Apollo 13 | Public domain | ground team |
| launch | Apollo 13 launch (S70-34852) | Public domain | launch |

**Excluded** (`assets-excluded.json`):
- the Apollo 14 redesigned-tank artist's concept (not the Apollo 13 tank; misleading);
- a CC BY timeline diagram (secondary);
- an unrelated montage;
- an Apollo 10 crew photo.

**Anchors: 0.** No point of interest, document region or tank geometry has been measured yet, so the planner may not mark, trace or register anything.

## 4. Narration outline (draft, not approved; estimated timings)

L1–L9 in `narration-script.json`, spoken numbers as words, each line citing its claims:
- **L1:** tank dangerous on the pad.
- **L2:** heaters on a 65 V supply.
- **L3:** switches rated for 28 V.
- **L4:** meant to open at 80°, could not.
- **L5:** heater tube about 1000°, insulation damaged.
- **L6:** fans on, about 90 s later the tank lost pressure.
- **L7:** the board's finding.
- **L8:** near disaster averted by crew and ground team.
- **L9:** payoff (editorial).

The word timings are **estimated** from text length (`timeline-estimated.json`). The planner reports this.

## 5. Automatically generated shot plan (`auto/shot-plan.auto.json`, `auto/planner-report.json`)

| Line | Beat (auto) | Template (auto) | Status |
|---|---|---|---|
| L1 | hook | archival-plate (launch photo) | **review**: MISSING_ANCHOR (no measured point of interest) |
| L2 | evidence | — | **review**: MISSING_ASSET (no asset depicts the 65 V detanking claim) |
| L3 | evidence | — | **review**: MISSING_ASSET (switch rating: needs the report figure or a document region) |
| L4 | evidence | — | **review**: MISSING_ASSET |
| L5 | mechanism | — | **review**: NO_TEMPLATE (heater / thermostat / wiring needs `component-section`; see its spec) |
| L6 | event-sequence | timeline (55:53:20 → 55:54:53 g.e.t.) | **clean** |
| L7 | decision | document-desk | **review**: MISSING_ANCHOR (no document region holds the finding) |
| L8 | human-cost | archival-plate (crew portrait) | **clean** |
| L9 | payoff | payoff (loop to the hook photo) | **clean** |

**Totals:** 3 of 9 shots planned and valid with no human input; 6 need specific human work, each listed with what is needed.

**Global flags:** SCRIPT_NOT_APPROVED, ESTIMATED_TIMELINE.

## 6. Human work needed before a scene-level render

1. Owner approval of the topic as a remake, and of the script.
2. Narration recording, so the timings can be measured.
3. **About 6 anchors:**
   - the missing-panel point on AS13-59-8500;
   - document regions for the switch rating and the finding (requires downloading the report's scanned pages or figures);
   - tank geometry for `component-section`.
4. The `component-section` template (spec only, `COMPONENT-SECTION-SPEC.md`).
5. Re-run the planner, then storyboard approval.
