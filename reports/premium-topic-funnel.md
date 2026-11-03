# Premium topic funnel and remediation queue

Generated 2026-11-03T17:46:48.801Z by scripts/growth/topic-funnel.js from the premium lane's own refusals. A topic is placed at the first stage it does not clear; nothing is removed from the inventory. RENDERABLE means the lane may render it for review; publication still needs a recorded human creative PASS.

| channel | UNRESEARCHED | RESEARCHED | VERIFIED | CREATIVE_VIABLE | RENDERABLE | HISTORY |
|---|---|---|---|---|---|---|
| ImpossibleBrief | 344 | 117 | 0 | 12 | 2 | 25 |
| Failure Reconstructed | 123 | 0 | 319 | 0 | 4 | 55 |
| The Hidden Logic of Things | 510 | 7 | 3 | 0 | 1 | 4 |
| GoalLore Lab | 0 | 0 | 0 | 0 | 9 | 0 |

Stage = where the topic stops. Fix for each stage:
- **UNRESEARCHED**: research: sourced facts with verbatim quotes and a narration
- **RESEARCHED**: verification: claim-source ledger in CI (ib-claim-ledger.yml) / primary source
- **VERIFIED**: packaging: rescore after research, or rewrite the narration to the channel's shape
- **CREATIVE_VIABLE**: creative: declare topic.visualMechanism (proposal below) or build the missing drawing; never draw an unsupported mechanism

## ImpossibleBrief

Renderable now (2): IB-EAR-019, IB-EAR-001

Remediation queue (top 15, closest to production first):

| topic | stops at | blockers | proposal |
|---|---|---|---|
| IB-SPA-031 | CREATIVE_VIABLE | CREATIVE_REVIEW_REQUIRED: the research record declares no visual mechanism (topic.visualMechanism) | planet-orbit (PROPOSED_NOT_DECLARED) |
| IB-EAR-054 | CREATIVE_VIABLE | CREATIVE_REVIEW_REQUIRED: the research record declares no visual mechanism (topic.visualMechanism) | atmosphere (PROPOSED_NOT_DECLARED) |
| IB-EAR-059 | CREATIVE_VIABLE | CREATIVE_REVIEW_REQUIRED: the research record declares no visual mechanism (topic.visualMechanism) | atmosphere (PROPOSED_NOT_DECLARED) |
| IB-EAR-066 | CREATIVE_VIABLE | CREATIVE_REVIEW_REQUIRED: the research record declares no visual mechanism (topic.visualMechanism) | lake-water (PROPOSED_NOT_DECLARED) |
| IB-EAR-071 | CREATIVE_VIABLE | CREATIVE_REVIEW_REQUIRED: the research record declares no visual mechanism (topic.visualMechanism) | ocean-current (PROPOSED_NOT_DECLARED) |
| IB-FUT-042 | CREATIVE_VIABLE | CREATIVE_REVIEW_REQUIRED: the research record declares no visual mechanism (topic.visualMechanism) | planet-orbit (PROPOSED_NOT_DECLARED) |
| IB-HUM-024 | CREATIVE_VIABLE | CREATIVE_REVIEW_REQUIRED: the research record declares no visual mechanism (topic.visualMechanism) | human-body (PROPOSED_NOT_DECLARED) |
| IB-EXT-046 | CREATIVE_VIABLE | CREATIVE_REVIEW_REQUIRED: the research record declares no visual mechanism (topic.visualMechanism) | planet-orbit (PROPOSED_NOT_DECLARED) |
| IB-OTH-006 | CREATIVE_VIABLE | CREATIVE_REVIEW_REQUIRED: the research record declares no visual mechanism (topic.visualMechanism) | ocean-depth (PROPOSED_NOT_DECLARED) |
| IB-EAR-044 | CREATIVE_VIABLE | CREATIVE_REVIEW_REQUIRED: the research record declares no visual mechanism (topic.visualMechanism) | earth-surface (PROPOSED_NOT_DECLARED) |
| IB-PHY-080 | CREATIVE_VIABLE | CREATIVE_REVIEW_REQUIRED: the research record declares no visual mechanism (topic.visualMechanism) | microbial-population (PROPOSED_NOT_DECLARED) |
| IB-OTH-004 | CREATIVE_VIABLE | CREATIVE_REVIEW_REQUIRED: the research record declares no visual mechanism (topic.visualMechanism) | earth-surface (PROPOSED_NOT_DECLARED) |
| IB-OTH-020 | RESEARCHED | CREATIVE_REVIEW_REQUIRED: the research record declares no visual mechanism (topic.visualMechanism); SOURCE_UNVERIFIED: no claim-source ledger (run scripts/ib-research/claim-check.js --ledger in CI) | - (NEEDS_CREATIVE_DECISION) |
| IB-SPA-006 | RESEARCHED | CREATIVE_REVIEW_REQUIRED: the research record declares no visual mechanism (topic.visualMechanism); SOURCE_UNVERIFIED: no claim-source ledger (run scripts/ib-research/claim-check.js --ledger in CI) | atmosphere (PROPOSED_NOT_DECLARED) |
| IB-SPA-021 | RESEARCHED | CREATIVE_REVIEW_REQUIRED: the research record declares no visual mechanism (topic.visualMechanism); SOURCE_UNVERIFIED: no claim-source ledger (run scripts/ib-research/claim-check.js --ledger in CI) | planet-orbit (PROPOSED_NOT_DECLARED) |

