#!/usr/bin/env node
"use strict";
// Writes storyboard.json for the GoalLore Lab pilot GLL-P01 (Roberto Carlos, Lyon, 3 June 1997). NOT APPROVED FOR PUBLICATION.
//   node channels/goal-lore-lab/premium/pilots/GLL-P01/build-storyboard.js
// One kick definition drives every pitch scene: the model flight (RK4 drag + Magnus, football.js) with illustrative
// launch values chosen so that the ball passes outside a wall and bends back inside the post. It is a RECONSTRUCTION of
// the shape the reports describe, not tracking data: scenes carry the RECONSTRUCTION and PHYSICS MODEL chips.
const fs = require("fs");
const path = require("path");

const KICK = { x0: 3, y0: -17.5, speed: 33, elevation: 15, azimuth: 11, spinRps: 13 };
const WALL = [0.6, 1.3, 2.0, 2.7].map((x, i) => ({ id: `w${i}`, team: "away", path: [[0, x, -26.65]] }));
const KEEPER = { id: "gk", team: "away", path: [[0, -0.4, -52.0]] };
const KICKER = (at) => ({ id: "k", team: "home", path: [[0, 4.6, -15.6], [at, 3.4, -17.1]] });
const pitch = (props) => ({ component: "football-pitch", props: { tokenStyle: "standing", ...props } });

