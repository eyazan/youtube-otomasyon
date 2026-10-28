"use strict";
// Content and research bots may push to main only through scripts/ci/push-if-green.sh (tests must pass on the
// rebased tree). Production state commits are exempt on purpose: their state must persist (duplicate-upload guard).
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..", "..");
const wf = (f) => fs.readFileSync(path.join(ROOT, ".github", "workflows", f), "utf8");

test("content bots push to main only when the repository tests pass", () => {
  for (const f of ["gll-research.yml", "bto-research.yml", "topic-buffer.yml", "wiki-popularity.yml", "competitor-intelligence.yml", "fr-library.yml"]) {
    const y = wf(f);
    assert.match(y, /bash scripts\/ci\/push-if-green\.sh /, `${f} commits through push-if-green`);
    assert.doesNotMatch(y, /git push/, `${f} has no direct git push`);
    assert.match(y, /npm ci/, `${f} installs the modules the tests load`);
  }
  const s = fs.readFileSync(path.join(ROOT, "scripts", "ci", "push-if-green.sh"), "utf8");
  assert.ok(s.indexOf("node --test tests/js/*.test.js") < s.indexOf("git push"), "tests run before the push");
  assert.match(s, /exit 1/);
});

test("the test workflow runs on every pull request and every push to main", () => {
  const y = wf("test.yml");
  assert.match(y, /pull_request:/); assert.match(y, /push:\s*\n\s*branches: \[main\]/);
});

test("FR library: from batch-23 every scene line rests on a verbatim article sentence; numbers alone are not evidence", () => {
  const B = require("../../scripts/fr-library/build");
  assert.equal(B.needsEvidence("batch-22"), false); assert.equal(B.needsEvidence("batch-23"), true);
  const art = { title: "Therac-25", text: "The Therac-25 was a computer-controlled radiation therapy machine produced by Atomic Energy of Canada Limited in 1982. It was involved in at least six accidents between 1985 and 1987, in which patients were given massive overdoses of radiation. The machine relied on software interlocks where earlier models had independent hardware interlocks." };
  const seed = { sahneler: ["A therapy machine gave massive radiation overdoses.", "At least six accidents happened.", "Its safety checks lived only in software."],
    kanit: [{ iddia: "It was involved in at least six accidents in which patients were given massive overdoses of radiation.", terimler: ["six accidents", "overdoses"], sahneler: [0, 1] },
      { iddia: "The machine relied on software interlocks where earlier models had hardware interlocks.", terimler: ["software interlocks", "hardware interlocks"], sahneler: [2] }] };
  const ok = B.claimEvidence(seed, art);
  assert.deepEqual(ok.errors, []); assert.equal(ok.kanitlar.length, 2); assert.ok(art.text.includes(ok.kanitlar[0].alinti), "the quote is the article's own sentence");
  const bad = B.claimEvidence({ ...seed, kanit: [seed.kanit[0], { iddia: "The Therac-25 killed twelve patients.", terimler: ["twelve"], sahneler: [2] }] }, art);
  assert.match(bad.errors.join(" "), /claim not in the article/); assert.match(bad.errors.join(" "), /scene line\(s\) 3 rest on no verified article sentence/);
});
