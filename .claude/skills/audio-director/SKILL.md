---
name: audio-director
description: Direct narration and sound for BTO premium Shorts - reuse the approved Edge voice (Kokoro only as a marked preview fallback), align visuals to measured word times, place synthesised sound effects on animation cues, keep a controlled music bed, master without clipping. Use when producing or checking a premium BTO soundtrack.
allowed-tools: Read Grep Bash(node scripts/bto-studio/*) Bash(BTO_PREMIUM_RENDER=preview node scripts/bto-studio/*) Bash(python3 -I scripts/bto-studio/audio/*) Bash(ffmpeg *) Bash(ffprobe *)
---

# Audio Director

## Voice (never substitute silently)
- The approved voice is `channels/behind-the-ordinary/config.json` `voice`: Edge `en-US-EmmaMultilingualNeural`, rate `+1%`. `scripts/bto-studio/narrate.js` uses it through the existing `scripts/fr-premium/narrate-edge.js`, with measured word boundaries.
- If Edge is unreachable **and** `BTO_PREMIUM_RENDER=preview`, the repo's pinned Kokoro-82M fallback (`lib/shorts-tts.js`, voice `af_heart`) narrates.
  - It is recorded as `approved: false` with estimated word timing.
  - The package becomes `PREVIEW_ONLY_UNAPPROVED_VOICE`.
  - Say so in every report, and re-narrate with `--voice edge` on a machine that reaches Edge.
- The narration text is the topic's. Pronunciation fixes go to the spoken form only (e.g. years via `spokenForm`); captions keep the script's spelling.

## Sound design
- Effects and the music bed are synthesised by `scripts/bto-studio/audio/sound_design.py` from `out/audio/cues.json`. Components emit those cues at the moment they move, so effects land on the animation.
- Kinds: `tick pop lock sweep read roll paper whoosh transition-* pluck reject match chime lift drop type`. There are no samples, so nothing needs licensing.
- Keep effects sparse: one per visual event. Ticks for many small elements are thinned (≤ 10 per gesture).
- The music bed is a slow warm pad that resolves to the tonic at the payoff chime, at level 0.11 before ducking.

## Mix and master
`scripts/fr-premium/mix-audio.js`:
- narration is levelled to −16 LUFS;
- effects and music are side-chain ducked under the voice;
- the master is −14 LUFS integrated, limited so true peak stays ≤ −1 dBTP after AAC.

QA (`qa.js`) checks clipping, loudness, true peak, A/V duration and caption sync against narration onsets.

## Listening checklist (human)
- Is the voice intelligible over the bed on phone speakers?
- No effect masks a stressed word.
- Nothing distracting in the first second.
- The payoff chime arrives with the final visual resolve.
