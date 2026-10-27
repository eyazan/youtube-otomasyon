"use strict";
// CriticalThread was retired on 2026-10-27: the YouTube channel behind its CT_* credentials was renamed GoalLore Lab by
// the owner and its CriticalThread videos were deleted. Nothing may upload, edit, comment or schedule in CriticalThread's
// name again, from any entry point (scheduled, manual, recovery, retry, long-form, one-off replacement). Its state,
// ledgers and read-only analytics stay as history. These tests fail closed on every path.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const cp = require("child_process");
const Channel = require("../../core/channel-context");
const yt = require("../../lib/yt");

const ROOT = path.resolve(__dirname, "..", "..");
const WF = path.join(ROOT, ".github", "workflows");
const workflows = () => fs.readdirSync(WF).filter((f) => /\.ya?ml$/.test(f)).map((f) => [f, fs.readFileSync(path.join(WF, f), "utf8")]);
// a child without any YouTube credential, so even a missed guard could not reach the API
const bareEnv = () => Object.fromEntries(Object.entries(process.env).filter(([k]) => !/(_YT_|^YT_|CLIENT_ID|CLIENT_SECRET|REFRESH)/.test(k)));
const run = (args) => cp.spawnSync(process.execPath, args, { cwd: ROOT, env: { ...bareEnv(), PUBLISH: "1", QUOTA_LEDGER: "0" }, encoding: "utf8", timeout: 60000 });

test("registry: CriticalThread is retired and inactive, its history is kept, GoalLore Lab is the successor", () => {
  const ct = Channel.getChannel("critical-thread");
  assert.equal(ct.entry.enabled, false);
  assert.deepEqual({ since: ct.retired.since, successor: ct.retired.successor }, { since: "2026-10-27", successor: "goal-lore-lab" });
  assert.ok(!Channel.activeSlugs().includes("critical-thread"), "no portfolio-wide loop picks it up");
  assert.ok(fs.existsSync(path.join(ct.paths.state, "published.json")), "the publication ledger is preserved as history");
  for (const slug of ["failure-reconstructed", "impossible-brief"]) assert.equal(Channel.getChannel(slug).retired, null, `${slug} stays live`);
});

test("scheduled jobs: no workflow produces, uploads, recovers or comments for CriticalThread", () => {
  const producing = /(shorts-sira|youtube-yukle|seed-comment|yorum-yanitla|live-replace-validated-shorts)\.js[^\n]*--channel critical-thread|growth\.js longform --channel critical-thread/;
  for (const [file, yml] of workflows()) {
    assert.doesNotMatch(yml, producing, `${file} still runs a CriticalThread production/write step`);
    for (const loop of yml.match(/for CHANNEL in [^;\n]*/g) || []) {
      const body = yml.slice(yml.indexOf(loop), yml.indexOf("done", yml.indexOf(loop)));
      if (/shorts-sira|youtube-yukle|longform|seed-comment|yorum-yanitla/.test(body)) assert.doesNotMatch(loop, /critical-thread/, `${file}: ${loop}`);
    }
  }
  const portfolio = fs.readFileSync(path.join(WF, "portfolio-production.yml"), "utf8");
  assert.doesNotMatch(portfolio, /vars\.CT_PUBLISH/, "no scheduled PUBLISH=1 lane for CriticalThread");
  assert.match(portfolio, /node shorts-sira\.js --channel failure-reconstructed/, "FR schedule unchanged");
  assert.match(portfolio, /node shorts-sira\.js --channel impossible-brief/, "IB schedule unchanged");
});

test("manual jobs: critical-thread is not a dispatch option, and the uploader refuses it even when called directly", () => {
  const portfolio = fs.readFileSync(path.join(WF, "portfolio-production.yml"), "utf8");
  const options = portfolio.match(/options: \[([^\]]*)\]/)[1];
  assert.doesNotMatch(options, /critical-thread/);
  for (const args of [["--channel", "critical-thread", "any-topic"], ["--channel", "critical-thread", "any-topic", "--dogrula"], ["--channel", "critical-thread", "any-topic", "--herkese-acik"]]) {
    const r = run(["youtube-yukle.js", ...args]);
    assert.notEqual(r.status, 0, args.join(" "));
    assert.match(r.stdout + r.stderr, /retired since 2026-10-27.*Upload\/write blocked/s, args.join(" "));
  }
});

