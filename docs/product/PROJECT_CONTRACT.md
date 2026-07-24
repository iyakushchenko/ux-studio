# Project contract — what a Studio project supplies, what the engine guarantees

**Status:** Living (Tech Director) · written 2026-07-24, correcting [CODEBASE_AUDIT_2026-07-24.md](./CODEBASE_AUDIT_2026-07-24.md) R2's original "no contract exists" claim.

This is not a new design. It documents an existing, working contract (`src/projects/types.ts`) in plain terms, so an agent building project #3 doesn't have to reverse-engineer it from `BootsPharmacyProjectView.tsx` (4900 lines) cold. Source of truth stays `types.ts` — this file is the map, not a copy.

---

## Proof the contract works today

`src/projects/registry.ts` registers two projects:

| Project | `content` | `playback` | Real pages? |
|---|---|---|---|
| `boots-pharmacy` | Full screen manifest | Real director scripts | Yes — 9 screens, PAGE FINAL PASS hard-green |
| `puma` (registry id — label is **"UXDS - Larkin"**) | `EMPTY_PROJECT_CONTENT` (zero screens) | No-op, fails honestly (`"puma: availability scripts not implemented"`) | No — deliberately not started yet |

Registry id `puma` is a leftover internal label, not the concept — its real identity is `label: "UXDS - Larkin"`. This is the **refapp project**: a UXML recreation of the actual UXDS Larkin design system itself, not a client brand. It gets no project theme — direct 1:1 UXDS parity is the whole point ([PROJECT_STYLEGUIDE.md](./PROJECT_STYLEGUIDE.md) § "When theme applies vs when direct UXDS parity is required").

**Why it's still empty, and where its pages actually come from (PO, 2026-07-24 — the strategic bootstrap sequence, full detail: [CX_CONVEYOR.md](./CX_CONVEYOR.md) § "The refapp bootstrap sequence"):** deliberately sequenced, not neglected, and not built independently from the Figma file in parallel with Boots. Order: (1) existing Boots pages made flawless against the gate-enforced `PAGE_FINAL_PASS.md` checklist, (2) once that holds, validate the full intake pipeline by building one genuinely new Boots page end to end, (3) only then reuse the now-proven Boots pages to bootstrap refapp — extracting/generalizing from checklist-clean, already-UXDS-composed output rather than starting a second track from scratch while the first is still being hardened.

**What it becomes:** as pages are recreated in refapp, they form the **refapp roster** — the primary template source for building other projects' pages (compose from a roster page + a brand theme delta, rather than starting from a raw Figma concept every time). It also currently proves the registry/content/persona/playback layers are genuinely generic even with zero pages — same discipline as [COMPONENT_LIBRARY.md](./COMPONENT_LIBRARY.md)'s extract-on-second-use rule, applied one level up.

**Template sourcing is not refapp-exclusive:** if the PO judges that an existing project already has a suitably similar solution, the agent may derive a new page's template from that project instead of refapp — to save time when a proper equivalent already exists. Refapp is the intended long-run canonical source, not the only permitted one.

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

## Content/copy layer — partial, one real project not yet fork-able (PO, 2026-07-24)

**The gap:** `ProjectDefinition` cleanly separates *structure* (screens, personas, playback) from the engine. It does **not** separate *copy* from structure. Brand-editable strings — page titles, product/catalog names, filter labels, mega menu items, persona name, nav labels, footer links, logo — are hardcoded inline in engine-adjacent files (`headerContent.ts`, `footerContent.ts`, `hub/hubContent.ts`, `PdpRtbCard.tsx`, `PlpScreen.tsx`, …), not held as one project-supplied data shape. Confirmed today's file audit: `headerContent.ts` mixes real copy (nav labels) with literal brand SVG path data in the same file, no boundary between "this is text a human retypes for Puma" and "this is code."

**Test:** duplicate Boots → Puma tomorrow. Today that means grep-hunting every screen/chrome file for hardcoded English strings and product data, not editing one file. That's the actual product-readiness bar for a second real project, not the identity/registry work above.

**Target shape (not built):** a per-project **content pack** — the copy equivalent of `ProjectContentDefinition` — one place per project holding every brand string, keyed by the same page/component ids the engine already uses (so it's mappable at a glance: "this key = this label on this screen"). Product/catalog data (PLP's vaccine list vs. a future Puma sneaker catalog) stays separate — different shape per project by nature, per your own note — but the *copy* layer (labels, nav, persona name, page titles) should be one consistent, swappable shape across any project.

**Where this should eventually plug in:** [X_SUITE_INTEGRATION.md](./X_SUITE_INTEGRATION.md) already owns "IA/persona/brand" as X-Suite's export domain (`setup` UXDS collection: `IA/*`, `persona/*`, `brand/*`, `project/*`). The content pack should be the JSON-compatible landing shape for that export, not a new parallel taxonomy Studio invents on its own.

