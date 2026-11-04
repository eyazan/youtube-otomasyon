"use strict";
// Regression tests for the creative defects found in the 2026-11-03 review renders (frames reviewed, not just QA):
//   FR El Faro: one wireframe ship x4 + chain cards -> each line shows its maritime mechanism
//   BTO-156: paper cards and quote slides -> the aperture-vs-wavelength mechanism is drawn
//   GLL-021: "past five players" not countable; hook ~ payoff -> beaten-defender tally; payoff from the replay camera
//   IB-EAR-019: no satellite/grid; payoff restored the field -> tech-hits; the technology payoff keeps the field off
// plus the IB mechanism board's proposer (STRONG only when the drawing shows what the title names).
const test = require("node:test");
const assert = require("node:assert/strict");
const Adapter = require("../../scripts/bto-studio/adapter");
const Validator = require("../../scripts/bto-studio/validate");

function fakeTimeline(script) {
  const words = [], lines = []; let t = 0.2;
  for (const l of script.lines) { const s = t; for (const w of l.text.split(/\s+/)) { words.push({ line: l.id, text: w, start: t, end: t + 0.3 }); t += 0.38; } lines.push({ id: l.id, start: s, end: t }); t += 0.25; }
  return { words, lines, duration: t + 0.6 };
}
function storyboard(channelSlug, ref) {
  const { channel, topic } = Adapter.loadTopic(channelSlug, ref); const script = Adapter.studioScript(channel, topic);
  const style = require(`../../channels/${channelSlug}/premium/style-pack.json`); const profile = require(`../../scripts/bto-studio/profiles/${channelSlug}.json`);
  const gen = require(`../../scripts/bto-studio/auto/${channelSlug}.js`); const sb = gen.build(script, style, topic, { assets: {} });
  const policy = (profile.evidencePolicy || {}).validator; const v = Validator.validateStoryboard(sb, { script, timeline: fakeTimeline(script), style, ...(policy ? { policy } : {}) });
  return { sb, v, comps: sb.scenes.map((s) => s.layers.map((l) => l.component)) };
}

test("FR El Faro: storm, stale forecast, flooding, propulsion and sinking are drawn; no chain-card scene; valid", () => {
  const { sb, v, comps } = storyboard("failure-reconstructed", "el-faro-2015");
  assert.equal(v.ok, true, v.errors.join("\n"));
  const all = comps.flat();
  for (const c of ["heavy-seas", "storm-track", "hull-section", "propulsion"]) assert.ok(all.includes(c), `missing ${c}`);
  assert.ok(!all.includes("failure-chain"), "chain cards replaced by mechanisms");
  assert.ok(sb.scenes.some((s) => s.layers.some((l) => l.component === "storm-track" && l.props.stale)), "the stale-forecast line shows the old storm position");
  assert.ok(sb.scenes.every((s) => s.chips.includes("conceptualLabel")), "reconstruction chip on every drawn scene");
});

test("FR maritime kit only applies to ship cases; non-ship cases keep the forensic grammar", () => {
  const { comps, v } = storyboard("failure-reconstructed", "air-france-447-2009");
  assert.equal(v.ok, true); assert.ok(!comps.flat().some((c) => ["heavy-seas", "storm-track", "hull-section", "propulsion"].includes(c)));
});

test("BTO-156: the mechanism is drawn (loupe on the mesh, cage, wave vs hole, light passes), no quote slides; valid", () => {
  const { sb, v, comps } = storyboard("behind-the-ordinary", "BTO-156");
  assert.equal(v.ok, true, v.errors.join("\n"));
  const all = comps.flat();
  for (const c of ["oven-door", "faraday-box", "wave-aperture"]) assert.ok(all.includes(c), `missing ${c}`);
  assert.ok(!all.includes("quote-card"), "no quote slides when the mechanism is drawable");
  const ap = sb.scenes.flatMap((s) => s.layers).filter((l) => l.component === "wave-aperture");
  assert.ok(ap.some((l) => l.props.lightAt != null), "visible light passes in one scene");
  assert.ok(ap.some((l) => /12\.2 CM/.test(JSON.stringify(l.props.labels || {}))), "the cited wavelength is on screen");
});

test("GLL-021: the solo run strikes off five defenders; the payoff differs from the hook (replay camera)", () => {
  const { sb, v } = storyboard("goal-lore-lab", "GLL-021");
  assert.equal(v.ok, true, v.errors.join("\n"));
  const tally = sb.scenes.flatMap((s) => s.layers).filter((l) => l.component === "tally-tokens");
  assert.ok(tally.length >= 1 && tally.every((l) => l.props.beatKeys.length === 5));
  const pitchOf = (s) => s.layers.find((l) => l.component !== "stadium" && l.props && l.props.pxPerMetre != null);
  const hook = pitchOf(sb.scenes[0]), payoff = pitchOf(sb.scenes[sb.scenes.length - 1]);
  if (hook && payoff) assert.notDeepEqual([hook.props.rx, hook.props.pxPerMetre], [payoff.props.rx, payoff.props.pxPerMetre]);
  assert.ok(!sb.scenes[sb.scenes.length - 1].layers.some((l) => l.component === "tally-tokens"));
});

