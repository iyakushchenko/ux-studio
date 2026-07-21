/**
 * Mid-flight AGENT TESTING panel (bottom-right). Capture blocks clicks; page stays visible.
 * PO Alarm/Cursor/Scroll → live `__studioAgentTestingTakeover` (primary); dump secondary.
 * See RECORDING.md · PLAYBACK_DIAG.md · agentTestingPoSignal.ts.
 */
import {
  resetStudioAfterAgentTest,
  stripEphemeralStudioQuery,
} from "@/app/shell/studioUrl";
import { removeDemoCursor, setDemoCursorJourneyMode } from "@/app/scenario/demoCursor";
import { getPrototypeScrollRoot } from "@/app/scenario/playbackScroll";
import { getControlPanelSnapshot } from "@/app/shell/controlPanelLog";
import { getCursorDiagnosticState } from "@/app/shell/playbackCursorDiagnostic";
import { getMcpTestSession } from "@/app/shell/mcpTestGuard";
import { getPlaybackDiagBundle, playbackDiagScroll } from "@/app/shell/playbackDiag";
import { getRecentDiagnosticFlashes } from "@/app/shell/playbackDiagnosticFlash";
import {
  appendQaDiagRing,
  closeQaDiagGate,
  hydrateQaDiagGate,
  isQaDiagGateOpen,
  isQaDiagLoggerMode,
  openQaDiagGate,
  replaceQaDiagRing,
  setQaDiagLoggerMode,
  setQaDiagSessionMeta,
  type QaDiagRingEvent,
} from "@/app/shell/qaDiagGate";
import {
  buildLogEntryFromPlain,
  buildLogEntryFromStep,
  coalesceLogEntry,
  formatElapsed,
  formatHelperStepLabel,
  formatLogRowText,
  clampStepDurationMs,
} from "@/app/shell/agent-testing/agentTestingFormat";
import {
  animate,
  motionEaseInOutTransition,
} from "@/uxds/motion";
import {
  formatActivityStatus,
  type AgentTestingActivityPhase,
  resolveCaptureToggleLabel,
} from "@/app/shell/agent-testing/agentTestingActivity";
import {
  bugIconClosesSession,
  canUserDismissSession,
  escalateObserveToAgent,
  getSessionKind,
  hintForSessionKind,
  isAgentLocked,
  isAwaitingUserReply,
  isLoggerStyleSession,
  resolveHandoffKind,
  resolveOpenKind,
  setAwaitingUserReply,
  setSessionKind,
  shouldBlockPageClicks,
  shouldWipeOnHandoff,
  titleForSessionKind,
  unlockAgentToObserve,
  type OpenQaLoggerOptions,
  type QaHandoffOptions,
  type AgentTestingSessionKind,
} from "@/app/shell/agent-testing/agentTestingSession";
import {
  clearNavMcpHintDom,
  deriveLiveMcpStatus,
  isMcpChromeLive as isMcpChromeLivePure,
  paintMcpChromeDom,
} from "@/app/shell/agent-testing/agentTestingMcpChrome";
import {
  armMcpPendingTimeout,
  beginMcpConnecting,
  clearMcpConnectionError,
  clearMcpPending,
  getQaPendingTimeoutMs,
  registerMcpPendingTimeoutHandler,
  reportMcpConnectionError,
  resetMcpStatusLatches,
  type McpConnectionStatus,
} from "@/app/shell/agent-testing/agentTestingMcpStatus";
import {
  clearQaMessageDraft,
} from "@/app/shell/agent-testing/agentTestingListen";
import {
  bindMessageListen,
  focusMessageInput,
  installViteHmrListen,
  isDiagnosticOpenNow,
  maybeLogMcpPhaseChange,
  noteBlockedPlayAttempt,
  onPlaybackDiagnosticOpened,
  pauseCaptureAndHalt,
  shouldBlockPlayNow,
  confirmFailHandoffFromAgent,
  clearFailHandoffFromSession,
  type QaListenDeps,
} from "@/app/shell/agent-testing/agentTestingQaListenBridge";
import {
  beginFailHandoff,
  clearFailHandoff,
  isFailHandoffPending,
} from "@/app/shell/agent-testing/agentTestingFailHandoff";
import {
  clearQaProgressFreeze,
  isQaProgressFrozen,
  setQaProgressFreeze,
} from "@/app/shell/agent-testing/agentTestingProgressFreeze";
import {
  noteQaMessageConsumed,
  noteQaMessageSent,
  getQaMessageRttStats,
} from "@/app/shell/agent-testing/agentTestingMessageRtt";
import {
  armQaAgentPresenceHeartbeat,
  clearQaAgentPresence,
  endQaProveMode,
  isQaAgentPresenceStaleForAutoPause,
  isQaProveModeActive,
  peekQaAgentPresence,
  touchQaAgentPresence,
} from "@/app/shell/agent-testing/agentTestingPresence";
import {
  isRecordingActive,
  subscribeRecordingSession,
} from "@/app/recording/recordingSession";
import {
  armQaChatLoadingWatch,
  disarmQaChatLoadingWatch,
} from "@/app/shell/agent-testing/agentTestingChatLoadingWatch";
import {
  buildQaAgentResumeCard,
  isQaAgentOfflineForMessage,
} from "@/app/shell/agent-testing/agentTestingResumeCard";
import { registerQaDiagnosticOpenHandler } from "@/app/shell/playbackDiagQaBridge";
import {
  clearStalePlaybackDiagnostic,
  consumePlaybackDiagnostic,
  peekPlaybackDiagnostic,
} from "@/app/shell/playbackDiagQaBridge";
import { getOpenDiagnosticFlash } from "@/app/shell/playbackDiagnosticFlash";
import {
  buildAgentTestingDump,
  consoleSeparator,
  downloadAgentTestingDump,
  pushAgentTestingDump,
  type AgentTestingDump,
} from "@/app/shell/agent-testing/agentTestingDump";
import {
  clearPoSignal,
  consumePoSignal,
  installPoSignalWindowApis,
  latchPoSignal,
  peekPoSignal,
  uninstallPoSignalWindowApis,
  type AgentTestingPoSignal,
} from "@/app/shell/agent-testing/agentTestingPoSignal";
import {
  haltPlaybackForPoSignal,
  installPoSignalPlaybackHaltWindowApis,
  uninstallPoSignalPlaybackHaltWindowApis,
} from "@/app/shell/agent-testing/agentTestingPlaybackHalt";
import { readAgentTestingSitrep } from "@/app/shell/agent-testing/agentTestingSitrep";
import {
  armOriginProbe,
  disarmOriginProbe,
} from "@/app/shell/agent-testing/agentTestingOriginProbe";
import {
  isStaleGreenActive,
  noteStaleGreenIfChanged,
} from "@/app/shell/agent-testing/agentTestingStaleGreen";
import {
  deriveAgentControlKind,
  isCjmCassetteOn,
  readLiveJourneyIsPlaying,
  type AgentControlKind,
} from "@/app/shell/agent-testing/agentTestingControlKind";
import {
  clearAgentTestingFinaleSeal,
  isAgentTestingFinaleSealed,
  sealAgentTestingFinale,
} from "@/app/shell/agent-testing/agentTestingFinaleSeal";
import {
  bindAgentTestingNavClearance,
  syncAgentTestingNavClearance,
} from "@/app/shell/agent-testing/agentTestingNavClearance";
import {
  isCaptureInProgressBridge,
  syncCaptureWatchBridge,
  unbindCaptureWatchBridge,
} from "@/app/shell/agent-testing/agentTestingCaptureWatchBridge";
import type {
  AgentTestingLogEntry,
  AgentTestingOverlayResult,
  AgentTestingStepOutcome,
  AgentTestingTimelineKey,
  LogAgentTestingStepInput,
} from "@/app/shell/agent-testing/agentTestingTypes";

export type { AgentTestingOverlayResult } from "@/app/shell/agent-testing/agentTestingTypes";
export type {
  AgentTestingStepOutcome,
  LogAgentTestingStepInput,
} from "@/app/shell/agent-testing/agentTestingTypes";

const ROOT_ID = "agent-testing-overlay";
const LOG_LIMIT = 80;
/** Safety: never leave the overlay up longer than this (force clear). */
const MAX_MS = 3 * 60 * 1000;
/** Touch-only / abandoned sessions: auto stop -> sitrep after idle. */
export const IDLE_MS = 45_000;
/** Default DONE/SITREP settle before hide (and optional reload). */
export const DEFAULT_SETTLE_MS = 9000;
const SETTLE_MS_MIN = 5000;
const SETTLE_MS_MAX = 12000;
/** Default pre-arm countdown before probe steps (PO prepare window). */
export const DEFAULT_PREARM_MS = 2500;
const PREARM_MS_MIN = 1500;
const PREARM_MS_MAX = 5000;
const SITREP_COUNTDOWN_TICK_MS = 250;
const ELAPSED_TICK_MS = 250;
/** Stale persist key - cleared on stop; never restored on load by default. */
const PERSIST_KEY = "agentTestingOverlay";
const CONTINUE_KEY = "protoAgentTestingOverlayContinue";
const DEFAULT_TITLE = "AGENT TESTING";
const PREPARE_TITLE = "AGENT TESTING - preparing...";
/** Alarm dump + latch — agents consume via __studioConsumePoSignal. */
const ALARM_AGENT_PROMPT =
  "PO Alarm — investigate sequence/expected-steps mismatch. Call __studioConsumePoSignal(), inspect sitrep/timeline/diag, then fix or ask PO.";

export type StopAgentTestingOverlayOptions = {
  force?: boolean;
  /** After settle (or force teardown), reload once. MCP helpers: true. Manual: false. */
  reload?: boolean;
  /**
   * When true: land journey key 1 after stop/reload (CJM/journey smokes).
   * Preferred over `resetToHub` — never dumps PO to hub.
   */
  resetToJourneyStart?: boolean;
  /**
   * When true: force hub after stop/reload.
   * @deprecated Forbidden for product/smoke — Hub nav click only.
   */
  resetToHub?: boolean;
  /**
   * DONE/SITREP visible duration before hide (ms).
   * Default 9000; clamped to 5000-12000. Ignored when `force: true`.
   */
  settleMs?: number;
  /** Sitrep PASS/FAIL badge (green/red). Default neutral. */
  result?: AgentTestingOverlayResult;
};

type OverlayApi = {
  start: (title?: string) => void;
  /** Arm overlay if inactive; refresh safety timer if already active. Never nests. */
  touch: (title?: string) => void;
  stop: (options?: StopAgentTestingOverlayOptions) => void;
  /** Always clear instantly (Dismiss / stuck recovery). Hard-removes DOM. */
  forceClear: () => void;
  /** Free-form QA logger (version chip) — opens gate, page clicks allowed. */
  openLogger: (options?: OpenQaLoggerOptions | string) => void;
  /** Soft-close logger (keep DOM, close gate). */
  softClose: () => void;
  /** Hold DONE sitrep open — cancel Auto-closes. */
  keepOpen: () => boolean;
  /** Ack playback diagnostic from QA (consume + clear). */
  ackDiagnostic: () => boolean;
  /** Confirm FAIL handoff after agent latch (handshake). */
  confirmFailTakeover: () => boolean;
  /** Bug-icon toggle — open or close+stop manual capture. */
  toggleLogger: () => void;
  /** Agent/MCP handoff — wipe or oversee. */
  handoff: (options?: QaHandoffOptions) => void;
  /** Ask PO a question in the log (agent-prompt). */
  askUser: (prompt: string) => boolean;
  /** Observe → agent lock (Alarm path). */
  escalateObserve: () => boolean;
  /** Agent → observe unlock after escalate. */
  unlockObserve: () => boolean;
  /** Clear log/ring/timer for a fresh manual session. */
  resetSession: () => void;
  /** MCP connection status snapshot (CONTROL / OBSERVE / PENDING / …). */
  mcpStatus: () => McpConnectionStatus;
  /** Append PO free-text note into log + dump ring. */
  appendPoNote: (text: string) => boolean;
  /** Final RESULT · PASS/FAIL line before teardown. Returns false if withheld. */
  appendFinale: (result: "pass" | "fail", summary?: string) => boolean;
  log: (line: string) => void;
  /** Structured mid-flight step (preferred over plain helper spam). */
  logStep: (input: LogAgentTestingStepInput) => void;
  /** Helper call with sitrep context + coalesce. */
  logHelper: (suffix: string) => void;
  /** PO: sequence / expected-steps mismatch — latches live takeover signal. */
  ringAlarm: (note?: string) => void;
  flagCursorWeird: (note?: string) => void;
  /** PO mid-flight scroll problem report (amber + live latch + dump). */
  flagScrollIssue: (note?: string) => void;
  /** Peek live PO latch (does not clear). */
  peekPoSignal: () => AgentTestingPoSignal | null;
  /** Consume + clear live PO latch. */
  consumePoSignal: () => AgentTestingPoSignal | null;
  /**
   * Agent leaves QA session (Cursor chat / elsewhere) — HARD.
   * Pause capture + halt Play + presence OFFLINE. Does not latch QA_PAUSE_HALT
   * (keeps Message latch free for PO while agent is gone).
   */
  pauseForAgentLeave: () => AgentLeavePauseResult;
  /**
   * Agent returns to QA — HARD.
   * Presence ONLINE → consume Message/latch if any → resume capture only when
   * no Message work remains. Always inspect `consumedSignal` / `messagePendingWork`.
   */
  resumeForAgentReturn: () => AgentReturnResumeResult;
  setTimeline: (keys: string[]) => void;
  markTimeline: (key: string, outcome: AgentTestingStepOutcome) => void;
  downloadDump: () => boolean;
  isActive: () => boolean;
  /** True when QA Pause or open diagnostic should refuse Play. */
  shouldBlockPlay: () => boolean;
  /** Play gate: auto-lift Pause-only (not FAIL modal / freeze). */
  autoResumeCaptureForPlay: () => boolean;
  isCapturePaused: () => boolean;
  isDiagnosticBlocking: () => boolean;
};

/** Result of `pauseForAgentLeave`. */
export type AgentLeavePauseResult = {
  ok: boolean;
  capturePaused: boolean;
  presenceOnline: boolean;
  reason: string;
};

/** Result of `resumeForAgentReturn`. */
export type AgentReturnResumeResult = {
  ok: boolean;
  captureResumed: boolean;
  presenceOnline: boolean;
  /** Latch consumed on arrival (Message / Alarm / …). Null if none. */
  consumedSignal: AgentTestingPoSignal | null;
  /** True when Message must be handled before continuing prove work. */
  messagePendingWork: boolean;
  reason: string;
};

let active = false;
let settling = false;
/** Pause freezes capture + clock (all kinds). */
let capturePaused = false;
/** Dedupes auto-pause log spam while presence stays stale. */
let autoPausedForStalePresence = false;
/** Dedupes REC→QA capture pause log while REC stays live. */
let recPausedQaCapture = false;
/** Unsubscribe for REC session XOR with QA capture. */
let recordingSessionUnsub: (() => void) | null = null;
/**
 * True after real capture progress in this session.
 * False after reset / fresh open → Capture CTA shows CAPTURE (not Resume).
 */
let sessionHadProgress = false;
/** True when log has events after last Reset (Reset CTA gated until dirty). */
let logDirty = false;
let logEntries: AgentTestingLogEntry[] = [];
/** Coalesce rapid log pushes into one DOM rebuild per animation frame. */
let logDomFlushRaf = 0;
let sessionTitle = DEFAULT_TITLE;
let nest = 0;
let safetyTimer: ReturnType<typeof setTimeout> | null = null;
let idleTimer: ReturnType<typeof setTimeout> | null = null;
let settleTimer: ReturnType<typeof setTimeout> | null = null;
let settleCountdownTimer: ReturnType<typeof setInterval> | null = null;
let ensureClearTimer: ReturnType<typeof setTimeout> | null = null;
let reloadTimer: ReturnType<typeof setTimeout> | null = null;
let elapsedTimer: ReturnType<typeof setInterval> | null = null;
let sessionStartedAt = 0;
let lastStepAt = 0;
/** Accumulated elapsed while running (excludes paused gaps). */
let elapsedAccumMs = 0;
/** Wall clock when current run segment started; 0 while paused / stopped. */
let elapsedRunStartedAt = 0;
let beforeUnloadBound = false;
let visibilityBound = false;
let reloadPending = false;
let settleReload = false;
/** Latched for settle + deferred reload (default stay-on-page). */
let settleResetToHub = false;
/** Journey smoke teardown → key 1 (preferred; never hub). */
let settleResetToJourneyStart = false;
let settleResult: AgentTestingOverlayResult = "neutral";
/** PO held sitrep open — cancel Auto-closes countdown. */
let settleHeld = false;
let timelineKeys: AgentTestingTimelineKey[] = [];
let lastUnexpectedDwellCount = 0;
/** Latch auto scroll soft-fails so we do not spam amber rows. */
let lastAutoScrollFlagKey = "";
let lastSitrepLine = "";
/** Last MCP phase logged to QA timeline (avoid spam). */
let lastLoggedMcpPhase = "";
/** Coalesce user-typing soft rows while PENDING. */
let lastUserTypingLogAt = 0;
/** Coalesce ignored-Play soft rows. */
let lastBlockedPlayLogAt = 0;
/** Diode/diagnostic blocking latch for Play ignore. */
let diagnosticBlocking = false;

/**
 * Never show raw `__studio*` / `__proto*` helper names in the title
 * (CSS uppercase turned `__studioEnsureCleanStudio` into garbled STUDIOENSURE...).
 */
export function resolveAgentTestingOverlayTitle(title?: string): string {
  const raw = title?.trim();
  if (!raw) return DEFAULT_TITLE;
  if (/__(?:studio|proto)/i.test(raw)) return DEFAULT_TITLE;
  if (/ensureCleanStudio/i.test(raw)) return DEFAULT_TITLE;
  // Allow short labels like "AGENT TESTING - mcp-sanity" / "MANUAL TEST"
  if (/^AGENT TESTING\b/i.test(raw) && raw.length <= 48) return raw;
  if (/^MANUAL TEST\b/i.test(raw) && raw.length <= 48) return raw;
  if (raw.length > 48) return DEFAULT_TITLE;
  return raw;
}

function clearPersist(): void {
  try {
    sessionStorage.removeItem(PERSIST_KEY);
  } catch {
    /* private mode / SSR */
  }
}

function writePersist(title: string): void {
  try {
    sessionStorage.setItem(
      PERSIST_KEY,
      JSON.stringify({ title, at: Date.now() })
    );
  } catch {
    /* ignore */
  }
}

function shouldContinueFromPersist(): boolean {
  try {
    return sessionStorage.getItem(CONTINUE_KEY) === "1";
  } catch {
    return false;
  }
}

function clearHistoryPersist(): void {
  try {
    sessionStorage.removeItem("protoAgentTestingOverlayHistory");
  } catch {
    /* ignore */
  }
}

function clearSafetyTimer(): void {
  if (safetyTimer != null) {
    clearTimeout(safetyTimer);
    safetyTimer = null;
  }
}

function clearIdleTimer(): void {
  if (idleTimer != null) {
    clearTimeout(idleTimer);
    idleTimer = null;
  }
}

function clearSettleTimer(): void {
  if (settleTimer != null) {
    clearTimeout(settleTimer);
    settleTimer = null;
  }
  if (settleCountdownTimer != null) {
    clearInterval(settleCountdownTimer);
    settleCountdownTimer = null;
  }
}

function clearEnsureClearTimer(): void {
  if (ensureClearTimer != null) {
    clearTimeout(ensureClearTimer);
    ensureClearTimer = null;
  }
}

function clearElapsedTimer(): void {
  if (elapsedTimer != null) {
    clearInterval(elapsedTimer);
    elapsedTimer = null;
  }
}

function getElapsedMs(): number {
  if (elapsedRunStartedAt > 0 && !capturePaused) {
    return elapsedAccumMs + Math.max(0, Date.now() - elapsedRunStartedAt);
  }
  return elapsedAccumMs;
}

function resetElapsedClock(running: boolean): void {
  elapsedAccumMs = 0;
  elapsedRunStartedAt = running ? Date.now() : 0;
  setElapsedLabel(formatElapsed(0));
  persistElapsedToGate();
}

