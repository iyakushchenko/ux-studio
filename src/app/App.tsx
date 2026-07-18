import {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
  useMemo,
} from "react";
import ProtoNavPanel from "@/app/nav/ProtoNavPanel";
import { ProtoNavScenarioControls } from "@/app/nav/ProtoNavScenarioControls";
import { ProtoNavJourneyMenu } from "@/app/nav/ProtoNavJourneyMenu";
import { ProtoNavStudioSelect } from "@/app/nav/ProtoNavStudioSelect";
import {
  resolveStudioTouchpoint,
  buildStudioTouchpointPlaylist,
  resolveStudioTouchpointProgress,
  resolveStudioTouchpointProgressForBeat,
  resolveStableChatScenarioPlaylistFrames,
} from "@/app/nav/resolveStudioTouchpoint";
import { useProtoScenarioPlayback, type PlaybackStepHooks } from "@/app/nav/useProtoScenarioPlayback";
import {
  orchestraShowControls,
  resolveActiveScreenScenario,
} from "@/app/orchestra/resolveActiveScreenScenario";
import {
  getJourneyForMode,
  resolveBeatIndexForScreenTab,
  resolveJourneyStartBeat,
} from "@/app/orchestra/journeyUtils";
import type { JourneyRuntime, ProtoJourneyDefinition, ProtoOrchestraModeId } from "@/app/orchestra/types";
import type { ProtoPersonaId, ProtoProjectId, ProtoProjectWireApi } from "@/projects/types";
import {
  cancelDemoCursorJourneyEndFade,
  removeDemoCursor,
  resetDemoCursorTravelOrigin,
  reviveDemoCursorAfterJourneyEndRetreat,
  scheduleDemoCursorJourneyEndFade,
  setDemoCursorJourneyMode,
} from "@/app/proto/protoDemoCursor";
import { useProtoJourneyPlayback } from "@/app/orchestra/useProtoJourneyPlayback";
import {
  createShouldSkipBeat,
  personaSelectOptions,
  projectSelectOptions,
  useProtoStudio,
} from "@/app/shell/useProtoStudio";
import { ProtoProjectPlaceholder } from "@/app/shell/ProtoProjectPlaceholder";
import { ProtoPlaybackShield } from "@/app/shell/ProtoPlaybackShield";
import { ProtoPlaybackDiagnosticOverlay } from "@/app/shell/ProtoPlaybackDiagnosticOverlay";
import type { PlaybackDiagnosticError } from "@/app/shell/protoPlaybackDiagnostic";
import {
  buildPlaybackStudioSnapshot,
  enrichPlaybackDiagnosticSnapshot,
  type PlaybackStudioSnapshot,
} from "@/app/shell/playbackStudioSnapshot";
import { useProtoPlaybackGuard } from "@/app/shell/useProtoPlaybackGuard";
import { useProtoPlaybackScrollGuard } from "@/app/shell/useProtoPlaybackScrollGuard";
import { useProtoPlaybackCursorGuard } from "@/app/shell/useProtoPlaybackCursorGuard";
import { useProtoPlaybackDirectorGuard } from "@/app/shell/useProtoPlaybackDirectorGuard";
import { useProtoPlaybackTransportGuard } from "@/app/shell/useProtoPlaybackTransportGuard";
import { useProtoPlaybackViewportGuard } from "@/app/shell/useProtoPlaybackViewportGuard";
import { playbackCursorMonitor } from "@/app/shell/protoPlaybackCursorMonitor";
import { playbackViewportMonitor } from "@/app/shell/protoPlaybackViewportMonitor";
import {
  readStoredHubOpen,
  readStoredNavIndex,
  storeHubOpen,
  storeNavIndex,
  protoNavStorageKey,
} from "@/app/shell/protoNavStorage";
import { getProjectWire } from "@/projects/registry";
import { useProtoNavTransition } from "@/app/shell/useProtoNavTransition";
import type { AvailOpenIntent } from "@/projects/boots-pharmacy/overlays/AvailabilityTool";
import {
  collectSitePilotChatScenarioFrames,
  ensureSitePilotChatComposerDock,
  isSitePilotChatAgentReplyFrame,
  SITE_PILOT_CHAT_PLAYBACK_THINK_MS,
  syncSitePilotChatComposerDock,
} from "@/projects/boots-pharmacy/dom/protoSitePilotChatScenario";
import {
  abortSitePilotChatPlaybackPrelude,
  runSitePilotChatBeforeReveal,
  runSitePilotChatScenarioFinale,
} from "@/projects/boots-pharmacy/playback/sitePilotChat";
import {
  isSitePilotChatPlaybackThinking,
  syncSitePilotChatThinkingHint,
} from "@/projects/boots-pharmacy/dom/protoSitePilotChatThinking";
import { isProtoHeaderLoggedIn } from "@/projects/boots-pharmacy/chrome/protoHeaderMount";
import { AVAIL_INTENT } from "@/projects/boots-pharmacy/wire/BootsPharmacyProjectView";

