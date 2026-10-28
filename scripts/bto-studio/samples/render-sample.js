#!/usr/bin/env node
"use strict";
// Renders a design sample board (no narration, no topic, never published) with the shared studio renderer.
//   node scripts/bto-studio/samples/render-sample.js scripts/bto-studio/samples/goal-lore-lab-board.json [--stills 1,3,5] [--video]
const fs = require("fs"); const path = require("path"); const R = require("../render");
const ROOT = path.resolve(__dirname, "../../.."); const args = process.argv.slice(2); const opt = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const board = JSON.parse(fs.readFileSync(path.resolve(args[0]), "utf8"));
const style = JSON.parse(fs.readFileSync(path.join(ROOT, board.stylePack), "utf8"));
const data = { storyboard: board.storyboard, timeline: { duration: board.duration, lines: [{ id: "L1", start: 0, end: board.duration }], words: [] }, style, assets: {}, duration: board.duration };
const work = path.join(ROOT, "channels", board.channel, "premium", "samples", "out");
(async () => {
  const stills = opt("--stills", null);
  if (stills) { const r = await R.render(data, { work, stills: stills.split(",").map(Number), log: console.log }); console.log(`stills -> ${path.relative(ROOT, path.dirname(r.stills[0]))}`); }
  if (args.includes("--video")) { const out = path.join(work, "design-sample.mp4"); const r = await R.render(data, { work, out, quality: "preview", log: console.log }); console.log(`video -> ${path.relative(ROOT, out)} (${r.perf.framesRendered} frames, ${r.perf.wallSec} s)`); }
})().catch((e) => { console.error("SAMPLE FAILED:", e.message); process.exit(1); });
