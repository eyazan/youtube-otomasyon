// IB premium animation-potential analysis (report only; production scoring untouched).
const R = require("path").join(__dirname, "..", "..") + "/";
const C = require(R + "core/channel-context"); const Context = require(R + "core/growth/context"); const Config = require(R + "core/growth/config");
const Anim = require(R + "core/growth/animation-potential"); const A = require(R + "scripts/bto-studio/adapter"); const G = require(R + "scripts/bto-studio/auto/impossible-brief");
const L = require(R + "core/pipeline/premium-lane"); const style = require(R + "channels/impossible-brief/premium/style-pack.json");
const ch = C.getChannel("impossible-brief");

// what the IB automatic storyboard can draw, per world, from the real generator and the review renders of 2026-10-28
const WORLD = {
  "earth-interior": [70, "cutaway, depth probe, heat slice (IB-PHY-065 PASS)"],
  magnetic: [70, "planet in dipole field lines that weaken / switch off, solar wind"],
  current: [70, "warm and cold ocean streams that slow"],
  lake: [66, "depth slice with water strata"],
  "ocean-depth": [66, "depth probe below sea level"],
  micro: [62, "microbe cluster that thins"],
  "orbit-body": [62, "the named body drawn (Venus, Mars, Moon, gas giant)"],
  "earth-surface": [48, "a generic globe only"],
  sky: [48, "a large globe horizon only"],
  cosmos: [0, "a generic ringed planet unrelated to the subject: no credit"],
  body: [0, "one generic silhouette in every scene (IB-HUM-004 review: FAIL): no credit"],
  orbit: [40, "orbit diagram: a moon circling a star"],
};
const MECH = new Set(["cut", "zoom", "flow", "heat", "count", "year"]);
// the generator's own world words (scripts/bto-studio/auto/impossible-brief.js WORLD_WORDS), read from its source
const SRC = require("fs").readFileSync(R + "scripts/bto-studio/auto/impossible-brief.js", "utf8");
const WW = new Function("return {" + SRC.slice(SRC.indexOf("const WORLD_WORDS = {") + 21, SRC.indexOf("};", SRC.indexOf("const WORLD_WORDS = {"))) + "}")();
const OTHER_BODY = /\b(io|europa|titan|enceladus|mars|venus|mercury|jupiter|saturn|neptune|uranus|pluto|proxima|moon)\b/i;
function animIB(id) {
  let t, sb; try { t = A.loadTopic("impossible-brief", id); sb = G.build(A.studioScript(t.channel, t.topic), style, t.topic); } catch (e) { return null; }
  let W = G.world(t.topic); const text = [t.topic.topic, t.topic.title, t.topic.scientificMechanism].join(" ");
  const named = sb.scenes.some((s) => s.layers.some((l) => l.component === "planet" && !["earth", "gas"].includes(l.props.kind)));
  if (W === "orbit" && named) W = "orbit-body";
  const reasons = []; let [score, what] = WORLD[W] || [40, "unknown world"]; reasons.push(`${W}: ${what}`);
  // the drawing must be of the topic's own subject: a world inferred only from body text, or an Earth drawing for a
  // topic about another body, is a mismatch and earns no animation credit
  const title = [t.topic.title, t.topic.topic].join(" "); const key = W === "orbit-body" ? "orbit" : W;
  const mismatch = (WW[key] && !WW[key].test(title)) || (["earth-interior", "ocean-depth", "lake", "current", "magnetic", "earth-surface", "sky"].includes(W) && OTHER_BODY.test(title) && !/\bearth\b/i.test(title));
  if (mismatch) { score = 0; reasons.push("world not the title's subject: the drawing would not show this topic"); }
  // a spin / rotation drawn as an orbit is the wrong mechanism (IB-EXT-047): no credit
  const spinWrong = W === "orbit" && /\b(spin|spun|spinning|rotation|rotate|day length)\b/i.test(text);
  if (spinWrong) { score = 0; reasons.push("spin drawn as an orbit: wrong mechanism"); }
  const kinds = sb.scenes.map((s) => s.id.replace(/^s\d+-/, ""));
  const ladders = sb.scenes.filter((s) => s.layers.some((l) => l.component === "scale-ladder")).length;
  const fieldScenes = sb.scenes.filter((s) => s.layers.some((l) => (l.component === "magnetosphere" && l.props.strengthKeys) || (l.component === "flow-arrows" && l.props.streams.some((x) => x.speedKeys)) || (l.component === "microbes" && l.props.countKeys))).length;
  const mechKinds = new Set(kinds.filter((k) => MECH.has(k))); const mech = mechKinds.size + (ladders ? 1 : 0) + (fieldScenes ? 1 : 0);
  if (!spinWrong && !mismatch && score >= 48) { const add = Math.min(16, mech * 4); score += add; reasons.push(`${mech} drawn mechanisms (+${add})`); }
  const generic = kinds.filter((k) => k === "mechanism").length - fieldScenes;
  if (generic / kinds.length > 0.5) { score -= 10; reasons.push(`${generic}/${kinds.length} scenes are the bare subject (-10)`); }
  return { score: Math.max(0, Math.min(88, score)), mismatch, world: W, reasons, kinds: kinds.join(","), facts: (t.topic.facts || []).length, sources: new Set((t.topic.facts || []).map((f) => f.url)).size };
}

