"use strict";
// Offline tests for the manual Evidence-First runner. Every dependency is mocked: no Groq request,
// no Wikipedia request, no document fetch, no write inside the repository.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const Run = require("../../scripts/ct-evidence-first-run");
const Evidence = require("../../scripts/ct-evidence-first");
const Primary = require("../../scripts/ct-primary-document");

const ROOT = path.join(__dirname, "..", "..");
const ENV = { CT_EVIDENCE_FIRST_MANUAL: "1" };
const ARGV = ["--manual", "--slug", "CT-265", "--write=false"];
const PRIMARY = ["https://www.fda.gov/x", "https://www.who.int/news/melamine-report", "https://www.nih.gov/news/melamine-study"];
const EVENT = "In 2008, melamine was added to Chinese dairy products and tainted milk sickened 300,000 children who drank baby formula. ";
const quote = (doc, i) => `The official report ${doc} confirms component number ${i} preceded a cascade of documented technical failures.`;
const claim = (i) => `Component ${i} preceded documented technical failures.`;
const docText = (doc) => Array.from({ length: 8 }, (_, i) => quote(doc, doc * 10 + i + 1)).join(" ");

// A small fake Wikipedia API: one event article whose citations include two primary hosts.
function wiki({ links = [PRIMARY[1], PRIMARY[2]] } = {}) {
  const calls = [];
  const get = async (url) => {
    calls.push(url);
    const q = new URL(url).searchParams;
    if (q.get("prop") === "extlinks") return { body: { query: { pages: { 1: { extlinks: links.map((l) => ({ "*": l })) } } } } };
    const page = { title: "2008 Chinese milk scandal", extract: EVENT.repeat(8) };
    return { body: { query: { pages: { 1: page }, search: [{ title: page.title }] } } };
  };
  return { get, calls };
}
const documents = { [PRIMARY[1]]: docText(1), [PRIMARY[2]]: docText(2) };
const fetchFrom = (docs = documents) => async (source) => {
  if (!docs[source.url]) throw Object.assign(new Error("PRIMARY_HTTP_NOT_OK"), { code: "PRIMARY_HTTP_NOT_OK" });
  return { url: source.url, final_url: source.url, text: docs[source.url], content_type: "text/plain", body_sha256: "a".repeat(64), bytes: 10 };
};
// The mocked "model": Stage A copies sentences from the primary excerpts it was sent; Stage B
// writes every field from fact claims verbatim.
const factsFrom = (request) => JSON.parse(request.user).sources.filter((s) => s.kind === "primary").flatMap((s) =>
  s.excerpt.split(/(?<=\.)\s+/).filter(Boolean).map((sentence) => ({ source_id: s.source_id, verbatim_quote: sentence,
    claim: claim(sentence.match(/number (\d+)/)[1]) }))).slice(0, 18).map((f, i) => ({ fact_id: `F${i + 1}`, ...f }));
function story(facts, patch = {}) {
  const field = (i) => ({ text: facts[i].claim, fact_ids: [facts[i].fact_id] });
  return { title: field(0), coreQuestion: field(1), thumbnailText: field(2),
    fields: Object.fromEntries(["dependency", "mechanism", "bottleneck", "failureConsequence", "resilience", "expectedConsequence"].map((k, i) => [k, field(i)])),
    openingCandidates: [field(3)], narration: Array.from({ length: 8 }, (_, i) => ({ ...field(i), role: "HOW_IT_WORKS", layer: "VERIFIED FACT" })),
    editorialTitles: [field(4)], visualScenes: [field(5)], ...patch };
}
function model({ extract = factsFrom, write = (facts) => story(facts), usage = 2000 } = {}) {
  const requests = [];
  const generate = async (request) => {
    requests.push(request);
    if (request.stage === "ct-evidence-first-extract") return { json: { facts: extract(request) }, usage: { total_tokens: usage } };
    const facts = JSON.parse(request.user).facts.map((f) => ({ fact_id: f.fact_id, claim: f.claim }));
    return { json: write(facts), usage: { total_tokens: usage } };
  };
  return { generate, requests };
}
const go = (deps, argv = ARGV, env = ENV) => Run.run({ argv, env, deps, log: () => {} });
const tmp = () => path.join(fs.mkdtempSync(path.join(os.tmpdir(), "ct-ef-")), "out");

