"use strict";
// Evidence-based visual planner for the plan-driven 3D kit (review only; never published, not wired into production).
//
//   topic (narration lines + facts) -> mechanism template (pilots/templates/*.json) -> plan + scene data for kit/runtime.html
//
// No topic code: a template is chosen by the words of the narration and facts, the scene setup (foot, kick style,
// keeper action, vehicles, thrusters) is read from the facts by the readers below, and every value shown on screen is
// either quoted from a fact or computed by a model and labelled MODEL. The planner refuses (CREATIVE_REVIEW_REQUIRED)
// when no template matches, when a template needs a value the evidence does not give, when a number on screen does
// not appear in its cited fact, or when a narration line has no shot. Choices the evidence does not decide (a kicker's
// foot when no source names it) are recorded in plan.assumptions and the motion is labelled REPRESENTATIVE.
const fs = require("fs"); const path = require("path");
const flight = require("./models/football-flight"); const roll = require("./models/roll-torque");
const PILOTS = path.resolve(__dirname, "..");

class Refusal extends Error { constructor(reasons) { super(reasons.join("; ")); this.reasons = reasons; } }
const r1 = (x) => +x.toFixed(1), r2 = (x) => +x.toFixed(2);
const up = (s) => String(s).toUpperCase().replace(/\.$/, "");

// ---- topic normalisation --------------------------------------------------------------------------------------------
// GLL topic (narration[{role,text,facts}], facts[{id,claim,quote}]) or FR case file (sahneler[{metin}]) + research file
function loadTopic(file) {
  const t = JSON.parse(fs.readFileSync(file, "utf8"));
  if (t.narration) { const facts = (t.facts || []).map((f, i) => ({ id: f.id || `F${i + 1}`, claim: f.claim, quote: f.quote || "", url: f.url, layer: f.layer, source: f.source, sourceTitle: f.sourceTitle }));
    return { id: t.id, slug: t.slug, channel: t.channel, title: t.title, lines: t.narration.map((l) => ({ role: l.role, text: l.text, facts: l.facts || [] })), facts, research: t }; }
  if (t.sahneler) { const slug = path.basename(file, ".json"); const rf = path.join(PILOTS, "research", `FR-${slug}.json`);
    if (!fs.existsSync(rf)) throw new Refusal([`no research file ${path.relative(PILOTS, rf)} for case file ${slug}`]);
    const r = JSON.parse(fs.readFileSync(rf, "utf8"));
    return { id: slug, slug, channel: r.channel, title: t.baslik, lines: t.sahneler.map((s) => ({ role: null, text: s.metin, facts: [] })), facts: r.facts.map((f) => ({ quote: "", ...f })), research: r }; }
  throw new Refusal(["unknown topic format"]);
}

// ---- evidence readers ---------------------------------------------------------------------------------------------
const corpus = (T) => [...T.lines.map((l) => l.text), ...T.facts.map((f) => `${f.claim} ${f.quote}`)].join(" ");
const findFact = (T, re) => T.facts.find((f) => re.test(`${f.claim} ${f.quote}`));

