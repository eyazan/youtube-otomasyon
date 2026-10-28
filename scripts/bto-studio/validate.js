"use strict";
// BTO Premium Studio storyboard validator: schema + evidence + craft rules. Runs before any render.
// Errors block the render; warnings are reported for the human creative review.
//
// Evidence rules (the studio's link to the existing factual verification):
//   - every scene cites fact ids that exist in the topic and are VERIFIED FACT with a verbatim quote;
//   - every narration line is covered by exactly the scenes that list it, in order;
//   - every number written on screen (kinetic type, labels, ruler year, strip labels, quote) appears in a fact the
//     scene cites; ruler tick labels are axis decoration and are exempt, the ruler's target year is not;
//   - quote-card text (without ellipses) is a verbatim substring of the quote of the fact it names (quoteOf);
//   - scenes using conceptual components (printed-matter samples, template search) are marked conceptual and show
//     the CONCEPTUAL chip, unless the layer is a plain setting (props.context: true) that makes no claim.
// Craft rules come from the style pack (no repeated transition in a row, at most one dissolve, short labels).
const fs = require("fs");
const path = require("path");
const { validate: schemaValidate } = require("../fr-premium/engine/jsonschema");

const SCHEMA = JSON.parse(fs.readFileSync(path.join(__dirname, "schemas/storyboard.schema.json"), "utf8"));
const COMPONENT_SRC = ["page/motion.js", ...fs.readdirSync(path.join(__dirname, "page/components")).map((f) => "page/components/" + f)].map((f) => fs.readFileSync(path.join(__dirname, f), "utf8")).join("\n");
const COMPONENTS = new Set([...COMPONENT_SRC.matchAll(/BTO\.def\("([a-z0-9-]+)"/g)].map((m) => m[1]));
const CONCEPTUAL = new Set(["print-surface", "search-window"]);
const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "");
const digits = (s) => (String(s).match(/\d+/g) || []);