const universe = () => fs.readFileSync(path.join(ROOT, "channels", "critical-thread", "topics", "topic-universe.json"));
const noOnline = () => async () => { throw new Error("online verification must not run"); };
const deps = (m, extra = {}) => ({ get: wiki().get, fetchPrimary: fetchFrom(), generate: m.generate, onlineVerify: noOnline(), ...extra });
const narrationLine = (facts, i, text) => ({ text, fact_ids: [facts[i].fact_id], role: "HOW_IT_WORKS", layer: "VERIFIED FACT" });
const withLine = (facts, text, n = 4) => { const s = story(facts); s.narration[n] = narrationLine(facts, n, text); return s; };

test("explicit manual opt-in, --write=false and exactly one existing CriticalThread topic are required", async () => {
  const m = model();
  for (const [argv, env, code] of [
    [ARGV, {}, /EXPLICIT_MANUAL_OPT_IN_REQUIRED/],
    [["--slug", "CT-265", "--write=false"], ENV, /EXPLICIT_MANUAL_OPT_IN_REQUIRED/],
    [["--manual", "--slug", "CT-265"], ENV, /WRITE_FALSE_REQUIRED/],
    [["--manual", "--slug", "CT-265", "--write=true"], ENV, /WRITE_FALSE_REQUIRED/],
    [["--manual", "--slug", "CT-265", "--write"], ENV, /WRITE_FALSE_REQUIRED/],
    [["--manual", "--slug", "CT-265", "--write=false", "--write=false"], ENV, /WRITE_FALSE_REQUIRED/],
    [["--manual", "--slug", "CT-265", "--slug", "CT-234", "--write=false"], ENV, /EXACTLY_ONE_TOPIC_REQUIRED/],
    [["--manual", "--write=false"], ENV, /EXACTLY_ONE_TOPIC_REQUIRED/],
    [[...ARGV, "--limit", "3"], ENV, /INVALID_EXPERIMENTAL_ARGUMENTS/],
    [[...ARGV, "--promote"], ENV, /INVALID_EXPERIMENTAL_ARGUMENTS/],
    [["--manual", "--slug", "CTC-001", "--write=false"], ENV, /RESEARCH_CANDIDATES_NOT_SUPPORTED/],
    [["--manual", "--slug", "CT-99999", "--write=false"], ENV, /UNKNOWN_CRITICALTHREAD_TOPIC/],
    [[...ARGV, "--out", path.join(ROOT, "tmp-review")], ENV, /OUTPUT_INSIDE_REPOSITORY_REFUSED/],
    [[...ARGV, "--out", os.tmpdir()], ENV, /OUTPUT_DIRECTORY_MUST_BE_NEW/],
  ]) await assert.rejects(go(deps(m), argv, env), code, argv.join(" "));
  assert.equal(m.requests.length, 0, "nothing is requested before the arguments are accepted");
  assert.equal(Run.findTopic("why-food-safety-laboratory-is-so-hard-to-replace").id, "CT-265");
});

test("insufficient evidence stops after Stage A: Stage B and online verification never run", async () => {
  const m = model({ extract: (request) => factsFrom(request).slice(0, 10) });
  const r = await go(deps(m));
  assert.equal(r.status, "INSUFFICIENT_EVIDENCE");
  assert.equal(r.stageReached, "STAGE_A");
  assert.deepEqual(m.requests.map((q) => q.stage), ["ct-evidence-first-extract"]);
  assert.equal(r.evidence.validFacts, 10);
  assert.ok(r.evidence.diagnostics.includes("INSUFFICIENT_VALID_FACTS"));
  assert.equal(r.story, null);
  assert.equal(r.onlineVerification.ran, false);
  assert.equal(m.requests[0].reasoningEffort, "low");
});

