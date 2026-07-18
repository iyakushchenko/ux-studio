import { useEffect, useRef } from "react";
import type { JourneyBeat } from "@/app/orchestra/types";
import {
  describeBeatScript,
  PLAYBACK_STALL_TIMEOUT_MS,
  playbackStallDiagnostic,
  type PlaybackDiagnosticError,
} from "@/app/shell/protoPlaybackDiagnostic";

export type PlaybackGuardSnapshot = {
  isOnAir: boolean;
  isScripting: boolean;
  isPausingBeforeReveal: boolean;
  beatId?: string;
  beatLabel?: string;
  journeyId?: string;
  touchpointKey?: string;
  touchpointLabel?: string;
  visibleProgress?: string;
  availabilityOpen?: boolean;
  availStep?: string | null;
};

type Options = {
  snapshot: PlaybackGuardSnapshot;
  currentBeat?: JourneyBeat;
  onDiagnostic: (error: PlaybackDiagnosticError) => void;
};

function progressFingerprint(snapshot: PlaybackGuardSnapshot): string {
  return [
    snapshot.beatId ?? "",
    snapshot.touchpointKey ?? "",
    snapshot.visibleProgress ?? "",
    snapshot.isScripting ? "scripting" : "",
    snapshot.isPausingBeforeReveal ? "prelude" : "",
    snapshot.availabilityOpen ? `avail:${snapshot.availStep ?? "?"}` : "",
  ].join("|");
}

export function useProtoPlaybackGuard({
  snapshot,
  currentBeat,
  onDiagnostic,
}: Options): void {
  const onDiagnosticRef = useRef(onDiagnostic);
  onDiagnosticRef.current = onDiagnostic;

  const lastProgressRef = useRef<string>("");
  const lastProgressAtRef = useRef<number>(Date.now());
  const reportedRef = useRef(false);

  useEffect(() => {
    if (!snapshot.isOnAir) {
      lastProgressRef.current = "";
      lastProgressAtRef.current = Date.now();
      reportedRef.current = false;
      return;
    }

    const fingerprint = progressFingerprint(snapshot);
    if (fingerprint !== lastProgressRef.current) {
      lastProgressRef.current = fingerprint;
      lastProgressAtRef.current = Date.now();
      reportedRef.current = false;
    }

    const interval = window.setInterval(() => {
      if (!snapshot.isOnAir || reportedRef.current) return;

      const stalledFor = Date.now() - lastProgressAtRef.current;
      if (stalledFor < PLAYBACK_STALL_TIMEOUT_MS) return;

      const script = describeBeatScript(currentBeat);
      reportedRef.current = true;
      onDiagnosticRef.current(
        playbackStallDiagnostic({
          journeyId: snapshot.journeyId,
          beatId: snapshot.beatId,
          beatLabel: snapshot.beatLabel,
          scriptKind: script?.kind,
          scriptId: script?.id,
          lastProgress: snapshot.touchpointLabel ?? lastProgressRef.current,
          detail: `onAir=${snapshot.isOnAir} scripting=${snapshot.isScripting} prelude=${snapshot.isPausingBeforeReveal} avail=${snapshot.availabilityOpen}:${snapshot.availStep ?? ""}`,
        })
      );
    }, 2000);

    return () => window.clearInterval(interval);
  }, [snapshot, currentBeat]);
}
