# Proto Studio Shell

The **shell** is the reusable demo product — the control room around any UX concept prototype. It is **not** tied to Boots, Sarah, or any single Figma export.

Content (screens, scenarios, personas, DOM wiring) lives in **`src/projects/`** and is loaded by the shell at runtime.

---

## What belongs in the shell

| Path | Responsibility |
|------|----------------|
| `src/app/nav/` | Tab strip, zoom, transport controls (cassette deck), studio dropdowns |
| `src/app/orchestra/` | Journey playback engine, beat types, script dispatch |
| `docs/shell/PLAYBACK.md` | How to change scripts + smoke checklist |
| `docs/shell/RECORDING.md` | REC capture / replay / compile |
| `docs/shell/AGENTIC_RECORDING.md` | Future agentic recording playbook (persona artifacts → CJM → record / UX CONCEPT gaps) |
| `src/app/shell/` | Studio state (`useStudio`) — project / persona / CJM selection; URL sync ([URL.md](./URL.md)) |
| `src/app/scenario/scenarioEngine.ts` | Generic frame-reveal scenario runner |
| `src/app/scenario/demoCursor.ts` | Shared demo cursor + scroll helpers |

## What belongs in a project

| Path | Responsibility |
|------|----------------|
| `src/projects/<project-id>/` | Project metadata, personas, journey beats |
| `src/projects/<project-id>/personas/<persona-id>/` | Persona journeys + playback hooks |
| `src/projects/<project-id>/wire/` | Project wire view — DOM effects, popups, frame (Boots: `BootsPharmacyProjectView`) |
| `src/imports/` | Figma export — **one tree per project** eventually |
| `src/app/App.tsx` | Shell host — nav, studio, orchestra; delegates to project `wireComponent` |

---

## Studio dropdowns

Three selectors appear in the transport bar (left of the touchpoint label):

1. **Project** — brand or brand + sub-brand (`boots-pharmacy`, `puma`, …)
2. **Persona** — journey actor within the project (`sarah-jenkins`, …)
3. **CJM mode** — journey variant (`agentic-cjm`, `traditional-cjm`)

Selection is persisted in `sessionStorage`:

| Key | Value |
|-----|-------|
| `studio-project` | Active project id |
| `studio-persona:<projectId>` | Active persona for that project |
| `proto-orchestra-mode` | Active CJM mode |

Changing project or persona resets beat index and stops playback.

**Re-selecting the active CJM** (clicking the same mode again) also restarts: playback resets, popups close, and the prototype tab jumps to the first beat of that journey (respecting skip hooks such as logged-in login skip).

---

## Data model

```ts
ProjectDefinition {
  id: "boots-pharmacy"   // formatProjectId("boots", "pharmacy")
  brand: "boots"
  subbrand?: "pharmacy"
  label: "Boots Pharmacy"
  personas: PersonaDefinition[]
  defaultPersonaId: "sarah-jenkins"
}

PersonaDefinition {
  id: "sarah-jenkins"
  label: "Sarah Jenkins"
  journeys: JourneyDefinition[]   // agentic + traditional
  journeyHooks?: { shouldSkipBeat? } // e.g. skip login when logged in
}
```

Project ids use `formatProjectId(brand, subbrand?)`:

- With sub-brand: `boots-pharmacy`, `boots-opticians`
- Without: `boots`, `puma`

---

## How App.tsx wires the shell

```tsx
const studio = useStudio();
const { project, persona, modeId, journey, beatIndex } = studio;

const shouldSkipBeat = createShouldSkipBeat(persona, headerLoggedIn);

useJourneyPlayback({ journey, shouldSkipBeat, ... });
buildStudioTouchpointPlaylist(journey, frames, { shouldSkipBeat });
resolveActiveScreenScenario({ journeys: persona.journeys, modeId, ... });
```

The shell never imports project-specific beat ids or script modules directly — only the active `persona` from the registry.

---

## Registry

All projects are listed in `src/projects/registry.ts`:

```ts
export const STUDIO_PROJECTS = [BOOTS_PHARMACY_PROJECT, PUMA_PROJECT];
```

Add a new project by creating its folder and appending to this array. See [PROJECTS.md](./PROJECTS.md).

---

## Extraction status

| Done | Pending |
|------|---------|
| Project / persona types + registry | Dynamic project import / code-splitting |
| Journey beats + personas in `projects/boots-pharmacy/` | Generalise script ID types per project |
| Generic `journeyUtils`, `shouldSkipBeat`, `playback.abortAll()` | Move `useScrollFill` into shell or project util |
| Studio dropdowns; `StudioNavPanel` screens from project | Puma wire + Figma frame |
| `useStudio` + `getProjectContent()` + `getProjectWire()` | Delete legacy duplicate trees under `src/app/hub/`, `src/app/popups/` (export script still references them) |
| **2a–2f:** data, dom, screens, playback, chrome, hub, popups, overlays, Figma frame | |
| **Phase 3:** `BootsPharmacyProjectView` wire + slim `App.tsx` shell host | |
| **Phase 4:** Per-project nav/hub via `studioNavStorage.ts`; project switch resets tab | |
| **Phase 5:** Playback abort imports point at `projects/boots-pharmacy/playback/`; shell keeps `scenarioEngine`, `demoCursor` | |

`App.tsx` is the shell host: studio state, orchestra playback, `StudioNavPanel`, and `getProjectWire(projectId)`. Boots product DOM, popups, and effects live in `projects/boots-pharmacy/wire/BootsPharmacyProjectView.tsx`. Projects without `wireComponent` (e.g. Puma) render `ProjectPlaceholder`.

**Playback changes:** see [PLAYBACK.md](./PLAYBACK.md). Run `npm run test` after editing beats or scripts.
