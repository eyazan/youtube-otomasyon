# IB-EAR-001 "What If Earth Stopped Spinning for One Second?": final review package

**Render to review:** run [41882899635](https://github.com/eyazan/youtube-otomasyon/actions/runs/41882899635), artifact `premium-IB-EAR-001`.

- 30.6 s, final 1080×1920, approved voice (Brian).
- Objective QA: **PASS**. One advisory WARN: loop continuity.
- Motion in the first 2 s: 0.40.
- Frames, contact sheet, QA report and the Creative Director report are on branch `review/render-41882899635-IB-EAR-001`.

**What blocks automatic publication** (`core/research/claim-sources.js`): `CLAIM_REVIEW_REQUIRED` and `CREATIVE_PASS_REQUIRED`.

## 1. HUMAN lines (no number to verify, so a person reads them)

| line | layer | text | assistant note (not a review) |
|---|---|---|---|
| L1 | SPECULATIVE SCENARIO | Earth stops spinning for one second. | Correctly labelled as a scenario. |
| L5 | ESTIMATED CONSEQUENCE | Sideways, only the ground can slow you down. | Inertia: friction with the ground is the only horizontal force. Sound. |
| L7 | ESTIMATED CONSEQUENCE | Only near the poles would the stop feel gentle. | Follows from cos(latitude) of the verified speeds (L3, L6). |

The numbered lines (465 m/s, 1,675 km/h, 9.8 m/s², 1,184 km/h at 45°) are VERIFIED against their sources by the claim ledger.

## 2. Your record

After watching the MP4, save this as `channels/impossible-brief/research/reviews/IB-EAR-001.json` with **your** name.
Set `verdict` to `PASS` only if you pass it.

```json
{
  "topicId": "IB-EAR-001",
  "factsHash": "7cb8511891652abf",
  "narration": { "reviewedBy": "<your name>", "at": "<ISO time>" },
  "creative": { "verdict": "PASS", "by": "<your name>", "at": "<ISO time>", "render": "41882899635" }
}
```

The `factsHash` binds the review to the current facts. Any later research change voids it.

IB-EAR-019 is the same procedure, with factsHash `3a7b71d0191e3207`, five HUMAN lines, and render
`review/render-41882899635-IB-EAR-019`.
