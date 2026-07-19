# PDP Make → React parity register

**Project:** `boots-pharmacy`  
**Callsigns:** Bea (BA) owns register truth · Quinn (QA) owns prove · Finn/Uma restore gaps  
**Updated:** 2026-07-19 (PO polish: full FAQ bodies + TertiaryCta soft Find out more + Accordion kit motion/muted chevrons; Quinn MCP **PASS** @ `76e2433` / v0.0.30; Arch HARD-GREEN pending)  
**Make source:** Frame child **8** (`PDP. Vaccine Details Page` / `BTS-PHRM.Product - Deal Details Page`, `screenId: "pdp"`) + `globals-screens` child-8 rules + `BootsPharmacyProjectView` wire + `frame/index.tsx`  
**React target:** `src/projects/boots-pharmacy/screens/pdp/*`  
**Refs:** [PDP_REACT.md](./PDP_REACT.md) · [PLP_MAKE_PARITY_REGISTER.md](./PLP_MAKE_PARITY_REGISTER.md) (format) · [URL.md](../../../shell/URL.md) (modal ids)  
**Uma checklist:** [../../../product/UMA_FIDELITY_NOTES.md](../../../product/UMA_FIDELITY_NOTES.md) · **Uma stamp:** [../audits/UMA_FIDELITY_PDP_2026-07-19.md](../audits/UMA_FIDELITY_PDP_2026-07-19.md) (**re-prove after polish**)

**Status legend:** Present · Partial · Missing · Fixed · N/A

**Make column:** inventory truth from Frame + wire + LEGACY CSS (2026-07-19).  
**React column:** L1–L20 mounted; FAQ = UXDS Accordion **6/6 bodies** (Make + Bea-sourced); GP CTA = `TertiaryCta soft` (no `.pdp__pill--mint`); Accordion kit owns expand/collapse motion + muted closed chevrons. Quinn MCP **PASS**; Arch Final Pass HARD-GREEN pending.

**Bea rule:** Every band before Finn codes — including loading/empty/updating as **P0** when Make has them. No invented bands.

---

## Layout (every Make band)

