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
//
// Unattended operation (premium primary, core/pipeline/premium-lane.js): the owner may sign the channel's publication
// policy once (channels/<c>/premium/publication-policy.json: status SIGNED, signedBy, signedAt). While it is signed, a due
// day with no owner-approved package reserves the next qualified topic itself and binds the policy as its creative,
// factual and publish sign-off: each sign-off names the policy and its sha256, never a person who did not sign. Every
// other check above still applies unchanged (fresh final render, approved voice, objective QA, publish gate with channel
// publishing enabled and licensed media, duplicates, the uploader's own gates). A topic the checks refuse for its content
// stays reserved with the reason (never picked again by either lane); the next run takes the next qualified topic.
// Dry runs (PUBLISH!=1) write nothing. The policy ships UNSIGNED: code never signs it.
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

// the owner-signed publication policy for unattended operation; { ok, sha256, policy, why }
const policyFile = (channel) => path.join(approvalsDir(channel), "..", "publication-policy.json");
function policy(channel) {
  const file = policyFile(channel);
  if (!fs.existsSync(file)) return { ok: false, why: "no publication policy" };
  const raw = fs.readFileSync(file); const p = J(file, {}); const why = [];
  if (p.channel !== channel.slug) why.push(`policy is for ${p.channel}, not ${channel.slug}`);
  if (p.status !== "SIGNED") why.push(`policy status is ${p.status || "missing"}, not SIGNED`);
  if (!String(p.signedBy || "").trim()) why.push("policy signedBy missing");
  if (!p.signedAt || Number.isNaN(Date.parse(p.signedAt))) why.push("policy signedAt missing");
  return { ok: why.length === 0, why: why.join("; "), policy: p, sha256: crypto.createHash("sha256").update(raw).digest("hex"), file: path.relative(ROOT, file) };
}
const policyActive = (channel, env = process.env) => enabled(channel, env) && policy(channel).ok;

// Research review (policy "requireResearchReview": GoalLore Lab and The Hidden Logic of Things, whose research is new):
// code verifies that every quote is the source's own sentence and every number is in it, but whether a narration line
// says no more than its quotes is a reading. The owner reads each researched topic once (in batches, before it can
// be published unattended); the review is bound to the hash of its narration and quotes, so any change needs a new one.
const reviewsFile = (channel) => path.join(approvalsDir(channel), "..", "research-reviews.json");
function researchHash(topic) {
  return crypto.createHash("sha256").update(JSON.stringify({ v: 1, narration: (topic.narration || []).map((l) => [l.text, l.facts || []]), facts: (topic.facts || []).map((f) => [f.id || null, f.quote || "", f.url || ""]) })).digest("hex");
}
function researchReviewed(channel, topic) {
  const r = (J(reviewsFile(channel), {}) || {})[topic.id];
  return !!(r && signed(r) && r.sha256 === researchHash(topic));
}

