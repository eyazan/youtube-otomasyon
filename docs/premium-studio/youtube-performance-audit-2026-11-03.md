# YouTube performance and channel audit (live API, 2026-11-03)

Source: `scripts/growth/youtube-audit.js`, run in CI with each channel's own OAuth credentials (workflow
`variables-check.yml`, input `audit=1`, run 41693850450; raw JSON and tables on branch `review/youtube-audit-41693850450`).
Read-only: nothing was written to YouTube. Analytics are lifetime to 2026-11-02 (UTC); YouTube Analytics lags ~2 days,
so the three newest FR uploads show 0 there while their public counters already read 1–813 views (not a delivery fault).

## 1. Real performance baseline (latest 12 uploads per channel)

`rel@10%` is YouTube's `relativeRetentionPerformance` at 10 % of the video (≈ 3 s of a 30 s Short); 0.5 = typical for
videos of that length, below 0.5 = viewers leave the opening faster than on comparable Shorts.

| channel | Shorts measured | views | median views | median avg view | median % viewed | median rel@10% | median watch@50% | subs per 1k views | Shorts-feed share |
|---|---|---|---|---|---|---|---|---|---|
| ImpossibleBrief | 11 | 9,590 | 922 | 17 s | 59.9 % | **0.42** | 0.51 | 0.63 | 67–97 % |
| Failure Reconstructed | 9 | 3,498 | 259 | 14 s | 63.5 % | **0.41** | 0.55 | 0.86 | 51–97 % |
| GoalLore Lab | 0 public videos (channel renamed from CriticalThread; history deleted) | — | — | — | — | — | — | — | — |
| The Hidden Logic of Things | **not measurable**: OAuth refresh fails `INVALID_CLIENT` (HTTP 401); the warehouse also records "YouTube Analytics API has not been used in project 739767423116 or it is disabled" | | | | | | | | |

Channel totals (Data API): IB 13 subscribers / 18 videos / 14,439 views; FR 29 / 37 / 22,105; GLL 0 / 0 / 0.

### What the curves say

- **Weak hooks are the main loss, on both channels.** Median rel@10% is 0.42 (IB) and 0.41 (FR): in the first
  seconds our Shorts lose viewers faster than comparable Shorts. Median watch ratio falls by 0.49 (IB) and 0.38 (FR)
  between 5 % and 25 % of the video. The mid-video holds (watch@50% ≈ 0.5), so the problem is the opening, not the body.
- **IB, best vs worst opening:**
  - Best: "What If a CO2-saturated Lake Overturned Suddenly?" (rel@10% 0.54, 96 % viewed) and "What If ITER Reached Full
    Fusion Operation?" (0.53, 98 %): a concrete physical event with stakes.
  - Worst: "How Water Stays Liquid Below Freezing" (0.19, 39 %), "A Person Lived Past 120" (0.32, 52 %), "What If
    Mosquitoes Went Extinct" (0.36, 50 %): abstract or list-like, no single visible event.
- **FR, best vs worst opening:**
  - Best: "Neil Armstrong's Spacecraft Spun Out of Control" (0.51, 112 % viewed: replays) and "The Undersized Steel Plate
    That Dropped a Freeway" (0.47, 72 %): one physical failure you can picture.
  - Worst: "A Crack Smaller Than a Coin Dropped a Whole Bridge" (0.29, 46 %), "Why the Ajka Red Mud Reservoir Failed"
    (0.32), "A Silent Alarm Blacked Out 55 Million People" (0.35).
- **IB distribution collapsed with the topic starvation:** the last IB upload ("Why Earth's Core Is as Hot as the Sun",
  2026-10-29, 38 s) reached 6 views (4 from the Shorts feed); the 11 before it averaged ~870. Nothing has been published
  since. A 38 s Short is also above the channel's 18–42 s target centre; one data point is not a finding.
- **Subscriber conversion is low:** 0.6–0.9 subscribers per 1,000 views. Likes run 11–15 per 1,000 views.

### Implications (hypotheses to test, not conclusions: n ≈ 10 per channel)

1. **Frame 0 must show the event in motion.** The premium grammars already start on the mechanism, e.g. FR El Faro
   opens on a sea breaking over the ship (was a still wireframe), IB EAR-001 on the planet stopping. Compare rel@10% of the
   first 8 premium Shorts per channel against this baseline (0.42 / 0.41).
2. **Prefer concrete-event topics** (a lake erupts, a spacecraft spins, a plate fails) over abstract properties. The IB
   mechanism board (below) already ranks only topics whose drawing shows a physical event.
3. **Packaging:** the best titles name one object and one consequence. "How … Would Unfold" and "What Happens Next?"
   underperform. Keep the existing title-structure rotation; no retroactive title edits (no A/B infrastructure for
   Shorts titles, and churn on published videos is not reversible in reach).
4. **Subscriber conversion:** the loop ending (payoff returns to frame 0) is in every premium grammar. No spoken
   "subscribe" CTA: the channel rules make it optional, and it costs retention at the end.

## 2. Channel configuration (what the API holds today)

| setting | ImpossibleBrief | Failure Reconstructed | GoalLore Lab | Hidden Logic |
|---|---|---|---|---|
| channel default language | **not set** | **not set** | **not set** | unreadable (auth) |
| country | not set | not set | not set | — |
| channel keywords | **none** | **none** | **none** | — |
| banner | yes | yes | yes | — |
| trailer | none | none | none | — |
| description | accurate ("what if" science) | **says "using real archival footage"**: premium Shorts are animated reconstructions | **ends "PitchLore — Every Goal Has a Story."** (old name) | — |
| video category (API uploads) | 27 Education | 27 Education | (none yet) | — |
| video `defaultLanguage` / `defaultAudioLanguage` | en / **unset** | en / unset, except the 2 newest (en/en) | — | — |
| captions | English ASR on recent uploads; none on older ones | English ASR on recent uploads | — | — |
| made for kids | false (self-declared false) | false | — | — |
| synthetic-media flag | unset (illustrated animation; no realistic people or events, so not required) | unset | — | — |

**Fixed in code on this branch** (future uploads only; reversible by deleting the `upload` block in
`channels/<slug>/config.json`): every API upload now sends `categoryId`, `defaultLanguage: en` and
`defaultAudioLanguage: en` (GoalLore Lab → category 17 Sports). Studio's upload defaults do not apply to API uploads, so
this has to be in the request; it is verified in the uploader (`youtube-yukle.js` lines 235–237).

**Not changed through the API (owner decision, YouTube Studio):**

1. **Hidden Logic credentials:** re-create the OAuth client (or restore its secret) and re-run `youtube-yetki.js` for
   BTO; enable the YouTube Analytics API in GCP project 739767423116. Until then the channel can't be measured or
   uploaded to.
2. Settings → Channel → Basic info → **Language: English**, for all four channels; add 5–8 channel keywords.
3. **FR description:** replace "using real archival footage" with wording that covers both archival and animated
   reconstruction before the first premium FR Short goes out.
4. **GLL description:** replace "PitchLore — Every Goal Has a Story." with "GoalLore Lab — Every Goal Has a Story."
5. Customisation → Layout: a channel trailer (one of the strongest Shorts) and a Shorts shelf once there are ≥ 6
   premium Shorts.
6. Do not set the country to the US for reach: it does not change distribution.

We don't edit live channel copy through the API: it is the owner's brand voice, and `channels.update` overwrites the
whole branding block. That's why items 3–4 are listed for Studio, not done here.
