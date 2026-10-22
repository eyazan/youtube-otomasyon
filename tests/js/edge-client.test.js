"use strict";
// Shared Edge narration client (scripts/fr-premium/edge-client.js): every premium channel narrates through it, so a
// rate limit from several CI jobs must back off within a budget, reuse cached beats, and fail with one clear error.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const Edge = require("../../scripts/fr-premium/edge-client");
const { failureLine, edgeTimeoutMs } = require("../../scripts/bto-studio/narrate");

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), "edge-client-"));
const limited = () => Object.assign(new Error("Edge TTS WebSocket error: Unexpected server response: 429"), { cause: { statusCode: 429 } });

test("settings: defaults are bounded and every override is clamped", () => {
  const d = Edge.settings({});
  assert.equal(d.maxConcurrency, 1); assert.equal(d.budgetSec, 180); assert.equal(d.rateLimitAttempts, 4);
  const o = Edge.settings({ EDGE_TTS_MAX_CONCURRENCY: "99", EDGE_TTS_RETRY_BUDGET_S: "5", EDGE_RATE_LIMIT_RETRIES: "50", EDGE_TTS_CACHE: "off" });
  assert.equal(o.maxConcurrency, 4); assert.equal(o.budgetSec, 30); assert.equal(o.rateLimitAttempts, 9); assert.equal(o.cacheDir, null);
});

test("classify and Retry-After: 429 from the client's statusCode or message; Retry-After as seconds or HTTP date", () => {
  assert.equal(Edge.classify(limited()), "rate-limited");
  assert.equal(Edge.classify(new Error("Unexpected server response: 403")), "refused");
  assert.equal(Edge.classify(new Error("edge timeout")), "transient");
  assert.equal(Edge.retryAfterMs({ headers: { "retry-after": "7" } }), 7000);
  assert.equal(Edge.retryAfterMs({ cause: { retryAfter: new Date(10000).toUTCString() } }, 4000), 6000);
  assert.equal(Edge.retryAfterMs(limited()), null);
});

test("backoff: exponential with jitter, never zero, capped", () => {
  const s = Edge.settings({});
  assert.equal(Edge.backoffMs(1, "rate-limited", s, () => 0), 7500);
  assert.equal(Edge.backoffMs(2, "rate-limited", s, () => 1), 30000);
  assert.equal(Edge.backoffMs(10, "rate-limited", s, () => 1), 120000);
  assert.equal(Edge.backoffMs(1, "transient", s, () => 0), 1250);
});

test("withRetry: a rate limit retries with backoff, then succeeds; waits are counted against the shared budget", async () => {
  let calls = 0; const waits = []; const budget = { waitedMs: 0 };
  const r = await Edge.withRetry(async () => { calls += 1; if (calls < 3) throw limited(); return "ok"; },
    { s: Edge.settings({}), budget, sleep: async (ms) => waits.push(ms), random: () => 0, log: () => {} });
  assert.equal(r, "ok"); assert.equal(calls, 3); assert.deepEqual(waits, [7500, 15000]); assert.equal(budget.waitedMs, 22500);
});

test("withRetry: Retry-After is honoured when the error carries it", async () => {
  const waits = []; let calls = 0;
  await Edge.withRetry(async () => { calls += 1; if (calls === 1) throw Object.assign(limited(), { retryAfter: "4" }); return 1; },
    { s: Edge.settings({}), sleep: async (ms) => waits.push(ms), log: () => {} });
  assert.deepEqual(waits, [4000]);
});

test("withRetry: stops at the attempt cap or the budget with one clear error naming the cause; never another voice", async () => {
  let calls = 0;
  await assert.rejects(Edge.withRetry(async () => { calls += 1; throw limited(); }, { label: "beat b3", s: Edge.settings({}), sleep: async () => {}, random: () => 0, log: () => {} }), (e) => {
    assert.equal(e.name, "EdgeNarrationError"); assert.equal(e.kind, "rate-limited"); assert.equal(e.status, 429);
    assert.match(e.message, /beat b3: rate-limited \(HTTP 429\) after 4 attempt/); assert.match(e.message, /no other voice is substituted/); return true;
  });
  assert.equal(calls, 4);
  // a 30 s budget allows the first 7.5 s wait and the 15 s one, not the 30 s third
  calls = 0;
  await assert.rejects(Edge.withRetry(async () => { calls += 1; throw limited(); }, { s: Edge.settings({ EDGE_TTS_RETRY_BUDGET_S: "30", EDGE_RATE_LIMIT_RETRIES: "8" }), sleep: async () => {}, random: () => 0, log: () => {} }),
    /would exceed the 30 s retry budget/);
  assert.equal(calls, 3);
});

