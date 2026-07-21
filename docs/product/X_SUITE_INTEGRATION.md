# X-Suite (Summarizer / Experience Suite) → UX Studio

**Status:** Strategic intent locked (Product Owner, 2026-07-19) · **workflow sharpened 2026-07-21**. Import automation not built yet; agents may run the **manual** analyze → build → REC path when PO shares an export.  
**Commander note:** Design for this seam early; do **not** block Boots erase-Make / REC·Play·QA polish on a full automated importer. Do **not** port Summarizer’s Figma-plugin architecture into Studio.

**Audience:** Any agent handed an X-Suite persona/CJM export (or asked to “continue the X-Suite stream”).

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

They share **UXDS** as the design/content spine. They are **not** the same app.

---

## PO workflow (HARD) — export → analyze → REC

When the Product Owner **exports a persona CJM from X-Suite** and **shares that CJM** with an agent:

1. **Analyze** the export (persona, stages, screens, intents, content).  
2. Ensure / create the **respective Studio project** with **all pages** the CJM needs.  
3. Build those pages to Studio contracts (templates + UXDS + naming — below).  
4. **REC a new CJM** in UX Studio against that project (real REC arm — not a fake prove on an old journey).  
5. Human accepts → Play / deepen / Save Log as needed.

```
X-Suite export (persona + CJM)
        ↓  PO shares file / link with agent
Agent analyzes CJM
        ↓
Studio project has all required pages (build / reuse)
        ↓
Agent RECs new CJM in UX Studio (source metadata: x-suite)
        ↓
Human accepts → Play / QA / deepen
```

Automated “drop JSON → one-click import” is **later**. Until then the agent **is** the seam.

---

## Page / project build laws (when executing that workflow)

### 1. Full page set

The Studio project must cover **every screen** the X-Suite CJM references (or an explicit PO-accepted stub map). Missing pages = incomplete — do not REC a hollow path and call it done.

### 2. Studio templates + UXDS (no invent zoo)

| Guide | Use for |
|-------|---------|
| **UX Studio templates** / existing React screen packages | Structure, mount pattern, host/retire Make, CSS layers |
| **UXDS styleguide** (Larkin) | General visual language, tokens, type, spacing |
| **UXDS / components** | Layout structure, control patterns, composition |
| **HTML / BEM block naming** | [NAMING.md](./NAMING.md) — `screenId` = folder = URL `?screen=`; BEM block ≈ screenId |

Contract pack: [PAGE_BUILD_CONTRACT.md](./PAGE_BUILD_CONTRACT.md) · [docs/uxds/UXDS_MAP.md](../uxds/UXDS_MAP.md) (HARD exhaustive map) · [docs/uxds/README.md](../uxds/README.md) · [FE_STANDARDS.md](./FE_STANDARDS.md) · [DS_STRICTNESS.md](./DS_STRICTNESS.md).

### 3. Names that engines can see (HARD)

Robo-cursor, camera, REC, and Play need **stable affordances**:

- `screenId` registered + URL-navigable  
- Interactive controls: `data-studio-action` / `data-studio-*` (and Make-parity `data-name` only where playback already depends on it)  
- Prefer **real** buttons/links — not anonymous layout `div`s as click targets  
- No new `.proto-*` / `data-proto-*` on new React work  

Refs: [NAMING.md](./NAMING.md) · [INTERACTION_FIDELITY.md](./INTERACTION_FIDELITY.md) · [docs/shell/RECORDING.md](../shell/RECORDING.md) · [docs/shell/URL.md](../shell/URL.md).

### 4. Ask for page reference (HARD)

Pages must be built from **exact coarse concepts** or **UXDS page prototypes** — not freehand invent.

**Agent must ask the PO** for the reference (Figma node / Make frame / UXDS prototype / existing Studio screen) before coding a new page. Prefer under-match over invent ([VISUAL_FIDELITY.md](./VISUAL_FIDELITY.md)).

### 5. Reuse React pages — no drift / near-dupes (HARD)

- Prefer **compose / extend** already-built React screens and shared kits (`src/uxds/`, shared composers, mounts).  
- Keep structure consistent with the reference project (Boots is the rabbit).  
- **Forbidden:** parallel near-duplicate components, second button languages, one-off layout CSS that already exists as a kit.  
- New migrated pages still obey **PAGE FINAL PASS** sequencing when replacing Make ([PAGE_FINAL_PASS.md](./PAGE_FINAL_PASS.md)).

Intake modes: [CONCEPT_INTAKE.md](./CONCEPT_INTAKE.md) §5 (mode B = from what we have).

---

## Journey metadata (keep open)

Studio `journey.json` / recording compile should remain extensible, e.g.:

- `source: "x-suite"`  
- persona / IA ids from the export  
- optional map of X-Suite stage → Studio `screenId`

Do **not** invent a second IA taxonomy in Studio.

---

## Practical rules for agents today

1. UXDS naming / IA namespaces → Summarizer UXDS docs first (`E:\UX\Summarizer\docs\UXDS_ORGANISM_OVERVIEW.md`).  
2. React screens → content keys that can later map to `IA/*` / `persona/*`.  
3. Recording/journeys → leave room for `source: x-suite`.  
4. Do **not** port Summarizer plugin architecture into Studio.  
5. When PO shares an X-Suite CJM → follow **PO workflow** above; ask for page references; reuse before invent.  
6. REC prove honesty: real REC arm + Play that `rec-*` ([docs/shell/RECORDING.md](../shell/RECORDING.md) · CJM Record/Play/Edit).  
7. Canonical workspace: `E:\UX\ux-studio` only.

---

## What this stream is *not*

- Not “rebuild Summarizer inside Studio”  
- Not “copy Summarizer’s full `npm run check` megasuite”  
- Not “implement real-user X-Suite persona as a callsign beside Pax” yet (stub — [TEAM.md](./TEAM.md))  
- Not skipping PAGE FINAL PASS / Nazi QA when shipping UI  

---

## Related (read in this order when continuing the stream)

1. **This file** — workflow + laws  
2. [DIRECTION_FROM_SUMMARIZER.md](./DIRECTION_FROM_SUMMARIZER.md) — governance borrow, not plugin clone  
3. [PAGE_BUILD_CONTRACT.md](./PAGE_BUILD_CONTRACT.md) · [CONCEPT_INTAKE.md](./CONCEPT_INTAKE.md) · [NAMING.md](./NAMING.md)  
4. [../uxds/README.md](../uxds/README.md) · [../uxds/VARIABLES.md](../uxds/VARIABLES.md)  
5. [PAGE_FINAL_PASS.md](./PAGE_FINAL_PASS.md) · [FE_STANDARDS.md](./FE_STANDARDS.md) · [DS_STRICTNESS.md](./DS_STRICTNESS.md)  
6. [../shell/RECORDING.md](../shell/RECORDING.md) · [../shell/URL.md](../shell/URL.md) · [INTERACTION_FIDELITY.md](./INTERACTION_FIDELITY.md)  
7. [PRODUCT_FORECAST.md](./PRODUCT_FORECAST.md) § X-Suite · [UX_STUDIO_VISION.md](./UX_STUDIO_VISION.md)  
8. External: `E:\UX\Summarizer\docs\UXDS_ORGANISM_OVERVIEW.md` · Summarizer `docs/README.md`
