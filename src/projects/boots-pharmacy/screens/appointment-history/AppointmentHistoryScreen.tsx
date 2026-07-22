import {
  APPOINTMENTS,
  APPOINTMENT_COUNT,
  getAppointmentRefundPilotQuery,
  getAppointmentStatusTone,
  isTerminalAppointmentStatus,
  setSelectedAppointmentId,
  type Appointment,
} from "@/projects/boots-pharmacy/data/appointments";
import { MaNavigationPanel } from "@/projects/boots-pharmacy/chrome/MaNavigationPanel";
import { ButtonPrimary } from "@/uxds/components";
import {
  APPOINTMENT_HISTORY_HELP_LINK,
  APPOINTMENT_HISTORY_HELP_PREFIX,
  APPOINTMENT_HISTORY_LOAD_MORE,
  APPOINTMENT_HISTORY_NAV_ACTIVE,
  APPOINTMENT_HISTORY_NAV_ITEMS,
  APPOINTMENT_HISTORY_PROFILE_HELLO,
  APPOINTMENT_HISTORY_PROFILE_NAME,
  APPOINTMENT_HISTORY_REACT_SCREEN_ID,
  APPOINTMENT_HISTORY_SORT_DROPDOWN,
  APPOINTMENT_HISTORY_TITLE,
  appointmentHistoryDisplayedLabel,
  appointmentHistoryViewedLabel,
} from "./appointmentHistoryContract";
import "./appointment-history.css";

export type AppointmentHistoryScreenProps = {
  onOpenDetails: () => void;
  onAskSitePilot: () => void;
  onSitePilotHome: (query: string) => void;
};

type InfoRow = { label: string; value: string; tone?: ReturnType<typeof getAppointmentStatusTone> };

function appointmentRows(appt: Appointment): InfoRow[] {
  return [
    { label: "Appointment number", value: appt.id },
    {
      label: "Status",
      value: appt.status,
      tone: getAppointmentStatusTone(appt.status),
    },
    { label: "Booked", value: appt.bookedAt },
    { label: "Vaccine", value: appt.vaccine },
    { label: "Recipient", value: appt.recipient },
    { label: "Email", value: appt.email },
    { label: "Phone", value: appt.phone },
    { label: "Location", value: appt.location },
    { label: "Appointment date", value: appt.appointmentDate },
    { label: "Total", value: appt.total.toFixed(2) },
  ];
}

