#!/usr/bin/env node
"use strict";
// Read-only YouTube audit for the premium channels: what the API actually holds, not what we think we sent.
//   - channel settings (snippet, brandingSettings, status, statistics)
//   - the latest uploads: snippet (language, category, tags), status (made-for-kids, synthetic-media disclosure,
//     privacy), contentDetails (duration, caption flag), caption tracks
//   - per-video YouTube Analytics: views, average view duration and percentage, subscribers, shares, and the
//     audience-retention curve (elapsedVideoTimeRatio x audienceWatchRatio / relativeRetentionPerformance)
// Writes reports/youtube-audit/<slug>.json and reports/youtube-audit/README.md. Never writes to YouTube.
//
// usage: node scripts/growth/youtube-audit.js [--channels a,b] [--latest 12] [--out reports/youtube-audit]
const fs = require("fs");
const path = require("path");
const Channel = require("../../core/channel-context");
const yt = require("../../lib/yt");

const ROOT = path.join(__dirname, "..", "..");
const arg = (name, def) => { const i = process.argv.indexOf("--" + name); return i > 0 ? process.argv[i + 1] : def; };
const CHANNELS = String(arg("channels", "impossible-brief,failure-reconstructed,behind-the-ordinary,goal-lore-lab")).split(",").filter(Boolean);
const LATEST = Number(arg("latest", 12));
const OUT = path.join(ROOT, arg("out", "reports/youtube-audit"));
const today = new Date().toISOString().slice(0, 10);

// retention points reported (fraction of the video): 0.1 of a 30 s Short is the 3 s hook window
const RET_POINTS = [0.05, 0.1, 0.25, 0.5, 0.75, 0.95];

function pick(rows, ratio) {
  let best = null;
  for (const r of rows) if (!best || Math.abs(r.elapsedVideoTimeRatio - ratio) < Math.abs(best.elapsedVideoTimeRatio - ratio)) best = r;
  return best;
}

