"use strict";
// GoalLore Lab automatic storyboard: a deterministic football grammar from a researched record, no model call. The
// line's own words pick the visual; nothing in it claims match geometry it does not have:
//   hook     floodlit stadium + pitch with a generic model kick (RECONSTRUCTION + PHYSICS MODEL chips)
//   when     a line naming a place/date/fixture: the stadium dot-matrix board spells the line's own words
//   strike   a line about the strike (hit, struck, shot, boot, header): a close boot-meets-ball contact drawing
//   flight   a line about the ball's path (swung, bent, curve, wide, dipped): the model kick from behind the wall
//   year     a later year ("In 2010 ..."): the ruler runs from the event's year to it
//   physics  spin / drag / force / speed: the airflow model; the next physics line gets the spiral model
//   number   a cited count (goals, caps, titles): stamped readout over the stands
//   story    otherwise: the line's key phrase over the stands
//   payoff   back behind the ball; the channel tagline lands over the stadium
// The kick is the same illustrative model throughout (scripts/bto-studio/page/components/football.js RK4 drag + Magnus):
// a shape, never tracking data. Players are generic standing tokens: no likeness, no kits, no crests.
const { keyPhrase, numbersIn } = require("./impossible-brief");

const TRANSITIONS = ["scan-wipe", "iris"];
const KICK = { x0: 3, y0: -17.5, speed: 30, elevation: 14, azimuth: 9, spinRps: 10 };
const WALL = [0.6, 1.3, 2.0, 2.7].map((x, i) => ({ id: `w${i}`, team: "away", path: [[0, x, -26.65]] }));
const KEEPER = { id: "gk", team: "away", path: [[0, -0.4, -52.0]] };
const pitch = (props) => ({ component: "football-pitch", props: { tokenStyle: "standing", ...props } });
const stadium = (at, horizonY = 700, seed = 23) => ({ component: "stadium", props: { horizonY, seed, lightsOnAt: at } });

function off(a, d) { const m = String(a).match(/^(.*?)([+-]\d+(?:\.\d+)?)?$/); const v = +((m[2] ? parseFloat(m[2]) : 0) + d).toFixed(2); return v ? `${m[1]}${v > 0 ? "+" : ""}${v}` : m[1]; }
const factHas = (fact, raw) => new RegExp(`(^|\\D)${raw.replace(/,/g, ",?")}(\\D|$)`).test(fact.claim + " " + (fact.quote || ""));
const rows = (text) => { const ws = String(text).replace(/[.,;:!?]/g, "").toUpperCase().split(/\s+/).filter(Boolean); const out = [""];
  ws.forEach((w) => { const cur = out[out.length - 1]; if (cur && (cur + " " + w).length > 14) { if (out.length < 3) out.push(w); } else out[out.length - 1] = cur ? cur + " " + w : w; }); return out; };

// ---- football events (#364 review: GLL-021 showed a free-kick wall for the Hand of God and the solo goal) --------------
// The research text names the kind of goal; each kind has its own pitch scene, built from the same pitch component
// (generic tokens, model ball): nothing beyond what the line says is claimed (positions and timings are illustrative).
const EVENT_RE = {
  hand: /\b(hand of god|handball|hand ball|with (his|her) hand|punched (it|the ball)|fist(ed)?)\b/i,
  dribble: /\b(dribbl\w*|solo (run|goal)|weav\w*|slalom|past (two|three|four|five|six|seven|\d+) (\w+ )?(players|defenders|opponents))\b/i,
  penalty: /\b(penalt\w*|spot[- ]kick|from the spot|shoot-?out|panenka)\b/i,
  freekick: /\bfree[- ]kicks?\b/i,
  header: /\b(header|headed|heads? (it|the ball) (in|home))\b/i,
  shot: /\b(volley\w*|shot|shoots|struck|strikes?|scored|scores|fired|curled)\b/i,
};
// the most visual kind the record names leads the hook (a solo run over a goal-line tap-in)
const PRIORITY = ["dribble", "freekick", "header", "penalty", "hand", "shot"];
const eventsIn = (text) => PRIORITY.filter((k) => EVENT_RE[k].test(text));
const KEEPER_C = { id: "gk", team: "away", path: [[0, -0.4, -52.0]] };

