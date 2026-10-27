"use strict";
// Premium-primary production lane, shared by every channel whose primary renderer is the premium studio:
//   GoalLore Lab always (config lane "premium"); Failure Reconstructed, ImpossibleBrief and The Hidden Logic of Things
//   when <PREFIX>_PREMIUM_PRIMARY=1 (FR_, IB_, HLT_; a repository variable, so cutover and rollback are one variable each).
// With premium primary the legacy stock renderer does not run at all: a premium refusal is that day's result
// (FAILED / BLOCKED / NO_TOPIC, reported by scripts/production-outcome.js), never a silent legacy upload. Unset the
// variable to roll the channel back to the legacy lane.
//
//   qualified topic (studio readiness: researched evidence, unpublished, not generated, not reserved)
//   -> core/pipeline/premium-publish.js run(): an owner-approved package, or with the channel's signed publication
//      policy the next qualified topic, rendered fresh at final quality with the approved voice, objective QA, the
//      publish gate, then the existing uploader (youtube-yukle.js; --dogrula when PUBLISH!=1)
//   -> otherwise one review candidate (preview mode), its publish gate evaluated, and the existing uploader in --dogrula
//      mode on the staged candidate; never uploaded from here.
// A topic is rendered for review once (idempotent); <PREFIX>_PREMIUM_FORCE=1 re-renders. With no qualified topic the day
// is skipped (NO_TOPIC): the quality bar is never lowered.
const fs = require("fs");
const path = require("path");
const cp = require("child_process");
const Channel = require("../channel-context");
const Shadow = require("./premium-shadow");

const ROOT = Channel.ROOT;
const STUDIO = path.join(ROOT, "scripts", "bto-studio", "studio.js");
const readJson = (file, fallback) => { try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch (e) { return fallback; } };

// premium is the channel's primary renderer: always for a premium-only channel, otherwise by its repository variable
const primary = (channel, env = process.env) => !channel.retired && (channel.config.lane === "premium" || (!!Shadow.PREFIX[channel.slug] && env[`${Shadow.PREFIX[channel.slug]}_PREMIUM_PRIMARY`] === "1"));

// slugs and ids the retired CriticalThread ever produced or published: never selectable on its successor
function legacySlugs() {
  const ct = Channel.getChannel("critical-thread");
  const rows = [...readJson(path.join(ct.paths.state, "published.json"), []), ...readJson(path.join(ct.paths.state, "generated.json"), [])];
  return new Set(rows.flatMap((r) => [r.slug, r.topicId, r.id]).filter(Boolean));
}

// channel-specific refusals on top of the studio readiness
function extraRefusals(channel, topic) {
  if (channel.slug !== "goal-lore-lab") return [];
  const why = [];
  if (topic.channel !== "goal-lore-lab") why.push("not a GoalLore Lab record");
  const legacy = legacySlugs(); if (legacy.has(topic.slug) || legacy.has(topic.id)) why.push("a retired CriticalThread topic");
  return why;
}

function priorities(channel) {
  const c = readJson(path.join(channel.paths.topics, "topic-candidates.json"), { topics: [] });
  return new Map((c.topics || []).map((t) => [t.id, (t.scores && t.scores.priority) || 0]));
}
const rowPriority = (row) => Number((row.scores && row.scores.priority) ?? row.priority ?? row.priority_score ?? row.score ?? 0) || 0;

// every topic of the channel's universe, loaded the way the studio loads it (FR: the researched case file)
function universeTopics(channel) {
  const Adapter = require("../../scripts/bto-studio/adapter");
  const universe = readJson(channel.paths.topicUniverse, { topics: [] }); const out = [];
  for (const row of universe.topics || []) {
    const id = row.id || row.topic_id || row.slug; if (!id) continue;
    if (channel.slug !== "failure-reconstructed") { out.push({ row, topic: row }); continue; }
    try { out.push({ row, topic: Adapter.loadTopic(channel.slug, id).topic }); } catch (e) { out.push({ row, topic: { id, slug: row.slug || id }, loadError: e.message }); }
  }
  return out;
}

