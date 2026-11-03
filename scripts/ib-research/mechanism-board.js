#!/usr/bin/env node
"use strict";
// ImpossibleBrief mechanism review board: the visual-mechanism decision (PR #387) is a person's, and it was the last gate
// for 90 researched topics. The funnel's word-classifier proposals were wrong often enough (Tambora and Krakatoa as
// orbits, "GPS went dark" and "melted a diamond" as microbe clusters, a gamma-ray burst as an ocean column) that each
// one needed research by the reviewer. This tool:
//   1. proposes only what the drawing literally shows, from the record's title/topic (STRONG), says why, and leaves every
//      other record as NO_DRAWING (a new component is needed) instead of guessing;
//   2. with --render, renders four stills of each STRONG proposal through the studio (--propose-mechanism: preview,
//      shadow, stills only; the record on disk is not changed) and a contact sheet per topic;
//   3. writes reports/ib-mechanism-board/README.md with the evidence and the exact declare command for the reviewer,
//      who deletes any pair they reject and runs it with their own name (declare-mechanism.js refuses without --by).
// It never declares anything itself.
//   node scripts/ib-research/mechanism-board.js [--render] [--limit N] [--out reports/ib-mechanism-board]
const cp = require("child_process");
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..", "..");
const arg = (n, d) => { const i = process.argv.indexOf("--" + n); return i > 0 ? process.argv[i + 1] : d; };

// title/topic rules: [mechanism, regex, what the viewer will see]; first match wins, so specific subjects come first
const RULES = [
  ["magnetic-field", /\b(aurora|magnetar|solar (super)?storm|geomagnetic|magnetic field|carrington|1859 solar)\b/i, "Earth in its dipole field; particles arrive as the field weakens"],
  ["ocean-current", /\b(ocean current|atlantic (ocean )?current|gulf stream|amoc|overturning circulation)\b/i, "the warm northbound stream and its cold return over the globe"],
  ["lake-water", /\b(lake|sea (just )?(disappeared|dried|drained)|sea dried up|mediterranean sea dried|drained)\b/i, "a water column with depth markers falling"],
  ["volcano-eruption", /\b(volcano(es)?|volcanic|eruption|erupt(ed|s)?|yellowstone|tambora|krakatoa|magma)\b/i, "a volcano in cross-section erupting: chamber, column and ash umbrella"],
  ["earth-interior", /\b(earthquake|continents merged|plate tectonics)\b/i, "the planet cut open: crust, mantle and core, with heat and depth"],
  ["planet-orbit", /\b(orbit\w*|asteroid|comet|moon disappeared|year lasted|tidally locked|flew past|space junk|halley)\b/i, "a body travelling on its orbit around another"],
  ["named-body", /\b(lived on (mars|mercury|venus|proxima b|the moon)|on (mars|mercury|venus|io)\b|visited io|neptune'?s winds|ceres|pluto|betelgeuse|uy scuti|jupiter'?s great red spot)\b/i, "the named world itself"],
  ["atmosphere", /\b(tornado|dust bowl|edge of space|oxygen doubles|carbon out of the air|dimmed the sun|ozone)\b/i, "the planet's limb and the layers of air above it"],
  ["microbial-population", /\b(microbes?|bacteria|microbiome|nitrogen cycle|plankton|fung(us|i))\b/i, "a microbe cluster whose count can fall"],
  ["ocean-depth", /\b(deep sea|whale fall|whale fed the deep|ocean floor|trench|coral reefs?)\b/i, "a water column down to the seafloor"],
  ["human-body", /\b(never stopped growing|run like|your body|your brain|you jumped)\b/i, "a generic human figure"],
];

function propose(t) {
  const title = `${t.title || ""} ${t.topic || ""}`;
  for (const [mech, re, sees] of RULES) { const m = title.match(re); if (m) return { id: t.id, mechanism: mech, confidence: "STRONG", why: `the title names "${m[0]}"; the drawing shows ${sees}` }; }
  return { id: t.id, mechanism: null, confidence: "NO_DRAWING", why: "nothing the existing drawings show is named in the title; a new component is needed" };
}

function candidates() {
  const f = JSON.parse(fs.readFileSync(path.join(ROOT, "reports/premium-topic-funnel.json"), "utf8")).find((x) => x.channel === "impossible-brief");
  const uni = JSON.parse(fs.readFileSync(path.join(ROOT, "channels/impossible-brief/topics/topic-universe.json"), "utf8"));
  return f.rows.filter((r) => r.stage === "CREATIVE_VIABLE").map((r) => uni.topics.find((x) => x.id === r.id)).filter(Boolean);
}

