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
/* fmtSmart — magnitude-aware: never more than 3 dp, drops decimals on big
   numbers, adds locale thousands separators. Use for headline result values. */
function fmtSmart(x){
  if (!Number.isFinite(x)) return "0";
  const abs = Math.abs(x);
  if (abs === 0)        return "0";
  let dp;
  if      (abs >= 10000) dp = 0;
  else if (abs >= 1000)  dp = 1;
  else if (abs >= 100)   dp = 2;
  else if (abs >= 10)    dp = 2;
  else if (abs >= 1)     dp = 3;
  else if (abs >= 0.01)  dp = 3;
  else                   return x.toExponential(2);
  return x.toLocaleString("en-GB", {minimumFractionDigits:0, maximumFractionDigits:dp});
}

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
  duct:      { title: "Duct Sizer (live)",         html: ductHTML,       calc: recomputeDuct, init: ductInit },
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
  if (typeof t.init === "function") t.init();
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

/* ---------- Smart input parser (V1.2 — natural-phrase) ----------
   Each handler has match(s) → bool and run(s, nums) → html|null.
   First handler whose match passes AND whose run returns truthy wins.
   Specific tools first; generic conversions last so they catch leftovers. */

function detectRef(s){
  if (/\br32\b/.test(s))               return "R32";
  if (/\br410a?\b/.test(s))            return "R410A";
  if (/\br134a?\b/.test(s))            return "R134a";
  if (/\br290\b|propane/.test(s))      return "R290";
  return null;
}
function detectMaterial(s){
  if (/copper/.test(s))                       return "copper";
  if (/plastic|pex|hdpe|mdpe|ppr/.test(s))    return "plastic";
  return "steel";
}
function extractFirst(s, unitPattern){
  const m = s.match(new RegExp(`([-+]?\\d*\\.?\\d+)\\s*(?:${unitPattern})`, "i"));
  return m ? parseFloat(m[1]) : null;
}
function extractFlowMs(s){
  const pats = [
    [/([-+]?\d*\.?\d+)\s*(?:l\/s|ls\b|litres?\s*(?:per|\/)?\s*second)/i,           1/1000],
    [/([-+]?\d*\.?\d+)\s*(?:m3\/h|m3h|m³\/h|m\^3\/h|cubic\s*metres?\s*per\s*hour)/i, 1/3600],
    [/([-+]?\d*\.?\d+)\s*(?:cfm|cubic\s*feet\s*per\s*minute)/i,                    0.00047194745],
    [/([-+]?\d*\.?\d+)\s*(?:m3\/s|m³\/s)/i,                                        1],
  ];
  for (const [re,f] of pats){ const m = s.match(re); if (m) return parseFloat(m[1])*f; }
  return null;
}
function extractPressurePa(s){
  const pats = [
    [/([-+]?\d*\.?\d+)\s*(?:mmh2o|mmwg|mm\s*h2o|mm\s*wg)\b/i,         9.80665, "mmH₂O"],
    [/([-+]?\d*\.?\d+)\s*(?:in\.?wg|inwc|inches?\s*w(?:ater)?\s*g(?:auge)?)\b/i, 249.0889, "in.wg"],
    [/([-+]?\d*\.?\d+)\s*kpa\b/i,                                     1000,    "kPa"],
    [/([-+]?\d*\.?\d+)\s*bar(?!g)\b/i,                                100000,  "bar"],
    [/([-+]?\d*\.?\d+)\s*psi\b/i,                                     6894.757,"PSI"],
    [/([-+]?\d*\.?\d+)\s*pa\b/i,                                      1,       "Pa"],
  ];
  for (const [re,f,label] of pats){
    const m = s.match(re);
    if (m) return { pa: parseFloat(m[1])*f, src: `${m[1]} ${label}` };
  }
  return null;
}
function extractRH(s){
  return extractFirst(s, "%(?:\\s*rh)?")
      ?? extractFirst(s, "percent(?:\\s*rh|\\s*relative)?")
      ?? extractFirst(s, "rh\\b");
}
function extractTempC(s){
  return extractFirst(s, "°c|degrees?\\s*c?|deg\\s*c?|c\\b");
}
function extractMetres(s){
  return extractFirst(s, "metres?\\b") ?? extractFirst(s, "m(?!m)(?!\\/s)(?!\\/min)\\b");
}

const SMART_TIPS = `<br><br><small class="muted">
Try: <em>"area of a 630mm duct"</em> • <em>"velocity in 600 by 300 duct at 500 l/s"</em> •
<em>"superheat R32 at 8 bar 12 degrees"</em> • <em>"flow for 10 kW at 5 K"</em> •
<em>"dew point 22 degrees 50%"</em> • <em>"5 bar to Pa"</em> • <em>"300 CFM to l/s"</em> •
<em>"F-Gas 5 kg R32"</em> • <em>"voltage drop 32A 50m 4mm"</em>.</small>`;

