import { useState } from "react";
import productImage from "@/projects/boots-pharmacy/frame/ac6ed7db66adf30dd80e0290b6a431d7de94e7bc.png";
import bodyFill from "@/projects/boots-pharmacy/frame/dbcd84d6da292330c6f57adefa32dd4b969ac8bd.png";
import {
  isInWishlist,
  PDP_WISHLIST_ID,
  toggleWishlist,
  WISHLIST_HEART_OUTLINE_D,
  FILLED_HEART_D,
} from "@/projects/boots-pharmacy/chrome/headerMount";
import {
  PDP_CHECKBOX_LABEL,
  PDP_PRICE_WITH_BOOSTER,
  PDP_PRICE_WITHOUT_BOOSTER,
} from "@/projects/boots-pharmacy/data/orderPricing";
import { ButtonPrimary } from "@/uxds/components";
import { PDP_REACT_SCREEN_ID } from "./pdpContract";
import "./pdp.css";

const SERVICE_BLURB =
  "Our private Chickenpox Vaccination Service is suitable for adults and children aged between one and 65 years. A full course consists of two doses given 4 to 6 weeks apart. Eligibility criteria apply and suitability will be checked before each vaccination is given.";

const CHECKBOX_HELPER =
  "Automatically schedules and reminds you about your second dose so you do not miss the recommended window. You can change the appointment later in Account Settings. Learn More";

const ADVANTAGE_COPY =
  "Collect 3 points for every £1 you spend with Boots Advantage Card‡";

export type PdpScreenProps = {
  includeBoosterDose: boolean;
  onToggleBooster: () => void;
  onBookNow: () => void;
  onCheckAvailability: () => void;
  onGoPlp: () => void;
  onGoHome: () => void;
  onOpenLogin: (tab: "signin" | "create") => void;
  loggedIn: boolean;
};

type RecipientTab = "myself" | "someone-else";

function formatBookPrice(amount: number): string {
  return `£${amount}`;
}

function CheckboxCheckMark() {
  return (
    <span
      className="pdp__checkbox-mark"
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

function QuestionGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
      <path
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0Zm-.75 4.5a.75.75 0 0 1 1.5 0v.25a2.25 2.25 0 0 0-1.5 2.1v.4a.75.75 0 0 1-1.5 0v-.4A3.75 3.75 0 0 1 7.25 4.75v-.25ZM8 12a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
      />
    </svg>
  );
}

function ShareGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
      <path
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10.5 1.75a2.25 2.25 0 1 0 0 4.5 2.2 2.2 0 0 0-.9-.2l-3.2 1.6a2.25 2.25 0 1 0 0 1.15l3.2 1.6c.28-.12.58-.18.9-.18a2.25 2.25 0 1 0 0-1.5 2.2 2.2 0 0 0-.9.2l-3.2-1.6a2.25 2.25 0 0 0 0-1.15l3.2-1.6c.28.12.58.18.9.18a2.25 2.25 0 1 0 0-1.5Z"
      />
    </svg>
  );
}

function HeartGlyph({ filled }: { filled: boolean }) {
  return (
    <svg width="16" height="14" viewBox="0 0 16 14" aria-hidden>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        fill="currentColor"
        d={filled ? FILLED_HEART_D : WISHLIST_HEART_OUTLINE_D}
      />
    </svg>
  );
}

