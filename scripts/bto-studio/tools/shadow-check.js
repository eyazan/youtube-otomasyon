#!/usr/bin/env node
"use strict";
// Dry-run verdict for the premium shadow (ib-premium-dry-run.yml, fr-studio-dry-run.yml): exit 0 only when a comparison
// exists and the premium shadow rendered (exit 0) and passed its objective QA. A green dry run that rendered nothing
// verified nothing (FR runs 39785849063 and 39788178724 were green in under a minute).
//   node scripts/bto-studio/tools/shadow-check.js <dir containing <slug>/premium-shadow.json>
const fs = require("fs");
const path = require("path");

function check(dir) {
  const files = (fs.existsSync(dir) ? fs.readdirSync(dir) : []).map((d) => path.join(dir, d, "premium-shadow.json")).filter((f) => fs.existsSync(f));
  if (!files.length) return { ok: false, message: `no premium shadow comparison under ${dir}` };
  const r = JSON.parse(fs.readFileSync(files[0], "utf8")); const p = r.premium || {}; const l = r.live || {};
  const line = `${r.slug}: live ${l.decision || "?"} ${l.productionScore ?? ""} | premium ${p.status} ${p.verdict} objectivePass ${p.objectivePass} voice ${p.voice ? `${p.voice.used} (approved ${p.voice.approved})` : "?"}`;
  return p.status === "exit 0" && p.objectivePass === true ? { ok: true, message: line } : { ok: false, message: `premium shadow did not render and pass objective QA: ${line}` };
}

// The premium studio refuses a topic its own gates block (IB: no claim-source ledger, no declared visual mechanism):
// that refusal is the gate working, not a render failure, but it proves no render. In that case only, the dry run
// renders the premium lane's best qualified topic instead (core/pipeline/premium-lane.js qualified, the production
// selection) and judges that package. Any other shadow failure stays a failure.
const GATE = /^(CREATIVE_REVIEW_REQUIRED|SOURCE_NOT_CLAIM_SPECIFIC|SOURCE_UNVERIFIED)\b/;
function gateRefusal(dir, slug) {
  const files = (fs.existsSync(dir) ? fs.readdirSync(dir) : []).map((d) => path.join(dir, d, "premium-shadow.json")).filter((f) => fs.existsSync(f));
  if (!files.length) return { ok: false, message: `no premium shadow comparison under ${dir}` };
  const r = JSON.parse(fs.readFileSync(files[0], "utf8"));
  const Adapter = require("../adapter"); const Lane = require("../../../core/pipeline/premium-lane");
  const { channel, topic } = Adapter.loadTopic(slug, r.slug);
  const gates = Adapter.readiness(channel, topic).errors.filter((e) => GATE.test(e));
  if (!gates.length) return { ok: false, message: `${r.slug}: the shadow failed and no premium gate refused it` };
  const next = Lane.qualified(channel).ok[0];
  if (!next) return { ok: false, message: `${r.slug} refused by ${gates.map((g) => g.split(":")[0]).join(", ")}; no premium-qualified topic to render instead` };
  return { ok: true, topicId: next.topic.id, message: `${r.slug} refused by ${gates.map((g) => g.split(":")[0]).join(", ")}; rendering the premium lane's qualified ${next.topic.id} instead` };
}
function checkPackage(file) {
  let pkg = null; try { pkg = JSON.parse(fs.readFileSync(file, "utf8")); } catch (error) { return { ok: false, message: `no review package at ${file}` }; }
  const pass = !!(pkg.qa && pkg.qa.objectivePass); const voice = pkg.voice || {};
  const line = `${pkg.topicId || file}: ${pkg.verdict} objectivePass ${pass} voice ${voice.used} (approved ${voice.approved})`;
  return pass && voice.approved === true ? { ok: true, message: line } : { ok: false, message: `premium render did not pass objective QA with the approved voice: ${line}` };
}

if (require.main === module) {
  const [a, b, c] = process.argv.slice(2);
  const r = a === "--gate-refusal" ? gateRefusal(b, c) : a === "--package" ? checkPackage(b) : check(a || ".");
  if (a === "--gate-refusal") { console.error(r.ok ? r.message : `::error::${r.message}`); if (r.ok) console.log(r.topicId); }
  else console.log(r.ok ? r.message : `::error::${r.message}`);
  process.exitCode = r.ok ? 0 : 1;
}
module.exports = { check, gateRefusal, checkPackage };
