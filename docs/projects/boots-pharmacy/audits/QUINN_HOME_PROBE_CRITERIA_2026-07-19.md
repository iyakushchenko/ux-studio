# Quinn (QA) — Site Pilot MCP prove criteria

**Status:** **PROVEN** — PAGE FINAL PASS HARD-GREEN 2026-07-20 (15/15)  
**Updated:** 2026-07-20  
**Screen:** `site-pilot` (Agentic Site Pilot Home, Legacy child 11 → React `screens/home/*`)  
**Refs:** [STUDIO_AUTO_RULES.md](../../../product/STUDIO_AUTO_RULES.md) R11 · [URL.md](../../../shell/URL.md) · `sitePilotMcpProbeSteps.ts` · [FE_AUDIT_SITE_PILOT_PAGE_FINAL_PASS_2026-07-20.md](./FE_AUDIT_SITE_PILOT_PAGE_FINAL_PASS_2026-07-20.md)

---

## Prove URL (R11)

```
http://localhost:5173/?project=boots-pharmacy&screen=site-pilot
```

```js
await window.__studioRunMcpPageProbe?.({ screenId: "site-pilot", reload: false })
```

## Matrix (shipped)

overlay-arm · site-pilot-host · legacy-retired · landmarks · heading logged-out/in · query · DS hover send/mic/chip · send→chat · restore · chip→chat · restore · url-screen

Auth heading SSoT: `__studioSetLoggedIn` / `isStudioLoggedIn` only.
