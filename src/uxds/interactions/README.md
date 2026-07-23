# UXDS interaction kits

**Doctrine:** [docs/product/INTERACTION_FIDELITY.md](../../../docs/product/INTERACTION_FIDELITY.md)

Shared React behavior for common website patterns. Pages compose these kits; they do not reimplement them.

| Kit | Modules | Role |
|-----|---------|------|
| **Accordion** | `Accordion.tsx`, `useAccordion.ts`, `accordionState.ts`, `accordion.css`, `accordionMotion.ts` | Multi-item expand/collapse; `single` or `multiple`; **default** CSS `grid-template-rows` 0fr↔1fr + opacity (no height:auto thrash) + muted closed / brand-strong open chevron (`AccordionChevron`) |
| **Disclosure** | `Disclosure.tsx`, `useDisclosure.ts`, `disclosureState.ts` | One panel show/hide (hours, dropdown body) |
| **Filter chip** | `FilterChipToggle.tsx`, `useFilterChipToggle.ts`, `filterChipState.ts` | Facet / quick-filter toggles |
| **Mega menu flyout** | `MegaMenuFlyout.tsx`, `mega-menu-flyout.css` | Header nav flyout panel (`component.header.mega.menu.flyout.standard`, node 7650:86049) — link groups grid + hero asset + promo band; presentational, `open` prop owned by the hovering nav item. Also renders `module.mega.menu`'s (node 7650:86158) full-viewport separation scrim (`[data-name="module.mega.menu.scrim"]`, mix-blend-multiply gradient, `pointer-events: none`). Show/hide is `framer-motion` `AnimatePresence` (opacity + tiny y, `MOTION.md`) — `open` toggling plays a real exit transition before DOM removal, **not** an instant unmount (see `LESSONS_LEARNED.md` 2026-07-23 re-testing this with real timers) |
| **Pending spinner icon** | `PendingSpinnerIcon.tsx`, `pendingSpinnerIcon.css` | *n/a — engine-native, no Figma node.* Glyph-swap arc spinner for optimistic pending states (wishlist/save/add-to-cart) |
| **Commit pulse icon** | `CommitPulseIcon.tsx` | *n/a — engine-native, no Figma node.* `framer-motion` scale pulse celebrating a pending action's real commit landing |

Figma source (where one exists) is tracked in [docs/uxds/REACT_KIT_MAP.md](../../../docs/uxds/REACT_KIT_MAP.md) / [inventory/react-kit-map.json](../../../docs/uxds/inventory/react-kit-map.json) — keep that roster current whenever a kit is added, even when a kit is engine-native with no Figma source.

Import from `@/uxds/interactions`.

| Path | Role |
|------|------|
| `src/uxds/interactions/` | Behavior kits (this folder) |
| `src/uxds/components/` | Visual UXDS-mapped React modules |

Grow kits when a page needs a pattern — do not invent one-off imperative scripts per screen.
