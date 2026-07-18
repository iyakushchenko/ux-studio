# Agent onboarding — Boots Health Vaccine Concept

Critical knowledge for AI agents and new contributors working on this repository.

## What this is

Clickable **UX concept prototype** for Boots Health travel vaccinations. It is **not** a production app. Most UI is a **Figma export** (`src/imports/Frame1000007317/`) with **imperative DOM wiring** in `App.tsx` and `src/app/proto/*` modules.

**Persona:** Sarah Jenkins — busy traveller booking Southeast Asia vaccines; cares about bundles, clear pricing, and one booking path without dead ends.

**Figma source:** https://www.figma.com/design/doliUpuE3J5sa5M3e1I0GP/-UX--CJM---Boots-Health---Vaccine--Concept-

**Stack:** React 18, Vite 6, Tailwind 4, TypeScript. Path alias `@/` → `src/`.

```bash
npm i && npm run dev    # local preview
npm run build           # must pass before push
npm run test            # playback guardrails — run after journey/script changes
```

See **`docs/shell/PLAYBACK.md`** for how to change journey scripts safely and the manual smoke checklist.

---

## Screen model (read this first)

Three related indices confuse everyone:

| Concept | Meaning |
|--------|---------|
| **Hub** | Tab `0` — onboarding wiki (`ProtoHubViewport`), not in `PROTO_SCREENS` |
| **`current`** | Zero-based index into `PROTO_SCREENS` array (App state) |
| **Nav tab label** | `current + 1` for prototype screens; hub shows as tab 0 |
| **`childIndex`** | **DOM child** of `Frame219` root — used in CSS `nth-child(n)` and screen-specific `useEffect`s |

`PROTO_SCREENS` lives in `src/app/proto/protoScreens.ts`. **`childIndex` ≠ tab number.**

```ts
// DOM order inside Frame219 (see comment block top of App.tsx)
// child 11 → Agentic home
// child 10 → Agentic chat
// child 9  → PLP (Vaccination Listing)     ← PROTO_INDEX_PLP
// child 8  → PDP
// child 7  → Book step 1 (location)
// child 4  → Book step 2 (date/time)
// child 3  → Book step 3 (confirmation)
// child 2  → Appointment History (MA)
// child 1  → Appointment Details (MA)
// child 6  → Locations lightbox (not a nav screen)
// child 5  → Location-selected template (not a nav screen)
```

When adding screen-specific CSS or effects, **always scope by `childIndex` or `data-name`**, never assume tab number equals DOM index.

---

## Repository layout

```
src/
  app/
    App.tsx              # Orchestrator (~4.6k lines): state, effects, popups
    shell/               # Studio state — project / persona / CJM selection
    AvailabilityTool.tsx # Multi-step availability lightbox
    BootsPharmacyLogo.tsx
    hub/                 # Tab 0 onboarding wiki (→ move to projects/)
    nav/                 # Tab strip + zoom + transport controls (shell)
    orchestra/           # Journey playback engine (shell)
    popups/              # Login, Quick View, vaccine/recipient pickers
    chrome/              # Shared header, footer, icons, tertiary CTAs
    proto/               # DOM wiring: PLP, filters, maps, pricing, screens (→ move to projects/)
    components/          # shadcn/Radix UI kit — rarely used by prototype screens
  projects/
    registry.ts          # All registered demo projects
    boots-pharmacy/      # First project — screens, dom, playback, frame, hub, etc.
      frame/             # Figma export (was imports/Frame1000007317)
  styles/
    globals.css          # Imports hub + chrome + screens partials
    globals-hub.css
    globals-chrome.css
    globals-screens.css
    index.css            # Entry: fonts, tailwind, theme, globals
  assets/                # Images, avail icons, hub figures, user-avatar.jpg
docs/
  shell/                 # Shell architecture — read SHELL.md before changing studio
    SHELL.md
    PROJECTS.md
  FIGMA_MAKE_SYNC.md     # Cloud Make sync (paths may lag repo — trust AGENTS.md layout)
scripts/
  export-figma-make-sync.ps1
```

**App root** should only hold `App.tsx`, `AvailabilityTool.tsx`, `BootsPharmacyLogo.tsx`. Everything else belongs in subfolders above.

