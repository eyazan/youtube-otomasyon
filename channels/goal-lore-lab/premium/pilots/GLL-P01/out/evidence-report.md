# GLL-P01 evidence report: "The Free Kick That Turned Into a Spiral" (GoalLore Lab pilot)

Status: **PILOT. NOT APPROVED FOR PUBLICATION.** GoalLore Lab is unregistered and its publishing is disabled. Every frame carries "PILOT · NOT APPROVED FOR PUBLICATION".

Research was done in this session with web search only. The build environment could not fetch any source page (the proxy refuses Wikipedia, Sky Sports, HAL, ScienceDaily and others). So **no verbatim quote was captured**, and the channel rule `requiresVerbatimQuotes` is not met. Each claim is corroborated by the outlets listed in `topic.json`, as summarised by search. Nothing is presented as a quote on screen.

| Line | Narration | Facts | Support level |
|---|---|---|---|
| L1 | This free kick was flying wide. Then it turned. | F3 | Corroborated (Sky Sports, What A Howler, ESPN) |
| L2 | Lyon, June 1997. Brazil against France. | F1 | Corroborated (Wikipedia 1997 Tournoi de France; Sky Sports): 3 June 1997, Stade de Gerland, 1–1 |
| L3 | Roberto Carlos hit it with the outside of his left foot, from far out. | F2 | Reported (What A Howler). "Far out" is used because distances disagree (about 33 m to 40 yards). |
| L4 | The ball swung around the wall and kept heading wide. | F3 | Corroborated |
| L5 | Then it bent back in, past a goalkeeper who never moved. | F3, F4 | Bend: corroborated. Keeper did not move: **single outlet in this pass, re-check.** |
| L6 | In 2010, French physicists showed why. | F5 | Corroborated (HAL record; ScienceDaily, 2 September 2010): Dupeux, Le Goff, Quéré, Clanet, *New Journal of Physics* 12, 093004 |
| L7 | Spin pushes the ball sideways. Drag slows the ball down, but the spin keeps going. | F6, F7 | Paper summary (ScienceDaily, Physics World). The model is labelled PHYSICS MODEL. |
| L8 | So the slower it flies, the tighter it curves, into a spiral. | F6, F7 | Paper's central result as summarised. The spiral plot is a 2D model with illustrative constants. |
| L9 | That is why the bend came so late. Every goal has a story. | F3, F6 | Interpretation stated in the paper's coverage. The brand line is the channel tagline. |

Not used, because the evidence is too weak: the ball boy anecdote and "the ball clipped the post" (each from a single outlet). No distance, speed or spin figure is used, since reported values disagree.

The trajectories are a model: RK4 integration of drag (Cd 0.25) and Magnus lift with illustrative launch values (scripts/bto-studio/page/components/football.js). They are not tracking data. Every pitch scene carries the RECONSTRUCTION and PHYSICS MODEL chips.

Likeness and IP: no player is drawn as a person (generic standing tokens only). There are no kits, crests, broadcast footage or photographs. The player is named in narration as a factual statement only.

Before any production:
1. Open each URL and copy one verbatim quote per fact.
2. Confirm "outside of the left foot" and "the goalkeeper did not move" against two match reports.
3. Read the paper itself (HAL open access) and quote its spiral statement.
4. Approve a narration voice. The channel's voice is still a CANDIDATE, and this render uses the Kokoro bm_george preview.
5. Verify the YouTube channel identity (docs/premium-studio/v5-report.md §7).
