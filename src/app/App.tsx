import {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
  useMemo,
} from "react";
import StudioNavPanel from "@/app/nav/StudioNavPanel";
import { StudioNavScenarioControls } from "@/app/nav/StudioNavScenarioControls";
import {
  StudioNavRecordingControls,
  StudioNavRecordingModeSlot,
} from "@/app/nav/StudioNavRecordingControls";
import { StudioNavJourneyMenu } from "@/app/nav/StudioNavJourneyMenu";
import { StudioNavStudioSelect } from "@/app/nav/StudioNavStudioSelect";
import {
  resolveStudioTouchpoint,
  buildStudioTouchpointPlaylist,
  resolveStudioTouchpointProgress,
  resolveStudioTouchpointProgressForBeat,
  resolveStableChatScenarioPlaylistFrames,
} from "@/app/nav/resolveStudioTouchpoint";
import { useScenarioPlayback, type PlaybackStepHooks } from "@/app/nav/useScenarioPlayback";
import {
  orchestraShowControls,
  resolveActiveScreenScenario,
} from "@/app/orchestra/resolveActiveScreenScenario";
import {
  getJourneyForMode,
  resolveBeatIndexForScreenTab,
  resolveJourneyStartBeat,
} from "@/app/orchestra/journeyUtils";
import type {
  JourneyRuntime,
  JourneyDefinition,
  OrchestraModeId,
} from "@/app/orchestra/types";
import type { PersonaId, ProjectId, ProjectWireApi } from "@/projects/types";
import {
  cancelDemoCursorJourneyEndFade,
  removeDemoCursor,
  resetDemoCursorTravelOrigin,
  reviveDemoCursorAfterJourneyEndRetreat,
  scheduleDemoCursorJourneyEndFade,
  setDemoCursorJourneyMode,
} from "@/app/scenario/demoCursor";
import { cancelPlaybackScroll } from "@/app/scenario/playbackScroll";
import { useJourneyPlayback } from "@/app/orchestra/useJourneyPlayback";
import {
  createShouldSkipBeat,
  personaSelectOptions,
  projectSelectOptions,
  useStudio,
} from "@/app/shell/useStudio";
import { ProjectPlaceholder } from "@/app/shell/ProjectPlaceholder";
import { PlaybackShield } from "@/app/shell/PlaybackShield";
import { PlaybackDiagnosticOverlay } from "@/app/shell/PlaybackDiagnosticOverlay";
import type { PlaybackDiagnosticError } from "@/app/shell/playbackDiagnostic";
import {
  attachPlaybackInteractionToDiagnostic,
  buildPlaybackStudioSnapshot,
  enrichPlaybackDiagnosticSnapshot,
  type PlaybackStudioSnapshot,
} from "@/app/shell/playbackStudioSnapshot";
import { notePlaybackTransport } from "@/app/shell/playbackInteractionContext";
import {
  disableCursorQaEyes,
  resetPlaybackCursorDiagnosticContext,
} from "@/app/shell/playbackCursorDiagnostic";
import {
  recordPlaybackDiagnosticDismiss,
  recordPlaybackDiagnosticOpen,
} from "@/app/shell/playbackDiagnosticFlash";
import {
  logControlPanel,
  registerControlPanelSnapshotProvider,
} from "@/app/shell/controlPanelLog";
import { registerStudioMcpHelpers } from "@/app/shell/studioMcpHelpers";
import {
  captureTouchpointChange,
  registerRecordingSnapshotProvider,
} from "@/app/recording/recordingCapture";
import { replayRecordingSession } from "@/app/recording/recordingReplay";
import { useRecordingReplayBridge } from "@/app/recording/useRecordingReplayBridge";
import { registerJourneyMcpHelpers } from "@/app/journey/journeyMcpHelpers";
import { summarizeJourney } from "@/app/journey/journeyFile";
import { usePlaybackGuard } from "@/app/shell/usePlaybackGuard";
import { usePlaybackScrollGuard } from "@/app/shell/usePlaybackScrollGuard";
import { playbackScrollMonitor } from "@/app/shell/playbackScrollMonitor";
import { useJourneyScrollLock } from "@/app/shell/useJourneyScrollLock";
import { usePlaybackCursorGuard } from "@/app/shell/usePlaybackCursorGuard";
import { usePlaybackDirectorGuard } from "@/app/shell/usePlaybackDirectorGuard";
import { usePlaybackTransportGuard } from "@/app/shell/usePlaybackTransportGuard";
import { usePlaybackViewportGuard } from "@/app/shell/usePlaybackViewportGuard";
import { playbackCursorMonitor } from "@/app/shell/playbackCursorMonitor";
import { playbackViewportMonitor } from "@/app/shell/playbackViewportMonitor";
import {
  readStoredHubOpen,
  readStoredNavIndex,
  storeHubOpen,
  storeNavIndex,
  studioNavStorageKey,
} from "@/app/shell/studioNavStorage";
import { resolveStudioModalIdFromFlags } from "@/app/shell/studioModalRegistry";
import {
  applyStudioScreen,
  HUB_SCREEN_ID,
  parseStudioUrl,
  resolveNavFromScreenId,
  resolveScreenIdFromNav,
  serializeStudioUrl,
  STUDIO_POST_AGENT_RESET_EVENT,
  type StudioPostAgentResetDetail,
} from "@/app/shell/studioUrl";
import {
  studioModalFlagsFromWire,
  useStudioModalUrlBridge,
} from "@/app/shell/useStudioModalUrlBridge";
import { useStudioUrlSync } from "@/app/shell/useStudioUrlSync";
import { getProjectWire } from "@/projects/registry";
import { useNavTransition } from "@/app/shell/useNavTransition";
import type { AvailOpenIntent } from "@/projects/boots-pharmacy/overlays/AvailabilityTool";
import {
  collectSitePilotChatScenarioFrames,
  ensureSitePilotChatComposerDock,
  isSitePilotChatAgentReplyFrame,
  mountSitePilotChatComposerDock,
  setSitePilotChatComposerDockSuppressed,
  SITE_PILOT_CHAT_PLAYBACK_THINK_MS,
  syncSitePilotChatComposerDock,
} from "@/projects/boots-pharmacy/dom/sitePilotChatScenario";
import {
  abortSitePilotChatPlaybackPrelude,
  runSitePilotChatBeforeReveal,
  runSitePilotChatScenarioFinale,
} from "@/projects/boots-pharmacy/playback/sitePilotChat";
import {
  beginSitePilotChatPlaybackThinking,
  endSitePilotChatThinking,
  isSitePilotChatPlaybackThinking,
  syncSitePilotChatThinkingHint,
} from "@/projects/boots-pharmacy/dom/sitePilotChatThinking";
import {
  installStudioAuthSessionWindowApi,
  isStudioLoggedIn,
} from "@/app/shell/studioAuthSession";
import { AVAIL_INTENT } from "@/projects/boots-pharmacy/wire/BootsPharmacyProjectView";

