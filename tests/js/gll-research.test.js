"use strict";
// GoalLore Lab research verification (scripts/gll-research/verify.js): a quote is only ever a sentence copied from the
// fetched source; a claim or narration number the source does not carry keeps the topic out of production.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const V = require("../../scripts/gll-research/verify");

const ROOT = path.resolve(__dirname, "..", "..");
const TEXT = "The match was played on 3 June 1997 in Lyon. Roberto Carlos scored a free kick from 35 metres that swerved past the wall. Brazil and France drew. A later study by physicists explained the curve.";
const fetchJson = async (url) => ({ query: { pages: [{ title: decodeURIComponent(new URL(url).searchParams.get("titles")), extract: TEXT, revisions: [{ revid: 123, timestamp: "2026-10-27T00:00:00Z" }] }] } });
const draft = (over = {}) => ({ id: "GLL-T1", slug: "t1", title: "T", coreQuestion: "Q?", pillar: "MOMENTS",
  facts: [{ id: "F1", source: "1997 Test", claim: "Roberto Carlos scored a free kick from 35 metres.", terms: ["Roberto Carlos", "free kick"] }, { id: "F2", source: "1997 Test", claim: "Physicists explained the curve.", terms: ["physicists"] }],
  narration: [{ role: "HOOK", text: "A free kick from 35 metres.", facts: ["F1"] }, { role: "CONTEXT", text: "Lyon, 1997.", facts: ["F1"] }, { role: "PAYOFF", text: "Physicists explained it.", facts: ["F2"] }], ...over });

test("a fact's quote is the source's own sentence, pinned to the revision read", async () => {
  const r = await V.verifyDraft(draft(), fetchJson);
  assert.equal(r.researchStatus, "VERIFIED", r.verification.errors.join("; ")); assert.equal(r.productionReady, true);
  assert.equal(r.facts[0].quote, "Roberto Carlos scored a free kick from 35 metres that swerved past the wall.");
  assert.ok(TEXT.includes(r.facts[0].quote)); assert.match(r.facts[0].url, /oldid=123$/); assert.equal(r.facts[0].layer, "VERIFIED FACT");
  assert.equal(r.narration[1].text, "Lyon, 1997.", "a year may come from the source title");
});

test("a claim number the source does not carry, or missing terms, leave the fact unverified and the topic out of production", async () => {
  const wrongNumber = await V.verifyDraft(draft({ facts: [{ id: "F1", source: "Test", claim: "Roberto Carlos scored a free kick from 40 metres.", terms: ["Roberto Carlos", "free kick"] }, draft().facts[1]] }), fetchJson);
  assert.equal(wrongNumber.productionReady, false); assert.match(wrongNumber.verification.errors.join(" "), /fact F1: .*claim number/);
  assert.equal(wrongNumber.facts[0].quote, "", "no quote is invented");
  const noTerms = await V.verifyDraft(draft({ facts: [{ id: "F1", source: "Test", claim: "Pelé scored.", terms: ["Pelé"] }, draft().facts[1]] }), fetchJson);
  assert.equal(noTerms.researchStatus, "RESEARCHED"); assert.match(noTerms.verification.errors.join(" "), /no sentence contains all of: Pelé/);
});

test("narration may only state numbers its cited quotes carry, cites at least one fact and never quotes anyone", async () => {
  const r = await V.verifyDraft(draft({ narration: [{ role: "HOOK", text: "A free kick from 40 metres.", facts: ["F1"] }, { role: "X", text: "No source.", facts: [] }, { role: "Y", text: "He said \"wow\".", facts: ["F2"] }] }), fetchJson);
  assert.equal(r.productionReady, false);
  const e = r.verification.errors.join(" | ");
  assert.match(e, /line 1: number\(s\) 40 not in the quotes/); assert.match(e, /line 2: cites no fact/); assert.match(e, /line 3: narration must not quote anyone/);
});

test("offline, verification fails closed", async () => {
  const r = await V.verifyDraft(draft(), async () => { throw new Error("getaddrinfo ENOTFOUND en.wikipedia.org"); });
  assert.equal(r.productionReady, false); assert.ok(r.facts.every((f) => f.layer === "UNVERIFIED" && !f.quote));
});

