import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { exitDemoCursor } from "@/app/proto/protoDemoCursor";
import {
  applyScenarioFrameVisibility,
  bumpScenarioScrollGeneration,
  PROTO_SCENARIO_MIN_VISIBLE_FRAMES,
  scheduleScenarioScroll,
  scenarioScrollTiming,
  scenarioScrollTopBeforeCollapse,
  scrollPrototypeScrollToTop,
  type ScenarioScrollAlign,
  type ScenarioScrollTiming,
} from "@/app/proto/protoScenarioEngine";

type Options = {
  active: boolean;
  collectFrames: () => HTMLElement[];
  screenSelector?: string;
  scrollRootRef?: RefObject<HTMLElement | null>;
  minVisibleFrames?: number;
  playbackStepMs?: number;
  playbackStepHooks?: PlaybackStepHooks;
};

export type PlaybackStepHooks = {
  /** Async prelude before a frame is revealed (thinking, typing, CTA clicks). */
  beforeReveal?: (ctx: BeforeRevealContext) => Promise<void>;
  /** After the last frame is visible — e.g. exit CTA opens another surface. */
  onFinale?: () => Promise<void>;
  /** When leaving the post-content finale beat (e.g. close Availability popup). */
  onLeaveFinale?: () => void;
  onPreludeAbort?: () => void;
  /** @deprecated Use beforeReveal */
  shouldPauseBeforeReveal?: (frame: HTMLElement, frameIndex: number) => boolean;
  pauseBeforeRevealMs?: number;
  onPauseBeforeRevealStart?: (frame: HTMLElement, frameIndex: number) => void;
  onPauseBeforeRevealEnd?: () => void;
};

export type BeforeRevealContext = {
  frame: HTMLElement;
  frameIndex: number;
  frames: HTMLElement[];
  currentCount: number;
};

type PlaybackMode = "idle" | "playing";

type AdvanceOptions = {
  /** Manual step — reveal immediately without typing/thinking preludes. */
  skipPrelude?: boolean;
};

type ScrollIntent = {
  visibleCount: number;
  prevCount: number;
  align: ScenarioScrollAlign;
  smooth: boolean;
  timing: ScenarioScrollTiming;
};

function clearScenarioFrameStyles(frames: HTMLElement[]): void {
  frames.forEach((frame) => {
    const id = frame.dataset.protoScenarioHideTid;
    if (id) window.clearTimeout(Number(id));
    frame.style.display = "";
    delete frame.dataset.protoScenarioVisible;
    delete frame.dataset.protoScenarioFrame;
    delete frame.dataset.protoScenarioHideTid;
    frame.classList.remove("proto-scenario-frame", "proto-scenario-frame--hidden");
  });
}

function clampVisible(
  count: number,
  scenarioTotal: number,
  minVisible: number
): number {
  if (scenarioTotal === 0) return 0;
  return Math.max(minVisible, Math.min(count, scenarioTotal));
}

function scenarioTotalFor(contentFrameCount: number, hasFinale: boolean): number {
  return contentFrameCount + (hasFinale ? 1 : 0);
}

function bubbleVisibleCount(visibleCount: number, contentFrameCount: number): number {
  if (contentFrameCount === 0) return 0;
  return Math.min(visibleCount, contentFrameCount);
}

function scrollAlignForCount(count: number, minVisible: number): ScenarioScrollAlign {
  return count <= minVisible ? "start" : "end";
}

