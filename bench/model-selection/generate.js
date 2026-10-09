"use strict";
// One-off benchmark (throwaway branch, never merged): ONE coherent long-form script written by a FREE-tier Gemini
// model with the existing story engine (develop), the same prompts and gates as the earlier Claude/Groq tests.
// The writer sees only the verified dossier: no earlier script. Model fallback is disabled (clean authorship);
// quota exhaustion or overload pauses the run. No paid provider can be reached (no budget ledger; maxUsd 0).
const fs = require("fs"); const path = require("path");
const ROOT = path.join(__dirname, "..", "..");
process.env.PD_GEMINI_FALLBACK_MODELS = ","; // empty chain: never switch models silently
const W = require(path.join(ROOT, "core/profitdecoded/auto/script-agent"));
const L = require(path.join(ROOT, "core/profitdecoded/auto/llm"));
const P = require(path.join(ROOT, "core/profitdecoded/auto/produce"));
const Gm = require(path.join(ROOT, "core/profitdecoded/auto/gemini"));
const OUT = path.join(__dirname, "out"); fs.mkdirSync(OUT, { recursive: true });
const key = process.env.GEMINI_API_KEY;
(async () => {
  // 1. Free-tier availability (model metadata only: no generation quota used)
  const avail = {};
  for (const m of ["gemini-3.7-flash", "gemini-3.8-flash", "gemini-3.6-flash", "gemini-3.5-flash"]) {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}`, { headers: { "x-goog-api-key": key } });
    const j = res.ok ? await res.json() : null; avail[m] = { ok: res.ok, status: res.status, version: j && j.version, displayName: j && j.displayName, outputTokenLimit: j && j.outputTokenLimit, freeTierListed: Gm.FREE_TIER_MODELS.includes(m) };
  }
  const writerModel = ["gemini-3.7-flash", "gemini-3.8-flash", "gemini-3.6-flash"].find((m) => avail[m].ok && avail[m].freeTierListed);
  const criticModel = ["gemini-3.6-flash", "gemini-3.5-flash"].find((m) => m !== writerModel && avail[m].ok && avail[m].freeTierListed);
  fs.writeFileSync(path.join(OUT, "availability.json"), JSON.stringify({ checkedAt: new Date().toISOString(), avail, writerModel, criticModel }, null, 1));
  console.log("availability", JSON.stringify(avail)); console.log("writer", writerModel, "critic", criticModel);
  if (!writerModel) { console.log("no free Gemini writer available"); return; }
  // 2. Generation with the existing engine: full-story draft (chunked: false), fresh-context critique and final evaluation
  const topic = JSON.parse(fs.readFileSync(path.join(ROOT, "channels/profitdecoded/topics/topic-universe.json"), "utf8")).topics.find((t) => t.id === "hbm-073-how-gift-cards-make-money-for-retailers");
  const dossier = JSON.parse(fs.readFileSync(path.join(ROOT, "channels/profitdecoded/research/hbm-073-how-gift-cards-make-money-for-retailers.json"), "utf8"));
  const writer = L.createClient({ provider: "gemini", model: writerModel }); const critic = L.createClient({ provider: "gemini", model: criticModel });
  const ledger = L.newLedger(0);
  const r = await W.develop(topic, dossier, "long", { ledger, chunked: false, cacheDir: path.join(__dirname, "cache"), clients: { plan: writer, draft: writer, rewrite: writer, package: writer, critique: critic, evaluate: critic }, stageProviders: { plan: "gemini", draft: "gemini", rewrite: "gemini", package: "gemini", critique: "gemini" }, exceptions: [] });
  const dir = P.writeStoryPackage(path.join(OUT, "story"), topic, "long", r, ledger, { title: "Billions Sit on Unused Gift Cards. Who Keeps the Money?", minutes: [8, 12] });
  console.log("status", r.status, "pausedAt", r.pausedAt || "-", "reasons", JSON.stringify((r.reasons || []).slice(0, 8)));
  console.log("story package", path.relative(ROOT, dir));
})().catch((e) => { console.error("generation error:", e.code || "", String(e.message).slice(0, 300)); process.exitCode = 1; });
