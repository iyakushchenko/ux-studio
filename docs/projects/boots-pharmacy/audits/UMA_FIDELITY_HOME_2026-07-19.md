# Uma fidelity stamp — Home (Agentic Site Pilot)

**Surface:** Boots Pharmacy Site Pilot (`screenId: site-pilot`, Frame child **11**, Make `Body10`)  
**Date:** 2026-07-19  
**Owner:** Uma (UI/UX)  
**Status:** **IN PROGRESS** — first React mount visible; **NOT PROVEN**  
**Code tip:** kickoff tip (post-mount commit)  
**React target:** `src/projects/boots-pharmacy/screens/home/*` (**mounted**)  
**Make truth:** `frame/index.tsx` `Body10` · `ComponentCoOrderSummary9` · `Subtotal11` · `ComponentInputButton4` (mic) · `ComponentInputButton5` (send) · `Frame351`/`Frame352` (suggested chips) · `globals-screens` child-11 · `globals-chrome` primary/mic hover  
**Register:** [../features/HOME_MAKE_PARITY_REGISTER.md](../features/HOME_MAKE_PARITY_REGISTER.md) — align H-bands → L-bands  
**Checklist:** [../../../product/UMA_FIDELITY_NOTES.md](../../../product/UMA_FIDELITY_NOTES.md) · [VISUAL_FIDELITY.md](../../../product/VISUAL_FIDELITY.md) · [FE_UI_UX_AUDIT.md](../../../product/FE_UI_UX_AUDIT.md) · [PAGE_FINAL_PASS.md](../../../product/PAGE_FINAL_PASS.md)

**Gate:** PDP PAGE FINAL PASS **HARD-GREEN** @ tip `53da33f` / v0.0.38 — Home kickoff after PO `+` ([NEXT_STEPS.md](../../../product/NEXT_STEPS.md) §5). **Do not demote PDP.**

---

## Verdict

| Field | Value |
|-------|-------|
| **Overall** | **IN PROGRESS** — checklist seeded only |
| **§0a typical DS / pointer matrix** | **PENDING** — mic · send · suggested chips · textarea focus (no rest-state sign-off) |
| **§0b section vertical rhythm** | **N/A** (no RTB/purchase stack) — hero stack gap **72px** + card internal **32px** still require MCP measure before PARTIAL layout claim |
| **loading / empty / updating** | **N/A** — Make Home has no page loader / empty list / updating overlay (do **not** invent) |
| **checkbox / radio hover** | **N/A** — no checkbox/radio on Home |
| **TertiaryCta reuse** | **N/A** — Make Home uses `component.input.button` (mic circle + send primary), not `TertiaryCta` |
| **PromoMessageStrip / Advantage bar** | **N/A** — verified: `Body10` frame = **header + body only**; no `module.breadcrumbs`, no footer, no `component.gse.system.message` Advantage strip (unlike PLP L5 / PDP L13) |
| **PO green-light allowed?** | **No** — IN PROGRESS only; Quinn MCP matrix + Arch Final Pass after PROVEN |
| **PAGE FINAL PASS** | **Not started** — blocked until this stamp → PROVEN + Quinn prove |

**Honest scope (Make frame child 11):**

- **Present in Make:** navy header · full-bleed hero body · Site Pilot logo · hero heading · query card · mic + send · three suggested chips · chip row label.  
- **Absent in Make (must not invent on React Home):** breadcrumbs · footer · Advantage Card banner · AI promo strip · listing loader.

---

## Layout bands — Arch Body10 inventory (await Bea register)

