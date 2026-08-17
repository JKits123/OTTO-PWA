# COMPANION_CONTEXT — OTTO
**Generated:** 2026-06-14
**Last updated:** 2026-08-17 (third session, Code Sonnet 5 — Offset Calculator: real input-order fix, previous session's focus fix was insufficient)
**Scope:** OTTO only. Cross-companion references logged at bottom.

---

## ⚠️ Pre-close brief correction

The CLOSE DRONE brief described OTTO as "Concept/placeholder — no confirmed live code." **This is incorrect.** OTTO is a functioning, deployed PWA with 2,728 lines of code across multiple committed releases. The status below reflects what is actually in the folder.

---

## 1. File Inventory

| File | Size | Last Modified | Status |
|------|------|---------------|--------|
| `README.md` | 2.3 KB | 2026-04-26 | Complete — describes V1.2 capabilities |
| `OTTO V2 - Redevelopment Master Brief.md` | 5.9 KB | 2026-04-29 | Complete — V2 upgrade specification |
| `index.html` | 9.4 KB | 2026-04-29 | Complete — full UI structure, all tool cards wired |
| `app.js` | 95 KB / 1,708 lines | 2026-04-29 | Complete — all calculators + interpretation layer |
| `explanations.js` | 29 KB / 455 lines | 2026-04-29 | Complete — Phase 1 Explanation Engine |
| `style.css` | 12 KB / 565 lines | 2026-04-29 | Complete — mobile-first PWA styling |
| `manifest.json` | 582 B | 2026-04-29 | Complete — PWA manifest with icons |
| `service-worker.js` | 710 B | 2026-04-29 | Complete — offline-first caching (v18) |
| `favicon.ico` | 148 KB | 2026-04-29 | Present |
| `icon-192.png` | 33 KB | 2026-04-29 | Present |
| `icon-512.png` | 168 KB | 2026-04-29 | Present |

Git repository present. Remote: origin/main. Last commit: **2026-04-29**.

---

## 2. What OTTO Is

OTTO is a **mobile-first Progressive Web App** for HVAC, refrigeration, public health, and electrical site work. Per the README, it is the **"Engineering Calculation & Reasoning Engine"** of the ORPHEUS ecosystem — designed for ladder-friendly, no-laptop site use.

The master brief describes the intent as: *"A senior site engineer's pocket brain — fast calculations, simple explanations, and confident decision support."* This is explicitly not a simple calculator — it is positioned as a reasoning and guidance tool that explains results rather than just computing them.

Two operational modes: **Design** (sizing, capacities, theoretical loads) and **Site** (actual vs design comparison, fault diagnosis).

Installable as a home-screen PWA on iPhone (Safari) and Android (Chrome). Works fully offline after first load via service worker.

---

## 3. Current Build State

OTTO is in active development and substantially more complete than the pre-close brief assumed. The git log shows a clear progression:

| Commit | Content |
|--------|---------|
| V1.2 | Full engineering & reasoning engine rewrite |
| V1.3 | Smart input natural-phrase parser added |
| V1.3 #1 | Lindab-style live ductulator |
| V2 Phase 1 | Explanation Engine built and integrated |
| V2 §8 | Interpretation Layer rolled across all tools |

**V2 Phase 1 is complete.** The Explanation Engine (`explanations.js`) is live with 13 topics including duct condensation, fan laws, psychrometrics, superheat/subcool, F-Gas rules, voltage drop, and more.

**V2 §8 Interpretation Layer is complete.** All calculators now output status, expected range, likely cause, and suggested next steps rather than bare numbers.

### Working calculator toolset (confirmed in `app.js` and `index.html`)

**Air Systems:** Duct Sizer (live ductulator), Duct Friction (Darcy-Weisbach/Colebrook-White), Grilles (face & free-area velocity), Psychrometrics (dew point, enthalpy, humidity ratio, mixed air, SHR), Offset Calculator (guided diagonal cut-length wizard — see 4c)

**Water & Public Health:** Water Flow (pure water + ethylene glycol + propylene glycol 10–50%), Pipe Friction (Hazen-Williams), Expansion Vessel & Pump Duty

**Refrigeration:** Superheat/Subcool (R32, R410A, R134a, R290), F-Gas/CO₂e (charge × GWP, leak-check intervals), Refrigerant Saturation Lookup (P↔T)

**Electrical:** Ohm's Law & 3-Phase Power, Voltage Drop (BS 7671), Motor Heat Gain

**General Conversions:** Pressure (Pa/mmH₂O/in.wg/kPa/bar/PSI), Heating/Cooling (kW/BTU/TR), Room Volume & ACH

**Diagnostics:** Explain My Readings (heuristic engine — filter loading, airflow shortfall, blockage, coil fouling, capacity drift)

### Features confirmed working
- Smart quick input (natural-phrase parser: "630 duct 900 l/s", "10 mmH2O to Pa", "superheat r32 7C 5bar")
- Push-to-talk voice input (Web Speech API)
- Field Memo (Web Share API — WhatsApp / Email / Clipboard)
- Status badges 🟢🟡🔴 against BSRIA/CIBSE tolerance bands
- Offline-first service worker (cache v18)
- Design/Site mode toggle
- Explanation Engine with 13 plain-English topics and collapsible cards

---

## 4. V2 Master Brief — Outstanding Phases

The master brief defines three phases. Status per the git log:

| Phase | Content | Status |
|-------|---------|--------|
| Phase 1 | Explanation Engine + UI integration + initial topics | ✅ Complete |
| Phase 2 | Command bar, navigation improvements, interpretation layer | ✅ Largely complete (interpretation layer committed; command bar = smart input already present) |
| Phase 3 | Steam coil estimator, guided surveys, prediction tools ("What happens if…") | 🟡 Started — Steam Coil Estimator done (2026-07-30); Guided Surveys and Prediction tools not started |

### Phase 3 — Steam Coil Estimator (2026-07-30, DONE)
Built in response to a real client question on site (whether an existing steam coil's kW output could be calculated, to inform a replacement decision). Two independent methods, both grounded in standard engineering formulas, not invented:
- **Method A — air-side sensible heat (recommended, High confidence):** `Q = ρ_air × V × cp_air × ΔT` (ρ=1.2 kg/m³, cp=1.005 kJ/kg·K). Same class of formula already used by OTTO's own Water Flow and Psychrometrics tools. Requires airflow + entering/leaving air temps — a direct field measurement.
- **Method B — steam pipe capacity estimate (Medium confidence, explicitly flagged as a ceiling not a measurement):** `ṁ = ρ_steam × velocity × pipe area`, `Q = ṁ × h_fg`, evaluated at 15–30 m/s (standard safe-velocity range for LP/MP steam branch/equipment connections). New `STEAM_SAT` table (bar g → Tsat/hfg/vg, 11 key points, linear interpolation) mirrors the existing refrigerant `SAT` table pattern already in app.js.
- When both methods have inputs, cross-checks them (consistent / air-side well below pipe capacity — check trap/valve/fouling / air-side exceeds pipe ceiling — re-check inputs).
- Optional coil width×height gives a face-velocity sense-check (2–3 m/s typical band) — does not feed the kW estimate itself.
- Verified against hand calculation (Node script reproducing the exact in-app logic) before it ever touched the UI, then browser-tested end to end (all three cross-check branches exercised, zero console errors). Confidence: **high on Method A** (standard, unimpeachable air-side physics); **medium on Method B's velocity assumption** (15–30 m/s is a standard steam-engineering rule of thumb for branch/equipment connections, but the tool cannot know the real trap/valve state, so it's presented as a ceiling, not a duty reading).
- Registered as `TOOLS.steam` in app.js, card lives in the new "Heating & Coils" section of index.html.

### Phase 3 items still not built
- **Guided Surveys** — AHU survey, A/C fault readings, duct survey, structured capture UI
- **Prediction Feature** — "What happens if…" simulation for fan speed, pulley, and duct size changes

The master brief also notes a planned restructure to `/core`, `/features`, `/explanations`, `/ui`, `/pwa` directories — not yet done; all code remains in flat root structure.

---

## 4a. UI reorganization (2026-07-30, DONE)

All 8 tool sections (previously flat `<h3>` + `<section class="grid">`, 29 cards on one continuously-scrolling page) converted to `<details class="tool-section">` — collapsed by default, tap the header to expand, native disclosure triangle. New CSS in style.css (`.tool-section*`). Browser-verified: all sections collapsed on load, expand/collapse works, tool inside an expanded section opens correctly. New **"Heating & Coils"** section added (previously didn't exist — Water Flow/Pipe Friction/Expansion Vessel stayed under "Water & Public Health", which was always just water/pipe calcs despite the name; the master brief's original taxonomy specified Heating/Coils as its own bucket, confirmed with Jim before building). Section order: Air Systems & Ventilation → Heating & Coils → Water & Public Health → Refrigeration → Electrical → General Conversions → Diagnostics → Explain It Simply. service-worker.js cache bumped v18→v19 so offline PWA installs actually pick up the change.

---

## 4c. Duct Offset Calculator (2026-08-17, DONE)

New tool card in Air Systems & Ventilation (`TOOLS.offset` in app.js, `offsetHTML`/`offsetInit`/`renderOffset` + helper functions). Departs deliberately from OTTO's usual "flat form + Calculate button" pattern — this is a guided, one-question-at-a-time wizard (own `OFFSET_STATE` object, progressive-disclosure render driven by `renderOffset()`, same pattern already used by the Duct Sizer's live solver rows and shape tabs, just extended to a longer multi-step chain):
1. Shape (Round / Rectangular, reuses the existing `.ds-tab` shape-picker component from the Duct Sizer)
2. Angle (30°/45°/60°/90°, mini SVG icon per button) — once picked, a larger labelled schematic diagram appears (letters only at this stage: L, E, CC, R, Ø d₁ — mirrors a manufacturer-style offset-bend reference diagram)
3. Known value — one plain-language question at a time ("How far does the duct need to move sideways?" / "...space to run diagonally?" / "...far forward does the offset need to travel?"), each mapping to CC/L/E respectively (only in code — never surfaced as jargon in the UI copy); selecting one reveals a single number input, not a form. The "forward travel" (E) option is disabled at 90° with an inline explanation, since cos(90°)=0 makes it meaningless as a known input.
4. Jointing method (mezz/flange +10mm, slip joint +25mm × user-entered joint count, spiral male/female −80mm) applied to the final cut length
5. If rectangular: width + depth, then an optional clear-space-available check (Fits / Tight-within-~10% / Won't fit, comparing the duct's largest side against the entered clearance)