test("IB-EAR-019: satellites and power grids are drawn on their line; the technology payoff keeps the field off", () => {
  const { sb, v } = storyboard("impossible-brief", "IB-EAR-019");
  assert.equal(v.ok, true, v.errors.join("\n"));
  const tech = sb.scenes.filter((s) => s.layers.some((l) => l.component === "tech-hits"));
  assert.ok(tech.length >= 2, "particle line and payoff");
  const payoff = sb.scenes[sb.scenes.length - 1];
  const ms = payoff.layers.find((l) => l.component === "magnetosphere");
  assert.ok(ms && ms.props.strengthKeys && ms.props.strengthKeys.every(([, k]) => k < 0.5), "payoff field stays off");
});

test("IB mechanism board: proposals only where the drawing shows what the title names", () => {
  const { propose } = require("../../scripts/ib-research/mechanism-board");
  assert.equal(propose({ id: "a", title: "What If Another Tambora Erupted Today?" }).mechanism, "volcano-eruption");
  assert.equal(propose({ id: "b", title: "What If the 1859 Solar Superstorm Hit Today?" }).mechanism, "magnetic-field");
  assert.equal(propose({ id: "c", title: "What If GPS Went Dark for a Day?" }).confidence, "NO_DRAWING");
  assert.equal(propose({ id: "d", title: "What If You Melted a Diamond?" }).confidence, "NO_DRAWING");
});

test("studio: --propose-mechanism is preview + shadow + stills only and never touches the record", () => {
  const src = require("fs").readFileSync(require.resolve("../../scripts/bto-studio/studio.js"), "utf8");
  assert.match(src, /--propose-mechanism needs BTO_PREMIUM_RENDER=preview, --shadow and --stills/);
  assert.doesNotMatch(require("fs").readFileSync(require.resolve("../../scripts/ib-research/mechanism-board.js"), "utf8"), /writeFileSync\([^)]*topic-universe/);
});

test("owner review sheet: only rows a person set to APPROVE are declared, a HOLD row never is, and the shipped sheet decides nothing", () => {
  const { fromSheet } = require("../../scripts/ib-research/declare-mechanism.js");
  const r = fromSheet({ topics: [
    { id: "A", mechanism: "named-body", decision: "APPROVE" },
    { id: "B", mechanism: "named-body", decision: "REJECT" },
    { id: "C", mechanism: "named-body", decision: null },
    { id: "D", mechanism: "named-body", decision: "approve", hold: "FACT ERROR: x" }] });
  assert.deepEqual(r.approved.map((x) => x.id), ["A"]);
  assert.deepEqual(r.held.map((x) => x.id), ["D"]);
  const shipped = require("../../reports/ib-mechanism-board/decisions.json");
  assert.ok(shipped.topics.length > 0 && shipped.topics.every((x) => x.decision === null), "the sheet ships with no decision");
  const IB = require("../../scripts/bto-studio/auto/impossible-brief.js");
  for (const t of shipped.topics) assert.ok(IB.MECHANISMS[t.mechanism] && IB.MECHANISMS[t.mechanism].world, `${t.id}: ${t.mechanism} has a drawing`);
});

test("a named body drawn beside Earth is to scale (mean radius ratio), and no side-by-side beyond 15x", () => {
  const Channel = require("../../core/channel-context"); const IB = require("../../scripts/bto-studio/auto/impossible-brief.js");
  const ch = Channel.getChannel("impossible-brief"); const style = require("../../channels/impossible-brief/premium/style-pack.json");
  const u = require("../../channels/impossible-brief/topics/topic-universe.json");
  const ratio = (id) => { const t = { ...u.topics.find((x) => x.id === id), visualMechanism: "named-body" };
    const sb = IB.build(Adapter.studioScript(ch, t), style, t);
    const pair = sb.scenes.map((s) => (s.layers || []).filter((l) => l.component === "planet")).find((p) => p.length === 2);
    return pair ? pair[0].props.r / pair[1].props.r : null; };
  assert.ok(Math.abs(ratio("IB-SPA-036") - 10.97) < 0.05, "Jupiter about 11 Earths wide");
  assert.ok(Math.abs(ratio("IB-SPA-076") - 0.383) < 0.01, "Mercury 0.38 Earth");
  assert.ok(Math.abs(ratio("IB-SPA-021") - 0.532) < 0.01, "Mars 0.53 Earth");
});

