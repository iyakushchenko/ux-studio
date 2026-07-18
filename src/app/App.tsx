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
  DEFAULT_CHAT_SCENARIO_FRAMES,
} from "@/app/nav/resolveStudioTouchpoint";
import { useProtoScenarioPlayback, type PlaybackStepHooks } from "@/app/nav/useProtoScenarioPlayback";
import {
  orchestraShowControls,
  resolveActiveScreenScenario,
} from "@/app/orchestra/resolveActiveScreenScenario";
import {
  getJourneyForMode,
  resolveJourneyStartBeat,
} from "@/app/orchestra/journeyUtils";
import type { JourneyRuntime, ProtoJourneyDefinition, ProtoOrchestraModeId } from "@/app/orchestra/types";
import type { ProtoPersonaId, ProtoProjectId, ProtoProjectWireApi } from "@/projects/types";
import { useProtoJourneyPlayback } from "@/app/orchestra/useProtoJourneyPlayback";
import {
  createShouldSkipBeat,
  personaSelectOptions,
  projectSelectOptions,
  useProtoStudio,
} from "@/app/shell/useProtoStudio";
import { ProtoProjectPlaceholder } from "@/app/shell/ProtoProjectPlaceholder";
import {
  readStoredHubOpen,
  readStoredNavIndex,
  storeHubOpen,
  storeNavIndex,
  protoNavStorageKey,
} from "@/app/shell/protoNavStorage";
import { getProjectWire } from "@/projects/registry";
import type { AvailOpenIntent } from "@/projects/boots-pharmacy/overlays/AvailabilityTool";
import {
  collectSitePilotChatScenarioFrames,
  ensureSitePilotChatComposerDock,
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
  const onWireApiChange = useCallback(() => setWireTick((t) => t + 1), []);

  const hubScrollElRef = useRef<HTMLDivElement>(null);
  const prototypeScrollElRef = useRef<HTMLDivElement>(null);
  const appContentRef = useRef<HTMLDivElement>(null);
  const tabsScrollRef = useRef<HTMLDivElement>(null);
  const tabBtnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const wireApiRef = useRef<ProtoProjectWireApi | null>(null);
  const goRef = useRef<(i: number) => void>(() => {});
  const currentRef = useRef(current);
  const navPlaybackLockedRef = useRef(false);
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
      goToTab: (screenIndex: number) => {
        setCurrent(screenIndex);
      },
      openAvailability: (intent?: unknown) => {
        openAvailabilityToolRef.current(
          (intent as AvailOpenIntent | undefined) ?? AVAIL_INTENT.start
        );
      },
      closeAvailability: () => {
        closeAvailabilityToolRef.current();
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
        journeys: studioPersona.journeys,
        scenarioScreens: PROTO_SCENARIO_SCREENS,
        protoTabToIndex,
      }),
    [
      hubOpen,
      orchestraModeId,
      journeyBeatIndex,
      current,
      studioPersona.journeys,
      PROTO_SCENARIO_SCREENS,
      protoTabToIndex,
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
      activeScreenScenario?.id === "site-pilot-chat"
        ? sitePilotChatPlaybackHooks
        : undefined,
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
  });

  scenarioIsPlayingRef.current = scenarioPlayback.isPlaying;
  resumeJourneyPlayRef.current = journeyPlayback.resumeJourneyPlay;

  const transport = journeyPlayback;
  const navPlaybackLocked =
    transport.isPlaying || transport.isPausingBeforeReveal;
  navPlaybackLockedRef.current = navPlaybackLocked;

  const chatFramesForPlaylist =
    scenarioPlayback.totalFrames > 0
      ? scenarioPlayback.totalFrames
      : DEFAULT_CHAT_SCENARIO_FRAMES;

  const wire = wireApiRef.current;

  const studioPlaylist = useMemo(
    () =>
      buildStudioTouchpointPlaylist(activeJourney, chatFramesForPlaylist, {
        shouldSkipBeat: (beat) => shouldSkipBeat(beat),
        popupTouchpoints: studioProject.popupTouchpoints,
      }),
    [activeJourney, chatFramesForPlaylist, shouldSkipBeat, studioProject.popupTouchpoints]
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
        activeScreenScenario?.id === "site-pilot-chat"
          ? scenarioPlayback.visibleCount
          : undefined,
      chatFrameTotal: chatFramesForPlaylist,
      chatPausingBeforeReveal:
        activeScreenScenario?.id === "site-pilot-chat"
          ? scenarioPlayback.isPausingBeforeReveal
          : undefined,
      chatPlaybackThinking:
        activeScreenScenario?.id === "site-pilot-chat"
          ? isSitePilotChatPlaybackThinking()
          : undefined,
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
    chatFramesForPlaylist,
    SCREENS,
  ]);

  const studioProgress = useMemo(
    () => resolveStudioTouchpointProgress(studioPlaylist, studioTouchpoint.key),
    [studioPlaylist, studioTouchpoint.key]
  );

  const resetStudioPlayback = useCallback(() => {
    journeyPlayback.stopJourneyPlay();
    scenarioPlayback.resetToEnd();
    journeyPlayback.resetJourney();
    resetBeatIndex();
  }, [journeyPlayback, resetBeatIndex, scenarioPlayback]);

  const applyJourneyStartTab = useCallback(
    (journey: ProtoJourneyDefinition | undefined) => {
      const { beatIndex: startIndex, beat } = resolveJourneyStartBeat(
        journey,
        shouldSkipBeat
      );
      setJourneyBeatIndex(startIndex);
      if (beat?.protoTab != null) {
        setHubOpen(false);
        setCurrent(protoTabToIndex(beat.protoTab));
      }
    },
    [protoTabToIndex, setJourneyBeatIndex, shouldSkipBeat]
  );

  const handleOrchestraModeChange = useCallback(
    (next: ProtoOrchestraModeId) => {
      resetStudioPlayback();
      wireApiRef.current?.closeAllPopups();
      wireApiRef.current?.resetPrototypeScroll();

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
  const retreatFromFinaleRef = useRef(scenarioPlayback.retreatFromFinale);
  retreatFromFinaleRef.current = scenarioPlayback.retreatFromFinale;
  const cancelPreRevealPauseRef = useRef(scenarioPlayback.cancelPreRevealPause);
  cancelPreRevealPauseRef.current = scenarioPlayback.cancelPreRevealPause;
  const scenarioVisibleCountRef = useRef(scenarioPlayback.visibleCount);
  scenarioVisibleCountRef.current = scenarioPlayback.visibleCount;
  const availabilityWasOpenRef = useRef(false);

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
    SCREENS,
  ]);

  useLayoutEffect(() => {
    const scrollEl = prototypeScrollElRef.current;
    const atFrameStart =
      SCREENS[current]?.childIndex === 10 &&
      activeScreenScenario?.id === "site-pilot-chat" &&
      scenarioPlayback.visibleCount <= 1;

    scrollEl?.classList.toggle("proto-chat-scenario-at-start", atFrameStart);

    const screen = document.querySelector<HTMLElement>(
      ".proto-viewport > div > div:nth-child(10)"
    );
    if (screen) {
      if (atFrameStart) screen.setAttribute("data-proto-scenario-at-start", "true");
      else screen.removeAttribute("data-proto-scenario-at-start");
    }

    if (atFrameStart && scrollEl) {
      scrollEl.scrollTop = 0;
      scrollEl.scrollLeft = 0;
    }

    return () => {
      scrollEl?.classList.remove("proto-chat-scenario-at-start");
      screen?.removeAttribute("data-proto-scenario-at-start");
    };
  }, [current, activeScreenScenario?.id, scenarioPlayback.visibleCount, SCREENS]);

  const isProtoPristine =
    (wire?.wirePristine ?? true) && !transport.isDirty;

  const go = useCallback(
    (i: number) => {
      if (navPlaybackLockedRef.current) return;
      const wasHub = hubOpen;
      if (wasHub) wireApiRef.current?.saveHubScroll();
      const next = Math.max(0, Math.min(SCREENS.length - 1, i));
      if (wasHub || next !== current) {
        wireApiRef.current?.closeAllPopups();
      }
      setHubOpen(false);
      if (wasHub || next !== current) {
        if (SCREENS[next]?.childIndex !== 10) {
          wireApiRef.current?.resetPrototypeScroll();
        }
      }
      setCurrent(next);
    },
    [current, hubOpen, SCREENS]
  );
  goRef.current = go;

  const openHub = useCallback(() => {
    if (navPlaybackLockedRef.current) return;
    if (hubOpen) {
      wireApiRef.current?.saveHubScroll();
      setHubOpen(false);
      wireApiRef.current?.resetPrototypeScroll();
      return;
    }

    wireApiRef.current?.closeAllPopups();
    wireApiRef.current?.savePrototypeScroll();
    setHubOpen(true);
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

  const bridge = useMemo(
    () => ({
      projectId: studioProjectId,
      current,
      setCurrent,
      hubOpen,
      setHubOpen,
      studio,
      journeyPlayback,
      scenarioPlayback,
      activeScreenScenarioId: activeScreenScenario?.id ?? null,
      showOrchestraControls,
      navPlaybackLocked,
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
      navPlaybackLocked,
      isProtoPristine,
      go,
      openHub,
      resetPrototype,
      onWireApiChange,
      transport,
    ]
  );

  const WireComponent = getProjectWire(studioProjectId);

  return (
    <div
      className="proto-app-root flex flex-col h-full max-h-[100dvh] overflow-hidden"
      style={{ fontFamily: "'Open Sans', sans-serif" }}
    >

      <ProtoNavPanel
        screens={SCREENS}
        hubLabel={PROTO_HUB_LABEL}
        current={current}
        hubOpen={hubOpen}
        navLabel={navLabel}
        isProtoPristine={isProtoPristine}
        navPlaybackLocked={navPlaybackLocked}
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
                  <ProtoNavStudioSelect
                    options={projectSelectOptions(studioProjects)}
                    value={studioProjectId}
                    onChange={handleStudioProjectChange}
                    ariaLabel="Project"
                    isPlaying={transport.isPlaying}
                    controlsLocked={transport.isPausingBeforeReveal}
                  />
                  <ProtoNavStudioSelect
                    options={personaSelectOptions(studioProject)}
                    value={studioPersonaId}
                    onChange={handleStudioPersonaChange}
                    ariaLabel="Persona"
                    isPlaying={transport.isPlaying}
                    controlsLocked={transport.isPausingBeforeReveal}
                  />
                  <ProtoNavJourneyMenu
                    modes={orchestraModes}
                    value={orchestraModeId}
                    onChange={handleOrchestraModeChange}
                    isPlaying={transport.isPlaying}
                    controlsLocked={transport.isPausingBeforeReveal}
                  />
                </div>
              }
              segmentLabel={studioTouchpoint.label}
              touchpointKey={studioTouchpoint.key}
              visibleCount={studioProgress.visibleCount}
              totalFrames={studioProgress.totalFrames}
              isPlaying={transport.isPlaying}
              isOnAir={transport.isOnAir}
              playbackEndToken={Math.max(
                journeyPlayback.playbackEndToken,
                scenarioPlayback.playbackEndToken
              )}
              canStepBack={transport.canStepBack}
              canStepForward={transport.canStepForward}
              canJumpToStart={transport.canJumpToStart}
              canPlay={transport.canPlay}
              canJumpToEnd={transport.canJumpToEnd}
              onJumpToStart={transport.jumpToStart}
              onStepBack={transport.stepBack}
              onPlay={transport.play}
              onStepForward={transport.stepForward}
              onJumpToEnd={transport.jumpToEnd}
            />
          ) : null
        }
      />

      {WireComponent ? (
        <WireComponent bridge={bridge} apiRef={wireApiRef} />
      ) : (
        <ProtoProjectPlaceholder projectLabel={studioProject.label} />
      )}
    </div>
  );
}
