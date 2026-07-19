# UXDS interaction kits

**Doctrine:** [docs/product/INTERACTION_FIDELITY.md](../../../docs/product/INTERACTION_FIDELITY.md)

Shared React behavior for common website patterns. Pages compose these kits; they do not reimplement them.

| Kit | Modules | Role |
|-----|---------|------|
| **Accordion** | `Accordion.tsx`, `useAccordion.ts`, `accordionState.ts` | Multi-item expand/collapse; `single` or `multiple` |
| **Disclosure** | `Disclosure.tsx`, `useDisclosure.ts`, `disclosureState.ts` | One panel show/hide (hours, dropdown body) |
| **Filter chip** | `FilterChipToggle.tsx`, `useFilterChipToggle.ts`, `filterChipState.ts` | Facet / quick-filter toggles |

Import from `@/uxds/interactions`.

| Path | Role |
|------|------|
| `src/uxds/interactions/` | Behavior kits (this folder) |
| `src/uxds/components/` | Visual UXDS-mapped React modules |

Grow kits when a page needs a pattern — do not invent one-off imperative scripts per screen.
