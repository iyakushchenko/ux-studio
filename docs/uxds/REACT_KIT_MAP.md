# React kit map (UXDS ↔ Studio)

**Machine source:** [inventory/react-kit-map.json](./inventory/react-kit-map.json)  
**Figma file:** `[UX] UXDS - Larkin` · `myqzp3KRc1pxKDOv8RfTsl`  
**Contract:** [UXDS_MAP.md](./UXDS_MAP.md)

Shipped React under `src/uxds/` maps to Figma master names on `↳  01 Components`. When you add a kit, extend `react-kit-map.json` and keep names aligned with [inventory/components.json](./inventory/components.json).

| React module | Figma name(s) | Role |
|--------------|---------------|------|
| `SearchField.tsx` | `component.search.fullscreen.field`, `component.support.center.search.field` | Search input / PLP & support patterns |
| `ButtonPrimary.tsx` | `component.bulk.order.add.to.cart.button` | Primary solid CTA (reference set) |
| `BookAppointmentProgress.tsx` | `component.book.appointment.progress` | Booking step progress |
| `AppointmentSummaryPill.tsx` | `component.appointment.summary` | Appointment summary chip |
| `PromoMessageStrip.tsx` | `component.content.slot.promo.2`, `component.gse.product.tile.promotion` | Promo / message strip |
| `FilterChipToggle.tsx` | `component.plp.filter.text.item`, `component.plp.filter.quick.view` | PLP filter pill toggle |
| `Disclosure.tsx` | `component.plp.filter.accordion`, `component.footer.accordion.item` | Expand/collapse disclosure |
| `Accordion.tsx` | `component.gse.accordion`, `component.pdp.accordion` | Multi-section accordion |

**Gate:** `npm run check:uxds-inventory` requires ≥5 kit rows (currently 8).
