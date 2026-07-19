# Uma fidelity stamp — PDP

**Surface:** Boots Pharmacy PDP (`screenId: pdp`, Frame child **8**)  
**Date:** 2026-07-19  
**Owner:** Uma (UI/UX)  
**Status:** **PROVEN** (§0a re-prove @ tip `76e2433` · **v0.0.30**)  
**Code tip proved:** `76e2433` · **v0.0.30** — FAQ 6/6 bodies · Accordion grid motion · muted closed chevrons · Find out more `TertiaryCta soft` (no custom mint pill CSS)  
**Prior PROVEN tip:** `bf59041` · v0.0.28 — superseded by PO polish; re-proved here  
**Prior RTB / share tip:** `553e29c` · v0.0.24 (§0b / P2 still valid; not re-opened)  
**React:** `src/projects/boots-pharmacy/screens/pdp/*` (L1–L20 RTB + below-fold)  
**Make truth:** `frame/index.tsx` `ModuleBreadcrumbs` / `Body6` / `Body7` / `ModulePdpRtb` / `ComponentPdpRtb` / `ComponentPdpAccordion` · `globals-screens` child-8 · `globals-chrome` checkbox/CTA/icon hits  
**Register:** [../features/PDP_MAKE_PARITY_REGISTER.md](../features/PDP_MAKE_PARITY_REGISTER.md)  
**Checklist:** [../../../product/UMA_FIDELITY_NOTES.md](../../../product/UMA_FIDELITY_NOTES.md) · [VISUAL_FIDELITY.md](../../../product/VISUAL_FIDELITY.md) · [FE_UI_UX_AUDIT.md](../../../product/FE_UI_UX_AUDIT.md) · [DS_STRICTNESS.md](../../../product/DS_STRICTNESS.md)

---

## Verdict

| Field | Value |
|-------|-------|
| **Overall** | **PROVEN** |
| **§0a typical DS / pointer matrix** | **PASS** — FAQ 6/6 + Accordion kit motion/chevrons + TertiaryCta soft Find out more (v0.0.30) |
| **§0a FAQ Accordion (UXDS kit)** | **PASS** — **6/6** interactive panels with bodies; hover navy; **no focus ring** (PO/Make); CSS grid-template-rows collapse; muted closed chevrons |
| **§0a download CTAs (tertiary)** | **PASS** — Guide + Leaflet **same** `.pdp__pill`; **no** `.pdp__pill--bordered` stub / CSS (carried v0.0.28) |
| **§0a Find out more (GP promo)** | **PASS** — `TertiaryCta` `soft` → `.studio-tertiary-cta--soft`; **no** `.pdp__pill--mint` (CSSOM + DOM) |
| **§0b RTB vertical rhythm** | **PASS** — carried from v0.0.24 measure (`32px` stack; title-block `72px`) |
| **P2 share glyph Make flip** | **PASS** — carried from v0.0.24 MCP matrix |
| **PO green-light allowed?** | **No** — wait PO `+` before Home (Final Pass HARD-GREEN restored) |
| **PAGE FINAL PASS** | **HARD-GREEN** @ tip `57775a3` / v0.0.36 |
| **Arch Final Pass after Quinn?** | **Done** — Uma §0a + Quinn 23/23 → Arch HARD-GREEN restored |

**Honest residuals:**  
1. **Download URLs** — Guide / Leaflet are `<button>` with no `href` / download asset (Make parity).  
2. **FAQ body sourcing** — 3 Make+Bea, 3 Bea-sourced for former header-only Make residuals (PO ask; register documents).

---

## RTB vertical rhythm checklist (§0b — mandatory before fidelity PROVEN)

**Make truth:** `ComponentPdpRtb` = `flex-col gap-[32px]`; stack = Frame128 (title+id) → Frame180 (price) → Frame182 (Myself/Someone else) → blurb → Units7 (booster) → Frame179 (CTAs).  
**PO hard-fail class:** cramped price→recipient→body→booster (Uma prior pass missed; claimed L6 PASS on CSS file alone).

