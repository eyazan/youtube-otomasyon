# Failure Reconstructed: Challenger premium Short, offline prototype (2026-10-12)

**Status**
- Nothing was published or uploaded.
- No credentials, schedules or production flags were changed.
- No paid API call was made.
- No PR was merged, and nothing was committed or pushed.

All paths below are relative to this folder (`reports/challenger-premium-2026-10-12/`, which git ignores).

## 1. Deliverables

| # | Deliverable | Path |
|---|---|---|
| 1 | **Final premium MP4** (1080×1920, 30 fps, H.264/AAC, 51.70 s) | `challenger-premium-v1.mp4` |
| 2 | Original published Short (A), preserved read-only. SHA-256 `1cacd5b9…dc7`, unchanged since download. | `challenger-original.mp4` |
| 3 | Craft V2 render (B) | `challenger-craft-v2.mp4` (render data in `craft-v2/`) |
| 4 | Side-by-side, A \| B \| C (1920×1080, C's audio) | `challenger-side-by-side.mp4` |
| 5 | First-3-seconds comparison (A, B, C, each with its own audio, then a silent triptych; 12 s) | `challenger-first-3-seconds-comparison.mp4` |
| 6 | Final narration script, hooks, evidence | `NARRATION-SCRIPT.md`, `premium/script.json` |
| 7 | Storyboard JSON (15 shots, built from the actual render) | `premium/storyboard.json` |
| 8 | Source and licensing manifest | `premium/source-licensing-manifest.json` |
| 9 | Audio samples | `audio/narration-sample-edge-andrew-final.mp3` (used in the video); `audio/narration-sample-kokoro-am_michael-UNAPPROVED.mp3`; word timings `audio/timeline-*.json` |
| 10 | Technical QA | `qa/qa-table.md`, `qa/qa-{original,craft-v2,premium-v1}.json`, `premium/audio-master.json` |
| 11 | Creative QA | §4 below; frames in `frames/` |
| 12 | Cost | §5 |
| 13 | Reusable components | §6; code copy in `code/` |
| 14 | IB / CT recommendations | §7 |

### Limitations

- **A is YouTube's transcode, not the upload master.** It was downloaded from our own public Short `bqTpdauhlHo` at 1080×1920, H.264 at 1.6 Mb/s, with AAC 44.1 kHz.
  - No artifact or local file of the original render exists: the oldest Actions artifact is from 2026-09-27, and the Short was produced on 2026-09-26.
- **B is a re-render, not a published video.** It runs today's `main` FR path (`shorts-yap.js` with `SHORTS_CRAFT_V2=failure-reconstructed`) on the unchanged topic file `icerik/konular/challenger-1986.json`.
  - It uses the same two NASA clips and the same Edge voice (Andrew, +6%).
  - The "FAILURE FILE #6" series label comes from current `main`.
- **`YouTube_Architecture_Report.docx` was not available.** It is no longer in Downloads, so it was not read.
  - `CHALLENGER_PREMIUM_PROTOTYPE.md` and `SHOT_SCHEMA.json` were read and used: the evidence list, the candidate hooks and the shot plan.
- **A↔C and B↔C are not single-variable comparisons.** C changes the script, the visuals, the motion and the sound together.
  - The voice is held constant: Andrew on all three.
  - A↔B isolates the renderer: same script, footage and voice.

## 2. What C is

**Hook (chosen from three; reasoning in `NARRATION-SCRIPT.md`):**
> "Less than a second after liftoff, Challenger was already leaking."

**Frame 0** is NASA photo GPN-2000-001347: the orbiter with "Challenger" and "United States" visible.
- A ring draws around the grey smoke at the right booster joint at 0.5 s.
- A clock reads "T+0.678 s", the Commission's time for the first smoke.

**Structure.** The film runs as one causal chain:
1. the leak (photo);
2. the joint (diagram, then the Commission's own Fig. 14);
3. 36 °F (NASA photo of icicles on the launch tower);
4. cold rubber (animation);
5. the joint opening and hot gas blowing past both seals (animation, not to scale);
6. the flight continuing (NASA film);
7. the flame at 58.8 s (NASA E-207 tracking film);
8. the plume reaching the tank (reconstruction, no explosion drawn);
9. one NASA still of the breakup, held once in silence;
10. the crew portrait, whole and uncropped;
11. the engineers' 53 °F recommendation (typeset from the Commission record);
12. where the warning stopped (diagram);
13. the scorched hole in the recovered right motor segment (NASA);
14. the payoff, *"The seal failed in the cold. But the warning failed the night before."*, back on the opening photo so the loop returns to frame 0.

**Provenance labels.** Every shot carries one: NASA photo/film, Commission record, explanatory diagram/animation, or reconstruction.

**Rejected assets:**
- the "O-ring tracks" debris photo, because NASA's own caption says the tracks were not O-ring material;
- the Commons file named "Rogers report front page", because it is actually the cover of the Senate hearings.

## 3. Comparison

### Objective (measured)

| | A original | B Craft V2 | C premium V1 |
|---|---|---|---|
| Length | 27.6 s | 27.5 s | 51.7 s |
| Words | 82 | 82 | 134 |
| Speech rate | ≈180 wpm | ≈180 wpm (+6% voice rate) | 158 wpm overall |
| Opening line | "73 seconds after launch, Challenger broke apart." | same | "Less than a second after liftoff, Challenger was already leaking." |
| Frame 0 | blurred letterboxed breakup clip, no text | blurred full-frame breakup with "73 SECONDS" box | sharp NASA photo of the vehicle with headline and clock |
| Frame 0 edge energy (sharpness proxy) | 1.24 | 1.56 | **7.46** |
| Distinct sources | 2 films | 2 films | 8 archival (6 photos/figure, 2 films) + 5 original animations |
| Hard cuts (scene > 0.25) | 7 | 12 | 13 |
| Breakup imagery | repeated (5 of 14 two-second samples) | repeated (5 of 14) | one still, about 1.4 s, in silence |
| Static share, first 3 s | 0.39 | 0.37 | **0.11** |
| Static share, whole video | 0.44 | 0.38 | 0.46 (diagrams drift slowly) |
| Longest near-static run | 0.57 s | 0.67 s | 1.97 s (QA limit 2 s) |
| Loudness / true peak | −15.2 LUFS / −4.4 dBTP | −15.1 / −1.4 | −14.1 / −1.8 |
| Caption timing | YouTube auto | proportional to characters | Edge word boundaries; 19 of 20 post-pause cues within 18–107 ms of the voice |
| Sound | procedural bed | bed + 2 synthesized cues | drone, 10 cues, true silence under the loss |

### Subjective (my judgement from inspected frames; not audience evidence)

- **Hook.** C states a mystery the rest of the film answers. A and B open on the outcome the title has already given away.
- **Visual relevance.** In A and B, the footage under "the cause was just a rubber ring" and "Cold made the O-rings stiff" is launch or breakup film. In C, every mechanism line has a picture of that mechanism.
- **Respect.** C shows the breakup once, briefly, without replay or zoom, and does not reuse it for drama.
- **Weakness of C: motion.** The diagrams are cleaner but calmer than footage. Whole-video static share is higher than B's.
- **Weakness of C: length.** At 52 s it asks for twice the watch time.
- **Weakness of C: density.** S12–S13 carry a lot of reading in about 10 s.

### Not claimed

- That C will get more views. Only a published A/B test (§7) can show that.
- That any voice sounds natural. I cannot listen. The audio was measured, not heard.

## 4. Quality assurance

### Technical (full table: `qa/qa-table.md`)

C passes every hard check:
- full decode: 0 errors, 1551 of 1551 frames;
- 1080×1920, 30/1, H.264 High, yuv420p;
- no black frames;
- no static hold of 2 s or more;
- no clipping (flat factor 0);
- −14.1 LUFS, −1.8 dBTP, LRA 2.9;
- A/V offset 0.000 s;
- 26 caption cues, none over 2 lines × 26 characters.

Two warnings remain:
1. **One caption cue reads at 22.6 characters per second** (limit 22).
2. **Caption-sync maximum of 287 ms.** This one is a measurement artifact: that cue starts mid-sentence with no pause before it, so the onset detector latched onto a later micro-gap. The other 19 cues measure 18–107 ms.

**Defects found and fixed across render passes:**
- the smoke ring sat in the caption band;
- a layer-order bug hid the Commission figure, both films and the crew portrait;
- a double crop over-zoomed the films;
- the O-rings were too small for a phone;
- the External Tank was hidden behind the orbiter in the plume reconstruction (the orbiter is now ghosted);
- a 2.3 s frozen hold in the joint animation (QA FAIL; fixed with a slow drift);
- labels collided in three places;
- the payoff wrapped to three lines;
- two headlines overlapped during a crossfade (now a cut).

### Creative

Inspected on rendered frames: frame 0, frames every 0.5 s through the first 3 s, and one frame per 1–2 s across the whole film, for all three versions (see `frames/`).

- **First frame and first 3 s:** the subject is named on screen ("CHALLENGER"), the vehicle fills the frame, and the circled evidence appears at 0.5 s, while the first words are spoken.
- **Engineering accuracy:**
  - the joint geometry follows Rogers Fig. 14 (tang, clevis, primary and secondary O-rings, putty), with "not to scale" shown;
  - the timeline values on screen (0.678 s, 58.788 s, 60.2–64.66 s, 73 s) are the Commission's;
  - the right booster is drawn on the viewer's right because the stack is shown from the orbiter's side.
- **Not reviewed:** listening to narration and sound, and how the motion feels at full speed on a phone. Both need a person.

**Owner review checklist** (from the brief):
- Is frame 0 clear on mute?
- Is the narration natural?
- Are the cues restrained enough?
- Is S12–S13 readable in time?

## 5. Production cost

**Paid spend: $0.00.**

| Item | Cost | Notes |
|---|---|---|
| Edge TTS | free endpoint | 403-throttled at times; 3 successful full reads; no paid TTS |
| Kokoro | local | `kokoro_mlx`, Apache-2.0 weights already cached |
| Wikimedia Commons | free | NASA public-domain files |
| Rogers Commission (nasa.gov) | free | read via the web |
| YouTube download | free | our own Short |
| Rendering, mix, QA | local | headless Chromium and ffmpeg |
| LLM / API calls by the pipeline | none | — |

**Machine side effects:**
- Mid-session, `libvpx`, `x264`, `dav1d`, `fdk-aac`, `lame`, `libogg`, `libvorbis`, `opus`, `snappy`, `svt-av1` and `theora` disappeared from Homebrew, which broke ffmpeg; this was not done by me.
- I reinstalled exactly those libraries, plus `mpg123` as a dependency, with auto-update and upgrades disabled. ffmpeg now works.
- A Python venv with yt-dlp and Pillow was created in the session scratch area.

## 6. Reusable components

The source is in the worktree branch `feat/challenger-premium-pilot`, which is uncommitted and lives in a temporary folder. A copy is in `code/`.

| Component | What it does |
|---|---|
| `fr-premium/render-vertical.js` + `fr-lib.js` | 1080×1920 deterministic motion renderer. Every frame is a pure function of time. It reuses the ProfitDecoded approach and its OFL fonts. It provides photo and film layers with camera crops, SVG diagrams, word-highlight captions, provenance chips, a mission clock, and shot drift against frozen holds. |
| `narrate-edge.js` | Edge read in beats with designed pauses and word boundaries mapped to script spelling. It never writes placeholder audio. |
| `narrate_kokoro.py` | Kokoro narration with *exact* word timing taken from the model's own predicted phoneme durations, with no estimation. This fixes the fallback path's missing word timing. |
| `sound_design.py` | Procedural bed and cues placed from shot and word times, with designed silence. |
| `mix-audio.js` | Linear narration levelling, ducking, −14 LUFS master with a limiter, and mux. |
| `qa-vertical.js` | Like-for-like QA for any vertical Short: decode, black, freeze, first-frame detail and sharpness, motion and static share, loudness, peaks, captions, acoustic caption sync. |
| `compare.sh` | Side-by-side and first-3-seconds comparison generator. |
| `build_manifests.py` | Storyboard and licence manifest generated from the render itself. |
| `film-challenger-1986/` | `script.json` (evidence per line), `scenes.js` (word-anchored shots), `media.json`, `storyboard-notes.json`. The joint, stack and decision-chain diagrams can be reused for other FR booster or seal topics. |

## 7. Recommendations for IB and CT

1. **Adopt the evidence-first opening rule.** Frame 0 is the subject itself, sharp, with a marker on the detail the first line names.
   - `qa-vertical.js` already measures it: edge energy and first-3 s static share.
   - Add both to the creative read proposed in the audit (§6), not to readiness.
2. **Make mechanism lines get mechanism visuals.** Use `fr-lib.js` diagrams for the one or two lines per Short that explain *how*.
   - IB: impact, ice or orbital physics.
   - CT: cable faults, valves, ventilation.
   - This is the direct fix for the thin licensed image pools (audit blocker 1), and it needs no new licences.
3. **Use word-timed captions everywhere.** Edge boundaries or Kokoro durations, never character share.
4. **Edit scripts as a causal chain:**
   - a hook that raises a question;
   - 3–5 linked mechanism steps;
   - one fact-checked payoff;
   - at most about 1 number per 10 s, with a citation per line in `script.json`.
5. **Test before scaling.** Run the existing `opening_visual` experiment with an `evidence-opening` arm on 5+ Shorts per arm, and decide on engaged ÷ views and % viewed.
   - Also test length: C is 52 s, and FR's best performers so far are short and finished or replayed.
   - A 30–35 s cut of C is a sensible second arm.
6. **Keep Kokoro as the fallback only after an owner listen.** Its timing path now works; the voice is still unapproved.
7. **Keep the renderer offline-only until reviewed.** It is a prototype: nothing is wired into production, and no flag was added.
