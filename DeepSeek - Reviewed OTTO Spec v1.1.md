DeepSeek - Reviewed OTTO Spec v1.1 for distri

OTTO – Technical Specification V1.1
Engineering Calculation & Reasoning Engine

Based on V1.0 + senior HVAC design/commissioning engineering critique.
All 🔴 critical gaps closed. 🟡 improvements added. 🟢 future-proofing noted.

1. Purpose (unchanged, but reinforced)
OTTO is a mobile-first engineering assistant for Building Services Engineers working in:

HVAC (Air Conditioning & Ventilation)

Refrigeration

Public Health (Water Systems)

Electrical Building Services

Core deliverables:

Fast, reliable engineering calculations

Structured unit conversions

Real-time site validation + safety warnings

Technical reasoning behind system behaviour

Report-ready explanations

2. Core Philosophy (unchanged)
OTTO is not just a calculator.
It is a reasoning engine that helps engineers calculate, validate, interpret, and explain system performance — even offline.

3. User Types (expanded)
3.1 Design Engineer (Office)
Size systems, validate assumptions, select plant/duct/pipework, check feasibility.

3.2 Site Engineer / Commissioning Engineer
Measure real-world performance, compare against design, diagnose discrepancies, justify findings.

3.3 Maintenance Engineer *(NEW - V1.2 target, spec placeholder)*
Quick filter life remaining, bearing temperature checks, belt tension guidance, runtime logging.

4. Operational Modes (unchanged)
Design Mode: “Help me design this correctly”

Site/Commissioning Mode: “Help me verify and explain this system”

5. System Architecture (unchanged - modular)
6. Dashboard Structure (expanded with critical missing tools)
6.1 Quick Convert (expanded units)
Additions:

Pressure: Pa, mmH₂O, in.wg, PSI, kPa, bar (g / a), mbar, microns (vacuum)

Airflow: l/s, m³/h, CFM, m³/s

Vacuum: microns, Torr, mbar (abs)

Concentration: ppm, %, g/kg (humidity ratio)

6.2 Air Systems (HVAC Core) (expanded)
Original tools + CRITICAL ADDITIONS:

Duct friction loss (round, rectangular, flat oval) – Pa/m

Fitting loss (elbows, reducers, tees) – simple equivalent length or zeta method

System resistance curve (future V2.0)

6.3 Fan & Extraction Systems (unchanged, but density-aware)
Add air density correction based on:

Altitude

Temperature

Barometric pressure (optional)

6.4 Heating & Cooling (psychrometrics added - CRITICAL)
Original tools + PSYCHROMETRICS (V1.1 MVP):

Dew point (dry-bulb + RH)

Enthalpy (kJ/kg)

Humidity ratio (g/kg)

Mixed air temperature

Sensible heat ratio (SHR)

Coil leaving condition (bypass factor simplified)

6.5 Refrigeration / AC (expanded)
Add:

Pressure-enthalpy logic for basic cycle checks

Saturation temperature lookup for R32, R410A, R134a, R290 (table-driven, V1.2)

Target superheat (fixed or adaptive)

6.6 Water / Public Health (expanded)
Add:

Pipe friction loss (Hazen-Williams, Darcy-Weisbach V2.0)

Pump head estimation (simple: height + friction + fitting loss)

Cavitation check (NPSH available vs required — V2.0)

6.7 Electrical (unchanged, but add motor efficiency warning)
7. Advanced Module (Critical)
7.1 “Explain My Readings” Engine — V2.0 target (boundary conditions expanded)
Inputs expanded:

System type (AHU, FCU, extract, exhaust, chilled water circuit)

Previous readings (SP, DP, airflow, temperature)

Current readings

Fan speed (or VFD %, damper position)

Coil condition (clean / fouled / wet) ← NEW

Filter condition (clean / loaded / blocked)

Outside air temperature (for density correction) ← NEW

Measured air temperature (for density correction) ← NEW

Observed issues (condensate, noise, vibration)

Diagnostic logic now includes:

Filter loading

Damper change

Duct blockage

Fan speed variation

Dirty coil (wet coil DP rise) ← NEW

Blocked condensate drain ← NEW

Air density change (temperature/altitude) ← NEW

VFD calibration drift ← NEW

Known limitations statement displayed before diagnosis:

“This diagnosis assumes stable operating conditions over 5 minutes and no sensor drift. Verify physical readings before acting.”

8. User Interface Principles (expanded)
8.1 Design Requirements (unchanged + OFFLINE)
Offline-first — all core calculations local, no API required for basic tools

Mobile-first (iPhone priority)

Large touch-friendly inputs

Minimal typing required

Fast response time (<0.2s locally)

Clean white UI with CDL green accents

8.2 Tool Layout (unchanged + warnings)
Each tool must include:

Purpose

Inputs (dropdown unit selection)

Results (primary + supporting values, unit conversions)

Status Indicator (OK / Warning / Investigate)

Expected range + Warning thresholds ← NEW
Example: *Velocity 8 m/s (Warning: >15 m/s – noise risk)*

Helper (formula + plain English)

Example (real-world scenario)

Engineering Reasoning

Report Output (copyable, templated)

8.3 Report Output Template (NEW - standardised)
text
[Tool name] | [YYYY-MM-DD HH:MM]
Input: [value + units]
Result: [value + units]
Status: [OK/Warning/Investigate]
Reasoning: [1-2 sentences]
Next step: [action]
---
9. Smart Input Engine (disambiguation rules added)
OTTO interprets natural inputs such as:

"350mm duct area"

"630 duct 900 l/s"

"10 mmH2O to Pa"

"5kW to BTU"

"10kW dt 5"

Disambiguation rules (V1.1):

User input	Default interpretation
"X mm duct"	Diameter (air systems)
"X mm pipe"	Diameter (water systems)
"X duct Y l/s"	Diameter X mm, airflow Y l/s
"dt X"	Delta temperature (°C or K)
Unclear → ask	"Did you mean diameter or side length?"
Output: Direct result + optional expanded explanation.

10. Unit System (unchanged)
Full SI + Imperial support.
Dropdown per tool.
Internal calculations standardised in SI.

11. Data Output Format (unchanged)
json
{
  "tool": "duct_area",
  "input": {"diameter_mm": 350},
  "result": {"area_m2": 0.096},
  "status": "ok",
  "warning": null
}
With warning field added.

12. Error Handling (NEW)
Scenario	Response
Division by zero	"Check input – division by zero avoided"
Out of range (e.g., 10,000 Pa filter)	"Value [X] exceeds typical range [Y–Z]. Verify measurement."
Missing required input	"Please provide [field name]"
Invalid unit combo	"Cannot convert [unit A] to [unit B]"
No crashes. No blank screen.

13. Safety & Validation Logic (NEW - per tool)
Each tool has:

Expected operating range

Warning threshold

Investigate threshold

Example — Duct velocity:

Velocity	Status
0–15 m/s	OK
15–20 m/s	Warning (noise/erosion risk)
>20 m/s	Investigate
Example — Water velocity:

Velocity	Status
0–3 m/s	OK
3–4 m/s	Warning
>4 m/s	Investigate
14. ORPHEUS Integration (Future) (unchanged)
15. Development Phases (revised)
V1.0 (MVP – delivered)
Core HVAC tools (basic)

Pressure, airflow, duct area (no friction loss)

Water flow (basic)

Basic UI + helper/example toggles

Basic smart input (minimal disambiguation)

V1.1 (THIS SPEC – next build)
Psychrometrics (dew point, enthalpy, mixed air, humidity ratio)

Duct friction loss (round/rect/flat oval, Pa/m)

Pipe friction loss (Hazen-Williams)

Air density correction (altitude + temperature)

Safety & warning thresholds (velocity, pressure, temperature)

Offline-first (local calculations only)

Report output template

Error handling (graceful failures)

Status indicators (OK/Warning/Investigate)

Explain My Readings → deferred to V2.0 (but logic boundaries defined)

Refrigeration saturation tables → V1.2

V2.0
Full Explain My Readings engine (with all boundary conditions)

Refrigeration expansion (superheat/subcooling with saturation)

Electrical module (full)

Project history / logging

Voice input (basic)

V3.0
Full ORPHEUS integration

AI-assisted diagnostics

Drawing input (PLATO)

16. Success Criteria (unchanged)
OTTO is successful if engineers:

Calculate faster than Google/manuals

Confidently explain system behaviour

Reduce site analysis time

Produce technically accurate reports

17. Summary (unchanged)
OTTO is a calculation tool, validation tool, reasoning engine, and engineering assistant for both design decisions and real-world performance validation — now with psychrometrics, pressure drop, safety logic, and offline capability.

Appendix A: Psychrometrics – Minimum V1.1 Implementation
Implement these 6 functions (all offline, approximated but engineering-grade):

Function	Inputs	Output
Dew point	Dry-bulb (°C), RH (%)	Dew point (°C)
Enthalpy	Dry-bulb (°C), RH (%)	kJ/kg
Humidity ratio	Dry-bulb (°C), RH (%)	g/kg
Mixed air temp	OA temp, RA temp, OA fraction	Mixed temp (°C)
Sensible heat ratio	Sensible load, total load	SHR (0–1)
Air density	Temp (°C), altitude (m)	kg/m³
Accuracy: ±5% for engineering use. Full ASHRAE polynomials in V2.0.

Appendix B: Duct Pressure Drop – Minimum V1.1 Implementation
Round duct friction loss (simplified Darcy):

text
ΔP (Pa/m) = (friction factor) × (density × velocity²) / (2 × diameter)
Friction factor from Moody chart approximation (smooth or medium rough)

Default roughness: galvanised steel (0.15 mm)

Rectangular duct → round equivalent:

text
D_eq = (2 × a × b) / (a + b)
Output: Pa/m, Pa/100m, in.wg/100ft.

Warning if velocity > 15 m/s.

Appendix C: Pipe Pressure Drop – Minimum V1.1 Implementation
Hazen-Williams (water, 4–20°C):

text
ΔP (Pa/m) = 6.817 × 10⁶ × (flow_lps¹.⁸⁵) / (C¹.⁸⁵ × D_mm⁴.⁸⁷)
C = 140 for clean steel, 130 for new copper, 150 for plastic

Velocity warning > 3 m/s

Future: Darcy-Weisbach for glycols.

Final note to development team
This V1.1 spec is buildable, testable, and field-credible.
The three most important deliverables for senior engineer trust are:

Psychrometrics (even simplified)

Duct & pipe pressure drop

Safety warnings (velocity, pressure, temperature)

Build those right, and OTTO becomes a tool engineers recommend to each other.