// qualified, studio-ready, unpublished topics, highest priority first
function qualified(channel, { exclude = [] } = {}) {
  const Adapter = require("../../scripts/bto-studio/adapter");
  const reserved = require("./premium-publish").reserved(channel); const prio = priorities(channel);
  const rows = [];
  for (const { row, topic: t, loadError } of universeTopics(channel)) {
    const why = loadError ? [loadError] : [...extraRefusals(channel, t)];
    if (reserved.has(t.slug) || reserved.has(t.id)) why.push("reserved for a premium publication");
    if (exclude.includes(t.id) || exclude.includes(t.slug)) why.push("excluded");
    if (!loadError) why.push(...Adapter.readiness(channel, t).errors);
    rows.push({ topic: t, ok: why.length === 0, why, priority: prio.get(t.id) || rowPriority(row) });
  }
  return { ok: rows.filter((r) => r.ok).sort((a, b) => b.priority - a.priority || String(a.topic.id).localeCompare(String(b.topic.id))), refused: rows.filter((r) => !r.ok) };
}

// The studio writes the automatic storyboard to premium/<id>/storyboard.json on the first render; the MP4 and work files
// under out/ are git-ignored and travel as a workflow artifact. state/review-candidates.json records what was rendered.
const reviewDir = (channel, topic) => path.join(channel.paths.base, "premium", topic.id, "out");
const ledgerFile = (channel) => path.join(channel.paths.state, "review-candidates.json");
const ledger = (channel) => readJson(ledgerFile(channel), []);
const rendered = (channel, topic) => ledger(channel).some((r) => r.topicId === topic.id && r.objectivePass);
function record(channel, row) {
  fs.mkdirSync(path.dirname(ledgerFile(channel)), { recursive: true });
  fs.writeFileSync(ledgerFile(channel), JSON.stringify([...ledger(channel), row].slice(-200), null, 1) + "\n");
}

function renderCandidate(channel, topic, { env = process.env, spawn = cp.spawnSync, log = console.log } = {}) {
  const childEnv = { ...Shadow.childEnv(env), BTO_PREMIUM_RENDER: "preview", PUBLISH: "0" };
  const t0 = Date.now();
  const r = spawn(process.execPath, [STUDIO, "--channel", channel.slug, "--topic", topic.id, "--quality", "final", "--voice", "edge"], { cwd: ROOT, env: childEnv, stdio: "inherit", timeout: 45 * 60000 });
  const pkgFile = path.join(reviewDir(channel, topic), "review-package.json"); const pkg = readJson(pkgFile, null);
  const result = { topicId: topic.id, slug: topic.slug, exitCode: r.status, seconds: Math.round((Date.now() - t0) / 1000), verdict: pkg && pkg.verdict, objectivePass: !!(pkg && pkg.qa && pkg.qa.objectivePass), voice: pkg && pkg.voice, pkgFile: pkg ? pkgFile : null, package: pkg ? path.relative(ROOT, pkgFile) : null };
  record(channel, { topicId: topic.id, slug: topic.slug, at: new Date().toISOString(), runId: env.GITHUB_RUN_ID || null, verdict: result.verdict || null, objectivePass: result.objectivePass, voice: (result.voice && result.voice.used) || null, voiceApproved: !!(result.voice && result.voice.approved), uploaded: false });
  log(`[${channel.name}] review candidate ${topic.id}: exit ${r.status} in ${result.seconds} s, ${result.verdict || "no package"}, objective QA ${result.objectivePass ? "PASS" : "FAIL"}, voice ${(result.voice && result.voice.used) || "?"} (approved ${!!(result.voice && result.voice.approved)}); never uploaded from here`);
  return result;
}

