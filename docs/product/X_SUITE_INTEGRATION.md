# X-Suite (Summarizer / Experience Suite) → UX Studio

**Status:** Strategic intent locked (Product Owner, 2026-07-19). Not built yet.  
**Commander note:** Design for this seam early; do not block recording UI or UXDS React pilots on full integration.

---

## What X-Suite is

**Summarizer** (repo `E:\UX\Summarizer`, brand direction **Experience Suite / X-Suite**) is the Figma-side workstation that produces:

- Personas  
- CJMs / evaluation artefacts  
- IA (information architecture) models  
- Product data placements into UXDS variables  
- Decks / slides / XE notes  

It writes into the same UXDS organism — especially collection **`setup`** (`IA/*`, `persona/*`, `brand/*`, `project/*`). See `E:\UX\Summarizer\docs\UXDS_ORGANISM_OVERVIEW.md`.

---

## What UX Studio is (relative to X-Suite)

| X-Suite | UX Studio |
|---------|-----------|
| Authors structure & content **in Figma** | Plays & records journeys **in the browser engine** |
| Places IA/persona into UXDS variables | Rebuilds screens in React + UXDS; runs CJMs/scenarios |
| Post-audit / deck assembly | Concept clickable + journey control room |

They share **UXDS** as the design/content spine. They are not the same app.

---

## Future integration (baseline for agentic CJMs)

**Intent:** X-Suite outputs become a **baseline** for semi-automated agentic CJMs in UX Studio.

Planned seam (high level — refine when we build it):

```
X-Suite export (persona + IA + CJM sketch)
        ↓
UX Studio import (journey.json / persona pack / content map)
        ↓
Agent proposes beats + wires React touchpoints
        ↓
Human accepts → play / record / deepen scenarios
```

Until then:

- Treat Summarizer docs as **authoritative UXDS organism + naming** reference.  
- Keep Studio journey format (`journey.json`) extensible for imported persona/IA ids.  
- Do **not** fork a second IA variable taxonomy in Studio.

---

## Practical rules for agents today

1. When unsure about UXDS naming or IA namespaces → read Summarizer UXDS docs first.  
2. When building React screens → bind content keys that can later map to `IA/*` / `persona/*`.  
3. When building recording/journeys → keep metadata fields open for `source: x-suite` later.  
4. Do not port Summarizer’s plugin architecture into Studio.

---

## Related

- [../uxds/README.md](../uxds/README.md)  
- [../uxds/VARIABLES.md](../uxds/VARIABLES.md)  
- [COMMAND_DOCTRINE.md](./COMMAND_DOCTRINE.md)  
- [DIRECTION_FROM_SUMMARIZER.md](./DIRECTION_FROM_SUMMARIZER.md)
