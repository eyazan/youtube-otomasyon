"use strict";
// BTO Premium Studio: motion maths, anchors, validator rules, adapter readiness, Skills metadata and isolation.
// Fast and offline: no Chromium, no TTS, no network.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const cp = require("node:child_process");

const ROOT = path.resolve(__dirname, "..", "..");
const STUDIO = path.join(ROOT, "scripts/bto-studio");
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");
const J = (f) => JSON.parse(read(f));

function motion() { const ctx = { window: {}, document: {}, Math, JSON, Object, Array, String, Number, Promise }; vm.createContext(ctx); vm.runInContext(read("scripts/bto-studio/page/motion.js"), ctx); return ctx.window.BTO; }

test("motion: closed-form spring starts at 0, settles at 1, overshoots only when underdamped, and is seekable", () => {
  const B = motion();
  assert.equal(B.spring(0), 0); assert.equal(B.spring(-1), 0);
  assert.ok(Math.abs(B.spring(3, { stiffness: 170, damping: 20 }) - 1) < 1e-3);
  const under = Array.from({ length: 200 }, (_, i) => B.spring(i / 100, { stiffness: 420, damping: 18 }));
  assert.ok(Math.max(...under) > 1.01, "underdamped spring overshoots");
  const over = Array.from({ length: 200 }, (_, i) => B.spring(i / 100, { stiffness: 100, damping: 40 }));
  assert.ok(Math.max(...over) <= 1 + 1e-9, "overdamped spring never overshoots");
  assert.equal(B.spring(0.37, { stiffness: 200, damping: 15 }), B.spring(0.37, { stiffness: 200, damping: 15 }));
});

test("motion: cubic-bezier matches CSS ease reference points and is monotone for standard curves", () => {
  const B = motion(); const ease = B.bezier(0.25, 0.1, 0.25, 1); // CSS "ease"
  assert.ok(Math.abs(ease(0.5) - 0.8024) < 2e-3, `ease(0.5)=${ease(0.5)}`);
  const lin = B.bezier(0, 0, 1, 1); for (const x of [0.1, 0.5, 0.9]) assert.ok(Math.abs(lin(x) - x) < 1e-4);
  const std = B.bezier(0.2, 0, 0, 1); let prev = 0; for (let i = 1; i <= 100; i += 1) { const v = std(i / 100); assert.ok(v >= prev - 1e-9); prev = v; }
  assert.equal(std(0), 0); assert.equal(std(1), 1);
});

test("anchors: lines, words, occurrences, hyphenated words, offsets and end", () => {
  const { resolver } = require(path.join(STUDIO, "validate"));
  const tl = { lines: [{ id: "L1", start: 0.1, end: 2 }, { id: "L2", start: 2.5, end: 4 }], words: [{ line: "L1", text: "QR", start: 0.4, end: 0.6 }, { line: "L1", text: "high-speed,", start: 1, end: 1.4 }, { line: "L1", text: "QR", start: 1.6, end: 1.8 }] };
  const at = resolver(tl, 5);
  assert.equal(at("L2"), 2.5); assert.equal(at("L2.end"), 4); assert.equal(at("L2-0.12"), 2.38);
  assert.equal(at("L1:QR"), 0.4); assert.equal(at("L1:QR#2"), 1.6); assert.ok(Math.abs(at("L1:QR#2.end+0.1") - 1.9) < 1e-9);
  assert.equal(at("L1:high-speed"), 1); assert.equal(at("end-0.5"), 4.5); assert.equal(at(3), 3);
  assert.throws(() => at("L1:missing"), /not in L1/);
});

// a small valid storyboard around a fake script/timeline
function fixture() {
  const script = { facts: [{ id: "F1", layer: "VERIFIED FACT", claim: "Released in 1994.", quote: "In 1994, the code was released" }, { id: "F2", layer: "VERIFIED FACT", claim: "Ratio", quote: "This ratio was 1:1:3:1:1" }] };
  const timeline = { duration: 9, lines: [{ id: "L1", start: 0, end: 2.8 }, { id: "L2", start: 3, end: 5.8 }, { id: "L3", start: 6, end: 8.8 }], words: [{ line: "L1", text: "Hello", start: 0, end: 0.4 }, { line: "L2", text: "ratio", start: 3, end: 3.4 }, { line: "L3", text: "end", start: 6, end: 6.4 }] };
  const style = J("channels/behind-the-ordinary/premium/style-pack.json");
  const scene = (id, line, start, extra = {}) => ({ id, lines: [line], start, visualPurpose: "Shows the mechanism the narration describes, which words alone cannot.", evidence: ["F1"], chips: ["illustrationLabel"], layers: [{ component: "desk-grain", props: {} }], ...extra });
  const sb = { schema: "bto-studio.storyboard.v1", channel: "behind-the-ordinary", topicId: "BTO-1", treatment: { educationalObjective: "The viewer understands exactly why the mechanism works the way it does.", visualHook: "Frame zero shows the object with its unexpected detail already highlighted.", mechanismsToAnimate: ["x"], factualRisks: [] },
    scenes: [scene("s1-a", "L1", 0), scene("s2-b", "L2", "L2-0.1", { transition: { type: "push", dur: 0.5 } }), scene("s3-c", "L3", "L3", { transition: { type: "iris", dur: 0.5 } })] };
  return { script, timeline, style, sb };
}

