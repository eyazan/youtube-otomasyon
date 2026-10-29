"use strict";
// Renders the isolated Three.js Magnus pilot to MP4 (review only; never published, not wired into production).
// usage: node pilots/gll-magnus-3d/render.js [--audio-from <pilot out dir>] [--fps 30] [--out <dir>] [--from s --to s] [--stills t1,t2]
const fs = require("fs"); const path = require("path"); const http = require("http"); const { spawn } = require("child_process");
const { kick } = require("./physics");
const ROOT = path.resolve(__dirname, "../..");
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const FPS = Number(arg("--fps", 30)); const OUT = path.resolve(arg("--out", path.join(__dirname, "out")));
// --audio-from: the pilot output folder whose narration mix and captions drive this render (the current-engine run)
const PILOT = path.resolve(arg("--audio-from", path.join(ROOT, "channels/goal-lore-lab/premium/pilots/GLL-P01/out")));
const AUDIO = path.join(PILOT, "audio/mix-master.wav"); const cues = JSON.parse(fs.readFileSync(path.join(PILOT, "captions.json"), "utf8")).cues;

function probeDuration(file) { const r = require("child_process").spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file], { encoding: "utf8" }); return Number(r.stdout.trim()); }

function serve() {
  const k = kick(); const thin = (a, n) => a.filter((_, i) => i % n === 0 || i === a.length - 1);
  const data = { setup: k.setup, flight: thin(k.flight, 2), straight: thin(k.straight, 2), spiral: thin(k.spiral, 4), cues };
  const routes = { "/three/": path.join(__dirname, "node_modules/three/"), "/fonts/": path.join(ROOT, "node_modules/@fontsource/inter/files/") };
  const types = { ".js": "text/javascript", ".woff2": "font/woff2", ".html": "text/html" };
  const srv = http.createServer((req, res) => {
    const u = decodeURIComponent(req.url.split("?")[0]);
    if (u === "/") { const html = fs.readFileSync(path.join(__dirname, "scene.html"), "utf8").replace("<script type=\"importmap\">", `<script>window.__DATA=${JSON.stringify(data)}</script><script type="importmap">`);
      res.writeHead(200, { "content-type": "text/html" }); return res.end(html); }
    const base = Object.keys(routes).find((r) => u.startsWith(r)); if (!base) { res.writeHead(404); return res.end(); }
    const file = path.join(routes[base], u.slice(base.length)); if (!file.startsWith(routes[base]) || !fs.existsSync(file)) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { "content-type": types[path.extname(file)] || "application/octet-stream" }); fs.createReadStream(file).pipe(res);
  });
  return new Promise((r) => srv.listen(0, "127.0.0.1", () => r({ srv, port: srv.address().port, k })));
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true }); const t0 = Date.now();
  const dur = probeDuration(AUDIO); const from = Number(arg("--from", 0)), to = Number(arg("--to", dur));
  const { srv, port, k } = await serve();
  const { chromium } = require("playwright-core");
  const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  const errors = []; page.on("pageerror", (e) => errors.push(String(e))); page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  await page.goto(`http://127.0.0.1:${port}/`); await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 });
  await page.evaluate(() => document.fonts.ready);
  if (errors.length) throw new Error(errors.join("\n"));
  if (arg("--stills")) { for (const t of arg("--stills").split(",").map(Number)) { await page.evaluate((tt) => window.renderAt(tt), t);
      await page.screenshot({ path: path.join(OUT, `still-${t.toFixed(1)}.png`) }); } if (errors.length) console.error(errors.join("\n")); await browser.close(); srv.close(); return; }
  const silent = path.join(OUT, "video-silent.mp4"); const n = Math.round((to - from) * FPS);
  const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "png", "-i", "-", "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", silent], { stdio: ["pipe", "inherit", "inherit"] });
  const tf = Date.now();
  for (let i = 0; i < n; i += 1) {
    const t = from + i / FPS; await page.evaluate((tt) => window.renderAt(tt), t);
    const buf = await page.screenshot({ type: "png" }); if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r));
    if (i % (FPS * 5) === 0) process.stdout.write(`frame ${i}/${n} t=${t.toFixed(1)}s\n`);
  }
  ff.stdin.end(); await new Promise((r) => ff.on("close", r)); const frameMs = (Date.now() - tf) / n;
  await browser.close(); srv.close();
  const final = path.join(OUT, "gll-p01-magnus-3d.mp4");
  require("child_process").spawnSync("ffmpeg", ["-y", "-loglevel", "error", "-i", silent, "-ss", String(from), "-t", String(to - from), "-i", AUDIO, "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", final], { stdio: "inherit" });
  fs.unlinkSync(silent);
  const report = { pilot: "gll-magnus-3d", engine: "three@0.170.0 (WebGL via SwiftShader, CPU)", fps: FPS, frames: n, seconds: +(to - from).toFixed(2),
    wallSeconds: +((Date.now() - t0) / 1000).toFixed(1), msPerFrame: +frameMs.toFixed(1), output: path.relative(ROOT, final),
    model: { yawDeg: +(k.yaw * 180 / Math.PI).toFixed(2), pitchDeg: +(k.pitch * 180 / Math.PI).toFixed(2), flightTime: +k.flight[k.flight.length - 1].t.toFixed(3),
      speedStart: +k.flight[0].speed.toFixed(1), speedEnd: +k.flight[k.flight.length - 1].speed.toFixed(1), label: "MODEL (illustrative, not measured)" } };
  fs.writeFileSync(path.join(OUT, "render-report.json"), JSON.stringify(report, null, 2) + "\n"); console.log(JSON.stringify(report, null, 1));
})().catch((e) => { console.error(e); process.exit(1); });