function footballSetup(T, tpl, assumptions0) {
  const txt = corpus(T); const got = {}; const M = tpl.model;
  // an explainer (a law, a ball) depicts no particular event: its foot and keeper are staging, recorded but not counted
  const assumptions = M.explainer ? { push: (x) => tpl._staging.push(x) } : assumptions0;
  const footM = txt.match(/\b(left|right) foot/i); const outside = /outside of (?:his|the) (?:left|right) foot/i.test(txt); const chip = /\bchip(?:ped|s)?\b/i.test(txt);
  if (footM) { got.foot = footM[1][0].toUpperCase(); got.footSrc = findFact(T, /\b(left|right) foot/i).id; }
  else { got.foot = "R"; assumptions.push("kicking foot is not in the evidence: right foot drawn, motion labelled REPRESENTATIVE"); }
  got.style = outside ? "outside" : chip ? "chip" : "drive";
  // a curling template with no surface in the evidence draws the common inside-of-the-foot curl and says so
  if (!outside && !chip && M.spinRps && !/inside of (?:his|the) (?:left|right) foot/i.test(txt)) assumptions.push("kick surface is not in the evidence: inside-of-the-foot curl drawn, labelled REPRESENTATIVE");
  got.footPhrase = up(outside ? `outside of the ${footM ? footM[1] : "right"} foot` : chip ? "a chip" : M.spinRps ? "a curling strike" : "a driven kick");
  // keeper behaviour: stood still, or dived to a named side (the keeper's own left/right)
  const still = findFact(T, /(did not|never) move/i); const dive = findFact(T, /div(?:e|ed|ing) to (?:his|her|the) (left|right)/i);
  if (dive) { const side = `${dive.claim} ${dive.quote}`.match(/div(?:e|ed|ing) to (?:his|her|the) (left|right)/i)[1].toLowerCase();
    Object.assign(got, { keeperAction: "dive", keeperDir: side, keeperDirWord: up(`to his ${side}`), keeperPhrase: `${dive.layer && /VERIFIED/.test(dive.layer) ? "VERIFIED QUOTE" : "REPORTED"} · TIMING REPRESENTATIVE`, keeperSrc: dive.id }); }
  else if (still) Object.assign(got, { keeperAction: "static", keeperPhrase: "NEVER MOVED · REPORTED (SINGLE SOURCE)", keeperSrc: still.id });
  else if (/div(?:e|ed)/i.test(txt)) assumptions.push("the keeper dives, side not in the evidence: no direction drawn");
  else if (M.keeperOptional) { Object.assign(got, { keeperAction: "static", keeperPhrase: "NOT IN THE SOURCE · POSITION REPRESENTATIVE", keeperSrc: "MODEL" });
    assumptions.push("keeper behaviour is not in the evidence: keeper drawn in the ready stance, labelled REPRESENTATIVE"); }
  // distance: a penalty is 11 m by law; a free kick uses the reported range (the model picks a value inside it)
  if (M.distanceFromLaw) { const re = /(\d+) yards \((\d+(?:\.\d+)?) m\)/i; const f = findFact(T, re); // a distance stated by the laws, e.g. "12 yards (11 m)"
    if (f) { const m = `${f.claim} ${f.quote}`.match(re); got.distance = +m[2]; got.law = { distance: `${m[1]} YARDS`, metric: `${m[2]} m`, src: f.id }; } }
  else if (M.distance) { got.distance = M.distance; }
  else if (M.distanceLaw) { got.distance = M.distanceLaw; }
  else { const d = txt.match(/about (\d+) (?:metres|meters|m) to (\d+) yards/i); const f = findFact(T, /about (\d+) (?:metres|meters|m) to (\d+) yards/i);
    if (d) { const lo = +d[1], hi = +d[2] * 0.9144; got.distance = Math.round((lo + hi) / 2); got.distanceRange = `${d[1]} m TO ${d[2]} yd`; got.distanceSrc = `${f.id},MODEL`; }
    else { const re = /(\d+(?:\.\d+)?)[- ](?:metre|meter)s?\b/i; const g = findFact(T, re); // one reported distance, e.g. "a 33.13-metre distance"
      if (g) { const v = `${g.claim} ${g.quote}`.match(re)[1]; got.distance = Math.round(+v); got.distanceRange = `${v} m`; got.distanceSrc = `${g.id},MODEL`; } } }
  // the paper behind the explanation, if a fact names one
  const pf = findFact(T, /published '([^']+)' in ([^,]+?) \d+/i);
  const paper = pf ? (() => { const m = pf.claim.match(/In (\d{4}) (.+?) published '([^']+)' in ([^,]+?) (\d+)/i); return m ? { year: m[1], venue: up(`${m[4]} · ${m[1]}`), title: m[3], authors: m[2].replace(/,? and /, ", "),
    cite: `${m[2].split(/,| and /)[0].trim().split(" ").pop()} et al.`, src: pf.id } : null; })() : null;
  // the scoreline of a shoot-out, and the winner
  const sf = findFact(T, /won (\d+[–-]\d+) on penalties/i);
  const score = sf ? (() => { const s = `${sf.claim} ${sf.quote}`; const w = s.match(/(\b[A-Z][a-z]+(?: [A-Z][a-z]+)?) won (\d+[–-]\d+) on penalties/); const draw = s.match(/(\d+[–-]\d+) draw after extra time/);
    const comp = corpus(T).match(/UEFA Euro \d{4}|FIFA World Cup \d{4}/) || corpus(T).match(/European Championship|World Cup/); return w ? { k: up(`${comp ? comp[0].replace(/^UEFA |^FIFA /, "") : "final"} final`), h: up(`${w[1]} win ${w[2]}`), p: draw ? `After a ${draw[1]} draw after extra time` : "", src: sf.id } : null; })() : null;
  // a kick that missed over the bar (counterfactual path), and who took it
  const of = findFact(T, /over the bar/i);
  const alt = of ? (() => { const line = T.lines.find((l) => /over the bar/i.test(l.text)); const who = (line ? line.text : of.claim).match(/([A-Z][\p{L}]+ [A-Z][\p{L}]+)(?: sent| ballooned)/u);
    return { title: up(`${who ? who[1] : "the kick"}: over the bar`), small: "PATH REPRESENTATIVE · MODEL", src: `${of.id},MODEL` }; })() : null;
  // a rule's year and text (laws of the game): "the back-pass rule was introduced in 1992"
  const rf = findFact(T, /rule was introduced in (\d{4})/i); const rt = findFact(T, /prohibits goalkeepers from handling/i);
  const rule = rf ? { year: `${rf.claim} ${rf.quote}`.match(/rule was introduced in (\d{4})/i)[1], src: rf.id, textSrc: rt ? rt.id : null } : null;
  return { got, paper, score, alt, rule };
}