// a pitch scene for one football event, timed from t0 (an anchor); view "hook" = low behind the play, "replay" = higher
function eventPitch(kind, i, t0, { variant = null, view = "hook" } = {}) {
  const at = (d) => off(t0, d); const id = `p${i}-${kind}`; const hi = view === "replay";
  if (kind === "dribble") {
    // a solo run through five defenders from midfield to the box, then the finish; the ball stays at the runner's feet
    const wp = [[0, -3, -4], [0.75, 2, -14], [1.5, -4, -24], [2.25, 3, -33], [3.0, 1, -42]];
    const att = { id: "att", team: "home", pathKeys: wp.map(([d, x, y]) => [at(d), x, y]) };
    const defs = [[0.4, 0, -10], [1.1, -1, -19], [1.9, 1.5, -28], [2.6, -2, -37], [2.9, 4, -40]].map(([d, x, y], k) => ({ id: `d${k}`, team: "away",
      pathKeys: [[at(0), x, y], [at(d), x, y], [at(d + 0.5), x + (k % 2 ? 1.8 : -1.8), y - 1.5]] }));
    // the camera rides with the runner, close enough that the defenders he passes read as players (#364 review: 26 px/m
    // left the run as dots behind the captions)
    return { layers: [pitch({ id, x: 540, y: 980, rx: hi ? 56 : 64, rz: hi ? 0 : -6, D: 3800, pxPerMetre: hi ? 34 : 44,
      focusKeys: wp.map(([d, x, y]) => [at(d), x * 0.8, y - 3]), players: [att, ...defs, KEEPER_C],
      ball: wp.slice(1).map(([d], k) => ({ at: at(wp[k][0]), dur: d - wp[k][0], src: "att", dst: "att" })), ballOutAt: at(3.0),
      kicks: [{ x0: 1, y0: -42, speed: 22, elevation: 5, azimuth: -3, spinRps: 0, at: at(3.0), timeScale: 1, hideBefore: true }] })],
      purpose: "Solo run: a generic forward token carries the ball from midfield past five defender tokens, the ball at his feet, then finishes; the run's line is left on the pitch (illustrative positions)." };
  }
  if (kind === "hand") {
    // a looping ball near the goal, the forward and the keeper go up for it together and the ball drops into the net
    return { layers: [pitch({ id, x: 540, y: 1160, rx: hi ? 58 : 72, rz: -8, D: 4200, pxPerMetre: hi ? 40 : 56, focusKeys: [[at(0), 0, -40], [at(1.4), 0, -46]],
      players: [{ id: "def", team: "away", path: [[0, 1, -30]] }, { id: "att", team: "home", pathKeys: [[at(0), -1, -38], [at(1.4), 0, -46.6]] },
        { id: "gk", team: "away", pathKeys: [[at(0), 0, -51.5], [at(1.4), 0.3, -47.6]] }],
      ball: [{ at: at(0.2), dur: 1.2, src: [1, -30], dst: [0, -47], height: 7 }, { at: at(1.4), dur: 0.5, src: [0, -47], dst: [-1.5, -52.6], height: 0.6 }] })],
      purpose: "The ball loops up near goal; the forward token and the keeper token meet it together and it drops into the net (the moment the line names; positions illustrative)." };
  }
  if (kind === "penalty") {
    // from the spot: placed low, chipped down the middle while the keeper dives, or over the bar
    const k = variant === "chip" ? { speed: 13, elevation: 26, azimuth: 0 } : variant === "miss" ? { speed: 26, elevation: 19, azimuth: 2 } : { speed: 24, elevation: 4, azimuth: -7 };
    const dive = variant === "miss" ? 0.8 : 3.2;
    const goalView = view === "replay";
    return { layers: [pitch({ id, x: 540, y: goalView ? 1040 : 1160, rx: goalView ? 68 : 72, rz: goalView ? 118 : -4, D: goalView ? 3600 : 4200, pxPerMetre: goalView ? 52 : 70,
      focusKeys: goalView ? [[at(0), 1, -49]] : [[at(0), 0, -43], [at(1.2), 0, -47]],
      players: [{ id: "taker", team: "home", pathKeys: [[at(0), -2, -37.5], [at(0.6), -0.3, -41]] }, { id: "gk", team: "away", pathKeys: [[at(0), 0, -52.2], [at(0.7), 0, -52.2], [at(1.1), dive, -52.2]] }],
      kicks: [{ x0: 0, y0: -41.5, ...k, spinRps: 0, at: at(0.65), timeScale: 1 }] })],
      purpose: variant === "chip" ? "Penalty: the keeper token dives to one side while the model ball is chipped softly down the middle into the net."
        : variant === "miss" ? "Penalty: the model ball rises over the crossbar." : "Penalty from the spot: the taker token steps up and places the model ball low past the keeper token." };
  }
  if (kind === "header") {
    return { layers: [pitch({ id, x: 540, y: 1160, rx: 70, rz: 20, D: 4000, pxPerMetre: 44, focusKeys: [[at(0), 10, -44], [at(1.2), 2, -48]],
      players: [{ id: "att", team: "home", path: [[0, 2, -46]] }, { id: "def", team: "away", path: [[0, 3.5, -45]] }, KEEPER_C],
      ball: [{ at: at(0.2), dur: 1.0, src: [26, -44], dst: [2, -46], height: 6 }, { at: at(1.2), dur: 0.45, src: [2, -46], dst: [-1, -52.6], height: 0.5 }] })],
      purpose: "Header: a cross from the wing meets the forward token near the goal and is directed into the net (model ball, illustrative positions)." };
  }
  if (kind === "freekick") {
    return { layers: [pitch({ id, x: 540, y: 1160, rx: 74, rz: -8, D: 4200, ppmKeys: [[at(0), 74], [at(4), 84]], focusKeys: [[at(0), 3, -24], [at(4), 2, -36]], players: [...WALL, KEEPER], kicks: [{ ...KICK, at: at(0.25), timeScale: 0.6 }] })],
      purpose: "Free kick: low floodlit camera behind the ball and a wall of generic tokens; the model kick bends round the wall." };
  }
  // shot: a short run and a strike at goal
  return { layers: [pitch({ id, x: 540, y: 1160, rx: 70, rz: -6, D: 4000, pxPerMetre: 48, focusKeys: [[at(0), 0, -32], [at(1.4), 0, -44]],
    players: [{ id: "att", team: "home", pathKeys: [[at(0), -1, -28], [at(0.8), 1, -34]] }, { id: "d1", team: "away", path: [[0, 3, -38]] }, KEEPER_C],
    kicks: [{ x0: 1, y0: -34.5, speed: 27, elevation: 6, azimuth: -5, spinRps: 0, at: at(0.8), timeScale: 1 }] })],
    purpose: "Shot: a forward token runs onto the model ball and strikes it at goal." };
}

