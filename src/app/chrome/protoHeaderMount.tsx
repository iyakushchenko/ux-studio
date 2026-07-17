/**
 * Mount the Boots Pharmacy header as a direct child of the scroll container
 * by cloning the first available native Figma header. Supports logged-in/out
 * state toggling via "Log in" / "Sarah" label, with hover flyout menu.
 */

import userAvatar from "@/assets/user-avatar.jpg";
import {
  getSavedLocationsCount,
  isInSavedLocations,
  SAVED_LOCATIONS_CHANGE_EVENT,
  toggleSavedLocation,
} from "@/app/proto/protoSavedLocations";

const HEADER_MOUNT_CLASS = "proto-header-mount";

// Screens that always show logged-in state (account pages only)
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

export const PROTO_PDP_WISHLIST_ID = "chickenpox";

export const WISHLIST_HEART_OUTLINE_D =
  "M8.97666 0.739019C8.65666 0.958352 8.3648 1.22079 8.1094 1.51851L7.9994 1.65068C7.7186 1.29817 7.38906 0.990592 7.023 0.739545C6.16554 0.151519 5.10788 -0.126355 4.00824 0.0548652C3.46077 0.146165 2.92962 0.331285 2.43333 0.607132C1.93684 0.881965 1.49417 1.23659 1.12197 1.65503C-0.520466 3.50007 -0.32604 6.37247 1.48489 7.99807L1.61087 8.10693C1.8692 8.3232 2.1194 8.54207 2.35995 8.76253L8 14L13.642 8.7614C13.8817 8.54007 14.1302 8.32287 14.3873 8.10947C16.3162 6.50553 16.5585 3.54285 14.8775 1.65471C14.5067 1.23784 14.0648 0.884092 13.5664 0.607105C13.1395 0.369819 12.6875 0.199439 12.2241 0.0991519L11.9915 0.0548652C10.8915 -0.126435 9.83333 0.151765 8.97666 0.739019ZM11.76 1.36806C10.7643 1.20945 9.7928 1.60859 9.12726 2.37977L7.97673 3.76238L6.9564 2.48136C6.28529 1.63871 5.26662 1.19928 4.22627 1.37025C3.83047 1.43641 3.44457 1.57051 3.0811 1.77254L3.07907 1.77367C2.71411 1.97569 2.39003 2.2356 2.11822 2.54118C0.973939 3.82661 1.10209 5.8542 2.36709 6.9982L2.47493 7.09393C2.73326 7.3102 2.98346 7.52907 3.22401 7.74953L8 12.2871L12.7773 7.7484C13.017 7.52707 13.2655 7.30987 13.5226 7.09647C14.7852 5.8542 14.9134 3.82661 13.7691 2.54118C13.4973 2.2356 13.1732 1.97569 12.8083 1.77367L12.8062 1.77254C12.4428 1.57051 12.0569 1.43641 11.6611 1.37025C11.7278 1.36912 11.744 1.36806 11.76 1.36806Z";

export const FILLED_HEART_D =
  "M8 13.5C7.6 13.2 1 8.8 1 4.5C1 2.3 2.7 1 4.5 1C6 1 7.3 1.9 8 3C8.7 1.9 10 1 11.5 1C13.3 1 15 2.3 15 4.5C15 8.8 8.4 13.2 8 13.5Z";

