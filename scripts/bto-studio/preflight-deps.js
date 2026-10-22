#!/usr/bin/env node
"use strict";
// Required-dependency check for a premium render, run before any narration or frame is produced (studio.js calls it;
// CI runs it as a step). A missing tool must fail at once with its name, not minutes later as a misleading QA result:
// CI run 39835922184 rendered BTO-301 without zxing-cpp and QA reported the on-screen QR as undecodable.
//   node scripts/bto-studio/preflight-deps.js [--qr]      exit 0 when everything is present, 3 otherwise
const cp = require("child_process");
const fs = require("fs");

const run = (cmd, args) => cp.spawnSync(cmd, args, { encoding: "utf8", timeout: 60000 });
function python(modules) {
  const code = `import importlib,sys\nbad=[]\nfor m in sys.argv[1:]:\n    try: importlib.import_module(m)\n    except Exception as e: bad.append(m+": "+str(e).splitlines()[0])\nprint("\\n".join(bad))`;
  const r = run("python3", ["-I", "-c", code, ...modules]);
  if (r.error || r.status !== 0) return modules.map((m) => `${m}: python3 not runnable (${r.error ? r.error.code : String(r.stderr).trim().split("\n").pop()})`);
  return String(r.stdout).split("\n").filter(Boolean);
}
function chromiumPath(env) {
  if (env.PD_CHROMIUM) return env.PD_CHROMIUM;
  try { return require("playwright").chromium.executablePath(); } catch (e) { return null; }
}

// qr: the topic shows a generated QR symbol, so QA must decode it (segno writes it, zxing-cpp reads it back)
function check({ qr = false, env = process.env } = {}) {
  const missing = [];
  for (const tool of ["ffmpeg", "ffprobe"]) { const r = run(tool, ["-version"]); if (r.error || r.status !== 0) missing.push(`${tool}: not installed or not on PATH (apt: ffmpeg)`); }
  const chrome = chromiumPath(env);
  if (!chrome || !fs.existsSync(chrome)) missing.push(`Chromium: ${chrome ? `${chrome} does not exist` : "no executable (set PD_CHROMIUM or install Playwright's Chromium)"}`);
  const py = ["numpy", "soundfile", "PIL", ...(qr ? ["zxingcpp", "segno"] : [])];
  missing.push(...python(py).map((l) => `python ${l} (pip install -r scripts/bto-studio/requirements.txt)`));
  return { ok: missing.length === 0, missing, checked: { tools: ["ffmpeg", "ffprobe", "Chromium"], python: py } };
}

if (require.main === module) {
  const r = check({ qr: process.argv.includes("--qr") });
  if (r.ok) { console.log(`dependencies: OK (${[...r.checked.tools, ...r.checked.python].join(", ")})`); process.exit(0); }
  console.error(`dependencies: MISSING, nothing was rendered:\n  - ${r.missing.join("\n  - ")}`); process.exit(3);
}
module.exports = { check };
