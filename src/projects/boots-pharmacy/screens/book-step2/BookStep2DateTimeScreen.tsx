import type { KeyboardEvent } from "react";
import imgBodyFill from "@/projects/boots-pharmacy/frame/6d60145a5be9172088977b4513e3f4859a70c66a.png";
import { PROTO_TODAY_TOOLTIP } from "@/projects/boots-pharmacy/overlays/AvailabilityTool";
import type { ChosenBookingSlot } from "@/projects/boots-pharmacy/overlays/AvailabilityTool";
import type { RecipientMode } from "@/projects/boots-pharmacy/popups/RecipientPickerPopup";
import { recipientModeLabel } from "@/projects/boots-pharmacy/popups/RecipientPickerPopup";
import { ButtonPrimary } from "@/uxds/components";
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
import "./book-step2-datetime.css";

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
  /** Progress step 1 — back to Book Step 1 (React owns; Make wire gated). */
  onBackToStep1: () => void;
};

const PROGRESS_STEPS = [
  { n: 1, label: "Choose Location", state: "completed" as const },
  { n: 2, label: "Choose Date and Time", state: "active" as const },
  { n: 3, label: "Confirmation", state: "upcoming" as const },
];

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

function SummaryPill({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: () => void;
}) {
  return (
    <div className="book-step2__pill" data-name="Week Schedule">
      <p className="book-step2__pill-label">{label}</p>
      <p className="book-step2__pill-value">{value}</p>
      <button
        type="button"
        className="book-step2__pill-change"
        data-name="component.input.button"
        onClick={onChange}
      >
        <EditGlyph />
        <span>Change</span>
      </button>
    </div>
  );
}

