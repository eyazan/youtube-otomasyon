"use strict";
// GoalLore Lab production lane (premium only). It replaces CriticalThread on the same, renamed YouTube channel; nothing of
// CriticalThread (topics, scripts, branding, state) is read except to refuse its slugs.
//   football topic -> research (scripts/gll-research/verify.js: VERIFIED, verbatim quotes) -> script (studio adapter)
//   -> automatic storyboard (scripts/bto-studio/auto/goal-lore-lab.js) -> narration (Edge) -> premium render -> QA
//   -> review package -> publish gate -> existing uploader (youtube-yukle.js), the last two ONLY through
//      core/pipeline/premium-publish.js: an owner-reserved topic whose creative, factual and publish sign-offs match the
//      rendered content hash, with GLL_PREMIUM_PUBLISH=1, the approved voice (BTO_PREMIUM_RENDER=final) and the registry
//      entry enabled. Without all of them nothing is uploaded.
// Otherwise the lane renders the next verified, unpublished topic as a review candidate (preview mode, never uploaded),
// so the owner always has a package to listen to and sign. A topic is rendered once (idempotent); <GLL>_PREMIUM_FORCE=1
// re-renders. With no verified topic the day is skipped (NO_TOPIC): the quality bar is never lowered.
const fs = require("fs");
const path = require("path");
const cp = require("child_process");
const Channel = require("../channel-context");
const Shadow = require("./premium-shadow");

const ROOT = Channel.ROOT;
const STUDIO = path.join(ROOT, "scripts", "bto-studio", "studio.js");
const readJson = (file, fallback) => { try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch (e) { return fallback; } };

// slugs and ids the retired CriticalThread ever produced or published: never selectable here
function legacySlugs() {
  const ct = Channel.getChannel("critical-thread");
  const rows = [...readJson(path.join(ct.paths.state, "published.json"), []), ...readJson(path.join(ct.paths.state, "generated.json"), [])];
  return new Set(rows.flatMap((r) => [r.slug, r.topicId, r.id]).filter(Boolean));
}

function priorities(channel) {
  const c = readJson(path.join(channel.paths.topics, "topic-candidates.json"), { topics: [] });
  return new Map((c.topics || []).map((t) => [t.id, (t.scores && t.scores.priority) || 0]));
}

// verified, studio-ready, unpublished GoalLore Lab topics, highest candidate priority first
function qualified(channel, { exclude = [] } = {}) {
  const Adapter = require("../../scripts/bto-studio/adapter");
  const universe = readJson(channel.paths.topicUniverse, { topics: [] });
  const legacy = legacySlugs(); const reserved = require("./premium-publish").reserved(channel); const prio = priorities(channel);
  const rows = [];
  for (const t of universe.topics || []) {
    const why = [];
    if (t.channel !== "goal-lore-lab") why.push("not a GoalLore Lab record");
    if (legacy.has(t.slug) || legacy.has(t.id)) why.push("a retired CriticalThread topic");
    if (reserved.has(t.slug) || reserved.has(t.id)) why.push("reserved for an approved premium publication");
    if (exclude.includes(t.id)) why.push("excluded");
    const r = Adapter.readiness(channel, t); why.push(...r.errors);
    rows.push({ topic: t, ok: why.length === 0, why, priority: prio.get(t.id) || 0 });
  }
  return { ok: rows.filter((r) => r.ok).sort((a, b) => b.priority - a.priority || a.topic.id.localeCompare(b.topic.id)), refused: rows.filter((r) => !r.ok) };
}

// The studio writes the automatic storyboard to premium/<id>/storyboard.json on the first render (tracked: the owner's
// approval hash covers it, and the final render reuses it); the MP4 and work files under out/ are git-ignored and travel
// as a workflow artifact. state/review-candidates.json records what was rendered, so a fresh runner does not redo it.
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
  const pkg = readJson(path.join(reviewDir(channel, topic), "review-package.json"), null);
  const result = { topicId: topic.id, slug: topic.slug, exitCode: r.status, seconds: Math.round((Date.now() - t0) / 1000), verdict: pkg && pkg.verdict, objectivePass: !!(pkg && pkg.qa && pkg.qa.objectivePass), voice: pkg && pkg.voice, package: pkg ? path.relative(ROOT, path.join(reviewDir(channel, topic), "review-package.json")) : null };
  record(channel, { topicId: topic.id, slug: topic.slug, at: new Date().toISOString(), runId: env.GITHUB_RUN_ID || null, verdict: result.verdict || null, objectivePass: result.objectivePass, voice: (result.voice && result.voice.used) || null, voiceApproved: !!(result.voice && result.voice.approved), uploaded: false });
  log(`[${channel.name}] review candidate ${topic.id}: exit ${r.status} in ${result.seconds} s, ${result.verdict || "no package"}, objective QA ${result.objectivePass ? "PASS" : "FAIL"}, voice ${(result.voice && result.voice.used) || "?"} (approved ${!!(result.voice && result.voice.approved)}); never uploaded from here`);
  return result;
}

