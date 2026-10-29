"use strict";
// Plan-driven 3D kit (pilots/, review only): the planner plans covered mechanism classes from evidence and refuses the rest.
const test = require("node:test"); const assert = require("node:assert/strict");
const fs = require("fs"); const os = require("os"); const path = require("path");
const { plan, loadTopic, checkEvidence, Refusal } = require("../../pilots/lib/planner");
const ROOT = path.resolve(__dirname, "../.."); const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "planner-"));
const universe = (() => { const t = JSON.parse(fs.readFileSync(path.join(ROOT, "channels/goal-lore-lab/topics/topic-universe.json"), "utf8")); return Array.isArray(t) ? t : (t.topics || t); })();
const gll = (id) => { const f = path.join(tmp, `${id}.json`); fs.writeFileSync(f, JSON.stringify(universe.find((x) => x.id === id))); return f; };
const linesOf = (file) => { const t = JSON.parse(fs.readFileSync(file, "utf8")); return t.narration ? t.narration.map((l) => l.text) : t.sahneler.map((s) => s.metin); };
const cuesFor = (file) => linesOf(file).map((text, i) => ({ start: i * 5, end: i * 5 + 5, lines: [text] }));
const run = (file) => plan(file, cuesFor(file), linesOf(file).length * 5);

test("four topics in two worlds plan with no topic code", () => {
  const cases = [["channels/goal-lore-lab/premium/pilots/GLL-P01/topic.json", "magnus-free-kick"], [gll("GLL-025"), "penalty-chip"],
    ["icerik/konular/gemini-8-1966.json", "attitude-torque"], ["icerik/konular/ariane-5-flight-501.json", "guidance-data-failure"]];
  for (const [f, tpl] of cases) { const p = run(path.resolve(ROOT, f)).plan; assert.equal(p.status, "PLANNED"); assert.equal(p.template, tpl);
    assert.equal(p.shots.length, linesOf(path.resolve(ROOT, f)).length, "one shot per narration line"); }
});

test("setup is read from the evidence: foot, kick style, keeper", () => {
  const p01 = run(path.join(ROOT, "channels/goal-lore-lab/premium/pilots/GLL-P01/topic.json")).data.setup;
  assert.equal(p01.foot, "L"); assert.equal(p01.style, "outside"); assert.equal(p01.keeper.action, "static");
  const pk = run(gll("GLL-025")); assert.equal(pk.data.setup.style, "chip"); assert.equal(pk.data.setup.keeper.dir, "left");
  assert.ok(pk.plan.assumptions.some((a) => /foot is not in the evidence/.test(a)), "an undecided foot is an assumption, not a fact");
  assert.ok(pk.plan.chips.includes("MOTION REPRESENTATIVE"));
});

test("refuses topics the kit does not cover", () => {
  assert.throws(() => run(gll("GLL-021")), (e) => e instanceof Refusal && /no mechanism template/.test(e.reasons[0]));
  assert.throws(() => run(gll("GLL-026")), (e) => e instanceof Refusal && /distance not in the evidence/.test(e.reasons[0]));
});

test("a number on screen must be in its cited fact, or the label must say MODEL", () => {
  const T = loadTopic(gll("GLL-025")); const shot = (labels) => [{ params: { labels } }];
  assert.deepEqual(checkEvidence(shot([{ title: "5–3 ON PENALTIES", src: "F2" }]), T), []);
  assert.match(checkEvidence(shot([{ title: "KEEPER DIVES 3 m", src: "F4" }]), T)[0], /3 is not in F4/);
  assert.match(checkEvidence(shot([{ title: "CHIP 13 m/s", small: "PEAK 2.2 m", src: "MODEL" }]), T)[0], /does not say MODEL/);
  assert.match(checkEvidence(shot([{ title: "CHIP 13 m/s" }]), T)[0], /has no source/);
  assert.match(checkEvidence(shot([{ title: "X", src: "F9" }]), T)[0], /unknown fact F9/);
});