const SMART = [
  /* ---- Refrigeration ---- */
  { match: s => /superheat|super[\s-]?heat/.test(s),
    run: s => {
      const ref = detectRef(s); if (!ref) return null;
      const tMeas = extractTempC(s);
      const press = extractPressurePa(s);
      const pBar  = press ? press.pa/100000 : extractFirst(s, "bar(?:g)?");
      if (tMeas == null || pBar == null) return null;
      const tSat = pToT(ref, pBar+1);
      const sh   = tMeas - tSat;
      const tag  = sh < 3 ? "<span class='bad'>Low — flood-back risk</span>"
                : sh > 12 ? "<span class='bad'>High — undercharge / TXV starving</span>"
                : sh > 8  ? "<span class='warn'>High end</span>"
                :           "<span class='good'>Within typical band</span>";
      return `Superheat — <strong>${ref}</strong> @ ${pBar} barg, ${tMeas}°C measured<br>
              T<sub>sat</sub> = <strong>${fmt(tSat,1)} °C</strong> → SH = <strong>${fmt(sh,1)} K</strong> ${tag}`;
    }},
  { match: s => /subcool|sub[\s-]?cool/.test(s),
    run: s => {
      const ref = detectRef(s); if (!ref) return null;
      const tMeas = extractTempC(s);
      const press = extractPressurePa(s);
      const pBar  = press ? press.pa/100000 : extractFirst(s, "bar(?:g)?");
      if (tMeas == null || pBar == null) return null;
      const tSat = pToT(ref, pBar+1);
      const sc   = tSat - tMeas;
      const tag  = sc < 3 ? "<span class='bad'>Low — undercharge / flash gas</span>"
                : sc > 15 ? "<span class='warn'>High — overcharge / restricted</span>"
                :           "<span class='good'>Within typical 5–10 K band</span>";
      return `Subcool — <strong>${ref}</strong> @ ${pBar} barg, ${tMeas}°C liquid<br>
              T<sub>sat</sub> = <strong>${fmt(tSat,1)} °C</strong> → SC = <strong>${fmt(sc,1)} K</strong> ${tag}`;
    }},
  { match: s => /\bf[\s-]?gas\b|co2e|co₂e/.test(s),
    run: s => {
      const ref = detectRef(s); if (!ref) return null;
      const kg  = extractFirst(s, "kg|kilograms?");
      if (kg == null) return null;
      const gwp = GWP[ref] || 0;
      const tco2 = kg*gwp/1000;
      const interval = tco2 < 5  ? "no mandatory check"
                     : tco2 < 50 ? "12-monthly checks"
                     : tco2 < 500? "6-monthly (3-monthly without leak detection)"
                     :             "3-monthly with permanent leak detection";
      return `<strong>${kg} kg ${ref}</strong> × GWP ${gwp} = <strong>${fmt(tco2,2)} tCO₂e</strong><br>
              F-Gas: ${interval}`;
    }},
  { match: s => /\bt[\s-]?sat\b|saturation|sat\.?\s*(?:p|t|press|temp)/.test(s),
    run: s => {
      const ref = detectRef(s); if (!ref) return null;
      const press = extractPressurePa(s);
      const pBar  = press ? press.pa/100000 : extractFirst(s, "bar(?:a|g)?");
      const t     = extractTempC(s);
      if (pBar != null) return `${ref} sat @ <strong>${pBar} bar abs</strong> → T = <strong>${fmt(pToT(ref, pBar),1)} °C</strong>`;
      if (t    != null) return `${ref} sat @ <strong>${t} °C</strong> → P = <strong>${fmt(tToP(ref, t),2)} bar abs</strong> (${fmt(tToP(ref,t)-1,2)} barg)`;
      return null;
    }},

  /* ---- Psychrometrics ---- */
  { match: s => /dew\s*point|enthalpy|humidity\s*ratio|psychro/.test(s),
    run: s => {
      const t = extractTempC(s), rh = extractRH(s);
      if (t == null || rh == null) return null;
      const ps = pSat(t), pw = (rh/100)*ps;
      const W  = 0.622*pw/(P_ATM-pw);
      const h  = 1.006*t + W*(2501 + 1.86*t);
      const td = dewPoint(pw);
      const lead = /enthalpy/.test(s)         ? `Enthalpy h = <strong>${fmt(h,2)} kJ/kg</strong>`
                 : /humidity\s*ratio/.test(s) ? `Humidity ratio W = <strong>${fmt(W*1000,2)} g/kg</strong>`
                 :                              `Dew point = <strong>${fmt(td,1)} °C</strong>`;
      return `${t}°C, ${rh}% RH → ${lead}<br>
              <small class="muted">Also: W ${fmt(W*1000,2)} g/kg • h ${fmt(h,2)} kJ/kg • Tdp ${fmt(td,1)} °C</small>`;
    }},

  /* ---- Electrical ---- */
  { match: s => /v[\s-]?drop|voltage\s*drop/.test(s),
    run: (s, nums) => {
      const I   = extractFirst(s, "a(?:mps?)?\\b") ?? nums[0];
      const L   = extractMetres(s)                  ?? nums[1];
      const csa = extractFirst(s, "mm[²2]?\\b")    ?? nums[2];
      if (I == null || L == null || csa == null) return null;
      const tri = /3\s*[-]?\s*phase|three\s*phase/.test(s);
      const factor = tri ? Math.sqrt(3) : 2;
      const vd = factor * I * L * 0.0224 / csa;
      const sys = tri ? 400 : 230;
      const pct = vd/sys*100;
      const tag = pct<=3 ? "<span class='good'>≤ 3% lighting</span>"
                : pct<=5 ? "<span class='warn'>≤ 5% power</span>"
                :          "<span class='bad'>Exceeds 5% — uprate cable</span>";
      return `Voltage drop ≈ <strong>${fmt(vd,2)} V</strong> (${fmt(pct,1)}% of ${sys} V) ${tag}<br>
              <small class="muted">${I} A × ${L} m / ${csa} mm² Cu @ 70°C${tri?" (3-phase)":""}</small>`;
    }},
  { match: s => /motor\s*(?:heat|gain)/.test(s),
    run: s => {
      const kw  = extractFirst(s, "kw\\b");
      const eff = extractFirst(s, "%");
      if (kw == null || eff == null) return null;
      const losses = kw*(1-eff/100);
      return `Motor — ${kw} kW @ ${eff}% η: losses <strong>${fmt(losses,2)} kW</strong> (full input ${kw} kW if motor inside conditioned space)`;
    }},
  { match: s => (/\b3\s*[-]?\s*phase|three\s*phase|\bohm\b/.test(s)) || (/\bpower\b/.test(s) && /\bv\b/.test(s) && /\ba\b/.test(s)),
    run: s => {
      const V  = extractFirst(s, "v(?:olts?)?\\b");
      const I  = extractFirst(s, "a(?:mps?)?\\b");
      const pf = extractFirst(s, "pf|power\\s*factor") ?? 0.85;
      if (V == null || I == null) return null;
      const tri = /3\s*[-]?\s*phase|three\s*phase/.test(s);
      const P   = tri ? Math.sqrt(3)*V*I*pf : V*I*pf;
      return `${tri?"3-phase":"1-phase"}: ${V} V × ${I} A × pf ${pf} → <strong>${fmt(P/1000,2)} kW</strong>`;
    }},

  /* ---- Water / Hydronic ---- */
  { match: s => /(?:water\s*flow|chiller|boiler|flow\s*(?:for|of))/.test(s) && /kw\b/.test(s),
    run: s => {
      const kw = extractFirst(s, "kw\\b");
      const dt = extractFirst(s, "delta\\s*t|dt\\b|°c|degrees?|deg|k\\b");
      if (kw == null || dt == null) return null;
      const ls = kw/(CP_W*dt);
      return `Water flow — ${kw} kW ÷ (4.186 × ${dt}) = <strong>${fmt(ls,3)} l/s</strong> (${fmt(ls*60,1)} l/min, ${fmt(ls*3.6,2)} m³/h)`;
    }},
  { match: s => /\bpump\b/.test(s),
    run: s => {
      const ls   = extractFirst(s, "l\\/s|ls\\b");
      const head = extractMetres(s);
      const eff  = extractFirst(s, "%") ?? 65;
      if (ls == null || head == null) return null;
      const Q = ls/1000;
      const kwHyd = RHO_W*G*Q*head/1000;
      const kwShaft = kwHyd/(eff/100);
      return `Pump — ${ls} l/s @ ${head} m head: hydraulic <strong>${fmt(kwHyd,2)} kW</strong>, shaft @ ${eff}% η <strong>${fmt(kwShaft,2)} kW</strong>`;
    }},
  { match: s => /(?:pipe|hazen).*(?:friction|head\s*loss)|(?:friction|head\s*loss).*pipe/.test(s),
    run: s => {
      const dMm = extractFirst(s, "mm\\b");
      const ls  = extractFirst(s, "l\\/s|ls\\b");
      if (dMm == null || ls == null) return null;
      const mat = detectMaterial(s);
      const C = HW_C[mat];
      const dM = dMm/1000, qm3s = ls/1000;
      const hL = 10.67 * Math.pow(qm3s,1.852) / (Math.pow(C,1.852)*Math.pow(dM,4.87));
      return `Pipe friction (${mat}, C=${C}) — Ø${dMm} mm @ ${ls} l/s = <strong>${fmt(hL*1000,2)} mm/m</strong> (${fmt(hL*RHO_W*G,1)} Pa/m)`;
    }},

  /* ---- Air systems ---- */
  { match: s => /duct.*(?:friction|pa\/m|head\s*loss)|(?:friction|pa\/m|head\s*loss).*duct/.test(s),
    run: s => {
      const dMm = extractFirst(s, "mm\\b");
      const flow = extractFlowMs(s);
      if (dMm == null || flow == null) return null;
      const dh = dMm/1000;
      const area = Math.PI*Math.pow(dh/2,2);
      const vel = flow/area;
      const Re  = vel*dh/NU_AIR;
      const f   = Re < 2300 ? 64/Re : colebrook(0.15/dMm, Re);
      const dpm = f*(RHO_AIR*vel*vel)/(2*dh);
      return `Duct friction — Ø${dMm} mm @ ${fmt(vel,2)} m/s: <strong>${fmt(dpm,2)} Pa/m</strong> (Re ${fmt(Re,0)})`;
    }},
  { match: s => /\bduct\b/.test(s) && /(\d+(?:\.\d+)?)\s*(?:x|×|by)\s*(\d+(?:\.\d+)?)/i.test(s),
    run: s => {
      const m = s.match(/(\d+(?:\.\d+)?)\s*(?:x|×|by)\s*(\d+(?:\.\d+)?)/i);
      const w = parseFloat(m[1])/1000, h = parseFloat(m[2])/1000;
      const area = w*h;
      const flow = extractFlowMs(s);
      let out = `Rectangular duct ${m[1]}×${m[2]} mm → area = <strong>${fmt(area,4)} m²</strong>`;
      if (flow != null){
        const vel = flow/area;
        out += `<br>Velocity at ${fmt(flow*1000,0)} l/s = <strong>${fmt(vel,2)} m/s</strong> ${velBadge(vel)}`;
      }
      return out;
    }},
  { match: s => /\bduct\b/.test(s),
    run: s => {
      const dMm = extractFirst(s, "mm\\b") ?? (() => {
        const m = s.match(/(\d{2,4})\s*(?:duct|diameter|dia\b)/);
        return m ? parseFloat(m[1]) : null;
      })();
      if (dMm == null) return null;
      const area = Math.PI*Math.pow(dMm/1000/2, 2);
      const flow = extractFlowMs(s);
      const askedVel = extractFirst(s, "m\\/s|metres?\\s*per\\s*second");
      let out = `Circular duct Ø${dMm} mm → area = <strong>${fmt(area,4)} m²</strong>`;
      if (flow != null){
        const vel = flow/area;
        out += `<br>Velocity at ${fmt(flow*1000,0)} l/s = <strong>${fmt(vel,2)} m/s</strong> ${velBadge(vel)}`;
      } else if (askedVel != null){
        const q = area*askedVel;
        out += `<br>Flow at ${askedVel} m/s = <strong>${fmt(q*1000,0)} l/s</strong> (${fmt(q*3600,0)} m³/h)`;
      }
      return out;
    }},
  { match: s => /\bach\b|air\s*chang/.test(s),
    run: (s, nums) => {
      if (nums.length < 4) return null;
      const [L,W,H,Q] = nums;
      const vol = L*W*H;
      const ach = (Q*3.6)/vol;
      return `Volume ${fmt(vol,1)} m³ • Airflow ${Q} l/s → ACH = <strong>${fmt(ach,2)}</strong>`;
    }},

  /* ---- General conversions (fallback catch-all) ---- */
  { match: s => extractPressurePa(s) !== null,
    run: s => {
      const p = extractPressurePa(s); if (!p) return null;
      return `${p.src} = <strong>${fmt(p.pa,1)} Pa</strong> = ${fmt(p.pa/1000,3)} kPa = ${fmt(p.pa/9.80665,2)} mmH₂O = ${fmt(p.pa/249.0889,3)} in.wg = ${fmt(p.pa/100000,5)} bar = ${fmt(p.pa/6894.757,4)} PSI`;
    }},
  { match: s => extractFlowMs(s) !== null,
    run: s => {
      const qms = extractFlowMs(s); if (qms == null) return null;
      return `Airflow ≈ <strong>${fmt(qms*1000,0)} l/s</strong> = ${fmt(qms*3600,0)} m³/h = ${fmt(qms/0.00047194745,0)} CFM = ${fmt(qms,4)} m³/s`;
    }},
  { match: s => /\bkw\b|btu|\btr\b|tons?\s*(?:of)?\s*(?:ref|cooling)?/.test(s),
    run: s => {
      const kw  = extractFirst(s, "kw\\b");
      const btu = extractFirst(s, "btu(?:\\/h(?:r)?)?");
      const tr  = extractFirst(s, "tr\\b|tons?");
      let kwVal = kw != null ? kw : btu != null ? btu/3412.142 : tr != null ? tr*3.51685 : null;
      if (kwVal == null) return null;
      return `<strong>${fmt(kwVal,2)} kW</strong> = ${fmt(kwVal*3412.142,0)} BTU/hr = ${fmt(kwVal/3.51685,2)} TR`;
    }},
];

function runSmart(){
  const raw = $("smartInput").value;
  const s   = raw.toLowerCase().trim();
  if (!s){ $("smartResult").innerHTML = "Type, dictate, or paste a quick site calculation above."; return; }
  const nums = (s.match(/[-+]?\d*\.?\d+/g) || []).map(Number);
  for (const h of SMART){
    if (h.match(s)){
      const out = h.run(s, nums);
      if (out){ $("smartResult").innerHTML = out; return; }
    }
  }
  $("smartResult").innerHTML = `I couldn't parse <em>"${raw}"</em>.${SMART_TIPS}`;
}

/* ==========================================================================
   AIR SYSTEMS
   ========================================================================== */

/* ---------- Duct Sizer (Lindab-style live ductulator) ----------
   Free-form 2-of-4 solving for circular ducts: type into any of
   Flow / Diameter / Velocity / Pa-per-m and the other two solve live.
   Rectangular & flat-oval: dims always input + one of {Q,V,R} drives.
   Equivalent diameter, gauges, and material roughness toggle. */

const DUCT_STATE = {
  shape:   "circ",                 // circ | rect | oval
  history: ["Q","D"],              // most-recently-edited keys (max 2 for circ; 1 of {Q,V,R} for rect/oval)
  values:  {                       // display units (l/s for Q, mm for dims, m/s for V, Pa/m for R)
    Q: 900, D: 630,
    W: 600, H: 400,
    A: 700, B: 400,
    V: null, R: null
  }
};
const EPS_MM = { galv: 0.15, alu: 0.05, plastic: 0.01, flex: 0.9 };

