"use strict";
// Shared Edge narration client for every premium channel (scripts/fr-premium/narrate-edge.js is its only caller; the
// studio narrator spawns that for IB, FR, The Hidden Logic of Things and GoalLore Lab). It exists because several CI
// jobs narrating at once drew HTTP 429 from Edge (runs 39834813659, 39834813687):
//   - cache: a beat is keyed by voice, rate, spoken text, output format and client version; a hit reuses the stored
//     MP3 and word boundaries, so a re-run of the same topic, or two jobs narrating the same text, call Edge once
//   - bounded concurrency: at most EDGE_TTS_MAX_CONCURRENCY (default 1) Edge requests at a time across processes
//     on one machine, through lock files next to the cache
//   - retry: exponential backoff with jitter; a rate limit starts at 15 s, a dropped socket at 2.5 s; Retry-After is
//     honoured when the error carries it (msedge-tts 2.1.0 keeps the status code but not the header, so today the
//     backoff applies); a total wait budget (EDGE_TTS_RETRY_BUDGET_S) and an attempt cap bound every narration
//   - failure: one error that names the beat, attempts, seconds waited and the cause. The caller fails safely: no
//     other voice is ever substituted here.
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..");
const clamp = (v, lo, hi, d) => { const n = Number(v); return Number.isFinite(n) && v !== "" && v != null ? Math.min(hi, Math.max(lo, n)) : d; };

function settings(env = process.env) {
  return {
    maxConcurrency: clamp(env.EDGE_TTS_MAX_CONCURRENCY, 1, 4, 1),
    budgetSec: clamp(env.EDGE_TTS_RETRY_BUDGET_S, 30, 900, 180),
    rateLimitAttempts: clamp(env.EDGE_RATE_LIMIT_RETRIES, 3, 8, 3) + 1,
    otherAttempts: 3,
    baseMs: 2500, rateBaseMs: 15000, capMs: 120000,
    cacheDir: env.EDGE_TTS_CACHE === "off" ? null : path.resolve(env.EDGE_TTS_CACHE_DIR || path.join(ROOT, ".cache", "edge-tts")),
    cacheMaxMb: clamp(env.EDGE_TTS_CACHE_MAX_MB, 10, 2000, 200),
  };
}

// ---- classification -------------------------------------------------------------------------------------------------
function statusOf(err) {
  const s = (err && (err.statusCode || (err.cause && err.cause.statusCode))) || null;
  if (s) return Number(s);
  const m = String((err && err.message) || "").match(/\b(?:response|status)[: ]+(\d{3})\b/i) || String((err && err.message) || "").match(/\b(429|401|403|5\d\d)\b/);
  return m ? Number(m[1]) : null;
}
function classify(err) {
  const s = statusOf(err);
  if (s === 429) return "rate-limited";
  if (s === 401 || s === 403) return "refused";
  if (s && s >= 500) return "server";
  return "transient";
}
// Retry-After as delta-seconds or an HTTP date; null when the error carries none
function retryAfterMs(err, now = Date.now()) {
  const pick = (o) => o && (o.retryAfter || (o.headers && (o.headers["retry-after"] || o.headers["Retry-After"])));
  const raw = pick(err) || pick(err && err.cause);
  if (raw == null || raw === "") return null;
  if (/^\d+(\.\d+)?$/.test(String(raw).trim())) return Math.round(parseFloat(raw) * 1000);
  const t = Date.parse(String(raw)); return Number.isFinite(t) ? Math.max(0, t - now) : null;
}
// exponential with "equal jitter": half the step is fixed, half random, so retries from parallel jobs spread out
// but never collapse to zero
function backoffMs(attempt, kind, s = settings(), random = Math.random) {
  const base = kind === "rate-limited" ? s.rateBaseMs : s.baseMs;
  const step = Math.min(s.capMs, base * 2 ** (attempt - 1));
  return Math.round(step / 2 + random() * (step / 2));
}

class EdgeNarrationError extends Error {
  constructor(message, details) { super(message); this.name = "EdgeNarrationError"; Object.assign(this, details); }
}

