"use strict";
// ImpossibleBrief premium integration: automatic storyboard (no model call), IB readiness standard, channel-aware
// publish gate, and the default-OFF premium shadow in the live pipeline.
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const Channel = require("../../core/channel-context");
const Adapter = require("../../scripts/bto-studio/adapter");
const Generator = require("../../scripts/bto-studio/auto/impossible-brief");
const Validator = require("../../scripts/bto-studio/validate");
const LC = require("../../scripts/bto-studio/lifecycle");
const Pipeline = require("../../core/pipeline/impossible-brief");

const style = require("../../channels/impossible-brief/premium/style-pack.json");
const profile = require("../../scripts/bto-studio/profiles/impossible-brief.json");
function fakeTimeline(script) {
  let t = 0; const words = [], lines = [];
  for (const l of script.lines) { const s = t; for (const w of l.text.split(/\s+/)) { words.push({ line: l.id, text: w, start: t, end: t + 0.3 }); t += 0.38; } lines.push({ id: l.id, start: s, end: t }); t += 0.25; }
  return { duration: t, words, lines };
}

test("auto storyboard: valid for topics across worlds, every number evidenced, layer chips, text-safe transitions", () => {
  const ids = ["IB-EXT-050", "IB-HUM-050", "IB-EXT-047", "IB-EAR-071", "IB-PHY-020", "IB-PHY-065"];
  const worlds = new Set();
  for (const id of ids) {
    const { channel, topic } = Adapter.loadTopic("impossible-brief", id);
    const script = Adapter.studioScript(channel, topic);
    const sb = Generator.build(script, style, topic);
    worlds.add(Generator.world(topic));
    const v = Validator.validateStoryboard(sb, { script, timeline: fakeTimeline(script), style, policy: profile.evidencePolicy.validator });
    assert.deepEqual(v.errors, [], id);
    const types = sb.scenes.slice(1).map((s) => s.transition.type);
    assert.ok(types.every((t) => ["scan-wipe", "iris", "dissolve"].includes(t)), `${id}: no push/match-zoom/whip (they drag text off the frame)`);
    assert.ok(types.filter((t) => t === "dissolve").length <= 1);
    for (const s of sb.scenes) {
      assert.ok(s.chips.length <= 2, `${id} ${s.id}: at most two chips`);
      assert.ok(s.chips.some((c) => ["factLabel", "estimateLabel", "speculativeLabel"].includes(c)), `${id} ${s.id}: evidence layer chip`);
      for (const l of s.layers) if (["planet", "orbit", "depth-probe", "scale-ladder"].includes(l.component)) assert.ok(!l.screen, `${id} ${s.id}: ${l.component} is a world layer (the camera must move it)`);
    }
    assert.equal(sb.scenes[0].start, 0);
  }
  assert.ok(worlds.size >= 3, "different topics get different visual worlds");
});

test("auto storyboard: earth-interior grammar varies its mechanism visuals and uses the cutaway once", () => {
  const { channel, topic } = Adapter.loadTopic("impossible-brief", "IB-EXT-050");
  const sb = Generator.build(Adapter.studioScript(channel, topic), style, topic);
  const kinds = sb.scenes.map((s) => s.id.replace(/^s\d+-/, ""));
  assert.deepEqual(kinds, ["hook", "zoom", "year", "measure", "heat", "flow", "cut", "payoff"]);
  assert.equal(kinds.filter((k) => k === "cut").length, 1);
  // a mechanism visual is drawn only when the line names it: magnetic-field lines never become "flowing strata"
  const ear = Adapter.loadTopic("impossible-brief", "IB-EAR-019");
  const earKinds = Generator.build(Adapter.studioScript(ear.channel, ear.topic), style, ear.topic).scenes.map((s) => s.id.replace(/^s\d+-/, ""));
  assert.ok(!earKinds.includes("flow"), earKinds.join(","));
  assert.equal(Generator.keyPhrase("So the planet's first defence against drilling is heat, not hardness."), "HEAT, NOT HARDNESS");
  assert.equal(Generator.keyPhrase("Rock that hot starts behaving more like plastic than stone."), "MORE LIKE PLASTIC THAN STONE");
  assert.equal(Generator.keyPhrase("Deeper down, the heat and pressure only climb.", 3), "", "never half of a joined subject (PRESSURE ONLY CLIMB)");
  assert.equal(Generator.keyPhrase("Deeper down, the heat and pressure only climb.", 5), "HEAT AND PRESSURE ONLY CLIMB");
});