| # | Make band / component | Make truth (computed / DOM) | Uma stamp | Notes |
|---|------------------------|----------------------------|-----------|-------|
| **H1** | **Shell / column** — 1440 max, **64px** side pad on hero stack | `Body10` inner `p-[64px]`; frame width **1440**; card **640px** centered | **PENDING** | FE_STANDARDS 1440/64/1312 — crumbs N/A (no band) |
| **H2** | **Page bg / atmosphere** — full-bleed body, no footer seam | Make export `bg-[#f5f5f5]`; wire override **gradient** `#c5dde8 → #dbebf5 → #e8f3f9` on `[data-name="body"]`; decorative Figma layers **hidden** in wire | **PENDING** | FAIL class: flat white substituting gradient; invent decorative PNG |
| **H3** | **Site Pilot hero logo** — `boots.ai assistant 3` | **258×54**; SITE PILOT wordmark `#29254C` / vector marks `#241E5B` / `#261F4B` | **PENDING** | SVG fidelity; no text substitute |
| **H4** | **Hero heading — auth personalization** | Default: **"What health services are you focusing on today?"** · Logged-in (header auth): **"Sarah, what health services are you focusing on today?"** · 31px semibold `#012169` / leading 32 · center | **PENDING** | Wire: `syncAgenticHomeHeading` + `[data-studio-agentic-home-heading]` — prove both states |
| **H5** | **Query card shell** — `component.co.order.summary` | White · **rounded 16** · **p 32** · internal **gap 32** · **w 640** · shadow `0 4px 4.45px rgba(1,33,105,0.1)` | **PENDING** | FAIL class: DS “pretty” radius/shadow upgrade or omit lift |
| **H6** | **Composer row** — `Subtotal` | Flex **gap 16** · mic + send **top-aligned** with multiline field (wire `align-items: flex-start`) | **PENDING** | |
| **H7** | **Query textarea** — replaces static demo paragraph | Wire `textarea.proto-agentic-query`: 13/24 `#3a3a3a` · placeholder `#7a7d87` · transparent bg · **1–5 lines** (24–120px) auto-height · `data-studio-action="agentic-home-query"` | **PENDING** | Default demo copy = Sarah travel query (`AGENTIC_HOME_DEMO_QUERY`) |
| **H8** | **Mic icon button** — `ComponentInputButton4` | **48×48** circle · white bg · border `#efefef` · mic glyph `#3A3A3A` | **PENDING** | §0a: default → hover → active per Make LEGACY (mint wash `#eef8f7`, border `#afccca`, glyph `#012169`, active `#c6e5e1`) |
| **H9** | **Send icon button** — `ComponentInputButton5` | Rest Figma `#003fcc` → chrome normalizes **`#012169`** · white arrow glyph · **48px** pill | **PENDING** | §0a: hover `#01318f` + lift shadow · active `#011a5c` — **do not invent** alternate hover |
| **H10** | **Suggested label** | "Suggested dialog options:" · 10px `#7a7d87` · center row | **PENDING** | |
| **H11** | **Suggested chips (×3)** — `component.gse.system.message` | Rest `rgba(204,224,242,0.57)` · **rounded 16** · 13px `#012169` · labels: Vaccine / Skin health / Other Health services | **PENDING** | §0a: hover `rgba(175,204,202,0.55)` + shadow + translateY · active deeper mint — cite Make CSS, **no invent** |
| **H12** | **Vertical rhythm — hero stack** | Logo → heading → card **`gap-[72px]`** on Make column | **PENDING** | MCP measure before layout PARTIAL (§0b spirit) |
| **H13** | **Chrome residuals** | **No footer** · **no breadcrumbs** on this frame | **PENDING** | Whole-component invent = ship fail |
| **H14** | **Header** — shared `boots-pharmacy.module.header` | Navy `#012169` brand switcher (shared chrome — Nazi QA light on class renames only) | **PENDING** | Out of Home page CSS scope unless mount steals layout |

---

## §0a — Typical DS state matrix (PENDING — placeholders)

**Hard rule:** Rest-state green + missing hover = **FAIL**. Invent hover not in Make / UXDS kit = **FAIL**.

| Control | States to prove (Make + kit) | Status | Evidence |
|---------|------------------------------|--------|----------|
| **Textarea** (`agentic-home-query`) | default · filled · focus (outline none per wire) · placeholder · multiline growth 1–5 lines | **PENDING** | — |
| **Mic** (48px circle, Vector glyph) | default · **hover** · **active** · focus-visible | **PENDING** | Make: `globals-screens` child-11 mic block |
| **Send** (primary pill, arrows glyph) | default **`#012169`** rest · **hover** lift · **active** press · disabled N/A | **PENDING** | Make: `globals-chrome` `bg-[#003fcc]` catch + hover `#01318f` |
| **Suggested chips (×3)** | default · **hover** · **active** · focus (keyboard) | **PENDING** | Make: `globals-screens` chip hover block |
| **SearchField** | **N/A** — Home has no search field | **N/A** | Quinn SearchField hover rule waived |
| **Quinn MCP hover prove** | ≥1 interactive field/button matrix on Home mount | **PENDING** | Cite probe step when React lands |

---

## §0 — Loading / empty / updating (N/A)

| Gate | Make | React must | Status |
|------|------|------------|--------|
| Page loader | **None** | No skeleton/spinner/“Updating…” invent | **N/A — PASS if absent** |
| Empty state | **None** | No empty-state invent | **N/A** |

---

## §1–§2 — Page chrome / promo bands

| Gate | Status | Notes |
|------|--------|-------|
| Shadows / lifts on hero card | **PENDING** | H5 shadow is P0 |
| Promo / Advantage / AI strips | **N/A** | **Verified absent** on Home Make frame — do not port PLP/PDP bands |
| Whole-component miss | **PENDING** | Adding footer or Advantage = FAIL |

