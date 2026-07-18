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
 * Or: npm run smoke (Playwright headless, needs dev server)
 */

console.log(`
Proto smoke (MCP):
  await window.__protoEnsureCleanStudio?.()
  window.__protoSmokeRetreatChecks?.()
  await window.__protoRunHomePlaySmoke?.()
  await window.__protoRunRetreatSmoke?.()
  window.__protoStudioState?.()
`);
