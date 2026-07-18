# Journey playback

How the Proto Studio journey engine works, how to change scripts safely, and what to verify after every playback-related change.

See also: [SHELL.md](./SHELL.md) (architecture), [PROJECTS.md](./PROJECTS.md) (registering projects/personas).

---

## Architecture (30-second map)

```
journeys.ts          Beat timeline (declarative)
       ↓
useProtoJourneyPlayback   Shell engine — play, step, dwell, skip, beat-enter
       ↓
playback/index.ts    Dispatches script IDs → runners
       ↓
playback/*.ts        Imperative DOM/cursor actions (project-specific)
```

| Layer | Path | Owns |
|-------|------|------|
| **Beat definitions** | `projects/<id>/personas/<persona>/journeys.ts` | Timeline, labels, `protoTab`, script IDs |
| **Script ID types** | `app/orchestra/types.ts` | `HomeScriptId`, `TabScriptId`, `BookScriptId`, … |
| **Engine** | `app/orchestra/useProtoJourneyPlayback.ts` | Transport, beat advance, scenario handoff |
| **Scenario frames** | `app/nav/useProtoScenarioPlayback.ts` | Chat frame stepping (`screen-frames` beats) |
| **Dispatch** | `projects/<id>/playback/index.ts` | `runHomeScript`, `runTabScript`, `abortAll`, … |
| **Runners** | `projects/<id>/playback/*.ts` | DOM queries, demo cursor, timeouts |
| **Wire DOM** | `projects/<id>/wire/*` | Popups, scroll, sticky chrome — scripts depend on this |

The shell **never** imports project script runners directly. It calls `project.playback` from the registry.

---

## Beat kinds

| Kind | Meaning | Typical fields |
|------|---------|----------------|
| `tab-landing` | Navigate to a prototype tab; optional cursor script | `protoTab`, `tabScript`, `bookScript`, `homeScript`, `dwellMs` |
| `screen-frames` | Step through revealed frames on one screen | `protoTab`, `scenarioId` |
| `overlay` | Availability tool or other overlay script | `availScript`, `onEnter` |

**`protoTab`** is the **display tab number** (1–9), **not** `childIndex`. Map via `protoTabToIndex()` in the project's `screens/protoScreens.ts`.

---

## How to change an existing script

1. Find the beat in `personas/<persona>/journeys.ts` — note its `homeScript` / `tabScript` / etc.
2. Open the matching runner in `playback/`:
   - `homeScript` → `sitePilotHome.ts`
   - `availScript` → `availability.ts`
   - `bookScript` → `book.ts`
   - `tabScript` → `traditional.ts`
   - `onEnter` actions → `playback/index.ts` → `runBeatAction`
3. Edit DOM selectors / timing inside the runner only.
4. Run **`npm run test`** then the **manual smoke checklist** below.

Do **not** change `useProtoJourneyPlayback.ts` unless the transport behaviour itself needs to change.

---

## How to add a new script

1. **Add the script ID** to the union in `app/orchestra/types.ts` (e.g. `TabScriptId`).
2. **Implement** `run…Script` case in the appropriate `playback/*.ts` file.
3. **Assign** the script ID on a beat in `journeys.ts`.
4. **Add a test case** in `personas/.../__tests__/journeys.test.ts` if the beat uses a new ID (integrity tests will catch missing wiring).
5. Run **`npm run test`** + manual smoke checklist.

---

## How to add or reorder beats

1. Edit `journeys.ts` — keep beat `id` values **unique within the journey**.
2. Set `protoTab` when the beat should land on a specific screen.
3. Use `dwellMs` on `tab-landing` beats for auto-advance during Play (default ~2800 ms).
4. For `screen-frames`, ensure `scenarioId` exists in the project's `screens/scenarios.ts`.
5. Run **`npm run test`** — journey integrity tests validate IDs, tabs, and script references.

**Skip beats:** persona `journeyHooks.shouldSkipBeat` (e.g. skip login when `headerLoggedIn`). Test skip logic in unit tests when changing hooks.

---

## Fragile coupling (read before editing)

These seams caused post-extraction regressions. Touch with care:

