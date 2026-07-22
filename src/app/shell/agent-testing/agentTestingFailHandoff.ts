/**
 * FAIL / diagnostic → agent takeover handshake (hard sequence).
 *
 * 1) Pause progress immediately
 * 2) Log: "Caught error. Handing off to agent...."
 * 3) Wait for **real** agent latch (touch / consume / handoff confirm)
 * 4) Log: "Agent take over confirmed. In progress"
 * 5) Log: "Please wait... Agent will resume on completion"
 *
 * Never emit (4) without a confirmed handshake.
 */

export type FailHandoffPhase =
  | "idle"
  | "handing-off"
  | "confirmed"
  | "waiting-resume";

export type FailHandoffState = {
  phase: FailHandoffPhase;
  reason: string;
  atMs: number;
  handshakeAtMs: number | null;
};

type LogFn = (label: string, outcome?: "ok" | "notice" | "fail") => void;
type PauseFn = (reason: string) => void;

const MEMORY_KEY = "__studioQaFailHandoffMemory";

type Memory = {
  phase: FailHandoffPhase;
  reason: string;
  atMs: number;
  handshakeAtMs: number | null;
};

function memory(): Memory {
  if (typeof window === "undefined") {
    const g = globalThis as typeof globalThis & { [MEMORY_KEY]?: Memory };
    if (!g[MEMORY_KEY]) {
      g[MEMORY_KEY] = {
        phase: "idle",
        reason: "",
        atMs: 0,
        handshakeAtMs: null,
      };
    }
    return g[MEMORY_KEY]!;
  }
  const w = window as Window & { [MEMORY_KEY]?: Memory };
  if (!w[MEMORY_KEY]) {
    w[MEMORY_KEY] = {
      phase: "idle",
      reason: "",
      atMs: 0,
      handshakeAtMs: null,
    };
  }
  return w[MEMORY_KEY]!;
}

export function peekFailHandoff(): FailHandoffState {
  const m = memory();
  return {
    phase: m.phase,
    reason: m.reason,
    atMs: m.atMs,
    handshakeAtMs: m.handshakeAtMs,
  };
}

export function resetFailHandoffForTests(): void {
  const m = memory();
  m.phase = "idle";
  m.reason = "";
  m.atMs = 0;
  m.handshakeAtMs = null;
}

/**
 * Start FAIL handoff. Idempotent while already handing-off / confirmed.
 * Always pauses via callback.
 */
export function beginFailHandoff(options: {
  reason: string;
  pause: PauseFn;
  log: LogFn;
}): FailHandoffState {
  const m = memory();
  options.pause(options.reason);
  // Already awaiting handshake — pause only, do not re-spam the log.
  if (m.phase === "handing-off") {
    return peekFailHandoff();
  }
  // New FAIL while confirmed/waiting-resume → re-arm a fresh handshake.
  m.phase = "handing-off";
  m.reason = options.reason.trim() || "fail";
  m.atMs = Date.now();
  m.handshakeAtMs = null;
  options.log("Caught error. Handing off to agent....", "fail");
  return peekFailHandoff();
}

/**
 * Agent handshake confirm — only after real agent touch/consume/handoff.
 * Returns false if not in handing-off (no fake confirm).
 */
export function confirmAgentFailTakeover(options: {
  source: string;
  log: LogFn;
}): boolean {
  const m = memory();
  if (m.phase !== "handing-off") return false;
  m.phase = "confirmed";
  m.handshakeAtMs = Date.now();
  options.log(
    `Agent take over confirmed. In progress (${options.source.trim() || "agent"})`,
    "ok"
  );
  options.log("Please wait... Agent will resume on completion", "ok");
  m.phase = "waiting-resume";
  return true;
}

/** Clear handshake after agent resume / forceClear. */
export function clearFailHandoff(options?: { log?: LogFn }): void {
  const m = memory();
  const was = m.phase;
  m.phase = "idle";
  m.reason = "";
  m.atMs = 0;
  m.handshakeAtMs = null;
  if (was !== "idle" && options?.log) {
    options.log("Fail handoff cleared", "ok");
  }
}

export function isFailHandoffPending(): boolean {
  return memory().phase === "handing-off";
}

export function isFailHandoffActive(): boolean {
  const p = memory().phase;
  return p === "handing-off" || p === "confirmed" || p === "waiting-resume";
}