/** Restore elapsed across page refresh (same gate session). */
function restoreElapsedClock(
  accumMs: number,
  startedAt: number,
  running: boolean
): void {
  elapsedAccumMs = Math.max(0, accumMs);
  sessionStartedAt = startedAt > 0 ? startedAt : Date.now();
  elapsedRunStartedAt = running ? Date.now() : 0;
  setElapsedLabel(formatElapsed(getElapsedMs()));
  persistElapsedToGate();
}

function persistElapsedToGate(): void {
  try {
    setQaDiagSessionMeta({
      elapsedAccumMs: getElapsedMs(),
      sessionStartedAt: sessionStartedAt || Date.now(),
    });
  } catch {
    /* hang-safe */
  }
}

function pauseElapsedClock(): void {
  if (elapsedRunStartedAt > 0) {
    elapsedAccumMs += Math.max(0, Date.now() - elapsedRunStartedAt);
    elapsedRunStartedAt = 0;
  }
  setElapsedLabel(formatElapsed(elapsedAccumMs));
  persistElapsedToGate();
}

function resumeElapsedClock(): void {
  if (elapsedRunStartedAt === 0) {
    elapsedRunStartedAt = Date.now();
  }
  setElapsedLabel(formatElapsed(getElapsedMs()));
  persistElapsedToGate();
}

function armElapsedTimer(): void {
  clearElapsedTimer();
  if (!active || settling) return;
  const tick = () => {
    if (!active || settling) return;
    setElapsedLabel(formatElapsed(getElapsedMs()));
    persistElapsedToGate();
    refreshSitrepDom();
    refreshMcpStatusDom();
    if (!capturePaused) {
      maybeAutoFlagCursorIssue();
      maybeAutoFlagScrollIssue();
    }
  };
  tick();
  elapsedTimer = setInterval(tick, ELAPSED_TICK_MS);
}

function setElapsedLabel(text: string): void {
  if (!hasDomQuery()) return;
  const el = document.querySelector<HTMLElement>(
    ".studio-agent-testing-overlay__elapsed"
  );
  if (el) el.textContent = text;
}

function refreshSitrepDom(): void {
  const sitrep = readAgentTestingSitrep();
  lastSitrepLine = sitrep.line;
  if (!hasDomQuery()) return;
  const sessionEl = document.querySelector<HTMLElement>(
    ".studio-agent-testing-overlay__session-line"
  );
  if (sessionEl) {
    sessionEl.textContent = sitrep.sessionLine;
    sessionEl.dataset.staleGreen = isStaleGreenActive() ? "true" : "false";
  }
  // Compat: legacy sitrep node if present
  const legacy = document.querySelector<HTMLElement>(
    ".studio-agent-testing-overlay__sitrep"
  );
  if (legacy && !sessionEl) legacy.textContent = sitrep.sessionLine;
  refreshStaleGreenAndDiagMirror();
}

function refreshStaleGreenAndDiagMirror(): void {
  if (!active && !settling) return;
  try {
    const noted = noteStaleGreenIfChanged();
    if (noted.logLabel) {
      pushLogEntry({
        atMs: Date.now(),
        timeLabel: new Date().toLocaleTimeString("en-GB", { hour12: false }),
        label: noted.logLabel,
        outcome: "soft-fail",
        kind: "system",
      });
    }
    const root = document.getElementById(ROOT_ID);
    const session = root?.querySelector<HTMLElement>(
      ".studio-agent-testing-overlay__session"
    );
    if (session) {
      session.dataset.staleGreen = noted.amber ? "true" : "false";
    }
  } catch {
    /* hang-safe */
  }
  try {
    // Unified sequence lives in the main QA chat (playback-diag rows).
    // Keep the old PLAYBACK_DIAG side pane hidden — agents miss it / cryptic.
    const wrap = document.querySelector<HTMLElement>(
      ".studio-agent-testing-overlay__diag-mirror-wrap"
    );
    if (wrap) wrap.hidden = true;
  } catch {
    /* hang-safe */
  }
}

function armSessionOriginProbe(): void {
  try {
    armOriginProbe(() => {
      try {
        refreshSitrepDom();
      } catch {
        /* hang-safe */
      }
    });
  } catch {
    /* hang-safe */
  }
}

function renderTimeline(): void {
  if (!hasDomQuery()) return;
  const root = document.getElementById(ROOT_ID);
  const wrap = root?.querySelector<HTMLElement>(
    ".studio-agent-testing-overlay__timeline-wrap"
  );
  const strip = root?.querySelector<HTMLElement>(
    ".studio-agent-testing-overlay__timeline"
  );
  if (!strip) return;
  strip.replaceChildren();
  if (timelineKeys.length === 0) {
    if (wrap) wrap.hidden = true;
    else strip.hidden = true;
    return;
  }
  if (wrap) wrap.hidden = false;
  strip.hidden = false;
  for (const item of timelineKeys) {
    const chip = document.createElement("span");
    chip.className = "studio-agent-testing-overlay__timeline-chip";
    chip.dataset.outcome = item.outcome;
    chip.title = item.key;
    chip.textContent = item.key.length > 18 ? `${item.key.slice(0, 16)}…` : item.key;
    strip.appendChild(chip);
  }
}

export function setAgentTestingTimeline(keys: string[]): void {
  timelineKeys = keys.map((key) => ({ key, outcome: "pending" as const }));
  renderTimeline();
}

export function markAgentTestingTimeline(
  key: string,
  outcome: AgentTestingStepOutcome
): void {
  const hit = timelineKeys.find((k) => k.key === key);
  if (hit) hit.outcome = outcome;
  else timelineKeys.push({ key, outcome });
  renderTimeline();
}

function describeScrollHostForOverlay(scrollEl: HTMLElement): string {
  const id = scrollEl.id ? `#${scrollEl.id}` : "";
  const cls = scrollEl.className
    ? `.${String(scrollEl.className).trim().split(/\s+/).slice(0, 2).join(".")}`
    : "";
  return `${scrollEl.tagName.toLowerCase()}${id}${cls}`;
}

function readScrollSnapshot(): {
  host: string | null;
  scrollTop: number | null;
  scrollHeight: number | null;
  clientHeight: number | null;
} {
  try {
    const host = getPrototypeScrollRoot();
    if (!host) {
      return {
        host: null,
        scrollTop: null,
        scrollHeight: null,
        clientHeight: null,
      };
    }
    return {
      host: describeScrollHostForOverlay(host),
      scrollTop: host.scrollTop,
      scrollHeight: host.scrollHeight,
      clientHeight: host.clientHeight,
    };
  } catch {
    return {
      host: null,
      scrollTop: null,
      scrollHeight: null,
      clientHeight: null,
    };
  }
}

function saveDump(
  reason: "fail" | "alarm" | "cursor" | "scroll" | "manual",
  extras?: {
    code?: string;
    poSignal?: AgentTestingPoSignal | null;
    agentPrompt?: string;
  }
): AgentTestingDump | null {
  try {
    const dump = buildAgentTestingDump({
      reason,
      title: sessionTitle,
      elapsedMs: getElapsedMs(),
      sitrepLine: lastSitrepLine,
      log: logEntries,
      code: extras?.code,
      agentPrompt: extras?.agentPrompt,
      timeline: timelineKeys.map((t) => ({
        key: t.key,
        outcome: String(t.outcome),
      })),
      poSignal: extras?.poSignal ?? peekPoSignal(),
      gateMode: getSessionKind(),
      capturePaused,
      mcp: (() => {
        try {
          const s = readLiveMcpStatus();
          return {
            phase: s.phase,
            label: s.label,
            pendingMsLeft: s.pendingMsLeft ?? null,
          };
        } catch {
          return undefined;
        }
      })(),
    });
    pushAgentTestingDump(dump);
    console.info(
      "[AGENT_TESTING] dump saved (secondary)",
      reason,
      dump.code ?? "",
      dump.atIso,
      "— primary: window.__studioConsumePoSignal() · dump: __studioDownloadAgentTestingDump()"
    );
    return dump;
  } catch {
    /* never block overlay */
    return null;
  }
}

/**
 * Save Log / agent parse — always the **current** session (not a stale Alarm dump).
 * Pushes to last-N store then downloads that payload.
 * HARD: auto-pauses capture (halts Play) before download — one lean timeline row.
 */
export function downloadCurrentAgentTestingLog(): boolean {
  const didAutoPause =
    active && !settling && !capturePaused
      ? (() => {
          applyPoCapturePause(/* latchHalt */ true, { silent: true });
          return true;
        })()
      : false;

  if (!active && logEntries.length === 0) {
    const ok = downloadAgentTestingDump();
    logQaToolbarAction(
      ok
        ? didAutoPause
          ? "Save Log · paused + downloaded (latest dump)"
          : "Save Log · downloaded (latest dump)"
        : "Save Log · download failed",
      ok ? "ok" : "fail"
    );
    return ok;
  }
  const dump = saveDump("manual");
  if (!dump) {
    logQaToolbarAction("Save Log · download failed", "fail");
    return false;
  }
  const ok = downloadAgentTestingDump(dump);
  const rows = dump.log?.length ?? 0;
  logQaToolbarAction(
    ok
      ? didAutoPause
        ? `Save Log · paused + downloaded (${rows} rows)`
        : `Save Log · downloaded (${rows} rows)`
      : "Save Log · download failed",
    ok ? "ok" : "fail"
  );
  return ok;
}

/** Visible QA toolbar / lifecycle row — never silent. */
function logQaToolbarAction(
  label: string,
  outcome: "ok" | "soft-fail" | "fail" = "ok"
): void {
  const entry = {
    atMs: Date.now(),
    timeLabel: new Date().toLocaleTimeString("en-GB", { hour12: false }),
    label,
    outcome,
    kind: "system" as const,
  };
  if (active || settling) {
    pushLogEntry(entry);
    return;
  }
  try {
    appendQaDiagRing({ kind: "system", label, text: label });
  } catch {
    /* hang-safe */
  }
  try {
    console.info("[AGENT_TESTING]", label);
  } catch {
    /* ignore */
  }
}

/**
 * Quiet wipe of playback FAIL modal + QA transport blocks.
 * Session Reset / jump-to-start / forceClear — PO must not need Ack to Play again.
 */
function dismissStaleDiagForSession(source: string): void {
  try {
    clearStalePlaybackDiagnostic(source);
  } catch {
    /* hang-safe */
  }
  try {
    diagnosticBlocking = false;
  } catch {
    /* ignore */
  }
  try {
    clearFailHandoffFromSession();
    clearFailHandoff();
  } catch {
    /* hang-safe */
  }
  try {
    clearQaProgressFreeze();
  } catch {
    /* hang-safe */
  }
  try {
    syncDiagAckChrome();
  } catch {
    /* hang-safe */
  }
}

/** Public — cassette Jump to start / QA Reset clear Play blocks without Ack. */
export function clearQaPlaybackBlocksForReset(
  source = "qa-journey-reset"
): void {
  dismissStaleDiagForSession(
    source.startsWith("qa-") ? source : `qa-${source}`
  );
}

function beginFailHandoffFromOverlay(reason: string): void {
  setQaProgressFreeze(`fail-handoff:${reason}`);
  beginFailHandoff({
    reason,
    pause: (r) => {
      try {
        haltPlaybackForPoSignal(r);
      } catch {
        /* hang-safe */
      }
      if (!active || settling) return;
      if (!capturePaused) {
        pauseElapsedClock();
        capturePaused = true;
        sessionHadProgress = true;
      }
      setActivityPhase("paused", r);
      syncCaptureWatch();
      syncSessionChrome();
    },
    log: (label, outcome) => {
      pushLogEntry({
        atMs: Date.now(),
        timeLabel: new Date().toLocaleTimeString("en-GB", { hour12: false }),
        label,
        outcome: outcome ?? "fail",
        kind: "fail-handoff",
      });
    },
  });
  // Second belt — halt again after log so Play cannot sneak a frame.
  try {
    haltPlaybackForPoSignal(`fail-handoff-belt:${reason}`);
  } catch {
    /* hang-safe */
  }
}

/**
 * Agent takeover confirm → fresh CONTROL session (elapsed reset).
 * Old manual/observe elapsed must not continue under agent.
 */
function startFreshAgentInterventionSession(source: string): void {
  if (settling) abandonSettleForRearch();
  try {
    replaceQaDiagRing([]);
  } catch {
    /* ignore */
  }
  logEntries = [];
  timelineKeys = [];
  logDirty = false;
  sessionHadProgress = false;
  nest = Math.max(1, nest);
  sessionStartedAt = Date.now();
  lastStepAt = sessionStartedAt;
  resetElapsedClock(true);
  clearAgentTestingFinaleSeal();
  setSessionKind("agent");
  setAwaitingUserReply(false);
  clearMcpPending();
  signalMcpConnect();
  autoPausedForStalePresence = false;
  touchQaAgentPresence(source);
  armPresenceHeartbeatWithAutoPause();
  pushLogEntry({
    atMs: Date.now(),
    timeLabel: new Date().toLocaleTimeString("en-GB", { hour12: false }),
    label: `AGENT SESSION · start (elapsed reset) · ${source}`,
    outcome: "ok",
    kind: "system",
  });
  setActivityPhase(capturePaused ? "paused" : "running", "agent-session");
  setQaDiagSessionMeta({ sessionKind: "agent", awaitingReply: false });
  renderLog();
  refreshSitrepDom();
  syncSessionChrome();
  syncCaptureWatch();
}

function confirmAgentHandshake(source: string): boolean {
  if (!isFailHandoffPending()) {
    autoPausedForStalePresence = false;
    touchQaAgentPresence(source);
    return false;
  }
  // Soft touch must never steal PO MANUAL/OBSERVE into AGENT TESTING mid-Play.
  // Explicit agent APIs (start / confirmFailTakeover / consume / ack) still take over.
  const kind = getSessionKind();
  if (
    source === "touch" &&
    (kind === "manual" || kind === "observe")
  ) {
    autoPausedForStalePresence = false;
    touchQaAgentPresence(source);
    return false;
  }
  // Fresh agent session BEFORE confirm lines — Message/manual elapsed must not continue.
  startFreshAgentInterventionSession(`takeover:${source}`);
  const ok = confirmFailHandoffFromAgent(qaListenDeps(), source);
  if (ok) {
    // Unlock progress after confirm — freeze was only for "Handing off…".
    clearQaProgressFreeze();
    capturePaused = false;
    resumeElapsedClock();
    setActivityPhase("running", "fail-takeover-confirmed");
    syncCaptureWatch();
    syncSessionChrome();
  }
  return ok;
}

/** JUMP / diag paths outside overlay may call this. */
export function beginQaFailHandoff(reason: string): void {
  setQaProgressFreeze(`fail-handoff:${reason}`);
  if (!active || settling) {
    beginFailHandoff({
      reason,
      pause: (r) => {
        try {
          haltPlaybackForPoSignal(r);
        } catch {
          /* hang-safe */
        }
      },
      log: () => undefined,
    });
    try {
      haltPlaybackForPoSignal(`fail-handoff-belt:${reason}`);
    } catch {
      /* hang-safe */
    }
    return;
  }
  beginFailHandoffFromOverlay(reason);
}


/**
 * Clear final RESULT line for agents closing a session / self-test.
 * Lands even while paused. Call while overlay still active (before forceClear).
 * Withholds RESULT when a PO USER_MESSAGE latch is still open — never look like
 * a self-test answered / overshadowed a Message.
 */
export function appendAgentTestingSessionFinale(
  result: "pass" | "fail",
  summary?: string
): boolean {
  if (!active && !settling) return false;
  try {
    const pending = peekPoSignal();
    if (pending?.type === "user-message") {
      pushLogEntry({
        atMs: Date.now(),
        timeLabel: new Date().toLocaleTimeString("en-GB", { hour12: false }),
        label:
          "RESULT withheld — consume USER_MESSAGE latch first (Message stays open)",
        outcome: "soft-fail",
        kind: "system",
      });
      console.warn(
        "[AGENT_TESTING] RESULT withheld — USER_MESSAGE pending",
        pending.note
      );
      return false;
    }
  } catch {
    /* hang-safe */
  }
  // Cleanup first (quiet) — RESULT must be the last visible chat word.
  dismissStaleDiagForSession("session-finale");
  const clean =
    summary?.trim() ||
    (result === "pass" ? "all checks ok" : "one or more checks failed");
  pushLogEntry({
    atMs: Date.now(),
    timeLabel: new Date().toLocaleTimeString("en-GB", { hour12: false }),
    label: `RESULT · ${result.toUpperCase()} — ${clean}`,
    outcome: result === "pass" ? "pass" : "fail",
    kind: "system",
  });
  settleResult = result;
  setResultBadge(result);
  sealAgentTestingFinale();
  try {
    setTitle(
      result === "pass" ? "PASS — session finale" : "FAIL — session finale"
    );
  } catch {
    /* ignore */
  }
  return true;
}

/**
 * PO Alarm = sequence / expected-steps mismatch.
 * Observe → escalate to agent lock first (dual-role QA), then latch investigate prompt.
 * Stops progress (halt Play + pause capture).
 */
export function ringAgentTestingAlarm(note?: string): void {
  if (!active || settling) return;
  if (getSessionKind() === "observe") {
    escalateObserveToAgentSession("alarm");
  }
  if (getSessionKind() !== "agent") return;
  beginFailHandoffFromOverlay("po-alarm");
  // beginFailHandoff already halted Play + paused capture.
  const detail = note?.trim() ? ` — ${note.trim()}` : "";
  const signal = latchPoSignal({
    type: "alarm",
    code: "ALARM_SEQUENCE_MISMATCH",
    note: note?.trim() || ALARM_AGENT_PROMPT,
    sitrepLine: lastSitrepLine,
    timeline: timelineKeys,
  });
  pushLogEntry(
    buildLogEntryFromStep({
      kind: "alarm",
      outcome: "soft-fail",
      label: `ALARM · ALARM_SEQUENCE_MISMATCH${detail} · investigate · consume __studioConsumePoSignal()`,
      beatId: signal.beat ?? undefined,
    })
  );
  pushLogEntry({
    atMs: Date.now(),
    timeLabel: new Date().toLocaleTimeString("en-GB", { hour12: false }),
    label: `Agent prompt: ${ALARM_AGENT_PROMPT}`,
    outcome: "ok",
    kind: "agent-prompt",
  });
  setActivityPhase("paused", "alarm");
  syncCaptureWatch();
  syncSessionChrome();
  try {
    console.warn(
      "[AGENT_TESTING] sequence / expected-steps mismatch",
      "ALARM_SEQUENCE_MISMATCH",
      "→ window.__studioConsumePoSignal() (primary) · dump secondary",
      {
        sitrep: lastSitrepLine,
        beat: signal.beat,
        screen: signal.screen,
        counter: signal.counter,
        agentPrompt: ALARM_AGENT_PROMPT,
      }
    );
  } catch {
    /* ignore */
  }
  saveDump("alarm", {
    code: "ALARM_SEQUENCE_MISMATCH",
    poSignal: signal,
    agentPrompt: ALARM_AGENT_PROMPT,
  });
}

export function flagAgentTestingCursorWeird(note?: string): void {
  haltPlaybackForPoSignal("po-cursor");
  const detail = note?.trim() ? ` — ${note.trim()}` : "";
  const signal = latchPoSignal({
    type: "cursor",
    code: "CURSOR_WEIRD_FLAG",
    note,
    sitrepLine: lastSitrepLine,
    timeline: timelineKeys,
  });
  pushLogEntry(
    buildLogEntryFromStep({
      kind: "cursor",
      outcome: "soft-fail",
      label: `cursor issue detected · CURSOR_WEIRD_FLAG${detail} · consume __studioConsumePoSignal()`,
      beatId: signal.beat ?? undefined,
    })
  );
  try {
    console.warn(
      "[AGENT_TESTING] cursor issue detected",
      "CURSOR_WEIRD_FLAG",
      "→ window.__studioConsumePoSignal() (primary)",
      note ?? ""
    );
  } catch {
    /* ignore */
  }
  saveDump("cursor", { code: "CURSOR_WEIRD_FLAG", poSignal: signal });
}

