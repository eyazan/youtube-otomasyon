"use strict";
// BTO Premium Studio visual QA. Objective, measured checks only; subjective creative notes are written by the
// video-quality-review skill (a human or Claude looking at the contact sheets) into the revision history.
//   1. technical: scripts/fr-premium/qa-vertical.js (black frames, freezes, loudness, clipping, A/V, loop, caption sync),
//      with resolution and duration targets adapted to this quality and the channel's Shorts target
//   2. text: page text inspection every 0.25 s -> scripts/fr-premium/text-qa.js (collisions, caption band, edges, size)
//   3. motion per scene (static share, longest static run) and repetition between scenes (thumbnail correlation)
//   4. the on-screen QR symbol decodes (zxing-cpp) on the first and last frames
//   5. determinism: the same frame rendered on two fresh pages is byte-identical
//   6. contact sheets: one frame per second, and one sheet of scene key frames
const cp = require("child_process");
const fs = require("fs");
const path = require("path");
const { qa: technicalQa } = require("../fr-premium/qa-vertical");
const Renderer = require("./render");

const ROOT = path.resolve(__dirname, "..", "..");

function grayFrames(video, w, h, fps = 30) {
  const raw = cp.execFileSync("ffmpeg", ["-v", "error", "-i", video, "-vf", `fps=${fps},scale=${w}:${h},format=gray`, "-f", "rawvideo", "pipe:1"], { maxBuffer: 1 << 30 });
  const n = w * h; const frames = Math.floor(raw.length / n); return { raw, n, frames, at: (k) => raw.subarray(k * n, (k + 1) * n) };
}
const mad = (a, b) => { let d = 0; for (let i = 0; i < a.length; i += 1) d += Math.abs(a[i] - b[i]); return d / a.length; };
function corr(a, b) { const m = (x) => x.reduce((s, v) => s + v, 0) / x.length; const ma = m(a), mb = m(b); let n = 0, da = 0, db = 0;
  for (let i = 0; i < a.length; i += 1) { const x = a[i] - ma, y = b[i] - mb; n += x * y; da += x * x; db += y * y; } return n / Math.sqrt(da * db + 1e-9); }

function contactSheets(video, meta, out, duration) {
  const sheet = path.join(out, "contact-sheet.png"); const cols = 8; const n = Math.ceil(duration); const rows = Math.ceil(n / cols);
  cp.execFileSync("ffmpeg", ["-v", "error", "-y", "-i", video, "-vf", `fps=1,scale=216:384,drawtext=text='%{pts\\:hms}':x=6:y=6:fontsize=16:fontcolor=white:box=1:boxcolor=black@0.55,tile=${cols}x${rows}:padding=6:color=0x222222`, "-frames:v", "1", sheet]);
  // scene key frames: 35% and 85% through each scene
  const dir = path.join(out, "work", "keyframes"); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true }); const files = [];
  meta.scenes.forEach((s, i) => [0.35, 0.85].forEach((f, j) => { const t = s.start + (s.end - s.start) * f; const file = path.join(dir, `${j}-${String(i).padStart(2, "0")}.png`); // row j: 35% frames, then 85% frames
    cp.execFileSync("ffmpeg", ["-v", "error", "-y", "-ss", t.toFixed(3), "-i", video, "-frames:v", "1", "-vf", `scale=270:480,drawtext=text='${s.id} ${t.toFixed(1)}s':x=8:y=452:fontsize=17:fontcolor=white:box=1:boxcolor=black@0.6`, file]); files.push(file); }));
  const scenesSheet = path.join(out, "scene-sheet.png");
  cp.execFileSync("ffmpeg", ["-v", "error", "-y", "-pattern_type", "glob", "-i", path.join(dir, "*.png"), "-vf", `tile=${meta.scenes.length}x2:padding=6:color=0x222222`, "-frames:v", "1", scenesSheet]);
  return { contactSheet: sheet, sceneSheet: scenesSheet };
}

function decodeQr(video, times, text) {
  const py = `import sys, zxingcpp\nfrom PIL import Image\nfor f in sys.argv[1:]:\n    r = zxingcpp.read_barcodes(Image.open(f))\n    print(r[0].text if r else '')`;
  const files = times.map((t, i) => { const f = path.join(path.dirname(video), "work", `qr-${i}.png`); cp.execFileSync("ffmpeg", ["-v", "error", "-y", "-ss", t.toFixed(3), "-i", video, "-frames:v", "1", f]); return f; });
  const r = cp.spawnSync("python3", ["-I", "-c", py, ...files], { encoding: "utf8" }); const got = String(r.stdout || "").split("\n").slice(0, files.length);
  return times.map((t, i) => ({ t, decoded: got[i] || null, ok: text == null ? null : got[i] === text }));
}