export function useProtoScenarioPlayback({
  active,
  collectFrames,
  screenSelector,
  scrollRootRef,
  minVisibleFrames = PROTO_SCENARIO_MIN_VISIBLE_FRAMES,
  playbackStepMs = 2000,
  playbackStepHooks,
}: Options) {
  const framesRef = useRef<HTMLElement[]>([]);
  const playTimerRef = useRef<number | null>(null);
  const pauseCleanupRef = useRef<(() => void) | null>(null);
  const pendingRevealRef = useRef<(() => void) | null>(null);
  const preludeGenerationRef = useRef(0);
  const isPlayingRef = useRef(false);
  const initializedRef = useRef(false);
  const initialScrollDoneRef = useRef(false);
  const visibleCountRef = useRef(0);
  const scrollIntentRef = useRef<ScrollIntent | null>(null);

  const [totalFrames, setTotalFrames] = useState(0);
  const [visibleCount, setVisibleCount] = useState(0);
  const [playbackMode, setPlaybackMode] = useState<PlaybackMode>("idle");
  const [isPausingBeforeReveal, setIsPausingBeforeReveal] = useState(false);

  const isPlaying = playbackMode === "playing";
  const hasFinale = Boolean(playbackStepHooks?.onFinale);
  const contentFrameCount = hasFinale
    ? Math.max(0, totalFrames - 1)
    : totalFrames;
  const atFinaleFrame =
    hasFinale && totalFrames > 0 && visibleCount >= totalFrames;
  /** Default landing position — content end for finale scenarios, full end otherwise. */
  const pristineVisibleCount =
    hasFinale && contentFrameCount > 0 ? contentFrameCount : totalFrames;

  const queueScroll = useCallback(
    (
      count: number,
      align?: ScenarioScrollAlign,
      smooth = true,
      prevCount = visibleCountRef.current
    ) => {
      const resolvedAlign = align ?? scrollAlignForCount(count, minVisibleFrames);
      scrollIntentRef.current = {
        visibleCount: count,
        prevCount,
        align: resolvedAlign,
        smooth,
        timing: scenarioScrollTiming(prevCount, count),
      };
    },
    [minVisibleFrames]
  );

  const clearPreRevealPause = useCallback(() => {
    preludeGenerationRef.current += 1;
    if (playTimerRef.current != null) {
      window.clearTimeout(playTimerRef.current);
      playTimerRef.current = null;
    }
    if (pauseCleanupRef.current) {
      pauseCleanupRef.current();
      pauseCleanupRef.current = null;
    }
    pendingRevealRef.current = null;
    playbackStepHooks?.onPreludeAbort?.();
    setIsPausingBeforeReveal(false);
    bumpScenarioScrollGeneration();
  }, [playbackStepHooks]);

  const retreatFromFinale = useCallback(() => {
    const frames = framesRef.current;
    const contentTotal = frames.length;
    const scenarioTotal = scenarioTotalFor(contentTotal, hasFinale);
    if (!hasFinale || visibleCountRef.current < scenarioTotal) return;

    const prev = visibleCountRef.current;
    queueScroll(contentTotal, "end", false, prev);
    setVisibleCount(contentTotal);
  }, [hasFinale, queueScroll]);

  const [playbackEndToken, setPlaybackEndToken] = useState(0);

  const stopPlayback = useCallback(() => {
    clearPreRevealPause();
    isPlayingRef.current = false;
    setPlaybackMode("idle");
  }, [clearPreRevealPause]);

  const completePlayback = useCallback(() => {
    if (isPlayingRef.current) {
      setPlaybackEndToken((token) => token + 1);
    }
    stopPlayback();
    void exitDemoCursor();
  }, [stopPlayback]);

  const syncFrames = useCallback(() => {
    const frames = collectFrames();
    framesRef.current = frames;
    frames.forEach((frame, index) => {
      frame.dataset.protoScenarioFrame = String(index + 1);
    });
    setTotalFrames(scenarioTotalFor(frames.length, hasFinale));

    if (!initializedRef.current && frames.length > 0) {
      initializedRef.current = true;
      const contentTotal = frames.length;
      const scenarioTotal = scenarioTotalFor(contentTotal, hasFinale);
      const pristine =
        hasFinale && contentTotal > 0 ? contentTotal : scenarioTotal;
      const initialCount = clampVisible(
        pristine,
        scenarioTotal,
        minVisibleFrames
      );
      visibleCountRef.current = initialCount;
      scrollIntentRef.current = {
        visibleCount: initialCount,
        prevCount: 0,
        align: scrollAlignForCount(initialCount, minVisibleFrames),
        smooth: true,
        timing: "after-init",
      };
      setVisibleCount(initialCount);
    } else if (frames.length > 0) {
      const scenarioTotal = scenarioTotalFor(frames.length, hasFinale);
      setVisibleCount((prev) => {
        // RAF re-sync can run before the init setState lands — keep progressive entry.
        if (prev === 0) {
          return clampVisible(minVisibleFrames, scenarioTotal, minVisibleFrames);
        }
        return clampVisible(prev, scenarioTotal, minVisibleFrames);
      });
    }

    return frames;
  }, [collectFrames, hasFinale, minVisibleFrames]);

  const refreshFrameList = useCallback(() => {
    const frames = collectFrames();
    if (frames.length === 0) return frames;
    framesRef.current = frames;
    frames.forEach((frame, index) => {
      frame.dataset.protoScenarioFrame = String(index + 1);
    });
    setTotalFrames(scenarioTotalFor(frames.length, hasFinale));
    const count =
      visibleCountRef.current > 0
        ? visibleCountRef.current
        : clampVisible(
            hasFinale && frames.length > 0 ? frames.length : minVisibleFrames,
            scenarioTotalFor(frames.length, hasFinale),
            minVisibleFrames
          );
    applyScenarioFrameVisibility(frames, bubbleVisibleCount(count, frames.length));
    return frames;
  }, [collectFrames, hasFinale, minVisibleFrames]);

  useLayoutEffect(() => {
    visibleCountRef.current = visibleCount;
  }, [visibleCount]);

  useLayoutEffect(() => {
    if (!active) {
      stopPlayback();
      clearScenarioFrameStyles(framesRef.current);
      framesRef.current = [];
      initializedRef.current = false;
      initialScrollDoneRef.current = false;
      scrollIntentRef.current = null;
      setTotalFrames(0);
      setVisibleCount(0);
      return;
    }

    syncFrames();
    const raf = requestAnimationFrame(() => refreshFrameList());
    return () => cancelAnimationFrame(raf);
  }, [active, refreshFrameList, syncFrames, stopPlayback]);

  useLayoutEffect(() => {
    if (!active) return;

    const frames = framesRef.current;
    if (frames.length === 0) return;

    const pendingInit = scrollIntentRef.current?.visibleCount ?? 0;
    const effectiveCount =
      visibleCount > 0 ? visibleCount : pendingInit > 0 ? pendingInit : 0;
    if (effectiveCount === 0) return;

    const intent = scrollIntentRef.current;
    if (
      intent &&
      intent.visibleCount === effectiveCount &&
      scenarioScrollTopBeforeCollapse(
        intent.prevCount,
        intent.visibleCount,
        intent.align,
        minVisibleFrames
      )
    ) {
      scrollPrototypeScrollToTop(scrollRootRef?.current, "instant");
    }

    applyScenarioFrameVisibility(
      frames,
      bubbleVisibleCount(effectiveCount, frames.length)
    );

    if (intent && intent.visibleCount === effectiveCount) {
      if (intent.timing === "after-init" && initialScrollDoneRef.current) {
        scrollIntentRef.current = null;
        return;
      }

      scheduleScenarioScroll(
        frames,
        intent.visibleCount,
        intent.align,
        scrollRootRef?.current,
        intent.smooth,
        intent.timing,
        intent.prevCount
      );
      scrollIntentRef.current = null;

      if (intent.timing === "after-init") {
        initialScrollDoneRef.current = true;
      }
    }
  }, [active, minVisibleFrames, scrollRootRef, visibleCount]);

  useEffect(() => () => stopPlayback(), [stopPlayback]);

  const scheduleNext = useCallback(() => {
    if (!isPlayingRef.current) return;
    playTimerRef.current = window.setTimeout(() => {
      playTimerRef.current = null;
      if (!isPlayingRef.current) return;
      if (!advanceOneFrameRef.current(scheduleNext)) {
        completePlayback();
      }
    }, playbackStepMs);
  }, [completePlayback, playbackStepMs]);

  const advanceOneFrameRef = useRef<
    (onRevealed?: () => void, options?: AdvanceOptions) => boolean
  >(() => false);

  const advanceOneFrame = useCallback(
    (onRevealed?: () => void, options?: AdvanceOptions): boolean => {
      const frames = framesRef.current;
      const current = visibleCountRef.current;
      const contentTotal = frames.length;
      const scenarioTotal = scenarioTotalFor(contentTotal, hasFinale);
      if (playTimerRef.current != null && !options?.skipPrelude) return false;

      const skipPrelude = options?.skipPrelude === true;

      const runFinale = (): boolean => {
        if (!playbackStepHooks?.onFinale || current >= scenarioTotal) return false;
        if (current < contentTotal) return false;

        setIsPausingBeforeReveal(true);
        pauseCleanupRef.current = () => {
          playbackStepHooks?.onPreludeAbort?.();
          setIsPausingBeforeReveal(false);
        };

        const finishFinale = () => {
          pauseCleanupRef.current = null;
          setIsPausingBeforeReveal(false);
          queueScroll(scenarioTotal, "end", false, current);
          setVisibleCount(scenarioTotal);
          completePlayback();
        };

        void (async () => {
          try {
            await playbackStepHooks.onFinale!();
          } finally {
            if (visibleCountRef.current < contentTotal) return;
            finishFinale();
          }
        })();

        return true;
      };

      if (current >= contentTotal) {
        return runFinale();
      }

      const next = clampVisible(current + 1, scenarioTotal, minVisibleFrames);
      const frame = frames[next - 1];
      const fromCount = current;

      const revealFrame = (generation: number) => {
        if (preludeGenerationRef.current !== generation) return;
        if (visibleCountRef.current !== fromCount) return;

        setIsPausingBeforeReveal(false);
        queueScroll(next, "end", false, fromCount);
        setVisibleCount(next);

        if (next >= contentTotal) {
          if (onRevealed) {
            onRevealed();
          } else {
            completePlayback();
          }
          return;
        }

        onRevealed?.();
      };

      const runPrelude = async (generation: number) => {
        if (preludeGenerationRef.current !== generation) return;

        const hasBeforeReveal = Boolean(playbackStepHooks?.beforeReveal);
        const legacyPause =
          !skipPrelude &&
          !hasBeforeReveal &&
          (playbackStepHooks?.shouldPauseBeforeReveal?.(frame, next) ?? false);

        if (skipPrelude || (!hasBeforeReveal && !legacyPause)) {
          if (!skipPrelude) {
            revealFrame(generation);
            return;
          }
          playbackStepHooks?.onPreludeAbort?.();
          revealFrame(generation);
          return;
        }

        setIsPausingBeforeReveal(true);
        pendingRevealRef.current = () => revealFrame(generation);
        pauseCleanupRef.current = () => {
          playbackStepHooks?.onPreludeAbort?.();
          setIsPausingBeforeReveal(false);
        };

        try {
          if (hasBeforeReveal) {
            await playbackStepHooks!.beforeReveal!({
              frame,
              frameIndex: next,
              frames,
              currentCount: fromCount,
            });
          } else {
            playbackStepHooks?.onPauseBeforeRevealStart?.(frame, next);
            await new Promise<void>((resolve) => {
              playTimerRef.current = window.setTimeout(() => {
                playTimerRef.current = null;
                resolve();
              }, playbackStepHooks?.pauseBeforeRevealMs ?? 1400);
            });
            playbackStepHooks?.onPauseBeforeRevealEnd?.();
          }
        } finally {
          pendingRevealRef.current = null;
          pauseCleanupRef.current = null;
        }

        if (preludeGenerationRef.current !== generation) return;
        if (visibleCountRef.current !== fromCount) return;
        revealFrame(generation);
      };

      const generation = preludeGenerationRef.current;
      playTimerRef.current = window.setTimeout(() => {
        playTimerRef.current = null;
        void runPrelude(generation);
      }, 0);

      return true;
    },
    [hasFinale, minVisibleFrames, playbackStepHooks, queueScroll, completePlayback, stopPlayback]
  );

  advanceOneFrameRef.current = advanceOneFrame;

  const stepBack = useCallback(() => {
    stopPlayback();
    const frames = framesRef.current;
    const contentTotal = frames.length;
    const scenarioTotal = scenarioTotalFor(contentTotal, hasFinale);

    if (hasFinale && visibleCountRef.current >= scenarioTotal) {
      playbackStepHooks?.onLeaveFinale?.();
      retreatFromFinale();
      return;
    }

    setVisibleCount((count) => {
      const next = clampVisible(count - 1, scenarioTotal, minVisibleFrames);
      const align = scrollAlignForCount(next, minVisibleFrames);
      queueScroll(next, align, false, count);
      return next;
    });
  }, [
    hasFinale,
    minVisibleFrames,
    playbackStepHooks,
    queueScroll,
    retreatFromFinale,
    stopPlayback,
  ]);

  const stepForward = useCallback(() => {
    const shouldResumePlay = isPlayingRef.current;

    if (playTimerRef.current != null) {
      window.clearTimeout(playTimerRef.current);
      playTimerRef.current = null;
    }

    if (pendingRevealRef.current) {
      playbackStepHooks?.onPreludeAbort?.();
      pauseCleanupRef.current = null;
      const reveal = pendingRevealRef.current;
      pendingRevealRef.current = null;
      setIsPausingBeforeReveal(false);
      reveal();
      preludeGenerationRef.current += 1;
      bumpScenarioScrollGeneration();

      isPlayingRef.current = shouldResumePlay;
      setPlaybackMode(shouldResumePlay ? "playing" : "idle");
      if (shouldResumePlay) {
        scheduleNext();
      }
      return;
    }

    bumpScenarioScrollGeneration();
    preludeGenerationRef.current += 1;

    playbackStepHooks?.onPreludeAbort?.();
    pauseCleanupRef.current = null;
    setIsPausingBeforeReveal(false);

    isPlayingRef.current = shouldResumePlay;
    setPlaybackMode(shouldResumePlay ? "playing" : "idle");

    advanceOneFrame(shouldResumePlay ? scheduleNext : undefined, {
      skipPrelude: true,
    });
  }, [advanceOneFrame, playbackStepHooks, scheduleNext]);

  const play = useCallback(() => {
    if (isPlayingRef.current) {
      stopPlayback();
      return;
    }

    const frames = framesRef.current;
    const scenarioTotal = scenarioTotalFor(frames.length, hasFinale);
    if (frames.length === 0 || playTimerRef.current != null) return;

    if (visibleCountRef.current >= scenarioTotal) {
      stopPlayback();
      return;
    }

    isPlayingRef.current = true;
    setPlaybackMode("playing");

    if (!advanceOneFrame(scheduleNext)) {
      stopPlayback();
    }
  }, [advanceOneFrame, hasFinale, scheduleNext, stopPlayback]);

  const jumpToStart = useCallback(() => {
    stopPlayback();
    const frames = framesRef.current;
    const contentTotal = frames.length;
    const scenarioTotal = scenarioTotalFor(contentTotal, hasFinale);

    if (hasFinale && visibleCountRef.current >= scenarioTotal) {
      playbackStepHooks?.onLeaveFinale?.();
      retreatFromFinale();
    }

    if (frames.length > 0 && visibleCountRef.current > minVisibleFrames) {
      const prev = visibleCountRef.current;
      queueScroll(minVisibleFrames, "start", false, prev);
      setVisibleCount(minVisibleFrames);
      return;
    }
    scheduleScenarioScroll(
      frames,
      minVisibleFrames,
      "start",
      scrollRootRef?.current,
      false,
      "immediate",
      visibleCountRef.current
    );
  }, [
    hasFinale,
    minVisibleFrames,
    playbackStepHooks,
    queueScroll,
    retreatFromFinale,
    scrollRootRef,
    stopPlayback,
  ]);

  const jumpToEnd = useCallback(() => {
    stopPlayback();
    const frames = framesRef.current;
    const contentTotal = frames.length;
    const scenarioTotal = scenarioTotalFor(contentTotal, hasFinale);
    if (scenarioTotal === 0 || visibleCountRef.current >= scenarioTotal) return;

    const prev = visibleCountRef.current;

    if (visibleCountRef.current < contentTotal) {
      queueScroll(contentTotal, "end", false, prev);
      setVisibleCount(contentTotal);
      visibleCountRef.current = contentTotal;
    }

    if (hasFinale && visibleCountRef.current < scenarioTotal) {
      advanceOneFrame();
      return;
    }

    queueScroll(contentTotal, "end", false, prev);
    setVisibleCount(contentTotal);
  }, [advanceOneFrame, hasFinale, queueScroll, stopPlayback]);

  const resetToEnd = useCallback(() => {
    stopPlayback();
    const frames = framesRef.current;
    const contentTotal = frames.length;
    const scenarioTotal = scenarioTotalFor(contentTotal, hasFinale);
    const target =
      hasFinale && contentTotal > 0 ? contentTotal : scenarioTotal;
    if (target === 0) return;

    if (hasFinale && visibleCountRef.current >= scenarioTotal) {
      playbackStepHooks?.onLeaveFinale?.();
    }

    if (visibleCountRef.current === target) return;

    const prev = visibleCountRef.current;
    queueScroll(target, "end", false, prev);
    setVisibleCount(target);
  }, [hasFinale, playbackStepHooks, queueScroll, stopPlayback]);

  const isDirty =
    active &&
    totalFrames > 0 &&
    visibleCount !== pristineVisibleCount;

  return {
    totalFrames,
    visibleCount,
    isPlaying,
    isOnAir: isPlaying,
    playbackEndToken,
    isPausingBeforeReveal,
    atFinaleFrame,
    isDirty,
    canStepBack: !isPausingBeforeReveal && visibleCount > minVisibleFrames,
    canStepForward: !isPausingBeforeReveal && visibleCount < totalFrames,
    canJumpToStart: !isPausingBeforeReveal && visibleCount > minVisibleFrames,
    canPlay:
      isPlaying || (visibleCount < totalFrames && !isPausingBeforeReveal),
    canJumpToEnd: !isPausingBeforeReveal && visibleCount < totalFrames,
    stepBack,
    stepForward,
    play,
    jumpToStart,
    jumpToEnd,
    resetToEnd,
    retreatFromFinale,
    cancelPreRevealPause: clearPreRevealPause,
  };
}
