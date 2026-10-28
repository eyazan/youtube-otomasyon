#!/usr/bin/env node
"use strict";
// GoalLore Lab voice listening samples: one verified script read by a CANDIDATE Edge voice through the studio's own
// narrator (scripts/bto-studio/narrate.js), so the owner can choose the channel voice by ear. A sample is never an
// approval: the timeline stays approved:false and channels/goal-lore-lab/config.json keeps voice.status CANDIDATE until
// the owner records the choice.   node scripts/gll-research/voice-samples.js <voice> <outDir> [topicId]
const path = require("path");
const Adapter = require("../bto-studio/adapter");
const Narrator = require("../bto-studio/narrate");

function sample(voice, outDir, topicId = "GLL-021", { narrate = Narrator.narrate, log = console.log } = {}) {
  if (!/^[a-z]{2}-[A-Z]{2}-[A-Za-z]+Neural$/.test(String(voice))) throw new Error(`not an Edge neural voice name: ${voice}`);
  const { channel, topic } = Adapter.loadTopic("goal-lore-lab", topicId);
  const ready = Adapter.readiness(channel, topic); if (!ready.ready) throw new Error(`${topicId} is not verified: ${ready.errors.join("; ")}`);
  const script = Adapter.studioScript(channel, topic);
  script.voice = { approved: { ...script.voice.approved, voice }, ownerApproved: false };
  // absolute: the narrator's ffmpeg concat list resolves beat paths relative to the list file (run 40568450370)
  const dir = path.resolve(outDir);
  const tl = narrate(script, dir, { mode: "edge", preview: true, log });
  if (tl.approved !== false) throw new Error("a listening sample must never be marked approved");
  log(`${voice}: ${tl.duration} s, CANDIDATE (not approved) -> ${path.join(dir, "narration.wav")}`);
  return tl;
}

if (require.main === module) { const [voice, out, id] = process.argv.slice(2); try { sample(voice, out, id); } catch (e) { console.error(e.message); process.exit(1); } }
module.exports = { sample };
