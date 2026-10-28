"use strict";
// Premium as the primary renderer (core/pipeline/premium-lane.js) and unattended publication under an owner-signed
// publication policy (core/pipeline/premium-publish.js). Premium primary never falls back to the legacy renderer; a
// policy is never signed by code; a dry run writes no approval; a topic refused for its content is never retried.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const Channel = require("../../core/channel-context");
const Lane = require("../../core/pipeline/premium-lane");
const Publish = require("../../core/pipeline/premium-publish");

const ROOT = path.resolve(__dirname, "..", "..");
const W = (f, o) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, typeof o === "string" || Buffer.isBuffer(o) ? o : JSON.stringify(o, null, 1)); };
const J = (f) => JSON.parse(fs.readFileSync(f, "utf8"));
const quiet = () => {};
const SLOTS = fs.mkdtempSync(path.join(os.tmpdir(), "pp-slots-"));
const ON = { HLT_PREMIUM_PUBLISH: "1", PREMIUM_RENDER_LOCK_DIR: SLOTS, HLT_PREMIUM_MIN_FREE_MB: "1", HLT_PREMIUM_MIN_DISK_MB: "1" };
const topic = (over = {}) => ({ id: "HLT-T1", slug: "t1", title: "Why a zip never jams", coreQuestion: "Why does a zip close?", channel: "behind-the-ordinary", researchStatus: "VERIFIED", productionReady: true,
  narration: [{ role: "HOOK", text: "A line.", layer: "VERIFIED FACT" }], facts: [{ id: "F1", claim: "c", quote: "q", url: "https://en.wikipedia.org/wiki/Zipper", source: "Wikipedia: Zipper", layer: "VERIFIED FACT" }], ...over });
const POLICY = (over = {}) => ({ schema: "premium.publication-policy.v1", channel: "behind-the-ordinary", status: "SIGNED", signedBy: "owner", signedAt: "2026-10-27T10:00:00Z", ...over });

function fakeChannel(topics, { policy = null } = {}) {
  const real = Channel.getChannel("behind-the-ordinary");
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "pp-primary-"));
  const paths = { ...real.paths, base, state: path.join(base, "state"), topics: path.join(base, "topics"), topicUniverse: path.join(base, "topics", "topic-universe.json"), production: path.join(base, "state", "production"), packages: path.join(base, "reports", "packages") };
  for (const d of [paths.state, paths.production, paths.packages]) fs.mkdirSync(d, { recursive: true });
  W(paths.topicUniverse, { topics });
  if (policy) W(path.join(base, "premium", "publication-policy.json"), policy);
  return { ...real, paths, entry: { ...real.entry, enabled: true }, retired: null };
}
// a studio that writes a deterministic package; youtube-yukle that records what it was asked to do
function fakeSpawn(ch, { verdict = "READY_FOR_HUMAN_REVIEW", approved = true } = {}) {
  const calls = [];
  const spawn = (bin, args, opts) => {
    calls.push({ args, env: opts.env });
    if (args[0].endsWith("studio.js")) {
      const id = args[args.indexOf("--topic") + 1]; const dir = path.join(ch.paths.base, "premium", id);
      W(path.join(dir, "storyboard.json"), { schema: "bto-studio.storyboard.v1", scenes: [{ id: "s1" }] });
      const video = path.join(dir, "out", "v-premium-final.mp4"); W(video, Buffer.alloc(4000, 3));
      W(path.join(dir, "out", "review-package.json"), { channel: ch.slug, topicId: id, verdict, video: path.relative(ROOT, video), qa: { objectivePass: true }, voice: { used: "en-US-EmmaMultilingualNeural", approved }, narrationUnchanged: { sourceHash: "abc", lines: ["A line."] } });
      return { status: 0 };
    }
    if (args[0].endsWith("youtube-yukle.js")) {
      const slug = args[args.indexOf("--channel") + 2]; calls[calls.length - 1].staged = fs.existsSync(path.join(ch.paths.production, slug, "Videos", `${slug}.mp4`));
      if (!args.includes("--dogrula")) W(path.join(ch.paths.state, "published.json"), [{ slug, topicId: "HLT-T1", videoId: "VID1" }]);
      return { status: 0 };
    }
    throw new Error("unexpected " + args[0]);
  };
  return { spawn, calls };
}
const gateOk = () => ({ furthestState: "PUBLISH_APPROVED", steps: [], duplicates: [] });

