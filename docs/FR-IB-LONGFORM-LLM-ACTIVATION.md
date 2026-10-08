# Long-form LLM activation: safe operator checklist

Current FR/IB CI evidence: 46 growth tests + 2 report tests + 2 writer-preflight tests passed; both documentary candidates are **BLOCK** due to insufficient script depth. The CI preflight reports `UNCONFIGURED`. This is a missing long-form writer configuration, **not** a reason to lower quality gates.

## What an authorized operator must do
1. Pick one explicitly approved provider supported by `core/llm/longform-provider.js`: `groq` or `anthropic`. Review rate limits, data handling, model accuracy and price. Set a modest budget/limit before using paid generation.
2. Add the provider's API key to GitHub Actions repository **Secrets** (not a plain-text variable or a commit): `GROQ_API_KEY` or `ANTHROPIC_API_KEY`. The key must never be committed or printed.
3. Set repository **Variables** `LONGFORM_LLM_PROVIDER` to `groq` or `anthropic`, with an explicitly selected model if required. A variable does **not** automatically become an environment variable in Actions: the workflow must map `vars.LONGFORM_LLM_PROVIDER` and `secrets.GROQ_API_KEY` (or `ANTHROPIC_API_KEY`) into the specific opt-in job's `env`.
4. Do **not** add these credentials to the existing scheduled production workflow. Use an independently approved, manually dispatched `dry_run` job with `PUBLISH=0`, `FR_LONGFORM_PUBLISH=0`, `IB_LONGFORM_PUBLISH=0` and no YouTube OAuth credentials or upload command. Never rely on a hidden default or paid fallback.
5. Run a single-topic FR test first. Inspect source-to-claim citations, model JSON validity, human-readable opening, section originality, factual assertions, `COPY_RISK`, `INSUFFICIENT_DEPTH` and generated words/minutes; then run a single-topic IB test and audit speculative assumptions.
6. Only when the generated script is long enough **because of evidenced content**, review full audio/visual rendering in a separate non-publishing sandbox. Sign off footage licences and thumbnails manually.
7. Merge PR #195 only after all branch test workflows pass and production Shorts regression tests pass. **Merging code does not authorize publishing long-form.** Keep `FR_LONGFORM_PUBLISH` and `IB_LONGFORM_PUBLISH` off until a separate release decision.

## Verified blocker
- FR Challenger: ~2.2 minutes from deterministic preview.
- IB Europa: ~1.8 minutes from deterministic preview.
- Both fail `INSUFFICIENT_DEPTH`; green CI tests do not lift those blocks.
- The workflow currently doesn't map or configure a long-form LLM provider, therefore *a full LLM long-form production test has not yet happened*.

## Troubleshooting
- Preflight says `UNCONFIGURED`: review both provider **variable** and **secret**, in the actual job environment.
- Preflight says `CONFIGURED_NOT_TESTED`: credentials exist but model calls, text depth, accuracy and cost remain unverified.
- Research fetch fails: check connectivity, content licence and whether primary-source enrichment is sufficient; do not pad Wikipedia paraphrases.
- Long-form remains blocked: examine actual per-channel `LONGFORM-READINESS.md` and the two long-form dry-run reports, not the CI success badge.
