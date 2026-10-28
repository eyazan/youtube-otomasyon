# QLSnrXyCJgw — first premium Failure Reconstructed Short (FR-gemini-8-1966)

Reviewed 2026-10-28 from the **exact uploaded file**: the MP4 in run 40650009127's preview artifact has sha256
`cddb07b4…1df9`, identical to the approval record's `mediaSha256`. Frames, contact sheet and measurements were
extracted by `video-review.yml` (run 40672117302) and are on the `review/QLSnrXyCJgw` branch.

**Watch / download the exact MP4 (90 days):** artifact `video-QLSnrXyCJgw` of run
https://github.com/eyazan/youtube-otomasyon/actions/runs/40672117302

The video is not changed and not re-uploaded. The #357 fixes (transition variety, caption reading speed, loop
framing) apply only to renders made after merge ddb91b6; this video predates them.

## A. Technical QA (measured)

| Check | Result | Evidence |
|---|---|---|
| Resolution / codec | PASS | 1080x1920, 30 fps, h264 yuv420p (ffprobe) |
| Duration | 27.07 s | ffprobe |
| Audio | PASS | AAC 48 kHz stereo; −14.1 LUFS integrated, LRA 2.7 LU, true peak −2.0 dBTP (EBU R128) |
| Clipped samples | UNVERIFIED | this FFmpeg build does not report it; sample peak −1.99 dBFS |
| Caption sync | PASS | 10 cues after pauses: max 67 ms, mean 46 ms from the measured speech onset |
| Caption reading speed | WARN | 2 cues over 22 chars/s (max 30.3) — fixed for later renders (#357) |
| Black frames / frozen spans | PASS | none (blackdetect d≥0.1 s; freezedetect n=0.003 d≥1.5 s) |
| Render errors | PASS | 0 decode errors; frames deterministic (0.7/12.3/24.9 s identical across pages) |
| Voice | PASS | en-US-AndrewMultilingualNeural, the approved FR voice; real speech (voiced 0.751, 2.57 words/s) |
| Source accuracy | PASS (FR standard) | case file + Wikipedia + NASA document cited by Wikipedia; every number checked against the article at library build |
| Publication safety | PASS | channel identity verified (UC2ruKNeR_C9JEpjWJGWbFYg), one ledger row, scheduled 2026-10-28 18:00 UTC |

## B. Creative quality review (from the real frames; my judgement, not a score)

Scene types used (storyboard `auto/failure-reconstructed.js`): hook (object silhouette + case stamp), toll, trigger
(silhouette + headline), four failure-chain card scenes, payoff (object redrawn + lesson headline). Visual assets: one
generic line drawing of the object class `rocket`, a red failure marker, chain cards, two background plates
(blueprint navy, teal). No photographs, footage or third-party media.

| Dimension | Assessment | Evidence |
|---|---|---|
| Curiosity of the topic | Strong | Armstrong + spacecraft out of control is a recognisable, high-stakes story |
| First two seconds | Weak | the opening frame is a static outline; the hook scene's mean motion is 0.289 with 65% static frames (QA motion table); the narration carries the hook, the picture does not |
| Story flow | Good | consequence → cause → chain → recovery → lesson, in 27 s |
| Script originality | Adequate | factual and clear, but generic phrasing ("Suddenly, it rolled faster and faster") |
| Visual storytelling | Weak | the event the narration describes — a violent spin — is never shown: the drawing only tilts a few degrees |
| Animation professionalism | Below premium | see the defects below |
| Scene variety | Low | 3 visual templates for 8 scenes; 4 of 8 scenes are near-identical chain cards on the same teal plate |
| Voice naturalness | Good | approved neural voice, measured word timing, no robotic pauses |
| Retention potential | Moderate | strong story, weak picture; no measured retention yet (published today) |
| Subscriber potential | Moderate | consistent series branding ("RECONSTRUCTION / CASE FILE" chips, episode line) |

### What lowers the premium impression (all visible in the frames)

1. **Wrong object.** Gemini 8 was a two-man capsule docked to an Agena target; the video draws a generic finned
   rocket. Every spacecraft maps to one `rocket` drawing (`objectKind` in `scripts/bto-studio/auto/failure-reconstructed.js`).
2. **The core event is not animated.** "Began spinning" over a drawing that barely tilts.
3. **Broken on-screen English.** Headlines come from `keyPhrase()`, which drops function words:
   "THRUSTER STUCK AFTER", "THRUSTER CIRCUITS REDESIGNED ISOLATE". The text gate checks geometry, not grammar.
4. **Overlaps and cropping.** The channel watermark sits on the rocket's nose; "GEMINI 8 · 1966" and "STUCK
   THRUSTER" are drawn across the object; the nose is cut off at the top in several frames.
5. **Repetition.** Four chain-card scenes in a row on the same plate; one drawing for the whole video.
6. **Payoff is a re-draw of the same outline**, not a resolution image (fixed framing for the loop only from #357 on).

None of these are measured by the objective QA, which is why it passed. They are generator-level, so they affect
every FR premium render until fixed; tracked in the follow-up issue.
