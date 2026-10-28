// BTO Premium Studio - forensic engineering components for Failure Reconstructed (structured props only).
//   failure-chain      the case's cause-and-effect chain as linked steps; the camera travels it, the active step lights,
//                      the last link turns to the failure colour
//   object-silhouette  a generic line drawing of the failed object's class (aircraft, ship, bridge, dam, rocket, ...),
//                      drawn on, then a crack and glow grow from the failure point and the object gives way
// The drawings are generic classes, never the specific vehicle or structure: scenes using them carry the
// RECONSTRUCTION (conceptual) chip. Every frame is a pure function of t.
(function (BTO) {
  "use strict";
  const { clamp, lerp } = BTO;
  const P = () => BTO.style.palette;
  const T = () => BTO.style.type;
  const n1 = (v) => (+v).toFixed(1);
  const fade = (t, a, b, d = 0.35) => (a == null ? 1 : clamp((t - a) / d)) * (b == null ? 1 : 1 - clamp((t - b) / d));

  // wrap upper-case step text into at most two lines of ~maxChars
  const wrap = (s, maxChars) => { const ws = String(s).split(/\s+/); const out = [""]; ws.forEach((w) => { const cur = out[out.length - 1]; if (cur && (cur + " " + w).length > maxChars && out.length < 2) out.push(w); else out[out.length - 1] = cur ? cur + " " + w : w; }); return out; };

  // ---- failure-chain ------------------------------------------------------------------------------------------
  // props: x (centre), y (first step), gap, w, steps [text], activeKeys [[t, index]] (fractional = travelling between
  //   links), failIndex (default last), enterAt, outAt; window { center: y, top, bottom }: the chain scrolls so the active
  //   link sits at window.center and links fade out toward the window edges (a screen-space chain that never reaches the
  //   caption band or the chip column, however long it is)
  BTO.def("failure-chain", (o) => {
    const C = P(); (o.activeKeys || []).forEach(([at], i) => { if (i) BTO.cue(at, "tick", 0.35); });
    return { draw: (t) => {
      const op = fade(t, o.enterAt, o.outAt); if (op <= 0) return "";
      const x = o.x || 540, gap = o.gap || 230, w = o.w || 760, h = 150; const steps = o.steps || [];
      const fail = o.failIndex == null ? steps.length - 1 : o.failIndex; const act = o.activeKeys ? BTO.keys(t, o.activeKeys, "inOut") : 0;
      const win = o.window || null; const y0 = win ? win.center - h / 2 - act * gap : (o.y || 380);
      const vis = (y) => (win ? clamp(Math.min((y - win.top) / 90, (win.bottom - (y + h)) / 90)) : 1);
      let g = "";
      steps.forEach((s, i) => { const y = y0 + i * gap; const vk = vis(y); if (vk <= 0 && vis(y + gap) <= 0) return; g += `<g opacity="${clamp(Math.max(vk, 0)).toFixed(3)}">`;
        if (i < steps.length - 1) { const yA = y + h, yB = y + gap; const lit = clamp(act - i);
          g += `<line x1="${x}" y1="${yA}" x2="${x}" y2="${yB}" stroke="${C.muted}" stroke-width="6" opacity="0.35"/>`;
          g += `<line x1="${x}" y1="${yA}" x2="${x}" y2="${n1(lerp(yA, yB, lit))}" stroke="${i + 1 === fail ? C.coral : C.amber}" stroke-width="8"/>`;
          if (lit > 0 && lit < 1) g += `<circle cx="${x}" cy="${n1(lerp(yA, yB, lit))}" r="14" fill="${i + 1 === fail ? C.coral : C.amber}"/>`;
          g += `<path d="M${x - 18} ${yB - 22} L${x + 18} ${yB - 22} L${x} ${yB} Z" fill="${lit >= 1 ? (i + 1 === fail ? C.coral : C.amber) : C.muted}" opacity="${lit >= 1 ? 1 : 0.45}"/>`; }
        const state = act >= i - 0.02 ? (i === fail && act >= fail - 0.02 ? "fail" : Math.abs(act - i) < 0.5 ? "active" : "passed") : "future";
        const stroke = state === "fail" ? C.coral : state === "active" ? C.amber : state === "passed" ? C.teal : C.muted;
        const fill = state === "fail" ? C.coral : state === "active" ? C.amber : C.inkSoft;
        const glow = state === "active" || state === "fail" ? `<rect x="${x - w / 2 - 14}" y="${y - 14}" width="${w + 28}" height="${h + 28}" rx="30" fill="${stroke}" opacity="0.16" filter="url(#soft)"/>` : "";
        g += `${glow}<rect x="${x - w / 2}" y="${y}" width="${w}" height="${h}" rx="22" fill="${C.desk2}" stroke="${stroke}" stroke-width="${state === "future" ? 3 : 6}" opacity="${state === "future" ? 0.55 : 1}"/>`;
        g += `<circle cx="${x - w / 2 + 62}" cy="${y + h / 2}" r="34" fill="${fill}" opacity="${state === "future" ? 0.5 : 1}"/>` + BTO.text(x - w / 2 + 62, y + h / 2 + 14, String(i + 1), { size: 40, weight: 800, family: T().num, fill: state === "future" || state === "passed" ? C.text : C.desk });
        const lines = wrap(String(s).toUpperCase(), 24);
        lines.forEach((ln, k) => { g += BTO.text(x - w / 2 + 124, y + h / 2 + 15 + (k - (lines.length - 1) / 2) * 50, ln, { size: T().scale.label + 4, anchor: "start", weight: 800, ls: 1, fill: state === "future" ? C.muted : C.text }); });
        g += "</g>";
      });
      return `<g opacity="${op.toFixed(3)}">${g}</g>`;
    } };
  });

  // ---- object-silhouette ----------------------------------------------------------------------------------------
  // Generic classes drawn in a 1000 x 600 box (rocket/tower kinds in 600 x 1000). failPoint is where the crack starts.
  const KINDS = {
    aircraft: { box: [1000, 600], fp: [0.47, 0.46], tilt: 9, paths: [
      "M60 300 C140 255 760 250 880 270 C935 280 965 295 970 305 C960 318 930 330 880 338 C760 352 140 345 60 300 Z",
      "M430 300 L300 470 L360 470 L560 315", "M430 290 L330 150 L380 150 L560 285", "M100 290 L60 170 L110 170 L180 285", "M880 290 L900 300 L880 312"] },
    airship: { box: [1000, 600], fp: [0.3, 0.42], tilt: 7, paths: [
      "M80 280 C120 170 820 170 920 280 C820 390 120 390 80 280 Z", "M130 230 L60 150 L100 150 L190 220", "M130 330 L60 410 L100 410 L190 340",
      "M420 372 L440 430 L600 430 L620 372", "M300 190 L300 370", "M500 182 L500 378", "M700 190 L700 370"] },
    ship: { box: [1000, 600], fp: [0.38, 0.62], tilt: -8, sink: 70, paths: [
      "M40 330 L960 330 L880 470 L120 470 Z", "M320 330 L320 250 L720 250 L720 330", "M420 250 L420 160 L500 160 L500 250", "M560 250 L560 140 L640 140 L640 250",
      "M40 400 L960 400"] },
    bridge: { box: [1000, 600], fp: [0.5, 0.52], sag: 60, deckY: [320, 340], paths: [
      "M20 320 L980 320", "M20 340 L980 340", "M240 120 L240 520", "M760 120 L760 520", "M20 300 Q240 110 240 120", "M240 120 Q500 330 760 120", "M760 120 Q980 110 980 300",
      "M330 190 L330 320", "M420 245 L420 320", "M500 262 L500 320", "M580 245 L580 320", "M670 190 L670 320", "M200 520 L280 520", "M720 520 L800 520"] },
    dam: { box: [1000, 600], fp: [0.5, 0.55], breach: true, face: [[700, 120], [820, 520]], reservoir: "M20 200 L276 200 L180 520 L20 520 Z",
      slope: ["M20 200 L20 20 L110 10 L240 200 Z", "M30 80 L150 70", "M30 140 L195 130"], paths: [
      "M300 120 L700 120 L820 520 L180 520 Z", "M60 200 L300 200", "M60 230 L280 230", "M60 260 L270 260", "M200 470 L800 470", "M820 520 L980 520"] },
    rocket: { box: [600, 1000], fp: [0.5, 0.62], tilt: 6, paths: [
      "M300 60 C340 110 360 180 360 260 L360 780 L240 780 L240 260 C240 180 260 110 300 60 Z", "M240 650 L160 820 L240 790", "M360 650 L440 820 L360 790",
      "M240 420 L360 420", "M240 600 L360 600", "M260 780 L250 860 L350 860 L340 780"] },
    building: { box: [1000, 600], fp: [0.55, 0.4], collapse: true, paths: [
      "M200 520 L200 120 L520 120 L520 520", "M520 520 L520 220 L800 220 L800 520", "M120 520 L880 520",
      "M250 170 L470 170", "M250 240 L470 240", "M250 310 L470 310", "M250 380 L470 380", "M250 450 L470 450", "M570 280 L750 280", "M570 350 L750 350", "M570 420 L750 420"] },
    plant: { box: [1000, 600], fp: [0.66, 0.42], paths: [
      "M140 520 C190 380 190 260 160 140 L360 140 C330 260 330 380 380 520 Z", "M460 520 L460 260 L860 260 L860 520", "M120 520 L900 520",
      "M560 260 L560 180 L620 180 L620 260", "M700 260 L700 150 L760 150 L760 260", "M520 340 L800 340", "M520 420 L800 420"] },
    train: { box: [1000, 600], fp: [0.52, 0.5], tilt: 5, paths: [
      "M40 470 L960 470", "M40 490 L960 490", "M80 260 L380 260 L380 430 L80 430 Z", "M420 260 L720 260 L720 430 L420 430 Z", "M760 300 L940 300 C960 330 960 400 940 430 L760 430 Z",
      "M130 430 m-26 0 a26 26 0 1 0 52 0", "M330 430 m-26 0 a26 26 0 1 0 52 0", "M470 430 m-26 0 a26 26 0 1 0 52 0", "M670 430 m-26 0 a26 26 0 1 0 52 0", "M820 430 m-26 0 a26 26 0 1 0 52 0"] },
    mine: { box: [1000, 600], fp: [0.62, 0.66], paths: [
      "M40 130 L960 130", "M40 250 L960 250", "M40 370 L960 370", "M40 490 L960 490", "M260 60 L260 430 L320 430 L320 60", "M220 60 L360 60 L290 20 Z",
      "M320 400 L760 400 L760 440 L320 440", "M700 400 L700 330 L860 330 L860 360"] },
    tank: { box: [1000, 600], fp: [0.5, 0.42], paths: [
      "M280 160 C280 110 720 110 720 160 L720 440 C720 490 280 490 280 440 Z", "M280 160 C280 210 720 210 720 160", "M200 520 L800 520", "M330 440 L330 520", "M670 440 L670 520", "M720 200 L860 200 L860 520"] },
    // slope with strata and the settlement below it (landslides, spoil tips, avalanches, volcanic flanks)
    terrain: { box: [1000, 600], fp: [0.42, 0.42], slide: true, paths: [
      "M40 540 L300 200 L420 120 L520 170 L760 420 L960 540", "M180 360 L400 250", "M240 420 L520 300", "M300 480 L640 380",
      "M700 540 L700 470 L780 470 L780 540", "M800 540 L800 490 L880 490 L880 540", "M600 540 L600 500 L660 500 L660 540", "M40 540 L960 540"] },
    // crewed capsule, side view: crew cabin cone (heat shield on the left), nose section, wider equipment adapter behind;
    // generic class, never a specific spacecraft's details. `docked` adds a generic target vehicle at the nose.
    capsule: { box: [1000, 600], fp: [0.14, 0.38], spinnable: true, paths: [
      "M260 170 L520 245 L520 355 L260 430 Z", "M520 255 L600 265 L600 335 L520 345", "M260 170 L70 135 L70 465 L260 430",
      "M165 152 L165 448", "M380 232 L450 252 L450 276 L380 262 Z", "M260 170 Q240 300 260 430"],
      docked: ["M600 280 L640 272 L640 328 L600 320", "M640 235 L960 235 L960 365 L640 365 Z", "M720 235 L720 365", "M880 235 L880 365"],
      // turning circle of capsule + target (centre, radius) and an attitude thruster nozzle on the adapter (x, y, direction)
      // the capsule alone (after undocking) turns about its own centre and is framed by its own circle
      spinC: [515, 300], spinR: 470, soloC: [335, 300], soloR: 290, plume: [150, 150, 0, -1] },
    // satellite or probe: bus, two solar arrays, antenna dish
    satellite: { box: [1000, 600], fp: [0.5, 0.5], spinnable: true, paths: [
      "M420 220 L580 220 L580 380 L420 380 Z", "M90 265 L400 265 L400 335 L90 335 Z", "M600 265 L910 265 L910 335 L600 335 Z",
      "M400 300 L420 300", "M580 300 L600 300", "M168 265 L168 335", "M246 265 L246 335", "M324 265 L324 335", "M678 265 L678 335", "M756 265 L756 335", "M834 265 L834 335",
      "M500 220 L500 170", "M450 170 C470 120 530 120 550 170 Z"] },
    // winged orbiter (space shuttle class), side view
    shuttle: { box: [1000, 600], fp: [0.42, 0.52], tilt: 6, paths: [
      "M90 330 L700 330 C820 330 900 312 950 292 C900 272 820 262 700 262 L250 262 L150 150 L110 150 L140 262 L90 272 Z",
      "M300 330 L640 330 L560 392 L360 392 Z", "M780 262 L800 300 L860 300", "M90 285 L50 270 L50 320 L90 310"] },
    // earth-fill embankment dam: broad trapezoid body, reservoir on the upstream (left) side; breach opens at fp
    "embankment-dam": { box: [1000, 600], fp: [0.74, 0.7], breach: true, face: [[520, 200], [900, 520]], reservoir: "M20 230 L392 230 L120 520 L20 520 Z", paths: [
      "M120 520 L420 200 L520 200 L900 520 Z", "M20 230 L380 230", "M20 262 L350 262", "M20 294 L320 294", "M20 520 L980 520", "M470 200 L470 520"] },
    structure: { box: [1000, 600], fp: [0.5, 0.45], tilt: 4, paths: [
      "M100 500 L900 500", "M160 500 L160 160 L840 160 L840 500", "M160 160 L380 500", "M380 160 L600 500", "M600 160 L840 500", "M380 160 L160 500", "M600 160 L380 500", "M840 160 L600 500"] },
  };
  // span bridges whose main span gives way at fp: the span is split there and each half hinges down about its pier, so
  // the drawing shows where it broke and that the span fell (#364: a sagging suspension drawing for a truss bridge).
  // truss-bridge: deck on a Warren truss between two piers; girder-bridge: deck on plate girders over three spans.
  const warren = (xa, xb, yt, yb, n) => { const d = []; const w = (xb - xa) / n;
    for (let i = 0; i < n; i += 1) { const a = xa + i * w; d.push(`M${n1(a)} ${yt} L${n1(a + w / 2)} ${yb} L${n1(a + w)} ${yt}`); }
    return d; };
  const half = (xa, xb, deck, yt, yb, truss) => [{ d: `M${xa} ${deck} L${xb} ${deck}`, main: true }, `M${xa} ${yt} L${xb} ${yt}`, `M${xa} ${yb} L${xb} ${yb}`,
    ...(truss ? warren(xa, xb, yt, yb, Math.max(2, Math.round((xb - xa) / 80))) : [`M${xa} ${yt} L${xa} ${yb}`, `M${xb} ${yt} L${xb} ${yb}`])];
  KINDS["truss-bridge"] = { box: [1000, 600], fp: [0.46, 0.45], split: 460, pivots: [[220, 400], [780, 400]], deckTop: 250, paths: [
    "M20 250 L220 250", "M780 250 L980 250", "M20 270 L220 270", "M780 270 L980 270", "M120 270 L120 560", "M880 270 L880 560",
    "M220 270 L220 560", "M780 270 L780 560", "M180 560 L260 560", "M740 560 L820 560"],
    halves: [half(220, 460, 250, 270, 400, true), half(460, 780, 250, 270, 400, true)] };
  KINDS["girder-bridge"] = { box: [1000, 600], fp: [0.5, 0.48], split: 500, pivots: [[340, 330], [660, 330]], deckTop: 260, paths: [
    "M20 260 L340 260", "M660 260 L980 260", "M20 320 L340 320", "M660 320 L980 320", "M60 320 L60 560", "M340 320 L340 560", "M660 320 L660 560", "M940 320 L940 560",
    "M300 560 L380 560", "M620 560 L700 560"], halves: [half(340, 500, 260, 280, 320, false), half(500, 660, 260, 280, 320, false)] };
  // walkways hung from a ceiling on rods (box beams on hanger rods): the walkway decks drop when a connection lets go
  KINDS.walkway = { box: [1000, 600], fp: [0.36, 0.3], deckTop: 170, paths: [
    "M40 60 L960 60", "M360 60 L360 380", "M640 60 L640 380", "M120 520 L880 520"],
    drop: [{ d: "M180 190 L820 190", main: true }, "M180 210 L820 210", "M180 360 L820 360", "M180 380 L820 380", "M180 190 L180 210", "M820 190 L820 210", "M180 360 L180 380", "M820 360 L820 380"] };
  // suspension (chain or cable) bridge: the deck is the first two paths and sags at mid-span when the chain lets go
  // props.failPart "chain": the failure is in the chain or cable (an eyebar, a hanger), not the deck - the failure point moves
  // onto the main chain beside a tower and the chain itself drops with the deck
  KINDS.bridge.deckTop = 320; KINDS.bridge.fpChain = [0.33, 0.255]; KINDS.bridge.chainPath = 5;
  BTO.silhouetteKinds = Object.keys(KINDS);

  // mechanism overlays (props.mech), in the drawing's own coordinates, all pure functions of t:
  //   load     downward arrows press on the deck and an amber load path runs along the structure into the failure point
  //   wind     a stream of horizontal arrows hits the structure side-on
  //   overtop  water spills over the crest and runs down the downstream face
  //   seepage  a seepage path runs through the body from the reservoir to the downstream face at the failure point
  //   uplift   water pressure pushes up under the base toward the failure point
  // The overlay is drawn from mechAt (default the object's own start) until the structure has given way.
  const arrow = (x1, y1, x2, y2, c, w, op) => { const a = Math.atan2(y2 - y1, x2 - x1), h = w * 3.2;
    return `<g opacity="${op.toFixed(3)}"><line x1="${n1(x1)}" y1="${n1(y1)}" x2="${n1(x2 - Math.cos(a) * h * 0.6)}" y2="${n1(y2 - Math.sin(a) * h * 0.6)}" stroke="${c}" stroke-width="${n1(w)}" stroke-linecap="round"/>` +
      `<path d="M${n1(x2)} ${n1(y2)} L${n1(x2 - h * Math.cos(a - 0.45))} ${n1(y2 - h * Math.sin(a - 0.45))} L${n1(x2 - h * Math.cos(a + 0.45))} ${n1(y2 - h * Math.sin(a + 0.45))} Z" fill="${c}"/></g>`; };
  function mechanism(o, K, t, s, fx, fy, f) {
    const C = P(); let m0 = o.mechAt == null ? (o.drawAt == null ? -1 : o.drawAt + 0.6) : o.mechAt;
    // a slide-driven wave follows the slide: it starts 1 s after the slope gives way
    if (o.failPart === "slope" && o.failAt != null) m0 = Math.max(m0, o.failAt + 1); const since = t - m0; if (since < 0) return "";
    const op = clamp(since / 0.35) * (1 - clamp((f - 0.55) / 0.3)); if (op <= 0) return ""; const w = 6 / s, ph = (since % 1);
    const [bw, bh] = K.box; let g = "";
    if (o.mech === "load") { const top = K.deckTop || fy - 120;
      [-1, 1].forEach((side) => [0.08, 0.2, 0.32].forEach((k, j) => { const x = fx + side * k * bw; const y0 = top - 150 + 40 * ((ph + j * 0.33) % 1);
        g += arrow(x, y0, x, top - 8, C.amber, w, op * 0.95); }));
      // load path: dashes travelling from both ends of the span along the structure into the failure point
      const p = `M${n1(fx - 0.32 * bw)} ${top + 10} L${n1(fx)} ${n1(fy)} L${n1(fx + 0.32 * bw)} ${top + 10}`;
      g += `<path d="${p}" fill="none" stroke="${C.amber}" stroke-width="${n1(w * 1.3)}" stroke-dasharray="${n1(22 / s)} ${n1(18 / s)}" stroke-dashoffset="${n1(-since * 80 / s)}" opacity="${(op * 0.9).toFixed(3)}"/>`;
    } else if (o.mech === "wind") {
      [0.3, 0.42, 0.54, 0.66].forEach((k, j) => { const y = k * bh; const x0 = -60 + 120 * ((ph + j * 0.27) % 1); g += arrow(x0, y, x0 + 0.22 * bw, y, C.amber, w, op * 0.9); });
    } else if (o.mech === "overtop" && K.face) { const [[cx, cy], [tx, ty]] = K.face;
      // the water sheet: across the reservoir, over the crest and down the downstream face to the toe
      g += `<path d="M20 ${cy - 8} L${cx} ${cy - 8} L${tx + 14} ${ty - 4}" fill="none" stroke="${C.teal}" stroke-width="${n1(w * 2.2)}" stroke-linejoin="round" stroke-dasharray="${n1(30 / s)} ${n1(16 / s)}" stroke-dashoffset="${n1(-since * 120 / s)}" opacity="${op.toFixed(3)}"/>`;
    } else if (o.mech === "seepage") {
      g += `<path d="M300 300 C430 340 600 380 ${n1(fx)} ${n1(fy)}" fill="none" stroke="${C.teal}" stroke-width="${n1(w * 1.6)}" stroke-dasharray="${n1(14 / s)} ${n1(12 / s)}" stroke-dashoffset="${n1(-since * 70 / s)}" opacity="${op.toFixed(3)}"/>`;
      g += `<circle cx="${n1(fx)}" cy="${n1(fy)}" r="${n1((8 + 6 * Math.sin(since * 6)) / s * 1.5)}" fill="${C.teal}" opacity="${(op * 0.8).toFixed(3)}"/>`;
    } else if (o.mech === "uplift") {
      [0.3, 0.42, 0.54, 0.66].forEach((k, j) => { const x = k * bw; const y0 = 0.93 * bh - 30 * ((ph + j * 0.25) % 1); g += arrow(x, y0 + 30, x, y0 - 40, C.teal, w, op * 0.9); });
    }
    return g;
  }

  // props: kind, x y (centre), w (drawn width), drawAt (line work draws on), failAt (crack + glow; null = intact), seed,
  //   opacity (a dimmed backdrop copy behind the failure chain)
  BTO.def("object-silhouette", (o) => {
    const C = P(); const K = KINDS[o.kind] || KINDS.structure; if (o.drawAt != null) BTO.cue(o.drawAt, "sweep", 0.3, 0, { dur: 0.9 });
    if (o.failAt != null) { BTO.cue(o.failAt, "lock", 0.5); BTO.cue(o.failAt + 0.35, "whoosh", 0.35); }
    const r = BTO.rng(o.seed || 31); const crack = []; let cx = 0, cy = 0; for (let i = 0; i < 9; i += 1) { cx += (r() - 0.35) * 46; cy += 22 + r() * 30; crack.push([cx, cy]); }
    return { draw: (t) => {
      const op = fade(t, o.enterAt, o.outAt) * (o.opacity == null ? 1 : o.opacity); if (op <= 0) return "";
      // the drawing fits a safe box (width w, height maxH): a tall class no longer overruns the chips, the watermark or
      // the headline band (#364: a 600 x 1000 rocket at w=900 was 1500 px tall)
      // a spinning object fits by its turning circle (K.spinR about K.spinC), so no angle carries it out of the box (#364)
      const spinning = o.motion === "spin"; const [bw, bh] = K.box;
      const circle = K.spinC && (spinning || (K.soloC && !o.docked)) ? (o.docked || !K.soloC ? [K.spinC, K.spinR] : [K.soloC, K.soloR]) : null;
      const [scx, scy] = circle ? circle[0] : [bw / 2, bh / 2];
      const s = circle ? Math.min(o.w || 860, o.maxH || 640) / (2 * circle[1]) : Math.min((o.w || 860) / bw, (o.maxH || 640) / bh);
      const x0 = (o.x || 540) - (circle ? scx : bw / 2) * s, y0 = (o.y || 820) - (circle ? scy : bh / 2) * s;
      const draw = o.drawAt == null ? 1 : BTO.ease("inOut", clamp((t - o.drawAt) / 0.9));
      // props.holds: the structure survived (the failure was elsewhere, e.g. the slope above a dam): no crack, breach or
      // collapse, only the mechanism overlay
      const f = o.failAt == null || o.holds ? 0 : clamp((t - o.failAt) / 1.4); const fe = BTO.ease("inOut", f);
      // uplift acts under the base: the failure point moves down to the foundation
      const fpK = o.failPart === "chain" && K.fpChain ? K.fpChain : K.fp; const [fx, fy] = [fpK[0] * bw, (o.mech === "uplift" ? 0.84 : fpK[1]) * bh];
      const tilt = (K.tilt || 0) * fe, sink = (K.sink || 0) * fe, sag = (K.sag || 0) * fe;
      // motion "spin": after failAt the object rotates about its centre faster and faster (an uncontrolled spin, shown in
      // the drawing plane), with fading ghost copies at earlier angles so the rotation reads in a still frame
      // the rate climbs from 40 to 400 deg/s over 1.5 s, then holds (about one turn per second): it keeps turning in later scenes
      // props.stopAt: the crew stops it - the rate falls linearly to zero over 1.2 s and the object holds its last angle
      const raw = (tau) => { const Tc = 1.5; return tau < Tc ? 40 * tau + 120 * tau * tau : 40 * Tc + 120 * Tc * Tc + 400 * (tau - Tc); };
      const rate = (tau) => (tau < 1.5 ? 40 + 240 * tau : 400);
      const spinAngle = (tt) => { if (o.motion !== "spin" || o.failAt == null) return 0; const tau = Math.max(0, tt - o.failAt);
        if (o.stopAt == null || tt <= o.stopAt) return raw(tau); const ts = Math.max(0, o.stopAt - o.failAt), u = Math.min(tt - o.stopAt, 1.2);
        return raw(ts) + rate(ts) * (u - (u * u) / 2.4); };
      const spin = spinAngle(t);
      // the spin is shown as yaw in the drawing plane plus roll about the long axis (the outline narrows and widens)
      const roll = (a) => `translate(0 ${scy}) scale(1 ${(0.6 + 0.4 * Math.abs(Math.cos((a * 1.3 * Math.PI) / 180))).toFixed(3)}) translate(0 ${-scy})`;
      // docked target: props.undockAt separates it, drifting off along the capsule's axis and fading
      const und = o.undockAt == null ? 0 : BTO.ease("inOut", clamp((t - o.undockAt) / 1.4));
      const docked = K.docked && o.docked ? K.docked : [];
      const dockWrap = (inner) => (docked.length ? `<g transform="translate(${n1(320 * und)} 0)" opacity="${(1 - 0.85 * und).toFixed(3)}">${inner}</g>` : "");
      const body = (rot, alpha) => { const ln = (d, i) => `<path d="${d}" fill="none" stroke="${i === 0 ? C.paper : C.teal}" stroke-width="${n1((i === 0 ? 10 : 7) / s)}" stroke-linecap="round" stroke-linejoin="round"/>`;
        return `<g transform="rotate(${n1(rot)} ${scx} ${scy}) ${roll(rot)}" opacity="${alpha.toFixed(3)}">${K.paths.map(ln).join("")}${dockWrap(docked.map((d) => ln(d, 1)).join(""))}</g>`; };
      let g = `<g transform="translate(${n1(x0)} ${n1(y0 + sink * s)}) scale(${s.toFixed(4)}) rotate(${n1(tilt)} ${n1(fx)} ${n1(fy)})">`;
      // props.stars: a fixed star field behind a spacecraft in space (screen-wide, never moves with the spin)
      if (o.stars) { const sr = BTO.rng(7); for (let i = 0; i < 80; i += 1) { const sx = (-x0 + sr() * 1080) / s, sy = (-y0 + sr() * 1920) / s;
        g += `<circle cx="${n1(sx)}" cy="${n1(sy)}" r="${n1((1.5 + sr() * 2.5) / s)}" fill="${C.paper}" opacity="${(0.25 + sr() * 0.45).toFixed(2)}"/>`; } }
      if (spin > 0) {
        [0.12, 0.24].forEach((dt, k) => { const a = spinAngle(t - dt); if (a > 0) g += body(a, 0.22 - 0.08 * k); });
        const r = (circle ? circle[1] : Math.max(bw, bh) * 0.5) * 1.06; const arc = (a0) => `M${n1(scx + r * Math.cos(a0))} ${n1(scy + r * Math.sin(a0))} A${n1(r)} ${n1(r)} 0 0 1 ${n1(scx + r * Math.cos(a0 + 1.1))} ${n1(scy + r * Math.sin(a0 + 1.1))}`;
        const a0 = (spin * Math.PI) / 180;
        [0, Math.PI].forEach((ph) => { g += `<path d="${arc(a0 + ph)}" fill="none" stroke="${C.amber}" stroke-width="${n1(6 / s)}" stroke-linecap="round" opacity="${clamp(spin / 90).toFixed(3)}"/>`; });
        g += `<g transform="rotate(${n1(spin)} ${scx} ${scy}) ${roll(spin)}">`;
      } else if (spinning) g += `<g>`;
      // bridge: the deck lines (the first paths) sag at mid-span as the structure gives way
      // dams: the reservoir behind the dam is filled, so the drawing reads as water held back (it drains through a breach)
      if (K.reservoir) g += `<path d="${K.reservoir}" fill="${C.teal}" opacity="${n1((0.22 - 0.12 * (K.breach && !o.holds ? fe : 0)) * draw * 100) / 100}"/>`;
      // line weights 10 / 7 px at scale 1: read on a phone (5 px secondary lines vanished at Shorts size, and frame 0 read as empty)
  // closed outlines (hulls, bodies, cabins) carry a faint fill, so the object reads as a solid shape, not wire
      const stroke = (dd, main) => `<path d="${dd}" fill="${/Z\s*$/.test(dd) ? C.paper : "none"}" fill-opacity="${/Z\s*$/.test(dd) ? (0.09 * draw).toFixed(3) : 0}" stroke="${main ? C.paper : C.teal}" stroke-width="${n1((main ? 10 : 7) / s)}" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="${n1(1 - draw)}" opacity="${main ? 0.95 : 0.75}"/>`;
      K.paths.forEach((d, i) => { const dd = sag && K.deckY && i < K.deckY.length ? `M20 ${K.deckY[i]} Q500 ${n1(K.deckY[i] + sag * 2)} 980 ${K.deckY[i]}`
        : sag && o.failPart === "chain" && i === K.chainPath ? `M240 120 Q500 ${n1(330 + sag * 4)} 760 120` : d;
        g += stroke(dd, i === 0 && !K.halves); });
      g += dockWrap(docked.map((d) => stroke(d, false)).join(""));
      // props.plume: the stuck attitude thruster firing (from plumeAt, default failAt), a flickering jet on the nozzle
      if (o.plume && K.plume && t >= (o.plumeAt == null ? (o.failAt == null ? 0 : o.failAt) : o.plumeAt) && (o.stopAt == null || t < o.stopAt)) { const [px, py, dx, dy] = K.plume;
        const L = 90 + 18 * Math.sin(t * 37) + 10 * Math.sin(t * 53), wd = 26; const [nx, ny] = [-dy, dx];
        g += `<path d="M${n1(px + nx * wd)} ${n1(py + ny * wd)} L${n1(px + dx * L)} ${n1(py + dy * L)} L${n1(px - nx * wd)} ${n1(py - ny * wd)} Z" fill="${C.amber}" opacity="0.85"/>`;
        g += `<path d="M${n1(px + nx * wd * 0.45)} ${n1(py + ny * wd * 0.45)} L${n1(px + dx * L * 0.55)} ${n1(py + dy * L * 0.55)} L${n1(px - nx * wd * 0.45)} ${n1(py - ny * wd * 0.45)} Z" fill="${C.paper}" opacity="0.9"/>`; }
      // a river or sea under the structure when the case file names one (props.water): a slow wave line near the base
      if (o.water) { let d = ""; for (let x = 0; x <= bw; x += 40) d += `${x ? "L" : "M"}${x} ${n1(bh * 0.86 + 6 * Math.sin(x / 70 + t * 1.6))}`;
        g += `<path d="${d}" fill="none" stroke="${C.teal}" stroke-width="${n1(4 / s)}" opacity="${(0.55 * draw).toFixed(3)}"/>`; }
      // walkways: the hung decks fall together onto the floor
      if (K.drop) g += `<g transform="translate(0 ${n1(130 * fe)})">` + K.drop.map((p) => (typeof p === "string" ? stroke(p, false) : stroke(p.d, p.main))).join("") + "</g>";
      // span bridges: each half of the main span hinges down about its pier, opening a gap at the failure point
      if (K.halves) K.halves.forEach((ps, h) => { const [px, py] = K.pivots[h]; const ang = (h ? -1 : 1) * 24 * fe;
        g += `<g transform="translate(0 ${n1(150 * fe)}) rotate(${n1(ang)} ${px} ${py})">` + ps.map((p) => (typeof p === "string" ? stroke(p, false) : stroke(p.d, p.main))).join("") + "</g>"; });
      // props.failPart "slope" (dam): the mountainside above the reservoir, drawn from the start; at failAt a slide mass
      // runs down it into the water (the dam itself holds), then the overtopping wave follows
      if (o.failPart === "slope" && K.slope) { const fs = o.failAt == null ? 0 : BTO.ease("inOut", clamp((t - o.failAt) / 1.2));
        K.slope.forEach((d) => { g += stroke(d, false); });
        // the slide: a wedge of the slope's face moves down its line into the reservoir
        if (fs > 0) g += `<path d="M110 14 L150 60 L215 170 L160 180 L95 60 Z" transform="translate(${n1(70 * fs)} ${n1(80 * fs)})" fill="${C.amber}" opacity="${(0.25 + 0.45 * fs).toFixed(3)}"/>`; }
      if (o.mech) g += mechanism(o, K, t, s, fx, fy, f);
      if (K.breach && f > 0) g += `<path d="M${fx - 40} ${fy} L${fx + 40} ${fy} L${n1(fx + 40 + 300 * fe)} 520 L${n1(fx - 40 - 120 * fe)} 520 Z" fill="${C.teal}" opacity="${(0.45 * fe).toFixed(3)}"/>`;
      if (K.slide && f > 0) g += `<path d="M330 190 C420 260 ${n1(480 + 220 * fe)} ${n1(360 + 120 * fe)} ${n1(560 + 260 * fe)} 540 L${n1(380 + 120 * fe)} 540 C380 420 320 300 300 200 Z" fill="${C.amber}" opacity="${(0.4 * fe).toFixed(3)}"/>`;
      if (K.collapse && f > 0) g += `<path d="M520 ${n1(120 + 0)} L${n1(520 + 120 * fe)} ${n1(120 + 380 * fe)}" stroke="${C.coral}" stroke-width="${n1(8 / s)}" opacity="${fe.toFixed(3)}"/>`;
      // a spin is not a structural failure: no crack or glow on a spinning object (the thruster plume shows the cause)
      if (f > 0 && !spinning) { const k = Math.max(1, Math.round(crack.length * clamp(f * 1.6)));
        g += `<circle cx="${n1(fx)}" cy="${n1(fy)}" r="${n1(lerp(10, 70, fe) / s * 2)}" fill="${C.coral}" opacity="${(0.28 * (1 - 0.4 * fe)).toFixed(3)}" filter="url(#soft)"/>`;
        g += `<path d="M${n1(fx)} ${n1(fy)} ${crack.slice(0, k).map(([a, b]) => `L${n1(fx + a)} ${n1(fy + b * 0.6)}`).join(" ")}" fill="none" stroke="${C.coral}" stroke-width="${n1(6 / s)}" stroke-linecap="round"/>`;
        g += `<circle cx="${n1(fx)}" cy="${n1(fy)}" r="${n1(14 / s)}" fill="${C.coral}"/>`; }
      return `<g opacity="${op.toFixed(3)}">${g}${spinning ? "</g>" : ""}</g></g>`;
    } };
  });
})(window.BTO);
