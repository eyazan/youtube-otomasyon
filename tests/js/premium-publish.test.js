"use strict";
// Premium publishing adapter (core/pipeline/premium-publish.js), disabled by default: an owner-approved premium Short for
// a reserved topic reaches the EXISTING uploader only after a fresh approved-voice render whose content hash matches the
// approval, objective QA and the publish gate. Every refusal leaves the day to the live lane; nothing is uploaded twice.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const Publish = require("../../core/pipeline/premium-publish");
const Context = require("../../core/growth/context");

const ROOT = path.resolve(__dirname, "..", "..");
const W = (f, o) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, typeof o === "string" ? o : JSON.stringify(o, null, 1)); };
function fakeChannel() {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "premium-pub-"));
  const paths = { base, state: path.join(base, "state"), production: path.join(base, "state", "production"), packages: path.join(base, "reports", "packages") };
  for (const d of Object.values(paths)) fs.mkdirSync(d, { recursive: true });
  return { slug: "impossible-brief", name: "ImpossibleBrief", config: { pathMode: "isolated" }, entry: { enabled: true }, paths };
}
const SB = { schema: "bto-studio.storyboard.v1", scenes: [{ id: "s1-hook" }] };
const PKG = (over = {}) => ({ channel: "impossible-brief", topicId: "IB-T1", verdict: "READY_FOR_HUMAN_REVIEW", video: null,
  voice: { used: "en-US-BrianMultilingualNeural", approved: true }, narrationUnchanged: { sourceHash: "abc", lines: ["One line."] }, ...over });
const signed = { by: "owner", at: "2026-10-23T09:00:00Z" };
function setup({ pkg = {}, approval = {}, renderStatus = 0 } = {}) {
  const ch = fakeChannel(); const topic = path.join(ch.paths.base, "premium", "IB-T1");
  W(path.join(topic, "storyboard.json"), SB);
  const video = path.join(topic, "out", "t1-premium-final.mp4");
  const p = PKG({ video: path.relative(ROOT, video), ...pkg });
  const hash = Publish.contentHash(ch, "IB-T1", PKG());
  W(path.join(ch.paths.base, "premium", "approvals", "IB-T1.json"), { topicId: "IB-T1", slug: "t1", reservedBy: "owner", contentSha256: hash, creative: signed, factual: signed, publish: signed,
    metadata: { title: "How a thing works", description: "Sources in the pinned comment.", tags: ["science"] }, ...approval });
  const calls = [];
  const spawn = (bin, args, opts) => {
    calls.push({ args, env: opts.env });
    if (args[0].endsWith("studio.js")) { if (renderStatus === 0) { W(video, Buffer.alloc(5000, 7)); W(path.join(topic, "out", "review-package.json"), p); } return { status: renderStatus }; }
    if (args[0].endsWith("youtube-yukle.js")) { if (!args.includes("--dogrula")) W(path.join(ch.paths.state, "published.json"), [{ slug: "t1", topicId: "IB-T1", videoId: "VID123" }]); return { status: 0 }; }
    throw new Error("unexpected spawn " + args[0]);
  };
  const gateOk = () => ({ furthestState: "PUBLISH_APPROVED", steps: [], duplicates: [] });
  return { ch, spawn, calls, gateOk, hash };
}
const quiet = () => {};
const ON = { IB_PREMIUM_PUBLISH: "1", PREMIUM_RENDER_LOCK_DIR: fs.mkdtempSync(path.join(os.tmpdir(), "pp-slots-")), IB_PREMIUM_MIN_FREE_MB: "1", IB_PREMIUM_MIN_DISK_MB: "1" };

