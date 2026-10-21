"use strict";

// Measured visual availability for evidence-gated Shorts channels (ImpossibleBrief).
//
// The topic scorer used to treat every ImpossibleBrief topic as "no archival footage confirmed"
// (visual_availability 67, weak_footage_risk -33, first_frame_potential 68 for all 500 topics),
// because the only confirmation it read was hand-curated Commons stills, which no IB topic carries.
// The production pipeline then ran the real licensed-picture pre-check only on the topic it had
// already selected, and a failure blocked that topic permanently. 2026-10-03..12 that removed the six
// highest-scoring A topics (76-78) and left the pool at 74 < 75: NO_QUALIFIED_TOPIC on 2026-10-20/21.
//
// scripts/growth/visual-survey.js runs the same pre-check (core/pipeline/impossible-brief.js
// visualShortfall) ahead of time for the topics nearest the bar and commits the measured counts to
// channels/<slug>/state/visual-survey.json. Scoring reads only that committed file (no network at
// ranking time), like core/growth/popularity.js. A topic counts as visually confirmed only when the
// measured licensed pictures/clips pass the production pre-check; the survey never lowers a
// threshold and never adds a picture to a video.
//
// Enabled per channel with growth-engine.json { "visualSurvey": { "enabled": true } }.

const fs = require("fs");
const path = require("path");

const SCHEMA = "growth-visual-survey/1";
const MAX_AGE_DAYS = 45;

function file(channel) { return path.join(channel.paths.state, "visual-survey.json"); }

function enabled(channel) {
  try { return require("./config").forChannel(channel).visualSurvey?.enabled === true; } catch (error) { return false; }
}

const cache = new Map();
function load(channel) {
  const target = file(channel);
  let mtime = 0;
  try { mtime = fs.statSync(target).mtimeMs; } catch (error) { return { schema: SCHEMA, topics: {} }; }
  const hit = cache.get(target);
  if (hit && hit.mtime === mtime) return hit.data;
  let data;
  try { data = JSON.parse(fs.readFileSync(target, "utf8")); } catch (error) { data = null; }
  if (!data || data.schema !== SCHEMA || !data.topics) data = { schema: SCHEMA, topics: {} };
  cache.set(target, { mtime, data });
  return data;
}

function fresh(entry, now = new Date()) {
  const at = Date.parse(entry && entry.measuredAt);
  return Number.isFinite(at) && (now.getTime() - at) / 86400000 <= MAX_AGE_DAYS;
}

// The measured entry for a raw topic, or null (disabled, never measured, stale, or a source outage).
function forTopic(channel, raw, data = null, now = new Date()) {
  if (!channel || !raw || !enabled(channel)) return null;
  const entry = (data || load(channel)).topics[raw.id];
  if (!entry || entry.sourceError || !fresh(entry, now)) return null;
  return entry;
}

function record(data, topic, assets, shortfall, now = new Date()) {
  const stills = assets.stills || [];
  const clips = assets.clips || [];
  data.topics[topic.id] = {
    slug: topic.slug,
    measuredAt: now.toISOString(),
    licensedStills: stills.length,
    licensedClips: clips.length,
    passesPrecheck: !assets.error && !shortfall,
    shortfall: assets.error ? null : shortfall || null,
    sourceError: assets.error ? String(assets.error).slice(0, 200) : null,
    // Attribution evidence for review; the render still re-runs its own licensing and relevance gates.
    samples: stills.slice(0, 6).map((still) => ({ file: still.file, licence: still.licence || null, sourceUrl: still.sourceUrl || null })),
  };
  return data.topics[topic.id];
}

function save(channel, data) {
  fs.mkdirSync(path.dirname(file(channel)), { recursive: true });
  const sorted = Object.fromEntries(Object.entries(data.topics).sort(([a], [b]) => a.localeCompare(b)));
  fs.writeFileSync(file(channel), JSON.stringify({ schema: SCHEMA, updatedAt: new Date().toISOString(), maxAgeDays: MAX_AGE_DAYS, topics: sorted }, null, 2) + "\n");
}

module.exports = { SCHEMA, MAX_AGE_DAYS, file, enabled, load, fresh, forTopic, record, save };
