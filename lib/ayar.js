// AYAR — config/growth.json'u varsayilanlarla birlestirerek okur.
// Dosya eksik/bozuk olsa bile sistem guvenli varsayilanlarla calisir.
"use strict";
const path = require("path");
const { KOK, jsonOku } = require("./ortak");

const VARSAYILAN = {
  brand: {
    name: "Failure Reconstructed",
    tagline: "Forensic Engineering Documentaries",
    handle: "@FailureReconstructed",
  },
  ctaStrategy: "adaptive",
  disclosure: { enabled: true, label: "AI RECONSTRUCTION", labelDiagrams: false,
    descriptionNote: true, voiceNote: "Narration uses a synthetic voice. Footage is real archival or licensed stock unless labelled RECONSTRUCTION." },
  qualityGate: {
    publish: 85, review: 70,
    weights: { title: 1, thumbnail: 0.8, hook: 1.2, script: 1.2, originality: 1.2, visual: 1, engineering: 1.1, source: 1, audio: 0.8 },
    hardBlocks: { originality: 40, source: 40, audio: 30 },
    blockOnReview: false,
  },
  publishing: {
    short: { everyDays: 1, maxStretchDays: 3 },
    long: { everyDays: 5, maxStretchDays: 10 },
    stretchWhenRecentBlocks: 2, stretchOnReview: false,
    schedule: { enabled: false, hourUTC: 18, minLeadHours: 1, gates: ["PUBLISH"] },
  },
  originality: { reviewAt: { title: 0.72, hook: 0.7, structure: 0.9, sentences: 0.25, scenes: 0.8, visualReuse: 0.35,
    thumbnail: 0.75, cta: 0.85, description: 0.6, music: 0.95 }, blockAt: { title: 0.92, sentences: 0.6 } },
  clusters: { minVideosForPlaylist: 3 },
  pinnedComment: { post: true },
  analytics: { checkpoints: [1, 3, 7, 14, 30], minSampleForInsight: 5, minViewsForRates: 100 },
};

function birlestir(a, b) {
  if (Array.isArray(a) || typeof a !== "object" || a === null) return b === undefined ? a : b;
  const o = { ...a };
  for (const [k, v] of Object.entries(b || {})) o[k] = (k in a) ? birlestir(a[k], v) : v;
  return o;
}

let _onbellek = null;
function ayar() {
  if (!_onbellek) _onbellek = birlestir(VARSAYILAN, jsonOku(path.join(KOK, "config", "growth.json"), {}));
  return _onbellek;
}

module.exports = { ayar, VARSAYILAN, birlestir };
