/**
 * Mid-smoke PO signal poll (R15).
 *
 * Step-forward / Play runners call this each beat. Live latch is primary
 * (`__studioConsumePoSignal` / `__studioAgentTestingTakeover`); dump secondary.
 *
 * PO HARD process: Alarm / Cursor / Scroll → STOP smoke (structured fail with
 * diagSnapshot). Orchestrator: STOP → understand (ask PO if unclear) → FIX →
 * RESTART + prove that issue gone. Smokes cannot auto-fix; do not invent bugs.
 */

import {
  consumePoSignal,
  type AgentTestingPoSignal,
} from "@/app/shell/agent-testing/agentTestingPoSignal";
import { playbackDiagLog } from "@/app/shell/playbackDiag";

export type SmokePoPollHit = {
  hit: true;
  /** True → smoke must abort; agent owns stop→fix→reprove loop. */
  abort: boolean;
  reason?: string;
  signal: AgentTestingPoSignal;
};

export type SmokePoPollMiss = { hit: false };

export type SmokePoPollResult = SmokePoPollHit | SmokePoPollMiss;

export type SmokePoPollOptions = {
  /**
   * When true, Alarm logs + continues instead of aborting.
   * Default false — PO process: stop on Alarm.
   */
  continueOnAlarm?: boolean;
  /**
   * When true, Cursor/Scroll log + continue.
   * Default false — PO process: stop on Cursor/Scroll too (fix→reprove).
   */
  continueOnCursorScroll?: boolean;
  /** Pause Play transport before abort (toggle play while on-air). */
  pausePlay?: () => void;
  /** Label for diag / console (e.g. step index or play-smoke). */
  context?: string;
};

/**
 * Consume live PO latch once.
 * Default: Alarm + Cursor + Scroll all abort with structured fail + diagSnapshot.
 */
export function pollSmokePoSignal(
  options: SmokePoPollOptions = {}
): SmokePoPollResult {
  const signal = consumePoSignal();
  if (!signal) return { hit: false };

  const ctx = options.context?.trim() || "smoke";
  playbackDiagLog("info", `po-signal ${signal.type} (${ctx})`, {
    code: signal.code,
    beat: signal.beat,
    screen: signal.screen,
    counter: signal.counter,
  });

  const reason = `po-${signal.type}:${signal.code}`;
  const soft =
    signal.type === "alarm"
      ? !!options.continueOnAlarm
      : !!options.continueOnCursorScroll;

  try {
    options.pausePlay?.();
  } catch {
    /* hang-safe */
  }

  try {
    console.warn(
      "[PLAYBACK_DIAG] PO signal mid-smoke — STOP (fix→reprove required)",
      reason,
      {
        context: ctx,
        abort: !soft,
        beat: signal.beat,
        screen: signal.screen,
        diagSnapshot: signal.diagSnapshot,
        process: "stop → fix using diagSnapshot → restart + prove that issue gone",
      }
    );
  } catch {
    /* ignore */
  }

  if (soft) {
    try {
      console.warn(
        "[PLAYBACK_DIAG] PO signal notice (continuing — session still owns fix)",
        reason,
        ctx
      );
    } catch {
      /* ignore */
    }
    return { hit: true, abort: false, reason, signal };
  }

  return { hit: true, abort: true, reason, signal };
}
