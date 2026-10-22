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
    dam: { box: [1000, 600], fp: [0.5, 0.55], breach: true, paths: [
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
    structure: { box: [1000, 600], fp: [0.5, 0.45], tilt: 4, paths: [
      "M100 500 L900 500", "M160 500 L160 160 L840 160 L840 500", "M160 160 L380 500", "M380 160 L600 500", "M600 160 L840 500", "M380 160 L160 500", "M600 160 L380 500", "M840 160 L600 500"] },
  };
  BTO.silhouetteKinds = Object.keys(KINDS);

  // props: kind, x y (centre), w (drawn width), drawAt (line work draws on), failAt (crack + glow; null = intact), seed
  BTO.def("object-silhouette", (o) => {
    const C = P(); const K = KINDS[o.kind] || KINDS.structure; if (o.drawAt != null) BTO.cue(o.drawAt, "sweep", 0.3, 0, { dur: 0.9 });
    if (o.failAt != null) { BTO.cue(o.failAt, "lock", 0.5); BTO.cue(o.failAt + 0.35, "whoosh", 0.35); }
    const r = BTO.rng(o.seed || 31); const crack = []; let cx = 0, cy = 0; for (let i = 0; i < 9; i += 1) { cx += (r() - 0.35) * 46; cy += 22 + r() * 30; crack.push([cx, cy]); }
    return { draw: (t) => {
      const op = fade(t, o.enterAt, o.outAt); if (op <= 0) return "";
      const [bw, bh] = K.box; const s = (o.w || 860) / bw; const x0 = (o.x || 540) - (bw * s) / 2, y0 = (o.y || 820) - (bh * s) / 2;
      const draw = o.drawAt == null ? 1 : BTO.ease("inOut", clamp((t - o.drawAt) / 0.9)); const f = o.failAt == null ? 0 : clamp((t - o.failAt) / 1.4); const fe = BTO.ease("inOut", f);
      const [fx, fy] = [K.fp[0] * bw, K.fp[1] * bh];
      const tilt = (K.tilt || 0) * fe, sink = (K.sink || 0) * fe, sag = (K.sag || 0) * fe;
      let g = `<g transform="translate(${n1(x0)} ${n1(y0 + sink * s)}) scale(${s.toFixed(4)}) rotate(${n1(tilt)} ${n1(fx)} ${n1(fy)})">`;
      // bridge: the deck lines (the first paths) sag at mid-span as the structure gives way
      K.paths.forEach((d, i) => { const dd = sag && K.deckY && i < K.deckY.length ? `M20 ${K.deckY[i]} Q500 ${n1(K.deckY[i] + sag * 2)} 980 ${K.deckY[i]}` : d;
        g += `<path d="${dd}" fill="none" stroke="${i === 0 ? C.paper : C.teal}" stroke-width="${n1((i === 0 ? 7 : 5) / s)}" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="${n1(1 - draw)}" opacity="${i === 0 ? 0.95 : 0.75}"/>`; });
      if (K.breach && f > 0) g += `<path d="M${fx - 40} ${fy} L${fx + 40} ${fy} L${n1(fx + 40 + 300 * fe)} 520 L${n1(fx - 40 - 120 * fe)} 520 Z" fill="${C.teal}" opacity="${(0.45 * fe).toFixed(3)}"/>`;
      if (K.slide && f > 0) g += `<path d="M330 190 C420 260 ${n1(480 + 220 * fe)} ${n1(360 + 120 * fe)} ${n1(560 + 260 * fe)} 540 L${n1(380 + 120 * fe)} 540 C380 420 320 300 300 200 Z" fill="${C.amber}" opacity="${(0.4 * fe).toFixed(3)}"/>`;
      if (K.collapse && f > 0) g += `<path d="M520 ${n1(120 + 0)} L${n1(520 + 120 * fe)} ${n1(120 + 380 * fe)}" stroke="${C.coral}" stroke-width="${n1(8 / s)}" opacity="${fe.toFixed(3)}"/>`;
      if (f > 0) { const k = Math.max(1, Math.round(crack.length * clamp(f * 1.6)));
        g += `<circle cx="${n1(fx)}" cy="${n1(fy)}" r="${n1(lerp(10, 70, fe) / s * 2)}" fill="${C.coral}" opacity="${(0.28 * (1 - 0.4 * fe)).toFixed(3)}" filter="url(#soft)"/>`;
        g += `<path d="M${n1(fx)} ${n1(fy)} ${crack.slice(0, k).map(([a, b]) => `L${n1(fx + a)} ${n1(fy + b * 0.6)}`).join(" ")}" fill="none" stroke="${C.coral}" stroke-width="${n1(6 / s)}" stroke-linecap="round"/>`;
        g += `<circle cx="${n1(fx)}" cy="${n1(fy)}" r="${n1(14 / s)}" fill="${C.coral}"/>`; }
      return `<g opacity="${op.toFixed(3)}">${g}</g></g>`;
    } };
  });
})(window.BTO);
