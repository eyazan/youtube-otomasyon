#!/usr/bin/env node
"use strict";
// Evidence-driven growth summary from the channels' own analytics warehouse (channels/<c>/analytics/warehouse).
// READ-ONLY, offline. It reports what the data supports and refuses conclusions the sample cannot carry:
//   - a video counts only after >= 7 days of rows (early numbers are not comparable)
//   - a comparison between groups needs >= 10 matured videos per group; below that it says INSUFFICIENT_DATA
//   - no virality prediction, no "best time to post" without a test, no claims from other channels' data
//   node scripts/bto-studio/growth-evidence.js [--channel impossible-brief] [--json]
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..", "..");
const MIN_DAYS = 7, MIN_GROUP = 10;
const J = (f, d) => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch (e) { return d; } };
const median = (xs) => { if (!xs.length) return null; const s = [...xs].sort((a, b) => a - b); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

function summarise(channel) {
  const raw = J(path.join(ROOT, "channels", channel, "analytics", "warehouse", "video_daily.json"), []); const rows = Array.isArray(raw) ? raw : raw.rows || [];
  const by = {}; for (const r of rows) (by[r.videoId] = by[r.videoId] || []).push(r);
  const vids = Object.entries(by).map(([id, rs]) => { const days = new Set(rs.map((r) => r.day)).size; const sum = (k) => rs.reduce((s, r) => s + (Number(r[k]) || 0), 0);
    const v = sum("views"); return { id, type: rs[0].contentType, days, views: v, minutes: sum("estimatedMinutesWatched"), netSubs: sum("netSubscribers"), shares: sum("shares"),
      avgViewPct: v ? rs.reduce((s, r) => s + (Number(r.averageViewPercentage) || 0) * (Number(r.views) || 0), 0) / v : null }; });
  const matured = vids.filter((v) => v.days >= MIN_DAYS);
  const groups = {}; for (const v of matured) (groups[v.type] = groups[v.type] || []).push(v);
  const stats = Object.fromEntries(Object.entries(groups).map(([k, g]) => [k, { n: g.length, medianViews: median(g.map((v) => v.views)), medianAvgViewPct: median(g.map((v) => v.avgViewPct).filter((x) => x != null)), netSubs: g.reduce((s, v) => s + v.netSubs, 0),
    sufficient: g.length >= MIN_GROUP }]));
  const findings = [];
  if (!rows.length) findings.push("INSUFFICIENT_DATA: no analytics rows in the warehouse");
  else if (!matured.length) findings.push(`INSUFFICIENT_DATA: ${vids.length} videos, none with ${MIN_DAYS}+ days of data`);
  for (const [k, s] of Object.entries(stats)) findings.push(s.sufficient ? `${k}: n=${s.n} matured videos; median views ${s.medianViews}, median average view ${s.medianAvgViewPct == null ? "n/a" : s.medianAvgViewPct.toFixed(1) + "%"}`
    : `${k}: only ${s.n} matured videos (< ${MIN_GROUP}); describe, do not compare or conclude`);
  return { channel, rows: rows.length, videos: vids.length, matured: matured.length, groups: stats, findings,
    allowedDecisions: Object.values(stats).filter((s) => s.sufficient).length >= 2 ? ["compare formats within this channel", "plan one A/B test at a time (one variable)"]
      : matured.length >= MIN_GROUP ? ["use the medians as this channel's baseline for new premium videos", "plan one A/B test at a time (one variable), pre-registered"] : ["keep publishing the approved plan; collect data", "fix measured technical issues (QA), not taste"] };
}
if (require.main === module) {
  const a = process.argv.slice(2); const only = a.includes("--channel") ? [a[a.indexOf("--channel") + 1]] : ["failure-reconstructed", "impossible-brief", "behind-the-ordinary", "critical-thread"];
  const r = only.map(summarise); if (a.includes("--json")) console.log(JSON.stringify(r, null, 1)); else for (const c of r) console.log(`== ${c.channel}: ${c.rows} rows, ${c.videos} videos, ${c.matured} matured\n   ${c.findings.join("\n   ")}\n   allowed: ${c.allowedDecisions.join("; ")}`);
}
module.exports = { summarise, MIN_DAYS, MIN_GROUP };
