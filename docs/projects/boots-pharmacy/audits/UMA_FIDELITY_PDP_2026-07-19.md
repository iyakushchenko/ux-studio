# Uma fidelity stamp — PDP

**Surface:** Boots Pharmacy PDP (`screenId: pdp`, Frame child **8**)  
**Date:** 2026-07-19  
**Owner:** Uma (UI/UX)  
**Status:** **PROVEN** (§0a re-prove @ tip `bf59041` · **v0.0.28**)  
**Code tip proved:** `bf59041` · **v0.0.28** — FAQ Make bodies + download CTA unify + accordion focus-none  
**Prior PROVEN tip:** `d6e4951` · v0.0.27 — superseded by polish; re-proved here  
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
| **§0a typical DS / pointer matrix** | **PASS** — FAQ bodies + CTA unify + accordion focus-none (v0.0.28) |
| **§0a FAQ Accordion (UXDS kit)** | **PASS** — 3 Make-sourced bodies; hover navy; **no focus ring** (PO/Make); 3 residual headers static |
| **§0a download CTAs (tertiary)** | **PASS** — Guide + Leaflet **same** `.pdp__pill`; **no** `.pdp__pill--bordered` stub / CSS |
| **§0b RTB vertical rhythm** | **PASS** — carried from v0.0.24 measure (`32px` stack; title-block `72px`) |
| **P2 share glyph Make flip** | **PASS** — carried from v0.0.24 MCP matrix |
| **PO green-light allowed?** | **No** — wait PO `+` before Home (Final Pass HARD-GREEN restored) |
| **PAGE FINAL PASS** | **HARD-GREEN** @ tip `c6e8931` |
| **Arch Final Pass after Quinn?** | **Done** — Uma §0a + Quinn 23/23 → Arch HARD-GREEN restored |

**Honest residuals:**  
1. **FAQ headers without Make body** — `nhs-vaccination` / `already-have-chickenpox` / `personal-data`: static headers only (no empty expand shells; no invented copy).  
2. **No download URLs** — Guide / Leaflet are `<button>` with no `href` / download asset (Make parity).

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

## Browser evidence (Uma — localhost · v0.0.28 · tip `bf59041`)

**URL:** `http://127.0.0.1:5190/?project=boots-pharmacy&screen=pdp&persona=sarah-jenkins&mode=agentic-cjm`  
**Viewport:** 1440×900 (Studio shell)  
**Method:** Chrome DevTools MCP `evaluate_script` + `__studioRunMcpPageProbe` + a11y snapshot  
**Version chip:** `v0.0.28` (+ ALPHA badge)  
**Mount:** `.pdp[data-studio-react-screen=pdp]` present · UXDS `Accordion` `[data-name="component.pdp.accordion"]` · 6 items · default open `who-is-at-risk`

### §0a — FAQ bodies (3 Make-sourced) + residuals

| Panel | Source | Live body / DOM | Pass |
|-------|--------|-----------------|------|
| `how-can-boots-help` | Make RTB service blurb | Opens; text starts “Our private Chickenpox Vaccination Service…” | **PASS** |
| `who-is-at-risk` | Make Accordion `Description` | Default open; “weakened immune system” present | **PASS** |
| `what-happens-at-appointment` | Appt strip + specs Administration | “Typical appointment takes around 15 minutes. Given in the upper arm…” | **PASS** |
| `nhs-vaccination` | residual | `[data-studio-faq-residual]` static header; **not** a button; no body | **PASS** (accepted) |
| `already-have-chickenpox` | residual | static header only | **PASS** (accepted) |
| `personal-data` | residual | static header only | **PASS** (accepted) |

**Probe:** `pdp-faq-accordion-toggle` / `pdp-faq-accordion-reopen` / `pdp-faq-help-body` → **PASS** (residual count = 3; help body Make RTB copy; focus-none CSSOM present).

### §0a — Accordion focus-none (Make parity)

| Probe | Computed / CSSOM | Pass |
|-------|------------------|------|
| Header **hover** CSS | `.pdp__accordion-header:hover .pdp__accordion-title` + chevron → link navy token | **PASS** |
| Header **:focus / :focus-visible** | `outline-style: none`; `box-shadow: none`; CSSOM rule `.pdp__accordion-header:focus, .pdp__accordion-header:focus-visible { outline: none }` | **PASS** |
| Keyboard expand | button + `aria-expanded` still works (no ring required per PO/Make) | **PASS** |

### §0a — Download CTAs tertiary (unified)

