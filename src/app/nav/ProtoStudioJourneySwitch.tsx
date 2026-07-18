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
      aria-label="Journey mode"
      title={
        checked
          ? "Journey mode on — use cassette transport"
          : "Browse mode — free screen navigation"
      }
      disabled={disabled}
      className={`proto-studio-journey-switch${
        checked ? " proto-studio-journey-switch--on" : ""
      }`}
      onClick={() => onChange(!checked)}
    >
      <span className="proto-studio-journey-switch__track" aria-hidden>
        <span className="proto-studio-journey-switch__thumb" />
      </span>
    </button>
  );
}
