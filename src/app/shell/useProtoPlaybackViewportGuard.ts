import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";
import type { JourneyBeat } from "@/app/orchestra/types";
import {
  beatExpectsViewportFollow,
  beatExpectsViewportFollowAfterScript,
  findJourneyBeat,
  touchpointExpectsViewportFollow,
} from "@/app/orchestra/journeyBeatDirector";
import { getPrototypeScrollRoot } from "@/app/proto/protoPlaybackScroll";
import {
  findSameScreenViewportAnchor,
  isAnchorCenterInScrollRoot,
  isElementInScrollRootViewport,
} from "@/app/shell/protoPlaybackViewportAnomalies";
import type { ViewportAnomaly } from "@/app/shell/protoPlaybackViewportAnomalies";
import {
  playbackViewportStallDiagnostic,
  type PlaybackDiagnosticError,
} from "@/app/shell/protoPlaybackDiagnostic";
import {
  playbackViewportMonitor,
  type PlaybackViewportMonitor,
} from "@/app/shell/protoPlaybackViewportMonitor";

type Snapshot = {
  active: boolean;
  isOnAir: boolean;
  isPausingBeforeReveal: boolean;
  screenFramesBeat: boolean;
  childIndex?: number | null;
  journeyId?: string;
  beatId?: string;
  beatLabel?: string;
  touchpointKey?: string;
  touchpointLabel?: string;
  visibleProgress?: string;
  journeyBeats?: readonly JourneyBeat[];
};

type Options = {
  snapshot: Snapshot;
  currentBeat?: JourneyBeat;
  scrollRootRef: RefObject<HTMLElement | null>;
  onDiagnostic: (error: PlaybackDiagnosticError) => void;
  monitor?: PlaybackViewportMonitor;
};

function measureViewportAnchors(
  scrollEl: HTMLElement | null
): { anchorInView: boolean; anchorProminent: boolean } {
  const anchor = findSameScreenViewportAnchor(document);
  if (!scrollEl || !anchor) {
    return { anchorInView: false, anchorProminent: false };
  }
  return {
    anchorInView: isElementInScrollRootViewport(anchor, scrollEl),
    anchorProminent: isAnchorCenterInScrollRoot(anchor, scrollEl),
  };
}

