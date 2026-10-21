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

test("signatures: a corner square's centre line reads 1:1:3:1:1; logos, cells and checkboxes do not", () => {
  const B = page(["motion.js", "components/core.js", "components/signatures.js"]);
  const tpl = B.ringRuns([{ size: 7, dark: true }, { size: 5, dark: false }, { size: 3, dark: true }]);
  assert.deepEqual(Array.from(tpl, (r) => [r.dark, r.n]), [[true, 1], [false, 1], [true, 3], [false, 1], [true, 1]]);
  assert.equal(B.signatureMatch(tpl, tpl), 0);
  assert.equal(B.signatureMatch(B.ringRuns([{ size: 1, dark: true }, { size: 0.4, dark: false }]), tpl), -1, "logo");
  assert.equal(B.signatureMatch([{ dark: true, n: 0.03 }, { dark: false, n: 0.94 }, { dark: true, n: 0.03 }], tpl), -1, "table cell");
  assert.equal(B.signatureMatch(B.ringRuns([{ size: 1, dark: true }, { size: 0.73, dark: false }]), tpl), -1, "checkbox");
});

test("asset manager: licence allowlist, trademarks, sha256 and owner approval for publishing", () => {
  const A = require(path.join(STUDIO, "asset-manager"));
  const reg = A.load("behind-the-ordinary"); const photo = reg.assets.find((a) => a.id.endsWith("e6bc34117568")); const can = reg.assets.find((a) => a.id.endsWith("1d8e644a6707"));
  assert.deepEqual(A.check(photo, "preview"), [], "the CC0 photo is usable in previews");
  assert.ok(A.check(photo, "publish").some((e) => /owner approval/.test(e)), "but needs owner approval to publish");
  assert.ok(A.check(can, "preview").some((e) => /rejected|trademark/.test(e)), "the branded can is blocked");
  for (const bad of ["CC BY-NC 4.0", "CC BY-ND 2.0", "All rights reserved", "unknown"]) assert.ok(A.check({ ...photo, licence: bad }, "preview").some((e) => /allowlist/.test(e)), bad);
  assert.ok(A.check({ ...photo, sha256: "0".repeat(64) }, "preview").some((e) => /sha256/.test(e)));
  assert.ok(A.check({ ...photo, licence: "CC BY 4.0", author: "", attribution: "" }, "preview").some((e) => /attribution/.test(e)));
});

test("publish gate: the V3 preview never reaches PUBLISH_APPROVED (unapproved photo, preview voice, no sign-offs)", (t) => {
  const pkg = path.join(ROOT, "channels/behind-the-ordinary/premium/BTO-301/out/v3/review-package.json");
  if (!fs.existsSync(pkg)) return t.skip("V3 package not rendered in this checkout (out/ is local)");
  const G = require(path.join(STUDIO, "publish-gate"));
  const r = G.evaluate(pkg, {}); assert.notEqual(r.furthestState, "PUBLISH_APPROVED"); assert.ok(r.mediaIssues.length > 0);
  const all = { creative: { by: "test", at: "x" }, factual: { by: "test", at: "x" }, publish: { by: "test", at: "x" } };
  assert.notEqual(G.evaluate(pkg, all).furthestState, "PUBLISH_APPROVED", "approvals alone cannot override media, voice or channel gates");
});

test("creative director: plan obeys its diversity rules; the audit flags a text-only static scene", () => {
  const CD = require(path.join(STUDIO, "creative-director"));
  const script = { topicId: "T", lines: [{ id: "L1", role: "hook", text: "Look at this." }, { id: "L2", text: "It was invented in 1994." }, { id: "L3", text: "It was released in 1995." }, { id: "L4", text: "The spin makes it curve." }] };
  const p = CD.plan(script, {}); const seq = p.beats.map((b) => b.technique);
  assert.ok(seq.every((x, i) => !i || x !== seq[i - 1]), `no repeats in a row: ${seq}`);
  assert.ok(Object.values(p.techniqueUse).every((n) => n <= 2)); assert.equal(TECHNIQUE_FAMILY(CD, seq[0]), "cinematic");
  const a = CD.audit({ scenes: [{ id: "a", layers: [{ component: "quote-card", props: {} }] }, { id: "b", layers: [{ component: "quote-card", props: {} }] }] });
  assert.ok(a.scenes[0].flags.some((f) => /TEXT_ONLY/.test(f)) && a.scenes[0].flags.some((f) => /STATIC_CAMERA/.test(f)));
  assert.ok(a.scenes[1].flags.some((f) => /SAME_ENV/.test(f)));
});
function TECHNIQUE_FAMILY(CD, t) { return CD.TECHNIQUES[t].family; }

