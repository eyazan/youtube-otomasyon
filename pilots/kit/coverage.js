"use strict";
// Planner coverage over every researched GoalLore Lab topic (planning only, no render; review only). Synthetic cues of
// 5 s per narration line stand in for the narration timing, so reading-time results here are indicative.
const fs = require("fs"); const os = require("os"); const path = require("path");
const { plan, Refusal } = require("../lib/planner");
const ROOT = path.resolve(__dirname, "../.."); const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "coverage-"));
const t = JSON.parse(fs.readFileSync(path.join(ROOT, "channels/goal-lore-lab/topics/topic-universe.json"), "utf8")); const topics = (Array.isArray(t) ? t : (t.topics || t)).filter((x) => x.narration);
// for a refused topic: which mechanism class it belongs to and which evidence fields are present / missing
const SCHEMA = JSON.parse(fs.readFileSync(path.join(__dirname, "../research/gll-mechanism-evidence.json"), "utf8")).classes;
const FIELD_RE = { foot: /\b(left|right) foot/i, surface: /(outside|inside|instep) of (?:his|the)/i, distance: /\d+(?:\.\d+)?[- ]?(?:metres?|meters?|m\b|yards?)/i, keeperAction: /(did not move|never moved|div(?:e|ed|ing) to (?:his|her|the) (?:left|right))/i,
  placement: /(middle of the net|over the bar|corner|past [A-Z][a-z]+)/, delivery: /\b(corner|cross|free kick)\b.*\b(left|right)\b/i, shotType: /(header|shot)\b.*\b(down|high|low|left|right)\b/i, diveDirection: /div(?:e|ed|ing) to (?:his|her|the) (left|right)/i,
  contact: /(tipped|pushed|palmed|parried|punched)/i, path: /(halfway line|own half|flank|wing)/i, beaten: /past (five|four|three|\d+) /i, finish: /(rounded|round the keeper|slotted|side-footed|left foot|right foot)/i, passes: /(passed to|pass to)[\s\S]*(passed to|pass to)[\s\S]*(passed to|pass to)/i }; // a sequence: at least three passes named
function evidence(x) { const txt = [...x.narration.map((l) => l.text), ...x.facts.map((f) => `${f.claim} ${f.quote || ""}`)].join(" ");
  const cls = Object.entries(SCHEMA).filter(([, c]) => c.detect.some((w) => txt.toLowerCase().includes(w))).map(([k]) => k);
  const order = ["goalkeeper-save", "dribble-goal", "team-move", "header-goal", "penalty", "curling-free-kick"]; // most specific first
  const pick = order.find((k) => cls.includes(k)); if (!pick) return "";
  const fields = Object.keys(SCHEMA[pick].fields); const have = fields.filter((f) => FIELD_RE[f] && FIELD_RE[f].test(txt)); const miss = fields.filter((f) => !have.includes(f));
  return ` · class ${pick}: have [${have.join(", ")}], missing [${miss.join(", ")}]`; }
const rows = topics.map((x) => { const f = path.join(tmp, `${x.id}.json`); fs.writeFileSync(f, JSON.stringify(x)); const cues = x.narration.map((l, i) => ({ start: i * 5, end: i * 5 + 5, lines: [l.text] }));
  try { const p = plan(f, cues, cues.length * 5).plan; return { id: x.id, title: x.title, status: "PLANNED", detail: `${p.template}; ${p.assumptions.length} assumption(s)${p.assumptions.length ? ": " + p.assumptions.join("; ") : ""}` }; }
  catch (e) { if (!(e instanceof Refusal)) throw e; return { id: x.id, title: x.title, status: "CREATIVE_REVIEW_REQUIRED", detail: e.reasons.join("; ") + evidence(x) }; } });
const n = rows.filter((r) => r.status === "PLANNED").length;
console.log(`### Planner coverage: ${n}/${rows.length} researched GLL topics plan automatically\n\n| topic | title | status | template / reason |\n|---|---|---|---|`);
for (const r of rows) console.log(`| ${r.id} | ${r.title} | ${r.status} | ${r.detail.replace(/\|/g, "/")} |`);
module.exports = { rows };
