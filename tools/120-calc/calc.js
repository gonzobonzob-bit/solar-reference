const NEC_VERSIONS = {
  '2014': {
    banner: 'NEC 705.12(D) — 120% rule in its modern form. Load-side connection standard established.',
    citation: 'NEC 2014 §705.12(D)',
    section: '705.12(D)',
    pcsAvailable: false,
    essSupported: false
  },
  '2017': {
    banner: 'NEC 705.12(D) — Minor clarification language. No change to calculation method.',
    citation: 'NEC 2017 §705.12(D)',
    section: '705.12(D)',
    pcsAvailable: false,
    essSupported: false
  },
  '2020': {
    banner: "NEC 705.12(B) — Renumbered. ESS and bidirectional inverters explicitly added. 'Other sources' language broadened. Supply-side rules clarified.",
    citation: 'NEC 2020 §705.12(B)',
    section: '705.12(B)',
    pcsAvailable: false,
    essSupported: true
  },
  '2023': {
    banner: 'NEC 705.12(B) — Current code. Microgrid controller language added. ESS multimode inverter clarification. PCS exception pathway added via 705.13.',
    citation: 'NEC 2023 §705.12(B)',
    section: '705.12(B)',
    pcsAvailable: true,
    essSupported: true
  }
};

const STANDARD_BREAKERS = [15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100, 110, 125, 150, 175, 200];

let currentVersion = '2023';
let currentConnectionType = 'load';
let currentMaxBackfeed = 0;
let currentPass = false;

function nextStandardBreaker(amps) {
  for (const size of STANDARD_BREAKERS) {
    if (size >= amps) return size;
  }
  return null;
}