// Runs fn until it succeeds, the attempt cap for its failure kind is reached, or the next wait would overrun the
// budget. budget is shared by reference ({ waitedMs }) so all beats of one narration draw on one budget.
async function withRetry(fn, { label = "request", s = settings(), budget = { waitedMs: 0 }, sleep = (ms) => new Promise((r) => setTimeout(r, ms)),
  random = Math.random, now = () => Date.now(), log = (m) => process.stdout.write(m + "\n") } = {}) {
  for (let attempt = 1; ; attempt += 1) {
    try { return await fn(attempt); } catch (err) {
      const kind = classify(err);
      const cap = kind === "rate-limited" ? s.rateLimitAttempts : s.otherAttempts;
      const hinted = retryAfterMs(err, now());
      const wait = hinted != null ? Math.min(s.capMs, hinted) : backoffMs(attempt, kind, s, random);
      const over = budget.waitedMs + wait > s.budgetSec * 1000;
      if (attempt >= cap || over) {
        const why = attempt >= cap ? `${attempt} attempt(s), the cap for ${kind}` : `the next wait (${(wait / 1000).toFixed(0)} s) would exceed the ${s.budgetSec} s retry budget`;
        throw new EdgeNarrationError(`Edge narration failed for ${label}: ${kind}${statusOf(err) ? ` (HTTP ${statusOf(err)})` : ""} after ${why}; `
          + `${(budget.waitedMs / 1000).toFixed(0)} s waited in total. Last error: ${String(err.message).slice(0, 160)}. `
          + "The approved voice is unavailable, so this narration fails; no other voice is substituted.", { kind, status: statusOf(err), attempts: attempt, waitedMs: budget.waitedMs });
      }
      log(`  (edge retry ${attempt} for ${label}: ${kind}${hinted != null ? ", Retry-After honoured" : ""}; waiting ${(wait / 1000).toFixed(1)} s)`);
      budget.waitedMs += wait; await sleep(wait);
    }
  }
}

// ---- cache ----------------------------------------------------------------------------------------------------------
function clientVersion() { try { return require("msedge-tts/package.json").version; } catch (e) { return "unknown"; } }
function cacheKey({ voice, rate, text, format }) {
  return crypto.createHash("sha256").update(JSON.stringify({ v: 1, voice, rate, text, format, client: clientVersion() })).digest("hex");
}
function cacheGet(dir, key) {
  if (!dir) return null;
  const mp3 = path.join(dir, key + ".mp3"), meta = path.join(dir, key + ".json");
  try {
    const words = JSON.parse(fs.readFileSync(meta, "utf8")).words; const audio = fs.readFileSync(mp3);
    if (audio.length < 2000 || !Array.isArray(words) || !words.length) return null;
    const t = new Date(); fs.utimesSync(mp3, t, t); // least-recently-used order for pruning
    return { audio, words };
  } catch (e) { return null; }
}
function cachePut(dir, key, { audio, words }, meta = {}) {
  if (!dir) return false;
  fs.mkdirSync(dir, { recursive: true });
  const tmp = path.join(dir, `.${key}.${process.pid}.tmp`);
  fs.writeFileSync(tmp + ".mp3", audio); fs.renameSync(tmp + ".mp3", path.join(dir, key + ".mp3"));
  fs.writeFileSync(tmp + ".json", JSON.stringify({ ...meta, words, storedAt: new Date().toISOString() }) + "\n"); fs.renameSync(tmp + ".json", path.join(dir, key + ".json"));
  return true;
}
// keeps the cache under maxMb, oldest-used first; returns the number of entries removed
function cachePrune(dir, maxMb) {
  if (!dir || !fs.existsSync(dir)) return 0;
  const entries = fs.readdirSync(dir).filter((f) => f.endsWith(".mp3")).map((f) => { const st = fs.statSync(path.join(dir, f)); return { key: f.slice(0, -4), size: st.size, at: st.mtimeMs }; })
    .sort((a, b) => a.at - b.at);
  let total = entries.reduce((n, e) => n + e.size, 0); let removed = 0;
  for (const e of entries) {
    if (total <= maxMb * 1024 * 1024) break;
    for (const ext of [".mp3", ".json"]) fs.rmSync(path.join(dir, e.key + ext), { force: true });
    total -= e.size; removed += 1;
  }
  return removed;
}

// ---- bounded concurrency: shared lock files (lib/slot-lock.js) ----------------------------------------------------------
const Slots = require("../../lib/slot-lock");
const tryAcquire = Slots.tryAcquire;
function withSlot(lockDir, max, fn, opts = {}) {
  return Slots.withSlot(lockDir, max, fn, { ...opts, onTimeout: () => new EdgeNarrationError(`no Edge narration slot free after ${Math.round((opts.waitMs || 15 * 60000) / 1000)} s (${max} allowed at a time, ${lockDir})`, { kind: "slot-timeout" }) });
}

module.exports = { settings, statusOf, classify, retryAfterMs, backoffMs, withRetry, EdgeNarrationError, cacheKey, cacheGet, cachePut, cachePrune, withSlot, tryAcquire, clientVersion };
