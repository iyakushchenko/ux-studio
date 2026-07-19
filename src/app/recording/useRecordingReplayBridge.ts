import { useCallback, useEffect, useRef, type MutableRefObject } from "react";
import type { JourneyBeatActionId, JourneyRuntime } from "@/app/orchestra/types";
import {
  ensureRecordingHumanClickCapture,
  resolvePlaybackSelectorChain,
} from "@/app/recording/recordingCapture";
import { registerRecordingMcpHelpers } from "@/app/recording/recordingMcpHelpers";
import { applyRecordingProjectScript } from "@/app/recording/recordingScriptApply";
import type { RecordingReplayOptions } from "@/app/recording/recordingTypes";
import type { StartRecordingOptions } from "@/app/recording/recordingSession";
import type { ManualTransportAction } from "@/app/shell/playbackInteractionContext";
import { simulateDemoPointerClick } from "@/app/scenario/demoCursor";
import {
  resolveClickTargetRespectingModal,
  STUDIO_MODAL,
} from "@/app/shell/studioModalGuard";
import { applyStudioScreen } from "@/app/shell/studioUrl";
import { retreatScriptOptions } from "@/projects/playbackScriptOptions";
import type { ProjectPlayback } from "@/projects/types";

const JOURNEY_BEAT_ACTION_IDS = new Set<JourneyBeatActionId>([
  "open-availability-start",
  "open-availability-date-chat",
  "close-availability",
  "apply-demo-location",
]);

function isJourneyBeatActionId(id: string): id is JourneyBeatActionId {
  return JOURNEY_BEAT_ACTION_IDS.has(id as JourneyBeatActionId);
}

export type RecordingTransportActions = {
  play: () => void;
  stepBack: () => void;
  stepForward: () => void;
  jumpToStart: () => void;
  jumpToEnd: () => void;
};

export type RecordingScreenNavApi = {
  screens: ReadonlyArray<{ screenId?: string; childIndex: number }>;
  projectId: string;
  personaId: string;
  modeId: string | null;
  setProjectId: (id: string) => void;
  setPersonaId: (id: string) => void;
  setModeId: (id: string) => void;
  setCurrent: (index: number) => void;
  setHubOpen: (open: boolean) => void;
};

/**
 * App-facing recording replay wiring — transport / screen / demo-click /
 * wire-intent / director-script + human click capture + MCP helpers.
 */
