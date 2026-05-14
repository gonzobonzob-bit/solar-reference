<link rel="stylesheet" href="../style.css">

# Modules

PV module specifications, datasheets, and string sizing resources.

## Subfolders

- **datasheets/** — Key parameters extracted from manufacturer datasheets (Voc, Vmp, Isc, Imp, temp coefficients, dimensions). One file per module model.
- **specs-by-manufacturer/** — Organized by brand for cross-model comparison.
- **string-sizing/** — Worked examples and blank worksheets for calculating minimum and maximum string lengths using temperature-corrected Voc and Vmp.

## String Sizing Quick Reference

| Parameter | Formula | NEC Reference |
|---|---|---|
| Max string Voc | Voc × (1 + β_Voc × ΔT_cold) | 690.7 |
| Min string Vmp | Vmp × (1 + β_Vmp × ΔT_hot) | Inverter spec |
| Max string count | Inverter max input current / Isc_string | 690.8 |

`ΔT_cold` = lowest expected ambient − 25°C (use ASHRAE 2% extreme low or -40°F where required)
`ΔT_hot` = highest expected cell temp − 25°C (ambient + 25°C adder for roof-mounted)
