import locationsMapChosen from "@/assets/locations-map-chosen.png";
import imgBodyFill from "@/projects/boots-pharmacy/frame/6d60145a5be9172088977b4513e3f4859a70c66a.png";
import { NearMeCta } from "@/projects/boots-pharmacy/chrome/NearMeCta";
import {
  AppointmentSummaryPill,
  AppointmentSummaryStack,
  BookAppointmentProgress,
  ButtonPrimary,
  buildBookProgressSteps,
} from "@/uxds/components";
import {
  Disclosure,
  DisclosureContent,
  DisclosureTrigger,
} from "@/uxds/interactions";
import type { RecipientMode } from "@/projects/boots-pharmacy/popups/RecipientPickerPopup";
import { recipientModeLabel } from "@/projects/boots-pharmacy/popups/RecipientPickerPopup";
import {
  BOOK_STEP1_CHOSEN_SLOT_CLASS,
  BOOK_STEP1_REACT_SCREEN_ID,
} from "./bookStep1Contract";
import "./book-step-1-location.css";

const BOOSTER_LABEL = "Include booking booster dose at a future date";
const SEARCH_PLACEHOLDER = "Search for City, Postcode, Location...";

export type BookStep1ChosenLocation = {
  name: string;
  address: string;
  storeId?: string;
};

export type BookStep1LocationScreenProps = {
  chosenLocation: BookStep1ChosenLocation | null;
  vaccineName: string;
  recipient: RecipientMode;
  includeBoosterDose: boolean;
  onOpenSearch: () => void;
  onOpenNearMe: () => void;
  onChangeLocation: () => void;
  onChangeVaccine: () => void;
  onChangeRecipient: () => void;
  onToggleBooster: () => void;
  onContinue: () => void;
};

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

/** Make Body5 TextField3 search glyph — navy at rest */
function SearchGlyph() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M19.136 9.92c0-4.261-3.454-7.716-7.716-7.716S3.705 5.659 3.705 9.92s3.454 7.715 7.715 7.715 7.716-3.454 7.716-7.715Zm2.204 0c0 5.478-4.441 9.92-9.92 9.92S1.5 15.398 1.5 9.92 5.941 0 11.42 0s9.92 4.441 9.92 9.92Z"
        fill="var(--uxds-input-button-surface-surface-commerce-solid)"
      />
      <path
        d="M24 20.941 22.441 22.5l-6.353-6.353 1.558-1.559L24 20.941Z"
        fill="var(--uxds-input-button-surface-surface-commerce-solid)"
      />
    </svg>
  );
}

/** Make Book Step 1 checkmark (`element. gse. checkbox. check mark`) */
function CheckboxCheckMark() {
  return (
    <span
      className="book-step-1__checkbox-mark"
      data-name="element. gse. checkbox. check mark"
      aria-hidden
    >
      <svg width="14" height="10" viewBox="0 0 13.4079 10.1151" fill="none">
        <path
          fill="var(--uxds-badge-text-on-variant-1)"
          fillRule="evenodd"
          clipRule="evenodd"
          d="M0 5.49077L1.40162 4.06407L4.69457 7.29914L11.9937 0L13.4079 1.41421L4.70705 10.1151L0 5.49077Z"
        />
      </svg>
    </span>
  );
}

/**
 * React + UXDS pilot for Book — Step 1 (Location).
 * Retires Make HTML for this screen only; Studio wiring preserved via data-name.
 * Visual source: Make Frame child 7 / Body5 + live globals-screens overrides.
 */
