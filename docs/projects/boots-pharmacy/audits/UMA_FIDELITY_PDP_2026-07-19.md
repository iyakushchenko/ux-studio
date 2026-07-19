# Uma fidelity stamp — PDP

**Surface:** Boots Pharmacy PDP (`screenId: pdp`, Frame child **8**)  
**Date:** 2026-07-19  
**Owner:** Uma (UI/UX)  
**Status:** **PROVEN**  
**Tip at PROVEN:** `d6e4951` · **v0.0.27** · FAQ UXDS Accordion + download tertiary DS hover (Final Pass HARD-GREEN restored @ `828ab2b`)  
**Prior PROVEN tip (RTB / share):** `553e29c` · v0.0.24 (still valid for §0b / P2; not re-opened this pass)  
**React:** `src/projects/boots-pharmacy/screens/pdp/*` (L1–L20 RTB + below-fold)  
**Make truth:** `frame/index.tsx` `ModuleBreadcrumbs` / `Body6` / `Body7` / `ModulePdpRtb` / `ComponentPdpRtb` / `ComponentPdpAccordion` · `globals-screens` child-8 · `globals-chrome` checkbox/CTA/icon hits  
**Register:** [../features/PDP_MAKE_PARITY_REGISTER.md](../features/PDP_MAKE_PARITY_REGISTER.md)  
**Checklist:** [../../../product/UMA_FIDELITY_NOTES.md](../../../product/UMA_FIDELITY_NOTES.md) · [VISUAL_FIDELITY.md](../../../product/VISUAL_FIDELITY.md) · [FE_UI_UX_AUDIT.md](../../../product/FE_UI_UX_AUDIT.md) · [DS_STRICTNESS.md](../../../product/DS_STRICTNESS.md)

---

## Verdict

| Field | Value |
|-------|-------|
| **Overall** | **PROVEN** |
| **§0a typical DS / pointer matrix** | **PASS** — real MCP `:hover` / `:focus-visible` / expand (tip `d6e4951` / v0.0.27) |
| **§0a FAQ Accordion (UXDS kit)** | **PASS** — hover title+chevron → navy; keyboard focus ring; expand/collapse + chevron rotate |
| **§0a download CTAs (tertiary)** | **PASS** — hover label → `#000`; icon → navy `#012169` (`--uxds-text-link-link`) |
| **§0b RTB vertical rhythm** | **PASS** — carried from v0.0.24 measure (`32px` stack; title-block `72px`) |
| **P2 share glyph Make flip** | **PASS** — carried from v0.0.24 MCP matrix |
| **PO green-light allowed?** | **Yes for Uma fidelity** — Arch restored PAGE FINAL PASS HARD-GREEN @ `828ab2b` |
| **PAGE FINAL PASS** | **HARD-GREEN** (Arch) — Uma fidelity gate closed; Home still waits PO `+` |

**Honest residuals (do not block §0a / PROVEN):**  
1. **Empty FAQ panels** — 5/6 panels have `body: null` (Make only ships copy for “Who is at risk?”); expand toggles a11y + chevron only.  
2. **No download URLs** — Guide / Leaflet are `<button>` with no `href` / download asset (Make parity; not inventing files).

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

## Browser evidence (Uma — localhost · v0.0.27 · tip `d6e4951`)

**URL:** `http://127.0.0.1:5187/?project=boots-pharmacy&screen=pdp&persona=sarah-jenkins&mode=agentic-cjm` (session also observed on `:5188` same tip)  
**Viewport:** 1440×900  
**Method:** Chrome DevTools MCP `evaluate_script` + `hover` + `click` + `press_key` (Tab)  
**Version chip:** `v0.0.27`  
**Mount:** `.pdp[data-studio-react-screen=pdp]` present · UXDS `Accordion` `[data-name="component.pdp.accordion"]` · 6 items · default open `who-is-at-risk`

### §0a — FAQ Accordion (hover / focus / expand) — real MCP

| Probe | Rest → interaction computed | Pass |
|-------|----------------------------|------|
| Header **hover** (closed “What happens…”) | title + chevron → `rgb(1, 33, 105)` (`#012169` = `--uxds-text-link-link`); `header.matches(':hover')` | **PASS** |
| Header **focus-visible** (Tab modality) | `outline: rgb(1, 33, 105) solid 2px`; `:focus-visible` true on open header | **PASS** |
| **Expand** empty panel | `aria-expanded=true` / `data-state=open`; chevron `matrix(-1, 0, 0, -1, 0, 0)` (= rotate 180°); **no** body node | **PASS** (Make empty) |
| **Single-open** | Opening another closes prior; reopen `who-is-at-risk` restores body (~96px) Make copy | **PASS** |
| CSSOM rules present | `.pdp__accordion-header:hover …` + `:focus-visible` + `[data-state=open] .chevron` | **PASS** |

