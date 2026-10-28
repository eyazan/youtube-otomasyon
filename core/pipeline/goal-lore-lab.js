"use strict";
// GoalLore Lab production lane (premium only). It replaces CriticalThread on the same, renamed YouTube channel; nothing of
// CriticalThread (topics, scripts, branding, state) is read except to refuse its slugs.
//   football topic -> research (scripts/gll-research/verify.js: VERIFIED, verbatim quotes) -> script (studio adapter)
//   -> automatic storyboard (scripts/bto-studio/auto/goal-lore-lab.js) -> narration (Edge) -> premium render -> QA
//   -> review package -> publish gate -> existing uploader (youtube-yukle.js), the last two ONLY through
//      core/pipeline/premium-publish.js (owner sign-offs or the owner-signed publication policy, GLL_PREMIUM_PUBLISH=1,
//      the approved voice and the registry entry enabled). Without all of them nothing is uploaded.
// The lane itself is the shared premium-primary lane (core/pipeline/premium-lane.js); GoalLore Lab adds the refusal of
// any record not tagged goal-lore-lab and of every CriticalThread slug.
const Lane = require("./premium-lane");

function runChannel(slug = "goal-lore-lab", argv = [], options = {}) {
  if (slug !== "goal-lore-lab") throw new Error(`the GoalLore Lab lane cannot run ${slug}`);
  return Lane.runChannel(slug, argv, options);
}

module.exports = { runChannel, qualified: Lane.qualified, legacySlugs: Lane.legacySlugs, renderCandidate: Lane.renderCandidate, reviewDir: Lane.reviewDir, ledger: Lane.ledger };
