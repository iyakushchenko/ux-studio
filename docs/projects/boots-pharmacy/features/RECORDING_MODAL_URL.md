# Feature brief — Recording + modal URL (Choose Pharmacy)

**Project:** `boots-pharmacy` (+ engine shell)  
**Callsigns:** Bea · Finn · Uma · Quinn · Pax  
**Status:** done  
**Updated:** 2026-07-19  
**Refs:** [URL.md](../../../shell/URL.md) · [RECORDING.md](../../../shell/RECORDING.md) · [TEAM.md](../../../product/TEAM.md)

---

## Context

Recording/replay/agent testing must treat Availability / Choose Pharmacy as **navigable blocking UI** — not a transparent layer agents click through. Sitrep must stay above the lightbox.

## Business logic

| Rule | Behavior |
|------|----------|
| Modal open | Address bar includes `&modal=choose-pharmacy` (with current `screen`) |
| Deep link / popstate | Re-opens or closes Availability to match `modal` |
| Agent / replay click | Resolve topmost `[role=dialog]` / `.studio-avail-scrim` first — never CTA under scrim |
| Sitrep | Agent testing overlay z-index above concept lightboxes |

## Acceptance (Bea → Quinn)

- [x] Open Choose Pharmacy → URL has `modal=choose-pharmacy`
- [x] Close / Back → modal param cleared; tool closes (popstate wired)
- [x] Sitrep visible above open avail tool (z 2147483646 > 10200)
- [x] Replay/demo-click does not hit Continue under open modal (`studioModalGuard`)
- [x] Docs: URL.md + RECORDING.md

## Chrome / fidelity (Uma)

- [x] Sitrep panel readable over lightbox (no underlap)
- [x] No new near-dup overlay languages

## Mount / FE notes (Finn)

- Engine: `studioUrl` `modal` param · `studioModalGuard` · overlay CSS z-index  
- Boots wire: `availabilityOpen` ↔ URL + recording `screen` events

## Prove notes (Quinn)

- Unit: parse/serialize modal; modal guard blocks under-scrim target  
- Localhost 2026-07-19: Continue → `modal=choose-pharmacy`; overlayZ 2147483646 > scrimZ 10200; Continue under scrim blocked

## Pax

- User-visible chrome + URL → **patch bump + notes + push** — **YES** (this ship)
