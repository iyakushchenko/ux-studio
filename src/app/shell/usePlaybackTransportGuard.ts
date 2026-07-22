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
} from "@/app/shell/playbackDiagnostic";
import {
  detectDirectorScriptOffAir,
  detectPlaylistFrameSkip,
  detectStrayPopupOnBeat,
  detectTouchpointAheadOfBeat,
} from "@/app/shell/playbackTransportAnomalies";
import {
  detectPlaybackStateAlignment,
  shouldDiscardQueuedAlignmentFrame,
} from "@/app/shell/playbackStateAlignment";
import { isStudioPostAgentResetSyncLocked, parseStudioUrl } from "@/app/shell/studioUrl";

export type TransportGuardSnapshot = {
  active: boolean;
  journeyMode: boolean;
  isOnAir: boolean;
  isScripting: boolean;
  /** CJM step-back DOM sync in flight — beat/UI may disagree for a tick. */
  retreatSyncing?: boolean;
  isPausingBeforeReveal?: boolean;
  journeyId?: string;
  beatId?: string;
  beatLabel?: string;
  touchpointKey?: string;
  touchpointLabel?: string;
  visibleProgress?: string;
  playlist: readonly StudioTouchpointEntry[];
  /** Increments on each manual cassette transport action. */
  transportStepToken: number;
  currentTabIndex: number;
  expectedTabIndex?: number;
  renderedScreenId?: string;
  visibleCount: number;
  totalFrames: number;
  availabilityOpen?: boolean;
  loginPopupOpen?: boolean;
  vaccinePickerOpen?: boolean;
  recipientPickerOpen?: boolean;
  quickViewOpen?: boolean;
};

type Options = {
  snapshot: TransportGuardSnapshot;
  currentBeat?: JourneyBeat;
  onDiagnostic: (error: PlaybackDiagnosticError) => void;
};

