/* ==========================================================================
   OTTO HVAC Toolkit — V1.2
   Engineering Calculation & Reasoning Engine
   Mobile-first PWA for HVAC, refrigeration, public health & electrical work.
   ========================================================================== */

/* ---------- State ---------- */
const STATE = {
  mode: "design",          // "design" | "site"
  lastResult: null,         // string used for Field Memo share
  lastTitle: "OTTO result",
  recog: null,
  micActive: false,
};

/* ---------- Constants ---------- */
const RHO_AIR = 1.2;         // kg/m³ standard density (sea-level UK)
const NU_AIR  = 1.5e-5;      // m²/s kinematic viscosity (~20°C)
const G       = 9.80665;     // m/s²
const CP_W    = 4.186;       // kJ/kg·K
const RHO_W   = 1000;        // kg/m³
const P_ATM   = 101325;      // Pa

/* Refrigerant GWP (AR4 values used by F-Gas Regs) */
const GWP = { R32: 675, "R410A": 2088, R134a: 1430, R290: 3 };

/* Saturation tables — pressure (bar absolute) at temperature (°C).
   Source: simplified ASHRAE / refrigerant manufacturer data, key points. */
const SAT = {
  R32: [
    [-30,2.81],[-20,4.05],[-10,5.71],[0,7.86],[10,10.60],
    [20,13.96],[30,18.16],[40,23.20],[50,29.39]
  ],
  "R410A": [
    [-30,2.69],[-20,4.00],[-10,5.74],[0,7.99],[10,10.81],
    [20,14.27],[30,18.46],[40,23.46],[50,29.36]
  ],
  R134a: [
    [-30,0.85],[-20,1.33],[-10,2.01],[0,2.93],[10,4.15],
    [20,5.72],[30,7.70],[40,10.16],[50,13.18]
  ],
  R290: [
    [-30,1.68],[-20,2.46],[-10,3.48],[0,4.74],[10,6.36],
    [20,8.36],[30,10.79],[40,13.69],[50,17.13]
  ]
};

/* Glycol fluid properties — cp (kJ/kg·K) and ρ (kg/m³) at ~30°C */
const FLUIDS = {
  water:  { name: "Pure Water",         cp: 4.186, rho: 1000 },
  eg20:   { name: "Ethylene Glycol 20%",  cp: 3.85, rho: 1027 },
  eg30:   { name: "Ethylene Glycol 30%",  cp: 3.71, rho: 1041 },
  eg40:   { name: "Ethylene Glycol 40%",  cp: 3.55, rho: 1055 },
  eg50:   { name: "Ethylene Glycol 50%",  cp: 3.39, rho: 1071 },
  pg20:   { name: "Propylene Glycol 20%", cp: 3.97, rho: 1015 },
  pg30:   { name: "Propylene Glycol 30%", cp: 3.85, rho: 1023 },
  pg40:   { name: "Propylene Glycol 40%", cp: 3.72, rho: 1031 },
  pg50:   { name: "Propylene Glycol 50%", cp: 3.58, rho: 1038 }
};

/* Hazen-Williams roughness coefficients */
const HW_C = {
  steel:   110,
  copper:  140,
  plastic: 150
};

/* ---------- DOM helpers ---------- */
const panel      = document.getElementById("toolPanel");
const panelTitle = document.getElementById("panelTitle");
const panelBody  = document.getElementById("panelBody");

function $(id){ return document.getElementById(id); }
function n(id){ return parseFloat($(id)?.value) || 0; }
function v(id){ return $(id)?.value || ""; }
function fmt(x, d=3){ return Number.isFinite(x) ? x.toFixed(d) : "0"; }
function fmtN(x, d=0){ return Number.isFinite(x) ? Math.round(x*Math.pow(10,d))/Math.pow(10,d) : 0; }

/* ---------- Mode toggle ---------- */
function setMode(m){
  STATE.mode = m;
  $("modeDesign").classList.toggle("active", m === "design");
  $("modeSite").classList.toggle("active",   m === "site");
  $("modeDesign").setAttribute("aria-selected", m === "design");
  $("modeSite").setAttribute("aria-selected",   m === "site");
}

/* ---------- Tool registry ---------- */
const TOOLS = {
  duct:      { title: "Duct & Airflow",            html: ductHTML,       calc: calcDuct },
  friction:  { title: "Duct Friction Loss",        html: frictionHTML,   calc: calcFriction },
  grille:    { title: "Grille / Free Area",        html: grilleHTML,     calc: calcGrille },
  psych:     { title: "Psychrometrics",            html: psychHTML,      calc: calcPsych },
  water:     { title: "Water Flow",                html: waterHTML,      calc: calcWater },
  pipe:      { title: "Pipe Friction (Hazen-W)",   html: pipeHTML,       calc: calcPipe },
  expansion: { title: "Expansion Vessel & Pump",   html: expansionHTML,  calc: calcExpansion },
  refcycle:  { title: "Superheat / Subcool",       html: refcycleHTML,   calc: calcRefCycle },
  fgas:      { title: "F-Gas / CO₂e",              html: fgasHTML,       calc: calcFgas },
  refsat:    { title: "Refrigerant Saturation",    html: refsatHTML,     calc: calcRefSat },
  ohm:       { title: "Ohm's Law & 3-Phase",       html: ohmHTML,        calc: calcOhm },
  vdrop:     { title: "Voltage Drop",              html: vdropHTML,      calc: calcVdrop },
  motor:     { title: "Motor Heat Gain",           html: motorHTML,      calc: calcMotor },
  pressure:  { title: "Pressure Converter",        html: pressureHTML,   calc: calcPressure },
  heat:      { title: "Heating / Cooling Convert", html: heatHTML,       calc: calcHeat },
  room:      { title: "Room / ACH",                html: roomHTML,       calc: calcRoom },
  explain:   { title: "Explain My Readings",       html: explainHTML,    calc: calcExplain }
};

function openTool(key){
  const t = TOOLS[key];
  if (!t) return;
  panel.classList.remove("hidden");
  panelTitle.textContent = t.title;
  STATE.lastTitle = "OTTO — " + t.title;
  panelBody.innerHTML = t.html() + calcBar(key);
  panel.scrollIntoView({behavior:"smooth", block:"start"});
}
function closeTool(){ panel.classList.add("hidden"); }
function calcBar(key){
  return `<div class="calc-bar">
    <button class="share-btn" onclick="shareMemo()">📋 Memo</button>
    <button onclick="TOOLS['${key}'].calc()">Calculate</button>
  </div>`;
}

/* ---------- Field Memo / Web Share ---------- */
async function shareMemo(){
  if (!STATE.lastResult) {
    alert("Run a calculation first — the result becomes your shareable memo.");
    return;
  }
  const text = `${STATE.lastTitle}\n\n${stripHTML(STATE.lastResult)}\n\n— Generated by OTTO`;
  try {
    if (navigator.share) {
      await navigator.share({ title: STATE.lastTitle, text });
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      alert("Memo copied to clipboard.");
    } else {
      prompt("Copy this memo:", text);
    }
  } catch (e) { /* user dismissed */ }
}
function stripHTML(s){
  const d = document.createElement("div");
  d.innerHTML = s;
  return d.innerText.replace(/\n{3,}/g, "\n\n").trim();
}
function setResult(elId, html){
  $(elId).innerHTML = html;
  STATE.lastResult = html;
}

