const panel = document.getElementById("toolPanel");
const panelTitle = document.getElementById("panelTitle");
const panelBody = document.getElementById("panelBody");

function n(id){ return parseFloat(document.getElementById(id).value) || 0; }
function fmt(x, d=3){ return Number.isFinite(x) ? x.toFixed(d) : "0"; }

function openTool(tool){
  panel.classList.remove("hidden");
  const tools = {
    duct: ductHTML,
    pressure: pressureHTML,
    grille: grilleHTML,
    heat: heatHTML,
    water: waterHTML,
    room: roomHTML
  };
  const titles = {
    duct:"Duct & Airflow Calculator",
    pressure:"Pressure Converter",
    grille:"Grille / Free Area Calculator",
    heat:"Heating & Cooling Converter",
    water:"Water Flow Calculator",
    room:"Room Volume / ACH Calculator"
  };
  panelTitle.textContent = titles[tool];
  panelBody.innerHTML = tools[tool]();
  panel.scrollIntoView({behavior:"smooth",block:"start"});
}
function closeTool(){ panel.classList.add("hidden"); }

function ductHTML(){
return `
<div class="form-grid">
  <div class="field"><label>Duct diameter (mm)</label><input id="ductD" type="number" placeholder="630"></div>
  <div class="field"><label>Airflow</label><input id="ductQ" type="number" placeholder="900"></div>
  <div class="field"><label>Airflow unit</label><select id="ductUnit"><option value="ls">l/s</option><option value="m3h">m³/h</option><option value="cfm">CFM</option><option value="m3s">m³/s</option></select></div>
</div>
<button class="calc-btn" onclick="calcDuct()">Calculate</button>
<div id="ductOut" class="result muted">Enter diameter, optionally airflow, then calculate.</div>`;
}
function toM3s(v,u){
  if(u==="ls") return v/1000;
  if(u==="m3h") return v/3600;
  if(u==="cfm") return v*0.00047194745;
  return v;
}
function fromM3s(q){
  return {ls:q*1000,m3h:q*3600,cfm:q/0.00047194745};
}
function calcDuct(){
  const dmm=n("ductD"), q=n("ductQ"), u=document.getElementById("ductUnit").value;
  const d=dmm/1000;
  const area=Math.PI*Math.pow(d/2,2);
  let html=`<strong>Area: ${fmt(area,3)} m²</strong><br>Formula: A = π × (D ÷ 2)²`;
  if(q>0 && area>0){
    const qms=toM3s(q,u);
    const vel=qms/area;
    const conv=fromM3s(qms);
    let band = vel < 2 ? "<span class='warn'>Low velocity</span>" : vel <= 5 ? "<span class='good'>Typical HVAC range</span>" : vel <= 8 ? "<span class='warn'>High-ish velocity</span>" : "<span class='bad'>High velocity</span>";
    html+=`<br><br><strong>Velocity: ${fmt(vel,2)} m/s</strong><br>${band}<br>
    Airflow: ${fmt(conv.ls,0)} l/s • ${fmt(conv.m3h,0)} m³/h • ${fmt(conv.cfm,0)} CFM`;
  }
  document.getElementById("ductOut").innerHTML=html;
}

function pressureHTML(){
return `
<div class="form-grid">
  <div class="field"><label>Value</label><input id="pressVal" type="number" placeholder="10"></div>
  <div class="field"><label>From unit</label><select id="pressUnit">
    <option value="mmh2o">mmH₂O</option><option value="pa">Pa</option><option value="kpa">kPa</option><option value="inwg">in.wg</option><option value="psi">PSI</option>
  </select></div>
</div>
<button class="calc-btn" onclick="calcPressure()">Convert pressure</button>
<div id="pressOut" class="result muted">Example: 10 mmH₂O = 98.1 Pa</div>`;
}
function pressureToPa(v,u){
  if(u==="mmh2o") return v*9.80665;
  if(u==="kpa") return v*1000;
  if(u==="inwg") return v*249.0889;
  if(u==="psi") return v*6894.757;
  return v;
}
function calcPressure(){
  const pa=pressureToPa(n("pressVal"), document.getElementById("pressUnit").value);
  document.getElementById("pressOut").innerHTML =
  `<strong>${fmt(pa,1)} Pa</strong><br>${fmt(pa/1000,3)} kPa<br>${fmt(pa/9.80665,2)} mmH₂O<br>${fmt(pa/249.0889,3)} in.wg<br>${fmt(pa/6894.757,4)} PSI`;
}

