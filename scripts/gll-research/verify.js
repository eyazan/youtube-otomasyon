#!/usr/bin/env node
"use strict";
// GoalLore Lab research verification: turns hand-drafted football research (channels/goal-lore-lab/research/drafts/*.json)
// into studio-ready topic records ONLY from text the source itself contains. Nothing here writes a quote: for every fact the
// draft names the source article and the words the evidence must contain; this script fetches the live article (Wikipedia
// API plain text, pinned to the revision it read) and copies the shortest sentence that contains all of them, verbatim.
//   - a fact is VERIFIED only when such a sentence exists, is 5-80 words long, and carries every number of the claim
//     (years may also come from the article title, e.g. "1970 FIFA World Cup final")
//   - a narration line may state only numbers that occur in the quotes (or titles) of the facts it cites
//   - a topic is VERIFIED and productionReady only when every fact and every line passes; otherwise it stays RESEARCHED
//     with the reasons, and the studio refuses it (scripts/bto-studio/adapter.js readiness)
// No model is involved and nothing is paraphrased into a quote. Requires network (GitHub Actions); offline it fails closed.
//   node scripts/gll-research/verify.js [--write] [--report <file>] [--only GLL-037,GLL-031]
const fs = require("fs");
const path = require("path");
const https = require("https");
const FR = require("../fr-library/build");
const { quoteFound, normalizeQuote } = require("../ib-ct-library/build");

