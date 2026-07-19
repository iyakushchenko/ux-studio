/** Dev-only helpers for Chrome DevTools MCP / agent testing.
 *
 * NORMAL MCP TEST (one call, safe, no transport):
 *   await window.__protoRunMcpSanityCheck?.()
 *
 * STOP everything:
 *   window.__protoAbortAll?.()
 *
 * Console filter: `[ProtoControlPanel]` (diagnostics = console.warn)
 * Eyes: `window.__protoMcpEyes()`
 */

import type { ProtoOrchestraModeId } from "@/app/orchestra/types";
import { runTraditionalControlRoomRobotQa } from "@/app/shell/protoControlRoomQaRunner";
import { logControlPanel } from "@/app/shell/protoControlPanelLog";
import {
  disableCursorQaEyes,
  enableCursorQaEyes,
  formatPlaybackCursorEventSummary,
  getCursorDiagnosticState,
} from "@/app/shell/protoPlaybackCursorDiagnostic";
import { getRecentDiagnosticFlashes } from "@/app/shell/protoPlaybackDiagnosticFlash";
import {
  beginMcpTestSession,
  endMcpTestSession,
  getMcpTestSession,
  isMcpTestAborted,
  requestMcpTestAbort,
  throwIfMcpTestAborted,
} from "@/app/shell/protoMcpTestGuard";
import { isRecordingActive } from "@/app/recording/protoRecordingSession";
import {
  installAgentTestingOverlayApi,
  logAgentTestingOverlay,
  startAgentTestingOverlay,
  stopAgentTestingOverlay,
  uninstallAgentTestingOverlayApi,
} from "@/app/shell/protoAgentTestingOverlay";

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
  isOnAir?: boolean;
  isPlaying?: boolean;
  canStepBack?: boolean;
  canStepForward?: boolean;
  canPlay?: boolean;
  qaPhase?: string;
  qaRunning?: boolean;
  qaPass?: number;
  qaFail?: number;
  lastAction?: string;
  lastActionSeq?: number;
  lastCursor?: string;
  lastCursorAction?: string;
  lastCursorTarget?: string;
  cursorVisible?: boolean;
  cursorParked?: boolean;
  cursorFaded?: boolean;
  cursorEventCount?: number;
  cursorUnexpectedOnDwell?: number;
  recentCursorEvents?: Array<{
    action: string;
    beatId?: string;
    scriptId?: string;
    summary?: string;
    unexpectedOnDwell?: boolean;
  }>;
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

export type ProtoStepForwardSmokeStep = {
  index: number;
  before: ProtoStudioMcpState;
  after: ProtoStudioMcpState;
  ms: number;
};

export type ProtoStepForwardSmokeResult = {
  pass: boolean;
  reason?: string;
  steps: ProtoStepForwardSmokeStep[];
  finalState?: ProtoStudioMcpState;
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
    /** Manual step-forward through the full agentic CJM playlist (dev-only). */
    __protoRunAgenticStepForwardSmoke?: (options?: {
      timeoutMs?: number;
      maxSteps?: number;
    }) => Promise<ProtoStepForwardSmokeResult>;
    /** Manual step-forward through the full traditional CJM playlist (dev-only). */
    __protoRunTraditionalStepForwardSmoke?: (options?: {
      timeoutMs?: number;
      maxSteps?: number;
    }) => Promise<ProtoStepForwardSmokeResult>;
    /** Traditional CJM Play → journey end smoke (async, dev-only). */
    __protoRunTraditionalPlaySmoke?: (options?: {
      timeoutMs?: number;
    }) => Promise<ProtoHomePlaySmokeResult>;
    /** Jump-to-end then step-back — traditional book / confirmation / browse baselines. */
    __protoRunTraditionalRetreatSmoke?: (options?: {
      timeoutMs?: number;
    }) => Promise<ProtoRetreatSmokeResult>;
    /** Full control-room robot QA — step fwd/back, play/pause, HUD telemetry (dev-only). */
    __protoRunTraditionalControlRoomRobotQa?: () => Promise<import("@/app/shell/protoControlRoomQaRunner").ControlRoomQaResult>;
    /** Cursor diagnostic ring buffer + DOM visibility snapshot (dev-only). */
    __protoCursorDiagnostics?: () => import("@/app/shell/protoPlaybackCursorDiagnostic").CursorDiagnosticState;
    /** Agent MCP eyes — state + cursor + qa log slices in one call. */
    __protoMcpEyes?: () => {
      state?: ProtoStudioMcpState;
      cursor?: import("@/app/shell/protoPlaybackCursorDiagnostic").CursorDiagnosticState;
      diagnosticFlashes?: import("@/app/shell/protoPlaybackDiagnosticFlash").DiagnosticFlashRecord[];
      diagnostics?: import("@/app/shell/protoControlPanelLog").ControlPanelLogEntry[];
      consoleFilter?: string;
      qaChecks: import("@/app/shell/protoControlPanelLog").ControlPanelLogEntry[];
      qaCursor: import("@/app/shell/protoControlPanelLog").ControlPanelLogEntry[];
      qaPhases: import("@/app/shell/protoControlPanelLog").ControlPanelLogEntry[];
    };
    /** Emergency stop — halts playback, dismisses diagnostic, ends MCP session. */
    __protoAbortAll?: () => ProtoStudioMcpState;
    /** Safe default MCP test — DOM checks only, no transport. */
    __protoRunMcpSanityCheck?: () => Promise<{
      pass: boolean;
      checks: ProtoSmokeRetreatCheck[];
      state?: ProtoStudioMcpState;
    }>;
    __protoDiagnosticFlashes?: () => import("@/app/shell/protoPlaybackDiagnosticFlash").DiagnosticFlashRecord[];
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
    '[role="switch"][aria-label="CJM"]'
  );
}

