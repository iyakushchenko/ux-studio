# Book Step 1 — Legacy vs React design delta

**Status:** Audit + restore (2026-07-19)  
**Source of truth:** Legacy Frame child **7** (`Step 4` / `Body5`) **plus** live wire CSS in `globals-screens.css` / `globals-chrome.css` (computed look).  
**React:** `src/projects/boots-pharmacy/screens/book-step-1/`  
**Rule:** Visual fidelity > inventing UXDS-looking backgrounds. See [VISUAL_FIDELITY.md](../../product/VISUAL_FIDELITY.md) §1.2.

---

## How this audit was done

1. Measured Legacy `Body5` in `frame/index.tsx` (white base + `imgBody` @ `opacity-31`, card `758px`, progress `560px`, etc.).
2. Measured **live** overrides for `nth-child(7)` (progress/card/help → **863px**; progress labels **16px** / active **navy bold**; booster checked `#afccca` + mark `#305854`).
3. Diffed against React `BookStep1LocationScreen` + `book-step-1-location.css` before restore.
4. Restored gaps; remaining intentional rows are marked below.

---

## Page template / max-width / crumb alignment

Boots content grid (header logo + `Footer`):

| Layer | Legacy / Studio guideline | React (after fix) |
|-------|-------------------------|-------------------|
| Outer shell | max-width **1440px**, centered; **padding-left/right 64px** | `.book-step-1__shell` same |
| Inner column | max-width **1312px**, `width: 100%`, centered — **no side pad on inner** | `.book-step-1__shell-inner` same |
| Crumbs | full-bleed white band → shell → inner; Home starts on logo left edge | Same structure |
| Main | Body `p-[64px]` on full width (artboard); live Studio uses same 64/1312 column | Shell 64px sides + main `padding: 64px 0` (vertical only) |

**Bug that shifted crumbs inward:** React put `max-width: 1312px` **and** `padding: 16px 64px` on the **same** element → content started 64px inside the 1312 box (past the logo). Fixed by splitting shell vs inner like `.proto-footer__shell`.

---

## Parity table

| Element | Legacy (value/source) | React (current after fix) | Status | Fix plan |
|---------|---------------------|---------------------------|--------|----------|
| **Page template / content column** | Header: `px-[64px]` → `max-w-[1312px]` container; Footer: shell 1440+64 → inner 1312 | `.book-step-1__shell` / `__shell-inner` | **match** (was **gap** — pad inside 1312) | Shared logo column |
| **Page body background — solid** | `Body5`: absolute `bg-white` inset-0 under content | `.book-step-1__body-fill-solid` `#ffffff` | **match** | Kept |
| **Page body background — decorative fill** | `Body5`: `imgBody` (`6d60145a….png`) absolute, `object-bottom`, `opacity: 0.31`, full size over white | Same asset + `.book-step-1__body-fill-img` `opacity: 0.31`, `object-position: bottom` | **match** (was **gap** — solid white only) | Restored fill layer under `.book-step-1__main` |
| **Crumbs band fill** | `module.breadcrumbs` `bg-white`, no border | `.book-step-1__crumbs` `#ffffff`, no border | **match** (was UXDS neutral + `#d6d6d6` bottom border) | Removed border; solid white |
| **Crumbs horizontal inset** | Shell pad **64px**; inner **1312** (logo edge) | Same via `.book-step-1__shell` | **match** | See page template section |
| **Crumbs vertical pad** | `py-[16px]` | `padding-top/bottom: 16px` on band | **match** | — |
| **Crumbs Home link** | `#305854`, underline, 10/12 | `#305854`, underline, 10/12 | **match** (was navy `#012169` fallback) | Teal link restored |
| **Crumbs delimiter** | Rotated 1.257×14.871 `#c3c3c3` bar | Text `/` in `#c3c3c3` | **intentional** | Text sep is readable; bar glyph not required for PO fill complaint |
| **Crumbs current** | Wire rewrites last label → `Book Appointment`, `#7a7d87` | `Book Appointment`, `#7a7d87` | **match** | — |
| **Page header (navy mega menu)** | Legacy `boots-pharmacy.module.header` `#012169` | Proto sticky header mount (Legacy header hidden) | **intentional** | Shared Studio chrome; not part of React body rebuild |
| **Page footer** | Legacy `#2e2e2e` module.footer | `Footer` mount after Legacy footer retired | **intentional** | Shared Studio chrome |
| **Main column padding / gap** | Body `p-[64px]`, `gap-[56px]` | Shell 64 sides + main `64px 0` vertical; `gap: 56px` | **match** | No double side pad |
| **H1 “Book Appointment”** | Open Sans Bold 39/48 `#3a3a3a` center | Same | **match** | — |
| **Progress width** | Live CSS: **863px** (`globals-screens` !important; Figma export was 560) | `width: 863px` | **match** (was React 560; only globals patched partially) | Explicit 863 in screen CSS |
| **Progress label size/weight/color** | Live: 16px / 1.4; active **700** `#012169`; inactive 400 `#3a3a3a` | Same | **match** (was 10px / 600 grey) | Matched live computed |
| **Progress bars** | 8px flat; active `#c6e5e1`; inactive `#ffffff`; no radius/border | Same | **match** | — |
| **Form card width** | Live: **863px** (Figma `758px` overridden) | `min(863px, 100%)` | **match** (was 758) | Widened to live Legacy |
| **Form card chrome** | White, `rounded-[24px]`, `p-[64px]`, `gap-[72px]`, shadow `0 5px 9.75px rgba(0,0,0,0.05)` | Same | **match** | — |
| **Vaccine / Recipient pills** | `#f5f5f5`, radius 24, p 16; label 13/24 regular; value 13/24 semibold; Change tertiary | Same | **match** | — |
| **Change / Change location CTA** | Transparent; `#5c5c5c` 12/16 semibold; icon `#AFCCCA` → hover label black / icon `#012169`; no wash; single line | Same + `nowrap` / `inline-flex` | **match** | FE_STANDARDS §1 |
| **Section title “Location”** | 31/32 semibold `#3a3a3a` center | Same | **match** | — |
| **Field label “Location”** | Legacy `Label` above Text Field, 13/24, tracking 0.1px | `.book-step-1__field-label` | **match** (was missing) | Restored |
| **Search + near-me layout** | `Frame209` flex-wrap, gap 16, field flex-1 + near-me beside | Flex-wrap, gap 16, field flex-1 + near-me | **match** (was stacked column) | Restored side-by-side |
| **Search field chrome** | Pill 360, h 48, border `#c3c3c3`, white fill; wire placeholder grey | Same + inset navy ring hover/focus (chrome pattern) | **match** | — |
| **Search placeholder copy** | Wire sets `Search for City, Postcode, Location...` `#5c5c5c` / 400 (Figma showed “London”) | Same placeholder | **match** | Follows live wire, not static Figma string |
| **Search icon** | Body5 glyph `#012169`, 24px slot | Inline `SearchGlyph` `#012169` | **match** (was `#AFCCCA` asset) | Navy glyph |
| **Near-me control** | Legacy / Availability tertiary beside search: compact icon+label, map-pin 16×16, `#AFCCCA`→navy hover, label `#5c5c5c`→black, nowrap | Shared `NearMeCta` + `.proto-near-me-cta` (same as Availability search-row); slot `h72/pt24` beside field | **match** (was FilterChip fork) | FE_STANDARDS §1.2 — same string/role → one component |
| **Chosen store tile** | `.proto-chosen-tile`: border `#f2f2f2`, radius 8, map + store row, Change location tertiary | `.book-step-1__chosen` same language | **match** | — |
| **Booster checkbox unchecked** | Live: white / border `#c3c3c3` (Legacy path) | Same | **match** | — |
| **Booster checkbox hover** | Fill `#c6e5e1` | Same | **match** | — |
| **Booster checkbox checked** | Live child-7: fill `#afccca`, mark `#305854`, label weight 700 | Same | **match** | Aligns to computed Legacy, not raw Figma `#c6e5e1`/`#3A3A3A` |
| **Booster interactions** | Toggle `includeBoosterDose`; Continue gating elsewhere | React-owned input + props (141234b+) | **match** | Do not regress |
| **Learn more** | Legacy: body copy always visible + inline “Learn More” underline `#012169` | UXDS `Disclosure` + `.uxds-link` (closed by default) | **intentional** | Shared text-link baseline; kit disclosure vs always-open Legacy copy |
| **Continue CTA** | `#012169` pill 360, min-w 230, h 48, 16/16 semibold, tracking -0.32; pt 24 wrap | Same + Legacy hover/active navy darken | **match** | — |
| **Help / phone block** | 13/24 center; phone link `#305854` (Legacy) | `.uxds-link` navy `#012169` (no underline rest → underline hover) | **intentional** | Regular text-link family (FE_STANDARDS §2); crumb stays teal |
| **Figma cursor affordance** | Hidden via CSS on child 7 | Not rendered in React | **intentional** | Demo cursor not needed |
| **Decorative bands outside body** | None on Step 4 beyond body fill + white crumbs | Same | **match** | — |

