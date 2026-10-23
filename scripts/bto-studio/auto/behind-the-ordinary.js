"use strict";
// The Hidden Logic of Things automatic storyboard: a deterministic "documentary desk" grammar for VERIFIED records
// (every fact carries a verbatim quote verified in its source by scripts/bto-research.js), no model call. It is the
// production default for a topic that has no directed storyboard; a directed storyboard.json is never replaced
// (studio.js uses a generator only when none exists, or with --regenerate). It passes the same validator: quote cards
// are verbatim from the cited fact, on-screen digits occur in cited facts, every line is covered.
//   hook      the object and its design detail as kinetic type on the desk, over printed matter
//   year      a line naming a cited year: the ruler lands on it
//   quote     a line whose evidence carries a quote: the source's own words on a quote card (at most two per Short)
//   number    a cited quantity as a readout
//   detail    otherwise: the line's key phrase over a different piece of printed matter (label, form, box, magazine)
//   payoff    the answer in a few words; returns to the hook's composition so the Short loops
// Printed matter is greeked (no real words or brands): those scenes carry the CONCEPTUAL chip; quote cards the fact chip.
const { keyPhrase, numbersIn } = require("./impossible-brief");

// push / match-zoom / whip drag on-screen text across the frame edge (text gate FAIL in BTO-040, IB-EXT-050)
const TRANSITIONS = ["scan-wipe", "iris"];
const SURFACES = ["label", "form", "box", "magazine", "flyer"];

function off(a, d) { const m = String(a).match(/^(.*?)([+-]\d+(?:\.\d+)?)?$/); const v = +((m[2] ? parseFloat(m[2]) : 0) + d).toFixed(2); return v ? `${m[1]}${v > 0 ? "+" : ""}${v}` : m[1]; }
const factHas = (fact, raw) => new RegExp(`(^|\\D)${raw.replace(/,/g, ",?")}(\\D|$)`).test(fact.claim + " " + (fact.quote || ""));
// split a quote into card lines of at most ~24 characters, at most four lines (a longer quote is cut at a word: the
// card shows a verbatim prefix, which the validator accepts as a substring of the stored quote)
function quoteLines(q, max = 24, maxLines = 4) {
  const out = [""]; for (const w of String(q).replace(/\s+/g, " ").trim().split(" ")) { const cur = out[out.length - 1];
    if (cur && (cur + " " + w).length > max) { if (out.length === maxLines) break; out.push(w); } else out[out.length - 1] = cur ? cur + " " + w : w; }
  return out;
}
const shortSource = (s) => String(s || "").split(/ — | - /)[0].toUpperCase().slice(0, 40);

