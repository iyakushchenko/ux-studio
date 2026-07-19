# UX Studio — product vision

**Repo:** [github.com/iyakushchenko/ux-studio](https://github.com/iyakushchenko/ux-studio) · **Demo:** [iyakushchenko.github.io/ux-studio](https://iyakushchenko.github.io/ux-studio/)

This repository **is** the engine. **`src/projects/boots-pharmacy/`** is the first reference project (test rabbit) — not the product name.

**Canonical disk path:** `E:\UX\ux-studio` (abandon all `UXCJM-*` copies).  
**Roles & A–Z:** [PRODUCT_OWNER_BRIEF.md](./PRODUCT_OWNER_BRIEF.md) · **Intake:** [CONCEPT_INTAKE.md](./CONCEPT_INTAKE.md) · **Page stack:** [PAGE_BUILD_CONTRACT.md](./PAGE_BUILD_CONTRACT.md)

**UX Studio** is a control room for clickable UX concepts. Early purpose: **discovery, ideation, solution proofing, hypothesis validation** — plus CJMs/scenarios. Not production polish.

Think **GeoCities for enterprise UX**: rough concepts in → playable proof out — agent fills the design-system gap.

---

## The Figma → Studio pipeline

### Problem

PO concepts are often **early and messy** (Make feeds, static strips, partial UXDS). Make HTML is throwaway. Fully structured UXDS pages exist but are **rarely** the Studio feed.

### Locked page stack (2026-07-19)

Studio pages = **React + UXDS** (agent upgrades). Input Figma need **not** already be DS-perfect. Rules: [CONCEPT_INTAKE.md](./CONCEPT_INTAKE.md).

### Target workflow

1. **PO feeds a concept** — often a rough strip / Make-class frame (may ignore variables).
2. **Agent fills the gap** — React pages using UXDS tokens + closest `component.*` / `module.*`, preserving intent.
3. **Studio wiring** — `data-name`, screens, touchpoints, playback.
4. **CJM layer** — beats, journeys (agentic / traditional), scenarios.
5. **Deep scenarios** — record, replay, branch; no cap on scenario count.

```
Early concept (messy OK)  →  Agent upgrades to React+UXDS pages  →  CJMs / record / validate
```

---

## Two layers of data

| Layer | What it is | Format today |
|-------|------------|--------------|
| **Journey definition** | Beat blueprint — scripts, tabs, dwell | `journey.json` v1, `journeys.ts` in repo |
| **Recording** | Captured walkthrough — transport, clicks, touchpoints | `recording.json` v1 |

Export both. Compiler (future) turns recordings into journey proposals.

---

## Collaboration model (command doctrine)

- **Product Owner** — product intent, Figma/UXDS truth, accept/reject, veto. Does not pick tech or sprint order.
- **Cursor agent (commander)** — decides tech direction and next steps; builds; documents; only asks PO for assets/judgments.
- **Studio engine** — transport contract, diagnostics, robo-cursor, playlist sync.

Full rules: [COMMAND_DOCTRINE.md](./COMMAND_DOCTRINE.md).

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
3. ✅ Workspace + product docs (PO brief, page contract, command doctrine, Summarizer direction)
4. ✅ UXDS Larkin linked + variables inventoried (`docs/uxds/`); X-Suite integration intent documented
5. 🔲 Recording UI (save/load files without MCP) — engine
6. 🔲 UXDS CSS token bridge + pilot: one Boots screen in React + UXDS
7. 🔲 Figma → Project scaffold command
8. 🔲 X-Suite import seam (persona / IA / CJM baseline → Studio journeys)
9. 🔲 Compiler: recording → journey beat proposals
10. 🔲 Multi-project / persona packaging for client delivery

---

## Positioning (one line)

**UX Studio turns design-system concepts into playable journey maps — built and extended with AI, not hand-coded throwaway prototypes.**
