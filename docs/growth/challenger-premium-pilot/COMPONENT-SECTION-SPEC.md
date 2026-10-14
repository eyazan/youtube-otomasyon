# Template spec: `component-section` (before implementation, 2026-10-14)

**Why:** Apollo 13's mechanism (L5) has no template. The planner reports NO_TEMPLATE, and no existing template may be bent to fit it. This is the spec; nothing is implemented.

## Purpose

A cutaway of one component, drawn from a **measured technical drawing**, showing internal parts and how a **documented state change** moves through them. For Apollo 13 the component is the oxygen tank. The template is generic: tanks, valves, batteries, housings.

## Inputs (all from evidence and assets, nothing invented)

| Parameter | Kind | Source rule |
|---|---|---|
| `drawing` | asset (tag `drawing`) | a public-domain technical figure. The Review Board report's tank figure (its fig. 4-2, cited in the text: "As noted earlier in this chapter, and shown in figure 4-2, each heater is protected with a thermostatic switch") must be located as a scan; `tank-diagram` (394 px) is too small |
| `parts` | anchors (role `mechanism-part`, rect or polygon) | measured on the drawing: tank shell, heater tube, thermostatic switches, fan motors, wiring run, quantity probe. Each has a `label` |
| `states` | list of {part, from claim, at word} | e.g. heater **on** (C-a13-heaters-65v), switch **fails to open** (C-a13-switch-rating, C-a13-switch-80f), tube **about 1000°F** (C-a13-1000f, approximate, so "about"), insulation **damaged** (C-a13-teflon), later **fire** (C-a13-cause) |
| `temperature` | claim (role temperature) | drives a heat tint on the named part only; the scale says "approximate" when the claim is approximate |
| `scale` | `true-scale` or `declared-exaggeration` | any enlarged part shows its factor; wiring thickness is illustrative and labelled |
| `view`, `push` | camera preset `mechanismCloseUp` on the union of `parts` | generated |
| `labels` | anchor labels only | at most 3 at once, at least 36 px |

## Rendering (shares the Engineering Visual System)

- **Materials:** metal shell, brushed with a cut face hatched like the source drawing. Wiring is drawn as insulated conductors whose insulation visibly darkens and cracks *only* after the C-a13-teflon state.
- **Light and continuity:** one key light. The scan is registered under the model and dissolves into it (as in `joint-mechanism`).
- **Heat:** a heat tint on the heater tube, rising over the documented 8-hour period compressed in time and labelled ("8 h, compressed").
- **Switch:** contacts shown welded or closed. The board says the switches "could not open properly", so they are not drawn opening and re-closing.
- **No explosion and no flame** before the board's fire finding, and nothing drawn beyond "electrically initiated fire … tank no. 2".

## QA expectations

- **States:** at least 3 narration-timed states, each citing its claim.
- **Validator:** factual parameters are claims; on-screen numbers come from claims; approximate claims carry "about"; exaggeration is declared.
- **Mobile:** labels of at least 36 px, inside the safe zone.
- **Creative QA:** subject motion of at least 0.25 and empty background of at most 35%, both measured from the scene-level render.

## Effort

| Item | Estimate |
|---|---|
| Template and component | 4–6 days |
| Locating and measuring the board's tank figure | about 1–2 h (human) |
| Scene-level prototype and review | 1 day |