| Gate | Make | React must prove | Status |
|------|------|------------------|--------|
| Parent column `gap` | `32px` | computed `.pdp__rtb-col` gap = `32px` (not LEGACY `48px !important`) | **PASS** — `32px` (v0.0.24) |
| title-block size | content (no 1:1) | `.pdp__title-block` height ≈ title+service (~72px); **not** media square | **PASS** — `72px` (v0.0.24) |
| price → recipient | 32px sibling gap | rect distance ≈ 32 | **PASS** — `32` |
| recipient → body | 32px | rect distance ≈ 32 | **PASS** — `32` |
| body → booster | 32px | rect distance ≈ 32 | **PASS** — `32` |
| booster → CTA | 32px | rect distance ≈ 32 | **PASS** — `32` |
| Screenshot evidence | — | RTB column after fix | **PASS** — Chrome MCP viewport screenshot (v0.0.24) |
| LEGACY isolation | Make-only | `globals-screens` module rules `:not(.pdp__rtb-card)` | **PASS** — rule present; React gap stays 32 |

**Root cause (2026-07-19):** Make LEGACY  
`.studio-viewport … [data-name="module.pdp.rtb"] > div > div { gap: 48px !important }` and  
`… > :first-child { flex:1; aspect-ratio:1/1 }` matched React `module.pdp__rtb-card > .pdp__rtb-row > .pdp__rtb-col` / title-block — stole rhythm. Fixed via `:not(.pdp__rtb-card)` (`cbbd97d`).

---

## Browser evidence (Uma — localhost · v0.0.30 · tip `76e2433`)

**URL:** `http://127.0.0.1:5191/?project=boots-pharmacy&screen=pdp&persona=sarah-jenkins&mode=agentic-cjm`  
**Viewport:** 1440×900 (Studio shell)  
**Method:** Chrome DevTools MCP `evaluate_script` + CSSOM rule scan  
**Version chip:** `v0.0.30`  
**Mount:** `.pdp[data-studio-react-screen=pdp]` present · UXDS `Accordion` `[data-name="component.pdp.accordion"]` · **6 items** · default open `who-is-at-risk`  
**Note:** MCP browser has `prefers-reduced-motion: reduce` → live `transition: none`; kit CSSOM still ships `grid-template-rows` 0fr↔1fr + 0.32s ease (PASS for motion contract).

### §0a — FAQ bodies (6/6 interactive)

| Panel | Source | Live body / DOM | Pass |
|-------|--------|-----------------|------|
| `how-can-boots-help` | Make RTB + Bea | Opens; “Our private Chickenpox Vaccination Service…” (417 chars) | **PASS** |
| `who-is-at-risk` | Make Accordion + Bea | Default open; “weakened immune system” (377 chars) | **PASS** |
| `what-happens-at-appointment` | Appt strip + specs + Bea | “Typical appointment takes around 15 minutes…” (327 chars) | **PASS** |
| `nhs-vaccination` | Bea (Make header-only) | Interactive body present (397 chars); **not** residual static | **PASS** |
| `already-have-chickenpox` | Bea (Make header-only) | Interactive body present (444 chars) | **PASS** |
| `personal-data` | Bea (Make header-only) | Interactive body present (529 chars) | **PASS** |

**Counts:** `itemCount=6` · `bodiesWithText=6` · `residuals=0` (no `[data-studio-faq-residual]`).

### §0a — Accordion motion (smooth collapse)

| Probe | Evidence | Pass |
|-------|----------|------|
| Content shell | `.uxds-accordion-content { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 0.32s … }` in CSSOM | **PASS** |
| Open state | `[data-state=open]` → `grid-template-rows: 1fr`; live open measured ~120px row | **PASS** |
| Clip child | `.uxds-accordion-content__clip { grid-row: 1 / span 2; overflow: hidden }` | **PASS** |
| Reduced motion | `@media (prefers-reduced-motion: reduce)` zeros transitions (MCP browser matches) | **PASS** (a11y) |
| No height:auto stutter | Kit uses grid rows (not height animation) | **PASS** |

### §0a — Muted closed chevrons

| State | Computed chevron `color` | Pass |
|-------|--------------------------|------|
| Closed (5 panels) | `rgb(175, 204, 202)` = `--uxds-icon-icon-accent-soft` | **PASS** |
| Open (`who-is-at-risk`) | `rgb(70, 118, 114)` = `--uxds-icon-icon-accent-strong` | **PASS** |
| Kit CSSOM | closed soft → open strong + `rotate(180deg)` | **PASS** |

### §0a — Find out more as TertiaryCta soft

| Probe | Evidence | Pass |
|-------|----------|------|
| DOM class | `studio-tertiary-cta studio-tertiary-cta--compact studio-tertiary-cta--soft` | **PASS** |
| Rest fill | `background: rgb(224, 251, 248)` + inset mint ring (CSSOM soft rules) | **PASS** |
| No custom mint pill | **no** `.pdp__pill--mint` in DOM / CSSOM; deviation `DEV-20260719-tertiary-soft` | **PASS** |
| Label | “Find out more” | **PASS** |

