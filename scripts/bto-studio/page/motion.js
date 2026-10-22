// BTO Premium Studio - in-page motion runtime (runs inside the page built by scripts/bto-studio/render.js).
// Every frame is a pure function of time t: no CSS animation, no requestAnimationFrame, no Date. A frame can be
// rendered alone, in any order, by any worker, and comes out identical.
//
//   BTO.init(data)  -> meta (resolved scenes, captions, audio cues)
//   BTO.frame(t)    -> draws the frame at t seconds
//   BTO.inspectText() -> visible text boxes (same shape as scripts/fr-premium/text-qa.js expects)
//
// Components register with BTO.def(name, factory). factory(props, scene, BTO) returns
//   { draw(t, view) -> svg string,  cues?: [{ t, kind, gain, pan }] }
// where view = { k: scene progress, local: t - scene.start, cam }.
(function () {
  "use strict";
  const BTO = { W: 1080, H: 1920, comps: {}, scenes: [], cues: [], audio: [], captionsOff: [] };
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, k) => a + (b - a) * k;
  const p = (t, a, b) => clamp((t - a) / Math.max(1e-6, b - a));
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "");
  Object.assign(BTO, { clamp, lerp, p, esc, norm });

  // ---- easing: CSS-equivalent cubic-bezier (Newton with bisection fallback) -------------------------
  function bezier(x1, y1, x2, y2) {
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx, cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    const X = (s) => ((ax * s + bx) * s + cx) * s, Y = (s) => ((ay * s + by) * s + cy) * s, dX = (s) => (3 * ax * s + 2 * bx) * s + cx;
    return (x) => {
      if (x <= 0) return 0; if (x >= 1) return 1;
      let s = x; for (let i = 0; i < 8; i += 1) { const e = X(s) - x; if (Math.abs(e) < 1e-6) return Y(s); const d = dX(s); if (Math.abs(d) < 1e-6) break; s -= e / d; }
      let lo = 0, hi = 1; s = x; for (let i = 0; i < 40; i += 1) { const v = X(s); if (Math.abs(v - x) < 1e-6) break; if (x > v) lo = s; else hi = s; s = (lo + hi) / 2; }
      return Y(s);
    };
  }
  BTO.bezier = bezier;
  // ---- closed-form damped spring from 0 to 1 with zero initial velocity (no simulation, so seekable) ----
  BTO.spring = (t, { stiffness = 170, damping = 20, mass = 1 } = {}) => {
    if (t <= 0) return 0;
    const w0 = Math.sqrt(stiffness / mass), z = damping / (2 * Math.sqrt(stiffness * mass));
    if (z < 1) { const wd = w0 * Math.sqrt(1 - z * z); return 1 - Math.exp(-z * w0 * t) * (Math.cos(wd * t) + (z * w0 / wd) * Math.sin(wd * t)); }
    if (z === 1) return 1 - Math.exp(-w0 * t) * (1 + w0 * t);
    const r1 = -w0 * (z - Math.sqrt(z * z - 1)), r2 = -w0 * (z + Math.sqrt(z * z - 1));
    return 1 - (r2 * Math.exp(r1 * t) - r1 * Math.exp(r2 * t)) / (r2 - r1);
  };
  // spring by name from the style pack, started at time t0
  BTO.sp = (t, t0, name = "settle") => BTO.spring(t - t0, BTO.style.motion.spring[name] || BTO.style.motion.spring.settle);
  BTO.ease = (name, k) => (BTO._eases[name] || BTO._eases.standard)(clamp(k));
  // eased progress of t through [a, b]
  BTO.ep = (t, a, b, name = "standard") => BTO.ease(name, p(t, a, b));
  // piecewise interpolation through keys [[t, value], ...] (values may be numbers or arrays)
  BTO.keys = (t, keys, name = "standard") => {
    if (!keys.length) return 0; if (t <= keys[0][0]) return keys[0][1]; const last = keys[keys.length - 1]; if (t >= last[0]) return last[1];
    for (let i = 1; i < keys.length; i += 1) if (t < keys[i][0]) { const [t0, v0] = keys[i - 1], [t1, v1] = keys[i]; const k = BTO.ease(keys[i][2] || name, p(t, t0, t1));
      return Array.isArray(v0) ? v0.map((v, j) => lerp(v, v1[j], k)) : lerp(v0, v1, k); }
    return last[1];
  };
  // deterministic RNG (mulberry32)
  BTO.rng = (seed) => { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };

  // ---- time anchors from the measured narration ---------------------------------------------------
  //   12.5 | "L3" (line start) | "L3.end" | "L3:QR" (start of the first "QR" in L3) | "L3:QR#2" | "L3:QR.end" | any of these "+0.2" / "-0.1"
  BTO.at = (ref) => {
    if (typeof ref === "number") return ref; if (ref == null) throw new Error("empty time anchor");
    const m = String(ref).match(/^(.+?)([+\-]\d+(?:\.\d+)?)?$/); if (!m) throw new Error("bad anchor " + ref);
    const base = m[1].trim(), off = m[2] ? parseFloat(m[2]) : 0;
    if (/^[\d.]+$/.test(base)) return parseFloat(base) + off;
    if (base === "end") return BTO.duration + off;
    const wm = base.match(/^(L\d+):([^#.]+)(?:#(\d+))?(\.end)?$/);
    if (wm) { const ws = BTO.tl.words.filter((w) => w.line === wm[1] && norm(w.text) === norm(wm[2])); const w = ws[(+wm[3] || 1) - 1];
      if (!w) throw new Error(`anchor ${ref}: word "${wm[2]}" not in ${wm[1]}`); return (wm[4] ? w.end : w.start) + off; }
    const lm = base.match(/^(L\d+)(\.start|\.end)?$/);
    if (lm) { const l = BTO.tl.lines.find((x) => x.id === lm[1]); if (!l) throw new Error(`anchor ${ref}: no line ${lm[1]}`); return (lm[2] === ".end" ? l.end : l.start) + off; }
    throw new Error("unknown anchor " + ref);
  };
  // resolve time anchors under props into seconds: keys ending in "At", "at", "from", "to", and the first element of every
  // [time, value] pair in "...Keys" arrays (and finderOpacity's per-finder key arrays)
  BTO.resolve = (o) => {
    if (Array.isArray(o)) return o.map(BTO.resolve);
    if (o && typeof o === "object") { const r = {}; const keyed = (arr) => arr.map(([tt, ...rest]) => [BTO.at(tt), ...rest]);
      for (const [k, v] of Object.entries(o)) r[k] = (/At$|^at$|^from$|^to$/.test(k) && (typeof v === "string" || typeof v === "number")) ? BTO.at(v)
        : /Keys$/.test(k) && Array.isArray(v) ? keyed(v) : k === "finderOpacity" ? Object.fromEntries(Object.entries(v).map(([i, ks]) => [i, keyed(ks)])) : BTO.resolve(v); return r; }
    return o;
  };
  BTO.cue = (t, kind, gain = 1, pan = 0, extra = {}) => BTO.audio.push({ t: +t.toFixed(3), kind, gain, pan, ...extra });

  // ---- SVG helpers ------------------------------------------------------------------------------------
  BTO.text = (x, y, s, { size = 40, weight = 700, fill, family, anchor = "middle", ls = 0, op = 1, extra = "" } = {}) =>
    op <= 0.001 ? "" : `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-family="${family || BTO.style.type.sans}" font-weight="${weight}" font-size="${size}" letter-spacing="${ls}" fill="${fill || BTO.style.palette.text}" text-anchor="${anchor}" opacity="${op.toFixed(3)}" ${extra}>${esc(s)}</text>`;
  // a stroke that draws itself from 0 to 1 (pathLength-normalised)
  BTO.draw = (d, k, { stroke, width = 4, op = 1, cap = "round", extra = "" } = {}) => k <= 0 ? "" :
    `<path d="${d}" fill="none" stroke="${stroke || BTO.style.palette.amber}" stroke-width="${width}" stroke-linecap="${cap}" stroke-linejoin="round" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="${(1 - clamp(k)).toFixed(4)}" opacity="${op}" ${extra}/>`;
  // leader label: dot at (x,y), line to (lx,ly), label beside; k = 0..1 entrance
  BTO.label = (x, y, lx, ly, s, k, { color, size = 40, anchor = "start", fill, weight = 700, pill = false } = {}) => {
    if (k <= 0) return ""; const C = BTO.style.palette; const c = color || C.amber; const e = BTO.ease("decelerate", k);
    const mx = lerp(x, lx, e), my = lerp(y, ly, e); const dx = anchor === "start" ? 16 : anchor === "end" ? -16 : 0;
    // pill: a dark rounded backing so the label reads over any surface
    let bg = ""; if (pill && BTO.measure) { const w = BTO.measure(s, size, weight, null, BTO.style.type.labelTracking) + 30, h = size * 1.3; const x0 = anchor === "start" ? lx + dx - 15 : anchor === "end" ? lx + dx - w + 15 : lx - w / 2;
      bg = `<rect x="${x0.toFixed(1)}" y="${(ly - h / 2).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="${(h / 2).toFixed(1)}" fill="${C.desk}" opacity="${(0.82 * clamp(k * 2 - 0.6)).toFixed(3)}"/>`; }
    return `<g><circle cx="${x}" cy="${y}" r="${7 * clamp(k * 3)}" fill="${c}"/><line x1="${x}" y1="${y}" x2="${mx.toFixed(1)}" y2="${my.toFixed(1)}" stroke="${c}" stroke-width="3"/>` + bg +
      BTO.text(lx + dx, ly + size * 0.34, s, { size, weight, anchor, fill: fill || C.text, ls: BTO.style.type.labelTracking, op: clamp(k * 2 - 0.6), extra: `paint-order="stroke" stroke="${C.desk}" stroke-width="7" stroke-opacity="0.7"` }) + "</g>";
  };
  BTO.chip = (label, op = 1, { x = 1008, y = 182 } = {}) => op <= 0 ? "" :
    `<div data-role="chip" style="position:absolute;right:${1080 - x}px;top:${y}px;opacity:${op};display:flex;align-items:center;gap:10px;padding:8px 16px;border-radius:24px;background:rgba(21,19,15,.62);border:1.5px solid rgba(243,234,216,.18);font:700 30px ${BTO.style.type.sans};letter-spacing:2.2px;color:${BTO.style.palette.paper}"><span style="width:11px;height:11px;border-radius:2px;background:${BTO.style.palette.amber}"></span>${esc(label)}</div>`;

  // ---- defs shared by all scenes (built once per frame; cheap) -----------------------------------------
  BTO.defs = () => { const C = BTO.style.palette; return `<defs>
    <radialGradient id="lamp" cx="30%" cy="22%" r="95%"><stop offset="0" stop-color="${C.lamp}"/><stop offset="0.55" stop-color="${C.desk2}"/><stop offset="1" stop-color="${C.desk}"/></radialGradient>
    <radialGradient id="vig" cx="50%" cy="44%" r="72%"><stop offset="60%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity="0.45"/></radialGradient>
    <linearGradient id="paperShade" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fffaf0" stop-opacity="0.16"/><stop offset="1" stop-color="#000" stop-opacity="0.10"/></linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="150%"><feGaussianBlur in="SourceAlpha" stdDeviation="16"/><feOffset dy="18"/><feComponentTransfer><feFuncA type="linear" slope="0.45"/></feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="8"/></filter>
    <filter id="whipBlur" x="-10%" y="0" width="120%" height="100%"><feGaussianBlur stdDeviation="46 0"/></filter>
    <radialGradient id="envPaper" cx="40%" cy="30%" r="90%"><stop offset="0" stop-color="#fbf5e8"/><stop offset="0.6" stop-color="${C.paper}"/><stop offset="1" stop-color="${C.paper2}"/></radialGradient>
    <radialGradient id="envAmber" cx="45%" cy="35%" r="90%"><stop offset="0" stop-color="#f7c46d"/><stop offset="0.6" stop-color="${C.amber}"/><stop offset="1" stop-color="${C.amberDeep}"/></radialGradient>
    <radialGradient id="envTeal" cx="35%" cy="25%" r="95%"><stop offset="0" stop-color="#1f4a45"/><stop offset="0.6" stop-color="#14302d"/><stop offset="1" stop-color="#0b1a18"/></radialGradient>
    <radialGradient id="envSpot" cx="50%" cy="38%" r="60%"><stop offset="0" stop-color="#3b3328"/><stop offset="0.7" stop-color="#18150f"/><stop offset="1" stop-color="#0c0a07"/></radialGradient>
    <pattern id="sensor" width="18" height="18" patternUnits="userSpaceOnUse"><rect x="8" y="8" width="2" height="2" fill="#ffffff" opacity="0.16"/></pattern>
    <radialGradient id="envSpace" cx="62%" cy="24%" r="105%"><stop offset="0" stop-color="${C.lamp}"/><stop offset="0.5" stop-color="${C.desk2}"/><stop offset="1" stop-color="${C.desk}"/></radialGradient>
    <radialGradient id="vigLight" cx="50%" cy="44%" r="75%"><stop offset="65%" stop-color="#3a2a10" stop-opacity="0"/><stop offset="100%" stop-color="#3a2a10" stop-opacity="0.22"/></radialGradient>
  </defs>`; };
  // scene environments (drawn in screen space under each scene, so transitions carry their own backgrounds)
  const ENV = {
    desk: () => `<rect width="1080" height="1920" fill="url(#lamp)"/>`,
    spot: () => `<rect width="1080" height="1920" fill="url(#envSpot)"/>`,
    paper: () => `<rect width="1080" height="1920" fill="url(#envPaper)"/><rect width="1080" height="1920" fill="url(#vigLight)"/>`,
    amber: () => `<rect width="1080" height="1920" fill="url(#envAmber)"/><rect width="1080" height="1920" fill="url(#vigLight)"/>`,
    teal: () => `<rect width="1080" height="1920" fill="url(#envTeal)"/>`,
    scanner: () => `<rect width="1080" height="1920" fill="#050505"/><rect width="1080" height="1920" fill="url(#sensor)"/>`,
    space: () => `<rect width="1080" height="1920" fill="url(#envSpace)"/><rect width="1080" height="1920" fill="url(#vig)"/>`,
    void: () => `<rect width="1080" height="1920" fill="${BTO.style.palette.desk}"/>`,
  };
  BTO.envs = Object.keys(ENV);
  BTO.isLightEnv = (e) => e === "paper" || e === "amber";

  // ---- camera ----------------------------------------------------------------------------------------
  // keys: [{ at, x, y, z, r }] world point (x,y) is shown at the world centre; eased with motion.ease.camera
  const camAt = (keys, t) => {
    if (!keys || !keys.length) return { x: 540, y: 800, z: 1, r: 0 };
    const v = BTO.keys(t, keys.map((k) => [k.at, [k.x != null ? k.x : 540, k.y != null ? k.y : 800, k.z != null ? k.z : 1, k.r || 0], k.ease]), "camera");
    return { x: v[0], y: v[1], z: v[2], r: v[3] };
  };
  const camTransform = (c, depth = 1) => {
    const [cx, cy] = BTO.style.frame.worldCenter; const z = 1 + (c.z - 1) * depth, x = cx + (c.x - cx) * depth, y = cy + (c.y - cy) * depth, r = c.r * depth;
    return `translate(${cx} ${cy}) scale(${z.toFixed(5)}) rotate(${r.toFixed(4)}) translate(${(-x).toFixed(3)} ${(-y).toFixed(3)})`;
  };
  BTO.camAt = camAt;

  // ---- registration and init --------------------------------------------------------------------------
  BTO.def = (name, factory) => { BTO.comps[name] = factory; };
  BTO.init = (data) => {
    BTO.style = data.style; BTO.tl = data.timeline; BTO.duration = data.duration; BTO.assets = data.assets || {}; BTO.images = data.images || {}; BTO.watermark = data.watermark || null;
    BTO._eases = Object.fromEntries(Object.entries(BTO.style.motion.ease).map(([k, v]) => [k, bezier(...v)]));
    const sb = data.storyboard; BTO.audio = [];
    BTO.captionsOff = (sb.captionsOff || []).map((w) => [BTO.at(w.from), BTO.at(w.to)]);
    BTO.scenes = sb.scenes.map((s, i) => {
      const start = BTO.at(s.start), end = i < sb.scenes.length - 1 ? BTO.at(sb.scenes[i + 1].start) : BTO.duration;
      const sc = { id: s.id, index: i, start, end, spec: s, transition: { type: "cut", dur: 0, ...(s.transition || {}) }, camKeys: (s.camera || []).map((k) => ({ ...k, at: BTO.at(k.at) })), chips: s.chips || [] };
      if (sc.transition.focus) sc.transition.focus = sc.transition.focus.slice();
      sc.layers = (s.layers || []).map((L, j) => {
        const f = BTO.comps[L.component]; if (!f) throw new Error(`scene ${s.id}: unknown component ${L.component}`);
        const inst = f(BTO.resolve(L.props || {}), sc, BTO) || {};
        return { component: L.component, depth: L.depth == null ? 1 : L.depth, screen: !!L.screen, inst, id: `${s.id}.${j}` };
      });
      if (!(end > start)) throw new Error(`scene ${s.id} has no duration (${start}..${end})`);
      return sc;
    });
    if (sb.transitionsAudio !== false) BTO.scenes.forEach((s) => { if (s.index && s.transition.type !== "cut" && s.transition.type !== "continuity") BTO.cue(s.start, "transition-" + s.transition.type, 0.8); });
    BTO.buildCaptions(BTO.style.captions);
    return { duration: BTO.duration, scenes: BTO.scenes.map((s) => ({ id: s.id, start: +s.start.toFixed(3), end: +s.end.toFixed(3), transition: s.transition, components: s.layers.map((l) => l.component), purpose: s.spec.visualPurpose, evidence: s.spec.evidence || [], lines: s.spec.lines || [] })),
      cues: BTO.cues.map((c) => ({ start: c.shown, end: c.end, lines: c.lines.map((l) => l.map((w) => w.text).join(" ")) })), audio: BTO.audio.sort((a, b) => a.t - b.t), captionsOff: BTO.captionsOff };
  };

  // ---- captions: word-aligned, two balanced lines, current word in amber ------------------------------
  BTO.buildCaptions = ({ maxChars = 24, maxWords = 6 } = {}) => {
    const off = (w) => BTO.captionsOff.some(([a, b]) => w.start >= a - 0.01 && w.start < b);
    const ws = BTO.tl.words.filter((w) => !off(w)); const cues = []; let cur = [];
    const len = (arr) => arr.map((w) => w.text).join(" ").length; const flush = () => { if (cur.length) cues.push(cur); cur = []; };
    ws.forEach((w, i) => { const prev = cur[cur.length - 1]; if (prev && (prev.line !== w.line || w.start - prev.end > 0.6)) flush(); cur.push(w);
      const nxt = ws[i + 1]; if (cur.length >= maxWords || (/[.,;:!?]$/.test(w.text) && cur.length >= 2) || (nxt && len([...cur, nxt]) > maxChars * 2 - 4)) flush(); });
    flush();
    BTO.cues = cues.map((c, i) => { const txt = c.map((w) => w.text); let lines = [c];
      if (txt.join(" ").length > maxChars) { let best = null; for (let k = 1; k < c.length; k += 1) { const sc = Math.max(txt.slice(0, k).join(" ").length, txt.slice(k).join(" ").length); if (!best || sc < best.sc) best = { sc, k }; } lines = [c.slice(0, best.k), c.slice(best.k)]; }
      const next = cues[i + 1] ? cues[i + 1][0].start : Infinity; const offAfter = BTO.captionsOff.map(([a]) => a).filter((a) => a > c[0].start);
      return { start: c[0].start, shown: c[0].start, end: Math.min(next, c[c.length - 1].end + 0.4, ...offAfter), lines }; });
  };
  const captionAt = (t) => {
    const cue = BTO.cues.find((c) => t >= c.start - 0.03 && t < c.end); if (!cue) return ""; const S = BTO.style.captions;
    const k = p(t, cue.start - 0.03, cue.start + 0.1);
    const line = (ws) => ws.map((w) => { const on = t >= w.start - 0.02, now = on && t < w.end + 0.05; return `<span style="color:${now ? S.current : on ? S.spoken : S.upcoming}">${esc(w.text)}</span>`; }).join(" ");
    return `<div data-role="caption" style="position:absolute;left:96px;right:96px;top:${S.top}px;transform:translate(0,${((1 - BTO.ease("decelerate", k)) * 12).toFixed(2)}px);opacity:${k.toFixed(3)};text-align:center;"><span data-role="caption-box" style="display:inline-block;padding:10px 26px 14px;border-radius:20px;background:rgba(21,19,15,.62);font:${S.font};letter-spacing:-0.3px;text-shadow:0 2px 0 rgba(0,0,0,.45);">${cue.lines.map(line).join("<br>")}</span></div>`;
  };

  // ---- transitions: how the incoming scene (k: 0..1) and the outgoing one are composed ------------------
  // returns { out: {transform, opacity, clip}, inn: {...}, overlay: svg }
  const TR = {
    cut: () => ({ out: { opacity: 0 }, inn: {} }),
    continuity: () => ({ out: { opacity: 0 }, inn: {} }),
    dissolve: (k) => ({ out: { opacity: 1 }, inn: { opacity: BTO.ease("inOut", k) } }),
    // zoom through a focus point of the outgoing scene into the incoming one
    "match-zoom": (k, tr) => { const [fx, fy] = tr.focus || [540, 800]; const e = BTO.ease("accelerate", clamp(k * 1.25)), d = BTO.ease("decelerate", clamp(k * 1.4 - 0.4));
      const zo = 1 + 5 * e; return { out: { opacity: 1 - clamp(k * 1.6 - 0.35), transform: `translate(${fx} ${fy}) scale(${zo.toFixed(4)}) translate(${-fx} ${-fy})` },
        inn: { opacity: d, transform: `translate(${fx} ${fy}) scale(${(0.72 + 0.28 * d).toFixed(4)}) translate(${-fx} ${-fy})` } }; },
    // push: both scenes slide together (direction: left|up)
    push: (k, tr) => { const e = BTO.ease("inOut", k); const dx = tr.direction === "up" ? 0 : -1080, dy = tr.direction === "up" ? -1920 : 0;
      return { out: { transform: `translate(${(dx * e).toFixed(2)} ${(dy * e).toFixed(2)})` }, inn: { transform: `translate(${(-dx * (1 - e)).toFixed(2)} ${(-dy * (1 - e)).toFixed(2)})` } }; },
    // a scan line sweeps down: above it the incoming scene, below it the outgoing one
    "scan-wipe": (k, tr) => { const y = -40 + 2000 * BTO.ease("inOut", k); const C = { ...BTO.style.palette, amber: (tr && tr.color) || BTO.style.palette.amber };
      return { out: { clip: `<rect x="0" y="${y.toFixed(1)}" width="1080" height="${(1960 - y).toFixed(1)}"/>` }, inn: { clip: `<rect x="0" y="-40" width="1080" height="${(y + 40).toFixed(1)}"/>` },
        overlay: `<rect x="0" y="${(y - 3).toFixed(1)}" width="1080" height="6" fill="${C.amber}" opacity="${(0.9 * Math.sin(Math.PI * k)).toFixed(3)}"/><rect x="0" y="${(y - 40).toFixed(1)}" width="1080" height="40" fill="${C.amber}" opacity="${(0.12 * Math.sin(Math.PI * k)).toFixed(3)}"/>` }; },
    // circular reveal from a focus point
    iris: (k, tr) => { const [fx, fy] = tr.focus || [540, 800]; const r = 2300 * BTO.ease("inOut", k);
      return { out: {}, inn: { clip: `<circle cx="${fx}" cy="${fy}" r="${r.toFixed(1)}"/>` }, overlay: `<circle cx="${fx}" cy="${fy}" r="${r.toFixed(1)}" fill="none" stroke="${BTO.style.palette.amber}" stroke-width="5" opacity="${(0.85 * (1 - k)).toFixed(3)}"/>` }; },
  };
  // decode-flash: a white flash grows from the focus (the code "decodes"), then fades off the incoming scene
  TR["decode-flash"] = (k, tr) => { const [fx, fy] = tr.focus || [540, 800]; const C = BTO.style.palette;
    if (k < 0.45) { const r = 2300 * BTO.ease("accelerate", k / 0.45); return { out: {}, inn: { opacity: 0 }, overlay: `<circle cx="${fx}" cy="${fy}" r="${r.toFixed(1)}" fill="#fffaf0"/><circle cx="${fx}" cy="${fy}" r="${(r * 0.92).toFixed(1)}" fill="none" stroke="${C.amber}" stroke-width="10" opacity="0.8"/>` }; }
    return { out: { opacity: 0 }, inn: {}, overlay: `<rect width="1080" height="1920" fill="#fffaf0" opacity="${(1 - BTO.ease("decelerate", (k - 0.45) / 0.55)).toFixed(3)}"/>` }; };
  // square-iris: a square opening from a focus (the shape itself opens into the next scene)
  TR["square-iris"] = (k, tr) => { const [fx, fy] = tr.focus || [540, 800]; const h = 2400 * BTO.ease("inOut", k); const rot = (tr.rotate || 0) * (1 - k);
    const sq = `<rect x="${(fx - h / 2).toFixed(1)}" y="${(fy - h / 2).toFixed(1)}" width="${h.toFixed(1)}" height="${h.toFixed(1)}" transform="rotate(${rot.toFixed(2)} ${fx} ${fy})"/>`;
    return { out: {}, inn: { clip: sq }, overlay: `<rect x="${(fx - h / 2).toFixed(1)}" y="${(fy - h / 2).toFixed(1)}" width="${h.toFixed(1)}" height="${h.toFixed(1)}" transform="rotate(${rot.toFixed(2)} ${fx} ${fy})" fill="none" stroke="${BTO.style.palette.amber}" stroke-width="12" opacity="${(0.9 * (1 - k)).toFixed(3)}"/>` }; };
  // whip: a fast pan with horizontal motion blur at peak speed
  TR.whip = (k) => { const e = BTO.ease("inOut", k); const blur = Math.sin(Math.PI * k) > 0.35;
    return { out: { transform: `translate(${(-1250 * e).toFixed(1)} 0)`, filter: blur ? "url(#whipBlur)" : null }, inn: { transform: `translate(${(1250 * (1 - e)).toFixed(1)} 0)`, filter: blur ? "url(#whipBlur)" : null } }; };
  BTO.transitions = Object.keys(TR);

  let clipN = 0;
  const sceneSvg = (s, t, mod) => {
    const cam = camAt(s.camKeys, t); const local = t - s.start; const view = { k: p(t, s.start, s.end), local, cam, t };
    let world = "", screen = "";
    for (const L of s.layers) { const g = L.inst.draw ? L.inst.draw(t, view) || "" : ""; if (!g) continue;
      if (L.screen) screen += g; else world += `<g transform="${camTransform(cam, L.depth)}">${g}</g>`; }
    let env = ENV[s.spec.env || "desk"](); const sh = s.spec.envShift;
    if (sh && ENV[sh.to]) { const kk = BTO.ep(t, BTO.at(sh.at), BTO.at(sh.at) + (sh.dur || 0.5), "inOut"); if (kk > 0) env += `<g opacity="${kk.toFixed(3)}">${ENV[sh.to]()}</g>`; }
    let body = env + world + screen; mod = mod || {};
    if (mod.filter) body = `<g filter="${mod.filter}">${body}</g>`;
    if (mod.clip) { clipN += 1; const id = `clip${clipN}`; body = `<clipPath id="${id}">${mod.clip}</clipPath><g clip-path="url(#${id})">${body}</g>`; }
    if (mod.transform) body = `<g transform="${mod.transform}">${body}</g>`;
    const op = mod.opacity == null ? 1 : mod.opacity; if (op <= 0.001) return "";
    return op < 1 ? `<g opacity="${op.toFixed(4)}">${body}</g>` : body;
  };

  // ---- frame ----------------------------------------------------------------------------------------------
  let svgEl, hudEl;
  BTO.frame = async (t) => {
    svgEl = svgEl || document.getElementById("svg"); hudEl = hudEl || document.getElementById("hud"); clipN = 0;
    const i = BTO.scenes.findIndex((s) => t >= s.start && t < s.end); const cur = BTO.scenes[i < 0 ? BTO.scenes.length - 1 : i];
    const C = BTO.style.palette;
    let svg = BTO.defs() + `<rect width="1080" height="1920" fill="${C.desk}"/>`;
    const tr = cur.transition; const k = tr.dur > 0 ? p(t, cur.start, cur.start + tr.dur) : 1;
    if (cur.index > 0 && k < 1 && TR[tr.type] && tr.type !== "cut") {
      const m = TR[tr.type](k, tr); const prev = BTO.scenes[cur.index - 1];
      svg += sceneSvg(prev, t, m.out) + sceneSvg(cur, t, m.inn) + (m.overlay || "");
    } else svg += sceneSvg(cur, t, null);
    svg += `<rect width="1080" height="1920" fill="url(#vig)" pointer-events="none"/>`;
    // HUD: handle, provenance chips (scene-level), captions
    const chipOp = cur.index > 0 && k < 1 ? BTO.ease("inOut", k) : 1;
    let hud = `<div data-role="handle" style="position:absolute;left:0;right:0;top:112px;text-align:center;opacity:.72;font:600 26px ${BTO.style.type.sans};letter-spacing:1px;color:${BTO.isLightEnv(cur.spec.env) ? C.ink : C.paper};text-shadow:${BTO.isLightEnv(cur.spec.env) ? "none" : "0 2px 6px rgba(0,0,0,.7)"}">${esc(BTO.style.identity.handle)}</div>`;
    cur.chips.forEach((c, j) => { hud += BTO.chip(BTO.style.identity[c] || c, chipOp, { y: 182 + j * 62 }); });
    // non-publishable renders (research pending, pilots) carry their status on every frame
    if (BTO.watermark) hud += `<div data-role="watermark" style="position:absolute;left:50%;transform:translateX(-50%);top:1500px;white-space:nowrap;padding:8px 14px;border-radius:8px;background:rgba(150,30,20,.82);font:800 30px ${BTO.style.type.sans};letter-spacing:1.6px;color:#fff">${esc(BTO.watermark)}</div>`;
    hud += captionAt(t);
    svgEl.innerHTML = svg; hudEl.innerHTML = hud;
    return cur.id;
  };

  // ---- text inspection (same box format as scripts/fr-premium/text-qa.js) ---------------------------------
  BTO.inspectText = () => {
    const vis = (el) => { let o = 1; for (let n = el; n && n.id !== "stage"; n = n.parentElement) { const cs = getComputedStyle(n); if (cs.display === "none" || cs.visibility === "hidden") return 0; o *= Number(cs.opacity); if (n.getAttribute && n.getAttribute("opacity") != null) o *= Number(n.getAttribute("opacity")); } return o; };
    const out = []; const rectOf = (el) => { if (el instanceof SVGElement) return el.getBoundingClientRect(); const r = document.createRange(); r.selectNodeContents(el); return r.getBoundingClientRect(); };
    const add = (el, role) => { const r = rectOf(el); if (r.width < 2 || r.height < 2 || r.right < 0 || r.left > 1080 || r.bottom < 0 || r.top > 1920) return; const o = vis(el); if (o < 0.5) return;
      const fs = parseFloat(el.getAttribute && el.getAttribute("font-size")) || parseFloat(getComputedStyle(el).fontSize) || 0;
      const sc = el instanceof SVGElement && el.getScreenCTM ? Math.hypot(el.getScreenCTM().a, el.getScreenCTM().b) : 1;
      out.push({ role, text: el.textContent.trim().replace(/\s+/g, " ").slice(0, 60), x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height), fontPx: +(fs * sc).toFixed(1), opacity: +o.toFixed(2) }); };
    document.querySelectorAll("#svg text").forEach((el) => add(el, el.closest("[data-decor]") ? "decor" : "svg"));
    document.querySelectorAll('#hud [data-role="caption"]').forEach((el) => add(el.querySelector('[data-role="caption-box"]') || el, "caption")); // the styled box carries the font
    document.querySelectorAll("#hud div").forEach((el) => { if (el.closest('[data-role="caption"]')) return; if ([...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) add(el, el.dataset.role === "handle" ? "handle" : "hud"); });
    return out;
  };
  window.BTO = BTO;
})();
