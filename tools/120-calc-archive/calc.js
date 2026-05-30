/* ─── NEC VERSION DATA ──────────────────────────────────────────── */

const NEC = {
  '2014': {
    banner:   'NEC 705.12(D) — 120% rule in its modern form. Load-side connection standard established.',
    citation: 'NEC 2014 §705.12(D)',
    section:  '705.12(D)',
    pcs:      false,
    ess:      false
  },
  '2017': {
    banner:   'NEC 705.12(D) — Minor clarification language. No change to calculation method.',
    citation: 'NEC 2017 §705.12(D)',
    section:  '705.12(D)',
    pcs:      false,
    ess:      false
  },
  '2020': {
    banner:   "NEC 705.12(B) — Renumbered. ESS and bidirectional inverters explicitly added. 'Other sources' language broadened. Supply-side rules clarified.",
    citation: 'NEC 2020 §705.12(B)',
    section:  '705.12(B)',
    pcs:      false,
    ess:      true
  },
  '2023': {
    banner:   'NEC 705.12(B) — Current code. Microgrid controller language added. ESS multimode inverter clarification. PCS exception pathway added via 705.13.',
    citation: 'NEC 2023 §705.12(B)',
    section:  '705.12(B)',
    pcs:      true,
    ess:      true
  }
};

/* ─── PHASE 2 DATA ──────────────────────────────────────────────── */

const CLIMATE_ZONES = {
  miami:       { label: 'Miami, FL',          tC:   7 },
  houston:     { label: 'Houston, TX',         tC:  -2 },
  la:          { label: 'Los Angeles, CA',     tC:   3 },
  phoenix:     { label: 'Phoenix, AZ',         tC:   2 },
  lasvegas:    { label: 'Las Vegas, NV',       tC:  -3 },
  atlanta:     { label: 'Atlanta, GA',         tC:  -8 },
  charlotte:   { label: 'Charlotte, NC',       tC: -10 },
  dc:          { label: 'Washington DC',       tC: -14 },
  seattle:     { label: 'Seattle, WA',         tC:  -5 },
  denver:      { label: 'Denver, CO',          tC: -18 },
  chicago:     { label: 'Chicago, IL',         tC: -22 },
  detroit:     { label: 'Detroit, MI',         tC: -18 },
  nyc:         { label: 'New York, NY',        tC: -14 },
  boston:      { label: 'Boston, MA',          tC: -18 },
  minneapolis: { label: 'Minneapolis, MN',     tC: -28 },
  fargo:       { label: 'Fargo, ND',           tC: -34 },
  billings:    { label: 'Billings, MT',        tC: -25 },
  anchorage:   { label: 'Anchorage, AK',       tC: -32 },
  fairbanks:   { label: 'Fairbanks, AK',       tC: -47 },
};

const ENPHASE_MODELS = {
  iq7:   { label: 'IQ7',   iout: 1.21 },
  iq7p:  { label: 'IQ7+',  iout: 1.21 },
  iq7a:  { label: 'IQ7A',  iout: 1.21 },
  iq7x:  { label: 'IQ7X',  iout: 1.21 },
  iq8:   { label: 'IQ8',   iout: 1.21 },
  iq8p:  { label: 'IQ8+',  iout: 1.21 },
  iq8a:  { label: 'IQ8A',  iout: 1.58 },
  iq8h:  { label: 'IQ8H',  iout: 2.01 },
  iq8hc: { label: 'IQ8HC', iout: 2.01 },
};

const EQUIPMENT = {
  tesla: {
    label: 'Tesla',
    models: {
      pw3: { label: 'Powerwall 3',    kwh: 13.5,  kw: 11.5, amps: 47.9, note: 'Includes integrated solar inverter. Grid: 11.5kW on-grid / 7.6kW backup output.' },
      pw2: { label: 'Powerwall 2',    kwh: 13.5,  kw:  5.0, amps: 20.8, note: 'AC-coupled ESS. Requires a separate solar inverter.' },
    }
  },
  enphase: {
    label: 'Enphase',
    models: {
      iqb3t:  { label: 'IQ Battery 3T',  kwh:  3.36, kw:  1.28, amps:  5.3, note: 'AC-coupled. Entry-level. Compatible with any grid-tied inverter.' },
      iqb5p:  { label: 'IQ Battery 5P',  kwh:  5.0,  kw:  3.84, amps: 16.0, note: 'AC-coupled. Compatible with IQ microinverters or string inverters.' },
      iqb10t: { label: 'IQ Battery 10T', kwh: 10.08, kw:  7.68, amps: 32.0, note: 'Two IQ Battery 5P stacked. Total 10kWh capacity.' },
    }
  },
  qcells: {
    label: 'Q CELLS',
    models: {
      qhome5:  { label: 'Q.HOME CORE 5',  kwh:  5.0, kw:  5.0, amps: 20.8, note: 'Modular Q CELLS ESS platform. Expandable.' },
      qhome10: { label: 'Q.HOME CORE 10', kwh: 10.0, kw:  7.6, amps: 31.7, note: 'Q CELLS Q.HOME CORE — 10kWh configuration.' },
    }
  }
};

/* ─── STANDARD BREAKER SIZES ────────────────────────────────────── */

const STD_BREAKERS = [15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100, 110, 125, 150, 175, 200];

function nextStd(amps) {
  for (const s of STD_BREAKERS) {
    if (s >= amps) return s;
  }
  return null;
}

function prevStd(amps) {
  let r = null;
  for (const s of STD_BREAKERS) {
    if (s <= amps) r = s;
    else break;
  }
  return r;
}

