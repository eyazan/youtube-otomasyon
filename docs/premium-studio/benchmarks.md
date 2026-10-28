# Rendering performance benchmarks (BTO-301, 948 frames, 31.6 s)

**Host:** the Claude Code cloud container: Linux x86-64, 4 vCPU, 16 GB RAM, headless Chromium 1194 (Playwright 1.56.1), FFmpeg 6.1.1. **This is not the M1 MacBook Pro.** The M1 numbers have not been measured yet; see the last section.

Sources: `out/work/render-perf-*.json`, `out/production.log`, and the scratch single-worker run (`bench1.js`, same code path, empty cache).

## Picture render (frames → segments → concatenated H.264)

| Run | Resolution | Workers | Cache | Frames rendered | Wall | ms/frame (wall) | Peak Chromium RSS |
|---|---|---|---|---|---|---|---|
| Preview, cold | 540×960 | 1 | empty | 948 | 204.4 s | 215.6 | 2.0 GB |
| Preview, cold | 540×960 | 3 | empty | 948 | 125.3–129.7 s (3 runs) | 132–137 | 2.4 GB |
| Final, cold | 1080×1920 | 3 | empty | 948 | 146.9 s | 155 | 3.9 GB |
| Preview, 2 scenes edited (s5 + s6, which draws s5 in its transition) | 540×960 | 2 | 5/7 hit | 330 | 51.3 s | 155 | 2.0 GB |
| Final, 1 scene edited (s7) | 1080×1920 | 1 | 6/7 hit | 150 | 33.3 s | 222 | 2.0 GB |
| Unchanged storyboard | any | – | 7/7 hit | 0 | 0.1 s | – | – |

- **Parallelism:** 1.6× from 1 to 3 workers on 4 vCPU (ffmpeg encoders share the cores). Default workers are `min(3, cpus − 1)`; set them with `--workers N`. Each worker adds about 0.5–1 GB of Chromium memory at 1080p. On a 16 GB M1, 2–3 workers is the safe limit.
- The single-worker run partly overlapped two short Claude CLI checks, so it may be slightly pessimistic.

## Other stages

| Stage | Time | Notes |
|---|---|---|
| Narration (Kokoro preview, 7 lines, CPU) | 28.4–28.5 s | Includes model load. Edge (approved voice) was not reachable here: not measured. |
| Narration (cached) | 0 s | Hash of beats + voice mode + narrator code |
| Sound design (94 cues + bed) + mix + master (−14 LUFS) | 10.1–12.1 s | Measured together (audio stage in `production.log`) |
| QA (technical, text inspection at 4 Hz, motion, QR decode, determinism, sheets) | ~20 s | Derived: the 32.5 s fully cached run minus its 10.7 s audio stage |
| Full pipeline, cold, preview, narration cached | 2 m 37 s – 2 m 40 s | |
| Full pipeline, one scene changed, final | 1 m 28 s | |

## Determinism and safety

- **Determinism:** the same frame rendered on two fresh pages, in a different order, is byte-identical at t = 0.7, 12.3, 24.9 and 29.1 s (checked by `qa.js` on every run).
- **Retry:** a failing segment is retried once on a fresh page. This is implemented but was not triggered in these runs.
- **Resume:** segments are written as `.partial` and renamed, so an interrupted run resumes from the finished segments (exercised through cache hits; no forced interruption was tested). Stage hashes are kept in `out/run-state.json`.
- **Memory:** bounded by the number of workers. There is one page per worker and no frame buffering (frames are streamed to ffmpeg with back-pressure).

## Cost

| Item | Cost |
|---|---|
| LLM | $0: the directed storyboard needs no model call |
| Optional Claude draft | Runs through the repository's budget client (task `scene-spec`, Haiku 5.5, dry-run unless approved). Its worst-case estimate is recorded in `out/llm-usage.json`. |
| TTS | $0 (Edge free endpoint / Kokoro local) |
| Rendering | $0 (local) |

## Measuring on the M1 (next step)

```bash
BTO_PREMIUM_RENDER=preview npm run premium:video -- --channel behind-the-ordinary --topic BTO-301 --quality final --voice edge --workers 2
cat channels/behind-the-ordinary/premium/BTO-301/out/work/render-perf-final.json
```

Delete `out/work/segments/final/` first for a cold number.

For reference, the FR premium engine's documented M1 figure is 0.09 s/frame (1,668 frames in 154 s, `docs/premium/README.md`) with a similar capture loop. That engine has lighter SVG per frame, so treat it as a hint, not a prediction.
