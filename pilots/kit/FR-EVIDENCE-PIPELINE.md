# FR: structured evidence for 388 case files (design, 2026-10-29)

Review document. Nothing here is wired into production. Today the kit plans an FR case only from a hand-made
`pilots/research/FR-<slug>.json`, so 2 of 388 cases plan (Gemini 8, Ariane 5).

## Why not fill everything at once
A case file (`icerik/konular/<slug>.json`) names an object, a trigger, a mechanism and a chain (`vaka.nesne/tetik/mekanizma/zincir`),
but not the geometry the animation needs: which member failed first, its location, load path, timeline and quantities.
If those fields were filled automatically, the renderer would draw invented mechanisms with confidence. The GLL research run
on 2026-10-29 showed that a word-overlap verifier accepts wrong quotes; see the stricter rule in PR #385.

## Mechanism classes (first pass, keyword classifier over `vaka.mekanizma` + `tetik`; to be confirmed by hand)

| Class | Cases | Examples | Kit template today | Evidence fields the template needs |
|---|---|---|---|---|
| fire / explosion | 78 | apollo-1-1967, beirut-port-2020 | none | ignition source + location, fuel, spread path, time to flashover / detonation, quantity |
| structural overload / collapse | 57 | alexander-kielland-1980, i-35w (published) | none | failed member + its location, load at failure vs capacity, sequence of the following failures |
| fluid breach (dam, tailings, flood) | 48 | brumadinho-dam-2019, aberfan-1966 | none | breach location, mechanism (overtopping / piping / liquefaction), volume, flow-front speed |
| aero / control (stall, icing, sensors, crew) | 34 | air-france-447-2009, a400m-seville-2015 | none | flight-path numbers (altitude, speed, pitch over time), the faulty input, the crew/automation action |
| fatigue / crack | 28 | aloha-airlines-243-1988, american-191-1979 | none | crack origin, growth mechanism, part, final fracture |
| stability / flooding (ships) | 17 | andrea-doria-1956, bourbon-dolphin-2007 | none | flooding opening, compartments, heel angle over time |
| software / logic | 7 | ariane-5-flight-501, crowdstrike-outage-2024 | guidance-data-failure (Ariane) | faulting value / range, the unit that failed, order of the failures |
| electrical | 7 | boeing-787-batteries-2013, clapham-junction-1988 | none | fault location, failure mode, consequence order |
| attitude / thruster | 2 | gemini-8-1966, hitomi-2016 | attitude-torque (Gemini 8) | thruster, rate, recovery action |
| not classified by the keyword pass | 110 | admiral-nakhimov-1986, air-florida-90-1982 | – | classify by hand |

## Pipeline (same shape as GLL: evidence → visual plan → mechanism template → MP4)

1. **Class card.** Each class declares its required fields, as `pilots/research/gll-mechanism-evidence.json` does for football.
   A template is built only for a class card, never for one case.
2. **Draft.** For each required field, write `{field, claim, terms, context:[name, year], source}`. The source is a primary host
   (NTSB, CSB, BEA, MAIB, NASA, a national investigation report) or Wikipedia. Drafts carry no quotes.
3. **Verify** (`scripts/gll-research/verify.js`, mechanism rule). The code copies the quote verbatim from the pinned source
   revision. A mechanism field passes only if its paragraph names the event (context terms), no foreign year appears,
   and the terms include an action term besides names.
4. **Plan.** The planner reads only verified fields. A missing field means CREATIVE_REVIEW_REQUIRED with the field named
   (today's behaviour for GLL). Assumptions are capped and labelled MOTION REPRESENTATIVE / MODEL on screen.
5. **Render and QA.** Technical QA (reading time, 24 px, determinism, A/V) is separate from the creative review.

## Small proving batch (before any scale-up)
Two cases per class for the three largest classes plus fatigue, each through all five steps:

| Class | Cases | Pass criterion |
|---|---|---|
| structural overload | alexander-kielland-1980, fern-hollow-bridge-2022 | all required fields verified; PLANNED with 0 invented fields; QA PASS; creative review accepts the mechanism |
| fluid breach | brumadinho-dam-2019, aberfan-1966 | same |
| fire / explosion | beirut-port-2020, buncefield-2005 | same |
| fatigue / crack | aloha-airlines-243-1988, american-191-1979 | same |

Scale a class to its remaining cases only after both of its cases pass. Track three per-class numbers: share of fields verified,
share of cases planned, and share of creative reviews accepted. A class whose cases need more than 3 assumptions stays
manual. The 75 viral threshold and the FR daily production on the current engine are unchanged by this work.

## Effort and blockers
- 4 new mechanism templates (structural, fluid breach, fire, fatigue) are reusable kit code. They are not per-case animation.
- Primary investigation reports are PDFs: the verifier needs a PDF text extractor pinned to a document hash, the same
  way primary pages are pinned today.
- Wikipedia and primary hosts are not reachable from the build environment. Research runs in CI (the gll-research workflow
  pattern).