test("validator: a correct storyboard passes", () => {
  const { validateStoryboard } = require(path.join(STUDIO, "validate")); const f = fixture();
  const r = validateStoryboard(f.sb, f); assert.deepEqual(r.errors, []); assert.equal(r.ok, true);
});

test("validator: evidence, numbers, verbatim quotes, conceptual marking, coverage and transitions are enforced", () => {
  const { validateStoryboard } = require(path.join(STUDIO, "validate")); const f = fixture(); const v = (mut) => { const sb = JSON.parse(JSON.stringify(f.sb)); mut(sb); return validateStoryboard(sb, f).errors.join("\n"); };
  assert.match(v((sb) => { sb.scenes[0].evidence = ["F9"]; }), /unknown fact F9/);
  assert.match(v((sb) => { sb.scenes[0].layers.push({ component: "kinetic-type", props: { items: [{ at: 0, text: "Since 1987" }] } }); }), /on-screen number "1987"/);
  assert.equal(v((sb) => { sb.scenes[0].layers.push({ component: "kinetic-type", props: { items: [{ at: 0, text: "1994" }] } }); }), "");
  assert.match(v((sb) => { sb.scenes[1].evidence = ["F2"]; sb.scenes[1].layers.push({ component: "quote-card", props: { at: "L2", quoteOf: "F2", lines: ["This ratio is 1:1:3:1:1"] } }); }), /not verbatim/);
  assert.equal(v((sb) => { sb.scenes[1].evidence = ["F2"]; sb.scenes[1].layers.push({ component: "quote-card", props: { at: "L2", quoteOf: "F2", lines: ["…ratio was 1:1:3:1:1"] } }); }), "");
  assert.match(v((sb) => { sb.scenes[1].layers.push({ component: "print-surface", props: { kind: "form", x: 0, y: 0, w: 10, h: 10 } }); }), /conceptual depiction/);
  assert.equal(v((sb) => { sb.scenes[1].layers.push({ component: "print-surface", props: { context: true, kind: "box", x: 0, y: 0, w: 10, h: 10 } }); }), "");
  assert.match(v((sb) => { sb.scenes[2].transition.type = "push"; }), /repeats the push transition/);
  assert.match(v((sb) => { sb.scenes[2].lines = ["L2"]; }), /every line, in order/);
  assert.match(v((sb) => { sb.scenes[1].layers.push({ component: "spinning-logo" }); }), /unknown component/);
  assert.match(v((sb) => { sb.scenes[1].start = "L2:nope"; }), /anchor/);
  assert.match(v((sb) => { sb.scenes[1].camera = [{ at: "L9", x: 1 }]; }), /no line L9/);
});

test("adapter: BTO-301 is ready; published or unverified topics are refused; the narration is read, not changed", () => {
  const A = require(path.join(STUDIO, "adapter"));
  const before = fs.statSync(path.join(ROOT, "channels/behind-the-ordinary/topics/topic-universe.json")).mtimeMs;
  const { channel, topic } = A.loadTopic("behind-the-ordinary", "BTO-301"); const r = A.readiness(channel, topic);
  assert.equal(r.ready, true, r.errors.join("; "));
  const s = A.studioScript(channel, topic); assert.equal(s.lines.length, topic.narration.length); assert.deepEqual(s.lines.map((l) => l.text), topic.narration.map((l) => l.text.trim()));
  assert.ok(s.facts.every((f) => /^F\d+$/.test(f.id) && f.quote));
  assert.equal(A.readiness(channel, A.loadTopic("behind-the-ordinary", "BTO-016").topic).ready, false, "published topic refused");
  assert.match(A.readiness(channel, A.loadTopic("behind-the-ordinary", "BTO-040").topic).errors.join(" "), /not VERIFIED/);
  assert.equal(fs.statSync(path.join(ROOT, "channels/behind-the-ordinary/topics/topic-universe.json")).mtimeMs, before);
});

