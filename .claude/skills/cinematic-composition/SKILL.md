---
name: cinematic-composition
description: Review and direct composition for BTO premium Shorts - camera framing, visual hierarchy, typography, colour, depth and parallax, scene continuity, transition choreography and mobile-safe layout - without sacrificing technical clarity. Use when planning camera and layout or when frames look crowded, empty or unbalanced.
allowed-tools: Read Grep Glob Edit Bash(BTO_PREMIUM_RENDER=preview node scripts/bto-studio/*) Bash(ffmpeg *)
---

# Cinematic Composition

Frame: 1080×1920. World centre is (540, 800).

## Zones (`style-pack.json` `frame`)
- Content safe area: y 220–1290, x 72–1008.
- Caption band: y 1318–1470. Only captions go here.
- Shorts UI: bottom y > 1600; right column x > 950, y 1000–1600.
- Handle at y 112 and chips at y 182+ are reserved; keep headlines below y 300.

## Hierarchy
- One subject per frame. The subject fills 45–75% of the safe width at its key moment.
- Supporting labels are 30–40 px, leader-lined to the exact feature.
- Only one amber accent region at a time. Teal marks a second state; muted text marks context.

## Camera
- Push in to reveal detail and pull out to give context; never both in one beat.
- Zoom ≤ 1.8×, and keep 10% margin around the subject at its widest.
- Parallax: background layers `depth` 0.3, settings 0.9, subject 1.0.
- When the next scene reuses an object, end the camera so that object sits where the next scene starts (continuity cut). Compute the camera key from the world→screen mapping: `screen = C + z·(world − cam)`.

## Typography
- Display numbers use `num` (Barlow Semi Condensed); quotes use `serif` (Source Serif 4); labels use `sans` (Inter, 700–800, tracking 1.5).
- Text never sits on a busy area without the caption box or a paper card behind it.

## Transitions
- Choose by meaning (see `/visual-director`).
- Transition durations are 0.5–0.7 s. Captions and chips cross-fade with the transition, so text never ghosts.

## Review loop
Render `--stills` at each scene's 35% and 85% points (or read `out/scene-sheet.png`). For each frame ask:
- Is the subject obvious in 0.5 s?
- Is anything clipped or crowded?
- Is the eye path top → subject → caption?

Fix in the storyboard (camera keys, positions) before touching components.
