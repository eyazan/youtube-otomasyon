# ImpossibleBrief: What If Earth Stopped Spinning for One Second? (IB-EAR-001)

**Final MP4:** run 41904421963, artifact `premium-IB-EAR-001`. The whole MP4 at 2 fps is on branch
`review/render-41904421963-IB-EAR-001`, under `full/`.

## Title
What One Second Without Earth's Spin Would Do

## Description
```
If Earth stopped spinning for just one second, why would the stop matter more than its length?

Sources:
- Wikipedia — Earth's rotation: https://en.wikipedia.org/wiki/Earth%27s_rotation
- Wikipedia — Gravity of Earth: https://en.wikipedia.org/wiki/Gravity_of_Earth

Original animation; no broadcast footage. Narration: synthetic voice (Microsoft Edge neural TTS). Claims are mapped to the sources above.

#shorts #science #EarthsRotation #earthscience #whatif
```

## The three narration lines that need your review (HUMAN: no number to check against a source)
| line | label on screen | text | why it holds (assistant note, not a review) |
|---|---|---|---|
| **L1** | SPECULATIVE | Earth stops spinning for one second. | The premise. It is labelled as a scenario. |
| **L5** | ESTIMATE | Sideways, only the ground can slow you down. | Inertia: the only horizontal force on you is friction with the ground. |
| **L7** | ESTIMATE | Only near the poles would the stop feel gentle. | Surface speed scales with cos(latitude) and is zero at the pole. The scene shows "ZERO AT THE POLE". |

The numbered lines are VERIFIED by the claim ledger:
- L2: 465 m/s.
- L3: 1,675 km/h.
- L4: 9.8 m/s².
- L6: 1,184 km/h at 45°.

On screen, the labels show 1,674.7 km/h and 1,184.2 km/h.

## Technical QA
Hard checks: PASS (30.6 s). Motion in the first 2 s: 0.40. Loop continuity: WARN (advisory).

## Creative findings (assistant, not a verdict)
- The opening shows the globe with its surface-speed arrows, "ONE SECOND".
- The person keeps moving at 465 m/s while the ground stops. Gravity is drawn as a separate vertical arrow.
- 45° and the pole are shown on the globe.
- The ending (the pole view) returns to the globe, so the loop is coherent.

## Exact approval required
Policy: the signed IB policy (2026-10-29). Publication is held by `CLAIM_REVIEW_REQUIRED` and `CREATIVE_PASS_REQUIRED`.

After watching, save `channels/impossible-brief/research/reviews/IB-EAR-001.json` with **your** name:
```json
{
  "topicId": "IB-EAR-001",
  "factsHash": "7cb8511891652abf",
  "narration": { "reviewedBy": "<your name>", "at": "<ISO time>" },
  "creative": { "verdict": "PASS", "by": "<your name>", "at": "<ISO time>", "render": "41904421963" }
}
```
- `narration` records your review of L1, L5 and L7.
- `creative` records your verdict. Write `PASS` only if you pass it.
- `factsHash` binds the review to the current facts. Any research change voids it.
