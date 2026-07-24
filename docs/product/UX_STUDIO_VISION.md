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

PO concepts are often **early and messy** (Legacy feeds, static strips, partial UXDS). Legacy HTML is throwaway. Fully structured UXDS pages exist but are **rarely** the Studio feed.

### Locked page stack (2026-07-19)

Studio pages = **React + UXDS** (agent upgrades). Input Figma need **not** already be DS-perfect. Rules: [CONCEPT_INTAKE.md](./CONCEPT_INTAKE.md).

### Target workflow

1. **PO feeds a concept** — often a rough strip / Legacy-class frame (may ignore variables).
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

- **Product Owner (CX Director)** — product intent, Figma/UXDS truth, accept/reject, veto — and specifically the judgment calls no export or gate can resolve (touchpoint→screen mapping, what "good enough" means for a draft). Does not pick tech or sprint order. See "The distinctive claim" above.
- **Cursor agent (commander)** — decides tech direction and next steps; builds; documents; only asks PO for assets/judgments.
- **Studio engine** — transport contract, diagnostics, robo-cursor, playlist sync.

Full rules: [COMMAND_DOCTRINE.md](./COMMAND_DOCTRINE.md).

---

## Concept page guidelines (agent must follow)

- Register screens in `screens.ts` with stable `childIndex`.
- Wire interactive targets with `data-name` / `data-studio-*` (recording + robo-cursor depend on this).
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
5. ✅ Recording UI (save/load files without MCP) — engine
6. ✅ Thin UXDS CSS token bridge + interaction kits + Boots styleguide (Availability Tool enrichment)
7. ✅ Pilot: Boots screens rebuilt React + UXDS (PLP/PDP hard-green; Home/Chat in flight)
8. 🔲 **Agent testing mid-flight QA shell** — not a dull helper log; see [PAINPOINTS.md](./PAINPOINTS.md) PP-10
9. 🔲 **Playback reliability + diag-first** — PLAYBACK_DIAG / CJM micro-fails / hub≠journey-start (PP-01…PP-08)
10. 🔲 Figma → Project scaffold command
11. 🔲 X-Suite → Studio: when PO shares export, agent analyzes → pages (UXDS/templates/names) → REC new CJM ([X_SUITE_INTEGRATION.md](./X_SUITE_INTEGRATION.md)); automated import later
12. 🔲 Compiler: recording → journey beat proposals
13. 🔲 Multi-project / persona packaging for client delivery

**PO painpoints (trackable COMPLETE):** [PAINPOINTS.md](./PAINPOINTS.md) — playback reliability, diag-first, CJM micro-fails, hub vs journey-start, fuchsia/step2/retreat scroll, agentic full chat, control-panel stale green, insufficient logging, team listening, agent-testing overlay vision.

---

## Positioning (one line)

**UX Studio turns design-system concepts into playable journey maps — built and extended with AI, not hand-coded throwaway prototypes.**

## The distinctive claim (PO, 2026-07-24 — read before pitching this to anyone)

**This product does not phase out the human. It keeps the human exactly where UX expertise is genuinely useful, and automates the rest.** The UX designer's role shifts from doing (hand-coding prototypes, manually catching every bug, manually mapping every screen) to **directing** — a CX Director narrating intent to an agent, which drafts pages/journeys precise enough that the designer picks up from a real starting point, not a blank page or a static mockup.

This is not a slogan — it's an architectural commitment, and [CX_CONVEYOR.md](./CX_CONVEYOR.md) § "The determinism boundary" is where it's enforced: every gap in this system is sorted into either *engine territory* (machine-checkable, gated, no human needed once built) or *judgment territory* (structurally requires a UX call, permanently — e.g. mapping a free-text touchpoint name to the right real screen). The line is drawn deliberately, not by what's convenient to automate yet. Selling this as "fully autonomous" would be wrong and would misrepresent what the architecture actually guarantees — the honest pitch is *"a UX designer operating as CX Director, directing an agent that clears the mechanical floor so their time goes to judgment, not typing."*
