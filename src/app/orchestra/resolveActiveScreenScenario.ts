import {
  getProtoScenarioById,
  getProtoScenarioForChildIndex,
  type ProtoScenarioScreenConfig,
} from "@/app/proto/protoScenarioEngine";
import { getJourneyForMode } from "@/app/orchestra/journeyUtils";
import type { ProtoOrchestraModeId, ProtoJourneyDefinition } from "@/app/orchestra/types";

export function resolveActiveScreenScenario(options: {
  hubOpen: boolean;
  modeId: ProtoOrchestraModeId;
  beatIndex: number;
  currentTabIndex: number;
  /** Screen childIndex from PROTO_SCREENS — enables browse-mode chat disclosure. */
  currentChildIndex?: number | null;
  /** CJM off — stepped scenarios reveal full content on the active screen. */
  browseMode?: boolean;
  journeys: ProtoJourneyDefinition[];
  scenarioScreens: readonly ProtoScenarioScreenConfig[];
  protoTabToIndex: (tab: number) => number;
}): ProtoScenarioScreenConfig | undefined {
  const {
    hubOpen,
    modeId,
    beatIndex,
    currentTabIndex,
    currentChildIndex,
    browseMode,
    journeys,
    scenarioScreens,
    protoTabToIndex,
  } = options;

  if (hubOpen) return undefined;

  const journey = getJourneyForMode(journeys, modeId);
  const beat = journey?.beats[beatIndex];
  if (beat?.kind === "screen-frames" && beat.scenarioId) {
    if (
      beat.protoTab == null ||
      currentTabIndex === protoTabToIndex(beat.protoTab)
    ) {
      const resolved = getProtoScenarioById(scenarioScreens, beat.scenarioId);
      if (resolved) return resolved;
    }
  }

  if (browseMode && currentChildIndex != null) {
    return getProtoScenarioForChildIndex(scenarioScreens, currentChildIndex);
  }

  return undefined;
}

export function orchestraShowControls(options: {
  hubOpen: boolean;
  modeId: ProtoOrchestraModeId;
  journeys: ProtoJourneyDefinition[];
}): boolean {
  const { hubOpen, modeId, journeys } = options;

  if (hubOpen) return false;

  return (getJourneyForMode(journeys, modeId)?.beats.length ?? 0) > 0;
}
