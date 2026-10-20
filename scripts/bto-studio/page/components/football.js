// Premium studio - football components (GoalLore Lab profile; generic data-driven props, metres not pixels).
//   football-pitch: a pitch with IFAB Law 1 markings in true proportion, seen through the 2.5D projector
//   (tactics-camera tilt), player tokens on keyed runs, passes, and ball flights as real parabolas with a ground shadow.
// Players are numbered tokens, never likenesses. Positions in a reconstruction must be labelled RECONSTRUCTION by the
// scene's chips unless they come from cited tracking data.
(function (BTO) {
  "use strict";
  const { clamp, lerp, p } = BTO;
  // Law 1 dimensions (metres): a 105 x 68 pitch, the international-match standard the markings are drawn to
  const L = { len: 105, wid: 68, circle: 9.15, penDepth: 16.5, penWidth: 40.32, goalAreaDepth: 5.5, goalAreaWidth: 18.32, spot: 11, arc: 9.15, corner: 1, goalWidth: 7.32 };
  BTO.pitchLaw = L;

  BTO.def("football-pitch", (o, scene) => {
    const C = BTO.style.palette; const ppm = o.pxPerMetre || 9; // plane px per metre
    const cam = (t) => ({ cx: o.x || 540, cy: o.y || 780, rx: o.rxKeys ? BTO.keys(t, o.rxKeys, "inOut") : o.rx || 0, rz: o.rzKeys ? BTO.keys(t, o.rzKeys, "inOut") : o.rz || 0, D: o.D || 1700, s: 1 });
    // pitch coords: x across (-34..34 m), y along (-52.5..52.5 m), top goal at y = -52.5
    const players = (o.players || []).map((pl) => ({ ...pl, path: pl.path }));
    const posOf = (pl, t) => { const k = pl.path; if (t <= k[0][0]) return [k[0][1], k[0][2]]; for (let i = 1; i < k.length; i += 1) if (t < k[i][0]) { const e = BTO.ease("inOut", p(t, k[i - 1][0], k[i][0])); return [lerp(k[i - 1][1], k[i][1], e), lerp(k[i - 1][2], k[i][2], e)]; } const z = k[k.length - 1]; return [z[1], z[2]]; };
    const byId = Object.fromEntries(players.map((pl) => [pl.id, pl]));
    // ball events: pass (ground, straight) or flight (parabola apex `height` m); src/dst are player ids or [x, y] metres
    // (not from/to: those keys are time anchors for BTO.resolve)
    const where = (ref, t) => (Array.isArray(ref) ? ref : posOf(byId[ref], t));
    const events = (o.ball || []).map((e) => ({ ...e, dur: e.dur || 0.6 }));
    events.forEach((e) => BTO.cue(e.at, e.height ? "whoosh" : "tick", e.height ? 0.5 : 0.35));
    const ballAt = (t) => { let last = null; for (const e of events) { if (t >= e.at && t < e.at + e.dur) { const a = where(e.src, e.at), b = where(e.dst, e.at + e.dur); const k = (t - e.at) / e.dur;
          return { x: lerp(a[0], b[0], k), y: lerp(a[1], b[1], k), z: e.height ? 4 * e.height * k * (1 - k) : 0, e }; } if (t >= e.at + e.dur) last = e; }
      if (last) { const b = where(last.dst, last.at + last.dur); return { x: b[0], y: b[1], z: 0, e: null }; } const f = events[0]; if (!f) return null; const a = where(f.src, f.at); return { x: a[0], y: a[1], z: 0, e: null }; };
    return { draw: (t) => {
      const P0 = BTO.projector(cam(t)); const P = (x, y, z = 0) => P0(x * ppm, y * ppm, z * ppm);
      const poly = (pts) => "M" + pts.map((q) => `${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join("L") + "Z";
      const line = (pts) => "M" + pts.map((q) => `${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join("L");
      const rect = (x0, y0, x1, y1) => [P(x0, y0), P(x1, y0), P(x1, y1), P(x0, y1)];
      const arc = (cx, cy, r, a0, a1, n = 36) => { const pts = []; for (let i = 0; i <= n; i += 1) { const a = lerp(a0, a1, i / n); pts.push(P(cx + r * Math.cos(a), cy + r * Math.sin(a))); } return pts; };
      const W = L.wid / 2, H = L.len / 2; let g = "";
      // grass with mowing stripes, then markings
      g += `<path d="${poly(rect(-W - 4, -H - 4, W + 4, H + 4))}" fill="${C.pitch || "#1f5a3a"}"/>`;
      for (let i = 0; i < 14; i += 1) if (i % 2) { const y0 = -H + (i * L.len) / 14, y1 = y0 + L.len / 14; g += `<path d="${poly(rect(-W, y0, W, y1))}" fill="${C.pitch2 || "#246843"}"/>`; }
      const ln = C.line || "#e9f2e4"; let mk = "";
      mk += `<path d="${poly(rect(-W, -H, W, H))}"/><path d="${line([P(-W, 0), P(W, 0)])}"/><path d="${poly(arc(0, 0, L.circle, 0, 2 * Math.PI, 60))}"/>`;
      for (const sgn of [-1, 1]) { const gy = sgn * H;
        mk += `<path d="${line([P(-L.penWidth / 2, gy), P(-L.penWidth / 2, gy - sgn * L.penDepth), P(L.penWidth / 2, gy - sgn * L.penDepth), P(L.penWidth / 2, gy)])}"/>`;
        mk += `<path d="${line([P(-L.goalAreaWidth / 2, gy), P(-L.goalAreaWidth / 2, gy - sgn * L.goalAreaDepth), P(L.goalAreaWidth / 2, gy - sgn * L.goalAreaDepth), P(L.goalAreaWidth / 2, gy)])}"/>`;
        // penalty arc: the part of the 9.15 m circle around the spot that lies outside the penalty area
        const sy = gy - sgn * L.spot, lim = Math.acos((L.penDepth - L.spot) / L.arc);
        mk += `<path d="${line(arc(0, sy, L.arc, sgn > 0 ? -Math.PI / 2 - lim : Math.PI / 2 - lim, sgn > 0 ? -Math.PI / 2 + lim : Math.PI / 2 + lim))}"/>`;
        const s = P(0, sy); mk += `<circle cx="${s[0].toFixed(1)}" cy="${s[1].toFixed(1)}" r="${(4 * s[2]).toFixed(1)}" fill="${ln}" stroke="none"/>`;
        // goal frame (2.44 m tall posts)
        const gp = [P(-L.goalWidth / 2, gy), P(-L.goalWidth / 2, gy, 2.44), P(L.goalWidth / 2, gy, 2.44), P(L.goalWidth / 2, gy)]; mk += `<path d="${line(gp)}" stroke-width="5"/>`; }
      for (const [cx, cy, a0] of [[-W, -H, 0], [W, -H, Math.PI / 2], [W, H, Math.PI], [-W, H, 1.5 * Math.PI]]) mk += `<path d="${line(arc(cx, cy, L.corner, a0, a0 + Math.PI / 2, 8))}"/>`;
      g += `<g fill="none" stroke="${ln}" stroke-width="3.2" opacity="0.9">${mk}</g>`;
      // pass trails (persist after the pass)
      for (const e of events) { if (t < e.at) continue; const a = where(e.src, e.at), b = where(e.dst, e.at + e.dur); const k = clamp((t - e.at) / e.dur); const fade = o.trailsOutAt == null ? 1 : 1 - clamp((t - o.trailsOutAt) / 0.4); if (fade <= 0) continue;
        const pts = []; for (let i = 0; i <= 24; i += 1) { const u = (i / 24) * k; pts.push(P(lerp(a[0], b[0], u), lerp(a[1], b[1], u), e.height ? 4 * e.height * u * (1 - u) : 0)); }
        g += `<path d="${line(pts)}" fill="none" stroke="${e.height ? C.amber : C.paper}" stroke-width="5" stroke-dasharray="${e.height ? "none" : "14 10"}" opacity="${(0.85 * fade).toFixed(3)}"/>`; }
      // players (tokens), sorted far to near
      const toks = players.map((pl) => { const [x, y] = posOf(pl, t); return { pl, q: P(x, y, 0) }; }).sort((a, b) => a.q[1] - b.q[1]);
      for (const { pl, q } of toks) { if (pl.enterAt != null && t < pl.enterAt) continue; const r = 16 * q[2] * (o.tokenScale || 1); const col = pl.team === "away" ? C.teal : C.coral;
        g += `<ellipse cx="${q[0].toFixed(1)}" cy="${(q[1] + r * 0.35).toFixed(1)}" rx="${(r * 1.1).toFixed(1)}" ry="${(r * 0.45).toFixed(1)}" fill="#000" opacity="0.35"/>`;
        g += `<circle cx="${q[0].toFixed(1)}" cy="${(q[1] - r * 0.4).toFixed(1)}" r="${r.toFixed(1)}" fill="${col}" stroke="${C.paper}" stroke-width="${(2.5 * q[2]).toFixed(1)}"/>`;
        if (pl.number != null) g += BTO.text(q[0], q[1] - r * 0.4 + r * 0.38, String(pl.number), { size: r * 1.05, weight: 800, family: BTO.style.type.num, fill: C.paper, extra: 'data-decor="1"' });
        if (pl.highlightAt != null && t >= pl.highlightAt) { const k = clamp((t - pl.highlightAt) / 0.3); g += `<circle cx="${q[0].toFixed(1)}" cy="${(q[1] - r * 0.4).toFixed(1)}" r="${(r * (1.5 + 0.4 * (1 - k))).toFixed(1)}" fill="none" stroke="${C.amber}" stroke-width="4" opacity="${k.toFixed(3)}"/>`; } }
      // ball and its ground shadow
      const b = ballAt(t); if (b) { const sh = P(b.x, b.y, 0), q = P(b.x, b.y, b.z + 0.11); const r = 7 * q[2];
        g += `<ellipse cx="${sh[0].toFixed(1)}" cy="${sh[1].toFixed(1)}" rx="${(r * 1.1).toFixed(1)}" ry="${(r * 0.5).toFixed(1)}" fill="#000" opacity="${(0.45 - Math.min(0.3, b.z * 0.02)).toFixed(3)}"/>`;
        g += `<circle cx="${q[0].toFixed(1)}" cy="${q[1].toFixed(1)}" r="${r.toFixed(1)}" fill="#ffffff" stroke="${C.ink}" stroke-width="1.5"/>`; }
      return g;
    } };
  });
})(window.BTO);