function ductHTML(){
  return `
  <div class="duct-shape-tabs" role="tablist">
    <button type="button" class="ds-tab active" data-shape="circ" onclick="setDuctShape('circ')">⭕ Circular</button>
    <button type="button" class="ds-tab" data-shape="rect" onclick="setDuctShape('rect')">▭ Rectangular</button>
    <button type="button" class="ds-tab" data-shape="oval" onclick="setDuctShape('oval')">🥚 Flat-oval</button>
  </div>
  <div class="field full">
    <label>Material (sets roughness ε)</label>
    <select id="ductMat" onchange="recomputeDuct()">
      <option value="galv" selected>Galvanised steel — ε = 0.15 mm</option>
      <option value="alu">Aluminium — ε = 0.05 mm</option>
      <option value="plastic">Plastic / PE — ε = 0.01 mm</option>
      <option value="flex">Flexible / spiral — ε = 0.9 mm</option>
    </select>
  </div>
  <div class="solver-hint">Type any <strong>two</strong> values for circular, or <strong>both dimensions plus one</strong> of flow / velocity / Pa-per-m for rect &amp; oval. The others solve live.</div>
  <div class="explain-tools-row">
    <button type="button" class="explain-link" onclick="openExplanation('airflow_vs_resistance')">💡 Airflow vs resistance</button>
    <button type="button" class="explain-link" onclick="openExplanation('fan_laws')">💡 Fan laws</button>
  </div>
  <div id="ductSolver"></div>
  <div id="ductGauges"></div>
  <div id="ductOut" class="result muted">Live solution will appear here.</div>`;
}

function ductInit(){ setDuctShape(DUCT_STATE.shape || "circ"); }

function setDuctShape(shape){
  DUCT_STATE.shape = shape;
  document.querySelectorAll(".ds-tab").forEach(t => t.classList.toggle("active", t.dataset.shape === shape));
  if (shape === "circ"){
    if (DUCT_STATE.history.length < 2 || DUCT_STATE.history.some(k => !["Q","D","V","R"].includes(k))){
      DUCT_STATE.history = ["Q","D"];
    }
  } else {
    DUCT_STATE.history = ["Q"];
  }
  renderDuctSolver();
  recomputeDuct();
}

function renderDuctSolver(){
  const s = DUCT_STATE.shape, v = DUCT_STATE.values;
  const row = (key, label, unit, val, icon) => `
    <div class="solver-row" id="row-duct${key}">
      <div class="solver-icon">${icon}</div>
      <div class="solver-label">${label}<small id="state-duct${key}"></small></div>
      <input class="solver-input" id="duct${key}" type="number" inputmode="decimal" value="${val == null ? '' : val}" oninput="ductInput('${key}')">
      <div class="solver-unit">${unit}</div>
    </div>`;
  let html = "";
  if (s === "circ"){
    html = row("Q","Airflow","l/s", v.Q, "💨")
         + row("D","Diameter","mm", v.D, "Ø")
         + row("V","Velocity","m/s", v.V, "→")
         + row("R","Pressure","Pa/m", v.R, "📉");
  } else if (s === "rect"){
    html = row("W","Width","mm", v.W, "↔")
         + row("H","Height","mm", v.H, "↕")
         + row("Q","Airflow","l/s", v.Q, "💨")
         + row("V","Velocity","m/s", v.V, "→")
         + row("R","Pressure","Pa/m", v.R, "📉");
  } else {
    html = row("A","Major axis","mm", v.A, "↔")
         + row("B","Minor axis","mm", v.B, "↕")
         + row("Q","Airflow","l/s", v.Q, "💨")
         + row("V","Velocity","m/s", v.V, "→")
         + row("R","Pressure","Pa/m", v.R, "📉");
  }
  document.getElementById("ductSolver").innerHTML = `<div class="solver-grid">${html}</div>`;
}

function ductInput(key){
  const el = document.getElementById("duct" + key);
  const val = parseFloat(el.value);
  DUCT_STATE.values[key] = isNaN(val) ? null : val;
  if (DUCT_STATE.shape === "circ"){
    DUCT_STATE.history = DUCT_STATE.history.filter(k => k !== key);
    DUCT_STATE.history.push(key);
    if (DUCT_STATE.history.length > 2) DUCT_STATE.history.shift();
  } else if (["Q","V","R"].includes(key)){
    DUCT_STATE.history = [key];
  }
  recomputeDuct();
}

function R_for(V, Dh, eps){
  if (V <= 0 || Dh <= 0) return Infinity;
  const Re = V * Dh / NU_AIR;
  const f  = Re < 2300 ? 64/Re : colebrook(eps/Dh, Re);
  return f * RHO_AIR * V * V / (2*Dh);
}
function bisect(fn, lo, hi, tol = 1e-5, maxIter = 80){
  let flo = fn(lo), fhi = fn(hi);
  if (!Number.isFinite(flo) || !Number.isFinite(fhi)) return null;
  if (flo*fhi > 0) return null;
  for (let i = 0; i < maxIter; i++){
    const mid = (lo+hi)/2, fmid = fn(mid);
    if (Math.abs(fmid) < tol) return mid;
    if (flo*fmid < 0){ hi = mid; fhi = fmid; }
    else            { lo = mid; flo = fmid; }
  }
  return (lo+hi)/2;
}

function solveCircular(eps_mm){
  const valid = DUCT_STATE.history.filter(k => Number.isFinite(DUCT_STATE.values[k]));
  if (valid.length < 2) return null;
  const [k1, k2] = valid.slice(-2);
  const si = {};
  for (const k of [k1, k2]){
    let val = DUCT_STATE.values[k];
    if (k === "Q" || k === "D") val = val/1000;
    si[k] = val;
  }
  const eps = eps_mm/1000;
  let Q, D, V, R;
  const has = (a,b) => (a in si) && (b in si);

  if (has("Q","D"))      { Q=si.Q; D=si.D; V=Q/(Math.PI*D*D/4); R=R_for(V,D,eps); }
  else if (has("Q","V")) { Q=si.Q; V=si.V; D=Math.sqrt(4*Q/(Math.PI*V)); R=R_for(V,D,eps); }
  else if (has("D","V")) { D=si.D; V=si.V; Q=Math.PI*D*D/4*V; R=R_for(V,D,eps); }
  else if (has("Q","R")) {
    Q=si.Q; R=si.R;
    D = bisect(d => R_for(Q/(Math.PI*d*d/4), d, eps) - R, 0.05, 3.0);
    if (D == null) return null;
    V = Q/(Math.PI*D*D/4);
  }
  else if (has("D","R")) {
    D=si.D; R=si.R;
    V = bisect(vel => R_for(vel, D, eps) - R, 0.05, 40);
    if (V == null) return null;
    Q = Math.PI*D*D/4 * V;
  }
  else if (has("V","R")) {
    V=si.V; R=si.R;
    D = bisect(d => R_for(V, d, eps) - R, 0.02, 3.0);
    if (D == null) return null;
    Q = Math.PI*D*D/4 * V;
  }
  else return null;

  if ([Q,D,V,R].some(x => x == null || !Number.isFinite(x) || x <= 0)) return null;
  const Re = V*D/NU_AIR;
  const f  = Re < 2300 ? 64/Re : colebrook(eps/D, Re);
  return {Q, D, V, R, A: Math.PI*D*D/4, Dh: D, De: D, Re, f, inputs: [k1, k2], shape: "circ"};
}

function solveRectOval(shape, eps_mm){
  const v = DUCT_STATE.values;
  const dim1 = (shape === "rect") ? v.W : v.A;
  const dim2 = (shape === "rect") ? v.H : v.B;
  if (!Number.isFinite(dim1) || !Number.isFinite(dim2) || dim1 <= 0 || dim2 <= 0) return null;
  const a = dim1/1000, b = dim2/1000;
  const Aft  = (shape === "rect") ? a*b : (Math.PI*b*b/4) + b*Math.max(0,(a-b));
  const peri = (shape === "rect") ? 2*(a+b) : Math.PI*b + 2*Math.max(0,(a-b));
  const Dh   = 4*Aft / peri;
  const De   = (shape === "rect")
             ? 1.30 * Math.pow(a*b, 0.625) / Math.pow(a+b, 0.25)
             : Dh;
  const eps  = eps_mm/1000;
  const driver = DUCT_STATE.history.filter(k => ["Q","V","R"].includes(k) && Number.isFinite(v[k])).slice(-1)[0];
  if (!driver) return null;
  let Q, V, R;
  if (driver === "Q"){ Q = v.Q/1000; V = Q/Aft; R = R_for(V, De, eps); }
  else if (driver === "V"){ V = v.V; Q = V*Aft; R = R_for(V, De, eps); }
  else { R = v.R; V = bisect(vel => R_for(vel, De, eps) - R, 0.05, 40); if (V == null) return null; Q = V*Aft; }
  if ([Q,V,R].some(x => !Number.isFinite(x) || x <= 0)) return null;
  const Re = V*De/NU_AIR;
  const f  = Re < 2300 ? 64/Re : colebrook(eps/De, Re);
  return {Q, V, R, A: Aft, Dh, De, Re, f, inputs: ["dim", driver], shape, dim1, dim2};
}

function recomputeDuct(){
  const matSel = document.getElementById("ductMat");
  if (!matSel) return;
  const eps = EPS_MM[matSel.value] || 0.15;
  const s   = DUCT_STATE.shape;
  const r   = (s === "circ") ? solveCircular(eps) : solveRectOval(s, eps);
  if (!r){
    document.getElementById("ductOut").innerHTML = `<span class="muted">Need ${s === "circ" ? "any two values" : "both dimensions plus one of flow / velocity / Pa-per-m"} to solve.</span>`;
    document.getElementById("ductGauges").innerHTML = "";
    return;
  }
  applyDuctResult(r);
  renderDuctGauges(r);
  renderDuctSummary(r);
}

