/* ==========================================================================
   OTTO V2 — Explanation Engine (Phase 1)
   Plain-English engineering reference for site engineers.
   Each topic carries: simple, why-it-matters, real-world, what-to-check,
   common-mistakes, fix, confidence, related-tools.
   Wired into the existing #toolPanel — no new infrastructure.
   ========================================================================== */

const EXPLANATIONS = {

  duct_condensation: {
    title: "Why ducts sweat",
    icon: "💧",
    summary: "Condensation, dew point, when to insulate",
    confidence: "high",
    relatedTools: ["psych", "duct"],
    simple: "Warm air carries water as invisible vapour. When that air touches something colder than its dew point, the moisture turns back into liquid — water beads on the surface. That's all condensation is.",
    whyItMatters: "Uninsulated cold ducts running through warm spaces (plant rooms, ceiling voids) sweat continuously. The water damages ceiling tiles, drips onto stock, grows mould, and stains finishes. Insurance claims from a sweating chilled-water duct are common and expensive.",
    realWorld: "A 6 °C chilled-water duct passing through a 24 °C / 60% RH plant room: that room air's dew point is about 16 °C. The duct surface is 10 K below dew point — it sweats heavily, drip-drip-drip into the void below.",
    checkOnSite: [
      "Surface temperature of the duct (laser thermometer)",
      "Room dry-bulb temperature and relative humidity",
      "Whether existing insulation is intact, dry, and has a sealed vapour barrier",
      "Whether condensate is dripping onto a finished surface, stock, or electrics below"
    ],
    commonMistakes: [
      "Assuming insulation alone fixes it — without a vapour barrier, moisture migrates through and condenses inside",
      "Adding insulation but leaving open joints — air finds the gaps and condenses behind the lagging",
      "Treating the symptom (drip tray) instead of the cause"
    ],
    fix: [
      "Wrap with closed-cell foam or fibre insulation with a fully sealed vapour barrier",
      "Reduce room humidity if practical (extract, dehumidify, fix obvious moisture sources)",
      "Stop air leakage that draws humid room air toward the cold surface"
    ]
  },

  fan_laws: {
    title: "Fan laws (simple)",
    icon: "🌀",
    summary: "Speed up a little, pay a lot",
    confidence: "high",
    relatedTools: ["motor", "ohm"],
    simple: "If you spin a fan faster, three things happen: airflow goes up a little, pressure goes up more, and power goes up A LOT. The maths: airflow scales with speed, pressure with speed squared, and power with speed cubed.",
    whyItMatters: "This cube-law on power is why a 'small' speed increase can trip the breaker, overload the motor, or destroy the belt. Fans don't scale linearly — small change in, big change out.",
    realWorld: "An AHU fan at 50 Hz drawing 5 kW. You push it to 60 Hz to chase missing 20% airflow. Power becomes 5 × (60/50)³ = 8.6 kW. That's 70% more current, very likely an overload trip.",
    checkOnSite: [
      "Motor nameplate full-load amps (FLA) and kW",
      "Actual amps drawn now (clamp meter)",
      "Belt and pulley sizes — has anything been changed recently?",
      "VSD trip log — has it been hitting overcurrent already?"
    ],
    commonMistakes: [
      "Dialling up speed to 'fix' poor airflow without checking power",
      "Assuming a 20% speed increase costs 20% more energy — it actually costs ~73% more",
      "Ignoring the motor's service factor and headroom"
    ],
    fix: [
      "Reduce system resistance instead of fan speed — clean filters, open dampers, replace crushed flex",
      "If speed must rise, confirm the motor can handle the cube-law power before changing pulleys or VSD setpoints",
      "Recalculate fan kW using P_new = P_old × (n_new ÷ n_old)³ before committing"
    ]
  },

  airflow_vs_resistance: {
    title: "Airflow vs resistance",
    icon: "🚧",
    summary: "Why a faster fan doesn't always help",
    confidence: "high",
    relatedTools: ["duct", "friction", "explain"],
    simple: "A fan can only push as much air as the system lets it. If the path is restricted — small ducts, blocked filters, dirty coils, kinked flex — the fan moves less air no matter how hard it tries.",
    whyItMatters: "When a tenant complains 'no air', the answer is rarely 'install a bigger fan'. It's almost always 'find what's blocking the airflow downstream'.",
    realWorld: "An office is supposed to get 500 l/s. You measure 320 l/s with the fan flat-out at 100%. The fan isn't undersized — there's an obstruction somewhere: a closed VCD, a fouled coil, a filter past its change-out limit, a crushed flex.",
    checkOnSite: [
      "Filter pressure drop — is it more than 2× clean ΔP?",
      "Coil air-side ΔP — climbing year on year?",
      "All dampers fully open, linkages free",
      "Flexible duct kinks, sags, or crushed sections",
      "Grille free area not blocked by furniture, paint over diffusers, or stored stock"
    ],
    commonMistakes: [
      "Increasing fan speed to overcome resistance — works briefly, costs huge power",
      "Replacing the fan when the issue is actually downstream",
      "Skipping the filter check — it's the single most common cause"
    ],
    fix: [
      "Replace dirty filters",
      "Strip and clean fouled coils",
      "Open dampers fully, repair stuck linkages",
      "Replace crushed flex with rigid duct where the run permits"
    ]
  },

  breaker_tripping: {
    title: "Why breakers trip",
    icon: "⚡",
    summary: "Tracing the cause, not just resetting",
    confidence: "high",
    relatedTools: ["motor", "vdrop", "ohm"],
    simple: "A breaker trips because the current going through it exceeded its limit for too long. With fans and pumps, that almost always means the motor is being asked to do more work than it's rated for.",
    whyItMatters: "Repeated trips damage the motor windings, the breaker contacts, and stop the building. Tracing the root cause is faster than guessing.",
    realWorld: "A 7.5 kW supply fan trips its 16 A MCB after each filter change. The new filters are higher-grade than the old ones — system resistance went up, the fan compensates with more torque, current rises past the breaker setting.",
    checkOnSite: [
      "Motor nameplate FLA vs measured running amps",
      "Whether the trip is instant (short circuit) or after several seconds (overload)",
      "Recent changes: new filters, new pulleys, VSD setpoint change, damper repositioning",
      "Belt slip — a slipping belt actually pulls more current, not less"
    ],
    commonMistakes: [
      "Replacing the breaker with a larger one — masks the problem and risks the motor",
      "Resetting the breaker repeatedly without diagnosing — every trip stresses the contacts",
      "Assuming it's a 'dodgy breaker' before measuring actual current"
    ],
    fix: [
      "Measure running amps; if at or above FLA, reduce system load (clean filters, open dampers)",
      "Check if a pulley has been changed — recalculate fan kW with the cube law",
      "If amps are well below FLA but the breaker still trips, then suspect the breaker itself"
    ]
  },

  duct_friction_explained: {
    title: "Duct friction & velocity — what the numbers mean",
    icon: "🌬️",
    summary: "Reading Pa/m, velocity bands, and total run pressure",
    confidence: "high",
    relatedTools: ["duct", "friction"],
    simple: "Air flowing through a duct rubs against the duct walls. That rubbing wastes pressure — the fan has to make extra pressure on top of what's actually needed at the diffuser. The friction tool tells you how much pressure is wasted per metre of duct.",
    whyItMatters: "Every Pa/m of friction means more fan power, more noise, more energy bill. Designers aim for 0.8–1.0 Pa/m on long runs as the economic sweet spot. Higher than that and the pump cost forever outweighs the saving on duct size.",
    realWorld: "A 400 mm duct carrying 500 l/s at ~4 m/s gives ~0.5 Pa/m. Over a 30 m main, that's 15 Pa just in friction — manageable. Push the same flow through a 300 mm duct and velocity jumps to 7 m/s, friction quadruples to ~2 Pa/m, and the fan now needs 60 Pa over the same run.",
    checkOnSite: [
      "Hydraulic diameter — for circular ducts that's the actual diameter; for rectangular it's 4·area ÷ perimeter",
      "Material roughness ε — galvanised steel 0.15 mm, plastic 0.01 mm, flex 0.9 mm or worse",
      "Whether the duct is dirty inside (dust film increases ε)",
      "Whether the run has fittings — bends, transitions, dampers add equivalent length"
    ],
    commonMistakes: [
      "Sizing for 0.5 Pa/m and forgetting the fan must overcome fittings TOO (typically 30–50% extra)",
      "Using the friction figure for flex without bumping ε up to 0.9 mm",
      "Ignoring velocity warnings — friction goes up roughly with V², so doubling velocity quadruples Pa/m"
    ],
    fix: [
      "Velocity above 8 m/s? Step duct size up — friction drops dramatically",
      "Velocity below 2 m/s? Duct is over-sized — air may not throw correctly from terminals",
      "On long runs, target 0.8–1.0 Pa/m as the design balance",
      "Add 30–50% fitting allowance at design stage for a typical commercial layout"
    ]
  },

  psychrometrics_basics: {
    title: "Dry bulb, wet bulb, dew point",
    icon: "💨",
    summary: "Understanding the three temperatures that describe moist air",
    confidence: "high",
    relatedTools: ["psych"],
    simple: "Air has three temperatures, not one. Dry bulb is what an ordinary thermometer reads — the actual temperature you feel. Wet bulb is what a thermometer reads with a wet sock around it — lower than dry bulb because evaporation cools it. Dew point is the temperature at which the moisture in this air would start condensing on a cold surface.",
    whyItMatters: "Cooling coils, condensation, comfort, evaporative cooling — all of them depend on these three figures, not just the temperature. Two rooms at 22 °C can feel completely different at 30 % RH versus 70 % RH because the wet-bulb and dew-point are different.",
    realWorld: "Office air at 22 °C dry-bulb and 50 % relative humidity has wet-bulb ≈ 15.5 °C and dew point ≈ 11 °C. Touch a chilled-water duct at 7 °C in that room and it sweats heavily — surface is 4 K below dew point.",
    checkOnSite: [
      "Dry-bulb temperature — handheld thermometer, BMS sensor, or thermohygrometer",
      "Relative humidity (RH) — handheld thermohygrometer (cheap, ±3 %)",
      "From those two, OTTO computes wet bulb, dew point, humidity ratio (g/kg), enthalpy (kJ/kg)",
      "If you have wet-bulb directly (sling psychrometer), even better — most accurate measurement"
    ],
    commonMistakes: [
      "Reporting just dry-bulb — tells you nothing about coil performance or condensation risk",
      "Using last week's RH reading — humidity changes hour by hour, especially with weather",
      "Confusing dew point with wet bulb — they're related but different (dew point is lower)"
    ],
    fix: [
      "For comfort: aim for 21–23 °C / 40–60 % RH",
      "For condensation control: any cold surface must stay ABOVE the dew point of the surrounding air",
      "For coil sizing: wet-bulb determines latent capacity; dry-bulb alone is not enough"
    ]
  },

  sensible_vs_latent: {
    title: "Sensible vs latent heat",
    icon: "♨️",
    summary: "The two ways air carries energy",
    confidence: "high",
    relatedTools: ["psych", "water"],
    simple: "Sensible heat is the energy you can feel as temperature change — heat the air up, the thermometer rises. Latent heat is the energy hidden in moisture — when water vapour condenses out (or evaporates in), huge amounts of energy move with no temperature change at all.",
    whyItMatters: "Cooling coils do both jobs at once. A coil rated 'X kW total' might split as 70 % sensible (cooling the air) and 30 % latent (taking water out). If you size a coil on total kW alone and the room is mostly latent (kitchens, gyms, swimming pools), you'll under-cool the air temperature even though the kW number says you're fine.",
    realWorld: "A restaurant kitchen at 28 °C / 70 % RH is mostly latent load — extracting humidity from cooking. The cooling coil might run 45 % sensible / 55 % latent. A standard office split (75 / 25) installed there will struggle to dry the space.",
    checkOnSite: [
      "What is generating the heat? People (mostly latent), lighting (sensible), cooking (latent), machinery (sensible)",
      "Sensible Heat Ratio (SHR) — sensible kW ÷ total kW",
      "Coil entering and leaving wet-bulb temperatures (latent capacity is the difference)",
      "Whether condensate is actually flowing from the coil drain — proof latent capacity is being used"
    ],
    commonMistakes: [
      "Quoting only total cooling kW without splitting sensible and latent",
      "Assuming SHR ≈ 0.75 in all cases — kitchens and gyms run much lower",
      "Sizing a coil for mostly-latent load using sensible-only assumptions"
    ],
    fix: [
      "Match coil SHR to load SHR — manufacturer selection software does this automatically",
      "Latent-led space? Choose a coil with more rows and lower entering air temperature (deeper, colder coil pulls more water out)",
      "Confirm with field readings: if room RH stays high despite cool air, latent capacity is short"
    ]
  },

  water_flow_kw_dt: {
    title: "Water flow from kW & ΔT",
    icon: "💧",
    summary: "Why the same chiller can run at different flows",
    confidence: "high",
    relatedTools: ["water", "pipe", "expansion"],
    simple: "Heating and cooling water carries energy. The amount of water you need depends on two things: how much energy you're moving (kW) and how big a temperature change you'll allow (ΔT). Bigger ΔT → less water needs to flow. Smaller ΔT → more water.",
    whyItMatters: "Pump energy is dominated by flow rate. Halving the ΔT doubles the flow, and pump power roughly doubles too. Picking a sensible ΔT is one of the biggest energy decisions on a wet system.",
    realWorld: "A 10 kW heat exchanger at ΔT = 5 K needs 0.48 l/s. The same 10 kW at ΔT = 10 K needs only 0.24 l/s — half the pipe size, half the pump. Modern LTHW systems run at 80/60 (ΔT 20 K) for exactly this reason; old systems were 82/71 (ΔT 11 K) and burnt a lot more pump energy.",
    checkOnSite: [
      "Actual flow temperature (going to the load) and return temperature (coming back)",
      "Real ΔT measured at the coil — not the design figure on the drawing",
      "Whether the system runs constant-flow or variable-flow",
      "If glycol is in the system — its lower specific heat means more flow for the same kW"
    ],
    commonMistakes: [
      "Designing for ΔT 20 K but running constant-flow pumps that drop the actual ΔT to 5 K (low-ΔT syndrome)",
      "Forgetting glycol penalty — 30 % EG carries ~12 % less energy per litre than pure water",
      "Picking ΔT = 5 K for a small chiller because 'that's what books say' — bigger ΔT cuts pump cost forever"
    ],
    fix: [
      "Aim for ΔT 6–10 K on chilled water, 15–20 K on heating, where the coil/emitter allows",
      "If real ΔT is much lower than design, suspect a 3-port valve passing, bypass open, or pump oversized",
      "When swapping water for glycol, recalculate flow — don't just keep the old setpoint"
    ]
  },

  superheat_subcool_explained: {
    title: "Superheat & subcool — what they tell you",
    icon: "❄️",
    summary: "Two temperature differences that diagnose any DX system",
    confidence: "high",
    relatedTools: ["refcycle", "refsat", "fgas"],
    simple: "Superheat is how much the suction gas has been heated ABOVE its boiling temperature inside the evaporator. Subcool is how much the liquid has been cooled BELOW its condensing temperature inside the condenser. Both are measured in Kelvin (the temperature *difference*, not absolute temperature).",
    whyItMatters: "Together, superheat and subcool tell you whether a refrigerant circuit is correctly charged and whether the metering device is working. Almost every refrigeration fault shows up as one of these two readings being out of band.",
    realWorld: "An R32 split AC reading: suction 8 barg / 12 °C → superheat 7.8 K (✅ healthy band 5–8 K). Discharge 22 barg / 35 °C → subcool 4.6 K (slightly low — system may be ~10 % under-charged but not dramatically).",
    checkOnSite: [
      "Suction line pressure (gauge) AND temperature (clamp probe) at the same point — typically near the compressor inlet",
      "Discharge or liquid-line pressure AND liquid-line temperature near the receiver outlet",
      "Convert pressure to saturation temperature using the refrigerant's P-T table (OTTO does this)",
      "Subtract: SH = T_meas − T_sat (suction); SC = T_sat − T_meas (liquid)"
    ],
    commonMistakes: [
      "Reading pressure and temperature at different points — must be at the same point on the same line",
      "Forgetting to add 1 bar when converting gauge to absolute pressure (the saturation tables are absolute)",
      "Confusing superheat (suction-side temperature rise) with discharge superheat (compressor outlet, much higher)",
      "Treating R290 (propane) systems with the same SH targets as fluorinated gases — propane often runs slightly higher SH"
    ],
    fix: [
      "Low superheat (<3 K) → flood-back risk; check TXV setting, evaporator load, expansion valve sensor strap",
      "High superheat (>12 K) → undercharge or TXV starving; check liquid sight glass, refrigerant level, filter dryer",
      "Low subcool (<3 K) → undercharge or insufficient condenser; check sight glass, condenser fans, condenser cleanliness",
      "High subcool (>15 K) → overcharge or restriction; recover refrigerant or check liquid line for restrictions"
    ]
  },

  fgas_regulations_explained: {
    title: "F-Gas Regulation — leak checks & CO₂e",
    icon: "🌍",
    summary: "Why your charge size triggers different mandatory checks",
    confidence: "high",
    relatedTools: ["fgas", "refsat"],
    simple: "Fluorinated refrigerants (R32, R410A, R134a, etc.) are powerful greenhouse gases — kilo for kilo, hundreds to thousands of times worse than CO₂. The F-Gas Regulation makes the operator legally responsible for preventing leaks, and the legal duty depends on the system's CO₂-equivalent charge: charge in kg × the refrigerant's GWP.",
    whyItMatters: "The thresholds (5, 50, 500 tCO₂e) determine how often you must leak-check the system, whether you need certified personnel, and whether you must keep records. Get this wrong and the operator faces fines.",
    realWorld: "5 kg of R410A: 5 × 2 088 = 10 440 kg CO₂e = 10.44 tCO₂e. That sits between 5 and 50, so it needs **annual** leak checks by an F-Gas certified person. Same physical 5 kg of R290 (propane) = 0.015 tCO₂e — well under the threshold, no mandatory check.",
    checkOnSite: [
      "Refrigerant type printed on the unit nameplate",
      "Charge in kg — also on the nameplate (not 'system size in kW')",
      "Whether the system has a permanent leak-detection system (relaxes the check interval)",
      "Operator's F-Gas log — has it been kept up to date?"
    ],
    commonMistakes: [
      "Confusing the system's cooling kW with its kg charge — they're not the same",
      "Using GWP from AR5 when regulators in the UK still cite AR4 — small differences but they shift threshold crossings",
      "Topping up a leaky system year on year without finding the leak — illegal under F-Gas if charge exceeds 3 kg",
      "Letting an installer leave site without filling in the F-Gas log"
    ],
    fix: [
      "Look up GWP and check the threshold band: <5 t (no check), 5–50 t (annual), 50–500 t (6-monthly or 12 with leak detection), >500 t (3-monthly or 6 with leak detection)",
      "Phase down: avoid R410A and R134a for new builds — choose R32, R290, or CO₂ (R744) where suitable",
      "Fit permanent leak detection on systems above 500 t — halves the mandatory check frequency",
      "Keep the F-Gas log on site, updated every visit"
    ]
  },

  vdrop_bs7671_explained: {
    title: "Voltage drop — BS 7671 limits",
    icon: "📏",
    summary: "Why 3% / 5% matter for cable selection",
    confidence: "high",
    relatedTools: ["vdrop", "ohm", "motor"],
    simple: "When current flows through a cable, the cable's resistance loses some of the voltage as heat. By the time the supply reaches the load, it's slightly lower than at the breaker. BS 7671 caps this drop at **3 %** for lighting circuits and **5 %** for everything else — measured from the origin to the furthest point of the circuit.",
    whyItMatters: "Excessive voltage drop makes motors run hot, lamps dim, and electronics misbehave. It's also a fire risk because the cable is dissipating extra heat. The fix is usually one cable size up — cheap at install, expensive to retrofit.",
    realWorld: "32 A on a 50 m run with 4 mm² copper: drop ≈ 17.9 V on a 230 V system, or 7.8 % — well above the 5 % limit. Step up to 6 mm² and drop falls to 11.9 V (5.2 %, still slightly over). Try 10 mm² → 7.2 V (3.1 %, comfortably within).",
    checkOnSite: [
      "Cable length from origin (DB) to load — one-way, not round-trip",
      "Conductor CSA in mm² (not the cable diameter)",
      "Whether it's single or three phase — three phase voltage drop is √3 / 2 times single phase for the same I and L",
      "Operating current (not the breaker rating — the actual load current)"
    ],
    commonMistakes: [
      "Using cable size from a different country's tables — UK uses 230 V single / 400 V three-phase as nominal",
      "Forgetting that BS 7671 limits apply at full load, not at idle",
      "Calculating using ρ_copper at 20 °C — the standard assumption is 70 °C operation, ~30 % higher resistance",
      "Ignoring the 5 % limit because 'it's only a small overrun' — the limit is also a safety margin for the protective device"
    ],
    fix: [
      "Above 5 %? Step CSA up one size — drop scales with 1/CSA",
      "Long runs (>50 m) at high current? Three-phase if available — same kW with √3 less current per leg",
      "Critical loads (motors >5 kW, sensitive electronics)? Aim for 3 % even on power circuits",
      "For runs above 16 mm², check BS 7671 mV/A/m tables directly — reactance starts to matter and OTTO's resistance-only model under-reads"
    ]
  },

  pipe_friction_explained: {
    title: "Pipe friction & velocity — what the numbers mean",
    icon: "🪈",
    summary: "Reading head loss, Pa/m and velocity in plain English",
    confidence: "high",
    relatedTools: ["pipe", "water", "expansion"],
    simple: "When water flows through a pipe, it scrapes against the pipe wall. That scraping is friction, and friction eats pressure. The pump has to make up that lost pressure to keep water moving. The friction tool tells you how much pressure is being eaten per metre of pipe.",
    whyItMatters: "If friction loss is too high, you either need a bigger pump (expensive forever — every kWh of pump power leaves as heat and bills), or a bigger pipe (one-off cost). It's almost always cheaper to upsize the pipe than upsize the pump.",
    realWorld: "A 50 mm copper pipe carrying 2 l/s of water gives ≈ 0.025 m head loss per metre — i.e. about 250 Pa/m or 25 mm water gauge per metre. Over a 30 m run that's 0.75 m of head the pump must produce just to fight friction. Quiet, comfortable, sensible.",
    checkOnSite: [
      "Internal pipe diameter (not the outside diameter — Cu 22 mm OD is only ~20 mm ID)",
      "Actual measured flow (clamp ultrasonic, or duty/ΔT calculation)",
      "Pipe material — copper is smoother than old steel, plastic smoother still",
      "Whether the pipe is full of scale or sludge (especially old steel) — that effectively shrinks the bore"
    ],
    commonMistakes: [
      "Using outside diameter instead of internal — gives wildly low friction",
      "Forgetting fittings — a pipe with lots of bends, tees and valves often loses 30–50% MORE than the straight-pipe number",
      "Comparing Pa/m to mmH₂O/m without converting (1 mmH₂O ≈ 9.8 Pa)",
      "Ignoring the velocity warning — high friction is usually because velocity is too high for the pipe size"
    ],
    fix: [
      "Velocity above 2.5 m/s? Step the pipe size up one increment — friction drops dramatically (it scales roughly with V²)",
      "Velocity below 0.5 m/s? Pipe is over-sized — fine for the pump, but air won't purge and sludge settles",
      "If the friction figure looks impossibly high, check your inputs first: a 25 mm pipe will never carry 30 l/s, no matter what the maths says",
      "Add fitting allowances at the project stage — typically 10–20% extra for a tidy circuit, 30–50% for a busy one with many tees and valves"
    ]
  },

  pulley_changes: {
    title: "Pulley changes",
    icon: "⚙️",
    summary: "Small change, big power impact",
    confidence: "high",
    relatedTools: ["motor", "ohm"],
    simple: "Changing a fan pulley is the cheapest way to alter fan speed — but it has the biggest hidden cost. A small pulley change makes a big power change because of the cube law.",
    whyItMatters: "Many engineers fit a bigger motor pulley to push more airflow, then are surprised when the motor overloads or the VSD trips. The motor wasn't sized for the new duty.",
    realWorld: "Moving a motor pulley from 200 mm to 220 mm increases fan speed by 10%. Airflow rises 10%, but power rises (1.10)³ ≈ 33%. A 4 kW motor running at 90% load suddenly needs 5.3 kW — overload guaranteed.",
    checkOnSite: [
      "Original fan-pulley and motor-pulley diameters",
      "Motor nameplate kW and FLA",
      "Current running amps before any change",
      "Whether the system actually needs more airflow — or just better balancing"
    ],
    commonMistakes: [
      "Changing pulley sizes without recalculating motor demand",
      "Forgetting which pulley drives speed — bigger MOTOR pulley = faster fan; bigger FAN pulley = slower fan",
      "Not measuring before-and-after current to confirm the motor is happy"
    ],
    fix: [
      "Calculate new fan kW: P_new = P_old × (speed_new ÷ speed_old)³",
      "Confirm new kW is below motor nameplate × service factor (typically 1.15)",
      "If close to the limit, fit a larger motor at the same time as the pulley",
      "After the change, measure running amps at full duty and log the result"
    ]
  }

};

