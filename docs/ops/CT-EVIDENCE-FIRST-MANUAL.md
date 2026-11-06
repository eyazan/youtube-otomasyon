# CriticalThread Evidence-First: manual original-document adapter (experimental)

No production workflow imports these modules. No automatic scheduling, Groq calls, topic writes, publishing, uploads, paid APIs or Cloudflare changes.

## Scope

- scripts/ct-primary-document.js securely fetches a **single** source marked primary (host restrictions from core/research). Restricts to HTTPS official-domain exact/suffix matches, pins a public IPv4 A record into TLS connection, retains normal TLS certificate verification and SNI, rejects private/metadata IPs, custom ports, cookies, cross-host redirects, oversized bodies and compressed responses. Maximum 8 MiB, 15 seconds per fetch, two same-host redirects, 500,000 extracted characters. IPv6-only hosts fail closed.
- HTML and plain-text content are parsed without executing JavaScript. PDF extraction requires a locally installed pdftotext binary (no shell invocation); malformed, oversized, unavailable or unreadable PDFs fail closed. Rendered, scanned or heavily scripted pages may be impossible to verify in V1. An HTML text extraction is **not** evidence of semantic correctness.
- createPrimaryVerifier() returns a trusted retrieval callback compatible with scripts/ct-evidence-first.js validateEvidence(). This verifies a matched quote against independently fetched original document text, not merely Wikipedia excerpts or reachability.
- scripts/ct-evidence-first-manual.js allows precisely two manual operations: a one-document metadata-only probe or a fully mocked offline two-stage replay. It requires BOTH --manual and CT_EVIDENCE_FIRST_MANUAL=1; it neither writes files nor calls Groq.

## Commands

Manual **original document** probe (one HTTPS retrieval; not a Groq call):

    CT_EVIDENCE_FIRST_MANUAL=1 node scripts/ct-evidence-first-manual.js --manual --probe-primary 'https://www.nasa.gov/YOUR-EXACT-DOCUMENT-PATH'

Manual **fully mocked** offline replay with an owner-created local fixture:

    CT_EVIDENCE_FIRST_MANUAL=1 node scripts/ct-evidence-first-manual.js --manual --fixture /path/to/local-fixture.json

Fixture keys: topic (id, slug, category), sources [{source_id,kind,url,excerpt}], facts [{fact_id,source_id,claim,verbatim_quote}], story (Stage B shape), original_documents mapping source IDs to **MOCKED** document text. Do not treat a mocked PRIMARY_SOURCE_VERIFIED result as an actual source verification. Offline replay prints only stage counts and status; mock token accounting must not be interpreted as measured Groq consumption.

Tests:

    node --test tests/js/ct-primary-document.test.js

## Current blockers before a live CT research experiment

The adapter itself does not call Groq; the manual runner below does, only when the owner runs it. It does not prove factual meaning, quote-page authenticity in rendered PDFs, or semantic correctness. Existing strict hook selection may still reject all records. To test with real Groq later: review evidence source identity, add a separate opt-in one-topic non-writing model adapter with hard budgets and audit-safe output, obtain owner approval, and only then run it. Do not connect to CT_RESEARCH_AUTO or modify production queues.

## Manual single-topic Groq experiment (scripts/ct-evidence-first-run.js)

One manual, read-only run of the whole Evidence-First chain for **one existing** CriticalThread topic. Owner approval is required before every live run.

    CT_EVIDENCE_FIRST_MANUAL=1 node scripts/ct-evidence-first-run.js --manual --slug CT-265 --write=false --out /tmp/ct-ef-CT-265

Or, once the workflow exists on the default branch: Actions → "CriticalThread Evidence-First manual experiment" → slug `CT-265`, confirm `RUN-ONE-TOPIC-READ-ONLY`. It is dispatch-only (no schedule, not tied to CT_RESEARCH_AUTO), has a read-only repository token and no commit step, and keeps the review package as a 7-day run artifact.

Chain:
1. Wikipedia discovery (`ct-research.js` `articles`). The articles are **secondary** sources.
2. Their cited primary-host links go through the pinned adapter (at most 4 documents). Each retrieved document becomes a **primary** source. Fewer than 2 retrieved documents stops the run before any model request.
3. Stage A: Groq extracts the facts. Quote, number and duplicate checks run, and each primary quote is re-checked against the full retrieved document (`PRIMARY_SOURCE_VERIFIED`). The run needs ≥16 valid facts and ≥2 verified primary documents; otherwise it stops at `INSUFFICIENT_EVIDENCE`.
4. Stage B: grounded story, fact-linked fields, hook audit and the offline builder. An unsupported top hook is refused, never replaced by a lower-ranked one.
5. The builder's **online** verification runs only when every offline check passed. A clean offline result is never reported as online verification.

Rules:
- Tokens: Stage A and Stage B share one 16,000-token topic budget (45,000 per run). Every request is checked before it is sent, at low reasoning effort, with bounded retries. An over-budget request is refused, not sent. Groq only, and a configured fallback is refused.
- Reuse: `--evidence FILE` reuses a sealed package from an earlier `--out` directory, so Stage A is not requested again. Its quotes are re-validated and its primary documents retrieved again; the old statuses are not trusted.
- Verdicts are separate: `excerptMatch`, `primaryDocuments`, `structure`, `numbers`, `narrationSupport` (lexical only) and `semanticAccuracy`. `semanticAccuracy` is always `NEEDS_REVIEW`, and human editorial approval is always required.
- Mocked runs: `execution` is `INJECTED_DEPENDENCIES_NOT_LIVE` and `groq.measured` is false whenever any dependency was injected.
- Output: a JSON report on stdout and safe provider event lines on stderr. With `--out`, a new directory outside the repository holds `evidence-package.json` (the excerpts used, sealed) and `review.json` (each fact with its quote and source URL, narration traceability, the audit, hooks, the builder result and the score). Both are mode 0600. There are no keys, headers, request IDs, prompts or full documents.
- Nothing is written to topic records, promoted, scheduled, rendered or published.

Tests: `node --test tests/js/ct-evidence-first-run.test.js` (all mocked; no Groq, Wikipedia or document request).