test("auto storyboard: a line about another body draws that body; no flowing rock for a negated melt (IB-PHY-065 review render)", () => {
  const { channel, topic } = Adapter.loadTopic("impossible-brief", "IB-PHY-065");
  const sb = Generator.build(Adapter.studioScript(channel, topic), style, topic);
  const kinds = (s) => s.layers.filter((l) => l.component === "planet").map((l) => l.props.kind);
  const texts = sb.scenes.flatMap((s) => s.layers.filter((l) => l.component === "kinetic-type").flatMap((l) => l.props.items.map((it) => it.text)));
  assert.deepEqual(kinds(sb.scenes[0]), ["sun", "earth"], "hook comparing Earth's core with the Sun draws both");
  // owner-corrected L2: "Earth's inner core is estimated to reach about 5,700 kelvin — nearly as hot as the Sun's surface"
  assert.deepEqual(kinds(sb.scenes[1]), ["earth"]); assert.ok(sb.scenes[1].layers.some((l) => l.component === "planet" && l.props.cutaway), "the core's temperature is shown on the opened planet");
  assert.ok(!sb.scenes[1].layers.some((l) => l.props && l.props.kind === "sun"), "the Sun named after the number is a comparison");
  assert.ok(texts.includes("5,700 K"), texts.join(" | "));
  assert.ok(!sb.scenes[4].layers.some((l) => l.component === "planet" && l.props.kind === "moon"), "the Moon named after the number is a comparison, not the subject");
  assert.ok(!sb.scenes.some((s) => /-flow$/.test(s.id)), "'keeps the metal from melting' is not flowing rock");
  assert.ok(!sb.scenes[4].layers.some((l) => l.component === "depth-probe"), "the inner core's 1,230 km radius is not a depth under the surface");
  assert.ok(sb.scenes[4].layers.some((l) => l.component === "planet" && l.props.cutaway), "the radius is shown on the opened planet");
  assert.ok(!sb.scenes[5].layers.some((l) => l.component === "depth-probe"), "'seismic evidence of shear waves crossing Earth's inner core' is not a drill reaching the core");
  const s7 = sb.scenes[6].layers.find((l) => l.component === "kinetic-type").props.items[0];
  assert.equal(s7.outAt, "L7.end-0.25", "a top headline leaves before the payoff headline arrives");
  assert.ok(!texts.includes("METAL FROM MELTING"));
  assert.equal(Generator.keyPhrase("Crushing pressure keeps the metal from melting."), "");
  assert.equal(Generator.keyPhrase("Why Earth's core matches the Sun's surface heat."), "SUN'S SURFACE HEAT");
});

