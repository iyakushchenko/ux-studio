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
  notePlaybackBeatEnter,
  notePlaybackDirectorScript,
} from "@/app/shell/protoPlaybackInteractionContext";
import {
  beatDirectorScriptLabel,
  isDwellLandingBeat,
  shouldChainManualDirectorStepOnAdvance,
} from "@/app/orchestra/journeyBeatDirector";
import {
  shouldAdvanceCompletedDirectorStep,
  shouldSuppressTransportNoOpForBeat,
} from "@/app/orchestra/manualDirectorStep";
import { syncBeatRetreatState } from "@/app/orchestra/journeyRetreatSync";
import {
  canRetreatJourneyTouchpoint,
  lastPlayableBeatIndex as findLastPlayableBeatIndex,
  resolveJourneyRetreatTarget,
  stepBeatIndex,
} from "@/app/orchestra/journeyUtils";
import { resolveStudioTouchpointProgress } from "@/app/nav/resolveStudioTouchpoint";
import { isPlaybackScrollAnimating } from "@/app/proto/protoPlaybackScroll";
import { playbackScrollMonitor } from "@/app/shell/protoPlaybackScrollMonitor";
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
  resetToEnd: (options?: { smooth?: boolean; force?: boolean }) => void;
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
  /** CJM off — screen-frames beats show full scenario content, not frame 1. */
  scenarioBrowseMode?: boolean;
  /** Called after CJM step-back lands on a screen-frames beat (before scenario re-init). */
  onScreenFramesRetreatEnd?: () => void;
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
  scenarioBrowseMode = false,
  onScreenFramesRetreatEnd,
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
  const isPlayingRef = useRef(false);
  /** Skip beat-enter tab nav on first mount so sessionStorage tab is preserved. */
  const suppressInitialBeatTabNavRef = useRef(true);
  /** Dwell handoff runs the next director step — skip beat-enter sync for that beat. */
  const suppressBeatEnterSyncRef = useRef(false);
  /** CJM step-back — snap DOM/scroll on beat enter, director script runs on step forward. */
  const retreatSyncRef = useRef(false);
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
          const tabIndex = protoTabToIndex(nextBeat.protoTab);
          if (currentTabIndexRef.current !== tabIndex) {
            runtime.goToTab(tabIndex);
          }
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
      noteDirectorScriptInteraction(beat, options);
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
      noteDirectorScriptInteraction(beat, options);
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
  }, [beatIndex, screenPlayback.visibleCount]);

  useEffect(() => {
    const attempt = transportStepAttemptRef.current;
    if (!active || !attempt || transportStepToken === 0) return;

    const timer = window.setTimeout(() => {
      if (!transportStepAttemptRef.current) return;
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
      if (isScriptingNow()) return;
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
    }, TRANSPORT_STEP_NO_OP_MS);

    return () => window.clearTimeout(timer);
  }, [
    active,
    beatIndex,
    beats,
    isScripting,
    journey?.id,
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
        notePlaybackBeatEnter(beat.onEnter, beat.id);
        playback.runBeatAction(beat.onEnter, runtime);
      }
    },
    [navigateBeatTab, playback, runtime]
  );

  const scheduleDwellAdvance = useCallback(() => {
    if (playTimerRef.current != null) {
      window.clearTimeout(playTimerRef.current);
      playTimerRef.current = null;
    }
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
    if (!retreatSyncRef.current) {
      void runBeatEnter(currentBeat);
    }
    if (retreatSyncRef.current) {
      void syncBeatRetreatState(playback, currentBeat, runtime, {
        instant: true,
      }).finally(() => {
        suppressInitialBeatTabNavRef.current = false;
        navigateBeatTab(currentBeat, { instant: true });
        if (isScreenFramesBeat(currentBeat)) {
          onScreenFramesRetreatEndRef.current?.();
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              playbackScrollMonitor.noteRetreatSync();
              screenPlayback.resetToEnd({ smooth: false, force: true });
            });
          });
        }
        retreatSyncRef.current = false;
      });
    } else if (
      currentBeat.bookScript &&
      !isPlayingRef.current &&
      !suppressBeatEnterSyncRef.current
    ) {
      noteDirectorScriptInteraction(currentBeat, { syncState: true });
      void playback.runBookScript(currentBeat.bookScript, {
        skip: true,
        syncState: true,
        instant: false,
      });
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
  }, [active, currentBeat, isPlaying, navigateBeatTab, playback, runBeatEnter, runtime, screenPlayback]);

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
    if (scenarioBrowseMode) {
      screenBeatReadyRef.current = readyKey;
    } else if (screenBeatReadyRef.current !== readyKey) {
      screenBeatReadyRef.current = readyKey;
      const scheduleJumpToStart = () => {
        if (
          currentBeat.protoTab != null &&
          currentTabIndexRef.current !== protoTabToIndex(currentBeat.protoTab)
        ) {
          requestAnimationFrame(scheduleJumpToStart);
          return;
        }
        screenPlayback.jumpToStart();
      };
      scheduleJumpToStart();
    }

    let outerHandoffRaf = 0;
    let innerHandoffRaf = 0;
    if (
      !scenarioBrowseMode &&
      pendingManualScreenHandoffRef.current === currentBeat.id
    ) {
      pendingManualScreenHandoffRef.current = null;
      outerHandoffRaf = requestAnimationFrame(() => {
        innerHandoffRaf = requestAnimationFrame(() => {
          if (beatIndexRef.current !== beatIndex) return;
          if (screenPlayback.canStepForward) {
            screenPlayback.stepForward();
          }
        });
      });
    }

    if (isPlayingRef.current && !screenPlayback.isPlaying) {
      screenPlayback.play();
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
    protoTabToIndex,
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
    suppressInitialBeatTabNavRef.current = false;
    transportStepAttemptRef.current = {
      beatIndex: beatIndexRef.current,
      beatId: beats[beatIndexRef.current]?.id,
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
      skipActiveScriptingBeat();
      return;
    }
    stopAutoPlayOnly();
    if (onScreenFramesBeat) {
      stepScenarioFrameForward();
      return;
    }
    if (currentBeat?.homeScript) {
      setScriptingActive(true);
      noteManualDirectorStep(currentBeat);
      void runHomeScriptBeat(currentBeat, { chainScreenFrames: true });
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
    stepScenarioFrameForward,
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
