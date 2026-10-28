// Premium studio - run-length signature components (generic: any "what does a scan line read" story).
//   BTO.ringRuns(rings)  exact runs along a line through the centre of nested squares/rings
//                        rings: [{ size, dark }] outer -> inner (the innermost fills the centre)
//   signature-compare    rows of candidate signatures vs a template signature, each revealed on a spoken anchor,
//                        with a verdict mark (match / no match); bars only, no numbers (numbers need evidence)
//   signature-ledger     a growing ledger of seeded run strips (conceptual print samples) with a search head that
//                        slides along each row looking for the template; by construction no ledger row contains it,
//                        then the template row drops in and matches
(function (BTO) {
  "use strict";
  const { clamp, lerp, p } = BTO;
  BTO.ringRuns = (rings) => { const out = []; for (let i = 0; i < rings.length; i += 1) { const r = rings[i], next = rings[i + 1];
      const w = next ? (r.size - next.size) / 2 : r.size; out.push({ dark: !!r.dark, n: w }); }
    const inner = out.pop(); return [...out, inner, ...out.slice().reverse()]; };
  const matches = (runs, tpl) => { const want = tpl.map((x) => x.n / tpl[0].n);
    for (let i = 0; i + tpl.length <= runs.length; i += 1) { const q = runs.slice(i, i + tpl.length); if (q[0].dark !== tpl[0].dark) continue;
      if (q.every((x, j) => x.dark === tpl[j].dark && Math.abs(x.n / q[0].n - want[j]) < 0.12)) return i; } return -1; };
  BTO.signatureMatch = matches;
  const bar = (runs, x, y, w, h, op, C, dark = C.ink, light = C.paper2) => { const tot = runs.reduce((s, r) => s + r.n, 0); let xx = x, g = "";
    runs.forEach((r) => { const ww = w * r.n / tot; g += `<rect x="${xx.toFixed(1)}" y="${y.toFixed(1)}" width="${Math.max(0.6, ww).toFixed(1)}" height="${h}" fill="${r.dark ? dark : light}"/>`; xx += ww; });
    return `<g opacity="${op.toFixed(3)}">${g}</g>`; };

  BTO.def("signature-compare", (o) => {
    const C = BTO.style.palette; const tpl = o.template.rings ? BTO.ringRuns(o.template.rings) : o.template.runs;
    const items = o.items.map((it) => ({ ...it, runs: it.rings ? BTO.ringRuns(it.rings) : it.runs }));
    items.forEach((it) => { it.match = matches(it.runs, tpl) >= 0; BTO.cue(it.at, "tick", 0.35); BTO.cue(it.at + 0.3, it.match ? "match" : "reject", 0.5); });
    if (o.template.at != null) BTO.cue(o.template.at, "pop", 0.4);
    return { draw: (t) => {
      const op = (o.enterAt == null ? 1 : clamp((t - o.enterAt) / 0.25)) * (o.outAt == null ? 1 : 1 - clamp((t - o.outAt) / 0.3)); if (op <= 0) return "";
      const { x, y, w } = o; const rowH = o.rowH || 92, barH = o.barH || 40, lw = o.labelW || 250; let g = "";
      const rows = [{ ...o.template, runs: tpl, isTpl: true }, ...items];
      g += `<rect x="${x - 24}" y="${y - 30}" width="${w + 48}" height="${rows.length * rowH + 40}" rx="18" fill="${C.paper}" filter="url(#shadow)"/>`; // light panel: dark runs read on it
      rows.forEach((r, i) => { const at = r.at == null ? -1 : r.at; if (t < at) return; const k = BTO.sp(t, at, "settle"); const yy = y + i * rowH + (1 - k) * 30;
        g += BTO.text(x, yy + barH * 0.78, r.label, { size: o.labelSize || 34, weight: 800, anchor: "start", fill: r.isTpl ? C.amberDeep : C.ink, ls: 1.5, op: clamp(k * 1.5) });
        g += bar(r.runs, x + lw, yy, w - lw - 70, barH, clamp(k * 1.5), C, "#000", "#ffffff") + `<rect x="${x + lw}" y="${yy}" width="${w - lw - 70}" height="${barH}" fill="none" stroke="${C.inkSoft}" stroke-width="2" opacity="${clamp(k * 1.5).toFixed(3)}"/>`;
        if (r.isTpl) g += `<rect x="${x + lw - 5}" y="${yy - 5}" width="${w - lw - 60}" height="${barH + 10}" fill="none" stroke="${C.amber}" stroke-width="5" opacity="${clamp(k * 1.5).toFixed(3)}"/>`;
        else { const vk = clamp((t - at - 0.3) / 0.2); const mx = x + w - 30, my = yy + barH / 2;
          g += r.match ? `<path d="M${mx - 18} ${my} l12 14 l24 -28" stroke="${C.amber}" stroke-width="8" fill="none" stroke-linecap="round" opacity="${vk}"/>`
            : `<path d="M${mx - 15} ${my - 15} L${mx + 15} ${my + 15} M${mx + 15} ${my - 15} L${mx - 15} ${my + 15}" stroke="${C.coral}" stroke-width="8" stroke-linecap="round" opacity="${vk}"/>`; } });
      return `<g opacity="${op.toFixed(3)}">${g}</g>`;
    } };
  });

  BTO.def("signature-ledger", (o) => {
    const C = BTO.style.palette; const tpl = o.template.rings ? BTO.ringRuns(o.template.rings) : o.template.runs; const r = BTO.rng(o.seed || 61);
    // seeded rows of runs; any row that would contain the template signature is regenerated (so "no match" is true)
    const rows = []; for (let i = 0; i < (o.rows || 18); i += 1) { let runs; do { runs = []; let dark = r() < 0.5; const n = 9 + Math.floor(r() * 8);
        for (let j = 0; j < n; j += 1) { runs.push({ dark, n: [1, 1, 2, 2, 3, 4, 5][Math.floor(r() * 7)] * (0.7 + 0.6 * r()) }); dark = !dark; } } while (matches(runs, tpl) >= 0); rows.push(runs); }
    const rowAt = (i) => lerp(o.fillStartAt, o.fillEndAt, i / rows.length);
    for (let i = 0; i < rows.length; i += 3) BTO.cue(rowAt(i), "tick", 0.18, (i % 2 ? 1 : -1) * 0.3);
    if (o.matchAt != null) BTO.cue(o.matchAt, "match", 0.7);
    return { draw: (t) => {
      const op = (o.enterAt == null ? 1 : clamp((t - o.enterAt) / 0.25)) * (o.outAt == null ? 1 : 1 - clamp((t - o.outAt) / 0.35)); if (op <= 0) return "";
      const { x, y, w } = o; const rh = o.rowH || 26, bh = rh - 8; let g = `<rect x="${x - 20}" y="${y - 20}" width="${w + 40}" height="${rows.length * rh + 40 + (o.matchAt != null ? rh * 2 : 0)}" rx="14" fill="${C.paper}" filter="url(#shadow)"/>`;
      const dim = o.matchAt != null && t > o.matchAt ? 1 - 0.65 * clamp((t - o.matchAt) / 0.4) : 1;
      rows.forEach((runs, i) => { const at = rowAt(i); if (t < at) return; const k = clamp((t - at) / 0.18);
        g += `<g clip-path="none">${bar(runs, x, y + i * rh, w * k, bh, dim, C)}</g>`; });
      // search head: a template-sized window sweeping the filled rows
      if (o.searchAt != null && t >= o.searchAt && (o.matchAt == null || t < o.matchAt)) { const n = rows.filter((_, i) => rowAt(i) <= t).length; const prog = (t - o.searchAt) * (o.searchSpeed || 9);
        const row = Math.floor(prog) % Math.max(1, n), u = prog % 1; const sw = w * 0.22;
        g += `<rect x="${(x + u * (w - sw)).toFixed(1)}" y="${(y + row * rh - 4).toFixed(1)}" width="${sw.toFixed(1)}" height="${bh + 8}" fill="none" stroke="${C.coral}" stroke-width="4"/>`; }
      if (o.matchAt != null && t >= o.matchAt) { const k = BTO.sp(t, o.matchAt, "snap"); const yy = y + rows.length * rh + rh * 0.6 + (1 - k) * 40;
        g += bar(tpl, x + w * 0.39, yy, w * 0.22, bh + 10, clamp(k * 1.5), C, "#000", "#f4f4f4") + `<rect x="${x + w * 0.39 - 6}" y="${yy - 6}" width="${w * 0.22 + 12}" height="${bh + 22}" fill="none" stroke="${C.amberDeep}" stroke-width="6" opacity="${clamp(k * 1.5)}"/>`; }
      if (o.title) g += BTO.text(x, y - 40, o.title, { size: o.titleSize || 36, weight: 800, anchor: "start", fill: C.ink, ls: 2 });
      return `<g opacity="${op.toFixed(3)}">${g}</g>`;
    } };
  });
})(window.BTO);
