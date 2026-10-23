"use strict";
// BTO Premium Studio narrator. Same output contract as scripts/fr-premium/narrate-edge.js:
// <outDir>/narration.wav (48 kHz mono) + <outDir>/timeline.json { voice, provider, approved, duration, lines, words }.
//
// Voice order (never mixed inside one video):
//   1. edge   - the channel's APPROVED voice (config.voice: en-US-EmmaMultilingualNeural +1%), via the existing
//               narrate-edge.js (word boundaries measured by the service). approved = true.
//   2. kokoro - the repository's pinned offline fallback (lib/shorts-tts.js kokoroLines, Kokoro-82M ONNX), used only
//               when BTO_PREMIUM_RENDER=preview and Edge failed or --voice kokoro was asked for. approved = false:
//               the output is a preview and must be re-narrated with Edge before any publishing review.
//               Line timing is measured (one take per line); word timing inside a line is ESTIMATED from the
//               take's energy envelope (pauses snapped to punctuation, syllable-weighted) and labelled so.
const cp = require("child_process");
const fs = require("fs");
const path = require("path");
const TTS = require("../../lib/shorts-tts");
const telaffuz = require("../../pronunciation-check");

const ROOT = path.resolve(__dirname, "..", "..");
const SR = 48000;
const dur = (f) => parseFloat(cp.execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).toString());

// The narrator may wait up to its retry budget (scripts/fr-premium/edge-client.js) on top of the synthesis itself,
// so the timeout grows with that budget and the narrator is never killed before its last attempt
function edgeTimeoutMs(env = process.env) {
  return 300000 + require("../fr-premium/edge-client").settings(env).budgetSec * 1000;
}
// the line that explains a failed narration: the narrator's own NARRATION FAILED message, else the last line that is
// not Node's version banner (a crash prints "Node.js v20.x" last: run 39840693330)
function failureLine(r) {
  if (r.error && r.error.code === "ETIMEDOUT") return `narrator timed out after ${Math.round(edgeTimeoutMs() / 1000)} s`;
  const lines = String(r.stderr || "").concat("\n", String(r.stdout || "")).split("\n").map((l) => l.trim()).filter(Boolean);
  return lines.find((l) => /NARRATION FAILED|Edge narration failed/.test(l)) || lines.find((l) => /\b\w*Error\b:/.test(l) && !/^at /.test(l))
    || lines.filter((l) => !/^Node\.js v\d/.test(l) && !/^at /.test(l)).pop() || String(r.error || `exit ${r.status}`);
}

function edge(scriptFile, outDir, voice) {
  const r = cp.spawnSync(process.execPath, [path.join(ROOT, "scripts/fr-premium/narrate-edge.js"), scriptFile, outDir, "--voice", voice], { encoding: "utf8", timeout: edgeTimeoutMs() });
  if (r.status !== 0) throw new Error(failureLine(r));
  const tl = JSON.parse(fs.readFileSync(path.join(outDir, "timeline.json"), "utf8"));
  Object.assign(tl, { approved: true, wordTiming: "measured (Edge word boundaries)" });
  fs.writeFileSync(path.join(outDir, "timeline.json"), JSON.stringify(tl, null, 1) + "\n");
  return tl;
}

// Spoken form for TTS only (captions keep the script's spelling): years are read the way people say them
// (Kokoro's G2P reads "1994" as "nineteen hundred ninety four").
const ONES = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
const two = (n) => (n < 20 ? ONES[n] : TENS[Math.floor(n / 10)] + (n % 10 ? "-" + ONES[n % 10] : ""));
const year = (y) => { const hi = Math.floor(y / 100), lo = y % 100;
  if (y >= 2000 && y < 2010) return "two thousand" + (lo ? " " + ONES[lo] : "");
  return two(hi) + " " + (lo === 0 ? "hundred" : lo < 10 ? "oh " + ONES[lo] : two(lo)); };
const spokenForm = (text) => String(text).replace(/\b(1[1-9]\d\d|20\d\d)\b/g, (m) => year(+m));

const syllables = (w) => {
  const s = String(w).toLowerCase();
  if (/^\d{4}$/.test(s.replace(/[^0-9]/g, ""))) return 5; // a year: "nineteen ninety-four"
  return s.split(/-/).reduce((n, part) => n + Math.max(1, (part.replace(/[^a-z]/g, "").replace(/e$/, "").match(/[aeiouy]+/g) || []).length), 0);
};

