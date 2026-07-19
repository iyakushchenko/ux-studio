/**
 * Visible MCP page probe — drives the CJM/AIR robo-cursor to click targets
 * and logs each step as PASS / FAIL on the AGENT TESTING overlay.
 *
 *   await window.__studioRunMcpPageProbe?.()
 *   await window.__studioRunMcpPageProbe?.({ screenId: "plp" })
 */

import { simulateDemoPointerClick } from "@/app/scenario/demoCursor";
import {
  getPrototypeScrollRoot,
  isDemoTargetInPrototypeView,
  revealDemoTargetForAgent,
} from "@/app/scenario/playbackScroll";
import {
  ensureAgentTestingOverlayDomArmed,
  isAgentTestingOverlayDomVisible,
  logAgentTestingOverlay,
  startAgentTestingOverlay,
  stopAgentTestingOverlay,
  touchAgentTestingOverlay,
} from "@/app/shell/agentTestingOverlay";
import { logControlPanel } from "@/app/shell/controlPanelLog";
import {
  beginMcpTestSession,
  endMcpTestSession,
  getMcpTestSession,
  requestMcpTestAbort,
} from "@/app/shell/mcpTestGuard";
import {
  disableCursorQaEyes,
  enableCursorQaEyes,
} from "@/app/shell/playbackCursorDiagnostic";
import {
  isBlockingModalOpen,
  isElementBlockedByModal,
} from "@/app/shell/studioModalGuard";
import { parseStudioUrl } from "@/app/shell/studioUrl";

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
  /** Sitrep then reload. Default true for MCP helpers. */
  reload?: boolean;
};

