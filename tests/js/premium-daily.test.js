"use strict";
// Daily-run safety of the premium shadow (core/pipeline/premium-shadow.js): four channels share one runner, so a shadow
// never receives credentials, never renders the same topic twice, waits for a render slot, yields to low resources, and
// cleans up only what it wrote. The live lane is never affected.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const Channel = require("../../core/channel-context");
const Shadow = require("../../core/pipeline/premium-shadow");
const Slots = require("../../lib/slot-lock");

const ib = Channel.getChannel("impossible-brief");
const tmp = (p) => fs.mkdtempSync(path.join(os.tmpdir(), p));
const plenty = { freeMb: () => 8000, diskMb: () => 20000 };
const spawnOk = () => { const f = (bin, args, opts) => { f.calls.push({ bin, args, opts }); return { status: 0, stdout: "", stderr: "" }; }; f.calls = []; return f; };
const base = (extra = {}) => ({ IB_PREMIUM_RENDER: "preview", PREMIUM_RENDER_LOCK_DIR: tmp("slots-"), ...extra });

test("the studio child never receives credentials: tokens, secrets and keys are removed, the rest passes", () => {
  const spawn = spawnOk();
  Shadow.run(ib, { id: "IB-EAR-019", slug: "x" }, base({ IB_YT_REFRESH_TOKEN: "r", IB_YT_CLIENT_SECRET: "s", IB_YT_CLIENT_ID: "c", GITHUB_TOKEN: "g", PEXELS_KEY: "p",
    ANTHROPIC_API_KEY: "a", PATH: process.env.PATH, PD_CHROMIUM: "/usr/bin/chromium", EDGE_TTS_RETRY_BUDGET_S: "420" }), spawn, null, plenty);
  const env = spawn.calls[0].opts.env;
  for (const k of ["IB_YT_REFRESH_TOKEN", "IB_YT_CLIENT_SECRET", "IB_YT_CLIENT_ID", "GITHUB_TOKEN", "PEXELS_KEY", "ANTHROPIC_API_KEY"]) assert.equal(env[k], undefined, k);
  assert.equal(env.PD_CHROMIUM, "/usr/bin/chromium"); assert.equal(env.EDGE_TTS_RETRY_BUDGET_S, "420"); assert.equal(env.BTO_PREMIUM_RENDER, "preview");
});

test("idempotent: a topic whose shadow already passed objective QA is not rendered again (unless forced)", () => {
  const out = tmp("live-"); const spawn = spawnOk();
  fs.writeFileSync(path.join(out, "premium-shadow.json"), JSON.stringify({ topicId: "IB-EAR-019", premium: { objectivePass: true, verdict: "SHADOW_OF_LIVE_NOT_PUBLISHABLE" } }));
  const r = Shadow.run(ib, { id: "IB-EAR-019", slug: "x" }, base(), spawn, { output: out }, plenty);
  assert.equal(spawn.calls.length, 0); assert.match(r.skipped, /already rendered/); assert.equal(r.status, 0);
  assert.equal(JSON.parse(fs.readFileSync(path.join(out, "premium-shadow.json"), "utf8")).premium.objectivePass, true, "the passing report is kept");
  Shadow.run(ib, { id: "IB-EAR-019", slug: "x" }, base({ IB_PREMIUM_FORCE: "1" }), spawn, { output: out }, plenty);
  assert.equal(spawn.calls.length, 1);
  // a failed earlier shadow is retried
  fs.writeFileSync(path.join(out, "premium-shadow.json"), JSON.stringify({ topicId: "IB-EAR-019", premium: { objectivePass: false } }));
  Shadow.run(ib, { id: "IB-EAR-019", slug: "x" }, base(), spawn, { output: out }, plenty);
  assert.equal(spawn.calls.length, 2);
});