Output: headline diagonal cut length (final, joint allowance included), sideways-move and forward-travel reference values, fit-check result if rectangular, and a labelled diagram with the actual computed numbers filled in (same SVG-drawing function reused between the symbolic step-2 preview and the final numeric output — `offsetDiagramSVG()`). Math: `CC = L·sin(θ)`, `E = L·cos(θ)` for two equal bends of angle θ, solved for whichever of the three is unknown.

**One real bug found and fixed during browser verification, not assumed correct:** `Math.cos(90°)` in JS isn't exactly 0 (floating-point, ~6.12×10⁻¹⁷), so at 90° the derived forward-travel value printed as `6.12e-15 mm` instead of `0 mm` — a small but genuinely unprofessional-looking artifact for field use. Fixed by clamping CC/E to 0 when their computed magnitude is below `1e-6`.

**Verified via a real running browser session, not code-read alone** (local Python HTTP server, drove the actual app functions in-page — `offsetSetShape`/`offsetSetAngle`/`offsetSetKnown`/`offsetKnownInput`/`offsetSetJoint`/`offsetSlipInput`/`offsetDimInput`/`offsetClearanceInput` — exactly as the real UI's onclick/oninput handlers would): confirmed the 45° round-trip (CC known 300mm → L 424.26mm, E 300mm, +2 slip joints → final 474.26mm — hand-checked), the 90° edge case (E correctly zero after the fix, L known 100mm → CC 100mm, spiral −80mm → final 20mm), a deliberately-too-short case correctly showing the non-positive-cut-length warning, and both rectangular fit-check branches (Fits at 500mm clearance vs 300mm duct, Won't fit at 250mm). Zero console errors across the flow. A pre-existing `otto` entry in the root ORPHEUS `.claude/launch.json` (Python `http.server` on port 3003, correct absolute path) already covers browser-testing OTTO through the Browser pane — found this only after mistakenly adding a redundant `otto-dev` entry on top of a file that had already been trimmed to just `panel-dev` by an in-flight uncommitted edit from another concurrent session; restored the original 11 configs and dropped the redundant entry rather than compounding the loss.