| # | Make behavior | Make | React status | Evidence |
|---|---------------|------|--------------|----------|
| L1 | **1440 / 64 / 1312** content column — page `w-[1440px]`, body padding `64px` | **Present** | **Present** | `pdp__shell` max 1440 / pad 64 |
| L2 | **Page bg fill** — white base + decorative PNG `@ opacity 0.41` under RTB band (`Body6`) | **Present** | **Present** | `pdp__body-fill` |
| L3 | **Breadcrumbs** — Home → Health Services → Vaccination → Chickenpox (current crumb plain) | **Present** | **Present** | `pdp__crumbs` |
| L4 | **RTB card stack** — white card + drop shadow `0px 5px 9.75px rgba(0,108,185,0.05)`; top radius 16px | **Present** | **Present** | `pdp__rtb-card` |
| L5 | **Hero gallery** — 50/50 row, image wrapper **1:1** aspect, `object-fit: cover`, 48px inner gap | **Present** | **Present** | `pdp__media` / `pdp__product-image` |
| L6 | **RTB column** (`component.pdp.rtb`) — white fill, 32px vertical gaps between blocks | **Present** | **Present** | `pdp__rtb-col` |
| L7 | **Product title + service ID** — “Chickenpox” 24px bold + “Service Identifier: BTS-PHM-VAR-00075” 13px grey | **Present** | **Present** | `pdp__title-block` |
| L8 | **List price row** — `£75.00` 25px semibold + “Single dose price” 13px grey | **Present** | **Present** | `pdp__price-row` |
| L9 | **Recipient toggle row** — Myself / Someone else pills + login disclaimer block (right of toggle) | **Present** | **Present** | `pdp__recipient-row` |
| L10 | **Service blurb** — eligibility / two-dose copy paragraph (13px) | **Present** | **Present** | `pdp__blurb` |
| L11 | **Booster checkbox band** — label + helper copy; section bg forced white (no mint wash on row) | **Present** | **Present** | `pdp__booster-band` |
| L12 | **CTA row** — Book now (navy, min-width 230px, 48px) + Check availability (secondary) + wishlist + share icon hits | **Present** | **Present** | `pdp__cta-row` |
| L13 | **Advantage Card promo bar** — mint `#c6e5e1` “Collect 3 points for every £1…” below RTB card, bottom radius 16px | **Present** | **Present** | `pdp__advantage` |
| L14 | **Below-fold body** (`Body7`) — white band, `py-[96px]`, `gap-[72px]` between major sections | **Present** | **Present** | React `pdp__below` (Make Body7 retired via mount) |
| L15 | **Content hero** — centered “Chickenpox” 39px + teal accent bar 14×3px | **Present** | **Present** | `pdp__content-hero` |
| L16 | **Intro copy** — two paragraphs, 864px max text width | **Present** | **Present** | `PDP_INTRO_PARAGRAPHS` / `pdp__intro` |
| L17 | **Appointment time strip** — `#e5f1f8` pill “Typical appointment takes around 15 minutes” + icon | **Present** | **Present** | `pdp__appt-strip` |
| L18 | **Laptop specs table** — bordered white card 864px; Vaccine / Course / Administration / Eligibility / Price / Availability rows + divider + download CTAs | **Present** | **Present** | `PDP_SPECS_ROWS` / `pdp__specs` + live download buttons |
| L19 | **FAQ accordion band** (`component.pdp.accordion`) — six `component.gse.accordion` headers; default open “Who is at risk?” body | **Present** (static Figma) | **Present** (interactive) | UXDS `Accordion` + `PDP_ACCORDION_PANELS` — PO go |
| L20 | **GP online promo card** — mint `#c6e5e1` rounded 24px “Book your doctor appointment online…” + CTA | **Present** | **Present** | `pdp__gp-promo` + live Find out more button |
| L21 | **Header / footer chrome** — `boots-pharmacy.module.header` + `boots-pharmacy.module.footer` (engine-mounted, not page-owned) | **N/A** (engine) | **N/A** | Frame child 8 includes them; React page owns `body` bands only per PAGE_BUILD_CONTRACT |

### L19 — Accordion (PO interactive)

**Source:** `ComponentPdpAccordion` in `frame/index.tsx` L7301–7320.  
**React:** shared UXDS Accordion kit (`type="single"`, default open `who-is-at-risk`) — same pattern as PLP filters.

| Panel | Make source (searched) | React |
|-------|------------------------|-------|
| How can Boots help? | Accordion `Description` **absent**; **RTB service blurb** (same PDP Make page) | Body = RTB blurb + short booking cue (`source: make+bea`) |
| Who is at risk? | Accordion `Description` paragraph | Default open + Make body + brief context (`make+bea`) |
| What happens at the appointment? | Accordion `Description` **absent**; **appt strip** + specs **Administration** | Body = strip + administration + visit flow (`make+bea`) |
| Can I get vaccinated on the NHS? | Header only — no Description | **Bea-sourced** expandable body (Boots-plausible; no wild NHS claims) |
| What if I already have chickenpox? | Header only | **Bea-sourced** expandable body |
| How we use your personal data | Header only | **Bea-sourced** expandable body |

**Search note (Bea):** Make export still has only one accordion `Description`. PO (2026-07-19) asked for real bodies on residual panels — Bea wrote concise Boots-plausible copy marked `source: "bea"` in `pdpContract.ts`. Live Boots.com FAQ blocked (Incapsula); not used as copy source.

**I18 download CTAs:** Make Frame126 shows Guide at rest + Leaflet with `#c7e4ff` border + `.utility / cursor` = **Figma hover mock** (I20), not a second rest style. React: both `.pdp__pill` tertiary; GP “Find out more” = shared `TertiaryCta soft` (`.studio-tertiary-cta--soft`, DEV-20260719-tertiary-soft) — no page `.pdp__pill--mint`.

**Accordion kit:** UXDS Accordion owns CSS `grid-template-rows` 0fr↔1fr expand/collapse (no height:auto thrash) + muted closed / brand-strong open chevron (`AccordionChevron`). PDP keeps layout/title CSS only. Focus ring still none (Make parity).