| Seam | Risk |
|------|------|
| **Shell ↔ wire `apiRef`** | Login/popup state lags one frame; affects `shouldSkipBeat` and touchpoint labels |
| **Beat-enter vs restored tab** | Engine skips initial `goToTab` on mount; manual tab + Play still navigates |
| **DOM `childIndex` vs tab number** | CSS/effects use `nth-child(childIndex)`; scripts query `data-name` — Figma export changes break silently |
| **`overflow: hidden` on screen** | Breaks `position: sticky` (Site Pilot bar on chat) |
| **Sticky/header effects** | Must re-run when `current` changes to chat tab, not only on mount |
| **Chat scenario frames** | `minVisibleFrames`, `playbackStepMs`, finale hooks in `App.tsx` + `sitePilotChat.ts` |

---

## Automated guardrails

```bash
npm run test          # unit + journey integrity (run after any playback change)
npm run build         # TypeScript compile (required before push)
```

Tests live next to the code they protect:

| Test file | Guards |
|-----------|--------|
| `app/orchestra/__tests__/journeyUtils.test.ts` | Beat stepping, skip logic, first/last playable |
| `app/orchestra/__tests__/resolveActiveScreenScenario.test.ts` | Chat scenario activation |
| `projects/boots-pharmacy/screens/__tests__/protoScreens.test.ts` | Tab ↔ index mapping |
| `projects/boots-pharmacy/personas/.../__tests__/journeys.test.ts` | Beat IDs, script IDs, `protoTab` range |

**What tests do not cover:** live DOM scripts, cursor animation timing, Figma export drift. Those require the manual checklist.

---

## Manual smoke checklist (required after playback changes)

Run `npm run dev`, then:

### Quick (any script/timeline change)

- [ ] `npm run test` passes
- [ ] `npm run build` passes
- [ ] Transport: **Step forward** and **step back** on 3 consecutive beats — tab and touchpoint label track
- [ ] **Play** for ~10 s on current journey — no stall, no unexpected tab jump

### Agentic CJM (full path — before demos)

- [ ] Jump to start → **Play** through: home query → chat frames → availability (date → time → book) → book date/time/reserve → confirmation → appointment history → details
- [ ] Chat finale opens availability overlay; closing availability retreats scenario frames
- [ ] Composer send during chat pauses/resumes scenario correctly

### Traditional CJM (full path — before demos)

- [ ] Jump to start → **Play** through: PLP tile click → PDP Book now → login (if logged out) → **Book Step 1: cursor clicks location search field** → choose pharmacy → Continue → book date/time/reserve → confirmation → MA

### Persistence / navigation

- [ ] Hard refresh on tab 3+ — **same tab** restored (not forced to Agentic home)
- [ ] Switch persona or CJM mode — beat resets, playback stops
- [ ] Agentic chat: Site Pilot secondary header **sticks** below main header when scrolling

---

## File reference (Boots Pharmacy)

```
src/projects/boots-pharmacy/
  personas/sarah-jenkins/
    journeys.ts              # AGENTIC_CJM_JOURNEY, TRADITIONAL_CJM_JOURNEY
    index.ts                 # journeyHooks.shouldSkipBeat
  playback/
    index.ts                 # BOOTS_PHARMACY_PLAYBACK dispatch
    sitePilotHome.ts         # homeScript
    sitePilotChat.ts         # chat scenario hooks (finale, thinking)
    availability.ts          # availScript
    book.ts                  # bookScript
    traditional.ts           # tabScript
  screens/
    protoScreens.ts          # PROTO_SCREENS, protoTabToIndex
    scenarios.ts             # site-pilot-chat config
  wire/
    BootsPharmacyProjectView.tsx   # DOM effects scripts rely on
```

---

## When to extend the engine vs the project

| Change | Where |
|--------|-------|
| New cursor step on existing screen | `playback/*.ts` + `journeys.ts` |
| New beat kind or transport behaviour | `app/orchestra/` (shell) |
| New project with different screens | New `projects/<id>/` + register in `registry.ts` |
| Popup open/close from script | `JourneyRuntime` in `App.tsx` + wire refs |

Keep shell changes rare. Prefer project-local script runners.