/* ─── STATE ─────────────────────────────────────────────────────── */

const state = {
  version:              '2023',
  connection:           'load',
  panelType:            'main',         // 'main' | 'sub'
  calcMethod:           '120pct',       // '120pct' | 'sumbreakers'
  // 120% method — main panel
  busRating:            null,
  mainBreaker:          null,
  // Optional equipment
  knownInverterCurrent: null,
  essOutputCurrent:     null,
  // 120% method — sub panel
  subBusRating:         null,
  subConfig:            'main_breaker', // 'main_breaker' | 'through_lug'
  subOCPD:              null,
  // Sum of breakers method
  sobBusRating:         null,
  sobTotalOCPD:         null,
  sobProposedBackfeed:  null,
  // DC String Sizing (Panel 1)
  dcMethod:        'table',     // 'table' | 'coefficient'
  dcTempMode:      'zone',      // 'zone' | 'manual'
  dcZone:          'chicago',
  dcManualTempC:   null,
  dcVocStc:        null,
  dcVmpStc:        null,
  dcIscStc:        null,
  dcVocCoeff:      null,
  dcCoeffUnit:     'pct',       // 'pct' (%/°C) | 'v' (V/°C)
  dcInverterMaxV:  null,
  dcMpptMin:       null,
  dcMpptMax:       null,
  dcStringCount:   null,
  // Enphase AC Breaker (Panel 2)
  acModel:         'iq7',
  acCount:         null,
  acBrk:           20,
  // Equipment Selection (Panel 3)
  eqMfg:           'tesla',
  eqModel:         'pw3'
};

/* ─── COMPUTE ───────────────────────────────────────────────────── */

function compute(s) {
  if (s.connection !== 'load') return { pass: false, valid: false };
  if (s.calcMethod === 'sumbreakers') return computeSumBreakers(s);
  return compute120(s);
}

function compute120(s) {
  const c     = { pass: false, valid: false, method: '120pct' };
  const v     = NEC[s.version];
  const isSub = s.panelType === 'sub';
  const busR  = isSub ? s.subBusRating : s.busRating;
  const ocpd  = isSub ? s.subOCPD      : s.mainBreaker;

  if (busR === null || ocpd === null) return c;

  const maxBus      = busR * 1.2;
  const maxBackfeed = maxBus - ocpd;
  const pass        = ocpd < maxBus;

  Object.assign(c, { valid: true, pass, maxBus, maxBackfeed, isSub });

  if (!pass) return c;

  c.maxPVBreaker      = prevStd(maxBackfeed);
  if (v.ess) c.maxESSBreaker = prevStd(maxBackfeed);
  c.maxInverterOutput = maxBackfeed / 1.25;

  if (s.knownInverterCurrent !== null) {
    const raw = s.knownInverterCurrent * 1.25;
    const std = nextStd(raw);
    c.inv = { raw, std, passPanel: std !== null && std <= maxBackfeed };
  }

  if (v.ess && s.essOutputCurrent !== null) {
    const raw = s.essOutputCurrent * 1.25;
    const std = nextStd(raw);
    c.ess = { raw, std, passPanel: std !== null && std <= maxBackfeed };
  }

  // Combined config check — independent of panel 120% result
  if (c.inv && c.ess && c.inv.std !== null && c.ess.std !== null) {
    const combined = c.inv.std + c.ess.std;
    c.combined = { pvStd: c.inv.std, essStd: c.ess.std, total: combined, pass: combined <= maxBackfeed };
  }

  return c;
}

function computeSumBreakers(s) {
  const c = { pass: false, valid: false, method: 'sumbreakers' };

  if (s.sobBusRating === null || s.sobTotalOCPD === null || s.sobProposedBackfeed === null) return c;

  const total    = s.sobTotalOCPD + s.sobProposedBackfeed;
  const pass     = total <= s.sobBusRating;
  const headroom = s.sobBusRating - total;

  Object.assign(c, {
    valid: true, pass, total, headroom,
    sobBusRating: s.sobBusRating, sobTotalOCPD: s.sobTotalOCPD, sobProposedBackfeed: s.sobProposedBackfeed
  });

  if (s.busRating !== null && s.mainBreaker !== null) {
    const maxBus120 = s.busRating * 1.2;
    const maxBF120  = maxBus120 - s.mainBreaker;
    c.cmp = { maxBF: maxBF120, maxBrk: prevStd(maxBF120), pass120: s.mainBreaker < maxBus120 };
  }

  return c;
}

function computeQuickCalc(s) {
  if (s.busRating === null || s.mainBreaker === null) return { valid: false };
  const v           = NEC[s.version];
  const maxBus      = s.busRating * 1.2;
  const maxBackfeed = maxBus - s.mainBreaker;
  const pass        = s.mainBreaker < maxBus;
  if (!pass) return { valid: true, pass: false, maxBus, maxBackfeed };
  return {
    valid: true, pass: true, maxBus, maxBackfeed,
    maxPVBreaker:  prevStd(maxBackfeed),
    maxESSBreaker: v.ess ? prevStd(maxBackfeed) : null,
    hasESS:        v.ess
  };
}

/* ─── PHASE 2 COMPUTE ───────────────────────────────────────────── */

function getVocFactor(tC) {
  if (tC >  24) return 1.00;
  if (tC >= 20) return 1.02;
  if (tC >= 15) return 1.04;
  if (tC >= 10) return 1.06;
  if (tC >=  5) return 1.08;
  if (tC >=  0) return 1.10;
  if (tC >= -5) return 1.12;
  if (tC >= -10) return 1.14;
  if (tC >= -15) return 1.16;
  if (tC >= -20) return 1.18;
  if (tC >= -25) return 1.20;
  if (tC >= -30) return 1.21;
  if (tC >= -35) return 1.23;
  return 1.25;
}

