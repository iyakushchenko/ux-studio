/** Dev-only helpers for Chrome DevTools MCP / agent live testing. */

import type { ProtoOrchestraModeId } from "@/app/orchestra/types";
import { logControlPanel } from "@/app/shell/protoControlPanelLog";

export type ProtoStudioMcpState = {
  diagnosticOpen: boolean;
  journeyMode: boolean;
  scrollLock: boolean;
  orchestraMode: ProtoOrchestraModeId | null;
  label: string | null;
  counter: string | null;
  beatId: string | null;
  availStep: string | null;
  logLen: number;
};

export type ProtoRetreatSmokeCheck = {
  id: string;
  pass: boolean;
  detail?: string;
  state?: ProtoStudioMcpState;
};

export type ProtoRetreatSmokeResult = {
  pass: boolean;
  checks: ProtoRetreatSmokeCheck[];
};

export type ProtoSmokeRetreatCheck = {
  id: string;
  pass: boolean;
  detail?: string;
};

export type ProtoSmokeRetreatResult = {
  pass: boolean;
  checks: ProtoSmokeRetreatCheck[];
};

export type ProtoTransportAction =
  | "play"
  | "step-back"
  | "step-forward"
  | "jump-to-start"
  | "jump-to-end";

export type ProtoHomePlaySmokeResult = {
  pass: boolean;
  reason?: string;
  state?: ProtoStudioMcpState;
};

declare global {
  interface Window {
    /** Dismiss playback diagnostic overlay if open. Returns whether one was open. */
    __protoDismissPlaybackDiagnostic?: () => boolean;
    /** Snapshot for MCP scripts — no paste needed. */
    __protoStudioState?: () => ProtoStudioMcpState;
    /** Dismiss diagnostic then return clean state. */
    __protoEnsureCleanStudio?: () => ProtoStudioMcpState;
    /** Programmatically switch Agentic / Traditional CJM path. */
    __protoSetOrchestraMode?: (modeId: ProtoOrchestraModeId) => boolean;
    /** Lightweight retreat baseline checks for MCP smoke runs. */
    __protoSmokeRetreatChecks?: () => ProtoSmokeRetreatResult;
    /** Enable/disable CJM journey mode (same as studio switch). */
    __protoSetJourneyMode?: (enabled: boolean) => boolean;
    /** Fire studio transport — play, step-forward, etc. */
    __protoTriggerTransport?: (action: ProtoTransportAction) => boolean;
    /** Agentic home Play → chat handoff smoke (async, dev-only). */
    __protoRunHomePlaySmoke?: (options?: {
      timeoutMs?: number;
    }) => Promise<ProtoHomePlaySmokeResult>;
    /** Jump-to-end then step-back — chat counter + avail June 25 baselines. */
    __protoRunRetreatSmoke?: (options?: {
      timeoutMs?: number;
    }) => Promise<ProtoRetreatSmokeResult>;
  }
}

export function parseStudioStepCounter(counter: string | null): {
  visible: number;
  total: number;
} {
  const match = counter?.match(/(\d+)\s*\/\s*(\d+)/);
  return {
    visible: match ? Number(match[1]) : 0,
    total: match ? Number(match[2]) : 0,
  };
}

export function isAvailRetreatJune25Selected(): boolean {
  if (typeof document === "undefined") return false;
  const card = document.querySelector<HTMLElement>(".proto-avail-card");
  if (!card) return false;
  const cells = Array.from(
    card.querySelectorAll<HTMLElement>(
      ".proto-avail-cal-cell:not(.proto-avail-cal-cell--time):not(.proto-avail-cal-cell--disabled)"
    )
  );
  const june25 = cells.find((el) => el.textContent?.trim() === "25");
  return june25?.classList.contains("proto-avail-cal-cell--selected") ?? false;
}

const ORCHESTRA_MODE_IDS: ProtoOrchestraModeId[] = [
  "agentic-cjm",
  "traditional-cjm",
];

function journeyModeSwitch(): HTMLElement | null {
  return document.querySelector<HTMLElement>(
    '[role="switch"][aria-label="Journey mode"]'
  );
}

