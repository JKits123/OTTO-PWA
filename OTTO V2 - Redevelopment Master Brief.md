================================
OTTO V2 – REDEVELOPMENT MASTER BRIEF
================================

You are helping me redevelop OTTO, a mobile-first PWA engineering assistant designed for real-world HVAC, refrigeration, mechanical, and electrical site use.

1. CORE PRODUCT VISION

OTTO should feel like:

A senior site engineer's pocket brain — fast calculations, simple explanations, and confident decision support.

This is NOT just a calculator app.

OTTO must:

Explain engineering simply
Guide inexperienced users
Help collect correct site data
Provide reasoning, not just answers
Increase confidence when speaking to clients

2. CRITICAL DEVELOPMENT RULE

DO NOT rebuild OTTO from scratch
UPGRADE the existing system in place

Preserve ALL existing functionality:

Current calculators
Microphone / voice input
Smart quick input parser
PWA structure
Offline service worker
Field memo capability
Design/Site mode

This is a layered upgrade, not a rewrite.

3. CURRENT OTTO CAPABILITIES

OTTO already includes:

Duct sizing / airflow / friction
Psychrometrics (basic)
Water flow / pipe friction
Refrigeration (SH/SC/saturation/F-Gas)
Electrical tools
General conversions
Explain My Readings concept
Offline PWA functionality

These must be retained and enhanced.

4. USER INTERACTION MODEL

OTTO must support three interaction methods:

TAP (primary)
Structured menus and collapsible sections

TYPE (quick commands)
Examples:
convert 500 cfm to l/s
open ductulator
steam coil estimate

VOICE (shortcut only)
Examples:
OTTO take me to airflow
OTTO explain duct sweating

Voice is optional, not mandatory.

5. APP STRUCTURE

HOME

Ask OTTO (command bar + voice)
Site Tools
Guided Surveys
Explain It Simply
Explain My Readings
Field Memo

Site Tools
Airflow / Duct
Refrigeration / A/C
Heating / Coils
Water / Pipework
Electrical
Conversions

All sections must be collapsible and mobile-friendly.

Guided Surveys

Used for structured data capture.

Examples:

AHU survey
Steam coil estimator
A/C fault readings
Duct survey

Explain It Simply (CORE FEATURE)

Plain-English engineering explanations.

Examples:

Why ducts sweat
Fan laws explained
Why breakers trip
Why airflow doesn't increase

6. EXPLANATION ENGINE (PHASE 1)

Create a reusable module providing:

Simple explanation
Why it matters
Real-world example
What to check on site
Common mistakes
Confidence level
Link to related tools

Initial topics:
Duct condensation / dew point
Sensible vs latent heat
Dry bulb / wet bulb / dew point
Fan laws
Fan speed vs power trips
Airflow vs resistance
Pulley changes

UX requirements
Add "Explain This" button to tools
Add "Explain It Simply" section
Use collapsible cards
Avoid technical jargon unless expanded

7. ENGINEERING SIMPLIFICATION RULE

Never ask confusing questions like:

"Is this absolute or gauge pressure?"

Instead ask:

"Where did this pressure come from?"

Gauge
Drawings
BMS
Not sure

OTTO handles assumptions internally.

8. INTERPRETATION LAYER

Upgrade all tools:

From:
Input → Output

To:
Input → Output → Interpretation

Include:

Status (OK / Warning / High / Low)
Expected range
Likely cause
Suggested next steps

9. STEAM COIL OUTPUT ESTIMATOR

Create guided estimator using:

Coil size (width × height)
Coil depth (visual)
Steam pressure
Pipe sizes
Airflow (optional)
Air temperatures (optional)

Output must include:
Estimated kW range
Confidence level
Reasoning summary
Replacement guidance
Follow-up checks

10. PREDICTION FEATURE

"What happens if…"

Allow simulation of:

Fan speed change
Pulley change
Duct size change

Output:

Airflow change
Pressure change
Power change
Risk warnings

11. UI / UX RULES

Mobile-first
Collapsible sections
Minimal typing
Allow "Not sure"
Provide guidance
Validate inputs

12. BUILD STRATEGY

Work in SMALL steps.

Phase 1
Explanation Engine
Explain UI
Basic topics

Phase 2
Command bar
Navigation improvements
Interpretation layer

Phase 3
Steam coil estimator
Guided surveys
Prediction tools

13. CODE STRUCTURE (GRADUAL)

/core
/features
/explanations
/ui
/pwa

Do not break existing logic.

14. CLAUDE TASK

Review OTTO files
Generate implementation plan (.md)
Build Phase 1 only:
Explanation Engine
UI integration
Initial topics

15. FINAL OBJECTIVE

OTTO should help the user:

Understand what is happening
Speak confidently to clients
Avoid mistakes
Make better decisions

OTTO amplifies knowledge — it does not replace it.

================================
ADDITIONAL ENGINEERING EXPLANATION CONTENT (FOR PHASE 1)
================================

DUCT SWEATING (CONDENSATION)

Simple explanation:
Warm air contains moisture. When it touches a cold surface, it cools and releases water. That water becomes condensation.

Why it matters:
Uninsulated cold ducts in warm spaces will sweat.

What to check:

Surface temperature
Air humidity
Insulation presence

Fix:

Insulate duct
Reduce humidity
Seal air leaks

FAN LAWS (SIMPLE)

Airflow increases with speed
Pressure increases faster
Power increases much faster

Power is proportional to speed cubed

If speed increases slightly, power increases significantly.

WHY BREAKERS TRIP

Increasing fan speed increases electrical load rapidly.

This can:

overload motor
trip breaker
damage system

AIRFLOW VS RESISTANCE

Airflow depends on resistance.

High resistance = low airflow even if fan is fast

Resistance comes from:

duct size
bends
filters
grilles

PULLEY CHANGES

Bigger pulley:

increases speed
increases airflow
massively increases power demand

Always check motor capacity.

================================
CLAUDE EXECUTION INSTRUCTION
================================

Tell Claude:

Read OTTO_V2_OPENING_PROMPT.md

Create a structured implementation plan.

Then implement Phase 1 only:

Explanation Engine
UI integration
First explanations

Do NOT rebuild the app.
Preserve all existing functionality.
Work in small steps and show progress.

================================
END
================================
