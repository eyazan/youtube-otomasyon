"use strict";
// ImpossibleBrief skipped 2026-10-20 (NO_EXPLORE_CANDIDATE) and 2026-10-21 (NO_QUALIFIED_TOPIC: best
// viral 74 < 75). Cause: the six A topics at 76-78 had been blocked permanently by the licensed-picture
// pre-check (2026-10-03..12), and the scorer assumed "no archival footage" for all 500 IB topics.
// These tests pin the fix: measured visual availability (visual survey), re-admission of pre-check
// blocks only on a newer passing survey, the explore fallback, and the qualified buffer. The 75
// minimum and the A-only buckets are unchanged.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const Channel = require("../../core/channel-context");
const Growth = require("../../core/growth");
const Config = require("../../core/growth/config");
const Model = require("../../core/growth/topic-model");
const Survey = require("../../core/growth/visual-survey");
const Discovery = require("../../core/discovery");
const Inventory = require("../../core/growth/inventory");

function withState(slug, files = {}) {
  const base = Channel.getChannel(slug);
  const state = fs.mkdtempSync(path.join(os.tmpdir(), `ibbuf-${slug}-`));
  for (const [name, value] of Object.entries(files)) fs.writeFileSync(path.join(state, name), JSON.stringify(value));
  return { ...base, paths: { ...base.paths, state } };
}
const survey = (topics) => ({ schema: Survey.SCHEMA, topics });
const universe = () => Discovery.universe(Channel.getChannel("impossible-brief")).topics;

test("thresholds are not lowered: IB viral minimum 75, A-only selection", () => {
  const config = Config.forChannel(Channel.getChannel("impossible-brief"));
  assert.equal(config.viralScoring.minimumToProduce, 75);
  assert.deepEqual([config.selection.exploitBuckets, config.selection.exploreBuckets], [["A"], ["A"]]);
  assert.equal(Survey.enabled(Channel.getChannel("impossible-brief")), true);
  assert.equal(Survey.enabled(Channel.getChannel("critical-thread")), false, "CriticalThread scoring is untouched");
});

test("a fresh passing survey marks the topic as having confirmed stills; failing, stale or outage entries do not", () => {
  const raw = universe().find((t) => t.id === "IB-HUM-050");
  const now = new Date().toISOString();
  const old = new Date(Date.now() - (Survey.MAX_AGE_DAYS + 1) * 86400000).toISOString();
  const cases = [
    [{ measuredAt: now, passesPrecheck: true, licensedStills: 5, licensedClips: 0 }, true],
    [{ measuredAt: now, passesPrecheck: false, licensedStills: 1, licensedClips: 0, shortfall: "1 licensed pictures/clips < 4" }, false],
    [{ measuredAt: old, passesPrecheck: true, licensedStills: 5, licensedClips: 0 }, false],
    [{ measuredAt: now, passesPrecheck: false, sourceError: "commons timeout" }, false],
  ];
  const baseline = Model.normalize(Channel.getChannel("impossible-brief"), raw);
  assert.equal(baseline.archival, false, "no IB topic has confirmed stills without a survey");
  for (const [entry, archival] of cases) {
    const channel = withState("impossible-brief", { "visual-survey.json": survey({ [raw.id]: entry }) });
    assert.equal(Model.normalize(channel, raw).archival, archival, JSON.stringify(entry));
  }
});

test("only a NEWER passing survey re-admits a visual pre-check block; other blocks stay", () => {
  const blocked = {
    "IB-EXT-050": { slug: "what-if-we-tried-to-drill-through-the-earth", reason: "visual pre-check: 3 licensed pictures/clips < 4", date: "2026-10-03T11:31:02.352Z" },
    "IB-HUM-025": { slug: "what-if-you-stopped-eating-for-a-year", reason: "visual pre-check: 0 licensed pictures/clips < 4", date: new Date().toISOString() },
    "IB-PHY-065": { slug: "what-if-you-could-touch-earths-core", reason: "growth pre-gate 61: below threshold", date: "2026-10-03T00:00:00Z" },
  };
  const measured = new Date(Date.now() - 3600000).toISOString();
  const channel = withState("impossible-brief", {
    "blocked.json": blocked,
    "visual-survey.json": survey({
      "IB-EXT-050": { measuredAt: measured, passesPrecheck: true, licensedStills: 6, licensedClips: 0 },
      "IB-HUM-025": { measuredAt: measured, passesPrecheck: true, licensedStills: 6, licensedClips: 0 },
      "IB-PHY-065": { measuredAt: measured, passesPrecheck: true, licensedStills: 6, licensedClips: 0 },
    }),
  });
  const used = Discovery.usedIds(channel);
  assert.equal(used.has("IB-EXT-050"), false, "survey after the block lifts it");
  assert.equal(used.has("IB-HUM-025"), true, "a block newer than the survey stays (the pre-check failed again)");
  assert.equal(used.has("IB-PHY-065"), true, "a readiness block is never lifted by a picture count");
  const disabled = withState("critical-thread", { "blocked.json": { "CT-1": { reason: "visual pre-check: 0 < 4", date: "2026-10-01T00:00:00Z" } }, "visual-survey.json": survey({ "CT-1": { measuredAt: measured, passesPrecheck: true } }) });
  assert.equal(Discovery.usedIds(disabled).has("CT-1"), true, "channels without the survey keep every block");
});

const row = (id, bucket, viral) => ({ topic: { id, slug: id.toLowerCase(), title: id, cluster: "SPACE" }, score: { bucket, ViralPotentialScore: viral, VideoPotentialScore: 85, SelectionScore: viral, reasons: [] } });

