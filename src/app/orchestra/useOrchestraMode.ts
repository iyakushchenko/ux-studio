import { useCallback, useMemo, useState } from "react";
import { getJourneyForMode } from "@/app/orchestra/brands/bootsSarahJourney";
import {
  PROTO_ORCHESTRA_MODE_OPTIONS,
  readStoredOrchestraMode,
  storeOrchestraMode,
} from "@/app/orchestra/protoOrchestraModes";
import type { ProtoBrandPack, ProtoOrchestraModeId } from "@/app/orchestra/types";

export function useOrchestraMode(brandPack: ProtoBrandPack) {
  const [modeId, setModeIdState] = useState<ProtoOrchestraModeId>(readStoredOrchestraMode);
  const [beatIndex, setBeatIndex] = useState(0);

  const journey = useMemo(
    () => getJourneyForMode(brandPack, modeId),
    [brandPack, modeId]
  );

  const isCjmMode = modeId === "agentic-cjm" || modeId === "traditional-cjm";

  const modeLabel =
    PROTO_ORCHESTRA_MODE_OPTIONS.find((m) => m.id === modeId)?.label ?? "Chat experience";

  const setModeId = useCallback((next: ProtoOrchestraModeId) => {
    setModeIdState(next);
    storeOrchestraMode(next);
    setBeatIndex(0);
  }, []);

  const resetBeatIndex = useCallback(() => {
    setBeatIndex(0);
  }, []);

  return {
    modeId,
    setModeId,
    modeLabel,
    modes: PROTO_ORCHESTRA_MODE_OPTIONS,
    journey,
    isCjmMode,
    beatIndex,
    setBeatIndex,
    resetBeatIndex,
  };
}
