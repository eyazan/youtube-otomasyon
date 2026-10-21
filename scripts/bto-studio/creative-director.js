"use strict";
// Creative Director: chooses a visual technique per story beat, and audits storyboards for slideshow patterns.
//   plan(script, profile)          -> creative plan: per beat a technique, why, which components, composition, env, camera,
//                                     transition motivation; diversity constraints enforced; reasons are explicit text
//   audit(storyboard, profile)     -> per scene: technique(s) inferred from its components, composition/camera facts, and
//                                     slideshow-risk flags (rule-based, explained; not a score)
//   node scripts/bto-studio/creative-director.js plan|audit --channel <c> --topic <id> [--storyboard file]
// Rules are deterministic heuristics over the narration text, roles and evidence; they recommend, the Visual Director decides.

const fs = require("fs");
const path = require("path");

// technique catalogue: what each is for and which components realise it (components must exist in the page library)
const TECHNIQUES = {
  "cinematic-real-object": { family: "cinematic", for: "open on the real thing in context (product, place, object) with a camera move", components: ["qr-3d", "reticle", "image-plate"], hook: true },
  "documentary-plate": { family: "real", for: "licensed real-world photo/archive with slow camera and provenance chip", components: ["image-plate"], needs: "licensed asset in the asset registry" },
  "sensor-pov": { family: "explanation", for: "show what a machine/sensor/eye actually perceives", components: ["row-signal", "qr-3d"] },
  "exploded-2_5d": { family: "explanation", for: "reveal internal layers/parts physically separating", components: ["qr-3d", "exploded-layers"] },
  "cross-section": { family: "explanation", for: "cut an object open to show inside", components: ["exploded-layers"] },
  "technical-diagram": { family: "explanation", for: "labelled mechanism with leader lines, measured geometry", components: ["labels", "scan-line", "run-length-strip"] },
  "physics-visualization": { family: "demonstration", for: "forces, flows, trajectories, invariants computed from a model", components: ["run-length-strip", "ball-flight", "airflow"] },
  "data-visualization": { family: "demonstration", for: "numbers from cited facts shown as proportion or comparison", components: ["run-length-strip", "signature-ledger", "stat-compare"] },
  "comparison-split": { family: "demonstration", for: "this vs that, accepted vs rejected, before vs after", components: ["search-window", "signature-ledger"] },
  "timeline-archival": { family: "context", for: "dates, origin, history on a physical timeline", components: ["timeline-ruler", "career-timeline"] },
  "quote-document": { family: "context", for: "a verbatim source quote as a physical document", components: ["quote-card"] },
  "tactical-pitch": { family: "explanation", for: "football positions, runs, passes on a pitch", components: ["football-pitch"] },
  "stadium-atmosphere": { family: "cinematic", for: "place and occasion: floodlights, stands, crowd silhouette (original)", components: ["stadium"], hook: true },
  "kinetic-typography": { family: "text", for: "a single key term or name; never the whole scene", components: ["kinetic-type"] },
};
const COMPONENT_TECHNIQUE = {};
for (const [t, d] of Object.entries(TECHNIQUES)) for (const c of d.components) (COMPONENT_TECHNIQUE[c] = COMPONENT_TECHNIQUE[c] || []).push(t);

// beat signals from the narration text (explainable keyword rules)
const SIGNALS = [
  ["timeline-archival", /\b(1[0-9]{3}|20[0-9]{2})\b|\breleased|founded|invented|history|origin/i, "a date or origin is spoken"],
  ["quote-document", /\b(said|says|told|wrote|according to)\b/i, "someone's words are reported"],
  ["sensor-pov", /\b(scanner|camera|sensor|reader|detect|see|look)\b/i, "a machine's perception is described"],
  ["exploded-2_5d", /\b(marks?|layers?|parts?|inside|made of|pattern)\b/i, "the structure of an object matters"],
  ["physics-visualization", /\b(angle|force|spin|curve|flow|pressure|speed|orient|rotate)\b/i, "a physical behaviour is claimed"],
  ["data-visualization", /\b(ratio|percent|times|rarest|most|least|survey|measured)\b/i, "a quantity or comparison is claimed"],
  ["comparison-split", /\b(least likely|instead|unlike|versus|why squares|rather than)\b/i, "an alternative is rejected"],
  ["tactical-pitch", /\b(pass|press|formation|defend|winger|striker|offside)\b/i, "a tactical idea is described"],
];

