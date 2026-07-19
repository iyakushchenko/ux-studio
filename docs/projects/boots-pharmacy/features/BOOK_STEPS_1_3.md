# Feature brief — Book Steps 1–3 (location → datetime → confirm)

**Project:** `boots-pharmacy`  
**Callsigns:** Bea · Finn · Uma · Quinn · Pax  
**Status:** done (pilot landed; fidelity debt residual)  
**Updated:** 2026-07-19  
**Refs:** [BOOTS_REACT_SCREEN_PILOT.md](../BOOTS_REACT_SCREEN_PILOT.md) · audits under `../audits/`

---

## Context

Boots book flow is the first React+UXDS rabbit: Location (`book-step-1`), Date & Time (`book-step-2`), Confirmation (`book-step-3`). Studio must deep-link and record these screens.

## Business logic

| Rule | Behavior |
|------|----------|
| Continue without pharmacy | Opens Choose Pharmacy (`modal=choose-pharmacy`) — does not advance |
| Location chosen | Continue → `book-step-2` |
| Reserve / book slot | Advances to confirmation with chosen slot |
| Progress chrome | BookAppointmentProgress matches concept steps |

## Acceptance (Bea → Quinn)

- [x] Steps 1–3 mount via React hosts; Make chrome hidden when mounted
- [x] URL `?project=boots-pharmacy&screen=book-step-N` restores tab
- [x] FE audits PROVEN for pilots
- [ ] Residual Make-only hex / LEGACY shrink (board NEXT)

## Chrome / fidelity (Uma)

- [x] Nazi QA PROVEN for Steps 1–3 pilots
- [ ] No LEGACY growth on further edits

## Mount / FE notes (Finn)

- Hosts: `screens/book-step-1|2|3/` · `screenId` = folder name  
- Continue / search / near-me → AvailabilityTool open (wire)

## Prove notes (Quinn)

- Unit + localhost pilots; Pages after push tip

## Pax

- Pilot ships already bumped historically; further chrome → consider patch
