// Premium studio - rig-3d: low-poly mechanical objects built from parts, seen through the 2.5D projector.
//   Any jointed object (chair, hinge, lever, cart, latch): parts are boxes, cylinders (wheels, rods) or open wire boxes
//   (baskets, cages), placed in centimetres in a floor frame (x right, y toward the viewer as in the projector: negative y is further away, z up). Each part can
//   enter from an offset on a spring, move, and rotate about its own pivot; children follow their parent, so a seat that
//   folds carries the basket on it. Faces are flat-shaded from one light and depth-sorted (painter's algorithm).
//   yawKeys turn the object itself; rzKeys orbit the camera (and so also swing rollKeys offsets).
//   instances: the whole rig repeated at floor offsets (a row of carts), each with its own enter/exit.
//   labels: leader-line labels anchored to a part's projected centre.
// Geometry is illustrative (proportions from the brief, not a measured drawing): scenes using it carry the
// illustrationLabel chip and mark it conceptual when it stands for an object we have no drawing of.
(function (BTO) {
  "use strict";
  const { clamp, lerp } = BTO;
  const D2R = Math.PI / 180;
  const rot = (q, piv, axis, a) => { if (!a) return q; const c = Math.cos(a * D2R), s = Math.sin(a * D2R); const [x, y, z] = [q[0] - piv[0], q[1] - piv[1], q[2] - piv[2]];
    const r = axis === "x" ? [x, y * c - z * s, y * s + z * c] : axis === "y" ? [x * c + z * s, y, -x * s + z * c] : [x * c - y * s, x * s + y * c, z];
    return [r[0] + piv[0], r[1] + piv[1], r[2] + piv[2]]; };
  const shade = (hex, k) => { const n = parseInt(hex.slice(1), 16); const ch = [n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.round(clamp(v * k, 0, 255)));
    return "#" + ch.map((v) => v.toString(16).padStart(2, "0")).join(""); };

  BTO.def("rig-3d", (o) => {
    const C = BTO.style.palette; const K = (keys, t, d) => (keys ? BTO.keys(t, keys, "camera") : d);
    const parts = o.parts || []; const byId = Object.fromEntries(parts.map((p) => [p.id, p]));
    const L = (() => { const l = o.light || [-0.4, -0.6, 0.7]; const n = Math.hypot(...l); return l.map((v) => v / n); })();
    parts.forEach((pt) => { if (pt.enterAt != null) BTO.cue(pt.enterAt + 0.25, pt.cue || "lock", 0.4); });
    (o.instances || []).forEach((it) => { if (it.enterAt != null) BTO.cue(it.enterAt, "roll", 0.3, 0, { dur: 0.5 }); });
    // part pose at t: own offset (enter spring + moveKeys) and rotation about pivot, then the parent's pose
    const pose = (p, t, q) => {
      let r = rot(q, p.pivot || p.c || [0, 0, 0], p.axis || "x", p.rotKeys ? BTO.keys(t, p.rotKeys, p.rotEase || "inOut") : p.rotate || 0);
      if (p.enterAt != null && p.enterFrom) { const k = t < p.enterAt ? 0 : BTO.sp(t, p.enterAt, p.enterSpring || "settle"); r = [r[0] + p.enterFrom[0] * (1 - k), r[1] + p.enterFrom[1] * (1 - k), r[2] + p.enterFrom[2] * (1 - k)]; }
      if (p.moveKeys) { const m = BTO.keys(t, p.moveKeys.map(([at, x, y, z]) => [at, [x, y, z]]), "inOut"); r = [r[0] + m[0], r[1] + m[1], r[2] + m[2]]; }
      return p.parent && byId[p.parent] ? pose(byId[p.parent], t, r) : r; };
    const visible = (p, t) => (p.enterAt == null || t >= p.enterAt || !p.hideBefore) && (p.outAt == null || t < p.outAt + 0.3) && (!p.parent || !byId[p.parent] || visible(byId[p.parent], t));
    const opOf = (p, t) => (p.enterAt != null && p.hideBefore ? clamp((t - p.enterAt) / 0.2) : 1) * (p.outAt == null ? 1 : 1 - clamp((t - p.outAt) / 0.3)) * (p.parent && byId[p.parent] ? opOf(byId[p.parent], t) : 1);
    // local geometry: list of { pts (rest pose), kind }
    const geom = (p) => { const [cx, cy, cz] = p.c || [0, 0, 0]; const [w, d, h] = p.size || [10, 10, 10]; const F = [];
      if (p.shape === "group") return F;
      if (p.shape === "cyl") { const n = p.sides || 14; const ax = p.cylAxis || "x"; const r = (ax === "x" ? d : w) / 2, len = ax === "x" ? w : d; const ring = (s) => Array.from({ length: n }, (_, i) => { const a = (i / n) * 2 * Math.PI;
          return ax === "x" ? [cx + s * len / 2, cy + r * Math.cos(a), cz + r * Math.sin(a)] : [cx + r * Math.cos(a), cy + s * len / 2, cz + r * Math.sin(a)]; });
        const A = ring(-1), B = ring(1); for (let i = 0; i < n; i += 1) F.push({ pts: [A[i], A[(i + 1) % n], B[(i + 1) % n], B[i]], kind: "side" }); F.push({ pts: A.slice().reverse(), kind: "cap" }); F.push({ pts: B, kind: "cap" }); return F; }
      const x0 = cx - w / 2, x1 = cx + w / 2, y0 = cy - d / 2, y1 = cy + d / 2, z0 = cz - h / 2, z1 = cz + h / 2;
      const faces = { bottom: [[x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [x1, y0, z0]], top: [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], front: [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]],
        back: [[x1, y1, z0], [x0, y1, z0], [x0, y1, z1], [x1, y1, z1]], left: [[x0, y1, z0], [x0, y0, z0], [x0, y0, z1], [x0, y1, z1]], right: [[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]] };
      for (const [k, pts] of Object.entries(faces)) { if (p.shape === "wire" && k === "top") continue; F.push({ pts, kind: k }); } return F; };
    const G = parts.map((p) => ({ p, faces: geom(p) }));
    const insts = o.instances || [{ dx: 0, dy: 0, dz: 0 }];
    BTO.geo[o.id || "rig"] = { parts: byId };
    return { draw: (t) => {
      const op0 = (o.enterAt == null ? 1 : clamp((t - o.enterAt) / 0.3)) * (o.outAt == null ? 1 : 1 - clamp((t - o.outAt) / 0.35)) * (o.opacityKeys ? BTO.keys(t, o.opacityKeys) : 1); if (op0 <= 0.002) return "";
      const P = BTO.projector({ cx: K(o.xKeys, t, o.x || 540), cy: K(o.yKeys, t, o.y || 1100), rx: K(o.rxKeys, t, o.rx == null ? 62 : o.rx), rz: K(o.rzKeys, t, o.rz || 0), D: o.D || 2200, s: K(o.sKeys, t, o.s || 4) });
      const yaw = o.yawKeys ? BTO.keys(t, o.yawKeys, "camera") : o.yaw || 0; // object yaw about its own origin (rz turns the camera, and with it any roll offset)
      const roll = o.rollKeys ? BTO.keys(t, o.rollKeys.map(([at, x, y]) => [at, [x, y]]), "inOut") : [0, 0];
      const polys = []; const shadows = []; const anchors = {};
      insts.forEach((it, ii) => { if (it.enterAt != null && t < it.enterAt) return; const ik = it.enterAt == null ? 1 : BTO.sp(t, it.enterAt, "settle"); const iop = (it.enterAt == null ? 1 : clamp((t - it.enterAt) / 0.25)) * (it.outAt == null ? 1 : 1 - clamp((t - it.outAt) / 0.3)); if (iop <= 0) return;
        const off = [(it.dx || 0) + roll[0] + (it.fromDx || 0) * (1 - ik), (it.dy || 0) + roll[1] + (it.fromDy || 0) * (1 - ik), it.dz || 0];
        const place = (q) => { const r = rot(q, [0, 0, 0], "z", (it.rz || 0) + yaw); return [r[0] + off[0], r[1] + off[1], r[2] + off[2]]; };
        let minx = 1e9, maxx = -1e9, miny = 1e9, maxy = -1e9;
        for (const { p, faces } of G) { if (!visible(p, t)) continue; const pop = opOf(p, t) * iop; if (pop <= 0.01) continue;
          if (ii === 0 && p.id) { const c = place(pose(p, t, p.c || [0, 0, 0])); anchors[p.id] = P(c[0], c[1], c[2]); }
          for (const f of faces) { const w = f.pts.map((q) => place(pose(p, t, q)));
            for (const q of w) { minx = Math.min(minx, q[0]); maxx = Math.max(maxx, q[0]); miny = Math.min(miny, q[1]); maxy = Math.max(maxy, q[1]); }
            const a = [w[1][0] - w[0][0], w[1][1] - w[0][1], w[1][2] - w[0][2]], b = [w[2][0] - w[0][0], w[2][1] - w[0][1], w[2][2] - w[0][2]];
            let n = [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; const nl = Math.hypot(...n) || 1; n = n.map((v) => v / nl);
            const scr = w.map((q) => P(q[0], q[1], q[2])); let area = 0; for (let i = 0; i < scr.length; i += 1) { const u = scr[i], v = scr[(i + 1) % scr.length]; area += u[0] * v[1] - v[0] * u[1]; }
            const wire = p.shape === "wire"; if (!wire && area <= 0) continue; // back face: with screen y down, faces toward the camera have positive signed area
            const lit = 0.55 + 0.45 * Math.max(0, (n[0] * L[0] + n[1] * L[1] + n[2] * L[2]) * (wire && area <= 0 ? -1 : 1)); // L points toward the light
            const depth = scr.reduce((s, q) => s + q[2], 0) / scr.length; polys.push({ scr, depth, col: shade(p.color || C.paper2, lit), p, op: pop, wire, back: area <= 0, w }); } }
        if (o.shadow !== false && maxx > minx) { const pad = 4; shadows.push({ pts: [P(minx - pad, miny - pad, 0), P(maxx + pad, miny - pad, 0), P(maxx + pad, maxy + pad, 0), P(minx - pad, maxy + pad, 0)], op: iop }); } });
      polys.sort((a, b) => a.depth - b.depth);
      const path = (pts) => "M" + pts.map((q) => `${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join("L") + "Z";
      let g = ""; for (const s of shadows) g += `<path d="${path(s.pts)}" fill="#000" opacity="${(0.22 * s.op).toFixed(3)}" filter="url(#soft)"/>`;
      for (const q of polys) {
        if (q.wire) { // open wire mesh: faint fill, rim and a grid of wires in the face
          const n = q.p.grid || 6; let lines = ""; const [A, B, Cc, Dd] = q.scr;
          for (let i = 1; i < n; i += 1) { const u = i / n; const a = [lerp(A[0], B[0], u), lerp(A[1], B[1], u)], b = [lerp(Dd[0], Cc[0], u), lerp(Dd[1], Cc[1], u)], c = [lerp(A[0], Dd[0], u), lerp(A[1], Dd[1], u)], d = [lerp(B[0], Cc[0], u), lerp(B[1], Cc[1], u)];
            lines += `M${a[0].toFixed(1)} ${a[1].toFixed(1)}L${b[0].toFixed(1)} ${b[1].toFixed(1)}M${c[0].toFixed(1)} ${c[1].toFixed(1)}L${d[0].toFixed(1)} ${d[1].toFixed(1)}`; }
          g += `<g opacity="${(q.op * (q.back ? 0.55 : 1)).toFixed(3)}"><path d="${path(q.scr)}" fill="${q.col}" fill-opacity="0.12" stroke="${q.col}" stroke-width="${(q.p.rim || 3.2).toFixed(1)}"/><path d="${lines}" stroke="${q.col}" stroke-width="${(q.p.wireW || 1.8).toFixed(1)}" fill="none"/></g>`;
        } else g += `<path d="${path(q.scr)}" fill="${q.col}" stroke="${shade(q.p.color || C.paper2, 0.45)}" stroke-width="0.8" stroke-linejoin="round" opacity="${q.op.toFixed(3)}"/>`; }
      for (const lb of o.labels || []) { const a = anchors[lb.part]; if (!a || t < lb.at) continue; const k = clamp((t - lb.at) / 0.45) * (lb.outAt == null ? 1 : 1 - clamp((t - lb.outAt) / 0.3)); if (k <= 0) continue;
        g += BTO.label(a[0], a[1], lb.lx, lb.ly, lb.text, k, { size: lb.size || 42, pill: true, anchor: lb.anchor || "start" }); }
      return `<g opacity="${op0.toFixed(3)}">${g}</g>`;
    } };
  });
})(window.BTO);