function recModeSwitch(): HTMLButtonElement | null {
  return document.querySelector<HTMLButtonElement>(
    '[role="switch"][aria-label="REC off"], [role="switch"][aria-label="REC on"]'
  );
}

function runSmokeRetreatChecks(): ProtoSmokeRetreatResult {
  const checks: ProtoSmokeRetreatCheck[] = [];

  const journeySwitch = journeyModeSwitch();
  checks.push({
    id: "journey-switch-present",
    pass: journeySwitch != null,
    detail: journeySwitch ? undefined : "Missing role=switch CJM control",
  });

  const recSwitch = recModeSwitch();
  checks.push({
    id: "rec-switch-present",
    pass: recSwitch != null,
    detail: recSwitch ? undefined : "Missing role=switch REC control",
  });

  const duplicateJourneyLabels = Array.from(
    document.querySelectorAll<HTMLElement>('[aria-label="CJM"]')
  ).filter((el) => el.getAttribute("role") !== "switch");
  checks.push({
    id: "orchestra-mode-label-unique",
    pass: duplicateJourneyLabels.length === 0,
    detail:
      duplicateJourneyLabels.length === 0
        ? undefined
        : `Found ${duplicateJourneyLabels.length} non-switch controls labeled CJM`,
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

async function withMcpTestSession<T>(
  label: string,
  run: () => Promise<T>
): Promise<T> {
  const prior = getMcpTestSession();
  if (prior) {
    requestMcpTestAbort("superseded");
    endMcpTestSession(prior.id);
  }
  const id = beginMcpTestSession(label);
  enableCursorQaEyes();
  startAgentTestingOverlay(`AGENT TESTING — ${label}`);
  logAgentTestingOverlay(`session: ${label}`);
  try {
    return await run();
  } finally {
    stopAgentTestingOverlay();
    disableCursorQaEyes();
    endMcpTestSession(id);
  }
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

function stateFingerprint(state: ProtoStudioMcpState | undefined | null): string {
  if (!state) return "";
  return [state.counter, state.beatId, state.label, state.availStep].join("|");
}

function stepSettleMsForState(state: ProtoStudioMcpState | undefined): number {
  if (!state) return 4000;
  if (state.beatId === "agentic-home") return 50_000;
  if (state.beatId === "agentic-chat") return 12_000;
  if (state.beatId === "traditional-plp" || state.beatId === "traditional-pdp") {
    return 10_000;
  }
  if (state.label?.toLowerCase().includes("thinking")) return 12_000;
  if (state.beatId?.startsWith("book-step2")) return 22_000;
  if (state.beatId?.startsWith("avail-")) return 10_000;
  return 6000;
}

function traditionalJourneyEndReached(state: ProtoStudioMcpState): boolean {
  const { visible, total } = parseStudioStepCounter(state.counter);
  if (total > 0 && visible >= total) return true;
  return state.beatId === "appointment-details";
}

function cursorFieldsForStudioState(): Pick<
  ProtoStudioMcpState,
  | "lastCursor"
  | "lastCursorAction"
  | "lastCursorTarget"
  | "cursorVisible"
  | "cursorParked"
  | "cursorFaded"
  | "cursorEventCount"
  | "cursorUnexpectedOnDwell"
  | "recentCursorEvents"
> {
  const qa = window.__protoQaHud;
  const diag = getCursorDiagnosticState();
  return {
    lastCursor: qa?.lastCursor ?? diag.lastSummary,
    lastCursorAction: diag.lastCursorAction ?? qa?.cursorAction,
    lastCursorTarget: diag.lastCursorTarget ?? qa?.cursorTarget,
    cursorVisible: diag.cursorVisible,
    cursorParked: diag.cursorParked,
    cursorFaded: diag.cursorFaded,
    cursorEventCount: diag.cursorEventCount,
    cursorUnexpectedOnDwell: diag.unexpectedOnDwellCount,
    recentCursorEvents: diag.recentCursorEvents.map((event) => ({
      action: event.action,
      beatId: event.beatId,
      scriptId: event.scriptId,
      summary: formatPlaybackCursorEventSummary(event),
      unexpectedOnDwell: event.unexpectedOnDwell,
    })),
  };
}

async function dismissDiagnosticsUntilClear(maxMs = 4000): Promise<boolean> {
  const deadline = Date.now() + maxMs;
  while (Date.now() < deadline) {
    const state = window.__protoStudioState?.();
    if (!state?.diagnosticOpen) return true;
    window.__protoDismissPlaybackDiagnostic?.();
    await delay(120);
  }
  return !window.__protoStudioState?.()?.diagnosticOpen;
}

async function runStepForwardSmokeForMode(
  orchestraMode: ProtoOrchestraModeId,
  smokeOptions?: { timeoutMs?: number; maxSteps?: number }
): Promise<ProtoStepForwardSmokeResult> {
  const timeoutMs = smokeOptions?.timeoutMs ?? 600_000;
  const maxSteps =
    smokeOptions?.maxSteps ?? (orchestraMode === "traditional-cjm" ? 15 : 28);
  const steps: ProtoStepForwardSmokeStep[] = [];
  const deadline = Date.now() + timeoutMs;

  const fail = (
    reason: string,
    state?: ProtoStudioMcpState
  ): ProtoStepForwardSmokeResult => ({
    pass: false,
    reason,
    steps,
    finalState: state ?? window.__protoStudioState?.(),
  });

  window.__protoEnsureCleanStudio?.();
  throwIfMcpTestAborted();
  window.__protoSetOrchestraMode?.(orchestraMode);
  await delay(120);
  if (!window.__protoSetJourneyMode?.(true)) {
    return fail("set-journey-mode-unavailable");
  }
  await delay(800);
  if (!window.__protoTriggerTransport?.("jump-to-start")) {
    return fail("jump-to-start-unavailable");
  }
  await delay(1200);
  if (!(await dismissDiagnosticsUntilClear())) {
    return fail("diagnostic-after-setup", window.__protoStudioState?.());
  }

  let startState = window.__protoStudioState?.();
  if (!startState) {
    return fail("no-initial-state");
  }
  const { total } = parseStudioStepCounter(startState.counter);
  if (total <= 0) {
    return fail("invalid-step-total", startState);
  }

  for (let index = 0; index < maxSteps; index++) {
    throwIfMcpTestAborted();
    if (Date.now() > deadline) {
      return fail("timeout-before-step", window.__protoStudioState?.());
    }

    const before = window.__protoStudioState?.();
    if (!before) {
      return fail("missing-state-before-step");
    }
    if (before.diagnosticOpen) {
      return fail(`diagnostic-before-step-${index + 1}`, before);
    }

    const { visible, total: stepTotal } = parseStudioStepCounter(before.counter);
    if (stepTotal > 0 && visible >= stepTotal) {
      return { pass: true, steps, finalState: before };
    }

    const beforeFingerprint = stateFingerprint(before);
    if (!window.__protoTriggerTransport?.("step-forward")) {
      return fail(`step-forward-unavailable-${index + 1}`, before);
    }

    const stepStart = Date.now();
    const settleMs = Math.min(
      stepSettleMsForState(before),
      Math.max(1200, deadline - Date.now())
    );
    const outcome = await waitForTransportProgress(
      beforeFingerprint,
      settleMs
    );
    const after = outcome.state ?? window.__protoStudioState?.();

    if (!after) {
      return fail(`missing-state-after-step-${index + 1}`);
    }
    if (outcome.diagnostic || after.diagnosticOpen) {
      return fail(`diagnostic-on-step-${index + 1}`, after);
    }
    if (!outcome.progressed) {
      return fail(
        `transport-no-progress step ${index + 1} (${before.label ?? before.beatId ?? "?"})`,
        after
      );
    }

    const settleBudget = Math.max(0, deadline - Date.now());
    const settled = await waitForDirectorSettle(
      after,
      Math.min(stepSettleMsForState(after), settleBudget)
    );
    if (settled?.diagnosticOpen) {
      return fail(`diagnostic-on-step-${index + 1}`, settled);
    }
    const settledAfter = settled ?? after;

    steps.push({
      index: index + 1,
      before,
      after: settledAfter,
      ms: Date.now() - stepStart,
    });
  }

  return fail("max-steps-reached", window.__protoStudioState?.());
}

async function waitForTransportProgress(
  beforeFingerprint: string,
  deadlineMs: number
): Promise<{
  progressed: boolean;
  state?: ProtoStudioMcpState;
  diagnostic?: boolean;
}> {
  const deadline = Date.now() + deadlineMs;
  while (Date.now() < deadline) {
    const state = window.__protoStudioState?.();
    if (state?.diagnosticOpen) {
      return { progressed: false, diagnostic: true, state };
    }
    if (stateFingerprint(state) !== beforeFingerprint) {
      return { progressed: true, state };
    }
    await delay(200);
  }
  const state = window.__protoStudioState?.();
  return {
    progressed: stateFingerprint(state) !== beforeFingerprint,
    state,
  };
}

/** Let cursor director scripts finish before the next manual step. */
async function waitForDirectorSettle(
  state: ProtoStudioMcpState,
  maxMs: number
): Promise<ProtoStudioMcpState | undefined> {
  const needsSettle =
    state.beatId?.startsWith("book-step2") ||
    state.beatId?.startsWith("avail-") ||
    state.beatId === "agentic-home" ||
    state.beatId === "traditional-plp" ||
    state.beatId === "traditional-pdp";
  if (!needsSettle || maxMs <= 0) return window.__protoStudioState?.();

  const stableMs = state.beatId?.startsWith("book-step2") ? 4500 : 1800;
  const minSettleMs = state.beatId?.startsWith("book-step2") ? 3000 : 0;
  const progressAt = Date.now();
  const deadline = Date.now() + maxMs;
  let stableSince: number | null = null;
  let lastFingerprint = stateFingerprint(state);

  while (Date.now() < deadline && Date.now() - progressAt < minSettleMs) {
    const current = window.__protoStudioState?.();
    if (current?.diagnosticOpen) return current;
    await delay(250);
  }

  while (Date.now() < deadline) {
    const current = window.__protoStudioState?.();
    if (current?.diagnosticOpen) {
      return current;
    }
    const fingerprint = stateFingerprint(current);
    if (fingerprint !== lastFingerprint) {
      lastFingerprint = fingerprint;
      stableSince = null;
    } else if (stableSince == null) {
      stableSince = Date.now();
    } else if (Date.now() - stableSince >= stableMs) {
      return current;
    }
    await delay(250);
  }

  return window.__protoStudioState?.();
}

export function registerProtoStudioMcpHelpers(options: {
  dismissDiagnostic: () => void;
  isDiagnosticOpen: () => boolean;
  abortAll?: () => void;
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

  installAgentTestingOverlayApi();

  window.__protoDismissPlaybackDiagnostic = () => {
    if (!options.isDiagnosticOpen()) return false;
    options.dismissDiagnostic();
    return true;
  };

  window.__protoStudioState = () => {
    const base = options.getState();
    const log = window.__protoControlPanelLog ?? [];
    const last = log[log.length - 1];
    const qa = window.__protoQaHud;
    const cursor = cursorFieldsForStudioState();
    if (typeof document === "undefined") {
      return {
        ...base,
        orchestraMode: options.getOrchestraModeId?.() ?? null,
        diagnosticOpen: options.isDiagnosticOpen(),
        logLen: log.length,
        qaPhase: qa?.phase,
        qaRunning: qa?.running,
        qaPass: qa?.pass,
        qaFail: qa?.fail,
        lastAction: last?.action,
        lastActionSeq: last?.seq,
        ...cursor,
      };
    }
    const playBtn = document.querySelector('[aria-label="Play journey"]');
    const stepFwd = document.querySelector('[aria-label="Step forward"]');
    const stepBack = document.querySelector('[aria-label="Step back"]');
    return {
      ...base,
      orchestraMode: options.getOrchestraModeId?.() ?? null,
      diagnosticOpen: options.isDiagnosticOpen(),
      logLen: log.length,
      isOnAir: document.querySelector(".proto-nav-scenario--on-air") != null,
      isPlaying: playBtn?.getAttribute("aria-pressed") === "true",
      canStepForward: stepFwd ? !stepFwd.hasAttribute("disabled") : undefined,
      canStepBack: stepBack ? !stepBack.hasAttribute("disabled") : undefined,
      canPlay: playBtn ? !playBtn.hasAttribute("disabled") : undefined,
      qaPhase: qa?.phase,
      qaRunning: qa?.running,
      qaPass: qa?.pass,
      qaFail: qa?.fail,
      lastAction: last?.action,
      lastActionSeq: last?.seq,
      ...cursor,
    };
  };

  window.__protoCursorDiagnostics = () => getCursorDiagnosticState();

  window.__protoMcpEyes = () => {
    const log = window.dumpProtoControlPanelLog?.() ?? [];
    return {
      state: window.__protoStudioState?.(),
      cursor: window.__protoCursorDiagnostics?.(),
      diagnosticFlashes: getRecentDiagnosticFlashes(),
      diagnostics: log
        .filter(
          (entry) =>
            entry.action === "diagnostic:open" ||
            entry.action === "diagnostic:dismiss"
        )
        .slice(-24),
      consoleFilter: "[ProtoControlPanel]",
      qaChecks: log.filter((entry) => entry.action === "qa:check").slice(-24),
      qaCursor: log.filter((entry) => entry.action === "qa:cursor").slice(-40),
      qaPhases: log.filter((entry) => entry.action === "qa:phase").slice(-12),
    };
  };

  window.__protoDiagnosticFlashes = () => getRecentDiagnosticFlashes();

  window.__protoEnsureCleanStudio = () => {
    window.__protoDismissPlaybackDiagnostic?.();
    return window.__protoStudioState!();
  };

  window.__protoAbortAll = () => {
    const session = getMcpTestSession();
    if (session) {
      requestMcpTestAbort("abort-all");
      endMcpTestSession(session.id);
    }
    options.abortAll?.();
    options.dismissDiagnostic();
    disableCursorQaEyes();
    stopAgentTestingOverlay({ force: true });
    logControlPanel("qa:run", { source: "abort-all" });
    return window.__protoStudioState!();
  };

  /** Hard gate: CJM on ⇒ REC disabled + off (cannot silently regress). */
  async function runRecCjmXorSanityChecks(): Promise<ProtoSmokeRetreatResult> {
    const checks: ProtoSmokeRetreatCheck[] = [];
    const setJourney = window.__protoSetJourneyMode;
    if (typeof setJourney !== "function") {
      checks.push({
        id: "rec-disabled-when-cjm-on",
        pass: false,
        detail: "__protoSetJourneyMode unavailable",
      });
      return { pass: false, checks };
    }

    setJourney(true);
    await delay(120);
    const recWhileCjm = recModeSwitch();
    const recLocked =
      recWhileCjm != null &&
      recWhileCjm.disabled === true &&
      recWhileCjm.getAttribute("aria-checked") !== "true";
    checks.push({
      id: "rec-disabled-when-cjm-on",
      pass: recLocked,
      detail: recLocked
        ? undefined
        : `REC must be disabled+off while CJM on (disabled=${String(
            recWhileCjm?.disabled
          )}, aria-checked=${recWhileCjm?.getAttribute("aria-checked") ?? "missing"})`,
    });

    setJourney(false);
    await delay(120);
    const recIdle = recModeSwitch();
    const state = window.__protoStudioState?.();
    const airLive = Boolean(state?.isOnAir || state?.isPlaying);
    const recUnlocked = recIdle != null && (airLive || recIdle.disabled === false);
    checks.push({
      id: "rec-enabled-when-cjm-off-idle",
      pass: recUnlocked,
      detail: recUnlocked
        ? undefined
        : `REC should be enabled after CJM off (unless AIR); disabled=${String(
            recIdle?.disabled
          )} airLive=${String(airLive)}`,
    });

    return { pass: checks.every((check) => check.pass), checks };
  }

  window.__protoRunMcpSanityCheck = async () => {
    window.__protoAbortAll?.();
    startAgentTestingOverlay("AGENT TESTING — mcp-sanity");
    logAgentTestingOverlay("sanity: start");
    try {
      logAgentTestingOverlay("sanity: retreat baseline");
      const baseline = runSmokeRetreatChecks();
      logAgentTestingOverlay("sanity: REC⊗CJM xor");
      const xor = await runRecCjmXorSanityChecks();
      const checks = [...baseline.checks, ...xor.checks];
      const pass = checks.every((check) => check.pass);
      logAgentTestingOverlay(`sanity: ${pass ? "PASS" : "FAIL"}`);
      logControlPanel("qa:run", { source: "sanity-check", pass });
      return {
        pass,
        checks,
        state: window.__protoStudioState?.(),
      };
    } finally {
      stopAgentTestingOverlay();
    }
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
    if (!getMcpTestSession() && !isRecordingActive()) {
      logControlPanel(`transport:${action}`, {
        source: "mcp-helper",
        blocked: true,
        blockReason: "no-active-mcp-session — call a __protoRun* test or __protoStartRecording first",
      });
      return false;
    }
    if (isMcpTestAborted()) {
      logControlPanel(`transport:${action}`, {
        source: "mcp-helper",
        blocked: true,
        blockReason: "mcp-test-aborted",
      });
      return false;
    }
    if (!options.triggerTransport) return false;
    logControlPanel(`transport:${action}`, { source: "mcp-helper" });
    options.triggerTransport(action);
    return true;
  };

  window.__protoRunRetreatSmoke = (smokeOptions) =>
    withMcpTestSession("retreat-smoke", () => runRetreatSmokeBody(smokeOptions));

  async function runRetreatSmokeBody(
    smokeOptions?: { timeoutMs?: number }
  ): Promise<ProtoRetreatSmokeResult> {
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

    await dismissDiagnosticsUntilClear();

    return {
      pass: checks.every((check) => check.pass),
      checks,
    };
  }

  window.__protoRunHomePlaySmoke = (smokeOptions) =>
    withMcpTestSession("home-play-smoke", async () => {
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
    });

  window.__protoRunAgenticStepForwardSmoke = (smokeOptions) =>
    withMcpTestSession("agentic-step-forward", () =>
      runStepForwardSmokeForMode("agentic-cjm", smokeOptions)
    );

  window.__protoRunTraditionalStepForwardSmoke = (smokeOptions) =>
    withMcpTestSession("traditional-step-forward", () =>
      runStepForwardSmokeForMode("traditional-cjm", smokeOptions)
    );

  window.__protoRunTraditionalPlaySmoke = (smokeOptions) =>
    withMcpTestSession("traditional-play-smoke", async () => {
    const timeoutMs = smokeOptions?.timeoutMs ?? 120_000;
    window.__protoEnsureCleanStudio?.();
    window.__protoSetOrchestraMode?.("traditional-cjm");
    await delay(120);
    if (!window.__protoSetJourneyMode?.(true)) {
      return { pass: false, reason: "set-journey-mode-unavailable" };
    }
    await delay(480);
    if (!window.__protoTriggerTransport?.("jump-to-start")) {
      return { pass: false, reason: "jump-to-start-unavailable" };
    }
    await delay(800);
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
      if (traditionalJourneyEndReached(state)) {
        return { pass: true, state };
      }
      await delay(200);
    }

    return {
      pass: false,
      reason: "timeout",
      state: window.__protoStudioState?.(),
    };
    });

  window.__protoRunTraditionalRetreatSmoke = (smokeOptions) =>
    withMcpTestSession("traditional-retreat-smoke", async () => {
    const timeoutMs = smokeOptions?.timeoutMs ?? 120_000;
    const checks: ProtoRetreatSmokeCheck[] = [];
    const deadline = Date.now() + timeoutMs;

    const fail = (id: string, detail: string, state?: ProtoStudioMcpState) => {
      checks.push({ id, pass: false, detail, state });
      return { pass: false, checks };
    };

    window.__protoEnsureCleanStudio?.();
    window.__protoSetOrchestraMode?.("traditional-cjm");
    await delay(120);
    if (!window.__protoSetJourneyMode?.(true)) {
      return fail("journey-mode", "set-journey-mode-unavailable");
    }
    await delay(800);
    if (!window.__protoTriggerTransport?.("jump-to-end")) {
      return fail("jump-to-end", "trigger-jump-to-end-unavailable");
    }
    await delay(3200);

    let endState = window.__protoStudioState?.();
    if (!endState?.diagnosticOpen) {
      const endOk =
        endState != null &&
        (endState.beatId === "appointment-details" ||
          endState.beatId === "appointment-history" ||
          parseStudioStepCounter(endState.counter).visible >=
            parseStudioStepCounter(endState.counter).total);
      checks.push({
        id: "jump-to-end",
        pass: endOk,
        detail: endOk
          ? undefined
          : `expected appointment end, got ${endState?.beatId ?? "?"} ${endState?.counter ?? "?"}`,
        state: endState,
      });
    } else {
      return fail("jump-to-end", "playback-diagnostic at end", endState);
    }

    const stepBackOnce = async (
      expectedBeatIds: string[],
      checkId: string
    ): Promise<ProtoStudioMcpState | undefined> => {
      const before = window.__protoStudioState?.();
      if (before?.diagnosticOpen) {
        checks.push({
          id: checkId,
          pass: false,
          detail: "playback-diagnostic before retreat step",
          state: before,
        });
        return before;
      }
      if (!window.__protoTriggerTransport?.("step-back")) {
        checks.push({
          id: checkId,
          pass: false,
          detail: "step-back-unavailable",
          state: before,
        });
        return before;
      }
      await delay(2200);
      const settled = await waitForDirectorSettle(
        window.__protoStudioState?.() ?? before!,
        5000
      );
      const state = settled ?? window.__protoStudioState?.();
      if (state?.diagnosticOpen) {
        checks.push({
          id: checkId,
          pass: false,
          detail: "playback-diagnostic during retreat",
          state,
        });
        return state;
      }
      const pass =
        state?.beatId != null && expectedBeatIds.includes(state.beatId);
      checks.push({
        id: checkId,
        pass,
        detail: pass
          ? undefined
          : `expected [${expectedBeatIds.join(", ")}], got ${state?.beatId ?? "?"}`,
        state,
      });
      return state;
    };

    await stepBackOnce(["appointment-history"], "details-to-history");
    await stepBackOnce(["confirmation"], "history-to-confirmation");
    await stepBackOnce(["book-step2-reserve"], "confirmation-to-reserve");
    await stepBackOnce(["book-step2-time"], "reserve-to-time");
    await stepBackOnce(["book-step2-date"], "time-to-date");
    await stepBackOnce(["book-step2"], "date-to-book-step2");
    await stepBackOnce(["choose-location"], "book-step2-to-choose-location");
    await stepBackOnce(["traditional-pdp"], "choose-location-to-pdp");
    await stepBackOnce(["traditional-plp"], "pdp-to-plp");

    checks.push({
      id: "no-diagnostic",
      pass: !window.__protoStudioState?.().diagnosticOpen,
      state: window.__protoStudioState?.(),
    });

    await dismissDiagnosticsUntilClear();

    return {
      pass: checks.every((check) => check.pass),
      checks,
    };
    });

  window.__protoRunTraditionalControlRoomRobotQa = () =>
    withMcpTestSession("robot-qa", runTraditionalControlRoomRobotQa);

  return () => {
    uninstallAgentTestingOverlayApi();
    delete window.__protoDismissPlaybackDiagnostic;
    delete window.__protoStudioState;
    delete window.__protoEnsureCleanStudio;
    delete window.__protoSetOrchestraMode;
    delete window.__protoSmokeRetreatChecks;
    delete window.__protoSetJourneyMode;
    delete window.__protoTriggerTransport;
    delete window.__protoRunHomePlaySmoke;
    delete window.__protoRunRetreatSmoke;
    delete window.__protoRunAgenticStepForwardSmoke;
    delete window.__protoRunTraditionalStepForwardSmoke;
    delete window.__protoRunTraditionalPlaySmoke;
    delete window.__protoRunTraditionalRetreatSmoke;
    delete window.__protoRunTraditionalControlRoomRobotQa;
    delete window.__protoAbortAll;
    delete window.__protoRunMcpSanityCheck;
    delete window.__protoCursorDiagnostics;
    delete window.__protoMcpEyes;
    delete window.__protoDiagnosticFlashes;
  };
}
