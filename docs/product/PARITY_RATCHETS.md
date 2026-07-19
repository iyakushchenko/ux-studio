# Parity ratchets — programmatic Make→React contracts

**Owner:** Arch (Director) + Ben (BE)  
**Status:** Locked (PO mandate, 2026-07-19)  
**Gate:** `npm run check:parity-ratchets` (wired into `npm test`)  
**Script:** [`scripts/check-parity-ratchets.mjs`](../../scripts/check-parity-ratchets.mjs)

**Why:** Green Vitest alone does not catch “Search countries” without a magnifier, missing Advantage bar, invented fuchsia empty-heart hover, duplicate loader copy, etc. Ratchets are **lean source/DOM-contract checks** — Summarizer-style, fast, no flaky screenshot CI.

**Companion gates:** `check:felonies` (overlay eyes) · `check:parity-proven` (audit PROVEN + MCP matrix) · Uma checklist · Quinn page probe.

---

## Hard process

1. Every **typical** Make→React fail class that burned us → **add a ratchet** (Arch/Ben) in the same ship that fixes it.  
2. Document the ratchet in this file (one row in the table).  
3. Seed new ideas from [LESSONS_LEARNED.md](./LESSONS_LEARNED.md) + [UMA_FIDELITY_NOTES.md](./UMA_FIDELITY_NOTES.md).  
4. Ratchets are **not** full visual AI — they enforce markers, copy strings, class contracts, and forbidden CSS patterns.

---

## Active ratchets

| # | Id | Catches | How (lean) | Seed |
|---|-----|---------|------------|------|
| 1 | **search-icon** | React search fields missing magnifier | React screens with `type="search"` / known search placeholders + Availability / Book Step 1 must stamp `data-studio-search-icon="true"` | PO: Search countries lost icon |
| 2 | **bookmark-copy** | Bookmarked label drift | PLP source must include **"In your Bookmarks"** + **"Remove from Bookmarks"** | PO bookmark copy |
| 3 | **empty-heart-fuchsia** | Invented fuchsia on **empty** heart hover | PLP CSS empty wishlist hover (`:not(.is-active)`) must use `--uxds-text-link-link`; fuchsia only on `.is-active` | LESSONS invent hover |
| 4 | **overlay-registry** | MCP/robo click-through | Kept in `check:felonies` (`REGISTERED_OVERLAY_MODAL_IDS`); ratchet asserts felony gate still wired | Overlay eyes |
| 5 | **advantage-bar** | Whole-band miss on PLP | PLP must contain Advantage Card copy + `data-studio-plp-advantage` | LESSONS Advantage miss |
| 6 | **book-now-primary** | Book now not UXDS primary | PLP **Book now** must render via `<ButtonPrimary>` (`.uxds-btn-primary`) | PLP commerce CTA |
| 7 | **loader-dup** | Duplicate “Updating results…” | Exactly **one** `"Updating results"` in PLP source; spinner has `data-studio-plp-listing-loader`; not in count block | LESSONS loader dup |
| 8 | **make-retired** | Make chrome still visible under React | Mount files must set `data-studio-make-retired` / `dataset.studioMakeRetired` | PLP/Book mounts |

---

## Marker conventions

| Marker | Meaning |
|--------|---------|
| `data-studio-search-icon="true"` | Visible search magnifier affordance sibling/control |
| `data-studio-plp-advantage="true"` | Advantage / promo system-message band |
| `data-studio-plp-listing-loader="true"` | In-band listing spinner overlay |
| `data-studio-make-retired="<screenId>"` | Make Frame child hidden after React mount |
| `data-studio-modal="<id>"` | Blocking overlay (felony registry) |

---

## Runtime prove (not this script)

| Prove | Owner |
|-------|--------|
| `__studioRunMcpPageProbe({ screenId: "plp" })` includes **plp-search-icons** step | Quinn (QA) |
| Uma fidelity checklist points here for automated contracts | Uma (UI/UX) |
| `PARITY_PROVEN.json` + MCP matrix | Ben + Quinn |

---

## Adding a ratchet (Arch / Ben)

1. Reproduce the miss once in LESSONS (symptom → root → gate).  
2. Add the cheapest **source** assertion that would have failed CI.  
3. Prefer `data-studio-*` markers over brittle classnames.  
4. Row in this table + JSDoc in `check-parity-ratchets.mjs`.  
5. Keep runtime under ~1s; no network, no browser.
