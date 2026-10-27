"use strict";
// GoalLore Lab replaces the retired CriticalThread on the same, renamed YouTube channel. One lane, premium only, fail
// closed: it never selects a CriticalThread topic, never uploads anything but an owner-approved premium package through
// the existing uploader, and stays out of publishing until the registry entry is enabled.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const Channel = require("../../core/channel-context");
const Lane = require("../../core/pipeline/goal-lore-lab");
const Publish = require("../../core/pipeline/premium-publish");

const ROOT = path.resolve(__dirname, "..", "..");
const W = (f, o) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(o, null, 1)); };
const verifiedTopic = (over = {}) => ({ id: "GLL-T1", slug: "test-goal", title: "T", channel: "goal-lore-lab", researchStatus: "VERIFIED", productionReady: true,
  narration: [{ role: "HOOK", text: "A line.", layer: "VERIFIED FACT", facts: ["F1"] }], facts: [{ id: "F1", claim: "c", quote: "a verbatim sentence from the source", url: "https://en.wikipedia.org/w/index.php?title=X&oldid=1", layer: "VERIFIED FACT" }], ...over });
function fakeChannel(topics) {
  const real = Channel.getChannel("goal-lore-lab");
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "gll-lane-"));
  const paths = { ...real.paths, base, state: path.join(base, "state"), topics: path.join(base, "topics"), topicUniverse: path.join(base, "topics", "topic-universe.json") };
  fs.mkdirSync(paths.state, { recursive: true });
  W(paths.topicUniverse, { topics });
  return { ...real, paths, retired: null };
}
const quiet = () => {};

test("registry: one GoalLore Lab lane on the CriticalThread channel; CriticalThread retired; publishing closed until enabled", () => {
  const reg = JSON.parse(fs.readFileSync(path.join(ROOT, "config", "channels.json"), "utf8")).channels;
  assert.equal(reg["goal-lore-lab"].enabled, false, "publishing (publish gate) stays closed until the owner enables it");
  assert.equal(reg["goal-lore-lab"].lane, "premium");
  assert.equal(reg["critical-thread"].retired.successor, "goal-lore-lab");
  const gll = Channel.getChannel("goal-lore-lab");
  assert.deepEqual(gll.credentialNames.channelId, ["GLL_YT_CHANNEL_ID", "CT_YT_CHANNEL_ID"], "the existing CT credentials are reused, no new OAuth");
  assert.ok(gll.credentialNames.refreshToken.includes("CT_YT_REFRESH_TOKEN"));
  // no two non-retired channels may resolve the same YouTube identity
  const live = Object.keys(reg).map((s) => Channel.getChannel(s)).filter((c) => !c.retired);
  const owners = new Map();
  for (const c of live) for (const name of c.credentialNames.channelId) { assert.ok(!owners.has(name), `${name} is used by ${owners.get(name)} and ${c.slug}`); owners.set(name, c.slug); }
  assert.equal(Channel.getChannel("critical-thread").retired !== null, true);
});

test("GoalLore Lab never selects an old CriticalThread topic, a foreign record or an unverified one", () => {
  const ctSlug = JSON.parse(fs.readFileSync(path.join(Channel.getChannel("critical-thread").paths.state, "published.json"), "utf8"))[0].slug;
  const ch = fakeChannel([verifiedTopic({ id: "GLL-T2", slug: ctSlug }), verifiedTopic({ id: "CT-1", slug: "x", channel: "critical-thread" }), verifiedTopic({ id: "GLL-T3", slug: "y", researchStatus: "RESEARCHED", productionReady: false }), verifiedTopic()]);
  const q = Lane.qualified(ch);
  assert.deepEqual(q.ok.map((r) => r.topic.id), ["GLL-T1"]);
  const why = Object.fromEntries(q.refused.map((r) => [r.topic.id, r.why.join("; ")]));
  assert.match(why["GLL-T2"], /retired CriticalThread topic/); assert.match(why["CT-1"], /not a GoalLore Lab record/); assert.match(why["GLL-T3"], /not VERIFIED/);
});

test("without an approved premium package the lane renders one review candidate in preview mode and never uploads", () => {
  const ch = fakeChannel([verifiedTopic()]); const calls = [];
  const spawn = (bin, args, opts) => { calls.push({ args, env: opts.env }); const out = Lane.reviewDir(ch, { id: "GLL-T1" }); W(path.join(out, "review-package.json"), { verdict: "READY_FOR_HUMAN_REVIEW", qa: { objectivePass: true }, voice: { used: "en-GB-RyanNeural", approved: false } }); return { status: 0 }; };
  const code = Lane.runChannel("goal-lore-lab", [], { env: { PUBLISH: "0", CT_YT_REFRESH_TOKEN: "secret" }, spawn, log: quiet, channel: ch });
  assert.equal(code, 0); assert.equal(calls.length, 1);
  assert.ok(calls[0].args[0].endsWith("studio.js")); assert.ok(!calls.some((c) => c.args.some((a) => /youtube-yukle/.test(a))), "the uploader is never called");
  assert.equal(calls[0].env.BTO_PREMIUM_RENDER, "preview"); assert.equal(calls[0].env.PUBLISH, "0"); assert.equal(calls[0].env.CT_YT_REFRESH_TOKEN, undefined, "the render never sees credentials");
  assert.deepEqual(Lane.ledger(ch).map((r) => [r.topicId, r.uploaded, r.voiceApproved]), [["GLL-T1", false, false]]);
  // idempotent: a rendered topic is not rendered again; with nothing left the day is skipped, the bar is not lowered
  const again = []; Lane.runChannel("goal-lore-lab", [], { env: { PUBLISH: "0" }, spawn: (...a) => { again.push(a); return { status: 0 }; }, log: quiet, channel: ch });
  assert.equal(again.length, 0);
  const stages = JSON.parse(fs.readFileSync(path.join(ch.paths.state, "ops", "production-stages.json"), "utf8")).runs;
  assert.equal(stages[stages.length - 1].outcome, "NO_TOPIC");
});

