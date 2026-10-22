"use strict";
// ImpossibleBrief automatic storyboard: a deterministic scene grammar from the researched record (no model call), so a
// daily premium IB Short needs no manual prompting. It is a production default, not a directed film: the output passes
// the same validator as a hand-directed storyboard (every on-screen number from a cited fact, every line covered, layer
// chips), and the Creative Director review / human sign-off still apply before anything can be published.
//
//   world   what the topic is "about" visually, from its own words: earth-interior | ocean-depth | orbit | sky | body | cosmos
//   scenes  one per narration line:
//     hook     frame 0: the world's signature visual + the hook's evidenced number as a readout
//     year     a line naming an evidenced year: timeline ruler lands on it over the world
//     heat     an evidenced temperature: the depth slice heats up, readout of the value
//     measure  another evidenced quantity: probe/marker to the value (depth worlds) or a scale ladder of the topic's
//              same-unit facts (others)
//     mechanism no number: the world's mechanism visual (cutaway / orbit / starfield) + a 2-4 word key phrase
//     payoff   the last line returns to the hook composition so the loop restarts cleanly
// Layers: drawn subjects (planet, orbit, depth slice, ladder) are WORLD layers so the scene camera moves them; stars,
// headlines, readouts and rulers are SCREEN layers so text never drifts toward the frame edge.
// Chips: ILLUSTRATION on every drawn scene + the line's evidence layer (KNOWN SCIENCE / ESTIMATE / SPECULATIVE).

const STOP = new Set("the a an and of to in on for that this it its is are was were be by with from as at or they them their these those so but if would could than more like just only still even much very into over down up out what when where who how why your you we our".split(" "));
// push and match-zoom move or scale on-screen text across the frame edge during the transition (text gate FAIL in
// IB-EXT-050 v1 and BTO-040); whip does too (v2). The generator alternates the transitions that leave text in place
// and uses the one allowed dissolve at the midpoint.
const TRANSITIONS = ["scan-wipe", "iris"];
const WORLD_WORDS = {
  "earth-interior": /\b(drill|drilling|borehole|crust|mantle|core|underground|deepest hole|bedrock|magma|lava|volcan)/i,
  "ocean-depth": /\b(trench|ocean|seafloor|sea floor|deep sea|abyss|submarine|dive|mariana|current|gulf stream)/i,
  orbit: /\b(orbit|moon|sun|planet|mercury|venus|mars|jupiter|saturn|asteroid|comet|pulsar|spin|spun|rotation|day length|year lasted)/i,
  sky: /\b(atmosphere|stratosphere|altitude|edge of space|sky|jump|balloon|cloud|tornado|lightning|storm)/i,
  body: /\b(body|brain|blood|heart|microbe|cell|sleep|pain|eat|stomach|bone|memory|remember)/i,
};
const LAYER_CHIP = { "KNOWN SCIENCE": "factLabel", "ESTIMATED CONSEQUENCE": "estimateLabel", "SPECULATIVE SCENARIO": "speculativeLabel" };

function world(topic) {
  const text = [topic.topic, topic.title, topic.scientificMechanism, topic.coreQuestion, ...((topic.visualPotential || {}).scenes || [])].join(" ");
  // the world whose words occur most often in the record (title and mechanism count double)
  const head = [topic.topic, topic.title, topic.scientificMechanism].join(" ");
  const score = Object.entries(WORLD_WORDS).map(([w, re]) => [w, (text.match(new RegExp(re.source, "gi")) || []).length + (head.match(new RegExp(re.source, "gi")) || []).length]);
  const best = score.sort((a, b) => b[1] - a[1])[0];
  return best && best[1] > 0 ? best[0] : "cosmos";
}

// numbers spoken in a line with their unit, kept only when a fact contains the same digits
const NUM = /(\d{1,3}(?:,\d{3})+|\d+(?:\.\d+)?)\s*(°\s?C|°\s?F|degrees|metres|meters|kilometres|kilometers|km|m\b|cm|centimetres|percent|%|years?|hours?|days?|minutes?|seconds?|times)?/gi;
const UNIT = { metres: "m", meters: "m", kilometres: "km", kilometers: "km", centimetres: "cm", degrees: "°", percent: "%" };
function numbersIn(text) {
  const out = []; let m; NUM.lastIndex = 0;
  while ((m = NUM.exec(text))) { const raw = m[1]; const unit = (m[2] || "").replace(/\s/g, ""); const value = Number(raw.replace(/,/g, ""));
    if (!Number.isFinite(value)) continue; out.push({ raw, value, unit: UNIT[unit.toLowerCase()] || unit, year: !unit && /^\d{4}$/.test(raw) && value >= 1500 && value <= 2100 }); }
  return out;
}
const factHas = (fact, raw) => new RegExp(`(^|\\D)${raw.replace(/,/g, ",?")}(\\D|$)`).test(fact.claim + " " + (fact.quote || ""));

