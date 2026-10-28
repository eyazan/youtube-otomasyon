# Recovery report (session resumed 2026-10-20)

Everything below was re-checked against the working tree in this session, not taken from earlier summaries.

## Repository state found

| Item | Found |
|---|---|
| Branch / worktree | `main` @ `2058954`, single worktree, **nothing committed or pushed** by the studio work |
| Tracked files modified | 2: `package.json` (+3 npm scripts), `docs/premium/README.md` (+2 lines pointing to the studio) |
| Untracked | `.claude/skills/` (7 Skills), `scripts/bto-studio/`, `channels/behind-the-ordinary/premium/`, `docs/premium-studio/`, `tests/js/bto-studio.test.js` |
| "About 25 files modified" (earlier summary) | **Inaccurate.** It was 2 tracked files plus untracked trees (~90 files). Corrected here. |
| Media | Present and ignored by the root `.gitignore` (`*.mp4`, `*.png`, `*.wav`): V1 final/preview MP4, contact/scene sheets, comparison MP4 |
| Environment | `node_modules` present; Python `segno`, `zxing-cpp`, `kokoro-onnx` present; Kokoro model files in the session scratchpad; Edge TTS host still blocked (proxy) |
| Channel registry | FR, IB, **CriticalThread enabled**; BTO, ProfitDecoded disabled. **GoalLore Lab absent everywhere.** |
| Workflows | 29 files; 38 references to `critical-thread`; none reference the studio |

## Verification results

### VERIFIED COMPLETE (re-run in this session, with output)

| What | Evidence |
|---|---|
| Tests | `npm test`: 915/915 JS + Python 31 OK at resume. After this session: **921/921** JS + Python OK. |
| Studio pipeline on BTO-301 | Cached final run: 7/7 segments cached; QA PASS; package `PREVIEW_ONLY_UNAPPROVED_VOICE`. |
| Narration is real speech | `lib/speech-check.js` on `out/narration/narration.wav`: ok; voiced 78%, 2.56 words/s, longest silence 0.56 s. Now a QA row. |
| Narration sync | Caption sync against narration onsets: max 8 ms (V1), 42 ms (V2). Cue starts are measured onsets. Inside-line word times are estimated (Kokoro), and labelled so. |
| Skills discoverable | A fresh `claude -p` lists all 7 (re-checked after this session's edits). Invocation with `--channel/--topic` substitution was verified earlier. |
| Isolation | Isolation tests pass. No workflow or root production script references the studio. |
| Evidence gate strictness | BTO-016 is refused by the adapter (no verbatim quotes; already published). |

### PARTIALLY COMPLETE (at resume)

| What | Status |
|---|---|
| Audio clipping metric | At resume, `qa-vertical.js` parsed an astats field FFmpeg 6.1 no longer prints, so the row passed with an empty count. **Fixed:** that row is now `UNVERIFIED`, never PASS or 0, and two measured substitutes were added (sample peak −1.89 dBFS; flat factor 0). |
| V1 visual quality | Technically valid but not premium enough (owner review). Addressed by V2. |
| Benchmarks | Measured on the 4-vCPU Linux container, not on the M1. Still true. |

### NOT VERIFIED

- **Approved Edge narration.** The host is unreachable from this container: no Emma narration exists, and the voice has never been listened to by a person.
- **M1 performance.**
- Listening quality of the mix.

### NOT IMPLEMENTED (at resume)

- Multi-channel premium architecture.
- GoalLore Lab.
- Lifecycle states.
- Daily automation.

All four were done in this session at design or foundation level; see the documents below.

## BTO-016 evidence enrichment (proposal; no quotes fabricated)

- **Finding:** BTO-016 has 16 facts, each with a claim, source and URL, but **no `quote` field**. It predates the quote-verified launch batch (`topics/research-seeds/launch-batch-1.json` has 6 records; BTO-016 is not among them). It is also **already published** (`ZTtPwqBSxpA`), so the studio refuses it on two grounds.
- **Safe path** (keeps the standard; uses the repository's existing verifier):
  1. Add a seed record for BTO-016 with candidate quotes taken by a person or model *from the fetched source text*.
  2. Run `scripts/ib-ct-library/build.js` on a machine that can reach `levistrauss.com` (unreachable here: DNS blocked). It fetches each source and rejects any quote of fewer than 5 words or not found verbatim (`quoteFound`). Only matching quotes are merged.
  3. Facts whose quote cannot be found are dropped or rewritten from what the source does say. They are never kept unquoted.
  4. Because BTO-016 is published, a premium remake also needs owner approval (same rule as FR remakes).

  No quote was written for it in this session.
