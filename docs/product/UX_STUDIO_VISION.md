# UX Studio — product vision

## What we're building

**UX Studio** is a control room for clickable UX concepts. The business goal: ship journey maps (CJMs) and deep scenario exploration fast — not polished production sites.

Think **GeoCities for enterprise UX**: anyone can assemble concept pages, wire journeys, record scenarios, and iterate with a Cursor agent — without waiting on a full design-to-code pipeline.

---

## The Figma → Studio pipeline

### Problem

Pages bootstrapped from **Figma Make** are a starting point only. Layout, HTML, CSS, and JS are throwaway — not production quality.

### Target workflow

1. **Design system** — real concepts are built in Figma using modules, master components, and tokens.
2. **Concept ready** — one screen or flow is signed off as the UI requirement.
3. **Cursor agent** — takes the Figma source (or design-system exports) and **recreates the concept inside a Project** in UX Studio.
4. **Guidelines** — agent always follows internal rules for concept pages: `data-name` wiring, proto tabs, touchpoints, playback scripts, stable selectors for recording.
5. **CJM layer** — once pages exist in a project, define beats, journeys (agentic / traditional), and scenarios.
6. **Deep scenarios** — record, replay, branch, and extend journeys with the agent; no cap on scenario count per concept.

```
Figma design system  →  Cursor rebuild in Project  →  Journeys + CJMs  →  Record / replay / export
```

---

## Two layers of data

| Layer | What it is | Format today |
|-------|------------|--------------|
| **Journey definition** | Beat blueprint — scripts, tabs, dwell | `journey.json` v1, `journeys.ts` in repo |
| **Recording** | Captured walkthrough — transport, clicks, touchpoints | `recording.json` v1 |

Export both. Compiler (future) turns recordings into journey proposals.

---

## Agent collaboration model

- **Human** — picks project, persona, CJM mode, steers concept quality in Figma.
- **Cursor agent** — builds/refactors project pages, fixes playback, runs MCP smoke, exports journey bundles, records scenarios.
- **Studio engine** — enforces transport contract, diagnostics, robo-cursor, playlist sync.

The agent is not a one-shot code generator; it is a **standing partner** for each concept lifecycle.

---

## Concept page guidelines (agent must follow)

- Register screens in `protoScreens.ts` with stable `childIndex`.
- Wire interactive targets with `data-name` / `data-proto-*` (recording + robo-cursor depend on this).
- One beat per meaningful interaction for frame stepping.
- Popups and overlays get playlist touchpoint keys (`popup:*`).
- Director scripts live in project `playback/` — shell routes by beat metadata, not beat id hacks.
- Browse mode vs journey mode: never run playback guards or cursor QA in browse.

See [PROJECTS.md](../shell/PROJECTS.md), [PLAYBACK.md](../shell/PLAYBACK.md), [RECORDING.md](../shell/RECORDING.md).

---

## Near-term product milestones

1. ✅ Journey JSON export/import (both Boots CJMs)
2. ✅ Recording foundation + journey catalog on session
3. 🔲 Figma → Project scaffold command (design system in, concept pages out)
4. 🔲 Recording UI (save/load files without MCP)
5. 🔲 Compiler: recording → journey beat proposals
6. 🔲 Multi-project / persona packaging for client delivery

---

## Positioning (one line)

**UX Studio turns design-system concepts into playable journey maps — built and extended with AI, not hand-coded throwaway prototypes.**
