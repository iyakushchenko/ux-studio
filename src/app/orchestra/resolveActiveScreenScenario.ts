import {
  getProtoScenarioById,
  getProtoScenarioForChildIndex,
  type ProtoScenarioScreenConfig,
} from "@/app/proto/protoScenarioEngine";
import { protoTabToIndex } from "@/app/proto/protoScreens";
import { getJourneyForMode } from "@/app/orchestra/brands/bootsSarahJourney";
import type { ProtoBrandPack, ProtoOrchestraModeId } from "@/app/orchestra/types";

export function resolveActiveScreenScenario(options: {
  hubOpen: boolean;
  modeId: ProtoOrchestraModeId;
  beatIndex: number;
  currentTabIndex: number;
  currentChildIndex: number;
  brandPack: ProtoBrandPack;
}): ProtoScenarioScreenConfig | undefined {
  const { hubOpen, modeId, beatIndex, currentTabIndex, currentChildIndex, brandPack } =
    options;

  if (hubOpen) return undefined;

  if (modeId === "chat-experience") {
    return getProtoScenarioForChildIndex(currentChildIndex);
  }

  const journey = getJourneyForMode(brandPack, modeId);
  const beat = journey?.beats[beatIndex];
  if (beat?.kind !== "screen-frames" || !beat.scenarioId) return undefined;

  if (beat.protoTab != null && currentTabIndex !== protoTabToIndex(beat.protoTab)) {
    return undefined;
  }

  return getProtoScenarioById(beat.scenarioId);
}

export function orchestraShowControls(options: {
  hubOpen: boolean;
  modeId: ProtoOrchestraModeId;
  brandPack: ProtoBrandPack;
  screenTotalFrames: number;
  activeScreenScenario: ProtoScenarioScreenConfig | undefined;
}): boolean {
  const { hubOpen, modeId, brandPack, screenTotalFrames, activeScreenScenario } =
    options;

  if (hubOpen) return false;

  const isCjmMode = modeId === "agentic-cjm" || modeId === "traditional-cjm";
  if (isCjmMode) {
    return (getJourneyForMode(brandPack, modeId)?.beats.length ?? 0) > 0;
  }

  return activeScreenScenario != null && screenTotalFrames > 0;
}
