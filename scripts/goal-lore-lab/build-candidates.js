#!/usr/bin/env node
"use strict";
// GoalLore Lab candidate topic inventory (IDEA stage only).
//   node scripts/goal-lore-lab/build-candidates.js [--write]
// Every topic here is an IDEA: a question to research, not a claim. Nothing is marked RESEARCHED, VERIFIED,
// SCRIPT_READY or PRODUCTION_READY until evidence exists (verbatim quotes from cited primary or reputable sources).
// The scores are explainable heuristics computed from the listed attributes below, not predictions:
//   appeal       broad recognisability of the subject (legend/moment/rule everyone knows) and emotional hook
//   curiosity    is there a genuine "why/how" gap the story closes
//   source       expected availability of primary/reputable sources (official records, archives, peer-reviewed work)
//   animation    how much original animation (pitch, trajectory, timeline, physics) explains it better than words
//   shorts       can the core payoff land in under a minute
//   longForm     room for an 8-14 minute expansion
//   copyrightRisk low = fully explainable with original animation; medium = needs licensed stills or careful likeness handling
//   cost         production effort with the current/planned component set (low/medium/high)
const fs = require("fs");
const path = require("path");

const OUT = path.resolve(__dirname, "../../channels/goal-lore-lab/topics/topic-candidates.json");

