// BTO Premium Studio - generic components (structured props only; nothing here is topic-specific).
//   paper-card, print-surface, kinetic-type, labels, quote-card, timeline-ruler, scan-line,
//   run-length-strip, search-window, exploded-layers, reticle, desk-grain
(function (BTO) {
  "use strict";
  const { clamp, lerp, p, esc } = BTO;
  const P = () => BTO.style.palette;
  const T = () => BTO.style.type;

  // text measurement with the embedded fonts (deterministic once fonts are loaded)
  const mctx = document.createElement("canvas").getContext("2d");
  // letterSpacing (px) is added after every character, as SVG/CSS letter-spacing does
  BTO.measure = (s, size, weight = 700, family, ls = 0) => { mctx.font = `${weight} ${size}px ${family || T().sans}`; return mctx.measureText(s).width + ls * String(s).length; };

  // entrance helper: spring scale + rise, returns { s, dy, op }
  BTO.enter = (t, at, { spring = "settle", rise = 40, from = 0.92 } = {}) => {
    if (at == null) return { s: 1, dy: 0, op: 1 }; const k = BTO.sp(t, at, spring);
    return { s: lerp(from, 1, k), dy: (1 - k) * rise, op: clamp((t - at) / 0.18) };
  };
  const exitOp = (t, outAt, d = 0.3) => (outAt == null ? 1 : 1 - clamp((t - outAt) / d));

  // ---- desk-grain: fine paper/desk grain, generated once with a seeded RNG ----------------------------
  let grainURI = null;
  BTO.def("desk-grain", (o) => {
    if (!grainURI) { const c = document.createElement("canvas"); c.width = c.height = 256; const g = c.getContext("2d"); const img = g.createImageData(256, 256); const r = BTO.rng(o.seed || 7);
      for (let i = 0; i < img.data.length; i += 4) { const v = 128 + (r() - 0.5) * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; } g.putImageData(img, 0, 0); grainURI = c.toDataURL("image/png"); }
    return { draw: () => `<defs><pattern id="grain" width="256" height="256" patternUnits="userSpaceOnUse"><image href="${grainURI}" width="256" height="256"/></pattern></defs><rect x="-1200" y="-1200" width="3480" height="4320" fill="url(#grain)" opacity="${o.opacity || 0.045}" style="mix-blend-mode:overlay"/>` };
  });

  // ---- paper-card: a printed card / label lying on the desk ----------------------------------------------
  BTO.paperCard = ({ x, y, w, h, rot = 0, fill, r = 10, shadow = true }) =>
    `<g transform="rotate(${rot} ${x + w / 2} ${y + h / 2})"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill || P().paper}" ${shadow ? 'filter="url(#shadow)"' : ""}/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="url(#paperShade)"/></g>`;
  BTO.def("paper-card", (o) => ({ draw: (t) => { const e = BTO.enter(t, o.enterAt, { rise: 60 }); const op = e.op * exitOp(t, o.outAt) * (o.opacityKeys ? BTO.keys(t, o.opacityKeys) : 1); if (op <= 0.002) return "";
    const cx = o.x + o.w / 2, cy = o.y + o.h / 2; return `<g opacity="${op}" transform="translate(${cx} ${cy + e.dy}) scale(${e.s}) translate(${-cx} ${-cy})">${BTO.paperCard(o)}</g>`; } }));

  // ---- print-surface: procedurally drawn printed matter (flyer, magazine, box, form, label) ----------------
  // Text is greeked (bars), never real words, so it never competes with the explanation or the captions.
  // geometry of square-ish features is published in BTO.geo[o.id].candidates (world px) for search-window.
  BTO.geo = BTO.geo || {};
  BTO.def("print-surface", (o, scene) => {
    const r = BTO.rng(o.seed || 1); const C = P(); const { x, y, w, h } = o; const parts = []; const cand = [];
    const bars = (x0, y0, ww, n, lh = 22, col = C.inkSoft, op = 0.55) => { for (let i = 0; i < n; i += 1) { const lw = ww * (i === n - 1 ? 0.45 + 0.3 * r() : 0.82 + 0.18 * r()); parts.push(`<rect x="${x0}" y="${y0 + i * lh * 1.7}" width="${lw.toFixed(1)}" height="${lh * 0.62}" rx="${lh * 0.3}" fill="${col}" opacity="${op}"/>`); } };
    const kind = o.kind || "flyer"; let base = C.paper;
    if (kind === "box") {
      base = "#c79c6b"; parts.push(`<rect x="${x}" y="${y}" width="${w}" height="${h * 0.16}" fill="#b98d5d"/><line x1="${x}" y1="${y + h * 0.16}" x2="${x + w}" y2="${y + h * 0.16}" stroke="#a37a4c" stroke-width="3"/>`);
      parts.push(`<rect x="${x + w * 0.08}" y="${y + h * 0.24}" width="${w * 0.36}" height="${h * 0.1}" rx="6" fill="#3b2f22" opacity="0.85"/>`); bars(x + w * 0.08, y + h * 0.4, w * 0.5, 3, 20, "#3b2f22", 0.55);
      for (let i = 0; i < 2; i += 1) { const ax = x + w * (0.66 + i * 0.13), ay = y + h * 0.27; parts.push(`<path d="M${ax} ${ay + 60} V${ay + 12} M${ax - 20} ${ay + 30} L${ax} ${ay + 8} L${ax + 20} ${ay + 30}" stroke="#3b2f22" stroke-width="7" fill="none" stroke-linecap="round" opacity="0.8"/>`); }
      parts.push(`<rect x="${x + w * 0.08}" y="${y + h * 0.72}" width="${w * 0.84}" height="${h * 0.14}" rx="4" fill="none" stroke="#3b2f22" stroke-width="4" opacity="0.6"/>`); bars(x + w * 0.12, y + h * 0.75, w * 0.6, 2, 18, "#3b2f22", 0.45);
    } else if (kind === "flyer") {
      parts.push(`<rect x="${x}" y="${y}" width="${w}" height="${h * 0.22}" fill="${C.coral}"/><rect x="${x + w * 0.08}" y="${y + h * 0.06}" width="${w * 0.6}" height="${h * 0.08}" rx="8" fill="${C.paper}" opacity="0.92"/>`);
      parts.push(`<circle cx="${x + w * 0.5}" cy="${y + h * 0.45}" r="${w * 0.2}" fill="${C.teal}" opacity="0.8"/><circle cx="${x + w * 0.62}" cy="${y + h * 0.4}" r="${w * 0.1}" fill="${C.amber}" opacity="0.9"/>`);
      bars(x + w * 0.08, y + h * 0.68, w * 0.84, 4, 20);
    } else if (kind === "magazine") {
      parts.push(`<rect x="${x + w * 0.07}" y="${y + h * 0.05}" width="${w * 0.7}" height="${h * 0.07}" rx="6" fill="${C.ink}" opacity="0.85"/>`);
      const px = x + w * 0.07, py = y + h * 0.16, pw = w * 0.86, ph = h * 0.32; parts.push(`<rect x="${px}" y="${py}" width="${pw}" height="${ph}" fill="#7b8a8a"/>`);
      for (let i = 0; i < 9; i += 1) for (let j = 0; j < 5; j += 1) parts.push(`<circle cx="${px + 14 + i * pw / 9}" cy="${py + 16 + j * ph / 5}" r="${4 + 5 * r()}" fill="#4d5a5a" opacity="0.7"/>`);
      bars(x + w * 0.07, y + h * 0.53, w * 0.4, 7, 16); bars(x + w * 0.53, y + h * 0.53, w * 0.4, 7, 16);
    } else if (kind === "form") {
      parts.push(`<rect x="${x}" y="${y}" width="${w}" height="${h * 0.075}" fill="${C.teal}" opacity="0.85"/>`); bars(x + w * 0.06, y + h * 0.02, w * 0.4, 1, 26, C.paper, 0.9);
      // logo square (top right) - a square-ish candidate
      const ls = w * 0.11; parts.push(`<rect x="${x + w * 0.83}" y="${y + h * 0.1}" width="${ls}" height="${ls}" fill="${C.ink}" opacity="0.85"/><rect x="${x + w * 0.83 + ls * 0.3}" y="${y + h * 0.1 + ls * 0.3}" width="${ls * 0.4}" height="${ls * 0.4}" fill="${C.paper}"/>`);
      cand.push({ x: x + w * 0.83 + ls / 2, y: y + h * 0.1 + ls / 2, s: ls, kind: "logo" });
      bars(x + w * 0.06, y + h * 0.12, w * 0.45, 3, 18);
      // field boxes
      for (let i = 0; i < 2; i += 1) { const fy = y + h * (0.27 + i * 0.08); parts.push(`<rect x="${x + w * 0.06}" y="${fy}" width="${w * 0.88}" height="${h * 0.055}" fill="none" stroke="${C.inkSoft}" stroke-width="3" opacity="0.7"/>`); }
      // table grid
      const tx = x + w * 0.06, ty = y + h * 0.47, tw = w * 0.88, th = h * 0.26, rows = 5, cols = 4;
      parts.push(`<rect x="${tx}" y="${ty}" width="${tw}" height="${th}" fill="none" stroke="${C.inkSoft}" stroke-width="3" opacity="0.75"/>`);
      for (let i = 1; i < rows; i += 1) parts.push(`<line x1="${tx}" y1="${ty + i * th / rows}" x2="${tx + tw}" y2="${ty + i * th / rows}" stroke="${C.inkSoft}" stroke-width="2" opacity="0.6"/>`);
      for (let j = 1; j < cols; j += 1) parts.push(`<line x1="${tx + j * tw / cols}" y1="${ty}" x2="${tx + j * tw / cols}" y2="${ty + th}" stroke="${C.inkSoft}" stroke-width="2" opacity="0.6"/>`);
      cand.push({ x: tx + 1.5 * tw / cols, y: ty + 2.5 * th / rows, s: th / rows, kind: "cell" });
      // checkboxes
      for (let i = 0; i < 3; i += 1) { const cx = x + w * 0.08, cy = y + h * (0.79 + i * 0.055), s = h * 0.032; parts.push(`<rect x="${cx}" y="${cy}" width="${s}" height="${s}" fill="none" stroke="${C.ink}" stroke-width="4" opacity="0.8"/>`); bars(cx + s * 1.6, cy + s * 0.15, w * 0.4, 1, 18); if (i === 1) cand.push({ x: cx + s / 2, y: cy + s / 2, s, kind: "checkbox" }); }
      // stamp
      parts.push(`<circle cx="${x + w * 0.78}" cy="${y + h * 0.86}" r="${w * 0.09}" fill="none" stroke="${C.coral}" stroke-width="5" opacity="0.6"/><line x1="${x + w * 0.58}" y1="${y + h * 0.95}" x2="${x + w * 0.94}" y2="${y + h * 0.95}" stroke="${C.inkSoft}" stroke-width="3" opacity="0.6"/>`);
    } else if (kind === "label") {
      bars(x + w * 0.08, y + h * 0.08, w * 0.6, 2, 22);
    }
    const g = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.radius || 8}" fill="${base}" filter="url(#shadow)"/>` + parts.join("") + `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.radius || 8}" fill="url(#paperShade)"/>`;
    const rot = o.rotate || 0, cx = x + w / 2, cy = y + h / 2;
    const rad = rot * Math.PI / 180; BTO.geo[o.id || scene.id + "-print"] = { candidates: cand.map((c) => ({ ...c, x: cx + (c.x - cx) * Math.cos(rad) - (c.y - cy) * Math.sin(rad), y: cy + (c.x - cx) * Math.sin(rad) + (c.y - cy) * Math.cos(rad) })) };
    if (o.enterAt != null) BTO.cue(o.enterAt, "paper", 0.7, (cx - 540) / 540);
    return { draw: (t) => { const e = BTO.enter(t, o.enterAt, { rise: 120, from: 1.06, spring: "settle" }); const op = (o.enterFrom ? clamp((t - o.enterAt) / 0.12) : e.op) * exitOp(t, o.outAt, 0.35) * (o.opacityKeys ? BTO.keys(t, o.opacityKeys) : 1); if (op <= 0) return "";
      if (o.enterFrom) { // fly in from a side on a spring, with a little spin that settles (thrown onto the desk)
        const k = o.enterAt == null ? 1 : BTO.sp(t, o.enterAt, "settle"); const d = { left: [-900, 0], right: [900, 0], top: [0, -1300], bottom: [0, 1300] }[o.enterFrom] || [0, 0];
        return `<g opacity="${op.toFixed(3)}" transform="translate(${((1 - k) * d[0]).toFixed(1)} ${((1 - k) * d[1]).toFixed(1)}) rotate(${(rot + (1 - k) * (o.spin || 18)).toFixed(3)} ${cx} ${cy})">${g}</g>`; }
      return `<g opacity="${op.toFixed(3)}" transform="translate(${cx} ${cy - e.dy}) scale(${e.s.toFixed(4)}) rotate(${rot}) translate(${-cx} ${-cy})">${g}</g>`; } };
  });

  // ---- kinetic-type: words that rise on springs, type on, pop, or expand from initials ---------------------
  // items: [{ at, outAt, text, x, y, size, weight, family: sans|serif|num, color, anchor, style: rise|type|pop|expand, expandFrom, letterSpacing }]
  BTO.def("kinetic-type", (o) => {
    const fam = (f) => (f === "serif" ? T().serif : f === "num" ? T().num : T().sans);
    (o.items || []).forEach((it) => BTO.cue(it.at, it.style === "type" ? "type" : "pop", 0.45));
    return { draw: (t) => (o.items || []).map((it) => {
      if (t < it.at) return ""; const op = exitOp(t, it.outAt, 0.28); if (op <= 0) return "";
      const size = it.size || T().scale.title, weight = it.weight || 800, family = fam(it.family), color = it.color ? (P()[it.color] || it.color) : P().text, ls = it.letterSpacing || 0;
      const base = { size, weight, family, fill: color, ls, extra: 'paint-order="stroke" stroke="rgba(21,19,15,.55)" stroke-width="6"' };
      if (it.style === "type") { const n = Math.floor(clamp((t - it.at) / (it.dur || 0.6)) * it.text.length + 0.0001);
        return BTO.text(it.x, it.y, it.text.slice(0, Math.max(1, n)), { ...base, anchor: it.anchor || "middle", op }); }
      if (it.style === "pop") { const k = BTO.sp(t, it.at, "snap"); return `<g transform="translate(${it.x} ${it.y}) scale(${(0.6 + 0.4 * k).toFixed(4)}) translate(${-it.x} ${-it.y})">${BTO.text(it.x, it.y, it.text, { ...base, anchor: it.anchor || "middle", op: op * clamp((t - it.at) / 0.12) })}</g>`; }
      // strike: a figure the narration rejects ("claims of ... are considered incorrect") is shown, then struck through
      if (it.style === "strike") { const w = BTO.measure(it.text, size, weight, family, ls); const k = BTO.ease("inOut", clamp((t - it.at - (it.strikeDelay || 0.5)) / 0.35)); const x0 = (it.anchor || "middle") === "middle" ? it.x - w / 2 : it.x;
        return BTO.text(it.x, it.y, it.text, { ...base, fill: P().muted, anchor: it.anchor || "middle", op: op * clamp((t - it.at) / 0.12) }) + (k > 0 ? `<line x1="${(x0 - 14).toFixed(1)}" y1="${(it.y - size * 0.32).toFixed(1)}" x2="${(x0 - 14 + (w + 28) * k).toFixed(1)}" y2="${(it.y - size * 0.32).toFixed(1)}" stroke="${P().coral}" stroke-width="${Math.max(6, size * 0.09).toFixed(1)}" stroke-linecap="round" opacity="${op.toFixed(3)}"/>` : ""); }
      if (it.style === "expand") {
        // initials (e.g. "QR") sit together first, then fly to their places in the full words and the rest types on
        const words = it.text.split(" "); const sp = BTO.measure(" ", size, weight, family, ls); const ws = words.map((w) => BTO.measure(w, size, weight, family, ls));
        const total = ws.reduce((a, b) => a + b, 0) + sp * (words.length - 1); const ini = words.map((w) => w[0]); const iw = ini.map((c) => BTO.measure(c, size, weight, family, ls));
        const gap = size * 0.08; const itot = iw.reduce((a, b) => a + b, 0) + gap * (ini.length - 1);
        const k = BTO.sp(t, it.expandAt, "settle"); const typeK = clamp((t - it.expandAt - 0.12) / 0.5);
        let fx = it.x - total / 2, ix = it.x - itot / 2, out = "";
        words.forEach((w, j) => { const x0 = lerp(ix, fx, t < it.expandAt ? 0 : k); out += BTO.text(x0, it.y, w[0], { ...base, anchor: "start", fill: P().amber, op });
          const restN = Math.round(typeK * (w.length - 1)); if (restN > 0) out += BTO.text(x0 + iw[j], it.y, w.slice(1, 1 + restN), { ...base, anchor: "start", op: op });
          fx += ws[j] + sp; ix += iw[j] + gap; });
        return out;
      }
      // rise (default): per word spring rise with stagger
      const words = it.text.split(" "); const sp = BTO.measure(" ", size, weight, family, ls); const ws = words.map((w) => BTO.measure(w, size, weight, family, ls)); const total = ws.reduce((a, b) => a + b, 0) + sp * (words.length - 1);
      let x0 = (it.anchor === "start" ? it.x : it.anchor === "end" ? it.x - total : it.x - total / 2); let out = "";
      words.forEach((w, j) => { const at = it.at + j * (it.stagger == null ? 0.07 : it.stagger); const kk = BTO.sp(t, at, "settle"); const oo = clamp((t - at) / 0.16) * op;
        out += BTO.text(x0, it.y + (1 - kk) * size * 0.5, w, { ...base, anchor: "start", op: oo }); x0 += ws[j] + sp; });
      return out;
    }).join("") };
  });

  // ---- labels: leader-line callouts in world space ------------------------------------------------------------
  BTO.def("labels", (o) => { (o.items || []).forEach((it) => BTO.cue(it.at, "tick", 0.35)); return { draw: (t) => (o.items || []).map((it) => {
    const k = clamp((t - it.at) / 0.45) * exitOp(t, it.outAt); return BTO.label(it.x, it.y, it.lx, it.ly, it.text, k, { size: it.size || T().scale.label, anchor: it.anchor || "start", color: it.color && P()[it.color], pill: !!it.pill }); }).join("") }; });

  // ---- quote-card: a verbatim source quote with attribution (screen space, above the caption band) -------------
  BTO.def("quote-card", (o) => { BTO.cue(o.at, "paper", 0.5); if (o.emphasis) BTO.cue(o.emphasis.at, "sweep", 0.25, 0, { dur: 0.4 }); return { draw: (t) => {
    if (t < o.at) return ""; const k = BTO.sp(t, o.at, "settle"); const op = clamp((t - o.at) / 0.2) * exitOp(t, o.outAt); if (op <= 0) return "";
    const C = P(); const lines = o.lines || [o.quote]; const size = o.size || 52; const lh = size * (o.lineHeight || 1.22); const y0 = o.y || 1020; const attrGap = Math.max(34, size * 0.95); const hgt = 70 + lines.length * lh + 30 + attrGap;
    let g = `<rect x="80" y="${y0}" width="920" height="${hgt}" rx="18" fill="${C.paper}" filter="url(#shadow)"/><rect x="80" y="${y0}" width="10" height="${hgt}" rx="4" fill="${C.amber}"/>`;
    g += BTO.text(120, y0 + 84, "“", { size: 96, weight: 700, family: T().serif, fill: C.amberDeep, anchor: "start" });
    lines.forEach((l, i) => { g += BTO.text(178, y0 + 64 + (i + 1) * lh - 14, l, { size, weight: 600, family: T().serif, fill: C.ink, anchor: "start", op: clamp((t - o.at - 0.12 - i * 0.1) / 0.25) }); });
    // emphasis: an amber underline drawn under a phrase of one line as it is spoken
    if (o.emphasis && t >= o.emphasis.at) { const ln = lines[o.emphasis.line || 0]; const i0 = ln.indexOf(o.emphasis.text);
      if (i0 >= 0) { const x0 = 178 + BTO.measure(ln.slice(0, i0), size, 600, T().serif), w = BTO.measure(o.emphasis.text, size, 600, T().serif), yy = y0 + 64 + ((o.emphasis.line || 0) + 1) * lh - 14 + 12;
        g += BTO.draw(`M${x0.toFixed(1)} ${yy} H${(x0 + w).toFixed(1)}`, BTO.ease("standard", p(t, o.emphasis.at, o.emphasis.at + (o.emphasis.dur || 0.45))), { width: 6, stroke: C.amber }); } }
    g += BTO.text(178, y0 + 64 + lines.length * lh + attrGap, o.attribution || "", { size: T().scale.credit, weight: 600, fill: C.inkSoft, anchor: "start", ls: 1.2, op: clamp((t - o.at - 0.4) / 0.3) });
    return `<g opacity="${op.toFixed(3)}" transform="translate(0 ${((1 - k) * 80).toFixed(2)}) rotate(${((o.rotate || 0) * (0.6 + 0.4 * k)).toFixed(3)} 540 ${y0 + hgt / 2})">${g}</g>`; } }; });

  // ---- timeline-ruler: a year ruler that scrolls and settles on a year (needle at centre) --------------------
  BTO.def("timeline-ruler", (o) => {
    const P0 = P(); const light = o.theme === "light"; const C = { ...P0, paper: light ? P0.ink : P0.paper, text: light ? P0.ink : P0.text, muted: light ? P0.inkSoft : P0.muted, amber: light ? P0.amberDeep : P0.amber };
    const px = o.pxPerYear || 120; const y = o.y || 1000; const cx = o.x || 540;
    BTO.cue(o.enterAt, "roll", 0.55, 0, { dur: o.arriveAt - o.enterAt }); BTO.cue(o.arriveAt, "lock", 0.7);
    return { draw: (t) => {
      if (t < o.enterAt) return ""; const op = clamp((t - o.enterAt) / 0.25) * exitOp(t, o.outAt);
      const k = t < o.arriveAt ? BTO.ease("inOut", p(t, o.enterAt, o.arriveAt)) * 0.97 : 0.97 + 0.03 * BTO.sp(t, o.arriveAt, "snap");
      const yr = lerp(o.fromYear, o.year, k); let g = `<line x1="-200" y1="${y}" x2="1280" y2="${y}" stroke="${C.muted}" stroke-width="3" opacity="0.6"/>`;
      for (let Y = Math.floor(yr - 6); Y <= Math.ceil(yr + 6); Y += 1) { const x = cx + (Y - yr) * px; const major = Y % 5 === 0; const near = 1 - clamp(Math.abs(x - cx) / 520);
        g += `<line x1="${x.toFixed(1)}" y1="${y}" x2="${x.toFixed(1)}" y2="${y - (major ? 44 : 24)}" stroke="${C.paper}" stroke-width="${major ? 4 : 2.5}" opacity="${(0.25 + 0.6 * near).toFixed(3)}"/>`;
        if (major || Y === o.year) g += BTO.text(x, y + 62, String(Y), { size: 36, weight: 600, family: T().num, fill: C.muted, op: 0.35 + 0.5 * near }); }
      const arr = t >= o.arriveAt ? BTO.sp(t, o.arriveAt, "snap") : 0;
      g += `<path d="M${cx} ${y - 66} l-14 -24 h28 z" fill="${C.amber}" opacity="${(0.6 + 0.4 * arr).toFixed(3)}"/><line x1="${cx}" y1="${y - 64}" x2="${cx}" y2="${y + 8}" stroke="${C.amber}" stroke-width="5"/>`;
      g += BTO.text(cx, y - 120, String(Math.round(yr)), { size: T().scale.display * (1 + 0.08 * arr * (1 - clamp((t - o.arriveAt) / 0.6))), weight: 600, family: T().num, fill: arr > 0 ? C.amber : C.text, ls: 2 });
      return `<g opacity="${op.toFixed(3)}" transform="rotate(${o.rotate || 0} ${cx} ${y})">${g}</g>`; } };
  });

  // ---- scan-line: a reading line that sweeps (passes) or holds at a y; optional hit flashes on rects -----------
  // passes: [{ at, dur, y0, y1 }]; hold: { at, outAt, y }; x0, x1; hits: [{ x0, x1, y0, y1 }] flash where the line crosses
  BTO.scanY = (o, t) => { for (const ps of o.passes || []) if (t >= ps.at && t < ps.at + ps.dur) return lerp(ps.y0, ps.y1, BTO.ease("inOut", p(t, ps.at, ps.at + ps.dur))); if (o.hold && t >= o.hold.at && (o.hold.outAt == null || t < o.hold.outAt)) return o.hold.y; return null; };
  BTO.def("scan-line", (o) => { (o.passes || []).forEach((ps) => BTO.cue(ps.at, "sweep", 0.55, 0, { dur: ps.dur })); return { draw: (t) => {
    let y = BTO.scanY(o, t); if (y == null) return ""; const C = P(); let x0 = o.x0 == null ? 40 : o.x0, x1 = o.x1 == null ? 1040 : o.x1;
    // track: follow a finder of a qr-symbol (its centre's y; x span centred on it)
    if (o.track) { const c = BTO.geo[o.track.geo].at(t)[o.track.finder || 0]; y = c.y; const hw = (o.track.halfWidth || 260); x0 = c.x - hw; x1 = c.x + hw; }
    const op = o.outAt == null ? 1 : 1 - clamp((t - o.outAt) / 0.3); if (op <= 0) return "";
    const col = o.color ? (C[o.color] || o.color) : C.amber;
    let g = `<rect x="${x0}" y="${y - 26}" width="${x1 - x0}" height="52" fill="${col}" opacity="0.12"/><line x1="${x0}" y1="${y}" x2="${x1}" y2="${y}" stroke="${col}" stroke-width="${o.width || 5}" opacity="0.95"/>`;
    for (const h of o.hits || []) if (y >= h.y0 && y <= h.y1) g += `<line x1="${h.x0}" y1="${y}" x2="${h.x1}" y2="${y}" stroke="${C.text}" stroke-width="9" stroke-linecap="round"/>`;
    return op < 1 ? `<g opacity="${op.toFixed(3)}">${g}</g>` : g; } }; });

  // ---- run-length-strip: black/white runs measured along a line, drawn as a bar, with optional ratio labels ----
  // runs: [1,1,3,1,1] (relative widths, dark first unless firstLight) or runsFn via BTO.runsFrom[o.source]
  BTO.runsFrom = {};
  BTO.def("run-length-strip", (o) => {
    const notes = [0, 3, 7, 3, 0]; // a soft pentatonic contour per run; the long middle run gets the high note
    if (!o.silent && o.labelsAt != null) (o.runs || []).forEach((_, i) => BTO.cue(o.labelsAt + i * (o.labelStagger || 0.14), "pluck", 0.5, (i - 2) * 0.25, { note: notes[i % notes.length] }));
    if (!o.silent && o.enterAt != null) BTO.cue(o.enterAt, "sweep", 0.35, 0, { dur: o.drawDur || 0.6 });
    return { draw: (t) => {
      if (t < o.enterAt) return ""; const C = P(); const op = clamp((t - o.enterAt) / 0.2) * exitOp(t, o.outAt); if (op <= 0) return "";
      const src = o.source && BTO.runsFrom[o.source] ? BTO.runsFrom[o.source](t) : null;
      const runs = src ? src.runs : o.runs; const width = src ? src.width : o.width; const tot = runs.reduce((a, b) => a + b, 0);
      const drawK = BTO.ease("standard", p(t, o.enterAt, o.enterAt + (o.drawDur || 0.6))); const h = o.height || 70; let x = o.x - width / 2; let g = "";
      // labelPanel: one paper panel holds caption, bar and labels, so they read on any background
      if (o.labelPanel) { const pw = Math.max(width + 60, o.panelWidth || 0), top = o.y - h / 2 - 34 - (o.captionSize || 34) - 22, bot = o.y + h / 2 + 74 + 28;
        g += `<rect x="${(o.x - pw / 2).toFixed(1)}" y="${top.toFixed(1)}" width="${pw.toFixed(1)}" height="${(bot - top).toFixed(1)}" rx="18" fill="${C.paper}" filter="url(#shadow)"/>`; }
      else g += `<rect x="${(o.x - width / 2 - 14).toFixed(1)}" y="${o.y - h / 2 - 14}" width="${(width + 28).toFixed(1)}" height="${h + 28}" rx="10" fill="${C.paper}" opacity="${o.panel === false ? 0 : 0.96}"/>`;
      runs.forEach((rw, i) => { const ww = width * rw / tot; const dark = o.firstLight ? i % 2 === 1 : i % 2 === 0; const vis = clamp(drawK * runs.length - i);
        if (vis > 0) g += `<rect x="${x.toFixed(2)}" y="${o.y - h / 2}" width="${(ww * vis).toFixed(2)}" height="${h}" fill="${dark ? C.ink : C.paper2}"/>`;
        if (o.labelsAt != null && t >= o.labelsAt + i * (o.labelStagger || 0.14)) { const kk = BTO.sp(t, o.labelsAt + i * (o.labelStagger || 0.14), "snap");
          g += BTO.text(x + ww / 2, o.y + h / 2 + 74 - (1 - kk) * 26, String(o.labels ? o.labels[i] : rw), { size: o.labelSize || 54, weight: 600, family: T().num, fill: o.labelColor ? (C[o.labelColor] || o.labelColor) : C.amber, op: clamp(kk * 1.4) }); }
        x += ww; });
      if (o.caption) g += BTO.text(o.x, o.y - h / 2 - 34, o.caption, { size: o.captionSize || T().scale.small, weight: 800, fill: o.captionColor ? (C[o.captionColor] || o.captionColor) : C.muted, ls: 2, op: clamp((t - o.enterAt) / 0.4) });
      return `<g opacity="${op.toFixed(3)}">${g}</g>`; } };
  });

  // ---- search-window: a template reticle that visits candidate spots and accepts or rejects each ------------------
  // stops: [{ at, x, y, s, verdict: reject|match|none }]; candidatesFrom: id in BTO.geo (fills x,y,s by index)
  BTO.def("search-window", (o) => {
    const stops = (o.stops || []).map((s) => { if (s.candidate != null && o.candidatesFrom) { const c = (BTO.geo[o.candidatesFrom] || { candidates: [] }).candidates[s.candidate]; if (c) return { ...c, s: Math.max(c.s * 1.6, 110), ...s, x: c.x, y: c.y }; } return s; });
    stops.forEach((s) => { BTO.cue(s.at, "whoosh", 0.25, (s.x - 540) / 540); if (s.verdict === "reject") BTO.cue(s.at + 0.32, "reject", 0.5, (s.x - 540) / 540); if (s.verdict === "match") BTO.cue(s.at + 0.32, "match", 0.7); });
    return { draw: (t) => {
      if (!stops.length || t < stops[0].at - 0.3) return ""; const C = P(); const op = clamp((t - stops[0].at + 0.3) / 0.3) * exitOp(t, o.outAt);
      let i = 0; while (i < stops.length - 1 && t >= stops[i + 1].at) i += 1; const a = stops[i], b = stops[Math.min(i + 1, stops.length - 1)];
      const travel = b === a ? 1 : BTO.ease("inOut", p(t, b.at - (o.travel || 0.32), b.at)); const cur = t >= b.at ? b : { x: lerp(a.x, b.x, travel), y: lerp(a.y, b.y, travel), s: lerp(a.s, b.s, travel) };
      const at = t >= b.at ? b : a; const settle = BTO.sp(t, at.at, "snap"); const S = cur.s * (1.15 - 0.15 * settle);
      let g = `<g transform="translate(${cur.x.toFixed(1)} ${cur.y.toFixed(1)})">`; const hs = S / 2, L = S * 0.28;
      g += [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy]) => `<path d="M${sx * hs} ${sy * (hs - L)} V${sy * hs} H${sx * (hs - L)}" stroke="${C.amber}" stroke-width="6" fill="none" stroke-linecap="round"/>`).join("");
      // template icon: nested squares (the pattern being looked for)
      const ic = 44; g += `<g transform="translate(${hs + 26} ${-hs})"><rect x="0" y="0" width="${ic}" height="${ic}" fill="${C.ink}"/><rect x="${ic / 7}" y="${ic / 7}" width="${ic * 5 / 7}" height="${ic * 5 / 7}" fill="${C.paper}"/><rect x="${ic * 2 / 7}" y="${ic * 2 / 7}" width="${ic * 3 / 7}" height="${ic * 3 / 7}" fill="${C.ink}"/><rect x="-4" y="-4" width="${ic + 8}" height="${ic + 8}" fill="none" stroke="${C.amber}" stroke-width="3"/></g>`;
      g += "</g>";
      // verdict marks persist at visited stops
      stops.forEach((s) => { const vk = clamp((t - s.at - 0.3) / 0.2); if (vk <= 0 || !s.verdict || s.verdict === "none") return;
        if (s.verdict === "reject") { const r = 22 * BTO.sp(t, s.at + 0.3, "snap"); g += `<g transform="translate(${s.x} ${s.y})" opacity="${(0.95 * vk).toFixed(3)}"><circle r="${r * 1.5}" fill="${C.desk}" opacity="0.6"/><path d="M${-r} ${-r} L${r} ${r} M${r} ${-r} L${-r} ${r}" stroke="${C.coral}" stroke-width="8" stroke-linecap="round"/></g>`; }
        if (s.verdict === "match") g += `<g transform="translate(${s.x} ${s.y})" opacity="${vk}"><path d="M-26 2 L-6 22 L30 -20" stroke="${C.amber}" stroke-width="10" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>`; });
      return `<g opacity="${op.toFixed(3)}">${g}</g>`; } };
  });

  // ---- exploded-layers: planar layers that lift into an isometric stack and collapse back ---------------------------
  // layers: [{ w, h, fill, inner?: { w, h } (ring) }] bottom first; cx, cy; explodeAt, collapseAt; gap; labels: [{ text, at }]
  BTO.isoStack = (layers, k, { cx, cy, gap = 90, tilt = 1 }) => {
    const rot = 45 * k * tilt, sy = 1 - 0.42 * k * tilt; let g = "";
    layers.forEach((L, i) => { const h = i * gap * k; const ring = L.inner ? `M${-L.w / 2} ${-L.h / 2} h${L.w} v${L.h} h${-L.w} z M${-L.inner.w / 2} ${-L.inner.h / 2} v${L.inner.h} h${L.inner.w} v${-L.inner.h} z` : `M${-L.w / 2} ${-L.h / 2} h${L.w} v${L.h} h${-L.w} z`;
      if (k > 0.02) g += `<g transform="translate(${cx} ${cy - h + 16 * k}) scale(1 ${sy.toFixed(4)}) rotate(${rot.toFixed(3)})" opacity="${(0.35 * k).toFixed(3)}"><path d="${ring}" fill="#000" fill-rule="evenodd" filter="url(#soft)"/></g>`;
      g += `<g transform="translate(${cx} ${cy - h}) scale(1 ${sy.toFixed(4)}) rotate(${rot.toFixed(3)})"><path d="${ring}" fill="${L.fill}" fill-rule="evenodd" ${L.stroke ? `stroke="${L.stroke}" stroke-width="${L.strokeWidth || 3}"` : ""}/></g>`; });
    return g;
  };
  BTO.def("exploded-layers", (o) => { if (o.explodeAt != null) BTO.cue(o.explodeAt, "lift", 0.7); if (o.collapseAt != null) BTO.cue(o.collapseAt, "drop", 0.6); return { draw: (t) => {
    const k = o.explodeAt == null ? 0 : BTO.sp(t, o.explodeAt, "settle") * (o.collapseAt == null || t < o.collapseAt ? 1 : 1 - BTO.ease("inOut", p(t, o.collapseAt, o.collapseAt + 0.45)));
    return BTO.isoStack(o.layers.map((L) => ({ ...L, fill: P()[L.fill] || L.fill })), k, o); } }; });

  // ---- reticle: phone-camera viewfinder framing (screen space) ------------------------------------------------------
  BTO.def("reticle", (o) => { BTO.cue(o.enterAt, "whoosh", 0.35); return { draw: (t) => {
    if (t < o.enterAt) return ""; const C = P(); const k = BTO.sp(t, o.enterAt, "settle"); const op = clamp((t - o.enterAt) / 0.2) * exitOp(t, o.outAt); if (op <= 0) return "";
    const { x, y, w, h } = o; const s = lerp(1.25, 1, k); const cx = x + w / 2, cy = y + h / 2; const L = 90, r = 36;
    let g = `<path d="M0 0 H1080 V1920 H0 Z M${x} ${y + r} a${r} ${r} 0 0 1 ${r} ${-r} H${x + w - r} a${r} ${r} 0 0 1 ${r} ${r} V${y + h - r} a${r} ${r} 0 0 1 ${-r} ${r} H${x + r} a${r} ${r} 0 0 1 ${-r} ${-r} Z" fill="#000" fill-rule="evenodd" opacity="${(0.42 * op).toFixed(3)}"/>`;
    g += `<g transform="translate(${cx} ${cy}) scale(${s.toFixed(4)}) translate(${-cx} ${-cy})" opacity="${op.toFixed(3)}">` + [[x, y, 1, 1], [x + w, y, -1, 1], [x + w, y + h, -1, -1], [x, y + h, 1, -1]].map(([px, py, sx, sy]) =>
      `<path d="M${px} ${py + sy * L} V${py + sy * r} a${r} ${r} 0 0 ${sx * sy > 0 ? 1 : 0} ${sx * r} ${-sy * r} H${px + sx * L}" stroke="${C.paper}" stroke-width="7" fill="none" stroke-linecap="round"/>`).join("") + "</g>";
    return g; } }; });
})(window.BTO);
