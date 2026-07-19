# Uma (UI/UX) — Make → React fidelity checklist

**Owner:** Uma (UI/UX)  
**Status:** Locked (PO mandate, 2026-07-19) — mandatory before any screen **PROVEN**  
**Refs:** [FE_UI_UX_AUDIT.md](./FE_UI_UX_AUDIT.md) · [VISUAL_FIDELITY.md](./VISUAL_FIDELITY.md) · [FE_STANDARDS.md](./FE_STANDARDS.md) · [DS_STRICTNESS.md](./DS_STRICTNESS.md) · [LESSONS_LEARNED.md](./LESSONS_LEARNED.md)

**Hard rule:** A screen is **not PROVEN** until this checklist is explicitly pass/fail in the audit + **team check**. Green Vitest/build alone = BAD.

**Bea (BA)** must list every Make band/component in the parity register **before** Finn codes. Missing whole components (see Advantage Card bar on PLP) = ship fail.

**Quinn (QA)** must click-hover every interactive control and **cannot PASS** if the register still has unchecked P0s.

---

## Mandatory before PROVEN

Run against Make (or Make frame export) **side-by-side** with React localhost.

### 1. Page chrome / atmosphere

- [ ] Page background fill / pattern / opacity matches Make
- [ ] Shadows / lifts on hero, cards, listing wrappers match Make (no invent, no omit)
- [ ] Wrappers / shells / radii match Make (no anonymous card borders)
- [ ] Preloaders / skeleton / listing load sims present when Make has them

### 2. Promo / banner / strip bands (scan Make for ALL)

- [ ] Every horizontal band above/below main content inventoried in Bea’s register
- [ ] System messages, Advantage / loyalty bars, AI promo strips, marketing chrome — present or explicitly residual with PO accept
- [ ] **Whole-component miss = ship fail** (example: PLP “Collect 3 points… Advantage Card‡”)

### 3. CTA hover / active / disabled vs tokens

- [ ] Primary / commerce CTAs use UXDS `ButtonPrimary` (+ project theme remaps) — **Nazi-hover every CTA**
- [ ] Secondary / tertiary match DS roles — no mint-wash one-offs on navy primaries
- [ ] LEGACY Make `!important` catch-alls do **not** steal React UXDS hover
- [ ] Disabled states match Make when present

### 4. Icon buttons — hover + pressed feedback

- [ ] Hearts / bookmarks / wishlist: immediate filled/color on **hover and click** (optimistic UI)
- [ ] Share / eye / other icon-only hits: circular wash or tertiary rules per FE standards
- [ ] No laggy / no-feedback hearts

### 5. Borders / radii / shadows

- [ ] Borders only if Make has them (no invent tile borders)
- [ ] Radii / shadows match Make; no DS “pretty” upgrades

### 6. Button types — icon+text vs text-only

- [ ] Icon+text pattern where Make/DS uses tertiary compact (e.g. Reset Filters + trash)
- [ ] Text-only links only where Make is text-only (`.uxds-link`)
- [ ] Icon+text nowrap ([FE_STANDARDS.md](./FE_STANDARDS.md))

### 7. Side-by-side screenshot pass

- [ ] First viewport Make vs React
- [ ] Mid-page bands (filters, listing, promos)
- [ ] Hover states photographed or MCP-proved for every P0 control

---

## team check report line (Uma)

When **team check** runs, Uma must report:

`Uma (UI/UX): fidelity checklist — PASS | FAIL (list failed items)`

Ship cannot be “done” if Uma reports **FAIL**.
