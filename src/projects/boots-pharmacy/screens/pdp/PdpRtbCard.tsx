import { useEffect, useRef, useState } from "react";
import productImage from "@/projects/boots-pharmacy/frame/ac6ed7db66adf30dd80e0290b6a431d7de94e7bc.png";
import {
  isInWishlist,
  PDP_WISHLIST_ADD_DELAY_MS,
  PDP_WISHLIST_ID,
  toggleWishlist,
  WISHLIST_HEART_OUTLINE_D,
  FILLED_HEART_D,
} from "@/projects/boots-pharmacy/chrome/headerMount";
import { playbackMs } from "@/app/shell/playbackTiming";
import {
  PDP_CHECKBOX_LABEL,
  PDP_PRICE_WITH_BOOSTER,
  PDP_PRICE_WITHOUT_BOOSTER,
} from "@/projects/boots-pharmacy/data/orderPricing";
import { ButtonPrimary } from "@/uxds/components";
import { PDP_SERVICE_BLURB } from "./pdpContract";

const CHECKBOX_HELPER =
  "Automatically schedules and reminds you about your second dose so you do not miss the recommended window. You can change the appointment later in Account Settings. Learn More";

const ADVANTAGE_COPY =
  "Collect 3 points for every £1 you spend with Boots Advantage Card‡";

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

/** Make `icon=question` path (svgPaths.p116ea480). */
const QUESTION_GLYPH_D =
  "M8 0C3.584 0 0 3.584 0 8C0 12.416 3.584 16 8 16C12.416 16 16 12.416 16 8C16 3.584 12.416 0 8 0ZM8.80313 12.8C8.80313 13.2418 8.44495 13.6 8.00313 13.6C7.5613 13.6 7.20312 13.2418 7.20312 12.8C7.20312 12.3582 7.5613 12 8.00313 12C8.44495 12 8.80313 12.3582 8.80313 12.8ZM9.73288 8.13639L10.4529 7.40039C10.9089 6.94439 11.1969 6.30439 11.1969 5.60039C11.1969 3.83239 9.76488 2.40039 7.99687 2.40039C6.50223 2.40039 5.24772 3.42381 4.89552 4.80847C4.78661 5.23666 5.15505 5.60039 5.59688 5.60039C6.0387 5.60039 6.38083 5.22073 6.59385 4.83364C6.86655 4.33811 7.39419 4.00039 7.99687 4.00039C8.87687 4.00039 9.59688 4.72039 9.59688 5.60039C9.59688 6.04039 9.42088 6.44039 9.12488 6.72839L8.13288 7.73639C7.55688 8.32039 7.19688 9.12039 7.19688 10.0004C7.19688 10.2213 7.37596 10.4004 7.59688 10.4004H7.99688C8.4387 10.4004 8.77972 10.0378 8.86566 9.60439C8.99602 8.947 9.30479 8.57042 9.73288 8.13639Z";

/** Make `icon=share` path (svgPaths.p1dcca380). */
const SHARE_GLYPH_D =
  "M10.2 5.29223L6.41178 7.18633C6.54862 7.7179 6.54862 8.28239 6.41178 8.81399L10.2 10.7081C11.4132 9.19424 13.6725 9.06595 15.0462 10.4397C16.3179 11.712 16.3179 13.7739 15.0462 15.0457C13.7737 16.3181 11.7118 16.3181 10.4394 15.0457C9.63605 14.2424 9.29589 13.0629 9.58801 11.9285L5.80044 10.0344C4.58725 11.5483 2.32799 11.6766 0.954308 10.3029C-0.318103 9.03112 -0.318103 6.96857 0.954308 5.6968C2.32803 4.3231 4.58726 4.45073 5.80044 5.96524L9.58801 4.07114C9.05905 2.01654 10.6098 0 12.7426 0C14.5414 0 16 1.45858 16 3.25732C16 5.05608 14.5414 6.51463 12.7426 6.51463C11.7222 6.51463 10.8019 6.04423 10.1991 5.29225L10.2 5.29223ZM4.59058 6.6666C3.85437 5.93041 2.65957 5.93041 1.92338 6.6666C1.18717 7.4028 1.18717 8.59758 1.92338 9.33376C2.65959 10.07 3.85439 10.07 4.59058 9.33376C5.32679 8.59757 5.32679 7.40278 4.59058 6.6666Z";

function QuestionGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
      <path
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
        d={QUESTION_GLYPH_D}
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
        d={SHARE_GLYPH_D}
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

export type PdpRtbCardProps = {
  includeBoosterDose: boolean;
  onToggleBooster: () => void;
  onBookNow: () => void;
  loggedIn: boolean;
  onOpenLogin: (tab: "signin" | "create") => void;
  /** PDP page: "Check availability" opens the availability tool. Quick View: "View Details" navigates to the full PDP. */
  secondaryLabel: string;
  onSecondaryAction: () => void;
};