### §0a — Accordion focus-none (Make parity · carried)

| Probe | Computed / CSSOM | Pass |
|-------|------------------|------|
| Header **hover** CSS | `.pdp__accordion-header:hover` title + chevron → link navy token | **PASS** |
| Header **:focus / :focus-visible** | `outline: none` (PO/Make) | **PASS** (carried) |

### §0a — Download CTAs tertiary (unified · carried)

| Control | Rest computed | Pass |
|---------|---------------|------|
| Chickenpox Guide `.pdp__pill` | same tertiary pill language | **PASS** (carried v0.0.28) |
| Vaccine Information Leaflet `.pdp__pill` | **no** `pdp__pill--bordered` | **PASS** (carried) |

### §0a pointer matrix (prior RTB — still in force)

| Control | Rest → hover computed | Pass |
|---------|----------------------|------|
| Booster checkbox **unchecked** | box → mint `#c6e5e1` | **PASS** (v0.0.24) |
| Book now commerce | bg → `#01318f` + lift shadow | **PASS** (v0.0.24) |
| Check availability secondary | mint wash; icon navy | **PASS** (v0.0.24) |
| Empty wishlist heart | navy + wash | **PASS** (v0.0.24) |
| Share icon | navy + wash; Make flip matrix | **PASS** (v0.0.24) |
| Recipient inactive toggle | chip hover token | **PASS** (v0.0.24) |

**N/A on PDP:** SearchField / listing loader (LE1–LE3) — no invent.

---

## Mandatory sign-off stamps

| Line | Stamp |
|------|-------|
| `loading states` | **N/A** — Make has no page loader / empty list / updating overlay (LE1–LE3). No skeleton/spinner invent observed on mount. |
| `checkbox/radio hover` | **PASS** — real MCP `:hover` mint on unchecked booster box (v0.0.24) |
| `typical DS checks` | **PASS** — §0a FAQ 6/6 + Accordion motion/chevrons + TertiaryCta soft + focus-none + download unify (tip `76e2433` / v0.0.30) |
| `fidelity checklist` | **PROVEN** — §0a polish re-proved; §0b/P2 carried |

---

## Layout bands L1–L20 — fidelity after pass

| # | Band | Uma stamp | Notes |
|---|------|-----------|-------|
| **L1** | 1440 / 64 / 1312 | **PASS** (layout) | Shell max 1440 + 64 pad; landmarks present |
| **L2** | Page bg atmosphere | **PASS** | White + decorative PNG under RTB |
| **L3** | Breadcrumbs | **PASS** | Diagonal delimiter; crumb grey `#7a7d87` |
| **L4** | RTB card stack | **PASS** | Drop shadow + top radius 16 |
| **L5** | Hero gallery 50/50 | **PASS** | Gap 48; 1:1; cover / center top |
| **L6** | RTB column | **PASS (measured)** | Gap **32px** after LEGACY isolation |
| **L7** | Title + service ID | **PASS (measured)** | Content-sized title-block **72px** |
| **L8** | List price | **PASS** | £75.00 static 25 semibold |
| **L9** | Recipient toggle + login | **PASS** | Active mint / inactive hover token `#eef8f7` |
| **L10** | Service blurb | **PASS** | 13 / leading 24 |
| **L11** | Booster checkbox | **PASS** | Unchecked hover mint proven |
| **L12** | CTA row | **PASS** | Book / secondary / heart / share hovers + **share Make flip** proven |
| **L13** | Advantage bar | **PASS** | Mint bar under card |
| **L14** | Below-fold body | **PASS** (layout) | `py 96` / `gap 72` |
| **L15** | Content hero | **PASS** | 39 bold + 14×3 `#afccca` |
| **L16** | Intro copy | **PASS** | 864 / two paras |
| **L17** | Appointment strip | **PASS** | `#e5f1f8` pill + icon |
| **L18** | Specs table | **PASS** | 864 card / `#dadada` / rows + download tertiary **unified**; **no URLs** residual |
| **L19** | FAQ accordion | **PASS** | **6/6** bodies; grid motion; muted closed chevrons; hover navy; focus-none |
| **L20** | GP promo | **PASS** | Mint band + **Find out more** `TertiaryCta soft` (no `.pdp__pill--mint`) |

---

## Remaining residuals