export function BookStep1LocationScreen({
  chosenLocation,
  vaccineName,
  recipient,
  includeBoosterDose,
  onOpenSearch,
  onOpenNearMe,
  onChangeLocation,
  onChangeVaccine,
  onChangeRecipient,
  onToggleBooster,
  onContinue,
}: BookStep1LocationScreenProps) {
  const progressSteps = buildBookProgressSteps(1);
  return (
    <div
      className="book-step-1"
      data-name="body"
      data-studio-react-screen={BOOK_STEP1_REACT_SCREEN_ID}
    >
      {/*
        Content grid (same as Footer / header logo column):
        full-bleed band → max 1440 shell + 64px side pad → max 1312 inner.
      */}
      <div className="book-step-1__crumbs" data-name="module.breadcrumbs">
        <div className="book-step-1__shell">
          <nav
            className="book-step-1__shell-inner book-step-1__crumbs-inner"
            data-name="component.breadcrumbs"
            aria-label="Breadcrumb"
          >
            <button type="button" className="book-step-1__crumb-link">
              Home
            </button>
            <span className="book-step-1__crumb-sep" aria-hidden>
              /
            </span>
            <span className="book-step-1__crumb-current">Book Appointment</span>
          </nav>
        </div>
      </div>

      <div className="book-step-1__body">
        {/* Make Body5: white base + decorative fill image @ opacity 0.31 */}
        <div className="book-step-1__body-fill" aria-hidden>
          <div className="book-step-1__body-fill-solid" />
          <img
            className="book-step-1__body-fill-img"
            src={imgBodyFill}
            alt=""
          />
        </div>

        <div className="book-step-1__shell">
          <div className="book-step-1__shell-inner book-step-1__main">
            <h1 className="book-step-1__title">Book Appointment</h1>
            <BookAppointmentProgress steps={progressSteps} />

            <section
              className="book-step-1__card"
              aria-labelledby="book-step-1-location"
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
            </AppointmentSummaryStack>

            <h2 id="book-step-1-location" className="book-step-1__section-title">
              Location
            </h2>

            <div data-name="chosen location" className="book-step-1__location">
              {!chosenLocation ? (
                <>
                  <div className="book-step-1__location-field">
                    <p className="book-step-1__field-label" data-name="Label">
                      Location
                    </p>
                    <button
                      type="button"
                      className="book-step-1__search"
                      data-name="component.input.field"
                      onClick={onOpenSearch}
                    >
                      <span
                        data-name="Text Field"
                        className="book-step-1__search-text"
                      >
                        <p>{SEARCH_PLACEHOLDER}</p>
                      </span>
                      <span
                        data-name="icon=search"
                        data-studio-search-icon="true"
                        className="book-step-1__search-icon"
                      >
                        <SearchGlyph />
                      </span>
                    </button>
                  </div>

                  <div className="book-step-1__near-me">
                    <NearMeCta onClick={onOpenNearMe} />
                  </div>
                </>
              ) : (
                <div
                  className={`${BOOK_STEP1_CHOSEN_SLOT_CLASS} book-step-1__chosen`}
                >
                  <div className="book-step-1__map" data-name="image 61">
                    <img
                      className="proto-chosen-map-bg"
                      src={locationsMapChosen}
                      alt={`Map showing ${chosenLocation.name}`}
                    />
                  </div>
                  <div
                    className="book-step-1__store"
                    data-name="boots-pharmacy.store"
                  >
                    <div>
                      <p className="book-step-1__store-name">
                        {chosenLocation.name}
                      </p>
                      <p className="book-step-1__store-address">
                        {chosenLocation.address}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="uxds-summary-pill__change"
                      data-name="component.input.button"
                      data-studio-change-loc="true"
                      onClick={onChangeLocation}
                    >
                      <EditGlyph />
                      <span>Change location</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="book-step-1__booster" data-name="units">
              <label
                className="book-step-1__checkbox-row"
                data-name="component.input.checkbox"
                data-studio-booster="true"
                data-studio-react-owned="true"
                data-checkbox-checked={String(includeBoosterDose)}
              >
                <span
                  className="book-step-1__checkbox-icon"
                  data-name="icon / input / checkbox"
                >
                  <span className="book-step-1__checkbox-box" data-name="box">
                    {includeBoosterDose ? <CheckboxCheckMark /> : null}
                  </span>
                  <input
                    type="checkbox"
                    className="book-step-1__checkbox-input"
                    checked={includeBoosterDose}
                    onChange={onToggleBooster}
                    aria-label={BOOSTER_LABEL}
                  />
                </span>
                <span data-name="Label">
                  <p>{BOOSTER_LABEL}</p>
                </span>
              </label>
              <Disclosure
                defaultOpen={false}
                className="book-step-1__booster-more"
              >
                {({ open, toggle }) => (
                  <>
                    <DisclosureTrigger
                      open={open}
                      onToggle={toggle}
                      className="uxds-link book-step-1__learn-more"
                    >
                      Learn more
                    </DisclosureTrigger>
                    <DisclosureContent
                      open={open}
                      className="book-step-1__learn-body"
                    >
                      Automatically schedules or reminds you about your
                      follow-up shot so you don&apos;t miss your window.
                    </DisclosureContent>
                  </>
                )}
              </Disclosure>
            </div>

            <div className="book-step-1__cta-wrap">
              <ButtonPrimary
                className="book-step-1__continue uxds-btn-primary--commerce"
                data-studio-action="book-step-1-continue"
                onClick={onContinue}
              >
                Continue
              </ButtonPrimary>
            </div>
          </section>

          <aside
            className="book-step-1__help"
            data-name="component.errors.footer"
          >
            <p>
              Speak to our dedicated customer service team on{" "}
              <a className="uxds-link" href="tel:03451253752">
                0345 125 3752
              </a>
            </p>
            <p>
              We&apos;re here for you
              <br />
              Mon-Fri: 8:30am - 6:30pm, Sat: 8:45am – 5pm, Sun: 10am - 5pm
            </p>
          </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
