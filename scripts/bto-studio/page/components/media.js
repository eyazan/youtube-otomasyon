// Premium studio - documentary media: licensed real-world photos (asset registry: scripts/bto-studio/asset-manager.js).
//   image-plate: cover-cropped photo in a box with a Ken Burns camera (kenBurnsKeys: [[at, fx, fy, z]] in image px),
//   an optional warm grade, the attribution on frame, and marks placed in IMAGE pixel coordinates (so overlays sit on
//   the real object): bracket (finder-style corner brackets), ring, ghost (dashed square + "?"), label.
// Images are pre-decoded once (BTO.preload) so a frame is never captured before its photo is painted.
(function (BTO) {
  "use strict";
  const { clamp, lerp } = BTO;
  const pending = [];
  BTO.preload = async () => { await Promise.all(pending.map((src) => { const im = new Image(); im.src = src; return im.decode().catch(() => { throw new Error("image failed to decode: " + src); }); })); };

  BTO.def("image-plate", (o) => {
    const M = (BTO.images || {})[o.asset]; if (!M) throw new Error(`image-plate: asset ${o.asset} not prepared (asset-manager)`);
    pending.push(M.src);
    const box = o.box || { x: 0, y: 0, w: 1080, h: 1920 }; const C = BTO.style.palette;
    (o.marks || []).forEach((mk) => BTO.cue(mk.at, mk.kind === "ghost" ? "pop" : "lock", 0.55));
    const view = (t) => { const k = o.kenBurnsKeys ? BTO.keys(t, o.kenBurnsKeys.map(([at, fx, fy, z]) => [at, [fx, fy, z]]), "camera") : [M.w / 2, M.h / 2, 1];
      const [fx, fy, z] = k; const ar = box.w / box.h; let cw, ch; if (M.w / M.h > ar) { ch = M.h / z; cw = ch * ar; } else { cw = M.w / z; ch = cw / ar; }
      const cx = clamp(fx - cw / 2, 0, M.w - cw), cy = clamp(fy - ch / 2, 0, M.h - ch); return { cx, cy, s: box.w / cw }; };
    BTO.geo[o.id || o.asset] = { toScreen: (t, ix, iy) => { const v = view(t); return [box.x + (ix - v.cx) * v.s, box.y + (iy - v.cy) * v.s, v.s]; } };
    return { draw: (t) => {
      const op = (o.enterAt == null ? 1 : clamp((t - o.enterAt) / 0.3)) * (o.outAt == null ? 1 : 1 - clamp((t - o.outAt) / 0.35)) * (o.opacityKeys ? BTO.keys(t, o.opacityKeys) : 1); if (op <= 0.002) return "";
      const v = view(t); const id = `plate${(o.asset || "").replace(/[^a-z0-9]/gi, "")}`;
      let g = `<clipPath id="${id}"><rect x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}" rx="${o.radius || 0}"/></clipPath><g clip-path="url(#${id})">`;
      g += `<image href="${M.src}" x="${(box.x - v.cx * v.s).toFixed(2)}" y="${(box.y - v.cy * v.s).toFixed(2)}" width="${(M.w * v.s).toFixed(2)}" height="${(M.h * v.s).toFixed(2)}" preserveAspectRatio="none"/>`;
      if (o.grade !== false) g += `<rect x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}" fill="${o.gradeColor || "#3a2410"}" opacity="${o.gradeOpacity == null ? 0.18 : o.gradeOpacity}" style="mix-blend-mode:multiply"/>`;
      g += "</g>";
      // marks in image coordinates
      for (const mk of o.marks || []) { if (t < mk.at) continue; const kk = BTO.sp(t, mk.at, "snap"); const mop = clamp((t - mk.at) / 0.15) * (mk.outAt == null ? 1 : 1 - clamp((t - mk.outAt) / 0.3)); if (mop <= 0) continue;
        const [sx, sy] = [box.x + (mk.ix - v.cx) * v.s, box.y + (mk.iy - v.cy) * v.s]; const S = mk.size * v.s;
        if (mk.kind === "bracket") { const hs = S / 2 * lerp(1.5, 1.08, kk), L = S * 0.26;
          g += `<g transform="translate(${sx.toFixed(1)} ${sy.toFixed(1)}) rotate(${mk.rotate || 0})" opacity="${mop.toFixed(3)}">` + [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => `<path d="M${a * hs} ${b * (hs - L)} V${b * hs} H${a * (hs - L)}" stroke="${C.amber}" stroke-width="10" fill="none" stroke-linecap="round"/>`).join("") + "</g>"; }
        if (mk.kind === "ghost") { const hs = S / 2; g += `<g transform="translate(${sx.toFixed(1)} ${sy.toFixed(1)}) rotate(${mk.rotate || 0})" opacity="${mop.toFixed(3)}"><rect x="${-hs}" y="${-hs}" width="${2 * hs}" height="${2 * hs}" fill="none" stroke="${C.amber}" stroke-width="7" stroke-dasharray="22 16" stroke-dashoffset="${(-(t - mk.at) * 36).toFixed(1)}"/></g>`
          + BTO.text(sx, sy + S * 0.22, "?", { size: S * 0.62, weight: 700, family: BTO.style.type.serif, fill: C.amber, op: mop, extra: 'data-decor="1" paint-order="stroke" stroke="#000" stroke-width="6" stroke-opacity="0.35"' }); }
        if (mk.kind === "label") g += BTO.label(sx, sy, mk.lx, mk.ly, mk.text, clamp((t - mk.at) / 0.4), { size: mk.textSize || 42, pill: true, anchor: mk.anchor || "start" }); }
      // attribution on frame (CC BY needs it; we show it for every licensed asset)
      if (o.credit !== false) g += BTO.text(box.x + 24, box.y + box.h - 26, M.credit, { size: 30, weight: 600, anchor: "start", fill: "#fffaf0", op: 0.85, extra: 'data-role-credit="1" paint-order="stroke" stroke="#000" stroke-width="5" stroke-opacity="0.55"' });
      return `<g opacity="${op.toFixed(3)}">${g}</g>`;
    } };
  });
})(window.BTO);