test("pilot storyboard BTO-301 validates against its measured narration", () => {
  const timelineFile = path.join(ROOT, "channels/behind-the-ordinary/premium/BTO-301/out/narration/timeline.json");
  if (!fs.existsSync(timelineFile)) return; // render outputs are not committed; the CLI run validates it then
  const A = require(path.join(STUDIO, "adapter")); const { validateStoryboard } = require(path.join(STUDIO, "validate"));
  const { channel, topic } = A.loadTopic("behind-the-ordinary", "BTO-301");
  const r = validateStoryboard(J("channels/behind-the-ordinary/premium/BTO-301/storyboard.json"), { script: A.studioScript(channel, topic), timeline: JSON.parse(fs.readFileSync(timelineFile, "utf8")), style: J("channels/behind-the-ordinary/premium/style-pack.json") });
  assert.deepEqual(r.errors, []);
});

test("narrator: years are spoken as people say them; syllable estimate is sane", () => {
  const N = require(path.join(STUDIO, "narrate"));
  assert.equal(N.spokenForm("in 1994, and 2007"), "in nineteen ninety-four, and two thousand seven");
  assert.equal(N.spokenForm("1900 and 1805"), "nineteen hundred and eighteen oh five");
  assert.equal(N.syllables("decoration."), 4); assert.equal(N.syllables("1994,"), 5);
});

test("storyboard auto-draft validates and never writes numbers its evidence lacks", () => {
  const A = require(path.join(STUDIO, "adapter")); const S = require(path.join(STUDIO, "storyboard")); const { validateStoryboard } = require(path.join(STUDIO, "validate"));
  const { channel, topic } = A.loadTopic("behind-the-ordinary", "BTO-301"); const script = A.studioScript(channel, topic); const style = J("channels/behind-the-ordinary/premium/style-pack.json");
  const timeline = { duration: 30, lines: script.lines.map((l, i) => ({ id: l.id, start: i * 4, end: i * 4 + 3.5 })), words: [] };
  const r = validateStoryboard(S.autoDraft(script, style), { script, timeline, style }); assert.deepEqual(r.errors, []);
});

test("skills: the seven studio Skills exist with valid frontmatter whose name matches the directory", () => {
  const names = ["visual-director", "motion-design", "technical-animation", "cinematic-composition", "audio-director", "video-quality-review", "premium-video-producer"];
  for (const n of names) {
    const f = `.claude/skills/${n}/SKILL.md`; const s = read(f); assert.ok(s.startsWith("---\n"), `${f}: frontmatter on line 1`);
    const fm = s.slice(4, s.indexOf("\n---", 4)); assert.match(fm, new RegExp(`^name: ${n}$`, "m"), f); const d = fm.match(/^description: (.+)$/m); assert.ok(d && d[1].length > 60 && d[1].length < 1536, `${f}: description`);
    for (const ref of [...s.matchAll(/`(scripts\/[\w./-]+\.(?:js|py|json))`/g)].map((m) => m[1])) assert.ok(fs.existsSync(path.join(ROOT, ref)), `${f} references missing ${ref}`);
  }
});

test("isolation: no workflow, root production script or channel config references the studio; BTO stays disabled", () => {
  const wf = path.join(ROOT, ".github/workflows");
  for (const f of fs.readdirSync(wf)) assert.doesNotMatch(fs.readFileSync(path.join(wf, f), "utf8"), /bto-studio|BTO_PREMIUM_RENDER|premium:video/, f);
  for (const f of fs.readdirSync(ROOT).filter((x) => x.endsWith(".js"))) assert.doesNotMatch(fs.readFileSync(path.join(ROOT, f), "utf8"), /scripts\/bto-studio/, f);
  for (const c of fs.readdirSync(path.join(ROOT, "channels"))) { const cfg = path.join(ROOT, "channels", c, "config.json"); if (fs.existsSync(cfg)) assert.doesNotMatch(fs.readFileSync(cfg, "utf8"), /bto-studio|BTO_PREMIUM/, c); }
  for (const f of fs.readdirSync(path.join(ROOT, "core"), { recursive: true }).filter((x) => String(x).endsWith(".js"))) assert.doesNotMatch(fs.readFileSync(path.join(ROOT, "core", f), "utf8"), /bto-studio/, f);
  assert.equal(J("config/channels.json").channels["behind-the-ordinary"].enabled, false);
  assert.equal(J("channels/behind-the-ordinary/config.json").voice.voice, "en-US-EmmaMultilingualNeural");
  for (const f of ["package.js", "studio.js"]) assert.doesNotMatch(fs.readFileSync(path.join(STUDIO, f), "utf8"), /youtube-yukle|uploadVideo|videos\.insert/, f);
});

