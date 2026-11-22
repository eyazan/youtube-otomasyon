"use strict";
// Faz 0 (docs/plans/2026-11-15-faz-0-plan.md): a manual run may name one ImpossibleBrief topic. The named topic is the only
// candidate: an unknown id is a clear error, and a topic without enough licensed pictures is refused with the reason,
// never swapped for another topic.
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..", "..");
const Channel = require("../../core/channel-context");
const Discovery = require("../../core/discovery");
const Pipeline = require("../../core/pipeline/impossible-brief");

const ib = Channel.getChannel("impossible-brief");
const universe = Discovery.universe(ib).topics;
const lane = fs.readFileSync(path.join(ROOT, "core", "pipeline", "impossible-brief.js"), "utf8");

test("selects the named topic and skips the calendar check", () => {
  assert.equal(Pipeline.explicitTopic(ib, "IB-EAR-006", universe).slug, "what-if-yellowstone-erupted-again");
  assert.equal(Pipeline.explicitTopic(ib, "what-if-the-1859-solar-superstorm-hit-today", universe).id, "IB-SPA-006");
  // the due/calendar check runs only without a named topic
  assert.match(lane, /if \(!explicit && process\.env\.PUBLISH === "1"\) \{\n +const due = /);
});

test("throws a clear error for unknown topic id", () => {
  assert.throws(() => Pipeline.explicitTopic(ib, "IB-XXX-999", universe), /topic not found: IB-XXX-999/);
});

test("rejects a topic that fails the 4-licensed-visuals rule", () => {
  const shortfall = "1 licensed pictures/clips < 4";
  assert.deepEqual(Pipeline.precheckAction("IB-EAR-006", shortfall), { action: "reject", reason: `IB-EAR-006: visual pre-check ${shortfall}; no other topic was chosen` });
  assert.deepEqual(Pipeline.precheckAction(undefined, shortfall), { action: "skip" }, "scheduled choice still moves on");
  assert.deepEqual(Pipeline.precheckAction("IB-EAR-006", null), { action: "render" });
  // the pre-check now runs for a named topic too, and a refusal ends the run (exit 1) instead of picking again
  assert.match(lane, /const shortfall = !noRender \? visualShortfall\(topic, output\) : null;/);
  assert.match(lane, /if \(gate\.action === "reject"\) \{\n(?:[^\n]*\n){2} +return 1;\n +\}/);
});

test("workflow: topic input reaches only the ImpossibleBrief legacy lane, through the environment", () => {
  const wf = fs.readFileSync(path.join(ROOT, ".github", "workflows", "portfolio-production.yml"), "utf8");
  assert.match(wf, /\n      topic:\n        description: [^\n]+\n        type: string\n        default: ''\n/);
  const step = wf.slice(wf.indexOf("- name: ImpossibleBrief Short"), wf.indexOf("# GoalLore Lab: premium-only lane"));
  assert.match(step, /IB_TOPIC: \$\{\{ inputs\.topic \}\}/);
  assert.match(step, /node shorts-sira\.js --channel impossible-brief \$\{IB_TOPIC:\+"\$IB_TOPIC"\}/);
  assert.doesNotMatch(step.slice(step.indexOf("run: |")), /inputs\.topic/, "never interpolated into the shell");
  // a topic run must be channel=impossible-brief, engine=legacy, and a well-formed id or slug; checked before anything renders
  const check = wf.slice(wf.indexOf("- name: Manual topic check"), wf.indexOf("- name: Portfolio plan"));
  assert.match(check, /impossible-brief/); assert.match(check, /legacy/); assert.match(check, /exit 1/);
});