// [pillar, question, animationMode, sourcePlan, flags]
// animationMode: pitch | trajectory | timeline | stats | physics | stadium | archive
// sourcePlan: official (FIFA/UEFA/league records), archive (contemporary press, club archives), science (peer-reviewed), mixed
// flags: L = legend/very famous subject, E = strong emotion, W = what-if (must be labelled), P = living person/likeness care, R = rule/everyone-knows object
const S = [
  ["LEGENDS", "How did Pelé become the youngest player to score in a World Cup final?", "timeline", "official", "LE"],
  ["LEGENDS", "Why was Lev Yashin's goalkeeping considered revolutionary?", "pitch", "archive", "L"],
  ["LEGENDS", "What made Johan Cruyff's 'Cruyff turn' so hard to defend?", "pitch", "archive", "L"],
  ["LEGENDS", "How did Eusébio's 1966 World Cup campaign unfold, match by match?", "timeline", "official", "LE"],
  ["LEGENDS", "Why did Garrincha's dribbling baffle defenders of his era?", "pitch", "archive", "LE"],
  ["LEGENDS", "How did Ferenc Puskás end up playing for two national teams?", "timeline", "archive", "L"],
  ["LEGENDS", "What did Franz Beckenbauer change about the libero role?", "pitch", "archive", "L"],
  ["LEGENDS", "How did Diego Maradona's 1986 World Cup reshape his legend?", "timeline", "official", "LEP"],
  ["LEGENDS", "Why is Gerd Müller's goal record remembered as so unusual?", "stats", "official", "L"],
  ["LEGENDS", "How did Alfredo Di Stéfano become central to Real Madrid's early European Cups?", "timeline", "official", "L"],
  ["LEGENDS", "What made Bobby Charlton's long-range shooting distinctive?", "trajectory", "archive", "L"],
  ["LEGENDS", "How did Marta become one of the most decorated players in women's football?", "stats", "official", "LP"],
  ["LEGENDS", "Why was Zinedine Zidane's touch so often described as unique?", "pitch", "archive", "LP"],
  ["LEGENDS", "How did Ronaldo Nazário come back to win the 2002 World Cup?", "timeline", "official", "LEP"],
  ["LEGENDS", "What made George Best a new kind of football celebrity?", "timeline", "archive", "L"],
  ["LEGENDS", "How did Michel Platini win three consecutive Ballon d'Or awards?", "timeline", "official", "LP"],
  ["LEGENDS", "Why did Paolo Maldini play at the top level for so long?", "timeline", "official", "LP"],
  ["LEGENDS", "What made Dino Zoff's World Cup win at 40 remarkable?", "timeline", "official", "L"],
  ["LEGENDS", "How did Abby Wambach become such a prolific header of the ball?", "stats", "official", "LP"],
  ["LEGENDS", "Why is Roger Milla's 1990 World Cup still remembered?", "timeline", "official", "LE"],
  ["MOMENTS", "How did the 'Hand of God' and the 'Goal of the Century' happen four minutes apart?", "pitch", "official", "LEP"],
  ["MOMENTS", "What happened in the 1950 'Maracanazo' final?", "timeline", "archive", "LE"],
  ["MOMENTS", "How did Liverpool come back from 3-0 down in the 2005 Champions League final?", "timeline", "official", "E"],
  ["MOMENTS", "How was Manchester United's 1999 Champions League final turned around in stoppage time?", "timeline", "official", "E"],
  ["MOMENTS", "What made Panenka's 1976 penalty so audacious?", "trajectory", "archive", "LE"],
  ["MOMENTS", "How did Roberto Carlos's 1997 free kick bend the way it did?", "physics", "science", "LP"],
  ["MOMENTS", "How did Denmark go from not qualifying to winning Euro 1992?", "timeline", "official", "E"],
  ["MOMENTS", "How did Greece win Euro 2004?", "pitch", "official", "E"],
  ["MOMENTS", "What happened in the 1970 World Cup semi-final called the 'Game of the Century'?", "timeline", "archive", "E"],
  ["MOMENTS", "How did Leicester City win the 2015-16 Premier League?", "stats", "official", "E"],
  ["MOMENTS", "How did Carlos Alberto's 1970 final goal come from a team-wide move?", "pitch", "archive", "LE"],
  ["MOMENTS", "Why is Marco van Basten's Euro 1988 volley considered so difficult?", "trajectory", "archive", "LP"],
  ["MOMENTS", "How did the 2022 World Cup final become a penalty shootout?", "timeline", "official", "EP"],
  ["MOMENTS", "What happened in the 'Miracle of Bern' 1954 final?", "timeline", "archive", "E"],
  ["MOMENTS", "How did Iniesta's 2010 World Cup final goal come about?", "pitch", "official", "EP"],
  ["MOMENTS", "How did Brandi Chastain's 1999 World Cup final penalty become iconic?", "timeline", "official", "EP"],
  ["MOMENTS", "Why is Gordon Banks's save from Pelé in 1970 still studied?", "trajectory", "archive", "LE"],
  ["MOMENTS", "How did Zaire's 1974 free-kick incident happen?", "pitch", "archive", "E"],
  ["MYSTERIES", "Who really stole the Jules Rimet trophy in 1966, and how was it found?", "archive", "archive", "E"],
  ["MYSTERIES", "What happened to the Jules Rimet trophy after it was stolen again in 1983?", "archive", "archive", "E"],
  ["MYSTERIES", "Why did a World Cup match in 1982 become known as the 'Disgrace of Gijón'?", "stats", "archive", "E"],
  ["MYSTERIES", "Why is a new ball designed for almost every World Cup?", "physics", "mixed", "R"],
  ["MYSTERIES", "Why was the 2010 Jabulani ball criticised for its flight?", "physics", "science", "R"],
  ["MYSTERIES", "Why is the 'curse' of the defending World Cup champions talked about?", "stats", "official", ""],
  ["MYSTERIES", "What caused the floodlight failures in some 1990s English matches?", "archive", "archive", ""],
  ["MYSTERIES", "Why did the Netherlands lose three World Cup finals?", "timeline", "official", "E"],
  ["MYSTERIES", "How did a 149-0 scoreline happen in a professional league match?", "archive", "archive", "E"],
  ["MYSTERIES", "Why did Uruguay refuse to defend their World Cup title in 1934?", "archive", "archive", ""],
  ["MYSTERIES", "What made the 'Battle of Santiago' in 1962 so infamous?", "archive", "archive", "E"],
  ["MYSTERIES", "Why were some early World Cup teams missing when the tournament started?", "archive", "archive", ""],
  ["HISTORY", "Why is a football pitch the size it is?", "pitch", "official", "R"],
  ["HISTORY", "Why is the penalty spot 12 yards from goal?", "pitch", "official", "R"],
  ["HISTORY", "Where did the offside rule come from, and how has it changed?", "pitch", "official", "R"],
  ["HISTORY", "Why do footballs have the pattern they have?", "physics", "mixed", "R"],
  ["HISTORY", "Why are goals the size they are?", "pitch", "official", "R"],
  ["HISTORY", "How did shirt numbers become standard?", "timeline", "archive", "R"],
  ["HISTORY", "Why did football introduce red and yellow cards?", "timeline", "official", "R"],
  ["HISTORY", "How did the first international football match come about in 1872?", "timeline", "archive", ""],
  ["HISTORY", "Why did women's football get banned from English league grounds in 1921?", "timeline", "archive", "E"],
  ["HISTORY", "How did the World Cup begin in 1930?", "timeline", "official", ""],
  ["HISTORY", "Why did the back-pass rule change in 1992?", "pitch", "official", "R"],
  ["HISTORY", "How did penalty shootouts replace replays and coin tosses?", "timeline", "official", "R"],
  ["HISTORY", "Why did goal nets get invented?", "archive", "archive", "R"],
  ["HISTORY", "How did VAR get introduced into the laws of the game?", "timeline", "official", "R"],
  ["HISTORY", "Why did three points for a win replace two?", "stats", "official", "R"],
  ["HISTORY", "How did the European Cup start?", "timeline", "archive", ""],
  ["HISTORY", "Why are corner flags and the corner arc there?", "pitch", "official", "R"],
  ["HISTORY", "How did substitutions become allowed?", "timeline", "official", "R"],
  ["PHYSICS", "How does a footballer make a free kick curve? (the Magnus effect)", "physics", "science", "R"],
  ["PHYSICS", "Why does a 'knuckleball' shot wobble in the air?", "physics", "science", "R"],
  ["PHYSICS", "How much time does a goalkeeper have to react to a penalty?", "trajectory", "science", "R"],
  ["PHYSICS", "What happens to the ball, in milliseconds, when it is headed?", "physics", "science", "R"],
  ["PHYSICS", "How does pitch grass length change how the ball rolls?", "physics", "science", ""],
  ["PHYSICS", "Why is it harder to score from a tight angle?", "pitch", "science", "R"],
  ["PHYSICS", "How does altitude change the flight of the ball?", "physics", "science", ""],
  ["PHYSICS", "Why does a ball's panel design change its flight?", "physics", "science", "R"],
  ["PHYSICS", "How does a goalkeeper's dive direction get decided before the kick?", "trajectory", "science", "R"],
  ["PHYSICS", "Why do long throws travel as far as they do?", "trajectory", "science", ""],
  ["PHYSICS", "How do players sprint so much in a match, and how is it measured?", "stats", "science", ""],
  ["PHYSICS", "Why does a wet ball skid faster off the pitch?", "physics", "science", ""],
  ["PHYSICS", "How does a defensive wall's distance change a free kick's chances?", "trajectory", "science", "R"],
  ["PHYSICS", "Why do some shots dip suddenly near the goal?", "physics", "science", "R"],
  ["TACTICS", "How did Total Football work?", "pitch", "archive", "L"],
  ["TACTICS", "What is the offside trap and why is it risky?", "pitch", "official", "R"],
  ["TACTICS", "How did 'catenaccio' defend a lead?", "pitch", "archive", ""],
  ["TACTICS", "What is pressing, and why did gegenpressing change football?", "pitch", "archive", ""],
  ["TACTICS", "How does a false nine pull defenders out of shape?", "pitch", "archive", ""],
  ["TACTICS", "Why did the 4-4-2 dominate for decades?", "pitch", "archive", ""],
  ["TACTICS", "How does tiki-taka use triangles to keep the ball?", "pitch", "archive", ""],
  ["TACTICS", "What does an inverted full-back do?", "pitch", "archive", ""],
  ["TACTICS", "How do teams defend corners: zonal versus man-marking?", "pitch", "archive", "R"],
  ["TACTICS", "How did the WM formation answer the 1925 offside change?", "pitch", "archive", ""],
  ["TACTICS", "Why do wingers play on the 'wrong' foot now?", "pitch", "archive", ""],
  ["TACTICS", "What is a low block and how do teams break it?", "pitch", "archive", ""],
  ["TACTICS", "How does a counter-attack outnumber a defence in seconds?", "pitch", "archive", ""],
  ["TACTICS", "How did Hungary's 1953 win at Wembley expose England's tactics?", "pitch", "archive", "E"],
  ["WHAT_IF", "What if the offside rule were abolished?", "pitch", "mixed", "W"],
  ["WHAT_IF", "What if football goals were twice as wide?", "pitch", "mixed", "WR"],
  ["WHAT_IF", "What if every match were played without a goalkeeper?", "pitch", "mixed", "W"],
  ["WHAT_IF", "What if the ball were twice as heavy?", "physics", "science", "W"],
  ["WHAT_IF", "What if a match were played on the Moon?", "physics", "science", "W"],
  ["WHAT_IF", "What if there were no throw-ins, only kick-ins?", "pitch", "mixed", "W"],
  ["WHAT_IF", "What if matches lasted only 60 minutes of effective time?", "stats", "mixed", "W"],
  ["WHAT_IF", "What if a pitch were circular?", "pitch", "mixed", "W"],
  ["STADIUMS", "Why is the Maracanã's history so tied to Brazil's identity?", "stadium", "archive", "E"],
  ["STADIUMS", "How did Wembley's twin towers become a symbol?", "stadium", "archive", ""],
  ["STADIUMS", "Why do some stadiums have a roof that closes?", "stadium", "mixed", "R"],
  ["STADIUMS", "How did the Azteca host two World Cup finals?", "stadium", "official", ""],
  ["STADIUMS", "Why is the 'Yellow Wall' in Dortmund so loud?", "stadium", "mixed", ""],
];