---

## Loading / empty / updating (P0 when Make has them)

| # | Make behavior | Make | React status | Evidence |
|---|---------------|------|--------------|----------|
| LE1 | **Page load / refresh loader** — none; static PDP paints immediately | **N/A** | **N/A** | No `proto-pdp-*` loader, no wire delay on child 8 |
| LE2 | **Empty state** — not a list/filter surface | **N/A** | **N/A** | — |
| LE3 | **Updating overlay** (spinner / skeleton / “Updating…”) — none on PDP | **N/A** | **N/A** | Contrast PLP L4 — PDP has no listing refresh |
| LE4 | **Booster toggle → price update** — **instant** DOM text swap on Book now price span (not a loading scenario) | **Present** | **Missing** | Wire L4220–4264: `includeBoosterDose` → `PDP_PRICE_WITH_BOOSTER` (£150) / `PDP_PRICE_WITHOUT_BOOSTER` (£75); default `DEFAULT_INCLUDE_BOOSTER_DOSE = true` |

**Bea / Uma gate:** LE1–LE3 documented as **N/A** with mechanism note (static page). **Forbidden:** invent PDP skeleton/spinner. LE4 is interaction sync, not a loader band.

---

## Interactions

| # | Make behavior | Make | React status | Evidence |
|---|---------------|------|--------------|----------|
| I1 | **Myself / Someone else toggle** — visual tab switch; default **Myself** active on mount (`data-toggle-active`) | **Present** | **Missing** | Wire L4267–4313; CSS L239–280 |
| I2 | **Toggle hover** — inactive tab `#eef8f7`; active mint `#c6e5e1`; inset borders per half | **Present** | **Missing** | `globals-screens` L278–280; font-weight 400 inactive / 600 active (QV mirror L1589–1596) |
| I3 | **Quick Sign In / Create Boots Account** → Login popup (`signin` / `create` tab) | **Present** | **Missing** | Wire L2291–2340 |
| I4 | **Login disclaimer block** hidden when header logged-in | **Present** | **Missing** | Wire L2318–2323 |
| I5 | **Booster checkbox** toggle — shared `includeBoosterDose` state (default **checked**) | **Present** | **Missing** | `handleProtoInputClick` + dedicated wire L4124–4188; `PDP_CHECKBOX_LABEL` from `orderPricing.ts` |
| I6 | **Checkbox hover (P0)** — unchecked mint `#c6e5e1` on `[data-name="box"]` hover; checked `#afccca` | **Present** | **Missing** | `globals-chrome` L2346–2368 (global checkbox kit) |
| I7 | **Checked label weight** — booster label **bold** when checked | **Present** | **Missing** | Book Step 7 pattern + QV CSS L1543–1552 |
| I8 | **Book now** → Book Step 1 if logged in; else **Login** popup | **Present** | **Missing** | Wire L2241–2248 |
| I9 | **Book now price** reflects booster (£150 checked / £75 unchecked) | **Present** | **Missing** | Wire L4253–4264 |
| I10 | **Check availability** → Availability Tool (`AVAIL_INTENT.browse`) — **no** login gate; logged-out + no location → **Find Pharmacy** (`start`); logged-in / chosen → **Choose Date** | **Present** | **Present** | `resolveAvailIntent` + browse without storeId; probe asserts `data-studio-avail-step="start"` |
| I11 | **Wishlist heart** — `PDP_WISHLIST_ID` (`chickenpox`); shared with Quick View + header flyout | **Present** | **Missing** | Wire L4315–4335; `headerMount.tsx` |
| I12 | **Heart hover (P0)** — empty: mint wash + navy glyph; filled: fuchsia `#e91e8c` on hover (not fuchsia on empty) | **Present** | **Missing** | `globals-chrome` L653–674; PLP I10 lesson |
| I13 | **Share icon** — icon-only hit target hover (mint wash); **no** navigation wire | **Partial** (hover only) | **Missing** | `wireIconHits` / `studio-icon-hit` |
| I14 | **Primary Book now hover** — navy lift `#01318f`, shadow, translateY | **Present** | **Missing** | `globals-chrome` L714–747 |
| I15 | **Secondary Check availability hover** — mint wash on bordered secondary CTA | **Present** | **Missing** | `globals-chrome` L809–834 |
| I16 | **Breadcrumb Vaccination** → PLP | **Present** | **Missing** | Wire L2310–2316 `data-studio-crumb="vaccination"` |
| I17 | **Accordion headers** — Make Figma static; PO asks interactive React | **N/A** (static Make) | **Present** | UXDS Accordion; probes `pdp-faq-accordion-*` |
| I18 | **Download guide / leaflet CTAs** — same tertiary rest; DS hover; no leaflet stub border | **Present** (Guide rest + Leaflet hover-mock) | **Present** | both `.pdp__pill`; probe asserts no `--bordered` |
| I19 | **Someone else tab** — **does not** open `recipient-picker` on PDP (visual only); picker opens from Book Step “Change recipient” | **Present** (wire truth) | **Missing** | Toggle wire activates index only; `recipient-picker` wired on book steps L3865–3935 |
| I20 | **Figma playback cursor** hidden on PDP | **Present** | **N/A** | `globals-screens` L714–715 `nth-child(8) [data-name=".utility / cursor"]` |

