# Uma (UI/UX) — Make → React fidelity checklist

**Owner:** Uma (UI/UX)  
**Status:** Locked (PO mandate, 2026-07-19) — mandatory before any screen **PROVEN**  
**Refs:** [FE_UI_UX_AUDIT.md](./FE_UI_UX_AUDIT.md) · [VISUAL_FIDELITY.md](./VISUAL_FIDELITY.md) · [FE_STANDARDS.md](./FE_STANDARDS.md) · [DS_STRICTNESS.md](./DS_STRICTNESS.md) · [LESSONS_LEARNED.md](./LESSONS_LEARNED.md)

**Hard rule:** A screen is **not PROVEN** until this checklist is explicitly pass/fail in the audit + **team check**, with MCP matrix evidence cited, and `PARITY_PROVEN.json` updated (`npm run check:parity-proven`). Green Vitest/build alone = BAD.

**Programmatic contracts:** Typical Make→React misses are also gated by `npm run check:parity-ratchets` ([PARITY_RATCHETS.md](./PARITY_RATCHETS.md)) — search icons, **search-field-states** (kit `:hover`/`:focus-within`), bookmark copy, empty-heart fuchsia, Advantage bar, Book now primary, loader dup, make-retired. Uma checklist still required for pixels/hover; ratchets catch the classes we keep burning. DS state checks = rule of thumb for every interactive kit.

**Bea (BA)** must list every Make band/component in the parity register **before** Finn codes — including **loading / empty / updating** states as **P0** rows when Make has them. Missing whole components (see Advantage Card bar on PLP) = ship fail.

**Quinn (QA)** must click-hover every interactive control and **cannot PASS** if the register still has unchecked P0s.

**Uma (UI/UX) explicit sign-off (every migrated screen):** must report PASS/FAIL on **(a) loading / empty / updating states**, **(b) checkbox / radio hover**, and **(c) typical DS state matrix** (fields/buttons) — not optional, not “assumed from prior ship”.

---

## Mandatory before PROVEN

Run against Make (or Make frame export) **side-by-side** with React localhost.

### 0a. Typical DS state matrix (RULE OF THUMB — every field / button)

**Hard rule:** Before any screen is **PROVEN**, Uma walks the **full interactive state matrix** for every field and button on that screen — against **UXDS kit CSS** + **Make**, not rest-state only. Rest-state green + missing hover = **FAIL** (PO: SearchField had no hover).

For **each** field (`SearchField` / text input) and **each** button (primary / secondary / tertiary / icon-only):

| State | Must verify |
|-------|-------------|
| **default** | Border / fill / type / icon color match kit + Make |
| **hover** | Ring / wash / underline per DS — **fields:** control inset ring via `--uxds-border-border-focus` (Boots → navy); **never** a box on the magnifier |
| **focus** / focus-within | Same ring language as Make; keyboard visible |
| **active** / pressed | CTA pressed fill when Make has it |
| **filled** | Value + clear affordance; icon position unchanged |
| **disabled** | Dim / non-interactive; no hover flash |
| **error** | Only if Make/DS shows error on that control |
| **icon positions** | Magnifier start\|end per wire; clear X count = 1; icon = bare glyph (no border/box-shadow) |

- [ ] Every `SearchField` / text field: default → hover → focus → filled → clear → disabled (error if present)
- [ ] Every button / CTA: default → hover → active → disabled
- [ ] Icon positions stamped and correct (`data-studio-search-icon-pos`, tertiary icon language)
- [ ] Quinn MCP-hovers ≥1 SearchField (or every search when few) — cite step in team check
- [ ] **FAIL class:** flat dead field/button with no DS hover = ship fail
- [ ] **FAIL class:** invent hover chrome not in UXDS kit / Make = ship fail
- [ ] **FAIL class:** hover/focus ring painted on search **icon** instead of field control = ship fail

**Why this is mandatory:** Agents keep shipping rest-state-only kits (focus without hover, icon without clear, CTA without pressed). Green Vitest does not exercise pointer states. Uma + Quinn must Nazi-hover the matrix before PROVEN — see [TEAM.md](./TEAM.md) § typical DS checks · [COMMAND_DOCTRINE.md](./COMMAND_DOCTRINE.md).

