# Book Step 1 — migrate-ready truth report

**Date:** 2026-07-19  
**Auditor:** Tech Director (ruthless / not the implementer)  
**Workspace:** `E:\UX\ux-studio` only  
**Audited refs:** HEAD `423d2ac` (main); Book Step 1 FE audits `dbdbb5c` / `3e7dd92`  
**Sources:**  
- [FE_AUDIT_BOOK_STEP1_2026-07-19.md](./FE_AUDIT_BOOK_STEP1_2026-07-19.md) → **PROVEN**  
- [FE_AUDIT_BOOK_STEP1_2026-07-19_3e7dd92.md](./FE_AUDIT_BOOK_STEP1_2026-07-19_3e7dd92.md) → **PROVEN**  
- [../BOOTS_BOOK_STEP1_DESIGN_DELTA.md](../BOOTS_BOOK_STEP1_DESIGN_DELTA.md)  
- [../BOOTS_REACT_SCREEN_PILOT.md](../BOOTS_REACT_SCREEN_PILOT.md)  
- [../CSS_BASE_THEME.md](../../../product/CSS_BASE_THEME.md)  
- [../DS_STRICTNESS.md](../../../product/DS_STRICTNESS.md)  
- Live code under `src/projects/boots-pharmacy/screens/book-step-1/` + Legacy wire  
- `gh run list` / local `npm run build`

---

## Verdict

### **GO WITH GUARDRAILS**

Proceed to the **next** page migration — but stop lying that Book Step 1 means a **clean** React + UXDS engine.

**Truth in one line:** Step 1 body is a **proven hybrid pilot** (React host inside Legacy Frame child 7). Architecture layers are locked. LEGACY is still the house. Next page is allowed **only** if we refuse to grow that house.

**Not GO.** Claiming “clean engine ready” is sales pitch.  
**Not NO-GO.** Blocking the funnel on dead child-7 CSS cleanup or header purity would be theater. Doctrine already says LEGACY retires **screen-by-screen**.

---

## What is solid

- **Live FE audits PROVEN twice** (localhost measured): grid 1440/64/1312, logo↔Home Δx=0, body fill @ 0.31, card/progress 863px, Continue → Availability, booster, Disclosure Learn more, STEPS once, NearMe unify page↔Availability.
- **React screen package exists and is the SOT for this tab:** `BookStep1LocationScreen.tsx` + `book-step-1-location.css` + `mountBookStep1Screen.tsx` + contract/tests.
- **Shared kits in use on the page:** `ButtonPrimary` + `--commerce`, `Disclosure`, `NearMeCta` / `.studio-tertiary-cta`, `.uxds-link` (Learn more + help tel).
- **Deviations registered** (not anonymous forever): `.uxds-filter-chip--strong`, `.uxds-btn-primary--commerce` in `docs/uxds/DEVIATIONS.md`.
- **CSS layer lock is real:** `src/styles/index.css` = BASE → THEME → PANEL → LEGACY; docs mandate **no new React page styles in `globals-*.css`**.
- **Legacy scripts for child 7 are gated** when React is mounted (`isBookStep1ReactMounted()` early-returns on breadcrumb/search/location Legacy paths).
- **Local production build green** at report time (`npm run build` ✓). HEAD **test + build** jobs green on `423d2ac`.
- **framer-motion** landed for Studio Playback/Rec panel crossfade (engine chrome) — motion default is not vaporware.

---

## What is still LEGACY / hybrid

- **Mount model is hybrid, not clean:** React host is injected into Legacy Frame `nth-child(7)`; Legacy header/crumbs/body/footer are `display:none` + `data-studio-legacy-retired`, not removed from the artboard.
- **Wire still owns the world:** `BootsPharmacyProjectView.tsx` mounts Step 1, opens Availability, vaccine/recipient pickers, Continue → `setCurrent(5)` **Legacy Book Step 2**.
- **Dead LEGACY CSS for child 7 still ships** in `globals-screens.css` (~13 `nth-child(7)` rules: progress, help footer, booster, cursor hide). React does not need them; they are zombie weight.
- **Tertiary / NearMe chrome still lives in LEGACY** (`globals-chrome.css` `.studio-tertiary-cta` / `.proto-near-me-cta`) — shared language, wrong layer for a “clean” BASE story.
- **Availability Tool** is React overlay but still styled largely via LEGACY `.proto-avail-*` in `globals-screens.css`.
- **Proto sticky header + Footer** are intentional Studio mounts (design delta “open”) — not Legacy absolute chrome, also not a pure UXDS page shell.
- **Page CSS hex zoo:** `book-step-1-location.css` still hardcodes many Legacy-parity hexes (`#3a3a3a`, `#c3c3c3`, `#f5f5f5`, `#012169`, …) alongside some `var(--uxds-…)`. Tokens/theme are incomplete on this surface.
- **Pilot doc drift:** `BOOTS_REACT_SCREEN_PILOT.md` still says near-me is “FilterChip remapped”; code/audits say shared `NearMeCta` (post-`2ea93a0`). Docs can lie even when audits pass.
- **All other Boots screens** remain Legacy wire. Step 1 is one island.
- **CI reality check (blunt):** last *completed* CI on main before the layer/CRLF harden was **RED** at `3e7dd92` — Tailwind `Invalid declaration: `` ` from **CRCRLF** in CSS (`text-link` / `index.css` path). Hardened later (`.gitattributes` `*.css eol=lf` + layer commits). At report time, HEAD `423d2ac` **test/build green**, **lean Playwright smoke still in_progress** (multiple concurrent smoke jobs stacked). Do **not** claim “main is green” until smoke concludes success.

