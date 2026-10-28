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
