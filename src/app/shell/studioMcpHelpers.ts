/** Dev-only helpers for Chrome DevTools MCP / agent testing.
 *
 * NORMAL MCP TEST (one call, safe, no transport):
 *   await window.__studioRunMcpSanityCheck?.()
 *
 * Visible page probe (robo-cursor + overlay PASS/FAIL):
 *   await window.__studioRunMcpPageProbe?.() // current screen
 *   await window.__studioRunMcpPageProbe?.({ screenId: "plp" })
 *
 * Robo-cursor (R10): await window.__studioProveRoboCursorFeedback?.(sel)
 * PLAYBACK_DIAG: window.__studioPlaybackDiag?.() / __studioAssertTypeIn?.()
 * STOP: window.__protoAbortAll?.()
 * Console: `[StudioControlPanel]` · `[PLAYBACK_DIAG]` · Eyes: `__protoMcpEyes()`
 */
import type { OrchestraModeId } from "@/app/orchestra/types";
import { isBuiltInOrchestraModeId } from "@/app/orchestra/orchestraModes";
import { runTraditionalControlRoomRobotQa } from "@/app/shell/controlRoomQaRunner";
import { installAutonomousQaSuiteApi } from "@/app/shell/qaAutonomousSuite";
import { logControlPanel } from "@/app/shell/controlPanelLog";
import {
  disableCursorQaEyes,
  formatPlaybackCursorEventSummary,
  getCursorDiagnosticState,
  getStudioCursorDiagnosticsBundle,
} from "@/app/shell/playbackCursorDiagnostic";
import { getRecentDiagnosticFlashes } from "@/app/shell/playbackDiagnosticFlash";
import {
  installPlaybackDiagWindowApis,
  playbackDiagClear,
  playbackDiagLog,
  uninstallPlaybackDiagWindowApis,
} from "@/app/shell/playbackDiag";
import type { ProveRoboCursorFeedbackResult } from "@/app/shell/studioProveRoboCursorFeedback";
import {
  beginMcpTestSession,
  endMcpTestSession,
  getMcpTestSession,
  isMcpTestAborted,
  requestMcpTestAbort,
  throwIfMcpTestAborted,
} from "@/app/shell/mcpTestGuard";
import { isRecordingActive } from "@/app/recording/recordingSession";
import {
  DEFAULT_PREARM_MS,
  DEFAULT_SETTLE_MS,
  forceClearAgentTestingOverlay,
  installAgentTestingOverlayApi,
  logAgentTestingOverlay,
  preArmAgentTestingOverlay,
  scheduleAgentTestingOverlayEnsureClear,
  startAgentTestingOverlay,
  stopAgentTestingOverlay,
  touchAgentTestingOverlay,
  uninstallAgentTestingOverlayApi,
} from "@/app/shell/agent-testing/agentTestingOverlay";
import { armOverlayOnStudioHelpers } from "@/app/shell/helperOverlayArm";
import {
  mcpDelay as delay,
  withMcpTestSession,
} from "@/app/shell/mcpTestSession";
import {
  installStudioAgentTeardownContractApi,
  uninstallStudioAgentTeardownContractApi,
} from "@/app/shell/studioAgentTeardownContract";
import {
  runMcpPageProbe,
  type McpPageProbeOptions,
  type McpPageProbeResult,
} from "@/app/shell/studioMcpPageProbe";
import { proveRoboCursorFeedback } from "@/app/shell/studioProveRoboCursorFeedback";
import { stripEphemeralStudioQuery } from "@/app/shell/studioUrl";
import {
  directorTransportBusy,
  stateFingerprint,
  stepSettleMsForState,
  waitForDirectorSettle as waitForDirectorSettleCore,
} from "@/app/shell/stepForwardSmokeSettle";
import {
  runPlayJourneyToStartSmoke,
  type PlayJourneySmokeResult,
} from "@/app/shell/playJourneySmoke";
import {
  runFullPlayProve,
  runAgenticFullPlayProve,
  runTraditionalFullPlayProve,
  type FullPlayProveOptions,
  type FullPlayProveResult,
  type AgenticFullPlayProveOptions,
  type AgenticFullPlayProveResult,
  type TraditionalFullPlayProveOptions,
  type TraditionalFullPlayProveResult,
} from "@/app/shell/fullPlayProve";
import type { AgentTestingPoSignal } from "@/app/shell/agent-testing/agentTestingPoSignal";
import { pollSmokePoSignal } from "@/app/shell/smokePoSignalPoll";

