# Uma fidelity stamp — PDP (kickoff / pre-scaffold)

**Surface:** Boots Pharmacy PDP (`screenId: pdp`, Frame child **8**)  
**Date:** 2026-07-19  
**Owner:** Uma (UI/UX)  
**Status:** **IN PROGRESS** (scaffold mounted — **not PROVEN**)  
**React target:** `src/projects/boots-pharmacy/screens/pdp/*` (Finn scaffold L1–L13; below-fold pending)  
**Make truth:** `frame/index.tsx` `Body6` / `Body7` / `ModulePdpRtb` / `ComponentPdpRtb` (~6551–7414) · `globals-screens` child-8 · `globals-chrome` checkbox/CTA/icon hits  
**Register:** [../features/PDP_MAKE_PARITY_REGISTER.md](../features/PDP_MAKE_PARITY_REGISTER.md)  
**Checklist:** [../../../product/UMA_FIDELITY_NOTES.md](../../../product/UMA_FIDELITY_NOTES.md) · [VISUAL_FIDELITY.md](../../../product/VISUAL_FIDELITY.md) · [FE_UI_UX_AUDIT.md](../../../product/FE_UI_UX_AUDIT.md) · [DS_STRICTNESS.md](../../../product/DS_STRICTNESS.md)

---

## Verdict (kickoff only)

| Field | Value |
|-------|-------|
| **Overall** | **IN PROGRESS** — React RTB scaffold landed; side-by-side + DS matrix + MCP still open |
| **PO green-light allowed?** | **No** — await Finn mount + Quinn MCP + full matrix |
| **PAGE FINAL PASS** | Not started |

---

## Mandatory sign-off stamps (team check — pending)

Explicit lines required before **PROVEN** ([UMA_FIDELITY_NOTES.md](../../../product/UMA_FIDELITY_NOTES.md) team-check block):

| Line | Kickoff stamp | Scaffold gate |
|------|---------------|---------------|
| `loading states` | **N/A** — Make has **no** page loader, empty list, or updating overlay (register LE1–LE3) | **FAIL** if Finn invents skeleton/spinner/“Updating…” |
| `checkbox/radio hover` | **P0** — unchecked mint `#c6e5e1` on `[data-name="box"]` hover; checked `#afccca` + mark `#305854` (`globals-chrome` L2340–2368) | **FAIL** if dead checkbox or row mint wash (booster band is **transparent** — hover on **box** only) |
| `typical DS checks` | **P0** — Book now primary navy lift; Check availability secondary mint wash; heart empty≠fuchsia; toggle inactive `#eef8f7` hover | **FAIL** if rest-state-only CTAs or invented hover chrome |
| `fidelity checklist` | **PENDING** — L1–L20 targets below | Side-by-side after mount |

**LE4 (booster → price):** instant DOM text swap on Book now label — **not** a loading scenario; do not add spinner/delay.

---

## Blocker B1 — accordion static (do not require Accordion kit)

| Item | Stamp |
|------|-------|
| **Make truth** | `ComponentPdpAccordion` — six headers; **only** “Who is at risk?” body visible; **no** click wire (`frame/index.tsx` L7301–7320) |
| **React rule** | Render **static** layout matching Figma export — **do not** ship UXDS `Accordion` expand/collapse until PO accepts interactive vs static ([register B1](../features/PDP_MAKE_PARITY_REGISTER.md)) |
| **Uma gate** | Static parity = PASS for L19; invented accordion animation or wrong expanded panel = **FAIL** |

---

## `globals-screens` child-8 rules (Make live wire — port to `screens/pdp/*.css`)

React path must **not** grow LEGACY; these are **fidelity targets** to reproduce in scoped screen CSS + UXDS:

| Rule | Target |
|------|--------|
| RTB card | `max-width: 1440px`, centred (`module.pdp.rtb` L1239–1244) |
| Inner 50/50 row | `gap: 48px`; image wrapper `flex: 1 1 0`, `aspect-ratio: 1/1` (L1247–1256) |
| Product image | `object-fit: cover`, `object-position: center top` (L1259–1270) |
| RTB column | `flex: 1 1 0`, explicit `background: white` (L1273–1278) |
| Advantage bar | Same 1440 centre as card (`component.gse.system.message` L1281–1286) |
| Recipient toggle | Inactive white + inset `#d6d6d6` borders per half; active `#c6e5e1`; hover inactive `#eef8f7` (L246–280) |
| Booster checkbox band | **Strip** row backgrounds — `units:not([data-toggle-index])` + descendants transparent except `[data-name="box"]` (L1292–1297) |
| Figma cursor | Hidden on child 8 (L714–715) — N/A on React |

---

## Layout bands L1–L20 — Make fidelity targets

Tokens from Make export + child-8 CSS. **Under-match > invent.** No new anonymous hex in React — use `var(--uxds-…)` + Boots `theme.css` remaps.