### Shell vs project

| Layer | Location | Docs |
|-------|----------|------|
| **Shell** (studio tool) | `nav/`, `orchestra/`, `shell/` | `docs/shell/SHELL.md` |
| **Project content** | `projects/<id>/` | `docs/shell/PROJECTS.md` |
| **Journey playback** | `orchestra/` + `projects/<id>/playback/` | `docs/shell/PLAYBACK.md` |

Studio transport bar has three dropdowns: **Project** → **Persona** → **CJM mode**.

Project ids: `brand-subbrand` (e.g. `boots-pharmacy`) or `brand` alone (e.g. `puma`). Use `formatProjectId()` from `@/projects/formatProjectId`.

Active project/persona state: `useProtoStudio()` in `shell/useProtoStudio.ts`. Journey beats live in `projects/<id>/personas/<persona>/journeys.ts`.

---

## Architecture patterns

### 1. Figma shell + JS wiring

- **Do not** rebuild screens as new React components unless explicitly asked.
- **Do** query the exported DOM via `data-name="..."` attributes and attach listeners / mutate attributes.
- Checkbox/radio state uses `data-checkbox-checked`, `data-radio-checked`, `data-toggle-index`, `data-toggle-active`.

### 2. Mounted chrome

| Module | Role |
|--------|------|
| `chrome/protoHeaderMount.tsx` | Clones sticky header; login/Sarah state; flyout; **header avatar** via `import userAvatar` |
| `chrome/protoFooterMount.tsx` | Injects `ProtoFooter` per screen |
| `proto/protoIconHitWire.ts` | Icon-only hit targets + footer Find a store tertiary styling |

Sarah **sidebar** avatar on MA pages (tabs 8–9): `syncMaAccountAvatars()` in `protoHeaderMount.tsx`, called from `App.tsx` on tab change. **Never** rely on CSS `url("/src/assets/...")` for avatars — Figma Make breaks that.

### 3. PLP / filters

| Module | Role |
|--------|------|
| `proto/protoPlpListing.ts` | Bundle data, filter chips, reset, tile links, loader |
| `proto/protoInputControls.ts` | Checkbox/radio click handling + PLP filter panel |
| `proto/protoLocationSearch.ts` | Search fields, clear icons, PLP filter search sync |

Reset filters uses **stroke** trash SVG (class `proto-tertiary-cta__svg--stroke`). Local repo imports `proto-trash-icon.svg?raw`; **Figma Make needs inline SVG string** instead.

### 4. Booking / maps / pricing

| Module | Role |
|--------|------|
| `proto/protoMap.ts` | Location popup + chosen-page map drag/pins |
| `proto/protoOrderPricing.ts` | Booster dose labels, order summary sync |
| `proto/protoPdpRtb.ts` | Quick View cloned PDP stack wiring |
| `AvailabilityTool.tsx` | Shared calendar/store picker lightbox |

### 5. Hub (tab 0)

| Module | Role |
|--------|------|
| `hub/protoHubContent.ts` | All copy, figures, deck URLs, credits |
| `hub/ProtoHubPage.tsx` | Layout renderer |
| `hub/ProtoHubViewport.tsx` | Wrapper for hub inside scroll area |

**Hub copy rules:**

- Self-guided **onboarding** tone, not a live demo script or presenter voice.
- No em dashes, en dashes, or arrow characters in hub copy.
- Credits: built with **UXDS and X Suite** (UX Department toolkit), prepared by Igor Yakushchenko, © Astound Digital. **Not** “Astound Digital tools” as a corporate product.
- Figma deck links: Persona Deck + Visual Flow Deck node IDs in `protoHubContent.ts`.

---

## Do not modify (unless user explicitly requests)

| Area | Why |
|------|-----|
| `nav/protoNavZoom.ts` | Zoom immunity for tab strip; hours to recover if broken |
| `nav/protoNavPanel.css` layout / positioning | Same — only safe change: `z-index` on `.proto-nav-panel-host` for lightboxes |
| `nav/ProtoNavPanel.tsx` nav layout | Same |
| `src/imports/Frame1000007317/` | Figma export; edit only when design export changes |
| `src/app/components/` | Generic UI kit; unrelated to prototype behaviour |
| `package.json`, `vite.config.ts`, `main.tsx` | Make sync stability |