const ROOT = path.resolve(__dirname, "..", "..");
const BASE = path.join(ROOT, "channels", "goal-lore-lab");
const DRAFTS = path.join(BASE, "research", "drafts");
const UNIVERSE = path.join(BASE, "topics", "topic-universe.json");
const UA = "youtube-otomasyon-research/1.0 (GoalLore Lab fact verification; https://github.com/eyazan/youtube-otomasyon)";
const isYear = (n) => Number.isInteger(n) && n >= 1800 && n <= 2100;
const fold = (s) => normalizeQuote(String(s).normalize("NFD").replace(/[̀-ͯ]/g, ""));
const words = (s) => String(s).split(/\s+/).filter(Boolean).length;
const sentences = (text) => String(text || "").replace(/\n+/g, " \n ").split(/(?<=[.!?])\s+(?=["“'‘(]?[A-Z0-9])|\s\n\s/).map((s) => s.trim()).filter(Boolean);

function get(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { "User-Agent": UA, Accept: "application/json" }, timeout: 30000 }, (res) => {
      const chunks = []; res.on("data", (c) => chunks.push(c));
      res.on("end", () => { if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode} for ${url}`)); try { resolve(JSON.parse(Buffer.concat(chunks).toString("utf8"))); } catch (e) { reject(e); } });
    });
    req.on("timeout", () => req.destroy(new Error(`timeout for ${url}`))); req.on("error", reject);
  });
}

async function article(title, fetchJson = get) {
  const q = { action: "query", format: "json", formatversion: "2", prop: "extracts|revisions|info", inprop: "url", rvprop: "ids|timestamp", explaintext: "1", redirects: "1", titles: title };
  const body = await fetchJson(`https://en.wikipedia.org/w/api.php?${new URLSearchParams(q)}`);
  const page = body && body.query && body.query.pages && body.query.pages[0];
  if (!page || page.missing || !page.extract) throw new Error(`article "${title}" not found`);
  const rev = page.revisions && page.revisions[0];
  return { title: page.title, text: page.extract, revid: rev && rev.revid, timestamp: rev && rev.timestamp, url: `https://en.wikipedia.org/w/index.php?title=${encodeURIComponent(page.title.replace(/ /g, "_"))}&oldid=${rev && rev.revid}` };
}

// the shortest source sentence containing every required term and every non-year claim number (years: sentence or title)
function evidenceFor(fact, src) {
  const terms = (fact.terms || []).map(fold);
  const nums = [...new Set(FR.numbersIn(fact.claim))];
  const titleNums = new Set(FR.numbersIn(src.title));
  const candidates = sentences(src.text).filter((s) => terms.every((t) => fold(s).includes(t)));
  const fits = candidates.filter((s) => { const have = new Set(FR.numbersIn(s)); return nums.every((n) => have.has(n) || (isYear(n) && titleNums.has(n))); })
    .filter((s) => words(s) >= 5 && words(s) <= 80).sort((a, b) => a.length - b.length);
  if (fits[0]) return { quote: fits[0] };
  const near = sentences(src.text).map((s) => ({ s, hit: terms.filter((t) => fold(s).includes(t)).length })).filter((x) => x.hit).sort((a, b) => b.hit - a.hit || a.s.length - b.s.length).slice(0, 3).map((x) => x.s);
  return { error: candidates.length ? `a sentence has the terms but not every claim number (${nums.join(", ")}) or is not 5-80 words` : `no sentence contains all of: ${fact.terms.join(" + ")}`, near };
}

async function verifyDraft(draft, fetchJson = get) {
  const errors = []; const cache = new Map(); const facts = [];
  for (const [i, f] of draft.facts.entries()) {
    const id = f.id || `F${i + 1}`;
    try {
      if (!cache.has(f.source)) cache.set(f.source, await article(f.source, fetchJson));
      const src = cache.get(f.source); const ev = evidenceFor(f, src);
      if (ev.error) { errors.push(`fact ${id}: ${ev.error}`); facts.push({ id, claim: f.claim, quote: "", layer: "UNVERIFIED", source: `Wikipedia: ${src.title}`, url: src.url, near: ev.near }); continue; }
      if (!quoteFound(src.text, ev.quote)) { errors.push(`fact ${id}: extracted sentence not found verbatim (internal check)`); continue; }
      facts.push({ id, role: f.role || null, claim: f.claim, quote: ev.quote, source: `Wikipedia: ${src.title} (revision ${src.revid}, ${src.timestamp})`, url: src.url, sourceTitle: src.title, revid: src.revid, layer: "VERIFIED FACT" });
    } catch (e) { errors.push(`fact ${id}: ${e.message}`); facts.push({ id, claim: f.claim, quote: "", layer: "UNVERIFIED", source: f.source, url: null }); }
  }
  const byId = new Map(facts.map((f) => [f.id, f]));
  const narration = draft.narration.map((l, i) => {
    const cited = (l.facts || []).map((id) => byId.get(id)).filter(Boolean);
    if (!cited.length) errors.push(`line ${i + 1}: cites no fact`);
    const have = new Set(cited.flatMap((f) => [...FR.numbersIn(f.quote), ...FR.numbersIn(f.sourceTitle || "")]));
    const missing = FR.numbersIn(l.text).filter((n) => !have.has(n));
    if (missing.length) errors.push(`line ${i + 1}: number(s) ${missing.join(", ")} not in the quotes of its cited facts`);
    if (cited.some((f) => f.layer !== "VERIFIED FACT")) errors.push(`line ${i + 1}: cites an unverified fact`);
    if (/["“”]/.test(l.text)) errors.push(`line ${i + 1}: narration must not quote anyone (no quotation marks)`);
    return { role: l.role, text: l.text, layer: "VERIFIED FACT", facts: l.facts || [] };
  });
  const ok = errors.length === 0;
  return {
    id: draft.id, slug: draft.slug, title: draft.title, coreQuestion: draft.coreQuestion, pillar: draft.pillar, channel: "goal-lore-lab",
    hypothetical: false, researchStatus: ok ? "VERIFIED" : "RESEARCHED", productionReady: ok, researchedAt: new Date().toISOString(),
    researchMethod: "scripts/gll-research/verify.js: claims drafted by hand from search; every quote copied verbatim by code from the live Wikipedia article at the pinned revision; claim and narration numbers checked against the quotes",
    rights: { footage: "none (original animation only)", likeness: "generic player tokens, no kits or crests" },
    narration, facts: facts.map(({ near, ...f }) => f), verification: { ok, errors, near: Object.fromEntries(facts.filter((f) => f.near).map((f) => [f.id, f.near])) },
  };
}

async function run(argv = process.argv.slice(2), { fetchJson = get, log = console.log } = {}) {
  const only = (argv[argv.indexOf("--only") + 1] || "").split(",").filter((x) => argv.includes("--only") && x);
  const drafts = fs.readdirSync(DRAFTS).filter((f) => f.endsWith(".json")).map((f) => JSON.parse(fs.readFileSync(path.join(DRAFTS, f), "utf8")))
    .filter((d) => !only.length || only.includes(d.id)).sort((a, b) => a.id.localeCompare(b.id));
  const records = [];
  for (const d of drafts) { const r = await verifyDraft(d, fetchJson); records.push(r); log(`${r.id} ${r.researchStatus}${r.verification.errors.length ? ": " + r.verification.errors.join("; ") : ""}`); }
  const report = records.map((r) => ({ id: r.id, status: r.researchStatus, errors: r.verification.errors, near: r.verification.near, quotes: r.facts.map((f) => ({ id: f.id, quote: f.quote, url: f.url })) }));
  const reportAt = argv.includes("--report") ? argv[argv.indexOf("--report") + 1] : null;
  if (reportAt) fs.writeFileSync(reportAt, JSON.stringify(report, null, 1) + "\n");
  if (argv.includes("--write")) {
    const prev = fs.existsSync(UNIVERSE) ? JSON.parse(fs.readFileSync(UNIVERSE, "utf8")) : { topics: [] };
    const keep = (prev.topics || []).filter((t) => !records.some((r) => r.id === t.id));
    const topics = [...keep, ...records].sort((a, b) => a.id.localeCompare(b.id));
    fs.writeFileSync(UNIVERSE, JSON.stringify({ schema: "goal-lore-lab.topic-universe.v1", channel: "goal-lore-lab", generatedBy: "scripts/gll-research/verify.js",
      counts: { VERIFIED: topics.filter((t) => t.researchStatus === "VERIFIED").length, RESEARCHED: topics.filter((t) => t.researchStatus !== "VERIFIED").length }, topics }, null, 1) + "\n");
    log(`wrote ${path.relative(ROOT, UNIVERSE)}`);
  }
  const verified = records.filter((r) => r.productionReady).length;
  log(`verified ${verified}/${records.length}`);
  return { records, verified };
}

if (require.main === module) run().catch((e) => { console.error(e.message); process.exit(1); });
module.exports = { run, verifyDraft, evidenceFor, sentences, article };
