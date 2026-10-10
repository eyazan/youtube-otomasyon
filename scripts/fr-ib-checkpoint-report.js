#!/usr/bin/env node
"use strict";

// Prints the long-form generation checkpoint(s) and provider usage for one
// channel's sandbox (GROWTH_STATE_ROOT): stages, status, failing stage, token
// usage and rate-limit waits. Metadata only — never prompts, outputs or keys.
//
//   node scripts/fr-ib-checkpoint-report.js <channel> [label]

const fs = require("fs");
const path = require("path");

const [channel, label = "checkpoint"] = process.argv.slice(2);
const root = process.env.GROWTH_STATE_ROOT;
if (!channel || !root) { console.log("checkpoint report: channel and GROWTH_STATE_ROOT required"); process.exit(0); }
const dir = path.join(root, channel, "state", "longform");
const read = (file) => { try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch (error) { return null; } };

const generations = (() => { try { return fs.readdirSync(path.join(dir, "generation")).filter((name) => /\.json$/.test(name) && !/\.stale\.json$/.test(name)); } catch (error) { return []; } })();
console.log(`== ${label}: ${channel} — ${generations.length} generation checkpoint(s)`);
for (const name of generations) {
  const state = read(path.join(dir, "generation", name));
  if (!state) continue;
  const sections = state.stages && state.stages.sections || {};
  const done = Object.entries(sections).filter(([, value]) => value.status === "COMPLETE").map(([key]) => key);
  const unsupported = Object.entries(sections).filter(([, value]) => value.status === "UNSUPPORTED").map(([key]) => key);
  console.log(JSON.stringify({
    slug: state.slug,
    schema: state.schema,
    promptVersion: state.key && state.key.promptVersion,
    model: state.key && state.key.model,
    status: state.status,
    runs: state.runs,
    lastCompletedStage: state.lastCompletedStage || null,
    blueprint: !!state.blueprint,
    sectionsComplete: done,
    sectionsUnsupported: unsupported,
    review: state.stages && state.stages.review ? { status: state.stages.review.status, minutes: state.stages.review.minutes, hardFails: state.stages.review.hardFails } : null,
    error: state.error || null,
    usage: state.usage || null,
  }, null, 2));
}
const events = read(path.join(dir, "provider-events.json")) || [];
const count = (type) => events.filter((event) => event.event === type).length;
const tokens = events.filter((event) => event.event === "success").reduce((sum, event) => ({
  input: sum.input + (event.usage && event.usage.input_tokens || 0), output: sum.output + (event.usage && event.usage.output_tokens || 0) }), { input: 0, output: 0 });
const waits = events.filter((event) => event.event === "throttle_wait" || event.event === "retry_scheduled").reduce((sum, event) => sum + (event.delayMs || 0), 0);
const lastLimit = [...events].reverse().find((event) => event.limitTokens != null);
console.log(JSON.stringify({
  providerEvents: events.length,
  requests: count("request"),
  successes: count("success"),
  deferred: count("deferred"),
  failed: count("failed"),
  throttleWaits: count("throttle_wait"),
  retries: count("retry_scheduled"),
  waitedSeconds: Math.round(waits / 1000),
  tokens,
  observedTokensPerMinuteLimit: lastLimit ? lastLimit.limitTokens : null,
  remainingRequestsToday: lastLimit ? lastLimit.remainingRequests : null,
  lastError: (() => { const last = [...events].reverse().find((event) => event.event === "deferred" || event.event === "failed"); return last ? { stage: last.stage, code: last.code, status: last.status, message: last.message || null } : null; })(),
}, null, 2));
