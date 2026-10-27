# Existing videos — migration plan

Generated 2026-10-26 by `node existing-video-optimizer.js --all`. Per-video detail: `analysis/<videoId>/optimization-report.md`.

Rules: never delete, never re-upload, never replace automatically. Change one packaging element at a time and log it in `experiments/experiments.json` so the effect can be measured.

Priority key: **P1** high impressions + low CTR · **P2** good views + low subscriber conversion · **P3** good retention + weak Suggested traffic · **P4** low-data videos.

## P1

_none_

## P2

### Why USS Thresher Was Lost
https://youtu.be/8HybydJa-l8 · 1200 views · diagnosis: HIGH_VIEWS_LOW_SUB_CONVERSION, OUTPERFORMER

- `KEEP` — outperforming the channel — keep title and thumbnail; only fix objective gaps below
- `PLAYLIST_MOVE` — add to cluster playlist "Maritime Disasters" (keep existing series)

### How Colgan 3407 Really Failed
https://youtu.be/uuJwJwP-rzw · 1089 views · diagnosis: HIGH_VIEWS_LOW_SUB_CONVERSION, OUTPERFORMER

- `KEEP` — outperforming the channel — keep title and thumbnail; only fix objective gaps below
- `PLAYLIST_MOVE` — add to cluster playlist "Aviation Failures" (keep existing series)

### Inside Van Norman Dam: The Failure Chain
https://youtu.be/WlZ2z90pqx8 · 1065 views · diagnosis: HIGH_VIEWS_LOW_SUB_CONVERSION, OUTPERFORMER

- `KEEP` — outperforming the channel — keep title and thumbnail; only fix objective gaps below
- `REDESCRIBE` — 10 hashtags — keep to 5

## P3

### Eastern 212: What Failed First
https://youtu.be/rgSsk8q6eyM · 1313 views · diagnosis: LOW_IMPRESSIONS_GOOD_RETENTION, OUTPERFORMER

- `KEEP` — outperforming the channel — keep title and thumbnail; only fix objective gaps below
- `PLAYLIST_MOVE` — add to cluster playlist "Aviation Failures" (keep existing series)

### General Slocum: The Inspection That Killed
https://youtu.be/NnGoWJOdaW0 · 970 views · diagnosis: LOW_IMPRESSIONS_GOOD_RETENTION, OUTPERFORMER

- `KEEP` — outperforming the channel — keep title and thumbnail; only fix objective gaps below
- `PLAYLIST_MOVE` — add to cluster playlist "Maritime Disasters" (keep existing series)

### Deepwater Horizon: The Test Result Nobody Believed
https://youtu.be/aScjSrwqeRk · 655 views · diagnosis: SEARCH_DEPENDENT, SHORTS_FEED_NOT_PICKED_UP, WEAK_TOPIC_PACKAGING

- `KEEP` — no action needed with the data available
- Title to test later (as a logged experiment): "Why Deepwater Horizon's Last Defense Failed"

### The Hidden Flaw Inside United 232
https://youtu.be/BukKRJfO7zI · 435 views · diagnosis: SEARCH_DEPENDENT, SHORTS_FEED_NOT_PICKED_UP, WEAK_TOPIC_PACKAGING

- `PLAYLIST_MOVE` — add to cluster playlist "Aviation Failures" (keep existing series)

### They Saw the Cracks. The Building Stayed Open. | Rana Plaza
https://youtu.be/nVBdZNDfqkQ · 195 views · diagnosis: SEARCH_DEPENDENT, SHORTS_FEED_NOT_PICKED_UP

- `REDESCRIBE` — no technical references; no related-episode or playlist link (session growth)
- `REVIEW_MANUALLY` — no matching production spec — check title/topic by hand

### Hyatt Regency: What Failed First
https://youtu.be/gC62R2vVYcs · 13 views · diagnosis: INSUFFICIENT_DATA, LOW_IMPRESSIONS_GOOD_RETENTION, WEAK_TOPIC_PACKAGING

- `KEEP` — no action needed with the data available

## P4

### Why Challenger Broke Apart 73 Seconds After Launch
https://youtu.be/bqTpdauhlHo · 1742 views · diagnosis: OUTPERFORMER

- `KEEP` — outperforming the channel — keep title and thumbnail; only fix objective gaps below

### Vesuvius 1944: An Eruption in the Middle of a War
https://youtu.be/I86SnrokHMk · 1462 views · diagnosis: OUTPERFORMER

- `KEEP` — outperforming the channel — keep title and thumbnail; only fix objective gaps below
- `PLAYLIST_MOVE` — add to cluster playlist "Natural Hazards vs. Engineering" (keep existing series)

### The Nuclear Test That Poisoned a Paradise Forever
https://youtu.be/DLYpmaQ-EVw · 1385 views · diagnosis: OUTPERFORMER

- `KEEP` — outperforming the channel — keep title and thumbnail; only fix objective gaps below
- `PLAYLIST_MOVE` — add to cluster playlist "Nuclear Accidents" (keep existing series)

### 28 Volts vs 65: Apollo 13's Hidden Flaw
https://youtu.be/uqoAjXMbbls · 1287 views · diagnosis: OUTPERFORMER

- `KEEP` — outperforming the channel — keep title and thumbnail; only fix objective gaps below

### The Disaster That Ended the Age of the Airship
https://youtu.be/PGOKZhPYo7c · 1052 views · diagnosis: OUTPERFORMER

- `KEEP` — outperforming the channel — keep title and thumbnail; only fix objective gaps below
- `PLAYLIST_MOVE` — add to cluster playlist "Aviation Failures" (keep existing series)
- `REVIEW_MANUALLY` — Published narration states a spark ignited leaking gas as fact; it is the leading theory (static discharge), not proven. The pinned comment/description should say "most likely".

