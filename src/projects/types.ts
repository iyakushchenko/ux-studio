import type { ComponentType, MutableRefObject, RefObject } from "react";
import type {
  AvailabilityScriptId,
  BookScriptId,
  HomeScriptId,
  JourneyBeat,
  JourneyBeatActionId,
  JourneyRuntime,
  ProtoJourneyDefinition,
  TabScriptId,
} from "@/app/orchestra/types";
import type { useProtoJourneyPlayback } from "@/app/orchestra/useProtoJourneyPlayback";
import type { useProtoScenarioPlayback } from "@/app/nav/useProtoScenarioPlayback";
import type { useProtoStudio } from "@/app/shell/useProtoStudio";
import type {
  AvailOpenIntent,
  AvailStep,
  ChosenBookingSlot,
} from "@/projects/boots-pharmacy/overlays/AvailabilityTool";
import type { ProtoScenarioScreenConfig } from "@/app/proto/protoScenarioEngine";
import type { PlaybackScriptResult } from "@/projects/playbackScriptResult";
import type { PlaybackScriptOptions } from "@/projects/playbackScriptOptions";

export type { PlaybackScriptOptions } from "@/projects/playbackScriptOptions";

export type StudioTouchpointEntry = {
  key: string;
  label: string;
};

/** e.g. `boots-pharmacy`, `boots`, `puma` */
export type ProtoProjectId = string;

/** e.g. `sarah-jenkins` */
export type ProtoPersonaId = string;

export type JourneyPlaybackContext = {
  headerLoggedIn: boolean;
};

export type JourneyPlaybackHooks = {
  /** Omit beat from timeline stepping and touchpoint playlist. */
  shouldSkipBeat?: (beat: JourneyBeat, context: JourneyPlaybackContext) => boolean;
};

export type ProtoPersonaDefinition = {
  id: ProtoPersonaId;
  label: string;
  journeys: ProtoJourneyDefinition[];
  journeyHooks?: JourneyPlaybackHooks;
};

export type RetreatSyncOptions = {
  /** Beat-enter / step-back sync — snap scroll and DOM with no eased camera moves. */
  instant?: boolean;
};

export type RetreatViewportGoal = {
  expectsAnchor: boolean;
  domGoalMet: boolean;
};

/** @deprecated Use PlaybackScriptOptions — kept for gradual migration. */
export type BookScriptOptions = PlaybackScriptOptions;

export type ProtoProjectPlayback = {
  abortAll: () => void;
  runBeatAction: (actionId: JourneyBeatActionId, runtime: JourneyRuntime) => void;
  runHomeScript: (
    scriptId: HomeScriptId,
    options?: PlaybackScriptOptions
  ) => Promise<PlaybackScriptResult>;
  runAvailScript: (
    scriptId: AvailabilityScriptId,
    options?: PlaybackScriptOptions
  ) => Promise<PlaybackScriptResult>;
  runBookScript: (
    scriptId: BookScriptId,
    options?: PlaybackScriptOptions
  ) => Promise<PlaybackScriptResult>;
  runTabScript: (
    scriptId: TabScriptId,
    runtime: JourneyRuntime,
    options?: PlaybackScriptOptions
  ) => Promise<PlaybackScriptResult>;
  /**
   * Dwell landing beats (no director script) — project restores screen baseline on step-back.
   * Shell routes script beats via run*Script({ syncState: true }); only dwell beats use this hook.
   */
  syncDwellRetreat?: (
    beat: JourneyBeat,
    options?: RetreatSyncOptions
  ) => Promise<void>;
  /** Optional DOM/scroll goal check after step-back (~520ms viewport guard). */
  checkRetreatViewportGoal?: (beat: JourneyBeat) => RetreatViewportGoal | null;
};

export type StudioSelectOption<T extends string = string> = {
  id: T;
  /** Full label in the dropdown panel. */
  label: string;
  /** Collapsed trigger text — defaults to label when omitted. */
  shortLabel?: string;
};