**Shape drafted, checked against X-Suite's real source (not guessed):** [`src/projects/contentPack.ts`](../../src/projects/contentPack.ts). `IaNode` (id/label/type/note/linkType/children) is structurally identical to X-Suite's actual `iaPdAiIaNodeSchema` (`E:\UX\Summarizer\src\ui\components\settings\iaPdAi\iaPdAiSchema.ts`) — an export like *"Main Nav & Product Data - English (ia-json-02-26-2026-1)"* is one `iaJson: IaNode[]` array and drops in with a thin adapter, not a rewrite. `ProductDataGroup` mirrors their length-10 slot-group shape (`iaPdAiProductDataJsonSchema`) for the same reason.

**First real slice populated 2026-07-24:** [`src/projects/boots-pharmacy/contentPack.ts`](../../src/projects/boots-pharmacy/contentPack.ts) — `BOOTS_PHARMACY_CONTENT_PACK`, footer (utility links + link columns + copyright), primary nav (`headerContent.ts`'s `HEADER_NAV_ITEMS`), persona name (real `sarah-jenkins` id, not hardcoded "Sarah"), and page titles (derived straight from `screens.ts`'s real registry labels — zero invented copy). Locked to the real source data by a consistency test (`contentPack.test.ts`, 6 assertions) so the pack can't silently drift from what actually renders. **Header account-menu items and icon glyphs were deliberately left out** — they carry icons/badge keys/action types with no `IaNode` equivalent; that's genuinely engine/UI structure, not portable copy. `hub/hubContent.ts` (568 lines) is a separate, larger follow-up, not attempted here.

**Footer render path wired 2026-07-24.** `Footer.tsx` now sources `FOOTER_UTILITY_LINKS`/`FOOTER_LINK_COLUMNS`/`FOOTER_COPYRIGHT_LINES` from `BOOTS_PHARMACY_CONTENT_PACK` itself (filtered by `IaNode.type`), not from `footerContent.ts` directly — the pack is genuinely load-bearing for the footer, not a parallel unused shape. `footerLinkLabel`/`footerLinkScreen` helpers were retired in favor of reading `IaNode.label`/`IaNode.note`/`IaNode.linkType` directly. Verified: `check:interactive-identity` + `check:parity-ratchets` (both assert exact `data-studio-action` slugs) stayed green, live click-through re-tested (footer "Vaccination" → PLP navigation still fires), `npm run smoke`'s interaction-inventory check unchanged (367 ready-target, same 4 documented invalid). **Primary nav render path wired same day.** `Header.tsx` now derives `HEADER_NAV_ITEMS` from `BOOTS_PHARMACY_CONTENT_PACK.nav.primary` (label + `type` → `kind`) instead of importing the constant from `headerContent.ts`. Verified live: nav row renders all 4 items with correct labels, chevron only on non-`link` kinds (Health Services/Acne & Skin/More, not Home), and the Health Services mega-menu flyout still opens on hover — real interactive behavior, not just static markup. Gates + `npm run smoke` unchanged.

**Not yet wired:** `hub/hubContent.ts` (568 lines) and header account-menu items/icons (no `IaNode` equivalent for icons/badges/actions — genuinely engine/UI structure, not portable copy) — both real, scoped follow-ups, not silently skipped.

**Before writing any adapter against this shape — read this first:** [CX_CONVEYOR.md](./CX_CONVEYOR.md) § "The determinism boundary". Screen/touchpoint-name mapping is judgment territory, permanently, not a data-completeness gap. `src/projects/happyPathAdapter.ts` is the reference pattern: take an explicit caller-supplied map, flag anything unmapped, never guess.

## Related — still real, not yet fixed

`R1` (partially closed 2026-07-24): two Boots-specific files (`AvailabilityTool.tsx` re-export shim, `BootsPharmacyLogo.tsx`) have been relocated out of `src/app/`. Not audited this pass: `chrome/footerContent.ts`, `hub/hubContent.ts`, `headerMount.tsx` still hardcode Boots copy/nav directly rather than accepting it as project-supplied content — flagged, not fixed, in [CODEBASE_AUDIT_2026-07-24.md](./CODEBASE_AUDIT_2026-07-24.md) R1.

## Related

- [CODEBASE_AUDIT_2026-07-24.md](./CODEBASE_AUDIT_2026-07-24.md) · [ARCHITECTURE.md](./ARCHITECTURE.md) · [CX_CONVEYOR.md](./CX_CONVEYOR.md) · [COMPONENT_LIBRARY.md](./COMPONENT_LIBRARY.md)