### 0b. Section vertical rhythm (MANDATORY MCP/browser gate — RTB / purchase stacks)

**Hard rule (PO 2026-07-19):** Before claiming **fidelity IN PROGRESS** (and before §0a / PROVEN) on any PDP / RTB / purchase column, Uma must **prove section vertical rhythm** in the browser — not rest-state colors/glyphs alone. Quinn MCP interaction PASS does **not** waive this.

**Measure (Chrome DevTools MCP `evaluate_script` or equivalent):**

1. Select the Make RTB column (`component.pdp.rtb` / register L6) and the React column (`.pdp__rtb-col`).
2. For each adjacent pair in Make stack order — **title block → list price → recipient/CTA row → body blurb → booster → Book CTA row** — record:
   - computed parent `gap` (Make `gap-[32px]` on ComponentPdpRtb)
   - `getBoundingClientRect()` distance between sibling bottoms/tops
   - block padding; no surprise `aspect-ratio` / `flex-grow` on text stacks
3. Screenshot the RTB column (first viewport) as evidence in the screen stamp.
4. **FAIL class:** cramped hierarchy; parent gap ≠ Make; LEGACY Make CSS (`nth-child` + `data-name`) restyling React mounts (e.g. forcing `gap: 48px` on the column or `aspect-ratio: 1/1` on the title block).
5. **FAIL class:** claiming fidelity IN PROGRESS / PARTIAL layout PASS without citing measured gaps.

- [ ] Parent column `gap` matches Make (PDP RTB = **32px**)
- [ ] price → recipient gap measured = Make
- [ ] recipient → body gap measured = Make
- [ ] body → booster gap measured = Make
- [ ] booster → CTA gap measured = Make
- [ ] Title/service stack is content-sized (not stretched to media 1:1)
- [ ] Screenshot + numbers in `UMA_FIDELITY_<SCREEN>_*.md`

### 0. Loading / empty / updating states (FIRST-CLASS — capture before coding)

**Hard rule:** Before Finn codes any list/filter/search screen, Uma + Bea must capture the **exact Make loading scenario** (skeleton tiles vs spinner overlay vs dimmed list vs shimmer vs text-only). Write it into the parity register as a **P0** row with layout notes.

- [ ] Make loading scenario documented (mechanism + copy + where it sits in the layout)
- [ ] Filter/search/pagination change shows that same scenario — not a invented substitute
- [ ] Empty state matches Make when zero results
- [ ] **Exactly one** “Updating…” (or equivalent) treatment — spinner overlay label **or** count line, **not both** (duplicate = FAIL)
- [ ] No layout jump from host collapse — lock band height while tiles hide if Make feels stable
- [ ] **FAIL class:** blank listing + lone “Updating results…” **without** spinner/overlay/skeleton = ship fail
- [ ] **FAIL class:** invented duplicate loader copy / orange pulsed count-line not matching Make = ship fail

**Screenshot notes required:** loading frame (spinner visible in-band), then results return / stagger.

### 1. Page chrome / atmosphere

- [ ] Page background fill / pattern / opacity matches Make
- [ ] Shadows / lifts on hero, cards, listing wrappers match Make (no invent, no omit)
- [ ] Wrappers / shells / radii match Make (no anonymous card borders)
- [ ] Preloaders / skeleton / listing load sims present **and match Make’s mechanism** (see §0)

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

- [ ] Hearts / bookmarks / wishlist: **exact Make empty vs filled** — do **not** invent fuchsia on **empty** hover if Make uses tertiary navy
- [ ] **Bookmark label states (PO copy):** not bookmarked → **"Add to Bookmarks"** (empty heart hover = Make tertiary navy, not invented fuchsia); bookmarked → default **"In your Bookmarks"**, hover **"Remove from Bookmarks"**
- [ ] Filled/active + click-optimistic only where Make does; empty hover follows Make tertiary/icon rules
- [ ] Share / eye / other icon-only hits: circular wash or tertiary rules per FE standards
- [ ] No laggy click feedback; **FAIL** if invented hover chrome not in Make CSS
- [ ] **Forbidden:** invent hover/loading chrome not in Make ([LESSONS_LEARNED.md](./LESSONS_LEARNED.md))

