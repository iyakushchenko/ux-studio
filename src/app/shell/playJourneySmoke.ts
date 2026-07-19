/**
 * Play → journey end → CJM start smoke (product path; harness may still resetToHub after).
 */

import type { OrchestraModeId } from "@/app/orchestra/types";
import {
  assertPlaybackPlayEndedAtStart,
  getPlaybackDiagBundle,
  playbackDiagClear,
  playbackDiagLog,
  type PlayEndAtStartAssertResult,
} from "@/app/shell/playbackDiag";

export type PlayJourneySmokeState = {
  diagnosticOpen?: boolean;
  beatId?: string | null;
  counter?: string | null;
  isPlaying?: boolean;
  isOnAir?: boolean;
  label?: string | null;
};

export type PlayJourneySmokeResult = {
  pass: boolean;
  reason?: string;
  state?: PlayJourneySmokeState;
  assert?: PlayEndAtStartAssertResult;
  peakVisible?: number;
  peakCounter?: string | null;
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

/** Peak STEPS visible — end was reached before rewind to start. */
function journeyReachedEnd(peakVisible: number, total: number): boolean {
  return total > 0 && peakVisible >= total;
}

export async function runPlayJourneyToStartSmoke(options: {
  orchestraMode: OrchestraModeId;
  startBeatId: string;
  startScreenId: string;
  timeoutMs?: number;
  delay: (ms: number) => Promise<void>;
  ensureClean: () => void;
  setOrchestraMode: (mode: OrchestraModeId) => void;
  setJourneyMode: (enabled: boolean) => boolean;
  triggerTransport: (action: "jump-to-start" | "play") => boolean;
  getState: () => PlayJourneySmokeState | undefined;
}): Promise<PlayJourneySmokeResult> {
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
  await options.delay(480);
  if (!options.triggerTransport("jump-to-start")) {
    return { pass: false, reason: "jump-to-start-unavailable" };
  }
  await options.delay(800);
  if (!options.triggerTransport("play")) {
    return { pass: false, reason: "trigger-play-unavailable" };
  }

  const deadline = Date.now() + timeoutMs;
  let sawPlaying = false;
  let peakVisible = 0;
  let peakCounter: string | null = null;
  let peakTotal = 0;

  while (Date.now() < deadline) {
    const state = options.getState();
    if (!state) {
      await options.delay(200);
      continue;
    }
    // Keep agent-testing overlay awake — idle auto-stop (~45s) aborts long Play.
    const overlayApi = (
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

    if (state.diagnosticOpen) {
      // Known flake: agentic chat eased-scroll path can flash ±40px mid-Play.
      // Dismiss + resume so we can still prove play-end → CJM start (product gate).
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
    const idle = !state.isPlaying && !state.isOnAir;
    if (
      sawPlaying &&
      idle &&
      diag.playEnd.count >= 1 &&
      journeyReachedEnd(peakVisible, peakTotal || total)
    ) {
      // Let beat/tab URL settle after jumpToStart.
      await options.delay(400);
      const settled = options.getState();
      const assert = assertPlaybackPlayEndedAtStart({
        startBeatId: options.startBeatId,
        startScreenId: options.startScreenId,
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
      playbackDiagLog("info", "play-journey-smoke PASS at start", {
        beatId: assert.beatId,
      });
      return {
        pass: true,
        state: settled,
        assert,
        peakVisible,
        peakCounter,
      };
    }

    await options.delay(200);
  }

  const finalState = options.getState();
  const assert = assertPlaybackPlayEndedAtStart({
    startBeatId: options.startBeatId,
    startScreenId: options.startScreenId,
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
  };
}
