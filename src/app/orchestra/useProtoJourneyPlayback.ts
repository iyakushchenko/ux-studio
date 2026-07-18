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
} from "@/app/shell/protoPlaybackDiagnostic";
import {
  isScriptOk,
  isPlaybackAbortFailure,
  scriptFailureStep,
  type PlaybackScriptResult,
} from "@/projects/playbackScriptResult";
import { playbackDirectorMonitor } from "@/app/shell/protoPlaybackDirectorMonitor";
import {
  beatDirectorScriptLabel,
  isDwellLandingBeat,
  shouldChainManualDirectorStepOnAdvance,
} from "@/app/orchestra/journeyBeatDirector";
import { syncBeatRetreatState } from "@/app/orchestra/journeyRetreatSync";
import {
  canRetreatJourneyTouchpoint,
  lastPlayableBeatIndex as findLastPlayableBeatIndex,
  resolveJourneyRetreatTarget,
  stepBeatIndex,
} from "@/app/orchestra/journeyUtils";
import { resolveStudioTouchpointProgress } from "@/app/nav/resolveStudioTouchpoint";
import { isPlaybackScrollAnimating } from "@/app/proto/protoPlaybackScroll";
import {
  cancelDemoCursorJourneyEndFade,
  parkDemoCursorAtRest,
} from "@/app/proto/protoDemoCursor";
import type { JourneyBeat, JourneyRuntime, ProtoJourneyDefinition } from "@/app/orchestra/types";
import type { ProtoProjectPlayback } from "@/projects/types";
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
  /** Persona hook — omit beat from stepping/playback (e.g. skip login when logged in). */
  shouldSkipBeat?: (beat: JourneyBeat | undefined) => boolean;
  playback: ProtoProjectPlayback;
  protoTabToIndex: (tab: number) => number;
  studioPlaylist?: readonly StudioTouchpointEntry[];
  currentTouchpointKey?: string;
  onDiagnostic?: (error: PlaybackDiagnosticError) => void;
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