/* ---------- Push-to-talk (Web Speech API) ---------- */
function toggleMic(){
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR){ alert("Voice input not supported in this browser."); return; }
  if (STATE.micActive){ STATE.recog?.stop(); return; }
  const r = new SR();
  r.lang = "en-GB";
  r.continuous = false;
  r.interimResults = false;
  r.onstart = () => { STATE.micActive = true; $("micBtn").classList.add("listening"); };
  r.onend   = () => { STATE.micActive = false; $("micBtn").classList.remove("listening"); };
  r.onerror = () => { STATE.micActive = false; $("micBtn").classList.remove("listening"); };
  r.onresult = (e) => {
    const txt = e.results[0][0].transcript;
    $("smartInput").value = txt;
    runSmart();
  };
  STATE.recog = r;
  r.start();
}

/* ---------- Smart input parser ---------- */
function runSmart(){
  const s = $("smartInput").value.toLowerCase().trim();
  const nums = s.match(/[-+]?\d*\.?\d+/g)?.map(Number) || [];
  let out = "I couldn't parse that yet. Try: <em>630 duct 900 l/s</em>, <em>10 mmH2O to Pa</em>, <em>5 kW</em>, <em>superheat r32 7C 8 bar</em>, <em>vdrop 32A 50m 4mm</em>";

  if (s.includes("superheat") || s.includes("subcool")){
    const ref = ["r32","r410a","r134a","r290"].find(k => s.includes(k))?.toUpperCase();
    if (ref && nums.length >= 2){
      const refKey = ref === "R410A" ? "R410A" : ref;
      const tMeas = nums[0], pBar = nums[1];
      const tSat = pToT(refKey, pBar);
      const sh   = tMeas - tSat;
      const verb = s.includes("subcool") ? "Subcool" : "Superheat";
      const val  = s.includes("subcool") ? -sh : sh;
      out = `${verb} for <strong>${refKey}</strong> at ${pBar} bar, ${tMeas}°C measured:<br>
             T<sub>sat</sub> = <strong>${fmt(tSat,1)} °C</strong><br>${verb} = <strong>${fmt(val,1)} K</strong>`;
    }
  } else if (s.includes("vdrop") && nums.length >= 3){
    const I = nums[0], L = nums[1], csa = nums[2];
    const vd = (2 * I * L * 0.0224) / csa; // single-phase, copper, 70°C
    out = `Voltage drop (1-phase, Cu): ${I} A × ${L} m / ${csa} mm² ≈ <strong>${fmt(vd,2)} V</strong>`;
  } else if (s.includes("duct") && nums.length >= 1){
    const d = nums[0]/1000, area = Math.PI * Math.pow(d/2, 2);
    out = `Duct area = <strong>${fmt(area,3)} m²</strong>`;
    if (nums.length >= 2){
      const q = nums[1]/1000;
      const vel = q/area;
      out += `<br>Velocity at ${nums[1]} l/s = <strong>${fmt(vel,2)} m/s</strong> ${velBadge(vel)}`;
    }
  } else if ((s.includes("mmh2o") || s.includes("mm h2o") || s.includes("mmwg")) && nums.length >= 1){
    out = `${nums[0]} mmH₂O = <strong>${fmt(nums[0]*9.80665,1)} Pa</strong>`;
  } else if (s.includes("kw") && nums.length >= 1){
    out = `${nums[0]} kW = <strong>${fmt(nums[0]*3412.142,0)} BTU/hr</strong> = ${fmt(nums[0]/3.51685,2)} TR`;
  } else if (s.includes("ach") && nums.length >= 4){
    const vol = nums[0]*nums[1]*nums[2];
    const ach = (nums[3]*3.6)/vol;
    out = `Volume ${fmt(vol,1)} m³, ACH = <strong>${fmt(ach,2)}</strong>`;
  }
  $("smartResult").innerHTML = out;
}

/* ==========================================================================
   AIR SYSTEMS
   ========================================================================== */

/* ---------- Duct & Airflow (circular, rectangular, flat-oval) ---------- */
function ductHTML(){
  return `
  <div class="field full">
    <label>Duct shape</label>
    <select id="ductShape" onchange="ductShapeUI()">
      <option value="circ">Circular</option>
      <option value="rect">Rectangular</option>
      <option value="oval">Flat-oval</option>
    </select>
  </div>
  <div id="ductDims"></div>
  <div class="form-grid">
    <div class="field"><label>Airflow</label><input id="ductQ" type="number" inputmode="decimal" placeholder="900"></div>
    <div class="field"><label>Unit</label><select id="ductUnit">
      <option value="ls">l/s</option><option value="m3h">m³/h</option><option value="cfm">CFM</option><option value="m3s">m³/s</option>
    </select></div>
  </div>
  <div id="ductOut" class="result muted">Enter dimensions and airflow.</div>`;
}
function ductShapeUI(){
  const shape = v("ductShape");
  const html = shape === "circ"
    ? `<div class="field"><label>Diameter (mm)</label><input id="ductD" type="number" inputmode="decimal" placeholder="630"></div>`
    : shape === "rect"
    ? `<div class="form-grid">
         <div class="field"><label>Width (mm)</label><input id="ductW" type="number" inputmode="decimal" placeholder="600"></div>
         <div class="field"><label>Height (mm)</label><input id="ductH" type="number" inputmode="decimal" placeholder="400"></div>
       </div>`
    : `<div class="form-grid">
         <div class="field"><label>Major axis (mm)</label><input id="ductA" type="number" inputmode="decimal" placeholder="700"></div>
         <div class="field"><label>Minor axis (mm)</label><input id="ductB" type="number" inputmode="decimal" placeholder="400"></div>
       </div>`;
  $("ductDims").innerHTML = html;
}
function toM3s(val,u){
  if(u==="ls")  return val/1000;
  if(u==="m3h") return val/3600;
  if(u==="cfm") return val*0.00047194745;
  return val;
}
function calcDuct(){
  const shape = v("ductShape");
  let area = 0, dh = 0, dimText = "";
  if (shape === "circ"){
    const d = n("ductD")/1000;
    area = Math.PI*Math.pow(d/2,2); dh = d;
    dimText = `Ø ${n("ductD")} mm`;
  } else if (shape === "rect"){
    const w = n("ductW")/1000, h = n("ductH")/1000;
    area = w*h; dh = (2*w*h)/(w+h || 1);
    dimText = `${n("ductW")} × ${n("ductH")} mm`;
  } else {
    const a = n("ductA")/1000, b = n("ductB")/1000;
    area = (Math.PI*b*b/4) + b*(a-b);
    const peri = Math.PI*b + 2*(a-b);
    dh = (4*area)/(peri || 1);
    dimText = `${n("ductA")} × ${n("ductB")} mm flat-oval`;
  }
  const q = n("ductQ"), u = v("ductUnit");
  const qms = toM3s(q,u);
  let html = `<strong>Area: ${fmt(area,4)} m²</strong> &nbsp;<small>(${dimText})</small><br>
              Hydraulic Ø: ${fmt(dh*1000,0)} mm`;
  if (qms > 0 && area > 0){
    const vel = qms/area;
    html += `<br><br><strong>Velocity: ${fmt(vel,2)} m/s</strong> ${velBadge(vel)}<br>
             Airflow: ${fmt(qms*1000,0)} l/s • ${fmt(qms*3600,0)} m³/h • ${fmt(qms/0.00047194745,0)} CFM`;
  }
  html += assumptionFooter("ρ = 1.2 kg/m³ • velocity bands per CIBSE Guide B");
  setResult("ductOut", html);
}
function velBadge(vel){
  if (vel < 2)  return `<span class="badge badge-info">Low velocity</span>`;
  if (vel <= 8) return `<span class="badge badge-good">Within typical commercial range</span>`;
  if (vel <= 15)return `<span class="badge badge-warn">High — check noise / pressure drop</span>`;
  return `<span class="badge badge-bad">Excessive — noise & energy risk</span>`;
}

