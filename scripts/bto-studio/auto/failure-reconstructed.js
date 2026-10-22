"use strict";
// Failure Reconstructed automatic storyboard: a deterministic forensic grammar from the researched case file
// (icerik/konular/<slug>.json via adapter.loadTopic), no model call. Every FR case carries the same spine: the
// consequence, the toll, a five-link failure chain (vaka.zincir), what people get wrong (vaka.yanilgi) and the
// lesson (vaka.ders); the narration (sahneler) tells it in about eight lines. The grammar follows that spine:
//   hook     frame 0: the failed object (generic class drawing) giving way at its failure point + the case stamp
//   toll     the case's count (vaka.sayi) as a stamped readout over the broken object
//   chain    each cause line lights its link of the failure chain; the camera travels down the chain, so consecutive
//            cause scenes read as one continuous investigation (the link is matched from the line's own words)
//   trigger  the line that names the trigger: close-up of the failure point on the object, crack growing
//   contrast a line that corrects a belief ("weren't damaged", "never recognized"): the object intact + key phrase
//   payoff   the lesson over the object redrawn whole, then the chain's last link; loops toward frame 0
// Drawings are generic classes, never the specific aircraft, ship or structure: every drawn scene carries the
// RECONSTRUCTION chip and the CASE FILE chip. On-screen digits must occur in a cited case-file fact.
const { keyPhrase } = require("./impossible-brief");

const TRANSITIONS = ["scan-wipe", "iris"];
const KIND = [
  [/airship|zeppelin|dirigible|balloon/i, "airship"],
  [/rocket|spacecraft|lander|shuttle|capsule|launch|satellite|probe|space station|booster/i, "rocket"],
  [/airliner|aircraft|plane|jet|fuselage|wing|airspace|runway|transport|helicopter|engine control|cockpit/i, "aircraft"],
  [/bridge|viaduct|walkway/i, "bridge"],
  [/tailings|levee|dam|reservoir|dyke|dike|embankment/i, "dam"],
  [/spoil tip|tip\b|landslide|avalanche|slope|ground|mud|volcano|lahar|hillside|mountain|quake|earthquake/i, "terrain"],
  [/ship|liner|ferry|freighter|warship|destroyer|steamboat|submarine|boat|tanker|vessel|barge|platform/i, "ship"],
  [/train|rail|tram|metro|locomotive|curve|carriage/i, "train"],
  [/mine|pit|colliery|coal pillars|shaft|tunnel/i, "mine"],
  [/reactor|plant|refinery|chemical|power grid|nuclear|factory|works|smelter/i, "plant"],
  [/tank|silo|boiler|pipeline|well|gas holder|storage/i, "tank"],
  [/building|school|hospital|house|warehouse|hotel|tower|stadium|church|city|mall|roof|apartment|theatre|club/i, "building"],
];
const CLUSTER_KIND = { "aviation-failures": "aircraft", "maritime-disasters": "ship", "spaceflight-disasters": "rocket", "bridge-failures": "bridge", "rail-disasters": "train", "nuclear-accidents": "plant", "industrial-disasters": "plant", "natural-hazards": "terrain", "structural-failures": "building", "infrastructure-failures": "structure" };
function objectKind(topic) {
  const v = topic.case || {}; const hit = KIND.find(([re]) => re.test(`${v.nesne || ""}`)) || KIND.find(([re]) => re.test(`${v.ad || ""} ${topic.title || ""}`));
  return hit ? hit[1] : CLUSTER_KIND[v.kume] || "structure";
}

const STEM = (w) => w.toLowerCase().replace(/[^a-z]/g, "").slice(0, 5);
const SKIP = new Set(["the", "and", "that", "with", "from", "into", "this", "were", "was", "had", "have", "been", "their", "they", "after", "before", "about", "would", "could", "which", "then", "than", "when", "there"].map(STEM));
const contentStems = (s) => new Set(String(s).split(/\s+/).map(STEM).filter((w) => w.length >= 4 && !SKIP.has(w)));
const overlap = (a, b) => { const B = contentStems(b); return [...contentStems(a)].filter((w) => B.has(w)).length; };

// anchor + seconds ("L6+0.2" + 0.6 -> "L6+0.8")
function off(a, d) { const m = String(a).match(/^(.*?)([+-]\d+(?:\.\d+)?)?$/); const v = +((m[2] ? parseFloat(m[2]) : 0) + d).toFixed(2); return v ? `${m[1]}${v > 0 ? "+" : ""}${v}` : m[1]; }

