// Premium studio - football atmosphere and physics models (GoalLore Lab profile; original drawings, no footage).
//   stadium  night sky, stand tiers in silhouette, a seeded crowd texture with a few phone lights, floodlight towers
//            whose beams ramp on. Use it as a WORLD layer under a pitch (screen layers are drawn above world layers). Generic: no club, crest, sponsor or real ground.
//   airflow  air flowing past a spinning ball, in the ball's frame: the textbook 2D potential-flow model of a rotating
//            cylinder (uniform flow + doublet + circulation). Tracers move at the model's local speed, so the faster
//            side is visibly faster; the lift arrow is the Kutta-Joukowski direction. It is a MODEL (2D, inviscid): the
//            scene must carry the modelLabel chip and never present its speeds as measurements.
(function (BTO) {
  "use strict";
  const { clamp, lerp } = BTO;

  BTO.def("stadium", (o) => {
    const C = BTO.style.palette; const r = BTO.rng(o.seed || 7); const W = o.w || 1080, H = o.h || 1920, x0 = o.x || 0, y0 = o.y || 0;
    const hz = o.horizonY == null ? 900 : o.horizonY; // where the far touchline meets the stands
    // stand tiers: jagged silhouettes stepping up from the horizon, fixed at construction (deterministic)
    const tiers = []; for (let i = 0; i < (o.tiers || 3); i += 1) { const top = hz - 90 - i * 120 - r() * 20; const pts = [];
      for (let x = -40; x <= W + 40; x += 60) pts.push([x, top + Math.sin(x / 140 + i) * 10 + r() * 6]); tiers.push({ top, pts, shade: i }); }
    const crowd = []; for (let i = 0; i < (o.crowd || 900); i += 1) { const tr = tiers[Math.floor(r() * tiers.length)]; crowd.push({ x: r() * W, y: tr.top + 14 + r() * 100, s: 2 + r() * 3, c: r(), ph: r() * 6.28, phone: r() < 0.025 }); }
    const towers = o.towers || [[120, hz - 520], [960, hz - 540]];
    return { draw: (t) => {
      const lit = o.lightsOnAt == null ? 1 : BTO.ease("decelerate", clamp((t - o.lightsOnAt) / (o.lightsDur || 0.8)));
      let g = `<defs><linearGradient id="stSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#03070a"/><stop offset="0.7" stop-color="${C.desk2 || "#13241b"}"/><stop offset="1" stop-color="${C.lamp || "#1d3a2a"}"/></linearGradient>`
        + `<radialGradient id="stBeam" cx="0.5" cy="0" r="1"><stop offset="0" stop-color="#fff6d8" stop-opacity="0.55"/><stop offset="1" stop-color="#fff6d8" stop-opacity="0"/></radialGradient></defs>`;
      g += `<rect x="${x0}" y="${y0}" width="${W}" height="${hz + 40}" fill="url(#stSky)"/>`;
      // beams under the stands so the tiers cut them
      if (lit > 0) for (const [tx, ty] of towers) { const ax = lerp(tx, W / 2, 0.55), spread = 260;
        g += `<path d="M${x0 + tx - 20} ${y0 + ty} L${x0 + ax - spread} ${y0 + hz + 200} L${x0 + ax + spread} ${y0 + hz + 200} L${x0 + tx + 20} ${y0 + ty}Z" fill="url(#stBeam)" opacity="${(0.55 * lit * (o.beamOpacity == null ? 1 : o.beamOpacity)).toFixed(3)}"/>`; }
      tiers.slice().reverse().forEach((tr) => { const sh = BTO.mixColor ? BTO.mixColor("#020504", C.desk2 || "#13241b", 0.25 + tr.shade * 0.2) : "#060b08";
        g += `<path d="M${x0 - 40} ${y0 + hz + 40}L${tr.pts.map((q) => `${(x0 + q[0]).toFixed(1)} ${(y0 + q[1]).toFixed(1)}`).join("L")}L${x0 + W + 40} ${y0 + hz + 40}Z" fill="${sh}"/>`; });
      // crowd texture: muted dots lit by the floodlights; phones twinkle slowly (closed form in t)
      let dots = ""; for (const d of crowd) { if (d.y > hz + 30) continue; const tw = d.phone ? 0.5 + 0.5 * Math.sin(t * 2.2 + d.ph) : 0;
        const col = d.phone ? "#fff8e0" : d.c < 0.3 ? C.coral : d.c < 0.55 ? C.teal : "#c9c2b0"; const op = d.phone ? 0.35 + 0.6 * tw : (0.12 + 0.28 * lit) * (0.6 + 0.4 * d.c);
        dots += `<circle cx="${(x0 + d.x).toFixed(1)}" cy="${(y0 + d.y).toFixed(1)}" r="${(d.phone ? 2.4 : d.s).toFixed(1)}" fill="${col}" opacity="${op.toFixed(3)}"/>`; }
      g += `<g data-decor="1">${dots}</g>`;
      // towers and lamp banks
      for (const [tx, ty] of towers) { g += `<rect x="${x0 + tx - 5}" y="${y0 + ty}" width="10" height="${hz - ty}" fill="#050807"/>`;
        g += `<rect x="${x0 + tx - 46}" y="${y0 + ty - 34}" width="92" height="40" rx="4" fill="#0b0f0d"/>`;
        for (let i = 0; i < 8; i += 1) g += `<circle cx="${x0 + tx - 36 + (i % 4) * 24}" cy="${y0 + ty - 24 + Math.floor(i / 4) * 20}" r="7" fill="#fff6d8" opacity="${(0.15 + 0.85 * lit).toFixed(3)}"/>`;
        if (lit > 0) g += `<circle cx="${x0 + tx}" cy="${y0 + ty - 14}" r="120" fill="url(#stBeam)" opacity="${(0.5 * lit).toFixed(3)}"/>`; }
      // haze band on the horizon
      g += `<rect x="${x0}" y="${y0 + hz - 30}" width="${W}" height="70" fill="#fff6d8" opacity="${(0.05 * lit).toFixed(3)}"/>`;
      return g;
    } };
  });

  // complex velocity of the rotating-cylinder model, ball frame, maths axes (y up):
  //   conj(V) = U (1 - R^2 / z^2) + i G / (2 pi z),  G = 4 pi U R g  (g in [0, 1): stagnation points stay on the ball)
  const vel = (x, y, U, R, g) => { const r2 = x * x + y * y; const R2 = R * R; const zx = (x * x - y * y) / (r2 * r2), zy = (-2 * x * y) / (r2 * r2); // 1/z^2
    const G = 4 * Math.PI * U * R * g; const ix = x / r2, iy = -y / r2; // 1/z
    const cu = U * (1 - R2 * zx), cv = U * (-R2 * zy); const gu = -G / (2 * Math.PI) * iy, gv = G / (2 * Math.PI) * ix; // i*G/(2 pi) * (1/z)
    return [cu + gu, -(cv + gv)]; };
  BTO.flowVelocity = vel;

  BTO.def("airflow", (o) => {
    const C = BTO.style.palette; const cx = o.x || 540, cy = o.y || 800, R = o.R || 150, U0 = o.U || 260; const W = o.w || 1000, H = o.h || 900;
    // slowKeys: the air speed (= ball speed) as a fraction of U, e.g. drag slowing the ball. The spin is unchanged, so the
    // circulation ratio g = G / (4 pi U R) grows as U falls (clamped below 0.95: stagnation points stay on the ball).
    const fAt = (t) => (o.slowKeys ? BTO.keys(t, o.slowKeys, "inOut") : 1);
    const gAt = (t) => (o.clockwise === false ? -1 : 1) * Math.min(0.95, (o.spinKeys ? BTO.keys(t, o.spinKeys, "inOut") : o.spin || 0) / fAt(t)); // clockwise = faster on top
    const seeds = []; const n = o.lines || 15; for (let i = 0; i < n; i += 1) { const y = lerp(-H / 2 + 30, H / 2 - 30, (i + 0.5) / n); if (Math.abs(y) > R * 0.12) seeds.push(y); }
    // trace one streamline from the left edge; samples carry the model time so tracers move at the local speed
    const trace = (y0, g, U) => { let x = -W / 2, y = y0, tm = 0; const pts = [[x, y, 0]]; const ds = 6;
      for (let i = 0; i < 600 && x < W / 2; i += 1) { const [u, v] = vel(x, y, U, R, g); const sp = Math.hypot(u, v) || 1e-6; if (sp < 2) break;
        x += ds * u / sp; y += ds * v / sp; tm += ds / sp; if (x * x + y * y < R * R * 1.02) break; pts.push([x, y, tm]); } return pts; };
    if (o.forceAt != null) BTO.cue(o.forceAt, "pop", 0.45);
    if (o.spinKeys) BTO.cue(o.spinKeys[1][0], "whoosh", 0.4);
    return { draw: (t) => {
      const op = (o.enterAt == null ? 1 : clamp((t - o.enterAt) / 0.4)) * (o.outAt == null ? 1 : 1 - clamp((t - o.outAt) / 0.35)); if (op <= 0) return "";
      const g = gAt(t); const U = U0 * fAt(t); const S = (x, y) => [cx + x, cy - y]; let s = "";
      s += `<clipPath id="afClip"><rect x="${cx - W / 2}" y="${cy - H / 2}" width="${W}" height="${H}" rx="24"/></clipPath><g clip-path="url(#afClip)">`;
      s += `<rect x="${cx - W / 2}" y="${cy - H / 2}" width="${W}" height="${H}" fill="${C.desk}" opacity="0.92"/>`;
      // faint pressure tint: model speed squared relative to U (Bernoulli), sampled on a coarse grid; low pressure = amber
      if (o.pressure !== false) for (let gx = -W / 2 + 25; gx < W / 2; gx += 50) for (let gy = -H / 2 + 25; gy < H / 2; gy += 50) { if (gx * gx + gy * gy < R * R) continue;
        const [u, v] = vel(gx, gy, U, R, g); const cp = 1 - (u * u + v * v) / (U * U); const k = clamp(-cp / 2.5); if (k < 0.04) continue; const [sx, sy] = S(gx, gy);
        s += `<rect x="${(sx - 25).toFixed(1)}" y="${(sy - 25).toFixed(1)}" width="50" height="50" fill="${C.amber}" opacity="${(0.22 * k).toFixed(3)}"/>`; }
      const lines = seeds.map((y0) => trace(y0, g, U)); const tt = (t - (o.enterAt || 0)) * (o.timeScale || 1);
      for (const L of lines) { if (L.length < 3) continue; s += `<path d="M${L.filter((_, i) => i % 3 === 0).map((q) => S(q[0], q[1])).map((q) => `${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join("L")}" fill="none" stroke="${C.paper}" stroke-width="2" opacity="0.18"/>`;
        // tracers: evenly spaced in model time along the line, each a short streak 0.06 model-seconds long
        const T = L[L.length - 1][2]; const gap = o.tracerGap || 0.45; for (let ph = (tt % gap); ph < T; ph += gap) { const seg = L.filter((q) => q[2] >= ph - 0.06 && q[2] <= ph);
          if (seg.length < 2) continue; s += `<path d="M${seg.map((q) => S(q[0], q[1])).map((q) => `${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join("L")}" fill="none" stroke="${C.paper}" stroke-width="5" stroke-linecap="round" opacity="0.85"/>`; } }
      s += "</g>";
      // the ball: seam turns with the spin, spin arrow around it
      const rot = o.spinKeys ? (t - o.spinKeys[0][0]) * 140 * g : 0;
      s += `<g transform="translate(${cx} ${cy})"><circle r="${R}" fill="#f7f5ee" stroke="${C.ink}" stroke-width="3"/><g transform="rotate(${rot.toFixed(1)})"><path d="M${-R * 0.9} 0 Q0 ${-R * 0.55} ${R * 0.9} 0 M${-R * 0.5} ${R * 0.75} Q0 ${R * 0.35} ${R * 0.5} ${R * 0.75}" stroke="${C.ink}" stroke-width="6" fill="none"/></g></g>`;
      if (Math.abs(g) > 0.02) { const ag = Math.abs(g); const a0 = -0.85 * Math.PI, a1 = -0.15 * Math.PI, rr = R + 34; const pts = []; for (let i = 0; i <= 20; i += 1) { const a = lerp(a0, a1, i / 20); pts.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a)]); }
        const e = pts[pts.length - 1]; s += `<path d="M${pts.map((q) => `${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join("L")}" fill="none" stroke="${C.amber}" stroke-width="8" stroke-linecap="round" opacity="${clamp(ag * 3).toFixed(3)}"/><path d="M${e[0] - 4} ${e[1] - 22} L${e[0] + 20} ${e[1] + 6} L${e[0] - 14} ${e[1] + 14}Z" fill="${C.amber}" opacity="${clamp(ag * 3).toFixed(3)}"/>`; }
      // lift: perpendicular to the oncoming air, towards the faster (low-pressure) side
      if (o.forceAt != null && t >= o.forceAt) { const k = BTO.sp(t, o.forceAt, "snap"); const len = (o.forceLen || 260) * k; const dir = o.clockwise === false ? 1 : -1;
        s += `<path d="M${cx} ${cy + dir * (R + 20)} L${cx} ${cy + dir * (R + 20 + len)}" stroke="${C.coral}" stroke-width="14" stroke-linecap="round"/><path d="M${cx - 30} ${cy + dir * (R + len)} L${cx} ${cy + dir * (R + 46 + len)} L${cx + 30} ${cy + dir * (R + len)}Z" fill="${C.coral}"/>`; }
      // drag: along the oncoming air (the ball is slowed), length grows with the speed squared
      if (o.dragAt != null && t >= o.dragAt) { const k = clamp((t - o.dragAt) / 0.4) * fAt(t) ** 2; const len = (o.dragLen || 200) * k;
        s += `<path d="M${cx + R + 20} ${cy} L${(cx + R + 20 + len).toFixed(1)} ${cy}" stroke="${C.teal}" stroke-width="12" stroke-linecap="round" opacity="${clamp(k * 4).toFixed(3)}"/><path d="M${(cx + R + 14 + len).toFixed(1)} ${cy - 24} L${(cx + R + 44 + len).toFixed(1)} ${cy} L${(cx + R + 14 + len).toFixed(1)} ${cy + 24}Z" fill="${C.teal}" opacity="${clamp(k * 4).toFixed(3)}"/>`; }
      // gauges: conceptual bars (no numbers) under the box, e.g. SPEED falling while SPIN stays
      (o.gauges || []).forEach((gg, i) => { if (gg.at != null && t < gg.at) return; const k = clamp((t - (gg.at || 0)) / 0.3); const v = BTO.keys(t, gg.keys, "inOut"); const gy = cy + H / 2 + 60 + i * 74, gx = cx - W / 2 + 40, gw = W - 80;
        s += `<g opacity="${k.toFixed(3)}">${BTO.text(gx, gy + 13, gg.label, { size: 36, weight: 800, anchor: "start", fill: C.text, ls: 2 })}<rect x="${gx + 230}" y="${gy - 18}" width="${gw - 230}" height="30" rx="15" fill="${C.desk2 || "#13241b"}" stroke="${C.muted}" stroke-width="2"/><rect x="${gx + 230}" y="${gy - 18}" width="${((gw - 230) * clamp(v)).toFixed(1)}" height="30" rx="15" fill="${(gg.color && C[gg.color]) || C.amber}"/></g>`; });
      return `<g opacity="${op.toFixed(3)}">${s}</g>`;
    } };
  });

  // dot-board: an original LED dot-matrix board (stadium scoreboard look) for dates, places and fixtures. 5x7 glyphs;
  // rows light up column by column from their `at`; unlit dots stay faintly visible.
  const FONT = { A: "0E11111F111111", B: "1E11111E11111E", C: "0E11101010110E", D: "1E11111111111E", E: "1F10101E10101F", F: "1F10101E101010", G: "0E1110171111 0F", H: "1111111F111111", I: "0E04040404040E", J: "0702020202120C", K: "11121418141211", L: "1010101010101F", M: "111B1515111111", N: "1111191513111111", O: "0E11111111110E", P: "1E11111E101010", Q: "0E111111151209 ", R: "1E11111E141211", S: "0F10100E01011E", T: "1F040404040404", U: "1111111111110E", V: "11111111110A04", W: "11111115151B11", X: "11110A040A1111", Y: "11110A04040404", Z: "1F01020408101F", 0: "0E11131519110E", 1: "040C040404040E", 2: "0E11010204081F", 3: "1F02040201110E", 4: "02060A121F0202", 5: "1F101E0101110E", 6: "0608101E11110E", 7: "1F010204080808", 8: "0E11110E11110E", 9: "0E11110F01020C", "-": "0000001F000000", ".": "00000000000C0C", "·": "00000004000000", ":": "000C0C000C0C00", "'": "04040800000000", " ": "00000000000000" };
  const glyph = (ch) => { const h = (FONT[ch] || FONT[" "]).replace(/\s/g, "").padEnd(14, "0").slice(0, 14); return Array.from({ length: 7 }, (_, r) => parseInt(h.slice(r * 2, r * 2 + 2), 16)); };
  BTO.def("dot-board", (o) => {
    const C = BTO.style.palette; (o.rows || []).forEach((r) => BTO.cue(r.at, "tick", 0.35));
    return { draw: (t) => {
      const op = (o.enterAt == null ? 1 : clamp((t - o.enterAt) / 0.3)) * (o.outAt == null ? 1 : 1 - clamp((t - o.outAt) / 0.3)); if (op <= 0) return "";
      const rows = o.rows || []; const cols = Math.max(...rows.map((r) => r.text.length)) * 6 - 1;
      // the board always fits the frame (maxW, default 960 px): long rows shrink the dots (#364 review: the 1986 board ran off screen)
      const k0 = Math.min(1, ((o.maxW || 960) - 60) / (cols * ((o.dot || 14) + (o.gap || 4)))); const d = (o.dot || 14) * k0, gap = (o.gap || 4) * k0, pitch = d + gap;
      const W = cols * pitch + 60, H = rows.length * 8 * pitch + 40; const x0 = (o.x || 540) - W / 2, y0 = (o.y || 800) - H / 2;
      let g = `<rect x="${x0}" y="${y0}" width="${W}" height="${H}" rx="16" fill="#060807" stroke="#20261f" stroke-width="6" filter="url(#shadow)"/>`; let on = "", off = "";
      rows.forEach((r, ri) => { const txt = r.text.toUpperCase(); const lit = r.at == null ? cols : (t - r.at) * (r.speed || 60); const col = (r.color && C[r.color]) || r.color || C.amber;
        const pad = Math.floor((cols - (txt.length * 6 - 1)) / 2);
        for (let ci = 0; ci < txt.length; ci += 1) { const G = glyph(txt[ci]); for (let y = 0; y < 7; y += 1) for (let x = 0; x < 5; x += 1) { const c = pad + ci * 6 + x;
          const cx2 = x0 + 30 + c * pitch + d / 2, cy2 = y0 + 20 + (ri * 8 + y) * pitch + d / 2; const isOn = (G[y] >> (4 - x)) & 1;
          if (isOn && c < lit) on += `<circle cx="${cx2.toFixed(1)}" cy="${cy2.toFixed(1)}" r="${(d / 2).toFixed(1)}" fill="${col}"/>`; else off += `<circle cx="${cx2.toFixed(1)}" cy="${cy2.toFixed(1)}" r="${(d / 2).toFixed(1)}" fill="#1a1f1a"/>`; } } });
      g += `<g data-decor="1">${off}</g><g data-decor="1" filter="url(#soft)" opacity="0.55">${on}</g><g data-decor="1">${on}</g>`;
      return `<g opacity="${op.toFixed(3)}">${g}</g>`;
    } };
  });

  // spiral-plot: top view of a ball's horizontal path under drag (decelerates) and Magnus (sideways, proportional to
  // spin x speed) with the spin held constant: curvature = k_m * spin / speed grows as it slows, so the path spirals
  // (the 'spinning ball spiral'). The first `kickLen` metres are drawn solid (the part a real kick flies), the rest
  // dashed (where the model continues); osculating circles show the radius shrinking. A MODEL: label the scene so.
  BTO.def("spiral-plot", (o) => {
    const C = BTO.style.palette; const kd = o.drag || 0.012, km = o.magnus || 0.02, w = o.spin || 60; let x = 0, y = 0, vx = 0, vy = -(o.speed || 30); const pts = [[0, 0, 0]]; let dist = 0;
    for (let i = 0; i < 20000; i += 1) { const dt = 0.004; const sp = Math.hypot(vx, vy); if (sp < (o.minSpeed || 1.5)) break;
      const ax = -kd * sp * vx + km * w * vy, ay = -kd * sp * vy - km * w * vx; vx += ax * dt; vy += ay * dt; const nx = x + vx * dt, ny = y + vy * dt; dist += Math.hypot(nx - x, ny - y); x = nx; y = ny; if (i % 5 === 0) pts.push([x, y, dist, sp]); }
    const xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]); const bx = [Math.min(...xs), Math.max(...xs)], by = [Math.min(...ys), Math.max(...ys)];
    const box = o.box || { x: 110, y: 380, w: 860, h: 860 }; const sc = Math.min(box.w / (bx[1] - bx[0]), box.h / (by[1] - by[0])) * 0.88;
    const S = (q) => [box.x + box.w / 2 + (q[0] - (bx[0] + bx[1]) / 2) * sc, box.y + box.h / 2 + (q[1] - (by[0] + by[1]) / 2) * sc];
    const total = pts[pts.length - 1][2]; const kickLen = o.kickLen || 35;
    BTO.geo[o.id || "spiral"] = { at: (u) => S(pts[Math.min(pts.length - 1, Math.floor(u * (pts.length - 1)))]), kickEnd: () => S(pts.find((q) => q[2] >= kickLen) || pts[pts.length - 1]) };
    if (o.drawAt != null) BTO.cue(o.drawAt, "sweep", 0.4, 0, { dur: (o.drawEndAt || o.drawAt + 2) - o.drawAt });
    return { draw: (t) => {
      const op = (o.enterAt == null ? 1 : clamp((t - o.enterAt) / 0.3)) * (o.outAt == null ? 1 : 1 - clamp((t - o.outAt) / 0.3)); if (op <= 0) return "";
      const u = o.drawAt == null ? 1 : BTO.ease("inOut", clamp((t - o.drawAt) / ((o.drawEndAt || o.drawAt + 2) - o.drawAt))); const lim = u * total;
      let g = `<rect x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}" rx="22" fill="${C.desk}" opacity="0.9"/>`;
      for (let gx = box.x + 40; gx < box.x + box.w; gx += 80) g += `<line x1="${gx}" y1="${box.y + 10}" x2="${gx}" y2="${box.y + box.h - 10}" stroke="${C.muted}" stroke-width="1" opacity="0.18"/>`;
      for (let gy = box.y + 40; gy < box.y + box.h; gy += 80) g += `<line x1="${box.x + 10}" y1="${gy}" x2="${box.x + box.w - 10}" y2="${gy}" stroke="${C.muted}" stroke-width="1" opacity="0.18"/>`;
      const solid = pts.filter((q) => q[2] <= Math.min(lim, kickLen)).map(S), dashed = pts.filter((q) => q[2] >= kickLen && q[2] <= lim).map(S);
      if (dashed.length > 1) g += `<path d="M${dashed.map((q) => `${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join("L")}" fill="none" stroke="${C.paper}" stroke-width="6" stroke-dasharray="14 12" opacity="0.8"/>`;
      if (solid.length > 1) g += `<path d="M${solid.map((q) => `${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join("L")}" fill="none" stroke="${C.amber}" stroke-width="12" stroke-linecap="round"/>`;
      // osculating circles at a few points along the drawn path: radius = speed / (k_m * spin); clipped to the plot
      g += `<clipPath id="spClip${o.id || "sp"}"><rect x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}" rx="22"/></clipPath><g clip-path="url(#spClip${o.id || "sp"})">`;
      for (const fr of o.circles || []) { const q = pts.find((p) => p[2] >= fr.d * total); if (!q || q[2] > lim || (fr.at != null && t < fr.at)) continue; const r = q[3] / (km * w) * sc;         const i = pts.indexOf(q), q2 = pts[Math.min(pts.length - 1, i + 1)]; const tx = q2[0] - q[0], ty = q2[1] - q[1]; const tl = Math.hypot(tx, ty) || 1; const nx = -ty / tl, ny = tx / tl;
        const c = S([q[0] + nx * q[3] / (km * w), q[1] + ny * q[3] / (km * w)]); const k = fr.at == null ? 1 : clamp((t - fr.at) / 0.4);
        g += `<circle cx="${c[0].toFixed(1)}" cy="${c[1].toFixed(1)}" r="${r.toFixed(1)}" fill="none" stroke="${C.teal}" stroke-width="4" opacity="${(0.75 * k).toFixed(3)}"/><line x1="${c[0].toFixed(1)}" y1="${c[1].toFixed(1)}" x2="${S(q)[0].toFixed(1)}" y2="${S(q)[1].toFixed(1)}" stroke="${C.teal}" stroke-width="3" opacity="${(0.75 * k).toFixed(3)}" stroke-dasharray="8 8"/>`; }
      g += "</g>";
      const head = S(pts.filter((q) => q[2] <= lim).pop() || pts[0]); g += `<circle cx="${head[0].toFixed(1)}" cy="${head[1].toFixed(1)}" r="16" fill="#fff" stroke="${C.ink}" stroke-width="3"/>`;
      return `<g opacity="${op.toFixed(3)}">${g}</g>`;
    } };
  });
})(window.BTO);
