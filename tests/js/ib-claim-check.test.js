"use strict";
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..", "..");
const C = require(path.join(ROOT, "scripts/ib-research/claim-check"));
const page = (extract) => async () => ({ query: { pages: [{ title: "Kola Superdeep Borehole", extract, revisions: [{ revid: 7, timestamp: "t" }] }] } });
const KOLA = "Drilling at Kola SG-3 began in 1970 using the Uralmash-4E, and later the Uralmash-15000 series drilling rig. In 1974, the new Uralmash-15000 rig was installed onsite, named after the new target depth, set at 15,000 metres (49,000 ft). The third hole reached 12,262 metres (40,230 ft) in 1989. The drilling of the fourth hole was stopped due to higher-than-expected temperatures of 180 °C (356 °F) in 1992 at 11,882 metres (38,983 ft) of depth. A total of five 23-centimetre-diameter (9 in) boreholes were drilled.";

test("IB claim check: every fact quoted from its source; a number the source lacks fails; unnumbered lines go to a person", async () => {
  const ok = await C.check("IB-EXT-050", page(KOLA)); assert.equal(ok.ok, true, JSON.stringify(ok.facts.filter((f) => !f.quote)));
  assert.ok(ok.facts.every((f) => f.quote && KOLA.includes(f.quote)));
  assert.ok(ok.lines.some((l) => l.status === "HUMAN"), "a line with no number is never reported as verified");
  const bad = await C.check("IB-EXT-050", page(KOLA.replace("12,262", "12,000"))); assert.equal(bad.ok, false, "a changed number fails the check");
  const wf = fs.readFileSync(path.join(ROOT, ".github/workflows/ib-claim-check.yml"), "utf8");
  assert.match(wf, /contents: read/); assert.doesNotMatch(wf, /secrets\.|git push/);
});

test("IB claim-source ledger: one record per fact with its passage, numbers and status; a missing number is UNVERIFIED", async () => {
  const ok = await C.check("IB-EXT-050", page(KOLA));
  assert.equal(ok.records.length, ok.facts.length);
  for (const r of ok.records) { assert.equal(r.status, "VERIFIED"); assert.ok(r.passage && KOLA.includes(r.passage)); assert.deepEqual(r.numbers.missing, []); assert.ok(/^https:\/\/en\.wikipedia\.org\/wiki\//.test(r.url)); }
  const bad = await C.check("IB-EXT-050", page(KOLA.replace("12,262", "12,000")));
  assert.ok(bad.records.some((r) => r.status === "UNVERIFIED" && !r.passage && r.reason));
  const CS = require(path.join(ROOT, "core/research/claim-sources"));
  for (const u of ["https://www.nist.gov/topics/physics", "https://science.nasa.gov/", "https://www.nih.gov/research-training", "https://home.cern/science", "https://www.ipcc.ch/reports/", "https://example.org/"]) assert.equal(CS.isGenericPage(u), true, u);
  for (const u of ["https://science.nasa.gov/earth/facts/", "https://oceanservice.noaa.gov/education/tutorial_currents/04currents1.html", "https://en.wikipedia.org/wiki/Earth%27s_rotation"]) assert.equal(CS.isGenericPage(u), false, u);
});
