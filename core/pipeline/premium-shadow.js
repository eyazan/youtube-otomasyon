"use strict";
const fs = require("fs");
const os = require("os");
const path = require("path");
const cp = require("child_process");
const Channel = require("../channel-context");
const Slots = require("../../lib/slot-lock");

// Premium studio shadow (feature flag per channel, default OFF). <PREFIX>_PREMIUM_RENDER=preview (IB_PREMIUM_RENDER,
// FR_PREMIUM_RENDER, HLT_PREMIUM_RENDER for The Hidden Logic of Things: BTO_PREMIUM_RENDER is the studio's own opt-in, so
// it cannot double as the lane flag) renders the topic the live lane has just
// produced a second time with the shared premium studio (scripts/bto-studio/studio.js --shadow: auto storyboard from the
// researched record, approved Edge voice or a marked Kokoro preview, QA, review package) into
// channels/<slug>/premium/<id>/out/ (git-ignored: production commits never carry it). It runs only after the live render, QA and upload have finished, in a child
// process with a timeout, and its outcome is only logged and written next to the live package (premium-shadow.json, a
// side-by-side of both renderers with runtime and peak memory): it never uploads, never changes the live render, upload
// or the topic's state, and its package is a duplicate by construction (SHADOW_OF_LIVE_NOT_PUBLISHABLE; the publish
// gate blocks it at TOPIC_READY). Publishing a premium Short is a separate owner go-live switch that does not exist yet.
const TIME_BIN = "/usr/bin/time";
const PREFIX = { "impossible-brief": "IB", "failure-reconstructed": "FR", "behind-the-ordinary": "HLT" };
// channels whose premium/<topic>/ folders hold tracked, directed pilots render the shadow into a separate git-ignored folder
// (premium/shadow/<topic>/, automatic storyboard, the topic's prepared assets): the pilot's storyboard and evidence stay untouched
const SEPARATE_DIR = new Set(["behind-the-ordinary"]);
const shadowDir = (channel, topic) => (SEPARATE_DIR.has(channel.slug) ? path.join(channel.paths.base, "premium", "shadow", topic.id) : null);
const outDir = (channel, topic) => path.join(shadowDir(channel, topic) || path.join(channel.paths.base, "premium", topic.id), "out");

