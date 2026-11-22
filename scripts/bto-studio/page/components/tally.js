// BTO Premium Studio - tally-tokens: a row of opponent tokens that are struck off one by one as they are passed (GoalLore
//   Lab solo runs: the GLL-021 review render never made "past five players" countable). No digits: the count is the row.
//   props: x, y (row centre), size (token radius), beatKeys [[t]...] (one per token, in order), color (palette key, default
//   teal = the away team's token colour), enterAt, outAt. Every frame is a pure function of t.
(function (BTO) {
  "use strict";
  const { clamp } = BTO;
  const fade = (t, a, b, d = 0.35) => (a == null ? 1 : clamp((t - a) / d)) * (b == null ? 1 : 1 - clamp((t - b) / d));
  BTO.def("tally-tokens", (o) => {
    const keys = (o.beatKeys || []).map((k) => (Array.isArray(k) ? k[0] : k)); keys.forEach((k) => BTO.cue(k, "tick", 0.45));
    return { draw: (t) => {
      const op = fade(t, o.enterAt, o.outAt); if (op <= 0) return ""; const C = BTO.style.palette; const col = C[o.color || "teal"] || C.teal;
      const r = o.size || 30, gap = r * 2.9, n = keys.length, x0 = (o.x || 540) - ((n - 1) * gap) / 2, y = o.y || 560; let g = "";
      g += `<rect x="${(x0 - r * 1.8).toFixed(1)}" y="${(y - r * 1.7).toFixed(1)}" width="${((n - 1) * gap + r * 3.6).toFixed(1)}" height="${(r * 3.4).toFixed(1)}" rx="${(r * 1.7).toFixed(1)}" fill="${C.desk}" opacity="0.72"/>`;
      keys.forEach((k, i) => { const x = x0 + i * gap; const b = t >= k ? BTO.ep(t, k, k + 0.3, "decelerate") : 0; const pop = 1 + 0.35 * Math.sin(Math.PI * clamp((t - k) / 0.3)) * (t >= k ? 1 : 0);
        g += `<circle cx="${x.toFixed(1)}" cy="${y}" r="${(r * pop).toFixed(1)}" fill="${col}" opacity="${(1 - 0.6 * b).toFixed(3)}" stroke="#05090d" stroke-width="4"/>`;
        if (b > 0) g += `<line x1="${(x - r * 1.1).toFixed(1)}" y1="${(y + r * 1.1).toFixed(1)}" x2="${(x - r * 1.1 + r * 2.2 * b).toFixed(1)}" y2="${(y + r * 1.1 - r * 2.2 * b).toFixed(1)}" stroke="${C.amber}" stroke-width="8" stroke-linecap="round"/>`; });
      return `<g opacity="${op.toFixed(3)}">${g}</g>`;
    } };
  });
})(window.BTO);
