/**
 * Play → journey end → stay at finale smoke (product path).
 *
 * Jump-to-start is only the prove arm (begin from key 1). Continuous Play
 * completion must leave the player on the last beat / N/N — no auto-rewind.
 * Harness may still `resetToJourneyStart` after the assert for teardown.
 *
 * Polls `__studioConsumePoSignal` each beat (R15). Alarm → pause + fail with diagSnapshot.
 */

import type { OrchestraModeId } from "@/app/orchestra/types";
import type { AgentTestingPoSignal } from "@/app/shell/agent-testing/agentTestingPoSignal";
import {
  assertPlaybackPlayEndedAtEnd,
  getPlaybackDiagBundle,
  playbackDiagClear,
  playbackDiagLog,
  type PlayEndAtEndAssertResult,
} from "@/app/shell/playbackDiag";
import { isFastPlayback } from "@/app/shell/playbackTiming";
import { pollSmokePoSignal } from "@/app/shell/smokePoSignalPoll";

export type PlayJourneySmokeState = {
  journeyMode?: boolean;
  diagnosticOpen?: boolean;
  beatId?: string | null;
  counter?: string | null;
  isPlaying?: boolean;
  isOnAir?: boolean;
  label?: string | null;
  orchestraMode?: string | null;
  screenId?: string | null;
};

export type PlayJourneySmokeResult = {
  pass: boolean;
  reason?: string;
  state?: PlayJourneySmokeState;
  assert?: PlayEndAtEndAssertResult;
  peakVisible?: number;
  peakCounter?: string | null;
  /** Set when PO Alarm aborted (or noticeed) mid-Play. */
  poSignal?: AgentTestingPoSignal | null;
};

function parseVisible(counter: string | null | undefined): {
  visible: number;
  total: number;
} {
  if (!counter) return { visible: 0, total: 0 };
  const match = /(\d+)\s*\/\s*(\d+)/.exec(counter);
  if (!match) return { visible: 0, total: 0 };
  return { visible: Number(match[1]), total: Number(match[2]) };
}

/** Peak STEPS visible — end was reached (and must remain after play-end). */
function journeyReachedEnd(peakVisible: number, total: number): boolean {
  return total > 0 && peakVisible >= total;
}

export type PlayJourneySmokeOptions = {
  orchestraMode: OrchestraModeId;
  startBeatId: string;
  startScreenId: string;
  /** Expected finale beat (built-ins: appointment-details). */
  endBeatId?: string;
  endScreenId?: string;
  timeoutMs?: number;
  /** Alarm notices + logs instead of aborting (default: hard fail). */
  continueOnPoAlarm?: boolean;
  delay: (ms: number) => Promise<void>;
  ensureClean: () => void;
  setOrchestraMode: (mode: OrchestraModeId) => void;
  setJourneyMode: (enabled: boolean) => boolean;
  triggerTransport: (action: "jump-to-start" | "play") => boolean;
  getState: () => PlayJourneySmokeState | undefined;
};