function plan(script, profile = {}) {
  const allowed = new Set(Object.keys(TECHNIQUES).filter((t) => (TECHNIQUES[t].components).some((c) => (profile.components || []).includes(c) || !profile.components)));
  const uses = {}; const beats = []; let prev = null;
  script.lines.forEach((l, i) => {
    const last = i === script.lines.length - 1;
    let cands = SIGNALS.filter(([t, re]) => allowed.has(t) && re.test(l.text)).map(([t, , why]) => ({ t, why }));
    if (i === 0) cands = [{ t: allowed.has("cinematic-real-object") ? "cinematic-real-object" : "stadium-atmosphere", why: "hook: open on the real object in context, with motion, before any explanation" }];
    if (last) cands = [{ t: "physics-visualization", why: "payoff: demonstrate the claim, do not just state it" }, ...cands];
    if (!cands.length) cands = [{ t: "technical-diagram", why: "no specific signal; default to a labelled diagram tied to the evidence" }];
    // diversity: no technique twice in a row, at most 2 uses, typography never alone
    // when every signalled technique would repeat, fall back to explanation techniques rather than break the rule
    const pool = [...cands, ...["technical-diagram", "exploded-2_5d", "comparison-split"].filter((t) => allowed.has(t)).map((t) => ({ t, why: `diversity fallback: "${cands[0].t}" was just used` }))];
    const pick = pool.find((c) => c.t !== prev && (uses[c.t] || 0) < 2 && c.t !== "kinetic-typography") || pool.find((c) => c.t !== prev) || pool[0];
    uses[pick.t] = (uses[pick.t] || 0) + 1; prev = pick.t;
    const T = TECHNIQUES[pick.t];
    beats.push({ line: l.id, role: l.role, text: l.text, technique: pick.t, family: T.family, why: pick.why, components: T.components, needs: T.needs || null,
      composition: ["full-bleed", "offset-left", "diagonal", "close-macro", "split", "overhead"][i % 6],
      env: i % 2 ? "light" : "dark", transitionMotivation: i ? `from ${beats[i - 1].technique} to ${pick.t}: carry an object or idea across the cut` : "none (frame 0)" });
  });
  const fam = {}; beats.forEach((b) => { fam[b.family] = (fam[b.family] || 0) + 1; });
  return { schema: "premium-studio.creative-plan.v1", topicId: script.topicId, beats, techniqueUse: uses, familyMix: fam,
    rules: ["no technique in two consecutive scenes", "no technique more than twice in a Short", "kinetic typography never carries a scene alone", "hook = cinematic or real object", "payoff = demonstration", "alternate light and dark environments"] };
}

// technique of one layer, from how it is used (props), not just which component it is
function techOf(l, layers) { const p = l.props || {}; const has = (c) => layers.some((x) => x.component === c);
  switch (l.component) {
    case "qr-3d": return [p.peel || p.surface ? "cinematic-real-object" : null, p.mono ? "sensor-pov" : null, p.explode ? "exploded-2_5d" : null, p.read ? "technical-diagram" : null, p.stripScale ? "physics-visualization" : null].filter(Boolean);
    case "qr-symbol": return [p.show && p.show.data === false ? "technical-diagram" : "cinematic-real-object"];
    case "print-surface": return p.context ? [] : [has("search-window") ? "comparison-split" : "data-visualization"];
    case "desk-grain": case "paper-card": case "reticle": return [];
    default: return COMPONENT_TECHNIQUE[l.component] || [];
  } }

// audit an existing storyboard: what techniques it actually uses, and rule-based slideshow risks
function audit(storyboard) {
  const scenes = storyboard.scenes.map((s, i) => {
    const comps = (s.layers || []).map((l) => l.component).filter((c) => c !== "desk-grain");
    const techs = [...new Set((s.layers || []).flatMap((l) => techOf(l, s.layers || [])))];
    const cam = s.camera || []; const span = (k) => cam.length ? Math.max(...cam.map((c) => c[k] == null ? (k === "z" ? 1 : k === "r" ? 0 : 0) : c[k])) - Math.min(...cam.map((c) => c[k] == null ? (k === "z" ? 1 : k === "r" ? 0 : 0) : c[k])) : 0;
    const moves = { pan: Math.max(span("x"), span("y")), zoom: span("z"), roll: span("r") };
    const tilt3d = (s.layers || []).some((l) => l.props && (l.props.rxKeys || l.props.rx));
    const textOnly = comps.length > 0 && comps.every((c) => ["kinetic-type", "quote-card", "labels", "paper-card"].includes(c));
    const centred = (s.layers || []).every((l) => !l.props || l.props.x == null || Math.abs((l.props.x || 540) - 540) < 60 || l.props.cx === 540);
    const flags = [];
    if (textOnly) flags.push("TEXT_ONLY: the scene is carried by type/quote alone");
    if (moves.pan < 40 && moves.zoom < 0.05 && moves.roll < 0.5 && !tilt3d) flags.push("STATIC_CAMERA: no meaningful camera move");
    if (centred && !tilt3d && moves.pan < 40) flags.push("CENTRED_FLAT: everything centred on a flat plane");
    if (comps.length <= 2 && !tilt3d) flags.push("THIN: two or fewer visual elements");
    const envOf = (x) => x.env || "desk"; if (i && !s.envShift && envOf(storyboard.scenes[i - 1]) === envOf(s)) flags.push(`SAME_ENV_AS_PREVIOUS (${envOf(s)})`);
    return { id: s.id, env: s.env || "desk", techniques: techs, components: comps, camera: moves, tilt3d, flags };
  });
  const seq = scenes.map((s) => s.techniques[0]); const repeats = seq.filter((t, i) => i && t === seq[i - 1]).length;
  return { schema: "premium-studio.creative-audit.v1", scenes, consecutiveSameLeadTechnique: repeats, envs: [...new Set(scenes.map((s) => s.env))],
    weakest: scenes.filter((s) => s.flags.length).sort((a, b) => b.flags.length - a.flags.length).map((s) => ({ id: s.id, flags: s.flags })) };
}

if (require.main === module) {
  const args = process.argv.slice(2); const opt = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
  const channel = opt("--channel", "behind-the-ordinary"); const topic = opt("--topic", "BTO-301");
  const profile = JSON.parse(fs.readFileSync(path.join(__dirname, "profiles", `${channel}.json`), "utf8"));
  if (args[0] === "plan") { const A = require("./adapter"); const { channel: ch, topic: tp } = A.loadTopic(channel, topic); console.log(JSON.stringify(plan(A.studioScript(ch, tp), profile), null, 1)); }
  else { const dir = path.resolve(__dirname, "../../channels", channel, "premium", topic); const sb = JSON.parse(fs.readFileSync(path.join(dir, opt("--storyboard", "storyboard.json")), "utf8")); console.log(JSON.stringify(audit(sb), null, 1)); }
}
module.exports = { TECHNIQUES, COMPONENT_TECHNIQUE, plan, audit };