/* ---------- Duct Friction (Darcy-Weisbach + Colebrook) ---------- */
function frictionHTML(){
  return `
  <div class="form-grid">
    <div class="field"><label>Hydraulic diameter (mm)</label><input id="frD" type="number" inputmode="decimal" placeholder="400"></div>
    <div class="field"><label>Airflow (l/s)</label><input id="frQ" type="number" inputmode="decimal" placeholder="500"></div>
    <div class="field"><label>Material roughness ε (mm)</label><input id="frEps" type="number" inputmode="decimal" value="0.15"></div>
    <div class="field"><label>Length (m, optional)</label><input id="frL" type="number" inputmode="decimal" placeholder="20"></div>
  </div>
  <div id="frOut" class="result muted">Default ε = 0.15 mm (galvanised steel).</div>`;
}
function colebrook(epsD, Re){
  // Solve 1/√f = -2 log10( ε/3.7D + 2.51 / (Re √f) )  iteratively
  let f = 0.02;
  for (let i = 0; i < 30; i++){
    const rhs = -2*Math.log10(epsD/3.7 + 2.51/(Re*Math.sqrt(f)));
    const fNew = 1/(rhs*rhs);
    if (Math.abs(fNew - f) < 1e-6){ f = fNew; break; }
    f = fNew;
  }
  return f;
}
function calcFriction(){
  const dhMm = n("frD"), qLs = n("frQ"), epsMm = n("frEps") || 0.15, L = n("frL");
  const dh = dhMm/1000, q = qLs/1000;
  const area = Math.PI*Math.pow(dh/2,2);
  const vel = q/area;
  const Re  = vel*dh/NU_AIR;
  let html = "";
  if (dh <= 0 || vel <= 0){
    html = `<span class="bad">Enter diameter and airflow.</span>`;
  } else {
    let f, regime;
    if (Re < 2300){ f = 64/Re; regime = "laminar"; }
    else { f = colebrook(epsMm/(dhMm), Re); regime = "turbulent"; }
    const dpPerM = f * (RHO_AIR*vel*vel)/(2*dh);   // Pa/m
    html = `<strong>${fmt(dpPerM,2)} Pa/m</strong>
            <span class="badge ${dpPerM<1?'badge-good':dpPerM<2.5?'badge-warn':'badge-bad'}">${dpPerM<1?'Economical':dpPerM<2.5?'Acceptable':'High loss'}</span>
            <br>Velocity: ${fmt(vel,2)} m/s ${velBadge(vel)}
            <br>Reynolds: ${fmt(Re,0)} (${regime})
            <br>Friction factor f: ${fmt(f,4)}`;
    if (L > 0) html += `<br><br><strong>Total over ${L} m: ${fmt(dpPerM*L,1)} Pa</strong>`;
  }
  html += assumptionFooter(`ε = ${epsMm} mm • ρ = 1.2 kg/m³ • ν = 1.5×10⁻⁵ m²/s • Colebrook-White iterative`);
  setResult("frOut", html);
}

/* ---------- Grille / Free Area ---------- */
function grilleHTML(){
  return `
  <div class="form-grid">
    <div class="field"><label>Width (mm)</label><input id="grW" type="number" inputmode="decimal" placeholder="600"></div>
    <div class="field"><label>Height (mm)</label><input id="grH" type="number" inputmode="decimal" placeholder="300"></div>
    <div class="field"><label>Free area %</label><input id="grFree" type="number" inputmode="decimal" placeholder="60"></div>
    <div class="field"><label>Airflow (l/s)</label><input id="grQ" type="number" inputmode="decimal" placeholder="150"></div>
  </div>
  <div id="grOut" class="result muted">Used for grille and louvre face / free-area checks.</div>`;
}
function calcGrille(){
  const gross = (n("grW")/1000)*(n("grH")/1000);
  const free  = gross*(n("grFree")/100);
  const q     = n("grQ")/1000;
  const vGross = gross > 0 ? q/gross : 0;
  const vFree  = free  > 0 ? q/free  : 0;
  let badge = "";
  if (vFree > 0){
    if      (vFree < 2)  badge = `<span class="badge badge-good">Quiet</span>`;
    else if (vFree < 3)  badge = `<span class="badge badge-warn">Borderline noise</span>`;
    else                 badge = `<span class="badge badge-bad">Noisy — reconsider grille</span>`;
  }
  let html = `<strong>Gross area: ${fmt(gross,3)} m²</strong><br>
              Free area: ${fmt(free,3)} m²<br>
              Face velocity: ${fmt(vGross,2)} m/s<br>
              Free-area velocity: <strong>${fmt(vFree,2)} m/s</strong> ${badge}`;
  html += assumptionFooter("Free-area velocity drives noise rating; CIBSE comfort < 2.5 m/s typical.");
  setResult("grOut", html);
}