function footballWorld(T, tpl, assumptions) {
  const { got, paper, score, alt, rule } = footballSetup(T, tpl, assumptions); const M = tpl.model; const reasons = [];
  if (got.distance == null) reasons.push(M.distanceFromLaw ? "the law's distance is not in the evidence" : "free-kick distance not in the evidence");
  if (M.backpass && !(rule && rule.textSrc)) reasons.push("the rule's year and text are not in the evidence");
  if (!got.keeperAction) reasons.push("keeper behaviour not in the evidence");
  if (reasons.length) throw new Refusal(reasons);
  const goalZ = -got.distance; const keeper = { x: M.keeperX || 0, action: got.keeperAction, dir: got.keeperDir, diveAt: M.keeperDiveAt ?? 0.05 };
  // a ball whose panels the evidence describes (not the classic 32) is drawn plain, so the picture does not contradict it
  const ballPlain = /\b(?!thirty-two|32)\w+ (?:spherically )?moulded panels|\bpanels\b/i.test(corpus(T)) && !/\b32 panels\b/i.test(corpus(T));
  const out = { setup: { goalZ, foot: got.foot, style: got.style, keeper, kickerHeight: 1.75, ballPlain }, paths: {}, model: {} };
  if (M.backpass) { // a law shown with a back pass: no kick model needed; the ball is placed by the shot
    const B = [0, 0.11, 0]; Object.assign(out.setup, { ballStart: B, spinRps: 0, spinSign: 1, mate: true }); out.paths = { flight: [{ t: 0, p: B, v: [0, 0, -1], speed: 0 }, { t: 1, p: B, v: [0, 0, -1], speed: 0 }] };
    out.model = { label: "ILLUSTRATION (motion representative; the law is quoted)" };
  } else if (M.knuckle) { // low-spin ball: the same kick with and without the fluctuating side force (ILLUSTRATIVE)
    const B = [0, 0.11, 0]; const k = flight.kick({ ballStart: B, goalZ, ...M.shot, knuckle: M.knuckle }); const r = flight.kick({ ballStart: B, goalZ, ...M.shot });
    Object.assign(out.setup, { ballStart: B, spinRps: 0, spinSign: 1 }); out.paths = { flight: flight.thin(k.flight, 2), straight: flight.thin(r.flight, 2) };
    out.model = { speed: M.shot.speed, label: "ILLUSTRATIVE MODEL (side-force amplitude and frequency chosen to show the effect, not measured)" };
  } else if (M.drive && !M.chip) { // a plain penalty from the law's spot: a driven kick to a corner (side REPRESENTATIVE)
    const B = [0, 0.11, 0]; const d = flight.kick({ ballStart: B, goalZ, ...M.drive }); tpl._staging.push("penalty direction is not in the evidence: right corner drawn");
    Object.assign(out.setup, { ballStart: B, spinRps: 0, spinSign: 1 }); out.paths = { flight: flight.thin(d.flight, 2) }; out.model = { driveSpeed: M.drive.speed, label: "MODEL (illustrative speed)" };
  } else if (M.chip) { // penalty: chip into the middle, a driven kick toward the side the keeper went, a kick over the bar
    const B = [0, 0.11, 0]; const side = got.keeperDir === "left" ? 1 : got.keeperDir === "right" ? -1 : 1;
    const c = flight.kick({ ballStart: B, goalZ, ...M.chip }); const d = flight.kick({ ballStart: B, goalZ, ...M.drive, aim: { x: side * Math.abs(M.drive.aim.x), y: M.drive.aim.y }, yawGuess: side * Math.abs(M.drive.yawGuess || 0) });
    const o = alt ? flight.kick({ ballStart: B, goalZ, ...M.overBar }) : null;
    Object.assign(out.setup, { ballStart: B, spinRps: 0, spinSign: 1 }); out.paths = { flight: flight.thin(c.flight, 2), drive: flight.thin(d.flight, 2), ...(o ? { alt: flight.thin(o.flight, 2) } : {}) };
    const T1 = c.flight[c.flight.length - 1].t; out.model = { chipSpeed: M.chip.speed, chipPeak: r1(Math.max(...c.flight.map((s) => s.p[1]))), chipTime: r1(T1), driveSpeed: M.drive.speed, driveTime: r2(d.flight[d.flight.length - 1].t),
      chipPitchDeg: r1(c.pitch * 180 / Math.PI), label: "MODEL (illustrative speeds; paths solved to the aim points)" };
  } else { // curling free kick: the curl side follows foot and surface (outside of the left = inside of the right: curls left)
    const curlLeft = (got.foot === "R") !== (got.style === "outside"); const sx = curlLeft ? 1 : -1; const B = [sx * M.ballX, 0.11, 0];
    const k = flight.kick({ ballStart: B, goalZ, aim: { x: sx * M.aim.x, y: M.aim.y }, speed: M.speed, spinRps: M.spinRps, spinSign: curlLeft ? 1 : -1, pitchGuess: M.pitchGuess, yawGuess: -sx * M.yawGuess, spiralSeconds: M.spiralSeconds });
    Object.assign(out.setup, { ballStart: B, spinRps: M.spinRps, spinSign: curlLeft ? 1 : -1, wall: { count: M.wall.count, x: B[0] + sx * M.wall.dx, z: M.wall.z }, keeper: { ...keeper, x: sx * keeper.x } });
    out.paths = { flight: flight.thin(k.flight, 2), straight: flight.thin(k.straight, 2), spiral: flight.thin(k.spiral, 4) };
    const se = k.straight[k.straight.length - 1].p[0]; out.model = { straightWide: r1(Math.abs(se) - 3.66), yawDeg: r2(k.yaw * 180 / Math.PI), pitchDeg: r2(k.pitch * 180 / Math.PI), flightTime: r2(k.flight[k.flight.length - 1].t),
      speedStart: r1(k.flight[0].speed), speedEnd: r1(k.flight[k.flight.length - 1].speed), label: "MODEL (illustrative launch values; angles solved to the aim point)" };
  }
  const ctxSetup = { ...got, spinRps: M.spinRps ?? 0, speed: M.speed ?? (M.chip && M.chip.speed) };
  return { world: out, ctx: { setup: ctxSetup, paper, score, alt, rule, law: got.law, model: out.model } };
}

