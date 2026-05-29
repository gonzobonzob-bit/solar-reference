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
  sobProposedBackfeed:  null
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
    c.inv = { raw, std, exceeds: std !== null ? std > maxBackfeed : true };
  }

  if (v.ess && s.essOutputCurrent !== null) {
    const raw = s.essOutputCurrent * 1.25;
    const std = nextStd(raw);
    c.ess = { raw, std };
    if (std !== null) {
      if (c.inv && c.inv.std !== null) {
        const combined        = c.inv.std + std;
        c.ess.combined        = combined;
        c.ess.combinedExceeds = combined > maxBackfeed;
      } else {
        c.ess.remaining    = maxBackfeed - std;
        c.ess.exceedsAlone = std > maxBackfeed;
      }
    }
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

  set('supplySideNote',  isLoad);
  set('loadSideContent', !isLoad);

  if (!isLoad) { setPanels(false); return; }

  // Input section visibility
  set('mainPanelInputs',    isSub || isSob);
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
}

/* ─── RENDER: 120% RESULTS ──────────────────────────────────────── */

function render120Results(c, v) {
  const head  = el('resultsHead');
  const badge = el('statusBadge');

  head.className    = c.pass ? 'results-head pass' : 'results-head fail';
  badge.textContent = c.pass ? 'PASS' : 'FAIL';
  badge.className   = c.pass ? 'status-badge pass' : 'status-badge fail';

  el('panelTypeBadge').classList.toggle('hidden', !c.isSub);

  set('failAlert', c.pass);

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

  set('backfeedLabelingCallout', !c.pass);

  txt('activeCitation', v.citation);
}

function renderDefaultBreakers(c, v) {
  txt('valMaxPVBreaker', c.maxPVBreaker !== null ? c.maxPVBreaker + 'A' : '> 200A — verify with AHJ');

  const hasEss = !!v.ess;
  set('rowMaxESSBreaker', !hasEss);
  if (hasEss) {
    txt('valMaxESSBreaker', c.maxESSBreaker !== null ? c.maxESSBreaker + 'A' : '> 200A — verify with AHJ');
    set('rowMaxCombinedNote', false);
    txt('valMaxBackfeedRef', c.maxBackfeed.toFixed(2));
  } else {
    set('rowMaxCombinedNote', true);
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
    if (c.inv.exceeds) {
      alertEl.className   = 'alert alert-warn';
      alertEl.textContent =
        'Calculated breaker (' + c.inv.std + 'A) exceeds maximum allowable backfeed (' +
        c.maxBackfeed.toFixed(2) + 'A). Reduce inverter output or consider supply-side connection.';
      alertEl.classList.remove('hidden');
    } else {
      alertEl.classList.add('hidden');
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
    set('rowCombined',     true);
    set('rowEssRemaining', true);
    alertEl.className   = 'alert alert-warn';
    alertEl.textContent = 'Calculated ESS breaker exceeds 200A standard size. Verify with AHJ and equipment specs.';
    alertEl.classList.remove('hidden');
    return;
  }

  txt('valEssBreaker', c.ess.std + 'A');

  if (c.ess.combined !== undefined) {
    set('rowCombined',     false);
    set('rowEssRemaining', true);
    txt('valCombined', c.ess.combined + 'A');
    if (c.ess.combinedExceeds) {
      alertEl.className   = 'alert alert-warn';
      alertEl.textContent =
        'Combined PV and ESS backfeed (' + c.ess.combined + 'A) exceeds panel capacity (' +
        c.maxBackfeed.toFixed(2) + 'A). Resize or consider supply-side connection.';
    } else {
      alertEl.className   = 'alert alert-ok';
      alertEl.textContent = 'Combined backfeed within allowable limit.';
    }
    alertEl.classList.remove('hidden');
  } else {
    set('rowCombined',     true);
    set('rowEssRemaining', false);
    if (c.ess.exceedsAlone) {
      txt('valEssRemaining', '0.00A');
      alertEl.className   = 'alert alert-warn';
      alertEl.textContent =
        'ESS backfeed (' + c.ess.std + 'A) alone exceeds panel capacity (' +
        c.maxBackfeed.toFixed(2) + 'A). Consider supply-side connection or panel upgrade.';
      alertEl.classList.remove('hidden');
    } else {
      txt('valEssRemaining', c.ess.remaining.toFixed(2) + 'A');
      alertEl.classList.add('hidden');
    }
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
}

function toggleSobWhen() {
  el('sobWhenBlock').classList.toggle('hidden');
  const btn = document.querySelector('.sob-when-toggle');
  btn.textContent = el('sobWhenBlock').classList.contains('hidden')
    ? 'When to use ▾'
    : 'When to use ▴';
}

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
});