const rank = (withAnim) => {
  const base = Config.forChannel; const orig = Anim.animationPotential;
  if (withAnim) { Config.forChannel = (c) => ({ ...base(c), visuals: { source: "animation" } }); Anim.animationPotential = (topic) => Anim.forImpossibleBrief({ id: topic.id }); }
  try { return new Map(Context.rank(ch, {}).rows.map((r) => [r.topic.id, r])); } finally { Config.forChannel = base; Anim.animationPotential = orig; }
};
const old = rank(false), neu = rank(true);
const q = L.qualified(ch);
const blocked = new Set(q.refused.filter((r) => r.why.some((w) => /blocked|already/.test(w))).map((r) => r.topic.id));
const researched = (id) => { const r = q.refused.find((x) => x.topic.id === id) || q.ok.find((x) => x.topic.id === id); return r && !(r.why || []).some((w) => /not researched|narration lines/.test(w)); };
const rows = [];
for (const [id, o] of old) { const n = neu.get(id); if (!n) continue; if (!researched(id)) continue;
  const a = Anim.forImpossibleBrief({ id }); if (a) a.facts = (A.loadTopic("impossible-brief", id).topic.facts || []).length, a.sources = new Set((A.loadTopic("impossible-brief", id).topic.facts || []).map((f) => f.url)).size, a.mismatch = !a.drawable; rows.push({ id, topic: o.topic.title || o.topic.topic, old: o.score.ViralPotentialScore, new: n.score.ViralPotentialScore, bucketOld: o.score.bucket, bucketNew: n.score.bucket, anim: a && a.score, world: a && a.world + (a.mismatch ? "(mismatch)" : ""), reasons: a ? a.reasons.join("; ") : "", kinds: a && a.kinds, facts: a && a.facts, sources: a && a.sources, held: blocked.has(id) }); }
rows.sort((x, y) => y.new - x.new || y.old - x.old);
require("fs").writeFileSync(process.argv[2], JSON.stringify(rows, null, 1));
const band = rows.filter((r) => r.old >= 70 && r.old < 75);
console.log("researched rows", rows.length, "old 70-74:", band.length, "old>=75:", rows.filter((r) => r.old >= 75).length, "new>=75:", rows.filter((r) => r.new >= 75).length);
console.log("lowered:", rows.filter((r) => r.new < r.old).length);
for (const r of rows.filter((r) => r.old >= 65)) console.log([r.id, r.old, "->", r.new, r.bucketOld + ">" + r.bucketNew, "anim", r.anim, r.world, "f" + r.facts + "/s" + r.sources, r.held ? "HELD" : "", r.topic].join(" "));
