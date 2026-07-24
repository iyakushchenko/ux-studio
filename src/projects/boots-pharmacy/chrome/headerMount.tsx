/**
 * Mounts the hand-authored Boots Pharmacy `Header` (see `Header.tsx` /
 * `headerContent.ts`) as a direct child of the scroll container. Replaces
 * the former `sourceHeader.cloneNode(true)` on live Figma Make DOM — the
 * header no longer reads from `frame/index.tsx` at runtime (contrast the
 * still-live Make body/footer inside that file, out of scope for this
 * lane). Supports logged-in/out state toggling via "Log in" / "Sarah"
 * label, with hover flyout menu — same behavior contract as before, now
 * driven by React state + re-render instead of imperative DOM mutation.
 */
import { createRoot, type Root } from "react-dom/client";
import { flushSync } from "react-dom";
import Header, {
  type HeaderNavHandlers,
} from "@/projects/boots-pharmacy/chrome/Header";
import {
  isStudioLoggedIn,
  setStudioLoggedIn,
  subscribeStudioLoggedIn,
} from "@/app/shell/studioAuthSession";
import {
  getSavedLocationsCount,
  isInSavedLocations,
  SAVED_LOCATIONS_CHANGE_EVENT,
  toggleSavedLocation,
} from "@/projects/boots-pharmacy/data/savedLocations";
import { attachHealthServicesMegaMenu } from "@/projects/boots-pharmacy/chrome/healthServicesMegaMenuMount";
import { attachFullScreenSearch } from "@/projects/boots-pharmacy/chrome/fullScreenSearchMount";
import userAvatar from "@/assets/user-avatar.jpg";

const HEADER_MOUNT_CLASS = "proto-header-mount";

// Account / post-booking screens always show Sarah logged in — not browse (PLP/PDP).
const LOGGED_IN_CHILD_INDICES = [1, 2, 3];

// ── Wishlist state (persisted in localStorage) ──────────────────────────────
const WISHLIST_KEY = "proto-wishlist";
let wishlistSet: Set<string> = new Set();

function loadWishlist(): void {
  try {
    const raw = localStorage.getItem(WISHLIST_KEY);
    if (raw) wishlistSet = new Set(JSON.parse(raw));
  } catch { /* ignore */ }
}
function saveWishlist(): void {
  localStorage.setItem(WISHLIST_KEY, JSON.stringify([...wishlistSet]));
}
export function getWishlistCount(): number { return wishlistSet.size; }
export function isInWishlist(id: string): boolean { return wishlistSet.has(id); }

export function plpTileWishlistId(tileIndex: number): string {
  return `plp-tile-${tileIndex}`;
}

export function applyPlpTileHeartVisual(heart: HTMLElement, active: boolean): void {
  const path = heart.querySelector<SVGPathElement>("svg path");
  if (!path) return;
  path.setAttribute("fill", active ? "#c8247e" : "var(--fill-0, #AFCCCA)");
}

/** Clears saved bookmark state without simulating a user click (playback prep). */
export function clearWishlistItemForPlayback(id: string): void {
  if (!wishlistSet.has(id)) return;
  wishlistSet.delete(id);
  saveWishlist();
  updateFlyoutBadge(false);
  hideAvatarDotNow();
  if (id === PDP_WISHLIST_ID) syncChickenpoxWishlistHearts();
}

export function resetPlpTileBookmarkForPlayback(
  tile: HTMLElement,
  tileIndex = 0
): void {
  const id = plpTileWishlistId(tileIndex);
  clearWishlistItemForPlayback(id);
  const heart = tile.querySelector<HTMLElement>('[data-name="icon=add to wishlist"]');
  if (!heart) return;
  // React PLP owns fuchsia via `.is-active` + `currentColor`. Mutating SVG
  // `fill` here overrides currentColor and leaves the heart stuck mint after click.
  if (
    tile.closest('[data-studio-react-screen="plp"]') ||
    tile.querySelector("[data-studio-wishlist-id]")
  ) {
    heart.classList.remove("is-active");
    heart.removeAttribute("data-fav-active");
    const path = heart.querySelector<SVGPathElement>("svg path");
    if (path) path.setAttribute("fill", "currentColor");
    return;
  }
  applyPlpTileHeartVisual(heart, false);
}

