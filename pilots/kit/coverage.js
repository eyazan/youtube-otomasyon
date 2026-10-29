"use strict";
// Planner coverage over every researched GoalLore Lab topic (planning only, no render; review only). Synthetic cues of
// 5 s per narration line stand in for the narration timing, so reading-time results here are indicative.
const fs = require("fs"); const os = require("os"); const path = require("path");
const { plan, Refusal } = require("../lib/planner");
const ROOT = path.resolve(__dirname, "../.."); const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "coverage-"));
const t = JSON.parse(fs.readFileSync(path.join(ROOT, "channels/goal-lore-lab/topics/topic-universe.json"), "utf8")); const topics = (Array.isArray(t) ? t : (t.topics || t)).filter((x) => x.narration);
const rows = topics.map((x) => { const f = path.join(tmp, `${x.id}.json`); fs.writeFileSync(f, JSON.stringify(x)); const cues = x.narration.map((l, i) => ({ start: i * 5, end: i * 5 + 5, lines: [l.text] }));
  try { const p = plan(f, cues, cues.length * 5).plan; return { id: x.id, title: x.title, status: "PLANNED", detail: `${p.template}; ${p.assumptions.length} assumption(s)${p.assumptions.length ? ": " + p.assumptions.join("; ") : ""}` }; }
  catch (e) { if (!(e instanceof Refusal)) throw e; return { id: x.id, title: x.title, status: "CREATIVE_REVIEW_REQUIRED", detail: e.reasons.join("; ") }; } });
const n = rows.filter((r) => r.status === "PLANNED").length;
console.log(`### Planner coverage: ${n}/${rows.length} researched GLL topics plan automatically\n\n| topic | title | status | template / reason |\n|---|---|---|---|`);
for (const r of rows) console.log(`| ${r.id} | ${r.title} | ${r.status} | ${r.detail.replace(/\|/g, "/")} |`);
module.exports = { rows };
