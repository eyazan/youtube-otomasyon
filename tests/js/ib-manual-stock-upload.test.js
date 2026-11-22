"use strict";
// Last-chance stock test (docs/plans/2026-11-15-kanal-toparlama-tasarim.md, Faz 1): ImpossibleBrief stays premium-only,
// with ONE exception — a manual dispatch that names a topic and is not a dry run may upload that one stock render.
// The scheduler and the SLA watchdog recovery never set the exception, so they still cannot upload a legacy render.
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const cp = require("child_process");
const ROOT = path.join(__dirname, "..", "..");
const Channel = require("../../core/channel-context");
const ib = Channel.getChannel("impossible-brief");

const upload = (slug, extra = {}) => cp.spawnSync(process.execPath, [path.join(ROOT, "youtube-yukle.js"), "--channel", "impossible-brief", slug],
  { cwd: ROOT, encoding: "utf8", env: { PATH: process.env.PATH, HOME: process.env.HOME, ...extra }, timeout: 60000 });

test("uploader lets through only the stock MP4 of the manually named topic", (t) => {
  const slug = `zz-manual-stock-test-${process.pid}`; const base = path.join(ib.paths.production, slug);
  t.after(() => fs.rmSync(base, { recursive: true, force: true }));
  fs.mkdirSync(path.join(base, "Videos"), { recursive: true });
  fs.writeFileSync(path.join(base, "konu.json"), JSON.stringify({ channel: "impossible-brief", slug, format: "short" }));
  fs.writeFileSync(path.join(base, "Videos", `${slug}.mp4`), "stock render bytes");
  let r = upload(slug, { IB_MANUAL_STOCK_SLUG: "some-other-topic" });
  assert.equal(r.status, 17, r.stderr); assert.match(r.stderr, /LEGACY_UPLOAD_REFUSED/);
  r = upload(slug, { IB_MANUAL_STOCK_SLUG: slug });
  assert.notEqual(r.status, 17, r.stderr); assert.doesNotMatch(r.stderr, /LEGACY_UPLOAD_REFUSED/);
});

test("pipeline: the premium-only guard is lifted only for a named topic with IB_MANUAL_STOCK_UPLOAD=1", () => {
  const lane = fs.readFileSync(path.join(ROOT, "core", "pipeline", "impossible-brief.js"), "utf8");
  assert.match(lane, /const manualStock = !!explicit && process\.env\.IB_MANUAL_STOCK_UPLOAD === "1";/);
  assert.match(lane, /if \(channel\.config\.premiumOnlyUploads && process\.env\.PUBLISH === "1" && !manualStock\) \{/);
  // the uploader is told which single slug it may take
  assert.match(lane, /\.\.\.\(manualStock \? \{ IB_MANUAL_STOCK_SLUG: topic\.slug \} : \{\}\)/);
});

test("workflow: only a manual, named-topic, non-dry run sets the exception; the watchdog never does", () => {
  const wf = fs.readFileSync(path.join(ROOT, ".github", "workflows", "portfolio-production.yml"), "utf8");
  const step = wf.slice(wf.indexOf("- name: ImpossibleBrief Short"), wf.indexOf("# GoalLore Lab: premium-only lane"));
  assert.match(step, /IB_MANUAL_STOCK_UPLOAD: \$\{\{ github\.event_name == 'workflow_dispatch' && inputs\.topic != '' && inputs\.engine == 'legacy' && !inputs\.dry_run && '1' \|\| '' \}\}/);
  assert.doesNotMatch(fs.readFileSync(path.join(ROOT, ".github", "workflows", "production-watchdog.yml"), "utf8"), /IB_MANUAL_STOCK/);
});