test("recovery and retry jobs: the lanes produce nothing for CriticalThread and every YouTube write is refused", async () => {
  const ct = Channel.getChannel("critical-thread");
  const before = fs.readdirSync(ct.paths.state).map((f) => [f, fs.statSync(path.join(ct.paths.state, f)).mtimeMs]);
  const lane = run(["shorts-sira.js", "--channel", "critical-thread"]);
  assert.equal(lane.status, 0); assert.match(lane.stdout, /retired since 2026-10-27; no content produced/);
  const explicit = run(["shorts-sira.js", "--channel", "critical-thread", "some-old-topic"]);
  assert.equal(explicit.status, 0, "naming an old CriticalThread topic does not produce it either"); assert.match(explicit.stdout, /no content produced/);
  const longform = run(["growth.js", "longform", "--channel", "critical-thread", "--force"]);
  assert.equal(longform.status, 0); assert.match(longform.stdout, /retired since 2026-10-27; long-form not run/);
  const after = fs.readdirSync(ct.paths.state).map((f) => [f, fs.statSync(path.join(ct.paths.state, f)).mtimeMs]);
  assert.deepEqual(after, before, "CriticalThread state is untouched");
  assert.equal(require("../../core/pipeline/impossible-brief").runChannel("critical-thread", []), 0);

  // lib/yt.js write guard (metadata edits, comments, privacy changes, replacements): refused before any request
  const calls = [];
  const fake = async (opt) => { calls.push(opt); return { durum: 200, govde: "{\"items\":[]}" }; };
  const api = yt.istemci({ erisim: "test", kapsam: "" }, fake, ct);
  await assert.rejects(api.put("videos?part=status", { id: "x" }), (e) => e.code === "CHANNEL_RETIRED");
  await assert.rejects(api.post("commentThreads?part=snippet", {}), (e) => e.code === "CHANNEL_RETIRED");
  assert.equal(calls.length, 0, "no write reached the network");
  assert.equal((await api.data("channels?part=id&mine=true")).ok, true, "read-only analytics keep working for the history");
  // a live channel's writes are unaffected
  const fr = yt.istemci({ erisim: "test", kapsam: "" }, fake, Channel.getChannel("failure-reconstructed"));
  assert.equal((await fr.put("videos?part=status", { id: "x" })).ok, true);
});

test("the one-off replacement and long-form uploaders go through the guarded uploader", () => {
  const replace = fs.readFileSync(path.join(ROOT, "scripts", "live-replace-validated-shorts.js"), "utf8");
  assert.match(replace, /youtube-yukle\.js/); assert.match(replace, /client\.api\.put\(/);
  assert.match(fs.readFileSync(path.join(ROOT, "core", "growth", "lane.js"), "utf8"), /"youtube-yukle\.js", "--channel", channel\.slug/);
  const uploader = fs.readFileSync(path.join(ROOT, "youtube-yukle.js"), "utf8");
  assert.ok(uploader.indexOf("Channel.assertWritable(CHANNEL)") < uploader.indexOf("const argv = SELECTED.argv;"), "checked before any argument handling");
  assert.match(uploader, /async function yuklemeOturumu[^]*?Channel\.assertWritable\(CHANNEL\)/, "and again before the resumable upload session");
});

test("the 30-day portfolio model publishes nothing for the retired channel and still passes on the others", () => {
  const Simulation = require("../../core/simulation/two-channel");
  const r = Simulation.simulate30Days({ retired: ["critical-thread"] });
  assert.equal(r.pass, true, JSON.stringify(Object.entries(r.checks).filter(([, v]) => !v)));
  assert.deepEqual([r.channels["critical-thread"].shorts, r.channels["critical-thread"].longForm], [0, 0]);
  assert.equal(r.channels["failure-reconstructed"].shorts, 30); assert.equal(r.channels["impossible-brief"].shorts, 30);
  assert.ok(!r.events.some((e) => e.channel === "critical-thread" && e.status === "published"));
});