export const PDP_WISHLIST_ID = "chickenpox";

/**
 * PDP/Quick View "add to bookmarks" holds its real commit open the same way
 * PLP does (see PLP_WISHLIST_ADD_DELAY_MS) so the pending-spinner/commit-pulse
 * IxD has a window to show — this control just never got that treatment when
 * PLP's got it (LESSONS_LEARNED 2026-07-2x). Same value for cross-surface
 * timing consistency.
 */
export const PDP_WISHLIST_ADD_DELAY_MS = 2000;

/**
 * Force the PDP heart (`PdpRtbCard`, shared by the full page + Quick View)
 * back to un-bookmarked before a scripted CJM click, so "Play journey" always
 * demonstrates the add-commit pending/pulse IxD instead of a stray remove —
 * mirrors `resetPlpTileBookmarkForPlayback`. Best-effort DOM visual reset
 * (React re-renders on the click's own state update regardless).
 */
export function resetPdpWishlistForPlayback(scope: ParentNode = document): void {
  clearWishlistItemForPlayback(PDP_WISHLIST_ID);
  const heart = scope.querySelector<HTMLElement>(
    `[data-studio-wishlist-id="${PDP_WISHLIST_ID}"]`
  );
  if (!heart) return;
  heart.classList.remove("is-active");
  heart.setAttribute("data-fav-active", "false");
  heart.removeAttribute("data-fav-pending");
  heart.removeAttribute("data-fav-pulse");
  const path = heart.querySelector<SVGPathElement>("svg path");
  if (path) path.setAttribute("d", WISHLIST_HEART_OUTLINE_D);
}

export const WISHLIST_HEART_OUTLINE_D =
  "M8.97666 0.739019C8.65666 0.958352 8.3648 1.22079 8.1094 1.51851L7.9994 1.65068C7.7186 1.29817 7.38906 0.990592 7.023 0.739545C6.16554 0.151519 5.10788 -0.126355 4.00824 0.0548652C3.46077 0.146165 2.92962 0.331285 2.43333 0.607132C1.93684 0.881965 1.49417 1.23659 1.12197 1.65503C-0.520466 3.50007 -0.32604 6.37247 1.48489 7.99807L1.61087 8.10693C1.8692 8.3232 2.1194 8.54207 2.35995 8.76253L8 14L13.642 8.7614C13.8817 8.54007 14.1302 8.32287 14.3873 8.10947C16.3162 6.50553 16.5585 3.54285 14.8775 1.65471C14.5067 1.23784 14.0648 0.884092 13.5664 0.607105C13.1395 0.369819 12.6875 0.199439 12.2241 0.0991519L11.9915 0.0548652C10.8915 -0.126435 9.83333 0.151765 8.97666 0.739019ZM11.76 1.36806C10.7643 1.20945 9.7928 1.60859 9.12726 2.37977L7.97673 3.76238L6.9564 2.48136C6.28529 1.63871 5.26662 1.19928 4.22627 1.37025C3.83047 1.43641 3.44457 1.57051 3.0811 1.77254L3.07907 1.77367C2.71411 1.97569 2.39003 2.2356 2.11822 2.54118C0.973939 3.82661 1.10209 5.8542 2.36709 6.9982L2.47493 7.09393C2.73326 7.3102 2.98346 7.52907 3.22401 7.74953L8 12.2871L12.7773 7.7484C13.017 7.52707 13.2655 7.30987 13.5226 7.09647C14.7852 5.8542 14.9134 3.82661 13.7691 2.54118C13.4973 2.2356 13.1732 1.97569 12.8083 1.77367L12.8062 1.77254C12.4428 1.57051 12.0569 1.43641 11.6611 1.37025C11.7278 1.36912 11.744 1.36806 11.76 1.36806Z";

export const FILLED_HEART_D =
  "M8 13.5C7.6 13.2 1 8.8 1 4.5C1 2.3 2.7 1 4.5 1C6 1 7.3 1.9 8 3C8.7 1.9 10 1 11.5 1C13.3 1 15 2.3 15 4.5C15 8.8 8.4 13.2 8 13.5Z";

