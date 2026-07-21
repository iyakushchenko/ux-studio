# Home Make → React parity register

**Project:** `boots-pharmacy`  
**Callsigns:** Bea (BA) owns register truth · Quinn (QA) owns prove · Finn/Uma restore gaps  
**Updated:** 2026-07-21 (truth label added; detailed table retains 2026-07-19 kickoff baseline)  
**Overall proof status:** Site Pilot (`screenId=site-pilot`) PAGE FINAL PASS **HARD-GREEN** per [NEXT_STEPS.md](../../../product/NEXT_STEPS.md) and [FE_AUDIT_SITE_PILOT_PAGE_FINAL_PASS_2026-07-20.md](../audits/FE_AUDIT_SITE_PILOT_PAGE_FINAL_PASS_2026-07-20.md).  
**Register interpretation:** File name and table preserve the original Home/Make migration vocabulary. The public screen id is `site-pilot`; `home` is reserved. Detailed `Partial`/`Missing` cells are the kickoff baseline and are not a current completion report. Use the audit/Final Pass evidence for closure; do not invent row-level proof.
**Make source:** Frame child **11** (`Agentic. Site Pilot. Home`) — `Body10` + shell at `left-0` in `frame/index.tsx` · wire `BootsPharmacyProjectView` child-11 effects · `playback/sitePilotHome.ts`  
**Public `screenId`:** `site-pilot` (URL `?screen=site-pilot`) — **not** `home` (`home` reserved for a future real Home page)  
**React target:** `src/projects/boots-pharmacy/screens/home/*` (folder may lag public id until cheap rename)  
**Refs:** [HOME_REACT.md](./HOME_REACT.md) · [PLP_MAKE_PARITY_REGISTER.md](./PLP_MAKE_PARITY_REGISTER.md) (format) · [URL.md](../../../shell/URL.md)  
**Uma checklist:** [../../../product/UMA_FIDELITY_NOTES.md](../../../product/UMA_FIDELITY_NOTES.md) · **Uma stamp:** [../audits/UMA_FIDELITY_HOME_2026-07-19.md](../audits/UMA_FIDELITY_HOME_2026-07-19.md) (**IN PROGRESS**)

**Status legend:** Present · Partial · Missing · Fixed · N/A

**Make column:** inventory from Frame `Body10` + wire (2026-07-19).  
**React column:** historical first-visible-mount baseline; retained to show the original acceptance gaps.

**Bea rule:** Every band before Finn codes deep fidelity — including loading/empty/updating as **P0** when Make has them. No invented bands.

---

## Layout (every Make band)

| # | Make behavior | Make | React status | Evidence |
|---|---------------|------|--------------|----------|
| L1 | **1440 shell** — page `w-[1440px]`, body pad `64px`, column center | **Present** | **Partial** | `home__shell` / `home__body` |
| L2 | **Header chrome** — `boots-pharmacy.module.header` (engine-mounted) | **Present** | **N/A** (engine) | Keep Make header; React body only |
| L3 | **Body fill** — `#f5f5f5` + decorative blur PNG + olive glow PNG | **Present** | **Partial** | `home__bg-*` responsive cover (Make fixed px under-matched) |
| L4 | **Site Pilot logo** — `boots.ai assistant 3` (258×54 mark + wordmark) | **Present** | **Present** | `home__logo` SVG paths from Make |
| L5 | **Hero heading** — “What health services are you focusing on today?”; logged-in → “Sarah, what…” | **Present** | **Present** | `data-studio-agentic-home-heading` + `resolveHomeHeading(isStudioLoggedIn)` |
| L6 | **Query card** — `component.co.order.summary` white, 640px, `p-[32px]`, `gap-[32px]`, radius 16, shadow `0 4px 4.45px rgba(1,33,105,0.1)` | **Present** | **Partial** | `home__card` — Uma measure pending |
| L7 | **Query row** — prompt → wire textarea (`proto-agentic-query` / `data-studio-action=agentic-home-query`) + mic + navy send | **Present** | **Present** | `home__query` in `<form class="home__query-row">`; send `type="submit"`; chips kebab `data-studio-action` + `data-studio-home-chip` |
| L8 | **Default query copy** — Sarah SE Asia travel intent (`AGENTIC_HOME_DEMO_QUERY`) | **Present** | **Present** | `HOME_QUERY_DEFAULT` |
| L9 | **Suggested label** — “Suggested dialog options:” 10px grey | **Present** | **Present** | `HOME_SUGGESTED_LABEL` |
| L10 | **Suggested chips ×3** — Vaccine / Skin health / Other Health services (`component.gse.system.message`) | **Present** | **Present** | `HOME_CHIP_LABELS` |
| L11 | **Chip → Chat** — click navigates to Site Pilot Chat (child 10) | **Present** | **Present** | `onChip` → `setCurrent(1)` |
| L12 | **Send → Chat** — navy send navigates to Chat | **Present** | **Present** | `onSend` → `setCurrent(1)` |
| L13 | **Breadcrumbs** — absent on Home shell | **N/A** | **N/A** | Do not invent |
| L14 | **Footer** — Site Pilot has none (`SITE_PILOT_CHILD_INDICES`) | **N/A** | **N/A** | Do not invent |