| Control | Rest computed | Pass |
|---------|---------------|------|
| Chickenpox Guide `.pdp__pill` | label `rgb(92,92,92)`; icon navy `#012169`; **border none**; class `pdp__pill` | **PASS** |
| Vaccine Information Leaflet `.pdp__pill` | **same** class + rest colors as Guide; **no** `pdp__pill--bordered` | **PASS** |
| CSSOM | `.pdp__pill:hover:not(:disabled)` + icon hover; **no** `.pdp__pill--bordered` rule | **PASS** |

**Note:** Mid-matrix `__studioRunMcpPageProbe` once flaked `pdp-download-cta-hover` class equality after prior wishlist mutation; direct DOM re-check on same tip = both `className === "pdp__pill"`. Quinn should re-run full matrix clean (Sign Out + empty heart) for Final Pass.

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
| `typical DS checks` | **PASS** — §0a pointer matrix + FAQ bodies + CTA unify + accordion focus-none (tip `bf59041` / v0.0.28) |
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
| **L19** | FAQ accordion | **PASS** | 3 Make bodies + 3 header residuals; hover navy; **focus-none** Make parity |
| **L20** | GP promo | **PASS** (layout) | Mint 24 radius + Find out more static |

---

## Remaining residuals

| Residual | Severity | Owner |
|----------|----------|-------|
| FAQ headers without Make body (3/6) | **Accepted Make parity** — static headers; do not invent FAQ copy | PO / content |
| Download CTAs have no file URLs | **Accepted Make parity** — buttons only until assets exist | PO / Pax |
| PAGE FINAL PASS / `check:page-final-pass` hardGreen | **HARD-GREEN** @ `c6e8931` | Arch |
| Register React column catch-up notes | Doc | Bea |

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
| Static accordion invent | **Clear** — UXDS Accordion; bodies = Make-sourced or header residual |
| Download tertiary stub border | **Clear** — both `.pdp__pill`; no `#c7e4ff` leaflet stub |
| Accordion focus ring (anti-Make) | **Clear** — outline none on `:focus` / `:focus-visible` |
| Make visual leak | **Clear** |
| RTB vertical rhythm / LEGACY steal | **Clear** — measured 32px / title 72px |
| Share glyph missing Make flip | **Clear** — MCP matrix match |
| Rest-state PROVEN | **PROVEN** |

---

## team check report lines (Uma)

```
Uma (UI/UX): fidelity checklist — PROVEN (§0a PASS FAQ bodies×3 + CTA unify + accordion focus-none; §0b PASS; P2 share flip PASS; residuals: 3 FAQ headers, no download URLs)
Uma (UI/UX): section vertical rhythm (§0b) — PASS (32px stack; title-block 72px; tip 87c0fc8 / cbbd97d)
Uma (UI/UX): loading states — N/A (no Make loader; invent = FAIL) — PASS for absence
Uma (UI/UX): checkbox/radio hover — PASS (MCP :hover mint on unchecked booster)
Uma (UI/UX): typical DS checks (state matrix) — PASS (§0a; tip bf59041 / v0.0.28 — FAQ bodies + CTA unify + focus-none)
Uma (UI/UX): FAQ Accordion UXDS — PASS (3 Make bodies; 3 residual headers; hover navy CSS; focus outline none)
Uma (UI/UX): download CTA tertiary unify — PASS (Guide+Leaflet .pdp__pill; no bordered stub; rest label #5c5c5c / icon navy)
Uma (UI/UX): share glyph Make flip — PASS (carried v0.0.24)
Uma (UI/UX): Arch Final Pass — HARD-GREEN restored @ c6e8931 (Uma §0a + Quinn 23/23)
```

**Knowledge used:** UMA_FIDELITY_NOTES §0/§0a/**§0b** · VISUAL_FIDELITY · DS_STRICTNESS · PDP_MAKE_PARITY_REGISTER L18–L19 · UXDS Accordion kit · `pdp.css` tertiary pill + accordion focus-none · Make `ComponentPdpAccordion` · PAGE_FINAL_PASS.md (Arch after Quinn).

---

## Related

- [PDP_REACT.md](../features/PDP_REACT.md) · [PDP_MAKE_PARITY_REGISTER.md](../features/PDP_MAKE_PARITY_REGISTER.md)  
- [QUINN_PDP_PROBE_CRITERIA_2026-07-19.md](./QUINN_PDP_PROBE_CRITERIA_2026-07-19.md) · [FE_AUDIT_PDP_MCP_2026-07-19.md](./FE_AUDIT_PDP_MCP_2026-07-19.md)  
- PLP HARD-GREEN audit: [FE_AUDIT_PLP_PAGE_FINAL_PASS_2026-07-19.md](./FE_AUDIT_PLP_PAGE_FINAL_PASS_2026-07-19.md)