export function flagAgentTestingScrollIssue(note?: string): void {
  haltPlaybackForPoSignal("po-scroll");
  const detail = note?.trim() ? ` — ${note.trim()}` : "";
  const snap = readScrollSnapshot();
  const snapLabel =
    snap.host != null
      ? ` · host=${snap.host} scrollTop=${snap.scrollTop ?? "?"}`
      : " · host=none";
  const signal = latchPoSignal({
    type: "scroll",
    code: "SCROLL_ISSUE_REPORTED",
    note,
    sitrepLine: lastSitrepLine,
    timeline: timelineKeys,
  });
  pushLogEntry(
    buildLogEntryFromStep({
      kind: "scroll",
      outcome: "soft-fail",
      label: `scroll issue detected · SCROLL_ISSUE_REPORTED${detail}${snapLabel} · consume __studioConsumePoSignal()`,
      beatId: signal.beat ?? undefined,
    })
  );
  try {
    playbackDiagScroll({
      detail: `SCROLL_ISSUE_REPORTED${detail}`,
      host: snap.host,
      beforeTop: snap.scrollTop,
      afterTop: snap.scrollTop,
      intoViewRequested: false,
      intoViewDone: false,
    });
  } catch {
    /* hang-safe */
  }
  try {
    console.warn(
      "[AGENT_TESTING] scroll issue detected",
      "SCROLL_ISSUE_REPORTED",
      "→ window.__studioConsumePoSignal() (primary)",
      snap,
      note ?? ""
    );
    console.warn("[PLAYBACK_DIAG]", "scroll", {
      code: "SCROLL_ISSUE_REPORTED",
      host: snap.host,
      scrollTop: snap.scrollTop,
      note: note ?? "",
    });
  } catch {
    /* ignore */
  }
  saveDump("scroll", { code: "SCROLL_ISSUE_REPORTED", poSignal: signal });
}

function maybeAutoFlagCursorIssue(): void {
  if (!active || settling) return;
  try {
    const state = getCursorDiagnosticState();
    const unexpected = state.unexpectedOnDwellCount ?? 0;
    if (unexpected > lastUnexpectedDwellCount) {
      lastUnexpectedDwellCount = unexpected;
      pushLogEntry(
        buildLogEntryFromStep({
          kind: "cursor",
          outcome: "soft-fail",
          label:
            "cursor issue detected · CURSOR_UNEXPECTED_DWELL · see __studioPlaybackDiag",
          beatId: state.lastCursorBeatId ?? undefined,
        })
      );
      try {
        console.warn(
          "[AGENT_TESTING] cursor issue detected",
          "CURSOR_UNEXPECTED_DWELL",
          state.lastSummary
        );
      } catch {
        /* ignore */
      }
    }
  } catch {
    /* hang-safe */
  }
}

/** Optional: amber-log known scrollIntoView / path-deviation diags (manual Scroll still required). */
function maybeAutoFlagScrollIssue(): void {
  if (!active || settling) return;
  try {
    const flashes = getRecentDiagnosticFlashes(6);
    for (let i = flashes.length - 1; i >= 0; i--) {
      const flash = flashes[i];
      const hay = `${flash.kind ?? ""} ${flash.failureStep ?? ""} ${flash.message}`;
      if (
        !/scroll-anomaly|scroll-path-deviation|scrollIntoView/i.test(hay)
      ) {
        continue;
      }
      const key = `flash:${flash.id}:${flash.failureStep ?? flash.kind ?? "scroll"}`;
      if (key === lastAutoScrollFlagKey) return;
      lastAutoScrollFlagKey = key;
      const code = /path-deviation/i.test(hay)
        ? "SCROLL_PATH_DEVIATION"
        : /scrollIntoView/i.test(hay)
          ? "SCROLL_INTO_VIEW_FAIL"
          : "SCROLL_ANOMALY";
      const snap = readScrollSnapshot();
      pushLogEntry(
        buildLogEntryFromStep({
          kind: "scroll",
          outcome: "soft-fail",
          label: `scroll issue detected · ${code} · see __studioPlaybackDiag`,
          beatId: flash.beatId,
        })
      );
      try {
        console.warn(
          "[AGENT_TESTING] scroll issue detected",
          code,
          snap,
          flash.message
        );
      } catch {
        /* ignore */
      }
      return;
    }

    const bundle = getPlaybackDiagBundle();
    const scrolls = bundle.events.filter((e) => e.kind === "scroll");
    for (let i = scrolls.length - 1; i >= 0; i--) {
      const ev = scrolls[i];
      const detail = ev.detail ?? "";
      const skipped =
        /scrollIntoView skipped/i.test(detail) ||
        (ev.scroll?.intoViewRequested === true &&
          ev.scroll?.intoViewDone === false &&
          /skipped|fail|no host/i.test(detail));
      if (!skipped) continue;
      const key = `diag:${ev.t}:${detail}`;
      if (key === lastAutoScrollFlagKey) return;
      lastAutoScrollFlagKey = key;
      pushLogEntry(
        buildLogEntryFromStep({
          kind: "scroll",
          outcome: "soft-fail",
          label:
            "scroll issue detected · SCROLL_INTO_VIEW_FAIL · see __studioPlaybackDiag",
          beatId: ev.beatId ?? undefined,
        })
      );
      try {
        console.warn(
          "[AGENT_TESTING] scroll issue detected",
          "SCROLL_INTO_VIEW_FAIL",
          detail
        );
      } catch {
        /* ignore */
      }
      return;
    }
  } catch {
    /* hang-safe */
  }
}

/** Hide/dismiss robo-cursor when sitrep clears or forceClear. */
function dismissRoboCursor(): void {
  try {
    removeDemoCursor({ immediate: true });
  } catch {
    /* never block overlay teardown */
  }
}

/** Exported for unit tests - live sitrep countdown copy. */
export function formatSitrepHint(
  secondsLeft: number,
  reload: boolean,
  result: AgentTestingOverlayResult = "neutral"
): string {
  const s = Math.max(0, secondsLeft);
  const flag =
    result === "pass" ? "PASS - " : result === "fail" ? "FAIL - " : "";
  return reload
    ? `${flag}Auto-closes in ${s}s (then reload)`
    : `${flag}Auto-closes in ${s}s`;
}

export function formatSitrepHeldHint(
  result: AgentTestingOverlayResult = "neutral"
): string {
  const flag =
    result === "pass" ? "PASS - " : result === "fail" ? "FAIL - " : "";
  return `${flag}Held open — Close when done`;
}

function readLiveAgentControlKind(): AgentControlKind | null {
  const isPlaying = readLiveJourneyIsPlaying();
  try {
    const sitrep = readAgentTestingSitrep();
    return deriveAgentControlKind({
      sessionKind: getSessionKind(),
      cjmOn: isCjmCassetteOn(sitrep.cjm),
      isPlaying,
    });
  } catch {
    return deriveAgentControlKind({
      sessionKind: getSessionKind(),
      cjmOn: false,
      isPlaying,
    });
  }
}

/** Exported for unit tests - sitrep title with PASS/FAIL flag. */
export function formatSitrepTitle(
  result: AgentTestingOverlayResult = "neutral"
): string {
  if (result === "pass") return "AGENT DONE - PASS";
  if (result === "fail") return "AGENT DONE - FAIL";
  return "AGENT DONE - SITREP";
}

export function clampPreArmMs(ms?: number): number {
  const n =
    typeof ms === "number" && Number.isFinite(ms) ? ms : DEFAULT_PREARM_MS;
  return Math.min(PREARM_MS_MAX, Math.max(PREARM_MS_MIN, Math.round(n)));
}

export function formatPreArmHint(secondsLeft: number): string {
  const s = Math.max(0, secondsLeft);
  return s <= 0 ? "Starting probe..." : `Preparing - starting in ${s}s`;
}

/** Live activity line — Preparing / Running / Waiting / Settling (PO mid-flight pulse). */
export type { AgentTestingActivityPhase } from "@/app/shell/agent-testing/agentTestingActivity";
export { formatActivityStatus } from "@/app/shell/agent-testing/agentTestingActivity";

let activityPhase: AgentTestingActivityPhase = "idle";
let activityDetail = "";

function refreshActivityDom(): void {
  if (!hasDomQuery()) return;
  const root = document.getElementById(ROOT_ID);
  const el = root?.querySelector<HTMLElement>(
    ".studio-agent-testing-overlay__activity"
  );
  if (!el || !root) return;
  const label = formatActivityStatus(
    activityPhase,
    activityDetail,
    getSessionKind()
  );
  el.textContent = label;
  el.dataset.phase = activityPhase;
  root.dataset.phase = activityPhase;
  const kind = getSessionKind();
  const live =
    activityPhase === "preparing" ||
    activityPhase === "running" ||
    activityPhase === "waiting" ||
    ((kind === "manual" || kind === "observe") &&
      activityPhase === "running" &&
      !capturePaused);
  el.dataset.live = live ? "true" : "false";
  const badge = root.querySelector<HTMLElement>(
    ".studio-agent-testing-overlay__badge"
  );
  if (badge) badge.dataset.live = live ? "true" : "false";
  const elapsed = root.querySelector<HTMLElement>(
    ".studio-agent-testing-overlay__elapsed"
  );
  if (elapsed) elapsed.dataset.live = live ? "true" : "false";
}

function setActivityPhase(
  phase: AgentTestingActivityPhase,
  detail?: string
): void {
  activityPhase = phase;
  activityDetail = detail?.trim() ?? "";
  refreshActivityDom();
  syncSessionChrome();
}

/** Capture is “in progress” when the session is actively appending (not paused/settling). */
/** Capture is “in progress” when session is active and not paused — ignore activityPhase
 * (idle/waiting must not drop page clicks). */
function isCaptureInProgress(): boolean {
  return isCaptureInProgressBridge({
    isActive: () => active,
    isSettling: () => settling,
    isCapturePaused: () => capturePaused,
  });
}

function captureWatchOpts() {
  return {
    isActive: () => active,
    isSettling: () => settling,
    isCapturePaused: () => capturePaused,
    getSessionKind,
    pushLogEntry,
  };
}

function unbindCaptureWatch(): void {
  unbindCaptureWatchBridge();
}

/** Page clicks + screen nav → short visible log lines while capturing. */
function syncCaptureWatch(): void {
  syncCaptureWatchBridge(captureWatchOpts());
}

function closeManualSession(reason: string): void {
  // Agent lock used to hide Close and no-op — left ghost AGENT TESTING + CONTROL.
  // Explicit Close / forceClear always wipe (PO: SoftClose/forceClear clear AGENT mode).
  if (isAgentLocked() && (active || settling)) {
    forceClearAgentTestingOverlay();
    return;
  }
  softCloseAgentTestingLogger(reason);
}

/** Instant clear of log / ring / timer — fresh session; capture stays OFF until CAPTURE/Resume. */
function resetManualSession(): void {
  if (!canUserDismissSession() && (active || settling)) return;
  if (!active) return;
  if (!logDirty) return;
  logQaToolbarAction("Reset · wipe log/ring/timer");
  // Stale FAIL modal must not keep blocking Play after Session reset.
  dismissStaleDiagForSession("qa-session-reset");
  try {
    clearPoSignal();
  } catch {
    /* hang-safe */
  }
  logEntries = [];
  timelineKeys = [];
  lastStepAt = 0;
  sessionHadProgress = false;
  logDirty = false;
  try {
    replaceQaDiagRing([]);
  } catch {
    /* ignore */
  }
  // HARD: Reset must NOT auto-start capture (PO). Play still auto-resumes Pause-only.
  pauseElapsedClock();
  capturePaused = true;
  resetElapsedClock(false);
  armElapsedTimer();
  pushLogEntry({
    atMs: Date.now(),
    timeLabel: new Date().toLocaleTimeString("en-GB", { hour12: false }),
    label: "Session reset · capture off",
    outcome: "ok",
    kind: "system",
  });
  // Reset line alone does not re-enable Reset.
  logDirty = false;
  renderTimeline();
  refreshSitrepDom();
  setActivityPhase("paused");
  syncCaptureWatch();
  syncSessionChrome();
}

function softShowOverlayPanel(root: HTMLElement | null): void {
  if (!root || typeof window === "undefined") return;
  const panel = root.querySelector<HTMLElement>(
    ".studio-agent-testing-overlay__panel"
  );
  if (!panel) return;
  try {
    animate(
      panel,
      { opacity: [0.88, 1], y: [8, 0] },
      { duration: 0.22, ...motionEaseInOutTransition }
    );
  } catch {
    /* hang-safe — CSS fallback still shows panel */
  }
}

function armSafetyTimer(): void {
  clearSafetyTimer();
  safetyTimer = setTimeout(() => {
    // Long REC / prove must not be force-killed at MAX_MS — re-arm instead.
    if (isRecordingActive() || isQaProveModeActive()) {
      try {
        logAgentTestingOverlay(
          "overlay safety timeout deferred — REC/prove still live"
        );
      } catch {
        /* hang-safe */
      }
      armSafetyTimer();
      return;
    }
    try {
      logAgentTestingOverlay("overlay auto-stop: safety timeout");
    } catch {
      /* ignore */
    }
    stopAgentTestingOverlay({ force: true, reload: false });
  }, MAX_MS);
}

function armIdleTimer(): void {
  clearIdleTimer();
  if (!active || settling) return;
  idleTimer = setTimeout(() => {
    if (!active || settling) return;
    // Journey/play smokes run minutes — never idle-kill an active MCP session.
    // Free-form QA logger stays open while the diag gate is open.
    // REC live / prove latch: ALWAYS CLEAR sessions must stay visible (code law).
    if (
      getMcpTestSession() ||
      isQaDiagLoggerMode() ||
      isLoggerStyleSession() ||
      isRecordingActive() ||
      isQaProveModeActive()
    ) {
      armIdleTimer();
      return;
    }
    try {
      logAgentTestingOverlay("overlay auto-stop: idle timeout");
    } catch {
      /* ignore */
    }
    // Collapse nest so abandoned touch()/helper arms always settle.
    nest = 1;
    stopAgentTestingOverlay({ reload: false });
  }, IDLE_MS);
}

function noteActivity(): void {
  if (!active || settling) return;
  armSafetyTimer();
  armIdleTimer();
  if (activityPhase === "idle" || activityPhase === "waiting") {
    setActivityPhase("running");
  }
}

function clampSettleMs(ms?: number): number {
  const n =
    typeof ms === "number" && Number.isFinite(ms) ? ms : DEFAULT_SETTLE_MS;
  return Math.min(SETTLE_MS_MAX, Math.max(SETTLE_MS_MIN, Math.round(n)));
}

function onBeforeUnload(): void {
  if (!active && !settling) return;
  nest = 0;
  active = false;
  settling = false;
  settleReload = false;
  settleResult = "neutral";
  clearSafetyTimer();
  clearIdleTimer();
  clearSettleTimer();
  clearEnsureClearTimer();
  clearElapsedTimer();
  clearPersist();
}

function onVisibilityChange(): void {
  if (typeof document === "undefined") return;
  if (document.visibilityState !== "visible") return;
  // Returning to a stuck tab: if still active, re-arm idle so abandon clears soon.
  if (active && !settling) {
    armIdleTimer();
  }
}

function bindBeforeUnload(): void {
  if (beforeUnloadBound || typeof window === "undefined") return;
  if (typeof window.addEventListener !== "function") return;
  window.addEventListener("beforeunload", onBeforeUnload);
  beforeUnloadBound = true;
}

function unbindBeforeUnload(): void {
  if (!beforeUnloadBound || typeof window === "undefined") return;
  if (typeof window.removeEventListener === "function") {
    window.removeEventListener("beforeunload", onBeforeUnload);
  }
  beforeUnloadBound = false;
}

function bindVisibility(): void {
  if (visibilityBound || typeof document === "undefined") return;
  if (typeof document.addEventListener !== "function") return;
  document.addEventListener("visibilitychange", onVisibilityChange);
  visibilityBound = true;
}

function unbindVisibility(): void {
  if (!visibilityBound || typeof document === "undefined") return;
  if (typeof document.removeEventListener === "function") {
    document.removeEventListener("visibilitychange", onVisibilityChange);
  }
  visibilityBound = false;
}

function hasDomQuery(): boolean {
  return (
    typeof document !== "undefined" &&
    typeof document.getElementById === "function" &&
    typeof document.querySelector === "function"
  );
}

function setHint(text: string): void {
  if (!hasDomQuery()) return;
  const el = document.querySelector<HTMLElement>(
    ".studio-agent-testing-overlay__hint-text"
  );
  if (el) {
    el.textContent = text;
    return;
  }
  const legacy = document.querySelector<HTMLElement>(
    ".studio-agent-testing-overlay__hint"
  );
  if (legacy) legacy.textContent = text;
}

function setKeepOpenVisible(show: boolean): void {
  if (!hasDomQuery()) return;
  const btn = document.querySelector<HTMLButtonElement>(
    ".studio-agent-testing-overlay__keep-open"
  );
  if (!btn) return;
  btn.hidden = !show;
}

/** Cancel Auto-closes countdown — PO keeps sitrep/log context. */
export function holdSettleOpen(reason = "keep-open"): boolean {
  if (!settling || settleHeld) {
    if (settleHeld) syncSessionChrome();
    return settleHeld;
  }
  settleHeld = true;
  settleReload = false;
  clearSettleTimer();
  clearEnsureClearTimer();
  setHint(formatSitrepHeldHint(settleResult));
  setKeepOpenVisible(false);
  // Status: Wrapping up… → Complete (PASS/FAIL when known).
  setActivityPhase(
    "settling",
    settleResult === "pass"
      ? "complete-pass"
      : settleResult === "fail"
        ? "complete-fail"
        : "complete"
  );
  try {
    logQaToolbarAction(`Keep open · ${reason}`);
  } catch {
    /* hang-safe */
  }
  if (hasDomQuery()) {
    const root = document.getElementById(ROOT_ID);
    if (root) root.dataset.settleHeld = "true";
  }
  // Keep open Complete must still allow Save Log dump (active=false while settling).
  syncSessionChrome();
  return true;
}

function renderHistory(): void {
  if (!hasDomQuery()) return;
  document
    .getElementById(ROOT_ID)
    ?.querySelector(".studio-agent-testing-overlay__history")
    ?.remove();
  clearHistoryPersist();
}

function syncDiagAckChrome(): void {
  if (!hasDomQuery()) return;
  const root = document.getElementById(ROOT_ID);
  const ack = root?.querySelector<HTMLButtonElement>(
    ".studio-agent-testing-overlay__diag-ack"
  );
  if (!ack) return;
  const pending =
    diagnosticBlocking ||
    peekPlaybackDiagnostic() != null ||
    getOpenDiagnosticFlash() != null;
  ack.hidden = !pending;
}

/** Ack from QA overlay — consume diagnostic latch + clear modal if any. */
export function acknowledgeQaPlaybackDiagnostic(): boolean {
  try {
    logQaToolbarAction("Ack diag · consume playback diagnostic");
  } catch {
    /* hang-safe */
  }
  let consumed = false;
  try {
    const result = consumePlaybackDiagnostic({
      dismiss: true,
      source: "qa-ack",
    });
    consumed = result.consumed;
  } catch {
    /* hang-safe */
  }
  diagnosticBlocking = false;
  try {
    clearStalePlaybackDiagnostic("qa-ack");
  } catch {
    /* hang-safe */
  }
  pushLogEntry(
    buildLogEntryFromStep({
      kind: "playback-diag",
      outcome: "ok",
      label: "playback-diag · Ack — diagnostic consumed",
    })
  );
  syncDiagAckChrome();
  syncSessionChrome();
  return consumed;
}

function setQaSessionLock(mode: AgentTestingSessionKind | null): void {
  if (typeof document === "undefined") return;
  const rootEl = document.documentElement;
  if (!rootEl?.dataset) return;
  if (mode === "agent" || mode === "manual" || mode === "observe") {
    rootEl.dataset.studioQaLock = mode;
  } else {
    delete rootEl.dataset.studioQaLock;
  }
}