---

## Wire / URL / modal hooks

| # | Hook | Make / wire | React status | Evidence |
|---|------|-------------|--------------|----------|
| W1 | React mount + retire Make child 8 direct children | Wire gated | **Missing** | Pattern: PLP `mountPlpScreen` / `data-studio-make-retired` |
| W2 | Deep link `?project=boots-pharmacy&screen=pdp` | **Present** | **Missing** | [URL.md](../../../shell/URL.md) child 8 |
| W3 | Recording `kind: "screen"` `screenId: "pdp"` | **Present** | **N/A** (engine) | `screens.ts` |
| W4 | PLP Book now / tile title → PDP | **Present** | **Partial** (PLP React links `#pdp` / wire `setCurrent`) | `BootsPharmacyProjectView` L2555–2616 |
| W5 | **Check availability** → Availability Tool | **Present** | **Missing** | `openAvailabilityTool`; modal id **`choose-pharmacy`** ([URL.md](../../../shell/URL.md)) |
| W6 | **Login** from account CTAs | **Present** | **Missing** | modal id **`login`** |
| W7 | **Quick View** clones PDP RTB stack (`clonePdpRtbStack`) — same wishlist id, hides Check availability in QV | **Present** | **N/A** (PLP popup) | `pdpRtb.ts`; `data-studio-hide-check-availability` |
| W8 | **Booster state** shared PDP ↔ Book Step 1 ↔ confirmation summaries | **Present** | **Missing** | `includeBoosterDose` + `orderPricing.ts` |
| W9 | **Recipient picker** (`recipient-picker`) — Book steps only, **not** PDP toggle | **Present** (book) | **N/A** on PDP | `RecipientPickerPopup.tsx`; URL.md |
| W10 | Traditional CJM scripts `plp-open-pdp`, `pdp-book-now` | **Present** | **N/A** (playback) | `playback/traditional.ts` |
| W11 | Make wire early-return when React PDP mounted | Not yet | **Missing** | PLP pattern — gate hearts, booster, CTAs on `isPdpReactMounted()` |

---

## Journey-critical P0 restore set

### First scaffold (visible mount — Finn)

| Priority | Item | Why P0 |
|----------|------|--------|
| P0 | W1 + W2 Mount at child 8; URL `screen=pdp`; retire Make leak | Erase-Make entry |
| P0 | L1–L13 RTB band (image, title, price, toggle, checkbox, CTAs, Advantage bar) | CJM PLP→PDP→Book visible path |
| P0 | I8 / I9 / I10 Book now + Check availability + login gate behavior | Core journey |
| P0 | I5 / I6 / I7 / I9 Booster checkbox + price sync (default checked £150) | Shared order state |
| P0 | I11 / I12 Wishlist heart + correct empty/filled hover | Cross QV/header |
| P0 | W4 PLP → PDP still works with React mounted | Entry from HARD-GREEN PLP |
| P0 | LE1–LE3 Honest **N/A** — no invented loader | LESSONS wrong-preloader class |
| P0 | PAGE FINAL PASS landmarks `header`+`main`, BEM=`pdp` | PAGE_FINAL_PASS.md |

