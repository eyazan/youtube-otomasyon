# Failure Reconstructed: premium engineering visual system (design spec, 2026-10-13)

**Specification only:** nothing is implemented or rendered yet.

**It answers the owner's V3 findings:**
1. flat engineering animation;
2. archival vs reconstruction inconsistency;
3. small documentary text on mobile.

**Scope:** the O-ring and field-joint mechanism first (V3 scenes B and S06), then the pattern for other mechanisms.

## 1. Principles

1. **The evidence drawing is the master geometry.**
   - Mechanism shapes are traced from the cited technical drawing (here Rogers Fig. 14), not drawn freehand.
   - Proportions are true unless an exaggeration is declared and shown on screen.
2. **Realism serves readability, not spectacle.**
   - Material, light and depth make parts distinguishable at phone size: steel vs rubber vs putty, cut face vs surface.
   - Nothing is added that the evidence does not support.
3. **The reconstruction stays visibly a reconstruction.**
   - It is harmonised with the archival media (tone, black level, light direction), but **never given film grain, scratches, gate weave or other archival artifacts** that would make it pass as footage.
   - The provenance chip remains on screen.
4. **One component, many shots.** The warm/cold comparison (B) and the joint rotation and blow-by (S06) come from the same `JointSection` component, so they look like one object.

## 2. Evidence-grounded geometry (O-ring joint)

| Quantity | Value | Source |
|---|---|---|
| O-ring cross-section diameter | 0.280 in (+0.005, −0.003) | Rogers Vol. 1 Ch. IV |
| Number of O-rings per field joint | 2 (primary, secondary) | Ch. IV; Fig. 14 |
| Tang-to-clevis gap at assembly | ≤ 0.008 in (Finding 5c); 0.004 in case discussed (5d) | Ch. IV |
| Gap when the joint opens at ignition | up to 0.017–0.029 in (Finding 8) | Ch. IV |
| Opening timing | begins at ignition; maximum rate at about 200–300 ms; essentially complete at 600 ms (8a) | Ch. IV |
| Joint O-ring temperature at launch (right SRB aft joint) | about 28°F ±5°F, estimated (6a) | Ch. IV |
| Part layout (tang, clevis, pin, putty, insulation, O-ring grooves) | Fig. 14 | Rogers Vol. 1 Fig. 14 |

**Consequence for the drawing:** the open gap is only about 6–10% of the ring's diameter.

**Two display modes:**

| Mode | Use | Rule |
|---|---|---|
| **True scale** | the default establishing view of the section | the gap is drawn to scale; a **magnifier inset** (circle, 4–6×) shows the ring and gap |
| **Declared exaggeration** | the mechanism close-up when true scale is unreadable | the on-screen label always states the factor ("gap ×8"); the factor sits in the shot plan with its justification |

V3's B uses an unlabelled exaggeration. Under this spec it becomes a declared-exaggeration shot.

## 3. Materials, light and depth (deterministic, in-browser)

Everything stays a pure function of time in Chromium (SVG + CSS filters, or Canvas2D where needed), so renders remain reproducible. No WebGL is needed for v1.

| Element | Treatment | Why |
|---|---|---|
| Steel case and tang/clevis surfaces | brushed metal: linear base gradient, fixed-seed anisotropic noise (`feTurbulence` stretched along the case axis), one specular band from the key light | reads as machined steel; the band moves only with the camera, so it shows depth during moves |
| **Cut faces** (the section plane) | the **same 45° hatch as Fig. 14**, rendered crisp over a flat mid-grey | engineering convention, and a direct visual link to the archival drawing the viewer has just seen (continuity) |
| O-ring rubber | matte near-black, soft rim light (subsurface-like), contact shading darker where compressed | separates rubber from steel at 360 px width; compression is visible as shape plus shading |
| Cold state | **no blue tint on the rubber.** Cold is shown by behaviour (slower recovery) plus a frost pattern only on the exterior surfaces exposed to air | avoids implying the rubber changes colour |
| Putty, insulation | neutral, desaturated fills named by label (colours are not documented in the evidence used) | no invented colour claims |
| Hot gas | emissive gradient with soft bloom confined to the gas path; particles move along the actual gap geometry | cause and effect: gas goes where the gap is |
| Ambient occlusion | blurred inner shadows in grooves and at contact lines | depth without fake perspective |
| Depth | **2.5D cut-away:** the section plane plus a short oblique extrusion of the case wall (about 8° projection) showing its curvature | communicates "this is a slice through a cylinder" |

**Key light:**
- One fixed direction per film, **matched to the archival hero photo**: highlight direction measured on GPN-2000-001347 (sun on the booster) and stored in the film's style data.
- Reconstructions use the same direction, so photo → trace → section reads as one lit object.

**Performance budget:**
- ≤ 0.6 s per frame at 1080×1920. The current scenes run 0.1–0.4 s.
- Filters are cached per layer, and static texture layers are pre-rendered once per shot.

