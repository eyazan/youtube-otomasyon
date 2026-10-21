---
name: premium-video-producer
description: Produce a premium motion-graphics YouTube Short from an existing researched topic with the shared premium studio - readiness check, storyboard, narration, render, visual QA, revisions, review package. Routes by channel profile; today only The Hidden Logic of Things (behind-the-ordinary) renders, other channels return their rollout status. Use when asked to make, render or revise a premium/animated video. Never uploads.
argument-hint: --channel behind-the-ordinary --topic <BTO-id|slug> [--quality preview|final]
arguments: [flag1, channel, flag2, topic]
allowed-tools: Read Grep Glob Bash(node scripts/bto-studio/*) Bash(BTO_PREMIUM_RENDER=preview node scripts/bto-studio/*) Bash(ffmpeg *) Bash(ffprobe *)
---

# Premium Video Producer (master orchestration)

Arguments: `$ARGUMENTS` (channel `$channel`, topic `$topic`).

## Channel routing (scripts/bto-studio/profiles/<channel>.json)
| Channel | Mode | What the command does today |
|---|---|---|
| `behind-the-ordinary` | studio-preview | full pipeline (below) |
| `failure-reconstructed` | fr-engine | exits 3: use `scripts/fr-premium` (docs/premium/README.md); studio migration is rollout Stage 4 |
| `impossible-brief` | not-integrated | exits 3: no premium pack yet (Stage 5) |
| `goal-lore-lab` | design-only | exits 3: proposed channel, unregistered, no VERIFIED topics; only design samples: `node scripts/bto-studio/samples/render-sample.js scripts/bto-studio/samples/goal-lore-lab-physics-board.json --video` (physics pilot treatment) or `goal-lore-lab-board.json` (tactics) |
Report the refusal to the user verbatim; never work around it.

You coordinate the other studio Skills. The software lives in `scripts/bto-studio/` (one engine for every video); never write a new renderer for a topic.

## Hard rules
- Opt-in: every command runs with `BTO_PREMIUM_RENDER=preview` (or `final`, approved voice only). Without it the studio refuses.
- Never upload, publish, edit channel state, `reports/packages`, `uretim/`, the topic universe or its narration. Outputs go to `channels/behind-the-ordinary/premium/<topic>/`.
- Never bypass factual verification: the adapter refuses topics that are not `VERIFIED` + `productionReady`, or already published.
- The approved voice is Edge `en-US-EmmaMultilingualNeural +1%`. The Kokoro fallback is preview-only and makes the package `PREVIEW_ONLY_UNAPPROVED_VOICE`.
- Do not report QA results you did not measure, or describe frames you did not look at.

## Steps
1. **Load + readiness**: `node -e "const A=require('./scripts/bto-studio/adapter');const {channel,topic}=A.loadTopic('behind-the-ordinary','$topic');console.log(A.readiness(channel,topic))"`. Stop on errors and report them.
2. **Style pack**: read `channels/behind-the-ordinary/premium/style-pack.json`.
3. **Creative plan**: `node scripts/bto-studio/creative-director.js plan --channel <c> --topic <id>` proposes one technique per beat (real object, diagram, cross-section, physics, data, documentary photo ...) with reasons; never one format for every scene. After drafting, `... audit --storyboard <file>` lists slideshow risks (TEXT_ONLY, STATIC_CAMERA, CENTRED_FLAT, THIN, SAME_ENV). Fix the weakest scenes first instead of regenerating the whole video.
4. **Storyboard**: if `channels/behind-the-ordinary/premium/<topic>/storyboard.json` is missing, run the studio once with `--draft` to get a deterministic skeleton. Then apply `/visual-director` to direct it (it must replace every AUTO-DRAFT purpose).
5. **Components**: `/motion-design` and `/technical-animation` choose and, only if truly needed, extend components in `scripts/bto-studio/page/components/`. Use generic, data-driven props only.
6. **Composition**: `/cinematic-composition` checks camera, hierarchy, safe zones and transitions.
7. **Narration and audio**: `/audio-director` (narration is produced by the studio; audio cues come from the components).
8. **Preview render**: `BTO_PREMIUM_RENDER=preview node scripts/bto-studio/studio.js --channel behind-the-ordinary --topic <id> --quality preview`. For quick looks, use `--stills 0.5,3.2,...`. A revised direction is a new versioned file: `--storyboard storyboard.v2.json` renders into `out/v2/` and keeps V1.
9. **QA**: `/video-quality-review` on `out/qa-report.json`, `out/contact-sheet.png` and `out/scene-sheet.png`. Look at the images.
10. **Revise**: at most 3 passes. Each pass names the weakest scenes, fixes them in the storyboard or components, and re-renders. Unchanged segments come from cache; use `--only <scene>` for one-scene tries. Archive each pass in `out/revisions/vN/` and log it in `out/revision-history.md`.
11. **Final**: run with `--quality final` (1080x1920). It still writes only to `out/`.
12. **Package**: `out/review-package.json` holds the verdict, the traceability of each scene to its facts, licensing, performance and cost. Report the verdict honestly; flag scenes still below standard for human review.
13. **Gate**: `node scripts/bto-studio/publish-gate.js <out>/review-package.json` replays the lifecycle and prints the furthest state allowed and every blocker (licensed media approval, voice, QA, sign-offs, duplicates, channel enabled). Exit 0 only at PUBLISH_APPROVED, and even then the owner hands the MP4 to the existing uploader.

## Licensed real-world media
Photos come only from the asset registry `channels/<c>/premium/assets.json` (`node scripts/bto-studio/asset-manager.js verify --channel <c>`). Licence allowlist (CC0, PD, CC BY, CC BY-SA; never NC/ND/unknown), sha256-pinned, trademarks and people cleared, credit on frame. `approved-preview` is enough for previews; publishing needs owner `approved`. Never fetch or add an asset without recording its licence and source.

## Routine operation (no interactive session needed)
`node scripts/bto-studio/daily.js` (read-only readiness across FR, IB, BTO, GLL; CriticalThread untouched) and `node scripts/bto-studio/growth-evidence.js` (what the channels' own analytics can and cannot support). Rendering is plain Node + Chromium + FFmpeg; a model is needed only to direct a new storyboard.

See [reference.md](reference.md) for the file map and commands.
