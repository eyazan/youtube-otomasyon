"use strict";
// ImpossibleBrief animation potential (core/growth/animation-potential.js forImpossibleBrief): credit only for what the
// automatic storyboard really draws for the topic's own mechanism. Analysis only: IB production scoring is unchanged.
const test = require("node:test");
const assert = require("node:assert");
const Anim = require("../../core/growth/animation-potential");
const Config = require("../../core/growth/config");
const Channel = require("../../core/channel-context");
const ib = (id) => Anim.animationPotential({ channel: "impossible-brief", id });

test("a surface eruption is not a cutaway: Mount St. Helens lateral blast and Laki fluorine gas earn no animation credit", () => {
  for (const id of ["IB-EAR-086", "IB-EAR-096"]) { const a = ib(id); assert.equal(a.score, 0, id); assert.equal(a.drawable, false); assert.ok(a.reasons.some((r) => /surface eruption/.test(r)), a.reasons.join("; ")); }
});

test("drawings the engine gets wrong score 0: one silhouette (IB-HUM-004), a spin drawn as an orbit (IB-EXT-047), Earth for Io", () => {
  assert.equal(ib("IB-HUM-004").score, 0);
  assert.ok(ib("IB-EXT-047").reasons.some((r) => /spin drawn as an orbit/.test(r)));
  assert.ok(ib("IB-SPA-061").reasons.some((r) => /another body/.test(r)));
  assert.equal(ib("IB-FUT-045").score, 0, "superconductors are not an ocean current");
});

test("worlds whose real MP4 misshowed the mechanism earn nothing: current (EAR-071), lake (EAR-066), micro (HUM-050)", () => {
  for (const id of ["IB-EAR-071", "IB-EAR-066", "IB-HUM-050"]) { const a = ib(id); assert.equal(a.score, 0, id); assert.ok(a.reasons.some((r) => /review render/.test(r)), a.reasons.join("; ")); }
});

test("worlds whose real MP4 showed the mechanism earn credit (magnetic field, cutaway)", () => {
  for (const [id, w] of [["IB-EAR-019", "magnetic"], ["IB-PHY-065", "earth-interior"]]) {
    const a = ib(id); assert.equal(a.world, w, id); assert.ok(a.score >= 70, `${id} ${a.score}`); assert.equal(a.drawable, true);
  }
});

test("production: ImpossibleBrief scoring does not use the animation signal until the owner approves it", () => {
  const cfg = Config.forChannel(Channel.getChannel("impossible-brief"));
  assert.notEqual((cfg.visuals || {}).source, "animation");
});