test("invalid quotes and numbers that are not in the quote are rejected with codes, never repaired", async () => {
  const m = model({ extract: (request) => factsFrom(request).map((f, i) => i < 3 ? { ...f, verbatim_quote: f.verbatim_quote.replace("official", "secret") }
    : i < 5 ? { ...f, claim: "Component 999 preceded documented technical failures." } : f) });
  const r = await go(deps(m));
  assert.equal(r.evidence.rejectedByCode.QUOTE_NOT_IN_EXCERPT, 3);
  assert.equal(r.evidence.rejectedByCode.CLAIM_NUMBER_NOT_IN_QUOTE, 2);
  assert.equal(r.status, "INSUFFICIENT_EVIDENCE");
  assert.equal(m.requests.length, 1);
});

test("inaccessible primary documents: nothing is sent to the model", async () => {
  const m = model();
  const r = await go(deps(m, { fetchPrimary: fetchFrom({}) }));
  assert.equal(r.status, "INSUFFICIENT_PRIMARY_DOCUMENTS");
  assert.deepEqual(r.sources.primaryFailures, { PRIMARY_HTTP_NOT_OK: 2 });
  assert.equal(m.requests.length, 0);
  assert.equal(r.groq.tokens, 0);
});

test("malicious redirects, private addresses and lookalike hosts fail closed in the real adapter", async () => {
  const m = model();
  const lookalike = "https://www.who.int.evil.example/report";
  const fetchPrimary = (source) => Primary.fetchPrimaryDocument(source, {
    resolve4: async (host) => host === "www.nih.gov" ? ["10.0.0.7"] : ["8.8.8.8"],
    requestBytes: async () => ({ status: 302, headers: { location: "https://169.254.169.254/latest/meta-data" }, body: Buffer.alloc(0) }),
  });
  const r = await go(deps(m, { get: wiki({ links: [PRIMARY[1], PRIMARY[2], lookalike] }).get, fetchPrimary }));
  assert.equal(r.status, "INSUFFICIENT_PRIMARY_DOCUMENTS");
  assert.deepEqual(r.sources.primaryFailures, { UNSAFE_PRIMARY_URL: 1, PRIMARY_NONPUBLIC_ADDRESS: 1, UNAPPROVED_PRIMARY_HOST: 1 });
  assert.equal(m.requests.length, 0);
});

test("only facts quote-matched in two retrieved primary documents reach Stage B; verdicts stay separate", async () => {
  const m = model();
  const r = await go(deps(m));
  assert.equal(r.evidence.status, "READY_FOR_STORY_REVIEW_REQUIRED");
  assert.equal(r.evidence.verifiedPrimaryDocuments, 2);
  assert.deepEqual(m.requests.map((q) => q.stage), ["ct-evidence-first-extract", "ct-evidence-first-story"]);
  const sent = JSON.parse(m.requests[0].user).sources;
  assert.deepEqual(sent.map((s) => s.kind), ["secondary", "primary", "primary"]);
  assert.equal(r.verdicts.primaryDocuments, "AT_LEAST_TWO_DOCUMENTS_QUOTE_MATCHED");
  assert.equal(r.verdicts.semanticAccuracy, "NEEDS_REVIEW");
  assert.ok(["PASSED_LEXICAL_ONLY", "FAILED"].includes(r.verdicts.narrationSupport));
  assert.ok(["PASSED_OFFLINE", "FAILED_OFFLINE"].includes(r.verdicts.structure));
  assert.equal(r.humanEditorialApprovalRequired, true);
  assert.equal(r.writes, "NONE");
  assert.equal(r.promotion, "NEVER");
  assert.equal(r.execution, "INJECTED_DEPENDENCIES_NOT_LIVE");
  assert.equal(r.groq.measured, false, "mocked usage is never reported as measured Groq usage");
});