## 4. Continuity with archival media

| Rule | How |
|---|---|
| Tone match | sample the adjacent archival shot (black level, mid-tone, highlight roll-off, colour temperature) and apply a matching tone curve to the reconstruction; no texture changes |
| Light match | key-light direction from the hero photo (§3) |
| Registered hand-offs | as in A and C: trace over the photo at measured anchors → section; film flame point and angle → reconstruction |
| Line language | trace lines use the same weight and colour as the Fig. 14 linework where the drawing is shown |
| Never | grain, scratches, flicker, vignette pulses, lens flares, camera shake, fake film borders on reconstructions |

## 5. Mobile typography (raises the V3 floor)

| Tier | Size at 1080 px | Use |
|---|---|---|
| Captions | 62 px (existing) | narration |
| Display | 72–112 px | one per shot, ≤ 4 words (temperatures, time stamp, one finding) |
| Labels | **≥ 36 px** (was 24–44) | ≤ 3 at once, attached by leader lines |
| Source lines | **≥ 30 px** (was 24), ≤ 6 words, in the dark band under the captions | provenance |

The text-QA hard gate keeps its thresholds. These floors are added as WARN checks in `creative_qa.py` first.

## 6. Camera and composition rules (shared by every engineering shot)

1. **One focal point per shot,** inside y 300–1290 (above the caption band) and x 64–950 (clear of the right-side UI).
2. **Presets:**
   - **establish:** whole part, true scale;
   - **mechanism:** joint or groove at 1.5–2.5×;
   - **detail:** magnifier inset or declared exaggeration.
3. **Camera moves only along the cause path** (along the gap, the gas path, the load path), with one ease profile per film. No moves without a narration-timed state change.
4. **The orthographic section** is the default; the 2.5D extrusion is used only in establishing views.

## 7. The first component: `JointSection` (O-ring mechanism)

**Inputs** (scene parameters in the shot plan, never code):

```json
{
  "template": "joint-section",
  "geometry": { "trace": "evidence/fig14-trace.json", "evidence": "E2:Fig14" },
  "scale": { "mode": "declared-exaggeration", "gapFactor": 8, "why": "true 0.029 in gap is 10% of the ring" },
  "rings": [{ "id": "primary", "temperatureF": 28, "label": "28°F est.", "evidence": "E2:F6a",
              "recovery": { "model": "first-order", "tauSec": 4.0, "status": "illustrative" } }],
  "comparison": { "id": "warm", "temperatureF": 75, "label": "75°F test", "evidence": "E2:Ch4-tests", "recovery": { "tauSec": 0.06, "status": "illustrative" } },
  "gap": { "profile": "evidence-rate", "maxRateAtSec": 0.25, "completeAtSec": 0.6, "evidence": "E2:F8a" },
  "gas": { "enabled": true, "startAt": "word:L4:slowly" },
  "view": { "preset": "mechanism", "magnifier": false, "lightFrom": "film-style.keyLight" },
  "labels": [{ "text": "GAP", "anchor": "gap.cold", "at": "state:gap-open" }]
}
```

**States emitted for QA:** `face-moves`, `warm-follows`, `cold-lags`, `gap-open`, `gas-through`. Each is timed and cites evidence.

**Variants needed for the second and later FR topics:**
- seal or gasket (this component);
- bolted or pinned connection under load (load-path arrows, deformation scale declared);
- weld or crack growth;
- valve or orifice flow.

All share the material, light and label system above.

## 8. Acceptance criteria (measurable)

| Criterion | Measure |
|---|---|
| Geometry is traced from a cited drawing | plan `geometry.evidence` present; trace file checksum recorded |
| Exaggeration is always declared | `scale.mode` is true-scale or has `gapFactor` **and** the factor label is visible in text inspection |
| Material separation | luminance contrast between rubber and steel ≥ 3:1 at 360 px width (sampled from the render) |
| Continuity grade | mean-luma and black-level difference to the adjacent archival shot within ±10%; no archival-artifact filters in the plan |
| Mobile type floors | labels ≥ 36 px, source lines ≥ 30 px (WARN first) |
| Existing gates | all hard technical and text gates pass; `creative_qa.py`: empty ≤ 35%, subject motion ≥ 0.25, states verified |
| Owner review | side-by-side with V3's shot at phone size; owner scores ≥ 4/5 |

## 9. Effort

| Step | Estimate |
|---|---|
| Fig. 14 vector trace and trace format | 1–2 days |
| Material and light layer (shared library: brushed steel, hatch cut face, rubber, AO, key light) | 3–4 days |
| `JointSection` with both scale modes, states and labels | 3–4 days |
| Continuity grade (tone match) + QA checks (contrast, floors, exaggeration label) | 2 days |
| Scene-only prototypes of B and S06 for owner review (no full render) | 1 day |
| **Total** | **about 2–2.5 weeks** |
