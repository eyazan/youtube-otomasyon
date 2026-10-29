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

// ImpossibleBrief: what the automatic storyboard (scripts/bto-studio/auto/impossible-brief.js) actually draws for the
// record, built by the generator itself. A world earns credit only when the engine has a drawing that shows the topic's
// own mechanism (review renders 2026-10-28: IB-PHY-065 cutaway PASS; IB-HUM-004 one silhouette FAIL; IB-EXT-047 a spin
// drawn as an orbit). Anything the engine would draw wrongly scores 0, so it is never lifted above its archival score.
// Analysis only until the owner approves it for production (no growth-engine.json sets visuals.source for IB).
const WORLD_IB = {
  "earth-interior": 70, magnetic: 70, current: 70, lake: 66, "ocean-depth": 66, micro: 62, "orbit-body": 62, orbit: 40,
  "earth-surface": 48, sky: 48, cosmos: 0, body: 0,
};
const MECH_IB = new Set(["cut", "zoom", "flow", "heat", "count", "year"]);
const OTHER_BODY = /\b(io|europa|titan|enceladus|mars|venus|mercury|jupiter|saturn|neptune|uranus|pluto|proxima|moon)\b/i;
// an eruption whose mechanism happens at or above the surface (a flank collapse and lateral blast, a gas or ash cloud)
// is not what a cutaway or a depth probe shows (Mount St. Helens 1980, Laki 1783)
const SURFACE_ERUPTION = /\b(lateral|sideways|landslide|collapse|gas|gases|fluorine|sulfur|sulphur|ash|haze|famine|pyroclastic)\b/i;
const INTERIOR = /\b(chamber|reservoir|core|mantle|crust|drill|drilling|borehole|interior|layers?)\b/i;

function forImpossibleBrief(topic) {
  const A = require("../../scripts/bto-studio/adapter"); const G = require("../../scripts/bto-studio/auto/impossible-brief");
  const style = require("../../channels/impossible-brief/premium/style-pack.json");
  let t, sb; try { t = A.loadTopic("impossible-brief", topic.id); sb = G.build(A.studioScript(t.channel, t.topic), style, t.topic); } catch (e) { return null; }
  const rec = t.topic; const title = [rec.title, rec.topic].join(" "); const mechText = String(rec.scientificMechanism || "");
  let W = G.world(rec);
  if (W === "orbit" && sb.scenes.some((s) => s.layers.some((l) => l.component === "planet" && !["earth", "gas"].includes(l.props.kind)))) W = "orbit-body";
  const reasons = [`world ${W}`]; let score = WORLD_IB[W] != null ? WORLD_IB[W] : 0;
  const words = G.worldWords[W === "orbit-body" ? "orbit" : W];
  const why = [];
  if (words && !words.test(title)) why.push("world inferred from the body text, not the title's subject");
  if (["earth-interior", "ocean-depth", "lake", "current", "magnetic", "earth-surface", "sky"].includes(W) && OTHER_BODY.test(title) && !/\bearth\b/i.test(title)) why.push("an Earth drawing for another body");
  if (W === "orbit" && /\b(spin|spun|spinning|rotation|rotate|day length)\b/i.test(title + " " + mechText)) why.push("a spin drawn as an orbit");
  if (W === "earth-interior" && SURFACE_ERUPTION.test(mechText) && !INTERIOR.test(mechText)) why.push("a surface eruption (blast, gas, ash) drawn as a cutaway");
  if (score === 0) why.push(W === "body" ? "one generic silhouette in every scene" : "a generic planet unrelated to the subject");
  if (why.length) return { score: 0, world: W, drawable: false, reasons: [...reasons, ...why] };
  const kinds = sb.scenes.map((s) => s.id.replace(/^s\d+-/, ""));
  const ladders = sb.scenes.some((s) => s.layers.some((l) => l.component === "scale-ladder"));
  const field = sb.scenes.filter((s) => s.layers.some((l) => (l.component === "magnetosphere" && l.props.strengthKeys) || (l.component === "flow-arrows" && l.props.streams.some((x) => x.speedKeys)) || (l.component === "microbes" && l.props.countKeys))).length;
  const mech = new Set(kinds.filter((k) => MECH_IB.has(k))).size + (ladders ? 1 : 0) + (field ? 1 : 0);
  if (score >= 48) { const add = Math.min(16, mech * 4); score += add; reasons.push(`${mech} drawn mechanisms (+${add})`); }
  const bare = kinds.filter((k) => k === "mechanism").length - field;
  if (bare / kinds.length > 0.5) { score -= 10; reasons.push(`${bare}/${kinds.length} scenes are the bare subject (-10)`); }
  return { score: Math.max(0, Math.min(88, score)), world: W, drawable: true, reasons };
}

function animationPotential(topic) {
  if (topic.channel === "failure-reconstructed") return forFailureReconstructed(topic);
  if (topic.channel === "impossible-brief") return forImpossibleBrief(topic);
  return null;
}

module.exports = { animationPotential, forImpossibleBrief };
