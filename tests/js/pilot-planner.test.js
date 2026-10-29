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
  // a penalty without the keeper's action is refused (the keeper is the mechanism); a free kick records it as an assumption
  const t = JSON.parse(JSON.stringify(universe.find((x) => x.id === "GLL-025"))); const f4 = t.facts.find((f) => f.id === "F4");
  f4.claim = "Panenka gently chipped the ball into the middle of the net."; f4.quote = f4.claim; t.narration = t.narration.map((l) => ({ ...l, text: l.text.replace(", and the goalkeeper dived", "") }));
  const nk = path.join(tmp, "no-keeper.json"); fs.writeFileSync(nk, JSON.stringify(t));
  assert.throws(() => run(nk), (e) => e instanceof Refusal && /keeper behaviour not in the evidence/.test(e.reasons.join(";")));
  // the same real kick without foot and surface in its evidence is refused: its curl direction would be invented
  assert.throws(() => run(gll("GLL-026")), (e) => e instanceof Refusal && /curl direction of a real kick would be invented/.test(e.reasons.join(";")));
});

test("a number on screen must be in its cited fact, or the label must say MODEL", () => {
  const T = loadTopic(gll("GLL-025")); const shot = (labels) => [{ params: { labels } }];
  assert.deepEqual(checkEvidence(shot([{ title: "5–3 ON PENALTIES", src: "F2" }]), T), []);
  assert.match(checkEvidence(shot([{ title: "KEEPER DIVES 3 m", src: "F4" }]), T)[0], /3 is not in F4/);
  assert.match(checkEvidence(shot([{ title: "CHIP 13 m/s", small: "PEAK 2.2 m", src: "MODEL" }]), T)[0], /does not say MODEL/);
  assert.match(checkEvidence(shot([{ title: "CHIP 13 m/s" }]), T)[0], /has no source/);
  assert.match(checkEvidence(shot([{ title: "X", src: "F9" }]), T)[0], /unknown fact F9/);
});

test("coverage over the researched GLL topics: planned where the evidence carries the mechanism, refused otherwise", () => {
  const { rows } = require("../../pilots/kit/coverage");
  const planned = rows.filter((r) => r.status === "PLANNED").map((r) => r.id).sort();
  assert.deepEqual(planned, ["GLL-025", "GLL-043", "GLL-052", "GLL-061"]);
  // dribbles, team moves, headers and saves need positions or directions the evidence does not give; GLL-026 lacks the
  // foot and surface of a real curling kick
  for (const id of ["GLL-021", "GLL-026", "GLL-028", "GLL-031", "GLL-037"]) assert.equal(rows.find((r) => r.id === id).status, "CREATIVE_REVIEW_REQUIRED", id);
});
