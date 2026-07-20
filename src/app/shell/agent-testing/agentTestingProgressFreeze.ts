/**
 * FAIL handoff → freeze ALL journey progress until agent confirm + clear.
 * Play, SF, jump, and camera must refuse while active.
 */

import { isFailHandoffPending } from "@/app/shell/agent-testing/agentTestingFailHandoff";

const FREEZE_KEY = "__studioQaProgressFreezeMemory";

type FreezeMemory = {
  /** Extra freeze latch (e.g. explicit Pause during handoff). */
  forced: boolean;
  reason: string;
  atMs: number;
};

function memory(): FreezeMemory {
  if (typeof window === "undefined") {
    const g = globalThis as typeof globalThis & { [FREEZE_KEY]?: FreezeMemory };
    if (!g[FREEZE_KEY]) {
      g[FREEZE_KEY] = { forced: false, reason: "", atMs: 0 };
    }
    return g[FREEZE_KEY]!;
  }
  const w = window as Window & { [FREEZE_KEY]?: FreezeMemory };
  if (!w[FREEZE_KEY]) {
    w[FREEZE_KEY] = { forced: false, reason: "", atMs: 0 };
  }
  return w[FREEZE_KEY]!;
}

export function setQaProgressFreeze(reason: string): void {
  const m = memory();
  m.forced = true;
  m.reason = reason.trim() || "freeze";
  m.atMs = Date.now();
}

export function clearQaProgressFreeze(): void {
  const m = memory();
  m.forced = false;
  m.reason = "";
  m.atMs = 0;
}

/**
 * True while FAIL handoff awaits confirm, or explicit freeze.
 * After agent confirm (`waiting-resume`), freeze lifts so agent can drive.
 */
export function isQaProgressFrozen(): boolean {
  if (memory().forced) return true;
  try {
    return isFailHandoffPending();
  } catch {
    return false;
  }
}

export function peekQaProgressFreeze(): {
  frozen: boolean;
  reason: string;
  atMs: number;
} {
  const m = memory();
  const handoff = isFailHandoffPending();
  return {
    frozen: m.forced || handoff,
    reason: m.forced
      ? m.reason
      : handoff
        ? "fail-handoff"
        : "",
    atMs: m.atMs,
  };
}
