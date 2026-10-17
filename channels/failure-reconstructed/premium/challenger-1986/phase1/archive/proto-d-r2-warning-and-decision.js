// Phase 1 prototype D: the night before (replaces V2 S12 bar chart and S13 flowchart).
// The evidence is the Commission's own reproductions of the two Thiokol documents from that night, on
// one paper desk, with a timeline rail of the Commission's chronology (EST):
//   8:45 PM  second teleconference: Thiokol's chart "O-ring temp must be >= 53 °F at launch"   (p. 90)
//  ~11:00 PM teleconference resumes; Thiokol management recommends launch
//  ~11:45 PM signed telefax: "MTI recommends STS-51L launch proceed on 28 January 1986"        (p. 97)
//  11:38 AM next morning: launch
// then the Commission's finding, typeset: "Those who made that decision were unaware..."     (p. 82)
(window.OVERRIDES = window.OVERRIDES || []).push(function (FR) {
  const { C, F, E, p, lerp, clamp, W, H, X, text, esc } = FR; const L = FR.L, Wd = FR.word;
  const ease = (t, a, b, f = E.inOut) => f(p(t, a, b));
  // ---- data (source px of the NASA scans; times from the Ch. V chronology) --------------------------------
  const DOC = {
    chart: { key: "chart53", crop: { x: 0, y: 0, w: 599, h: 186 }, close: { x: 8, y: 22, w: 530, h: 164.6 }, line: { x: 52, y: 44, w: 470, h: 26 }, value: { x: 268, y: 44, w: 110, h: 26 } },
    fax: { key: "fax", crop: { x: 30, y: 404, w: 600, h: 170 }, rec: { x: 44, y: 418, w: 560, h: 20 }, sig: { x: 58, y: 468, w: 300, h: 92 } },
    quote: { text: "Those who made that decision were unaware…", hl: "unaware", cite: "Rogers Commission Report, Vol. 1, Ch. V, p. 82" },
  };
  const RAIL = [{ at: 0 }, { at: 1 }, { at: 2 }, { at: 3, label: "LAUNCH" }]; // repair 2: the stamp names the current time; only the endpoint is labelled
  const STAMP = ["JAN 27 · 8:45 PM", "JAN 27 · 11:00 PM", "JAN 27 · 11:45 PM", "JAN 28 · 11:38 AM"];
  const T = { s12: L("L10").start - 0.1, s13: L("L11").start - 0.1, s14: L("L12").start - 0.1 };
  const w = { rec: Wd("L10", "recommended"), f53: Wd("L10", "fifty-three"), rev: Wd("L11", "reversed"), adv: Wd("L11", "advice"), nasa: Wd("L11", "NASA's"), never: Wd("L11", "never") };
  const railNow = (t) => t < w.rev ? 0 : t < w.adv ? lerp(0, 1, ease(t, w.rev - 0.1, w.rev + 0.4)) : t < w.nasa ? lerp(1, 2, ease(t, w.adv - 0.1, w.adv + 0.4)) : lerp(2, 3, ease(t, w.nasa - 0.1, w.nasa + 0.5));
  const stampAt = (t) => STAMP[Math.round(clamp(railNow(t), 0, 3))];
  const desk = `<rect width="${W}" height="${H}" fill="${C.ink}"/><rect x="0" y="450" width="${W}" height="820" fill="#efeadf"/>`;

  // ---- S12: the 53 °F chart ------------------------------------------------------------------------------
  FR.replace("S12", { start: T.s12, end: T.s13, kind: "document", label: "Commission record", subject: "Thiokol's initial recommendation chart, 27 Jan 1986 (Rogers Vol. 1 p. 90), on a timeline", source: "chart53", evidence: ["E3"], fade: 0.3,
    trans: "dip", transReason: "slow dissolve from the crew portrait (loss beat, respectful pace)",
    framing: "full-width document plate", primitives: ["document", "timeline", "measure-scale"],
    states: [{ t: T.s12 + 0.1, what: "timeline at 8:45 PM, chart arrives", ev: "E3 chronology" }, { t: w.rec, what: "the recommendation line is highlighted", ev: "E3 p. 90" }, { t: w.f53, what: "53 °F marked on the scale against 36 °F", ev: "E3; E1 36 °F" }],
    render: (t) => {
      const arrive = ease(t, T.s12, T.s12 + 0.5, E.out); const push = ease(t, T.s12 + 0.4, w.rec + 0.2);
      const c = DOC.chart.crop, c2 = DOC.chart.close; const crop = { x: lerp(c.x, c2.x, push), y: lerp(c.y, c2.y, push), w: lerp(c.w, c2.w, push), h: lerp(c.h, c2.h, push) };
      const box = { x: 0, y: 500 + (1 - arrive) * 40, w: W, h: W * c.h / c.w };
      const d = X.doc(DOC.chart.key, { crop, box, op: arrive, marks: [{ ...DOC.chart.line, k: p(t, w.rec - 0.1, w.f53 + 0.2) }, { ...DOC.chart.value, k: p(t, w.f53 - 0.1, w.f53 + 0.25), color: C.hot }] });
      const sc = X.scale({ y: 1150, lo: 25, hi: 65, markers: [{ v: 53, label: "ENGINEERS’ LIMIT", color: "#b0611d", k: p(t, w.f53 - 0.1, w.f53 + 0.3) }, { v: 36, label: "LAUNCH MORNING", color: "#2f78b7", k: p(t, w.f53 + 0.35, w.f53 + 0.75) }] });
      return { under: desk, media: [d.layer],
        svg: X.rail(RAIL, railNow(t), { y: 350, x0: 170, x1: 910, op: arrive }) + `<g>${sc}</g>`.replace(/fill="#f5f2ec"/g, `fill="${C.ink}"`),
        hud: d.marks + X.stamp("EST", stampAt(t), arrive) + FR.chip("Commission record", "document", arrive)
          + FR.source("Thiokol chart · Rogers Commission, Vol. 1, p. 90", arrive, 1228).replace("rgba(236,230,218,.82)", "#3c3a36").replace("text-shadow:0 1px 4px #000", "text-shadow:none") };
    } });

  // ---- S13: the reversal, the signed fax, the finding ---------------------------------------------------------
  FR.replace("S13", { start: T.s13, end: T.s14, kind: "document", label: "Commission record", subject: "Thiokol's signed launch recommendation (p. 97) and the Commission's finding (p. 82), timeline to launch", source: "fax", evidence: ["E3"],
    trans: "continuous", transReason: "continuous: same document desk, the timeline moves on to the reversal",
    framing: "full-width document plate", primitives: ["document", "timeline", "quote"],
    states: [{ t: w.rev, what: "timeline to 11:00 PM; the 53 °F chart is set aside", ev: "E3 chronology" }, { t: w.rev + 0.2, what: "signed fax: 'MTI recommends ... launch proceed'", ev: "E3 p. 97" },
      { t: w.adv, what: "signature highlighted; timeline 11:45 PM", ev: "E3 p. 97" }, { t: w.nasa, what: "timeline to launch; the Commission's finding", ev: "E3 p. 82" }],
    render: (t) => {
      const swap = ease(t, w.rev - 0.25, w.rev + 0.3); const q = ease(t, w.nasa - 0.15, w.nasa + 0.35);
      // repair 2: the evidence accumulates (a case file) instead of replacing itself on a mostly blank desk
      const cc = DOC.chart.close; const cw = lerp(W, 860, swap); const cbox = { x: (W - cw) / 2, y: lerp(500, 455, swap), w: cw, h: cw * cc.h / cc.w };
      const chart = X.doc(DOC.chart.key, { crop: DOC.chart.close, box: cbox, op: 1 - 0.45 * swap, marks: [{ ...DOC.chart.line, k: 1 }] });
      const fc = DOC.fax.crop; const fbox = { x: 0, y: lerp(800, 745, swap), w: W, h: W * fc.h / fc.w };
      const fax = X.doc(DOC.fax.key, { crop: fc, box: fbox, op: swap * (1 - 0.35 * q), marks: [{ ...DOC.fax.rec, k: p(t, w.rev + 0.1, w.rev + 0.7) }, { ...DOC.fax.sig, k: p(t, w.adv - 0.05, w.adv + 0.4) }] });
      const quote = q <= 0 ? "" : `<div style="position:absolute;left:130px;right:130px;top:${1075 + (1 - q) * 20}px;opacity:${q};text-align:center">
          <div style="font:700 46px/1.15 ${F.serif};color:#14171c">“${esc(DOC.quote.text).replace(DOC.quote.hl, `<span style="background:linear-gradient(transparent 55%, rgba(229,72,77,${0.55 * p(t, w.never - 0.1, w.never + 0.3)}) 55%)">${DOC.quote.hl}</span>`)}”</div>
          <div style="font:600 26px ${F.sans};letter-spacing:.5px;color:#4a4740;margin-top:12px">${esc(DOC.quote.cite)}</div></div>`;
      return { under: desk, media: [chart.layer, fax.layer],
        svg: X.rail(RAIL, railNow(t), { y: 350, x0: 170, x1: 910 }),
        hud: fax.marks + quote + X.stamp("EST", stampAt(t)) + FR.chip("Commission record", "document")
          + FR.source(q > 0.5 ? "" : "Thiokol telefax · Rogers Commission, Vol. 1, p. 97", 1 - q, 1080).replace("rgba(236,230,218,.82)", "#3c3a36").replace("text-shadow:0 1px 4px #000", "text-shadow:none") };
    } });
});