// upload metadata from the topic's own research (no invented claims): title, the question, the cited sources, disclosure
function metadata(channel, topic) {
  const clean = (x) => String(x || "").replace(/[<>]/g, "").replace(/\s+/g, " ").trim();
  if (channel.slug === "failure-reconstructed") {
    const konu = J(path.join(channel.paths.state, "konular", `${topic.slug}.json`));
    // the live description engine on the case file, without its stock and archival footage credits: the premium video
    // is original animation
    if (konu) { const d = require("../../description-engine").olustur({ ...konu, slug: topic.slug, tur: "premium", kaynaklar: [] });
      const ANIMATION = "Original animation: no archival or stock footage; reconstructions and illustrations are labelled on screen.";
      const metin = /Footage is real archival film or licensed stock[^\n]*/.test(d.metin) ? d.metin.replace(/Footage is real archival film or licensed stock[^\n]*/, ANIMATION) : `${d.metin}\n\n${ANIMATION}`;
      return { title: clean(konu.baslik).slice(0, 100), description: metin, tags: d.etiketler }; }
  }
  const Hashtags = require("../hashtags");
  const sources = []; for (const f of [...(topic.facts || []), ...(topic.sources || [])]) { const url = f.url; const name = clean(f.sourceTitle || f.source || f.name || ""); if (url && !sources.some((x) => x.url === url)) sources.push({ name: name.replace(/ \(revision.*$/, "") || url, url }); }
  const hashtags = Hashtags.forTopic(channel.slug, topic, { format: "short" });
  const question = clean(topic.coreQuestion || topic.hook || topic.title);
  const description = [question, sources.length ? `Sources:\n${sources.map((x) => `- ${x.name}: ${x.url}`).join("\n")}` : null,
    `Original animation; no broadcast footage. Narration: synthetic voice (Microsoft Edge neural TTS). Claims are mapped to the sources above.`, hashtags.join(" ")].filter(Boolean).join("\n\n");
  const subject = Hashtags.subjectPhrase(topic);
  const tags = [...new Set([subject, clean(topic.pillar || topic.category || "").toLowerCase(), channel.name].filter(Boolean))];
  // the channel's editorial title when the record carries one (ImpossibleBrief), else the record's own title
  const title = clean(topic.title || (topic.editorialTitles || [])[0] || topic.topic || topic.coreQuestion).slice(0, 100);
  return { title, description, tags };
}

// an automatic reservation under the signed policy (written only on publication runs)
function autoReserve(channel, topic, pol, persist) {
  const file = path.join(approvalsDir(channel), `${topic.id}.json`);
  const rec = { topicId: topic.id, slug: topic.slug, auto: true, reservedBy: `publication policy ${pol.sha256.slice(0, 12)} (signed by ${pol.policy.signedBy})`, reservedAt: new Date().toISOString(),
    basis: { policy: pol.file, policySha256: pol.sha256, signedBy: pol.policy.signedBy, signedAt: pol.policy.signedAt }, contentSha256: null, creative: null, factual: null, publish: null, metadata: metadata(channel, topic) };
  if (persist) { fs.mkdirSync(approvalsDir(channel), { recursive: true }); fs.writeFileSync(file, JSON.stringify(rec, null, 2) + "\n"); }
  return { file, ...rec };
}
// the policy's sign-off for exactly the rendered content (bound once; a later render must match it)
function bindPolicy(a, hash, pol, persist) {
  const at = new Date().toISOString(); const by = `publication policy ${pol.sha256.slice(0, 12)} (signed by ${pol.policy.signedBy} ${pol.policy.signedAt})`;
  const sign = { by, at, basis: "publication-policy", policySha256: pol.sha256 };
  Object.assign(a, { contentSha256: hash, creative: sign, factual: sign, publish: sign });
  if (persist) { const { file, ...rec } = a; fs.writeFileSync(file, JSON.stringify(rec, null, 2) + "\n"); }
  return a;
}
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
function run(channel, { env = process.env, targetDay = null, spawn = cp.spawnSync, gate = require("../../scripts/bto-studio/publish-gate").evaluate, log = console.log, nextTopic = null } = {}) {
  if (!enabled(channel, env)) return null;
  const tag = `[${channel.name}] premium publish`;
  const persist = env.PUBLISH === "1";
  const pol = policy(channel);
  const ready = approvals(channel).filter((a) => !isPublished(channel, a) && !a.refused);
  const unbound = (a) => a.auto && !a.contentSha256 && pol.ok;
  const candidates = ready.filter((a) => approvalProblems(a).length === 0 || unbound(a));
  for (const a of ready.filter((x) => !candidates.includes(x))) log(`${tag}: ${a.topicId} reserved, not publishable yet: ${approvalProblems(a).join("; ")}`);
  let a = candidates.sort((x, y) => String((x.publish || {}).at || x.reservedAt).localeCompare(String((y.publish || {}).at || y.reservedAt)))[0];
  if (!a && pol.ok && nextTopic) {
    const t = nextTopic(pol.policy.requireResearchReview ? (x) => researchReviewed(channel, x) : null);
    if (!t) { log(`${tag}: publication policy signed, but no qualified topic${pol.policy.requireResearchReview ? " whose research the owner has reviewed" : ""}; nothing produced (the bar is not lowered)`); return { exitCode: 0, uploaded: false, noTopic: true, topicId: null, slug: null, videoId: null }; }
    a = autoReserve(channel, t, pol, persist);
    log(`${tag}: ${t.id} reserved under the signed publication policy ${pol.sha256.slice(0, 12)}${persist ? "" : " (dry run: not written)"}`);
  }
  if (!a) { log(`${tag}: no approved premium package${pol.ok ? "" : ` and no signed publication policy (${pol.why})`}; nothing to publish`); return null; }
  const refuse = (why, content = false) => {
    if (content && a.auto && persist) { const { file, ...rec } = a; rec.refused = { at: new Date().toISOString(), why }; fs.writeFileSync(file, JSON.stringify(rec, null, 2) + "\n"); }
    log(`${tag}: ${a.topicId} not handed to the uploader: ${why}; ${content && a.auto ? "the topic stays reserved and is not picked again; the next run takes the next qualified topic" : "the reservation stays"}`); return null;
  };

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
  if (!pkg || pkg.verdict !== "READY_FOR_HUMAN_REVIEW") return refuse(`package verdict ${pkg ? pkg.verdict : "missing"}`, true);
  if (!pkg.voice || pkg.voice.approved !== true) return refuse("narration is not the approved voice");
  const hash = contentHash(channel, a.topicId, pkg);
  if (unbound(a) && hash) bindPolicy(a, hash, pol, persist);
  if (hash !== a.contentSha256) return refuse(`content changed since approval (approved ${String(a.contentSha256).slice(0, 12)}, rendered ${String(hash).slice(0, 12)}); re-review needed`);
  const g = gate(pkgFile, { creative: a.creative, factual: a.factual, publish: a.publish });
  if (g.furthestState !== "PUBLISH_APPROVED") return refuse(`publish gate stops at ${g.furthestState || "TOPIC_READY"}: ${g.steps.filter((s) => !s.ok).map((s) => s.reasons.join("; ")).join("; ")}`, g.furthestState !== "QA_PASSED");
  if (g.duplicates && g.duplicates.length) return refuse(`duplicate of ${g.duplicates.join(", ")}`, true);
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
  return { exitCode: up.status === 15 ? 1 : 0, uploaded: true, verified: up.status === 0, topicId: a.topicId, slug: a.slug, videoId: entry.videoId || null, publishAt: entry.publishAt || null };
}

// Review candidates (no approval yet): evaluate the publish gate as it stands and run the existing uploader in --dogrula
// mode on the candidate, staged in a production folder that did not exist before and is removed afterwards. Nothing is
// uploaded, scheduled or approved: the staged package carries no quality-gate decision and no approval.
function uploaderDryRun(channel, topic, pkgFile, { env = process.env, spawn = cp.spawnSync, gate = require("../../scripts/bto-studio/publish-gate").evaluate, log = console.log } = {}) {
  const tag = `[${channel.name}] uploader dry run`; const pkg = J(pkgFile); const blockers = [];
  if (!pkg || !pkg.video) return { gate: null, blockers: ["no review package"], uploaderExit: null };
  let g = null; try { g = gate(pkgFile, {}); } catch (e) { blockers.push(`publish gate error: ${e.message}`); }
  if (g) { for (const st of g.steps.filter((x) => !x.ok)) blockers.push(...st.reasons); if (g.duplicates && g.duplicates.length) blockers.push(`duplicate of ${g.duplicates.join(", ")}`); }
  if (!pkg.voice || pkg.voice.approved !== true) blockers.push(`narration voice ${(pkg.voice && pkg.voice.used) || "?"} is not the owner-approved channel voice`);
  const pol = policy(channel);
  if (!pol.ok) blockers.push(`publication policy: ${pol.why}`);
  // what a signed policy would change: the same gate with the policy's sign-offs, evaluated and printed, never written
  let ifSigned = null;
  try { const sim = { by: "(simulation: publication policy not signed)", at: new Date().toISOString() }; const gs = gate(pkgFile, { creative: sim, factual: sim, publish: sim });
    ifSigned = { state: gs.furthestState, reasons: gs.steps.filter((x) => !x.ok).flatMap((x) => x.reasons), duplicates: gs.duplicates || [] };
    log(`${tag}: with a signed policy the publish gate would reach ${ifSigned.state || "TOPIC_READY"}${ifSigned.reasons.length ? ` (stops: ${ifSigned.reasons.join("; ")})` : ""}${ifSigned.duplicates.length ? `; duplicate of ${ifSigned.duplicates.join(", ")}` : ""} [simulation, nothing written]`);
  } catch (e) { log(`${tag}: signed-policy simulation failed: ${e.message}`); }
  if (pol.policy && pol.policy.requireResearchReview && !researchReviewed(channel, topic)) blockers.push(`research of ${topic.id} not reviewed by the owner (node core/pipeline/premium-publish.js review-research --channel ${channel.slug} --topic ${topic.id} --by <name>)`);
  if (!enabled(channel, env)) blockers.push(`${PREFIX[channel.slug]}_PREMIUM_PUBLISH is not 1`);
  if (!(channel.entry && channel.entry.enabled === true)) blockers.push("registry publishing disabled (config/channels.json enabled: false)");
  const out = path.join(channel.paths.production, topic.slug);
  if (fs.existsSync(out)) { blockers.push(`production folder for ${topic.slug} already exists; uploader dry run skipped, nothing touched`); return { gate: g && g.furthestState, blockers, uploaderExit: null }; }
  let code = null;
  try {
    const m = metadata(channel, topic);
    fs.mkdirSync(path.join(out, "Videos"), { recursive: true });
    fs.copyFileSync(path.join(ROOT, pkg.video), path.join(out, "Videos", `${topic.slug}.mp4`));
    fs.writeFileSync(path.join(out, "konu.json"), JSON.stringify({ channel: channel.slug, slug: topic.slug, format: "short", baslik: m.title, premium: { topicId: topic.id, dryRun: true } }, null, 2) + "\n");
    fs.writeFileSync(path.join(out, "YUKLEME.json"), JSON.stringify({ baslik: m.title, aciklama: m.description, etiketler: m.tags }, null, 2) + "\n");
    log(`${tag}: ${topic.id} -> youtube-yukle.js --dogrula (gate ${g ? g.furthestState : "?"}; title "${m.title}")`);
    const up = spawn(process.execPath, [path.join(ROOT, "youtube-yukle.js"), "--channel", channel.slug, topic.slug, "--dogrula"], { cwd: ROOT, stdio: "inherit", env: { ...env, PUBLISH: "0" } });
    code = up.status;
  } finally { fs.rmSync(out, { recursive: true, force: true }); }
  log(`${tag}: uploader --dogrula exit ${code}; publication blocked by: ${blockers.join("; ") || "nothing"}`);
  return { gate: g && g.furthestState, gateIfSigned: ifSigned && ifSigned.state, blockers, uploaderExit: code };
}

// owner CLI (read-only except `reserve`): status | reserve --topic <id> --by <name> | hash --topic <id>
if (require.main === module) {
  const args = process.argv.slice(2); const opt = (k) => (args.includes(k) ? args[args.indexOf(k) + 1] : null);
  const channel = Channel.getChannel(opt("--channel")); const cmd = args[0];
  if (cmd === "status") {
    for (const a of approvals(channel)) console.log(`${a.topicId}  ${a.publishedVideoId ? `published ${a.publishedVideoId}` : approvalProblems(a).length ? `reserved: ${approvalProblems(a).join("; ")}` : "APPROVED, waiting for a due day"}`);
    console.log(`flag ${PREFIX[channel.slug] || "?"}_PREMIUM_PUBLISH: ${enabled(channel) ? "ON" : "off"}`);
    const pol = policy(channel); console.log(`publication policy: ${pol.ok ? `SIGNED by ${pol.policy.signedBy} (${pol.sha256.slice(0, 12)})` : pol.why}`);
  } else if (cmd === "reserve") {
    const { topic } = require("../../scripts/bto-studio/adapter").loadTopic(channel.slug, opt("--topic")); const by = opt("--by");
    if (!by) throw new Error("--by <name> is required: a reservation is an owner decision");
    if (isPublished(channel, { slug: topic.slug, topicId: topic.id })) throw new Error(`${topic.id} is already published`);
    const file = path.join(approvalsDir(channel), `${topic.id}.json`); if (fs.existsSync(file)) throw new Error(`${path.relative(ROOT, file)} exists`);
    fs.mkdirSync(approvalsDir(channel), { recursive: true });
    fs.writeFileSync(file, JSON.stringify({ topicId: topic.id, slug: topic.slug, reservedBy: by, reservedAt: new Date().toISOString(), contentSha256: null,
      creative: null, factual: null, publish: null, metadata: { title: "", description: "", tags: [] } }, null, 2) + "\n");
    console.log(`reserved ${topic.id} (${path.relative(ROOT, file)}); the live lane will not pick it`);
  } else if (cmd === "review-research") {
    // prints every narration line with the verbatim quotes it cites; with --by, records the owner's review of exactly this text
    const { topic } = require("../../scripts/bto-studio/adapter").loadTopic(channel.slug, opt("--topic")); const byId = new Map((topic.facts || []).map((f) => [f.id, f]));
    for (const l of topic.narration || []) { console.log(`\n${l.text}`); for (const id of l.facts || []) { const f = byId.get(id) || {}; console.log(`   ${id}: "${f.quote || "(no quote)"}" ${f.url || ""}`); } }
    const sha = researchHash(topic); console.log(`\nresearch sha256 ${sha}`);
    const by = opt("--by");
    if (by) { const all = J(reviewsFile(channel), {}) || {}; all[topic.id] = { by, at: new Date().toISOString(), sha256: sha }; fs.mkdirSync(path.dirname(reviewsFile(channel)), { recursive: true }); fs.writeFileSync(reviewsFile(channel), JSON.stringify(all, null, 2) + "\n"); console.log(`recorded: ${topic.id} research reviewed by ${by}`); }
    else console.log("read every line against its quotes; record with --by <name> only if each line says no more than they do");
  } else if (cmd === "hash") {
    const pkg = J(path.join(topicDir(channel, opt("--topic")), "out", "review-package.json"));
    if (!pkg || pkg.verdict !== "READY_FOR_HUMAN_REVIEW") throw new Error(`no reviewable package (verdict ${pkg ? pkg.verdict : "missing"})`);
    console.log(contentHash(channel, opt("--topic"), pkg));
  } else { console.error("usage: node core/pipeline/premium-publish.js status|reserve|hash|review-research --channel <slug> [--topic <id>] [--by <name>]"); process.exit(1); }
}

module.exports = { run, enabled, approvals, reserved, contentHash, approvalProblems, stage, policy, policyActive, metadata, uploaderDryRun, researchHash, researchReviewed };