test("unsupported narration and an untraced number are rejected before any online verification", async () => {
  for (const [text, reason, verdict] of [
    ["Engineers in Paris painted every pipe bright yellow.", "NO_FACT_SUPPORT", "narrationSupport"],
    ["Component 777 preceded documented technical failures.", "UNTRACED_NUMBER", "numbers"],
  ]) {
    const m = model({ write: (facts) => withLine(facts, text) });
    const r = await go(deps(m));
    assert.equal(r.status, "REJECTED_UNSUPPORTED", text);
    assert.equal(r.story.unsupportedByReason[reason], 1, text);
    assert.equal(r.verdicts[verdict], "FAILED", text);
    assert.equal(r.onlineVerification.ran, false);
  }
});

test("a wrong subject or unsupported causation is never marked supported: it needs human review", async () => {
  for (const [text, reason] of [
    ["The company preceded more documented technical failures.", "LEXICAL_OVERLAP_IS_NOT_SEMANTIC_PROOF"],
    [(n) => `Because component ${n} preceded documented technical failures, the station closed.`, "CAUSAL_MEANING_UNVERIFIED"],
  ]) {
    const m = model({ write: (facts) => withLine(facts, typeof text === "function" ? text(facts[4].claim.match(/\d+/)[0]) : text) });
    const r = await go(deps(m));
    assert.equal(r.story.needsReviewByReason[reason], 1, text);
    assert.equal(r.verdicts.semanticAccuracy, "NEEDS_REVIEW");
    assert.notEqual(r.status, "AUTOMATED_CHECKS_PASSED_HUMAN_REVIEW_REQUIRED");
  }
});

test("hook problems (instability, unsupported winner) stop the run; no lower-ranked hook is substituted", async () => {
  const m = model();
  let seen = null;
  const story = async (input) => {
    const real = await require("../../scripts/ct-evidence-story").generateStory(input);
    seen = real.record.openingLine;
    return { ...real, status: "REJECTED_HOOK", hooks: { ...real.hooks, problems: ["HOOK_SELECTION_UNSTABLE"], stable: false } };
  };
  const r = await go(deps(m, { story }));
  assert.equal(r.status, "REJECTED_HOOK");
  assert.deepEqual(r.story.hookProblems, ["HOOK_SELECTION_UNSTABLE"]);
  assert.equal(r.story.hookStable, false);
  assert.equal(r.onlineVerification.ran, false);
  assert.equal(typeof seen, "string");
  // The real hook audit on mocked facts: too few candidates is reported, not worked around.
  const plain = await go(deps(model()));
  assert.ok(plain.story.hookProblems.includes("INSUFFICIENT_HOOK_CANDIDATES"));
  assert.equal(plain.status, "REJECTED_HOOK");
});

test("online verification runs only after every offline check passed, and is reported separately", async () => {
  const passed = async (input) => ({ ...(await require("../../scripts/ct-evidence-story").generateStory(input)), status: "HUMAN_SEMANTIC_REVIEW_REQUIRED" });
  let seeds = [];
  const ok = await go(deps(model(), { story: passed, onlineVerify: async (seed) => { seeds.push(seed); return { report: [{ errors: [] }] }; } }));
  assert.equal(seeds.length, 1);
  assert.equal(seeds[0].channel, "critical-thread");
  assert.equal(ok.status, "AUTOMATED_CHECKS_PASSED_HUMAN_REVIEW_REQUIRED");
  assert.equal(ok.onlineVerification.ran, true);
  assert.equal(ok.execution, "INJECTED_DEPENDENCIES_NOT_LIVE", "a mocked online check is never reported as live");
  assert.equal(ok.verdicts.semanticAccuracy, "NEEDS_REVIEW");
  const bad = await go(deps(model(), { story: passed, onlineVerify: async () => ({ report: [{ errors: ["fact 3: quote not found at https://www.who.int/news/melamine-report"] }] }) }));
  assert.equal(bad.status, "REJECTED_ONLINE_VERIFICATION");
  assert.equal(bad.onlineVerification.passed, false);
  const none = await go(deps(model(), { story: passed, onlineVerify: async () => ({}) }));
  assert.equal(none.status, "REJECTED_ONLINE_VERIFICATION", "a missing online report never counts as a pass");
});

