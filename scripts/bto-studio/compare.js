#!/usr/bin/env node
"use strict";
// Engine comparison for one topic: A = the existing production renderer (core/rendering buildPackage, the path
// e2e-behind-the-ordinary.js and bto-publish-short.js use), B = this studio's latest render.
//   BTO_PREMIUM_RENDER=preview node scripts/bto-studio/compare.js --topic BTO-301 [--skip-a]
// Engine A runs exactly as in a dry run (recordState: false, never uploads) but writes to
// premium/<topic>/out/compare/engine-a instead of reports/dry-runs. When Edge is unreachable, it is given the same
// preview-only Kokoro fallback (in memory, PUBLISH=0, SHORTS_TTS_FALLBACK=preview); config files are not touched.
// Measures wall time, peak RSS of the process tree, and runs the same objective QA on both, then writes a
// side-by-side MP4 and contact sheet.
const cp = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..");
const args = process.argv.slice(2); const opt = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);

function rssTree(pid) { try { const rows = cp.execFileSync("ps", ["-A", "-o", "pid=,ppid=,rss="], { encoding: "utf8" }).trim().split("\n").map((l) => l.trim().split(/\s+/).map(Number));
  const kids = new Map(); rows.forEach(([p, pp]) => { if (!kids.has(pp)) kids.set(pp, []); kids.get(pp).push(p); }); const rss = new Map(rows.map(([p, , r]) => [p, r]));
  let s = 0; const st = [pid]; while (st.length) { const x = st.pop(); s += rss.get(x) || 0; (kids.get(x) || []).forEach((k) => st.push(k)); } return s / 1024; } catch (e) { return 0; } }

function engineA(topicRef, outDir) {
  // child process so its memory and time are measured alone
  const code = `
    process.env.PUBLISH = "0"; process.env.SHORTS_TTS_FALLBACK = process.env.SHORTS_TTS_FALLBACK || "preview";
    const Channel = require("./core/channel-context"); const Growth = require("./core/growth"); const Rendering = require("./core/rendering"); const Scripting = require("./core/scripting"); const Discovery = require("./core/discovery");
    const channel = Channel.getChannel("behind-the-ordinary");
    // preview-only fallback voice, in memory (config.json is not modified); same Kokoro voice as the studio preview
    channel.config.voice.fallback = channel.config.voice.fallback || { provider: "kokoro", voice: "af_heart", speed: 1, approved: false };
    const topic = Discovery.universe(channel).topics.find((t) => t.id === ${JSON.stringify(topicRef)} || t.slug === ${JSON.stringify(topicRef)});
    const plan = Growth.planShort(channel, topic.id, { legacyTitles: Scripting.titleCandidates(topic), skipDuplicate: true, disclosureEnabled: true });
    const r = Rendering.buildPackage(topic, channel, ${JSON.stringify(outDir)}, { render: true, growthPlan: plan, recordState: false });
    console.log("RESULT " + JSON.stringify({ validations: r.validations, video: (r.render || {}).video || null }));`;
  const t0 = Date.now(); const child = cp.spawn(process.execPath, ["-e", code], { cwd: ROOT, env: process.env }); let out = "", err = ""; let peak = 0;
  const timer = setInterval(() => { peak = Math.max(peak, rssTree(child.pid)); }, 500);
  child.stdout.on("data", (d) => { out += d; }); child.stderr.on("data", (d) => { err += d; });
  return new Promise((ok) => child.on("close", (c) => { clearInterval(timer); ok({ status: c, wallSec: +((Date.now() - t0) / 1000).toFixed(1), peakRssMb: Math.round(peak), stdout: out.slice(-4000), stderr: err.slice(-4000) }); }));
}