/* ---------- Psychrometrics ---------- */
function psychHTML(){
  return `
  <div class="form-grid">
    <div class="field"><label>Dry-bulb T (°C)</label><input id="psT" type="number" inputmode="decimal" placeholder="22"></div>
    <div class="field"><label>Relative humidity %</label><input id="psRH" type="number" inputmode="decimal" placeholder="50"></div>
  </div>
  <fieldset>
    <legend>Mixed Air (optional)</legend>
    <div class="form-grid three">
      <div class="field"><label>OA T (°C)</label><input id="psOaT" type="number" inputmode="decimal" placeholder="2"></div>
      <div class="field"><label>RA T (°C)</label><input id="psRaT" type="number" inputmode="decimal" placeholder="22"></div>
      <div class="field"><label>OA fraction %</label><input id="psOaPct" type="number" inputmode="decimal" placeholder="20"></div>
    </div>
  </fieldset>
  <fieldset>
    <legend>SHR (optional)</legend>
    <div class="form-grid">
      <div class="field"><label>Sensible kW</label><input id="psSen" type="number" inputmode="decimal" placeholder="8"></div>
      <div class="field"><label>Total kW</label><input id="psTot" type="number" inputmode="decimal" placeholder="10"></div>
    </div>
  </fieldset>
  <div id="psOut" class="result muted">Air state, dew point, mixed-air temperature, sensible heat ratio.</div>`;
}
function pSat(T){ return 610.94 * Math.exp(17.625*T/(T+243.04)); } // Pa
function dewPoint(Pw){
  const ln = Math.log(Pw/610.94);
  return 243.04*ln/(17.625-ln);
}
function calcPsych(){
  const T = n("psT"), RH = n("psRH");
  const ps = pSat(T), pw = (RH/100)*ps;
  const W  = 0.622*pw/(P_ATM-pw);                       // kg/kg dry air
  const h  = 1.006*T + W*(2501 + 1.86*T);                // kJ/kg
  const Td = dewPoint(pw);
  let html = `<strong>${fmt(T,1)} °C, ${fmt(RH,0)}% RH</strong><br>
              Humidity ratio W = <strong>${fmt(W*1000,2)} g/kg</strong><br>
              Enthalpy h = <strong>${fmt(h,2)} kJ/kg</strong><br>
              Dew point = <strong>${fmt(Td,1)} °C</strong><br>
              Sat. vapour p = ${fmt(ps,0)} Pa • partial p = ${fmt(pw,0)} Pa`;
  const oaT = n("psOaT"), raT = n("psRaT"), oaPct = n("psOaPct");
  if (oaPct > 0){
    const f = oaPct/100;
    const Tmix = f*oaT + (1-f)*raT;
    html += `<br><br><h4>Mixed Air</h4>T<sub>mix</sub> = <strong>${fmt(Tmix,1)} °C</strong> (${oaPct}% OA)`;
  }
  const sen = n("psSen"), tot = n("psTot");
  if (tot > 0){
    const shr = sen/tot;
    let badge = shr >= 0.7 ? `<span class="badge badge-good">Sensible-led</span>`
              : shr >= 0.5 ? `<span class="badge badge-warn">Mixed load</span>`
              :              `<span class="badge badge-bad">Latent-led — check coil</span>`;
    html += `<br><br><h4>Sensible Heat Ratio</h4>SHR = <strong>${fmt(shr,2)}</strong> ${badge}`;
  }
  if (Td > T - 2 && RH > 0) html += `<br><br><span class="badge badge-warn">Surface condensation risk — within 2 K of dew point</span>`;
  html += assumptionFooter("Magnus equation • P = 101.325 kPa • h, W in dry-air basis");
  setResult("psOut", html);
}

/* ==========================================================================
   WATER & PUBLIC HEALTH
   ========================================================================== */

function fluidSelectHTML(id){
  return `<select id="${id}">
    ${Object.entries(FLUIDS).map(([k,f]) => `<option value="${k}">${f.name}</option>`).join("")}
  </select>`;
}

function waterHTML(){
  return `
  <div class="form-grid">
    <div class="field full"><label>Fluid</label>${fluidSelectHTML("watFluid")}</div>
    <div class="field"><label>Duty (kW)</label><input id="watKw" type="number" inputmode="decimal" placeholder="10"></div>
    <div class="field"><label>ΔT (°C)</label><input id="watDt" type="number" inputmode="decimal" placeholder="5"></div>
  </div>
  <div id="watOut" class="result muted">Q = kW ÷ (cp × ρ × ΔT). Glycol mixes reduce capacity vs water.</div>`;
}
function calcWater(){
  const f = FLUIDS[v("watFluid")] || FLUIDS.water;
  const kw = n("watKw"), dt = n("watDt");
  if (kw <= 0 || dt <= 0){ setResult("watOut", `<span class="bad">Enter duty and ΔT.</span>`); return; }
  // Q (m³/s) = kW (kJ/s) / (cp × ρ × ΔT)
  const qm3s = kw / (f.cp * f.rho * dt);
  const ls   = qm3s*1000, lpm = ls*60, m3h = qm3s*3600;
  const penalty = ((4.186*1000)/(f.cp*f.rho) - 1)*100;
  let html = `<strong>${fmt(ls,3)} l/s</strong><br>
              ${fmt(lpm,1)} l/min • ${fmt(m3h,2)} m³/h<br>
              Fluid: ${f.name} • cp = ${f.cp} kJ/kg·K • ρ = ${f.rho} kg/m³`;
  if (Math.abs(penalty) > 0.5){
    html += `<br><span class="badge badge-warn">+${fmt(penalty,1)}% flow vs pure water for same duty</span>`;
  }
  html += assumptionFooter("Properties at ~30 °C nominal • increase pump head allowance for glycol viscosity.");
  setResult("watOut", html);
}

/* ---------- Pipe Friction (Hazen-Williams) ---------- */
function pipeHTML(){
  return `
  <div class="form-grid">
    <div class="field"><label>Internal diameter (mm)</label><input id="pipD" type="number" inputmode="decimal" placeholder="50"></div>
    <div class="field"><label>Flow (l/s)</label><input id="pipQ" type="number" inputmode="decimal" placeholder="2"></div>
    <div class="field full"><label>Material</label>
      <select id="pipMat">
        <option value="steel">Steel (C ≈ 110)</option>
        <option value="copper">Copper (C ≈ 140)</option>
        <option value="plastic">Plastic / PEX (C ≈ 150)</option>
      </select>
    </div>
    <div class="field"><label>Length (m, optional)</label><input id="pipL" type="number" inputmode="decimal" placeholder="30"></div>
  </div>
  <div id="pipOut" class="result muted">Hazen-Williams head loss in m/m water column.</div>`;
}
function calcPipe(){
  const dM = n("pipD")/1000, qm3s = n("pipQ")/1000, C = HW_C[v("pipMat")] || 120, L = n("pipL");
  if (dM <= 0 || qm3s <= 0){ setResult("pipOut", `<span class="bad">Enter diameter and flow.</span>`); return; }
  // hL/L (m/m) = 10.67 × Q^1.852 / ( C^1.852 × D^4.87 )
  const hLperM = 10.67 * Math.pow(qm3s,1.852) / (Math.pow(C,1.852) * Math.pow(dM,4.87));
  const paPerM = hLperM * RHO_W * G;
  const area = Math.PI*Math.pow(dM/2,2);
  const vel = qm3s/area;
  let badge = vel < 1 ? `<span class="badge badge-good">Quiet</span>`
            : vel < 2 ? `<span class="badge badge-warn">Acceptable</span>`
            :           `<span class="badge badge-bad">Erosion / noise risk</span>`;
  let html = `<strong>${fmt(hLperM*1000,2)} mm/m</strong> head loss<br>
              ≈ <strong>${fmt(paPerM,1)} Pa/m</strong><br>
              Velocity: ${fmt(vel,2)} m/s ${badge}<br>
              C-coefficient: ${C}`;
  if (L > 0) html += `<br><br><strong>Total over ${L} m: ${fmt(hLperM*L,3)} m head ≈ ${fmt(paPerM*L/1000,1)} kPa</strong>`;
  html += assumptionFooter("Hazen-Williams empirical (water, ~10–40 °C). For glycol, derate flow with viscosity correction.");
  setResult("pipOut", html);
}

