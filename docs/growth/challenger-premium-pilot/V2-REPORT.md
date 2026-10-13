# Challenger premium V2: final validation (2026-10-13)

**Offline prototype, NOT approved for production.**
- Nothing was published or uploaded.
- No paid API was called.
- No workflow, schedule or publishing configuration changed.

## 1. The video

| | |
|---|---|
| File | `challenger-premium-v2.mp4` (draft release asset; see §6) |
| SHA-256 | `a832a220c3354398ca9a4eaf419ba313e12911e428faa34155785125ee70f98e` |
| Source | commit `0691071e`, clean tree (`v2/SOURCE.txt`) |
| Format | 1080×1920, 30 fps, H.264 High yuv420p, AAC 48 kHz stereo, 51.70 s, 1551 frames |
| Narration | identical to V1 (Edge `en-US-AndrewNeural`, same file) |

V1 (`challenger-premium-v1.mp4`, SHA-256 `65fabbe6…`) was not overwritten.

### How V2 was reached

There were two repair attempts, each targeting the affected scenes only:

1. **Before rendering:** the new text-collision check (§2) found:
   - "LOWEST JOINT" colliding with the caption;
   - "RIGHT BOOSTER" clipped at the right edge;
   - the O-ring labels drifting to 8 px from the left edge;
   - three labels under the right-hand Shorts buttons;
   - a 22 px attribution line.

   These were fixed in commit `ed0cb71d` and then rendered.
2. **On that rendered MP4:** during crossfades, the incoming text ghosted over the outgoing text, and the S13 diagram never actually dissolved.
   - Fixed in commit `0691071e` (library-level: text is sequenced, and the outgoing SVG clears).
   - Re-rendered once. This file is the final V2.

No third attempt was made. Remaining issues are listed in §7.

## 2. Technical QA (final MP4)

Thresholds were set before inspection and not changed afterwards. Records: `channels/failure-reconstructed/premium/challenger-1986/v2/`.

| Check | Result |
|---|---|
| Full decode | PASS: 0 errors, 1551 / 1551 frames |
| Resolution / fps / codec | PASS: 1080×1920, 30/1, H.264 High yuv420p |
| Black frames ≥ 0.1 s | PASS: none |
| Frozen frames (freezedetect, n = 0.003, ≥ 2 s) | PASS: none; longest near-static run 1.97 s |
| Loudness / true peak / LRA | PASS: −14.1 LUFS / −1.8 dBTP / 2.9 LU |
| Clipping | PASS: flat factor 0 |
| A/V sync | PASS: duration difference 0.000 s |
| Caption layout | PASS: 26 cues, at most 2 lines × 26 characters |
| Caption reading speed | **WARN**: 1 cue at 22.6 characters/s (limit 22) |
| Caption timing vs acoustic onsets | **WARN**: 20 cues, mean 59 ms, max 287 ms. The max is the one cue that starts mid-sentence, with no pause for the detector; the other 19 are 18–107 ms. |
| Text collision / caption band / frame edge / Shorts UI zones / size | PASS: 207 samples every 0.25 s; 0 FAIL, 0 WARN; smallest essential text 24 px |
| First frame | PASS: mean luma 76.4, detail sd 64.6, edge energy 6.93 |
| First 3 s | speech starts at 0.11 s; motion 3.06; static share 0.12 |
| Loop continuity (last → first frame) | PASS: whole frame 2.95 / 255, photo region 0.79, ratio 1.31 to the final second's frame step |

## 3. Creative review

Frames were taken from the final MP4 at 360×640 (phone scale), V1 and V2 side by side: `frames-v2/` in the review bundle. **This is my judgement, not audience evidence.**

- **0–3 s.**
  - V2's frame 0 is visibly simpler: photo, "CHALLENGER · 1986", "Already leaking", and the provenance chip.
  - The circled smoke, with "0.678 s after liftoff" inside its label, arrives at 0.5–1.4 s.
  - The hook is clear on mute.
  - Trade-off: frame 0 no longer shows a number. The time arrives about a second later.
- **8 s, Rogers Fig. 14.**
  - Readable now: the Commission's labels are about 40 px, and both O-rings are ringed. In V1 the whole figure was unreadable on a phone.
  - Remaining: the detail crop slices the figure's own "Insulation" and "AFT Facing Inhibitor" words at its edges, and the 527 px source scan is soft.
- **14–20 s, mechanism.**
  - The warm/cold panels now show the consequence ("follows: still sealed" / "lags: gap left open"), not just rubber shape.
  - The joint animation's numbered steps land on the spoken words.
  - The cold-side gap is small on a phone. It reads, but not boldly.
- **26 s, flame marker.**
  - The ring is complete by 24.0 s (V1: 24.6 s), has a dark outline, and stays for the shot.
  - Visible in every sampled frame from 0.4 s into the shot.
  - Normal-speed visibility still needs a human eye.
- **38–44 s.**
  - About 15 words on screen instead of about 40.
  - The 53 °F vs 36 °F columns carry the point; the decision chain is three short boxes.
  - Clearly lighter than V1.
- **Final 5 s.**
  - The payoff is two lines, held about 3.4 s, then fades out over 0.35 s.
  - The last frame is the opening photo at the opening framing, so the loop lands on frame 0 with only the headline appearing.
  - Crossfades now show one set of text at a time.

## 4. Audio validation and owner listening checklist

