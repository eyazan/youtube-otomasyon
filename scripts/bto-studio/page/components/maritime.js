// BTO Premium Studio - forensic maritime kit for Failure Reconstructed (structured props only). Each component shows one
// step of a ship loss as a mechanism, so a viewer understands the failure from the picture (#409 review of El Faro: the
// grammar drew one wireframe ship four times and three chain cards, never the storm, the flooding, the list or the sinking).
//   heavy-seas     a generic cargo ship in a seaway: parallax swell, rain, an optional storm wall on the horizon; the ship
//                  rides the wave under it (heave and pitch from the wave slope); hitAt bursts spray over the bow;
//                  powerlessAt turns her broadside to the sea and the roll grows; sinkAt takes her under; sunk = already
//                  below the surface (the toll)
//   storm-track    a schematic chart (no real coastline or scale): the ship's route and the storm's track converge;
//                  stale { at, label } leaves the forecast position behind the real storm (data hours old);
//                  detour { at, label } draws the route that keeps clear of the storm (the lesson)
//   hull-section   a transverse cut through the hull in a level sea: water pours in through an opening, the hold fills
//                  and the ship heels toward the flooded side; an inclinometer shows the list (no digits)
//   propulsion     the stern in cutaway: engine, shaft, propeller and an oil-pressure dial; at stopAt the needle falls,
//                  the engine light dies and the propeller spins down to a stop
// Drawings are generic classes, never the specific ship, route or storm: scenes using them carry the RECONSTRUCTION chip.
// Angles and positions are illustrative, not measured. Every frame is a pure function of t.
(function (BTO) {
  "use strict";
  const { clamp, lerp } = BTO;
  const n1 = (v) => (+v).toFixed(1);
  const P = () => BTO.style.palette;
  const fade = (t, a, b, d = 0.35) => (a == null ? 1 : clamp((t - a) / d)) * (b == null ? 1 : 1 - clamp((t - b) / d));
  const LBL = () => BTO.style.type.scale.label;

  // generic cargo ship side profile, bow to the right, waterline at y = 0, length 1 = 600 px
  // profile: "cargo" (container stacks, default), "passenger" (cruise ship / liner / ferry: tiers of lit decks along the
  // hull, no containers), "bulk" (lake or ore carrier: flat hatch covers, no containers)
  function shipProfile(L, { stroke, fill, lights = 1, op = 1, profile = "cargo" } = {}) {
    const C = P(); const s = L / 600; const p = (pts) => "M" + pts.map(([x, y]) => `${n1(x * s)} ${n1(y * s)}`).join(" L") + " Z";
    const hull = p([[-300, -46], [270, -46], [305, -70], [300, -40], [272, 30], [-262, 30], [-300, -10]]);
    const house = p([[-270, -46], [-270, -150], [-170, -150], [-170, -46]]);
    const bridge = p([[-280, -150], [-280, -178], [-150, -178], [-150, -150]]);
    const stack = p([[-235, -178], [-232, -230], [-196, -230], [-200, -178]]);
    let boxes = ""; if (profile === "passenger") { for (let d = 0; d < 3; d += 1) { const y0 = -46 - (d + 1) * 34; const xa = -250 + d * 20, xb = 230 - d * 30;
        boxes += `<rect x="${n1(xa * s)}" y="${n1(y0 * s)}" width="${n1((xb - xa) * s)}" height="${n1(34 * s)}" fill="#d8dde0" stroke="${stroke || C.text}" stroke-width="2"/>`;
        for (let x = xa + 14; x < xb - 10; x += 26) boxes += `<rect x="${n1(x * s)}" y="${n1((y0 + 12) * s)}" width="${n1(12 * s)}" height="${n1(9 * s)}" fill="${C.amber}" opacity="${(0.8 * lights).toFixed(2)}"/>`; } }
    else if (profile === "bulk") { for (let i = 0; i < 9; i += 1) boxes += `<rect x="${n1((-150 + i * 46) * s)}" y="${n1(-56 * s)}" width="${n1(38 * s)}" height="${n1(10 * s)}" fill="#4a5a64" stroke="${stroke || C.text}" stroke-width="2"/>`; }
    else for (let i = 0; i < 7; i += 1) { const x0 = -150 + i * 58; boxes += `<rect x="${n1(x0 * s)}" y="${n1(-46 * s - (i % 3 === 1 ? 64 : 46) * s)}" width="${n1(54 * s)}" height="${n1((i % 3 === 1 ? 64 : 46) * s)}" fill="${i % 2 ? "#3b5566" : "#4a3f36"}" stroke="${stroke || C.text}" stroke-width="2" opacity="0.95"/>`; }
    let win = ""; for (let i = 0; i < 4; i += 1) win += `<rect x="${n1((-268 + i * 30) * s)}" y="${n1(-170 * s)}" width="${n1(18 * s)}" height="${n1(10 * s)}" fill="${C.amber}" opacity="${(0.85 * lights).toFixed(2)}"/>`;
    return `<g opacity="${op}">${boxes}<path d="${hull}" fill="${fill || "#1c2b36"}" stroke="${stroke || C.text}" stroke-width="4" stroke-linejoin="round"/>`
      + `<path d="${p([[-298, 6], [282, 6], [276, 30], [-262, 30]])}" fill="#7a2e2a" opacity="0.9"/>`
      + `<path d="${house}" fill="#d8dde0" stroke="${stroke || C.text}" stroke-width="3"/><path d="${bridge}" fill="#c9cfd3" stroke="${stroke || C.text}" stroke-width="3"/>`
      + `<path d="${stack}" fill="#2a3a46" stroke="${stroke || C.text}" stroke-width="3"/>${win}</g>`;
  }

  // ---- heavy-seas -----------------------------------------------------------------------------------------------
  // props: x (ship x), y (mean sea level, default 980), L (ship length px), swell (wave height px), storm (bool),
  //   heading (1 = into the sea from the left), hitAt, powerlessAt, sinkAt, sinkDur, sunk, lights, enterAt, outAt, seed,
//   rockAt (grounding: a rock under the bow, a gash opens; approachDur: how long she comes on), heel + heelAt
  BTO.def("heavy-seas", (o) => {
    const r = BTO.rng(o.seed || 11); const drops = Array.from({ length: 90 }, () => ({ x: r() * 1400 - 160, y: r() * 1920, v: 1600 + r() * 900, l: 40 + r() * 50 }));
    if (o.hitAt != null) { BTO.cue(o.hitAt, "whoosh", 0.7); BTO.cue(o.hitAt + 0.05, "drop", 0.5); }
    if (o.sinkAt != null) BTO.cue(o.sinkAt, "drop", 0.6);
    const Y = o.y || 1000, A = o.swell == null ? 70 : o.swell, X = o.x || 540, L = o.L || 800;
    // three swell layers: back (slow, small), middle (the one the ship rides), front (fast, covers the hull's lower edge)
    const wave = (x, t, layer) => { const k = [0.006, 0.0042, 0.0034][layer], w = [0.9, 1.25, 1.6][layer], a = A * [0.45, 1, 0.75][layer];
      return Y + [-70, 0, 40][layer] + a * Math.sin(k * x - w * t + layer * 1.7) + a * 0.35 * Math.sin(k * 2.3 * x + w * 1.4 * t + layer); };
    const sea = (t, layer, col, op) => { let d = `M-20 1920 L-20 ${n1(wave(-20, t, layer))}`; for (let x = 0; x <= 1100; x += 20) d += ` L${x} ${n1(wave(x, t, layer))}`; return `<path d="${d} L1100 1920 Z" fill="${col}" opacity="${op}"/>`; };
    return { draw: (t) => {
      const op = fade(t, o.enterAt, o.outAt); if (op <= 0) return ""; const C = P(); let g = "";
      // sky and storm wall
      g += `<defs><linearGradient id="hsSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#05090d"/><stop offset="0.55" stop-color="#132330"/><stop offset="1" stop-color="#2b3d48"/></linearGradient></defs><rect x="-40" y="-40" width="1160" height="2000" fill="url(#hsSky)"/>`;
      if (o.storm) { const rot = (t * 14) % 360; g += `<g transform="translate(800 ${Y - 250}) scale(0.8 0.34) rotate(${n1(rot)})" opacity="0.7">`;
        for (let i = 0; i < 5; i += 1) g += `<path d="M0 0 C 120 -60 260 30 300 160" transform="rotate(${i * 72})" fill="none" stroke="#5d6f7c" stroke-width="${70 - i * 6}" stroke-linecap="round" opacity="0.5"/>`;
        g += `<circle r="38" fill="#0b141a"/></g><rect x="-40" y="${Y - 230}" width="1160" height="160" fill="#1f2f3a" opacity="0.6" filter="url(#soft)"/>`; }
      // ship state
      const sinkK = o.sunk ? 1 : o.sinkAt != null ? BTO.ep(t, o.sinkAt, o.sinkAt + (o.sinkDur || 2.6), "inOut") : 0;
      const beam = o.powerlessAt != null ? BTO.ep(t, o.powerlessAt, o.powerlessAt + 1.6, "inOut") : 0;
      // rockAt: a grounding. The ship comes on from the left and stops with its bow section over a rock just under the
      // surface; at rockAt a gash opens along the hull below the waterline. heel (deg, from heelAt over 1.6 s): a list
      const appr = o.rockAt != null ? 1 - BTO.ep(t, o.rockAt - (o.approachDur || 1.4), o.rockAt, "out") : 0;
      const sx = X - appr * 120 + (o.heading === -1 ? -1 : 1) * 18 * Math.sin(t * 0.5) * (1 - sinkK) * (o.rockAt != null ? 0 : 1);
      const sy = wave(sx, t, 1); const slope = (wave(sx + 30, t, 1) - wave(sx - 30, t, 1)) / 60;
      // broadside to the sea the ship rolls (seen end-on it would roll; side-on we see the pitch shrink and the heave grow)
      const pitch = Math.atan(slope) * 57.3 * 0.42 * (1 - beam * 0.5) + beam * 7 * Math.sin(t * 1.9);
      const heel = sinkK * (o.sinkTilt == null ? 24 : o.sinkTilt) + (o.heel ? o.heel * (o.heelAt == null ? 1 : BTO.ep(t, o.heelAt, o.heelAt + 1.6, "inOut")) : 0);
      const depth = sinkK * (o.sunk ? 300 : 360); const shrink = 1 - beam * 0.18; // broadside: the hull shortens as she turns toward us
      g += sea(t, 0, "#203644", 0.95);
      g += `<g transform="translate(${n1(sx)} ${n1(sy + depth - 6)}) rotate(${n1(pitch + heel)}) scale(${n1(shrink)} 1)">${shipProfile(L, { profile: o.profile, lights: (o.lights == null ? 1 : o.lights) * (o.powerlessAt != null && t > o.powerlessAt ? 0.15 : 1) * (1 - sinkK), op: o.sunk ? 0.35 : 1 })}</g>`;
      if (o.rockAt != null) { const gk = BTO.ep(t, o.rockAt, o.rockAt + 0.7, "out"), s6 = L / 600;
        if (gk > 0) g += `<g transform="translate(${n1(sx)} ${n1(sy - 6)}) rotate(${n1(pitch + heel)})"><path d="M${n1(120 * s6)} ${n1(14 * s6)} l${n1(30 * s6 * gk)} ${n1(6 * s6)} l${n1(30 * s6 * gk)} ${n1(-5 * s6)} l${n1(30 * s6 * gk)} ${n1(7 * s6)} l${n1(30 * s6 * gk)} ${n1(-4 * s6)}" fill="none" stroke="${C.red || "#e0483e"}" stroke-width="7" stroke-linecap="round"/></g>`; }
      // spray burst over the bow
      if (o.hitAt != null && t >= o.hitAt && t < o.hitAt + 1.4) { const u = (t - o.hitAt) / 1.4; for (let i = 0; i < 26; i += 1) { const a = -1.9 + (i / 26) * 1.5, v = 260 + (i % 5) * 70;
        g += `<circle cx="${n1(sx + L * 0.4 + Math.cos(a) * v * u)}" cy="${n1(sy - 40 + Math.sin(a) * v * u + 420 * u * u)}" r="${n1(10 + (i % 4) * 5)}" fill="#dfe8ee" opacity="${n1(0.8 * (1 - u))}"/>`; } }
      g += sea(t, 1, "#16303e", o.sunk ? 0.72 : 0.92) + sea(t, 2, "#0f2531", 0.96);
      // the rock: a dark outcrop just breaking the surface under the bow section (drawn over the sea so it reads)
      if (o.rockAt != null) { const rx = X + L * 0.27, ry = wave(rx, t, 2); g += `<path d="M${n1(rx - 90)} ${n1(ry + 60)} L${n1(rx - 50)} ${n1(ry - 4)} L${n1(rx - 10)} ${n1(ry - 22)} L${n1(rx + 30)} ${n1(ry - 8)} L${n1(rx + 80)} ${n1(ry + 60)} Z" fill="#3a3530" stroke="#8a8078" stroke-width="3" stroke-linejoin="round"/>`; }
      // a sunk ship stays readable as a faint outline under the surface (the toll scene)
      if (o.sunk) g += `<g transform="translate(${n1(sx)} ${n1(sy + depth)}) rotate(${n1(heel)})" opacity="0.32">${shipProfile(L, { profile: o.profile, lights: 0, fill: "none" })}</g>`;
      // foam lines on the crests
      for (let x = -20; x < 1100; x += 60) { const y = wave(x, t, 2); g += `<path d="M${x} ${n1(y)} q15 -8 30 0" stroke="#cfe0ea" stroke-width="3" fill="none" opacity="0.35"/>`; }
      // bubbles once she is under
      if (sinkK > 0.25) for (let i = 0; i < 14; i += 1) { const u = ((t * 0.6 + i / 14) % 1); g += `<circle cx="${n1(sx - 120 + (i * 37) % 260)}" cy="${n1(sy + depth - u * 260)}" r="${n1(4 + (i % 3) * 3)}" fill="none" stroke="#cfe0ea" stroke-width="2" opacity="${n1(0.6 * (1 - u))}"/>`; }
      // rain
      if (o.storm || o.rain) drops.forEach((d) => { const y = ((d.y + t * d.v) % 2100) - 120; const x = d.x + y * 0.28; g += `<line x1="${n1(x)}" y1="${n1(y)}" x2="${n1(x + d.l * 0.28)}" y2="${n1(y + d.l)}" stroke="#9fb4c2" stroke-width="2" opacity="0.32"/>`; });
      return `<g opacity="${op.toFixed(3)}">${g}</g>`;
    } };
  });

  // ---- storm-track ----------------------------------------------------------------------------------------------
  // props: route [[x,y]...], track [[x,y]...] (world px inside the chart), from, to (times: both markers travel 0 -> 1),
  //   progress [p0, p1] (route/track fraction shown at from/to, default [0.15, 0.85]), stale { at, lag, label },
  //   detour { at, path [[x,y]...], label }, routeLabel, stormLabel, chart { x, y, w, h }, enterAt, outAt
  const along = (pts, k) => { const seg = []; let tot = 0; for (let i = 1; i < pts.length; i += 1) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); tot += d; }
    let rem = clamp(k) * tot; for (let i = 0; i < seg.length; i += 1) { if (rem <= seg[i] || i === seg.length - 1) { const f = seg[i] ? clamp(rem / seg[i]) : 0; return [lerp(pts[i][0], pts[i + 1][0], f), lerp(pts[i][1], pts[i + 1][1], f), Math.atan2(pts[i + 1][1] - pts[i][1], pts[i + 1][0] - pts[i][0])]; } rem -= seg[i]; } return [...pts[pts.length - 1], 0]; };
  const poly = (pts) => "M" + pts.map(([x, y]) => `${n1(x)} ${n1(y)}`).join(" L");
  const spiral = (x, y, rot, s, col, op) => { let g = `<g transform="translate(${n1(x)} ${n1(y)}) rotate(${n1(rot)}) scale(${n1(s)})" opacity="${n1(op)}">`;
    for (let i = 0; i < 3; i += 1) g += `<path d="M0 -14 C 40 -50 90 -30 96 20" transform="rotate(${i * 120})" fill="none" stroke="${col}" stroke-width="16" stroke-linecap="round"/>`;
    return g + `<circle r="16" fill="none" stroke="${col}" stroke-width="7"/></g>`; };
  const boat = (x, y, a, col) => `<g transform="translate(${n1(x)} ${n1(y)}) rotate(${n1(a * 57.3)})"><path d="M26 0 L-18 -14 L-12 0 L-18 14 Z" fill="${col}" stroke="#05090d" stroke-width="3"/></g>`;
  BTO.def("storm-track", (o) => {
    if (o.from != null) BTO.cue(o.from, "tick", 0.3); if (o.stale) BTO.cue(o.stale.at, "pluck", 0.4); if (o.detour) BTO.cue(o.detour.at, "lift", 0.4);
    return { draw: (t) => {
      const op = fade(t, o.enterAt, o.outAt); if (op <= 0) return ""; const C = P(); const ch = o.chart || { x: 90, y: 600, w: 900, h: 660 }; let g = "";
      g += `<rect x="${ch.x}" y="${ch.y}" width="${ch.w}" height="${ch.h}" rx="28" fill="#0b1e2b" stroke="${C.teal}" stroke-width="3" opacity="0.96"/>`;
      for (let i = 1; i < 6; i += 1) g += `<line x1="${ch.x + (ch.w * i) / 6}" y1="${ch.y + 10}" x2="${ch.x + (ch.w * i) / 6}" y2="${ch.y + ch.h - 10}" stroke="${C.teal}" stroke-width="1.5" opacity="0.18"/><line x1="${ch.x + 10}" y1="${ch.y + (ch.h * i) / 6}" x2="${ch.x + ch.w - 10}" y2="${ch.y + (ch.h * i) / 6}" stroke="${C.teal}" stroke-width="1.5" opacity="0.18"/>`;
      // a generic landmass at the chart's upper-left corner: context, not geography
      g += `<path d="M${ch.x} ${ch.y + 40} L${ch.x + 200} ${ch.y + 30} C${ch.x + 260} ${ch.y + 90} ${ch.x + 180} ${ch.y + 170} ${ch.x + 230} ${ch.y + 260} C${ch.x + 200} ${ch.y + 330} ${ch.x + 90} ${ch.y + 300} ${ch.x} ${ch.y + 360} Z" fill="#23362c" opacity="0.8"/>`;
      const [p0, p1] = o.progress || [0.15, 0.85]; const k = o.from == null ? p1 : lerp(p0, p1, BTO.ep(t, o.from, o.to == null ? o.from + 2.5 : o.to, "inOut"));
      const route = o.route || [[160, 1180], [420, 960], [640, 820], [900, 640]]; const track = o.track || [[960, 1190], [860, 1000], [720, 860], [560, 640]];
      const det = o.detour && t >= o.detour.at ? BTO.ep(t, o.detour.at, o.detour.at + 1.6, "inOut") : 0;
      // storm danger ring and track
      g += `<path d="${poly(track)}" fill="none" stroke="${C.coral}" stroke-width="5" stroke-dasharray="14 12" opacity="0.7"/>`;
      const [sx, sy] = along(track, k); const ring = 150 + 10 * Math.sin(t * 3);
      // hit: the ship inside the ring
      const shipPath = det > 0 ? o.detour.path : route; const [bx, by, ba] = along(shipPath, det > 0 ? det * 0.95 : k);
      const inside = Math.hypot(bx - sx, by - sy) < ring;
      g += `<circle cx="${n1(sx)}" cy="${n1(sy)}" r="${n1(ring)}" fill="${C.coral}" opacity="${inside ? 0.28 : 0.13}"/><circle cx="${n1(sx)}" cy="${n1(sy)}" r="${n1(ring)}" fill="none" stroke="${C.coral}" stroke-width="${inside ? 6 : 3}" opacity="0.8"/>`;
      // stale forecast: a ghost storm where the old data put it
      if (o.stale && t >= o.stale.at) { const sk = clamp((t - o.stale.at) / 0.6); const [gx, gy] = along(track, Math.max(0, k - (o.stale.lag || 0.3)));
        g += spiral(gx, gy, -t * 90, 0.9, C.muted, 0.7 * sk) + `<circle cx="${n1(gx)}" cy="${n1(gy)}" r="120" fill="none" stroke="${C.muted}" stroke-width="3" stroke-dasharray="10 10" opacity="${n1(0.7 * sk)}"/>`;
        g += `<line x1="${n1(gx)}" y1="${n1(gy)}" x2="${n1(lerp(gx, sx, 0.8))}" y2="${n1(lerp(gy, sy, 0.8))}" stroke="${C.amber}" stroke-width="5" stroke-dasharray="4 10" opacity="${n1(sk)}"/>`;
        if (o.stale.label) g += BTO.label(gx, gy + 40, 540, Math.min(gy + 190, 1220), o.stale.label, clamp(sk * 1.4 - 0.2), { size: LBL(), pill: true, color: C.muted, anchor: "middle" }); }
      g += spiral(sx, sy, -t * 120, 1.1, C.coral, 1);
      // route: the planned line (dimmed when a detour replaces it), the travelled part bright
      g += `<path d="${poly(route)}" fill="none" stroke="${C.amber}" stroke-width="5" stroke-dasharray="3 12" stroke-linecap="round" opacity="${n1(0.75 - det * 0.45)}"/>`;
      if (det <= 0) { const n = 40; const pts = Array.from({ length: n + 1 }, (_, i) => along(route, (k * i) / n)); g += `<path d="${poly(pts)}" fill="none" stroke="${C.amber}" stroke-width="7"/>`; }
      if (det > 0) g += BTO.draw(poly(o.detour.path), det, { stroke: C.teal, width: 8 });
      g += boat(bx, by, ba, det > 0 ? C.teal : C.amber);
      if (o.routeLabel) g += BTO.label(bx, by, bx - 40, by + 110, o.routeLabel, clamp((t - (o.from || 0)) / 0.5), { size: LBL(), pill: true, color: C.amber, anchor: "end" });
      if (o.stormLabel) g += BTO.label(sx + ring * 0.7, sy - ring * 0.7, sx + ring * 0.7 + 20, sy - ring - 50, o.stormLabel, clamp((t - (o.from || 0) - 0.3) / 0.5), { size: LBL(), pill: true, color: C.coral, anchor: sx > 600 ? "end" : "start" });
      if (o.detour && o.detour.label && det > 0.4) { const [lx, ly] = along(o.detour.path, 0.5); g += BTO.label(lx, ly, lx + 30, ly - 120, o.detour.label, clamp(det * 2 - 0.8), { size: LBL(), pill: true, color: C.teal, anchor: lx > 600 ? "end" : "start" }); }
      return `<g opacity="${op.toFixed(3)}">${g}</g>`;
    } };
  });

  // ---- hull-section ---------------------------------------------------------------------------------------------
  // props: x, y (waterline centre), floodAt, floodDur, listTo (deg, illustrative), side (1 = starboard/right, -1 left),
  //   label { at, text } (where the water comes in), listLabel (inclinometer caption), enterAt, outAt
  BTO.def("hull-section", (o) => {
    if (o.floodAt != null) { BTO.cue(o.floodAt, "whoosh", 0.5); BTO.cue(o.floodAt + 0.4, "drop", 0.35); }
    const X = o.x || 540, Y = o.y || 900, side = o.side === -1 ? -1 : 1;
    return { draw: (t) => {
      const op = fade(t, o.enterAt, o.outAt); if (op <= 0) return ""; const C = P(); let g = "";
      const f = o.floodAt == null ? 0 : BTO.ep(t, o.floodAt, o.floodAt + (o.floodDur || 3.2), "inOut");
      const ang = side * (o.listTo == null ? 16 : o.listTo) * f + 1.6 * Math.sin(t * 1.3);
      // hull cross-section (half breadth 300, depth 360 below the main deck at y = -150)
      const hull = `M-300 -150 L300 -150 L300 120 C300 200 250 210 180 210 L-180 210 C-250 210 -300 200 -300 120 Z`;
      // the flooded hold is the one on the low side; water inside stays level with the horizon (counter-rotated)
      const hx0 = side > 0 ? 20 : -280, hw = 260, ht = -120, hb = 190;
      const level = lerp(hb, ht + 40, f);
      g += `<defs><clipPath id="hsHold"><rect x="${hx0}" y="${ht}" width="${hw}" height="${hb - ht}"/></clipPath><linearGradient id="hsSea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c4256"/><stop offset="1" stop-color="#081822"/></linearGradient></defs>`;
      // sky band and sea: the sea surface is level; the ship is what tilts
      g += `<rect x="-40" y="${Y - 700}" width="1160" height="700" fill="#0d1b25"/>`;
      let ship = `<path d="${hull}" fill="#1c2b36" stroke="${C.text}" stroke-width="6"/>`;
      ship += `<path d="M-300 -150 L-300 -230 L-120 -230 L-120 -150 M120 -150 L120 -230 L300 -230 L300 -150" fill="#26394a" stroke="${C.text}" stroke-width="4"/>`;
      // decks and bulkheads
      ship += `<line x1="-300" y1="${ht - 4}" x2="300" y2="${ht - 4}" stroke="${C.muted}" stroke-width="4"/><line x1="0" y1="${ht}" x2="0" y2="${hb}" stroke="${C.muted}" stroke-width="5"/><line x1="-300" y1="40" x2="-20" y2="40" stroke="${C.muted}" stroke-width="3" opacity="0.6"/>`;
      // water in the hold: a level surface in world space, so inside the rotated hull it is drawn rotated back by -ang
      ship += `<g clip-path="url(#hsHold)"><g transform="rotate(${n1(-ang)} ${hx0 + hw / 2} ${level})"><rect x="${hx0 - 200}" y="${n1(level)}" width="${hw + 400}" height="600" fill="#2d6f8e" opacity="0.85"/><path d="M${hx0 - 200} ${n1(level)} q40 -10 80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0" stroke="#bfe3f2" stroke-width="3" fill="none" opacity="0.7"/></g></g>`;
      ship += `<rect x="${hx0}" y="${ht}" width="${hw}" height="${hb - ht}" fill="none" stroke="${f > 0.05 ? C.coral : C.muted}" stroke-width="${f > 0.05 ? 5 : 3}" opacity="0.9"/>`;
      // the opening in the side shell above the hold and the inflow
      const ox = side * 300, oy = -100;
      ship += `<rect x="${ox - 14}" y="${oy - 22}" width="28" height="44" rx="6" fill="#05090d" stroke="${C.amber}" stroke-width="5"/>`;
      if (f > 0 && f < 0.98) for (let i = 0; i < 9; i += 1) { const u = ((t * 1.6 + i / 9) % 1); const px = ox - side * (20 + u * 170), py = oy + u * u * (level - oy);
        ship += `<circle cx="${n1(px)}" cy="${n1(py)}" r="${n1(9 - u * 4)}" fill="#8fd0ea" opacity="${n1(0.9 * (1 - u * 0.5))}"/>`; }
      g += `<g transform="translate(${X} ${Y}) rotate(${n1(ang)})">${ship}</g>`;
      // the sea in front, level, with a moving surface
      let d = `M-40 ${Y + 10}`; for (let x = -40; x <= 1120; x += 30) d += ` L${x} ${n1(Y + 10 + 9 * Math.sin(x * 0.02 - t * 2.2))}`;
      g += `<path d="${d} L1120 ${Y + 520} L-40 ${Y + 520} Z" fill="url(#hsSea)" opacity="0.88"/>`;
      // inclinometer: a pendulum that stays vertical while its dial tilts with the ship
      const ix = X - side * 270, iy = Y - 360;
      g += `<g transform="translate(${ix} ${iy})"><g transform="rotate(${n1(ang)})"><path d="M-90 0 A90 90 0 0 0 90 0" fill="#0b1e2b" stroke="${C.text}" stroke-width="4"/>`;
      for (let a = -60; a <= 60; a += 15) g += `<line x1="${n1(Math.sin(a / 57.3) * 78)}" y1="${n1(Math.cos(a / 57.3) * 78)}" x2="${n1(Math.sin(a / 57.3) * 90)}" y2="${n1(Math.cos(a / 57.3) * 90)}" stroke="${C.text}" stroke-width="${a ? 2 : 4}"/>`;
      g += `</g><line x1="0" y1="0" x2="0" y2="84" stroke="${f > 0.3 ? C.coral : C.amber}" stroke-width="6"/><circle r="9" fill="${C.text}"/></g>`;
      // the caption sits above the dial's pivot, clear of the heeling hull (#416 review: the hull covered "LIST")
      if (o.listLabel) g += BTO.text(ix, iy - 36, o.listLabel, { size: LBL(), weight: 800, ls: 2, fill: C.text, op: clamp(f * 3) });
      if (o.label) { const k = clamp((t - o.label.at) / 0.5); const a = ang / 57.3; const wx = X + Math.cos(a) * ox - Math.sin(a) * oy, wy = Y + Math.sin(a) * ox + Math.cos(a) * oy;
        g += BTO.label(wx, wy, wx + side * 20, wy - 200, o.label.text, k, { size: LBL(), pill: true, color: C.amber, anchor: side > 0 ? "end" : "start" }); }
      return `<g opacity="${op.toFixed(3)}">${g}</g>`;
    } };
  });

  // ---- propulsion -----------------------------------------------------------------------------------------------
  // props: stopAt, label (dial caption, e.g. "OIL PRESSURE"), stateLabel { at, text } (e.g. the chain's "PROPULSION LOST"),
  //   enterAt, outAt
  BTO.def("propulsion", (o) => {
    if (o.stopAt != null) { BTO.cue(o.stopAt - 0.3, "tick", 0.4); BTO.cue(o.stopAt, "drop", 0.55); }
    return { draw: (t) => {
      const op = fade(t, o.enterAt, o.outAt); if (op <= 0) return ""; const C = P(); let g = "";
      const stop = o.stopAt == null ? 0 : BTO.ep(t, o.stopAt, o.stopAt + 2.2, "decelerate");
      const pres = o.stopAt == null ? 1 : 1 - BTO.ep(t, o.stopAt - 0.6, o.stopAt + 0.3, "inOut");
      // propeller angle: integral of a speed that falls to zero after stopAt
      const w0 = 9; const T0 = o.stopAt == null ? t : Math.min(t, o.stopAt); const D = 2.2;
      const spinAng = w0 * T0 + (o.stopAt != null && t > o.stopAt ? w0 * (Math.min(t - o.stopAt, D) - Math.min(t - o.stopAt, D) ** 2 / (2 * D)) : 0);
      // stern in cutaway (water below y 1000)
      g += `<rect x="-40" y="420" width="1160" height="560" fill="#0d1b25"/><rect x="-40" y="980" width="1160" height="500" fill="#0c2533"/>`;
      g += `<path d="M-40 700 L760 700 C860 700 900 760 920 860 L960 1000 L-40 1000 Z" fill="#1c2b36" stroke="${C.text}" stroke-width="5"/>`;
      g += `<line x1="-40" y1="980" x2="1120" y2="980" stroke="#5f8ea4" stroke-width="3" opacity="0.6"/>`;
      // engine block with a status light
      const live = 1 - stop; g += `<rect x="130" y="760" width="300" height="190" rx="18" fill="#2c3f4e" stroke="${C.text}" stroke-width="4"/>`;
      for (let i = 0; i < 4; i += 1) g += `<rect x="${158 + i * 66}" y="730" width="44" height="40" rx="6" fill="#3a5162" stroke="${C.text}" stroke-width="3"/>`;
      g += `<circle cx="400" cy="790" r="16" fill="${live > 0.5 ? C.teal : C.coral}" opacity="${n1(0.4 + 0.6 * (live > 0.5 ? live : 1 - live * 0.5 + 0.2 * Math.sin(t * 12)))}"/>`;
      // shaft and propeller (seen three-quarter: blades as ellipses rotating about the shaft axis)
      g += `<rect x="430" y="842" width="510" height="22" fill="#8a9aa6" stroke="${C.text}" stroke-width="3"/>`;
      g += `<g transform="translate(950 853)">`; for (let i = 0; i < 4; i += 1) { const a = spinAng + (i * Math.PI) / 2; const ry = Math.abs(Math.cos(a)) * 110 + 14; const yy = Math.sin(a) * 70;
        g += `<ellipse cx="0" cy="${n1(yy * 0.4)}" rx="22" ry="${n1(ry * 0.55)}" transform="rotate(${n1(Math.sin(a) * 28)})" fill="#c49a52" stroke="${C.text}" stroke-width="3" opacity="0.95"/>`; }
      g += `<circle r="26" fill="#9a7a40" stroke="${C.text}" stroke-width="3"/></g>`;
      // wake bubbles behind the propeller fade as it stops
      for (let i = 0; i < 18; i += 1) { const u = ((t * 1.4 + i / 18) % 1); g += `<circle cx="${n1(990 + u * 140)}" cy="${n1(853 + Math.sin(i * 2.1) * 60 * u)}" r="${n1(5 + (i % 3) * 3)}" fill="none" stroke="#cfe0ea" stroke-width="2" opacity="${n1(0.6 * (1 - u) * live)}"/>`; }
      // oil-pressure dial above (no digits; a red low zone)
      const dx = 300, dy = 560; g += `<circle cx="${dx}" cy="${dy}" r="120" fill="#0b1e2b" stroke="${C.text}" stroke-width="5"/>`;
      g += `<path d="M${n1(dx - 104)} ${n1(dy + 60)} A120 120 0 0 1 ${n1(dx - 60)} ${n1(dy - 104)}" fill="none" stroke="${C.coral}" stroke-width="14" opacity="0.9"/>`;
      for (let a = -120; a <= 120; a += 30) g += `<line x1="${n1(dx + Math.sin(a / 57.3) * 92)}" y1="${n1(dy - Math.cos(a / 57.3) * 92)}" x2="${n1(dx + Math.sin(a / 57.3) * 112)}" y2="${n1(dy - Math.cos(a / 57.3) * 112)}" stroke="${C.text}" stroke-width="3"/>`;
      const na = (-120 + 200 * pres + 3 * Math.sin(t * 9) * pres) / 57.3; g += `<line x1="${dx}" y1="${dy}" x2="${n1(dx + Math.sin(na) * 98)}" y2="${n1(dy - Math.cos(na) * 98)}" stroke="${pres < 0.3 ? C.coral : C.amber}" stroke-width="8" stroke-linecap="round"/><circle cx="${dx}" cy="${dy}" r="12" fill="${C.text}"/>`;
      if (o.label) g += BTO.text(dx + 150, dy + 14, o.label, { size: LBL() + 4, weight: 800, ls: 2, anchor: "start", fill: C.text });
      if (o.stateLabel && t >= o.stateLabel.at) g += BTO.label(950, 760, 900, 1120, o.stateLabel.text, clamp((t - o.stateLabel.at) / 0.5), { size: LBL(), pill: true, color: C.coral, anchor: "end" });
      return `<g opacity="${op.toFixed(3)}">${g}</g>`;
    } };
  });
})(window.BTO);
