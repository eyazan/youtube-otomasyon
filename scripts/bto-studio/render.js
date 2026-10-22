"use strict";
// BTO Premium Studio renderer: deterministic headless-Chromium frames -> scene segments -> one H.264 picture track.
// Builds on the FR premium capture loop (scripts/fr-premium/render-vertical.js): the page is a pure function of t,
// frames are captured losslessly over CDP and piped to x264. Added here:
//   - scene-level segments, cached by a content hash (page code + style + assets + every scene drawn in the range
//     + the narration words in the range + quality), so editing one scene re-renders only the segments it touches;
//   - bounded parallelism: N pages (workers) render different segments; N defaults to min(3, cpus - 1);
//   - atomic writes (.partial -> rename) so an interrupted run resumes with the segments already finished;
//   - retry: a failed segment is retried once on a fresh page;
//   - preview (540x960, deviceScaleFactor 0.5, same layout) and final (1080x1920) qualities.
const cp = require("child_process");
const crypto = require("crypto");
const fs = require("fs");
const os = require("os");
const path = require("path");
const Fonts = require("../profitdecoded/motion/fonts");

const PAGE = path.join(__dirname, "page");
const FPS = 30;
const QUALITY = {
  preview: { scale: 0.5, preset: "veryfast", crf: 22, noise: 2 },
  final: { scale: 1, preset: "slow", crf: 17, noise: 3 },
};
const sha = (s) => crypto.createHash("sha256").update(s).digest("hex");

function pageCode() {
  const files = [path.join(PAGE, "motion.js"), ...fs.readdirSync(path.join(PAGE, "components")).filter((f) => f.endsWith(".js")).sort().map((f) => path.join(PAGE, "components", f))];
  return files.map((f) => fs.readFileSync(f, "utf8")).join("\n;\n");
}