function computeDcString(s) {
  const r = { valid: false };

  let tC;
  if (s.dcTempMode === 'zone') {
    const z = CLIMATE_ZONES[s.dcZone];
    if (!z) return r;
    tC = z.tC;
  } else {
    if (s.dcManualTempC === null) return r;
    tC = s.dcManualTempC;
  }

  if (s.dcVocStc === null) return r;

  r.tC = tC;
  r.tF = tC * 9/5 + 32;

  let factor;
  if (s.dcMethod === 'table') {
    factor = getVocFactor(tC);
    r.methodLabel = 'NEC Table 690.7(A)';
  } else {
    if (s.dcVocCoeff === null) return r;
    const dPerC = s.dcCoeffUnit === 'pct' ? s.dcVocCoeff / 100 : s.dcVocCoeff / s.dcVocStc;
    factor = 1 + dPerC * (tC - 25);
    r.methodLabel = 'Manufacturer Coefficient';
  }

  r.factor   = factor;
  r.vocCorr  = s.dcVocStc * factor;
  r.valid    = true;

  if (s.dcInverterMaxV !== null) {
    r.maxModules = Math.floor(s.dcInverterMaxV / r.vocCorr);
  }

  if (s.dcStringCount !== null) {
    r.stringVocMax = r.vocCorr * s.dcStringCount;
    if (s.dcInverterMaxV !== null) r.vocPass = r.stringVocMax <= s.dcInverterMaxV;

    if (s.dcVmpStc !== null) {
      const vmpHot    = s.dcVmpStc * (1 - 0.0035 * (70 - 25));
      r.stringVmpHot  = vmpHot * s.dcStringCount;
      if (s.dcMpptMin !== null) r.mpptMinPass = r.stringVmpHot >= s.dcMpptMin;
      if (s.dcMpptMax !== null) r.mpptMaxPass = (s.dcVmpStc * factor * s.dcStringCount) <= s.dcMpptMax;
    }
  }

  if (s.dcMpptMin !== null && s.dcVmpStc !== null) {
    const vmpHot     = s.dcVmpStc * (1 - 0.0035 * (70 - 25));
    r.minModules     = Math.ceil(s.dcMpptMin / vmpHot);
  }

  if (s.dcIscStc !== null) {
    r.isc     = s.dcIscStc;
    r.wireMin = s.dcIscStc * 1.25;
  }

  return r;
}

function computeEnphase(s) {
  const m = ENPHASE_MODELS[s.acModel];
  if (!m) return { valid: false };
  const maxPer = Math.floor(s.acBrk / (m.iout * 1.25));
  const r = { valid: true, model: m, iout: m.iout, brk: s.acBrk, maxPerBranch: maxPer };
  if (s.acCount !== null) {
    r.count       = s.acCount;
    r.totalI      = s.acCount * m.iout;
    r.requiredBrk = r.totalI * 1.25;
    r.nextBrk     = nextStd(r.requiredBrk);
    r.passCount   = s.acCount <= maxPer;
    r.passBrk     = r.requiredBrk <= s.acBrk;
    r.pass        = r.passCount && r.passBrk;
  }
  return r;
}

/* ─── RENDER ────────────────────────────────────────────────────── */

function render() {
  const v      = NEC[state.version];
  const c      = compute(state);
  const isLoad = state.connection === 'load';
  const isSub  = state.panelType  === 'sub';
  const isSob  = state.calcMethod === 'sumbreakers';

  document.querySelectorAll('#versionToggle button').forEach(btn =>
    btn.classList.toggle('active', btn.dataset.version === state.version));
  document.querySelectorAll('#connToggle button').forEach(btn =>
    btn.classList.toggle('active', btn.dataset.conn === state.connection));
  document.querySelectorAll('#panelTypeToggle button').forEach(btn =>
    btn.classList.toggle('active', btn.dataset.panel === state.panelType));
  document.querySelectorAll('#calcMethodToggle button').forEach(btn =>
    btn.classList.toggle('active', btn.dataset.method === state.calcMethod));

  el('versionBanner').textContent = v.banner;

  // PCS panel version availability (run always regardless of connection)
  el('panelPcs').classList.toggle('ver-off', !v.pcs);
  if (!v.pcs && el('panelPcs').classList.contains('open')) el('panelPcs').classList.remove('open');
  set('pcsBadge', v.pcs);

  renderMainBreakerValidation();

  const qc = isLoad ? computeQuickCalc(state) : { valid: false };
  renderQuickOutput(qc, v);

  set('supplySideNote',  isLoad);
  set('loadSideContent', !isLoad);

  if (!isLoad) { setPanels(false); return; }

  // Input section visibility — mainPanelInputs always visible above fold
  set('subPanelInputs',    !isSub || isSob);
  set('sumBreakersContent', !isSob);

  if (isSub) {
    el('subOCPDLabel').textContent = state.subConfig === 'through_lug'
      ? 'Feeder OCPD Size (amps)'
      : 'Sub Panel Main Breaker (amps)';
  }

  // SOB results
  set('sobResultsCard', !isSob || !c.valid);
  if (isSob && c.valid) renderSobResults(c);

  // 120% results
  set('resultsCard', isSob || !c.valid);
  if (!isSob && c.valid) render120Results(c, v);

  setPanels(!isSob && c.valid);
  renderSummary();
}

