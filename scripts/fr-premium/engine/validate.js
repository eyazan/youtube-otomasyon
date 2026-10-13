#!/usr/bin/env node
"use strict";
// Premium engine validator: evidence, assets, shot plan, channel pack and template parameters.
//   node scripts/fr-premium/engine/validate.js <shot-plan.json> [--json report.json]
// Exit 1 on any ERROR. Errors are blocking (a plan with errors must not be rendered for production);
// warnings are reported (e.g. legacy shots that still need manual work).
const fs = require("fs");
const path = require("path");
const { validate: schemaCheck } = require("./jsonschema");
const TIME = require("./timeref");

const ENGINE = __dirname; const ROOT = path.join(ENGINE, "..", "..", "..");
const readJSON = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const SCHEMA = (n) => readJSON(path.join(ENGINE, "schemas", `${n}.schema.json`));

function loadRegistry() {
  const dir = path.join(ENGINE, "templates"); const reg = {};
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".js") && !x.startsWith("_"))) { const t = require(path.join(dir, f)); reg[t.id] = t; }
  return reg;
}

// Walk a value alongside its schema and collect annotated leaves (x-onscreen, x-factual, x-anchor, x-time, x-illustrative).
function annotated(schema, value, root, at, out) {
  if (!schema || value === undefined) return out;
  if (schema.$ref) return annotated(schema.$ref.replace(/^#\//, "").split("/").reduce((o, k) => o[k], root), value, root, at, out);
  for (const k of ["x-onscreen", "x-factual", "x-anchor", "x-time", "x-illustrative"]) if (schema[k]) out.push({ kind: k, at, value });
  if (schema.oneOf) { const ok = schema.oneOf.find((s) => schemaCheck(s, value, root).length === 0); if (ok) annotated(ok, value, root, at, out); }
  if (Array.isArray(value) && schema.items) value.forEach((v, i) => annotated(schema.items, v, root, `${at}[${i}]`, out));
  if (value && typeof value === "object" && !Array.isArray(value) && schema.properties) for (const [k, v] of Object.entries(value)) if (schema.properties[k]) annotated(schema.properties[k], v, root, `${at}.${k}`, out);
  return out;
}

function validatePlan({ plan, evidence, assets, timeline, root = ROOT, registry = loadRegistry() }) {
  const errors = [], warnings = []; const E = (shot, msg) => errors.push(shot ? `${shot}: ${msg}` : msg); const Wn = (shot, msg) => warnings.push(shot ? `${shot}: ${msg}` : msg);
  // 1. schemas
  for (const [name, doc] of [["shot-plan", plan], ["evidence", evidence], ["assets", assets]]) for (const e of schemaCheck(SCHEMA(name), doc)) E(null, `${name} schema: ${e}`);
  if (errors.length) return { errors, warnings, stats: null };
  // 2. channel configuration
  const chDir = path.join(root, "channels", plan.channel); let pack = null;
  if (!fs.existsSync(path.join(chDir, "config.json"))) E(null, `channel "${plan.channel}" has no channels/${plan.channel}/config.json`);
  else { const cfg = readJSON(path.join(chDir, "config.json")); if (cfg.slug !== plan.channel) E(null, `channel config slug "${cfg.slug}" does not match plan channel "${plan.channel}"`); if (cfg.enabled === false) E(null, `channel "${plan.channel}" is disabled`); }
  const packFile = path.join(ENGINE, "channels", `${plan.channel}.json`);
  if (!fs.existsSync(packFile)) E(null, `no channel pack engine/channels/${plan.channel}.json`);
  else { pack = readJSON(packFile); for (const e of schemaCheck(SCHEMA("channel-pack"), pack)) E(null, `channel pack: ${e}`);
    if (!pack.styles.includes(plan.style)) E(null, `style "${plan.style}" is not a ${plan.channel} style (${pack.styles.join(", ")})`); }
  if (evidence.topic !== plan.topic || assets.topic !== plan.topic) E(null, `topic mismatch: plan ${plan.topic}, evidence ${evidence.topic}, assets ${assets.topic}`);
  // 3. evidence: sources, verification, numbers present in their passages
  const claims = evidence.claims;
  for (const [id, c] of Object.entries(claims)) {
    if (!evidence.sources[c.source]) E(null, `claim ${id}: unknown source ${c.source}`);
    if (["fact", "estimate", "quote", "measurement"].includes(c.kind) && c.status === "verified" && !c.passage) E(null, `claim ${id}: verified ${c.kind} without a source passage`);
    // the value must appear in its passage as written (valueAsWritten for forms like "27 1/2"); every number in the
    // on-screen display must be the value itself or appear in the passage
    const nums = (x) => (String(x).match(/\d+(?:\.\d+)?/g) || []);
    if (c.status === "verified" && c.passage) { const pass = c.passage.replace(/,/g, "");
      if (c.value != null) { const v = c.value; const forms = c.valueAsWritten ? [c.valueAsWritten] : [String(v), v.toFixed(1), v.toFixed(2), v.toFixed(3)];
        if (!forms.some((f) => (/^\d+$/.test(f) ? new RegExp(`(^|[^\\d.])${f}(?![\\d]|\\.\\d)`).test(pass) : pass.includes(f)))) E(null, `claim ${id}: value ${v} does not appear in its source passage`); }
      for (const n of nums((c.display || "").replace(/\|/g, " "))) if (!(c.value != null && +n === c.value) && !nums(pass).includes(n)) E(null, `claim ${id}: displayed number ${n} is neither its value nor in its passage`); }
  }
  const useClaim = (shot, id, where) => { const c = claims[id]; if (!c) { E(shot, `${where}: unknown claim ${id}`); return null; }
    if (c.status !== "verified") E(shot, `${where}: claim ${id} is ${c.status}${c.note ? ` (${c.note})` : ""}`); return c; };
  // 4. assets: licences, anchors in bounds and referencing evidence
  for (const [key, a] of Object.entries(assets.assets)) {
    if (["cc-by", "cc-by-sa"].includes(a.licence.id) && !a.licence.attribution) E(null, `asset ${key}: ${a.licence.id} requires an attribution`);
    const fw = a.kind === "clip" ? a.clip && a.clip.out.w : a.width, fh = a.kind === "clip" ? a.clip && a.clip.out.h : a.height;
    if (a.kind === "clip" && !a.clip) E(null, `asset ${key}: clip without clip window`);
    for (const [an, v] of Object.entries(a.anchors || {})) {
      const space = v.space; if (space === "clip-frame" && a.kind !== "clip") E(null, `asset ${key}#${an}: clip-frame anchor on a ${a.kind}`);
      const [bw, bh] = space === "clip-frame" ? [fw, fh] : [a.width, a.height];
      const pts = v.point ? [v.point] : v.rect ? [[v.rect.x, v.rect.y], [v.rect.x + v.rect.w, v.rect.y + v.rect.h]] : [];
      for (const [x, y] of pts) if (x < 0 || y < 0 || x > bw || y > bh) E(null, `asset ${key}#${an}: (${x}, ${y}) outside the ${bw}x${bh} ${space}`);
      if (v.claim) useClaim(null, v.claim, `asset ${key}#${an}`);
    }
  }
  const anchorOf = (shot, ref, where) => { const m = /^asset:([a-z0-9-]+)#([a-z0-9-]+)$/.exec(ref); if (!m) { E(shot, `${where}: bad anchor ref ${ref}`); return null; }
    const a = assets.assets[m[1]]; if (!a) { E(shot, `${where}: unknown asset ${m[1]}`); return null; }
    const v = (a.anchors || {})[m[2]]; if (!v) { E(shot, `${where}: asset ${m[1]} has no anchor "${m[2]}"`); return null; } return v; };
  // 5. narration timing
  const duration = timeline.duration + plan.film.tail; const tRes = (shot, ref, where) => { try { return TIME.resolve(ref, timeline, duration); } catch (e) { E(shot, `${where}: ${e.message}`); return null; } };
  if (plan.film.captionFrom) tRes(null, plan.film.captionFrom, "film.captionFrom");
  for (const l of plan.film.captionSkip || []) if (!timeline.lines.some((x) => x.id === l)) E(null, `film.captionSkip: no line ${l}`);
  // 6. shots
  const stats = { shots: plan.shots.length, dataDriven: 0, legacy: 0, manual: [], byTemplate: {}, claimsUsed: new Set(), assetsUsed: new Set() };
  let prevEnd = 0; const ids = new Set();
  plan.shots.forEach((s, i) => {
    const sid = s.id; if (ids.has(sid)) E(sid, "duplicate shot id"); ids.add(sid);
    const T = registry[s.template];
    if (!T) { E(sid, `unsupported template "${s.template}"`); return; }
    if (pack && !pack.templates.includes(s.template)) E(sid, `template "${s.template}" is not allowed on ${plan.channel}`);
    if (!T.provenance.includes(s.provenance.kind)) E(sid, `template ${s.template} cannot carry provenance "${s.provenance.kind}"`);
    if (pack && !pack.provenanceKinds.includes(s.provenance.kind)) E(sid, `provenance "${s.provenance.kind}" not used on ${plan.channel}`);
    stats.byTemplate[s.template] = (stats.byTemplate[s.template] || 0) + 1;
    if (T.legacy) { stats.legacy += 1; if (!s.manual) E(sid, "legacy-code shot without manual.reason"); else { stats.manual.push({ shot: sid, reason: s.manual.reason }); Wn(sid, `custom code (manual): ${s.manual.reason}`); } } else stats.dataDriven += 1;
    // timing
    const a = tRes(sid, s.start, "start"), b = tRes(sid, s.end, "end");
    if (a != null && b != null) { if (!(b > a)) E(sid, `invalid timing: end ${b.toFixed(3)} <= start ${a.toFixed(3)}`);
      if (Math.abs(a - prevEnd) > 1e-6) E(sid, `invalid timing: starts at ${a.toFixed(3)} but the previous shot ends at ${prevEnd.toFixed(3)} (gap or overlap)`);
      if (b > duration + 1e-6) E(sid, `invalid timing: ends after the film (${duration.toFixed(3)} s)`); prevEnd = b; }
    // transitions
    if (pack && !pack.transitions.includes(s.transition.type)) E(sid, `wrong transition type "${s.transition.type}" (allowed: ${pack.transitions.join(", ")})`);
    if (i > 0 && !s.transition.reason) E(sid, "transition has no reason");
    // evidence
    for (const c of s.evidence) { useClaim(sid, c, "evidence"); stats.claimsUsed.add(c); }
    if (["explanatory", "reconstruction"].includes(s.provenance.kind) && !T.legacy && s.evidence.length === 0) E(sid, `unsupported visual reconstruction: ${s.provenance.kind} shot cites no evidence`);
    for (const k of s.assets || []) { if (!assets.assets[k]) E(sid, `unknown asset ${k}`); else stats.assetsUsed.add(k); }
    // params
    if (!T.legacy || true) for (const e of schemaCheck(T.params, s.params, T.params)) E(sid, `unsupported parameter: ${e.replace(/^\$/, "params")}`);
    const ann = annotated(T.params, s.params, T.params, "params", []);
    const visibleText = [s.provenance.label];
    for (const x of ann) {
      if (x.kind === "x-onscreen") { visibleText.push(String(x.value)); const stripped = String(x.value).replace(/\{C-[a-z0-9-]+(\.value)?\}/g, "");
        for (const m of String(x.value).matchAll(/\{(C-[a-z0-9-]+)(\.value)?\}/g)) { useClaim(sid, m[1], x.at); stats.claimsUsed.add(m[1]); }
        // allowed without a claim: citation locators (Vol. 1, p. 90, Ch. III, Fig. 14) and identifiers that are part of
        // a listed asset's own provenance label or title (e.g. "E-207"); any other digit must come from a claim
        const CITE = /\b(Vol|p|pp|Fig|Figure|Ch|No)\.\s?\d+/g; const clean = (tok) => tok.replace(/^[^\w]+|[^\w]+$/g, "");
        const ids = new Set((s.assets || []).flatMap((k) => assets.assets[k] ? [assets.assets[k].provenanceLabel || "", assets.assets[k].source.title] : [])
          .join(" ").replace(CITE, "").split(/\s+/).map(clean).filter((tok) => /\d/.test(tok) && /[A-Za-z]/.test(tok))); // identifiers only, never bare numbers
        const rest = stripped.replace(/<br>/g, " ").replace(CITE, "").split(/\s+/).map(clean).filter((tok) => /\d/.test(tok) && !ids.has(tok));
        if (rest.length) E(sid, `${x.at}: on-screen number "${rest.join(" ")}" in "${x.value}" is not taken from a claim`); }
      if (x.kind === "x-factual") { if (typeof x.value !== "string" || !/^claim:C-/.test(x.value)) E(sid, `${x.at}: factual value must reference a claim`); else { useClaim(sid, x.value.slice(6), x.at); stats.claimsUsed.add(x.value.slice(6)); } }
      if (x.kind === "x-anchor") { const v = anchorOf(sid, x.value, x.at); const k = x.value.split("#")[0].slice(6); if (v && s.assets && !s.assets.includes(k)) E(sid, `${x.at}: anchor on asset ${k} not listed in shot.assets`); }
      if (x.kind === "x-time") tRes(sid, x.value, x.at);
    }
    for (const r of JSON.stringify(s.params).match(/"asset:[a-z0-9-]+"/g) || []) { const k = r.slice(7, -1); if (!assets.assets[k]) E(sid, `params: unknown asset ${k}`); else if (s.assets && !s.assets.includes(k)) E(sid, `params: asset ${k} not listed in shot.assets`); }
    // traced geometry must lie on the measured anchor it cites (rect +15 px, point within 150 px)
    const near = (v, x, y) => v.rect ? (x >= v.rect.x - 15 && x <= v.rect.x + v.rect.w + 15 && y >= v.rect.y - 15 && y <= v.rect.y + v.rect.h + 15) : v.point ? Math.hypot(x - v.point[0], y - v.point[1]) <= 150 : false;
    const traced = [...(s.params.paths || []).map((pa, i) => ({ basis: pa.basis, pts: pa.points, at: `params.paths[${i}]` })), ...(s.params.callouts || []).map((c, i) => ({ basis: c.from.basis, pts: [c.from.point], at: `params.callouts[${i}]` }))];
    for (const tr of traced) { const v = anchorOf(sid, tr.basis, tr.at); if (v) for (const [x, y] of tr.pts) if (!near(v, x, y)) E(sid, `unsupported visual reconstruction: ${tr.at} point (${x}, ${y}) is not on its basis ${tr.basis}`); }
    // shared desks are validated against the template's desk schema
    if (s.template === "document-desk" && typeof s.params.desk === "string") { const name = s.params.desk.slice(7); const d = (plan.shared || {})[name];
      if (!d) E(sid, `params.desk: no shared "${name}"`); else { for (const e of schemaCheck(T.deskSchema, d, T.deskSchema)) E(sid, `shared.${name}: ${e}`);
        for (const x of annotated(T.deskSchema, d, T.deskSchema, `shared.${name}`, [])) {
          if (x.kind === "x-anchor") anchorOf(sid, x.value, x.at); if (x.kind === "x-time") tRes(sid, x.value, x.at);
          if (x.kind === "x-factual") { if (!/^claim:C-/.test(x.value)) E(sid, `${x.at}: factual value must reference a claim`); else { useClaim(sid, x.value.slice(6), x.at); stats.claimsUsed.add(x.value.slice(6)); } } }
        if (d.finding) { useClaim(sid, d.finding.claim.slice(6), "finding"); stats.claimsUsed.add(d.finding.claim.slice(6)); } } }
    // illustrative values must be labelled on screen
    const illus = ann.some((x) => x.kind === "x-illustrative") || (s.params.scale && s.params.scale.mode === "schematic");
    if (illus && pack) { const vis = visibleText.join(" ").toLowerCase(); if (!pack.illustrativeLabels.some((l) => vis.includes(l))) E(sid, `unsupported visual reconstruction: illustrative values without a visible label (${pack.illustrativeLabels.join(" / ")})`); }
    if (s.params.scale && s.params.scale.mode === "declared-exaggeration") { const f = s.params.scale.factor; if (!f) E(sid, "declared exaggeration without a factor");
      else if (!visibleText.join(" ").includes(`×${f}`)) E(sid, `declared exaggeration ×${f} is not shown on screen`); }
    // QA expectations
    const min = s.qa.minStates != null ? s.qa.minStates : T.minStates;
    if (!T.legacy && s.qa.states.length < min) E(sid, `qa: ${s.qa.states.length} narration-timed states, template ${s.template} expects >= ${min}`);
    for (const st of s.qa.states) { const t = tRes(sid, st.at, "qa.states"); if (t != null && a != null && b != null && (t < a - 1e-6 || t > b + 1e-6)) E(sid, `qa state "${st.what}" at ${t.toFixed(2)} s is outside the shot`); if (st.claim) useClaim(sid, st.claim, "qa.states"); }
    if (s.qa.registered && !(s.params.register || s.template === "trace-over-photo")) E(sid, "qa.registered is set but the shot declares no registration");
  });
  if (Math.abs(prevEnd - duration) > 1e-3) E(null, `invalid timing: shots end at ${prevEnd.toFixed(3)} s, the film at ${duration.toFixed(3)} s`);
  stats.claimsUsed = stats.claimsUsed.size; stats.assetsUsed = stats.assetsUsed.size;
  return { errors, warnings, stats };
}

function loadPlanFiles(planFile) {
  const plan = readJSON(planFile); const dir = path.dirname(planFile);
  return { plan, evidence: readJSON(path.resolve(dir, plan.evidence)), assets: readJSON(path.resolve(dir, plan.assets)), timeline: readJSON(path.resolve(dir, plan.narration)) };
}

if (require.main === module) {
  const file = process.argv[2]; if (!file) { console.error("usage: validate.js <shot-plan.json> [--json out]"); process.exit(2); }
  const r = validatePlan(loadPlanFiles(path.resolve(file)));
  for (const e of r.errors) console.log("ERROR  " + e);
  for (const w of r.warnings) console.log("WARN   " + w);
  if (r.stats) console.log(`shots ${r.stats.shots}: ${r.stats.dataDriven} data-driven, ${r.stats.legacy} legacy code; templates ${JSON.stringify(r.stats.byTemplate)}; claims used ${r.stats.claimsUsed}; assets used ${r.stats.assetsUsed}`);
  console.log(r.errors.length ? `INVALID (${r.errors.length} errors, ${r.warnings.length} warnings)` : `VALID (${r.warnings.length} warnings)`);
  const j = process.argv.indexOf("--json"); if (j > 0) fs.writeFileSync(process.argv[j + 1], JSON.stringify(r, null, 1) + "\n");
  process.exit(r.errors.length ? 1 : 0);
}
module.exports = { validatePlan, loadPlanFiles, loadRegistry };
