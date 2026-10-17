# Premium Shorts automation architecture: data-driven shot planner (design, 2026-10-13)

**Goal:** the second premium Failure Reconstructed video is produced from **data** (evidence, script, shot plan) through **parameterised templates**, not hand-written shot code.

**Design only:**
- No implementation, render, deployment or paid service.
- Production stays gated by the existing publishing gates and voice approvals.

## 1. Layers and what each one owns

| Layer | Owns | Written by | Lives in |
|---|---|---|---|
| **1. Rendering engine** (reusable) | `render-vertical.js`, `fr-lib.js` (camera crops, media pool, captions, chips, crossfades, text inspection), `fr-forensic.js` primitives, audio (`narrate-*`, `mix-audio.js`, `sound_design.py`), QA (`qa-vertical.js`, `text-qa.js`, `creative_qa.py`) | engineers, once | `scripts/fr-premium/` |
| **2. Template registry** (reusable, parameterised) | shot types with a JSON-schema'd parameter block, emitted states and QA expectations: `archival-plate`, `trace-over-photo`, `joint-section`, `event-sequence`, `document-desk`, `timeline-stamp`, `measure-scale`, `portrait-hold`, `payoff`, `film-plate` | engineers, per mechanism family | `scripts/fr-premium/templates/<type>.js` + `<type>.schema.json` |
| **3. Topic evidence** (per topic) | claims → passage → URL; event tables; quotes; dimensions; assets with licence and **anchors** (points measured in source pixels) | research step + human confirmation | `channels/<ch>/premium/<topic>/evidence.json`, `assets.json` |
| **4. Scene parameters** (per topic) | the **shot plan**: per narration beat → template + parameters that reference evidence ids, asset anchors and word anchors; transitions from the grammar | planner (rules, optional LLM draft) + validator | `…/<topic>/shot-plan.json` |
| **5. Human approval** | topic, claims, script, anchors, storyboard stills, final video, voice | owner | `…/<topic>/approvals.json` (who, when, what hash) |

**Rule:** a value that makes a factual claim (time, temperature, dimension, quote, position in a photo) may only appear in layer 3. Layer 4 references it by id. The validator fails the plan otherwise.

## 2. Shot-plan format (layer 4)

Every V3 shot can be expressed this way. Two examples, written from the existing Challenger data:

```json
{
  "schema": "fr-premium.shot-plan.v1",
  "topic": "challenger-1986",
  "style": "failure-reconstructed/forensic-v1",
  "narration": "v1/timeline-edge-andrew.json",
  "shots": [
    { "id": "S05", "beat": "L4", "start": "line:L4-0.1", "end": "line:L5-0.1",
      "template": "joint-section",
      "params": { "geometry": "asset:fig14#trace", "scale": { "mode": "declared-exaggeration", "gapFactor": 8 },
                  "rings": [ { "temperature": "claim:C-O-ring-temp-28F" }, { "temperature": "claim:C-test-75F" } ],
                  "gap": { "profile": "claim:C-gap-opening-600ms" }, "gas": { "startAt": "word:L4:slowly" } },
      "transition": { "type": "follow-cause", "reason": "frost from the launch-tower photo into the cold ring" },
      "provenance": "explanatory" },
    { "id": "S12", "beat": "L10", "start": "line:L10-0.1", "end": "line:L11-0.1",
      "template": "document-desk",
      "params": { "pages": [ { "asset": "asset:thiokol-chart-p90", "highlights": [
                    { "region": "asset:thiokol-chart-p90#line-53F", "from": "word:L10:recommended", "to": "word:L10:below" },
                    { "region": "asset:thiokol-chart-p90#value-53F", "at": "word:L10:fifty-three" } ] } ],
                  "camera": "read-along", "stamp": "claim:C-telecon-2045EST" },
      "transition": { "type": "dip", "reason": "after the crew portrait" },
      "provenance": "document" }
  ]
}
```

- **Times** are word or line anchors resolved against the narration timeline. The plan re-times itself to any narration of the same script; this is already how `scenes.js` works, but there it lives in code.
- **`claim:` and `asset:…#anchor`** must resolve in layer 3, and every claim needs a source passage.
- **Templates declare** their parameter schema, the states they emit, and any QA expectation (for example "states ≥ 2", "registered").

## 3. The planner (layer 4 producer)