### Later fidelity (same page, post-scaffold)

| Priority | Item | Why |
|----------|------|-----|
| P0 | L14–L20 Below-fold bands (specs table, accordion static, GP promo) | Full page L&F |
| P0 | I1 / I2 / I3 / I4 Recipient toggle + login block | RTB completeness |
| P0 | I14 / I15 Primary + secondary CTA DS hover matrix | Uma §0a |
| P0 | I16 Breadcrumb Vaccination → PLP | Nav parity |
| P0 | L3 Breadcrumbs full chain | Visual |
| P0 | I17 Accordion interaction | **PO go** — UXDS Accordion kit |
| P0 | I18 Download CTAs | Live buttons + DS hover (no journey download URL yet) |
| P1 | I13 Share | Hover-only OK for CJM |
| P2 | L21 Footer/header | Engine-owned |

---

## Prove matrix (Quinn) — cannot PASS with unchecked P0s

| Item | Required | Interaction |
|------|----------|-------------|
| Mount + Make leak=0 on `screen=pdp` | Yes | Visual + DOM |
| PLP Book now → PDP React | Yes | MCP from PLP |
| Book now logged out → `modal=login` | Yes | URL + overlay-eyes |
| Book now logged in → `screen=book-step-1` | Yes | Tab / URL |
| Check availability → `modal=choose-pharmacy` | Yes | URL + overlay |
| Check availability logged-out → Find Pharmacy (`start`), not Choose Date | Yes | `data-studio-avail-step` + title |
| Booster unchecked → Book now **£75**; checked → **£150** | Yes | Click checkbox |
| Checkbox unchecked mint hover | Yes | MCP hover |
| Heart empty hover **navy** (not fuchsia); filled fuchsia | Yes | MCP computed styles |
| Myself/Someone else toggle visual + hover | Yes | Click + hover |
| Advantage bar visible | Yes | Visual |
| Below-fold scroll-into-view before interact | Yes | RECORDING.md |
| Agent overlay visible entire probe | Yes | LESSONS |
| Landmarks + BEM `pdp` | Yes | `check:page-final-pass` |
| No invented PDP loader | Yes | Visual |

**Fail ship if:** any scaffold P0 unchecked, Uma §0a DS matrix FAIL, or Quinn interaction matrix FAIL.

---

## Blockers / unclear Make truth

| # | Issue | Owner |
|---|-------|-------|
| B1 | ~~**Accordion** static~~ — **CLOSED**. Interactive Accordion; 3 Make-sourced bodies; 3 residual headers (no empty shells). | Bea |
| B6 | **FAQ residual bodies** — NHS / already-have / personal-data: no Make Description after search; PO may supply Make copy later. | Bea / PO |
| B2 | **Someone else** on PDP — visual toggle only; `recipient-picker` is Book-step “Change recipient”. Do not wire picker to PDP toggle without PO. | Bea → Finn |
| B3 | **Download / share CTAs** — DS hover shipped; **no** file/URL journey wire yet (decorative click OK). | Pax |
| B4 | **Book now initial price** — Figma shows `£150` with booster default checked (`DEFAULT_INCLUDE_BOOSTER_DOSE = true`); list price row stays `£75.00` single-dose. | Documented — match wire |
| B5 | **Single SKU** — chickenpox only today; multi-SKU PDP out of scope until catalog expands. | Arch |

---

## Related shared assets (do not duplicate)

| Asset | Path |
|-------|------|
| RTB clone / QV helpers | `src/projects/boots-pharmacy/dom/pdpRtb.ts` |
| Pricing constants | `src/projects/boots-pharmacy/data/orderPricing.ts` |
| Wishlist id | `PDP_WISHLIST_ID = "chickenpox"` in `chrome/headerMount.tsx` |
| Make frame export | `src/projects/boots-pharmacy/frame/index.tsx` (child 8 @ `left-[5345px]`) |
