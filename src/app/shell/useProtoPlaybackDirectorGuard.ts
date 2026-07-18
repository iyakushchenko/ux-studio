import { useEffect, useRef } from "react";
import type { JourneyBeat } from "@/app/orchestra/types";
import {
  playbackCursorAnomalyDiagnostic,
  type PlaybackDiagnosticError,
} from "@/app/shell/protoPlaybackDiagnostic";
import type { CursorAnomaly } from "@/app/shell/protoPlaybackCursorAnomalies";
import {
  playbackDirectorMonitor,
  type PlaybackDirectorMonitor,
} from "@/app/shell/protoPlaybackDirectorMonitor";

type Snapshot = {
  active: boolean;
  journeyId?: string;
  beatId?: string;
  beatLabel?: string;
  touchpointLabel?: string;
  visibleProgress?: string;
};

type Options = {
  snapshot: Snapshot;
  currentBeat?: JourneyBeat;
  onDiagnostic: (error: PlaybackDiagnosticError) => void;
  monitor?: PlaybackDirectorMonitor;
};

export function useProtoPlaybackDirectorGuard({
  snapshot,
  currentBeat,
  onDiagnostic,
  monitor = playbackDirectorMonitor,
}: Options): void {
  const onDiagnosticRef = useRef(onDiagnostic);
  onDiagnosticRef.current = onDiagnostic;

  useEffect(() => {
    const report = (anomaly: CursorAnomaly) => {
      onDiagnosticRef.current(
        playbackCursorAnomalyDiagnostic({
          journeyId: snapshot.journeyId,
          beatId: snapshot.beatId ?? currentBeat?.id,
          beatLabel: snapshot.beatLabel ?? currentBeat?.label,
          anomaly,
          touchpoint: snapshot.touchpointLabel,
          visibleProgress: snapshot.visibleProgress,
        })
      );
    };

    monitor.setOnAnomaly(report);
    return () => monitor.setOnAnomaly(null);
  }, [
    currentBeat?.id,
    currentBeat?.label,
    monitor,
    snapshot.beatId,
    snapshot.beatLabel,
    snapshot.journeyId,
    snapshot.touchpointLabel,
    snapshot.visibleProgress,
  ]);

  useEffect(() => {
    monitor.setActive(snapshot.active);
    if (!snapshot.active) {
      monitor.reset();
      return;
    }
    monitor.reset();

    return () => {
      monitor.setActive(false);
    };
  }, [monitor, snapshot.active]);
}