const PILLAR_NOTE = { LEGENDS: "legendary footballer stories", MOMENTS: "unforgettable moments", MYSTERIES: "football mysteries", HISTORY: "surprising football history", PHYSICS: "football physics", TACTICS: "animated tactical storytelling", WHAT_IF: "what-if scenarios (always labelled WHAT IF)", STADIUMS: "stadium storytelling" };
const SOURCE = {
  official: { score: 85, plan: "FIFA/UEFA/league official records and match reports, plus one independent reputable account" },
  archive: { score: 72, plan: "contemporary newspaper archives and club/federation archives; two independent accounts for every claim" },
  science: { score: 80, plan: "peer-reviewed sports-science/physics papers (e.g. ball aerodynamics) with numbers quoted verbatim" },
  mixed: { score: 70, plan: "laws of the game (IFAB) for the baseline; any projection states its assumption" },
};
const ANIM = { pitch: 92, trajectory: 95, physics: 94, timeline: 70, stats: 74, stadium: 66, archive: 55 };
const COST = { pitch: "low (football-pitch component)", trajectory: "low (football-pitch ball arc)", physics: "medium (needs flow/force components)", timeline: "medium (career-timeline to build)", stats: "medium (stat-compare to build)", stadium: "high (stadium-silhouette to build)", archive: "medium (archive plates need licensed stills)" };

