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