/** Sync close / reset / capture / Save Log / MCP status / owner chrome. */
function syncSessionChrome(): void {
  if (!hasDomQuery()) return;
  const root = document.getElementById(ROOT_ID);
  if (!root) return;
  const kind = getSessionKind();
  root.dataset.owner = kind;
  root.dataset.kind = kind;
  root.dataset.capture = capturePaused ? "paused" : "on";
  setQaSessionLock(active || settling ? kind : null);
  syncClickGuard();
  syncDiagAckChrome();

  const locked = isAgentLocked() && (active || settling);
  const closeBtn = root.querySelector<HTMLButtonElement>(
    ".studio-agent-testing-overlay__close"
  );
  if (closeBtn) {
    // Always offer Close — agent wipe uses forceClear (no ghost CONTROL latch).
    closeBtn.hidden = false;
    closeBtn.disabled = false;
    closeBtn.title = locked
      ? "Close — wipe agent session (in-app latch, not Cursor MCP)"
      : "Close — stop capture";
  }
  const resetBtn = root.querySelector<HTMLButtonElement>(
    ".studio-agent-testing-overlay__reset"
  );
  if (resetBtn) {
    resetBtn.hidden = locked;
    const resetOk = !locked && active && !settling && logDirty;
    resetBtn.disabled = !resetOk;
    resetBtn.title = locked
      ? "Agent session locked"
      : !logDirty
        ? "Reset — available after new log events"
        : "Reset session — clear log, ring, and timer";
  }

  const captureBtn = root.querySelector<HTMLButtonElement>(
    ".studio-agent-testing-overlay__capture-toggle"
  );
  if (captureBtn) {
    const show = active && !settling;
    captureBtn.hidden = !show;
    captureBtn.disabled = !show;
    const cta = resolveCaptureToggleLabel({
      capturePaused,
      sessionHadProgress,
    });
    captureBtn.textContent = cta;
    if (cta === "Pause") {
      captureBtn.title =
        kind === "agent"
          ? "Pause — freeze clock + halt Play; type Message, then Resume"
          : "Pause — freeze clock + stop capture";
    } else if (cta === "Resume") {
      captureBtn.title =
        kind === "agent"
          ? "Resume capture (does not auto-Play — transport stays stopped)"
          : "Resume capture + clock";
    } else {
      captureBtn.title = "Start capture + clock";
    }
  }

  const elapsed = root.querySelector<HTMLElement>(
    ".studio-agent-testing-overlay__elapsed"
  );
  if (elapsed) {
    elapsed.dataset.live =
      active && !settling && !capturePaused ? "true" : "false";
    elapsed.title = capturePaused ? "Elapsed (paused)" : "Elapsed";
  }

  const saveBtn = root.querySelector<HTMLButtonElement>(
    ".studio-agent-testing-overlay__dump"
  );
  if (saveBtn) {
    // Snapshot while capturing, OR while Keep open holds Complete sitrep.
    // (enterSettle sets active=false + settling=true — do not disable dump then.)
    const enabled = (active && !settling) || settleHeld;
    saveBtn.disabled = !enabled;
    saveBtn.textContent = "Save Log";
    saveBtn.title = enabled
      ? settleHeld
        ? "Download lean dump JSON (Complete — Keep open)"
        : capturePaused
          ? "Download lean dump JSON (current session)"
          : "Snapshot dump while capturing (does not pause)"
      : "Open a QA session to save log";
  }

  const alarmBtn = root.querySelector<HTMLButtonElement>(
    ".studio-agent-testing-overlay__alarm"
  );
  if (alarmBtn) {
    // Observe: escalate + latch; agent: latch only. Manual: hidden.
    const alarmOk =
      (kind === "agent" || kind === "observe") && active && !settling;
    alarmBtn.hidden = !alarmOk;
    alarmBtn.disabled = !alarmOk;
    alarmBtn.title = alarmOk
      ? kind === "observe"
        ? "Escalate to agent + latch investigate prompt"
        : "Stop progress + latch investigate prompt for the agent"
      : "Alarm — observe or agent mode";
  }

  ensureMessageUnderLog(root);
  ensureOverlayChrome(root);
  refreshMcpStatusDom();
}

/**
 * MCP chrome (nav OBS/CTRL + panel line + viewport border) is live only when
 * session is active, gate open, and overlay panel actually shown — never ghost.
 */
function mcpChromeInput() {
  let gateOpen = false;
  try {
    gateOpen = isQaDiagGateOpen();
  } catch {
    gateOpen = false;
  }
  return {
    active,
    settling,
    sessionKind: getSessionKind(),
    awaitingReply: isAwaitingUserReply(),
    agentControlKind: readLiveAgentControlKind(),
    gateOpen,
    overlayDomVisible: isAgentTestingOverlayDomVisible(),
    rootId: ROOT_ID,
  };
}

function isMcpChromeLive(): boolean {
  const i = mcpChromeInput();
  return isMcpChromeLivePure(i);
}

function readLiveMcpStatus(): McpConnectionStatus {
  return deriveLiveMcpStatus(mcpChromeInput());
}

export function getAgentTestingMcpConnectionStatus(): McpConnectionStatus {
  return readLiveMcpStatus();
}

function clearNavMcpHint(): void {
  clearNavMcpHintDom();
}

function refreshMcpStatusDom(): void {
  if (!hasDomQuery()) return;
  const input = mcpChromeInput();
  const status = deriveLiveMcpStatus(input);
  paintMcpChromeDom(input, status);
  maybeLogMcpPhaseChange(qaListenDeps(), {
    phase: status.phase ?? "",
    label: status.label,
    lastLoggedPhase: lastLoggedMcpPhase,
    setLastLoggedPhase: (p) => {
      lastLoggedMcpPhase = p;
    },
  });
}

function qaListenDeps(): QaListenDeps {
  return {
    rootId: ROOT_ID,
    isActive: () => active,
    isSettling: () => settling,
    getCapturePaused: () => capturePaused,
    setCapturePaused: (v) => {
      capturePaused = v;
    },
    setSessionHadProgress: (v) => {
      sessionHadProgress = v;
    },
    getDiagnosticBlocking: () => diagnosticBlocking,
    setDiagnosticBlocking: (v) => {
      diagnosticBlocking = v;
      syncDiagAckChrome();
    },
    getLastSitrepLine: () => lastSitrepLine,
    getTimelineKeys: () => timelineKeys,
    pushLogEntry: (e) => pushLogEntry(e as AgentTestingLogEntry),
    pauseElapsedClock,
    armElapsedTimer,
    setActivityPhase: (phase, detail) => setActivityPhase(phase, detail),
    syncCaptureWatch,
    syncSessionChrome,
    getLastUserTypingLogAt: () => lastUserTypingLogAt,
    setLastUserTypingLogAt: (v) => {
      lastUserTypingLogAt = v;
    },
    getLastBlockedPlayLogAt: () => lastBlockedPlayLogAt,
    setLastBlockedPlayLogAt: (v) => {
      lastBlockedPlayLogAt = v;
    },
  };
}

/** PENDING timeout: auto-pause + log (user can Resume). */
function onMcpPendingTimeout(): void {
  if (!active || settling) {
    clearMcpPending();
    setAwaitingUserReply(false);
    setQaDiagSessionMeta({ awaitingReply: false });
    return;
  }
  setAwaitingUserReply(false);
  clearMcpPending();
  setQaDiagSessionMeta({ awaitingReply: false });
  if (!capturePaused) {
    pauseElapsedClock();
    capturePaused = true;
  }
  pushLogEntry({
    atMs: Date.now(),
    timeLabel: new Date().toLocaleTimeString("en-GB", { hour12: false }),
    label: `MCP pending timed out (${Math.round(getQaPendingTimeoutMs() / 1000)}s) — paused; resume when ready`,
    outcome: "ok",
    kind: "system",
  });
  setActivityPhase("paused");
  armElapsedTimer();
  syncCaptureWatch();
  syncSessionChrome();
}

function ensureMcpPendingHandler(): void {
  registerMcpPendingTimeoutHandler(onMcpPendingTimeout);
}

/** Agent/observe connect path — CONNECTING → CONNECTED flash → settle. */
function signalMcpConnect(): void {
  clearMcpConnectionError();
  beginMcpConnecting();
  ensureMcpPendingHandler();
  // Re-paint after flash windows
  if (typeof window !== "undefined" && typeof window.setTimeout === "function") {
    window.setTimeout(() => refreshMcpStatusDom(), 300);
    window.setTimeout(() => refreshMcpStatusDom(), 900);
  }
  refreshMcpStatusDom();
}

function ensureMessageUnderLog(root: HTMLElement): void {
  const panel = root.querySelector(".studio-agent-testing-overlay__panel");
  const log = root.querySelector(".studio-agent-testing-overlay__log");
  const note = root.querySelector(".studio-agent-testing-overlay__note");
  if (!panel || !log || !note) return;
  if (log.nextElementSibling !== note) {
    panel.appendChild(note);
  }
  const input = note.querySelector<HTMLInputElement>(
    ".studio-agent-testing-overlay__note-input"
  );
  const submit = note.querySelector<HTMLButtonElement>(
    ".studio-agent-testing-overlay__note-submit"
  );
  if (input) {
    input.placeholder = "Message";
    input.setAttribute("aria-label", "Message");
    input.name = "user-message";
  }
  if (submit) submit.textContent = "Send";
  bindMessageListen(qaListenDeps(), root);
}

/** Migrate older overlay DOM: Pause beside clock; Session + Touchpoints bars. */
function ensureOverlayChrome(root: HTMLElement): void {
  if (!root.querySelector(".studio-agent-testing-overlay__frame")) {
    const frame = document.createElement("div");
    frame.className = "studio-agent-testing-overlay__frame";
    frame.setAttribute("aria-hidden", "true");
    root.insertBefore(frame, root.firstChild);
  }
  try {
    if (isRecordingActive()) root.dataset.rec = "live";
    else delete root.dataset.rec;
  } catch {
    /* hang-safe */
  }
  const panel = root.querySelector(".studio-agent-testing-overlay__panel");
  const header = root.querySelector(".studio-agent-testing-overlay__header");
  if (!panel || !header) return;

  let clock = header.querySelector<HTMLElement>(
    ".studio-agent-testing-overlay__clock"
  );
  const elapsed = header.querySelector<HTMLElement>(
    ".studio-agent-testing-overlay__elapsed"
  );
  const pauseBtn = root.querySelector<HTMLButtonElement>(
    ".studio-agent-testing-overlay__capture-toggle"
  );
  if (elapsed && !clock) {
    clock = document.createElement("div");
    clock.className = "studio-agent-testing-overlay__clock";
    elapsed.replaceWith(clock);
    clock.appendChild(elapsed);
  }
  if (clock && pauseBtn && pauseBtn.parentElement !== clock) {
    clock.appendChild(pauseBtn);
  }

  // MCP status lives under Message/Send — strip header leftovers
  header.querySelectorAll(".studio-agent-testing-overlay__mcp").forEach((el) => {
    el.remove();
  });
  let toolbar = header.querySelector<HTMLElement>(
    ".studio-agent-testing-overlay__toolbar"
  );
  if (!toolbar) {
    toolbar = document.createElement("div");
    toolbar.className = "studio-agent-testing-overlay__toolbar";
    const clockEl = header.querySelector(".studio-agent-testing-overlay__clock");
    const actionsEl = header.querySelector(
      ".studio-agent-testing-overlay__header-actions"
    );
    if (clockEl && actionsEl) {
      clockEl.replaceWith(toolbar);
      toolbar.appendChild(clockEl);
      toolbar.appendChild(actionsEl);
    } else {
      header.appendChild(toolbar);
    }
  }

  // Migrate Dismiss → Close (X) + Reset
  const legacyDismiss = header.querySelector<HTMLButtonElement>(
    ".studio-agent-testing-overlay__dismiss"
  );
  legacyDismiss?.remove();
  let headerActions = header.querySelector<HTMLElement>(
    ".studio-agent-testing-overlay__header-actions"
  );
  if (!headerActions) {
    headerActions = document.createElement("div");
    headerActions.className = "studio-agent-testing-overlay__header-actions";
    header.appendChild(headerActions);
  }
  if (!headerActions.querySelector(".studio-agent-testing-overlay__reset")) {
    const reset = document.createElement("button");
    reset.type = "button";
    reset.className = "studio-agent-testing-overlay__reset";
    reset.textContent = "Reset";
    reset.title = "Reset session — clear log, ring, and timer";
    reset.addEventListener("click", () => resetManualSession());
    headerActions.appendChild(reset);
  }
  if (!headerActions.querySelector(".studio-agent-testing-overlay__close")) {
    const close = document.createElement("button");
    close.type = "button";
    close.className = "studio-agent-testing-overlay__close";
    close.setAttribute("aria-label", "Close");
    close.title = "Close — stop capture";
    close.textContent = "×";
    close.addEventListener("click", () => closeManualSession("close-x"));
    headerActions.appendChild(close);
  }
  // Save Log inline on the right of the control row
  const strayDump = panel.querySelector<HTMLButtonElement>(
    ".studio-agent-testing-overlay__actions .studio-agent-testing-overlay__dump"
  );
  let dumpBtn = headerActions.querySelector<HTMLButtonElement>(
    ".studio-agent-testing-overlay__dump"
  );
  if (!dumpBtn && strayDump) {
    headerActions.appendChild(strayDump);
    dumpBtn = strayDump;
  } else if (!dumpBtn) {
    dumpBtn = document.createElement("button");
    dumpBtn.type = "button";
    dumpBtn.className = "studio-agent-testing-overlay__dump";
    dumpBtn.textContent = "Save Log";
    dumpBtn.title =
      "Snapshot lean dump JSON (works while capturing — does not pause)";
    dumpBtn.addEventListener("click", () => {
      downloadCurrentAgentTestingLog();
    });
    headerActions.appendChild(dumpBtn);
  } else if (strayDump && strayDump !== dumpBtn) {
    strayDump.remove();
  }

  // Lean MCP status line under Message/Send (diode + muted label)
  let mcpStatus = panel.querySelector<HTMLElement>(
    ".studio-agent-testing-overlay__mcp-status"
  );
  if (!mcpStatus) {
    mcpStatus = document.createElement("div");
    mcpStatus.className = "studio-agent-testing-overlay__mcp-status";
    mcpStatus.hidden = true;
    mcpStatus.innerHTML =
      '<span class="studio-agent-testing-overlay__mcp-diode" data-phase="idle" hidden aria-hidden="true"></span>' +
      '<span class="studio-agent-testing-overlay__mcp" data-phase="idle" hidden></span>';
  } else {
    mcpStatus
      .querySelectorAll(".studio-agent-testing-overlay__mcp-mode")
      .forEach((el) => el.remove());
    if (!mcpStatus.querySelector(".studio-agent-testing-overlay__mcp")) {
      mcpStatus.innerHTML =
        '<span class="studio-agent-testing-overlay__mcp-diode" data-phase="idle" hidden aria-hidden="true"></span>' +
        '<span class="studio-agent-testing-overlay__mcp" data-phase="idle" hidden></span>';
    }
    if (!mcpStatus.querySelector(".studio-agent-testing-overlay__mcp-diode")) {
      const d = document.createElement("span");
      d.className = "studio-agent-testing-overlay__mcp-diode";
      d.setAttribute("aria-hidden", "true");
      d.hidden = true;
      mcpStatus.insertBefore(d, mcpStatus.firstChild);
    }
  }
  const note = panel.querySelector(".studio-agent-testing-overlay__note");
  if (note && mcpStatus.previousElementSibling !== note) {
    if (note.nextSibling) panel.insertBefore(mcpStatus, note.nextSibling);
    else panel.appendChild(mcpStatus);
  }

  if (!panel.querySelector(".studio-agent-testing-overlay__session")) {
    const session = document.createElement("div");
    session.className = "studio-agent-testing-overlay__session";
    session.setAttribute("aria-label", "Session context");
    session.innerHTML = `
      <p class="studio-agent-testing-overlay__bar-title">Session</p>
      <p class="studio-agent-testing-overlay__session-line">Session: Localhost:5173 - Checking…</p>
    `;
    const activity = panel.querySelector(
      ".studio-agent-testing-overlay__activity"
    );
    if (activity?.nextSibling) {
      panel.insertBefore(session, activity.nextSibling);
    } else {
      panel.appendChild(session);
    }
    panel.querySelector(".studio-agent-testing-overlay__sitrep")?.remove();
  }

  // Hint row: text + Keep open (sitrep auto-close)
  let hint = panel.querySelector<HTMLElement>(
    ".studio-agent-testing-overlay__hint"
  );
  if (!hint) {
    hint = document.createElement("p");
    hint.className = "studio-agent-testing-overlay__hint";
    const activity = panel.querySelector(
      ".studio-agent-testing-overlay__activity"
    );
    if (activity) panel.insertBefore(hint, activity);
    else panel.appendChild(hint);
  }
  if (!hint.querySelector(".studio-agent-testing-overlay__hint-text")) {
    const prior = (hint.textContent || "").trim();
    hint.textContent = "";
    const text = document.createElement("span");
    text.className = "studio-agent-testing-overlay__hint-text";
    text.textContent = prior || "Page visible — mid-flight QA below.";
    hint.appendChild(text);
  }
  if (!hint.querySelector(".studio-agent-testing-overlay__keep-open")) {
    const keep = document.createElement("button");
    keep.type = "button";
    keep.className = "studio-agent-testing-overlay__keep-open uxds-link";
    keep.hidden = true;
    keep.title = "Cancel auto-close — keep sitrep open";
    keep.textContent = "Keep open";
    keep.addEventListener("click", () => holdSettleOpen("click"));
    hint.appendChild(keep);
  }

  const actions = panel.querySelector(
    ".studio-agent-testing-overlay__actions"
  );
  if (
    actions &&
    !actions.querySelector(".studio-agent-testing-overlay__diag-ack")
  ) {
    const ack = document.createElement("button");
    ack.type = "button";
    ack.className = "studio-agent-testing-overlay__diag-ack";
    ack.hidden = true;
    ack.title = "Ack playback diagnostic — consume latch + clear";
    ack.textContent = "Ack diag";
    ack.addEventListener("click", () => acknowledgeQaPlaybackDiagnostic());
    actions.appendChild(ack);
  }

  let wrap = panel.querySelector<HTMLElement>(
    ".studio-agent-testing-overlay__timeline-wrap"
  );
  const timeline = panel.querySelector<HTMLElement>(
    ".studio-agent-testing-overlay__timeline"
  );
  if (timeline && !wrap) {
    wrap = document.createElement("div");
    wrap.className = "studio-agent-testing-overlay__timeline-wrap";
    wrap.hidden = timeline.hidden;
    const title = document.createElement("p");
    title.className = "studio-agent-testing-overlay__bar-title";
    title.textContent = "Touchpoints";
    timeline.replaceWith(wrap);
    wrap.appendChild(title);
    wrap.appendChild(timeline);
  }

  if (!panel.querySelector(".studio-agent-testing-overlay__diag-mirror-wrap")) {
    const diagWrap = document.createElement("div");
    diagWrap.className = "studio-agent-testing-overlay__diag-mirror-wrap";
    diagWrap.hidden = true;
    diagWrap.innerHTML =
      '<p class="studio-agent-testing-overlay__bar-title">PLAYBACK_DIAG</p>' +
      '<ol class="studio-agent-testing-overlay__diag-mirror" data-empty="true" aria-label="Recent playback diagnostics"></ol>';
    const after = wrap || panel.querySelector(".studio-agent-testing-overlay__session");
    if (after?.nextSibling) panel.insertBefore(diagWrap, after.nextSibling);
    else {
      const actions = panel.querySelector(
        ".studio-agent-testing-overlay__actions"
      );
      if (actions) panel.insertBefore(diagWrap, actions);
      else panel.appendChild(diagWrap);
    }
  }
}

/**
 * Pause / Resume capture.
 * ALL kinds: Pause hard-halts Play immediately + latches QA_PAUSE_HALT.
 * Resume re-enables capture only (does not auto-Play).
 */
function toggleCapturePause(): void {
  if (!active || settling) return;
  if (!capturePaused) {
    applyPoCapturePause(/* latchHalt */ true);
  } else {
    applyCaptureResume("po-resume");
  }
}

