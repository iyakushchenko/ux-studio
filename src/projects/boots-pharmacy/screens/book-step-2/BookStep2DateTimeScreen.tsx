import imgBodyFill from "@/projects/boots-pharmacy/frame/6d60145a5be9172088977b4513e3f4859a70c66a.png";
import { TODAY_TOOLTIP } from "@/projects/boots-pharmacy/overlays/AvailabilityTool";
import type { ChosenBookingSlot } from "@/projects/boots-pharmacy/overlays/AvailabilityTool";
import type { RecipientMode } from "@/projects/boots-pharmacy/popups/RecipientPickerPopup";
import { recipientModeLabel } from "@/projects/boots-pharmacy/popups/RecipientPickerPopup";
import {
  AppointmentSummaryPill,
  AppointmentSummaryStack,
  BookAppointmentProgress,
  ButtonPrimary,
  buildBookProgressSteps,
} from "@/uxds/components";
import {
  BOOK_STEP2_AFTERNOON,
  BOOK_STEP2_EVENING,
  BOOK_STEP2_JUNE_CELLS,
  BOOK_STEP2_JULY_CELLS,
  BOOK_STEP2_MORNING,
  BOOK_STEP2_WEEKDAYS,
  chunkRows,
  formatBookStep2Heading,
  type BookStep2CalCell,
  type BookStep2Month,
  type BookStep2TimeSlot,
} from "./bookStep2CalendarData";
import { BOOK_STEP2_REACT_SCREEN_ID } from "./bookStep2Contract";
import "./book-step-2-datetime.css";

export type BookStep2ChosenLocation = {
  name: string;
  address: string;
};

export type BookStep2DateTimeScreenProps = {
  chosenLocation: BookStep2ChosenLocation | null;
  vaccineName: string;
  recipient: RecipientMode;
  slot: ChosenBookingSlot;
  onChangeVaccine: () => void;
  onChangeRecipient: () => void;
  onChangeLocation: () => void;
  onSlotChange: (next: ChosenBookingSlot) => void;
  onReserve: () => void;
  /** Progress step 1 — back to Book Step 1 (React owns; Legacy wire gated). */
  onBackToStep1: () => void;
};

