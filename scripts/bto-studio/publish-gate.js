#!/usr/bin/env node
"use strict";
// Publishing gate for a premium review package. Read-only: it never uploads, schedules or edits state.
//   node scripts/bto-studio/publish-gate.js <review-package.json> [--approvals approvals.json]
// It replays the lifecycle (scripts/bto-studio/lifecycle.js) from TOPIC_READY as far as the evidence allows and prints
// the furthest state the video may reach and every reason it cannot go further. Also checked:
//   - duplicates: the topic or the exact media (sha256) already in channels/<c>/state/published.json
//   - licensed media: every image-plate asset must be owner-"approved" in the asset registry to publish
// approvals.json (written by a person): { creative: {by, at}, factual: {by, at}, publish: {by, at} }
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const LC = require("./lifecycle");
const Assets = require("./asset-manager");
const Adapter = require("./adapter");

const ROOT = path.resolve(__dirname, "..", "..");
const J = (f) => JSON.parse(fs.readFileSync(f, "utf8"));

function evaluate(pkgFile, approvals = {}) {
  const pkg = J(pkgFile); const out = path.dirname(pkgFile);
  // pilot packages (studio --pilot) never enter the lifecycle: their topic is not in a production universe
  if (pkg.pilot || pkg.verdict === "PILOT_NOT_APPROVED_FOR_PUBLICATION") return { video: pkg.video, mediaSha256: null, furthestState: null, duplicates: [], mediaIssues: [], facts: 0,
    steps: [{ to: "TOPIC_READY", ok: false, reasons: [`pilot package (${pkg.pilot || pkg.topicId}): pilots are never publishable; produce the topic through the channel's research pipeline first`] }] };
  const { channel, topic } = Adapter.loadTopic(pkg.channel, pkg.topicId);
  const qa = J(path.join(out, "qa-report.json"));
  const video = path.join(ROOT, pkg.video); const sha = fs.existsSync(video) ? crypto.createHash("sha256").update(fs.readFileSync(video)).digest("hex") : null;
  const published = (() => { try { return J(path.join(channel.paths.state, "published.json")); } catch (e) { return []; } })();
  const dup = published.filter((p) => p.slug === topic.slug || p.topicId === topic.id || (sha && p.mediaSha256 === sha));
  // licensed media used by the storyboard that produced this package
  const mediaIssues = []; const scenes = J(path.join(out, "scenes.json")).scenes || [];
  const usesPlates = scenes.some((s) => (s.components || []).includes("image-plate"));
  if (usesPlates) for (const a of Assets.load(pkg.channel).assets.filter((x) => (x.review || {}).status !== "rejected")) { const used = fs.readFileSync(path.join(out, "work", "page.html"), "utf8").includes(a.id); if (used) mediaIssues.push(...Assets.check(a, "publish")); }
  const speech = (qa.objective || []).find((c) => /real speech/.test(c.name));
  const facts = topic.facts || [];
  let v = { topic, alreadyPublished: dup.length > 0 };
  const steps = [];
  const go = (to, extra) => { v = { ...v, ...extra }; const r = LC.check(v, to); steps.push({ to, ok: r.ok, reasons: r.reasons }); if (r.ok) v = LC.advance(v, to); return r.ok; };
  go("TOPIC_READY", {}) &&
  go("SCRIPT_READY", { script: { lines: pkg.narrationUnchanged.lines, sourceHash: pkg.narrationUnchanged.sourceHash } }) &&
  go("VISUAL_READY", { storyboard: { author: "visual-director" }, validation: { ok: true }, copyright: { unresolved: mediaIssues } }) &&
  go("RENDERED", { render: { video: pkg.video }, narration: { speechOk: !!(speech && speech.ok), approvedVoice: pkg.voice.approved === true } }) &&
  go("QA_PASSED", { qa, creative: { signoff: approvals.creative } }) &&
  go("PUBLISH_APPROVED", { factual: { signoff: approvals.factual }, publishApproval: approvals.publish, channel: { publishingEnabled: channel.entry ? channel.entry.enabled === true : false } });
  return { video: pkg.video, mediaSha256: sha, furthestState: v.state || null, duplicates: dup.map((d) => d.videoId), mediaIssues, steps, facts: facts.length };
}

if (require.main === module) {
  const args = process.argv.slice(2); const ap = args.includes("--approvals") ? J(args[args.indexOf("--approvals") + 1]) : {};
  const r = evaluate(path.resolve(args[0]), ap);
  for (const s of r.steps) console.log(`${s.ok ? "PASS" : "BLOCK"}  ${s.to}${s.ok ? "" : "  <- " + s.reasons.join("; ")}`);
  console.log(`furthest state: ${r.furthestState || "(none)"}${r.duplicates.length ? `; DUPLICATE of ${r.duplicates.join(", ")}` : ""}`);
  console.log("publishing is never automatic: even PUBLISH_APPROVED only allows the owner to hand the MP4 to the existing uploader.");
  process.exit(r.furthestState === "PUBLISH_APPROVED" ? 0 : 4);
}
module.exports = { evaluate };