/** Shared pause path — PO Pause button latches; agent-leave does not. */
function applyPoCapturePause(
  latchHalt: boolean,
  options?: { silent?: boolean }
): void {
  if (!active || settling) return;
  try {
    haltPlaybackForPoSignal(latchHalt ? "po-pause" : "agent-leave");
  } catch {
    /* hang-safe */
  }
  if (!capturePaused) {
    pauseElapsedClock();
    capturePaused = true;
    sessionHadProgress = true;
  }
  if (!latchHalt) {
    // Agent leave: halt + pause only — leave Message latch free; caller logs.
    armElapsedTimer();
    setActivityPhase("paused", "agent-leave");
    syncCaptureWatch();
    syncSessionChrome();
    return;
  }
  try {
    latchPoSignal({
      type: "pause",
      code: "QA_PAUSE_HALT",
      note: "QA Pause — progress halted; consume before proceed",
      sitrepLine: lastSitrepLine,
      timeline: timelineKeys,
    });
  } catch {
    /* hang-safe */
  }
  if (!options?.silent) {
    const kind = getSessionKind();
    const label =
      kind === "agent" || kind === "observe"
        ? "QA · Pause (Play halted)"
        : sessionHadProgress
          ? "QA · Pause (Play halted)"
          : "QA · CAPTURE off";
    pushLogEntry({
      atMs: Date.now(),
      timeLabel: new Date().toLocaleTimeString("en-GB", { hour12: false }),
      label,
      outcome: "ok",
      kind: "system",
    });
  }
  armElapsedTimer();
  setActivityPhase("paused");
  syncCaptureWatch();
  syncSessionChrome();
}

function applyCaptureResume(source: string): void {
  if (!active || settling) return;
  const kind = getSessionKind();
  const label =
    kind === "agent" || kind === "observe"
      ? "QA · Resume (capture on)"
      : sessionHadProgress
        ? "QA · Resume (capture on)"
        : "QA · CAPTURE on";
  capturePaused = false;
  sessionHadProgress = true;
  resumeElapsedClock();
  try {
    clearFailHandoffFromSession();
    clearFailHandoff();
    clearQaProgressFreeze();
  } catch {
    /* hang-safe */
  }
  pushLogEntry({
    atMs: Date.now(),
    timeLabel: new Date().toLocaleTimeString("en-GB", { hour12: false }),
    label: source === "agent-return" ? `${label} · agent return` : label,
    outcome: "ok",
    kind: "system",
  });
  armElapsedTimer();
  setActivityPhase("running");
  syncCaptureWatch();
  syncSessionChrome();
}

/**
 * Play/SF gate helper — if the only block is Pause (not FAIL modal / freeze),
 * auto-resume capture. Returns true when a resume was applied.
 */
export function autoResumeCaptureForPlay(): boolean {
  if (!active || settling) return false;
  if (!capturePaused) return false;
  if (isDiagnosticOpenNow(qaListenDeps())) return false;
  if (isQaProgressFrozen()) return false;
  applyCaptureResume("auto-play");
  return true;
}

/**
 * Wire presence heartbeat: MCP chrome refresh + hard auto-pause on stale TTL.
 * Replaces onTick on every arm so HMR / re-entry cannot drop the guard rail.
 */
function armPresenceHeartbeatWithAutoPause(): void {
  armQaAgentPresenceHeartbeat((ageMs) => {
    try {
      refreshMcpStatusDom();
    } catch {
      /* hang-safe */
    }
    try {
      maybeAutoPauseOnStalePresence(ageMs);
    } catch {
      /* hang-safe */
    }
  });
}

/**
 * REC live XOR QA capture — pause QA capture + release page click guard so
 * product clicks reach the page and REC (observe logger may stay open).
 * Also paints orange viewport frame while REC is armed.
 */
function syncQaCaptureWithRecording(): void {
  const recLive = isRecordingActive();
  try {
    const root = document.getElementById(ROOT_ID);
    if (root) {
      if (recLive) root.dataset.rec = "live";
      else delete root.dataset.rec;
    }
  } catch {
    /* hang-safe */
  }
  // Agent REC demo: pin robo-cursor so PO sees clicks; unpin when REC ends if CJM off.
  try {
    if (recLive && getSessionKind() === "agent") {
      setDemoCursorJourneyMode(true, { parkAfterInteraction: false });
    } else if (!recLive) {
      const cjmOn =
        typeof location !== "undefined" &&
        new URLSearchParams(location.search).get("cjm") === "on";
      if (!cjmOn) setDemoCursorJourneyMode(false);
    }
  } catch {
    /* hang-safe */
  }
  if (!recLive) {
    recPausedQaCapture = false;
    syncClickGuard();
    return;
  }
  // Always free product clicks while REC is armed.
  syncClickGuard();
  if (!active || settling) return;
  if (capturePaused) {
    recPausedQaCapture = true;
    return;
  }
  // Pause capture only (do not halt Play / latch QA_PAUSE_HALT).
  pauseElapsedClock();
  capturePaused = true;
  sessionHadProgress = true;
  recPausedQaCapture = true;
  pushLogEntry({
    atMs: Date.now(),
    timeLabel: new Date().toLocaleTimeString("en-GB", { hour12: false }),
    label: "REC live · QA capture paused (product clicks free)",
    outcome: "ok",
    kind: "system",
  });
  setActivityPhase("paused", "rec-xor");
  syncCaptureWatch();
  syncSessionChrome();
}

function armRecordingXorWatch(): void {
  if (recordingSessionUnsub) return;
  try {
    recordingSessionUnsub = subscribeRecordingSession(() => {
      try {
        syncQaCaptureWithRecording();
      } catch {
        /* hang-safe */
      }
    });
  } catch {
    recordingSessionUnsub = null;
  }
  // Catch already-live REC (install after Start).
  try {
    syncQaCaptureWithRecording();
  } catch {
    /* hang-safe */
  }
}

function disarmRecordingXorWatch(): void {
  if (!recordingSessionUnsub) return;
  try {
    recordingSessionUnsub();
  } catch {
    /* hang-safe */
  }
  recordingSessionUnsub = null;
  recPausedQaCapture = false;
}

/**
 * HARD guard rail — stale presence (≥ QA_AGENT_AUTO_PAUSE_MS) pauses capture +
 * Play like leave, without clearing Last seen and without QA_PAUSE_HALT /
 * DIAGNOSTIC_ACK_STOP latch. Agents should still call pauseForAgentLeave.
 * Skipped while prove-mode latch is armed (`__studioRunFullPlayProve`).
 */
function maybeAutoPauseOnStalePresence(ageMs: number): void {
  if (isQaProveModeActive()) {
    autoPausedForStalePresence = false;
    // Keep presence fresh so ONLINE stays honest during long proves.
    touchQaAgentPresence("prove-mode");
    return;
  }
  if (!isQaAgentPresenceStaleForAutoPause(ageMs)) {
    autoPausedForStalePresence = false;
    return;
  }
  if (!active || settling) return;
  if (capturePaused) {
    // Still halt Play if transport somehow restarted while capture paused.
    if (!autoPausedForStalePresence) {
      autoPausedForStalePresence = true;
      try {
        haltPlaybackForPoSignal("agent-stale-auto");
      } catch {
        /* hang-safe */
      }
    }
    return;
  }
  autoPausedForStalePresence = true;
  // Keep lastSeenAt — paint Last seen (not OFFLINE wipe). No halt latch.
  applyPoCapturePause(/* latchHalt */ false);
  const ageSec = Math.round(ageMs / 1000);
  pushLogEntry({
    atMs: Date.now(),
    timeLabel: new Date().toLocaleTimeString("en-GB", { hour12: false }),
    label: `Agent stale · auto-pause · capture paused · Last seen ${ageSec}s ago`,
    outcome: "ok",
    kind: "system",
  });
  setActivityPhase("paused", "agent-stale-auto");
  syncSessionChrome();
}

/**
 * Agent disconnects from QA tool → pause session + presence OFFLINE.
 * Prefer explicit leave; stale heartbeat also auto-pauses as guard rail.
 */
export function pauseForAgentLeave(): AgentLeavePauseResult {
  clearQaAgentPresence();
  autoPausedForStalePresence = true;
  if (!active || settling) {
    return {
      ok: false,
      capturePaused,
      presenceOnline: false,
      reason: !active ? "overlay-inactive" : "settling",
    };
  }
  // Do not latch QA_PAUSE_HALT — leave Message latch free for PO while gone.
  applyPoCapturePause(/* latchHalt */ false);
  pushLogEntry({
    atMs: Date.now(),
    timeLabel: new Date().toLocaleTimeString("en-GB", { hour12: false }),
    label: "Agent leave · capture paused · presence OFFLINE",
    outcome: "ok",
    kind: "system",
  });
  setActivityPhase("paused", "agent-leave");
  syncSessionChrome();
  return {
    ok: true,
    capturePaused: true,
    presenceOnline: false,
    reason: "paused-for-leave",
  };
}

/**
 * Agent returns to QA → presence ONLINE, consume Message/latch, resume when safe.
 */
export function resumeForAgentReturn(): AgentReturnResumeResult {
  if (typeof window === "undefined") {
    return {
      ok: false,
      captureResumed: false,
      presenceOnline: false,
      consumedSignal: null,
      messagePendingWork: false,
      reason: "no-window",
    };
  }
  autoPausedForStalePresence = false;
  touchQaAgentPresence("agent-return");
  armPresenceHeartbeatWithAutoPause();

  // Hide offline resume card if still visible.
  try {
    const box = document
      .getElementById(ROOT_ID)
      ?.querySelector<HTMLTextAreaElement>(
        ".studio-agent-testing-overlay__resume-card"
      );
    if (box) box.style.display = "none";
  } catch {
    /* hang-safe */
  }

  const peeked = peekPoSignal();
  const consumedSignal = peeked ? consumePoSignalWithAck() : null;

  const messagePendingWork =
    consumedSignal?.type === "user-message" ||
    consumedSignal?.code === "USER_MESSAGE_RECEIVED";

  if (!active || settling) {
    return {
      ok: Boolean(consumedSignal) || peekQaAgentPresence().online,
      captureResumed: false,
      presenceOnline: true,
      consumedSignal,
      messagePendingWork: Boolean(messagePendingWork),
      reason: !active ? "overlay-inactive" : "settling",
    };
  }

  if (messagePendingWork) {
    // Message procedure: stay paused until agent handles note + Resume.
    if (!capturePaused) {
      applyPoCapturePause(/* latchHalt */ false);
    }
    pushLogEntry({
      atMs: Date.now(),
      timeLabel: new Date().toLocaleTimeString("en-GB", { hour12: false }),
      label:
        "Agent return · Message on arrival — handle note before continue (capture stays paused)",
      outcome: "ok",
      kind: "system",
    });
    setActivityPhase("paused", "agent-return-message");
    syncSessionChrome();
    return {
      ok: true,
      captureResumed: false,
      presenceOnline: true,
      consumedSignal,
      messagePendingWork: true,
      reason: "message-pending",
    };
  }

  const wasPaused = capturePaused;
  if (wasPaused) {
    applyCaptureResume("agent-return");
  } else {
    pushLogEntry({
      atMs: Date.now(),
      timeLabel: new Date().toLocaleTimeString("en-GB", { hour12: false }),
      label: "Agent return · presence ONLINE (capture already on)",
      outcome: "ok",
      kind: "system",
    });
    syncSessionChrome();
  }

  return {
    ok: true,
    captureResumed: wasPaused && !capturePaused,
    presenceOnline: true,
    consumedSignal,
    messagePendingWork: false,
    reason: consumedSignal ? "resumed-after-latch" : "resumed",
  };
}

/** Consume latch + Message RTT / fail-handoff confirm (shared by API + return). */
function consumePoSignalWithAck(): AgentTestingPoSignal | null {
  const signal = consumePoSignal();
  if (signal) {
    confirmAgentHandshake(`consume:${signal.code}`);
    if (
      signal.type === "user-message" ||
      signal.code === "USER_MESSAGE_RECEIVED"
    ) {
      const rtt = noteQaMessageConsumed();
      touchQaAgentPresence("message-consumed");
      pushLogEntry({
        atMs: Date.now(),
        timeLabel: new Date().toLocaleTimeString("en-GB", {
          hour12: false,
        }),
        label:
          rtt != null
            ? `Message consumed · RTT ${rtt}ms`
            : "Message consumed · agent ack",
        outcome: "ok",
        kind: "system",
      });
    }
  }
  return signal;
}

function ensureRoot(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  if (typeof document.getElementById !== "function") return null;
  let root = document.getElementById(ROOT_ID);
  if (root) {
    syncAgentTestingNavClearance(ROOT_ID, root);
    ensureMessageUnderLog(root);
    ensureOverlayChrome(root);
    return root;
  }
  root = document.createElement("div");
  root.id = ROOT_ID;
  root.className = "studio-agent-testing-overlay";
  root.setAttribute("aria-live", "polite");
  root.innerHTML = `
    <div class="studio-agent-testing-overlay__frame" aria-hidden="true"></div>
    <div class="studio-agent-testing-overlay__capture" aria-hidden="true"></div>
    <div class="studio-agent-testing-overlay__panel" role="status">
      <div class="studio-agent-testing-overlay__header">
        <p class="studio-agent-testing-overlay__badge" hidden></p>
        <p class="studio-agent-testing-overlay__title">${DEFAULT_TITLE}</p>
        <div class="studio-agent-testing-overlay__toolbar">
          <div class="studio-agent-testing-overlay__clock">
            <span class="studio-agent-testing-overlay__elapsed" title="Elapsed">0:00</span>
            <button type="button" class="studio-agent-testing-overlay__capture-toggle" hidden title="Start capture">CAPTURE</button>
          </div>
          <div class="studio-agent-testing-overlay__header-actions">
            <button type="button" class="studio-agent-testing-overlay__reset" title="Reset session — clear log, ring, and timer" disabled>Reset</button>
            <button type="button" class="studio-agent-testing-overlay__close" title="Close — stop capture" aria-label="Close">×</button>
            <button type="button" class="studio-agent-testing-overlay__dump" title="Download lean dump JSON when paused or idle">Save Log</button>
          </div>
        </div>
      </div>
      <p class="studio-agent-testing-overlay__hint">
        <span class="studio-agent-testing-overlay__hint-text">Page visible — mid-flight QA below.</span>
        <button type="button" class="studio-agent-testing-overlay__keep-open uxds-link" hidden title="Cancel auto-close — keep sitrep open">Keep open</button>
      </p>
      <p class="studio-agent-testing-overlay__activity" data-phase="idle" data-live="false">Idle</p>
      <div class="studio-agent-testing-overlay__session" aria-label="Session context">
        <p class="studio-agent-testing-overlay__bar-title">Session</p>
        <p class="studio-agent-testing-overlay__session-line">Session: Localhost:5173 - Checking…</p>
      </div>
      <div class="studio-agent-testing-overlay__timeline-wrap" hidden>
        <p class="studio-agent-testing-overlay__bar-title">Touchpoints</p>
        <div class="studio-agent-testing-overlay__timeline" aria-label="Touchpoint progress"></div>
      </div>
      <div class="studio-agent-testing-overlay__diag-mirror-wrap" hidden>
        <p class="studio-agent-testing-overlay__bar-title">PLAYBACK_DIAG</p>
        <ol class="studio-agent-testing-overlay__diag-mirror" data-empty="true" aria-label="Recent playback diagnostics"></ol>
      </div>
      <div class="studio-agent-testing-overlay__actions">
        <button type="button" class="studio-agent-testing-overlay__alarm" hidden title="Alarm — observe or agent">Alarm</button>
        <button type="button" class="studio-agent-testing-overlay__cursor-flag" title="Flag cursor weird — latches live PO signal">Cursor</button>
        <button type="button" class="studio-agent-testing-overlay__scroll-flag" title="Flag scroll problem — latches live PO signal">Scroll</button>
        <button type="button" class="studio-agent-testing-overlay__diag-ack" hidden title="Ack playback diagnostic — consume latch + clear">Ack diag</button>
      </div>
      <ul class="studio-agent-testing-overlay__log" data-empty="true"></ul>
      <form class="studio-agent-testing-overlay__note" autocomplete="off">
        <input type="text" class="studio-agent-testing-overlay__note-input" name="user-message" maxlength="280" placeholder="Message" aria-label="Message" />
        <button type="submit" class="studio-agent-testing-overlay__note-submit">Send</button>
      </form>
      <div class="studio-agent-testing-overlay__mcp-status" hidden>
        <span class="studio-agent-testing-overlay__mcp-diode" data-phase="idle" hidden aria-hidden="true"></span>
        <span class="studio-agent-testing-overlay__mcp" data-phase="idle" hidden></span>
      </div>
    </div>
  `;
  const closeBtn = root.querySelector<HTMLButtonElement>(
    ".studio-agent-testing-overlay__close"
  );
  closeBtn?.addEventListener("click", () => closeManualSession("close-x"));
  root
    .querySelector<HTMLButtonElement>(".studio-agent-testing-overlay__keep-open")
    ?.addEventListener("click", () => {
      holdSettleOpen("click");
    });
  root
    .querySelector<HTMLButtonElement>(".studio-agent-testing-overlay__diag-ack")
    ?.addEventListener("click", () => {
      acknowledgeQaPlaybackDiagnostic();
    });
  root
    .querySelector<HTMLButtonElement>(".studio-agent-testing-overlay__reset")
    ?.addEventListener("click", () => resetManualSession());
  root
    .querySelector<HTMLButtonElement>(
      ".studio-agent-testing-overlay__capture-toggle"
    )
    ?.addEventListener("click", () => {
      toggleCapturePause();
    });
  const noteForm = root.querySelector<HTMLFormElement>(
    ".studio-agent-testing-overlay__note"
  );
  noteForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const input = root.querySelector<HTMLInputElement>(
      ".studio-agent-testing-overlay__note-input"
    );
    const text = input?.value?.trim() ?? "";
    if (!text) return;
    appendAgentTestingUserMessage(text);
    if (input) input.value = "";
  });
  root
    .querySelector<HTMLButtonElement>(".studio-agent-testing-overlay__alarm")
    ?.addEventListener("click", () => {
      ringAgentTestingAlarm();
    });
  root
    .querySelector<HTMLButtonElement>(
      ".studio-agent-testing-overlay__cursor-flag"
    )
    ?.addEventListener("click", () => {
      flagAgentTestingCursorWeird();
    });
  root
    .querySelector<HTMLButtonElement>(
      ".studio-agent-testing-overlay__scroll-flag"
    )
    ?.addEventListener("click", () => {
      flagAgentTestingScrollIssue();
    });
  root
    .querySelector<HTMLButtonElement>(".studio-agent-testing-overlay__dump")
    ?.addEventListener("click", () => {
      downloadCurrentAgentTestingLog();
    });
  // Last child of body - paint above #root concept lightboxes.
  (document.body ?? document.documentElement).appendChild(root);
  bindAgentTestingNavClearance(ROOT_ID);
  syncAgentTestingNavClearance(ROOT_ID, root);
  return root;
}