export default function App() {
  const studio = useProtoStudio();
  const {
    projects: studioProjects,
    projectId: studioProjectId,
    project: studioProject,
    content: projectContent,
    playback: projectPlayback,
    setProjectId: setStudioProjectId,
    persona: studioPersona,
    personaId: studioPersonaId,
    setPersonaId: setStudioPersonaId,
    modeId: orchestraModeId,
    setModeId: setOrchestraModeId,
    modes: orchestraModes,
    beatIndex: journeyBeatIndex,
    setBeatIndex: setJourneyBeatIndex,
    resetBeatIndex,
    journey: activeJourney,
  } = studio;

  const {
    PROTO_SCREENS: SCREENS,
    PROTO_HUB_LABEL,
    PROTO_SCENARIO_SCREENS,
    protoTabToIndex,
  } = projectContent;

  const [current, setCurrent] = useState(() =>
    readStoredNavIndex(studioProjectId, SCREENS.length)
  );
  const [hubOpen, setHubOpen] = useState(() => readStoredHubOpen(studioProjectId));
  const [wireTick, setWireTick] = useState(0);
  const [playbackDiagnostic, setPlaybackDiagnostic] =
    useState<PlaybackDiagnosticError | null>(null);
  const [studioJourneyMode, setStudioJourneyMode] = useState(false);
  const stopAllPlaybackRef = useRef<() => void>(() => {});
  const playbackSnapshotRef = useRef<PlaybackStudioSnapshot>({});
  const onWireApiChange = useCallback(() => setWireTick((t) => t + 1), []);

  const handlePlaybackDiagnostic = useCallback((error: PlaybackDiagnosticError) => {
    stopAllPlaybackRef.current();
    setPlaybackDiagnostic((prev) =>
      prev ?? enrichPlaybackDiagnosticSnapshot(error, playbackSnapshotRef.current)
    );
  }, []);

  const hubScrollElRef = useRef<HTMLDivElement>(null);
  const prototypeScrollElRef = useRef<HTMLDivElement>(null);
  const appContentRef = useRef<HTMLDivElement>(null);
  const tabsScrollRef = useRef<HTMLDivElement>(null);
  const tabBtnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const wireApiRef = useRef<ProtoProjectWireApi | null>(null);
  const goRef = useRef<(i: number) => void>(() => {});
  const currentRef = useRef(current);
  const navPlaybackLockedRef = useRef(false);
  const navTransportLockedRef = useRef(false);
  const runNavTransitionRef = useRef<
    (apply: () => void, options?: { instant?: boolean }) => void
  >((apply) => {
    apply();
  });
  const studioJourneyModeRef = useRef(false);
  const openAvailabilityToolRef = useRef<(intent?: AvailOpenIntent) => void>(() => {});
  const closeAvailabilityToolRef = useRef<() => void>(() => {});
  const screenFadeChildRef = useRef<number | null>(null);
  const journeyBeatIndexRef = useRef(journeyBeatIndex);
  const setJourneyBeatIndexRef = useRef(setJourneyBeatIndex);
  const activeJourneyRef = useRef(activeJourney);
  const scenarioIsPlayingRef = useRef(false);
  const resumeJourneyPlayRef = useRef<() => void>(() => {});

  currentRef.current = current;
  journeyBeatIndexRef.current = journeyBeatIndex;
  setJourneyBeatIndexRef.current = setJourneyBeatIndex;
  activeJourneyRef.current = activeJourney;

  const prevProjectIdRef = useRef(studioProjectId);
  useEffect(() => {
    if (prevProjectIdRef.current === studioProjectId) return;
    prevProjectIdRef.current = studioProjectId;
    setCurrent(readStoredNavIndex(studioProjectId, SCREENS.length));
    setHubOpen(readStoredHubOpen(studioProjectId));
    wireApiRef.current = null;
  }, [SCREENS.length, studioProjectId]);

  useEffect(() => {
    storeNavIndex(studioProjectId, current);
    storeHubOpen(studioProjectId, hubOpen);
  }, [current, hubOpen, studioProjectId]);

  const journeyRuntime = useMemo<JourneyRuntime>(
    () => ({
      goToTab: (screenIndex: number, options?: { instant?: boolean }) => {
        runNavTransitionRef.current(
          () => setCurrent(screenIndex),
          options?.instant ? { instant: true } : undefined
        );
      },
      openAvailability: (intent?: unknown) => {
        openAvailabilityToolRef.current(
          (intent as AvailOpenIntent | undefined) ?? AVAIL_INTENT.start
        );
      },
      closeAvailability: () => {
        closeAvailabilityToolRef.current();
      },
      closeAllPopups: () => {
        wireApiRef.current?.closeAllPopups();
      },
      applyDemoLocation: () => {
        wireApiRef.current?.applyDemoLocation();
      },
    }),
    []
  );

  const activeScreenScenario = useMemo(
    () =>
      resolveActiveScreenScenario({
        hubOpen,
        modeId: orchestraModeId,
        beatIndex: journeyBeatIndex,
        currentTabIndex: current,
        currentChildIndex: hubOpen ? null : (SCREENS[current]?.childIndex ?? null),
        browseMode: !studioJourneyMode,
        journeys: studioPersona.journeys,
        scenarioScreens: PROTO_SCENARIO_SCREENS,
        protoTabToIndex,
      }),
    [
      hubOpen,
      orchestraModeId,
      journeyBeatIndex,
      current,
      studioJourneyMode,
      studioPersona.journeys,
      PROTO_SCENARIO_SCREENS,
      protoTabToIndex,
      SCREENS,
    ]
  );

  const collectScenarioFrames = useCallback(() => {
    if (!activeScreenScenario) return [];
    const screen = document.querySelector(
      `.proto-viewport > div > div:nth-child(${activeScreenScenario.childIndex})`
    );
    if (!screen) return [];

    if (activeScreenScenario.id === "site-pilot-chat" && screen instanceof HTMLElement) {
      ensureSitePilotChatComposerDock(screen);
    }

    if (activeScreenScenario.id === "site-pilot-chat") {
      return collectSitePilotChatScenarioFrames(screen);
    }

    return [];
  }, [activeScreenScenario]);

  const sitePilotChatPlaybackHooks = useMemo<PlaybackStepHooks>(
    () => ({
      beforeReveal: runSitePilotChatBeforeReveal,
      revealScrollSmooth: (frame) => !isSitePilotChatAgentReplyFrame(frame),
      onPreludeAbort: abortSitePilotChatPlaybackPrelude,
      onFinale: async () => {
        const shouldContinueJourney = scenarioIsPlayingRef.current;
        await runSitePilotChatScenarioFinale(
          (intent) => openAvailabilityToolRef.current(intent),
          AVAIL_INTENT.dateChat
        );
        const journey = activeJourneyRef.current;
        const beat = journey?.beats[journeyBeatIndexRef.current];
        if (beat?.id === "agentic-chat") {
          setJourneyBeatIndexRef.current((index) => index + 1);
          if (shouldContinueJourney) {
            resumeJourneyPlayRef.current();
          }
        }
      },
      onLeaveFinale: () => closeAvailabilityToolRef.current(),
    }),
    []
  );

  const scenarioPlayback = useProtoScenarioPlayback({
    active: activeScreenScenario != null,
    collectFrames: collectScenarioFrames,
    screenSelector: activeScreenScenario
      ? `.proto-viewport > div > div:nth-child(${activeScreenScenario.childIndex})`
      : undefined,
    scrollRootRef: prototypeScrollElRef,
    minVisibleFrames: activeScreenScenario?.minVisibleFrames,
    playbackStepMs: activeScreenScenario?.playbackStepMs,
    playbackStepHooks:
      activeScreenScenario?.id === "site-pilot-chat" && studioJourneyMode
        ? sitePilotChatPlaybackHooks
        : undefined,
    browseMode: !studioJourneyMode,
    onDiagnostic: handlePlaybackDiagnostic,
  });

  const headerLoggedIn = useMemo(
    () =>
      (wireApiRef.current?.loggedInFlag ?? false) || isProtoHeaderLoggedIn(),
    [wireTick]
  );

  const shouldSkipBeat = useMemo(
    () => createShouldSkipBeat(studioPersona, headerLoggedIn),
    [studioPersona, headerLoggedIn]
  );

  const stableChatPlaylistFrames = resolveStableChatScenarioPlaylistFrames(
    "site-pilot-chat"
  );

  const wire = wireApiRef.current;

  const studioPlaylist = useMemo(
    () =>
      buildStudioTouchpointPlaylist(activeJourney, stableChatPlaylistFrames, {
        shouldSkipBeat,
        popupTouchpoints: studioProject.popupTouchpoints,
      }),
    [
      activeJourney,
      shouldSkipBeat,
      stableChatPlaylistFrames,
      studioProject.popupTouchpoints,
    ]
  );

  const studioTouchpoint = useMemo(() => {
    const childIdx = hubOpen ? null : SCREENS[current]?.childIndex;
    const beat = activeJourney?.beats[journeyBeatIndex];
    const popupOnScreen = (...allowed: number[]) =>
      childIdx != null && allowed.includes(childIdx);

    return resolveStudioTouchpoint({
      beatId: beat?.id,
      beatLabel: beat?.label,
      availabilityOpen: (wire?.availabilityOpen ?? false) && childIdx != null,
      availStep:
        wire?.availActiveStep ??
        ((wire?.availabilityOpen ?? false) ? wire?.availIntent.step ?? null : null),
      vaccinePickerOpen: (wire?.vaccinePickerOpen ?? false) && popupOnScreen(7, 4),
      recipientPickerOpen:
        (wire?.recipientPickerOpen ?? false) && popupOnScreen(7, 4),
      loginPopupOpen: (wire?.loginPopupOpen ?? false) && childIdx != null,
      quickViewOpen: (wire?.quickViewOpen ?? false) && popupOnScreen(9),
      chatFrameIndex:
        activeScreenScenario?.id === "site-pilot-chat" && studioJourneyMode
          ? scenarioPlayback.visibleCount
          : undefined,
      chatFrameTotal: stableChatPlaylistFrames,
      chatPausingBeforeReveal:
        activeScreenScenario?.id === "site-pilot-chat" && studioJourneyMode
          ? scenarioPlayback.isPausingBeforeReveal
          : undefined,
      chatPlaybackThinking:
        activeScreenScenario?.id === "site-pilot-chat" && studioJourneyMode
          ? isSitePilotChatPlaybackThinking()
          : undefined,
      bookConfirmationScreen: childIdx === 3,
    });
  }, [
    hubOpen,
    current,
    activeJourney,
    journeyBeatIndex,
    wire,
    activeScreenScenario?.id,
    scenarioPlayback.visibleCount,
    scenarioPlayback.isPausingBeforeReveal,
    stableChatPlaylistFrames,
    studioJourneyMode,
    SCREENS,
  ]);

  const journeyPlayback = useProtoJourneyPlayback({
    active: !hubOpen,
    journey: activeJourney,
    beatIndex: journeyBeatIndex,
    setBeatIndex: setJourneyBeatIndex,
    currentTabIndex: current,
    runtime: journeyRuntime,
    screenPlayback: scenarioPlayback,
    screenBeatActive: activeScreenScenario != null,
    shouldSkipBeat,
    playback: projectPlayback,
    protoTabToIndex,
    studioPlaylist,
    currentTouchpointKey: studioTouchpoint.key,
    onDiagnostic: handlePlaybackDiagnostic,
    scenarioBrowseMode: !studioJourneyMode,
  });

  useEffect(() => {
    stopAllPlaybackRef.current = () => {
      journeyPlayback.stopJourneyPlay();
      scenarioPlayback.abortPlayback();
    };
  }, [journeyPlayback, scenarioPlayback]);

  useEffect(() => {
    if (!playbackDiagnostic) return;
    stopAllPlaybackRef.current();
  }, [playbackDiagnostic]);

  scenarioIsPlayingRef.current = scenarioPlayback.isPlaying;
  resumeJourneyPlayRef.current = journeyPlayback.resumeJourneyPlay;

  const transport = journeyPlayback;
  const navTransportLocked = transport.isOnAir;
  const navBrowseLocked = navTransportLocked || studioJourneyMode;
  navPlaybackLockedRef.current = navBrowseLocked;
  navTransportLockedRef.current = navTransportLocked;
  studioJourneyModeRef.current = studioJourneyMode;

  useEffect(() => {
    setDemoCursorJourneyMode(studioJourneyMode, {
      parkAfterInteraction: studioJourneyMode && !transport.isPlaying,
    });
    if (!studioJourneyMode) {
      removeDemoCursor();
      resetDemoCursorTravelOrigin();
    }
  }, [studioJourneyMode, transport.isPlaying]);

  const { runNavTransition, navTransitionClass } = useProtoNavTransition();
  runNavTransitionRef.current = runNavTransition;
  /** Blocks wire clicks in journey mode or while transport scripts run. */
  const wireInteractionShield = studioJourneyMode || navTransportLocked;
  /** Not-allowed cursor only while cassette is actively playing/scripting. */
  const wirePlaybackCursorLocked = navTransportLocked;
  const studioProgress = useMemo(() => {
    const totalFrames = studioPlaylist.length;
    if (!studioJourneyMode) {
      return { visibleCount: 0, totalFrames };
    }

    const currentBeat = activeJourney?.beats[journeyBeatIndex];
    const touchpointProgress = resolveStudioTouchpointProgressForBeat(
      studioPlaylist,
      studioTouchpoint.key,
      currentBeat
    );
    let visibleCount = touchpointProgress.visibleCount;
    if (!hubOpen && activeJourney) {
      const screenBeatIndex = resolveBeatIndexForScreenTab(
        activeJourney,
        current,
        shouldSkipBeat
      );
      const screenBeat = activeJourney.beats[screenBeatIndex];
      if (screenBeat) {
        const screenProgress = resolveStudioTouchpointProgress(
          studioPlaylist,
          `beat:${screenBeat.id}`
        );
        visibleCount = Math.max(visibleCount, screenProgress.visibleCount);
      }
    }
    return {
      visibleCount: Math.min(visibleCount, totalFrames),
      totalFrames,
    };
  }, [
    activeJourney,
    current,
    hubOpen,
    journeyBeatIndex,
    shouldSkipBeat,
    studioJourneyMode,
    studioPlaylist,
    studioTouchpoint.key,
  ]);

  const journeyAtEnd =
    studioJourneyMode &&
    studioProgress.totalFrames > 0 &&
    studioProgress.visibleCount >= studioProgress.totalFrames;

  const journeyEndIdle = journeyAtEnd && !transport.isOnAir;
  const prevJourneyEndIdleRef = useRef(false);

  useEffect(() => {
    const wasEndIdle = prevJourneyEndIdleRef.current;
    prevJourneyEndIdleRef.current = journeyEndIdle;

    if (journeyEndIdle) {
      scheduleDemoCursorJourneyEndFade();
      return () => cancelDemoCursorJourneyEndFade();
    }

    cancelDemoCursorJourneyEndFade();
    if (wasEndIdle && studioJourneyMode) {
      reviveDemoCursorAfterJourneyEndRetreat();
    }
  }, [journeyEndIdle, studioJourneyMode]);

  const resetStudioPlayback = useCallback(() => {
    journeyPlayback.stopJourneyPlay();
    scenarioPlayback.jumpToStart();
    journeyPlayback.resetJourney();
    resetBeatIndex();
    setStudioJourneyMode(false);
    wireApiRef.current?.resetWireInteractionState();
    removeDemoCursor();
    resetDemoCursorTravelOrigin();
  }, [journeyPlayback, resetBeatIndex, scenarioPlayback]);

  const journeyBootSyncKeyRef = useRef<string | null>(null);

  const syncJourneyBeatToScreen = useCallback(
    (screenIndex: number) => {
      journeyPlayback.stopJourneyPlay();
      scenarioPlayback.cancelPreRevealPause();
      const onChatScreen = SCREENS[screenIndex]?.childIndex === 10;
      if (studioJourneyModeRef.current || !onChatScreen) {
        scenarioPlayback.jumpToStart();
      }
      setJourneyBeatIndex(
        resolveBeatIndexForScreenTab(activeJourney, screenIndex, shouldSkipBeat)
      );
    },
    [
      activeJourney,
      journeyPlayback,
      scenarioPlayback,
      setJourneyBeatIndex,
      shouldSkipBeat,
      SCREENS,
    ]
  );

  useEffect(() => {
    if (hubOpen || !activeJourney) return;
    const bootKey = `${studioProjectId}:${studioPersonaId}:${orchestraModeId}`;
    if (journeyBootSyncKeyRef.current === bootKey) return;
    journeyBootSyncKeyRef.current = bootKey;

    if (!studioJourneyModeRef.current && SCREENS[current]?.childIndex === 10) {
      setJourneyBeatIndex(
        resolveBeatIndexForScreenTab(activeJourney, current, shouldSkipBeat)
      );
      return;
    }

    scenarioPlayback.jumpToStart();
    setJourneyBeatIndex(
      resolveBeatIndexForScreenTab(activeJourney, current, shouldSkipBeat)
    );
  }, [
    hubOpen,
    activeJourney,
    studioProjectId,
    studioPersonaId,
    orchestraModeId,
    current,
    shouldSkipBeat,
    scenarioPlayback,
    setJourneyBeatIndex,
  ]);

  const applyJourneyStartTab = useCallback(
    (journey: ProtoJourneyDefinition | undefined) => {
      const { beatIndex: startIndex, beat } = resolveJourneyStartBeat(
        journey,
        shouldSkipBeat
      );
      setJourneyBeatIndex(startIndex);
      if (beat?.protoTab != null) {
        const tabIndex = protoTabToIndex(beat.protoTab);
        runNavTransitionRef.current(() => {
          setHubOpen(false);
          setCurrent(tabIndex);
          if (SCREENS[tabIndex]?.childIndex !== 10) {
            wireApiRef.current?.resetPrototypeScroll();
          }
        });
      }
    },
    [protoTabToIndex, setJourneyBeatIndex, shouldSkipBeat, SCREENS]
  );

  const restartStudioJourney = useCallback(() => {
    journeyPlayback.stopJourneyPlay();
    scenarioPlayback.cancelPreRevealPause();
    scenarioPlayback.jumpToStart();
    journeyPlayback.resetJourney();
    wireApiRef.current?.closeAllPopups();
    wireApiRef.current?.resetWireInteractionState();
    removeDemoCursor();
    resetDemoCursorTravelOrigin();
    applyJourneyStartTab(activeJourney);
  }, [
    activeJourney,
    applyJourneyStartTab,
    journeyPlayback,
    scenarioPlayback,
  ]);

  const handleStudioJourneyModeChange = useCallback(
    (enabled: boolean) => {
      if (enabled) {
        setHubOpen(false);
        setStudioJourneyMode(true);
        restartStudioJourney();
        return;
      }

      setStudioJourneyMode(false);
      journeyPlayback.stopJourneyPlay();
      scenarioPlayback.cancelPreRevealPause();
      if (SCREENS[current]?.childIndex === 10) {
        window.setTimeout(() => triggerChatBrowseRevealRef.current(), 0);
      }
    },
    [current, journeyPlayback, restartStudioJourney, scenarioPlayback, SCREENS]
  );

  const handleOrchestraModeChange = useCallback(
    (next: ProtoOrchestraModeId) => {
      resetStudioPlayback();

      if (next !== orchestraModeId) {
        setOrchestraModeId(next);
      }

      applyJourneyStartTab(getJourneyForMode(studioPersona.journeys, next));
    },
    [
      applyJourneyStartTab,
      orchestraModeId,
      resetStudioPlayback,
      setOrchestraModeId,
      studioPersona.journeys,
    ]
  );

  const handleStudioProjectChange = useCallback(
    (next: ProtoProjectId) => {
      if (next === studioProjectId) return;
      resetStudioPlayback();
      setStudioProjectId(next);
    },
    [resetStudioPlayback, setStudioProjectId, studioProjectId]
  );

  const handleStudioPersonaChange = useCallback(
    (next: ProtoPersonaId) => {
      if (next === studioPersonaId) return;
      resetStudioPlayback();
      setStudioPersonaId(next);
    },
    [resetStudioPlayback, setStudioPersonaId, studioPersonaId]
  );

  const showOrchestraControls = orchestraShowControls({
    hubOpen,
    modeId: orchestraModeId,
    journeys: studioPersona.journeys,
  });

  const resetToEndRef = useRef(scenarioPlayback.resetToEnd);
  resetToEndRef.current = scenarioPlayback.resetToEnd;
  const triggerChatBrowseRevealRef = useRef<() => void>(() => {});
  const chatBrowseRevealTimerRef = useRef<number | null>(null);
  const chatBrowseRevealGenerationRef = useRef(0);
  const retreatFromFinaleRef = useRef(scenarioPlayback.retreatFromFinale);
  retreatFromFinaleRef.current = scenarioPlayback.retreatFromFinale;
  const cancelPreRevealPauseRef = useRef(scenarioPlayback.cancelPreRevealPause);
  cancelPreRevealPauseRef.current = scenarioPlayback.cancelPreRevealPause;
  const scenarioVisibleCountRef = useRef(scenarioPlayback.visibleCount);
  scenarioVisibleCountRef.current = scenarioPlayback.visibleCount;
  const availabilityWasOpenRef = useRef(false);

  const runChatBrowseReveal = useCallback(() => {
    if (studioJourneyMode || hubOpen) return;
    if (SCREENS[current]?.childIndex !== 10) return;
    if (activeScreenScenario?.id !== "site-pilot-chat") return;

    const screen = document.querySelector<HTMLElement>(
      ".proto-viewport > div > div:nth-child(10)"
    );
    if (!screen) return;

    chatBrowseRevealGenerationRef.current += 1;
    const generation = chatBrowseRevealGenerationRef.current;

    if (chatBrowseRevealTimerRef.current != null) {
      window.clearTimeout(chatBrowseRevealTimerRef.current);
      chatBrowseRevealTimerRef.current = null;
    }

    ensureSitePilotChatComposerDock(screen);
    scenarioPlayback.cancelPreRevealPause();
    scenarioPlayback.jumpToStart();

    const summary = screen.querySelector<HTMLElement>(
      '[data-name="component.appointment.summary"]'
    );
    const firstFrame = summary?.querySelector<HTMLElement>(
      ":scope > *:not([data-proto-chat-thinking])"
    );
    syncSitePilotChatThinkingHint(screen, true, firstFrame ?? undefined);

    chatBrowseRevealTimerRef.current = window.setTimeout(() => {
      chatBrowseRevealTimerRef.current = null;
      if (chatBrowseRevealGenerationRef.current !== generation) return;
      syncSitePilotChatThinkingHint(null, false);
      resetToEndRef.current({ smooth: true, force: true });
      ensureSitePilotChatComposerDock(screen);
      syncSitePilotChatComposerDock(screen);
    }, SITE_PILOT_CHAT_PLAYBACK_THINK_MS);
  }, [
    activeScreenScenario?.id,
    current,
    hubOpen,
    scenarioPlayback,
    studioJourneyMode,
    SCREENS,
  ]);

  triggerChatBrowseRevealRef.current = runChatBrowseReveal;

  useEffect(() => {
    return () => {
      chatBrowseRevealGenerationRef.current += 1;
      if (chatBrowseRevealTimerRef.current != null) {
        window.clearTimeout(chatBrowseRevealTimerRef.current);
      }
      syncSitePilotChatThinkingHint(null, false);
    };
  }, []);

  useEffect(() => {
    if (studioJourneyMode || hubOpen) return;
    if (SCREENS[current]?.childIndex !== 10) return;
    if (activeScreenScenario?.id !== "site-pilot-chat") return;
    triggerChatBrowseRevealRef.current();
  }, [
    activeScreenScenario?.id,
    current,
    hubOpen,
    studioJourneyMode,
    SCREENS,
  ]);

  useEffect(() => {
    const wasOpen = availabilityWasOpenRef.current;
    availabilityWasOpenRef.current = wire?.availabilityOpen ?? false;

    if (
      wasOpen &&
      !(wire?.availabilityOpen ?? false) &&
      activeScreenScenario?.id === "site-pilot-chat" &&
      scenarioPlayback.visibleCount >= scenarioPlayback.totalFrames
    ) {
      retreatFromFinaleRef.current();
    }
  }, [
    wire?.availabilityOpen,
    activeScreenScenario?.id,
    scenarioPlayback.visibleCount,
    scenarioPlayback.totalFrames,
  ]);

  useEffect(() => {
    if (SCREENS[current]?.childIndex !== 10) return;
    if (activeScreenScenario?.id !== "site-pilot-chat") {
      syncSitePilotChatThinkingHint(null, false);
      return;
    }

    const screen = document.querySelector(
      ".proto-viewport > div > div:nth-child(10)"
    );
    const showHint =
      studioJourneyMode &&
      scenarioPlayback.visibleCount === 1 &&
      scenarioPlayback.totalFrames > 1 &&
      !scenarioPlayback.isPlaying &&
      !scenarioPlayback.isPausingBeforeReveal;
    syncSitePilotChatThinkingHint(screen, showHint);

    return () => syncSitePilotChatThinkingHint(null, false);
  }, [
    current,
    activeScreenScenario?.id,
    scenarioPlayback.visibleCount,
    scenarioPlayback.totalFrames,
    scenarioPlayback.isPlaying,
    scenarioPlayback.isPausingBeforeReveal,
    studioJourneyMode,
    SCREENS,
  ]);

  const currentBeat = activeJourney?.beats[journeyBeatIndex];

  playbackSnapshotRef.current = buildPlaybackStudioSnapshot({
    projectId: studioProjectId,
    personaId: studioPersonaId,
    orchestraModeId,
    journeyId: activeJourney?.id,
    beatIndex: journeyBeatIndex,
    beatCount: activeJourney?.beats.length ?? 0,
    currentBeat,
    currentTabIndex: current,
    childIndex: hubOpen ? null : (SCREENS[current]?.childIndex ?? null),
    touchpointKey: studioTouchpoint.key,
    touchpointLabel: studioTouchpoint.label,
    scenarioProgress: `${studioProgress.visibleCount}/${studioProgress.totalFrames}`,
    hubOpen,
    wire,
  });

  useProtoPlaybackGuard({
    snapshot: {
      isOnAir: transport.isOnAir,
      isScripting: transport.isScripting,
      isPausingBeforeReveal: scenarioPlayback.isPausingBeforeReveal,
      beatId: currentBeat?.id,
      beatLabel: currentBeat?.label,
      journeyId: activeJourney?.id,
      touchpointKey: studioTouchpoint.key,
      touchpointLabel: studioTouchpoint.label,
      visibleProgress: `${studioProgress.visibleCount}/${studioProgress.totalFrames}`,
      availabilityOpen: wire?.availabilityOpen,
      availStep: wire?.availActiveStep ?? wire?.availIntent?.step ?? null,
    },
    currentBeat,
    onDiagnostic: handlePlaybackDiagnostic,
  });

  useProtoPlaybackScrollGuard({
    snapshot: {
      isOnAir: transport.isOnAir,
      isPausingBeforeReveal: transport.isPausingBeforeReveal,
      journeyMode: studioJourneyMode,
      journeyAtEnd,
      childIndex: hubOpen ? null : (SCREENS[current]?.childIndex ?? null),
      protoTab: currentBeat?.protoTab ?? null,
      journeyId: activeJourney?.id,
      beatId: currentBeat?.id,
      beatLabel: currentBeat?.label,
      touchpointLabel: studioTouchpoint.label,
      visibleProgress: `${studioProgress.visibleCount}/${studioProgress.totalFrames}`,
    },
    currentBeat,
    scrollRootRef: prototypeScrollElRef,
    onDiagnostic: handlePlaybackDiagnostic,
  });

  useProtoPlaybackCursorGuard({
    snapshot: {
      active: !hubOpen,
      isOnAir: transport.isOnAir,
      isPausingBeforeReveal: transport.isPausingBeforeReveal,
      journeyMode: studioJourneyMode,
      childIndex: hubOpen ? null : (SCREENS[current]?.childIndex ?? null),
      journeyId: activeJourney?.id,
      beatId: currentBeat?.id,
      beatLabel: currentBeat?.label,
      touchpointLabel: studioTouchpoint.label,
      visibleProgress: `${studioProgress.visibleCount}/${studioProgress.totalFrames}`,
    },
    currentBeat,
    onDiagnostic: handlePlaybackDiagnostic,
  });

  useProtoPlaybackDirectorGuard({
    snapshot: {
      active: !hubOpen,
      journeyId: activeJourney?.id,
      beatId: currentBeat?.id,
      beatLabel: currentBeat?.label,
      touchpointLabel: studioTouchpoint.label,
      visibleProgress: `${studioProgress.visibleCount}/${studioProgress.totalFrames}`,
    },
    currentBeat,
    onDiagnostic: handlePlaybackDiagnostic,
  });

  useProtoPlaybackTransportGuard({
    snapshot: {
      active: !hubOpen,
      journeyMode: studioJourneyMode,
      isOnAir: transport.isOnAir,
      isScripting: transport.isScripting,
      journeyId: activeJourney?.id,
      beatId: currentBeat?.id,
      beatLabel: currentBeat?.label,
      touchpointKey: studioTouchpoint.key,
      touchpointLabel: studioTouchpoint.label,
      visibleProgress: `${studioProgress.visibleCount}/${studioProgress.totalFrames}`,
      playlist: studioPlaylist,
      transportStepToken: transport.transportStepToken,
    },
    currentBeat,
    onDiagnostic: handlePlaybackDiagnostic,
  });

  const screenFramesBeat =
    activeScreenScenario != null &&
    activeJourney?.beats[journeyBeatIndex]?.kind === "screen-frames";

  useProtoPlaybackViewportGuard({
    snapshot: {
      active: !hubOpen,
      isOnAir: transport.isOnAir,
      isPausingBeforeReveal: transport.isPausingBeforeReveal,
      screenFramesBeat,
      childIndex: hubOpen ? null : (SCREENS[current]?.childIndex ?? null),
      journeyId: activeJourney?.id,
      beatId: currentBeat?.id,
      beatLabel: currentBeat?.label,
      touchpointKey: studioTouchpoint.key,
      touchpointLabel: studioTouchpoint.label,
      visibleProgress: `${studioProgress.visibleCount}/${studioProgress.totalFrames}`,
      journeyBeats: activeJourney?.beats,
    },
    currentBeat,
    scrollRootRef: prototypeScrollElRef,
    onDiagnostic: handlePlaybackDiagnostic,
    checkRetreatViewportGoal: projectPlayback.checkRetreatViewportGoal,
  });

  useLayoutEffect(() => {
    const scrollEl = prototypeScrollElRef.current;
    const onChatScreen =
      SCREENS[current]?.childIndex === 10 &&
      activeScreenScenario?.id === "site-pilot-chat";
    const atFrameStart =
      onChatScreen && studioJourneyMode && scenarioPlayback.visibleCount <= 1;

    scrollEl?.classList.toggle("proto-chat-scenario-at-start", atFrameStart);

    const screen = document.querySelector<HTMLElement>(
      ".proto-viewport > div > div:nth-child(10)"
    );
    if (screen) {
      if (atFrameStart) screen.setAttribute("data-proto-scenario-at-start", "true");
      else screen.removeAttribute("data-proto-scenario-at-start");
      if (onChatScreen) {
        ensureSitePilotChatComposerDock(screen);
        syncSitePilotChatComposerDock(screen);
      }
    }

    if (atFrameStart && scrollEl) {
      scrollEl.scrollTop = 0;
      scrollEl.scrollLeft = 0;
    }

    return () => {
      scrollEl?.classList.remove("proto-chat-scenario-at-start");
      screen?.removeAttribute("data-proto-scenario-at-start");
    };
  }, [
    current,
    activeScreenScenario?.id,
    scenarioPlayback.visibleCount,
    studioJourneyMode,
    SCREENS,
  ]);

  const isProtoPristine =
    (wire?.wirePristine ?? true) && !transport.isDirty;

  const go = useCallback(
    (i: number) => {
      if (navPlaybackLockedRef.current || studioJourneyModeRef.current) return;
      const wasHub = hubOpen;
      const next = Math.max(0, Math.min(SCREENS.length - 1, i));
      if (!wasHub && next === current) return;

      runNavTransitionRef.current(() => {
        if (wasHub) wireApiRef.current?.saveHubScroll();
        wireApiRef.current?.closeAllPopups();
        syncJourneyBeatToScreen(next);
        setHubOpen(false);
        if (SCREENS[next]?.childIndex !== 10) {
          wireApiRef.current?.resetPrototypeScroll();
        }
        setCurrent(next);
      });
    },
    [current, hubOpen, SCREENS, syncJourneyBeatToScreen]
  );
  goRef.current = go;

  const openHub = useCallback(() => {
    runNavTransitionRef.current(() => {
      if (hubOpen) {
        wireApiRef.current?.saveHubScroll();
        setHubOpen(false);
        wireApiRef.current?.resetPrototypeScroll();
        return;
      }

      wireApiRef.current?.closeAllPopups();
      wireApiRef.current?.savePrototypeScroll();
      setHubOpen(true);
    });
  }, [hubOpen]);

  const resetPrototype = useCallback(() => {
    wireApiRef.current?.resetPrototype();
  }, []);

  const navLabel = hubOpen ? PROTO_HUB_LABEL : SCREENS[current]?.label ?? "";

  useEffect(() => {
    const el = tabsScrollRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (el.scrollWidth <= el.clientWidth + 1) return;
      const predominatelyVertical = Math.abs(e.deltaY) >= Math.abs(e.deltaX);
      const dx = predominatelyVertical ? e.deltaY : e.deltaX;
      if (dx === 0) return;
      const atStart = el.scrollLeft <= 0 && dx < 0;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1 && dx > 0;
      if (atStart || atEnd) return;
      e.preventDefault();
      el.scrollLeft += dx;
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  useEffect(() => {
    const btn = tabBtnRefs.current[current];
    const scroller = tabsScrollRef.current;
    if (!btn || !scroller) return;
    const btnLeft = btn.offsetLeft;
    const btnRight = btnLeft + btn.offsetWidth;
    const viewLeft = scroller.scrollLeft;
    const viewRight = viewLeft + scroller.clientWidth;
    const pad = 12;
    if (btnLeft < viewLeft + pad) {
      scroller.scrollTo({ left: Math.max(0, btnLeft - pad), behavior: "smooth" });
    } else if (btnRight > viewRight - pad) {
      scroller.scrollTo({
        left: btnRight - scroller.clientWidth + pad,
        behavior: "smooth",
      });
    }
  }, [current]);

  const transitionSetCurrent = useCallback((index: number) => {
    runNavTransitionRef.current(() => setCurrent(index));
  }, []);

  const bridge = useMemo(
    () => ({
      projectId: studioProjectId,
      current,
      setCurrent: transitionSetCurrent,
      hubOpen,
      setHubOpen,
      studio,
      journeyPlayback,
      scenarioPlayback,
      activeScreenScenarioId: activeScreenScenario?.id ?? null,
      showOrchestraControls,
      navPlaybackLocked: navBrowseLocked,
      prototypeScrollElRef,
      hubScrollElRef,
      appContentRef,
      tabsScrollRef,
      tabBtnRefs,
      onResetPrototype: resetPrototype,
      isProtoPristine,
      go,
      openHub,
      navPlaybackLockedRef,
      goRef,
      currentRef,
      protoNavKey: protoNavStorageKey(studioProjectId),
      onWireApiChange,
      studioJourneyMode,
      orchestra: {
        activeScreenScenario,
        scenarioPlayback,
        transport,
        journeyBeatIndexRef,
        setJourneyBeatIndexRef,
        activeJourneyRef,
        openAvailabilityToolRef,
        closeAvailabilityToolRef,
        screenFadeChildRef,
        resetToEndRef,
        triggerChatBrowseRevealRef,
        retreatFromFinaleRef,
        cancelPreRevealPauseRef,
        scenarioVisibleCountRef,
      },
    }),
    [
      studioProjectId,
      current,
      hubOpen,
      studio,
      journeyPlayback,
      scenarioPlayback,
      activeScreenScenario,
      showOrchestraControls,
      navBrowseLocked,
      navTransportLocked,
      studioJourneyMode,
      isProtoPristine,
      go,
      openHub,
      transitionSetCurrent,
      resetPrototype,
      onWireApiChange,
      transport,
    ]
  );

  const WireComponent = getProjectWire(studioProjectId);

  const projectStudioSelect = (
    <ProtoNavStudioSelect
      options={projectSelectOptions(studioProjects)}
      value={studioProjectId}
      onChange={handleStudioProjectChange}
      ariaLabel="Project"
      isPlaying={transport.isPlaying}
      controlsLocked={transport.isPausingBeforeReveal || studioJourneyMode}
    />
  );

  return (
    <div
      className="proto-app-root flex flex-col h-full max-h-[100dvh] overflow-hidden"
      style={{ fontFamily: "'Open Sans', sans-serif" }}
    >
      <ProtoPlaybackDiagnosticOverlay
        error={playbackDiagnostic}
        onDismiss={() => setPlaybackDiagnostic(null)}
      />

      <ProtoNavPanel
        screens={SCREENS}
        hubLabel={PROTO_HUB_LABEL}
        current={current}
        hubOpen={hubOpen}
        navLabel={navLabel}
        isProtoPristine={isProtoPristine}
        navBrowseLocked={navBrowseLocked}
        navResetLocked={navTransportLocked}
        journeyMode={studioJourneyMode}
        contentRef={appContentRef}
        tabsScrollRef={tabsScrollRef}
        tabBtnRefs={tabBtnRefs}
        onOpenHub={openHub}
        onGo={go}
        onReset={resetPrototype}
        scenarioControls={
          showOrchestraControls ? (
            <ProtoNavScenarioControls
              studioMenus={
                <div className="proto-nav-studio-menus">
                  {projectStudioSelect}
                  <ProtoNavStudioSelect
                    options={personaSelectOptions(studioProject)}
                    value={studioPersonaId}
                    onChange={handleStudioPersonaChange}
                    ariaLabel="Persona"
                    isPlaying={transport.isPlaying}
                    controlsLocked={transport.isPausingBeforeReveal || studioJourneyMode}
                  />
                  <ProtoNavJourneyMenu
                    modes={orchestraModes}
                    value={orchestraModeId}
                    onChange={handleOrchestraModeChange}
                    isPlaying={transport.isPlaying}
                    controlsLocked={transport.isPausingBeforeReveal || studioJourneyMode}
                  />
                </div>
              }
              segmentLabel={
                studioJourneyMode ? studioTouchpoint.label : undefined
              }
              visibleCount={studioProgress.visibleCount}
              totalFrames={studioProgress.totalFrames}
              stepProgressActive={studioJourneyMode}
              journeyMode={studioJourneyMode}
              onJourneyModeChange={handleStudioJourneyModeChange}
              journeyModeSwitchDisabled={navTransportLocked}
              isPlaying={transport.isPlaying}
              isOnAir={transport.isOnAir}
              journeyAtEnd={journeyAtEnd}
              playbackErrorActive={Boolean(playbackDiagnostic)}
              playbackEndToken={Math.max(
                journeyPlayback.playbackEndToken,
                scenarioPlayback.playbackEndToken
              )}
              canStepBack={transport.canStepBack}
              canStepForward={transport.canStepForward}
              canJumpToStart={transport.canJumpToStart}
              canPlay={transport.canPlay}
              canJumpToEnd={transport.canJumpToEnd}
              onJumpToStart={() => {
                playbackCursorMonitor.noteManualTransport("jump-to-start");
                playbackViewportMonitor.noteManualTransport("jump-to-start");
                transport.jumpToStart();
              }}
              onStepBack={() => {
                playbackCursorMonitor.noteManualTransport("step-back");
                playbackViewportMonitor.noteManualTransport("step-back");
                transport.stepBack();
              }}
              onPlay={() => {
                playbackCursorMonitor.noteManualTransport("play");
                playbackViewportMonitor.noteManualTransport("play");
                transport.play();
              }}
              onStepForward={() => {
                playbackCursorMonitor.noteManualTransport("step-forward");
                playbackViewportMonitor.noteManualTransport("step-forward");
                transport.stepForward();
              }}
              onJumpToEnd={() => {
                playbackCursorMonitor.noteManualTransport("jump-to-end");
                playbackViewportMonitor.noteManualTransport("jump-to-end");
                transport.jumpToEnd();
              }}
            />
          ) : (
            <div className="proto-nav-scenario">
              <div className="proto-nav-studio-menus">{projectStudioSelect}</div>
            </div>
          )
        }
      />

      <div
        className={`proto-wire-mount flex flex-1 min-h-0 min-w-0 flex-col relative${
          wirePlaybackCursorLocked ? " proto-wire-mount--playback-locked" : ""
        }${navTransitionClass}`}
      >
        {wireInteractionShield ? <ProtoPlaybackShield /> : null}
        {WireComponent ? (
          <WireComponent bridge={bridge} apiRef={wireApiRef} />
        ) : (
          <ProtoProjectPlaceholder projectLabel={studioProject.label} />
        )}
      </div>
    </div>
  );
}
