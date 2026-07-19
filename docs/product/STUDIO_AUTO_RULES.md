# Studio Auto-Rules / Auto-Gates framework

**Status:** Locked (PO mandate, 2026-07-19) — recurring PO pain → automatic CI / probe contracts  
**Owners:** Arch (Director) catalogs · Ben (BE) wires scripts · Quinn (QA) owns MCP probe steps · Finn/Uma plug ratchets  
**Entry:** `npm test` (all static gates) · MCP page probe teardown (runtime)  
**Do not:** invent a parallel unused gate system — **extend** `check:felonies` / `check:parity-*` / `check:page-final-pass` / probe recipes.

**PO contract:** Dismiss/modal sticky, auth SSoT drift, logged-out avail wrong start, brand-active teal, §0b rhythm regressions — **CI catches them**. Do not re-ask the team in chat.

---

## How this unifies (one system)

| Layer | Command | Role |
|-------|---------|------|
| Naming / overlay / modal URL / **probe teardown** / **auth SSoT** | `npm run check:felonies` | Hard laws — agent felony |
| Make→React typical misses + **avail start** + **§0b rhythm markers** | `npm run check:parity-ratchets` | Source contracts |
| Audit honesty (PROVEN + MCP matrix) | `npm run check:parity-proven` | No chat-only PROVEN |
| Page close sequencing | `npm run check:page-final-pass` | No next page until hard-green |
| **Brand theme wins** (active pills/tabs) | `npm run check:theme-brand` | Theme remaps interactive actives |
| Links / hygiene / version | `check:links` · `check:hygiene` · `check:version` | Existing companions |
| Vitest unit | `vitest run` (via `npm test`) | Teardown / auth / avail intent |
| MCP probe runtime | `__studioRunMcpPageProbe` | Hover/click matrix + **end contract** |

`package.json` → `npm test` runs **all** static layers above, then Vitest. No fork.

---

## Auto-rules catalog (live in CI)

| # | Id | Rule (PO pain) | Static gate | Unit / script | MCP probe |
|---|-----|----------------|-------------|---------------|-----------|
| R1 | **`agent-teardown-clean`** | Overlay dismissed, `&modal=` stripped, modal UI closed | `check:felonies` §9 | `studioAgentTeardownContract` + URL/probe tests | After settle: `__studioAssertAgentTeardownClean` / `__studioWaitAgentTeardownClean` |
| R2 | **`auth-ssot`** | `studioAuthSession` / `__studioIsLoggedIn` only | `check:felonies` §10 | `studioAuthSession.test.ts` | Probe reads `__studioIsLoggedIn` |
| R3 | **`avail-logged-out-start`** | Logged-out avail → Find Pharmacy (`start`) | `check:parity-ratchets` | `resolveAvailIntent.test.ts` | PDP `pdp-check-avail-logged-out` |
| R4 | **`pdp-rtb-rhythm`** | Uma §0b vertical rhythm markers | `check:parity-ratchets` | — | Uma MCP measure still required for PROVEN |
| R5 | **`theme-brand-active`** | Brand primary wins on active pills/tabs | `check:theme-brand` | — | Uma pixel prove when theme changes |
| R6 | *(existing)* | Overlay eyes / modal URL registry | `check:felonies` | modal bridge tests | `*-overlay-eyes`, open/close modal URL |
| R7 | *(existing)* | Parity typical misses | `check:parity-ratchets` | — | PLP/PDP recipe steps |
| R8 | *(existing)* | PROVEN honesty | `check:parity-proven` | — | Matrix evidence |
| R9 | *(existing)* | PAGE FINAL PASS | `check:page-final-pass` | — | `mcpFinalPass` stamp |

**Code catalog:** `src/app/shell/studioAutoRules.ts` (`STUDIO_AUTO_RULES`) — keep ids in sync with this table.

---

## R1 — Probe end teardown (HARD)

**Fail class:** After agent testing / MCP probe, sticky AGENT TESTING overlay and/or sticky `&modal=` (choose-pharmacy etc.) and reopen thrash.

**Contract (deterministic):**