function spaceWorld(T, tpl) {
  const V = JSON.parse(fs.readFileSync(path.join(PILOTS, "research", "vehicles.json"), "utf8")); const R = T.research; const reasons = [];
  const spec = (key) => { const v = V[key]; if (!v) reasons.push(`vehicle ${key} has no spec in research/vehicles.json`); return v; };
  const main = spec(R.vehicles && R.vehicles.main); const target = R.vehicles && R.vehicles.target ? spec(R.vehicles.target) : null; if (reasons.length) throw new Refusal(reasons);
  // dimension facts: the fact that states the vehicle's length
  const dimFact = (v) => { const f = T.facts.find((x) => v.names.some((n) => x.claim.includes(n)) && x.claim.includes(String(v.length))) || T.facts.find((x) => /long|tall/.test(x.claim) && x.claim.includes(String(v.length))); return f ? f.id : null; };
  const vname = (v) => ({ name: up(v.names[0]), lengthR: v.length, adapterLength: v.adapterLength || 0, src: dimFact(v) || "MODEL" });
  const slug = T.slug.replace(/-(\d{4})$/, ""); const year = (T.slug.match(/(\d{4})$/) || [])[1] || (corpus(T).match(/\b(19|20)\d{2}\b/) || [""])[0];
  const event = { name: up(slug.replace(/-/g, " ")), year };
  const dock = findFact(T, /first docking of two spacecraft/i); if (dock) event.dockSub = /in orbit/i.test(dock.claim) ? "FIRST DOCKING IN ORBIT" : "FIRST DOCKING";
  const setup = { setting: tpl.setting || "orbit", vehicles: { main, ...(target ? { target } : {}) }, dockOverlap: 0.5 };
  const ctx = { event, vehicle: { main: vname(main), ...(target ? { target: vname(target) } : {}) } };
  let model = {};
  if (tpl.model.type === "roll-torque") {
    const th = (main.thrusters || [])[0]; if (!th) throw new Refusal([`${main.names[0]} has no thruster spec`]);
    const I = (v) => (v.inertia.model === "shell" ? roll.shell(v.mass, v.baseRadius) : roll.cylinder(v.mass, v.baseRadius));
    const peakF = T.facts.find((f) => f.id === R.model.peakFact); if (!peakF || !peakF.claim.includes(String(R.model.peakDegS))) throw new Refusal(["reported peak rate is not in its cited fact"]);
    const p = roll.profile({ thrustN: th.thrustN, leverM: th.leverM, inertiaMain: I(main), inertiaPartner: target ? I(target) : 0, peakDegS: R.model.peakDegS });
    model = { peak: p.peak, peakSrc: peakF.id, rateAtUndock: Math.round(p.rateAtUndock), phase: Math.round(p.phase), tau: Math.round(p.tau), ratio: r2(p.ratio), lessPct: Math.round((1 - 1 / p.ratio) * 100),
      inertia: { main: Math.round(p.I.main), partner: Math.round(p.I.partner) }, label: "MODEL (torque = thrust x lever arm; solid-body inertias; only the peak rate is reported)" };
    const thrFacts = [findFact(T, new RegExp(th.name.match(/No\. \d+/)[0].replace(".", "\\."), "i")), findFact(T, /\d+ lbf/)].filter(Boolean).map((f) => f.id);
    ctx.thruster = { name: up(th.name), short: up(`thruster ${(th.name.match(/No\. \d+/) || [""])[0]}`.trim()), lbf: Math.round(th.thrustN / 4.448), src: thrFacts.join(",") || "MODEL" };
    Object.assign(setup, { thrusters: main.thrusters, rcs: main.rcs });
  } else if (tpl.model.type === "ascent") {
    const ff = T.facts.find((f) => f.id === R.model.failureFact); if (!ff || !ff.claim.includes(String(R.model.failureT))) throw new Refusal(["failure time is not in its cited fact"]);
    model = { failureT: R.model.failureT, failureSrc: ff.id, label: "MODEL (illustrative ascent: altitude = 4 t^2 m; sequence representative)" }; setup.engines = main.engines || [];
  }
  ctx.model = model; return { world: { setup, model }, ctx };
}

