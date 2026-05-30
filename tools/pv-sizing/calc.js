/* ─── PV SIZING TOOL — CALCULATION ENGINE ────────────────────────────
   Depends on equipment-data.js (loaded first) which defines:
     EQUIPMENT_DATA, CLIMATE_ZONES_DATA, getZoneFromZip(zip)
   No imports/exports — all functions are global scope.
   ──────────────────────────────────────────────────────────────────── */

/* ─── HELPERS ─────────────────────────────────────────────────────── */

function el(id) { return document.getElementById(id); }
function set(id, hidden) { el(id).classList.toggle('hidden', hidden); }
function txt(id, s) { el(id).textContent = s; }

/* ─── STATE ───────────────────────────────────────────────────────── */

const state = {
  climateZone:       'mixed',
  zipManualOverride: false,
  busRating:         null,
  mainBreaker:       null,
  consumptionMode:   'annual',
  annualKwh:         null,
  monthly: {
    jan: null, feb: null, mar: null, apr: null,
    may: null, jun: null, jul: null, aug: null,
    sep: null, oct: null, nov: null, dec: null
  },
  offsetGoal:    100,
  backupGoal:    'none',
  moduleWattage: 400,
  mfg:           '',
  model:         '',
  narrativeTab:  'homeowner'
};

/* ─── CALCULATED VALUES (module-level, updated by render) ─────────── */

let _calc = {
  annualKwh:          0,
  annualNeeded:       0,
  dailyNeeded:        0,
  sunHours:           0,
  systemSizeKw:       0,
  moduleCount:        0,
  totalDCkw:          0,
  estimatedACcurrent: 0,
  inverterCount:      0,
  totalACkw:          0,
  dcacRatio:          null,
  maxBackfeed:        0,
  prelimPass:         false,
  modelObj:           null
};

/* ─── ZIP INPUT ───────────────────────────────────────────────────── */

function onZipInput() {
  const zip = el('zipInput').value.trim();

  if (zip.length === 5) {
    const zone = getZoneFromZip(zip);
    if (zone) {
      state.climateZone = zone;
      el('climateZoneSelect').value = zone;
      const zoneName = CLIMATE_ZONES_DATA[zone].label;
      el('zipAutoNote').textContent = 'Climate zone auto-set to: ' + zoneName;
      set('zipAutoNote', false);
      set('zipNotFoundNote', true);
      state.zipManualOverride = false;
    } else {
      state.climateZone = 'mixed';
      el('climateZoneSelect').value = 'mixed';
      set('zipNotFoundNote', false);
      set('zipAutoNote', true);
    }
  } else {
    if (!state.zipManualOverride) {
      set('zipAutoNote', true);
      set('zipNotFoundNote', true);
    }
  }

  render();
}

/* ─── CLIMATE ZONE CHANGE ─────────────────────────────────────────── */

function onClimateZoneChange() {
  state.climateZone = el('climateZoneSelect').value;
  state.zipManualOverride = true;
  set('zipNotFoundNote', true);
  set('zipAutoNote', true);
  render();
}

/* ─── CONSUMPTION MODE ────────────────────────────────────────────── */

function setConsumptionMode(mode) {
  state.consumptionMode = mode;

  set('annualSection',  mode !== 'annual');
  set('monthlySection', mode !== 'monthly');

  // Update pill active states
  el('consumptionModeToggle').querySelectorAll('[data-mode]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });

  render();
}

/* ─── MONTHLY INPUTS ──────────────────────────────────────────────── */

function onMonthlyInput(month) {
  const monthIds = {
    jan: 'monthJan', feb: 'monthFeb', mar: 'monthMar', apr: 'monthApr',
    may: 'monthMay', jun: 'monthJun', jul: 'monthJul', aug: 'monthAug',
    sep: 'monthSep', oct: 'monthOct', nov: 'monthNov', dec: 'monthDec'
  };
  state.monthly[month] = parseFloat(el(monthIds[month]).value) || null;
  updateMonthlyTotal();
  render();
}

function updateMonthlyTotal() {
  const months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
  let sum = 0;
  let allFilled = true;

  months.forEach(m => {
    if (state.monthly[m] !== null && !isNaN(state.monthly[m])) {
      sum += state.monthly[m];
    } else {
      allFilled = false;
    }
  });

  el('monthlyRunningTotal').textContent = sum > 0
    ? sum.toLocaleString(undefined, { maximumFractionDigits: 0 }) + ' kWh'
    : '0 kWh';

  set('monthlyIncompleteNote', allFilled);
}

/* ─── BACKUP GOAL ─────────────────────────────────────────────────── */

function setBackupGoal(goal) {
  state.backupGoal = goal;

  el('backupGoalGroup').querySelectorAll('[data-backup]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.backup === goal);
  });

  render();
}

/* ─── MODULE WATTAGE ──────────────────────────────────────────────── */

