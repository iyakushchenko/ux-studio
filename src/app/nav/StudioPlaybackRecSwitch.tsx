import { flashControlRoomButton } from "@/app/nav/controlRoomTap";
import {
  recModeLockTitle,
  type RecModeLockReason,
} from "@/app/nav/studioModeXor";

type Props = {
  /** false = Playback (left), true = Rec (right) */
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  /** Why REC is locked — drives disabled tooltip (CJM vs AIR). */
  lockReason?: RecModeLockReason | null;
};

/** FL-style mini toggle — REC off shares muted mode-switch chrome; on is red. */
export function StudioPlaybackRecSwitch({
  checked,
  onChange,
  disabled = false,
  lockReason = null,
}: Props) {
  const disabledTitle = recModeLockTitle(lockReason) ||
    "REC unavailable while AIR / playback is live";
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={checked ? "REC on" : "REC off"}
      title={
        disabled
          ? disabledTitle
          : checked
            ? "REC on — recording controls (playback transport hidden)"
            : "REC off — cassette transport (recording controls hidden)"
      }
      disabled={disabled}
      className={`studio-mode-switch studio-playback-rec-switch${
        checked ? " studio-mode-switch--on" : ""
      }`}
      onClick={(event) => {
        flashControlRoomButton(
          event.currentTarget,
          "studio-mode-switch--tap"
        );
        onChange(!checked);
      }}
    >
      <span className="studio-mode-switch__track" aria-hidden>
        <span className="studio-mode-switch__thumb" />
      </span>
    </button>
  );
}