// ---- template filling ---------------------------------------------------------------------------------------------
function fill(value, ctx, T, cues, missing) {
  if (Array.isArray(value)) return value.map((v) => fill(v, ctx, T, cues, missing));
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, fill(v, ctx, T, cues, missing)]));
  if (typeof value !== "string" || !value.includes("{")) return value;
  const one = (key) => {
    if (key.startsWith("fact:")) { const f = findFact(T, new RegExp(key.slice(5), "i")); if (!f) missing.push(`no fact matches /${key.slice(5)}/`); return f ? f.id : undefined; }
    if (key.startsWith("cue:")) { const c = cues.find((x) => x.lines.join(" ").includes(key.slice(4))); if (!c) missing.push(`no narration cue "${key.slice(4)}"`); return c ? c.start : undefined; }
    if (["speed", "magnus", "drag", "radius", "t", "h"].includes(key)) return `{${key}}`; // live values filled per frame by the shot
    const opt = key.endsWith("?"); const k0 = opt ? key.slice(0, -1) : key; // "{a.b?}": optional, empty when the evidence has none
    const v = k0.split(".").reduce((o, k) => (o == null ? undefined : o[k]), ctx); if ((v == null || v === "") && !opt) missing.push(`needs ${k0}: not in the evidence`); return v == null ? (opt ? "" : v) : v; };
  const whole = value.match(/^\{([^{}]+)\}(?:\+([\d.]+))?$/);
  if (whole) { const v = one(whole[1]); return typeof v === "number" && whole[2] ? +(v + +whole[2]).toFixed(2) : v; }
  return value.replace(/\{([^{}]+)\}/g, (_, k) => { const v = one(k); return v == null ? `{${k}}` : String(v); });
}

// shot -> narration line: role templates map by role (GLL), text templates by a pattern on the line (FR case files)
function assignBeats(T, tpl) {
  const shots = []; const reasons = [];
  T.lines.forEach((l, i) => {
    const beat = l.role ? tpl.beats.find((b) => b.role === l.role) : tpl.beats.find((b) => b.text && new RegExp(b.text, "i").test(l.text) && !shots.some((s) => s.beat === b));
    if (!beat) { reasons.push(`line ${i + 1} ("${l.text.slice(0, 40)}…") has no shot in template ${tpl.id}`); return; }
    shots.push({ beat, line: l, cue: l.text.split(/\s+/).slice(0, 3).join(" ").replace(/[.*+?^${}()|[\]\\]/g, "\\$&") });
  });
  if (reasons.length) throw new Refusal(reasons); return shots;
}

