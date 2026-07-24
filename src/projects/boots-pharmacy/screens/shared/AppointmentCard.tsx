import { ButtonPrimary } from "@/uxds/components";
import {
  getAppointmentRefundPilotQuery,
  isTerminalAppointmentStatus,
  setSelectedAppointmentId,
  type Appointment,
  type AppointmentStatusTone,
} from "@/projects/boots-pharmacy/data/appointments";
import "./appointment-card.css";

export type AppointmentCardRow = {
  label: string;
  value: string;
  tone?: AppointmentStatusTone;
};

export type AppointmentCardVariant = "history" | "details";

export type AppointmentCardProps = {
  appt: Appointment;
  rows: AppointmentCardRow[];
  variant: AppointmentCardVariant;
  /** Required for variant="history" — opens the Details screen. */
  onOpenDetails?: () => void;
  onSitePilotHome: (query: string) => void;
};

function EditIcon() {
  return (
    <span className="appointment-card__icon" data-name="icon=edit" aria-hidden>
      <svg viewBox="0 0 16 16" fill="none">
        <path
          fill="#AFCCCA"
          d="M11.3 1.7a1.5 1.5 0 012.1 2.1L5.2 12 2 13l1-3.2L11.3 1.7z"
        />
      </svg>
    </span>
  );
}

function CancelIcon() {
  return (
    <span className="appointment-card__icon" data-name="icon=cancel" aria-hidden>
      <svg viewBox="0 0 16 16" fill="none">
        <path
          stroke="#AFCCCA"
          strokeWidth="1.5"
          strokeLinecap="round"
          d="M4 4l8 8M12 4l-8 8"
        />
      </svg>
    </span>
  );
}

function openDetails(appt: Appointment, onOpenDetails: () => void) {
  setSelectedAppointmentId(appt.id);
  onOpenDetails();
}

/**
 * Shared appointment/order item card — Appointment History (list) and
 * Appointment Details reuse this one component so the two screens can
 * never drift in look & feel. History previously used stale Figma
 * spacing/typography (32/56 pad-gap, 25px link title) while Details had
 * already been densified to Make-live parity (20/20, 20px title) — this
 * component standardises both screens on the densified Details spec.
 */
export function AppointmentCard({
  appt,
  rows,
  variant,
  onOpenDetails,
  onSitePilotHome,
}: AppointmentCardProps) {
  const terminal = isTerminalAppointmentStatus(appt.status);
  const isHistory = variant === "history";
  const showCtas = isHistory || !terminal;

  return (
    <article
      className="appointment-card"
      data-name="boots-pharmacy.component.ma.acc.overview.recent.order"
      data-studio-appointment-id={appt.id}
    >
      {isHistory ? (
        <button
          type="button"
          className="appointment-card__title appointment-card__title--link"
          data-studio-action={`appointment-open-details-${appt.id}`}
          onClick={() => onOpenDetails && openDetails(appt, onOpenDetails)}
          onKeyDown={(e) => {
            if (e.key !== "Enter" && e.key !== " ") return;
            e.preventDefault();
            if (onOpenDetails) openDetails(appt, onOpenDetails);
          }}
        >
          {`Appointment #${appt.id}`}
        </button>
      ) : (
        <h2 className="appointment-card__title">{`Appointment #${appt.id}`}</h2>
      )}

      <div className="appointment-card__info">
        <div className="appointment-card__rows">
          {rows.map((row) =>
            row.label === "Total" ? (
              <div className="appointment-card__row" data-name="row" key={row.label}>
                <span className="appointment-card__row-label">{row.label}</span>
                <span
                  className="appointment-card__price"
                  data-name="component.product.price"
                >
                  <span>£</span>
                  <span>{row.value}</span>
                </span>
              </div>
            ) : (
              <div className="appointment-card__row" data-name="row" key={row.label}>
                <span className="appointment-card__row-label">{row.label}</span>
                <span
                  className={
                    row.tone
                      ? `appointment-card__row-value appointment-card__status--${row.tone}`
                      : "appointment-card__row-value"
                  }
                >
                  {row.value}
                </span>
              </div>
            )
          )}

          {appt.refundPendingNote ? (
            <div
              className="appointment-card__row"
              data-name="row"
              data-studio-refund-pending-row="true"
            >
              <span className="appointment-card__row-label" aria-hidden>
                {"\u00a0"}
              </span>
              <span className="appointment-card__row-value">
                <span className="appointment-card__status--cancelled">
                  {appt.refundPendingNote.prefix}
                </span>
                <button
                  type="button"
                  className="uxds-link appointment-card__refund-link"
                  data-studio-action={`appointment-refund-${appt.id}`}
                  onClick={() =>
                    onSitePilotHome(getAppointmentRefundPilotQuery(appt))
                  }
                >
                  {appt.refundPendingNote.linkLabel}
                </button>
              </span>
            </div>
          ) : null}

          {appt.cancellationReason ? (
            <div
              className="appointment-card__row"
              data-name="row"
              data-studio-cancellation-reason-row="true"
            >
              <span className="appointment-card__row-label">
                Cancellation reason
              </span>
              <span className="appointment-card__row-value appointment-card__status--cancelled">
                {appt.cancellationReason}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      {showCtas ? (
        <div className="appointment-card__ctas" data-name="CTAs">
          {isHistory ? (
            <ButtonPrimary
              className="appointment-card__view-details uxds-btn-primary--commerce"
              data-studio-action="history-view-details"
              data-studio-appointment-view-details="true"
              onClick={() => onOpenDetails && openDetails(appt, onOpenDetails)}
            >
              View Details
            </ButtonPrimary>
          ) : null}
          {!terminal ? (
            <>
              <button
                type="button"
                className="appointment-card__icon-btn"
                data-name="component.input.button"
                data-studio-appointment-edit="true"
              >
                <EditIcon />
                <span>Edit</span>
              </button>
              <button
                type="button"
                className="appointment-card__icon-btn appointment-card__icon-btn--cancel"
                data-name="component.input.button"
                data-studio-appointment-cancel="true"
              >
                <CancelIcon />
                <span>Cancel</span>
              </button>
            </>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