/* ---------- Expansion Vessel & Pump ---------- */
function expansionHTML(){
  return `
  <fieldset>
    <legend>Expansion Vessel</legend>
    <div class="form-grid">
      <div class="field"><label>System volume (litres)</label><input id="evV" type="number" inputmode="decimal" placeholder="500"></div>
      <div class="field"><label>Cold fill temp (°C)</label><input id="evT1" type="number" inputmode="decimal" value="10"></div>
      <div class="field"><label>Operating temp (°C)</label><input id="evT2" type="number" inputmode="decimal" value="80"></div>
      <div class="field"><label>Pre-charge (bar g)</label><input id="evP1" type="number" inputmode="decimal" value="1"></div>
      <div class="field"><label>PRV / max (bar g)</label><input id="evP2" type="number" inputmode="decimal" value="3"></div>
    </div>
  </fieldset>
  <fieldset>
    <legend>Pump Duty</legend>
    <div class="form-grid">
      <div class="field"><label>Flow (l/s)</label><input id="pmpQ" type="number" inputmode="decimal" placeholder="2"></div>
      <div class="field"><label>Head (m)</label><input id="pmpH" type="number" inputmode="decimal" placeholder="10"></div>
      <div class="field"><label>Efficiency (%)</label><input id="pmpEff" type="number" inputmode="decimal" value="65"></div>
    </div>
  </fieldset>
  <div id="exOut" class="result muted">Vessel uses Boyle's Law; pump kW = ρgQH ÷ η.</div>`;
}
function waterExpansion(t1, t2){
  // Specific volume of water at T (°C) — approximation
  const sv = T => 1/(1000 - 0.005*(T-4)*(T-4));
  return (sv(t2) - sv(t1)) / sv(t1);
}
function calcExpansion(){
  const V = n("evV"), t1 = n("evT1"), t2 = n("evT2"), p1 = n("evP1"), p2 = n("evP2");
  let html = "";
  if (V > 0 && t2 > t1 && p2 > p1){
    const eps = waterExpansion(t1, t2);
    const expansion = V * eps;
    const ratio = (p1+1)/(p2+1);
    const Vvessel = expansion / (1 - ratio);
    html += `<h4>Expansion Vessel</h4>
             Water expansion: <strong>${fmt(expansion,2)} L</strong> (${fmt(eps*100,2)}%)<br>
             Min vessel size: <strong>${fmt(Vvessel,1)} L</strong> (pre-charge ${p1} barg → max ${p2} barg)`;
  }
  const Q = n("pmpQ")/1000, H = n("pmpH"), eff = n("pmpEff")/100;
  if (Q > 0 && H > 0 && eff > 0){
    const kwHyd = RHO_W*G*Q*H/1000;
    const kwShaft = kwHyd/eff;
    html += (html?"<br><br>":"") + `<h4>Pump Duty</h4>
            Hydraulic power: <strong>${fmt(kwHyd,2)} kW</strong><br>
            Shaft power @ ${(eff*100)|0}% η: <strong>${fmt(kwShaft,2)} kW</strong>`;
  }
  if (!html) html = `<span class="bad">Fill in either vessel or pump section.</span>`;
  html += assumptionFooter("Vessel sizing per BS EN 12828 simplified; uplift 10–25% in practice.");
  setResult("exOut", html);
}

/* ==========================================================================
   REFRIGERATION
   ========================================================================== */

function pToT(ref, pBar){
  const tbl = SAT[ref]; if (!tbl) return NaN;
  for (let i = 0; i < tbl.length-1; i++){
    const [t1,p1] = tbl[i], [t2,p2] = tbl[i+1];
    if (pBar >= p1 && pBar <= p2) return t1 + (t2-t1)*(pBar-p1)/(p2-p1);
  }
  if (pBar < tbl[0][1]) return tbl[0][0];
  return tbl[tbl.length-1][0];
}
function tToP(ref, t){
  const tbl = SAT[ref]; if (!tbl) return NaN;
  for (let i = 0; i < tbl.length-1; i++){
    const [t1,p1] = tbl[i], [t2,p2] = tbl[i+1];
    if (t >= t1 && t <= t2) return p1 + (p2-p1)*(t-t1)/(t2-t1);
  }
  if (t < tbl[0][0]) return tbl[0][1];
  return tbl[tbl.length-1][1];
}

function refSelectHTML(id){
  return `<select id="${id}">
    <option value="R32">R32</option>
    <option value="R410A">R410A</option>
    <option value="R134a">R134a</option>
    <option value="R290">R290 (propane)</option>
  </select>`;
}

function refcycleHTML(){
  return `
  <div class="field full"><label>Refrigerant</label>${refSelectHTML("rcRef")}</div>
  <fieldset>
    <legend>Suction (Superheat)</legend>
    <div class="form-grid">
      <div class="field"><label>Suction pressure (bar g)</label><input id="rcSucP" type="number" inputmode="decimal" placeholder="8"></div>
      <div class="field"><label>Suction line T (°C)</label><input id="rcSucT" type="number" inputmode="decimal" placeholder="12"></div>
    </div>
  </fieldset>
  <fieldset>
    <legend>Liquid (Subcool)</legend>
    <div class="form-grid">
      <div class="field"><label>Discharge pressure (bar g)</label><input id="rcDisP" type="number" inputmode="decimal" placeholder="22"></div>
      <div class="field"><label>Liquid line T (°C)</label><input id="rcLiqT" type="number" inputmode="decimal" placeholder="35"></div>
    </div>
  </fieldset>
  <div id="rcOut" class="result muted">Pressures are gauge; tool adds 1 bar for absolute lookup.</div>`;
}
function calcRefCycle(){
  const ref = v("rcRef");
  let html = "";
  const sucP = n("rcSucP"), sucT = n("rcSucT");
  if (sucP > 0 || sucT !== 0){
    const tSat = pToT(ref, sucP+1);
    const sh   = sucT - tSat;
    const tgt  = ref === "R290" ? "5–10 K" : "5–8 K";
    const badge = sh < 3 ? `<span class="badge badge-bad">Low — flood-back risk</span>`
                : sh > 12 ? `<span class="badge badge-bad">High — undercharge / TXV starving</span>`
                : sh > 8  ? `<span class="badge badge-warn">High end of range</span>`
                :           `<span class="badge badge-good">Within typical band</span>`;
    html += `<h4>Superheat</h4>T<sub>sat</sub> @ ${sucP} barg = ${fmt(tSat,1)} °C<br>
             Superheat = <strong>${fmt(sh,1)} K</strong> ${badge}<br>
             <small>Target ${tgt} for typical evaporator</small>`;
  }
  const disP = n("rcDisP"), liqT = n("rcLiqT");
  if (disP > 0 || liqT !== 0){
    const tSat = pToT(ref, disP+1);
    const sc = tSat - liqT;
    const badge = sc < 3 ? `<span class="badge badge-bad">Low — undercharge / flash gas</span>`
                : sc > 15 ? `<span class="badge badge-warn">High — overcharge / restricted flow</span>`
                :           `<span class="badge badge-good">Within typical 5–10 K band</span>`;
    html += (html?"<br><br>":"") + `<h4>Subcool</h4>T<sub>sat</sub> @ ${disP} barg = ${fmt(tSat,1)} °C<br>
            Subcool = <strong>${fmt(sc,1)} K</strong> ${badge}`;
  }
  if (!html) html = `<span class="bad">Enter suction or discharge data.</span>`;
  html += assumptionFooter(`Saturation table for ${ref}, linear interpolation • +1 bar for absolute conversion`);
  setResult("rcOut", html);
}