`service-worker.js` cache bumped v19→v20 so the installed PWA actually picks up the new tool.

---

## 4d. Offset Calculator — input-focus fix + "both fixed points known" mode (2026-08-17, later session, DONE)

Jim reported a real usability bug on first use: every numeric field in the Offset Calculator (known value, slip-joint count, width/depth, clearance) only accepted one digit before losing focus, forcing a click back into the box per character.

**Root cause confirmed, not assumed:** every field's `oninput` handler wrote the parsed value into `OFFSET_STATE` then called `renderOffset()`, which rebuilds the *entire* wizard body as one HTML string and reassigns it to `#offsetBody.innerHTML` on every keystroke — a full `innerHTML` replacement destroys and recreates every input element in the tree, so the input the user was typing into is a brand-new DOM node after each character and loses focus. (The Duct Sizer's live solver rows don't have this bug because `recomputeDuct()` only ever sets `.value` on existing computed fields — it never rebuilds the solver row inputs themselves.)

**Fix:** new `offsetSetBodyHTML(html)` helper, now the single choke point every render path uses instead of `$("offsetBody").innerHTML = html` directly. Before replacing the body, it records `document.activeElement`'s `id` (only if it's actually inside `#offsetBody`) and, where supported, its `selectionStart`/`selectionEnd`; after the replacement it looks up the new element by that same `id` and refocuses it. `type="number"` inputs don't support the selection API in Chrome (throws `InvalidStateError` on read *or* write), so both the read and the `setSelectionRange` call are wrapped in `try/catch` — focus is restored unconditionally, cursor position is a best-effort extra. This preserves the wizard's live, reveal-as-you-type UX (the brief's "defer to blur" alternative would have removed that) rather than changing the app's behaviour to work around the bug.

**"I already have both fixed points" mode added** — a second entry point alongside the existing "pick an angle first" flow, for when CC and E are already fixed by site conditions (e.g. two pre-set flanges) rather than derived from a chosen bend angle:
- New step after shape selection: "How do you want to work this out?" — pick a standard bend angle (existing flow, unchanged) or "I already have both fixed points" (new).
- Check mode asks for CC then E as two separate one-at-a-time plain-English questions (same style as the existing known-value step), then computes `angle = atan2(CC, E)` in degrees (not `atan(CC/E)`, which would divide by zero at E=0 — the 90° case) and compares it against the four presets with a ±1° tolerance.
- **Match:** shows which preset it matches plus the exact calculated angle, computes `L = √(CC² + E²)` (exact Pythagorean distance between the two real measured points, deliberately *not* re-derived via `CC / sin(presetAngle)` — using the clean preset angle for the trig would introduce a small error against the actual measured geometry), then proceeds through the same jointing-method → dims → output flow as the angle-first path (refactored into a shared `renderOffsetDownstream()` tail function so the two entry points don't duplicate that logic).
- **No match:** states the exact angle required, explains plainly that no cut length can fix a mismatched angle and a single diagonal section between two standard bends won't connect the points, offers the three real options (source a bend rated at that angle / move a fixed point / split into two stages) — and deliberately produces no cut length or jointing step at all, per the brief.
- **Near-zero angle (<1°):** distinct friendly message ("no bend needed, run the duct straight") rather than routing into the generic mismatch case.

**Verified live against the actual deployed behaviour, not code-read alone** — local Python server (the pre-existing `otto` launch config), drove the real `oninput`/`onclick` handlers character-by-character via synthetic keystroke events with the field genuinely focused first (an early version of the test harness skipped the initial `.focus()` call and produced a false negative — caught and corrected before drawing any conclusion): confirmed multi-digit typing keeps focus and accumulates correctly across every field in a full 45° round-trip (known value, slip count, width, depth, clearance — final result 403.55mm matched hand-calculation). Check mode verified on 4 branches: CC=300/E=300 → matches 45° exactly (L=424.26mm, +10mm flange → 434.26mm); CC=400/E=0 → matches 90° via the `atan2` zero-division-safe path; CC=300/E=100 → 71.57°, correctly refuses a cut length and shows the mismatch message with no jointing step appended; CC=1/E=1000 → 0.057°, correctly shows the "already in line" message. Zero console errors throughout.

**This verification was wrong — the fix above did not work on a real device, corrected same day (4e below).**

---

## 4e. Offset Calculator — the actual input fix, previous session's fix was insufficient (2026-08-17, third session, DONE)

Jim re-opened this after real-device testing (typing on an actual phone, not simulated events) showed the field was still broken, differently: digits entered in **reversed order** ("875" typed → "578" displayed), the forward-travel (E) field still stuck at one digit, and a suspicion that duct width/depth might share one variable.

**Why the previous fix (4d) didn't work, established by reading the code again rather than re-trusting the prior session's account:** `offsetSetBodyHTML()` still did `body.innerHTML = html` on every keystroke — it only added a *refocus* step afterward. Refocusing a freshly-created `<input type="number">` doesn't reliably restore cursor position: Chrome throws reading *or* writing `selectionStart`/`selectionEnd` on number inputs (the previous session's own code comment already noted this), so the `try/catch` silently no-ops and the browser is left to pick a default caret position after `.focus()` — evidently position 0 on the real device tested, not the end. With the caret parked at 0 on every re-render, each subsequent real keystroke (which — unlike the previous session's test — respects actual caret position) inserts *before* the existing digits: type "8" → "8"; type "7" at position 0 → "78"; type "5" at position 0 → "578". Exactly the reported symptom.

**The previous session's verification missed this because its test was structurally incapable of catching it:** it built each string via `el.value += ch` — blind append, completely ignoring caret position — so it would report success regardless of where the (possibly broken) caret actually was. This is why "verified live, multiple branches, zero errors" was reported and was still wrong: the test never exercised the actual failure mode. This time, verification uses `el.value = el.value.slice(0, pos) + ch + el.value.slice(pos)` at the field's real `selectionStart` (falling back to end only where the browser genuinely won't report a position), which reproduces order-sensitive typing — plus tracks the exact DOM node reference (`===`) across every keystroke, which is the real thing that must not change.

**Real fix (not a workaround):** stopped destroying the input at all. `#offsetBody`'s markup is a flat list of top-level sibling blocks — one per question — built by string concatenation in DOM order. `offsetSetBodyHTML()` now: finds the top-level block that contains the currently-focused input (`liveChildren.findIndex(el => el.contains(active))`), finds the matching block in the freshly-rendered (but not yet inserted) HTML by the same input `id`, leaves every live block up to and including that one completely untouched in the real DOM (the focused input itself is never removed, never recreated — this is the "update the existing input's value in place" fix the original brief actually asked for, which the previous session substituted with a refocus-based workaround instead), and only appends the new blocks that come *after* it — the parts of the wizard that are genuinely new as a result of the value just typed (e.g. the jointing-method step appearing once a value is entered). Falls back to a full replace only when the field's containing block can't be matched at all (a structural change — switching shape, picking a different mode — which only happens on a button click, never mid-keystroke, so no live typing session is ever interrupted by it).

**Width vs depth — checked directly, not just inferred:** `offsetDimInput('width')`/`offsetDimInput('depth')` write to `OFFSET_STATE.width`/`OFFSET_STATE.depth` (two distinct object keys) from two inputs with distinct ids (`offsetDimwidth`/`offsetDimdepth`) and independent `oninput` calls — this was already correct in the code; the appearance of them "sharing" a value was very likely the same reversal/caret bug making both fields look broken in a similar confusing way. Typed 400 into width and 175 into depth with the new fix and confirmed both the live `.value`s and the final rendered diagram label (`400×175 mm`) show the distinct entered values, with each field's DOM node identity independently confirmed stable throughout — not merged, not overwritten by the other.

**Verified with a test that actually exercises the failure mode this time, and an honest limitation stated up front:** this sandboxed Browser pane cannot composite frames (`screenshot`/`computer` actions fail with "Browser pane is not displayed"), so genuine OS-level tap-typing on a real device is not something this session can perform directly — the same constraint that made the previous session's simulated-event testing necessary in the first place. What changed is that the simulation itself is now caret-aware (inserts at the field's actual `selectionStart`, not blind-appended) and additionally asserts the exact DOM node reference survives every keystroke, which is the literal condition that must hold for real typing to behave correctly regardless of device or browser. Confirmed on the real served `app.js` after catching and correcting a stale-cache false start (the first test run hit an old cached copy of the file with the 4d code still in it, caught by fetching with `cache:'no-store'` and checking the function source before trusting any result): node identity `true` on every keystroke, and values accumulate in typed order, for `offsetKnownVal` (both CC and, separately, E), `offsetCheckCC`, `offsetCheckE`, `offsetDimwidth`, `offsetDimdepth`, `offsetClearance`, and `offsetSlipCount`. Zero console errors. **Jim's own tap-test on his device remains the authoritative confirmation and is still outstanding** — this session's fix addresses the exact, confirmed root cause and passes the strongest test available in this environment, but is not a substitute for that.

`service-worker.js` cache bumped v21→v22.

---

## 4b. Design vs Site mode — confirmed dead control (2026-07-30, NOT FIXED, flagged only)

Verified in code, not assumed: `setMode()` (app.js) only toggles which header button is visually highlighted and sets `STATE.mode` — grepped the whole codebase and `STATE.mode` is never read anywhere else. No tool, calculation, or visible content changes based on which mode is selected; the "Diagnostics — Site mode" badge is a static label, not a gate. This is why the toggle feels indistinguishable in daily use — there's genuinely nothing behind it. Out of scope for the 2026-07-30 session (not asked for); flagged here so a future session doesn't have to re-discover it. Fixing it properly means deciding what Design vs Site should actually change (e.g. Site mode surfacing the Diagnostics section more prominently, or gating which fields are shown) — a real design decision, not a one-line fix.

---

## 5. Outstanding Items

| Severity | Item |
|----------|------|
| 🟡 Medium | Phase 3 partially done: Guided Surveys and Prediction tools not started |
| 🟡 Medium | Design/Site mode toggle is a confirmed dead control — no functional difference between the two states (see 4b) |
| 🟡 Medium | Code structure still flat-root — planned `/core /features /explanations /ui /pwa` split not done |
| 🟢 Low | No ORPHEUS ecosystem integration evident in this codebase (standalone PWA) |
| 🟢 Low | Voice input marked as "optional" in master brief — current implementation covers this adequately |
| 🟢 Low | README still describes V1.2 capabilities; does not reflect V2 additions or the Steam Coil Estimator |
| 🟢 Low | Footer still reads "OTTO v1.2" — static string, not tied to actual build state |

---

## 6. ORPHEUS Integration Status

No ORPHEUS integration code present in this repo. OTTO is a standalone static PWA (HTML/CSS/JS, no backend, no API calls). The master brief does not specify integration endpoints or protocols. How OTTO connects to the wider ORPHEUS ecosystem — if at all — is not defined in any file present. Explicitly out of scope for 2026-07-30 per Jim's instruction (deferred, not decided).

---

## 6a. Hosting (confirmed 2026-07-30)

Real GitHub repo, remote `github.com/JKits123/OTTO-PWA`, branch `main`. Deployed via **GitHub Pages** at `https://jkits123.github.io/OTTO-PWA/` — confirmed live and matching the repo content via direct fetch before this session's changes. GitHub Pages serves straight off `main`, so `git push` is the deploy; no separate build/READY state to poll like Vercel, but the live URL was still re-fetched after pushing this session's changes to confirm propagation rather than trusting the push alone.

---

## 7. Next Recommended Action

Phase 3's two remaining items — Guided Surveys and Prediction tools — are bigger, separate pieces of work (explicitly deferred by Jim on 2026-07-30, not decided against). Recommended next steps, in order:
1. Guided Surveys — build the reusable guided-capture UI pattern once, before building individual surveys (AHU, A/C fault readings, duct survey)
2. Prediction Feature — "What happens if…" fan speed/pulley/duct size simulation
3. Decide what Design vs Site mode should actually do (currently a dead control, see 4b) before building anything that assumes it works
4. ORPHEUS integration — still nothing to integrate with on the OTTO side; hold until Jim decides OTTO's role in the wider ecosystem

The flat-root code structure remains low priority — do not refactor until the above is settled.

---

## Cross-companion references found

None. No references to VIGIL, SENTINEL, AEGIS, ORCHID, THERMIS, PLATO, or HERMES appear in any OTTO file.