function onModuleWattageChange() {
  state.moduleWattage = parseInt(el('moduleWattageSelect').value) || 400;
  render();
}

/* ─── MANUFACTURER / MODEL SELECTORS ─────────────────────────────── */

function onMfgChange() {
  state.mfg = el('eqMfgSelect').value;
  state.model = '';

  const modelSelect = el('eqModelSelect');
  // Clear existing options
  modelSelect.innerHTML = '<option value="">— Select model —</option>';

  if (state.mfg && EQUIPMENT_DATA[state.mfg]) {
    const mfgObj = EQUIPMENT_DATA[state.mfg];
    Object.entries(mfgObj.models).forEach(([key, model]) => {
      const opt = document.createElement('option');
      opt.value = key;
      opt.textContent = model.name;
      modelSelect.appendChild(opt);
    });
    modelSelect.disabled = false;
  } else {
    modelSelect.disabled = true;
  }

  // Hide specs and non-standard note when mfg changes
  set('eqNonStandardNote', true);
  set('eqSpecsBlock', true);

  render();
}

function onModelChange() {
  state.model = el('eqModelSelect').value;

  if (state.mfg && state.model && EQUIPMENT_DATA[state.mfg]) {
    const modelObj = EQUIPMENT_DATA[state.mfg].models[state.model];
    if (modelObj) {
      // Non-standard warning
      set('eqNonStandardNote', !modelObj.nonStandardUS);

      // Specs block
      let specsHtml = '';
      if (modelObj.type === 'micro') {
        specsHtml += '<p><strong>Type:</strong> Microinverter</p>';
        specsHtml += '<p><strong>AC Output / Unit:</strong> ' + modelObj.acOutputPerUnit.toFixed(2) + ' A</p>';
        specsHtml += '<p><strong>Max per Branch:</strong> ' + modelObj.maxPerBranch + '</p>';
        if (modelObj.recommendedModuleW) {
          specsHtml += '<p><strong>Recommended Module:</strong> ' + modelObj.recommendedModuleW + '</p>';
        }
        if (modelObj.gridForming) {
          specsHtml += '<p><strong>Grid-Forming:</strong> Yes (IQ8 series — storm mode capable)</p>';
        }
      } else if (modelObj.type === 'string') {
        specsHtml += '<p><strong>Type:</strong> String Inverter</p>';
        specsHtml += '<p><strong>AC Output:</strong> ' + modelObj.acOutputCurrent + ' A</p>';
        specsHtml += '<p><strong>Breaker:</strong> ' + modelObj.breaker + ' A</p>';
        specsHtml += '<p><strong>DC VOC Max:</strong> ' + (modelObj.dcVocMax || '—') + ' V</p>';
        if (modelObj.mpptMin && modelObj.mpptMax) {
          specsHtml += '<p><strong>MPPT Range:</strong> ' + modelObj.mpptMin + '–' + modelObj.mpptMax + ' V</p>';
        }
      } else if (modelObj.type === 'hybrid' || modelObj.type === 'ess') {
        specsHtml += '<p><strong>Type:</strong> ' + (modelObj.type === 'hybrid' ? 'Hybrid Inverter/ESS' : 'AC-Coupled ESS') + '</p>';
        if (modelObj.kw) {
          specsHtml += '<p><strong>Rated AC Output:</strong> ' + modelObj.kw + ' kW</p>';
        }
        if (modelObj.kwh) {
          specsHtml += '<p><strong>Storage Capacity:</strong> ' + modelObj.kwh + ' kWh</p>';
        }
        specsHtml += '<p><strong>AC Output Current:</strong> ' + modelObj.acOutputCurrent + ' A</p>';
        specsHtml += '<p><strong>Breaker:</strong> ' + modelObj.breaker + ' A</p>';
        if (modelObj.dcVocMax) {
          specsHtml += '<p><strong>DC VOC Max:</strong> ' + modelObj.dcVocMax + ' V</p>';
        }
        if (modelObj.mpptMin && modelObj.mpptMax) {
          specsHtml += '<p><strong>MPPT Range:</strong> ' + modelObj.mpptMin + '–' + modelObj.mpptMax + ' V</p>';
        }
        if (modelObj.maxDCinputKw) {
          specsHtml += '<p><strong>Max DC Input:</strong> ' + modelObj.maxDCinputKw + ' kW</p>';
        }
        if (modelObj.pcs) {
          specsHtml += '<p><strong>PCS:</strong> ' + modelObj.pcs + '</p>';
        }
        if (modelObj.connection) {
          specsHtml += '<p><strong>Connection:</strong> ' + modelObj.connection + '</p>';
        }
        if (modelObj.configNote) {
          specsHtml += '<p class="note-text"><strong>Note:</strong> ' + modelObj.configNote + '</p>';
        }
        if (modelObj.offgridNote) {
          specsHtml += '<p class="note-text"><strong>Off-Grid Note:</strong> ' + modelObj.offgridNote + '</p>';
        }
        if (modelObj.notes) {
          specsHtml += '<p class="note-text">' + modelObj.notes + '</p>';
        }
      }

      el('eqSpecsBlock').innerHTML = specsHtml;
      set('eqSpecsBlock', !specsHtml);
    } else {
      set('eqNonStandardNote', true);
      set('eqSpecsBlock', true);
    }
  } else {
    set('eqNonStandardNote', true);
    set('eqSpecsBlock', true);
  }

  render();
}

