"use strict";
const fs = require("fs");
const path = require("path");
const cp = require("child_process");
const Channel = require("../channel-context");

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
function run(channel, topic, env = process.env, spawn = cp.spawnSync, live = null) {
  const X = PREFIX[channel.slug]; if (!X) return null; const v = (k) => env[`${X}_PREMIUM_${k}`];
  const mode = String(v("RENDER") || "").toLowerCase();
  if (mode !== "preview") return null;
  const args = [path.join(Channel.ROOT, "scripts", "bto-studio", "studio.js"), "--channel", channel.slug, "--topic", topic.id, "--shadow", "--quality", v("QUALITY") === "final" ? "final" : "preview", "--kokoro-voice", ((channel.config.voice || {}).fallback || {}).voice || "am_fenrir"];
  const sdir = shadowDir(channel, topic); if (sdir) args.push("--shadow-dir", path.relative(Channel.ROOT, sdir));
  // GNU time reports the peak resident memory of the largest single process the studio waited for; the Chromium tree's
  // total (PSS) comes from the studio's own sampler (performance.peakChromiumRssMb)
  const timed = v("MEASURE") !== "0" && fs.existsSync(TIME_BIN);
  const started = Date.now();
  try {
    const child = timed
      ? spawn(TIME_BIN, ["-f", "IB_SHADOW_MAXRSS_KB=%M", process.execPath, ...args], { cwd: Channel.ROOT, env: { ...env, BTO_PREMIUM_RENDER: "preview" }, encoding: "utf8", timeout: Number(v("TIMEOUT_MS") || 1500000), maxBuffer: 1 << 26 })
      : spawn(process.execPath, args, { cwd: Channel.ROOT, env: { ...env, BTO_PREMIUM_RENDER: "preview" }, encoding: "utf8", timeout: Number(v("TIMEOUT_MS") || 1500000), maxBuffer: 1 << 26 });
    const sec = Math.round((Date.now() - started) / 1000);
    const rss = /IB_SHADOW_MAXRSS_KB=(\d+)/.exec(String(child.stderr || ""));
    const peakMemoryMB = rss ? Math.round(Number(rss[1]) / 1024) : null;
    const out = path.join(sdir || path.join(channel.paths.base, "premium", topic.id), "out");
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
    if (live && live.output) { try { fs.writeFileSync(path.join(live.output, "premium-shadow.json"), JSON.stringify(report, null, 2) + "\n"); } catch (error) {} }
    return { status: child.status, verdict, sec, peakMemoryMB, report };
  } catch (error) {
    console.log(`[${channel.name}] premium shadow could not start: ${error.message}; live production unaffected`);
    return null;
  }
}

module.exports = { run, PREFIX, shadowDir };