/* ---------- F-Gas / CO2e ---------- */
function fgasHTML(){
  return `
  <div class="field full"><label>Refrigerant</label>${refSelectHTML("fgRef")}</div>
  <div class="form-grid">
    <div class="field"><label>Charge (kg)</label><input id="fgKg" type="number" inputmode="decimal" placeholder="5"></div>
  </div>
  <div id="fgOut" class="result muted">CO₂e = charge × GWP. Triggers F-Gas leak-check intervals.</div>`;
}
function calcFgas(){
  const ref = v("fgRef"), kg = n("fgKg");
  const gwp = GWP[ref] || 0;
  const tco2 = kg*gwp/1000;
  const interval = tco2 < 5 ? "No mandatory check" :
                   tco2 < 50 ? "12-monthly checks" :
                   tco2 < 500 ? "6-monthly checks (3-monthly without leak detection)" :
                                "3-monthly checks (with permanent leak detection)";
  const phaseDown = ref === "R410A" ? `<span class="badge badge-warn">High GWP — phase-down candidate</span>`
                   : ref === "R134a" ? `<span class="badge badge-warn">High GWP</span>`
                   : ref === "R32"   ? `<span class="badge badge-info">Mid GWP — A2L flammable</span>`
                   :                    `<span class="badge badge-good">Very low GWP — A3 flammable</span>`;
  let html = `<strong>${fmt(tco2,2)} tCO₂e</strong> ${phaseDown}<br>
              ${kg} kg ${ref} × GWP ${gwp}<br><br>
              <h4>F-Gas Regulation Status</h4>${interval}`;
  html += assumptionFooter("EU/UK F-Gas Reg 517/2014 thresholds (5 / 50 / 500 tCO₂e). GWP per AR4.");
  setResult("fgOut", html);
}

/* ---------- Refrigerant Saturation Lookup ---------- */
function refsatHTML(){
  return `
  <div class="field full"><label>Refrigerant</label>${refSelectHTML("rsRef")}</div>
  <div class="form-grid">
    <div class="field"><label>Mode</label>
      <select id="rsMode">
        <option value="t2p">Temperature → Pressure</option>
        <option value="p2t">Pressure → Temperature</option>
      </select>
    </div>
    <div class="field"><label>Value</label><input id="rsVal" type="number" inputmode="decimal" placeholder="5"></div>
  </div>
  <div id="rsOut" class="result muted">Linear interpolation between table points.</div>`;
}
function calcRefSat(){
  const ref = v("rsRef"), mode = v("rsMode"), val = n("rsVal");
  let html = "";
  if (mode === "t2p"){
    const p = tToP(ref, val);
    html = `${ref} sat. T = ${val} °C → <strong>${fmt(p,2)} bar abs</strong> (${fmt(p-1,2)} bar g)`;
  } else {
    const t = pToT(ref, val);
    html = `${ref} sat. P = ${val} bar abs → <strong>${fmt(t,1)} °C</strong>`;
  }
  html += assumptionFooter(`Lookup table 9 points (-30 to +50 °C) • interpolated`);
  setResult("rsOut", html);
}

/* ==========================================================================
   ELECTRICAL
   ========================================================================== */

function ohmHTML(){
  return `
  <div class="field full"><label>Configuration</label>
    <select id="ohmCfg">
      <option value="1ph">Single-phase (V × I × pf)</option>
      <option value="3ph">Three-phase (√3 × V<sub>LL</sub> × I × pf)</option>
      <option value="dc">DC / Resistive (V × I)</option>
    </select>
  </div>
  <div class="form-grid">
    <div class="field"><label>Voltage (V)</label><input id="ohmV" type="number" inputmode="decimal" placeholder="400"></div>
    <div class="field"><label>Current (A)</label><input id="ohmI" type="number" inputmode="decimal" placeholder="16"></div>
    <div class="field"><label>Power factor</label><input id="ohmPf" type="number" inputmode="decimal" value="0.85"></div>
  </div>
  <div id="ohmOut" class="result muted">Computes real power and resistance.</div>`;
}
function calcOhm(){
  const cfg = v("ohmCfg"), V = n("ohmV"), I = n("ohmI"), pf = n("ohmPf") || 1;
  let P;
  if (cfg === "1ph") P = V*I*pf;
  else if (cfg === "3ph") P = Math.sqrt(3)*V*I*pf;
  else P = V*I;
  const R = I > 0 ? V/I : 0;
  let html = `<strong>${fmt(P/1000,3)} kW</strong> (${fmt(P,0)} W)<br>
              Apparent: ${fmt((cfg==="3ph"?Math.sqrt(3)*V*I:V*I)/1000,3)} kVA<br>
              Resistance V/I: ${fmt(R,2)} Ω`;
  html += assumptionFooter("Power factor 0.85 default for inductive loads. DC ignores pf.");
  setResult("ohmOut", html);
}

function vdropHTML(){
  return `
  <div class="form-grid">
    <div class="field"><label>Phase</label>
      <select id="vdCfg"><option value="1ph">Single-phase</option><option value="3ph">Three-phase</option></select>
    </div>
    <div class="field"><label>System V</label><input id="vdV" type="number" inputmode="decimal" value="230"></div>
    <div class="field"><label>Current (A)</label><input id="vdI" type="number" inputmode="decimal" placeholder="32"></div>
    <div class="field"><label>Length (m, one way)</label><input id="vdL" type="number" inputmode="decimal" placeholder="50"></div>
    <div class="field"><label>CSA (mm²)</label><input id="vdCsa" type="number" inputmode="decimal" placeholder="6"></div>
    <div class="field"><label>Power factor</label><input id="vdPf" type="number" inputmode="decimal" value="0.95"></div>
  </div>
  <div id="vdOut" class="result muted">BS 7671 limits: 3% lighting, 5% power. Cu @ 70 °C.</div>`;
}
function calcVdrop(){
  const cfg = v("vdCfg"), V = n("vdV"), I = n("vdI"), L = n("vdL"), csa = n("vdCsa"), pf = n("vdPf") || 1;
  if (csa <= 0 || L <= 0 || I <= 0){ setResult("vdOut", `<span class="bad">Fill in I, L and CSA.</span>`); return; }
  // ρ_cu @ 70°C ≈ 0.0224 Ω·mm²/m
  const Rper = 0.0224 / csa;
  const vd = (cfg === "1ph" ? 2 : Math.sqrt(3)) * I * L * Rper * pf;
  const pct = V > 0 ? vd/V*100 : 0;
  const limit = 5;
  const badge = pct <= 3 ? `<span class="badge badge-good">Within lighting limit (3%)</span>`
              : pct <= 5 ? `<span class="badge badge-warn">Within power limit (5%)</span>`
              :            `<span class="badge badge-bad">Exceeds BS 7671 5% — uprate cable</span>`;
  let html = `<strong>${fmt(vd,2)} V drop</strong> (${fmt(pct,2)} %) ${badge}<br>
              Cable resistance: ${fmt(Rper*1000,3)} mΩ/m<br>
              Total loop R: ${fmt((cfg==="1ph"?2:1)*L*Rper,3)} Ω`;
  html += assumptionFooter("Copper @ 70 °C, ρ = 0.0224 Ω·mm²/m. Excludes reactance — fine ≤ 16 mm². Above that, use BS 7671 mV/A/m tables.");
  setResult("vdOut", html);
}

