# FE / UI / UX audit result — Studio version chip (light)

**Surface / slice:** Page-tabs row version chip (`StudioNavVersionChip`)  
**Date:** 2026-07-19  
**Auditor:** implementer light + Director check (chrome-only)  
**Checklist:** [../FE_UI_UX_AUDIT.md](../FE_UI_UX_AUDIT.md)

---

## Verdict

| Field | Value |
|-------|-------|
| **Overall** | PROVEN (light) |
| **PO green-light allowed?** | Yes for chrome version chip |

---

## Summary

Added sticky-right `v{semver}` + channel badge on `.studio-nav-tabs-row`. Solid `#2e2e2e` fill, z-index 3, left shadow — tabs scroll underneath. Aesthetic matches muted PANEL chrome (amber-tint **alpha** badge, not purple pill).

---

## Checklist (applicable)

| # | Result | Evidence |
|---|--------|----------|
| A1 | PASS | Matches dark PANEL chrome; channel uses existing amber/gray language |
| B / C | N/A | No concept page layout |
| G chrome | PASS | Tabs still scroll; chip `flex-shrink: 0`; does not steal tab clicks (`pointer-events: none`) |
| Overflow | PASS | `.studio-nav-version` z-index 3 + solid fill + shadow |

---

## Prove

- `data-studio-version` / `data-studio-channel` on chip
- Source: `package.json` via `__STUDIO_PACKAGE_VERSION__`; channel `alpha` from `studioRelease.ts`