function build(script, style, topic, context = {}) {
  const lines = script.lines; const facts = script.facts; const S = style.type.scale; const object = String(topic.object || topic.canonicalTopic || "").toUpperCase();
  let ti = 0; const mid = Math.floor(lines.length / 2); const nextTransition = (i) => (i === mid ? "dissolve" : TRANSITIONS[(ti++) % TRANSITIONS.length]);
  const desk = (seed) => ({ component: "desk-grain", screen: true, props: { seed } });
  const surface = (k, seed, rot) => ({ component: "print-surface", props: { kind: SURFACES[k % SURFACES.length], x: 190, y: 560, w: 700, h: 560, rotate: rot, seed } });
  const type = (at, text, y, size, family = "sans") => ({ component: "kinetic-type", screen: true, props: { items: [{ at, text, x: 540, y, size: text.length > 22 ? Math.max(44, Math.round(size * 22 / text.length)) : size, family, style: "pop" }] } });
  // a topic with a prepared symbol (a generated QR matrix in premium/<topic>/assets/) shows the real, decodable symbol in
  // the hook and the payoff: a video about QR codes must show one (QA decodes the first and last frame)
  const symbol = Object.entries(context.assets || {}).find(([, a]) => a && a.matrix);
  const symbolLayer = (sid) => (symbol ? [{ component: "qr-symbol", props: { asset: symbol[0], id: sid, cx: 540, cy: 860, module: 26, rotate: 0 } }] : []);
  let quotes = 0; let surfaceN = 0;
  const scenes = lines.map((L, i) => {
    const first = i === 0, last = i === lines.length - 1; const start = first ? 0 : `${L.id}-0.15`; const end = `${L.id}.end`;
    const ev = (L.evidenceSuggested || []).filter((id) => facts.some((f) => f.id === id)); const evidence = ev.length ? ev.slice(0, 3) : [facts[0].id];
    const nums = numbersIn(L.text).map((n) => ({ ...n, facts: facts.filter((f) => factHas(f, n.raw)).map((f) => f.id) })).filter((n) => n.facts.length);
    const year = nums.find((n) => n.year); const qty = nums.find((n) => !n.year);
    const quoted = facts.find((f) => f.id === evidence[0] && String(f.quote || "").split(/\s+/).length >= 6);
    const drift = i % 2 ? 28 : -28; let kind, layers, purpose, camera, chips = ["illustrationLabel"];
    if (first || last) {
      kind = first ? "hook" : "payoff";
      layers = [desk(3), ...(symbol ? symbolLayer(first ? "sym-hook" : "sym-payoff") : [surface(0, 11, -4)]), type(`${L.id}+0.2`, first ? object || keyPhrase(L.text) : keyPhrase(L.text, 4), 420, first ? S.headline : S.title)];
      purpose = first ? `Hook: frame 0 sets the object (${object || "the subject"}) in large type over printed matter on the desk, so the detail in question is named before it is explained.`
        : "Payoff: the answer in a few of the line's words over the opening composition, so the Short loops on its first image.";
      camera = first ? [{ at: start, x: 540, y: 820, z: 1.14 }, { at: end, x: 540 - drift, y: 820, z: 1.0 }] : [{ at: start, x: 540, y: 820, z: 1.0 }, { at: "end-0.6", x: 540, y: 820, z: 1.12 }];
    } else if (year) {
      kind = "year"; evidence.unshift(...year.facts.filter((f) => !evidence.includes(f)).slice(0, 1));
      layers = [desk(5 + i), surface(++surfaceN, 20 + i, 3), { component: "timeline-ruler", screen: true, props: { y: 1180, fromYear: year.value - 8, year: year.value, enterAt: `${L.id}-0.1`, arriveAt: `${L.id}+0.6`, outAt: end } }];
      purpose = `Time: the ruler rolls and locks on ${year.raw} as the line says it, over the period's printed matter; the year is from the cited fact.`;
      camera = [{ at: start, x: 540 + drift, y: 800, z: 1.0 }, { at: end, x: 540 - drift, y: 820, z: 1.1 }];
    } else if (quoted && quotes < 2) {
      quotes += 1; kind = "quote"; chips = ["illustrationLabel"];
      // printed matter behind the card is a world layer, so the camera keeps the frame moving (BTO-301 auto render: 2.3 s
      // static hold on a quote scene); the two cards differ in height and plate (they correlated 0.956). No rotation: a
      // rotated card's line boxes overlap (text gate), and both cards stay above the year ruler's band (y >= 1060)
      layers = [desk(7 + i), surface(++surfaceN, 60 + i, quotes === 1 ? -6 : 7), { component: "quote-card", screen: true, props: { at: `${L.id}+0.1`, lines: quoteLines(quoted.quote), quoteOf: quoted.id, attribution: shortSource(quoted.source), y: quotes === 1 ? 560 : 660, size: 52 } }];
      purpose = `Source: the record's own evidence on a quote card (verbatim from ${quoted.id}, attributed), so the claim in the line is shown in the source's words, not the narrator's.`;
      camera = [{ at: start, x: 520, y: 900, z: 1.0 }, { at: end, x: 560, y: 940, z: 1.14 }];
    } else if (qty) {
      kind = "number"; evidence.unshift(...qty.facts.filter((f) => !evidence.includes(f)).slice(0, 1));
      const label = qty.unit ? `${qty.raw} ${qty.unit}` : qty.raw;
      layers = [desk(9 + i), surface(++surfaceN, 30 + i, -2), type(`${L.id}+0.3`, label.toUpperCase(), 1180, S.display, "num")];
      purpose = `Number: the cited value (${label}) is stamped below the printed matter as it is spoken.`;
      camera = [{ at: start, x: 540 - drift, y: 820, z: 1.02 }, { at: end, x: 540 + drift, y: 840, z: 1.12 }];
    } else {
      kind = "detail"; layers = [desk(11 + i), surface(++surfaceN, 40 + i, i % 2 ? 5 : -5), type(`${L.id}+0.25`, keyPhrase(L.text), 420, S.title)];
      purpose = "Detail: the line's key phrase over a different piece of printed matter while the camera drifts across it, so each step of the explanation has its own object on the desk.";
      camera = [{ at: start, x: 540 + drift, y: 820, z: 1.0 }, { at: end, x: 540 - drift, y: 800, z: 1.14 }];
    }
    // greeked printed matter is a conceptual depiction (validator): CONCEPTUAL chip + conceptual flag
    const printed = layers.some((l) => l.component === "print-surface"); if (printed) chips = ["conceptualLabel"];
    const env = kind === "quote" && quotes === 2 ? "spot" : "desk";
    return { id: `s${i + 1}-${kind}`, lines: [L.id], start, env, ...(first ? {} : { transition: { type: nextTransition(i), dur: 0.5 } }), evidence: [...new Set(evidence)].slice(0, 4), chips, ...(printed ? { conceptual: true } : {}), visualPurpose: purpose, camera, layers };
  });
  // last guard (validator rule): on-screen digits must occur in a cited fact; failing type becomes the key phrase
  const cited = (sc) => sc.evidence.map((id) => facts.find((f) => f.id === id)).filter(Boolean).map((f) => f.claim + " " + (f.quote || "")).join(" ");
  scenes.forEach((sc, k) => sc.layers.forEach((l) => { if (l.component === "kinetic-type") l.props.items = l.props.items.map((it) => ((String(it.text).match(/\d+/g) || []).every((d) => new RegExp(`(^|\\D)${d}(\\D|$)`).test(cited(sc))) ? it : { ...it, text: keyPhrase(lines[k].text), family: "sans", size: S.title })); }));
  return {
    schema: "bto-studio.storyboard.v1", channel: script.channel, topicId: script.topicId, slug: script.slug, version: 1,
    author: "auto/behind-the-ordinary (deterministic documentary-desk grammar; needs creative review before publication)",
    licensingNote: "all visuals drawn in-house from code (SVG): desk, greeked printed matter, rulers and quote cards; quotes are verbatim from the cited sources; no photographs or third-party media",
    treatment: {
      educationalObjective: `Answer, in the sources' own words: ${script.coreQuestion || script.title}`,
      visualHook: `Frame 0: ${object || "the object"} in large type over printed matter on the desk.`,
      mechanismsToAnimate: [...new Set(scenes.map((s) => s.id.replace(/^s\d+-/, "")))],
      factualRisks: ["printed matter is greeked and generic (ILLUSTRATION chip)", "the automatic grammar draws no mechanism: a directed storyboard is needed for cutaways and exploded views"],
    },
    tail: 0.6, scenes,
  };
}

module.exports = { build, quoteLines };
