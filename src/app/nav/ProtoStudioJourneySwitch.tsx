import { flashControlRoomButton } from "@/app/nav/protoControlRoomTap";

type Props = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
};

/** FL-style mini toggle — locks screen nav when on; cassette deck stays live. */
export function ProtoStudioJourneySwitch({
  checked,
  onChange,
  disabled = false,
}: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label="CJM"
      title={
        checked
          ? "CJM on — use cassette transport"
          : "CJM off — free screen navigation"
      }
      disabled={disabled}
      className={`proto-studio-journey-switch${
        checked ? " proto-studio-journey-switch--on" : ""
      }`}
      onClick={(event) => {
        flashControlRoomButton(
          event.currentTarget,
          "proto-studio-journey-switch--tap"
        );
        onChange(!checked);
      }}
    >
      <span className="proto-studio-journey-switch__track" aria-hidden>
        <span className="proto-studio-journey-switch__thumb" />
      </span>
    </button>
  );
}
