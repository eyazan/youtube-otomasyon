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

// clip reveals only (no push/match-zoom/whip): they never drag on-screen text across the frame edge; three types for variety (#357)
const TRANSITIONS = ["scan-wipe", "iris", "square-iris"];
const KIND = [
  [/airship|zeppelin|dirigible|balloon/i, "airship"],
  [/rocket|spacecraft|lander|shuttle|capsule|launch|satellite|probe|space station|booster/i, "rocket"],
  [/airliner|aircraft|plane|jet|fuselage|wing|airspace|runway|transport|helicopter|engine control|cockpit/i, "aircraft"],
  [/walkway|skywalk/i, "walkway"],
  [/bridge|viaduct/i, "bridge"],
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
// A space case's object field often names a part ("Thruster", "Wiring", "Heat shield"); the vehicle class comes from the
// whole case: a launch vehicle stays a rocket, a crewed capsule, a satellite or probe, and the shuttle orbiter get their
// own generic drawings (#364: Gemini 8 was drawn as a finned rocket)
const LAUNCHER = /\b(rocket|booster|launcher|launch vehicle|upper stage|fairing|launch pad|saturn v|titan|ariane|n1|proton|atlas|redstone|pegasus|taurus|antares|starship|falcon)\b/i;
const CAPSULE = /\b(capsule|gemini|apollo|soyuz|mercury|vostok|crew dragon|starliner|orion|spaceshiptwo|crew module|command module)\b/i;
const SATELLITE = /\b(satellite|probe|orbiter|lander|telescope|hubble|space station|skylab|antenna|mars|galileo|genesis|hitomi|schiaparelli|noaa|helios)\b/i;
const SHUTTLE = /\b(space shuttle|shuttle|columbia|challenger|atlantis|sts-\d+)\b/i;
function spaceKind(v, title) {
  const part = `${v.nesne || ""}`, all = `${v.nesne || ""} ${v.ad || ""} ${v.kisa || ""} ${title || ""}`;
  if (LAUNCHER.test(part)) return "rocket";
  if (SHUTTLE.test(all)) return "shuttle";
  if (CAPSULE.test(all)) return "capsule";
  if (SATELLITE.test(all)) return "satellite";
  return "rocket";
}
// A bridge or dam is drawn as the structural type its own verified text names, never a default type with invented
// detail (#364: the I-35W deck-truss bridge was drawn as a suspension bridge): a truss (gusset plates, chords), a
// suspension bridge (eyebar chain, cables), otherwise a plain girder bridge; an earth-fill embankment dam, otherwise
// the generic concrete dam.
const TRUSS = /\b(truss\w*|gusset\w*|chords?|cantilever)\b/i;
const SUSPENSION = /\b(suspension|eyebars?|chain|cables?|suspender\w*|hangers?)\b/i;
const EARTH = /\b(earth\w*|embankment|earth-?fill|fill dam|tailings|levee|dyke|dike|clay core|rockfill)\b/i;
const caseText = (topic, lines = []) => { const v = topic.case || {};
  return [v.nesne, v.ad, v.sonuc, v.tetik, v.mekanizma, v.ders, v.yanilgi, ...(v.zincir || []), ...lines.map((l) => l.text || l.metin || "")].join(" "); };
function objectKind(topic, lines = []) {
  const v = topic.case || {}; const hit = KIND.find(([re]) => re.test(`${v.nesne || ""}`)) || KIND.find(([re]) => re.test(`${v.ad || ""} ${topic.title || ""}`));
  const kind = hit ? hit[1] : CLUSTER_KIND[v.kume] || "structure";
  if (kind === "rocket") return spaceKind(v, topic.title);
  const text = caseText(topic, lines);
  if (kind === "bridge") return TRUSS.test(text) ? "truss-bridge" : SUSPENSION.test(text) ? "bridge" : "girder-bridge";
  if (kind === "dam") return EARTH.test(text) ? "embankment-dam" : "dam";
  return kind;
}
// the mechanism the case file names, shown on the drawing (props.mech), only for the classes that can show it
function structureMechanism(topic, kind, lines = []) {
  const v = topic.case || {}; const text = [v.tetik, v.mekanizma, ...(v.zincir || [])].join(" ");
  if (/dam$/.test(kind)) {
    if (/\bovertop\w*|\bover the (crest|top|dam)\b|\bspill\w* over\b/i.test(text)) return "overtop";
    if (/\b(seep\w*|piping|leak\w*|internal erosion)\b/i.test(text)) return kind === "embankment-dam" ? "seepage" : "uplift";
    if (/\b(uplift|foundation|abutment|underneath|under the dam)\b/i.test(text)) return "uplift";
    return null;
  }
  if (/bridge$|walkway/.test(kind)) {
    if (/\b(wind\w*|gale|gust\w*|storm)\b/i.test(text)) return "wind";
    if (/\b(load\w*|weight|overload\w*|heav\w*|traffic|buckl\w*|compression|concrete)\b/i.test(text)) return "load";
  }
  return null;
}
// the structure itself survived (Vajont: the slope failed, the wave went over a dam that still stands)
const HOLDS = /\b(dam|bridge|structure) (itself )?(survived|held|still stands|stayed standing|remained standing)\b/i;
const WATER = /\b(river|sea|bay|lake|estuary|harbou?r|channel|reservoir|creek|water)\b/i;
// the case's own mechanism decides the motion: an uncontrolled spin or tumble of a spacecraft rotates the drawing
function objectMotion(topic, kind) {
  const v = topic.case || {}; const text = [v.sonuc, v.tetik, v.mekanizma, ...(v.zincir || [])].join(" ");
  return ["capsule", "satellite"].includes(kind) && /\b(spin\w*|tumbl\w*|rotat\w*|rolled|rolling)\b/i.test(text) ? "spin" : null;
}
const DOCKED = /\b(dock\w*|target vehicle|agena)\b/i;

// on-screen headlines are always a contiguous span of an authored text (a narration line, a chain label, a thumbnail
// line): never words picked out of a sentence (#364: "THRUSTER CIRCUITS REDESIGNED ISOLATE")
const HEAD_STOP = new Set(["a", "an", "the", "and", "or", "but", "of", "to", "in", "on", "at", "by", "for", "with", "from", "as", "is", "was", "were", "be", "that", "which", "it", "its", "so"]);
function phrase(text, max = 5) {
  // only a whole clause of the line (up to its first , ; : . ! ?), 2..max words: a complete thought, never a cut-off one
  const ws = String(text || "").replace(/[“”"]/g, "").split(/\s+/).filter(Boolean);
  const end = ws.findIndex((w) => /[,;:.!?]$/.test(w)); const clause = (end >= 0 ? ws.slice(0, end + 1) : ws).map((w) => w.replace(/[,;:.!?]+$/, ""));
  if (clause.length < 2 || clause.length > max || HEAD_STOP.has(clause[clause.length - 1].toLowerCase())) return "";
  // a time or sequence marker alone ("Hours later", "Within minutes") says nothing as a headline
  if (/^(\w+\s+)?(later|afterwards|after that|earlier|before|ago|minutes|hours|days|seconds)$/i.test(clause.join(" ")) || /^(within|after|then|suddenly|meanwhile)\b/i.test(clause[0])) return "";
  return clause.join(" ").toUpperCase();
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
  const kind = objectKind(topic, lines); const chain = (v.zincir || []).slice(0, 5);
  const CH = { x: 540, gap: 230 };
  // no dissolve: it overlays the outgoing headline on the incoming chain links for a few frames (text gate FAIL, FR-aberfan)
  let ti = 0; const nextTransition = () => TRANSITIONS[(ti++) % TRANSITIONS.length];
  const motion = objectMotion(topic, kind); const docked = kind === "capsule" && DOCKED.test([v.sonuc, v.tetik, v.mekanizma, ...(v.zincir || [])].join(" "));
  // the object fits 900 x 640 around y 820 (y 500-1140): clear of the chips, the watermark, the y 330 headlines and the captions
  const mech = structureMechanism(topic, kind, lines); const water = /bridge$/.test(kind) && WATER.test(caseText(topic, lines));
  const holds = HOLDS.test(caseText(topic, lines));
  // a suspension bridge whose case names the chain, an eyebar or a cable as what broke: the failure is drawn there
  const atChain = kind === "bridge" && /\b(eyebars?|chain|cables?|hangers?|suspenders?)\b/i.test([v.tetik, v.mekanizma, ...(v.zincir || [])].join(" "));
  // spacecraft cases: a star field when the case is in orbit or space; a stuck thruster drawn firing when the case file
  // names one; the docked target separates on the line that says it undocked and is gone after it
  const space = ["capsule", "satellite", "shuttle"].includes(kind) && /\b(orbit\w*|space|spacewalk)\b/i.test(caseText(topic, lines));
  const plume = motion === "spin" && /\bthrusters?\b/i.test([v.tetik, v.mekanizma].join(" "));
  const undockLine = docked ? lines.findIndex((L) => /\b(undock\w*|separat\w*|cast off)\b/i.test(L.text)) : -1;
  // the line where the crew stops the spin: it slows to a halt there, the stuck thruster's jet is off, and the object is
  // still from then on (#364: Gemini 8 kept spinning through "Armstrong used the re-entry thrusters to stop it")
  const stopLine = motion === "spin" ? lines.findIndex((L) => /\b(stop(ped|s)? (it|the spin|the roll)|regain\w* control|stabili[sz]\w*|halt\w* (it|the spin)|brought it under control)\b/i.test(L.text)) : -1;
  const spinAt = (i) => (!motion ? {} : stopLine < 0 || i < stopLine ? { motion } : i === stopLine ? { motion, stopAt: off(lines[i].id, 0.8) } : { motion: null });
  let cur = 0; const dockAt = (i) => (!docked ? {} : undockLine < 0 || i < undockLine ? { docked: true } : i === undockLine ? { docked: true, undockAt: off(lines[i].id, 0.3) } : { docked: false });
  const silhouette = (props) => ({ component: "object-silhouette", props: { kind, x: 540, y: 820, w: 900, maxH: 640, seed: 31, ...spinAt(cur), ...dockAt(cur), ...(water ? { water: true } : {}), ...(holds ? { holds: true } : {}), ...(atChain ? { failPart: "chain" } : {}), ...(space ? { stars: true } : {}), ...(plume && (stopLine < 0 || cur <= stopLine) ? { plume: true } : {}), ...props,
    // one continuous spin: it began at the hook's failure (0.6 s) and every later drawing continues it at the same angle
    ...(motion && spinAt(cur).motion && props.failAt != null ? { failAt: 0.6 } : {}) } });
  // headlines sit below the chip column (y >= 460) and shrink with length so they never reach the frame edge
  const headline = (at, text, y = 470, size = S.title, source = null) => ({ component: "kinetic-type", screen: true, props: { items: [{ at, text, x: 540, y: Math.max(460, y), size: text.length > 22 ? Math.max(44, Math.round(size * 22 / text.length)) : size, family: "sans", ...(source ? { source } : {}) }] } });
  const readout = (at, text, y = 1200) => ({ component: "kinetic-type", screen: true, props: { items: [{ at, text, x: 540, y, size: S.display, family: "num", style: "pop" }] } });
  // the chain is a screen layer with its own scrolling window between the chips and the caption band
  const chainLayer = (keys) => ({ component: "failure-chain", screen: true, props: { x: CH.x, gap: CH.gap, w: 780, steps: chain, activeKeys: keys, window: { center: 800, top: 300, bottom: 1250 } } });
  // the case stamp: short name + year, both in the case fact (F "case")
  const name = v.kisa || v.ad; const stamp = [name, v.yil && !String(name || "").includes(String(v.yil)) ? v.yil : null].filter(Boolean).join(" · ").toUpperCase();
  const toll = String(v.sayi || "").toUpperCase();
  // the trigger headline is the chain's own label for the trigger (authored, grammatical), the contrast/payoff fallback
  // is the case's first thumbnail line
  const triggerLabel = String(chain.map((c) => [c, overlap(c, v.tetik || "")]).sort((a, b) => b[1] - a[1])[0]?.[0] || chain[0] || "").toUpperCase();
  const kapak = String((v.kapak || [])[0] || stamp).toUpperCase(); const kapak2 = String((v.kapak || [])[1] || kapak).toUpperCase();

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

  // position of line i inside its run of consecutive chain lines (0 for the first)
  const runIndex = (i) => { let n = 0; for (let j = i - 1; j >= 0 && String(roleOf[j]).startsWith("chain:"); j -= 1) n += 1; return String(roleOf[i]).startsWith("chain:") ? n : -1; };
  let prevKind = null; let mechCount = 0; const hookZ = motion === "spin" ? 1.45 : 1.18;
  const scenes = lines.map((L, i) => {
    cur = i; const role = roleOf[i]; const start = i === 0 ? 0 : `${L.id}-0.15`; const end = `${L.id}.end`;
    const drift = i % 2 ? 30 : -30; let kind_, layers, purpose, camera, evidence = [F("case")], chips = ["conceptualLabel", "factLabel"];
    if (role === "hook") {
      // frame 0 must show the object (QA: first frame not empty): it is drawn whole at t=0 and gives way at 0.6 s
      // with a named mechanism the load (wind, water) is already on the object at frame 0 and it gives way at 0.9 s
      kind_ = "hook"; layers = [silhouette(mech ? { failAt: 0.9, mech, mechAt: -0.4 } : { failAt: 0.6, ...(plume ? { plumeAt: 0 } : {}) }), ...(stamp ? [headline(`${L.id}+0.3`, stamp, 330, S.title)] : [])];
      purpose = `Hook: frame 0 draws the ${kind} as clean line work and it gives way at the failure point within the first second, with the case stamp (${stamp || "case"}), so the consequence is on screen before any cause.`;
      // a spin starts close on the still object and pulls back as it spins up, so the turning circle stays in frame
      camera = [{ at: start, x: 540, y: 820, z: hookZ }, { at: end, x: 540 - drift, y: 830, z: 1.02 }];
    } else if (role === "toll") {
      kind_ = "toll"; layers = [silhouette({ failAt: -1, enterAt: undefined }), readout(`${L.id}+0.25`, toll, 1210)];
      purpose = `Toll: the broken ${kind} holds while the case's count (${toll}) is stamped below it; the number is the case file's, not computed.`;
      camera = [{ at: start, x: 540, y: 860, z: 1.0 }, { at: end, x: 540 + drift, y: 880, z: 1.16 }];
    } else if (role === "trigger") {
      kind_ = "trigger"; evidence = [F("trigger"), F("case")];
      layers = [silhouette({ failAt: off(L.id, mech ? 1.2 : 0.3), ...(mech ? { mech, mechAt: start } : {}) }), headline(`${L.id}+0.2`, triggerLabel, 330, S.title, triggerLabel)];
      purpose = `Trigger: the camera closes in on the failure point of the intact ${kind} as the crack starts there, while the case file's trigger is set in three words.`;
      // a spinning object sweeps its whole turning circle: a gentler push keeps it in frame
      camera = [{ at: start, x: 540, y: 820, z: 1.0 }, { at: end, x: 540, y: 800, z: motion === "spin" ? 1.3 : 1.85 }];
    } else if (role === "contrast") {
      kind_ = "contrast"; evidence = [F("misconception"), F("case")];
      layers = [silhouette({ drawAt: off(L.id, -0.1) }), headline(`${L.id}+0.25`, phrase(L.text) || kapak, 330, S.title, phrase(L.text) ? L.text : kapak)];
      purpose = "Contrast: the object redrawn whole while the line corrects what most people assume; it holds the misconception up against the case file.";
      camera = [{ at: start, x: 540 + drift * 2, y: 840, z: 1.3 }, { at: end, x: 540 - drift * 2, y: 800, z: 1.0 }];
    } else if (role === "payoff") {
      kind_ = "payoff"; evidence = [F("lesson"), F("case")];
      const lesson = headline(`${L.id}+0.3`, phrase(L.text) || kapak2, 330, S.title, phrase(L.text) ? L.text : kapak2); lesson.props.items[0].outAt = "end-0.45";
      layers = [silhouette({ drawAt: off(L.id, -0.1) }), lesson];
      purpose = "Payoff: the lesson in a few of the line's words over the object redrawn whole; the camera returns to the exact frame-0 framing and the lesson clears before the end, so the last frame matches the first and the Short loops (#357).";
      camera = [{ at: start, x: 540 - drift * 2, y: 860, z: 1.32 }, { at: "end-0.6", x: 540, y: 820, z: hookZ }];
    } else if (String(role).startsWith("chain:") && ((runIndex(i) >= 2 && prevKind !== "mechanism") || i === undockLine || i === stopLine)) {
      // a third (fifth) chain line in a row is a close-up of the mechanism, not a third card scene (#364: four card scenes
      // in a row); the lines between go back to the chain, so mechanism scenes never repeat back to back. The lines where
      // a spacecraft undocks or is brought back under control are seen on the object too, not on a dimmed card
      const k = +role.split(":")[1]; kind_ = "mechanism"; evidence = [F("chain"), F("mechanism"), F("case")];
      const label = String(chain[k] || "").toUpperCase();
      // with a named mechanism the scene plays cause -> effect: the intact object under its load (load path, wind,
      // water), then it gives way at the failure point; without one, the broken object is examined
      layers = [silhouette(mech ? { failAt: off(L.id, 1.4), mech, mechAt: start } : { failAt: -1 }), ...(label ? [headline(`${L.id}+0.2`, label, 330, S.title, chain[k])] : [])];
      purpose = `Mechanism close-up: the camera closes in on the failure point of the ${kind} while chain link ${k + 1} ("${chain[k]}") is named, so the cause is seen on the object, not only read on a card.`;
      // alternate push-in and pull-back, so two mechanism scenes in a row never repeat the same move
      const [fx, fy] = [540, 820]; const push = mechCount++ % 2 === 0;
      camera = push ? [{ at: start, x: fx + drift, y: fy, z: 1.15 }, { at: end, x: fx, y: fy - 20, z: 1.6 }] : [{ at: start, x: fx, y: fy - 20, z: 1.55 }, { at: end, x: fx - drift, y: fy, z: 1.0 }];
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
    prevKind = kind_;
    return { id: `s${i + 1}-${kind_}`, lines: [L.id], start, env: "blueprint", ...(i === 0 ? {} : { transition: { type: nextTransition(i), dur: 0.5 } }), evidence: [...new Set(evidence)], chips, conceptual: true, visualPurpose: purpose, camera, layers };
  });
  // consecutive chain scenes share one continuous camera move, so they are joined with a continuity cut; plates alternate
  scenes.forEach((sc, k) => { if (k && sc.id.endsWith("-chain") && scenes[k - 1].id.endsWith("-chain")) sc.transition = { type: "continuity", dur: 0.3 }; });
  // the remaining real cuts cycle the clip reveals in order, so a chain run does not use up the variety (#357)
  ti = 0; scenes.forEach((sc, k) => { if (k && sc.transition.type !== "continuity") sc.transition.type = nextTransition(); });
  // plates alternate blueprint / void at every cut; a continuity cut keeps its group's plate; the payoff returns to the
  // hook's blueprint, and when that would repeat the previous plate, the previous group takes the teal plate
  const cont = (sc) => sc.transition && sc.transition.type === "continuity";
  scenes.forEach((sc, k) => { sc.env = k === 0 ? "blueprint" : cont(sc) ? scenes[k - 1].env : scenes[k - 1].env === "blueprint" ? "void" : "blueprint"; });
  const last = scenes.length - 1; scenes[last].env = "blueprint";
  if (scenes[last - 1].env === "blueprint") for (let k = last - 1; k > 0; k -= 1) { scenes[k].env = "teal"; if (!cont(scenes[k])) break; }
  // no headline text twice in one Short (#364: "583 KILLED" as toll and again as payoff): later copies are dropped
  const seen = new Set();
  scenes.forEach((sc) => sc.layers.forEach((l) => { if (l.component === "kinetic-type") l.props.items = l.props.items.filter((it) => { const k = String(it.text).trim(); if (!k || seen.has(k)) return false; seen.add(k); return true; }); }));
  // a headline followed by another headline clears before its line ends: the transition never overlays the two in the
  // same band (#364: "THRUSTER STICKS ON" x "UNDOCKING MAKES IT WORSE" during the cut)
  const heads = (sc) => sc.layers.filter((l) => l.component === "kinetic-type").flatMap((l) => l.props.items).filter((it) => it.y <= 480);
  scenes.forEach((sc, k) => { if (k < last && heads(scenes[k + 1]).length) heads(sc).forEach((it) => { if (it.outAt == null) it.outAt = off(`${sc.lines[0]}.end`, -0.25); }); });
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

module.exports = { build, objectKind, structureMechanism };
