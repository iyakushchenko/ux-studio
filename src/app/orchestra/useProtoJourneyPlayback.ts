import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { protoTabToIndex } from "@/app/proto/protoScreens";
import { runJourneyBeatAction, runJourneyAvailScript, runJourneyBookScript, runJourneyHomeScript, runJourneyTabScript } from "@/app/orchestra/journeyActions";
import {
  abortAvailabilityPlayback,
  wasAvailabilityPlaybackAborted,
} from "@/app/proto/protoAvailabilityPlayback";
import { abortBookPlayback, wasBookPlaybackAborted } from "@/app/proto/protoBookPlayback";
import { abortSitePilotHomePlayback, wasSitePilotHomePlaybackAborted } from "@/app/proto/protoSitePilotHomePlayback";
import {
  abortTraditionalPlayback,
  wasTraditionalPlaybackAborted,
} from "@/app/proto/protoTraditionalPlayback";
import {
  isSkippedTraditionalLoginBeat,
  stepBeatIndex,
} from "@/app/orchestra/brands/bootsSarahJourney";
import type { JourneyBeat, JourneyRuntime, ProtoJourneyDefinition } from "@/app/orchestra/types";

export type ScreenPlaybackApi = {
  totalFrames: number;
  visibleCount: number;
  isPlaying: boolean;
  isPausingBeforeReveal: boolean;
  isDirty: boolean;
  canStepBack: boolean;
  canStepForward: boolean;
  canJumpToStart: boolean;
  canPlay: boolean;
  canJumpToEnd: boolean;
  stepBack: () => void;
  stepForward: () => void;
  play: () => void;
  jumpToStart: () => void;
  jumpToEnd: () => void;
  resetToEnd: () => void;
  retreatFromFinale: () => void;
};

type Options = {
  active: boolean;
  journey: ProtoJourneyDefinition | undefined;
  beatIndex: number;
  setBeatIndex: Dispatch<SetStateAction<number>>;
  currentTabIndex: number;
  runtime: JourneyRuntime;
  screenPlayback: ScreenPlaybackApi;
  screenBeatActive: boolean;
  /** When true, traditional-login beat is omitted from stepping/playback. */
  headerLoggedIn?: boolean;
};

function isScreenFramesBeat(beat: JourneyBeat | undefined): boolean {
  return beat?.kind === "screen-frames";
}

function isOverlayBeat(beat: JourneyBeat | undefined): boolean {
  return beat?.kind === "overlay";
}

function lastPlayableBeatIndex(
  beats: JourneyBeat[],
  headerLoggedIn: boolean
): number {
  for (let i = beats.length - 1; i >= 0; i--) {
    if (!isSkippedTraditionalLoginBeat(beats[i], headerLoggedIn)) return i;
  }
  return -1;
}

