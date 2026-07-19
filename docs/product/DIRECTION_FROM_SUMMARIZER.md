# Direction from Summarizer — what fits UX Studio

**Reference repo:** `E:\UX\Summarizer`  
**Decision (2026-07-19):** Borrow **general direction** and working habits — do **not** fully mimic the Figma plugin architecture.

---

## Why look at Summarizer

You arranged Summarizer the way you like to run serious UX tooling:

- Strong documentation catalog
- Explicit design-system / token contracts
- Agent rules that survive chat amnesia
- Quality gates so the product doesn’t silently rot

UX Studio should feel like that **as a product operating system**, while remaining a **web engine for concept projects**, not a Figma plugin.

---

## Fits UX Studio — adopt (gradually)

| Summarizer idea | UX Studio application |
|-----------------|----------------------|
| `docs/README.md` catalog + reading order | Done — see [../README.md](../README.md) |
| Product Owner decisions written to docs | [PRODUCT_OWNER_BRIEF.md](./PRODUCT_OWNER_BRIEF.md) decisions log |
| Token layers (primitive → semantic → contract) | Target for UXDS bridge ([PAGE_BUILD_CONTRACT.md](./PAGE_BUILD_CONTRACT.md)) |
| Design system contract for UI patterns | Future `docs/uxds/` + engine chrome rules (lighter at first) |
| Agent entry + rules (`.cursor/rules`, AGENTS) | Grow as we add recorder + UXDS rebuild; keep fewer rules than Summarizer until needed |
| Feature docs vs architecture docs vs code as truth | Same authority model |
| “Lanes” / isolation of domains | Engine (`src/app`) vs projects (`src/projects`) — already the right split |

---

## Does not fit — do not copy

| Summarizer pattern | Why skip / defer |
|--------------------|------------------|
| `src/code` vs `src/ui` (plugin sandbox) | UX Studio is a Vite React web app |
| Publish-to-Figma / manifest plugin release | Not the product |
| Full `npm run check` megasuite on day one | Adopt **lean** gates first (test, build, lean smoke); add CSS/token checks when UXDS lands |
| Sibling-mass / capsule rules as hard law | Too heavy for engine bootstrap; revisit later |
| UXDS Audit Tool inside Studio | Interesting later; not core to CJM playback |

---

## Verdict: does Summarizer’s direction fit?

**Yes — as governance and design-system discipline.**  
**No — as a structural clone of a Figma plugin.**

**Also yes — as a future product seam:** X-Suite outputs (personas, CJMs, IA) become baselines for semi-automated agentic CJMs in Studio. See [X_SUITE_INTEGRATION.md](./X_SUITE_INTEGRATION.md). UXDS is the shared spine.

The closest structural analogy in UX Studio is already correct:

```
Summarizer: shared contracts + UI lanes + features + UXDS writers
UX Studio:  engine shell + project packages + journeys/recording + UXDS React consumers
```

---

## Near-term “Summarizer-shaped” backlog for Studio docs

1. Keep `docs/README.md` as the catalog (done).
2. After UXDS access: add `docs/uxds/` (variables map, component inventory, naming).
3. Add a short `docs/shell/ARCHITECTURE.md` when recorder UI lands (engine module map).
4. Grow `.cursor/rules` only for contracts we actually enforce (page build, MCP smoke, PowerShell commits).

---

## Related

- [PRODUCT_OWNER_BRIEF.md](./PRODUCT_OWNER_BRIEF.md)
- Summarizer’s own catalog: `E:\UX\Summarizer\docs\README.md` (external reference)
