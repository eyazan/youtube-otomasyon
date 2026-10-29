# ImpossibleBrief: 30 October topic buffer and learned score penalties (2026-10-29)

Read-only analysis. The 75 viral minimum is unchanged and production scoring is unchanged. The two new topics in this
branch are an owner decision (see §3); nothing here is merged or published.

## 1. Before this branch: 0 qualified topics for 30 October

`node scripts/growth/topic-buffer.js --channel impossible-brief` on main: **CRITICAL, 0 qualified**. The best unused A topic scores 74; the two topics at 75 are bucket B.

| Candidate | Bucket / viral | What actually holds it back | Can a better script fix it? |
|---|---|---|---|
| IB-HUM-050 microbes | A / 74 | The learned components (§2) and boilerplate sources: the topic-level sources are the NIH research-training page and **NIST's physics page** for a microbiome topic; the facts themselves are from Wikipedia "Human microbiome" (claim check PASS). | No honest script change moves the score. The sources should be replaced with real microbiome sources (e.g. the NIH Human Microbiome Project), which does not raise the score. |
| IB-PHY-020 near light speed | B / 75 | B because the hook scores 77 < 78. The sources are the NIST/CERN/NASA homepages. The facts are from Wikipedia "Time dilation" (claim check PASS). | Only a new hook would change the bucket, which is the kind of fix the owner ruled out. Real material exists to strengthen the story: CERN muon storage ring, 2.197 μs → 64.378 μs at γ = 29.327; Hafele–Keating 1971, −59 ± 10 ns east / +273 ± 7 ns west. This needs a new record and fresh research, not a hook swap. |
| IB-HUM-039 no pain | B / 75 | **Wrong mechanism.** Line 3, "A faulty sodium channel stops pain signals", is attached to the Vittangi village. The Norrbotten/Vittangi family carries an **NGF (nerve growth factor) mutation, HSAN V** (Einarsdottir et al. 2004; Minde 2006; PMC3046150), not SCN9A. Most of the ~40 Vittangi cases are heterozygous carriers with mild symptoms, so "painless people" overstates it. The claim check PASSES this topic because it verifies numbers, not mechanisms. | The narration must be corrected before this topic can be produced at all (proposal below). Even corrected, it stays B. |

Corrected IB-HUM-039 narration (proposal, not written): "One Swedish village has nearly 40 cases of pain insensitivity." /
"There, the cause traced to one gene: nerve growth factor." / "Elsewhere, the same condition comes from a sodium channel, SCN9A." /
"Broken bones and burns can go unnoticed." / "So pain isn't the problem. It's the alarm." The NGF line needs PMC3046150 or
the Minde thesis as its source; the Wikipedia article does not link Vittangi to NGF.

## 2. Learned penalties: which topics are penalised unfairly

`node scripts/growth/learned-penalty-counterfactual.js` rescored the same ranking the selector builds, under four
alternative rules (main inventory, before the two new topics):

| Variant | What changes | Qualified A ≥ 75 | Newly qualified |
|---|---|---|---|
| current | production | 0 | – |
| unitFix | `subscriberConversion` is stored per view but read as per 1,000 views | 1 | IB-HUM-050 (74→75) |
| **minSample** (n ≥ 5) | a cluster with < 5 uploads keeps the neutral prior | **8** | IB-EAR-019, -054, -059, -066, -071, -086, -096 (73→75), IB-HUM-050 (74→75) |
| shrink (k = 5) | Bayesian shrinkage toward 50, conversion only from ≥ 5 samples | 8 | same 8 |
| noDiversity | 30-day same-cluster fatigue removed (diagnostic only) | 20 | adds SPACE/OTHER/FUTURE topics |

The three constraints act separately:

- **Minimum sample.** Every IB cluster has 1–4 measured Shorts (HUMAN 1, EXTREME SCIENCE 1, PHYSICS 2, EARTH 3, OTHER 3, SPACE 4, FUTURE 4). With n = 1–4, `historical_similarity` (HUMAN 43, PHYSICS 35) and `subscriber_conversion_potential` replace the series prior with a measured value; that is where the unfair penalty comes from. The 7 EARTH topics and IB-HUM-050 are held under 75 by sample size, not by evidence about the topic.
- **Uncertainty / unit defect.** `subscriber_conversion_potential = 50 + subscriberConversion × 10`, with the note "subscribers / 1,000 views", but `subscriberConversion` is subscribers ÷ views (0.00162 = 1.6 per 1,000). Every measured cluster therefore pins to 50, replacing a series proxy of 70–88; for PHYSICS, 88 drops to 50. Most values are 0 or 1 subscriber, which is noise at ~1,000 views. Shrinkage and minimum sample give the same 8 topics.
- **Diversity.** −22 per same-cluster upload in the last 30 days is a deliberate variety rule, not a sampling error. Since IB publishes daily across 7 clusters, it rises for every cluster as cadence holds. It counts only rows that have analytics (the last row is from 19 Oct), so it will grow when analytics catches up. Removing it is not proposed; it shows the constraint's cost (12 more topics).

Proposal for the owner (not implemented): a minimum of 5 uploads per cluster before `historical_similarity` and
`subscriber_conversion_potential` leave the prior, plus the unit fix. Recommended effect: 8 more qualified topics, all already researched and claim-checked except IB-EAR-086 (claim check FAIL: "1 landslide"). The diversity rule stays.

Also found: the inventory signals that feed the score (`curiosityScore`, `visualPotential.score`, `shortPotential`,
`evergreenScore`, `audienceFit`) were assigned by the topic generator, not measured, and researched records inherit
them from the placeholder they replace. The topic-level sources are a per-category boilerplate list (NIST for HUMAN
topics), which inflates `SourceQuality` to 94–95. Today's IB video (5cNecwSkYDo) lists NIST and CERN for Earth's core.

## 3. New researched topics (this branch)

Seed `research-seeds/batch-11.json`, verified in CI (`ib-seed-research.yml`, run 40934468952): every fact is a verbatim
Wikipedia sentence at a pinned revision, every number is in its own fact, and the topic-level sources are real
primary-host pages (PubMed 10665559 + StatPearls NBK545239; two NASA tardigrade pages), all reachable.

| Topic | Replaces (unresearched placeholder) | Bucket / viral (production scoring) | Readiness | Hooks |
|---|---|---|---|---|
| IB-HUM-044 What If Your Heart Stopped in Ice Water? (Anna Bågenholm 1999: 80 min under ice, 13.7 °C, no heartbeat 2 h 35 min, bypass rewarming, near-full recovery) | could-evolution-adapt-if-human-muscle-efficiency… | **A / 75** | 86 PUBLISH | 16 |
| IB-EXT-036 What If You Left Tardigrades in Open Space? (FOTON-M3 2007, 10 days; vacuum alone no significant effect, UV killed many; tun −272 to +149 °C) | what-would-a-microscopic-wormhole-do… | **A / 78** | 85 REVIEW | 16 |

**Blocker, owner decision:** the builder refuses to write both records because Viral Quality v2 requires **20 hook
candidates** at research time (`config/viral-quality-v2.json` hooks.minimumCandidates). The hook generator has a fixed
set of families, and IB scenario records reach 15–17. For comparison, IB-HUM-050 has 15 and today's published topic
14; every researched IB record in batch-10 (13–17) would now fail this gate. The records were written into the universe here
with `researched.hookCandidateShortfall` marked `OWNER_DECISION_REQUIRED`; every other builder check passed.

If this branch is merged, the 30 October selector picks **IB-EXT-036** (EXPLORE, under-sampled EXTREME SCIENCE), and the buffer becomes 2. Both topics inherit
the placeholder's generator signals, as every researched IB topic does. Human review items: "Deep cold slows how much oxygen the body needs" (well-established physiology, but not one of the quoted facts) and the
tardigrade payoff line "space isn't the killer. Sunlight is." (an ESTIMATED CONSEQUENCE summary of the FOTON-M3 result).
