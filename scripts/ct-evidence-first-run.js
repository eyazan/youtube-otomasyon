#!/usr/bin/env node
"use strict";

// CRITICALTHREAD Evidence-First V1: ONE manual, read-only, single-topic experiment.
//
//   CT_EVIDENCE_FIRST_MANUAL=1 node scripts/ct-evidence-first-run.js --manual --slug CT-265 --write=false [--out DIR] [--evidence FILE]
//
// Topic -> Wikipedia discovery -> primary-document retrieval (scripts/ct-primary-document.js)
//   -> Stage A evidence extraction with Groq + quote/number/provenance validation (ct-evidence-first.js)
//   -> Stage B grounded story + fact-linked hook audit + offline builder (ct-evidence-story.js)
//   -> the builder's online verification, only when everything offline passed
//   -> a human-review package. Nothing here promotes, writes topic records, schedules or publishes.
//
// Safety:
// - It runs only with CT_EVIDENCE_FIRST_MANUAL=1, --manual and --write=false, for one CriticalThread
//   topic from topic-universe.json (read-only). There is no schedule and no CT_RESEARCH_AUTO.
// - The provider must be Groq with no fallback (paid fallback refused before any request).
// - Stage A and Stage B share one 16,000-token topic budget and the 45,000-token run budget. Every
//   request is checked before it is sent (core/llm/longform-provider.js + Story.boundedGenerate).
//   --evidence reuses a sealed Stage A package instead of repeating Stage A.
// - Separate verdicts are kept for excerpt match, primary-document verification, structure, numbers,
//   narration support and semantic accuracy. Semantic accuracy is always NEEDS_REVIEW: the automated
//   checks cannot establish meaning, and every result requires human editorial approval.
// - Output: one JSON summary on stdout, safe provider event lines on stderr, and (with --out) an
//   evidence package and a review file written to a new directory outside the repository. No keys,
//   headers, request ids, prompts or full source documents are written.

const fs = require("fs");
const os = require("os");
const path = require("path");
const ROOT = path.join(__dirname, "..");
const Channel = require(path.join(ROOT, "core", "channel-context"));
const Provider = require(path.join(ROOT, "core", "llm", "longform-provider"));
const Builder = require(path.join(ROOT, "scripts", "ib-ct-library", "build"));
const FR = require(path.join(ROOT, "scripts", "fr-library", "build"));
const Shared = require(path.join(ROOT, "scripts", "bto-research"));
const Research = require(path.join(ROOT, "scripts", "ct-research"));
const Evidence = require(path.join(ROOT, "scripts", "ct-evidence-first"));
const Story = require(path.join(ROOT, "scripts", "ct-evidence-story"));
const Primary = require(path.join(ROOT, "scripts", "ct-primary-document"));

const SLUG = "critical-thread";
const USAGE = "Usage: CT_EVIDENCE_FIRST_MANUAL=1 node scripts/ct-evidence-first-run.js --manual --slug <CT-id|slug> --write=false [--out DIR] [--evidence FILE]";
const EXCERPT_CHARS = { secondary: 3000, primary: 5000 };
const MAX_PRIMARY_DOCUMENTS = 4;

const fail = (code) => Object.assign(new Error(code), { code });

function parseArgs(argv, env = process.env) {
  if (env.CT_EVIDENCE_FIRST_MANUAL !== "1" || !argv.includes("--manual")) throw fail("EXPLICIT_MANUAL_OPT_IN_REQUIRED");
  const value = (flag) => { const i = argv.indexOf(flag); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : null; };
  const writes = argv.filter((item) => /^--write(=|$)/.test(item));
  if (writes.length !== 1 || writes[0] !== "--write=false") throw fail("WRITE_FALSE_REQUIRED");
  const known = new Set(["--manual", "--slug", "--write=false", "--out", "--evidence"]);
  for (let i = 0; i < argv.length; i += 1) {
    if (!known.has(argv[i])) throw fail("INVALID_EXPERIMENTAL_ARGUMENTS");
    if (["--slug", "--out", "--evidence"].includes(argv[i])) i += 1;
  }
  const slug = value("--slug");
  if (!slug || argv.filter((item) => item === "--slug").length !== 1) throw fail("EXACTLY_ONE_TOPIC_REQUIRED");
  return { slug, out: value("--out"), evidence: value("--evidence") };
}

// One existing CriticalThread record, read-only. Research-only candidates (CTC-) are refused: they
// have no topic record and their promotion is a separate owner-approved step.
function findTopic(key) {
  if (/^CTC-/i.test(key)) throw fail("RESEARCH_CANDIDATES_NOT_SUPPORTED");
  const universe = JSON.parse(fs.readFileSync(Channel.getChannel(SLUG).paths.topicUniverse, "utf8"));
  const topic = universe.topics.find((item) => item.id === key || item.slug === key);
  if (!topic) throw fail("UNKNOWN_CRITICALTHREAD_TOPIC");
  return topic;
}