### 5. Checkbox / radio hover (Make parity — mandatory sign-off)

- [ ] Unchecked checkbox/radio shows Make hover wash (Boots: mint `#c6e5e1` fill + border) on row or control hover
- [ ] Checked state stays Make checked colors on hover (no flash to white/grey)
- [ ] Quinn can see hover feedback in localhost / MCP prove
- [ ] **FAIL class:** dead checkboxes with no hover = ship fail

### 6. Borders / radii / shadows

- [ ] Borders only if Make has them (no invent tile borders)
- [ ] Radii / shadows match Make; no DS “pretty” upgrades

### 7. Button types — icon+text vs text-only

- [ ] Icon+text pattern where Make/DS uses tertiary compact (e.g. Reset Filters + trash)
- [ ] Text-only links only where Make is text-only (`.uxds-link`)
- [ ] Icon+text nowrap ([FE_STANDARDS.md](./FE_STANDARDS.md))

### 7b. Search fields (magnifier affordance + state matrix)

- [ ] Every search input uses UXDS `SearchField` (or stamps same markers) — not a bespoke bare input
- [ ] Magnifier side matches PO/Make wire — PLP / Availability / Book Step 1 = **RIGHT** (`data-studio-search-icon-pos="end"`)
- [ ] Magnifier is a **bare glyph** — no box border / inset ring on the icon (Make paints the ring on the field’s absolute `[aria-hidden].absolute` overlay only; UXDS `.uxds-search-field__control` owns hover/focus)
- [ ] **Hover + focus** show the DS inset ring on the **control** (`--uxds-border-border-focus`, Boots navy) — §0a matrix; dead flat field = FAIL
- [ ] **One** clear control only (`data-studio-search-clear`) — never `type="search"` native X + custom X
- [ ] Marker `data-studio-search-icon="true"` present (ratchet #1)
- [ ] Quinn MCP `plp-search-icons` + SearchField hover prove (or screen equivalent) PASS
- [ ] **FAIL class:** navy/grey box around the search icon from LEGACY `Text Field > [aria-hidden]` hover stealing the magnifier = ship fail
- [ ] **FAIL class:** focus-only kit with no `:hover` on the control = ship fail

### 7c. Filter lists (View all + counters)

- [ ] Disease/country lists cap at **10** (`PLP_FILTER_LIST_MAX`) + **View all** link
- [ ] Filled field → View all **resets** the search (wire port)
- [ ] Filter options show Make-like **counters** (`data-studio-plp-option-count`)
- [ ] No invented filter accordion horizontal separators

### 8. Side-by-side screenshot pass

- [ ] First viewport Make vs React
- [ ] Mid-page bands (filters, listing, promos)
- [ ] **Loading state** photographed or MCP-proved (spinner/overlay in correct band)
- [ ] Hover states photographed or MCP-proved for every P0 control **including checkbox/radio**

---

## team check report line (Uma)

When **team check** runs, Uma must report:

`Uma (UI/UX): fidelity checklist — PASS | FAIL (list failed items)`  
`Uma (UI/UX): loading states — PASS | FAIL`  
`Uma (UI/UX): checkbox/radio hover — PASS | FAIL`  
`Uma (UI/UX): typical DS checks (state matrix) — PASS | FAIL`

Ship cannot be “done” if Uma reports **FAIL** on any of these lines.

---

## Screen stamps (per-page kickoff / audit)

Kickoff fidelity targets live under `docs/projects/<id>/audits/UMA_FIDELITY_<SCREEN>_*.md` — **not PROVEN** until full mount + MCP matrix.

| Screen | Stamp | Status |
|--------|-------|--------|
| **PDP** (`pdp`) | [../projects/boots-pharmacy/audits/UMA_FIDELITY_PDP_2026-07-19.md](../projects/boots-pharmacy/audits/UMA_FIDELITY_PDP_2026-07-19.md) | **IN PROGRESS** — §0a **PASS** + §0b **PASS** (tip `87c0fc8` / `cbbd97d` / v0.0.24); **not PROVEN** (P2 share flip + B1 static accordion) |
