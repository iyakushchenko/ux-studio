# FE audit — Auto-Rule `agent-teardown-clean` (sticky modal after probe)

**Date:** 2026-07-19  
**Stream:** Probe / forceClear / sitrep teardown  
**Verdict:** **FAIL → PASS (PROVEN)**  
**Tip (pre-bump):** prove on localhost `127.0.0.1:5186` after HMR + hard reload  

## FAIL (prior)

Live URL after agent MCP probe left sticky modal:

`...?screen=pdp&...&modal=choose-pharmacy`

AGENT TESTING / Choose Pharmacy dialog stayed open. PO rage — recurring felony.

**Root cause:**

1. `buildStudioPostAgentStayState` preserved `modalId`; `resetStudioAfterAgentTest` re-wrote `&modal=`.
2. App `onPostAgentReset` called `closeAllPopups()` then `applyStudioScreen({ modalId: state.modalId })` → **re-opened** the dialog.
3. (Secondary) `__studioWaitAgentTeardownClean` was auto-armed by `helperOverlayArm` → re-created overlay while asserting clear.

## PASS (fix)

| Check | Result |
|-------|--------|
| Overlay root `#agent-testing-overlay` absent after forceClear | **PASS** |
| `URLSearchParams` has no `modal` | **PASS** |
| No `[data-studio-modal]` dialog | **PASS** |
| Intentional-close URL bridge suppress still in place | **PASS** (unchanged v0.0.19) |
| PDP open avail (`choose-pharmacy`) → forceClear → wait assert | **PASS** MCP |

**MCP prove (localhost):**

```js
// open Check availability → modal=choose-pharmacy + dialog
window.__studioAgentTestingOverlay.forceClear()
await window.__studioWaitAgentTeardownClean(1500)
// → { pass: true, failures: [], snapshot: { overlayRootPresent: false, modalParam: null, blockingModalDomPresent: false } }
```

## Teardown sequence (deterministic)

1. `stopAgentTestingOverlay` → sitrep → `enterSettle` → `resetStudioAfterAgentTest` (strip modal + event)
2. Probe/session `finally` → `resetStudioAfterAgentTest` again
3. App `studio-post-agent-reset` → `closeAllPopups()` + `applyStudioScreen({ modalId: undefined })`
4. `scheduleAgentTestingOverlayEnsureClear` → `forceClear` if overlay DOM stuck
5. `forceClear`: reset URL/modals → hard-remove overlay last

## Auto-Rule / CI gate (not one-off)

| Artifact | Role |
|----------|------|
| `src/app/shell/studioAgentTeardownContract.ts` | Runtime assert + window MCP API |
| `src/app/shell/studioAutoRules.ts` | Arch catalog (`STUDIO_AUTO_RULES`) |
| `check:felonies` §9 `agent-teardown-clean` | Fails if unwired / stay preserves modal / App re-applies |
| Vitest `studioAgentTeardownContract.test.ts` + probe teardown cases | Unit contract |
| [STUDIO_AUTO_RULES.md](../STUDIO_AUTO_RULES.md) R1 | Framework row |

**PO green-light:** teardown is gated — regressing sticky modal fails `npm test`.
