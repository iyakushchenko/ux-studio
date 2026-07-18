import { getPrototypeScrollRoot } from "@/app/proto/protoPlaybackScroll";
import {
  DIRECTOR_HANDOFF_CHECK_MS,
  detectDirectorHandoffSkippedAnomaly,
  detectDirectorOutcomeAnomaly,
  detectDirectorStepNoEffectAnomaly,
  type DirectorOutcomeReport,
} from "@/app/shell/protoPlaybackDirectorAnomalies";
import type { CursorAnomaly } from "@/app/shell/protoPlaybackCursorAnomalies";

export type PlaybackDirectorMonitor = {
  setActive: (active: boolean) => void;
  setOnAnomaly: (handler: ((anomaly: CursorAnomaly) => void) | null) => void;
  reset: () => void;
  report: (anomaly: CursorAnomaly) => void;
  scheduleDirectorHandoff: (options: {
    fromBeatId: string;
    toBeatId: string;
    scriptLabel: string;
  }) => void;
  noteManualDirectorStepExpected: (beatId: string, scriptLabel: string) => void;
  noteDirectorScriptStarted: (beatId: string) => void;
  noteDirectorScriptFinished: (beatId: string, ok: boolean) => void;
  clearDirectorHandoff: (beatId?: string) => void;
  reportDirectorOutcome: (
    scriptLabel: string,
    report: DirectorOutcomeReport
  ) => void;
};

export function createPlaybackDirectorMonitor(): PlaybackDirectorMonitor {
  let active = false;
  let reported = false;
  let onAnomaly: ((anomaly: CursorAnomaly) => void) | null = null;
  let handoffTimer: number | null = null;
  let pendingHandoff: {
    fromBeatId: string;
    toBeatId: string;
    scriptLabel: string;
    scriptStarted: boolean;
    scriptSucceeded: boolean;
  } | null = null;
  let pendingManualStep: {
    beatId: string;
    scriptLabel: string;
    scrollTopAtStart: number;
  } | null = null;

  const clearHandoffTimer = () => {
    if (handoffTimer != null) {
      window.clearTimeout(handoffTimer);
      handoffTimer = null;
    }
  };

  const emit = (anomaly: CursorAnomaly) => {
    if (!active || reported || !onAnomaly) return;
    reported = true;
    clearHandoffTimer();
    pendingHandoff = null;
    pendingManualStep = null;
    onAnomaly(anomaly);
  };

  const scrollDeltaSinceManualStep = (): number | undefined => {
    if (!pendingManualStep) return undefined;
    const scrollTop = getPrototypeScrollRoot()?.scrollTop ?? 0;
    return Math.abs(scrollTop - pendingManualStep.scrollTopAtStart);
  };

  return {
    setActive(next) {
      active = next;
      if (!next) {
        reported = false;
        clearHandoffTimer();
        pendingHandoff = null;
        pendingManualStep = null;
      }
    },
    setOnAnomaly(handler) {
      onAnomaly = handler;
    },
    reset() {
      reported = false;
      clearHandoffTimer();
      pendingHandoff = null;
      pendingManualStep = null;
    },
    report(anomaly) {
      emit(anomaly);
    },
    noteManualDirectorStepExpected(beatId, scriptLabel) {
      pendingManualStep = {
        beatId,
        scriptLabel,
        scrollTopAtStart: getPrototypeScrollRoot()?.scrollTop ?? 0,
      };
    },
    scheduleDirectorHandoff({ fromBeatId, toBeatId, scriptLabel }) {
      clearHandoffTimer();
      pendingHandoff = {
        fromBeatId,
        toBeatId,
        scriptLabel,
        scriptStarted: false,
        scriptSucceeded: false,
      };
      handoffTimer = window.setTimeout(() => {
        handoffTimer = null;
        if (!active || reported || !pendingHandoff || !onAnomaly) return;
        if (pendingHandoff.toBeatId !== toBeatId) return;
        const anomaly = detectDirectorHandoffSkippedAnomaly({
          fromBeatId: pendingHandoff.fromBeatId,
          toBeatId: pendingHandoff.toBeatId,
          scriptLabel: pendingHandoff.scriptLabel,
          scriptStarted: pendingHandoff.scriptStarted,
          scriptSucceeded: pendingHandoff.scriptSucceeded,
        });
        if (anomaly) emit(anomaly);
      }, DIRECTOR_HANDOFF_CHECK_MS);
    },
    noteDirectorScriptStarted(beatId) {
      if (pendingHandoff?.toBeatId === beatId) {
        pendingHandoff.scriptStarted = true;
      }
    },
    noteDirectorScriptFinished(beatId, ok) {
      if (pendingHandoff?.toBeatId === beatId) {
        pendingHandoff.scriptSucceeded = ok;
        if (ok) {
          clearHandoffTimer();
          pendingHandoff = null;
        }
      }
    },
    clearDirectorHandoff(beatId) {
      if (beatId && pendingHandoff?.toBeatId !== beatId) return;
      clearHandoffTimer();
      pendingHandoff = null;
    },
    reportDirectorOutcome(scriptLabel, report) {
      const outcomeAnomaly = detectDirectorOutcomeAnomaly(scriptLabel, report);
      if (outcomeAnomaly) {
        emit(outcomeAnomaly);
        return;
      }

      if (
        pendingManualStep &&
        pendingManualStep.scriptLabel === scriptLabel
      ) {
        const noEffectAnomaly = detectDirectorStepNoEffectAnomaly({
          scriptLabel,
          report,
          beatId: pendingManualStep.beatId,
          scrollDeltaPx: scrollDeltaSinceManualStep(),
        });
        pendingManualStep = null;
        if (noEffectAnomaly) emit(noEffectAnomaly);
      }
    },
  };
}

export const playbackDirectorMonitor = createPlaybackDirectorMonitor();
