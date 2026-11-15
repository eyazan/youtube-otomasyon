#!/usr/bin/env node
"use strict";
// Record a person's visual-mechanism decision on an ImpossibleBrief research record (topic.visualMechanism).
// The studio never guesses the mechanism for production (PR #387): a record without one is CREATIVE_REVIEW_REQUIRED.
// This tool lists the funnel's proposals and writes a decision only when a named person passes --by; it refuses a
// mechanism that has no drawing (it would be faked) and never touches facts, narration or ledgers.
//   node scripts/ib-research/declare-mechanism.js --list                       proposals for records one step away
//   node scripts/ib-research/declare-mechanism.js IB-SPA-031 planet-orbit --by "<name>" [IB-... <mechanism> ...]
//   node scripts/ib-research/declare-mechanism.js --from reports/ib-mechanism-board/decisions.json --by "<name>"
//                                              every row the person set to APPROVE in the review sheet (HOLD rows refused)
//   node scripts/ib-research/declare-mechanism.js --queue                      the premium lane's production order now
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

// rows of an owner review sheet: APPROVE without a hold -> declared; APPROVE with a hold -> refused (fix the research first)
function fromSheet(sheet) {
  const rows = (sheet.topics || []).filter((r) => String(r.decision || "").toUpperCase() === "APPROVE");
  return { approved: rows.filter((r) => !r.hold), held: rows.filter((r) => r.hold) };
}

if (require.main === module) {
  const args = process.argv.slice(2); const universe = JSON.parse(fs.readFileSync(FILE, "utf8"));
  if (args.includes("--list")) {
    const f = JSON.parse(fs.readFileSync(path.join(ROOT, "reports/premium-topic-funnel.json"), "utf8")).find((x) => x.channel === "impossible-brief");
    for (const r of f.rows.filter((x) => x.stage === "CREATIVE_VIABLE")) { const t = universe.topics.find((x) => x.id === r.id) || {};
      console.log(`${r.id}\t${r.proposal ? r.proposal.proposed || "-" : "-"}\t${t.topic || t.title || ""}`); }
    process.exit(0);
  }
  if (args.includes("--queue")) { // the real production order the premium lane would use now (declared + qualified)
    const Lane = require(path.join(ROOT, "core/pipeline/premium-lane.js")); const Channel = require(path.join(ROOT, "core/channel-context"));
    const q = Lane.qualified(Channel.getChannel("impossible-brief")).ok;
    q.forEach((r, i) => console.log(`${i + 1}\t${r.topic.id}\t${r.topic.visualMechanism}\t${r.topic.title || r.topic.topic}`));
    if (!q.length) console.log("no qualified ImpossibleBrief topic: nothing can be produced until a person declares mechanisms");
    process.exit(0);
  }
  const by = args.includes("--by") ? args[args.indexOf("--by") + 1] : null;
  const from = args.includes("--from") ? args[args.indexOf("--from") + 1] : null;
  let pairs = args.filter((a, i) => !a.startsWith("--") && args[i - 1] !== "--by" && args[i - 1] !== "--from");
  // --from <decisions.json>: declare every row the person set to APPROVE (owner review sheet); HOLD rows are refused
  if (from) { const rows = fromSheet(JSON.parse(fs.readFileSync(path.resolve(from), "utf8")));
    for (const r of rows.held) console.log(`${r.id}: not declared (hold: ${r.hold.split(":")[0]})`);
    pairs = pairs.concat(...rows.approved.map((r) => [r.id, r.mechanism])); if (!pairs.length) { console.error("no row is set to APPROVE; nothing declared"); process.exit(2); } }
  if (!pairs.length || pairs.length % 2) { console.error("usage: declare-mechanism.js <id> <mechanism> [...] --by <name> | --list"); process.exit(2); }
  for (let i = 0; i < pairs.length; i += 2) { const t = declare(universe, pairs[i], pairs[i + 1], by); console.log(`${t.id}: ${t.visualMechanism} (by ${t.visualMechanismDecision.by})`); }
  const raw = fs.readFileSync(FILE, "utf8"); const indent = (raw.match(/\n( +)"/) || [, "  "])[1].length;
  fs.writeFileSync(FILE, JSON.stringify(universe, null, indent) + "\n");
}
module.exports = { declare, fromSheet };
