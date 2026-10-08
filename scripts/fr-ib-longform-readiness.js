#!/usr/bin/env node
"use strict";
// Turns real, sandboxed growth dry-run output into a decision-oriented report.
// Never reads credentials or changes any channel state.
const fs = require("fs");
const path = require("path");
const file = process.argv[2] || "reports/dry-runs/summary.json";
if (!fs.existsSync(file)) { console.error("Missing dry-run summary: " + file); process.exit(1); }
const files = fs.statSync(file).isDirectory() ? ["fr-summary.json", "ib-summary.json"].map(name => path.join(file, name)) : [file];
const allResults = files.flatMap(filename => JSON.parse(fs.readFileSync(filename, "utf8")).results || []);
const target = new Set(["failure-reconstructed", "impossible-brief"]);
const rows = allResults.filter(r => target.has(r.channel));
if (rows.length !== 2 || new Set(rows.map(r => r.channel)).size !== 2) {
  console.error("Expected exactly one result for Failure Reconstructed and ImpossibleBrief");
  process.exit(1);
}
const md = ["# Long-form pilot readiness — evidence from dry-run", "", "This is a package-level assessment, **not** a rendered-video review or publishing authorization.", "", "| Channel | Candidate | Score | Decision | Estimated minutes | Deep research claims |", "|---|---|---:|---|---:|---:|"];
for (const row of rows) {
  const l = row.long;
  if (!l) { md.push(`| ${row.channel} | none | — | NO_CANDIDATE | — | — |`); continue; }
  const safe = v => String(v == null ? "—" : v).replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
  md.push(`| ${safe(row.channel)} | ${safe(l.topic)} | ${safe(l.score)} | **${safe(l.decision)}** | ${safe(l.minutes)} | ${safe(l.deepClaims)} |`);
}
md.push("", "## Reasons and remediation");
let blocked = 0;
for (const row of rows) {
  const l = row.long;
  md.push("", `### ${row.channel}`);
  if (!l) { blocked++; md.push("- No candidate: enrich own-channel research inventory and rerun."); continue; }
  if (l.decision !== "PUBLISH") blocked++;
  const failures = Array.isArray(l.hardFails) ? l.hardFails : [];
  if (!failures.length) {
    md.push(l.score < 85 ? "- Composite score below the current publish threshold. Inspect section coverage, script, visuals and source quality; do **not** lower the threshold." : "- No hard-fail reported; still requires rendered-video and human review.");
  } else {
    failures.forEach(f => md.push(`- **Hard fail:** ${String(f).replace(/\r?\n/g, " ")}`));
  }
  if (!(l.deepClaims > 0)) md.push("- Deep research absent: provide cited source-backed material before expanding duration; avoid generic filler.");
  if (!(l.minutes >= 8)) md.push("- Planned duration below eight minutes: enrich narrative evidence or deliberately publish a shorter, accurate format; never pad.");
}
md.push("", "## Release decision", "", blocked ? `**HOLD**: ${blocked} of 2 channels have not passed the package-level quality gate. Publishing flags must stay off.` : "**PACKAGE CHECK ONLY**: both candidate packages pass preliminarily; rendering and human signoff are still required.", "", "Daily Shorts continue unchanged. Do not conflate passing CI tests with passing the content gate.", "");
const out = process.argv[3] || "reports/dry-runs/LONGFORM-READINESS.md";
fs.mkdirSync(path.dirname(out), {recursive:true});
fs.writeFileSync(out, md.join("\n"));
console.log(`Readiness report: ${out}; blocked channels: ${blocked}/2`);
