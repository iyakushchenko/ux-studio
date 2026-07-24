# Feature brief — Home React migration

**Project:** `boots-pharmacy`  
**Callsigns:** Bea (BA) · Finn (FE) · Uma (UI/UX) · Quinn (QA) · Pax (PO sim) · Arch (Director)  
**Status:** building (first visible mount)  
**Updated:** 2026-07-19  
**Refs:** [HOME_LEGACY_PARITY_REGISTER.md](./HOME_LEGACY_PARITY_REGISTER.md) · [NEXT_STEPS.md](../../../product/NEXT_STEPS.md) erase-Legacy · Uma [../audits/UMA_FIDELITY_HOME_2026-07-19.md](../audits/UMA_FIDELITY_HOME_2026-07-19.md)

---

## Context

Erase-Legacy sequence: PLP → PDP (**PAGE FINAL PASS HARD-GREEN**) → **Site Pilot / Home** (PO `+` 2026-07-19). Agentic Site Pilot Home (`screenId: site-pilot`, Frame child **11**) is the NL entry before Chat. Mount pattern matches PLP/PDP: React + UXDS, Legacy retired from view, no LEGACY growth, URL + recording. **`home` is reserved** for a future real Home page — do not reuse as this screen’s public id.

## Business logic

| Rule | Behavior |
|------|----------|
| Default query | Sarah SE Asia travel intent prefilled |
| Send | → Site Pilot Chat (`screen=chat`) |
| Suggested chips | → Chat (same as Legacy wire) |
| Logged-in heading | “Sarah, what health services…” via `isStudioLoggedIn` SSoT |
| Reset / dirty | Hide Reset while query === default (wire parity — follow-up) |
| Footer / crumbs | None — do not invent |

## Acceptance (Bea → Quinn)

- [x] React host mounts at child 11; Legacy retired (`data-studio-legacy-retired=site-pilot`)
- [x] Legacy wire effects early-return when React mounted
- [x] URL `?project=boots-pharmacy&screen=site-pilot`
- [x] No LEGACY growth for React path
- [ ] Uma audit **PROVEN** (currently IN PROGRESS)
- [ ] Quinn MCP full matrix PASS (stub `home-host` only for now)
- [ ] Honest residual documented
- [ ] PAGE FINAL PASS hard-green (later — do not stamp early)

## Chrome / fidelity (Uma)

- [ ] Concept L&F vs Legacy Body10 (logo, card shadow/radius, chips, atmos)
- [ ] Typical DS checks: mic · send · chips · textarea
- [ ] No invent footer / crumbs / Advantage / PromoMessageStrip
- [ ] Auth heading parity

## Mount / FE notes (Finn)

- Folder (interim): `src/projects/boots-pharmacy/screens/home/` — public id is `site-pilot` (folder rename optional)
- Contract: `HOME_CHILD_INDEX = 11`, `HOME_REACT_SCREEN_ID = "site-pilot"`
- Mount: `mountHomeScreen` / deferred unmount — hide Legacy children; keep header mount
- Auth: `loggedIn: resolveAgenticHomeLoggedIn(loggedInFlag)` → `isStudioLoggedIn`
- Reuse: Accordion / PromoMessageStrip / TertiaryCta = **N/A** on Home Legacy

## Prove notes (Quinn)

- Stub: `__studioRunMcpPageProbe({ screenId:"site-pilot", reload:false })` — `site-pilot-host` + overlay-arm + url-screen
- R11: `http://localhost:5173/` reuse tab only
- Criteria: [../audits/QUINN_HOME_PROBE_CRITERIA_2026-07-19.md](../audits/QUINN_HOME_PROBE_CRITERIA_2026-07-19.md)

## Pax

- [ ] User-visible? → bump patch? **Y** when fidelity ship closes (not this interim scaffold alone unless PO wants)
- [ ] Push? **Y** interim kickoff
- [ ] Notes/CHANGELOG updated
