import type { ReactNode } from "react";

function EditGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
      <path
        fill="var(--uxds-icon-icon-accent-soft)"
        fillRule="evenodd"
        d="M11.7 1.3a1 1 0 0 1 1.4 0l1.6 1.6a1 1 0 0 1 0 1.4l-9.2 9.2H2.1v-3.4l9.6-9.8Zm.7 1.4L3.5 11.6v1h1l8.9-8.9-1-1Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export type AppointmentSummaryPillProps = {
  label: string;
  value: string;
  /** When set, shows tertiary Change control (Steps 1–2). Omitted on Confirmation. */
  onChange?: () => void;
  className?: string;
};

/**
 * Appointment summary row — Make `Week Schedule` pill.
 * Optional Change uses one tertiary icon+text language ([FE_STANDARDS](../../../docs/product/FE_STANDARDS.md)).
 */
export function AppointmentSummaryPill({
  label,
  value,
  onChange,
  className,
}: AppointmentSummaryPillProps) {
  return (
    <div
      className={["uxds-summary-pill", className].filter(Boolean).join(" ")}
      data-name="Week Schedule"
    >
      <p className="uxds-summary-pill__label">{label}</p>
      <p className="uxds-summary-pill__value">{value}</p>
      {onChange ? (
        <button
          type="button"
          className="uxds-summary-pill__change"
          data-name="component.input.button"
          data-studio-action={`change-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
          onClick={onChange}
        >
          <EditGlyph />
          <span>Change</span>
        </button>
      ) : null}
    </div>
  );
}

export type AppointmentSummaryStackProps = {
  children: ReactNode;
  className?: string;
};

export function AppointmentSummaryStack({
  children,
  className,
}: AppointmentSummaryStackProps) {
  return (
    <div
      className={["uxds-summary-pill-stack", className]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}