async function run({ video, data, meta, work, out, ndir, narration, timeline, style, assets, quality, log }) {
  // status: PASS | FAIL | WARN | UNVERIFIED. UNVERIFIED = the instrument could not measure it; it is never counted as a pass
  // and never reported as zero.
  const objective = []; const add = (name, ok, measured, target, hard = true, status = null) => objective.push({ name, ok, measured, target, hard, status: status || (ok ? "PASS" : hard ? "FAIL" : "WARN") });
  const cuesFile = path.join(out, "captions.json"); fs.writeFileSync(cuesFile, JSON.stringify({ cues: meta.cues }, null, 1) + "\n");
  // 1. technical
  const tech = technicalQa(video, { cuesFile, wordsFile: path.join(ndir || path.join(out, "narration"), "timeline.json") });
  const res = quality === "preview" ? "540x960" : "1080x1920"; const target = data.targetDuration || [30, 50]; // the channel's Shorts target (studio passes it); BTO's default otherwise
  for (const c of tech.checks) {
    if (c.name === "resolution") { add("resolution", tech.video.startsWith(res), tech.video, res); continue; }
    if (c.name === "duration") { add("duration (channel Shorts target)", tech.durationSec >= target[0] && tech.durationSec <= target[1], `${tech.durationSec} s`, `${target[0]}-${target[1]} s`); continue; }
    if (c.name === "caption sync vs acoustic onsets") continue; // replaced below by the narration-track measurement
    if (c.name === "audio clipping") { // qa-vertical parses astats "Number of samples clipped", which FFmpeg 6+ no longer prints
      const e = cp.spawnSync("ffmpeg", ["-hide_banner", "-nostats", "-i", video, "-af", "astats=metadata=0", "-f", "null", "-"], { encoding: "utf8" }).stderr;
      const counts = [...e.matchAll(/Number of samples clipped: (\d+)/g)].map((m) => +m[1]);
      if (counts.length) add("audio samples clipped", counts.every((x) => x === 0), counts.join("/"), "0");
      else add("audio samples clipped", false, "not reported by this FFmpeg build (astats has no clipped-sample count)", "0", false, "UNVERIFIED");
      const peak = +((e.slice(e.lastIndexOf("Overall")).match(/Peak level dB: (-?[\d.]+|-inf)/) || [])[1]);
      add("sample peak below full scale (decoded AAC)", Number.isFinite(peak) && peak <= -0.1, Number.isFinite(peak) ? `${peak.toFixed(2)} dBFS` : "not measured", "<= -0.1 dBFS", true, Number.isFinite(peak) ? null : "UNVERIFIED");
      const flat = [...e.matchAll(/Flat factor: ([\d.]+)/g)].map((m) => +m[1]);
      add("flat factor (sustained full-scale runs)", flat.length > 0 && flat.every((x) => x === 0), flat.length ? flat.join("/") : "not measured", "0", false, flat.length ? null : "UNVERIFIED");
      continue; }
    add(c.name, c.ok, c.measured, c.target, c.hard);
  }
  // caption sync on the narration track itself (the music bed masks pauses in the final mix): each cue that starts
  // after a pause vs the nearest acoustic speech onset
  { const e = cp.spawnSync("ffmpeg", ["-hide_banner", "-nostats", "-i", narration, "-af", "silencedetect=n=-38dB:d=0.12", "-f", "null", "-"], { encoding: "utf8" }).stderr;
    const onsets = [...e.matchAll(/silence_end: ([\d.]+)/g)].map((m) => +m[1]); const W = timeline.words; const afterPause = meta.cues.filter((c) => { const i = W.findIndex((w) => Math.abs(w.start - c.start) < 0.005); return i === 0 || (i > 0 && c.start - W[i - 1].end >= 0.12); });
    const ds = afterPause.map((c) => { const o = onsets.filter((x) => Math.abs(x - c.start) < 0.6); return o.length ? Math.min(...o.map((x) => Math.abs(x - c.start))) : null; }).filter((x) => x != null);
    const maxMs = Math.round(1000 * Math.max(0, ...ds)); add("caption sync vs narration onsets (cues after a pause)", maxMs <= 150, `${ds.length} cues: max ${maxMs} ms, mean ${Math.round(1000 * ds.reduce((a, b) => a + b, 0) / (ds.length || 1))} ms`, "max <= 150 ms", false); }
  // the narration is real speech (lib/speech-check.js, the same gate the production pipeline uses)
  { const S = require("../../lib/speech-check"); const sc = S.check(narration, { text: timeline.lines.map((l) => l.text).join(" ") });
    add("narration is real speech (lib/speech-check)", sc.ok, `voiced ${sc.metrics.voicedShare}, ${sc.metrics.wordsPerSecond} words/s, longest silence ${sc.metrics.longestSilenceSeconds} s${sc.problems.length ? "; " + sc.problems.join("; ") : ""}`, "speech-check ok");
    add("narration voice approved for publishing", timeline.approved === true, timeline.voice + (timeline.approved ? "" : " (preview fallback)"), "approved channel voice", false); }
  // 2. text gate on a full-resolution inspection of the page itself
  const ins = await Renderer.render(data, { work, inspectStep: 0.25, log: () => {} });
  const insData = JSON.parse(fs.readFileSync(ins.inspection, "utf8")); insData.samples.forEach((s) => { s.boxes = s.boxes.filter((b) => b.role !== "decor"); });
  const insFile = path.join(out, "text-inspection.json"); fs.writeFileSync(insFile, JSON.stringify(insData) + "\n");
  const tq = cp.spawnSync(process.execPath, [path.join(ROOT, "scripts/fr-premium/text-qa.js"), insFile, "--out", path.join(out, "text-qa.json")], { encoding: "utf8" });
  const text = JSON.parse(fs.readFileSync(path.join(out, "text-qa.json"), "utf8"));
  add("text gate (collisions, caption band, edges, size)", text.pass, `${text.fails.length} FAIL / ${text.warns.length} WARN groups; min essential ${text.minEssentialFontPx}px`, "0 FAIL");
  add("essential text >= style minimum", text.minEssentialFontPx >= style.type.minEssentialPx, `${text.minEssentialFontPx}px`, `>= ${style.type.minEssentialPx}px`, false);
  // 3. motion per scene and repetition
  const G = grayFrames(video, 135, 240); const diffs = [0]; for (let k = 1; k < G.frames; k += 1) diffs.push(mad(G.at(k - 1), G.at(k)));
  const scenes = meta.scenes.map((s) => { const a = Math.round(s.start * 30), b = Math.min(G.frames, Math.round(s.end * 30)); const d = diffs.slice(a + 1, b);
    let run = 0, longest = 0; d.forEach((x) => { run = x < 0.25 ? run + 1 : 0; longest = Math.max(longest, run); });
    const mid = G.at(Math.min(G.frames - 1, Math.round((s.start + (s.end - s.start) * 0.6) * 30)));
    return { id: s.id, sec: +(s.end - s.start).toFixed(2), meanMotion: +(d.reduce((x, y) => x + y, 0) / Math.max(1, d.length)).toFixed(3), staticShare: +(d.filter((x) => x < 0.25).length / Math.max(1, d.length)).toFixed(2), longestStaticSec: +(longest / 30).toFixed(2), thumb: [...mid] }; });
  const longest = Math.max(...scenes.map((s) => s.longestStaticSec));
  add("no static hold >= 1.5 s inside a scene (visual change target)", longest < 1.5, `longest ${longest} s (${scenes.find((s) => s.longestStaticSec === longest).id})`, "< 1.5 s", false);
  const pairs = []; for (let i = 0; i < scenes.length; i += 1) for (let j = i + 1; j < scenes.length; j += 1) pairs.push({ a: scenes[i].id, b: scenes[j].id, r: +corr(scenes[i].thumb, scenes[j].thumb).toFixed(3) });
  const similar = pairs.filter((p) => p.r > 0.92 && !(p.a.startsWith("s1") && p.b.startsWith("s7")));
  add("no two scenes look alike (key-frame correlation <= 0.92; hook/payoff loop pair exempt)", similar.length === 0, similar.map((p) => `${p.a}~${p.b} ${p.r}`).join(", ") || `max ${Math.max(...pairs.map((p) => p.r))}`, "<= 0.92", false);
  scenes.forEach((s) => delete s.thumb);
  // 4. the QR on screen is a real, decodable symbol
  // known on-screen codes: generated symbols (assets with a matrix) and registered photos that declare decodesTo
  const known = [...Object.values(assets).filter((a) => a.matrix).map((a) => a.text), ...require("./asset-manager").load(data.storyboard.channel).assets.filter((a) => a.decodesTo && Object.keys(data.images || {}).includes(a.id)).map((a) => a.decodesTo)];
  let qr = null;
  if (known.length) { qr = decodeQr(video, [0, Math.max(0, tech.durationSec - 0.1)], null).map((x) => ({ ...x, ok: known.includes(x.decoded) }));
    add("on-screen QR decodes to a registered value (first and last frame)", qr.every((x) => x.ok), qr.map((x) => `${x.t.toFixed(1)}s: ${x.decoded || "no decode"}`).join("; "), known.join(" | ")); }
  // 5. determinism
  const det = await Renderer.determinism(data, path.join(work, "det"), [0.7, 12.3, 24.9, 29.1].filter((t) => t < data.duration));
  add("deterministic frames (two fresh pages, any order)", det.every((d) => d.identical), det.map((d) => `${d.t}s ${d.identical ? "same" : "DIFF"}`).join(", "), "identical");
  // 6. sheets
  const sheets = contactSheets(video, meta, out, tech.durationSec);
  const objectivePass = objective.filter((c) => c.hard && c.status !== "UNVERIFIED").every((c) => c.ok);
  const unverified = objective.filter((c) => c.status === "UNVERIFIED").map((c) => c.name);
  const report = { video: path.relative(ROOT, video), quality, measuredAt: new Date().toISOString(), objectivePass, unverified, objective, scenes, similarPairsTop: pairs.sort((a, b) => b.r - a.r).slice(0, 5), qr, determinism: det,
    technical: { loudness: tech.loudness, motion: tech.motion, captionSync: tech.captionSync || null, loop: tech.loop, first3s: tech.first3s }, text: { fails: text.fails, warns: text.warns, minEssentialFontPx: text.minEssentialFontPx },
    sheets: { contactSheet: path.relative(ROOT, sheets.contactSheet), sceneSheet: path.relative(ROOT, sheets.sceneSheet) },
    audioSync: { method: "every sound effect is placed at a time the page computed from the same word anchors that drive its animation (BTO.audio); the offset is 0 by construction, frame-quantised to 33 ms", cues: meta.audio.length },
    subjective: "Not measured here: see the video-quality-review skill and revision-history.md." };
  fs.writeFileSync(path.join(out, "qa-report.json"), JSON.stringify(report, null, 1) + "\n");
  const md = [`# QA report: ${path.basename(video)}`, "", `Objective verdict: **${objectivePass ? "PASS (hard checks)" : "FAIL"}** · measured ${report.measuredAt}`, unverified.length ? `UNVERIFIED (could not be measured, not counted as pass): ${unverified.join("; ")}` : "", "", "| Check | Result | Measured | Target |", "|---|---|---|---|",
    ...objective.map((c) => `| ${c.name} | ${c.status === "FAIL" ? "**FAIL**" : c.status === "UNVERIFIED" ? "*UNVERIFIED*" : c.status} | ${String(c.measured).replace(/\|/g, "/")} | ${c.target} |`), "",
    "## Motion per scene", "", "| Scene | Seconds | Mean motion | Static share | Longest static |", "|---|---|---|---|---|", ...scenes.map((s) => `| ${s.id} | ${s.sec} | ${s.meanMotion} | ${s.staticShare} | ${s.longestStaticSec} s |`), "",
    "## Text gate findings", "", ...(text.fails.concat(text.warns).map((x) => `- ${x.level} ${x.from.toFixed(2)}–${x.to.toFixed(2)} s ${x.check}: ${x.detail}`)), text.fails.length + text.warns.length ? "" : "- none", "",
    `Contact sheet: \`${report.sheets.contactSheet}\` · Scene sheet: \`${report.sheets.sceneSheet}\``, "", "Subjective creative evaluation is separate (revision-history.md)."].join("\n");
  fs.writeFileSync(path.join(out, "qa-report.md"), md + "\n");
  for (const c of objective) log(`  ${c.status}  ${c.name}: ${String(c.measured).slice(0, 90)}`);
  log(`qa: ${objectivePass ? "PASS" : "FAIL"} (hard checks) -> ${path.relative(ROOT, path.join(out, "qa-report.md"))}`);
  return report;
}

module.exports = { run };
