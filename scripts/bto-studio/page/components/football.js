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
    const C = BTO.style.palette; const K = (name, t, d) => (o[name] ? BTO.keys(t, o[name], "camera") : d);
    const ppmAt = (t) => K("ppmKeys", t, o.pxPerMetre || 9); // plane px per metre (keyed = dolly/zoom in pitch space)
    const cam = (t) => ({ cx: o.x || 540, cy: o.y || 780, rx: K("rxKeys", t, o.rx || 0), rz: K("rzKeys", t, o.rz || 0), D: K("distKeys", t, o.D || 1700), s: 1 });
    // kicks: ball flights integrated with drag and Magnus lift (RK4, fixed 1/240 s step, deterministic).
    // Parameters are a stated MODEL (o.model or the defaults below), never presented as measurements of a real kick.
    const MODEL = { mass: 0.43, radius: 0.11, rho: 1.2, cd: 0.25, g: 9.81, ...(o.model || {}) };
    const simulate = (k, spinOn) => { const A = Math.PI * MODEL.radius ** 2, el = k.elevation * Math.PI / 180, az = k.azimuth * Math.PI / 180;
      let s = [k.x0, k.y0, MODEL.radius, k.speed * Math.cos(el) * Math.sin(az), -k.speed * Math.cos(el) * Math.cos(az), k.speed * Math.sin(el)];
      const w = spinOn ? 2 * Math.PI * (k.spinRps || 0) : 0; // sidespin about the vertical axis (+ = curls towards -x while travelling towards -y)
      const f = (q) => { const v = [q[3], q[4], q[5]]; const sp = Math.hypot(...v) || 1e-9; const S = (MODEL.radius * Math.abs(w)) / sp; const cl = S > 0 ? 1 / (2 + 1 / S) : 0;
        const drag = 0.5 * MODEL.rho * A * MODEL.cd * sp / MODEL.mass; const lift = 0.5 * MODEL.rho * A * cl * sp / MODEL.mass;
        const n = [Math.sign(w) * v[1], -Math.sign(w) * v[0], 0]; const nn = Math.hypot(n[0], n[1]) || 1; // (w z-hat) x v, horizontal
        return [v[0], v[1], v[2], -drag * v[0] + lift * sp * n[0] / nn, -drag * v[1] + lift * sp * n[1] / nn, -MODEL.g - drag * v[2]]; };
      const pts = [{ t: 0, x: s[0], y: s[1], z: s[2] }]; const dt = 1 / 240;
      for (let i = 1; i < 240 * 4; i += 1) { const k1 = f(s), k2 = f(s.map((x, j) => x + dt / 2 * k1[j])), k3 = f(s.map((x, j) => x + dt / 2 * k2[j])), k4 = f(s.map((x, j) => x + dt * k3[j]));
        s = s.map((x, j) => x + dt / 6 * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j])); pts.push({ t: i * dt, x: s[0], y: s[1], z: s[2] }); if (s[1] <= (k.stopY == null ? -52.5 : k.stopY) || s[2] <= 0) break; }
      return pts; };
    const kicks = (o.kicks || []).map((k) => ({ ...k, path: simulate(k, true), ghost: k.ghostAt != null ? simulate(k, false) : null }));
    kicks.forEach((k) => { BTO.cue(k.at, "lock", 0.6); BTO.cue(k.at + 0.05, "whoosh", 0.6); });
    const kickPos = (k, t) => { const lt = (t - k.at) * (k.timeScale || 1); if (lt <= 0) return k.path[0]; const i = Math.min(k.path.length - 1, Math.floor(lt * 240)); return k.path[i]; };
    BTO.geo[o.id || "pitch"] = { kick: (i, t) => kickPos(kicks[i], t), kicks };
    const focusAt = (t) => { const base = o.focusKeys ? BTO.keys(t, o.focusKeys.map(([at, x, y]) => [at, [x, y]]), "camera") : [0, 0];
      if (o.follow && kicks[o.follow.kick || 0] && t >= o.follow.at) { const b = kickPos(kicks[o.follow.kick || 0], t); const k = BTO.ease("inOut", clamp((t - o.follow.at) / (o.follow.ease || 0.4))) * (o.follow.blend == null ? 0.7 : o.follow.blend) * (o.follow.outAt == null ? 1 : 1 - BTO.ease("inOut", clamp((t - o.follow.outAt) / 0.5)));
        return [lerp(base[0], b.x, k), lerp(base[1], b.y, k)]; } return base; };
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
      const P0 = BTO.projector(cam(t)); const ppm = ppmAt(t); const fo = focusAt(t); const P = (x, y, z = 0) => P0((x - fo[0]) * ppm, (y - fo[1]) * ppm, z * ppm);
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
        if ((pl.style || o.tokenStyle) === "standing") { // upright silhouette 1.85 m tall for low cameras (still not a likeness)
          const [x, y] = posOf(pl, t); const b0 = P(x - 0.28, y, 0), b1 = P(x + 0.28, y, 0), s1 = P(x + 0.26, y, 1.45), s0 = P(x - 0.26, y, 1.45), hd = P(x, y, 1.68), hr = Math.abs(P(x + 0.13, y, 1.68)[0] - hd[0]);
          g += `<ellipse cx="${q[0].toFixed(1)}" cy="${q[1].toFixed(1)}" rx="${(Math.abs(b1[0] - b0[0]) * 0.9).toFixed(1)}" ry="${(Math.abs(b1[0] - b0[0]) * 0.25).toFixed(1)}" fill="#000" opacity="0.4"/>`;
          g += `<path d="${poly([b0, b1, s1, s0])}" fill="${col}" stroke="${C.paper}" stroke-width="2"/><circle cx="${hd[0].toFixed(1)}" cy="${hd[1].toFixed(1)}" r="${hr.toFixed(1)}" fill="${col}" stroke="${C.paper}" stroke-width="2"/>`;
          if (pl.number != null && hr > 6) { const m = P(x, y, 0.95); g += BTO.text(m[0], m[1] + hr * 0.4, String(pl.number), { size: hr * 1.3, weight: 800, family: BTO.style.type.num, fill: C.paper, extra: 'data-decor="1"' }); }
          continue; }
        g += `<ellipse cx="${q[0].toFixed(1)}" cy="${(q[1] + r * 0.35).toFixed(1)}" rx="${(r * 1.1).toFixed(1)}" ry="${(r * 0.45).toFixed(1)}" fill="#000" opacity="0.35"/>`;
        g += `<circle cx="${q[0].toFixed(1)}" cy="${(q[1] - r * 0.4).toFixed(1)}" r="${r.toFixed(1)}" fill="${col}" stroke="${C.paper}" stroke-width="${(2.5 * q[2]).toFixed(1)}"/>`;
        if (pl.number != null) g += BTO.text(q[0], q[1] - r * 0.4 + r * 0.38, String(pl.number), { size: r * 1.05, weight: 800, family: BTO.style.type.num, fill: C.paper, extra: 'data-decor="1"' });
        if (pl.highlightAt != null && t >= pl.highlightAt) { const k = clamp((t - pl.highlightAt) / 0.3); g += `<circle cx="${q[0].toFixed(1)}" cy="${(q[1] - r * 0.4).toFixed(1)}" r="${(r * (1.5 + 0.4 * (1 - k))).toFixed(1)}" fill="none" stroke="${C.amber}" stroke-width="4" opacity="${k.toFixed(3)}"/>`; } }
      // ball and its ground shadow
      const b = ballAt(t); if (b) { const sh = P(b.x, b.y, 0), q = P(b.x, b.y, b.z + 0.11); const r = 7 * q[2];
        g += `<ellipse cx="${sh[0].toFixed(1)}" cy="${sh[1].toFixed(1)}" rx="${(r * 1.1).toFixed(1)}" ry="${(r * 0.5).toFixed(1)}" fill="#000" opacity="${(0.45 - Math.min(0.3, b.z * 0.02)).toFixed(3)}"/>`;
        g += `<circle cx="${q[0].toFixed(1)}" cy="${q[1].toFixed(1)}" r="${r.toFixed(1)}" fill="#ffffff" stroke="${C.ink}" stroke-width="1.5"/>`; }
      // kicks: spin-free ghost (dashed), the flight so far (amber), the ball with a rotating seam
      for (const k of kicks) { if (t < k.at) { const q = P(k.x0, k.y0, MODEL.radius); g += `<circle cx="${q[0].toFixed(1)}" cy="${q[1].toFixed(1)}" r="${(MODEL.radius * ppm * 1.6 * q[2]).toFixed(1)}" fill="#fff" stroke="${C.ink}" stroke-width="1.5"/>`; continue; }
        const lt = (t - k.at) * (k.timeScale || 1); const n = Math.min(k.path.length, Math.floor(lt * 240) + 1);
        if (k.ghost && t >= k.ghostAt) { const gk = clamp((t - k.ghostAt) / 0.4); g += `<path d="${"M" + k.ghost.filter((_, i) => i % 4 === 0).map((q) => P(q.x, q.y, q.z)).map((q) => `${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join("L")}" fill="none" stroke="${C.paper}" stroke-width="4" stroke-dasharray="12 12" opacity="${(0.75 * gk).toFixed(3)}"/>`; }
        const pts = k.path.slice(0, n).filter((_, i) => i % 3 === 0 || i === n - 1).map((q) => P(q.x, q.y, q.z));
        if (pts.length > 1) g += `<path d="${"M" + pts.map((q) => `${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join("L")}" fill="none" stroke="${C.amber}" stroke-width="${(5 + 2 * pts[pts.length - 1][2]).toFixed(1)}" stroke-linecap="round" opacity="0.95"/>`;
        const b = k.path[n - 1]; const sh = P(b.x, b.y, 0), q = P(b.x, b.y, b.z); const r = Math.max(6, MODEL.radius * ppm * 1.6 * q[2]);
        g += `<ellipse cx="${sh[0].toFixed(1)}" cy="${sh[1].toFixed(1)}" rx="${(r * 1.1).toFixed(1)}" ry="${(r * 0.45).toFixed(1)}" fill="#000" opacity="0.35"/>`;
        const ang = (lt * (k.spinRps || 0) * 360 * (k.seamSlow || 0.08)) % 360; // seam turns slowly enough to read, in the spin's direction
        g += `<g transform="translate(${q[0].toFixed(1)} ${q[1].toFixed(1)}) rotate(${ang.toFixed(1)})"><circle r="${r.toFixed(1)}" fill="#fff" stroke="${C.ink}" stroke-width="1.5"/><path d="M${-r * 0.8} 0 Q0 ${-r * 0.5} ${r * 0.8} 0" stroke="${C.ink}" stroke-width="${Math.max(1.5, r * 0.18).toFixed(1)}" fill="none"/></g>`; }
      return g;
    } };
  });
})(window.BTO);
