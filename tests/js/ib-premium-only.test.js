"use strict";
// ImpossibleBrief publishes premium Shorts only (config premiumOnlyUploads): no path - scheduler, SLA watchdog recovery,
// manual dispatch with engine=legacy, a local call - may upload a legacy render to its channel.
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const cp = require("child_process");
const crypto = require("crypto");
const ROOT = path.join(__dirname, "..", "..");
const Channel = require("../../core/channel-context");

const ib = Channel.getChannel("impossible-brief");
const upload = (slug) => cp.spawnSync(process.execPath, [path.join(ROOT, "youtube-yukle.js"), "--channel", "impossible-brief", slug],
  { cwd: ROOT, encoding: "utf8", env: { PATH: process.env.PATH, HOME: process.env.HOME }, timeout: 60000 });

test("config: ImpossibleBrief is premium-only", () => {
  assert.equal(ib.config.premiumOnlyUploads, true);
});

test("uploader refuses an ImpossibleBrief MP4 the premium publish path did not stage, before any API call", (t) => {
  const slug = `zz-premium-only-test-${process.pid}`; const base = path.join(ib.paths.production, slug);
  t.after(() => fs.rmSync(base, { recursive: true, force: true }));
  fs.mkdirSync(path.join(base, "Videos"), { recursive: true });
  fs.writeFileSync(path.join(base, "konu.json"), JSON.stringify({ channel: "impossible-brief", slug, format: "short" }));
  fs.writeFileSync(path.join(base, "Videos", `${slug}.mp4`), "legacy render bytes");
  let r = upload(slug);
  assert.equal(r.status, 17, r.stderr); assert.match(r.stderr, /LEGACY_UPLOAD_REFUSED/); assert.match(r.stderr, /was not staged/);
  // a marker for different media (the folder's MP4 was replaced after staging) is refused too
  fs.writeFileSync(path.join(base, "PREMIUM-STAGED.json"), JSON.stringify({ topicId: "IB-X", mediaSha256: crypto.createHash("sha256").update("other").digest("hex") }));
  r = upload(slug);
  assert.equal(r.status, 17, r.stderr); assert.match(r.stderr, /does not match the staged media/);
});

test("legacy IB lane never uploads with PUBLISH=1, so the SLA watchdog recovery cannot upload a legacy render", () => {
  const lane = fs.readFileSync(path.join(ROOT, "core", "pipeline", "impossible-brief.js"), "utf8");
  assert.match(lane, /if \(channel\.config\.premiumOnlyUploads && process\.env\.PUBLISH === "1"\) \{\n[^\n]*LEGACY_UPLOAD_RETIRED[^\n]*\n +run\.outcome\("BLOCKED", why\);[^\n]*return 0;/);
  // the guard sits after the premium publish hook (which may take the day) and before any topic is selected or rendered
  assert.ok(lane.indexOf("premium-publish\").run(channel") < lane.indexOf("LEGACY_UPLOAD_RETIRED") && lane.indexOf("LEGACY_UPLOAD_RETIRED") < lane.indexOf("Discovery.universe(channel)"));
  // the SLA watchdog's IB recovery runs this legacy lane with PUBLISH=1 and never receives the premium variables (only the
  // production workflow passes them, tests/js/premium-publish.test.js): with the guard it can no longer upload anything
  const wd = fs.readFileSync(path.join(ROOT, ".github", "workflows", "production-watchdog.yml"), "utf8");
  const job = wd.slice(wd.indexOf("  ib-recovery:"), wd.indexOf("Commit isolated ImpossibleBrief state"));
  assert.match(job, /PUBLISH: '1'/); assert.match(job, /node shorts-sira\.js --channel impossible-brief/); assert.doesNotMatch(job, /_PREMIUM_(PRIMARY|PUBLISH)/);
});