export function usePlaybackTransportGuard({
  snapshot,
  currentBeat,
  onDiagnostic,
}: Options): void {
  const onDiagnosticRef = useRef(onDiagnostic);
  onDiagnosticRef.current = onDiagnostic;
  const latestSnapshotRef = useRef(snapshot);
  latestSnapshotRef.current = snapshot;
  const latestBeatIdRef = useRef(currentBeat?.id);
  latestBeatIdRef.current = currentBeat?.id;
  const latestBeatRef = useRef(currentBeat);
  latestBeatRef.current = currentBeat;

  const prevTouchpointIndexRef = useRef<number | null>(null);
  const prevTouchpointKeyRef = useRef<string | null>(null);
  const prevTransportStepTokenRef = useRef(snapshot.transportStepToken);
  const reportedRef = useRef(false);
  const alignmentFingerprintRef = useRef<string | null>(null);
  const alignmentGraceUntilRef = useRef(0);
  const transportValidatedRef = useRef(false);

  useEffect(() => {
    if (!snapshot.active || !snapshot.journeyMode) {
      prevTouchpointIndexRef.current = null;
      prevTouchpointKeyRef.current = null;
      prevTransportStepTokenRef.current = snapshot.transportStepToken;
      reportedRef.current = false;
      alignmentFingerprintRef.current = null;
      transportValidatedRef.current = false;
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
    if (transportStepped) {
      transportValidatedRef.current = true;
      alignmentGraceUntilRef.current = performance.now() + 600;
    }

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
        prevTouchpointKey: prevTouchpointKeyRef.current ?? undefined,
        beatId: currentBeat?.id,
        nextTouchpointKey: touchpointKey,
      });
      if (frameSkip) {
        report(frameSkip.kind, frameSkip.message, frameSkip.detail);
      }
    }

    if (touchpointIndex >= 0) {
      // Retreat/director sync: closeAvailability + beat index can land before
      // wire/URL catch up — do not Alarm on that one-tick paint.
      if (!snapshot.isScripting && !snapshot.retreatSyncing) {
        const ahead = detectTouchpointAheadOfBeat({
          beatPlaylistIndex: beatIndex,
          touchpointPlaylistIndex: touchpointIndex,
          beatId: currentBeat?.id,
          touchpointKey,
        });
        if (ahead) {
          report(ahead.kind, ahead.message, ahead.detail);
        }
      }

      prevTouchpointIndexRef.current = touchpointIndex;
      prevTouchpointKeyRef.current = touchpointKey;
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

    const strayPopup = detectStrayPopupOnBeat({
      beatId: currentBeat?.id,
      isScripting: snapshot.isScripting,
      availabilityOpen: snapshot.availabilityOpen,
      loginPopupOpen: snapshot.loginPopupOpen,
      vaccinePickerOpen: snapshot.vaccinePickerOpen,
      recipientPickerOpen: snapshot.recipientPickerOpen,
      quickViewOpen: snapshot.quickViewOpen,
    });
    if (strayPopup) {
      report(strayPopup.kind, strayPopup.message, strayPopup.detail);
    }

    if (
      snapshot.isOnAir ||
      snapshot.isScripting ||
      snapshot.retreatSyncing ||
      snapshot.isPausingBeforeReveal ||
      // A freshly armed QA session is not a transport result. Wait for the
      // first explicit cassette action before checking the tuple; otherwise
      // React's URL-reset effect can self-create a false fail handoff.
      !transportValidatedRef.current
    ) {
      return;
    }

    // URL reflection is passive-effect owned. Sample one animation frame later
    // so a legitimate navigation commit is not reported as a mismatch.
    let retryTimer: number | null = null;
    const validateAlignment = () => {
      if (isStudioPostAgentResetSyncLocked()) {
        // URL sync deliberately writes on the next effect just after the reset
        // lock lifts; retain a small handoff grace so this validator samples the
        // reconciled address bar, never the prior screen.
        alignmentGraceUntilRef.current = Math.max(
          alignmentGraceUntilRef.current,
          performance.now() + 300
        );
        retryTimer = window.setTimeout(validateAlignment, 100);
        return;
      }
      const graceLeft = alignmentGraceUntilRef.current - performance.now();
      if (graceLeft > 0) {
        retryTimer = window.setTimeout(validateAlignment, graceLeft + 16);
        return;
      }
      const latest = latestSnapshotRef.current;
      // A render can enter a scripted handoff after this frame was queued.
      // Never validate a stale pre-handoff tuple against its next touchpoint.
      if (shouldDiscardQueuedAlignmentFrame(
        { beatId: currentBeat?.id, touchpointKey: snapshot.touchpointKey },
        {
          beatId: latestBeatIdRef.current,
          touchpointKey: latest.touchpointKey,
          isOnAir: latest.isOnAir,
          isScripting: latest.isScripting,
          retreatSyncing: latest.retreatSyncing,
          isPausingBeforeReveal: latest.isPausingBeforeReveal,
        }
      )) {
        return;
      }
      const anomalies = detectPlaybackStateAlignment({
        beat: latestBeatRef.current,
        playlist: latest.playlist,
        touchpointKey: latest.touchpointKey ?? "",
        currentTabIndex: latest.currentTabIndex,
        expectedTabIndex: latest.expectedTabIndex,
        renderedScreenId: latest.renderedScreenId,
        addressScreenId: parseStudioUrl().screenId,
        visibleCount: latest.visibleCount,
        totalFrames: latest.totalFrames,
      });
      const anomaly = anomalies[0];
      if (!anomaly) {
        alignmentFingerprintRef.current = null;
        return;
      }
      const fingerprint = `${anomaly.kind}:${anomaly.detail}`;
      if (alignmentFingerprintRef.current === fingerprint) return;
      alignmentFingerprintRef.current = fingerprint;
      onDiagnosticRef.current(
        playbackTransportContractDiagnostic({
          journeyId: latest.journeyId,
          beatId: latest.beatId ?? latestBeatRef.current?.id,
          beatLabel: latest.beatLabel ?? latestBeatRef.current?.label,
          failureStep: anomaly.kind,
          message: anomaly.message,
          detail: anomaly.detail,
          touchpoint: latest.touchpointLabel,
          visibleProgress: latest.visibleProgress,
        })
      );
    };
    const frame = window.requestAnimationFrame(validateAlignment);
    return () => {
      window.cancelAnimationFrame(frame);
      if (retryTimer != null) window.clearTimeout(retryTimer);
    };
  }, [currentBeat, snapshot]);
}
