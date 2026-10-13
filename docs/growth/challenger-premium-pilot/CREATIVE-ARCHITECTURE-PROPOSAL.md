# Premium Shorts engine: creative audit and architecture proposal (2026-10-13)

**Analysis only.**
- Nothing was rendered, published or merged.
- No paid API was called.
- Challenger V2 (`a832a220…`) is unchanged. PR #255 stays a draft.

**Evidence for this audit:**
- the V2 MP4 sampled at 1 frame per second (two contact sheets);
- a measurement of every shot in the final MP4 (§1.1);
- the owner's visual review: "explanatory animations still resemble presentation slides".

---

## 1. Creative quality audit of Challenger V2

### 1.1 Measured: what makes it look like slides

**What was measured:**
- **Empty background:** the share of the frame (caption band excluded) that is flat, dark, bare background. It is computed on 6×6-pixel blocks at 270×480, with standard deviation < 2.5 and mean luma < 45.
- **Motion:** the mean frame-to-frame luma difference at 10 fps.
- **Motion on diagram shots (shared caveat):** they always show some, but most of it is the slow drift added to defeat freeze detection, not the subject changing.

| Shot | Time (s) | Kind | Empty background | Motion | What is on screen |
|---|---|---|---|---|---|
| S01 | 0.0–3.9 | archival | 28% | 5.9 | liftoff photo, ring on the smoke |
| S02 | 3.9–6.8 | explanatory | **68%** | 12.5 (cut + zoom) | flat clip-art stack, centred on black |
| S03 | 6.8–9.1 | document | **57%** | 4.8 | Fig. 14 as a white card on black |
| S04 | 9.1–12.7 | archival | 16% | 5.7 | icicles, "36°F" stat card on top |
| S05 | 12.7–14.9 | explanatory | **79%** | 1.5 | grey rectangles, an ellipse vs a circle |
| S06 | 14.9–20.6 | explanatory | 45% | 1.6 | flat grey joint with step titles |
| S07 | 20.6–23.4 | archival film | 42% | 2.1 | film in a square box |
| S08 | 23.4–26.2 | archival film | **76%** | 1.3 | tracking film in a square box over a void |
| S09 | 26.2–32.3 | reconstruction | **72%** | 1.1 | clip-art stack; the tank "fails" by turning grey |
| S10 | 32.3–33.7 | archival | 24% | 11.6 | breakup photo |
| S11 | 33.7–36.7 | archival | 43% | 6.2 | crew portrait as a band across the frame |
| S12 | 36.7–41.8 | document | **69%** | 1.9 | quote plus a two-bar chart |
| S13 | 41.8–46.8 | explanatory | **81%** | 1.5 | three-box flowchart |
| S14 | 46.8–48.7 | archival | 17% | 7.4 | recovered-segment photo |
| S15 | 48.7–51.7 | archival | 27% | 6.9 | payoff over the liftoff photo |

**What the numbers show:**
- **Diagram and explanatory shots** (S02, S05, S06, S09, S12, S13) make up 26.9 s, 52% of the runtime. Time-weighted, **68% of their frame is empty background**, and their motion is 1.1–1.9 (mostly drift).
- **Archival shots average 26% empty.**

So the "slide" feel is not a taste impression. Half the video is a small flat object centred on a dark void and barely moving. That is the signature of a presentation.

### 1.2 Findings by category

**Presentation-like animations**

- **S05 warm/cold (12.7 s).**
  - Two pairs of grey bars and an ellipse vs a circle. 79% of the frame is empty.
  - The only "animation" is a shape that does not change; the consequence is a one-line tag in about 26 px green and red text.
  - This is the weakest shot in the film.
- **S13 decision chain (41.8 s).**
  - A three-box flowchart ("ENGINEERS → THEIR MANAGERS → TOP NASA OFFICIALS") with an ✕. It is the visual grammar of an org chart.
  - 81% of the frame is empty, and the shot holds for 5 s.