function pushLogEntry(entry: AgentTestingLogEntry): void {
  if (!active && !settling) return;
  // After RESULT finale — no clear-stale / playback-diag chat noise.
  if (
    isAgentTestingFinaleSealed() &&
    entry.kind === "playback-diag" &&
    !/RESULT ·/.test(entry.label)
  ) {
    return;
  }
  // Manual pause: skip auto product/control-room events; user-message + system still land.
  if (
    capturePaused &&
    entry.kind !== "user-message" &&
    entry.kind !== "po-note" &&
    entry.kind !== "system" &&
    entry.kind !== "agent-prompt" &&
    entry.kind !== "observe-escalate" &&
    entry.kind !== "alarm" &&
    entry.kind !== "playback-diag" &&
    entry.kind !== "fail-handoff"
  ) {
    return;
  }

  // Full detail always rings; warm-up spam collapses to one visible "Initializing…"
  const warmNoise =
    entry.kind === "init" ||
    (activityPhase === "preparing" &&
      entry.kind !== "alarm" &&
      entry.kind !== "user-message" &&
      entry.kind !== "system") ||
    /^pre-arm:/i.test(entry.label);
  const ringEntry = entry;
  appendQaDiagRing({
    kind: ringEntry.kind,
    text: ringEntry.label,
    label: ringEntry.label,
    atMs: ringEntry.atMs,
    beatId: ringEntry.beatId,
    detail: [
      ringEntry.action,
      ringEntry.selector,
      ringEntry.chain,
      ringEntry.surface,
      ringEntry.dataStudioAction,
    ]
      .filter(Boolean)
      .join(" · "),
  });

  let visible = entry;
  if (warmNoise) {
    const existingInit = logEntries.find((e) => e.kind === "init");
    if (existingInit) {
      existingInit.count = (existingInit.count ?? 1) + 1;
      existingInit.atMs = entry.atMs;
      existingInit.timeLabel = entry.timeLabel;
      existingInit.label = "Initializing…";
      scheduleLogDomFlush();
      if (active) noteActivity();
      return;
    }
    visible = {
      ...entry,
      kind: "init",
      label: "Initializing…",
      outcome: "ok",
      count: 1,
    };
  }

  const coalesced = coalesceLogEntry(logEntries[logEntries.length - 1], visible);
  if (coalesced) {
    logEntries[logEntries.length - 1] = coalesced;
  } else {
    const withDuration =
      visible.durationMs == null && lastStepAt > 0
        ? {
            ...visible,
            durationMs: clampStepDurationMs(visible.atMs - lastStepAt),
          }
        : visible.durationMs != null
          ? {
              ...visible,
              durationMs: clampStepDurationMs(visible.durationMs),
            }
          : visible;
    logEntries.push(withDuration);
    lastStepAt = visible.atMs;
  }
  if (logEntries.length > LOG_LIMIT) {
    logEntries = logEntries.slice(-LOG_LIMIT);
  }
  if (!visible.label.startsWith("Session reset")) {
    logDirty = true;
    if (
      visible.kind === "click" ||
      visible.kind === "nav" ||
      visible.kind === "alarm" ||
      (!capturePaused && visible.kind !== "system")
    ) {
      sessionHadProgress = true;
    }
  }
  if (visible.touchpointKey) {
    markAgentTestingTimeline(visible.touchpointKey, visible.outcome);
  }
  if (active && !settling) {
    const snippet = (visible.label || visible.kind || "").trim().slice(0, 48);
    if (capturePaused) {
      setActivityPhase("paused", snippet || "paused");
    } else if (activityPhase !== "preparing") {
      setActivityPhase("running", snippet || undefined);
    }
  }
  scheduleLogDomFlush();
  // Auto-pause must not extend idle — otherwise stale@8s fights IDLE_MS abandon.
  if (active && !/^Agent stale · auto-pause/i.test(visible.label || "")) {
    noteActivity();
  }
}

/** One rAF flush for log list + sitrep — avoids N full rebuilds per diag burst. */
function scheduleLogDomFlush(): void {
  if (logDomFlushRaf) return;
  const schedule =
    typeof requestAnimationFrame === "function"
      ? requestAnimationFrame
      : (cb: FrameRequestCallback) =>
          setTimeout(() => cb(Date.now()), 16) as unknown as number;
  logDomFlushRaf = schedule(() => {
    logDomFlushRaf = 0;
    renderLog();
    refreshSitrepDom();
  });
}

function flushLogDomNow(): void {
  if (logDomFlushRaf) {
    if (typeof cancelAnimationFrame === "function") {
      cancelAnimationFrame(logDomFlushRaf);
    } else {
      clearTimeout(logDomFlushRaf as unknown as ReturnType<typeof setTimeout>);
    }
    logDomFlushRaf = 0;
  }
  renderLog();
  refreshSitrepDom();
}

function renderLog(): void {
  if (!hasDomQuery()) return;
  const root = document.getElementById(ROOT_ID);
  const list = root?.querySelector<HTMLUListElement>(
    ".studio-agent-testing-overlay__log"
  );
  if (!list) return;
  list.replaceChildren();
  if (logEntries.length === 0) {
    list.dataset.empty = "true";
    const empty = document.createElement("li");
    empty.className = "studio-agent-testing-overlay__log-empty";
    empty.textContent = "No events yet";
    list.appendChild(empty);
    return;
  }
  delete list.dataset.empty;
  for (const entry of logEntries) {
    const li = document.createElement("li");
    li.dataset.outcome = entry.outcome;
    li.dataset.kind = entry.kind;
    const time = document.createElement("span");
    time.className = "studio-agent-testing-overlay__log-time";
    time.textContent = entry.timeLabel;
    const body = document.createElement("span");
    body.className = "studio-agent-testing-overlay__log-body";
    const count =
      entry.count && entry.count > 1 ? ` ×${entry.count}` : "";
    const dur =
      entry.durationMs != null && entry.durationMs > 0
        ? ` (${Math.round(entry.durationMs)}ms)`
        : "";
    const full = formatLogRowText(entry);
    const withoutTime = full.startsWith(entry.timeLabel)
      ? full.slice(entry.timeLabel.length).trimStart()
      : `${entry.label}${count}${dur}`;
    body.textContent = withoutTime;
    li.append(time, document.createTextNode(" "), body);
    list.appendChild(li);
  }
  list.scrollTop = list.scrollHeight; // PRODUCT UI chrome — overlay sitrep list (not journey camera SSoT)
}

function setTitle(title: string): void {
  if (!hasDomQuery()) return;
  const el = document.querySelector<HTMLElement>(
    ".studio-agent-testing-overlay__title"
  );
  if (el) el.textContent = title;
}

function setResultBadge(result: AgentTestingOverlayResult): void {
  if (!hasDomQuery()) return;
  const root = document.getElementById(ROOT_ID);
  if (root) {
    if (result === "neutral") delete root.dataset.result;
    else root.dataset.result = result;
  }
  const badge = document.querySelector<HTMLElement>(
    ".studio-agent-testing-overlay__badge"
  );
  if (!badge) return;
  if (result === "pass") {
    badge.hidden = false;
    badge.textContent = "PASS";
    badge.dataset.result = "pass";
  } else if (result === "fail") {
    badge.hidden = false;
    badge.textContent = "FAIL";
    badge.dataset.result = "fail";
  } else {
    badge.hidden = true;
    badge.textContent = "";
    delete badge.dataset.result;
  }
}

/** Hang-safe — Vitest/jsdom stubs may omit `documentElement`. */
function setAgentTestingHtmlFlag(on: boolean): void {
  if (typeof document === "undefined") return;
  const rootEl = document.documentElement;
  if (!rootEl?.dataset) return;
  if (on) rootEl.dataset.studioAgentTesting = "true";
  else delete rootEl.dataset.studioAgentTesting;
}

/**
 * Page click guard XOR — agent mid-flight blocks product clicks; observe/manual
 * and paused capture do not. REC live always releases the guard so product
 * clicks reach both the page and REC capture (QA must not steal/block).
 */
function syncClickGuard(): void {
  const block =
    active &&
    !settling &&
    !capturePaused &&
    shouldBlockPageClicks() &&
    !isRecordingActive();
  setAgentTestingHtmlFlag(block);
}

function releaseClickGuard(): void {
  setAgentTestingHtmlFlag(false);
}

/** Hide flags only - keep node (active session). */
function hideOverlayDom(): void {
  if (typeof document === "undefined") return;
  if (typeof document.getElementById !== "function") return;
  const root = document.getElementById(ROOT_ID);
  if (root) {
    root.dataset.active = "false";
    root.dataset.settling = "false";
    delete root.dataset.result;
    delete root.dataset.owner;
    delete root.dataset.capture;
    root.querySelector(".studio-agent-testing-overlay__history")?.remove();
  }
  setAgentTestingHtmlFlag(false);
  setQaSessionLock(null);
}

/** Hard-remove overlay root from the document (post-settle / forceClear). */
function removeOverlayDom(): void {
  if (typeof document === "undefined") return;
  if (typeof document.getElementById !== "function") return;
  document.getElementById(ROOT_ID)?.remove();
  setAgentTestingHtmlFlag(false);
  setQaSessionLock(null);
}

function teardownDom(hard = false): void {
  activityPhase = "idle";
  activityDetail = "";
  if (hard) removeOverlayDom();
  else hideOverlayDom();
}

/** Hard stop — at most one reload per window (Chrome hang / reload-storm class). */
let lastReloadScheduledAt = 0;
const RELOAD_STORM_COOLDOWN_MS = 4000;

function cancelPendingReload(): void {
  reloadPending = false;
  if (reloadTimer != null) {
    clearTimeout(reloadTimer);
    reloadTimer = null;
  }
  // Cleared path may schedule a fresh intentional reload later.
  lastReloadScheduledAt = 0;
}

function scheduleReload(delayMs = 120): void {
  if (reloadPending || typeof window === "undefined") return;
  const now = Date.now();
  // Refuse stacked reload storms (agent loops + mid-settle races).
  if (
    lastReloadScheduledAt > 0 &&
    now - lastReloadScheduledAt < RELOAD_STORM_COOLDOWN_MS
  ) {
    return;
  }
  reloadPending = true;
  lastReloadScheduledAt = now;
  const resetToHub = settleResetToHub;
  const resetToJourneyStart = settleResetToJourneyStart;
  // Defer so MCP evaluate_script can return the run result before navigation.
  // forceClear / mid-settle re-arm must cancel this — never leave a stray reload.
  reloadTimer = window.setTimeout(() => {
    reloadTimer = null;
    if (!reloadPending) return;
    reloadPending = false;
    try {
      resetStudioAfterAgentTest({ resetToJourneyStart, resetToHub });
    } catch {
      /* ignore */
    }
    window.location.reload();
  }, delayMs);
}

function safeResetStudio(
  resetToHub = settleResetToHub,
  resetToJourneyStart = settleResetToJourneyStart
): void {
  try {
    resetStudioAfterAgentTest({ resetToJourneyStart, resetToHub });
  } catch {
    /* never leave overlay stuck because URL reset threw */
  }
}

function finishSettle(): void {
  settling = false;
  settleHeld = false;
  settleResult = "neutral";
  clearSettleTimer();
  clearEnsureClearTimer();
  setKeepOpenVisible(false);
  dismissRoboCursor();
  // Hard-remove so no stale panel remains after sitrep.
  teardownDom(true);
  safeResetStudio();
  unbindBeforeUnload();
  unbindVisibility();
  if (settleReload) {
    settleReload = false;
    scheduleReload(120);
  } else {
    settleResetToHub = false;
    settleResetToJourneyStart = false;
  }
}

function cancelSettle(instantReload?: boolean): void {
  const wantReload = settleReload || !!instantReload;
  settleReload = false;
  settling = false;
  settleHeld = false;
  settleResult = "neutral";
  clearSettleTimer();
  clearEnsureClearTimer();
  setKeepOpenVisible(false);
  dismissRoboCursor();
  teardownDom(true);
  if (wantReload) scheduleReload(120);
  else {
    safeResetStudio();
    settleResetToHub = false;
    settleResetToJourneyStart = false;
  }
}

/**
 * Abandon DONE/SITREP to re-arm a new session - never fire a deferred reload
 * from the previous stop({ reload: true }). That race left PO with "no overlay"
 * after a mid-settle start/touch (page reloaded / panel stayed display:none).
 */
function abandonSettleForRearch(): void {
  settleReload = false;
  settleResetToHub = false;
  settleResetToJourneyStart = false;
  settling = false;
  settleHeld = false;
  settleResult = "neutral";
  clearSettleTimer();
  clearEnsureClearTimer();
  setKeepOpenVisible(false);
  cancelPendingReload();
  dismissRoboCursor();
  // Soft hide - start() will re-arm the same root.
  teardownDom(false);
}

function latchSettleResetFlags(options?: StopAgentTestingOverlayOptions): void {
  settleResetToJourneyStart = !!options?.resetToJourneyStart;
  settleResetToHub =
    !settleResetToJourneyStart && !!options?.resetToHub;
}

function enterSettle(options?: StopAgentTestingOverlayOptions): void {
  const settleMs = clampSettleMs(options?.settleMs);
  settleReload = !!options?.reload;
  latchSettleResetFlags(options);
  settleHeld = false;
  settleResult =
    options?.result === "pass" || options?.result === "fail"
      ? options.result
      : "neutral";
  settling = true;
  unbindCaptureWatch();
  syncSessionChrome();
  active = false;
  clearSafetyTimer();
  clearIdleTimer();
  clearEnsureClearTimer();
  clearPersist();
  const root = ensureRoot();
  if (root) {
    root.dataset.active = "false";
    root.dataset.settling = "true";
    delete root.dataset.settleHeld;
  }
  // Release pointer block so PO can use the page while reading sitrep.
  releaseClickGuard();
  // Strip ephemeral; stay on page unless resetToHub (reload re-asserts URL).
  safeResetStudio();
  setTitle(formatSitrepTitle(settleResult));
  setResultBadge(settleResult);
  setActivityPhase("settling", settleResult === "neutral" ? undefined : settleResult);
  clearElapsedTimer();
  pauseElapsedClock();
  setElapsedLabel(formatElapsed(getElapsedMs()));
  refreshSitrepDom();
  if (settleResult === "fail") {
    saveDump("fail");
  }
  consoleSeparator("END", `${sessionTitle} · ${settleResult}`);
  const endsAt = Date.now() + settleMs;
  const tickHint = () => {
    if (settleHeld) return;
    const left = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
    setHint(formatSitrepHint(left, settleReload, settleResult));
  };
  tickHint();
  setKeepOpenVisible(true);
  renderLog();
  renderHistory();
  clearSettleTimer();
  settleCountdownTimer = setInterval(tickHint, SITREP_COUNTDOWN_TICK_MS);
  settleTimer = setTimeout(() => {
    if (settleHeld) return;
    finishSettle();
  }, settleMs);
  // Failsafe: if settle somehow stalls, hard-clear after settle + 1s.
  // Skip when PO held sitrep open.
  ensureClearTimer = setTimeout(() => {
    if (settleHeld) return;
    if (settling || isAgentTestingOverlayDomPresent()) {
      forceClearAgentTestingOverlay();
    }
  }, settleMs + 1000);
}

export function startAgentTestingOverlay(title?: string): void {
  confirmAgentHandshake("start");
  // Fresh arm (idle / settle / Keep-open Complete) always wipes prior session —
  // agents must not inherit dirty log/ring/latches. Nested start (already active) keeps nest.
  const freshArm = !active || settling || settleHeld || nest === 0;
  if (settling) {
    abandonSettleForRearch();
  }
  if (freshArm) {
    try {
      // Quiet source (qa-*) — must NOT latch DIAGNOSTIC_ACK_STOP / abort Play.
      dismissStaleDiagForSession("qa-overlay-start");
    } catch {
      /* hang-safe */
    }
    try {
      clearFailHandoffFromSession();
    } catch {
      /* hang-safe */
    }
    wipeSessionContext();
    nest = 0;
    settleHeld = false;
    settleResult = "neutral";
  }
  nest += 1;
  active = true;
  settling = false;
  settleResult = "neutral";
  clearAgentTestingFinaleSeal();
  setSessionKind("agent");
  setAwaitingUserReply(false);
  clearMcpPending();
  sessionHadProgress = false;
  logDirty = false;
  capturePaused = false;
  clearEnsureClearTimer();
  signalMcpConnect();
  autoPausedForStalePresence = false;
  touchQaAgentPresence("overlay-start");
  armPresenceHeartbeatWithAutoPause();
  const resolved = resolveAgentTestingOverlayTitle(
    title ?? titleForSessionKind("agent")
  );
  sessionTitle = resolved;
  const root = ensureRoot();
  if (root) {
    root.dataset.active = "true";
    root.dataset.settling = "false";
    delete root.dataset.result;
    delete root.dataset.logger;
    delete root.dataset.settleHeld;
    root.querySelector(".studio-agent-testing-overlay__history")?.remove();
    syncAgentTestingNavClearance(ROOT_ID, root);
  }
  syncClickGuard();
  setTitle(resolved);
  setResultBadge("neutral");
  setHint(hintForSessionKind("agent"));
  setActivityPhase("running");
  openQaDiagGate({
    logger: false,
    reason: "overlay-start",
    sessionKind: "agent",
  });
  setQaDiagLoggerMode(false);
  setQaDiagSessionMeta({ sessionKind: "agent", awaitingReply: false });
  syncSessionChrome();
  writePersist(resolved);
  bindBeforeUnload();
  bindVisibility();
  noteActivity();
  if (nest === 1) {
    wipeSessionContext();
    lastUnexpectedDwellCount = 0;
    lastAutoScrollFlagKey = "";
    sessionStartedAt = Date.now();
    lastStepAt = sessionStartedAt;
    resetElapsedClock(true);
    renderTimeline();
    consoleSeparator("START", resolved);
    logAgentTestingOverlay("overlay start");
  } else if (!elapsedRunStartedAt && !capturePaused) {
    resumeElapsedClock();
  }
  armElapsedTimer();
  refreshSitrepDom();
  // DOM visibility gate - re-stamp if ensureRoot raced / orphan teardown.
  ensureAgentTestingOverlayDomArmed(resolved);
  syncSessionChrome();
  syncCaptureWatch();
  softShowOverlayPanel(root);
  armSessionOriginProbe();
}

/**
 * Show BR panel with "preparing..." countdown before probe steps.
 * Call after start(); returns when countdown ends.
 */
export async function preArmAgentTestingOverlay(options?: {
  preArmMs?: number;
  title?: string;
}): Promise<void> {
  const preArmMs = clampPreArmMs(options?.preArmMs);
  const title = resolveAgentTestingOverlayTitle(
    options?.title ?? PREPARE_TITLE
  );
  if (!active) {
    startAgentTestingOverlay(title);
  } else {
    sessionTitle = title;
    setTitle(title);
  }
  ensureAgentTestingOverlayDomArmed(title);
  setResultBadge("neutral");
  pushLogEntry({
    atMs: Date.now(),
    timeLabel: new Date().toLocaleTimeString("en-GB", { hour12: false }),
    label: "Initializing…",
    outcome: "ok",
    kind: "init",
  });
  const endsAt = Date.now() + preArmMs;
  while (Date.now() < endsAt) {
    if (!active || settling) return;
    const left = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
    setHint(formatPreArmHint(left));
    setActivityPhase(
      "preparing",
      left <= 0 ? "starting" : `${left}s`
    );
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 200);
    });
  }
  if (!active || settling) return;
  setHint("Page visible - clicks blocked. Mid-flight QA below.");
  setActivityPhase("running", "ready");
  appendQaDiagRing({ kind: "pre-arm-ready", text: "ready" });
}

/**
 * True when the BR panel is painted (data-active / settling) - not only the JS flag.
 */
export function isAgentTestingOverlayDomVisible(): boolean {
  if (typeof document === "undefined") return false;
  const root = document.getElementById(ROOT_ID);
  if (!root) return false;
  return root.dataset.active === "true" || root.dataset.settling === "true";
}

/**
 * Force the BR panel into the painted active state. Safe to call every probe start.
 */
export function ensureAgentTestingOverlayDomArmed(title?: string): boolean {
  if (typeof document === "undefined") return false;
  const resolved = resolveAgentTestingOverlayTitle(title ?? sessionTitle);
  const root = ensureRoot();
  if (!root) return false;
  active = true;
  settling = false;
  root.dataset.active = "true";
  root.dataset.settling = "false";
  syncClickGuard();
  setTitle(resolved);
  syncAgentTestingNavClearance(ROOT_ID, root);
  if (!root.querySelector(".studio-agent-testing-overlay__panel")) {
    // Corrupt orphan - rebuild.
    root.remove();
    const rebuilt = ensureRoot();
    if (!rebuilt) return false;
    rebuilt.dataset.active = "true";
    rebuilt.dataset.settling = "false";
    syncClickGuard();
    setTitle(resolved);
    syncAgentTestingNavClearance(ROOT_ID, rebuilt);
  }
  return isAgentTestingOverlayDomVisible();
}

