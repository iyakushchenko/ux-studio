# Architecture map — UX Studio engine

**Status:** Living (Tech Director)  
**Workspace:** `E:\UX\ux-studio` only  
**Naming:** [NAMING.md](./NAMING.md) · Hygiene: [HYGIENE.md](./HYGIENE.md)

Folders mimic **Studio verbs** people use — not a proto nickname.

---

## `src/app/` — engine domains

| Folder | Verb / job |
|--------|------------|
| `nav/` | Studio chrome: tabs, CJM/REC switches, scenario transport, zoom |
| `recording/` | Capture, session, MCP helpers, replay bridge |
| `scenario/` | Demo cursor, screen-frames playback scroll, retreat bridge |
| `orchestra/` | Journey runtime, beat director, `useJourneyPlayback` |
| `journey/` | Journey file/store/MCP import-export |
| `shell/` | URL (`studioUrl`), MCP surface, agent overlay, playback guards/diagnostics, storage |
| `chrome/` | Shared chrome primitives (tertiary CTA, icon hit, overlay dismiss) |
| `hub/` | Hub wiki shell wiring |
| `popups/` | Engine-level popup hosts (thin) |
| `components/` | Vendor UI kit (shadcn) — not product domain |

**Playback** lives under `shell/playback*` + `scenario/playbackScroll` today (guards vs motion). Do not invent a micro-folder zoo until a second consumer forces a `playback/` extract.

**URL** = `shell/studioUrl.ts` + `shell/useStudio.ts` (query scheme in [../shell/URL.md](../shell/URL.md)).

---

## Outside the engine

| Path | Job |
|------|-----|
| `src/projects/<id>/` | Concept packages (screens, wire, DOM, theme) |
| `src/uxds/` | Design system tokens + kits + interactions |
| `src/styles/globals-*.css` | LEGACY Make dumps — **no new React page CSS** |
| `data/journeys/` | Exported journey bundles |
| `docs/product/` | Engine doctrine |
| `docs/projects/<id>/` | Per-concept briefs + FE audits |

---

## CSS layers

BASE (`src/uxds`) → THEME (`projects/<id>/styleguide/theme.css`) → PANEL (`src/app/**` chrome) → LEGACY (`globals-*.css`) → page CSS under `screens/<screenId>/`.

Panel classes: `.studio-nav-*`, `.studio-*` mode switches, `.studio-agent-testing-*`. Concept Make leftovers may still say `.proto-*` until screen retirement.