| Residual | Severity | Owner |
|----------|----------|-------|
| Download CTAs have no file URLs | **Accepted Make parity** — buttons only until assets exist | PO / Pax |
| PAGE FINAL PASS / `mcpFinalPass` | **HARD-GREEN** @ `57775a3` | Arch |
| FAQ Bea-sourced bodies (3 panels) | **Accepted** — PO ask; register documents Make header-only gap | Bea / PO |

---

## FAIL classes — this pass

| Class | Status |
|-------|--------|
| Invent loader | **Clear** |
| Advantage miss | **Clear** |
| Empty-heart fuchsia | **Clear** (live hover → navy) |
| Dead checkbox | **Clear** (live hover → mint) |
| Primary mint wash | **Clear** (commerce navy hover) |
| Flat secondary | **Clear** |
| Toggle hover skip | **Clear** (token + rule) |
| Booster row tint | **Clear** |
| 50/50 drift | **Clear** |
| Price confusion | **Clear** |
| Static accordion invent | **Clear** — UXDS Accordion; **6/6** bodies |
| FAQ header-only residual | **Clear** — all 6 expandable with bodies |
| Custom mint Find out more pill | **Clear** — `TertiaryCta soft` only; no `.pdp__pill--mint` |
| Accordion height:auto stutter | **Clear** — CSS grid-template-rows kit motion |
| Loud closed chevrons | **Clear** — muted soft closed / strong open |
| Download tertiary stub border | **Clear** — both `.pdp__pill`; no `#c7e4ff` leaflet stub |
| Accordion focus ring (anti-Make) | **Clear** — outline none on `:focus` / `:focus-visible` |
| Make visual leak | **Clear** |
| RTB vertical rhythm / LEGACY steal | **Clear** — measured 32px / title 72px |
| Share glyph missing Make flip | **Clear** — MCP matrix match |
| Rest-state PROVEN | **PROVEN** |

---

## team check report lines (Uma)

```
Uma (UI/UX): fidelity checklist — PROVEN (§0a PASS FAQ 6/6 + Accordion grid motion + muted closed chevrons + TertiaryCta soft Find out more; §0b PASS; P2 share flip PASS; residual: no download URLs)
Uma (UI/UX): section vertical rhythm (§0b) — PASS (32px stack; title-block 72px; tip 87c0fc8 / cbbd97d)
Uma (UI/UX): loading states — N/A (no Make loader; invent = FAIL) — PASS for absence
Uma (UI/UX): checkbox/radio hover — PASS (MCP :hover mint on unchecked booster)
Uma (UI/UX): typical DS checks (state matrix) — PASS (§0a; tip 76e2433 / v0.0.30)
Uma (UI/UX): FAQ Accordion UXDS — PASS (6/6 bodies; grid-template-rows motion CSSOM; closed chevron soft #afccca; open strong #467672)
Uma (UI/UX): Find out more — PASS (TertiaryCta soft; no .pdp__pill--mint; DEV-20260719-tertiary-soft)
Uma (UI/UX): download CTA tertiary unify — PASS (carried v0.0.28)
Uma (UI/UX): share glyph Make flip — PASS (carried v0.0.24)
Uma (UI/UX): Arch Final Pass — HARD-GREEN restored @ 57775a3 / v0.0.36 (Uma §0a + Quinn 23/23)
```

**Knowledge used:** UMA_FIDELITY_NOTES §0/§0a/**§0b** · VISUAL_FIDELITY · DS_STRICTNESS · PDP_MAKE_PARITY_REGISTER L18–L20 · UXDS Accordion kit (`accordion.css` grid rows) · `TertiaryCta soft` · DEVIATIONS `DEV-20260719-tertiary-soft` · PAGE_FINAL_PASS.md (Arch after Quinn).

---

## Related

- [PDP_REACT.md](../features/PDP_REACT.md) · [PDP_MAKE_PARITY_REGISTER.md](../features/PDP_MAKE_PARITY_REGISTER.md)  
- [QUINN_PDP_PROBE_CRITERIA_2026-07-19.md](./QUINN_PDP_PROBE_CRITERIA_2026-07-19.md) · [FE_AUDIT_PDP_MCP_2026-07-19.md](./FE_AUDIT_PDP_MCP_2026-07-19.md)  
- PLP HARD-GREEN audit: [FE_AUDIT_PLP_PAGE_FINAL_PASS_2026-07-19.md](./FE_AUDIT_PLP_PAGE_FINAL_PASS_2026-07-19.md)