/* ---------- Render & open an explanation in the existing #toolPanel ---------- */

function openExplanation(key){
  const ex = EXPLANATIONS[key];
  if (!ex) return;
  const panel       = document.getElementById("toolPanel");
  const panelTitle  = document.getElementById("panelTitle");
  const panelBody   = document.getElementById("panelBody");
  if (!panel || !panelTitle || !panelBody) return;
  panel.classList.remove("hidden");
  panelTitle.textContent = `${ex.icon} ${ex.title}`;
  if (typeof STATE !== "undefined"){
    STATE.lastTitle  = `OTTO — ${ex.title}`;
    STATE.lastResult = renderExplanationHTML(ex);
  }
  panelBody.innerHTML = renderExplanationHTML(ex) + renderExplanationBar();
  panel.scrollIntoView({behavior:"smooth", block:"start"});
}

function renderExplanationHTML(ex){
  const list = arr => arr.map(x => `<li>${x}</li>`).join("");
  const tools = (ex.relatedTools || [])
    .filter(k => typeof TOOLS !== "undefined" && TOOLS[k])
    .map(k => `<button type="button" class="ghost explain-link" onclick="openTool('${k}')">Open ${TOOLS[k].title}</button>`)
    .join(" ");
  return `
    <div class="explain-card">
      <p class="explain-summary"><strong>${ex.summary}</strong></p>

      <details class="explain-section" open>
        <summary>What it is</summary>
        <p>${ex.simple}</p>
      </details>

      <details class="explain-section" open>
        <summary>Why it matters</summary>
        <p>${ex.whyItMatters}</p>
      </details>

      ${ex.realWorld ? `
      <details class="explain-section">
        <summary>Real-world example</summary>
        <p>${ex.realWorld}</p>
      </details>` : ""}

      <details class="explain-section">
        <summary>What to check on site</summary>
        <ul>${list(ex.checkOnSite)}</ul>
      </details>

      ${ex.commonMistakes ? `
      <details class="explain-section">
        <summary>Common mistakes</summary>
        <ul>${list(ex.commonMistakes)}</ul>
      </details>` : ""}

      ${ex.fix ? `
      <details class="explain-section">
        <summary>How to fix it</summary>
        <ul>${list(ex.fix)}</ul>
      </details>` : ""}

      ${tools ? `
      <div class="explain-related">
        <h4>Related tools</h4>
        ${tools}
      </div>` : ""}

      <div class="explain-confidence">
        Confidence: <span class="badge badge-${ex.confidence === 'high' ? 'good' : ex.confidence === 'medium' ? 'warn' : 'info'}">${ex.confidence}</span>
      </div>
    </div>`;
}

function renderExplanationBar(){
  return `<div class="calc-bar">
    <button class="share-btn" onclick="shareMemo()">📋 Memo</button>
    <button onclick="closeTool()">Close</button>
  </div>`;
}
