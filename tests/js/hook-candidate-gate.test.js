"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const Config = require("../../core/growth/config");
const Hooks = require("../../core/growth/hooks");

const merged = () => ({ hooks: { minimumCandidates: 20, minimumScore: 76 } });
const ch = { slug: "impossible-brief" };

test("hook candidate gate: off unless enabled and approved; bounded", () => {
  assert.equal(Config.applyHookCandidateGate(merged(), { minimumCandidates: 16, minimumFamilies: 7, minimumStrong: 8, strongScore: 70, enabled: false }, ch), null);
  assert.throws(() => Config.applyHookCandidateGate(merged(), { minimumCandidates: 16, minimumFamilies: 7, minimumStrong: 8, strongScore: 70, enabled: true }, ch), /approvedBy/);
  assert.throws(() => Config.applyHookCandidateGate(merged(), { minimumCandidates: 10, minimumFamilies: 7, minimumStrong: 8, strongScore: 70, enabled: true, approvedBy: "x" }, ch), /minimumCandidates/);
  const m = merged(); Config.applyHookCandidateGate(m, { minimumCandidates: 16, minimumFamilies: 7, minimumStrong: 8, strongScore: 70, enabled: true, approvedBy: "owner" }, ch);
  assert.equal(m.hooks.minimumCandidates, 16); assert.equal(m.hooks.portfolioMinimumCandidates, 20); assert.equal(m.hooks.minimumScore, 76, "the selected hook's minimum score is unchanged");
  // the shipped channel file keeps the gate off
  const ib = Config.forChannel(require("../../core/channel-context").getChannel("impossible-brief"));
  assert.equal(ib.hooks.gate, undefined); assert.equal(ib.hooks.minimumCandidates, 20);
});

test("hook candidate gate: needs variety and strength, not a count; blocked candidates never count", () => {
  const config = { hooks: { minimumCandidates: 16, gate: { minimumCandidates: 16, minimumFamilies: 7, minimumStrong: 8, strongScore: 70 } } };
  const mk = (n, families, score, blocked = false) => Array.from({ length: n }, (_, i) => ({ family: `f${i % families}`, adjustedTotal: score, blocked }));
  const gen = (scored) => Hooks.meetsGate(scored, config);
  assert.equal(gen(mk(16, 8, 75)), true);
  assert.equal(gen(mk(20, 3, 75)), false, "twenty candidates from three families are not variety");
  assert.equal(gen(mk(16, 8, 60)), false, "weak candidates do not count as strong");
  assert.equal(gen([...mk(12, 8, 75), ...mk(8, 8, 75, true)]), false, "blocked candidates never count");
});
