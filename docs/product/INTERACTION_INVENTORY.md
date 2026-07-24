# Interaction inventory — scalable target foundation

**Status:** Engine contract · schema v1  
**Scope:** Every registered project screen plus Hub

## Product decision

UX Studio maps interactions before it executes them. The engine must never
blind-click every control: arbitrary activation can submit forms, alter auth,
book appointments, delete data, download files, or leave the prototype.

The inventory is the stable foundation for future programmable connections:

`project → surface → target → optional declared connection`

Raw CSS selectors are evidence, not durable product identity. Future
connections should address `{ projectId, surfaceId, targetId }` and declare
expected outcomes, risk, reset, and rollback.

## Runtime and QA

- `await window.__studioMapCurrentInteractions()`
- `await window.__studioMapAllInteractions()`
- `window.__studioGetLastInteractionInventory()`
- `window.__studioDownloadInteractionInventory()`

The QA dropdown exposes **Map current page interactions** and
**Map all project interactions**. The all-project run traverses the active
project's canonical screen registry and treats Hub as a first-class surface.

## Discovery and readiness

The mapper scans only the active visible project root and excludes Studio
chrome, QA UI, diagnostics, the robo cursor, hidden parked screens, and inert
content. It discovers native controls and links, interactive ARIA roles,
focusable/Studio-hooked elements, and visible CSS `cursor:pointer` candidates.

| Class | Meaning |
|---|---|
| `ready-target` | Named and uniquely targetable now |
| `semantic-ready` | Valid interaction; stable Studio hook still missing |
| `visual-candidate` | Looks interactive but is not a declared target yet |
| `disabled` | Intentionally unavailable |
| `invalid` | Contract breach such as missing name or nested control |

Decorative candidates are findings, not failures. Traversal errors set
`pass=false`; contract defects set `readinessPass=false`. Results are versioned
JSON so later tooling can diff removed or changed targets.

## Mandatory page lifecycle use

- **Coarse Figma / early concept:** map the existing project first to reuse its
  target conventions; map the new page after wiring; resolve invalid contracts
  and explicitly classify visual-only candidates before calling it record-ready.
- **Legacy → React migration:** download the legacy page map before retirement;
  rerun after the React mount; require `readinessPass=true` and reconcile every
  removed or renamed target. Unexplained target loss blocks PAGE FINAL PASS.
- **Handoff:** attach the JSON result so future CJMs and connection tooling use
  the same `{ projectId, surfaceId, targetId }` contract.

## Next contract: programmable connections

Add an engine capability registry where projects may declare reversible
executors: `targetId + action + expected outcome + risk + reset + rollback`.
Only declared safe capabilities may execute automatically. Submit, purchase,
delete, auth mutation, file, download, and external navigation remain blocked
without explicit policy.