test("auto storyboard: the subject picks the visual, plates never repeat back to back, a ladder is shown once", () => {
  const expect = { "IB-EAR-019": "magnetic", "IB-EAR-071": "current", "IB-HUM-050": "micro", "IB-EAR-066": "lake", "IB-EXT-050": "earth-interior", "IB-OTH-004": "earth-surface" };
  for (const [id, w] of Object.entries(expect)) {
    const { channel, topic } = Adapter.loadTopic("impossible-brief", id);
    assert.equal(Generator.world(topic), w, id);
    const sb = Generator.build(Adapter.studioScript(channel, topic), style, topic);
    sb.scenes.forEach((s, k) => { if (k) assert.notEqual(s.env, sb.scenes[k - 1].env, `${id} ${s.id}: same plate as the previous scene`); });
    assert.equal(sb.scenes[0].env, sb.scenes[sb.scenes.length - 1].env, `${id}: payoff returns to the hook plate`);
    const ladders = sb.scenes.flatMap((s) => s.layers.filter((l) => l.component === "scale-ladder").map((l) => l.props.items.map((it) => it.value).sort((a, b) => a - b).join("|")));
    assert.equal(new Set(ladders).size, ladders.length, `${id}: a value set is laddered once`);
  }
  const ear = Adapter.loadTopic("impossible-brief", "IB-EAR-019"); const sb = Generator.build(Adapter.studioScript(ear.channel, ear.topic), style, ear.topic);
  const ticks = sb.scenes.flatMap((s) => s.layers.filter((l) => l.component === "event-ticks")); assert.equal(ticks.length, 1); assert.equal(ticks[0].props.count, 183);
  assert.ok(sb.scenes.some((s) => s.layers.some((l) => l.component === "magnetosphere" && l.props.wind)), "the charged-particle line brings the solar wind in");
  assert.ok(sb.scenes.some((s) => s.layers.some((l) => l.component === "magnetosphere" && l.props.strengthKeys && l.props.strengthKeys[1][1] <= 0.05)), "switching the field off collapses it");
  const venus = Adapter.loadTopic("impossible-brief", "IB-SPA-031"); const vs = Generator.build(Adapter.studioScript(venus.channel, venus.topic), style, venus.topic);
  assert.ok(vs.scenes[0].layers.some((l) => l.component === "planet" && l.props.kind === "venus"), "a topic about Venus shows Venus");
  assert.deepEqual(Generator.numbersIn("Its basins reach 900, 1,600 and 1,400 metres deep.").map((n) => n.unit), ["m", "m", "m"]);
});

test("units keep their meaning: an angle or a latitude is never a temperature (IB-EAR-001: 45 degrees latitude drawn as 45 °C)", () => {
  const n = (t) => Generator.numbersIn(t).map((x) => [x.raw, x.unit, x.quantity]);
  assert.deepEqual(n("At 45 degrees latitude, it's still about 1,184 kilometres per hour."), [["45", "°", "latitude"], ["1,184", "km/h", "speed"]]);
  assert.deepEqual(n("At 30° north the trade winds blow."), [["30", "°", "latitude"]]);
  assert.deepEqual(n("Its longitude is 120 degrees east."), [["120", "°", "longitude"]]);
  assert.deepEqual(n("The axis tilts 23.4 degrees."), [["23.4", "°", "angle"]]);
  assert.deepEqual(n("Water boils at 100 degrees Celsius."), [["100", "°C", "temperature"]]);
  assert.deepEqual(n("Peaks reach 120°F and 5,700 kelvin."), [["120", "°F", "temperature"], ["5,700", "K", "temperature"]]);
  assert.deepEqual(n("Between 4 to 10 °C."), [["4", "°C", "temperature"], ["10", "°C", "temperature"]]);
  assert.deepEqual(n("Gravity pulls down at 9.8 metres per second squared."), [["9.8", "m/s²", "acceleration"]]);
  assert.deepEqual(n("You keep moving at 465 metres per second, about 1,675 kilometres per hour."), [["465", "m/s", "speed"], ["1,675", "km/h", "speed"]]);
  assert.deepEqual(n("It is 900 metres deep."), [["900", "m", "length"]]);
  // the storyboard of the latitude line shows a latitude readout and no heat scene
  const ear = Adapter.loadTopic("impossible-brief", "IB-EAR-001"); const sb = Generator.build(Adapter.studioScript(ear.channel, ear.topic), style, ear.topic);
  const texts = sb.scenes.flatMap((s) => s.layers.filter((l) => l.component === "kinetic-type").flatMap((l) => l.props.items.map((it) => it.text)));
  assert.ok(!texts.some((t) => /°C/.test(t)), `no temperature on screen: ${texts.join(" | ")}`);
  assert.ok(texts.includes("45° LATITUDE"), texts.join(" | "));
  assert.ok(!sb.scenes.some((s) => /heat/.test(s.id)), "no heat scene for a latitude");
});

