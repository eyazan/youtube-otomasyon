"use strict";
// Shared renderer for the isolated Three.js pilots (review only; never published, not wired into production).
// A pilot supplies its folder (scene.html defining window.renderAt(t) and window.__ready, node_modules/three pinned in
// its own package.json) and the data its scene needs. This module serves the page, renders frames in parallel and
// muxes the narration.
// Parallelism mirrors scripts/bto-studio/render.js: N workers render contiguous segments, frames are captured with CDP
// Page.captureScreenshot (png, optimizeForSpeed) into one ffmpeg per segment, segments are joined losslessly. Each worker
// is its own Chromium process: SwiftShader runs WebGL in the browser's GPU process, which pages of one browser share.
const fs = require("fs"); const path = require("path"); const http = require("http"); const cp = require("child_process"); const os = require("os");
const ROOT = path.resolve(__dirname, "../..");

function probeDuration(file) { return Number(cp.spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file], { encoding: "utf8" }).stdout.trim()); }

// dir holds the page (scene.html for the hand-written v1 pilots, runtime.html for the plan-driven kit) and node_modules/three;
// /kit/ always serves the shared kit modules
function serve(dir, data) {
  const KIT = path.join(__dirname, "../kit/"); const page = fs.existsSync(path.join(dir, "scene.html")) ? "scene.html" : "runtime.html";
  const routes = { "/three/": path.join(dir, "node_modules/three/"), "/kit/": KIT, "/fonts/": path.join(ROOT, "node_modules/@fontsource/inter/files/") };
  const types = { ".js": "text/javascript", ".woff2": "font/woff2", ".html": "text/html" };
  const srv = http.createServer((req, res) => {
    const u = decodeURIComponent(req.url.split("?")[0]);
    if (u === "/favicon.ico") { res.writeHead(204); return res.end(); }   // Chrome (CI) asks for it; a 404 would count as a page error
    if (u === "/") { const html = fs.readFileSync(path.join(dir, page), "utf8").replace("<script type=\"importmap\">", `<script>window.__DATA=${JSON.stringify(data)}</script><script type="importmap">`);
      res.writeHead(200, { "content-type": "text/html" }); return res.end(html); }
    const base = Object.keys(routes).find((r) => u.startsWith(r)); if (!base) { res.writeHead(404); return res.end(); }
    const file = path.join(routes[base], u.slice(base.length)); if (!file.startsWith(routes[base]) || !fs.existsSync(file)) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { "content-type": types[path.extname(file)] || "application/octet-stream" }); fs.createReadStream(file).pipe(res);
  });
  return new Promise((r) => srv.listen(0, "127.0.0.1", () => r({ srv, port: srv.address().port })));
}

async function openPage(port) {
  const { chromium } = require(path.join(ROOT, "node_modules/playwright-core"));
  // software compositing and raster: the page is composited on the CPU instead of through SwiftShader (about 20% faster
  // per frame, measured); WebGL itself still runs in SwiftShader
  const browser = await chromium.launch({ ...(process.env.PD_CHROMIUM ? { executablePath: process.env.PD_CHROMIUM } : {}), args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist",
    ...(process.env.PILOT3D_GPU_COMPOSITING === "1" ? [] : ["--disable-gpu-compositing", "--disable-gpu-rasterization"])] });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  const errors = []; page.on("pageerror", (e) => errors.push(String(e))); page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  await page.goto(`http://127.0.0.1:${port}/?${process.env.PILOT3D_QUERY || ""}`); await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 });
  // fonts load on first use; request every weight before the first frame so frame 0 is not drawn in a fallback face
  await page.evaluate(() => Promise.all(["600 20px Inter", "700 30px Inter", "800 76px Inter"].map((f) => document.fonts.load(f))).then(() => document.fonts.ready));
  if (errors.length) throw new Error(errors.join("\n"));
  const cdp = await page.context().newCDPSession(page);
  const shot = async () => Buffer.from((await cdp.send("Page.captureScreenshot", { format: "png", optimizeForSpeed: true, captureBeyondViewport: false })).data, "base64");
  return { browser, page, shot, errors };
}

async function renderSegment(port, { from, n, fps, file }) {
  const w = await openPage(port);
  const ff = cp.spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(fps), "-c:v", "png", "-i", "-", "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", file], { stdio: ["pipe", "inherit", "inherit"] });
  for (let i = 0; i < n; i += 1) {
    await w.page.evaluate((tt) => window.renderAt(tt), (from + i) / fps);
    const buf = await w.shot(); if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r));
  }
  ff.stdin.end(); await new Promise((r) => ff.on("close", r)); await w.browser.close();
  if (w.errors.length) throw new Error(w.errors.join("\n"));
}

// opts: { dir, data, audio, out, name, fps, workers, from, to, stills: [t...] }
async function run({ dir, data, audio, out, name, fps = 30, workers, from = 0, to = null, stills = null, extra = {} }) {
  fs.mkdirSync(out, { recursive: true }); const t0 = Date.now();
  const { srv, port } = await serve(dir, data);
  try {
    if (stills) { const w = await openPage(port);
      for (const t of stills) { await w.page.evaluate((tt) => window.renderAt(tt), t); fs.writeFileSync(path.join(out, `still-${t.toFixed(1)}.png`), await w.shot()); }
      await w.browser.close(); if (w.errors.length) throw new Error(w.errors.join("\n")); return null; }
    const end = to == null ? probeDuration(audio) : to; const total = Math.floor((end - from) * fps + 1e-6); const f0 = Math.round(from * fps); // never longer than the narration
    const n = Math.max(1, Math.min(workers || 2, total));
    const segDir = path.join(out, "segments"); fs.mkdirSync(segDir, { recursive: true }); const per = Math.ceil(total / n); const segs = [];
    for (let w = 0; w < n; w += 1) { const a = w * per, k = Math.min(per, total - a); if (k > 0) segs.push({ from: f0 + a, n: k, fps, file: path.join(segDir, `seg-${w}.mp4`) }); }
    const tf = Date.now(); await Promise.all(segs.map((sg) => renderSegment(port, sg))); const frameWall = (Date.now() - tf) / 1000;
    const list = path.join(segDir, "list.txt"); fs.writeFileSync(list, segs.map((sg) => `file '${sg.file}'`).join("\n") + "\n");
    const silent = path.join(out, "video-silent.mp4");
    cp.spawnSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", list, "-c", "copy", silent], { stdio: "inherit" });
    const final = path.join(out, `${name}.mp4`);
    cp.spawnSync("ffmpeg", ["-y", "-loglevel", "error", "-i", silent, "-ss", String(from), "-t", String(end - from), "-i", audio, "-c:v", "copy", "-af", "apad", "-c:a", "aac", "-b:a", "192k", "-t", (total / fps).toFixed(4), final], { stdio: "inherit" });
    fs.rmSync(segDir, { recursive: true, force: true }); fs.unlinkSync(silent);
    const report = { engine: "three@0.170.0 (WebGL via SwiftShader, CPU)", query: process.env.PILOT3D_QUERY || "", fps, frames: total, workers: n, seconds: +(end - from).toFixed(2),
      frameWallSeconds: +frameWall.toFixed(1), wallSeconds: +((Date.now() - t0) / 1000).toFixed(1), msPerFrameWall: +(frameWall * 1000 / total).toFixed(0),
      cpus: os.cpus().length, output: path.relative(ROOT, final), ...extra };
    fs.writeFileSync(path.join(out, "render-report.json"), JSON.stringify(report, null, 2) + "\n"); return report;
  } finally { srv.close(); }
}

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
module.exports = { serve, openPage, run, arg, probeDuration, ROOT };
