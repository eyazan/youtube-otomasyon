"use strict";
// Premium topic selection: an uncalibrated viral score ranks instead of excluding (opt-in, with a floor), and the funnel
// places every refused topic at the stage that stops it (nothing disappears from the inventory).
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const Lane = require("../../core/pipeline/premium-lane");
const Funnel = require("../../scripts/growth/topic-funnel");

function channelWith(status) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sel-")); fs.mkdirSync(path.join(dir, "growth"));
  fs.writeFileSync(path.join(dir, "growth", "predictions.json"), JSON.stringify({ calibration: { short: { viralScore: { n: 17, spearman: 0.05, status } } } }));
  return { slug: "x", paths: { state: dir } };
}

test("soft viral gate: only with the opt-in and only while the score is not predictive; floor never below 55", () => {
  const on = { premiumSelection: { viralScore: "rank-when-uncalibrated", floor: 62 } };
  assert.deepEqual(Lane.softViralGate(channelWith("WEAK"), on), { floor: 62, status: "WEAK" });
  assert.equal(Lane.softViralGate(channelWith("PREDICTIVE"), on), null, "a predictive score keeps its hard minimum");
  assert.equal(Lane.softViralGate(channelWith("WEAK"), {}), null, "no opt-in: hard minimum");
  assert.equal(Lane.softViralGate(channelWith("WEAK"), { premiumSelection: { viralScore: "rank-when-uncalibrated", floor: 10 } }).floor, 55);
});

test("funnel: a topic stops at its first failing stage; history is never selectable", () => {
  assert.equal(Funnel.stoppedAt([]), "RENDERABLE");
  assert.equal(Funnel.stoppedAt(["already published (abc)", "viral score 60 below the channel minimum 75"]), "HISTORY");
  assert.equal(Funnel.stoppedAt(["topic is not researched (no sourced facts)", "SOURCE_UNVERIFIED: no claim-source ledger"]), "UNRESEARCHED");
  assert.equal(Funnel.stoppedAt(["SOURCE_UNVERIFIED: no claim-source ledger", "CREATIVE_REVIEW_REQUIRED: x"]), "RESEARCHED");
  assert.equal(Funnel.stoppedAt(["viral score 60 below the channel floor 62"]), "VERIFIED");
  assert.equal(Funnel.stoppedAt(["CREATIVE_REVIEW_REQUIRED: the research record declares no visual mechanism"]), "CREATIVE_VIABLE");
});