function calculate() {
  const busVal = document.getElementById('busRating').value.trim();
  const mainVal = document.getElementById('mainBreaker').value.trim();

  const bus = parseFloat(busVal);
  const main = parseFloat(mainVal);
  const valid = busVal !== '' && mainVal !== '' && !isNaN(bus) && !isNaN(main) && bus > 0 && main > 0;

  const resultsZone = document.getElementById('resultsZone');

  if (!valid) {
    resultsZone.classList.add('hidden');
    currentPass = false;
    currentMaxBackfeed = 0;
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
  const inverterSection = document.getElementById('inverterSizingSection');
  const essSection = document.getElementById('essSizingSection');

  if (pass) {
    currentMaxBackfeed = maxBackfeed;
    currentPass = true;

    statusHeader.className = 'results-status-header pass';
    passIndicator.textContent = 'PASS';
    passIndicator.className = 'pass-badge pass';
    failBanner.classList.add('hidden');
    backfeedRow.classList.remove('hidden');
    document.getElementById('resMaxBackfeed').textContent = maxBackfeed.toFixed(2) + 'A';

    inverterSection.classList.remove('hidden');
    document.getElementById('resMaxInverterOutputCurrent').textContent = (maxBackfeed / 1.25).toFixed(2) + 'A';
    calculateInverterOptional();

    if (NEC_VERSIONS[currentVersion].essSupported) {
      essSection.classList.remove('hidden');
      calculateEssOptional();
    } else {
      essSection.classList.add('hidden');
    }

  } else {
    currentMaxBackfeed = 0;
    currentPass = false;

    statusHeader.className = 'results-status-header fail';
    passIndicator.textContent = 'FAIL';
    passIndicator.className = 'pass-badge fail';
    failBanner.classList.remove('hidden');
    backfeedRow.classList.add('hidden');
    inverterSection.classList.add('hidden');
    essSection.classList.add('hidden');
  }

  resultsZone.classList.remove('hidden');
  setPanelsEnabled(valid);
}

function calculateInverterOptional() {
  if (!currentPass) return;

  const val = document.getElementById('knownInverterCurrent').value.trim();
  const knownResultsEl = document.getElementById('inverterKnownResults');
  const exceedsFlagEl = document.getElementById('inverterExceedsFlag');

  if (!val || isNaN(parseFloat(val)) || parseFloat(val) <= 0) {
    knownResultsEl.classList.add('hidden');
    return;
  }

  const known = parseFloat(val);
  const rawBreaker = known * 1.25;
  const stdBreaker = nextStandardBreaker(rawBreaker);

  document.getElementById('resInverterRaw').textContent = rawBreaker.toFixed(2) + 'A';

  if (stdBreaker === null) {
    document.getElementById('resInverterStd').textContent = 'Exceeds 200A';
    exceedsFlagEl.className = 'result-warning';
    exceedsFlagEl.textContent = 'Calculated breaker exceeds 200A standard size. Verify with AHJ and equipment specs.';
    exceedsFlagEl.classList.remove('hidden');
  } else {
    document.getElementById('resInverterStd').textContent = stdBreaker + 'A';
    if (stdBreaker > currentMaxBackfeed) {
      exceedsFlagEl.className = 'result-warning';
      exceedsFlagEl.textContent =
        'Calculated breaker (' + stdBreaker + 'A) exceeds maximum allowable backfeed (' +
        currentMaxBackfeed.toFixed(2) + 'A). Reduce inverter output or consider supply-side connection.';
      exceedsFlagEl.classList.remove('hidden');
    } else {
      exceedsFlagEl.classList.add('hidden');
    }
  }

  knownResultsEl.classList.remove('hidden');

  if (NEC_VERSIONS[currentVersion].essSupported) {
    calculateEssOptional();
  }
}

function calculateEssOptional() {
  if (!currentPass || !NEC_VERSIONS[currentVersion].essSupported) return;

  const essVal = document.getElementById('essOutputCurrent').value.trim();
  const essResultsEl = document.getElementById('essResults');
  const combinedCheckRow = document.getElementById('combinedCheckRow');
  const remainingCapacityRow = document.getElementById('remainingCapacityRow');
  const essStatusMsg = document.getElementById('essStatusMsg');

  if (!essVal || isNaN(parseFloat(essVal)) || parseFloat(essVal) <= 0) {
    essResultsEl.classList.add('hidden');
    return;
  }

  const ess = parseFloat(essVal);
  const essRaw = ess * 1.25;
  const essStd = nextStandardBreaker(essRaw);

  if (essStd === null) {
    document.getElementById('resEssStd').textContent = 'Exceeds 200A';
    combinedCheckRow.classList.add('hidden');
    remainingCapacityRow.classList.add('hidden');
    essStatusMsg.className = 'result-warning';
    essStatusMsg.textContent = 'Calculated ESS breaker exceeds 200A standard size. Verify with AHJ and equipment specs.';
    essStatusMsg.classList.remove('hidden');
    essResultsEl.classList.remove('hidden');
    return;
  }

  document.getElementById('resEssStd').textContent = essStd + 'A';

  const pvVal = document.getElementById('knownInverterCurrent').value.trim();
  const pvKnown = pvVal && !isNaN(parseFloat(pvVal)) && parseFloat(pvVal) > 0;

  if (pvKnown) {
    const pvStd = nextStandardBreaker(parseFloat(pvVal) * 1.25);

    if (pvStd !== null) {
      const combined = pvStd + essStd;
      document.getElementById('resCombinedTotal').textContent = combined + 'A';
      combinedCheckRow.classList.remove('hidden');
      remainingCapacityRow.classList.add('hidden');

      if (combined > currentMaxBackfeed) {
        essStatusMsg.className = 'result-warning';
        essStatusMsg.textContent =
          'Combined PV and ESS backfeed (' + combined + 'A) exceeds panel capacity (' +
          currentMaxBackfeed.toFixed(2) + 'A). Resize or consider supply-side connection.';
      } else {
        essStatusMsg.className = 'result-confirm';
        essStatusMsg.textContent = 'Combined backfeed within allowable limit.';
      }
      essStatusMsg.classList.remove('hidden');
    } else {
      combinedCheckRow.classList.add('hidden');
      remainingCapacityRow.classList.add('hidden');
      essStatusMsg.classList.add('hidden');
    }
  } else {
    combinedCheckRow.classList.add('hidden');
    const remaining = currentMaxBackfeed - essStd;

    if (remaining < 0) {
      document.getElementById('resRemainingCapacity').textContent = '0.00A';
      essStatusMsg.className = 'result-warning';
      essStatusMsg.textContent =
        'ESS backfeed (' + essStd + 'A) alone exceeds panel capacity (' +
        currentMaxBackfeed.toFixed(2) + 'A). Consider supply-side connection or panel upgrade.';
      essStatusMsg.classList.remove('hidden');
    } else {
      document.getElementById('resRemainingCapacity').textContent = remaining.toFixed(2) + 'A';
      essStatusMsg.classList.add('hidden');
    }
    remainingCapacityRow.classList.remove('hidden');
  }

  essResultsEl.classList.remove('hidden');
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
    if (pcsPanel.classList.contains('panel-open')) pcsPanel.classList.remove('panel-open');
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
    currentPass = false;
    currentMaxBackfeed = 0;
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
  document.getElementById('knownInverterCurrent').addEventListener('input', () => {
    calculateInverterOptional();
    calculateEssOptional();
  });
  document.getElementById('essOutputCurrent').addEventListener('input', calculateEssOptional);
});
