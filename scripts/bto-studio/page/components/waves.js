// BTO Premium Studio - aperture versus wavelength (The Hidden Logic of Things: "why a mesh blocks one wave and passes
// another"). The BTO-156 review render (#409) told the microwave door with blank paper cards and quote slides; these draw
// the mechanism the verified record names instead.
//   oven-door      a microwave oven seen from the front: door window with its perforated metal mesh, the lit cavity and a
//                  turning plate; loupeAt opens a magnifier on the mesh (holes visible); shieldAt outlines the metal
//                  enclosure + mesh as one shield; viewAt sends light rays out through the window to the viewer's eye
//   faraday-box    the oven in cutaway: metal walls on five sides, the mesh door on the sixth; a magnetron launches wave
//                  packets that reflect off every wall, the mesh included, so none leaves the box
//   wave-aperture  the mesh in cross-section (bars with small holes): a long-wavelength microwave arrives and reflects,
//                  nothing continues behind the mesh; a short-wavelength light wave passes straight through a hole
// Geometry is illustrative, not to scale (ILLUSTRATION / CONCEPTUAL chip); any number drawn comes from the cited facts.
// Every frame is a pure function of t.
(function (BTO) {
  "use strict";
  const { clamp, lerp } = BTO;
  const n1 = (v) => (+v).toFixed(1);
  const P = () => BTO.style.palette;
  const LBL = () => BTO.style.type.scale.label;
  const fade = (t, a, b, d = 0.35) => (a == null ? 1 : clamp((t - a) / d)) * (b == null ? 1 : 1 - clamp((t - b) / d));
  const MW = "#ff8a3d"; const LIGHT = "#ffe27a"; const METAL = "#9aa6ad";

  // a perforated mesh as a pattern of holes on dark metal (hole pitch px)
  const meshPattern = (id, pitch, r, op = 0.9) => `<pattern id="${id}" width="${pitch}" height="${pitch}" patternUnits="userSpaceOnUse"><rect width="${pitch}" height="${pitch}" fill="#20262a" opacity="${op}"/><circle cx="${pitch / 2}" cy="${pitch / 2}" r="${r}" fill="#000" opacity="0.0"/><circle cx="${pitch / 2}" cy="${pitch / 2}" r="${r}" fill="#ffd28a" opacity="0.55"/></pattern>`;

  // ---- oven-door ------------------------------------------------------------------------------------------------
  // props: x, y (top-left), w, h, on (cavity lit), loupeAt, loupe { x, y, r }, shieldAt, viewAt, label { at, text },
  //   enterAt, outAt
  BTO.def("oven-door", (o) => {
    if (o.loupeAt != null) BTO.cue(o.loupeAt, "lift", 0.4); if (o.shieldAt != null) BTO.cue(o.shieldAt, "pluck", 0.4); if (o.viewAt != null) BTO.cue(o.viewAt, "tick", 0.3);
    return { draw: (t) => {
      const op = fade(t, o.enterAt, o.outAt); if (op <= 0) return ""; const C = P();
      const X = o.x || 110, Y = o.y || 560, W = o.w || 860, H = o.h || 600; const wx = X + 50, wy = Y + 50, ww = W * 0.62, wh = H - 100;
      let g = `<defs>${meshPattern("ovMesh", 14, 3.2)}${meshPattern("ovMeshBig", 64, 17, 1)}<clipPath id="ovLoupe"><circle cx="${(o.loupe || {}).x || wx + ww * 0.55}" cy="${(o.loupe || {}).y || wy + wh * 0.45}" r="${(o.loupe || {}).r || 230}"/></clipPath>
        <radialGradient id="ovGlow" cx="50%" cy="55%" r="60%"><stop offset="0" stop-color="#ffcf7a"/><stop offset="1" stop-color="#7a4a18"/></radialGradient></defs>`;
      // body, control panel
      g += `<rect x="${X}" y="${Y}" width="${W}" height="${H}" rx="34" fill="#c9cfd3" stroke="#1a1f22" stroke-width="5"/><rect x="${X + 14}" y="${Y + 14}" width="${W - 28}" height="${H - 28}" rx="26" fill="none" stroke="#ffffff" stroke-opacity="0.4" stroke-width="3"/>`;
      const px = X + ww + 90; g += `<rect x="${px}" y="${Y + 60}" width="${W - ww - 140}" height="70" rx="10" fill="#0f1a14"/><rect x="${px + 16}" y="${Y + 86}" width="${W - ww - 172}" height="18" rx="4" fill="${C.teal}" opacity="0.7"/>`;
      for (let i = 0; i < 6; i += 1) g += `<circle cx="${px + 40 + (i % 2) * 90}" cy="${Y + 200 + Math.floor(i / 2) * 90}" r="28" fill="#aab3b8" stroke="#1a1f22" stroke-width="3"/>`;
      // window: lit cavity, turning plate with a bowl, then the mesh over it
      const lit = o.on === false ? 0.15 : 1; g += `<rect x="${wx}" y="${wy}" width="${ww}" height="${wh}" rx="18" fill="url(#ovGlow)" opacity="${lit}"/>`;
      const a = t * 0.9; const cx = wx + ww / 2, cy = wy + wh * 0.72; g += `<ellipse cx="${cx}" cy="${cy}" rx="${ww * 0.36}" ry="${wh * 0.08}" fill="#f2efe6" opacity="0.85"/>`;
      g += `<g transform="translate(${n1(cx + Math.sin(a) * ww * 0.12)} ${n1(cy - wh * 0.08)}) scale(${n1(0.9 + 0.1 * Math.cos(a))} 1)"><path d="M-90 0 Q-90 70 0 70 Q90 70 90 0 Z" fill="#3c6e8f"/><ellipse cx="0" cy="0" rx="90" ry="20" fill="#d9773a"/></g>`;
      g += `<rect x="${wx}" y="${wy}" width="${ww}" height="${wh}" rx="18" fill="url(#ovMesh)" opacity="0.55"/><rect x="${wx}" y="${wy}" width="${ww}" height="${wh}" rx="18" fill="none" stroke="#1a1f22" stroke-width="10"/>`;
      g += `<rect x="${X + 20}" y="${Y + 20}" width="${ww + 60}" height="${H - 40}" rx="24" fill="none" stroke="#1a1f22" stroke-width="5"/><rect x="${X + ww + 40}" y="${Y + H * 0.35}" width="22" height="${H * 0.3}" rx="10" fill="#8a949a"/>`;
      // shield: the metal box and the mesh glow as one enclosure
      if (o.shieldAt != null && t >= o.shieldAt) { const k = BTO.ep(t, o.shieldAt, o.shieldAt + 0.7, "decelerate"); const pulse = 0.6 + 0.4 * Math.sin((t - o.shieldAt) * 5);
        g += `<rect x="${X - 6}" y="${Y - 6}" width="${W + 12}" height="${H + 12}" rx="38" fill="none" stroke="${C.teal}" stroke-width="12" opacity="${n1(k * pulse)}" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="${n1(1 - k)}"/>`;
        g += `<rect x="${wx}" y="${wy}" width="${ww}" height="${wh}" rx="18" fill="${C.teal}" opacity="${n1(0.22 * k * pulse)}"/>`; }
      // light rays out of the window toward the viewer (payoff)
      if (o.viewAt != null && t >= o.viewAt) { const k = BTO.ep(t, o.viewAt, o.viewAt + 0.8, "decelerate"); const ex = 540, ey = Y + H + 105;
        for (let i = 0; i < 5; i += 1) { const sx = wx + ww * (0.2 + i * 0.15), sy = wy + wh * 0.6; g += `<line x1="${n1(sx)}" y1="${n1(sy)}" x2="${n1(lerp(sx, ex, k))}" y2="${n1(lerp(sy, ey, k))}" stroke="${LIGHT}" stroke-width="5" stroke-dasharray="18 12" stroke-dashoffset="${n1(-t * 80)}" opacity="0.85"/>`; }
        g += `<g transform="translate(${ex} ${ey}) scale(0.75)" opacity="${n1(k)}"><path d="M-80 0 Q0 -60 80 0 Q0 60 -80 0 Z" fill="#f2efe6" stroke="#1a1f22" stroke-width="4"/><circle r="30" fill="#3c6e8f"/><circle r="13" fill="#05090d"/></g>`; }
      // magnifier on the mesh: big holes, light through them
      if (o.loupeAt != null && t >= o.loupeAt) { const L = o.loupe || { x: wx + ww * 0.55, y: wy + wh * 0.45, r: 230 }; const k = BTO.ep(t, o.loupeAt, o.loupeAt + 0.6, "decelerate");
        g += `<g opacity="${n1(k)}"><g clip-path="url(#ovLoupe)"><g transform="translate(${L.x} ${L.y}) scale(${n1(0.6 + 0.4 * k)}) translate(${-L.x} ${-L.y})"><rect x="${L.x - L.r}" y="${L.y - L.r}" width="${2 * L.r}" height="${2 * L.r}" fill="url(#ovGlow)"/><rect x="${L.x - L.r}" y="${L.y - L.r}" width="${2 * L.r}" height="${2 * L.r}" fill="url(#ovMeshBig)"/></g></g>`;
        g += `<circle cx="${L.x}" cy="${L.y}" r="${L.r}" fill="none" stroke="#1a1f22" stroke-width="18"/><circle cx="${L.x}" cy="${L.y}" r="${L.r}" fill="none" stroke="${C.text}" stroke-width="6"/><line x1="${n1(L.x + L.r * 0.72)}" y1="${n1(L.y + L.r * 0.72)}" x2="${n1(L.x + L.r * 1.18)}" y2="${n1(L.y + L.r * 1.18)}" stroke="#1a1f22" stroke-width="36" stroke-linecap="round"/></g>`;
        if (o.label) g += BTO.label(L.x - L.r * 0.5, L.y + L.r * 0.5, L.x - L.r * 0.9, L.y + L.r + 120, o.label.text, clamp((t - o.label.at) / 0.5), { size: LBL(), pill: true, color: C.amber, anchor: "start" }); }
      return `<g opacity="${op.toFixed(3)}">${g}</g>`;
    } };
  });

  // ---- faraday-box ----------------------------------------------------------------------------------------------
  // props: x, y, w, h (the cavity), launchAt, packets (count), meshSide ("left"), label { at, text }, enterAt, outAt, seed
  BTO.def("faraday-box", (o) => {
    const X = o.x || 150, Y = o.y || 600, W = o.w || 780, H = o.h || 560; const r = BTO.rng(o.seed || 9); const N = o.packets || 7; const t0 = o.launchAt == null ? 0 : o.launchAt;
    const pk = Array.from({ length: N }, (_, i) => ({ d: i * 0.32, a: Math.PI * (0.62 + r() * 0.75), v: 520 + r() * 160 }));
    if (o.launchAt != null) for (let i = 0; i < 3; i += 1) BTO.cue(t0 + i * 0.32, "tick", 0.25);
    // reflection in a box: fold the straight path back into [0, L]
    const fold = (u, L) => { const m = ((u % (2 * L)) + 2 * L) % (2 * L); return m <= L ? [m, 1] : [2 * L - m, -1]; };
    return { draw: (t) => {
      const op = fade(t, o.enterAt, o.outAt); if (op <= 0) return ""; const C = P(); let g = `<defs>${meshPattern("fbMesh", 16, 4, 1)}<clipPath id="fbCav"><rect x="${X}" y="${Y}" width="${W}" height="${H}"/></clipPath></defs>`; let pg = "";
      const wall = 30; const mx = X + W - 30, my = Y + 40; // magnetron in the upper right corner
      g += `<rect x="${X - wall}" y="${Y - wall}" width="${W + 2 * wall}" height="${H + 2 * wall}" rx="16" fill="${METAL}" stroke="#1a1f22" stroke-width="4"/><rect x="${X}" y="${Y}" width="${W}" height="${H}" fill="#14181b"/>`;
      // the door side is the mesh (left)
      g += `<rect x="${X - wall}" y="${Y}" width="${wall}" height="${H}" fill="url(#fbMesh)"/><rect x="${X - wall}" y="${Y}" width="${wall}" height="${H}" fill="none" stroke="${C.amber}" stroke-width="4"/>`;
      g += `<rect x="${mx - 70}" y="${Y - wall - 70}" width="140" height="70" rx="10" fill="#4a5458" stroke="#1a1f22" stroke-width="4"/><rect x="${mx - 20}" y="${Y - wall}" width="40" height="${wall}" fill="#2b3236"/>`;
      // packets: short wave trains moving in straight lines, reflected at every wall (the mesh too)
      let flashes = "";
      pk.forEach((p, i) => { const age = t - t0 - p.d; if (age <= 0) return; const s = age * p.v; const vx = Math.cos(p.a), vy = Math.sin(p.a);
        const [fx, sx] = fold((mx - X) + vx * s, W), [fy, sy] = fold(10 + Math.abs(vy) * s, H); const x = X + fx, y = Y + fy; const ang = Math.atan2(vy * sy * (vy < 0 ? -1 : 1), vx * sx);
        let d = ""; for (let k = 0; k <= 24; k += 1) { const u = -k * 6; d += `${k ? " L" : "M"}${n1(x + Math.cos(ang) * u - Math.sin(ang) * 12 * Math.sin(u * 0.2 + t * 14))} ${n1(y + Math.sin(ang) * u + Math.cos(ang) * 12 * Math.sin(u * 0.2 + t * 14))}`; }
        pg += `<path d="${d}" fill="none" stroke="${MW}" stroke-width="6" stroke-linecap="round" opacity="0.9"/><circle cx="${n1(x)}" cy="${n1(y)}" r="9" fill="${MW}"/>`;
        if (fx < 24) flashes += `<circle cx="${X - wall / 2}" cy="${n1(y)}" r="${n1(28 - fx)}" fill="${C.amber}" opacity="${n1(0.5 * (1 - fx / 24))}"/>`; });
      g += `<g clip-path="url(#fbCav)">${pg}</g>` + flashes;
      if (o.label) g += BTO.label(X + W, Y + H, X + W - 20, Y + H + 120, o.label.text, clamp((t - o.label.at) / 0.5), { size: LBL(), pill: true, color: C.teal, anchor: "end" });
      return `<g opacity="${op.toFixed(3)}">${g}</g>`;
    } };
  });

  // ---- wave-aperture --------------------------------------------------------------------------------------------
  // props: wallX, top, bottom, pitch (bar + hole), hole (px), microAt (the microwave starts), lambda (px), amp,
  //   lightAt (the light wave starts), labels { wavelength, hole, light, micro } ({ at, text }), enterAt, outAt
  BTO.def("wave-aperture", (o) => {
    const WX = o.wallX || 640, TOP = o.top || 560, BOT = o.bottom || 1200, PITCH = o.pitch || 46, HOLE = o.hole || 12, LAM = o.lambda || 430, AMP = o.amp || 150, V = 520;
    const holes = []; for (let y = TOP + PITCH / 2; y < BOT; y += PITCH) holes.push(y); const midHole = holes.reduce((b, y) => (Math.abs(y - 880) < Math.abs(b - 880) ? y : b), holes[0]);
    if (o.microAt != null) { BTO.cue(o.microAt, "whoosh", 0.4); BTO.cue(o.microAt + (WX - 40) / V, "drop", 0.45); } if (o.lightAt != null) BTO.cue(o.lightAt, "lift", 0.4);
    return { draw: (t) => {
      const op = fade(t, o.enterAt, o.outAt); if (op <= 0) return ""; const C = P(); let g = "";
      const Y0 = midHole; // the wave axis runs through one hole
      // microwave: incident train from the left; once its front reaches the wall it reflects (standing pattern on the left)
      if (o.microAt != null && t >= o.microAt) { const age = t - o.microAt; const front = Math.min(WX, 40 + age * V); const back = age * V - (WX - 40); const k = 2 * Math.PI / LAM, w = k * V;
        let d = ""; for (let x = 40; x <= front; x += 6) { let y = Math.sin(k * x - w * age); if (back > 0 && x > WX - back) y += clamp((x - (WX - back)) / 90) * Math.sin(k * (2 * WX - x) - w * age + Math.PI); d += `${d ? " L" : "M"}${x} ${n1(Y0 - AMP * y * Math.min(1, (x - 40) / 80))}`; }
        g += `<path d="${d}" fill="none" stroke="${MW}" stroke-width="10" stroke-linecap="round" opacity="0.95"/>`;
        // behind the mesh: nothing (a flat dashed axis)
        if (back > 0) g += `<line x1="${WX + 30}" y1="${Y0}" x2="1040" y2="${Y0}" stroke="${MW}" stroke-width="4" stroke-dasharray="6 14" opacity="0.5"/>`;
        // the wavelength brace (one full cycle) above the wave
        const lw = o.labels && o.labels.wavelength; if (lw && t >= lw.at) { const kk = clamp((t - lw.at) / 0.5); const x1 = 70, x2 = x1 + LAM, by = Y0 - AMP - 70;
          g += `<path d="M${x1} ${by + 24} L${x1} ${by} L${x2} ${by} L${x2} ${by + 24}" fill="none" stroke="${C.text}" stroke-width="5" opacity="${n1(kk)}"/>` + BTO.text((x1 + x2) / 2, by - 22, lw.text, { size: LBL() + 4, weight: 800, ls: 2, op: kk }); }
        const lm = o.labels && o.labels.micro; if (lm && t >= lm.at) g += BTO.label(WX - 30, Y0 + AMP * 0.2, WX - 60, Y0 + AMP + 120, lm.text, clamp((t - lm.at) / 0.5), { size: LBL(), pill: true, color: MW, anchor: "end" }); }
      // the mesh wall: bars with small holes
      holes.forEach((y, i) => { const yA = y - PITCH / 2 + HOLE / 2, yB = y + PITCH / 2 - HOLE / 2; g += `<rect x="${WX}" y="${n1(yA)}" width="26" height="${n1(yB - yA)}" fill="${METAL}" stroke="#1a1f22" stroke-width="2"/>`; });
      const lh = o.labels && o.labels.hole; if (lh && t >= lh.at) g += BTO.label(WX + 13, midHole + PITCH, WX + 120, midHole + PITCH + 170, lh.text, clamp((t - lh.at) / 0.5), { size: LBL(), pill: true, color: C.text, anchor: "start" });
      // light: a fine, fast wave through one hole, continuing to the right
      if (o.lightAt != null && t >= o.lightAt) { const age = t - o.lightAt; const front = 40 + age * 900; const yL = holes[Math.max(0, holes.indexOf(midHole) - 3)]; const kL = 2 * Math.PI / 22;
        let d = ""; for (let x = 40; x <= Math.min(1040, front); x += 3) d += `${d ? " L" : "M"}${x} ${n1(yL - 9 * Math.sin(kL * x - t * 40))}`;
        g += `<path d="${d}" fill="none" stroke="${LIGHT}" stroke-width="5" opacity="0.95"/><path d="${d}" fill="none" stroke="${LIGHT}" stroke-width="16" opacity="0.18"/>`;
        const ll = o.labels && o.labels.light; if (ll && t >= ll.at && front > WX + 200) g += BTO.label(Math.min(980, front) - 40, yL - 14, 1000, yL - 130, ll.text, clamp((t - ll.at) / 0.5), { size: LBL(), pill: true, color: LIGHT, anchor: "end" }); }
      return `<g opacity="${op.toFixed(3)}">${g}</g>`;
    } };
  });
})(window.BTO);