---

## Top gaps found (pre-fix) — especially backgrounds + template

1. **Lost body decorative fill image** (`imgBody` @ 0.31) — page read as flat white.
2. **Crumbs / content column shifted inward** — `1312 + pad 64` on one box vs logo `64 → 1312`.
3. **Near-me (and similar) icon+text wrapped** — label under icon.
4. Card stuck at Figma **758px** vs live Legacy **863px**.
5. Progress stuck at Figma **560px / 10px grey** vs live **863px / 16px navy active**.
6. Search + near-me **stacked** vs Legacy **side-by-side**.
7. Missing field label **“Location”** above search.
8. Search / near-me icons **mint `#AFCCCA`** vs Legacy **navy `#012169`**.
9. Crumbs **bottom border** + Home **navy** vs Legacy white band / teal Home.
10. Checkbox / fill tokens drifted from live Legacy path.

---

## Fixed vs still open

| Item | State |
|------|--------|
| Body white + decorative fill @ 0.31 | **Fixed** |
| Content shell 1440 / 64 / 1312 (crumbs + main vs logo) | **Fixed** |
| Near-me + Change CTAs `nowrap` | **Fixed** |
| Near-me = shared `NearMeCta` (Availability tertiary SOT) | **Fixed** (page ↔ popup unified) |
| Card / progress / help 863px; progress type live | **Fixed** |
| Location field label + side-by-side search/near-me | **Fixed** |
| Navy search / near-me glyphs | **Fixed** |
| Crumbs white, teal Home, no border | **Fixed** |
| Checkbox / tertiary / Continue hover language | **Fixed** (aligned to live Legacy) |
| Breadcrumb delimiter bar glyph | **Open (intentional)** — text `/` |
| Learn more always-visible inline paragraph | **Open (intentional)** — Disclosure kit |
| Proto header/footer vs Legacy absolute chrome | **Open (intentional)** — Studio mounts |

---

## Related

- [FE_STANDARDS.md](../../product/FE_STANDARDS.md)  
- [VISUAL_FIDELITY.md](../../product/VISUAL_FIDELITY.md) §1.2 design-delta checklist  
- [BOOTS_REACT_SCREEN_PILOT.md](./BOOTS_REACT_SCREEN_PILOT.md)  
- [INTERACTION_FIDELITY.md](../../product/INTERACTION_FIDELITY.md)
