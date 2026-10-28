# BTO Premium Studio: component library and style pack

**Runtime:** `scripts/bto-studio/page/motion.js`. **Components:** `scripts/bto-studio/page/components/`. **Style pack:** `channels/behind-the-ordinary/premium/style-pack.json`.

Every component is configured only through storyboard `props` (structured data) and is a pure function of time. Time props are word anchors resolved from the measured narration.

## Runtime capabilities (`motion.js`)

| Capability | API |
|---|---|
| CSS-equivalent cubic-bézier easing (named curves in the style pack) | `BTO.bezier`, `BTO.ease`, `BTO.ep` |
| Closed-form damped spring (under-, critically and over-damped; seekable) | `BTO.spring`, `BTO.sp(t, t0, "snap"/"settle"/"soft")` |
| Piecewise keyframes | `BTO.keys(t, [[t, v, ease?], ...])` |
| Word/line time anchors | `BTO.at("L3:QR#2.end+0.1")` |
| Seeded randomness | `BTO.rng(seed)` |
| 2D camera with per-layer parallax depth | scene `camera: [{at, x, y, z, r}]`, layer `depth` |
| Transitions | `cut`, `continuity`, `dissolve`, `match-zoom`, `push`, `scan-wipe` (colour), `iris`, `square-iris`, `decode-flash`, `whip` (motion blur) |
| Scene environments | `env`: `desk`, `spot`, `paper`, `amber`, `teal`, `scanner`; `envShift` mid-scene |
| 2.5D projection | `BTO.projector({cx, cy, rx, rz, D, s})`: perspective-correct planes |
| Word-highlighted captions with `captionsOff` windows | automatic |
| Provenance chips, handle | scene `chips` |
| Draw-on strokes, leader labels, spring entrances | `BTO.draw`, `BTO.label`, `BTO.enter` |
| Sound cues emitted where motion happens | `BTO.cue(t, kind, gain, pan)` |
| Text inspection for QA | `BTO.inspectText()` |

## Components (built)

| Component | File | Category | Purpose |
|---|---|---|---|
| `qr-3d` | projection.js | Technical / 2.5D | Real matrix code on a perspective plane: peel-off physics, assemble from any origin, read sweep, physically lifted exploded finder with side walls and pill labels, locks, links, ghost corner, exact in-plane rotation |
| `row-signal` | projection.js | Scientific / sensor view | The scanner's view: exact run lengths of real matrix rows and exact 1:1:3:1:1 detection |
| `football-pitch` | football.js | GoalLore Lab | IFAB Law 1 pitch in true proportion, perspective tactics camera, player tokens on runs, passes, parabolic ball flights with shadows |
| `qr-symbol` | matrix-code.js | Everyday-object explainer | Exact matrix code from data. Dissolve, assemble (radial from any origin), read sweep, finder highlight, lock brackets, links, ghost corner, exploded finder, rotation keys. Publishes geometry and run lengths. |
| `exploded-layers` / `BTO.isoStack` | core.js | Mechanical explainer | Planar layers lift into an isometric stack and collapse (layer separation, cross-section reveal) |
| `scan-line` | core.js | Scientific / optical | Reading line: passes, hold, tracking a moving feature, hit flashes |
| `run-length-strip` | core.js | Data chart / measurement | Black/white runs along a line, with ratio labels; static or live from geometry |
| `search-window` | core.js | Technical annotation | Template reticle visits candidates with accept/reject verdicts |
| `print-surface` | core.js | Everyday object / packaging | Procedural printed matter: box, flyer, magazine, form, label (greeked text) |
| `paper-card` | core.js | Base | Paper card with shadow and spring entrance |
| `kinetic-type` | core.js | Motion graphics | Rise (per-word spring), type-on, pop, expand-from-initials |
| `labels` | core.js | Motion graphics | Leader-line callouts that draw on |
| `quote-card` | core.js | Motion graphics | Verbatim attributed quote with a spoken-word underline |
| `timeline-ruler` | core.js | Timeline transition | Year ruler that scrolls and spring-lands on a year |
| `reticle` | core.js | Everyday object (camera) | Phone-camera viewfinder framing |
| `desk-grain` | core.js | Style | Seeded paper/desk grain |

## Planned (build when a production needs them; generic props)

| Component | For topics like |
|---|---|
| `gear-train` | Locks, clocks, can openers (meshing ratio from props) |
| `flow-field` | Airflow, plumbing traps, aircraft-window breather holes (streamline particles along a defined path, not random floaters) |
| `pressure-vessel` | Aerosol cans, pressure cookers |
| `heat-map` | Heat transfer (mugs, oven doors) |
| `circuit-path` | Switches, buttons, chargers (current-flow dashes along wires) |
| `field-lines` | Magnets, induction |
| `force-arrows` | Elevators, door closers, levers |
| `optical-path` | Cat's eyes, reflectors, lenses (ray tracing with real angles from props) |
| `compare-split` | Before/after, with/without |
| `bar-compare` | Data charts from evidenced numbers only |

## Style pack summary

- **Concept:** printed matter on a warm desk under one lamp. The hidden logic is drawn in amber "technical pencil".
- **Palette:** desk `#15130f`, paper `#f3ead8`, amber `#f2ad45`, teal `#4eb3a5`, coral `#e56b5d`.
- **Type:** Inter for labels, Source Serif 4 for quotes, Barlow Semi Condensed for numbers. All OFL and embedded.
- **Motion tokens:** 5 easing curves, 3 springs, duration scale.
- **Zones:** safe area, caption band, Shorts UI zones.
- **Rules:** no repeated transition in a row, ≤ 1 dissolve, label length, minimum text size, provenance chips.

It is deliberately distinct from Failure Reconstructed (cold blueprint, forensic chips).
