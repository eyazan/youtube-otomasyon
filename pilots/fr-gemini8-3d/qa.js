"use strict";
// Technical QA for the FR Gemini 8 Three.js pilot (checks in ../lib/qa.js).
// usage: node pilots/fr-gemini8-3d/qa.js --audio-from <FR shadow out dir> [--video out/fr-gemini8-3d.mp4]
const path = require("path"); const fs = require("fs"); const R = require("../lib/three-render"); const { qa } = require("../lib/qa"); const { profile } = require("./physics");
const pilot = path.resolve(R.arg("--audio-from")); const cues = JSON.parse(fs.readFileSync(path.join(pilot, "captions.json"), "utf8")).cues;
const p = profile(); const duration = Math.floor(R.probeDuration(path.join(pilot, "audio/mix-master.wav")) * 30) / 30; const data = { cues, duration, model: { docked: p.docked, undocked: p.undocked, rateAtUndock: p.rateAtUndock, peak: p.peak, ratio: p.ratio, tau: p.tau } };
qa({ dir: __dirname, data, pilot, video: path.resolve(R.arg("--video", path.join(__dirname, "out/fr-gemini8-3d.mp4"))) }).then((r) => { process.exitCode = r.pass ? 0 : 1; }).catch((e) => { console.error(e); process.exit(1); });
