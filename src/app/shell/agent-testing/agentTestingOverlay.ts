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
  formatActivityStatus,
  type AgentTestingActivityPhase,
  type AgentTestingSessionOwner,
} from "@/app/shell/agent-testing/agentTestingActivity";
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
const HISTORY_KEY = "protoAgentTestingOverlayHistory";
const HISTORY_MAX = 5;
const HISTORY_LINE_CAP = 12;
const DEFAULT_TITLE = "AGENT TESTING";
const MANUAL_TITLE = "MANUAL TEST";
const PREPARE_TITLE = "AGENT TESTING - preparing...";

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
  openLogger: () => void;
  /** Soft-close logger (keep DOM, close gate). */
  softClose: () => void;
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

type HistoryEntry = {
  title: string;
  endedAt: number;
  lines: string[];
};

let active = false;
let settling = false;
/** Free-form logger from version chip — page clicks allowed, soft dismiss. */
let loggerSession = false;
/** Who owns the live panel: manual (user) vs agent mid-flight. */
let sessionOwner: AgentTestingSessionOwner = "agent";
/** Manual capture pause — gate stays open; ring/log appends skip (except user-message). */
let capturePaused = false;
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

function readHistory(): HistoryEntry[] {
  try {
    const raw = sessionStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e): e is HistoryEntry =>
        !!e &&
        typeof e === "object" &&
        typeof (e as HistoryEntry).title === "string" &&
        typeof (e as HistoryEntry).endedAt === "number" &&
        Array.isArray((e as HistoryEntry).lines)
    );
  } catch {
    return [];
  }
}

