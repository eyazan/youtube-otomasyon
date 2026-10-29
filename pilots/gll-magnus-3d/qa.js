"use strict";
// Technical QA for the GLL Three.js pilot (checks in ../lib/qa.js).
// usage: node pilots/gll-magnus-3d/qa.js --audio-from <GLL-P01 out dir> [--video out/gll-p01-magnus-3d.mp4]
const path = require("path"); const fs = require("fs"); const R = require("../lib/three-render"); const { qa } = require("../lib/qa"); const { serve } = require("./render");
const pilot = path.resolve(R.arg("--audio-from")); const cues = JSON.parse(fs.readFileSync(path.join(pilot, "captions.json"), "utf8")).cues;
(async () => { const { srv, k } = await serve(cues); srv.close(); const thin = (a, n) => a.filter((_, i) => i % n === 0 || i === a.length - 1);
  const data = { setup: k.setup, flight: thin(k.flight, 2), straight: thin(k.straight, 2), spiral: thin(k.spiral, 4), cues };
  const r = await qa({ dir: __dirname, data, pilot, video: path.resolve(R.arg("--video", path.join(__dirname, "out/gll-p01-magnus-3d.mp4"))) }); process.exitCode = r.pass ? 0 : 1; })()
  .catch((e) => { console.error(e); process.exit(1); });