test("every draft is well formed: each line cites a draft fact, no draft carries a quote, CriticalThread topics never appear", () => {
  const dir = path.join(ROOT, "channels", "goal-lore-lab", "research", "drafts");
  const ct = new Set(JSON.parse(fs.readFileSync(path.join(ROOT, "channels", "critical-thread", "state", "published.json"), "utf8")).map((p) => p.slug));
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json")); assert.ok(files.length >= 7);
  for (const f of files) {
    const d = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
    assert.equal(d.channel, "goal-lore-lab"); assert.ok(!ct.has(d.slug), `${d.id} is not an old CriticalThread topic`);
    const ids = new Set(d.facts.map((x) => x.id));
    for (const x of d.facts) { assert.ok(!("quote" in x), `${d.id} ${x.id}: drafts never carry a quote`); assert.ok(x.terms.length, `${d.id} ${x.id} has evidence terms`); }
    for (const l of d.narration) assert.ok(l.facts.length && l.facts.every((id) => ids.has(id)), `${d.id}: "${l.text}" cites draft facts`);
  }
});

test("a heading, a list lead-in, or a sentence sharing too few of the claim's words is never a quote", async () => {
  const text = "==== The Hand of God ====\nThe goal is known as the Hand of God by many. Notable differences with the 1891 law:\nIn the semi-final, Italy faced West Germany at Estadio Azteca.";
  const f = async (url) => ({ query: { pages: [{ title: "Test", extract: text, revisions: [{ revid: 1, timestamp: "t" }] }] } });
  const src = await V.article("Test", f);
  assert.equal(V.evidenceFor({ claim: "Maradona's goal became known as the Hand of God.", terms: ["Hand of God"] }, src).quote, "The goal is known as the Hand of God by many.");
  assert.ok(V.evidenceFor({ claim: "The 1891 law.", terms: ["1891"] }, src).error, "a list lead-in ending with a colon is refused");
  assert.ok(V.evidenceFor({ claim: "Brazil beat Italy in the final at Estadio Azteca in Mexico City in front of a record crowd.", terms: ["Azteca"] }, src).error, "a sentence about another match shares too few words");
});

test("Hidden Logic of Things drafts answer existing universe questions, carry no quote, and every line cites a draft fact", async () => {
  const dir = path.join(ROOT, "channels", "behind-the-ordinary", "research", "drafts");
  const rows = new Map(JSON.parse(fs.readFileSync(path.join(ROOT, "channels", "behind-the-ordinary", "topics", "topic-universe.json"), "utf8")).topics.map((t) => [t.id, t]));
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".json"))) {
    const d = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")); const row = rows.get(d.id);
    assert.ok(row && row.slug === d.slug, `${d.id} is a universe question`); assert.equal(d.channel, "behind-the-ordinary");
    const ids = new Set(d.facts.map((x) => x.id));
    for (const x of d.facts) { assert.ok(!("quote" in x), `${d.id} ${x.id}`); assert.ok(x.terms.length); }
    for (const l of d.narration) assert.ok(l.facts.length && l.facts.every((id) => ids.has(id)), `${d.id}: ${l.text}`);
  }
  const r = await V.verifyDraft(draft(), fetchJson, "behind-the-ordinary");
  assert.equal(r.channel, "behind-the-ordinary"); assert.match(r.rights.likeness, /no brands/);
});