test("token budgets: Stage A and Stage B share 16,000 tokens and an over-budget request is never sent", async () => {
  const m = model({ usage: 13500 });
  const r = await go(deps(m));
  assert.equal(r.status, "FAILED");
  assert.equal(r.failure, "EVIDENCE_FIRST_BUDGET_EXHAUSTED");
  assert.equal(m.requests.length, 1, "Stage B was refused before it was sent");
  assert.equal(r.groq.tokens, 13500);
  assert.equal(r.groq.topicBudget, 16000);
  assert.equal(r.groq.runBudget, 45000);
  const silent = model({ usage: undefined });
  const s = await go(deps({ generate: async (q) => { silent.requests.push(q); return { json: { facts: [] } }; } }));
  assert.equal(s.failure, "EVIDENCE_FIRST_UNACCOUNTED_USAGE", "unreported usage fails closed instead of counting as zero");
});

test("provider failures end the run with a safe code and no secret, header or prompt text", async () => {
  const leak = Object.assign(new Error("401 Authorization: Bearer gsk_live_SECRET x-request-id req_123"), { requestId: "req_123" });
  for (const [error, failure] of [[Object.assign(new Error("rate"), { code: "RATE_LIMIT" }), "RATE_LIMIT"], [leak, "EXPERIMENT_FAILED"]]) {
    const r = await go(deps({ generate: async () => { throw error; } }));
    assert.equal(r.status, "FAILED");
    assert.equal(r.failure, failure);
    const text = JSON.stringify(r);
    for (const secret of ["gsk_", "Bearer", "Authorization", "req_123", "Return JSON only"]) assert.equal(text.includes(secret), false, secret);
  }
});

test("a paid or non-Groq provider is refused before any request when the real generator would be used", async () => {
  const keys = ["LONGFORM_LLM", "LONGFORM_LLM_PROVIDER", "LONGFORM_LLM_FALLBACK_PROVIDER", "GROQ_API_KEY", "ANTHROPIC_API_KEY"];
  const saved = Object.fromEntries(keys.map((k) => [k, process.env[k]]));
  const w = wiki();
  try {
    for (const env of [{}, { LONGFORM_LLM_PROVIDER: "anthropic", ANTHROPIC_API_KEY: "x" },
      { LONGFORM_LLM_PROVIDER: "groq", GROQ_API_KEY: "x", LONGFORM_LLM_FALLBACK_PROVIDER: "anthropic" }, { LONGFORM_LLM_PROVIDER: "groq" }]) {
      for (const k of keys) delete process.env[k];
      Object.assign(process.env, env);
      await assert.rejects(go({ get: w.get, fetchPrimary: fetchFrom(), onlineVerify: noOnline() }), /FREE_PROVIDER_REQUIRED/, JSON.stringify(env));
    }
    assert.equal(w.calls.length, 0, "refused before any source request");
  } finally { for (const k of keys) { if (saved[k] === undefined) delete process.env[k]; else process.env[k] = saved[k]; } }
});

