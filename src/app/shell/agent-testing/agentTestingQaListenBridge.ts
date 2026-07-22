/**
 * QA listen DOM + pause helpers (extracted from overlay for hygiene).
 * Overlay supplies session mutators via deps — hang-safe.
 */

import {
  beginFailHandoff,
  clearFailHandoff,
  confirmAgentFailTakeover,
  isFailHandoffPending,
  peekFailHandoff,
} from "@/app/shell/agent-testing/agentTestingFailHandoff";
import { isQaProgressFrozen } from "@/app/shell/agent-testing/agentTestingProgressFreeze";
import type { PlaybackDiagnosticError } from "@/app/shell/playbackDiagnostic";
import { getOpenDiagnosticFlash } from "@/app/shell/playbackDiagnosticFlash";
import { latchPoSignal } from "@/app/shell/agent-testing/agentTestingPoSignal";
import { haltPlaybackForPoSignal } from "@/app/shell/agent-testing/agentTestingPlaybackHalt";
import { bumpMcpPendingForUserTyping } from "@/app/shell/agent-testing/agentTestingMcpStatus";
import { isAwaitingUserReply } from "@/app/shell/agent-testing/agentTestingSession";
import type { AgentTestingTimelineKey } from "@/app/shell/agent-testing/agentTestingTypes";
import {
  readQaMessageDraft,
  shouldBlockQaPlay,
  writeQaMessageDraft,
} from "@/app/shell/agent-testing/agentTestingListen";

export type QaListenLogEntry = {
  atMs: number;
  timeLabel: string;
  label: string;
  outcome: "ok" | "notice" | "fail";
  kind: string;
};

export type QaListenDeps = {
  rootId: string;
  isActive: () => boolean;
  isSettling: () => boolean;
  getCapturePaused: () => boolean;
  setCapturePaused: (v: boolean) => void;
  setSessionHadProgress: (v: boolean) => void;
  getDiagnosticBlocking: () => boolean;
  setDiagnosticBlocking: (v: boolean) => void;
  getLastSitrepLine: () => string;
  getTimelineKeys: () => AgentTestingTimelineKey[];
  pushLogEntry: (e: QaListenLogEntry) => void;
  pauseElapsedClock: () => void;
  armElapsedTimer: () => void;
  setActivityPhase: (phase: string, detail?: string) => void;
  syncCaptureWatch: () => void;
  syncSessionChrome: () => void;
  getLastUserTypingLogAt: () => number;
  setLastUserTypingLogAt: (v: number) => void;
  getLastBlockedPlayLogAt: () => number;
  setLastBlockedPlayLogAt: (v: number) => void;
};

export function pauseCaptureAndHalt(
  deps: QaListenDeps,
  reason: string,
  logLabel: string
): void {
  try {
    haltPlaybackForPoSignal(reason);
  } catch {
    /* hang-safe */
  }
  if (!deps.isActive() || deps.isSettling()) return;
  const wasPaused = deps.getCapturePaused();
  if (!wasPaused) {
    deps.pauseElapsedClock();
    deps.setCapturePaused(true);
    deps.setSessionHadProgress(true);
  }
  // Always push — identical consecutive system rows coalesce to ×N (HMR spam).
  // Skip chrome churn when already paused (hot invalidate multi-fire).
  deps.pushLogEntry({
    atMs: Date.now(),
    timeLabel: new Date().toLocaleTimeString("en-GB", { hour12: false }),
    label: logLabel,
    outcome:
      reason.includes("diag") || reason.includes("hmr") ? "notice" : "ok",
    kind: "system",
  });
  if (wasPaused && reason.includes("hmr")) return;
  deps.setActivityPhase("paused", reason);
  deps.armElapsedTimer();
  deps.syncCaptureWatch();
  deps.syncSessionChrome();
}

export function isDiagnosticOpenNow(deps: QaListenDeps): boolean {
  try {
    return Boolean(getOpenDiagnosticFlash()) || deps.getDiagnosticBlocking();
  } catch {
    return deps.getDiagnosticBlocking();
  }
}

export function shouldBlockPlayNow(deps: QaListenDeps): boolean {
  return shouldBlockQaPlay({
    overlayActive: deps.isActive() && !deps.isSettling(),
    capturePaused: deps.getCapturePaused(),
    diagnosticOpen: isDiagnosticOpenNow(deps),
    progressFrozen: isQaProgressFrozen(),
  });
}

export function noteBlockedPlayAttempt(deps: QaListenDeps): void {
  const now = Date.now();
  if (now - deps.getLastBlockedPlayLogAt() < 1200) return;
  deps.setLastBlockedPlayLogAt(now);
  const why = isQaProgressFrozen()
    ? "Play/SF ignored — FAIL handoff (Handing off to agent…); confirm takeover first"
    : isDiagnosticOpenNow(deps)
      ? "Play ignored — playback diagnostic open (Ack/consume first)"
      : "Play ignored — QA Pause (Resume first)";
  deps.pushLogEntry({
    atMs: now,
    timeLabel: new Date().toLocaleTimeString("en-GB", { hour12: false }),
    label: why,
    outcome: "notice",
    kind: "system",
  });
}

