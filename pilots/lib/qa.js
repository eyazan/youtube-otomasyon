"use strict";
// Technical QA for the isolated Three.js pilot. Measured checks only, same instruments as the premium studio:
//   1. scripts/fr-premium/qa-vertical.js: decode, black frames, freezes, loudness, A/V, loop continuity, caption sync
//   2. text layout in the page every 0.25 s: overlay boxes inside the safe area, no box overlaps another, minimum size
//   3. motion: longest static run inside a shot
//   4. determinism: the same frames rendered on two fresh browsers are byte-identical
// used by each pilot's qa.js: qa({ dir, data, video, pilot }) where pilot is the folder holding captions.json and
// narration/timeline.json (the current-engine run whose narration the 3D render uses)
const fs = require("fs"); const path = require("path"); const cp = require("child_process"); const crypto = require("crypto");
const { qa: technicalQa } = require("../../scripts/fr-premium/qa-vertical");
const R = require("./three-render");

const SAFE = { left: 40, right: 1040, top: 80, bottom: 1920 - 300 };   // Shorts overlay UI covers the lowest ~300 px
const BOXES = ".head,.sub,.cap,.read,.chip,.card,.brand";

async function qa({ dir, data, video, pilot }) {
  const out = path.join(dir, "out"); const cuesFile = path.join(pilot, "captions.json"); const cues = data.cues;
  const checks = []; const add = (name, ok, measured, target, hard = true) => checks.push({ name, ok, measured, target, hard, status: ok ? "PASS" : hard ? "FAIL" : "WARN" });

  // 1. technical
  const tech = technicalQa(video, { cuesFile, wordsFile: path.join(pilot, "narration", "timeline.json") });
  for (const c of tech.checks) add(c.name, c.ok, c.measured, c.target, c.hard);

  // 2 + 4. page checks
  const { srv, port } = await R.serve(dir, data); const openPage = R.openPage;
  try {
    const a = await openPage(port); const dur = cues[cues.length - 1].end + 0.6; const issues = []; let samples = 0, minFont = 99, minFontAt = "";
    for (let t = 0; t < dur; t += 0.25) {
      samples += 1;
      const r = await a.page.evaluate(([tt, sel]) => { window.renderAt(tt); return [...document.querySelectorAll(sel)].map((e) => { const b = e.getBoundingClientRect();
        // the box that matters is the painted text (full-width containers pad their text inward), plus any background panel
        const bg = getComputedStyle(e).backgroundColor; const panel = bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent";
        const rg = document.createRange(); rg.selectNodeContents(e); const tb = panel ? b : rg.getBoundingClientRect();
        const fonts = [e, ...e.querySelectorAll("*")].filter((x) => [...x.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())).map((x) => parseFloat(getComputedStyle(x).fontSize)); // elements that paint text
        return { cls: e.className, x0: tb.left, y0: tb.top, x1: tb.right, y1: tb.bottom, font: Math.min(...fonts), op: +getComputedStyle(e).opacity }; }).filter((b) => b.op > 0.05 && b.x1 > b.x0); }, [t, BOXES]);
      for (const b of r) { if (b.font < minFont) { minFont = b.font; minFontAt = `${t.toFixed(2)} s ${b.cls}`; }
        if (b.x0 < SAFE.left || b.x1 > SAFE.right || b.y0 < SAFE.top || b.y1 > SAFE.bottom) issues.push(`${t.toFixed(2)} s ${b.cls} outside safe area [${b.x0.toFixed(0)},${b.y0.toFixed(0)},${b.x1.toFixed(0)},${b.y1.toFixed(0)}]`); }
      for (let i = 0; i < r.length; i += 1) for (let j = i + 1; j < r.length; j += 1) { const p = r[i], q = r[j];
        const ix = Math.min(p.x1, q.x1) - Math.max(p.x0, q.x0), iy = Math.min(p.y1, q.y1) - Math.max(p.y0, q.y0);
        if (ix > 2 && iy > 2) issues.push(`${t.toFixed(2)} s ${p.cls} overlaps ${q.cls} (${ix.toFixed(0)}x${iy.toFixed(0)} px)`); }
    }
    add("overlay text inside the safe area and not overlapping", issues.length === 0, issues.length ? `${issues.length} issue(s); first: ${issues[0]}` : `${samples} samples clean`, "0 issues");
    add("smallest overlay font", minFont >= 20, `${minFont} px (${minFontAt})`, ">= 20 px");
    const times = [0.7, 12.3, 24.9, 29.1]; const hash = async (w) => { const h = []; for (const t of times) { await w.page.evaluate((tt) => window.renderAt(tt), t); h.push(crypto.createHash("sha256").update(await w.shot()).digest("hex")); } return h; };
    const ha = await hash(a); await a.browser.close(); const b = await openPage(port); const hb = await hash(b); await b.browser.close();
    add("deterministic frames (two fresh browsers)", ha.every((x, i) => x === hb[i]), times.map((t, i) => `${t}s ${ha[i] === hb[i] ? "same" : "DIFF"}`).join(", "), "identical");
    fs.writeFileSync(path.join(out, "text-layout-issues.json"), JSON.stringify(issues, null, 1) + "\n");
  } finally { srv.close(); }

  // 3. longest static run (mean abs gray diff < 0.4 between consecutive frames on a 270x480 proxy)
  { const n = 270 * 480; const raw = cp.execFileSync("ffmpeg", ["-v", "error", "-i", video, "-vf", "scale=270:480,format=gray", "-f", "rawvideo", "pipe:1"], { maxBuffer: 1 << 30 });
    const fr = Math.floor(raw.length / n); let run = 0, best = 0, at = 0;
    for (let k = 1; k < fr; k += 1) { let d = 0; for (let i = 0; i < n; i += 1) d += Math.abs(raw[k * n + i] - raw[(k - 1) * n + i]); if (d / n < 0.4) { run += 1; if (run > best) { best = run; at = k; } } else run = 0; }
    add("longest static hold", best / 30 < 1.5, `${(best / 30).toFixed(2)} s (ending ${(at / 30).toFixed(1)} s)`, "< 1.5 s"); }

  const sheet = path.join(out, "contact-sheet.png");
  cp.execFileSync("ffmpeg", ["-v", "error", "-y", "-i", video, "-vf", "fps=1,scale=216:384,tile=8x5:padding=6:color=0x222222", "-frames:v", "1", sheet]);
  const pass = checks.filter((c) => c.hard).every((c) => c.ok);
  const report = { video: path.relative(R.ROOT, video), pass, checks, motion: tech.motion, loudness: tech.loudness || null };
  fs.writeFileSync(path.join(out, "qa-report.json"), JSON.stringify(report, null, 1) + "\n");
  for (const c of checks) console.log(`${c.status.padEnd(5)} ${c.name.padEnd(54)} ${String(c.measured).slice(0, 90)}`);
  console.log(pass ? "qa: PASS (hard checks)" : "qa: FAIL"); return report;
}
module.exports = { qa };