function build(script, style, topic) {
  const lines = script.lines; const facts = script.facts; const S = style.type.scale;
  const tagline = String((style.identity && style.identity.tagline) || "Every Goal Has a Story.").replace(/\.$/, "").toUpperCase();
  let ti = 0; const mid = Math.floor(lines.length / 2); const nextTransition = (i) => (i === mid ? "dissolve" : TRANSITIONS[(ti++) % TRANSITIONS.length]);
  const type = (at, text, y, size, color) => ({ component: "kinetic-type", screen: true, props: { items: [{ at, text, x: 540, y, size: text.length > 20 ? Math.max(44, Math.round(size * 20 / text.length)) : size, family: "sans", style: "pop", ...(color ? { color } : {}) }] } });
  const eventYear = (() => { for (const f of facts) { const y = numbersIn(f.claim).find((n) => n.year); if (y) return y.value; } return null; })();
  let physicsN = 0; let flightN = 0;
  // the record's own kind of goal leads (a free kick only when the record names one)
  const allText = [script.title, ...lines.map((l) => l.text)].join(" ");
  const primary = eventsIn(allText)[0] || "shot"; const freeKickTopic = primary === "freekick";
  const chipTopic = /\b(chip\w*|panenka|down the middle|into the middle)\b/i.test(allText);
  const penaltyVariant = (t) => (/\b(over the bar|missed|wide|hit the post)\b/i.test(t) ? "miss" : /\b(chip\w*|middle|gently)\b/i.test(t) || (chipTopic && /\b(stepped up|dived|dive)\b/i.test(t)) ? "chip" : null);
  const seen = {}; let prevKind = null;
  const scenes = lines.map((L, i) => {
    const first = i === 0, last = i === lines.length - 1; const start = first ? 0 : `${L.id}-0.2`; const end = `${L.id}.end`; const t = L.text;
    const ev = (L.evidenceSuggested || []).filter((id) => facts.some((f) => f.id === id)); const evidence = ev.length ? ev.slice(0, 3) : [facts[0].id];
    const nums = numbersIn(t).map((n) => ({ ...n, facts: facts.filter((f) => factHas(f, n.raw)).map((f) => f.id) })).filter((n) => n.facts.length);
    const year = nums.find((n) => n.year); const qty = nums.find((n) => !n.year);
    let kind, layers, purpose, camera, chips = ["illustrationLabel", "conceptualLabel"], model = false;
    // in a penalty record, a line about the kick itself (over the bar, stepped up, the keeper dived) is a penalty scene
    // "the final went to penalties" sets the scene; it is not a kick
    const context = /\b(went to|decided on|settled (on|by)) (penalt\w*|a shoot-?out)\b/i.test(t);
    const lineEvent = context ? null : eventsIn(t)[0] || (primary === "penalty" && /\b(kick|shot|bar|stepped up|dived|dive|net)\b/i.test(t) ? "penalty" : null);
    const evKind = lineEvent && lineEvent !== "shot" ? lineEvent : null;
    if (first || last) {
      kind = first ? "hook" : "payoff"; model = true;
      const ev = eventPitch(primary, i, off(start, first ? 0.05 : 0.1), { variant: primary === "penalty" ? (chipTopic ? "chip" : null) : null });
      layers = [stadium(first ? 0 : -1), ...ev.layers, ...(last ? [type(`${L.id}+0.3`, tagline, 470, S.title, "amber")] : [])];
      purpose = first ? `Hook: the record's own kind of goal (${primary}) on the floodlit pitch within the first second, so the moment is on screen before it is named. ${ev.purpose}`
        : `Payoff: the same ${primary} at night, where the hook started, and the channel tagline lands over the stands so the Short loops.`;
      camera = [{ at: start, x: 540, y: 800, z: 1.0 }, { at: end, x: 540, y: 800, z: 1.04 }];
    } else if (year && eventYear && year.value > eventYear) {
      kind = "year"; evidence.unshift(...year.facts.filter((f) => !evidence.includes(f)).slice(0, 1)); chips = ["illustrationLabel"];
      layers = [stadium(-1, 1180, 41), { component: "timeline-ruler", screen: true, props: { y: 900, fromYear: eventYear, year: year.value, pxPerYear: 70, enterAt: `${L.id}-0.1`, arriveAt: `${L.id}+0.7`, outAt: end } }];
      purpose = `Time: the ruler runs from ${eventYear} to ${year.raw} over the stands, so the gap between the moment and its explanation is seen.`;
      camera = [{ at: start, x: 540, y: 800, z: 1.0 }, { at: end, x: 540, y: 790, z: 1.06 }];
    } else if (/\b(in|at|against|versus|v)\b/i.test(t) && (year || /\b[A-Z][a-z]+\b.*\b(against|versus|v)\b/.test(t)) && i <= 2) {
      kind = "when"; chips = ["illustrationLabel"];
      const r = rows(t).slice(0, 3); layers = [stadium(off(start, 0), 1180, 23), { component: "dot-board", screen: true, props: { x: 540, y: 760, dot: 8, gap: 3, enterAt: off(start, 0.1), rows: r.map((text, k) => ({ text, at: off(L.id, 0.15 + k * 0.45), color: k === 1 ? "amber" : "paper" })) } }];
      purpose = "Place and date on the stadium's dot-matrix board, spelled from the line's own words over the floodlit stands.";
      camera = [{ at: start, x: 540, y: 800, z: 1.0 }, { at: end, x: 540, y: 780, z: 1.06 }];
    } else if (evKind && (evKind !== "freekick" || !/\b(spin|drag|magnus|swung|bent|curv\w*)\b/i.test(t))) {
      // the line names a kind of goal: that event on the pitch (a second time from a higher replay camera)
      kind = evKind; model = true; seen[evKind] = (seen[evKind] || 0) + 1;
      const ev = eventPitch(evKind, i, off(start, 0.15), { variant: evKind === "penalty" ? penaltyVariant(t) : null, view: seen[evKind] % 2 === 0 ? "replay" : "hook" });
      layers = [stadium(-1, 640, 31 + i), ...ev.layers, ...(keyPhrase(t, 4) ? [type(`${L.id}+0.3`, keyPhrase(t, 4), 470, S.title)] : [])];
      purpose = ev.purpose; chips = ["illustrationLabel", "conceptualLabel"];
      camera = [{ at: start, x: 540, y: 800, z: 1.0 }, { at: end, x: 540, y: 800, z: 1.06 }];
    } else if (freeKickTopic && /\b(spin|spins|spinning|drag|air|force|forces|magnus|physic\w*|aerodynamic\w*|spiral|slower|tighter)\b/i.test(t)) {
      kind = "physics"; model = true; physicsN += 1;
      layers = physicsN === 1
        ? [{ component: "airflow", screen: true, props: { x: 540, y: 720, R: 120, U: 260, w: 960, h: 760, enterAt: start, spinKeys: [[start, 0.22], [end, 0.22]], forceAt: off(L.id, 0.4), forceLen: 170, dragAt: off(L.id, 1.2), dragLen: 180, slowKeys: [[off(L.id, 1.2), 1], [end, 0.5]] } }]
        : [{ component: "spiral-plot", screen: true, props: { id: `sp${i}`, box: { x: 90, y: 300, w: 900, h: 940 }, speed: 30, drag: 0.012, magnus: 0.0022, spin: 82, minSpeed: 1.2, kickLen: 33, drawAt: off(L.id, -0.1), drawEndAt: end } }];
      chips = ["illustrationLabel", "modelLabel"];
      purpose = physicsN === 1 ? "Physics model in the ball's frame: spin speeds the air on one side and a sideways force appears; drag slows the flow while the spin holds."
        : "Physics model from above: as speed falls with spin held, the path's turning circles shrink and it closes into a spiral (model, not tracking data).";
      camera = [{ at: start, x: 540, y: 800, z: 1.0 }, { at: end, x: 540, y: 800, z: 1.06 }];
    } else if (freeKickTopic && /\b(hit|hits|struck|strike|shot|shoots|kicked|kick|volley|header|boot|foot)\b/i.test(t) && flightN === 0 && i <= 3) {
      kind = "strike";
      layers = [{ component: "line-art", screen: true, props: { x: 620, y: 800, s: 1, paths: [
          { d: "M-150 0 a150 150 0 1 0 300 0 a150 150 0 1 0 -300 0", at: start, dur: 0.01, color: "#f7f5ee", fill: "#f7f5ee", width: 6 },
          { d: "M-130 -30 Q0 -110 130 -30 M-95 80 Q0 30 95 80", at: start, dur: 0.01, color: "ink", width: 8 } ] } },
        { component: "line-art", screen: true, props: { x: 300, y: 860, s: 1, moveKeys: [[start, -420, 160, 18], [off(L.id, 0.6), 0, 0, 0], [end, 10, -10, -6]], moveEase: "inOut", paths: [
          { d: "M-260 -120 L-60 -110 Q20 -105 60 -60 L120 -10 Q150 30 110 60 L-150 70 Q-260 70 -270 0 Z", at: start, dur: 0.01, color: "paper", fill: "#1b2a22", width: 7 } ] } },
        type(`${L.id}+0.3`, keyPhrase(t, 3), 470, S.title)];
      purpose = "The strike in close-up: a generic boot swings in and meets the ball, the contact the line describes; a shape, not a likeness.";
      camera = [{ at: start, x: 540, y: 800, z: 1.0 }, { at: end, x: 570, y: 820, z: 1.14 }];
    } else if (freeKickTopic && /\b(swung|swing|swerv\w*|bent|bend|bends|curv\w*|wide|dip\w*|turned|turns|flew|flying|rose|dropped)\b/i.test(t)) {
      kind = "flight"; model = true; flightN += 1;
      const goalView = flightN % 2 === 0;
      layers = goalView
        ? [stadium(-1, 560, 41), pitch({ id: `p${i}`, x: 540, y: 1040, rx: 68, rz: 118, D: 3600, pxPerMetre: 52, focusKeys: [[start, 2, -46], [end, 1, -49]], players: [...WALL, KEEPER], kicks: [{ ...KICK, at: off(start, -1.6), timeScale: 0.42 }] })]
        : [pitch({ id: `p${i}`, x: 540, y: 880, rx: 58, rz: -14, D: 3200, ppmKeys: [[start, 30], [end, 36]], focusKeys: [[start, 3, -26]], follow: { kick: 0, at: off(start, 0.3), ease: 0.6, blend: 0.6 }, players: [...WALL, KEEPER], kicks: [{ ...KICK, at: off(start, 0.1), timeScale: 0.34 }] })];
      purpose = goalView ? "Goal-mouth view: the model ball's curve ends at the post past the keeper token and is left as a trail." : "From above and behind the wall, the camera follows the model ball as it swings round the wall, as the line describes its path.";
      camera = [{ at: start, x: 540, y: 800, z: 1.0 }, { at: end, x: 540, y: 795, z: 1.04 }];
    } else if (qty) {
      kind = "number"; evidence.unshift(...qty.facts.filter((f) => !evidence.includes(f)).slice(0, 1)); chips = ["illustrationLabel"];
      layers = [stadium(-1, 1180, 17), type(`${L.id}+0.3`, `${qty.raw}${qty.unit ? " " + qty.unit : ""}`.toUpperCase(), 900, S.display)];
      purpose = `Number: the cited figure (${qty.raw}) is stamped over the stands as it is spoken.`;
      camera = [{ at: start, x: 540, y: 800, z: 1.0 }, { at: end, x: 540, y: 810, z: 1.1 }];
    } else if (prevKind === "story" || prevKind === "when") {
      // never two bare-stadium beats in a row (#364 review: three empty stadium scenes): the record's own goal again,
      // from the higher replay camera, under the line's key phrase
      kind = "replay"; model = true; const ev = eventPitch(primary, i, off(start, 0.15), { variant: primary === "penalty" ? (chipTopic ? "chip" : null) : null, view: "replay" });
      layers = [stadium(-1, 640, 37 + i), ...ev.layers, ...(keyPhrase(t, 4) ? [type(`${L.id}+0.3`, keyPhrase(t, 4), 470, S.title)] : [])];
      purpose = `Replay: the ${primary} again from a higher camera while the line carries the story (illustrative positions).`; chips = ["illustrationLabel", "conceptualLabel"];
      camera = [{ at: start, x: 540, y: 800, z: 1.0 }, { at: end, x: 540, y: 790, z: 1.06 }];
    } else {
      kind = "story"; chips = ["illustrationLabel"];
      layers = [stadium(-1, 1100 + (i % 3) * 60, 30 + i), type(`${L.id}+0.25`, keyPhrase(t), 760, S.title)];
      purpose = "Story beat: the line's key phrase over the floodlit stands while the camera drifts, holding the moment between the visual explanations.";
      camera = [{ at: start, x: 520, y: 800, z: 1.0 }, { at: end, x: 560, y: 790, z: 1.1 }];
    }
    prevKind = kind;
    if (model && !chips.includes("modelLabel")) chips.push("modelLabel");
    return { id: `s${i + 1}-${kind}`, lines: [L.id], start, env: kind === "physics" ? (physicsN === 1 ? "desk" : "teal") : "desk", ...(first ? {} : { transition: { type: nextTransition(i), dur: 0.5 } }), evidence: [...new Set(evidence)].slice(0, 4), chips: chips.slice(0, 3), conceptual: chips.includes("conceptualLabel"), visualPurpose: purpose, camera, layers };
  });
  // plates: never the same twice in a row (the payoff returns to the hook's desk)
  scenes.forEach((sc, k) => { if (k && k < scenes.length - 1 && sc.env === scenes[k - 1].env) sc.env = sc.env === "desk" ? "spot" : "desk"; });
  if (scenes.length > 2 && scenes[scenes.length - 2].env === "desk") scenes[scenes.length - 2].env = "spot";
  // a headline followed by another headline (or a board) clears before its line ends, so the cut never overlays the two
  const tops = (sc) => sc.layers.filter((l) => l.component === "kinetic-type").flatMap((l) => l.props.items).filter((it) => it.y <= 500);
  scenes.forEach((sc, k) => { const nx = scenes[k + 1]; if (nx && (tops(nx).length || nx.layers.some((l) => l.component === "dot-board"))) tops(sc).forEach((it) => { if (it.outAt == null) it.outAt = off(`${sc.lines[0]}.end`, -0.25); }); });
  // digits on screen must occur in a cited fact (validator rule): failing type becomes the key phrase
  const cited = (sc) => sc.evidence.map((id) => facts.find((f) => f.id === id)).filter(Boolean).map((f) => f.claim + " " + (f.quote || "")).join(" ");
  const ok = (sc, s) => (String(s).match(/\d+/g) || []).every((d) => new RegExp(`(^|\\D)${d}(\\D|$)`).test(cited(sc)));
  scenes.forEach((sc, k) => sc.layers.forEach((l) => {
    if (l.component === "kinetic-type") l.props.items = l.props.items.map((it) => (ok(sc, it.text) ? it : { ...it, text: keyPhrase(lines[k].text) }));
    if (l.component === "dot-board") l.props.rows = l.props.rows.filter((r) => ok(sc, r.text));
  }));
  // a line with no natural short phrase gets no headline: empty text items (and then empty text layers) are removed
  scenes.forEach((sc) => { sc.layers.forEach((l) => { if (l.component === "kinetic-type") l.props.items = l.props.items.filter((it) => String(it.text || "").trim()); });
    sc.layers = sc.layers.filter((l) => l.component !== "kinetic-type" || l.props.items.length); });
  return {
    schema: "bto-studio.storyboard.v1", channel: script.channel, topicId: script.topicId, slug: script.slug, version: 1,
    author: "auto/goal-lore-lab (deterministic football grammar; needs creative review before publication)",
    licensingNote: "all drawn in-house from code (SVG): stadium, pitch, generic standing tokens (no likeness, kits or crests), boot and ball drawings, physics models; no broadcast footage, no photographs",
    treatment: {
      educationalObjective: `Tell, from the record's sources: ${script.coreQuestion || script.title}`,
      visualHook: `Frame 0: the record's own kind of goal (${primary}) on a floodlit pitch; the ball moves within the first second.`,
      mechanismsToAnimate: [...new Set(scenes.map((s) => s.id.replace(/^s\d+-/, "")))],
      factualRisks: ["the kick is one illustrative model (drag + Magnus), not tracking data of the real goal (RECONSTRUCTION + PHYSICS MODEL chips)", "players are generic tokens: positions are illustrative"],
    },
    tail: 0.4, scenes,
  };
}

module.exports = { build };
