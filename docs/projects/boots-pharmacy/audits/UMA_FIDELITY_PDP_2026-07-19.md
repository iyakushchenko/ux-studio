# Uma fidelity stamp — PDP

**Surface:** Boots Pharmacy PDP (`screenId: pdp`, Frame child **8**)  
**Date:** 2026-07-19  
**Owner:** Uma (UI/UX)  
**Status:** **IN PROGRESS** — fidelity pass vs Make for mounted L1–L20; **not PROVEN**  
**Tip at pass start:** `1488182` · **React:** `src/projects/boots-pharmacy/screens/pdp/*` (L1–L13 RTB + Finn L14–L20 below-fold)  
**Make truth:** `frame/index.tsx` `ModuleBreadcrumbs` / `Body6` / `Body7` / `ModulePdpRtb` / `ComponentPdpRtb` / `ComponentPdpAccordion` · `globals-screens` child-8 · `globals-chrome` checkbox/CTA/icon hits  
**Register:** [../features/PDP_MAKE_PARITY_REGISTER.md](../features/PDP_MAKE_PARITY_REGISTER.md)  
**Checklist:** [../../../product/UMA_FIDELITY_NOTES.md](../../../product/UMA_FIDELITY_NOTES.md) · [VISUAL_FIDELITY.md](../../../product/VISUAL_FIDELITY.md) · [FE_UI_UX_AUDIT.md](../../../product/FE_UI_UX_AUDIT.md) · [DS_STRICTNESS.md](../../../product/DS_STRICTNESS.md)

---

## Verdict

| Field | Value |
|-------|-------|
| **Overall** | **IN PROGRESS** — L1–L20 mounted; RTB vertical rhythm fix landed (evidence below); **§0a NOT PASS**; **not PROVEN** |
| **PO green-light allowed?** | **No** — no PROVEN / §0a PASS / PAGE FINAL PASS |
| **PAGE FINAL PASS** | Not stamped (Quinn MCP functional PASS ≠ fidelity done) |
| **§0b RTB vertical rhythm** | **FIXED (measured)** — see checklist; still blocks “layout PASS” claims that omit gap numbers |

---

## RTB vertical rhythm checklist (§0b — mandatory before fidelity IN PROGRESS)

**Make truth:** `ComponentPdpRtb` = `flex-col gap-[32px]`; stack = Frame128 (title+id) → Frame180 (price) → Frame182 (Myself/Someone else) → blurb → Units7 (booster) → Frame179 (CTAs).  
**PO hard-fail class:** cramped price→recipient→body→booster (Uma prior pass missed; claimed L6 PASS on CSS file alone).

| Gate | Make | React must prove | Status |
|------|------|------------------|--------|
| Parent column `gap` | `32px` | computed `.pdp__rtb-col` gap = `32px` (not LEGACY `48px !important`) | **PASS** — `32px` |
| title-block size | content (no 1:1) | `.pdp__title-block` height ≈ title+service (~72px); **not** media square | **PASS** — `72px` (was ~584 / 1:1) |
| price → recipient | 32px sibling gap | rect distance ≈ 32 | **PASS** — `32` |
| recipient → body | 32px | rect distance ≈ 32 | **PASS** — `32` |
| body → booster | 32px | rect distance ≈ 32 | **PASS** — `32` |
| booster → CTA | 32px | rect distance ≈ 32 | **PASS** — `32` |
| Screenshot evidence | — | RTB column after fix | **PASS** — MCP screenshot post-fix |
| LEGACY isolation | Make-only | `globals-screens` module rules `:not(.pdp__rtb-card)` | **SHIPPED** |

**Root cause (2026-07-19):** Make LEGACY  
`.studio-viewport … [data-name="module.pdp.rtb"] > div > div { gap: 48px !important }` and  
`… > :first-child { flex:1; aspect-ratio:1/1 }` matched React `module.pdp__rtb-card > .pdp__rtb-row > .pdp__rtb-col` / title-block — stole rhythm.

---

## Browser evidence (Uma — localhost)

**URL:** `http://127.0.0.1:5186/?project=boots-pharmacy&screen=pdp&persona=sarah-jenkins&mode=agentic-cjm`  
**Viewport:** 1440×900  
**Method:** Chrome DevTools MCP `evaluate_script` + viewport screenshots (RTB + below-fold accordion/GP)  
**Tip base:** ≥ `03687d3` / `bfad554` (overlay mini-scrollbar)