- **S12 (36.7 s).**
  - A two-column bar chart with axis-style labels, under a serif quote.
  - The 53°F vs 36°F point is right, but a bar chart is the most "slide" form available for it.
- **S06 joint (14.9–20.6 s).**
  - The best explanatory shot: it has state changes, and gas dots advance on the word "blew".
  - But the step titles ("1 IGNITION FLEXES THE JOINT OPEN", "2 …", "3 …") are bullet points rendered as headers.
  - The steel is flat grey with no material, depth or light. The joint "flexes" by a few pixels, so the actual mechanism (rotation opening the gap) barely reads.

**Weak motion graphics**

- **S02 and S09 use flat clip-art stacks.**
  - The camera moves; the subject does not.
  - In S09 the flame is a small orange blob, and the tank's failure is shown by desaturating it. Nothing physically happens on screen during the one moment that most needs a cause and effect.
- **Most diagram motion is camera drift added only to pass freeze detection.** That technically defeats the freeze check, but it is not motion with a purpose.

**Static information cards**

- S04's "36°F / at launch — 15° colder than any launch before" is a stat card laid over the photo.
- S12 and S13 are cards; S03 is a document card on black.

**Visual hierarchy**

- Up to four text tiers compete in one frame:
  - the provenance chip;
  - a small-caps kicker ("THE NIGHT BEFORE · THIOKOL ENGINEERS");
  - a serif quote;
  - a sub-label ("quoted in the Rogers Commission Report…");
  - the bar labels;
  - plus the caption.

  The eye has no single entry point (S12, and S06's step header plus labels plus caption).
- S01 shows a headline ("Already leaking") and a caption ("Less than a second after liftoff,") at the same time, saying different words. Two reading tasks start at frame 0.
- Labels sit in small caps of roughly 24–28 px, the legibility floor. They pass QA but read as footnotes.

**Inconsistent archival and animation styling**

- Three different framings of archival material:
  - full bleed (S01, S04, S10, S14, S15);
  - a square inset over a void (S07, S08);
  - a horizontal band (S11).
- The diagrams use a third vocabulary again: vector clip art on a navy grid. Cuts between photo and diagram (S01→S02, S08→S09) jump between two visual worlds with no spatial link.
- The **same booster joint** appears four times (photo, clip art, Commission figure, cross-section) at four scales and positions, with no shared camera. The viewer must re-find it each time.

**Insufficient cinematic transitions**

- Almost every transition is a hard cut or a generic crossfade. None is *motivated*:
  - no match cut on the joint's position;
  - no push-in through the point of interest into the diagram;
  - no move that follows the cause (smoke → joint → seal → gap → flame → tank).
- The emotional beats (S10 breakup → S11 crew) use the same cut grammar as the data beats.

**Missed storytelling opportunities**

- **The causal chain is never shown as one connected object.** Each link is its own card. A persistent element (the joint itself, or the mission clock) could carry the viewer from cold to gap to flame to breakup.
- **Temperature is the cause, but it is never shown on the object.** 36°F appears as numbers on a photo and as a bar. It is never shown as cold acting on the rubber.
- **The flame-to-tank sequence (S09)** is the climax of the mechanism and the least animated shot in the film.
- **The night before (S12–S13)** is told with charts. The Commission's own exhibits are public domain and would make this part evidence-led rather than diagram-led:
  - the Thiokol recommendation charts;
  - the teleconference timeline.

### 1.3 What already works (keep)

- **Opening:** evidence first — a real NASA photo with the smoke located and timed.
- Provenance chips and "not to scale" labels, which carry the accuracy discipline.
- Mission-clock HUD over the E-207 tracking film (S07–S09).
- **Respectful pacing:** silence under the breakup and crew shots; the crew portrait is not animated.
- Word-anchored timing, and the loop back to frame 0.
- The automatic QA gates: text collision, edge, caption band, loop, loudness and freeze.

---

## 2. Visual language for Failure Reconstructed: "Forensic Reconstruction"

One idea drives everything: **the viewer is inside one investigation, looking at one object.** Archival media is the evidence. The diagrams are drawn *from* that evidence, in the same space, by the same camera.

### 2.1 Principles (each is checkable, see §6)

1. **One world, one camera.** Each film has a persistent scene space: the booster, the joint, the tank.
   - Archival frames are *registered* into that space, using hand-placed anchor points in the first version.
   - The diagram is a trace over the photo. The camera moves continuously from the photo into the cross-section.
   - The joint is never re-introduced at a new random position.
2. **Diagrams are drawn from evidence, not clip art.**
   - Line work is traced from the Commission figure or the NASA photo it explains, and labelled with that source.
   - Generic shapes appear only where no source drawing exists, and are then labelled "explanatory, not to scale".
3. **Show the cause acting on the object.**
   - Every mechanism shot must contain at least one *state change driven by narration*:
     - the joint rotates and the gap opens;
     - frost colour spreads into the O-ring and its recovery slows;
     - gas pushes past the seal;
     - the flame plume bends onto the tank;
     - the tank's strut lets go.
   - Camera drift is not a state change.
4. **Full-bleed composition.**
   - Every frame has a ground: an archival plate (dimmed or blurred), a source document, or the blueprint surface carrying the traced line work.
   - No small object floating on a void. Inset film is reframed to fill the 9:16 frame, or sits on its own expanded, blurred plate.
5. **Data lives on the object.**
   - 36°F is a thermal tint and a reading on the joint and the icicles.
   - 53°F vs 36°F is a single thermometer scale with the limit line, laid on the launch-morning photo.
   - Bar charts and flowcharts are not used.
6. **Documents as evidence, not boxes.**
   - The night before is told with the public-domain Commission exhibits (the Thiokol chart, the teleconference timeline): the camera moves across the real page and the key line is highlighted.
   - The "never reached the top officials" finding is shown as the Commission's own sentence, not as three boxes and an ✕.
7. **Purposeful transitions only.** A fixed grammar, each with a declared reason in the shot plan:

   | Transition | Use |
   |---|---|
   | match cut on position | same object, new representation (photo → traced cross-section) |
   | push-in through the point of interest | going inside (joint → seal) |
   | follow the cause | the camera travels along the flame path or the timeline |
   | hard cut | shock (breakup) |
   | dip to near-black | loss (crew) |
   | return to frame 0 | the loop |

   Generic crossfades are not used.
8. **Three type tiers, no more.**

   | Tier | Style | Use |
   |---|---|---|
   | Display | condensed sans, ≥ 72 px | one per shot, at most 4 words |
   | Label | ≥ 32 px, tracked caps | at most 3 per frame, always attached to what they name by a leader line |
   | Caption | existing | — |

   - Serif is reserved for verbatim source quotes.
   - Provenance chips are a fixed system element outside the hierarchy.
   - A headline and a caption never show different sentences at the same moment.
9. **Restraint.** Banned:
   - fake camera shake, glitches, lens flares, light leaks, fake film grain on non-film media;
   - AI-generated "archival-looking" imagery;
   - animating the crew portrait;
   - sensational fire.

   Reconstructions keep their label for the whole shot.

### 2.2 What Challenger would look like under this language (no render made)

| Beat | V2 | Proposed |
|---|---|---|
| 0–4 s | photo plus a ring | same photo. The push-in to the smoke continues into S02, where the photo's booster becomes traced line work in the same position (match cut). |
| 7–9 s | Fig. 14 card | the camera arrives at the joint. Fig. 14 is registered over the traced booster and fills the frame, so the O-rings are found where the viewer is already looking. |
| 9–15 s | 36°F card; grey bars | icicles plate; the frost tint flows from the photo into the O-ring cross-section. A side-by-side compression test shows the warm ring recovering and the cold ring lagging, timed to "springs back slowly". |
| 15–21 s | stepped slide | the joint rotates visibly (exaggerated, labelled not to scale); the gap opens as gas advances; steps shown as single words attached to the action. |
| 23–32 s | film box; grey tank | full-frame reframed E-207 with the clock; match on the flame into the traced stack. The plume bends onto the tank, the lower strut lets go, the clock runs to T+73. |
| 33–37 s | breakup; crew band | hard cut to the breakup; dip to near-black; crew portrait full width, still, in silence. |
| 37–47 s | bar chart; flowchart | the camera moves across the Thiokol chart with "below 53°F" highlighted, then one thermometer: limit 53°F, launch 36°F. The Commission's sentence about the top officials, typeset and highlighted. |
| 47–52 s | headline on photo | unchanged in idea; the payoff resolves on the frame-0 photo. |

---

## 3. Automation feasibility

**Classes:** A = fully automatable; B = automatable with an automatic quality gate (plus sampling); C = needs human approval.

Times are estimates for a 35–55 s Short on the current Mac, except the measured render (415 s for 1551 frames at 1080×1920). The current per-video cost is **$0**: free Edge TTS, Wikimedia/NASA public domain, local rendering.

| # | Step | Class | Machine time | Human time | Dependencies | Cost / video | Main quality risk |
|---|---|---|---|---|---|---|---|
| 1 | Topic selection | C | — | 5 min | existing topic queues | $0 | sensitive topics; repetition |
| 2 | Evidence extraction (claim → passage → URL) | B | 2–5 min | 10 min spot check | primary sources online | $0, or about $0.05–0.30 with an approval-gated LLM | misread numbers or times; fail closed when a line has no passage |
| 3 | Script and hook | B → C | 1–3 min | 10 min | LLM optional (approval-gated) | $0–0.30 | unsupported claim; tone around loss of life |
| 4 | Source search and licence check | A (licence), B (relevance) | 2–5 min | — | Commons/NASA APIs (rate-limited, 429 seen) | $0 | wrong or misleading caption; artist's concepts presented as photos |
| 5 | **Anchor registration** (where the joint is in each asset) | C at first, B later | — | 5–15 min per film | none | $0 | wrong anchor = a false visual claim; the biggest manual step |
| 6 | Shot plan (line → shot type → assets → transition) | B | < 1 min | review in step 11 | grammar + style pack | $0 | dull or repetitive plans; semantic mismatch |
| 7 | Mechanism animation from templates | B | in render | — | template library (to build) | $0 | a template that does not fit the topic → fall back to a labelled simple diagram |
| 8 | Narration (Edge; Kokoro unapproved) | A + speech check | 1–2 min | listening sample | Edge free endpoint (403-throttled) | $0 | throttling; mispronunciation; never ship silent audio |
| 9 | Sound design and mix | A | < 1 min | — | none | $0 | artificial cues |
| 10 | Render | A | about 7 min for 52 s (measured) | — | Chromium, ffmpeg | $0 | — |
| 11 | Final QA gates (existing plus §6) | A | 1–2 min | — | — | $0 | gates pass a dull film; they cannot judge taste |
| 12 | Bounded repair (≤ 2, one failed check each) | A | 0–15 min | — | — | $0 | a creative fault cannot be auto-fixed; stop and report |
| 13 | Creative and accuracy approval | **C** | — | 10–20 min | — | $0 | owner fatigue → rubber-stamping |
| 14 | Publish | **C** (unchanged gate) | — | — | existing workflow | $0 | out of scope here |

**Per video, once phases 1–4 of the roadmap exist (estimate):**
- about 20–35 min of machine time and 30–60 min of human time (steps 1, 3, 5 and 13);
- **$0** at the default settings, or **under $0.50** if LLM drafting is approved;
- **today:** multiple working sessions per topic, hand-composed.

**Main risks:**
1. Anchor registration cannot yet be automated reliably. Bound it with hand-placed anchors (minutes, not hours) and reuse them.
2. Templates make every film look the same. Mitigate with per-channel grammars, several variants per template, and a repetition check across the last N videos.
3. Accuracy drift in automated diagrams. Every diagram parameter that implies a fact (temperature, time, sequence) must cite an evidence id, as script lines already do.
4. Edge throttling and the lack of an approved voice.
5. Gates measure legibility and motion, not quality. Human approval stays until the gates are calibrated against owner scores and audience data.

---

## 4. Multi-channel architecture

**Share the engine and the grammar machinery, not the look.** There are three layers, and only the first is common.

| Layer | Shared? | Contents |
|---|---|---|
| **1. Engine** | shared | deterministic renderer (Chromium → ffmpeg), virtual camera and scene space, word timeline, captions, sound mixer, all QA gates, bounded repair, provenance manifest, licence gate, cost budget |
| **2. Shot grammar** | shared *format*, per-channel *content* | a typed shot plan (`plate`, `register`, `trace`, `mechanism`, `document`, `measure-on-object`, `timeline`, `system-map`, `simulation`…). Each channel declares which shot types it may use, their transitions and its narrative beats. |
| **3. Channel pack** | per channel | style tokens (palette, type, motion curves, texture), template drawings, provenance vocabulary, narrative format, sound palette, channel-specific QA thresholds |

| | Failure Reconstructed | ImpossibleBrief | CriticalThread |
|---|---|---|---|
| Narrative format | incident → evidence → mechanism → failure chain → human cost → lesson | impossible question → scale → physics → answer → twist | everyday object → hidden system → why it is hard → what fails if it goes |
| Ground | archival plates, Commission documents | official science media (NASA/ESA), sky, simulation space | regulator and manufacturer material, industrial plates |
| Signature shot types | `register` + `trace` (photo → cross-section), forensic `document`, timeline clock | `simulation` (procedural, labelled ILLUSTRATION), `scale` (powers-of-ten zoom), `measure-on-object` | `system-map` (network graph of dependencies), `cutaway` (object → internals), `chokepoint` |
| Motion character | slow, investigative push-ins; held evidence; hard cut for shock | smooth, wide, scale-revealing moves; long eases | precise, mechanical, linear moves; snap to nodes |
| Palette / type | `#10151b`, steel `#d9e2e8`, amber `#d88736` (existing brand) | `#030712`, cyan `#25d9ff`, warm `#ffb45a` (existing brand) | graphite `#141922`, silver, gold `#d6ae5f`, warning `#e05d44` (existing brand) |
| Provenance labels | NASA photo · Commission record · reconstruction | ILLUSTRATION · simulation · NASA image | TECHNICAL ILLUSTRATION · regulator document |
| Banned | AI imagery, gore, animated victims | neon overload, childish graphics (from `brand.json`) | unlabelled illustration presented as evidence |

**How sameness is prevented:**
- A channel pack may not import another pack's templates.
- Each channel must use at least two signature shot types that no other channel has.
- A cross-channel similarity check compares frame-level palette and layout statistics of the last N renders per channel, and fails if two channels converge.

---

## 5. Implementation roadmap

Phases are ordered by creative gain per unit of work. Each has an exit criterion. Nothing here touches production workflows or schedules; the live test (phase 6) needs explicit owner approval.

| Phase | Work | Exit criterion |
|---|---|---|
| **0. Bar and gates** (1–2 days) | Add §6's measurable checks (empty background, state changes, inset void, type tiers, transition reasons) to `qa-vertical.js` / `text-qa.js` as WARN-only. Baseline them on V2. Agree on an owner scoring rubric. | V2 baseline recorded; rubric agreed |
| **1. Fix the weakest shots on Challenger** (3–5 days) | Scene-only renders (`--from/--to`, not a full film) of: (a) the S01→S02→S03 registered match cut; (b) S05 frost and compression; (c) S09 plume and strut; (d) S12–S13 as document plus thermometer. | each rebuilt shot meets §6; owner scores ≥ 4/5 against V2 on the same shot |
| **2. Scene space, camera and shot grammar** (1–2 weeks) | Persistent scene space, registered anchors, continuous camera, transition grammar. Rewrite Challenger's `scenes.js` as a data shot plan with no free-form SVG in the topic. | Challenger re-expressed as data; a full V3 render (one, justified) passes all gates |
| **3. FR template library** (1–2 weeks) | Parameterised seal/joint, flow path, structural load path, failure timeline, document reveal, measure-on-object. Each fact-implying parameter cites evidence. | 2 new FR topics planned from data with ≤ 1 new hand drawing each |
| **4. Planner and bounded pipeline, offline** (2 weeks) | evidence → script checks → asset search + licence gate → shot plan → render → QA → ≤ 2 repairs → report. Human gates at topic, script, anchors and final approval. | 3 FR topics produced offline; human time ≤ 60 min each, measured |
| **5. IB and CT packs** (1–2 weeks each) | Channel grammar, signature templates and style tokens. One offline pilot each. | each pilot passes the gates; the cross-channel similarity check passes; owner approval |
| **6. Controlled live test** (approval required) | `core/growth/experiments.js`: premium vs current, then long vs short, 5+ per arm, 21:00 schedule unchanged | decide on audience metrics only |

The largest quality jump is phase 1 plus phase 2: fixing the 52% of runtime that currently reads as slides. Phases 3–5 are what make that jump repeatable.

---

## 6. Acceptance criteria (measurable)

The existing hard gates stay as they are: decode, black, freeze, loudness and peak, A/V, captions, text collision/edge/UI, and loop. The new creative gates below are measured from the final MP4 or the render inspection.

They start as WARN (phase 0) and become FAIL only after calibration against owner scores on at least 5 films. **Thresholds are fixed before inspection and never tuned per film.**

| Criterion | Measure | Target | Challenger V2 |
|---|---|---|---|
| No floating objects | empty-background share per shot (§1.1 method) | ≤ 35% every shot; time-weighted ≤ 30% | diagram shots 68%; worst 81% (S13) |
| Mechanism shots show causation | narration-anchored state changes per explanatory shot (from the shot plan, verified by a content-diff that excludes the camera transform) | ≥ 1 per 2 s of shot; ≥ 2 per shot | S05: 0; S09: about 1 |
| Purposeful motion | content motion excluding camera drift | > 0 in every explanatory shot | drift dominates S05, S09, S12, S13 |
| Archival framing consistent | inset void share (empty area around film or photo) | ≤ 25% | S08: 76% |
| Visual continuity | mechanism shots that open or close on a registered match with archival media | ≥ 70% | 0% |
| Transition grammar | every transition declares a reason from the §2.1 set | 100%; 0 generic crossfades | not declared |
| Type hierarchy | distinct non-caption text sizes per frame; labels ≥ 32 px; non-caption words on screen | ≤ 3 tiers; ≤ 3 labels; ≤ 8 words | up to 4 tiers; labels about 24–28 px |
| Single reading task | frames where a headline and a caption show different sentences | 0 outside the payoff | S01 (0–4 s) |
| No chart/slide primitives in FR | bar charts, box flowcharts, bullet step titles in the shot plan | 0 | 3 (S06 steps, S12 bars, S13 boxes) |
| Accuracy | every fact-implying diagram parameter and label cites an evidence id; every reconstruction keeps its label | 100% | labels 100%; parameters not yet linked |
| Repetition | similarity of the shot-type sequence vs the channel's last 10 films; cross-channel palette and layout similarity | below a calibrated limit | n/a |
| Human creative score | owner rubric 1–5 on: hook, clarity of mechanism, visual quality, continuity, respect, accuracy | mean ≥ 4, none < 3 | not yet scored |

Audience metrics (engaged views, % viewed, average view duration) remain the final judge. They come only from the phase 6 test, never from these gates.
