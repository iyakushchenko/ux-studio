/**
 * Mid-smoke PO signal poll (R15).
 *
 * Step-forward / Play runners call this each beat. Live latch is primary
 * (`__studioConsumePoSignal` / `__studioAgentTestingTakeover`); dump secondary.
 * Alarm → abort smoke with diagSnapshot (optional soft-fail + log).
 */

import {
  consumePoSignal,
  type AgentTestingPoSignal,
} from "@/app/shell/agent-testing/agentTestingPoSignal";
import { playbackDiagLog } from "@/app/shell/playbackDiag";

export type SmokePoPollHit = {
  hit: true;
  abort: boolean;
  reason?: string;
  signal: AgentTestingPoSignal;
};

export type SmokePoPollMiss = { hit: false };

export type SmokePoPollResult = SmokePoPollHit | SmokePoPollMiss;

export type SmokePoPollOptions = {
  /** When true, Alarm logs + continues instead of aborting the smoke. */
  softFailAlarm?: boolean;
  /** Pause Play transport before abort (toggle play while on-air). */
  pausePlay?: () => void;
  /** Label for diag / console (e.g. step index or play-smoke). */
  context?: string;
};

/**
 * Consume live PO latch once. Alarm aborts by default; cursor/scroll soft-log.
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

  if (signal.type === "alarm") {
    try {
      options.pausePlay?.();
    } catch {
      /* hang-safe */
    }
    const reason = `po-alarm:${signal.code}`;
    try {
      console.warn(
        "[PLAYBACK_DIAG] PO Alarm mid-smoke — abort",
        reason,
        {
          context: ctx,
          beat: signal.beat,
          screen: signal.screen,
          diagSnapshot: signal.diagSnapshot,
        }
      );
    } catch {
      /* ignore */
    }
    if (options.softFailAlarm) {
      try {
        console.warn(
          "[PLAYBACK_DIAG] PO Alarm soft-fail (continuing)",
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

  // Cursor / Scroll — soft-fail + log; do not abort the matrix.
  try {
    console.warn(
      "[PLAYBACK_DIAG] PO signal soft mid-smoke",
      signal.type,
      signal.code,
      { context: ctx, beat: signal.beat, screen: signal.screen }
    );
  } catch {
    /* ignore */
  }
  return { hit: true, abort: false, signal };
}