test("feature flag: the studio refuses to run without BTO_PREMIUM_RENDER", () => {
  const env = { ...process.env }; delete env.BTO_PREMIUM_RENDER;
  const r = cp.spawnSync(process.execPath, [path.join(STUDIO, "studio.js"), "--channel", "behind-the-ordinary", "--topic", "BTO-301"], { encoding: "utf8", env });
  assert.equal(r.status, 2); assert.match(r.stderr, /opt-in/);
});

// ---- V2 / multi-channel additions --------------------------------------------------------------------------------
function page(files) { const ctx = { window: {}, document: { createElement: () => ({ getContext: () => ({ measureText: (s) => ({ width: String(s).length * 10 }) }) }) }, Math, JSON, Object, Array, String, Number, Promise, parseInt }; vm.createContext(ctx);
  for (const f of files) vm.runInContext(read(`scripts/bto-studio/page/${f}`), ctx); return ctx.window.BTO; }

test("projection: a flat, unrotated plane projects 1:1 and straight-down rotation preserves distances", () => {
  const B = page(["motion.js", "components/core.js", "components/projection.js"]);
  const P = B.projector({ cx: 540, cy: 800, rx: 0, rz: 0, D: 1700 }); assert.deepEqual(Array.from(P(100, -50, 0).slice(0, 2)), [640, 750]);
  const R = B.projector({ cx: 0, cy: 0, rx: 0, rz: 33, D: 1700 }); const a = R(30, 40, 0); assert.ok(Math.abs(Math.hypot(a[0], a[1]) - 50) < 1e-9);
  const T = B.projector({ cx: 0, cy: 0, rx: 40, rz: 0, D: 1700 }); assert.ok(T(0, -100, 0)[2] < 1 && T(0, 100, 0)[2] > 1, "tilt: far edge smaller, near edge larger");
});

test("row-signal: 1:1:3:1:1 is found exactly in the real QR's finder rows and nowhere else", () => {
  const B = page(["motion.js", "components/core.js", "components/projection.js"]);
  const A = J("channels/behind-the-ordinary/premium/BTO-301/assets/qr-hidden-logic.json");
  const rows = A.matrix.map((_, r) => B.finderSignatures(B.rowRuns(A, r)).length);
  for (const r of [2, 3, 4]) assert.equal(rows[r], 2, `row ${r} crosses two finders`);
  for (const r of [16, 17, 18]) assert.ok(rows[r] >= 1, `row ${r} crosses the bottom-left finder`);
  for (const r of [0, 1, 5, 6]) assert.equal(rows[r], 0, `row ${r} has no full signature`);
});

test("lifecycle: states advance one at a time and never past weak evidence, placeholder voice, failed QA or missing approval", () => {
  const LC = require(path.join(STUDIO, "lifecycle"));
  const ok = { by: "owner", at: "2026-10-20T10:00:00Z" };
  const topic = { researchStatus: "VERIFIED", productionReady: true, facts: [{ quote: "q", url: "https://x" }] };
  let v = { topic };
  assert.equal(LC.check(v, "SCRIPT_READY").ok, false, "cannot skip TOPIC_READY");
  assert.match(LC.check({ topic: { ...topic, facts: [{ url: "https://x" }] } }, "TOPIC_READY").reasons.join(), /evidence is weak/);
  v = LC.advance(v, "TOPIC_READY"); assert.equal(v.state, "TOPIC_READY");
  v = LC.advance({ ...v, script: { lines: ["a"], sourceHash: "h" } }, "SCRIPT_READY"); assert.equal(v.state, "SCRIPT_READY");
  assert.match(LC.check({ ...v, storyboard: { author: "autoDraft x" }, validation: { ok: true } }, "VISUAL_READY").reasons.join(), /auto-draft/);
  v = LC.advance({ ...v, storyboard: { author: "visual-director" }, validation: { ok: true } }, "VISUAL_READY");
  assert.match(LC.check({ ...v, render: { video: "x.mp4" }, narration: { speechOk: false } }, "RENDERED").reasons.join(), /placeholder/);
  v = LC.advance({ ...v, render: { video: "x.mp4" }, narration: { speechOk: true, approvedVoice: false } }, "RENDERED");
  assert.match(LC.check({ ...v, qa: { objectivePass: true }, creative: {} }, "QA_PASSED").reasons.join(), /creative/);
  v = LC.advance({ ...v, qa: { objectivePass: true }, creative: { signoff: ok } }, "QA_PASSED"); assert.equal(v.state, "QA_PASSED");
  const pub = LC.check({ ...v, factual: { signoff: ok }, publishApproval: ok, channel: { publishingEnabled: true } }, "PUBLISH_APPROVED");
  assert.match(pub.reasons.join(), /approved voice/, "a preview voice never reaches PUBLISH_APPROVED");
  assert.match(LC.check({ ...v, narration: { approvedVoice: true }, factual: { signoff: ok }, publishApproval: { by: "owner" }, channel: { publishingEnabled: true } }, "PUBLISH_APPROVED").reasons.join(), /publish approval/);
  assert.equal(LC.bufferDays([{ state: "SCHEDULED" }, { state: "PUBLISH_APPROVED" }, { state: "QA_PASSED" }]), 2);
});