function runChannel(slug, argv = [], { env = process.env, spawn = cp.spawnSync, log = console.log, premium = require("./premium-publish"), channel: injected = null } = {}) {
  const channel = injected || Channel.getChannel(slug);
  if (channel.retired) { log(`[${channel.name}] retired; no content produced.`); return 0; }
  if (!primary(channel, env)) throw new Error(`premium is not the primary renderer of ${channel.slug}`);
  const explicit = argv.find((a) => !a.startsWith("--"));
  const run = require("../../lib/run-stages").start(channel, { env });
  let targetDay = null;
  if (!explicit && env.PUBLISH === "1") {
    const due = require("../scheduling").channelPlan(channel).short;
    if (!due.due) { run.outcome("NOT_DUE", due.reason); log(`[${channel.name}] not due: ${due.reason}`); return 0; }
    targetDay = due.targetDay || null; run.record.targetDay = targetDay;
  }
  // 1. an approved premium Short (owner sign-offs, or the owner-signed publication policy) through the existing uploader
  if (!explicit) {
    const p = premium.run(channel, { env, targetDay, log, nextTopic: () => (qualified(channel).ok[0] || {}).topic || null });
    if (p && p.noTopic) { const why = "publication policy signed, but no qualified topic (research below the channel standard, published or reserved)"; run.skip("RESEARCH", why).outcome("NO_TOPIC", why); return 0; }
    if (p && (p.uploaded || p.dryRun)) {
      run.topic(p.slug).done("RESEARCH", p.topicId).done("RENDER", "premium final").done("QA", "objective PASS, publish gate PUBLISH_APPROVED")
        [p.uploaded ? "done" : "skip"]("UPLOAD", p.uploaded ? p.videoId || "uploaded" : "uploader --dogrula (PUBLISH!=1)");
      run.outcome(p.uploaded ? "UPLOADED" : "DRY_RUN", `premium ${p.topicId}${p.videoId ? " " + p.videoId : ""}`);
      return p.exitCode;
    }
    if (p) { run.topic(p.slug).outcome("FAILED", `premium ${p.topicId}: not uploaded, reservation kept`); return p.exitCode; }
    // a publication day with an active policy that refused: the refusal is the day's result (no legacy fallback, no
    // second render); the reason was logged by premium-publish and the next run picks again
    if (env.PUBLISH === "1" && premium.policyActive && premium.policyActive(channel, env)) {
      run.outcome("BLOCKED", "premium publication refused (see the premium publish log); nothing uploaded, legacy renderer not used");
      return 0;
    }
  }
  // 2. otherwise one review candidate: the next qualified topic not yet rendered, never uploaded
  const { ok, refused } = qualified(channel);
  const force = env[`${Shadow.PREFIX[channel.slug]}_PREMIUM_FORCE`] === "1";
  const pick = explicit ? ok.find((r) => r.topic.id === explicit || r.topic.slug === explicit) : ok.find((r) => force || !rendered(channel, r.topic));
  if (!pick) {
    const why = explicit ? `${explicit} is not a qualified ${channel.name} topic${(refused.find((r) => r.topic.id === explicit || r.topic.slug === explicit) || { why: [] }).why.map((w) => "; " + w).join("")}`
      : `${ok.length} qualified topic(s), all already rendered for review; ${refused.length} not qualified (research below the channel standard, published, generated or reserved)`;
    run.skip("RESEARCH", why).outcome("NO_TOPIC", why); log(`[${channel.name}] NO_TOPIC: ${why}`); return 0;
  }
  log(`[${channel.name}] premium primary: ${ok.length} qualified topic(s); review candidate ${pick.topic.id}`);
  run.topic(pick.topic.slug).done("RESEARCH", `${pick.topic.id} qualified (${(pick.topic.facts || []).length} sourced facts)`).done("SCRIPT", "studio adapter");
  const res = renderCandidate(channel, pick.topic, { env, spawn, log });
  if (res.exitCode !== 0 || !res.objectivePass) { run.fail("RENDER", `studio exit ${res.exitCode}, ${res.verdict || "no package"}`).outcome("FAILED", `review candidate ${pick.topic.id} did not pass objective QA`); return 0; }
  run.done("NARRATION", (res.voice && res.voice.used) || "edge").done("RENDER", `${res.seconds} s`).done("QA", "objective PASS");
  // the publish gate as it stands, and the existing uploader in --dogrula mode on the staged candidate
  const dry = premium.uploaderDryRun ? premium.uploaderDryRun(channel, pick.topic, res.pkgFile, { env, spawn, log }) : null;
  run.skip("UPLOAD", dry ? `review candidate: gate ${dry.gate || "?"}; uploader --dogrula exit ${dry.uploaderExit}` : "review candidate: publication needs approval");
  run.outcome("DRY_RUN", `review candidate ${pick.topic.id} ${res.verdict}; not uploaded${dry ? `; blocked by: ${dry.blockers.join("; ") || "nothing (approval only)"}` : ""}`);
  return 0;
}

module.exports = { runChannel, primary, qualified, legacySlugs, renderCandidate, reviewDir, ledger, universeTopics };