/* ─── NARRATIVE TAB ───────────────────────────────────────────────── */

function setNarrativeTab(tab) {
  state.narrativeTab = tab;

  el('tabHomeowner').classList.toggle('active', tab === 'homeowner');
  el('tabInstaller').classList.toggle('active', tab === 'installer');

  set('narrativeHomeowner', tab !== 'homeowner');
  set('narrativeInstaller', tab !== 'installer');
}

/* ─── INTERCONNECTION CALC HANDOFF ───────────────────────────────── */

function openInterconnectionCalc() {
  const params = new URLSearchParams();
  if (state.busRating)   params.set('bus',    state.busRating);
  if (state.mainBreaker) params.set('main',   state.mainBreaker);
  if (_calc.estimatedACcurrent > 0) params.set('acOutput', _calc.estimatedACcurrent.toFixed(1));
  if (state.mfg)   params.set('manufacturer', state.mfg);
  if (state.model) params.set('model',        state.model);
  params.set('source', 'pv-sizing');

  const url = '/tools/120-calc/?' + params.toString();
  window.open(url, '_blank');
}

/* ─── CORE CALCULATION ────────────────────────────────────────────── */

function calculateSystem() {
  // ── Annual kWh
  let annualKwh = 0;
  if (state.consumptionMode === 'monthly') {
    const months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
    months.forEach(m => {
      if (state.monthly[m] !== null && !isNaN(state.monthly[m])) {
        annualKwh += state.monthly[m];
      }
    });
  } else {
    annualKwh = state.annualKwh || 0;
  }

  const annualNeeded = annualKwh * (state.offsetGoal / 100);
  const dailyNeeded  = annualNeeded / 365;

  const zoneData   = CLIMATE_ZONES_DATA[state.climateZone] || CLIMATE_ZONES_DATA['mixed'];
  const sunHours   = zoneData.peakSunHours;

  let systemSizeKw = 0;
  if (sunHours > 0 && annualKwh > 0) {
    systemSizeKw = dailyNeeded / (sunHours * 0.80);
    systemSizeKw = Math.round(systemSizeKw * 10) / 10;
  }

  const moduleWattage = state.moduleWattage || 400;
  const moduleCount   = systemSizeKw > 0
    ? Math.ceil(systemSizeKw * 1000 / moduleWattage)
    : 0;
  const totalDCkw     = moduleCount * moduleWattage / 1000;

  // ── Inverter calculations
  let estimatedACcurrent = 0;
  let inverterCount = 0;
  let totalACkw = 0;
  let dcacRatio = null;
  let modelObj = null;

  if (state.mfg && state.model && EQUIPMENT_DATA[state.mfg]) {
    modelObj = EQUIPMENT_DATA[state.mfg].models[state.model] || null;
  }

  if (modelObj) {
    if (modelObj.type === 'string') {
      // Tesla string inverter
      if (modelObj.kw > 0) {
        inverterCount    = Math.ceil(systemSizeKw / modelObj.kw);
        totalACkw        = inverterCount * modelObj.kw;
        dcacRatio        = totalACkw > 0 ? systemSizeKw / totalACkw : null;
        estimatedACcurrent = modelObj.acOutputCurrent * inverterCount;
      }
    } else if (modelObj.type === 'hybrid' || modelObj.type === 'ess') {
      // Tesla ESS or hybrid
      estimatedACcurrent = modelObj.acOutputCurrent;
      totalACkw          = modelObj.kw || 0;
    } else if (modelObj.type === 'micro') {
      // Enphase microinverters
      inverterCount      = moduleCount;
      const totalACamps  = inverterCount * modelObj.acOutputPerUnit;
      estimatedACcurrent = totalACamps;
      totalACkw          = totalACamps * 240 / 1000; // approximate
      dcacRatio          = null; // 1:1 by nature
    }
  } else {
    // No manufacturer selected — estimate at 240V
    if (systemSizeKw > 0) {
      estimatedACcurrent = Math.round((systemSizeKw * 1000 / 240) * 10) / 10;
    }
  }

  // ── Service check
  let maxBackfeed = 0;
  let prelimPass  = false;
  if (state.busRating && state.mainBreaker) {
    maxBackfeed = (state.busRating * 1.2) - state.mainBreaker;
    prelimPass  = estimatedACcurrent <= maxBackfeed && state.mainBreaker < state.busRating * 1.2;
  }

  // ── Persist to module-level _calc
  _calc = {
    annualKwh,
    annualNeeded,
    dailyNeeded,
    sunHours,
    systemSizeKw,
    moduleCount,
    totalDCkw,
    estimatedACcurrent,
    inverterCount,
    totalACkw,
    dcacRatio,
    maxBackfeed,
    prelimPass,
    modelObj
  };
}