// Daily-run safety (four channels share one runner, one after another; a shadow must never cost the live lane):
//   - the studio child gets no credentials: it needs none (Edge narration is keyless), so a YouTube token or API key
//     can never reach its logs
//   - a shadow already rendered and objectively passed for this topic is not rendered again (hourly retries, re-runs)
//   - it starts only with enough free memory and disk, and holds one of PREMIUM_RENDER_MAX_CONCURRENCY render slots
//     (default 1) on the machine; otherwise it is skipped with the reason recorded
//   - heavy intermediates (scene work files, uncompressed audio mixes) are removed afterwards; the MP4, QA reports and
//     sheets stay in the git-ignored output folder
const SECRET = /(TOKEN|SECRET|PASSWORD|PASSPHRASE|REFRESH|CLIENT_ID|CREDENTIAL|COOKIE|PRIVATE|API_KEY|_KEY$|^KEY$)/i;
function childEnv(env) {
  const out = {}; for (const [k, val] of Object.entries(env)) if (!SECRET.test(k)) out[k] = val;
  return { ...out, BTO_PREMIUM_RENDER: "preview" };
}
function resources(channel, v, probe = { freeMb: () => os.freemem() / 1048576, diskMb: (dir) => { const st = fs.statfsSync(dir); return (st.bavail * st.bsize) / 1048576; } }) {
  const needMem = Number(v("MIN_FREE_MB") || 2500), needDisk = Number(v("MIN_DISK_MB") || 1500);
  const freeMb = Math.round(probe.freeMb()); let diskMb = null;
  try { diskMb = Math.round(probe.diskMb(channel.paths.base)); } catch (error) { diskMb = null; }
  const short = [];
  if (freeMb < needMem) short.push(`free memory ${freeMb} MB < ${needMem} MB`);
  if (diskMb != null && diskMb < needDisk) short.push(`free disk ${diskMb} MB < ${needDisk} MB`);
  return { ok: short.length === 0, freeMb, diskMb, short };
}
function previous(live, topic) {
  try { const r = JSON.parse(fs.readFileSync(path.join(live.output, "premium-shadow.json"), "utf8")); return r.topicId === topic.id && r.premium && r.premium.objectivePass === true ? r : null; } catch (error) { return null; }
}
// removes only files this render wrote (modified at or after `since`): never older material in the output folder
function cleanup(out, since) {
  let freed = 0;
  const sweep = (d, keep) => { let left = 0;
    try { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const f = path.join(d, e.name);
      if (e.isDirectory()) { if (sweep(f, keep) === 0) { try { fs.rmdirSync(f); } catch (error) {} } else left += 1; continue; }
      const st = fs.statSync(f); if (!keep(f) && st.mtimeMs >= since) { fs.rmSync(f, { force: true }); freed += st.size; } else left += 1; } } catch (error) {}
    return left; };
  sweep(path.join(out, "work"), () => false);
  try { for (const f of fs.readdirSync(path.join(out, "audio")).filter((x) => x.endsWith(".wav"))) { const st = fs.statSync(path.join(out, "audio", f)); if (st.mtimeMs >= since) { fs.rmSync(path.join(out, "audio", f), { force: true }); freed += st.size; } } } catch (error) {}
  return Math.round(freed / 1048576);
}
function skipped(channel, topic, live, reason, extra = {}) {
  console.log(`[${channel.name}] premium shadow skipped for ${topic.slug}: ${reason}; live production unaffected`);
  const report = { schema: "ib-premium-shadow/1", topicId: topic.id, slug: topic.slug, measuredAt: new Date().toISOString(), live: live ? { decision: live.decision || null, upload: live.upload || null } : null,
    premium: { renderer: "premium studio (scripts/bto-studio)", status: `skipped (${reason})`, verdict: null, objectivePass: null, uploaded: false, ...extra } };
  if (live && live.output && !extra.reused) { try { fs.writeFileSync(path.join(live.output, "premium-shadow.json"), JSON.stringify(report, null, 2) + "\n"); } catch (error) {} }
  return { status: null, skipped: reason, verdict: null, report };
}

function run(channel, topic, env = process.env, spawn = cp.spawnSync, live = null, probe = undefined) {
  const X = PREFIX[channel.slug]; if (!X) return null; const v = (k) => env[`${X}_PREMIUM_${k}`];
  const mode = String(v("RENDER") || "").toLowerCase();
  if (mode !== "preview") return null;
  if (live && live.output && v("FORCE") !== "1") { const prior = previous(live, topic); if (prior) return { ...skipped(channel, topic, live, "already rendered and objectively passed for this topic", { reused: true }), report: prior, status: 0, verdict: prior.premium.verdict }; }
  const res = resources(channel, v, probe);
  if (!res.ok) return skipped(channel, topic, live, `insufficient resources: ${res.short.join(", ")}`, { freeMb: res.freeMb, diskMb: res.diskMb });
  const slot = Slots.acquireSync(path.join(env.PREMIUM_RENDER_LOCK_DIR || os.tmpdir(), "premium-render-slots"), Math.max(1, Number(env.PREMIUM_RENDER_MAX_CONCURRENCY) || 1),
    { waitMs: Number(v("SLOT_WAIT_MS") || 600000) });
  if (!slot) return skipped(channel, topic, live, "no premium render slot free (another premium render is running on this machine)");
  try { return render(channel, topic, env, spawn, live, mode, v); } finally { Slots.release(slot); }
}

