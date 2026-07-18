import {
  detectTransportRetreatMismatch,
  detectViewportStallAfterAdvance,
  VIEWPORT_POST_ADVANCE_CHECK_MS,
  type ViewportAnomaly,
  type ViewportCheckContext,
} from "@/app/shell/protoPlaybackViewportAnomalies";

export type ManualTransportAction =
  | "step-forward"
  | "step-back"
  | "jump-to-start"
  | "jump-to-end"
  | "play";

export type ViewportTransitionBaseline = {
  scrollTop: number;
  childIndex: number | null;
  beatId?: string;
  beatLabel?: string;
  touchpointKey?: string;
  expectsViewportFollow: boolean;
};

export type ViewportMonitorContext = {
  scrollTop: number;
  childIndex: number | null;
  beatId?: string;
  beatLabel?: string;
  beatProtoTab?: number | null;
  touchpointKey?: string;
  isScripting: boolean;
  isPausingBeforeReveal: boolean;
  screenFramesBeat: boolean;
  anchorInView: boolean;
  anchorProminent: boolean;
};

export type PlaybackViewportMonitor = {
  setActive: (active: boolean) => void;
  setOnAnomaly: (handler: ((anomaly: ViewportAnomaly) => void) | null) => void;
  setContext: (context: ViewportMonitorContext) => void;
  reset: () => void;
  noteTouchpointAdvance: (baseline: ViewportTransitionBaseline) => void;
  noteManualTransport: (action: ManualTransportAction) => void;
  noteScriptingEnd: (options?: { expectsViewportFollow?: boolean }) => void;
};

export function createPlaybackViewportMonitor(): PlaybackViewportMonitor {
  let active = false;
  let onAnomaly: ((anomaly: ViewportAnomaly) => void) | null = null;
  let reported = false;
  let context: ViewportMonitorContext = {
    scrollTop: 0,
    childIndex: null,
    isScripting: false,
    isPausingBeforeReveal: false,
    screenFramesBeat: false,
    anchorInView: false,
    anchorProminent: false,
  };
  let baseline: ViewportTransitionBaseline | null = null;
  let pendingTransportAction: ManualTransportAction | undefined;
  let checkTimer: ReturnType<typeof setTimeout> | null = null;
  let scriptingPolls = 0;
  const MAX_SCRIPTING_POLLS = 48;

  const clearCheckTimer = () => {
    if (checkTimer != null) {
      clearTimeout(checkTimer);
      checkTimer = null;
    }
  };

  const report = (anomaly: ViewportAnomaly) => {
    if (!active || reported || !onAnomaly) return;
    reported = true;
    onAnomaly(anomaly);
  };

  const buildCheckContext = (
    transportAction?: string
  ): ViewportCheckContext | null => {
    if (!baseline) return null;
    return {
      scrollTop: context.scrollTop,
      baselineScrollTop: baseline.scrollTop,
      childIndex: context.childIndex,
      baselineChildIndex: baseline.childIndex,
      beatId: context.beatId,
      baselineBeatId: baseline.beatId,
      beatLabel: context.beatLabel,
      baselineTouchpointKey: baseline.touchpointKey,
      touchpointKey: context.touchpointKey,
      isScripting: context.isScripting,
      isPausingBeforeReveal: context.isPausingBeforeReveal,
      screenFramesBeat: context.screenFramesBeat,
      anchorInView: context.anchorInView,
      anchorProminent: context.anchorProminent,
      expectsViewportFollow: baseline.expectsViewportFollow,
      transportAction,
    };
  };

  const runTransportCheck = (transportAction: ManualTransportAction) => {
    if (context.isScripting || context.isPausingBeforeReveal) {
      if (scriptingPolls < MAX_SCRIPTING_POLLS) {
        scriptingPolls += 1;
        scheduleTransportCheck(transportAction, true);
      }
      return;
    }
    scriptingPolls = 0;
    const retreatAnomaly = detectTransportRetreatMismatch({
      transportAction,
      beatId: context.beatId,
      beatLabel: context.beatLabel,
      beatProtoTab: context.beatProtoTab,
      childIndex: context.childIndex,
      touchpointKey: context.touchpointKey,
      screenFramesBeat: context.screenFramesBeat,
    });
    if (retreatAnomaly) report(retreatAnomaly);
  };

  const runCheck = (transportAction?: string) => {
    if (context.isScripting || context.isPausingBeforeReveal) {
      if (scriptingPolls < MAX_SCRIPTING_POLLS) {
        scriptingPolls += 1;
        scheduleCheck(transportAction ?? pendingTransportAction, true);
      }
      return;
    }
    scriptingPolls = 0;
    const check = buildCheckContext(transportAction ?? pendingTransportAction);
    pendingTransportAction = undefined;
    if (!check) return;
    const anomaly = detectViewportStallAfterAdvance(check);
    if (anomaly) report(anomaly);
  };

  const scheduleTransportCheck = (
    transportAction: ManualTransportAction,
    deferWhileScripting = false
  ) => {
    if (!active) return;
    if (
      deferWhileScripting &&
      (context.isScripting || context.isPausingBeforeReveal)
    ) {
      clearCheckTimer();
      checkTimer = setTimeout(() => {
        checkTimer = null;
        runTransportCheck(transportAction);
      }, 160);
      return;
    }
    clearCheckTimer();
    checkTimer = setTimeout(() => {
      checkTimer = null;
      runTransportCheck(transportAction);
    }, VIEWPORT_POST_ADVANCE_CHECK_MS);
  };

  const scheduleCheck = (
    transportAction?: string,
    deferWhileScripting = false
  ) => {
    if (!active) return;
    if (transportAction === "step-back") {
      scheduleTransportCheck(transportAction);
      return;
    }
    if (!baseline) return;
    if (transportAction) pendingTransportAction = transportAction;
    if (
      deferWhileScripting &&
      (context.isScripting || context.isPausingBeforeReveal)
    ) {
      clearCheckTimer();
      checkTimer = setTimeout(() => {
        checkTimer = null;
        runCheck();
      }, 160);
      return;
    }
    clearCheckTimer();
    checkTimer = setTimeout(() => {
      checkTimer = null;
      runCheck();
    }, VIEWPORT_POST_ADVANCE_CHECK_MS);
  };

  return {
    setActive(next) {
      active = next;
      if (!next) {
        clearCheckTimer();
        baseline = null;
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
      baseline = null;
      pendingTransportAction = undefined;
      scriptingPolls = 0;
      clearCheckTimer();
    },
    noteTouchpointAdvance(nextBaseline) {
      if (!active) return;
      baseline = nextBaseline;
      scriptingPolls = 0;
      if (context.isScripting || context.isPausingBeforeReveal) return;
      scheduleCheck();
    },
    noteManualTransport(action) {
      if (!active) return;
      reported = false;
      scheduleCheck(action);
    },
    noteScriptingEnd(options) {
      if (!active) return;
      if (options?.expectsViewportFollow != null && baseline) {
        baseline = {
          ...baseline,
          expectsViewportFollow: options.expectsViewportFollow,
        };
      }
      scheduleCheck("script-end");
    },
  };
}

export const playbackViewportMonitor = createPlaybackViewportMonitor();