test("disabled by default: without IB_PREMIUM_PUBLISH=1 nothing renders, stages or uploads, even with a full approval", () => {
  const { ch, spawn, calls, gateOk } = setup();
  assert.equal(Publish.run(ch, { env: {}, spawn, gate: gateOk, log: quiet }), null);
  assert.equal(Publish.run(ch, { env: { IB_PREMIUM_PUBLISH: "true", IB_PREMIUM_RENDER: "preview" }, spawn, gate: gateOk, log: quiet }), null);
  assert.equal(calls.length, 0); assert.equal(fs.readdirSync(ch.paths.production).length, 0);
  // a workflow may only pass the owner's repository variable through; no workflow turns publishing on by itself
  const passThrough = /^ +(IB|FR|HLT|GLL)_PREMIUM_PUBLISH: \$\{\{ vars\.\1_PREMIUM_PUBLISH == '1' && '1' \|\| 'off' \}\}$/gm;
  for (const wf of fs.readdirSync(path.join(ROOT, ".github", "workflows"))) {
    const y = fs.readFileSync(path.join(ROOT, ".github", "workflows", wf), "utf8");
    assert.doesNotMatch(y.replace(passThrough, ""), /_PREMIUM_PUBLISH: /, wf);
    if (wf !== "portfolio-production.yml") assert.doesNotMatch(y, passThrough, `${wf}: only the production workflow passes the variable`);
  }
});

test("an incomplete approval (any sign-off, hash or metadata missing) never renders or uploads", () => {
  for (const approval of [{ creative: null }, { factual: { by: "", at: "x" } }, { publish: null }, { contentSha256: null }, { metadata: { title: "", description: "d" } }]) {
    const { ch, spawn, calls, gateOk } = setup({ approval });
    assert.equal(Publish.run(ch, { env: ON, spawn, gate: gateOk, log: quiet }), null, JSON.stringify(approval)); assert.equal(calls.length, 0);
  }
  assert.deepEqual(Publish.approvalProblems({ creative: signed, factual: signed, publish: signed, contentSha256: "a".repeat(64), metadata: { title: "t", description: "d" } }), []);
});

test("approved: a fresh final render with the approved Edge voice only, staged as a normal package, handed to youtube-yukle (--dogrula when PUBLISH!=1)", () => {
  const { ch, spawn, calls, gateOk } = setup();
  const r = Publish.run(ch, { env: { ...ON, IB_YT_REFRESH_TOKEN: "secret" }, spawn, gate: gateOk, log: quiet, targetDay: "2026-10-24" });
  assert.deepEqual({ dry: r.dryRun, uploaded: r.uploaded, exit: r.exitCode }, { dry: true, uploaded: false, exit: 0 });
  const studio = calls[0]; assert.ok(studio.args.includes("--quality") && studio.args.includes("final") && studio.args.includes("edge"));
  assert.equal(studio.env.BTO_PREMIUM_RENDER, "final", "final mode never falls back to an unapproved voice"); assert.equal(studio.env.IB_YT_REFRESH_TOKEN, undefined, "the render never sees credentials");
  const up = calls[1]; assert.ok(up.args[0].endsWith("youtube-yukle.js")); assert.deepEqual(up.args.slice(1), ["--channel", "impossible-brief", "t1", "--dogrula"]);
  assert.equal(up.env.SHORTS_TARGET_DAY, "2026-10-24"); assert.equal(up.env.IB_YT_REFRESH_TOKEN, "secret", "the existing uploader keeps its own credentials and identity check");
  const prod = path.join(ch.paths.production, "t1");
  assert.equal(JSON.parse(fs.readFileSync(path.join(prod, "konu.json"))).channel, "impossible-brief", "job channel tag for jobChannelCheck");
  assert.equal(JSON.parse(fs.readFileSync(path.join(prod, "YUKLEME.json"))).baslik, "How a thing works");
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(prod, "Videos", "denetim.json"))).voice.fallback, null);
  assert.equal(JSON.parse(fs.readFileSync(path.join(ch.paths.packages, "t1", "quality-gate.json"))).karar, "PUBLISH");
  assert.ok(fs.existsSync(path.join(prod, "Videos", "t1.mp4")));
});

