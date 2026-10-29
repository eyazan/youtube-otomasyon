"use strict";
// Renders the isolated Three.js Gemini 8 pilot to MP4 (review only; never published, not wired into production).
// usage: node pilots/fr-gemini8-3d/render.js --audio-from <FR premium out dir> [--workers 2] [--stills t1,t2]
const path = require("path"); const fs = require("fs");
const R = require("../lib/three-render"); const { profile } = require("./physics");
const pilot = path.resolve(R.arg("--audio-from", path.join(R.ROOT, "channels/failure-reconstructed/premium/FR-gemini-8-1966/out")));
const cues = JSON.parse(fs.readFileSync(path.join(pilot, "captions.json"), "utf8")).cues;
const p = profile(); const duration = Math.floor(R.probeDuration(path.join(pilot, "audio/mix-master.wav")) * 30) / 30; const model = { docked: p.docked, undocked: p.undocked, rateAtUndock: p.rateAtUndock, peak: p.peak, ratio: p.ratio, tau: p.tau };
R.run({ dir: __dirname, data: { cues, model, duration }, audio: path.join(pilot, "audio/mix-master.wav"), out: path.resolve(R.arg("--out", path.join(__dirname, "out"))),
  name: "fr-gemini8-3d", workers: +R.arg("--workers", 2), stills: R.arg("--stills") ? R.arg("--stills").split(",").map(Number) : null,
  extra: { model: { ...model, label: "MODEL (illustrative torque and inertias; only the ~296 deg/s peak is reported)" } } })
  .then((r) => r && console.log(JSON.stringify(r, null, 1))).catch((e) => { console.error(e); process.exit(1); });
