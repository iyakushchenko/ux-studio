import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { wasAvailabilityPlaybackAborted } from "@/projects/boots-pharmacy/playback/availability";
import { wasBookPlaybackAborted } from "@/projects/boots-pharmacy/playback/book";
import { wasSitePilotHomePlaybackAborted } from "@/projects/boots-pharmacy/playback/sitePilotHome";
import { wasTraditionalPlaybackAborted } from "@/projects/boots-pharmacy/playback/traditional";
import {
  describeBeatScript,
  PlaybackDiagnosticError,
  playbackTransportNoOpDiagnostic,
  scriptFailureDiagnostic,
  TRANSPORT_STEP_NO_OP_MS,
  withPlaybackScriptTimeout,
} from "@/app/shell/playbackDiagnostic";
import {
  isScriptOk,
  isPlaybackAbortFailure,
  scriptFailureStep,
  type PlaybackScriptResult,
} from "@/projects/playbackScriptResult";
import { playbackDirectorMonitor } from "@/app/shell/playbackDirectorMonitor";
import { notePlaybackBeatEnter, notePlaybackDirectorScript } from "@/app/shell/playbackInteractionContext";
import {
  beatDirectorScriptLabel,
  beatHasCameraStep,
  isDwellLandingBeat,
  prepareBeatIndexAdvance,
  shouldAdvanceAfterChainedManualDirectorBeat,
  shouldChainManualDirectorStepOnAdvance,
} from "@/app/orchestra/journeyBeatDirector";
import { clearCameraBeatUndo, playCameraBeat } from "@/app/orchestra/cameraBeatPlayback";
import { shouldCompleteJourneyPlayAfterScript } from "@/app/orchestra/journeyPlayAdvance";
import {
  shouldAdvanceCompletedDirectorStep,
  shouldSuppressTransportNoOpForBeat,
} from "@/app/orchestra/manualDirectorStep";
import { syncBeatRetreatState } from "@/app/orchestra/journeyRetreatSync";
import {
  navigateToBeatTab,
  shouldNavigateBeatTabOnEnter,
} from "@/app/orchestra/beatTabNavigation";
import {
  canRetreatJourneyTouchpoint,
  lastPlayableBeatIndex as findLastPlayableBeatIndex,
  resolveJourneyRetreatTarget,
  stepBeatIndex,
} from "@/app/orchestra/journeyUtils";
import { resolveStudioTouchpointProgress } from "@/app/nav/resolveStudioTouchpoint";
import { isPlaybackScrollAnimating, scrollCameraToOrigin } from "@/app/scenario/playbackScroll";
import { playbackScrollMonitor } from "@/app/shell/playbackScrollMonitor";
import {
  isBookStep2DwellBeatId,
  notePlaybackCursorEvent,
  resetPlaybackCursorDiagnosticContext,
  resolveBookStep2CursorPhase,
  setPlaybackCursorDiagnosticContext,
} from "@/app/shell/playbackCursorDiagnostic";
import {
  cancelDemoCursorJourneyEndFade,
  parkDemoCursorAtRest,
} from "@/app/scenario/demoCursor";
import { playRecordedClick } from "@/app/orchestra/recordedClickPlayback";
import {
  playbackDiagBeat,
  playbackDiagJourneyReset,
  playbackDiagPlayEnd,
} from "@/app/shell/playbackDiag";
import type { JourneyBeat, JourneyRuntime, JourneyDefinition } from "@/app/orchestra/types";
import type { ProjectPlayback } from "@/projects/types";
import { playbackMs } from "@/app/shell/playbackTiming";
import type { StudioTouchpointEntry } from "@/projects/types";
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
  resetToEnd: (options?: { smooth?: boolean; force?: boolean }) => void;
  retreatFromFinale: () => void;
};
type Options = {
  active: boolean;
  journey: JourneyDefinition | undefined;
  beatIndex: number;
  setBeatIndex: Dispatch<SetStateAction<number>>;
  currentTabIndex: number;
  runtime: JourneyRuntime;
  screenPlayback: ScreenPlaybackApi;
  screenBeatActive: boolean;
  /** Persona hook — omit beat from stepping/playback (e.g. skip login when logged in). */
  shouldSkipBeat?: (beat: JourneyBeat | undefined) => boolean;
  playback: ProjectPlayback;
  studioTabToIndex: (tab: number) => number;
  studioPlaylist?: readonly StudioTouchpointEntry[];
  currentTouchpointKey?: string;
  onDiagnostic?: (error: PlaybackDiagnosticError) => void;
  /** CJM off — screen-frames beats show full scenario content, not frame 1. */
  scenarioBrowseMode?: boolean;
  /** Called after CJM step-back lands on a screen-frames beat (before scenario re-init). */
  onScreenFramesRetreatEnd?: () => void;
  /** Zero-based tab index → address-bar `screenId` (journey-reset diag destination). */
  screenIdForTabIndex?: (tabIndex: number) => string | undefined;
};

function isScreenFramesBeat(beat: JourneyBeat | undefined): boolean {
  return beat?.kind === "screen-frames";
}

function isOverlayBeat(beat: JourneyBeat | undefined): boolean {
  return beat?.kind === "overlay";
}

function isAbortOnlyFailure(step?: string): boolean {
  return isPlaybackAbortFailure(step);
}

function isAnyPlaybackScriptAborted(): boolean {
  return (
    wasBookPlaybackAborted() ||
    wasAvailabilityPlaybackAborted() ||
    wasTraditionalPlaybackAborted() ||
    wasSitePilotHomePlaybackAborted()
  );
}

