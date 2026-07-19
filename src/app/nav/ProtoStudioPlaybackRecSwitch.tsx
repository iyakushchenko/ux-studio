import { flashControlRoomButton } from "@/app/nav/protoControlRoomTap";

type Props = {
  /** false = Playback (left), true = Rec (right) */
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
};

/** FL-style mini toggle — Playback (blue) vs Rec (red); mirrors journey-mode switch. */
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
      aria-label={checked ? "Recording mode" : "Playback mode"}
      title={
        checked
          ? "Rec mode — recording controls (playback transport hidden)"
          : "Playback mode — cassette transport (recording controls hidden)"
      }
      disabled={disabled}
      className={`proto-studio-playback-rec-switch${
        checked ? " proto-studio-playback-rec-switch--on" : ""
      }`}
      onClick={(event) => {
        flashControlRoomButton(
          event.currentTarget,
          "proto-studio-playback-rec-switch--tap"
        );
        onChange(!checked);
      }}
    >
      <span className="proto-studio-playback-rec-switch__track" aria-hidden>
        <span className="proto-studio-playback-rec-switch__thumb" />
      </span>
    </button>
  );
}