export function onPlaybackDiagnosticOpened(
  deps: QaListenDeps,
  error: PlaybackDiagnosticError
): void {
  deps.setDiagnosticBlocking(true);
  beginFailHandoff({
    reason: "diagnostic-open",
    pause: (r) =>
      pauseCaptureAndHalt(
        deps,
        r,
        `control-room · Alarm red / diagnostic — ${
          error.message.length > 80
            ? `${error.message.slice(0, 78)}…`
            : error.message
        }`
      ),
    log: (label, outcome) =>
      deps.pushLogEntry({
        atMs: Date.now(),
        timeLabel: new Date().toLocaleTimeString("en-GB", { hour12: false }),
        label,
        outcome: outcome ?? "fail",
        kind: "fail-handoff",
      }),
  });
  try {
    deps.pushLogEntry({
      atMs: Date.now(),
      timeLabel: new Date().toLocaleTimeString("en-GB", { hour12: false }),
      label: `playback-diag · DIAGNOSTIC — ${
        error.message.length > 100
          ? `${error.message.slice(0, 98)}…`
          : error.message
      }`,
      outcome: "fail",
      kind: "playback-diag",
    });
  } catch {
    /* hang-safe */
  }
  try {
    latchPoSignal({
      type: "diagnostic",
      code: "PLAYBACK_DIAGNOSTIC_OPEN",
      note: error.message,
      sitrepLine: deps.getLastSitrepLine(),
      timeline: deps.getTimelineKeys(),
    });
  } catch {
    /* hang-safe */
  }
}

/** Agent handshake after FAIL handoff — call from consume/touch/handoff. */
export function confirmFailHandoffFromAgent(
  deps: QaListenDeps,
  source: string
): boolean {
  if (!isFailHandoffPending()) return false;
  return confirmAgentFailTakeover({
    source,
    log: (label, outcome) =>
      deps.pushLogEntry({
        atMs: Date.now(),
        timeLabel: new Date().toLocaleTimeString("en-GB", { hour12: false }),
        label,
        outcome: outcome ?? "ok",
        kind: "fail-handoff",
      }),
  });
}

export function clearFailHandoffFromSession(deps?: QaListenDeps): void {
  clearFailHandoff(
    deps
      ? {
          log: (label, outcome) =>
            deps.pushLogEntry({
              atMs: Date.now(),
              timeLabel: new Date().toLocaleTimeString("en-GB", {
                hour12: false,
              }),
              label,
              outcome: outcome ?? "ok",
              kind: "fail-handoff",
            }),
        }
      : undefined
  );
}

export { peekFailHandoff, isFailHandoffPending };

export function focusMessageInput(
  rootId: string,
  root?: HTMLElement | null
): void {
  try {
    const el =
      root?.querySelector<HTMLInputElement>(
        ".studio-agent-testing-overlay__note-input"
      ) ??
      document
        .getElementById(rootId)
        ?.querySelector<HTMLInputElement>(
          ".studio-agent-testing-overlay__note-input"
        );
    if (!el) return;
    const draft = readQaMessageDraft();
    if (draft && !el.value) el.value = draft;
    window.setTimeout(() => {
      try {
        el.focus({ preventScroll: true });
      } catch {
        /* ignore */
      }
    }, 0);
  } catch {
    /* hang-safe */
  }
}

export function bindMessageListen(
  deps: QaListenDeps,
  root: HTMLElement
): void {
  const input = root.querySelector<HTMLInputElement>(
    ".studio-agent-testing-overlay__note-input"
  );
  if (!input || input.dataset.listenBound === "1") return;
  input.dataset.listenBound = "1";
  const draft = readQaMessageDraft();
  if (draft) input.value = draft;

  const onTyping = () => {
    writeQaMessageDraft(input.value ?? "");
    if (!isAwaitingUserReply()) return;
    const bumped = bumpMcpPendingForUserTyping();
    if (!bumped) return;
    const now = Date.now();
    if (now - deps.getLastUserTypingLogAt() < 2500) return;
    deps.setLastUserTypingLogAt(now);
    deps.pushLogEntry({
      atMs: now,
      timeLabel: new Date().toLocaleTimeString("en-GB", { hour12: false }),
      label: "user-typing · PENDING wait extended",
      outcome: "ok",
      kind: "system",
    });
    try {
      const w = window as Window & {
        __studioAgentTestingUserTyping?: { at: number; pending: true };
      };
      w.__studioAgentTestingUserTyping = { at: now, pending: true };
    } catch {
      /* ignore */
    }
  };

  input.addEventListener("input", onTyping);
  input.addEventListener("focus", onTyping);
}

/** Mutable deps so a single HMR listener stays current across overlay re-binds. */
let viteHmrDeps: QaListenDeps | null = null;
let viteHmrListenBound = false;

type ViteHotApi = {
  on: (event: string, cb: () => void) => void;
  dispose?: (cb: () => void) => void;
};