/** Shared heart visual for PDP / Quick View — keeps cross-page state in sync. */
export function applyWishlistHeartVisual(favIcon: HTMLElement, active: boolean): void {
  const path = favIcon.querySelector<SVGPathElement>("path");
  favIcon.dataset.favActive = String(active);
  if (!path) return;

  if (!path.dataset.studioHeartOutline) {
    path.dataset.studioHeartOutline = path.getAttribute("d") ?? "";
  }
  const outlineD = path.dataset.studioHeartOutline;

  if (active) {
    path.setAttribute("d", FILLED_HEART_D);
    path.style.fill = "#e91e8c";
    path.style.stroke = "none";
  } else {
    path.setAttribute("d", outlineD);
    path.style.fill = "";
    path.style.stroke = "";
  }
}

export function syncChickenpoxWishlistHearts(root: ParentNode = document): void {
  const active = isInWishlist(PDP_WISHLIST_ID);
  root
    .querySelectorAll<HTMLElement>(
      '.studio-viewport > div > div:nth-child(8) [data-name="icon=add to wishlist"], [data-studio-quick-view-clone="true"] [data-name="icon=add to wishlist"]',
    )
    .forEach((icon) => applyWishlistHeartVisual(icon, active));
}

export function toggleWishlist(id: string): boolean {
  const adding = !wishlistSet.has(id);
  if (adding) wishlistSet.add(id);
  else wishlistSet.delete(id);
  saveWishlist();
  updateFlyoutBadge(adding);
  if (adding) showAvatarDot();
  else hideAvatarDotNow();
  if (id === PDP_WISHLIST_ID) syncChickenpoxWishlistHearts();
  return wishlistSet.has(id);
}

// ── Header React root + re-render-driven avatar/badge cues ─────────────────
// (replaces the old cloneNode + direct DOM mutation of `.proto-avatar-dot`
// display / `.proto-header-flyout-badge*` background)

let headerReactRoot: Root | null = null;
let avatarDotVisible = false;
let wishlistBadgeHighlight = false;
let locationsBadgeHighlight = false;
let avatarDotHideTimer: ReturnType<typeof setTimeout> | null = null;

function showAvatarDot(): void {
  avatarDotVisible = true;
  renderHeader();
}

function hideAvatarDotNow(): void {
  avatarDotVisible = false;
  renderHeader();
}

/** Same timing as before: dot + badge highlight fade ~2s after the user notices them (hover-open). */
function hideAvatarDot(): void {
  if (avatarDotHideTimer) clearTimeout(avatarDotHideTimer);
  avatarDotHideTimer = setTimeout(() => {
    avatarDotVisible = false;
    wishlistBadgeHighlight = false;
    locationsBadgeHighlight = false;
    renderHeader();
  }, 2000);
}

function updateFlyoutBadge(highlight = false): void {
  wishlistBadgeHighlight = highlight;
  renderHeader();
}

function updateLocationsFlyoutBadge(highlight = false): void {
  locationsBadgeHighlight = highlight;
  renderHeader();
}

function onSavedLocationsChange(): void {
  updateLocationsFlyoutBadge(false);
}

/** Saved pharmacy — same notify pattern as vaccine wishlist (badge + avatar dot). */
export function toggleSavedLocationWithNotify(id: string): boolean {
  const adding = !isInSavedLocations(id);
  const active = toggleSavedLocation(id);
  updateLocationsFlyoutBadge(adding);
  if (adding) showAvatarDot();
  else hideAvatarDotNow();
  return active;
}

loadWishlist();
if (wishlistSet.size === 0) { wishlistSet.add("chickenpox"); saveWishlist(); }

let loginCallbacks: HeaderNavHandlers & { onLoginChange?: (isLoggedIn: boolean) => void } = {};

function renderHeader(): void {
  if (!headerReactRoot) return;
  headerReactRoot.render(
    <Header
      isLoggedIn={isStudioLoggedIn()}
      wishlistCount={wishlistSet.size}
      savedLocationsCount={getSavedLocationsCount()}
      avatarDotVisible={avatarDotVisible}
      wishlistBadgeHighlight={wishlistBadgeHighlight}
      locationsBadgeHighlight={locationsBadgeHighlight}
      onNavigate={loginCallbacks.onNavigate}
      onNavigateToPlp={loginCallbacks.onNavigateToPlp}
      onLoginClick={loginCallbacks.onLoginClick}
      onSignOut={() => {
        setLoggedIn(false);
        loginCallbacks.onSignOut?.();
      }}
      onAvatarHover={hideAvatarDot}
    />,
  );
}

