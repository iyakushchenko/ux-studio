import {
  clearStagedRecordingSession,
  getActiveRecordingSession,
  getLastRecordingSession,
  serializeRecordingSession,
  startRecording,
  stopRecording,
  pauseRecording,
  resumeRecording,
  isRecordingActive,
  stageRecordingSession,
} from "@/app/recording/recordingSession";
import { resolveRecordingSessionFromImportJson } from "@/app/recording/recordingImport";
import type { RecordingSession } from "@/app/recording/recordingTypes";
import {
  compileRecordingToJourney,
  saveRecordingAsJourney,
  type CompileRecordingJourneyOptions,
} from "@/app/recording/recordingCompile";
import {
  compileRecordingToBeatTimeline,
  replayRecordingSession,
  summarizeRecordingSession,
} from "@/app/recording/recordingReplay";
import type { StartRecordingOptions } from "@/app/recording/recordingSession";
import { armOverlayOnStudioHelpers } from "@/app/shell/helperOverlayArm";
import { simulateDemoPointerClick } from "@/app/scenario/demoCursor";
import { scrollCameraToTarget } from "@/app/scenario/playbackScroll";
import {
  logAgentTestingStep,
} from "@/app/shell/agent-testing";
import { resolveUsableDemoClickTarget } from "@/app/recording/recordingCapture";
import { describeRecordingClickTarget } from "@/app/recording/recordingCapture";
import {
  armRecCapture,
  assertRecLive,
} from "@/app/recording/recArmCapture";
import { runRecNewCjmProve } from "@/app/recording/recNewCjmProve";

function resolveRecordingSession(
  session?: RecordingSession
): RecordingSession | null {
  return session ?? getActiveRecordingSession() ?? getLastRecordingSession();
}

/** MCP callers often pass `{ label }` as the sole arg — treat as compile options. */
function resolveSessionOrCompileOptions(
  sessionOrOptions?: RecordingSession | CompileRecordingJourneyOptions,
  compileOptions?: CompileRecordingJourneyOptions
): {
  session: RecordingSession | null;
  options?: CompileRecordingJourneyOptions;
} {
  if (
    sessionOrOptions &&
    typeof sessionOrOptions === "object" &&
    !Array.isArray((sessionOrOptions as RecordingSession).events) &&
    ("label" in sessionOrOptions ||
      "journeyId" in sessionOrOptions ||
      "addAsNew" in sessionOrOptions)
  ) {
    return {
      session: resolveRecordingSession(undefined),
      options: sessionOrOptions as CompileRecordingJourneyOptions,
    };
  }
  return {
    session: resolveRecordingSession(sessionOrOptions as RecordingSession | undefined),
    options: compileOptions,
  };
}

