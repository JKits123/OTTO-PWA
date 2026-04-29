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
