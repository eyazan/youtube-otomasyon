"use strict";
// Premium video lifecycle: explicit states and the guards that must hold before a video may advance.
// Nothing here publishes or schedules; it only answers "may this video move to state X, and if not, why not".
// The daily automation design (docs/premium-studio/daily-automation.md) runs every transition through advance().
//
//   TOPIC_READY -> SCRIPT_READY -> VISUAL_READY -> RENDERED -> QA_PASSED -> PUBLISH_APPROVED -> SCHEDULED -> PUBLISHED
//
// A video never skips a state, never moves backwards silently (use reopen()), and every guard failure is reported
// with its reason. PUBLISH_APPROVED always needs a human approval record { by, at }; no guard can be bypassed by config.

const STATES = ["TOPIC_READY", "SCRIPT_READY", "VISUAL_READY", "RENDERED", "QA_PASSED", "PUBLISH_APPROVED", "SCHEDULED", "PUBLISHED"];

const approval = (a) => !!(a && typeof a.by === "string" && a.by.trim() && typeof a.at === "string" && !Number.isNaN(Date.parse(a.at)));

// Each guard returns a list of reasons the video may NOT enter that state (empty = allowed).
const GUARDS = {
  // v.topicReadiness (adapter.readiness: the channel's own research standard, e.g. ImpossibleBrief's researched records)
  // replaces the default The Hidden Logic of Things rule when the caller supplies it
  TOPIC_READY: (v) => v.topicReadiness ? [...v.topicReadiness.errors, v.alreadyPublished ? "topic already published" : null] : [
    v.topic && v.topic.researchStatus === "VERIFIED" ? null : "topic research is not VERIFIED",
    v.topic && v.topic.productionReady === true ? null : "topic is not productionReady",
    v.topic && Array.isArray(v.topic.facts) && v.topic.facts.length && v.topic.facts.every((f) => f.quote && f.url) ? null : "evidence is weak: every fact needs a verbatim quote and a source URL",
    v.alreadyPublished ? "topic already published" : null,
  ],
  SCRIPT_READY: (v) => [
    v.script && Array.isArray(v.script.lines) && v.script.lines.length ? null : "no narration script",
    v.script && v.script.sourceHash ? null : "narration is not traceable to the topic (no sourceHash)",
  ],
  VISUAL_READY: (v) => [
    v.storyboard && v.validation && v.validation.ok === true ? null : "storyboard missing or failed validation",
    v.storyboard && (v.storyboard.author || "").startsWith("autoDraft") ? "storyboard is an undirected auto-draft" : null,
    v.copyright && v.copyright.unresolved && v.copyright.unresolved.length ? `copyright risk unresolved: ${v.copyright.unresolved.join(", ")}` : null,
  ],
  RENDERED: (v) => [
    v.render && v.render.video ? null : "no rendered video",
    v.narration && v.narration.speechOk === true ? null : "narration failed the speech check (placeholder or broken audio)",
  ],
  QA_PASSED: (v) => [
    v.qa && v.qa.objectivePass === true ? null : "objective QA has hard failures",
    v.qa && (v.qa.unverified || []).some((n) => /clipp|peak|loud/i.test(n)) && !(v.qa.objective || []).some((c) => /sample peak/.test(c.name) && c.ok) ? "audio safety could not be measured" : null,
    v.creative && approval(v.creative.signoff) ? null : "creative review sign-off missing",
  ],
  PUBLISH_APPROVED: (v) => [
    v.narration && v.narration.approvedVoice === true ? null : "narration is not the channel's approved voice (preview/placeholder voices never publish)",
    v.factual && approval(v.factual.signoff) ? null : "factual sign-off missing",
    approval(v.publishApproval) ? null : "human publish approval { by, at } missing",
    v.channel && v.channel.publishingEnabled === true ? null : "channel publishing is not enabled",
  ],
  SCHEDULED: (v) => [v.schedule && v.schedule.publishAt ? null : "no publish time", v.schedule && v.schedule.privacy === "private" ? null : "uploads must be private + scheduled"],
  PUBLISHED: (v) => [v.upload && v.upload.videoId ? null : "no uploaded video id"],
};

function check(video, to) {
  if (!STATES.includes(to)) return { ok: false, reasons: [`unknown state ${to}`] };
  const from = video.state || null; const i = from ? STATES.indexOf(from) : -1;
  if (STATES.indexOf(to) !== i + 1) return { ok: false, reasons: [`cannot move ${from || "(new)"} -> ${to}: states advance one at a time`] };
  const reasons = GUARDS[to](video).filter(Boolean);
  return { ok: reasons.length === 0, reasons };
}

// Returns a new video record (never mutates), with the transition logged.
function advance(video, to, { at = new Date().toISOString(), by = "automation" } = {}) {
  const r = check(video, to);
  if (!r.ok) return { ...video, blocked: { to, reasons: r.reasons, at } };
  return { ...video, state: to, blocked: null, history: [...(video.history || []), { from: video.state || null, to, at, by }] };
}

// Move back explicitly (e.g. a revision after QA); requires a reason.
function reopen(video, to, reason, { at = new Date().toISOString(), by } = {}) {
  if (!reason) throw new Error("reopen needs a reason");
  if (STATES.indexOf(to) >= STATES.indexOf(video.state)) throw new Error("reopen moves backwards only");
  return { ...video, state: to, history: [...(video.history || []), { from: video.state, to, at, by: by || "human", reason }] };
}

// Days of approved buffer for a channel queue (videos at PUBLISH_APPROVED or SCHEDULED, one per publishing day).
const bufferDays = (videos, perDay = 1) => Math.floor(videos.filter((v) => v.state === "PUBLISH_APPROVED" || v.state === "SCHEDULED").length / perDay);

module.exports = { STATES, GUARDS, check, advance, reopen, bufferDays, approval };