function render(channel, topic, env, spawn, live, mode, v) {
  const args = [path.join(Channel.ROOT, "scripts", "bto-studio", "studio.js"), "--channel", channel.slug, "--topic", topic.id, "--shadow", "--quality", v("QUALITY") === "final" ? "final" : "preview", "--kokoro-voice", ((channel.config.voice || {}).fallback || {}).voice || "am_fenrir"];
  const sdir = shadowDir(channel, topic); if (sdir) args.push("--shadow-dir", path.relative(Channel.ROOT, sdir));
  // GNU time reports the peak resident memory of the largest single process the studio waited for; the Chromium tree's
  // total (PSS) comes from the studio's own sampler (performance.peakChromiumRssMb)
  const timed = v("MEASURE") !== "0" && fs.existsSync(TIME_BIN);
  const started = Date.now();
  try {
    const child = timed
      ? spawn(TIME_BIN, ["-f", "IB_SHADOW_MAXRSS_KB=%M", process.execPath, ...args], { cwd: Channel.ROOT, env: childEnv(env), encoding: "utf8", timeout: Number(v("TIMEOUT_MS") || 1500000), maxBuffer: 1 << 26 })
      : spawn(process.execPath, args, { cwd: Channel.ROOT, env: childEnv(env), encoding: "utf8", timeout: Number(v("TIMEOUT_MS") || 1500000), maxBuffer: 1 << 26 });
    const sec = Math.round((Date.now() - started) / 1000);
    const rss = /IB_SHADOW_MAXRSS_KB=(\d+)/.exec(String(child.stderr || ""));
    const peakMemoryMB = rss ? Math.round(Number(rss[1]) / 1024) : null;
    const out = outDir(channel, topic);
    const read = (name) => { try { return JSON.parse(fs.readFileSync(path.join(out, name), "utf8")); } catch (error) { return null; } };
    const pkg = read("review-package.json") || {}; const qa = read("qa-report.json") || {};
    const verdict = pkg.verdict || null;
    const status = child.error ? `did not finish (${child.error.code || child.error.message})` : `exit ${child.status}`;
    console.log(`[${channel.name}] premium shadow (${mode}) ${topic.slug}: ${status} in ${sec} s${peakMemoryMB ? `, peak ${peakMemoryMB} MB` : ""}, package ${verdict || "none"}; live production unaffected`);
    if (child.status !== 0) console.log(String(child.stderr || child.stdout || "").replace(/IB_SHADOW_MAXRSS_KB=\d+/, "").trim().split("\n").slice(-6).join("\n"));
    const report = {
      schema: "ib-premium-shadow/1", topicId: topic.id, slug: topic.slug, measuredAt: new Date().toISOString(),
      live: live ? { renderer: live.renderer || "stock (core/rendering)", decision: live.decision || null, productionScore: live.score ?? null, validationsPassed: live.validationsPassed ?? null,
        durationSeconds: live.durationSeconds ?? null, resolution: live.resolution || null, voice: live.voice || null, renderSec: live.renderSec ?? null, upload: live.upload || null } : null,
      premium: { renderer: "premium studio (scripts/bto-studio)", status, verdict, objectivePass: qa.objectivePass ?? null,
        hardFailures: (qa.objective || []).filter((c) => c.hard && !c.ok).map((c) => c.name), loudness: (qa.technical || {}).loudness || null,
        durationSeconds: parseFloat(((qa.objective || []).find((c) => /^duration/.test(c.name)) || {}).measured) || null,
        voice: pkg.voice ? { used: pkg.voice.used, approved: pkg.voice.approved === true } : null, quality: v("QUALITY") === "final" ? "final" : "preview",
        runtimeSec: sec, peakMemoryMB, renderWallSec: (pkg.performance || {}).renderWallSec ?? null, peakChromiumRssMb: (pkg.performance || {}).peakChromiumRssMb ?? null, uploaded: false },
    };
    if (v("KEEP_WORK") !== "1") { const freed = cleanup(out, started); report.premium.cleanedMb = freed; if (freed) console.log(`[${channel.name}] premium shadow: removed ${freed} MB of intermediates (MP4 and QA reports kept)`); }
    if (live && live.output) { try { fs.writeFileSync(path.join(live.output, "premium-shadow.json"), JSON.stringify(report, null, 2) + "\n"); } catch (error) {} }
    return { status: child.status, verdict, sec, peakMemoryMB, report };
  } catch (error) {
    console.log(`[${channel.name}] premium shadow could not start: ${error.message}; live production unaffected`);
    return null;
  }
}

module.exports = { run, PREFIX, shadowDir, outDir, childEnv, resources, cleanup };