async function auditChannel(slug) {
  const channel = Channel.getChannel(slug);
  const res = { slug, name: channel.name, auditedAt: new Date().toISOString(), errors: [] };
  let client;
  try {
    client = await yt.getYouTubeClient(channel);
  } catch (e) {
    res.errors.push("auth: " + (e.code || "") + " " + e.message);
    return res;
  }
  const api = client.api;
  res.scopes = client.scopes;
  res.identity = client.identity;
  const ch = await api.data("channels?part=snippet,brandingSettings,status,statistics,contentDetails,topicDetails&mine=true");
  if (!ch.ok || !ch.veri.items || !ch.veri.items.length) { res.errors.push("channels.list: " + (ch.neden || "empty")); return res; }
  const c = ch.veri.items[0];
  res.channel = {
    id: c.id,
    title: c.snippet.title,
    customUrl: c.snippet.customUrl || null,
    description: c.snippet.description || "",
    country: c.snippet.country || null,
    defaultLanguage: c.snippet.defaultLanguage || null,
    publishedAt: c.snippet.publishedAt,
    keywords: (c.brandingSettings && c.brandingSettings.channel && c.brandingSettings.channel.keywords) || null,
    brandingDefaultLanguage: (c.brandingSettings && c.brandingSettings.channel && c.brandingSettings.channel.defaultLanguage) || null,
    unsubscribedTrailer: (c.brandingSettings && c.brandingSettings.channel && c.brandingSettings.channel.unsubscribedTrailer) || null,
    hasBanner: !!(c.brandingSettings && c.brandingSettings.image && c.brandingSettings.image.bannerExternalUrl),
    madeForKids: c.status ? c.status.madeForKids : null,
    selfDeclaredMadeForKids: c.status ? c.status.selfDeclaredMadeForKids : null,
    privacyStatus: c.status ? c.status.privacyStatus : null,
    longUploadsStatus: c.status ? c.status.longUploadsStatus : null,
    statistics: c.statistics,
    topicCategories: (c.topicDetails && c.topicDetails.topicCategories) || [],
  };
  // latest uploads
  const up = c.contentDetails.relatedPlaylists.uploads;
  const pl = await api.data(`playlistItems?part=contentDetails&maxResults=${Math.min(50, LATEST)}&playlistId=${up}`);
  const ids = pl.ok ? (pl.veri.items || []).map((i) => i.contentDetails.videoId) : [];
  if (!pl.ok) res.errors.push("playlistItems: " + pl.neden);
  const vids = ids.length ? await yt.videolar(api, ids) : [];
  // videolar() asks snippet,statistics,contentDetails,status — enough for language/category/disclosure
  res.videos = [];
  for (const v of vids) {
    const row = {
      id: v.id,
      title: v.snippet.title,
      publishedAt: v.snippet.publishedAt,
      durationSec: yt.sureSn(v.contentDetails.duration),
      categoryId: v.snippet.categoryId,
      defaultLanguage: v.snippet.defaultLanguage || null,
      defaultAudioLanguage: v.snippet.defaultAudioLanguage || null,
      tags: (v.snippet.tags || []).length,
      descriptionChars: (v.snippet.description || "").length,
      descriptionFirstLine: (v.snippet.description || "").split("\n")[0].slice(0, 140),
      hashtagsInDescription: ((v.snippet.description || "").match(/#\w+/g) || []).length,
      captionFlag: v.contentDetails.caption,
      licensedContent: v.contentDetails.licensedContent,
      privacyStatus: v.status.privacyStatus,
      madeForKids: v.status.madeForKids,
      selfDeclaredMadeForKids: v.status.selfDeclaredMadeForKids,
      containsSyntheticMedia: v.status.containsSyntheticMedia === undefined ? null : v.status.containsSyntheticMedia,
      embeddable: v.status.embeddable,
      license: v.status.license,
      publicStats: v.statistics,
    };
    res.videos.push(row);
  }
  res.videos.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  // caption tracks for the 5 newest (captions.list costs 50 units each)
  for (const row of res.videos.slice(0, 5)) {
    const cap = await api.data("captions?part=snippet&videoId=" + row.id);
    row.captionTracks = cap.ok ? (cap.veri.items || []).map((t) => `${t.snippet.language}:${t.snippet.trackKind}${t.snippet.isAutoSynced ? ":auto-synced" : ""}`) : ["unavailable: " + cap.neden];
  }
  // analytics per video, lifetime to yesterday
  const end = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  for (const row of res.videos) {
    const start = row.publishedAt.slice(0, 10);
    if (start > end) { row.analytics = { note: "published today; no analytics day yet" }; continue; }
    const q = await api.analytics({ startDate: start, endDate: end, metrics: "views,estimatedMinutesWatched,averageViewDuration,averageViewPercentage,subscribersGained,subscribersLost,likes,shares,comments", filters: "video==" + row.id });
    const r = yt.satirlar(q)[0];
    row.analytics = q.ok ? (r || { views: 0 }) : { unavailable: q.neden };
    if (q.ok && r && r.views > 0) {
      const rq = await api.analytics({ startDate: start, endDate: end, dimensions: "elapsedVideoTimeRatio", metrics: "audienceWatchRatio,relativeRetentionPerformance", filters: "video==" + row.id });
      const rows = yt.satirlar(rq);
      if (rq.ok && rows.length) {
        row.retention = Object.fromEntries(RET_POINTS.map((p) => {
          const x = pick(rows, p);
          return [String(p), { watch: +Number(x.audienceWatchRatio).toFixed(3), relative: +Number(x.relativeRetentionPerformance).toFixed(3) }];
        }));
      } else row.retention = { unavailable: rq.neden || "no rows" };
      const tq = await api.analytics({ startDate: start, endDate: end, dimensions: "insightTrafficSourceType", metrics: "views", filters: "video==" + row.id });
      const tr = yt.satirlar(tq);
      if (tq.ok) row.traffic = Object.fromEntries(tr.map((t) => [t.insightTrafficSourceType, t.views]));
    }
  }
  return res;
}

function fmt(n, d = 0) { return n === undefined || n === null || Number.isNaN(+n) ? "—" : Number(n).toFixed(d); }

function markdown(all) {
  const L = [`# YouTube audit (live API, read-only) — ${today}`, "",
    "Generated by `scripts/growth/youtube-audit.js`. Values come from the YouTube Data API v3 and YouTube Analytics API",
    "for each channel's own OAuth credentials. Analytics run from publish day to yesterday (UTC).",
    "`ret@10%` is audienceWatchRatio at 10 % of the video (≈3 s of a 30 s Short); `rel@10%` is YouTube's",
    "relativeRetentionPerformance at that point (0.5 = typical for similar-length videos).", ""];
  for (const a of all) {
    L.push(`## ${a.name} (\`${a.slug}\`)`, "");
    if (a.errors.length) L.push("Errors: " + a.errors.map((e) => "`" + e.replace(/\s+/g, " ").slice(0, 200) + "`").join("; "), "");
    if (!a.channel) continue;
    const c = a.channel;
    L.push(`- channel: ${c.title} ${c.customUrl || ""} (${c.id}); subscribers ${c.statistics.subscriberCount}, videos ${c.statistics.videoCount}, views ${c.statistics.viewCount}`,
      `- country: ${c.country || "not set"}; channel defaultLanguage: ${c.defaultLanguage || c.brandingDefaultLanguage || "not set"}; keywords: ${c.keywords ? "`" + c.keywords.slice(0, 120) + "`" : "none"}`,
      `- madeForKids ${c.madeForKids} (self-declared ${c.selfDeclaredMadeForKids}); banner ${c.hasBanner ? "yes" : "no"}; trailer ${c.unsubscribedTrailer ? "yes" : "no"}`,
      `- description (${c.description.length} chars): ${c.description ? "“" + c.description.replace(/\s+/g, " ").slice(0, 220) + "”" : "**empty**"}`, "");
    L.push("| published | title | s | views | avg view s | % viewed | ret@10% | rel@10% | ret@50% | subs +/− | shorts feed % | lang / audio | cat | synthetic | captions |",
      "|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|");
    for (const v of a.videos || []) {
      const an = v.analytics || {};
      const r = v.retention || {};
      const tot = v.traffic ? Object.values(v.traffic).reduce((s, x) => s + x, 0) : 0;
      const sf = tot ? (100 * (v.traffic.SHORTS || 0)) / tot : null;
      L.push(`| ${v.publishedAt.slice(0, 10)} | ${v.title.replace(/\|/g, "/").slice(0, 60)} | ${v.durationSec} | ${fmt(an.views)} | ${fmt(an.averageViewDuration, 1)} | ${fmt(an.averageViewPercentage, 1)} | ${r["0.1"] ? fmt(r["0.1"].watch, 2) : "—"} | ${r["0.1"] ? fmt(r["0.1"].relative, 2) : "—"} | ${r["0.5"] ? fmt(r["0.5"].watch, 2) : "—"} | ${fmt(an.subscribersGained)}/${fmt(an.subscribersLost)} | ${sf === null ? "—" : fmt(sf)} | ${v.defaultLanguage || "∅"} / ${v.defaultAudioLanguage || "∅"} | ${v.categoryId} | ${v.containsSyntheticMedia === null ? "∅" : v.containsSyntheticMedia} | ${v.captionTracks ? v.captionTracks.join(" ") || "none" : v.captionFlag} |`);
    }
    L.push("");
  }
  return L.join("\n") + "\n";
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const all = [];
  for (const slug of CHANNELS) {
    let a;
    try { a = await auditChannel(slug); } catch (e) { a = { slug, name: slug, errors: ["fatal: " + e.message] }; }
    fs.writeFileSync(path.join(OUT, slug + ".json"), JSON.stringify(a, null, 2) + "\n");
    all.push(a);
    console.log(`${slug}: ${(a.videos || []).length} videos, errors ${a.errors.length}`);
  }
  fs.writeFileSync(path.join(OUT, "README.md"), markdown(all));
  console.log(markdown(all));
}

if (require.main === module) main().catch((e) => { console.error(e); process.exit(1); });
module.exports = { markdown, pick };