// 16-bit mono PCM samples of a wav (via ffmpeg, so any input format works).
function pcm(file, rate = 16000) {
  const raw = cp.execFileSync("ffmpeg", ["-v", "error", "-i", file, "-ac", "1", "-ar", String(rate), "-f", "s16le", "pipe:1"], { maxBuffer: 1 << 28 });
  const n = raw.length / 2; const out = new Float32Array(n); for (let i = 0; i < n; i += 1) out[i] = raw.readInt16LE(i * 2) / 32768; return { x: out, rate };
}

// Word times inside one take: speech span from a 10 ms RMS envelope, internal pauses (>= 90 ms) matched to
// punctuation in order of expected position, syllable-weighted spread inside each chunk.
function estimateWords(file, text) {
  const { x, rate } = pcm(file); const hop = rate / 100; const env = [];
  for (let i = 0; i + hop <= x.length; i += hop) { let s = 0; for (let k = 0; k < hop; k += 1) s += x[i + k] * x[i + k]; env.push(Math.sqrt(s / hop)); }
  const peak = Math.max(...env); const th = Math.max(peak * 0.04, 0.004);
  const on = env.map((e) => e > th); const first = on.indexOf(true), last = on.lastIndexOf(true);
  const gaps = []; let run = 0;
  for (let i = first; i <= last; i += 1) { if (!on[i]) run += 1; else { if (run >= 9) gaps.push({ a: (i - run) / 100, b: i / 100 }); run = 0; } }
  const ws = text.split(/\s+/); const syl = ws.map(syllables); const total = syl.reduce((a, b) => a + b, 0);
  const a = first / 100, z = (last + 1) / 100;
  // every internal pause is snapped to the word boundary whose expected time (syllable-weighted) is nearest;
  // boundaries after punctuation are preferred (0.25 s bonus); boundaries stay in order and are used once
  const punct = ws.map((w, k) => k < ws.length - 1 && /[,.;:!?]$/.test(w));
  let cum = 0; const expect = {}; syl.forEach((s, k) => { cum += s; expect[k] = a + (z - a) * cum / total; });
  const breaks = []; let kmin = 0;
  for (const g of gaps) { const mid = (g.a + g.b) / 2; let best = -1, bs = 1e9;
    for (let k = kmin; k < ws.length - 1; k += 1) { const sc = Math.abs(expect[k] - mid) - (punct[k] ? 0.25 : 0); if (sc < bs) { bs = sc; best = k; } }
    if (best >= 0 && bs < 0.6) { breaks.push({ k: best, gap: g }); kmin = best + 1; } }
  const cands = punct.filter(Boolean);
  const out = []; let s0 = a, k0 = 0;
  for (const seg of [...breaks, { k: ws.length - 1, gap: { a: z, b: z } }]) {
    const span = ws.slice(k0, seg.k + 1); const sy = syl.slice(k0, seg.k + 1); const T = sy.reduce((p, q) => p + q, 0); let c = 0;
    span.forEach((w, j) => { const st = s0 + (seg.gap.a - s0) * c / T; c += sy[j]; out.push({ text: w, start: +st.toFixed(3), end: +(s0 + (seg.gap.a - s0) * c / T).toFixed(3) }); });
    s0 = seg.gap.b; k0 = seg.k + 1;
  }
  return { words: out, speech: [a, z], gapsFound: gaps.length, breaksMatched: breaks.length, punctuationBreaks: cands.length };
}

