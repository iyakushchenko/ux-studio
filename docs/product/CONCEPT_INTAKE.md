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
| **Early concept strip / Make feed** | Rough frames, often static, may mix custom frames + some `module.*` instances, **may not follow UXDS variables/structure** | **Common** — main feed |
| **Fully structured UXDS screens** | Production-grade PLP/PDP pages with full module bindings, multi-viewport | **Rare** for Studio intake |

### Canonical examples (same UXDS file)

| Kind | Node | URL |
|------|------|-----|
| **Typical Studio feed** (Make container / concept strip — Boots vaccine flow source) | `32452:19405` Section 1 | https://www.figma.com/design/myqzp3KRc1pxKDOv8RfTsl/-UX--UXDS---Larkin?node-id=32452-19405 |
| **Rare structured reference** (full PLP organism) | `2403:663287` PLP page | https://www.figma.com/design/myqzp3KRc1pxKDOv8RfTsl/-UX--UXDS---Larkin?node-id=2403-663287 |

The Make-feed section (`32452:19405`) is the class of artefact that seeded today’s Boots pages via Figma Make. Those Make pages were then heavily altered in Studio. **Future intake looks like that section** — not like the polished PLP canvas.

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
- React composition (not another Make dump)
- Map structure to **UXDS** + closest `component.*` / `module.*`; brand via project theme CSS
- Stable Studio wiring (`data-name`, screens, touchpoints)
- Interactive behaviour needed for proofing (not full production backend)

Do **not** refuse a concept because it is “not on the design system.”  
Do **not** slavishly copy broken structure.  
**Upgrade** toward UXDS while preserving the PO’s intent.

---

## 4. Quality bar for early concepts

| Must | Must not |
|------|----------|
| Intent of the concept readable and playable | Wait for perfect Figma structure |
| UXDS names/tokens used where a match exists | Invent a parallel token system |
| Closest UXDS modules preferred over one-off HTML | Pretend Make CSS is the long-term stack |
| Good enough for discovery / proof | Pixel-match a messy source at the cost of maintainability |

When the source is structured UXDS (rare), prefer fidelity to masters.  
When the source is early/messy (common), prefer **intent + UXDS upgrade**.

---

## 5. How page requests arrive (PO process)

Two valid modes:

| Mode | PO says something like… | Agent does |
|------|-------------------------|------------|
| **A. New concept** | “Add this page” + Figma URL (or asks without URL) | If no URL → **ask for concept URL**. Build from that frame; upgrade with UXDS + project theme. |
| **B. From what we already have** | “Add a page like our PLP / reuse existing booking step / same header+footer pattern” — **no new concept URL** | **Do not ask for a URL.** Compose from **UXDS library components** + **internal ready React modules** already in the project/engine. Maximize reuse. |

### Reuse mandate (key — both modes, especially B)

- Prefer existing `component.*` / `module.*` (Figma UXDS) and existing React modules under `src/uxds/` / `src/projects/<id>/` over new one-offs.
- Repetitive chrome (header, footer, breadcrumbs, product tile, CTAs, form fields) **must** reuse shared pieces — never clone markup per page.
- Only invent a new module when nothing suitable exists; then add it to the shared library so the next page can reuse it.
- Mode B is composition + wiring + journey hooks, not a greenfield visual redesign, unless the PO explicitly asks to diverge.

## 6. Intake checklist (agent)

When PO pastes a concept URL (or after agent requested and received it):

1. Open frame(s); classify: early strip vs structured page.  
2. Extract intent + **brand delta** (primary colors, logos, fonts).  
3. Create/update project `styleguide/` theme CSS.  
4. Map each region → nearest UXDS module/component + tokens.  
5. Build React pages under `src/projects/<id>/`.  
6. Register in Studio; smoke browse + one playback path.  
7. Note gaps briefly (“no token; used UXDS role X; brand primary from concept swatch”).

---

## Related

- [PROJECT_STYLEGUIDE.md](./PROJECT_STYLEGUIDE.md)  
- [PAGE_BUILD_CONTRACT.md](./PAGE_BUILD_CONTRACT.md)  
- [UX_STUDIO_VISION.md](./UX_STUDIO_VISION.md)  
- [../uxds/README.md](../uxds/README.md)  
- [COMMAND_DOCTRINE.md](./COMMAND_DOCTRINE.md)
