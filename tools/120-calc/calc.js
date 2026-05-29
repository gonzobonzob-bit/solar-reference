/* ─── NEC VERSION DATA ──────────────────────────────────────────── */

const NEC = {
  '2014': {
    banner:       'NEC 705.12(D) — 120% rule in its modern form. Load-side connection standard established.',
    citation:     'NEC 2014 §705.12(D)',
    section:      '705.12(D)',
    pcs:          false,
    ess:          false
  },
  '2017': {
    banner:       'NEC 705.12(D) — Minor clarification language. No change to calculation method.',
    citation:     'NEC 2017 §705.12(D)',
    section:      '705.12(D)',
    pcs:          false,
    ess:          false
  },
  '2020': {
    banner:       "NEC 705.12(B) — Renumbered. ESS and bidirectional inverters explicitly added. 'Other sources' language broadened. Supply-side rules clarified.",
    citation:     'NEC 2020 §705.12(B)',
    section:      '705.12(B)',
    pcs:          false,
    ess:          true
  },
  '2023': {
    banner:       'NEC 705.12(B) — Current code. Microgrid controller language added. ESS multimode inverter clarification. PCS exception pathway added via 705.13.',
    citation:     'NEC 2023 §705.12(B)',
    section:      '705.12(B)',
    pcs:          true,
    ess:          true
  }
};

/* ─── STANDARD BREAKER SIZES ────────────────────────────────────── */

const STD_BREAKERS = [15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100, 110, 125, 150, 175, 200];

function nextStd(amps) {
  for (const s of STD_BREAKERS) {
    if (s >= amps) return s;
  }
  return null; // exceeds 200A
}

/* ─── STATE ─────────────────────────────────────────────────────── */

const state = {
  version:              '2023',
  connection:           'load',
  busRating:            null,
  mainBreaker:          null,
  knownInverterCurrent: null,
  essOutputCurrent:     null
};

/* ─── COMPUTE: pure function, no DOM side-effects ───────────────── */

function compute(s) {
  const c = { pass: false, valid: false };

  if (s.busRating === null || s.mainBreaker === null) return c;

  const maxBus      = s.busRating * 1.2;
  const maxBackfeed = maxBus - s.mainBreaker;
  const pass        = s.mainBreaker < maxBus;

  Object.assign(c, { valid: true, pass, maxBus, maxBackfeed });

  if (!pass) return c;

  c.maxInverterOutput = maxBackfeed / 1.25;

  // Optional: known inverter output current
  if (s.knownInverterCurrent !== null) {
    const raw = s.knownInverterCurrent * 1.25;
    const std = nextStd(raw);
    c.inv = { raw, std, exceeds: std !== null && std > maxBackfeed };
  }

  // Optional: ESS current (only meaningful in 2020/2023)
  if (NEC[s.version].ess && s.essOutputCurrent !== null) {
    const raw = s.essOutputCurrent * 1.25;
    const std = nextStd(raw);
    c.ess = { raw, std };

    if (std !== null) {
      if (c.inv && c.inv.std !== null) {
        // Both PV and ESS known — combined check
        const combined = c.inv.std + std;
        c.ess.combined        = combined;
        c.ess.combinedExceeds = combined > maxBackfeed;
      } else {
        // ESS only — remaining capacity
        c.ess.remaining       = maxBackfeed - std;
        c.ess.exceedsAlone    = std > maxBackfeed;
      }
    }
  }

  return c;
}

/* ─── RENDER: full DOM update from state ────────────────────────── */

function render() {
  const v   = NEC[state.version];
  const c   = compute(state);
  const isLoad = state.connection === 'load';

  // Version toggle
  document.querySelectorAll('#versionToggle button').forEach(btn =>
    btn.classList.toggle('active', btn.dataset.version === state.version)
  );

  // Connection toggle
  document.querySelectorAll('#connToggle button').forEach(btn =>
    btn.classList.toggle('active', btn.dataset.conn === state.connection)
  );

  // Version banner
  document.getElementById('versionBanner').textContent = v.banner;

  // Connection-mode show/hide
  set('supplySideNote', isLoad);    // hide when load-side
  set('loadSideContent', !isLoad);  // hide when supply-side

  // Results card: only show in load-side mode with valid inputs
  const showResults = isLoad && c.valid;
  set('resultsCard', !showResults);

  if (!showResults) {
    setPanels(c.valid && isLoad);
    return;
  }

  // ── Status header ──────────────────────────────────────────────
  const head  = el('resultsHead');
  const badge = el('statusBadge');
  head.className  = c.pass ? 'results-head pass' : 'results-head fail';
  badge.textContent = c.pass ? 'PASS' : 'FAIL';
  badge.className = c.pass ? 'status-badge pass' : 'status-badge fail';

  // ── Fail alert ─────────────────────────────────────────────────
  set('failAlert', c.pass);

  // ── Base calc rows ─────────────────────────────────────────────
  txt('val120Pct', c.maxBus.toFixed(2) + 'A');
  set('rowBackfeed', !c.pass);
  if (c.pass) txt('valBackfeed', c.maxBackfeed.toFixed(2) + 'A');

  // ── Active citation ────────────────────────────────────────────
  txt('activeCitation', v.citation);

  // ── Inverter section ───────────────────────────────────────────
  set('inverterSection', !c.pass);
  if (c.pass) {
    txt('valMaxInverterOutput', c.maxInverterOutput.toFixed(2) + 'A');
    renderInverterCalc(c);
  }

  // ── ESS section (2020 / 2023 only) ────────────────────────────
  const showEss = c.pass && v.ess;
  set('essSection', !showEss);
  if (showEss) renderEssCalc(c);

  // ── PCS expansion panel ────────────────────────────────────────
  const pcsPanel = el('panelPcs');
  const pcsBadge = el('pcsBadge');
  pcsPanel.classList.toggle('ver-off', !v.pcs);
  if (!v.pcs && pcsPanel.classList.contains('open')) pcsPanel.classList.remove('open');
  set('pcsBadge', v.pcs);  // hide badge when pcs is available

  setPanels(c.valid);
}

/* ─── RENDER SUB-FUNCTIONS ──────────────────────────────────────── */

function renderInverterCalc(c) {
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
    set('rowCombined',   true);
    set('rowEssRemaining', true);
    alertEl.className   = 'alert alert-warn';
    alertEl.textContent = 'Calculated ESS breaker exceeds 200A standard size. Verify with AHJ and equipment specs.';
    alertEl.classList.remove('hidden');
    return;
  }

  txt('valEssBreaker', c.ess.std + 'A');

  if (c.ess.combined !== undefined) {
    // Combined PV + ESS check
    set('rowCombined', false);
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
    // ESS only — remaining capacity
    set('rowCombined', true);
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

function setVersion(v) {
  state.version = v;
  render();
}

function setConnection(conn) {
  state.connection = conn;
  render();
}

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

/* ─── HELPERS ───────────────────────────────────────────────────── */

function el(id)          { return document.getElementById(id); }
function txt(id, s)      { el(id).textContent = s; }
function set(id, hidden) { el(id).classList.toggle('hidden', hidden); }

/* ─── INIT ──────────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  render();

  ['busRating', 'mainBreaker', 'knownInverterCurrent', 'essOutputCurrent'].forEach(id => {
    document.getElementById(id).addEventListener('input', () => onNumInput(id));
  });
});