---

## §3–§7 — CTA / icons / borders (Home-scoped)

| Gate | Status | Notes |
|------|--------|-------|
| Primary send CTA tokens | **PENDING** | Commerce navy family — not mint secondary one-off |
| Icon-only mic | **PENDING** | Circular wash per Make — not fuchsia invent |
| Borders / radii / shadows | **PENDING** | Card 16 · chips 16 · mic border `#efefef` only |
| Icon+text nowrap | **N/A** | Chips single-line labels only |
| TertiaryCta pattern | **N/A** | Not used on Home Make |

---

## Side-by-side screenshot pass (PENDING)

- [ ] First viewport Make vs React (header + hero + card)
- [ ] Logged-out vs logged-in heading
- [ ] Query card rest + textarea filled (multiline)
- [ ] Mic hover · send hover · chip hover (MCP or photo)
- [ ] Confirm **no footer** / **no breadcrumbs** in React mount

---

## Early FAIL risks (Uma forecast)

| Risk | Class | Mitigation |
|------|-------|------------|
| Rest-state-only sign-off | **FAIL** | §0a matrix mandatory before PROVEN |
| Invent chip/send/mic hover colors | **FAIL** | Port Make LEGACY values only — under-match beats invent |
| Query card shadow/radius/padding drift | **FAIL** | Stamp H5 computed values |
| Wrong or missing auth heading | **FAIL** | Prove default + Sarah logged-in copy (H4) |
| Footer / breadcrumbs / Advantage strip on Home | **FAIL** | Make frame has header + `Body10` only |
| PromoMessageStrip or TertiaryCta forced reuse | **FAIL** | **N/A on Home** — mic/send are `component.input.button` |
| Flat `#fff` body vs Make gradient atmosphere | **FAIL** | H2 gradient + hidden decorative layers policy |
| Send rest `#003fcc` vs normalized `#012169` mismatch | **FAIL** | Match post-chrome computed rest, not raw Figma export alone |
| Textarea static paragraph shipped instead of wire behavior | **FAIL** | 1–5 line auto-height + demo default query |
| LEGACY `globals-screens` child-11 rules not applied on React mount | **FAIL** | Hybrid retire Make body; port interactions to page CSS / kits |
| Claim IN PROGRESS without hero **72px** gap measure | **FAIL** | H12 MCP numbers in stamp before PARTIAL |

---

## Mandatory sign-off stamps (kickoff — all PENDING)

| Line | Stamp |
|------|-------|
| `loading states` | **N/A** — no Make loader; invent = FAIL |
| `checkbox/radio hover` | **N/A** — no controls on Home |
| `typical DS checks` | **PENDING** — §0a mic · send · chips · textarea |
| `fidelity checklist` | **IN PROGRESS** — not PROVEN |

---

## team check report lines (Uma — kickoff template)

```
Uma (UI/UX): fidelity checklist — IN PROGRESS (Home kickoff; NOT PROVEN)
Uma (UI/UX): section vertical rhythm — PENDING (hero gap 72px + card gap 32px measure)
Uma (UI/UX): loading states — N/A (no Make loader; invent = FAIL)
Uma (UI/UX): checkbox/radio hover — N/A (no controls on Home)
Uma (UI/UX): typical DS checks (state matrix) — PENDING (mic · send · chips · textarea)
Uma (UI/UX): PromoMessageStrip / Advantage — N/A (verified absent on Home Make Body10)
Uma (UI/UX): TertiaryCta — N/A (Home uses component.input.button mic/send only)
```

**Knowledge used:** UMA_FIDELITY_NOTES §0/§0a/§0b (hero rhythm measure) · VISUAL_FIDELITY §1 design-delta · PAGE_FINAL_PASS sequencing · LESSONS invent-vs-Make + DS hover · Arch Body10 inventory (`frame/index.tsx`) · PDP stamp format — **no PROVEN claim**.

---

## Related

- [NEXT_STEPS.md](../../../product/NEXT_STEPS.md) §5 Home migration  
- [PLP_MAKE_PARITY_REGISTER.md](../features/PLP_MAKE_PARITY_REGISTER.md) — register format reference (Bea to file `HOME_MAKE_PARITY_REGISTER.md`)  
- [UMA_FIDELITY_PDP_2026-07-19.md](./UMA_FIDELITY_PDP_2026-07-19.md) — stamp format reference  
- Wire behavior: `BootsPharmacyProjectView.tsx` (child 11 heading sync · textarea · chips → chat) · `sitePilotHome.ts` · `globals-screens.css` child-11
