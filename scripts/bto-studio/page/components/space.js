// BTO Premium Studio - science/space components for ImpossibleBrief (structured props only; nothing topic-specific).
//   starfield, planet (shaded body, rotating surface, atmosphere, rings, cutaway layers), depth-probe (vertical cut
//   with a descending probe, heat ramp and depth markers), scale-ladder (bars growing to evidenced values), orbit
//   (closed-form Kepler orbit). Every frame is a pure function of t. Geometry is illustrative unless a storyboard
//   states otherwise: scenes using these carry the ILLUSTRATION chip, models carry MODEL.
(function (BTO) {
  "use strict";
  const { clamp, lerp, esc } = BTO;
  const P = () => BTO.style.palette;
  const T = () => BTO.style.type;
  const fade = (t, a, b, d = 0.35) => (a == null ? 1 : clamp((t - a) / d)) * (b == null ? 1 : 1 - clamp((t - b) / d));
  const n1 = (v) => (+v).toFixed(1);

  // ---- starfield: seeded stars with slow drift and deterministic twinkle -------------------------------------
  BTO.def("starfield", (o) => {
    const r = BTO.rng(o.seed || 3); const n = o.count || 260; const stars = [];
    for (let i = 0; i < n; i += 1) stars.push({ x: r() * 1080, y: r() * 1920, s: 0.6 + r() * r() * 2.6, ph: r() * 6.28, w: 0.6 + r() * 2.2, z: 0.3 + r() * 0.7 });
    return { draw: (t) => {
      const op = fade(t, o.enterAt, o.outAt) * (o.opacity == null ? 1 : o.opacity); if (op <= 0) return "";
      const dx = (o.drift || [6, 2])[0] * t, dy = (o.drift || [6, 2])[1] * t;
      const dots = stars.map((s) => { const x = ((s.x + dx * s.z) % 1080 + 1080) % 1080, y = ((s.y + dy * s.z) % 1920 + 1920) % 1920;
        const a = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * s.w + s.ph)); return `<circle cx="${n1(x)}" cy="${n1(y)}" r="${s.s.toFixed(2)}" fill="#fff" opacity="${(a * s.z).toFixed(3)}"/>`; }).join("");
      const neb = o.nebula === false ? "" : `<ellipse cx="${o.nebulaX || 760}" cy="${o.nebulaY || 520}" rx="520" ry="300" fill="${P().teal}" opacity="0.07" filter="url(#soft)"/><ellipse cx="260" cy="1320" rx="420" ry="260" fill="${P().amber}" opacity="0.045" filter="url(#soft)"/>`;
      return `<g data-decor="1" opacity="${op.toFixed(3)}">${neb}${dots}</g>`;
    } };
  });

  // ---- planet: shaded sphere; surface bands/continents scroll with rotation; optional cutaway (core layers) ---------
  // props: x y r, kind earth|rocky|gas|ice|sun|moon|venus, rKeys [[t,r]], xKeys/yKeys, spin (rad/s), atmosphere,
  //   rings, light [lx,ly] (direction to the light), cutaway { at, layers:[{ f, color, label }], angle, open },
  //   probe { at, f (depth fraction of r), dur, label }, labels [{ text, at, angle, outAt }]
  const KINDS = {
    earth: { base: "#1f5f9e", land: "#4f8a4a", land2: "#b49a64", ice: "#eef4f6", atm: "#7cc4ff" },
    rocky: { base: "#8a6a4e", land: "#a8835e", land2: "#6c513b", atm: null },
    moon: { base: "#9a9893", land: "#b8b6b0", land2: "#7c7a75", atm: null },
    venus: { base: "#d8b36a", land: "#e8cc8a", land2: "#b8924c", atm: "#ffd98a" },
    gas: { base: "#c99a6a", land: "#e3c39a", land2: "#9c6d48", atm: "#ffd9b0", bands: true },
    ice: { base: "#7fb3c9", land: "#a9d4e2", land2: "#5f8fa6", atm: "#bfe9ff", bands: true },
    sun: { base: "#ffb43c", land: "#ffd36b", land2: "#ff8a2a", atm: "#ffcf6b", glow: true },
  };
  let pid = 0;
  BTO.def("planet", (o) => {
    const id = `pl${pid += 1}`; const K = { ...(KINDS[o.kind || "earth"] || KINDS.earth), ...(o.colors || {}) }; const r0 = BTO.rng(o.seed || 9);
    const blobs = []; for (let i = 0; i < (o.blobs || 26); i += 1) blobs.push({ u: r0() * 6.283, v: (r0() - 0.5) * 2.6, s: 0.12 + r0() * 0.3, c: r0() < 0.7 ? K.land : K.land2 });
    if (o.cutaway) BTO.cue(o.cutaway.at, "whoosh", 0.5); if (o.probe) BTO.cue(o.probe.at, "roll", 0.45, 0, { dur: o.probe.dur || 1.6 });
    return { draw: (t) => {
      const op = fade(t, o.enterAt, o.outAt, 0.4); if (op <= 0) return "";
      const R = o.rKeys ? BTO.keys(t, o.rKeys, "camera") : (o.r || 300); const X = o.xKeys ? BTO.keys(t, o.xKeys, "camera") : (o.x || 540), Y = o.yKeys ? BTO.keys(t, o.yKeys, "camera") : (o.y || 800);
      const L = o.light || [-0.6, -0.5]; const rot = (o.spin == null ? 0.12 : o.spin) * t; const ent = o.enterAt == null ? 1 : BTO.sp(t, o.enterAt, "soft"); const Rs = R * lerp(0.9, 1, ent);
      let defs = `<clipPath id="${id}c"><circle cx="${n1(X)}" cy="${n1(Y)}" r="${n1(Rs)}"/></clipPath>
        <radialGradient id="${id}s" cx="${50 + L[0] * 32}%" cy="${50 + L[1] * 32}%" r="78%"><stop offset="0" stop-color="#fff" stop-opacity="${K.glow ? 0.35 : 0.18}"/><stop offset="0.55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="${K.glow ? 0.05 : 0.78}"/></radialGradient>
        <radialGradient id="${id}a" cx="50%" cy="50%" r="50%"><stop offset="0.82" stop-color="${K.atm || "#fff"}" stop-opacity="0"/><stop offset="0.9" stop-color="${K.atm || "#fff"}" stop-opacity="${K.glow ? 0.55 : 0.32}"/><stop offset="1" stop-color="${K.atm || "#fff"}" stop-opacity="0"/></radialGradient>`;
      let g = "";
      if (K.glow) g += `<circle cx="${n1(X)}" cy="${n1(Y)}" r="${n1(Rs * 1.6)}" fill="${K.atm}" opacity="0.16" filter="url(#soft)"/>`;
      if (o.rings) g += `<ellipse cx="${n1(X)}" cy="${n1(Y)}" rx="${n1(Rs * 2.1)}" ry="${n1(Rs * 0.42)}" fill="none" stroke="${K.land}" stroke-width="${n1(Rs * 0.16)}" opacity="0.55" transform="rotate(${o.ringTilt || -14} ${n1(X)} ${n1(Y)})"/>`;
      let surf = `<circle cx="${n1(X)}" cy="${n1(Y)}" r="${n1(Rs)}" fill="${K.base}"/>`;
      if (K.bands) for (let i = -5; i <= 5; i += 1) surf += `<rect x="${n1(X - Rs)}" y="${n1(Y + i * Rs * 0.19 - Rs * 0.05 + Math.sin(rot * 2 + i) * 4)}" width="${n1(Rs * 2)}" height="${n1(Rs * 0.09)}" fill="${i % 2 ? K.land : K.land2}" opacity="0.55"/>`;
      else blobs.forEach((b) => { const u = ((b.u + rot) % 6.283 + 6.283) % 6.283; if (u > 3.14) return; const px = X - Math.cos(u) * Rs * 0.98, py = Y + b.v * Rs * 0.36; const sq = Math.sin(u);
        surf += `<ellipse cx="${n1(px)}" cy="${n1(py)}" rx="${n1(b.s * Rs * sq + 2)}" ry="${n1(b.s * Rs * 0.7)}" fill="${b.c}" opacity="0.9"/>`; });
      if ((o.kind || "earth") === "earth" && o.ice !== false) surf += `<ellipse cx="${n1(X)}" cy="${n1(Y - Rs * 0.93)}" rx="${n1(Rs * 0.42)}" ry="${n1(Rs * 0.12)}" fill="${K.ice}" opacity="0.85"/>`;
      // grid: latitude chords + meridians that turn with the planet (reads as motion even on a featureless close-up)
      if (o.grid) { for (let la = -75; la <= 75; la += 15) { const yy = Y + Math.sin(la * Math.PI / 180) * Rs; const hw = Math.cos(la * Math.PI / 180) * Rs; surf += `<line x1="${n1(X - hw)}" y1="${n1(yy)}" x2="${n1(X + hw)}" y2="${n1(yy)}" stroke="${P().teal}" stroke-width="2.5" opacity="0.35"/>`; }
        for (let m = 0; m < 12; m += 1) { const u = ((m / 12) * 6.283 + rot * 2) % 6.283; if (u > 3.14) continue; surf += `<ellipse cx="${n1(X)}" cy="${n1(Y)}" rx="${n1(Math.abs(Math.cos(u)) * Rs)}" ry="${n1(Rs)}" fill="none" stroke="${P().teal}" stroke-width="2.5" opacity="0.3"/>`; } }
      g += `<g clip-path="url(#${id}c)">${surf}<circle cx="${n1(X)}" cy="${n1(Y)}" r="${n1(Rs)}" fill="url(#${id}s)"/></g>`;
      if (K.atm) g += `<circle cx="${n1(X)}" cy="${n1(Y)}" r="${n1(Rs * 1.12)}" fill="url(#${id}a)"/>`;
      // cutaway: a wedge opens toward the viewer showing concentric layers (fractions of the radius)
      if (o.cutaway && t >= o.cutaway.at) {
        const c = o.cutaway; const k = BTO.ep(t, c.at, c.at + (c.dur || 0.9), "decelerate"); const half = (c.open || 38) * k * Math.PI / 180; const a0 = (c.angle == null ? -60 : c.angle) * Math.PI / 180;
        const wedge = (rr) => { const x1 = X + Math.cos(a0 - half) * rr, y1 = Y + Math.sin(a0 - half) * rr, x2 = X + Math.cos(a0 + half) * rr, y2 = Y + Math.sin(a0 + half) * rr; return `M${n1(X)} ${n1(Y)} L${n1(x1)} ${n1(y1)} A${n1(rr)} ${n1(rr)} 0 0 1 ${n1(x2)} ${n1(y2)} Z`; };
        g += `<path d="${wedge(Rs)}" fill="${P().desk}"/>`;
        (c.layers || []).forEach((ly, i) => { g += `<path d="${wedge(Rs * ly.f)}" fill="${ly.color}" opacity="${clamp((t - c.at - i * 0.12) / 0.3).toFixed(3)}"/>`; });
        (c.layers || []).forEach((ly, i) => { if (!ly.label || t < (ly.labelAt != null ? ly.labelAt : c.at + 0.5 + i * 0.25)) return; const kk = clamp((t - (ly.labelAt != null ? ly.labelAt : c.at + 0.5 + i * 0.25)) / 0.4) * fade(t, null, ly.outAt);
          const rr = Rs * ((ly.f + ((c.layers[i + 1] || { f: 0 }).f)) / 2); const lx = X + Math.cos(a0) * rr, lyy = Y + Math.sin(a0) * rr; const side = ly.side || (Math.cos(a0) >= 0 ? 1 : -1);
          g += BTO.label(lx, lyy, ly.lx != null ? ly.lx : lx + side * 220, ly.ly != null ? ly.ly : lyy - 60 - i * 10, ly.label, kk, { size: ly.size || T().scale.label, anchor: side > 0 ? "start" : "end", pill: true }); });
      }
      // probe: a hairline drilled from the surface toward the centre (depth as a fraction of the radius)
      if (o.probe && t >= o.probe.at) {
        const pr = o.probe; const k = BTO.ep(t, pr.at, pr.at + (pr.dur || 1.6), "inOut"); const a = (pr.angle == null ? -90 : pr.angle) * Math.PI / 180; const d = Rs * pr.f * k;
        const sx = X + Math.cos(a) * Rs, sy = Y + Math.sin(a) * Rs, ex = X + Math.cos(a) * (Rs - d), ey = Y + Math.sin(a) * (Rs - d);
        g += `<line x1="${n1(sx)}" y1="${n1(sy)}" x2="${n1(ex)}" y2="${n1(ey)}" stroke="${P().amber}" stroke-width="${pr.width || 6}" stroke-linecap="round"/><circle cx="${n1(ex)}" cy="${n1(ey)}" r="${(pr.width || 6) * 1.6}" fill="${P().amber}"/>`;
        if (pr.label) g += BTO.label(ex, ey, pr.lx != null ? pr.lx : ex + 140, pr.ly != null ? pr.ly : ey - 120, pr.label, clamp((t - pr.at - 0.4) / 0.4) * fade(t, null, pr.outAt), { size: pr.size || T().scale.label, pill: true });
      }
      (o.labels || []).forEach((lb) => { if (t < lb.at) return; const a = (lb.angle == null ? -40 : lb.angle) * Math.PI / 180; const sx = X + Math.cos(a) * Rs, sy = Y + Math.sin(a) * Rs;
        g += BTO.label(sx, sy, lb.lx != null ? lb.lx : sx + Math.cos(a) * 160, lb.ly != null ? lb.ly : sy + Math.sin(a) * 160, lb.text, clamp((t - lb.at) / 0.45) * fade(t, null, lb.outAt), { size: lb.size || T().scale.label, anchor: Math.cos(a) >= 0 ? "start" : "end", pill: true }); });
      return `<g opacity="${op.toFixed(3)}"><defs>${defs}</defs>${g}</g>`;
    } };
  });

  // ---- depth-probe: a vertical slice of ground/ocean/atmosphere with a probe descending to evidenced depths ---------
  // props: x y w h, maxDepth, markers [{ depth, label, at, side }], probeKeys [[t, depth]], heat (ramp cold->hot with
  //   depth), surface label, readouts [{ at, text, outAt }] (numbers must be in cited facts), strata colours
  BTO.def("depth-probe", (o) => {
    const C = P(); (o.markers || []).forEach((m) => BTO.cue(m.at, "tick", 0.4)); if (o.probeKeys) BTO.cue(o.probeKeys[0][0], "roll", 0.4, 0, { dur: Math.max(0.5, o.probeKeys[o.probeKeys.length - 1][0] - o.probeKeys[0][0]) });
    (o.readouts || []).forEach((r) => BTO.cue(r.at, "lock", 0.45));
    const strata = o.strata || ["#3b2c20", "#4a3424", "#5a3a22", "#6b3d1f", "#7c3b1a"];
    return { draw: (t) => {
      const op = fade(t, o.enterAt, o.outAt); if (op <= 0) return "";
      const x = o.x || 540, y = o.y || 420, w = o.w || 520, h = o.h || 860; const max = o.maxDepth || 1; const yOf = (d) => y + h * clamp(d / max);
      let g = ""; const sh = h / strata.length;
      // flow { at, amp }: strata boundaries bend and travel (rock deforming like a slow fluid; conceptual)
      const fk = o.flow ? clamp((t - o.flow.at) / 1.2) * (o.flow.amp || 26) : 0;
      const edge = (i) => { const pts = []; for (let s = 0; s <= 24; s += 1) { const xx = x - w / 2 + (w * s) / 24; const bend = fk && i > 0 && i < strata.length ? fk * Math.sin(s / 24 * 9.4 + t * 1.7 + i * 1.3) : 0; pts.push([xx, y + i * sh + bend]); } return pts; };
      strata.forEach((c, i) => { if (!fk) { g += `<rect x="${n1(x - w / 2)}" y="${n1(y + i * sh)}" width="${w}" height="${n1(sh + 1)}" fill="${c}"/>`; return; }
        const poly = [...edge(i), ...edge(i + 1).reverse()]; g += `<path d="M${poly.map(([a, b]) => `${n1(a)} ${n1(b)}`).join(" L")} Z" fill="${c}"/>`; });
      if (o.heat) g += `<defs><linearGradient id="dpHeat" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff5a1f" stop-opacity="0"/><stop offset="1" stop-color="#ff5a1f" stop-opacity="${(0.75 * clamp(o.heatAt == null ? 1 : (t - o.heatAt) / 1.2)).toFixed(3)}"/></linearGradient></defs><rect x="${n1(x - w / 2)}" y="${y}" width="${w}" height="${h}" fill="url(#dpHeat)"/>`;
      g += `<rect x="${n1(x - w / 2 - 60)}" y="${n1(y - 8)}" width="${w + 120}" height="10" fill="${C.teal}"/>`;
      if (o.surface) g += BTO.text(x + w / 2 + 76, y + 12, o.surface, { size: T().scale.label, anchor: "start", fill: C.muted, weight: 700, ls: 1.5 });
      (o.markers || []).forEach((m) => { if (t < m.at) return; const k = clamp((t - m.at) / 0.4) * fade(t, null, m.outAt); const yy = yOf(m.depth); const right = m.side !== "left";
        g += `<line x1="${n1(x - w / 2)}" y1="${n1(yy)}" x2="${n1(x + w / 2)}" y2="${n1(yy)}" stroke="${C.paper}" stroke-width="3" stroke-dasharray="14 10" opacity="${(0.8 * k).toFixed(3)}"/>`;
        g += BTO.text(right ? x + w / 2 + 24 : x - w / 2 - 24, yy + 14, m.label, { size: m.size || T().scale.label, anchor: right ? "start" : "end", op: k, extra: `paint-order="stroke" stroke="${C.desk}" stroke-width="7" stroke-opacity="0.7"` }); });
      if (o.probeKeys) { const d = BTO.keys(t, o.probeKeys, "inOut"); if (t >= o.probeKeys[0][0]) { const yy = yOf(d);
        g += `<rect x="${n1(x - 5)}" y="${n1(y - 40)}" width="10" height="${n1(yy - y + 40)}" fill="${C.amber}"/><path d="M${n1(x - 16)} ${n1(yy - 6)} L${n1(x + 16)} ${n1(yy - 6)} L${n1(x)} ${n1(yy + 22)} Z" fill="${C.amber}"/>`;
        g += `<rect x="${n1(x - 40)}" y="${n1(y - 96)}" width="80" height="62" rx="6" fill="${C.inkSoft || "#333"}" stroke="${C.amber}" stroke-width="4"/>`; } }
      (o.readouts || []).forEach((r) => { if (t < r.at) return; const k = BTO.sp(t, r.at, "snap") * fade(t, null, r.outAt); const yy = r.y || (y + h + 90);
        g += `<g opacity="${clamp((t - r.at) / 0.2).toFixed(3)}" transform="translate(${x} ${yy}) scale(${lerp(0.85, 1, k).toFixed(3)}) translate(${-x} ${-yy})">` + BTO.text(x, yy, r.text, { size: r.size || T().scale.headline, weight: 800, family: T().num, fill: r.color ? C[r.color] || r.color : C.text, extra: `paint-order="stroke" stroke="${C.desk}" stroke-width="10" stroke-opacity="0.75"` }) + "</g>"; });
      return `<g opacity="${op.toFixed(3)}">${g}</g>`;
    } };
  });

  // ---- scale-ladder: bars that grow to their values on cue (linear or log); a value label per bar ---------------
  // props: x y w (bar area width), barH, gap, log, max, items [{ label, value, valueText, at, color }]
  BTO.def("scale-ladder", (o) => {
    const C = P(); (o.items || []).forEach((it) => BTO.cue(it.at, "lift", 0.4));
    return { draw: (t) => {
      const op = fade(t, o.enterAt, o.outAt); if (op <= 0) return "";
      const items = o.items || []; const max = o.max || Math.max(...items.map((it) => it.value)); const f = (v) => (o.log ? Math.log10(Math.max(1, v)) / Math.log10(Math.max(10, max)) : v / max);
      const x0 = o.x || 110, y0 = o.y || 520, w = o.w || 860, bh = o.barH || 88, gap = o.gap || 150; let g = "";
      items.forEach((it, i) => { const yy = y0 + i * gap; const k = t < it.at ? 0 : BTO.ep(t, it.at, it.at + 0.8, "decelerate"); const bw = Math.max(6, w * clamp(f(it.value)) * k); const col = (it.color && C[it.color]) || it.color || (i === items.length - 1 ? C.amber : C.teal);
        if (it.label) g += BTO.text(x0, yy - 18, it.label, { size: o.labelSize || T().scale.small, anchor: "start", weight: 700, fill: C.muted, ls: 1.5, op: clamp((t - it.at + 0.3) / 0.3) });
        g += `<rect x="${x0}" y="${yy}" width="${n1(bw)}" height="${bh}" rx="10" fill="${col}" opacity="${clamp((t - it.at) / 0.15).toFixed(3)}"/>`;
        if (it.valueText) g += BTO.text(Math.min(x0 + bw + 20, x0 + w - 10), yy + bh * 0.7, it.valueText, { size: o.valueSize || T().scale.label, anchor: x0 + bw + 20 > x0 + w - 220 ? "end" : "start", weight: 800, family: T().num, op: clamp((t - it.at - 0.5) / 0.3), fill: x0 + bw + 20 > x0 + w - 220 ? C.desk : C.text }); });
      return `<g opacity="${op.toFixed(3)}">${g}</g>`;
    } };
  });

  // ---- orbit: closed-form Kepler orbit (mean anomaly -> eccentric anomaly by Newton), central body + orbiter -------
  // props: cx cy a e tilt (deg), period (s of screen time), body { r, color }, central { r, kind }, trail (0..1 of orbit),
  //   periodKeys [[t, period]] (speeding up / slowing down), labels via the labels component
  BTO.def("orbit", (o) => {
    const C = P();
    return { draw: (t) => {
      const op = fade(t, o.enterAt, o.outAt); if (op <= 0) return "";
      const cx = o.cx || 540, cy = o.cy || 800, a = o.a || 340, e = o.e || 0.2, b = a * Math.sqrt(1 - e * e), tilt = (o.tilt || 0) * Math.PI / 180, flat = o.flatten || 0.45;
      // integrate phase so a changing period stays continuous: phase = sum dt / period (closed form for piecewise-linear keys)
      let phase = 0; const keys = o.periodKeys || [[0, o.period || 6]]; const steps = 120; const t0 = o.enterAt || 0; const dt = Math.max(0, t - t0) / steps;
      for (let i = 0; i < steps; i += 1) phase += dt / Math.max(0.05, BTO.keys(t0 + (i + 0.5) * dt, keys, "inOut"));
      const pos = (ph) => { const M = 2 * Math.PI * ph; let E = M; for (let i = 0; i < 8; i += 1) E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
        const x = a * (Math.cos(E) - e), y = b * Math.sin(E); return [cx + x * Math.cos(tilt) - y * flat * Math.sin(tilt), cy + x * Math.sin(tilt) + y * flat * Math.cos(tilt)]; };
      let path = ""; for (let i = 0; i <= 96; i += 1) { const [x, y] = pos(i / 96); path += `${i ? "L" : "M"}${n1(x)} ${n1(y)} `; }
      let g = `<path d="${path}" fill="none" stroke="${C.paper}" stroke-width="2.5" stroke-dasharray="6 10" opacity="0.45"/>`;
      if (o.trail) { let tr = ""; for (let i = 0; i <= 30; i += 1) { const [x, y] = pos(phase - o.trail * (1 - i / 30)); tr += `${i ? "L" : "M"}${n1(x)} ${n1(y)} `; } g += `<path d="${tr}" fill="none" stroke="${(o.body && o.body.color) || C.teal}" stroke-width="6" stroke-linecap="round" opacity="0.55"/>`; }
      const [bx, by] = pos(phase); const cr = (o.central && o.central.r) || 70; const ccol = (o.central && o.central.color) || C.amber;
      g += `<circle cx="${cx}" cy="${cy}" r="${cr * 1.7}" fill="${ccol}" opacity="0.14" filter="url(#soft)"/><circle cx="${cx}" cy="${cy}" r="${cr}" fill="${ccol}"/>`;
      g += `<circle cx="${n1(bx)}" cy="${n1(by)}" r="${(o.body && o.body.r) || 22}" fill="${(o.body && o.body.color) || C.teal}"/>`;
      return `<g opacity="${op.toFixed(3)}">${g}</g>`;
    } };
  });
})(window.BTO);