function BookProgress({ onBackToStep1 }: { onBackToStep1: () => void }) {
  return (
    <div
      className="book-step2__progress"
      data-name="component.book.appointment.progress"
    >
      {PROGRESS_STEPS.map((step) => {
        const isActive = step.state === "active";
        const isCompleted = step.state === "completed";
        const isStep1Back = step.n === 1 && isCompleted;
        return (
          <div
            key={step.n}
            className={[
              "book-step2__progress-step",
              isActive ? "is-active" : "",
              isCompleted ? "is-completed" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            {...(isActive
              ? { "data-proto-step-active": "true" as const }
              : {})}
            {...(isStep1Back
              ? {
                  "data-proto-book-step-back": "true" as const,
                  role: "button" as const,
                  tabIndex: 0,
                  "aria-label": "Go back to Choose Location",
                  onClick: onBackToStep1,
                  onKeyDown: (e: KeyboardEvent) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onBackToStep1();
                    }
                  },
                }
              : {})}
          >
            <ol start={step.n}>
              <li>
                <span>{step.label}</span>
              </li>
            </ol>
            <div
              className="book-step2__progress-bar"
              data-proto-book-progress={
                isActive ? "current" : isCompleted ? "completed" : "upcoming"
              }
            />
          </div>
        );
      })}
    </div>
  );
}

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
    <div className="book-step2__month">
      <p className="book-step2__month-title">{label}</p>
      <div className="book-step2__month-cal" data-name="calendar">
        <div className="book-step2__weekdays">
          {BOOK_STEP2_WEEKDAYS.map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
        <div className="book-step2__month-grid">
          {rows.map((row, ri) => (
            <div key={ri} className="book-step2__month-row">
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
                      "book-step2__cal-cell",
                      !available ? "is-unavailable" : "",
                      isToday && !isSelected ? "is-today" : "",
                      isSelected ? "is-selected" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    data-name="calendar. date. cell"
                    data-proto-react-owned="true"
                    data-proto-cal-kind={inMonth ? "date" : undefined}
                    data-proto-cal-month={inMonth ? label : undefined}
                    data-proto-cal-value={inMonth ? String(cell.day) : undefined}
                    data-proto-cal-available={available ? "true" : undefined}
                    data-proto-cal-unavailable={!available ? "true" : undefined}
                    data-proto-cal-today={isToday ? "true" : undefined}
                    data-proto-cal-selected={isSelected ? "true" : undefined}
                    disabled={!available}
                    title={isToday ? PROTO_TODAY_TOOLTIP : undefined}
                    aria-label={
                      isToday
                        ? PROTO_TODAY_TOOLTIP
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
    <div className="book-step2__time-section" data-name="calendar">
      <p className="book-step2__time-label">{label}</p>
      <div className="book-step2__time-grid">
        {rows.map((row, ri) => (
          <div key={ri} className="book-step2__time-row">
            {row.map(({ t, ok }) => {
              const isSelected = ok && selected === t;
              return (
                <button
                  key={t}
                  type="button"
                  className={[
                    "book-step2__cal-cell",
                    "book-step2__cal-cell--time",
                    !ok ? "is-unavailable" : "",
                    isSelected ? "is-selected" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  data-name="calendar. date. cell"
                  data-proto-react-owned="true"
                  data-proto-cal-kind="time"
                  data-proto-cal-value={t}
                  data-proto-cal-available={ok ? "true" : undefined}
                  data-proto-cal-unavailable={!ok ? "true" : undefined}
                  data-proto-cal-selected={isSelected ? "true" : undefined}
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
 * Retires Make HTML for Frame child 4; Studio hooks via data-name / data-proto-cal-*.
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

  return (
    <div
      className="book-step2"
      data-name="body"
      data-proto-react-screen={BOOK_STEP2_REACT_SCREEN_ID}
    >
      <div className="book-step2__crumbs" data-name="module.breadcrumbs">
        <div className="book-step2__shell">
          <nav
            className="book-step2__shell-inner book-step2__crumbs-inner"
            data-name="component.breadcrumbs"
            aria-label="Breadcrumb"
          >
            <button type="button" className="book-step2__crumb-link">
              Home
            </button>
            <span className="book-step2__crumb-sep" aria-hidden>
              /
            </span>
            <span className="book-step2__crumb-current">Book Appointment</span>
          </nav>
        </div>
      </div>

      <div className="book-step2__body">
        <div className="book-step2__body-fill" aria-hidden>
          <div className="book-step2__body-fill-solid" />
          <img
            className="book-step2__body-fill-img"
            src={imgBodyFill}
            alt=""
          />
        </div>

        <div className="book-step2__shell">
          <div className="book-step2__shell-inner book-step2__main">
            <h1 className="book-step2__title">Book Appointment</h1>
            <BookProgress onBackToStep1={onBackToStep1} />

            <section
              className="book-step2__card"
              data-name="component.appointment.summary"
              aria-labelledby="book-step2-datetime"
            >
              <div className="book-step2__pill-stack">
                <SummaryPill
                  label="Vaccine"
                  value={vaccineName}
                  onChange={onChangeVaccine}
                />
                <SummaryPill
                  label="Recipient"
                  value={recipientModeLabel(recipient)}
                  onChange={onChangeRecipient}
                />
                <SummaryPill
                  label="Location"
                  value={locationValue}
                  onChange={onChangeLocation}
                />
              </div>

              <h2
                id="book-step2-datetime"
                className="book-step2__section-title"
              >
                Choose Date and Time
              </h2>

              <div className="book-step2__datetime">
                <div
                  className="book-step2__notice"
                  data-name="component.gse.system.message"
                >
                  <p>You can book appointments up to 28 days in advance</p>
                </div>

                <div className="book-step2__months">
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

                <p className="book-step2__date-heading">{heading}</p>

                <div className="book-step2__times">
                  <TimeSection
                    label="Morning"
                    slots={BOOK_STEP2_MORNING}
                    selected={slot.time}
                    onSelect={(time) => onSlotChange({ ...slot, time })}
                  />
                  <hr className="book-step2__time-rule" />
                  <TimeSection
                    label="Afternoon"
                    slots={BOOK_STEP2_AFTERNOON}
                    selected={slot.time}
                    onSelect={(time) => onSlotChange({ ...slot, time })}
                  />
                  <hr className="book-step2__time-rule" />
                  <TimeSection
                    label="Evening"
                    slots={BOOK_STEP2_EVENING}
                    selected={slot.time}
                    onSelect={(time) => onSlotChange({ ...slot, time })}
                  />
                </div>
              </div>

              <div className="book-step2__cta-wrap">
                <ButtonPrimary
                  className="book-step2__reserve uxds-btn-primary--commerce"
                  onClick={onReserve}
                >
                  Reserve Appointment
                </ButtonPrimary>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
