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
    const C = BTO.style.palette; const cx = o.x || 540, cy = o.y || 800, R = o.R || 150, U = o.U || 260; const W = o.w || 1000, H = o.h || 900;
    const gAt = (t) => (o.clockwise === false ? -1 : 1) * (o.spinKeys ? BTO.keys(t, o.spinKeys, "inOut") : o.spin || 0); // circulation ratio g, keyed (spin-up); clockwise = faster on top
    const seeds = []; const n = o.lines || 15; for (let i = 0; i < n; i += 1) { const y = lerp(-H / 2 + 30, H / 2 - 30, (i + 0.5) / n); if (Math.abs(y) > R * 0.12) seeds.push(y); }
    // trace one streamline from the left edge; samples carry the model time so tracers move at the local speed
    const trace = (y0, g) => { let x = -W / 2, y = y0, tm = 0; const pts = [[x, y, 0]]; const ds = 6;
      for (let i = 0; i < 600 && x < W / 2; i += 1) { const [u, v] = vel(x, y, U, R, g); const sp = Math.hypot(u, v) || 1e-6; if (sp < 2) break;
        x += ds * u / sp; y += ds * v / sp; tm += ds / sp; if (x * x + y * y < R * R * 1.02) break; pts.push([x, y, tm]); } return pts; };
    if (o.forceAt != null) BTO.cue(o.forceAt, "pop", 0.45);
    if (o.spinKeys) BTO.cue(o.spinKeys[1][0], "whoosh", 0.4);
    return { draw: (t) => {
      const op = (o.enterAt == null ? 1 : clamp((t - o.enterAt) / 0.4)) * (o.outAt == null ? 1 : 1 - clamp((t - o.outAt) / 0.35)); if (op <= 0) return "";
      const g = gAt(t); const S = (x, y) => [cx + x, cy - y]; let s = "";
      s += `<clipPath id="afClip"><rect x="${cx - W / 2}" y="${cy - H / 2}" width="${W}" height="${H}" rx="24"/></clipPath><g clip-path="url(#afClip)">`;
      s += `<rect x="${cx - W / 2}" y="${cy - H / 2}" width="${W}" height="${H}" fill="${C.desk}" opacity="0.92"/>`;
      // faint pressure tint: model speed squared relative to U (Bernoulli), sampled on a coarse grid; low pressure = amber
      if (o.pressure !== false) for (let gx = -W / 2 + 25; gx < W / 2; gx += 50) for (let gy = -H / 2 + 25; gy < H / 2; gy += 50) { if (gx * gx + gy * gy < R * R) continue;
        const [u, v] = vel(gx, gy, U, R, g); const cp = 1 - (u * u + v * v) / (U * U); const k = clamp(-cp / 2.5); if (k < 0.04) continue; const [sx, sy] = S(gx, gy);
        s += `<rect x="${(sx - 25).toFixed(1)}" y="${(sy - 25).toFixed(1)}" width="50" height="50" fill="${C.amber}" opacity="${(0.22 * k).toFixed(3)}"/>`; }
      const lines = seeds.map((y0) => trace(y0, g)); const tt = (t - (o.enterAt || 0)) * (o.timeScale || 1);
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
      return `<g opacity="${op.toFixed(3)}">${s}</g>`;
    } };
  });
})(window.BTO);
