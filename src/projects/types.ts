import type { ComponentType, MutableRefObject, RefObject } from "react";
import type {
  AvailabilityScriptId,
  BookScriptId,
  HomeScriptId,
  JourneyBeat,
  JourneyBeatActionId,
  JourneyRuntime,
  JourneyDefinition,
  TabScriptId,
} from "@/app/orchestra/types";
import type { useJourneyPlayback } from "@/app/orchestra/useJourneyPlayback";
import type { useScenarioPlayback } from "@/app/nav/useScenarioPlayback";
import type { useStudio } from "@/app/shell/useStudio";
import type {
  AvailOpenIntent,
  AvailStep,
  ChosenBookingSlot,
} from "@/projects/boots-pharmacy/overlays/AvailabilityTool";
import type { ScenarioScreenConfig } from "@/app/scenario/scenarioEngine";
import type { PlaybackScriptResult } from "@/projects/playbackScriptResult";
import type { PlaybackScriptOptions } from "@/projects/playbackScriptOptions";

export type { PlaybackScriptOptions } from "@/projects/playbackScriptOptions";

export type StudioTouchpointEntry = {
  key: string;
  label: string;
};

/** e.g. `boots-pharmacy`, `boots`, `puma` */
export type ProjectId = string;

/** e.g. `sarah-jenkins` */
export type PersonaId = string;

export type JourneyPlaybackContext = {
  headerLoggedIn: boolean;
};

export type JourneyPlaybackHooks = {
  /** Omit beat from timeline stepping and touchpoint playlist. */
  shouldSkipBeat?: (beat: JourneyBeat, context: JourneyPlaybackContext) => boolean;
};

export type PersonaDefinition = {
  id: PersonaId;
  label: string;
  journeys: JourneyDefinition[];
  journeyHooks?: JourneyPlaybackHooks;
};

export type RetreatSyncOptions = {
  /** Beat-enter / step-back sync — snap scroll and DOM with no eased camera moves. */
  instant?: boolean;
  /**
   * Forward Play book-step2 landing — preserve Avail handoff (June 21 + 15:30)
   * so date/time beats can demo-change to a different slot. Step-back retreat
   * omits this and restores the wire default baseline.
   */
  preserveHandoff?: boolean;
};

export type RetreatViewportGoal = {
  expectsAnchor: boolean;
  domGoalMet: boolean;
};

export type RetreatSelectionGoal = {
  expectsSelection: boolean;
  domGoalMet: boolean;
  expected?: string;
  actual?: string;
};

/** @deprecated Use PlaybackScriptOptions — kept for gradual migration. */
export type BookScriptOptions = PlaybackScriptOptions;

export type ProjectPlayback = {
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
  checkRetreatViewportGoal?: (
    beat: JourneyBeat | undefined
  ) => RetreatViewportGoal | null;
  /** Optional date/time/overlay selection check after step-back (~520ms retreat guard). */
  checkRetreatSelectionGoal?: (
    beat: JourneyBeat | undefined
  ) => RetreatSelectionGoal | null;
};

export type StudioSelectOption<T extends string = string> = {
  id: T;
  /** Full label in the dropdown panel. */
  label: string;
  /** Collapsed trigger text — defaults to label when omitted. */
  shortLabel?: string;
};

/** Product surface reported by the active project wire (popup + pristine state). */
export type ProjectWireApi = {
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
  /** Registered modal openers — must update URL via shell sync (`&modal=`). */
  openQuickView: () => void;
  closeQuickView: () => void;
  openLoginPopup: (tab?: "signin" | "create") => void;
  closeLoginPopup: () => void;
  openVaccinePicker: () => void;
  closeVaccinePicker: () => void;
  openRecipientPicker: () => void;
  closeRecipientPicker: () => void;
  /** Deep-link / popstate / replay — open registered modal or clear all. */
  applyStudioModal: (modalId: string | undefined) => void;
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
export type ProjectOrchestraBridge = {
  activeScreenScenario: ScenarioScreenConfig | null | undefined;
  scenarioPlayback: ReturnType<typeof useScenarioPlayback>;
  transport: ReturnType<typeof useJourneyPlayback>;
  journeyBeatIndexRef: MutableRefObject<number>;
  setJourneyBeatIndexRef: MutableRefObject<(index: number | ((prev: number) => number)) => void>;
  activeJourneyRef: MutableRefObject<ReturnType<typeof useStudio>["journey"]>;
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
export type ProjectShellBridge = {
  projectId: ProjectId;
  current: number;
  setCurrent: (index: number) => void;
  hubOpen: boolean;
  setHubOpen: (open: boolean) => void;
  studio: ReturnType<typeof useStudio>;
  journeyPlayback: ReturnType<typeof useJourneyPlayback>;
  scenarioPlayback: ReturnType<typeof useScenarioPlayback>;
  activeScreenScenarioId?: string | null;
  showOrchestraControls: boolean;
  navPlaybackLocked: boolean;
  prototypeScrollElRef: RefObject<HTMLDivElement | null>;
  hubScrollElRef: RefObject<HTMLDivElement | null>;
  appContentRef: RefObject<HTMLDivElement | null>;
  tabsScrollRef: RefObject<HTMLDivElement | null>;
  tabBtnRefs: RefObject<(HTMLButtonElement | null)[]>;
  onResetPrototype: () => void;
  isStudioPristine: boolean;
  go: (index: number) => void;
  openHub: () => void;
  navPlaybackLockedRef: MutableRefObject<boolean>;
  goRef: MutableRefObject<(index: number) => void>;
  currentRef: MutableRefObject<number>;
  studioNavKey: string;
  onWireApiChange?: () => void;
  /** Browse mode — free screen navigation; chat uses static showcase playback. */
  studioJourneyMode: boolean;
  orchestra: ProjectOrchestraBridge;
};

export type ProjectWireComponent = ComponentType<{
  bridge: ProjectShellBridge;
  apiRef?: MutableRefObject<ProjectWireApi | null>;
}>;

export type ProjectDefinition = {
  /** Canonical id — `brand-subbrand` or `brand` when no sub-brand. */
  id: ProjectId;
  brand: string;
  subbrand?: string;
  /** Display label in studio project dropdown. */
  label: string;
  personas: PersonaDefinition[];
  defaultPersonaId: PersonaId;
  /** Optional popup rows in the studio touchpoint timeline per journey + beat. */
  popupTouchpoints?: Record<string, Record<string, StudioTouchpointEntry[]>>;
  playback: ProjectPlayback;
  /** Renders project DOM, popups, and screen wiring inside the shell layout. */
  wireComponent?: ProjectWireComponent;
};