const sb = {
  schema: "bto-studio.storyboard.v1", channel: "goal-lore-lab", topicId: "GLL-P01", slug: "the-free-kick-that-turned-into-a-spiral", version: 1,
  author: "visual-director (Claude, V5 GoalLore Lab pilot; not approved for publication)",
  licensingNote: "all drawn in-house from code (SVG): stadium, pitch, players (generic standing tokens, no likeness, no kits or crests), physics plots; no broadcast footage, no photographs",
  treatment: {
    educationalObjective: "The viewer leaves knowing what happened (Lyon, 3 June 1997, Brazil v France, Roberto Carlos's free kick looked to be going wide then bent in) and why: spin gives a sideways force, drag slows the ball while the spin keeps going, so the curve tightens as it slows, which is the 'spinning ball spiral' French physicists described in 2010.",
    visualHook: "Frame 0: a floodlit stadium at night from a low camera behind the ball and a four-man wall; within a second the ball flies out wide of the post, and then turns.",
    mechanismsToAnimate: ["flight heading wide then bending back (model kick)", "outside-of-the-boot contact giving spin", "air faster on one side, sideways force; drag slowing the ball while spin stays", "curvature growing as speed falls: the spiral"],
    factualRisks: ["PILOT: research is search-corroborated only, no verbatim quotes captured (channel rule requiresVerbatimQuotes not met)", "trajectory is a model reconstruction with illustrative launch values, not tracking data", "'goalkeeper never moved' is single-source in this research pass", "no distance, speed or spin number is shown because reported values disagree"],
  },
  tail: 0.4,
  scenes: [
    { id: "s1-hook", lines: ["L1"], start: 0, env: "desk", evidence: ["F3", "F7"], chips: ["illustrationLabel", "conceptualLabel", "modelLabel"],
      visualPurpose: "Hook: low floodlit camera behind the ball and the wall; the ball flies out wide of the post, then visibly turns back. The question is asked by the picture before the words finish.",
      camera: [{ at: 0, x: 540, y: 800, z: 1.0 }, { at: "L1.end", x: 540, y: 800, z: 1.0 }],
      layers: [
        { component: "stadium", props: { horizonY: 700, seed: 23, lightsOnAt: 0 } },
        pitch({ id: "p1", x: 540, y: 1160, rx: 74, rz: -8, D: 4200, ppmKeys: [[0, 74], ["L1.end", 86]], focusKeys: [[0, 3, -24], ["L1.end", 2, -36]], follow: { kick: 0, at: 0.5, ease: 0.8, blend: 0.4 }, players: [...WALL, KEEPER, KICKER(0.25)],
          kicks: [{ ...KICK, at: 0.25, timeScale: 0.55 }] }) ] },
    { id: "s2-when", lines: ["L2"], start: "L2-0.3", env: "desk", transition: { type: "whip", dur: 0.4 }, evidence: ["F1"], chips: ["illustrationLabel"],
      visualPurpose: "Place and date as a stadium scoreboard: an original dot-matrix board lights up LYON, 3 JUNE 1997, then the fixture, over the floodlit stands.",
      camera: [{ at: "L2-0.3", x: 540, y: 800, z: 1.0 }, { at: "L2.end", x: 540, y: 780, z: 1.06 }],
      layers: [
        { component: "stadium", props: { horizonY: 1180, seed: 23, lightsOnAt: "L2-0.3", tiers: 4 } },
        { component: "dot-board", screen: true, props: { x: 540, y: 760, dot: 8, gap: 3, enterAt: "L2-0.2", rows: [
          { text: "LYON", at: "L2:Lyon", color: "paper" }, { text: "3 JUNE 1997", at: "L2:1997", color: "amber" }, { text: "BRAZIL V FRANCE", at: "L2:Brazil", color: "paper", speed: 80 } ] } } ] },
    { id: "s3-strike", lines: ["L3"], start: "L3-0.25", env: "spot", transition: { type: "decode-flash", dur: 0.4 }, evidence: ["F2"], chips: ["illustrationLabel", "conceptualLabel"], conceptual: true,
      visualPurpose: "The strike in close-up: a boot swings in and meets the ball off-centre with its outside edge; the contact sets the ball spinning (arrow). Shape of the contact, not a likeness.",
      camera: [{ at: "L3-0.25", x: 540, y: 800, z: 1.0 }, { at: "L3:outside", x: 560, y: 820, z: 1.12 }, { at: "L3.end", x: 580, y: 830, z: 1.18 }],
      layers: [
        { component: "line-art", screen: true, props: { x: 620, y: 800, s: 1, paths: [
          { d: "M-150 0 a150 150 0 1 0 300 0 a150 150 0 1 0 -300 0", at: "L3-0.25", dur: 0.01, color: "#f7f5ee", fill: "#f7f5ee", width: 6 },
          { d: "M-130 -30 Q0 -110 130 -30 M-95 80 Q0 30 95 80", at: "L3-0.25", dur: 0.01, color: "ink", width: 8 } ] } },
        { component: "line-art", screen: true, props: { x: 300, y: 860, s: 1, moveKeys: [["L3-0.25", -420, 160, 18], ["L3:outside", 0, 0, 0], ["L3:left", 10, -10, -6]], moveEase: "inOut", paths: [
          { d: "M-260 -120 L-60 -110 Q20 -105 60 -60 L120 -10 Q150 30 110 60 L-150 70 Q-260 70 -270 0 Z", at: "L3-0.25", dur: 0.01, color: "paper", fill: "#1b2a22", width: 7 },
          { d: "M-230 70 h40 M-150 72 h40 M-70 72 h40 M10 68 h40", at: "L3-0.25", dur: 0.01, color: "paper", width: 8 } ] } },
        { component: "line-art", screen: true, props: { x: 620, y: 800, s: 1, paths: [
          { d: "M-40 -215 A215 215 0 0 1 205 -60", at: "L3:foot", dur: 0.5, color: "amber", width: 14 },
          { d: "M185 -95 L210 -50 L160 -55", at: "L3:foot+0.45", dur: 0.15, color: "amber", width: 14 } ] } },
        { component: "labels", screen: true, props: { items: [
          { x: 470, y: 820, lx: 130, ly: 520, text: "OUTSIDE OF THE BOOT", at: "L3:outside", size: 42, pill: true },
          { x: 760, y: 610, lx: 760, ly: 470, text: "SPIN", at: "L3:foot+0.3", size: 46, pill: true } ] } } ] },
    { id: "s4-wide", lines: ["L4"], start: "L4-0.3", env: "desk", transition: { type: "match-zoom", dur: 0.5, focus: [620, 800] }, evidence: ["F3", "F7"], chips: ["illustrationLabel", "conceptualLabel", "modelLabel"],
      visualPurpose: "From above and behind the wall, the camera follows the ball as it swings around the wall and keeps flying wide of the post; the post is in shot so 'wide' is visible.",
      camera: [{ at: "L4-0.3", x: 540, y: 800, z: 1.0 }, { at: "L4.end", x: 540, y: 800, z: 1.0 }],
      layers: [
        pitch({ id: "p4", x: 540, y: 880, rx: 58, rz: -14, D: 3200, ppmKeys: [["L4-0.3", 30], ["L4.end", 36]], focusKeys: [["L4-0.3", 3, -26]], follow: { kick: 0, at: "L4:ball", ease: 0.6, blend: 0.6 },
          players: [...WALL, KEEPER], kicks: [{ ...KICK, at: "L4-0.1", timeScale: 0.34 }] }) ] },
    { id: "s5-in", lines: ["L5"], start: "L5-0.3", env: "desk", transition: { type: "continuity", dur: 0.45 }, evidence: ["F3", "F4", "F7"], chips: ["illustrationLabel", "conceptualLabel", "modelLabel"],
      visualPurpose: "Goal-mouth view across the goal: the ball, already wide, bends back inside the post past the keeper, who stays planted; the full curve is left as a trail.",
      camera: [{ at: "L5-0.3", x: 540, y: 800, z: 1.0 }, { at: "L5.end", x: 540, y: 790, z: 1.05 }],
      layers: [
        { component: "stadium", props: { horizonY: 560, seed: 41, lightsOnAt: -1, tiers: 3 } },
        pitch({ id: "p5", x: 540, y: 1040, rx: 68, rz: 118, D: 3600, pxPerMetre: 52, focusKeys: [["L5-0.3", 2, -46], ["L5.end", 1, -49]], players: [...WALL, KEEPER],
          kicks: [{ ...KICK, at: "L5-2.2", timeScale: 0.42 }] }),
        { component: "labels", screen: true, props: { items: [{ x: 600, y: 900, lx: 430, ly: 520, text: "KEEPER STAYS", at: "L5:goalkeeper", size: 42, pill: true, outAt: "L5.end+0.1" }] } } ] },
    { id: "s6-paper", lines: ["L6"], start: "L6-0.3", env: "paper", transition: { type: "push", dur: 0.5 }, evidence: ["F5"], chips: ["illustrationLabel"],
      visualPurpose: "Thirteen years later: the timeline runs from 1997 to 2010 and a journal page slides in with the paper's title and authors, the source of the explanation that follows.",
      camera: [{ at: "L6-0.3", x: 540, y: 800, z: 1.0 }, { at: "L6.end", x: 540, y: 810, z: 1.06 }],
      layers: [
        { component: "timeline-ruler", screen: true, props: { theme: "light", y: 470, fromYear: 1997, year: 2010, pxPerYear: 70, enterAt: "L6-0.2", arriveAt: "L6:2010", outAt: "L6.end+0.2" } },
        { component: "paper-card", screen: true, props: { x: 120, y: 660, w: 840, h: 520, enterAt: "L6:French" } },
        { component: "kinetic-type", screen: true, props: { items: [
          { at: "L6:French+0.15", x: 180, y: 760, text: "NEW JOURNAL OF PHYSICS", size: 40, color: "inkSoft", anchor: "start", letterSpacing: 3, style: "fade", outAt: "L6.end+0.3" },
          { at: "L6:physicists", x: 180, y: 880, text: "The spinning", size: 78, family: "serif", color: "ink", anchor: "start", style: "fade", outAt: "L6.end+0.3" },
          { at: "L6:physicists+0.15", x: 180, y: 975, text: "ball spiral", size: 78, family: "serif", color: "ink", anchor: "start", style: "fade", outAt: "L6.end+0.3" },
          { at: "L6:showed", x: 180, y: 1090, text: "Dupeux, Le Goff, Quéré, Clanet", size: 40, color: "inkSoft", anchor: "start", style: "fade", outAt: "L6.end+0.3" } ] } } ] },
    { id: "s7-forces", lines: ["L7"], start: "L7-0.3", env: "desk", transition: { type: "iris", dur: 0.5 }, evidence: ["F6", "F7"], chips: ["illustrationLabel", "modelLabel"],
      visualPurpose: "The mechanism in the ball's frame: spin speeds the air on one side and the sideways force appears; then drag appears and the air (ball) slows while the spin gauge holds; the flow pattern grows more lopsided.",
      camera: [{ at: "L7-0.3", x: 540, y: 800, z: 1.0 }, { at: "L7.end", x: 540, y: 790, z: 1.04 }],
      layers: [
        { component: "airflow", screen: true, props: { x: 540, y: 720, R: 120, U: 260, w: 960, h: 760, enterAt: "L7-0.3", spinKeys: [["L7-0.3", 0.22], ["L7.end", 0.22]], forceAt: "L7:pushes", forceLen: 170,
          dragAt: "L7:Drag", dragLen: 180, slowKeys: [["L7:Drag", 1], ["L7:down", 0.5]],
          gauges: [{ label: "SPEED", at: "L7:Drag", keys: [["L7:Drag", 1], ["L7:down", 0.5]], color: "teal" }, { label: "SPIN", at: "L7:spin", keys: [["L7:spin", 0.8]], color: "amber" }] } },
        { component: "labels", screen: true, props: { items: [{ x: 540, y: 450, lx: 150, ly: 300, text: "SIDEWAYS PUSH", at: "L7:sideways", size: 40, pill: true, outAt: "L7:Drag" },
          { x: 900, y: 720, lx: 800, ly: 560, text: "DRAG", at: "L7:slows", size: 40, pill: true }] } } ] },
    { id: "s8-spiral", lines: ["L8"], start: "L8-0.3", env: "teal", transition: { type: "scan-wipe", dur: 0.5 }, evidence: ["F6", "F7"], chips: ["illustrationLabel", "modelLabel"],
      visualPurpose: "Top view of the model path: as speed falls with spin held, the turning circles shrink (drawn as they occur) and the path closes into a spiral; the stretch a real kick flies is solid, the model's continuation dashed.",
      camera: [{ at: "L8-0.3", x: 540, y: 800, z: 1.0 }, { at: "L8.end", x: 540, y: 800, z: 1.08 }],
      layers: [
        { component: "spiral-plot", screen: true, props: { id: "sp", box: { x: 90, y: 300, w: 900, h: 940 }, speed: 30, drag: 0.012, magnus: 0.0022, spin: 82, minSpeed: 1.2, kickLen: 33,
          drawAt: "L8-0.2", drawEndAt: "L8:spiral+0.3", circles: [{ d: 0.3, at: "L8:slower" }, { d: 0.55, at: "L8:tighter" }, { d: 0.8, at: "L8:curves" }] } },
        { component: "labels", screen: true, props: { items: [{ x: 540, y: 1120, lx: 240, ly: 1200, text: "A KICK'S LENGTH", at: "L8:So", size: 42, pill: true, outAt: "L8:curves" }, { x: 540, y: 700, lx: 600, ly: 360, text: "SPIRAL (MODEL)", at: "L8:spiral", size: 42, pill: true }] } } ] },
    { id: "s9-story", lines: ["L9"], start: "L9-0.3", env: "desk", transition: { type: "push", dur: 0.5 }, evidence: ["F3", "F7"], chips: ["illustrationLabel", "conceptualLabel", "modelLabel"],
      visualPurpose: "Payoff: back behind the ball at night; the ball bends in late, exactly where the hook left the viewer; the brand line lands over the stadium.",
      camera: [{ at: "L9-0.3", x: 540, y: 800, z: 1.0 }, { at: "end", x: 540, y: 800, z: 1.0 }],
      layers: [
        { component: "stadium", props: { horizonY: 700, seed: 23, lightsOnAt: -1 } },
        pitch({ id: "p9", x: 540, y: 1160, rx: 74, rz: -8, D: 4200, ppmKeys: [["L9-0.3", 62], ["L9:late", 70]], focusKeys: [["L9-0.3", 3, -24], ["L9:late", 2, -34]], players: [...WALL, KEEPER],
          kicks: [{ ...KICK, at: "L9-0.2", timeScale: 0.82 }] }),
        { component: "kinetic-type", screen: true, props: { items: [
          { at: "L9:Every", x: 540, y: 470, text: "EVERY GOAL", size: 96, color: "paper", style: "pop", letterSpacing: 3 },
          { at: "L9:has", x: 540, y: 580, text: "HAS A STORY", size: 96, color: "amber", style: "pop", letterSpacing: 3 } ] } } ] },
  ],
};
fs.writeFileSync(path.join(__dirname, "storyboard.json"), JSON.stringify(sb, null, 1) + "\n");
console.log("storyboard.json:", sb.scenes.length, "scenes");