test("routing: premium is primary only for the premium-only channel or by its repository variable; never for a retired channel", () => {
  const fr = Channel.getChannel("failure-reconstructed");
  assert.equal(Lane.primary(fr, {}), false); assert.equal(Lane.primary(fr, { FR_PREMIUM_PRIMARY: "off" }), false); assert.equal(Lane.primary(fr, { FR_PREMIUM_PRIMARY: "1" }), true);
  assert.equal(Lane.primary(Channel.getChannel("impossible-brief"), { IB_PREMIUM_PRIMARY: "1" }), true);
  assert.equal(Lane.primary(Channel.getChannel("behind-the-ordinary"), { HLT_PREMIUM_PRIMARY: "1" }), true);
  assert.equal(Lane.primary(Channel.getChannel("goal-lore-lab"), {}), true);
  assert.equal(Lane.primary(Channel.getChannel("critical-thread"), { CT_PREMIUM_PRIMARY: "1", GLL_PREMIUM_PRIMARY: "1" }), false);
  // shorts-sira hands a premium-primary channel to the premium lane before any legacy code path runs
  const sira = fs.readFileSync(path.join(ROOT, "shorts-sira.js"), "utf8"); const at = sira.indexOf('require("./core/pipeline/premium-lane").primary(CHANNEL)');
  assert.ok(at > 0 && at < sira.indexOf("process.exit(main())") && at < sira.indexOf('require("./core/pipeline/impossible-brief").runChannel'));
});

test("the shipped publication policies are UNSIGNED: no channel publishes unattended until its owner signs", () => {
  for (const slug of ["failure-reconstructed", "impossible-brief", "behind-the-ordinary", "goal-lore-lab"]) {
    const ch = Channel.getChannel(slug); const p = Publish.policy(ch);
    assert.equal(p.ok, false, slug); assert.match(p.why, /not SIGNED/); assert.equal(p.policy.channel, slug); assert.equal(p.policy.signedBy, null);
    assert.equal(Publish.policyActive(ch, { [`${{ "failure-reconstructed": "FR", "impossible-brief": "IB", "behind-the-ordinary": "HLT", "goal-lore-lab": "GLL" }[slug]}_PREMIUM_PUBLISH`]: "1" }), false);
  }
  assert.equal(Publish.policy(fakeChannel([], { policy: POLICY({ channel: "impossible-brief" }) })).ok, false, "a policy signed for another channel is not this channel's");
  assert.equal(Publish.policy(fakeChannel([], { policy: POLICY({ signedAt: "soon" }) })).ok, false);
});

test("without a signed policy or approval: a review candidate, the gate as it stands and the uploader's --dogrula; nothing approved or written", () => {
  const ch = fakeChannel([topic()]); const { spawn, calls } = fakeSpawn(ch);
  assert.equal(Lane.runChannel("behind-the-ordinary", [], { env: { ...ON, HLT_PREMIUM_PRIMARY: "1", PUBLISH: "0", HLT_YT_REFRESH_TOKEN: "x" }, spawn, log: quiet, channel: ch,
    premium: { ...Publish, uploaderDryRun: (c, t, f, o) => Publish.uploaderDryRun(c, t, f, { ...o, gate: () => ({ furthestState: "QA_PASSED", steps: [{ to: "PUBLISH_APPROVED", ok: false, reasons: ["creative sign-off missing"] }], duplicates: [] }) }) } }), 0);
  assert.deepEqual(calls.map((c) => path.basename(c.args[0])), ["studio.js", "youtube-yukle.js"]);
  assert.equal(calls[0].env.BTO_PREMIUM_RENDER, "preview"); assert.equal(calls[0].env.HLT_YT_REFRESH_TOKEN, undefined, "the render never sees credentials");
  assert.ok(calls[1].args.includes("--dogrula")); assert.equal(calls[1].env.PUBLISH, "0"); assert.equal(calls[1].staged, true, "the uploader checked the staged candidate");
  assert.equal(fs.readdirSync(ch.paths.production).length, 0, "the staged dry-run package is removed");
  assert.ok(!fs.existsSync(path.join(ch.paths.base, "premium", "approvals")), "no reservation or approval is written");
  const last = J(path.join(ch.paths.state, "ops", "production-stages.json")).runs.pop();
  assert.equal(last.outcome, "DRY_RUN"); assert.match(last.reason, /creative sign-off missing/); assert.match(last.reason, /publication policy: no publication policy/);
});