function pageHtml(data) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${Fonts.css()}
html,body{margin:0;width:1080px;height:1920px;overflow:hidden;background:#000}#stage{position:relative;width:1080px;height:1920px;overflow:hidden;background:${data.style.palette.desk}}
#svg,#hud{position:absolute;left:0;top:0;width:1080px;height:1920px}#svg{overflow:hidden}</style></head>
<body><div id="stage"><svg id="svg" xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920"></svg><div id="hud"></div></div>
<script>window.STUDIO_DATA=${JSON.stringify(data).replace(/</g, "\\u003c")};</script><script>${pageCode()}</script></body></html>`;
}

async function openPage(browser, file, scale) {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: scale });
  const errors = []; page.on("pageerror", (e) => errors.push(e.message)); page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  await page.goto("file://" + file, { waitUntil: "load" });
  await page.evaluate(Fonts.PAGE_CHECK);
  const meta = await page.evaluate(() => BTO.init(window.STUDIO_DATA));
  await page.evaluate(() => (BTO.preload ? BTO.preload() : null)); // photos decoded before any capture
  if (errors.length) throw new Error("page errors: " + errors.join(" | "));
  return { page, meta, errors };
}

// Segments: one per scene. A segment's hash covers every scene drawn in its range (the previous scene appears
// during the incoming transition) and the words captioned in it.
function segmentsOf(meta, data, quality) {
  // code hash: the runtime plus only the component files that define components this storyboard uses, so adding a
  // component for another channel does not invalidate every cached segment
  const used = new Set(data.storyboard.scenes.flatMap((s) => (s.layers || []).map((l) => l.component)));
  const compFiles = fs.readdirSync(path.join(PAGE, "components")).filter((f) => f.endsWith(".js")).sort().map((f) => fs.readFileSync(path.join(PAGE, "components", f), "utf8"))
    .filter((src) => [...src.matchAll(/BTO\.def\("([a-z0-9-]+)"/g)].some((m) => used.has(m[1])) || /BTO\.(measure|projector|enter|paperCard|isoStack|geo|runsFrom|rowRuns)\s*=/.test(src));
  const code = sha(fs.readFileSync(path.join(PAGE, "motion.js"), "utf8") + compFiles.join("\n")); const style = sha(JSON.stringify(data.style)); const assets = sha(JSON.stringify({ assets: data.assets, images: Object.fromEntries(Object.entries(data.images || {}).map(([k, v]) => [k, { sha256: v.sha256, w: v.w, h: v.h, credit: v.credit }])) })); // content, not machine paths
  return meta.scenes.map((s, i) => {
    const f0 = Math.round(s.start * FPS), f1 = i === meta.scenes.length - 1 ? Math.round(data.duration * FPS) : Math.round(meta.scenes[i + 1].start * FPS);
    const specs = data.storyboard.scenes.slice(Math.max(0, i - 1), i + 1);
    const words = data.timeline.words.filter((w) => w.end >= s.start - 1 && w.start <= s.end + 1);
    const cues = meta.cues.filter((c) => c.end >= s.start && c.start <= s.end);
    const key = sha(JSON.stringify({ v: 2, code, style, assets, specs, words, cues, off: meta.captionsOff, f0, f1, quality, starts: meta.scenes.slice(Math.max(0, i - 1), i + 2).map((x) => x.start) })).slice(0, 16);
    return { id: s.id, index: i, f0, f1, frames: f1 - f0, key };
  });
}

function encoder(out, q) {
  const W = Math.round(1080 * q.scale), H = Math.round(1920 * q.scale);
  return cp.spawn("ffmpeg", ["-v", "error", "-y", "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "png", "-i", "-",
    "-vf", `scale=${W}:${H}:flags=lanczos,noise=alls=${q.noise}:allf=u,scale=out_color_matrix=bt709:out_range=tv,format=yuv420p`,
    "-c:v", "libx264", "-preset", q.preset, "-crf", String(q.crf), "-x264-params", "aq-mode=3:colorprim=bt709:transfer=bt709:colormatrix=bt709",
    "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv", "-r", String(FPS), "-an", "-f", "mp4", out], { stdio: ["pipe", "ignore", "pipe"] });
}

async function renderSegment(ctx, seg, q) {
  const { page } = ctx; const cdp = ctx.cdp || (ctx.cdp = await page.context().newCDPSession(page));
  const partial = seg.file + ".partial"; const ff = encoder(partial, q); let err = ""; ff.stderr.on("data", (d) => { err += d; });
  const done = new Promise((ok, no) => ff.on("close", (c) => (c === 0 ? ok() : no(new Error("ffmpeg exited " + c + ": " + err.slice(-400))))));
  const t0 = Date.now();
  for (let f = seg.f0; f < seg.f1; f += 1) {
    await page.evaluate((x) => BTO.frame(x), f / FPS);
    const buf = Buffer.from((await cdp.send("Page.captureScreenshot", { format: "png", optimizeForSpeed: true, captureBeyondViewport: false })).data, "base64");
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r));
  }
  ff.stdin.end(); await done; fs.renameSync(partial, seg.file);
  return { ms: Date.now() - t0 };
}

function rssMb(pid) { // resident memory of a process tree (Linux/macOS ps)
  try { const out = cp.execFileSync("ps", ["-A", "-o", "pid=,ppid=,rss="], { encoding: "utf8" }); const rows = out.trim().split("\n").map((l) => l.trim().split(/\s+/).map(Number));
    const kids = new Map(); rows.forEach(([p, pp]) => { if (!kids.has(pp)) kids.set(pp, []); kids.get(pp).push(p); }); const rss = new Map(rows.map(([p, , r]) => [p, r]));
    // Linux: proportional set size (shared pages split between the processes that map them), so the sum is the tree's
    // real memory; summing RSS counts Chromium's shared pages once per process and overstated it ~5x on CI runners
    const pss = (x) => { try { const m = /^Pss:\s+(\d+) kB/m.exec(fs.readFileSync(`/proc/${x}/smaps_rollup`, "utf8")); return m ? Number(m[1]) : null; } catch (e) { return null; } };
    let sum = 0; const st = [pid]; while (st.length) { const x = st.pop(); const p = process.platform === "linux" ? pss(x) : null; sum += p != null ? p : rss.get(x) || 0; (kids.get(x) || []).forEach((k) => st.push(k)); } return Math.round(sum / 1024); } catch (e) { return null; }
}

// data: { storyboard, timeline, style, assets, duration }
async function render(data, { work, out, quality = "preview", workers, only = null, stills = null, inspectStep = null, log = console.log } = {}) {
  const q = QUALITY[quality]; if (!q) throw new Error("unknown quality " + quality);
  fs.mkdirSync(work, { recursive: true }); const segDir = path.join(work, "segments", quality); fs.mkdirSync(segDir, { recursive: true });
  const file = path.join(work, "page.html"); fs.writeFileSync(file, pageHtml(data));
  const { chromium } = require("playwright-core");
  const browser = await chromium.launch(process.env.PD_CHROMIUM ? { executablePath: process.env.PD_CHROMIUM } : {});
  const peak = { mb: 0 }; const sample = () => { const r = rssMb(browser.process ? browser.process().pid : 0); if (r && r > peak.mb) peak.mb = r; };
  try {
    const first = await openPage(browser, file, stills || inspectStep ? 1 : q.scale);
    const meta = first.meta; fs.writeFileSync(path.join(work, "scenes.json"), JSON.stringify(meta, null, 1) + "\n");
    if (stills) { const sdir = path.join(work, "stills"); fs.mkdirSync(sdir, { recursive: true }); const files = [];
      for (const t of stills) { await first.page.evaluate((x) => BTO.frame(x), t); const f = path.join(sdir, `t${t.toFixed(2).padStart(6, "0")}.png`); await first.page.screenshot({ path: f }); files.push(f); }
      return { meta, stills: files }; }
    if (inspectStep) { const samples = []; for (let t = 0; t < data.duration; t += inspectStep) { await first.page.evaluate((x) => BTO.frame(x), t); samples.push({ t: +t.toFixed(3), boxes: await first.page.evaluate(() => BTO.inspectText()) }); }
      const f = path.join(work, "text-inspection.json"); fs.writeFileSync(f, JSON.stringify({ step: inspectStep, duration: data.duration, samples }, null, 1) + "\n"); return { meta, inspection: f }; }
    const segs = segmentsOf(meta, data, quality).map((s) => ({ ...s, file: path.join(segDir, `${String(s.index).padStart(2, "0")}-${s.id}-${s.key}.mp4`) }));
    const todo = segs.filter((s) => !fs.existsSync(s.file) && (!only || only.includes(s.id)));
    const n = Math.max(1, Math.min(workers || Math.min(3, Math.max(1, os.cpus().length - 1)), todo.length || 1));
    log(`render ${quality}: ${segs.length} segments, ${segs.length - todo.length} cached, ${todo.length} to render on ${n} worker(s)`);
    const ctxs = [first]; for (let i = 1; i < n; i += 1) ctxs.push(await openPage(browser, file, q.scale));
    const stats = []; const queue = todo.slice(); const t0 = Date.now(); const timer = setInterval(sample, 1000);
    await Promise.all(ctxs.map(async (ctx, w) => { let c = ctx;
      while (queue.length) { const seg = queue.shift(); let attempt = 0;
        while (true) { try { const r = await renderSegment(c, seg, q); stats.push({ segment: seg.id, frames: seg.frames, worker: w, ms: r.ms, msPerFrame: +(r.ms / seg.frames).toFixed(1), attempt }); log(`  ${seg.id}: ${seg.frames} frames in ${(r.ms / 1000).toFixed(1)} s (worker ${w})`); break; }
          catch (e) { attempt += 1; log(`  ${seg.id}: failed (${e.message.slice(0, 160)})${attempt < 2 ? ", retrying on a fresh page" : ""}`); try { fs.unlinkSync(seg.file + ".partial"); } catch (x) {} if (attempt >= 2) throw e; try { await c.page.close(); } catch (x) {} c = await openPage(browser, file, q.scale); } } } }));
    clearInterval(timer); sample();
    if (only) return { meta, segments: segs, stats, partial: true };
    const list = path.join(work, `concat-${quality}.txt`); fs.writeFileSync(list, segs.map((s) => `file '${s.file}'`).join("\n"));
    cp.execFileSync("ffmpeg", ["-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", list, "-c", "copy", "-movflags", "+faststart", out]);
    const wall = Date.now() - t0; const frames = stats.reduce((a, s) => a + s.frames, 0);
    const perf = { quality, resolution: `${Math.round(1080 * q.scale)}x${Math.round(1920 * q.scale)}`, workers: n, segments: segs.length, cachedSegments: segs.length - todo.length, framesRendered: frames, wallSec: +(wall / 1000).toFixed(1),
      msPerFrameWall: frames ? +(wall / frames).toFixed(1) : 0, peakChromiumRssMb: peak.mb, host: `${os.platform()} ${os.arch()} ${os.cpus().length} cpu ${(os.totalmem() / 2 ** 30).toFixed(0)} GB`, stats };
    fs.writeFileSync(path.join(work, `render-perf-${quality}.json`), JSON.stringify(perf, null, 1) + "\n");
    return { meta, segments: segs, perf, out };
  } finally { await browser.close(); }
}

// determinism check: the same frame rendered on two fresh pages is byte-identical
async function determinism(data, work, times) {
  fs.mkdirSync(work, { recursive: true }); const file = path.join(work, "page.html"); fs.writeFileSync(file, pageHtml(data)); const { chromium } = require("playwright-core");
  const browser = await chromium.launch(process.env.PD_CHROMIUM ? { executablePath: process.env.PD_CHROMIUM } : {}); const res = [];
  try { const a = await openPage(browser, file, 0.5), b = await openPage(browser, file, 0.5);
    for (const t of times) { await a.page.evaluate((x) => BTO.frame(x), t); await b.page.evaluate((x) => BTO.frame(x), times[times.length - 1 - times.indexOf(t)]); await b.page.evaluate((x) => BTO.frame(x), t);
      const [ha, hb] = [sha(await a.page.screenshot()), sha(await b.page.screenshot())]; res.push({ t, identical: ha === hb }); } } finally { await browser.close(); }
  return res;
}

module.exports = { render, determinism, pageHtml, segmentsOf, QUALITY, FPS };