function build(script, style, topic) {
  const v = topic.case || {}; const lines = script.lines; const facts = script.facts; const S = style.type.scale;
  const F = (role) => (facts.find((f) => f.role === role) || facts[0]).id;
  const kind = objectKind(topic); const chain = (v.zincir || []).slice(0, 5);
  const CH = { x: 540, gap: 230 };
  // no dissolve: it overlays the outgoing headline on the incoming chain links for a few frames (text gate FAIL, FR-aberfan)
  let ti = 0; const nextTransition = () => TRANSITIONS[(ti++) % TRANSITIONS.length];
  const silhouette = (props) => ({ component: "object-silhouette", props: { kind, x: 540, y: 820, w: 900, seed: 31, ...props } });
  // headlines sit below the chip column (y >= 460) and shrink with length so they never reach the frame edge
  const headline = (at, text, y = 470, size = S.title) => ({ component: "kinetic-type", screen: true, props: { items: [{ at, text, x: 540, y: Math.max(460, y), size: text.length > 22 ? Math.max(44, Math.round(size * 22 / text.length)) : size, family: "sans" }] } });
  const readout = (at, text, y = 1200) => ({ component: "kinetic-type", screen: true, props: { items: [{ at, text, x: 540, y, size: S.display, family: "num", style: "pop" }] } });
  // the chain is a screen layer with its own scrolling window between the chips and the caption band
  const chainLayer = (keys) => ({ component: "failure-chain", screen: true, props: { x: CH.x, gap: CH.gap, w: 780, steps: chain, activeKeys: keys, window: { center: 800, top: 300, bottom: 1250 } } });
  // the case stamp: short name + year, both in the case fact (F "case")
  const stamp = [v.kisa || v.ad, v.yil].filter(Boolean).join(" · ").toUpperCase();
  const toll = String(v.sayi || "").toUpperCase();

  // cause lines -> chain links, in order (a line maps to the best-overlapping link at or after the previous one)
  const roleOf = []; let link = -1; let triggerUsed = false; let contrastUsed = false;
  lines.forEach((L, i) => {
    if (i === 0) return roleOf.push("hook"); if (i === lines.length - 1) return roleOf.push("payoff");
    if (i === 1 && toll && /\b(killed|died|dead|lives|aboard|people|children|crew|passengers|victims|homes|injured)\b/i.test(L.text)) return roleOf.push("toll");
    if (!contrastUsed && /\b(wasn'?t|weren'?t|isn'?t|never|not|no one|nobody|simply)\b/i.test(L.text) && overlap(L.text, v.yanilgi || "") >= 1) { contrastUsed = true; return roleOf.push("contrast"); }
    if (!triggerUsed && overlap(L.text, v.tetik || "") >= 1 && link < 1) { triggerUsed = true; roleOf.push("trigger"); link = Math.max(link, 0); return; }
    const scores = chain.map((c, k) => (k < Math.max(0, link) ? -1 : overlap(L.text, c)));
    const best = scores.indexOf(Math.max(...scores)); link = scores[best] > 0 ? best : Math.min(chain.length - 1, link + 1);
    roleOf.push(`chain:${link}`);
  });

  const scenes = lines.map((L, i) => {
    const role = roleOf[i]; const start = i === 0 ? 0 : `${L.id}-0.15`; const end = `${L.id}.end`;
    const drift = i % 2 ? 30 : -30; let kind_, layers, purpose, camera, evidence = [F("case")], chips = ["conceptualLabel", "factLabel"];
    if (role === "hook") {
      // frame 0 must show the object (QA: first frame not empty): it is drawn whole at t=0 and gives way at 0.6 s
      kind_ = "hook"; layers = [silhouette({ failAt: 0.6 }), ...(stamp ? [headline(`${L.id}+0.3`, stamp, 330, S.title)] : [])];
      purpose = `Hook: frame 0 draws the ${kind} as clean line work and it gives way at the failure point within the first second, with the case stamp (${stamp || "case"}), so the consequence is on screen before any cause.`;
      camera = [{ at: start, x: 540, y: 820, z: 1.18 }, { at: end, x: 540 - drift, y: 830, z: 1.02 }];
    } else if (role === "toll") {
      kind_ = "toll"; layers = [silhouette({ failAt: -1, enterAt: undefined }), readout(`${L.id}+0.25`, toll, 1210)];
      purpose = `Toll: the broken ${kind} holds while the case's count (${toll}) is stamped below it; the number is the case file's, not computed.`;
      camera = [{ at: start, x: 540, y: 860, z: 1.0 }, { at: end, x: 540 + drift, y: 880, z: 1.16 }];
    } else if (role === "trigger") {
      kind_ = "trigger"; evidence = [F("trigger"), F("case")];
      layers = [silhouette({ failAt: off(L.id, 0.3) }), headline(`${L.id}+0.2`, keyPhrase(v.tetik || L.text, 3), 330)];
      purpose = `Trigger: the camera closes in on the failure point of the intact ${kind} as the crack starts there, while the case file's trigger is set in three words.`;
      camera = [{ at: start, x: 540, y: 820, z: 1.0 }, { at: end, x: 540, y: 800, z: 1.85 }];
    } else if (role === "contrast") {
      kind_ = "contrast"; evidence = [F("misconception"), F("case")];
      layers = [silhouette({ drawAt: off(L.id, -0.1) }), headline(`${L.id}+0.25`, keyPhrase(L.text, 4), 330)];
      purpose = "Contrast: the object redrawn whole while the line corrects what most people assume; it holds the misconception up against the case file.";
      camera = [{ at: start, x: 540 + drift * 2, y: 840, z: 1.3 }, { at: end, x: 540 - drift * 2, y: 800, z: 1.0 }];
    } else if (role === "payoff") {
      kind_ = "payoff"; evidence = [F("lesson"), F("case")];
      layers = [silhouette({ drawAt: off(L.id, -0.1) }), headline(`${L.id}+0.3`, keyPhrase(L.text, 4), 330, S.title)];
      purpose = "Payoff: the lesson in a few of the line's words over the object redrawn whole; the camera eases back toward the frame-0 framing so the Short loops.";
      camera = [{ at: start, x: 540 - drift * 2, y: 860, z: 1.32 }, { at: "end-0.6", x: 540, y: 820, z: 1.06 }];
    } else {
      const k = +role.split(":")[1]; kind_ = "chain"; evidence = [F("chain"), F("case")];
      const prev = i > 0 && String(roleOf[i - 1]).startsWith("chain:") ? +roleOf[i - 1].split(":")[1] : Math.max(0, k - 1);
      // the dimmed, already-failed object behind the chain is a world layer, so the camera drift gives the scene depth
      // and motion; the chain itself scrolls across most of the line
      layers = [silhouette({ failAt: -1, opacity: 0.16, w: 1160, y: 900 }), chainLayer([[start, prev], [off(L.id, 1.1), k]])];
      purpose = `Chain: the case's failure chain scrolls from link ${prev + 1} to link ${k + 1} ("${chain[k]}"), which lights as the line describes it, so consecutive causes read as one continuous investigation.`;
      camera = [{ at: start, x: 540 + drift * 2, y: 860, z: 1.05 }, { at: end, x: 540 - drift * 2, y: 820, z: 1.22 }];
      chips = ["conceptualLabel", "factLabel"];
    }
    return { id: `s${i + 1}-${kind_}`, lines: [L.id], start, env: "blueprint", ...(i === 0 ? {} : { transition: { type: nextTransition(i), dur: 0.5 } }), evidence: [...new Set(evidence)], chips, conceptual: true, visualPurpose: purpose, camera, layers };
  });
  // consecutive chain scenes share one continuous camera move, so they are joined with a continuity cut; plates alternate
  scenes.forEach((sc, k) => { if (k && sc.id.endsWith("-chain") && scenes[k - 1].id.endsWith("-chain")) sc.transition = { type: "continuity", dur: 0.3 }; });
  // plates alternate blueprint / void at every cut; a continuity cut keeps its group's plate; the payoff returns to the
  // hook's blueprint, and when that would repeat the previous plate, the previous group takes the teal plate
  const cont = (sc) => sc.transition && sc.transition.type === "continuity";
  scenes.forEach((sc, k) => { sc.env = k === 0 ? "blueprint" : cont(sc) ? scenes[k - 1].env : scenes[k - 1].env === "blueprint" ? "void" : "blueprint"; });
  const last = scenes.length - 1; scenes[last].env = "blueprint";
  if (scenes[last - 1].env === "blueprint") for (let k = last - 1; k > 0; k -= 1) { scenes[k].env = "teal"; if (!cont(scenes[k])) break; }
  // drop on-screen text whose digits are not in a cited fact (validator rule): the scene keeps its drawing
  const cited = (sc) => sc.evidence.map((id) => facts.find((f) => f.id === id)).filter(Boolean).map((f) => f.claim).join(" ");
  scenes.forEach((sc) => sc.layers.forEach((l) => { if (l.component === "kinetic-type") l.props.items = l.props.items.filter((it) => (String(it.text).match(/\d+/g) || []).every((d) => new RegExp(`(^|\\D)${d}(\\D|$)`).test(cited(sc)))); }));
  scenes.forEach((sc) => { sc.layers = sc.layers.filter((l) => l.component !== "kinetic-type" || l.props.items.length); });
  return {
    schema: "bto-studio.storyboard.v1", channel: script.channel, topicId: script.topicId, slug: script.slug, version: 1,
    author: `auto/failure-reconstructed (deterministic forensic grammar, object class ${kind}; needs creative review before publication)`,
    licensingNote: "all visuals drawn in-house from code (SVG): generic object-class line drawings, failure chain and stamps; no photographs, footage or third-party media",
    treatment: {
      educationalObjective: `Reconstruct, from the case file: ${script.title}`,
      visualHook: `Frame 0: a ${kind} drawn as line work gives way at its failure point within the first second.`,
      mechanismsToAnimate: [...new Set(scenes.map((s) => s.id.replace(/^s\d+-/, "")))],
      factualRisks: [`the ${kind} is a generic class drawing, not the actual vehicle or structure (RECONSTRUCTION chip)`, "the failure point on the drawing is illustrative", "case-file facts carry researched claims without stored verbatim quotes (FR live standard)"],
    },
    tail: 0.6, scenes,
  };
}

module.exports = { build, objectKind };
