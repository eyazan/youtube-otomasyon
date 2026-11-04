# Failure Reconstructed: Costa Concordia (FR-costa-concordia-2012)

**Final MP4:** run 41907167713, artifact `premium-FR-costa-concordia-2012`. Every half-second of the MP4 is on branch
`review/render-41907167713-FR-costa-concordia-2012`, under `full/`.

## Title
The Cruise Ship That Sailed Too Close to Shore

## Description
```
Costa Concordia capsized off the island of Giglio. The cause: hull breach from a rock strike flooding several compartments, then a list and capsize.

Failure chain: Sail-past close to shore → Rock tears the hull → Engine rooms flood → Delayed evacuation → Ship capsizes

Related episode: Inside SS Arctic: The Failure Chain — https://youtu.be/zq07sKTZmCs

Series — Maritime Disasters: https://www.youtube.com/playlist?list=PLOjaDNq7OIVc

Technical references:
• Wikipedia — Costa Concordia disaster — https://en.wikipedia.org/wiki/Costa_Concordia_disaster
• Government source — naufragio giglio 2 (cited by Wikipedia) — http://www.isprambiente.gov.it/site/en-gb/Archive/Home_page_Documents/Documents/naufragio_giglio_2.html

Narration uses a synthetic voice. Original animation: no archival or stock footage; reconstructions and illustrations are labelled on screen.

Failure File · Episode NN · A new engineering failure, reconstructed every day.

#shorts #engineering #CostaConcordia #maritime #history
```
`Episode NN` is filled in at upload, from the published count.

## Narration and what is drawn
| line | narration | drawing |
|---|---|---|
| L1 | A giant cruise ship struck a rock off the Italian island of Giglio. | Passenger ship in calm water, with spray at the bow at 0.2 s |
| L2 | It flooded and rolled onto its side, and thirty two people died. | Bow-on hull section rolls to 60°. She does not go under. "32 DIED" |
| L3 | The ship had left its route to sail close to the island. | The ship comes in toward a rock just under the surface. "SAIL-PAST CLOSE TO SHORE" |
| L4 | A rock tore a long gash in the hull. | Impact: a gash opens below the waterline. "ROCK TEARS THE HULL" |
| L5 | Water flooded the engine rooms, and power failed. | Hull section: water floods in, and the inclinometer swings |
| L6 | The order to evacuate came very late. | Ship at rest with lights on. "DELAYED EVACUATION" |
| L7 | By then, the list made many lifeboats hard to use. | Bow-on list to 24°, inclinometer labelled "LIST" |
| L8 | Cruise routes and evacuation rules were tightened afterward. | Ship whole again. Returns to the frame-0 framing (loop) |

There is no storm, no crack and no container cargo: those were removed after the earlier renders.

## Research
- This is the FR research standard: a case file with a failure chain and source URLs, and no stored verbatim quotes.
- Sources: Wikipedia, *Costa Concordia disaster*; the ISPRA page cited by Wikipedia.
- Facts to confirm: 32 deaths; a deliberate sail-past close to Giglio; a gash about 50 m long; engine rooms flooded and
  power lost; abandon-ship ordered more than an hour after impact; the list made lifeboats on one side unusable;
  rules tightened afterwards.

## Technical QA
See `qa-report.md` on the review branch. Hard checks: PASS. Loop continuity is a WARN (advisory).

## Creative findings (assistant, not a verdict)
- The first frame shows the event: spray at the bow while the ship is moving.
- The list is drawn as a list, bow-on. A side-view tilt would read as trim.
- The chain card enters with a full-width wipe, so no clipped label.
- Advisory: the square-iris transition into L4 shows its orange outline briefly. It is a transition, not a label.

## Exact approval required
The signed FR publication policy (2026-10-28) already authorises unattended publication. To make Costa Concordia
**the next FR Short, approved by you per-video** (recommended while FR is paused):

1. Watch the MP4.
2. Reserve the topic:
   ```bash
   node core/pipeline/premium-publish.js reserve --channel failure-reconstructed --topic FR-costa-concordia-2012 --by <your name>
   ```
3. In `channels/failure-reconstructed/premium/approvals/FR-costa-concordia-2012.json`, set:
   - `contentSha256` to `10970e8a960b44d4bcbddca6f64e7063bb9e43af15b1493b686e051cb9e740b4` (this render's content hash; re-check it with `node core/pipeline/premium-publish.js hash --channel failure-reconstructed --topic FR-costa-concordia-2012` after a local final render; the publisher refuses any render whose hash differs);
   - `creative`, `factual` and `publish` to `{ "by": "<your name>", "at": "<ISO time>" }`;
   - the `metadata` title, description and tags above.
4. Merge, then set `FR_PREMIUM_PUBLISH=1`. A signed per-video approval is picked before the policy's automatic choice.

If you reject it, no record is needed. The video stays unpublished.