test("resource-aware: low memory or disk skips the shadow with the reason recorded", () => {
  const out = tmp("live-"); const spawn = spawnOk();
  const r = Shadow.run(ib, { id: "IB-EAR-019", slug: "x" }, base(), spawn, { output: out }, { freeMb: () => 900, diskMb: () => 20000 });
  assert.equal(spawn.calls.length, 0); assert.match(r.skipped, /free memory 900 MB < 2500 MB/);
  assert.match(JSON.parse(fs.readFileSync(path.join(out, "premium-shadow.json"), "utf8")).premium.status, /skipped \(insufficient resources/);
  assert.match(Shadow.run(ib, { id: "IB-EAR-019", slug: "x" }, base(), spawn, null, { freeMb: () => 8000, diskMb: () => 100 }).skipped, /free disk 100 MB < 1500 MB/);
});

test("bounded concurrency: with the only render slot held, the shadow waits, then skips instead of competing", () => {
  const env = base({ IB_PREMIUM_SLOT_WAIT_MS: "50" }); const dir = path.join(env.PREMIUM_RENDER_LOCK_DIR, "premium-render-slots");
  const held = Slots.tryAcquire(dir, 1); assert.ok(held);
  const spawn = spawnOk(); const r = Shadow.run(ib, { id: "IB-EAR-019", slug: "x" }, env, spawn, null, plenty);
  assert.equal(spawn.calls.length, 0); assert.match(r.skipped, /no premium render slot free/);
  Slots.release(held);
  Shadow.run(ib, { id: "IB-EAR-019", slug: "x" }, env, spawn, null, plenty); assert.equal(spawn.calls.length, 1);
  assert.deepEqual(fs.readdirSync(dir), [], "the slot is released after the render");
});

test("cleanup removes this render's intermediates only, and keeps the MP4 and reports", () => {
  const out = tmp("out-"); fs.mkdirSync(path.join(out, "work", "det"), { recursive: true }); fs.mkdirSync(path.join(out, "audio"));
  const old = path.join(out, "work", "old-scene.mp4"); fs.writeFileSync(old, Buffer.alloc(10)); const t = new Date(Date.now() - 3600e3); fs.utimesSync(old, t, t);
  const since = Date.now() - 1000;
  fs.writeFileSync(path.join(out, "work", "det", "frame.png"), Buffer.alloc(2 * 1048576)); fs.writeFileSync(path.join(out, "audio", "mix-master.wav"), Buffer.alloc(1048576));
  fs.writeFileSync(path.join(out, "audio", "cues.json"), "{}"); fs.writeFileSync(path.join(out, "x-premium-final.mp4"), Buffer.alloc(100)); fs.writeFileSync(path.join(out, "qa-report.json"), "{}");
  assert.equal(Shadow.cleanup(out, since), 3);
  assert.ok(fs.existsSync(old), "older material is never removed");
  assert.ok(!fs.existsSync(path.join(out, "work", "det")), "an emptied work folder is removed");
  for (const f of ["audio/cues.json", "x-premium-final.mp4", "qa-report.json"]) assert.ok(fs.existsSync(path.join(out, f)), f);
  assert.ok(!fs.existsSync(path.join(out, "audio", "mix-master.wav")));
});

test("the live workflows still do not enable any premium flag, and production installs packages through the cache", () => {
  const wf = fs.readFileSync(path.join(__dirname, "../../.github/workflows/portfolio-production.yml"), "utf8");
  // publishing flags appear only as a pass-through of the owner's repository variable, never as a literal "1"
  const passThrough = /^ +(IB|FR|HLT|GLL)_PREMIUM_PUBLISH: \$\{\{ vars\.\1_PREMIUM_PUBLISH == '1' && '1' \|\| 'off' \}\}$/gm;
  const rest = wf.replace(passThrough, "");
  for (const flag of ["IB_PREMIUM_RENDER", "FR_PREMIUM_RENDER", "HLT_PREMIUM_RENDER", "IB_PREMIUM_PUBLISH: ", "FR_PREMIUM_PUBLISH: ", "HLT_PREMIUM_PUBLISH: ", "GLL_PREMIUM_PUBLISH: "]) assert.ok(!rest.includes(flag), flag);
  assert.match(wf, /CI_APT_ARCHIVES="\$GITHUB_WORKSPACE\/\.cache\/apt" bash scripts\/ci-apt\.sh/);
  const ignore = fs.readFileSync(path.join(__dirname, "../../.gitignore"), "utf8"); assert.match(ignore, /^\/\.cache\/$/m, "caches are never committed by the production git add");
});
