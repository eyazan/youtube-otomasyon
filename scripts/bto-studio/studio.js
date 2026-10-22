#!/usr/bin/env node
"use strict";
// BTO Premium Studio - one command from an existing researched topic to a review-ready premium Short.
//
//   BTO_PREMIUM_RENDER=preview node scripts/bto-studio/studio.js --channel behind-the-ordinary --topic BTO-301
//        [--quality preview|final] [--voice auto|edge|kokoro] [--workers N] [--only s4-anatomy,s5-why-squares]
//        [--stills 0.5,3,12] [--from-stage narrate|validate|render|audio|qa|package] [--draft] [--plan-with-claude]
//   npm run premium:video -- --channel behind-the-ordinary --topic BTO-301      (same, with the flag set in the env)
//
// Opt-in and offline: refuses to run unless BTO_PREMIUM_RENDER is "preview" or "final". It never uploads, never
// writes channel state, reports/packages or uretim/, and never edits the topic or its narration. Everything goes to
// channels/<channel>/premium/<topic>/ (storyboard, assets) and .../out/ (renders, reports).
//   preview: the approved Edge voice when reachable, else the repo's pinned Kokoro fallback (unapproved, marked)
//   final:   the approved voice only (no fallback)
// Stages are resumable: each records its inputs' hash in out/run-state.json and is skipped when unchanged.
const cp = require("child_process");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const Adapter = require("./adapter");
const Narrator = require("./narrate");
const Validator = require("./validate");
const Renderer = require("./render");
const Storyboard = require("./storyboard");

const ROOT = path.resolve(__dirname, "..", "..");
const args = process.argv.slice(2);
const opt = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const flag = (k) => args.includes(k);
const sha = (s) => crypto.createHash("sha256").update(typeof s === "string" ? s : JSON.stringify(s)).digest("hex").slice(0, 16);
const J = (f) => JSON.parse(fs.readFileSync(f, "utf8"));
const W = (f, o) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(o, null, 1) + "\n"); };

const STAGES = ["load", "storyboard", "narrate", "validate", "render", "audio", "qa", "package"];

