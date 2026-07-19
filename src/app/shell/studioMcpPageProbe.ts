/**
 * Visible MCP page probe — drives the CJM/AIR robo-cursor to click targets
 * and logs each step as PASS / FAIL on the AGENT TESTING overlay.
 *
 *   await window.__studioRunMcpPageProbe?.()
 *   await window.__studioRunMcpPageProbe?.({ screenId: "plp" })
 */

import { simulateDemoPointerClick } from "@/app/scenario/demoCursor";
import {
  logAgentTestingOverlay,
  startAgentTestingOverlay,
  stopAgentTestingOverlay,
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
   */
  action?: "click" | "assert" | "refuse-click";
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
      settleMs: 900,
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
  logStep(step.id, true);
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
  startAgentTestingOverlay(`AGENT TESTING — ${screenId} probe`);
  logAgentTestingOverlay(`probe: ${screenId}`);

  try {
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
      checks.push(await runProbeStep(step));
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
