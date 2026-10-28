"use strict";
// Animation potential: how well the premium studio can SHOW this case with its own drawings, measured from what its
// automatic storyboard would actually draw (scripts/bto-studio/auto/failure-reconstructed.js), not from archival media.
// A channel whose premium engine is primary (growth-engine.json "visuals": { "source": "animation" }) is scored on
// this instead of on archival footage it never uses; a case the studio can only draw as a generic box scores low, so a
// topic that cannot be told in animation is not lifted.
//   object   a specific drawing for the case's own object (truss bridge, capsule, airliner) vs a generic class
//   motion   the cause shown on the object (load path, wind, overtopping, seepage, uplift, a spin, a slide, a chain break)
//   chain    a five-link failure chain: the mechanism scenes have something to show at each step
//   cause    a named trigger and mechanism the drawing can point at
const FR = require("../../scripts/bto-studio/auto/failure-reconstructed");

// generic classes: drawn, but the drawing does not show what is special about the case
const GENERIC = new Set(["structure"]);
const BROAD = new Set(["building", "plant", "terrain", "mine", "tank"]);

function forFailureReconstructed(topic) {
  const raw = topic.raw || {}; const v = raw.vaka || {};
  const lines = (raw.sahneler || []).map((s, i) => ({ id: `L${i + 1}`, text: String(s.metin || "") }));
  const t = { case: v, title: raw.baslik || topic.title || "" };
  const kind = FR.objectKind(t, lines);
  const mech = FR.structureMechanism(t, kind, lines);
  const text = [v.sonuc, v.tetik, v.mekanizma, ...(v.zincir || [])].join(" ");
  const spin = ["capsule", "satellite"].includes(kind) && /\b(spin\w*|tumbl\w*|rotat\w*|rolled|rolling)\b/i.test(text);
  const part = (kind === "bridge" && /\b(eyebars?|chain|cables?|hangers?)\b/i.test(text)) || (kind === "dam" && /\b(landslide|slope|mountainside)\b/i.test(text));
  const reasons = [];
  let score = GENERIC.has(kind) ? 40 : BROAD.has(kind) ? 58 : 70; reasons.push(`object ${kind}${GENERIC.has(kind) ? " (generic)" : ""}`);
  // the chain and the named cause only count when the drawing can show the mechanism: a class drawing that merely tilts
  // or sinks shows the outcome, not the cause, and scores no higher than the class itself
  if (mech || spin || part) { score += 14; reasons.push(`mechanism ${mech || (spin ? "spin" : "failure part")}`);
    const chain = (v.zincir || []).length; if (chain >= 5) { score += 8; reasons.push(`${chain}-link chain`); }
    if (v.tetik && v.mekanizma) { score += 6; reasons.push("trigger and mechanism named"); } }
  else reasons.push("no mechanism the drawing can show");
  // never above real archival film: the studio's drawings are reconstructions, labelled as such
  return { score: Math.min(92, score), kind, drawable: !GENERIC.has(kind), reasons };
}

function animationPotential(topic) {
  if (topic.channel === "failure-reconstructed") return forFailureReconstructed(topic);
  return null;
}

module.exports = { animationPotential };