/** Shared heart visual for PDP / Quick View — keeps cross-page state in sync. */
export function applyWishlistHeartVisual(favIcon: HTMLElement, active: boolean): void {
  const path = favIcon.querySelector<SVGPathElement>("path");
  favIcon.dataset.favActive = String(active);
  if (!path) return;

  if (!path.dataset.protoHeartOutline) {
    path.dataset.protoHeartOutline = path.getAttribute("d") ?? "";
  }
  const outlineD = path.dataset.protoHeartOutline;

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
  const active = isInWishlist(PROTO_PDP_WISHLIST_ID);
  root
    .querySelectorAll<HTMLElement>(
      '.proto-viewport > div > div:nth-child(8) [data-name="icon=add to wishlist"], [data-proto-quick-view-clone="true"] [data-name="icon=add to wishlist"]',
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
  if (id === PROTO_PDP_WISHLIST_ID) syncChickenpoxWishlistHearts();
  return wishlistSet.has(id);
}

function showAvatarDot(): void {
  if (!headerClone) return;
  const avatar = headerClone.querySelector(`.${AVATAR_CLASS}:not(.${AVATAR_CLASS}--guest)`) as HTMLElement | null;
  if (!avatar) return;
  const parent = avatar.parentElement;
  if (!parent) return;
  parent.style.position = "relative";
  let dot = parent.querySelector(".proto-avatar-dot") as HTMLElement | null;
  if (!dot) {
    dot = document.createElement("span");
    dot.className = "proto-avatar-dot";
    parent.appendChild(dot);
  }
  dot.style.display = "block";
  dot.style.animation = "none";
  void dot.offsetHeight;
  dot.style.animation = "";
}

function hideAvatarDotNow(): void {
  if (!headerClone) return;
  const dot = headerClone.querySelector(".proto-avatar-dot") as HTMLElement | null;
  if (dot) dot.style.display = "none";
}

function hideAvatarDot(): void {
  if (!headerClone) return;
  const dot = headerClone.querySelector(".proto-avatar-dot") as HTMLElement | null;
  if (!dot) return;
  setTimeout(() => {
    dot.style.display = "none";
    const wishlistBadge = flyoutEl?.querySelector(
      ".proto-header-flyout-badge--wishlist"
    ) as HTMLElement | null;
    const locationsBadge = flyoutEl?.querySelector(
      ".proto-header-flyout-badge--locations"
    ) as HTMLElement | null;
    if (wishlistBadge) wishlistBadge.style.background = "";
    if (locationsBadge) locationsBadge.style.background = "";
  }, 2000);
}

function updateFlyoutBadge(highlight = false): void {
  const badge = flyoutEl?.querySelector(
    ".proto-header-flyout-badge--wishlist"
  ) as HTMLElement | null;
  if (badge) {
    badge.textContent = String(wishlistSet.size);
    badge.style.background = highlight ? "#c8247e" : "";
  }
}

function updateLocationsFlyoutBadge(highlight = false): void {
  const badge = flyoutEl?.querySelector(
    ".proto-header-flyout-badge--locations"
  ) as HTMLElement | null;
  if (badge) {
    badge.textContent = String(getSavedLocationsCount());
    badge.style.background = highlight ? "#c8247e" : "";
  }
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

let headerClone: HTMLElement | null = null;
let loggedIn = false;
let flyoutEl: HTMLElement | null = null;
let loginCallbacks: { onLoginChange?: (isLoggedIn: boolean) => void; onLoginClick?: (tab?: "signin" | "create") => void; onSignOut?: () => void; onNavigate?: (screenIndex: number) => void } = {};

function findLoginLabel(el: HTMLElement): HTMLElement | null {
  const allP = el.querySelectorAll<HTMLElement>("p");
  for (const p of allP) {
    const text = p.textContent?.trim();
    if (text === "Log in" || text === "Sarah") return p;
  }
  const auxItems = el.querySelectorAll('[data-name="component.header.aux.nav.item"]');
  if (auxItems.length >= 2) {
    const lastItem = auxItems[auxItems.length - 1];
    const p = lastItem.querySelector("p");
    if (p) return p as HTMLElement;
  }
  return null;
}

const AVATAR_CLASS = "proto-header-avatar";
const MA_AVATAR_CLASS = "proto-ma-account-avatar";
const MA_ACCOUNT_ICON = '[data-name="icon / accent / account"]';
const USER_ICON_SVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="#fff" stroke-width="1.5"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/></svg>`;

/** MA sidebar — same photo asset as header Sarah avatar (tabs 8–9). */
export function syncMaAccountAvatars(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>(MA_ACCOUNT_ICON).forEach((host) => {
    let img = host.querySelector<HTMLImageElement>(`img.${MA_AVATAR_CLASS}`);
    if (!img) {
      host.dataset.protoMaAvatarWired = "1";
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
const SEARCH_ICON_SVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" style="display:block"><circle cx="11" cy="11" r="7" stroke="#fff" stroke-width="1.5"/><path d="M16.5 16.5L21 21" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/></svg>`;

function updateLoginLabel(): void {
  if (!headerClone) return;
  const label = findLoginLabel(headerClone);
  if (!label) return;

  label.textContent = loggedIn ? "Sarah" : "Log in";

  const item = label.closest('[data-name="component.header.aux.nav.item"]') || label.parentElement;
  if (!item) { updateFlyoutContent(); return; }

  // Remove existing avatar/icon
  item.querySelector(`.${AVATAR_CLASS}`)?.remove();

  // Remove original Figma icon placeholder divs on the login item (keep label + flyout)
  const labelEl = item.querySelector("p");
  Array.from(item.children).forEach((child) => {
    if (child === labelEl || child === flyoutEl) return;
    if (child.classList?.contains(AVATAR_CLASS)) return;
    if (child.tagName === "P") return;
    (child as HTMLElement).remove();
  });

  if (loggedIn) {
    const img = document.createElement("img");
    img.className = AVATAR_CLASS;
    img.src = userAvatar;
    img.alt = "Sarah";
    item.insertBefore(img, label);
  } else {
    const placeholder = document.createElement("span");
    placeholder.className = `${AVATAR_CLASS} ${AVATAR_CLASS}--guest`;
    placeholder.innerHTML = USER_ICON_SVG;
    item.insertBefore(placeholder, label);
  }

  updateFlyoutContent();
}

function fixSearchIcon(): void {
  if (!headerClone) return;
  const auxItems = headerClone.querySelectorAll<HTMLElement>('[data-name="component.header.aux.nav.item"]');
  for (const item of auxItems) {
    const text = (item.textContent ?? "").trim();
    if (text.includes("Search") && !item.querySelector(".proto-header-search-icon")) {
      const labelP = item.querySelector("p");
      // Remove all Figma placeholder children except the label
      Array.from(item.children).forEach((child) => {
        if (child !== labelP && child.tagName !== "P") {
          (child as HTMLElement).remove();
        }
      });
      // Insert search SVG
      const icon = document.createElement("span");
      icon.className = "proto-header-search-icon";
      icon.innerHTML = SEARCH_ICON_SVG;
      if (labelP) item.insertBefore(icon, labelP);
      break;
    }
  }
}

function setLoggedIn(state: boolean): void {
  loggedIn = state;
  updateLoginLabel();
  loginCallbacks.onLoginChange?.(loggedIn);
}

function createFlyout(anchorItem: HTMLElement): HTMLElement {
  const flyout = document.createElement("div");
  flyout.className = "proto-header-flyout";
  flyout.style.cssText = `
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 18px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.15);
    padding: 8px 0;
    min-width: 180px;
    z-index: 999;
    display: none;
    font-family: 'Open Sans', sans-serif;
    opacity: 0;
    transform: translateY(6px);
    transition: opacity 0.18s ease, transform 0.18s ease;
  `;

  anchorItem.style.position = "relative";
  anchorItem.appendChild(flyout);
  return flyout;
}

function hideFlyout(): void {
  if (!flyoutEl) return;
  flyoutEl.style.opacity = "0";
  flyoutEl.style.transform = "translateY(6px)";
  setTimeout(() => { flyoutEl!.style.display = "none"; }, 180);
}

function updateFlyoutContent(): void {
  if (!flyoutEl) return;

  if (loggedIn) {
    flyoutEl.innerHTML = `
      <div style="padding: 12px 16px; border-bottom: 1px solid #eee; font-size: 14px; font-weight: 600; color: #3a3a3a;">Hi Sarah</div>
      <button class="proto-header-flyout-item" data-action="account">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="#888" stroke-width="1.5"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6" stroke="#888" stroke-width="1.5" stroke-linecap="round"/></svg>
        My Account
      </button>
      <button class="proto-header-flyout-item" data-action="appointments">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="#888" stroke-width="1.5"/><path d="M16 2v4M8 2v4M3 10h18" stroke="#888" stroke-width="1.5" stroke-linecap="round"/></svg>
        <span>My Appointments</span> <span class="proto-header-flyout-badge">3</span>
      </button>
      <div class="proto-header-flyout-item proto-header-flyout-item--static">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 21s7-4.5 7-11a7 7 0 10-14 0c0 6.5 7 11 7 11z" stroke="#888" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="10" r="2.5" stroke="#888" stroke-width="1.5"/></svg>
        <span>My Locations</span> <span class="proto-header-flyout-badge proto-header-flyout-badge--locations">${getSavedLocationsCount()}</span>
      </div>
      <button class="proto-header-flyout-item" data-action="wishlist">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" stroke="#888" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <span>My List</span> <span class="proto-header-flyout-badge proto-header-flyout-badge--wishlist">${wishlistSet.size}</span>
      </button>
      <button class="proto-header-flyout-item" data-action="signout">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="#c00" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        Sign Out
      </button>
    `;
  } else {
    flyoutEl.innerHTML = `
      <button class="proto-header-flyout-item" data-action="login">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" stroke="#888" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        Log In
      </button>
      <button class="proto-header-flyout-item" data-action="create">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="10" cy="8" r="4" stroke="#888" stroke-width="1.5"/><path d="M2 20c0-4 4-6 8-6s8 2 8 6" stroke="#888" stroke-width="1.5" stroke-linecap="round"/><path d="M19 8v6M16 11h6" stroke="#888" stroke-width="1.5" stroke-linecap="round"/></svg>
        Create Account
      </button>
      <div class="proto-header-flyout-item proto-header-flyout-item--static">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 21s7-4.5 7-11a7 7 0 10-14 0c0 6.5 7 11 7 11z" stroke="#888" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="10" r="2.5" stroke="#888" stroke-width="1.5"/></svg>
        <span>My Locations</span> <span class="proto-header-flyout-badge proto-header-flyout-badge--locations">${getSavedLocationsCount()}</span>
      </div>
      <button class="proto-header-flyout-item" data-action="wishlist">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" stroke="#888" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <span>My List</span> <span class="proto-header-flyout-badge proto-header-flyout-badge--wishlist">${wishlistSet.size}</span>
      </button>
    `;
  }

  // Bind click handlers
  flyoutEl.querySelectorAll<HTMLElement>("[data-action]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const action = btn.dataset.action;
      if (action === "login" || action === "create") {
        hideFlyout();
        loginCallbacks.onLoginClick?.(action === "create" ? "create" : "signin");
      } else if (action === "appointments") {
        hideFlyout();
        loginCallbacks.onNavigate?.(7);
      } else if (action === "signout") {
        setLoggedIn(false);
        hideFlyout();
        loginCallbacks.onSignOut?.();
      }
    });
  });
}

