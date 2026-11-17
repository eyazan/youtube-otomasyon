#!/usr/bin/env node
"use strict";
// Record a person's visual-mechanism decision on an ImpossibleBrief research record (topic.visualMechanism).
// The studio never guesses the mechanism for production (PR #387): a record without one is CREATIVE_REVIEW_REQUIRED.
// This tool lists the funnel's proposals and writes a decision only when a named person passes --by; it refuses a
// mechanism that has no drawing (it would be faked) and never touches facts, narration or ledgers.
//   node scripts/ib-research/declare-mechanism.js --list                       proposals for records one step away
//   node scripts/ib-research/declare-mechanism.js IB-SPA-031 planet-orbit --by "<name>" [IB-... <mechanism> ...]
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..", "..");
const IB = require(path.join(ROOT, "scripts/bto-studio/auto/impossible-brief.js"));
const FILE = path.join(ROOT, "channels/impossible-brief/topics/topic-universe.json");

function declare(universe, id, mechanism, by, at = new Date().toISOString().slice(0, 10)) {
  if (!by || !String(by).trim()) throw new Error("--by <name> is required: a mechanism is a person's creative decision");
  const m = IB.MECHANISMS[mechanism]; if (!m) throw new Error(`unknown mechanism "${mechanism}" (known: ${Object.keys(IB.MECHANISMS).join(", ")})`);
  if (!m.world) throw new Error(`mechanism "${mechanism}" has no drawing (${m.missing}); build it before declaring it`);
  const t = (universe.topics || []).find((x) => x.id === id); if (!t) throw new Error(`no topic ${id}`);
  t.visualMechanism = mechanism; t.visualMechanismDecision = { by: String(by).trim(), at, draws: m.draws };
  return t;
}

if (require.main === module) {
  const args = process.argv.slice(2); const universe = JSON.parse(fs.readFileSync(FILE, "utf8"));
  if (args.includes("--list")) {
    const f = JSON.parse(fs.readFileSync(path.join(ROOT, "reports/premium-topic-funnel.json"), "utf8")).find((x) => x.channel === "impossible-brief");
    for (const r of f.rows.filter((x) => x.stage === "CREATIVE_VIABLE")) { const t = universe.topics.find((x) => x.id === r.id) || {};
      console.log(`${r.id}\t${r.proposal ? r.proposal.proposed || "-" : "-"}\t${t.topic || t.title || ""}`); }
    process.exit(0);
  }
  const by = args.includes("--by") ? args[args.indexOf("--by") + 1] : null;
  const pairs = args.filter((a, i) => !a.startsWith("--") && args[i - 1] !== "--by");
  if (!pairs.length || pairs.length % 2) { console.error("usage: declare-mechanism.js <id> <mechanism> [...] --by <name> | --list"); process.exit(2); }
  for (let i = 0; i < pairs.length; i += 2) { const t = declare(universe, pairs[i], pairs[i + 1], by); console.log(`${t.id}: ${t.visualMechanism} (by ${t.visualMechanismDecision.by})`); }
  const raw = fs.readFileSync(FILE, "utf8"); const indent = (raw.match(/\n( +)"/) || [, "  "])[1].length;
  fs.writeFileSync(FILE, JSON.stringify(universe, null, indent) + "\n");
}
module.exports = { declare };
