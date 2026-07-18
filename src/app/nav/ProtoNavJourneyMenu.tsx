import type { OrchestraModeOption, ProtoOrchestraModeId } from "@/app/orchestra/types";
import { ProtoNavStudioSelect } from "@/app/nav/ProtoNavStudioSelect";

type Props = {
  modes: OrchestraModeOption[];
  value: ProtoOrchestraModeId;
  onChange: (modeId: ProtoOrchestraModeId) => void;
  isPlaying?: boolean;
  /** Locks mode switch during cursor / type-in animations. */
  controlsLocked?: boolean;
};

export function ProtoNavJourneyMenu({
  modes,
  value,
  onChange,
  isPlaying,
  controlsLocked = false,
}: Props) {
  return (
    <ProtoNavStudioSelect
      options={modes}
      value={value}
      onChange={onChange}
      ariaLabel="Journey mode"
      liveLabel="Live"
      isPlaying={isPlaying}
      controlsLocked={controlsLocked}
    />
  );
}