/* ─── RENDER: 120% RESULTS ──────────────────────────────────────── */

function render120Results(c, v) {
  const head  = el('resultsHead');
  const badge = el('statusBadge');

  head.className    = c.pass ? 'results-head pass' : 'results-head fail';
  badge.textContent = c.pass ? 'PASS' : 'FAIL';
  badge.className   = c.pass ? 'status-badge pass' : 'status-badge fail';

  el('panelTypeBadge').classList.toggle('hidden', !c.isSub);

  set('failAlert',        c.pass);
  set('failGuidancePanel', c.pass);
  if (!c.pass) el('failGuidanceBody').classList.remove('hidden');

  set('subPanelNote', !c.isSub);
  if (c.isSub) {
    el('subPanelNote').innerHTML = state.subConfig === 'through_lug'
      ? '<strong>Through-Lug Sub Panel</strong> — No main breaker in sub panel. Feeder OCPD used as reference per NEC 408.36 Exception. Verify feeder conductor ampacity per NEC 310.12. Main panel interconnection must be evaluated independently.'
      : '<strong>Sub Panel (With Main Breaker)</strong> — Sub panel main breaker used as reference OCPD. Feeder breaker and main panel must be evaluated independently.';
  }

  txt('val120Pct', c.maxBus.toFixed(2) + 'A');
  set('rowBackfeed', !c.pass);
  if (c.pass) txt('valBackfeed', c.maxBackfeed.toFixed(2) + 'A');

  set('defaultBreakersSection', !c.pass);
  if (c.pass) renderDefaultBreakers(c, v);

  set('inverterSection', !c.pass);
  if (c.pass) renderInverterCalc(c);

  const showEss = c.pass && v.ess;
  set('essSection', !showEss);
  if (showEss) renderEssCalc(c);

  // Combined config check — independent of panel pass/fail
  const showCombined = c.pass && !!c.combined;
  set('combinedConfigSection', !showCombined);
  if (showCombined) renderCombinedConfigCheck(c);

  set('backfeedLabelingCallout', !c.pass);

  txt('activeCitation', v.citation);
}

function renderDefaultBreakers(c, v) {
  txt('valMaxPVBreaker', c.maxPVBreaker !== null ? c.maxPVBreaker + 'A' : '> 200A — verify with AHJ');

  const hasEss = !!v.ess;
  set('rowMaxESSBreaker',     !hasEss);
  set('rowMaxCombinedDisplay', !hasEss);
  if (hasEss) {
    txt('valMaxESSBreaker',     c.maxESSBreaker !== null ? c.maxESSBreaker + 'A' : '> 200A — verify with AHJ');
    txt('valMaxCombinedDisplay', c.maxBackfeed.toFixed(2) + 'A total');
  }
}

function renderInverterCalc(c) {
  txt('valMaxInverterOutput', c.maxInverterOutput.toFixed(2) + 'A');

  const hasCalc = !!c.inv;
  set('inverterCalcBlock', !hasCalc);
  if (!hasCalc) return;

  txt('valInverterMinBreaker', c.inv.raw.toFixed(2) + 'A');
  const alertEl = el('inverterAlert');

  if (c.inv.std === null) {
    txt('valInverterStdBreaker', 'Exceeds 200A');
    alertEl.className   = 'alert alert-warn';
    alertEl.textContent = 'Calculated breaker exceeds 200A standard size. Verify with AHJ and equipment specs.';
    alertEl.classList.remove('hidden');
  } else {
    txt('valInverterStdBreaker', c.inv.std + 'A');
    if (!c.inv.passPanel) {
      alertEl.className   = 'alert alert-fail';
      alertEl.textContent = 'FAIL — Required PV breaker (' + c.inv.std + 'A) exceeds panel capacity (' +
        c.maxBackfeed.toFixed(2) + 'A). Resize system or consider supply-side connection.';
      alertEl.classList.remove('hidden');
    } else {
      alertEl.className   = 'alert alert-ok';
      alertEl.textContent = 'PASS — PV breaker ' + c.inv.std + 'A is within the allowable limit.';
      alertEl.classList.remove('hidden');
    }
  }
}

function renderEssCalc(c) {
  const hasCalc = !!c.ess;
  set('essCalcBlock', !hasCalc);
  if (!hasCalc) return;

  const alertEl = el('essAlert');

  if (c.ess.std === null) {
    txt('valEssBreaker', 'Exceeds 200A');
    alertEl.className   = 'alert alert-warn';
    alertEl.textContent = 'Calculated ESS breaker exceeds 200A standard size. Verify with AHJ and equipment specs.';
    alertEl.classList.remove('hidden');
    return;
  }

  txt('valEssBreaker', c.ess.std + 'A');

  if (!c.ess.passPanel) {
    alertEl.className   = 'alert alert-fail';
    alertEl.textContent = 'FAIL — Required ESS breaker (' + c.ess.std + 'A) exceeds panel capacity (' +
      c.maxBackfeed.toFixed(2) + 'A). Reduce system size or consider supply-side connection.';
    alertEl.classList.remove('hidden');
  } else {
    alertEl.className   = 'alert alert-ok';
    alertEl.textContent = 'PASS — ESS breaker ' + c.ess.std + 'A is within the allowable limit.';
    alertEl.classList.remove('hidden');
  }
}

