<link rel="stylesheet" href="../../style.css">

# NEC Article 705 — Interconnected Electric Power Production Sources

Covers how solar PV (and other generation) connects back to the utility system. NEC 2020 unless noted.

---

## 705.12 — Point of Connection

The three main interconnection methods:

### Supply-Side Connection (705.12(A))
- Connect on the utility side of the main service disconnect
- No 120% bus bar rule limitation
- Requires utility approval and often a second meter
- Common for larger commercial systems

### Load-Side Connection (705.12(B)) — Most common residential method
**120% Bus Bar Rule:**
`Max PV OCPD = (Bus bar rating × 120%) − Main breaker rating`

Example: 200A panel, 200A main breaker → max PV breaker = (200 × 1.2) − 200 = 40A

- PV breaker must be at the opposite end of the bus from the main breaker
- "Opposite end" = physically opposite in the panel, not just labeled

### Dedicated Fusible Disconnect (705.12(D))
- Tap conductors connected to service entrance conductors
- Limited to specific configurations; less common in residential

---

## 705.20 — Disconnecting Means

- Required for each source of power
- Must be accessible and indicate open/closed position
- For interactive inverters: often satisfied by the inverter's integrated disconnect

---

## Backfeed Labeling

Per 705.12(B)(3), breakers used for backfeed must be labeled:
> "WARNING — DUAL POWER SOURCES — DO NOT RELOCATE THIS BREAKER"

Some AHJs require a permanent caution label on the panel door as well.
