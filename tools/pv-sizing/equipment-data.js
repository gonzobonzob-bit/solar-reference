/* ─── SHARED EQUIPMENT DATABASE ─────────────────────────────────────
   Used by pv-sizing and 120-calc.
   Global const — no import/export, plain browser JS.
   ──────────────────────────────────────────────────────────────────── */

const EQUIPMENT_DATA = {

  tesla: {
    name: 'Tesla',
    models: {
      powerwall2: {
        name: 'Powerwall 2',
        type: 'ess',
        kw: 5.0,
        kwh: 13.5,
        acOutputCurrent: 20.8,
        breaker: 30,
        connection: 'AC-coupled',
        pcs: 'Tesla Gateway 3',
        notes: 'AC-coupled ESS. Requires a separate solar inverter. Gateway required for PCS function.'
      },
      powerwall3_11_5: {
        name: 'Powerwall 3 — 11.5kW (default)',
        type: 'hybrid',
        kw: 11.5,
        kwh: 13.5,
        acOutputCurrent: 48,
        breaker: 60,
        dcVocMax: 500,
        mpptMin: 60,
        mpptMax: 480,
        maxDCinputKw: 20,
        pcs: 'Tesla Gateway 3',
        configNote: 'Default configuration. Power level cannot be changed after commissioning without Tesla Support.',
        offgridNote: '15.4kW off-grid mode requires 80A breaker and off-grid configuration.'
      },
      powerwall3_10: {
        name: 'Powerwall 3 — 10kW',
        type: 'hybrid',
        kw: 10.0,
        kwh: 13.5,
        acOutputCurrent: 41.7,
        breaker: 60,
        dcVocMax: 500,
        mpptMin: 60,
        mpptMax: 480,
        maxDCinputKw: 20,
        pcs: 'Tesla Gateway 3'
      },
      powerwall3_7_6: {
        name: 'Powerwall 3 — 7.6kW',
        type: 'hybrid',
        kw: 7.6,
        kwh: 13.5,
        acOutputCurrent: 31.7,
        breaker: 40,
        dcVocMax: 500,
        mpptMin: 60,
        mpptMax: 480,
        maxDCinputKw: 20,
        pcs: 'Tesla Gateway 3'
      },
      powerwall3_5_8: {
        name: 'Powerwall 3 — 5.8kW',
        type: 'hybrid',
        kw: 5.8,
        kwh: 13.5,
        acOutputCurrent: 24,
        breaker: 30,
        dcVocMax: 500,
        mpptMin: 60,
        mpptMax: 480,
        maxDCinputKw: 20,
        pcs: 'Tesla Gateway 3'
      },
      powerwall3_offgrid: {
        name: 'Powerwall 3 — 15.4kW Off-Grid',
        type: 'hybrid',
        kw: 15.4,
        kwh: 13.5,
        acOutputCurrent: 64,
        breaker: 80,
        offgridOnly: true,
        pcs: 'Tesla Gateway 3',
        notes: 'Off-grid mode only. On-grid maximum remains 11.5kW / 48A.'
      },
      solarInverter3_8: {
        name: 'Tesla Solar Inverter 3.8kW',
        type: 'string',
        kw: 3.8,
        acOutputCurrent: 16.6,
        breaker: 25,
        dcVocMax: 480,
        mpptMin: 200,
        mpptMax: 480
      },
      solarInverter5_0: {
        name: 'Tesla Solar Inverter 5.0kW',
        type: 'string',
        kw: 5.0,
        acOutputCurrent: 20.8,
        breaker: 30,
        dcVocMax: 480,
        mpptMin: 200,
        mpptMax: 480
      },
      solarInverter7_6: {
        name: 'Tesla Solar Inverter 7.6kW',
        type: 'string',
        kw: 7.6,
        acOutputCurrent: 32,
        breaker: 45,
        dcVocMax: 480,
        mpptMin: 200,
        mpptMax: 480
      }
    }
  },

  enphase: {
    name: 'Enphase',
    branchBreakerSize: 20,
    models: {
      /* ── IQ Battery ESS ── */
      iqb3t: {
        name: 'IQ Battery 3T',
        type: 'ess',
        kw: 1.28,
        kwh: 3.36,
        acOutputCurrent: 5.3,
        breaker: 20,
        connection: 'AC-coupled',
        notes: 'AC-coupled. Entry-level. Compatible with any grid-tied inverter.'
      },
      iqb5p: {
        name: 'IQ Battery 5P',
        type: 'ess',
        kw: 3.84,
        kwh: 5.0,
        acOutputCurrent: 16.0,
        breaker: 20,
        connection: 'AC-coupled',
        notes: 'AC-coupled. Compatible with IQ microinverters or string inverters.'
      },
      iqb10t: {
        name: 'IQ Battery 10T',
        type: 'ess',
        kw: 7.68,
        kwh: 10.08,
        acOutputCurrent: 32.0,
        breaker: 40,
        connection: 'AC-coupled',
        notes: 'Two IQ Battery 5P stacked. Total 10kWh capacity.'
      },
      /* ── IQ Microinverters ── */
      iq7: {
        name: 'IQ7',
        type: 'micro',
        acOutputPerUnit: 1.00,
        maxPerBranch: 16,
        recommendedModuleW: '235–350W'
      },
      iq7plus: {
        name: 'IQ7+',
        type: 'micro',
        acOutputPerUnit: 1.21,
        maxPerBranch: 13,
        recommendedModuleW: '235–440W'
      },
      iq7a: {
        name: 'IQ7A',
        type: 'micro',
        acOutputPerUnit: 1.45,
        maxPerBranch: 11,
        recommendedModuleW: '300–460W'
      },
      iq7x: {
        name: 'IQ7X',
        type: 'micro',
        acOutputPerUnit: 1.53,
        maxPerBranch: 11,
        recommendedModuleW: '320–460W'
      },
      iq8: {
        name: 'IQ8',
        type: 'micro',
        acOutputPerUnit: 1.02,
        maxPerBranch: 16,
        gridForming: true
      },
      iq8plus: {
        name: 'IQ8+',
        type: 'micro',
        acOutputPerUnit: 1.21,
        maxPerBranch: 13,
        gridForming: true
      },
      iq8m: {
        name: 'IQ8M',
        type: 'micro',
        acOutputPerUnit: 1.39,
        maxPerBranch: 11,
        gridForming: true
      },
      iq8h: {
        name: 'IQ8H',
        type: 'micro',
        acOutputPerUnit: 1.59,
        maxPerBranch: 10,
        gridForming: true
      },
      iq8x: {
        name: 'IQ8X',
        type: 'micro',
        acOutputPerUnit: 1.53,
        maxPerBranch: 11,
        gridForming: true
      },
      iq8p: {
        name: 'IQ8P',
        type: 'micro',
        acOutputPerUnit: 2.00,
        maxPerBranch: 8,
        gridForming: true
      }
    }
  },

  qcells: {
    name: 'QCells',
    models: {
      qhome5: {
        name: 'Q.HOME CORE 5',
        type: 'ess',
        kw: 5.0,
        kwh: 5.0,
        acOutputCurrent: 20.8,
        breaker: 30,
        notes: 'Modular Q CELLS ESS platform. Expandable.'
      },
      qhome10: {
        name: 'Q.HOME CORE 10',
        type: 'ess',
        kw: 7.6,
        kwh: 10.0,
        acOutputCurrent: 31.7,
        breaker: 40,
        notes: 'Q CELLS Q.HOME CORE — 10kWh configuration.'
      },
      qhomeCore: {
        name: 'Q.HOME CORE',
        type: 'hybrid',
        kw: 7.6,
        kwh: 10.0,
        acOutputCurrent: 31.6,
        breaker: 40,
        dcVocMax: 600,
        mpptInputs: 2,
        pcs: 'Q.HOME CORE Controller',
        notes: 'Current US residential ESS product. AHJ familiarity varies — have install manual and datasheet on site.'
      },
      qhomeHybG3: {
        name: 'Q.HOME+ ESS HYB-G3',
        type: 'hybrid',
        nonStandardUS: true,
        notes: 'European 3-phase product. Not typical US residential install. Confirm compatibility with AHJ before designing.'
      }
    }
  }

};

