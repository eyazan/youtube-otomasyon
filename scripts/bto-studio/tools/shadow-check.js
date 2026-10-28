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

if (require.main === module) { const r = check(process.argv[2] || "."); console.log(r.ok ? r.message : `::error::${r.message}`); process.exitCode = r.ok ? 0 : 1; }
module.exports = { check };