// start time of each narration line: the captions are the same words as the narration, cut into cues; walk both word
// streams in order and take the cue in which each line's first word falls
function lineStarts(T, cues) {
  const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(Boolean);
  const cw = cues.flatMap((c) => norm(c.lines.join(" ")).map(() => c)); let i = 0; const out = [];
  for (const l of T.lines) { if (i >= cw.length) throw new Refusal([`narration line "${l.text.slice(0, 40)}" is past the last caption cue`]); out.push(cw[i].start); i += norm(l.text).length; }
  if (i !== cw.length) throw new Refusal([`captions (${cw.length} words) do not match the narration (${i} words)`]); return out;
}

// reading time on a phone: a text needs 0.6 s + 0.25 s per word on screen (the same rule pilots/lib/qa.js measures).
// A shot shorter than its text allows is first merged into the next shot when both use the same shot kind; then the
// optional text (subtitle, notes, card body, label second lines) that cannot be read in time is dropped and recorded.
// Required text (headline, card title, label title, before/after state) that cannot be read fails the plan.
const words = (s) => String(s).replace(/\{[a-z]+\}/g, "0").split(/\s+/).filter((w) => /[\p{L}\d]/u.test(w)).length;   // "·" and dashes are not words
const NEED = (s) => (s ? 0.6 + 0.25 * words(s) : 0);
function fitReading(shots, end) {
  const trimmed = []; const dur = (i) => (i + 1 < shots.length ? shots[i + 1].at : end) - shots[i].at;
  for (let i = shots.length - 2; i >= 0; i -= 1) if (shots[i].kind === shots[i + 1].kind && dur(i) < 2.2 && shots[i].kind !== "launch-ascent") {
    trimmed.push(`merged "${shots[i].line.slice(0, 30)}" into the next ${shots[i].kind} shot (${dur(i).toFixed(1)} s line)`); shots[i + 1].at = shots[i].at; shots[i + 1].cue = shots[i].cue;
    shots[i + 1].line = `${shots[i].line} ${shots[i + 1].line}`; shots[i + 1].facts = [...new Set([...shots[i].facts, ...shots[i + 1].facts])]; shots.splice(i, 1); }
  // window: share of the shot a field is on screen (state swaps show each state for about half the shot)
  const fields = [["sub", 1, false], ["head", 1, true], ["note", 0.5, false], ["overflowNote", 0.45, false], ["beforeNote", 0.45, false], ["afterNote", 0.55, false],
    ["title", 0.5, true], ["overflowTitle", 0.45, true], ["before", 0.45, true], ["after", 0.55, true]];
  const fails = [];
  shots.forEach((s, i) => { const d = dur(i); const P = s.params; const drop = (obj, key, what) => { trimmed.push(`${s.kind} at ${s.at.toFixed(1)} s: dropped ${what} "${obj[key]}" (${d.toFixed(1)} s shot)`); delete obj[key]; };
    // a headline taken from the line (headAuto) is optional: dropped rather than failing the plan
    const gauge = ["rate-climb", "separation", "rcs-recovery"].includes(s.kind);   // a gauge note stays for the whole shot
    for (const [key, w0, req0] of fields) { const w = key === "note" && gauge ? 1 : w0; const req = req0 && !(key === "head" && P.headAuto); if (!(P[key] && NEED(P[key]) > d * w)) continue; if (req) fails.push(`${s.kind} at ${s.at.toFixed(1)} s: "${P[key]}" needs ${NEED(P[key]).toFixed(1)} s, shot gives ${(d * w).toFixed(1)} s`); else drop(P, key, key); }
    if (P.card) { if (P.card.p && NEED(P.card.p) > d) drop(P.card, "p", "card body"); if (P.card.k && NEED(P.card.k) > d) drop(P.card, "k", "card kicker"); if (NEED(P.card.h) > d) fails.push(`card "${P.card.h}" cannot be read in ${d.toFixed(1)} s`); }
    for (const l of P.labels || []) { if (l.small && NEED(l.small) > d * 0.8 && !/MODEL|REPRESENTATIVE/.test(l.small)) drop(l, "small", "label line"); if (NEED(l.title) > d * 0.8) fails.push(`label "${l.title}" cannot be read in ${d.toFixed(1)} s`); } });
  if (fails.length) throw new Refusal(fails); return trimmed;
}