function EditIcon() {
  return (
    <span className="appointment-history__icon" data-name="icon=edit" aria-hidden>
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
    <span className="appointment-history__icon" data-name="icon=cancel" aria-hidden>
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

function ChevronDownIcon() {
  return (
    <span className="appointment-history__chevron" aria-hidden>
      <svg viewBox="0 0 16 10" fill="none">
        <path
          d="M1.2 1.2L8 8.2l6.8-7"
          stroke="#5C5C5C"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function PlusIcon() {
  return (
    <span className="appointment-history__icon" data-name="icon=plus" aria-hidden>
      <svg viewBox="0 0 16 16" fill="none">
        <path fill="#AFCCCA" d="M7 1h2v6h6v2H9v6H7V9H1V7h6V1z" />
      </svg>
    </span>
  );
}

function openDetails(appt: Appointment, onOpenDetails: () => void) {
  setSelectedAppointmentId(appt.id);
  onOpenDetails();
}

function AppointmentCard({
  appt,
  onOpenDetails,
  onSitePilotHome,
}: {
  appt: Appointment;
  onOpenDetails: () => void;
  onSitePilotHome: (query: string) => void;
}) {
  const terminal = isTerminalAppointmentStatus(appt.status);
  const rows = appointmentRows(appt);

  return (
    <article
      className="appointment-history__card"
      data-name="boots-pharmacy.component.ma.acc.overview.recent.order"
      data-studio-appointment-id={appt.id}
    >
      <button
        type="button"
        className="appointment-history__card-title"
        onClick={() => openDetails(appt, onOpenDetails)}
        onKeyDown={(e) => {
          if (e.key !== "Enter" && e.key !== " ") return;
          e.preventDefault();
          openDetails(appt, onOpenDetails);
        }}
      >
        {`Appointment #${appt.id}`}
      </button>

      <div className="appointment-history__card-info">
        <div className="appointment-history__rows">
          {rows.map((row) =>
            row.label === "Total" ? (
              <div className="appointment-history__row" data-name="row" key={row.label}>
                <span className="appointment-history__row-label">{row.label}</span>
                <span
                  className="appointment-history__price"
                  data-name="component.product.price"
                >
                  <span>£</span>
                  <span>{row.value}</span>
                </span>
              </div>
            ) : (
              <div className="appointment-history__row" data-name="row" key={row.label}>
                <span className="appointment-history__row-label">{row.label}</span>
                <span
                  className={
                    row.tone
                      ? `appointment-history__row-value appointment-history__status--${row.tone}`
                      : "appointment-history__row-value"
                  }
                >
                  {row.value}
                </span>
              </div>
            )
          )}

          {appt.refundPendingNote ? (
            <div
              className="appointment-history__row"
              data-name="row"
              data-studio-refund-pending-row="true"
            >
              <span className="appointment-history__row-label" aria-hidden>
                {"\u00a0"}
              </span>
              <span className="appointment-history__row-value">
                <span className="appointment-history__status--cancelled">
                  {appt.refundPendingNote.prefix}
                </span>
                <button
                  type="button"
                  className="uxds-link appointment-history__refund-link"
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
              className="appointment-history__row"
              data-name="row"
              data-studio-cancellation-reason-row="true"
            >
              <span className="appointment-history__row-label">
                Cancellation reason
              </span>
              <span className="appointment-history__row-value appointment-history__status--cancelled">
                {appt.cancellationReason}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      <div className="appointment-history__ctas" data-name="CTAs">
        <ButtonPrimary
          className="appointment-history__view-details uxds-btn-primary--commerce"
          data-studio-action="history-view-details"
          data-studio-appointment-view-details="true"
          onClick={() => openDetails(appt, onOpenDetails)}
        >
          View Details
        </ButtonPrimary>
        {!terminal ? (
          <>
            <button
              type="button"
              className="appointment-history__icon-btn"
              data-name="component.input.button"
              data-studio-appointment-edit="true"
            >
              <EditIcon />
              <span>Edit</span>
            </button>
            <button
              type="button"
              className="appointment-history__icon-btn appointment-history__icon-btn--cancel"
              data-name="component.input.button"
              data-studio-appointment-cancel="true"
            >
              <CancelIcon />
              <span>Cancel</span>
            </button>
          </>
        ) : null}
      </div>
    </article>
  );
}

export function AppointmentHistoryScreen({
  onOpenDetails,
  onAskSitePilot,
  onSitePilotHome,
}: AppointmentHistoryScreenProps) {
  const count = APPOINTMENT_COUNT;

  return (
    <main
      className="appointment-history"
      data-studio-react-screen={APPOINTMENT_HISTORY_REACT_SCREEN_ID}
      data-name="body"
      aria-label="Appointment History"
    >
      <header
        className="appointment-history__crumbs"
        data-name="module.breadcrumbs"
      >
        <div className="appointment-history__shell">
          <nav
            className="appointment-history__shell-inner appointment-history__crumbs-inner"
            data-name="component.breadcrumbs"
            aria-label="Breadcrumb"
          >
            <span className="appointment-history__crumb-link">Home</span>
            <span className="appointment-history__crumb-sep" aria-hidden>
              /
            </span>
            <span className="appointment-history__crumb-link">
              Account Overview
            </span>
            <span className="appointment-history__crumb-sep" aria-hidden>
              /
            </span>
            <span className="appointment-history__crumb-current">
              Appointment History
            </span>
          </nav>
        </div>
      </header>

      <div className="appointment-history__body">
        <div className="appointment-history__shell">
          <div className="appointment-history__shell-inner appointment-history__layout">
            <MaNavigationPanel
              helloLabel={APPOINTMENT_HISTORY_PROFILE_HELLO}
              profileName={APPOINTMENT_HISTORY_PROFILE_NAME}
              navItems={APPOINTMENT_HISTORY_NAV_ITEMS}
              activeItem={APPOINTMENT_HISTORY_NAV_ACTIVE}
            />

            <div className="appointment-history__content" data-name="Content">
              <div className="appointment-history__title" data-name="Title">
                <h1>{APPOINTMENT_HISTORY_TITLE}</h1>
                <p className="appointment-history__help">
                  <span>{APPOINTMENT_HISTORY_HELP_PREFIX}</span>
                  <button
                    type="button"
                    className="uxds-link"
                    onClick={onAskSitePilot}
                  >
                    {APPOINTMENT_HISTORY_HELP_LINK}
                  </button>
                </p>
              </div>

              <div className="appointment-history__sorting" data-name="Sorting">
                <p className="appointment-history__sorting-label">
                  {appointmentHistoryDisplayedLabel(count)}
                </p>
                {/* Visual only — Make has no open/filter wire (register I12). */}
                <button
                  type="button"
                  className="appointment-history__show-all"
                  data-name="component.input.dropdown"
                  aria-disabled="true"
                >
                  <span>{APPOINTMENT_HISTORY_SORT_DROPDOWN}</span>
                  <ChevronDownIcon />
                </button>
              </div>

              <div className="appointment-history__list" data-name="Left">
                {APPOINTMENTS.map((appt) => (
                  <AppointmentCard
                    key={appt.id}
                    appt={appt}
                    onOpenDetails={onOpenDetails}
                    onSitePilotHome={onSitePilotHome}
                  />
                ))}

                {/* Visual only — syncHistoryMeta forces N of N; no pagination wire. */}
                <div
                  className="appointment-history__load-more"
                  data-name="b2b.component.gse.load.more"
                >
                  <div className="appointment-history__load-more-title" data-name="Title">
                    <p>{appointmentHistoryViewedLabel(count)}</p>
                    <div
                      className="appointment-history__progress"
                      data-name="Progress"
                    >
                      <div
                        className="appointment-history__progress-active"
                        data-name="Active"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    className="appointment-history__load-more-btn"
                    data-name="component.input.button"
                    aria-disabled="true"
                  >
                    <PlusIcon />
                    <span>{APPOINTMENT_HISTORY_LOAD_MORE}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