test("football physics: deterministic kick; sidespin curls the ball, no spin flies straight; airflow is faster on the spin side", () => {
  const B = page(["motion.js", "components/core.js", "components/projection.js", "components/football.js", "components/football-atmos.js"]);
  B.style = J("channels/goal-lore-lab/premium/style-pack.json");
  const k = { at: 0, x0: 9, y0: -28, speed: 24, elevation: 20, azimuth: -6, spinRps: 11, ghostAt: 0 };
  B.comps["football-pitch"]({ id: "a", kicks: [k] }); const K = B.geo.a.kicks[0];
  B.comps["football-pitch"]({ id: "b", kicks: [k] }); assert.deepEqual(B.geo.b.kicks[0].path.at(-1), K.path.at(-1), "deterministic");
  const end = K.path.at(-1), ghost = K.ghost.at(-1);
  assert.ok(Math.abs(end.y + 52.5) < 0.2 && Math.abs(ghost.y + 52.5) < 0.2, "both reach the goal line");
  assert.ok(Math.abs(end.x) < 3.66 && end.z > 0 && end.z < 2.44, `spin: inside the goal (${end.x.toFixed(2)}, ${end.z.toFixed(2)})`);
  assert.ok(ghost.x > 3.66, `no spin: wide of the post (${ghost.x.toFixed(2)})`);
  const az = -6 * Math.PI / 180; const lateral = (q) => (q.x - 9) * Math.cos(az) + (q.y + 28) * Math.sin(az); // offset from the launch line
  assert.ok(K.ghost.every((q) => Math.abs(lateral(q)) < 1e-6), "spin-free flight stays in its vertical plane");
  const top = B.flowVelocity(0, 160, 260, 150, 0.3), bottom = B.flowVelocity(0, -160, 260, 150, 0.3);
  assert.ok(Math.hypot(...top) > Math.hypot(...bottom), "clockwise circulation: faster over the top");
  const far = B.flowVelocity(-1e6, 0, 260, 150, 0.3); assert.ok(Math.abs(far[0] - 260) < 1 && Math.abs(far[1]) < 1, "uniform flow far away (circulation decays as 1/r)");
  const surf = B.flowVelocity(150 * Math.cos(1), 150 * Math.sin(1), 260, 150, 0); const normal = surf[0] * Math.cos(1) + surf[1] * Math.sin(1);
  assert.ok(Math.abs(normal) < 1e-6, "no flow through the ball's surface");
});

test("daily readiness: read-only, covers the four strategic channels, leaves CriticalThread untouched, and no unapproved package counts as buffer", () => {
  const before = cp.execSync("git status --porcelain -- channels/*/state config", { cwd: ROOT }).toString();
  const r = require(path.join(STUDIO, "daily")).report({});
  assert.equal(r.readOnly, true); assert.equal(r.uploadsPerformed, 0);
  assert.deepEqual(r.channels.map((c) => c.channel), ["failure-reconstructed", "impossible-brief", "behind-the-ordinary", "goal-lore-lab"]);
  assert.equal(r.untouched[0].channel, "critical-thread");
  for (const c of r.channels) for (const p of c.packages) if (p.furthestState !== "PUBLISH_APPROVED") assert.equal(c.buffer.approvedUnpublished, 0);
  assert.equal(cp.execSync("git status --porcelain -- channels/*/state config", { cwd: ROOT }).toString(), before, "no state or config file changed");
});

test("pilot and research-pending modes: refused outside preview, never publishable, gate blocks both", () => {
  const A = require(path.join(STUDIO, "adapter"));
  const pilot = J("channels/goal-lore-lab/premium/pilots/GLL-P01/topic.json");
  const { channel } = A.loadPilot("goal-lore-lab", pilot); assert.equal(channel.pilot, true); assert.ok(!channel.entry, "a pilot channel has no registry entry");
  const r = A.pilotReadiness(pilot); assert.equal(r.ready, true); assert.ok(r.warnings.some((w) => /no verbatim quote/.test(w)), "unquoted facts are reported");
  assert.equal(A.pilotReadiness({ narration: [], facts: [{ claim: "x" }] }).ready, false, "no narration / no URL is refused");
  const env = { ...process.env, BTO_PREMIUM_RENDER: "final" };
  for (const args of [["--pilot", "channels/goal-lore-lab/premium/pilots/GLL-P01"], ["--channel", "behind-the-ordinary", "--topic", "BTO-040", "--research-pending"]]) {
    const p = cp.spawnSync(process.execPath, [path.join(STUDIO, "studio.js"), ...args, "--stills", "0"], { cwd: ROOT, env, encoding: "utf8" });
    assert.notEqual(p.status, 0); assert.match(p.stderr + p.stdout, /allowed only with BTO_PREMIUM_RENDER=preview/); }
  // research-pending never widens readiness beyond the primary-source gap: a published topic still refuses
  const pub = cp.spawnSync(process.execPath, [path.join(STUDIO, "studio.js"), "--channel", "behind-the-ordinary", "--topic", "BTO-016", "--research-pending", "--stills", "0"], { cwd: ROOT, env: { ...process.env, BTO_PREMIUM_RENDER: "preview" }, encoding: "utf8" });
  assert.notEqual(pub.status, 0); assert.match(pub.stderr, /already published/);
  assert.equal(cp.execSync("git status --porcelain -- channels/behind-the-ordinary/premium/BTO-016", { cwd: ROOT }).toString(), "", "a refused run writes nothing");
  const G = require(path.join(STUDIO, "publish-gate")); const tmp = fs.mkdtempSync(path.join(require("os").tmpdir(), "gate-"));
  fs.writeFileSync(path.join(tmp, "review-package.json"), JSON.stringify({ channel: "goal-lore-lab", topicId: "GLL-P01", pilot: "x", verdict: "PILOT_NOT_APPROVED_FOR_PUBLICATION", video: "x.mp4" }));
  const e = G.evaluate(path.join(tmp, "review-package.json"), { creative: { by: "t", at: "2026-01-01" }, factual: { by: "t", at: "2026-01-01" }, publish: { by: "t", at: "2026-01-01" } });
  assert.equal(e.furthestState, null); assert.match(e.steps[0].reasons[0], /pilots are never publishable/);
});