/* ─── INVERTER OUTPUT HTML ────────────────────────────────────────── */

function buildInverterOutputHtml() {
  const { modelObj, systemSizeKw, inverterCount, totalACkw, dcacRatio, moduleCount } = _calc;

  if (!modelObj) {
    return '<p class="calc-row">~' + _calc.estimatedACcurrent.toFixed(1) +
      'A estimated at 240V <span class="note-inline">(select manufacturer for equipment-specific calc)</span></p>';
  }

  const mfgObj = EQUIPMENT_DATA[state.mfg];
  let html = '';

  if (modelObj.type === 'string') {
    html += '<p class="calc-row"><strong>' + inverterCount + ' × ' + modelObj.name +
      '</strong> (' + modelObj.kw + ' kW each) — Total ' + totalACkw.toFixed(1) + ' kW AC</p>';
    html += '<p class="calc-row">DC/AC Ratio: <strong>' + (dcacRatio !== null ? dcacRatio.toFixed(2) : '—') + '</strong></p>';
    if (dcacRatio !== null && dcacRatio > 1.25) {
      html += '<p class="calc-flag-inline amber">DC/AC ratio exceeds 1.25 — clipping likely during peak production hours</p>';
    } else if (dcacRatio !== null && dcacRatio < 1.0) {
      html += '<p class="calc-flag-inline amber">DC/AC ratio below 1.0 — inverter may be undersized for this array</p>';
    }
    html += '<p class="calc-row">AC Breaker (per inverter): ' + modelObj.breaker + 'A</p>';

  } else if (modelObj.type === 'hybrid' || modelObj.type === 'ess') {
    html += '<p class="calc-row"><strong>' + modelObj.name + '</strong></p>';
    if (modelObj.kw) {
      html += '<p class="calc-row">' + modelObj.kw + ' kW AC';
      html += ' / ' + modelObj.acOutputCurrent + 'A output';
      html += ' / ' + modelObj.breaker + 'A breaker</p>';
    }
    if (modelObj.kwh) {
      html += '<p class="calc-row">Storage: ' + modelObj.kwh + ' kWh</p>';
    }
    if (modelObj.maxDCinputKw) {
      html += '<p class="calc-row">Max DC Input: ' + modelObj.maxDCinputKw + ' kW</p>';
      if (systemSizeKw > modelObj.maxDCinputKw) {
        html += '<p class="calc-flag-inline amber">System DC size (' + systemSizeKw.toFixed(1) +
          ' kW) exceeds max DC input (' + modelObj.maxDCinputKw + ' kW) for this unit</p>';
      }
    }
    if (modelObj.pcs) {
      html += '<p class="calc-row">PCS: ' + modelObj.pcs + '</p>';
    }

  } else if (modelObj.type === 'micro') {
    const totalACamps   = inverterCount * modelObj.acOutputPerUnit;
    const branchCircuits = Math.ceil(inverterCount / modelObj.maxPerBranch);
    const backfeedCurrent = totalACamps * 1.25;

    html += '<p class="calc-row"><strong>' + inverterCount + ' × ' + modelObj.name +
      ' microinverters</strong></p>';
    html += '<p class="calc-row">Branch Circuits: ' + branchCircuits +
      ' × ' + (mfgObj.branchBreakerSize || 20) + 'A</p>';
    html += '<p class="calc-row">Total Backfeed Current: ' + backfeedCurrent.toFixed(2) +
      'A <span class="note-inline">(× 1.25 per NEC 690.8)</span></p>';
    html += '<p class="calc-row">DC/AC Ratio: 1:1 <span class="note-inline">(microinverter — no clipping)</span></p>';
  }

  return html;
}

/* ─── HOMEOWNER NARRATIVE ─────────────────────────────────────────── */

