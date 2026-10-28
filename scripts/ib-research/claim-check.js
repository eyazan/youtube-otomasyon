"use strict";
// ImpossibleBrief claim check (owner condition for the first real IB upload): every fact of a topic is matched against
// its source article's current text, sentence by sentence, with the same rule the GoalLore Lab / FR verifiers use
// (scripts/gll-research/verify.js evidenceFor: every claim number in one sentence that shares >= 50% of the claim's
// content words). Narration lines labelled KNOWN SCIENCE must have every number in a verified fact; lines with no number
// are listed with their nearest source sentences for the human review, never reported as verified.
//   node scripts/ib-research/claim-check.js IB-EXT-050 [IB-...]     (network: en.wikipedia.org; exit 1 on any failure)
const path = require("path");
const ROOT = path.join(__dirname, "..", "..");
const Adapter = require(path.join(ROOT, "scripts/bto-studio/adapter"));
const V = require(path.join(ROOT, "scripts/gll-research/verify"));
const nums = (s) => (String(s).match(/\d[\d,.]*/g) || []).map((n) => n.replace(/[,.]$/, "").replace(/,/g, ""));
const wikiTitle = (f) => (f.url && /wikipedia\.org\/wiki\//.test(f.url) ? decodeURIComponent(f.url.split("/wiki/")[1]).replace(/_/g, " ") : String(f.source || "").replace(/^Wikipedia\s*[—-]\s*/, ""));

async function check(id, fetchJson) {
  const { topic } = Adapter.loadTopic("impossible-brief", id); const out = { id, facts: [], lines: [], ok: true }; const cache = new Map();
  for (const [i, f] of topic.facts.entries()) {
    const title = wikiTitle(f);
    try { if (!cache.has(title)) cache.set(title, await V.article(title, fetchJson)); const src = cache.get(title);
      const ev = V.evidenceFor({ claim: f.claim, terms: [] }, src);
      out.facts.push({ id: `F${i + 1}`, claim: f.claim, source: `${src.title} rev ${src.revid}`, ...(ev.quote ? { quote: ev.quote } : { error: ev.error, near: ev.near }) });
      if (!ev.quote) out.ok = false;
    } catch (e) { out.facts.push({ id: `F${i + 1}`, claim: f.claim, error: e.message }); out.ok = false; }
  }
  const verified = out.facts.filter((f) => f.quote); const quoted = verified.flatMap((f) => nums(f.quote));
  const src = [...cache.values()][0];
  for (const L of (topic.narration || [])) { const text = L.text || L.metin || L.line || ""; const layer = L.layer || "";
    // a spoken number may round a quoted one ("716 times a second" for 716.35 Hz), never change it
    const has = (x) => quoted.some((q) => q === x || (q.includes(".") && Math.round(+q) === +x) || (q.includes(".") && Math.trunc(+q) === +x));
    const n = nums(text); const missing = n.filter((x) => !has(x));
    const near = src ? V.sentences(src.text).map((s) => ({ s, sc: V.support(text, s) })).sort((a, b) => b.sc - a.sc).slice(0, 2).map((x) => x.s) : [];
    const status = n.length ? (missing.length ? "FAIL" : "VERIFIED-NUMBERS") : "HUMAN";
    if (status === "FAIL" && /KNOWN/i.test(layer)) out.ok = false;
    out.lines.push({ layer, text, status, ...(missing.length ? { missing } : {}), ...(status !== "VERIFIED-NUMBERS" ? { near } : {}) }); }
  return out;
}

if (require.main === module) {
  (async () => { let ok = true;
    for (const id of process.argv.slice(2)) { const r = await check(id); ok = ok && r.ok;
      console.log(`## ${id}: ${r.ok ? "PASS" : "FAIL"}`);
      for (const f of r.facts) console.log(`- ${f.id} ${f.quote ? "VERIFIED" : "FAIL"}: ${f.claim}\n    ${f.quote ? `quote: "${f.quote}" (${f.source})` : `${f.error}${f.near ? "\n    near: " + f.near.join(" | ") : ""}`}`);
      for (const l of r.lines) console.log(`- [${l.layer}] ${l.status}: ${l.text}${l.missing ? ` (numbers not in a verified quote: ${l.missing.join(", ")})` : ""}${l.near ? `\n    nearest source sentences: ${l.near.join(" | ")}` : ""}`); }
    // the job lists every topic; it is red when any topic fails (a failing topic is never published)
    process.exit(ok ? 0 : 1); })().catch((e) => { console.error(e.message); process.exit(1); });
}
module.exports = { check };