test("PUBLISH=1: uploaded once, recorded in the approval; the next run finds nothing to publish (no duplicate upload)", () => {
  const { ch, spawn, calls, gateOk } = setup();
  const r = Publish.run(ch, { env: { ...ON, PUBLISH: "1" }, spawn, gate: gateOk, log: quiet });
  assert.deepEqual({ uploaded: r.uploaded, videoId: r.videoId, exit: r.exitCode }, { uploaded: true, videoId: "VID123", exit: 0 });
  assert.ok(!calls[1].args.includes("--dogrula"));
  assert.equal(JSON.parse(fs.readFileSync(path.join(ch.paths.base, "premium", "approvals", "IB-T1.json"))).publishedVideoId, "VID123");
  assert.equal(Publish.run(ch, { env: { ...ON, PUBLISH: "1" }, spawn, gate: gateOk, log: quiet }), null); assert.equal(calls.length, 2);
  assert.equal(Publish.reserved(ch).size, 0, "a published premium topic is no longer reserved");
});

test("refusals leave the day to the live lane: changed content, blocked gate, unapproved voice, render failure, foreign video", () => {
  const cases = [
    [{ pkg: { narrationUnchanged: { sourceHash: "abc", lines: ["An edited line."] } } }, null, /content changed since approval/],
    [{}, () => ({ furthestState: "QA_PASSED", steps: [{ ok: false, reasons: ["factual sign-off missing"] }], duplicates: [] }), /publish gate stops at QA_PASSED/],
    [{ pkg: { voice: { used: "kokoro:am_fenrir", approved: false } } }, null, /not the approved voice/],
    [{ pkg: { verdict: "BLOCKED" } }, null, /package verdict BLOCKED/],
    [{ renderStatus: 1 }, null, /final render failed/],
  ];
  for (const [opts, gate, why] of cases) {
    const { ch, spawn, calls, gateOk } = setup(opts); const logs = [];
    assert.equal(Publish.run(ch, { env: { ...ON, PUBLISH: "1" }, spawn, gate: gate || gateOk, log: (m) => logs.push(m) }), null);
    assert.ok(!calls.some((c) => c.args[0].endsWith("youtube-yukle.js")), "the uploader is never called"); assert.match(logs.join("\n"), why);
    assert.equal(Publish.reserved(ch).size, 2, "the reservation stays (slug and id)");
  }
  const { ch, spawn, calls, gateOk } = setup(); W(path.join(ch.paths.production, "t1", "Videos", "t1.mp4"), "another video");
  const logs = []; assert.equal(Publish.run(ch, { env: { ...ON, PUBLISH: "1" }, spawn, gate: gateOk, log: (m) => logs.push(m) }), null);
  assert.match(logs.join("\n"), /already holds another video/); assert.ok(!calls.some((c) => c.args[0].endsWith("youtube-yukle.js")));
});

test("a reserved topic is never picked by the live lanes; an already published topic is not published again", () => {
  const { ch, spawn, calls, gateOk } = setup();
  const used = Context.history(ch).used; assert.ok(used.has("t1") && used.has("IB-T1"), "growth selection treats the reservation as used");
  assert.match(fs.readFileSync(path.join(ROOT, "shorts-sira.js"), "utf8"), /require\("\.\/core\/pipeline\/premium-publish"\)\.reserved\(CHANNEL\)/);
  W(path.join(ch.paths.state, "published.json"), [{ slug: "t1", videoId: "LIVE1" }]);
  assert.equal(Publish.run(ch, { env: { ...ON, PUBLISH: "1" }, spawn, gate: gateOk, log: quiet }), null); assert.equal(calls.length, 0);
});

test("lane wiring: the adapter runs after the due check and before topic selection, and only in scheduled (non-explicit) runs", () => {
  const ib = fs.readFileSync(path.join(ROOT, "core", "pipeline", "impossible-brief.js"), "utf8");
  const at = ib.indexOf('require("./premium-publish").run(channel, { targetDay })');
  assert.ok(at > ib.indexOf("channelPlan(channel).short") && at < ib.indexOf("const universe = Discovery.universe(channel)"));
  const fr = fs.readFileSync(path.join(ROOT, "shorts-sira.js"), "utf8");
  const f = fr.indexOf('require("./core/pipeline/premium-publish").run(CHANNEL, { targetDay: HEDEF_GUN })');
  assert.ok(f > fr.indexOf('require("./yayin-plani").durum("short")') && f < fr.indexOf("Growth.orderedQueue(CHANNEL"));
});