function pushHistory(entry: HistoryEntry): HistoryEntry[] {
  const next = [entry, ...readHistory()].slice(0, HISTORY_MAX);
  try {
    sessionStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  return next;
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

function armElapsedTimer(): void {
  clearElapsedTimer();
  if (!active || settling) return;
  const tick = () => {
    if (!active || settling) return;
    setElapsedLabel(formatElapsed(Date.now() - sessionStartedAt));
    refreshSitrepDom();
    maybeAutoFlagCursorIssue();
    maybeAutoFlagScrollIssue();
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
  const el = document.querySelector<HTMLElement>(
    ".studio-agent-testing-overlay__sitrep"
  );
  if (el) el.textContent = sitrep.line;
}

function renderTimeline(): void {
  if (!hasDomQuery()) return;
  const root = document.getElementById(ROOT_ID);
  const strip = root?.querySelector<HTMLElement>(
    ".studio-agent-testing-overlay__timeline"
  );
  if (!strip) return;
  strip.replaceChildren();
  if (timelineKeys.length === 0) {
    strip.hidden = true;
    return;
  }
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
  extras?: { code?: string; poSignal?: AgentTestingPoSignal | null }
): void {
  try {
    const dump = buildAgentTestingDump({
      reason,
      title: sessionTitle,
      elapsedMs: sessionStartedAt ? Date.now() - sessionStartedAt : 0,
      sitrepLine: lastSitrepLine,
      log: logEntries,
      code: extras?.code,
      timeline: timelineKeys.map((t) => ({
        key: t.key,
        outcome: String(t.outcome),
      })),
      poSignal: extras?.poSignal ?? peekPoSignal(),
      gateMode: sessionOwner,
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
 * PO Alarm = sequence / expected-steps mismatch (not vague “something weird”).
 * Primary: latch `__studioAgentTestingTakeover` for mid-flight MCP poll.
 * Secondary: session dump for postmortem.
 */
export function ringAgentTestingAlarm(note?: string): void {
  // HARD: stop Play in the same turn as the click — do not wait for smoke poll.
  haltPlaybackForPoSignal("po-alarm");
  const detail = note?.trim() ? ` — ${note.trim()}` : "";
  const signal = latchPoSignal({
    type: "alarm",
    code: "ALARM_SEQUENCE_MISMATCH",
    note,
    sitrepLine: lastSitrepLine,
    timeline: timelineKeys,
  });
  pushLogEntry(
    buildLogEntryFromStep({
      kind: "alarm",
      outcome: "soft-fail",
      label: `ALARM · ALARM_SEQUENCE_MISMATCH${detail} · consume __studioConsumePoSignal()`,
      beatId: signal.beat ?? undefined,
    })
  );
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
      }
    );
  } catch {
    /* ignore */
  }
  saveDump("alarm", { code: "ALARM_SEQUENCE_MISMATCH", poSignal: signal });
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
    sessionOwner
  );
  el.textContent = label;
  el.dataset.phase = activityPhase;
  root.dataset.phase = activityPhase;
  const live =
    activityPhase === "preparing" ||
    activityPhase === "running" ||
    activityPhase === "waiting" ||
    (sessionOwner === "manual" &&
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
    if (getMcpTestSession() || isQaDiagLoggerMode() || loggerSession) {
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

function renderHistory(entries: HistoryEntry[]): void {
  if (!hasDomQuery()) return;
  const root = document.getElementById(ROOT_ID);
  if (!root) return;
  let box = root.querySelector<HTMLElement>(
    ".studio-agent-testing-overlay__history"
  );
  const prior = entries.slice(1, HISTORY_MAX); // skip the just-pushed current
  if (prior.length === 0) {
    box?.remove();
    return;
  }
  if (!box) {
    box = document.createElement("div");
    box.className = "studio-agent-testing-overlay__history";
    const panel = root.querySelector(".studio-agent-testing-overlay__panel");
    panel?.appendChild(box);
  }
  box.replaceChildren();
  const label = document.createElement("p");
  label.className = "studio-agent-testing-overlay__history-label";
  label.textContent = "Recent";
  box.appendChild(label);
  const list = document.createElement("ul");
  for (const entry of prior.slice(0, 4)) {
    const li = document.createElement("li");
    const when = new Date(entry.endedAt).toLocaleTimeString("en-GB", {
      hour12: false,
    });
    li.textContent = `${when}  ${entry.title}`;
    list.appendChild(li);
  }
  box.appendChild(list);
}

function setQaSessionLock(mode: AgentTestingSessionOwner | null): void {
  if (typeof document === "undefined") return;
  const rootEl = document.documentElement;
  if (!rootEl?.dataset) return;
  if (mode === "agent" || mode === "manual") {
    rootEl.dataset.studioQaLock = mode;
  } else {
    delete rootEl.dataset.studioQaLock;
  }
}

/** Sync dismiss / capture / owner chrome after mode changes. */
function syncSessionChrome(): void {
  if (!hasDomQuery()) return;
  const root = document.getElementById(ROOT_ID);
  if (!root) return;
  root.dataset.owner = sessionOwner;
  root.dataset.capture = capturePaused ? "paused" : "on";
  setQaSessionLock(active || settling ? sessionOwner : null);

  const dismiss = root.querySelector<HTMLButtonElement>(
    ".studio-agent-testing-overlay__dismiss"
  );
  if (dismiss) {
    const locked = sessionOwner === "agent" && (active || settling);
    dismiss.hidden = locked;
    dismiss.disabled = locked;
    dismiss.title = locked
      ? "Agent session locked — cannot dismiss"
      : "Dismiss";
  }

  const captureBtn = root.querySelector<HTMLButtonElement>(
    ".studio-agent-testing-overlay__capture-toggle"
  );
  if (captureBtn) {
    const show = sessionOwner === "manual" && active;
    captureBtn.hidden = !show;
    captureBtn.disabled = !show;
    captureBtn.textContent = capturePaused ? "Start" : "Pause";
    captureBtn.title = capturePaused
      ? "Resume capture (append to log/ring)"
      : "Pause capture (gate stays open; ring appends stop)";
  }

  ensureMessageUnderLog(root);
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
    input.placeholder = "Message — Enter to send";
    input.setAttribute("aria-label", "Message");
    input.name = "user-message";
  }
  if (submit) submit.textContent = "Send";
}

function toggleManualCapture(): void {
  if (sessionOwner !== "manual" || !active) return;
  capturePaused = !capturePaused;
  setActivityPhase(
    capturePaused ? "paused" : "running",
    capturePaused ? "capture off" : "capture on"
  );
  syncSessionChrome();
  appendQaDiagRing({
    kind: capturePaused ? "capture-pause" : "capture-start",
    text: capturePaused ? "paused" : "resumed",
    label: capturePaused ? "Capture paused" : "Capture resumed",
  });
}

function ensureRoot(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  if (typeof document.getElementById !== "function") return null;
  let root = document.getElementById(ROOT_ID);
  if (root) {
    syncAgentTestingNavClearance(ROOT_ID, root);
    ensureMessageUnderLog(root);
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
        <span class="studio-agent-testing-overlay__elapsed" title="Elapsed">0:00</span>
        <button type="button" class="studio-agent-testing-overlay__dismiss">Dismiss</button>
      </div>
      <p class="studio-agent-testing-overlay__hint">Page visible - clicks blocked. Mid-flight QA below.</p>
      <p class="studio-agent-testing-overlay__activity" data-phase="idle" data-live="false">Idle</p>
      <p class="studio-agent-testing-overlay__sitrep">sitrep — waiting for control panel</p>
      <div class="studio-agent-testing-overlay__timeline" hidden aria-label="Script timeline"></div>
      <div class="studio-agent-testing-overlay__actions">
        <button type="button" class="studio-agent-testing-overlay__capture-toggle" hidden title="Pause or resume capture">Pause</button>
        <button type="button" class="studio-agent-testing-overlay__alarm" title="Sequence / expected-steps mismatch — latches live PO signal for the running agent">Alarm</button>
        <button type="button" class="studio-agent-testing-overlay__cursor-flag" title="Flag cursor weird — latches live PO signal">Cursor</button>
        <button type="button" class="studio-agent-testing-overlay__scroll-flag" title="Flag scroll problem — latches live PO signal">Scroll</button>
        <button type="button" class="studio-agent-testing-overlay__dump" title="Download last dump JSON (secondary — prefer __studioConsumePoSignal)">Dump</button>
      </div>
      <ol class="studio-agent-testing-overlay__log"></ol>
      <form class="studio-agent-testing-overlay__note" autocomplete="off">
        <input type="text" class="studio-agent-testing-overlay__note-input" name="user-message" maxlength="280" placeholder="Message — Enter to send" aria-label="Message" />
        <button type="submit" class="studio-agent-testing-overlay__note-submit">Send</button>
      </form>
    </div>
  `;
  const dismiss = root.querySelector<HTMLButtonElement>(
    ".studio-agent-testing-overlay__dismiss"
  );
  dismiss?.addEventListener("click", () => {
    if (sessionOwner === "agent") return; // agent lock
    const api = window.__studioAgentTestingOverlay;
    if (loggerSession || isQaDiagLoggerMode() || api?.isActive?.()) {
      if (typeof api?.softClose === "function") {
        api.softClose();
      } else {
        softCloseAgentTestingLogger("dismiss");
      }
    } else if (typeof api?.forceClear === "function") {
      api.forceClear();
    } else {
      forceClearAgentTestingOverlay();
    }
  });
  root
    .querySelector<HTMLButtonElement>(
      ".studio-agent-testing-overlay__capture-toggle"
    )
    ?.addEventListener("click", () => {
      toggleManualCapture();
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
  // Manual pause: skip auto events; user-message still lands.
  if (
    capturePaused &&
    entry.kind !== "user-message" &&
    entry.kind !== "po-note"
  ) {
    return;
  }
  const coalesced = coalesceLogEntry(logEntries[logEntries.length - 1], entry);
  if (coalesced) {
    logEntries[logEntries.length - 1] = coalesced;
  } else {
    const withDuration =
      entry.durationMs == null && lastStepAt > 0
        ? { ...entry, durationMs: Math.max(0, entry.atMs - lastStepAt) }
        : entry;
    logEntries.push(withDuration);
    lastStepAt = entry.atMs;
  }
  if (logEntries.length > LOG_LIMIT) {
    logEntries = logEntries.slice(-LOG_LIMIT);
  }
  if (entry.touchpointKey) {
    markAgentTestingTimeline(entry.touchpointKey, entry.outcome);
  }
  if (active && !settling) {
    const snippet = (entry.label || entry.kind || "").trim().slice(0, 48);
    setActivityPhase("running", snippet || undefined);
  }
  appendQaDiagRing({
    kind: entry.kind,
    text: entry.label,
    label: entry.label,
    atMs: entry.atMs,
    beatId: entry.beatId,
    detail: entry.action,
  });
  renderLog();
  refreshSitrepDom();
  if (active) noteActivity();
}

function renderLog(): void {
  if (!hasDomQuery()) return;
  const root = document.getElementById(ROOT_ID);  const list = root?.querySelector<HTMLOListElement>(
    ".studio-agent-testing-overlay__log"
  );
  if (!list) return;
  list.replaceChildren();
  for (const entry of logEntries) {
    const li = document.createElement("li");
    li.dataset.outcome = entry.outcome;
    li.dataset.kind = entry.kind;
    li.textContent = formatLogRowText(entry);
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
  setElapsedLabel(formatElapsed(Date.now() - sessionStartedAt));
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
  const history = pushHistory({
    title: sessionTitle,
    endedAt: Date.now(),
    lines: logEntries.slice(-HISTORY_LINE_CAP).map(formatLogRowText),
  });
  renderHistory(history);
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
  loggerSession = false;
  sessionOwner = "agent";
  capturePaused = false;
  clearEnsureClearTimer();
  const resolved = resolveAgentTestingOverlayTitle(title);
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
  setAgentTestingHtmlFlag(true);
  setTitle(resolved);
  setResultBadge("neutral");
  setHint(
    "AGENT TESTING — page clicks blocked. Alarm/Cursor/Scroll/Dump only."
  );
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
    renderTimeline();
    consoleSeparator("START", resolved);
    logAgentTestingOverlay("overlay start");
  }
  armElapsedTimer();
  refreshSitrepDom();
  // DOM visibility gate - re-stamp if ensureRoot raced / orphan teardown.
  ensureAgentTestingOverlayDomArmed(resolved);
  syncSessionChrome();
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
  logAgentTestingOverlay("pre-arm: preparing...");
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
  logAgentTestingOverlay("pre-arm: ready");
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
 */
export function touchAgentTestingOverlay(title?: string): void {
  // Open gate only when actually arming / refreshing an agent session —
  // not when a read-only status helper was mistakenly wrapped (see helperOverlayArm).
  openQaDiagGate({ reason: "overlay-touch" });
  if (settling) {
    abandonSettleForRearch();
  }
  // Agent touch takes ownership even if a manual logger was open.
  if (active && sessionOwner === "manual") {
    loggerSession = false;
    sessionOwner = "agent";
    capturePaused = false;
    setAgentTestingHtmlFlag(true);
    setHint(
      "AGENT TESTING — page clicks blocked. Alarm/Cursor/Scroll/Dump only."
    );
    const agentTitle = resolveAgentTestingOverlayTitle(title ?? DEFAULT_TITLE);
    sessionTitle = agentTitle;
    setTitle(agentTitle);
    if (hasDomQuery()) {
      const root = document.getElementById(ROOT_ID);
      if (root) delete root.dataset.logger;
    }
    syncSessionChrome();
  }
  if (active) {
    noteActivity();
    const resolved = resolveAgentTestingOverlayTitle(title);
    if (title?.trim()) {
      sessionTitle = resolved;
      setTitle(resolved);
    }
    // Repair invisible DOM (HMR / orphan teardown / z-index race).
    if (!isAgentTestingOverlayDomVisible()) {
      ensureAgentTestingOverlayDomArmed(resolved);
    }
    syncSessionChrome();
    return;
  }
  startAgentTestingOverlay(title);
}

/**
 * Version-chip free-form logger — MANUAL TEST, page clicks allowed, soft dismiss.
 */
export function openAgentTestingLogger(title?: string): void {
  if (sessionOwner === "agent" && (active || settling)) {
    // Agent lock — ignore manual open mid-flight.
    return;
  }
  openQaDiagGate({ logger: true, reason: "version-chip" });
  setQaDiagLoggerMode(true);
  loggerSession = true;
  sessionOwner = "manual";
  capturePaused = false;
  if (settling) abandonSettleForRearch();
  const resolved = resolveAgentTestingOverlayTitle(
    title?.trim() || MANUAL_TITLE
  );
  sessionTitle = resolved;
  const root = ensureRoot();
  if (root) {
    root.dataset.active = "true";
    root.dataset.settling = "false";
    root.dataset.logger = "true";
    delete root.dataset.result;
    syncAgentTestingNavClearance(ROOT_ID, root);
  }
  active = true;
  settling = false;
  nest = Math.max(nest, 1);
  setAgentTestingHtmlFlag(false); // do not block page
  setTitle(resolved);
  setResultBadge("neutral");
  setHint(
    "MANUAL TEST — page clicks allowed. Pause capture or Send a message below."
  );
  setActivityPhase("running", "logger");
  syncSessionChrome();
  writePersist(resolved);
  armElapsedTimer();
  if (!sessionStartedAt) {
    sessionStartedAt = Date.now();
    lastStepAt = sessionStartedAt;
  }
  noteActivity();
  refreshSitrepDom();
  refreshActivityDom();
  renderLog();
}

/** Soft dismiss — close gate, hide panel, keep DOM (no remount flash next open). */
export function softCloseAgentTestingLogger(reason = "soft-close"): void {
  if (sessionOwner === "agent" && (active || settling)) {
    // Agent lock — user cannot soft-dismiss.
    return;
  }
  closeQaDiagGate({ reason });
  loggerSession = false;
  sessionOwner = "manual";
  capturePaused = false;
  setQaDiagLoggerMode(false);
  nest = 0;
  active = false;
  settling = false;
  settleResult = "neutral";
  clearSafetyTimer();
  clearIdleTimer();
  clearSettleTimer();
  clearEnsureClearTimer();
  clearElapsedTimer();
  clearPersist();
  unbindBeforeUnload();
  unbindVisibility();
  hideOverlayDom();
  const root = document.getElementById(ROOT_ID);
  if (root) {
    delete root.dataset.logger;
    delete root.dataset.owner;
  }
  setActivityPhase("idle");
  syncSessionChrome();
}

/**
 * User free-text message → log + timeline + ring.
 * Kind `user-message` — treat with grain of salt (manual note).
 */
export function appendAgentTestingUserMessage(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  if (!active) {
    openAgentTestingLogger();
  } else if (!isQaDiagGateOpen()) {
    openQaDiagGate({ logger: sessionOwner === "manual", reason: "user-message" });
  }
  const body =
    trimmed.length > 120 ? `${trimmed.slice(0, 118)}…` : trimmed;
  const label = `User message (manual note — treat with grain of salt): ${body}`;
  pushLogEntry({
    atMs: performance.now(),
    timeLabel: new Date().toLocaleTimeString("en-GB", { hour12: false }),
    label,
    outcome: "ok",
    kind: "user-message",
  });
  markAgentTestingTimeline(`user-message:${Date.now()}`, "ok");
  if (!capturePaused) {
    setActivityPhase("running", "user-message");
  }
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
    loggerSession = false;
    sessionOwner = "agent";
    capturePaused = false;
    closeQaDiagGate({ reason: "force-clear" });
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
  } catch {
    try {
      closeQaDiagGate({ reason: "force-clear" });
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
  if (typeof window !== "undefined") {
    window.__studioDownloadAgentTestingDump = () => downloadAgentTestingDump();
    window.__protoDownloadAgentTestingDump = () => downloadAgentTestingDump();
    window.__studioOpenQaLogger = () => openAgentTestingLogger();
    window.__studioAppendPoNote = (text: string) =>
      appendAgentTestingUserMessage(String(text ?? ""));
    window.__studioQaDiagGateOpen = () => isQaDiagGateOpen();
  }
  // Quiet restore — no remount thrash; show panel if gate was open.
  if (hydrated.open) {
    restoreLoggerFromRing(hydrated.ring);
    openAgentTestingLogger(MANUAL_TITLE);
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
          : e.kind === "capture-pause" || e.kind === "capture-start"
            ? "info"
            : e.kind === "po-note"
              ? "user-message"
              : "info",
    });
  }
  logEntries = restored.slice(-LOG_LIMIT);
  replaceQaDiagRing(events);
}

export function uninstallAgentTestingOverlayApi(): void {
  nest = 0;
  active = false;
  settling = false;
  settleReload = false;
  settleResult = "neutral";
  logEntries = [];
  timelineKeys = [];
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
    delete window.__studioOpenQaLogger;
    delete window.__studioAppendPoNote;
    delete window.__studioQaDiagGateOpen;
  }
}

declare global {
  interface Window {
    __protoAgentTestingOverlay?: OverlayApi;
    __studioAgentTestingOverlay?: OverlayApi;
    __studioDownloadAgentTestingDump?: () => boolean;
    __protoDownloadAgentTestingDump?: () => boolean;
    __studioOpenQaLogger?: () => void;
    __studioAppendPoNote?: (text: string) => boolean;
    __studioQaDiagGateOpen?: () => boolean;
  }
}
