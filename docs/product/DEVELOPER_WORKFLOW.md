# Developer workflow — UX Studio

**Status:** Canonical contributor entrypoint  
**Workspace:** `E:\UX\ux-studio` only  
**Runtime:** Node.js 22 or newer

UX Studio is an engine for deep-linkable, clickable UX concepts, journey playback, and
recording. Engine code lives in `src/app/`; concept packages live in `src/projects/`;
shared UXDS tokens, components, and interactions live in `src/uxds/`.

## Setup

```bash
npm install
npm run dev
```

The development server is always `http://localhost:5173/` with a strict port. Reuse the
existing server and browser tab when the port is busy; do not start a second Vite instance
on another port.

## Commands

| Command | Meaning |
|---------|---------|
| `npm run dev` | Start the strict-port local Studio on `:5173`. |
| `npm run test:gates` | Run ten static contracts in parallel: Markdown links/anchors, text-link behavior, file hygiene, naming/felonies, parity ratchets, parity proof, Page Final Pass, theme/brand, version/changelog sync, and UXDS inventory. |
| `npm test` | Run all static gates, then the Vitest suite. This is the normal local correctness gate. |
| `npm run build` | Build the Vite production bundle used by Pages. |
| `npm run smoke` | Run the lean Playwright profile against the canonical local server. Use the full profile only while investigating a relevant failure. |
| `npm run test:watch` | Run Vitest in watch mode during focused implementation. |
| `npm run notes:append -- --lane=<lane> --intent="..."` | Add a durable user-visible release note when the change warrants one. |

`check:links` and `check:docs-links` validate local Markdown targets and heading anchors.
The UI styling contract is named explicitly: `check:text-link-contract`.

## Read by task

| Task | Read before changing code |
|------|---------------------------|
| Any serious work | [COMMAND_DOCTRINE.md](./COMMAND_DOCTRINE.md), your section in [TEAM_KNOWLEDGE.md](./TEAM_KNOWLEDGE.md), relevant [LESSONS_LEARNED.md](./LESSONS_LEARNED.md), and [NEXT_STEPS.md](./NEXT_STEPS.md). |
| React page migration | [PAGE_BUILD_CONTRACT.md](./PAGE_BUILD_CONTRACT.md), [PAGE_FINAL_PASS.md](./PAGE_FINAL_PASS.md), [COMPONENT_LIBRARY.md](./COMPONENT_LIBRARY.md), and the screen brief/register. |
| CSS, components, or visual UI | [CSS_BASE_THEME.md](./CSS_BASE_THEME.md), [DS_STRICTNESS.md](./DS_STRICTNESS.md), [FE_STANDARDS.md](./FE_STANDARDS.md), and [VISUAL_FIDELITY.md](./VISUAL_FIDELITY.md). |
| Navigation, URL, or modal | [../shell/URL.md](../shell/URL.md) and the modal registry contract. |
| Recording or playback | [../shell/RECORDING.md](../shell/RECORDING.md), [../shell/PLAYBACK.md](../shell/PLAYBACK.md), and [../shell/PLAYBACK_DIAG.md](../shell/PLAYBACK_DIAG.md). |

## Where work belongs

| Work | Home |
|------|------|
| Engine behavior | `src/app/<domain>/` |
| Project composition and screens | `src/projects/<id>/` |
| Shared visual kit | `src/uxds/components/` |
| Shared interaction behavior | `src/uxds/interactions/` |
| Brand token remaps | `src/projects/<id>/styleguide/theme.css` |
| Screen-scoped composition CSS | Imported by the owning component under `screens/<screenId>/`; never in `globals-*.css` |
| Engine policy | `docs/product/` |
| Project brief, register, or audit | `docs/projects/<id>/` |

New screen folders equal their runtime `screenId`. The existing Boots
`screens/home/` → `site-pilot` mismatch is a registered migration deviation in
[NAMING.md](./NAMING.md), not a pattern to copy.

## Definition of done

1. The change follows the relevant contract and preserves adjacent chrome, URL, mode,
   and panel behavior.
2. `npm test` and `npm run build` pass.
3. Relevant behavior is proved locally on `http://localhost:5173/`.
4. UI-facing work has the required strict audit and project evidence; a green build alone
   is not visual proof.
5. Behavior and durable decisions are reflected in the owning docs in the same change.
6. The coherent local ship follows [POST_CHANGE_CHECKLIST.md](./POST_CHANGE_CHECKLIST.md)
   before commit or push.

## Deeper catalog

Use [../README.md](../README.md) for the complete product, UXDS, shell, project, and
governance documentation catalog.
