# BTO-301 revision history: "Why QR Codes Have Three Corner Squares"

Every pass was rendered, measured by `scripts/bto-studio/qa.js` and inspected visually (contact sheet + scene sheet read as images in this session). Archives are in `out/revisions/<pass>/`: MP4, contact sheet, scene sheet and QA report.

Narration for every pass: the Kokoro `af_heart` preview fallback, because the approved Edge voice host was blocked from this container. See §Open items.

## Pre-render (stills only, before v1)

Two stills sheets were made before the first full render.

| Found | Fixed |
|---|---|
| Kokoro read "1994" as "nineteen hundred ninety four" | Spoken-form rewrite of years in the TTS text only. Captions keep "1994". |
| `*Keys` anchors (rotation, card and finder fades) were never resolved: S7 did not rotate and finders popped in | `BTO.resolve` resolves `[time, value]` pairs; the validator checks them. |
| "DENSOWAVE": word widths ignored letter-spacing | `BTO.measure(..., ls)` |
| Captions illegible over cream paper | Caption box backdrop |
| Ghost corner painted paper over real data modules in the full code (misleading) | `ghostCorner.fill: false` when the data is visible |
| Headline collided with the chips; the S7 ratio strip overlapped the code | Positions moved |

## v1 (first full preview): objective FAIL

**Objective:**

| Check | Result |
|---|---|
| Text gate | 15 FAIL: "text too small 16 px" on every caption |
| Static hold in s5 | 1.73 s (WARN) |
| Caption speed | WARN |

**Subjective, weakest first:**
1. **s4-anatomy:** the 1.75× zoom crops the code against the frame edge; the exploded stack sits off balance.
2. **s6-ratio:** ~0.7 s of empty frame after the scan-wipe, before the first item lands.
3. **s5:** a static quote hold while the clause is read.

**Diagnosis of the text FAIL:** an instrument error, not a video defect. The inspector read the font size of the caption's wrapper div (16 px default) instead of the styled box. It was fixed in `BTO.inspectText`.

## Pass 1 → v2: objective PASS

**Changes:**

| Scene | Change |
|---|---|
| s4 | Camera zoom 1.75 → 1.42, recentred on the stack |
| s6 | Flyer enters on the first word ("They") |
| s5 | Amber underline drawn under "least likely" as it is spoken |
| QA | Caption sync measured on the narration track (the music bed masked pauses in the mix) |

**Result:**
- Text gate PASS.
- Newly visible WARN: caption sync max 499 ms. Cause: Kokoro pauses where there is no punctuation ("…ratio | lets…") and the word-timing estimator only snapped pauses to punctuation.
- Chips at 24 px, below the style minimum (30 px).

## Pass 2 → v3: objective FAIL

**Changes:**
- Every detected pause is snapped to the most plausible word boundary (punctuation preferred).
- Chips 24 → 28 px with more spacing.
- s5 gets a slow push-in under the quote.

**Result:**
- s5 static hold fixed.
- A **new FAIL**: the taller chips collided with the "Why squares?" headline (text collision 26%).
- Caption sync rose to 576 ms. That was traced to the metric: it compared mid-phrase cues ("orient…") with the nearest onset. Fixed so it only uses cues that follow a pause, which is what the FR metric intended.

## Pass 3 → v4: objective PASS

**Changes:** headline moved to y 372 and the form down 20 px.

**Result:**
- Only S5 and S6 re-rendered (5/7 segments from cache, 51 s).
- Caption sync: max 8 ms over the 8 cues that follow a pause.
- Remaining WARNs: one caption at 23.8 chars/s (estimated Kokoro timing), and chips at 28 px.

## Final render (v5-final-a → current final)

- Chips raised to 30 px, then a cold 1080×1920 final render.
- The side-by-side with the existing engine exposed one more defect: during the last 0.4 s the ratio strip overlapped the code as the camera returned to the loop framing. The strip and scan line now leave at `L7:angle.end+0.2`.
- Re-render: only s7, 150 frames in 33 s.
- **Current final:** objective PASS. One WARN (caption speed 23.8 chars/s).

## Open items (flagged for human review, not claimed as solved)

1. **Voice:**
   - The video uses an **unapproved preview voice**.
   - Re-narrate with the approved Edge Emma voice on the Mac (`--voice edge`, `BTO_PREMIUM_RENDER=final`). Anchors re-time every animation automatically.
   - Then re-run QA and listen. Nobody has listened to this soundtrack yet: this session cannot play audio. Loudness, peaks and clipping are measured; listening quality is not.
2. **s3-origin:** the lower third is quiet (subjective). A candidate is a car-parts tag beat (fact F10, Wikipedia) if the owner wants it.
3. **s4-anatomy:** the detail zoom deliberately crops the card. Acceptable to me, but it is the scene most worth a second opinion.
4. **Hook:** the existing engine opened on a real photo. The premium hook is fully drawn. A licensed real-object plate before the dissolve could add authenticity; it was not done.