export function useProtoPlaybackViewportGuard({
  snapshot,
  currentBeat,
  scrollRootRef,
  onDiagnostic,
  monitor = playbackViewportMonitor,
}: Options): void {
  const onDiagnosticRef = useRef(onDiagnostic);
  onDiagnosticRef.current = onDiagnostic;

  const snapshotRef = useRef(snapshot);
  snapshotRef.current = snapshot;

  const currentBeatRef = useRef(currentBeat);
  currentBeatRef.current = currentBeat;

  const prevTouchpointKeyRef = useRef<string | undefined>(undefined);
  const prevBeatIdRef = useRef<string | undefined>(undefined);
  const prevChildIndexRef = useRef<number | null | undefined>(undefined);
  const prevScrollTopRef = useRef(0);
  const prevPausingRef = useRef(false);

  const pushMonitorContext = (scrollEl: HTMLElement | null) => {
    const snap = snapshotRef.current;
    const beat = currentBeatRef.current;
    const beatId = snap.beatId ?? beat?.id;
    const anchors = measureViewportAnchors(scrollEl);

    monitor.setContext({
      scrollTop: scrollEl?.scrollTop ?? 0,
      childIndex: snap.childIndex ?? null,
      beatId,
      beatLabel: snap.beatLabel ?? beat?.label,
      beatProtoTab: beat?.protoTab ?? null,
      touchpointKey: snap.touchpointKey,
      isScripting: snap.isPausingBeforeReveal,
      isPausingBeforeReveal: snap.isPausingBeforeReveal,
      screenFramesBeat: snap.screenFramesBeat,
      anchorInView: anchors.anchorInView,
      anchorProminent: anchors.anchorProminent,
    });
  };

  useEffect(() => {
    const report = (anomaly: ViewportAnomaly) => {
      const snap = snapshotRef.current;
      const beat = currentBeatRef.current;
      onDiagnosticRef.current(
        playbackViewportStallDiagnostic({
          journeyId: snap.journeyId,
          beatId: snap.beatId ?? beat?.id,
          beatLabel: snap.beatLabel ?? beat?.label,
          anomaly,
          touchpoint: snap.touchpointLabel,
          visibleProgress: snap.visibleProgress,
        })
      );
    };

    monitor.setOnAnomaly(report);
    return () => monitor.setOnAnomaly(null);
  }, [monitor]);

  useLayoutEffect(() => {
    const scrollEl = scrollRootRef.current ?? getPrototypeScrollRoot();
    pushMonitorContext(scrollEl);
  });

  useLayoutEffect(() => {
    if (!snapshot.active) {
      prevTouchpointKeyRef.current = undefined;
      prevBeatIdRef.current = undefined;
      prevChildIndexRef.current = undefined;
      prevPausingRef.current = false;
      return;
    }

    const scrollEl = scrollRootRef.current ?? getPrototypeScrollRoot();
    const touchpointKey = snapshot.touchpointKey;
    const beatId = snapshot.beatId ?? currentBeat?.id;
    const childIndex = snapshot.childIndex ?? null;
    const pausing = snapshot.isPausingBeforeReveal;

    const touchpointChanged =
      prevTouchpointKeyRef.current != null &&
      touchpointKey != null &&
      touchpointKey !== prevTouchpointKeyRef.current;
    const beatChanged =
      prevBeatIdRef.current != null &&
      beatId != null &&
      beatId !== prevBeatIdRef.current;
    const sameScreen =
      prevChildIndexRef.current != null &&
      childIndex != null &&
      childIndex === prevChildIndexRef.current;

    if ((touchpointChanged || beatChanged) && sameScreen) {
      const journeyBeats = snapshot.journeyBeats ?? [];
      const previousBeat = findJourneyBeat(journeyBeats, prevBeatIdRef.current);
      const nextBeat =
        findJourneyBeat(journeyBeats, beatId) ?? currentBeat;
      monitor.noteTouchpointAdvance({
        scrollTop: prevScrollTopRef.current,
        childIndex: prevChildIndexRef.current ?? childIndex,
        beatId: prevBeatIdRef.current,
        touchpointKey: prevTouchpointKeyRef.current,
        expectsViewportFollow: touchpointExpectsViewportFollow(
          prevTouchpointKeyRef.current,
          touchpointKey,
          beatExpectsViewportFollow(previousBeat, nextBeat)
        ),
      });
    }

    if (prevPausingRef.current && !pausing) {
      const beat = findJourneyBeat(snapshot.journeyBeats ?? [], beatId) ?? currentBeat;
      monitor.noteScriptingEnd({
        expectsViewportFollow: beatExpectsViewportFollowAfterScript(beat),
      });
    }

    if (scrollEl) {
      prevScrollTopRef.current = scrollEl.scrollTop;
    }

    prevTouchpointKeyRef.current = touchpointKey;
    prevBeatIdRef.current = beatId;
    prevChildIndexRef.current = childIndex;
    prevPausingRef.current = pausing;
  }, [
    currentBeat?.id,
    monitor,
    scrollRootRef,
    snapshot.active,
    snapshot.beatId,
    snapshot.childIndex,
    snapshot.isPausingBeforeReveal,
    snapshot.touchpointKey,
    snapshot.journeyBeats,
  ]);

  useEffect(() => {
    monitor.setActive(snapshot.active);
    if (!snapshot.active) {
      monitor.reset();
      return;
    }

    const scrollEl = scrollRootRef.current ?? getPrototypeScrollRoot();
    if (!scrollEl) return;

    const onScroll = () => pushMonitorContext(scrollEl);

    scrollEl.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      scrollEl.removeEventListener("scroll", onScroll);
    };
  }, [monitor, scrollRootRef, snapshot.active]);
}
