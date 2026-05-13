# Solar PV Quick Reference

A dual-audience field and design reference built from 13 years of hands-on solar PV experience — useful whether you're on a rooftop with a multimeter or at a desk running string calculations.

---

## Who This Is For

**Field technicians and installers** — quick lookup tables, wiring diagrams, safety posters, and NEC code summaries you can pull up on a phone mid-job.

**System designers and engineers** — module specs, string sizing worksheets, code-compliant design references, and calculation tools organized by topic.

If you've ever had to hold a flashlight over a dog-eared NEC codebook to find a correction factor, this repo is for you.

---

## Repository Structure

```
solar-reference/
├── modules/                    # PV module data and string sizing
│   ├── datasheets/             # Key specs extracted from manufacturer datasheets
│   ├── specs-by-manufacturer/  # Organized module specs (Voc, Isc, temp coefficients)
│   └── string-sizing/          # String sizing worksheets and worked examples
│
├── posters/                    # Printable and screen-ready reference visuals
│   ├── system-overview/        # System topology diagrams (grid-tie, battery, hybrid)
│   ├── wiring-diagrams/        # DC and AC wiring reference diagrams
│   └── safety-reference/       # Arc flash, lockout/tagout, and emergency procedures
│
├── nec-reference/              # National Electrical Code quick references
│   ├── article-690/            # Solar PV systems (690.7, 690.8, 690.12, etc.)
│   ├── article-705/            # Interconnected power sources
│   ├── article-230/            # Services (utility connection rules)
│   └── code-tables/            # Correction factors, ampacity tables, conduit fill
│
├── tools/                      # Calculators and job-site checklists
│   ├── calculators/            # Spreadsheets and scripts for common calculations
│   └── checklists/             # Pre-energization, commissioning, and inspection lists
│
└── images/                     # Source images for diagrams and posters
```

---

## Quick Links

| Topic | What's Inside |
|---|---|
| [Article 690 Reference](nec-reference/article-690/) | Voltage limits, conductor sizing, rapid shutdown |
| [String Sizing](modules/string-sizing/) | Min/max string length calculations with temp correction |
| [Wiring Diagrams](posters/wiring-diagrams/) | AC/DC combiner, inverter, and service connection layouts |
| [Commissioning Checklist](tools/checklists/) | Pre-energization verification steps |
| [Code Tables](nec-reference/code-tables/) | Ampacity, correction factors, conduit fill |

---

## Field Rules of Thumb

These are starting points — always verify against the full NEC and AHJ requirements for your jurisdiction.

- **Max string voltage (NEC 690.7):** 600V residential, 1000V commercial (1500V for utility-scale listed equipment)
- **Conductor sizing:** 156% of Isc for PV source circuits (690.8(A) × 125% × 125%)
- **Rapid shutdown boundary:** Within 1 foot of array on rooftop systems (NEC 2017+)
- **OCPD sizing:** Not to exceed 156.25% of module Isc (round up to next standard size)
- **Voltage temperature correction:** Use lowest expected ambient temp for Voc, highest for Vmp-based inverter sizing

---

## Contributing

Corrections, additions, and jurisdiction-specific notes are welcome. Open an issue or PR with the relevant NEC edition and source if you're adding or changing code references.

---

## Disclaimer

This reference is for educational and field-assistance purposes. Always verify designs against the current adopted NEC edition in your jurisdiction and consult a licensed engineer for stamped documents.
