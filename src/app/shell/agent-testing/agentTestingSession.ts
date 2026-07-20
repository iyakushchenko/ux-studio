/**
 * QA overlay session kind — single SSoT (no mode soup).
 *
 * State machine (one overlay · one gate · explicit kind):
 *
 *   idle ──bug/open──► manual (paused) ──Resume──► manual (capturing)
 *     │                    │
 *     │                    ├──handoff(oversee)──► agent | observe
 *     │                    └──handoff(!oversee)──► wipe → agent
 *     │
 *     ├──start/touch──► agent (locked)
 *     └──open(observe)──► observe (capturing, soft bug)
 *                              │
 *                              └──escalate(alarm)──► agent (locked)
 *                                                       │
 *                                                       └──unlock──► observe | ask proceed?
 *
 * Bug chip: amber active = manual only; calm idle; disabled = agent lock;
 * observe = soft/calm active (`data-studio-qa-lock=observe`).
 */

export type AgentTestingSessionKind = "manual" | "agent" | "observe";

/** @deprecated Use AgentTestingSessionKind */
export type AgentTestingSessionOwner = AgentTestingSessionKind;

export type OpenQaLoggerOptions = {
  kind?: AgentTestingSessionKind;
  /** Keep log/ring when agent connects; default wipe → agent. */
  oversee?: boolean;
  title?: string;
  /** Internal: page-refresh hydrate — keep restored log/ring + elapsed. */
  hydrateRestore?: boolean;
};

export type QaHandoffOptions = {
  /** Keep context (log/ring/user-messages). Default false = wipe → agent. */
  oversee?: boolean;
  /** Target kind when overseeing (default agent). */
  kind?: "agent" | "observe";
  title?: string;
};

type SessionMemory = {
  kind: AgentTestingSessionKind;
  /** Observe → agent escalate latch (for unlock-back). */
  escalatedFromObserve: boolean;
  awaitingUserReply: boolean;
};

const MEMORY_KEY = "__studioQaSessionMemory";

function memory(): SessionMemory {
  if (typeof window === "undefined") {
    const g = globalThis as typeof globalThis & {
      [MEMORY_KEY]?: SessionMemory;
    };
    if (!g[MEMORY_KEY]) {
      g[MEMORY_KEY] = {
        kind: "manual",
        escalatedFromObserve: false,
        awaitingUserReply: false,
      };
    }
    return g[MEMORY_KEY]!;
  }
  const w = window as Window & { [MEMORY_KEY]?: SessionMemory };
  if (!w[MEMORY_KEY]) {
    w[MEMORY_KEY] = {
      kind: "manual",
      escalatedFromObserve: false,
      awaitingUserReply: false,
    };
  }
  return w[MEMORY_KEY]!;
}

export function getSessionKind(): AgentTestingSessionKind {
  return memory().kind;
}

export function isAgentLocked(): boolean {
  return memory().kind === "agent";
}

/** User may Close / Reset / soft-dismiss (not agent-locked). */
export function canUserDismissSession(): boolean {
  return memory().kind !== "agent";
}

/** Bug icon toggles close only for manual (observe stays open until Close/X). */
export function bugIconClosesSession(): boolean {
  return memory().kind === "manual";
}

/** Gate logger mode — page clicks allowed (manual + observe). */
export function isLoggerStyleSession(kind = getSessionKind()): boolean {
  return kind === "manual" || kind === "observe";
}

/** Block page clicks (agent mid-flight). */
export function shouldBlockPageClicks(kind = getSessionKind()): boolean {
  return kind === "agent";
}

export function isAwaitingUserReply(): boolean {
  return memory().awaitingUserReply;
}

export function setAwaitingUserReply(on: boolean): void {
  memory().awaitingUserReply = on;
}

export function wasEscalatedFromObserve(): boolean {
  return memory().escalatedFromObserve;
}

export function titleForSessionKind(kind: AgentTestingSessionKind): string {
  switch (kind) {
    case "manual":
      return "MANUAL TEST";
    case "observe":
      return "OBSERVE";
    default:
      return "AGENT TESTING";
  }
}

export function hintForSessionKind(kind: AgentTestingSessionKind): string {
  switch (kind) {
    case "manual":
      return "MANUAL TEST — CAPTURE to start; Pause freezes the clock.";
    case "observe":
      return "OBSERVE — capturing clicks; Close × to dismiss.";
    default:
      return "AGENT TESTING — Pause freezes the clock; Alarm stops + investigates.";
  }
}

/**
 * Apply kind. Returns previous kind.
 * Does not wipe logs — callers own wipe vs oversee.
 */
export function setSessionKind(
  next: AgentTestingSessionKind,
  options?: { escalatedFromObserve?: boolean }
): AgentTestingSessionKind {
  const m = memory();
  const prev = m.kind;
  m.kind = next;
  if (typeof options?.escalatedFromObserve === "boolean") {
    m.escalatedFromObserve = options.escalatedFromObserve;
  } else if (next === "observe") {
    m.escalatedFromObserve = false;
  } else if (next === "manual") {
    m.escalatedFromObserve = false;
    m.awaitingUserReply = false;
  }
  return prev;
}

/** Observe → agent lock (Alarm / anomaly path). */
export function escalateObserveToAgent(): boolean {
  const m = memory();
  if (m.kind !== "observe") return false;
  m.kind = "agent";
  m.escalatedFromObserve = true;
  return true;
}

/** After agent work: unlock back to observe when escalated. */
export function unlockAgentToObserve(): boolean {
  const m = memory();
  if (m.kind !== "agent" || !m.escalatedFromObserve) return false;
  m.kind = "observe";
  m.escalatedFromObserve = false;
  m.awaitingUserReply = false;
  return true;
}

/** Resolve open options — default manual. */
export function resolveOpenKind(
  options?: OpenQaLoggerOptions | AgentTestingSessionKind
): AgentTestingSessionKind {
  if (typeof options === "string") return options;
  const k = options?.kind;
  if (k === "manual" || k === "agent" || k === "observe") return k;
  return "manual";
}

/** Handoff target when oversee. */
export function resolveHandoffKind(
  options?: QaHandoffOptions
): "agent" | "observe" {
  return options?.kind === "observe" ? "observe" : "agent";
}

/** Should wipe log/ring on agent connect? */
export function shouldWipeOnHandoff(options?: QaHandoffOptions): boolean {
  return options?.oversee !== true;
}

/** Test reset. */
export function resetQaSessionForTests(): void {
  const m = memory();
  m.kind = "manual";
  m.escalatedFromObserve = false;
  m.awaitingUserReply = false;
}
