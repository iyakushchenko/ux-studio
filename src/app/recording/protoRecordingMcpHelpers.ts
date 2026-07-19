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
} from "@/app/recording/protoRecordingSession";
import type { ProtoRecordingSession } from "@/app/recording/protoRecordingTypes";
import {
  compileRecordingToBeatTimeline,
  replayRecordingSession,
  summarizeRecordingSession,
} from "@/app/recording/protoRecordingReplay";
import type { StartRecordingOptions } from "@/app/recording/protoRecordingSession";
import { armOverlayOnProtoHelpers } from "@/app/shell/protoHelperOverlayArm";

function resolveRecordingSession(
  session?: ProtoRecordingSession
): ProtoRecordingSession | null {
  return session ?? getActiveRecordingSession() ?? getLastRecordingSession();
}

declare global {
  interface Window {
    __protoStartRecording?: (
      options?: StartRecordingOptions
    ) => ProtoRecordingSession;
    __protoStopRecording?: () => ProtoRecordingSession | null;
    __protoPauseRecording?: () => boolean;
    __protoResumeRecording?: () => boolean;
    __protoIsRecording?: () => boolean;
    __protoGetRecording?: () => ProtoRecordingSession | null;
    __protoExportRecording?: (session?: ProtoRecordingSession) => string | null;
    __protoImportRecording?: (json: string) => ProtoRecordingSession;
    __protoCompileRecording?: (
      session?: ProtoRecordingSession
    ) => ReturnType<typeof compileRecordingToBeatTimeline>;
    __protoReplayRecording?: (
      session?: ProtoRecordingSession
    ) => Promise<import("@/app/recording/protoRecordingTypes").ProtoRecordingReplayResult>;
  }
}

export function registerProtoRecordingMcpHelpers(options?: {
  getDefaultStartOptions?: () => StartRecordingOptions;
  triggerTransport?: (action: import("@/app/shell/protoPlaybackInteractionContext").ManualTransportAction) => void;
  applyScreen?: import("@/app/recording/protoRecordingTypes").ProtoRecordingReplayOptions["applyScreen"];
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

  window.__protoReplayRecording = async (session) => {
    const target = resolveRecordingSession(session);
    if (!target) {
      throw new Error("No recording session to replay");
    }
    if (!options?.triggerTransport && !options?.applyScreen) {
      throw new Error("triggerTransport or applyScreen not available");
    }
    return replayRecordingSession(target, {
      triggerTransport: options.triggerTransport,
      applyScreen: options.applyScreen,
      stepDelayMs: 200,
    });
  };

  armOverlayOnProtoHelpers();

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
    delete window.__protoReplayRecording;
  };
}

export { summarizeRecordingSession };
