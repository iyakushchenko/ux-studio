/**
 * MCP smoke guide — run in Chrome DevTools MCP against npm run dev.
 *
 * 1. navigate_page → http://localhost:5173
 * 2. evaluate_script → await window.__protoEnsureCleanStudio?.()
 * 3. evaluate_script → window.__protoSmokeRetreatChecks?.()
 * 4. evaluate_script → await window.__protoRunHomePlaySmoke?.()
 * 5. evaluate_script → await window.__protoRunRetreatSmoke?.()
 *    Checks: chat counter >= 10 (not 2/25), avail June 25 on step-back
 *
 * Traditional CJM (switch orchestra mode first):
 * 6. evaluate_script → window.__protoSetOrchestraMode?.('traditional-cjm')
 * 7. evaluate_script → await window.__protoRunTraditionalPlaySmoke?.()
 * 8. evaluate_script → await window.__protoRunTraditionalStepForwardSmoke?.()
 * 9. evaluate_script → await window.__protoRunTraditionalRetreatSmoke?.()
 *
 * PO mid-flight (R15): step-forward + Play smokes poll __studioConsumePoSignal
 * each beat. Alarm → fail with reason po-alarm:* + poSignal.diagSnapshot.
 * Soft Alarm: { continueOnPoAlarm: true }. See docs/shell/PLAYBACK_DIAG.md.
 *
 * Or: npm run smoke (Playwright headless, needs dev server)
 */

console.log(`
Proto smoke (MCP):
  await window.__protoEnsureCleanStudio?.()
  window.__protoSmokeRetreatChecks?.()
  await window.__protoRunHomePlaySmoke?.()
  await window.__protoRunRetreatSmoke?.()
  window.__protoStudioState?.()

Traditional CJM (MCP):
  window.__protoSetOrchestraMode?.('traditional-cjm')
  await window.__protoRunTraditionalPlaySmoke?.()
  await window.__protoRunTraditionalStepForwardSmoke?.()
  await window.__protoRunTraditionalRetreatSmoke?.()

PO Alarm mid-smoke (R15 — wired into Play / step-forward):
  // smokes poll __studioConsumePoSignal each beat; Alarm aborts with poSignal
  window.__studioAgentTestingOverlay?.touch?.()
  const run = window.__protoRunAgenticPlaySmoke?.({ timeoutMs: 90_000 })
  // ring Alarm while on-air → expect pass:false reason po-alarm:*
`);
