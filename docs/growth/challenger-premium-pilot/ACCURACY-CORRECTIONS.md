# Challenger premium: accuracy corrections (2026-10-14)

**Scope:** the Challenger shot plan (`channels/…/challenger-1986/plan/`).
- No video rendered except one scene-level comparison clip (S03–S07).
- No full render; nothing published; no paid API; no change to workflows, schedules, voice approvals or Cloudflare.
- No validation rule was weakened. Two rules were added (§2).

## 1. Findings and corrections

| # | Finding | Primary source | Correction |
|---|---|---|---|
| A | **SRB overall length** (V3 drew 45.6 m; no source recorded) | NASA NTRS 20120003006, T. D. Wood (NASA MSFC) et al., *Solid Rocket Booster (SRB) Flight System Integration at Its Best*: "Each SRB is 149.16 feet long, 12.17 feet in diameter and weighs ~1,300,000 pounds at launch." | Claims `C-srb-length` (149.16 ft = **45.46 m**) and `C-srb-diameter` (12.17 ft = 3.71 m) are verified. V3's 45.6 m was 0.14 m long. The reconstruction now uses the evidenced values. No citation was invented: the Commission report does not state this length, and the earlier NASA URL I tried (404) is not cited. |
| B | **O-ring gap exaggerated without disclosure** (scene B) | Rogers Vol. 1 Ch. IV: O-rings "0.280 inches (+0.005, -0.003)"; "gap opening increases of approximately 0.029 inches and 0.017 inches for the primary and secondary O-rings" (aft field joints) | The drawn gap is computed from the claims: squeeze 0.3 × follow 0.9 against 0.029 / 0.280, which is **×2.6**. It is declared and shown on screen ("GAP ×2.6"). The new S06 joint uses ×8, declared and shown ("GAP ×8", source line "gap ×8"). The validator now fails any template whose evidence-derived exaggeration is above 1.05 and undeclared, mismatched by more than 5%, or not visible. |
| C | **Tank reconstruction proportions not disclosed** (S09 source line had lost it) | — | The source line reads "Times: Rogers Commission, Vol. 1, Ch. III · proportions approximate". Booster rotation and offsets remain parameters flagged illustrative, which require that visible label. |
| D | **Chronology times shown as exact** | Rogers Ch. V chronology ("Approximately 8:45 PM", "Approximately 11:00 PM (EST)", "Approximately 11:45 PM (EST)") | The stamps read "~8:45 PM", "~11:00 PM", "~11:45 PM"; launch "11:38 AM" is exact in Ch. III. A new validator rule: an approximate claim shown with a number must carry ~ / about / approx. / est. The event clock also shows "· APPROX." while the latest event is approximate ("about 72.20 seconds"). |
| E | **S07 running clock without a time base** (V2/V3 ran 2.7 → 58 s over the climb film) | NASA STI video caption: "Launch of Challenger (STS-51-L) and breakup. Video starts at T-10 seconds." | The clock is rebuilt on that time base. The clip is 29.5–33.0 s into the video, so it now reads **T+19.5 → T+22.3 s · APPROX.** **V3's 2.7 → 58 s clock was wrong**: it implied the climb footage ran up to the flame time. It is removed. |

**Also confirmed while extracting evidence:**
- The strut time is "about 72.20 seconds" in the narrative (the table's 72.204 is the start of divergent yaw rates). It is stored as approximate.
- The breakup photo caption says "about 76 seconds".

## 2. Validator rules added (none relaxed)

1. **Approximation marker.** Any approximate claim displayed with a number (placeholder, rail tick or timeline tick) must carry ~, ≈, about, approx., est. or estimated.
2. **Exaggeration from evidence.**
   - **Declaration:** a template that can compute its exaggeration (`joint-section` from squeeze × follow and the gap/ring claims; `joint-mechanism` from its factor) must declare it when it is above ×1.05.
   - **Match:** the declared factor must match the evidence within 5%.
   - **Visibility:** the factor must appear on screen ("×{scale}").
   - **Missing evidence:** a template that cannot derive its scale from evidence fails.

**Also tightened during this work:**
- A claim's value must appear in its passage, independently of its display text; a "value as written" form is allowed (e.g. "27 1/2", "T-10").
- Identifiers exempt from the on-screen-number rule must be whole letter-and-digit tokens from the asset's own label or title (bare numbers are never exempt).
- Citation locators include "Figure 14".

## 3. Status

`node scripts/fr-premium/engine/validate.js channels/failure-reconstructed/premium/challenger-1986/plan/shot-plan.json` → **VALID (0 errors, 0 warnings)**. That is 38 claims from 12 sources (all verified), 10 public-domain assets and 21 anchors.

**Still open (not accuracy errors, but disclosed approximations):**
- the ring recovery rates;
- squeeze 0.3;
- booster rotation 5°;
- booster offset 6.3 m;
- plume shape.

All are labelled illustrative or approximate on screen.

## 4. Round 2 audit (2026-10-14): time bases and geometry

| Item | Finding | Correction |
|---|---|---|
| **S07 film clock** | The time base "Video starts at T-10 seconds" (NASA caption) is **insufficient**. The video is an **edited compilation**: camera changes at about 3, 12, 16, 18 and 27 s (checked frame by frame). The 29.5–33.0 s excerpt cannot be mapped to mission time. | **No mission clock** on S07. `assets.json` records `climb.timeline.edited = true` with no verified segment. A new validator gate fails any film clock unless the asset lists a verified continuous segment covering the excerpt with that time base. The previous round's "T+19.5 → 22.3 s · APPROX." is withdrawn. |
| **S08 E-207 stamp** | No documented time code for the excerpt, so "FIRST FLAME T+58.788" could read as the time of the frame shown | Relabelled **"FIRST FLAME · DOCUMENTED TIME"**: the event's documented time, not a frame clock. `e207.timeline` notes that no running clock may be shown. |
| **S06 geometry** | The view now extends over the clevis pin (Fig. 14 "Clevis Pin", measured: x 158–261, y 411–470) | New measured anchor `clevis-pin`. All S06 parts come from Fig. 14 anchors; the gap stays a declared ×8. |
| **S06 blow-by timing** | Gas now starts escaping shortly after the joint opens | Grounded in E1 (smoke at the joint at 0.678 s): the lead-in starts 0.7 s after "ignition" and cites C-smoke-0678. |
| **S06 combustion side** | Pressure glow and arrows on the inside | Ch. IV: the gap "opens as the combustion gas pressure rises". The arrows are illustrative, inside a declared explanatory animation. |
| **V3 narration L6** ("Then the smoke stopped, and Challenger flew on.") | **No claim** in evidence.json supports it (found by the planner) | Open: needs a verified passage (E1 describes the smoke puffs ending) or a rewrite before production. |

## 5. Round 3 (2026-10-15): estimate shown as exact

| Item | Finding | Correction |
|---|---|---|
| **S05 cold panel "28°F"** | `C-joint-28f` is a calculated estimate ("28°F est."). The panel label used the bare value (`{C-joint-28f.value}°F`), and the approximation gate accepted it because the display carried the marker. V2/V3 show "28°F" without "est." | The gate now checks the number actually shown. The label is now `{C-joint-28f}` (shown as "28°F est."), and the planner uses the display for approximate panel temperatures. V2/V3 are not re-rendered. |