---

## Loading / empty / updating (P0 when Make has them)

| # | Make behavior | Make | React status | Evidence |
|---|---------------|------|--------------|----------|
| LE1 | Page load loader | **N/A** | **N/A** | Static paint — **forbidden** invent spinner |
| LE2 | Empty state | **N/A** | **N/A** | — |
| LE3 | Updating overlay | **N/A** | **N/A** | — |

---

## Interactions / DS states

| # | Make behavior | Make | React status | Evidence |
|---|---------------|------|--------------|----------|
| I1 | Textarea replace + autosize (1→5 lines) | **Present** | **Partial** | React autosize; wire gated when mounted |
| I2 | `homeQueryDirty` / Reset visibility | **Present** | **Missing** | Wire Reset still Make-path — Finn follow-up |
| I3 | Pending query session restore | **Present** | **Missing** | React must accept pending query prop/session |
| I4 | Mic button | **Present** | **Partial** | Visible no-op (Make hover-only / no voice) |
| I5 | Mic / send / chip hover·focus·active | **Present** | **Missing** | Uma §0a PENDING — no invent colors |
| I6 | Textarea focus ring none (Make) | **Present** | **Partial** | Confirm vs kit |
| I7 | Auth heading SSoT `isStudioLoggedIn` | **Present** | **Present** | `resolveAgenticHomeLoggedIn` → props |
| I8 | Playback `sarah-query-submit` | **Present** | **Partial** | Script still targets Make selectors — may need React hooks |

---

## Wire / mount gates

| # | Behavior | Make | React status | Evidence |
|---|----------|------|--------------|----------|
| W1 | React host child 11 | — | **Present** | `mountHomeScreen` |
| W2 | `data-studio-make-retired=site-pilot` | — | **Present** | hideMakeChrome |
| W3 | URL `?project=boots-pharmacy&screen=site-pilot` | **Present** | **Present** | registry `HOME_REACT_SCREEN_ID` |
| W4 | Make wire early-return when React mounted | — | **Present** | `isHomeReactMounted()` on heading + textarea effects |
| W5 | No LEGACY growth for React path | — | **Present** | `home.css` only |
| W6 | PAGE FINAL PASS stamp | — | **Missing** | Do **not** add to requiredScreens until PROVEN |

---

## Honest residual / blockers

| Id | Note |
|----|------|
| B1 | Make chips navigate only (do not invent fill-textarea-on-chip unless Make does — wire currently navigates) |
| B2 | Mic is visual; no voice — keep no-op |
| B3 | Decorative bg responsive fill under-matches Make absolute geometry — Uma signs |
| B4 | DS hover matrix + Quinn MCP full recipe before PROVEN |
| B5 | PDP Final Pass stays HARD-GREEN — Home must not demote it |

---

## Prove URL (R11)

```
http://localhost:5173/?project=boots-pharmacy&screen=site-pilot
```

```js
await window.__studioRunMcpPageProbe?.({ screenId: "site-pilot", reload: false })
```

Criteria: [../audits/QUINN_HOME_PROBE_CRITERIA_2026-07-19.md](../audits/QUINN_HOME_PROBE_CRITERIA_2026-07-19.md)