test("cache: a stored beat is reused, an invalid one is ignored, and the key changes with voice, rate or text", () => {
  const dir = tmp(); const key = Edge.cacheKey({ voice: "en-US-EmmaMultilingualNeural", rate: "+0%", text: "Three corner squares.", format: "mp3" });
  assert.equal(Edge.cacheGet(dir, key), null);
  Edge.cachePut(dir, key, { audio: Buffer.alloc(4000, 1), words: [{ text: "Three", start: 0, end: 0.3 }] });
  const hit = Edge.cacheGet(dir, key); assert.equal(hit.audio.length, 4000); assert.equal(hit.words[0].text, "Three");
  for (const change of [{ voice: "en-GB-RyanNeural" }, { rate: "+5%" }, { text: "Three corner squares!" }]) {
    assert.notEqual(Edge.cacheKey({ voice: "en-US-EmmaMultilingualNeural", rate: "+0%", text: "Three corner squares.", format: "mp3", ...change }), key);
  }
  const bad = Edge.cacheKey({ voice: "x", rate: "+0%", text: "y", format: "mp3" });
  Edge.cachePut(dir, bad, { audio: Buffer.alloc(10), words: [] }); assert.equal(Edge.cacheGet(dir, bad), null);
  assert.equal(fs.readdirSync(dir).filter((f) => f.endsWith(".tmp.mp3") || f.endsWith(".tmp.json")).length, 0);
});

test("cache prune keeps the cache under its size limit, least recently used first", () => {
  const dir = tmp();
  for (let i = 0; i < 3; i += 1) { Edge.cachePut(dir, "k" + i, { audio: Buffer.alloc(600 * 1024, i), words: [{ text: "a", start: 0, end: 1 }] }); const t = new Date(Date.now() - (10 - i) * 1000); fs.utimesSync(path.join(dir, `k${i}.mp3`), t, t); }
  assert.equal(Edge.cachePrune(dir, 1), 2);
  assert.deepEqual(fs.readdirSync(dir).filter((f) => f.endsWith(".mp3")), ["k2.mp3"]);
});

test("bounded concurrency: a second request waits for the slot; a dead holder's slot is reclaimed", async () => {
  const dir = tmp(); const order = [];
  let release; const first = Edge.withSlot(dir, 1, () => new Promise((r) => { order.push("a-start"); release = () => { order.push("a-end"); r(); }; }));
  await new Promise((r) => setTimeout(r, 20));
  const second = Edge.withSlot(dir, 1, async () => { order.push("b"); }, { pollMs: 10 });
  await new Promise((r) => setTimeout(r, 50)); assert.deepEqual(order, ["a-start"]);
  release(); await first; await second; assert.deepEqual(order, ["a-start", "a-end", "b"]);
  fs.writeFileSync(path.join(dir, "slot-0.lock"), JSON.stringify({ pid: 2 ** 22 + 12345, at: Date.now() }));
  assert.ok(Edge.tryAcquire(dir, 1, 60000), "a slot held by a process that no longer exists is reclaimed");
  await assert.rejects(Edge.withSlot(dir, 1, async () => {}, { pollMs: 5, waitMs: 30 }), /no Edge narration slot free/);
});

test("studio narrator: timeout covers the retry budget; the reported failure is the cause, not Node's version banner", () => {
  assert.equal(edgeTimeoutMs({}), 480000); assert.equal(edgeTimeoutMs({ EDGE_TTS_RETRY_BUDGET_S: "420" }), 720000);
  const crash = { status: 1, stderr: "node:child_process:1000\n    throw err;\nError: spawnSync ffmpeg ENOENT\n    at Object.spawnSync (node:internal)\nNode.js v20.20.2\n" };
  assert.equal(failureLine(crash), "Error: spawnSync ffmpeg ENOENT");
  assert.match(failureLine({ status: 1, stderr: "NARRATION FAILED: Edge narration failed for beat b2: rate-limited (HTTP 429) after 4 attempt(s)\nNode.js v20.20.2\n" }), /^NARRATION FAILED: .*HTTP 429/);
});