// node-side anchor resolver (same grammar as BTO.at in page/motion.js)
function resolver(timeline, duration) {
  return (ref) => {
    if (typeof ref === "number") return ref; const m = String(ref).match(/^(.+?)([+\-]\d+(?:\.\d+)?)?$/); if (!m) throw new Error("bad anchor " + ref);
    const base = m[1].trim(), off = m[2] ? parseFloat(m[2]) : 0; if (/^[\d.]+$/.test(base)) return parseFloat(base) + off; if (base === "end") return duration + off;
    const wm = base.match(/^(L\d+):([^#.]+)(?:#(\d+))?(\.end)?$/);
    if (wm) { const ws = timeline.words.filter((w) => w.line === wm[1] && norm(w.text) === norm(wm[2])); const w = ws[(+wm[3] || 1) - 1]; if (!w) throw new Error(`word "${wm[2]}" not in ${wm[1]}`); return (wm[4] ? w.end : w.start) + off; }
    const lm = base.match(/^(L\d+)(\.start|\.end)?$/); if (lm) { const l = timeline.lines.find((x) => x.id === lm[1]); if (!l) throw new Error("no line " + lm[1]); return (lm[2] === ".end" ? l.end : l.start) + off; }
    throw new Error("unknown anchor " + ref);
  };
}

// every on-screen string a layer writes, with whether numbers in it must be evidenced
function screenTexts(layer) {
  const p = layer.props || {}; const out = [];
  if (layer.component === "kinetic-type") (p.items || []).forEach((it) => out.push({ text: it.text, kind: "type", size: it.size }));
  if (layer.component === "labels") (p.items || []).forEach((it) => out.push({ text: it.text, kind: "label", size: it.size || 40 }));
  if (layer.component === "qr-3d" && p.explode) (p.explode.labels || []).forEach((it) => out.push({ text: it.text, kind: "label", size: it.size || 44 }));
  if (layer.component === "quote-card") { out.push({ text: (p.lines || [p.quote]).join(" "), kind: "quote", quoteOf: p.quoteOf }); out.push({ text: p.attribution || "", kind: "credit" }); }
  if (layer.component === "timeline-ruler") out.push({ text: String(p.year), kind: "year" });
  if (layer.component === "scale-ladder") (p.items || []).forEach((it) => { if (it.label) out.push({ text: it.label, kind: "label", size: p.labelSize || 34 }); if (it.valueText) out.push({ text: it.valueText, kind: "label", size: p.valueSize || 40 }); });
  if (layer.component === "depth-probe") { (p.markers || []).forEach((m) => out.push({ text: m.label, kind: "label", size: m.size || 40 })); (p.readouts || []).forEach((r) => out.push({ text: r.text, kind: "type", size: r.size || 78 })); if (p.surface) out.push({ text: p.surface, kind: "label", size: 40 }); }
  if (layer.component === "planet") { (p.labels || []).forEach((l) => out.push({ text: l.text, kind: "label", size: l.size || 40 })); ((p.cutaway || {}).layers || []).forEach((l) => l.label && out.push({ text: l.label, kind: "label", size: l.size || 40 })); if (p.probe && p.probe.label) out.push({ text: p.probe.label, kind: "label", size: p.probe.size || 40 }); }
  if (layer.component === "event-ticks") { if (p.startLabel) out.push({ text: p.startLabel, kind: "label", size: 40 }); if (p.endLabel) out.push({ text: p.endLabel, kind: "label", size: 40 }); out.push({ text: String(p.count), kind: "count" }); }
  if (layer.component === "failure-chain") (p.steps || []).forEach((st) => out.push({ text: st, kind: "label", size: 44 }));
  if (layer.component === "run-length-strip") { if (p.labelsAt != null) out.push({ text: (p.labels || p.runs || []).join(":"), kind: "ratio" }); if (p.caption) out.push({ text: p.caption, kind: "label" }); }
  return out;
}

// Evidence policy per channel (profiles/<channel>.json evidencePolicy): which fact layers a scene may cite and whether
// each cited fact must carry a stored verbatim quote. Default = The Hidden Logic of Things (VERIFIED FACT + quote).
const DEFAULT_POLICY = { factLayers: ["VERIFIED FACT"], requireQuote: true };
function validateStoryboard(sb, { script, timeline, style, pilot = false, policy = DEFAULT_POLICY }) {
  const errors = schemaValidate(SCHEMA, sb).map((e) => "schema " + e); const warnings = [];
  if (errors.length) return { ok: false, errors, warnings };
  const facts = new Map(script.facts.map((f) => [f.id, f]));
  const duration = timeline.duration + (sb.tail || 0); const at = resolver(timeline, duration);
  const tryAt = (ref, where) => { try { return at(ref); } catch (e) { errors.push(`${where}: anchor ${JSON.stringify(ref)}: ${e.message}`); return NaN; } };
  // anchors anywhere in props/camera/captionsOff
  const walk = (o, where) => { if (Array.isArray(o)) o.forEach((v, i) => walk(v, `${where}[${i}]`)); else if (o && typeof o === "object") for (const [k, v] of Object.entries(o)) { if (/At$|^at$|^from$|^to$/.test(k) && (typeof v === "string" || typeof v === "number")) tryAt(v, `${where}.${k}`);
    else if (/Keys$/.test(k) && Array.isArray(v)) v.forEach((pair, j) => tryAt(pair[0], `${where}.${k}[${j}]`));
    else if (k === "finderOpacity") Object.entries(v).forEach(([i, ks]) => ks.forEach((pair, j) => tryAt(pair[0], `${where}.${k}.${i}[${j}]`))); else walk(v, `${where}.${k}`); } };
  (sb.captionsOff || []).forEach((w, i) => { tryAt(w.from, `captionsOff[${i}].from`); tryAt(w.to, `captionsOff[${i}].to`); });
  const starts = sb.scenes.map((s) => tryAt(s.start, `${s.id}.start`));
  starts.forEach((t, i) => { if (i && !(t > starts[i - 1])) errors.push(`${sb.scenes[i].id}: starts at ${t} before or with the previous scene (${starts[i - 1]})`); });
  if (starts[0] !== 0) errors.push("the first scene must start at 0 (the hook frame is frame 0)");
  const ids = new Set(); const covered = [];
  sb.scenes.forEach((s, i) => {
    if (ids.has(s.id)) errors.push(`duplicate scene id ${s.id}`); ids.add(s.id);
    walk(s.layers, s.id + ".layers"); (s.camera || []).forEach((k, j) => tryAt(k.at, `${s.id}.camera[${j}]`));
    const end = i < sb.scenes.length - 1 ? starts[i + 1] : duration;
    if (end - starts[i] < 1.2) warnings.push(`${s.id}: only ${(end - starts[i]).toFixed(2)} s on screen`);
    s.lines.forEach((l) => { if (!timeline.lines.some((x) => x.id === l)) errors.push(`${s.id}: line ${l} is not in the narration`); covered.push(l); });
    for (const id of s.evidence) { const f = facts.get(id); if (!f) errors.push(`${s.id}: cites unknown fact ${id}`); else if (!policy.factLayers.includes(f.layer) || (policy.requireQuote && !f.quote)) (pilot ? warnings : errors).push(`${s.id}: fact ${id} is not a verified${policy.requireQuote ? ", quoted" : ""} fact${pilot ? " (pilot: blocks production)" : ""}`); }
    const cited = s.evidence.map((id) => facts.get(id)).filter(Boolean); const citedText = cited.map((f) => f.claim + " " + (f.quote || "")).join(" ");
    for (const L of s.layers) {
      if (!COMPONENTS.has(L.component)) errors.push(`${s.id}: unknown component ${L.component} (known: ${[...COMPONENTS].join(", ")})`);
      if (CONCEPTUAL.has(L.component) && !(L.props || {}).context && !(s.conceptual && (s.chips || []).includes("conceptualLabel"))) errors.push(`${s.id}: ${L.component} is a conceptual depiction; mark the scene conceptual and show the conceptualLabel chip`);
      for (const tx of screenTexts(L)) {
        for (const d of digits(tx.text)) if (!new RegExp(`(^|\\D)${d}(\\D|$)`).test(citedText)) errors.push(`${s.id}: on-screen number "${d}" (${tx.kind}: "${tx.text}") is not in the facts this scene cites (${s.evidence.join(", ")})`);
        if (tx.kind === "quote") { const f = facts.get(tx.quoteOf); const body = tx.text.replace(/…/g, " ").replace(/\s+/g, " ").trim();
          if (!f) errors.push(`${s.id}: quote-card needs quoteOf naming a cited fact`); else if (!s.evidence.includes(tx.quoteOf)) errors.push(`${s.id}: quote-card quotes ${tx.quoteOf}, which the scene does not cite`);
          else if (!norm(f.quote).includes(norm(body))) errors.push(`${s.id}: quote-card text is not verbatim from ${tx.quoteOf}: "${body}"`); }
        if (tx.size != null && style.type.minLabelPx && tx.size < style.type.minLabelPx && tx.kind !== "credit") warnings.push(`${s.id}: "${tx.text}" is ${tx.size}px, below the ${style.type.minLabelPx}px mobile label minimum (before camera zoom)`);
        if ((tx.kind === "label" || tx.kind === "type") && tx.text.split(/\s+/).length > style.type.maxWordsPerLabel) warnings.push(`${s.id}: "${tx.text}" is longer than ${style.type.maxWordsPerLabel} words`);
      }
    }
    // a chip key the channel's style pack does not define renders as its raw key ("factLabel" on a BTO frame)
    for (const c of s.chips || []) if (!(style.identity && style.identity[c])) errors.push(`${s.id}: chip ${c} is not defined in the channel style identity`);
    if (!(s.chips || []).some((c) => c === "illustrationLabel" || c === "conceptualLabel")) warnings.push(`${s.id}: drawn scene without the ILLUSTRATION chip (brand visualRules.illustrationLabel)`);
    if (s.visualPurpose.length < 60) warnings.push(`${s.id}: visualPurpose is thin; say what the viewer sees that narration alone cannot show`);
  });
  const lines = timeline.lines.map((l) => l.id);
  if (JSON.stringify([...new Set(covered)]) !== JSON.stringify(lines)) errors.push(`scenes cover narration ${[...new Set(covered)].join(",")} but the narration is ${lines.join(",")} (every line, in order)`);
  // headline text quality (#364): a headline that names its authored source must be a contiguous span of it (no words
  // picked out of a sentence: "THRUSTER CIRCUITS REDESIGNED ISOLATE"); no headline twice in one video
  const headNorm = (x) => String(x || "").toUpperCase().replace(/[“”"’']/g, "").replace(/[^A-Z0-9·%]+/g, " ").trim();
  const heads = [];
  sb.scenes.forEach((s) => (s.layers || []).forEach((l) => { if (l.component !== "kinetic-type") return; for (const it of (l.props && l.props.items) || []) {
    if (it.source != null && !(" " + headNorm(it.source) + " ").includes(" " + headNorm(it.text) + " ")) errors.push(`${s.id}: headline "${it.text}" is not a contiguous span of its source text`);
    if (it.source != null) { if (heads.includes(headNorm(it.text))) errors.push(`${s.id}: headline "${it.text}" repeats an earlier headline`); heads.push(headNorm(it.text)); } } }));
  // transitions
  const types = sb.scenes.slice(1).map((s) => (s.transition || { type: "cut" }).type);
  types.forEach((t, i) => { if (i && t === types[i - 1] && !["cut", "continuity"].includes(t) && style.motion.noRepeatedTransitionInARow) errors.push(`${sb.scenes[i + 1].id}: repeats the ${t} transition of the previous scene`); });
  if (types.filter((t) => t === "dissolve").length > style.motion.maxDissolves) errors.push(`more than ${style.motion.maxDissolves} dissolve transition(s)`);
  if (new Set(types.filter((t) => !["cut", "continuity"].includes(t))).size < Math.min(3, types.length)) warnings.push("fewer than 3 distinct transition types");
  return { ok: errors.length === 0, errors, warnings, duration, components: [...COMPONENTS] };
}

module.exports = { validateStoryboard, resolver, COMPONENTS, screenTexts, DEFAULT_POLICY };
