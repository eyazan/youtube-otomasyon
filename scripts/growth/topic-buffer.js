#!/usr/bin/env node
"use strict";

// Qualified topic buffer preflight for the Shorts channels (core/growth/inventory.js), including the legacy FR lane.
// Read-only. Prints a Markdown table; --json for machine output; --strict exits 3 when any listed
// channel is below the buffer target (for a workflow gate before the production slot).
//   node scripts/growth/topic-buffer.js [--channel impossible-brief] [--days 7] [--json] [--strict]

const Channel = require("../../core/channel-context");
const Inventory = require("../../core/growth/inventory");

const DEFAULT_CHANNELS = ["failure-reconstructed", "impossible-brief", "critical-thread"];

function main(argv = process.argv.slice(2)) {
  const pick = argv.includes("--channel") ? [argv[argv.indexOf("--channel") + 1]] : DEFAULT_CHANNELS;
  const targetDays = argv.includes("--days") ? Number(argv[argv.indexOf("--days") + 1]) : 7;
  const rows = pick.map((slug) => Inventory.qualifiedBuffer(Channel.getChannel(slug), { targetDays }));
  if (argv.includes("--json")) console.log(JSON.stringify(rows, null, 2));
  else {
    console.log(`| Channel | Status | Qualified | Visually verified | Days / target | Next | Reason |\n|---|---|---|---|---|---|---|`);
    for (const r of rows) console.log(`| ${r.channel} | ${String(r.status).toUpperCase()} | ${r.qualified ?? "?"} | ${r.visuallyVerified ?? "?"} | ${r.days ?? "?"} / ${targetDays} | ${(r.next || []).slice(0, 3).map((n) => `${n.slug} (${n.viral})`).join(", ") || "-"} | ${r.reason ? String(r.reason).slice(0, 220) : ""} |`);
  }
  return argv.includes("--strict") && rows.some((r) => r.status !== "ok") ? 3 : 0;
}

if (require.main === module) process.exitCode = main();
module.exports = { main };
