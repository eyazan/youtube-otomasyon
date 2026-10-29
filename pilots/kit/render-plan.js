"use strict";
// One driver for every topic of the plan-driven kit (review only; never published, not wired into production):
// plan the topic from its evidence, render the plan with kit/runtime.html over the current engine's narration, run QA.
// usage: node pilots/kit/render-plan.js --topic <topic.json | case file> --audio-from <current-engine out dir> --name <name>
//        [--out <dir>] [--workers 2] [--stills t1,t2] [--no-qa]
// exit 2 with plan.json status CREATIVE_REVIEW_REQUIRED when the planner refuses; nothing is rendered then.
const fs = require("fs"); const path = require("path");
const R = require("../lib/three-render"); const { plan, Refusal } = require("../lib/planner"); const { qa } = require("../lib/qa");

(async () => {
  const topic = path.resolve(R.arg("--topic")); const pilot = path.resolve(R.arg("--audio-from")); const name = R.arg("--name");
  const out = path.resolve(R.arg("--out", path.join(__dirname, "out", name))); fs.mkdirSync(out, { recursive: true });
  const cues = JSON.parse(fs.readFileSync(path.join(pilot, "captions.json"), "utf8")).cues; const audio = path.join(pilot, "audio/mix-master.wav");
  const duration = Math.floor(R.probeDuration(audio) * 30) / 30;
  let P; try { P = plan(topic, cues, duration); } catch (e) { if (!(e instanceof Refusal)) throw e;
    fs.writeFileSync(path.join(out, "plan.json"), JSON.stringify({ status: "CREATIVE_REVIEW_REQUIRED", topic: path.basename(topic), reasons: e.reasons }, null, 1) + "\n");
    console.log(`plan: CREATIVE_REVIEW_REQUIRED\n- ${e.reasons.join("\n- ")}`); process.exitCode = 2; return; }
  fs.writeFileSync(path.join(out, "plan.json"), JSON.stringify(P.plan, null, 1) + "\n");
  console.log(`plan: ${P.plan.status} template=${P.plan.template} shots=${P.plan.shots.length} assumptions=${P.plan.assumptions.length}`);
  const stills = R.arg("--stills") ? R.arg("--stills").split(",").map(Number) : null;
  const rep = await R.run({ dir: __dirname, data: P.data, audio, out, name, workers: +R.arg("--workers", 2), stills, extra: { pilot: "kit", template: P.plan.template, topic: P.plan.topic, model: P.plan.modelLabel ? { ...P.data.model } : null } });
  if (rep) console.log(`render: ${rep.frames} frames, ${rep.frameWallSeconds} s frame wall, ${rep.msPerFrameWall} ms/frame, ${rep.workers} workers`);
  if (rep && !process.argv.includes("--no-qa")) { const q = await qa({ dir: __dirname, data: P.data, pilot, video: path.join(out, `${name}.mp4`), out }); process.exitCode = q.pass ? 0 : 1; }
})().catch((e) => { console.error(e); process.exit(1); });