export { directorTransportBusy } from "@/app/shell/stepForwardSmokeSettle";

export type StudioMcpState = {
  diagnosticOpen: boolean;
  journeyMode: boolean;
  scrollLock: boolean;
  orchestraMode: OrchestraModeId | null;
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

export type RetreatSmokeCheck = {
  id: string;
  pass: boolean;
  detail?: string;
  state?: StudioMcpState;
};

export type RetreatSmokeResult = {
  pass: boolean;
  checks: RetreatSmokeCheck[];
};

export type SmokeRetreatCheck = {
  id: string;
  pass: boolean;
  detail?: string;
};

export type SmokeRetreatResult = {
  pass: boolean;
  checks: SmokeRetreatCheck[];
};

export type TransportAction =
  | "play"
  | "step-back"
  | "step-forward"
  | "jump-to-start"
  | "jump-to-end";

export type HomePlaySmokeResult = {
  pass: boolean;
  reason?: string;
  state?: StudioMcpState;
};

export type StepForwardSmokeStep = {
  index: number;
  before: StudioMcpState;
  after: StudioMcpState;
  ms: number;
};

export type StepForwardSmokeResult = {
  pass: boolean;
  reason?: string;
  steps: StepForwardSmokeStep[];
  finalState?: StudioMcpState;
  /** Set when PO Alarm aborted (or soft-failed) mid step-forward. */
  poSignal?: AgentTestingPoSignal | null;
};

declare global {
  interface Window {
    /** Dismiss playback diagnostic overlay if open. Returns whether one was open. */
    __protoDismissPlaybackDiagnostic?: () => boolean;
    __studioAcknowledgePlaybackDiagnostic?: () => boolean;
    __protoAcknowledgePlaybackDiagnostic?: () => boolean;
    /** Snapshot for MCP scripts — no paste needed. */
    __protoStudioState?: () => StudioMcpState;
    /** Dismiss diagnostic then return clean state. */
    __protoEnsureCleanStudio?: () => StudioMcpState;
    /** Programmatically switch Agentic / Traditional CJM path. */
    __protoSetOrchestraMode?: (modeId: OrchestraModeId) => boolean;
    /** Lightweight retreat baseline checks for MCP smoke runs. */
    __protoSmokeRetreatChecks?: () => SmokeRetreatResult;
    /** Enable/disable CJM journey mode (same as studio switch). */
    __protoSetJourneyMode?: (enabled: boolean) => boolean;
    /** Fire studio transport — play, step-forward, etc. */
    __protoTriggerTransport?: (action: TransportAction) => boolean;
    /** Agentic home Play → chat handoff smoke (async, dev-only). */
    __protoRunHomePlaySmoke?: (options?: {
      timeoutMs?: number;
    }) => Promise<HomePlaySmokeResult>;
    /** Jump-to-end then step-back — chat counter + avail June 25 baselines. */
    __protoRunRetreatSmoke?: (options?: {
      timeoutMs?: number;
    }) => Promise<RetreatSmokeResult>;
    /** Alias → `__protoRunRetreatSmoke` (agentic CJM retreat). */
    __protoRunAgenticRetreatSmoke?: (options?: {
      timeoutMs?: number;
    }) => Promise<RetreatSmokeResult>;
    /** Manual step-forward through the full agentic CJM playlist (dev-only). */
    __protoRunAgenticStepForwardSmoke?: (options?: {
      timeoutMs?: number;
      maxSteps?: number;
      softFailPoAlarm?: boolean;
    }) => Promise<StepForwardSmokeResult>;
    /** Manual step-forward through the full traditional CJM playlist (dev-only). */
    __protoRunTraditionalStepForwardSmoke?: (options?: {
      timeoutMs?: number;
      maxSteps?: number;
      softFailPoAlarm?: boolean;
    }) => Promise<StepForwardSmokeResult>;
    /** Traditional CJM Play → end → CJM start (async, dev-only). */
    __protoRunTraditionalPlaySmoke?: (options?: {
      timeoutMs?: number;
      softFailPoAlarm?: boolean;
    }) => Promise<PlayJourneySmokeResult>;
    /** Agentic CJM Play → end → CJM start (async, dev-only). */
    __protoRunAgenticPlaySmoke?: (options?: {
      timeoutMs?: number;
      softFailPoAlarm?: boolean;
    }) => Promise<PlayJourneySmokeResult>;
    /** Universal full Play prove (KEEP overlay). Prefer over thin presets. */
    __studioRunFullPlayProve?: (
      options?: FullPlayProveOptions
    ) => Promise<FullPlayProveResult>;
    __protoRunFullPlayProve?: (
      options?: FullPlayProveOptions
    ) => Promise<FullPlayProveResult>;
    /** Thin agentic preset → runFullPlayProve({ experience: "agentic" }). */
    __studioRunAgenticFullPlayProve?: (
      options?: AgenticFullPlayProveOptions
    ) => Promise<AgenticFullPlayProveResult>;
    __protoRunAgenticFullPlayProve?: (
      options?: AgenticFullPlayProveOptions
    ) => Promise<AgenticFullPlayProveResult>;
    /** Thin traditional preset → runFullPlayProve({ experience: "traditional" }). */
    __studioRunTraditionalFullPlayProve?: (
      options?: TraditionalFullPlayProveOptions
    ) => Promise<TraditionalFullPlayProveResult>;
    __protoRunTraditionalFullPlayProve?: (
      options?: TraditionalFullPlayProveOptions
    ) => Promise<TraditionalFullPlayProveResult>;
    /** Jump-to-end then step-back — traditional book / confirmation / browse baselines. */
    __protoRunTraditionalRetreatSmoke?: (options?: {
      timeoutMs?: number;
    }) => Promise<RetreatSmokeResult>;
    /** Full control-room robot QA — step fwd/back, play/pause, HUD telemetry (dev-only). */
    __protoRunTraditionalControlRoomRobotQa?: () => Promise<import("@/app/shell/controlRoomQaRunner").ControlRoomQaResult>;
    /** Cursor ring + DOM snapshot. Prefer `__studioCursorDiagnostics` (includes path). */
    __protoCursorDiagnostics?: () => import("@/app/shell/playbackCursorDiagnostic").CursorDiagnosticState;
    __studioCursorDiagnostics?: () => import("@/app/shell/playbackCursorDiagnostic").StudioCursorDiagnosticsBundle;
    /** Agent MCP eyes — state + cursor + path + qa log slices. */
    __protoMcpEyes?: () => {
      state?: StudioMcpState;
      cursor?: import("@/app/shell/playbackCursorDiagnostic").CursorDiagnosticState;
      path?: import("@/app/shell/playbackCursorDiagnostic").CursorPathDiagnostic;
      diagnosticFlashes?: import("@/app/shell/playbackDiagnosticFlash").DiagnosticFlashRecord[];
      diagnostics?: import("@/app/shell/controlPanelLog").ControlPanelLogEntry[];
      consoleFilter?: string;
      qaChecks: import("@/app/shell/controlPanelLog").ControlPanelLogEntry[];
      qaCursor: import("@/app/shell/controlPanelLog").ControlPanelLogEntry[];
      qaPhases: import("@/app/shell/controlPanelLog").ControlPanelLogEntry[];
    };
    __protoAbortAll?: () => StudioMcpState;
    __protoRunMcpSanityCheck?: () => Promise<{
      pass: boolean;
      checks: SmokeRetreatCheck[];
      state?: StudioMcpState;
    }>;
    /** Visible page probe — robo-cursor + overlay PASS/FAIL; stays on screen unless resetToHub. */
    __protoRunMcpPageProbe?: (
      options?: McpPageProbeOptions
    ) => Promise<McpPageProbeResult>;
    __studioRunMcpPageProbe?: (
      options?: McpPageProbeOptions
    ) => Promise<McpPageProbeResult>;
    /** R10 prove — hover + press + default arrow; includes path/onTargetStable. */
    __studioProveRoboCursorFeedback?: (
      selector?: string
    ) => Promise<ProveRoboCursorFeedbackResult>;
    __protoDiagnosticFlashes?: () => import("@/app/shell/playbackDiagnosticFlash").DiagnosticFlashRecord[];
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

function runSmokeRetreatChecks(): SmokeRetreatResult {
  const checks: SmokeRetreatCheck[] = [];

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

function chatHandoffReached(state: StudioMcpState): boolean {
  if (state.label?.toLowerCase().includes("chat")) return true;
  return parseStudioStepCounter(state.counter).visible >= 3;
}

function isOnAgenticChatBeat(state: StudioMcpState): boolean {
  return (
    state.beatId === "agentic-chat" ||
    state.label?.toLowerCase().includes("chat experience") === true
  );
}

/**
 * Retreat landed on chat with an honest mid-journey STEPS counter.
 * Historic false land was `STEPS: 2 / 25` after React Site Pilot/Chat — reject that.
 * Do **not** hardcode `visible >= 10` (21-beat agentic playlist puts chat ~9/21).
 */
export function chatRetreatCounterPass(state: StudioMcpState): boolean {
  if (!isOnAgenticChatBeat(state)) return false;
  const { visible, total } = parseStudioStepCounter(state.counter);
  if (visible === 2 && total === 25) return false;
  // Chat is after home type-in (≥3 in handoff helper); reject start-only glitch.
  return visible >= 3 && (total <= 0 || visible <= total);
}

function cursorFieldsForStudioState(): Pick<
  StudioMcpState,
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
  orchestraMode: OrchestraModeId,
  smokeOptions?: {
    timeoutMs?: number;
    maxSteps?: number;
    softFailPoAlarm?: boolean;
  }
): Promise<StepForwardSmokeResult> {
  const timeoutMs = smokeOptions?.timeoutMs ?? 600_000;
  const maxSteps =
    smokeOptions?.maxSteps ?? (orchestraMode === "traditional-cjm" ? 15 : 28);
  const steps: StepForwardSmokeStep[] = [];
  const deadline = Date.now() + timeoutMs;
  let lastSoftPo: AgentTestingPoSignal | null = null;

  const fail = (
    reason: string,
    state?: StudioMcpState,
    poSignal?: AgentTestingPoSignal | null
  ): StepForwardSmokeResult => ({
    pass: false,
    reason,
    steps,
    finalState: state ?? window.__protoStudioState?.(),
    poSignal: poSignal ?? lastSoftPo,
  });

  playbackDiagClear();
  playbackDiagLog("info", `step-forward-smoke start (${orchestraMode})`);
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

    // R15 — consume live PO latch each beat (Alarm aborts mid step-forward).
    const po = pollSmokePoSignal({
      context: `step-fwd:${orchestraMode}:${index + 1}:${before.beatId ?? "?"}`,
      softFailAlarm: smokeOptions?.softFailPoAlarm,
    });
    if (po.hit) {
      lastSoftPo = po.signal;
      if (po.abort) {
        return fail(po.reason ?? "po-alarm", before, po.signal);
      }
    }

    const { visible, total: stepTotal } = parseStudioStepCounter(before.counter);
    if (stepTotal > 0 && visible >= stepTotal) {
      return { pass: true, steps, finalState: before, poSignal: lastSoftPo };
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

    // Poll again after settle — Alarm during director travel.
    const poAfter = pollSmokePoSignal({
      context: `step-fwd-after:${orchestraMode}:${index + 1}:${settledAfter.beatId ?? "?"}`,
      softFailAlarm: smokeOptions?.softFailPoAlarm,
    });
    if (poAfter.hit) {
      lastSoftPo = poAfter.signal;
      if (poAfter.abort) {
        steps.push({
          index: index + 1,
          before,
          after: settledAfter,
          ms: Date.now() - stepStart,
        });
        return fail(poAfter.reason ?? "po-alarm", settledAfter, poAfter.signal);
      }
    }

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
  state?: StudioMcpState;
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

async function waitForDirectorSettle(
  state: StudioMcpState,
  maxMs: number
): Promise<StudioMcpState | undefined> {
  return waitForDirectorSettleCore(state, maxMs, {
    delay,
    getState: () => window.__protoStudioState?.(),
  });
}

export function registerStudioMcpHelpers(options: {
  /** Clear diagnostic UI. `acknowledgeStop: true` (default) latches DIAGNOSTIC_ACK_STOP. Smoke flake dismiss passes false. */
  dismissDiagnostic: (opts?: { acknowledgeStop?: boolean; note?: string }) => void;
  isDiagnosticOpen: () => boolean;
  abortAll?: () => void;
  getState: () => Omit<
    StudioMcpState,
    "diagnosticOpen" | "logLen" | "orchestraMode"
  >;
  getOrchestraModeId?: () => OrchestraModeId;
  hasOrchestraMode?: (modeId: OrchestraModeId) => boolean;
  setOrchestraMode?: (modeId: OrchestraModeId) => void;
  setJourneyMode?: (enabled: boolean) => void;
  triggerTransport?: (action: TransportAction) => void;
}): () => void {
  if (typeof window === "undefined") return () => {};
  installAgentTestingOverlayApi();
  installStudioAgentTeardownContractApi();
  installPlaybackDiagWindowApis();
  stripEphemeralStudioQuery();

  window.__protoDismissPlaybackDiagnostic = () => {
    if (!options.isDiagnosticOpen()) return false;
    // Harness / smoke flake clear — do NOT latch DIAGNOSTIC_ACK_STOP.
    options.dismissDiagnostic({ acknowledgeStop: false });
    return true;
  };

  window.__studioAcknowledgePlaybackDiagnostic = () => {
    if (!options.isDiagnosticOpen()) return false;
    options.dismissDiagnostic({
      acknowledgeStop: true,
      note: "mcp-acknowledge",
    });
    return true;
  };
  window.__protoAcknowledgePlaybackDiagnostic =
    window.__studioAcknowledgePlaybackDiagnostic;

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
    const playBtn = document.querySelector(
      '[data-studio-action="transport-play"], [aria-label="Play journey"]'
    );
    const stepFwd = document.querySelector('[aria-label="Step forward"]');
    const stepBack = document.querySelector('[aria-label="Step back"]');
    return {
      ...base,
      orchestraMode: options.getOrchestraModeId?.() ?? null,
      diagnosticOpen: options.isDiagnosticOpen(),
      logLen: log.length,
      isOnAir: document.querySelector(".studio-nav-scenario--on-air") != null,
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
  window.__studioCursorDiagnostics = () => getStudioCursorDiagnosticsBundle();

  window.__protoMcpEyes = () => {
    const log = window.dumpProtoControlPanelLog?.() ?? [];
    return {
      state: window.__protoStudioState?.(),
      cursor: window.__protoCursorDiagnostics?.(),
      path: window.__studioCursorDiagnostics?.().path,
      diagnosticFlashes: getRecentDiagnosticFlashes(),
      diagnostics: log
        .filter(
          (entry) =>
            entry.action === "diagnostic:open" ||
            entry.action === "diagnostic:dismiss"
        )
        .slice(-24),
      consoleFilter: "[StudioControlPanel]",
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
    stopAgentTestingOverlay({ force: true, reload: false });
    logControlPanel("qa:run", { source: "abort-all" });
    return window.__protoStudioState!();
  };

  /** Hard gate: CJM on ⇒ REC disabled + off (cannot silently regress). */
  async function runRecCjmXorSanityChecks(): Promise<SmokeRetreatResult> {
    const checks: SmokeRetreatCheck[] = [];
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
    let pass = false;
    startAgentTestingOverlay("AGENT TESTING - preparing...");
    try {
      await preArmAgentTestingOverlay({
        preArmMs: DEFAULT_PREARM_MS,
        title: "AGENT TESTING - preparing...",
      });
      touchAgentTestingOverlay("AGENT TESTING - mcp-sanity");
      logAgentTestingOverlay("sanity: start");
      logAgentTestingOverlay("sanity: retreat baseline");
      const baseline = runSmokeRetreatChecks();
      logAgentTestingOverlay(
        `sanity: retreat ${baseline.pass ? "PASS" : "FAIL"}`
      );
      logAgentTestingOverlay("sanity: REC xor CJM");
      const xor = await runRecCjmXorSanityChecks();
      for (const check of xor.checks) {
        logAgentTestingOverlay(
          `${check.pass ? "PASS" : "FAIL"}  ${check.id}${
            check.detail ? ` - ${check.detail}` : ""
          }`
        );
      }
      const checks = [...baseline.checks, ...xor.checks];
      const passCount = checks.filter((c) => c.pass).length;
      const failCount = checks.length - passCount;
      pass = failCount === 0 && checks.length > 0;
      logAgentTestingOverlay(
        `FINAL  ${pass ? "PASS" : "FAIL"}  ${passCount}/${checks.length} passed` +
          (failCount > 0 ? ` (${failCount} failed)` : "")
      );
      logControlPanel("qa:run", { source: "sanity-check", pass });
      return {
        pass,
        checks,
        state: window.__protoStudioState?.(),
      };
    } finally {
      try {
        // Stay on current screen - do not bounce to hub after chrome sanity.
        // Default no reload (crash-safe); pass reload:true only when needed.
        stopAgentTestingOverlay({
          reload: false,
          resetToHub: false,
          settleMs: DEFAULT_SETTLE_MS,
          result: pass ? "pass" : "fail",
        });
      } catch {
        forceClearAgentTestingOverlay();
      }
      scheduleAgentTestingOverlayEnsureClear(DEFAULT_SETTLE_MS + 1000);
    }
  };

  window.__protoRunMcpPageProbe = (options) => runMcpPageProbe(options);
  window.__studioRunMcpPageProbe = window.__protoRunMcpPageProbe;
  window.__studioProveRoboCursorFeedback = proveRoboCursorFeedback;
  window.__protoSetOrchestraMode = (modeId) => {
    const known = isBuiltInOrchestraModeId(modeId) || options.hasOrchestraMode?.(modeId);
    if (!known) return false;
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
      playbackDiagLog("transport", `blocked: no-active-mcp-session (${action})`);
      return false;
    }
    if (isMcpTestAborted()) {
      logControlPanel(`transport:${action}`, {
        source: "mcp-helper",
        blocked: true,
        blockReason: "mcp-test-aborted",
      });
      playbackDiagLog("transport", `blocked: mcp-test-aborted (${action})`);
      return false;
    }
    if (!options.triggerTransport) return false;
    logControlPanel(`transport:${action}`, { source: "mcp-helper" });
    // notePlaybackTransport (via App triggerTransport) emits PLAYBACK_DIAG step events.
    options.triggerTransport(action);
    return true;
  };

  window.__protoRunRetreatSmoke = (smokeOptions) =>
    withMcpTestSession(
      "retreat-smoke",
      () => runRetreatSmokeBody(smokeOptions),
      { resetToJourneyStart: true }
    );

  async function runRetreatSmokeBody(
    smokeOptions?: { timeoutMs?: number }
  ): Promise<RetreatSmokeResult> {
    const timeoutMs = smokeOptions?.timeoutMs ?? 90_000;
    const checks: RetreatSmokeCheck[] = [];
    const deadline = Date.now() + timeoutMs;

    const fail = (id: string, detail: string, state?: StudioMcpState) => {
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

    let chatState: StudioMcpState | undefined;
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
        : `expected agentic-chat mid-journey STEPS (not 2/25 false land), got ${chatState?.counter ?? "unknown"} beat=${chatState?.beatId ?? "?"}`,
      state: chatState,
    });

    // Avail baseline — fresh jump-to-end so we do not step back past avail into home.
    if (!window.__protoTriggerTransport?.("jump-to-end")) {
      return fail("avail-jump-to-end", "trigger-jump-to-end-unavailable");
    }
    await delay(2800);

    let availState: StudioMcpState | undefined;
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
    withMcpTestSession(
      "home-play-smoke",
      async () => {
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
      // R15 — mid-Play PO Alarm must abort (home-play shares Play poll contract).
      const po = pollSmokePoSignal({
        context: `home-play:${state.beatId ?? "?"}`,
        pausePlay: () => {
          if (state.isPlaying || state.isOnAir) {
            window.__protoTriggerTransport?.("play");
          }
        },
      });
      if (po.hit && po.abort) {
        return {
          pass: false,
          reason: po.reason ?? "po-alarm",
          state,
        };
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
      },
      { resetToJourneyStart: true }
    );

  window.__protoRunAgenticStepForwardSmoke = (smokeOptions) =>
    withMcpTestSession(
      "agentic-step-forward",
      () => runStepForwardSmokeForMode("agentic-cjm", smokeOptions),
      { resetToJourneyStart: true }
    );

  window.__protoRunTraditionalStepForwardSmoke = (smokeOptions) =>
    withMcpTestSession(
      "traditional-step-forward",
      () => runStepForwardSmokeForMode("traditional-cjm", smokeOptions),
      { resetToJourneyStart: true }
    );

  const runPlayToStartForMode = (
    orchestraMode: OrchestraModeId,
    startBeatId: string,
    startScreenId: string,
    smokeOptions?: { timeoutMs?: number; softFailPoAlarm?: boolean }
  ) =>
    runPlayJourneyToStartSmoke({
      orchestraMode,
      startBeatId,
      startScreenId,
      timeoutMs: smokeOptions?.timeoutMs,
      softFailPoAlarm: smokeOptions?.softFailPoAlarm,
      delay,
      ensureClean: () => {
        window.__protoEnsureCleanStudio?.();
      },
      setOrchestraMode: (mode) => {
        window.__protoSetOrchestraMode?.(mode);
      },
      setJourneyMode: (enabled) =>
        Boolean(window.__protoSetJourneyMode?.(enabled)),
      triggerTransport: (action) =>
        Boolean(window.__protoTriggerTransport?.(action)),
      getState: () => window.__protoStudioState?.(),
    });

  window.__protoRunTraditionalPlaySmoke = (smokeOptions) =>
    withMcpTestSession(
      "traditional-play-smoke",
      () =>
        runPlayToStartForMode(
          "traditional-cjm",
          "traditional-plp",
          "plp",
          smokeOptions
        ),
      { resetToJourneyStart: true }
    );

  window.__protoRunAgenticPlaySmoke = (smokeOptions) =>
    withMcpTestSession(
      "agentic-play-smoke",
      () =>
        runPlayToStartForMode(
          "agentic-cjm",
          "agentic-home",
          "site-pilot",
          smokeOptions
        ),
      { resetToJourneyStart: true }
    );

  // Universal prove — forceClear + arm + Play + peak + leave; keeps QA overlay.
  window.__studioRunFullPlayProve = runFullPlayProve;
  window.__protoRunFullPlayProve = runFullPlayProve;
  window.__studioRunAgenticFullPlayProve = runAgenticFullPlayProve;
  window.__protoRunAgenticFullPlayProve = runAgenticFullPlayProve;
  window.__studioRunTraditionalFullPlayProve = runTraditionalFullPlayProve;
  window.__protoRunTraditionalFullPlayProve = runTraditionalFullPlayProve;

  window.__protoRunTraditionalRetreatSmoke = (smokeOptions) =>
    withMcpTestSession(
      "traditional-retreat-smoke",
      async () => {
    const timeoutMs = smokeOptions?.timeoutMs ?? 120_000;
    const checks: RetreatSmokeCheck[] = [];
    const deadline = Date.now() + timeoutMs;

    const fail = (id: string, detail: string, state?: StudioMcpState) => {
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
    ): Promise<StudioMcpState | undefined> => {
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
      },
      { resetToJourneyStart: true }
    );

  window.__protoRunTraditionalControlRoomRobotQa = () =>
    withMcpTestSession("robot-qa", runTraditionalControlRoomRobotQa, {
      resetToJourneyStart: true,
    });

  armOverlayOnStudioHelpers();
  const uninstallAutonomousQaSuite = installAutonomousQaSuiteApi();
  // Re-bind after overlay wrap so alias === retreat smoke (same reference).
  window.__protoRunAgenticRetreatSmoke = window.__protoRunRetreatSmoke;

  return () => {
    uninstallAutonomousQaSuite();
    uninstallAgentTestingOverlayApi();
    uninstallStudioAgentTeardownContractApi();
    uninstallPlaybackDiagWindowApis();
    delete window.__protoDismissPlaybackDiagnostic;
    delete window.__studioAcknowledgePlaybackDiagnostic;
    delete window.__protoAcknowledgePlaybackDiagnostic;
    delete window.__protoStudioState;
    delete window.__protoEnsureCleanStudio;
    delete window.__protoSetOrchestraMode;
    delete window.__protoSmokeRetreatChecks;
    delete window.__protoSetJourneyMode;
    delete window.__protoTriggerTransport;
    delete window.__protoRunHomePlaySmoke;
    delete window.__protoRunRetreatSmoke;
    delete window.__protoRunAgenticRetreatSmoke;
    delete window.__protoRunAgenticStepForwardSmoke;
    delete window.__protoRunTraditionalStepForwardSmoke;
    delete window.__protoRunTraditionalPlaySmoke;
    delete window.__protoRunAgenticPlaySmoke;
    delete window.__studioRunFullPlayProve;
    delete window.__protoRunFullPlayProve;
    delete window.__studioRunAgenticFullPlayProve;
    delete window.__protoRunAgenticFullPlayProve;
    delete window.__studioRunTraditionalFullPlayProve;
    delete window.__protoRunTraditionalFullPlayProve;
    delete window.__protoRunTraditionalRetreatSmoke;
    delete window.__protoRunTraditionalControlRoomRobotQa;
    delete window.__protoAbortAll;
    delete window.__protoRunMcpSanityCheck;
    delete window.__protoRunMcpPageProbe;
    delete window.__studioRunMcpPageProbe;
    delete window.__studioProveRoboCursorFeedback;
    delete window.__protoCursorDiagnostics;
    delete window.__studioCursorDiagnostics;
    delete window.__protoMcpEyes;
    delete window.__protoDiagnosticFlashes;
  };
}