test("signed policy, publication day: reserves the next qualified topic, binds the policy to the rendered hash, uploads once through youtube-yukle", () => {
  const ch = fakeChannel([topic()], { policy: POLICY() }); const { spawn, calls } = fakeSpawn(ch); const pol = Publish.policy(ch);
  const r = Publish.run(ch, { env: { ...ON, PUBLISH: "1" }, spawn, gate: gateOk, log: quiet, nextTopic: () => Lane.qualified(ch).ok[0].topic });
  assert.equal(r.uploaded, true); assert.equal(r.videoId, "VID1");
  assert.deepEqual(calls.map((c) => path.basename(c.args[0])), ["studio.js", "youtube-yukle.js"]); assert.equal(calls[0].env.BTO_PREMIUM_RENDER, "final"); assert.ok(!calls[1].args.includes("--dogrula"));
  const rec = J(path.join(ch.paths.base, "premium", "approvals", "HLT-T1.json"));
  assert.equal(rec.auto, true); assert.equal(rec.basis.policySha256, pol.sha256); assert.equal(rec.basis.signedBy, "owner");
  for (const k of ["creative", "factual", "publish"]) { assert.equal(rec[k].basis, "publication-policy"); assert.match(rec[k].by, /^publication policy [0-9a-f]{12} \(signed by owner/); }
  assert.match(rec.contentSha256, /^[0-9a-f]{64}$/); assert.equal(rec.publishedVideoId, "VID1");
  assert.equal(rec.metadata.title, "Why a zip never jams"); assert.match(rec.metadata.description, /Sources:\n- Wikipedia: Zipper: https:\/\/en\.wikipedia\.org\/wiki\/Zipper/); assert.match(rec.metadata.description, /synthetic voice/);
  // the next day: the published topic is neither re-reserved nor re-uploaded
  assert.equal(Lane.qualified(ch).ok.length, 0);
  const again = fakeSpawn(ch); const r2 = Publish.run(ch, { env: { ...ON, PUBLISH: "1" }, spawn: again.spawn, gate: gateOk, log: quiet, nextTopic: () => (Lane.qualified(ch).ok[0] || {}).topic || null });
  assert.equal(r2.noTopic, true); assert.equal(again.calls.length, 0);
});

test("signed policy, dry run: the whole chain runs to the uploader's --dogrula and nothing is written", () => {
  const ch = fakeChannel([topic()], { policy: POLICY() }); const { spawn, calls } = fakeSpawn(ch);
  const r = Publish.run(ch, { env: { ...ON, PUBLISH: "0" }, spawn, gate: gateOk, log: quiet, nextTopic: () => Lane.qualified(ch).ok[0].topic });
  assert.equal(r.dryRun, true); assert.ok(calls[1].args.includes("--dogrula"));
  assert.ok(!fs.existsSync(path.join(ch.paths.base, "premium", "approvals")), "a dry run reserves and binds nothing");
});

test("signed policy: a topic refused for its content stays reserved with the reason and is never picked again; the bar is not lowered", () => {
  const ch = fakeChannel([topic(), topic({ id: "HLT-T2", slug: "t2", title: "Second" })], { policy: POLICY() });
  const bad = fakeSpawn(ch, { verdict: "REVISION_REQUIRED" });
  const next = () => (Lane.qualified(ch).ok[0] || {}).topic || null;
  assert.equal(Publish.run(ch, { env: { ...ON, PUBLISH: "1" }, spawn: bad.spawn, gate: gateOk, log: quiet, nextTopic: next }), null);
  const rec = J(path.join(ch.paths.base, "premium", "approvals", "HLT-T1.json")); assert.match(rec.refused.why, /REVISION_REQUIRED/); assert.equal(rec.creative, null, "nothing was signed for refused content");
  assert.deepEqual(Lane.qualified(ch).ok.map((q) => q.topic.id), ["HLT-T2"], "the refused topic is out of both lanes");
  const ok = fakeSpawn(ch); const r = Publish.run(ch, { env: { ...ON, PUBLISH: "1" }, spawn: ok.spawn, gate: gateOk, log: quiet, nextTopic: next });
  assert.equal(r.topicId, "HLT-T2"); assert.equal(r.uploaded, true);
  // an unapproved voice or a closed publish gate (channel disabled) is not the topic's fault: it stays reserved, not refused
  const ch2 = fakeChannel([topic()], { policy: POLICY() }); const v = fakeSpawn(ch2, { approved: false });
  assert.equal(Publish.run(ch2, { env: { ...ON, PUBLISH: "1" }, spawn: v.spawn, gate: gateOk, log: quiet, nextTopic: () => Lane.qualified(ch2).ok[0].topic }), null);
  assert.equal(J(path.join(ch2.paths.base, "premium", "approvals", "HLT-T1.json")).refused, undefined);
});

test("premium primary on a publication day with a policy that refused: BLOCKED, no review render, the legacy renderer never runs", () => {
  const ch = fakeChannel([topic()], { policy: POLICY() }); const calls = [];
  const premium = { ...Publish, run: () => null };
  const plan = require("../../core/scheduling"); const orig = plan.channelPlan; plan.channelPlan = () => ({ short: { due: true, targetDay: "2026-10-28" } });
  try { assert.equal(Lane.runChannel("behind-the-ordinary", [], { env: { ...ON, HLT_PREMIUM_PRIMARY: "1", PUBLISH: "1" }, spawn: (...a) => { calls.push(a); return { status: 0 }; }, log: quiet, channel: ch, premium }), 0); }
  finally { plan.channelPlan = orig; }
  assert.equal(calls.length, 0);
  assert.equal(J(path.join(ch.paths.state, "ops", "production-stages.json")).runs.pop().outcome, "BLOCKED");
});

test("workflow: FR, IB and HLT choose their renderer by variable or the engine input; publishing flags only pass the owner's variables", () => {
  const wf = fs.readFileSync(path.join(ROOT, ".github", "workflows", "portfolio-production.yml"), "utf8");
  assert.match(wf, /engine:\n +description: [^\n]+\n +type: choice\n +options: \[default, premium, legacy\]\n +default: default/);
  for (const P of ["FR", "IB", "HLT"]) {
    assert.ok(wf.includes(`${P}_PREMIUM_PRIMARY: \${{ inputs.engine == 'premium' && '1' || (inputs.engine != 'legacy' && vars.${P}_PREMIUM_PRIMARY == '1') && '1' || 'off' }}`), P);
    assert.ok(wf.includes(`${P}_PREMIUM_PUBLISH: \${{ vars.${P}_PREMIUM_PUBLISH == '1' && '1' || 'off' }}`), P);
  }
  // The Hidden Logic of Things is scheduled only once premium is its primary renderer
  assert.match(wf, /- name: The Hidden Logic of Things Short\n +if: \$\{\{ always\(\) && \(\(\(github\.event_name == 'schedule' \|\| github\.event_name == 'repository_dispatch'\) && vars\.HLT_PREMIUM_PRIMARY == '1'\)/);
  assert.match(wf, /channels\/\*\/premium\/\*\/out\/\*\.mp4/, "every channel's premium MP4 is a preview artifact (never committed: out/ is git-ignored)");
});

test("a policy that requires research review publishes only topics whose exact narration and quotes the owner reviewed", () => {
  const t1 = topic(); const ch = fakeChannel([t1], { policy: POLICY({ requireResearchReview: true }) });
  const next = (accept) => (Lane.qualified(ch).ok.find((r) => !accept || accept(r.topic)) || {}).topic || null;
  const none = fakeSpawn(ch);
  assert.equal(Publish.run(ch, { env: { ...ON, PUBLISH: "1" }, spawn: none.spawn, gate: gateOk, log: quiet, nextTopic: next }).noTopic, true, "unreviewed research is never published unattended");
  assert.equal(none.calls.length, 0);
  const reviews = path.join(ch.paths.base, "premium", "research-reviews.json");
  W(reviews, { "HLT-T1": { by: "owner", at: "2026-10-28T08:00:00Z", sha256: Publish.researchHash({ ...t1, narration: [{ text: "Another line.", facts: [] }] }) } });
  assert.equal(Publish.researchReviewed(ch, t1), false, "a review of different text does not count");
  W(reviews, { "HLT-T1": { by: "owner", at: "2026-10-28T08:00:00Z", sha256: Publish.researchHash(t1) } });
  const ok = fakeSpawn(ch); const r = Publish.run(ch, { env: { ...ON, PUBLISH: "1" }, spawn: ok.spawn, gate: gateOk, log: quiet, nextTopic: next });
  assert.equal(r.uploaded, true); assert.equal(r.topicId, "HLT-T1");
  for (const c of ["goal-lore-lab", "behind-the-ordinary"]) assert.equal(Publish.policy(Channel.getChannel(c)).policy.requireResearchReview, true, `${c}: its new research needs the owner's reading`);
});
