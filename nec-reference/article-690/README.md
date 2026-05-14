<link rel="stylesheet" href="../../style.css">

# NEC Article 690 — Solar Photovoltaic Systems

Quick reference for the sections most frequently needed in the field and during plan review. NEC 2020 unless noted.

---

## 690.7 — Maximum Voltage

| System Type | Max Voltage |
|---|---|
| Residential (one- and two-family dwellings) | 600V |
| All other systems | 1000V |
| Listed equipment rated 1500V | 1500V (NEC 2020+) |

**Voc correction for cold temps:**
`V_corrected = Voc × [1 + β_Voc × (T_min − 25°C)]`

Use ASHRAE 99.6% design dry-bulb temp or -40°F where records unavailable.

---

## 690.8 — Circuit Sizing and Current

**PV source circuit current:**
`I_circuit = Isc × 1.25`

**Conductor and OCPD ampacity:**
`I_ampacity = Isc × 1.25 × 1.25 = Isc × 1.5625`

- First 125% accounts for continuous operation (690.8(A))
- Second 125% for conductor sizing under 310.15 continuous load rule (690.8(B))

OCPD: round up to next standard size per 240.6(A). May be omitted on source circuits when string current does not exceed conductor ampacity (690.9(A) exception).

---

## 690.12 — Rapid Shutdown

**NEC 2017+ rooftop arrays:**
- Within the array boundary: conductors must be de-energized to ≤30V within 30 seconds
- Outside the array (building interior): conductors must be de-energized to ≤30V within 30 seconds

**Controlled limit:** 1 foot from array edge and 3 feet from penetration point

**Initiating device:** Listed rapid shutdown initiator or inverter with integrated RSI function

NEC 2023 added provisions for ground-mounted systems (no rapid shutdown required for arrays not on buildings).

---

## 690.15 — Disconnecting Means

- Required for each inverter, charge controller, and power conversion equipment
- Must be within sight of equipment or lockable in open position
- DC disconnect on roof: must be accessible (not requiring a ladder for servicing per some AHJ interpretations)

---

## 690.47 — Grounding

- **Equipment grounding:** Required for all metal parts
- **Array grounding:** Ungrounded systems require ground-fault protection (690.5)
- **DC grounding electrode:** Separate electrode required for some configurations; see 690.47(C)

---

## Common AHJ Sticking Points

- Rapid shutdown labeling on the utility meter (required by 690.56)
- PV system marking at the main service panel (690.54)
- Dedicated PV circuit directory entry on the panel schedule
- Roof penetration fire setbacks (check local fire code, not NEC)