declare global {
  interface Window {
    __protoStartRecording?: (
      options?: StartRecordingOptions
    ) => RecordingSession;
    __protoStopRecording?: () => RecordingSession | null;
    __protoClearRecording?: () => boolean;
    __protoPauseRecording?: () => boolean;
    __protoResumeRecording?: () => boolean;
    __protoIsRecording?: () => boolean;
    __protoGetRecording?: () => RecordingSession | null;
    __protoExportRecording?: (session?: RecordingSession) => string | null;
    __protoImportRecording?: (json: string) => RecordingSession;
    __protoCompileRecording?: (
      session?: RecordingSession
    ) => ReturnType<typeof compileRecordingToBeatTimeline>;
    __protoCompileRecordingToJourney?: (
      session?: RecordingSession,
      options?: CompileRecordingJourneyOptions
    ) => ReturnType<typeof compileRecordingToJourney>;
    __protoSaveRecordingAsJourney?: (
      session?: RecordingSession,
      options?: CompileRecordingJourneyOptions
    ) => ReturnType<typeof saveRecordingAsJourney>;
    __protoReplayRecording?: (
      session?: RecordingSession
    ) => Promise<import("@/app/recording/recordingTypes").RecordingReplayResult>;
    /** Agent REC demo — robo-cursor click (eased camera scroll). */
    __protoSimulateDemoPointerClick?: (
      target: HTMLElement | string,
      options?: { scroll?: boolean }
    ) => Promise<boolean>;
    __studioSimulateDemoPointerClick?: (
      target: HTMLElement | string,
      options?: { scroll?: boolean }
    ) => Promise<boolean>;
    /** Agent REC demo — eased camera to target (not abrupt jump). */
    __protoScrollCameraToTarget?: (
      target: HTMLElement | string,
      options?: { instant?: boolean }
    ) => Promise<void>;
    __studioScrollCameraToTarget?: (
      target: HTMLElement | string,
      options?: { instant?: boolean }
    ) => Promise<void>;
    /**
     * Arm REC the PO way: CJM off → REC ON → CREATE NEW → ● Start.
     * FAIL unless switch + session are truly live.
     */
    __studioArmRecCapture?: () => Promise<
      import("@/app/recording/recArmCapture").ArmRecCaptureResult
    >;
    __protoArmRecCapture?: () => Promise<
      import("@/app/recording/recArmCapture").ArmRecCaptureResult
    >;
    /** Truth latch — REC switch ON + live session. */
    __studioAssertRecLive?: () => import("@/app/recording/recArmCapture").RecLiveAssert;
    __protoAssertRecLive?: () => import("@/app/recording/recArmCapture").RecLiveAssert;
    /**
     * REC robustness prove — ALWAYS create NEW random CJM then Play that id.
     * Forbidden: only playing built-in / old rec-* as “REC prove”.
     */
    __studioRunRecNewCjmProve?: (
      options?: import("@/app/recording/recNewCjmProve").RecNewCjmProveOptions
    ) => Promise<
      import("@/app/recording/recNewCjmProve").RecNewCjmProveResult
    >;
    __protoRunRecNewCjmProve?: (
      options?: import("@/app/recording/recNewCjmProve").RecNewCjmProveOptions
    ) => Promise<
      import("@/app/recording/recNewCjmProve").RecNewCjmProveResult
    >;
  }
}