export function useProtoJourneyPlayback({
  active,
  journey,
  beatIndex,
  setBeatIndex,
  currentTabIndex,
  runtime,
  screenPlayback,
  screenBeatActive,
  shouldSkipBeat = () => false,
  playback,
  protoTabToIndex,
  studioPlaylist = [],
  currentTouchpointKey,
  onDiagnostic,
}: Options) {
  const beats = journey?.beats ?? [];
  const onDiagnosticRef = useRef(onDiagnostic);
  onDiagnosticRef.current = onDiagnostic;

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
  } | null>(null);
  const playTimerRef = useRef<number | null>(null);
  const beatIndexRef = useRef(beatIndex);
  const enteredBeatRef = useRef<string | null>(null);
  const screenBeatReadyRef = useRef<string | null>(null);
  const lastAvailAutoRunRef = useRef<string | null>(null);
  const lastBookAutoRunRef = useRef<string | null>(null);
  const lastTabAutoRunRef = useRef<string | null>(null);
  const lastHomeAutoRunRef = useRef<string | null>(null);
  const isPlayingRef = useRef(false);
  /** Skip beat-enter tab nav on first mount so sessionStorage tab is preserved. */
  const suppressInitialBeatTabNavRef = useRef(true);
  /** Dwell handoff runs the next director step — skip beat-enter sync for that beat. */
  const suppressBeatEnterSyncRef = useRef(false);
  /** CJM step-back — snap DOM/scroll on beat enter, director script runs on step forward. */
  const retreatSyncRef = useRef(false);
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

  const abortActiveScripts = useCallback(() => {
    playback.abortAll();
    stopScrollPoll();
    setPlaybackScrollBusy(false);
    setScriptingActive(false);
    lastAvailAutoRunRef.current = null;
    lastBookAutoRunRef.current = null;
    lastTabAutoRunRef.current = null;
    lastHomeAutoRunRef.current = null;
  }, [playback, setScriptingActive, stopScrollPoll]);

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

  const completeJourneyPlay = useCallback(() => {
    setPlaybackEndToken((token) => token + 1);
    stopJourneyPlay();
  }, [stopJourneyPlay]);

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
          const tabIndex = protoTabToIndex(nextBeat.protoTab);
          if (currentTabIndexRef.current !== tabIndex) {
            runtime.goToTab(tabIndex);
          }
        }
        playbackDirectorMonitor.noteDirectorScriptStarted(nextBeat.id);
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
        if (wasBookPlaybackAborted() || wasTraditionalPlaybackAborted()) {
          lastBookAutoRunRef.current = null;
          lastTabAutoRunRef.current = null;
          return false;
        }
        if (nextBeat.bookScript) {
          lastBookAutoRunRef.current = `${beatIndexRef.current}:${nextBeat.id}`;
        } else if (nextBeat.tabScript) {
          lastTabAutoRunRef.current = `${beatIndexRef.current}:${nextBeat.id}`;
        }
        return true;
      } finally {
        suppressBeatEnterSyncRef.current = false;
      }
    },
    [invokeBeatScript, playback, protoTabToIndex, reportScriptFailure, runtime, setScriptingActive]
  );

  const advanceFromCompletedDirectorBeat = useCallback(
    async (
      beat: JourneyBeat,
      options?: { manualStep?: boolean }
    ): Promise<boolean> => {
      setScriptingActive(true);
      enteredBeatRef.current = null;
      const next = advanceFrom(beatIndexRef.current);
      if (next >= beats.length) {
        setScriptingActive(false);
        return true;
      }
      const nextBeat = beats[next];
      setBeatIndex(next);
      beatIndexRef.current = next;
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
    [advanceFrom, beats, runChainedManualDirectorBeat, setBeatIndex, setScriptingActive]
  );

  const runHomeScriptBeat = useCallback(
    async (beat: JourneyBeat, options?: { skip?: boolean }) => {
      if (!beat.homeScript) return false;
      const runId = ++homeScriptRunRef.current;
      setScriptingActive(true);
      try {
        const { ok, failureStep, diagnosticSent } = await invokeBeatScript(
          beat.homeScript,
          () => playback.runHomeScript(beat.homeScript!, options),
          options
        );
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
        setBeatIndex(next);
        beatIndexRef.current = next;
        return true;
      } finally {
        if (runId === homeScriptRunRef.current) {
          setScriptingActive(false);
        }
      }
    },
    [advanceFrom, beats.length, invokeBeatScript, playback, reportScriptFailure, setBeatIndex, setScriptingActive]
  );

  const runAvailScriptBeat = useCallback(
    async (
      beat: JourneyBeat,
      advanceAfter: boolean,
      options?: { skip?: boolean; manualStep?: boolean }
    ) => {
      if (!beat.availScript) return false;
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
      if (!beat.bookScript) return false;
      const runId = `${beatIndexRef.current}:${beat.id}`;
      if (
        options?.manualStep &&
        lastBookAutoRunRef.current === runId &&
        advanceAfter
      ) {
        setScriptingActive(true);
        return advanceFromCompletedDirectorBeat(beat, options);
      }
      playbackDirectorMonitor.noteDirectorScriptStarted(beat.id);
      setScriptingActive(true);
      try {
        const { ok, failureStep, diagnosticSent } = await invokeBeatScript(
          beat.bookScript,
          () => playback.runBookScript(beat.bookScript!, options),
          options
        );
        playbackDirectorMonitor.noteDirectorScriptFinished(beat.id, ok);
        if (!ok) {
          lastBookAutoRunRef.current = null;
          if (!options?.skip && !diagnosticSent) {
            reportScriptFailure(beat, { failureStep });
          }
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
        const nextBeat = beats[next];
        setBeatIndex(next);
        beatIndexRef.current = next;
        if (
          options?.manualStep &&
          shouldChainManualDirectorStepOnAdvance(beat, nextBeat)
        ) {
          return await runChainedManualDirectorBeat(beat, nextBeat);
        }
        return true;
      } finally {
        setScriptingActive(false);
      }
    },
    [
      advanceFrom,
      beats,
      invokeBeatScript,
      playback,
      reportScriptFailure,
      runChainedManualDirectorBeat,
      setBeatIndex,
      advanceFromCompletedDirectorBeat,
      setScriptingActive,
    ]
  );

  const runTabScriptBeat = useCallback(
    async (beat: JourneyBeat, options?: { skip?: boolean; manualStep?: boolean }) => {
      if (!beat.tabScript) return false;
      const runId = `${beatIndexRef.current}:${beat.id}`;
      if (options?.manualStep && lastTabAutoRunRef.current === runId) {
        setScriptingActive(true);
        return advanceFromCompletedDirectorBeat(beat, options);
      }
      setScriptingActive(true);
      try {
        const { ok, failureStep, diagnosticSent } = await invokeBeatScript(
          beat.tabScript,
          () => playback.runTabScript(beat.tabScript!, runtime, options),
          options
        );
        if (!ok) {
          lastTabAutoRunRef.current = null;
          if (!options?.skip && !diagnosticSent) {
            reportScriptFailure(beat, { failureStep });
          }
          return false;
        }
        if (wasTraditionalPlaybackAborted() && !options?.skip) {
          lastTabAutoRunRef.current = null;
          return false;
        }
        lastTabAutoRunRef.current = runId;
        enteredBeatRef.current = null;
        const next = advanceFrom(beatIndexRef.current);
        if (next >= beats.length) return true;
        const nextBeat = beats[next];
        setBeatIndex(next);
        beatIndexRef.current = next;
        if (
          options?.manualStep &&
          shouldChainManualDirectorStepOnAdvance(beat, nextBeat)
        ) {
          return await runChainedManualDirectorBeat(beat, nextBeat);
        }
        return true;
      } finally {
        setScriptingActive(false);
      }
    },
    [
      advanceFrom,
      beats,
      invokeBeatScript,
      playback,
      reportScriptFailure,
      runChainedManualDirectorBeat,
      runtime,
      setBeatIndex,
      advanceFromCompletedDirectorBeat,
      setScriptingActive,
    ]
  );

  useEffect(() => {
    transportStepAttemptRef.current = null;
  }, [beatIndex]);

  useEffect(() => {
    const attempt = transportStepAttemptRef.current;
    if (!active || !attempt || transportStepToken === 0) return;

    const timer = window.setTimeout(() => {
      if (!transportStepAttemptRef.current) return;
      if (transportStepAttemptRef.current.beatIndex !== beatIndexRef.current) {
        transportStepAttemptRef.current = null;
        return;
      }
      if (isScriptingNow()) return;
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
    }, TRANSPORT_STEP_NO_OP_MS);

    return () => window.clearTimeout(timer);
  }, [active, beatIndex, beats, isScripting, journey?.id, transportStepToken]);

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
      void runBookScriptBeat(beat, true, { skip: true });
    }
  }, [abortActiveScripts, beats, runAvailScriptBeat, runBookScriptBeat, runHomeScriptBeat, runTabScriptBeat]);

  const navigateBeatTab = useCallback(
    (beat: JourneyBeat | undefined, options?: { instant?: boolean }) => {
      if (beat?.protoTab == null) return;
      const tabIndex = protoTabToIndex(beat.protoTab);
      if (currentTabIndexRef.current !== tabIndex) {
        runtime.goToTab(tabIndex, options);
      }
    },
    [protoTabToIndex, runtime]
  );

  const runBeatEnter = useCallback(
    async (beat: JourneyBeat) => {
      if (!suppressInitialBeatTabNavRef.current) {
        navigateBeatTab(beat);
      }
      if (beat.onEnter) {
        playback.runBeatAction(beat.onEnter, runtime);
      }
    },
    [navigateBeatTab, playback, runtime]
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
    void runBeatEnter(currentBeat);
    if (retreatSyncRef.current) {
      void syncBeatRetreatState(playback, currentBeat, runtime, {
        instant: true,
      }).finally(() => {
        retreatSyncRef.current = false;
      });
    } else if (
      currentBeat.bookScript &&
      !isPlayingRef.current &&
      !suppressBeatEnterSyncRef.current
    ) {
      void playback.runBookScript(currentBeat.bookScript, {
        skip: true,
        syncState: true,
        instant: false,
      });
    }
    suppressInitialBeatTabNavRef.current = false;
  }, [active, currentBeat, playback, runBeatEnter, runtime]);

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
    if (screenPlayback.totalFrames === 0) return;

    const readyKey = `${beatIndex}:${currentBeat.id}`;
    if (screenBeatReadyRef.current !== readyKey) {
      screenBeatReadyRef.current = readyKey;
      screenPlayback.jumpToStart();
    }

    if (isPlayingRef.current && !screenPlayback.isPlaying) {
      screenPlayback.play();
    }
  }, [
    active,
    beatIndex,
    currentBeat,
    onScreenFramesBeat,
    screenPlayback,
    screenPlayback.totalFrames,
    screenPlayback.isPlaying,
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
      return false;
    },
    [
      runAvailScriptBeat,
      runBookScriptBeat,
      runHomeScriptBeat,
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
      setBeatIndex(next);
      beatIndexRef.current = next;

      const scriptLabel = beatDirectorScriptLabel(nextBeat);
      if (scriptLabel) {
        suppressBeatEnterSyncRef.current = true;
        playbackDirectorMonitor.scheduleDirectorHandoff({
          fromBeatId: landingBeat.id,
          toBeatId: nextBeat.id,
          scriptLabel,
        });
        void runDirectorBeat(nextBeat, false).finally(() => {
          suppressBeatEnterSyncRef.current = false;
          playbackDirectorMonitor.clearDirectorHandoff(nextBeat.id);
        });
      }

      return true;
    },
    [advanceFrom, beats, runDirectorBeat, setBeatIndex]
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
    if (
      fromBeat?.protoTab != null &&
      sameTabRetreatBeat?.protoTab === fromBeat.protoTab &&
      sameTabRetreatIndex >= 0 &&
      sameTabRetreatIndex !== currentIndex
    ) {
      prev = sameTabRetreatIndex;
      prevBeat = sameTabRetreatBeat;
    } else if (playlistTarget?.kind === "beat") {
      prev = playlistTarget.beatIndex;
      prevBeat = playlistTarget.beat;
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

    runtime.closeAllPopups();
    runtime.closeAvailability();

    retreatSyncRef.current = true;
    cancelDemoCursorJourneyEndFade();
    void parkDemoCursorAtRest({ animate: false });

    setBeatIndex(prev);
    beatIndexRef.current = prev;

    if (prevBeat) {
      suppressInitialBeatTabNavRef.current = false;
      navigateBeatTab(prevBeat, { instant: true });
    }

    return true;
  }, [
    beats,
    currentTouchpointKey,
    navigateBeatTab,
    retreatFrom,
    runtime,
    setBeatIndex,
    shouldSkipBeat,
    studioPlaylist,
  ]);

  const noteManualDirectorStep = useCallback((beat: JourneyBeat | undefined) => {
    const scriptLabel = beatDirectorScriptLabel(beat);
    if (!beat || !scriptLabel) return;
    playbackDirectorMonitor.noteManualDirectorStepExpected(beat.id, scriptLabel);
  }, []);

  const stepForward = useCallback(() => {
    if (atPlaylistEndRef.current) return;
    suppressInitialBeatTabNavRef.current = false;
    transportStepAttemptRef.current = {
      beatIndex: beatIndexRef.current,
      beatId: beats[beatIndexRef.current]?.id,
    };
    setTransportStepToken((token) => token + 1);
    if (isScriptingNow()) {
      // Keep isPlaying so chat (and other beats) resume after the skip completes.
      abortActiveScripts();
      skipActiveScriptingBeat();
      return;
    }
    stopAutoPlayOnly();
    if (onScreenFramesBeat && screenPlayback.canStepForward) {
      screenPlayback.stepForward();
      return;
    }
    if (onScreenFramesBeat && !screenPlayback.canStepForward) {
      advanceBeat();
      return;
    }
    if (currentBeat?.homeScript) {
      setScriptingActive(true);
      noteManualDirectorStep(currentBeat);
      void runHomeScriptBeat(currentBeat);
      return;
    }
    if (currentBeat?.tabScript) {
      setScriptingActive(true);
      noteManualDirectorStep(currentBeat);
      void runTabScriptBeat(currentBeat, { manualStep: true });
      return;
    }
    if (currentBeat?.availScript) {
      setScriptingActive(true);
      noteManualDirectorStep(currentBeat);
      void runAvailScriptBeat(currentBeat, true, { manualStep: true });
      return;
    }
    if (currentBeat?.bookScript) {
      setScriptingActive(true);
      noteManualDirectorStep(currentBeat);
      void runBookScriptBeat(currentBeat, true, { manualStep: true });
      return;
    }
    if (isDwellLandingBeat(currentBeat)) {
      advanceFromDwellLanding(currentBeat);
      return;
    }
    advanceBeat();
  }, [
    advanceBeat,
    advanceFromDwellLanding,
    beats,
    currentBeat,
    abortActiveScripts,
    isScripting,
    noteManualDirectorStep,
    onScreenFramesBeat,
    runAvailScriptBeat,
    runBookScriptBeat,
    runHomeScriptBeat,
    runTabScriptBeat,
    screenPlayback,
    setScriptingActive,
    skipActiveScriptingBeat,
    stopAutoPlayOnly,
    stopJourneyPlay,
  ]);

  const stepBack = useCallback(() => {
    suppressInitialBeatTabNavRef.current = false;
    if (isScriptingNow()) return;
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

    if (beatIndexRef.current >= findLastPlayableBeatIndex(beats, shouldSkipBeat)) return;

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
    suppressInitialBeatTabNavRef.current = false;
    stopJourneyPlay();
    retreatSyncRef.current = true;
    cancelDemoCursorJourneyEndFade();
    void parkDemoCursorAtRest({ animate: false });
    if (onScreenFramesBeat) {
      screenPlayback.jumpToStart();
    }
    resetJourney();
  }, [onScreenFramesBeat, resetJourney, screenPlayback, stopJourneyPlay]);

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
    playbackScrollBusy ||
    (onScreenFramesBeat && screenPlayback.isPausingBeforeReveal);

  const transportPlaying = onScreenFramesBeat
    ? screenPlayback.isPlaying
    : isPlaying || scriptingActive;

  /** Green diode + supervisors — live auto-play and manual step scripts / preludes. */
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
      Boolean(currentBeat?.tabScript);

  const canJumpToStart = isOnAir ? false : canStepBack;
  const canJumpToEnd = atPlaylistEnd || isOnAir ? false : canStepForward;

  const isDirty =
    active &&
    (beatIndex > 0 || (onScreenFramesBeat && screenPlayback.isDirty));

  return {
    totalFrames,
    visibleCount,
    isPlaying: onScreenFramesBeat ? screenPlayback.isPlaying : isPlaying,
    isOnAir,
    isScripting: scriptingActive,
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