test("the declared visual mechanism decides the drawing: a planet's rotation is not an orbit (IB-EAR-001)", () => {
  const ear = Adapter.loadTopic("impossible-brief", "IB-EAR-001");
  assert.equal(ear.topic.visualMechanism, "planet-rotation");
  assert.equal(Generator.world({ ...ear.topic, visualMechanism: undefined }, { inferOnly: true }), "orbit", "the word match alone would have drawn an orbit");
  const sb = Generator.build(Adapter.studioScript(ear.channel, ear.topic), style, ear.topic);
  assert.deepEqual([sb.visualMechanism.id, sb.visualMechanism.world, sb.visualMechanism.declared, sb.visualMechanism.supported], ["planet-rotation", "rotation", true, true]);
  const comps = sb.scenes.flatMap((s) => s.layers.map((l) => l.component));
  assert.ok(!comps.includes("orbit"), "no orbit diagram");
  // the line that stops the Earth keys its spin to zero and the surface's eastward streak appears and stays
  const stop = sb.scenes.find((s) => s.lines.includes("L1")); const planet = stop.layers.find((l) => l.component === "planet");
  assert.equal(planet.props.spinKeys[planet.props.spinKeys.length - 1][1], 0);
  const drawn = sb.scenes.slice(1, -1).filter((s) => s.layers.some((l) => l.component === "planet"));
  assert.ok(drawn.length && drawn.every((s) => s.layers.some((l) => l.component === "flow-arrows")), "inertia streak on every globe after the stop");
  const script = Adapter.studioScript(ear.channel, ear.topic);
  assert.deepEqual(Validator.validateStoryboard(sb, { script, timeline: fakeTimeline(script), style, policy: profile.evidencePolicy.validator }).errors, []);
});

test("IB readiness: researched records pass without stored quotes (warned); visual pre-check blocks are tolerated, others are not", () => {
  // IB-PHY-065 was published on 2026-10-29 (5cNecwSkYDo), so an unpublished researched record with a visual pre-check block stands in
  const { channel, topic: undeclared } = Adapter.loadTopic("impossible-brief", "IB-OTH-020");
  // a record that declares no visual mechanism is a creative review item, never a word-matched guess
  assert.ok(Adapter.readiness(channel, undeclared).errors.some((e) => /^CREATIVE_REVIEW_REQUIRED: .*declares no visual mechanism/.test(e)));
  assert.ok(Adapter.readiness(channel, { ...undeclared, visualMechanism: "organism-microscope" }).errors.some((e) => /^CREATIVE_REVIEW_REQUIRED: .*not supported/.test(e)), "a declared mechanism with no drawing is refused");
  const topic = { ...undeclared, visualMechanism: "earth-surface" };
  // no claim-source ledger: no fact has a verified passage, so the record is held
  assert.ok(Adapter.readiness(channel, topic).errors.some((e) => /^SOURCE_UNVERIFIED: no claim-source ledger/.test(e)));
  // with a ledger of VERIFIED records for exactly these facts it is ready, and the description lists only those pages
  const CS = require("../../core/research/claim-sources"); const lf = CS.file(channel, topic.id); const fsm = require("fs");
  const records = topic.facts.map((f, i) => ({ fact: `F${i + 1}`, claim: f.claim, url: f.url, sourceTitle: "Wikipedia — Test", passage: f.claim, status: "VERIFIED" }));
  fsm.mkdirSync(path.dirname(lf), { recursive: true }); fsm.writeFileSync(lf, JSON.stringify({ topicId: topic.id, factsHash: CS.factsHash(topic), records }));
  let r;
  try {
    r = Adapter.readiness(channel, topic);
    assert.ok(r.warnings.some((w) => /topic-level sources are generic pages/.test(w)), "the generator's agency front pages are named and never listed");
    const meta = require("../../core/pipeline/premium-publish").metadata(channel, topic);
    assert.doesNotMatch(meta.description, /nih\.gov\/research-training|nist\.gov\/topics\/physics|science\.nasa\.gov\/\n/);
    assert.ok(records.every((x) => meta.description.includes(x.url)));
    fsm.writeFileSync(lf, JSON.stringify({ topicId: topic.id, factsHash: CS.factsHash(topic), records: records.map((x, i) => (i ? x : { ...x, status: "UNVERIFIED", reason: "no supporting passage" })) }));
    assert.ok(Adapter.readiness(channel, topic).errors.some((e) => /^SOURCE_UNVERIFIED: F1/.test(e)), "one unverified fact holds the topic");
  } finally { fsm.rmSync(lf, { force: true }); }
  assert.equal(r.ready, true, r.errors.join("; "));
  // a content hold (claim check 2026-10-28: unsourced narration lines) keeps a topic out of production
  const held = Adapter.loadTopic("impossible-brief", "IB-EXT-050");
  assert.ok(Adapter.readiness(held.channel, held.topic).errors.some((e) => /claim check/.test(e)), "IB-EXT-050 is held until its narration is corrected");
  for (const id of ["IB-EXT-047", "IB-HUM-004"]) { const h = Adapter.loadTopic("impossible-brief", id); assert.ok(Adapter.readiness(h.channel, h.topic).errors.some((e) => /review render/.test(e)), `${id} is held by its review render`); }
  assert.ok(r.warnings.some((w) => /no stored verbatim quote/.test(w)));
  assert.ok(r.warnings.some((w) => /stock-picture renderer/.test(w)));
  const published = Adapter.loadTopic("impossible-brief", "what-if-mosquitoes-went-extinct");
  assert.equal(Adapter.readiness(published.channel, published.topic).ready, false, "a published topic never reaches the studio");
  const bto = Adapter.loadTopic("behind-the-ordinary", "BTO-301");
  assert.ok(Adapter.readiness(bto.channel, { ...bto.topic, facts: [{ claim: "x", url: "https://e.org", layer: "VERIFIED FACT" }] }).errors.some((e) => /verbatim quote/.test(e)), "BTO keeps its quote rule");
});

