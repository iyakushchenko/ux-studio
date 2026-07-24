/**
 * Visible MCP page probe — drives the CJM/AIR robo-cursor to click targets
 * and logs each step as PASS / FAIL on the AGENT TESTING overlay.
 *
 *   await window.__studioRunMcpPageProbe?.()
 *   await window.__studioRunMcpPageProbe?.({ screenId: "plp" })
 *   await window.__studioRunMcpPageProbe?.({ screenId: "pdp", reload: false })
 *   await window.__studioRunMcpPageProbe?.({ screenId: "site-pilot", reload: false })
 *   await window.__studioRunMcpPageProbe?.({ screenId: "chat", reload: false })
 */

import {
  simulateDemoPointerClick,
  simulateDemoPointerHover,
} from "@/app/scenario/demoCursor";
import { waitForContentLoadSettled } from "@/app/scenario/playbackReadiness";
import {
  getPrototypeScrollRoot,
  isDemoTargetInPrototypeView,
  revealDemoTargetForAgent,
  scrollCameraToOrigin,
} from "@/app/scenario/playbackScroll";
import {
  DEFAULT_PREARM_MS,
  DEFAULT_SETTLE_MS,
  ensureAgentTestingOverlayDomArmed,
  forceClearAgentTestingOverlay,
  isAgentTestingOverlayActive,
  isAgentTestingOverlayDomVisible,
  logAgentTestingOverlay,
  logAgentTestingStep,
  markAgentTestingTimeline,
  preArmAgentTestingOverlay,
  scheduleAgentTestingOverlayEnsureClear,
  setAgentTestingTimeline,
  startAgentTestingOverlay,
  stopAgentTestingOverlay,
  touchAgentTestingOverlay,
} from "@/app/shell/agent-testing/agentTestingOverlay";
import { logControlPanel } from "@/app/shell/controlPanelLog";
import { pollSmokePoSignal } from "@/app/shell/smokePoSignalPoll";
import { isLegacyRetiredForScreen } from "@/projects/boots-pharmacy/screens/retireLegacyUnderPage";
/** Ensure Boots screen recipes are registered before probe resolve. */
import "@/projects/boots-pharmacy/screens/registerMcpPageProbes";
import {
  beginMcpTestSession,
  endMcpTestSession,
  getMcpTestSession,
  requestMcpTestAbort,
} from "@/app/shell/mcpTestGuard";
import {
  resolveMcpPageProbeSteps,
  type McpPageProbeStep,
} from "@/app/shell/mcpPageProbeRegistry";
import {
  disableCursorQaEyes,
  enableCursorQaEyes,
} from "@/app/shell/playbackCursorDiagnostic";
import {
  isBlockingModalOpen,
  isElementBlockedByModal,
} from "@/app/shell/studioModalGuard";
import {
  parseStudioUrl,
  resetStudioAfterAgentTest,
} from "@/app/shell/studioUrl";

export type McpPageProbeStepResult = {
  id: string;
  pass: boolean;
  detail?: string;
};

export type McpPageProbeResult = {
  pass: boolean;
  screenId: string;
  checks: McpPageProbeStepResult[];
  url?: string;
};

export type McpPageProbeOptions = {
  /** Override URL screen; default = current address-bar screen. */
  screenId?: string;
  /** Force hub after stop (CJM/journey only). Default false — stay on page. */
  resetToHub?: boolean;
  /**
   * Sitrep then reload. Default **false** (crash-safe — no reload loop).
   * Pass `reload: true` only when the PO wants one clean-tab reload after sitrep.
   */
  reload?: boolean;
  /**
   * Pre-arm countdown before first probe step (ms).
   * Default ~2500; BR panel shows "preparing…" so PO can watch.
   */
  preArmMs?: number;
  /** Sitrep visible duration (ms). Default ~9000. */
  settleMs?: number;
};

/** Cap reveal/scroll calls per probe run — prevents scrollIntoView storms. */
const MAX_PROBE_REVEALS = 24;
let probeRevealCount = 0;

type ProbeStep = McpPageProbeStep;

function normalizeText(el: Element | null | undefined): string {
  return (el?.textContent ?? "").replace(/\s+/g, " ").trim();
}

function looksFuchsiaColor(cssColor: string): boolean {
  const s = cssColor.toLowerCase();
  if (s.includes("e91e8c") || s.includes("c2186e")) return true;
  const m = s.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (!m) return false;
  const r = Number(m[1]);
  const g = Number(m[2]);
  const b = Number(m[3]);
  // Hot pink / fuchsia family — high R+B, suppressed G.
  return r > 180 && g < 80 && b > 100;
}

