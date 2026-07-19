# Feature brief — Recording + modal URL (all Boots dialogs)

**Project:** `boots-pharmacy` (+ engine shell)  
**Callsigns:** Bea · Finn · Uma · Quinn · Pax  
**Status:** done  
**Updated:** 2026-07-19  
**Refs:** [URL.md](../../../shell/URL.md) · [RECORDING.md](../../../shell/RECORDING.md) · [TEAM.md](../../../product/TEAM.md) · [PARITY_RATCHETS.md](../../../product/PARITY_RATCHETS.md)

---

## Context

Recording/replay/agent testing must treat **every** blocking lightbox as **navigable UI** — not a transparent layer agents click through. Sitrep must stay above the lightbox. Opening a dialog **must** change the address bar (`&modal=`).

## Business logic

| Rule | Behavior |
|------|----------|
| Modal open | Address bar includes `&modal=<id>` (with current `screen`) for Choose Pharmacy, Quick View, Login, Vaccine, Recipient |
| Deep link / popstate | Re-opens or closes the matching dialog via `applyStudioModal` |
| Agent / replay click | Resolve topmost registered overlay first — never CTA under scrim |
| Sitrep | Agent testing overlay z-index above concept lightboxes |
| Registry | `STUDIO_MODAL_REGISTRY` — felony if unregistered or open without URL helper |

## Acceptance (Bea → Quinn)

- [x] Open Choose Pharmacy → URL has `modal=choose-pharmacy`
- [x] Open Quick View → URL has `modal=quick-view`
- [x] Close / Back → modal param cleared; dialog closes (popstate wired)
- [x] Sitrep visible above open avail tool (z 2147483646 > 10200)
- [x] Replay/demo-click does not hit Continue under open modal (`studioModalGuard`)
- [x] Docs: URL.md + RECORDING.md + LESSONS + PARITY_RATCHETS **modal-url-sync**

## Chrome / fidelity (Uma)

- [x] Sitrep panel readable over lightbox (no underlap)
- [x] No new near-dup overlay languages

## Mount / FE notes (Finn)

- Engine: `studioUrl` `modal` · `studioModalRegistry` · `studioModalGuard` · overlay CSS z-index  
- Boots wire: all popup open flags ↔ URL via `resolveStudioModalIdFromFlags` + registered helpers

## Prove notes (Quinn)

- Unit: parse/serialize modal; registry resolve/apply; modal guard blocks under-scrim target  
- Localhost: Choose Pharmacy → `modal=choose-pharmacy`; Quick View → `modal=quick-view` (MCP prove after push)
- Gate: `check:felonies` + ratchet **modal-url-sync** fail if orphan open or missing registry entry

## Pax

- User-visible chrome + URL → **patch bump + notes + push** — **YES** (this ship)
