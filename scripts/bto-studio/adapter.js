"use strict";
// BTO Premium Studio: script-to-studio adapter.
// Reads an existing researched topic from the channel's topic universe and turns it into the studio's
// narration script, without editing the topic. Readiness is checked here, so a topic that the existing
// pipeline would not produce never reaches the studio:
//   - researchStatus VERIFIED and productionReady (the existing research gate)
//   - every narration line has text, every fact carries a verbatim quote and a source URL
//   - not already published or generated (state/published.json, state/generated.json)
// Each fact gets a stable id (F1..Fn in topic order, plus a short hash of its quote) so storyboard
// scenes can cite the evidence behind what they show.

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const Channel = require("../../core/channel-context");

const ROOT = path.resolve(__dirname, "..", "..");
const sha = (s) => crypto.createHash("sha256").update(String(s)).digest("hex");
const words = (s) => String(s).toLowerCase().replace(/[^a-z0-9 ]+/g, " ").split(/\s+/).filter((w) => w.length > 3);

function readJson(file, fallback) { try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch (e) { return fallback; } }

function loadTopic(channelSlug, idOrSlug) {
  const channel = Channel.getChannel(channelSlug);
  const universe = readJson(channel.paths.topicUniverse, null);
  if (!universe) throw new Error(`no topic universe at ${channel.paths.topicUniverse}`);
  const topic = universe.topics.find((t) => t.id === idOrSlug || t.slug === idOrSlug);
  if (!topic) throw new Error(`topic ${idOrSlug} not found in ${path.relative(ROOT, channel.paths.topicUniverse)}`);
  return { channel, topic };
}

function readiness(channel, topic) {
  const errors = [], warnings = [];
  if (topic.researchStatus !== "VERIFIED") errors.push(`researchStatus is ${topic.researchStatus}, not VERIFIED`);
  if (topic.productionReady !== true) errors.push("topic is not productionReady");
  const narration = Array.isArray(topic.narration) ? topic.narration : [];
  if (!narration.length) errors.push("topic has no narration");
  narration.forEach((l, i) => { if (!String(l.text || "").trim()) errors.push(`narration line ${i + 1} is empty`); if (l.layer && l.layer !== "VERIFIED FACT") warnings.push(`narration line ${i + 1} layer is ${l.layer}`); });
  const facts = Array.isArray(topic.facts) ? topic.facts : [];
  if (!facts.length) errors.push("topic has no facts");
  facts.forEach((f, i) => {
    if (!String(f.quote || "").trim()) errors.push(`fact ${i + 1} has no verbatim quote`);
    if (!/^https?:\/\//.test(String(f.url || ""))) errors.push(`fact ${i + 1} has no source URL`);
    if (f.layer !== "VERIFIED FACT") errors.push(`fact ${i + 1} layer is ${f.layer}`);
  });
  const published = readJson(path.join(channel.paths.state, "published.json"), []);
  const generated = readJson(path.join(channel.paths.state, "generated.json"), []);
  const pub = published.filter((p) => p.slug === topic.slug || p.topicId === topic.id);
  if (pub.length) errors.push(`already published (${pub.map((p) => p.videoId).join(", ")})`);
  if (generated.some((g) => g.topicId === topic.id && g.uploaded)) errors.push("already generated and uploaded");
  return { ready: errors.length === 0, errors, warnings, publishedRows: pub.length };
}

function factsWithIds(topic) {
  return (topic.facts || []).map((f, i) => ({ id: `F${i + 1}`, hash: sha(f.quote).slice(0, 10), ...f }));
}

// Suggested evidence per line: facts sharing the most content words with the line (the Visual Director
// confirms or overrides these in the storyboard; the validator checks whatever the storyboard cites).
function suggestEvidence(lineText, facts) {
  const lw = new Set(words(lineText));
  return facts.map((f) => ({ id: f.id, score: words(f.claim + " " + f.quote).filter((w) => lw.has(w)).length }))
    .filter((x) => x.score >= 2).sort((a, b) => b.score - a.score).slice(0, 3).map((x) => x.id);
}

// Narration script in the shape narrate-edge.js / the studio narrator read: one beat per narration line.
function studioScript(channel, topic, { pauses = {} } = {}) {
  const facts = factsWithIds(topic);
  const voice = channel.config.voice || {};
  const lines = topic.narration.map((l, i) => ({ id: `L${i + 1}`, role: l.role, layer: l.layer, text: l.text.trim(), evidenceSuggested: suggestEvidence(l.text, facts) }));
  const beats = lines.map((l, i) => ({ id: `b${i + 1}`, rate: voice.rate || "+0%", pauseAfterMs: pauses[l.id] != null ? pauses[l.id] : i === lines.length - 1 ? 0 : (l.role === "CLEAR_PROMISE" || lines[i + 1].role === "PAYOFF") ? 360 : 200, lines: [{ id: l.id, text: l.text }] }));
  return {
    schema: "bto-studio.narration-script.v1",
    channel: channel.slug, topicId: topic.id, slug: topic.slug, title: topic.title, coreQuestion: topic.coreQuestion,
    sourceHash: sha(JSON.stringify(topic.narration)).slice(0, 16),
    voice: { approved: { provider: voice.provider, voice: voice.voice, rate: voice.rate } },
    lines, beats, facts: facts.map(({ id, hash, role, claim, quote, source, url, layer }) => ({ id, hash, role, claim, quote, source, url, layer })),
  };
}

module.exports = { loadTopic, readiness, factsWithIds, suggestEvidence, studioScript };
