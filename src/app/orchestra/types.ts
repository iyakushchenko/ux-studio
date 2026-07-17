export type ProtoOrchestraModeId =
  | "chat-experience"
  | "agentic-cjm"
  | "traditional-cjm";

export type JourneyBeatKind = "screen-frames" | "tab-landing" | "overlay";

export type JourneyBeatActionId =
  | "open-availability-start"
  | "close-availability";

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
  goToTab: (screenIndex: number) => void;
  openAvailability: (intent?: unknown) => void;
  closeAvailability: () => void;
};

export type OrchestraModeOption = {
  id: ProtoOrchestraModeId;
  label: string;
};