1. `buildStudioPostAgentStayState` / hub builders **omit** `modalId`.
2. `resetStudioAfterAgentTest` always writes `modalId: undefined` + dispatches close-all.
3. App `onPostAgentReset` **never** re-applies `modalId` from event detail.
4. `runMcpPageProbe` / `withMcpTestSession` `finally`:
   - `stopAgentTestingOverlay` (sitrep) or `forceClearAgentTestingOverlay` on throw
   - `resetStudioAfterAgentTest` again
   - `scheduleAgentTestingOverlayEnsureClear(settle+1s)` → `forceClear` if DOM remains
5. Unit tests assert post-probe URL has **no** `modal=`.
6. Code catalog: `STUDIO_AUTO_RULES` id `agent-teardown-clean` · contract `studioAgentTeardownContract.ts`.

**MCP prove:**

```js
window.__studioAgentTestingOverlay?.forceClear?.()
await window.__studioWaitAgentTeardownClean?.(1200)
// → { pass: true, failures: [], snapshot: { overlayRootPresent: false, modalParam: null, … } }
```

**Recovery (human):** `window.__studioAgentTestingOverlay?.forceClear()` once after refresh.

---

## R2 — Auth SSoT

**Single module:** `src/app/shell/studioAuthSession.ts`  
**Window:** `__studioIsLoggedIn` / `__studioSetLoggedIn` (`__proto*` aliases).  
**Aliases OK:** `isHeaderLoggedIn` / `setHeaderLoggedIn` → must call SSoT (not a second store).

**Felony:** parallel logged-in flags (`localStorage` auth keys, duplicate booleans that bypass SSoT for CTA/avail branching).

---

## R3 — Logged-out avail starts on Find Pharmacy

`resolveAvailIntent` when logged-out and no chosen location → `{ step: "start" }` for date/time/list/map intents.  
PDP Check availability must open Availability at **start**, not Choose Date.

---

## R4 — Uma §0b rhythm (automatable slice)

Static ratchet locks PDP RTB column `gap: 32px` + LEGACY exclusion `:not(.pdp__rtb-card)`.  
**Does not replace** Uma MCP measure before fidelity IN PROGRESS / PROVEN ([UMA_FIDELITY_NOTES.md](./UMA_FIDELITY_NOTES.md) §0b).

---

## R5 — Brand theme wins (`check:theme-brand`)

When a project ships `styleguide/theme.css` under `[data-studio-project="…"]`:

1. Must define `--project-brand-primary`.
2. Must remap `--uxds-filter-chip-surface-selected-strong` to `var(--project-brand-primary)` (or brand token chain — **not** a raw UXDS default hex that bypasses brand).
3. UXDS `filter-chip.css` strong selected states must use `var(--uxds-filter-chip-surface-selected-strong)` (no hard-coded active fill that ignores theme).
4. Boots Availability store filters must use `.uxds-filter-chip--strong` (theme-bound active).

**Sibling hook:** Uma/Finn brand-primary pill fixes plug into this check — extend the script, do not add a second brand gate.

---

## Adding a rule (Arch / Ben)

1. Reproduce once in [LESSONS_LEARNED.md](./LESSONS_LEARNED.md).  
2. Prefer cheapest **source** assertion in the **existing** check family (felony vs ratchet vs theme-brand).  
3. Add unit/probe assert when runtime.  
4. Row in this catalog + [TEAM_KNOWLEDGE.md](./TEAM_KNOWLEDGE.md) stamp — **PO must not re-ask**.

---

## Related

- [COMMAND_DOCTRINE.md](./COMMAND_DOCTRINE.md) · [TEAM_KNOWLEDGE.md](./TEAM_KNOWLEDGE.md) · [PARITY_RATCHETS.md](./PARITY_RATCHETS.md)  
- [UMA_FIDELITY_NOTES.md](./UMA_FIDELITY_NOTES.md) §0b · [../shell/RECORDING.md](../shell/RECORDING.md) · [../shell/URL.md](../shell/URL.md)  
- Scripts: `scripts/check-agent-felonies.mjs` · `scripts/check-parity-ratchets.mjs` · `scripts/check-theme-brand.mjs`
