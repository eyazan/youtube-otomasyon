"use strict";
// Renders the isolated Three.js Magnus pilot to MP4 (review only; never published, not wired into production).
// usage: node pilots/gll-magnus-3d/render.js [--audio-from <pilot out dir>] [--workers 2] [--out <dir>] [--from s --to s] [--stills t1,t2]
const fs = require("fs"); const path = require("path");
const R = require("../lib/three-render"); const { kick } = require("./physics");

function sceneData(cues, duration = null) { const k = kick(); const thin = (a, n) => a.filter((_, i) => i % n === 0 || i === a.length - 1);
  return { k, data: { setup: k.setup, flight: thin(k.flight, 2), straight: thin(k.straight, 2), spiral: thin(k.spiral, 4), cues, duration } }; }
// compatibility for qa.js and probes: serve(cues) -> { srv, port, k }
async function serve(cues, duration = null) { const { k, data } = sceneData(cues, duration); const s = await R.serve(__dirname, data); return { ...s, k }; }

module.exports = { serve, openPage: R.openPage };
if (require.main === module) {
  const pilot = path.resolve(R.arg("--audio-from", path.join(R.ROOT, "channels/goal-lore-lab/premium/pilots/GLL-P01/out")));
  const cues = JSON.parse(fs.readFileSync(path.join(pilot, "captions.json"), "utf8")).cues;
  const duration = Math.floor(R.probeDuration(path.join(pilot, "audio/mix-master.wav")) * 30) / 30; const { k, data } = sceneData(cues, duration);
  R.run({ dir: __dirname, data, audio: path.join(pilot, "audio/mix-master.wav"), out: path.resolve(R.arg("--out", path.join(__dirname, "out"))), name: "gll-p01-magnus-3d",
    workers: +R.arg("--workers", 2), from: +R.arg("--from", 0), to: R.arg("--to") ? +R.arg("--to") : null, stills: R.arg("--stills") ? R.arg("--stills").split(",").map(Number) : null,
    extra: { pilot: "gll-magnus-3d", model: { yawDeg: +(k.yaw * 180 / Math.PI).toFixed(2), pitchDeg: +(k.pitch * 180 / Math.PI).toFixed(2), flightTime: +k.flight[k.flight.length - 1].t.toFixed(3),
      speedStart: +k.flight[0].speed.toFixed(1), speedEnd: +k.flight[k.flight.length - 1].speed.toFixed(1), label: "MODEL (illustrative, not measured)" } } })
    .then((r) => r && console.log(JSON.stringify(r, null, 1))).catch((e) => { console.error(e); process.exit(1); });
}