## Failure Reconstructed

Renderable now (4): FR-el-faro-2015, FR-lake-nyos-1986, FR-mars-96-1996, FR-moore-tornado-2013

Remediation queue (top 15, closest to production first):

| topic | stops at | blockers | proposal |
|---|---|---|---|
| FR-apollo-1-1967 | VERIFIED | bucket C is not selectable (A) |  |
| FR-skylab-1973 | VERIFIED | bucket C is not selectable (A) |  |
| FR-munich-1958 | VERIFIED | bucket C is not selectable (A) |  |
| FR-vanguard-1957 | VERIFIED | bucket C is not selectable (A) |  |
| FR-a400m-seville-2015 | VERIFIED | bucket B is not selectable (A) |  |
| FR-eastland-1915 | VERIFIED | bucket C is not selectable (A) |  |
| FR-love-canal | VERIFIED | bucket B is not selectable (A) |  |
| FR-mill-river-flood-1874 | VERIFIED | bucket B is not selectable (A) |  |
| FR-uss-forrestal-1967 | VERIFIED | bucket C is not selectable (A) |  |
| FR-alaska-261-2000 | VERIFIED | viral score 74 below the channel minimum 75 |  |
| FR-amtrak-188-2015 | VERIFIED | viral score 74 below the channel minimum 75 |  |
| FR-castle-bravo-1954 | VERIFIED | viral score 74 below the channel minimum 75 |  |
| FR-controlled-impact-1984 | VERIFIED | viral score 74 below the channel minimum 75 |  |
| FR-costa-concordia-2012 | VERIFIED | viral score 74 below the channel minimum 75 |  |
| FR-derna-dams-2023 | VERIFIED | viral score 74 below the channel minimum 75 |  |

## The Hidden Logic of Things

Renderable now (1): BTO-156

Remediation queue (top 15, closest to production first):

| topic | stops at | blockers | proposal |
|---|---|---|---|
| BTO-301 | VERIFIED | bucket D is not selectable (A) |  |
| BTO-203 | VERIFIED | bucket D is not selectable (A) |  |
| BTO-201 | VERIFIED | bucket D is not selectable (A) |  |
| BTO-040 | RESEARCHED | researchStatus is NEEDS_PRIMARY_SOURCE, not VERIFIED; topic is not productionReady; not ranked by the channel's topic scoring |  |
| BTO-116 | RESEARCHED | researchStatus is NEEDS_PRIMARY_SOURCE, not VERIFIED; topic is not productionReady; not ranked by the channel's topic scoring |  |
| BTO-147 | RESEARCHED | researchStatus is NEEDS_PRIMARY_SOURCE, not VERIFIED; topic is not productionReady; not ranked by the channel's topic scoring |  |
| BTO-154 | RESEARCHED | researchStatus is RESEARCHED, not VERIFIED; topic is not productionReady; fact 1 has no verbatim quote |  |
| BTO-166 | RESEARCHED | researchStatus is NEEDS_PRIMARY_SOURCE, not VERIFIED; topic is not productionReady; not ranked by the channel's topic scoring |  |
| BTO-176 | RESEARCHED | researchStatus is NEEDS_PRIMARY_SOURCE, not VERIFIED; topic is not productionReady; not ranked by the channel's topic scoring |  |
| BTO-226 | RESEARCHED | researchStatus is NEEDS_PRIMARY_SOURCE, not VERIFIED; topic is not productionReady; not ranked by the channel's topic scoring |  |
| BTO-001 | UNRESEARCHED | researchStatus is QUESTION_ONLY, not VERIFIED; topic is not productionReady; topic has no narration |  |
| BTO-002 | UNRESEARCHED | researchStatus is QUESTION_ONLY, not VERIFIED; topic is not productionReady; topic has no narration |  |
| BTO-003 | UNRESEARCHED | researchStatus is QUESTION_ONLY, not VERIFIED; topic is not productionReady; topic has no narration |  |
| BTO-004 | UNRESEARCHED | researchStatus is QUESTION_ONLY, not VERIFIED; topic is not productionReady; topic has no narration |  |
| BTO-005 | UNRESEARCHED | researchStatus is QUESTION_ONLY, not VERIFIED; topic is not productionReady; topic has no narration |  |

## GoalLore Lab

Renderable now (9): GLL-021, GLL-025, GLL-026, GLL-028, GLL-031, GLL-037, GLL-043, GLL-052, GLL-061

Remediation queue (top 15, closest to production first):

| topic | stops at | blockers | proposal |
|---|---|---|---|

