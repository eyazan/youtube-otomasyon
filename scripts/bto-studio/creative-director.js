"use strict";
// Creative Director: chooses a visual technique per story beat, and audits storyboards for slideshow patterns.
//   plan(script, profile)          -> creative plan: per beat a technique, why, which components, composition, env, camera,
//                                     transition motivation; diversity constraints enforced; reasons are explicit text
//   audit(storyboard, profile)     -> per scene: technique(s) inferred from its components, composition/camera facts, and
//                                     slideshow-risk flags (rule-based, explained; not a score)
//   review(outDir, storyboard)     -> per scene, MEASURED from the rendered video's real frames (motion, composition offset,
//                                     detail, novelty vs the previous scene, on-screen text share, smallest essential text)
//                                     next to the HUMAN rubric (storytelling, clarity, emotion, transition motivation, asset
//                                     relevance), which no number replaces; reviewer notes come from <out>/creative-notes.json
//   node scripts/bto-studio/creative-director.js plan|audit --channel <c> --topic <id> [--storyboard file]
//   node scripts/bto-studio/creative-director.js review --out <render out dir> [--storyboard file] [--video file]
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
  "place-establishing": { family: "cinematic", for: "the world the story happens in (shop aisle, stadium, street) with a moving camera", components: ["store-aisle", "stadium"], hook: true },
  "character-staging": { family: "human", for: "people's actions and reactions as period silhouettes (never likeness)", components: ["figure"] },
  "mechanical-assembly": { family: "explanation", for: "an object built, folded or taken apart part by part in 2.5D", components: ["rig-3d"] },
  "social-diagram": { family: "demonstration", for: "how behaviour spreads: movers on a plan, before/after adoption", components: ["floor-plan"] },
  "scoreboard-archival": { family: "context", for: "date, place and fixture on an original dot-matrix board", components: ["dot-board"] },
  "model-plot": { family: "demonstration", for: "a model's path or curve drawn over time, clearly labelled as a model", components: ["spiral-plot", "airflow"] },
  "line-drawing": { family: "explanation", for: "a contact, comparison or ghost outline drawn on", components: ["line-art"] },
};
const COMPONENT_TECHNIQUE = {};
for (const [t, d] of Object.entries(TECHNIQUES)) for (const c of d.components) (COMPONENT_TECHNIQUE[c] = COMPONENT_TECHNIQUE[c] || []).push(t);

// beat signals from the narration text (explainable keyword rules)
const SIGNALS = [
  ["timeline-archival", /\b(1[0-9]{3}|20[0-9]{2})\b|\breleased|founded|invented|history|origin/i, "a date or origin is spoken"],
  ["quote-document", /\b(said|says|told|wrote|according to)\b/i, "someone's words are reported"],
  ["place-establishing", /\b(shop|store|aisle|stadium|street|kitchen|city|lyon|supermarket)\b|\bshopping\b/i, "a place is named or implied"],
  ["sensor-pov", /\b(scanner|camera|sensor|reader|detect|see|look)\b/i, "a machine's perception is described"],
  ["exploded-2_5d", /\b(marks?|layers?|parts?|inside|made of|pattern)\b/i, "the structure of an object matters"],
  ["physics-visualization", /\b(angle|force|spin|curve|flow|pressure|speed|orient|rotate)\b/i, "a physical behaviour is claimed"],
  ["data-visualization", /\b(ratio|percent|times|rarest|most|least|survey|measured)\b/i, "a quantity or comparison is claimed"],
  ["comparison-split", /\b(least likely|instead|unlike|versus|why squares|rather than)\b/i, "an alternative is rejected"],
  ["tactical-pitch", /\b(pass|press|formation|defend|winger|striker|offside|wall|free kick|post)\b/i, "a tactical or pitch event is described"],
  ["character-staging", /\b(woman|man|shoppers?|customers?|people|crowd|goalkeeper|keeper|hired|refused|told)\b/i, "people act or react"],
  ["mechanical-assembly", /\b(put|wheels?|legs?|seat|basket|attached|assembled|folding|built)\b/i, "an object is built or changed part by part"],
  ["social-diagram", /\b(popular|adopted|everyone|spread|models? to push)\b/i, "a behaviour spreads"],
  ["scoreboard-archival", /\b(against|v|versus)\b.*\b(19|20)\d{2}\b|\b(19|20)\d{2}\b.*\b(against|versus)\b/i, "a dated fixture is named"],
  ["model-plot", /\b(spiral|drag|slows?|tighter|curve)\b/i, "a modelled behaviour over time"],
];

