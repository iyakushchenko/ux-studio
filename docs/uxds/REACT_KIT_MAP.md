# React kit map (UXDS ↔ Studio)

**Machine source:** [inventory/react-kit-map.json](./inventory/react-kit-map.json)  
**Figma file:** `[UX] UXDS - Larkin` · `myqzp3KRc1pxKDOv8RfTsl`  
**Contract:** [UXDS_MAP.md](./UXDS_MAP.md)

Shipped React under `src/uxds/` maps to Figma master names on `↳  01 Components`. When you add a kit, extend `react-kit-map.json` and keep names aligned with [inventory/components.json](./inventory/components.json).

| React module | Figma name(s) | Role |
|--------------|---------------|------|
| `SearchField.tsx` | `component.support.center.search.field` | Search input / PLP sidebar & support patterns |
| `ButtonPrimary.tsx` | `component.bulk.order.add.to.cart.button` | Primary solid CTA (reference set) |
| `BookAppointmentProgress.tsx` | `component.book.appointment.progress` | Booking step progress |
| `AppointmentSummaryPill.tsx` | `component.appointment.summary` | Appointment summary chip |
| `PromoMessageStrip.tsx` | `component.content.slot.promo.2`, `component.gse.product.tile.promotion` | Promo / message strip |
| `FilterChipToggle.tsx` | `component.plp.filter.text.item`, `component.plp.filter.quick.view` | PLP filter pill toggle |
| `Disclosure.tsx` | `component.plp.filter.accordion`, `component.footer.accordion.item` | Expand/collapse disclosure |
| `Accordion.tsx` | `component.gse.accordion`, `component.pdp.accordion` · compose under `component.co.product.in.this.order` (Order/Appointment Details) | Multi-section accordion |
| `MegaMenuFlyout.tsx` | `component.header.mega.menu.flyout.standard` (node 7650:86049), `module.mega.menu` (node 7650:86158) | Header nav flyout — link groups + hero asset + promo band. `module.mega.menu` is the same file's wrapper adding the full-viewport separation scrim (`fills/mega menu flyout gradient`, mix-blend-multiply) — rendered by this same component as `[data-name="module.mega.menu.scrim"]`, not a separate kit. Scrim click / Escape dismiss via `useOverlayEscapeDismiss` (`onDismiss` prop). |
| `FullScreenSearch.tsx` | `component.search.fullscreen.field` — `L & XL / Initial Suggestions` (node 2544:589387), `L & XL / Search Query Suggestions` (node 2544:589399 — unbuilt in Figma; query-result state reuses the same field chrome + the one titled-link-group pattern, not invented), `module.ss.couldnt.find.content.slot` (node 21362:294522 — "couldn't find": spelling-correction offer + category/content suggestions + product-suggestion grid; Boots wiring in `fullScreenSearchMount.tsx` renders product tiles with no photography — real PLP catalog has none, an intentional under-match) | Click-to-open full-viewport search takeover — same scrim + `useOverlayEscapeDismiss` dismiss contract as `MegaMenuFlyout`. Group links + scrim/dismiss logic shared via `UxdsTextLink.tsx` / `useOverlayEscapeDismiss.ts`. |
| `PendingSpinnerIcon.tsx` | *n/a — engine-native* | Glyph-swap pending/committing spinner (no Figma source node) |
| `CommitPulseIcon.tsx` | *n/a — engine-native* | Commit-landed scale pulse (no Figma source node) |

**Gate:** `npm run check:uxds-inventory` requires ≥5 kit rows (currently 12). Rows with no Figma node are marked *n/a — engine-native* — still tracked here so the roster stays exhaustive as kits grow.