**Technical integrity:**
- AAC 48 kHz stereo; −14.1 LUFS; true peak −1.8 dBTP; flat factor 0; DC offset about 0.
- Longest narration pause 0.95 s, which is a designed pause.
- The decoded audio is **bit-identical to V1**.

**Not established:** naturalness, voice fit and mix quality. These need a person. The Kokoro `am_michael` fallback stays **unapproved**.

**Owner listening checklist** (phone speaker, then headphones):
1. Does the first line land clearly within the first second, and does "already leaking" sound like a question worth staying for?
2. Pacing: is about 158 wpm overall right for this subject? Note any line that feels rushed (L2 and L7 are the fastest).
3. Pronunciation: "O-rings", "fifty-eight", "seventy-three", "fifty-three", "Challenger".
4. Join points: do the six narration beats join without audible edits?
5. Silence: is the near-silence under the breakup photo and the crew portrait respectful rather than empty or awkward?
6. Bed and cues: is the drone in S06–S09 too present? Does any cue (low impact, ticks, hiss, payoff note) sound artificial or loud?
7. Payoff: does "But the warning failed the night before" sound final, not clipped?
8. Loop: on replay, is the jump from the last note back to the opening acceptable?
9. Fallback only: Kokoro `am_michael` sample in the bundle. Is it acceptable at all? (Default: no.)

## 5. A / B / C / D comparison

| Measure (objective) | A original | B Craft V2 | C Premium V1 | D Premium V2 |
|---|---|---|---|---|
| Duration (s) | 27.6 | 27.5 | 51.7 | 51.7 |
| Hard checks (same QA, including the new loop check) | FAIL (loop) | FAIL (loop) | FAIL (loop) | **PASS** |
| Frame 0 edge energy (sharpness) | 1.24 | 1.56 | 7.46 | 6.93 |
| First 3 s static share | 0.39 | 0.37 | 0.11 | 0.12 |
| First speech onset (s) | 0.18 | 0.08 | 0.11 | 0.11 |
| Whole-video static share | 0.44 | 0.38 | 0.46 | 0.46 |
| Longest near-static run (s) | 0.57 | 0.67 | 1.97 | 1.97 |
| Hard cuts detected (scene > 0.25) | 7 | 12 | 13 | 10 |
| Loudness / true peak | −15.2 / −4.4 | −15.1 / −1.4 | −14.1 / −1.8 | −14.1 / −1.8 |
| Loop jump, last → first (whole / photo, 0–255) | 60.2 / 73.5 | 92.4 / 128.2 | 50.4 / 59.6 | **2.95 / 0.79** |
| Text QA: FAIL / WARN groups | — | — | 49 / 19 ¹ | **0 / 0** |

¹ C's shot list (`661e49f3`) inspected with today's library, which differs from V1 only in crossfade handling (not counted; text under 50% opacity is skipped). Its fails: 32 frame-edge, 7 caption-band, 10 collisions. A and B are not inspectable this way; they come from a different renderer.

**V1 → V2, measured:**
- **Improvements:** the loop now passes (50.4 → 2.95); text collisions and edge clipping fall from 49 FAIL / 19 WARN to 0 / 0. The smallest essential text is 24 px in both versions.
- **Unchanged:** audio (identical), duration, first-3 s motion, static share, longest static run.
- **Possible regressions:**
  - frame-0 edge energy fell slightly (7.46 → 6.93) because the clock box was removed;
  - fewer detected hard cuts (13 → 10), because three crossfades now genuinely dissolve. That is a smoother transition, not lost shots.

**Subjective (my judgement):**
- **D vs C:** D is easier to follow at phone size: a readable Commission figure, a mechanism shown as cause and effect, lighter text at 38–44 s, and cleaner transitions and loop.
- **D vs A/B:** D keeps C's advantages (an evidence-first opening and visuals that match the mechanism being described).
- **Still unproven:** whether D's 52 s holds viewers better than a shorter cut.

**Not claimed:** that any version will get more views. Only a controlled live test can show that (`script-short.json` has the test design).

## 6. Persistent artifacts

Draft GitHub release `pilot-challenger-premium-v1-2026-10-12`. It is visible to repo writers only; keep it as a draft, because publishing makes it public. New V2 assets:
- `challenger-premium-v2.mp4`
- `challenger-premium-v2-qa-bundle.zip` (QA JSON, text inspection, comparison table, phone-scale review frames)
- an updated `SHA256SUMS.txt`

```bash
gh release download pilot-challenger-premium-v1-2026-10-12 --repo eyazan/youtube-otomasyon
```

```bash
shasum -a 256 -c SHA256SUMS.txt
```

## 7. Remaining blockers before production

1. **Human approval of V2.** Watch at phone size and normal speed, especially the opening pace, the flame marker, the 38–44 s reading load, and the loop.
2. **Human listening approval** (§4). Not done; the Kokoro fallback is still unapproved.
3. **Two caption warnings**: one cue at 22.6 characters/s, and the mid-sentence sync artifact (a measurement limit, not a known sync error).
4. **Cosmetic**: the Fig. 14 crop slices two of the figure's own labels; the cold-gap tint is small; the scan is soft.
5. **Automation**: still hand-composed per topic. See `REVIEW-AND-AUTOMATION-AUDIT.md` §3–4 for the manual steps that must be automated or bounded first (sources, licensing, alignment, mechanism templates, bounded repair, cost and publishing gates). The new text QA is now one of those automatic gates.
6. **Audience evidence**: none yet. Run a controlled premium-vs-current and long-vs-short test before any production decision.
