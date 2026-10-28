# FR animation scoring: old vs new (2026-10-28)

Failure Reconstructed renders every Short with the Premium Engine (FR_PREMIUM_PRIMARY=1). Five viral components scored
the case's **archival media**, which the premium video never uses: `visual_potential`, `archival_footage_potential`,
`first_frame_potential`, `visual_availability` and the `weak_footage_risk` penalty. A case with no Commons stills lost
up to ~6 points even when the studio draws it well.

## Change
`channels/failure-reconstructed/growth-engine.json` → `visuals.source = "animation"`. Those components use
`core/growth/animation-potential.js` **only when it is higher** than the archival value (archival never lowered; the
footage penalty never raised). The animation potential comes from what the automatic storyboard would actually draw:

| Signal | Points |
|---|---|
| generic class (`structure`: software, clocks, wiring) | 40, never lifted |
| broad class (building, plant, terrain, mine, tank) | 58 |
| specific class (truss bridge, capsule, airliner, embankment dam …) | 70 |
| a mechanism the drawing shows (load path, wind, overtopping, seepage, uplift, spin, chain break, slope slide) | +14 |
| …and with it: a 5-link chain / trigger and mechanism named | +8 / +6 |
| cap (drawings are labelled reconstructions) | 92 |

A class drawing that only tilts or sinks shows the outcome, not the cause: no bonus without a showable mechanism.
The viral minimum (75), source and readiness gates are unchanged; no score is edited by hand.

## Accuracy work this comparison forced
The first comparison lifted 30 cases, several of them **drawn as the wrong object** by the studio itself: Adam Air
(a dam, from "Adam"), Notre-Dame (a dam), Knight Capital (a mine), USS Fitzgerald's "bridge team" (a bridge), an oil
platform and a road tanker (ships). The classifier is now word-bounded and identity-first (the object field's whole
noun, then the case's own name, then the cluster; a misleading name loses to a specific cluster). Strikes (a truck or
ship hitting a structure) no longer draw a load path. Real renders then showed the girder-bridge drawing read as an
empty first frame (Tay, Fern Hollow: first-frame FAIL); it is now a multi-span plate girder with stiffeners and piers
(both PASS).

## Result

- topics scored: 355; raised: 46; lowered: 0; viral >= 75: 26 → 33
- premium-lane qualified (viral >= 75, bucket A, studio-ready, unpublished): **7 → 12**