function motorHTML(){
  return `
  <div class="form-grid">
    <div class="field"><label>Motor input (kW)</label><input id="mtKw" type="number" inputmode="decimal" placeholder="7.5"></div>
    <div class="field"><label>Efficiency (%)</label><input id="mtEff" type="number" inputmode="decimal" value="88"></div>
    <div class="field full"><label>Motor location</label>
      <select id="mtLoc">
        <option value="in">Inside conditioned space</option>
        <option value="out">Outside (drive only inside)</option>
      </select>
    </div>
  </div>
  <div id="mtOut" class="result muted">Heat gain from motor losses (and full input if inside space).</div>`;
}
function calcMotor(){
  const kw = n("mtKw"), eff = n("mtEff")/100, loc = v("mtLoc");
  if (kw <= 0 || eff <= 0){ setResult("mtOut", `<span class="bad">Enter motor kW and efficiency.</span>`); return; }
  const losses = kw*(1-eff);
  const heatToSpace = loc === "in" ? kw : losses;
  let html = `<strong>${fmt(heatToSpace,2)} kW</strong> heat to space<br>
              Motor losses: ${fmt(losses,2)} kW (${fmt((1-eff)*100,1)}%)<br>
              Input power: ${fmt(kw,2)} kW @ ${fmt(eff*100,0)}% η`;
  if (loc === "in") html += `<br><span class="badge badge-info">All input becomes space heat (driven equipment also inside).</span>`;
  html += assumptionFooter("Use motor losses only when shaft work leaves the conditioned space (e.g. outdoor fan).");
  setResult("mtOut", html);
}

/* ==========================================================================
   GENERAL CONVERSIONS
   ========================================================================== */

function pressureHTML(){
  return `
  <div class="form-grid">
    <div class="field"><label>Value</label><input id="pressVal" type="number" inputmode="decimal" placeholder="10"></div>
    <div class="field"><label>From unit</label><select id="pressUnit">
      <option value="mmh2o">mmH₂O</option><option value="pa">Pa</option><option value="kpa">kPa</option>
      <option value="inwg">in.wg</option><option value="bar">bar</option><option value="psi">PSI</option>
    </select></div>
  </div>
  <div id="pressOut" class="result muted">Tap any unit chip on a result to cycle.</div>`;
}
function pressureToPa(val,u){
  if(u==="mmh2o") return val*9.80665;
  if(u==="kpa")   return val*1000;
  if(u==="inwg")  return val*249.0889;
  if(u==="psi")   return val*6894.757;
  if(u==="bar")   return val*100000;
  return val;
}
function calcPressure(){
  const pa = pressureToPa(n("pressVal"), v("pressUnit"));
  const html = `<strong>${fmt(pa,1)} Pa</strong><br>
                ${fmt(pa/1000,3)} kPa<br>
                ${fmt(pa/9.80665,2)} mmH₂O<br>
                ${fmt(pa/249.0889,3)} in.wg<br>
                ${fmt(pa/100000,5)} bar<br>
                ${fmt(pa/6894.757,4)} PSI` + assumptionFooter("1 mmH₂O = 9.80665 Pa • 1 in.wg = 249.0889 Pa");
  setResult("pressOut", html);
}

function heatHTML(){
  return `
  <div class="field"><label>Capacity (kW)</label><input id="kwVal" type="number" inputmode="decimal" placeholder="5"></div>
  <div id="heatOut" class="result muted">Converts kW to BTU/hr and TR.</div>`;
}
function calcHeat(){
  const kw = n("kwVal");
  setResult("heatOut",
    `<strong>${fmt(kw,2)} kW</strong><br>${fmt(kw*3412.142,0)} BTU/hr<br>${fmt(kw/3.51685,2)} TR`
    + assumptionFooter("1 TR = 3.51685 kW • 1 kW = 3412.14 BTU/hr"));
}

function roomHTML(){
  return `
  <div class="form-grid">
    <div class="field"><label>Length (m)</label><input id="rmL" type="number" inputmode="decimal" placeholder="6"></div>
    <div class="field"><label>Width (m)</label><input id="rmW" type="number" inputmode="decimal" placeholder="4"></div>
    <div class="field"><label>Height (m)</label><input id="rmH" type="number" inputmode="decimal" placeholder="2.4"></div>
    <div class="field"><label>Airflow (l/s)</label><input id="rmQ" type="number" inputmode="decimal" placeholder="100"></div>
  </div>
  <div id="rmOut" class="result muted">Volume and air-changes-per-hour.</div>`;
}
function calcRoom(){
  const vol = n("rmL")*n("rmW")*n("rmH");
  const m3h = n("rmQ")*3.6;
  const ach = vol > 0 ? m3h/vol : 0;
  let badge = ach < 1   ? `<span class="badge badge-bad">Insufficient for occupied space</span>`
            : ach < 4   ? `<span class="badge badge-good">Office / general (Bldg Regs F)</span>`
            : ach < 10  ? `<span class="badge badge-good">Meeting / classroom</span>`
            : ach < 20  ? `<span class="badge badge-warn">High — kitchen / lab</span>`
            :             `<span class="badge badge-warn">Very high — cleanroom / fume</span>`;
  setResult("rmOut",
    `<strong>Volume: ${fmt(vol,1)} m³</strong><br>Airflow: ${fmt(m3h,0)} m³/h<br>
     ACH: <strong>${fmt(ach,2)}</strong> ${badge}`
     + assumptionFooter("ACH guides per CIBSE Guide A / ApprovedDoc F."));
}

/* ==========================================================================
   EXPLAIN MY READINGS — V2.0 diagnostic engine
   ========================================================================== */

