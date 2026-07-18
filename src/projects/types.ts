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

/** Project-owned script runners — shell dispatches beats through this, not hardcoded paths. */
export type ProtoProjectPlayback = {
  abortAll: () => void;
  runBeatAction: (actionId: JourneyBeatActionId, runtime: JourneyRuntime) => void;
  runHomeScript: (scriptId: HomeScriptId, options?: { skip?: boolean }) => Promise<void>;
  runAvailScript: (
    scriptId: AvailabilityScriptId,
    options?: { skip?: boolean }
  ) => Promise<boolean>;
  runBookScript: (
    scriptId: BookScriptId,
    options?: { skip?: boolean }
  ) => Promise<boolean>;
  runTabScript: (
    scriptId: TabScriptId,
    runtime: JourneyRuntime,
    options?: { skip?: boolean }
  ) => Promise<boolean>;
};

export type StudioSelectOption<T extends string = string> = {
  id: T;
  label: string;
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
  openAvailabilityTool: (intent?: AvailOpenIntent) => void;
  closeAvailabilityTool: () => void;
  handleAvailabilityBookNow: (
    store: { id: string; name: string; address: string },
    slot: ChosenBookingSlot
  ) => void;
  handleAvailabilityStepChange: (step: AvailStep) => void;
  applyDemoLocation: () => void;
  activeChildIndex: number | null;
  popupOnScreen: (...allowed: number[]) => boolean;
  childIndex: number;
  label: string;
  navLabel: string;
  isViewportLocked: boolean;
  isScreen1: boolean;
  isScreenChat: boolean;
  shouldFadeActiveScreen: boolean;
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
  resetToEndRef: MutableRefObject<() => void>;
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
