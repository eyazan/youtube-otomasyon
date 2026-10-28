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
  assert.deepEqual(kinds(sb.scenes[1]), ["sun"], "'Its surface is about 5,700 kelvin' is the Sun's surface");
  assert.ok(texts.includes("5,700 K"), texts.join(" | "));
  assert.ok(!sb.scenes[4].layers.some((l) => l.component === "planet" && l.props.kind === "moon"), "the Moon named after the number is a comparison, not the subject");
  assert.ok(!sb.scenes.some((s) => /-flow$/.test(s.id)), "'keeps the metal from melting' is not flowing rock");
  assert.ok(!sb.scenes[4].layers.some((l) => l.component === "depth-probe"), "the inner core's 1,230 km radius is not a depth under the surface");
  assert.ok(sb.scenes[4].layers.some((l) => l.component === "planet" && l.props.cutaway), "the radius is shown on the opened planet");
  assert.ok(!sb.scenes[5].layers.some((l) => l.component === "depth-probe"), "'shear waves were detected passing through it' is not a drill reaching the core");
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

test("IB readiness: researched records pass without stored quotes (warned); visual pre-check blocks are tolerated, others are not", () => {
  const { channel, topic } = Adapter.loadTopic("impossible-brief", "IB-PHY-065");
  const r = Adapter.readiness(channel, topic);
  assert.equal(r.ready, true);
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