// The output directory must be new and outside the repository, so nothing can be committed by accident.
function outputDir(dir) {
  if (!dir) return null;
  const resolved = path.resolve(dir);
  const rel = path.relative(ROOT, resolved);
  if (!rel.startsWith("..") && !path.isAbsolute(rel)) throw fail("OUTPUT_INSIDE_REPOSITORY_REFUSED");
  if (fs.existsSync(resolved)) throw fail("OUTPUT_DIRECTORY_MUST_BE_NEW");
  return resolved;
}

const keywordsOf = (topic) => [topic.canonicalTopic || topic.topic, topic.bottleneck, topic.dependency].join(" ").toLowerCase()
  .replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((word) => word.length >= 4);

// Wikipedia articles become secondary sources; their cited primary-host links are fetched through the
// pinned, allowlisted adapter and become primary sources. A link is never evidence by itself: only a
// retrieved document's text is excerpted, and Stage A re-checks each quote against that document.
async function discoverSources(topic, deps) {
  const docs = await Research.articles(topic, deps.get);
  const report = { secondary: docs.length, primaryLinks: 0, primaryAttempted: 0, primaryRetrieved: 0, primaryFailures: {} };
  if (!docs.length) return { sources: [], documents: new Map(), report };
  const keys = keywordsOf(topic);
  const sources = docs.map((doc, index) => ({ source_id: `S${index + 1}`, kind: "secondary", url: doc.url,
    excerpt: Shared.excerpt(doc.text, keys, Math.floor(EXCERPT_CHARS.secondary / docs.length)) })).filter((source) => source.excerpt);
  const links = [];
  for (const doc of docs) for (const link of await Research.primaryLinks(doc.title, deps.get)) if (!links.includes(link)) links.push(link);
  report.primaryLinks = links.length;
  const documents = new Map();
  const retrieved = [];
  for (const url of links) {
    if (retrieved.length >= MAX_PRIMARY_DOCUMENTS) break;
    report.primaryAttempted += 1;
    try {
      const doc = await deps.fetchPrimary({ kind: "primary", url });
      if (!doc || doc.url !== url || typeof doc.text !== "string" || !doc.text.trim()) throw fail("PRIMARY_INVALID_RESULT");
      retrieved.push({ url, text: doc.text });
      documents.set(url, { url, text: doc.text, sha256: doc.body_sha256 || null, content_type: doc.content_type || null });
    } catch (error) {
      const code = /^[A-Z_]{4,64}$/.test(String(error.code || "")) ? error.code : "PRIMARY_RETRIEVAL_FAILED";
      report.primaryFailures[code] = (report.primaryFailures[code] || 0) + 1;
    }
  }
  report.primaryRetrieved = retrieved.length;
  const share = retrieved.length ? Math.floor(EXCERPT_CHARS.primary / retrieved.length) : 0;
  for (const doc of retrieved) {
    const excerpt = Shared.excerpt(doc.text, keys, share);
    if (excerpt) sources.push({ source_id: `S${sources.length + 1}`, kind: "primary", url: doc.url, excerpt });
  }
  return { sources, documents, report };
}

function count(list, key) {
  const out = {};
  for (const item of list || []) out[item[key]] = (out[item[key]] || 0) + 1;
  return out;
}

// Bucket and viral score of the would-be record, for information only (never a promotion).
function qualification(topic, record) {
  const channel = Channel.getChannel(SLUG);
  const Ctx = require(path.join(ROOT, "core", "growth", "context"));
  const Model = require(path.join(ROOT, "core", "growth", "topic-model"));
  const config = require(path.join(ROOT, "core", "growth", "config")).forChannel(channel);
  const score = Ctx.evaluate(Model.normalize(channel, Builder.merge(SLUG, topic, record)), Ctx.build(channel, { write: false })).score;
  const minimum = Number(config.viralScoring.minimumToProduce);
  const meets = score.bucket === "A" && score.ViralPotentialScore >= minimum;
  return { bucket: score.bucket, viral: score.ViralPotentialScore, viralMinimum: minimum,
    result: meets ? "MEETS_SCORE_GATES_HUMAN_REVIEW_REQUIRED" : "DOES_NOT_QUALIFY" };
}