type ProbeStep = {
  id: string;
  /** CSS selector relative to document. */
  selector: string;
  /**
   * click — robo-click (refuses if under overlay).
   * assert — presence / custom assert.
   * refuse-click — PASS only when overlay is open AND click is refused.
   * reveal — scroll prototype root to target (no click); proves below-fold visibility.
   */
  action?: "click" | "assert" | "refuse-click" | "reveal";
  /** Optional assert after click / for assert-only steps. */
  assert?: () => boolean | string;
  /** Extra wait after click (ms) for loaders / reveal. */
  settleMs?: number;
  /** Poll assert until true or timeout (assert steps). */
  waitMs?: number;
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function logStep(id: string, pass: boolean, detail?: string): void {
  const tag = pass ? "PASS" : "FAIL";
  const line = detail ? `${tag}  ${id} — ${detail}` : `${tag}  ${id}`;
  logAgentTestingOverlay(line);
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
  const scrollEl = getPrototypeScrollRoot(el);
  if (scrollEl && scrollEl.scrollTop > 0) {
    // Optional: leave as-is; reveal centers the target from current offset.
  }
  return revealDemoTargetForAgent(el);
}

/** After a step, keep the action target clear of the BR sitrep panel. */
async function postStepReveal(el: HTMLElement | null): Promise<void> {
  if (!el?.isConnected) return;
  if (isDemoTargetInPrototypeView(el)) return;
  await revealDemoTargetForAgent(el, { instant: true });
}

function resolveScreenId(options?: McpPageProbeOptions): string {
  if (options?.screenId?.trim()) return options.screenId.trim().toLowerCase();
  return parseStudioUrl().screenId ?? "hub";
}

function plpProbeSteps(): ProbeStep[] {
  // Prefer button/React-owned nodes — Make leftovers can still match data-name.
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
        '[data-studio-react-screen="plp"] button[data-studio-plp-reset-filters="true"]',
      action: "assert",
      waitMs: 4000,
      assert: () =>
        document.querySelector(
          '[data-studio-react-screen="plp"] button[data-studio-plp-reset-filters="true"]'
        ) != null || "reset filters missing after filter click",
    },
    {
      id: "plp-reset-filters",
      selector:
        '[data-studio-react-screen="plp"] button[data-studio-plp-reset-filters="true"]',
      action: "click",
      // Catch mid-load (~450ms) — stale jab count must already be gone.
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
        if (count.getAttribute("data-studio-plp-results-loading") !== "true") {
          return "count must stamp data-studio-plp-results-loading during refresh";
        }
        if ((count.getAttribute("data-studio-plp-results") ?? "") !== "") {
          return "count data-studio-plp-results must be empty while loading";
        }
        const text = (count.textContent ?? "").replace(/\s+/g, " ").trim();
        if (text.length > 0) {
          return `stale count visible during load: "${text}"`;
        }
        if (/\d+\s+jabs?\s+available/i.test(text)) {
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
      assert: () =>
        isBlockingModalOpen() ||
        "Quick View overlay did not open (registry / scrim miss)",
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

function stepsForScreen(screenId: string): ProbeStep[] | null {
  if (screenId === "plp") return plpProbeSteps();
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
  const deadline = Date.now() + waitMs;
  let last: boolean | string = false;
  while (Date.now() < deadline) {
    last = assert();
    if (last === true) return true;
    await delay(120);
  }
  return last;
}

async function runProbeStep(step: ProbeStep): Promise<McpPageProbeStepResult> {
  const overlayFail = requireOverlayVisible(step.id);
  if (overlayFail) return overlayFail;

  if (step.action === "assert") {
    const runAssert = () => {
      const el = document.querySelector<HTMLElement>(step.selector);
      if (!el) return `selector miss: ${step.selector}`;
      if (step.assert) return step.assert();
      return true;
    };
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
    const detail = `selector miss: ${step.selector}`;
    logStep(step.id, false, detail);
    return { id: step.id, pass: false, detail };
  }

  if (step.action === "reveal") {
    const scrollEl = getPrototypeScrollRoot(el);
    // Park at top so a mid-list/last-tile target is honestly below-fold first.
    if (scrollEl && scrollEl.scrollTop > 8) {
      scrollEl.scrollTop = 0;
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

  // click (default)
  await revealDemoTargetForAgent(el);
  const clicked = await simulateDemoPointerClick(el, { scroll: true });
  if (!clicked) {
    const detail = isElementBlockedByModal(el)
      ? "robo-cursor refused — target under open overlay"
      : "robo-cursor click failed";
    logStep(step.id, false, detail);
    return { id: step.id, pass: false, detail };
  }

  await delay(step.settleMs ?? 280);
  if (step.assert) {
    const out = step.assert();
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
  await postStepReveal(el);
  return { id: step.id, pass: true };
}

/**
 * Run the visible page probe for the current (or given) React screen.
 * Always uses AGENT TESTING overlay + robo-cursor. Stays on page by default.
 */
export async function runMcpPageProbe(
  options?: McpPageProbeOptions
): Promise<McpPageProbeResult> {
  const screenId = resolveScreenId(options);
  const steps = stepsForScreen(screenId);
  const checks: McpPageProbeStepResult[] = [];

  const prior = getMcpTestSession();
  if (prior) {
    requestMcpTestAbort("superseded");
    endMcpTestSession(prior.id);
  }
  const sessionId = beginMcpTestSession(`page-probe-${screenId}`);
  enableCursorQaEyes();
  // Single start (not touch+start) — avoids nest>1 so stop() always enters sitrep.
  // ensure* repairs settle/orphan DOM races without bumping nest again.
  startAgentTestingOverlay(`AGENT TESTING — ${screenId} probe`);
  const overlayArmed = ensureAgentTestingOverlayDomArmed(
    `AGENT TESTING — ${screenId} probe`
  );

  try {
    if (!overlayArmed || !isAgentTestingOverlayDomVisible()) {
      const detail = "overlay failed to arm at probe start";
      logAgentTestingOverlay(`FAIL  overlay-arm — ${detail}`);
      checks.push({ id: "overlay-arm", pass: false, detail });
      logAgentTestingOverlay("FINAL  FAIL");
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
    logAgentTestingOverlay(`probe: ${screenId}`);

    if (!steps) {
      const detail = `no probe recipe for screen "${screenId}"`;
      logStep("probe-recipe", false, detail);
      checks.push({ id: "probe-recipe", pass: false, detail });
      const pass = false;
      logAgentTestingOverlay(`FINAL  ${pass ? "PASS" : "FAIL"}`);
      logControlPanel("qa:run", { source: "page-probe", screenId, pass });
      return {
        pass,
        screenId,
        checks,
        url: typeof window !== "undefined" ? window.location.href : undefined,
      };
    }

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

    const pass = checks.every((c) => c.pass);
    logAgentTestingOverlay(`FINAL  ${pass ? "PASS" : "FAIL"}`);
    logControlPanel("qa:run", { source: "page-probe", screenId, pass });
    return {
      pass,
      screenId,
      checks,
      url: typeof window !== "undefined" ? window.location.href : undefined,
    };
  } finally {
    stopAgentTestingOverlay({
      reload: options?.reload !== false,
      resetToHub: options?.resetToHub === true,
    });
    disableCursorQaEyes();
    endMcpTestSession(sessionId);
  }
}
