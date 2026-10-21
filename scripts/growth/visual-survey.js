#!/usr/bin/env node
"use strict";

// Visual survey: run the production licensed-picture pre-check ahead of time for the topics nearest
// the selection bar and record the measured counts (core/growth/visual-survey.js). Needs network
// (Wikimedia Commons, NASA, Pexels); run it in GitHub Actions (.github/workflows/topic-buffer.yml).
//
//   node scripts/growth/visual-survey.js --channel impossible-brief [--limit 30] [--margin 4] [--refresh] [--dry-run]
//
// Candidates: unused topics in a selectable bucket whose ViralPotential is within --margin of the
// minimum (or above it), plus topics blocked only by the visual pre-check. Writes only
// channels/<slug>/state/visual-survey.json (not with --dry-run). Never renders, uploads or changes
// a threshold; prints the qualified buffer before and after.

const fs = require("fs");
const os = require("os");
const path = require("path");
const Channel = require("../../core/channel-context");
const Discovery = require("../../core/discovery");
const Config = require("../../core/growth/config");
const Survey = require("../../core/growth/visual-survey");
const Inventory = require("../../core/growth/inventory");

function arg(argv, name, fallback) { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : fallback; }

function candidates(channel, { margin = 4, limit = 30, refresh = false } = {}) {
  const Growth = require("../../core/growth");
  const config = Config.forChannel(channel);
  const minimum = Number(config.viralScoring.minimumToProduce || 68);
  const buckets = new Set([...(config.selection.exploitBuckets || []), ...(config.selection.exploreBuckets || [])]);
  const blocked = (() => { try { return JSON.parse(fs.readFileSync(path.join(channel.paths.state, "blocked.json"), "utf8")); } catch (error) { return {}; } })();
  const visualOnly = new Set(Object.entries(Array.isArray(blocked) ? {} : blocked).filter(([, entry]) => /^visual pre-check/.test(entry && entry.reason || "")).map(([id]) => id));
  const exclude = [...Discovery.usedIds(channel)].filter((id) => !visualOnly.has(id));
  const data = Survey.load(channel);
  const ranked = Growth.selectShortTopic(channel, { exclude, write: false }).ranked.rows;
  const excluded = new Set(exclude);
  return ranked
    .filter((row) => !excluded.has(row.topic.id) && buckets.has(row.score.bucket) && row.score.ViralPotentialScore >= minimum - margin)
    .filter((row) => refresh || !(data.topics[row.topic.id] && Survey.fresh(data.topics[row.topic.id])))
    .sort((a, b) => b.score.ViralPotentialScore - a.score.ViralPotentialScore)
    .slice(0, limit);
}

function main(argv = process.argv.slice(2), deps = {}) {
  const channel = Channel.getChannel(arg(argv, "--channel", "impossible-brief"));
  if (!Survey.enabled(channel)) throw new Error(`visual survey is not enabled for ${channel.slug} (growth-engine.json visualSurvey.enabled)`);
  const dry = argv.includes("--dry-run");
  const shortfall = deps.shortfall || require("../../core/pipeline/impossible-brief").visualShortfall;
  const prepare = deps.prepare; // tests inject a fake; production uses the pipeline's own prepareAssetsSync
  const work = deps.workDir || fs.mkdtempSync(path.join(os.tmpdir(), `visual-survey-${channel.slug}-`));
  const before = Inventory.qualifiedBuffer(channel);
  const list = candidates(channel, { margin: Number(arg(argv, "--margin", 4)), limit: Number(arg(argv, "--limit", 30)), refresh: argv.includes("--refresh") });
  const universe = new Map(Discovery.universe(channel).topics.map((topic) => [topic.id, topic]));
  const data = Survey.load(channel);
  const results = [];
  for (const row of list) {
    const raw = universe.get(row.topic.id); // exactly what the pipeline pre-checks
    const output = path.join(work, raw.slug);
    let assets = null;
    const capture = (topicFile, directory) => { assets = (prepare || require("../../core/rendering/topic-visuals").prepareAssetsSync)(topicFile, directory) || {}; return assets; };
    let gap;
    try { gap = shortfall(raw, output, capture); }
    catch (error) { assets = { error: error.message }; gap = null; }
    const entry = Survey.record(data, raw, assets || { error: "pre-check did not run" }, gap);
    results.push({ id: raw.id, slug: raw.slug, viral: row.score.ViralPotentialScore, bucket: row.score.bucket, ...entry, samples: undefined });
    console.log(`${raw.id} ${raw.slug} viral ${row.score.ViralPotentialScore}: ${entry.sourceError ? "SOURCE ERROR " + entry.sourceError : entry.passesPrecheck ? `PASS (${entry.licensedStills} stills, ${entry.licensedClips} clips)` : "FAIL " + entry.shortfall}`);
  }
  if (!dry) Survey.save(channel, data);
  require("../../core/growth/config").clearCache();
  const after = dry ? null : Inventory.qualifiedBuffer(channel);
  const report = { channel: channel.slug, dryRun: dry, surveyed: results.length, passed: results.filter((r) => r.passesPrecheck).length, failed: results.filter((r) => !r.passesPrecheck && !r.sourceError).length, sourceErrors: results.filter((r) => r.sourceError).length, before, after, results };
  console.log(`qualified buffer before: ${before.qualified} (${before.status})${after ? `; after: ${after.qualified} (${after.status}), ${after.visuallyVerified} visually verified` : " (dry run: nothing written)"}`);
  return report;
}

if (require.main === module) {
  try {
    const report = main();
    const out = arg(process.argv, "--report", null);
    if (out) fs.writeFileSync(out, JSON.stringify(report, null, 2) + "\n");
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}

module.exports = { main, candidates };
