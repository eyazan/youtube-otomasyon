# FR + IB long-form monetization pilot (2026-10-08)

## Scope and safety
- Prioritize **Failure Reconstructed** (FR) and **ImpossibleBrief** (IB). Do not change the other channels, their credentials, states, queues, cadence or learning.
- Keep daily Shorts enabled under existing quality rules.
- **No production upload, publishing-flag changes, secret changes, or public video changes in this pilot PR.** Run dry-run and review final MP4/thumbnail before intentionally enabling any publishing.
- Do not claim YouTube monetization thresholds are static: verify current rules in YouTube Studio > Earn at launch and per channel.
- Prioritize original educational storytelling with citations and properly licensed/labelled visuals. No reused stock montages, unlabelled realistic simulations, recycled Shorts filler, fake engagement or clickbait.

## Pilot A: Failure Reconstructed
- Topic *candidate*, not approved: Tacoma Narrows Bridge collapse. Check existing published inventory for duplicates and channel analytics for stronger alternatives.
- Length target 10–14 minutes, **never pad unsupported material**.
- Core viewer promise: demonstrate how the oscillations developed, what investigators established and what commonly repeated explanations oversimplify.
- 0:00–0:20: archival cold open, clear consequence + unresolved question; no channel intro.
- 0:20–1:00: stakes, credible promise of the mechanism.
- Next: evidence, sequence, visualization of forces, engineering explanation, consequences and lessons.
- Human review: archival licence, physical explanation and wording; do not conflate simple resonance and aeroelastic flutter.

## Pilot B: ImpossibleBrief
- Topic *candidate*, not approved: 'What if Earth stopped spinning for five seconds?' Check existing inventory and rank against recent IB audience performance.
- Length target 8–12 minutes, contingent on enough sourced depth.
- Explain assumption explicitly (surface, atmosphere, oceans and angular momentum); distinguish instantaneous stop from gradual slowing.
- Show scenario branches and uncertainty; present quantitative estimates only when independently sourced or reproduced with declared assumptions.
- Use diagrams/physics simulations labelled clearly, not cinematic visuals misrepresented as observations.

## Required preflight (per channel)
1. Collect last 28 days from YouTube Studio: subscribers gained, engaged Shorts views, stayed-to-watch, average view percentage, long video impressions/CTR, watch time, average view duration. Mark missing fields `NOT_COLLECTED`; do not substitute public view counts.
2. Check channel OAuth, topic inventory, primary citations, original footage availability, content licence and duplicate uploads.
3. Run `node growth.js longform --channel failure-reconstructed --dry-run` and the same for `impossible-brief`.
4. Inspect `channels/<slug>/state/longform/packages/*.json`, especially `COPY_RISK`, `INSUFFICIENT_DEPTH`, citation-to-claim mapping, accurate thumbnail and visual provenance. `QUALITY_BLOCKED` is a valid outcome, not an override.
5. Render only in isolated non-publishing test context with the existing renderer; watch **the complete** video with headphones; check script, natural narration, pronunciation, footage-to-claim match, captions, text safe area, sound levels, chapter rhythm, source credits.
6. Obtain editorial signoff per candidate. A successful dry run does not imply render or publication.

## Release gates
- Longform package: existing PUBLISH-level score (>=85) and **no hard fails**; no lowering existing gates.
- First 20 seconds clearly give stakes and a specific open question without lying.
- First 60 seconds deliver new evidence/context, not logo, generic set-up or filler.
- At least one distinct factual or visual payoff per section; no fixed cut frequency mandate.
- Every numeric assertion and major claim traceable to evidence; at least one primary or authoritative source and two total independent sources as required by existing pipeline.
- Thumbnail truthful at mobile size, concept legible with <=4 words; title evidence-backed.
- AI simulations labelled; commercially usable media licences recorded; narration and visuals have material original commentary.
- Final quality approval is **human**, not a synthetic score.

## Distribution
- Release one approved long-form video on each channel first, separately (no batch launch).
- Build 3–5 **standalone** Shorts from each documentary, each resolving its own question and naturally presenting an additional unanswered related question; do not post duplicate clips.
- Add a same-channel Shorts Related Video manually in YouTube Studio after long video publication; follow existing `RELATED_VIDEO_MANUAL_ACTION_REQUIRED` tasks.
- Add same-channel end screen and playlist for long-form; do not cross-link unrelated channels.
- Titles/thumbnails should express one clear specific promise, not chase arbitrary viral keywords.
- Only enable `longform.render.enabled` plus `FR_LONGFORM_PUBLISH=1` or `IB_LONGFORM_PUBLISH=1` after dry-run, review and explicit release approval. Leave all flags unchanged in this PR.

## Measurement and decisions
Capture per channel and content type at 24 h, 72 h, 7 d and 28 d:
- Long-form: impressions, CTR, 30-second retention, average view duration, average percentage viewed, watch hours, new subscribers, returning viewers where Studio exposes them.
- Shorts: shown in feed, stayed-to-watch, engaged views, average percentage viewed, subscriptions/1k engaged views, long-form referral evidence.
- Record traffic source, country mix, organic vs paid, and video age; compare *within* a channel and format.
- Diagnose weak impressions separately from low CTR or weak retention. Avoid causal claims from tiny samples or unadjusted comparisons.
- Initial working hypothesis: >=50% average percentage viewed for 10–12-min long-form and positive subscriber conversion. **Not a publish gate** until a real channel baseline exists.
- After one pilot each, perform postmortem; after 3–4 uploads per channel, decide whether weekly long-form is sustainable. Cadence must not trump quality.

## Checklist
- [ ] Studio baseline collected for FR and IB
- [ ] Source-backed, unused pilot topics selected from own channel inventory
- [ ] FR dry-run and hard-fail audit
- [ ] IB dry-run and hard-fail audit
- [ ] Two complete private renders reviewed by a human
- [ ] Both thumbnails and metadata verified
- [ ] First controlled release, then related Shorts and links
- [ ] 7-day results reviewed before increasing production cadence

## Rollback
Keep publishing flags off until approved. If any production issue appears after release, disable only the affected channel's long-form publishing variable; retain its existing Shorts pipeline. Never delete/reupload weak videos to reset distribution.
