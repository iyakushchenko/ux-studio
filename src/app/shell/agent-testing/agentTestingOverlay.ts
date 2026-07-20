/**
 * Mid-flight AGENT TESTING panel (bottom-right). Capture blocks clicks; page stays visible.
 * PO Alarm/Cursor/Scroll → live `__studioAgentTestingTakeover` (primary); dump secondary.
 * See RECORDING.md · PLAYBACK_DIAG.md · agentTestingPoSignal.ts.
 */
import {
  resetStudioAfterAgentTest,
  stripEphemeralStudioQuery,
} from "@/app/shell/studioUrl";
import { removeDemoCursor } from "@/app/scenario/demoCursor";
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
  type QaDiagRingEvent,
} from "@/app/shell/qaDiagGate";
import {
  buildLogEntryFromPlain,
  buildLogEntryFromStep,
  coalesceLogEntry,
  formatElapsed,
  formatHelperStepLabel,
  formatLogRowText,
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
  armMcpPendingTimeout,
  beginMcpConnecting,
  clearMcpConnectionError,
  clearMcpPending,
  deriveMcpConnectionStatus,
  getQaPendingTimeoutMs,
  registerMcpPendingTimeoutHandler,
  reportMcpConnectionError,
  resetMcpStatusLatches,
  type McpConnectionStatus,
} from "@/app/shell/agent-testing/agentTestingMcpStatus";
import {
  buildAgentTestingDump,
  consoleSeparator,
  downloadAgentTestingDump,
  pushAgentTestingDump,
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
  bindAgentTestingNavClearance,
  syncAgentTestingNavClearance,
} from "@/app/shell/agent-testing/agentTestingNavClearance";
import { bindAgentTestingCaptureWatch } from "@/app/shell/agent-testing/agentTestingCaptureWatch";
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
  setTimeline: (keys: string[]) => void;
  markTimeline: (key: string, outcome: AgentTestingStepOutcome) => void;
  downloadDump: () => boolean;
  isActive: () => boolean;
};

let active = false;
let settling = false;
/** Pause freezes capture + clock (all kinds). */
let capturePaused = false;
/**
 * True after real capture progress in this session.
 * False after reset / fresh open → Capture CTA shows CAPTURE (not Resume).
 */
let sessionHadProgress = false;
/** True when log has events after last Reset (Reset CTA gated until dirty). */
let logDirty = false;
let logEntries: AgentTestingLogEntry[] = [];
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
/** Unbind for page click + screen watch. */
let captureWatchUnbind: (() => void) | null = null;
let beforeUnloadBound = false;
let visibilityBound = false;
let reloadPending = false;
let settleReload = false;
/** Latched for settle + deferred reload (default stay-on-page). */
let settleResetToHub = false;
/** Journey smoke teardown → key 1 (preferred; never hub). */
let settleResetToJourneyStart = false;
let settleResult: AgentTestingOverlayResult = "neutral";
let timelineKeys: AgentTestingTimelineKey[] = [];
let lastUnexpectedDwellCount = 0;
/** Latch auto scroll soft-fails so we do not spam amber rows. */
let lastAutoScrollFlagKey = "";
let lastSitrepLine = "";

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
}

function pauseElapsedClock(): void {
  if (elapsedRunStartedAt > 0) {
    elapsedAccumMs += Math.max(0, Date.now() - elapsedRunStartedAt);
    elapsedRunStartedAt = 0;
  }
  setElapsedLabel(formatElapsed(elapsedAccumMs));
}

function resumeElapsedClock(): void {
  if (elapsedRunStartedAt === 0) {
    elapsedRunStartedAt = Date.now();
  }
  setElapsedLabel(formatElapsed(getElapsedMs()));
}

function armElapsedTimer(): void {
  clearElapsedTimer();
  if (!active || settling) return;
  const tick = () => {
    if (!active || settling) return;
    setElapsedLabel(formatElapsed(getElapsedMs()));
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
  if (sessionEl) sessionEl.textContent = sitrep.sessionLine;
  // Compat: legacy sitrep node if present
  const legacy = document.querySelector<HTMLElement>(
    ".studio-agent-testing-overlay__sitrep"
  );
  if (legacy && !sessionEl) legacy.textContent = sitrep.sessionLine;
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
): void {
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
    });
    pushAgentTestingDump(dump);
    console.info(
      "[AGENT_TESTING] dump saved (secondary)",
      reason,
      dump.code ?? "",
      dump.atIso,
      "— primary: window.__studioConsumePoSignal() · dump: __studioDownloadAgentTestingDump()"
    );
  } catch {
    /* never block overlay */
  }
}