function kokoro(script, outDir, voice, speed) {
  const lines = script.beats.flatMap((b) => b.lines);
  const summary = TTS.kokoroLines(lines.map((l) => spokenForm(telaffuz.ttsMetni(l.text))), path.join(outDir, ".takes"), { voice, speed });
  const pieces = [], tl = { lines: [], words: [], beats: [] }; let clock = 0; const list = [];
  let li = 0;
  for (const beat of script.beats) {
    for (const l of beat.lines) {
      const take = summary.lines[li]; li += 1;
      const est = estimateWords(take.file, l.text);
      const a = Math.max(0, est.speech[0] - 0.06), z = est.speech[1] + 0.2;
      const wav = path.join(outDir, ".takes", `${l.id}.wav`);
      cp.execFileSync("ffmpeg", ["-v", "error", "-y", "-i", take.file, "-af", `atrim=${a.toFixed(3)}:${z.toFixed(3)},asetpts=N/SR/TB,aresample=${SR}`, "-ac", "1", "-c:a", "pcm_s16le", wav]);
      const d = dur(wav);
      const lw = est.words.map((w) => ({ line: l.id, text: w.text, start: +(clock + w.start - a).toFixed(3), end: +(clock + w.end - a).toFixed(3) }));
      tl.words.push(...lw); tl.lines.push({ id: l.id, beat: beat.id, text: l.text, start: lw[0].start, end: lw[lw.length - 1].end });
      tl.beats.push({ beat: beat.id, speechSec: +d.toFixed(3), synthSec: take.synthSeconds, gapsFound: est.gapsFound, breaksMatched: est.breaksMatched, punctuationBreaks: est.punctuationBreaks });
      list.push(wav); clock += d;
    }
    if (beat.pauseAfterMs > 0) {
      const sil = path.join(outDir, ".takes", `${beat.id}-pause.wav`);
      cp.execFileSync("ffmpeg", ["-v", "error", "-y", "-f", "lavfi", "-i", `anullsrc=r=${SR}:cl=mono`, "-t", (beat.pauseAfterMs / 1000).toFixed(3), "-c:a", "pcm_s16le", sil]);
      list.push(sil); clock += beat.pauseAfterMs / 1000;
    }
  }
  const lf = path.join(outDir, ".takes", "list.txt"); fs.writeFileSync(lf, list.map((p) => `file '${p}'`).join("\n"));
  const out = path.join(outDir, "narration.wav");
  cp.execFileSync("ffmpeg", ["-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", lf, "-c:a", "pcm_s16le", out]);
  const timeline = { voice: `kokoro ${voice}`, provider: "Kokoro-82M v1.0 ONNX (kokoro-onnx 0.6.1, Apache-2.0), local CPU, via lib/shorts-tts.js", approved: false,
    approvalNote: `PREVIEW ONLY. The channel's approved voice is Edge ${(script.voice.approved || {}).voice || "(none approved yet)"}; re-narrate with --voice edge before any publishing review.`,
    wordTiming: "line timing measured per take; word timing inside a line estimated (energy envelope, punctuation-snapped pauses, syllable weights)",
    modelLoadSec: summary.loadSeconds, duration: +dur(out).toFixed(3), ...tl };
  fs.writeFileSync(path.join(outDir, "timeline.json"), JSON.stringify(timeline, null, 1) + "\n");
  fs.rmSync(path.join(outDir, ".takes"), { recursive: true, force: true });
  return timeline;
}

// mode: "auto" (edge, then kokoro when preview), "edge", "kokoro"
function narrate(script, outDir, { mode = "auto", preview = true, kokoroVoice = "af_heart", kokoroSpeed = 1.0, log = () => {} } = {}) {
  fs.mkdirSync(outDir, { recursive: true });
  const scriptFile = path.join(outDir, "narration-script.json"); fs.writeFileSync(scriptFile, JSON.stringify(script, null, 1) + "\n");
  const approved = script.voice.approved;
  let edgeError = null;
  if (mode !== "kokoro") {
    try { log(`narration: approved voice ${approved.voice} (Edge)`); return edge(scriptFile, outDir, approved.voice); }
    catch (e) { edgeError = e.message; log(`narration: Edge unavailable: ${edgeError}`); if (mode === "edge") throw new Error("approved Edge voice unavailable: " + edgeError); }
  }
  if (!preview) throw new Error(`approved voice unavailable (${edgeError}); the unapproved Kokoro fallback is only allowed with BTO_PREMIUM_RENDER=preview`);
  const ready = TTS.kokoroAvailable();
  if (!ready.ok) throw new Error(`no narration: Edge failed (${edgeError}) and the Kokoro fallback is not installed (${ready.reason})`);
  log(`narration: PREVIEW fallback Kokoro ${kokoroVoice} (unapproved)`);
  const tl = kokoro(script, outDir, kokoroVoice, kokoroSpeed); tl.edgeError = edgeError;
  fs.writeFileSync(path.join(outDir, "timeline.json"), JSON.stringify(tl, null, 1) + "\n");
  return tl;
}

module.exports = { narrate, estimateWords, syllables, spokenForm, edgeTimeoutMs, failureLine };
