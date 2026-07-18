import type { JourneyBeat } from "@/app/orchestra/types";

export type PlaybackStudioSnapshot = {
  projectId?: string;
  personaId?: string;
  orchestraModeId?: string;
  journeyId?: string;
  beatIndex?: number;
  beatCount?: number;
  beatId?: string;
  beatLabel?: string;
  protoTab?: number | null;
  currentTabIndex?: number;
  childIndex?: number | null;
  touchpointKey?: string;
  touchpointLabel?: string;
  scenarioProgress?: string;
  hubOpen?: boolean;
  availabilityOpen?: boolean;
  availStep?: string | null;
  loginPopupOpen?: boolean;
  vaccinePickerOpen?: boolean;
  recipientPickerOpen?: boolean;
  quickViewOpen?: boolean;
};

export function buildPlaybackStudioSnapshot(options: {
  projectId: string;
  personaId: string;
  orchestraModeId?: string;
  journeyId?: string;
  beatIndex: number;
  beatCount: number;
  currentBeat?: JourneyBeat;
  currentTabIndex: number;
  childIndex: number | null;
  touchpointKey?: string;
  touchpointLabel?: string;
  scenarioProgress?: string;
  hubOpen: boolean;
  wire?: {
    availabilityOpen?: boolean;
    availActiveStep?: string | null;
    availIntent?: { step?: string };
    loginPopupOpen?: boolean;
    vaccinePickerOpen?: boolean;
    recipientPickerOpen?: boolean;
    quickViewOpen?: boolean;
  } | null;
}): PlaybackStudioSnapshot {
  const { currentBeat, wire } = options;
  return {
    projectId: options.projectId,
    personaId: options.personaId,
    orchestraModeId: options.orchestraModeId,
    journeyId: options.journeyId,
    beatIndex: options.beatIndex,
    beatCount: options.beatCount,
    beatId: currentBeat?.id,
    beatLabel: currentBeat?.label,
    protoTab: currentBeat?.protoTab ?? null,
    currentTabIndex: options.currentTabIndex,
    childIndex: options.childIndex,
    touchpointKey: options.touchpointKey,
    touchpointLabel: options.touchpointLabel,
    scenarioProgress: options.scenarioProgress,
    hubOpen: options.hubOpen,
    availabilityOpen: wire?.availabilityOpen ?? false,
    availStep:
      wire?.availActiveStep ??
      (wire?.availabilityOpen ? wire?.availIntent?.step ?? null : null),
    loginPopupOpen: wire?.loginPopupOpen ?? false,
    vaccinePickerOpen: wire?.vaccinePickerOpen ?? false,
    recipientPickerOpen: wire?.recipientPickerOpen ?? false,
    quickViewOpen: wire?.quickViewOpen ?? false,
  };
}

export function enrichPlaybackDiagnosticSnapshot<
  T extends { context: { snapshot?: PlaybackStudioSnapshot } },
>(error: T, snapshot: PlaybackStudioSnapshot): T {
  return {
    ...error,
    context: {
      ...error.context,
      snapshot,
    },
  };
}