| Probe | Result |
|-------|--------|
| React mount `.pdp[data-studio-react-screen=pdp]` | **Present** |
| Make child-8 bodies retired (`display:none`, `data-studio-make-retired=pdp`) | **Present** (visual leak = 0; Make RTB remains in DOM under retired parents) |
| Landmarks `header` + `main` | **Present** |
| Book now label default booster | `Book now - £150` |
| Advantage bar bg | `rgb(198, 229, 225)` / radius 16px bottom |
| RTB row gap / media aspect / Body6 pad | `48px` / `1 / 1` / `64px` top+bottom |
| **§0b RTB column gap / title-block h / sibling gaps** | **`32px` / `72px` / all adjacent `32`** (price→recipient→blurb→booster→CTA) — was `48px` + title ~584px 1:1 |
| Crumb sep | **Diagonal** `.pdp__crumb-sep-bar` — `1.257×14.871`, `#c3c3c3`, `rotate(30deg)`; **no** `/` text |
| Crumb colors | Links + current `rgb(122, 125, 135)` (`#7a7d87`) |
| L14–L20 | Below-fold present: 39px title, 14×3 accent `#afccca`, appt `#e5f1f8`, specs 864/`#dadada`, 6 accordion headers, 1 body (“Who is at risk?”), GP mint `#c6e5e1` / 24px radius |
| Hover **CSS rules** (stylesheet) | Checkbox → `--uxds-surface-accent-soft` (`#c6e5e1`); toggle inactive → `#eef8f7`; secondary → mint + icon `--project-brand-cta-navy-hover` (`#01318f`); empty heart → `#01318f`; Book commerce → `#01318f` |

**Not yet:** Quinn live `:hover` MCP pointer matrix (checkbox unchecked mint computed under real hover, empty-heart path fill, primary lift). Uma does **not** stamp §0a PASS without that.

---

## Mandatory sign-off stamps

| Line | Stamp |
|------|-------|
| `loading states` | **N/A** — Make has no page loader / empty list / updating overlay (LE1–LE3). No skeleton/spinner invent observed on mount. |
| `checkbox/radio hover` | **PARTIAL** — CSS rule + token resolve to `#c6e5e1` unchecked hover; **await Quinn MCP** real `:hover` computed on box. |
| `typical DS checks` | **PARTIAL** — stylesheet rules for Book / Check availability / heart / toggle resolve to Make tokens; **await Quinn MCP** pointer prove. |
| `fidelity checklist` | **PARTIAL** — L1–L20 layout/type/color pass vs Make export + live CSS (see band table); §0a incomplete. |

**LE4:** Book now price instant swap — wire/React present; Quinn proves £75 / £150.

---

## Layout bands L1–L20 — fidelity after pass

| # | Band | Uma stamp | Notes |
|---|------|-----------|-------|
| **L1** | 1440 / 64 / 1312 | **PASS** (layout) | Shell max 1440 + 64 pad; landmarks present |
| **L2** | Page bg atmosphere | **PASS** | White + decorative PNG `opacity: 0.41` under RTB |
| **L3** | Breadcrumbs | **PASS** (fixed) | Diagonal delimiter (was `/`); crumb grey `#7a7d87` (was teal link token / `#3a3a3a` current) |
| **L4** | RTB card stack | **PASS** | Drop shadow + top radius 16 |
| **L5** | Hero gallery 50/50 | **PASS** | Gap 48; 1:1; cover / center top |
| **L6** | RTB column | **PASS (measured)** | Gap **32px** computed after LEGACY isolation; was FAIL (48px + title 1:1) |
| **L7** | Title + service ID | **PASS (measured)** | Content-sized title-block; 24 bold / 13 grey |
| **L8** | List price | **PASS** | £75.00 static 25 semibold |
| **L9** | Recipient toggle + login | **PASS** (layout/CSS) | Active mint / inactive inset / hover `#eef8f7` rule; login block when logged out |
| **L10** | Service blurb | **PASS** | 13 / leading 24 |
| **L11** | Booster checkbox | **PASS** (layout/CSS) | Box-only hover token; label 600→700 checked; helper pl 40 |
| **L12** | CTA row | **PASS** (layout/CSS) | Book min 230×48; secondary border `#afccca`; Make question/share paths |
| **L13** | Advantage bar | **PASS** | Mint bar under card — whole component present |
| **L14** | Below-fold body | **PASS** (layout) | `py 96` / `gap 72` |
| **L15** | Content hero | **PASS** | 39 bold + 14×3 `#afccca` |
| **L16** | Intro copy | **PASS** | 864 / two paras |
| **L17** | Appointment strip | **PASS** | `#e5f1f8` pill + icon |
| **L18** | Specs table | **PASS** | 864 card / `#dadada` / rows + downloads static |
| **L19** | FAQ accordion | **PASS** (static B1) | Six headers; only “Who is at risk?” body; **no** Accordion kit wire |
| **L20** | GP promo | **PASS** (layout) | Mint 24 radius + Find out more static |

---

## Fixes shipped this pass (Uma)