function grilleHTML(){
return `
<div class="form-grid">
  <div class="field"><label>Width (mm)</label><input id="grW" type="number" placeholder="600"></div>
  <div class="field"><label>Height (mm)</label><input id="grH" type="number" placeholder="300"></div>
  <div class="field"><label>Free area %</label><input id="grFree" type="number" placeholder="60"></div>
  <div class="field"><label>Airflow (l/s)</label><input id="grQ" type="number" placeholder="150"></div>
</div>
<button class="calc-btn" onclick="calcGrille()">Calculate grille</button>
<div id="grOut" class="result muted">Useful for grille face/free area checks.</div>`;
}
function calcGrille(){
  const gross=(n("grW")/1000)*(n("grH")/1000);
  const free=gross*(n("grFree")/100);
  const q=n("grQ")/1000;
  const vel=free>0?q/free:0;
  document.getElementById("grOut").innerHTML =
  `<strong>Gross area: ${fmt(gross,3)} m²</strong><br>Free area: ${fmt(free,3)} m²<br>Free area velocity: <strong>${fmt(vel,2)} m/s</strong>`;
}

function heatHTML(){
return `
<div class="field"><label>Capacity</label><input id="kwVal" type="number" placeholder="5"></div>
<button class="calc-btn" onclick="calcHeat()">Convert kW</button>
<div id="heatOut" class="result muted">Converts kW to BTU/hr and TR.</div>`;
}
function calcHeat(){
  const kw=n("kwVal");
  document.getElementById("heatOut").innerHTML =
  `<strong>${fmt(kw,2)} kW</strong><br>${fmt(kw*3412.142,0)} BTU/hr<br>${fmt(kw/3.51685,2)} TR`;
}

function waterHTML(){
return `
<div class="form-grid">
  <div class="field"><label>Duty (kW)</label><input id="watKw" type="number" placeholder="10"></div>
  <div class="field"><label>ΔT (°C)</label><input id="watDt" type="number" placeholder="5"></div>
</div>
<button class="calc-btn" onclick="calcWater()">Calculate water flow</button>
<div id="watOut" class="result muted">Uses water flow ≈ kW ÷ (4.186 × ΔT)</div>`;
}
function calcWater(){
  const flow=n("watKw")/(4.186*n("watDt"));
  document.getElementById("watOut").innerHTML =
  `<strong>${fmt(flow,3)} l/s</strong><br>${fmt(flow*60,1)} l/min<br>${fmt(flow*3.6,2)} m³/h`;
}

function roomHTML(){
return `
<div class="form-grid">
  <div class="field"><label>Length (m)</label><input id="rmL" type="number" placeholder="6"></div>
  <div class="field"><label>Width (m)</label><input id="rmW" type="number" placeholder="4"></div>
  <div class="field"><label>Height (m)</label><input id="rmH" type="number" placeholder="2.4"></div>
  <div class="field"><label>Airflow (l/s)</label><input id="rmQ" type="number" placeholder="100"></div>
</div>
<button class="calc-btn" onclick="calcRoom()">Calculate room / ACH</button>
<div id="rmOut" class="result muted">Room volume and air changes per hour.</div>`;
}
function calcRoom(){
  const vol=n("rmL")*n("rmW")*n("rmH");
  const m3h=n("rmQ")*3.6;
  const ach=vol>0?m3h/vol:0;
  document.getElementById("rmOut").innerHTML =
  `<strong>Volume: ${fmt(vol,1)} m³</strong><br>Airflow: ${fmt(m3h,0)} m³/h<br>ACH: <strong>${fmt(ach,2)}</strong>`;
}

function runSmart(){
  const s=document.getElementById("smartInput").value.toLowerCase();
  const nums=s.match(/[-+]?\d*\.?\d+/g)?.map(Number) || [];
  let out="I couldn't understand that yet. Try: 630 duct 900 l/s or 10 mmH2O to Pa";
  if(s.includes("duct") && nums.length>=1){
    const d=nums[0]/1000, area=Math.PI*Math.pow(d/2,2);
    out=`Duct area = <strong>${fmt(area,3)} m²</strong>`;
    if(nums.length>=2){
      const q=nums[1]/1000;
      out+=`<br>Velocity at ${nums[1]} l/s = <strong>${fmt(q/area,2)} m/s</strong>`;
    }
  } else if((s.includes("mmh2o") || s.includes("mm h2o") || s.includes("mmwg")) && nums.length>=1){
    out=`${nums[0]} mmH₂O = <strong>${fmt(nums[0]*9.80665,1)} Pa</strong>`;
  } else if(s.includes("kw") && nums.length>=1){
    out=`${nums[0]} kW = <strong>${fmt(nums[0]*3412.142,0)} BTU/hr</strong> = ${fmt(nums[0]/3.51685,2)} TR`;
  }
  document.getElementById("smartResult").innerHTML=out;
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js");
}