| case | old | new | bucket | animation basis |
|---|---|---|---|---|
| i-35w-bridge-2007 | 78 | 80 | A | object truss-bridge, mechanism load, 5-link chain, trigger and mechanism named |
| silver-bridge-1967 | 77 | 79 | A | object bridge, mechanism failure part, 5-link chain, trigger and mechanism named |
| teton-dam-1976 | 72 | 78 | A | object embankment-dam, mechanism seepage, 5-link chain, trigger and mechanism named |
| fiu-pedestrian-bridge-2018 | 74 | 76 | A | object truss-bridge, mechanism load, 5-link chain, trigger and mechanism named |
| tay-bridge-1879 | 74 | 76 | A | object girder-bridge, mechanism wind, 5-link chain, trigger and mechanism named |
| fern-hollow-bridge-2022 | 73 | 76 | A | object girder-bridge, mechanism load, 5-link chain, trigger and mechanism named |
| quebec-bridge-1907 | 74 | 76 | C | object truss-bridge, mechanism load, 5-link chain, trigger and mechanism named |
| great-flood-1993 | 73 | 75 | A | object embankment-dam, mechanism overtop, 5-link chain, trigger and mechanism named |
| mill-river-flood-1874 | 73 | 75 | A | object embankment-dam, mechanism seepage, 5-link chain, trigger and mechanism named |
| oroville-spillway-2017 | 72 | 74 | A | object dam, mechanism uplift, 5-link chain, trigger and mechanism named |
| herald-of-free-enterprise-1987 | 71 | 73 | A | no archival footage confirmed |
| ronan-point-1968 | 72 | 73 | A | no archival footage confirmed |
| delhi-dam-2010 | 70 | 73 | A | object embankment-dam, mechanism overtop, 5-link chain, trigger and mechanism named |
| johnstown-flood-1889 | 70 | 73 | B | object embankment-dam, mechanism overtop, 5-link chain, trigger and mechanism named |
| noaa-n-prime-2003 | 71 | 73 | B | object satellite, mechanism spin, 5-link chain, trigger and mechanism named |
| nanfangao-bridge-2019 | 71 | 73 | C | object bridge, mechanism failure part, 5-link chain, trigger and mechanism named |
| why-bridges-collapse | 66 | 73 | C | object girder-bridge, mechanism wind, 5-link chain, trigger and mechanism named |
| why-dams-fail | 66 | 73 | C | object embankment-dam, mechanism seepage, 5-link chain, trigger and mechanism named |
| st-francis-dam-1928 | 70 | 72 | B | object dam, mechanism uplift, 5-link chain, trigger and mechanism named |
| edenville-dam-2020 | 69 | 71 | A | object embankment-dam, mechanism overtop, 5-link chain, trigger and mechanism named |
| clapham-junction-1988 | 68 | 70 | B | no archival footage confirmed |
| hitomi-2016 | 68 | 70 | B | object satellite, mechanism spin, 5-link chain, trigger and mechanism named |
| why-metal-rusts-away | 68 | 70 | C | object girder-bridge, no mechanism the drawing can show |
| mount-polley-2014 | 68 | 70 | C | object embankment-dam, mechanism uplift, 5-link chain, trigger and mechanism named |
| hatfield-rail-crash-2000 | 68 | 70 | C | no archival footage confirmed |
| vajont-dam-1963 | 67 | 69 | B | object dam, mechanism overtop, 5-link chain, trigger and mechanism named |
| schiaparelli-2016 | 66 | 69 | B | object satellite, mechanism spin, 5-link chain, trigger and mechanism named |
| i-10-twin-span-2005 | 67 | 69 | D | object girder-bridge, mechanism wind, 5-link chain, trigger and mechanism named |
| okeechobee-1928 | 66 | 68 | B | object embankment-dam, mechanism overtop, 5-link chain, trigger and mechanism named |
| how-blackouts-spread | 67 | 68 | C | object plant, no mechanism the drawing can show |
| taum-sauk-2005 | 66 | 68 | D | object embankment-dam, mechanism overtop, 5-link chain, trigger and mechanism named |
| how-floods-destroy-cities | 66 | 67 | B | object terrain, no mechanism the drawing can show |
| why-ships-sink | 64 | 66 | C | object ship, no mechanism the drawing can show |
| how-ground-turns-to-liquid | 64 | 65 | C | object terrain, no mechanism the drawing can show |
| kinzua-bridge-2003 | 63 | 65 | D | object girder-bridge, mechanism wind, 5-link chain, trigger and mechanism named |
| north-sea-flood-1953 | 63 | 65 | D | object dam, mechanism overtop, 5-link chain, trigger and mechanism named |
| why-planes-crash | 61 | 64 | C | object aircraft, no mechanism the drawing can show |
| how-fire-spreads | 63 | 64 | C | object building, no mechanism the drawing can show |
| how-tsunamis-form | 63 | 64 | C | object terrain, no mechanism the drawing can show |
| why-rockets-explode | 61 | 64 | C | object rocket, no mechanism the drawing can show |
| why-buildings-collapse | 62 | 63 | C | object building, no mechanism the drawing can show |
| why-mines-collapse | 61 | 62 | C | object mine, no mechanism the drawing can show |
| the-science-of-sinkholes | 58 | 59 | C | object building, no mechanism the drawing can show |
| how-gas-explosions-happen | 57 | 58 | C | object building, no mechanism the drawing can show |
| how-volcanoes-erupt | 57 | 58 | C | object terrain, no mechanism the drawing can show |
| how-hurricanes-destroy | 55 | 56 | C | object building, no mechanism the drawing can show |
