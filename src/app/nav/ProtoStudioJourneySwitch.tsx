import { flashControlRoomButton } from "@/app/nav/protoControlRoomTap";

type Props = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  /** Optional override when locked by REC / AIR (clearer than generic off title). */
  disabledTitle?: string;
};

/** FL-style mini toggle — locks screen nav when on; cassette deck stays live. */
export function ProtoStudioJourneySwitch({
  checked,
  onChange,
  disabled = false,
  disabledTitle,
}: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label="CJM"
      title={
        disabled && disabledTitle
          ? disabledTitle
          : checked
            ? "CJM on — use cassette transport"
            : "CJM off — free screen navigation"
      }
      disabled={disabled}
      className={`proto-studio-mode-switch proto-studio-journey-switch${
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
