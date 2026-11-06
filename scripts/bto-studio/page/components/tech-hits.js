// BTO Premium Studio - tech-hits: the technology a space-weather line names, around a globe (ImpossibleBrief magnetic
//   world; IB-EAR-019 review: "Satellites and power grids would take more charged particles" showed no satellite or grid).
//   Two satellites on inclined orbits and a power line standing on the globe's limb; from hitAt the arriving particles
//   strike them: panels flash, sparks burst, the line flickers. props: cx, cy, r (the globe), hitAt, satellites (bool,
//   default true), grid (bool, default true), labels { satellites, grid } (text, shown from hitAt), enterAt, outAt.
//   Illustrative (sizes and orbits not to scale). Every frame is a pure function of t.
(function (BTO) {
  "use strict";
  const { clamp } = BTO;
  const n1 = (v) => (+v).toFixed(1);
  const fade = (t, a, b, d = 0.35) => (a == null ? 1 : clamp((t - a) / d)) * (b == null ? 1 : 1 - clamp((t - b) / d));
  BTO.def("tech-hits", (o) => {
    if (o.hitAt != null) { BTO.cue(o.hitAt, "tick", 0.4); BTO.cue(o.hitAt + 0.5, "tick", 0.3); }
    return { draw: (t) => {
      const op = fade(t, o.enterAt, o.outAt); if (op <= 0) return ""; const C = BTO.style.palette; const X = o.cx || 540, Y = o.cy || 820, R = o.r || 210; let g = "";
      const hit = o.hitAt == null ? 0 : clamp((t - o.hitAt) / 0.4); const flick = hit > 0 ? 0.5 + 0.5 * Math.sin(t * 31) * Math.sin(t * 7.3) : 0;
      const sat = (a, tilt, rr, i) => { const x = X + Math.cos(a) * rr, y = Y + Math.sin(a) * rr * tilt; const front = Math.sin(a) > -0.15 || Math.hypot(x - X, y - Y) > R;
        if (!front) return ""; const hot = hit > 0 && ((t * 2 + i) % 1.3) < 0.7; let s = `<g transform="translate(${n1(x)} ${n1(y)}) rotate(${n1(a * 20)})">`;
        s += `<rect x="-52" y="-12" width="34" height="24" fill="${hot ? C.coral : "#3d6fa8"}" stroke="#05090d" stroke-width="3"/><rect x="18" y="-12" width="34" height="24" fill="${hot ? C.coral : "#3d6fa8"}" stroke="#05090d" stroke-width="3"/>`;
        s += `<rect x="-16" y="-16" width="32" height="32" rx="4" fill="#d9dde0" stroke="#05090d" stroke-width="3"/><line x1="-18" y1="0" x2="18" y2="0" stroke="#05090d" stroke-width="3"/>`;
        if (hot) for (let k = 0; k < 6; k += 1) { const b = k * 1.05 + t * 9; s += `<line x1="0" y1="0" x2="${n1(Math.cos(b) * 46)}" y2="${n1(Math.sin(b) * 46)}" stroke="${C.amber}" stroke-width="4" opacity="0.9"/>`; }
        return s + "</g>"; };
      if (o.satellites !== false) { g += `<ellipse cx="${X}" cy="${Y}" rx="${n1(R * 1.62)}" ry="${n1(R * 1.62 * 0.32)}" fill="none" stroke="#9fb4c2" stroke-width="2" stroke-dasharray="6 10" opacity="0.5"/>`;
        g += sat(t * 0.55 + 0.6, 0.32, R * 1.62, 0) + sat(t * 0.55 + 3.3, 0.32, R * 1.62, 1); }
      if (o.grid !== false) { // pylons standing radially on the upper-left limb, a sagging line between them
        const base = (deg) => { const a = deg / 57.3; return [X + Math.cos(a) * R, Y + Math.sin(a) * R, a]; };
        const pts = [-150, -137, -124].map(base); const tops = pts.map(([x, y, a]) => [x + Math.cos(a) * 62, y + Math.sin(a) * 62]);
        pts.forEach(([x, y], i) => { const [tx, ty] = tops[i]; g += `<line x1="${n1(x)}" y1="${n1(y)}" x2="${n1(tx)}" y2="${n1(ty)}" stroke="#d9dde0" stroke-width="6"/><circle cx="${n1(tx)}" cy="${n1(ty)}" r="6" fill="#d9dde0"/>`; });
        for (let i = 0; i < 2; i += 1) { const [ax, ay] = tops[i], [bx, by] = tops[i + 1]; const mx = (ax + bx) / 2 + (X - (ax + bx) / 2) * 0.06, my = (ay + by) / 2 + (Y - (ay + by) / 2) * 0.06;
          g += `<path d="M${n1(ax)} ${n1(ay)} Q${n1(mx)} ${n1(my)} ${n1(bx)} ${n1(by)}" fill="none" stroke="${hit > 0 ? C.amber : "#d9dde0"}" stroke-width="4" opacity="${n1(hit > 0 ? 0.35 + 0.65 * flick : 0.9)}"/>`; }
        if (hit > 0) { const [sx, sy] = tops[1]; g += `<circle cx="${n1(sx)}" cy="${n1(sy)}" r="${n1(18 + 14 * flick)}" fill="${C.amber}" opacity="${n1(0.5 * flick)}"/>`; } }
      const lab = o.labels || {}; const lk = clamp((t - (o.hitAt || 0) - 0.2) / 0.5);
      // the satellites' label hangs from the orbit's right edge (a leader to the moving craft swept across the globe)
      if (lab.satellites) g += BTO.label(X + R * 1.62, Y, X + R * 1.45, Y + R + 110, lab.satellites, lk, { size: BTO.style.type.scale.label, pill: true, color: C.coral, anchor: "end" });
      if (lab.grid) { const a = -137 / 57.3; const x = X + Math.cos(a) * (R + 62), y = Y + Math.sin(a) * (R + 62); g += BTO.label(x, y, x - 10, Y - R - 130, lab.grid, lk, { size: BTO.style.type.scale.label, pill: true, color: C.amber, anchor: "start" }); }
      return `<g opacity="${op.toFixed(3)}">${g}</g>`;
    } };
  });
})(window.BTO);
