import { useEffect, useRef } from "react";
import type { JourneyBeat } from "@/app/orchestra/types";
import {
  resolvePlaylistTouchpointIndex,
  type StudioTouchpointEntry,
} from "@/app/nav/resolveStudioTouchpoint";
import { beatDirectorScriptLabel } from "@/app/orchestra/journeyBeatDirector";
import {
  playbackTransportContractDiagnostic,
  type PlaybackDiagnosticError,
} from "@/app/shell/protoPlaybackDiagnostic";
import {
  detectDirectorScriptOffAir,
  detectPlaylistFrameSkip,
  detectTouchpointAheadOfBeat,
} from "@/app/shell/protoPlaybackTransportAnomalies";

export type TransportGuardSnapshot = {
  active: boolean;
  journeyMode: boolean;
  isOnAir: boolean;
  isScripting: boolean;
  journeyId?: string;
  beatId?: string;
  beatLabel?: string;
  touchpointKey?: string;
  touchpointLabel?: string;
  visibleProgress?: string;
  playlist: readonly StudioTouchpointEntry[];
  /** Increments on each manual cassette transport action. */
  transportStepToken: number;
};

type Options = {
  snapshot: TransportGuardSnapshot;
  currentBeat?: JourneyBeat;
  onDiagnostic: (error: PlaybackDiagnosticError) => void;
};

export function useProtoPlaybackTransportGuard({
  snapshot,
  currentBeat,
  onDiagnostic,
}: Options): void {
  const onDiagnosticRef = useRef(onDiagnostic);
  onDiagnosticRef.current = onDiagnostic;

  const prevTouchpointIndexRef = useRef<number | null>(null);
  const prevTransportStepTokenRef = useRef(snapshot.transportStepToken);
  const reportedRef = useRef(false);

  useEffect(() => {
    if (!snapshot.active || !snapshot.journeyMode) {
      prevTouchpointIndexRef.current = null;
      prevTransportStepTokenRef.current = snapshot.transportStepToken;
      reportedRef.current = false;
      return;
    }

    const touchpointKey = snapshot.touchpointKey ?? "";
    const touchpointIndex = resolvePlaylistTouchpointIndex(
      [...snapshot.playlist],
      touchpointKey
    );
    const beatIndex = currentBeat?.id
      ? resolvePlaylistTouchpointIndex(
          [...snapshot.playlist],
          `beat:${currentBeat.id}`
        )
      : -1;

    const transportStepped =
      snapshot.transportStepToken !== prevTransportStepTokenRef.current;
    prevTransportStepTokenRef.current = snapshot.transportStepToken;

    const report = (failureStep: string, message: string, detail?: string) => {
      if (reportedRef.current) return;
      reportedRef.current = true;
      onDiagnosticRef.current(
        playbackTransportContractDiagnostic({
          journeyId: snapshot.journeyId,
          beatId: snapshot.beatId ?? currentBeat?.id,
          beatLabel: snapshot.beatLabel ?? currentBeat?.label,
          failureStep,
          message,
          detail,
          touchpoint: snapshot.touchpointLabel,
          visibleProgress: snapshot.visibleProgress,
        })
      );
    };

    if (
      transportStepped &&
      prevTouchpointIndexRef.current != null &&
      touchpointIndex >= 0
    ) {
      const frameSkip = detectPlaylistFrameSkip({
        prevTouchpointIndex: prevTouchpointIndexRef.current,
        nextTouchpointIndex: touchpointIndex,
        beatId: currentBeat?.id,
        nextTouchpointKey: touchpointKey,
      });
      if (frameSkip) {
        report(frameSkip.kind, frameSkip.message, frameSkip.detail);
      }
    }

    if (touchpointIndex >= 0) {
      const ahead = detectTouchpointAheadOfBeat({
        beatPlaylistIndex: beatIndex,
        touchpointPlaylistIndex: touchpointIndex,
        beatId: currentBeat?.id,
        touchpointKey,
      });
      if (ahead) {
        report(ahead.kind, ahead.message, ahead.detail);
      }

      prevTouchpointIndexRef.current = touchpointIndex;
    }

    const offAir = detectDirectorScriptOffAir({
      isScripting: snapshot.isScripting,
      isOnAir: snapshot.isOnAir,
      beatId: currentBeat?.id,
      scriptLabel: beatDirectorScriptLabel(currentBeat),
    });
    if (offAir) {
      report(offAir.kind, offAir.message, offAir.detail);
    }
  }, [currentBeat, snapshot]);
}