async function main() {
  if (!["preview", "final"].includes(String(process.env.BTO_PREMIUM_RENDER || ""))) { console.error("set BTO_PREMIUM_RENDER=preview"); process.exit(2); }
  const topicRef = opt("--topic", "BTO-301"); const Adapter = require("./adapter"); const { channel, topic } = Adapter.loadTopic("behind-the-ordinary", topicRef);
  const out = path.join(channel.paths.base, "premium", topic.id, "out"); const cmp = path.join(out, "compare"); const aDir = path.join(cmp, "engine-a"); fs.mkdirSync(aDir, { recursive: true });
  let a = fs.existsSync(path.join(cmp, "engine-a-run.json")) && args.includes("--skip-a") ? JSON.parse(fs.readFileSync(path.join(cmp, "engine-a-run.json"), "utf8")) : null;
  if (!a) { console.log("engine A (existing renderer): rendering ..."); a = await engineA(topic.id, aDir); fs.writeFileSync(path.join(cmp, "engine-a-run.json"), JSON.stringify(a, null, 1) + "\n"); }
  const aVideo = fs.readdirSync(aDir).filter((f) => f.endsWith(".mp4") && !f.startsWith("explainer")).map((f) => path.join(aDir, f))[0];
  if (!aVideo) throw new Error("engine A produced no MP4: " + a.stderr.slice(-600));
  const bVideo = [path.join(out, `${topic.slug}-premium-final.mp4`), path.join(out, `${topic.slug}-premium-preview.mp4`)].find((f) => fs.existsSync(f));
  const bPkg = JSON.parse(fs.readFileSync(path.join(out, "review-package.json"), "utf8"));
  const { qa } = require("../fr-premium/qa-vertical");
  const qA = qa(aVideo), qB = qa(bVideo);
  const probe = (f) => JSON.parse(cp.execFileSync("ffprobe", ["-v", "error", "-print_format", "json", "-show_streams", "-show_format", f], { encoding: "utf8" }));
  // shot structure of A (render.json) and B (scenes.json)
  const aRender = fs.existsSync(path.join(aDir, "render.json")) ? JSON.parse(fs.readFileSync(path.join(aDir, "render.json"), "utf8")) : {};
  const bScenes = JSON.parse(fs.readFileSync(path.join(out, "scenes.json"), "utf8"));
  // side by side at 540x960 each (B left: premium studio, A right: existing), with A's own audio dropped for B's
  const sbs = path.join(cmp, "side-by-side.mp4");
  cp.execFileSync("ffmpeg", ["-v", "error", "-y", "-i", bVideo, "-i", aVideo, "-filter_complex",
    "[0:v]scale=540:960,drawtext=text='B  premium studio':x=16:y=16:fontsize=26:fontcolor=white:box=1:boxcolor=black@0.6[b];[1:v]scale=540:960,drawtext=text='A  existing renderer':x=16:y=16:fontsize=26:fontcolor=white:box=1:boxcolor=black@0.6[a];[b][a]hstack=inputs=2[v]",
    "-map", "[v]", "-map", "0:a?", "-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-c:a", "aac", "-b:a", "160k", "-shortest", sbs]);
  const sheet = path.join(cmp, "side-by-side-sheet.png");
  cp.execFileSync("ffmpeg", ["-v", "error", "-y", "-i", sbs, "-vf", "fps=1/2,scale=540:480,tile=4x4:padding=6:color=0x222222", "-frames:v", "1", sheet]);
  const row = (q) => ({ durationSec: q.durationSec, video: q.video, loudness: q.loudness, motion: q.motion, black: q.black.length, freezes: q.freezes.length, hardPass: q.pass });
  const report = { topic: topic.id, measuredAt: new Date().toISOString(), host: `${os.platform()} ${os.arch()} ${os.cpus().length} cpu`,
    A: { engine: "core/rendering buildPackage (FFmpeg filtergraph + Pillow explainer clips + licensed stills)", video: path.relative(ROOT, aVideo), run: { status: a.status, wallSec: a.wallSec, peakRssMb: a.peakRssMb }, qa: row(qA), shots: (aRender.video || {}).shotTypes || null, distinctVisuals: (aRender.video || {}).distinctVisuals || null },
    B: { engine: "scripts/bto-studio (deterministic Chromium SVG motion, scene-cached)", video: path.relative(ROOT, bVideo), run: { wallSec: bPkg.performance.renderWallSec, msPerFrame: bPkg.performance.msPerFrame, peakRssMb: bPkg.performance.peakChromiumRssMb, workers: bPkg.performance.workers, totalPipelineSec: bPkg.performance.totalPipelineSec }, qa: row(qB), scenes: bScenes.scenes.map((s) => ({ id: s.id, transition: s.transition.type, components: s.components })) },
    sideBySide: path.relative(ROOT, sbs), sheet: path.relative(ROOT, sheet), streamsA: probe(aVideo).streams.map((s) => `${s.codec_type}:${s.codec_name} ${s.width || ""}x${s.height || ""}`), streamsB: probe(bVideo).streams.map((s) => `${s.codec_type}:${s.codec_name} ${s.width || ""}x${s.height || ""}`) };
  fs.writeFileSync(path.join(cmp, "comparison.json"), JSON.stringify(report, null, 1) + "\n");
  console.log(JSON.stringify({ A: report.A.run, B: report.B.run, Aqa: report.A.qa.motion, Bqa: report.B.qa.motion, sbs: report.sideBySide }, null, 1));
}
main().catch((e) => { console.error("COMPARE FAILED:", e.message); process.exit(1); });