/**
 * One `vite:beforeUpdate` listener for the page lifetime.
 * Re-calling only refreshes deps — never stacks handlers (×24 spam root cause).
 * `hotApi` is for tests; production uses `import.meta.hot`.
 */
export function installViteHmrListen(
  deps: QaListenDeps,
  hotApi?: ViteHotApi | null
): void {
  viteHmrDeps = deps;
  try {
    const hot =
      hotApi === undefined
        ? (
            import.meta as ImportMeta & {
              hot?: ViteHotApi;
            }
          ).hot
        : hotApi ?? undefined;
    if (!hot || typeof hot.on !== "function") return;
    if (viteHmrListenBound) return;
    viteHmrListenBound = true;
    hot.on("vite:beforeUpdate", () => {
      const d = viteHmrDeps;
      if (!d || !d.isActive() || d.isSettling()) return;
      pauseCaptureAndHalt(
        d,
        "vite-hmr",
        "vite-hmr · capture/play paused (hot invalidate)"
      );
    });
    hot.dispose?.(() => {
      viteHmrListenBound = false;
      viteHmrDeps = null;
    });
  } catch {
    /* follow-up if HMR API unavailable */
  }
}

/** Test helper — reset HMR bind latch. */
export function resetViteHmrListenForTests(): void {
  viteHmrListenBound = false;
  viteHmrDeps = null;
}

/**
 * MCP phase → visible QA chat filter (HARD).
 * Diode + status line under Message already show live CONNECTING/CONNECTED/CONTROL.
 * Chat log only gets **meaningful** transitions — never flash spam.
 *
 * Log YES: ERROR · PENDING enter · CONTROL↔OBSERVE kind switch · leave ERROR
 * Log NO: CONNECTING · CONNECTED · first settle to CONTROL/OBSERVE · idle
 */
export function shouldLogMcpPhaseToChat(
  prevPhase: string,
  nextPhase: string
): boolean {
  const prev = (prevPhase || "").toLowerCase();
  const next = (nextPhase || "").toLowerCase();
  if (!next || next === "idle") return false;
  if (next === "connecting" || next === "connected") return false;
  if (next === prev) return false;

  if (next === "error") return true;
  if (prev === "error" && (next === "control" || next === "observe" || next === "pending")) {
    return true; // recovered from ERROR
  }
  if (next === "pending") return true; // PENDING start
  // PENDING leave is covered by Reply / timeout system rows — skip duplicate MCP row
  if (prev === "pending") return false;

  // Kind change only (observe ↔ control), not first land after flash
  const stablePrev =
    prev === "control" || prev === "observe" ? prev : null;
  if (
    (next === "control" || next === "observe") &&
    stablePrev &&
    stablePrev !== next
  ) {
    return true;
  }
  return false;
}

export function maybeLogMcpPhaseChange(
  deps: QaListenDeps,
  input: {
    phase: string;
    label?: string;
    lastLoggedPhase: string;
    setLastLoggedPhase: (p: string) => void;
  }
): void {
  const phase = input.phase ?? "";
  if (!deps.isActive()) {
    if (phase === "idle") input.setLastLoggedPhase("");
    return;
  }

  if (phase && phase !== "idle" && phase !== input.lastLoggedPhase) {
    const prev = input.lastLoggedPhase || "—";
    const shouldLog = shouldLogMcpPhaseToChat(prev, phase);
    // Always advance memory so we don't re-evaluate flash spam.
    input.setLastLoggedPhase(phase);
    if (shouldLog) {
      const outcome =
        phase === "error" ? "fail" : phase === "pending" ? "notice" : "ok";
      deps.pushLogEntry({
        atMs: Date.now(),
        timeLabel: new Date().toLocaleTimeString("en-GB", { hour12: false }),
        label: `MCP · ${formatMcpPhaseShort(prev)} → ${formatMcpPhaseShort(phase)}`,
        outcome,
        kind: "system",
      });
      if (phase === "error") {
        try {
          latchPoSignal({
            type: "mcp",
            code: "MCP_PHASE_CHANGE",
            note: input.label || "MCP ERROR",
            sitrepLine: deps.getLastSitrepLine(),
          });
        } catch {
          /* hang-safe */
        }
      }
    }
  } else if (phase === "idle") {
    input.setLastLoggedPhase("");
  }
  try {
    if (deps.getDiagnosticBlocking() && !getOpenDiagnosticFlash()) {
      deps.setDiagnosticBlocking(false);
    }
  } catch {
    /* ignore */
  }
}

function formatMcpPhaseShort(phase: string): string {
  const p = (phase || "").toLowerCase();
  if (!p || p === "—") return "—";
  if (p === "pending") return "PENDING";
  if (p === "error") return "ERROR";
  if (p === "observe") return "OBSERVE";
  if (p === "control") return "CONTROL";
  if (p === "connecting") return "CONNECTING";
  if (p === "connected") return "CONNECTED";
  return p.toUpperCase();
}