test("rig-3d and places: deterministic geometry, back faces culled, figures and aisle draw from t alone", () => {
  const B = page(["motion.js", "components/core.js", "components/projection.js", "components/rig.js", "components/places.js"]);
  B.style = J("channels/behind-the-ordinary/premium/style-pack.json"); B.audio = [];
  const rig = B.comps["rig-3d"]({ parts: [{ id: "box", shape: "box", c: [0, 0, 10], size: [20, 20, 20], color: "#a0703f" }], rx: 60, s: 4 });
  const a = rig.draw(1), b = rig.draw(1); assert.equal(a, b, "deterministic");
  const faces = (a.match(/<path d="M[^"]+Z" fill="#/g) || []).length; assert.ok(faces >= 2 && faces <= 3, `a box shows 2-3 faces, drew ${faces}`);
  const fig = B.comps["figure"]({ people: [{ pathKeys: [[0, 0, 1000], [2, 600, 1000]], pose: "walk", hat: "fedora" }] });
  assert.notEqual(fig.draw(0.5), fig.draw(1.0), "the gait advances with distance"); assert.equal(fig.draw(0.7), fig.draw(0.7));
  const aisle = B.comps["store-aisle"]({ dollyKeys: [[0, 0], [2, 1]] }); assert.notEqual(aisle.draw(0), aisle.draw(2), "dolly moves the camera");
});

test("creative director: V5 techniques are planned for people, assembly and place beats; review never invents a human verdict", () => {
  const CD = require(path.join(STUDIO, "creative-director"));
  const script = { topicId: "T", lines: [{ id: "L1", text: "The first shopping cart rolled down the store aisle." }, { id: "L2", text: "Shoppers refused to push it." }, { id: "L3", text: "He put a basket on the seat and wheels on its legs." }, { id: "L4", text: "Then it became extremely popular." }] };
  const p = CD.plan(script, J("scripts/bto-studio/profiles/behind-the-ordinary.json")); const seq = p.beats.map((b) => b.technique);
  assert.equal(seq[0], "place-establishing"); assert.equal(seq[1], "character-staging"); assert.equal(seq[2], "mechanical-assembly"); assert.equal(seq[3], "social-diagram");
  const out = path.join(ROOT, "channels/behind-the-ordinary/premium/BTO-040/out");
  if (fs.existsSync(path.join(out, "scenes.json")) && fs.readdirSync(out).some((f) => /premium-(final|preview)\.mp4$/.test(f))) {
    const r = CD.review(out, J("channels/behind-the-ordinary/premium/BTO-040/storyboard.json"));
    assert.ok(r.scenes.every((s) => s.measured && typeof s.measured.motion === "number"));
    const notes = fs.existsSync(path.join(out, "creative-notes.json")) ? J("channels/behind-the-ordinary/premium/BTO-040/out/creative-notes.json") : {};
    for (const s of r.scenes) if (!notes[s.id]) assert.equal(s.human.verdict, null, "no note -> no verdict"); else assert.ok(s.human.by, "notes carry their author");
  }
});

test("daily readiness matrix: every dimension for every strategic channel, legacy FR state resolved, GLL blocked on identity", () => {
  const r = require(path.join(STUDIO, "daily")).report({});
  const dims = ["topicReadiness", "researchCompleteness", "scriptReadiness", "narration", "premiumRenderer", "qualityGates", "credentials", "duplicatePrevention", "publishingPermission", "schedulerCompatibility"];
  for (const c of r.channels) for (const d of dims) assert.ok(["ready", "partial", "blocked", "unknown"].includes(c.matrix[d].status), `${c.channel}.${d}`);
  const gll = r.channels.find((c) => c.channel === "goal-lore-lab"); assert.equal(gll.matrix.credentials.status, "blocked"); assert.equal(gll.matrix.publishingPermission.status, "blocked");
  const fr = r.channels.find((c) => c.channel === "failure-reconstructed"); assert.ok(fr.topics.published > 0, "FR publish history read from its legacy state (icerik/)");
});
