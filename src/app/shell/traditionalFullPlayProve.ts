/**
 * One prove entrypoint — full Traditional continuous Play (CJM).
 *
 * Unlike `__protoRunTraditionalPlaySmoke` (tears down overlay via withMcpTestSession),
 * this path ALWAYS forceClear → fresh arm → Play → assert peak (playlist total) +
 * play-end at start → pauseForAgentLeave, and **keeps** QA overlay visible for Save Log.
 */

import {
  DEFAULT_PREARM_MS,
  forceClearAgentTestingOverlay,
  logAgentTestingOverlay,
  pauseForAgentLeave,
  preArmAgentTestingOverlay,
  startAgentTestingOverlay,
  touchAgentTestingOverlay,
  type AgentLeavePauseResult,
} from "@/app/shell/agent-testing";
import {
  beginMcpTestSession,
  endMcpTestSession,
  getMcpTestSession,
  requestMcpTestAbort,
} from "@/app/shell/mcpTestGuard";
import {
  disableCursorQaEyes,
  enableCursorQaEyes,
} from "@/app/shell/playbackCursorDiagnostic";
import type { PlayEndAtStartAssertResult } from "@/app/shell/playbackDiag";
import {
  runPlayJourneyToStartSmoke,
  type PlayJourneySmokeResult,
} from "@/app/shell/playJourneySmoke";

/**
 * Full Traditional playlist with login beat present.
 * Logged-in Sarah skips login → peak total is one less (assert vs smoke peak total).
 */
export const TRADITIONAL_FULL_PLAY_EXPECTED_PEAK = 13;

export const TRADITIONAL_FULL_PLAY_PROVE_DEFAULT_TIMEOUT_MS = 180_000;

export type TraditionalFullPlayProvePeak = {
  visible: number;
  total: number;
  counter: string | null;
};

export type TraditionalFullPlayProveResult = {
  pass: boolean;
  peak: TraditionalFullPlayProvePeak;
  end: PlayEndAtStartAssertResult | null;
  errors: string[];
  leave?: AgentLeavePauseResult;
  smoke?: PlayJourneySmokeResult;
};

export type TraditionalFullPlayProveOptions = {
  timeoutMs?: number;
  softFailPoAlarm?: boolean;
  /**
   * Expected STEPS peak total. Default {@link TRADITIONAL_FULL_PLAY_EXPECTED_PEAK}.
   * When login is skipped, pass the observed smoke total (or omit and accept
   * peak.visible >= peak.total && peak.total >= 12).
   */
  expectedPeak?: number;
  /** When true (default), accept peak.total from smoke if ≥12 (login-skip safe). */
  allowLoginSkipPeak?: boolean;
  preArmMs?: number;
  delay?: (ms: number) => Promise<void>;
};