function buildHomeownerNarrative() {
  const { annualKwh, annualNeeded, systemSizeKw, moduleCount, modelObj } = _calc;

  const mfgName   = (state.mfg   && EQUIPMENT_DATA[state.mfg])  ? EQUIPMENT_DATA[state.mfg].name : '';
  const modelName = (modelObj) ? modelObj.name : '';

  let html = '';

  html += '<p>Based on your annual energy use of <strong>' +
    annualKwh.toLocaleString(undefined, { maximumFractionDigits: 0 }) +
    ' kWh</strong>, a <strong>' + systemSizeKw + ' kW</strong> solar system could offset approximately ' +
    '<strong>' + state.offsetGoal + '%</strong> of your electricity needs under optimal conditions.</p>';

  let equipmentPhrase = '';
  if (mfgName && modelName) {
    equipmentPhrase = ', paired with a <strong>' + mfgName + ' ' + modelName + '</strong> system,';
  }

  html += '<p>This system would include approximately <strong>' + moduleCount + ' solar panels</strong>' +
    equipmentPhrase +
    ' and could generate roughly <strong>' +
    annualNeeded.toLocaleString(undefined, { maximumFractionDigits: 0 }) +
    ' kWh per year</strong> in your area.</p>';

  // Backup goal paragraph
  if (state.backupGoal === 'partial') {
    html += '<p>Adding battery storage means your home can continue running during a power outage using stored solar energy. ' +
      'A <strong>partial backup</strong> system protects your most important loads — things like refrigerators, lights, and medical equipment.</p>';
  } else if (state.backupGoal === 'whole') {
    html += '<p>Adding battery storage means your home can continue running during a power outage using stored solar energy. ' +
      'A <strong>whole-home backup</strong> system is designed to keep everything running during an outage.</p>';
  }

  // 400A service note
  const has400a = (state.busRating && state.busRating >= 320) || (state.mainBreaker && state.mainBreaker >= 320);
  if (has400a && state.backupGoal === 'whole') {
    html += '<p>Because your home has a larger electrical service, a whole-home backup system requires ' +
      '<strong>two independent battery systems</strong> — one for each electrical panel. This is a manufacturer ' +
      'equipment limitation, not a code issue, and is important to understand before finalizing your system design.</p>';
  }

  html += '<p>This estimate assumes your roof has good southern exposure and minimal shading. ' +
    'A site assessment will confirm actual production potential for your home.</p>';

  return html;
}

/* ─── INSTALLER NARRATIVE ─────────────────────────────────────────── */

function buildInstallerNarrative() {
  const {
    annualKwh, annualNeeded, dailyNeeded, sunHours,
    systemSizeKw, moduleCount, totalDCkw,
    estimatedACcurrent, inverterCount, totalACkw, dcacRatio,
    maxBackfeed, prelimPass, modelObj
  } = _calc;

  const zoneData  = CLIMATE_ZONES_DATA[state.climateZone] || CLIMATE_ZONES_DATA['mixed'];
  const zoneName  = zoneData.label;
  const mfgObj    = (state.mfg && EQUIPMENT_DATA[state.mfg]) ? EQUIPMENT_DATA[state.mfg] : null;

  let lines = [];

  lines.push('SYSTEM SIZING SUMMARY');
  lines.push('Consumption: ' + annualKwh.toLocaleString(undefined, { maximumFractionDigits: 0 }) + ' kWh/year');
  lines.push('Offset target: ' + state.offsetGoal + '%');
  lines.push('Climate zone: ' + zoneName + ' — ' + sunHours + ' peak sun hrs/day');
  lines.push('Derate: 0.80 (standard)');
  lines.push('Required production: ' + annualNeeded.toLocaleString(undefined, { maximumFractionDigits: 0 }) + ' kWh/year');
  lines.push('Daily target: ' + dailyNeeded.toFixed(1) + ' kWh/day');
  lines.push('Suggested DC size: ' + systemSizeKw + ' kW DC');
  lines.push('');

  lines.push('MODULE COUNT');
  lines.push(moduleCount + ' × ' + state.moduleWattage + 'W modules');
  lines.push('Total DC: ' + totalDCkw.toFixed(2) + ' kW');
  lines.push('');

  lines.push('INVERTER / ESS');
  if (!modelObj) {
    lines.push('No manufacturer selected');
    lines.push('Estimated AC output: ~' + estimatedACcurrent.toFixed(1) + 'A at 240V');
  } else if (modelObj.type === 'string') {
    lines.push(inverterCount + ' × ' + modelObj.name + ' (' + modelObj.kw + ' kW each)');
    lines.push('Total AC: ' + totalACkw.toFixed(1) + ' kW');
    lines.push('DC/AC Ratio: ' + (dcacRatio !== null ? dcacRatio.toFixed(2) : '—'));
    if (dcacRatio !== null && dcacRatio > 1.25) {
      lines.push('⚑ DC/AC > 1.25 — evaluate clipping losses vs. module cost savings');
    } else if (dcacRatio !== null && dcacRatio < 1.0) {
      lines.push('⚑ DC/AC < 1.0 — inverter appears undersized for this array');
    }
  } else if (modelObj.type === 'hybrid' || modelObj.type === 'ess') {
    lines.push(modelObj.name);
    if (modelObj.kw) {
      lines.push(modelObj.kw + ' kW AC / ' + modelObj.acOutputCurrent + 'A output / ' + modelObj.breaker + 'A breaker');
    }
    if (modelObj.kwh) {
      lines.push('Storage: ' + modelObj.kwh + ' kWh');
    }
    if (modelObj.maxDCinputKw) {
      lines.push('Max DC Input: ' + modelObj.maxDCinputKw + ' kW');
      if (systemSizeKw > modelObj.maxDCinputKw) {
        lines.push('⚑ DC size (' + systemSizeKw.toFixed(1) + ' kW) exceeds max DC input — evaluate stringing');
      }
    }
    if (modelObj.pcs) {
      lines.push('PCS: ' + modelObj.pcs);
    }
  } else if (modelObj.type === 'micro') {
    const totalACamps    = moduleCount * modelObj.acOutputPerUnit;
    const branchCircuits = Math.ceil(moduleCount / modelObj.maxPerBranch);
    const backfeedCurrent = totalACamps * 1.25;
    const branchSize     = mfgObj ? (mfgObj.branchBreakerSize || 20) : 20;

    lines.push(moduleCount + ' × ' + modelObj.name + ' microinverters');
    lines.push('Branch Circuits: ' + branchCircuits + ' × ' + branchSize + 'A');
    lines.push('Total Backfeed Current: ' + backfeedCurrent.toFixed(2) + 'A (× 1.25 per NEC 690.8)');
    lines.push('DC/AC Ratio: 1:1');
  }

  lines.push('AC output current: ~' + estimatedACcurrent.toFixed(1) + 'A');
  lines.push('');

  lines.push('SERVICE');
  lines.push('Bus rating: ' + (state.busRating || '—') + 'A');
  lines.push('Main breaker: ' + (state.mainBreaker || '—') + 'A');

  if (state.busRating && state.mainBreaker) {
    lines.push('');
    lines.push('Preliminary 120% check:');
    lines.push('Max allowable backfeed: ' + maxBackfeed.toFixed(2) + 'A');
    lines.push('Preliminary result: ' + (prelimPass ? 'PASS' : 'FAIL'));
    if (!prelimPass) {
      lines.push('Panel does not support load-side connection at this system size. ' +
        'Consider supply-side connection, MPU, or system size reduction.');
    }
  }

  const has400a = (state.busRating && state.busRating >= 320) || (state.mainBreaker && state.mainBreaker >= 320);
  if (has400a) {
    lines.push('');
    lines.push('⚑ 400A SERVICE: Two independent systems required for whole-home backup.');
    lines.push('Each 200A panel evaluated separately.');
  }

  return '<pre>' + lines.join('\n') + '</pre>';
}

