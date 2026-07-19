import imgBodyFill from "@/projects/boots-pharmacy/frame/6d60145a5be9172088977b4513e3f4859a70c66a.png";
import bootsAdvantageCard from "@/assets/boots-advantage-card.png";
import iconArrowsSecondary from "@/assets/avail/arrows-secondary.svg";
import type { ChosenBookingSlot } from "@/projects/boots-pharmacy/overlays/AvailabilityTool";
import type { RecipientMode } from "@/projects/boots-pharmacy/popups/RecipientPickerPopup";
import { recipientModeLabel } from "@/projects/boots-pharmacy/popups/RecipientPickerPopup";
import {
  BOOSTER_DOSE_SUMMARY_LABEL,
  computeOrderPricing,
} from "@/projects/boots-pharmacy/data/orderPricing";
import { formatBookStep2Heading } from "@/projects/boots-pharmacy/screens/book-step-2/bookStep2CalendarData";
import {
  AppointmentSummaryPill,
  AppointmentSummaryStack,
  BookAppointmentProgress,
  ButtonPrimary,
  buildBookProgressSteps,
} from "@/uxds/components";
import {
  BOOK_STEP3_CUSTOMER_EMAIL,
  BOOK_STEP3_CUSTOMER_NAME,
  BOOK_STEP3_CUSTOMER_PHONE,
  BOOK_STEP3_ORDER_PLACED,
  BOOK_STEP3_PAID_WITH,
  BOOK_STEP3_POINTS_RECEIVED,
  BOOK_STEP3_POINTS_TO_SPEND,
  BOOK_STEP3_REACT_SCREEN_ID,
} from "./bookStep3Contract";
import "./book-step-3-confirmation.css";

export type BookStep3ChosenLocation = {
  name: string;
  address: string;
};

export type BookStep3ConfirmationScreenProps = {
  chosenLocation: BookStep3ChosenLocation | null;
  vaccineName: string;
  recipient: RecipientMode;
  slot: ChosenBookingSlot;
  includeBoosterDose: boolean;
  onExploreMore: () => void;
  onOpenAppointments: () => void;
};

function formatDateTime(slot: ChosenBookingSlot): string {
  return `${formatBookStep2Heading(slot.month, slot.day)}, ${slot.time}`;
}

function formatAmount(n: number): string {
  return n.toFixed(2);
}

function OkAccent() {
  return (
    <div
      className="book-step-3__ok"
      data-name="icon / accent / ok"
      aria-hidden
    >
      <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
        <path
          d="M15.02 30.041c8.282 0 15.02-6.738 15.02-15.02S23.302 0 15.02 0 0 6.738 0 15.02s6.738 15.02 15.02 15.02Zm0-28.082c7.202 0 13.061 5.86 13.061 13.061S22.222 28.082 15.02 28.082 1.959 22.222 1.959 15.02 7.818 1.959 15.02 1.959Z"
          fill="var(--project-brand-cta-navy)"
        />
        <path
          d="M11.218 21.627c.246.262.57.393.893.393.323 0 .646-.131.893-.393l10.646-11.315c.494-.524.494-1.374 0-1.898-.493-.524-1.293-.524-1.786 0L12.11 18.78l-3.934-4.182c-.493-.524-1.293-.524-1.786 0-.493.524-.493 1.374 0 1.898l4.827 5.131Z"
          fill="var(--project-brand-cta-navy)"
        />
      </svg>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="book-step-3__meta-row" data-name="Week Schedule">
      <p className="book-step-3__meta-label">{label}</p>
      <p className="book-step-3__meta-value">{value}</p>
    </div>
  );
}

function Price({ amount, large }: { amount: number; large?: boolean }) {
  return (
    <div
      className={
        large ? "book-step-3__price book-step-3__price--total" : "book-step-3__price"
      }
      data-name="component.product.price"
    >
      <p>£</p>
      <p>{formatAmount(amount)}</p>
    </div>
  );
}

/**
 * React + UXDS pilot for Book — Step 3 (Confirmation).
 * Retires Make HTML for Frame child 3; AIR hook `data-studio-open-appointment`.
 */
