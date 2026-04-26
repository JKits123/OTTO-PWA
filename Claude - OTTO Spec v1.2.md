# OTTO – Technical Specification V1.2 (Master Brief)

**Project:** ORPHEUS HVAC Intelligence Ecosystem
**Component:** OTTO – Engineering Calculation & Reasoning Engine
**Focus:** Mobile-First Design, On-Site Commissioning, & Physical Reasoning

---

## 1. Purpose & Philosophy
OTTO is a mobile-first engineering assistant for Building Services Engineers (HVAC, Refrigeration, Public Health, Electrical). Unlike a standard calculator, OTTO is a reasoning engine that validates measurements, interprets system behavior, and produces report-ready engineering justifications.

## 2. Core Operational Modes
- **Design Mode:** "Help me size this correctly." Focuses on required plant capacities, duct/pipe sizing, and theoretical loads.
- **Site / Commissioning Mode:** "Help me verify this system." Focuses on actual vs. design comparisons, performance deviations, and diagnostic reasoning.

## 3. Engineering Toolsets

### 3.1 Air Systems & Ventilation
- **Duct Sizing:** Circular, Rectangular, and Flat Oval.
- **Friction Loss:** Pa/m based on Darcy-Weisbach/Moody (defaulting to galvanized steel 0.15 mm roughness).
- **Velocity Logic:** Automatic warnings for noise risk (>15 m/s commercial, >8 m/s residential).
- **Psychrometrics:** Dew point, Enthalpy (kJ/kg), Humidity Ratio (g/kg), Mixed Air Temp, Sensible Heat Ratio.

### 3.2 Water & Public Health
- **Medium Selector:** Pure Water, Ethylene Glycol, or Propylene Glycol (10–50%).
- **Friction Loss:** Hazen-Williams for steel/copper/plastic.
- **System Logic:** Water flow from kW & ΔT; expansion vessel sizing; pump duty basics.

### 3.3 Refrigeration & Electrical
- **Cycle Checks:** Superheat/Subcooling calculators; F-Gas CO₂e calculations.
- **Refrigerant Library:** Saturation lookups for R32, R410A, R134a, R290.
- **Electrical:** Ohm's Law, 3-Phase power, Voltage drop, Motor Heat Gain (kW × (1 − efficiency)).

## 4. The "Explain My Readings" Engine (V2.0 Core)
Diagnostic module interpreting site data to find faults.
- **Inputs:** Current vs. Previous readings (Pressure, Airflow, Temp), Fan Speed, Filter/Coil condition.
- **Logic:** Detects filter loading, damper drift, duct blockages, dirty coils.
- **Output:** Plain-English interpretation (e.g., "Filter DP increased 80%; airflow reduced — recommend filter change").

## 5. Mobile-First UX Strategy (Ladder-Friendly)

### 5.1 No-Keyboard Interaction
- **Thumb-Zone:** Primary inputs and Calculate buttons in bottom 30% of screen.
- **Smart Dials:** Scroll wheels for sizing/flow instead of typing (deferred to native build).
- **Unit-Tap:** Tapping a result unit cycles through equivalent units.

### 5.2 Sensor & Environment Integration
- **Air Density:** Hardcoded ρ = 1.2 kg/m³ (sea-level UK standard). Altitude override deferred.
- **Plant Room Mode:** *Removed in V1.2 final per user direction — light theme only.*
- **Push-to-Talk:** Voice parsing via Web Speech API for hands-free input.

## 6. Regulatory & Safety Guardrails
- **Commissioning Tolerance:** BSRIA/CIBSE bands (±10% / ±5%) for flow validation.
- **Status Indicators:**
  - 🟢 Green — Within design/commissioning limits
  - 🟡 Amber — Warning (high velocity, noise risk, motor near FLC)
  - 🔴 Red — Out of safe/efficient operating range

## 7. Data & Reporting
- **Offline-First:** All core calcs are local; no API/Internet required.
- **Field Memo:** One-tap copy/share to WhatsApp/Email via Web Share API, including all physical assumptions.

## 8. Success Criteria
OTTO is successful if it allows an engineer to perform a full system validation and fault diagnosis 5× faster than using a laptop or manual charts, while ensuring results are technically bulletproof and report-ready before they leave the site.