/* ─── RENDER FLAGS ────────────────────────────────────────────────── */

function renderFlags() {
  const { modelObj, dcacRatio, estimatedACcurrent, maxBackfeed, annualKwh } = _calc;

  // flagClipping — Tesla string, dcacRatio > 1.25
  const showClipping = !!(modelObj && modelObj.type === 'string' && dcacRatio !== null && dcacRatio > 1.25);
  set('flagClipping', !showClipping);
  if (showClipping) {
    el('flagClippingBody').innerHTML =
      '<p>The suggested system is sized above the inverter\'s rated AC capacity (DC/AC ratio: <strong>' +
      dcacRatio.toFixed(2) + '</strong>). This results in clipping during peak production hours.</p>' +
      '<p><strong>For homeowner:</strong> Some production is lost during the sunniest part of the day but morning and ' +
      'afternoon production is maximized. Often intentional and cost-effective.</p>' +
      '<p><strong>For installer:</strong> DC/AC ratio ' + dcacRatio.toFixed(2) +
      '. Evaluate clipping losses against module cost savings. Typical acceptable range 1.1–1.3 ' +
      'depending on climate zone and utility rate structure.</p>';
  }

  // flagEss — backup selected or offset > 100
  const showEss = state.backupGoal === 'partial' || state.backupGoal === 'whole' || state.offsetGoal > 100;
  set('flagEss', !showEss);
  if (showEss) {
    el('flagEssBody').innerHTML =
      '<p><strong>For homeowner:</strong> Battery storage lets you use your solar energy even when the sun isn\'t shining ' +
      'and keeps your home powered during outages.</p>' +
      '<p><strong>For installer:</strong> ESS sizing should be based on critical load analysis and backup duration requirements. ' +
      'This tool provides system size only — ESS capacity sizing requires separate load calculation.</p>';
  }

  // flagExport — offset > 100
  const showExport = state.offsetGoal > 100;
  set('flagExport', !showExport);
  if (showExport) {
    el('flagExportBody').innerHTML =
      '<p><strong>For homeowner:</strong> Sizing above 100% means your system may produce more than you use. ' +
      'Whether you get credit for that depends on your utility\'s net metering policy.</p>' +
      '<p><strong>For installer:</strong> Confirm utility net metering or NEM tariff before designing above 100% offset. ' +
      'Some utilities cap export or offer avoided cost only. Some require PCS/export limiting for systems above certain size.</p>';
  }

  // flagService — service fail
  const has400a = (state.busRating && state.busRating >= 320) || (state.mainBreaker && state.mainBreaker >= 320);
  const showService = !!(state.busRating && state.mainBreaker && estimatedACcurrent > maxBackfeed && !has400a);
  set('flagService', !showService);
  if (showService) {
    el('flagServiceBody').innerHTML =
      '<p><strong>For homeowner:</strong> Your electrical panel may need to be evaluated before this system can be connected. ' +
      'This is common and your installer will verify during the site visit.</p>' +
      '<p><strong>For installer:</strong> Preliminary 120% check shows proposed AC output of <strong>' +
      estimatedACcurrent.toFixed(1) + 'A</strong> against <strong>' + maxBackfeed.toFixed(2) +
      'A</strong> available backfeed. Panel <strong>FAIL</strong>. ' +
      'Use interconnection calculator for full analysis.</p>';
  }

  // flag400a — 400A service
  set('flag400a', !has400a);
  if (has400a) {
    el('flag400aBody').innerHTML =
      '<p>400A residential service is almost always two independent 200A panels. NEC evaluates each panel independently. ' +
      'Whole-home backup requires two independent ESS systems — one per panel. ' +
      'See the 400A service warning above for full details.</p>' +
      '<p>Run two separate calculations — one per 200A panel.</p>';
  }

  // flagEv — offset > 110
  const showEv = state.offsetGoal > 110;
  set('flagEv', !showEv);
  if (showEv) {
    el('flagEvBody').innerHTML =
      '<p><strong>For homeowner:</strong> Sizing above your current usage is smart if you plan to add an electric vehicle, ' +
      'heat pump, or other large loads.</p>' +
      '<p><strong>For installer:</strong> Confirm future load additions with customer. ' +
      'EV charging typically adds 2,000–4,000 kWh/year per vehicle. ' +
      'Heat pump HVAC conversion can significantly change consumption profile.</p>';
  }
}

