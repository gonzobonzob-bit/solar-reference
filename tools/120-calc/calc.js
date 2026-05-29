const NEC_VERSIONS = {
  '2014': {
    banner: 'NEC 705.12(D) — 120% rule in its modern form. Load-side connection standard established.',
    citation: 'NEC 2014 §705.12(D)',
    section: '705.12(D)',
    pcsAvailable: false
  },
  '2017': {
    banner: 'NEC 705.12(D) — Minor clarification language. No change to calculation method.',
    citation: 'NEC 2017 §705.12(D)',
    section: '705.12(D)',
    pcsAvailable: false
  },
  '2020': {
    banner: "NEC 705.12(B) — Renumbered. ESS and bidirectional inverters explicitly added. 'Other sources' language broadened. Supply-side rules clarified.",
    citation: 'NEC 2020 §705.12(B)',
    section: '705.12(B)',
    pcsAvailable: false
  },
  '2023': {
    banner: 'NEC 705.12(B) — Current code. Microgrid controller language added. ESS multimode inverter clarification. PCS exception pathway added via 705.13.',
    citation: 'NEC 2023 §705.12(B)',
    section: '705.12(B)',
    pcsAvailable: true
  }
};

let currentVersion = '2023';
let currentConnectionType = 'load';

function calculate() {
  const busVal = document.getElementById('busRating').value.trim();
  const mainVal = document.getElementById('mainBreaker').value.trim();

  const bus = parseFloat(busVal);
  const main = parseFloat(mainVal);
  const valid = busVal !== '' && mainVal !== '' && !isNaN(bus) && !isNaN(main) && bus > 0 && main > 0;

  const resultsZone = document.getElementById('resultsZone');

  if (!valid) {
    resultsZone.classList.add('hidden');
    setPanelsEnabled(false);
    return;
  }

  const maxBus = bus * 1.2;
  const maxBackfeed = maxBus - main;
  const pass = main < maxBus;

  document.getElementById('res120Pct').textContent = maxBus.toFixed(2) + 'A';

  const statusHeader = document.getElementById('resultsStatusHeader');
  const passIndicator = document.getElementById('passIndicator');
  const failBanner = document.getElementById('failBanner');
  const backfeedRow = document.getElementById('backfeedRow');
  const inverterNote = document.getElementById('inverterCurrentNote');

  if (pass) {
    statusHeader.className = 'results-status-header pass';
    passIndicator.textContent = 'PASS';
    passIndicator.className = 'pass-badge pass';
    failBanner.classList.add('hidden');
    backfeedRow.classList.remove('hidden');
    inverterNote.classList.remove('hidden');
    document.getElementById('resMaxBackfeed').textContent = maxBackfeed.toFixed(2) + 'A';
    document.getElementById('resMaxInverterCurrent').textContent = (maxBackfeed / 1.25).toFixed(2) + 'A';
  } else {
    statusHeader.className = 'results-status-header fail';
    passIndicator.textContent = 'FAIL';
    passIndicator.className = 'pass-badge fail';
    failBanner.classList.remove('hidden');
    backfeedRow.classList.add('hidden');
    inverterNote.classList.add('hidden');
  }

  resultsZone.classList.remove('hidden');
  setPanelsEnabled(valid);
}

function setInput(id, value) {
  document.getElementById(id).value = value;
  calculate();
}

function setVersion(version) {
  currentVersion = version;

  document.querySelectorAll('.version-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.version === version);
  });

  const vd = NEC_VERSIONS[version];
  document.getElementById('versionBanner').textContent = vd.banner;
  document.getElementById('necCitation').textContent = vd.citation;

  const pcsPanel = document.getElementById('panel-pcs');
  const pcsBadge = document.getElementById('pcs-version-badge');

  if (vd.pcsAvailable) {
    pcsPanel.classList.remove('panel-version-disabled');
    pcsBadge.classList.add('hidden');
  } else {
    pcsPanel.classList.add('panel-version-disabled');
    if (pcsPanel.classList.contains('panel-open')) {
      pcsPanel.classList.remove('panel-open');
    }
    pcsBadge.classList.remove('hidden');
  }

  calculate();
}

function setConnectionType(type) {
  currentConnectionType = type;

  document.querySelectorAll('.conn-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.conn === type);
  });

  const calcInputs = document.getElementById('calcInputs');
  const resultsZone = document.getElementById('resultsZone');
  const supplySideNote = document.getElementById('supplySideNote');

  if (type === 'supply') {
    calcInputs.classList.add('hidden');
    resultsZone.classList.add('hidden');
    supplySideNote.classList.remove('hidden');
    setPanelsEnabled(false);
  } else {
    calcInputs.classList.remove('hidden');
    supplySideNote.classList.add('hidden');
    calculate();
  }
}

function togglePanel(panelId) {
  const panel = document.getElementById(panelId);
  if (panel.classList.contains('panel-locked') || panel.classList.contains('panel-version-disabled')) return;
  panel.classList.toggle('panel-open');
}

function setPanelsEnabled(enabled) {
  document.querySelectorAll('.expansion-panel').forEach(panel => {
    if (panel.id === 'panel-pcs') return;
    if (enabled) {
      panel.classList.remove('panel-locked');
    } else {
      panel.classList.add('panel-locked');
      panel.classList.remove('panel-open');
    }
  });

  const pcsPanel = document.getElementById('panel-pcs');
  const vd = NEC_VERSIONS[currentVersion];

  if (enabled && vd.pcsAvailable) {
    pcsPanel.classList.remove('panel-locked');
  } else if (!enabled) {
    pcsPanel.classList.add('panel-locked');
    pcsPanel.classList.remove('panel-open');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  setVersion('2023');
  document.getElementById('busRating').addEventListener('input', calculate);
  document.getElementById('mainBreaker').addEventListener('input', calculate);
});