1. **L3 crumb delimiter** — Make `component.gse.breadcrumbs.delimiter` diagonal `#c3c3c3` bar (`rotate(30deg)` in 16×16) replaces `/` text.  
2. **L3 crumb colors** — All crumbs `#7a7d87` (Make); drop teal `--uxds-text-link-link-dark` on crumbs; current crumb not `#3a3a3a`.  
3. **L2/Body6 padding** — RTB band `padding-top: 64px` (Make `p-[64px]`).  
4. **I12 / I14 / I15 hover tokens** — Empty heart + share + secondary icon hover → `--project-brand-cta-navy-hover` (`#01318f`); mint/soft via theme remaps (`--uxds-surface-accent-soft`, `--uxds-filter-chip-surface-hover`).  
5. **Make glyphs** — Question + share paths from `svgPaths.p116ea480` / `p1dcca380` (no invent).  
6. **Download pill icons** — `#012169` via `--project-brand-cta-navy`.  
7. **Synced L14–L20** with Finn below-fold mount for side-by-side audit.  
8. **RTB vertical rhythm (PO hard-fail)** — Scope Make LEGACY `module.pdp.rtb` structural rules with `:not(.pdp__rtb-card)`; React `.pdp__title-block` content-sized; host belt `gap: 32px !important` on `.pdp__rtb-col`.  
9. **Testing ratchet** — UMA_FIDELITY_NOTES §0b + TEAM_KNOWLEDGE + COMMAND_DOCTRINE: section vertical rhythm must be MCP-measured before fidelity IN PROGRESS.

---

## Remaining residuals

| Residual | Severity | Owner |
|----------|----------|-------|
| Quinn MCP functional matrix | **PASS** (`cbbd97d` / v0.0.24 re-prove · `FE_AUDIT_PDP_MCP_2026-07-19.md`) — does **not** clear §0a / Final Pass | Quinn |
| Uma §0a typical DS / hover pointer prove | **P0** — blocks PROVEN + PAGE FINAL PASS | Uma + Quinn |
| PAGE FINAL PASS / `check:page-final-pass` | P0 — blocked on Uma §0a | Quinn + Arch |
| Share glyph Make flip (`rotate-180 -scale-x-100`) — React uses same path without mirror | P2 visual | Uma / Finn |
| Decorative Figma cursors on leaflet / GP CTA — omitted (playback N/A on React) | N/A | — |
| Accordion interactive expand | **Blocked B1** — static until PO | Pax / Bea |
| Register React column still catching up to Present for L1–L20 | Doc | Bea |

---

## FAIL classes — this pass

| Class | Status |
|-------|--------|
| Invent loader | **Clear** |
| Advantage miss | **Clear** |
| Empty-heart fuchsia (CSS) | **Clear** (rule → navy hover); Quinn proves empty state |
| Dead checkbox (CSS) | **Clear** (rule → mint); Quinn proves |
| Primary mint wash | **Clear** (commerce navy hover token) |
| Flat secondary (CSS) | **Clear** |
| Toggle hover skip (CSS) | **Clear** |
| Booster row tint | **Clear** (LEGACY transparent strip + white RTB col) |
| 50/50 drift | **Clear** |
| Price confusion | **Clear** (list £75; Book £150 default) |
| Invent accordion | **Clear** (static) |
| Make visual leak | **Clear** (retired `display:none`) |
| Rest-state PROVEN | **Held** — no PROVEN stamp |
| RTB vertical rhythm / LEGACY steal | **Clear** — measured 32px stack; title-block 72px |

---

## team check report lines (Uma)

```
Uma (UI/UX): fidelity checklist — PARTIAL (RTB §0b rhythm FIXED+measured; §0a NOT PASS; not PROVEN)
Uma (UI/UX): section vertical rhythm (§0b) — PASS (measured 32px stack; title-block content-sized)
Uma (UI/UX): loading states — N/A (no Make loader; invent = FAIL) — PASS for absence
Uma (UI/UX): checkbox/radio hover — PARTIAL (§0a still open)
Uma (UI/UX): typical DS checks (state matrix) — PARTIAL (§0a still open; Quinn functional PASS ≠ §0a)
```

**Knowledge used:** UMA_FIDELITY_NOTES §0/§0a/**§0b** · VISUAL_FIDELITY · DS_STRICTNESS · PDP_MAKE_PARITY_REGISTER L6–L12 · Make `ComponentPdpRtb` gap-32 · LEGACY `:not(.pdp__rtb-card)` isolation.

---

## Related

- [PDP_REACT.md](../features/PDP_REACT.md) · [PDP_MAKE_PARITY_REGISTER.md](../features/PDP_MAKE_PARITY_REGISTER.md)  
- [QUINN_PDP_PROBE_CRITERIA_2026-07-19.md](./QUINN_PDP_PROBE_CRITERIA_2026-07-19.md)  
- PLP HARD-GREEN audit: [FE_AUDIT_PLP_PAGE_FINAL_PASS_2026-07-19.md](./FE_AUDIT_PLP_PAGE_FINAL_PASS_2026-07-19.md)
