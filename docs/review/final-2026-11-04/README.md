# Final owner review (2026-11-04)

There is one package per channel. Each has the final MP4, title, description, research sources, technical QA,
creative findings, and the exact decision required from you.

| channel | package | decision |
|---|---|---|
| ImpossibleBrief | [IB-EAR-001.md](IB-EAR-001.md) | Review L1, L5 and L7, and give a creative verdict (one JSON file in your name) |
| Failure Reconstructed | [FR-costa-concordia-2012.md](FR-costa-concordia-2012.md) | Creative, factual and publish approval for this render (reserve and sign) |
| The Hidden Logic of Things | [BTO-156.md](BTO-156.md) | Fix OAuth first, then research review and per-video approval |
| GoalLore Lab | [GLL-021.md](GLL-021.md) | Pick a voice (Ryan, Thomas or Christopher), then research review and per-video approval |

Nothing here is approved. No approval record exists for any of the four, and code never writes one.

MP4 artifacts are kept for 30 days. Each review branch `review/render-<run>-<topic>` holds:
- `full/s*.jpg`: the whole MP4 at 2 frames per second, 8 frames (4 s) per sheet;
- `contact-sheet.jpg`;
- `qa-report.md`;
- `storyboard.json`;
- `review-package.json`.
