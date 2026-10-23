// Premium studio - places and people (generic, original drawings; no real person's likeness, no brand marks).
//   store-aisle  one-point-perspective shop aisle: shelving with seeded product blocks (no text, no logos), tiled floor,
//                pendant lamps, warm distance haze; the camera dollies along the aisle (dollyKeys, metres).
//                BTO.geo[id].toScreen(X, Y, Z) maps aisle metres (X across, Y up, Z along) to screen for other layers.
//   figure       period silhouettes: walk / stand / push / carry poses with a closed-form gait (phase from distance
//                travelled, so a frame depends only on t); hats: fedora, cloche, none. Never a portrait.
//   floor-plan   top-down plan: aisles, counters and movers (person, cart) following keyed paths, with fading trails.
//   line-art     stroke-drawn SVG paths (draw-on in order), placed and scaled; for outlines, ghosts and comparisons.
(function (BTO) {
  "use strict";
  const { clamp, lerp } = BTO;
  const pts = (a) => a.map((q) => `${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join("L");

  BTO.def("store-aisle", (o) => {
    const C = BTO.style.palette; const r = BTO.rng(o.seed || 5); const f = o.focal || 900, H = o.eye || 1.55, hw = o.halfWidth || 1.5, shelfH = o.shelfH || 2.1, len = o.length || 22;
    const pal = o.products || ["#c8553d", "#e0b13c", "#3f8f8a", "#efe6d2", "#8c4a2f", "#5b7a99", "#d9a066"];
    const items = []; for (const side of [-1, 1]) for (let z = 0; z < len; z += 0.34 + r() * 0.3) for (let s = 0; s < 4; s += 1) { if (r() < 0.12) continue;
      const w = 0.18 + r() * 0.2, h = 0.16 + r() * 0.24; items.push({ side, z, w, h, y: 0.35 + s * 0.45, c: pal[Math.floor(r() * pal.length)], band: r() < 0.5 }); }
    const camZ = (t) => (o.dollyKeys ? BTO.keys(t, o.dollyKeys, "camera") : o.camZ || 0);
    const view = (t) => { const vx = o.vpX || 540, vy = o.vpY || 760, cz = camZ(t);
      return (X, Y, Z) => { const d = Z - cz; if (d < 0.25) return null; const k = f / d; return [vx + X * k, vy + (H - Y) * k, k, d]; }; };
    BTO.geo[o.id || "aisle"] = { toScreen: (t, X, Y, Z) => view(t)(X, Y, Z) };
    const haze = o.haze || "#2a1a10";
    return { draw: (t) => {
      const V = view(t); const cz = camZ(t); let g = `<rect width="1080" height="1920" fill="${o.wall || "#1d130c"}"/>`;
      const q = (a) => { const s = a.map((p) => V(...p)); return s.some((x) => !x) ? null : s; };
      const fog = (d) => clamp((d - 2) / (len * 0.75)) * 0.82;
      // back wall (end of aisle), ceiling and floor tiles, far to near
      const end = q([[-hw - 0.4, 0, len], [hw + 0.4, 0, len], [hw + 0.4, 3.2, len], [-hw - 0.4, 3.2, len]]); if (end) g += `<path d="M${pts(end)}Z" fill="${BTO.mixColor("#6b4a2c", haze, 0.75)}"/>`;
      for (let z = Math.floor(len / 0.5) * 0.5; z >= Math.max(0, Math.floor((cz + 0.3) / 0.5) * 0.5); z -= 0.5) for (let x = -hw; x < hw; x += 0.5) {
        const p = q([[x, 0, z], [x + 0.5, 0, z], [x + 0.5, 0, z + 0.5], [x, 0, z + 0.5]]); if (!p) continue; const dark = ((x + hw) / 0.5 + z / 0.5) % 2 === 0;
        g += `<path d="M${pts(p)}Z" fill="${BTO.mixColor(dark ? "#3b2a1c" : "#cdbb98", haze, fog(z - cz))}"/>`; }
      const ceil = q([[-hw - 0.4, 3.2, Math.max(cz + 0.3, 0)], [hw + 0.4, 3.2, Math.max(cz + 0.3, 0)], [hw + 0.4, 3.2, len], [-hw - 0.4, 3.2, len]]); if (ceil) g += `<path d="M${pts(ceil)}Z" fill="#120b07"/>`;
      // shelving: carcass faces, boards, then product blocks (front faces), far to near
      for (const side of [-1, 1]) { const x = side * hw;
        const face = q([[x, 0, Math.max(cz + 0.3, 0)], [x, 0, len], [x, shelfH, len], [x, shelfH, Math.max(cz + 0.3, 0)]]); if (face) g += `<path d="M${pts(face)}Z" fill="${BTO.mixColor("#5a3b22", haze, 0.35)}"/>`;
        for (let s = 0; s <= 4; s += 1) { const y = 0.3 + s * 0.45; const b = q([[x, y, Math.max(cz + 0.3, 0)], [x, y, len], [x, y + 0.05, len], [x, y + 0.05, Math.max(cz + 0.3, 0)]]); if (b) g += `<path d="M${pts(b)}Z" fill="#8a6239"/>`; } }
      const vis = items.filter((it) => it.z > cz + 0.3 && it.z < len).sort((a, b) => b.z - a.z);
      for (const it of vis) { const x = it.side * (hw - 0.02); const p = q([[x, it.y, it.z], [x, it.y, it.z + it.w], [x, it.y + it.h, it.z + it.w], [x, it.y + it.h, it.z]]); if (!p) continue;
        const fz = fog(it.z - cz); g += `<path d="M${pts(p)}Z" fill="${BTO.mixColor(it.c, haze, fz)}"/>`;
        if (it.band) { const bnd = q([[x, it.y + it.h * 0.42, it.z], [x, it.y + it.h * 0.42, it.z + it.w], [x, it.y + it.h * 0.6, it.z + it.w], [x, it.y + it.h * 0.6, it.z]]); if (bnd) g += `<path d="M${pts(bnd)}Z" fill="${BTO.mixColor("#f4ead2", haze, fz)}" opacity="0.8"/>`; } }
      // pendant lamps with a warm pool of light on the floor
      for (let z = 2; z < len; z += 4) { if (z < cz + 0.5) continue; const l = V(0, 2.9, z), fl = V(0, 0, z); if (!l || !fl || l[1] < 250) continue; /* keep lamps clear of the handle and chip band */ const k = l[2];
        g += `<ellipse cx="${fl[0].toFixed(1)}" cy="${fl[1].toFixed(1)}" rx="${(1.3 * k).toFixed(1)}" ry="${(0.35 * k).toFixed(1)}" fill="#ffd9a0" opacity="${(0.16 * (1 - fog(z - cz))).toFixed(3)}" filter="url(#soft)"/>`;
        g += `<line x1="${l[0].toFixed(1)}" y1="${V(0, 3.2, z) ? V(0, 3.2, z)[1].toFixed(1) : 0}" x2="${l[0].toFixed(1)}" y2="${l[1].toFixed(1)}" stroke="#0a0604" stroke-width="${Math.max(1, 0.02 * k).toFixed(1)}"/><path d="M${(l[0] - 0.22 * k).toFixed(1)} ${(l[1] + 0.12 * k).toFixed(1)} Q${l[0].toFixed(1)} ${(l[1] - 0.12 * k).toFixed(1)} ${(l[0] + 0.22 * k).toFixed(1)} ${(l[1] + 0.12 * k).toFixed(1)}Z" fill="#2b1d12"/><circle cx="${l[0].toFixed(1)}" cy="${(l[1] + 0.12 * k).toFixed(1)}" r="${(0.07 * k).toFixed(1)}" fill="#ffe7bd" opacity="${(1 - fog(z - cz) * 0.7).toFixed(3)}"/>`; }
      g += `<rect width="1080" height="1920" fill="url(#vig)" opacity="${o.vignette == null ? 0.0 : o.vignette}"/>`;
      return g;
    } };
  });

  BTO.def("figure", (o) => {
    const C = BTO.style.palette;
    const list = o.people || [o];
    const at = (pp, t) => { const k = pp.pathKeys; if (t <= k[0][0]) return { x: k[0][1], y: k[0][2], s: k[0][3] || 1, d: 0, moving: false };
      let d = 0; for (let i = 1; i < k.length; i += 1) { const seg = Math.hypot(k[i][1] - k[i - 1][1], k[i][2] - k[i - 1][2]) / ((k[i][3] || 1) + (k[i - 1][3] || 1)) * 2;
        if (t < k[i][0]) { const u = (t - k[i - 1][0]) / (k[i][0] - k[i - 1][0]); return { x: lerp(k[i - 1][1], k[i][1], u), y: lerp(k[i - 1][2], k[i][2], u), s: lerp(k[i - 1][3] || 1, k[i][3] || 1, u), d: d + seg * u, moving: seg > 1 }; } d += seg; }
      const z = k[k.length - 1]; return { x: z[1], y: z[2], s: z[3] || 1, d, moving: false }; };
    return { draw: (t) => list.map((pp) => {
      if (pp.enterAt != null && t < pp.enterAt) return ""; const op = (pp.enterAt == null ? 1 : clamp((t - pp.enterAt) / 0.3)) * (pp.outAt == null ? 1 : 1 - clamp((t - pp.outAt) / 0.3)); if (op <= 0) return "";
      const a = at(pp, t); const S = (pp.height || 300) * a.s; const u = S / 170; // px per cm-ish unit (170 = body height)
      const face = pp.facing || 1; const ph = a.d / (S * 0.55) * Math.PI; const walk = a.moving || pp.pose === "walk" ? Math.sin(ph) : 0;
      const pose = pp.poseKeys ? pp.poseKeys.filter((k) => t >= k[0]).map((k) => k[1]).pop() || pp.pose : pp.pose || "walk";
      const col = pp.color || "#14100c"; const lw = 15 * u; const lean = pose === "push" ? 7 : 0;
      const hip = [a.x, a.y - 92 * u], neck = [a.x + face * lean * u, a.y - 146 * u];
      const leg = (sgn) => { const sw = walk * 24 * sgn; const knee = [hip[0] + face * Math.sin(sw * Math.PI / 180) * 44 * u, hip[1] + 46 * u]; const foot = [knee[0] + face * Math.sin((sw - Math.abs(sw) * 0.5) * Math.PI / 180) * 44 * u, a.y - 4 * u];
        return `<path d="M${pts([hip, knee, foot])}" stroke="${col}" stroke-width="${lw.toFixed(1)}" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M${(foot[0] - 4 * u).toFixed(1)} ${foot[1].toFixed(1)} h${(face * 22 * u).toFixed(1)}" stroke="${col}" stroke-width="${(9 * u).toFixed(1)}" stroke-linecap="round"/>`; };
      const sh = [neck[0], neck[1] + 8 * u];
      const arm = (sgn) => { if (pose === "push") { const hand = [sh[0] + face * 58 * u, sh[1] + 28 * u]; return `<path d="M${pts([sh, [sh[0] + face * 30 * u, sh[1] + 24 * u], hand])}" stroke="${col}" stroke-width="${(lw * 0.8).toFixed(1)}" fill="none" stroke-linecap="round"/>`; }
        if (pose === "carry" && sgn > 0) { const hand = [sh[0] + face * 14 * u, sh[1] + 66 * u]; return `<path d="M${pts([sh, [sh[0] + face * 8 * u, sh[1] + 34 * u], hand])}" stroke="${col}" stroke-width="${(lw * 0.8).toFixed(1)}" fill="none" stroke-linecap="round"/>` +
          `<path d="M${(hand[0] - 20 * u).toFixed(1)} ${(hand[1] + 6 * u).toFixed(1)} h${(40 * u).toFixed(1)} l${(-5 * u).toFixed(1)} ${(30 * u).toFixed(1)} h${(-30 * u).toFixed(1)}Z" fill="none" stroke="${pp.basket || "#b48a22"}" stroke-width="${(3 * u).toFixed(1)}"/><path d="M${(hand[0] - 20 * u).toFixed(1)} ${(hand[1] + 6 * u).toFixed(1)} Q${hand[0].toFixed(1)} ${(hand[1] - 18 * u).toFixed(1)} ${(hand[0] + 20 * u).toFixed(1)} ${(hand[1] + 6 * u).toFixed(1)}" fill="none" stroke="${pp.basket || "#b48a22"}" stroke-width="${(3 * u).toFixed(1)}"/>`; }
        const sw = -walk * 20 * sgn; const hand = [sh[0] + face * Math.sin(sw * Math.PI / 180) * 64 * u, sh[1] + 64 * u * Math.cos(sw * Math.PI / 180)];
        if (pose === "think" && sgn > 0) { const chin = [neck[0] + face * 12 * u, neck[1] - 6 * u]; return `<path d="M${pts([sh, [sh[0] + face * 34 * u, sh[1] + 40 * u], chin])}" stroke="${col}" stroke-width="${(lw * 0.8).toFixed(1)}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`; }
        if (pose === "think") return `<path d="M${pts([sh, [sh[0] - face * 4 * u, sh[1] + 34 * u], [sh[0] + face * 26 * u, sh[1] + 40 * u]])}" stroke="${col}" stroke-width="${(lw * 0.8).toFixed(1)}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
        if (pose === "akimbo") return `<path d="M${pts([sh, [sh[0] + sgn * 26 * u, sh[1] + 34 * u], [sh[0] + sgn * 8 * u, sh[1] + 62 * u]])}" stroke="${col}" stroke-width="${(lw * 0.8).toFixed(1)}" fill="none" stroke-linecap="round"/>`;
        return `<path d="M${pts([sh, hand])}" stroke="${col}" stroke-width="${(lw * 0.8).toFixed(1)}" fill="none" stroke-linecap="round"/>`; };
      let g = `<ellipse cx="${a.x.toFixed(1)}" cy="${a.y.toFixed(1)}" rx="${(30 * u).toFixed(1)}" ry="${(7 * u).toFixed(1)}" fill="#000" opacity="0.3"/>`;
      g += leg(-1) + arm(-1);
      const skirt = pp.skirt; const torso = skirt ? `M${(neck[0] - 15 * u).toFixed(1)} ${(neck[1] + 4 * u).toFixed(1)} L${(neck[0] + 15 * u).toFixed(1)} ${(neck[1] + 4 * u).toFixed(1)} L${(hip[0] + 30 * u).toFixed(1)} ${(hip[1] + 32 * u).toFixed(1)} L${(hip[0] - 30 * u).toFixed(1)} ${(hip[1] + 32 * u).toFixed(1)}Z`
        : `M${(neck[0] - 18 * u).toFixed(1)} ${(neck[1] + 2 * u).toFixed(1)} L${(neck[0] + 18 * u).toFixed(1)} ${(neck[1] + 2 * u).toFixed(1)} L${(hip[0] + 15 * u).toFixed(1)} ${(hip[1] + 6 * u).toFixed(1)} L${(hip[0] - 15 * u).toFixed(1)} ${(hip[1] + 6 * u).toFixed(1)}Z`;
      g += `<path d="${torso}" fill="${col}" stroke="${col}" stroke-width="${(6 * u).toFixed(1)}" stroke-linejoin="round"/>`;
      const hd = [neck[0] + face * 2 * u, neck[1] - 16 * u]; g += `<circle cx="${hd[0].toFixed(1)}" cy="${hd[1].toFixed(1)}" r="${(13 * u).toFixed(1)}" fill="${col}"/>`;
      if (pp.hat === "fedora") g += `<path d="M${(hd[0] - 22 * u).toFixed(1)} ${(hd[1] - 7 * u).toFixed(1)} h${(44 * u).toFixed(1)} M${(hd[0] - 12 * u).toFixed(1)} ${(hd[1] - 8 * u).toFixed(1)} l${(3 * u).toFixed(1)} ${(-13 * u).toFixed(1)} h${(18 * u).toFixed(1)} l${(3 * u).toFixed(1)} ${(13 * u).toFixed(1)}" stroke="${col}" stroke-width="${(6 * u).toFixed(1)}" fill="${col}" stroke-linecap="round"/>`;
      if (pp.hat === "cloche") g += `<path d="M${(hd[0] - 17 * u).toFixed(1)} ${(hd[1] + 1 * u).toFixed(1)} Q${hd[0].toFixed(1)} ${(hd[1] - 30 * u).toFixed(1)} ${(hd[0] + 17 * u).toFixed(1)} ${(hd[1] + 1 * u).toFixed(1)}Z" fill="${col}"/>`;
      g += leg(1) + arm(1);
      if (pp.rim) g = `<g filter="url(#shadow)">${g}</g>`;
      return `<g opacity="${(op * (pp.opacity == null ? 1 : pp.opacity)).toFixed(3)}">${g}</g>`;
    }).join("") };
  });

  BTO.def("floor-plan", (o) => {
    const C = BTO.style.palette; const ink = o.ink || C.ink;
    (o.movers || []).forEach((m) => { if (m.enterAt != null) BTO.cue(m.enterAt, "tick", 0.3); });
    const posOf = (k, t) => { if (t <= k[0][0]) return [k[0][1], k[0][2], 0]; for (let i = 1; i < k.length; i += 1) if (t < k[i][0]) { const u = BTO.ease("inOut", (t - k[i - 1][0]) / (k[i][0] - k[i - 1][0]));
        return [lerp(k[i - 1][1], k[i][1], u), lerp(k[i - 1][2], k[i][2], u), Math.atan2(k[i][2] - k[i - 1][2], k[i][1] - k[i - 1][1])]; }
      const z = k[k.length - 1], y = k[k.length - 2] || z; return [z[1], z[2], Math.atan2(z[2] - y[2], z[1] - y[1])]; };
    return { draw: (t) => {
      const op = (o.enterAt == null ? 1 : clamp((t - o.enterAt) / 0.35)) * (o.outAt == null ? 1 : 1 - clamp((t - o.outAt) / 0.35)); if (op <= 0) return "";
      let g = ""; const { x = 90, y = 360, w = 900, h = 900 } = o.box || {};
      g += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="18" fill="${o.floor || C.paper}" stroke="${ink}" stroke-width="5"/>`;
      for (const a of o.aisles || []) g += `<rect x="${x + a[0]}" y="${y + a[1]}" width="${a[2]}" height="${a[3]}" rx="6" fill="${o.shelf || C.paper2}" stroke="${ink}" stroke-width="3"/>`;
      for (const m of o.movers || []) { if (m.enterAt != null && t < m.enterAt) continue; const mop = clamp((t - (m.enterAt || 0)) / 0.3) * (m.outAt == null ? 1 : 1 - clamp((t - m.outAt) / 0.3)); if (mop <= 0) continue;
        // trail: the path travelled so far
        const tr = []; for (let s = Math.max(m.pathKeys[0][0], t - (m.trail || 1.4)); s <= t; s += 0.05) { const q = posOf(m.pathKeys, s); tr.push([x + q[0], y + q[1]]); }
        if (tr.length > 1) g += `<path d="M${pts(tr)}" fill="none" stroke="${m.color || C.amberDeep}" stroke-width="6" stroke-linecap="round" stroke-dasharray="2 12" opacity="${(0.8 * mop).toFixed(3)}"/>`;
        const [px, py, ang] = posOf(m.pathKeys, t); const sx = x + px, sy = y + py; const deg = ang * 180 / Math.PI;
        let body = `<circle cx="0" cy="0" r="17" fill="${m.color || C.coral}" stroke="${ink}" stroke-width="3"/>`;
        if (m.kind !== "person") body += `<g transform="translate(34 0)"><rect x="-16" y="-20" width="38" height="40" rx="4" fill="${C.paper}" stroke="${ink}" stroke-width="3"/><path d="M-6 -20 v40 M5 -20 v40 M14 -20 v40 M-16 -8 h38 M-16 6 h38" stroke="${ink}" stroke-width="1.6"/></g>`;
        g += `<g transform="translate(${sx.toFixed(1)} ${sy.toFixed(1)}) rotate(${deg.toFixed(1)})" opacity="${mop.toFixed(3)}">${body}</g>`;
        if (m.label && t >= (m.labelAt || m.enterAt || 0)) g += BTO.label(sx, sy - 22, sx + (m.lx || 40), sy + (m.ly || -90), m.label, clamp((t - (m.labelAt || m.enterAt || 0)) / 0.4) * mop, { size: m.labelSize || 40, pill: true }); }
      return `<g opacity="${op.toFixed(3)}">${g}</g>`;
    } };
  });

  BTO.def("line-art", (o) => {
    const C = BTO.style.palette; (o.paths || []).forEach((p) => { if (p.at != null) BTO.cue(p.at, p.cue || "sweep", 0.25, 0, { dur: p.dur || 0.5 }); });
    return { draw: (t) => {
      const op = (o.enterAt == null ? 1 : clamp((t - o.enterAt) / 0.3)) * (o.outAt == null ? 1 : 1 - clamp((t - o.outAt) / 0.3)); if (op <= 0) return "";
      let g = ""; for (const p of o.paths || []) { const at = p.at == null ? -1 : p.at; if (t < at) continue; const k = BTO.ease("inOut", clamp((t - at) / (p.dur || 0.5)));
        const col = (p.color && C[p.color]) || p.color || C.amber;
        // pathLength=1: a solid path draws on via dashoffset; a dashed path (dashed: "0.03 0.02", fractions of its length) fades in
        const stroke = p.dashed ? `stroke-dasharray="${p.dashed}" stroke-dashoffset="${(-(t - at) * 0.08).toFixed(4)}" opacity="${k.toFixed(3)}"` : `stroke-dasharray="1 1" stroke-dashoffset="${(1 - k).toFixed(4)}"`;
        g += `<path d="${p.d}" pathLength="1" fill="${p.fill || "none"}" stroke="${col}" stroke-width="${((p.width || 6) / (o.s || 1)).toFixed(2)}" stroke-linecap="round" stroke-linejoin="round" ${stroke}/>`; }
      const mv = o.moveKeys ? BTO.keys(t, o.moveKeys.map(([a, x, y, r]) => [a, [x, y, r || 0]]), o.moveEase || "inOut") : [0, 0, 0];
      return `<g transform="translate(${(o.x || 0) + mv[0]} ${(o.y || 0) + mv[1]}) rotate(${mv[2]}) scale(${o.s || 1})" opacity="${op.toFixed(3)}">${g}</g>`;
    } };
  });
})(window.BTO);
