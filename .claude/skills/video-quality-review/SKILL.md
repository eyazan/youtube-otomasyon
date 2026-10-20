---
name: video-quality-review
description: Inspect a rendered BTO premium Short and write an actionable revision report - objective technical checks (black/frozen frames, text clipping and collisions, readability, timing, loudness, determinism, QR decode) separated from subjective creative evaluation (hook, clarity, composition, repetition, continuity, craftsmanship), plus factual and licensing concerns. Use after every preview render.
argument-hint: <BTO-id>
allowed-tools: Read Grep Glob Bash(node scripts/bto-studio/*) Bash(BTO_PREMIUM_RENDER=preview node scripts/bto-studio/*) Bash(ffmpeg *) Bash(ffprobe *)
---

# Video Quality Review

Topic `$ARGUMENTS`. Inputs are in `channels/behind-the-ordinary/premium/<id>/out/`: `qa-report.json` / `qa-report.md`, `contact-sheet.png` (1 frame/s), `scene-sheet.png` (35% and 85% of each scene), `text-qa.json`, `review-package.json`.

## 1. Objective (measured; never invent)
Read `qa-report.json`. Report every FAIL (it blocks) and every WARN, with its measurement. The studio measures:
- resolution, fps and codec;
- decode errors, black frames, freezes, static runs per scene;
- loudness, true peak, clipping, A/V duration match;
- caption layout and speed, caption sync vs narration onsets, loop continuity;
- text collisions, caption band, edges and font size;
- scene repetition (key-frame correlation);
- QR decode, and determinism.

If a measurement looks wrong, investigate the instrument before "fixing" the video. Example: caption font measured on the wrong element.

A check the instrument cannot measure is **UNVERIFIED** (e.g. "audio samples clipped" on FFmpeg builds without that astats field). Report it as UNVERIFIED with the substitute measurement (sample peak, true peak), never as 0 or PASS.

## 2. Subjective (look at the images)
Open both sheets with Read, then extract more frames where needed:
`ffmpeg -ss <t> -i <video> -frames:v 1 /tmp/f.png`

Score 1–5 with one sentence of evidence each:
1. visual hook
2. animation quality
3. technical clarity
4. composition
5. scene diversity
6. audio sync (listen if you can; otherwise say it was not listened to)
7. mobile readability
8. continuity
9. factual accuracy (against `review-package.json` traceability)
10. craftsmanship

## 3. Revision list
Name the **weakest scenes first**: problem → cause → concrete change (storyboard key, component prop or code) → expected effect. Limit each pass to the changes that matter most.

## 4. Record
Append the pass to `out/revision-history.md`: what was wrong, what changed, before/after measurements, and which archive (`out/revisions/vN/`).

If something remains below standard after 3 passes, flag it for human review; do not call it finished.