function applyDuctResult(r){
  const s = DUCT_STATE.shape;
  const inputs = (s === "circ")
    ? DUCT_STATE.history.slice(-2)
    : (s === "rect" ? ["W","H"] : ["A","B"]).concat(DUCT_STATE.history.filter(k => ["Q","V","R"].includes(k)).slice(-1));
  const setField = (key, displayVal, decimals) => {
    const el  = document.getElementById("duct" + key);
    const row = document.getElementById("row-duct" + key);
    const tag = document.getElementById("state-duct" + key);
    if (!el) return;
    const isInput = inputs.includes(key);
    if (isInput){
      el.classList.remove("computed");
      row?.classList.remove("computed");
      if (tag) tag.innerHTML = "<span class='input-tag'>input</span>";
    } else {
      el.classList.add("computed");
      row?.classList.add("computed");
      if (tag) tag.innerHTML = "<span class='auto-tag'>auto</span>";
      if (Number.isFinite(displayVal)){
        el.value = fmt(displayVal, decimals);
        DUCT_STATE.values[key] = displayVal;
      }
    }
  };
  setField("Q", r.Q*1000, 0);
  setField("V", r.V, 2);
  setField("R", r.R, 2);
  if (s === "circ") setField("D", r.D*1000, 0);
}

function renderDuctGauges(r){
  const html = `
    <div class="gauge-block">
      <div class="gauge-label">Velocity <strong>${fmt(r.V,2)} m/s</strong> ${velBadge(r.V)}</div>
      <div class="gauge-track">
        <div class="gauge-band" style="left:0;width:13.3%;background:#dbeafe"></div>
        <div class="gauge-band" style="left:13.3%;width:40%;background:#dcfce7"></div>
        <div class="gauge-band" style="left:53.3%;width:46.7%;background:#fef3c7"></div>
        <div class="gauge-marker" style="left:${Math.min(100, Math.max(0, r.V/15*100))}%"></div>
      </div>
      <div class="gauge-scale"><span>0</span><span>2</span><span>8</span><span>15 m/s</span></div>
    </div>
    <div class="gauge-block">
      <div class="gauge-label">Pressure drop <strong>${fmt(r.R,2)} Pa/m</strong> ${rBadge(r.R)}</div>
      <div class="gauge-track">
        <div class="gauge-band" style="left:0;width:33.3%;background:#dcfce7"></div>
        <div class="gauge-band" style="left:33.3%;width:50%;background:#fef3c7"></div>
        <div class="gauge-band" style="left:83.3%;width:16.7%;background:#fee2e2"></div>
        <div class="gauge-marker" style="left:${Math.min(100, Math.max(0, r.R/3*100))}%"></div>
      </div>
      <div class="gauge-scale"><span>0</span><span>1</span><span>2.5</span><span>3 Pa/m</span></div>
    </div>`;
  document.getElementById("ductGauges").innerHTML = html;
}

function renderDuctSummary(r){
  const s = DUCT_STATE.shape;
  const shapeLabel = s === "circ" ? "Circular" : s === "rect" ? "Rectangular" : "Flat-oval";
  const dimText = s === "circ" ? `Ø ${fmt(r.D*1000,0)} mm`
                : s === "rect" ? `${fmt(r.dim1,0)} × ${fmt(r.dim2,0)} mm`
                :                `${fmt(r.dim1,0)} × ${fmt(r.dim2,0)} mm flat-oval`;
  const eqDia = s !== "circ" ? `<br>Equivalent Ø (friction-equivalent): <strong>${fmt(r.De*1000,0)} mm</strong>` : "";
  const flowAlt = `${fmt(r.Q*1000,0)} l/s • ${fmt(r.Q*3600,0)} m³/h • ${fmt(r.Q/0.00047194745,0)} CFM`;
  const html = `
    <strong>Live solution</strong> <span class="badge badge-info">${shapeLabel}</span> &nbsp;<small>${dimText}</small><br>
    Area: <strong>${fmt(r.A,4)} m²</strong> &nbsp;(${fmt(r.A*10000,0)} cm²)<br>
    Hydraulic Ø: ${fmt(r.Dh*1000,0)} mm${eqDia}<br>
    Reynolds: ${fmt(r.Re,0)} • friction factor f: ${fmt(r.f,4)}<br><br>
    Airflow: ${flowAlt}<br>
    Over 10 m run: <strong>${fmt(r.R*10,0)} Pa</strong> &nbsp; • &nbsp; Over 50 m: ${fmt(r.R*50,0)} Pa
    ${assumptionFooter("ρ = 1.2 kg/m³ • ν = 1.5×10⁻⁵ m²/s • Colebrook-White • bands per CIBSE Guide B")}`;
  setResult("ductOut", html);
}

function velBadge(vel){
  if (vel < 2)  return `<span class="badge badge-info">Low velocity</span>`;
  if (vel <= 8) return `<span class="badge badge-good">Within typical commercial range</span>`;
  if (vel <= 15)return `<span class="badge badge-warn">High — check noise / pressure drop</span>`;
  return `<span class="badge badge-bad">Excessive — noise & energy risk</span>`;
}
function rBadge(r){
  if (r < 1)    return `<span class="badge badge-good">Economical</span>`;
  if (r < 2.5)  return `<span class="badge badge-warn">Acceptable</span>`;
  return `<span class="badge badge-bad">High loss — uprate size</span>`;
}

/* ---------- Duct Friction (Darcy-Weisbach + Colebrook) ---------- */
function frictionHTML(){
  return `
  <div class="explain-tools-row">
    <button type="button" class="explain-link" onclick="openExplanation('duct_friction_explained')">💡 What do these numbers mean?</button>
  </div>
  <div class="form-grid">
    <div class="field"><label>Hydraulic diameter (mm)</label><input id="frD" type="number" inputmode="decimal" placeholder="400"></div>
    <div class="field"><label>Airflow (l/s)</label><input id="frQ" type="number" inputmode="decimal" placeholder="500"></div>
    <div class="field"><label>Material roughness ε (mm)</label><input id="frEps" type="number" inputmode="decimal" value="0.15"></div>
    <div class="field"><label>Length (m, optional)</label><input id="frL" type="number" inputmode="decimal" placeholder="20"></div>
  </div>
  <div id="frOut" class="result muted">Default ε = 0.15 mm (galvanised steel). Plain-English interpretation appears below.</div>`;
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
  if (dh <= 0 || vel <= 0){
    setResult("frOut", `<span class="bad">Enter diameter and airflow.</span>` + assumptionFooter("ε = 0.15 mm galvanised steel default"));
    return;
  }
  const Re  = vel*dh/NU_AIR;
  let f, regime;
  if (Re < 2300){ f = 64/Re; regime = "laminar"; }
  else { f = colebrook(epsMm/(dhMm), Re); regime = "turbulent"; }
  const dpPerM = f * (RHO_AIR*vel*vel)/(2*dh);

  let status, statusText, advice;
  if (dpPerM < 0.5)      { status = "info";  statusText = "Very low — duct may be over-sized"; advice = "Generous sizing — fan-friendly but throw from terminals may be weak."; }
  else if (dpPerM < 1.0) { status = "good";  statusText = "Economical — design sweet spot"; advice = "Sits in the 0.8–1.0 Pa/m design band — good balance between fan power and duct cost."; }
  else if (dpPerM < 2.5) { status = "warn";  statusText = "Acceptable — short runs"; advice = "Fine for short runs or plant-room mains; on long runs the fan power adds up quickly."; }
  else if (dpPerM < 5.0) { status = "bad";   statusText = "High loss — uprate size"; advice = "Step duct size up. Pa/m scales with V² so going from a 400 mm to 450 mm duct typically halves friction."; }
  else                   { status = "bad";   statusText = "Severe — check inputs or uprate two sizes"; advice = "Either velocity is way too high for this duct, or the inputs need a sense check."; }
  const badgeMap = {good:"badge-good", warn:"badge-warn", bad:"badge-bad", info:"badge-info"};

  let html = `
    <h4>Headline</h4>
    <strong>${fmtSmart(dpPerM)} Pa/m</strong> friction loss &nbsp;<span class="badge ${badgeMap[status]}">${statusText}</span><br>
    <small class="muted">${advice}</small><br>
    <small class="muted">Design band: <strong>0.8–1.0 Pa/m</strong> typical • up to 2.5 Pa/m acceptable on short runs.</small><br><br>

    <h4>Velocity</h4>
    ${fmtSmart(vel)} m/s &nbsp;${velBadge(vel)}<br><br>

    <h4>Detail</h4>
    Hydraulic Ø ${fmtSmart(dhMm)} mm • flow ${fmtSmart(qLs)} l/s • ε ${epsMm} mm<br>
    Reynolds ${fmtSmart(Re)} (${regime}) • friction factor f = ${fmtSmart(f)}`;
  if (L > 0){
    html += `<br><br><h4>Over ${fmtSmart(L)} m run</h4>
             Total: <strong>${fmtSmart(dpPerM*L)} Pa</strong> the fan must overcome on this run alone (excluding fittings — add 30–50%).`;
  }
  html += assumptionFooter(`ε = ${epsMm} mm • ρ = 1.2 kg/m³ • ν = 1.5×10⁻⁵ m²/s • Colebrook-White iterative`);
  setResult("frOut", html);
}