---

## Styling

- Global prototype styles split across `globals-hub.css`, `globals-chrome.css`, `globals-screens.css`, imported from `globals.css`.
- **CTA behaviour:** primary navy `#012169`, secondary teal border `#afccca`, tertiary `.proto-tertiary-cta` (no pill wash).
- **Screen scoping:** `.proto-viewport > div > div:nth-child(N)` where `N` = `childIndex`.
- PLP / hub / MA classes prefixed `proto-plp-*`, `proto-hub-*`, `proto-ma-*`.

Prefer extending existing selectors over new global rules that might bleed across screens.

---

## Figma Make sync

Make has a **file count limit** at `src/app/` root — use subfolders (`hub/`, `nav/`, `popups/`, `chrome/`, `proto/`).

Critical Make constraints:

1. **Import paths** must match subfolders (`@/app/proto/protoPlpListing`, not `@/app/protoPlpListing`).
2. **No** `@/assets/*.svg?raw` — inline SVG in TS for icons.
3. **`user-avatar.jpg`** must exist in `src/assets/` for Sarah avatars.
4. **`App.tsx` is huge** — Make may warn; avoid growing it without extracting to `proto/`.

See `docs/FIGMA_MAKE_SYNC.md` for zip-based sync; verify paths against this file’s layout section.

---

## Common tasks

| Change hub copy / deck links | `projects/boots-pharmacy/hub/protoHubContent.ts` |
| PLP bundles / filters | `projects/boots-pharmacy/data/protoPlpListing.ts`, `globals-screens.css` |
| New screen behaviour | `projects/boots-pharmacy/wire/BootsPharmacyProjectView.tsx` + `dom/*.ts` |
| Header login / avatar | `projects/boots-pharmacy/chrome/protoHeaderMount.tsx` |
| Footer links | `projects/boots-pharmacy/chrome/protoFooterContent.ts` |
| Nav tab labels | `projects/boots-pharmacy/screens/protoScreens.ts` |
| **Journey beats / scripts** | `personas/.../journeys.ts` + `playback/*.ts` — see `docs/shell/PLAYBACK.md` |

**Minimize scope.** This codebase favours small, targeted diffs. Do not refactor `App.tsx` or the Figma export without a clear ask.

---

## Git

- **Do not commit** unless the user asks.
- **Do not force-push** `main`.
- Run `npm run build` before suggesting a push.
- Recent commit style: imperative one-liner + optional body explaining *why*.

---

## Sanity checklist (after substantive changes)

- [ ] `npm run build` passes
- [ ] `npm run test` passes (required after journey/playback/script edits)
- [ ] Tab 0: hub loads, credits, deck links, Open UX Concept CTA
- [ ] Tab 3 (PLP): bundles, filters, chips, reset icon (stroke not solid square), tile → PDP
- [ ] Tabs 1–2: agentic home + chat
- [ ] Tabs 5–7: booking funnel
- [ ] Tabs 8–9: MA pages, Sarah sidebar + header avatars when logged in
- [ ] Nav zoom (Ctrl+/−) still keeps tab strip at 1×

### Playback smoke (after journey/script changes — full list in `docs/shell/PLAYBACK.md`)

- [ ] Agentic CJM: Play from start through chat → availability → book → MA
- [ ] Traditional CJM logged in: login beat skipped
- [ ] Step forward/back on 3 beats — touchpoint label tracks
- [ ] Hard refresh on tab 3+ — tab preserved

---

## Quick reference — `PROTO_SCREENS` tabs

| Tab | Label | childIndex |
|-----|-------|------------|
| 0 | Onboarding (hub) | — |
| 1 | Agentic home | 11 |
| 2 | Agentic chat | 10 |
| 3 | PLP | 9 |
| 4 | PDP | 8 |
| 5 | Book location | 7 |
| 6 | Book date/time | 4 |
| 7 | Confirmation | 3 |
| 8 | Appointment History | 2 |
| 9 | Appointment Details | 1 |