function renderQuickOutput(qc, v) {
  set('quickCalcOutput', !qc.valid);
  if (!qc.valid) return;

  const statusEl    = el('qcStatus');
  statusEl.textContent = qc.pass ? 'PASS' : 'FAIL';
  statusEl.className   = qc.pass ? 'status-badge pass' : 'status-badge fail';

  txt('qcCitation', NEC[state.version].citation);

  set('qcDerived', !qc.pass);

  if (qc.pass) {
    txt('qcMaxBackfeed', qc.maxBackfeed.toFixed(2) + 'A');
    txt('qcMaxPV', qc.maxPVBreaker !== null ? qc.maxPVBreaker + 'A' : '>200A');
    set('qcRowESS', !qc.hasESS);
    if (qc.hasESS) txt('qcMaxESS', qc.maxESSBreaker !== null ? qc.maxESSBreaker + 'A' : '>200A');
    set('qcRowCombined', !qc.hasESS);
    if (qc.hasESS) txt('qcMaxCombined', qc.maxBackfeed.toFixed(2) + 'A total');
  } else {
    txt('qcMaxBackfeed', '—');
  }
}

/* ─── RENDER: SUM OF BREAKERS RESULTS ──────────────────────────── */

function renderSobResults(c) {
  const head  = el('sobResultsHead');
  const badge = el('sobStatusBadge');

  head.className    = c.pass ? 'results-head pass' : 'results-head fail';
  badge.textContent = c.pass ? 'PASS' : 'FAIL';
  badge.className   = c.pass ? 'status-badge pass' : 'status-badge fail';

  set('sobFailAlert', c.pass);

  txt('sobValBusRating',  c.sobBusRating + 'A');
  txt('sobValTotalOCPD',  c.sobTotalOCPD + 'A');
  txt('sobValProposedBF', c.sobProposedBackfeed + 'A');
  txt('sobValTotal',      c.total + 'A');

  const headroomEl = el('sobValHeadroom');
  headroomEl.textContent = c.headroom.toFixed(2) + 'A';
  headroomEl.className   = c.pass ? 'val-sm txt-pass' : 'val-sm txt-fail';

  const showCmp = !!c.cmp;
  set('sobCmpBlock', !showCmp);
  if (showCmp) {
    txt('sobCmpMaxBF',  c.cmp.maxBF.toFixed(2) + 'A');
    txt('sobCmpMaxBrk', c.cmp.maxBrk !== null ? c.cmp.maxBrk + 'A' : '—');
    const passEl = el('sobCmpBlock').querySelector('.sob-cmp-pass');
    passEl.textContent = c.cmp.pass120 ? 'PASS' : 'FAIL';
    passEl.className   = 'val-sm sob-cmp-pass ' + (c.cmp.pass120 ? 'txt-pass' : 'txt-fail');
  }
}

/* ─── PANEL STATE ───────────────────────────────────────────────── */

function setPanels(enabled) {
  document.querySelectorAll('.panel').forEach(panel => {
    if (panel.id === 'panelPcs') return;
    if (enabled) {
      panel.classList.remove('locked');
    } else {
      panel.classList.add('locked');
      panel.classList.remove('open');
    }
  });

  const pcs = el('panelPcs');
  const vd  = NEC[state.version];
  if (enabled && vd.pcs) {
    pcs.classList.remove('locked');
  } else if (!enabled) {
    pcs.classList.add('locked');
    pcs.classList.remove('open');
  }
}

/* ─── EVENT HANDLERS ────────────────────────────────────────────── */

function setVersion(v)        { state.version    = v;    render(); }
function setConnection(conn)  { state.connection = conn; render(); }
function setPanelType(type)   { state.panelType  = type; render(); }
function setCalcMethod(m)     { state.calcMethod = m;    render(); }

function onNumInput(id) {
  const raw = document.getElementById(id).value.trim();
  const n   = parseFloat(raw);
  state[id] = raw !== '' && !isNaN(n) && n > 0 ? n : null;
  render();
}

function setChip(id, value) {
  document.getElementById(id).value = value;
  state[id] = value;
  render();
}

function togglePanel(id) {
  const p = el(id);
  if (p.classList.contains('locked') || p.classList.contains('ver-off')) return;
  p.classList.toggle('open');
  if (p.classList.contains('open')) {
    if (id === 'panelSummary')   renderSummary();
    if (id === 'panelEquipment') renderEquipment();
  }
}

function renderCombinedConfigCheck(c) {
  txt('valCombinedPV',    c.combined.pvStd  + 'A');
  txt('valCombinedESS',   c.combined.essStd + 'A');
  txt('valCombinedTotal', c.combined.total  + 'A');

  const alertEl = el('combinedConfigAlert');
  if (!c.combined.pass) {
    alertEl.className = 'alert alert-fail combined-fail';
    alertEl.innerHTML =
      '<strong>CONFIGURATION FAIL</strong> — Combined PV and ESS backfeed of ' + c.combined.total + 'A ' +
      'exceeds maximum allowable backfeed of ' + c.maxBackfeed.toFixed(2) + 'A. ' +
      'Panel passes 120% calc but proposed equipment combination exceeds available capacity. ' +
      'Options: reduce system size, split across multiple panels, or consider supply-side connection.';
    alertEl.classList.remove('hidden');
  } else {
    alertEl.className   = 'alert alert-ok';
    alertEl.textContent = 'Configuration within allowable limit. Combined backfeed ' +
      c.combined.total + 'A of ' + c.maxBackfeed.toFixed(2) + 'A maximum.';
    alertEl.classList.remove('hidden');
  }
}