function plan(script, profile = {}) {
  const comps = Array.isArray(profile.components) ? profile.components : profile.components && profile.components.built ? profile.components.built.map((c) => c.split(" ")[0]) : null;
  const allowed = new Set(Object.keys(TECHNIQUES).filter((t) => TECHNIQUES[t].components.some((c) => !comps || comps.includes(c))));
  const uses = {}; const beats = []; let prev = null;
  script.lines.forEach((l, i) => {
    const last = i === script.lines.length - 1;
    let cands = SIGNALS.filter(([t, re]) => allowed.has(t) && re.test(l.text)).map(([t, , why]) => ({ t, why }));
    if (i === 0) { const sig = cands.find((c) => TECHNIQUES[c.t].hook); cands = [sig ? { t: sig.t, why: `hook: ${sig.why}; open on it in context, with motion, before any explanation` } : { t: allowed.has("cinematic-real-object") ? "cinematic-real-object" : "stadium-atmosphere", why: "hook: open on the real object in context, with motion, before any explanation" }]; }
    // payoff: demonstrate the claim with the beat's own signal, else return to the hook's world so the loop closes
    if (last) cands = [...cands.filter((c) => TECHNIQUES[c.t].family === "demonstration"), { t: beats[0].technique, why: "payoff: return to the hook's world and show the result, so the loop closes" }, ...cands];
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
    rules: ["no technique in two consecutive scenes", "people beats use silhouettes, assembly beats a 2.5D rig, dates with fixtures a scoreboard", "no technique more than twice in a Short", "kinetic typography never carries a scene alone", "hook = cinematic or real object", "payoff = demonstration", "alternate light and dark environments"] };
}

// technique of one layer, from how it is used (props), not just which component it is
function techOf(l, layers) { const p = l.props || {}; const has = (c) => layers.some((x) => x.component === c);
  switch (l.component) {
    case "qr-3d": return [p.peel || p.surface ? "cinematic-real-object" : null, p.mono ? "sensor-pov" : null, p.explode ? "exploded-2_5d" : null, p.read ? "technical-diagram" : null, p.stripScale ? "physics-visualization" : null].filter(Boolean);
    case "qr-symbol": return [p.show && p.show.data === false ? "technical-diagram" : "cinematic-real-object"];
    case "print-surface": return p.context ? [] : [has("search-window") ? "comparison-split" : "data-visualization"];
    case "desk-grain": case "paper-card": case "reticle": return [];
    case "rig-3d": return [(p.parts || []).some((pt) => pt.enterAt != null || pt.rotKeys) ? "mechanical-assembly" : "cinematic-real-object"];
    case "stadium": return layers.some((x) => x.component === "football-pitch") ? [] : ["place-establishing"];
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

// ---- review: measurements from real rendered frames ---------------------------------------------------------------
const W = 108, H = 192; // analysis size (1/10 of 1080x1920)
function frameAt(video, t) { const cp = require("child_process"); const buf = cp.execFileSync("ffmpeg", ["-v", "error", "-ss", String(Math.max(0, t)), "-i", video, "-frames:v", "1", "-vf", `scale=${W}:${H}`, "-f", "rawvideo", "-pix_fmt", "gray", "-"], { maxBuffer: 1 << 22 });
  return buf.length >= W * H ? buf : null; }
function metrics(px) { let sum = 0, ex = 0, ey = 0, et = 0; const g = (x, y) => px[y * W + x];
  for (let y = 1; y < H - 1; y += 1) for (let x = 1; x < W - 1; x += 1) { const e = Math.abs(g(x + 1, y) - g(x - 1, y)) + Math.abs(g(x, y + 1) - g(x, y - 1)); if (e > 40) { et += 1; ex += x; ey += y; } sum += g(x, y); }
  const n = (W - 2) * (H - 2); return { luma: sum / n, detail: et / n, offset: et ? Math.hypot(ex / et / W - 0.5, ey / et / H - 0.5) : 0 }; }
const diff = (a, b) => { let d = 0; for (let i = 0; i < a.length; i += 1) d += Math.abs(a[i] - b[i]); return d / a.length / 255; };
function review(out, sb, { video } = {}) {
  const meta = JSON.parse(fs.readFileSync(path.join(out, "scenes.json"), "utf8"));
  const vid = video || fs.readdirSync(out).filter((f) => /-premium-(final|preview).*\.mp4$/.test(f)).map((f) => path.join(out, f)).sort((a, b) => /final/.test(b) - /final/.test(a))[0];
  const ti = (() => { try { return JSON.parse(fs.readFileSync(path.join(out, "text-inspection.json"), "utf8")).samples; } catch (e) { return []; } })();
  const notes = (() => { try { return JSON.parse(fs.readFileSync(path.join(out, "creative-notes.json"), "utf8")); } catch (e) { return {}; } })();
  const aud = audit(sb); let prevMid = null;
  const scenes = meta.scenes.map((sc, i) => {
    const a = sc.start + (sc.transition && sc.transition.dur ? sc.transition.dur : 0) + 0.05, b = sc.end - 0.05; const ts = [0.15, 0.5, 0.85].map((u) => a + (b - a) * u);
    const fr = ts.map((t) => frameAt(vid, t)); const ok = fr.every(Boolean); const m = ok ? fr.map(metrics) : [];
    const motion = ok ? (diff(fr[0], fr[1]) + diff(fr[1], fr[2])) / 2 : null; const novelty = ok && prevMid ? diff(fr[1], prevMid) : null; if (ok) prevMid = fr[1];
    const boxes = ti.filter((x) => x.t >= sc.start && x.t < sc.end).flatMap((x) => x.boxes.map((bx) => ({ ...bx, t: x.t }))).filter((bx) => bx.role === "svg" && bx.opacity > 0.5);
    const perT = {}; for (const bx of boxes) perT[bx.t] = (perT[bx.t] || 0) + bx.w * bx.h; const textShare = Object.values(perT).length ? Math.max(...Object.values(perT)) / (1080 * 1920) : 0;
    const minText = boxes.length ? Math.min(...boxes.map((bx) => bx.fontPx)) : null;
    const flags = [];
    if (motion != null && motion < 0.01) flags.push("LOW_MOTION: frames inside the scene barely change");
    // no automatic composition flag: the edge-centroid offset stays near 0 for uniformly textured frames (crowds, pitch
    // lines), so it is reported as a raw measurement only and composition is judged by the reviewer
    if (novelty != null && novelty < 0.06) flags.push("LOW_NOVELTY: looks close to the previous scene");
    if (textShare > 0.12) flags.push(`TEXT_HEAVY: on-screen text covers ${(100 * textShare).toFixed(0)}% of the frame`);
    if (minText != null && minText < 40) flags.push(`SMALL_TEXT: smallest scene text ${minText}px (< 40px mobile label size)`);
    if (m.length && m[1].detail < 0.015) flags.push("SPARSE: little visual detail in the frame");
    return { id: sc.id, start: sc.start, end: sc.end, technique: (aud.scenes[i] || {}).techniques || [], transition: (sc.transition || {}).type,
      measured: ok ? { motion: +motion.toFixed(4), novelty: novelty == null ? null : +novelty.toFixed(4), compositionOffset: +m[1].offset.toFixed(3), detail: +m[1].detail.toFixed(4), meanLuma: +m[1].luma.toFixed(1), textShare: +textShare.toFixed(3), minTextPx: minText, camera: (aud.scenes[i] || {}).camera } : null,
      flags, storyboardFlags: (aud.scenes[i] || {}).flags || [],
      human: { storytelling: null, educationalClarity: null, emotionalImpact: null, transitionMotivation: null, assetRelevance: null, verdict: null, ...(notes[sc.id] || {}) } };
  });
  return { schema: "premium-studio.creative-review.v1", video: path.relative(path.resolve(__dirname, "../.."), vid), measuredFrom: "3 decoded frames per scene at 108x192 (ffmpeg) + text-inspection.json",
    note: "Measurements describe the frames; they are not quality scores. Human fields are filled by a reviewer (creative-notes.json) and are marked with who wrote them.", scenes };
}
function reviewMarkdown(r) {
  const L = [`# Creative review (${r.video})`, "", r.note, "", "| scene | technique | transition | motion | novelty | offset | text share | min text | flags | human verdict |", "|---|---|---|---|---|---|---|---|---|---|"];
  for (const s of r.scenes) { const m = s.measured || {}; L.push(`| ${s.id} | ${s.technique.slice(0, 2).join(", ")} | ${s.transition} | ${m.motion} | ${m.novelty} | ${m.compositionOffset} | ${m.textShare} | ${m.minTextPx} | ${[...s.flags, ...s.storyboardFlags].map((f) => f.split(":")[0]).join(", ") || "-"} | ${s.human.verdict || "not reviewed"} |`); }
  L.push("", "## Reviewer notes (judgement, not measurement)", ""); for (const s of r.scenes) { const h = s.human; if (!h.by) continue; L.push(`- **${s.id}** (${h.by}): storytelling ${h.storytelling}; clarity ${h.educationalClarity}; emotion ${h.emotionalImpact}; transition ${h.transitionMotivation}; assets ${h.assetRelevance}. ${h.note || ""}`); }
  return L.join("\n") + "\n";
}

if (require.main === module) {
  const args = process.argv.slice(2); const opt = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
  const channel = opt("--channel", "behind-the-ordinary"); const topic = opt("--topic", "BTO-301");
  const profile = JSON.parse(fs.readFileSync(path.join(__dirname, "profiles", `${channel}.json`), "utf8"));
  if (args[0] === "plan") { const A = require("./adapter"); const { channel: ch, topic: tp } = A.loadTopic(channel, topic); console.log(JSON.stringify(plan(A.studioScript(ch, tp), profile), null, 1)); }
  else if (args[0] === "review") { const out = path.resolve(opt("--out")); const sbf = opt("--storyboard", null) ? path.resolve(opt("--storyboard")) : path.join(out.replace(/\/out(\/v\d+)?$/, ""), "storyboard.json"); const r = review(out, JSON.parse(fs.readFileSync(sbf, "utf8")), { video: opt("--video", null) });
    fs.writeFileSync(path.join(out, "creative-review.json"), JSON.stringify(r, null, 1) + "\n"); fs.writeFileSync(path.join(out, "creative-review.md"), reviewMarkdown(r)); console.log(reviewMarkdown(r)); }
  else { const dir = path.resolve(__dirname, "../../channels", channel, "premium", topic); const sb = JSON.parse(fs.readFileSync(path.join(dir, opt("--storyboard", "storyboard.json")), "utf8")); console.log(JSON.stringify(audit(sb), null, 1)); }
}
module.exports = { TECHNIQUES, COMPONENT_TECHNIQUE, plan, audit, review, reviewMarkdown };
