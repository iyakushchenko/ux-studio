import {
  APPOINTMENTS,
  getAppointment,
  getAppointmentRefundPilotQuery,
  getAppointmentStatusTone,
  getSelectedAppointmentId,
  isTerminalAppointmentStatus,
  setSelectedAppointmentId,
  type Appointment,
} from "@/projects/boots-pharmacy/data/appointments";
import {
  BOOSTER_DOSE_SUMMARY_LABEL,
  computeOrderPricing,
  formatGbp,
} from "@/projects/boots-pharmacy/data/orderPricing";
import { MaNavigationPanel } from "@/projects/boots-pharmacy/chrome/MaNavigationPanel";
import {
  Accordion,
  AccordionChevron,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/uxds/interactions";
import {
  APPOINTMENT_DETAILS_BILLING_LINES,
  APPOINTMENT_DETAILS_BILLING_NAME,
  APPOINTMENT_DETAILS_BILLING_PHONE,
  APPOINTMENT_DETAILS_CONTACT_EMAIL,
  APPOINTMENT_DETAILS_CRUMB_CURRENT,
  APPOINTMENT_DETAILS_CRUMB_HISTORY,
  APPOINTMENT_DETAILS_CRUMB_HOME,
  APPOINTMENT_DETAILS_NAV_ACTIVE,
  APPOINTMENT_DETAILS_NAV_ITEMS,
  APPOINTMENT_DETAILS_PAYMENT_MASK,
  APPOINTMENT_DETAILS_PROFILE_HELLO,
  APPOINTMENT_DETAILS_PROFILE_NAME,
  APPOINTMENT_DETAILS_REACT_SCREEN_ID,
  APPOINTMENT_DETAILS_SUMMARY_DISCOUNT,
  APPOINTMENT_DETAILS_SUMMARY_TITLE,
  APPOINTMENT_DETAILS_TITLE,
  APPOINTMENT_DETAILS_VACCINATIONS_HEADER,
  APPOINTMENT_DETAILS_VACCINATIONS_ITEM_ID,
} from "./appointmentDetailsContract";
import "./appointment-details.css";

export type AppointmentDetailsScreenProps = {
  onGoHistory: () => void;
  onSitePilotHome: (query: string) => void;
};

type InfoRow = {
  label: string;
  value: string;
  tone?: ReturnType<typeof getAppointmentStatusTone>;
};

function resolveSelectedAppointment(): Appointment {
  const id = getSelectedAppointmentId();
  const appt = getAppointment(id) ?? APPOINTMENTS[0];
  if (!appt) {
    throw new Error("APPOINTMENTS SSoT is empty");
  }
  if (appt.id !== id) setSelectedAppointmentId(appt.id);
  return appt;
}

function appointmentRows(appt: Appointment): InfoRow[] {
  return [
    { label: "Appointment number", value: appt.id },
    {
      label: "Status",
      value: appt.status,
      tone: getAppointmentStatusTone(appt.status),
    },
    { label: "Booked", value: appt.bookedAt },
    { label: "Vaccine Service", value: appt.vaccine },
    { label: "Recipient", value: appt.recipient },
    { label: "Email", value: appt.email },
    { label: "Phone Number", value: appt.phone },
    { label: "Location", value: appt.location },
    { label: "Date and Time", value: appt.appointmentDate },
    { label: "Total", value: appt.total.toFixed(2) },
  ];
}

function EditIcon() {
  return (
    <span className="appointment-details__icon" data-name="icon=edit" aria-hidden>
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
    <span className="appointment-details__icon" data-name="icon=cancel" aria-hidden>
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

function VisaMark() {
  return (
    <div className="appointment-details__visa" data-name="visa" aria-hidden>
      <span>VISA</span>
    </div>
  );
}

function DetailSummary({ appt }: { appt: Appointment }) {
  const pricing = appt.pricing ?? computeOrderPricing(appt.includeBooster ?? false);
  const showBooster = !appt.pricing;

  return (
    <div
      className="appointment-details__summary"
      data-name="Info Blocks / Order Summary/NO"
    >
      <h2 className="appointment-details__summary-title">
        {APPOINTMENT_DETAILS_SUMMARY_TITLE}
      </h2>
      <div className="appointment-details__summary-row" data-name="Subtotal">
        <span>Subtotal</span>
        <span>{formatGbp(pricing.subtotal)}</span>
      </div>
      <div className="appointment-details__summary-row" data-name="Order Discount">
        <span>{APPOINTMENT_DETAILS_SUMMARY_DISCOUNT}</span>
        <span>{formatGbp(pricing.discount)}</span>
      </div>
      {showBooster ? (
        <div
          className="appointment-details__summary-row"
          data-studio-booster-line="true"
        >
          <span>{BOOSTER_DOSE_SUMMARY_LABEL}</span>
          <span>
            {appt.includeBooster ? "Included (+ £75.00)" : "Not included"}
          </span>
        </div>
      ) : null}
      {/* Hire Shipping / Shipping Discount omitted — under-match (no dead BS). */}
      <div className="appointment-details__summary-row" data-name="Sales Tax">
        <span>Sales Tax</span>
        <span>{formatGbp(pricing.tax)}</span>
      </div>
      <div className="appointment-details__summary-total" data-name="Total">
        <span>Total</span>
        <span>{formatGbp(pricing.total)}</span>
      </div>
    </div>
  );
}

function BuyerInfoStatic() {
  return (
    <div
      className="appointment-details__buyer"
      data-name="component.co.buyer.info.static"
    >
      <div className="appointment-details__buyer-col" data-name="contact info">
        <h2 className="appointment-details__buyer-heading">Contact Information</h2>
        <div className="appointment-details__buyer-block" data-name="details">
          <p className="appointment-details__buyer-label">Email</p>
          <p className="appointment-details__buyer-value">
            {APPOINTMENT_DETAILS_CONTACT_EMAIL}
          </p>
        </div>
      </div>

      <div className="appointment-details__buyer-col" data-name="payment details">
        <h2 className="appointment-details__buyer-heading">Payment Details</h2>
        <div
          className="appointment-details__buyer-address-method"
          data-name="address + method"
        >
          <div className="appointment-details__buyer-block" data-name="address">
            <p className="appointment-details__buyer-label">Billing Address</p>
            <div
              className="appointment-details__buyer-address"
              data-name="component.address.group"
            >
              <p className="appointment-details__buyer-name">
                {APPOINTMENT_DETAILS_BILLING_NAME}
              </p>
              <p className="appointment-details__buyer-value">
                {APPOINTMENT_DETAILS_BILLING_LINES.map((line, i) => (
                  <span key={line}>
                    {line}
                    {i < APPOINTMENT_DETAILS_BILLING_LINES.length - 1 ? (
                      <br />
                    ) : null}
                  </span>
                ))}
              </p>
              <p className="appointment-details__buyer-value">
                {APPOINTMENT_DETAILS_BILLING_PHONE}
              </p>
            </div>
          </div>

          <div
            className="appointment-details__buyer-block"
            data-name="payment method"
          >
            <p className="appointment-details__buyer-label">Payment Method</p>
            <div
              className="appointment-details__payment-method"
              data-name="component.ma.payment.method.card"
            >
              <VisaMark />
              <p className="appointment-details__buyer-value">
                {APPOINTMENT_DETAILS_PAYMENT_MASK}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailCard({
  appt,
  onSitePilotHome,
}: {
  appt: Appointment;
  onSitePilotHome: (query: string) => void;
}) {
  const terminal = isTerminalAppointmentStatus(appt.status);
  const rows = appointmentRows(appt);

  return (
    <article
      className="appointment-details__card"
      data-name="boots-pharmacy.component.ma.acc.overview.recent.order"
      data-studio-appointment-id={appt.id}
    >
      <h2 className="appointment-details__card-title">{`Appointment #${appt.id}`}</h2>

      <div className="appointment-details__card-info">
        <div className="appointment-details__rows">
          {rows.map((row) =>
            row.label === "Total" ? (
              <div className="appointment-details__row" data-name="row" key={row.label}>
                <span className="appointment-details__row-label">{row.label}</span>
                <span
                  className="appointment-details__price"
                  data-name="component.product.price"
                >
                  <span>£</span>
                  <span>{row.value}</span>
                </span>
              </div>
            ) : (
              <div className="appointment-details__row" data-name="row" key={row.label}>
                <span className="appointment-details__row-label">{row.label}</span>
                <span
                  className={
                    row.tone
                      ? `appointment-details__row-value appointment-details__status--${row.tone}`
                      : "appointment-details__row-value"
                  }
                >
                  {row.value}
                </span>
              </div>
            )
          )}

          {appt.refundPendingNote ? (
            <div
              className="appointment-details__row"
              data-name="row"
              data-studio-refund-pending-row="true"
            >
              <span className="appointment-details__row-label" aria-hidden>
                {"\u00a0"}
              </span>
              <span className="appointment-details__row-value">
                <span className="appointment-details__status--cancelled">
                  {appt.refundPendingNote.prefix}
                </span>
                <button
                  type="button"
                  className="uxds-link appointment-details__refund-link"
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
              className="appointment-details__row"
              data-name="row"
              data-studio-cancellation-reason-row="true"
            >
              <span className="appointment-details__row-label">
                Cancellation reason
              </span>
              <span className="appointment-details__row-value appointment-details__status--cancelled">
                {appt.cancellationReason}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      {!terminal ? (
        <div className="appointment-details__ctas" data-name="CTAs">
          <button
            type="button"
            className="appointment-details__icon-btn"
            data-name="component.input.button"
            data-studio-appointment-edit="true"
          >
            <EditIcon />
            <span>Edit</span>
          </button>
          <button
            type="button"
            className="appointment-details__icon-btn appointment-details__icon-btn--cancel"
            data-name="component.input.button"
            data-studio-appointment-cancel="true"
          >
            <CancelIcon />
            <span>Cancel</span>
          </button>
        </div>
      ) : null}
    </article>
  );
}

export function AppointmentDetailsScreen({
  onGoHistory,
  onSitePilotHome,
}: AppointmentDetailsScreenProps) {
  const appt = resolveSelectedAppointment();

  return (
    <main
      className="appointment-details"
      data-studio-react-screen={APPOINTMENT_DETAILS_REACT_SCREEN_ID}
      data-name="body"
      aria-label="Appointment Details"
    >
      <header
        className="appointment-details__crumbs"
        data-name="module.breadcrumbs"
      >
        <div className="appointment-details__shell">
          <nav
            className="appointment-details__shell-inner appointment-details__crumbs-inner"
            data-name="component.breadcrumbs"
            aria-label="Breadcrumb"
          >
            <span className="appointment-details__crumb-link">
              {APPOINTMENT_DETAILS_CRUMB_HOME}
            </span>
            <span className="appointment-details__crumb-sep" aria-hidden>
              /
            </span>
            <button
              type="button"
              className="appointment-details__crumb-link appointment-details__crumb-btn"
              data-studio-appointment-history-crumb="true"
              onClick={onGoHistory}
            >
              {APPOINTMENT_DETAILS_CRUMB_HISTORY}
            </button>
            <span className="appointment-details__crumb-sep" aria-hidden>
              /
            </span>
            <span className="appointment-details__crumb-current">
              {APPOINTMENT_DETAILS_CRUMB_CURRENT}
            </span>
          </nav>
        </div>
      </header>

      <div className="appointment-details__body">
        <div className="appointment-details__shell">
          <div className="appointment-details__shell-inner appointment-details__layout">
            <MaNavigationPanel
              helloLabel={APPOINTMENT_DETAILS_PROFILE_HELLO}
              profileName={APPOINTMENT_DETAILS_PROFILE_NAME}
              navItems={APPOINTMENT_DETAILS_NAV_ITEMS}
              activeItem={APPOINTMENT_DETAILS_NAV_ACTIVE}
            />

            <div
              className="appointment-details__content"
              data-name="Right Column"
            >
              <h1 className="appointment-details__page-title">
                {APPOINTMENT_DETAILS_TITLE}
              </h1>

              <DetailCard appt={appt} onSitePilotHome={onSitePilotHome} />

              <Accordion
                type="single"
                className="appointment-details__vaccinations"
                data-name="component.co.product.in.this.order"
              >
                <AccordionItem
                  id={APPOINTMENT_DETAILS_VACCINATIONS_ITEM_ID}
                  className="appointment-details__vaccinations-item"
                  data-name="component.gse.accordion"
                  data-studio-accordion-item={
                    APPOINTMENT_DETAILS_VACCINATIONS_ITEM_ID
                  }
                >
                  <AccordionTrigger
                    id={APPOINTMENT_DETAILS_VACCINATIONS_ITEM_ID}
                    className="appointment-details__vaccinations-trigger"
                    data-studio-appointment-vaccinations-toggle="true"
                  >
                    <span
                      className="appointment-details__vaccinations-title"
                      data-name="wrapper"
                    >
                      {APPOINTMENT_DETAILS_VACCINATIONS_HEADER}
                    </span>
                    <AccordionChevron />
                  </AccordionTrigger>
                  <AccordionContent
                    id={APPOINTMENT_DETAILS_VACCINATIONS_ITEM_ID}
                    className="appointment-details__vaccinations-body"
                    data-name="Description"
                    data-studio-appointment-vaccinations-panel="true"
                  >
                    {/* Body = SSoT appointment fields only — no invent product chrome. */}
                    <dl className="appointment-details__vaccinations-meta">
                      <div className="appointment-details__vaccinations-meta-row">
                        <dt>Vaccine</dt>
                        <dd>{appt.vaccine}</dd>
                      </div>
                      <div className="appointment-details__vaccinations-meta-row">
                        <dt>Recipient</dt>
                        <dd>{appt.recipient}</dd>
                      </div>
                      <div className="appointment-details__vaccinations-meta-row">
                        <dt>Date and Time</dt>
                        <dd>{appt.appointmentDate}</dd>
                      </div>
                      <div className="appointment-details__vaccinations-meta-row">
                        <dt>Location</dt>
                        <dd>{appt.location}</dd>
                      </div>
                    </dl>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <DetailSummary appt={appt} />
              <BuyerInfoStatic />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
