import {
  deserializeRecordingSession,
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

function resolveRecordingSession(
  session?: RecordingSession
): RecordingSession | null {
  return session ?? getActiveRecordingSession() ?? getLastRecordingSession();
}

declare global {
  interface Window {
    __protoStartRecording?: (
      options?: StartRecordingOptions
    ) => RecordingSession;
    __protoStopRecording?: () => RecordingSession | null;
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
}): () => void {
  if (typeof window === "undefined") return () => {};

  window.__protoStartRecording = (startOptions) => {
    const defaults = options?.getDefaultStartOptions?.() ?? {};
    return startRecording({ ...defaults, ...startOptions });
  };

  window.__protoStopRecording = () => stopRecording();

  window.__protoPauseRecording = () => pauseRecording();

  window.__protoResumeRecording = () => resumeRecording();

  window.__protoIsRecording = () => isRecordingActive();

  window.__protoGetRecording = () => getActiveRecordingSession();

  window.__protoExportRecording = (session) => {
    const target = resolveRecordingSession(session);
    if (!target) return null;
    return serializeRecordingSession(target);
  };

  window.__protoImportRecording = (json) => {
    const imported = deserializeRecordingSession(json);
    stageRecordingSession(imported);
    return imported;
  };

  window.__protoCompileRecording = (session) => {
    const target = resolveRecordingSession(session);
    if (!target) {
      throw new Error("No recording session to compile");
    }
    return compileRecordingToBeatTimeline(target);
  };

  window.__protoCompileRecordingToJourney = (session, compileOptions) => {
    const target = resolveRecordingSession(session);
    if (!target) {
      throw new Error("No recording session to compile");
    }
    return compileRecordingToJourney(target, compileOptions);
  };

  window.__protoSaveRecordingAsJourney = (session, compileOptions) => {
    const target = resolveRecordingSession(session);
    if (!target) {
      throw new Error("No recording session to save as journey");
    }
    const defaults = options?.getDefaultStartOptions?.() ?? {};
    const saved = saveRecordingAsJourney(target, {
      ...compileOptions,
      projectId: (target.projectId ?? defaults.projectId) as string | undefined,
      personaId: (target.personaId ?? defaults.personaId) as string | undefined,
    });
    options?.onJourneySaved?.();
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
      stepDelayMs: 200,
    });
  };

  armOverlayOnStudioHelpers();

  return () => {
    delete window.__protoStartRecording;
    delete window.__protoStopRecording;
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
  };
}

export { summarizeRecordingSession };