### How Amtrak 501 Really Failed
https://youtu.be/d_xBJEX6QJ8 · 1026 views · diagnosis: OUTPERFORMER

- `KEEP` — outperforming the channel — keep title and thumbnail; only fix objective gaps below

### How a Single Step Triggers an Avalanche
https://youtu.be/ODZ7y6r1o6o · 979 views · diagnosis: OUTPERFORMER

- `KEEP` — outperforming the channel — keep title and thumbnail; only fix objective gaps below
- `PLAYLIST_MOVE` — add to cluster playlist "Natural Hazards vs. Engineering" (keep existing series)

### Mount St. Helens: What Failed First
https://youtu.be/aGG5f0Q2B9c · 600 views · diagnosis: WEAK_TOPIC_PACKAGING

- `PLAYLIST_MOVE` — add to cluster playlist "Natural Hazards vs. Engineering" (keep existing series)

### Inside Saudia 163: The Failure Chain
https://youtu.be/ATpXizczEI8 · 469 views · diagnosis: WEAK_TOPIC_PACKAGING

- `KEEP` — no action needed with the data available
- Title to test later (as a logged experiment): "Why Nobody Escaped Saudia Flight 163"

### What Engineers Changed After Beirut
https://youtu.be/MdDPiLh09K8 · 447 views · diagnosis: HEALTHY

- `KEEP` — no action needed with the data available

### San Bruno: What Failed First
https://youtu.be/PAi4kSZesNE · 357 views · diagnosis: WEAK_TOPIC_PACKAGING

- `KEEP` — no action needed with the data available

### Inside SL-1: The Failure Chain
https://youtu.be/qVsgb-iZJZ8 · 277 views · diagnosis: WEAK_TOPIC_PACKAGING

- `RETITLE` — title engine: current 23.2 vs "Why the SL-1 Reactor Exploded" 42.3
- `PLAYLIST_MOVE` — add to cluster playlist "Nuclear Accidents" (keep existing series)
- Title to test later (as a logged experiment): "Why the SL-1 Reactor Exploded"

### Wind-Driven Fire: What Destroyed Lahaina
https://youtu.be/tH-casKT7OY · 255 views · diagnosis: WEAK_TOPIC_PACKAGING

- `PLAYLIST_MOVE` — add to cluster playlist "Natural Hazards vs. Engineering" (keep existing series)

### Why Qantas Flight 32's Engine Exploded
https://youtu.be/tSanOctggR4 · 250 views · diagnosis: WEAK_TOPIC_PACKAGING

- `KEEP` — no action needed with the data available

### Why the Tacoma Narrows Bridge Tore Itself Apart
https://youtu.be/qkzRUqlEy5I · 189 views · diagnosis: SHORTS_FEED_NOT_PICKED_UP

- `KEEP` — no action needed with the data available

### Why the Sunset Limited Crashed at Big Bayou Canot
https://youtu.be/X_EhSVzvv3o · 161 views · diagnosis: WEAK_TOPIC_PACKAGING

- `KEEP` — no action needed with the data available

### Inside SS Arctic: The Failure Chain
https://youtu.be/zq07sKTZmCs · 160 views · diagnosis: WEAK_TOPIC_PACKAGING

- `REPACKAGE` — several packaging elements are weak at once
- `RETITLE` — title engine: current 20.4 vs "Why the SS Arctic Disaster Was So Deadly" 44
- `REDESCRIBE` — 6 hashtags — keep to 5
- `PLAYLIST_MOVE` — add to cluster playlist "Maritime Disasters" (keep existing series)
- Title to test later (as a logged experiment): "Why the SS Arctic Disaster Was So Deadly"

### Tasman Bridge: What Failed First
https://youtu.be/SjJHvPtSvcg · 125 views · diagnosis: WEAK_TOPIC_PACKAGING

- `KEEP` — no action needed with the data available
- Title to test later (as a logged experiment): "Why the Tasman Bridge Collapsed"

### Why San Francisco Burned for Three Days
https://youtu.be/X0jw78mIGdk · 120 views · diagnosis: WEAK_TOPIC_PACKAGING

- `PLAYLIST_MOVE` — add to cluster playlist "Natural Hazards vs. Engineering" (keep existing series)
- `REVIEW_MANUALLY` — Published narration says the fire, not the quake, did most of the killing. Sources agree fire caused most of the DESTRUCTION; the split of deaths is uncertain. Clarify in the pinned comment/description rather than re-uploading.

### Why the Ajka Red Mud Reservoir Failed
https://youtu.be/JAKAYnkbxd8 · 39 views · diagnosis: INSUFFICIENT_DATA, WEAK_TOPIC_PACKAGING

- `KEEP` — no action needed with the data available

### How Daniel J. Morrell Really Failed
https://youtu.be/6Xsisq9PrHo · 34 views · diagnosis: INSUFFICIENT_DATA, WEAK_TOPIC_PACKAGING

- `KEEP` — no action needed with the data available

## Order of work

1. **REDESCRIBE / ADD_INTERNAL_LINKS** first — objective gaps (sources, references, related links, disclosure), zero risk to CTR.
2. **PLAYLIST_MOVE** when a cluster reaches 3 published videos (`node channel-plan.js` shows status).
3. **RETITLE / RETHUMBNAIL** only after ~7 days of data, one video at a time, logged as an experiment.
4. **REPACKAGE** is reserved for videos with measured weak packaging (P1), never on day-one guesses.

## Local productions (not on YouTube)

| Slug | State | Class | Why |
|---|---|---|---|
