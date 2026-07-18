/**
 * MCP smoke guide — run in Chrome DevTools MCP against npm run dev.
 *
 * 1. navigate_page → http://localhost:5173 (or active Vite port)
 * 2. evaluate_script → await window.__protoEnsureCleanStudio?.()
 * 3. evaluate_script → window.__protoSmokeRetreatChecks?.()
 * 4. evaluate_script → await window.__protoRunHomePlaySmoke?.()
 *    Pass: { pass: true, state: { label: "Chat experience …", … } }
 * 5. evaluate_script → window.__protoSetOrchestraMode?.('traditional-cjm')
 * 6. Retreat baselines — avail June 25, chat counter not 2/25 after step-back
 *
 * Helpers:
 *   __protoSetJourneyMode(true | false)
 *   __protoTriggerTransport('play' | 'step-forward' | 'step-back' | …)
 *   __protoStudioState()
 */

console.log(`
Proto smoke (MCP):
  await window.__protoEnsureCleanStudio?.()
  window.__protoSmokeRetreatChecks?.()
  await window.__protoRunHomePlaySmoke?.()
  window.__protoSetOrchestraMode?.('agentic-cjm' | 'traditional-cjm')
  window.__protoTriggerTransport?.('play')
  window.__protoStudioState?.()
`);