function runChannel(slug = "goal-lore-lab", argv = [], { env = process.env, spawn = cp.spawnSync, log = console.log, premium = require("./premium-publish"), channel: injected = null } = {}) {
  const channel = injected || Channel.getChannel(slug);
  if (channel.retired) { log(`[${channel.name}] retired; no content produced.`); return 0; }
  if (slug !== "goal-lore-lab") throw new Error(`the GoalLore Lab lane cannot run ${slug}`);
  const explicit = argv.find((a) => !a.startsWith("--"));
  const run = require("../../lib/run-stages").start(channel);
  let targetDay = null;
  if (!explicit && env.PUBLISH === "1") {
    const due = require("../scheduling").channelPlan(channel).short;
    if (!due.due) { run.outcome("NOT_DUE", due.reason); log(`[${channel.name}] not due: ${due.reason}`); return 0; }
    targetDay = due.targetDay || null; run.record.targetDay = targetDay;
  }
  // 1. an owner-approved, reserved premium Short for the due slot, through the existing uploader (null when not ready)
  if (!explicit) {
    const p = premium.run(channel, { env, targetDay, log });
    if (p) {
      run.topic(p.slug).outcome(p.uploaded ? "UPLOADED" : p.dryRun ? "DRY_RUN" : "FAILED", `premium ${p.topicId}${p.videoId ? " " + p.videoId : ""}${p.uploaded ? "" : p.dryRun ? ": uploader --dogrula" : ": not uploaded, reservation kept"}`);
      return p.exitCode;
    }
  }
  // 2. otherwise one review candidate: the next verified topic not yet rendered, never uploaded
  const { ok, refused } = qualified(channel);
  const force = env[`${Shadow.PREFIX[channel.slug]}_PREMIUM_FORCE`] === "1";
  const pick = explicit ? ok.find((r) => r.topic.id === explicit || r.topic.slug === explicit) : ok.find((r) => force || !rendered(channel, r.topic));
  if (!pick) {
    const why = explicit ? `${explicit} is not a qualified GoalLore Lab topic${(refused.find((r) => r.topic.id === explicit || r.topic.slug === explicit) || { why: [] }).why.map((w) => "; " + w).join("")}`
      : `${ok.length} verified topic(s), all already rendered for review; ${refused.length} not qualified (research below VERIFIED or published)`;
    run.skip("RESEARCH", why).outcome("NO_TOPIC", why); log(`[${channel.name}] NO_TOPIC: ${why}`); return 0;
  }
  run.topic(pick.topic.slug).done("RESEARCH", `${pick.topic.id} VERIFIED (${(pick.topic.facts || []).length} verbatim-quoted facts)`).done("SCRIPT", "studio adapter");
  const res = renderCandidate(channel, pick.topic, { env, spawn, log });
  if (res.exitCode !== 0 || !res.objectivePass) { run.fail("RENDER", `studio exit ${res.exitCode}, ${res.verdict || "no package"}`).outcome("FAILED", `review candidate ${pick.topic.id} did not pass objective QA`); return 0; }
  run.done("NARRATION", (res.voice && res.voice.used) || "edge").done("RENDER", `${res.seconds} s`).done("QA", "objective PASS").skip("UPLOAD", "review candidate: publication needs the owner's approvals (premium-publish.js)");
  run.outcome("DRY_RUN", `review candidate ${pick.topic.id} ${res.verdict}; not uploaded`);
  return 0;
}

module.exports = { runChannel, qualified, legacySlugs, renderCandidate, reviewDir, ledger };
