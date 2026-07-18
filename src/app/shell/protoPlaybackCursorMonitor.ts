import {
  countDemoCursors,
  CURSOR_BEAT_CHANGE_GRACE_MS,
  CURSOR_POST_TRANSPORT_CHECK_MS,
  CURSOR_SCRIPTING_END_CHECK_MS,
  detectCursorOrphaned,
  detectCursorStale,
  type CursorAnomaly,
  type CursorCheckContext,
} from "@/app/shell/protoPlaybackCursorAnomalies";

export type ManualTransportAction =
  | "step-forward"
  | "step-back"
  | "jump-to-start"
  | "jump-to-end"
  | "play";

export type CursorMonitorContext = Omit<CursorCheckContext, "cursorCount" | "transportAction">;

export type PlaybackCursorMonitor = {
  setActive: (active: boolean) => void;
  setOnAnomaly: (handler: ((anomaly: CursorAnomaly) => void) | null) => void;
  setContext: (context: CursorMonitorContext) => void;
  reset: () => void;
  noteManualTransport: (action: ManualTransportAction) => void;
  noteBeatOrScreenChange: () => void;
  noteScriptingEnd: () => void;
};

export function createPlaybackCursorMonitor(options?: {
  countCursors?: () => number;
}): PlaybackCursorMonitor {
  const countCursors = options?.countCursors ?? countDemoCursors;
  let active = false;
  let onAnomaly: ((anomaly: CursorAnomaly) => void) | null = null;
  let reported = false;
  let context: CursorMonitorContext = {
    isScripting: false,
    isOnAir: false,
    isPausingBeforeReveal: false,
  };
  let transportTimer: ReturnType<typeof setTimeout> | null = null;
  let beatChangeTimer: ReturnType<typeof setTimeout> | null = null;
  let scriptingEndTimer: ReturnType<typeof setTimeout> | null = null;
  let pendingTransportAction: ManualTransportAction | undefined;

  const clearTimer = (timer: ReturnType<typeof setTimeout> | null) => {
    if (timer != null) clearTimeout(timer);
  };

  const report = (anomaly: CursorAnomaly) => {
    if (!active || reported || !onAnomaly) return;
    reported = true;
    onAnomaly(anomaly);
  };

  const buildCheckContext = (
    transportAction?: string
  ): CursorCheckContext => ({
    ...context,
    cursorCount: countCursors(),
    transportAction,
  });

  const runStaleCheck = (transportAction?: string) => {
    const check = buildCheckContext(transportAction);
    const anomaly = detectCursorStale(check);
    if (anomaly) report(anomaly);
  };

  const runOrphanedCheck = () => {
    const check = buildCheckContext();
    const anomaly = detectCursorOrphaned(check);
    if (anomaly) report(anomaly);
  };

  const scheduleTransportCheck = (action: ManualTransportAction) => {
    pendingTransportAction = action;
    clearTimer(transportTimer);
    transportTimer = setTimeout(() => {
      transportTimer = null;
      const actionLabel = pendingTransportAction;
      pendingTransportAction = undefined;
      runStaleCheck(actionLabel);
    }, CURSOR_POST_TRANSPORT_CHECK_MS);
  };

  return {
    setActive(next) {
      active = next;
      if (!next) {
        clearTimer(transportTimer);
        clearTimer(beatChangeTimer);
        clearTimer(scriptingEndTimer);
        transportTimer = null;
        beatChangeTimer = null;
        scriptingEndTimer = null;
        pendingTransportAction = undefined;
      }
    },
    setOnAnomaly(handler) {
      onAnomaly = handler;
    },
    setContext(next) {
      context = next;
    },
    reset() {
      reported = false;
      pendingTransportAction = undefined;
      clearTimer(transportTimer);
      clearTimer(beatChangeTimer);
      clearTimer(scriptingEndTimer);
      transportTimer = null;
      beatChangeTimer = null;
      scriptingEndTimer = null;
    },
    noteManualTransport(action) {
      if (!active) return;
      scheduleTransportCheck(action);
    },
    noteBeatOrScreenChange() {
      if (!active) return;
      clearTimer(beatChangeTimer);
      beatChangeTimer = setTimeout(() => {
        beatChangeTimer = null;
        runOrphanedCheck();
      }, CURSOR_BEAT_CHANGE_GRACE_MS);
    },
    noteScriptingEnd() {
      if (!active) return;
      clearTimer(scriptingEndTimer);
      scriptingEndTimer = setTimeout(() => {
        scriptingEndTimer = null;
        runStaleCheck("script-abort");
      }, CURSOR_SCRIPTING_END_CHECK_MS);
    },
  };
}

export const playbackCursorMonitor = createPlaybackCursorMonitor();