export function useRecordingReplayBridge(options: {
  transportActionsRef: MutableRefObject<RecordingTransportActions>;
  screenNav: RecordingScreenNavApi;
  journeyRuntime: JourneyRuntime;
  projectPlayback: ProjectPlayback;
  getStartOptions: () => StartRecordingOptions;
  /** After Save as journey / MCP save — refresh beat index + transport. */
  onJourneySaved?: () => void;
}): {
  replayRecordingOptions: () => RecordingReplayOptions;
} {
  const {
    transportActionsRef,
    screenNav,
    journeyRuntime,
    projectPlayback,
    getStartOptions,
    onJourneySaved,
  } = options;

  const screensRef = useRef(screenNav.screens);
  const studioProjectIdRef = useRef(screenNav.projectId);
  const studioPersonaIdRef = useRef(screenNav.personaId);
  const orchestraModeIdRef = useRef(screenNav.modeId);
  screensRef.current = screenNav.screens;
  studioProjectIdRef.current = screenNav.projectId;
  studioPersonaIdRef.current = screenNav.personaId;
  orchestraModeIdRef.current = screenNav.modeId;

  const journeyRuntimeRef = useRef(journeyRuntime);
  journeyRuntimeRef.current = journeyRuntime;
  const projectPlaybackRef = useRef(projectPlayback);
  projectPlaybackRef.current = projectPlayback;

  const setProjectIdRef = useRef(screenNav.setProjectId);
  const setPersonaIdRef = useRef(screenNav.setPersonaId);
  const setModeIdRef = useRef(screenNav.setModeId);
  const setCurrentRef = useRef(screenNav.setCurrent);
  const setHubOpenRef = useRef(screenNav.setHubOpen);
  setProjectIdRef.current = screenNav.setProjectId;
  setPersonaIdRef.current = screenNav.setPersonaId;
  setModeIdRef.current = screenNav.setModeId;
  setCurrentRef.current = screenNav.setCurrent;
  setHubOpenRef.current = screenNav.setHubOpen;

  const triggerRecordingTransport = useCallback((action: ManualTransportAction) => {
    switch (action) {
      case "play":
        transportActionsRef.current.play();
        break;
      case "step-back":
        transportActionsRef.current.stepBack();
        break;
      case "step-forward":
        transportActionsRef.current.stepForward();
        break;
      case "jump-to-start":
        transportActionsRef.current.jumpToStart();
        break;
      case "jump-to-end":
        transportActionsRef.current.jumpToEnd();
        break;
    }
  }, [transportActionsRef]);

  const applyModalFromUrl = useCallback((modalId: string | undefined) => {
    const runtime = journeyRuntimeRef.current;
    if (modalId === STUDIO_MODAL.choosePharmacy) {
      runtime.openAvailability({
        step: "list",
        query: "London",
        pickLocation: true,
      });
    } else {
      runtime.closeAvailability();
    }
  }, []);

  const applyRecordingScreen = useCallback(
    (event: { screenId: string; projectId?: string; studioUrl?: string }) => {
      const result = applyStudioScreen({
        studioUrl: event.studioUrl,
        screenId: event.screenId,
        projectId: event.projectId ?? studioProjectIdRef.current,
        personaId: studioPersonaIdRef.current,
        modeId: orchestraModeIdRef.current,
        screens: screensRef.current,
        currentProjectId: studioProjectIdRef.current,
        setProjectId: setProjectIdRef.current,
        setPersonaId: setPersonaIdRef.current,
        setModeId: setModeIdRef.current,
        setCurrent: setCurrentRef.current,
        setHubOpen: setHubOpenRef.current,
        applyModal: applyModalFromUrl,
        syncUrl: true,
      });
      if (!result.applied) {
        throw new Error(`Unknown screen: ${event.screenId}`);
      }
      return true;
    },
    [applyModalFromUrl]
  );

  const applyRecordingDemoClick = useCallback(
    async (event: {
      element: string;
      selectorChain?: string[];
      beatId?: string;
      touchpointKey?: string;
    }) => {
      const resolved = resolvePlaybackSelectorChain(
        event.selectorChain,
        document
      );
      const target = resolveClickTargetRespectingModal(resolved, {
        resolveInModal: (modal) =>
          resolvePlaybackSelectorChain(event.selectorChain, modal),
      });
      if (!target) return false;
      return simulateDemoPointerClick(target, { scroll: false });
    },
    []
  );

  const applyRecordingWireIntent = useCallback(
    async (event: { intentId: string; payload?: Record<string, unknown> }) => {
      if (event.intentId === "retreat-sync") {
        const scriptId =
          typeof event.payload?.scriptId === "string"
            ? event.payload.scriptId
            : undefined;
        const scriptKind =
          typeof event.payload?.scriptKind === "string"
            ? event.payload.scriptKind
            : undefined;
        if (!scriptId) return false;
        return applyRecordingProjectScript(
          { scriptId, scriptKind },
          projectPlaybackRef.current,
          journeyRuntimeRef.current,
          retreatScriptOptions(true)
        );
      }
      if (!isJourneyBeatActionId(event.intentId)) return false;
      projectPlaybackRef.current.runBeatAction(
        event.intentId,
        journeyRuntimeRef.current
      );
      return true;
    },
    []
  );

  const applyRecordingDirectorScript = useCallback(
    async (event: {
      scriptId: string;
      scriptKind?: string;
      beatId?: string;
      manual?: boolean;
    }) => {
      return applyRecordingProjectScript(
        { scriptId: event.scriptId, scriptKind: event.scriptKind },
        projectPlaybackRef.current,
        journeyRuntimeRef.current
      );
    },
    []
  );

  const replayRecordingOptions = useCallback(
    (): RecordingReplayOptions => ({
      triggerTransport: triggerRecordingTransport,
      applyScreen: applyRecordingScreen,
      applyDemoClick: applyRecordingDemoClick,
      applyWireIntent: applyRecordingWireIntent,
      applyDirectorScript: applyRecordingDirectorScript,
      stepDelayMs: 200,
    }),
    [
      applyRecordingDemoClick,
      applyRecordingDirectorScript,
      applyRecordingScreen,
      applyRecordingWireIntent,
      triggerRecordingTransport,
    ]
  );

  useEffect(() => {
    return ensureRecordingHumanClickCapture();
  }, []);

  const onJourneySavedRef = useRef(onJourneySaved);
  onJourneySavedRef.current = onJourneySaved;

  useEffect(() => {
    return registerRecordingMcpHelpers({
      getDefaultStartOptions: () => ({
        ...getStartOptions(),
        metadata: { recordedFrom: "mcp" },
      }),
      ...replayRecordingOptions(),
      onJourneySaved: () => onJourneySavedRef.current?.(),
    });
  }, [getStartOptions, replayRecordingOptions]);

  return { replayRecordingOptions };
}