/* ─── CLIMATE ZONES ─────────────────────────────────────────────────── */

const CLIMATE_ZONES_DATA = {
  hot_warm:    { label: 'Hot/Warm',    peakSunHours: 5.5 },
  mixed:       { label: 'Mixed',       peakSunHours: 4.5 },
  cold:        { label: 'Cold',        peakSunHours: 4.0 },
  very_cold:   { label: 'Very Cold',   peakSunHours: 3.5 },
  severe_cold: { label: 'Severe Cold', peakSunHours: 2.5 }
};

/* ─── ZIP PREFIX → CLIMATE ZONE LOOKUP ──────────────────────────────── */

function getZoneFromZip(zip) {
  if (!zip || zip.length < 3) return null;
  const prefix = parseInt(zip.substring(0, 3), 10);
  if (isNaN(prefix)) return null;

  // Severe Cold — AK
  if (prefix >= 995 && prefix <= 999) return 'severe_cold';

  // Hot/Warm — AZ, NM, TX south, FL, HI, CA south
  if (prefix >= 850 && prefix <= 865) return 'hot_warm'; // AZ
  if (prefix >= 870 && prefix <= 884) return 'hot_warm'; // NM
  if (prefix >= 760 && prefix <= 799) return 'hot_warm'; // TX south (non-overlapping)
  if (prefix >= 320 && prefix <= 349) return 'hot_warm'; // FL
  if (prefix >= 967 && prefix <= 968) return 'hot_warm'; // HI
  if (prefix >= 900 && prefix <= 902) return 'hot_warm'; // CA south
  if (prefix >= 917 && prefix <= 925) return 'hot_warm'; // CA south

  // Mixed — CA central, GA, SC, NC, TN, OR, WA, VA/MD, TX north
  if (prefix >= 903 && prefix <= 916) return 'mixed'; // CA central
  if (prefix >= 300 && prefix <= 319) return 'mixed'; // GA
  if (prefix >= 290 && prefix <= 299) return 'mixed'; // SC
  if (prefix >= 270 && prefix <= 289) return 'mixed'; // NC
  if (prefix >= 370 && prefix <= 385) return 'mixed'; // TN
  if (prefix >= 970 && prefix <= 979) return 'mixed'; // OR
  if (prefix >= 980 && prefix <= 994) return 'mixed'; // WA
  if (prefix >= 200 && prefix <= 229) return 'mixed'; // VA/MD
  if (prefix >= 750 && prefix <= 759) return 'mixed'; // TX north

  // Cold — CO, UT, NV, NE, KS, ID, IN, OH, PA, NJ, DE
  if (prefix >= 800 && prefix <= 816) return 'cold'; // CO
  if (prefix >= 840 && prefix <= 847) return 'cold'; // UT
  if (prefix >= 889 && prefix <= 898) return 'cold'; // NV
  if (prefix >= 680 && prefix <= 693) return 'cold'; // NE
  if (prefix >= 660 && prefix <= 679) return 'cold'; // KS
  if (prefix >= 830 && prefix <= 839) return 'cold'; // ID
  if (prefix >= 460 && prefix <= 479) return 'cold'; // IN
  if (prefix >= 430 && prefix <= 458) return 'cold'; // OH
  if (prefix >= 150 && prefix <= 196) return 'cold'; // PA
  if (prefix >=  70 && prefix <=  89) return 'cold'; // NJ
  if (prefix >= 197 && prefix <= 199) return 'cold'; // DE

  // Very Cold — MN, WI, MI, NY, ME, VT, NH, MA, CT, RI, MT, WY, ND, SD, IA, IL
  if (prefix >= 550 && prefix <= 567) return 'very_cold'; // MN
  if (prefix >= 530 && prefix <= 549) return 'very_cold'; // WI
  if (prefix >= 480 && prefix <= 499) return 'very_cold'; // MI
  if (prefix >= 100 && prefix <= 149) return 'very_cold'; // NY
  if (prefix >=  39 && prefix <=  49) return 'very_cold'; // ME
  if (prefix >=  50 && prefix <=  59) return 'very_cold'; // VT
  if (prefix >=  30 && prefix <=  38) return 'very_cold'; // NH
  if (prefix >=  10 && prefix <=  27) return 'very_cold'; // MA
  if (prefix >=  60 && prefix <=  69) return 'very_cold'; // CT
  if (prefix >=  28 && prefix <=  29) return 'very_cold'; // RI
  if (prefix >= 590 && prefix <= 599) return 'very_cold'; // MT
  if (prefix >= 820 && prefix <= 831) return 'very_cold'; // WY
  if (prefix >= 580 && prefix <= 588) return 'very_cold'; // ND
  if (prefix >= 570 && prefix <= 577) return 'very_cold'; // SD
  if (prefix >= 500 && prefix <= 528) return 'very_cold'; // IA
  if (prefix >= 600 && prefix <= 629) return 'very_cold'; // IL

  return null; // not found
}
