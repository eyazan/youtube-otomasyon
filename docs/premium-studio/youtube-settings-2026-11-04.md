# YouTube metadata and channel settings (2026-11-04)

Live state comes from the read-only audit, run 41900441694 (19:48 UTC), on branch `review/youtube-audit-41900441694`.

## A. Already corrected in code (applies to future uploads once #411 and #416 are merged)

| what | where |
|---|---|
| Upload `defaultLanguage` / `defaultAudioLanguage` = `en`, category 27 (17 for GLL) | #411 `upload` block. Today's live uploads show ∅ because main does not have it yet. |
| No "Archival film" credits on animated (premium) Shorts; the El Faro contradiction cannot recur | `description-engine.js` `goruntuKaynaklari` |
| HTML entities decoded in source titles (`&sect;` → `§`) | `core/pipeline/premium-publish.js` `clean()` |
| GLL hashtags `#football #soccer`; pinned Wikipedia (`oldid`) titles recognised | `core/hashtags.js` |
| FR Costa Concordia title: "A Showboating Sail-Past…" (a judgement, not in the sources) → **"The Cruise Ship That Sailed Too Close to Shore"** | `icerik/konular/costa-concordia-2012.json` |
| BTO-156 title: "Microwave doors: what explains metal mesh?" → **"Why Your Microwave Door Has a Metal Mesh"** | `channels/behind-the-ordinary/topics/topic-universe.json` |

Titles are not part of the research hash, so no research review is voided.

## B. Can be changed through an authorized API (prepared, NOT executed: needs your go-ahead)

| what | how | blocker |
|---|---|---|
| El Faro `A-IgHh6J_ZU` description (public; it lists archival film and then says "no archival footage") | `videos.update` (snippet.description) with the text in `corrections/A-IgHh6J_ZU-el-faro-description.txt` | It needs the `youtube.force-ssl` scope on the FR token. Your explicit approval is needed, because it edits a public video. Doing it in Studio (C) is equivalent. |
| Video `defaultLanguage`/`defaultAudioLanguage` on `A-IgHh6J_ZU` and `b7LByhFrMMc` | `videos.update` (snippet) | same |

The channel description, keywords and channel language are **not** written by this code through the API, by design.
They are Studio items (C).

## C. Manual YouTube Studio changes (owner)

1. **`A-IgHh6J_ZU` El Faro (public):** in the description, delete from `Footage & sources:` through the last
   `• Archival film: …` line. The full corrected text is in `corrections/A-IgHh6J_ZU-el-faro-description.txt`.
   Keep visibility as it is.
2. **`b7LByhFrMMc` Venus (public):** metadata is accurate. No change is needed. Narration line 2 ("hotter than Mercury")
   is true but unsourced in our record. Leave it, or add a source line to the description: `Wikipedia — Venus: https://en.wikipedia.org/wiki/Venus`.
3. **FR channel description:** it says "using real archival footage". Replace it with the text in
   `launch-readiness-2026-11-04.md` §3.2.
4. **GLL channel description:** change the last line `PitchLore — Every Goal Has a Story.` to
   `GoalLore Lab — Every Goal Has a Story.`
5. **All four channels, Settings → Channel → Basic info:** set Language to English (the audit shows "not set") and add
   keywords (the audit shows "none"):
   - IB: `science, what if, space, physics, earth science, astronomy, volcanoes, science explained`
   - FR: `engineering failures, disasters, forensic engineering, accident investigation, engineering history, shipwrecks, bridge collapse`
   - BTO: `how things work, everyday objects, design, hidden engineering, everyday science, product design`
   - GLL: `football, soccer, football history, world cup, iconic goals, football stories`
6. **BTO:** confirm that only one of `Q98e12I0NFA` / `Dibi31XmolY` (both Bluetooth logo) is public. The BTO audit cannot
   read this until OAuth is fixed.