/** Product surface reported by the active project wire (popup + pristine state). */
export type ProtoProjectWireApi = {
  availabilityOpen: boolean;
  availActiveStep: AvailStep | null;
  availIntent: AvailOpenIntent;
  vaccinePickerOpen: boolean;
  recipientPickerOpen: boolean;
  loginPopupOpen: boolean;
  quickViewOpen: boolean;
  loggedInFlag: boolean;
  headerLoggedIn: boolean;
  chosenLocation: unknown;
  homeQueryDirty: boolean;
  chatComposerDirty: boolean;
  plpFiltersDirty: boolean;
  wirePristine: boolean;
  closeAllPopups: () => void;
  saveHubScroll: () => void;
  savePrototypeScroll: () => void;
  resetPrototypeScroll: () => void;
  resetPrototype: () => void;
  /** Soft-reset wire interaction state without a full page reload. */
  resetWireInteractionState: () => void;
  openAvailabilityTool: (intent?: AvailOpenIntent) => void;
  closeAvailabilityTool: () => void;
  handleAvailabilityBookNow: (
    store: { id: string; name: string; address: string },
    slot: ChosenBookingSlot
  ) => void;
  handleAvailabilityStepChange: (step: AvailStep) => void;
  applyDemoLocation: () => void;
  /** CJM step-back — snap Book Step 2 calendar to June 24 wire default. */
  syncBookStep2RetreatDefault?: (options?: { clearTime?: boolean }) => void;
  activeChildIndex: number | null;
  popupOnScreen: (...allowed: number[]) => boolean;
  childIndex: number;
  label: string;
  navLabel: string;
  isViewportLocked: boolean;
  isScreen1: boolean;
  isScreenChat: boolean;
  dynamicCSS: string;
};

/** Orchestra refs + playback handles shared between shell and wire. */
export type ProtoProjectOrchestraBridge = {
  activeScreenScenario: ProtoScenarioScreenConfig | null | undefined;
  scenarioPlayback: ReturnType<typeof useProtoScenarioPlayback>;
  transport: ReturnType<typeof useProtoJourneyPlayback>;
  journeyBeatIndexRef: MutableRefObject<number>;
  setJourneyBeatIndexRef: MutableRefObject<(index: number | ((prev: number) => number)) => void>;
  activeJourneyRef: MutableRefObject<ReturnType<typeof useProtoStudio>["journey"]>;
  openAvailabilityToolRef: MutableRefObject<(intent?: AvailOpenIntent) => void>;
  closeAvailabilityToolRef: MutableRefObject<() => void>;
  screenFadeChildRef: MutableRefObject<number | null>;
  resetToEndRef: MutableRefObject<
    (options?: { smooth?: boolean; force?: boolean }) => void
  >;
  triggerChatBrowseRevealRef: MutableRefObject<() => void>;
  retreatFromFinaleRef: MutableRefObject<() => void>;
  cancelPreRevealPauseRef: MutableRefObject<() => void>;
  scenarioVisibleCountRef: MutableRefObject<number>;
  availabilityWasOpenRef: MutableRefObject<boolean>;
  scenarioIsPlayingRef: MutableRefObject<boolean>;
  resumeJourneyPlayRef: MutableRefObject<() => void>;
};

/** Shell ↔ project bridge passed into the project wire view. */
export type ProtoProjectShellBridge = {
  projectId: ProtoProjectId;
  current: number;
  setCurrent: (index: number) => void;
  hubOpen: boolean;
  setHubOpen: (open: boolean) => void;
  studio: ReturnType<typeof useProtoStudio>;
  journeyPlayback: ReturnType<typeof useProtoJourneyPlayback>;
  scenarioPlayback: ReturnType<typeof useProtoScenarioPlayback>;
  activeScreenScenarioId?: string | null;
  showOrchestraControls: boolean;
  navPlaybackLocked: boolean;
  prototypeScrollElRef: RefObject<HTMLDivElement | null>;
  hubScrollElRef: RefObject<HTMLDivElement | null>;
  appContentRef: RefObject<HTMLDivElement | null>;
  tabsScrollRef: RefObject<HTMLDivElement | null>;
  tabBtnRefs: RefObject<(HTMLButtonElement | null)[]>;
  onResetPrototype: () => void;
  isProtoPristine: boolean;
  go: (index: number) => void;
  openHub: () => void;
  navPlaybackLockedRef: MutableRefObject<boolean>;
  goRef: MutableRefObject<(index: number) => void>;
  currentRef: MutableRefObject<number>;
  protoNavKey: string;
  onWireApiChange?: () => void;
  /** Browse mode — free screen navigation; chat uses static showcase playback. */
  studioJourneyMode: boolean;
  orchestra: ProtoProjectOrchestraBridge;
};

export type ProtoProjectWireComponent = ComponentType<{
  bridge: ProtoProjectShellBridge;
  apiRef?: MutableRefObject<ProtoProjectWireApi | null>;
}>;

export type ProtoProjectDefinition = {
  /** Canonical id — `brand-subbrand` or `brand` when no sub-brand. */
  id: ProtoProjectId;
  brand: string;
  subbrand?: string;
  /** Display label in studio project dropdown. */
  label: string;
  personas: ProtoPersonaDefinition[];
  defaultPersonaId: ProtoPersonaId;
  /** Optional popup rows in the studio touchpoint timeline per journey + beat. */
  popupTouchpoints?: Record<string, Record<string, StudioTouchpointEntry[]>>;
  playback: ProtoProjectPlayback;
  /** Renders project DOM, popups, and screen wiring inside the shell layout. */
  wireComponent?: ProtoProjectWireComponent;
};
