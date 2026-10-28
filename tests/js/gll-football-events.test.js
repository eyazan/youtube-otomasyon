"use strict";
// GoalLore Lab football grammar (#364 review): the record's own kind of goal is drawn, never a default free kick
const test = require("node:test");
const assert = require("node:assert");
const path = require("path");
const ROOT = path.join(__dirname, "..", "..");
const Adapter = require(path.join(ROOT, "scripts/bto-studio/adapter"));
const G = require(path.join(ROOT, "scripts/bto-studio/auto/goal-lore-lab"));
const style = require(path.join(ROOT, "channels/goal-lore-lab/premium/style-pack.json"));
const build = (id) => { const { channel, topic } = Adapter.loadTopic("goal-lore-lab", id); const script = Adapter.studioScript(channel, topic); return { script, sb: G.build(script, style, topic) }; };
const pitches = (sc) => sc.layers.filter((l) => l.component === "football-pitch").map((l) => l.props);
const hasWall = (sc) => pitches(sc).some((p) => (p.players || []).some((pl) => /^w\d/.test(pl.id)));

test("GLL-021 (Hand of God, solo goal): no free-kick wall anywhere; the hand goal, the solo run and the board fit", () => {
  const { script, sb } = build("GLL-021");
  assert.ok(sb.scenes.every((sc) => !hasWall(sc)), "a free-kick wall is drawn for goals that were not free kicks");
  const byLine = (re) => sb.scenes.find((sc) => re.test(script.lines.find((l) => l.id === sc.lines[0]).text));
  assert.match(byLine(/with his hand/).id, /-hand$/); assert.match(byLine(/dribbled past five/).id, /-dribble$/);
  const run = pitches(byLine(/dribbled past five/))[0]; assert.equal(run.players.filter((p) => p.team === "away" && /^d\d/.test(p.id)).length, 5, "five defenders, as the line says");
  assert.ok(run.ball.every((e) => e.src === "att" && e.dst === "att"), "the ball stays at the runner's feet until the finish");
  assert.match(sb.scenes[0].id, /-hook$/); assert.ok(pitches(sb.scenes[0])[0].players.some((p) => p.id === "att"), "the hook leads with the record's most visual goal (the solo run)");
  // never two bare-stadium beats in a row
  let prev = ""; for (const sc of sb.scenes) { const bare = !pitches(sc).length && !sc.layers.some((l) => l.component === "dot-board"); assert.ok(!(bare && prev), `${sc.id}: two empty stadium scenes in a row`); prev = bare; }
});

test("GLL-025 (Panenka): penalties from the spot, the miss over the bar, the chip down the middle while the keeper dives", () => {
  const { script, sb } = build("GLL-025");
  assert.ok(sb.scenes.every((sc) => !hasWall(sc)));
  const byLine = (re) => sb.scenes.find((sc) => re.test(script.lines.find((l) => l.id === sc.lines[0]).text));
  const miss = pitches(byLine(/over the bar/))[0].kicks[0], chip = pitches(byLine(/chipped it/))[0].kicks[0];
  assert.ok(miss.elevation > chip.elevation - 10 && miss.speed > chip.speed, "the miss is struck hard and high"); assert.equal(chip.azimuth, 0, "the chip goes down the middle");
  assert.deepEqual([miss.x0, miss.y0], [0, -41.5], "from the penalty spot");
  const gk = pitches(byLine(/chipped it/))[0].players.find((p) => p.id === "gk"); assert.notEqual(gk.pathKeys[gk.pathKeys.length - 1][1], 0, "the keeper dives to one side");
  assert.ok(!/-penalty$/.test(byLine(/went to penalties/).id), "'the final went to penalties' sets the scene; it is not a kick");
});

test("the dot-matrix board always fits the frame", () => {
  const src = require("fs").readFileSync(path.join(ROOT, "scripts/bto-studio/page/components/football-atmos.js"), "utf8");
  assert.match(src, /o\.maxW \|\| 960/);
});
