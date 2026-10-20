---
name: motion-design
description: Build or reuse code-driven, deterministic motion graphics for the BTO premium studio - easing, closed-form springs, kinetic typography, labels, transitions, diagrams - as reusable data-driven components in scripts/bto-studio/page. Use when a storyboard needs an animation the component library lacks, or when motion looks mechanical.
allowed-tools: Read Grep Glob Edit Write Bash(node scripts/bto-studio/*) Bash(BTO_PREMIUM_RENDER=preview node scripts/bto-studio/*) Bash(node --test tests/js/bto-studio.test.js)
---

# Motion Design Engine

The runtime is `scripts/bto-studio/page/motion.js`; components live in `scripts/bto-studio/page/components/`. One engine serves all videos.

## Laws (determinism)
- Every frame is a pure function of `t`: no CSS animation, `Date`, `requestAnimationFrame` or unseeded `Math.random` (use `BTO.rng(seed)`).
- Time comes from anchors (`BTO.at`). Never hard-code seconds that should follow a spoken word.
- Motion vocabulary from `motion.js`:
  - `BTO.ep(t, a, b, "standard"|"decelerate"|"accelerate"|"inOut"|"camera")`: CSS-equivalent cubic-bézier;
  - `BTO.sp(t, t0, "snap"|"settle"|"soft")`: closed-form damped spring, seekable;
  - `BTO.keys(t, [[t, v], ...])`: piecewise keys;
  - `BTO.draw(path, k)`: stroke draw-on;
  - `BTO.label(...)`: leader label;
  - `BTO.enter(...)`: spring entrance.
- Components emit their own sound cues with `BTO.cue(t, kind, gain, pan)` at the moment their motion happens. That is how audio stays synchronised.

## Environments and transitions
- Scene `env`: `desk | spot | paper | amber | teal | scanner` (+ `envShift` to change mid-scene). Alternate light and dark; do not keep one background for the whole Short.
- Transitions: `continuity`, `match-zoom`, `push`, `scan-wipe` (`color`), `iris`, `square-iris`, `decode-flash`, `whip`, `dissolve`. Each must be motivated by the story (decode → flash, a square opening → square-iris, widening survey → whip).

## Making a component
```js
BTO.def("my-component", (props, scene, BTO) => {
  // resolve geometry once; register cues once
  return { draw: (t, view) => "<g>...</g>" };   // SVG in world space (or screen space with layer.screen)
});
```
- Props are structured data. Time keys ending in `At`, `at`, `from` or `to`, and the first element of `...Keys` pairs, are resolved to seconds automatically.
- No topic-specific names: a "matrix code", not a "QR for video 301".
- Publish geometry other components need in `BTO.geo[id]`, and measurements in `BTO.runsFrom[id]`.
- Add the component name to the docs table in `docs/premium-studio/components.md`, then run the tests.

## Craft
- Entrances: `settle` springs, staggered 50–120 ms. Exits are faster than entrances. Camera moves use `camera` easing and 0.8–1.2 s.
- Avoid idle wobble, floating particles, constant zoom-pulses and identical transitions. Every motion should point at the explanation.
- Check motion with `--stills` at the beat times, then with the contact sheet.