test("a sealed evidence package is reused without repeating Stage A, and is re-verified against the documents", async () => {
  const out = tmp();
  const first = await go(deps(model()), [...ARGV, "--out", out]);
  assert.equal(first.evidence.status, "READY_FOR_STORY_REVIEW_REQUIRED");
  const file = path.join(out, "evidence-package.json");
  assert.equal(fs.statSync(file).mode & 0o777, 0o600);
  const review = JSON.parse(fs.readFileSync(path.join(out, "review.json"), "utf8"));
  assert.equal(review.semanticAccuracy, "NEEDS_REVIEW");
  assert.ok(review.facts.every((f) => f.quote && /^https:\/\//.test(f.source)));
  assert.equal(review.narration.length, 8);
  assert.equal(JSON.stringify(review).includes(docText(1)), false, "full documents are not copied into the review file");

  const m = model();
  const w = wiki();
  let fetched = 0;
  const again = await go(deps(m, { get: w.get, fetchPrimary: async (s) => { fetched++; return fetchFrom()(s); } }), [...ARGV, "--evidence", file]);
  assert.deepEqual(m.requests.map((q) => q.stage), ["ct-evidence-first-story"], "Stage A is not requested again");
  assert.equal(w.calls.length, 0);
  assert.equal(fetched, 2, "each primary document is retrieved again to re-check its quotes");
  assert.equal(again.sources.reused, true);
  assert.equal(again.evidence.verifiedPrimaryDocuments, 2);

  // A package whose document no longer matches is demoted, not trusted for its old status.
  const changed = await go(deps(model(), { fetchPrimary: fetchFrom({ [PRIMARY[1]]: docText(1), [PRIMARY[2]]: "an unrelated page" }) }), [...ARGV, "--evidence", file]);
  assert.equal(changed.status, "INSUFFICIENT_EVIDENCE");
  assert.equal(changed.evidence.byEvidenceStatus.EXCERPT_MATCHED, 8);

  // Tampering breaks the seal; another topic's package is refused.
  const pkg = JSON.parse(fs.readFileSync(file, "utf8"));
  const tampered = path.join(path.dirname(out), "tampered.json");
  fs.writeFileSync(tampered, JSON.stringify({ ...pkg, approved_facts: pkg.approved_facts.slice(1) }));
  assert.equal((await go(deps(model()), [...ARGV, "--evidence", tampered])).failure, "EVIDENCE_INTEGRITY_FAILED");
  const { integrity_sha256, ...rest } = pkg;
  const other = path.join(path.dirname(out), "other.json");
  fs.writeFileSync(other, JSON.stringify(Object.assign({ ...rest, topic_id: "CT-234" }, { integrity_sha256: require("node:crypto").createHash("sha256").update(JSON.stringify({ ...rest, topic_id: "CT-234" })).digest("hex") })));
  assert.equal((await go(deps(model()), [...ARGV, "--evidence", other])).status, "EVIDENCE_PACKAGE_TOPIC_MISMATCH");
  assert.ok(Evidence.verifyIntegrity(pkg));
  fs.rmSync(path.dirname(out), { recursive: true, force: true });
});

test("production isolation: no topic writes, no production caller, a dispatch-only read-only workflow", async () => {
  const before = universe();
  await go(deps(model()));
  assert.deepEqual(universe(), before, "topic-universe.json is unchanged");
  const callers = [];
  const walk = (dir) => { for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", ".git", "tests", "docs"].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(js|ya?ml)$/.test(entry.name) && fs.readFileSync(full, "utf8").includes("ct-evidence-first-run")) callers.push(path.relative(ROOT, full));
  } };
  for (const dir of ["scripts", "core", ".github"]) walk(path.join(ROOT, dir));
  assert.deepEqual(callers.sort(), [".github/workflows/ct-evidence-first-manual.yml", "scripts/ct-evidence-first-run.js"]);
  const workflow = fs.readFileSync(path.join(ROOT, ".github", "workflows", "ct-evidence-first-manual.yml"), "utf8").replace(/^\s*#.*$/gm, "");
  assert.doesNotMatch(workflow, /schedule:|cron:|CT_RESEARCH_AUTO|--write=true|git (commit|push)|contents: write|ANTHROPIC|FALLBACK_PROVIDER: [^'\s]/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /contents: read/);
  assert.match(workflow, /--write=false/);
  assert.match(workflow, /inputs\.confirm == 'RUN-ONE-TOPIC-READ-ONLY'/);
  const research = fs.readFileSync(path.join(ROOT, ".github", "workflows", "ct-research.yml"), "utf8");
  assert.doesNotMatch(research, /evidence-first/i, "the production research workflow is untouched");
  const source = fs.readFileSync(path.join(ROOT, "scripts", "ct-evidence-first-run.js"), "utf8");
  assert.doesNotMatch(source, /writeQualified|researchOne|topicUniverse[^)]*writeFileSync|write:\s*true/);
});
