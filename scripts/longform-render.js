#!/usr/bin/env node
"use strict";

// Renders ONE approved long-form package (a growth package JSON whose script
// passed generation, fact-check and the quality gate) into an MP4 with the
// existing long-video chain. Never uploads and never touches YouTube.
//
//   node scripts/longform-render.js <channel> <package.json>

const fs = require("fs");
const Channel = require("../core/channel-context");
const Lane = require("../core/growth/lane");

const [slug, file] = process.argv.slice(2);
if (!slug || !file) { console.error("usage: node scripts/longform-render.js <channel> <package.json>"); process.exit(2); }
const channel = Channel.getChannel(slug);
const pkg = JSON.parse(fs.readFileSync(file, "utf8"));
const script = pkg.script || {};
const decision = pkg.readiness && pkg.readiness.decision;
if (!String(script.generator || "").startsWith("llm:") || script.status !== "COMPLETE" || decision !== "PUBLISH") {
  console.error(`refusing to render: generator=${script.generator} status=${script.status} decision=${decision}`);
  process.exit(1);
}
const result = Lane.renderLongform(channel, pkg);
console.log(JSON.stringify(result, null, 2));
process.exit(result.ok ? 0 : 1);
