import { useEffect, useRef, useState } from "react";
import "@/projects/boots-pharmacy/chrome/header.css";
import userAvatar from "@/assets/user-avatar.jpg";
import {
  HEADER_ACCOUNT_MENU_GUEST,
  HEADER_ACCOUNT_MENU_LOGGED_IN,
  HEADER_APPOINTMENTS_BADGE_COUNT,
  HEADER_CHEVRON_PATH,
  HEADER_CHEVRON_VIEWBOX,
  HEADER_GREETING,
  HEADER_GUEST_GLYPH,
  HEADER_LOGO_PATH,
  HEADER_LOGO_VIEWBOX,
  HEADER_SEARCH_GLYPH,
  type HeaderAccountMenuAction,
  type HeaderAccountMenuBadgeKey,
  type HeaderIcon,
  type HeaderNavItemKind,
} from "@/projects/boots-pharmacy/chrome/headerContent";
import { BOOTS_PHARMACY_CONTENT_PACK } from "@/projects/boots-pharmacy/contentPack";

const HEADER_NAV_ITEMS = BOOTS_PHARMACY_CONTENT_PACK.nav.primary!.map((node) => ({
  label: node.label,
  kind: node.type as HeaderNavItemKind,
}));

const SHOW_DELAY_MS = 100;
const HIDE_DELAY_MS = 200;

export type HeaderNavHandlers = {
  onNavigate?: (screenIndex: number) => void;
  onNavigateToPlp?: () => void;
  onLoginClick?: (tab?: "signin" | "create") => void;
  onSignOut?: () => void;
  /** Fires on every avatar-item hover (headerMount resets the transient dot/badge cue on this — same timing as before). */
  onAvatarHover?: () => void;
};

export type HeaderProps = HeaderNavHandlers & {
  isLoggedIn: boolean;
  wishlistCount: number;
  savedLocationsCount: number;
  /** Transient cue — flashes after a wishlist/location add (headerMount owns the ~2s timeout). */
  avatarDotVisible?: boolean;
  wishlistBadgeHighlight?: boolean;
  locationsBadgeHighlight?: boolean;
};