function renderMainBreakerValidation() {
  const warningEl = el('mainBreakerWarning');
  if (!warningEl) return;
  const val = state.mainBreaker;

  if (val === null) {
    warningEl.classList.add('hidden');
    return;
  }

  if (val <= 60) {
    warningEl.className   = 'mb-warning mb-warning-red';
    warningEl.textContent = '60A service detected. This service predates the 1978 NEC 100A minimum for single family ' +
      'dwellings. Solar addition to a 60A service will almost certainly require a Main Panel Upgrade. ' +
      'Available backfeed at this service size is insufficient for most modern inverter outputs. ' +
      'Recommend MPU discussion with customer before finalizing system design.';
    warningEl.classList.remove('hidden');
  } else if (val < 100) {
    warningEl.className   = 'mb-warning mb-warning-amber';
    warningEl.textContent = 'Services below 100A do not meet NEC 230.79(C) minimum for single family dwellings ' +
      'established in the 1978 NEC. 60A services are grandfathered where originally compliant but solar ' +
      'addition will likely require a Main Panel Upgrade. Verify scope with AHJ before quoting customer.';
    warningEl.classList.remove('hidden');
  } else {
    warningEl.classList.add('hidden');
  }
}

function toggleFailGuidance() {
  const body  = el('failGuidanceBody');
  const isOpen = !body.classList.contains('hidden');
  body.classList.toggle('hidden', isOpen);
  const btn = document.querySelector('.fail-guidance-toggle');
  if (btn) btn.textContent = isOpen
    ? 'When The Panel Fails — Options & Considerations ▾'
    : 'When The Panel Fails — Options & Considerations ▴';
}

function toggleSobWhen() {
  el('sobWhenBlock').classList.toggle('hidden');
  const btn = document.querySelector('.sob-when-toggle');
  btn.textContent = el('sobWhenBlock').classList.contains('hidden')
    ? 'When to use ▾'
    : 'When to use ▴';
}

/* ─── PHASE 2 RENDER ────────────────────────────────────────────── */

function renderDcString() {
  const s  = state;
  const dc = computeDcString(s);

  document.querySelectorAll('#dcMethodToggle button').forEach(b =>
    b.classList.toggle('active', b.dataset.method === s.dcMethod));
  document.querySelectorAll('#dcTempModeToggle button').forEach(b =>
    b.classList.toggle('active', b.dataset.mode === s.dcTempMode));

  set('dcZoneRow',   s.dcTempMode !== 'zone');
  set('dcManualRow', s.dcTempMode !== 'manual');
  set('dcCoeffBlock', s.dcMethod !== 'coefficient');

  set('dcResultsCard', !dc.valid);
  if (!dc.valid) return;

  const hasStringCheck = dc.vocPass !== undefined;
  const pass = hasStringCheck ? dc.vocPass : null;
  const head = el('dcResultsHead');
  const badge = el('dcStatusBadge');

  head.className    = pass === true ? 'results-head pass' : pass === false ? 'results-head fail' : 'results-head';
  badge.textContent = pass === true ? 'PASS' : pass === false ? 'FAIL' : 'RESULT';
  badge.className   = pass === true ? 'status-badge pass' : pass === false ? 'status-badge fail' : 'status-badge';

  txt('dcValTemp',   dc.tC + '°C (' + dc.tF.toFixed(1) + '°F)');
  txt('dcValFactor', dc.factor.toFixed(4) + ' (' + dc.methodLabel + ')');
  txt('dcValVocCorr', dc.vocCorr.toFixed(2) + 'V');

  const showStr = dc.stringVocMax !== undefined;
  set('dcStringBlock', !showStr);
  if (showStr) {
    txt('dcValStringVoc', dc.stringVocMax.toFixed(2) + 'V');
    set('dcRowVocPass', dc.vocPass === undefined);
    if (dc.vocPass !== undefined) {
      const e2 = el('dcValVocPass');
      e2.textContent = dc.vocPass
        ? '✓ Within ' + s.dcInverterMaxV + 'V limit'
        : '✗ Exceeds ' + s.dcInverterMaxV + 'V limit';
      e2.className = 'val-sm ' + (dc.vocPass ? 'txt-pass' : 'txt-fail');
    }
    set('dcRowVmpHot', dc.stringVmpHot === undefined);
    if (dc.stringVmpHot !== undefined) {
      txt('dcValVmpHot', dc.stringVmpHot.toFixed(1) + 'V');
    }
    set('dcRowMpptMin', dc.mpptMinPass === undefined);
    if (dc.mpptMinPass !== undefined) {
      const mp = el('dcValMpptMin');
      mp.textContent = dc.mpptMinPass
        ? '✓ Above MPPT min (' + s.dcMpptMin + 'V)'
        : '✗ Below MPPT min (' + s.dcMpptMin + 'V) — reduce string';
      mp.className = 'val-sm ' + (dc.mpptMinPass ? 'txt-pass' : 'txt-fail');
    }
  }

  const showRec = dc.maxModules !== undefined || dc.minModules !== undefined;
  set('dcStringRecBlock', !showRec);
  if (showRec) {
    set('dcRowMaxStr', dc.maxModules === undefined);
    if (dc.maxModules !== undefined) txt('dcValMaxStr', dc.maxModules + ' max (Voc ≤ ' + s.dcInverterMaxV + 'V)');
    set('dcRowMinStr', dc.minModules === undefined);
    if (dc.minModules !== undefined) txt('dcValMinStr', dc.minModules + ' min (Vmp at 70°C ≥ ' + s.dcMpptMin + 'V)');
  }

  set('dcWireBlock', dc.wireMin === undefined);
  if (dc.wireMin !== undefined) {
    txt('dcValIsc',     dc.isc + 'A');
    txt('dcValWireMin', dc.wireMin.toFixed(2) + 'A minimum');
  }
}

