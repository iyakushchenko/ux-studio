# Concept intake — business logic (critical)

**Status:** Locked (Product Owner, 2026-07-19)  
**Audience:** Every agent building pages in UX Studio.

---

## 1. What UX Studio is for (early)

Primary business purpose:

- Early **discovery** and **ideation**
- **Solution proofing**
- **Hypothesis validation**
- Fast CJMs / scenarios around those ideas

It is **not** a pixel-perfect production implementation tool, and it is **not** waiting for fully polished UXDS-bound designs before work starts.

---

## 2. What the Product Owner will typically feed you

| Input type | Example | How often for Studio |
|------------|---------|----------------------|
| **Early concept strip / Legacy feed** | Rough frames, often static, may mix custom frames + some `module.*` instances, **may not follow UXDS variables/structure** | **Common** — main feed |
| **Fully structured UXDS screens** | Production-grade PLP/PDP pages with full module bindings, multi-viewport | **Rare** for Studio intake |

### Canonical examples (same UXDS file)

| Kind | Node | URL |
|------|------|-----|
| **Typical Studio feed** (Legacy container / concept strip — Boots vaccine flow source) | `32452:19405` Section 1 | https://www.figma.com/design/myqzp3KRc1pxKDOv8RfTsl/-UX--UXDS---Larkin?node-id=32452-19405 |
| **Rare structured reference** (full PLP organism) | `2403:663287` PLP page | https://www.figma.com/design/myqzp3KRc1pxKDOv8RfTsl/-UX--UXDS---Larkin?node-id=2403-663287 |

The Legacy-feed section (`32452:19405`) is the class of artefact that seeded today’s Boots pages via Figma Legacy. Those Legacy pages were then heavily altered in Studio. **Future intake looks like that section** — not like the polished PLP canvas.

---

## 3. The gap the agent must fill

```
PO concept (messy / early / own brand colors & logos)
        ↓
Agent: project styleguide DELTA (colors, logos) + React pages
        ↓
UXDS structure  ×  project brand theme
        ↓
Playable · recordable · CJM-ready · looks like THAT brand
```

**Product Owner owns the idea** (layout intent, flow, hypothesis, brand cues).  
**Agent owns the craft** — turn imperfect Figma into coherent Studio pages:

- Extract **brand delta** → `src/projects/<id>/styleguide/` ([PROJECT_STYLEGUIDE.md](./PROJECT_STYLEGUIDE.md))
- React composition (not another Legacy dump)
- Map structure to **UXDS** + closest `component.*` / `module.*`; brand via project theme CSS
- Stable Studio wiring (`data-name`, screens, touchpoints)
- **Interactive fidelity** needed for proofing and recording — shared kits under `src/uxds/interactions/`, not one-off scripts ([INTERACTION_FIDELITY.md](./INTERACTION_FIDELITY.md)). Fake data OK; dead UI is not record-ready.
- **Interaction inventory is mandatory:** map the current project before composition to reuse established target conventions, then map the finished page and resolve/record every `invalid`, `semantic-ready`, and `visual-candidate` result ([INTERACTION_INVENTORY.md](./INTERACTION_INVENTORY.md)). A coarse Figma draft is not permission to invent dead or untargetable controls.
- On React rebuilds: **behavior parity** with prior Legacy/concept handlers ([VISUAL_FIDELITY.md](./VISUAL_FIDELITY.md) §1.1) — do not drop checkbox/Continue/search wiring.

Do **not** refuse a concept because it is “not on the design system.”  
Do **not** slavishly copy broken structure.  
**Upgrade** toward UXDS while preserving the PO’s intent.

**HARD inheritance:** Before coding, run [PAGE_CREATE_INHERITANCE.md](./PAGE_CREATE_INHERITANCE.md) P1–P6 — similar UXDS frame + existing UXML kits/pages first; project theme = brand/copy delta only.

---

## 4. Quality bar for early concepts

| Must | Must not |
|------|----------|
| Intent of the concept readable and playable | Wait for perfect Figma structure |
| UXDS names/tokens used where a match exists | Invent a parallel token system |
| Closest UXDS modules preferred over one-off HTML | Pretend Legacy CSS is the long-term stack |
| Good enough for discovery / proof | Pixel-match a messy source at the cost of maintainability |

When the source is structured UXDS (rare), prefer fidelity to masters.  
When the source is early/messy (common), prefer **intent + UXDS structure under the hood** — but **visual L&F of the source concept is mandatory** (radii, chrome, progress, buttons, checkboxes). Brand may remap UXDS color tokens via the project theme; do not invent new chrome. No visual zoo — same active language within a surface; secondary selectors stay mini / lower contrast. ([VISUAL_FIDELITY.md](./VISUAL_FIDELITY.md), [PAGE_BUILD_CONTRACT.md](./PAGE_BUILD_CONTRACT.md) §5).

---

## 5. How page requests arrive (PO process)

