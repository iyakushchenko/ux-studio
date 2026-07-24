# Project contract — what a Studio project supplies, what the engine guarantees

**Status:** Living (Tech Director) · written 2026-07-24, correcting [CODEBASE_AUDIT_2026-07-24.md](./CODEBASE_AUDIT_2026-07-24.md) R2's original "no contract exists" claim.

This is not a new design. It documents an existing, working contract (`src/projects/types.ts`) in plain terms, so an agent building project #3 doesn't have to reverse-engineer it from `BootsPharmacyProjectView.tsx` (4900 lines) cold. Source of truth stays `types.ts` — this file is the map, not a copy.

---

## Proof the contract works today

`src/projects/registry.ts` registers two projects:

| Project | `content` | `playback` | Real pages? |
|---|---|---|---|
| `boots-pharmacy` | Full screen manifest | Real director scripts | Yes — 9 screens, PAGE FINAL PASS hard-green |
| `puma` | `EMPTY_PROJECT_CONTENT` (zero screens) | No-op, fails honestly (`"puma: availability scripts not implemented"`) | No — deliberate empty stub |

Puma proves the registry/content/persona/playback layers are genuinely generic: it registers, appears in the project picker, and behaves correctly with zero pages. It is not dead code — it is the "prove the seam before building the real thing" stub, same discipline as [COMPONENT_LIBRARY.md](./COMPONENT_LIBRARY.md)'s extract-on-second-use rule, applied one level up.

---

## What a project must supply (`ProjectDefinition`, `src/projects/types.ts`)

| Field | Shape | Notes |
|---|---|---|
| `id`, `brand`, `subbrand?`, `label`, `shortLabel?` | strings | `id` via `formatProjectId(brand, subbrand?)` |
| `content` | `ProjectContentDefinition` | `PROJECT_SCREENS` (id + `childIndex` per screen), `HUB_LABEL`, `SCENARIO_SCREENS`, `studioTabToIndex`. Empty projects use `EMPTY_PROJECT_CONTENT` (`src/app/shell/emptyProjectContent.ts`) — do not borrow another project's pages to fake completeness. |
| `personas` + `defaultPersonaId` | `PersonaDefinition[]` | Each persona owns its own `journeys: JourneyDefinition[]` (built-in CJMs) + optional `journeyRecordings` (promoted REC evidence). |
| `playback` | `ProjectPlayback` | `runHomeScript`/`runAvailScript`/`runBookScript`/`runTabScript` + `runBeatAction`/`abortAll`. No flow yet → return `scriptFail("<project>: X not implemented")`, never a faked `scriptOk()`. |
| `wireComponent?` | `ProjectWireComponent` | Renders the project's DOM/popups/screens inside the shell layout. Omit for a content-less stub (Puma has none). |
| `popupTouchpoints?` | `Record<journeyId, Record<beatId, StudioTouchpointEntry[]>>` | Optional — popup rows in the touchpoint timeline. |

## What the engine guarantees back

URL scheme (`?project=<id>&screen=<screenId>`), playback/REC/CJM machinery, the studio nav chrome, project picker, persona switching — all keyed generically off `ProjectDefinition`/`getProjectById`, not hardcoded to Boots. Verified: Puma switches into and out of cleanly today.

---

## The one real, named gap (not "no contract" — narrower than that)

`ProjectWireApi` (a project's wire component reports this shape back to the shell — popup open/closed state, dirty flags, etc.) is typed using **Boots-concrete** types: `AvailOpenIntent`, `AvailStep`, `ChosenBookingSlot`, imported directly from `src/projects/boots-pharmacy/overlays/AvailabilityTool.tsx` into the supposedly-generic `types.ts`.

**Consequence:** a project with no availability/booking flow (Puma, today) is unaffected. A project *that has one* either has to shape its flow to Boots's exact types, or `ProjectWireApi`'s availability/booking fields need genericizing first (e.g. an engine-owned `AvailabilityFlowState<TSlot>` a project's playback implements against, instead of importing Boots's own type).

**Do not** genericize this speculatively — no second project needs an availability/booking flow yet. Do it when a real one does, per the same extract-on-second-use rule Puma itself demonstrates.

## Related — still real, not yet fixed

`R1` (partially closed 2026-07-24): two Boots-specific files (`AvailabilityTool.tsx` re-export shim, `BootsPharmacyLogo.tsx`) have been relocated out of `src/app/`. Not audited this pass: `chrome/footerContent.ts`, `hub/hubContent.ts`, `headerMount.tsx` still hardcode Boots copy/nav directly rather than accepting it as project-supplied content — flagged, not fixed, in [CODEBASE_AUDIT_2026-07-24.md](./CODEBASE_AUDIT_2026-07-24.md) R1.

## Related

- [CODEBASE_AUDIT_2026-07-24.md](./CODEBASE_AUDIT_2026-07-24.md) · [ARCHITECTURE.md](./ARCHITECTURE.md) · [CX_CONVEYOR.md](./CX_CONVEYOR.md) · [COMPONENT_LIBRARY.md](./COMPONENT_LIBRARY.md)