function score([pillar, q, mode, src, flags]) {
  const f = (c) => flags.includes(c);
  const appeal = Math.min(98, 62 + (f("L") ? 20 : 0) + (f("E") ? 10 : 0) + (f("R") ? 8 : 0) + (pillar === "MOMENTS" ? 4 : 0));
  const curiosity = Math.min(96, (/^(why|how)/i.test(q) ? 80 : 72) + (pillar === "MYSTERIES" || pillar === "PHYSICS" ? 8 : 0) + (f("W") ? 4 : 0));
  const source = SOURCE[src].score - (f("W") ? 10 : 0);
  const animation = ANIM[mode];
  const shorts = Math.min(95, 60 + (mode === "pitch" || mode === "trajectory" || mode === "physics" ? 20 : 8) + (f("R") ? 10 : 0) - (pillar === "LEGENDS" && mode === "timeline" ? 6 : 0));
  const longForm = Math.min(95, 50 + (pillar === "LEGENDS" || pillar === "MOMENTS" || pillar === "TACTICS" || pillar === "MYSTERIES" ? 30 : 12) + (f("L") ? 8 : 0));
  const copyrightRisk = mode === "archive" || mode === "stadium" || f("P") ? "medium" : "low";
  const notes = [f("P") ? "living person / likeness: tokens or silhouettes only, no photos unless licensed; no claims about private life" : null,
    mode === "archive" ? "needs licensed or public-domain archive stills; otherwise redraw as illustration" : null,
    f("W") ? "hypothetical: every scene carries the WHAT IF chip; baseline facts from IFAB laws or cited science" : null,
    "no broadcast footage; no club crests as decoration"].filter(Boolean);
  const priority = Math.round(0.22 * appeal + 0.2 * curiosity + 0.2 * source + 0.2 * animation + 0.18 * shorts - (copyrightRisk === "medium" ? 6 : 0));
  return { appeal, curiosity, source, animation, shorts, longForm, copyrightRisk, cost: COST[mode], notes, priority };
}