export function useProtoJourneyPlayback({
  active,
  journey,
  beatIndex,
  setBeatIndex,
  currentTabIndex,
  runtime,
  screenPlayback,
  screenBeatActive,
  headerLoggedIn = false,
}: Options) {
  const beats = journey?.beats ?? [];

  const advanceFrom = useCallback(
    (index: number) => stepBeatIndex(index, beats, headerLoggedIn, 1),
    [beats, headerLoggedIn]
  );

  const retreatFrom = useCallback(
    (index: number) => stepBeatIndex(index, beats, headerLoggedIn, -1),
    [beats, headerLoggedIn]
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [isScripting, setIsScripting] = useState(false);
  const [playbackEndToken, setPlaybackEndToken] = useState(0);
  const playTimerRef = useRef<number | null>(null);
  const beatIndexRef = useRef(beatIndex);
  const enteredBeatRef = useRef<string | null>(null);
  const screenBeatReadyRef = useRef<string | null>(null);
  const lastAvailAutoRunRef = useRef<string | null>(null);
  const lastBookAutoRunRef = useRef<string | null>(null);
  const lastTabAutoRunRef = useRef<string | null>(null);
  const isPlayingRef = useRef(false);

  beatIndexRef.current = beatIndex;

  const currentBeat = beats[beatIndex];
  const onScreenFramesBeat = isScreenFramesBeat(currentBeat) && screenBeatActive;
  const onOverlayBeat = isOverlayBeat(currentBeat);
  const scheduleDwellAdvanceRef = useRef<() => void>(() => {});
  const homeScriptRunRef = useRef(0);

  const abortActiveScripts = useCallback(() => {
    abortAvailabilityPlayback();
    abortBookPlayback();
    abortSitePilotHomePlayback();
    abortTraditionalPlayback();
    setIsScripting(false);
    lastAvailAutoRunRef.current = null;
    lastBookAutoRunRef.current = null;
    lastTabAutoRunRef.current = null;
  }, []);

  const stopJourneyPlay = useCallback(() => {
    isPlayingRef.current = false;
    if (playTimerRef.current != null) {
      window.clearTimeout(playTimerRef.current);
      playTimerRef.current = null;
    }
    setIsPlaying(false);
    abortActiveScripts();
  }, [abortActiveScripts]);

  const completeJourneyPlay = useCallback(() => {
    if (isPlayingRef.current) {
      setPlaybackEndToken((token) => token + 1);
    }
    stopJourneyPlay();
  }, [stopJourneyPlay]);

  const runHomeScriptBeat = useCallback(
    async (beat: JourneyBeat, options?: { skip?: boolean }) => {
      if (!beat.homeScript) return;
      const runId = ++homeScriptRunRef.current;
      setIsScripting(true);
      await runJourneyHomeScript(beat.homeScript, options);
      if (runId !== homeScriptRunRef.current) return;
      setIsScripting(false);
      if (wasSitePilotHomePlaybackAborted() && !options?.skip) return;
      enteredBeatRef.current = null;
      const next = advanceFrom(beatIndexRef.current);
      if (next >= beats.length) return;
      setBeatIndex(next);
      beatIndexRef.current = next;
    },
    [advanceFrom, beats.length, setBeatIndex]
  );

  const runAvailScriptBeat = useCallback(
    async (beat: JourneyBeat, advanceAfter: boolean, options?: { skip?: boolean }) => {
      if (!beat.availScript) return false;
      setIsScripting(true);
      const ok = await runJourneyAvailScript(beat.availScript, options);
      setIsScripting(false);
      if (!ok) {
        lastAvailAutoRunRef.current = null;
        return false;
      }
      if (wasAvailabilityPlaybackAborted() && !options?.skip) {
        lastAvailAutoRunRef.current = null;
        return false;
      }
      lastAvailAutoRunRef.current = `${beatIndexRef.current}:${beat.id}`;
      if (!advanceAfter) return true;
      enteredBeatRef.current = null;
      const next = advanceFrom(beatIndexRef.current);
      if (next >= beats.length) return true;
      setBeatIndex(next);
      beatIndexRef.current = next;
      return true;
    },
    [advanceFrom, beats.length, setBeatIndex]
  );

  const runBookScriptBeat = useCallback(
    async (beat: JourneyBeat, advanceAfter: boolean, options?: { skip?: boolean }) => {
      if (!beat.bookScript) return false;
      setIsScripting(true);
      const ok = await runJourneyBookScript(beat.bookScript, options);
      setIsScripting(false);
      if (!ok) {
        lastBookAutoRunRef.current = null;
        return false;
      }
      if (wasBookPlaybackAborted() && !options?.skip) {
        lastBookAutoRunRef.current = null;
        return false;
      }
      lastBookAutoRunRef.current = `${beatIndexRef.current}:${beat.id}`;
      if (!advanceAfter) return true;
      enteredBeatRef.current = null;
      const next = advanceFrom(beatIndexRef.current);
      if (next >= beats.length) return true;
      setBeatIndex(next);
      beatIndexRef.current = next;
      return true;
    },
    [advanceFrom, beats.length, setBeatIndex]
  );

  const runTabScriptBeat = useCallback(
    async (beat: JourneyBeat, options?: { skip?: boolean }) => {
      if (!beat.tabScript) return false;
      const runId = `${beatIndexRef.current}:${beat.id}`;
      setIsScripting(true);
      const ok = await runJourneyTabScript(beat.tabScript, runtime, options);
      setIsScripting(false);
      if (!ok) {
        lastTabAutoRunRef.current = runId;
        if (!options?.skip) {
          stopJourneyPlay();
        }
        return false;
      }
      if (wasTraditionalPlaybackAborted() && !options?.skip) {
        lastTabAutoRunRef.current = null;
        return false;
      }
      lastTabAutoRunRef.current = `${beatIndexRef.current}:${beat.id}`;
      enteredBeatRef.current = null;
      const next = advanceFrom(beatIndexRef.current);
      if (next >= beats.length) return true;
      setBeatIndex(next);
      beatIndexRef.current = next;
      return true;
    },
    [advanceFrom, beats.length, runtime, setBeatIndex, stopJourneyPlay]
  );

  const skipActiveScriptingBeat = useCallback(() => {
    const beat = beats[beatIndexRef.current];
    if (!beat) return;

    abortActiveScripts();

    if (beat.homeScript) {
      void runHomeScriptBeat(beat, { skip: true });
      return;
    }
    if (beat.tabScript) {
      void runTabScriptBeat(beat, { skip: true });
      return;
    }
    if (beat.availScript) {
      void runAvailScriptBeat(beat, true, { skip: true });
      return;
    }
    if (beat.bookScript) {
      void runBookScriptBeat(beat, true, { skip: true });
    }
  }, [abortActiveScripts, beats, runAvailScriptBeat, runBookScriptBeat, runHomeScriptBeat, runTabScriptBeat]);

  const runBeatEnter = useCallback(
    async (beat: JourneyBeat) => {
      if (beat.protoTab != null) {
        const tabIndex = protoTabToIndex(beat.protoTab);
        if (currentTabIndex !== tabIndex) {
          runtime.goToTab(tabIndex);
        }
      }
      if (beat.onEnter) {
        runJourneyBeatAction(beat.onEnter, runtime);
      }
    },
    [currentTabIndex, runtime]
  );

  const scheduleDwellAdvance = useCallback(() => {
    const beat = beats[beatIndexRef.current];
    if (isScreenFramesBeat(beat) || beat?.homeScript || beat?.bookScript || beat?.tabScript) {
      return;
    }
    if (beat?.availScript) {
      playTimerRef.current = window.setTimeout(() => {
        playTimerRef.current = null;
        if (!isPlayingRef.current) return;
        const next = advanceFrom(beatIndexRef.current);
        if (next >= beats.length) {
          completeJourneyPlay();
          return;
        }
        enteredBeatRef.current = null;
        lastAvailAutoRunRef.current = null;
        setBeatIndex(next);
        beatIndexRef.current = next;
      }, 1200);
      return;
    }
    const dwellMs = beat?.dwellMs ?? 2800;
    playTimerRef.current = window.setTimeout(() => {
      playTimerRef.current = null;
      if (!isPlayingRef.current) return;
      const next = advanceFrom(beatIndexRef.current);
      if (next >= beats.length) {
        completeJourneyPlay();
        return;
      }
      enteredBeatRef.current = null;
      lastAvailAutoRunRef.current = null;
      setBeatIndex(next);
      beatIndexRef.current = next;
      scheduleDwellAdvance();
    }, dwellMs);
  }, [advanceFrom, beats.length, completeJourneyPlay, setBeatIndex]);

  scheduleDwellAdvanceRef.current = scheduleDwellAdvance;

  useEffect(() => {
    if (!active || !headerLoggedIn) return;
    const beat = beats[beatIndex];
    if (!isSkippedTraditionalLoginBeat(beat, headerLoggedIn)) return;
    const next = advanceFrom(beatIndex);
    if (next === beatIndex || next >= beats.length) return;
    enteredBeatRef.current = null;
    setBeatIndex(next);
    beatIndexRef.current = next;
  }, [active, advanceFrom, beatIndex, beats, headerLoggedIn, setBeatIndex]);

  useEffect(() => {
    if (!active || !currentBeat) return;
    if (enteredBeatRef.current === currentBeat.id) return;
    enteredBeatRef.current = currentBeat.id;
    lastAvailAutoRunRef.current = null;
    lastBookAutoRunRef.current = null;
    lastTabAutoRunRef.current = null;
    void runBeatEnter(currentBeat);
  }, [active, currentBeat, runBeatEnter]);

  useEffect(() => {
    if (!active || !isPlaying || isScripting || !currentBeat?.tabScript) return;

    const runId = `${beatIndex}:${currentBeat.id}`;
    if (lastTabAutoRunRef.current === runId) return;

    void (async () => {
      const ok = await runTabScriptBeat(currentBeat);
      if (!ok) return;
      if (!isPlayingRef.current || wasTraditionalPlaybackAborted()) return;
      scheduleDwellAdvanceRef.current();
    })();
  }, [active, beatIndex, currentBeat, isPlaying, isScripting, runTabScriptBeat]);

  useEffect(() => {
    if (!active || !isPlaying || isScripting || !currentBeat?.availScript) return;

    const runId = `${beatIndex}:${currentBeat.id}`;
    if (lastAvailAutoRunRef.current === runId) return;

    void (async () => {
      const ok = await runAvailScriptBeat(currentBeat, false);
      if (!ok) return;
      if (!isPlayingRef.current || wasAvailabilityPlaybackAborted()) return;
      if (currentBeat.availScript === "book-now") return;
      scheduleDwellAdvanceRef.current();
    })();
  }, [
    active,
    beatIndex,
    currentBeat,
    isPlaying,
    isScripting,
    runAvailScriptBeat,
  ]);

  useEffect(() => {
    if (!active || !isPlaying || isScripting || !currentBeat?.bookScript) return;

    const runId = `${beatIndex}:${currentBeat.id}`;
    if (lastBookAutoRunRef.current === runId) return;

    void (async () => {
      const ok = await runBookScriptBeat(currentBeat, true);
      if (!ok) return;
      if (!isPlayingRef.current || wasBookPlaybackAborted()) return;
      scheduleDwellAdvanceRef.current();
    })();
  }, [
    active,
    beatIndex,
    currentBeat,
    isPlaying,
    isScripting,
    runBookScriptBeat,
  ]);

  useEffect(() => {
    if (!active) {
      screenBeatReadyRef.current = null;
      return;
    }
    if (!onScreenFramesBeat || !currentBeat) {
      screenBeatReadyRef.current = null;
      return;
    }

    const readyKey = `${beatIndex}:${currentBeat.id}`;
    if (screenBeatReadyRef.current === readyKey) return;
    screenBeatReadyRef.current = readyKey;

    screenPlayback.jumpToStart();
    if (isPlayingRef.current) {
      screenPlayback.play();
    }
  }, [
    active,
    beatIndex,
    currentBeat,
    onScreenFramesBeat,
    screenPlayback,
  ]);

  useEffect(() => {
    if (!active) {
      enteredBeatRef.current = null;
      stopJourneyPlay();
    }
  }, [active, stopJourneyPlay]);

  const resetJourney = useCallback(() => {
    stopJourneyPlay();
    enteredBeatRef.current = null;
    setBeatIndex(0);
    beatIndexRef.current = 0;
  }, [setBeatIndex, stopJourneyPlay]);

  /** Resume journey auto-play after chat scenario finale hands off to overlay beats. */
  const resumeJourneyPlay = useCallback(() => {
    isPlayingRef.current = true;
    setIsPlaying(true);
  }, []);

  const advanceBeat = useCallback(() => {
    const next = advanceFrom(beatIndexRef.current);
    if (next >= beats.length) return false;
    enteredBeatRef.current = null;
    lastAvailAutoRunRef.current = null;
    lastBookAutoRunRef.current = null;
    lastTabAutoRunRef.current = null;
    setBeatIndex(next);
    beatIndexRef.current = next;
    return true;
  }, [advanceFrom, beats.length, setBeatIndex]);

  const retreatBeat = useCallback(() => {
    const prev = retreatFrom(beatIndexRef.current);
    if (prev < 0) return false;
    enteredBeatRef.current = null;
    lastAvailAutoRunRef.current = null;
    setBeatIndex(prev);
    beatIndexRef.current = prev;
    return true;
  }, [retreatFrom, setBeatIndex]);

  const stepForward = useCallback(() => {
    if (isScripting) {
      // Keep isPlaying so chat (and other beats) resume after the skip completes.
      abortActiveScripts();
      skipActiveScriptingBeat();
      return;
    }
    stopJourneyPlay();
    if (onScreenFramesBeat && screenPlayback.canStepForward) {
      screenPlayback.stepForward();
      return;
    }
    if (onScreenFramesBeat && !screenPlayback.canStepForward) {
      advanceBeat();
      return;
    }
    if (currentBeat?.homeScript) {
      void runHomeScriptBeat(currentBeat);
      return;
    }
    if (currentBeat?.tabScript) {
      void runTabScriptBeat(currentBeat);
      return;
    }
    if (currentBeat?.availScript) {
      void runAvailScriptBeat(currentBeat, true);
      return;
    }
    if (currentBeat?.bookScript) {
      void runBookScriptBeat(currentBeat, true);
      return;
    }
    advanceBeat();
  }, [
    advanceBeat,
    currentBeat,
    abortActiveScripts,
    isScripting,
    onScreenFramesBeat,
    runAvailScriptBeat,
    runBookScriptBeat,
    runHomeScriptBeat,
    runTabScriptBeat,
    screenPlayback,
    skipActiveScriptingBeat,
    stopJourneyPlay,
  ]);

  const stepBack = useCallback(() => {
    if (isScripting) return;
    stopJourneyPlay();
    if (onScreenFramesBeat && screenPlayback.canStepBack) {
      screenPlayback.stepBack();
      return;
    }
    if (onScreenFramesBeat && !screenPlayback.canStepBack) {
      retreatBeat();
      return;
    }
    retreatBeat();
  }, [onScreenFramesBeat, isScripting, retreatBeat, screenPlayback, stopJourneyPlay]);

  const play = useCallback(() => {
    if (isScripting) {
      stopJourneyPlay();
      return;
    }
    if (onScreenFramesBeat) {
      screenPlayback.play();
      return;
    }

    if (isPlaying) {
      stopJourneyPlay();
      return;
    }

    if (beatIndexRef.current >= lastPlayableBeatIndex(beats, headerLoggedIn)) return;

    const beat = beats[beatIndexRef.current];
    if (beat?.homeScript) {
      isPlayingRef.current = true;
      setIsPlaying(true);
      void runHomeScriptBeat(beat);
      return;
    }

    if (beat?.tabScript) {
      isPlayingRef.current = true;
      setIsPlaying(true);
      lastTabAutoRunRef.current = null;
      return;
    }

    isPlayingRef.current = true;
    setIsPlaying(true);

    if (beat?.availScript) {
      lastAvailAutoRunRef.current = null;
      return;
    }

    if (beat?.bookScript) {
      lastBookAutoRunRef.current = null;
      return;
    }

    scheduleDwellAdvance();
  }, [
    beats,
    headerLoggedIn,
    isPlaying,
    isScripting,
    onScreenFramesBeat,
    runHomeScriptBeat,
    scheduleDwellAdvance,
    screenPlayback,
    stopJourneyPlay,
  ]);

  const jumpToStart = useCallback(() => {
    stopJourneyPlay();
    if (onScreenFramesBeat) {
      screenPlayback.jumpToStart();
    }
    resetJourney();
  }, [onScreenFramesBeat, resetJourney, screenPlayback, stopJourneyPlay]);

  const jumpToEnd = useCallback(() => {
    stopJourneyPlay();
    const last = lastPlayableBeatIndex(beats, headerLoggedIn);
    if (last < 0) return;
    enteredBeatRef.current = null;
    setBeatIndex(last);
    beatIndexRef.current = last;
    const lastBeat = beats[last];
    if (isScreenFramesBeat(lastBeat) && screenBeatActive) {
      screenPlayback.jumpToEnd();
    }
  }, [beats, headerLoggedIn, screenBeatActive, screenPlayback, setBeatIndex, stopJourneyPlay]);

  const resetToEnd = useCallback(() => {
    stopJourneyPlay();
    if (onScreenFramesBeat) {
      screenPlayback.resetToEnd();
    }
  }, [onScreenFramesBeat, screenPlayback, stopJourneyPlay]);

  const totalFrames = beats.length;
  const visibleCount = beats.length === 0 ? 0 : beatIndex + 1;
  const transportPlaying = onScreenFramesBeat
    ? screenPlayback.isPlaying
    : isPlaying || isScripting;
  const isOnAir = onScreenFramesBeat ? screenPlayback.isPlaying : isPlaying;

  const canAdvanceBeat =
    beatIndex < beats.length - 1 && advanceFrom(beatIndex) < beats.length;

  const animationBusy =
    isScripting ||
    (onScreenFramesBeat && screenPlayback.isPausingBeforeReveal);

  const canStepBack = animationBusy
    ? false
    : onScreenFramesBeat
      ? screenPlayback.canStepBack || beatIndex > 0
      : retreatFrom(beatIndex) >= 0;

  const canStepForward = animationBusy
    ? false
    : onScreenFramesBeat
      ? screenPlayback.canStepForward || canAdvanceBeat
      : canAdvanceBeat;

  const canPlay =
    transportPlaying ||
    animationBusy ||
    (onScreenFramesBeat
      ? screenPlayback.canStepForward || canAdvanceBeat
      : canAdvanceBeat) ||
    onOverlayBeat ||
    Boolean(currentBeat?.bookScript) ||
    Boolean(currentBeat?.tabScript);

  const canJumpToStart = animationBusy ? false : canStepBack;
  const canJumpToEnd = animationBusy ? false : canStepForward;

  const isDirty =
    active &&
    (beatIndex > 0 || (onScreenFramesBeat && screenPlayback.isDirty));

  return {
    totalFrames,
    visibleCount,
    isPlaying: transportPlaying,
    isOnAir,
    playbackEndToken,
    isPausingBeforeReveal: animationBusy,
    isDirty,
    canStepBack,
    canStepForward,
    canJumpToStart,
    canPlay,
    canJumpToEnd,
    stepBack,
    stepForward,
    play,
    jumpToStart,
    jumpToEnd,
    resetToEnd,
    retreatFromFinale: screenPlayback.retreatFromFinale,
    resetJourney,
    stopJourneyPlay,
    resumeJourneyPlay,
  };
}