---

## Blockers vs non-blockers

### Blockers (must not ignore before / while starting next page)

| # | Blocker | Why |
|---|---------|-----|
| B1 | **No new React styles in LEGACY** | If next page dumps into `globals-screens.css`, we poison the migration forever. |
| B2 | **No dual active Legacy+React handlers for the migrated screen** | Step 1 pattern (gate Legacy paths when React mounted) is mandatory. Dual systems = flaky CJM/playback. |
| B3 | **Strict interface audit PROVEN required** before PO green-light on the next page | “Tests passed” alone is BAD (doctrine §7). |
| B4 | **Confirm main CI smoke green** (or fix if red) before calling the pipeline healthy | CRCRLF already burned us once; smoke was still running at report time. |
| B5 | **One pattern per role** — reuse `NearMeCta` / `.uxds-link` / commerce primary / tertiary; no FilterChip fork, no parallel link colors | Step 1 already paid this tax; regressing on Step 2 recreates the zoo. |

### Non-blockers (honest debt — do not stall the next page for these alone)

| # | Debt | Notes |
|---|------|-------|
| N1 | Dead child-7 rules in `globals-screens.css` | Clean when touching that file / after Step 1 is stable; not a migrate gate. |
| N2 | Tertiary CTA still in `globals-chrome.css` | Extract to BASE when next shared use forces it — don’t big-bang. |
| N3 | Hardcoded hex in Step 1 page CSS | Harden to tokens over time; next page must not *copy* the zoo. |
| N4 | Proto header/footer vs Legacy absolute | Intentional Studio chrome; documented in design delta. |
| N5 | Breadcrumb `/` vs rotated bar; Disclosure vs always-open Learn more | Intentional deltas — not failures. |
| N6 | Chosen map is static image on React; full map in Availability | Documented Partial — acceptable for Step 1. |
| N7 | framer-motion not used on Step 1 body | Motion default is engine-wide; page doesn’t need fake enter animations. |

---

## Risk if we proceed anyway (ignore guardrails)

1. **Style zoo compounding** — Step 2 calendar + pills get another hex fork → DS_STRICTNESS becomes wallpaper.  
2. **LEGACY monster growth** — “just one more rule in globals-screens” becomes the default again.  
3. **Dual-system bugs** — Legacy date-cell scripts + React calendar both live → CJM/playback ghost clicks.  
4. **False PROVEN** — audits that ignore hybrid mount + layer dump will green-light a mess.  
5. **CI landmine** — Windows CRCRLF / stacked smokes can red-main while localhost looks fine.  
6. **Funnel cliff** — Continue already lands on **Legacy** Step 2; a sloppy React Step 2 that doesn’t match wire state (slot, location, vaccine) breaks Traditional CJM.

---

## Recommended next page (architect pick)

**Book — Step 2 — Date and Time** (`PROJECT_SCREENS` tab → `childIndex: 4`)

| Why this | Why not others first |
|----------|----------------------|
| Natural funnel after proven Step 1; Continue already targets it | Confirmation (Step 3) depends on Step 2 slot truth |
| Reuses progress / summary pills / Change / commerce CTA patterns | PLP/PDP are larger marketing surfaces; worse first follow-on |
| Forces calendar interaction fidelity (real migrate pressure) | Availability is already React overlay — migrate page chrome later, don’t pretend it’s next “page” |

**Out of scope for “next page”:** big-bang Proto header/footer “clean engine” rewrite; Availability CSS extraction (follow-on).

---

## Explicit “we are not ready if…” checklist

We are **not** ready to start the next page if any of these are true:

- [ ] Someone plans to add the next page’s styles into `src/styles/globals-*.css`
- [ ] Near-me / Change / text links will be restyled as a new one-off (FilterChip fork, teal/navy link fork)
- [ ] Legacy child-4 scripts will stay live **without** React-mount gates after React Step 2 mounts
- [ ] Main CI **test/build/smoke** is red (or smoke still unknown) and we pretend it’s fine
- [ ] PO is told “clean React+UXDS engine” without the hybrid mount caveat
- [ ] Next page ships without a separate strict FE interface audit file under `docs/projects/boots-pharmacy/audits/` ending in **PROVEN**
- [ ] Theme-off shared kits break (hex only in page CSS / theme, BASE unusable)

---

## Guardrails for the next migration (non-negotiable)

1. **Copy the Step 1 *pattern*, not the Step 1 *hex dump*** — colocated `screens/book-step-2/*`, mount host, hide Legacy chrome, gate Legacy handlers.  
2. **BASE / THEME / PANEL / page CSS only** for new work.  
3. **Reuse kits + registered deviations**; register new ones before inventing.  
4. **Delete or clearly retire** obsolete Legacy CSS for a screen when React owns it (at least stop adding; prefer delete when safe).  
5. **Keep wire state contract** (chosen location, vaccine, recipient, booster, booking slot) across React/Legacy boundary.  
6. **PROVEN audit** before PO.  
7. **LF-only CSS** (`.gitattributes`); never reintroduce CRCRLF.

---

## Bottom line for the Product Owner

Previous audits saying **PROVEN** were about **Book Step 1 visual/behavior fidelity on the hybrid mount**. They were **not** a certificate that the Studio is a clean React+UXDS product.

**Proceed to Book Step 2** under the guardrails above.  
**Do not** celebrate “engine clean.” That work is still ahead — screen by screen.
