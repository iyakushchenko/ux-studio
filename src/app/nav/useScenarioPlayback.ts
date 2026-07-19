import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import {
  applyScenarioFrameVisibility,
  bumpScenarioScrollGeneration,
  SCENARIO_MIN_VISIBLE_FRAMES,
  scheduleScenarioScroll,
  scenarioScrollTiming,
  scenarioScrollTopBeforeCollapse,
  scrollPrototypeScrollToTop,
  type ScenarioScrollAlign,
  type ScenarioScrollTiming,
} from "@/app/scenario/scenarioEngine";
import {
  PlaybackDiagnosticError,
  PLAYBACK_SCENARIO_PRELUDE_TIMEOUT_MS,
  scenarioStallDiagnostic,
} from "@/app/shell/playbackDiagnostic";
import { playbackScrollMonitor } from "@/app/shell/playbackScrollMonitor";

type Options = {
  active: boolean;
  collectFrames: () => HTMLElement[];
  screenSelector?: string;
  scrollRootRef?: RefObject<HTMLElement | null>;
  minVisibleFrames?: number;
  playbackStepMs?: number;
  playbackStepHooks?: PlaybackStepHooks;
  onDiagnostic?: (error: PlaybackDiagnosticError) => void;
  /** CJM off — reveal the full scenario thread (all content frames). */
  browseMode?: boolean;
  /** When true on init, land at end state (CJM step-back to screen-frames beat). */
  restoreFullOnInitRef?: RefObject<boolean>;
};