/**
 * PO Alarm = sequence / expected-steps mismatch (AGENT mode only).
 * Stops progress (halt Play + pause capture) and latches investigate prompt for agents.
 */
export function ringAgentTestingAlarm(note?: string): void {
  if (getSessionKind() !== "agent" || !active || settling) return;
  // HARD: stop Play in the same turn as the click — do not wait for smoke poll.
  haltPlaybackForPoSignal("po-alarm");
  if (!capturePaused) {
    pauseElapsedClock();
    capturePaused = true;
    sessionHadProgress = true;
  }
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
    atMs: performance.now(),
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
function isCaptureInProgress(): boolean {
  if (!active || settling) return false;
  if (capturePaused) return false;
  return (
    activityPhase === "running" ||
    activityPhase === "preparing" ||
    activityPhase === "waiting"
  );
}

function unbindCaptureWatch(): void {
  if (captureWatchUnbind) {
    try {
      captureWatchUnbind();
    } catch {
      /* hang-safe */
    }
    captureWatchUnbind = null;
  }
}

/** Page clicks + screen nav → short visible log lines while capturing. */
function syncCaptureWatch(): void {
  unbindCaptureWatch();
  if (!active || settling) return;
  captureWatchUnbind = bindAgentTestingCaptureWatch({
    isCapturing: () => isCaptureInProgress(),
    onClick: (label) => {
      pushLogEntry({
        atMs: performance.now(),
        timeLabel: new Date().toLocaleTimeString("en-GB", { hour12: false }),
        label,
        outcome: "ok",
        kind: "click",
      });
    },
    onScreen: (label) => {
      pushLogEntry({
        atMs: performance.now(),
        timeLabel: new Date().toLocaleTimeString("en-GB", { hour12: false }),
        label,
        outcome: "ok",
        kind: "nav",
      });
    },
  });
}

function closeManualSession(reason: string): void {
  if (!canUserDismissSession() && (active || settling)) return;
  softCloseAgentTestingLogger(reason);
}

/** Instant clear of log / ring / timer — fresh session, CAPTURE CTA. */
function resetManualSession(): void {
  if (!canUserDismissSession() && (active || settling)) return;
  if (!active) return;
  if (!logDirty) return;
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
  capturePaused = true;
  resetElapsedClock(false);
  armElapsedTimer();
  pushLogEntry({
    atMs: performance.now(),
    timeLabel: new Date().toLocaleTimeString("en-GB", { hour12: false }),
    label: "Session reset",
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
    if (getMcpTestSession() || isQaDiagLoggerMode() || isLoggerStyleSession()) {
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
    ".studio-agent-testing-overlay__hint"
  );
  if (el) el.textContent = text;
}

function renderHistory(): void {
  if (!hasDomQuery()) return;
  document
    .getElementById(ROOT_ID)
    ?.querySelector(".studio-agent-testing-overlay__history")
    ?.remove();
  clearHistoryPersist();
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

  const locked = isAgentLocked() && (active || settling);
  const closeBtn = root.querySelector<HTMLButtonElement>(
    ".studio-agent-testing-overlay__close"
  );
  if (closeBtn) {
    closeBtn.hidden = locked;
    closeBtn.disabled = locked;
    closeBtn.title = locked
      ? "Agent session locked — cannot close"
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
    const enabled = !isCaptureInProgress();
    saveBtn.disabled = !enabled;
    saveBtn.textContent = "Save Log";
    saveBtn.title = enabled
      ? "Download lean dump JSON (secondary — prefer __studioConsumePoSignal)"
      : "Pause capture or wait until idle to save log";
  }

  const alarmBtn = root.querySelector<HTMLButtonElement>(
    ".studio-agent-testing-overlay__alarm"
  );
  if (alarmBtn) {
    const alarmOk = kind === "agent" && active && !settling;
    alarmBtn.hidden = !alarmOk;
    alarmBtn.disabled = !alarmOk;
    alarmBtn.title = alarmOk
      ? "Stop progress + latch investigate prompt for the agent"
      : "Alarm — agent mode only";
  }

  ensureMessageUnderLog(root);
  ensureOverlayChrome(root);
  refreshMcpStatusDom();
}

function readLiveMcpStatus(): McpConnectionStatus {
  return deriveMcpConnectionStatus({
    overlayActive: active && !settling,
    sessionKind: getSessionKind(),
    awaitingReply: isAwaitingUserReply(),
  });
}

export function getAgentTestingMcpConnectionStatus(): McpConnectionStatus {
  return readLiveMcpStatus();
}

function refreshMcpStatusDom(): void {
  if (!hasDomQuery()) return;
  const status = readLiveMcpStatus();
  const root = document.getElementById(ROOT_ID);
  const wrap = root?.querySelector<HTMLElement>(
    ".studio-agent-testing-overlay__mcp-status"
  );
  const chip = root?.querySelector<HTMLElement>(
    ".studio-agent-testing-overlay__mcp"
  );
  const mode = root?.querySelector<HTMLElement>(
    ".studio-agent-testing-overlay__mcp-mode"
  );
  if (chip) {
    if (!status.label || status.phase === "idle") {
      chip.hidden = true;
      chip.textContent = "";
      delete chip.dataset.phase;
      if (wrap) wrap.hidden = true;
      if (mode) {
        mode.hidden = true;
        mode.textContent = "";
      }
    } else {
      chip.hidden = false;
      chip.textContent = status.label;
      chip.dataset.phase = status.phase;
      chip.title = status.label;
      if (wrap) wrap.hidden = false;
      if (mode) {
        mode.hidden = false;
        const modeLine =
          status.phase === "control"
            ? "Connection · CONTROL (agent online)"
            : status.phase === "observe"
              ? "Connection · OBSERVE (user can interact)"
              : status.phase === "pending"
                ? "Connection · CONTROL · PENDING (awaiting reply)"
                : status.phase === "error"
                  ? `Connection · ERROR${status.error ? `: ${status.error}` : ""}`
                  : status.phase === "connecting"
                    ? "Connection · CONNECTING"
                    : status.phase === "connected"
                      ? "Connection · CONNECTED"
                      : "";
        mode.textContent = modeLine;
        mode.dataset.phase = status.phase;
      }
    }
  }
  if (root) {
    if (status.phase === "idle") delete root.dataset.mcp;
    else root.dataset.mcp = status.phase;
  }
  const html = document.documentElement;
  if (html?.dataset) {
    if (status.phase === "idle") delete html.dataset.studioMcpStatus;
    else html.dataset.studioMcpStatus = status.phase;
  }
  const navHint = document.querySelector<HTMLElement>(
    ".studio-nav-version__mcp"
  );
  if (navHint) {
    if (!status.label || status.phase === "idle") {
      navHint.hidden = true;
      navHint.textContent = "";
      delete navHint.dataset.phase;
    } else {
      navHint.hidden = false;
      // Short nav hint
      const short =
        status.phase === "pending"
          ? "PENDING"
          : status.phase === "control"
            ? "CTRL"
            : status.phase === "observe"
              ? "OBS"
              : status.phase === "connecting"
                ? "…"
                : status.phase === "connected"
                  ? "OK"
                  : status.phase === "error"
                    ? "ERR"
                    : "";
      navHint.textContent = short;
      navHint.dataset.phase = status.phase;
      navHint.title = status.label;
    }
  }
}

/** PENDING timeout: auto-pause + log (user can Resume). */
function onMcpPendingTimeout(): void {
  if (!active || settling) {
    clearMcpPending();
    setAwaitingUserReply(false);
    return;
  }
  setAwaitingUserReply(false);
  clearMcpPending();
  if (!capturePaused) {
    pauseElapsedClock();
    capturePaused = true;
  }
  pushLogEntry({
    atMs: performance.now(),
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
}

/** Migrate older overlay DOM: Pause beside clock; Session + Touchpoints bars. */
function ensureOverlayChrome(root: HTMLElement): void {
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
    dumpBtn.title = "Download lean dump JSON when paused or idle";
    dumpBtn.addEventListener("click", () => {
      if (isCaptureInProgress()) return;
      downloadAgentTestingDump();
    });
    headerActions.appendChild(dumpBtn);
  } else if (strayDump && strayDump !== dumpBtn) {
    strayDump.remove();
  }

  // MCP status under compose
  let mcpStatus = panel.querySelector<HTMLElement>(
    ".studio-agent-testing-overlay__mcp-status"
  );
  if (!mcpStatus) {
    mcpStatus = document.createElement("div");
    mcpStatus.className = "studio-agent-testing-overlay__mcp-status";
    mcpStatus.hidden = true;
    mcpStatus.innerHTML =
      '<span class="studio-agent-testing-overlay__mcp" data-phase="idle" hidden></span>' +
      '<span class="studio-agent-testing-overlay__mcp-mode" hidden></span>';
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
      <p class="studio-agent-testing-overlay__session-line">Session — waiting for studio state</p>
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
}

/**
 * Pause / Resume capture.
 * Manual: stops ring appends (gate stays open).
 * Agent: also hard-halts Play via haltPlaybackForPoSignal — explicit Resume required (no auto-Play).
 */
function toggleCapturePause(): void {
  if (!active || settling) return;
  const next = !capturePaused;
  if (next && getSessionKind() === "agent") {
    try {
      haltPlaybackForPoSignal("po-pause");
    } catch {
      /* hang-safe */
    }
  }
  const kind = getSessionKind();
  const label =
    kind === "agent"
      ? next
        ? "Agent paused (Play halted)"
        : "Agent resumed (capture on)"
      : next
        ? "Capture paused"
        : "Capture resumed";
  // Status row must land even when pausing (gate would otherwise drop it).
  if (next) {
    pauseElapsedClock();
    pushLogEntry({
      atMs: performance.now(),
      timeLabel: new Date().toLocaleTimeString("en-GB", { hour12: false }),
      label,
      outcome: "ok",
      kind: "system",
    });
    capturePaused = true;
  } else {
    capturePaused = false;
    sessionHadProgress = true;
    resumeElapsedClock();
    pushLogEntry({
      atMs: performance.now(),
      timeLabel: new Date().toLocaleTimeString("en-GB", { hour12: false }),
      label,
      outcome: "ok",
      kind: "system",
    });
  }
  if (next) sessionHadProgress = true;
  armElapsedTimer();
  setActivityPhase(capturePaused ? "paused" : "running");
  syncCaptureWatch();
  syncSessionChrome();
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
      <p class="studio-agent-testing-overlay__hint">Page visible — mid-flight QA below.</p>
      <p class="studio-agent-testing-overlay__activity" data-phase="idle" data-live="false">Idle</p>
      <div class="studio-agent-testing-overlay__session" aria-label="Session context">
        <p class="studio-agent-testing-overlay__bar-title">Session</p>
        <p class="studio-agent-testing-overlay__session-line">Session — waiting for studio state</p>
      </div>
      <div class="studio-agent-testing-overlay__timeline-wrap" hidden>
        <p class="studio-agent-testing-overlay__bar-title">Touchpoints</p>
        <div class="studio-agent-testing-overlay__timeline" aria-label="Touchpoint progress"></div>
      </div>
      <div class="studio-agent-testing-overlay__actions">
        <button type="button" class="studio-agent-testing-overlay__alarm" hidden title="Alarm — agent mode only">Alarm</button>
        <button type="button" class="studio-agent-testing-overlay__cursor-flag" title="Flag cursor weird — latches live PO signal">Cursor</button>
        <button type="button" class="studio-agent-testing-overlay__scroll-flag" title="Flag scroll problem — latches live PO signal">Scroll</button>
      </div>
      <ol class="studio-agent-testing-overlay__log" data-empty="true"></ol>
      <form class="studio-agent-testing-overlay__note" autocomplete="off">
        <input type="text" class="studio-agent-testing-overlay__note-input" name="user-message" maxlength="280" placeholder="Message" aria-label="Message" />
        <button type="submit" class="studio-agent-testing-overlay__note-submit">Send</button>
      </form>
      <div class="studio-agent-testing-overlay__mcp-status" hidden>
        <span class="studio-agent-testing-overlay__mcp" data-phase="idle" hidden></span>
        <span class="studio-agent-testing-overlay__mcp-mode" hidden></span>
      </div>
    </div>
  `;
  const closeBtn = root.querySelector<HTMLButtonElement>(
    ".studio-agent-testing-overlay__close"
  );
  closeBtn?.addEventListener("click", () => closeManualSession("close-x"));
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
      if (isCaptureInProgress()) return;
      downloadAgentTestingDump();
    });
  // Last child of body - paint above #root concept lightboxes.
  (document.body ?? document.documentElement).appendChild(root);
  bindAgentTestingNavClearance(ROOT_ID);
  syncAgentTestingNavClearance(ROOT_ID, root);
  return root;
}

function pushLogEntry(entry: AgentTestingLogEntry): void {
  if (!active && !settling) return;
  // Manual pause: skip auto events; user-message + system control still land.
  if (
    capturePaused &&
    entry.kind !== "user-message" &&
    entry.kind !== "po-note" &&
    entry.kind !== "system" &&
    entry.kind !== "agent-prompt" &&
    entry.kind !== "observe-escalate" &&
    entry.kind !== "alarm"
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
    detail: ringEntry.action,
  });

  let visible = entry;
  if (warmNoise) {
    const existingInit = logEntries.find((e) => e.kind === "init");
    if (existingInit) {
      existingInit.count = (existingInit.count ?? 1) + 1;
      existingInit.atMs = entry.atMs;
      existingInit.timeLabel = entry.timeLabel;
      existingInit.label = "Initializing…";
      renderLog();
      refreshSitrepDom();
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
        ? { ...visible, durationMs: Math.max(0, visible.atMs - lastStepAt) }
        : visible;
    logEntries.push(withDuration);
    lastStepAt = visible.atMs;
  }
  if (logEntries.length > LOG_LIMIT) {
    logEntries = logEntries.slice(-LOG_LIMIT);
  }
  if (visible.label !== "Session reset") {
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
  renderLog();
  refreshSitrepDom();
  if (active) noteActivity();
}

function renderLog(): void {
  if (!hasDomQuery()) return;
  const root = document.getElementById(ROOT_ID);
  const list = root?.querySelector<HTMLOListElement>(
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
  settleResult = "neutral";
  clearSettleTimer();
  clearEnsureClearTimer();
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
  settleResult = "neutral";
  clearSettleTimer();
  clearEnsureClearTimer();
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
  settleResult = "neutral";
  clearSettleTimer();
  clearEnsureClearTimer();
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
    const left = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
    setHint(formatSitrepHint(left, settleReload, settleResult));
  };
  tickHint();
  renderLog();
  renderHistory();
  clearSettleTimer();
  settleCountdownTimer = setInterval(tickHint, SITREP_COUNTDOWN_TICK_MS);
  settleTimer = setTimeout(() => {
    finishSettle();
  }, settleMs);
  // Failsafe: if settle somehow stalls, hard-clear after settle + 1s.
  ensureClearTimer = setTimeout(() => {
    if (settling || isAgentTestingOverlayDomPresent()) {
      forceClearAgentTestingOverlay();
    }
  }, settleMs + 1000);
}

export function startAgentTestingOverlay(title?: string): void {
  if (settling) {
    abandonSettleForRearch();
  }
  nest += 1;
  active = true;
  settling = false;
  settleResult = "neutral";
  setSessionKind("agent");
  setAwaitingUserReply(false);
  clearMcpPending();
  sessionHadProgress = false;
  logDirty = false;
  capturePaused = false;
  clearEnsureClearTimer();
  signalMcpConnect();
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
    root.querySelector(".studio-agent-testing-overlay__history")?.remove();
    syncAgentTestingNavClearance(ROOT_ID, root);
  }
  setAgentTestingHtmlFlag(shouldBlockPageClicks("agent"));
  setTitle(resolved);
  setResultBadge("neutral");
  setHint(hintForSessionKind("agent"));
  setActivityPhase("running");
  openQaDiagGate({ logger: false, reason: "overlay-start" });
  setQaDiagLoggerMode(false);
  syncSessionChrome();
  writePersist(resolved);
  bindBeforeUnload();
  bindVisibility();
  noteActivity();
  if (nest === 1) {
    logEntries = [];
    timelineKeys = [];
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
    atMs: performance.now(),
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
  setAgentTestingHtmlFlag(true);
  setTitle(resolved);
  syncAgentTestingNavClearance(ROOT_ID, root);
  if (!root.querySelector(".studio-agent-testing-overlay__panel")) {
    // Corrupt orphan - rebuild.
    root.remove();
    const rebuilt = ensureRoot();
    if (!rebuilt) return false;
    rebuilt.dataset.active = "true";
    rebuilt.dataset.settling = "false";
    setAgentTestingHtmlFlag(true);
    setTitle(resolved);
    syncAgentTestingNavClearance(ROOT_ID, rebuilt);
  }
  return isAgentTestingOverlayDomVisible();
}

export function stopAgentTestingOverlay(
  options?: StopAgentTestingOverlayOptions
): void {
  try {
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

/**
 * Ensure the BR panel is visible while an agent drives the tab.
 * Safe to call on every helper / DevTools evaluate - does not bump nest.
 * Default handoff: if manual/observe open without oversee → wipe → agent.
 */
export function touchAgentTestingOverlay(title?: string): void {
  openQaDiagGate({ reason: "overlay-touch" });
  if (settling) {
    abandonSettleForRearch();
  }
  const kind = getSessionKind();
  if (active && (kind === "manual" || kind === "observe")) {
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
  });
  setQaDiagLoggerMode(isLoggerStyleSession(target));
  setAgentTestingHtmlFlag(shouldBlockPageClicks(target));
  setTitle(resolved);
  setResultBadge("neutral");
  setHint(hintForSessionKind(target));
  setActivityPhase("running");
  if (!wipe) {
    pushLogEntry({
      atMs: performance.now(),
      timeLabel: new Date().toLocaleTimeString("en-GB", { hour12: false }),
      label: `Handoff → ${target} (oversee)`,
      outcome: "ok",
      kind: "system",
    });
  } else {
    pushLogEntry({
      atMs: performance.now(),
      timeLabel: new Date().toLocaleTimeString("en-GB", { hour12: false }),
      label: `Handoff → ${target} (fresh)`,
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
  capturePaused = false;
  clearMcpPending();
  signalMcpConnect();
  setAgentTestingHtmlFlag(true);
  setQaDiagLoggerMode(false);
  const resolved = titleForSessionKind("agent");
  sessionTitle = resolved;
  setTitle(resolved);
  setHint(hintForSessionKind("agent"));
  pushLogEntry({
    atMs: performance.now(),
    timeLabel: new Date().toLocaleTimeString("en-GB", { hour12: false }),
    label: `Escalated observe → agent (${reason})`,
    outcome: "ok",
    kind: "observe-escalate",
  });
  setActivityPhase("running", "escalated");
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
  setAgentTestingHtmlFlag(false);
  setQaDiagLoggerMode(true);
  const resolved = titleForSessionKind("observe");
  sessionTitle = resolved;
  setTitle(resolved);
  setHint(hintForSessionKind("observe"));
  pushLogEntry({
    atMs: performance.now(),
    timeLabel: new Date().toLocaleTimeString("en-GB", { hour12: false }),
    label: "Unlocked → observe",
    outcome: "ok",
    kind: "system",
  });
  setActivityPhase("running");
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
    openQaDiagGate({ logger: false, reason: "agent-prompt" });
  }
  const body =
    trimmed.length > 160 ? `${trimmed.slice(0, 158)}…` : trimmed;
  setAwaitingUserReply(true);
  armMcpPendingTimeout();
  pushLogEntry({
    atMs: performance.now(),
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
  });
  setQaDiagLoggerMode(isLoggerStyleSession(kind));
  setSessionKind(kind);
  setAwaitingUserReply(false);
  clearMcpPending();
  // Fresh open (not oversee) — green field unless hydrate already restored rows.
  if (!active) {
    // Keep hydrate-restored logEntries; otherwise wipe leftovers after forceClear races.
    if (logEntries.length === 0) {
      timelineKeys = [];
      lastStepAt = 0;
    }
  } else {
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
  setAgentTestingHtmlFlag(shouldBlockPageClicks(kind));
  setTitle(resolved);
  setResultBadge("neutral");
  setHint(hintForSessionKind(kind));
  if (!sessionStartedAt) {
    sessionStartedAt = Date.now();
    lastStepAt = sessionStartedAt;
  }
  resetElapsedClock(!capturePaused);
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
}

/** Soft dismiss — close gate, stop capture, hide panel, keep DOM (no remount flash). */
export function softCloseAgentTestingLogger(reason = "soft-close"): void {
  if (!canUserDismissSession() && (active || settling)) {
    return;
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
  }
  setQaSessionLock(null);
  setActivityPhase("idle");
  syncSessionChrome();
}

/**
 * Bug-icon toggle: open MANUAL TEST, or close+stop when manual popup open.
 * Observe: calm chip — does not toggle-close (use Close ×). Agent lock: no-op.
 */
export function toggleAgentTestingLogger(): void {
  if (isAgentLocked() && (active || settling)) {
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
 * User free-text message → log + timeline + ring.
 * Manual = note only; agent awaiting reply = PO answer to agent-prompt.
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
  const label = awaiting ? `Reply: ${body}` : `Message: ${body}`;
  pushLogEntry({
    atMs: performance.now(),
    timeLabel: new Date().toLocaleTimeString("en-GB", { hour12: false }),
    label,
    outcome: "ok",
    kind: "user-message",
  });
  markAgentTestingTimeline(`user-message:${Date.now()}`, "ok");
  if (awaiting) {
    setAwaitingUserReply(false);
    clearMcpPending();
    setActivityPhase("running", "reply");
  } else if (!capturePaused) {
    setActivityPhase("running", "user-message");
  }
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
    nest = 0;
    active = false;
    settling = false;
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
    refreshMcpStatusDom();
  } catch {
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
    toggleLogger: toggleAgentTestingLogger,
    handoff: handoffQaSession,
    askUser: askUserInQa,
    escalateObserve: escalateObserveToAgentSession,
    unlockObserve: unlockObserveSession,
    resetSession: resetManualSession,
    mcpStatus: getAgentTestingMcpConnectionStatus,
    appendPoNote: appendAgentTestingUserMessage,
    log: logAgentTestingOverlay,
    logStep: logAgentTestingStep,
    logHelper: logAgentTestingHelper,
    ringAlarm: ringAgentTestingAlarm,
    flagCursorWeird: flagAgentTestingCursorWeird,
    flagScrollIssue: flagAgentTestingScrollIssue,
    peekPoSignal,
    consumePoSignal,
    setTimeline: setAgentTestingTimeline,
    markTimeline: markAgentTestingTimeline,
    downloadDump: () => downloadAgentTestingDump(),
    isActive: isAgentTestingOverlayActive,
  };
  bindOverlayApi(api);
  installPoSignalWindowApis();
  installPoSignalPlaybackHaltWindowApis();
  ensureMcpPendingHandler();
  if (typeof window !== "undefined") {
    window.__studioDownloadAgentTestingDump = () => downloadAgentTestingDump();
    window.__protoDownloadAgentTestingDump = () => downloadAgentTestingDump();
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
  }
  // Quiet restore — no remount thrash; show panel if gate was open.
  if (hydrated.open) {
    restoreLoggerFromRing(hydrated.ring);
    openAgentTestingLogger({ kind: "manual" });
  }
}

function restoreLoggerFromRing(events: QaDiagRingEvent[]): void {
  const restored: AgentTestingLogEntry[] = [];
  for (const e of events) {
    if (e.kind === "gate-open" || e.kind === "gate-close") continue;
    restored.push({
      atMs: e.atMs,
      timeLabel: e.atIso
        ? new Date(e.atIso).toLocaleTimeString("en-GB", { hour12: false })
        : new Date().toLocaleTimeString("en-GB", { hour12: false }),
      label: e.label || e.text || e.kind,
      outcome: "ok",
      kind:
        e.kind === "user-message" || e.kind === "po-note"
          ? "user-message"
            : e.kind === "click" ||
              e.kind === "nav" ||
              e.kind === "system" ||
              e.kind === "init" ||
              e.kind === "alarm" ||
              e.kind === "agent-prompt" ||
              e.kind === "observe-escalate"
            ? (e.kind as AgentTestingLogEntry["kind"])
            : e.kind === "capture-pause" || e.kind === "capture-start"
              ? "system"
              : "info",
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
    __studioQaPendingTimeoutMs?: number;
  }
}