function renderEnphase() {
  const s  = state;
  const ac = computeEnphase(s);

  document.querySelectorAll('#acBranchBreakerToggle button').forEach(b =>
    b.classList.toggle('active', parseInt(b.dataset.brk) === s.acBrk));

  set('acEnphaseResultsCard', !ac.valid);
  if (!ac.valid) return;

  txt('acValMaxPer', ac.maxPerBranch + ' max per ' + ac.brk + 'A branch');

  const head  = el('acResultsHead');
  const badge = el('acStatusBadge');
  const alertEl = el('acCountAlert');

  if (ac.count !== undefined) {
    head.className    = ac.pass ? 'results-head pass' : 'results-head fail';
    badge.textContent = ac.pass ? 'PASS' : 'FAIL';
    badge.className   = ac.pass ? 'status-badge pass' : 'status-badge fail';
    txt('acValTotalI',      ac.totalI.toFixed(2) + 'A');
    txt('acValRequiredBrk', ac.requiredBrk.toFixed(2) + 'A → ' + (ac.nextBrk !== null ? ac.nextBrk + 'A std' : '>200A'));
    if (!ac.pass) {
      alertEl.className   = 'alert alert-fail';
      alertEl.textContent = !ac.passCount
        ? 'FAIL — ' + ac.count + ' units exceeds max ' + ac.maxPerBranch + ' per ' + ac.brk + 'A branch. Split across additional branches.'
        : 'FAIL — Required OCPD ' + ac.requiredBrk.toFixed(2) + 'A exceeds ' + ac.brk + 'A branch.';
      alertEl.classList.remove('hidden');
    } else {
      alertEl.className   = 'alert alert-ok';
      alertEl.textContent = 'PASS — ' + ac.count + ' × ' + ac.model.label + ' on ' + ac.brk + 'A branch. Required OCPD: ' + ac.requiredBrk.toFixed(2) + 'A.';
      alertEl.classList.remove('hidden');
    }
  } else {
    head.className      = 'results-head';
    badge.textContent   = '';
    badge.className     = 'status-badge';
    alertEl.classList.add('hidden');
  }
}

function renderEquipment() {
  const mfg = EQUIPMENT[state.eqMfg];
  if (!mfg) return;

  const modelSel = el('eqModelSelect');
  const prevModel = state.eqModel;
  modelSel.innerHTML = '';
  let hasModel = false;
  Object.entries(mfg.models).forEach(([k, m]) => {
    const opt = document.createElement('option');
    opt.value = k; opt.textContent = m.label;
    if (k === prevModel) hasModel = true;
    modelSel.appendChild(opt);
  });
  if (!hasModel) state.eqModel = Object.keys(mfg.models)[0];
  modelSel.value = state.eqModel;

  const m = mfg.models[state.eqModel];
  if (!m) return;
  txt('eqValCapacity', m.kwh + ' kWh');
  txt('eqValOutput',   m.kw + ' kW / ' + m.amps.toFixed(1) + 'A (240V AC)');
  txt('eqValNote',     m.note);

  const sendBtn = el('eqSendBtn');
  sendBtn.textContent = 'Send ' + m.amps.toFixed(1) + 'A to Zone 1 (ESS current)';
  sendBtn.onclick     = () => sendEssToZone1(m.amps);
}

function renderSummary() {
  if (!el('panelSummary').classList.contains('open')) return;
  const c = compute(state);
  const v = NEC[state.version];

  txt('sumBusRating',   state.busRating   !== null ? state.busRating   + 'A' : '—');
  txt('sumMainBreaker', state.mainBreaker !== null ? state.mainBreaker + 'A' : '—');
  txt('sumVersion',     v.citation);
  txt('sumConnType',    state.connection === 'load'        ? 'Load-Side'      : 'Supply-Side');
  txt('sumPanelType',   state.panelType  === 'sub'         ? 'Sub Panel'      : 'Main Panel');
  txt('sumCalcMethod',  state.calcMethod === 'sumbreakers' ? 'Sum of Breakers': '120% Method');

  const resultEl = el('sumResult');
  if (!c.valid) {
    resultEl.textContent = '—'; resultEl.className = 'sum-val';
    txt('sumMaxBackfeed', '—'); txt('sumMaxPV', '—'); set('sumRowESS', true); return;
  }

  resultEl.textContent = c.pass ? 'PASS' : 'FAIL';
  resultEl.className   = 'sum-val ' + (c.pass ? 'txt-pass' : 'txt-fail');

  if (c.method === '120pct') {
    txt('sumCitation', v.citation);
    if (c.pass) {
      txt('sumMaxBackfeed', c.maxBackfeed.toFixed(2) + 'A');
      txt('sumMaxPV', c.maxPVBreaker !== null ? c.maxPVBreaker + 'A' : '>200A');
      set('sumRowESS', !v.ess);
      if (v.ess) txt('sumMaxESS', c.maxESSBreaker !== null ? c.maxESSBreaker + 'A' : '>200A');
    } else {
      txt('sumMaxBackfeed', 'N/A'); txt('sumMaxPV', 'N/A'); set('sumRowESS', true);
    }
  } else {
    txt('sumCitation', 'NEC 705.12(B)(2)(3)(b)');
    txt('sumMaxBackfeed', c.headroom.toFixed(2) + 'A headroom');
    txt('sumMaxPV', 'See Sum of Breakers results');
    set('sumRowESS', true);
  }
}

