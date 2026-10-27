"use strict";
// Premium publishing adapter: PREMIUM APPROVED VIDEO -> the existing YouTube uploader (youtube-yukle.js).
// Disabled unless <PREFIX>_PREMIUM_PUBLISH=1 (IB_, FR_, HLT_, GLL_); no workflow sets it. With the flag off, nothing here
// reads, writes or renders anything, and the live lane runs exactly as before.
//
// Why a separate path: the premium shadow renders a topic the live lane has already uploaded (a duplicate by
// construction), and a person cannot approve a video inside the run that renders it. So a premium video reaches
// YouTube only through an approval prepared before the run:
//   1. reserve   the owner reserves an unpublished topic: channels/<c>/premium/approvals/<topicId>.json. A reserved
//                topic is never picked by the live lane (core/growth/context.js, shorts-sira.js read the reservations).
//   2. review    a candidate is rendered for that topic (studio.js, BTO_PREMIUM_RENDER=final, approved Edge voice);
//                `node core/pipeline/premium-publish.js hash` prints its content hash (storyboard, narration source and
//                lines, voice). The owner signs creative, factual and publish approval for exactly that hash, and
//                writes the upload title, description and tags, in the approvals file.
//   3. publish   on the channel's due day the lane calls run(): the approved content is rendered fresh at final quality
//                with the approved voice only (deterministic; a stored MP4 is never trusted), and it is handed to the
//                uploader only when ALL hold: content hash = approved hash, objective QA PASS, the existing publish
//                gate reaches PUBLISH_APPROVED (approvals, licensed media, channel publishing enabled, not a duplicate),
//                the topic is not in published.json. The MP4 is staged as a normal production package and youtube-yukle
//                runs unchanged: channel identity check, quality gate, narration approval, idempotent upload journal and
//                remote duplicate reconciliation, target-day publishAt, quota. PUBLISH!=1 runs the uploader's --dogrula.
// Any refusal before the upload leaves the day to the live lane; the reservation stays for the next run.
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const cp = require("child_process");
const Channel = require("../channel-context");
const Shadow = require("./premium-shadow");
const Slots = require("../../lib/slot-lock");

const ROOT = Channel.ROOT;
const PREFIX = Shadow.PREFIX;
const J = (f, d = null) => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch (e) { return d; } };
const enabled = (channel, env = process.env) => !!PREFIX[channel.slug] && env[`${PREFIX[channel.slug]}_PREMIUM_PUBLISH`] === "1";
const approvalsDir = (channel) => path.join(channel.paths.base, "premium", "approvals");
const topicDir = (channel, topicId) => path.join(channel.paths.base, "premium", topicId);
const publishedList = (channel) => [].concat(J(path.join(channel.paths.state, channel.config.pathMode === "legacy-adapter" ? "yayinlananlar.json" : "published.json"), []) || []);
const isPublished = (channel, a) => publishedList(channel).some((p) => p && (p.slug === a.slug || p.topicId === a.topicId));

// every approvals file of the channel (a file is a reservation; approvals inside it are the owner's sign-offs)
function approvals(channel) {
  const dir = approvalsDir(channel); if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith(".json")).map((f) => ({ file: path.join(dir, f), ...J(path.join(dir, f), {}) })).filter((a) => a.topicId && a.slug);
}
// topics the live lane must not pick: reserved and not yet published as premium
function reserved(channel) {
  const set = new Set();
  for (const a of approvals(channel)) if (!a.publishedVideoId) { set.add(a.slug); set.add(a.topicId); }
  return set;
}

// content the owner approves: the storyboard that renders, the narration source and lines, and the voice
function contentHash(channel, topicId, pkg) {
  const storyboard = J(path.join(topicDir(channel, topicId), "storyboard.json"));
  if (!storyboard || !pkg || !pkg.narrationUnchanged || !pkg.voice) return null;
  return crypto.createHash("sha256").update(JSON.stringify({ v: 1, storyboard, source: pkg.narrationUnchanged.sourceHash, lines: pkg.narrationUnchanged.lines, voice: pkg.voice.used })).digest("hex");
}

