# Daily premium production: automation design

**Principle:** automation may only *move work forward through gates*; it never lowers a gate.

**Status:**
- IMPLEMENTED: the lifecycle module (`scripts/bto-studio/lifecycle.js`) and its tests.
- DESIGN: everything else here. No schedule or workflow was added. Live publishing is unchanged.

## Lifecycle (IMPLEMENTED: `lifecycle.js`)

```
TOPIC_READY → SCRIPT_READY → VISUAL_READY → RENDERED → QA_PASSED → PUBLISH_APPROVED → SCHEDULED → PUBLISHED
```

Rules:
- States advance one at a time.
- Moving back needs `reopen(video, state, reason)`.
- Every blocked move records its reasons.

| Enter | Guard (any failure blocks) |
|---|---|
| TOPIC_READY | research VERIFIED; productionReady; every fact has a verbatim quote + URL ("evidence is weak" otherwise); not already published |
| SCRIPT_READY | narration lines exist; traceable to the topic (sourceHash) |
| VISUAL_READY | storyboard validated; **not an undirected auto-draft**; no unresolved copyright items |
| RENDERED | video exists; narration passes the speech check (**no placeholder audio**) |
| QA_PASSED | objective QA pass; audio safety measured (an UNVERIFIED clip count needs a measured sample-peak substitute); **creative sign-off {by, at}** |
| PUBLISH_APPROVED | **approved channel voice** (preview voices never pass); factual sign-off; **human publish approval {by, at}**; channel publishing enabled |
| SCHEDULED | publish time; private + scheduled upload |
| PUBLISHED | uploaded video id |

## Daily loop per channel (DESIGN)

Each channel has its own queue file, e.g. `channels/<c>/state/premium-queue.json`. It is created only when that channel's rollout stage is approved.

| Time (local) | Job | Advances |
|---|---|---|
| 02:00 | research refill: promote IDEA → RESEARCHED → VERIFIED with the quote verifier | topic inventory (not videos) |
| 03:00 | readiness: pick VERIFIED topics into TOPIC_READY/SCRIPT_READY until 10 are waiting | TOPIC_READY, SCRIPT_READY |
| 04:00 | storyboard drafts (deterministic, or a budgeted Claude draft); they wait for direction | none (drafts cannot pass VISUAL_READY) |
| on direction | render preview + QA on the M1 runner | VISUAL_READY → RENDERED → QA objective |
| human | creative + factual review in the review package | QA_PASSED |
| on approval | approved-voice re-narration (if preview voice) → final render → package | PUBLISH_APPROVED (human) |
| channel slot | existing uploader: private + scheduled, existing gates | SCHEDULED → PUBLISHED |
| +1h/6h/24h/48h/7d | existing analytics checkpoints, tagged with storyboard version and components | feedback |

**Buffer target: ≥ 7 days approved per active channel.** `lifecycle.bufferDays(videos)` counts PUBLISH_APPROVED + SCHEDULED. Below 3 days the channel publishes nothing new and alerts; it never fills the gap with lower-quality video.

## Where automation is forbidden

Automation must never:
- promote a topic without verified quotes;
- render with a placeholder or unapproved voice for publishing;
- pass QA with hard failures, or count UNVERIFIED as PASS;
- self-approve creative, factual or publish sign-offs;
- publish to a channel whose `publishingEnabled` is false (GoalLore Lab, BTO today);
- change live schedules for FR, IB or CriticalThread.

## Research and growth heuristics (DESIGN; GoalLore Lab's generator is the first instance)

Explainable scores per topic, with no fake precision:
- audience appeal
- curiosity
- source strength
- originality (no duplicate within the channel's similarity family)
- animation suitability
- shorts suitability
- long-form potential
- copyright risk
- production cost

Analytics feedback may **re-rank** topics within a channel. It never overrides an evidence or copyright gate.