**Tokens on `.pdp`:** `--uxds-text-link-link` / `--project-brand-cta-navy` / `--uxds-border-border-focus` = `#012169`.

### §0a — Download CTAs tertiary hover — real MCP

| Control | Rest → hover computed | Pass |
|---------|----------------------|------|
| Chickenpox Guide `.pdp__pill` | label/btn `rgb(92,92,92)` → **`rgb(0, 0, 0)`**; icon stays / → **`rgb(1, 33, 105)`** navy; `:hover` true | **PASS** |
| Vaccine Information Leaflet `.pdp__pill--bordered` | label/btn `rgb(46,46,46)` → **`rgb(0, 0, 0)`**; icon **`rgb(1, 33, 105)`**; `:hover` true | **PASS** |
| CSSOM | `.pdp__pill:hover:not(:disabled){color:#000}` + `.pdp__pill-icon{color:var(--uxds-text-link-link)}` | **PASS** |

**Residual:** both CTAs are `<button>` — `href=null`, no download URL / asset (honest; not inventing).

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
| `typical DS checks` | **PASS** — §0a pointer matrix + FAQ Accordion + download tertiary (tip `d6e4951` / v0.0.27) |
| `fidelity checklist` | **PROVEN** — L1–L20 + §0a/§0b PASS + P2 share flip PASS; empty FAQ bodies + no download URLs listed as residuals |

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
| **L18** | Specs table | **PASS** | 864 card / `#dadada` / rows + download tertiary hover proven; **no URLs** residual |
| **L19** | FAQ accordion | **PASS** (interactive UXDS kit) | Hover/focus/expand MCP proven; **5 empty panels** residual (Make) |
| **L20** | GP promo | **PASS** (layout) | Mint 24 radius + Find out more static |

---

## Remaining residuals

| Residual | Severity | Owner |
|----------|----------|-------|
| FAQ panels without body copy (5/6) | **Accepted Make parity** — do not invent FAQ copy | PO / content |
| Download CTAs have no file URLs | **Accepted Make parity** — buttons only until assets exist | PO / Pax |
| PAGE FINAL PASS / `check:page-final-pass` | **Done** — Arch HARD-GREEN @ `828ab2b` | Arch |
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
| Static accordion invent | **Clear** — UXDS Accordion wired; empty bodies = Make |
| Download tertiary hover miss | **Clear** — MCP label→black / icon→navy |
| Make visual leak | **Clear** |
| RTB vertical rhythm / LEGACY steal | **Clear** — measured 32px / title 72px |
| Share glyph missing Make flip | **Clear** — MCP matrix match |
| Rest-state PROVEN | **PROVEN** |

---

## team check report lines (Uma)

```
Uma (UI/UX): fidelity checklist — PROVEN (§0a PASS FAQ+download; §0b PASS; P2 share flip PASS; residuals: empty FAQ panels, no download URLs)
Uma (UI/UX): section vertical rhythm (§0b) — PASS (32px stack; title-block 72px; tip 87c0fc8 / cbbd97d)
Uma (UI/UX): loading states — N/A (no Make loader; invent = FAIL) — PASS for absence
Uma (UI/UX): checkbox/radio hover — PASS (MCP :hover mint on unchecked booster)
Uma (UI/UX): typical DS checks (state matrix) — PASS (§0a; tip d6e4951 / v0.0.27 — FAQ hover/focus/expand + download tertiary)
Uma (UI/UX): FAQ Accordion UXDS — PASS (MCP hover navy; Tab focus-visible 2px #012169; expand/collapse + chevron rotate)
Uma (UI/UX): download CTA tertiary hover — PASS (MCP label→#000; icon→navy #012169)
Uma (UI/UX): share glyph Make flip — PASS (MCP transform matrix(1,0,0,-1,0,0) = -rotate-180 -scale-x-100)
```

**Knowledge used:** UMA_FIDELITY_NOTES §0/§0a/**§0b** · VISUAL_FIDELITY · DS_STRICTNESS · PDP_MAKE_PARITY_REGISTER L18–L19 · UXDS Accordion kit · `pdp.css` tertiary pill + accordion hover · Make `ComponentPdpAccordion` empty panels · PAGE_FINAL_PASS.md (Arch after Quinn).

---

## Related

- [PDP_REACT.md](../features/PDP_REACT.md) · [PDP_MAKE_PARITY_REGISTER.md](../features/PDP_MAKE_PARITY_REGISTER.md)  
- [QUINN_PDP_PROBE_CRITERIA_2026-07-19.md](./QUINN_PDP_PROBE_CRITERIA_2026-07-19.md) · [FE_AUDIT_PDP_MCP_2026-07-19.md](./FE_AUDIT_PDP_MCP_2026-07-19.md)  
- PLP HARD-GREEN audit: [FE_AUDIT_PLP_PAGE_FINAL_PASS_2026-07-19.md](./FE_AUDIT_PLP_PAGE_FINAL_PASS_2026-07-19.md)