function render(p, outDir) {
  const dir = path.join(outDir, "work", p.id); const env = { ...process.env, BTO_PREMIUM_RENDER: "preview" };
  const run = (stills) => cp.spawnSync("node", ["scripts/bto-studio/studio.js", "--channel", "impossible-brief", "--topic", p.id, "--shadow", "--shadow-dir", dir, "--regenerate", "--propose-mechanism", p.mechanism, "--stills", stills], { cwd: ROOT, env, encoding: "utf8", timeout: 600000 });
  let r = run("0.5"); // narrates once; the timeline then places the stills inside lines 1, 3, 5 and the last
  const tl = path.join(dir, "out/narration/timeline.json");
  if (fs.existsSync(tl)) { const T = JSON.parse(fs.readFileSync(tl, "utf8")); const L = T.lines; const pick = [0, 2, 4, L.length - 1].filter((i, k, a) => i < L.length && a.indexOf(i) === k);
    r = run(pick.map((i) => (L[i].start + 0.7 * (L[i].end - L[i].start)).toFixed(2)).join(",")); }
  const err = (r.stdout + r.stderr).split("\n").filter((l) => /ERROR|FAILED/.test(l)).slice(0, 3).join(" | ");
  const stills = path.join(dir, "out/work/stills"); const files = fs.existsSync(stills) ? fs.readdirSync(stills).filter((f) => /\.(png|jpg)$/.test(f)).sort() : [];
  if (!files.length) return { ok: false, err: err || "no stills" };
  const sheet = path.join(outDir, `${p.id}.jpg`);
  const py = `import sys\nfrom PIL import Image\nims=[Image.open(f).convert('RGB').resize((270,480)) for f in sys.argv[2:]]\ns=Image.new('RGB',(270*len(ims),480))\n[s.paste(im,(i*270,0)) for i,im in enumerate(ims)]\ns.save(sys.argv[1],quality=82)`;
  cp.spawnSync("python3", ["-c", py, sheet, ...files.map((f) => path.join(stills, f))]);
  return { ok: fs.existsSync(sheet), err, sheet: path.basename(sheet) };
}

function main() {
  const out = path.resolve(ROOT, arg("out", "reports/ib-mechanism-board")); fs.mkdirSync(out, { recursive: true });
  const all = candidates().map((t) => ({ ...propose(t), title: t.title || t.topic }));
  const only = arg("only", null) ? arg("only").split(",") : null;
  const strong = all.filter((p) => p.confidence === "STRONG" && (!only || only.includes(p.id))).slice(0, Number(arg("limit", 999)));
  if (process.argv.includes("--render")) for (const p of strong) { const r = render(p, out); Object.assign(p, { render: r }); console.log(`${p.id} ${p.mechanism}: ${r.ok ? r.sheet : "FAILED " + r.err}`); }
  const L = ["# ImpossibleBrief: visual-mechanism review board", "",
    `Generated ${new Date().toISOString().slice(0, 10)} by \`scripts/ib-research/mechanism-board.js\`. ${all.length} researched topics stop only at the`,
    "visual-mechanism decision. Proposals are STRONG only when the title names what the drawing shows; every other record is",
    "NO_DRAWING (it needs a new component, not a guess). Stills are rendered with the proposed mechanism in preview/shadow mode;",
    "the research records are unchanged. **Nothing here is a decision.**", "",
    `STRONG: ${all.filter((p) => p.confidence === "STRONG").length} · NO_DRAWING: ${all.filter((p) => p.confidence === "NO_DRAWING").length}`, "",
    "| topic | title | proposed | why | frames |", "|---|---|---|---|---|"];
  for (const p of all) if (!p.render && fs.existsSync(path.join(out, `${p.id}.jpg`)) && p.confidence === "STRONG") p.render = { ok: true, sheet: `${p.id}.jpg` };
  for (const p of all) L.push(`| ${p.id} | ${String(p.title).replace(/\|/g, "/")} | ${p.mechanism || "—"} | ${p.why} | ${p.render ? (p.render.ok ? `![](${p.render.sheet})` : "render failed: " + p.render.err) : ""} |`);
  const ok = all.filter((p) => p.confidence === "STRONG" && (!p.render || p.render.ok));
  L.push("", "## To declare (reviewer)", "", "Look at each topic's frames, delete the pairs you reject, then run with your own name:", "", "```bash",
    `node scripts/ib-research/declare-mechanism.js ${ok.map((p) => `${p.id} ${p.mechanism}`).join(" ")} --by "<your name>"`, "```", "");
  fs.writeFileSync(path.join(out, "README.md"), L.join("\n"));
  fs.writeFileSync(path.join(out, "board.json"), JSON.stringify(all, null, 2) + "\n");
  console.log(`board: ${all.length} topics, ${strong.length} STRONG -> ${path.relative(ROOT, out)}/README.md`);
}
if (require.main === module) main();
module.exports = { propose, RULES };