const CHAT_SCREEN_SELECTOR = ".studio-viewport > div > div:nth-child(10)";

export default function App() {
  const studio = useStudio();
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
    journeys: studioJourneys,
    modeId: orchestraModeId,
    setModeId: setOrchestraModeId,
    modes: orchestraModes,
    beatIndex: journeyBeatIndex,
    setBeatIndex: setJourneyBeatIndex,
    resetBeatIndex,
    journey: activeJourney,
  } = studio;

  const {
    PROJECT_SCREENS: SCREENS,
    HUB_LABEL,
    SCENARIO_SCREENS,
    studioTabToIndex,
  } = projectContent;

  const [current, setCurrent] = useState(() => {
    const fromUrl = resolveNavFromScreenId(parseStudioUrl().screenId, SCREENS);
    if (fromUrl && !fromUrl.hubOpen) return fromUrl.current;
    return readStoredNavIndex(studioProjectId, SCREENS.length);
  });
  const [hubOpen, setHubOpen] = useState(() => {
    const fromUrl = resolveNavFromScreenId(parseStudioUrl().screenId, SCREENS);
    if (fromUrl) return fromUrl.hubOpen;
    return readStoredHubOpen(studioProjectId);
  });
  const [wireTick, setWireTick] = useState(0);
  const [playbackDiagnostic, setPlaybackDiagnostic] =
    useState<PlaybackDiagnosticError | null>(null);
  const [studioJourneyMode, setStudioJourneyMode] = useState(false);
  const [chatRetreatRestoreActive, setChatRetreatRestoreActive] = useState(false);
  const stopAllPlaybackRef = useRef<() => void>(() => {});
  const playbackSnapshotRef = useRef<PlaybackStudioSnapshot>({});
  const controlPanelTransportRef = useRef<Record<string, unknown>>({});
  const onWireApiChange = useCallback(() => setWireTick((t) => t + 1), []);

  useEffect(() => {
    disableCursorQaEyes();
  }, []);

  const handlePlaybackDiagnostic = useCallback((error: PlaybackDiagnosticError) => {
    stopAllPlaybackRef.current();
    setPlaybackDiagnostic((prev) => {
      if (prev) return prev;
      const enriched = attachPlaybackInteractionToDiagnostic(
        enrichPlaybackDiagnosticSnapshot(error, playbackSnapshotRef.current)
      );
      recordPlaybackDiagnosticOpen(enriched, "playback-guard");
      return enriched;
    });
  }, []);

  const hubScrollElRef = useRef<HTMLDivElement>(null);
  const prototypeScrollElRef = useRef<HTMLDivElement>(null);
  const appContentRef = useRef<HTMLDivElement>(null);
  const tabsScrollRef = useRef<HTMLDivElement>(null);
  const tabBtnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const wireApiRef = useRef<ProjectWireApi | null>(null);
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
  const handleStudioJourneyModeChangeRef = useRef<(enabled: boolean) => void>(
    () => {}
  );
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
    // Deep link wins over per-project session nav when `screen` is present.
    const fromUrl = resolveNavFromScreenId(parseStudioUrl().screenId, SCREENS);
    if (fromUrl) {
      setHubOpen(fromUrl.hubOpen);
      if (!fromUrl.hubOpen) setCurrent(fromUrl.current);
    } else {
      setCurrent(readStoredNavIndex(studioProjectId, SCREENS.length));
      setHubOpen(readStoredHubOpen(studioProjectId));
    }
    wireApiRef.current = null;
  }, [SCREENS, studioProjectId]);

  useEffect(() => {
    storeNavIndex(studioProjectId, current);
    storeHubOpen(studioProjectId, hubOpen);
  }, [current, hubOpen, studioProjectId]);

  const { studioModalId, applyModalFromUrl } = useStudioModalUrlBridge({
    wireTick,
    wireApiRef,
    openAvailabilityToolRef,
    closeAvailabilityToolRef,
    pickListIntent: AVAIL_INTENT.pickList,
  });

  useStudioUrlSync({
    projectId: studioProjectId,
    personaId: studioPersonaId,
    modeId: orchestraModeId,
    journeyMode: studioJourneyMode,
    modalId: studioModalId,
    screens: SCREENS,
    current,
    hubOpen,
    setProjectId: setStudioProjectId,
    setPersonaId: setStudioPersonaId,
    setModeId: setOrchestraModeId,
    setJourneyMode: (enabled) =>
      handleStudioJourneyModeChangeRef.current(enabled),
    setCurrent,
    setHubOpen,
    applyModal: applyModalFromUrl,
  });

  // Agent overlay stop → dismiss sticky popups; apply stay/hub URL (already written).
  // HARD: never re-apply `&modal=` after closeAllPopups (sticky choose-pharmacy felony).
  useEffect(() => {
    const onPostAgentReset = (event: Event) => {
      const detail = (event as CustomEvent<StudioPostAgentResetDetail>).detail;
      const state = detail?.state;
      wireApiRef.current?.closeAllPopups();
      applyStudioScreen({
        projectId: state?.projectId ?? studioProjectId,
        screenId: state?.screenId ?? HUB_SCREEN_ID,
        personaId: state?.personaId,
        modeId: state?.modeId,
        experienceId: state?.experienceId,
        cjm: state?.cjm,
        modalId: undefined,
        screens: SCREENS,
        currentProjectId: studioProjectId,
        setProjectId: setStudioProjectId,
        setPersonaId: setStudioPersonaId,
        setModeId: setOrchestraModeId,
        setJourneyMode: (enabled) =>
          handleStudioJourneyModeChangeRef.current(enabled),
        setCurrent,
        setHubOpen,
        applyModal: applyModalFromUrl,
        syncUrl: true,
      });
    };
    window.addEventListener(STUDIO_POST_AGENT_RESET_EVENT, onPostAgentReset);
    return () => {
      window.removeEventListener(STUDIO_POST_AGENT_RESET_EVENT, onPostAgentReset);
    };
  }, [
    SCREENS,
    applyModalFromUrl,
    setOrchestraModeId,
    setStudioPersonaId,
    setStudioProjectId,
    studioProjectId,
  ]);

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
      applyStudioModal: (modalId) => {
        applyModalFromUrl(modalId);
      },
    }),
    [applyModalFromUrl]
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
        journeys: studioJourneys,
        scenarioScreens: SCENARIO_SCREENS,
        studioTabToIndex,
      }),
    [
      hubOpen,
      orchestraModeId,
      journeyBeatIndex,
      current,
      studioJourneyMode,
      studioJourneys,
      SCENARIO_SCREENS,
      studioTabToIndex,
      SCREENS,
    ]
  );

  const collectScenarioFrames = useCallback(() => {
    if (!activeScreenScenario) return [];
    const screen = document.querySelector(
      `.studio-viewport > div > div:nth-child(${activeScreenScenario.childIndex})`
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

  const scenarioRestoreFullOnInitRef = useRef(false);

  const sitePilotChatPlaybackHooks = useMemo<PlaybackStepHooks>(
    () => ({
      beforeReveal: runSitePilotChatBeforeReveal,
      revealScrollSmooth: () => true,
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

  const scenarioPlayback = useScenarioPlayback({
    active: activeScreenScenario != null,
    collectFrames: collectScenarioFrames,
    screenSelector: activeScreenScenario
      ? `.studio-viewport > div > div:nth-child(${activeScreenScenario.childIndex})`
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
    restoreFullOnInitRef: scenarioRestoreFullOnInitRef,
  });

  const headerLoggedIn = useMemo(
    () => (wireApiRef.current?.loggedInFlag ?? false) || isStudioLoggedIn(),
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

  const journeyPlayback = useJourneyPlayback({
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
    studioTabToIndex,
    studioPlaylist,
    currentTouchpointKey: studioTouchpoint.key,
    onDiagnostic: handlePlaybackDiagnostic,
    scenarioBrowseMode: !studioJourneyMode,
    onScreenFramesRetreatEnd: () => {
      scenarioRestoreFullOnInitRef.current = true;
      setChatRetreatRestoreActive(true);
    },
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
      resetPlaybackCursorDiagnosticContext();
      disableCursorQaEyes();
      removeDemoCursor({ immediate: true });
      resetDemoCursorTravelOrigin();
    }
  }, [studioJourneyMode, transport.isPlaying]);

  const { runNavTransition, navTransitionClass } = useNavTransition();
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
    // Forward director scripts may open the next tab before the beat index catches up.
    // Do not apply that preview during retreat sync — it pins the counter at the end.
    if (!hubOpen && activeJourney && navTransportLocked && !transport.retreatSyncing) {
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
    navTransportLocked,
    transport.retreatSyncing,
    shouldSkipBeat,
    studioJourneyMode,
    studioPlaylist,
    studioTouchpoint.key,
    scenarioPlayback.visibleCount,
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
    setChatRetreatRestoreActive(false);
    scenarioRestoreFullOnInitRef.current = false;
    wireApiRef.current?.resetWireInteractionState();
    removeDemoCursor({ immediate: true });
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

    if (SCREENS[current]?.childIndex !== 10) {
      wireApiRef.current?.resetPrototypeScroll();
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
    (journey: JourneyDefinition | undefined) => {
      const { beatIndex: startIndex, beat } = resolveJourneyStartBeat(
        journey,
        shouldSkipBeat
      );
      setJourneyBeatIndex(startIndex);
      if (beat?.protoTab != null) {
        const tabIndex = studioTabToIndex(beat.protoTab);
        runNavTransitionRef.current(() => {
          setHubOpen(false);
          setCurrent(tabIndex);
          if (SCREENS[tabIndex]?.childIndex !== 10) {
            wireApiRef.current?.resetPrototypeScroll();
          }
        });
      }
    },
    [studioTabToIndex, setJourneyBeatIndex, shouldSkipBeat, SCREENS]
  );

  const restartStudioJourney = useCallback(() => {
    journeyPlayback.stopJourneyPlay();
    scenarioPlayback.cancelPreRevealPause();
    scenarioPlayback.jumpToStart();
    journeyPlayback.resetJourney();
    wireApiRef.current?.closeAllPopups();
    wireApiRef.current?.resetWireInteractionState();
    removeDemoCursor({ immediate: true });
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
    (next: OrchestraModeId) => {
      resetStudioPlayback();

      if (next !== orchestraModeId) {
        setOrchestraModeId(next);
      }

      applyJourneyStartTab(getJourneyForMode(studioJourneys, next));
    },
    [
      applyJourneyStartTab,
      orchestraModeId,
      resetStudioPlayback,
      setOrchestraModeId,
      studioJourneys,
    ]
  );

  const handleStudioProjectChange = useCallback(
    (next: ProjectId) => {
      if (next === studioProjectId) return;
      resetStudioPlayback();
      setStudioProjectId(next);
    },
    [resetStudioPlayback, setStudioProjectId, studioProjectId]
  );

  const handleStudioPersonaChange = useCallback(
    (next: PersonaId) => {
      if (next === studioPersonaId) return;
      resetStudioPlayback();
      setStudioPersonaId(next);
    },
    [resetStudioPlayback, setStudioPersonaId, studioPersonaId]
  );

  const showOrchestraControls = orchestraShowControls({
    hubOpen,
    modeId: orchestraModeId,
    journeys: studioJourneys,
  });

  const handleOrchestraModeChangeRef = useRef(handleOrchestraModeChange);
  handleOrchestraModeChangeRef.current = handleOrchestraModeChange;

  handleStudioJourneyModeChangeRef.current = handleStudioJourneyModeChange;

  const transportActionsRef = useRef({
    play: () => {},
    stepBack: () => {},
    stepForward: () => {},
    jumpToStart: () => {},
    jumpToEnd: () => {},
  });
  transportActionsRef.current = {
    play: () => transport.play(),
    stepBack: () => transport.stepBack(),
    stepForward: () => transport.stepForward(),
    jumpToStart: () => transport.jumpToStart(),
    jumpToEnd: () => transport.jumpToEnd(),
  };

  const resetToEndRef = useRef(scenarioPlayback.resetToEnd);
  resetToEndRef.current = scenarioPlayback.resetToEnd;

  useEffect(() => {
    if (!studioJourneyMode || !activeScreenScenario) return;
    const beat = activeJourney?.beats[journeyBeatIndex];
    if (beat?.kind !== "screen-frames") return;
    if (!chatRetreatRestoreActive) return;

    const contentEnd =
      scenarioPlayback.totalFrames > 0
        ? Math.max(1, scenarioPlayback.totalFrames - 1)
        : stableChatPlaylistFrames - 1;

    if (scenarioPlayback.visibleCount >= contentEnd) {
      scenarioRestoreFullOnInitRef.current = false;
      setChatRetreatRestoreActive(false);
      return;
    }

    playbackScrollMonitor.noteRetreatSync();
    resetToEndRef.current({ smooth: false, force: true });
  }, [
    activeJourney,
    activeScreenScenario,
    chatRetreatRestoreActive,
    journeyBeatIndex,
    scenarioPlayback.totalFrames,
    scenarioPlayback.visibleCount,
    stableChatPlaylistFrames,
    studioJourneyMode,
  ]);

  const jumpToStartRef = useRef(scenarioPlayback.jumpToStart);
  jumpToStartRef.current = scenarioPlayback.jumpToStart;
  const triggerChatBrowseRevealRef = useRef<() => void>(() => {});
  const chatBrowseRevealTimerRef = useRef<number | null>(null);
  const chatBrowseRevealGenerationRef = useRef(0);
  const lastChatBrowseRevealKeyRef = useRef<string | null>(null);
  const retreatFromFinaleRef = useRef(scenarioPlayback.retreatFromFinale);
  retreatFromFinaleRef.current = scenarioPlayback.retreatFromFinale;
  const cancelPreRevealPauseRef = useRef(scenarioPlayback.cancelPreRevealPause);
  cancelPreRevealPauseRef.current = scenarioPlayback.cancelPreRevealPause;
  const scenarioVisibleCountRef = useRef(scenarioPlayback.visibleCount);
  scenarioVisibleCountRef.current = scenarioPlayback.visibleCount;
  const availabilityWasOpenRef = useRef(false);
  const chatBrowsePollCancelRef = useRef<(() => void) | null>(null);

  const runChatBrowseReveal = useCallback(
    (options?: { force?: boolean }) => {
      if (studioJourneyMode || hubOpen) return;
      if (SCREENS[current]?.childIndex !== 10) return;
      if (activeScreenScenario?.id !== "site-pilot-chat") return;

      const revealKey = `${current}:site-pilot-chat`;
      if (!options?.force && lastChatBrowseRevealKeyRef.current === revealKey) {
        return;
      }
      lastChatBrowseRevealKeyRef.current = revealKey;

      chatBrowseRevealGenerationRef.current += 1;
      const generation = chatBrowseRevealGenerationRef.current;

      if (chatBrowseRevealTimerRef.current != null) {
        window.clearTimeout(chatBrowseRevealTimerRef.current);
        chatBrowseRevealTimerRef.current = null;
      }

      const isActive = () => chatBrowseRevealGenerationRef.current === generation;

      const finishReveal = (screen: HTMLElement) => {
        if (!isActive()) return;
        endSitePilotChatThinking();
        resetToEndRef.current({ smooth: true, force: true });
        mountSitePilotChatComposerDock(screen);
      };

      const showBrowseThinkingPause = (screen: HTMLElement) => {
        const frames = collectSitePilotChatScenarioFrames(screen);
        const anchor =
          frames.find((frame) => isSitePilotChatAgentReplyFrame(frame)) ??
          frames[0];
        if (!anchor) return;
        beginSitePilotChatPlaybackThinking(screen, anchor, { scroll: false });
      };

      const waitForFramesThenFinish = (screen: HTMLElement, attempt = 0) => {
        if (!isActive()) return;
        const frameCount = collectSitePilotChatScenarioFrames(screen).length;
        if (frameCount === 0 && attempt < 40) {
          chatBrowseRevealTimerRef.current = window.setTimeout(
            () => waitForFramesThenFinish(screen, attempt + 1),
            50
          );
          return;
        }
        finishReveal(screen);
      };

      let pollRaf = 0;
      const pollScreen = () => {
        if (!isActive()) return;
        const screen = document.querySelector<HTMLElement>(CHAT_SCREEN_SELECTOR);
        if (!screen) {
          pollRaf = requestAnimationFrame(pollScreen);
          return;
        }
        const frames = collectSitePilotChatScenarioFrames(screen);
        if (frames.length === 0) {
          pollRaf = requestAnimationFrame(pollScreen);
          return;
        }
        ensureSitePilotChatComposerDock(screen);
        cancelPreRevealPauseRef.current();
        jumpToStartRef.current();
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (!isActive()) return;
            showBrowseThinkingPause(screen);
          });
        });
        chatBrowseRevealTimerRef.current = window.setTimeout(() => {
          chatBrowseRevealTimerRef.current = null;
          waitForFramesThenFinish(screen);
        }, SITE_PILOT_CHAT_PLAYBACK_THINK_MS);
      };
      pollScreen();

      return () => cancelAnimationFrame(pollRaf);
    },
    [
      activeScreenScenario?.id,
      current,
      hubOpen,
      studioJourneyMode,
      SCREENS,
    ]
  );

  triggerChatBrowseRevealRef.current = () => runChatBrowseReveal({ force: true });

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
    chatBrowsePollCancelRef.current?.();
    chatBrowsePollCancelRef.current = null;

    if (studioJourneyMode || hubOpen) return;
    if (SCREENS[current]?.childIndex !== 10) {
      lastChatBrowseRevealKeyRef.current = null;
      return;
    }
    if (activeScreenScenario?.id !== "site-pilot-chat") return;

    const cancel = runChatBrowseReveal();
    chatBrowsePollCancelRef.current = cancel ?? null;
    return () => {
      chatBrowseRevealGenerationRef.current += 1;
      chatBrowsePollCancelRef.current?.();
      chatBrowsePollCancelRef.current = null;
      if (chatBrowseRevealTimerRef.current != null) {
        window.clearTimeout(chatBrowseRevealTimerRef.current);
        chatBrowseRevealTimerRef.current = null;
      }
      endSitePilotChatThinking();
      lastChatBrowseRevealKeyRef.current = null;
    };
  }, [
    activeScreenScenario?.id,
    current,
    hubOpen,
    runChatBrowseReveal,
    studioJourneyMode,
    SCREENS,
  ]);

  useEffect(() => {
    if (SCREENS[current]?.childIndex === 10) return;
    syncSitePilotChatThinkingHint(null, false);
  }, [current, SCREENS]);

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

  const currentBeat = activeJourney?.beats[journeyBeatIndex];

  const snapshotScreenId = resolveScreenIdFromNav({
    hubOpen,
    current,
    screens: SCREENS,
  });
  const snapshotStudioUrl = serializeStudioUrl({
    projectId: studioProjectId,
    screenId: snapshotScreenId,
    personaId: studioPersonaId,
    modeId: orchestraModeId,
    modalId: resolveStudioModalIdFromFlags(studioModalFlagsFromWire(wire)),
  });

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
    screenId: snapshotScreenId,
    studioUrl: snapshotStudioUrl || undefined,
    touchpointKey: studioTouchpoint.key,
    touchpointLabel: studioTouchpoint.label,
    scenarioProgress: `${studioProgress.visibleCount}/${studioProgress.totalFrames}`,
    hubOpen,
    wire,
  });

  controlPanelTransportRef.current = {
    journeyMode: studioJourneyMode,
    isPlaying: transport.isPlaying,
    isOnAir: transport.isOnAir,
    isScripting: transport.isScripting,
    canStepBack: transport.canStepBack,
    canStepForward: transport.canStepForward,
    canJumpToStart: transport.canJumpToStart,
    canJumpToEnd: transport.canJumpToEnd,
    canPlay: transport.canPlay,
    journeyAtEnd,
  };

  usePlaybackGuard({
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

  usePlaybackScrollGuard({
    snapshot: {
      isOnAir: transport.isOnAir,
      isScripting: transport.isScripting,
      isPausingBeforeReveal: transport.isPausingBeforeReveal,
      journeyMode: studioJourneyMode,
      journeyAtEnd,
      availabilityOpen: wire?.availabilityOpen ?? false,
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

  useJourneyScrollLock({
    active: studioJourneyMode && !hubOpen,
    scrollRootRef: prototypeScrollElRef,
  });

  usePlaybackCursorGuard({
    snapshot: {
      active: studioJourneyMode && !hubOpen,
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

  usePlaybackDirectorGuard({
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

  usePlaybackTransportGuard({
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
      availabilityOpen: wire?.availabilityOpen ?? false,
      loginPopupOpen: wire?.loginPopupOpen ?? false,
      vaccinePickerOpen: wire?.vaccinePickerOpen ?? false,
      recipientPickerOpen: wire?.recipientPickerOpen ?? false,
      quickViewOpen: wire?.quickViewOpen ?? false,
    },
    currentBeat,
    onDiagnostic: handlePlaybackDiagnostic,
  });

  const screenFramesBeat =
    activeScreenScenario != null &&
    activeJourney?.beats[journeyBeatIndex]?.kind === "screen-frames";

  usePlaybackViewportGuard({
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
    checkRetreatSelectionGoal: projectPlayback.checkRetreatSelectionGoal,
  });

  useEffect(() => {
    if (!studioJourneyMode || hubOpen) return;
    captureTouchpointChange({
      touchpointKey: studioTouchpoint.key,
      beatId: currentBeat?.id,
      label: studioTouchpoint.label,
      counter: `${studioProgress.visibleCount}/${studioProgress.totalFrames}`,
    });
  }, [
    studioJourneyMode,
    hubOpen,
    studioTouchpoint.key,
    studioTouchpoint.label,
    currentBeat?.id,
    studioProgress.visibleCount,
    studioProgress.totalFrames,
  ]);

  useLayoutEffect(() => {
    const scrollEl = prototypeScrollElRef.current;
    const onChatTab = SCREENS[current]?.childIndex === 10;
    const chatScenarioActive = activeScreenScenario?.id === "site-pilot-chat";
    const onChatScenario = onChatTab && chatScenarioActive;
    const atFrameStart =
      onChatScenario && studioJourneyMode && scenarioPlayback.visibleCount <= 1;

    scrollEl?.classList.toggle("proto-chat-scenario-at-start", atFrameStart);

    const screen = document.querySelector<HTMLElement>(CHAT_SCREEN_SELECTOR);
    if (screen) {
      if (atFrameStart) screen.setAttribute("data-studio-scenario-at-start", "true");
      else screen.removeAttribute("data-studio-scenario-at-start");
      if (onChatTab || chatScenarioActive) {
        mountSitePilotChatComposerDock(screen);
      }
    }

    const overlayOpen =
      (onChatTab || chatScenarioActive) &&
      Boolean(
        wire?.availabilityOpen ||
          wire?.loginPopupOpen ||
          wire?.quickViewOpen ||
          wire?.vaccinePickerOpen ||
          wire?.recipientPickerOpen
      );
    setSitePilotChatComposerDockSuppressed(overlayOpen);

    if (atFrameStart && scrollEl) {
      scrollEl.scrollTop = 0;
      scrollEl.scrollLeft = 0;
    }

    return () => {
      scrollEl?.classList.remove("proto-chat-scenario-at-start");
      screen?.removeAttribute("data-studio-scenario-at-start");
    };
  }, [
    current,
    activeScreenScenario?.id,
    scenarioPlayback.visibleCount,
    studioJourneyMode,
    SCREENS,
    wire?.availabilityOpen,
    wire?.loginPopupOpen,
    wire?.quickViewOpen,
    wire?.vaccinePickerOpen,
    wire?.recipientPickerOpen,
  ]);

  const isStudioPristine =
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

  const navLabel = hubOpen ? HUB_LABEL : SCREENS[current]?.label ?? "";

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
    registerControlPanelSnapshotProvider(() => ({
      ...playbackSnapshotRef.current,
      ...controlPanelTransportRef.current,
    }));
    return () => registerControlPanelSnapshotProvider(null);
  }, []);

  useEffect(() => {
    registerRecordingSnapshotProvider(() => ({
      ...playbackSnapshotRef.current,
      journeyMode: studioJourneyModeRef.current,
      orchestraMode: orchestraModeId,
      counter: document
        .querySelector(".studio-nav-scenario__counter")
        ?.textContent?.trim() ?? null,
    }));
    return () => registerRecordingSnapshotProvider(null);
  }, [orchestraModeId]);

  const getRecordingStartOptions = useCallback(
    () => ({
      projectId: playbackSnapshotRef.current.projectId,
      personaId: playbackSnapshotRef.current.personaId,
      journeyId: playbackSnapshotRef.current.journeyId,
      orchestraMode: orchestraModeId,
      journeyCatalog: studioJourneys.map((journey) => summarizeJourney(journey)),
    }),
    [orchestraModeId, studioJourneys]
  );

  const refreshJourneysAfterImport = useCallback(() => {
    resetBeatIndex();
    transportActionsRef.current.jumpToStart();
  }, [resetBeatIndex]);

  const { replayRecordingOptions } = useRecordingReplayBridge({
    transportActionsRef,
    screenNav: {
      screens: SCREENS,
      projectId: studioProjectId,
      personaId: studioPersonaId,
      modeId: orchestraModeId,
      setProjectId: setStudioProjectId,
      setPersonaId: setStudioPersonaId,
      setModeId: setOrchestraModeId,
      setJourneyMode: (enabled) =>
        handleStudioJourneyModeChangeRef.current(enabled),
      setCurrent,
      setHubOpen,
    },
    journeyRuntime,
    projectPlayback,
    getStartOptions: getRecordingStartOptions,
    onJourneySaved: refreshJourneysAfterImport,
  });

  useEffect(() => {
    return registerJourneyMcpHelpers({
      projectId: studioProjectId,
      personaId: studioPersonaId,
      getJourneys: () => studioJourneys,
      getActiveJourneyId: () => activeJourney?.id,
      onJourneysApplied: refreshJourneysAfterImport,
    });
  }, [
    activeJourney?.id,
    refreshJourneysAfterImport,
    studioJourneys,
    studioPersonaId,
    studioProjectId,
  ]);

  useEffect(() => installStudioAuthSessionWindowApi(), []);

  useEffect(() => {
    return registerStudioMcpHelpers({
      dismissDiagnostic: () => {
        recordPlaybackDiagnosticDismiss("mcp-helper");
        setPlaybackDiagnostic(null);
      },
      abortAll: () => stopAllPlaybackRef.current(),
      isDiagnosticOpen: () =>
        document.querySelector(".studio-playback-diagnostic") != null,
      getState: () => ({
        journeyMode:
          document
            .querySelector('[role="switch"][aria-label="CJM"]')
            ?.getAttribute("aria-checked") === "true",
        scrollLock:
          prototypeScrollElRef.current?.classList.contains(
            "studio-scroll--journey-locked"
          ) ?? false,
        label:
          document.querySelector(".studio-nav-scenario__label")?.textContent?.trim() ??
          null,
        counter:
          document.querySelector(".studio-nav-scenario__counter")?.textContent?.trim() ??
          null,
        beatId: playbackSnapshotRef.current.beatId ?? null,
        availStep: playbackSnapshotRef.current.availStep ?? null,
      }),
      getOrchestraModeId: () => orchestraModeId,
      setOrchestraMode: (modeId) => handleOrchestraModeChangeRef.current(modeId),
      setJourneyMode: (enabled) =>
        handleStudioJourneyModeChangeRef.current(enabled),
      triggerTransport: (action) => {
        switch (action) {
          case "play":
            notePlaybackTransport("play");
            transportActionsRef.current.play();
            break;
          case "step-back":
            notePlaybackTransport("step-back");
            transportActionsRef.current.stepBack();
            break;
          case "step-forward":
            notePlaybackTransport("step-forward");
            transportActionsRef.current.stepForward();
            break;
          case "jump-to-start":
            notePlaybackTransport("jump-to-start");
            transportActionsRef.current.jumpToStart();
            break;
          case "jump-to-end":
            notePlaybackTransport("jump-to-end");
            transportActionsRef.current.jumpToEnd();
            break;
        }
      },
    });
  }, [orchestraModeId]);

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
      isStudioPristine,
      go,
      openHub,
      navPlaybackLockedRef,
      goRef,
      currentRef,
      studioNavKey: studioNavStorageKey(studioProjectId),
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
      isStudioPristine,
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
    <StudioNavStudioSelect
      options={projectSelectOptions(studioProjects)}
      value={studioProjectId}
      onChange={handleStudioProjectChange}
      ariaLabel="Project"
      logAction="studio:project"
      isPlaying={transport.isPlaying}
      controlsLocked={transport.isPausingBeforeReveal || studioJourneyMode}
    />
  );

  return (
    <div
      className="studio-app-root flex flex-col h-full max-h-[100dvh] overflow-hidden"
      data-studio-project={studioProjectId}
      style={{ fontFamily: "'Open Sans', sans-serif" }}
    >
      <PlaybackDiagnosticOverlay
        error={playbackDiagnostic}
        onDismiss={() => {
          recordPlaybackDiagnosticDismiss("overlay");
          cancelPlaybackScroll();
          playbackScrollMonitor.reset();
          setPlaybackDiagnostic(null);
        }}
      />

      <StudioNavPanel
        screens={SCREENS}
        hubLabel={HUB_LABEL}
        current={current}
        hubOpen={hubOpen}
        navLabel={navLabel}
        isStudioPristine={isStudioPristine}
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
            <StudioNavScenarioControls
              studioMenus={
                <div className="studio-nav-studio-menus">
                  {projectStudioSelect}
                  <StudioNavStudioSelect
                    options={personaSelectOptions(studioProject)}
                    value={studioPersonaId}
                    onChange={handleStudioPersonaChange}
                    ariaLabel="Persona"
                    logAction="studio:persona"
                    isPlaying={transport.isPlaying}
                    controlsLocked={transport.isPausingBeforeReveal || studioJourneyMode}
                  />
                  <StudioNavJourneyMenu
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
                notePlaybackTransport("jump-to-start");
                playbackCursorMonitor.noteManualTransport("jump-to-start");
                playbackViewportMonitor.noteManualTransport("jump-to-start");
                transport.jumpToStart();
                if (SCREENS[current]?.childIndex !== 10) {
                  wireApiRef.current?.resetPrototypeScroll();
                }
              }}
              onStepBack={() => {
                notePlaybackTransport("step-back");
                playbackCursorMonitor.noteManualTransport("step-back");
                playbackViewportMonitor.noteManualTransport("step-back");
                transport.stepBack();
              }}
              onPlay={() => {
                notePlaybackTransport("play");
                playbackCursorMonitor.noteManualTransport("play");
                playbackViewportMonitor.noteManualTransport("play");
                transport.play();
              }}
              onStepForward={() => {
                notePlaybackTransport("step-forward");
                playbackCursorMonitor.noteManualTransport("step-forward");
                playbackViewportMonitor.noteManualTransport("step-forward");
                transport.stepForward();
              }}
              onJumpToEnd={() => {
                notePlaybackTransport("jump-to-end");
                playbackCursorMonitor.noteManualTransport("jump-to-end");
                playbackViewportMonitor.noteManualTransport("jump-to-end");
                transport.jumpToEnd();
              }}
              qaBeatId={currentBeat?.id ?? null}
              qaBeatLabel={currentBeat?.label ?? studioTouchpoint.label}
              recordingControls={
                <StudioNavRecordingControls
                  getStartOptions={getRecordingStartOptions}
                  onReplay={(session) =>
                    replayRecordingSession(session, replayRecordingOptions())
                  }
                  onSaveAsJourney={refreshJourneysAfterImport}
                />
              }
            />
          ) : (
            <div className="studio-nav-scenario">
              <div className="studio-nav-studio-menus">{projectStudioSelect}</div>
              <StudioNavRecordingModeSlot
                getStartOptions={getRecordingStartOptions}
                recModeLocked={navTransportLocked}
                onReplay={(session) =>
                  replayRecordingSession(session, replayRecordingOptions())
                }
                onSaveAsJourney={refreshJourneysAfterImport}
              />
            </div>
          )
        }
      />

      <div
        className={`studio-wire-mount flex flex-1 min-h-0 min-w-0 flex-col relative${
          wirePlaybackCursorLocked ? " studio-wire-mount--playback-locked" : ""
        }${navTransitionClass}`}
      >
        {wireInteractionShield && !(wire?.availabilityOpen ?? false) ? (
          <PlaybackShield />
        ) : null}
        <div
          id="studio-chat-composer-portal-host"
          className="studio-chat-composer-portal-host"
          aria-hidden
        />
        {WireComponent ? (
          <WireComponent bridge={bridge} apiRef={wireApiRef} />
        ) : (
          <ProjectPlaceholder projectLabel={studioProject.label} />
        )}
      </div>
    </div>
  );
}
