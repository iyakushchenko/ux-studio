# Page create / migrate — inheritance guardrails (HARD)

**Status:** Locked (PO mandate, 2026-07-22)  
**Owners:** Arch (Director) veto · Bea (brief) · Finn (build) · Uma (fidelity)  
**When:** Any new page, Make→React migration, or “add a page like …” request.  
**Companions:** [UXDS_MAP.md](../uxds/UXDS_MAP.md) · [REACT_KIT_MAP.md](../uxds/REACT_KIT_MAP.md) · [COMPONENT_LIBRARY.md](./COMPONENT_LIBRARY.md) · [PROJECT_STYLEGUIDE.md](./PROJECT_STYLEGUIDE.md) · [CSS_BASE_THEME.md](./CSS_BASE_THEME.md) · [PAGE_BUILD_CONTRACT.md](./PAGE_BUILD_CONTRACT.md) · [CONCEPT_INTAKE.md](./CONCEPT_INTAKE.md)

---

## Pipeline (do not skip)

```
UXDS (structure · module.* · component.*)
        ↓  agent looks up map + similar frame
Existing UXML kits / pages (reuse / compose)
        ↓
UXML page (project screen) + project THEME delta only
```

**Forbidden:** invent a parallel component, dead decorative “collapsible”, page-local button/accordion CSS zoo, or stuffing brand layout into `theme.css`.

---

## Mandatory preflight (before coding JSX)

Arch **rejects** “done” / Finn mount if the brief or ship sitrep lacks this checklist.

| # | Check | Where to look | Pass when |
|---|--------|---------------|-----------|
| **P1** | **UXDS name lookup** | [inventory/components.json](../uxds/inventory/components.json) · [UXDS_MAP.md](../uxds/UXDS_MAP.md) | Every band maps to `module.*` / `component.*` (or documented N/A) |
| **P2** | **Similar UXDS page** | Same fileKey Larkin — Order Details / History / PLP / PDP / etc. | Closest frame cited (node id + URL); structure inherited |
| **P3** | **Existing UXML kit** | [REACT_KIT_MAP.md](../uxds/REACT_KIT_MAP.md) · `src/uxds/components/` · `src/uxds/interactions/` | Reuse kit **or** compose Accordion/Disclosure/ButtonPrimary/…; **no** one-off fork |
| **P4** | **Existing UXML page** | `src/projects/<id>/screens/*` + prior HARD-GREEN audits | Same chrome (nav, crumbs, card, summary) copied/composed; extract shared kit on **second** use |
| **P5** | **Interactive = kit** | COMPONENT_LIBRARY §2 | Expand/collapse → Accordion/Disclosure; CTA → ButtonPrimary / `.uxds-link`; no dead header |
| **P6** | **Theme delta only** | [PROJECT_STYLEGUIDE.md](./PROJECT_STYLEGUIDE.md) · [CSS_BASE_THEME.md](./CSS_BASE_THEME.md) | Shared L&F via UXDS BASE; project `theme.css` = brand color/logo/font remaps + concept copy — **not** layout/hover/component rules |

---

## Theme law (mutual engine / BASE)

| Layer | Must be mutual (shared) | Project may change |
|-------|-------------------------|-------------------|
| **BASE** `src/uxds/` | Tokens, kit anatomy, hover/focus/active, Accordion/Button/Search/link | — |
| **PANEL** `src/app/` | Studio chrome | — |
| **THEME** `projects/<id>/styleguide/theme.css` | — | Brand primary/accent/logo/font under `[data-studio-project]` |
| **Screen CSS** | Prefer kit classes; thin layout composition only | Concept band layout when UXDS has no kit yet — still `var(--uxds-…)` |

Coarse concepts (Legacy strips) supply **intent + brand cues**. Agent upgrades structure to UXDS / UXML kits; brand stays in THEME delta.

---

## Brief stamp (Bea — required section)

Every page brief must include:

```markdown
## Inheritance preflight (HARD)

| # | UXDS / UXML source | Reuse / compose | Gap (new kit?) |
|---|--------------------|-----------------|---------------|
| P1 | … | … | … |
| P2 | similar frame `node-id=…` | … | … |
| P3 | REACT_KIT_MAP row(s) | … | … |
| P4 | sibling screen `screens/…` | … | … |
| P5 | interactive kits | … | … |
| P6 | theme delta only | brand: … | no layout in theme.css |
```

Missing table = brief **not ready**; Arch does not open build.

---

## Ship sitrep (Finn / Arch)

One line per role when claiming page mount:

`Inheritance: P1–P6 PASS | kits reused: <names> | new kit: <none|name+map update> | theme: delta-only`

**Engine contribution:** register MCP probe steps via project `registerMcpPageProbes` (engine `mcpPageProbeRegistry`) — do **not** patch `studioMcpPageProbe.ts` if/else. Stamp `data-studio-action` for REC/playback; no Boots-only props on UXDS kits.

Extend [react-kit-map.json](../uxds/inventory/react-kit-map.json) the same ship when a **new** kit lands.

---

## Related

- [FEATURE_BRIEF_TEMPLATE.md](./FEATURE_BRIEF_TEMPLATE.md) — inheritance section  
- [TEAM_KNOWLEDGE.md](./TEAM_KNOWLEDGE.md) — Finn/Bea/Uma must re-read  
- Director rule: `.cursor/rules/ux-studio-director.mdc` hard checklist
