#!/usr/bin/env node
"use strict";
// Daily premium readiness report across the strategic channels. READ-ONLY: never renders, uploads, schedules or edits
// state; it does not call a model or the network. It answers "what could the premium line produce and ship today, and
// what blocks it?" so a person (or a later, approved scheduler) can act.
//   node scripts/bto-studio/daily.js [--json] [--target-per-day 1] [--buffer-days 7]
// Per channel: registry status, studio profile/rollout stage, topic queue (ready for the studio vs blocked, with the
// top reasons), premium packages and the furthest lifecycle state the publish gate allows, approved-but-unpublished
// buffer in days against the buffer target, duplicates. CriticalThread is reported as live and untouched.
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..");
const J = (f, d) => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch (e) { return d; } };
const STRATEGIC = ["failure-reconstructed", "impossible-brief", "behind-the-ordinary", "goal-lore-lab"];

function packages(channel) {
  const dir = path.join(ROOT, "channels", channel, "premium"); const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const topic of fs.readdirSync(dir)) { const o = path.join(dir, topic, "out"); if (!fs.existsSync(o)) continue;
    for (const v of fs.readdirSync(o)) { const f = path.join(o, v, "review-package.json"); if (fs.existsSync(f)) out.push(f); } }
  return out;
}

function channelReport(slug, { targetPerDay, bufferDays }) {
  const reg = J(path.join(ROOT, "config/channels.json"), { channels: {} }).channels[slug] || null;
  const profile = J(path.join(__dirname, "profiles", `${slug}.json`), {});
  const r = { channel: slug, registered: !!reg, enabled: reg ? reg.enabled === true : false, registryStatus: reg ? reg.status || (reg.enabled ? "live" : "disabled") : "not registered",
    premiumMode: profile.premiumMode || "none", studioRenders: profile.studioRenders === true, rolloutStage: profile.rolloutStage || null, topics: null, packages: [], blockers: [] };
  // topic queue (the studio only takes VERIFIED, productionReady, unpublished topics)
  const uni = J(path.join(ROOT, "channels", slug, "topics", "topic-universe.json"), null);
  const pubFile = path.join(ROOT, "channels", slug, "state", "published.json"); const published = J(pubFile, []); const pubKnown = fs.existsSync(pubFile);
  if (uni && reg) {
    const A = require("./adapter"); const ch = require("../../core/channel-context").getChannel(slug); const reasons = {}; let ready = 0;
    for (const t of uni.topics || []) { const x = A.readiness(ch, t); if (x.ready) ready += 1; else for (const e of x.errors) { const k = e.replace(/\d+/g, "N").replace(/\(.*\)/, "").trim(); reasons[k] = (reasons[k] || 0) + 1; } }
    r.topics = { total: (uni.topics || []).length, readyForStudio: ready, published: pubKnown ? published.length : null, topBlockers: Object.entries(reasons).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, n]) => `${n}x ${k}`) };
  } else if (!uni) {
    const cand = J(path.join(ROOT, "channels", slug, "topics", "topic-candidates.json"), null);
    if (cand) { const by = {}; for (const t of cand.topics || cand.candidates || []) by[t.status] = (by[t.status] || 0) + 1; r.topics = { total: (cand.topics || cand.candidates || []).length, readyForStudio: 0, candidatesByStatus: by, topBlockers: ["candidates only: no verified research, no narration"] }; }
  }
  // premium packages through the publish gate
  if (reg) { const G = require("./publish-gate");
    for (const f of packages(slug)) { try { const e = G.evaluate(f, {}); const block = e.steps.find((s) => !s.ok);
        r.packages.push({ package: path.relative(ROOT, f), furthestState: e.furthestState, blockedAt: block ? block.to : null, reasons: block ? block.reasons : [], duplicate: e.duplicates.length > 0 }); }
      catch (err) { r.packages.push({ package: path.relative(ROOT, f), error: err.message.slice(0, 160) }); } } }
  const approved = r.packages.filter((p) => p.furthestState === "PUBLISH_APPROVED" && !p.duplicate).length;
  r.buffer = { approvedUnpublished: approved, days: +(approved / targetPerDay).toFixed(1), targetDays: bufferDays, ok: approved / targetPerDay >= bufferDays };
  if (!r.registered) r.blockers.push("channel not registered in config/channels.json (owner decision; YouTube identity must be verified first)");
  else if (!r.enabled) r.blockers.push(`channel disabled in the registry (${r.registryStatus})`);
  if (!r.studioRenders) r.blockers.push(`premium studio does not render this channel yet (rollout stage ${r.rolloutStage || "?"})`);
  if (r.topics && r.topics.readyForStudio === 0) r.blockers.push("no topic is ready for the studio");
  if (!r.buffer.ok) r.blockers.push(`buffer ${r.buffer.days} of ${bufferDays} days`);
  return r;
}

function report(opts = {}) {
  const o = { targetPerDay: 1, bufferDays: 7, ...opts };
  return { schema: "premium-studio.daily-readiness.v1", generatedAt: new Date().toISOString(), readOnly: true, uploadsPerformed: 0, ...o,
    channels: STRATEGIC.map((c) => channelReport(c, o)),
    untouched: [{ channel: "critical-thread", note: "live production channel; outside the premium studio; its schedules and automation are not read or changed here" }],
    rules: ["never publish a package below PUBLISH_APPROVED", "never publish with preview narration", "never publish unresolved licensed media", "never publish a duplicate topic or media hash", "no new channel publishing without owner approval"] };
}

if (require.main === module) {
  const a = process.argv.slice(2); const opt = (k, d) => (a.includes(k) ? Number(a[a.indexOf(k) + 1]) : d);
  const r = report({ targetPerDay: opt("--target-per-day", 1), bufferDays: opt("--buffer-days", 7) });
  if (a.includes("--json")) { console.log(JSON.stringify(r, null, 1)); process.exit(0); }
  console.log(`premium daily readiness (read-only; ${r.uploadsPerformed} uploads) target ${r.targetPerDay}/day, buffer ${r.bufferDays} days`);
  for (const c of r.channels) {
    console.log(`\n== ${c.channel}: ${c.registryStatus}; studio ${c.studioRenders ? "renders" : "not yet"} (stage ${c.rolloutStage || "-"})`);
    if (c.topics) console.log(`   topics ${c.topics.total}, ready for studio ${c.topics.readyForStudio}${c.topics.published != null ? `, published ${c.topics.published}` : c.topics.readyForStudio != null && c.registered ? ", published unknown (no local state/published.json; duplicate check impossible here)" : ""}${c.topics.topBlockers.length ? `; blockers: ${c.topics.topBlockers.join("; ")}` : ""}`);
    for (const p of c.packages) console.log(`   package ${p.package}: ${p.error ? "ERROR " + p.error : `${p.furthestState || "none"}${p.blockedAt ? ` (blocked at ${p.blockedAt}: ${p.reasons.join("; ").slice(0, 200)})` : ""}`}`);
    console.log(`   buffer ${c.buffer.days}/${c.buffer.targetDays} days -> ${c.blockers.length ? "BLOCKED: " + c.blockers.join(" | ") : "ok"}`);
  }
  for (const u of r.untouched) console.log(`\n== ${u.channel}: ${u.note}`);
}
module.exports = { report };