test("lifecycle: TOPIC_READY uses the channel readiness when given, the BTO rule otherwise", () => {
  const topic = { facts: [{ claim: "c", url: "https://x" }] };
  assert.ok(LC.check({ topic }, "TOPIC_READY").reasons.length > 0, "default rule needs VERIFIED + quotes");
  assert.equal(LC.check({ topic, topicReadiness: { errors: [] } }, "TOPIC_READY").ok, true);
  assert.equal(LC.check({ topic, topicReadiness: { errors: [] }, alreadyPublished: true }, "TOPIC_READY").ok, false);
});

test("premium shadow is OFF by default, IB-only, and never changes the live result", () => {
  const ib = Channel.getChannel("impossible-brief");
  let calls = 0; const spawn = (bin, args, opts) => { calls += 1; spawn.last = { args, opts }; return { status: 0, stdout: "", stderr: "" }; };
  assert.equal(Pipeline.premiumShadow(ib, { id: "IB-EXT-050", slug: "x" }, {}, spawn), null);
  assert.equal(Pipeline.premiumShadow(ib, { id: "IB-EXT-050", slug: "x" }, { IB_PREMIUM_RENDER: "final" }, spawn), null, "only preview is accepted");
  assert.equal(Pipeline.premiumShadow(Channel.getChannel("critical-thread"), { id: "CT-1", slug: "x" }, { IB_PREMIUM_RENDER: "preview" }, spawn), null);
  assert.equal(calls, 0);
  const r = Pipeline.premiumShadow(ib, { id: "IB-EXT-050", slug: "x" }, { IB_PREMIUM_RENDER: "preview" }, spawn);
  assert.equal(calls, 1); assert.equal(r.status, 0);
  assert.ok(spawn.last.args.some((a) => a.endsWith(path.join("scripts", "bto-studio", "studio.js"))));
  assert.equal(spawn.last.opts.env.BTO_PREMIUM_RENDER, "preview");
  assert.equal(Pipeline.premiumShadow(ib, { id: "IB-EXT-050", slug: "x" }, { IB_PREMIUM_RENDER: "preview" }, () => { throw new Error("boom"); }), null, "a crash is logged, not thrown");
  const workflow = require("fs").readFileSync(path.join(__dirname, "../../.github/workflows/portfolio-production.yml"), "utf8");
  assert.ok(!/IB_PREMIUM_RENDER/.test(workflow), "the live workflow does not enable the shadow");
});