async function run({ argv = process.argv.slice(2), env = process.env, deps: injected = null, log = (line) => process.stderr.write(line + "\n") } = {}) {
  const started = Date.now();
  const args = parseArgs(argv, env);
  const out = outputDir(args.out);
  const topic = findTopic(args.slug);
  // The real Groq generator is used unless a test injects one; it is gated before anything else.
  if (!injected || !injected.generate) {
    const gate = Research.freeProviderOnly();
    if (!gate.ok) throw fail("FREE_PROVIDER_REQUIRED");
  }
  const onEvent = (event) => { const line = Provider.describeEvent(event); if (line) log(`  · ${line}`); };
  const deps = {
    get: FR.get,
    fetchPrimary: Primary.fetchPrimaryDocument,
    generate: (input) => Provider.generateJson(input, { onEvent }),
    onlineVerify: (seed) => Builder.run(seed, { offline: false, write: false, log: () => {} }),
    story: Story.generateStory,
    ...(injected || {}),
  };
  const topicBudget = Provider.tokenBudget(Story.TOPIC_LIMIT);
  const runBudget = Provider.tokenBudget(Story.RUN_LIMIT);
  const generate = Story.boundedGenerate(deps.generate, topicBudget, runBudget);
  const report = {
    execution: injected ? "INJECTED_DEPENDENCIES_NOT_LIVE" : "LIVE", topic: topic.id, slug: topic.slug,
    stageReached: "SOURCES", sources: null, evidence: null, story: null, offlineBuilder: null, onlineVerification: { ran: false },
    verdicts: { excerptMatch: "NOT_RUN", primaryDocuments: "NOT_RUN", structure: "NOT_RUN", numbers: "NOT_RUN", narrationSupport: "NOT_RUN", semanticAccuracy: "NEEDS_REVIEW" },
    humanEditorialApprovalRequired: true, writes: "NONE", promotion: "NEVER",
  };
  const finish = (status, extra = {}) => {
    // The topic budget is charged by the provider for every attempt, retries and failed attempts
    // included, so it is the measured total (one topic per run).
    Object.assign(report, extra, { status, groq: { measured: !injected || !injected.generate, requests: topicBudget.requests, tokens: topicBudget.spent,
      topicBudget: Story.TOPIC_LIMIT, runBudget: Story.RUN_LIMIT },
      durationMs: Date.now() - started });
    return report;
  };
  try {
    // Stage A (or a sealed package from an earlier run, so Stage A is never repeated needlessly).
    let evidence;
    let documents = new Map();
    if (args.evidence) {
      // A sealed package from an earlier run replaces the Stage A model request. Its seal is only a
      // checksum, not a signature, so every quote is validated again and each primary quote is
      // re-checked against a freshly retrieved document: no Groq request, no trust in old statuses.
      const saved = Evidence.loadPackage(path.resolve(args.evidence));
      if (saved.topic_id !== topic.id) return finish("EVIDENCE_PACKAGE_TOPIC_MISMATCH");
      report.stageReached = "STAGE_A_REVALIDATION";
      const sources = saved.sources.map((s) => ({ source_id: s.source_id, kind: s.kind, url: s.url, excerpt: s.excerpt }));
      const facts = saved.approved_facts.map((f) => ({ fact_id: f.fact_id, source_id: f.source_id, claim: f.claim, verbatim_quote: f.verbatim_quote }));
      const failures = {};
      const verifyPrimary = async (source) => {
        try { return await deps.fetchPrimary({ kind: "primary", url: source.url }); }
        catch (error) { const code = /^[A-Z_]{4,64}$/.test(String(error.code || "")) ? error.code : "PRIMARY_RETRIEVAL_FAILED"; failures[code] = (failures[code] || 0) + 1; return null; }
      };
      evidence = await Evidence.validateEvidence({ topic, sources, facts, verifyPrimary });
      report.sources = { reused: true, revalidated: true, primaryFailures: failures };
    } else {
      const found = await discoverSources(topic, deps);
      report.sources = found.report;
      documents = found.documents;
      if (!found.sources.length) return finish("NO_SOURCE");
      if (found.report.primaryRetrieved < 2) return finish("INSUFFICIENT_PRIMARY_DOCUMENTS");
      report.stageReached = "STAGE_A";
      // Each quote from a primary source is re-checked against the full retrieved document, not the excerpt.
      const verifyPrimary = async (source) => (documents.has(source.url) ? { url: source.url, text: documents.get(source.url).text } : null);
      evidence = await Evidence.extractEvidence({ topic, sources: found.sources, generate, verifyPrimary, budget: topicBudget });
    }
    report.evidence = { status: evidence.status, validFacts: evidence.approved_facts.length, rejectedFacts: evidence.rejected_facts.length,
      rejectedByCode: count(evidence.rejected_facts, "code"), byEvidenceStatus: count(evidence.approved_facts, "evidence_status"),
      verifiedPrimaryDocuments: evidence.verification.distinct_primary_documents, diagnostics: evidence.verification.diagnostics };
    report.verdicts.excerptMatch = evidence.approved_facts.length ? "PASSED_FOR_APPROVED_FACTS" : "NO_APPROVED_FACTS";
    report.verdicts.primaryDocuments = evidence.verification.distinct_primary_documents >= 2 ? "AT_LEAST_TWO_DOCUMENTS_QUOTE_MATCHED" : "INSUFFICIENT";
    if (out) { fs.mkdirSync(out, { recursive: true, mode: 0o700 }); Evidence.savePackage(evidence, path.join(out, "evidence-package.json")); }
    if (evidence.status !== "READY_FOR_STORY_REVIEW_REQUIRED") return finish("INSUFFICIENT_EVIDENCE");

    // Stage B
    report.stageReached = "STAGE_B";
    const story = await deps.story({ topic, evidence, generate, budget: topicBudget });
    const unsupported = story.audit.filter((item) => item.status === "UNSUPPORTED");
    const needsReview = story.audit.filter((item) => item.status === "NEEDS_REVIEW");
    report.story = { status: story.status, unsupported: unsupported.length, unsupportedByReason: count(unsupported, "reason"),
      needsReview: needsReview.length, needsReviewByReason: count(needsReview, "reason"),
      hookCandidates: story.hooks.before.candidateCount, supportedHookCandidates: story.hooks.supportedCandidateCount,
      selectedHookScore: story.hooks.before.selectedScore, hookProblems: story.hooks.problems, hookStable: story.hooks.stable };
    report.verdicts.narrationSupport = unsupported.some((item) => /^narration\./.test(item.field)) ? "FAILED" : "PASSED_LEXICAL_ONLY";
    report.verdicts.numbers = story.audit.some((item) => item.reason === "UNTRACED_NUMBER") ? "FAILED" : "PASSED";
    report.offlineBuilder = { passed: story.offlineBuilder.passed, failures: count(story.offlineBuilder.errors.map((error) => Research.classifyVerificationError(error)), "category") };
    report.verdicts.structure = story.offlineBuilder.passed ? "PASSED_OFFLINE" : "FAILED_OFFLINE";
    report.qualification = qualification(topic, story.record);
    if (out) fs.writeFileSync(path.join(out, "review.json"), JSON.stringify(reviewFile(topic, evidence, story, report), null, 2) + "\n", { flag: "wx", mode: 0o600 });
    if (story.status !== "HUMAN_SEMANTIC_REVIEW_REQUIRED") return finish(story.status);

    // The builder's online verification runs only when every offline check passed. It is never
    // replaced by the offline result.
    report.stageReached = "ONLINE_VERIFICATION";
    const online = await deps.onlineVerify({ channel: SLUG, records: [story.record] });
    const errors = (online.report && online.report[0] && online.report[0].errors) || ["ONLINE_BUILDER_NO_REPORT"];
    report.onlineVerification = { ran: true, passed: !errors.length, failures: count(errors.map((error) => Research.classifyVerificationError(error)), "category") };
    return finish(errors.length ? "REJECTED_ONLINE_VERIFICATION" : "AUTOMATED_CHECKS_PASSED_HUMAN_REVIEW_REQUIRED");
  } catch (error) {
    const code = /^[A-Z_]{4,64}$/.test(String(error.code || error.message || "")) ? String(error.code || error.message) : "EXPERIMENT_FAILED";
    return finish("FAILED", { failure: code });
  }
}

