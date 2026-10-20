# Studio file map

| Path | Role |
|---|---|
| `scripts/bto-studio/studio.js` | CLI orchestrator (stages, resume, log) |
| `scripts/bto-studio/adapter.js` | Topic → studio script (readiness, fact ids) |
| `scripts/bto-studio/storyboard.js` | Deterministic draft; optional budget-guarded Claude draft |
| `scripts/bto-studio/validate.js` + `schemas/storyboard.schema.json` | Schema, evidence and craft rules |
| `scripts/bto-studio/narrate.js` | Edge (approved) / Kokoro (preview) narration with timings |
| `scripts/bto-studio/render.js` | Scene-cached, parallel, deterministic Chromium renderer |
| `scripts/bto-studio/page/motion.js` | In-page runtime: easing, springs, anchors, camera, transitions, captions |
| `scripts/bto-studio/page/components/*.js` | Component library |
| `scripts/bto-studio/audio/sound_design.py` | Procedural SFX + music bed from animation cues |
| `scripts/bto-studio/qa.js` | Objective QA + contact sheets |
| `scripts/bto-studio/package.js` | Review package / verdict |
| `channels/behind-the-ordinary/premium/style-pack.json` | BTO visual language |
| `channels/behind-the-ordinary/premium/<topic>/` | storyboard.json, assets/, out/ |

## Commands
```bash
BTO_PREMIUM_RENDER=preview npm run premium:video -- --channel behind-the-ordinary --topic BTO-301               # preview 540x960
BTO_PREMIUM_RENDER=preview npm run premium:video -- --channel behind-the-ordinary --topic BTO-301 --quality final # 1080x1920
BTO_PREMIUM_RENDER=preview npm run premium:video -- --channel behind-the-ordinary --topic BTO-301 --stills 0.5,12  # stills only
BTO_PREMIUM_RENDER=preview npm run premium:video -- --channel behind-the-ordinary --topic BTO-301 --only s4-anatomy # one scene
BTO_PREMIUM_RENDER=final   npm run premium:video -- --channel behind-the-ordinary --topic BTO-301 --quality final --voice edge # approved voice only
npm run test:premium-studio
```
Env: `SHORTS_KOKORO_DIR` (Kokoro model dir, preview fallback), `PD_CHROMIUM` (Chromium path), `BTO_STUDIO_LLM=run` (only with an approved budget).