test("Hidden Logic of Things primary pages: a quote is the page's own sentence on a primary host; Wikipedia never counts as primary", async () => {
  const html = "<html><head><title>Load Lines</title><script>var x='It has long been recognized that ignore me.'</script></head><body><nav>Menu</nav>"
    + "<p>It has long been recognized that limitations on the draught to which a ship may be loaded make a significant contribution to her safety.</p>"
    + "<p>The first International Convention on Load Lines, adopted in 1930, was based on the principle of reserve buoyancy.</p></body></html>";
  const fetchText = async (url) => ({ url, html });
  const facts = [
    { id: "F1", source: "https://www.imo.org/en/About/Conventions/Pages/International-Convention-on-Load-Lines.aspx", claim: "Limitations on the draught to which a ship may be loaded make a significant contribution to her safety.", terms: ["draught", "safety"] },
    { id: "F2", source: "https://www.imo.org/en/About/Conventions/Pages/International-Convention-on-Load-Lines.aspx", claim: "The first International Convention on Load Lines was adopted in 1930.", terms: ["1930"] },
  ];
  const d = draft({ facts, narration: [{ role: "HOOK", text: "A ship's safe draught matters.", facts: ["F1"] }, { role: "X", text: "The first convention came in 1930.", facts: ["F2"] }] });
  const r = await V.verifyDraft(d, fetchJson, "behind-the-ordinary", fetchText);
  assert.equal(r.facts[0].layer, "VERIFIED FACT"); assert.ok(html.includes(r.facts[0].quote)); assert.equal(r.facts[0].primary, true); assert.match(r.facts[0].textSha256, /^[0-9a-f]{64}$/);
  assert.equal(r.sources.length, 1, "one primary page"); assert.equal(r.researchStatus, "NEEDS_PRIMARY_SOURCE", "two facts and one page are still below the channel standard");
  assert.match(r.verification.errors.join(" "), /fewer than two distinct primary source pages/);
  assert.ok(!r.verification.errors.some((e) => /fewer than two facts from primary/.test(e)), "two verified primary facts are counted as two");
  const off = await V.verifyDraft(draft({ facts: [{ ...facts[0], source: "https://example.com/load-lines" }], narration: [{ role: "H", text: "x.", facts: ["F1"] }] }), fetchJson, "behind-the-ordinary", fetchText);
  assert.match(off.verification.errors.join(" "), /not a primary host/);
  const gll = await V.verifyDraft(draft({ facts: [facts[0]], narration: [{ role: "H", text: "x.", facts: ["F1"] }] }), fetchJson, "goal-lore-lab", fetchText);
  assert.match(gll.verification.errors.join(" "), /not a primary host for goal-lore-lab/);
  assert.doesNotMatch(V.pageText(html).text, /ignore me/, "scripts are never quoted");
});

test("Hidden Logic of Things: a VERIFIED record is productionReady only with its full editorial package", async () => {
  const html = "<html><head><title>Load Lines</title></head><body><p>It has long been recognized that limitations on the draught to which a ship may be loaded make a significant contribution to her safety.</p>"
    + "<p>The first International Convention on Load Lines, adopted in 1930, was based on the principle of reserve buoyancy.</p></body></html>";
  const fetchText = async (url) => ({ url, html });
  const A = "https://www.imo.org/en/About/Conventions/Pages/International-Convention-on-Load-Lines.aspx", B = "https://www.imo.org/en/OurWork/Safety/Pages/LoadLines.aspx";
  const one = (id, source) => ({ id, source, claim: "Limitations on the draught to which a ship may be loaded make a significant contribution to her safety.", terms: ["draught", "safety"] });
  const facts = [one("F1", A), one("F2", B), one("F3", A), one("F4", B), one("F5", A)];
  const narration = facts.map((f) => ({ role: "X", text: "A ship's safe draught matters for her safety.", facts: [f.id] }));
  const bare = await V.verifyDraft(draft({ facts, narration }), fetchJson, "behind-the-ordinary", fetchText);
  assert.equal(bare.researchStatus, "VERIFIED"); assert.equal(bare.productionReady, false);
  assert.match(bare.verification.errors.join(" "), /editorial package incomplete \(hook, openingLine/);
  const editorial = { hook: "h.", openingLine: "h.", secondBeat: "s.", mechanism: "m", expectedConsequence: "c", misconception: "x.", payoff: "p.", thumbnailText: "T", editorialTitles: ["a", "b", "c"] };
  const full = await V.verifyDraft(draft({ facts, narration, editorial }), fetchJson, "behind-the-ordinary", fetchText);
  assert.equal(full.productionReady, true); assert.equal(full.payoff, "p."); assert.deepEqual(full.editorialTitles, ["a", "b", "c"]);
});
