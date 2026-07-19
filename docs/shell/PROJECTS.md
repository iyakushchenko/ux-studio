# Adding a project

How to register a new demo project in the Proto Studio shell.

---

## 1. Create the project folder

```
src/projects/
  <project-id>/
    index.ts              # exports PROJECT constant
    styleguide/           # brand DELTA — colors, logos, small theme.css
      README.md
      theme.css
      assets/             # logos (optional)
    personas/
      <persona-id>/
        index.ts            # persona definition + hooks
        journeys.ts         # ProtoJourneyDefinition beats
```

**Brand delta:** concepts bring their own primaries/logos. Capture them in `styleguide/` so projects do not all share one generic UXDS look. See [../product/PROJECT_STYLEGUIDE.md](../product/PROJECT_STYLEGUIDE.md).

**Project id rules** (use `formatProjectId` from `@/projects/formatProjectId`):

| Brand | Sub-brand | Id |
|-------|-----------|-----|
| Boots | Pharmacy | `boots-pharmacy` |
| Boots | (none) | `boots` |
| Puma | (none) | `puma` |

```ts
// src/projects/puma/index.ts
import { formatProjectId } from "@/projects/formatProjectId";
import { EXAMPLE_PERSONA } from "./personas/example-user";

export const PUMA_PROJECT: ProtoProjectDefinition = {
  id: formatProjectId("puma"),
  brand: "puma",
  label: "Puma",
  personas: [EXAMPLE_PERSONA],
  defaultPersonaId: EXAMPLE_PERSONA.id,
};
```

---

## 2. Define personas and journeys

Each persona owns one or more `ProtoJourneyDefinition` entries (CJM modes).

```ts
// personas/example-user/journeys.ts
export const AGENTIC_JOURNEY: ProtoJourneyDefinition = {
  id: "agentic-cjm",
  label: "Agentic CJM",
  beats: [
    { id: "home", label: "Home", kind: "tab-landing", protoTab: 1 },
    // ...
  ],
};

// personas/example-user/index.ts
export const EXAMPLE_PERSONA: ProtoPersonaDefinition = {
  id: "example-user",
  label: "Example User",
  journeys: [AGENTIC_JOURNEY],
  journeyHooks: {
    shouldSkipBeat: (beat, { headerLoggedIn }) => {
      // optional — skip beats based on runtime context
      return false;
    },
  },
};
```

Beat kinds:

| Kind | Meaning |
|------|---------|
| `tab-landing` | Navigate to a proto tab; optional cursor script |
| `screen-frames` | Step through revealed frames (`scenarioId`) |
| `overlay` | Availability tool or other overlay script |

Script fields (`homeScript`, `availScript`, `bookScript`, `tabScript`) dispatch via the active project's `playback` module registered on `ProtoProjectDefinition` — today these are Boots-shaped unions; generalise when adding non-Boots projects.

---

## 3. Register in the project index

```ts
// src/projects/registry.ts
import { PUMA_PROJECT } from "@/projects/puma";

export const PROTO_PROJECTS = [
  BOOTS_PHARMACY_PROJECT,
  PUMA_PROJECT,
];
```

The project dropdown populates automatically from `PROTO_PROJECTS`.

---

## 4. Wire screens, content, and product view

Each project exposes:

| Module | Purpose |
|--------|---------|
| `content.ts` | Screens, scenarios, hub, `ProjectFrame` |
| `wire/` | Product view component registered as `wireComponent` |
| `playback/` | Journey script runners + `abortAll()` |

Boots Pharmacy registers its wire in `index.ts`:

```ts
import { BootsPharmacyProjectView } from "./wire";

export const BOOTS_PHARMACY_PROJECT: ProtoProjectDefinition = {
  // ...
  wireComponent: BootsPharmacyProjectView,
};
```

The shell (`App.tsx`) calls `getProjectWire(projectId)` and passes a `ProtoProjectShellBridge`. Projects without a wire (e.g. Puma today) render `ProtoProjectPlaceholder`.

```
src/projects/<project-id>/
  content.ts
  playback/
  wire/               # BootsPharmacyProjectView.tsx
```

---

## 5. Persona dropdown behaviour

- Options come from `project.personas`
- Switching persona resets beat index and stops playback
- Each persona can define different journeys and `journeyHooks`
- Default persona is `project.defaultPersonaId`

---

## Reference: boots-pharmacy

The first registered project:

```
src/projects/boots-pharmacy/
  index.ts              # wireComponent + playback
  content.ts            # screens, scenarios, hub, Figma frame
  touchpoints.ts        # studio popup timeline inserts
  wire/                 # BootsPharmacyProjectView — DOM, popups, effects
  personas/
    sarah-jenkins/
      index.ts
      journeys.ts       # agentic + traditional beats
```

Shared chrome primitives (`ProtoCloseIcon`, `ProtoIconHit`, …) remain in `src/app/chrome/` and are imported by project modules.
