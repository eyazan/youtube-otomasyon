"use strict";
// Creative checks that a script can measure, reported apart from the objective QA verdict (#364). They are ADVISORY:
// a WARN never blocks publication (the rules are new and not yet validated on published Shorts), and none of them is a
// claim that the video is good. What a script cannot judge is listed as HUMAN with the question a reviewer must answer.
//   storyboard  the rendered storyboard (scenes with ids "s<n>-<kind>", layers)
//   motion      { first2sMean } mean absolute frame difference over the first 2 s (135 x 240 grey, 0-255 scale)
const HEAD_Y = 480;
const kindOf = (sc) => String(sc.id).replace(/^s\d+-/, "");
const headlines = (sb) => sb.scenes.flatMap((sc) => sc.layers.filter((l) => l.component === "kinetic-type").flatMap((l) => (l.props.items || []).map((it) => ({ ...it, scene: sc.id }))));
// a headline never ends on an article, conjunction, linking verb or possessive (particles such as "on" in "STICKS ON" are fine)
const WEAK_END = /\b(a|an|the|and|or|but|of|to|for|with|from|as|that|its|their|is|was|were|be|not)$/i;

function run(storyboard, motion = {}) {
  const out = []; const add = (name, ok, measured, target) => out.push({ name, status: ok ? "PASS" : "WARN", measured, target });
  const kinds = storyboard.scenes.map(kindOf);
  // 1. the first 2 s move: the event starts at once, not a slow zoom on a still drawing
  if (Number.isFinite(motion.first2sMean)) add("motion in the first 2 s", motion.first2sMean >= 0.3, motion.first2sMean.toFixed(3), ">= 0.3 mean frame change");
  // 2. scene variety: enough distinct scene types, no type three times in a row
  let run = 1, worst = 1; kinds.forEach((k, i) => { run = i && k === kinds[i - 1] ? run + 1 : 1; worst = Math.max(worst, run); });
  add("scene variety", new Set(kinds).size >= 4 && worst <= 2, `${new Set(kinds).size} types (${[...new Set(kinds)].join(", ")}); longest run ${worst}`, ">= 4 types, no type 3x in a row");
  // 3. headlines: none repeats, none ends on a dangling word, none sits in the caption band
  const hs = headlines(storyboard).filter((h) => /[A-Za-z]{3,}/.test(h.text));
  const dup = hs.filter((h, i) => hs.findIndex((x) => x.text === h.text) !== i).map((h) => h.text);
  const dangling = hs.filter((h) => WEAK_END.test(String(h.text).trim().replace(/[.!?,;:]+$/, ""))).map((h) => h.text);
  add("headlines read as complete phrases", !dup.length && !dangling.length, dup.length || dangling.length ? [...dup.map((d) => `repeat "${d}"`), ...dangling.map((d) => `dangling "${d}"`)].join("; ") : `${hs.length} headlines`, "no repeat, no dangling end word");
  // 4. headlines that meet in the top band across a cut leave before the next arrives
  const clash = storyboard.scenes.slice(0, -1).filter((sc, k) => { const top = (s) => headlines({ scenes: [s] }).filter((h) => h.y <= HEAD_Y);
    return top(storyboard.scenes[k + 1]).length && top(sc).some((h) => h.outAt == null); }).map((sc) => sc.id);
  add("headline hand-over at cuts", !clash.length, clash.length ? clash.join(", ") : "clean", "outgoing headline exits before the next one");
  // 5. the object is on screen (not only cards) in most scenes
  const drawn = storyboard.scenes.filter((sc) => sc.layers.some((l) => l.component !== "kinetic-type" && l.component !== "failure-chain" && !(l.props && l.props.opacity != null && l.props.opacity < 0.3))).length;
  add("object on screen", drawn / storyboard.scenes.length >= 0.5, `${drawn}/${storyboard.scenes.length} scenes show the object`, ">= half the scenes");
  const human = [
    "Is the drawn object the right type for this case (structure type, vehicle class), with no invented detail?",
    "Does the mechanism shown (load path, spin, breach, slide) match the cited cause, step by step?",
    "Is the hook strong enough to stop a scroll, and is the payoff a real lesson rather than a restatement?",
    "Do the on-screen words read as natural English for a viewer who has not heard the narration?",
  ].map((q) => ({ name: q, status: "HUMAN", measured: "not measurable by script", target: "reviewer answers before publication" }));
  return { advisory: true, checks: out, human };
}

module.exports = { run };
