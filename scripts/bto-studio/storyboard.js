"use strict";
// BTO Premium Studio storyboard drafting. Two optional starting points for the Visual Director:
//   autoDraft(script, style)  - deterministic, free: one scene per narration line from the generic components
//                               (headline kinetic type + evidence citations + rotating transitions). It always passes
//                               validation but is deliberately plain: a draft to direct, not a finished storyboard.
//   claudeDraft(script, style) - optional LLM draft through the repository's budget-guarded client
//                               (core/llm/client.js, task "scene-spec": Haiku 5.5 by default). Dry-run unless
//                               BTO_STUDIO_LLM=run AND the channel's llm-budget.json allows paid calls with a
//                               single-use approval. Every call (dry or real) is logged with its token/cost estimate
//                               to out/llm-usage.json. The draft is validated before it can be adopted.
// Ordinary rendering of a directed storyboard never calls a model.
const fs = require("fs");
const path = require("path");

const TRANSITIONS = ["push", "match-zoom", "scan-wipe", "iris"];
const STOP = new Set("the a an and of to in on for that this it its is are was were be by with from as at or they them their these those".split(" "));

function keyPhrase(text, max = 4) {
  const ws = text.replace(/[.,;:!?]/g, "").split(/\s+/); const keep = ws.filter((w) => !STOP.has(w.toLowerCase()));
  return (keep.length ? keep : ws).slice(0, max).join(" ");
}

function autoDraft(script, style) {
  const lines = script.lines;
  const scenes = lines.map((l, i) => {
    const ev = l.evidenceSuggested.length ? l.evidenceSuggested : [script.facts[0].id];
    const evText = ev.map((id) => script.facts.find((f) => f.id === id)).map((f) => f.claim + " " + f.quote).join(" ");
    // only keep numbers the cited facts contain
    const phrase = keyPhrase(l.text).split(" ").filter((w) => !/\d/.test(w) || evText.includes(w.replace(/\D/g, ""))).join(" ") || keyPhrase(l.text);
    return {
      id: `s${i + 1}-${l.role.toLowerCase().replace(/_/g, "-")}`, lines: [l.id], start: i === 0 ? 0 : `${l.id}-0.15`,
      ...(i ? { transition: { type: TRANSITIONS[(i - 1) % TRANSITIONS.length], dur: 0.5 } } : {}),
      visualPurpose: `AUTO-DRAFT: replace with the mechanism this line needs to show (${l.role}). Headline only for now.`,
      evidence: ev, chips: ["illustrationLabel"],
      camera: [{ at: i === 0 ? 0 : `${l.id}-0.15`, x: 540, y: 800, z: 1 }, { at: `${l.id}.end`, x: 540, y: 790, z: 1.05 }],
      layers: [{ component: "desk-grain", depth: 0.3, props: { seed: 11 + i } },
        { component: "kinetic-type", props: { items: [{ at: l.id, text: phrase, x: 540, y: 700, size: style.type.scale.headline, family: i === 0 ? "serif" : "sans" }] } }],
    };
  });
  return { schema: "bto-studio.storyboard.v1", channel: script.channel, topicId: script.topicId, slug: script.slug, version: 1, author: "autoDraft (deterministic; needs visual-director review)",
    treatment: { educationalObjective: `Answer: ${script.coreQuestion} (auto-draft: replace with the specific understanding the viewer should leave with).`, visualHook: "AUTO-DRAFT: frame 0 must show the object and the unexpected detail; replace this headline-only opening.", mechanismsToAnimate: ["to be directed"], factualRisks: ["auto-draft: no mechanism drawn yet"] },
    scenes, tail: 1.0 };
}

async function claudeDraft(script, style, { ledger, log = () => {}, env = process.env } = {}) {
  const Channel = require("../../core/channel-context"); const Llm = require("../../core/llm/client");
  const channel = Channel.getChannel(script.channel);
  const components = require("./validate").COMPONENTS;
  const system = [
    "You are the Visual Director of 'The Hidden Logic of Things', a premium educational YouTube Shorts channel.",
    "Write a storyboard JSON (schema bto-studio.storyboard.v1) for an existing, fact-checked narration. Do not change the narration.",
    "Every scene: id s<n>-<slug>, lines it covers (in order, all lines covered), start anchor (0 for the first; anchors are numbers, 'L3', 'L3.end', 'L3:word', 'L3:word#2', optional +/-seconds),",
    "a visualPurpose saying what the viewer sees that narration alone cannot show, evidence fact ids it relies on, chips, camera keys and layers of known components only:",
    [...components].join(", ") + ".",
    "Rules: numbers on screen only from cited facts; quotes verbatim from a cited fact; conceptual depictions marked conceptual with the conceptualLabel chip; no repeated transition in a row; at most one dissolve; minimal on-screen text.",
    "Style: " + style.concept,
    "Return only the JSON object.",
  ].join("\n");
  const user = JSON.stringify({ topic: { id: script.topicId, title: script.title, coreQuestion: script.coreQuestion }, lines: script.lines.map(({ id, role, text }) => ({ id, role, text })), facts: script.facts.map(({ id, claim, quote, source }) => ({ id, claim, quote, source })) });
  const run = env.BTO_STUDIO_LLM === "run";
  const client = Llm.createClient(channel, { run, logFile: ledger ? ledger.replace(/\.json$/, ".jsonl") : null });
  const res = await client.call("scene-spec", { system, user }, { videoId: script.topicId, pool: "experiment", format: "premium-storyboard" });
  const usage = { at: new Date().toISOString(), task: "scene-spec", model: res.route ? res.route.model : (res.record || {}).model, dryRun: !!res.dryRun, estimateUsd: res.maxUsd != null ? res.maxUsd : (res.record || {}).estimateUsd, actualUsd: res.actualUsd || 0, usage: res.usage || null };
  if (ledger) { const prev = fs.existsSync(ledger) ? JSON.parse(fs.readFileSync(ledger, "utf8")) : { calls: [] }; prev.calls.push(usage); prev.totalUsd = +prev.calls.reduce((a, c) => a + (c.actualUsd || 0), 0).toFixed(6); fs.writeFileSync(ledger, JSON.stringify(prev, null, 1) + "\n"); }
  if (res.dryRun) { log(`claude draft: DRY RUN (not sent): ${usage.model}, worst case $${usage.estimateUsd}; set BTO_STUDIO_LLM=run with an approved budget to send. Using the deterministic draft.`); return autoDraft(script, style); }
  const text = res.text.trim().replace(/^```(?:json)?\s*|\s*```$/g, "");
  const draft = JSON.parse(text); draft.author = `claudeDraft ${usage.model} (needs visual-director review)`; log(`claude draft: ${usage.model}, $${usage.actualUsd}`);
  return draft;
}

module.exports = { autoDraft, claudeDraft, keyPhrase };
