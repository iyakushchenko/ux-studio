import { flashControlRoomButton } from "@/app/nav/protoControlRoomTap";

type Props = {
  /** false = Playback (left), true = Rec (right) */
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
};

/** FL-style mini toggle — REC off shares muted mode-switch chrome; on is red. */
export function ProtoStudioPlaybackRecSwitch({
  checked,
  onChange,
  disabled = false,
}: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={checked ? "REC on" : "REC off"}
      title={
        disabled
          ? "REC unavailable while AIR / playback is live"
          : checked
            ? "REC on — recording controls (playback transport hidden)"
            : "REC off — cassette transport (recording controls hidden)"
      }
      disabled={disabled}
      className={`proto-studio-mode-switch proto-studio-playback-rec-switch${
        checked ? " proto-studio-mode-switch--on" : ""
      }`}
      onClick={(event) => {
        flashControlRoomButton(
          event.currentTarget,
          "proto-studio-mode-switch--tap"
        );
        onChange(!checked);
      }}
    >
      <span className="proto-studio-mode-switch__track" aria-hidden>
        <span className="proto-studio-mode-switch__thumb" />
      </span>
    </button>
  );
}