/** Generic stroke-icon renderer for `HeaderIcon` shape data — no invented glyphs, just data → SVG. */
function HeaderGlyphIcon({ icon, size = 18 }: { icon: HeaderIcon; size?: number }) {
  return (
    <svg width={size} height={size} viewBox={icon.viewBox} fill="none" aria-hidden focusable="false">
      {icon.shapes.map((shape, index) => {
        if (shape.kind === "circle") {
          return (
            <circle
              key={index}
              cx={shape.cx}
              cy={shape.cy}
              r={shape.r}
              stroke={icon.stroke}
              strokeWidth={1.5}
            />
          );
        }
        if (shape.kind === "rect") {
          return (
            <rect
              key={index}
              x={shape.x}
              y={shape.y}
              width={shape.width}
              height={shape.height}
              rx={shape.rx}
              stroke={icon.stroke}
              strokeWidth={1.5}
            />
          );
        }
        return (
          <path
            key={index}
            d={shape.d}
            stroke={icon.stroke}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      })}
    </svg>
  );
}

function HeaderLogo() {
  return (
    <div
      className="proto-header-sticky__logo"
      data-name="boots-pharmacy"
      role="link"
      aria-label="Boots Pharmacy home"
      tabIndex={0}
    >
      <svg
        viewBox={HEADER_LOGO_VIEWBOX}
        fill="none"
        aria-hidden
        focusable="false"
        className="proto-header-sticky__logo-mark"
      >
        <path d={HEADER_LOGO_PATH} fill="white" fillRule="evenodd" clipRule="evenodd" />
      </svg>
    </div>
  );
}

function HeaderNav() {
  return (
    <nav className="proto-header-sticky__nav" aria-label="Primary">
      {HEADER_NAV_ITEMS.map((item) => (
        <div
          key={item.label}
          className="proto-header-sticky__nav-item"
          data-name="component.mega.menu.item"
          data-studio-action={`header-nav-${item.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
        >
          <p>{item.label}</p>
          {item.kind !== "link" ? (
            <svg
              className="proto-header-sticky__nav-chevron"
              viewBox={HEADER_CHEVRON_VIEWBOX}
              fill="none"
              aria-hidden
              focusable="false"
            >
              <path d={HEADER_CHEVRON_PATH} fill="#7A7D87" />
            </svg>
          ) : null}
        </div>
      ))}
    </nav>
  );
}

function HeaderSearchAuxItem() {
  return (
    <div
      className="proto-header-sticky__aux-item"
      data-name="component.header.aux.nav.item"
      data-studio-action="header-aux-search"
    >
      <span className="proto-header-search-icon">
        <HeaderGlyphIcon icon={HEADER_SEARCH_GLYPH} size={16} />
      </span>
      <p>Search</p>
    </div>
  );
}

function HeaderAccountAuxItem({
  isLoggedIn,
  wishlistCount,
  savedLocationsCount,
  avatarDotVisible,
  wishlistBadgeHighlight,
  locationsBadgeHighlight,
  onNavigate,
  onNavigateToPlp,
  onLoginClick,
  onSignOut,
  onAvatarHover,
}: HeaderProps) {
  const [open, setOpen] = useState(false);
  const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (showTimer.current) clearTimeout(showTimer.current);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    },
    [],
  );

  const scheduleShow = () => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
    onAvatarHover?.();
    if (open) return;
    showTimer.current = setTimeout(() => setOpen(true), SHOW_DELAY_MS);
  };
  const scheduleHide = () => {
    if (showTimer.current) {
      clearTimeout(showTimer.current);
      showTimer.current = null;
    }
    hideTimer.current = setTimeout(() => setOpen(false), HIDE_DELAY_MS);
  };

  const menuItems = isLoggedIn ? HEADER_ACCOUNT_MENU_LOGGED_IN : HEADER_ACCOUNT_MENU_GUEST;

  const handleAction = (action: HeaderAccountMenuAction) => {
    setOpen(false);
    if (action === "login") onLoginClick?.("signin");
    else if (action === "create") onLoginClick?.("create");
    else if (action === "appointments") onNavigate?.(7);
    else if (action === "signout") onSignOut?.();
    // "account" / "locations" / "wishlist" have no wired destination yet —
    // same honest under-match as the prior hand-rolled flyout markup.
    void onNavigateToPlp;
  };

  const badgeCount = (key: HeaderAccountMenuBadgeKey): number => {
    if (key === "appointments") return HEADER_APPOINTMENTS_BADGE_COUNT;
    if (key === "locations") return savedLocationsCount;
    return wishlistCount;
  };

  return (
    <div
      className="proto-header-sticky__aux-item proto-header-sticky__account-item"
      data-name="component.header.aux.nav.item"
      data-studio-action="header-aux-account"
      style={{ position: "relative", cursor: "default" }}
      onMouseEnter={scheduleShow}
      onMouseLeave={scheduleHide}
    >
      {isLoggedIn ? (
        <img className="proto-header-avatar" src={userAvatar} alt="Sarah" />
      ) : (
        <span className="proto-header-avatar proto-header-avatar--guest">
          <HeaderGlyphIcon icon={HEADER_GUEST_GLYPH} size={24} />
        </span>
      )}
      <span className="proto-avatar-dot" style={{ display: avatarDotVisible ? "block" : "none" }} />
      <p>{isLoggedIn ? "Sarah" : "Log in"}</p>
      {open ? (
        <div className="proto-header-flyout">
          {isLoggedIn ? <p className="proto-header-flyout__greeting">{HEADER_GREETING}</p> : null}
          {menuItems.map((item) => (
            <button
              key={item.action}
              type="button"
              className="proto-header-flyout-item"
              data-action={item.action}
              data-studio-action={`header-account-${item.action}`}
              onClick={() => handleAction(item.action)}
            >
              <HeaderGlyphIcon icon={item.icon} />
              <span>{item.label}</span>
              {item.badgeKey ? (
                <span
                  className={`proto-header-flyout-badge${
                    item.badgeKey === "wishlist"
                      ? " proto-header-flyout-badge--wishlist"
                      : item.badgeKey === "locations"
                        ? " proto-header-flyout-badge--locations"
                        : ""
                  }`}
                  style={{
                    background:
                      (item.badgeKey === "wishlist" && wishlistBadgeHighlight) ||
                      (item.badgeKey === "locations" && locationsBadgeHighlight)
                        ? "#c8247e"
                        : undefined,
                  }}
                >
                  {badgeCount(item.badgeKey)}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Hand-authored Boots Pharmacy header — replaces the old `sourceHeader
 * .cloneNode(true)` on live Legacy DOM (contrast `Footer.tsx` /
 * `footerContent.ts`, already Legacy-free — same extraction pattern applied
 * here). Same visual contract (logo, primary nav row, Search + Login/Sarah
 * aux nav) and the same `data-name` markers (`boots-pharmacy`,
 * `component.mega.menu.item`, `component.header.aux.nav.item`) the existing
 * shared interaction kits (`MegaMenuFlyout` via
 * `healthServicesMegaMenuMount.tsx`, `FullScreenSearch` via
 * `fullScreenSearchMount.tsx`) and the app-wide Home/logo click delegation
 * in `BootsPharmacyProjectView.tsx` already query for — those mounts are
 * unchanged, just rewired at a different DOM source (`headerMount.tsx`).
 */
export default function Header(props: HeaderProps) {
  return (
    <div className="proto-header-sticky" role="banner">
      <div className="proto-header-sticky__row">
        <div className="proto-header-sticky__container">
          <HeaderLogo />
          <HeaderNav />
          <div className="proto-header-sticky__aux">
            <HeaderSearchAuxItem />
            <HeaderAccountAuxItem {...props} />
          </div>
        </div>
      </div>
    </div>
  );
}
