# UX Studio — product forecast (engine)

**Updated:** 2026-07-19  
**Owner:** Tech Director (decisive; not a menu for the PO)  
**Board:** [NEXT_STEPS.md](./NEXT_STEPS.md) · Doctrine: [COMMAND_DOCTRINE.md](./COMMAND_DOCTRINE.md)

This is the engine-level map of what must exist before UX Studio is a real product — not a Boots page backlog.

---

## Verdict

Ship the **control room** first: deep-linkable screens, recordable interactions, clean agent chrome, slim CI, multi-project registry. Concept pages (Boots) are the rabbit; they do not define the product ceiling.

---

## Pillars (ordered)

### 1. URL / routing — NOW (foundation landed)

| Need | Decision |
|------|----------|
| Shareable screen links | Query scheme `?project=&screen=` ([../shell/URL.md](../shell/URL.md)) |
| Pages-safe | No path router; Vite `base` + query only |
| Refresh restore | URL wins over session when present |
| Recording | `screen` events + snapshot `screenId` / `studioUrl` |
| Clean bar | Strip `proof` + ephemeral keys on boot / overlay stop |

**Next:** optional `beat` / `touchpoint` query only when CJM-on and non-noisy; never encode popup/ephemeral UI.

### 2. Recording fidelity — PARTIAL (screen replay landed)

| Need | Decision |
|------|----------|
| Ordered page transitions | `kind: "screen"` + existing touchpoint/transport |
| Replay deep links | **Landed** — `applyStudioScreen` shared with refresh/popstate |
| Demo-click / wire-intent | v2 — selector chain already stored |
| Compile → journeys | Only after screen + transport replay is boringly reliable |

Gate: no “recordable” claim on visual-only strips ([INTERACTION_FIDELITY.md](./INTERACTION_FIDELITY.md)).

### 3. Interaction fidelity — ONGOING

Shared kits in `src/uxds/interactions/` + React screen contracts. Project DOM scripts shrink as pages migrate. Fake data OK; dead CTAs are not.

### 4. Multi-project — STRUCTURAL

| Need | Decision |
|------|----------|
| Registry | `src/projects/registry.ts` already |
| Isolation | Engine in `src/app/`; brand only under `src/projects/<id>/` |
| Second rabbit | Only after Boots book flow + URL + REC are stable on Pages |
| Theme | Optional `theme.css` remaps — never fork UXDS |

### 5. UXDS growth — BY MIGRATION

Extract kits when a **second** screen needs them ([COMPONENT_LIBRARY.md](./COMPONENT_LIBRARY.md)). No speculative catalog. Token bridge + deviations registered ([../uxds/DEVIATIONS.md](../uxds/DEVIATIONS.md)). Hex→token debt is hygiene, not a blocker for engine pillars.

### 6. CI budget — LOCKED

| Lane | Policy |
|------|--------|
| Default push | Unit + build (+ cheap contracts) |
| Playwright smoke | `workflow_dispatch` / local only |
| Full marathon | Never stack on every PR without Director rewrite of [CI_ACTIONS_BUDGET.md](./CI_ACTIONS_BUDGET.md) |

### 7. GitHub Pages — RELEASE SURFACE

Deploy is the PO share URL. After chrome/URL/recording ships: verify live host (`data-proto-react-screen`, deep link, overlay). Deploy green ≠ visual proof.

### 8. Agent overlay — POLICY (landed)

| Rule | Behavior |
|------|----------|
| When agent drives UI | BR **AGENT TESTING** panel + invisible click guard |
| Arm | `__protoRun*` sessions; mutating `__proto*` helpers via `touch()`; DevTools-only → call `touch()` first |
| Stop | MCP `finally` → `stop({ reload: true })`; strip ephemeral query |
| Never | Lightbox; sticky `?proof=` |

### 9. Versioning — HABIT THEN AUTOMATION

Local `npm run notes:append` + CHANGELOG on user-visible ships ([VERSIONING.md](./VERSIONING.md)). Release/tag CI **later** when habit is stable and Actions budget allows.

### 10. X-Suite later — SEAM ONLY

Summarizer → Studio import stays a documented seam ([X_SUITE_INTEGRATION.md](./X_SUITE_INTEGRATION.md)). Do not build a second studio inside Summarizer. Journey bundle JSON is the handshake.

---

## Risks (watch continuously)

| Risk | Why it kills the product | Mitigation |
|------|--------------------------|------------|
| Visual / style zoo | PO cannot trust L&F across pages | DS strictness + Nazi QA PROVEN |
| Dead UI “recordings” | Replay lies | Interaction fidelity gate |
| URL / session fight | Deep links flaky | URL wins on boot; replaceState sync |
| Agent overlay sticky / proof junk | Rage + broken share links | Strip ephemeral; nest-aware stop+reload |
| CI Actions burn | Budget death | Slim default CI |
| LEGACY CSS growth | Unmaintainable Make dump | No new React styles in LEGACY |
| Subagent “done” | Silent regressions | Parent verifies; §6–§7 doctrine |
| Premature multi-project | Split focus | Boots rabbit until book+URL+REC proven |

---

## Sequencing (Director lock)

1. **URL + overlay + clean bar** — landed  
2. **Recording screen markers → replay restore** — landed (`applyStudioScreen`)  
3. **Finish Boots book React migration + fidelity debt** (parallel, non-blocking for engine)  
4. **UXDS extract-on-second-use**  
5. **Second project rabbit**  
6. **Release CI + broader CSS contracts**  
7. **X-Suite handshake**

PO accept/reject is on product outcomes (shareable proof, recordable journeys). Tech path above is not optional shopping.
