# OTTO HVAC Toolkit — V1.2

OTTO is a mobile-first Progressive Web App for HVAC, refrigeration, public-health and electrical site work. It is the **Engineering Calculation & Reasoning Engine** of the ORPHEUS ecosystem — designed for ladder-friendly, no-laptop site use.

## Operational Modes
- **Design** — sizing, capacities, theoretical loads
- **Site** — actual vs design comparison, fault diagnosis

## Toolset

### Air Systems & Ventilation
- Duct & Airflow (circular, rectangular, flat-oval)
- Duct Friction Loss — Darcy-Weisbach with Colebrook-White
- Grilles — face & free-area velocity with noise badges
- Psychrometrics — dew point, enthalpy, humidity ratio, mixed air, SHR

### Water & Public Health
- Water Flow — pure water, ethylene glycol, propylene glycol (10–50%)
- Pipe Friction — Hazen-Williams (steel / copper / plastic)
- Expansion Vessel & Pump Duty

### Refrigeration
- Superheat / Subcool — saturation lookup R32, R410A, R134a, R290
- F-Gas / CO₂e — charge × GWP, leak-check intervals
- Refrigerant Saturation Lookup (P↔T)

### Electrical
- Ohm's Law & 3-Phase Power
- Voltage Drop (BS 7671 limits)
- Motor Heat Gain to space

### General Conversions
- Pressure (Pa, mmH₂O, in.wg, kPa, bar, PSI)
- Heating / Cooling (kW, BTU/hr, TR)
- Room volume & ACH

### Diagnostics (Site mode)
- **Explain My Readings** — heuristic engine that compares current vs design/previous readings and surfaces findings: filter loading, airflow shortfall, blockage signatures, coil fouling, capacity drift.

## Mobile-First Features
- Sticky bottom Calculate / Memo bar (thumb-zone)
- Push-to-talk voice input (Web Speech API)
- Field Memo — one-tap share via Web Share API (WhatsApp / Email / Clipboard)
- Status badges 🟢🟡🔴 against BSRIA / CIBSE tolerance bands
- Offline-first via service worker

## Engineering Assumptions
- Air density ρ = 1.2 kg/m³ (sea-level UK standard)
- Air viscosity ν = 1.5×10⁻⁵ m²/s
- Default duct roughness ε = 0.15 mm (galvanised steel)
- Copper resistivity 0.0224 Ω·mm²/m at 70 °C
- Refrigerant saturation tables — 9 points (-30 to +50 °C), linear interpolation
- F-Gas thresholds per EU/UK Reg 517/2014; GWP per AR4

## Install
Open the GitHub Pages link in Safari (iPhone) or Chrome (Android) and choose **Add to Home Screen**.