function sendEssToZone1(amps) {
  state.essOutputCurrent = parseFloat(amps.toFixed(1));
  el('essOutputCurrent').value = state.essOutputCurrent;
  render();
  el('resultsCard').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function printSummary() { window.print(); }

function copySummary() {
  const c = compute(state);
  const v = NEC[state.version];
  let t  = '=== NEC 705.12 Interconnection Calc ===\n';
  t += 'Bus Rating: '  + (state.busRating   ? state.busRating   + 'A' : '—') + '\n';
  t += 'Main Breaker: ' + (state.mainBreaker ? state.mainBreaker + 'A' : '—') + '\n';
  t += 'NEC Version: '  + v.citation + '\n';
  t += 'Connection: '   + (state.connection === 'load' ? 'Load-Side' : 'Supply-Side') + '\n';
  t += 'Method: '       + (state.calcMethod === 'sumbreakers' ? 'Sum of Breakers' : '120% Method') + '\n';
  if (c.valid && c.method === '120pct') {
    t += 'Result: ' + (c.pass ? 'PASS' : 'FAIL') + '\n';
    if (c.pass) t += 'Max Backfeed: ' + c.maxBackfeed.toFixed(2) + 'A\n' +
                     'Max PV Breaker: ' + (c.maxPVBreaker ? c.maxPVBreaker + 'A' : '>200A') + '\n';
  }
  navigator.clipboard.writeText(t).then(() => {
    const btn = el('sumCopyBtn');
    btn.textContent = 'Copied ✓';
    setTimeout(() => { btn.textContent = 'Copy to Clipboard'; }, 2000);
  }).catch(() => {});
}

/* ─── PHASE 2 EVENT HANDLERS ────────────────────────────────────── */

function setDcMethod(m)    { state.dcMethod   = m; renderDcString(); }
function setDcTempMode(m)  { state.dcTempMode = m; renderDcString(); }
function setDcZone(z)      { state.dcZone     = z; renderDcString(); }
function setDcCoeffUnit(u) { state.dcCoeffUnit = u; renderDcString(); }

function onDcTempF() {
  const v = parseFloat(el('dcManualTempF').value);
  if (!isNaN(v)) {
    const c = (v - 32) * 5/9;
    el('dcManualTempC').value = c.toFixed(1);
    state.dcManualTempC = c;
  } else { state.dcManualTempC = null; }
  renderDcString();
}

function onDcTempC() {
  const v = parseFloat(el('dcManualTempC').value);
  if (!isNaN(v)) {
    el('dcManualTempF').value = (v * 9/5 + 32).toFixed(1);
    state.dcManualTempC = v;
  } else { state.dcManualTempC = null; }
  renderDcString();
}

function onDcInput(id) {
  const raw = el(id).value.trim();
  const n   = parseFloat(raw);
  state[id] = raw !== '' && !isNaN(n) ? n : null;
  renderDcString();
}

function setDcChip(id, val) {
  el(id).value = val;
  state[id]    = val;
  renderDcString();
}

function setAcBranchBreaker(v) { state.acBrk   = parseInt(v); renderEnphase(); }
function setAcModel(v)          { state.acModel  = v;          renderEnphase(); }

function setEqMfg(v) {
  state.eqMfg   = v;
  state.eqModel = Object.keys(EQUIPMENT[v].models)[0];
  renderEquipment();
}
function setEqModel(v) { state.eqModel = v; renderEquipment(); }

/* ─── HELPERS ───────────────────────────────────────────────────── */

function el(id)          { return document.getElementById(id); }
function txt(id, s)      { el(id).textContent = s; }
function set(id, hidden) { el(id).classList.toggle('hidden', hidden); }

/* ─── INIT ──────────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  render();

  ['busRating', 'mainBreaker', 'knownInverterCurrent', 'essOutputCurrent',
   'subBusRating', 'subOCPD',
   'sobBusRating', 'sobTotalOCPD', 'sobProposedBackfeed'].forEach(id => {
    document.getElementById(id).addEventListener('input', () => onNumInput(id));
  });

  document.getElementById('subConfigSelect').addEventListener('change', e => {
    state.subConfig = e.target.value;
    render();
  });

  // Phase 2 — DC String Sizing inputs
  ['dcVocStc', 'dcVmpStc', 'dcIscStc', 'dcVocCoeff',
   'dcInverterMaxV', 'dcMpptMin', 'dcMpptMax', 'dcStringCount'].forEach(id => {
    const inp = document.getElementById(id);
    if (inp) inp.addEventListener('input', () => onDcInput(id));
  });
  const dcTempF = document.getElementById('dcManualTempF');
  const dcTempC = document.getElementById('dcManualTempC');
  if (dcTempF) dcTempF.addEventListener('input', onDcTempF);
  if (dcTempC) dcTempC.addEventListener('input', onDcTempC);

  // Populate climate zone dropdown
  const zoneSel = document.getElementById('dcClimateZoneSelect');
  if (zoneSel) {
    Object.entries(CLIMATE_ZONES).forEach(([k, z]) => {
      const opt = document.createElement('option');
      opt.value = k;
      opt.textContent = z.label + ' (' + z.tC + '°C)';
      if (k === state.dcZone) opt.selected = true;
      zoneSel.appendChild(opt);
    });
  }

  // Phase 2 — Enphase AC Breaker
  const acCount = document.getElementById('acEnphaseCount');
  if (acCount) acCount.addEventListener('input', () => {
    const n = parseInt(el('acEnphaseCount').value);
    state.acCount = !isNaN(n) && n > 0 ? n : null;
    renderEnphase();
  });

  // Phase 2 — init panel renders
  renderDcString();
  renderEnphase();
  renderEquipment();
});
