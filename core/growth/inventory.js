"use strict";

// Qualified topic buffer: how many days of Shorts the channel can still select under the current
// quality bar (bucket + ViralPotential minimum, unused, not blocked), and how many of those have
// licensed pictures measured by the visual survey. "N days of unused topics" is NOT this number:
// 2026-10-21 ImpossibleBrief reported 474 unused topics and had 0 selectable ones.
// Read-only: no state is written, nothing is rendered, the quality bar is never changed.

const Config = require("./config");

function selectableRows(channel, options = {}) {
  const Growth = require("./index");
  const exclude = options.exclude || [...require("../discovery").usedIds(channel)];
  const config = Config.forChannel(channel);
  const minimum = Number(config.viralScoring.minimumToProduce || 68);
  const buckets = new Set([...(config.selection.exploitBuckets || []), ...(config.selection.exploreBuckets || []), ...(config.scheduler.shorts.fallbackToC ? [config.scheduler.shorts.experimentalBucket] : [])]);
  const selection = Growth.selectShortTopic(channel, { exclude, write: false, date: options.date });
  const excluded = new Set(exclude);
  const rows = selection.ranked.rows.filter((row) => !excluded.has(row.topic.id) && !excluded.has(row.topic.slug)
    && buckets.has(row.score.bucket) && Number.isFinite(row.score.ViralPotentialScore) && row.score.ViralPotentialScore >= minimum);
  return { rows, selection, minimum, buckets: [...buckets] };
}

function qualifiedBuffer(channel, options = {}) {
  const targetDays = options.targetDays || 7;
  const perDay = (channel.config.publishingCadence && channel.config.publishingCadence.shorts && channel.config.publishingCadence.shorts.everyDays) ? 1 / channel.config.publishingCadence.shorts.everyDays : 1;
  try {
    const { rows, selection, minimum, buckets } = selectableRows(channel, options);
    const verified = rows.filter((row) => row.topic.visualSurvey && row.topic.visualSurvey.passesPrecheck).length;
    const days = Math.floor(rows.length / perDay);
    const status = rows.length === 0 ? "critical" : days < targetDays ? "warning" : "ok";
    return {
      channel: channel.slug, status, qualified: rows.length, visuallyVerified: verified, days, targetDays, viralMinimum: minimum, buckets,
      next: rows.slice(0, targetDays).map((row) => ({ id: row.topic.id, slug: row.topic.slug, bucket: row.score.bucket, viral: row.score.ViralPotentialScore, visualsVerified: !!(row.topic.visualSurvey && row.topic.visualSurvey.passesPrecheck) })),
      reason: rows.length ? null : selection.reason,
    };
  } catch (error) {
    return { channel: channel.slug, status: "unknown", qualified: null, reason: `could not evaluate: ${String(error.message).slice(0, 160)}` };
  }
}

module.exports = { selectableRows, qualifiedBuffer };