| Step | Automatic | Human |
|---|---|---|
| 1. Beat typing | each script line is tagged with a beat type: hook, setting, mechanism, event-sequence, human-cost, decision/document, payoff (rules on claim types; optional LLM suggestion, approval-gated if paid) | — |
| 2. Template choice | beat type → candidate templates from the channel grammar (FR: mechanism → `joint-section` / `trace-over-photo`; event-sequence → `event-sequence`; decision → `document-desk`; human-cost → `portrait-hold`) | — |
| 3. Asset match | claims → assets that show them (caption semantics + licence gate, fail closed); anchors required by the template are looked up | **confirm anchors** (UI shows suggested points; about 5 min per asset) |
| 4. Parameter fill | from claims (times, values, quotes) and anchors | — |
| 5. Validation | schema; every factual parameter references a claim; transitions in the grammar; ≤ 3 text tiers; no slide primitives; durations ≥ the template minimum | — |
| 6. Storyboard | renders **stills only** (3 per shot) + text inspection + creative QA estimates | **approve the storyboard** |
| 7. Render and QA | full render once; all hard gates; creative QA WARN; at most 2 bounded repairs, each tied to one failed check | **final approval** (+ voice approval as today) |

## 4. Second topic: what is reused and what is new

**Candidate (not chosen; owner decision):** Hyatt Regency walkway collapse, Kansas City, 1981.
- **Evidence base:** the US National Bureau of Standards investigation report. It is a US Government work; its licence must be confirmed per figure.
- **Licensing risk:** news photographs of the collapse are typically copyrighted, so the visual evidence would lean on the report's own figures and photographs. This is a licensing risk to check *before* choosing the topic.
- **Status:** no facts from that report are asserted here. Claims must be extracted and cited first.

| Need | Status |
|---|---|
| Archival plates, document desk, timeline stamp, measure scale, portrait-hold policy, payoff | **reuse as is** |
| Trace-over-photo (connection detail traced on a report photo) | **reuse** (`X.trace` + camera hand-off) |
| Mechanism: load path through a hanger-rod / box-beam connection | **new template variant** of the engineering family (load arrows, declared deformation scale), built on the same material, light and label system as `joint-section` |
| Event-sequence (collapse sequence) | reuse `event-sequence` **only** if the report documents a sequence; otherwise omit (no invented timeline) |
| Evidence extraction, licence checks, anchors | per topic (layer 3) |

## 5. Human effort for the second premium video

| Task | Today (hand-written shots) | With planner + templates |
|---|---|---|
| Research and claim extraction | 4–6 h | 2–3 h (assisted; human verifies passages) |
| Script | 1–2 h | 1 h |
| Assets, licences, anchors | 2–3 h | about 45 min (confirm suggestions) |
| Shots | 8–12 h of code | about 30 min (review and adjust the plan) |
| Storyboard and final review | 1–2 h | 1 h |
| **Total** | **about 2–3 working days** | **about 5–6 h** |

Machine time per video: about 7 min render + about 3 min QA + storyboard stills (about 1 min). Cost $0 by default.

## 6. Implementation effort and order

| # | Work | Estimate | Exit criterion |
|---|---|---|---|
| 1 | Evidence and asset schemas (claims, passages, licences, anchors) + validator | 3 days | Challenger evidence migrated; validator fails on an unsourced value |
| 2 | Template registry: wrap the existing shots and forensic primitives as schema'd templates | 4–5 days | V3's shots expressed as `shot-plan.json`; the stills match V3 byte-for-byte |
| 3 | Shot-plan resolver + renderer integration (word anchors, claims, assets) | 3 days | V3 renders from the plan alone (scene stills only, no full render needed) |
| 4 | Engineering visual system + `joint-section` (`ENGINEERING-VISUAL-SYSTEM.md`) | 2–2.5 weeks | B and S06 prototypes approved at phone size |
| 5 | Planner rules (beat typing, template choice, asset matching) + anchor-confirm UI | 1–1.5 weeks | a draft plan for topic 2 needs ≤ 30 min of edits |
| 6 | Storyboard-stills gate and approvals record | 2 days | approvals stored with hashes |
| 7 | Second topic offline (evidence → video) | 1 week, including its new mechanism template | human effort ≤ 6 h measured |
| | **Total** | **about 6–8 weeks**, items 4 and 5 in parallel with 1–3 | |

**Not part of this:**
- the publishing workflow;
- schedules (21:00 Europe/Istanbul unchanged);
- voice approval;
- any live test.

Those keep their existing gates.
