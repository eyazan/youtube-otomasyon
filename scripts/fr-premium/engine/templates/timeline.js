// Template: timeline. A chronology on its own: rail + time stamp over a dark ground or a dimmed photo,
// advancing on narration anchors. Every tick is a claim (its display is shown). Not used by Challenger
// V3 (its timeline lives inside the document desk); covered by tests.
(function (root) {
  const { S, H } = typeof module !== "undefined" && module.exports ? require("./_common.js") : root.FR_TPL_COMMON;
  const T = {
    id: "timeline", version: 1, provenance: ["document", "explanatory"], minStates: 2,
    params: { type: "object", required: ["ticks", "steps", "chip"], additionalProperties: false, properties: {
      ticks: { type: "array", minItems: 2, items: S.claim },
      steps: { type: "array", minItems: 1, items: { type: "object", required: ["at"], additionalProperties: false, properties: { at: S.timeRef } } },
      ground: { enum: ["ink", "photo"] }, media: S.asset, chip: S.chip, source: S.source } },
    states: ["clock-advances"],
    build(FR, shot, ctx) {
      const P = shot.params; const { E, p, lerp, C, W, H: HH, X } = FR;
      const ticks = P.ticks.map((c) => H.text(`{${c.slice(6)}}`, ctx)); const steps = P.steps.map((s) => ctx.time(s.at));
      const render = (t) => { let now = 0; steps.forEach((s, i) => { if (t >= s - 0.1) now = lerp(i, i + 1, E.inOut(p(t, s - 0.1, s + 0.4))); });
        const idx = steps.filter((s) => t >= s).length;
        const media = P.ground === "photo" && P.media ? [FR.photo(ctx.assetKey(P.media), { fx: FR.media[ctx.assetKey(P.media)].iw / 2, fy: FR.media[ctx.assetKey(P.media)].ih / 2, z: 1, filter: "brightness(0.4)" })] : [];
        return { under: `<rect width="${W}" height="${HH}" fill="${C.ink}"/>`, media, svg: X.rail(ticks.map((_, i) => ({ at: i, label: ticks[i] })), now, { y: 860, x0: 160, x1: 920 }),
          hud: X.stamp("", ticks[Math.min(ticks.length - 1, idx)], 1, { size: 64 }) + FR.chip(H.text(P.chip.label, ctx), P.chip.kind || shot.provenance.kind) + (P.source ? FR.source(H.text(P.source.text, ctx), 1, P.source.y) : "") }; };
      return { render };
    },
  };
  if (typeof module !== "undefined" && module.exports) module.exports = T; else (root.FR_TEMPLATES = root.FR_TEMPLATES || {})[T.id] = T;
})(typeof window !== "undefined" ? window : globalThis);
