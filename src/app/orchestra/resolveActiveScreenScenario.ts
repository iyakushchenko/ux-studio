import {
  getProtoScenarioById,
  type ProtoScenarioScreenConfig,
} from "@/app/proto/protoScenarioEngine";
import { getJourneyForMode } from "@/app/orchestra/journeyUtils";
import type { ProtoOrchestraModeId, ProtoJourneyDefinition } from "@/app/orchestra/types";

export function resolveActiveScreenScenario(options: {
  hubOpen: boolean;
  modeId: ProtoOrchestraModeId;
  beatIndex: number;
  currentTabIndex: number;
  journeys: ProtoJourneyDefinition[];
  scenarioScreens: readonly ProtoScenarioScreenConfig[];
  protoTabToIndex: (tab: number) => number;
}): ProtoScenarioScreenConfig | undefined {
  const {
    hubOpen,
    modeId,
    beatIndex,
    currentTabIndex,
    journeys,
    scenarioScreens,
    protoTabToIndex,
  } = options;

  if (hubOpen) return undefined;

  const journey = getJourneyForMode(journeys, modeId);
  const beat = journey?.beats[beatIndex];
  if (beat?.kind !== "screen-frames" || !beat.scenarioId) return undefined;

  if (beat.protoTab != null && currentTabIndex !== protoTabToIndex(beat.protoTab)) {
    return undefined;
  }

  return getProtoScenarioById(scenarioScreens, beat.scenarioId);
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
