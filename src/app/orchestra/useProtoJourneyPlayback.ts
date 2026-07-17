import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { protoTabToIndex } from "@/app/proto/protoScreens";
import { runJourneyBeatAction } from "@/app/orchestra/journeyActions";
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
};

function isScreenFramesBeat(beat: JourneyBeat | undefined): boolean {
  return beat?.kind === "screen-frames";
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
}: Options) {
  const beats = journey?.beats ?? [];
  const [isPlaying, setIsPlaying] = useState(false);
  const playTimerRef = useRef<number | null>(null);
  const beatIndexRef = useRef(beatIndex);
  const enteredBeatRef = useRef<string | null>(null);

  beatIndexRef.current = beatIndex;

  const currentBeat = beats[beatIndex];
  const onScreenFramesBeat = isScreenFramesBeat(currentBeat) && screenBeatActive;

  const stopJourneyPlay = useCallback(() => {
    if (playTimerRef.current != null) {
      window.clearTimeout(playTimerRef.current);
      playTimerRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const enterBeat = useCallback(
    (beat: JourneyBeat) => {
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

  useEffect(() => {
    if (!active || !currentBeat) return;
    if (enteredBeatRef.current === currentBeat.id) return;
    enteredBeatRef.current = currentBeat.id;
    enterBeat(currentBeat);
  }, [active, currentBeat, enterBeat]);

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

  const scheduleDwellAdvance = useCallback(() => {
    const beat = beats[beatIndexRef.current];
    const dwellMs = beat?.dwellMs ?? 2800;
    playTimerRef.current = window.setTimeout(() => {
      playTimerRef.current = null;
      const next = beatIndexRef.current + 1;
      if (next >= beats.length) {
        stopJourneyPlay();
        return;
      }
      enteredBeatRef.current = null;
      setBeatIndex(next);
      beatIndexRef.current = next;
      scheduleDwellAdvance();
    }, dwellMs);
  }, [beats.length, setBeatIndex, stopJourneyPlay]);

  const advanceBeat = useCallback(() => {
    const next = beatIndexRef.current + 1;
    if (next >= beats.length) return false;
    enteredBeatRef.current = null;
    setBeatIndex(next);
    beatIndexRef.current = next;
    return true;
  }, [beats.length, setBeatIndex]);

  const retreatBeat = useCallback(() => {
    const prev = beatIndexRef.current - 1;
    if (prev < 0) return false;
    enteredBeatRef.current = null;
    setBeatIndex(prev);
    beatIndexRef.current = prev;
    return true;
  }, [setBeatIndex]);

  const stepForward = useCallback(() => {
    stopJourneyPlay();
    if (onScreenFramesBeat && screenPlayback.canStepForward) {
      screenPlayback.stepForward();
      return;
    }
    if (onScreenFramesBeat && !screenPlayback.canStepForward) {
      advanceBeat();
      return;
    }
    advanceBeat();
  }, [advanceBeat, onScreenFramesBeat, screenPlayback, stopJourneyPlay]);

  const stepBack = useCallback(() => {
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
  }, [onScreenFramesBeat, retreatBeat, screenPlayback, stopJourneyPlay]);

  const play = useCallback(() => {
    if (onScreenFramesBeat) {
      screenPlayback.play();
      return;
    }

    if (isPlaying) {
      stopJourneyPlay();
      return;
    }

    if (beatIndexRef.current >= beats.length - 1) return;

    setIsPlaying(true);
    scheduleDwellAdvance();
  }, [
    beats.length,
    isPlaying,
    onScreenFramesBeat,
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
    if (beats.length === 0) return;
    const last = beats.length - 1;
    enteredBeatRef.current = null;
    setBeatIndex(last);
    beatIndexRef.current = last;
    const lastBeat = beats[last];
    if (isScreenFramesBeat(lastBeat) && screenBeatActive) {
      screenPlayback.jumpToEnd();
    }
  }, [beats, screenBeatActive, screenPlayback, setBeatIndex, stopJourneyPlay]);

  const resetToEnd = useCallback(() => {
    stopJourneyPlay();
    if (onScreenFramesBeat) {
      screenPlayback.resetToEnd();
    }
  }, [onScreenFramesBeat, screenPlayback, stopJourneyPlay]);

  const totalFrames = beats.length;
  const visibleCount = beats.length === 0 ? 0 : beatIndex + 1;

  const canStepBack = onScreenFramesBeat
    ? screenPlayback.canStepBack || beatIndex > 0
    : beatIndex > 0;

  const canStepForward = onScreenFramesBeat
    ? screenPlayback.canStepForward || beatIndex < beats.length - 1
    : beatIndex < beats.length - 1;

  const isDirty =
    active &&
    (beatIndex > 0 || (onScreenFramesBeat && screenPlayback.isDirty));

  return {
    totalFrames,
    visibleCount,
    isPlaying: onScreenFramesBeat ? screenPlayback.isPlaying : isPlaying,
    isPausingBeforeReveal: onScreenFramesBeat
      ? screenPlayback.isPausingBeforeReveal
      : false,
    isDirty,
    canStepBack,
    canStepForward,
    canJumpToStart: canStepBack,
    canPlay: canStepForward,
    canJumpToEnd: canStepForward,
    stepBack,
    stepForward,
    play,
    jumpToStart,
    jumpToEnd,
    resetToEnd,
    retreatFromFinale: screenPlayback.retreatFromFinale,
    resetJourney,
    stopJourneyPlay,
  };
}