const signed = (s) => !!(s && typeof s.by === "string" && s.by.trim() && s.at);
// why an approvals record is not (yet) a publishing approval; [] when it is
function approvalProblems(a) {
  const p = [];
  for (const k of ["creative", "factual", "publish"]) if (!signed(a[k])) p.push(`${k} approval not signed ({ by, at })`);
  if (!/^[0-9a-f]{64}$/.test(String(a.contentSha256 || ""))) p.push("contentSha256 of the reviewed render missing");
  const m = a.metadata || {};
  if (!String(m.title || "").trim() || String(m.title).length > 100) p.push("metadata.title missing or over 100 characters");
  if (!String(m.description || "").trim()) p.push("metadata.description missing");
  if (a.publishedVideoId) p.push(`already published as ${a.publishedVideoId}`);
  return p;
}

function sha256File(f) { return crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex"); }

// stages the approved premium MP4 as a normal production package for youtube-yukle.js (idempotent for the same media)
function stage(channel, a, pkgFile, pkg, mediaSha) {
  const out = path.join(channel.paths.production, a.slug); const videos = path.join(out, "Videos");
  const marker = path.join(out, "PREMIUM-STAGED.json"); const prior = J(marker);
  if (fs.existsSync(videos) && fs.readdirSync(videos).some((f) => f.endsWith(".mp4")) && !(prior && prior.mediaSha256 === mediaSha))
    return { ok: false, reason: `production folder ${path.relative(ROOT, out)} already holds another video for this slug; not overwritten` };
  fs.mkdirSync(videos, { recursive: true });
  fs.copyFileSync(path.join(ROOT, pkg.video), path.join(videos, `${a.slug}.mp4`));
  fs.writeFileSync(path.join(out, "konu.json"), JSON.stringify({ channel: channel.slug, slug: a.slug, format: "short", baslik: a.metadata.title,
    premium: { topicId: a.topicId, contentSha256: a.contentSha256, mediaSha256: mediaSha, package: path.relative(ROOT, pkgFile) } }, null, 2) + "\n");
  fs.writeFileSync(path.join(out, "YUKLEME.json"), JSON.stringify({ baslik: a.metadata.title, aciklama: a.metadata.description, etiketler: (a.metadata.tags || []).map(String) }, null, 2) + "\n");
  fs.writeFileSync(path.join(videos, "denetim.json"), JSON.stringify({ voice: { provider: "edge", voice: pkg.voice.used, syntheticVoice: true, fallback: null, approved: true } }, null, 2) + "\n");
  const gateDir = path.join(channel.paths.packages, a.slug); fs.mkdirSync(gateDir, { recursive: true });
  fs.writeFileSync(path.join(gateDir, "quality-gate.json"), JSON.stringify({ karar: "PUBLISH", decision: "PUBLISH", source: "premium publish gate (scripts/bto-studio/publish-gate.js)",
    gateState: "PUBLISH_APPROVED", objectivePass: true, topicId: a.topicId, mediaSha256: mediaSha, approvedBy: { creative: a.creative.by, factual: a.factual.by, publish: a.publish.by } }, null, 2) + "\n");
  fs.writeFileSync(marker, JSON.stringify({ topicId: a.topicId, mediaSha256: mediaSha, stagedAt: new Date().toISOString() }, null, 2) + "\n");
  return { ok: true, out };
}

// The daily hook. Returns null when the lane should continue as usual (flag off, nothing approved, or a refusal before
// any upload); otherwise { exitCode, uploaded, topicId, slug, videoId } and the lane's day is done.
function run(channel, { env = process.env, targetDay = null, spawn = cp.spawnSync, gate = require("../../scripts/bto-studio/publish-gate").evaluate, log = console.log } = {}) {
  if (!enabled(channel, env)) return null;
  const tag = `[${channel.name}] premium publish`;
  const ready = approvals(channel).filter((a) => !isPublished(channel, a));
  const candidates = ready.filter((a) => approvalProblems(a).length === 0);
  for (const a of ready.filter((x) => !candidates.includes(x))) log(`${tag}: ${a.topicId} reserved, not publishable yet: ${approvalProblems(a).join("; ")}`);
  if (!candidates.length) { log(`${tag}: no approved premium package; the live lane continues`); return null; }
  const a = candidates.sort((x, y) => String(x.publish.at).localeCompare(String(y.publish.at)))[0];
  const refuse = (why) => { log(`${tag}: ${a.topicId} not handed to the uploader: ${why}; the live lane continues, the reservation stays`); return null; };

  // fresh final render of the approved content, approved Edge voice only (BTO_PREMIUM_RENDER=final never falls back)
  const res = Shadow.resources(channel, (k) => env[`${PREFIX[channel.slug]}_PREMIUM_${k}`]);
  if (!res.ok) return refuse(`insufficient resources (${res.short.join(", ")})`);
  const slot = Slots.acquireSync(path.join(env.PREMIUM_RENDER_LOCK_DIR || require("os").tmpdir(), "premium-render-slots"), Math.max(1, Number(env.PREMIUM_RENDER_MAX_CONCURRENCY) || 1), { waitMs: 600000 });
  if (!slot) return refuse("no premium render slot free");
  let child;
  try {
    child = spawn(process.execPath, [path.join(ROOT, "scripts", "bto-studio", "studio.js"), "--channel", channel.slug, "--topic", a.topicId, "--quality", "final", "--voice", "edge"],
      { cwd: ROOT, env: { ...Shadow.childEnv(env), BTO_PREMIUM_RENDER: "final" }, encoding: "utf8", timeout: 1500000, maxBuffer: 1 << 26 });
  } finally { Slots.release(slot); }
  if (!child || child.status !== 0) return refuse(`final render failed (${child && child.error ? child.error.code || child.error.message : `exit ${child && child.status}`})`);
  const pkgFile = path.join(topicDir(channel, a.topicId), "out", "review-package.json"); const pkg = J(pkgFile);
  if (!pkg || pkg.verdict !== "READY_FOR_HUMAN_REVIEW") return refuse(`package verdict ${pkg ? pkg.verdict : "missing"}`);
  if (!pkg.voice || pkg.voice.approved !== true) return refuse("narration is not the approved voice");
  const hash = contentHash(channel, a.topicId, pkg);
  if (hash !== a.contentSha256) return refuse(`content changed since approval (approved ${a.contentSha256.slice(0, 12)}, rendered ${String(hash).slice(0, 12)}); re-review needed`);
  const g = gate(pkgFile, { creative: a.creative, factual: a.factual, publish: a.publish });
  if (g.furthestState !== "PUBLISH_APPROVED") return refuse(`publish gate stops at ${g.furthestState || "TOPIC_READY"}: ${g.steps.filter((s) => !s.ok).map((s) => s.reasons.join("; ")).join("; ")}`);
  if (g.duplicates && g.duplicates.length) return refuse(`duplicate of ${g.duplicates.join(", ")}`);
  const mediaSha = sha256File(path.join(ROOT, pkg.video));
  const st = stage(channel, a, pkgFile, pkg, mediaSha); if (!st.ok) return refuse(st.reason);

  // the existing uploader, unchanged: identity, quality gate, narration approval, journal, duplicate reconciliation
  const publish = env.PUBLISH === "1";
  log(`${tag}: ${a.topicId} -> youtube-yukle.js${publish ? "" : " --dogrula (PUBLISH!=1)"} (media ${mediaSha.slice(0, 12)})`);
  const up = spawn(process.execPath, [path.join(ROOT, "youtube-yukle.js"), "--channel", channel.slug, a.slug, ...(publish ? [] : ["--dogrula"])],
    { cwd: ROOT, stdio: "inherit", env: { ...env, ...(targetDay ? { SHORTS_TARGET_DAY: targetDay } : {}) } });
  if (!publish) return { exitCode: up.status === 0 ? 0 : 1, uploaded: false, dryRun: true, topicId: a.topicId, slug: a.slug, videoId: null };
  if (up.status !== 0 && up.status !== 15) {
    // 16: the target day's slot is taken or missed (never moved); other codes: nothing uploaded. The reservation stays.
    log(`${tag}: uploader exit ${up.status}; ${a.topicId} stays reserved for the next due day`);
    return { exitCode: up.status === 16 ? 0 : 1, uploaded: false, topicId: a.topicId, slug: a.slug, videoId: null };
  }
  // 0 uploaded and verified; 15 uploaded, schedule not verified: on YouTube either way, so never uploaded again
  const entry = [].concat(publishedList(channel)).reverse().find((p) => p && p.slug === a.slug) || {};
  const rec = J(a.file, {}); rec.publishedVideoId = entry.videoId || "uploaded (see published.json)"; rec.publishedAt = new Date().toISOString(); rec.mediaSha256 = mediaSha;
  fs.writeFileSync(a.file, JSON.stringify(rec, null, 2) + "\n");
  return { exitCode: up.status === 15 ? 1 : 0, uploaded: true, verified: up.status === 0, topicId: a.topicId, slug: a.slug, videoId: entry.videoId || null };
}

// owner CLI (read-only except `reserve`): status | reserve --topic <id> --by <name> | hash --topic <id>
if (require.main === module) {
  const args = process.argv.slice(2); const opt = (k) => (args.includes(k) ? args[args.indexOf(k) + 1] : null);
  const channel = Channel.getChannel(opt("--channel")); const cmd = args[0];
  if (cmd === "status") {
    for (const a of approvals(channel)) console.log(`${a.topicId}  ${a.publishedVideoId ? `published ${a.publishedVideoId}` : approvalProblems(a).length ? `reserved: ${approvalProblems(a).join("; ")}` : "APPROVED, waiting for a due day"}`);
    console.log(`flag ${PREFIX[channel.slug] || "?"}_PREMIUM_PUBLISH: ${enabled(channel) ? "ON" : "off"}`);
  } else if (cmd === "reserve") {
    const { topic } = require("../../scripts/bto-studio/adapter").loadTopic(channel.slug, opt("--topic")); const by = opt("--by");
    if (!by) throw new Error("--by <name> is required: a reservation is an owner decision");
    if (isPublished(channel, { slug: topic.slug, topicId: topic.id })) throw new Error(`${topic.id} is already published`);
    const file = path.join(approvalsDir(channel), `${topic.id}.json`); if (fs.existsSync(file)) throw new Error(`${path.relative(ROOT, file)} exists`);
    fs.mkdirSync(approvalsDir(channel), { recursive: true });
    fs.writeFileSync(file, JSON.stringify({ topicId: topic.id, slug: topic.slug, reservedBy: by, reservedAt: new Date().toISOString(), contentSha256: null,
      creative: null, factual: null, publish: null, metadata: { title: "", description: "", tags: [] } }, null, 2) + "\n");
    console.log(`reserved ${topic.id} (${path.relative(ROOT, file)}); the live lane will not pick it`);
  } else if (cmd === "hash") {
    const pkg = J(path.join(topicDir(channel, opt("--topic")), "out", "review-package.json"));
    if (!pkg || pkg.verdict !== "READY_FOR_HUMAN_REVIEW") throw new Error(`no reviewable package (verdict ${pkg ? pkg.verdict : "missing"})`);
    console.log(contentHash(channel, opt("--topic"), pkg));
  } else { console.error("usage: node core/pipeline/premium-publish.js status|reserve|hash --channel <slug> [--topic <id>] [--by <name>]"); process.exit(1); }
}

module.exports = { run, enabled, approvals, reserved, contentHash, approvalProblems, stage };