export function stopAgentTestingOverlay(
  options?: StopAgentTestingOverlayOptions
): void {
  try {
    dismissStaleDiagForSession(
      options?.force ? "qa-stop-force" : "qa-stop"
    );
    if (options?.force) {
      nest = 0;
      latchSettleResetFlags(options);
      settleReload = !!options.reload;
      if (active) logAgentTestingOverlay("overlay stop");
      active = false;
      clearSafetyTimer();
      clearIdleTimer();
      clearEnsureClearTimer();
      clearElapsedTimer();
      clearPersist();
      safeResetStudio();
      // Instant dismiss - skip sitrep settle. Always hard-clear path.
      if (settling) {
        cancelSettle(!!options.reload);
        return;
      }
      unbindBeforeUnload();
      unbindVisibility();
      dismissRoboCursor();
      teardownDom(true);
      if (options.reload) scheduleReload(120);
      else {
        settleResetToHub = false;
        settleResetToJourneyStart = false;
      }
      return;
    }
    nest = Math.max(0, nest - 1);
    if (nest > 0) return;
    if (settling) {
      // Already in sitrep; honor a late reload / result stamp.
      if (options?.reload) settleReload = true;
      if (options?.result === "pass" || options?.result === "fail") {
        settleResult = options.result;
        setTitle(formatSitrepTitle(settleResult));
        setResultBadge(settleResult);
      }
      return;
    }
    if (!active) {
      if (options?.reload) scheduleReload(120);
      else {
        // Ensure nothing stale remains when stop races an idle clear.
        forceClearAgentTestingOverlay();
      }
      return;
    }
    logAgentTestingOverlay("overlay stop");
    enterSettle(options);
  } catch {
    // Last resort - never leave the click guard up.
    forceClearAgentTestingOverlay();
  }
}

export type TouchAgentTestingOverlayOptions = {
  /**
   * Keep open manual/observe logger (no wipe→agent). Use for product REC helpers
   * so OBSERVE+REC dual-use does not steal the capture session.
   */
  preserveLogger?: boolean;
};

/**
 * Ensure the BR panel is visible while an agent drives the tab.
 * Safe to call on every helper / DevTools evaluate - does not bump nest.
 * **PO MANUAL stays MANUAL** — soft touch never wipes → AGENT TESTING.
 * Observe: `preserveLogger: true` keeps OBSERVE; otherwise wipe → agent.
 * Idle → `startAgentTestingOverlay` (agent).
 */
export function touchAgentTestingOverlay(
  title?: string,
  options?: TouchAgentTestingOverlayOptions
): void {
  confirmAgentHandshake("touch");
  openQaDiagGate({ reason: "overlay-touch" });
  if (settling) {
    abandonSettleForRearch();
  }
  const kind = getSessionKind();
  // PO owns MANUAL — never steal title to AGENT TESTING on soft touch/helpers.
  if (active && kind === "manual") {
    noteActivity();
    if (!isAgentTestingOverlayDomVisible()) {
      ensureAgentTestingOverlayDomArmed(
        resolveAgentTestingOverlayTitle(title ?? titleForSessionKind("manual"))
      );
    }
    syncSessionChrome();
    return;
  }
  if (active && kind === "observe") {
    if (options?.preserveLogger) {
      noteActivity();
      if (!isAgentTestingOverlayDomVisible()) {
        ensureAgentTestingOverlayDomArmed(
          resolveAgentTestingOverlayTitle(title)
        );
      }
      syncSessionChrome();
      return;
    }
    // Default connect without explicit oversee = wipe + agent lock.
    applyQaHandoff({ oversee: false, title });
    return;
  }
  if (active) {
    noteActivity();
    const resolved = resolveAgentTestingOverlayTitle(title);
    if (title?.trim()) {
      sessionTitle = resolved;
      setTitle(resolved);
    }
    if (!isAgentTestingOverlayDomVisible()) {
      ensureAgentTestingOverlayDomArmed(resolved);
    }
    syncSessionChrome();
    return;
  }
  startAgentTestingOverlay(title);
}

function wipeSessionContext(): void {
  logEntries = [];
  timelineKeys = [];
  lastStepAt = 0;
  try {
    replaceQaDiagRing([]);
  } catch {
    /* ignore */
  }
  setAwaitingUserReply(false);
}

/**
 * Agent/MCP handoff into an open logger (or start agent).
 * oversee:false (default) → stop/wipe → green-field agent.
 * oversee:true → keep log/ring (incl. user-message) → agent|observe.
 */
export function handoffQaSession(options?: QaHandoffOptions): void {
  applyQaHandoff(options);
}

function applyQaHandoff(options?: QaHandoffOptions): void {
  const wipe = shouldWipeOnHandoff(options);
  const target = resolveHandoffKind(options);
  if (settling) abandonSettleForRearch();

  if (wipe) {
    wipeSessionContext();
    nest = 1;
    sessionStartedAt = Date.now();
    lastStepAt = sessionStartedAt;
    resetElapsedClock(true);
    autoPausedForStalePresence = false;
    touchQaAgentPresence("handoff-wipe");
    armPresenceHeartbeatWithAutoPause();
  }

  setSessionKind(target, { escalatedFromObserve: false });
  setAwaitingUserReply(false);
  clearMcpPending();
  capturePaused = false;
  active = true;
  settling = false;
  settleResult = "neutral";
  signalMcpConnect();

  const resolved = resolveAgentTestingOverlayTitle(
    options?.title ?? titleForSessionKind(target)
  );
  sessionTitle = resolved;
  const root = ensureRoot();
  if (root) {
    root.dataset.active = "true";
    root.dataset.settling = "false";
    delete root.dataset.result;
    if (isLoggerStyleSession(target)) root.dataset.logger = "true";
    else delete root.dataset.logger;
    syncAgentTestingNavClearance(ROOT_ID, root);
  }
  openQaDiagGate({
    logger: isLoggerStyleSession(target),
    reason: wipe ? "handoff-wipe" : "handoff-oversee",
    sessionKind: target,
  });
  setQaDiagLoggerMode(isLoggerStyleSession(target));
  setQaDiagSessionMeta({ sessionKind: target, awaitingReply: false });
  syncClickGuard();
  setTitle(resolved);
  setResultBadge("neutral");
  setHint(hintForSessionKind(target));
  setActivityPhase("running");
  if (!wipe) {
    pushLogEntry({
      atMs: Date.now(),
      timeLabel: new Date().toLocaleTimeString("en-GB", { hour12: false }),
      label: `Handoff → ${target} (oversee)`,
      outcome: "ok",
      kind: "system",
    });
  } else {
    pushLogEntry({
      atMs: Date.now(),
      timeLabel: new Date().toLocaleTimeString("en-GB", { hour12: false }),
      label: `Handoff → ${target} (fresh)`,
      outcome: "ok",
      kind: "system",
    });
    pushLogEntry({
      atMs: Date.now(),
      timeLabel: new Date().toLocaleTimeString("en-GB", { hour12: false }),
      label: `AGENT SESSION · start (elapsed reset) · handoff-wipe`,
      outcome: "ok",
      kind: "system",
    });
  }
  writePersist(resolved);
  bindBeforeUnload();
  bindVisibility();
  armElapsedTimer();
  resumeElapsedClock();
  noteActivity();
  refreshSitrepDom();
  refreshActivityDom();
  renderLog();
  syncSessionChrome();
  syncCaptureWatch();
  softShowOverlayPanel(root);
}

/** Observe → agent lock (Alarm / anomaly). */
export function escalateObserveToAgentSession(reason = "escalate"): boolean {
  if (!escalateObserveToAgent()) return false;
  startFreshAgentInterventionSession(`escalate:${reason}`);
  capturePaused = false;
  clearMcpPending();
  signalMcpConnect();
  syncClickGuard();
  setQaDiagLoggerMode(false);
  const resolved = titleForSessionKind("agent");
  sessionTitle = resolved;
  setTitle(resolved);
  setHint(hintForSessionKind("agent"));
  pushLogEntry({
    atMs: Date.now(),
    timeLabel: new Date().toLocaleTimeString("en-GB", { hour12: false }),
    label: `Escalated observe → agent (${reason})`,
    outcome: "ok",
    kind: "observe-escalate",
  });
  setActivityPhase("running", "escalated");
  setQaDiagSessionMeta({ sessionKind: "agent", awaitingReply: false });
  syncSessionChrome();
  syncCaptureWatch();
  return true;
}

/** After agent work on escalated observe — unlock back to observe. */
export function unlockObserveSession(): boolean {
  if (!unlockAgentToObserve()) return false;
  clearMcpPending();
  setAwaitingUserReply(false);
  signalMcpConnect();
  syncClickGuard();
  setQaDiagLoggerMode(true);
  const resolved = titleForSessionKind("observe");
  sessionTitle = resolved;
  setTitle(resolved);
  setHint(hintForSessionKind("observe"));
  pushLogEntry({
    atMs: Date.now(),
    timeLabel: new Date().toLocaleTimeString("en-GB", { hour12: false }),
    label: "Unlocked → observe",
    outcome: "ok",
    kind: "system",
  });
  setActivityPhase("running");
  setQaDiagSessionMeta({ sessionKind: "observe", awaitingReply: false });
  syncSessionChrome();
  syncCaptureWatch();
  return true;
}

/**
 * Agent asks PO a question in the visible log (Message/Send = reply).
 */
export function askUserInQa(prompt: string): boolean {
  const trimmed = prompt.trim();
  if (!trimmed) return false;
  if (!active) {
    startAgentTestingOverlay();
  } else if (getSessionKind() === "observe") {
    escalateObserveToAgentSession("ask-user");
  } else if (getSessionKind() === "manual") {
    applyQaHandoff({ oversee: true, kind: "agent" });
  }
  if (!isQaDiagGateOpen()) {
    openQaDiagGate({
      logger: false,
      reason: "agent-prompt",
      sessionKind: "agent",
    });
  }
  const body =
    trimmed.length > 160 ? `${trimmed.slice(0, 158)}…` : trimmed;
  setAwaitingUserReply(true);
  setQaDiagSessionMeta({ sessionKind: "agent", awaitingReply: true });
  armMcpPendingTimeout();
  pushLogEntry({
    atMs: Date.now(),
    timeLabel: new Date().toLocaleTimeString("en-GB", { hour12: false }),
    label: `Agent asks: ${body}`,
    outcome: "ok",
    kind: "agent-prompt",
  });
  setActivityPhase("waiting", "reply");
  syncSessionChrome();
  return true;
}

/**
 * Open QA logger — kind manual|observe|agent.
 * Default: manual (paused). observe opens capturing.
 */
export function openAgentTestingLogger(
  options?: OpenQaLoggerOptions | string
): void {
  if (isAgentLocked() && (active || settling)) {
    return;
  }
  const opts: OpenQaLoggerOptions =
    typeof options === "string" ? { title: options } : options ?? {};
  const hydrateRestore = opts.hydrateRestore === true;
  if (opts.oversee === true && active) {
    applyQaHandoff({
      oversee: true,
      kind: opts.kind === "observe" ? "observe" : "agent",
      title: opts.title,
    });
    return;
  }
  const kind = resolveOpenKind(opts);
  openQaDiagGate({
    logger: isLoggerStyleSession(kind),
    reason: "version-chip",
    sessionKind: kind,
  });
  setQaDiagLoggerMode(isLoggerStyleSession(kind));
  setSessionKind(kind);
  setAwaitingUserReply(false);
  setQaDiagSessionMeta({ sessionKind: kind, awaitingReply: false });
  clearMcpPending();
  // Fresh open / handoff wipe — always reset QA log (no stale).
  // Hydrate restore keeps ring-restored rows.
  if (!hydrateRestore) {
    logEntries = [];
    timelineKeys = [];
    lastStepAt = 0;
    try {
      replaceQaDiagRing([]);
    } catch {
      /* ignore */
    }
  }
  sessionHadProgress = logEntries.some(
    (e) => e.kind === "click" || e.kind === "nav" || e.kind === "user-message"
  );
  logDirty = logEntries.length > 0;
  // Manual opens paused; observe/agent start capturing.
  capturePaused = kind === "manual";
  if (kind === "agent" || kind === "observe") {
    signalMcpConnect();
  } else {
    clearMcpConnectionError();
  }
  if (settling) abandonSettleForRearch();
  const resolved = resolveAgentTestingOverlayTitle(
    opts.title?.trim() || titleForSessionKind(kind)
  );
  sessionTitle = resolved;
  const root = ensureRoot();
  if (root) {
    root.dataset.active = "true";
    root.dataset.settling = "false";
    if (isLoggerStyleSession(kind)) root.dataset.logger = "true";
    else delete root.dataset.logger;
    delete root.dataset.result;
    syncAgentTestingNavClearance(ROOT_ID, root);
  }
  active = true;
  settling = false;
  nest = Math.max(nest, 1);
  syncClickGuard();
  setTitle(resolved);
  setResultBadge("neutral");
  setHint(hintForSessionKind(kind));
  if (!sessionStartedAt) {
    sessionStartedAt = Date.now();
    lastStepAt = sessionStartedAt;
  }
  if (!hydrateRestore) {
    resetElapsedClock(!capturePaused);
  }
  setActivityPhase(capturePaused ? "paused" : "running");
  syncSessionChrome();
  writePersist(resolved);
  armElapsedTimer();
  noteActivity();
  refreshSitrepDom();
  refreshActivityDom();
  renderLog();
  syncCaptureWatch();
  softShowOverlayPanel(root);
  armSessionOriginProbe();
  if (root) {
    bindMessageListen(qaListenDeps(), root);
    focusMessageInput(ROOT_ID, root);
  }
  try {
    const params = new URLSearchParams(location.search);
    // CJM-off saved-chat dump-all watch only — never gate CJM-on Play/SF progressive.
    if (params.get("screen") === "chat" && params.get("cjm") === "off") {
      armQaChatLoadingWatch({
        onFail: (detail) => {
          pushLogEntry({
            atMs: Date.now(),
            timeLabel: new Date().toLocaleTimeString("en-GB", {
              hour12: false,
            }),
            label: `FAIL · ${detail}`,
            outcome: "fail",
            kind: "system",
          });
          beginFailHandoffFromOverlay(detail);
        },
      });
    } else {
      disarmQaChatLoadingWatch();
    }
  } catch {
    /* hang-safe */
  }
}

/** Soft dismiss — close gate, stop capture, hide panel, keep DOM (no remount flash). */
export function softCloseAgentTestingLogger(reason = "soft-close"): void {
  if (isAgentLocked() && (active || settling)) {
    forceClearAgentTestingOverlay();
    return;
  }
  if (!canUserDismissSession() && (active || settling)) {
    return;
  }
  logQaToolbarAction(`Close · ${reason}`);
  dismissStaleDiagForSession(
    reason.startsWith("qa-") ? reason : `qa-${reason}`
  );
  try {
    disarmOriginProbe();
  } catch {
    /* hang-safe */
  }
  unbindCaptureWatch();
  closeQaDiagGate({ reason });
  setSessionKind("manual");
  setAwaitingUserReply(false);
  clearMcpPending();
  clearMcpConnectionError();
  resetMcpStatusLatches();
  capturePaused = false;
  setQaDiagLoggerMode(false);
  nest = 0;
  active = false;
  settling = false;
  settleHeld = false;
  settleResult = "neutral";
  logEntries = [];
  timelineKeys = [];
  sessionHadProgress = false;
  logDirty = false;
  lastStepAt = 0;
  try {
    replaceQaDiagRing([]);
  } catch {
    /* ignore */
  }
  clearSafetyTimer();
  clearIdleTimer();
  clearSettleTimer();
  clearEnsureClearTimer();
  clearElapsedTimer();
  elapsedAccumMs = 0;
  elapsedRunStartedAt = 0;
  clearPersist();
  unbindBeforeUnload();
  unbindVisibility();
  hideOverlayDom();
  const root = document.getElementById(ROOT_ID);
  if (root) {
    delete root.dataset.logger;
    delete root.dataset.owner;
    delete root.dataset.kind;
    delete root.dataset.mcp;
    delete root.dataset.settleHeld;
  }
  setQaSessionLock(null);
  setActivityPhase("idle");
  syncSessionChrome();
  clearNavMcpHint();
  refreshMcpStatusDom();
}

/**
 * Bug-icon toggle: open MANUAL TEST, or close+stop when manual popup open.
 * Observe: calm chip — does not toggle-close (use Close ×).
 * Agent lock: **PO reclaim** — wipe AGENT TESTING → open MANUAL TEST (human owns bug).
 */
export function toggleAgentTestingLogger(): void {
  if (isAgentLocked() && (active || settling)) {
    try {
      forceClearAgentTestingOverlay();
    } catch {
      /* hang-safe */
    }
    openAgentTestingLogger({ kind: "manual" });
    return;
  }
  if (active && bugIconClosesSession()) {
    softCloseAgentTestingLogger("bug-icon");
    return;
  }
  if (active && getSessionKind() === "observe") {
    // Soft active observe — bug stays calm; do not wipe via toggle.
    return;
  }
  openAgentTestingLogger({ kind: "manual" });
}

/**
 * User free-text message → halt + latch + log.
 * Mid-flight Send pauses progress; agent must consume latch, investigate, reply, then proceed.
 * Reply to AskUser also clears PENDING (awaiting) but stays paused until Resume.
 */
export function appendAgentTestingUserMessage(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  if (!active) {
    openAgentTestingLogger({ kind: "manual" });
  } else if (!isQaDiagGateOpen()) {
    openQaDiagGate({
      logger: isLoggerStyleSession(),
      reason: "user-message",
    });
  }
  const body =
    trimmed.length > 120 ? `${trimmed.slice(0, 118)}…` : trimmed;
  const awaiting = isAwaitingUserReply();

  // HARD: Message is a mid-flight stop — never ignore while Play/capture runs.
  pauseCaptureAndHalt(
    qaListenDeps(),
    "po-user-message",
    awaiting
      ? `Reply received — progress paused · consume latch before proceed`
      : `Message received — progress paused · consume latch before proceed`
  );
  noteQaMessageSent();
  try {
    latchPoSignal({
      type: "user-message",
      code: "USER_MESSAGE_RECEIVED",
      note: trimmed,
      sitrepLine: lastSitrepLine,
      timeline: timelineKeys,
    });
  } catch {
    /* hang-safe */
  }

  const label = awaiting ? `Reply: ${body}` : `Message: ${body}`;
  pushLogEntry({
    atMs: Date.now(),
    timeLabel: new Date().toLocaleTimeString("en-GB", { hour12: false }),
    label,
    outcome: "ok",
    kind: "user-message",
  });
  markAgentTestingTimeline(`user-message:${Date.now()}`, "ok");
  // Do NOT mark agent online on PO send — that lied. Check presence instead.
  if (isQaAgentOfflineForMessage()) {
    const card = buildQaAgentResumeCard(trimmed);
    pushLogEntry({
      atMs: Date.now(),
      timeLabel: new Date().toLocaleTimeString("en-GB", { hour12: false }),
      label:
        "Agent OFFLINE — not linked. Copy resume card below → paste into Cursor chat to resume.",
      outcome: "fail",
      kind: "system",
    });
    pushLogEntry({
      atMs: Date.now(),
      timeLabel: new Date().toLocaleTimeString("en-GB", { hour12: false }),
      label: `Resume · ${card.studioUrl}`,
      outcome: "soft-fail",
      kind: "system",
    });
    try {
      const rootEl = document.getElementById(ROOT_ID);
      let box = rootEl?.querySelector<HTMLTextAreaElement>(
        ".studio-agent-testing-overlay__resume-card"
      );
      if (!box && rootEl) {
        box = document.createElement("textarea");
        box.className = "studio-agent-testing-overlay__resume-card";
        box.readOnly = true;
        box.rows = 8;
        box.setAttribute("aria-label", "Agent resume card for Cursor");
        rootEl
          .querySelector(".studio-agent-testing-overlay__log")
          ?.insertAdjacentElement("afterend", box);
      }
      if (box) {
        box.value = card.copyText;
        box.style.display = "block";
      }
      void navigator.clipboard?.writeText?.(card.copyText);
    } catch {
      /* hang-safe */
    }
  } else {
    pushLogEntry({
      atMs: Date.now(),
      timeLabel: new Date().toLocaleTimeString("en-GB", { hour12: false }),
      label: awaiting
        ? "Reply delivered · awaiting agent consume"
        : "Message delivered · awaiting agent consume",
      outcome: "ok",
      kind: "system",
    });
  }
  clearQaMessageDraft();
  try {
    const root = document.getElementById(ROOT_ID);
    const input = root?.querySelector<HTMLInputElement>(
      ".studio-agent-testing-overlay__note-input"
    );
    if (input) input.value = "";
  } catch {
    /* ignore */
  }
  if (awaiting) {
    setAwaitingUserReply(false);
    clearMcpPending();
    setQaDiagSessionMeta({ awaitingReply: false });
  }
  setActivityPhase("paused", "user-message");
  syncSessionChrome();
  return true;
}