**Rule: pages are built by the agent only.** The PO never hand-places raw Figma markup or pastes source directly into a page — every page is agent-composed, in one of three scenarios (PO, 2026-07-24):

| Scenario | PO says something like… | Input shape | Agent does |
|----------|--------------------------|-------------|------------|
| **S1. Loose/raw concept** | “Add this page” + a rough Figma frame or Legacy strip | May not follow UXDS structure, layer names, or variables at all | If no URL → **ask for concept URL**. Filter the dirt out: derive proper UXDS-convention names/structure from the [UXDS components page](../uxds/README.md) format, not from whatever the source frame calls things. This is the common case ([§2](#2-what-the-product-owner-will-typically-feed-you)). |
| **S2. UXDS proper prototype link** | “Build this” + a link straight into the UXDS library (e.g. `component.*` / `module.*` frames) | Already UXDS-structured/named | Compose from it directly — but still verify (see below); a link living in the UXDS file doesn't guarantee every layer inside it is clean. |
| **S3. Existing UXML page** | “Add a page like our PLP / reuse existing booking step” — no new concept URL | An already-built page in this repo | **Do not ask for a URL.** Compose from **UXDS library components** + **internal ready React modules** already in the project/engine. Maximize reuse. Long-run canonical template source is the **refapp roster** (UXDS Larkin recreated natively in UXML — [PROJECT_CONTRACT.md](./PROJECT_CONTRACT.md)); until/unless a given page exists there, or the PO points at a different existing project's equivalent to save time, derive from whatever real UXML page is closest. |

### Pessimistic verification (all three scenarios, no exceptions)

Before trusting any input's structure, naming, tokens, or variables — S1, S2, or S3 alike — the agent checks it first. A link living in the UXDS file (S2) or a page already in this repo (S3) is not automatically ground truth: UXDS drifts, prior pages can carry old debt forward. Verify against current UXDS reality before composing on top of it.

This is **not** license to add friction for its own sake — **we do not sabotage agents.** Verification means a real check (does this token/component actually exist in UXDS today, does this existing page still match current convention), not a standing excuse to stall, over-ask the PO, or gate-keep obvious cases. Confirm, then build — don't confirm instead of building.

### Reuse mandate (key — all three scenarios, especially S3)

- Prefer existing `component.*` / `module.*` (Figma UXDS) and existing React modules under `src/uxds/` / `src/projects/<id>/` over new one-offs.
- Prefer shared **interaction kits** (`src/uxds/interactions/`) for accordions, selects, filters, tabs, modals, fields — do not reinvent per page ([INTERACTION_FIDELITY.md](./INTERACTION_FIDELITY.md)).
- Repetitive chrome (header, footer, breadcrumbs, product tile, CTAs, form fields) **must** reuse shared pieces — never clone markup per page.
- Only invent a new module when nothing suitable exists; then add it to the shared library so the next page can reuse it.
- Mode B is composition + wiring + journey hooks, not a greenfield visual redesign, unless the PO explicitly asks to diverge.
- **Enrichment before record:** when PO will record (or when enriching pages already in place), raise interactivity to the fidelity the scenario needs — including Boots Legacy wire when those screens are touched.

## 6. Intake checklist (agent)

When PO pastes a concept URL (or after agent requested and received it):

1. Open frame(s); classify: early strip vs structured page.  
2. Extract intent + **brand delta** (primary colors, logos, fonts).  
3. Create/update project `styleguide/` theme CSS.  
4. Map each region → nearest UXDS module/component + tokens.  
5. Run **Map all project interactions** and reuse its target conventions/components before adding new ones. For a migration, save the legacy page result as the behavior/target baseline.
6. Build React pages under `src/projects/<id>/`.
7. Build anticipated interactivity (shared kits); wire CTAs/links. Later: derive requirements from CJM deck when PO points at one.
8. Register in Studio; run **Map current page interactions**; fix invalid contracts and explicitly classify decorative candidates. On migration, compare against the legacy baseline—no unexplained target loss.
9. Smoke browse + happy-path controls + one playback path. Confirm **record-ready** only after controls respond and the inventory is attached to the handoff ([INTERACTION_FIDELITY.md](./INTERACTION_FIDELITY.md), [INTERACTION_INVENTORY.md](./INTERACTION_INVENTORY.md)).
10. Note gaps briefly (“no token; used UXDS role X; brand primary from concept swatch; used interaction kit Y”).

---

## Related

- [PROJECT_STYLEGUIDE.md](./PROJECT_STYLEGUIDE.md)  
- [PAGE_BUILD_CONTRACT.md](./PAGE_BUILD_CONTRACT.md)  
- [INTERACTION_FIDELITY.md](./INTERACTION_FIDELITY.md)  
- [UX_STUDIO_VISION.md](./UX_STUDIO_VISION.md)  
- [../uxds/README.md](../uxds/README.md)  
- [COMMAND_DOCTRINE.md](./COMMAND_DOCTRINE.md)
