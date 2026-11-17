#!/usr/bin/env node
"use strict";
// Baseline analytics for the four premium channels, from the committed YouTube Analytics warehouse (read-only; no API
// call, nothing written outside reports/). Shorts and long-form are never pooled. A metric the warehouse does not hold
// (Shorts feed "viewed vs swiped away", impressions, CTR, retention curves) is reported as unavailable, never as zero.
//   node scripts/growth/premium-baseline.js [--write]      -> reports/premium-baseline.md (+ .json)
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..", "..");
const J = (f) => { try { return JSON.parse(fs.readFileSync(path.join(ROOT, f), "utf8")); } catch (e) { return null; } };
const rowsOf = (d) => (Array.isArray(d) ? d : d && Array.isArray(d.rows) ? d.rows : []);

// warehouse location per channel (Failure Reconstructed predates channel folders and keeps the root warehouse);
// GoalLore Lab inherited the YouTube channel of the retired CriticalThread, so its history is that warehouse
const CHANNELS = [
  { slug: "impossible-brief", name: "ImpossibleBrief", wh: "channels/impossible-brief/analytics/warehouse", pub: "channels/impossible-brief/state/published.json" },
  { slug: "failure-reconstructed", name: "Failure Reconstructed", wh: "analytics/warehouse", pub: "icerik/yayinlananlar.json" },
  { slug: "behind-the-ordinary", name: "The Hidden Logic of Things", wh: "channels/behind-the-ordinary/analytics/warehouse", pub: "channels/behind-the-ordinary/state/published.json" },
  { slug: "goal-lore-lab", name: "GoalLore Lab (history: CriticalThread uploads, deleted)", wh: "channels/critical-thread/analytics/warehouse", pub: "channels/critical-thread/state/published.json" },
];
const median = (a) => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const r1 = (v) => (v == null || !Number.isFinite(v) ? null : Math.round(v * 10) / 10);

function channelReport(c) {
  const rows = rowsOf(J(path.join(c.wh, "video_daily.json")));
  const traffic = rowsOf(J(path.join(c.wh, "traffic_daily.json")));
  const pubRaw = J(c.pub); const pub = rowsOf(pubRaw).length ? rowsOf(pubRaw) : Array.isArray(pubRaw) ? pubRaw : [];
  const title = new Map(pub.filter((p) => p && p.videoId).map((p) => [p.videoId, p.baslik || p.title || p.slug || ""]));
  const byVideo = new Map();
  for (const r of rows) { const v = byVideo.get(r.videoId) || { videoId: r.videoId, type: r.contentType || "unknown", days: 0, views: 0, minutes: 0, subs: 0, likes: 0, comments: 0, shares: 0, pctW: 0, first: r.day };
    v.days += 1; v.views += r.views || 0; v.minutes += r.estimatedMinutesWatched || 0; v.subs += (r.subscribersGained || 0) - (r.subscribersLost || 0); v.likes += r.likes || 0; v.comments += r.comments || 0; v.shares += r.shares || 0;
    if (r.averageViewPercentage != null && r.views) v.pctW += r.averageViewPercentage * r.views; if (r.day < v.first) v.first = r.day; byVideo.set(r.videoId, v); }
  const vids = [...byVideo.values()].map((v) => ({ ...v, title: title.get(v.videoId) || "(title not in ledger)", avgPct: v.views ? r1(v.pctW / v.views) : null, avgSec: v.views ? r1((v.minutes * 60) / v.views) : null }));
  const groups = {};
  for (const type of [...new Set(vids.map((v) => v.type))]) { const g = vids.filter((v) => v.type === type);
    groups[type] = { videos: g.length, views: g.reduce((s, v) => s + v.views, 0), medianViews: median(g.map((v) => v.views)), medianAvgPct: r1(median(g.map((v) => v.avgPct).filter((x) => x != null))),
      medianAvgSec: r1(median(g.map((v) => v.avgSec).filter((x) => x != null))), netSubs: g.reduce((s, v) => s + v.subs, 0), engagement: g.reduce((s, v) => s + v.likes + v.comments + v.shares, 0),
      top: [...g].sort((a, b) => b.views - a.views).slice(0, 3).map((v) => ({ title: v.title, views: v.views, avgPct: v.avgPct, subs: v.subs })),
      bottom: [...g].sort((a, b) => a.views - b.views).slice(0, 3).map((v) => ({ title: v.title, views: v.views, avgPct: v.avgPct, subs: v.subs })) }; }
  const src = {}; for (const t of traffic) src[t.source] = (src[t.source] || 0) + (t.views || 0);
  const days = rows.map((r) => r.day).sort();
  return { channel: c.slug, name: c.name, warehouse: c.wh, from: days[0] || null, to: days[days.length - 1] || null, videos: vids.length, groups, trafficViews: src,
    unavailable: ["Shorts feed impressions / viewed vs swiped away (not in the Analytics API report this warehouse stores)", "thumbnail impressions and CTR", "per-second audience retention curves", "returning viewers", "geography and activity times (not loaded)"] };
}

function markdown(all) {
  const L = ["# Premium channels: baseline analytics", "", `Generated ${new Date().toISOString()} from the committed YouTube Analytics warehouse (read-only). Shorts and long-form are reported separately. Metrics this warehouse does not hold are listed as unavailable, never as zero. Small samples: no figure below is statistically conclusive.`, ""];
  for (const c of all) {
    L.push(`## ${c.name}`, "", `Warehouse \`${c.warehouse}\`, ${c.from || "no data"} → ${c.to || "no data"}, ${c.videos} videos with data.`, "");
    if (!c.videos) { L.push("No measured videos.", ""); continue; }
    L.push("| format | videos | views | median views | median avg % viewed | median avg view (s) | net subs | likes+comments+shares |", "|---|---|---|---|---|---|---|---|");
    for (const [type, g] of Object.entries(c.groups)) L.push(`| ${type} | ${g.videos} | ${g.views} | ${g.medianViews} | ${g.medianAvgPct ?? "unavailable"} | ${g.medianAvgSec ?? "unavailable"} | ${g.netSubs} | ${g.engagement} |`);
    L.push("");
    for (const [type, g] of Object.entries(c.groups)) { L.push(`**${type}: most viewed**`, ...g.top.map((v) => `- ${v.title}: ${v.views} views, ${v.avgPct ?? "?"}% viewed, ${v.subs} net subs`), "", `**${type}: least viewed**`, ...g.bottom.map((v) => `- ${v.title}: ${v.views} views, ${v.avgPct ?? "?"}% viewed`), ""); }
    const src = Object.entries(c.trafficViews).sort((a, b) => b[1] - a[1]); const tot = src.reduce((s, x) => s + x[1], 0);
    if (tot) L.push("Traffic sources (views, all formats): " + src.slice(0, 6).map(([k, v]) => `${k} ${Math.round((100 * v) / tot)}%`).join(", "), "");
    L.push("Unavailable here: " + c.unavailable.join("; ") + ".", "");
  }
  return L.join("\n") + "\n";
}

if (require.main === module) {
  const all = CHANNELS.map(channelReport); const md = markdown(all);
  if (process.argv.includes("--write")) { fs.writeFileSync(path.join(ROOT, "reports/premium-baseline.md"), md); fs.writeFileSync(path.join(ROOT, "reports/premium-baseline.json"), JSON.stringify(all, null, 1) + "\n"); }
  process.stdout.write(md);
}
module.exports = { channelReport, markdown, CHANNELS };