| # | Band | Spacing / layout | Typography / color | Hover / interaction notes |
|---|------|------------------|--------------------|---------------------------|
| **L1** | 1440 / 64 / 1312 column | Page `w-full`; `Body6`/`Body7` `px-[64px]`; RTB `max-width: 1440px` centred | — | PAGE FINAL PASS: landmarks `header`+`main`, BEM=`pdp` |
| **L2** | Page bg atmosphere | `Body6`: white base + decorative PNG `opacity-41` under RTB (`imgBody1`) | — | Match PLP L1 pattern — no invent pattern |
| **L3** | Breadcrumbs | `py-[16px]`; crumb gap `8px`; delimiters 16×16 | 10px Open Sans; links `#7a7d87` underline; current “Chickenpox” plain | Vaccination crumb → PLP (`data-studio-crumb="vaccination"`) |
| **L4** | RTB card stack | White card; top radius **16px**; drop shadow `0px 5px 9.75px rgba(0,108,185,0.05)` | — | No invent card border |
| **L5** | Hero gallery 50/50 | Row `gap: 48px` (inner = outer padding); image wrapper **1:1** aspect, `rounded-[8px]` | — | `object-fit: cover` |
| **L6** | RTB column blocks | `component.pdp.rtb` `gap-[32px]` vertical | White fill explicit | — |
| **L7** | Title + service ID | — | Title **24px bold** `#3a3a3a`; ID **13px** `#7a7d87` “Service Identifier: BTS-PHM-VAR-00075” | — |
| **L8** | List price row | Row `gap-[32px]`; price cluster `gap-[8px]` | **£75.00** **25px semibold** `#3a3a3a`; caption “Single dose price” **13px** `#7a7d87` | Static — not booster-driven |
| **L9** | Recipient toggle + login | Toggle `h-[48px]` `px-[16px]`; row `gap-[32px]` | Tab labels **13px**; links `#012169` underline | **I2:** inactive hover `#eef8f7`; active `#c6e5e1`; fw 400 inactive / 600 active |
| **L10** | Service blurb | — | **13px** regular `#3a3a3a`, leading 24 | — |
| **L11** | Booster checkbox | Checkbox 24×24; label row `gap-[16px]`; helper `pl-[40px]` | Label **13px**; checked label **semibold** | **P0:** box unchecked hover `#c6e5e1`; checked `#afccca`; **no** mint row wash (L1292–1297) |
| **L12** | CTA row | `gap-[32px]`; Book now `min-w-[230px]` `h-[48px]`; icon hits `h-[32px]` circular | Book now navy `#012169` **16px** semibold white; secondary `#5c5c5c` + border `#afccca` | **I14** primary hover `#01318f` + shadow + `translateY(-1px)`; **I15** secondary mint `#c6e5e1` wash; **I12** heart empty mint wash + navy glyph, filled fuchsia on hover only |
| **L13** | Advantage Card bar | Mint `#c6e5e1`; bottom radius **16px**; `px-[8px] py-[4px]` | **13px** `#2e2e2e` centred — “Collect 3 points for every £1 you spend with Boots Advantage Card‡” | **Whole-component miss = FAIL** (PLP lesson) |
| **L14** | Below-fold body | `Body7` white; `py-[96px]`; section `gap-[72px]` | — | Scroll-into-view before MCP interact |
| **L15** | Content hero | Centred; accent bar **14×3px** `#afccca` | H2 **39px bold** `#3a3a3a` | — |
| **L16** | Intro copy | `w-[864px]`; para `gap` implied `mb-[16px]` | **13px** `#3a3a3a` | — |
| **L17** | Appointment strip | Pill `w-[864px]`; `px-[8px] py-[4px]`; `gap-[16px]`; radius **8px** | Bg `#e5f1f8`; text **13px** `#3a3a3a` | — |
| **L18** | Specs table | Card `w-[864px]`; `px-[48px] py-[32px]`; radius **16px**; border `#dadada` | Label col **13px** `#7a7d87` right; value semibold `#3a3a3a`; divider `#D6D6D6` | Download CTAs tertiary **12px** — static/decorative (I18) |
| **L19** | FAQ accordion | `w-[864px]` white; headers **24px** semibold; one `Description` body **13px** | Chevron `#5C5C5C` | **B1 static** — no Accordion kit until PO |
| **L20** | GP promo card | `w-[864px]`; `p-[16px]`; radius **24px**; mint `#c6e5e1` | Copy **13px** semibold; CTA `#e0fbf8` / border `#d4fef8` | Static “Find out more” — decorative cursor in Make |

---

## Typical DS state matrix (§0a) — PDP controls

