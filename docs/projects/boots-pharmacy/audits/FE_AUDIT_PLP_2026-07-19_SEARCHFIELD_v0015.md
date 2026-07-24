# FE / UI / UX audit result

**Surface / slice:** PLP Vaccinations — SearchField hover/focus inset ring (v0.0.15)  
**Date:** 2026-07-19  
**Auditor:** Quinn (QA) — Chrome DevTools MCP localhost  
**Ship tip:** `7b6d397`  
**Version:** `0.0.15`

**Checklist:** [../../../product/FE_UI_UX_AUDIT.md](../../../product/FE_UI_UX_AUDIT.md) · [UMA_FIDELITY_NOTES.md](../../../product/UMA_FIDELITY_NOTES.md) §0a / §7b  
**Register:** [../features/PLP_LEGACY_PARITY_REGISTER.md](../features/PLP_LEGACY_PARITY_REGISTER.md) · L8

---

## Verdict

| Field | Value |
|-------|-------|
| **Overall** | **PROVEN** |
| **PO green-light allowed?** | Yes for PLP tip `7b6d397` / v0.0.15 SearchField DS states |
| **Uma fidelity (typical DS)** | **PASS** — kit `:hover` + `:focus-within` inset ring |
| **Quinn interaction matrix** | **PASS** — MCP hover + focus-within on both filter SearchFields |
| **Ben CI** | **PASS** — tip CI green ([29690963592](https://github.com/iyakushchenko/ux-studio/actions/runs/29690963592)) |

---

## Scope this prove

| # | Claim | Result |
|---|--------|--------|
| 1 | Control inset navy ring on **hover** (diseases + countries) | **PASS** |
| 2 | Control inset navy ring on **focus-within** (diseases + countries) | **PASS** |
| 3 | Magnifier borderless (no box on icon) | **PASS** |
| 4 | Version chip `0.0.15` | **PASS** |
| 5 | `__studioRunMcpPageProbe({ screenId: "plp" })` | **PASS** |

---

## Quinn — MCP real-user matrix (localhost:5173)

**Session:** Chrome DevTools MCP · `http://127.0.0.1:5173/?project=boots-pharmacy&screen=plp`  
**Tip:** `7b6d397` · package `0.0.15`  
**Overlay:** `__studioAgentTestingOverlay` start → probe → stop `{ reload: false }`  
**Token:** `--uxds-border-border-focus` → `#012169` on control

### SearchField DS state matrix

| Field | State | Result | Evidence |
|-------|-------|--------|----------|
| Search diseases | hover | **PASS** | MCP `hover` uid · `matches(:hover)=true` · `border: rgb(1, 33, 105)` · `box-shadow: rgb(1, 33, 105) 0px 0px 0px 2px inset` |
| Search diseases | focus-within | **PASS** | input focus · same inset navy ring after transition settle |
| Search diseases | magnifier | **PASS** | `borderWidth=0px`, `boxShadow=none`, `pos=end` |
| Search countries | hover | **PASS** | MCP `hover` uid · exact inset navy 2px on control |
| Search countries | focus-within | **PASS** | same inset navy ring |
| Search countries | magnifier | **PASS** | borderless · `pos=end` |
| Version chip | rest | **PASS** | `[data-studio-version="0.0.15"]` · a11y `v0.0.15` (+ ALPHA sibling) |

### Built-in probe (`__studioRunMcpPageProbe`)

| Step | Result |
|------|--------|
| plp-host … url-screen (all recipe steps) | **PASS** (`pass: true`) |
| plp-search-icons | **PASS** (≥2 icons, `pos=end`, `type=text`) |
| plp-overlay-eyes | **PASS** (refuse under-click) |

### Local gates

| Gate | Result |
|------|--------|
| `npm test` (incl. `searchFieldKit` + `search-field-states` ratchet) | **PASS** (340 tests) |
| GitHub CI @ `7b6d397` | **success** |

---

## Honest residual

- Prior PLP residuals (I3c/I3d / catalog depth) unchanged — not this ship
- Chip UI shows `v0.0.15` + separate `ALPHA` label; attr `0.0.15` matches `package.json`
