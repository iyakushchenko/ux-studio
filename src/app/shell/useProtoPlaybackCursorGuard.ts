import { useEffect, useLayoutEffect, useRef } from "react";
import type { JourneyBeat } from "@/app/orchestra/types";
import {
  playbackCursorAnomalyDiagnostic,
  type PlaybackDiagnosticError,
} from "@/app/shell/protoPlaybackDiagnostic";
import type { CursorAnomaly } from "@/app/shell/protoPlaybackCursorAnomalies";
import {
  playbackCursorMonitor,
  type PlaybackCursorMonitor,
} from "@/app/shell/protoPlaybackCursorMonitor";

type Snapshot = {
  active: boolean;
  isOnAir: boolean;
  isPausingBeforeReveal: boolean;
  journeyMode?: boolean;
  childIndex?: number | null;
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
  monitor?: PlaybackCursorMonitor;
};

export function useProtoPlaybackCursorGuard({
  snapshot,
  currentBeat,
  onDiagnostic,
  monitor = playbackCursorMonitor,
}: Options): void {
  const onDiagnosticRef = useRef(onDiagnostic);
  onDiagnosticRef.current = onDiagnostic;

  const prevBeatIdRef = useRef<string | undefined>(undefined);
  const prevChildIndexRef = useRef<number | null | undefined>(undefined);
  const prevPausingRef = useRef(false);

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
    monitor.setContext({
      isScripting: snapshot.isPausingBeforeReveal,
      isOnAir: snapshot.isOnAir,
      isPausingBeforeReveal: snapshot.isPausingBeforeReveal,
      journeyMode: snapshot.journeyMode,
      beatId: snapshot.beatId ?? currentBeat?.id,
      beatLabel: snapshot.beatLabel ?? currentBeat?.label,
      childIndex: snapshot.childIndex,
      touchpointLabel: snapshot.touchpointLabel,
    });
  }, [currentBeat?.id, currentBeat?.label, monitor, snapshot]);

  useLayoutEffect(() => {
    if (!snapshot.active) {
      prevBeatIdRef.current = undefined;
      prevChildIndexRef.current = undefined;
      prevPausingRef.current = false;
      return;
    }

    const beatId = snapshot.beatId ?? currentBeat?.id;
    const childIndex = snapshot.childIndex ?? null;
    const pausing = snapshot.isPausingBeforeReveal;

    if (
      prevBeatIdRef.current != null &&
      beatId != null &&
      beatId !== prevBeatIdRef.current
    ) {
      monitor.noteBeatOrScreenChange();
    } else if (
      prevChildIndexRef.current != null &&
      childIndex != null &&
      childIndex !== prevChildIndexRef.current
    ) {
      monitor.noteBeatOrScreenChange();
    }

    if (prevPausingRef.current && !pausing) {
      monitor.noteScriptingEnd();
    }

    prevBeatIdRef.current = beatId;
    prevChildIndexRef.current = childIndex;
    prevPausingRef.current = pausing;
  }, [
    currentBeat?.id,
    monitor,
    snapshot.active,
    snapshot.beatId,
    snapshot.childIndex,
    snapshot.isPausingBeforeReveal,
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
