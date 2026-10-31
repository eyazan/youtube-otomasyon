"use strict";

// Claim-specific sources for ImpossibleBrief. A source is evidence for one claim only when it is the page the claim was
// checked against and the passage that supports it is stored: an agency's front page (NASA, NOAA, NIST...) is not a
// source for a specific scientific claim, however trustworthy the agency (the generator's per-category list put NIST's
// physics page under microbiome and pain topics, and IB 5cNecwSkYDo cited NIST and CERN for Earth's core).
//
// Ledger: channels/<channel>/research/claim-sources/<topic id>.json, written by scripts/ib-research/claim-check.js
// --ledger from the live source text at a pinned revision. One record per fact:
//   { fact, claim, url, sourceTitle, revision, passage, numbers: { claim, inPassage, missing }, support, status }
// status VERIFIED = a passage was found that carries every number of the claim and shares at least half of its content
// words; anything else is UNVERIFIED. Readiness requires every fact VERIFIED; the upload description lists only
// VERIFIED records' pages.
const fs = require("fs");
const path = require("path");

// front pages and generic section pages of the authorities the topic generator used as per-category boilerplate
const GENERIC_PAGES = [
  /^https?:\/\/(www\.)?nasa\.gov\/?$/i, /^https?:\/\/science\.nasa\.gov\/?$/i, /^https?:\/\/(www\.)?jpl\.nasa\.gov\/?$/i,
  /^https?:\/\/(www\.)?esa\.int\/Science_Exploration\/?$/i, /^https?:\/\/(www\.)?noaa\.gov\/(science\/?)?$/i,
  /^https?:\/\/(www\.)?usgs\.gov\/(science\/?)?$/i, /^https?:\/\/home\.cern\/(science\/?)?$/i,
  /^https?:\/\/(www\.)?nist\.gov\/(topics\/physics\/?)?$/i, /^https?:\/\/(www\.)?nih\.gov\/(research-training\/?)?$/i,
  /^https?:\/\/science\.osti\.gov\/?$/i, /^https?:\/\/(www\.)?ipcc\.ch\/(reports\/?)?$/i,
];
// any front page ("https://host/") is generic too
const isGenericPage = (url) => { const u = String(url || "").trim(); if (GENERIC_PAGES.some((re) => re.test(u))) return true;
  try { const p = new URL(u); return p.pathname === "/" || p.pathname === ""; } catch (error) { return true; } };

const file = (channel, topicId) => path.join(channel.paths.base, "research", "claim-sources", `${topicId}.json`);
function load(channel, topicId) { try { return JSON.parse(fs.readFileSync(file(channel, topicId), "utf8")); } catch (error) { return null; } }

// readiness view of a topic's ledger: errors block production, warnings are listed
function check(channel, topic) {
  const errors = [], warnings = [];
  const facts = topic.facts || [];
  facts.forEach((f, i) => { if (isGenericPage(f.url)) errors.push(`SOURCE_NOT_CLAIM_SPECIFIC: fact ${i + 1} cites a front or section page (${f.url}), not the page that supports the claim`); });
  const generic = (topic.sources || []).filter((s) => isGenericPage(s.url));
  if (generic.length) warnings.push(`topic-level sources are generic pages and are never listed as sources: ${generic.map((s) => s.url).join(", ")}`);
  const ledger = load(channel, topic.id);
  if (!ledger) { errors.push("SOURCE_UNVERIFIED: no claim-source ledger (run scripts/ib-research/claim-check.js --ledger in CI)"); return { errors, warnings, ledger: null }; }
  if (ledger.factsHash !== factsHash(topic)) errors.push("SOURCE_UNVERIFIED: the claim-source ledger was written for different facts; re-run the claim check");
  const unverified = (ledger.records || []).filter((r) => r.status !== "VERIFIED");
  unverified.forEach((r) => errors.push(`SOURCE_UNVERIFIED: ${r.fact} "${String(r.claim).slice(0, 80)}": ${r.reason || "no supporting passage"}`));
  if ((ledger.records || []).length !== facts.length) errors.push(`SOURCE_UNVERIFIED: the ledger has ${(ledger.records || []).length} records for ${facts.length} facts`);
  return { errors, warnings, ledger };
}

// the pages a description may list: VERIFIED ledger records only, one entry per page
function describable(channel, topic) {
  const ledger = load(channel, topic.id); if (!ledger) return [];
  const out = []; for (const r of ledger.records || []) if (r.status === "VERIFIED" && !isGenericPage(r.url) && !out.some((x) => x.url === r.url)) out.push({ name: r.sourceTitle, url: r.url });
  return out;
}

function factsHash(topic) { return require("crypto").createHash("sha256").update(JSON.stringify((topic.facts || []).map((f) => [f.claim, f.url]))).digest("hex").slice(0, 16); }

module.exports = { isGenericPage, check, describable, load, file, factsHash, GENERIC_PAGES };