/* ─── MAIN RENDER FUNCTION ────────────────────────────────────────── */

function render() {
  // Run calculations first
  calculateSystem();

  const { annualKwh, annualNeeded, dailyNeeded, sunHours, systemSizeKw,
    moduleCount, totalDCkw, estimatedACcurrent, inverterCount, totalACkw,
    dcacRatio, maxBackfeed, prelimPass, modelObj } = _calc;

  const validInput = annualKwh > 0;

  // ── Show/hide main output zones
  set('outputZone',    !validInput);
  set('narrativeZone', !validInput);
  set('handoffZone',   !validInput);

  if (!validInput) return;

  // ── 400A warning
  const has400a = (state.busRating && state.busRating >= 320) ||
    (state.mainBreaker && state.mainBreaker >= 320) ||
    (state.backupGoal === 'whole' && state.busRating && state.busRating >= 320);
  set('panel400Warning', !has400a);

  // ── Zone 2: result fields
  txt('resultSystemSize',      systemSizeKw.toFixed(1));
  txt('resultAnnualProduction', annualNeeded.toLocaleString(undefined, { maximumFractionDigits: 0 }));
  txt('resultDailyTarget',     dailyNeeded.toFixed(1));
  txt('resultPeakSunHours',    sunHours.toString());
  txt('resultClimateName',     (CLIMATE_ZONES_DATA[state.climateZone] || {}).label || '—');
  txt('resultOffsetGoal',      state.offsetGoal + '%');
  txt('resultModuleCount',     moduleCount.toString());
  txt('resultModuleWattage',   state.moduleWattage + 'W per module');
  txt('resultTotalDC',         totalDCkw.toFixed(1) + ' kW DC');

  // ── Inverter block
  const showInverter = systemSizeKw > 0;
  set('inverterBlock', !showInverter);
  if (showInverter) {
    el('inverterOutput').innerHTML = buildInverterOutputHtml();

    // DC/AC ratio flag
    const showDcacFlag = modelObj && modelObj.type === 'string' && dcacRatio !== null &&
      (dcacRatio > 1.25 || dcacRatio < 1.0);
    set('dcacRatioFlag', !showDcacFlag);
    if (showDcacFlag) {
      if (dcacRatio > 1.25) {
        el('dcacRatioFlag').textContent = 'DC/AC ratio ' + dcacRatio.toFixed(2) +
          ' — clipping likely. See flag below.';
      } else {
        el('dcacRatioFlag').textContent = 'DC/AC ratio ' + dcacRatio.toFixed(2) +
          ' — inverter may be undersized for this array.';
      }
    }
  }

  // ── Service block
  const showService = !!(state.busRating && state.mainBreaker);
  set('serviceBlock', !showService);
  if (showService) {
    txt('svcBusRating',    state.busRating + 'A');
    txt('svcMainBreaker',  state.mainBreaker + 'A');
    txt('svcMaxBackfeed',  maxBackfeed.toFixed(2) + 'A');
    txt('svcACOutput',     estimatedACcurrent.toFixed(1) + 'A');

    if (prelimPass) {
      txt('svcPrelimResult', 'PASS');
      el('svcPrelimResult').className = 'val-sm txt-pass';
      el('svcPrelimAlert').className  = 'alert alert-pass';
      el('svcPrelimAlert').textContent = 'Preliminary check PASS — load-side connection appears viable at this system size. Verify with full interconnection study.';
      set('svcPrelimAlert', false);
    } else {
      txt('svcPrelimResult', 'FAIL');
      el('svcPrelimResult').className = 'val-sm txt-fail';
      el('svcPrelimAlert').className  = 'alert alert-fail';
      el('svcPrelimAlert').textContent = 'Preliminary check FAIL — load-side connection does not appear viable. Consider supply-side, MPU, or system size reduction.';
      set('svcPrelimAlert', false);
    }
  }

  // ── Zone 3: narratives
  el('narrativeHomeowner').innerHTML = buildHomeownerNarrative();
  el('narrativeInstaller').innerHTML = buildInstallerNarrative();

  // ── Zone 3: flags
  renderFlags();

  // ── Zone 4: handoff
  const mfgName   = (state.mfg && EQUIPMENT_DATA[state.mfg]) ? EQUIPMENT_DATA[state.mfg].name : '—';
  const modelName = modelObj ? modelObj.name : '—';
  const equipmentStr = (modelObj)
    ? mfgName + ' — ' + modelName
    : 'Not specified';

  txt('handoffSysSize',    systemSizeKw.toFixed(1) + ' kW DC');
  txt('handoffModuleCount', moduleCount + ' × ' + state.moduleWattage + 'W');
  txt('handoffEquipment',  equipmentStr);
  txt('handoffACOutput',   estimatedACcurrent.toFixed(1) + 'A');
  txt('handoffBus',        state.busRating   ? state.busRating   + 'A' : '—');
  txt('handoffMain',       state.mainBreaker ? state.mainBreaker + 'A' : '—');

  if (showService) {
    txt('handoffPrelim', prelimPass ? 'PASS' : 'FAIL');
    el('handoffPrelim').className = prelimPass ? 'txt-pass' : 'txt-fail';
  } else {
    txt('handoffPrelim', '—');
    el('handoffPrelim').className = '';
  }
}