// anchor + seconds, keeping the anchor grammar valid ("L6+0.2" + 0.6 -> "L6+0.8")
function off(a, d) {
  if (typeof a === "number") return +(a + d).toFixed(2);
  const m = String(a).match(/^(.*?)([+-]\d+(?:\.\d+)?)?$/); const v = +((m[2] ? parseFloat(m[2]) : 0) + d).toFixed(2);
  return v ? `${m[1]}${v > 0 ? "+" : ""}${v}` : m[1];
}

function keyPhrase(text, max = 3) {
  // a contrast the line states ("heat, not hardness") is the strongest short form; it keeps the line's own words
  const contrast = String(text).match(/\b([A-Za-z]+),?\s+not\s+([A-Za-z]+)/i);
  if (contrast) return `${contrast[1]}, NOT ${contrast[2]}`.toUpperCase();
  const comparison = String(text).match(/\bmore\s+(?:like\s+)?([A-Za-z]+)\s+than\s+([A-Za-z]+)/i);
  if (comparison) return `MORE ${comparison[1]} THAN ${comparison[2]}`.toUpperCase();
  text = String(text).replace(/['’]s\b/g, "");
  const ws = text.replace(/[“”"'’.,;:!?()]/g, " ").split(/\s+/).filter(Boolean);
  const keep = ws.filter((w) => !STOP.has(w.toLowerCase()) && !/\d/.test(w));
  return (keep.length ? keep : ws.filter((w) => !/\d/.test(w))).slice(0, max).join(" ").toUpperCase();
}

function build(script, style, topic) {
  const W = world(topic); const facts = script.facts; const lines = script.lines; const S = style.type.scale;
  const depthNumbers = facts.flatMap((f) => numbersIn(f.claim).filter((n) => n.unit === "m" || n.unit === "km").map((n) => (n.unit === "km" ? n.value * 1000 : n.value)));
  const maxDepth = depthNumbers.length ? Math.max(...depthNumbers) * 1.18 : 1;
  const depthWorld = W === "earth-interior" || W === "ocean-depth";
  const evidenced = (line) => numbersIn(line.text).map((n) => ({ ...n, facts: facts.filter((f) => factHas(f, n.raw)).map((f) => f.id) })).filter((n) => n.facts.length);
  const valueLabel = (n) => (n.unit === "°C" || n.unit === "°" ? `${n.raw} °C` : n.unit === "°F" ? `${n.raw} °F` : n.unit ? `${n.raw} ${n.unit}` : n.raw);
  let ti = 0; const mid = Math.floor(lines.length / 2); const nextTransition = (i) => (i === mid ? "dissolve" : TRANSITIONS[(ti++) % TRANSITIONS.length]);

  // the world's signature visual (also the payoff, so the loop returns to frame 0)
  const signature = (at, { probe = null, cut = false, zoom = null } = {}) => {
    // probe depth is exaggerated for visibility (a real 12 km hole is ~0.2 % of Earth's radius): ILLUSTRATION chip
    // zoom { from, to }: the planet grows past the frame while its top surface stays in view, so a "scratch" reads as tiny
    // cutaway: the planet moves left and its layer labels stack in a column inside the right safe margin
    if (W === "earth-interior") {
      const base = { kind: "earth", spin: 0.32, seed: 4 };
      if (zoom) return [{ component: "planet", props: { ...base, spin: 0.25, ice: false, grid: true, x: 540, rKeys: [[zoom.from, 330], [zoom.to, 2600]], yKeys: [[zoom.from, 820], [zoom.to, 560 + 2600]], probe: { at: zoom.from, f: 0.004, dur: 0.6, angle: -90, width: 8, label: "DEEPEST HOLE", lx: 170, ly: 700 } } }];
      return [{ component: "planet", props: { ...base, x: cut ? 400 : 540, y: 820, r: cut ? 280 : 330, ...(probe ? { probe: { at, f: 0.03, dur: 1.4, angle: -90, width: 8 } } : {}),
        ...(cut ? { cutaway: { at, angle: -30, open: 32, layers: [{ f: 0.99, color: "#7a4a2a", label: "CRUST", labelAt: off(at, 0.6), lx: 690, ly: 470 }, { f: 0.88, color: "#c0501f", label: "MANTLE", labelAt: off(at, 0.9), lx: 690, ly: 560 }, { f: 0.47, color: "#ff8a2a", label: "CORE", labelAt: off(at, 1.2), lx: 690, ly: 650 }, { f: 0.2, color: "#ffd06a" }] } } : {}) } }];
    }
    if (W === "ocean-depth") return [{ component: "planet", props: { kind: "earth", x: 540, y: 820, r: 330, spin: 0.32, seed: 8 } }];
    if (W === "orbit") return [{ component: "orbit", props: { cx: 540, cy: 800, a: 360, e: 0.18, tilt: -8, period: 7, trail: 0.22, central: { r: 74 }, body: { r: 26 }, enterAt: 0 } }];
    if (W === "sky") return [{ component: "planet", props: { kind: "earth", x: 540, y: 1560, r: 900, spin: 0.03, seed: 2 } }];
    if (W === "body") return [{ component: "planet", props: { kind: "ice", x: 540, y: 800, r: 260, spin: 0.4, seed: 6, colors: { base: "#7a2f4f", land: "#c25a7c", land2: "#9b3f63", atm: "#ff9bbd" } } }];
    return [{ component: "planet", props: { kind: "gas", x: 540, y: 820, r: 300, spin: 0.3, seed: 5, rings: true } }];
  };
  const stars = (seed) => ({ component: "starfield", screen: true, props: { seed, count: 300, drift: [22, 9] } });
  const headline = (at, text, y = 470, size = S.headline) => ({ component: "kinetic-type", screen: true, props: { items: [{ at, text, x: 540, y, size, family: "sans" }] } });
  const readout = (at, text, y = 1200) => ({ component: "kinetic-type", screen: true, props: { items: [{ at, text, x: 540, y, size: S.display, family: "num" }] } });
  const probeSlice = (L, { to = null, from = null, heat = false, flow = false, markers = [], readouts = [], surface = true }) => ({ component: "depth-probe", props: {
    x: 470, y: 450, w: 420, h: 770, maxDepth, ...(surface ? { surface: W === "ocean-depth" ? "SEA LEVEL" : "SURFACE" } : {}), heat, heatAt: heat ? `${L.id}+0.2` : undefined, ...(flow ? { flow: { at: `${L.id}+0.3`, amp: 30 } } : {}),
    probeKeys: to != null ? [[`${L.id}-0.1`, from != null ? from : Math.min(to * 0.25, maxDepth * 0.2)], [`${L.id}.end`, to]] : undefined, markers, readouts } });

  let cutUsed = false;
  const scenes = lines.map((L, i) => {
    const nums = evidenced(L); const year = nums.find((n) => n.year); const temp = nums.find((n) => /°|degrees/i.test(n.unit) || /°C/.test(L.text) && n.unit === "");
    const qty = nums.find((n) => !n.year && n !== temp);
    const ev = [...new Set([...nums.flatMap((n) => n.facts), ...(L.evidenceSuggested || [])])].slice(0, 3); const evidence = ev.length ? ev : [facts[0].id];
    const chips = ["illustrationLabel", LAYER_CHIP[L.layer] || "factLabel"];
    const start = i === 0 ? 0 : `${L.id}-0.15`; const first = i === 0; const last = i === lines.length - 1;
    let kind, layers, purpose, camera;
    // camera travel is what keeps a drawn science scene from reading as a slide (Creative Director LOW_MOTION < 0.01):
    // every scene pushes in by at least 14% and drifts sideways, alternating direction
    const drift = i % 2 ? 36 : -36;
    const cam = (z0, z1, y0 = 800, y1 = 800) => [{ at: start, x: 540 - drift, y: y0, z: z0 }, { at: `${L.id}.end`, x: 540 + drift, y: y1, z: Math.max(z1, z0 + 0.14) }];
    if (first) {
      kind = "hook"; const n = qty || temp || year;
      layers = [stars(11), ...signature(0.15, { probe: W === "earth-interior" }), ...(n ? [readout(`${L.id}+0.25`, valueLabel(n), 1230)] : [headline(`${L.id}+0.2`, keyPhrase(L.text), 420)])];
      purpose = `Hook: frame 0 shows the ${W.replace("-", " ")} itself${n ? ` and the claim's number (${valueLabel(n)}) lands as a readout` : ""}, so the scale of the question is visible before it is explained.`;
      camera = cam(1.12, 1.0);
    } else if (last) {
      kind = "payoff"; layers = [stars(11), ...signature(`${L.id}+0.2`, { probe: W === "earth-interior" }), headline(`${L.id}+0.3`, keyPhrase(L.text, 4), 420, S.title)];
      purpose = "Payoff: the answer in a few words over the opening composition; the camera eases back to the frame-0 framing so the Short loops on its first image.";
      camera = [{ at: start, x: 540, y: 800, z: 1.06 }, { at: "end-0.6", x: 540, y: 800, z: 1.12 }];
    } else if (year) {
      kind = "year"; layers = [stars(20 + i), ...(depthWorld ? [probeSlice(L, { from: 0, to: qty && (qty.unit === "m" || qty.unit === "km") ? (qty.unit === "km" ? qty.value * 1000 : qty.value) : maxDepth * 0.82 })] : signature(`${L.id}`)),
        { component: "timeline-ruler", screen: true, props: { theme: "dark", y: 1250, fromYear: year.value - 6, year: year.value, enterAt: `${L.id}-0.1`, arriveAt: `${L.id}+0.6`, outAt: `${L.id}.end` } }];
      purpose = `Time: the ruler lands on ${year.raw} while the scene shows what started then (the probe begins its descent); the year is from the cited fact.`;
      camera = cam(1.0, 1.12, 800, 840);
    } else if (temp && depthWorld) {
      kind = "heat"; layers = [stars(30 + i), probeSlice(L, { to: maxDepth / 1.18, heat: true, surface: false, readouts: [{ at: `${L.id}+0.5`, text: valueLabel(temp), y: 1250, color: "amber" }] })];
      purpose = `Heat: the camera dives to the bottom of the hole, where the slice glows around the stalled probe tip; the measured temperature (${valueLabel(temp)}) is the only number on screen.`;
      // a close-up of the probe tip, so it does not repeat the previous scene's full-slice framing
      camera = [{ at: start, x: 470, y: 900, z: 1.05 }, { at: `${L.id}.end`, x: 470, y: 1060, z: 1.7 }];
    } else if (temp) {
      kind = "heat"; layers = [stars(30 + i), ...signature(`${L.id}`), readout(`${L.id}+0.4`, valueLabel(temp), 1230)];
      purpose = `Heat: the cited temperature (${valueLabel(temp)}) lands as a large readout over the subject while the camera pushes in.`; camera = cam(1.0, 1.08);
    } else if (qty && depthWorld && (qty.unit === "m" || qty.unit === "km")) {
      const d = qty.unit === "km" ? qty.value * 1000 : qty.value; const others = nums.filter((n) => n !== qty && (n.unit === "m" || n.unit === "km"));
      const depthsInTopic = facts.flatMap((f) => numbersIn(f.claim).filter((n) => n.unit === "m").map((n) => ({ ...n, fact: f.id })));
      const reached = depthsInTopic.filter((n) => n.value < d).sort((a, b) => b.value - a.value)[0];
      kind = "measure"; layers = [stars(40 + i), probeSlice(L, { to: reached ? reached.value : d, markers: [{ depth: d, label: valueLabel(qty), at: `${L.id}+0.3` }, ...others.map((n) => ({ depth: n.value, label: valueLabel(n), at: `${L.id}+0.6` }))] })];
      if (reached) evidence.push(...[reached.fact].filter((f) => !evidence.includes(f)));
      purpose = `Measure: a dashed marker at ${valueLabel(qty)} while the probe descends${reached ? ` and stops short at the depth actually reached (cited)` : ""}; depth is drawn to the scale of the slice.`;
      camera = cam(1.0, 1.06, 820, 860);
    } else if (qty) {
      const same = facts.flatMap((f) => numbersIn(f.claim).filter((n) => !n.year && n.unit === qty.unit).map((n) => ({ ...n, fact: f.id }))).filter((n, k, a) => a.findIndex((x) => x.value === n.value) === k).slice(0, 4);
      kind = "measure"; if (same.length >= 2) { layers = [stars(40 + i), { component: "scale-ladder", props: { x: 110, y: 560, w: 860, items: same.sort((a, b) => a.value - b.value).map((n, k) => ({ label: `FACT ${n.fact}`.replace("FACT ", ""), value: n.value, valueText: valueLabel(n), at: `${L.id}+${(0.2 + k * 0.45).toFixed(2)}` })) } }];
        same.forEach((n) => { if (!evidence.includes(n.fact)) evidence.push(n.fact); }); purpose = `Scale: the topic's own ${qty.unit || "values"} side by side as growing bars, so the size of the change is seen, not read.`; }
      else { layers = [stars(40 + i), ...signature(`${L.id}`), readout(`${L.id}+0.3`, valueLabel(qty), 1230)]; purpose = `Number: the cited value (${valueLabel(qty)}) lands as a large readout over the subject while the camera pushes in, so the quantity is held on screen as it is spoken.`; }
      camera = cam(1.0, 1.05);
    } else {
      // mechanism: the line's own words pick the visual, and the cutaway is used at most once per Short
      const v = W !== "earth-interior" ? "subject" : /\b(scratch|scratched|crust|surface|barely|thin|skin)\b/i.test(L.text) ? "zoom"
        : /\b(plastic|flow|flows|soft|melt|melts|bend|deform|behav)/i.test(L.text) ? "flow" : cutUsed ? "flow" : "cut";
      if (v === "cut") cutUsed = true;
      kind = v === "subject" ? "mechanism" : v;
      layers = [stars(50 + i),
        ...(v === "flow" ? [probeSlice(L, { heat: true, flow: true })] : signature(`${L.id}`, { cut: v === "cut", zoom: v === "zoom" ? { from: off(`${L.id}`, 0.1), to: `${L.id}.end` } : null })),
        headline(`${L.id}+0.25`, keyPhrase(L.text), 360, S.title)];
      purpose = `Mechanism: ${{ zoom: "the camera dives at the planet until its curve fills the frame and the deepest hole is a single scratch on the surface", flow: "the rock slice heats and its strata bend and travel like a slow fluid (conceptual)", cut: "the planet opens into its layers so the depth beyond the hole is visible", subject: "the subject stays on screen while the key idea is set in two or three words" }[v]}; ${L.layer === "KNOWN SCIENCE" ? "known science" : L.layer === "ESTIMATED CONSEQUENCE" ? "an estimate, chipped as such" : "speculative, chipped as such"}.`;
      camera = cam(1.0, 1.1, 800, 780);
      // at most two chips (a third reaches into the picture): CONCEPTUAL replaces ILLUSTRATION, the layer chip stays
      if (v === "flow" || v === "cut") chips[0] = "conceptualLabel";
    }
    return { id: `s${i + 1}-${kind}`, lines: [L.id], start, env: "space", ...(first ? {} : { transition: { type: nextTransition(i), dur: 0.5 } }), evidence: [...new Set(evidence)].slice(0, 4), chips,
      ...(((kind === "mechanism" && L.layer !== "KNOWN SCIENCE") || chips.includes("conceptualLabel")) ? { conceptual: true } : {}), visualPurpose: purpose, camera, layers };
  });
  // the ladder's bar labels must not carry fact ids as text: replace with nothing (value text carries the number)
  scenes.forEach((s) => s.layers.forEach((l) => { if (l.component === "scale-ladder") l.props.items.forEach((it) => { it.label = ""; }); }));
  return {
    schema: "bto-studio.storyboard.v1", channel: script.channel, topicId: script.topicId, slug: script.slug, version: 1,
    author: `auto/impossible-brief (deterministic scene grammar, world ${W}; needs creative review before publication)`,
    licensingNote: "all visuals drawn in-house from code (SVG): starfield, bodies, slices, ladders and orbits are original; no photographs or third-party media",
    treatment: {
      educationalObjective: `Answer, with the record's own sourced numbers: ${script.coreQuestion || script.title}`,
      visualHook: `Frame 0: the ${W.replace("-", " ")} drawn in light against deep space, with the hook's number landing as the first readout.`,
      mechanismsToAnimate: [...new Set(scenes.map((s) => s.id.replace(/^s\d+-/, "")))],
      factualRisks: ["probe depth on the planet is exaggerated for visibility (ILLUSTRATION)", "auto storyboard: scale drawings are illustrative unless computed from a cited number (ILLUSTRATION chip)", "IB facts carry sourced claims without stored verbatim quotes (channel standard; see readiness warnings)"],
    },
    tail: 0.6, scenes,
  };
}

module.exports = { build, world, numbersIn, keyPhrase };