test("only an owner-approved premium package reaches the uploader, and only with GLL_PREMIUM_PUBLISH=1", () => {
  assert.equal(Publish.enabled(Channel.getChannel("goal-lore-lab"), {}), false, "off by default");
  assert.equal(Publish.enabled(Channel.getChannel("goal-lore-lab"), { GLL_PREMIUM_PUBLISH: "1" }), true);
  assert.equal(Publish.enabled(Channel.getChannel("critical-thread"), { CT_PREMIUM_PUBLISH: "1", GLL_PREMIUM_PUBLISH: "1" }), false, "never for the retired channel");
  // the lane hands the due slot to premium-publish first; whatever it returns is the day's result
  const ch = fakeChannel([verifiedTopic()]); const calls = [];
  const premium = { run: () => ({ uploaded: true, topicId: "GLL-T1", slug: "test-goal", videoId: "VID1", exitCode: 0 }), reserved: () => new Set() };
  assert.equal(Lane.runChannel("goal-lore-lab", [], { env: { PUBLISH: "0" }, spawn: (...a) => { calls.push(a); return { status: 0 }; }, log: quiet, channel: ch, premium }), 0);
  assert.equal(calls.length, 0, "no review render on a publication day");
  // and the publish gate refuses while the registry entry is disabled
  const lifecycle = fs.readFileSync(path.join(ROOT, "scripts", "bto-studio", "publish-gate.js"), "utf8");
  assert.match(lifecycle, /publishingEnabled: channel\.entry \? channel\.entry\.enabled === true : false/);
});

test("workflow: one GoalLore Lab step, never scheduled unless GLL_ACTIVE=1, never forced to publish, no CriticalThread step", () => {
  const wf = fs.readFileSync(path.join(ROOT, ".github", "workflows", "portfolio-production.yml"), "utf8");
  assert.equal((wf.match(/--channel goal-lore-lab/g) || []).length, 1);
  const step = wf.slice(wf.indexOf("- name: GoalLore Lab Short (premium)"), wf.indexOf("node shorts-sira.js --channel goal-lore-lab"));
  assert.match(step, /vars\.GLL_ACTIVE == '1'/); assert.match(step, /PUBLISH: \$\{\{ vars\.GLL_PUBLISH == '1' && '1' \|\| '0' \}\}/);
  assert.doesNotMatch(wf, /--channel critical-thread/);
  assert.match(step, /GLL_PREMIUM_PUBLISH: \$\{\{ vars\.GLL_PREMIUM_PUBLISH == '1' && '1' \|\| 'off' \}\}/, "publishing needs the owner's repository variable");
  for (const f of fs.readdirSync(path.join(ROOT, ".github", "workflows"))) {
    const y = fs.readFileSync(path.join(ROOT, ".github", "workflows", f), "utf8");
    if (f !== "portfolio-production.yml") assert.doesNotMatch(y, /shorts-sira\.js --channel goal-lore-lab|youtube-yukle\.js[^\n]*goal-lore-lab/, `${f}: GoalLore Lab is produced from one lane only`);
  }
});

test("a CANDIDATE voice is never approved by code: Edge narration of an unapproved channel voice stays unpublishable", () => {
  const Adapter = require("../../scripts/bto-studio/adapter");
  const gll = Channel.getChannel("goal-lore-lab");
  assert.match(gll.config.voice.status, /^CANDIDATE/);
  assert.equal(Adapter.studioScript(gll, verifiedTopic()).voice.ownerApproved, false);
  for (const slug of ["failure-reconstructed", "impossible-brief", "behind-the-ordinary"]) assert.equal(Adapter.studioScript(Channel.getChannel(slug), verifiedTopic()).voice.ownerApproved, true, `${slug} keeps its approved voice`);
  const narrate = fs.readFileSync(path.join(ROOT, "scripts", "bto-studio", "narrate.js"), "utf8");
  assert.match(narrate, /approved: ownerApproved/); assert.match(narrate, /edge\(scriptFile, outDir, approved\.voice, script\.voice\.ownerApproved !== false\)/);
  // and the package/gate read that flag: unapproved -> PREVIEW_ONLY_UNAPPROVED_VOICE, the gate refuses the narration
  assert.match(fs.readFileSync(path.join(ROOT, "scripts", "bto-studio", "package.js"), "utf8"), /timeline\.approved !== true \? "PREVIEW_ONLY_UNAPPROVED_VOICE"/);
  const samples = require("../../scripts/gll-research/voice-samples");
  assert.throws(() => samples.sample("not a voice", "/tmp/x"), /not an Edge neural voice/);
});
