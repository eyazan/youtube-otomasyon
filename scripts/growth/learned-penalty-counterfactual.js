#!/usr/bin/env node
"use strict";

// Read-only comparison of the Shorts topic ranking under alternative rules for the LEARNED parts of the viral score
// (core/growth/topic-scoring.js historical_similarity, subscriber_conversion_potential, recent_fatigue_risk), computed
// from the same context the production selector builds. Nothing is written; production scoring is not changed.
//   node scripts/growth/learned-penalty-counterfactual.js [--channel impossible-brief] [--min 5] [--k 5] [--json out.json]
// Variants:
//   current      production rules
//   unitFix      subscriberConversion is stored per view; the component reads it as per 1,000 views (x1000)
//   minSample    a cluster with fewer than --min uploads keeps the neutral prior (score 50, conversion = series proxy)
//   shrink       cluster score shrunk toward 50 with --k pseudo-uploads; conversion only from >= --min samples (x1000)
//   noDiversity  the 30-day same-cluster fatigue penalty removed (shows what the diversity constraint costs; not a proposal)

const Channel = require("../../core/channel-context");
const Context = require("../../core/growth/context");
const Growth = require("../../core/growth");

function variants(min, k) {
  const each = (fn) => (ctx) => { for (const g of Object.values(ctx.clusterPerformance)) fn(g); return ctx; };
  return {
    current: (ctx) => ctx,
    unitFix: each((g) => { if (g.subscriberConversion != null) g.subscriberConversion *= 1000; }),
    minSample: each((g) => { if (g.n < min) { g.score = 50; g.subscriberConversion = null; } }),
    shrink: each((g) => { g.score = Math.round((g.scores.length * g.score + k * 50) / (g.scores.length + k)); g.subscriberConversion = g.subscribers.length >= min && g.subscriberConversion != null ? g.subscriberConversion * 1000 : null; }),
    noDiversity: each((g) => { g.recentN = 0; }),
  };
}

function run({ channel = "impossible-brief", min = 5, k = 5, date } = {}) {
  const ch = Channel.getChannel(channel);
  const config = require("../../core/growth/config").forChannel(ch);
  const minimum = Number(config.viralScoring.minimumToProduce || 68);
  const buckets = new Set(config.selection.exploitBuckets || ["A"]);
  const used = [...require("../../core/discovery").usedIds(ch)]; const excluded = new Set(used);
  const out = {};
  for (const [name, fn] of Object.entries(variants(min, k))) {
    const context = fn(Context.build(ch));
    const s = Growth.selectShortTopic(ch, { exclude: used, write: false, date, context });
    out[name] = Object.fromEntries(s.ranked.rows.filter((r) => !excluded.has(r.topic.id) && !excluded.has(r.topic.slug))
      .map((r) => [r.topic.id, { viral: r.score.ViralPotentialScore, bucket: r.score.bucket, cluster: r.topic.cluster, title: r.topic.title }]));
  }
  const qualified = (n) => Object.entries(out[n]).filter(([, r]) => r.viral >= minimum && buckets.has(r.bucket)).map(([id]) => id);
  const perf = Context.build(ch).clusterPerformance;
  return { channel, minimum, min, k, clusters: perf, variants: Object.fromEntries(Object.keys(out).map((n) => [n, { qualified: qualified(n), newlyQualified: qualified(n).filter((id) => !qualified("current").includes(id)) }])), rows: out };
}

if (require.main === module) {
  const a = process.argv.slice(2); const opt = (f, d) => (a.includes(f) ? a[a.indexOf(f) + 1] : d);
  const r = run({ channel: opt("--channel", "impossible-brief"), min: +opt("--min", 5), k: +opt("--k", 5) });
  console.log(`| Variant | Qualified (primary bucket, viral >= ${r.minimum}) | Newly qualified |\n|---|---|---|`);
  for (const [n, v] of Object.entries(r.variants)) console.log(`| ${n} | ${v.qualified.length} | ${v.newlyQualified.map((id) => `${id} (${r.rows.current[id].viral}→${r.rows[n][id].viral})`).join(", ") || "-"} |`);
  console.log(`\n| Cluster | Uploads (n) | In last 30 days | Growth scores | Subscriber conversion (per view) |\n|---|---|---|---|---|`);
  for (const [c, g] of Object.entries(r.clusters)) console.log(`| ${c} | ${g.n} | ${g.recentN} | ${g.scores.join(", ") || "-"} | ${g.subscribers.join(", ") || "-"} |`);
  if (opt("--json")) require("fs").writeFileSync(opt("--json"), JSON.stringify(r, null, 1) + "\n");
}
module.exports = { run, variants };