// every number on screen must be in its cited fact(s) or the narration, or the label must say MODEL
const nums = (s) => (String(s).match(/\d+(?:[.,]\d+)?/g) || []).map((n) => n.replace(",", "."));
function checkEvidence(shots, T) {
  const reasons = []; const ids = new Set(T.facts.map((f) => f.id)); const lineText = T.lines.map((l) => l.text).join(" ");
  const inFacts = (n, src) => src.some((id) => { const f = T.facts.find((x) => x.id === id); return f && `${f.claim} ${f.quote}`.replace(/,/g, "").includes(n); });
  const words = { one: "1", two: "2", eight: "8", sixteen: "16", "thirty seven": "37" }; const spoken = Object.entries(words).filter(([w]) => new RegExp(`\\b${w}\\b`, "i").test(lineText)).map(([, n]) => n);
  for (const s of shots) {
    for (const l of s.params.labels || []) {
      const src = String(l.src || "").split(",").filter(Boolean); const text = `${l.title} ${l.small || ""}`;
      if (!src.length) { reasons.push(`label "${l.title}" has no source`); continue; }
      for (const id of src) if (id !== "MODEL" && !ids.has(id)) reasons.push(`label "${l.title}" cites unknown fact ${id}`);
      if (src.includes("MODEL")) { if (!/MODEL/.test(text)) reasons.push(`label "${l.title}" uses model values but does not say MODEL`); continue; }
      for (const n of nums(l.title)) if (!inFacts(n, src)) reasons.push(`label "${l.title}": ${n} is not in ${src.join(",")}`);
    }
    // headlines, subtitles, cards: a number must come from a fact, the narration, or say MODEL
    const texts = [s.params.head, s.params.sub, ...(s.params.heads || []), s.params.card && s.params.card.h, s.params.card && s.params.card.p, s.params.card && s.params.card.k, s.params.note, s.params.before, s.params.after, s.params.beforeNote, s.params.afterNote, s.params.title, s.params.overflowTitle].filter(Boolean);
    for (const tx of texts) { if (/MODEL/.test(tx)) continue; for (const n of nums(tx)) if (!lineText.includes(n) && !spoken.includes(n) && !inFacts(n, [...ids])) reasons.push(`"${tx}": ${n} has no source`); }
  }
  return reasons;
}