function build() {
  const topics = S.map((row, i) => { const [pillar, question, mode, src, flags] = row; const sc = score(row);
    return { id: `GLL-${String(i + 1).padStart(3, "0")}`, status: "IDEA", pillar, pillarNote: PILLAR_NOTE[pillar], question, animationMode: mode, hypothetical: flags.includes("W"),
      sourcePlan: SOURCE[src].plan, evidence: [], scores: sc, nextStep: "research: collect verbatim quotes from the source plan; promote to RESEARCHED only with sources, to VERIFIED only after quote verification" }; });
  const byPillar = {}; topics.forEach((t) => { byPillar[t.pillar] = (byPillar[t.pillar] || 0) + 1; });
  return { schema: "goal-lore-lab.topic-candidates.v1", channel: "goal-lore-lab", generatedBy: "scripts/goal-lore-lab/build-candidates.js",
    statusLadder: ["IDEA", "RESEARCHED", "VERIFIED", "SCRIPT_READY", "PRODUCTION_READY"],
    statusCounts: { IDEA: topics.length, RESEARCHED: 0, VERIFIED: 0, SCRIPT_READY: 0, PRODUCTION_READY: 0 },
    scoring: "explainable heuristics from listed attributes (see the header of build-candidates.js); not predictions of views", byPillar, topics };
}

if (require.main === module) {
  const inv = build();
  if (process.argv.includes("--write")) { fs.mkdirSync(path.dirname(OUT), { recursive: true }); fs.writeFileSync(OUT, JSON.stringify(inv, null, 1) + "\n"); }
  const top = inv.topics.slice().sort((a, b) => b.scores.priority - a.scores.priority).slice(0, 10);
  console.log(`${inv.topics.length} candidates (all IDEA) by pillar ${JSON.stringify(inv.byPillar)}`);
  top.forEach((t) => console.log(`  ${t.id} ${t.scores.priority} ${t.pillar.padEnd(9)} ${t.question}`));
}
module.exports = { build, score, SEEDS: S };
