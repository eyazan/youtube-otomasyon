"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const L = require("../../core/pipeline/validation-layers");

test("validation layers: factual and fidelity reasons are FACTUAL, score is CREATIVE, unknown fails closed", () => {
  assert.equal(L.layerOf("creative fidelity: the plant drawing would show a structural crack"), "FACTUAL");
  assert.equal(L.layerOf("visual mechanism not declared by a person (CREATIVE_REVIEW_REQUIRED)"), "FACTUAL");
  assert.equal(L.layerOf("fact 2: no stored verbatim quote"), "FACTUAL");
  assert.equal(L.layerOf("viral score 62 below the channel floor 65"), "CREATIVE");
  assert.equal(L.layerOf("already published (abc)"), "STATE");
  assert.equal(L.layerOf("something nobody classified"), "FACTUAL");
  const p = L.packageLayers({ qa: { objectivePass: false, objective: [{ name: "loudness", hard: true, status: "FAIL" }, { name: "loop", hard: false, status: "WARN" }], creative: [{ name: "motion in the first 2 s", status: "WARN" }] } });
  assert.equal(p.TECHNICAL.blocking, true); assert.deepEqual(p.TECHNICAL.failed, ["loudness"]); assert.equal(p.CREATIVE.blocking, false);
});