| Control | default | hover | focus / active | disabled | FAIL class |
|---------|---------|-------|----------------|----------|------------|
| **Book now** (primary) | `#012169` fill, white 16px | `#01318f`, shadow, lift | `#011a5c` pressed | — if Make N/A | Mint wash on primary; LEGACY steal |
| **Check availability** (secondary) | White + `#afccca` border; icon `#5c5c5c` | Bg `#c6e5e1`, icon `#01318f` | Pressed per chrome | — | Flat secondary; wrong icon color |
| **Wishlist heart** (empty) | Glyph `#AFCCCA` | Circular `#eef8f7` wash; path `#01318f` | `#c6e5e1` active wash | — | **Fuchsia on empty** |
| **Wishlist heart** (filled) | Fuchsia fill | Deepen `#c2186e` | — | — | Navy-only when filled |
| **Share icon** | Mute glyph | Same icon-hit language as heart empty | — | — | Invent box chrome |
| **Myself / Someone else** | Active `#c6e5e1`; inactive white + inset border | Inactive → `#eef8f7` | Click switches `data-toggle-active` | — | Wrong active color; missing hover |
| **Booster checkbox** | Unchecked white `#c3c3c3` border | Unchecked hover `#c6e5e1` | Checked `#afccca` | — | Row background tint; dead box |
| **Quick Sign In / Create Account** | `#012169` underline links | Link hover per `.uxds-link` / Make | Opens `modal=login` | Hidden when logged in | — |
| **Download / GP CTAs** | Tertiary compact | Per icon-hit / secondary patterns where bordered | Static — no wire | — | Invent navigation |

**No SearchField on PDP** — §7b N/A; Quinn still MCP-hovers toggle + checkbox + primary + secondary + heart.

---

## FAIL classes to watch on Finn scaffold (Arch / Quinn)

Priority order from PLP retro + LESSONS — any one = ship fail until fixed:

| Class | Symptom | Gate |
|-------|---------|------|
| **Invent loader** | Skeleton/spinner/“Updating…” on PDP | LE1–LE3 **N/A** — visual absence required |
| **Advantage miss** | L13 mint bar missing under RTB card | Whole-component fail (PLP L5 lesson) |
| **Empty-heart fuchsia** | Fuchsia hover when wishlist empty | I12 — navy tertiary only when empty |
| **Dead checkbox** | No mint `#c6e5e1` on unchecked box hover | Uma §5 + register I6 |
| **Primary mint wash** | Book now gets secondary hover language | I14 — navy lift only |
| **Flat secondary** | Check availability no mint hover | I15 |
| **Toggle hover skip** | Inactive tab no `#eef8f7` | I2 + child-8 L278–280 |
| **Booster row tint** | Mint wash on checkbox **row** | child-8 L1292–1297 — box only |
| **50/50 drift** | Image not 1:1 or wrong gap | L5 + child-8 L1247–1270 |
| **Price confusion** | List row changes with booster | L8 static £75; Book now label I9 only |
| **Invent accordion** | Interactive expand before PO | B1 — static layout only |
| **LEGACY growth** | New rules in `globals-screens` for React | PDP_REACT brief — screen CSS only |
| **Make leak** | Make child-8 visible under React mount | W1 retire pattern |
| **Rest-state PROVEN** | Green tests without hover matrix | Uma + Quinn MCP required |

---

## Prove matrix (Quinn — after mount)

Cite steps in team check; overlay visible entire probe; scroll-into-view before interact ([RECORDING.md](../../../shell/RECORDING.md)).

- [ ] `screen=pdp` mount; Make leak = 0
- [ ] PLP → PDP entry
- [ ] Book now logged out → `modal=login`; logged in → `book-step-1`
- [ ] Check availability → `modal=choose-pharmacy`
- [ ] Booster off → Book now **£75**; on → **£150** (default on)
- [ ] Checkbox unchecked mint hover (computed)
- [ ] Heart empty hover navy path; filled fuchsia
- [ ] Toggle click + inactive hover
- [ ] Advantage bar visible
- [ ] Below-fold L14–L20 scroll reveal before interact
- [ ] **No** invented loader
- [ ] `check:page-final-pass` green

---

## team check report lines (Uma — kickoff placeholder)

```
Uma (UI/UX): fidelity checklist — PENDING (kickoff stamp only)
Uma (UI/UX): loading states — N/A (no Make loader; invent = FAIL)
Uma (UI/UX): checkbox/radio hover — PENDING (P0 target: mint #c6e5e1 unchecked)
Uma (UI/UX): typical DS checks (state matrix) — PENDING (Book now / Check availability / heart / toggle)
```

**Knowledge used:** UMA_FIDELITY_NOTES §0/§0a + PAGE_FINAL_PASS + LESSONS invent-vs-Make / DS hover / wrong preloader / Advantage miss + TEAM_RETRO Uma Keep + PDP_MAKE_PARITY_REGISTER L1–L20 / LE / I / B1.

---

## Related

- [PDP_REACT.md](../features/PDP_REACT.md) · [PDP_MAKE_PARITY_REGISTER.md](../features/PDP_MAKE_PARITY_REGISTER.md)  
- [TEAM_RETRO_2026-07-19_PLP.md](../../../product/TEAM_RETRO_2026-07-19_PLP.md) · [LESSONS_LEARNED.md](../../../product/LESSONS_LEARNED.md)  
- PLP HARD-GREEN audit: [FE_AUDIT_PLP_PAGE_FINAL_PASS_2026-07-19.md](./FE_AUDIT_PLP_PAGE_FINAL_PASS_2026-07-19.md)
