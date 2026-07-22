# FE / UI / UX audit — CJM relocation, deployed catalog, and delete protection

**Date:** 2026-07-21
**Auditor:** Quinn (QA), independent strict post-implementation re-audit
**Verdict:** **PROVEN**
**PO green-light allowed:** **Yes**

> **Superseded compatibility outcome (2026-07-22):** the legacy Agentic recording is now safely re-testable and has passed current playback proof. Structural blockers remain enforced. See [FE_AUDIT_CJM_COMPATIBILITY_RETEST_2026-07-22.md](FE_AUDIT_CJM_COMPATIBILITY_RETEST_2026-07-22.md).

## Verdict

The prior clean-deployment blocker is closed. `PersonaDefinition` now carries deployed `journeyRecordings`; the Sarah catalog exposes all embedded sessions keyed by journey id; and runtime metadata resolves a browser-local draft first, then immutable deployed evidence. The clean-origin regression proves there is no `recording-source-missing`, all ten current-contract Traditional recordings are playable, and the one genuinely legacy Agentic recording remains truthfully blocked rather than being falsely upgraded.

## Interaction and contract matrix

| Contract | Result | Evidence |
|---|---|---|
| Persona-owned runtime catalog | **PASS** | Boots/Sarah imports its authoritative catalog from `personas/sarah-jenkins/cjm/`; legacy `journeys.ts` is a compatibility re-export. |
| Exact catalog and uniqueness | **PASS** | 13 entries and 13 unique IDs: 2 built-ins plus 11 promoted recording files. |
| File envelope and evidence | **PASS** | All 11 promoted files match Boots/Sarah, contain non-empty journeys/beats, and preserve recording events. |
| Localhost picker | **PASS** | Supported runtime catalog returned exactly 13 unique CJMs; picker rendered those 13 plus CREATE NEW. |
| Deployed-file delete protection | **PASS** | All 13 file-backed entries rendered disabled delete controls with the specific deployed-project tooltip. Protection derives from the active persona catalog. |
| Local-draft deletion boundary | **PASS** | Only persona file-backed IDs populate the protected set; runtime-only draft IDs remain deletable. |
| Project/persona runtime isolation | **PASS** | Active-owner hydration clears the previous runtime import catalog before loading the next owner. |
| Promoted recording provenance | **PASS** | `SARAH_JENKINS_CJM_RECORDINGS` retains embedded sessions and `PersonaDefinition.journeyRecordings` transports them to App metadata resolution. |
| Local override precedence | **PASS** | Resolver uses persisted local evidence first and deployed evidence as the clean-origin fallback. |
| Clean-deployment compatibility | **PASS** | Regression builds metadata exclusively from deployed evidence and proves no `recording-source-missing`. |
| Current-contract playability | **PASS** | All 10 `rec-trad-*` promoted recordings are playable under the current contract. |
| Legacy diagnostic truth | **PASS** | `rec-agentic-mru4b15c-jnhv` retains `legacy-recording-contract`; it is not silently marked compatible. |

## Focused test evidence

Focused `vitest`: **3 files passed, 12 tests passed**.

- `cjm/__tests__/catalog.test.ts`
- `journeyRuntimeStore.test.ts`
- `recordingMetadata.test.ts`

No remaining blocker was found in the audited relocation/catalog/delete-protection seam.

## Knowledge used

- **Quinn (QA):** TEAM_KNOWLEDGE fixed-localhost, source-plus-live, and false-PROVEN rules; LESSONS imported-store catalog truth and REC provenance honesty; RECORDING `.journey.json` embedded-session contract; PLAYBACK compatibility and stop-on-failure rules. Applied by requiring clean-origin metadata proof, preserving the real legacy warning, and distinguishing deployed protection from local-draft behavior.
