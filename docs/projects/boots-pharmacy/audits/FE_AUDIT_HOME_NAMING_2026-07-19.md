# FE audit — Home HTML / BEM / `data-studio-*` naming

**Date:** 2026-07-19  
**Screen:** `site-pilot` (Agentic Site Pilot Home, child 11) — public id; folder/BEM may still say `home` interim  

**Tip baseline:** ≥ `fd3241c`  
**Callsigns:** Arch + Bea + Finn  
**Verdict:** **PASS** (naming contract) — not PAGE FINAL PASS / fidelity PROVEN

---

## Scope

Confirm Pilot Home React markup is **semantically named** vs [COMPONENT_LIBRARY.md](../../../product/COMPONENT_LIBRARY.md), [NAMING.md](../../../product/NAMING.md), [PAGE_FINAL_PASS.md](../../../product/PAGE_FINAL_PASS.md) structure rows, and PLP/PDP BEM + `data-studio-*` conventions. **No** Home Final Pass claim.

---

## Checklist

| Check | Result | Notes |
|-------|--------|-------|
| Folder / CSS vs public `screenId` | PARTIAL | Public id `site-pilot`; folder/BEM still `home` / `.home__*` (cheap rename later) |
| `data-studio-react-screen="site-pilot"` | PASS | `<main>` + host mount / legacy-retired |
| Landmarks | PASS | `<main>` page · `<section class="home__card">` ask surface · suggested `<section aria-labelledby>` · query `<form>` |
| Semantic controls | PASS | `<textarea>` · mic `type="button"` · send `type="submit"` · chip `<button>` |
| Stable `data-name` (Legacy) | PASS | `body`, logo, card, Subtotal, input buttons, GSE chips |
| Studio hooks | PASS | `data-studio-agentic-home-heading` · `data-studio-action=agentic-home-{query,mic,send}` · chip kebab actions |
| Chip action ids (no spaces) | **FIXED** | Was `agentic-home-chip-Vaccine services` → `agentic-home-chip-vaccine-services` + `data-studio-home-chip` |
| No new `proto*` / `data-proto-*` | PASS | React path uses `studio*` / `home__*` |
| UXDS kits | N/A | Home Legacy has no SearchField / ButtonPrimary / Promo strip |

---

## Gaps fixed this stamp

1. Chip `data-studio-action` spaces → kebab via `homeChipActionId` / `homeChipSlug`.
2. Card → `<section>`; suggested band → labelled `<section>` + `role="group"`.
3. Query row → `<form>` with submit send (Enter + click).

---

## Explicit non-claims

- Uma fidelity / Quinn MCP matrix — **not** this audit.
- PAGE FINAL PASS — **NOT-GREEN** (migration in progress).