export function useJourneyPlayback({
  active,
  journey,
  beatIndex,
  setBeatIndex: setBeatIndexState,
  currentTabIndex,
  runtime,
  screenPlayback,
  screenBeatActive,
  shouldSkipBeat = () => false,
  playback,
  studioTabToIndex,
  studioPlaylist = [],
  currentTouchpointKey,
  onDiagnostic,
  scenarioBrowseMode = false,
  onScreenFramesRetreatEnd,
  screenIdForTabIndex,
}: Options) {
  const beats = journey?.beats ?? [];
  const onDiagnosticRef = useRef(onDiagnostic);
  onDiagnosticRef.current = onDiagnostic;
  const screenIdForTabIndexRef = useRef(screenIdForTabIndex);
  screenIdForTabIndexRef.current = screenIdForTabIndex;

  const resolveStartScreenId = useCallback(
    (beat: JourneyBeat | undefined): string | undefined => {
      if (beat?.protoTab == null) return undefined;
      const tabIndex = studioTabToIndex(beat.protoTab);
      return screenIdForTabIndexRef.current?.(tabIndex);
    },
    [studioTabToIndex]
  );

  const advanceFrom = useCallback(
    (index: number) => stepBeatIndex(index, beats, shouldSkipBeat, 1),
    [beats, shouldSkipBeat]
  );

  const retreatFrom = useCallback(
    (index: number) => stepBeatIndex(index, beats, shouldSkipBeat, -1),
    [beats, shouldSkipBeat]
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [isScripting, setIsScripting] = useState(false);
  const isScriptingRef = useRef(false);
  // True from the instant a beat-index advance is committed until that beat's
  // runBeatEnter (navigate tab + book-step2 landing prep + onEnter) finishes.
  // A ref (not state) so it is readable mid-render with zero commit lag —
  // isScripting alone can flip false in the SAME batch as the beatIndex
  // advance (director-script beats end their try/finally right after
  // setBeatIndex), exposing a real render where beatId already reads the new
  // landing beat but the tab hasn't navigated yet → false beat-tab-mismatch.
  const beatEnterPendingRef = useRef(false);
  // Wrap the incoming setter so every internal beatIndex advance latches the
  // pending flag synchronously, in the same statement group as the state
  // update — no call site elsewhere in this hook needs to remember to do it.
  const setBeatIndex = useCallback(
    (next: number) => {
      beatEnterPendingRef.current = true;
      setBeatIndexState(next);
    },
    [setBeatIndexState]
  );
  const [playbackScrollBusy, setPlaybackScrollBusy] = useState(false);
  const scrollPollRafRef = useRef<number | null>(null);

  const stopScrollPoll = useCallback(() => {
    if (scrollPollRafRef.current != null) {
      cancelAnimationFrame(scrollPollRafRef.current);
      scrollPollRafRef.current = null;
    }
  }, []);

  const pollPlaybackScrollUntilIdle = useCallback(() => {
    stopScrollPoll();
    if (!isPlaybackScrollAnimating()) {
      setPlaybackScrollBusy(false);
      return;
    }
    setPlaybackScrollBusy(true);
    const tick = () => {
      const animating = isPlaybackScrollAnimating();
      setPlaybackScrollBusy(animating);
      if (animating) {
        scrollPollRafRef.current = requestAnimationFrame(tick);
      } else {
        scrollPollRafRef.current = null;
      }
    };
    scrollPollRafRef.current = requestAnimationFrame(tick);
  }, [stopScrollPoll]);

  const setScriptingActive = useCallback(
    (active: boolean) => {
      isScriptingRef.current = active;
      setIsScripting(active);
      setPlaybackCursorDiagnosticContext({ isScripting: active });
      if (active) {
        stopScrollPoll();
        setPlaybackScrollBusy(false);
        return;
      }
      pollPlaybackScrollUntilIdle();
    },
    [pollPlaybackScrollUntilIdle, stopScrollPoll]
  );

  const isScriptingNow = () => isScriptingRef.current || isScripting;
  const [playbackEndToken, setPlaybackEndToken] = useState(0);
  const [transportStepToken, setTransportStepToken] = useState(0);
  const transportStepAttemptRef = useRef<{
    beatIndex: number;
    beatId?: string;
    scenarioVisibleCount?: number;
  } | null>(null);
  const playTimerRef = useRef<number | null>(null);
  const beatIndexRef = useRef(beatIndex);
  const enteredBeatRef = useRef<string | null>(null);
  const screenBeatReadyRef = useRef<string | null>(null);
  const lastAvailAutoRunRef = useRef<string | null>(null);
  const lastBookAutoRunRef = useRef<string | null>(null);
  const lastTabAutoRunRef = useRef<string | null>(null);
  const lastHomeAutoRunRef = useRef<string | null>(null);
  const lastRecordedClickAutoRunRef = useRef<string | null>(null);
  const lastCameraAutoRunRef = useRef<string | null>(null);
  const isPlayingRef = useRef(false);
  /** Skip beat-enter tab nav on first mount so sessionStorage tab is preserved. */
  const suppressInitialBeatTabNavRef = useRef(true);
  /** Dwell handoff runs the next director step — skip beat-enter sync for that beat. */
  const suppressBeatEnterSyncRef = useRef(false);
  /** CJM step-back — snap DOM/scroll on beat enter, director script runs on step forward. */
  const retreatSyncRef = useRef(false);
  const [retreatSyncing, setRetreatSyncing] = useState(false);
  /** SF clicked during retreat-sync — re-drive after sync lands (no Alarm no-op). */
  const pendingStepForwardAfterRetreatRef = useRef(false);
  const stepForwardRef = useRef<() => void>(() => {});
  const beginRetreatSync = useCallback(() => {
    retreatSyncRef.current = true;
    setRetreatSyncing(true);
  }, []);
  const endRetreatSync = useCallback(() => {
    retreatSyncRef.current = false;
    setRetreatSyncing(false);
    if (pendingStepForwardAfterRetreatRef.current) {
      pendingStepForwardAfterRetreatRef.current = false;
      queueMicrotask(() => stepForwardRef.current());
    }
  }, []);
  const onScreenFramesRetreatEndRef = useRef(onScreenFramesRetreatEnd);
  onScreenFramesRetreatEndRef.current = onScreenFramesRetreatEnd;
  const currentTabIndexRef = useRef(currentTabIndex);

  beatIndexRef.current = beatIndex;
  currentTabIndexRef.current = currentTabIndex;

  const currentBeat = beats[beatIndex];
  const onScreenFramesBeat = isScreenFramesBeat(currentBeat) && screenBeatActive;
  const onOverlayBeat = isOverlayBeat(currentBeat);
  const playlistProgress = resolveStudioTouchpointProgress(
    studioPlaylist,
    currentTouchpointKey
  );
  const atPlaylistEnd =
    studioPlaylist.length > 0 &&
    playlistProgress.visibleCount >= playlistProgress.totalFrames;
  const atPlaylistEndRef = useRef(atPlaylistEnd);
  atPlaylistEndRef.current = atPlaylistEnd;
  const scheduleDwellAdvanceRef = useRef<() => void>(() => {});
  const homeScriptRunRef = useRef(0);
  /** After manual home step, chain the first chat scenario frame once chat mounts. */
  const pendingManualScreenHandoffRef = useRef<string | null>(null);

  const abortActiveScripts = useCallback(() => {
    playback.abortAll();
    // Mid-chain abort (login→book-location-pick) must not leave Availability open.
    runtime.closeAllPopups();
    runtime.closeAvailability();
    stopScrollPoll();
    setPlaybackScrollBusy(false);
    setScriptingActive(false);
    beatEnterPendingRef.current = false;
    notePlaybackCursorEvent("abort", { abortReason: "playback-abort-all" });
    resetPlaybackCursorDiagnosticContext();
    lastAvailAutoRunRef.current = null;
    lastBookAutoRunRef.current = null;
    lastTabAutoRunRef.current = null;
    lastHomeAutoRunRef.current = null;
    lastRecordedClickAutoRunRef.current = null;
    lastCameraAutoRunRef.current = null;
  }, [playback, runtime, setScriptingActive, stopScrollPoll]);

  const stopJourneyPlay = useCallback(() => {
    isPlayingRef.current = false;
    if (playTimerRef.current != null) {
      window.clearTimeout(playTimerRef.current);
      playTimerRef.current = null;
    }
    setIsPlaying(false);
    abortActiveScripts();
  }, [abortActiveScripts]);

  /** Stop cassette auto-play timers without aborting the next manual director script. */
  const stopAutoPlayOnly = useCallback(() => {
    isPlayingRef.current = false;
    if (playTimerRef.current != null) {
      window.clearTimeout(playTimerRef.current);
      playTimerRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  /** Manual Jump-to-start — set by jumpToStart (avoids TDZ). Not called on Play end. */
  const jumpToStartRef = useRef<() => void>(() => {});

  const completeJourneyPlay = useCallback(() => {
    const endBeat = beats[beatIndexRef.current];
    setPlaybackEndToken((token) => token + 1);
    stopJourneyPlay();
    // Product (PO 2026-07-22): continuous Play completion stays on the finale /
    // last beat — no auto-rewind. Jump-to-start remains for manual rewind.
    const endScreenId = resolveStartScreenId(endBeat);
    void parkDemoCursorAtRest({ reason: "play-end" });
    playbackDiagPlayEnd({
      fromBeatId: endBeat?.id,
      toBeatId: endBeat?.id,
      endScreenId,
      detail: "play-end → stay at journey end",
    });
  }, [beats, resolveStartScreenId, stopJourneyPlay]);

  const reportScriptFailure = useCallback(
    (
      beat: JourneyBeat,
      options?: { failureStep?: string; reason?: string; detail?: string }
    ) => {
      if (isAbortOnlyFailure(options?.failureStep)) return;
      if (isAnyPlaybackScriptAborted()) return;
      transportStepAttemptRef.current = null;
      stopJourneyPlay();
      onDiagnosticRef.current?.(
        scriptFailureDiagnostic(beat, {
          journeyId: journey?.id,
          failureStep: options?.failureStep,
          reason: options?.reason,
          detail: options?.detail,
        })
      );
    },
    [journey?.id, stopJourneyPlay]
  );

  const noteDirectorScriptInteraction = useCallback(
    (
      beat: JourneyBeat,
      options?: { skip?: boolean; manualStep?: boolean; syncState?: boolean }
    ) => {
      if (options?.syncState && beat.bookScript) {
        notePlaybackBeatEnter(`sync-${beat.bookScript}`, beat.id);
        return;
      }
      if (options?.skip) return;
      const script = describeBeatScript(beat);
      if (!script || script.kind === "beat-enter") return;
      notePlaybackDirectorScript({
        scriptId: script.id,
        scriptKind: script.kind,
        beatId: beat.id,
        beatLabel: beat.label,
        manual: options?.manualStep,
      });
    },
    []
  );

  const runScriptWithGuard = useCallback(
    (label: string, run: () => Promise<PlaybackScriptResult>) =>
      withPlaybackScriptTimeout(label, run),
    []
  );

  const invokeBeatScript = useCallback(
    async (
      label: string,
      run: () => Promise<PlaybackScriptResult>,
      options?: { skip?: boolean }
    ): Promise<{ ok: boolean; failureStep?: string; diagnosticSent: boolean }> => {
      try {
        const result = await runScriptWithGuard(label, run);
        return {
          ok: isScriptOk(result),
          failureStep: scriptFailureStep(result),
          diagnosticSent: false,
        };
      } catch (error) {
        if (!options?.skip && error instanceof PlaybackDiagnosticError) {
          stopJourneyPlay();
          onDiagnosticRef.current?.(error);
          return { ok: false, diagnosticSent: true };
        }
        throw error;
      }
    },
    [runScriptWithGuard, stopJourneyPlay]
  );

  const runChainedManualDirectorBeat = useCallback(
    async (fromBeat: JourneyBeat, nextBeat: JourneyBeat): Promise<boolean> => {
      setScriptingActive(true);
      suppressBeatEnterSyncRef.current = true;
      try {
        if (nextBeat.protoTab != null) {
          // Always goToTab — matching index must still close hub.
          navigateToBeatTab(runtime, studioTabToIndex(nextBeat.protoTab));
        }
        playbackDirectorMonitor.noteDirectorScriptStarted(nextBeat.id);
        notePlaybackDirectorScript({
          scriptId: nextBeat.bookScript ?? nextBeat.tabScript ?? "unknown",
          scriptKind: nextBeat.bookScript ? "book" : "tab",
          beatId: nextBeat.id,
          beatLabel: nextBeat.label,
          manual: true,
        });
        const chained = nextBeat.bookScript
          ? await invokeBeatScript(
              nextBeat.bookScript,
              () => playback.runBookScript(nextBeat.bookScript!),
              { manualStep: true }
            )
          : nextBeat.tabScript
            ? await invokeBeatScript(
                nextBeat.tabScript,
                () =>
                  playback.runTabScript(nextBeat.tabScript!, runtime),
                { manualStep: true }
              )
            : {
                ok: false,
                failureStep: "missing director script",
                diagnosticSent: false,
              };
        playbackDirectorMonitor.noteDirectorScriptFinished(nextBeat.id, chained.ok);
        if (!chained.ok) {
          lastBookAutoRunRef.current = null;
          lastTabAutoRunRef.current = null;
          if (!chained.diagnosticSent) {
            reportScriptFailure(nextBeat, {
              failureStep: chained.failureStep,
            });
          }
          return false;
        }
        const followingIndex = Math.min(beats.findIndex((candidate) => candidate === nextBeat || candidate.id === nextBeat.id) + 1, beats.length - 1);
        const expectedNavigationHandoff = shouldAdvanceAfterChainedManualDirectorBeat(nextBeat, beats[followingIndex]);
        if (
          (wasBookPlaybackAborted() || wasTraditionalPlaybackAborted()) &&
          !expectedNavigationHandoff
        ) {
          lastBookAutoRunRef.current = null;
          lastTabAutoRunRef.current = null;
          return false;
        }
        if (nextBeat.bookScript) {
          lastBookAutoRunRef.current = `${beatIndexRef.current}:${nextBeat.id}`;
        } else if (nextBeat.tabScript) {
          lastTabAutoRunRef.current = `${beatIndexRef.current}:${nextBeat.id}`;
        }
        if (expectedNavigationHandoff) {
          enteredBeatRef.current = null;
          setBeatIndex(followingIndex);
          beatIndexRef.current = followingIndex;
        }
        return true;
      } finally {
        suppressBeatEnterSyncRef.current = false;
      }
    },
    [beats, invokeBeatScript, playback, studioTabToIndex, reportScriptFailure, runtime, setBeatIndex, setScriptingActive]
  );
  const advanceBeatIndexForManualChain = useCallback(
    (
      fromBeat: JourneyBeat,
      nextBeat: JourneyBeat,
      nextIndex: number,
      options?: { manualStep?: boolean }
    ) => {
      if (
        options?.manualStep &&
        shouldChainManualDirectorStepOnAdvance(fromBeat, nextBeat)
      ) {
        suppressBeatEnterSyncRef.current = true;
      }
      prepareBeatIndexAdvance(runtime, nextBeat);
      enteredBeatRef.current = null;
      setBeatIndex(nextIndex);
      beatIndexRef.current = nextIndex;
    },
    [setBeatIndex, runtime]
  );

  const advanceFromCompletedDirectorBeat = useCallback(
    async (options?: { manualStep?: boolean }): Promise<boolean> => {
      const beat = beats[beatIndexRef.current];
      if (!beat) {
        setScriptingActive(false);
        return false;
      }
      setScriptingActive(true);
      const next = advanceFrom(beatIndexRef.current);
      if (next >= beats.length) {
        setScriptingActive(false);
        return true;
      }
      const nextBeat = beats[next];
      advanceBeatIndexForManualChain(beat, nextBeat, next, options);
      if (
        options?.manualStep &&
        shouldChainManualDirectorStepOnAdvance(beat, nextBeat)
      ) {
        try {
          return await runChainedManualDirectorBeat(beat, nextBeat);
        } finally {
          setScriptingActive(false);
        }
      }
      setScriptingActive(false);
      return true;
    },
    [
      advanceBeatIndexForManualChain,
      advanceFrom,
      beats,
      runChainedManualDirectorBeat,
      setScriptingActive,
    ]
  );

  const runHomeScriptBeat = useCallback(
    async (
      beat: JourneyBeat,
      options?: {
        skip?: boolean;
        chainScreenFrames?: boolean;
        manualStep?: boolean;
      }
    ) => {
      if (!beat.homeScript) return false;
      const beatRunId = `${beatIndexRef.current}:${beat.id}`;
      if (
        shouldAdvanceCompletedDirectorStep({
          manualStep: Boolean(options?.manualStep || options?.chainScreenFrames),
          advanceAfter: true,
          lastAutoRunId: lastHomeAutoRunRef.current,
          beatRunId,
        })
      ) {
        setScriptingActive(true);
        try {
          enteredBeatRef.current = null;
          const next = advanceFrom(beatIndexRef.current);
          if (next >= beats.length) return true;
          const nextBeat = beats[next];
          if (options?.chainScreenFrames && isScreenFramesBeat(nextBeat)) {
            pendingManualScreenHandoffRef.current = nextBeat.id;
          }
          setBeatIndex(next);
          beatIndexRef.current = next;
          transportStepAttemptRef.current = null;
          return true;
        } finally {
          setScriptingActive(false);
        }
      }
      noteDirectorScriptInteraction(beat, options);
      const runId = ++homeScriptRunRef.current;
      setScriptingActive(true);
      try {
        playbackDirectorMonitor.noteDirectorScriptStarted(beat.id);
        const { ok, failureStep, diagnosticSent } = await invokeBeatScript(
          beat.homeScript,
          () => playback.runHomeScript(beat.homeScript!, options),
          options
        );
        playbackDirectorMonitor.noteDirectorScriptFinished(beat.id, ok);
        if (runId !== homeScriptRunRef.current) return false;
        if (!ok) {
          lastHomeAutoRunRef.current = null;
          if (!options?.skip && !diagnosticSent) {
            reportScriptFailure(beat, { failureStep });
          }
          return false;
        }
        if (wasSitePilotHomePlaybackAborted() && !options?.skip) {
          lastHomeAutoRunRef.current = null;
          return false;
        }
        lastHomeAutoRunRef.current = `${beatIndexRef.current}:${beat.id}`;
        enteredBeatRef.current = null;
        const next = advanceFrom(beatIndexRef.current);
        if (next >= beats.length) return true;
        const nextBeat = beats[next];
        if (options?.chainScreenFrames && isScreenFramesBeat(nextBeat)) {
          pendingManualScreenHandoffRef.current = nextBeat.id;
        }
        setBeatIndex(next);
        beatIndexRef.current = next;
        transportStepAttemptRef.current = null;
        return true;
      } finally {
        if (runId === homeScriptRunRef.current) {
          setScriptingActive(false);
        }
      }
    },
    [
      advanceFrom,
      beats,
      beats.length,
      invokeBeatScript,
      playback,
      reportScriptFailure,
      setBeatIndex,
      setScriptingActive,
    ]
  );

  const runAvailScriptBeat = useCallback(
    async (
      beat: JourneyBeat,
      advanceAfter: boolean,
      options?: { skip?: boolean; manualStep?: boolean }
    ) => {
      if (!beat.availScript) return false;
      const runId = `${beatIndexRef.current}:${beat.id}`;
      if (
        shouldAdvanceCompletedDirectorStep({
          manualStep: options?.manualStep,
          advanceAfter,
          lastAutoRunId: lastAvailAutoRunRef.current,
          beatRunId: runId,
        })
      ) {
        setScriptingActive(true);
        enteredBeatRef.current = null;
        const next = advanceFrom(beatIndexRef.current);
        if (next >= beats.length) return true;
        setBeatIndex(next);
        beatIndexRef.current = next;
        setScriptingActive(false);
        return true;
      }
      noteDirectorScriptInteraction(beat, options);
      setScriptingActive(true);
      try {
        const { ok, failureStep, diagnosticSent } = await invokeBeatScript(
          beat.availScript,
          () => playback.runAvailScript(beat.availScript!, options),
          options
        );
        if (!ok) {
          lastAvailAutoRunRef.current = null;
          if (!options?.skip && !diagnosticSent) {
            reportScriptFailure(beat, { failureStep });
          }
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
        const nextBeat = beats[next];
        setBeatIndex(next);
        beatIndexRef.current = next;
        return true;
      } finally {
        setScriptingActive(false);
      }
    },
    [advanceFrom, beats.length, invokeBeatScript, playback, reportScriptFailure, setBeatIndex, setScriptingActive]
  );

  const runBookScriptBeat = useCallback(
    async (
      beat: JourneyBeat,
      advanceAfter: boolean,
      options?: { skip?: boolean; syncState?: boolean; manualStep?: boolean }
    ) => {
      const activeBeat = beats[beatIndexRef.current] ?? beat;
      if (!activeBeat.bookScript) return false;
      const runId = `${beatIndexRef.current}:${activeBeat.id}`;
      if (
        options?.manualStep &&
        lastBookAutoRunRef.current === runId &&
        advanceAfter
      ) {
        setScriptingActive(true);
        return advanceFromCompletedDirectorBeat(options);
      }
      playbackDirectorMonitor.noteDirectorScriptStarted(activeBeat.id);
      noteDirectorScriptInteraction(activeBeat, options);
      setScriptingActive(true);
      try {
        const { ok, failureStep, diagnosticSent } = await invokeBeatScript(
          activeBeat.bookScript,
          () => playback.runBookScript(activeBeat.bookScript!, options),
          options
        );
        playbackDirectorMonitor.noteDirectorScriptFinished(activeBeat.id, ok);
        if (!ok) {
          lastBookAutoRunRef.current = null;
          if (!options?.skip && !diagnosticSent) {
            reportScriptFailure(activeBeat, { failureStep });
          }
          return false;
        }
        if (wasBookPlaybackAborted() && !options?.skip) {
          lastBookAutoRunRef.current = null;
          return false;
        }
        lastBookAutoRunRef.current = `${beatIndexRef.current}:${activeBeat.id}`;
        if (!advanceAfter) return true;
        const next = advanceFrom(beatIndexRef.current);
        if (next >= beats.length) return true;
        const nextBeat = beats[next];
        advanceBeatIndexForManualChain(activeBeat, nextBeat, next, options);
        if (
          options?.manualStep &&
          shouldChainManualDirectorStepOnAdvance(activeBeat, nextBeat)
        ) {
          return await runChainedManualDirectorBeat(activeBeat, nextBeat);
        }
        return true;
      } finally {
        setScriptingActive(false);
      }
    },
    [
      advanceBeatIndexForManualChain,
      advanceFrom,
      beats,
      invokeBeatScript,
      playback,
      reportScriptFailure,
      runChainedManualDirectorBeat,
      advanceFromCompletedDirectorBeat,
      setScriptingActive,
    ]
  );

  const runTabScriptBeat = useCallback(
    async (beat: JourneyBeat, options?: { skip?: boolean; manualStep?: boolean }) => {
      const activeBeat = beats[beatIndexRef.current] ?? beat;
      if (!activeBeat.tabScript) return false;
      const runId = `${beatIndexRef.current}:${activeBeat.id}`;
      if (options?.manualStep && lastTabAutoRunRef.current === runId) {
        setScriptingActive(true);
        return advanceFromCompletedDirectorBeat(options);
      }
      noteDirectorScriptInteraction(activeBeat, options);
      setScriptingActive(true);
      try {
        playbackDirectorMonitor.noteDirectorScriptStarted(activeBeat.id);
        const { ok, failureStep, diagnosticSent } = await invokeBeatScript(
          activeBeat.tabScript,
          () => playback.runTabScript(activeBeat.tabScript!, runtime, options),
          options
        );
        playbackDirectorMonitor.noteDirectorScriptFinished(activeBeat.id, ok);
        if (!ok) {
          lastTabAutoRunRef.current = null;
          if (!options?.skip && !diagnosticSent) {
            reportScriptFailure(activeBeat, { failureStep });
          }
          return false;
        }
        if (wasTraditionalPlaybackAborted() && !options?.skip) {
          lastTabAutoRunRef.current = null;
          return false;
        }
        lastTabAutoRunRef.current = runId;
        const next = advanceFrom(beatIndexRef.current);
        if (next >= beats.length) return true;
        const nextBeat = beats[next];
        advanceBeatIndexForManualChain(activeBeat, nextBeat, next, options);
        if (
          options?.manualStep &&
          shouldChainManualDirectorStepOnAdvance(activeBeat, nextBeat)
        ) {
          return await runChainedManualDirectorBeat(activeBeat, nextBeat);
        }
        return true;
      } finally {
        setScriptingActive(false);
      }
    },
    [
      advanceBeatIndexForManualChain,
      advanceFrom,
      beats,
      invokeBeatScript,
      playback,
      reportScriptFailure,
      runChainedManualDirectorBeat,
      runtime,
      advanceFromCompletedDirectorBeat,
      setScriptingActive,
    ]
  );

  /** Compile v2 — REC demo-click → demo cursor + optional camera scroll. */
  const runRecordedClickBeat = useCallback(
    async (
      beat: JourneyBeat,
      options?: { skip?: boolean; manualStep?: boolean }
    ) => {
      const activeBeat = beats[beatIndexRef.current] ?? beat;
      const click = activeBeat.recordedClick;
      if (!click?.selectorChain?.length) return false;
      const runId = `${beatIndexRef.current}:${activeBeat.id}`;
      if (options?.manualStep && lastRecordedClickAutoRunRef.current === runId) {
        setScriptingActive(true);
        return advanceFromCompletedDirectorBeat(options);
      }
      noteDirectorScriptInteraction(activeBeat, options);
      setScriptingActive(true);
      try {
        if (options?.skip) {
          lastRecordedClickAutoRunRef.current = runId;
          const next = advanceFrom(beatIndexRef.current);
          if (
            shouldCompleteJourneyPlayAfterScript({
              nextIndex: next,
              beatCount: beats.length,
              isPlaying: isPlayingRef.current,
              manualStep: options?.manualStep,
            })
          ) {
            completeJourneyPlay();
            return true;
          }
          if (next < beats.length) {
            advanceBeatIndexForManualChain(
              activeBeat,
              beats[next],
              next,
              options
            );
          }
          return true;
        }

        // Arm handoff watchdog: dwell → recordedClick must note start or Play
        // false-fails at DIRECTOR_HANDOFF_CHECK_MS while cursor is still traveling.
        playbackDirectorMonitor.noteDirectorScriptStarted(activeBeat.id);
        const { ok, failureStep, diagnosticSent } = await invokeBeatScript(
          beatDirectorScriptLabel(activeBeat) ?? "recorded-click",
          () =>
            playRecordedClick(click, {
              ...options,
              nextRecordedClick: beats[beatIndexRef.current + 1]?.recordedClick,
              applyStudioModal: (modalId) => {
                try {
                  runtime.applyStudioModal?.(modalId);
                } catch {
                  /* hang-safe */
                }
              },
            }),
          options
        );
        playbackDirectorMonitor.noteDirectorScriptFinished(activeBeat.id, ok);
        if (!ok) {
          lastRecordedClickAutoRunRef.current = null;
          if (!options?.skip && !diagnosticSent) {
            reportScriptFailure(activeBeat, { failureStep });
          }
          return false;
        }
        lastRecordedClickAutoRunRef.current = runId;
        const next = advanceFrom(beatIndexRef.current);
        if (
          shouldCompleteJourneyPlayAfterScript({
            nextIndex: next,
            beatCount: beats.length,
            isPlaying: isPlayingRef.current,
            manualStep: options?.manualStep,
          })
        ) {
          completeJourneyPlay();
          return true;
        }
        if (next >= beats.length) return true;
        const nextBeat = beats[next];
        advanceBeatIndexForManualChain(activeBeat, nextBeat, next, options);
        return true;
      } finally {
        setScriptingActive(false);
      }
    },
    [
      advanceBeatIndexForManualChain,
      advanceFrom,
      advanceFromCompletedDirectorBeat,
      beats,
      completeJourneyPlay,
      invokeBeatScript,
      reportScriptFailure,
      runtime,
      setScriptingActive,
    ]
  );

  /** First-class camera dwell → eased scroll (own STEPS; reverse on step-back). */
  const runCameraBeat = useCallback(
    async (
      beat: JourneyBeat,
      options?: { skip?: boolean; manualStep?: boolean; instant?: boolean }
    ) => {
      const activeBeat = beats[beatIndexRef.current] ?? beat;
      if (!beatHasCameraStep(activeBeat) || !activeBeat.camera) return false;
      const runId = `${beatIndexRef.current}:${activeBeat.id}`;
      if (options?.manualStep && lastCameraAutoRunRef.current === runId) {
        setScriptingActive(true);
        return advanceFromCompletedDirectorBeat(options);
      }
      noteDirectorScriptInteraction(activeBeat, options);
      setScriptingActive(true);
      try {
        const { ok, failureStep, diagnosticSent } = await invokeBeatScript(
          "camera",
          async () => {
            const result = await playCameraBeat(activeBeat.camera!, {
              skip: options?.skip,
              instant: options?.instant,
              beatId: activeBeat.id,
            });
            if (!result.ok) {
              return {
                ok: false as const,
                step: result.step ?? "camera-beat",
              };
            }
            return { ok: true as const };
          },
          options
        );
        if (!ok) {
          lastCameraAutoRunRef.current = null;
          if (!options?.skip && !diagnosticSent) {
            reportScriptFailure(activeBeat, { failureStep });
          }
          return false;
        }
        lastCameraAutoRunRef.current = runId;
        const next = advanceFrom(beatIndexRef.current);
        if (
          shouldCompleteJourneyPlayAfterScript({
            nextIndex: next,
            beatCount: beats.length,
            isPlaying: isPlayingRef.current,
            manualStep: options?.manualStep,
          })
        ) {
          completeJourneyPlay();
          return true;
        }
        if (next >= beats.length) return true;
        const nextBeat = beats[next];
        advanceBeatIndexForManualChain(activeBeat, nextBeat, next, options);
        return true;
      } finally {
        setScriptingActive(false);
      }
    },
    [
      advanceBeatIndexForManualChain,
      advanceFrom,
      advanceFromCompletedDirectorBeat,
      beats,
      completeJourneyPlay,
      invokeBeatScript,
      reportScriptFailure,
      setScriptingActive,
    ]
  );

  useEffect(() => {
    transportStepAttemptRef.current = null;
  }, [beatIndex, screenPlayback.visibleCount]);

  useEffect(() => {
    const attempt = transportStepAttemptRef.current;
    if (!active || !attempt || transportStepToken === 0) return;

    let cancelled = false;
    let retryTimer: number | null = null;

    const finishCheck = (retry = 0) => {
      if (cancelled || !transportStepAttemptRef.current) return;
      if (transportStepAttemptRef.current.beatIndex !== beatIndexRef.current) {
        transportStepAttemptRef.current = null;
        return;
      }
      if (
        isScreenFramesBeat(beats[beatIndexRef.current]) &&
        attempt.scenarioVisibleCount != null &&
        screenPlayback.visibleCount !== attempt.scenarioVisibleCount
      ) {
        transportStepAttemptRef.current = null;
        return;
      }
      // Still scripting / retreat-syncing — keep watching; do not Alarm yet.
      if (isScriptingNow() || retreatSyncRef.current) {
        if (retry < 24) {
          retryTimer = window.setTimeout(() => finishCheck(retry + 1), 600);
        }
        return;
      }
      if (
        isScreenFramesBeat(beats[beatIndexRef.current]) &&
        screenPlayback.isPausingBeforeReveal &&
        retry < 8
      ) {
        retryTimer = window.setTimeout(() => finishCheck(retry + 1), 600);
        return;
      }
      const beatRunId = `${beatIndexRef.current}:${beats[beatIndexRef.current]?.id}`;
      if (
        shouldSuppressTransportNoOpForBeat({
          beatRunId,
          lastAutoRunIds: [
            lastAvailAutoRunRef.current,
            lastHomeAutoRunRef.current,
            lastTabAutoRunRef.current,
            lastBookAutoRunRef.current,
          ],
        })
      ) {
        transportStepAttemptRef.current = null;
        return;
      }
      const beat = beats[beatIndexRef.current];
      const script = describeBeatScript(beat);
      transportStepAttemptRef.current = null;
      onDiagnosticRef.current?.(
        playbackTransportNoOpDiagnostic({
          journeyId: journey?.id,
          beatId: beat?.id,
          beatLabel: beat?.label,
          scriptKind: script?.kind,
          scriptId: script?.id,
        })
      );
    };

    const timer = window.setTimeout(() => finishCheck(0), TRANSPORT_STEP_NO_OP_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      if (retryTimer != null) {
        window.clearTimeout(retryTimer);
      }
    };
  }, [
    active,
    beatIndex,
    beats,
    isScripting,
    journey?.id,
    screenPlayback.isPausingBeforeReveal,
    screenPlayback.visibleCount,
    transportStepToken,
  ]);

  useEffect(() => () => stopScrollPoll(), [stopScrollPoll]);

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
      void runBookScriptBeat(beat, true, { skip: true, syncState: true });
      return;
    }
    if (beat.recordedClick?.selectorChain?.length) {
      void runRecordedClickBeat(beat, { skip: true });
    }
  }, [
    abortActiveScripts,
    beats,
    runAvailScriptBeat,
    runBookScriptBeat,
    runHomeScriptBeat,
    runRecordedClickBeat,
    runTabScriptBeat,
  ]);

  const navigateBeatTab = useCallback(
    (beat: JourneyBeat | undefined, options?: { instant?: boolean }) => {
      if (beat?.protoTab == null) return;
      // Always goToTab — skipping when index matches leaves hubOpen (PO hub leak).
      navigateToBeatTab(runtime, studioTabToIndex(beat.protoTab), options);
    },
    [studioTabToIndex, runtime]
  );

  const prepareBookStep2Landing = useCallback(
    async (beat: JourneyBeat) => {
      runtime.closeAllPopups();
      runtime.closeAvailability();
      // Wait for scrim unmount — transport guard FAIL stray-popup-on-beat otherwise.
      for (let i = 0; i < 40; i++) {
        const scrim =
          typeof document !== "undefined" &&
          document.querySelector(".studio-avail-scrim, .proto-avail-scrim");
        if (!scrim) break;
        runtime.closeAvailability();
        runtime.closeAllPopups();
        await new Promise<void>((resolve) => {
          window.setTimeout(resolve, 50);
        });
      }
      cancelDemoCursorJourneyEndFade();
      await parkDemoCursorAtRest({ reason: "book-step2-landing" });
      if (!retreatSyncRef.current && playback.syncDwellRetreat) {
        // Instant snap always — eased date-section scroll on SF enter was
        // page-jiggle deltaY≈148 (host y 178→30) while nav-cross settled.
        // preserveHandoff: keep Avail June 21 + 15:30 so Step2 demos a change.
        await playback.syncDwellRetreat(beat, {
          instant: true,
          preserveHandoff: true,
        });
      }
    },
    [playback, runtime]
  );

  const runBeatEnter = useCallback(
    async (beat: JourneyBeat) => {
      try {
        // Browse (CJM off): beat index may fall back to journey-start for tabs
        // outside the active CJM (e.g. Book Step 1 under agentic-cjm). Never snap
        // the viewport to that fallback tab — manual nav owns the screen.
        if (
          shouldNavigateBeatTabOnEnter(
            scenarioBrowseMode,
            suppressInitialBeatTabNavRef.current
          )
        ) {
          navigateBeatTab(beat);
        }
        if (isBookStep2DwellBeatId(beat.id) && !scenarioBrowseMode) {
          await prepareBookStep2Landing(beat);
        } else if (isBookStep2DwellBeatId(beat.id)) {
          runtime.closeAllPopups();
          runtime.closeAvailability();
        }
        if (beat.onEnter) {
          notePlaybackBeatEnter(beat.onEnter, beat.id);
          playback.runBeatAction(beat.onEnter, runtime);
        }
      } finally {
        // Tab now navigated (+ book-step2 popup teardown settled) — safe for
        // the transport guard to validate beat/tab alignment again.
        beatEnterPendingRef.current = false;
      }
    },
    [
      navigateBeatTab,
      playback,
      prepareBookStep2Landing,
      runtime,
      scenarioBrowseMode,
    ]
  );

  const scheduleDwellAdvance = useCallback(() => {
    if (playTimerRef.current != null) {
      window.clearTimeout(playTimerRef.current);
      playTimerRef.current = null;
    }
    const beat = beats[beatIndexRef.current];
    if (
      isScreenFramesBeat(beat) ||
      beat?.homeScript ||
      beat?.bookScript ||
      beat?.tabScript ||
      beatHasCameraStep(beat) ||
      beat?.recordedClick?.selectorChain?.length
    ) {
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
      }, playbackMs(1200));
      return;
    }
    const dwellMs = beat?.dwellMs ?? 2800;
    playTimerRef.current = window.setTimeout(() => {
      playTimerRef.current = null;
      if (!isPlayingRef.current) return;
      const fromBeat = beats[beatIndexRef.current];
      const next = advanceFrom(beatIndexRef.current);
      if (next >= beats.length) {
        completeJourneyPlay();
        return;
      }
      const nextBeat = beats[next];
      // Camera is not a director script — do not arm director-step-skipped (PO FAIL
      // was firing on plp → plp-*-camera while camera dwell > handoff timer).
      const scriptLabel = beatDirectorScriptLabel(nextBeat);
      if (
        fromBeat &&
        scriptLabel &&
        isDwellLandingBeat(fromBeat) &&
        !beatHasCameraStep(nextBeat)
      ) {
        playbackDirectorMonitor.scheduleDirectorHandoff({
          fromBeatId: fromBeat.id,
          toBeatId: nextBeat.id,
          scriptLabel,
        });
      }
      enteredBeatRef.current = null;
      lastAvailAutoRunRef.current = null;
      setBeatIndex(next);
      beatIndexRef.current = next;
      scheduleDwellAdvance();
    }, playbackMs(dwellMs));
  }, [advanceFrom, beats.length, completeJourneyPlay, setBeatIndex]);

  scheduleDwellAdvanceRef.current = scheduleDwellAdvance;

  useEffect(() => {
    if (!active) return;
    const beat = beats[beatIndex];
    if (!shouldSkipBeat(beat)) return;
    const next = advanceFrom(beatIndex);
    if (next === beatIndex || next >= beats.length) return;
    enteredBeatRef.current = null;
    setBeatIndex(next);
    beatIndexRef.current = next;
  }, [active, advanceFrom, beatIndex, beats, shouldSkipBeat, setBeatIndex]);

  useEffect(() => {
    if (!active || !currentBeat) return;
    if (enteredBeatRef.current === currentBeat.id) return;
    enteredBeatRef.current = currentBeat.id;
    lastAvailAutoRunRef.current = null;
    lastBookAutoRunRef.current = null;
    lastTabAutoRunRef.current = null;
    lastHomeAutoRunRef.current = null;
    lastRecordedClickAutoRunRef.current = null;
    lastCameraAutoRunRef.current = null;
    if (!scenarioBrowseMode) {
      setPlaybackCursorDiagnosticContext({
        beatId: currentBeat.id,
        beatLabel: currentBeat.label,
        scriptId:
          currentBeat.bookScript ??
          currentBeat.tabScript ??
          currentBeat.homeScript ??
          currentBeat.availScript,
        phase: resolveBookStep2CursorPhase({
          beatId: currentBeat.id,
          dwellOnly:
            isBookStep2DwellBeatId(currentBeat.id) && isDwellLandingBeat(currentBeat),
        }),
      });
      if (
        isBookStep2DwellBeatId(currentBeat.id) &&
        isDwellLandingBeat(currentBeat) &&
        !currentBeat.bookScript
      ) {
        notePlaybackCursorEvent("dwell-no-cursor", {
          beatId: currentBeat.id,
          phase: "dwell",
          detail: retreatSyncRef.current
            ? "beat-enter retreat dwell — scroll sync only, no director click"
            : `dwell-only enter (${currentBeat.dwellMs ?? 2800}ms) — cursor should park, not click`,
        });
      }
    }
    if (!retreatSyncRef.current) {
      void runBeatEnter(currentBeat);
    }
    if (retreatSyncRef.current) {
      suppressInitialBeatTabNavRef.current = false;
      navigateBeatTab(currentBeat, { instant: true });
      void syncBeatRetreatState(playback, currentBeat, runtime, {
        instant: true,
      }).finally(() => {
        if (isScreenFramesBeat(currentBeat)) {
          onScreenFramesRetreatEndRef.current?.();
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              playbackScrollMonitor.noteRetreatSync();
              screenPlayback.resetToEnd({ smooth: false, force: true });
            });
          });
        } else {
          playbackScrollMonitor.noteRetreatSync();
        }
        endRetreatSync();
        beatEnterPendingRef.current = false;
      });
    } else if (
      !scenarioBrowseMode &&
      currentBeat.bookScript &&
      !isPlayingRef.current &&
      !suppressBeatEnterSyncRef.current
    ) {
      const bookRunId = `${beatIndexRef.current}:${currentBeat.id}`;
      if (lastBookAutoRunRef.current !== bookRunId) {
        noteDirectorScriptInteraction(currentBeat, { syncState: true });
        void playback.runBookScript(currentBeat.bookScript, {
          skip: true,
          syncState: true,
          instant: true,
        });
      }
    }
    suppressInitialBeatTabNavRef.current = false;
    if (
      isPlayingRef.current &&
      !retreatSyncRef.current &&
      isDwellLandingBeat(currentBeat) &&
      !currentBeat.availScript
    ) {
      scheduleDwellAdvanceRef.current();
    }
  }, [
    active,
    currentBeat,
    endRetreatSync,
    isPlaying,
    navigateBeatTab,
    playback,
    runBeatEnter,
    runtime,
    scenarioBrowseMode,
    screenPlayback,
  ]);

  useEffect(() => {
    if (!active || !isPlaying || isScripting || retreatSyncRef.current) return;
    const beat = beats[beatIndex];
    if (!beat || !isDwellLandingBeat(beat) || beat.availScript) return;
    scheduleDwellAdvanceRef.current();
  }, [active, beatIndex, beats, isPlaying, isScripting]);

  useEffect(() => {
    if (!active || !isPlaying || isScripting || !currentBeat?.homeScript) return;

    const runId = `${beatIndex}:${currentBeat.id}`;
    if (lastHomeAutoRunRef.current === runId) return;

    void runHomeScriptBeat(currentBeat);
  }, [
    active,
    beatIndex,
    currentBeat,
    isPlaying,
    isScripting,
    runHomeScriptBeat,
  ]);

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
      if (currentBeat.availScript === "book-now") {
        window.setTimeout(() => {
          if (!isPlayingRef.current) return;
          scheduleDwellAdvanceRef.current();
        }, 120);
        return;
      }
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
    if (
      !active ||
      !isPlaying ||
      isScripting ||
      isScriptingRef.current ||
      !currentBeat?.recordedClick?.selectorChain?.length
    ) {
      return;
    }

    const runId = `${beatIndex}:${currentBeat.id}`;
    if (lastRecordedClickAutoRunRef.current === runId) return;

    void (async () => {
      const ok = await runRecordedClickBeat(currentBeat);
      if (!ok) return;
      if (!isPlayingRef.current) return;
      scheduleDwellAdvanceRef.current();
    })();
  }, [
    active,
    beatIndex,
    currentBeat,
    isPlaying,
    isScripting,
    runRecordedClickBeat,
  ]);

  useEffect(() => {
    if (
      !active ||
      !isPlaying ||
      isScripting ||
      !beatHasCameraStep(currentBeat)
    ) {
      return;
    }

    const runId = `${beatIndex}:${currentBeat!.id}`;
    if (lastCameraAutoRunRef.current === runId) return;

    void (async () => {
      const ok = await runCameraBeat(currentBeat!);
      if (!ok) return;
      if (!isPlayingRef.current) return;
      scheduleDwellAdvanceRef.current();
    })();
  }, [
    active,
    beatIndex,
    currentBeat,
    isPlaying,
    isScripting,
    runCameraBeat,
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
    if (screenPlayback.totalFrames === 0) return;

    const readyKey = `${beatIndex}:${currentBeat.id}`;
    const handoffPending =
      !scenarioBrowseMode &&
      pendingManualScreenHandoffRef.current === currentBeat.id;

    const resumeContinuousPlay = () => {
      // Continuous Play ≡ SF progressive path (prelude + camera) — never a
      // separate dump-all transport. Always land jumpToStart before play.
      if (isPlayingRef.current && !screenPlayback.isPlaying) {
        screenPlayback.play();
      }
    };

    let scheduledLandPlay = false;
    if (scenarioBrowseMode) {
      screenBeatReadyRef.current = readyKey;
    } else if (screenBeatReadyRef.current !== readyKey) {
      screenBeatReadyRef.current = readyKey;
      // Handoff path owns jump→step (must not race jumpToStart mid-thinking).
      if (!handoffPending) {
        scheduledLandPlay = true;
        const landThenPlay = () => {
          if (
            currentBeat.protoTab != null &&
            currentTabIndexRef.current !== studioTabToIndex(currentBeat.protoTab)
          ) {
            requestAnimationFrame(landThenPlay);
            return;
          }
          // PO: chat enter shows Sarah q0 only — jump before Play advances.
          screenPlayback.jumpToStart();
          resumeContinuousPlay();
        };
        landThenPlay();
      }
    }

    let outerHandoffRaf = 0;
    let innerHandoffRaf = 0;
    if (handoffPending) {
      pendingManualScreenHandoffRef.current = null;
      // Home→chat: land on q0, then step to r0 WITH thinking prelude.
      // Never jumpToStart while beforeReveal is running (aborts thinking).
      screenPlayback.jumpToStart();
      const tryHandoffStep = (attempt: number) => {
        if (beatIndexRef.current !== beatIndex) return;
        const reactReady =
          typeof document !== "undefined" &&
          Boolean(
            document.querySelector(
              '[data-studio-react-screen="chat"] [data-studio-chat-frame="q0"]'
            )
          );
        if (!reactReady && attempt < 40) {
          window.setTimeout(() => tryHandoffStep(attempt + 1), 50);
          return;
        }
        if (screenPlayback.canStepForward) {
          screenPlayback.stepForward();
        }
        // After first SF handoff step, keep continuous Play ≡ SF auto-advance.
        resumeContinuousPlay();
      };
      outerHandoffRaf = requestAnimationFrame(() => {
        innerHandoffRaf = requestAnimationFrame(() => {
          tryHandoffStep(0);
        });
      });
    } else if (!scheduledLandPlay) {
      // Already on this beat (effect re-fire) — resume Play if journey is on air.
      resumeContinuousPlay();
    }

    return () => {
      cancelAnimationFrame(outerHandoffRaf);
      cancelAnimationFrame(innerHandoffRaf);
    };
  }, [
    active,
    beatIndex,
    currentBeat,
    onScreenFramesBeat,
    screenPlayback,
    screenPlayback.totalFrames,
    screenPlayback.isPlaying,
    screenPlayback.canStepForward,
    studioTabToIndex,
    scenarioBrowseMode,
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
    lastAvailAutoRunRef.current = null;
    lastBookAutoRunRef.current = null;
    lastTabAutoRunRef.current = null;
    lastHomeAutoRunRef.current = null;
    lastRecordedClickAutoRunRef.current = null;
    lastCameraAutoRunRef.current = null;
    suppressInitialBeatTabNavRef.current = false;
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
    lastHomeAutoRunRef.current = null;
    lastRecordedClickAutoRunRef.current = null;
    lastCameraAutoRunRef.current = null;
    setBeatIndex(next);
    beatIndexRef.current = next;
    return true;
  }, [advanceFrom, beats.length, setBeatIndex]);

  const runDirectorBeat = useCallback(
    async (
      beat: JourneyBeat,
      advanceAfter: boolean,
      options?: { skip?: boolean; syncState?: boolean }
    ): Promise<boolean> => {
      if (beat.bookScript) {
        return runBookScriptBeat(beat, advanceAfter, options);
      }
      if (beat.tabScript) {
        return runTabScriptBeat(beat, options);
      }
      if (beat.homeScript) {
        return runHomeScriptBeat(beat, options);
      }
      if (beat.availScript) {
        return runAvailScriptBeat(beat, advanceAfter, options);
      }
      if (beatHasCameraStep(beat)) {
        return runCameraBeat(beat, options);
      }
      if (beat.recordedClick?.selectorChain?.length) {
        return runRecordedClickBeat(beat, options);
      }
      return false;
    },
    [
      runAvailScriptBeat,
      runBookScriptBeat,
      runCameraBeat,
      runHomeScriptBeat,
      runRecordedClickBeat,
      runTabScriptBeat,
    ]
  );

  const advanceFromDwellLanding = useCallback(
    (landingBeat: JourneyBeat) => {
      const next = advanceFrom(beatIndexRef.current);
      if (next >= beats.length) return false;
      const nextBeat = beats[next];
      enteredBeatRef.current = null;
      lastAvailAutoRunRef.current = null;
      lastBookAutoRunRef.current = null;
      lastTabAutoRunRef.current = null;
      lastHomeAutoRunRef.current = null;
      prepareBeatIndexAdvance(runtime, nextBeat);
      setBeatIndex(next);
      beatIndexRef.current = next;

      const scriptLabel = beatDirectorScriptLabel(nextBeat);
      const runNext =
        Boolean(scriptLabel) ||
        beatHasCameraStep(nextBeat) ||
        Boolean(nextBeat.recordedClick?.selectorChain?.length);
      if (runNext) {
        suppressBeatEnterSyncRef.current = true;
        // Only real director scripts arm the handoff watchdog (not camera).
        if (scriptLabel && !beatHasCameraStep(nextBeat)) {
          playbackDirectorMonitor.scheduleDirectorHandoff({
            fromBeatId: landingBeat.id,
            toBeatId: nextBeat.id,
            scriptLabel,
          });
        }
        void runDirectorBeat(nextBeat, false).finally(() => {
          suppressBeatEnterSyncRef.current = false;
          playbackDirectorMonitor.clearDirectorHandoff(nextBeat.id);
        });
      }

      return true;
    },
    [advanceFrom, beats, runDirectorBeat, runtime, setBeatIndex]
  );

  const retreatBeat = useCallback(() => {
    const currentIndex = beatIndexRef.current;
    const fromBeat = beats[currentIndex];
    const playlistTarget = resolveJourneyRetreatTarget({
      playlist: studioPlaylist,
      currentTouchpointKey,
      currentBeatId: fromBeat?.id,
      beats,
      shouldSkipBeat,
    });

    if (playlistTarget?.kind === "close-popups") {
      runtime.closeAllPopups();
      runtime.closeAvailability();
      return true;
    }

    let prev: number;
    let prevBeat: JourneyBeat | undefined;

    const sameTabRetreatIndex = retreatFrom(currentIndex);
    const sameTabRetreatBeat = beats[sameTabRetreatIndex];
    const sameTabRetreatApplies =
      fromBeat?.protoTab != null &&
      sameTabRetreatBeat?.protoTab === fromBeat.protoTab &&
      sameTabRetreatIndex >= 0 &&
      sameTabRetreatIndex !== currentIndex;

    if (playlistTarget?.kind === "beat") {
      prev = playlistTarget.beatIndex;
      prevBeat = playlistTarget.beat;
    } else if (sameTabRetreatApplies) {
      prev = sameTabRetreatIndex;
      prevBeat = sameTabRetreatBeat;
    } else {
      prev = retreatFrom(currentIndex);
      if (prev < 0) return false;
      prevBeat = beats[prev];
    }

    enteredBeatRef.current = null;
    lastAvailAutoRunRef.current = null;
    lastBookAutoRunRef.current = null;
    lastTabAutoRunRef.current = null;
    lastHomeAutoRunRef.current = null;
    lastRecordedClickAutoRunRef.current = null;
    lastCameraAutoRunRef.current = null;

    runtime.closeAllPopups();
    runtime.closeAvailability();

    beginRetreatSync();
    cancelDemoCursorJourneyEndFade();
    void parkDemoCursorAtRest({ reason: "retreat" });

    // Scenario useLayoutEffect runs before beat-enter useEffect — set restore
    // intent synchronously so re-init lands at thread end, not minVisibleFrames.
    if (isScreenFramesBeat(prevBeat)) {
      onScreenFramesRetreatEndRef.current?.();
    }

    setBeatIndex(prev);
    beatIndexRef.current = prev;

    return true;
  }, [
    beats,
    currentTouchpointKey,
    retreatFrom,
    runtime,
    setBeatIndex,
    shouldSkipBeat,
    studioPlaylist,
    beginRetreatSync,
  ]);

  const noteManualDirectorStep = useCallback((beat: JourneyBeat | undefined) => {
    const scriptLabel = beatDirectorScriptLabel(beat);
    if (!beat || !scriptLabel) return;
    playbackDirectorMonitor.noteManualDirectorStepExpected(beat.id, scriptLabel);
  }, []);

  const stepScenarioFrameForward = useCallback(() => {
    if (
      !screenPlayback.isPausingBeforeReveal &&
      !screenPlayback.canStepForward
    ) {
      advanceBeat();
      return;
    }
    screenPlayback.stepForward();
  }, [advanceBeat, screenPlayback]);

  const stepForward = useCallback(() => {
    if (atPlaylistEndRef.current) return;
    // Retreat-sync owns the beat — queue SF until sync restores home/composer.
    if (retreatSyncRef.current) {
      pendingStepForwardAfterRetreatRef.current = true;
      return;
    }
    const activeBeat = beats[beatIndexRef.current];
    const onAirNow =
      isScriptingNow() ||
      playbackScrollBusy ||
      (onScreenFramesBeat &&
        (screenPlayback.isPausingBeforeReveal || screenPlayback.isPlaying)) ||
      (!onScreenFramesBeat && isPlaying);
    if (!isScriptingNow() && onAirNow) return;
    suppressInitialBeatTabNavRef.current = false;
    transportStepAttemptRef.current = {
      beatIndex: beatIndexRef.current,
      beatId: activeBeat?.id,
      scenarioVisibleCount: onScreenFramesBeat
        ? screenPlayback.visibleCount
        : undefined,
    };
    setTransportStepToken((token) => token + 1);
    if (isScriptingNow()) {
      // Keep isPlaying so chat (and other beats) resume after the skip completes.
      abortActiveScripts();
      if (onScreenFramesBeat) {
        stopAutoPlayOnly();
        stepScenarioFrameForward();
        return;
      }
      if (isDwellLandingBeat(activeBeat)) {
        stopAutoPlayOnly();
        advanceFromDwellLanding(activeBeat);
        return;
      }
      skipActiveScriptingBeat();
      return;
    }
    stopAutoPlayOnly();
    if (onScreenFramesBeat) {
      stepScenarioFrameForward();
      return;
    }
    if (activeBeat?.homeScript) {
      setScriptingActive(true);
      noteManualDirectorStep(activeBeat);
      void runHomeScriptBeat(activeBeat, { chainScreenFrames: true });
      return;
    }
    if (activeBeat?.tabScript) {
      setScriptingActive(true);
      noteManualDirectorStep(activeBeat);
      void runTabScriptBeat(activeBeat, { manualStep: true });
      return;
    }
    if (activeBeat?.availScript) {
      setScriptingActive(true);
      noteManualDirectorStep(activeBeat);
      void runAvailScriptBeat(activeBeat, true, { manualStep: true });
      return;
    }
    if (activeBeat?.bookScript) {
      setScriptingActive(true);
      noteManualDirectorStep(activeBeat);
      void runBookScriptBeat(activeBeat, true, { manualStep: true });
      return;
    }
    if (activeBeat?.recordedClick?.selectorChain?.length) {
      setScriptingActive(true);
      noteManualDirectorStep(activeBeat);
      void runRecordedClickBeat(activeBeat, { manualStep: true });
      return;
    }
    if (beatHasCameraStep(activeBeat)) {
      setScriptingActive(true);
      noteManualDirectorStep(activeBeat);
      void runCameraBeat(activeBeat, { manualStep: true });
      return;
    }
    if (isDwellLandingBeat(activeBeat)) {
      advanceFromDwellLanding(activeBeat);
      return;
    }
    advanceBeat();
  }, [
    advanceBeat,
    advanceFromDwellLanding,
    beats,
    abortActiveScripts,
    isPlaying,
    isScripting,
    noteManualDirectorStep,
    onScreenFramesBeat,
    playbackScrollBusy,
    runAvailScriptBeat,
    runBookScriptBeat,
    runCameraBeat,
    runHomeScriptBeat,
    runRecordedClickBeat,
    runTabScriptBeat,
    screenPlayback,
    setScriptingActive,
    skipActiveScriptingBeat,
    stepScenarioFrameForward,
    stopAutoPlayOnly,
    stopJourneyPlay,
  ]);
  stepForwardRef.current = stepForward;

  const stepBack = useCallback(() => {
    suppressInitialBeatTabNavRef.current = false;
    if (isScriptingNow()) return;
    pendingStepForwardAfterRetreatRef.current = false;
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
    if (isScriptingNow()) {
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

    const lastPlayable = findLastPlayableBeatIndex(beats, shouldSkipBeat);
    if (beatIndexRef.current >= lastPlayable) {
      // Already stopped at finale — no auto-rewind. Use Jump to start to replay.
      return;
    }

    suppressInitialBeatTabNavRef.current = false;
    const beat = beats[beatIndexRef.current];
    navigateBeatTab(beat);
    if (beat?.homeScript) {
      isPlayingRef.current = true;
      setIsPlaying(true);
      lastHomeAutoRunRef.current = null;
      return;
    }

    if (beat?.tabScript) {
      isPlayingRef.current = true;
      setIsPlaying(true);
      lastTabAutoRunRef.current = null;
      return;
    }

    if (beat?.recordedClick?.selectorChain?.length) {
      isPlayingRef.current = true;
      setIsPlaying(true);
      lastRecordedClickAutoRunRef.current = null;
      return;
    }

    if (beatHasCameraStep(beat)) {
      isPlayingRef.current = true;
      setIsPlaying(true);
      lastCameraAutoRunRef.current = null;
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
    shouldSkipBeat,
    isPlaying,
    isScripting,
    onScreenFramesBeat,
    runHomeScriptBeat,
    navigateBeatTab,
    scheduleDwellAdvance,
    screenPlayback,
    stopJourneyPlay,
  ]);

  const jumpToStart = useCallback(() => {
    const fromBeat = beats[beatIndexRef.current];
    suppressInitialBeatTabNavRef.current = false;
    stopJourneyPlay();
    clearCameraBeatUndo();
    beginRetreatSync();
    cancelDemoCursorJourneyEndFade();
    void parkDemoCursorAtRest({ reason: "jump-to-start" });
    runtime.closeAllPopups();
    runtime.closeAvailability();
    if (onScreenFramesBeat) {
      screenPlayback.jumpToStart();
    }
    resetJourney();
    // Prefer first playable beat; if it lacks protoTab, first beat that can land a tab.
    const firstBeat =
      beats.find((beat) => !shouldSkipBeat(beat)) ?? beats[0];
    const landBeat =
      firstBeat?.protoTab != null
        ? firstBeat
        : beats.find((beat) => !shouldSkipBeat(beat) && beat.protoTab != null) ??
          beats.find((beat) => beat.protoTab != null);
    if (landBeat) {
      const startIndex = beats.indexOf(
        firstBeat?.protoTab != null ? firstBeat : landBeat
      );
      if (startIndex >= 0) {
        setBeatIndex(startIndex);
        beatIndexRef.current = startIndex;
      }
      // Always navigate — closes hub even when already on start tab.
      navigateBeatTab(landBeat, { instant: true });
    }
    // Force host top after play-end / reset (shared scroll must not keep PDP mid).
    try {
      scrollCameraToOrigin(undefined, {
        force: true,
        instant: true,
        reason: "jump-to-start",
      });
    } catch {
      /* hang-safe */
    }
    const startScreenId = resolveStartScreenId(landBeat ?? firstBeat);
    playbackDiagJourneyReset({
      fromBeatId: fromBeat?.id,
      startBeatId: (landBeat ?? firstBeat)?.id,
      startScreenId,
      detail: `jump-to-start → beat ${(landBeat ?? firstBeat)?.id ?? "?"} screen ${startScreenId ?? "?"} (never hub)`,
    });
    playbackDiagBeat({
      phase: "enter",
      beatId: (landBeat ?? firstBeat)?.id,
      beatKind: (landBeat ?? firstBeat)?.kind,
      screenAfter: startScreenId,
      detail: `journey start beat ${(landBeat ?? firstBeat)?.id ?? "?"} screen ${startScreenId ?? "?"}`,
    });
  }, [
    beats,
    beginRetreatSync,
    navigateBeatTab,
    onScreenFramesBeat,
    resetJourney,
    resolveStartScreenId,
    runtime,
    screenPlayback,
    setBeatIndex,
    shouldSkipBeat,
    stopJourneyPlay,
  ]);
  jumpToStartRef.current = jumpToStart;

  const jumpToEnd = useCallback(() => {
    if (atPlaylistEndRef.current) return;
    suppressInitialBeatTabNavRef.current = false;
    stopJourneyPlay();
    const last = findLastPlayableBeatIndex(beats, shouldSkipBeat);
    if (last < 0) return;
    enteredBeatRef.current = null;
    setBeatIndex(last);
    beatIndexRef.current = last;
    const lastBeat = beats[last];
    if (isScreenFramesBeat(lastBeat) && screenBeatActive) {
      screenPlayback.jumpToEnd();
    }
  }, [beats, screenBeatActive, screenPlayback, setBeatIndex, shouldSkipBeat, stopJourneyPlay]);

  const resetToEnd = useCallback(() => {
    stopJourneyPlay();
    if (onScreenFramesBeat) {
      screenPlayback.resetToEnd();
    }
  }, [onScreenFramesBeat, screenPlayback, stopJourneyPlay]);

  const totalFrames = beats.length;
  const visibleCount = beats.length === 0 ? 0 : beatIndex + 1;
  const scriptingActive = isScriptingNow();
  const animationBusy =
    scriptingActive ||
    retreatSyncing ||
    playbackScrollBusy ||
    (onScreenFramesBeat && screenPlayback.isPausingBeforeReveal);

  const transportPlaying = onScreenFramesBeat
    ? screenPlayback.isPlaying
    : isPlaying || scriptingActive;

  /** Green diode + supervisors — live auto-play, scripts, retreat, camera, preludes. */
  const isOnAir =
    animationBusy ||
    (onScreenFramesBeat ? screenPlayback.isPlaying : isPlaying);

  const canAdvanceBeat =
    beatIndex < beats.length - 1 && advanceFrom(beatIndex) < beats.length;

  /** While on-air, only play/pause is interactive — no step/jump flicker between beats. */
  const canStepBack = isOnAir
    ? false
    : onScreenFramesBeat
      ? screenPlayback.canStepBack || beatIndex > 0
      : canRetreatJourneyTouchpoint(studioPlaylist, currentTouchpointKey) ||
        retreatFrom(beatIndex) >= 0;

  const canStepForward =
    atPlaylistEnd || isOnAir
      ? false
      : onScreenFramesBeat
        ? screenPlayback.canStepForward || canAdvanceBeat
        : canAdvanceBeat;

  const canPlay = atPlaylistEnd
    ? false
    : isOnAir ||
      transportPlaying ||
      (onScreenFramesBeat
        ? screenPlayback.canStepForward || canAdvanceBeat
        : canAdvanceBeat) ||
      onOverlayBeat ||
      Boolean(currentBeat?.bookScript) ||
      Boolean(currentBeat?.tabScript) ||
      Boolean(currentBeat?.recordedClick?.selectorChain?.length);

  const canJumpToStart = isOnAir ? false : canStepBack;
  const canJumpToEnd = atPlaylistEnd || isOnAir ? false : canStepForward;

  const isDirty = scenarioBrowseMode
    ? active && onScreenFramesBeat && screenPlayback.isDirty
    : active &&
      (beatIndex > 0 || (onScreenFramesBeat && screenPlayback.isDirty));

  return {
    totalFrames,
    visibleCount,
    isPlaying: onScreenFramesBeat ? screenPlayback.isPlaying : isPlaying,
    isOnAir,
    isScripting: scriptingActive,
    // Ref read (not state) — true while a beat-index advance has committed
    // but that beat's runBeatEnter (tab nav + landing prep) hasn't finished.
    // See beatEnterPendingRef above; consumed by usePlaybackTransportGuard to
    // suppress beat-tab-mismatch during the one-tick nav/dwell handoff.
    isBeatEnterPending: () => beatEnterPendingRef.current,
    retreatSyncing,
    transportStepToken,
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