export function BookStep3ConfirmationScreen({
  chosenLocation,
  vaccineName,
  recipient,
  slot,
  includeBoosterDose,
  onExploreMore,
  onOpenAppointments,
}: BookStep3ConfirmationScreenProps) {
  const locationValue =
    chosenLocation?.address?.trim() ||
    chosenLocation?.name ||
    "426 StrandLondon, Greater London WC2R 0QE";
  const pricing = computeOrderPricing(includeBoosterDose);
  const progressSteps = buildBookProgressSteps(3, {
    confirmationComplete: true,
  });

  return (
    <div
      className="book-step-3"
      data-name="body"
      data-studio-react-screen={BOOK_STEP3_REACT_SCREEN_ID}
    >
      <div className="book-step-3__crumbs" data-name="module.breadcrumbs">
        <div className="book-step-3__shell">
          <nav
            className="book-step-3__shell-inner book-step-3__crumbs-inner"
            data-name="component.breadcrumbs"
            aria-label="Breadcrumb"
          >
            <button type="button" className="book-step-3__crumb-link">
              Home
            </button>
            <span className="book-step-3__crumb-sep" aria-hidden>
              /
            </span>
            <span className="book-step-3__crumb-current">Book Appointment</span>
          </nav>
        </div>
      </div>

      <div className="book-step-3__body">
        <div className="book-step-3__body-fill" aria-hidden>
          <div className="book-step-3__body-fill-solid" />
          <img
            className="book-step-3__body-fill-img"
            src={imgBodyFill}
            alt=""
          />
        </div>

        <div className="book-step-3__shell">
          <div className="book-step-3__shell-inner book-step-3__main">
            <h1 className="book-step-3__title">Book Appointment</h1>
            <BookAppointmentProgress
              steps={progressSteps}
              interactive={false}
            />

            <section
              className="book-step-3__card"
              data-name="component.appointment.summary"
              aria-labelledby="book-step-3-reserved"
            >
              <h2 id="book-step-3-reserved" className="book-step-3__headline">
                Appointment reserved!
              </h2>
              <OkAccent />

              <div
                className="book-step-3__notice"
                data-name="component.gse.system.message"
              >
                <p>An email confirmation is on its way.</p>
              </div>

              <AppointmentSummaryStack>
                <AppointmentSummaryPill label="Vaccine" value={vaccineName} />
                <AppointmentSummaryPill
                  label="Recipient"
                  value={recipientModeLabel(recipient)}
                />
                <AppointmentSummaryPill
                  label="Location"
                  value={locationValue}
                />
                <AppointmentSummaryPill
                  label="Date and Time"
                  value={formatDateTime(slot)}
                />
              </AppointmentSummaryStack>

              <div
                className="book-step-3__order"
                data-name="component.co.order.summary"
              >
                <p className="book-step-3__order-title">Order summary</p>
                <div className="book-step-3__order-list" data-name="list">
                  <div className="book-step-3__order-row" data-name="Subtotal">
                    <p>Subtotal</p>
                    <Price amount={pricing.subtotal} />
                  </div>
                  <div
                    className="book-step-3__order-row"
                    data-name="Order Discount"
                  >
                    <p>Order discount</p>
                    <Price amount={pricing.discount} />
                  </div>
                  <div
                    className="book-step-3__order-row"
                    data-studio-booster-line="true"
                  >
                    <p>{BOOSTER_DOSE_SUMMARY_LABEL}</p>
                    <p className="book-step-3__order-plain">
                      {includeBoosterDose
                        ? "Included (+ £75.00)"
                        : "Not included"}
                    </p>
                  </div>
                  <div className="book-step-3__order-row" data-name="Shipping">
                    <p>Delivery</p>
                    <p className="book-step-3__order-plain">Via email</p>
                  </div>
                  <div className="book-step-3__order-row" data-name="Sales Tax">
                    <p>Sales tax</p>
                    <Price amount={pricing.tax} />
                  </div>
                </div>
                <div className="book-step-3__order-total" data-name="Total">
                  <p>Total</p>
                  <Price amount={pricing.total} large />
                </div>
              </div>

              <div className="book-step-3__meta">
                <MetaRow label="Order Placed" value={BOOK_STEP3_ORDER_PLACED} />
                <MetaRow label="Name" value={BOOK_STEP3_CUSTOMER_NAME} />
                <MetaRow label="Email" value={BOOK_STEP3_CUSTOMER_EMAIL} />
                <MetaRow
                  label="Phone Number"
                  value={BOOK_STEP3_CUSTOMER_PHONE}
                />
                <MetaRow label="Paid with" value={BOOK_STEP3_PAID_WITH} />
              </div>

              <div className="book-step-3__advantage proto-confirm-advantage">
                <div className="book-step-3__advantage-inner">
                  <div className="book-step-3__advantage-rows">
                    <span className="book-step-3__advantage-label">
                      Points received
                    </span>
                    <span className="book-step-3__advantage-value">
                      {BOOK_STEP3_POINTS_RECEIVED}
                    </span>
                    <span className="book-step-3__advantage-label">
                      Points to spend in store
                    </span>
                    <span className="book-step-3__advantage-value">
                      {BOOK_STEP3_POINTS_TO_SPEND}
                    </span>
                    <button
                      type="button"
                      className="book-step-3__advantage-link uxds-link"
                    >
                      Open My Advantage Card details
                    </button>
                  </div>
                  <img
                    className="book-step-3__advantage-card"
                    src={bootsAdvantageCard}
                    alt="My Advantage Card"
                    decoding="async"
                  />
                </div>
              </div>

              <div className="book-step-3__cta-row">
                <ButtonPrimary
                  className="book-step-3__cta uxds-btn-primary--commerce"
                  onClick={onExploreMore}
                >
                  Explore more vaccinations
                </ButtonPrimary>
                <ButtonPrimary
                  className="book-step-3__cta uxds-btn-primary--commerce"
                  type="button"
                >
                  Add to Google Calendar
                </ButtonPrimary>
              </div>

              <button
                type="button"
                className="book-step-3__open-appt"
                data-studio-open-appointment="true"
                aria-label="Open Appointments"
                onClick={onOpenAppointments}
              >
                <img
                  className="book-step-3__open-appt-icon"
                  src={iconArrowsSecondary}
                  alt=""
                  width={16}
                  height={16}
                />
                <span>Open Appointments</span>
              </button>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