export function PdpScreen({
  includeBoosterDose,
  onToggleBooster,
  onBookNow,
  onCheckAvailability,
  onGoPlp,
  onGoHome,
  onOpenLogin,
  loggedIn,
}: PdpScreenProps) {
  const [recipientTab, setRecipientTab] = useState<RecipientTab>("myself");
  const [wishlistTick, setWishlistTick] = useState(0);

  const wishlisted = wishlistTick >= 0 && isInWishlist(PDP_WISHLIST_ID);
  const bookPrice = includeBoosterDose
    ? PDP_PRICE_WITH_BOOSTER
    : PDP_PRICE_WITHOUT_BOOSTER;

  return (
    <div
      className="pdp"
      data-studio-react-screen={PDP_REACT_SCREEN_ID}
      data-name="module.pdp"
    >
      <header className="pdp__crumbs">
        <div className="pdp__shell">
          <nav className="pdp__crumbs-inner" aria-label="Breadcrumb">
            <button type="button" className="pdp__crumb-link" onClick={onGoHome}>
              Home
            </button>
            <span className="pdp__crumb-sep" aria-hidden>
              /
            </span>
            <span className="pdp__crumb-muted">Health Services</span>
            <span className="pdp__crumb-sep" aria-hidden>
              /
            </span>
            <button
              type="button"
              className="pdp__crumb-link"
              data-studio-crumb="vaccination"
              onClick={onGoPlp}
            >
              Vaccination
            </button>
            <span className="pdp__crumb-sep" aria-hidden>
              /
            </span>
            <span className="pdp__crumb-current">Chickenpox</span>
          </nav>
        </div>
      </header>

      <main className="pdp__main">
        <section className="pdp__rtb-band" aria-label="Product details">
          <div className="pdp__body-fill" aria-hidden>
            <img src={bodyFill} alt="" />
          </div>

          <div className="pdp__shell pdp__rtb-shell">
            <div className="pdp__rtb-card" data-name="module.pdp.rtb">
              <div className="pdp__rtb-row">
                <div className="pdp__media">
                  <div
                    className="pdp__product-image"
                    data-name="component.product.image.basic"
                  >
                    <img src={productImage} alt="" />
                  </div>
                </div>

                <div className="pdp__rtb-col" data-name="component.pdp.rtb">
                  <div className="pdp__title-block">
                    <h1 className="pdp__title">Chickenpox</h1>
                    <p className="pdp__service-id">
                      Service Identifier: BTS-PHM-VAR-00075
                    </p>
                  </div>

                  <div className="pdp__price-row">
                    <div
                      className="pdp__list-price"
                      data-name="component.product.price"
                    >
                      <span className="pdp__price-currency">£</span>
                      <span className="pdp__price-amount">75.00</span>
                    </div>
                    <p className="pdp__price-note">Single dose price</p>
                  </div>

                  <div className="pdp__recipient-row">
                    <div className="pdp__toggle" role="group" aria-label="Recipient">
                      <button
                        type="button"
                        className="pdp__toggle-tab"
                        data-name="units"
                        data-toggle-index="0"
                        data-toggle-active={
                          recipientTab === "myself" ? "true" : undefined
                        }
                        aria-pressed={recipientTab === "myself"}
                        onClick={() => setRecipientTab("myself")}
                      >
                        Myself
                      </button>
                      <button
                        type="button"
                        className="pdp__toggle-tab"
                        data-name="units"
                        data-toggle-index="1"
                        data-toggle-active={
                          recipientTab === "someone-else" ? "true" : undefined
                        }
                        aria-pressed={recipientTab === "someone-else"}
                        onClick={() => setRecipientTab("someone-else")}
                      >
                        Someone else
                      </button>
                    </div>

                    {!loggedIn ? (
                      <div className="pdp__login-block">
                        <p>Boots Account will be required to proceed.</p>
                        <div className="pdp__login-links">
                          <button
                            type="button"
                            className="pdp__login-link"
                            onClick={() => onOpenLogin("signin")}
                          >
                            Quick Sign In
                          </button>
                          <span className="pdp__login-or">or</span>
                          <button
                            type="button"
                            className="pdp__login-link"
                            onClick={() => onOpenLogin("create")}
                          >
                            Create Boots Account
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <p className="pdp__blurb">{SERVICE_BLURB}</p>

                  <div className="pdp__booster-band" data-name="units">
                    <button
                      type="button"
                      className="pdp__checkbox-row"
                      data-name="component.input.checkbox"
                      data-checkbox-checked={String(includeBoosterDose)}
                      data-studio-react-owned="true"
                      onClick={onToggleBooster}
                    >
                      <span
                        className="pdp__checkbox-icon"
                        data-name="icon / input / checkbox"
                      >
                        <span className="pdp__checkbox-box" data-name="box">
                          {includeBoosterDose ? <CheckboxCheckMark /> : null}
                        </span>
                      </span>
                      <span className="pdp__checkbox-label" data-name="Label">
                        {PDP_CHECKBOX_LABEL}
                      </span>
                    </button>
                    <p className="pdp__checkbox-helper">{CHECKBOX_HELPER}</p>
                  </div>

                  <div className="pdp__cta-row">
                    <ButtonPrimary
                      className="pdp__book uxds-btn-primary--commerce"
                      data-studio-action="pdp-book-now"
                      onClick={onBookNow}
                    >
                      Book now - {formatBookPrice(bookPrice)}
                    </ButtonPrimary>

                    <button
                      type="button"
                      className="pdp__secondary"
                      data-name="component.input.button"
                      data-studio-action="pdp-check-availability"
                      onClick={onCheckAvailability}
                    >
                      <span className="pdp__secondary-icon" aria-hidden>
                        <QuestionGlyph />
                      </span>
                      <span className="pdp__secondary-label">
                        Check availability
                      </span>
                    </button>

                    <div className="pdp__icon-hits">
                      <button
                        type="button"
                        className="pdp__icon-hit"
                        data-name="component.input.button"
                        aria-pressed={wishlisted}
                        aria-label={
                          wishlisted
                            ? "Remove from wishlist"
                            : "Add to wishlist"
                        }
                        onClick={() => {
                          toggleWishlist(PDP_WISHLIST_ID);
                          setWishlistTick((t) => t + 1);
                        }}
                      >
                        <span
                          className={`pdp__heart-icon${wishlisted ? " is-active" : ""}`}
                          data-name="icon=add to wishlist"
                          data-fav-active={String(wishlisted)}
                          data-studio-wishlist-id={PDP_WISHLIST_ID}
                        >
                          <HeartGlyph filled={wishlisted} />
                        </span>
                      </button>

                      <button
                        type="button"
                        className="pdp__icon-hit"
                        data-name="component.input.button"
                        aria-label="Share"
                      >
                        <span className="pdp__share-icon" data-name="icon=share">
                          <ShareGlyph />
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div
                className="pdp__advantage"
                data-name="component.gse.system.message"
              >
                <p>{ADVANTAGE_COPY}</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