function injectFlyoutStyles(): void {
  if (document.getElementById("proto-header-flyout-styles")) return;
  const style = document.createElement("style");
  style.id = "proto-header-flyout-styles";
  style.textContent = `
    .proto-header-flyout-item {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
      padding: 12px 16px;
      border: none;
      background: none;
      font-family: 'Open Sans', sans-serif;
      font-size: 13px;
      font-weight: 400;
      color: #3a3a3a;
      cursor: default;
      text-align: left;
    }
    .proto-header-flyout-item:hover {
      background: #f5f5f5;
    }
    .proto-header-flyout-item--static {
      cursor: default;
      pointer-events: none;
    }
    .proto-header-flyout-item--static:hover {
      background: none;
    }

    .proto-header-flyout::before {
      content: '';
      position: absolute;
      top: -6px;
      right: 26px;
      width: 12px;
      height: 12px;
      background: white;
      transform: rotate(45deg);
      box-shadow: -2px -2px 4px rgba(0,0,0,0.04);
    }
  `;
  document.head.appendChild(style);
}

export function setupProtoHeader(
  scrollEl: HTMLElement,
  callbacks?: { onLoginChange?: (isLoggedIn: boolean) => void; onLoginClick?: (tab?: "signin" | "create") => void; onSignOut?: () => void; onNavigate?: (screenIndex: number) => void },
): void {
  loginCallbacks = callbacks || {};
  injectFlyoutStyles();

  const viewport = scrollEl.querySelector(".proto-viewport");
  if (!viewport) return;

  const nativeHeaders = viewport.querySelectorAll<HTMLElement>(
    '[data-name="boots-pharmacy.module.header"]'
  );
  if (nativeHeaders.length === 0) return;

  let headerMount = scrollEl.querySelector<HTMLElement>(`:scope > .${HEADER_MOUNT_CLASS}`);

  if (!headerMount) {
    let sourceHeader = nativeHeaders[0];
    for (const h of nativeHeaders) {
      const text = h.textContent || "";
      if (text.includes("Sarah")) {
        sourceHeader = h;
        break;
      }
    }

    headerMount = document.createElement("div");
    headerMount.className = HEADER_MOUNT_CLASS;

    headerClone = sourceHeader.cloneNode(true) as HTMLElement;
    headerClone.classList.add("proto-header-sticky");
    headerClone.style.cssText = "display: flex !important; width: 100%; min-width: 1200px;";
    headerMount.appendChild(headerClone);

    // Detect initial login state from cloned label text
    const initLabel = findLoginLabel(headerClone);
    if (initLabel && initLabel.textContent?.trim() === "Sarah") {
      loggedIn = true;
    }

    // Find the login aux nav item and attach flyout
    const label = findLoginLabel(headerClone);
    if (label) {
      const item = (label.closest('[data-name="component.header.aux.nav.item"]') || label) as HTMLElement;
      item.style.cursor = "default";

      flyoutEl = createFlyout(item);
      updateFlyoutContent();
      updateLocationsFlyoutBadge(false);

      document.addEventListener(SAVED_LOCATIONS_CHANGE_EVENT, onSavedLocationsChange);

      // Insert avatar/icon for current state
      updateLoginLabel();
      // Fix search icon
      fixSearchIcon();

      // Show/hide flyout on hover
      let hideTimeout: ReturnType<typeof setTimeout> | null = null;
      let showTimeout: ReturnType<typeof setTimeout> | null = null;
      item.addEventListener("mouseenter", () => {
        if (hideTimeout) { clearTimeout(hideTimeout); hideTimeout = null; }
        showTimeout = setTimeout(() => {
          hideAvatarDot();
          flyoutEl!.style.transform = "translateY(6px)";
          flyoutEl!.style.opacity = "0";
          flyoutEl!.style.display = "block";
          void flyoutEl!.offsetHeight;
          flyoutEl!.style.opacity = "1";
          flyoutEl!.style.transform = "translateY(0)";
        }, 100);
      });
      item.addEventListener("mouseleave", () => {
        if (showTimeout) { clearTimeout(showTimeout); showTimeout = null; }
        hideTimeout = setTimeout(() => {
          flyoutEl!.style.opacity = "0";
          flyoutEl!.style.transform = "translateY(6px)";
          setTimeout(() => { flyoutEl!.style.display = "none"; }, 150);
        }, 200);
      });
    }

    scrollEl.insertBefore(headerMount, scrollEl.firstChild);
  }

  const headerRoot = scrollEl.querySelector<HTMLElement>(`.${HEADER_MOUNT_CLASS}`);
  headerRoot
    ?.querySelectorAll<HTMLElement>('[data-name="component.mega.menu.item"]')
    .forEach((item) => {
      const label = (
        item.querySelector("p")?.textContent ??
        item.textContent ??
        ""
      ).trim();
      if (!/^home$/i.test(label)) return;
      item.style.cursor = "pointer";
      item.setAttribute("role", "link");
      item.tabIndex = 0;
    });

  // Hide all native Figma headers inside pages
  nativeHeaders.forEach((el) => {
    if (!el.classList.contains("proto-header-sticky")) {
      el.style.display = "none";
    }
  });

  loginCallbacks.onLoginChange?.(isProtoHeaderLoggedIn());
}

export function syncProtoHeaderLogin(childIndex: number): void {
  const shouldBeLoggedIn = LOGGED_IN_CHILD_INDICES.includes(childIndex);
  if (shouldBeLoggedIn && !loggedIn) {
    loggedIn = true;
    updateLoginLabel();
    loginCallbacks.onLoginChange?.(loggedIn);
  }
}

export function setProtoHeaderLoggedIn(state: boolean): void {
  loggedIn = state;
  updateLoginLabel();
  loginCallbacks.onLoginChange?.(loggedIn);
}

export function isProtoHeaderLoggedIn(): boolean {
  return loggedIn;
}