/* ---------- Grille / Free Area ---------- */
function grilleHTML(){
  return `
  <div class="explain-tools-row">
    <button type="button" class="explain-link" onclick="openExplanation('airflow_vs_resistance')">💡 Airflow vs resistance</button>
  </div>
  <div class="form-grid">
    <div class="field"><label>Width (mm)</label><input id="grW" type="number" inputmode="decimal" placeholder="600"></div>
    <div class="field"><label>Height (mm)</label><input id="grH" type="number" inputmode="decimal" placeholder="300"></div>
    <div class="field"><label>Free area %</label><input id="grFree" type="number" inputmode="decimal" placeholder="60"></div>
    <div class="field"><label>Airflow (l/s)</label><input id="grQ" type="number" inputmode="decimal" placeholder="150"></div>
  </div>
  <div id="grOut" class="result muted">Grille / louvre face & free-area velocity check. Free-area velocity (not face velocity) drives the noise rating.</div>`;
}
function calcGrille(){
  const gross = (n("grW")/1000)*(n("grH")/1000);
  const free  = gross*(n("grFree")/100);
  const q     = n("grQ")/1000;
  const qLs   = n("grQ");
  const vGross = gross > 0 ? q/gross : 0;
  const vFree  = free  > 0 ? q/free  : 0;
  if (gross <= 0 || free <= 0){
    setResult("grOut", `<span class="bad">Enter width, height and free-area %.</span>`);
    return;
  }
  let status, statusText, advice;
  if (vFree === 0)         { status = "info"; statusText = "Add airflow to assess"; advice = "Enter expected airflow to see velocity-based noise band."; }
  else if (vFree < 1.5)    { status = "good"; statusText = "Quiet — well sized"; advice = "Free-area velocity below 1.5 m/s — comfortable for offices and meeting rooms."; }
  else if (vFree < 2.5)    { status = "good"; statusText = "Acceptable comfort"; advice = "Within the CIBSE comfort guidance for occupied spaces (< 2.5 m/s)."; }
  else if (vFree < 3.5)    { status = "warn"; statusText = "Borderline — noise risk"; advice = "Approaching the noisy band. Acceptable in plant rooms or transient areas; reconsider for quiet offices."; }
  else                     { status = "bad";  statusText = "Noisy — uprate grille"; advice = "Likely audible whistle/roar. Specify a larger grille or one with higher free-area %."; }
  const badgeMap = {good:"badge-good", warn:"badge-warn", bad:"badge-bad", info:"badge-info"};

  let html = `
    <h4>Headline</h4>
    Free-area velocity <strong>${fmtSmart(vFree)} m/s</strong> &nbsp;<span class="badge ${badgeMap[status]}">${statusText}</span><br>
    <small class="muted">${advice}</small><br>
    <small class="muted">Comfort guidance: <strong>&lt; 2.5 m/s</strong> for occupied spaces • &gt; 3.5 m/s noisy.</small><br><br>

    <h4>Detail</h4>
    Face area (gross): ${fmtSmart(gross*10000)} cm² (${fmtSmart(gross)} m²)<br>
    Free area: ${fmtSmart(free*10000)} cm² (${fmtSmart(free)} m²)<br>
    Face velocity: ${fmtSmart(vGross)} m/s • Airflow: ${fmtSmart(qLs)} l/s`;
  html += assumptionFooter("Free-area velocity drives noise rating; face velocity is the average across the whole grille face including blades/blocking.");
  setResult("grOut", html);
}

/* ---------- Psychrometrics ---------- */
function psychHTML(){
  return `
  <div class="explain-tools-row">
    <button type="button" class="explain-link" onclick="openExplanation('psychrometrics_basics')">💡 Dry / wet / dew explained</button>
    <button type="button" class="explain-link" onclick="openExplanation('sensible_vs_latent')">💡 Sensible vs latent</button>
    <button type="button" class="explain-link" onclick="openExplanation('duct_condensation')">💡 Why ducts sweat</button>
  </div>
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
  <div id="psOut" class="result muted">Air state, dew point, mixed-air temperature, sensible heat ratio. Plain-English interpretation appears below.</div>`;
}
function pSat(T){ return 610.94 * Math.exp(17.625*T/(T+243.04)); } // Pa
function dewPoint(Pw){
  const ln = Math.log(Pw/610.94);
  return 243.04*ln/(17.625-ln);
}
function calcPsych(){
  const T = n("psT"), RH = n("psRH");
  if (T === 0 && RH === 0){ setResult("psOut", `<span class="bad">Enter dry-bulb temperature and RH to begin.</span>`); return; }
  const ps = pSat(T), pw = (RH/100)*ps;
  const W  = 0.622*pw/(P_ATM-pw);
  const h  = 1.006*T + W*(2501 + 1.86*T);
  const Td = dewPoint(pw);

  // Comfort interpretation
  let comfStatus, comfText, comfAdvice;
  if (RH < 30)        { comfStatus = "warn"; comfText = "Dry";        comfAdvice = "Low RH — eyes/skin/wood may dry out. Acceptable in heating season."; }
  else if (RH <= 60)  { comfStatus = "good"; comfText = "Comfortable"; comfAdvice = "Within 30–60% RH comfort band — typical office target."; }
  else if (RH <= 70)  { comfStatus = "warn"; comfText = "Humid — borderline"; comfAdvice = "Approaching the upper limit. Mould risk on cool surfaces increases above 60%."; }
  else                { comfStatus = "bad";  comfText = "Very humid"; comfAdvice = "Above 70% RH — sweaty, sticky, mould-friendly. Investigate moisture source or boost ventilation/dehumidify."; }
  const badgeMap = {good:"badge-good", warn:"badge-warn", bad:"badge-bad", info:"badge-info"};

  let html = `
    <h4>Headline</h4>
    <strong>${fmtSmart(T)} °C dry-bulb, ${fmtSmart(RH)}% RH</strong> &nbsp;<span class="badge ${badgeMap[comfStatus]}">${comfText}</span><br>
    <small class="muted">${comfAdvice}</small><br>
    <small class="muted">Office comfort: <strong>21–23 °C / 40–60% RH</strong>.</small><br><br>

    <h4>Air state</h4>
    Humidity ratio W = <strong>${fmtSmart(W*1000)} g/kg</strong> dry air<br>
    Enthalpy h = <strong>${fmtSmart(h)} kJ/kg</strong> dry air<br>
    Dew point = <strong>${fmtSmart(Td)} °C</strong><br>
    <small class="muted">Surfaces below ${fmtSmart(Td)} °C will sweat in this air.</small>`;

  const oaT = n("psOaT"), raT = n("psRaT"), oaPct = n("psOaPct");
  if (oaPct > 0){
    const fr = oaPct/100;
    const Tmix = fr*oaT + (1-fr)*raT;
    html += `<br><br><h4>Mixed air (${fmtSmart(oaPct)}% outside, ${fmtSmart(100-oaPct)}% return)</h4>
             Mixed dry-bulb T<sub>mix</sub> = <strong>${fmtSmart(Tmix)} °C</strong>`;
  }
  const sen = n("psSen"), tot = n("psTot");
  if (tot > 0){
    const shr = sen/tot;
    let shrStatus, shrText, shrAdvice;
    if (shr >= 0.85)      { shrStatus = "info"; shrText = "Almost all sensible"; shrAdvice = "Coil mostly cooling air, barely removing moisture."; }
    else if (shr >= 0.70) { shrStatus = "good"; shrText = "Sensible-led"; shrAdvice = "Typical office split — cooling temperature with modest dehumidification."; }
    else if (shr >= 0.50) { shrStatus = "warn"; shrText = "Mixed load"; shrAdvice = "Significant latent component. Confirm coil selected for this SHR."; }
    else                  { shrStatus = "bad";  shrText = "Latent-led"; shrAdvice = "More than half the load is moisture. Coil must be deep/cold enough to drag wet-bulb down — sensible-only selection will fail."; }
    html += `<br><br><h4>Sensible Heat Ratio</h4>
             SHR = <strong>${fmtSmart(shr)}</strong> &nbsp;<span class="badge ${badgeMap[shrStatus]}">${shrText}</span><br>
             <small class="muted">${shrAdvice}</small>`;
  }
  if (Td > T - 2 && RH > 0){
    html += `<br><br><span class="badge badge-warn">Surface condensation risk — within 2 K of dew point</span>
             <small class="muted"> Any surface within 2 K of the dew point (${fmtSmart(Td)} °C) will start to sweat.</small>`;
  }
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
  <div class="explain-tools-row">
    <button type="button" class="explain-link" onclick="openExplanation('water_flow_kw_dt')">💡 Why ΔT matters</button>
  </div>
  <div class="form-grid">
    <div class="field full"><label>Fluid</label>${fluidSelectHTML("watFluid")}</div>
    <div class="field"><label>Duty (kW)</label><input id="watKw" type="number" inputmode="decimal" placeholder="10"></div>
    <div class="field"><label>ΔT (°C)</label><input id="watDt" type="number" inputmode="decimal" placeholder="5"></div>
  </div>
  <div id="watOut" class="result muted">Flow needed to carry the duty at the chosen ΔT. Bigger ΔT → smaller pump.</div>`;
}
function calcWater(){
  const f = FLUIDS[v("watFluid")] || FLUIDS.water;
  const kw = n("watKw"), dt = n("watDt");
  if (kw <= 0 || dt <= 0){ setResult("watOut", `<span class="bad">Enter duty (kW) and ΔT (°C).</span>`); return; }
  const qm3s = kw / (f.cp * f.rho * dt);
  const ls = qm3s*1000, lpm = ls*60, m3h = qm3s*3600;
  const penalty = ((CP_W*RHO_W)/(f.cp*f.rho) - 1)*100;
  const isGlycol = v("watFluid") !== "water";

  // ΔT band interpretation (chilled water context primarily — but works for LTHW too with different bands)
  let dtStatus, dtText, dtAdvice;
  if (dt < 4)        { dtStatus = "warn"; dtText = "Small ΔT — high flow"; dtAdvice = "Pump will work hard. Bigger ΔT (6–10 K chilled, 15–20 K LTHW) cuts pump power dramatically."; }
  else if (dt <= 10) { dtStatus = "good"; dtText = "Typical chilled-water ΔT"; dtAdvice = "Sensible chilled-water sizing. For LTHW, target 15–20 K to halve flow again."; }
  else if (dt <= 20) { dtStatus = "good"; dtText = "Modern LTHW range"; dtAdvice = "Modern condensing-boiler / heat-pump territory — low flow, low pump energy, big savings."; }
  else               { dtStatus = "info"; dtText = "Very large ΔT"; dtAdvice = "Unusual — confirm coil/emitter can deliver this without surface temperature dropping below dew point."; }
  const badgeMap = {good:"badge-good", warn:"badge-warn", bad:"badge-bad", info:"badge-info"};

  let html = `
    <h4>Headline</h4>
    Flow needed: <strong>${fmtSmart(ls)} l/s</strong> &nbsp;<span class="badge ${badgeMap[dtStatus]}">${dtText}</span><br>
    <small class="muted">${dtAdvice}</small><br>
    <small class="muted">Also: <strong>${fmtSmart(lpm)} l/min</strong> • <strong>${fmtSmart(m3h)} m³/h</strong></small><br><br>

    <h4>Detail</h4>
    Duty: <strong>${fmtSmart(kw)} kW</strong> at ΔT <strong>${fmtSmart(dt)} K</strong><br>
    Fluid: ${f.name} • cp = ${f.cp} kJ/kg·K • ρ = ${f.rho} kg/m³`;
  if (isGlycol && Math.abs(penalty) > 0.5){
    html += `<br><span class="badge badge-warn">+${fmtSmart(penalty)}% more flow vs pure water</span>
             <small class="muted"> Glycol's lower specific heat and higher density mean you must pump more litres for the same kW. Pump head also rises ~10–25% from increased viscosity.</small>`;
  }
  html += assumptionFooter("Q = kW ÷ (cp × ρ × ΔT). Properties at ~30 °C nominal. Increase pump head allowance ~10–25% for glycol viscosity.");
  setResult("watOut", html);
}