test("premium shadow runs after the live lane, renders the produced topic, and writes a side-by-side report", () => {
  const src = require("fs").readFileSync(path.join(__dirname, "../../core/pipeline/impossible-brief.js"), "utf8");
  const run = src.slice(src.indexOf("async function run") >= 0 ? src.indexOf("async function run") : src.indexOf("function run"));
  const call = run.indexOf("premiumShadow(channel, topic, process.env");
  assert.ok(call > run.indexOf("recordGenerated(channel, topic, process.env.PUBLISH"), "after upload and recordGenerated, never before the live render");
  assert.equal(run.split("premiumShadow(").length - 1, 1, "called once per run");
  const ib = Channel.getChannel("impossible-brief");
  const fs = require("fs"); const out = fs.mkdtempSync(path.join(require("os").tmpdir(), "ibshadow-"));
  const spawn = (bin, args) => { spawn.args = args; return { status: 0, stdout: "", stderr: bin === "/usr/bin/time" ? "IB_SHADOW_MAXRSS_KB=2048000\n" : "" }; };
  const r = Pipeline.premiumShadow(ib, { id: "IB-EAR-019", slug: "x" }, { IB_PREMIUM_RENDER: "preview" }, spawn, { output: out, decision: "PUBLISH", score: 88, durationSeconds: 41.2, upload: "skipped (PUBLISH!=1)" });
  assert.ok(spawn.args.includes("--shadow"));
  const report = JSON.parse(fs.readFileSync(path.join(out, "premium-shadow.json"), "utf8"));
  assert.equal(report.live.decision, "PUBLISH"); assert.equal(report.live.productionScore, 88);
  assert.equal(report.premium.uploaded, false); assert.equal(report.premium.runtimeSec, r.sec);
  if (fs.existsSync("/usr/bin/time")) assert.equal(report.premium.peakMemoryMB, 2000);
  // --shadow tolerates only "the live lane produced this topic"; any other readiness error still refuses
  assert.equal(Adapter.shadowTolerated(["already generated by the live pipeline", "already published (x5VVXKhOhMQ)"]), true);
  assert.equal(Adapter.shadowTolerated(["already generated by the live pipeline", "fact 2 has no source URL"]), false);
  assert.equal(Adapter.shadowTolerated([]), false);
  const studio = require("child_process").spawnSync(process.execPath, [path.join(__dirname, "../../scripts/bto-studio/studio.js"), "--channel", "impossible-brief", "--topic", "IB-EAR-019", "--shadow"], { env: { ...process.env, BTO_PREMIUM_RENDER: "final" }, encoding: "utf8" });
  assert.notEqual(studio.status, 0); assert.match(studio.stderr + studio.stdout, /--shadow is allowed only with BTO_PREMIUM_RENDER=preview/);
  const pkg = require("../../scripts/bto-studio/package");
  assert.ok(/shadow \? "SHADOW_OF_LIVE_NOT_PUBLISHABLE"/.test(fs.readFileSync(require.resolve("../../scripts/bto-studio/package"), "utf8")) && typeof pkg.build === "function");
});

test("no tracked file under channels/impossible-brief/premium/<id>/: a shadow run in production can never be committed", () => {
  const tracked = require("child_process").execSync("git ls-files channels/impossible-brief/premium", { cwd: path.join(__dirname, "../.."), encoding: "utf8" }).trim().split("\n");
  assert.deepEqual(tracked.filter((f) => /premium\/[^/]+\//.test(f)), [], "evidence lives in docs/premium-studio/evidence/impossible-brief/");
  const probe = "channels/impossible-brief/premium/IB-NEW-001/out/review-package.json";
  assert.equal(require("child_process").spawnSync("git", ["check-ignore", "-q", probe], { cwd: path.join(__dirname, "../..") }).status, 0, "new shadow output is ignored");
});