function MonthCalendar({
  label,
  cells,
  selected,
  onSelect,
}: {
  label: BookStep2Month;
  cells: BookStep2CalCell[];
  selected: { month: BookStep2Month; day: number };
  onSelect: (month: BookStep2Month, day: number) => void;
}) {
  const rows = chunkRows(cells, 7);

  return (
    <div className="book-step-2__month">
      <p className="book-step-2__month-title">{label}</p>
      <div className="book-step-2__month-cal" data-name="calendar">
        <div className="book-step-2__weekdays">
          {BOOK_STEP2_WEEKDAYS.map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
        <div className="book-step-2__month-grid">
          {rows.map((row, ri) => (
            <div key={ri} className="book-step-2__month-row">
              {row.map((cell, ci) => {
                const inMonth = cell.month === label;
                const available = inMonth && cell.available;
                const isToday =
                  label === "June" && cell.day === 12 && inMonth;
                const isSelected =
                  available &&
                  selected.month === label &&
                  selected.day === cell.day;
                return (
                  <button
                    key={`${cell.month}-${cell.day}-${ci}`}
                    type="button"
                    className={[
                      "book-step-2__cal-cell",
                      !available ? "is-unavailable" : "",
                      isToday && !isSelected ? "is-today" : "",
                      isSelected ? "is-selected" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    data-name="calendar. date. cell"
                    data-studio-react-owned="true"
                    data-studio-cal-kind={inMonth ? "date" : undefined}
                    data-studio-cal-month={inMonth ? label : undefined}
                    data-studio-cal-value={inMonth ? String(cell.day) : undefined}
                    data-studio-cal-available={available ? "true" : undefined}
                    data-studio-cal-unavailable={!available ? "true" : undefined}
                    data-studio-cal-today={isToday ? "true" : undefined}
                    data-studio-cal-selected={isSelected ? "true" : undefined}
                    disabled={!available}
                    title={isToday ? TODAY_TOOLTIP : undefined}
                    aria-label={
                      isToday
                        ? TODAY_TOOLTIP
                        : available
                          ? `${label} ${cell.day}`
                          : undefined
                    }
                    onClick={() => {
                      if (available) onSelect(label, cell.day);
                    }}
                  >
                    <p>{cell.day}</p>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TimeSection({
  label,
  slots,
  selected,
  onSelect,
}: {
  label: string;
  slots: BookStep2TimeSlot[];
  selected: string;
  onSelect: (t: string) => void;
}) {
  const rows = chunkRows(slots, 7);

  return (
    <div className="book-step-2__time-section" data-name="calendar">
      <p className="book-step-2__time-label">{label}</p>
      <div className="book-step-2__time-grid">
        {rows.map((row, ri) => (
          <div key={ri} className="book-step-2__time-row">
            {row.map(({ t, ok }) => {
              const isSelected = ok && selected === t;
              return (
                <button
                  key={t}
                  type="button"
                  className={[
                    "book-step-2__cal-cell",
                    "book-step-2__cal-cell--time",
                    !ok ? "is-unavailable" : "",
                    isSelected ? "is-selected" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  data-name="calendar. date. cell"
                  data-studio-react-owned="true"
                  data-studio-cal-kind="time"
                  data-studio-cal-value={t}
                  data-studio-cal-available={ok ? "true" : undefined}
                  data-studio-cal-unavailable={!ok ? "true" : undefined}
                  data-studio-cal-selected={isSelected ? "true" : undefined}
                  disabled={!ok}
                  aria-label={ok ? t : undefined}
                  onClick={() => {
                    if (ok) onSelect(t);
                  }}
                >
                  <p>{t}</p>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * React + UXDS pilot for Book — Step 2 (Date and Time).
 * Retires Legacy HTML for Frame child 4; Studio hooks via data-name / data-studio-cal-*.
 */
export function BookStep2DateTimeScreen({
  chosenLocation,
  vaccineName,
  recipient,
  slot,
  onChangeVaccine,
  onChangeRecipient,
  onChangeLocation,
  onSlotChange,
  onReserve,
  onBackToStep1,
}: BookStep2DateTimeScreenProps) {
  const locationValue =
    chosenLocation?.address?.trim() ||
    chosenLocation?.name ||
    "Choose a location";

  const heading = formatBookStep2Heading(slot.month, slot.day);
  const progressSteps = buildBookProgressSteps(2, {
    onBackToStep1,
  });

  return (
    <div
      className="book-step-2"
      data-name="body"
      data-studio-react-screen={BOOK_STEP2_REACT_SCREEN_ID}
    >
      <header className="book-step-2__crumbs" data-name="module.breadcrumbs">
        <div className="book-step-2__shell">
          <nav
            className="book-step-2__shell-inner book-step-2__crumbs-inner"
            data-name="component.breadcrumbs"
            aria-label="Breadcrumb"
          >
            <button type="button" className="book-step-2__crumb-link">
              Home
            </button>
            <span className="book-step-2__crumb-sep" aria-hidden>
              /
            </span>
            <span className="book-step-2__crumb-current">Book Appointment</span>
          </nav>
        </div>
      </header>

      <main className="book-step-2__body">
        <div className="book-step-2__body-fill" aria-hidden>
          <div className="book-step-2__body-fill-solid" />
          <img
            className="book-step-2__body-fill-img"
            src={imgBodyFill}
            alt=""
          />
        </div>

        <div className="book-step-2__shell">
          <div className="book-step-2__shell-inner book-step-2__main">
            <h1 className="book-step-2__title">Book Appointment</h1>
            <BookAppointmentProgress steps={progressSteps} />

            <section
              className="book-step-2__card"
              data-name="component.appointment.summary"
              aria-labelledby="book-step-2-datetime"
            >
              <AppointmentSummaryStack>
                <AppointmentSummaryPill
                  label="Vaccine"
                  value={vaccineName}
                  onChange={onChangeVaccine}
                />
                <AppointmentSummaryPill
                  label="Recipient"
                  value={recipientModeLabel(recipient)}
                  onChange={onChangeRecipient}
                />
                <AppointmentSummaryPill
                  label="Location"
                  value={locationValue}
                  onChange={onChangeLocation}
                />
              </AppointmentSummaryStack>

              <h2
                id="book-step-2-datetime"
                className="book-step-2__section-title"
              >
                Choose Date and Time
              </h2>

              <div className="book-step-2__datetime">
                <div
                  className="book-step-2__notice"
                  data-name="component.gse.system.message"
                >
                  <p>You can book appointments up to 28 days in advance</p>
                </div>

                <div className="book-step-2__months">
                  <MonthCalendar
                    label="June"
                    cells={BOOK_STEP2_JUNE_CELLS}
                    selected={{ month: slot.month, day: slot.day }}
                    onSelect={(month, day) =>
                      onSlotChange({ ...slot, month, day })
                    }
                  />
                  <MonthCalendar
                    label="July"
                    cells={BOOK_STEP2_JULY_CELLS}
                    selected={{ month: slot.month, day: slot.day }}
                    onSelect={(month, day) =>
                      onSlotChange({ ...slot, month, day })
                    }
                  />
                </div>

                <p className="book-step-2__date-heading">{heading}</p>

                <div className="book-step-2__times">
                  <TimeSection
                    label="Morning"
                    slots={BOOK_STEP2_MORNING}
                    selected={slot.time}
                    onSelect={(time) => onSlotChange({ ...slot, time })}
                  />
                  <hr className="book-step-2__time-rule" />
                  <TimeSection
                    label="Afternoon"
                    slots={BOOK_STEP2_AFTERNOON}
                    selected={slot.time}
                    onSelect={(time) => onSlotChange({ ...slot, time })}
                  />
                  <hr className="book-step-2__time-rule" />
                  <TimeSection
                    label="Evening"
                    slots={BOOK_STEP2_EVENING}
                    selected={slot.time}
                    onSelect={(time) => onSlotChange({ ...slot, time })}
                  />
                </div>
              </div>

              <div className="book-step-2__cta-wrap">
                <ButtonPrimary
                  className="book-step-2__reserve uxds-btn-primary--commerce"
                  data-studio-action="book-step-2-reserve"
                  onClick={onReserve}
                >
                  Reserve Appointment
                </ButtonPrimary>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
