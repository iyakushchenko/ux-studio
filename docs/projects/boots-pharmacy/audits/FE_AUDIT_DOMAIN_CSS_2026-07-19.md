# FE audit (strict interface audit, light scope) — domain CSS / attrs phase 2

**Date:** 2026-07-19  
**Verdict:** **PROVEN** (chrome / domain identity)  
**Scope:** PANEL `.studio-*` + `data-studio-*` clean cut after filename phase 1  
**Host:** `http://localhost:5182/` · tip `37569c1`

---

## Proof

| Check | Result |
|-------|--------|
| Deep link `?screen=book-step-1` | `data-studio-react-screen=book-step-1` + `.studio-react-screen-host` |
| Deep link `?screen=book-step-2` | Loads; React host present |
| PANEL chrome classes | `.studio-nav-panel`, `.studio-nav-scenario`, `.studio-mode-switch` present; `.proto-nav-panel` absent |
| Attr leftovers | No `[data-proto-react-screen]` / `[data-proto-project]` |
| REC ⊗ CJM | CJM on → REC `disabled` (`.studio-playback-rec-switch`) |
| MCP sanity | `__studioRunMcpSanityCheck` / `__protoRunMcpSanityCheck` → `pass: true` |
| Overlay | `data-studio-agent-testing` arms via overlay helper |

---

## Out of scope (NEXT)

- Concept LEGACY `.proto-*` in Legacy wire / footer / chat / avail cards  
- Beat field `protoTab`  
- Engine monster splits (`App.tsx`, `useJourneyPlayback.ts`)

---

## Gates

- `npm test` (links + hygiene + 286 vitest) green  
- `npm run build` green  