/* ---------- Pipe Friction (Hazen-Williams) ---------- */
function pipeHTML(){
  return `
  <div class="explain-tools-row">
    <button type="button" class="explain-link" onclick="openExplanation('pipe_friction_explained')">💡 What do these numbers mean?</button>
  </div>
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
  <div id="pipOut" class="result muted">Pipe friction in plain English: how much pressure the pump has to make to push water through this pipe.</div>`;
}
function calcPipe(){
  const dMm = n("pipD"), qLs = n("pipQ");
  const dM = dMm/1000, qm3s = qLs/1000, C = HW_C[v("pipMat")] || 120, L = n("pipL");
  if (dM <= 0 || qm3s <= 0){ setResult("pipOut", `<span class="bad">Enter diameter and flow.</span>`); return; }
  // hL/L (m/m) = 10.67 × Q^1.852 / ( C^1.852 × D^4.87 )
  const hLperM = 10.67 * Math.pow(qm3s,1.852) / (Math.pow(C,1.852) * Math.pow(dM,4.87));
  const paPerM = hLperM * RHO_W * G;
  const area = Math.PI*Math.pow(dM/2,2);
  const vel = qm3s/area;
  const matName = v("pipMat") === "copper" ? "copper" : v("pipMat") === "plastic" ? "plastic" : "steel";

  // Interpretation status — velocity bands set the headline
  let status, statusText, advice;
  if (vel < 0.5){
    status = "info";
    statusText = "Very low velocity";
    advice = "Flow is sluggish. Air may not purge from the system; sludge may settle in the pipe.";
  } else if (vel <= 1.5){
    status = "good";
    statusText = "Quiet, well-sized";
    advice = "Velocity sits comfortably in the typical band for chilled / heating circuits (1–1.5 m/s).";
  } else if (vel <= 2.5){
    status = "warn";
    statusText = "Borderline — check noise tolerance";
    advice = "Approaching the upper limit. Acceptable for plant rooms; review if pipe runs through occupied spaces.";
  } else if (vel <= 4){
    status = "bad";
    statusText = "Excessive — noise & erosion likely";
    advice = "Velocity is above 2.5 m/s. Consider stepping pipe size up one increment to bring it into the quiet band.";
  } else {
    status = "bad";
    statusText = "Physically implausible — check inputs";
    advice = `A ${dMm} mm pipe cannot realistically carry ${qLs} l/s. Either the diameter is wrong, the flow is wrong, or this isn't water. Sense-check the inputs before using these numbers.`;
  }
  const badgeMap = {good:"badge-good", warn:"badge-warn", bad:"badge-bad", info:"badge-info"};

  let html = `
    <h4>Headline</h4>
    <strong>${fmtSmart(paPerM)} Pa/m</strong> pressure drop along the pipe<br>
    <small class="muted">(${fmtSmart(hLperM*1000)} mm of water-column head per metre)</small><br><br>

    <h4>Velocity</h4>
    <strong>${fmtSmart(vel)} m/s</strong> &nbsp;<span class="badge ${badgeMap[status]}">${statusText}</span><br>
    <small class="muted">${advice}</small><br>
    <small class="muted">Typical band for water systems: <strong>1.0 – 1.5 m/s</strong> quiet • up to 2.5 m/s acceptable • above 2.5 m/s noisy / erosive.</small><br>
    <br>
    <h4>Pipe</h4>
    Ø${dMm} mm internal • ${matName} (Hazen-Williams C = ${C}) • Flow ${fmtSmart(qLs)} l/s`;

  if (L > 0){
    html += `<br><br><h4>Over ${fmtSmart(L)} m run</h4>
             Total head loss: <strong>${fmtSmart(hLperM*L)} m water</strong><br>
             ≈ <strong>${fmtSmart(paPerM*L/1000)} kPa</strong> the pump must overcome on this run alone (excluding fittings).`;
  }
  html += assumptionFooter("Hazen-Williams empirical formula (water, ~10–40 °C). Glycol mixes need a viscosity correction — flow capacity drops 5–25% depending on concentration.");
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
  <div id="exOut" class="result muted">Vessel sizing (Boyle's Law) and pump shaft kW from flow × head ÷ efficiency.</div>`;
}
function waterExpansion(t1, t2){
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
    const Vrec = Vvessel * 1.20;  // 20% safety uplift
    html += `<h4>Expansion Vessel</h4>
             Water expansion when heated: <strong>${fmtSmart(expansion)} L</strong> (${fmtSmart(eps*100)}% of system volume)<br>
             Minimum vessel size: <strong>${fmtSmart(Vvessel)} L</strong>
             <small class="muted">(pre-charge ${fmtSmart(p1)} barg → max ${fmtSmart(p2)} barg before relief)</small><br>
             <span class="badge badge-info">Recommended (with 20% uplift): <strong>${fmtSmart(Vrec)} L</strong></span><br>
             <small class="muted">Always specify the next standard size up. Undersized vessels cause PRV discharge cycles and air ingress on cool-down.</small>`;
  }
  const Q = n("pmpQ")/1000, H = n("pmpH"), eff = n("pmpEff")/100;
  if (Q > 0 && H > 0 && eff > 0){
    const kwHyd = RHO_W*G*Q*H/1000;
    const kwShaft = kwHyd/eff;
    let pumpStatus, pumpText, pumpAdvice;
    if (eff < 0.50)       { pumpStatus = "bad";  pumpText = "Low efficiency"; pumpAdvice = "Consider a more efficient pump or VSD — running cost adds up over years."; }
    else if (eff < 0.65)  { pumpStatus = "warn"; pumpText = "Modest efficiency"; pumpAdvice = "Typical of older fixed-speed pumps. EC/VSD pumps achieve 70–85% on the right duty point."; }
    else if (eff < 0.80)  { pumpStatus = "good"; pumpText = "Good efficiency"; pumpAdvice = "Sensible operating point for an inline circulator."; }
    else                  { pumpStatus = "good"; pumpText = "Excellent efficiency"; pumpAdvice = "Operating near peak efficiency — typical of well-selected EC/VSD pumps."; }
    const badgeMap = {good:"badge-good", warn:"badge-warn", bad:"badge-bad", info:"badge-info"};
    html += (html?"<br><br>":"") + `<h4>Pump Duty</h4>
            Hydraulic power (water leaves the pump): <strong>${fmtSmart(kwHyd)} kW</strong><br>
            Shaft power needed (motor input): <strong>${fmtSmart(kwShaft)} kW</strong> &nbsp;<span class="badge ${badgeMap[pumpStatus]}">${pumpText}</span><br>
            <small class="muted">${pumpAdvice}</small><br>
            <small class="muted">Allow ~15–25% more on the motor selection for safety factor & off-design operation.</small>`;
  }
  if (!html) html = `<span class="bad">Fill in either the vessel section or the pump section to see results.</span>`;
  html += assumptionFooter("Vessel sizing per BS EN 12828 simplified (Boyle's Law on the gas side). Pump kW = ρ × g × Q × H ÷ η.");
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
  <div class="explain-tools-row">
    <button type="button" class="explain-link" onclick="openExplanation('superheat_subcool_explained')">💡 What SH/SC tell you</button>
    <button type="button" class="explain-link" onclick="openExplanation('fgas_regulations_explained')">💡 F-Gas rules</button>
  </div>
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
  <div id="rcOut" class="result muted">Enter pressures (gauge — OTTO adds 1 bar for absolute) and line temperatures. Plain-English diagnosis appears below.</div>`;
}
function calcRefCycle(){
  const ref = v("rcRef");
  let html = "";
  const badgeMap = {good:"badge-good", warn:"badge-warn", bad:"badge-bad", info:"badge-info"};
  const sucP = n("rcSucP"), sucT = n("rcSucT");
  if (sucP > 0 || sucT !== 0){
    const tSat = pToT(ref, sucP+1);
    const sh = sucT - tSat;
    const tgt = ref === "R290" ? "5–10 K" : "5–8 K";
    let status, statusText, advice;
    if (sh < 3)        { status = "bad";  statusText = "Low — flood-back risk"; advice = "Liquid refrigerant may be reaching the compressor — serious damage risk. Check TXV setting, evaporator load, expansion valve sensor strap, refrigerant charge."; }
    else if (sh > 12)  { status = "bad";  statusText = "High — undercharge / TXV starving"; advice = "Evaporator is short of refrigerant. Check liquid sight glass for flash bubbles, refrigerant level, filter dryer, TXV operation."; }
    else if (sh > 8)   { status = "warn"; statusText = "High end of normal"; advice = "Slightly above target — system is running lean. Sense-check charge and TXV adjustment if performance is suffering."; }
    else               { status = "good"; statusText = "Within typical band"; advice = "Healthy suction superheat — TXV and charge are well-matched to current load."; }
    html += `<h4>Superheat (suction side)</h4>
             T<sub>sat</sub> @ ${fmtSmart(sucP)} barg = <strong>${fmtSmart(tSat)} °C</strong><br>
             Suction line is <strong>${fmtSmart(sucT)} °C</strong>, so SH = <strong>${fmtSmart(sh)} K</strong> &nbsp;<span class="badge ${badgeMap[status]}">${statusText}</span><br>
             <small class="muted">${advice}</small><br>
             <small class="muted">Target: <strong>${tgt}</strong> for typical evaporator on ${ref}.</small>`;
  }
  const disP = n("rcDisP"), liqT = n("rcLiqT");
  if (disP > 0 || liqT !== 0){
    const tSat = pToT(ref, disP+1);
    const sc = tSat - liqT;
    let status, statusText, advice;
    if (sc < 3)         { status = "bad";  statusText = "Low — undercharge / flash gas"; advice = "Likely undercharged or condenser short. Check sight glass for flash bubbles, refrigerant level, condenser fans, condenser cleanliness."; }
    else if (sc > 15)   { status = "warn"; statusText = "High — overcharge / restriction"; advice = "Either overcharged or there's a liquid-line restriction (filter dryer blocked, kink, partially closed valve). Recover refrigerant and re-charge to spec."; }
    else                { status = "good"; statusText = "Within typical 5–10 K band"; advice = "Healthy condenser performance — charge level and heat rejection are matched."; }
    html += (html?"<br><br>":"") + `<h4>Subcool (liquid side)</h4>
            T<sub>sat</sub> @ ${fmtSmart(disP)} barg = <strong>${fmtSmart(tSat)} °C</strong><br>
            Liquid line is <strong>${fmtSmart(liqT)} °C</strong>, so SC = <strong>${fmtSmart(sc)} K</strong> &nbsp;<span class="badge ${badgeMap[status]}">${statusText}</span><br>
            <small class="muted">${advice}</small><br>
            <small class="muted">Target: <strong>5–10 K</strong> for typical condenser.</small>`;
  }
  if (!html) html = `<span class="bad">Enter suction or discharge data to begin.</span>`;
  html += assumptionFooter(`Saturation table for ${ref}, linear interpolation • +1 bar for absolute conversion. Always read pressure and temperature at the same point on the same line.`);
  setResult("rcOut", html);
}

/* ---------- F-Gas / CO2e ---------- */
function fgasHTML(){
  return `
  <div class="explain-tools-row">
    <button type="button" class="explain-link" onclick="openExplanation('fgas_regulations_explained')">💡 F-Gas leak-check rules</button>
  </div>
  <div class="field full"><label>Refrigerant</label>${refSelectHTML("fgRef")}</div>
  <div class="form-grid">
    <div class="field"><label>Charge (kg)</label><input id="fgKg" type="number" inputmode="decimal" placeholder="5"></div>
  </div>
  <div id="fgOut" class="result muted">CO₂-equivalent charge and the legal leak-check interval that triggers from it.</div>`;
}
function calcFgas(){
  const ref = v("fgRef"), kg = n("fgKg");
  if (kg <= 0){ setResult("fgOut", `<span class="bad">Enter the refrigerant charge in kg (from the unit nameplate).</span>`); return; }
  const gwp = GWP[ref] || 0;
  const tco2 = kg*gwp/1000;

  let intervalStatus, intervalText, intervalAdvice;
  if (tco2 < 5)        { intervalStatus = "good"; intervalText = "Below threshold";              intervalAdvice = "No mandatory leak check under the F-Gas Regulation. Best practice is still an annual visual inspection."; }
  else if (tco2 < 50)  { intervalStatus = "warn"; intervalText = "12-monthly check required";    intervalAdvice = "Annual leak check by an F-Gas certified person. Keep the F-Gas log on site, updated every visit."; }
  else if (tco2 < 500) { intervalStatus = "bad";  intervalText = "6-monthly check required";     intervalAdvice = "6-monthly checks (or 12-monthly with permanent leak detection). Consider fitting leak detection to halve the workload."; }
  else                 { intervalStatus = "bad";  intervalText = "3-monthly check required";     intervalAdvice = "3-monthly checks (or 6-monthly with permanent leak detection). Permanent leak detection effectively mandatory at this size."; }

  let phaseStatus, phaseText, phaseAdvice;
  if (ref === "R410A"){ phaseStatus = "warn"; phaseText = "High GWP — phase-down"; phaseAdvice = "GWP 2,088 — falls under the EU/UK F-Gas phase-down. Avoid for new equipment; consider R32 or R454B retrofit options."; }
  else if (ref === "R134a"){ phaseStatus = "warn"; phaseText = "High GWP"; phaseAdvice = "GWP 1,430 — being phased down for stationary applications. Replacements include R513A, R450A."; }
  else if (ref === "R32"){ phaseStatus = "info"; phaseText = "Mid GWP, A2L mildly flammable"; phaseAdvice = "GWP 675 — mainstream for splits/VRF. A2L safety classification — observe charge limits per BS EN 378."; }
  else { phaseStatus = "good"; phaseText = "Very low GWP, A3 flammable"; phaseAdvice = "GWP 3 — excellent for the climate. A3 (highly flammable) — strict charge limits and ignition-source rules apply."; }
  const badgeMap = {good:"badge-good", warn:"badge-warn", bad:"badge-bad", info:"badge-info"};

  const html = `
    <h4>Headline</h4>
    <strong>${fmtSmart(tco2)} tCO₂e</strong> &nbsp;<span class="badge ${badgeMap[intervalStatus]}">${intervalText}</span><br>
    <small class="muted">${intervalAdvice}</small><br>
    <small class="muted">Thresholds: <strong>&lt; 5 t</strong> none • <strong>5–50 t</strong> annual • <strong>50–500 t</strong> 6-monthly • <strong>&gt; 500 t</strong> 3-monthly.</small><br><br>

    <h4>Charge calculation</h4>
    ${fmtSmart(kg)} kg of <strong>${ref}</strong> × GWP ${gwp} = <strong>${fmtSmart(kg*gwp)} kg CO₂e</strong> = <strong>${fmtSmart(tco2)} tCO₂e</strong><br><br>

    <h4>Refrigerant character</h4>
    <span class="badge ${badgeMap[phaseStatus]}">${phaseText}</span><br>
    <small class="muted">${phaseAdvice}</small>
    ${assumptionFooter("EU/UK F-Gas Reg 517/2014 thresholds (5 / 50 / 500 tCO₂e). GWP per AR4. Permanent leak detection halves the mandatory check frequency.")}`;
  setResult("fgOut", html);
}

/* ---------- Refrigerant Saturation Lookup ---------- */
function refsatHTML(){
  return `
  <div class="explain-tools-row">
    <button type="button" class="explain-link" onclick="openExplanation('superheat_subcool_explained')">💡 Where you'd use this</button>
  </div>
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
  <div id="rsOut" class="result muted">Pure refrigerant saturation lookup — what's the boiling pressure at a given temperature, or vice versa.</div>`;
}
function calcRefSat(){
  const ref = v("rsRef"), mode = v("rsMode"), val = n("rsVal");
  let html;
  if (mode === "t2p"){
    const p = tToP(ref, val);
    html = `<h4>Result</h4>
            ${ref} saturation at <strong>${fmtSmart(val)} °C</strong>:<br>
            <strong>${fmtSmart(p)} bar absolute</strong> (${fmtSmart(p-1)} bar gauge)<br>
            <small class="muted">A pressure gauge on this refrigerant at this temperature should read about ${fmtSmart(p-1)} barg if the refrigerant is saturated (i.e. boiling/condensing).</small>`;
  } else {
    const t = pToT(ref, val);
    html = `<h4>Result</h4>
            ${ref} saturation at <strong>${fmtSmart(val)} bar absolute</strong> (${fmtSmart(val-1)} bar gauge):<br>
            <strong>${fmtSmart(t)} °C</strong><br>
            <small class="muted">Refrigerant boils/condenses at this temperature when held at this pressure. Subtract this from suction-line temperature to get superheat; subtract liquid-line temp from this to get subcool.</small>`;
  }
  html += assumptionFooter(`Lookup table for ${ref}, 9 points (-30 to +50 °C), linear interpolation. Field gauges typically read in barg — add 1 to convert to absolute.`);
  setResult("rsOut", html);
}