async function main() {
  const mode = String(process.env.BTO_PREMIUM_RENDER || "").toLowerCase();
  if (!["preview", "final"].includes(mode)) { console.error("BTO Premium Studio is opt-in: set BTO_PREMIUM_RENDER=preview (or final). Nothing was run."); process.exit(2); }
  // --pilot <dir>: a creative pilot whose topic lives in <dir>/topic.json (not in any production topic universe), for a
  // channel that is not registered or not yet rendered by the studio. Preview only; every frame is stamped, the package
  // can never be publishable, and nothing reads or writes channel state, credentials or the registry.
  const pilotDir = opt("--pilot", null) ? path.resolve(ROOT, opt("--pilot")) : null;
  const pilotTopic = pilotDir ? J(path.join(pilotDir, "topic.json")) : null;
  if (pilotDir && mode !== "preview") throw new Error("--pilot is allowed only with BTO_PREMIUM_RENDER=preview");
  const channelSlug = pilotTopic ? pilotTopic.channel : opt("--channel", "behind-the-ordinary"); const topicRef = pilotTopic ? pilotTopic.id : opt("--topic");
  const profileFile = path.join(__dirname, "profiles", `${channelSlug}.json`);
  if (!fs.existsSync(profileFile)) throw new Error(`no premium channel profile for ${channelSlug} (profiles: ${fs.readdirSync(path.join(__dirname, "profiles")).map((f) => f.replace(/\.json$/, "")).join(", ")})`);
  const profile = J(profileFile);
  if (!profile.studioRenders && !pilotDir) { console.error(`${profile.name}: premium mode "${profile.premiumMode}" (rollout stage ${profile.rolloutStage}). ${profile.refusal}`); process.exit(3); }
  if (!topicRef) throw new Error("--topic <id|slug> is required");
  const quality = opt("--quality", "preview"); const voiceMode = opt("--voice", mode === "final" ? "edge" : "auto");
  if (mode === "final" && voiceMode !== "edge") throw new Error("BTO_PREMIUM_RENDER=final allows only the approved Edge voice");

  // ---- load ----------------------------------------------------------------------------------------------
  const { channel, topic } = pilotDir ? Adapter.loadPilot(channelSlug, pilotTopic) : Adapter.loadTopic(channelSlug, topicRef);
  // readiness is decided before anything is written: a refused run leaves no files behind
  const ready = pilotDir ? Adapter.pilotReadiness(topic) : Adapter.readiness(channel, topic);
  // --research-pending: an engine/creative pilot of a topic whose research is incomplete. Preview mode only; only the
  // "needs a primary source / not productionReady" gap is tolerated (never published, question-only or unquoted
  // topics); every frame is stamped and the package can never be publishable (the gate also blocks at TOPIC_READY).
  const pending = flag("--research-pending");
  const tolerated = (e) => /^researchStatus is NEEDS_PRIMARY_SOURCE, not VERIFIED$|^topic is not productionReady$/.test(e);
  if (pending && mode !== "preview") throw new Error("--research-pending is allowed only with BTO_PREMIUM_RENDER=preview");
  // --shadow: the live pipeline (core/pipeline/impossible-brief.js premiumShadow) renders the topic it has just produced a
  // second time for comparison. Preview mode only; only "this topic was already produced/uploaded by the live lane" is
  // tolerated, so the package is a duplicate by construction and can never be publishable (the gate blocks at TOPIC_READY).
  const shadow = flag("--shadow");
  if (shadow && mode !== "preview") throw new Error("--shadow is allowed only with BTO_PREMIUM_RENDER=preview");
  if (!ready.ready && !(pending && ready.errors.every(tolerated)) && !(shadow && Adapter.shadowTolerated(ready.errors))) throw new Error("topic is not ready for production: " + ready.errors.join("; "));
  const dir = pilotDir || path.join(channel.paths.base, "premium", topic.id);
  // --storyboard storyboard.v2.json: a versioned storyboard renders into out/v<N>/ (V1 stays in out/); narration is shared
  const sbFile = path.join(dir, opt("--storyboard", "storyboard.json"));
  const sbVersion = fs.existsSync(sbFile) ? (J(sbFile).version || 1) : 1;
  const out = sbVersion > 1 ? path.join(dir, "out", `v${sbVersion}`) : path.join(dir, "out"); fs.mkdirSync(out, { recursive: true });
  const logFile = path.join(out, "production.log"); const t00 = Date.now();
  const log = (s) => { const line = `[${new Date().toISOString()}] ${s}`; console.log(s); fs.appendFileSync(logFile, line + "\n"); };
  const stateFile = path.join(out, "run-state.json"); const state = fs.existsSync(stateFile) ? J(stateFile) : { stages: {} };
  const fromStage = opt("--from-stage", null); const fromIdx = fromStage ? STAGES.indexOf(fromStage) : -1;
  const fresh = (stage, hash) => !flag("--force") && (fromIdx < 0 || STAGES.indexOf(stage) < fromIdx) && state.stages[stage] && state.stages[stage].hash === hash && state.stages[stage].status === "done";
  const done = (stage, hash, extra = {}) => { state.stages[stage] = { status: "done", hash, at: new Date().toISOString(), ...extra }; W(stateFile, state); };
  log(`=== BTO Premium Studio: ${topic.id} ${topic.slug} | mode ${mode} | quality ${quality} | voice ${voiceMode} ===`);
  if (pending) log(`RESEARCH PENDING pilot: ${ready.errors.join("; ")}; never publishable`);
  if (shadow) log(`SHADOW of the live render${ready.errors.length ? ` (${ready.errors.join("; ")})` : ""}; never publishable`);
  if (pilotDir) log(`PILOT (${path.relative(ROOT, pilotDir)}): channel ${channelSlug} is not rendered in production (${profile.premiumMode}); NOT APPROVED FOR PUBLICATION`);
  ready.warnings.forEach((w) => log("readiness warning: " + w));
  const script = Adapter.studioScript(channel, topic); W(path.join(out, "studio-script.json"), script);
  const style = J(path.join(channel.paths.base, "premium", "style-pack.json"));
  done("load", script.sourceHash, { readiness: ready });

  // ---- storyboard (hand-directed file, or a deterministic draft, or an optional Claude draft) --------------------
  // channels with an automatic scene grammar (profile.storyboard.generator) get it when no directed storyboard exists
  // (or with --regenerate): routine daily production needs no hand-written storyboard and no model call.
  const generator = profile.storyboard && profile.storyboard.generator ? require(path.join(ROOT, profile.storyboard.generator)) : null;
  if (generator && (!fs.existsSync(sbFile) || flag("--regenerate"))) { W(sbFile, generator.build(script, style, topic)); log(`storyboard: generated by ${profile.storyboard.generator} -> ${path.relative(ROOT, sbFile)}`); }
  else if (flag("--draft") || flag("--plan-with-claude") || !fs.existsSync(sbFile)) {
    const target = fs.existsSync(sbFile) ? path.join(dir, "storyboard.draft.json") : sbFile;
    const draft = flag("--plan-with-claude") ? await Storyboard.claudeDraft(script, style, { ledger: path.join(out, "llm-usage.json"), log }) : Storyboard.autoDraft(script, style);
    W(target, draft); log(`storyboard: ${flag("--plan-with-claude") ? "Claude" : "deterministic"} draft written to ${path.relative(ROOT, target)}${target !== sbFile ? " (the directed storyboard.json is kept; review the draft before adopting it)" : ""}`);
  }
  const storyboard = J(sbFile);
  const assets = {}; const adir = path.join(dir, "assets"); if (fs.existsSync(adir)) for (const f of fs.readdirSync(adir).filter((x) => x.endsWith(".json"))) assets[f.replace(/\.json$/, "")] = J(path.join(adir, f));
  done("storyboard", sha(storyboard));

  // ---- narrate ------------------------------------------------------------------------------------------------
  const ndir = path.join(dir, "out", "narration"); const nHash = sha({ beats: script.beats, voiceMode, kv: opt("--kokoro-voice", "af_heart"), code: fs.readFileSync(path.join(__dirname, "narrate.js"), "utf8") });
  let timeline;
  const hashFile = path.join(ndir, "narration-hash.txt"); const sharedFresh = !flag("--force") && fs.existsSync(hashFile) && fs.readFileSync(hashFile, "utf8").trim() === nHash;
  if ((fresh("narrate", nHash) || sharedFresh) && fs.existsSync(path.join(ndir, "timeline.json"))) { timeline = J(path.join(ndir, "timeline.json")); log(`narration: cached (${timeline.voice}, ${timeline.duration} s)`); }
  else { const t0 = Date.now(); timeline = Narrator.narrate(script, ndir, { mode: voiceMode, preview: mode === "preview", kokoroVoice: opt("--kokoro-voice", "af_heart"), log }); fs.writeFileSync(hashFile, nHash + "\n"); done("narrate", nHash, { voice: timeline.voice, approved: timeline.approved, sec: (Date.now() - t0) / 1000 }); log(`narration: ${timeline.voice} ${timeline.duration} s (approved: ${timeline.approved}) in ${((Date.now() - t0) / 1000).toFixed(1)} s`); }
  const target = (channel.config.publishingCadence.shorts.targetDurationSeconds || [30, 50]);
  const duration = +(timeline.duration + (storyboard.tail || 0)).toFixed(3);
  if (duration < target[0] || duration > target[1]) log(`WARNING: duration ${duration} s is outside the channel's Shorts target ${target.join("-")} s`);

  // ---- validate -----------------------------------------------------------------------------------------------
  const v = Validator.validateStoryboard(storyboard, { script, timeline, style, pilot: !!pilotDir, policy: (profile.evidencePolicy && profile.evidencePolicy.validator) || Validator.DEFAULT_POLICY }); W(path.join(out, "validation.json"), v);
  v.warnings.forEach((w) => log("validate WARN: " + w)); v.errors.forEach((e) => log("validate ERROR: " + e));
  if (!v.ok) throw new Error(`storyboard failed validation (${v.errors.length} errors; see ${path.relative(ROOT, path.join(out, "validation.json"))})`);
  log(`validate: PASS (${storyboard.scenes.length} scenes, ${v.warnings.length} warnings)`);
  done("validate", sha({ storyboard, timeline: timeline.words }));

  // licensed real-world media (image-plate): verified against the channel asset registry; unreviewed media refuses to render
  const images = require("./asset-manager").prepare(channelSlug, storyboard, path.join(out, "work"), "preview");
  const data = { storyboard, timeline, style, assets, images, duration, targetDuration: target, watermark: pilotDir ? "PILOT · NOT APPROVED FOR PUBLICATION" : pending ? "RESEARCH PENDING · NOT FOR PUBLICATION" : storyboard.watermark || null };
  const work = path.join(out, "work");
  // quick inspection paths (no full render)
  if (opt("--stills", null)) { const r = await Renderer.render(data, { work, stills: opt("--stills").split(",").map(Number), log }); log(`stills: ${r.stills.length} -> ${path.relative(ROOT, path.dirname(r.stills[0]))}`); return; }

  // ---- render -------------------------------------------------------------------------------------------------
  const only = opt("--only", null) ? opt("--only").split(",") : null;
  const video = path.join(out, `video-${quality}.mp4`);
  const r = await Renderer.render(data, { work, out: video, quality, workers: opt("--workers", null) ? +opt("--workers") : undefined, only, log });
  W(path.join(out, "scenes.json"), r.meta);
  if (only) { log(`render: re-rendered ${only.join(", ")} only (run without --only to assemble)`); return; }
  log(`render: ${r.perf.framesRendered} frames rendered (${r.perf.cachedSegments}/${r.perf.segments} segments cached) in ${r.perf.wallSec} s, ${r.perf.msPerFrameWall} ms/frame wall, peak Chromium RSS ${r.perf.peakChromiumRssMb} MB`);
  done("render", sha(r.segments.map((s) => s.key)), { perf: { ...r.perf, stats: undefined } });

  // ---- audio --------------------------------------------------------------------------------------------------
  const adirOut = path.join(out, "audio"); fs.mkdirSync(adirOut, { recursive: true });
  const resolveCue = r.meta.audio.filter((c) => c.kind === "chime").map((c) => c.t).pop();
  W(path.join(adirOut, "cues.json"), { duration, cues: r.meta.audio, music: { level: 0.11, resolveAt: resolveCue || duration - 1.5 } });
  const t1 = Date.now(); const sd = cp.spawnSync("python3", ["-I", path.join(__dirname, "audio/sound_design.py"), path.join(adirOut, "cues.json"), path.join(adirOut, "sfx.wav")], { encoding: "utf8" });
  if (sd.status !== 0) throw new Error("sound design failed: " + sd.stderr.slice(-800)); log("sound design: " + sd.stdout.trim());
  const final = path.join(out, `${topic.slug}-premium-${quality}${sbVersion > 1 ? `-v${sbVersion}` : ""}.mp4`);
  const mx = cp.spawnSync(process.execPath, [path.join(ROOT, "scripts/fr-premium/mix-audio.js"), path.join(ndir, "narration.wav"), path.join(adirOut, "sfx.wav"), video, final, "--work", adirOut], { encoding: "utf8" });
  if (mx.status !== 0) throw new Error("mix failed: " + mx.stderr.slice(-800));
  const master = J(path.join(adirOut, "audio-master.json")); log(`audio: mastered ${master.final.I} LUFS, true peak ${master.final.truePeak} dBTP in ${((Date.now() - t1) / 1000).toFixed(1)} s -> ${path.relative(ROOT, final)}`);
  done("audio", sha({ v: r.segments.map((s) => s.key), cues: r.meta.audio }));

  // ---- qa -----------------------------------------------------------------------------------------------------
  const QA = require("./qa");
  const qa = await QA.run({ video: final, data, meta: r.meta, work, out, ndir, narration: path.join(ndir, "narration.wav"), timeline, style, assets, quality, log });
  done("qa", sha(qa.objective), { pass: qa.objectivePass });

  // ---- package ------------------------------------------------------------------------------------------------
  const pkg = require("./package").build({ channel, topic, script, storyboard, timeline, qa, perf: r.perf, master, final, out, quality, mode, researchPending: pending ? ready.errors : null, shadow, pilot: pilotDir ? path.relative(ROOT, pilotDir) : null, totalSec: (Date.now() - t00) / 1000 });
  done("package", sha(pkg)); log(`package: ${pkg.verdict} -> ${path.relative(ROOT, path.join(out, "review-package.json"))}`);
}

main().catch((e) => { console.error("STUDIO FAILED:", e.message); process.exit(1); });