export function registerRecordingMcpHelpers(options?: {
  getDefaultStartOptions?: () => StartRecordingOptions;
  triggerTransport?: (action: import("@/app/shell/playbackInteractionContext").ManualTransportAction) => void;
  applyScreen?: import("@/app/recording/recordingTypes").RecordingReplayOptions["applyScreen"];
  applyDemoClick?: import("@/app/recording/recordingTypes").RecordingReplayOptions["applyDemoClick"];
  applyWireIntent?: import("@/app/recording/recordingTypes").RecordingReplayOptions["applyWireIntent"];
  applyDirectorScript?: import("@/app/recording/recordingTypes").RecordingReplayOptions["applyDirectorScript"];
  applyBeatEnter?: import("@/app/recording/recordingTypes").RecordingReplayOptions["applyBeatEnter"];
  applyScroll?: import("@/app/recording/recordingTypes").RecordingReplayOptions["applyScroll"];
  applyTypedText?: import("@/app/recording/recordingTypes").RecordingReplayOptions["applyTypedText"];
  onJourneySaved?: () => void;
  /** Honest REC arm — required for `__studioArmRecCapture` / RecNewCjmProve. */
  setJourneyMode?: (enabled: boolean) => void;
  setRecMode?: (enabled: boolean) => void;
  setOrchestraMode?: (modeId: string) => void;
}): () => void {
  if (typeof window === "undefined") return () => {};

  window.__protoStartRecording = (startOptions) => {
    const defaults = options?.getDefaultStartOptions?.() ?? {};
    let session: RecordingSession;
    try {
      session = startRecording({ ...defaults, ...startOptions });
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      try {
        logAgentTestingStep({
          kind: "rec",
          action: "StartRecording",
          label: `REC FAIL — ${reason}`,
          outcome: "fail",
        });
      } catch {
        /* hang-safe */
      }
      throw err;
    }
    const live = isRecordingActive();
    try {
      logAgentTestingStep({
        kind: "rec",
        action: "StartRecording",
        label: live
          ? `REC capture live · ${session.id}`
          : `REC FAIL — start did not arm session`,
        outcome: live ? "ok" : "fail",
      });
    } catch {
      /* hang-safe */
    }
    if (!live) {
      throw new Error("REC start failed — isRecordingActive() is false");
    }
    return session;
  };

  window.__protoStopRecording = () => {
    const session = stopRecording();
    try {
      logAgentTestingStep({
        kind: "rec",
        action: "StopRecording",
        label: session
          ? `REC stop · ${session.id} · events=${session.events.length}`
          : "REC stop · no session",
        outcome: session ? "ok" : "soft-fail",
      });
    } catch {
      /* hang-safe */
    }
    return session;
  };

  window.__protoClearRecording = () => clearStagedRecordingSession();

  window.__protoPauseRecording = () => pauseRecording();

  window.__protoResumeRecording = () => resumeRecording();

  window.__protoIsRecording = () => isRecordingActive();

  const resolveEl = (target: HTMLElement | string): HTMLElement | null => {
    if (typeof target === "string") {
      try {
        return document.querySelector<HTMLElement>(target);
      } catch {
        return null;
      }
    }
    return target;
  };

  window.__protoSimulateDemoPointerClick = async (target, clickOpts) => {
    const el = resolveEl(target);
    if (!el) return false;
    const usable = resolveUsableDemoClickTarget(el);
    if (!usable) {
      try {
        logAgentTestingStep({
          kind: "rec",
          action: "SimulateDemoPointerClick",
          label: `REC/agent click FAIL — degraded target`,
          outcome: "fail",
        });
      } catch {
        /* hang-safe */
      }
      return false;
    }
    try {
      logAgentTestingStep({
        kind: "rec",
        action: "SimulateDemoPointerClick",
        label: `robo-cursor click · ${describeRecordingClickTarget(usable)}`,
        outcome: "ok",
      });
    } catch {
      /* hang-safe */
    }
    return simulateDemoPointerClick(usable, {
      scroll: clickOpts?.scroll !== false,
    });
  };
  window.__studioSimulateDemoPointerClick =
    window.__protoSimulateDemoPointerClick;

  window.__protoScrollCameraToTarget = async (target, scrollOpts) => {
    const el = resolveEl(target);
    if (!el) return;
    await scrollCameraToTarget(el, { instant: scrollOpts?.instant === true });
  };
  window.__studioScrollCameraToTarget = window.__protoScrollCameraToTarget;

  window.__protoGetRecording = () =>
    getActiveRecordingSession() ?? getLastRecordingSession();

  window.__protoExportRecording = (session) => {
    const target = resolveRecordingSession(session);
    if (!target) return null;
    return serializeRecordingSession(target);
  };

  window.__protoImportRecording = (json) => {
    const resolved = resolveRecordingSessionFromImportJson(json);
    stageRecordingSession(resolved.session);
    return resolved.session;
  };

  window.__protoCompileRecording = (session) => {
    const target = resolveRecordingSession(session);
    if (!target) {
      throw new Error("No recording session to compile");
    }
    return compileRecordingToBeatTimeline(target);
  };

  window.__protoCompileRecordingToJourney = (session, compileOptions) => {
    const { session: target, options: opts } = resolveSessionOrCompileOptions(
      session,
      compileOptions
    );
    if (!target) {
      throw new Error("No recording session to compile");
    }
    return compileRecordingToJourney(target, opts);
  };

  window.__protoSaveRecordingAsJourney = (session, compileOptions) => {
    const { session: target, options: opts } = resolveSessionOrCompileOptions(
      session,
      compileOptions
    );
    if (!target) {
      throw new Error("No recording session to save as journey");
    }
    if (isRecordingActive()) {
      throw new Error(
        "REC still live — stop recording before Add as CJM (honesty)"
      );
    }
    const defaults = options?.getDefaultStartOptions?.() ?? {};
    const saved = saveRecordingAsJourney(target, {
      ...opts,
      projectId: (target.projectId ?? defaults.projectId) as string | undefined,
      personaId: (target.personaId ?? defaults.personaId) as string | undefined,
    });
    options?.onJourneySaved?.();
    try {
      logAgentTestingStep({
        kind: "rec",
        action: "SaveRecordingAsJourney",
        label: `REC Add as CJM · ${saved.journey.id} · beats=${saved.journey.beats.length}`,
        outcome: "ok",
      });
    } catch {
      /* hang-safe */
    }
    return saved;
  };

  window.__protoReplayRecording = async (session) => {
    const target = resolveRecordingSession(session);
    if (!target) {
      throw new Error("No recording session to replay");
    }
    if (
      !options?.triggerTransport &&
      !options?.applyScreen &&
      !options?.applyDemoClick &&
      !options?.applyWireIntent &&
      !options?.applyDirectorScript &&
      !options?.applyBeatEnter &&
      !options?.applyScroll &&
      !options?.applyTypedText
    ) {
      throw new Error(
        "triggerTransport, applyScreen, applyDemoClick, applyWireIntent, applyDirectorScript, applyBeatEnter, applyScroll, or applyTypedText not available"
      );
    }
    return replayRecordingSession(target, {
      triggerTransport: options.triggerTransport,
      applyScreen: options.applyScreen,
      applyDemoClick: options.applyDemoClick,
      applyWireIntent: options.applyWireIntent,
      applyDirectorScript: options.applyDirectorScript,
      applyBeatEnter: options.applyBeatEnter,
      applyScroll: options.applyScroll,
      applyTypedText: options.applyTypedText,
      // Default ≥4s major-step hold (recordingReplay); omit override so capture gaps apply.
    });
  };

  const armHooks = () => ({
    setJourneyMode: options?.setJourneyMode ?? (() => undefined),
    setRecMode: options?.setRecMode ?? (() => undefined),
    getStartOptions: options?.getDefaultStartOptions,
  });

  window.__studioArmRecCapture = async () => {
    if (!options?.setRecMode || !options?.setJourneyMode) {
      const fail = {
        ok: false as const,
        recMode: false,
        recording: false,
        createNew: false,
        startVisible: false,
        overlayRecLive: false,
        reason: "ArmRecCapture hooks not wired (setRecMode/setJourneyMode)",
      };
      try {
        logAgentTestingStep({
          kind: "rec",
          action: "ArmRecCapture",
          label: `REC arm FAIL — ${fail.reason}`,
          outcome: "fail",
        });
      } catch {
        /* hang-safe */
      }
      return fail;
    }
    return armRecCapture(armHooks());
  };
  window.__protoArmRecCapture = window.__studioArmRecCapture;

  window.__studioAssertRecLive = () => assertRecLive();
  window.__protoAssertRecLive = window.__studioAssertRecLive;

  window.__studioRunRecNewCjmProve = async (proveOpts) =>
    runRecNewCjmProve(
      {
        ...armHooks(),
        setOrchestraMode: options?.setOrchestraMode,
      },
      proveOpts
    );
  window.__protoRunRecNewCjmProve = window.__studioRunRecNewCjmProve;

  armOverlayOnStudioHelpers();

  return () => {
    delete window.__protoStartRecording;
    delete window.__protoStopRecording;
    delete window.__protoClearRecording;
    delete window.__protoPauseRecording;
    delete window.__protoResumeRecording;
    delete window.__protoIsRecording;
    delete window.__protoGetRecording;
    delete window.__protoExportRecording;
    delete window.__protoImportRecording;
    delete window.__protoCompileRecording;
    delete window.__protoCompileRecordingToJourney;
    delete window.__protoSaveRecordingAsJourney;
    delete window.__protoReplayRecording;
    delete window.__protoSimulateDemoPointerClick;
    delete window.__studioSimulateDemoPointerClick;
    delete window.__protoScrollCameraToTarget;
    delete window.__studioScrollCameraToTarget;
    delete window.__studioArmRecCapture;
    delete window.__protoArmRecCapture;
    delete window.__studioAssertRecLive;
    delete window.__protoAssertRecLive;
    delete window.__studioRunRecNewCjmProve;
    delete window.__protoRunRecNewCjmProve;
  };
}

export { summarizeRecordingSession };
