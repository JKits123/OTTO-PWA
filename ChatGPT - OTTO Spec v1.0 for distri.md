ChatGPT - OTTO Spec v1.0 for distribution

Good call. This is exactly how you build something properly — like a real engineering spec, not a series of tweaks.

Below is a clean, professional, and complete V1.0 specification.
You can drop this straight into Gemini / DeepSeek and ask for critique, additions, and edge cases.

🧠 OTTO – Technical Specification V1.0

Project: ORPHEUS HVAC Intelligence Ecosystem
Component: OTTO – Engineering Calculation & Reasoning Engine
Authoring Basis: Senior Technical Design Engineer + Site Commissioning Engineer

1. Purpose

OTTO is a mobile-first engineering assistant designed for Building Services Engineers working in:

HVAC (Air Conditioning & Ventilation)
Refrigeration
Public Health (Water Systems)
Electrical Building Services

OTTO provides:

Fast, reliable engineering calculations
Structured unit conversions
Real-time site validation tools
Technical reasoning behind system behaviour
Report-ready explanations for engineering decisions
2. Core Philosophy

OTTO is not just a calculator.

It must function as:

A technical “go-to” tool that helps engineers calculate, validate, interpret, and explain system performance.

3. User Types
3.1 Design Engineer (Office)

Needs to:

Size systems before installation
Validate assumptions
Select plant, ductwork, and pipework
Check design feasibility
3.2 Site Engineer / Commissioning Engineer

Needs to:

Measure real-world system performance
Compare against design or historical data
Diagnose discrepancies
Justify findings technically
4. Operational Modes
4.1 Design Mode

“Help me design this correctly”

Outputs:

Required sizes (duct, pipe, plant)
Flow rates
Capacities
Recommended ranges
4.2 Site / Commissioning Mode

“Help me verify and explain this system”

Outputs:

Actual vs expected comparison
Performance deviation
Engineering reasoning
Next-step recommendations
Report wording
5. System Architecture (Functional)

OTTO is composed of modular engineering tools, grouped by discipline.

6. Dashboard Structure
6.1 Quick Convert

Fast access tools:

Pressure (Pa, mmH₂O, in.wg, PSI, kPa)
Airflow (l/s, m³/h, CFM)
Area (mm², m², ft²)
Volume (m³, litres, ft³)
Length (mm, m, inches, ft)
Power (kW, W, HP)
Heat (kW, BTU/hr, TR)
Water flow (l/s, l/min, m³/h)
6.2 Air Systems (HVAC Core)

Tools:

Circular duct area
Rectangular duct area
Duct velocity
Airflow from velocity
Duct sizing by target velocity
Grille free area
Face velocity
Filter face velocity
Coil face velocity
Air changes per hour (ACH)
6.3 Fan & Extraction Systems

Tools:

Fan laws calculator
Flow / pressure / power relationships
Fan speed correction
System resistance analysis
Static pressure comparison
Differential pressure interpretation
Extract system validation
6.4 Heating & Cooling

Tools:

kW ↔ BTU/hr ↔ TR
Sensible heat calculations
Air-side heating/cooling load
Water-side coil calculations
Water flow from kW & ΔT
CHW / LTHW validation
6.5 Refrigeration / AC

Tools:

Superheat calculator
Subcooling calculator
Saturation reference (future)
COP / EER conversions
F-Gas CO₂e calculations
System sanity checks
6.6 Water / Public Health

Tools:

Pipe velocity
Pipe flow conversions
Pipe sizing helpers
Storage volume calculations
Pump duty basics
Pressure/head conversion
6.7 Electrical

Tools:

Ohm’s Law
Single-phase power
Three-phase power
Current from kW
Voltage drop
Motor FLC estimation
Power factor
7. Advanced Module (Critical)
7.1 “Explain My Readings” Engine

This is a core differentiator.

Inputs:
System type (e.g. extract, AHU, FCU)
Previous readings (SP, DP, airflow)
Current readings
Fan speed (if known)
Filter condition
Damper position
System observations
Outputs:
Change in values (absolute + %)
Interpretation of system resistance
Likely causes:
Filter loading
Damper changes
Duct blockage
Fan speed variation
System leakage
Suggested checks
Engineering explanation
Example Output:

“Filter differential pressure has increased from 120 Pa to 220 Pa. This indicates increased resistance across the filter, most likely due to loading or blockage. If fan speed has remained constant, airflow is likely reduced and system efficiency impacted.”

8. User Interface Principles
8.1 Design Requirements
Mobile-first (iPhone priority)
Large touch-friendly inputs
Minimal typing required
Fast response time
Clean white UI with CDL green accents
8.2 Tool Layout

Each tool must include:

Purpose
What this tool is for
Inputs
With dropdown unit selection
Results
Primary output
Supporting values
Unit conversions
Status Indicator
OK / Warning / Investigate
Helper (toggle)
Formula explanation
Plain English meaning
Example (toggle)
Real-world scenario
Engineering Reasoning
What changes mean physically
Report Output
Copyable text for reports
9. Smart Input Engine

OTTO must interpret natural inputs such as:

“350mm duct area”
“630 duct 900 l/s”
“10 mmH2O to Pa”
“5kW to BTU”
“10kW dt 5”

Outputs:

Direct result
Optional expanded explanation
10. Unit System
Full SI + Imperial support
All tools must allow unit selection via dropdown
Internal calculations standardised (SI)
11. Data Output Format (Future Integration)
{
  "tool": "duct_area",
  "input": {"diameter_mm": 350},
  "result": {"area_m2": 0.096},
  "status": "ok"
}
12. ORPHEUS Integration (Future)

OTTO will act as:

Calculation engine for ZEUS (pricing/design)
Validation engine for ORCHID (diagnostics)
Support tool for BLOODHOUND (deep analysis)
13. Development Phases
V1.0 (MVP – Functional Core)
Core HVAC tools
Pressure, airflow, duct calcs
Water flow
Basic UI
Helper + example toggles
Basic smart input
V1.1
Fan laws
Grille/coil/filters expansion
Improved smart input
Status indicators
V2.0
“Explain My Readings” engine
Refrigeration expansion
Electrical module
Report generation
V3.0
Full ORPHEUS integration
AI-assisted diagnostics
Drawing input (PLATO integration)
14. Success Criteria

OTTO is successful if:

Engineers can perform calculations faster than using Google or manuals
Engineers can confidently explain system behaviour
Engineers reduce time spent on site analysis
Engineers produce clearer, technically accurate reports
15. Summary

OTTO is a:

Calculation tool
Validation tool
Reasoning engine
Engineering assistant

Designed to support both:

Design decisions
Real-world performance validation
👇 What to do next

Paste this into Gemini / DeepSeek and ask:

“Critique this OTTO specification as a senior HVAC design and commissioning engineer. What is missing, incorrect, or could be improved?”

Then bring their output back — and we’ll refine this into a bulletproof V1.1 spec 👊