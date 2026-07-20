# Agentic recording (potential / future)

**Status:** playbook for a **future** agent capability — **not** a claim that Studio ships fully automated agentic recording today. Manual REC deck, MCP helpers, and Add-as-CJM are shipped; this document describes an intended **agent-driven** workflow the PO may enable later.

Cross-link: [RECORDING.md](./RECORDING.md) (shipped capture / replay / compile).

---

## Intent

When the PO wants a new CJM without hand-driving every click:

1. PO provides a **link to persona artifacts** (research, journey maps, Figma Make, brief docs, etc.).
2. The agent **derives a CJM** from those artifacts (touchpoints, screens, decisions, CTAs).
3. The agent **creates a recording** of that CJM on **pages already available** in the Studio project (`?project=` / `?screen=`).
4. If a needed page/screen is **not mounted yet**, the agent must **stop inventing UI** and report that **UX CONCEPT(s) will be required**, naming them explicitly.

---

## Agent playbook (proposed)

### Inputs (PO)

| Input | Notes |
|-------|--------|
| Persona artifact link(s) | Research pack, journey PDF/FigJam, Make file, brief |
| Target project | e.g. `boots-pharmacy` |
| Path flavor | Agentic vs Traditional (or new free CJM) |
| Accept / reject | Product call on derived CJM + recording quality |

### Steps

1. **Ingest artifacts** — read the linked persona materials; extract goals, steps, screens, and decision points.
2. **Draft CJM** — propose beats / touchpoints aligned with Studio URL screens (`screenId` = folder name). Prefer existing screens in the project registry.
3. **Gap check (HARD)** — for each draft beat, resolve whether the screen exists in the Studio project wire:
   - **Available** → include in the recording plan.
   - **Missing** → do **not** fake the page. List required concepts:
     - `UX CONCEPT 1: <Concept name>`
     - `UX CONCEPT 2: <Concept name>`
     - …
4. **Record on available pages** — only when CREATE NEW CJM (or equivalent new path) is selected; use REC start → interact → Stop → Add as CJM (or MCP recording APIs). Stay on `http://localhost:5173/` (fixed localhost rule).
5. **Hand back** — recording JSON / new CJM label + any **UX CONCEPT** gap list. PO accepts or rejects.

### Output contract (when gaps exist)

```text
Derived CJM: <title>
Recorded on available screens: <screenId…>
UX CONCEPT(s) will be required:
  1. <Concept name>
  2. <Concept name>
  3. <Concept name>
Blocked beats (not recorded): <brief list>
```

Honesty rule: under-match over invent. No invented hover, loaders, or screens not in Make/project.

---

## What is shipped today (do not over-claim)

| Capability | Today |
|------------|--------|
| Manual REC deck + STEPS | Yes — [RECORDING.md](./RECORDING.md) |
| Download `.recording.json` / Add as CJM | Yes |
| Export selected saved journey JSON (Download on saved CJM) | Yes (control-room Download) |
| MCP `__studioStartRecording` / export / import | Yes |
| Auto-derive CJM from persona artifact links | **No** — this playbook |
| Auto-record full CJM across missing screens | **No** — blocked by UX CONCEPT gap report |

---

## Related

- [RECORDING.md](./RECORDING.md) — capture, replay, compile
- [PLAYBACK.md](./PLAYBACK.md) — journey engine
- [URL.md](./URL.md) — `project` / `screen` / `experience` / `cjm`
- [CONCEPT_INTAKE.md](../product/CONCEPT_INTAKE.md) — bringing new UX concepts into Studio
