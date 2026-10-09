"use strict";
// One-off blind judging. Payloads were built offline: identical formatting, labels only (X/Y/Z), no model names.
// Judges: Groq openai/gpt-oss-120b (each script alone, absolute rubric) and one Gemini model that did NOT write any
// script (all three together, two orders). Free tiers only; quota or overload stops the step, never a paid switch.
const fs = require("fs"); const path = require("path");
const ROOT = path.join(__dirname, "..", "..");
process.env.PD_GEMINI_FALLBACK_MODELS = ",";
const G = require(path.join(ROOT, "core/profitdecoded/auto/groq")); const Gm = require(path.join(ROOT, "core/profitdecoded/auto/gemini"));
const E = path.join(__dirname, "eval"); const OUT = path.join(__dirname, "out"); fs.mkdirSync(OUT, { recursive: true });
const plan = JSON.parse(fs.readFileSync(path.join(E, "plan.json"), "utf8"));
const CRIT = ["hook", "storytelling", "curiosity", "structure", "naturalness", "pacing", "accuracy", "visual"];
const SCORES = { type: "object", additionalProperties: false, required: CRIT, properties: Object.fromEntries(CRIT.map((k) => [k, { type: "integer" }])) };
const PROB = { type: "array", items: { type: "object", additionalProperties: false, required: ["quote", "problem", "severity"], properties: { quote: { type: "string" }, problem: { type: "string" }, severity: { type: "string", enum: ["high", "medium", "low"] } } } };
const ONE = { type: "object", additionalProperties: false, required: ["scores", "strengths", "weaknesses", "factualProblems", "verdict"], properties: { scores: SCORES, strengths: { type: "array", items: { type: "string" } }, weaknesses: { type: "array", items: { type: "string" } }, factualProblems: PROB, verdict: { type: "string", enum: ["publish", "revise", "reject"] } } };
const ALL = { type: "object", additionalProperties: false, required: ["scripts", "ranking", "reasoning"], properties: { scripts: { type: "array", items: { type: "object", additionalProperties: false, required: ["label", "scores", "strengths", "weaknesses", "factualProblems"], properties: { label: { type: "string" }, scores: SCORES, strengths: { type: "array", items: { type: "string" } }, weaknesses: { type: "array", items: { type: "string" } }, factualProblems: PROB } } }, ranking: { type: "array", items: { type: "string" } }, reasoning: { type: "string" } } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const results = { startedAt: new Date().toISOString(), groq: [], gemini: [] };
  for (const [i, f] of plan.groq.entries()) {
    if (i) await sleep(65000); // Groq free tier: 8,000 tokens per minute
    try { const r = await G.chat({ system: "You are a rigorous, fair documentary script editor. Return only the requested JSON.", messages: [{ role: "user", content: fs.readFileSync(path.join(E, f), "utf8") }], schema: ONE, maxTokens: 3200, effort: "medium", key: process.env.GROQ_API_KEY });
      results.groq.push({ file: f, model: r.model, usage: r.usage, verdict: G.extractJson(r.text) }); console.log("groq", f, "ok", JSON.stringify(r.usage));
    } catch (e) { results.groq.push({ file: f, error: `${e.code || ""} ${String(e.message).slice(0, 200)}` }); console.log("groq", f, "failed", e.code || "", String(e.message).slice(0, 160)); }
  }
  for (const f of plan.gemini.files) {
    try { const r = await Gm.chat({ system: "You are a rigorous, fair documentary script editor. Return only the requested JSON.", messages: [{ role: "user", content: fs.readFileSync(path.join(E, f), "utf8") }], schema: ALL, maxTokens: 16000, model: plan.gemini.model, key: process.env.GEMINI_API_KEY });
      results.gemini.push({ file: f, model: r.model, usage: r.usage, verdict: JSON.parse(r.text) }); console.log("gemini", f, "ok", r.model, JSON.stringify(r.usage));
    } catch (e) { results.gemini.push({ file: f, error: `${e.code || ""} ${String(e.message).slice(0, 200)}` }); console.log("gemini", f, "failed", e.code || "", String(e.message).slice(0, 160)); }
  }
  fs.writeFileSync(path.join(OUT, "judges.json"), JSON.stringify(results, null, 1));
})();