/* ─── DOMCONTENTLOADED INIT ───────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {

  // Set initial pill active states
  setConsumptionMode('annual');
  setBackupGoal('none');

  // Narrative tabs — homeowner default
  setNarrativeTab('homeowner');

  // Climate zone dropdown
  el('climateZoneSelect').addEventListener('change', onClimateZoneChange);

  // Zip input
  el('zipInput').addEventListener('input', onZipInput);

  // Annual kWh
  el('annualKwh').addEventListener('input', () => {
    state.annualKwh = parseFloat(el('annualKwh').value) || null;
    render();
  });

  // Offset goal
  el('offsetGoalInput').addEventListener('input', () => {
    state.offsetGoal = parseInt(el('offsetGoalInput').value) || 100;
    render();
  });

  // Bus rating / main breaker
  el('busRating').addEventListener('input', () => {
    state.busRating = parseFloat(el('busRating').value) || null;
    render();
  });
  el('mainBreaker').addEventListener('input', () => {
    state.mainBreaker = parseFloat(el('mainBreaker').value) || null;
    render();
  });

  // Module wattage
  el('moduleWattageSelect').addEventListener('change', onModuleWattageChange);

  // Manufacturer / model
  el('eqMfgSelect').addEventListener('change', onMfgChange);
  el('eqModelSelect').addEventListener('change', onModelChange);

  // Wire 12 monthly inputs
  const months   = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
  const monthIds = ['monthJan','monthFeb','monthMar','monthApr','monthMay','monthJun',
                    'monthJul','monthAug','monthSep','monthOct','monthNov','monthDec'];
  monthIds.forEach((id, i) => {
    el(id).addEventListener('input', () => {
      state.monthly[months[i]] = parseFloat(el(id).value) || null;
      updateMonthlyTotal();
      render();
    });
  });

  // Consumption mode pill buttons
  el('consumptionModeToggle').querySelectorAll('[data-mode]').forEach(btn => {
    btn.addEventListener('click', () => setConsumptionMode(btn.dataset.mode));
  });

  // Backup goal pill buttons
  el('backupGoalGroup').querySelectorAll('[data-backup]').forEach(btn => {
    btn.addEventListener('click', () => setBackupGoal(btn.dataset.backup));
  });

  // Narrative tab buttons
  el('tabHomeowner').addEventListener('click', () => setNarrativeTab('homeowner'));
  el('tabInstaller').addEventListener('click', () => setNarrativeTab('installer'));

  // Handoff button
  el('handoffBtn').addEventListener('click', openInterconnectionCalc);

  // Initial render
  render();
});
