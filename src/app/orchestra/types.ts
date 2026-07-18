export type ProtoOrchestraModeId = "agentic-cjm" | "traditional-cjm";

export type JourneyBeatKind = "screen-frames" | "tab-landing" | "overlay";

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

export type JourneyBeat = {
  id: string;
  label: string;
  kind: JourneyBeatKind;
  /** Prototype tab number 1–9 (maps via protoTabToIndex). */
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
};

export type ProtoJourneyDefinition = {
  id: ProtoOrchestraModeId;
  label: string;
  beats: JourneyBeat[];
};

export type ProtoBrandPack = {
  id: string;
  label: string;
  journeys: ProtoJourneyDefinition[];
};

export type JourneyRuntime = {
  goToTab: (screenIndex: number, options?: { instant?: boolean }) => void;
  openAvailability: (intent?: unknown) => void;
  closeAvailability: () => void;
  closeAllPopups: () => void;
  applyDemoLocation: () => void;
};

export type OrchestraModeOption = {
  id: ProtoOrchestraModeId;
  label: string;
};
