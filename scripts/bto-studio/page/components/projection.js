// BTO Premium Studio - 2.5D projection engine and the components built on it.
//   BTO.projector({ cx, cy, rx, rz, D, s }) -> P(x, y, z): a plane at (cx, cy) seen through a perspective camera.
//     x, y lie in the plane (px, centred), z points out of it towards the viewer. rz spins the plane in itself,
//     rx tilts its top edge away. Straight edges stay straight, so projected squares are exact quads.
//   qr-3d      a real matrix code on that plane: surface, card, peel-off/assemble physics, read sweep, finder highlight,
//              lifted exploded finder (real side walls), locks, links, ghost corner, labels; publishes geometry
//   row-signal the scanner's view: a scan line steps through the code's actual rows and the run lengths of the
//              current row are drawn as a strip; dark-light-dark-light-dark runs of 1:1:3:1:1 modules are found
//              exactly, the way a reader finds them.
(function (BTO) {
  "use strict";
  const { clamp, lerp, p } = BTO;
  const D2R = Math.PI / 180;

  BTO.projector = ({ cx, cy, rx = 0, rz = 0, D = 1800, s = 1 }) => {
    const cz = Math.cos(rz * D2R), sz = Math.sin(rz * D2R), cxr = Math.cos(rx * D2R), sxr = Math.sin(rx * D2R);
    return (x, y, z = 0) => { x *= s; y *= s; z *= s;
      const x1 = x * cz - y * sz, y1 = x * sz + y * cz; const y2 = y1 * cxr - z * sxr, z2 = y1 * sxr + z * cxr;
      const k = D / Math.max(120, D - z2); return [cx + x1 * k, cy + y2 * k, k]; };
  };
  const poly = (pts) => "M" + pts.map((q) => `${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join("L") + "Z";
  const area = (pts) => { let a = 0; for (let i = 0; i < pts.length; i += 1) { const q = pts[i], r = pts[(i + 1) % pts.length]; a += q[0] * r[1] - r[0] * q[1]; } return a / 2; };
  const hex = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
  const mix = (a, b, k) => { const x = hex(a), y = hex(b); return "#" + x.map((v, i) => Math.round(lerp(v, y[i], clamp(k))).toString(16).padStart(2, "0")).join(""); };
  BTO.mixColor = mix;

  // exact run lengths of one matrix row (quiet zone of `quiet` light modules on both sides); first run is light
  BTO.rowRuns = (A, r, quiet = 2) => { const row = "0".repeat(quiet) + A.matrix[r] + "0".repeat(quiet); const runs = []; let cur = row[0], n = 0;
    for (const c of row) { if (c === cur) n += 1; else { runs.push({ dark: cur === "1", n }); cur = c; n = 1; } } runs.push({ dark: cur === "1", n }); return runs; };
  // indices of runs that start a dark-light-dark-light-dark 1:1:3:1:1 sequence
  BTO.finderSignatures = (runs) => { const hits = []; for (let i = 0; i + 4 < runs.length; i += 1) { const q = runs.slice(i, i + 5);
    if (q[0].dark && q.map((x) => x.n).join(",") === "1,1,3,1,1") hits.push(i); } return hits; };

  BTO.def("qr-3d", (o, scene) => {
    const A = BTO.assets[o.asset]; if (!A) throw new Error("qr-3d: no asset " + o.asset);
    const n = A.size, m = o.module || 34, half = (n * m) / 2; const C = BTO.style.palette;
    const ink = o.mono ? "#000000" : C.ink, paper = o.mono ? "#ffffff" : C.paper;
    const inFinder = (r, c) => A.finders.some((f) => r >= f.row && r < f.row + 7 && c >= f.col && c < f.col + 7);
    const data = []; A.matrix.forEach((row, r) => [...row].forEach((v, c) => { if (v === "1" && !inFinder(r, c)) data.push({ r, c, x: c * m - half, y: r * m - half }); }));
    const fc = A.finders.map((f) => ({ x: (f.col + 3.5) * m - half, y: (f.row + 3.5) * m - half }));
    const rnd = BTO.rng(o.seed || 301); data.forEach((d) => { const ang = Math.atan2(d.y + m / 2, d.x + m / 2) + (rnd() - 0.5) * 0.9;
      d.dir = [Math.cos(ang), Math.sin(ang)]; d.v = 0.6 + 0.8 * rnd(); d.spin = (rnd() - 0.5) * 300; d.dist = Math.hypot(d.x + m / 2, d.y + m / 2);
      d.dist0 = Math.hypot(d.x + m / 2 - ((A.finders[0].col + 3.5) * m - half), d.y + m / 2 - ((A.finders[0].row + 3.5) * m - half)); });
    const maxDist = Math.max(...data.map((d) => d.dist)), maxDist0 = Math.max(...data.map((d) => d.dist0));
    const asmFrom0 = o.assemble && o.assemble.origin === "finder0";
    const K = (name, t, def) => (o[name] ? BTO.keys(t, o[name], "inOut") : def);
    const cam = (t) => ({ cx: o.cx, cy: o.cy, rx: K("rxKeys", t, o.rx || 0), rz: K("rzKeys", t, o.rz || 0), D: K("distKeys", t, o.D || 1800), s: K("scaleKeys", t, 1) });
    const gid = o.id || scene.id + "-qr3d";
    // cues
    if (o.peel) for (let i = 0; i < 12; i += 1) BTO.cue(o.peel.at + (o.peel.dur || 1) * 0.7 * i / 11, "tick", 0.3, (i % 3 - 1) * 0.5);
    if (o.peel) BTO.cue(o.peel.at, "whoosh", 0.5);
    if (o.assemble) for (let i = 0; i < 8; i += 1) BTO.cue(o.assemble.at + (o.assemble.dur || 0.6) * 0.7 * i / 7, "tick", 0.26, (i % 3 - 1) * 0.4);
    if (o.read) BTO.cue(o.read.at, "read", 0.6, 0, { dur: o.read.dur || 0.7 });
    (o.locks || []).forEach((l) => { if (l.at > 0.05) BTO.cue(l.at + 0.06, "lock", 0.75, [-0.5, 0.5, -0.5][l.finder] || 0); });
    if (o.finderHighlight) [0, 1, 2].forEach((i) => BTO.cue(o.finderHighlight.at + i * 0.1, "pop", 0.45, [-0.5, 0.5, -0.5][i]));
    if (o.explode) { BTO.cue(o.explode.at, "lift", 0.85); if (o.explode.collapseAt != null) BTO.cue(o.explode.collapseAt, "drop", 0.7); (o.explode.labels || []).forEach((L) => BTO.cue(L.at, "tick", 0.35)); }
    if (o.ghostCorner) { BTO.cue(o.ghostCorner.at, "pop", 0.4, 0.5); if (o.ghostCorner.resolveAt != null) BTO.cue(o.ghostCorner.resolveAt, "chime", 0.8); }

    const explodeK = (t) => { const e = o.explode; if (!e || t < e.at) return 0; const up = BTO.sp(t, e.at, "settle");
      return e.collapseAt == null || t < e.collapseAt ? up : up * (1 - BTO.ease("inOut", p(t, e.collapseAt, e.collapseAt + 0.5))); };
    const rotIn = (t) => cam(t).rz; // in-plane angle
    BTO.geo[gid] = {
      at: (t) => { const P = BTO.projector(cam(t)); return fc.map((c) => { const q = P(c.x, c.y, 0); return { x: q[0], y: q[1], k: q[2] }; }); },
      row: (t, r) => { const P = BTO.projector(cam(t)); const y = (r + 0.5) * m - half; return [P(-half - m, y, 0), P(half + m, y, 0)]; },
      module: m, size: n,
    };
    BTO.runsFrom[gid + ":finder0"] = (t) => { const th = rotIn(t) * D2R; const f = 1 / Math.max(Math.abs(Math.cos(th)), Math.abs(Math.sin(th)));
      return { runs: [1, 1, 3, 1, 1].map((x) => x * f), width: 7 * m * cam(t).s * f * (o.stripScale || 1), factor: f }; };

    // one extruded square (optionally a ring) at height z, thickness th
    const slab = (P, x, y, w, z, th, fill, hole) => {
      const corners = (zz, s0) => [[x - s0 / 2, y - s0 / 2], [x + s0 / 2, y - s0 / 2], [x + s0 / 2, y + s0 / 2], [x - s0 / 2, y + s0 / 2]].map(([a, b]) => P(a, b, zz));
      const top = corners(z + th, w), bot = corners(z, w); let g = "";
      for (let i = 0; i < 4; i += 1) { const q = [top[i], top[(i + 1) % 4], bot[(i + 1) % 4], bot[i]]; if (area(q) < 0) g += `<path d="${poly(q)}" fill="${mix(fill, "#000000", 0.45)}"/>`; }
      let d = poly(top); if (hole) d += poly(corners(z + th, hole).reverse());
      return g + `<path d="${d}" fill="${fill}" fill-rule="evenodd"/>`;
    };

    return { draw: (t) => {
      const c = cam(t); const P = BTO.projector(c); let g = ""; const ek = explodeK(t);
      const appear = o.enterAt == null ? 1 : clamp((t - o.enterAt) / 0.3); if (appear <= 0) return "";
      const ov = o.overlaysOutAt == null ? 1 : 1 - clamp((t - o.overlaysOutAt) / 0.4);
      // surface (printed packaging under the card)
      const so = o.surface ? K("surfaceOpacityKeys", t, 1) : 0;
      if (so > 0.002) { const S = o.surface; const w = S.w, h = S.h; const r = BTO.rng(S.seed || 9); let sg = `<path d="${poly([P(-w / 2, -h / 2), P(w / 2, -h / 2), P(w / 2, h / 2), P(-w / 2, h / 2)])}" fill="${S.fill || "#c79c6b"}"/>`;
        for (let i = 0; i < (S.bars || 0); i += 1) { const bx = -w / 2 + w * 0.07, by = -h / 2 + h * (0.06 + 0.035 * i), bw = w * (0.25 + 0.3 * r()); sg += `<path d="${poly([P(bx, by), P(bx + bw, by), P(bx + bw, by + 16), P(bx, by + 16)])}" fill="#3b2f22" opacity="0.5"/>`; }
        (S.blocks || []).forEach((b) => { sg += `<path d="${poly([P(b.x, b.y), P(b.x + b.w, b.y), P(b.x + b.w, b.y + b.h), P(b.x, b.y + b.h)])}" fill="${C[b.fill] || b.fill}" opacity="${b.op || 0.85}"/>`; });
        g += `<g opacity="${so.toFixed(3)}">${sg}</g>`; }
      // card
      const co = K("cardOpacityKeys", t, o.card === false ? 0 : 1);
      if (co > 0.002) { const q = (o.quiet == null ? 2.2 : o.quiet) * m + half;
        g += `<g opacity="${co.toFixed(3)}"><path d="${poly([P(-q + 6, -q + 20), P(q + 6, -q + 20), P(q + 6, q + 20), P(-q + 6, q + 20)])}" fill="#000" opacity="0.38" filter="url(#soft)"/><path d="${poly([P(-q, -q, 1), P(q, -q, 1), P(q, q, 1), P(-q, q, 1)])}" fill="${paper}"/></g>`; }
      // data modules
      const dOp = K("dataOpacityKeys", t, 1) * (o.explode ? 1 - 0.65 * ek : 1);
      if (dOp > 0.002) { const readK = o.read ? p(t, o.read.at, o.read.at + (o.read.dur || 0.7)) : -1; const band = readK * (n + 6) - 3; let flat = "", moving = "";
        for (const d of data) {
          let lift = 0, sc = 1, op = 1;
          if (o.peel && t > o.peel.at) { const tau = (t - o.peel.at - (d.dist / maxDist) * (o.peel.dur || 1) * 0.55) / ((o.peel.dur || 1) * 0.6); if (tau > 0) { lift = Math.min(1, tau); op = 1 - BTO.ease("standard", clamp((tau - 0.3) / 0.7)); } }
          if (o.assemble) { if (t < o.assemble.at) { if (!o.peel || t >= o.peel.at) { lift = 1; op = 0; } }
            else { const pr = clamp((t - o.assemble.at - (asmFrom0 ? d.dist0 / maxDist0 : d.dist / maxDist) * (o.assemble.dur || 0.6) * 0.5) / ((o.assemble.dur || 0.6) * 0.5)); const e = BTO.ease("decelerate", pr); lift = 1 - e; op = e; } }
          if (op <= 0.01) continue;
          const hot = readK > 0 && readK < 1 ? Math.exp(-Math.pow((d.r - band) / 1.6, 2)) : 0;
          if (lift < 0.001 && hot < 0.02) { flat += poly([P(d.x, d.y), P(d.x + m, d.y), P(d.x + m, d.y + m), P(d.x, d.y + m)]); continue; }
          const dx = d.dir[0] * d.v * (260 * lift + 220 * lift * lift), dy = d.dir[1] * d.v * (260 * lift + 220 * lift * lift), z = (700 * lift * lift + 120 * lift) * d.v;
          const a = d.spin * lift * D2R, ca = Math.cos(a), sa = Math.sin(a), mx = d.x + m / 2 + dx, my = d.y + m / 2 + dy;
          const pts = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([u, v]) => P(mx + (u * ca - v * sa) * m / 2, my + (u * sa + v * ca) * m / 2, z));
          moving += `<path d="${poly(pts)}" fill="${hot > 0.02 ? mix(ink, C.amber, hot) : ink}" opacity="${op.toFixed(3)}"/>`;
        }
        g += `<g opacity="${dOp.toFixed(3)}"><path d="${flat}" fill="${ink}"/></g>`; g += `<g opacity="${dOp.toFixed(3)}">${moving}</g>`; }
      // finders (flat or exploded)
      const fl = o.finderLiftKeys ? BTO.keys(t, o.finderLiftKeys) : 0;
      A.finders.forEach((f, i) => { const x = fc[i].x, y = fc[i].y; const fo = o.finderOpacity && o.finderOpacity[i] ? BTO.keys(t, o.finderOpacity[i]) : 1; if (fo <= 0.002) return;
        if (o.explode && o.explode.finder === i && ek > 0.003) {
          const gap = (o.explode.gap || 2.4) * m * ek, th = 0.32 * m;
          let sg = `<path d="${poly([P(x - 3.5 * m, y - 3.5 * m), P(x + 3.5 * m, y - 3.5 * m), P(x + 3.5 * m, y + 3.5 * m), P(x - 3.5 * m, y + 3.5 * m)])}" fill="none" stroke="${C.amber}" stroke-width="4" stroke-dasharray="14 10" opacity="${(0.9 * ek).toFixed(3)}"/>`;
          sg += `<path d="${poly([P(x - 3.5 * m, y - 3.5 * m), P(x + 3.5 * m, y - 3.5 * m), P(x + 3.5 * m, y + 3.5 * m), P(x - 3.5 * m, y + 3.5 * m)])}" fill="#000" opacity="${(0.3 * ek).toFixed(3)}" filter="url(#soft)"/>`;
          sg += slab(P, x, y, 7 * m, 0, th, ink, 5 * m) + slab(P, x, y, 5 * m, gap, th, o.mono ? "#ffffff" : C.paper2, 3 * m) + slab(P, x, y, 3 * m, gap * 2, th, ink);
          g += `<g opacity="${fo.toFixed(3)}">${sg}</g>`; return; }
        const z = fl * m; const zz = z > 0.5 ? z : 1.5;
        const fg = z > 0.5 ? slab(P, x, y, 7 * m, 0, z, ink, 5 * m) + slab(P, x, y, 3 * m, 0, z, ink)
          : `<path d="${poly([P(x - 3.5 * m, y - 3.5 * m, zz), P(x + 3.5 * m, y - 3.5 * m, zz), P(x + 3.5 * m, y + 3.5 * m, zz), P(x - 3.5 * m, y + 3.5 * m, zz)]) + poly([P(x - 2.5 * m, y - 2.5 * m, zz), P(x - 2.5 * m, y + 2.5 * m, zz), P(x + 2.5 * m, y + 2.5 * m, zz), P(x + 2.5 * m, y - 2.5 * m, zz)])}" fill="${ink}" fill-rule="evenodd"/><path d="${poly([P(x - 1.5 * m, y - 1.5 * m, zz), P(x + 1.5 * m, y - 1.5 * m, zz), P(x + 1.5 * m, y + 1.5 * m, zz), P(x - 1.5 * m, y + 1.5 * m, zz)])}" fill="${ink}"/>`;
        g += fo < 1 ? `<g opacity="${fo.toFixed(3)}">${fg}</g>` : fg; });
      // finder highlight outlines
      if (o.finderHighlight && t >= o.finderHighlight.at) A.finders.forEach((f, i) => { const k = ov * clamp((t - o.finderHighlight.at - i * 0.1) / 0.4) * (o.finderHighlight.outAt == null ? 1 : 1 - clamp((t - o.finderHighlight.outAt) / 0.3)); if (k <= 0) return;
        const x = fc[i].x, y = fc[i].y, q = 3.95 * m; const z = fl * m + 2; g += BTO.draw(poly([P(x - q, y - q, z), P(x + q, y - q, z), P(x + q, y + q, z), P(x - q, y + q, z)]), k, { width: 8, cap: "butt" }); });
      // ghost corner
      if (o.ghostCorner && t >= o.ghostCorner.at) { const gk = ov * clamp((t - o.ghostCorner.at) / 0.35) * (o.ghostCorner.outAt == null ? 1 : 1 - clamp((t - o.ghostCorner.outAt) / 0.3));
        const res = o.ghostCorner.resolveAt != null ? BTO.sp(t, o.ghostCorner.resolveAt, "snap") : 0; const x = half - 3.5 * m, y = half - 3.5 * m, q = 3.4 * m;
        if (gk > 0) { const pts = [P(x - q, y - q, 1), P(x + q, y - q, 1), P(x + q, y + q, 1), P(x - q, y + q, 1)];
          if (o.ghostCorner.fill !== false) g += `<path d="${poly(pts)}" fill="${paper}" opacity="${(0.85 * gk).toFixed(3)}"/>`;
          g += `<path d="${poly(pts)}" fill="none" stroke="${res > 0.01 ? C.teal : C.amber}" stroke-width="7" stroke-dasharray="20 14" stroke-dashoffset="${(-(t - o.ghostCorner.at) * 34).toFixed(1)}" opacity="${gk.toFixed(3)}"/>`;
          const ctr = P(x, y, 1); if (res < 0.99) g += BTO.text(ctr[0], ctr[1] + 4.2 * m * ctr[2] * 0.45, "?", { size: 4.6 * m * ctr[2], weight: 700, family: BTO.style.type.serif, fill: C.amberDeep, op: gk * (1 - res), extra: 'data-decor="1"' });
          if (res > 0.01) { const a = P(x - 1.6 * m, y + 0.1 * m, 1), b = P(x - 0.4 * m, y + 1.4 * m, 1), d = P(x + 1.8 * m, y - 1.4 * m, 1); g += `<path d="M${a[0]} ${a[1]} L${b[0]} ${b[1]} L${d[0]} ${d[1]}" stroke="${C.teal}" stroke-width="14" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="${(res * gk).toFixed(3)}"/>`; } } }
      // links
      if (o.links && t >= o.links.at) { const k = ov * BTO.ease("standard", p(t, o.links.at, o.links.at + 0.55)) * (o.links.outAt == null ? 1 : 1 - clamp((t - o.links.outAt) / 0.3)); const [a, b, d] = fc.map((q) => P(q.x, q.y, 2));
        g += BTO.draw(`M${b[0]} ${b[1]} L${a[0]} ${a[1]} L${d[0]} ${d[1]}`, k, { width: 7, op: 0.95 }); }
      // locks (upright in world space at the projected finder centres)
      (o.locks || []).forEach((l) => { if (t < l.at) return; const k = l.at <= 0.05 ? 1 : BTO.sp(t, l.at, "snap"); const op = ov * clamp(l.at <= 0.05 ? 1 : (t - l.at) / 0.12) * (l.outAt == null ? 1 : 1 - clamp((t - l.outAt) / 0.25)); if (op <= 0) return;
        const q = P(fc[l.finder].x, fc[l.finder].y, 0); const hs = m * c.s * q[2] * lerp(7.4, 4.7, k), L = m * c.s * q[2] * 1.7;
        g += `<g transform="translate(${q[0].toFixed(1)} ${q[1].toFixed(1)})" opacity="${op.toFixed(3)}">` + [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy]) => `<path d="M${sx * hs} ${sy * (hs - L)} V${sy * hs} H${sx * (hs - L)}" stroke="${l.color ? C[l.color] || l.color : C.amber}" stroke-width="9" fill="none" stroke-linecap="round"/>`).join("") + "</g>"; });
      // exploded-layer labels (leader lines from the layers' right corners)
      if (o.explode && ek > 0.05) (o.explode.labels || []).forEach((L) => { if (t < L.at) return; const k = clamp((t - L.at) / 0.4) * (o.explode.collapseAt == null ? 1 : 1 - clamp((t - o.explode.collapseAt + 0.25) / 0.25)); if (k <= 0) return;
        const f = fc[o.explode.finder]; const gap = (o.explode.gap || 2.4) * m * ek; const sz = [7, 5, 3][L.layer] * m / 2; const a = P(f.x + sz, f.y, gap * L.layer + 0.32 * m);
        g += BTO.label(a[0], a[1], L.lx, L.ly != null ? L.ly : a[1], L.text, k, { size: L.size || 44, anchor: "start", pill: true }); });
      return `<g opacity="${appear.toFixed(3)}">${g}</g>`;
    } };
  });

  // row-signal: scan line through the code's rows + the current row's runs; finds 1:1:3:1:1 exactly
  // props: geo (qr-3d id), asset, passes [{at, dur}], hold {at, row}, x, y (strip centre), width, height, outAt
  BTO.def("row-signal", (o) => {
    const A = BTO.assets[o.asset]; const n = A.size; const C = BTO.style.palette; const runsByRow = A.matrix.map((_, r) => BTO.rowRuns(A, r));
    const hitRows = runsByRow.map((rs) => BTO.finderSignatures(rs).length > 0);
    // detection times: the moment the pass reaches the centre row of each finder
    const det = []; (o.passes || []).forEach((ps) => A.finders.forEach((f, i) => det.push({ finder: i, t: ps.at + ps.dur * ((f.row + 3.5) / n) })));
    (o.passes || []).forEach((ps) => { BTO.cue(ps.at, "sweep", 0.45, 0, { dur: ps.dur }); for (let r = 0; r < n; r += 3) BTO.cue(ps.at + ps.dur * r / n, "tick", 0.16, -0.4 + 0.8 * r / n); });
    det.forEach((d) => BTO.cue(d.t, "match", 0.45, [-0.5, 0.5, -0.5][d.finder]));
    const rowAt = (t) => { for (const ps of o.passes || []) if (t >= ps.at && t < ps.at + ps.dur) return Math.min(n - 1, Math.floor((t - ps.at) / ps.dur * n)); if (o.hold && t >= o.hold.at) return o.hold.row; return null; };
    return { draw: (t) => {
      const op = (o.enterAt == null ? 1 : clamp((t - o.enterAt) / 0.25)) * (o.outAt == null ? 1 : 1 - clamp((t - o.outAt) / 0.3)); if (op <= 0) return "";
      const r = rowAt(t); const geo = BTO.geo[o.geo]; let g = "";
      if (r != null && geo) { const [a, b] = geo.row(t, r); const scanning = (o.passes || []).some((ps) => t >= ps.at && t < ps.at + ps.dur);
        const col = hitRows[r] ? C.amber : "#7fe3ff"; g += `<line x1="${a[0] - 40}" y1="${a[1]}" x2="${b[0] + 40}" y2="${b[1]}" stroke="${col}" stroke-width="${scanning ? 6 : 4}" opacity="0.95"/><rect x="${a[0] - 40}" y="${a[1] - 22}" width="${b[0] - a[0] + 80}" height="44" fill="${col}" opacity="0.13"/>`; }
      // detection marks on the finders
      if (geo) { const cs = geo.at(t); det.forEach((d) => { if (t < d.t) return; const k = BTO.sp(t, d.t, "snap"); const c = cs[d.finder]; const R = geo.module * c.k * 4.6 * (1.25 - 0.25 * k);
        g += `<rect x="${(c.x - R).toFixed(1)}" y="${(c.y - R).toFixed(1)}" width="${(2 * R).toFixed(1)}" height="${(2 * R).toFixed(1)}" fill="none" stroke="${C.amber}" stroke-width="8" opacity="${clamp(k * 1.5).toFixed(3)}"/>`; }); }
      // the strip: the current row as the scanner reads it
      if (r != null) { const rs = runsByRow[r]; const tot = rs.reduce((s, x) => s + x.n, 0); const W = o.width || 920, H = o.height || 70; let x = o.x - W / 2; const y0 = o.y - H / 2;
        g += `<rect x="${o.x - W / 2 - 16}" y="${y0 - 16}" width="${W + 32}" height="${H + 32}" rx="10" fill="#111" stroke="#2c2c2c" stroke-width="2"/>`;
        const hits = BTO.finderSignatures(rs); const xs = [];
        rs.forEach((run) => { const w = W * run.n / tot; xs.push(x); g += `<rect x="${x.toFixed(2)}" y="${y0}" width="${w.toFixed(2)}" height="${H}" fill="${run.dark ? "#000" : "#f4f4f4"}"/>`; x += w; }); xs.push(x);
        hits.forEach((i) => { const xa = xs[i], xb = xs[i + 5]; g += `<rect x="${(xa - 4).toFixed(1)}" y="${y0 - 8}" width="${(xb - xa + 8).toFixed(1)}" height="${H + 16}" fill="none" stroke="${C.amber}" stroke-width="7"/>`; });
        g += BTO.text(o.x - W / 2, y0 - 34, o.title || "WHAT THE SCANNER READS", { size: 34, weight: 800, fill: "#cfcfcf", anchor: "start", ls: 2.5 });
        // below the strip, left-aligned: clear of the Shorts right-hand buttons
        if (hits.length) g += BTO.text(o.x - W / 2, y0 + H + 66, o.foundText || "PATTERN FOUND", { size: 38, weight: 800, fill: C.amber, anchor: "start", ls: 2.5 }); }
      return `<g opacity="${op.toFixed(3)}">${g}</g>`;
    } };
  });
})(window.BTO);