/** Best-effort: stylesheet contains a selector fragment (cross-origin sheets skipped). */
function stylesheetHasRule(selectorFrag: string): boolean {
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      continue;
    }
    for (const rule of Array.from(rules)) {
      const selectorText = (rule as CSSStyleRule).selectorText;
      if (typeof selectorText === "string" && selectorText.includes(selectorFrag)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Vitest-only: crush visual probe dwells so CI isn't wall-clock-bound by
 * recipe settleMs / waitMs. Production MCP (`__studioRunMcpPageProbe`) never
 * sets `process.env.VITEST` — real settles / mid-load windows stay intact.
 */
function shouldCompressProbeDelays(): boolean {
  return typeof process !== "undefined" && Boolean(process.env?.VITEST);
}

/** @internal exported for unit proof that production scale is identity */
export function compressProbeDelayMs(
  ms: number,
  kind: "settle" | "wait" = "settle"
): number {
  if (!shouldCompressProbeDelays()) return ms;
  if (!Number.isFinite(ms) || ms <= 0) return 0;
  // Keep short mid-load windows (e.g. PLP reset settleMs: 80) observable.
  if (kind === "settle" && ms <= 100) return ms;
  // Assert polls: enough budget for test mocks (setTimeout ~120) — not 4s.
  if (kind === "wait") return Math.min(ms, 250);
  return 1;
}

function delay(ms: number): Promise<void> {
  const t = compressProbeDelayMs(ms, "settle");
  if (t <= 0) return Promise.resolve();
  return new Promise((resolve) => {
    setTimeout(resolve, t);
  });
}

function logStep(id: string, pass: boolean, detail?: string): void {
  const tag = pass ? "PASS" : "FAIL";
  const line = detail ? `${tag}  ${id} — ${detail}` : `${tag}  ${id}`;
  logAgentTestingStep({
    kind: "step",
    label: line,
    action: id,
    touchpointKey: id,
    outcome: pass ? "ok" : "fail",
  });
  markAgentTestingTimeline(id, pass ? "ok" : "fail");
}

/** HARD FAIL — overlay must stay painted for the whole probe. */
function requireOverlayVisible(stepId: string): McpPageProbeStepResult | null {
  touchAgentTestingOverlay();
  if (
    !ensureAgentTestingOverlayDomArmed() ||
    !isAgentTestingOverlayDomVisible()
  ) {
    const detail = "agent testing overlay not visible";
    logStep(stepId, false, detail);
    return { id: stepId, pass: false, detail };
  }
  return null;
}

async function revealTargetForProbe(
  el: HTMLElement
): Promise<{ scrolled: boolean; inView: boolean }> {
  if (probeRevealCount >= MAX_PROBE_REVEALS) {
    return {
      scrolled: false,
      inView: isDemoTargetInPrototypeView(el),
    };
  }
  probeRevealCount += 1;
  return revealDemoTargetForAgent(el);
}

/** After a step, keep the action target clear of the BR sitrep panel. */
async function postStepReveal(el: HTMLElement | null): Promise<void> {
  if (!el?.isConnected) return;
  if (isDemoTargetInPrototypeView(el)) return;
  if (probeRevealCount >= MAX_PROBE_REVEALS) return;
  probeRevealCount += 1;
  await revealDemoTargetForAgent(el, { instant: true });
}

function logFinalSummary(checks: McpPageProbeStepResult[]): boolean {
  const passCount = checks.filter((c) => c.pass).length;
  const failCount = checks.length - passCount;
  const pass = failCount === 0 && checks.length > 0;
  const flag = pass ? "PASS" : "FAIL";
  logAgentTestingOverlay(
    `FINAL  ${flag}  ${passCount}/${checks.length} passed` +
      (failCount > 0 ? ` (${failCount} failed)` : "")
  );
  return pass;
}

function resolveScreenId(options?: McpPageProbeOptions): string {
  if (options?.screenId?.trim()) return options.screenId.trim().toLowerCase();
  return parseStudioUrl().screenId ?? "hub";
}

function plpProbeSteps(): ProbeStep[] {
  // Prefer button/React-owned nodes — Legacy leftovers can still match data-name.
  // Filters before Quick View (QV blocks under-page clicks — overlay eyes).
  return [
    {
      id: "plp-host",
      selector: '[data-studio-react-screen="plp"]',
      action: "assert",
      assert: () =>
        document.querySelector('[data-studio-react-screen="plp"]') != null ||
        "missing React PLP host",
    },
    {
      id: "plp-book-now",
      selector:
        '[data-studio-react-screen="plp"] button[data-studio-action="plp-book-now"]',
      action: "assert",
      assert: () =>
        document.querySelector(
          '[data-studio-react-screen="plp"] button[data-studio-action="plp-book-now"]'
        ) != null || "Book Now CTA missing",
    },
    {
      id: "plp-search-icons",
      selector:
        '[data-studio-react-screen="plp"] [data-studio-search-icon="true"]',
      action: "assert",
      assert: () => {
        const icons = document.querySelectorAll(
          '[data-studio-react-screen="plp"] [data-studio-search-icon="true"]'
        );
        if (icons.length < 2) {
          return `expected ≥2 filter search icons, found ${icons.length}`;
        }
        for (const el of icons) {
          const r = (el as HTMLElement).getBoundingClientRect?.();
          if (!r || r.width < 8 || r.height < 8) {
            return "search icon not visible / not laid out";
          }
          const pos = (el as HTMLElement).getAttribute(
            "data-studio-search-icon-pos"
          );
          if (pos !== "end") {
            return `search icon must be data-studio-search-icon-pos="end" (found ${pos ?? "missing"})`;
          }
        }
        const disease = document.querySelector(
          '[data-studio-react-screen="plp"] input[placeholder="Search diseases"]'
        );
        const country = document.querySelector(
          '[data-studio-react-screen="plp"] input[placeholder="Search countries"]'
        );
        for (const input of [disease, country]) {
          if (!input) return "filter search input missing";
          if ((input as HTMLInputElement).type === "search") {
            return "filter search must use type=text (native search X duplicates clear)";
          }
          const field = input.closest('[data-name="component.input.field"]');
          if (!field?.querySelector('[data-studio-search-icon="true"]')) {
            return "search input missing [data-studio-search-icon] sibling";
          }
          const clears = field.querySelectorAll(
            '[data-studio-search-clear="true"]'
          );
          // Empty field → 0 clears; filled would be 1. Never >1.
          if (clears.length > 1) {
            return `duplicate clear controls (${clears.length})`;
          }
        }
        return true;
      },
    },
    {
      id: "plp-filter-view-all",
      selector:
        '[data-studio-react-screen="plp"] [data-studio-plp-view-all="true"]',
      action: "assert",
      assert: () => {
        const links = document.querySelectorAll(
          '[data-studio-react-screen="plp"] [data-studio-plp-view-all="true"]'
        );
        if (links.length < 2) {
          return `expected ≥2 View all links (disease+country), found ${links.length}`;
        }
        return true;
      },
    },
    {
      id: "plp-filter-option-counters",
      selector:
        '[data-studio-react-screen="plp"] [data-studio-plp-option-count]',
      action: "assert",
      assert: () => {
        const rows = document.querySelectorAll(
          '[data-studio-react-screen="plp"] [data-studio-plp-option-count]'
        );
        if (rows.length < 4) {
          return `expected filter option counters, found ${rows.length}`;
        }
        for (const row of rows) {
          const n = (row as HTMLElement).getAttribute(
            "data-studio-plp-option-count"
          );
          if (n == null || !/^\d+$/.test(n)) {
            return "filter option missing numeric data-studio-plp-option-count";
          }
          const countEl = row.querySelector(".plp__option-count");
          if (!countEl || (countEl.textContent ?? "").trim() !== n) {
            return "filter option count label mismatch";
          }
        }
        return true;
      },
    },
    {
      id: "plp-checkbox-filter",
      selector:
        '[data-studio-react-screen="plp"] button[data-name="component.plp.filter.checkbox.item"]',
      action: "click",
      settleMs: 900,
    },
    {
      id: "plp-reset-visible",
      selector:
        '[data-studio-react-screen="plp"] button[data-studio-plp-reset-filters="true"]:not(.proto-plp-reset-filters-link)',
      action: "assert",
      waitMs: 4000,
      assert: () =>
        document.querySelector(
          '[data-studio-react-screen="plp"] button[data-studio-plp-reset-filters="true"]:not(.proto-plp-reset-filters-link)'
        ) != null || "reset filters missing after filter click",
    },
    {
      id: "plp-reset-filters",
      selector:
        '[data-studio-react-screen="plp"] button[data-studio-plp-reset-filters="true"]:not(.proto-plp-reset-filters-link)',
      action: "click",
      // Catch mid-load (platform STUDIO_CONTENT_LOAD_MS) — stale jab count must already be gone.
      settleMs: 80,
      assert: () => {
        const host = document.querySelector<HTMLElement>(
          '[data-studio-react-screen="plp"] [data-studio-plp-listing-phase]'
        );
        const phase = host?.getAttribute("data-studio-plp-listing-phase");
        if (phase !== "loading") {
          return `expected listing phase=loading during reset refresh (got ${phase ?? "missing"})`;
        }
        const count = document.querySelector<HTMLElement>(
          '[data-studio-react-screen="plp"] [data-studio-plp-results]'
        );
        if (!count) return "results count element missing";
        const stamped =
          count.getAttribute("data-studio-plp-results-loading") === "true" &&
          (count.getAttribute("data-studio-plp-results") ?? "") === "";
        const engineHidden =
          !stamped &&
          document.body?.getAttribute("data-studio-content-loading") === "plp" &&
          getComputedStyle(count).visibility === "hidden";
        if (!stamped && !engineHidden) {
          return "results count must be cleared or engine-hidden during refresh";
        }
        const text = (count.textContent ?? "").replace(/\s+/g, " ").trim();
        if (text.length > 0 && !engineHidden) {
          return `stale count visible during load: "${text}"`;
        }
        if (/\d+\s+jabs?\s+available/i.test(text) && !engineHidden) {
          return "jab-count text must not render while loading";
        }
        const loader = document.querySelector(
          '[data-studio-react-screen="plp"] [data-studio-plp-listing-loader="true"]'
        );
        if (!loader) return "listing loader missing during reset refresh";
        return true;
      },
    },
    {
      id: "plp-reset-count-ready",
      selector:
        '[data-studio-react-screen="plp"] [data-studio-plp-results]',
      action: "assert",
      waitMs: 4000,
      assert: () => {
        const host = document.querySelector<HTMLElement>(
          '[data-studio-react-screen="plp"] [data-studio-plp-listing-phase]'
        );
        const phase = host?.getAttribute("data-studio-plp-listing-phase");
        if (phase === "loading") return "still loading after reset";
        const count = document.querySelector<HTMLElement>(
          '[data-studio-react-screen="plp"] [data-studio-plp-results]'
        );
        if (!count) return "results count missing after load";
        if (count.getAttribute("data-studio-plp-results-loading") === "true") {
          return "results-loading marker still set after load";
        }
        const n = count.getAttribute("data-studio-plp-results");
        if (n == null || !/^\d+$/.test(n) || Number(n) < 1) {
          return `expected real numeric count after load (got ${n ?? "missing"})`;
        }
        const text = (count.textContent ?? "").replace(/\s+/g, " ").trim();
        if (!new RegExp(`^${n}\\s+jabs?\\s+available$`, "i").test(text)) {
          return `expected real count text after load (got "${text}")`;
        }
        return true;
      },
    },
    {
      id: "plp-quick-view-ready",
      selector:
        '[data-studio-react-screen="plp"] button[data-studio-quick-view="true"]',
      action: "assert",
      waitMs: 4000,
      assert: () => {
        const btn = document.querySelector<HTMLElement>(
          '[data-studio-react-screen="plp"] button[data-studio-quick-view="true"]'
        );
        if (!btn) return "Quick View button missing after reset";
        if (typeof btn.getBoundingClientRect === "function") {
          const r = btn.getBoundingClientRect();
          if (r.width < 2 || r.height < 2) {
            return "Quick View button not laid out";
          }
        }
        return true;
      },
    },
    {
      // Below-fold prove — last tile Quick View (stamped data-studio-probe-below-fold).
      // Scrolls prototype root into view; no click (QV open is the next step).
      id: "plp-below-fold-scroll",
      selector:
        '[data-studio-react-screen="plp"] button[data-studio-probe-below-fold="true"]',
      action: "reveal",
    },
    {
      id: "plp-quick-view",
      selector:
        '[data-studio-react-screen="plp"] button[data-studio-quick-view="true"]',
      action: "click",
      settleMs: 450,
      assert: () => {
        if (!isBlockingModalOpen()) {
          return "Quick View overlay did not open (registry / scrim miss)";
        }
        const { modalId, screenId } = parseStudioUrl();
        if (screenId !== "plp") {
          return `expected screen=plp while Quick View open, got ${screenId ?? "?"}`;
        }
        // URL.md: &modal=quick-view required; &jab= optional later (multi-SKU).
        if (modalId !== "quick-view") {
          return `expected &modal=quick-view after Quick View open, got ${modalId ?? "missing"}`;
        }
        return true;
      },
    },
    {
      id: "plp-overlay-eyes",
      selector:
        '[data-studio-react-screen="plp"] button[data-studio-action="plp-book-now"]',
      action: "refuse-click",
    },
    {
      id: "plp-quick-view-close",
      selector:
        '[data-studio-modal="quick-view"] button[aria-label="Close quick view"]',
      action: "click",
      settleMs: 400,
      assert: () => {
        if (isBlockingModalOpen()) {
          return "Quick View still open after close";
        }
        const { modalId, screenId } = parseStudioUrl();
        if (screenId !== "plp") {
          return `expected stay on screen=plp after close, got ${screenId ?? "?"}`;
        }
        if (modalId) {
          return `expected modal cleared after Quick View close, got &modal=${modalId}`;
        }
        return true;
      },
    },
  ];
}

/**
 * PDP probe (Quinn criteria 2026-07-19).
 * Overlay-arm is injected by runMcpPageProbe before these steps.
 * L14–L20 below-fold: reveal via data-studio-probe-below-fold on React band.
 */
function pdpProbeSteps(): ProbeStep[] {
  return [
    {
      id: "pdp-host",
      selector: '[data-studio-react-screen="pdp"]',
      action: "assert",
      assert: () => {
        if (document.querySelector('[data-studio-react-screen="pdp"]') == null) {
          return "missing React PDP host";
        }
        if (!isLegacyRetiredForScreen("pdp")) {
          return "Legacy leak: expected Legacy Frame children parked for pdp";
        }
        return true;
      },
    },
    {
      id: "pdp-landmarks",
      selector: '.pdp[data-studio-react-screen="pdp"]',
      action: "assert",
      assert: () => {
        const root = document.querySelector(
          '.pdp[data-studio-react-screen="pdp"]'
        );
        if (!root) return "missing BEM root .pdp";
        if (!root.querySelector("header")) return "missing header inside React host";
        if (!root.querySelector("main")) return "missing main inside React host";
        return true;
      },
    },
    {
      id: "pdp-advantage",
      selector: '.pdp[data-studio-react-screen="pdp"] .pdp__advantage',
      action: "assert",
      assert: () => {
        const bar = document.querySelector(
          '.pdp[data-studio-react-screen="pdp"] .pdp__advantage'
        );
        const text = normalizeText(bar);
        if (!/Collect 3 points for every £1/i.test(text)) {
          return `Advantage copy miss (got "${text.slice(0, 80)}")`;
        }
        return true;
      },
    },
    {
      id: "pdp-no-loader",
      selector: '.pdp[data-studio-react-screen="pdp"]',
      action: "assert",
      assert: () => {
        const root = document.querySelector(
          '.pdp[data-studio-react-screen="pdp"]'
        );
        if (!root) return "missing .pdp root";
        const text = normalizeText(root);
        if (/Updating…|Updating\.\.\./i.test(text)) {
          return "invented Updating… copy (LE1–LE3 N/A)";
        }
        if (
          root.querySelector(
            '[data-studio-plp-listing-loader], .pdp__loader, [data-studio-pdp-loader]'
          )
        ) {
          return "invented PDP loader / spinner";
        }
        return true;
      },
    },
    {
      id: "pdp-booster-price-on",
      selector:
        '.pdp[data-studio-react-screen="pdp"] button[data-studio-action="pdp-book-now"]',
      action: "assert",
      assert: () => {
        const box = document.querySelector<HTMLElement>(
          '.pdp[data-studio-react-screen="pdp"] button[data-name="component.input.checkbox"]'
        );
        if (box?.getAttribute("data-checkbox-checked") !== "true") {
          return "booster should be checked by default";
        }
        const book = document.querySelector(
          '.pdp[data-studio-react-screen="pdp"] button[data-studio-action="pdp-book-now"]'
        );
        const text = normalizeText(book);
        if (!/£150\b/.test(text)) {
          return `expected Book now £150 with booster (got "${text}")`;
        }
        return true;
      },
    },
    {
      id: "pdp-booster-uncheck",
      selector:
        '.pdp[data-studio-react-screen="pdp"] button[data-name="component.input.checkbox"]',
      action: "click",
      settleMs: 350,
      assert: () => {
        const box = document.querySelector<HTMLElement>(
          '.pdp[data-studio-react-screen="pdp"] button[data-name="component.input.checkbox"]'
        );
        if (box?.getAttribute("data-checkbox-checked") !== "false") {
          return "booster still checked after uncheck click";
        }
        const book = document.querySelector(
          '.pdp[data-studio-react-screen="pdp"] button[data-studio-action="pdp-book-now"]'
        );
        const text = normalizeText(book);
        if (!/£75\b/.test(text)) {
          return `expected Book now £75 without booster (got "${text}")`;
        }
        // Demo cursor does not force CSS :hover — prove mint hover via stylesheet rule.
        if (
          !stylesheetHasRule(".pdp__checkbox-row:hover .pdp__checkbox-box") &&
          !stylesheetHasRule(".pdp__checkbox-row:hover")
        ) {
          return "missing unchecked mint hover CSS for booster checkbox";
        }
        return true;
      },
    },
    {
      id: "pdp-booster-recheck",
      selector:
        '.pdp[data-studio-react-screen="pdp"] button[data-name="component.input.checkbox"]',
      action: "click",
      settleMs: 350,
      assert: () => {
        const book = document.querySelector(
          '.pdp[data-studio-react-screen="pdp"] button[data-studio-action="pdp-book-now"]'
        );
        const text = normalizeText(book);
        if (!/£150\b/.test(text)) {
          return `expected Book now £150 after recheck (got "${text}")`;
        }
        return true;
      },
    },
    {
      id: "pdp-heart-hover",
      selector:
        '.pdp[data-studio-react-screen="pdp"] button[aria-label="Add to wishlist"]',
      action: "hover",
      settleMs: 420,
      assert: () => {
        const heart = document.querySelector<HTMLElement>(
          '.pdp[data-studio-react-screen="pdp"] .pdp__heart-icon:not(.is-active)'
        );
        if (!heart) return "empty wishlist heart missing";
        const color = getComputedStyle(heart).color;
        if (looksFuchsiaColor(color)) {
          return `empty heart must not be fuchsia at rest (got ${color})`;
        }
        // Navy/teal glyph + mint wash on hover — CSS contract (I12 / PLP I10).
        if (
          !stylesheetHasRule(
            ".pdp__icon-hit:hover .pdp__heart-icon:not(.is-active)"
          )
        ) {
          return "missing empty-heart hover CSS (navy/link, not fuchsia)";
        }
        if (!stylesheetHasRule(".pdp__icon-hit:hover::before")) {
          return "missing mint wash hover CSS on wishlist hit";
        }
        return true;
      },
    },
    {
      id: "pdp-book-logged-out",
      selector:
        '.pdp[data-studio-react-screen="pdp"] button[data-studio-action="pdp-book-now"]',
      action: "click",
      settleMs: 450,
      assert: () => {
        if (!isBlockingModalOpen()) {
          return "Login modal did not open (logged-out Book now)";
        }
        const { modalId, screenId } = parseStudioUrl();
        if (screenId !== "pdp") {
          return `expected stay screen=pdp with login, got ${screenId ?? "?"}`;
        }
        if (modalId !== "login") {
          return `expected &modal=login, got ${modalId ?? "missing"}`;
        }
        return true;
      },
    },
    {
      id: "pdp-overlay-eyes-login",
      selector:
        '.pdp[data-studio-react-screen="pdp"] button[data-studio-action="pdp-check-availability"]',
      action: "refuse-click",
    },
    {
      id: "pdp-login-close",
      selector: '[data-studio-modal="login"] button[aria-label="Close login"]',
      action: "click",
      settleMs: 400,
      assert: () => {
        if (isBlockingModalOpen()) {
          return "Login still open after close";
        }
        const { modalId, screenId } = parseStudioUrl();
        if (screenId !== "pdp") {
          return `expected stay on screen=pdp after login close, got ${screenId ?? "?"}`;
        }
        if (modalId) {
          return `expected modal cleared after login close, got &modal=${modalId}`;
        }
        return true;
      },
    },
    {
      id: "pdp-check-avail",
      selector:
        '.pdp[data-studio-react-screen="pdp"] button[data-studio-action="pdp-check-availability"]',
      action: "click",
      settleMs: 500,
      assert: () => {
        if (!isBlockingModalOpen()) {
          return "Choose Pharmacy / Availability did not open";
        }
        const { modalId, screenId } = parseStudioUrl();
        if (screenId !== "pdp") {
          return `expected stay screen=pdp with avail, got ${screenId ?? "?"}`;
        }
        if (modalId !== "choose-pharmacy") {
          return `expected &modal=choose-pharmacy, got ${modalId ?? "missing"}`;
        }
        // Logged-out + no chosen location → Legacy first screen (Find Pharmacy), not Choose Date
        const loggedIn = window.__studioIsLoggedIn?.() ?? false;
        if (!loggedIn) {
          const step = document
            .querySelector<HTMLElement>(
              '[data-studio-modal="choose-pharmacy"] [data-studio-avail-step]'
            )
            ?.getAttribute("data-studio-avail-step");
          const title = document
            .querySelector<HTMLElement>("#proto-avail-title")
            ?.textContent?.trim();
          if (step !== "start" || title !== "Find Pharmacy") {
            return `logged-out Check availability must open Find Pharmacy (start), got step=${step ?? "?"} title=${title ?? "?"}`;
          }
        }
        return true;
      },
    },
    {
      id: "pdp-overlay-eyes-avail",
      selector:
        '.pdp[data-studio-react-screen="pdp"] button[data-studio-action="pdp-book-now"]',
      action: "refuse-click",
    },
    {
      id: "pdp-avail-close",
      selector:
        '[data-studio-modal="choose-pharmacy"] button[aria-label="Close Availability Tool"]',
      action: "click",
      settleMs: 400,
      assert: () => {
        if (isBlockingModalOpen()) {
          return "Availability tool still open after close";
        }
        const { modalId, screenId } = parseStudioUrl();
        if (screenId !== "pdp") {
          return `expected stay on screen=pdp after avail close, got ${screenId ?? "?"}`;
        }
        if (modalId) {
          return `expected modal cleared after avail close, got &modal=${modalId}`;
        }
        return true;
      },
    },
    {
      id: "pdp-crumb-plp",
      selector:
        '.pdp[data-studio-react-screen="pdp"] button[data-studio-crumb="vaccination"]',
      action: "click",
      settleMs: 500,
      assert: () => {
        const { screenId } = parseStudioUrl();
        if (screenId !== "plp") {
          return `expected screen=plp after Vaccination crumb, got ${screenId ?? "?"}`;
        }
        if (
          document.querySelector('[data-studio-react-screen="plp"]') == null
        ) {
          return "React PLP host missing after crumb";
        }
        return true;
      },
    },
    {
      id: "plp-to-pdp",
      selector:
        '[data-studio-react-screen="plp"] button[data-studio-action="plp-book-now"]',
      action: "click",
      settleMs: 550,
      waitMs: 4000,
      assert: () => {
        const { screenId } = parseStudioUrl();
        if (screenId !== "pdp") {
          return `expected screen=pdp after PLP Book now, got ${screenId ?? "?"}`;
        }
        if (
          document.querySelector('.pdp[data-studio-react-screen="pdp"]') == null
        ) {
          return "React PDP host missing after PLP→PDP";
        }
        return true;
      },
    },
    {
      id: "pdp-below-fold-scroll",
      selector:
        '.pdp[data-studio-react-screen="pdp"] [data-studio-probe-below-fold="true"]',
      action: "reveal",
    },
    {
      id: "pdp-faq-accordion-toggle",
      selector:
        '.pdp[data-studio-react-screen="pdp"] button[data-studio-action="pdp-faq-who-is-at-risk"]',
      action: "click",
      settleMs: 420,
      assert: () => {
        const trigger = document.querySelector<HTMLElement>(
          '.pdp[data-studio-react-screen="pdp"] button[data-studio-action="pdp-faq-who-is-at-risk"]'
        );
        if (!trigger) return "FAQ trigger missing";
        if (trigger.getAttribute("aria-expanded") !== "false") {
          return "expected Who is at risk? collapsed after toggle click";
        }
        const shell = document.querySelector<HTMLElement>(
          '.pdp[data-studio-react-screen="pdp"] [data-uxds-accordion-item="who-is-at-risk"] [data-name="uxds.interaction.accordion.content"], .pdp[data-studio-react-screen="pdp"] [data-uxds-accordion-item="who-is-at-risk"] .uxds-accordion-content'
        );
        if (
          document.querySelector(
            '.pdp[data-studio-react-screen="pdp"] [data-studio-accordion-open="who-is-at-risk"]'
          )
        ) {
          return "FAQ still stamped open while collapsed";
        }
        if (shell && shell.getAttribute("data-state") !== "closed") {
          return "FAQ content shell data-state should be closed";
        }
        return true;
      },
    },
    {
      id: "pdp-faq-accordion-reopen",
      selector:
        '.pdp[data-studio-react-screen="pdp"] button[data-studio-action="pdp-faq-who-is-at-risk"]',
      action: "click",
      settleMs: 420,
      assert: () => {
        const trigger = document.querySelector<HTMLElement>(
          '.pdp[data-studio-react-screen="pdp"] button[data-studio-action="pdp-faq-who-is-at-risk"]'
        );
        if (trigger?.getAttribute("aria-expanded") !== "true") {
          return "expected Who is at risk? expanded after reopen";
        }
        const body = document.querySelector(
          '.pdp[data-studio-react-screen="pdp"] [data-studio-accordion-open="who-is-at-risk"]'
        );
        if (!body || !/weakened immune system/i.test(normalizeText(body))) {
          return "FAQ open body missing Legacy copy";
        }
        const helpBody = document.querySelector(
          '.pdp[data-studio-react-screen="pdp"] [data-studio-accordion-open="how-can-boots-help"]'
        );
        // All six FAQ panels now have bodies (PO ask) — no residual headers.
        const residual = document.querySelectorAll(
          '.pdp[data-studio-react-screen="pdp"] [data-studio-faq-residual]'
        );
        if (residual.length !== 0) {
          return `expected 0 FAQ residual headers (all panels have bodies), got ${residual.length}`;
        }
        if (helpBody) {
          return "how-can-boots-help should be collapsed while who-is-at-risk is open (single)";
        }
        const helpTrigger = document.querySelector(
          '.pdp[data-studio-react-screen="pdp"] button[data-studio-action="pdp-faq-how-can-boots-help"]'
        );
        if (!helpTrigger) return "How can Boots help? trigger missing (body wired)";
        const nhsTrigger = document.querySelector(
          '.pdp[data-studio-react-screen="pdp"] button[data-studio-action="pdp-faq-nhs-vaccination"]'
        );
        if (!nhsTrigger) {
          return "NHS FAQ trigger missing (Bea body must be expandable)";
        }
        return true;
      },
    },
    {
      id: "pdp-faq-help-body",
      selector:
        '.pdp[data-studio-react-screen="pdp"] button[data-studio-action="pdp-faq-how-can-boots-help"]',
      action: "click",
      settleMs: 420,
      assert: () => {
        const body = document.querySelector(
          '.pdp[data-studio-react-screen="pdp"] [data-studio-accordion-open="how-can-boots-help"]'
        );
        if (
          !body ||
          !/private Chickenpox Vaccination Service/i.test(normalizeText(body))
        ) {
          return "How can Boots help? missing Legacy RTB service blurb";
        }
        if (
          !stylesheetHasRule(".pdp__accordion-header:focus-visible") &&
          !stylesheetHasRule(".pdp__accordion-header:focus")
        ) {
          return "missing accordion focus-none CSS (.pdp__accordion-header:focus)";
        }
        return true;
      },
    },
    {
      id: "pdp-download-cta-hover",
      selector:
        '.pdp[data-studio-react-screen="pdp"] button[data-studio-action="pdp-download-guide"]',
      action: "hover",
      settleMs: 320,
      assert: () => {
        const guide = document.querySelector(
          '.pdp[data-studio-react-screen="pdp"] button[data-studio-action="pdp-download-guide"]'
        );
        const leaflet = document.querySelector(
          '.pdp[data-studio-react-screen="pdp"] button[data-studio-action="pdp-download-leaflet"]'
        );
        if (!guide || !leaflet) return "download CTAs missing";
        if (
          leaflet.classList.contains("pdp__pill--bordered") ||
          guide.classList.contains("pdp__pill--bordered")
        ) {
          return "leaflet still has stub bordered class (Legacy hover mock)";
        }
        // Product tertiary unify — ignore demo-cursor hover/pressed classes
        // (`proto-chat-cta--hover`) that land on the hovered CTA during assert.
        const productPillClasses = (el: Element) =>
          String((el as HTMLElement).className || "")
            .split(/\s+/)
            .filter((c) => c.startsWith("pdp__"))
            .sort()
            .join(" ");
        const guideProduct = productPillClasses(guide);
        const leafletProduct = productPillClasses(leaflet);
        if (
          !/\bpdp__pill\b/.test(guideProduct) ||
          !/\bpdp__pill\b/.test(leafletProduct) ||
          guideProduct !== leafletProduct ||
          /\bpdp__pill--mint\b/.test(guideProduct) ||
          /\bpdp__pill--mint\b/.test(leafletProduct)
        ) {
          return "download CTAs must share the same tertiary .pdp__pill class";
        }
        if (
          !stylesheetHasRule(".pdp__pill:hover") &&
          !stylesheetHasRule(".pdp__pill:hover:not(:disabled)")
        ) {
          return "missing download CTA hover CSS (.pdp__pill:hover)";
        }
        if (
          !stylesheetHasRule(".pdp__pill:hover:not(:disabled) .pdp__pill-icon") &&
          !stylesheetHasRule(".pdp__pill:hover .pdp__pill-icon")
        ) {
          return "missing download CTA icon hover CSS";
        }
        if (stylesheetHasRule(".pdp__pill--bordered")) {
          return "stub .pdp__pill--bordered CSS still present";
        }
        return true;
      },
    },
  ];
}

function bookStepProbeSteps(screenId: string): ProbeStep[] {
  return [
    {
      id: `${screenId}-host`,
      selector: `[data-studio-react-screen="${screenId}"]`,
      action: "assert",
      assert: () =>
        document.querySelector(`[data-studio-react-screen="${screenId}"]`) !=
          null || `missing React host for ${screenId}`,
    },
  ];
}

/**
 * Engine resolve order:
 * 1. Project registry (Boots `registerMcpPageProbes` — site-pilot/chat/history/details)
 * 2. Built-in PLP/PDP matrices (still colocated until extracted)
 * 3. Book-step host stubs
 *
 * Do **not** add new screen if/else + Boots imports here — register instead.
 */
function stepsForScreen(screenId: string): ProbeStep[] | null {
  const registered = resolveMcpPageProbeSteps(screenId);
  if (registered) return registered;

  if (screenId === "plp") return plpProbeSteps();
  if (screenId === "pdp") return pdpProbeSteps();
  if (
    screenId === "book-step-1" ||
    screenId === "book-step-2" ||
    screenId === "book-step-3"
  ) {
    return bookStepProbeSteps(screenId);
  }
  return null;
}

async function waitForAssert(
  assert: () => boolean | string,
  waitMs: number
): Promise<boolean | string> {
  const budget = compressProbeDelayMs(waitMs, "wait");
  const deadline = Date.now() + budget;
  let last: boolean | string = false;
  while (Date.now() < deadline) {
    last = assert();
    if (last === true) return true;
    // delay() also Vitest-compresses the 120ms poll tick (→ 1ms).
    await delay(120);
  }
  // Final tick — covers budget=0 under Vitest compress.
  if (last !== true) last = assert();
  return last;
}

async function runProbeStep(step: ProbeStep): Promise<McpPageProbeStepResult> {
  const overlayFail = requireOverlayVisible(step.id);
  if (overlayFail) return overlayFail;

  if (step.action === "assert") {
    const runAssert = () => {
      const el = document.querySelector<HTMLElement>(step.selector);
      if (!el) {
        if (step.softSkipIfMissing) {
          return true;
        }
        return `selector miss: ${step.selector}`;
      }
      if (step.assert) return step.assert();
      return true;
    };
    const elMissing =
      document.querySelector<HTMLElement>(step.selector) == null;
    if (elMissing && step.softSkipIfMissing) {
      const detail =
        step.softSkipDetail ?? `soft-skip: selector missing (${step.selector})`;
      logStep(step.id, true, detail);
      return { id: step.id, pass: true, detail };
    }
    const out = step.waitMs
      ? await waitForAssert(runAssert, step.waitMs)
      : runAssert();
    if (out === true) {
      logStep(step.id, true);
      return { id: step.id, pass: true };
    }
    const detail = typeof out === "string" ? out : "assert failed";
    logStep(step.id, false, detail);
    return { id: step.id, pass: false, detail };
  }

  const el = document.querySelector<HTMLElement>(step.selector);
  if (!el) {
    if (step.softSkipIfMissing) {
      const detail =
        step.softSkipDetail ?? `soft-skip: selector missing (${step.selector})`;
      logStep(step.id, true, detail);
      return { id: step.id, pass: true, detail };
    }
    const detail = `selector miss: ${step.selector}`;
    logStep(step.id, false, detail);
    return { id: step.id, pass: false, detail };
  }

  if (step.action === "reveal") {
    const scrollEl = getPrototypeScrollRoot(el);
    // Park at origin so a mid-list target is honestly below-fold first (camera SSoT).
    if (scrollEl && scrollEl.scrollTop > 8) {
      scrollCameraToOrigin(scrollEl, {
        instant: true,
        force: true,
        reason: "mcp-probe-reveal-prep",
      });
      await delay(80);
    }
    const beforeInView = isDemoTargetInPrototypeView(el);
    const { scrolled, inView } = await revealTargetForProbe(el);
    if (!inView) {
      const detail = "target still out of prototype view after scroll-into-view";
      logStep(step.id, false, detail);
      return { id: step.id, pass: false, detail };
    }
    if (!isAgentTestingOverlayDomVisible()) {
      const detail = "overlay vanished during reveal";
      logStep(step.id, false, detail);
      return { id: step.id, pass: false, detail };
    }
    const detail =
      scrolled || !beforeInView
        ? "scroll-into-view + overlay visible"
        : "already in view + overlay visible";
    logStep(step.id, true, detail);
    await postStepReveal(el);
    return { id: step.id, pass: true, detail };
  }

  if (step.action === "refuse-click") {
    if (!isBlockingModalOpen()) {
      const detail = "expected blocking overlay open before refuse-click";
      logStep(step.id, false, detail);
      return { id: step.id, pass: false, detail };
    }
    if (!isElementBlockedByModal(el)) {
      const detail = "target not under overlay — registry miss?";
      logStep(step.id, false, detail);
      return { id: step.id, pass: false, detail };
    }
    const clicked = await simulateDemoPointerClick(el, { scroll: true });
    if (clicked) {
      const detail = "FELONY: clicked through open overlay";
      logStep(step.id, false, detail);
      return { id: step.id, pass: false, detail };
    }
    logStep(step.id, true, "overlay eyes refused under-click");
    return { id: step.id, pass: true, detail: "overlay eyes refused under-click" };
  }

  if (step.action === "hover") {
    await waitForContentLoadSettled();
    await revealDemoTargetForAgent(el);
    let hoverAssert: boolean | string = true;
    const hovered = await simulateDemoPointerHover(el, step.settleMs ?? 400, {
      scroll: true,
      onHoverStart: () => {
        if (step.assert) hoverAssert = step.assert();
      },
    });
    if (!hovered) {
      const detail = "robo-cursor hover failed";
      logStep(step.id, false, detail);
      return { id: step.id, pass: false, detail };
    }
    if (hoverAssert !== true) {
      const detail =
        typeof hoverAssert === "string" ? hoverAssert : "hover assert failed";
      logStep(step.id, false, detail);
      return { id: step.id, pass: false, detail };
    }
    if (!isAgentTestingOverlayDomVisible()) {
      const detail = "overlay vanished after hover";
      logStep(step.id, false, detail);
      return { id: step.id, pass: false, detail };
    }
    logStep(step.id, true);
    await postStepReveal(el);
    return { id: step.id, pass: true };
  }

  // click (default)
  // A screen's own content-load interim (e.g. PLP listing reload) is
  // intentionally uncompressed wall-clock time — a click that starts before
  // it clears can land mid-reveal and silently lose its effect.
  await waitForContentLoadSettled();
  await revealDemoTargetForAgent(el);
  // Reveal/scroll can allow React loading transitions to replace the target.
  // Re-resolve from the registered selector so probes never click stale nodes.
  const liveEl = document.querySelector<HTMLElement>(step.selector);
  if (!liveEl) {
    const detail = "target disappeared after reveal";
    logStep(step.id, false, detail);
    return { id: step.id, pass: false, detail };
  }
  const clicked = await simulateDemoPointerClick(liveEl, { scroll: true });
  if (!clicked) {
    const detail = isElementBlockedByModal(liveEl)
      ? "robo-cursor refused — target under open overlay"
      : "robo-cursor click failed";
    logStep(step.id, false, detail);
    return { id: step.id, pass: false, detail };
  }

  await delay(step.settleMs ?? 280);
  if (step.assert) {
    const out = step.waitMs
      ? await waitForAssert(step.assert, step.waitMs)
      : step.assert();
    if (out !== true) {
      const detail = typeof out === "string" ? out : "post-click assert failed";
      logStep(step.id, false, detail);
      return { id: step.id, pass: false, detail };
    }
  }
  if (!isAgentTestingOverlayDomVisible()) {
    const detail = "overlay vanished after click";
    logStep(step.id, false, detail);
    return { id: step.id, pass: false, detail };
  }
  logStep(step.id, true);
  await postStepReveal(liveEl);
  return { id: step.id, pass: true };
}

/**
 * Run the visible page probe for the current (or given) React screen.
 * Always uses AGENT TESTING overlay + robo-cursor. Stays on page by default.
 *
 * Lifecycle: start overlay → pre-arm countdown (PO prepare) → steps →
 * sitrep PASS/FAIL → settle → hard-clear DOM (forceClear failsafe).
 * Default `reload: false` — never reload-loop the tab during agent testing.
 */
export async function runMcpPageProbe(
  options?: McpPageProbeOptions
): Promise<McpPageProbeResult> {
  const screenId = resolveScreenId(options);
  const steps = stepsForScreen(screenId);
  const checks: McpPageProbeStepResult[] = [];
  let probePass = false;
  probeRevealCount = 0;
  const settleMs =
    typeof options?.settleMs === "number" && Number.isFinite(options.settleMs)
      ? options.settleMs
      : DEFAULT_SETTLE_MS;
  const preArmMs =
    typeof options?.preArmMs === "number" && Number.isFinite(options.preArmMs)
      ? options.preArmMs
      : DEFAULT_PREARM_MS;

  const prior = getMcpTestSession();
  if (prior) {
    requestMcpTestAbort("superseded");
    endMcpTestSession(prior.id);
  }
  // A PO-owned Manual/Observe QA session already open must not be silently
  // hijacked into AGENT TESTING kind by this internal probe (2026-07-23
  // self-test kind-hijack bug class — same root cause as mcp-sanity: running
  // "Test current page" from a Manual/Observe QA popup force-stamped the
  // panel to AGENT + "agent mcp" chrome). Only cold-start fresh AGENT kind
  // when nothing owns the panel yet; otherwise nest into the owning session.
  const ownedByOtherSession = isAgentTestingOverlayActive();
  const sessionId = beginMcpTestSession(`page-probe-${screenId}`);
  enableCursorQaEyes();
  // Pre-arm FIRST — BR panel visible before any click so PO can prepare.
  // Single start (not touch+start) — avoids nest>1 so stop() always enters sitrep.
  if (ownedByOtherSession) {
    touchAgentTestingOverlay("AGENT TESTING — preparing…", { preserveLogger: true });
  } else {
    startAgentTestingOverlay("AGENT TESTING — preparing…");
  }
  const overlayArmed = ownedByOtherSession
    ? isAgentTestingOverlayDomVisible()
    : ensureAgentTestingOverlayDomArmed("AGENT TESTING — preparing…");

  try {
    if (!overlayArmed || !isAgentTestingOverlayDomVisible()) {
      const detail = "overlay failed to arm at probe start";
      logAgentTestingOverlay(`FAIL  overlay-arm — ${detail}`);
      checks.push({ id: "overlay-arm", pass: false, detail });
      probePass = logFinalSummary(checks);
      logControlPanel("qa:run", {
        source: "page-probe",
        screenId,
        pass: false,
      });
      return {
        pass: false,
        screenId,
        checks,
        url: typeof window !== "undefined" ? window.location.href : undefined,
      };
    }
    logAgentTestingOverlay("PASS  overlay-arm — BR panel visible");
    checks.push({ id: "overlay-arm", pass: true, detail: "BR panel visible" });

    // Wishlist state persists in localStorage across runs/sessions — reset via
    // the real click path (not a store poke) so pdp-heart-hover always starts
    // from the same "Add to wishlist" rest state a fresh visitor would see.
    if (screenId === "pdp") {
      const wishlisted = document.querySelector<HTMLElement>(
        '.pdp[data-studio-react-screen="pdp"] button[aria-label="Remove from wishlist"]'
      );
      if (wishlisted) {
        await simulateDemoPointerClick(wishlisted, { scroll: true });
        await delay(300);
      }
    }

    await preArmAgentTestingOverlay({
      preArmMs,
      title: "AGENT TESTING — preparing…",
    });
    // Re-title without nest bump so finally stop() still enters sitrep once.
    // Owned PO session keeps its own title/kind — never kind-blind-stamp it.
    touchAgentTestingOverlay(`AGENT TESTING — ${screenId} probe`, {
      preserveLogger: true,
    });

    const rearmed = ownedByOtherSession
      ? isAgentTestingOverlayDomVisible()
      : ensureAgentTestingOverlayDomArmed(`AGENT TESTING — ${screenId} probe`);
    if (!rearmed) {
      const detail = "overlay vanished during pre-arm";
      logAgentTestingOverlay(`FAIL  overlay-arm — ${detail}`);
      checks.push({ id: "overlay-prearm", pass: false, detail });
      probePass = logFinalSummary(checks);
      logControlPanel("qa:run", {
        source: "page-probe",
        screenId,
        pass: false,
      });
      return {
        pass: false,
        screenId,
        checks,
        url: typeof window !== "undefined" ? window.location.href : undefined,
      };
    }
    logAgentTestingOverlay(`probe: ${screenId}`);

    if (!steps) {
      const detail = `no probe recipe for screen "${screenId}"`;
      logStep("probe-recipe", false, detail);
      checks.push({ id: "probe-recipe", pass: false, detail });
      probePass = logFinalSummary(checks);
      logControlPanel("qa:run", {
        source: "page-probe",
        screenId,
        pass: false,
      });
      return {
        pass: false,
        screenId,
        checks,
        url: typeof window !== "undefined" ? window.location.href : undefined,
      };
    }

    setAgentTestingTimeline([
      "overlay-arm",
      ...steps.map((s) => s.id),
      "url-screen",
    ]);
    markAgentTestingTimeline("overlay-arm", "ok");

    for (const step of steps) {
      const result = await runProbeStep(step);
      checks.push(result);
      // Hard stop if overlay disappeared mid-run.
      if (
        !result.pass &&
        typeof result.detail === "string" &&
        /overlay/i.test(result.detail)
      ) {
        break;
      }
      // R15 universal gate — a live Alarm/diagnostic firing mid-probe (e.g. a
      // real scroll-camera anomaly) means the page genuinely misbehaved; the
      // probe must not report PASS while an unconsumed PO signal is sitting
      // open (2026-07-23 "why title says PASS" bug — every other smoke in
      // studioMcpHelpers.ts/playJourneySmoke.ts already polls this shared
      // gate each step; this probe never did, so real regressions during a
      // page-probe run were silently swallowed into a green RESULT).
      const po = pollSmokePoSignal({
        context: `page-probe:${screenId}:${step.id}`,
      });
      if (po.hit && po.abort) {
        checks.push({
          id: "po-signal",
          pass: false,
          detail: `${po.reason} — ${po.signal.note ?? po.signal.code}`,
        });
        break;
      }
    }

    const urlScreen = parseStudioUrl().screenId;
    const urlOk = urlScreen === screenId;
    checks.push({
      id: "url-screen",
      pass: urlOk,
      detail: urlOk
        ? undefined
        : `expected screen=${screenId}, got ${urlScreen ?? "?"}`,
    });
    logStep(
      "url-screen",
      urlOk,
      urlOk ? `screen=${screenId}` : `expected ${screenId}, got ${urlScreen ?? "?"}`
    );

    probePass = logFinalSummary(checks);
    logControlPanel("qa:run", {
      source: "page-probe",
      screenId,
      pass: probePass,
    });
    return {
      pass: probePass,
      screenId,
      checks,
      url: typeof window !== "undefined" ? window.location.href : undefined,
    };
  } finally {
    // Teardown sequence (HARD — sticky modal after probe is a felony):
    // 1) stop → sitrep (enterSettle already resets URL + closes popups)
    // 2) resetStudioAfterAgentTest again — strip `&modal=` + closeAllPopups event
    // 3) ensureClear → forceClear if overlay DOM still present after settle
    // Nested into a PO-owned session we did not start — never settle/Finale
    // it just because this probe finished; the outer suite runner (or the
    // PO) owns that session's lifecycle (2026-07-23 kind-hijack bug class).
    if (!ownedByOtherSession) {
      try {
        stopAgentTestingOverlay({
          // Default false — agent testing must not reload-loop Chrome.
          reload: options?.reload === true,
          resetToHub: options?.resetToHub === true,
          settleMs,
          result: probePass ? "pass" : "fail",
        });
      } catch {
        forceClearAgentTestingOverlay();
      }
      scheduleAgentTestingOverlayEnsureClear(settleMs + 1000);
    }
    try {
      resetStudioAfterAgentTest({
        resetToHub: options?.resetToHub === true,
      });
    } catch {
      /* never leave modal sticky because reset threw */
    }
    disableCursorQaEyes();
    endMcpTestSession(sessionId);
  }
}