test("FR creative fidelity: never a crack for a case that did not crack; gas and tornado drawn as themselves", () => {
  const FR = require("../../scripts/bto-studio/auto/failure-reconstructed.js");
  const ch = require("../../core/channel-context").getChannel("failure-reconstructed");
  const fid = (id) => { const t = Adapter.loadTopic("failure-reconstructed", id).topic; return FR.drawingFidelity(t, Adapter.studioScript(ch, t).lines); };
  for (const id of ["FR-mars-96-1996", "FR-texas-power-crisis-2021", "FR-grenfell-tower-2017", "FR-twa-800-1996", "FR-millennium-bridge-wobble-2000"]) assert.equal(fid(id).ok, false, id);
  for (const id of ["FR-lake-nyos-1986", "FR-moore-tornado-2013", "FR-el-faro-2015", "FR-costa-concordia-2012", "FR-tay-bridge-1879"]) assert.equal(fid(id).ok, true, id);
  const t = Adapter.loadTopic("failure-reconstructed", "FR-lake-nyos-1986").topic; const k = FR.objectKind(t, Adapter.studioScript(ch, t).lines);
  assert.equal(FR.structureMechanism(t, k), "gas");
});

test("FR maritime: no storm for a calm-night grounding (negated in the misconception); passenger and bulk hulls carry no containers", () => {
  const FR = require("../../scripts/bto-studio/auto/failure-reconstructed.js");
  const ch = require("../../core/channel-context").getChannel("failure-reconstructed"); const style = require("../../channels/failure-reconstructed/premium/style-pack.json");
  const sb = (id) => { const t = Adapter.loadTopic("failure-reconstructed", id).topic; return FR.build(Adapter.studioScript(ch, t), style, t); };
  const layers = (b) => b.scenes.flatMap((s) => s.layers);
  const cc = layers(sb("FR-costa-concordia-2012"));
  assert.ok(!cc.some((l) => l.component === "storm-track" || (l.component === "heavy-seas" && l.props.storm)), "Costa Concordia: no storm");
  assert.ok(cc.filter((l) => l.component === "heavy-seas").every((l) => l.props.profile === "passenger"));
  assert.ok(layers(sb("FR-edmund-fitzgerald-1975")).filter((l) => l.component === "heavy-seas").every((l) => l.props.profile === "bulk"));
  assert.ok(layers(sb("FR-el-faro-2015")).some((l) => l.component === "heavy-seas" && l.props.storm), "El Faro keeps its hurricane");
});

test("FR Costa Concordia: grounding on a rock, a listing ship for the evacuation, no crack, chain cards enter with a wipe", () => {
  const FR = require("../../scripts/bto-studio/auto/failure-reconstructed.js");
  const ch = require("../../core/channel-context").getChannel("failure-reconstructed"); const style = require("../../channels/failure-reconstructed/premium/style-pack.json");
  const t = Adapter.loadTopic("failure-reconstructed", "FR-costa-concordia-2012").topic; const sb = FR.build(Adapter.studioScript(ch, t), style, t);
  const ls = sb.scenes.flatMap((s) => s.layers);
  assert.ok(ls.some((l) => l.component === "heavy-seas" && l.props.rockAt), "the rock is drawn");
  assert.ok(ls.some((l) => l.component === "hull-section" && l.props.listLabel === "LIST"), "the list is drawn bow-on");
  assert.ok(!ls.some((l) => l.component === "heavy-seas" && (l.props.heel || l.props.sunk)), "no side-view tilt, and she did not go under");
  assert.ok(ls.filter((l) => l.component === "object-silhouette").every((l) => l.props.failAt == null), "no crack on a ship that did not break");
  sb.scenes.filter((s) => s.id.endsWith("-chain") && s.transition && s.transition.type !== "continuity").forEach((s) => assert.equal(s.transition.type, "scan-wipe"));
});

test("FR: a contested explanation is never drawn as fact (Edmund Fitzgerald: 'others argued it struck a shoal')", () => {
  const FR = require("../../scripts/bto-studio/auto/failure-reconstructed.js");
  const ch = require("../../core/channel-context").getChannel("failure-reconstructed"); const style = require("../../channels/failure-reconstructed/premium/style-pack.json");
  const t = Adapter.loadTopic("failure-reconstructed", "FR-edmund-fitzgerald-1975").topic; const sb = FR.build(Adapter.studioScript(ch, t), style, t);
  assert.ok(!sb.scenes.flatMap((s) => s.layers).some((l) => l.component === "heavy-seas" && l.props.rockAt));
});