/**
 * The RTB (Right To Buy) card — product image, price, recipient toggle,
 * booster checkbox, book/secondary CTAs, wishlist heart. Shared by the full
 * PDP screen and the Quick View popup so both render the real thing instead
 * of Quick View cloning PDP's live DOM (that clone approach broke outright
 * once PDP started truly unmounting on navigate-away — Erase-Make Phase E).
 */
export function PdpRtbCard({
  includeBoosterDose,
  onToggleBooster,
  onBookNow,
  loggedIn,
  onOpenLogin,
  secondaryLabel,
  onSecondaryAction,
}: PdpRtbCardProps) {
  const [recipientTab, setRecipientTab] = useState<RecipientTab>("myself");
  const [wishlistTick, setWishlistTick] = useState(0);

  const wishlisted = wishlistTick >= 0 && isInWishlist(PDP_WISHLIST_ID);
  // Click-optimistic only, same pattern as PLP's tile heart.
  const [optimisticOn, setOptimisticOn] = useState<boolean | null>(null);
  const heartActive = optimisticOn ?? wishlisted;
  // Optimistic flip landed but the delayed real commit hasn't (add path
  // only — remove commits synchronously so this never latches true there).
  const wishlistCommitPending = heartActive && !wishlisted;
  // Bumps once per real add-commit (false → true) so the CSS pulse can
  // replay — never on mount, never on remove.
  const wasWishlistedRef = useRef(wishlisted);
  const [commitPulseKey, setCommitPulseKey] = useState(0);
  const [heartPulsing, setHeartPulsing] = useState(false);
  const wishlistAddTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  useEffect(() => {
    setOptimisticOn(null);
    if (!wasWishlistedRef.current && wishlisted) {
      setCommitPulseKey((k) => k + 1);
    }
    wasWishlistedRef.current = wishlisted;
  }, [wishlisted]);

  useEffect(() => {
    if (commitPulseKey === 0) return;
    setHeartPulsing(true);
    const t = setTimeout(() => setHeartPulsing(false), 320);
    return () => clearTimeout(t);
  }, [commitPulseKey]);

  useEffect(
    () => () => {
      if (wishlistAddTimerRef.current) clearTimeout(wishlistAddTimerRef.current);
    },
    []
  );

  const bookPrice = includeBoosterDose
    ? PDP_PRICE_WITH_BOOSTER
    : PDP_PRICE_WITHOUT_BOOSTER;

  return (
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
            <div className="pdp__list-price" data-name="component.product.price">
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
                    data-studio-action="pdp-quick-sign-in"
                    onClick={() => onOpenLogin("signin")}
                  >
                    Quick Sign In
                  </button>
                  <span className="pdp__login-or">or</span>
                  <button
                    type="button"
                    className="pdp__login-link"
                    data-studio-action="pdp-create-account"
                    onClick={() => onOpenLogin("create")}
                  >
                    Create Boots Account
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          <p className="pdp__blurb">{PDP_SERVICE_BLURB}</p>

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
              onClick={onSecondaryAction}
            >
              <span className="pdp__secondary-icon" aria-hidden>
                <QuestionGlyph />
              </span>
              <span className="pdp__secondary-label">{secondaryLabel}</span>
            </button>

            <div className="pdp__icon-hits">
              <button
                type="button"
                className="pdp__icon-hit"
                data-name="component.input.button"
                aria-pressed={heartActive}
                aria-label={
                  wishlistCommitPending
                    ? "Saving to wishlist"
                    : heartActive
                      ? "Remove from wishlist"
                      : "Add to wishlist"
                }
                onPointerDown={() => setOptimisticOn(!heartActive)}
                onClick={() => {
                  const pendingAdd = wishlistAddTimerRef.current;
                  if (wishlisted || pendingAdd != null) {
                    if (pendingAdd != null) {
                      // Still pending — cancel; nothing was ever added.
                      clearTimeout(pendingAdd);
                      wishlistAddTimerRef.current = null;
                      setOptimisticOn(null);
                      return;
                    }
                    toggleWishlist(PDP_WISHLIST_ID);
                    setWishlistTick((t) => t + 1);
                    return;
                  }
                  // Adding — hold the commit open so the pending
                  // spinner / commit pulse IxD has time to show
                  // (engine playbackMs, not a raw ms).
                  wishlistAddTimerRef.current = setTimeout(() => {
                    wishlistAddTimerRef.current = null;
                    toggleWishlist(PDP_WISHLIST_ID);
                    setWishlistTick((t) => t + 1);
                  }, playbackMs(PDP_WISHLIST_ADD_DELAY_MS));
                }}
              >
                <span
                  className={`pdp__heart-icon${heartActive ? " is-active" : ""}`}
                  data-name="icon=add to wishlist"
                  data-fav-active={String(heartActive)}
                  data-fav-pending={String(wishlistCommitPending)}
                  data-fav-pulse={String(heartPulsing)}
                  data-studio-wishlist-id={PDP_WISHLIST_ID}
                >
                  <HeartGlyph filled={heartActive} />
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

      <div className="pdp__advantage" data-name="component.gse.system.message">
        <p>{ADVANTAGE_COPY}</p>
      </div>
    </div>
  );
}