test("explore days without an explore candidate fall back to the best exploit topic instead of skipping", () => {
  const ib = Channel.getChannel("impossible-brief");
  const ranked = { rows: [row("IB-1", "A", 77), row("IB-2", "B", 80)], context: { clusterPerformance: {} } };
  let explore = 0;
  for (let d = 1; d <= 28; d += 1) {
    const date = `2026-11-${String(d).padStart(2, "0")}`;
    const result = Growth.selectShortTopic(ib, { ranked, date, write: false });
    assert.equal(result.selected.topic.id, "IB-1", date);
    if (result.mode === "EXPLORE") explore += 1;
  }
  assert.ok(explore > 0, "the window covers explore days");
  // Only B at the bar: nothing is selected on any day, and the reason carries the diagnosis (was a bare NO_EXPLORE_CANDIDATE).
  const onlyB = { rows: [row("IB-PHY-020", "B", 75), row("IB-HUM-039", "B", 75), row("IB-HUM-050", "A", 74)], context: { clusterPerformance: {} } };
  for (const date of ["2026-10-20", "2026-10-21"]) {
    const result = Growth.selectShortTopic(ib, { ranked: onlyB, date, write: false });
    assert.equal(result.selected, null);
    assert.match(result.reason, /best viral score 74 < minimum 75; 2 topic\(s\) at the minimum are bucket B/);
  }
});

test("qualified buffer counts selectable topics, not unused ones, and survey runs write nothing in dry-run", () => {
  const ib = Channel.getChannel("impossible-brief");
  const buffer = Inventory.qualifiedBuffer(ib);
  assert.ok(["critical", "warning", "ok"].includes(buffer.status));
  assert.equal(buffer.viralMinimum, 75);
  for (const n of buffer.next) assert.ok(n.viral >= 75 && n.bucket === "A");
  const channel = withState("impossible-brief", { "blocked.json": {}, "published.json": [] });
  const before = fs.readdirSync(channel.paths.state).sort();
  const original = Channel.getChannel;
  Channel.getChannel = (slug) => (slug === "impossible-brief" ? channel : original(slug));
  try {
    const report = require("../../scripts/growth/visual-survey").main(["--channel", "impossible-brief", "--limit", "2", "--dry-run"], {
      workDir: fs.mkdtempSync(path.join(os.tmpdir(), "ibbuf-work-")),
      shortfall: (topic, output, prepare) => { const assets = prepare(null, output); return assets.stills.length < 4 ? `${assets.stills.length} licensed pictures/clips < 4` : null; },
      prepare: () => ({ stills: [{ file: "a.jpg", licence: "CC BY-SA 4.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:a.jpg" }], clips: [] }),
    });
    assert.equal(report.surveyed, 2);
    assert.equal(report.passed, 0, "one picture does not pass the four-picture pre-check");
  } finally { Channel.getChannel = original; }
  assert.deepEqual(fs.readdirSync(channel.paths.state).sort(), before, "dry run writes no survey file");
});

test("survey candidates: source outages are retried, measured topics are not; a published topic is never re-admitted", () => {
  const now = new Date().toISOString();
  const top = require("../../scripts/growth/visual-survey").candidates(withState("impossible-brief", {}), { limit: 3 });
  assert.ok(top.length >= 2, "near-bar candidates exist");
  const [a, b] = top.map((r) => r.topic.id);
  const retry = require("../../scripts/growth/visual-survey").candidates(withState("impossible-brief", { "visual-survey.json": survey({
    [a]: { measuredAt: now, passesPrecheck: false, sourceError: "commons timeout" },
    [b]: { measuredAt: now, passesPrecheck: false, licensedStills: 1, licensedClips: 0, shortfall: "1 licensed pictures/clips < 4" },
  }) }), { limit: 50 }).map((r) => r.topic.id);
  assert.ok(retry.includes(a), "an outage entry is surveyed again");
  assert.ok(!retry.includes(b), "a fresh measurement is not repeated without --refresh");
  // published AND visually blocked, with a newer passing survey: still excluded (published.json wins)
  const raw = universe().find((t) => t.id === a);
  const channel = withState("impossible-brief", {
    "published.json": [{ topicId: a, slug: raw.slug }],
    "blocked.json": { [a]: { slug: raw.slug, reason: "visual pre-check: 2 licensed pictures/clips < 4", date: "2026-10-03T00:00:00Z" } },
    "visual-survey.json": survey({ [a]: { measuredAt: now, passesPrecheck: true, licensedStills: 6, licensedClips: 0 } }),
  });
  assert.equal(Discovery.usedIds(channel).has(a), true);
  assert.ok(!Inventory.qualifiedBuffer(channel).next.some((n) => n.id === a || n.slug === raw.slug));
});

test("topic buffer covers the legacy FR lane: its own ledgers exclude produced, published, failed, blocked and in-review slugs", () => {
  const fr = Channel.getChannel("failure-reconstructed");
  const used = new Set(Inventory.legacyUsed(fr));
  const ledger = (f) => JSON.parse(fs.readFileSync(path.join(fr.paths.state, f), "utf8"));
  for (const s of ledger("uretilenler.json")) assert.ok(used.has(s), s);
  for (const p of ledger("yayinlananlar.json")) if (p.slug) assert.ok(used.has(p.slug), p.slug);
  for (const s of Object.keys(ledger("inceleme.json"))) assert.ok(used.has(s), s);
  const buffer = Inventory.qualifiedBuffer(fr);
  assert.ok(["critical", "warning", "ok"].includes(buffer.status), buffer.reason);
  for (const n of buffer.next) { assert.ok(!used.has(n.slug), `${n.slug} is already used`); assert.ok(n.viral >= buffer.viralMinimum); }
  assert.ok(require("../../scripts/growth/topic-buffer").main.toString().length > 0);
});