function runSmokeRetreatChecks(): ProtoSmokeRetreatResult {
  const checks: ProtoSmokeRetreatCheck[] = [];

  const journeySwitch = journeyModeSwitch();
  checks.push({
    id: "journey-switch-present",
    pass: journeySwitch != null,
    detail: journeySwitch ? undefined : "Missing role=switch Journey mode control",
  });

  const duplicateJourneyLabels = Array.from(
    document.querySelectorAll<HTMLElement>('[aria-label="Journey mode"]')
  ).filter((el) => el.getAttribute("role") !== "switch");
  checks.push({
    id: "orchestra-mode-label-unique",
    pass: duplicateJourneyLabels.length === 0,
    detail:
      duplicateJourneyLabels.length === 0
        ? undefined
        : `Found ${duplicateJourneyLabels.length} non-switch controls labeled Journey mode`,
  });

  let stateReadable = false;
  try {
    stateReadable = typeof window.__protoStudioState === "function";
  } catch {
    stateReadable = false;
  }
  checks.push({
    id: "mcp-state-readable",
    pass: stateReadable,
  });

  checks.push({
    id: "set-orchestra-mode-helper",
    pass: typeof window.__protoSetOrchestraMode === "function",
  });

  return {
    pass: checks.every((check) => check.pass),
    checks,
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function chatHandoffReached(state: ProtoStudioMcpState): boolean {
  if (state.label?.toLowerCase().includes("chat")) return true;
  return parseStudioStepCounter(state.counter).visible >= 3;
}

function isOnAgenticChatBeat(state: ProtoStudioMcpState): boolean {
  return (
    state.beatId === "agentic-chat" ||
    state.label?.toLowerCase().includes("chat experience") === true
  );
}

function chatRetreatCounterPass(state: ProtoStudioMcpState): boolean {
  const { visible } = parseStudioStepCounter(state.counter);
  return visible >= 10 && visible !== 2;
}

export function registerProtoStudioMcpHelpers(options: {
  dismissDiagnostic: () => void;
  isDiagnosticOpen: () => boolean;
  getState: () => Omit<
    ProtoStudioMcpState,
    "diagnosticOpen" | "logLen" | "orchestraMode"
  >;
  getOrchestraModeId?: () => ProtoOrchestraModeId;
  setOrchestraMode?: (modeId: ProtoOrchestraModeId) => void;
  setJourneyMode?: (enabled: boolean) => void;
  triggerTransport?: (action: ProtoTransportAction) => void;
}): () => void {
  if (typeof window === "undefined") return () => {};

  window.__protoDismissPlaybackDiagnostic = () => {
    if (!options.isDiagnosticOpen()) return false;
    logControlPanel("diagnostic:dismiss", { source: "mcp-helper" });
    options.dismissDiagnostic();
    return true;
  };

  window.__protoStudioState = () => {
    const base = options.getState();
    return {
      ...base,
      orchestraMode: options.getOrchestraModeId?.() ?? null,
      diagnosticOpen: options.isDiagnosticOpen(),
      logLen: window.__protoControlPanelLog?.length ?? 0,
    };
  };

  window.__protoEnsureCleanStudio = () => {
    window.__protoDismissPlaybackDiagnostic?.();
    return window.__protoStudioState!();
  };

  window.__protoSetOrchestraMode = (modeId) => {
    if (!ORCHESTRA_MODE_IDS.includes(modeId)) return false;
    if (!options.setOrchestraMode) return false;
    logControlPanel("studio:orchestra-mode", { source: "mcp-helper", to: modeId });
    options.setOrchestraMode(modeId);
    return true;
  };

  window.__protoSmokeRetreatChecks = runSmokeRetreatChecks;

  window.__protoSetJourneyMode = (enabled) => {
    if (!options.setJourneyMode) return false;
    logControlPanel("studio:journey-mode", {
      source: "mcp-helper",
      enabled,
    });
    options.setJourneyMode(enabled);
    return true;
  };

  window.__protoTriggerTransport = (action) => {
    if (!options.triggerTransport) return false;
    logControlPanel(`transport:${action}`, { source: "mcp-helper" });
    options.triggerTransport(action);
    return true;
  };

  window.__protoRunRetreatSmoke = async (smokeOptions) => {
    const timeoutMs = smokeOptions?.timeoutMs ?? 90_000;
    const checks: ProtoRetreatSmokeCheck[] = [];
    const deadline = Date.now() + timeoutMs;

    const fail = (id: string, detail: string, state?: ProtoStudioMcpState) => {
      checks.push({ id, pass: false, detail, state });
      return { pass: false, checks };
    };

    const setupAgenticJourney = async () => {
      window.__protoEnsureCleanStudio?.();
      window.__protoSetOrchestraMode?.("agentic-cjm");
      await delay(120);
      if (!window.__protoSetJourneyMode?.(true)) {
        return false;
      }
      await delay(800);
      return true;
    };

    if (!(await setupAgenticJourney())) {
      return fail("journey-mode", "set-journey-mode-unavailable");
    }

    if (!window.__protoTriggerTransport?.("jump-to-end")) {
      return fail("jump-to-end", "trigger-jump-to-end-unavailable");
    }
    await delay(2800);

    let chatState: ProtoStudioMcpState | undefined;
    for (let attempt = 0; attempt < 20 && Date.now() < deadline; attempt++) {
      const state = window.__protoStudioState?.();
      if (!state) {
        await delay(250);
        continue;
      }
      if (state.diagnosticOpen) {
        return fail("chat-retreat", "playback-diagnostic during chat search", state);
      }
      if (isOnAgenticChatBeat(state)) {
        chatState = state;
        if (chatRetreatCounterPass(state)) {
          break;
        }
        await delay(500);
        continue;
      }
      window.__protoTriggerTransport?.("step-back");
      await delay(750);
    }

    if (!chatState) {
      chatState = window.__protoStudioState?.();
    }
    const chatPass = chatState ? chatRetreatCounterPass(chatState) : false;
    checks.push({
      id: "chat-retreat-counter",
      pass: chatPass,
      detail: chatPass
        ? undefined
        : `expected counter >= 10 and not 2/25, got ${chatState?.counter ?? "unknown"}`,
      state: chatState,
    });

    // Avail baseline — fresh jump-to-end so we do not step back past avail into home.
    if (!window.__protoTriggerTransport?.("jump-to-end")) {
      return fail("avail-jump-to-end", "trigger-jump-to-end-unavailable");
    }
    await delay(2800);

    let availState: ProtoStudioMcpState | undefined;
    let june25 = false;
    for (let attempt = 0; attempt < 16 && Date.now() < deadline; attempt++) {
      const state = window.__protoStudioState?.();
      if (!state) {
        await delay(250);
        continue;
      }
      if (state.diagnosticOpen) {
        return fail("avail-retreat", "playback-diagnostic during avail search", state);
      }

      june25 = isAvailRetreatJune25Selected();
      if (june25) {
        availState = state;
        break;
      }

      if (state.beatId === "avail-continue" && state.availStep === "date") {
        availState = state;
        for (let poll = 0; poll < 8; poll++) {
          june25 = isAvailRetreatJune25Selected();
          if (june25) break;
          await delay(250);
        }
        break;
      }

      if (state.beatId === "agentic-chat" || state.beatId === "agentic-home") {
        availState = state;
        break;
      }

      window.__protoTriggerTransport?.("step-back");
      await delay(900);
    }

    if (!availState) {
      availState = window.__protoStudioState?.();
    }
    june25 = isAvailRetreatJune25Selected();
    checks.push({
      id: "avail-retreat-june-25",
      pass: june25,
      detail: june25
        ? undefined
        : `June 25 not selected (beat=${availState?.beatId ?? "?"}, step=${availState?.availStep ?? "?"})`,
      state: availState,
    });

    checks.push({
      id: "no-diagnostic",
      pass: !window.__protoStudioState?.().diagnosticOpen,
      state: window.__protoStudioState?.(),
    });

    return {
      pass: checks.every((check) => check.pass),
      checks,
    };
  };

  window.__protoRunHomePlaySmoke = async (smokeOptions) => {
    const timeoutMs = smokeOptions?.timeoutMs ?? 25000;
    window.__protoEnsureCleanStudio?.();
    window.__protoSetOrchestraMode?.("agentic-cjm");
    await delay(120);
    if (!window.__protoSetJourneyMode?.(true)) {
      return { pass: false, reason: "set-journey-mode-unavailable" };
    }
    await delay(480);
    if (!window.__protoTriggerTransport?.("play")) {
      return { pass: false, reason: "trigger-play-unavailable" };
    }

    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const state = window.__protoStudioState?.();
      if (!state) {
        await delay(200);
        continue;
      }
      if (state.diagnosticOpen) {
        return { pass: false, reason: "playback-diagnostic", state };
      }
      if (chatHandoffReached(state)) {
        return { pass: true, state };
      }
      await delay(200);
    }

    return {
      pass: false,
      reason: "timeout",
      state: window.__protoStudioState?.(),
    };
  };

  return () => {
    delete window.__protoDismissPlaybackDiagnostic;
    delete window.__protoStudioState;
    delete window.__protoEnsureCleanStudio;
    delete window.__protoSetOrchestraMode;
    delete window.__protoSmokeRetreatChecks;
    delete window.__protoSetJourneyMode;
    delete window.__protoTriggerTransport;
    delete window.__protoRunHomePlaySmoke;
    delete window.__protoRunRetreatSmoke;
  };
}