/** Keep header chrome + wire mirrors in sync with studio auth SSoT. */
subscribeStudioLoggedIn((next) => {
  renderHeader();
  loginCallbacks.onLoginChange?.(next);
});

let savedLocationsListenerBound = false;

function setLoggedIn(state: boolean): void {
  // UI + onLoginChange run via subscribeStudioLoggedIn
  setStudioLoggedIn(state);
}

const MA_AVATAR_CLASS = "proto-ma-account-avatar";
const MA_ACCOUNT_ICON = '[data-name="icon / accent / account"]';

/** MA sidebar — same photo asset as header Sarah avatar (tabs 8–9). */
export function syncMaAccountAvatars(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>(MA_ACCOUNT_ICON).forEach((host) => {
    let img = host.querySelector<HTMLImageElement>(`img.${MA_AVATAR_CLASS}`);
    if (!img) {
      host.dataset.studioMaAvatarWired = "1";
      host.style.background = "transparent";
      Array.from(host.children).forEach((child) => {
        if (child instanceof HTMLElement) child.style.display = "none";
      });
      img = document.createElement("img");
      img.className = MA_AVATAR_CLASS;
      img.alt = "Sarah";
      host.appendChild(img);
    }
    img.src = userAvatar;
  });
}

export function setupHeader(
  scrollEl: HTMLElement,
  callbacks?: HeaderNavHandlers & { onLoginChange?: (isLoggedIn: boolean) => void },
): void {
  loginCallbacks = callbacks || {};

  if (!savedLocationsListenerBound) {
    savedLocationsListenerBound = true;
    document.addEventListener(SAVED_LOCATIONS_CHANGE_EVENT, onSavedLocationsChange);
  }

  const headerMount = scrollEl.querySelector<HTMLElement>(`:scope > .${HEADER_MOUNT_CLASS}`);

  if (!headerMount && !headerReactRoot) {
    const mountEl = document.createElement("div");
    mountEl.className = HEADER_MOUNT_CLASS;

    headerReactRoot = createRoot(mountEl);

    // This `setupHeader()` call runs from inside a `useEffect` in the host
    // view, i.e. while React is still flushing that commit's passive
    // effects — `flushSync` is illegal there ("flushSync was called from
    // inside a lifecycle method"). Deferring to a microtask steps outside
    // that call stack, so the synchronous-commit guarantee below (needed
    // so `mountEl.firstElementChild` is populated before the mega-menu /
    // search kits attach) is safe again, and still lands before paint.
    queueMicrotask(() => {
      flushSync(() => renderHeader());

      const headerRootEl = mountEl.firstElementChild as HTMLElement | null;
      if (headerRootEl) {
        // Hover flyout on the "Health Services" mega menu item (unchanged
        // kit, now attached to the React-rendered header instead of a
        // Make clone).
        attachHealthServicesMegaMenu(headerRootEl, {
          onNavigateToPlp: loginCallbacks.onNavigateToPlp,
        });
        // Click-to-open full-screen search takeover (unchanged kit).
        attachFullScreenSearch(headerRootEl, {
          onNavigateToPlp: loginCallbacks.onNavigateToPlp,
        });
      }

      scrollEl.insertBefore(mountEl, scrollEl.firstChild);
    });
  }

  loginCallbacks.onLoginChange?.(isHeaderLoggedIn());
}

export function syncHeaderLogin(childIndex: number): void {
  const shouldBeLoggedIn = LOGGED_IN_CHILD_INDICES.includes(childIndex);
  if (shouldBeLoggedIn && !isStudioLoggedIn()) {
    setLoggedIn(true);
  }
}

/** @deprecated Prefer `setStudioLoggedIn` — alias kept for Boots wire / playback. */
export function setHeaderLoggedIn(state: boolean): void {
  setLoggedIn(state);
}

/** @deprecated Prefer `isStudioLoggedIn` — alias kept for Boots wire / playback. */
export function isHeaderLoggedIn(): boolean {
  return isStudioLoggedIn();
}