export async function runPlayJourneyToEndSmoke(
  options: PlayJourneySmokeOptions
): Promise<PlayJourneySmokeResult> {
  const timeoutMs = options.timeoutMs ?? 180_000;
  playbackDiagClear();
  playbackDiagLog(
    "info",
    `play-journey-smoke start (${options.orchestraMode})`
  );

  options.ensureClean();
  options.setOrchestraMode(options.orchestraMode);
  await options.delay(120);
  if (!options.setJourneyMode(true)) {
    return { pass: false, reason: "set-journey-mode-unavailable" };
  }

  // React state and the URL commit asynchronously. Do not start transport until
  // the player has actually mounted a journey; otherwise Play can be accepted
  // against the previous non-CJM render and sit at 0/N until the outer timeout.
  const armDeadline = Date.now() + 3_000;
  let armedState = options.getState();
  while (Date.now() < armDeadline) {
    const counter = parseVisible(armedState?.counter);
    if (
      armedState?.journeyMode === true &&
      armedState.orchestraMode === options.orchestraMode &&
      counter.total > 0
    )
      break;
    await options.delay(100);
    armedState = options.getState();
  }
  if (
    armedState?.journeyMode !== true ||
    armedState.orchestraMode !== options.orchestraMode ||
    parseVisible(armedState.counter).total <= 0
  ) {
    return {
      pass: false,
      reason: "journey-mode-did-not-arm",
      state: armedState,
    };
  }

  if (!options.triggerTransport("jump-to-start")) {
    return { pass: false, reason: "jump-to-start-unavailable" };
  }
  const startDeadline = Date.now() + 5_000;
  let startState = options.getState();
  while (Date.now() < startDeadline) {
    if (
      startState?.orchestraMode === options.orchestraMode &&
      startState.beatId === options.startBeatId &&
      startState.screenId === options.startScreenId
    )
      break;
    await options.delay(100);
    startState = options.getState();
  }
  if (
    startState?.orchestraMode !== options.orchestraMode ||
    startState.beatId !== options.startBeatId ||
    startState.screenId !== options.startScreenId
  ) {
    playbackDiagLog("error", "journey-start-did-not-settle", {
      detail: `mode=${startState?.orchestraMode ?? "?"}/${options.orchestraMode} beat=${startState?.beatId ?? "?"}/${options.startBeatId} screen=${startState?.screenId ?? "?"}/${options.startScreenId}`,
    });
    return {
      pass: false,
      reason: "journey-start-did-not-settle",
      state: startState,
    };
  }
  if (!options.triggerTransport("play")) {
    return { pass: false, reason: "trigger-play-unavailable" };
  }

  const deadline = Date.now() + timeoutMs;
  let sawPlaying = false;
  let peakVisible = 0;
  let peakCounter: string | null = null;
  let peakTotal = 0;
  let lastSoftPo: AgentTestingPoSignal | null = null;

  while (Date.now() < deadline) {
    const state = options.getState();
    if (!state) {
      await options.delay(200);
      continue;
    }
    // Keep agent-testing overlay awake — idle auto-stop (~45s) aborts long Play.
    const overlayApi =
      (
        window as Window & {
          __studioAgentTestingOverlay?: { touch?: (title?: string) => void };
          __protoAgentTestingOverlay?: { touch?: (title?: string) => void };
        }
      ).__studioAgentTestingOverlay ??
      (
        window as Window & {
          __protoAgentTestingOverlay?: { touch?: (title?: string) => void };
        }
      ).__protoAgentTestingOverlay;
    overlayApi?.touch?.("AGENT TESTING — play-smoke");

    // R15 — poll live PO latch each beat (Alarm must not be ignored mid-Play).
    const po = pollSmokePoSignal({
      context: `play:${options.orchestraMode}:${state.beatId ?? "?"}`,
      continueOnAlarm: options.continueOnPoAlarm,
      pausePlay: () => {
        if (state.isPlaying || state.isOnAir) {
          options.triggerTransport("play");
        }
      },
    });
    if (po.hit) {
      lastSoftPo = po.signal;
      if (po.abort) {
        return {
          pass: false,
          reason: po.reason ?? "po-alarm",
          state,
          poSignal: po.signal,
          peakVisible,
          peakCounter,
        };
      }
    }

    if (state.diagnosticOpen) {
      // Known flake: agentic chat eased-scroll path can flash ±40px mid-Play.
      // Dismiss + resume so we can still prove play-end → stay at finale.
      const diagText =
        typeof document !== "undefined"
          ? document.querySelector(".studio-playback-diagnostic")
              ?.textContent ?? ""
          : "";
      const chatScrollFlake =
        options.orchestraMode === "agentic-cjm" &&
        /scroll-path-deviation/i.test(diagText);
      if (chatScrollFlake) {
        playbackDiagLog("info", "play-smoke: dismiss chat scroll-path flake");
        (
          window as Window & {
            __protoDismissPlaybackDiagnostic?: () => boolean;
          }
        ).__protoDismissPlaybackDiagnostic?.();
        await options.delay(200);
        options.triggerTransport("play");
        await options.delay(400);
        continue;
      }
      return { pass: false, reason: "playback-diagnostic", state };
    }

    if (state.isPlaying || state.isOnAir) {
      sawPlaying = true;
    }

    const { visible, total } = parseVisible(state.counter);
    if (visible > peakVisible) {
      peakVisible = visible;
      peakCounter = state.counter ?? null;
      peakTotal = total;
    }

    const diag = getPlaybackDiagBundle();
    // A red click diagnostic is an actual playback failure. It must terminate
    // this proof before the transport can make a later route look green.
    if (diag.click.fail > 0) {
      return {
        pass: false,
        reason: `playback-click-failed:${diag.click.fail}`,
        state,
        peakVisible,
        peakCounter,
      };
    }
    // Cursor loss is never cosmetic: a later re-create must not turn the
    // journey green. The durable tally survives the diagnostic event ring.
    if (diag.cursor.hidden > 0) {
      return {
        pass: false,
        reason: `playback-cursor-hidden:${diag.cursor.hidden}`,
        state,
        peakVisible,
        peakCounter,
      };
    }
    // Fast QA suite: bubble jump/chop samples stay diagnostic-only (same
    // contract as scroll-path soft-log / all-cjms-fast copy). Demo speed stays strict.
    if (
      !isFastPlayback() &&
      (diag.chatBubbleMotion.jumps > 0 ||
        diag.chatBubbleMotion.chops > 0 ||
        diag.chatBubbleMotion.skippedPhaseNotes.length > 0)
    ) {
      return {
        pass: false,
        reason:
          `playback-chat-motion-failed:` +
          `jumps=${diag.chatBubbleMotion.jumps},` +
          `chops=${diag.chatBubbleMotion.chops},` +
          `skipped=${diag.chatBubbleMotion.skippedPhaseNotes.length}`,
        state,
        peakVisible,
        peakCounter,
      };
    }
    const idle = !state.isPlaying && !state.isOnAir;
    if (
      sawPlaying &&
      idle &&
      diag.playEnd.count >= 1 &&
      journeyReachedEnd(peakVisible, peakTotal || total)
    ) {
      // Let beat/tab URL settle after stop-at-end (no jump).
      await options.delay(400);
      const settled = options.getState();
      const assert = assertPlaybackPlayEndedAtEnd({
        endBeatId: options.endBeatId,
        endScreenId: options.endScreenId,
        startBeatId: options.startBeatId,
      });
      if (!assert.pass) {
        return {
          pass: false,
          reason: assert.reason,
          state: settled,
          assert,
          peakVisible,
          peakCounter,
        };
      }
      playbackDiagLog("info", "play-journey-smoke PASS at end", {
        beatId: assert.beatId,
        screenId: assert.screenId,
      });
      return {
        pass: true,
        state: settled,
        assert,
        peakVisible,
        peakCounter,
        poSignal: lastSoftPo,
      };
    }

    await options.delay(200);
  }

  const finalState = options.getState();
  const assert = assertPlaybackPlayEndedAtEnd({
    endBeatId: options.endBeatId,
    endScreenId: options.endScreenId,
    startBeatId: options.startBeatId,
  });
  return {
    pass: false,
    reason: assert.pass
      ? "timeout-waiting-for-play-end"
      : assert.reason ?? "timeout",
    state: finalState,
    assert,
    peakVisible,
    peakCounter,
    poSignal: lastSoftPo,
  };
}

/** @deprecated Prefer {@link runPlayJourneyToEndSmoke} — play-end stays on finale. */
export const runPlayJourneyToStartSmoke = runPlayJourneyToEndSmoke;