test("profiles: only The Hidden Logic of Things renders in the studio; other channels refuse with their rollout stage", () => {
  for (const [c, renders] of [["behind-the-ordinary", true], ["failure-reconstructed", false], ["impossible-brief", false], ["goal-lore-lab", false]]) {
    const p = J(`scripts/bto-studio/profiles/${c}.json`); assert.equal(p.studioRenders, renders, c); assert.equal(p.channel, c);
    if (!renders) { const r = cp.spawnSync(process.execPath, [path.join(STUDIO, "studio.js"), "--channel", c, "--topic", "X"], { encoding: "utf8", env: { ...process.env, BTO_PREMIUM_RENDER: "preview" } }); assert.equal(r.status, 3, c); assert.match(r.stderr, /rollout stage/); }
  }
});

test("GoalLore Lab: proposed and inert (unregistered, disabled, no credentials, no state); inventory is honest", () => {
  const reg = J("config/channels.json").channels; assert.equal(reg["goal-lore-lab"], undefined, "not registered");
  assert.ok(reg["critical-thread"], "CriticalThread untouched");
  const cfg = J("channels/goal-lore-lab/config.json"); assert.equal(cfg.enabled, false); assert.equal(cfg.publishingEnabled, false); assert.equal(cfg.credentialsCreated, false);
  assert.equal(fs.existsSync(path.join(ROOT, "channels/goal-lore-lab/state")), false, "no state dir (workflow globs use channels/*/state)");
  for (const f of fs.readdirSync(path.join(ROOT, ".github/workflows"))) assert.doesNotMatch(read(`.github/workflows/${f}`), /goal-lore-lab|GoalLore/, f);
  const inv = J("channels/goal-lore-lab/topics/topic-candidates.json"); assert.ok(inv.topics.length >= 100);
  assert.ok(inv.topics.every((t) => t.status === "IDEA" && t.evidence.length === 0), "no topic is claimed researched/verified without evidence");
  assert.deepEqual(inv.statusCounts, { IDEA: inv.topics.length, RESEARCHED: 0, VERIFIED: 0, SCRIPT_READY: 0, PRODUCTION_READY: 0 });
  assert.ok(inv.topics.filter((t) => t.pillar === "WHAT_IF").every((t) => t.hypothetical));
  const { build } = require(path.join(ROOT, "scripts/goal-lore-lab/build-candidates.js")); assert.deepEqual(build().topics.map((t) => t.id), inv.topics.map((t) => t.id), "inventory file is reproducible");
});

test("V2 storyboard validates against the measured narration and uses no repeated transition", () => {
  const timelineFile = path.join(ROOT, "channels/behind-the-ordinary/premium/BTO-301/out/narration/timeline.json"); if (!fs.existsSync(timelineFile)) return;
  const A = require(path.join(STUDIO, "adapter")); const { validateStoryboard } = require(path.join(STUDIO, "validate")); const { channel, topic } = A.loadTopic("behind-the-ordinary", "BTO-301");
  const sb = J("channels/behind-the-ordinary/premium/BTO-301/storyboard.v2.json");
  const r = validateStoryboard(sb, { script: A.studioScript(channel, topic), timeline: JSON.parse(fs.readFileSync(timelineFile, "utf8")), style: J("channels/behind-the-ordinary/premium/style-pack.json") });
  assert.deepEqual(r.errors, []); assert.equal(new Set(sb.scenes.map((s) => s.env)).size >= 5, true, "at least 5 environments");
});
