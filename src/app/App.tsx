import { useState, useRef, useEffect, useLayoutEffect, useCallback, useMemo } from "react";
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
import { orchestraShowControls, resolveActiveScreenScenario } from "@/app/orchestra/resolveActiveScreenScenario";
import {
  getJourneyForMode,
  resolveBeatIndexForScreenTab,
  resolveJourneyStartBeat,
} from "@/app/orchestra/journeyUtils";
import type { JourneyRuntime, JourneyDefinition, OrchestraModeId } from "@/app/orchestra/types";
import type { PersonaId, ProjectId, ProjectWireApi } from "@/projects/types";
import {
  cancelDemoCursorJourneyEndFade,
  cancelDemoCursorTravel,
  parkDemoCursorAtRest,
  removeDemoCursor,
  resetDemoCursorTravelOrigin,
  reviveDemoCursorAfterJourneyEndRetreat,
  scheduleDemoCursorJourneyEndFade,
  setDemoCursorJourneyMode,
} from "@/app/scenario/demoCursor";
import {
  acknowledgePlaybackDiagnosticStop,
  haltPlaybackForPoSignal,
  registerPoSignalPlaybackHalt,
} from "@/app/shell/agent-testing/agentTestingPlaybackHalt";
import {
  cancelPlaybackScroll,
  getPrototypeScrollRoot,
  scrollCameraToOrigin,
  setPlaybackCameraSessionActive,
} from "@/app/scenario/playbackScroll";
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
import { refuseIncompatibleCjm } from "@/app/shell/cjmCompatibilityPreflight";
import {
  attachPlaybackInteractionToDiagnostic,
  buildPlaybackStudioSnapshot,
  enrichPlaybackDiagnosticSnapshot,
  type PlaybackStudioSnapshot,
} from "@/app/shell/playbackStudioSnapshot";
import { notePlaybackTransport } from "@/app/shell/playbackInteractionContext";
import { refusePlayIfQaBlocks } from "@/app/shell/agent-testing/agentTestingListen";
import { clearQaPlaybackBlocksForReset } from "@/app/shell/agent-testing/agentTestingOverlay";
import { playbackDiagHubNav } from "@/app/shell/playbackDiag";
import {
  disableCursorQaEyes,
  resetPlaybackCursorDiagnosticContext,
} from "@/app/shell/playbackCursorDiagnostic";
import {
  recordPlaybackDiagnosticDismiss,
  recordPlaybackDiagnosticOpen,
} from "@/app/shell/playbackDiagnosticFlash";
import { registerPlaybackDiagnosticDismiss, registerPlaybackDiagnosticForceClear, isPlaybackDiagnosticSuppressed } from "@/app/shell/playbackDiagQaBridge";
import { isQaDiagGateOpen } from "@/app/shell/qaDiagGate";
import {
  logControlPanel,
  registerControlPanelSnapshotProvider,
} from "@/app/shell/controlPanelLog";
import { registerStudioMcpHelpers } from "@/app/shell/studioMcpHelpers";
import { useInteractionInventoryRegistration } from "@/app/shell/useInteractionInventoryRegistration";
import {
  captureTouchpointChange,
  registerRecordingSnapshotProvider,
} from "@/app/recording/recordingCapture";
import { isRecordingActive, pauseRecording } from "@/app/recording/recordingSession";
import { replayRecordingSession } from "@/app/recording/recordingReplay";
import { buildCjmMetadataCatalog } from "@/app/recording/recordingMetadata";
import { useCjmCompatibilityRevision } from "@/app/recording/useCjmCompatibilityRevision";
import { useStudioDocumentTitle } from "@/app/shell/studioDocumentTitle";
import { useRecordingReplayBridge } from "@/app/recording/useRecordingReplayBridge";
import { isRecModeLocked } from "@/app/nav/studioModeXor";
import { registerJourneyMcpHelpers } from "@/app/journey/journeyMcpHelpers";
import { buildSavedJourneyDownload, summarizeJourney } from "@/app/journey/journeyFile";
import {
  isDeletableRecordedJourneyId,
  readPersistedRecordingForJourney,
  removePersistedRecordedJourney,
  withPersistedJourneyPlaybackProof,
} from "@/app/journey/recordedJourneyPersist";
import { getImportedJourneys } from "@/app/journey/journeyRuntimeStore";
import {
  experienceToOrchestraModeId,
  orchestraModeToExperienceId,
} from "@/app/orchestra/orchestraModes";
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
  parseStudioUrl,
  resolveNavFromScreenId,
  resolvePostAgentApplyScreenId,
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
import { buildJourneyGoToTabTransition } from "@/app/shell/navTransitionPolicy";
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
import { usePublishChatScenarioReveal } from "@/projects/boots-pharmacy/screens/chat/usePublishChatScenarioReveal";
import { CHAT_PULL_UP_MS } from "@/projects/boots-pharmacy/screens/chat/chatMotion";
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
  const cjmCompatibilityRevision = useCjmCompatibilityRevision();
  useStudioDocumentTitle(studioProject.label, studioPersona.shortLabel ?? studioPersona.label);

  const {
    PROJECT_SCREENS: SCREENS,
    HUB_LABEL,
    SCENARIO_SCREENS,
    studioTabToIndex,
  } = projectContent;
  const hasProjectPages = SCREENS.length > 0;
  const [current, setCurrent] = useState(() => {
    const fromUrl = resolveNavFromScreenId(parseStudioUrl().screenId, SCREENS);
    if (fromUrl && !fromUrl.hubOpen) return fromUrl.current;
    return readStoredNavIndex(studioProjectId, SCREENS.length);
  });
  const [hubOpen, setHubOpen] = useState(() => {
    if (!hasProjectPages) return true;
    const fromUrl = resolveNavFromScreenId(parseStudioUrl().screenId, SCREENS);
    if (fromUrl) return fromUrl.hubOpen;
    return readStoredHubOpen(studioProjectId);
  });
  const [wireTick, setWireTick] = useState(0);
  const [playbackDiagnostic, setPlaybackDiagnostic] =
    useState<PlaybackDiagnosticError | null>(null);
  const [studioJourneyMode, setStudioJourneyMode] = useState(false);
  /** CJM picker CREATE NEW CJM (idle Import path / live REC forced). Not a playable mode id. */
  const [createNewCjmSelected, setCreateNewCjmSelected] = useState(false);
  /** REC deck mode — owned here so CREATE NEW can auto-enter Rec (guiding UX). */
  const [studioRecMode, setStudioRecMode] = useState(false);
  const [chatRetreatRestoreActive, setChatRetreatRestoreActive] = useState(false);
  const stopAllPlaybackRef = useRef<() => void>(() => {});
  const playbackSnapshotRef = useRef<PlaybackStudioSnapshot>({});
  const controlPanelTransportRef = useRef<Record<string, unknown>>({});
  const onWireApiChange = useCallback(() => setWireTick((t) => t + 1), []);

  useEffect(() => {
    disableCursorQaEyes();
  }, []);

  const handlePlaybackDiagnostic = useCallback((error: PlaybackDiagnosticError) => {
    if (isPlaybackDiagnosticSuppressed()) return;
    stopAllPlaybackRef.current();
    const enriched = attachPlaybackInteractionToDiagnostic(
      enrichPlaybackDiagnosticSnapshot(error, playbackSnapshotRef.current)
    );
    // Always ingest to QA ring/log/flash (agent-facing SSoT).
    recordPlaybackDiagnosticOpen(enriched, "playback-guard");
    // While QA gate/agent session is open: suppress blocking modal —
    // PO/agent use QA log + Ack diag (not a separate popup).
    try {
      if (isQaDiagGateOpen()) return;
    } catch {
      /* fall through to modal */
    }
    setPlaybackDiagnostic((prev) => prev ?? enriched);
  }, []);

  const hubScrollElRef = useRef<HTMLDivElement>(null);
  const prototypeScrollElRef = useRef<HTMLDivElement>(null);
  const appContentRef = useRef<HTMLDivElement>(null);
  const tabsScrollRef = useRef<HTMLDivElement>(null);
  const tabBtnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const wireApiRef = useRef<ProjectWireApi | null>(null);
  const goRef = useRef<(i: number) => void>(() => {});
  const currentRef = useRef(current);
  const hubOpenRef = useRef(hubOpen);
  const navPlaybackLockedRef = useRef(false);
  const navTransportLockedRef = useRef(false);
  const runNavTransitionRef = useRef<
    (
      apply: () => void,
      options?: {
        instant?: boolean;
        sameTab?: boolean;
        screenBefore?: string | null;
        screenAfter?: string | null;
      }
    ) => void
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
  hubOpenRef.current = hubOpen;
  journeyBeatIndexRef.current = journeyBeatIndex;
  setJourneyBeatIndexRef.current = setJourneyBeatIndex;
  activeJourneyRef.current = activeJourney;

  const prevProjectIdRef = useRef(studioProjectId);
  useEffect(() => {
    if (prevProjectIdRef.current === studioProjectId) return;
    prevProjectIdRef.current = studioProjectId;
    // Deep link wins over per-project session nav when `screen` is present.
    const fromUrl = resolveNavFromScreenId(parseStudioUrl().screenId, SCREENS);
    if (!hasProjectPages) {
      setCurrent(0); setHubOpen(true);
    } else if (fromUrl) {
      setHubOpen(fromUrl.hubOpen);
      if (!fromUrl.hubOpen) setCurrent(fromUrl.current);
    } else {
      setCurrent(readStoredNavIndex(studioProjectId, SCREENS.length));
      setHubOpen(readStoredHubOpen(studioProjectId));
    }
    wireApiRef.current = null;
  }, [SCREENS, hasProjectPages, studioProjectId]);

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
        screenId: resolvePostAgentApplyScreenId(state?.screenId),
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
        // Always invoke — matching index must still close hub. Same-tab skips
        // wire-mount opacity crossfade (book-step2 date→time→reserve blink).
        const { transition } = buildJourneyGoToTabTransition({
          screenIndex,
          requestedInstant: options?.instant,
          hubOpen: hubOpenRef.current,
          currentIndex: currentRef.current,
          screenIdAfter: SCREENS[screenIndex]?.screenId,
        });
        runNavTransitionRef.current(() => {
          setHubOpen(false);
          setCurrent(screenIndex);
        }, transition);
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
    [applyModalFromUrl, SCREENS]
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
      // Includes Chat's double-rAF start + diagnostic/clearance settle tail.
      // The next scripted click must never begin while this frame still owns
      // the camera, including in fast QA mode.
      minimumAutoAdvanceMs: CHAT_PULL_UP_MS + 180,
      revealScrollSmooth: () => true,
      onPreludeAbort: abortSitePilotChatPlaybackPrelude,
      onFinale: async () => {
        const shouldContinueJourney = scenarioIsPlayingRef.current;
        const journey = activeJourneyRef.current;
        const fromIndex = journeyBeatIndexRef.current;
        const beat = journey?.beats[fromIndex];
        // Click "Choose Different Date" WHILE still on agentic-chat.
        // Advancing the beat first tore down screen-frames → onPreludeAbort →
        // preludeAborted mid-delay → click FAIL aborted-before-travel.
        // Advance beat only when opening Availability (touchpoint guard).
        await runSitePilotChatScenarioFinale((intent) => {
          if (beat?.id === "agentic-chat" && journey) {
            const availContinueIndex = journey.beats.findIndex(
              (entry) => entry.id === "avail-continue"
            );
            const nextIndex =
              availContinueIndex >= 0 ? availContinueIndex : fromIndex + 1;
            journeyBeatIndexRef.current = nextIndex;
            setJourneyBeatIndexRef.current(nextIndex);
          }
          openAvailabilityToolRef.current(intent);
        }, AVAIL_INTENT.dateChat);
        if (beat?.id === "agentic-chat" && shouldContinueJourney) {
          resumeJourneyPlayRef.current();
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
    screenIdForTabIndex: (tabIndex) => SCREENS[tabIndex]?.screenId,
  });

  useEffect(() => {
    stopAllPlaybackRef.current = () => {
      journeyPlayback.stopJourneyPlay();
      scenarioPlayback.abortPlayback();
    };
  }, [journeyPlayback, scenarioPlayback]);

  // PO overlay Alarm/Cursor/Scroll / diagnostic Cancel → halt Play same click turn.
  useEffect(() => {
    const stop = () => {
      stopAllPlaybackRef.current();
      cancelDemoCursorTravel();
      // Intentional stop — do not flag scroll-interrupted.
      cancelPlaybackScroll("replace");
    };
    registerPoSignalPlaybackHalt(stop);
    const w = window as Window & {
      __studioStopAllPlayback?: () => void;
      __protoStopAllPlayback?: () => void;
    };
    w.__studioStopAllPlayback = stop;
    w.__protoStopAllPlayback = stop;
    return () => {
      registerPoSignalPlaybackHalt(null);
      delete w.__studioStopAllPlayback;
      delete w.__protoStopAllPlayback;
    };
  }, []);

  useEffect(() => {
    if (!playbackDiagnostic) return;
    // Opening a diagnostic already means stop — same hard halt as overlay Alarm.
    haltPlaybackForPoSignal("diagnostic-open");
  }, [playbackDiagnostic]);

  scenarioIsPlayingRef.current = scenarioPlayback.isPlaying;
  resumeJourneyPlayRef.current = journeyPlayback.resumeJourneyPlay;

  const transport = journeyPlayback;
  const navTransportLocked = transport.isOnAir;
  const navBrowseLocked = navTransportLocked || studioJourneyMode;
  const studioRecModeLocked = isRecModeLocked({
    isOnAir: transport.isOnAir,
    isPlaying: transport.isPlaying,
    journeyMode: studioJourneyMode,
  });

  const handleStudioRecModeChange = useCallback(
    (enabled: boolean) => {
      if (studioRecModeLocked && enabled) {
        logControlPanel("studio:playback-rec-mode", {
          enabled,
          previous: studioRecMode,
          blocked: true,
          blockReason: "rec-mode-locked",
        });
        return;
      }
      logControlPanel("studio:playback-rec-mode", {
        enabled,
        previous: studioRecMode,
        source: "app",
      });
      // Leaving Rec → Playback: pause a live capture; JourneyMenu snaps CREATE NEW away.
      if (!enabled && isRecordingActive()) {
        pauseRecording();
      }
      // Entering Rec → force CJM off (XOR both directions).
      if (enabled && studioJourneyModeRef.current) {
        handleStudioJourneyModeChangeRef.current(false);
      }
      setStudioRecMode(enabled);
    },
    [studioRecMode, studioRecModeLocked]
  );

  // CJM / AIR / play → force Playback deck (REC unavailable).
  useEffect(() => {
    if (!studioRecModeLocked || !studioRecMode) return;
    logControlPanel("studio:playback-rec-mode", {
      enabled: false,
      previous: true,
      forced: true,
      reason: "rec-mode-locked",
      source: "app",
    });
    if (isRecordingActive()) {
      pauseRecording();
    }
    setStudioRecMode(false);
  }, [studioRecModeLocked, studioRecMode]);
  navPlaybackLockedRef.current = navBrowseLocked;
  navTransportLockedRef.current = navTransportLocked;
  studioJourneyModeRef.current = studioJourneyMode;

  useEffect(() => {
    // Step parks after interaction; continuous Play stays at last click
    // (composer submit still parks via settleDemoCursorAfterInteraction).
    setDemoCursorJourneyMode(studioJourneyMode, {
      parkAfterInteraction: studioJourneyMode && !transport.isPlaying,
    });
    // Camera engine session — CJM / Play / AIR: no blind origin on screen-enter.
    setPlaybackCameraSessionActive(
      studioJourneyMode || transport.isPlaying || transport.isOnAir
    );
    if (!studioJourneyMode) {
      resetPlaybackCursorDiagnosticContext();
      disableCursorQaEyes();
      removeDemoCursor({ immediate: true });
      resetDemoCursorTravelOrigin();
    }
  }, [studioJourneyMode, transport.isPlaying, transport.isOnAir]);

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
      wireApiRef.current?.resetPrototypeScroll({ force: true });
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
            wireApiRef.current?.resetPrototypeScroll({ force: true });
          }
        });
      }
    },
    [studioTabToIndex, setJourneyBeatIndex, shouldSkipBeat, SCREENS]
  );

  const restartStudioJourney = useCallback(() => {
    journeyPlayback.stopJourneyPlay();
    scenarioPlayback.cancelPreRevealPause();
    wireApiRef.current?.closeAllPopups();
    wireApiRef.current?.resetWireInteractionState();
    removeDemoCursor({ immediate: true });
    resetDemoCursorTravelOrigin();
    // Product CJM restart → first playable beat + leave hub (never hub landing).
    journeyPlayback.jumpToStart();
    // CJM can stay on across restart (URL re-apply / setJourneyMode(true) while
    // already-on). Immediate wipe must remount the parked robo-cursor — React
    // effect is a no-op when studioJourneyMode does not change.
    if (studioJourneyModeRef.current) {
      setDemoCursorJourneyMode(true, {
        parkAfterInteraction: !journeyPlayback.isPlaying,
      });
      void parkDemoCursorAtRest({
        force: true,
        reason: "cjm-restart-remount",
      });
    }
  }, [journeyPlayback, scenarioPlayback]);

  const handleStudioJourneyModeChange = useCallback(
    (enabled: boolean) => {
      if (enabled) {
        setHubOpen(false);
        setStudioJourneyMode(true);
        // Pin before restart so park during wipe/restore is not a no-op.
        studioJourneyModeRef.current = true;
        setPlaybackCameraSessionActive(true);
        setDemoCursorJourneyMode(true, { parkAfterInteraction: true });
        restartStudioJourney();
        return;
      }

      setStudioJourneyMode(false);
      setPlaybackCameraSessionActive(false);
      journeyPlayback.stopJourneyPlay();
      scenarioPlayback.cancelPreRevealPause();
      if (SCREENS[current]?.childIndex === 10) {
        window.setTimeout(() => triggerChatBrowseRevealRef.current(), 0);
      }
    },
    [current, journeyPlayback, restartStudioJourney, scenarioPlayback, SCREENS]
  );

  const pendingCjmPreviewJourneyIdRef = useRef<string | null>(null);

  const resolveJourneyForOrchestraMode = useCallback(
    (modeId: OrchestraModeId): JourneyDefinition | undefined => {
      // Prefer runtime import store — Add as CJM notifies before React re-renders
      // studioJourneys, so the closed-over catalog can miss the new rec-* id.
      return (
        getImportedJourneys().find((journey) => journey.id === modeId) ??
        getJourneyForMode(studioJourneys, modeId)
      );
    },
    [studioJourneys]
  );

  const handleOrchestraModeChange = useCallback(
    (next: OrchestraModeId, options?: { previewCjm?: boolean }) => {
      resetStudioPlayback();

      if (next !== orchestraModeId) {
        setOrchestraModeId(next);
      }

      applyJourneyStartTab(resolveJourneyForOrchestraMode(next));

      if (options?.previewCjm) {
        pendingCjmPreviewJourneyIdRef.current = next;
      }
    },
    [
      applyJourneyStartTab,
      orchestraModeId,
      resetStudioPlayback,
      resolveJourneyForOrchestraMode,
      setOrchestraModeId,
    ]
  );

  // After Add as CJM: wait until orchestra id + activeJourney match, then CJM on
  // at the start of the new playlist (stale chat STEPS / SF no-op cleared).
  useEffect(() => {
    const pending = pendingCjmPreviewJourneyIdRef.current;
    if (!pending) return;
    if (orchestraModeId !== pending) return;
    if (activeJourney?.id !== pending) return;
    pendingCjmPreviewJourneyIdRef.current = null;
    handleStudioJourneyModeChangeRef.current(true);
  }, [orchestraModeId, activeJourney?.id]);

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
  const snapshotScreenIdRef = useRef(snapshotScreenId);
  snapshotScreenIdRef.current = snapshotScreenId;
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
      // Separate from isScripting (not OR'd in — that also feeds
      // detectDirectorScriptOffAir). True while a beat-index advance has
      // committed but runBeatEnter hasn't settled (LESSONS
      // topic-playback-alignment, 2026-07-22 beat-tab-mismatch race).
      beatEnterPending: transport.isBeatEnterPending?.(),
      retreatSyncing: transport.retreatSyncing, isPausingBeforeReveal: transport.isPausingBeforeReveal,
      journeyId: activeJourney?.id,
      beatId: currentBeat?.id,
      beatLabel: currentBeat?.label,
      touchpointKey: studioTouchpoint.key,
      touchpointLabel: studioTouchpoint.label,
      visibleProgress: `${studioProgress.visibleCount}/${studioProgress.totalFrames}`,
      playlist: studioPlaylist,
      transportStepToken: transport.transportStepToken, currentTabIndex: current,
      renderedScreenId: snapshotScreenId, expectedTabIndex: currentBeat?.protoTab != null ? studioTabToIndex(currentBeat.protoTab) : undefined,
      visibleCount: studioProgress.visibleCount, totalFrames: studioProgress.totalFrames,
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

  usePublishChatScenarioReveal(
    activeScreenScenario?.id,
    scenarioPlayback.visibleCount,
    stableChatPlaylistFrames
  );

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

    if (atFrameStart) {
      // React Chat scrolls `.chat__column`; Legacy still uses prototype pane.
      const chatHost = getPrototypeScrollRoot(screen) ?? scrollEl;
      if (chatHost) {
        scrollCameraToOrigin(chatHost, {
          instant: true,
          force: true,
          reason: "chat-scenario-at-start",
        });
      }
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
      if (!hasProjectPages || navPlaybackLockedRef.current || studioJourneyModeRef.current) return;
      const wasHub = hubOpen;
      const next = Math.max(0, Math.min(SCREENS.length - 1, i));
      if (!wasHub && next === current) return;

      runNavTransitionRef.current(() => {
        if (wasHub) wireApiRef.current?.saveHubScroll();
        wireApiRef.current?.closeAllPopups();
        syncJourneyBeatToScreen(next);
        setHubOpen(false);
        if (SCREENS[next]?.childIndex !== 10) {
          wireApiRef.current?.resetPrototypeScroll({ force: true });
        }
        setCurrent(next);
      });
    },
    [current, hasProjectPages, hubOpen, SCREENS, syncJourneyBeatToScreen]
  );
  goRef.current = go;

  const openHub = useCallback(() => {
    if (navPlaybackLockedRef.current || studioJourneyModeRef.current) return;
    if (!hasProjectPages) { setHubOpen(true); return; }
    runNavTransitionRef.current(() => {
      if (hubOpen) {
        wireApiRef.current?.saveHubScroll();
        setHubOpen(false);
        wireApiRef.current?.resetPrototypeScroll({ force: true });
        return;
      }

      wireApiRef.current?.closeAllPopups();
      wireApiRef.current?.savePrototypeScroll();
      playbackDiagHubNav({ reason: "user-nav-hub", source: "App.openHub" });
      setHubOpen(true);
    });
  }, [hasProjectPages, hubOpen]);

  const resetPrototype = useCallback(() => {
    if (navPlaybackLockedRef.current || studioJourneyModeRef.current) return;
    wireApiRef.current?.resetPrototype();
  }, []);

  const navLabel = !hasProjectPages || hubOpen ? HUB_LABEL : SCREENS[current]?.label ?? "";

  useInteractionInventoryRegistration({ projectId: studioProjectId, screens: SCREENS, hubLabel: HUB_LABEL, hubOpenRef, currentRef, goRef, hubRootRef: hubScrollElRef, screenRootRef: prototypeScrollElRef, wireApiRef });

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
    registerRecordingSnapshotProvider(() => {
      const snap = playbackSnapshotRef.current;
      // REC truth = live nav tab, not the parked journey beat's protoTab.
      const navProtoTab =
        snap.hubOpen || snap.currentTabIndex == null
          ? null
          : snap.currentTabIndex + 1;
      return {
        ...snap,
        protoTab: navProtoTab,
        journeyMode: studioJourneyModeRef.current,
        orchestraMode: orchestraModeId,
        counter:
          document
            .querySelector(".studio-nav-scenario__counter")
            ?.textContent?.trim() ?? null,
      };
    });
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

  const cjmMetadataById = useMemo(
    () =>
      buildCjmMetadataCatalog(studioJourneys, (journeyId) =>
        readPersistedRecordingForJourney(
          studioProjectId,
          studioPersonaId,
          journeyId
        ) ?? withPersistedJourneyPlaybackProof(studioProjectId, studioPersonaId, journeyId, studioPersona.journeyRecordings?.[journeyId])
      ),
    [studioJourneys, studioProjectId, studioPersonaId, studioPersona, cjmCompatibilityRevision]
  );

  const refuseTransportForIncompatibleCjm = useCallback(
    () => refuseIncompatibleCjm(cjmMetadataById[orchestraModeId], handlePlaybackDiagnostic),
    [cjmMetadataById, orchestraModeId, handlePlaybackDiagnostic]
  );

  const refreshJourneysAfterImport = useCallback(() => {
    resetBeatIndex();
    transportActionsRef.current.jumpToStart();
  }, [resetBeatIndex]);

  const handleDeleteRecordedCjm = useCallback(
    (journeyId: OrchestraModeId) => {
      if (!isDeletableRecordedJourneyId(journeyId)) return;
      const removed = removePersistedRecordedJourney(
        studioProjectId,
        studioPersonaId,
        journeyId
      );
      if (!removed) return;
      refreshJourneysAfterImport();
      if (orchestraModeId === journeyId) {
        const fallback = experienceToOrchestraModeId(
          orchestraModeToExperienceId(journeyId)
        );
        handleOrchestraModeChange(fallback);
      }
    },
    [
      handleOrchestraModeChange,
      orchestraModeId,
      refreshJourneysAfterImport,
      studioPersonaId,
      studioProjectId,
    ]
  );

  const onRecordingAddedAsCjm = useCallback(
    (_s: unknown, saved?: { journeyId: string }) => {
      refreshJourneysAfterImport();
      if (saved?.journeyId) {
        handleOrchestraModeChange(saved.journeyId, { previewCjm: true });
      }
    },
    [handleOrchestraModeChange, refreshJourneysAfterImport]
  );

  /** Saved-CJM Download — journey file JSON for the selected picker entry. */
  const exportSavedJourneyDownload = useCallback(
    () =>
      buildSavedJourneyDownload({
        journey:
          activeJourney ?? getJourneyForMode(studioJourneys, orchestraModeId),
        projectId: studioProjectId,
        personaId: studioPersonaId,
        recording: readPersistedRecordingForJourney(
          studioProjectId,
          studioPersonaId,
          (activeJourney ?? getJourneyForMode(studioJourneys, orchestraModeId))
            ?.id ?? ""
        ),
      }),
    [
      activeJourney,
      orchestraModeId,
      studioJourneys,
      studioPersonaId,
      studioProjectId,
    ]
  );

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
    setJourneyMode: (enabled) =>
      handleStudioJourneyModeChangeRef.current(enabled),
    setRecMode: handleStudioRecModeChange,
    setOrchestraMode: (modeId) =>
      handleOrchestraModeChangeRef.current(modeId as typeof orchestraModeId),
  });

  useEffect(() => {
    return registerJourneyMcpHelpers({
      projectId: studioProjectId,
      personaId: studioPersonaId,
      getJourneys: () => studioJourneys,
      getJourneyMetadata: (journeyId) => cjmMetadataById[journeyId],
      getActiveJourneyId: () => activeJourney?.id,
      onJourneysApplied: refreshJourneysAfterImport,
      onSelectJourney: (journeyId) => {
        setOrchestraModeId(journeyId);
        setStudioJourneyMode(true);
        setCreateNewCjmSelected(false);
      },
    });
  }, [
    activeJourney?.id,
    cjmMetadataById,
    refreshJourneysAfterImport,
    setOrchestraModeId,
    studioJourneys,
    studioPersonaId,
    studioProjectId,
  ]);

  useEffect(() => installStudioAuthSessionWindowApi(), []);

  useEffect(() => {
    registerPlaybackDiagnosticDismiss((source) => {
      const quiet =
        source === "qa-session-end" ||
        source === "force-clear" ||
        source === "soft-close" ||
        source === "self-test-end" ||
        source === "prove-wave-end" ||
        source === "session-finale" ||
        source.startsWith("qa-");
      if (!quiet) {
        acknowledgePlaybackDiagnosticStop(
          source === "consume" ? "consume-playback-diagnostic" : source
        );
      }
      recordPlaybackDiagnosticDismiss(source);
      cancelPlaybackScroll("replace");
      playbackScrollMonitor.reset();
      setPlaybackDiagnostic(null);
    });
    registerPlaybackDiagnosticForceClear(() => setPlaybackDiagnostic(null));
    const unregisterMcp = registerStudioMcpHelpers({
      dismissDiagnostic: (opts) => {
        if (opts?.acknowledgeStop !== false) {
          acknowledgePlaybackDiagnosticStop(opts?.note ?? "diagnostic-dismiss");
          recordPlaybackDiagnosticDismiss("acknowledge");
        } else {
          recordPlaybackDiagnosticDismiss("mcp-helper");
        }
        cancelPlaybackScroll("replace");
        playbackScrollMonitor.reset();
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
        screenId: snapshotScreenIdRef.current,
        beatId: playbackSnapshotRef.current.beatId ?? null,
        availStep: playbackSnapshotRef.current.availStep ?? null,
      }),
      getOrchestraModeId: () => orchestraModeId,
      hasOrchestraMode: (modeId) => resolveJourneyForOrchestraMode(modeId) != null,
      setOrchestraMode: (modeId) => handleOrchestraModeChangeRef.current(modeId),
      setJourneyMode: (enabled) =>
        handleStudioJourneyModeChangeRef.current(enabled),
      triggerTransport: (action) => {
        if (
          (action === "play" ||
            action === "step-forward" ||
            action === "step-back" ||
            action === "jump-to-end") &&
          (refuseTransportForIncompatibleCjm() || refusePlayIfQaBlocks())
        ) {
          return false;
        }
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
        return true;
      },
    });
    return () => {
      registerPlaybackDiagnosticDismiss(null);
      registerPlaybackDiagnosticForceClear(null);
      unregisterMcp();
    };
  }, [orchestraModeId, refuseTransportForIncompatibleCjm]);

  useEffect(() => {
    // PRODUCT UI chrome — Studio tabs strip (not journey/REC camera SSoT).
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
    runNavTransitionRef.current(() => {
      // Screen navigation and transient-UI teardown are one shell commit. This
      // prevents any project modal from painting over its destination—or
      // exposing the source page alone—regardless of who requested navigation.
      wireApiRef.current?.closeAllPopups();
      setCurrent(index);
    });
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
          // Cancel = acknowledge → hard-stop Play + latch (same class as overlay Alarm).
          acknowledgePlaybackDiagnosticStop("overlay-cancel");
          recordPlaybackDiagnosticDismiss("overlay");
          cancelPlaybackScroll("replace");
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
        cjmMetadata={cjmMetadataById}
        projectId={studioProjectId} projectLabel={studioProject.label}
        contentRef={appContentRef}
        tabsScrollRef={tabsScrollRef}
        tabBtnRefs={tabBtnRefs}
        onOpenHub={openHub}
        onGo={go}
        onReset={resetPrototype}
        scenarioControls={
          hasProjectPages && showOrchestraControls ? (
            <StudioNavScenarioControls
              studioMenus={
                <div className="studio-nav-studio-menus">
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
                    onCreateNewSelectedChange={setCreateNewCjmSelected}
                    recMode={studioRecMode}
                    onRequestRecMode={handleStudioRecModeChange}
                    recModeLocked={studioRecModeLocked}
                    onDeleteMode={handleDeleteRecordedCjm}
                    metadataById={cjmMetadataById}
                    deployedJourneyIds={studioPersona.journeys.map((journey) => journey.id)}
                  />
                </div>
              }
              createNewCjmSelected={createNewCjmSelected}
              recMode={studioRecMode}
              onRecModeChange={handleStudioRecModeChange}
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
                // Jump-to-start = fresh cassette — clear stale FAIL modal / freeze
                // so Play is not stuck on "Ack/consume first".
                clearQaPlaybackBlocksForReset("qa-journey-reset");
                notePlaybackTransport("jump-to-start");
                playbackCursorMonitor.noteManualTransport("jump-to-start");
                playbackViewportMonitor.noteManualTransport("jump-to-start");
                // Product: first playable beat of active journey (never hub).
                transport.jumpToStart();
                if (SCREENS[current]?.childIndex !== 10) {
                  wireApiRef.current?.resetPrototypeScroll({ force: true });
                }
              }}
              onStepBack={() => {
                if (refuseTransportForIncompatibleCjm() || refusePlayIfQaBlocks()) return;
                notePlaybackTransport("step-back");
                playbackCursorMonitor.noteManualTransport("step-back");
                playbackViewportMonitor.noteManualTransport("step-back");
                transport.stepBack();
              }}
              onPlay={() => {
                if (refuseTransportForIncompatibleCjm() || refusePlayIfQaBlocks()) return;
                notePlaybackTransport("play");
                playbackCursorMonitor.noteManualTransport("play");
                playbackViewportMonitor.noteManualTransport("play");
                transport.play();
              }}
              onStepForward={() => {
                if (refuseTransportForIncompatibleCjm() || refusePlayIfQaBlocks()) return;
                notePlaybackTransport("step-forward");
                playbackCursorMonitor.noteManualTransport("step-forward");
                playbackViewportMonitor.noteManualTransport("step-forward");
                transport.stepForward();
              }}
              onJumpToEnd={() => {
                if (refuseTransportForIncompatibleCjm() || refusePlayIfQaBlocks()) return;
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
                  onSaveAsJourney={onRecordingAddedAsCjm}
                  createNewCjmSelected={createNewCjmSelected}
                  onExportSavedJourney={exportSavedJourneyDownload}
                />
              }
            />
          ) : hasProjectPages ? (
            <div className="studio-nav-scenario">
              <StudioNavRecordingModeSlot
                getStartOptions={getRecordingStartOptions}
                recModeLocked={navTransportLocked}
                onReplay={(session) =>
                  replayRecordingSession(session, replayRecordingOptions())
                }
                onSaveAsJourney={onRecordingAddedAsCjm}
                createNewCjmSelected={createNewCjmSelected}
                onExportSavedJourney={exportSavedJourneyDownload}
              />
            </div>
          ) : null
        }
        projectSelect={projectStudioSelect}
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
        {hasProjectPages && WireComponent ? (
          <WireComponent bridge={bridge} apiRef={wireApiRef} />
        ) : (
          <ProjectPlaceholder projectLabel={studioProject.label} />
        )}
      </div></div>
  );
}
