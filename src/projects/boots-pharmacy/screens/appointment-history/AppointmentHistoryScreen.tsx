import {
  APPOINTMENTS,
  APPOINTMENT_COUNT,
  getAppointmentStatusTone,
  type Appointment,
} from "@/projects/boots-pharmacy/data/appointments";
import {
  MA_NAV_LINKED_LABELS,
  MaNavigationPanel,
} from "@/projects/boots-pharmacy/chrome/MaNavigationPanel";
import {
  AppointmentCard,
  type AppointmentCardRow,
} from "@/projects/boots-pharmacy/screens/shared/AppointmentCard";
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

function appointmentRows(appt: Appointment): AppointmentCardRow[] {
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
              linkedLabels={MA_NAV_LINKED_LABELS}
              onNavigate={() => {
                /* Already on Appointment History — no-op self-nav. */
              }}
            />

            <div className="appointment-history__content" data-name="Content">
              <div className="appointment-history__title" data-name="Title">
                <h1>{APPOINTMENT_HISTORY_TITLE}</h1>
                <p className="appointment-history__help">
                  <span>{APPOINTMENT_HISTORY_HELP_PREFIX}</span>
                  <button
                    type="button"
                    className="uxds-link"
                    data-studio-action="appointment-history-ask-site-pilot"
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
                {/* Visual only — Legacy has no open/filter wire (register I12). */}
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
                    rows={appointmentRows(appt)}
                    variant="history"
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