function delayMs(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function parsePeak(
  counter: string | null | undefined,
  visibleFallback = 0
): TraditionalFullPlayProvePeak {
  if (!counter) {
    return { visible: visibleFallback, total: 0, counter: null };
  }
  const match = /(\d+)\s*\/\s*(\d+)/.exec(counter);
  if (!match) {
    return { visible: visibleFallback, total: 0, counter };
  }
  return {
    visible: Number(match[1]),
    total: Number(match[2]),
    counter,
  };
}

/**
 * Full Traditional continuous Play prove — keep-overlay path for Save Log.
 *
 * Window: `__studioRunTraditionalFullPlayProve` / `__protoRunTraditionalFullPlayProve`.
 */
export async function runTraditionalFullPlayProve(
  options?: TraditionalFullPlayProveOptions
): Promise<TraditionalFullPlayProveResult> {
  const expectedPeak =
    options?.expectedPeak ?? TRADITIONAL_FULL_PLAY_EXPECTED_PEAK;
  const allowLoginSkip = options?.allowLoginSkipPeak !== false;
  const timeoutMs =
    options?.timeoutMs ?? TRADITIONAL_FULL_PLAY_PROVE_DEFAULT_TIMEOUT_MS;
  const delay = options?.delay ?? delayMs;
  const errors: string[] = [];

  forceClearAgentTestingOverlay();

  const prior = getMcpTestSession();
  if (prior) {
    requestMcpTestAbort("superseded");
    endMcpTestSession(prior.id);
  }
  const sessionId = beginMcpTestSession("traditional-full-play-prove");
  enableCursorQaEyes();

  let smoke: PlayJourneySmokeResult | undefined;
  let leave: AgentLeavePauseResult | undefined;
  let peak: TraditionalFullPlayProvePeak = {
    visible: 0,
    total: 0,
    counter: null,
  };
  let end: PlayEndAtStartAssertResult | null = null;

  try {
    startAgentTestingOverlay("AGENT TESTING — traditional full play prove");
    await preArmAgentTestingOverlay({
      preArmMs: options?.preArmMs ?? DEFAULT_PREARM_MS,
      title: "AGENT TESTING — preparing…",
    });
    touchAgentTestingOverlay("AGENT TESTING — traditional full play prove");
    logAgentTestingOverlay("prove: traditional-full-play (keep overlay)");

    smoke = await runPlayJourneyToStartSmoke({
      orchestraMode: "traditional-cjm",
      startBeatId: "traditional-plp",
      startScreenId: "plp",
      timeoutMs,
      softFailPoAlarm: options?.softFailPoAlarm,
      delay,
      ensureClean: () => {
        (
          window as Window & { __protoEnsureCleanStudio?: () => void }
        ).__protoEnsureCleanStudio?.();
      },
      setOrchestraMode: (mode) => {
        (
          window as Window & {
            __protoSetOrchestraMode?: (m: string) => void;
          }
        ).__protoSetOrchestraMode?.(mode);
      },
      setJourneyMode: (enabled) =>
        Boolean(
          (
            window as Window & {
              __protoSetJourneyMode?: (on: boolean) => boolean;
            }
          ).__protoSetJourneyMode?.(enabled)
        ),
      triggerTransport: (action) =>
        Boolean(
          (
            window as Window & {
              __protoTriggerTransport?: (a: string) => boolean;
            }
          ).__protoTriggerTransport?.(action)
        ),
      getState: () =>
        (
          window as Window & {
            __protoStudioState?: () => PlayJourneySmokeResult["state"];
          }
        ).__protoStudioState?.(),
    });

    const fromCounter = parsePeak(smoke.peakCounter, smoke.peakVisible ?? 0);
    peak = {
      visible: smoke.peakVisible ?? fromCounter.visible,
      total: fromCounter.total || expectedPeak,
      counter:
        smoke.peakCounter ??
        (smoke.peakVisible != null
          ? `${smoke.peakVisible} / ${fromCounter.total || expectedPeak}`
          : null),
    };
    end = smoke.assert ?? null;

    if (!smoke.pass) {
      errors.push(smoke.reason ?? "play-smoke-failed");
    }

    const reachedEnd = peak.visible >= peak.total && peak.total > 0;
    const peakOk = allowLoginSkip
      ? reachedEnd && peak.total >= expectedPeak - 1
      : peak.visible >= expectedPeak && peak.total === expectedPeak;
    if (!peakOk) {
      errors.push(
        `peak-not-${expectedPeak}: got ${peak.visible}/${peak.total}` +
          (peak.counter ? ` (${peak.counter})` : "")
      );
    }
    if (!end?.pass) {
      errors.push(end?.reason ?? "play-end-at-start-failed");
    }

    leave = pauseForAgentLeave();
    if (!leave.ok) {
      errors.push(`leave-failed:${leave.reason ?? "unknown"}`);
    }

    const pass = errors.length === 0;
    logAgentTestingOverlay(
      pass
        ? `prove PASS · peak ${peak.visible}/${peak.total} · play-end at start`
        : `prove FAIL · ${errors.join("; ")}`
    );

    return {
      pass,
      peak,
      end,
      errors,
      leave,
      smoke,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(`exception:${msg}`);
    try {
      leave = pauseForAgentLeave();
    } catch {
      /* hang-safe */
    }
    return { pass: false, peak, end, errors, leave, smoke };
  } finally {
    try {
      disableCursorQaEyes();
    } catch {
      /* hang-safe */
    }
    endMcpTestSession(sessionId);
  }
}