// ---- entry point ----------------------------------------------------------------------------------------------------
function templates() { const dir = path.join(PILOTS, "templates"); return fs.readdirSync(dir).filter((f) => f.endsWith(".json")).map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"))); }
function detect(T) { const txt = corpus(T).toLowerCase();
  const hits = templates().filter((tp) => tp.detect.all.every((w) => txt.includes(w)) && tp.detect.any.some((w) => txt.includes(w)));
  return hits; }

function plan(topicFile, cues, duration) {
  const T = loadTopic(topicFile); const assumptions = [];
  const hits = detect(T); if (hits.length !== 1) throw new Refusal([hits.length ? `ambiguous mechanism: ${hits.map((h) => h.id).join(", ")}` : "no mechanism template matches this topic (new mechanism class: needs a template and possibly new shots)"]);
  const tpl = { ...hits[0], _staging: [] }; const W = tpl.world === "football" ? footballWorld(T, tpl, assumptions) : spaceWorld(T, tpl);
  // more than three details the evidence does not decide is no longer a depiction of the event: a person decides
  if (assumptions.length > 3) throw new Refusal([`too many details not in the evidence (${assumptions.length}): ${assumptions.join("; ")}`]);
  if (tpl.world === "football") { W.ctx.line = (() => { const l = T.lines.find((x) => x.role === "CONTEXT"); const parts = l ? l.text.split(/\.\s+/) : []; return { place: up(parts[0] || ""), teams: up(parts[1] || "") }; })(); }
  const missing = []; const headlines = []; const beats = assignBeats(T, tpl); const starts = lineStarts(T, cues);
  // the line's own context, for fact cards: its text, the first year it or its fact names, its source title
  // a fact card does not repeat the caption: it shows the line's anchor (the names it mentions, else its year) and the source
  const STARTERS = new Set(["The", "In", "Then", "It", "If", "A", "An", "Just", "Why", "Every", "And", "But", "So", "This", "That", "Only", "Before", "After", "Professional", "Goalkeepers"]);
  const lineCtx = (l) => { const f = T.facts.find((x) => (l.facts || []).includes(x.id)); const yr = (l.text.match(/\b(1[89]|20)\d{2}\b/) || [""])[0];
    const names = (l.text.match(/(?:\b(?:1[89]|20)\d{2}\s)?[A-Z][\p{L}'’-]+(?:\s(?:of\s)?[A-Z][\p{L}'’-]+)*/gu) || []).filter((n) => !STARTERS.has(n) && !/^[A-Z][a-z]+(ish|ian|ese|ch)$|^German$/.test(n)); // not demonyms
    const anchor = names.length ? names.slice(0, 3).join(" · ") : yr;
    return { text: l.text, year: yr, anchor, source: f ? (() => { const raw = String(f.source || "").replace(/\s*\(revision.*$/, ""); const pub = raw.includes(":") ? raw.split(":")[0].trim() : ""; const title = String(f.sourceTitle || raw.split(":").pop()).trim();
      return up(pub ? `source · ${pub}${title.toLowerCase() !== anchor.toLowerCase() ? `: ${title}` : ""}` : `source · ${title}`); })() : "", src: f ? f.id : "" }; };
  const shots = beats.map(({ beat, line, cue }, i) => ({ kind: beat.shot, role: beat.role || null, cue, at: starts[i], line: line.text, facts: line.facts, params: fill(beat.params || {}, { ...W.ctx, thisLine: lineCtx(line) }, T, cues, missing) }));
  // a fact card with nothing to anchor is dropped (the caption carries the line); a year shown twice is shown once
  for (const sh of shots) { const c = sh.params.card; if (!c) continue; if (!c.h) delete sh.params.card; else if (c.k && c.h.includes(c.k)) c.k = ""; }
  // a template headline is a claim: it is used only when this topic's line says it (headIf); otherwise the headline is
  // the line's own first words
  beats.forEach(({ beat, line }, i) => { if (beat.headIf && !new RegExp(beat.headIf, "i").test(line.text)) { const P = shots[i].params; delete P.heads;
    const clause = line.text.split(/[.,;:!?]\s/)[0].replace(/[.,;:!?]$/, ""); const short = clause.split(/\s+/).length <= 6;
    P.head = i === 0 && T.title ? up(T.title) : short ? up(clause) : ""; if (!P.head) delete P.head; else P.headAuto = true; headlines.push(`${shots[i].kind}: headline from the line ("${P.head || "none: line too long, caption only"}")`); } });
  if (missing.length) throw new Refusal([...new Set(missing)]);
  // a looping plan replays its opening over the last 0.7 s, so the last shot is that much shorter on screen
  const trimmed = fitReading(shots, (duration || (cues.length ? cues[cues.length - 1].end + 0.6 : 0)) - (tpl.loop ? 0.7 : 0));
  // motion that is not measured is labelled as such on screen
  const chips = [...tpl.chips]; if (tpl.world === "football" && !chips.includes("MOTION REPRESENTATIVE")) chips.push("MOTION REPRESENTATIVE");
  for (const s of shots) { if (s.params.chips) s.params.chips = s.params.chips.length ? [...new Set([...s.params.chips, ...(tpl.world === "football" && ["establish", "strike", "penalty-run", "alt-kick", "scoreboard"].includes(s.kind) ? ["MOTION REPRESENTATIVE"] : [])])] : []; }
  const reasons = checkEvidence(shots, T); if (reasons.length) throw new Refusal(reasons);
  for (const s of shots) s.facts = [...new Set([...(s.facts || []), ...(s.params.labels || []).flatMap((l) => String(l.src).split(",")).filter((x) => x && x !== "MODEL")])];
  const p = { schema: "pilot-3d.plan.v1", status: "PLANNED", topic: T.id, channel: T.channel, template: tpl.id, world: tpl.world, brand: tpl.brand, accent: tpl.accent, accent2: tpl.accent2,
    chips, keywords: tpl.keywords, loop: tpl.loop, shots: shots.map(({ kind, role, cue, at, line, facts, params }) => ({ kind, role, cue, at, line, facts, params })), assumptions, staging: tpl._staging, trimmed, headlines,
    modelLabel: W.world.model && W.world.model.label };
  return { plan: p, data: { plan: p, setup: W.world.setup, paths: W.world.paths, model: W.world.model, cues, duration } };
}

module.exports = { plan, loadTopic, detect, checkEvidence, Refusal };

if (require.main === module) { // node pilots/lib/planner.js <topic.json> <captions.json>
  const cues = JSON.parse(fs.readFileSync(process.argv[3], "utf8")).cues;
  try { const { plan: p } = plan(process.argv[2], cues, null); console.log(JSON.stringify(p, null, 1)); }
  catch (e) { if (!(e instanceof Refusal)) throw e; console.log(JSON.stringify({ status: "CREATIVE_REVIEW_REQUIRED", reasons: e.reasons }, null, 1)); process.exitCode = 2; }
}
