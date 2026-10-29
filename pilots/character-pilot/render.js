"use strict";
// Character pilot driver (review only): stills or a silent MP4 of one sequence, plus the foot-skate measurement.
//   PILOT_VENDOR=<dir with ual1-standard.glb> node pilots/character-pilot/render.js --seq rc|pk --fig ual|v2 --out <dir> [--stills 1,2.9] [--mp4]
const fs = require("fs"); const path = require("path"); const cp = require("child_process");
const R = require("../lib/three-render");
(async () => {
  const seq = R.arg("--seq", "rc"), fig = R.arg("--fig", "ual"), out = path.resolve(R.arg("--out", path.join(__dirname, "out"))); fs.mkdirSync(out, { recursive: true });
  process.env.PILOT3D_QUERY = `seq=${seq}&fig=${fig}`;
  const name = `${seq}-${fig}`;
  if (R.arg("--stills")) { const dir = path.join(out, name); await R.run({ dir: __dirname, data: {}, out: dir, name, stills: R.arg("--stills").split(",").map(Number) }); }
  if (process.argv.includes("--mp4")) {
    const silent = path.join(out, "silence.wav"); if (!fs.existsSync(silent)) cp.spawnSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo", "-t", "8.2", silent]);
    const rep = await R.run({ dir: __dirname, data: {}, audio: silent, out, name, workers: +R.arg("--workers", 2), extra: { pilot: "character", seq, fig } });
    console.log(`render ${name}: ${rep.frames} frames, ${rep.frameWallSeconds} s frame wall, ${rep.msPerFrameWall} ms/frame`);
  }
  // foot skate during the run-up: horizontal speed of the planted foot (0 = no sliding)
  const { srv, port } = await R.serve(__dirname, {}); const { chromium } = require(path.join(__dirname, "../../node_modules/playwright-core"));
  const b = await chromium.launch({ ...(process.env.PD_CHROMIUM ? { executablePath: process.env.PD_CHROMIUM } : {}), args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] }); const pg = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await pg.goto(`http://127.0.0.1:${port}/?${process.env.PILOT3D_QUERY}`); await pg.waitForFunction(() => window.__ready === true, null, { timeout: 60000 });
  const skate = await pg.evaluate(() => window.footSkate(0.2, 2.3)); console.log(`foot skate ${name}: ${JSON.stringify(skate)} m/s (planted foot, run-up)`);
  fs.writeFileSync(path.join(out, `${name}-motion.json`), JSON.stringify({ seq, fig, footSkateMaxMps: skate }, null, 1) + "\n");
  await b.close(); srv.close();
})().catch((e) => { console.error(e); process.exit(1); });
