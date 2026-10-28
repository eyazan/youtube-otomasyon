"use strict";
// Premium studio asset manager: licensed real-world media for the documentary-plate technique.
// Registry per channel: channels/<channel>/premium/assets.json
//   { id, file (repo-relative), licence, author, sourceUrl, sha256, attribution, trademarks, people, review: { status, by, at, note } }
// review.status: needs-review | approved-preview (usable in preview renders) | approved (owner; required to publish) | rejected
//   node scripts/bto-studio/asset-manager.js import --channel behind-the-ordinary --pack <visual-pack-slug>
//   node scripts/bto-studio/asset-manager.js verify --channel behind-the-ordinary
const crypto = require("crypto");
const cp = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..");
const ALLOWED = [/^CC0\b/i, /^public[- ]domain$/i, /^PD\b/i, /^CC BY( |-)?([234]\.0)?$/i, /^CC BY-SA( |-)?([234]\.0)?$/i, /^original$/i];
const BLOCKED = /\b(NC|ND)\b|non-?commercial|no-?deriv|all rights reserved|unknown/i;
const sha = (f) => crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex");
const regFile = (channel) => path.join(ROOT, "channels", channel, "premium", "assets.json");

function load(channel) { const f = regFile(channel); return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : { schema: "premium-studio.assets.v1", channel, assets: [] }; }

// problems with one asset for a use: "preview" or "publish"
function check(a, use = "preview") {
  const errs = []; const file = path.join(ROOT, a.file || "");
  if (!a.file || !fs.existsSync(file)) errs.push(`${a.id}: file missing (${a.file})`);
  else if (a.sha256 && sha(file) !== a.sha256) errs.push(`${a.id}: sha256 mismatch (file changed since registration)`);
  if (!a.licence || BLOCKED.test(a.licence) || !ALLOWED.some((re) => re.test(a.licence.trim()))) errs.push(`${a.id}: licence "${a.licence}" is not on the allowlist`);
  if (/BY/i.test(a.licence || "") && !(a.attribution && a.author)) errs.push(`${a.id}: CC BY licences need author and attribution text`);
  if (a.trademarks && a.trademarks.length && !(a.review && a.review.trademarkCleared)) errs.push(`${a.id}: visible trademarks (${a.trademarks.join(", ")}) not cleared`);
  if (a.people && !(a.review && a.review.peopleCleared)) errs.push(`${a.id}: identifiable people not cleared`);
  const st = (a.review || {}).status || "needs-review";
  if (st === "rejected") errs.push(`${a.id}: rejected in review`);
  else if (use === "publish" && st !== "approved") errs.push(`${a.id}: owner approval required to publish (status ${st})`);
  else if (use === "preview" && !["approved", "approved-preview"].includes(st)) errs.push(`${a.id}: not reviewed (status ${st})`);
  return errs;
}

// assets used by a storyboard (image-plate layers)
const usedIds = (sb) => [...new Set(sb.scenes.flatMap((s) => (s.layers || []).filter((l) => l.component === "image-plate").map((l) => l.props.asset)))];

// verify and copy (downscaled, long side <= 2200 px) into the work dir; returns { id: { src, w, h, credit } }
function prepare(channel, sb, work, use = "preview") {
  const reg = load(channel); const ids = usedIds(sb); const out = {}; const errs = [];
  for (const id of ids) { const a = reg.assets.find((x) => x.id === id); if (!a) { errs.push(`${id}: not in ${path.relative(ROOT, regFile(channel))}`); continue; }
    errs.push(...check(a, use)); if (errs.length) continue;
    const dir = path.join(work, "media"); fs.mkdirSync(dir, { recursive: true }); const dst = path.join(dir, `${id}.jpg`);
    if (!fs.existsSync(dst)) cp.execFileSync("ffmpeg", ["-v", "error", "-y", "-i", path.join(ROOT, a.file), "-vf", "scale='if(gt(iw,ih),min(2200,iw),-2)':'if(gt(iw,ih),-2,min(2200,ih))'", "-frames:v", "1", "-q:v", "2", dst]);
    const [w, h] = cp.execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0:s=x", dst]).toString().trim().split("x").map(Number);
    // absolute file URL: the page may be written to any work subfolder (text inspection, determinism check)
    out[id] = { src: "file://" + dst, sha256: a.sha256, w, h, credit: a.attribution || `${a.author} · ${a.licence}` }; }
  if (errs.length) throw new Error("asset check failed: " + errs.join("; "));
  return out;
}

function importPack(channel, pack) {
  const dir = path.join(ROOT, "channels", channel, "assets", "visual-packs", pack); const man = JSON.parse(fs.readFileSync(path.join(dir, "manifest.json"), "utf8"));
  const reg = load(channel); let added = 0;
  for (const s of man.stills || []) { const file = path.relative(ROOT, path.join(dir, s.cachedFile)); const id = `${pack}-${s.cachedFile.replace(/\.\w+$/, "")}`;
    if (reg.assets.some((a) => a.id === id)) continue;
    reg.assets.push({ id, file, title: s.file, licence: s.licence, author: String(s.author || "").trim().slice(0, 200), sourceUrl: s.sourceUrl, sha256: sha(path.join(ROOT, file)),
      attribution: `Photo: ${String(s.author || "").trim().split(/[.:(]/)[0].trim().slice(0, 60)} · ${s.licence} · Wikimedia Commons`, trademarks: s.trademarkNotice ? [s.trademarkNotice] : [], people: false,
      review: { status: "needs-review", note: "imported from the visual pack; a person must check trademarks, people and suitability" } }); added += 1; }
  fs.writeFileSync(regFile(channel), JSON.stringify(reg, null, 1) + "\n"); return added;
}

if (require.main === module) {
  const args = process.argv.slice(2); const opt = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d); const ch = opt("--channel", "behind-the-ordinary");
  if (args[0] === "import") console.log(`imported ${importPack(ch, opt("--pack"))} assets -> ${path.relative(ROOT, regFile(ch))}`);
  else { const reg = load(ch); for (const a of reg.assets) { const p = check(a, "preview"), q = check(a, "publish"); console.log(`${a.id}: preview ${p.length ? "BLOCKED " + p.join("; ") : "ok"} | publish ${q.length ? "BLOCKED" : "ok"}`); } }
}
module.exports = { load, check, prepare, importPack, usedIds, ALLOWED };
