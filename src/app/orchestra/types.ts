/** Built-in CJM slots + free ids for recorded / imported journeys (`rec-…`). */
export type BuiltInOrchestraModeId = "agentic-cjm" | "traditional-cjm";
export type OrchestraModeId = BuiltInOrchestraModeId | (string & {});

export type JourneyBeatKind =
  | "screen-frames"
  | "tab-landing"
  | "overlay"
  /** First-class camera dwell + eased scroll (own STEPS slot; step-back reverses). */
  | "camera";

/**
 * Camera step — wait to show the page, then ease to a target.
 * Not buried in click `dwellMs` / `cameraSelectorChain` alone.
 */
export type JourneyBeatCamera = {
  /** Wait at current scroll before moving (show the page). Default 1200. */
  dwellMs?: number;
  /** After dwell, ease camera to this target (long pages use camera engine pacing). */
  selectorChain?: string[];
  anchorSelector?: string;
};

export type JourneyBeatActionId =
  | "open-availability-start"
  | "open-availability-date-chat"
  | "close-availability"
  | "apply-demo-location";

export type AvailabilityScriptId =
  | "select-location"
  | "continue-from-date"
  | "select-time-slot"
  | "book-now";

export type HomeScriptId = "sarah-query-submit";

export type BookScriptId =
  | "select-book-date"
  | "select-book-time"
  | "reserve-appointment";

/** Cursor-guided steps on prototype screens (Traditional CJM). */
export type TabScriptId =
  | "plp-open-pdp"
  | "pdp-book-now"
  | "login-sign-in"
  | "book-location-pick"
  | "confirmation-open-appointments"
  | "history-view-details";

/** Compiled from REC `demo-click` — CJM Step Forward runs demo cursor on the target. */
export type JourneyBeatRecordedClick = {
  selectorChain: string[];
  element?: string;
  /**
   * Blocking lightbox that must be open before this click (from REC `&modal=`).
   * Play applies via `applyStudioModal` before resolving the target.
   */
  modalId?: string;
  /**
   * Legacy: camera target from preceding scroll (buried on click).
   * Prefer a separate `kind: "camera"` beat — compile emits one when possible.
   */
  cameraSelectorChain?: string[];
  cameraAnchorSelector?: string;
};

export type JourneyBeat = {
  id: string;
  label: string;
  kind: JourneyBeatKind;
  /** Prototype tab number 1–9 (maps via studioTabToIndex). */
  protoTab?: number;
  scenarioId?: string;
  /** Auto-advance delay when play is active on tab-landing beats. */
  dwellMs?: number;
  onEnter?: JourneyBeatActionId;
  /** Cursor-guided Availability Tool step (overlay beats). */
  availScript?: AvailabilityScriptId;
  /** Agentic home — Sarah types a query and submits to chat. */
  homeScript?: HomeScriptId;
  /** Book step 2 — cursor-guided date, time, and reserve. */
  bookScript?: BookScriptId;
  /** Traditional path — cursor-guided interaction on the active tab. */
  tabScript?: TabScriptId;
  /**
   * Recorded product click (compile v2). Prefer over hollow tab-landing when
   * the session captured a usable `selectorChain`.
   */
  recordedClick?: JourneyBeatRecordedClick;
  /**
   * First-class camera dwell / scroll step (`kind: "camera"`).
   * Play: wait → eased scroll; step-back: reverse to pre-scroll top.
   */
  camera?: JourneyBeatCamera;
};

export type JourneyDefinition = {
  id: OrchestraModeId;
  label: string;
  beats: JourneyBeat[];
};

export type BrandPack = {
  id: string;
  label: string;
  journeys: JourneyDefinition[];
};

export type JourneyRuntime = {
  goToTab: (screenIndex: number, options?: { instant?: boolean }) => void;
  openAvailability: (intent?: unknown) => void;
  closeAvailability: () => void;
  closeAllPopups: () => void;
  applyDemoLocation: () => void;
  /** Open/close registered studio modal from URL / recording (`&modal=`). */
  applyStudioModal: (modalId: string | undefined) => void;
};

export type OrchestraModeOption = {
  id: OrchestraModeId;
  label: string;
};
