// BTO Premium Studio - ground-frame: inertia seen from the surface (ImpossibleBrief planet-rotation and any "the ground
//   stops, you don't" mechanism). The camera rides with the person and the air, so before the stop nothing moves; when the
//   ground stops, the ground and everything fixed to it (buildings, trees, hills with parallax) rush backwards past a
//   person who keeps the old speed. Optional vectors show the forces: gravity straight down, velocity along the motion.
//   props: stopAt (t; the ground stops - a time before the scene start means it is already sliding), speed (px/s of the
//     ground after the stop, default 2400), gy (ground line y), fx (person x), height (person px), tumble (bool: the feet
//     are caught by the ground and the person pitches forward and rolls), hop (px), seed,
//     velocity { at, label, color } (arrow from the person along the motion), gravity { at, label, color } (arrow down),
//     groundTag { at, label } (a pill fixed to the stopped ground), sky (bool, default true).
//   Every frame is a pure function of t. Scenes using it are illustrations (ILLUSTRATION / CONCEPTUAL chip): sizes and
//   speeds on screen are not to scale; any number shown must come from the scene's cited facts.
(function (BTO) {
  "use strict";
  const { clamp, lerp } = BTO;
  const n1 = (v) => (+v).toFixed(1);
  const fade = (t, a, b, d = 0.35) => (a == null ? 1 : clamp((t - a) / d)) * (b == null ? 1 : 1 - clamp((t - b) / d));
  const arrow = (x0, y0, x1, y1, col, w) => { const a = Math.atan2(y1 - y0, x1 - x0); const hx = x1 - Math.cos(a) * w * 1.6, hy = y1 - Math.sin(a) * w * 1.6;
    return `<line x1="${n1(x0)}" y1="${n1(y0)}" x2="${n1(hx)}" y2="${n1(hy)}" stroke="#000" stroke-opacity="0.45" stroke-width="${w + 6}" stroke-linecap="round"/>`
      + `<line x1="${n1(x0)}" y1="${n1(y0)}" x2="${n1(hx)}" y2="${n1(hy)}" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/>`
      + `<path d="M${n1(x1)} ${n1(y1)} L${n1(hx + Math.cos(a + 1.57) * w * 1.5)} ${n1(hy + Math.sin(a + 1.57) * w * 1.5)} L${n1(hx + Math.cos(a - 1.57) * w * 1.5)} ${n1(hy + Math.sin(a - 1.57) * w * 1.5)}Z" fill="${col}"/>`; };

  BTO.def("ground-frame", (o) => {
    const r = BTO.rng(o.seed || 17); const W = 2600; const things = []; let x = 0;
    while (x < W) { const tree = r() < 0.35; things.push({ x, tree, w: tree ? 40 + r() * 30 : 90 + r() * 140, h: tree ? 90 + r() * 70 : 160 + r() * 360, win: r() }); x += (tree ? 70 : 150) + r() * 140; }
    const hills = []; for (let i = 0; i < 9; i += 1) hills.push({ x: i * 340 + r() * 120, w: 380 + r() * 260, h: 90 + r() * 120 });
    const stopAt = o.stopAt == null ? 0 : o.stopAt; if (o.stopAt != null && o.stopAt >= 0) { BTO.cue(stopAt, "drop", 0.6); BTO.cue(stopAt + 0.1, "whoosh", 0.5); }
    if (o.gravity) BTO.cue(o.gravity.at || 0, "pluck", 0.35); if (o.velocity) BTO.cue(o.velocity.at || 0, "lift", 0.3);
    const V = o.speed || 2400;
    // distance the ground has slid back by t: zero before the stop, then a very short (0.15 s) jolt up to full speed
    const slid = (t) => { const u = t - stopAt; if (u <= 0) return 0; const ramp = 0.15; return u < ramp ? V * u * u / (2 * ramp) : V * (ramp / 2 + (u - ramp)); };
    return { draw: (t) => {
      const op = fade(t, o.enterAt, o.outAt); if (op <= 0) return ""; const C = BTO.style.palette;
      const gy = o.gy || 1180; const fx = o.fx || 430; const H = o.height || 250; const s = slid(t); const moving = t > stopAt;
      const speedNow = moving ? Math.min(1, (t - stopAt) / 0.15) : 0; let g = "";
      if (o.sky !== false) g += `<defs><linearGradient id="gfsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#071526"/><stop offset="0.7" stop-color="#16395a"/><stop offset="1" stop-color="#3a6a86"/></linearGradient></defs><rect x="0" y="0" width="1080" height="${gy}" fill="url(#gfsky)"/>`;
      // far hills (parallax 0.25) and buildings/trees (parallax 1) slide back once the ground has stopped
      hills.forEach((h) => { const hx = (((h.x - s * 0.25) % 3060) + 3060) % 3060 - 400; g += `<path d="M${n1(hx)} ${gy} Q${n1(hx + h.w / 2)} ${n1(gy - h.h * 2)} ${n1(hx + h.w)} ${gy}Z" fill="#1d3a4a" opacity="0.9"/>`; });
      things.forEach((b) => { const bx = (((b.x - s) % W) + W) % W - 300; if (bx < -320 || bx > 1200) return; const blur = speedNow * 260;
        if (blur > 4) g += `<rect x="${n1(bx)}" y="${n1(gy - b.h)}" width="${n1(b.w + blur)}" height="${n1(b.h)}" fill="#0f2231" opacity="0.35"/>`;
        if (b.tree) g += `<rect x="${n1(bx + b.w / 2 - 6)}" y="${n1(gy - b.h * 0.4)}" width="12" height="${n1(b.h * 0.4)}" fill="#0c1a12"/><ellipse cx="${n1(bx + b.w / 2)}" cy="${n1(gy - b.h * 0.62)}" rx="${n1(b.w / 2 + 10)}" ry="${n1(b.h * 0.4)}" fill="#163a26"/>`;
        else { g += `<rect x="${n1(bx)}" y="${n1(gy - b.h)}" width="${n1(b.w)}" height="${n1(b.h)}" fill="#13283a"/>`;
          for (let wy = gy - b.h + 22; wy < gy - 30; wy += 38) for (let wx = bx + 16; wx < bx + b.w - 20; wx += 30) if (((wx * 7 + wy * 3) | 0) % 5 < 2) g += `<rect x="${n1(wx)}" y="${n1(wy)}" width="12" height="16" fill="${C.amber}" opacity="${n1(0.35 + b.win * 0.4)}"/>`; } });
      // the ground itself, with lane marks that streak once it slides
      g += `<rect x="0" y="${gy}" width="1080" height="${1920 - gy}" fill="#101a14"/><rect x="0" y="${gy}" width="1080" height="10" fill="#2e4a34"/>`;
      for (let i = -2; i < 14; i += 1) { const lx = ((i * 120 - s) % 1440 + 1440) % 1440 - 180; g += `<rect x="${n1(lx)}" y="${gy + 80}" width="${n1(60 + speedNow * 120)}" height="8" fill="#e8e2d0" opacity="${n1(0.5 - speedNow * 0.2)}"/>`; }
      // the person: stands, then (tumble) the feet are caught and the body pitches forward and rolls along the motion
      const u = Math.max(0, t - stopAt - 0.05); const ang = o.tumble && moving ? Math.min(75, u * 420) + Math.max(0, u - 0.18) * 260 : 0;
      const hop = o.tumble && moving ? Math.abs(Math.sin(u * 3.2)) * (o.hop == null ? 70 : o.hop) * Math.exp(-u * 0.4) : 0;
      const cx = fx, cy = gy - H * 0.5 - hop; const col = "#e9eef2";
      const person = `<g transform="rotate(${n1(ang)} ${n1(cx)} ${n1(cy)})"><rect x="${n1(cx - H * 0.09)}" y="${n1(cy - H * 0.28)}" width="${n1(H * 0.18)}" height="${n1(H * 0.42)}" rx="${n1(H * 0.08)}" fill="${col}"/>`
        + `<circle cx="${n1(cx)}" cy="${n1(cy - H * 0.4)}" r="${n1(H * 0.1)}" fill="${col}"/>`
        + `<path d="M${n1(cx - H * 0.05)} ${n1(cy + H * 0.1)} L${n1(cx - H * 0.12)} ${n1(cy + H * 0.5)} M${n1(cx + H * 0.05)} ${n1(cy + H * 0.1)} L${n1(cx + H * 0.12)} ${n1(cy + H * 0.5)}" stroke="${col}" stroke-width="${n1(H * 0.075)}" stroke-linecap="round"/>`
        + `<path d="M${n1(cx - H * 0.07)} ${n1(cy - H * 0.2)} L${n1(cx - H * 0.24)} ${n1(cy - H * (moving ? 0.34 : 0.0))} M${n1(cx + H * 0.07)} ${n1(cy - H * 0.2)} L${n1(cx + H * 0.24)} ${n1(cy - H * (moving ? 0.34 : 0.0))}" stroke="${col}" stroke-width="${n1(H * 0.06)}" stroke-linecap="round"/></g>`;
      g += `<ellipse cx="${n1(cx)}" cy="${gy + 4}" rx="${n1(H * 0.2 * (1 - hop / 200))}" ry="8" fill="#000" opacity="0.4"/>` + person;
      const lab = (txt, x0, y0, col2, k, anchor = "start") => BTO.label(x0, y0, x0 + (anchor === "start" ? 30 : -30), y0 - 70, txt, k, { size: BTO.style.type.scale.label, pill: true, color: col2, anchor });
      if (o.velocity && t >= (o.velocity.at || 0)) { const k = BTO.ep(t, o.velocity.at || 0, (o.velocity.at || 0) + 0.6, "decelerate") * fade(t, null, o.velocity.outAt); const col2 = C[o.velocity.color || "amber"] || C.amber;
        const x0 = cx + H * 0.3, x1 = x0 + 360 * k; g += arrow(x0, cy, x1, cy, col2, 16); if (o.velocity.label) g += lab(o.velocity.label, x1 - 20, cy - 26, col2, clamp(k * 1.5 - 0.3), "end"); }
      if (o.gravity && t >= (o.gravity.at || 0)) { const k = BTO.ep(t, o.gravity.at || 0, (o.gravity.at || 0) + 0.6, "decelerate") * fade(t, null, o.gravity.outAt); const col2 = C[o.gravity.color || "teal"] || C.teal;
        const y0 = cy + H * 0.2, y1 = Math.min(1290, y0 + 200) * k + y0 * (1 - k); g += arrow(cx, y0, cx, y1, col2, 16);
        // the label sits beside the arrow's middle, above the caption band (render IB-EAR-001 v2: it sat on the captions)
        if (o.gravity.label) g += BTO.label(cx + 14, (y0 + y1) / 2, cx + 110, (y0 + y1) / 2 + 10, o.gravity.label, clamp(k * 1.5 - 0.3), { size: BTO.style.type.scale.label, pill: true, color: col2 }); }
      if (o.groundTag && t >= (o.groundTag.at || 0)) { const k = clamp((t - o.groundTag.at) / 0.4) * fade(t, null, o.groundTag.outAt); g += BTO.label(330, gy + 40, 300, gy + 120, o.groundTag.label, k, { size: BTO.style.type.scale.label, pill: true, color: "#e8e2d0" }); }
      return `<g opacity="${op.toFixed(3)}">${g}</g>`;
    } };
  });
})(window.BTO);