// What an editor needs to check meaning: each fact with its quote and source URL, and each narration
// line with the fact ids it cites. No excerpts or full documents (the sealed evidence package holds
// the excerpts used).
function reviewFile(topic, evidence, story, report) {
  return {
    topic: { id: topic.id, slug: topic.slug }, semanticAccuracy: "NEEDS_REVIEW", humanEditorialApprovalRequired: true,
    facts: evidence.approved_facts.map((fact) => ({ id: fact.fact_id, claim: fact.claim, quote: fact.verbatim_quote, source: fact.source_url, evidence: fact.evidence_status })),
    narration: story.traceability, audit: story.audit, hooks: story.hooks, offlineBuilder: report.offlineBuilder, qualification: report.qualification,
  };
}

async function main() {
  try {
    const report = await run();
    process.stdout.write(JSON.stringify(report) + "\n");
    if (report.status === "FAILED") process.exitCode = 1;
  } catch (error) {
    const raw = String(error.code || error.message || "");
    process.stderr.write(JSON.stringify({ status: "REFUSED", code: /^[A-Z_]{4,64}$/.test(raw) ? raw : "EXPERIMENT_REFUSED", usage: USAGE }) + "\n");
    process.exitCode = 1;
  }
}

if (require.main === module) main();

module.exports = { run, parseArgs, findTopic, outputDir, discoverSources, qualification, USAGE, MAX_PRIMARY_DOCUMENTS };
