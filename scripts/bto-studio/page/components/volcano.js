// BTO Premium Studio - volcano: an eruption in cross-section (ImpossibleBrief "volcano-eruption" mechanism; the mechanism
//   board showed seven volcano topics drawn as a globe with numbers, never a volcano).
//   Above ground: a cone under a dusky sky; at eruptAt magma rises up the conduit, an eruption column climbs and spreads
//   into an umbrella cloud, ash falls out of it and drifts downwind. lateral: the flank collapses and a grey blast fans
//   out sideways (a lateral blast). Below ground: crust strata and the glowing magma chamber feeding the conduit.
//   props: x, y (vent base at ground level), k (scale), eruptAt (null = quiet, before an eruption), lateral (bool),
//   column (px height of the column at k = 1, default 760), wind (1 = drift right, -1 left), chamberLabel { at, text },
//   enterAt, outAt, seed. Illustrative proportions (not to scale): ILLUSTRATION chip. Every frame is a pure function of t.
(function (BTO) {
  "use strict";
  const { clamp, lerp } = BTO;
  const n1 = (v) => (+v).toFixed(1);
  const fade = (t, a, b, d = 0.35) => (a == null ? 1 : clamp((t - a) / d)) * (b == null ? 1 : 1 - clamp((t - b) / d));
  BTO.def("volcano", (o) => {
    const r = BTO.rng(o.seed || 13); const puffs = Array.from({ length: 34 }, (_, i) => ({ f: i / 34, dx: (r() - 0.5) * 2, s: 0.7 + r() * 0.6, ph: r() * 6.28 }));
    const ash = Array.from({ length: 70 }, () => ({ x: (r() - 0.5) * 2, d: r(), v: 0.5 + r() * 0.8 }));
    if (o.eruptAt != null) { BTO.cue(o.eruptAt, "drop", 0.8); BTO.cue(o.eruptAt + 0.15, "whoosh", 0.7); }
    return { draw: (t) => {
      const op = fade(t, o.enterAt, o.outAt); if (op <= 0) return ""; const C = BTO.style.palette;
      const k = o.k || 1, X = o.x == null ? 540 : o.x, Y = o.y == null ? 1000 : o.y; const wind = o.wind === -1 ? -1 : 1;
      const e = o.eruptAt == null ? 0 : clamp((t - o.eruptAt) / 2.2); const ee = BTO.ease("decelerate", e); const age = o.eruptAt == null ? 0 : Math.max(0, t - o.eruptAt);
      const P = (x, y) => `${n1(X + x * k)} ${n1(Y + y * k)}`; let g = "";
      // sky over the ground line; dust tints it as the umbrella spreads
      g += `<defs><linearGradient id="vSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b1424"/><stop offset="0.75" stop-color="#2a3550"/><stop offset="1" stop-color="${e > 0 ? "#6b4a3a" : "#3e4a66"}"/></linearGradient>
        <radialGradient id="vMag" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ffd27a"/><stop offset="0.6" stop-color="#ff6a2a"/><stop offset="1" stop-color="#8a1f0f"/></radialGradient></defs>`;
      g += `<rect x="-60" y="${n1(Y - 1500 * k)}" width="1200" height="${n1(1500 * k)}" fill="url(#vSky)"/>`;
      // underground: strata and the chamber
      const strata = ["#5a3b28", "#4a3022", "#3c271c", "#2f1f17"]; strata.forEach((c, i) => { g += `<rect x="-60" y="${n1(Y + i * 120 * k)}" width="1200" height="${n1(120 * k + 2)}" fill="${c}"/>`; });
      const glow = 0.75 + 0.25 * Math.sin(t * 3);
      g += `<ellipse cx="${n1(X)}" cy="${n1(Y + 360 * k)}" rx="${n1(250 * k)}" ry="${n1(95 * k)}" fill="url(#vMag)" opacity="${n1(glow)}"/>`;
      // conduit: magma rises to the vent from eruptAt - 0.6 s
      const rise = o.eruptAt == null ? 0.25 : clamp((t - o.eruptAt + 0.6) / 0.6);
      g += `<rect x="${n1(X - 16 * k)}" y="${n1(Y + 360 * k - (360 + 230) * k * rise)}" width="${n1(32 * k)}" height="${n1((360 + 230) * k * rise)}" fill="#ff7a2a" opacity="0.95"/>`;
      // the cone (with a lateral collapse scar when the flank goes)
      const lat = o.lateral && e > 0 ? clamp(age / 0.8) : 0;
      const flank = lat > 0 ? `L${P(140 + 80 * lat, -150 + 40 * lat)} L${P(220, -60)}` : `L${P(170, -110)}`;
      g += `<path d="M${P(-560, 0)} L${P(-110, -230)} L${P(-38, -240)} L${P(-24, -224)} L${P(24, -224)} L${P(38, -240)} L${P(110, -230)} ${flank} L${P(560, 0)} Z" fill="#3a2c26" stroke="#1a1310" stroke-width="${n1(4 * k)}"/>`;
      g += `<path d="M${P(-24, -224)} L${P(24, -224)} L${P(16, -210)} L${P(-16, -210)} Z" fill="#ff8a2a" opacity="${n1(0.4 + 0.6 * Math.max(rise, ee))}"/>`;
      // lateral blast: a grey density current fanning out from the flank along the ground
      if (lat > 0) { const reach = 900 * BTO.ease("decelerate", clamp(age / 1.6)); for (let i = 0; i < 9; i += 1) { const f = i / 8; g += `<ellipse cx="${n1(X + (160 + reach * f) * k)}" cy="${n1(Y - (40 + 50 * Math.sin(f * 3.1)) * k)}" rx="${n1((70 + 60 * f) * k)}" ry="${n1((40 + 30 * f) * k)}" fill="#8b8580" opacity="${n1(0.75 * (1 - f * 0.4))}"/>`; } }
      // eruption column and umbrella
      if (e > 0) { const H = (o.column || 760) * ee; const top = -230 - H;
        puffs.forEach((p) => { if (p.f * (o.column || 760) > H) return; const y = -230 - p.f * H; const w = 40 + p.f * 120; const x = p.dx * w * 0.5 + Math.sin(t * 2 + p.ph) * 10;
          g += `<circle cx="${n1(X + x * k)}" cy="${n1(Y + y * k)}" r="${n1(w * p.s * 0.6 * k)}" fill="${p.f < 0.15 ? "#c46a3a" : "#7f7a76"}" opacity="0.92"/>`; });
        const u = clamp((age - 1.0) / 2.5); if (u > 0) { const wU = 160 + 520 * BTO.ease("decelerate", u); const cx = X + wind * 140 * u * k;
          g += `<ellipse cx="${n1(cx)}" cy="${n1(Y + top * k)}" rx="${n1(wU * k)}" ry="${n1((70 + 30 * u) * k)}" fill="#8f8984" opacity="0.95"/><ellipse cx="${n1(cx - 30 * k)}" cy="${n1(Y + (top - 25) * k)}" rx="${n1(wU * 0.7 * k)}" ry="${n1(45 * k)}" fill="#a8a29c" opacity="0.8"/>`;
          ash.forEach((a) => { const fall = ((age * a.v + a.d) % 1); g += `<circle cx="${n1(cx + a.x * wU * k + wind * fall * 120 * k)}" cy="${n1(Y + (top + 60 + fall * (-top - 60)) * k)}" r="${n1(3 * k)}" fill="#6f6a66" opacity="${n1(0.6 * u * (1 - fall * 0.5))}"/>`; }); } }
      if (o.chamberLabel && t >= o.chamberLabel.at) g += BTO.label(X + 200 * k, Y + 360 * k, X + 330 * k, Y + 250 * k, o.chamberLabel.text, clamp((t - o.chamberLabel.at) / 0.5), { size: BTO.style.type.scale.label, pill: true, color: C.amber });
      return `<g opacity="${op.toFixed(3)}">${g}</g>`;
    } };
  });
})(window.BTO);