/* ==========================================================================
   ELECTRICAL
   ========================================================================== */

function ohmHTML(){
  return `
  <div class="explain-tools-row">
    <button type="button" class="explain-link" onclick="openExplanation('breaker_tripping')">💡 Why breakers trip</button>
  </div>
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
  <div id="ohmOut" class="result muted">Real power (kW) and apparent power (kVA) from voltage, current and power factor.</div>`;
}
function calcOhm(){
  const cfg = v("ohmCfg"), V = n("ohmV"), I = n("ohmI"), pf = n("ohmPf") || 1;
  if (V <= 0 || I <= 0){ setResult("ohmOut", `<span class="bad">Enter voltage and current.</span>`); return; }
  const apparent = (cfg === "3ph" ? Math.sqrt(3)*V*I : V*I);
  const real = cfg === "dc" ? V*I : apparent*pf;
  const cfgLabel = cfg === "1ph" ? "Single-phase" : cfg === "3ph" ? "Three-phase" : "DC / resistive";

  let pfStatus, pfText, pfAdvice;
  if (cfg === "dc")            { pfStatus = "info"; pfText = "DC — power factor not applicable"; pfAdvice = "DC loads don't have power factor; real power = V × I."; }
  else if (pf >= 0.95)         { pfStatus = "good"; pfText = "Excellent power factor"; pfAdvice = "Resistive load (heater) or well-corrected motor — utility happy."; }
  else if (pf >= 0.85)         { pfStatus = "good"; pfText = "Good power factor"; pfAdvice = "Typical for modern inductive loads (motors, pumps with VSD)."; }
  else if (pf >= 0.70)         { pfStatus = "warn"; pfText = "Modest power factor"; pfAdvice = "Older direct-on-line motors. PF correction capacitors would reduce kVA demand & utility charges."; }
  else                         { pfStatus = "bad";  pfText = "Poor power factor"; pfAdvice = "Heavy inductive load. PF correction is almost certainly cost-effective — utility likely surcharging kVA demand."; }
  const badgeMap = {good:"badge-good", warn:"badge-warn", bad:"badge-bad", info:"badge-info"};

  const html = `
    <h4>Headline</h4>
    Real power: <strong>${fmtSmart(real/1000)} kW</strong> (${fmtSmart(real)} W)<br>
    Apparent power: <strong>${fmtSmart(apparent/1000)} kVA</strong> &nbsp;<span class="badge ${badgeMap[pfStatus]}">${pfText}</span><br>
    <small class="muted">${pfAdvice}</small><br><br>

    <h4>Detail</h4>
    ${cfgLabel}: ${fmtSmart(V)} V × ${fmtSmart(I)} A${cfg!=='dc' ? ` × pf ${pf}` : ""}<br>
    Resistance V/I (resistive only): ${fmtSmart(I>0?V/I:0)} Ω
    ${assumptionFooter("Real power = useful power that does work. Apparent power = V × I with no regard for phase. Power factor = real ÷ apparent. Utilities charge on apparent kVA demand.")}`;
  setResult("ohmOut", html);
}