function explainHTML(){
  return `
  <p class="muted" style="margin-top:0">Compare current site readings against design (or last service) to surface common faults.</p>
  <fieldset>
    <legend>Airflow & Pressure</legend>
    <div class="form-grid">
      <div class="field"><label>Design / previous flow (l/s)</label><input id="exQDes" type="number" inputmode="decimal" placeholder="500"></div>
      <div class="field"><label>Current flow (l/s)</label><input id="exQNow" type="number" inputmode="decimal" placeholder="380"></div>
      <div class="field"><label>Design / previous static (Pa)</label><input id="exPDes" type="number" inputmode="decimal" placeholder="250"></div>
      <div class="field"><label>Current static (Pa)</label><input id="exPNow" type="number" inputmode="decimal" placeholder="320"></div>
      <div class="field"><label>Fan speed now (%)</label><input id="exFan" type="number" inputmode="decimal" placeholder="100"></div>
    </div>
  </fieldset>
  <fieldset>
    <legend>Filter</legend>
    <div class="form-grid">
      <div class="field"><label>Clean filter ΔP (Pa)</label><input id="exFltClean" type="number" inputmode="decimal" placeholder="50"></div>
      <div class="field"><label>Current filter ΔP (Pa)</label><input id="exFltNow" type="number" inputmode="decimal" placeholder="180"></div>
    </div>
  </fieldset>
  <fieldset>
    <legend>Coil</legend>
    <div class="form-grid">
      <div class="field"><label>Design coil ΔT (K)</label><input id="exDtDes" type="number" inputmode="decimal" placeholder="6"></div>
      <div class="field"><label>Current coil ΔT (K)</label><input id="exDtNow" type="number" inputmode="decimal" placeholder="3.5"></div>
      <div class="field"><label>Coil air ΔP design (Pa)</label><input id="exCoilDes" type="number" inputmode="decimal" placeholder="80"></div>
      <div class="field"><label>Coil air ΔP now (Pa)</label><input id="exCoilNow" type="number" inputmode="decimal" placeholder="140"></div>
    </div>
  </fieldset>
  <div id="exOut" class="result muted">Plain-English findings + recommended actions.</div>`;
}
function calcExplain(){
  const Qd = n("exQDes"), Qn = n("exQNow"), Pd = n("exPDes"), Pn = n("exPNow"), fan = n("exFan");
  const Fc = n("exFltClean"), Fn = n("exFltNow");
  const dTd = n("exDtDes"), dTn = n("exDtNow"), Cd = n("exCoilDes"), Cn = n("exCoilNow");
  const findings = [];

  // Filter loading
  if (Fc > 0 && Fn > 0){
    const ratio = Fn/Fc;
    if (ratio >= 3)       findings.push({lvl:"red",   icon:"🟥", title:"Filter heavily loaded",       body:`Filter ΔP is ${fmt(ratio,1)}× clean (${Fc}→${Fn} Pa). Replace immediately — final-resistance threshold reached.`});
    else if (ratio >= 1.8)findings.push({lvl:"amber", icon:"🟧", title:"Filter approaching change-out",body:`Filter ΔP up ${fmt((ratio-1)*100,0)}% over clean. Schedule replacement within current visit.`});
    else                  findings.push({lvl:"green", icon:"🟩", title:"Filter OK",                    body:`Filter ΔP only ${fmt((ratio-1)*100,0)}% over clean — within service interval.`});
  }
  // Airflow shortfall
  if (Qd > 0 && Qn > 0){
    const drop = (Qd - Qn)/Qd;
    if (drop > 0.20)      findings.push({lvl:"red",   icon:"🟥", title:"Airflow significantly low", body:`Current flow is ${fmt(drop*100,0)}% below design (${fmt(Qd)} → ${fmt(Qn)} l/s). System resistance high or fan failing.`});
    else if (drop > 0.10) findings.push({lvl:"amber", icon:"🟧", title:"Airflow below tolerance",   body:`Current flow ${fmt(drop*100,0)}% below design — outside BSRIA ±10% commissioning band.`});
    else if (drop < -0.10)findings.push({lvl:"amber", icon:"🟧", title:"Airflow above design",      body:`Flow is ${fmt(-drop*100,0)}% over design — check dampers fully modulating, not stuck open.`});
    else                  findings.push({lvl:"green", icon:"🟩", title:"Airflow within ±10%",       body:`Flow inside BSRIA tolerance band.`});
  }
  // Pressure rise vs flow drop → blockage signature
  if (Pd > 0 && Pn > 0 && Qd > 0 && Qn > 0){
    const dP = (Pn - Pd)/Pd, dQ = (Qd - Qn)/Qd;
    if (dP > 0.15 && dQ > 0.10){
      findings.push({lvl:"red", icon:"🟥", title:"Likely duct blockage / closed damper",
        body:`Static rose ${fmt(dP*100,0)}% while flow fell ${fmt(dQ*100,0)}%. Classic added-resistance signature — inspect dampers, fire-dampers and louvres downstream.`});
    }
  }
  // Fan at 100% but flow short
  if (fan >= 99 && Qd > 0 && Qn > 0 && (Qd-Qn)/Qd > 0.05){
    findings.push({lvl:"amber", icon:"🟧", title:"Fan at 100 % but cannot meet design",
      body:`VSD is maxed yet flow short. Check belt/coupling, duct leakage, filter condition, or revisit fan curve vs added system resistance.`});
  }
  // Coil fouling
  if (Cd > 0 && Cn > 0){
    const r = Cn/Cd;
    if (r >= 1.5) findings.push({lvl:"red",   icon:"🟥", title:"Coil air-side fouled",         body:`Coil ΔP up ${fmt((r-1)*100,0)}%. Strip and clean — heat-transfer area is bridged with debris.`});
    else if (r >= 1.2) findings.push({lvl:"amber", icon:"🟧", title:"Coil air-side soiling",   body:`Coil ΔP up ${fmt((r-1)*100,0)}%. Plan a coil clean at next service.`});
  }
  // Coil capacity loss
  if (dTd > 0 && dTn > 0){
    const lost = (dTd - dTn)/dTd;
    if (lost > 0.30)      findings.push({lvl:"red",   icon:"🟥", title:"Significant capacity loss", body:`Coil ΔT down ${fmt(lost*100,0)}% (${fmt(dTd)}→${fmt(dTn)} K). Likely combination of low water flow, air bypass, or fouling.`});
    else if (lost > 0.15) findings.push({lvl:"amber", icon:"🟧", title:"Capacity drift",            body:`Coil ΔT down ${fmt(lost*100,0)}% — flag at handover and revisit at next service.`});
  }

  if (!findings.length){
    findings.push({lvl:"green", icon:"🟩", title:"No anomalies detected", body:"All entered values are within typical commissioning tolerance bands."});
  }
  let html = `<h4>${findings.length} Finding${findings.length>1?"s":""}</h4>` +
             findings.map(f => `<div class="finding ${f.lvl}">
               <div class="finding-icon">${f.icon}</div>
               <div class="finding-body"><strong>${f.title}</strong><small>${f.body}</small></div>
             </div>`).join("");
  html += assumptionFooter("Heuristic ruleset — BSRIA / CIBSE tolerance bands. Always confirm with hands-on inspection.");
  setResult("exOut", html);
}

/* ---------- Common assumption footer ---------- */
function assumptionFooter(text){
  return `<div class="assumption">📐 ${text}</div>`;
}

/* ---------- Service worker ---------- */
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js").catch(()=>{});
}
