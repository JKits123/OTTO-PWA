# COMPANION_CONTEXT — OTTO
**Generated:** 2026-06-14
**Last updated:** 2026-07-30 (Code Sonnet 5 — Steam Coil Estimator + collapsible UI reorg)
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

**Air Systems:** Duct Sizer (live ductulator), Duct Friction (Darcy-Weisbach/Colebrook-White), Grilles (face & free-area velocity), Psychrometrics (dew point, enthalpy, humidity ratio, mixed air, SHR)

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