function vdropHTML(){
  return `
  <div class="explain-tools-row">
    <button type="button" class="explain-link" onclick="openExplanation('vdrop_bs7671_explained')">💡 BS 7671 limits explained</button>
    <button type="button" class="explain-link" onclick="openExplanation('breaker_tripping')">💡 Why breakers trip</button>
  </div>
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
  <div id="vdOut" class="result muted">BS 7671 caps voltage drop at 3% (lighting) / 5% (everything else). Cu cable @ 70 °C.</div>`;
}
function calcVdrop(){
  const cfg = v("vdCfg"), V = n("vdV"), I = n("vdI"), L = n("vdL"), csa = n("vdCsa"), pf = n("vdPf") || 1;
  if (csa <= 0 || L <= 0 || I <= 0){ setResult("vdOut", `<span class="bad">Fill in current (A), length (m) and cable CSA (mm²).</span>`); return; }
  const Rper = 0.0224 / csa;
  const vd = (cfg === "1ph" ? 2 : Math.sqrt(3)) * I * L * Rper * pf;
  const pct = V > 0 ? vd/V*100 : 0;

  let status, statusText, advice;
  if (pct <= 3)        { status = "good"; statusText = "Within lighting limit (3%)"; advice = "Comfortably under both BS 7671 limits — fine for any circuit."; }
  else if (pct <= 5)   { status = "warn"; statusText = "Within power limit (5%)";   advice = "OK for power but exceeds the lighting limit. For lighting circuits, step CSA up one size."; }
  else if (pct <= 8)   { status = "bad";  statusText = "Exceeds BS 7671 5% — uprate"; advice = "Step the cable up at least one size. Drop scales with 1/CSA — going from 4 mm² to 6 mm² typically drops the percentage by ~33%."; }
  else                 { status = "bad";  statusText = "Severe — re-design"; advice = "Cable is significantly undersized. Step up two sizes or split the run / use three-phase if available. Equipment will under-perform and overheat."; }
  const badgeMap = {good:"badge-good", warn:"badge-warn", bad:"badge-bad", info:"badge-info"};
  const cfgLabel = cfg === "1ph" ? "Single-phase" : "Three-phase";

  const html = `
    <h4>Headline</h4>
    Voltage drop: <strong>${fmtSmart(vd)} V</strong> (${fmtSmart(pct)}% of ${fmtSmart(V)} V) &nbsp;<span class="badge ${badgeMap[status]}">${statusText}</span><br>
    <small class="muted">${advice}</small><br>
    <small class="muted">BS 7671 limits: <strong>3%</strong> lighting • <strong>5%</strong> all other circuits.</small><br><br>

    <h4>Detail</h4>
    ${cfgLabel}: ${fmtSmart(I)} A × ${fmtSmart(L)} m / ${fmtSmart(csa)} mm² Cu @ 70 °C × pf ${pf}<br>
    Cable resistance: ${fmtSmart(Rper*1000)} mΩ/m<br>
    Total loop R: ${fmtSmart((cfg==="1ph"?2:1)*L*Rper)} Ω
    ${assumptionFooter("Copper @ 70 °C, ρ = 0.0224 Ω·mm²/m. Resistance only — no reactance. Accurate up to ~16 mm² CSA. Above that, use BS 7671 Appendix 4 mV/A/m tables which include reactance.")}`;
  setResult("vdOut", html);
}

function motorHTML(){
  return `
  <div class="explain-tools-row">
    <button type="button" class="explain-link" onclick="openExplanation('fan_laws')">💡 Fan laws</button>
    <button type="button" class="explain-link" onclick="openExplanation('pulley_changes')">💡 Pulley changes</button>
  </div>
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
  <div id="mtOut" class="result muted">How much of the motor's electrical input ends up as heat in the conditioned space.</div>`;
}
function calcMotor(){
  const kw = n("mtKw"), eff = n("mtEff")/100, loc = v("mtLoc");
  if (kw <= 0 || eff <= 0){ setResult("mtOut", `<span class="bad">Enter motor input (kW) and efficiency (%).</span>`); return; }
  const losses = kw*(1-eff);
  const heatToSpace = loc === "in" ? kw : losses;

  let effStatus, effText, effAdvice;
  if (eff >= 0.92)        { effStatus = "good"; effText = "IE3 / IE4 efficiency"; effAdvice = "Modern premium-efficiency motor. Heat losses minimised."; }
  else if (eff >= 0.85)   { effStatus = "good"; effText = "Standard efficiency"; effAdvice = "Typical IE2 (high-efficiency) motor. Acceptable for most applications."; }
  else if (eff >= 0.75)   { effStatus = "warn"; effText = "Older / smaller motor"; effAdvice = "Below IE2. Consider replacement at next overhaul — payback often 2–5 years on running motors."; }
  else                    { effStatus = "bad";  effText = "Low efficiency — review"; effAdvice = "Significant losses as heat. Check the figure is right; older small motors can dip below 75% but a building services fan or pump shouldn't."; }
  const badgeMap = {good:"badge-good", warn:"badge-warn", bad:"badge-bad", info:"badge-info"};

  let html = `
    <h4>Headline</h4>
    Heat to space: <strong>${fmtSmart(heatToSpace)} kW</strong>${loc === "in" ? " (all input — motor inside)" : " (losses only — shaft work leaves the space)"}<br>
    <small class="muted">${loc === "in" ? "When the motor sits inside the room being conditioned, ALL its electrical input becomes heat. The shaft work drives a fan or pump that also dumps its energy into the room." : "When the motor sits inside but drives equipment outside (e.g. inside an AHU plant room driving an outdoor extract fan), only the motor's inefficiency stays as room heat — the shaft work leaves with the airflow."}</small><br><br>

    <h4>Detail</h4>
    Input power: ${fmtSmart(kw)} kW @ ${fmtSmart(eff*100)}% η &nbsp;<span class="badge ${badgeMap[effStatus]}">${effText}</span><br>
    <small class="muted">${effAdvice}</small><br>
    Motor losses (always heat): <strong>${fmtSmart(losses)} kW</strong> (${fmtSmart((1-eff)*100)}% of input)
    ${assumptionFooter("Use motor losses only when shaft work leaves the conditioned space (outdoor fan, basement pump). Otherwise treat all input as room heat gain.")}`;
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
  if (pa === 0){ setResult("pressOut", `<span class="bad">Enter a value to convert.</span>`); return; }
  const html = `<h4>All units</h4>
                <strong>${fmtSmart(pa)} Pa</strong><br>
                ${fmtSmart(pa/1000)} kPa<br>
                ${fmtSmart(pa/9.80665)} mmH₂O<br>
                ${fmtSmart(pa/249.0889)} in.wg<br>
                ${fmtSmart(pa/100000)} bar<br>
                ${fmtSmart(pa/6894.757)} PSI`
                + assumptionFooter("1 mmH₂O = 9.80665 Pa • 1 in.wg = 249.0889 Pa • 1 bar = 100,000 Pa");
  setResult("pressOut", html);
}

function heatHTML(){
  return `
  <div class="field"><label>Capacity (kW)</label><input id="kwVal" type="number" inputmode="decimal" placeholder="5"></div>
  <div id="heatOut" class="result muted">Converts kW to BTU/hr and TR.</div>`;
}
function calcHeat(){
  const kw = n("kwVal");
  if (kw === 0){ setResult("heatOut", `<span class="bad">Enter a kW value to convert.</span>`); return; }
  setResult("heatOut",
    `<h4>All units</h4>
     <strong>${fmtSmart(kw)} kW</strong><br>
     ${fmtSmart(kw*3412.142)} BTU/hr<br>
     ${fmtSmart(kw/3.51685)} TR (tons of refrigeration)`
    + assumptionFooter("1 TR = 3.51685 kW • 1 kW = 3,412.14 BTU/hr"));
}

function roomHTML(){
  return `
  <div class="explain-tools-row">
    <button type="button" class="explain-link" onclick="openExplanation('airflow_vs_resistance')">💡 Airflow vs resistance</button>
  </div>
  <div class="form-grid">
    <div class="field"><label>Length (m)</label><input id="rmL" type="number" inputmode="decimal" placeholder="6"></div>
    <div class="field"><label>Width (m)</label><input id="rmW" type="number" inputmode="decimal" placeholder="4"></div>
    <div class="field"><label>Height (m)</label><input id="rmH" type="number" inputmode="decimal" placeholder="2.4"></div>
    <div class="field"><label>Airflow (l/s)</label><input id="rmQ" type="number" inputmode="decimal" placeholder="100"></div>
  </div>
  <div id="rmOut" class="result muted">Room volume and air changes per hour (ACH) with use-case guidance.</div>`;
}
function calcRoom(){
  const vol = n("rmL")*n("rmW")*n("rmH");
  const qLs = n("rmQ");
  const m3h = qLs*3.6;
  const ach = vol > 0 ? m3h/vol : 0;
  if (vol <= 0){ setResult("rmOut", `<span class="bad">Enter room L × W × H.</span>`); return; }

  let status, statusText, advice;
  if (ach < 1)         { status = "bad";  statusText = "Insufficient for occupied space"; advice = "Below 1 ACH — air feels stale, CO₂ rises quickly. Approved Doc F minimum for offices is ~1 ACH."; }
  else if (ach < 4)    { status = "good"; statusText = "Office / general"; advice = "Typical band for offices, retail, residential — meets Approved Doc F."; }
  else if (ach < 10)   { status = "good"; statusText = "Meeting / classroom"; advice = "Higher band suits dense occupancy or longer dwell time."; }
  else if (ach < 20)   { status = "warn"; statusText = "Kitchen / lab / busy"; advice = "High-load space — appropriate for kitchens, gym, or labs with light hazards."; }
  else                 { status = "warn"; statusText = "Cleanroom / fume / heavy lab"; advice = "Very high — appropriate for cleanrooms or fume-control. Confirm whether this much air is genuinely needed."; }
  const badgeMap = {good:"badge-good", warn:"badge-warn", bad:"badge-bad", info:"badge-info"};

  setResult("rmOut",
    `<h4>Headline</h4>
     ACH = <strong>${fmtSmart(ach)}</strong> &nbsp;<span class="badge ${badgeMap[status]}">${statusText}</span><br>
     <small class="muted">${advice}</small><br>
     <small class="muted">Typical bands: <strong>1–4</strong> office • <strong>4–10</strong> meeting/classroom • <strong>10–20</strong> kitchen/lab • <strong>20+</strong> cleanroom.</small><br><br>

     <h4>Detail</h4>
     Volume: ${fmtSmart(vol)} m³ (${fmtSmart(n("rmL"))} × ${fmtSmart(n("rmW"))} × ${fmtSmart(n("rmH"))} m)<br>
     Airflow: ${fmtSmart(qLs)} l/s = ${fmtSmart(m3h)} m³/h`
     + assumptionFooter("Bands per CIBSE Guide A / Approved Document F. ACH = airflow ÷ room volume; same ACH means very different absolute flows in different room sizes."));
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