/** @deprecated Prefer appendAgentTestingUserMessage */
export function appendAgentTestingPoNote(text: string): boolean {
  return appendAgentTestingUserMessage(text);
}

export function logAgentTestingOverlay(line: string): void {
  // Allow FINAL / summary lines during sitrep settle (active is false).
  pushLogEntry(buildLogEntryFromPlain(line));
}

export function logAgentTestingStep(input: LogAgentTestingStepInput): void {
  pushLogEntry(buildLogEntryFromStep(input));
}

/** Preferred helper arm path — sitrep context + coalesce identical transports. */
export function logAgentTestingHelper(suffix: string): void {
  let snap = null as ReturnType<typeof getControlPanelSnapshot>;
  try {
    snap = getControlPanelSnapshot();
  } catch {
    snap = null;
  }
  const label = formatHelperStepLabel(suffix, snap);
  pushLogEntry(
    buildLogEntryFromStep({
      kind: "helper",
      action: suffix,
      label,
      beatId: snap?.beatId,
      touchpointKey: snap?.touchpointKey,
      outcome: "ok",
    })
  );
}

/**
 * True when the overlay root still exists in the DOM (even if hidden).
 * Used by post-probe MCP prove + forceClear failsafe.
 */
export function isAgentTestingOverlayDomPresent(): boolean {
  if (typeof document === "undefined") return false;
  if (typeof document.getElementById !== "function") return false;
  return document.getElementById(ROOT_ID) != null;
}

/**
 * Instant clear - Dismiss button + stuck-overlay recovery.
 * Always: cancel timers, dismiss cursor, hard-remove DOM, clear persist,
 * strip ephemeral URL keys. Never throws. Always wired on the window API.
 */
export function forceClearAgentTestingOverlay(): void {
  try {
    if (logDomFlushRaf) {
      if (typeof cancelAnimationFrame === "function") {
        cancelAnimationFrame(logDomFlushRaf);
      } else {
        clearTimeout(logDomFlushRaf as unknown as ReturnType<typeof setTimeout>);
      }
      logDomFlushRaf = 0;
    }
    logQaToolbarAction("forceClear · wipe session");
    dismissStaleDiagForSession("force-clear");
    clearFailHandoffFromSession();
    clearFailHandoff();
    clearQaProgressFreeze();
    clearQaAgentPresence();
    try {
      endQaProveMode();
    } catch {
      /* hang-safe */
    }
    try {
      disarmQaChatLoadingWatch();
    } catch {
      /* hang-safe — never abort wipe before settling flags clear */
    }
    clearAgentTestingFinaleSeal();
    try {
      disarmOriginProbe();
    } catch {
      /* hang-safe */
    }
    nest = 0;
    active = false;
    settling = false;
    settleHeld = false;
    settleReload = false;
    settleResult = "neutral";
    setSessionKind("manual");
    setAwaitingUserReply(false);
    clearMcpPending();
    clearMcpConnectionError();
    resetMcpStatusLatches();
    capturePaused = false;
    elapsedAccumMs = 0;
    elapsedRunStartedAt = 0;
    sessionHadProgress = false;
    logDirty = false;
    logEntries = [];
    timelineKeys = [];
    lastStepAt = 0;
    sessionStartedAt = 0;
    clearHistoryPersist();
    unbindCaptureWatch();
    // Close gate first (may append gate-close), then wipe ring — same as softClose.
    closeQaDiagGate({ reason: "force-clear" });
    try {
      replaceQaDiagRing([]);
    } catch {
      /* ignore */
    }
    setQaDiagLoggerMode(false);
    setQaSessionLock(null);
    cancelPendingReload();
    clearSafetyTimer();
    clearIdleTimer();
    clearSettleTimer();
    clearEnsureClearTimer();
    clearElapsedTimer();
    clearPersist();
    try {
      sessionStorage.removeItem(CONTINUE_KEY);
    } catch {
      /* ignore */
    }
    unbindBeforeUnload();
    unbindVisibility();
    dismissRoboCursor();
    releaseClickGuard();
    // Reset URL/modals first, then hard-remove overlay last so a helper-arm
    // race during reset cannot leave a sticky BR panel after forceClear.
    safeResetStudio();
    teardownDom(true);
    clearNavMcpHint();
    refreshMcpStatusDom();
  } catch {
    // Always clear settle latches even when a helper throws mid-wipe.
    nest = 0;
    active = false;
    settling = false;
    settleHeld = false;
    settleReload = false;
    settleResult = "neutral";
    try {
      clearSettleTimer();
      clearEnsureClearTimer();
    } catch {
      /* ignore */
    }
    try {
      closeQaDiagGate({ reason: "force-clear" });
      try {
        replaceQaDiagRing([]);
      } catch {
        /* ignore */
      }
      cancelPendingReload();
      dismissRoboCursor();
      releaseClickGuard();
      safeResetStudio();
      teardownDom(true);
    } catch {
      /* ignore */
    }
  }
}

/**
 * After stop()/sitrep: if DOM still present past settle+buffer, forceClear.
 * Probe finally should call this (or rely on enterSettle failsafe).
 */
export function scheduleAgentTestingOverlayEnsureClear(
  afterMs = DEFAULT_SETTLE_MS + 1000
): void {
  clearEnsureClearTimer();
  // Use global timers (not window.*) so Node/Vitest can fake them.
  ensureClearTimer = setTimeout(() => {
    ensureClearTimer = null;
    if (settling || active || isAgentTestingOverlayDomPresent()) {
      forceClearAgentTestingOverlay();
    }
  }, Math.max(0, afterMs));
}

export function isAgentTestingOverlayActive(): boolean {
  return active;
}

export function isAgentTestingOverlaySettling(): boolean {
  return settling;
}

function bindOverlayApi(api: OverlayApi): void {
  if (typeof window === "undefined") return;
  window.__protoAgentTestingOverlay = api;
  window.__studioAgentTestingOverlay = api;
}

/**
 * On install: hydrate QA diag gate; restore logger quietly if gate was open.
 * Orphan probe persist still cleared unless continue key is set.
 */
export function installAgentTestingOverlayApi(): void {
  if (typeof window === "undefined") return;
  stripEphemeralStudioQuery();
  armRecordingXorWatch();
  const hydrated = hydrateQaDiagGate();
  if (!shouldContinueFromPersist()) {
    clearPersist();
    // Orphan DOM from a hard refresh / HMR - hard-remove unless restoring logger.
    if (
      !hydrated.open &&
      typeof document !== "undefined" &&
      typeof document.getElementById === "function"
    ) {
      document.getElementById(ROOT_ID)?.remove();
      setAgentTestingHtmlFlag(false);
    }
    nest = 0;
    active = false;
    settling = false;
    settleReload = false;
    settleResult = "neutral";
    clearSettleTimer();
    clearIdleTimer();
    clearSafetyTimer();
    clearEnsureClearTimer();
  }
  const api: OverlayApi = {
    start: startAgentTestingOverlay,
    touch: touchAgentTestingOverlay,
    stop: (options) => stopAgentTestingOverlay(options),
    forceClear: forceClearAgentTestingOverlay,
    openLogger: openAgentTestingLogger,
    softClose: softCloseAgentTestingLogger,
    keepOpen: () => holdSettleOpen("api"),
    ackDiagnostic: () => {
      confirmAgentHandshake("ack-diag");
      return acknowledgeQaPlaybackDiagnostic();
    },
    confirmFailTakeover: () => confirmAgentHandshake("api"),
    toggleLogger: toggleAgentTestingLogger,
    handoff: handoffQaSession,
    askUser: askUserInQa,
    escalateObserve: escalateObserveToAgentSession,
    unlockObserve: unlockObserveSession,
    resetSession: resetManualSession,
    mcpStatus: getAgentTestingMcpConnectionStatus,
    appendPoNote: appendAgentTestingUserMessage,
    appendFinale: appendAgentTestingSessionFinale,
    log: logAgentTestingOverlay,
    logStep: logAgentTestingStep,
    logHelper: logAgentTestingHelper,
    ringAlarm: ringAgentTestingAlarm,
    flagCursorWeird: flagAgentTestingCursorWeird,
    flagScrollIssue: flagAgentTestingScrollIssue,
    peekPoSignal,
    consumePoSignal: () => consumePoSignalWithAck(),
    pauseForAgentLeave,
    resumeForAgentReturn,
    setTimeline: setAgentTestingTimeline,
    markTimeline: markAgentTestingTimeline,
    downloadDump: () => downloadCurrentAgentTestingLog(),
    isActive: isAgentTestingOverlayActive,
    shouldBlockPlay: () => shouldBlockPlayNow(qaListenDeps()),
    autoResumeCaptureForPlay: () => autoResumeCaptureForPlay(),
    isCapturePaused: () => capturePaused,
    isDiagnosticBlocking: () => isDiagnosticOpenNow(qaListenDeps()),
  };
  bindOverlayApi(api);
  installPoSignalWindowApis();
  // Window consume must use overlay wrapper (RTT + fail-handoff confirm) — not raw latch.
  try {
    window.__studioConsumePoSignal = () => api.consumePoSignal();
    window.__protoConsumePoSignal = () => api.consumePoSignal();
  } catch {
    /* hang-safe */
  }
  installPoSignalPlaybackHaltWindowApis();
  ensureMcpPendingHandler();
  registerQaDiagnosticOpenHandler((error) =>
    onPlaybackDiagnosticOpened(qaListenDeps(), error)
  );
  try {
    const w = window as Window & {
      __studioBeginQaFailHandoff?: (reason: string) => void;
      __studioConfirmFailTakeover?: () => boolean;
      __studioIsQaProgressFrozen?: () => boolean;
      __studioQaMessageRttStats?: typeof getQaMessageRttStats;
      __studioBenchmarkQaMessageRtt?: () => ReturnType<
        typeof getQaMessageRttStats
      >;
    };
    w.__studioBeginQaFailHandoff = beginQaFailHandoff;
    w.__studioConfirmFailTakeover = () => confirmAgentHandshake("window");
    w.__studioIsQaProgressFrozen = isQaProgressFrozen;
    w.__studioQaMessageRttStats = getQaMessageRttStats;
    w.__studioBenchmarkQaMessageRtt = getQaMessageRttStats;
  } catch {
    /* hang-safe */
  }
  installViteHmrListen(qaListenDeps());
  if (typeof window !== "undefined") {
    window.__studioDownloadAgentTestingDump = () =>
      downloadCurrentAgentTestingLog();
    window.__protoDownloadAgentTestingDump = () =>
      downloadCurrentAgentTestingLog();
    window.__studioForceClearAgentTestingOverlay = () =>
      forceClearAgentTestingOverlay();
    window.__protoForceClearAgentTestingOverlay = () =>
      forceClearAgentTestingOverlay();
    window.__studioSoftCloseQaLogger = () => softCloseAgentTestingLogger();
    window.__studioOpenQaLogger = (opts?: OpenQaLoggerOptions | string) =>
      openAgentTestingLogger(opts);
    window.__studioToggleQaLogger = () => toggleAgentTestingLogger();
    window.__studioQaHandoff = (opts?: QaHandoffOptions) =>
      handoffQaSession(opts);
    window.__studioAskUserInQa = (prompt: string) => askUserInQa(String(prompt ?? ""));
    window.__studioAppendPoNote = (text: string) =>
      appendAgentTestingUserMessage(String(text ?? ""));
    window.__studioQaDiagGateOpen = () => isQaDiagGateOpen();
    window.__studioQaSessionKind = () => getSessionKind();
    window.__studioMcpConnectionStatus = () =>
      getAgentTestingMcpConnectionStatus();
    window.__studioReportMcpConnectionError = (detail: string) => {
      reportMcpConnectionError(String(detail ?? ""));
      refreshMcpStatusDom();
    };
    window.__studioRunQaSelfTestSmoke = async () => {
      const { runQaSelfTestSmoke } = await import(
        "@/app/shell/agent-testing/agentTestingSelfTest"
      );
      return runQaSelfTestSmoke();
    };
    window.__studioRunChatBubbleMotionSelfTest = async (opts) => {
      const { runChatBubbleMotionSelfTest } = await import(
        "@/app/shell/agent-testing/chatBubbleMotionSelfTest"
      );
      return runChatBubbleMotionSelfTest(opts);
    };
    window.__studioNoteBlockedQaPlay = () =>
      noteBlockedPlayAttempt(qaListenDeps());
  }
  // Quiet restore — no remount thrash; reopen with persisted sessionKind (CONTROL).
  if (hydrated.open) {
    restoreLoggerFromRing(hydrated.ring);
    const kind =
      hydrated.sessionKind ?? (hydrated.logger ? "manual" : "agent");
    openAgentTestingLogger({ kind, hydrateRestore: true });
    // Page refresh event — always visible in QA sequence for debug.
    pushLogEntry({
      atMs: Date.now(),
      timeLabel: new Date().toLocaleTimeString("en-GB", { hour12: false }),
      label: "page refresh · session restored",
      outcome: "ok",
      kind: "system",
      count: 1,
    });
    if (hydrated.elapsedAccumMs > 0 || hydrated.sessionStartedAt > 0) {
      restoreElapsedClock(
        hydrated.elapsedAccumMs,
        hydrated.sessionStartedAt,
        kind !== "manual"
      );
    }
    if (hydrated.awaitingReply && kind === "agent") {
      setAwaitingUserReply(true);
      setQaDiagSessionMeta({ sessionKind: "agent", awaitingReply: true });
      armMcpPendingTimeout();
      setActivityPhase("waiting", "reply");
      syncSessionChrome();
    }
    focusMessageInput(ROOT_ID);
  }
}

function restoreLoggerFromRing(events: QaDiagRingEvent[]): void {
  const restored: AgentTestingLogEntry[] = [];
  for (const e of events) {
    if (e.kind === "gate-open" || e.kind === "gate-close") continue;
    // Skip legacy double-ring twin (mirror detail row + pushLogEntry label row).
    const label = e.label || e.text || e.kind;
    const prev = restored[restored.length - 1];
    if (
      prev &&
      prev.label === label &&
      prev.kind ===
        (e.kind === "playback-diag" ? "playback-diag" : prev.kind) &&
      e.kind === "playback-diag" &&
      prev.kind === "playback-diag"
    ) {
      prev.count = (prev.count ?? 1) + 1;
      prev.atMs = e.atMs;
      prev.timeLabel = e.atIso
        ? new Date(e.atIso).toLocaleTimeString("en-GB", { hour12: false })
        : prev.timeLabel;
      continue;
    }
    restored.push({
      atMs: e.atMs,
      timeLabel: e.atIso
        ? new Date(e.atIso).toLocaleTimeString("en-GB", { hour12: false })
        : new Date().toLocaleTimeString("en-GB", { hour12: false }),
      label,
      kind:
        e.kind === "user-message" || e.kind === "po-note"
          ? "user-message"
          : e.kind === "click" ||
              e.kind === "nav" ||
              e.kind === "system" ||
              e.kind === "init" ||
              e.kind === "alarm" ||
              e.kind === "agent-prompt" ||
              e.kind === "observe-escalate" ||
              e.kind === "playback-diag" ||
              e.kind === "scroll" ||
              e.kind === "cursor"
            ? (e.kind as AgentTestingLogEntry["kind"])
            : e.kind === "capture-pause" || e.kind === "capture-start"
              ? "system"
              : "info",
      outcome:
        e.kind === "playback-diag" &&
        /FAIL|DIAGNOSTIC|OFF-TARGET|ABRUPT-PARK|ABRUPT PARK|REST-ON-SUBMIT/i.test(
          e.label || e.text || ""
        )
          ? "fail"
          : e.kind === "playback-diag"
            ? "ok"
            : "ok",
      count: 1,
    });
  }
  logEntries = restored.slice(-LOG_LIMIT);
  replaceQaDiagRing(events);
  // Restored rows count as dirty so Reset is available (not a blank session).
  logDirty = logEntries.length > 0;
  sessionHadProgress = logEntries.some(
    (e) => e.kind === "click" || e.kind === "nav" || e.kind === "user-message"
  );
}

export function uninstallAgentTestingOverlayApi(): void {
  nest = 0;
  active = false;
  settling = false;
  settleReload = false;
  settleResult = "neutral";
  logEntries = [];
  timelineKeys = [];
  disarmRecordingXorWatch();
  unbindCaptureWatch();
  cancelPendingReload();
  clearSafetyTimer();
  clearIdleTimer();
  clearSettleTimer();
  clearEnsureClearTimer();
  clearElapsedTimer();
  clearPersist();
  unbindBeforeUnload();
  unbindVisibility();
  if (typeof document !== "undefined") {
    if (typeof document.getElementById === "function") {
      document.getElementById(ROOT_ID)?.remove();
    }
    setAgentTestingHtmlFlag(false);
  }
  clearPoSignal();
  uninstallPoSignalWindowApis();
  uninstallPoSignalPlaybackHaltWindowApis();
  registerQaDiagnosticOpenHandler(null);
  if (typeof window !== "undefined") {
    delete window.__protoAgentTestingOverlay;
    delete window.__studioAgentTestingOverlay;
    delete window.__studioDownloadAgentTestingDump;
    delete window.__protoDownloadAgentTestingDump;
    delete window.__studioForceClearAgentTestingOverlay;
    delete window.__protoForceClearAgentTestingOverlay;
    delete window.__studioSoftCloseQaLogger;
    delete window.__studioOpenQaLogger;
    delete window.__studioToggleQaLogger;
    delete window.__studioQaHandoff;
    delete window.__studioAskUserInQa;
    delete window.__studioAppendPoNote;
    delete window.__studioQaDiagGateOpen;
    delete window.__studioQaSessionKind;
    delete window.__studioMcpConnectionStatus;
    delete window.__studioReportMcpConnectionError;
    delete window.__studioRunQaSelfTestSmoke;
    delete window.__studioRunChatBubbleMotionSelfTest;
    delete window.__studioNoteBlockedQaPlay;
  }
}

declare global {
  interface Window {
    __protoAgentTestingOverlay?: OverlayApi;
    __studioAgentTestingOverlay?: OverlayApi;
    __studioDownloadAgentTestingDump?: () => boolean;
    __protoDownloadAgentTestingDump?: () => boolean;
    __studioForceClearAgentTestingOverlay?: () => void;
    __protoForceClearAgentTestingOverlay?: () => void;
    __studioSoftCloseQaLogger?: () => void;
    __studioOpenQaLogger?: (opts?: OpenQaLoggerOptions | string) => void;
    __studioToggleQaLogger?: () => void;
    __studioQaHandoff?: (opts?: QaHandoffOptions) => void;
    __studioAskUserInQa?: (prompt: string) => boolean;
    __studioAppendPoNote?: (text: string) => boolean;
    __studioQaDiagGateOpen?: () => boolean;
    __studioQaSessionKind?: () => AgentTestingSessionKind;
    __studioMcpConnectionStatus?: () => McpConnectionStatus;
    __studioReportMcpConnectionError?: (detail: string) => void;
    __studioRunQaSelfTestSmoke?: () => Promise<{
      ok: boolean;
      atIso: string;
      scenarioCount: number;
      checks: Array<{ id: string; ok: boolean; detail?: string }>;
    }>;
    __studioRunChatBubbleMotionSelfTest?: (opts?: {
      assertOnly?: boolean;
      expectedIds?: readonly string[];
    }) => Promise<import("@/app/shell/agent-testing/chatBubbleMotionSelfTest").ChatBubbleMotionSelfTestResult>;
    __studioNoteBlockedQaPlay?: () => void;
    __studioAgentTestingUserTyping?: { at: number; pending: true } | null;
    __studioQaPendingTimeoutMs?: number;
    __studioChatBubbleMotionPaceMs?: {
      step?: number;
      think?: number;
      settle?: number;
    };
  }
}