export type PlaybackStepHooks = {
  /** Async prelude before a frame is revealed (thinking, typing, CTA clicks). */
  beforeReveal?: (ctx: BeforeRevealContext) => Promise<void>;
  /** When false, snap scroll on reveal (e.g. agent replies above fixed composer). */
  revealScrollSmooth?: (frame: HTMLElement) => boolean;
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
    const id = frame.dataset.studioScenarioHideTid;
    if (id) window.clearTimeout(Number(id));
    frame.style.display = "";
    delete frame.dataset.studioScenarioVisible;
    delete frame.dataset.studioScenarioFrame;
    delete frame.dataset.studioScenarioHideTid;
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

/** First frame shown when a scenario activates — always min visible, even with a finale beat. */
export function resolveInitialScenarioVisibleCount(
  contentFrameCount: number,
  hasFinale: boolean,
  minVisibleFrames: number
): number {
  if (contentFrameCount === 0) return 0;
  const scenarioTotal = scenarioTotalFor(contentFrameCount, hasFinale);
  return clampVisible(minVisibleFrames, scenarioTotal, minVisibleFrames);
}

/** Browse mode (CJM off) — show the full content thread, not stepped frames. */
export function resolveBrowseScenarioVisibleCount(
  contentFrameCount: number
): number {
  return contentFrameCount;
}

/** End-state visible count — matches resetToEnd / jumpToEnd content landing. */
export function resolveScenarioEndVisibleCount(
  contentFrameCount: number,
  hasFinale: boolean
): number {
  const scenarioTotal = scenarioTotalFor(contentFrameCount, hasFinale);
  return hasFinale && contentFrameCount > 0 ? contentFrameCount : scenarioTotal;
}

export { scenarioTotalFor };

function bubbleVisibleCount(visibleCount: number, contentFrameCount: number): number {
  if (contentFrameCount === 0) return 0;
  return Math.min(visibleCount, contentFrameCount);
}

function scrollAlignForCount(count: number, minVisible: number): ScenarioScrollAlign {
  return count <= minVisible ? "start" : "end";
}

export function useScenarioPlayback({
  active,
  collectFrames,
  screenSelector,
  scrollRootRef,
  minVisibleFrames = SCENARIO_MIN_VISIBLE_FRAMES,
  playbackStepMs = 2000,
  playbackStepHooks,
  onDiagnostic,
  browseMode = false,
  restoreFullOnInitRef,
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

  const onDiagnosticRef = useRef(onDiagnostic);
  onDiagnosticRef.current = onDiagnostic;

  const hasFinale = Boolean(playbackStepHooks?.onFinale);
  const contentFrameCount = hasFinale
    ? Math.max(0, totalFrames - 1)
    : totalFrames;
  const atFinaleFrame =
    hasFinale && totalFrames > 0 && visibleCount >= totalFrames;
  /** Default landing — browse collapsed vs disclosed; CJM stepped chat starts at min frames. */
  const pristineVisibleCount = browseMode
    ? visibleCount <= minVisibleFrames
      ? minVisibleFrames
      : contentFrameCount
    : hasFinale && contentFrameCount > 0
      ? minVisibleFrames
      : totalFrames;

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

  const reportScenarioStall = useCallback(
    (detail?: string) => {
      stopPlayback();
      onDiagnosticRef.current?.(
        scenarioStallDiagnostic({
          frame: visibleCountRef.current,
          detail,
        })
      );
    },
    [stopPlayback]
  );

  const completePlayback = useCallback(() => {
    if (isPlayingRef.current) {
      setPlaybackEndToken((token) => token + 1);
    }
    stopPlayback();
  }, [stopPlayback]);

  const syncFrames = useCallback(() => {
    const frames = collectFrames();
    framesRef.current = frames;
    frames.forEach((frame, index) => {
      frame.dataset.studioScenarioFrame = String(index + 1);
    });
    setTotalFrames(scenarioTotalFor(frames.length, hasFinale));

    if (!initializedRef.current && frames.length > 0) {
      initializedRef.current = true;
      const contentTotal = frames.length;
      const scenarioTotal = scenarioTotalFor(contentTotal, hasFinale);
      const restoreFull = restoreFullOnInitRef?.current === true;
      const initialCount = browseMode
        ? minVisibleFrames
        : restoreFull
          ? resolveScenarioEndVisibleCount(contentTotal, hasFinale)
          : resolveInitialScenarioVisibleCount(
              contentTotal,
              hasFinale,
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
      const restoreFull = restoreFullOnInitRef?.current === true;
      if (restoreFull) {
        const endCount = resolveScenarioEndVisibleCount(frames.length, hasFinale);
        const prev = visibleCountRef.current;
        visibleCountRef.current = endCount;
        scrollIntentRef.current = {
          visibleCount: endCount,
          prevCount: prev,
          align: scrollAlignForCount(endCount, minVisibleFrames),
          smooth: false,
          timing: "after-init",
        };
        setVisibleCount(endCount);
      } else {
        setVisibleCount((prev) => {
          // RAF re-sync can run before the init setState lands — keep progressive entry.
          if (prev === 0) {
            if (browseMode) {
              return minVisibleFrames;
            }
            return clampVisible(minVisibleFrames, scenarioTotal, minVisibleFrames);
          }
          if (browseMode && prev < frames.length && prev > minVisibleFrames) {
            return frames.length;
          }
          return clampVisible(prev, scenarioTotal, minVisibleFrames);
        });
      }
    }

    return frames;
  }, [browseMode, collectFrames, hasFinale, minVisibleFrames, restoreFullOnInitRef]);

  const refreshFrameList = useCallback(() => {
    const frames = collectFrames();
    if (frames.length === 0) return frames;
    framesRef.current = frames;
    frames.forEach((frame, index) => {
      frame.dataset.studioScenarioFrame = String(index + 1);
    });
    setTotalFrames(scenarioTotalFor(frames.length, hasFinale));
    const restoreFull = restoreFullOnInitRef?.current === true;
    const count = restoreFull
      ? resolveScenarioEndVisibleCount(frames.length, hasFinale)
      : visibleCountRef.current > 0
        ? visibleCountRef.current
        : browseMode
          ? minVisibleFrames
          : clampVisible(
              minVisibleFrames,
              scenarioTotalFor(frames.length, hasFinale),
              minVisibleFrames
            );
    if (restoreFull) {
      visibleCountRef.current = count;
      setVisibleCount(count);
      scrollIntentRef.current = {
        visibleCount: count,
        prevCount: 0,
        align: scrollAlignForCount(count, minVisibleFrames),
        smooth: false,
        timing: "after-init",
      };
    }
    applyScenarioFrameVisibility(frames, bubbleVisibleCount(count, frames.length));
    return frames;
  }, [browseMode, collectFrames, hasFinale, minVisibleFrames, restoreFullOnInitRef]);

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

    if (restoreFullOnInitRef?.current && framesRef.current.length > 0) {
      const contentTotal = framesRef.current.length;
      const target = resolveScenarioEndVisibleCount(contentTotal, hasFinale);
      visibleCountRef.current = target;
      scrollIntentRef.current = {
        visibleCount: target,
        prevCount: 0,
        align: scrollAlignForCount(target, minVisibleFrames),
        smooth: false,
        timing: "after-init",
      };
      setVisibleCount(target);
    } else if (restoreFullOnInitRef?.current) {
      refreshFrameList();
    }

    const raf = requestAnimationFrame(() => refreshFrameList());
    return () => cancelAnimationFrame(raf);
  }, [active, hasFinale, minVisibleFrames, refreshFrameList, restoreFullOnInitRef, syncFrames, stopPlayback]);

  useLayoutEffect(() => {
    if (!active) return;

    const frames = framesRef.current;
    if (frames.length === 0) return;

    const pendingInit = scrollIntentRef.current?.visibleCount ?? 0;
    let effectiveCount =
      visibleCount > 0 ? visibleCount : pendingInit > 0 ? pendingInit : 0;
    if (
      scrollIntentRef.current?.timing === "after-init" &&
      pendingInit > effectiveCount
    ) {
      effectiveCount = pendingInit;
    }

    if (effectiveCount === 0) {
      applyScenarioFrameVisibility(frames, 0);
      return;
    }

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

  useEffect(() => {
    if (!isPausingBeforeReveal || !isPlayingRef.current) return;
    const timer = window.setTimeout(() => {
      if (!isPausingBeforeReveal || !isPlayingRef.current) return;
      reportScenarioStall("Scenario prelude (thinking/typing/finale) exceeded time limit");
    }, PLAYBACK_SCENARIO_PRELUDE_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [isPausingBeforeReveal, reportScenarioStall]);

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
            if (visibleCountRef.current < contentTotal) return;
            finishFinale();
          } catch (error) {
            pauseCleanupRef.current = null;
            setIsPausingBeforeReveal(false);
            stopPlayback();
            if (error instanceof PlaybackDiagnosticError) {
              onDiagnosticRef.current?.(error);
            } else {
              reportScenarioStall(
                error instanceof Error ? error.message : "Finale hook threw"
              );
            }
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
        const revealSmooth =
          isPlayingRef.current &&
          (playbackStepHooks?.revealScrollSmooth?.(frame) ?? true);
        queueScroll(next, "end", revealSmooth, fromCount);
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
    const prevCount = visibleCountRef.current;

    if (hasFinale && visibleCountRef.current >= scenarioTotal) {
      playbackStepHooks?.onLeaveFinale?.();
      retreatFromFinale();
      return;
    }

    setVisibleCount((count) => {
      const next = clampVisible(count - 1, scenarioTotal, minVisibleFrames);
      const align = scrollAlignForCount(next, minVisibleFrames);
      if (next < prevCount) {
        playbackScrollMonitor.noteRetreatSync();
      }
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

    const targetCount = browseMode
      ? clampVisible(
          resolveBrowseScenarioVisibleCount(contentTotal),
          scenarioTotal,
          minVisibleFrames
        )
      : minVisibleFrames;

    if (frames.length === 0) {
      if (visibleCountRef.current !== 0) {
        setVisibleCount(0);
      }
      return;
    }

    if (frames.length > 0 && visibleCountRef.current > targetCount) {
      const prev = visibleCountRef.current;
      queueScroll(targetCount, browseMode ? "end" : "start", false, prev);
      setVisibleCount(targetCount);
      return;
    }
    scheduleScenarioScroll(
      frames,
      targetCount,
      browseMode ? "end" : "start",
      scrollRootRef?.current,
      false,
      "immediate",
      visibleCountRef.current
    );
  }, [
    browseMode,
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

  const resetToEnd = useCallback(
    (options?: { smooth?: boolean; force?: boolean }) => {
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

      const smooth = options?.smooth ?? false;
      const force = options?.force ?? false;
      const prev = visibleCountRef.current;

      if (!force && prev === target) return;

      if (force && prev === target) {
        applyScenarioFrameVisibility(
          frames,
          bubbleVisibleCount(target, contentTotal)
        );
        scrollIntentRef.current = {
          visibleCount: target,
          prevCount: minVisibleFrames,
          align: "end",
          smooth,
          timing: "after-init",
        };
        setVisibleCount(target);
        return;
      }

      queueScroll(target, "end", smooth, prev);
      setVisibleCount(target);
    },
    [hasFinale, minVisibleFrames, playbackStepHooks, queueScroll, stopPlayback]
  );

  const prevBrowseModeRef = useRef(browseMode);
  useEffect(() => {
    if (!active) {
      prevBrowseModeRef.current = browseMode;
      return;
    }
    const wasBrowse = prevBrowseModeRef.current;
    prevBrowseModeRef.current = browseMode;

    if (browseMode) {
      return;
    }
    if (wasBrowse) {
      jumpToStart();
    }
  }, [active, browseMode, jumpToStart]);

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
    abortPlayback: stopPlayback,
  };
}
