// BTO Premium Studio - qr-symbol: draws a real 2D matrix code from data (BTO.assets[asset].matrix) and animates it.
// Geometry is exact: modules come from the encoder; finder patterns are drawn as the nested dark/light/dark squares
// they are in the matrix. Nothing about the symbol is invented, so the on-screen code decodes (checked in QA).
//
// props: asset, id, cx, cy, module, card, rotateKeys [[at,deg]], scaleKeys [[at,s]], dataOpacityKeys [[at,o]],
//        dissolve {at,dur,origin}, assemble {at,dur,origin: center|finder0}, read {at,dur},
//        finderHighlight {at,outAt}, locks [{at,finder,outAt}], links {at,outAt}, ghostCorner {at,resolveAt,outAt},
//        explode {finder,at,collapseAt}, show {finders:[0,1,2], data:true}, finderOpacity {i: [[at,o]]}, overlaysOutAt
(function (BTO) {
  "use strict";
  const { clamp, lerp, p } = BTO;
  BTO.def("qr-symbol", (o, scene) => {
    const A = BTO.assets[o.asset]; if (!A) throw new Error("qr-symbol: no asset " + o.asset);
    const n = A.size, m = o.module || 36, half = (n * m) / 2; const C = BTO.style.palette;
    const inFinder = (r, c) => A.finders.some((f) => r >= f.row && r < f.row + 7 && c >= f.col && c < f.col + 7);
    const data = []; A.matrix.forEach((row, r) => [...row].forEach((v, c) => { if (v === "1" && !inFinder(r, c)) data.push({ r, c }); }));
    const fc = (f) => ({ x: (f.col + 3.5) * m - half, y: (f.row + 3.5) * m - half }); // finder centre, symbol coords
    const origin = (name) => (name === "finder0" ? fc(A.finders[0]) : { x: 0, y: 0 });
    const delays = (org, spread) => { const o0 = origin(org); const ds = data.map((d) => Math.hypot((d.c + 0.5) * m - half - o0.x, (d.r + 0.5) * m - half - o0.y)); const mx = Math.max(...ds); return ds.map((x) => (x / mx) * spread); };
    const dz = o.dissolve ? delays(o.dissolve.origin || "center", (o.dissolve.dur || 1) * 0.7) : null;
    const az = o.assemble ? delays(o.assemble.origin || "center", (o.assemble.dur || 0.8) * 0.7) : null;
    const show = { finders: [0, 1, 2], data: true, ...(o.show || {}) };
    // audio: a scatter of soft ticks while modules move, clicks for locks, a sweep for reading
    if (o.dissolve) for (let i = 0; i < 10; i += 1) BTO.cue(o.dissolve.at + (o.dissolve.dur || 1) * 0.75 * i / 9, "tick", 0.32 - i * 0.015, (i % 3 - 1) * 0.4);
    if (o.assemble) for (let i = 0; i < 8; i += 1) BTO.cue(o.assemble.at + (o.assemble.dur || 0.8) * 0.7 * i / 7, "tick", 0.28, (i % 3 - 1) * 0.4);
    if (o.read) BTO.cue(o.read.at, "read", 0.6, 0, { dur: o.read.dur || 0.7 });
    (o.locks || []).forEach((l) => BTO.cue(l.at + 0.08, "lock", 0.75, [-0.5, 0.5, -0.5][l.finder] || 0));
    if (o.finderHighlight) [0, 1, 2].forEach((i) => BTO.cue(o.finderHighlight.at + i * 0.12, "pop", 0.4, [-0.5, 0.5, -0.5][i]));
    if (o.ghostCorner) { BTO.cue(o.ghostCorner.at, "tick", 0.5, 0.5); if (o.ghostCorner.resolveAt != null) BTO.cue(o.ghostCorner.resolveAt, "chime", 0.8); }
    if (o.explode) { BTO.cue(o.explode.at, "lift", 0.8); if (o.explode.collapseAt != null) BTO.cue(o.explode.collapseAt, "drop", 0.6); }

    const rotAt = (t) => (o.rotateKeys ? BTO.keys(t, o.rotateKeys, "inOut") : o.rotate || 0);
    const scaleAt = (t) => (o.scaleKeys ? BTO.keys(t, o.scaleKeys) : 1);
    // world geometry for other components (finder centres at time t) and the run-length of a horizontal line
    // through finder 0's centre: concentric squares scale every crossing by 1/max(|cos|,|sin|), so the
    // dark:light:dark:light:dark ratio is the same at every angle; only the total length changes.
    const gid = o.id || scene.id + "-qr";
    BTO.geo[gid] = { at: (t) => { const th = rotAt(t) * Math.PI / 180, s = scaleAt(t); return A.finders.map((f) => { const c = fc(f); return { x: o.cx + s * (c.x * Math.cos(th) - c.y * Math.sin(th)), y: o.cy + s * (c.x * Math.sin(th) + c.y * Math.cos(th)) }; }); }, module: m, size: n };
    BTO.runsFrom[gid + ":finder0"] = (t) => { const th = rotAt(t) * Math.PI / 180; const f = 1 / Math.max(Math.abs(Math.cos(th)), Math.abs(Math.sin(th))); return { runs: [1, 1, 3, 1, 1].map((x) => x * f), width: 7 * m * scaleAt(t) * f * (o.stripScale || 1), factor: f }; };

    const sq = (x, y, s) => `M${x.toFixed(2)} ${y.toFixed(2)}h${s.toFixed(2)}v${s.toFixed(2)}h${(-s).toFixed(2)}z`;
    const finderFlat = (f, fill = C.ink) => { const x = f.col * m - half, y = f.row * m - half;
      return `<path d="${sq(x, y, 7 * m)}${sq(x + m, y + m, 5 * m)}" fill="${fill}" fill-rule="evenodd"/><path d="${sq(x + 2 * m, y + 2 * m, 3 * m)}" fill="${fill}"/>`; };

    return { draw: (t) => {
      let g = ""; const th = rotAt(t), s = scaleAt(t); const ov = o.overlaysOutAt == null ? 1 : 1 - clamp((t - o.overlaysOutAt) / 0.4);
      const appear = o.enterAt == null ? 1 : clamp((t - o.enterAt) / 0.3); if (appear <= 0) return "";
      if (o.card !== false) { const q = (o.quiet == null ? 2.2 : o.quiet) * m; const cardOp = o.cardOpacityKeys ? BTO.keys(t, o.cardOpacityKeys) : 1;
        if (cardOp > 0) g += `<g opacity="${cardOp.toFixed(3)}"><rect x="${-half - q}" y="${-half - q}" width="${2 * (half + q)}" height="${2 * (half + q)}" rx="${m * 0.5}" fill="${C.paper}" filter="url(#shadow)"/><rect x="${-half - q}" y="${-half - q}" width="${2 * (half + q)}" height="${2 * (half + q)}" rx="${m * 0.5}" fill="url(#paperShade)"/></g>`; }
      // data modules
      const dOp = show.data === false ? 0 : (o.dataOpacityKeys ? BTO.keys(t, o.dataOpacityKeys) : 1) * (o.explode ? 1 - 0.7 * explodeK(t) : 1);
      if (dOp > 0.001) {
        const readK = o.read ? p(t, o.read.at, o.read.at + (o.read.dur || 0.7)) : -1; const band = readK * (n + 6) - 3;
        let flat = "", moving = "";
        data.forEach((d, i) => {
          let sc = 1;
          if (o.dissolve && t >= o.dissolve.at) sc = 1 - BTO.ease("accelerate", clamp((t - o.dissolve.at - dz[i]) / 0.28));
          if (o.assemble) { if (t < o.assemble.at) sc = o.dissolve && t >= o.dissolve.at ? sc : 0; else sc = BTO.spring(t - o.assemble.at - az[i], BTO.style.motion.spring.snap); }
          const x = d.c * m - half, y = d.r * m - half;
          const hot = readK > 0 && readK < 1 ? Math.exp(-Math.pow((d.r - band) / 1.6, 2)) : 0;
          if (sc >= 0.999 && hot < 0.02) { flat += sq(x, y, m); return; }
          if (sc <= 0.01) return; const ss = m * Math.min(sc, 1.08); const fill = hot > 0.02 ? mix(C.ink, C.amber, hot) : C.ink;
          moving += `<path d="${sq(x + (m - ss) / 2, y + (m - ss) / 2, ss)}" fill="${fill}"/>`;
        });
        g += `<g opacity="${dOp.toFixed(3)}"><path d="${flat}" fill="${C.ink}"/>${moving}</g>`;
      }
      // finders (flat, or the exploded stack for one of them)
      const ek = o.explode ? explodeK(t) : 0;
      A.finders.forEach((f, i) => { if (!show.finders.includes(i)) return; if (o.explode && o.explode.finder === i && ek > 0.003) return;
        const fo = o.finderOpacity && o.finderOpacity[i] ? BTO.keys(t, o.finderOpacity[i]) : 1; if (fo <= 0.001) return; g += fo < 1 ? `<g opacity="${fo.toFixed(3)}">${finderFlat(f)}</g>` : finderFlat(f); });
      // ghost corner (where a fourth finder would be)
      if (o.ghostCorner && t >= o.ghostCorner.at) { const gk = ov * clamp((t - o.ghostCorner.at) / 0.35) * (o.ghostCorner.outAt == null ? 1 : 1 - clamp((t - o.ghostCorner.outAt) / 0.3));
        const res = o.ghostCorner.resolveAt != null ? BTO.sp(t, o.ghostCorner.resolveAt, "snap") : 0; const x = (n - 7) * m - half, y = (n - 7) * m - half, S = 7 * m;
        if (gk > 0) { g += (o.ghostCorner.fill === false ? "" : `<rect x="${x + 4}" y="${y + 4}" width="${S - 8}" height="${S - 8}" fill="${C.paper}" opacity="${(0.82 * gk).toFixed(3)}"/>`) + `<rect x="${x + 4}" y="${y + 4}" width="${S - 8}" height="${S - 8}" fill="none" stroke="${res > 0.01 ? C.teal : C.amber}" stroke-width="6" stroke-dasharray="18 14" stroke-dashoffset="${(-(t - o.ghostCorner.at) * 30).toFixed(2)}" opacity="${gk.toFixed(3)}"/>`;
          if (res < 0.99) g += BTO.text(x + S / 2, y + S / 2 + S * 0.2, "?", { size: S * 0.6, weight: 700, family: BTO.style.type.serif, fill: C.amberDeep, op: gk * (1 - res), extra: "data-decor=\"1\"" });
          if (res > 0.01) g += `<path d="M${x + S * 0.26} ${y + S * 0.52} L${x + S * 0.44} ${y + S * 0.7} L${x + S * 0.76} ${y + S * 0.32}" stroke="${C.teal}" stroke-width="12" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="${res.toFixed(3)}"/>`; } }
      // finder highlight outlines
      if (o.finderHighlight && t >= o.finderHighlight.at) A.finders.forEach((f, i) => { if (!show.finders.includes(i)) return; const k = ov * clamp((t - o.finderHighlight.at - i * 0.12) / 0.42) * (o.finderHighlight.outAt == null ? 1 : 1 - clamp((t - o.finderHighlight.outAt) / 0.3));
        const x = f.col * m - half - m * 0.45, y = f.row * m - half - m * 0.45, S = 7.9 * m; g += BTO.draw(`M${x} ${y} h${S} v${S} h${-S} z`, k, { width: 7, cap: "butt" }); });
      // links between finder centres (the triangle a reader solves orientation from)
      if (o.links && t >= o.links.at) { const k = ov * BTO.ease("standard", p(t, o.links.at, o.links.at + 0.6)) * (o.links.outAt == null ? 1 : 1 - clamp((t - o.links.outAt) / 0.3)); const [a, b, c] = A.finders.map(fc);
        g += BTO.draw(`M${b.x} ${b.y} L${a.x} ${a.y} L${c.x} ${c.y}`, k, { width: 6, stroke: C.amber, op: 0.9 }); }
      let out = `<g transform="translate(${o.cx} ${o.cy}) rotate(${th.toFixed(4)}) scale(${s.toFixed(5)})" opacity="${appear.toFixed(3)}">${g}</g>`;
      // lock brackets (drawn upright in world space at the finder's current centre, so they read as the reader's marks)
      const geo = BTO.geo[gid].at(t);
      (o.locks || []).forEach((l) => { if (t < l.at) return; const k = BTO.sp(t, l.at, "snap"); const op = ov * clamp((t - l.at) / 0.12) * (l.outAt == null ? 1 : 1 - clamp((t - l.outAt) / 0.25)); if (op <= 0) return;
        const c = geo[l.finder]; const hs = m * s * lerp(7.5, 4.6, k), L = m * s * 1.6;
        out += `<g transform="translate(${c.x.toFixed(1)} ${c.y.toFixed(1)})" opacity="${op.toFixed(3)}">` + [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy]) => `<path d="M${sx * hs} ${sy * (hs - L)} V${sy * hs} H${sx * (hs - L)}" stroke="${C.amber}" stroke-width="7" fill="none" stroke-linecap="round"/>`).join("") + "</g>"; });
      // exploded finder stack (world space, upright iso stack above the finder's position)
      if (o.explode && ek > 0.003) { const c = geo[o.explode.finder]; const S = m * s;
        out += BTO.isoStack([{ w: 7 * S, h: 7 * S, inner: { w: 5 * S, h: 5 * S }, fill: C.ink }, { w: 5 * S, h: 5 * S, inner: { w: 3 * S, h: 3 * S }, fill: C.paper2, stroke: C.inkSoft, strokeWidth: 2 }, { w: 3 * S, h: 3 * S, fill: C.ink }], ek, { cx: c.x, cy: c.y, gap: (o.explode.gap || 2.6) * S }); }
      return out;
    } };

    function explodeK(t) { const e = o.explode; if (!e || t < e.at) return 0; const up = BTO.sp(t, e.at, "settle"); return e.collapseAt == null || t < e.collapseAt ? up : up * (1 - BTO.ease("inOut", p(t, e.collapseAt, e.collapseAt + 0.5))); }
    function mix(a, b, k) { const h = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16)); const x = h(a), y = h(b); return "#" + x.map((v, i) => Math.round(lerp(v, y[i], clamp(k))).toString(16).padStart(2, "0")).join(""); }
  });
})(window.BTO);
