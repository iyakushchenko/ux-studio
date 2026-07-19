import { useState, useRef, useEffect, useLayoutEffect, useCallback, useMemo, type MutableRefObject } from "react";
import locationsMapChosen from "@/assets/locations-map-chosen.png";
import bootsAdvantageCard from "@/assets/boots-advantage-card.png";
import AvailabilityTool, {
  TODAY_TOOLTIP,
  type AvailOpenIntent,
  type AvailStep,
  type ChosenBookingSlot,
} from "@/projects/boots-pharmacy/overlays/AvailabilityTool";
import VaccinePickerPopup from "@/projects/boots-pharmacy/popups/VaccinePickerPopup";
import RecipientPickerPopup, {
  recipientModeLabel,
  type RecipientMode,
} from "@/projects/boots-pharmacy/popups/RecipientPickerPopup";
import LoginPopup from "@/projects/boots-pharmacy/popups/LoginPopup";
import QuickViewPopup from "@/projects/boots-pharmacy/popups/QuickViewPopup";
import {
  collectSitePilotChatScenarioFrames,
  ensureSitePilotChatComposerDock,
  findSitePilotChatComposerCard,
  mountSitePilotChatComposerDock,
  syncSitePilotChatComposerDock,
  teardownSitePilotChatComposerDock,
} from "@/projects/boots-pharmacy/dom/sitePilotChatScenario";
import {
  abortSitePilotChatPlaybackPrelude,
  runSitePilotChatBeforeReveal,
  runSitePilotChatScenarioFinale,
  stripSitePilotChatDemoCursors,
} from "@/projects/boots-pharmacy/playback/sitePilotChat";
import { AGENTIC_HOME_DEMO_QUERY } from "@/projects/boots-pharmacy/playback/sitePilotHome";
import { removeDemoCursor } from "@/app/scenario/demoCursor";
import {
  beginSitePilotChatThinking,
  endSitePilotChatThinking,
  isSitePilotChatPlaybackThinking,
  isSitePilotChatSendThinking,
  isSitePilotChatThinking,
  setSitePilotChatSendThinkingMode,
  syncSitePilotChatThinkingHint,
} from "@/projects/boots-pharmacy/dom/sitePilotChatThinking";
import { resolveAvailStoreId, getDemoChosenLocation } from "@/projects/boots-pharmacy/data/availStores";
import { resolveAvailIntent } from "@/projects/boots-pharmacy/wire/resolveAvailIntent";
import iconArrowsSecondary from "@/assets/avail/arrows-secondary.svg";
import type { VaccineItem } from "@/projects/boots-pharmacy/data/vaccineList";
import { setupChosenPageMap } from "@/projects/boots-pharmacy/dom/locationsMap";
import {
  arePlpFiltersActive,
  ensurePlpFiltersDefault,
  ensurePlpTileTitleLinks,
  PLP_FILTERS_CHANGE_EVENT,
  resetPlpFilters,
  syncPlpListingFilters,
} from "@/projects/boots-pharmacy/data/plpListing";
import { initSearchFields, syncFigmaSearchClearIcons } from "@/projects/boots-pharmacy/dom/locationSearch";
import { setupFooters } from "@/projects/boots-pharmacy/chrome/footerMount";
import {
  setupHeader,
  syncHeaderLogin,
  syncMaAccountAvatars,
  setHeaderLoggedIn,
  isHeaderLoggedIn,
  toggleWishlist,
  isInWishlist,
  applyPlpTileHeartVisual,
  applyWishlistHeartVisual,
  plpTileWishlistId,
  syncChickenpoxWishlistHearts,
  PDP_WISHLIST_ID,
} from "@/projects/boots-pharmacy/chrome/headerMount";
import { wireIconHits } from "@/projects/boots-pharmacy/dom/iconHitWire";
import { onRetreatSync } from "@/app/scenario/retreatBridge";
import {
  applyBookStep2CalendarFromSlot,
  bookStep2Screen,
  isBookStep2RetreatSyncDetail,
  isBookStep2RetreatSlotDetail,
  syncBookStep2RetreatDefaultDom,
} from "@/projects/boots-pharmacy/dom/bookStep2Calendar";
import { useScrollFill } from "@/app/scenario/useScrollFill";
import { scrollPrototypeScrollToTopAfterLayout } from "@/app/scenario/scenarioEngine";
import {
  boosterDoseSummaryLabel,
  PDP_CHECKBOX_LABEL,
  PDP_PRICE_WITH_BOOSTER,
  PDP_PRICE_WITHOUT_BOOSTER,
  syncAccountOrderSummary,
  syncConfirmationOrderSummary,
} from "@/projects/boots-pharmacy/data/orderPricing";
import {
  ensureCheckboxRow,
  handleProtoInputClick,
  initProtoInputControls,
  markBoosterCheckboxRow,
} from "@/projects/boots-pharmacy/dom/inputControls";
import {
  getSelectedAppointmentId,
  APPOINTMENT_PILOT_QUERY,
  syncAppointmentDetails,
  syncAppointmentHistory,
  wireAppointmentDetailsBreadcrumbs,
} from "@/projects/boots-pharmacy/data/appointments";
import type { ProjectShellBridge, ProjectWireApi } from "@/projects/types";
import { storeNavIndex } from "@/app/shell/studioNavStorage";
import {
  isBookStep1ReactMounted,
  mountBookStep1Screen,
  unmountBookStep1Screen,
} from "@/projects/boots-pharmacy/screens/book-step-1/mountBookStep1Screen";
import {
  isBookStep2ReactMounted,
  mountBookStep2Screen,
  unmountBookStep2Screen,
} from "@/projects/boots-pharmacy/screens/book-step-2/mountBookStep2Screen";
import {
  isBookStep3ReactMounted,
  mountBookStep3Screen,
  unmountBookStep3Screen,
} from "@/projects/boots-pharmacy/screens/book-step-3/mountBookStep3Screen";


/**
 * DOM child order inside Frame219's root div (JSX order = DOM order):
 *   child 1  → left-16282  Appointment Details
 *   child 2  → left-14747  Appointment History
 *   child 3  → left-12860  Step 6  Book Appointment
 *   child 4  → left-11325  Step 5  Book Appointment
 *   child 5  → left-9790   Guide. Step 8 — LOCATION SELECTED (map) — template only
 *   child 6  → left-8255   Locations lightbox (scrim + card)
 *   child 7  → left-6880   Step 4 — LOCATION SEARCH (initial Book Appointment)
 *   child 8  → left-5345   Deal Details
 *   child 9  → left-3810   Vaccination Listing
 *   child 10 → left-1535   Account Overview
 *   child 11 → left-0      Account Login
 *
 * Location flow (original UX CJM):
 *   INITIAL  = child 7 search field (“London”)
 *   SELECTED = swap child 7’s search block for child 5’s map + Change location
 *   Change location → Availability Tool location picker (child 5 is never a nav screen)
 */

type ChosenLocation = { name: string; address: string; storeId?: string };

type ChosenVaccine = { id: string; name: string };

const DEFAULT_CHOSEN_VACCINE: ChosenVaccine = {
  id: "chickenpox",
  name: "Chickenpox / Varicella",
};

const DEFAULT_CHOSEN_RECIPIENT: RecipientMode = "myself";

const DEFAULT_INCLUDE_BOOSTER_DOSE = true;

const DEFAULT_CHOSEN_BOOKING_SLOT: ChosenBookingSlot = {
  month: "June",
  day: 24,
  time: "16:30",
};

/** Default Agentic home query — Reset hides while this is unchanged. */
const AGENTIC_HOME_QUERY_DEFAULT = AGENTIC_HOME_DEMO_QUERY;

const AGENTIC_HOME_HEADING_DEFAULT =
  "What health services are you focusing on today?";
const AGENTIC_HOME_HEADING_LOGGED_IN =
  "Sarah, what health services are you focusing on today?";

/** Agentic home hero line — personalised when header login is active. */
function findAgenticHomeHeading(screen: HTMLElement): HTMLElement | null {
  const tagged = screen.querySelector<HTMLElement>(
    "[data-studio-agentic-home-heading]"
  );
  if (tagged) return tagged;

  const pilotLogo = screen.querySelector('[data-name="boots.ai assistant 3"]');
  const heroSibling = pilotLogo?.nextElementSibling;
  if (heroSibling instanceof HTMLElement && heroSibling.tagName === "P") {
    heroSibling.dataset.studioAgenticHomeHeading = "true";
    return heroSibling;
  }

  return (
    Array.from(screen.querySelectorAll("p")).find((p) =>
      /what health services are you focusing on today/i.test(p.textContent ?? "")
    ) ?? null
  );
}

function resolveAgenticHomeLoggedIn(loggedInFlag: boolean): boolean {
  return loggedInFlag || isHeaderLoggedIn();
}

function syncAgenticHomeHeading(isLoggedIn: boolean): void {
  const screen = document.querySelector(
    ".studio-viewport > div > div:nth-child(11)"
  ) as HTMLElement | null;
  if (!screen) return;

  const heading = findAgenticHomeHeading(screen);
  if (!heading) return;

  const next = isLoggedIn
    ? AGENTIC_HOME_HEADING_LOGGED_IN
    : AGENTIC_HOME_HEADING_DEFAULT;
  if (heading.textContent !== next) {
    heading.textContent = next;
  }
}

/** Re-apply after React re-renders reset the Figma export copy. */
function bindAgenticHomeHeadingSync(isLoggedIn: boolean): () => void {
  const apply = () => syncAgenticHomeHeading(isLoggedIn);

  apply();
  let innerRaf = 0;
  const outerRaf = requestAnimationFrame(() => {
    apply();
    innerRaf = requestAnimationFrame(apply);
  });
  const t = window.setTimeout(apply, 0);

  const screen = document.querySelector(
    ".studio-viewport > div > div:nth-child(11)"
  ) as HTMLElement | null;
  const heading = screen ? findAgenticHomeHeading(screen) : null;
  const mo =
    heading && typeof MutationObserver !== "undefined"
      ? new MutationObserver(() => {
          const expected = isLoggedIn
            ? AGENTIC_HOME_HEADING_LOGGED_IN
            : AGENTIC_HOME_HEADING_DEFAULT;
          if ((heading.textContent ?? "").trim() !== expected) apply();
        })
      : null;
  mo?.observe(heading!, {
    characterData: true,
    childList: true,
    subtree: true,
  });

  return () => {
    cancelAnimationFrame(outerRaf);
    cancelAnimationFrame(innerRaf);
    window.clearTimeout(t);
    mo?.disconnect();
  };
}

const AGENTIC_QUERY_LINE_PX = 24;
const AGENTIC_QUERY_MAX_LINES = 5;

/** Demo pharmacy for chat-driven availability shortcuts (Covent Garden). */
const AVAIL_DEMO_STORE = "covent";

export const AVAIL_INTENT = {
  start: { step: "start" } satisfies AvailOpenIntent,
  list: { step: "list", query: "London" } satisfies AvailOpenIntent,
  nearMe: { step: "map", nearMe: true } satisfies AvailOpenIntent,
  /** Location picker (replaces Locations popup) */
  pickList: {
    step: "list",
    query: "London",
    pickLocation: true,
  } satisfies AvailOpenIntent,
  pickNearMe: {
    step: "map",
    nearMe: true,
    pickLocation: true,
  } satisfies AvailOpenIntent,
  pickStart: { step: "start", pickLocation: true } satisfies AvailOpenIntent,
  dateToday: {
    step: "date",
    storeId: AVAIL_DEMO_STORE,
    selectedDate: { month: "June", day: 12 },
  } satisfies AvailOpenIntent,
  dateWeek: {
    step: "date",
    storeId: AVAIL_DEMO_STORE,
    selectedDate: { month: "June", day: 24 },
  } satisfies AvailOpenIntent,
  dateWeekend: {
    step: "date",
    storeId: AVAIL_DEMO_STORE,
    selectedDate: { month: "June", day: 27 },
  } satisfies AvailOpenIntent,
  dateChat: {
    step: "date",
    storeId: AVAIL_DEMO_STORE,
    selectedDate: { month: "June", day: 25 },
  } satisfies AvailOpenIntent,
  timeSlot: {
    step: "time",
    storeId: AVAIL_DEMO_STORE,
    selectedDate: { month: "June", day: 25 },
    selectedTime: "16:30",
  } satisfies AvailOpenIntent,
  /** PDP / generic entry — resolves to start or date from chosen location */
  browse: {
    step: "date",
    storeId: AVAIL_DEMO_STORE,
    selectedDate: { month: "June", day: 24 },
  } satisfies AvailOpenIntent,
} as const;

/** Map Book-flow / popup selection → Availability Tool store id. */
function mapChosenToAvailStoreId(chosen: ChosenLocation): string {
  return resolveAvailStoreId(chosen);
}

/** Re-export for playback/diagnostic tests. */
export { resolveAvailIntent } from "@/projects/boots-pharmacy/wire/resolveAvailIntent";

/** Hug 1 line when empty; grow/shrink with wrapped lines; max 5 lines then scroll. */
function syncAgenticQueryHeight(ta: HTMLTextAreaElement) {
  const max = AGENTIC_QUERY_LINE_PX * AGENTIC_QUERY_MAX_LINES;
  // Collapse before measuring so height shrinks when lines are deleted.
  ta.style.setProperty("height", "0px", "important");
  ta.style.setProperty("min-height", "0px", "important");
  const next = Math.min(
    Math.max(ta.scrollHeight, AGENTIC_QUERY_LINE_PX),
    max
  );
  ta.style.setProperty("min-height", `${AGENTIC_QUERY_LINE_PX}px`, "important");
  ta.style.setProperty("height", `${next}px`, "important");
  ta.style.setProperty(
    "overflow-y",
    next >= max ? "auto" : "hidden",
    "important"
  );
}

/** Re-measure when layout, fonts, or width change — fixes 1-line squash on first paint. */
function bindAgenticQueryAutoHeight(ta: HTMLTextAreaElement): () => void {
  let cancelled = false;
  let innerRaf = 0;

  const run = () => {
    if (cancelled) return;
    syncAgenticQueryHeight(ta);
  };

  run();

  const outerRaf = requestAnimationFrame(() => {
    if (cancelled) return;
    run();
    innerRaf = requestAnimationFrame(run);
  });

  const t0 = window.setTimeout(run, 0);
  const t1 = window.setTimeout(run, 120);

  const ro =
    typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(() => run())
      : null;
  ro?.observe(ta);
  const wrap = ta.parentElement;
  if (wrap) ro?.observe(wrap);

  const io =
    typeof IntersectionObserver !== "undefined"
      ? new IntersectionObserver(
          (entries) => {
            if (entries.some((e) => e.isIntersecting)) run();
          },
          { threshold: 0 }
        )
      : null;
  io?.observe(ta);

  const onResize = () => run();
  window.addEventListener("resize", onResize);

  void document.fonts?.ready.then(() => {
    if (!cancelled) run();
  });

  return () => {
    cancelled = true;
    cancelAnimationFrame(outerRaf);
    cancelAnimationFrame(innerRaf);
    window.clearTimeout(t0);
    window.clearTimeout(t1);
    ro?.disconnect();
    io?.disconnect();
    window.removeEventListener("resize", onResize);
  };
}

let protoStoreSeq = 0;

function ensureStoreId(store: HTMLElement): string {
  if (!store.dataset.studioStoreId) {
    store.dataset.studioStoreId = `loc-${++protoStoreSeq}`;
  }
  return store.dataset.studioStoreId;
}

/** My Account copy — legacy rental/equipment/order → appointment vocabulary (Figma export is read-only). */
function rewriteAccountAppointmentCopy(page: HTMLElement) {
  const rules: Array<[RegExp, string]> = [
    [/Equipment in this Order/gi, "Vaccinations in this Appointment"],
    [/Don['’]t you see your rental\?\s*/gi, "Don't you see your appointment? "],
    [/\bYou've viewed (\d+) of (\d+) rentals\b/gi, "You've viewed $1 of $2 appointments"],
    [/\bHire Equipment\b/g, "Book Appointment"],
    [/\brentals\b/gi, "appointments"],
    [/\brental\b/gi, "appointment"],
    [/\bOrder History\b/g, "Appointment History"],
    [/\bOrder Details\b/g, "Appointment Details"],
    [/\bOrder history\b/g, "Appointment history"],
    [/\bOrder #/g, "Appointment #"],
    [/\bOrder number\b/g, "Appointment number"],
    [/\b(\d+)\s+Orders\b/g, "$1 Appointments"],
    [/\bOrder Summary\b/g, "Appointment Summary"],
    [/\bOrder summary\b/g, "Appointment summary"],
    [/\bOrder Discount\b/g, "Appointment Discount"],
    [/\bOrder discount\b/g, "Appointment discount"],
    [/\bOrder Placed\b/g, "Appointment Booked"],
    [/\bthis Order\b/g, "this Appointment"],
    [/\bin this Order\b/gi, "in this Appointment"],
    [/^Placed$/i, "Booked"],
  ];

  const needsRewrite = (text: string) =>
    /\b(order|rental|equipment|hire|placed)\b/i.test(text);

  page.querySelectorAll("p, span").forEach((node) => {
    if (node.closest('[data-name="boots-pharmacy.module.header"]')) return;
    if (node.querySelector("p, span")) return;
    const original = node.textContent ?? "";
    if (!needsRewrite(original)) return;
    let next = original;
    for (const [re, repl] of rules) {
      next = next.replace(re, repl);
    }
    if (next !== original) node.textContent = next;
  });
}

function extractStoreLocation(store: HTMLElement): ChosenLocation {
  const name =
    Array.from(store.querySelectorAll("p"))
      .find((p) => (p as HTMLElement).className.includes("leading-[28px]"))
      ?.textContent?.trim() || "Selected pharmacy";

  let address = "";
  store.querySelectorAll<HTMLElement>("[data-name='row']").forEach((row) => {
    const ps = Array.from(row.querySelectorAll("p"));
    if (ps[0] && /^Location$/i.test(ps[0].textContent?.trim() ?? "")) {
      address = ps[1]?.textContent?.trim() ?? "";
    }
  });
  if (!address) {
    address =
      Array.from(store.querySelectorAll("p"))
        .find((p) => /United Kingdom|, London/i.test(p.textContent ?? ""))
        ?.textContent?.trim() || name;
  }
  return { name, address, storeId: ensureStoreId(store) };
}

function findStoreHoursList(store: HTMLElement): HTMLElement | null {
  const marked = store.querySelector<HTMLElement>("[data-studio-hours-list='true']");
  if (marked) return marked;
  return (
    Array.from(store.querySelectorAll<HTMLElement>("div")).find((el) => {
      const rows = el.querySelectorAll(":scope > [data-name='row']");
      if (rows.length < 7) return false;
      // Row textContent is "Monday09:00-21:00" — match contains, not exact
      return (
        /Monday/i.test(rows[0]?.textContent ?? "") &&
        /Sunday/i.test(el.textContent ?? "")
      );
    }) ?? null
  );
}

function findStoreHoursToggle(store: HTMLElement): HTMLElement | null {
  return (
    Array.from(store.querySelectorAll("p")).find((p) =>
      /^(see|hide)\s+working\s+hours$/i.test((p.textContent ?? "").trim())
    ) as HTMLElement | undefined
  ) ?? null;
}

function styleStoreActionLink(el: HTMLElement) {
  el.classList.add("proto-link");
  el.style.cursor = "pointer";
  el.style.userSelect = "none";
  el.style.textDecoration = "none";
  el.style.setProperty("text-decoration", "none", "important");
}

/** Match Figma Frame206 type: text-[13px] / leading-[24px] (hours block itself has no size). */
function styleStoreHoursList(hours: HTMLElement) {
  hours.style.setProperty("font-size", "13px", "important");
  hours.style.setProperty("line-height", "24px", "important");
  hours.style.setProperty("font-family", '"Open Sans", sans-serif', "important");
  hours.style.setProperty("font-weight", "400", "important");
  hours.querySelectorAll<HTMLElement>("p, span, div").forEach((node) => {
    node.style.setProperty("font-size", "13px", "important");
    node.style.setProperty("line-height", "24px", "important");
  });
}

function setStoreHoursVisible(hours: HTMLElement, open: boolean) {
  if (open) {
    hours.style.removeProperty("display");
  } else {
    hours.style.setProperty("display", "none", "important");
  }
}

/**
 * Keep address + opening hours in the left column; From you + CTA in the right.
 * Only tags the true 2-column Figma row — never collapses the address column.
 */
function layoutStoreCardColumns(store: HTMLElement) {
  const fromYou = Array.from(store.querySelectorAll("p")).find((p) =>
    /^from you$/i.test((p.textContent ?? "").trim())
  );
  if (!fromYou) return;

  // Innermost wrapper that contains From you (Frame166)
  const fromBlock = fromYou.parentElement as HTMLElement | null;
  if (!fromBlock) return;

  // Right column = sibling group with From you block + CTA (Frame165)
  let right = fromBlock.parentElement as HTMLElement | null;
  if (!right || right === store) return;

  // Must be a short flex row (From you + button), not the whole card
  const rightButtons = right.querySelectorAll(
    ":scope > [data-name='component.input.button'], :scope > [data-studio-change-loc='true']"
  );
  if (!right.contains(fromBlock)) return;

  const mainRow = right.parentElement as HTMLElement | null;
  if (!mainRow || mainRow === store) return;

  const kids = Array.from(mainRow.children).filter(
    (el): el is HTMLElement => el instanceof HTMLElement
  );
  if (kids.length < 2) return;

  const left = kids.find((el) => el !== right);
  if (!left) return;
  // Left must look like the address column (has Location row or store title)
  const leftLooksLikeInfo =
    !!left.querySelector("[data-name='row']") ||
    /Location/i.test(left.textContent ?? "");
  if (!leftLooksLikeInfo) return;

  mainRow.classList.add("proto-store-main-row");
  left.classList.add("proto-store-info-col");
  right.classList.add("proto-store-side-col");

  // Prefer CTA sitting beside From you inside the right column
  const changeCta = store.querySelector<HTMLElement>(
    "[data-studio-change-loc='true']"
  );
  const chooseCta = Array.from(
    store.querySelectorAll<HTMLElement>("[data-name='component.input.button']")
  ).find((b) => /choos(e|en)\s*location/i.test(b.textContent ?? ""));
  const cta = changeCta ?? chooseCta ?? null;
  if (cta && cta.parentElement !== right) {
    right.appendChild(cta);
  } else if (rightButtons.length === 0 && cta) {
    right.appendChild(cta);
  }

  const hours = findStoreHoursList(store);
  if (hours && !left.contains(hours)) {
    left.appendChild(hours);
  }
}

/** Ensure every store card can show/hide the hours list; default collapsed. */
function wireStoreWorkingHours(overlay: HTMLElement) {
  const stores = Array.from(
    overlay.querySelectorAll<HTMLElement>("[data-name='boots-pharmacy.store']")
  ).filter((s) => s.getAttribute("aria-hidden") !== "true");

  let template: HTMLElement | null = null;
  for (const store of stores) {
    const hours = findStoreHoursList(store);
    if (hours) {
      template = hours.cloneNode(true) as HTMLElement;
      template.dataset.studioHoursList = "true";
      break;
    }
  }
  if (!template) return;

  stores.forEach((store) => {
    layoutStoreCardColumns(store);

    const toggle = findStoreHoursToggle(store);
    if (!toggle) return;

    let hours = findStoreHoursList(store);
    if (!hours) {
      hours = template!.cloneNode(true) as HTMLElement;
      const infoCol =
        store.querySelector<HTMLElement>(".proto-store-info-col") ??
        toggle.parentElement?.parentElement;
      if (infoCol) infoCol.appendChild(hours);
      else store.appendChild(hours);
    }
    hours.dataset.studioHoursList = "true";
    styleStoreHoursList(hours);
    // Re-assert hours stay in the address column after insert
    layoutStoreCardColumns(store);

    // Default collapsed on every card (including Figma’s pre-expanded one)
    if (store.dataset.studioHoursOpen == null) {
      store.dataset.studioHoursOpen = "false";
    }
    const open = store.dataset.studioHoursOpen === "true";
    setStoreHoursVisible(hours, open);
    toggle.textContent = open ? "Hide working hours" : "See working hours";
    styleStoreActionLink(toggle);

    const mapLink = Array.from(store.querySelectorAll("p")).find((p) =>
      /^show on map$/i.test((p.textContent ?? "").trim())
    );
    if (mapLink) {
      // Page card already has an embedded map — hide the redundant link
      if (
        store.classList.contains("proto-chosen-store-card") ||
        store.dataset.studioChosenPageCard === "true"
      ) {
        mapLink.dataset.studioHideShowOnMap = "true";
        (mapLink as HTMLElement).style.display = "none";
      } else {
        styleStoreActionLink(mapLink as HTMLElement);
      }
    }
  });
}

const UI_LEGACY_KEYS = [
  "boots-vaccine-proto-ui",
  "boots-vaccine-proto-ui-v2",
  "boots-vaccine-proto-ui-v3",
];
/** Persist global nav tab across refresh / Reset. */
const HUB_STORAGE_KEY = "boots-vaccine-proto-hub";
const AGENTIC_PENDING_QUERY_KEY = "boots-vaccine-proto-agentic-pending-query";

/** Screen interaction defaults. Nav index is separate. */
const DEFAULT_UI_STATE = {
  chosenLocation: null as ChosenLocation | null,
};

const BOOKING_WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function bookingDayOrdinal(n: number): string {
  const v = n % 100;
  if (v >= 11 && v <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

function formatBookingDateHeading(month: "June" | "July", day: number): string {
  const monthIndex = month === "July" ? 6 : 5;
  const d = new Date(2026, monthIndex, day);
  return `${BOOKING_WEEKDAYS[d.getDay()]}, ${bookingDayOrdinal(day)} ${month} 2026`;
}

function formatBookingDateTimeLabel(slot: ChosenBookingSlot): string {
  return `${formatBookingDateHeading(slot.month, slot.day)}, ${slot.time}`;
}

function readBookingSlotFromScreen(
  screen: HTMLElement
): ChosenBookingSlot | null {
  let month: ChosenBookingSlot["month"] | undefined;
  let day: number | undefined;
  let time: string | undefined;

  screen
    .querySelectorAll<HTMLElement>(
      '[data-name="calendar. date. cell"][data-studio-cal-selected="true"]'
    )
    .forEach((cell) => {
      if (cell.dataset.studioCalKind === "date") {
        const m = cell.dataset.studioCalMonth;
        if (m === "June" || m === "July") month = m;
        const d = Number(cell.dataset.studioCalValue);
        if (Number.isFinite(d)) day = d;
      }
      if (cell.dataset.studioCalKind === "time") {
        time = cell.dataset.studioCalValue;
      }
    });

  if (month && day != null && time) return { month, day, time };
  return null;
}

function calCellLabel(cell: HTMLElement): string {
  return cell.querySelector("p")?.textContent?.trim() ?? "";
}

function calCellIsUnavailable(cell: HTMLElement): boolean {
  const labeled = cell.querySelector<HTMLElement>("[class*='text-']");
  const cls = `${cell.className} ${labeled?.className ?? ""}`;
  return cls.includes("text-[#c3c3c3]");
}

function stripCalCellChrome(cell: HTMLElement) {
  cell
    .querySelectorAll<HTMLElement>(":scope > [aria-hidden]")
    .forEach((el) => {
      if (el.className.includes("border")) el.remove();
    });
  cell
    .querySelectorAll<HTMLElement>('[data-name=".utility / cursor"]')
    .forEach((el) => el.remove());
  cell.classList.remove(
    "bg-white",
    "bg-[#c6e5e1]",
    "bg-[#f5f5f5]",
    "rounded-[4px]"
  );
  cell.className = cell.className
    .replace(/\bdrop-shadow-\[[^\]]+\]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  // Drop Figma’s baked-in selected typography (Inter SemiBold / 16px on “24”, “16:30”)
  // so only [data-studio-cal-selected] can look bold.
  cell.querySelectorAll<HTMLElement>("div, p").forEach((el) => {
    el.className = el.className
      .replace(/font-\['Inter:[^']+'\]/g, "font-['Open_Sans:Regular',sans-serif]")
      .replace(/\bfont-semibold\b/g, "font-normal")
      .replace(/\bfont-bold\b/g, "font-normal")
      .replace(/\bnot-italic\b/g, "")
      .replace(/\btext-\[16px\]\b/g, "text-[13px]")
      .replace(/\bleading-\[16px\]\b/g, "leading-[24px]")
      .replace(/\s+/g, " ")
      .trim();
    el.style.removeProperty("font-weight");
    el.style.removeProperty("font-size");
    el.style.removeProperty("font-family");
  });
}

function clearProtoUiStorage() {
  UI_LEGACY_KEYS.forEach((k) => sessionStorage.removeItem(k));
  sessionStorage.removeItem(AGENTIC_PENDING_QUERY_KEY);
}

function findBookProgressCol(
  screen: HTMLElement,
  label: RegExp
): HTMLElement | null {
  const progress = screen.querySelector<HTMLElement>(
    '[data-name="component.book.appointment.progress"]'
  );
  if (!progress) return null;
  for (const child of Array.from(progress.children)) {
    if (!(child instanceof HTMLElement)) continue;
    if (label.test((child.textContent ?? "").replace(/\s+/g, " "))) {
      return child;
    }
  }
  return null;
}

function bookProgressBar(col: HTMLElement): HTMLElement | null {
  const bar = col.lastElementChild;
  return bar instanceof HTMLElement ? bar : null;
}

function markBookProgressCompleted(bar: HTMLElement) {
  bar.style.setProperty("background", "#c6e5e1", "important");
  bar.classList.remove("bg-white");
}

export type BootsPharmacyProjectViewProps = {
  bridge: ProjectShellBridge;
  apiRef?: MutableRefObject<ProjectWireApi | null>;
};

export function BootsPharmacyProjectView({ bridge, apiRef }: BootsPharmacyProjectViewProps) {
  const {
    current,
    setCurrent,
    hubOpen,
    setHubOpen,
    studio,
    prototypeScrollElRef,
    hubScrollElRef,
    appContentRef,
    tabsScrollRef,
    tabBtnRefs,
    go,
    openHub,
    navPlaybackLockedRef,
    goRef,
    currentRef,
    studioNavKey,
    orchestra,
    onWireApiChange,
    studioJourneyMode,
  } = bridge;

  const {
    content: projectContent,
    journey: activeJourney,
    beatIndex: journeyBeatIndex,
    setBeatIndex: setJourneyBeatIndex,
  } = studio;

  const {
    activeScreenScenario,
    scenarioPlayback,
    transport,
    journeyBeatIndexRef,
    setJourneyBeatIndexRef,
    activeJourneyRef,
    openAvailabilityToolRef,
    closeAvailabilityToolRef,
    resetToEndRef,
    triggerChatBrowseRevealRef,
    retreatFromFinaleRef,
    cancelPreRevealPauseRef,
    scenarioVisibleCountRef,
  } = orchestra;

  const {
    PROJECT_SCREENS: SCREENS,
    HUB_LABEL,
    SCENARIO_SCREENS,
    INDEX_APPOINTMENT_DETAILS,
    INDEX_APPOINTMENT_HISTORY,
    INDEX_BOOK_STEP1,
    INDEX_BOOK_STEP2,
    INDEX_BOOK_STEP3,
    INDEX_PLP,
    studioTabToIndex,
    ProjectFrame,
    HubViewport,
  } = projectContent;

  const [availabilityOpen, setAvailabilityOpen] = useState(false);
  const [availIntent, setAvailIntent] = useState<AvailOpenIntent>(
    AVAIL_INTENT.start
  );
  const [availActiveStep, setAvailActiveStep] = useState<AvailStep | null>(null);
  const [chosenLocation, setChosenLocation] = useState<ChosenLocation | null>(
    DEFAULT_UI_STATE.chosenLocation
  );
  const [chosenVaccine, setChosenVaccine] = useState<ChosenVaccine>(
    DEFAULT_CHOSEN_VACCINE
  );
  const [vaccinePickerOpen, setVaccinePickerOpen] = useState(false);
  const [chosenRecipient, setChosenRecipient] = useState<RecipientMode>(
    DEFAULT_CHOSEN_RECIPIENT
  );
  const [includeBoosterDose, setIncludeBoosterDose] = useState(
    DEFAULT_INCLUDE_BOOSTER_DOSE
  );
  const [chosenBookingSlot, setChosenBookingSlot] = useState<ChosenBookingSlot>(
    DEFAULT_CHOSEN_BOOKING_SLOT
  );

  const syncBookStep2RetreatDefault = useCallback(
    (options?: { clearTime?: boolean }) => {
      syncBookStep2RetreatDefaultDom(options);
    },
    []
  );

  useEffect(() => {
    return onRetreatSync((detail) => {
      if (isBookStep2RetreatSlotDetail(detail)) {
        const { month, day, time } = detail.data;
        queueMicrotask(() => {
          setChosenBookingSlot({
            month,
            day,
            time:
              typeof time === "string" && time.length > 0
                ? time
                : DEFAULT_CHOSEN_BOOKING_SLOT.time,
          });
        });
        return;
      }
      if (!isBookStep2RetreatSyncDetail(detail)) return;
      const { month, day, clearTime } = detail.data;
      queueMicrotask(() => {
        setChosenBookingSlot((prev) => ({
          month,
          day,
          time: clearTime ? DEFAULT_CHOSEN_BOOKING_SLOT.time : prev.time,
        }));
      });
    });
  }, []);

  // Book Step 2 — re-apply calendar selection when slot changes (incl. CJM step-back)
  // React pilot owns selection via props — skip Make DOM mutators when mounted.
  useEffect(() => {
    if (SCREENS[current]?.childIndex !== 4) return;
    if (isBookStep2ReactMounted()) return;
    const screen = bookStep2Screen();
    if (!screen) return;
    applyBookStep2CalendarFromSlot(screen, chosenBookingSlot);
  }, [current, chosenBookingSlot]);
  const [recipientPickerOpen, setRecipientPickerOpen] = useState(false);
  const [loginPopupOpen, setLoginPopupOpen] = useState(false);
  const [loginPopupTab, setLoginPopupTab] = useState<"signin" | "create">("signin");
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [loggedInFlag, setLoggedInFlag] = useState(false);
  const [homeQueryDirty, setHomeQueryDirty] = useState(false);
  const [chatComposerDirty, setChatComposerDirty] = useState(false);
  const [plpFiltersDirty, setPlpFiltersDirty] = useState(false);
  const hubScrollPosRef = useRef(0);
  const prototypeScrollPosRef = useRef(0);
  const chosenLocationRef = useRef(chosenLocation);
  const pendingAgenticHomeQueryRef = useRef<string | null>(null);
  currentRef.current = current;
  chosenLocationRef.current = chosenLocation;

  const openAvailabilityTool = (intent: AvailOpenIntent = AVAIL_INTENT.start) => {
    const resolved = resolveAvailIntent(intent, chosenLocationRef.current);
    const apply = () => {
      setAvailIntent(resolved);
      setAvailabilityOpen(true);
    };
    // CJM step-back re-apply — defer out of beat-enter effects (no flushSync in lifecycle).
    if (intent.replayKey != null) {
      queueMicrotask(apply);
      return;
    }
    apply();
  };
  openAvailabilityToolRef.current = openAvailabilityTool;
  const closeAvailabilityTool = () => setAvailabilityOpen(false);
  closeAvailabilityToolRef.current = closeAvailabilityTool;
  const openVaccinePicker = () => setVaccinePickerOpen(true);
  const closeVaccinePicker = () => setVaccinePickerOpen(false);
  const openRecipientPicker = () => setRecipientPickerOpen(true);
  const closeRecipientPicker = () => setRecipientPickerOpen(false);
  const openQuickView = useCallback(() => setQuickViewOpen(true), []);
  const closeQuickView = useCallback(() => setQuickViewOpen(false), []);
  const closeAllPopups = useCallback(() => {
    setQuickViewOpen(false);
    setAvailabilityOpen(false);
    setVaccinePickerOpen(false);
    setRecipientPickerOpen(false);
    setLoginPopupOpen(false);
  }, []);

  const goSitePilotHome = useCallback((query: string) => {
    pendingAgenticHomeQueryRef.current = query;
    try {
      sessionStorage.setItem(AGENTIC_PENDING_QUERY_KEY, query);
    } catch {
      /* ignore */
    }
    setHubOpen(false);
    setCurrent(0);
  }, [setCurrent, setHubOpen]);
  const onQuickViewBookNow = useCallback(() => {
    setQuickViewOpen(false);
    setCurrent(INDEX_BOOK_STEP1);
  }, [setCurrent, INDEX_BOOK_STEP1]);
  const onQuickViewViewDetails = useCallback(() => {
    setQuickViewOpen(false);
    setCurrent(3);
  }, [setCurrent]);
  const onQuickViewOpenLogin = useCallback((tab: "signin" | "create") => {
    setLoginPopupTab(tab);
    setLoginPopupOpen(true);
  }, []);

  const openPickLocations = (
    mode: "list" | "nearMe" | "start" = "list",
    options?: { locationRequired?: boolean }
  ) => {
    const base =
      mode === "nearMe"
        ? AVAIL_INTENT.pickNearMe
        : mode === "start"
          ? AVAIL_INTENT.pickStart
          : AVAIL_INTENT.pickList;
    const intent: AvailOpenIntent = { ...base };
    if (chosenLocationRef.current) {
      intent.storeId = mapChosenToAvailStoreId(chosenLocationRef.current);
    }
    if (options?.locationRequired) {
      intent.locationRequired = true;
    }
    openAvailabilityTool(intent);
  };

  const syncPlpFiltersDirty = useCallback(() => {
    setPlpFiltersDirty(arePlpFiltersActive(document));
  }, []);

  const applyDemoLocation = useCallback(() => {
    setChosenLocation(getDemoChosenLocation());
  }, []);

  const handleAvailabilityBookNow = useCallback(
    (store: { id: string; name: string; address: string }, slot: ChosenBookingSlot) => {
      setChosenLocation({
        name: store.name,
        address: store.address,
        storeId: store.id,
      });
      setChosenBookingSlot(slot);
      closeAvailabilityTool();
      if (studioJourneyMode) {
        // Journey transport + beat-enter own tab/beat — no deferred wire timeline hacks.
        return;
      }
      window.setTimeout(() => {
        setCurrent(INDEX_BOOK_STEP2);
        const datetimeBeatIndex =
          activeJourney?.beats.findIndex((beat) => beat.id === "book-step-2") ??
          -1;
        if (datetimeBeatIndex >= 0) {
          setJourneyBeatIndex((current) =>
            current < datetimeBeatIndex ? datetimeBeatIndex : current
          );
        }
      }, 0);
    },
    [activeJourney, setCurrent, setJourneyBeatIndex, studioJourneyMode]
  );

  useEffect(() => {
    if (!availabilityOpen) {
      setAvailActiveStep(null);
    }
  }, [availabilityOpen]);

  const handleAvailabilityStepChange = useCallback((step: AvailStep) => {
    setAvailActiveStep(step);
  }, []);

  const saveHubScroll = useCallback(() => {
    if (hubScrollElRef.current) {
      hubScrollPosRef.current = hubScrollElRef.current.scrollTop;
    }
  }, []);

  const savePrototypeScroll = useCallback(() => {
    if (prototypeScrollElRef.current) {
      prototypeScrollPosRef.current = prototypeScrollElRef.current.scrollTop;
    }
  }, []);

  const resetPrototypeScroll = useCallback(() => {
    prototypeScrollPosRef.current = 0;
    const el = prototypeScrollElRef.current;
    if (!el) return;
    scrollPrototypeScrollToTopAfterLayout(el);
  }, []);

  const resetWireInteractionState = useCallback(() => {
    closeAllPopups();
    setAvailIntent(AVAIL_INTENT.start);
    setAvailActiveStep(null);
    setChosenLocation(DEFAULT_UI_STATE.chosenLocation);
    setChosenVaccine(DEFAULT_CHOSEN_VACCINE);
    setChosenRecipient(DEFAULT_CHOSEN_RECIPIENT);
    setIncludeBoosterDose(DEFAULT_INCLUDE_BOOSTER_DOSE);
    setChosenBookingSlot(DEFAULT_CHOSEN_BOOKING_SLOT);
    setLoggedInFlag(false);
    setHeaderLoggedIn(false);
    setHomeQueryDirty(false);
    setChatComposerDirty(false);
    setPlpFiltersDirty(false);
    pendingAgenticHomeQueryRef.current = null;
    resetPlpFilters(document);
    clearProtoUiStorage();
    resetPrototypeScroll();
    setPlpFiltersDirty(false);
    if (SCREENS[current]?.childIndex === 11) {
      syncAgenticHomeHeading(false);
    }
  }, [closeAllPopups, current, resetPrototypeScroll]);

  const restoreHubScroll = useCallback(() => {
    const el = hubScrollElRef.current;
    if (!el) return;
    const apply = () => {
      el.scrollTop = hubScrollPosRef.current;
    };
    apply();
    requestAnimationFrame(apply);
    window.setTimeout(apply, 0);
    window.setTimeout(apply, 120);
  }, []);

  const resetPrototype = () => {
    cancelPreRevealPauseRef.current?.();
    scenarioPlayback.abortPlayback();
    transport.stopJourneyPlay();
    removeDemoCursor({ immediate: true });

    resetWireInteractionState();
    transport.resetJourney();
    scenarioPlayback.jumpToStart();

    if (SCREENS[current]?.childIndex === 10 && !studioJourneyMode) {
      window.setTimeout(() => triggerChatBrowseRevealRef.current(), 0);
    }
  };

  useEffect(() => {
    if (!hubOpen) return;
    restoreHubScroll();
    const el = hubScrollElRef.current;
    const inner = el?.firstElementChild;
    if (!el || !inner) return;

    const ro = new ResizeObserver(() => restoreHubScroll());
    ro.observe(inner);
    return () => ro.disconnect();
  }, [hubOpen, restoreHubScroll]);

  // Prototype tabs always open at scroll top (nav, in-flow links, hub exit).
  // Site Pilot Chat owns scroll — default is last frame pinned to bottom.
  useLayoutEffect(() => {
    if (hubOpen) return;
    if (SCREENS[current]?.childIndex === 10) return;
    resetPrototypeScroll();
  }, [current, hubOpen, resetPrototypeScroll]);

  // Popups are tab-specific — close all when leaving a screen (nav tab or hub).
  const navSnapshotRef = useRef({ current, hubOpen });
  useLayoutEffect(() => {
    const prev = navSnapshotRef.current;
    if (prev.current === current && prev.hubOpen === hubOpen) return;
    navSnapshotRef.current = { current, hubOpen };
    closeAllPopups();
  }, [current, hubOpen, closeAllPopups]);

  useScrollFill(prototypeScrollElRef, !hubOpen);

  // Boots Pharmacy logo, header “Home”, and breadcrumb “Home” → page 1 (Agentic Site Pilot Home)
  useEffect(() => {
    const root = prototypeScrollElRef.current;
    if (!root) return;

    const goHome = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      if ("stopImmediatePropagation" in e) {
        (e as Event).stopImmediatePropagation();
      }
      closeAllPopups();
      setHubOpen(false);
      resetPrototypeScroll();
      setCurrent(0);
    };

    const isHeaderHomeTarget = (el: Element | null): boolean => {
      if (!el) return false;
      const menuItem = el.closest(
        '[data-name="component.mega.menu.item"]'
      ) as HTMLElement | null;
      if (menuItem) {
        const label = (
          menuItem.querySelector("p")?.textContent ??
          menuItem.textContent ??
          ""
        ).trim();
        if (/^home$/i.test(label)) return true;
      }
      return false;
    };

    const onClick = (e: MouseEvent) => {
      const t = e.target as Element | null;
      if (!t || !root.contains(t)) return;

      if (t.closest('[data-name="boots-pharmacy"]')) {
        goHome(e);
        return;
      }

      if (isHeaderHomeTarget(t)) {
        goHome(e);
        return;
      }

      // Make used p/span; React Book Step 1 uses a button — match any Home hit in crumbs.
      const crumbNav = t.closest("[data-name='component.breadcrumbs']");
      if (crumbNav) {
        const hit = (t.closest("p, span, button, a") ?? t) as HTMLElement;
        if (
          crumbNav.contains(hit) &&
          /^home$/i.test((hit.textContent ?? "").trim())
        ) {
          goHome(e);
        }
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const t = e.target as Element | null;
      if (!t || !root.contains(t)) return;
      if (t.closest('[data-name="boots-pharmacy"]') || isHeaderHomeTarget(t)) {
        goHome(e);
      }
    };

    root
      .querySelectorAll<HTMLElement>('[data-name="boots-pharmacy"]')
      .forEach((logo) => {
        logo.setAttribute("role", "link");
        logo.setAttribute("aria-label", "Boots Pharmacy home");
        logo.tabIndex = 0;
      });

    root
      .querySelectorAll<HTMLElement>('[data-name="component.mega.menu.item"]')
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

    root.addEventListener("click", onClick);
    root.addEventListener("keydown", onKey);
    return () => {
      root.removeEventListener("click", onClick);
      root.removeEventListener("keydown", onKey);
    };
  }, [closeAllPopups, resetPrototypeScroll]);

  // Nav tabs: vertical wheel / trackpad over the strip scrolls X (tabs aren't clipped dead).
  useEffect(() => {
    const el = tabsScrollRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (el.scrollWidth <= el.clientWidth + 1) return;
      const predominatelyVertical = Math.abs(e.deltaY) >= Math.abs(e.deltaX);
      const dx = predominatelyVertical ? e.deltaY : e.deltaX;
      if (dx === 0) return;
      const atStart = el.scrollLeft <= 0 && dx < 0;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1 && dx > 0;
      if (atStart || atEnd) return;
      e.preventDefault();
      el.scrollLeft += dx;
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // Keep the active tab visible in the nav strip (Next / Previous / tab click / dots).
  useEffect(() => {
    const btn = tabBtnRefs.current[current];
    const scroller = tabsScrollRef.current;
    if (!btn || !scroller) return;
    const btnLeft = btn.offsetLeft;
    const btnRight = btnLeft + btn.offsetWidth;
    const viewLeft = scroller.scrollLeft;
    const viewRight = viewLeft + scroller.clientWidth;
    const pad = 12;
    if (btnLeft < viewLeft + pad) {
      scroller.scrollTo({ left: Math.max(0, btnLeft - pad), behavior: "smooth" });
    } else if (btnRight > viewRight - pad) {
      scroller.scrollTo({
        left: btnRight - scroller.clientWidth + pad,
        behavior: "smooth",
      });
    }
  }, [current]);

  // Mount shared sticky header at top of scroll container (replaces per-page Figma headers)
  useEffect(() => {
    const scrollEl = prototypeScrollElRef.current;
    if (!scrollEl) return;
    setupHeader(scrollEl, {
      onLoginChange: () => {
        const isLoggedIn = isHeaderLoggedIn();
        setLoggedInFlag(isLoggedIn);
        if (SCREENS[currentRef.current]?.childIndex === 11) {
          syncAgenticHomeHeading(isLoggedIn);
        }
      },
      onLoginClick: (tab) => { setLoginPopupTab(tab || "signin"); setLoginPopupOpen(true); },
      onSignOut: () => {
        setLoggedInFlag(false);
        if (SCREENS[currentRef.current]?.childIndex === 11) {
          syncAgenticHomeHeading(false);
        }
        const idx = SCREENS[currentRef.current]?.childIndex;
        if (idx === 1 || idx === 2 || idx === 3) {
          setCurrent(0);
        }
      },
      onNavigate: (screenIndex) => { setCurrent(screenIndex); },
    });
  }, []);

  // Measure the sticky header height for any dependent positioning
  useEffect(() => {
    const scrollEl = prototypeScrollElRef.current;
    if (!scrollEl) return;
    const headerMount = scrollEl.querySelector(".proto-header-mount") as HTMLElement | null;
    const h = headerMount ? headerMount.getBoundingClientRect().height : 64;
    document.documentElement.style.setProperty("--sticky-top", `${h}px`);

    // Sync login state: account pages force logged-in (browse stays as user left it)
    syncHeaderLogin(SCREENS[current]?.childIndex ?? 11);
    const headerLoggedIn = isHeaderLoggedIn();
    setLoggedInFlag(headerLoggedIn);
    if (SCREENS[current]?.childIndex === 11) {
      syncAgenticHomeHeading(headerLoggedIn);
    }

    const runMaAvatars = () => syncMaAccountAvatars(scrollEl);
    runMaAvatars();
    const raf = requestAnimationFrame(runMaAvatars);
    const t = window.setTimeout(runMaAvatars, 0);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(t);
    };
  }, [current]);

  // Agentic home heading — re-sync after every commit (Figma export resets copy on re-render).
  useLayoutEffect(() => {
    if (SCREENS[current]?.childIndex !== 11) return;
    const isLoggedIn = resolveAgenticHomeLoggedIn(loggedInFlag);
    return bindAgenticHomeHeadingSync(isLoggedIn);
  }, [current, loggedInFlag]);

  // Mark active progress step on booking pages
  useEffect(() => {
    const childIndex = SCREENS[current]?.childIndex;
    const activeStepMap: Record<number, RegExp> = {
      7: /choose location/i,
      4: /choose date/i,
      3: /confirmation/i,
    };
    const activePattern = activeStepMap[childIndex ?? -1];
    if (!activePattern) return;

    const mark = () => {
      const screen = document.querySelector(
        `.studio-viewport > div > div:nth-child(${childIndex})`
      ) as HTMLElement | null;
      const progress = screen?.querySelector<HTMLElement>(
        '[data-name="component.book.appointment.progress"]'
      );
      if (!progress) return;
      Array.from(progress.children)
        .filter((n): n is HTMLElement => n instanceof HTMLElement)
        .forEach((col) => {
          const text = (col.textContent ?? "").replace(/\s+/g, " ");
          if (activePattern.test(text)) {
            col.dataset.studioStepActive = "true";
          } else {
            delete col.dataset.studioStepActive;
          }
        });
    };
    mark();
    const raf = requestAnimationFrame(mark);
    const t = window.setTimeout(mark, 120);
    return () => { cancelAnimationFrame(raf); clearTimeout(t); };
  }, [current]);

  // Book Step 1 — React + UXDS pilot (retires Make HTML for this screen only)
  useLayoutEffect(() => {
    if (SCREENS[current]?.childIndex !== 7) {
      unmountBookStep1Screen();
      return;
    }

    const onContinue = () => {
      if (!chosenLocationRef.current) {
        openPickLocations("list", { locationRequired: true });
        return;
      }
      setCurrent(INDEX_BOOK_STEP2);
    };

    mountBookStep1Screen({
      chosenLocation,
      vaccineName: chosenVaccine.name,
      recipient: chosenRecipient,
      includeBoosterDose,
      onOpenSearch: () => openPickLocations("list"),
      onOpenNearMe: () => openPickLocations("nearMe"),
      onChangeLocation: () => openPickLocations("list"),
      onChangeVaccine: openVaccinePicker,
      onChangeRecipient: openRecipientPicker,
      onToggleBooster: () => setIncludeBoosterDose((prev) => !prev),
      onContinue,
    });

    // Ensure Footer remounts after Make footer is hidden.
    setupFooters({
      onGoToPlp: () => goRef.current(INDEX_PLP),
    });
  }, [
    current,
    chosenLocation,
    chosenVaccine.name,
    chosenRecipient,
    includeBoosterDose,
  ]);

  useEffect(() => {
    return () => unmountBookStep1Screen();
  }, []);

  // Book Step 2 — React + UXDS pilot (retires Make HTML for this screen only)
  useLayoutEffect(() => {
    if (SCREENS[current]?.childIndex !== 4) {
      unmountBookStep2Screen();
      return;
    }

    mountBookStep2Screen({
      chosenLocation,
      vaccineName: chosenVaccine.name,
      recipient: chosenRecipient,
      slot: chosenBookingSlot,
      onChangeVaccine: openVaccinePicker,
      onChangeRecipient: openRecipientPicker,
      onChangeLocation: () => openPickLocations("list"),
      onSlotChange: setChosenBookingSlot,
      onReserve: () => setCurrent(INDEX_BOOK_STEP3),
      onBackToStep1: () => setCurrent(INDEX_BOOK_STEP1),
    });

    setupFooters({
      onGoToPlp: () => goRef.current(INDEX_PLP),
    });
  }, [
    current,
    chosenLocation,
    chosenVaccine.name,
    chosenRecipient,
    chosenBookingSlot,
  ]);

  useEffect(() => {
    return () => unmountBookStep2Screen();
  }, []);

  // Book Step 3 — React + UXDS pilot (retires Make HTML for this screen only)
  useLayoutEffect(() => {
    if (SCREENS[current]?.childIndex !== 3) {
      unmountBookStep3Screen();
      return;
    }

    mountBookStep3Screen({
      chosenLocation,
      vaccineName: chosenVaccine.name,
      recipient: chosenRecipient,
      slot: chosenBookingSlot,
      includeBoosterDose,
      onExploreMore: () => setCurrent(INDEX_PLP),
      onOpenAppointments: () => setCurrent(INDEX_APPOINTMENT_HISTORY),
    });

    setupFooters({
      onGoToPlp: () => goRef.current(INDEX_PLP),
    });
  }, [
    current,
    chosenLocation,
    chosenVaccine.name,
    chosenRecipient,
    chosenBookingSlot,
    includeBoosterDose,
  ]);

  useEffect(() => {
    return () => unmountBookStep3Screen();
  }, []);

  // Book – Step 1 (child 7): breadcrumb rewrite — Make path only
  useEffect(() => {
    if (SCREENS[current]?.childIndex !== 7) return;
    if (isBookStep1ReactMounted()) return;
    const screen = document.querySelector(
      ".studio-viewport > div > div:nth-child(7)"
    ) as HTMLElement | null;
    const crumbs = screen?.querySelector<HTMLElement>(
      "[data-name='component.breadcrumbs']"
    );
    if (!crumbs) return;
    const labels = Array.from(crumbs.querySelectorAll("p")).filter(
      (p) => !p.closest("[data-name='boots-pharmacy.store']")
    );
    const currentCrumb = labels[labels.length - 1];
    if (currentCrumb) currentCrumb.textContent = "Book Appointment";
  }, [current]);

  // Agentic home (child 11): static prompt → multiline query textarea;
  // suggested chips fill the textarea on click.
  useEffect(() => {
    if (SCREENS[current]?.childIndex !== 11) return;
    const screen = document.querySelector(
      ".studio-viewport > div > div:nth-child(11)"
    ) as HTMLElement | null;
    const card = screen?.querySelector<HTMLElement>(
      '[data-name="component.co.order.summary"]'
    );
    const subtotal = card?.querySelector<HTMLElement>('[data-name="Subtotal"]');
    if (!card || !subtotal) return;

    let ta = subtotal.querySelector<HTMLTextAreaElement>(
      "textarea.proto-agentic-query"
    );
    if (!ta) {
      const prompt =
        Array.from(subtotal.querySelectorAll("p")).find((p) =>
          /southeast asia|travel vaccinations|health services/i.test(
            p.textContent ?? ""
          )
        ) ?? subtotal.querySelector("p");
      if (!prompt) return;
      ta = document.createElement("textarea");
      ta.className = "proto-agentic-query";
      ta.value = AGENTIC_HOME_QUERY_DEFAULT;
      ta.rows = 1;
      ta.spellcheck = true;
      ta.setAttribute("aria-label", "Ask Site Pilot");
      ta.setAttribute("data-studio-action", "agentic-home-query");
      ta.placeholder = "Ask about health services…";
      prompt.replaceWith(ta);
    }
    ta.setAttribute("data-studio-action", "agentic-home-query");

    const pendingQuery =
      pendingAgenticHomeQueryRef.current ??
      (() => {
        try {
          return sessionStorage.getItem(AGENTIC_PENDING_QUERY_KEY);
        } catch {
          return null;
        }
      })();
    if (pendingQuery) {
      ta.value = pendingQuery;
      pendingAgenticHomeQueryRef.current = null;
      try {
        sessionStorage.removeItem(AGENTIC_PENDING_QUERY_KEY);
      } catch {
        /* ignore */
      }
      syncAgenticQueryHeight(ta);
    }

    const syncQueryDirty = () => {
      setHomeQueryDirty(ta!.value.trim() !== AGENTIC_HOME_QUERY_DEFAULT.trim());
    };
    const onQueryInput = () => {
      syncAgenticQueryHeight(ta!);
      syncQueryDirty();
    };
    const unbindAutoHeight = bindAgenticQueryAutoHeight(ta);
    syncQueryDirty();
    ta.addEventListener("input", onQueryInput);

    const sendBtn = Array.from(
      subtotal.querySelectorAll<HTMLElement>('[data-name="component.input.button"]')
    ).find((btn) => btn.querySelector('[data-name="icon / input / arrows"]'));

    if (sendBtn) {
      sendBtn.setAttribute("role", "button");
      sendBtn.setAttribute("aria-label", "Send message");
      sendBtn.tabIndex = 0;
    }

    const goToChat = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      setCurrent(1); // Agentic. Site Pilot. Chat
    };

    const onCardClick = (e: MouseEvent) => {
      const t = e.target as Element | null;
      if (!t) return;

      if (sendBtn && (t === sendBtn || sendBtn.contains(t))) {
        goToChat(e);
        return;
      }

      const chip = t.closest(
        '[data-name="component.gse.system.message"]'
      ) as HTMLElement | null;
      if (!chip || !card.contains(chip)) return;
      // Suggested dialog options → page 2 (Chat)
      goToChat(e);
    };

    const onSendKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      goToChat(e);
    };

    card.addEventListener("click", onCardClick);
    sendBtn?.addEventListener("keydown", onSendKey);
    return () => {
      unbindAutoHeight();
      ta?.removeEventListener("input", onQueryInput);
      card.removeEventListener("click", onCardClick);
      sendBtn?.removeEventListener("keydown", onSendKey);
    };
  }, [current]);

  const chatBeatActive =
    studioJourneyMode &&
    activeJourney?.beats[journeyBeatIndex]?.id === "agentic-chat";

  // Agentic chat (child 10): fixed composer dock — CJM on/off + chat beat before tab lands.
  useLayoutEffect(() => {
    const onChatTab = SCREENS[current]?.childIndex === 10;
    if (!onChatTab && !chatBeatActive && activeScreenScenario?.id !== "site-pilot-chat") {
      return;
    }
    const screen = document.querySelector(
      ".studio-viewport > div > div:nth-child(10)"
    ) as HTMLElement | null;
    if (!screen) return;
    mountSitePilotChatComposerDock(screen);
    stripSitePilotChatDemoCursors();
    const raf = requestAnimationFrame(() => stripSitePilotChatDemoCursors());
    return () => {
      cancelAnimationFrame(raf);
    };
  }, [current, chatBeatActive, activeScreenScenario?.id]);

  // Re-sync dock when scenario frames advance (CJM play) — no teardown.
  useLayoutEffect(() => {
    const onChatTab = SCREENS[current]?.childIndex === 10;
    if (!onChatTab && !chatBeatActive && activeScreenScenario?.id !== "site-pilot-chat") {
      return;
    }
    const screen = document.querySelector(
      ".studio-viewport > div > div:nth-child(10)"
    ) as HTMLElement | null;
    if (!screen) return;
    mountSitePilotChatComposerDock(screen);
  }, [
    current,
    chatBeatActive,
    activeScreenScenario?.id,
    scenarioPlayback.visibleCount,
    studioJourneyMode,
  ]);

  useLayoutEffect(() => {
    const onChatTab = SCREENS[current]?.childIndex === 10;
    const chatActive =
      chatBeatActive || activeScreenScenario?.id === "site-pilot-chat";
    if (onChatTab || chatActive) return;
    const screen = document.querySelector(
      ".studio-viewport > div > div:nth-child(10)"
    ) as HTMLElement | null;
    if (screen) teardownSitePilotChatComposerDock(screen);
  }, [current, chatBeatActive, activeScreenScenario?.id]);

  // Agentic chat (child 10): composer matches home — textarea, mic/send, chip dynamics
  useEffect(() => {
    if (SCREENS[current]?.childIndex !== 10) return;

    let disposed = false;
    let cleanup: (() => void) | undefined;
    let finishing = false;
    let scenarioDeck: HTMLElement | null = null;

    const wireComposer = () => {
      if (disposed) return;

      cleanup?.();
      cleanup = undefined;

      const screen = document.querySelector(
        ".studio-viewport > div > div:nth-child(10)"
      ) as HTMLElement | null;
      if (screen instanceof HTMLElement) {
        mountSitePilotChatComposerDock(screen);
      }

      const card = findSitePilotChatComposerCard();
      const subtotal = card?.querySelector<HTMLElement>('[data-name="Subtotal"]');
      if (!card || !subtotal) return;

    let ta = subtotal.querySelector<HTMLTextAreaElement>(
      "textarea.proto-agentic-query"
    );
    if (!ta) {
      const prompt =
        Array.from(subtotal.querySelectorAll("p")).find((p) =>
          /ask boots sitepilot/i.test(p.textContent ?? "")
        ) ?? subtotal.querySelector("p");
      if (!prompt) return;
      ta = document.createElement("textarea");
      ta.className = "proto-agentic-query";
      ta.value = "";
      ta.rows = 5;
      ta.spellcheck = true;
      ta.setAttribute("aria-label", "Ask Boots SitePilot");
      ta.setAttribute("data-studio-action", "agentic-chat-query");
      ta.placeholder = "Ask Boots SitePilot";
      prompt.replaceWith(ta);
    }
    ta.setAttribute("data-studio-action", "agentic-chat-query");

    const syncComposerDirty = () => {
      setChatComposerDirty(ta!.value.trim().length > 0);
    };
    const onComposerInput = () => {
      syncAgenticQueryHeight(ta!);
      syncComposerDirty();
    };
    const unbindAutoHeight = bindAgenticQueryAutoHeight(ta);
    syncComposerDirty();
    ta.addEventListener("input", onComposerInput);

    const sendBtn = Array.from(
      subtotal.querySelectorAll<HTMLElement>('[data-name="component.input.button"]')
    ).find((btn) => btn.querySelector('[data-name="glyph"]'));

    const onScenarioDeckClick = (e: Event) => {
      if (!isSitePilotChatThinking()) return;
      const t = e.target as Element | null;
      if (!t?.closest(".studio-nav-scenario")) return;
      cancelThinking();
    };

    const bindScenarioDeckInterrupt = () => {
      scenarioDeck =
        scenarioDeck ?? document.querySelector<HTMLElement>(".studio-nav-scenario");
      scenarioDeck?.addEventListener("click", onScenarioDeckClick, true);
    };

    const unbindScenarioDeckInterrupt = () => {
      scenarioDeck?.removeEventListener("click", onScenarioDeckClick, true);
    };

    const cancelThinking = () => {
      if (finishing || !isSitePilotChatThinking()) return;
      finishing = true;
      cancelPreRevealPauseRef.current();
      endSitePilotChatThinking();
      unbindScenarioDeckInterrupt();
      if (sendBtn) setSitePilotChatSendThinkingMode(sendBtn, false);
      if (scenarioVisibleCountRef.current === 1) {
        const screen = document.querySelector(
          ".studio-viewport > div > div:nth-child(10)"
        );
        syncSitePilotChatThinkingHint(screen, true);
      }
      finishing = false;
    };

    const finishThinking = () => {
      if (finishing) return;
      finishing = true;
      endSitePilotChatThinking();
      unbindScenarioDeckInterrupt();
      if (sendBtn) setSitePilotChatSendThinkingMode(sendBtn, false);
      resetToEndRef.current();
      finishing = false;
    };

    if (sendBtn) {
      sendBtn.classList.add("proto-agentic-send");
      sendBtn.className = sendBtn.className
        .replace(/bg-\[[^\]]+\]/g, "bg-[#012169]")
        .replace(/\bbg-white\b/g, "bg-[#012169]");
      if (!/bg-\[#012169\]/.test(sendBtn.className)) {
        sendBtn.classList.add("bg-[#012169]");
      }
      sendBtn.style.removeProperty("background");
      sendBtn.setAttribute("role", "button");
      sendBtn.tabIndex = 0;
      sendBtn.querySelectorAll("svg path").forEach((path) => {
        path.setAttribute("fill", "#ffffff");
      });
      setSitePilotChatSendThinkingMode(sendBtn, isSitePilotChatSendThinking());
      if (!sendBtn.hasAttribute("aria-label")) {
        sendBtn.setAttribute("aria-label", "Send message");
      }
    }

    const onSendActivate = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      if (finishing) return;

      if (isSitePilotChatSendThinking()) {
        finishThinking();
        return;
      }

      const screen = document.querySelector(
        ".studio-viewport > div > div:nth-child(10)"
      );
      if (!screen) return;

      beginSitePilotChatThinking(screen);
      if (sendBtn) setSitePilotChatSendThinkingMode(sendBtn, true);
      bindScenarioDeckInterrupt();
    };

    const onSendKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      onSendActivate(e);
    };

    const onCardClick = (e: MouseEvent) => {
      const t = e.target as Element | null;
      if (!t || !ta) return;

      if (sendBtn && (t === sendBtn || sendBtn.contains(t))) {
        onSendActivate(e);
        return;
      }

      const chip = t.closest(
        '[data-name="component.gse.system.message"]'
      ) as HTMLElement | null;
      if (chip && card.contains(chip)) {
        e.preventDefault();
        e.stopPropagation();
        const label = (chip.textContent ?? "").trim();
        if (!label) return;
        // Only explicit availability-tool chips → popup (not demo copy)
        if (/^(show available slots for today)$/i.test(label)) {
          openAvailabilityTool(AVAIL_INTENT.dateToday);
          return;
        }
        ta.value = label;
        ta.focus();
        ta.setSelectionRange(label.length, label.length);
        syncAgenticQueryHeight(ta);
        setChatComposerDirty(true);
        return;
      }
    };

    card.addEventListener("click", onCardClick);
    sendBtn?.addEventListener("keydown", onSendKey);
      cleanup = () => {
        unbindScenarioDeckInterrupt();
        endSitePilotChatThinking();
        if (sendBtn) setSitePilotChatSendThinkingMode(sendBtn, false);
        unbindAutoHeight();
        ta?.removeEventListener("input", onComposerInput);
        card.removeEventListener("click", onCardClick);
        sendBtn?.removeEventListener("keydown", onSendKey);
      };
    };

    wireComposer();
    const raf = requestAnimationFrame(wireComposer);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      cleanup?.();
    };
  }, [current, scenarioPlayback.visibleCount]);

  // Agentic chat — product links → PDP; “Go to vaccines catalog” → PLP
  useEffect(() => {
    if (SCREENS[current]?.childIndex !== 10) return;
    const screen = document.querySelector(
      ".studio-viewport > div > div:nth-child(10)"
    ) as HTMLElement | null;
    if (!screen) return;

    const PRODUCT_LINK_RE =
      /^(southeast asia vaccine bundle|hepatitis a|typhoid|tetanus booster|yellow fever vaccine)\s*$/i;

    const stop = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      if ("stopImmediatePropagation" in e) {
        (e as Event).stopImmediatePropagation();
      }
    };
    const goPdp = (e: Event) => {
      stop(e);
      setCurrent(3); // PDP. Vaccine Details Page
    };
    const goPlp = (e: Event) => {
      stop(e);
      setCurrent(2); // PLP. Vaccinations
    };
    const openLocations = (e: Event) => {
      stop(e);
      const intent: AvailOpenIntent = { step: "list", query: "London" };
      if (isHeaderLoggedIn()) intent.storeId = AVAIL_DEMO_STORE;
      setAvailIntent(intent);
      setAvailabilityOpen(true);
    };
    const openAvailability = (intent: AvailOpenIntent) => (e: Event) => {
      stop(e);
      openAvailabilityTool(intent);
    };

    /** Chat CTAs → availability tool step (allowlist). */
    const AVAIL_BTN_INTENT: Array<{ re: RegExp; intent: AvailOpenIntent }> = [
      { re: /^open availability checker tool$/i, intent: AVAIL_INTENT.start },
      { re: /^choose time slot$/i, intent: AVAIL_INTENT.timeSlot },
      { re: /^choose different date$/i, intent: AVAIL_INTENT.dateChat },
    ];

    const availLinks = Array.from(
      screen.querySelectorAll<HTMLElement>("span, a, p")
    ).filter((el) => {
      if (el.closest('[data-name="component.input.button"]')) return false;
      if (el.closest('[data-name="component.gse.system.message"]')) return false;
      if (el.closest("textarea")) return false;
      const text = (el.textContent ?? "").trim();
      if (!/^availability checker tool$/i.test(text)) return false;
      const cls = typeof el.className === "string" ? el.className : "";
      return /underline|decoration/.test(cls);
    });

    const links = Array.from(
      screen.querySelectorAll<HTMLElement>("span, a, p")
    ).filter((el) => {
      // Skip composer / chips / CTAs
      if (el.closest('[data-name="component.input.button"]')) return false;
      if (el.closest('[data-name="component.gse.system.message"]')) return false;
      if (el.closest("textarea")) return false;
      const text = (el.textContent ?? "").trim();
      if (!PRODUCT_LINK_RE.test(text)) return false;
      const cls = typeof el.className === "string" ? el.className : "";
      return /underline|decoration/.test(cls);
    });

    availLinks.forEach((el) => {
      el.classList.add("proto-link");
      el.setAttribute("role", "link");
      el.tabIndex = 0;
      el.style.cursor = "pointer";
      const handler = openAvailability(AVAIL_INTENT.start);
      el.addEventListener("click", handler);
      (el as HTMLElement & { __protoAvailHandler?: (e: Event) => void }).__protoAvailHandler =
        handler;
    });

    links.forEach((el) => {
      el.classList.add("proto-link");
      el.setAttribute("role", "link");
      el.tabIndex = 0;
      el.style.cursor = "pointer";
      el.addEventListener("click", goPdp);
    });

    const allBtns = Array.from(
      screen.querySelectorAll<HTMLElement>('[data-name="component.input.button"]')
    );
    const catalogBtns = allBtns.filter((btn) =>
      /^go to vaccines catalog$/i.test((btn.textContent ?? "").trim())
    );
    const bookPdpBtns = allBtns.filter((btn) =>
      /^book\s+(southeast asia vaccine bundle|yellow fever vaccine)/i.test(
        (btn.textContent ?? "").trim()
      )
    );
    const pharmacyBtns = allBtns.filter((btn) =>
      /^select different pharmacy$/i.test((btn.textContent ?? "").trim())
    );
    const slotCheckBtns = allBtns.filter((btn) =>
      /^check availability slot for me$/i.test((btn.textContent ?? "").trim())
    );
    const todaySlotsBtns = allBtns.filter((btn) =>
      /^find available slots for today$/i.test((btn.textContent ?? "").trim())
    );
    const availabilityBtns = allBtns.flatMap((btn) => {
      const label = (btn.textContent ?? "").trim();
      const match = AVAIL_BTN_INTENT.find((entry) => entry.re.test(label));
      return match ? [{ btn, intent: match.intent }] : [];
    });

    let flashTimer: number | undefined;
    const clearChatHighlights = () => {
      screen
        .querySelectorAll(".proto-chat-highlight")
        .forEach((el) => el.classList.remove("proto-chat-highlight"));
      if (flashTimer != null) window.clearTimeout(flashTimer);
      flashTimer = undefined;
    };

    /** Flash a matching user query bubble (no scroll). */
    const flashQueryBubble = (match: RegExp) => {
      const queries = Array.from(
        screen.querySelectorAll<HTMLElement>('[data-name="query"]')
      );
      const targetQuery =
        queries.find((q) =>
          match.test(
            (q.querySelector('[data-name="Subtotal"] p')?.textContent ?? "").trim()
          )
        ) ?? null;
      const queryCard =
        targetQuery?.querySelector<HTMLElement>(
          '[data-name="component.co.order.summary"]'
        ) ?? null;
      if (!queryCard) return;

      queryCard.classList.remove("proto-chat-highlight");
      void queryCard.offsetWidth;
      queryCard.classList.add("proto-chat-highlight");
      if (flashTimer != null) window.clearTimeout(flashTimer);
      flashTimer = window.setTimeout(() => {
        queryCard.classList.remove("proto-chat-highlight");
        flashTimer = undefined;
      }, 900);
    };

    catalogBtns.forEach((btn) => {
      btn.setAttribute("role", "button");
      btn.tabIndex = 0;
      btn.style.cursor = "pointer";
      btn.addEventListener("click", goPlp);
    });
    bookPdpBtns.forEach((btn) => {
      btn.setAttribute("role", "button");
      btn.tabIndex = 0;
      btn.style.cursor = "pointer";
      btn.addEventListener("click", goPdp);
    });
    pharmacyBtns.forEach((btn) => {
      btn.setAttribute("role", "button");
      btn.tabIndex = 0;
      btn.style.cursor = "pointer";
      btn.addEventListener("click", openLocations);
    });

    const flashSlotCheckQuery = (e: Event) => {
      stop(e);
      flashQueryBubble(/check availability slot for me/i);
    };
    slotCheckBtns.forEach((btn) => {
      btn.setAttribute("role", "button");
      btn.tabIndex = 0;
      btn.style.cursor = "pointer";
      btn.addEventListener("click", flashSlotCheckQuery);
    });

    const flashTodaySlotsQuery = (e: Event) => {
      stop(e);
      flashQueryBubble(/^find available slots for today$/i);
    };
    todaySlotsBtns.forEach((btn) => {
      btn.setAttribute("role", "button");
      btn.tabIndex = 0;
      btn.style.cursor = "pointer";
      btn.addEventListener("click", flashTodaySlotsQuery);
    });

    availabilityBtns.forEach(({ btn, intent }) => {
      btn.setAttribute("role", "button");
      btn.tabIndex = 0;
      btn.style.cursor = "pointer";
      const handler = openAvailability(intent);
      btn.addEventListener("click", handler);
      (btn as HTMLElement & { __protoAvailHandler?: (e: Event) => void }).__protoAvailHandler =
        handler;
    });

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const t = e.target as HTMLElement | null;
      if (!t) return;
      if (links.includes(t)) {
        goPdp(e);
        return;
      }
      const availLink = availLinks.find((el) => el === t || el.contains(t));
      if (availLink) {
        openAvailability(AVAIL_INTENT.start)(e);
        return;
      }
      const btn = t.closest(
        '[data-name="component.input.button"]'
      ) as HTMLElement | null;
      if (!btn) return;
      const availEntry = availabilityBtns.find((entry) => entry.btn === btn);
      if (catalogBtns.includes(btn)) goPlp(e);
      else if (bookPdpBtns.includes(btn)) goPdp(e);
      else if (pharmacyBtns.includes(btn)) openLocations(e);
      else if (slotCheckBtns.includes(btn)) flashSlotCheckQuery(e);
      else if (todaySlotsBtns.includes(btn)) flashTodaySlotsQuery(e);
      else if (availEntry) openAvailability(availEntry.intent)(e);
    };
    screen.addEventListener("keydown", onKey);

    return () => {
      availLinks.forEach((el) => {
        const handler = (
          el as HTMLElement & { __protoAvailHandler?: (e: Event) => void }
        ).__protoAvailHandler;
        if (handler) el.removeEventListener("click", handler);
        delete (el as HTMLElement & { __protoAvailHandler?: (e: Event) => void })
          .__protoAvailHandler;
      });
      links.forEach((el) => el.removeEventListener("click", goPdp));
      catalogBtns.forEach((btn) => btn.removeEventListener("click", goPlp));
      bookPdpBtns.forEach((btn) => btn.removeEventListener("click", goPdp));
      pharmacyBtns.forEach((btn) =>
        btn.removeEventListener("click", openLocations)
      );
      slotCheckBtns.forEach((btn) =>
        btn.removeEventListener("click", flashSlotCheckQuery)
      );
      todaySlotsBtns.forEach((btn) =>
        btn.removeEventListener("click", flashTodaySlotsQuery)
      );
      availabilityBtns.forEach(({ btn }) => {
        const handler = (
          btn as HTMLElement & { __protoAvailHandler?: (e: Event) => void }
        ).__protoAvailHandler;
        if (handler) btn.removeEventListener("click", handler);
        delete (btn as HTMLElement & { __protoAvailHandler?: (e: Event) => void })
          .__protoAvailHandler;
      });
      screen.removeEventListener("keydown", onKey);
      clearChatHighlights();
    };
  }, [current]);

  // PDP (child 8) — Check availability → Availability Tool; Book now → Step 1
  useEffect(() => {
    if (SCREENS[current]?.childIndex !== 8) return;
    const screen = document.querySelector(
      ".studio-viewport > div > div:nth-child(8)"
    ) as HTMLElement | null;
    if (!screen) return;

    const stop = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      if ("stopImmediatePropagation" in e) {
        (e as Event).stopImmediatePropagation();
      }
    };
    const openAvail = (e: Event) => {
      stop(e);
      openAvailabilityTool(AVAIL_INTENT.browse);
    };
    const goBookStep1 = (e: Event) => {
      stop(e);
      if (!isHeaderLoggedIn() && !loggedInFlag) {
        setLoginPopupTab("signin");
        setLoginPopupOpen(true);
        return;
      }
      setCurrent(INDEX_BOOK_STEP1);
    };

    const allBtns = Array.from(
      screen.querySelectorAll<HTMLElement>('[data-name="component.input.button"]')
    );
    const availBtns = allBtns.filter((btn) =>
      /^check availability$/i.test((btn.textContent ?? "").trim())
    );
    const bookBtns = allBtns.filter((btn) =>
      /^book now/i.test((btn.textContent ?? "").trim())
    );

    availBtns.forEach((btn) => {
      btn.setAttribute("role", "button");
      btn.tabIndex = 0;
      btn.style.cursor = "pointer";
      btn.addEventListener("click", openAvail);
    });
    bookBtns.forEach((btn) => {
      btn.setAttribute("role", "button");
      btn.tabIndex = 0;
      btn.style.cursor = "pointer";
      btn.addEventListener("click", goBookStep1);
    });

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const btn = (e.target as Element | null)?.closest(
        '[data-name="component.input.button"]'
      ) as HTMLElement | null;
      if (!btn) return;
      if (availBtns.includes(btn)) openAvail(e);
      else if (bookBtns.includes(btn)) goBookStep1(e);
    };
    screen.addEventListener("keydown", onKey);

    return () => {
      availBtns.forEach((btn) => btn.removeEventListener("click", openAvail));
      bookBtns.forEach((btn) => btn.removeEventListener("click", goBookStep1));
      screen.removeEventListener("keydown", onKey);
    };
  }, [current, loggedInFlag]);

  // PDP (child 8) — "Quick Sign In" / "Create Boots Account" links → login popup
  useEffect(() => {
    if (SCREENS[current]?.childIndex !== 8) return;
    const screen = document.querySelector(
      ".studio-viewport > div > div:nth-child(8)"
    ) as HTMLElement | null;
    if (!screen) return;

    const links = Array.from(screen.querySelectorAll<HTMLElement>("p")).filter((p) => {
      const text = p.textContent?.trim() ?? "";
      return text === "Quick Sign In" || text === "Create Boots Account";
    });

    // Find the narrow container: the element that holds "Boots Account will be required" + the two links
    const reqText = Array.from(screen.querySelectorAll<HTMLElement>("p")).find((p) =>
      p.textContent?.includes("Boots Account will be required")
    );
    const loginBlock = reqText?.parentElement;

    // Wire "Vaccination" breadcrumb to navigate to PLP
    const vacCrumb = screen.querySelector<HTMLElement>('[data-studio-crumb="vaccination"]');
    const onVacCrumb = (e: Event) => { e.preventDefault(); setCurrent(INDEX_PLP); };
    if (vacCrumb) {
      vacCrumb.style.cursor = "pointer";
      vacCrumb.addEventListener("click", onVacCrumb);
    }

    // Hide only that block when logged in
    if (isHeaderLoggedIn() && loginBlock) {
      (loginBlock as HTMLElement).style.display = "none";
      return () => { if (vacCrumb) vacCrumb.removeEventListener("click", onVacCrumb); };
    }
    if (loginBlock) (loginBlock as HTMLElement).style.display = "";

    const openLogin = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      const text = (e.currentTarget as HTMLElement).textContent?.trim() ?? "";
      setLoginPopupTab(text === "Create Boots Account" ? "create" : "signin");
      setLoginPopupOpen(true);
    };

    links.forEach((link) => {
      link.style.cursor = "default";
      link.addEventListener("click", openLogin);
    });

    return () => {
      links.forEach((link) => link.removeEventListener("click", openLogin));
      if (vacCrumb) vacCrumb.removeEventListener("click", onVacCrumb);
    };
  }, [current, loginPopupOpen, loggedInFlag]);

  // Wire wishlist heart icons on all pages
  useEffect(() => {
    const viewport = document.querySelector(".studio-viewport");
    if (!viewport) return;
    const hearts = viewport.querySelectorAll<HTMLElement>('[data-name="icon=add to wishlist"]');
    const handlers: Array<[HTMLElement, () => void]> = [];

    hearts.forEach((heart, i) => {
      // PDP / Quick View chickenpox heart uses PDP_WISHLIST_ID (cross-experience).
      if (heart.closest('[data-name="module.pdp.rtb"]')) return;

      const btn = heart.closest('[data-name="component.input.button"]') as HTMLElement | null;
      const target = btn || heart;
      const plpScreen = heart.closest(".studio-viewport > div > div:nth-child(9)");
      const tile = heart.closest('[data-name="boots-pharmacy.service.tile"]');
      let id = `vaccine-${i}`;
      if (tile && plpScreen) {
        const tiles = Array.from(
          plpScreen.querySelectorAll<HTMLElement>('[data-name="boots-pharmacy.service.tile"]')
        );
        const tileIndex = tiles.indexOf(tile as HTMLElement);
        if (tileIndex >= 0) id = plpTileWishlistId(tileIndex);
      }
      target.dataset.studioWishlistId = id;
      target.style.cursor = "pointer";

      // Set initial state
      if (isInWishlist(id)) {
        applyPlpTileHeartVisual(heart, true);
      }

      const handler = () => {
        const active = toggleWishlist(id);
        applyPlpTileHeartVisual(heart, active);
      };
      target.addEventListener("click", handler);
      handlers.push([target, handler]);
    });

    return () => { handlers.forEach(([el, h]) => el.removeEventListener("click", h)); };
  }, [current]);

  // Unified checkbox/radio click + init (PLP, PDP, Step 1, etc.)
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target;
      if (!(target instanceof HTMLElement)) return;
      handleProtoInputClick(target);
    };

    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
    };
  }, []);

  useEffect(() => {
    initProtoInputControls();
    initSearchFields();
    ensurePlpFiltersDefault(document);
    const plpFilters = document.querySelector('[data-name="module.plp.filters"]');
    if (plpFilters) initProtoInputControls(plpFilters);
    syncPlpListingFilters();
    syncPlpFiltersDirty();
  }, [current, syncPlpFiltersDirty]);

  useEffect(() => {
    const onPlpFiltersChange = () => syncPlpFiltersDirty();
    document.addEventListener(PLP_FILTERS_CHANGE_EVENT, onPlpFiltersChange);
    syncPlpFiltersDirty();
    return () => {
      document.removeEventListener(PLP_FILTERS_CHANGE_EVENT, onPlpFiltersChange);
    };
  }, [syncPlpFiltersDirty]);

  // Figma search rows — hide in-field clear (X) when value is empty / placeholder.
  useEffect(() => {
    const root = prototypeScrollElRef.current;
    if (!root) return;
    const run = () => {
      initSearchFields(root);
      syncFigmaSearchClearIcons(root);
    };
    run();
    const raf = requestAnimationFrame(run);
    const t = window.setTimeout(run, 0);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(t);
    };
  }, [current, chosenLocation, availabilityOpen]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (loginPopupOpen) setLoginPopupOpen(false);
      else if (quickViewOpen) closeQuickView();
      else if (recipientPickerOpen) closeRecipientPicker();
      else if (vaccinePickerOpen) closeVaccinePicker();
      else if (availabilityOpen) closeAvailabilityTool();
    };
    window.addEventListener("keydown", onKey);

    const popupOpen =
      availabilityOpen ||
      vaccinePickerOpen ||
      recipientPickerOpen ||
      loginPopupOpen ||
      quickViewOpen;
    const scrollEl = prototypeScrollElRef.current;

    if (popupOpen) {
      const prevBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      scrollEl?.classList.add("studio-scroll--locked");
      scrollEl?.setAttribute("data-studio-scroll-locked", "true");
      return () => {
        window.removeEventListener("keydown", onKey);
        document.body.style.overflow = prevBodyOverflow;
        scrollEl?.classList.remove("studio-scroll--locked");
        scrollEl?.removeAttribute("data-studio-scroll-locked");
      };
    }

    scrollEl?.classList.remove("studio-scroll--locked");
    scrollEl?.removeAttribute("data-studio-scroll-locked");
    return () => window.removeEventListener("keydown", onKey);
  }, [
    availabilityOpen,
    vaccinePickerOpen,
    recipientPickerOpen,
    loginPopupOpen,
    quickViewOpen,
    prototypeScrollElRef,
  ]);

  // PLP (child 9) — Quick View → RTB popup (PDP clone, no Check availability)
  useEffect(() => {
    if (SCREENS[current]?.childIndex !== 9) return;
    const screen = document.querySelector(
      ".studio-viewport > div > div:nth-child(9)"
    ) as HTMLElement | null;
    if (!screen) return;

    const isQuickViewBtn = (btn: HTMLElement | null): boolean =>
      !!btn &&
      btn.getAttribute("data-name") === "component.input.button" &&
      /quick view/i.test((btn.textContent ?? "").replace(/\s+/g, " ").trim());

    const openQv = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      if ("stopImmediatePropagation" in e) {
        (e as Event).stopImmediatePropagation();
      }
      openQuickView();
    };

    const quickViewBtns = Array.from(
      screen.querySelectorAll<HTMLElement>('[data-name="component.input.button"]')
    ).filter((btn) => isQuickViewBtn(btn));

    quickViewBtns.forEach((btn) => {
      btn.dataset.studioQuickView = "true";
      btn.setAttribute("role", "button");
      btn.tabIndex = 0;
      btn.style.cursor = "pointer";
      btn.addEventListener("click", openQv);
    });

    const onClick = (e: MouseEvent) => {
      const btn = (e.target as Element | null)?.closest(
        '[data-name="component.input.button"]'
      ) as HTMLElement | null;
      if (!isQuickViewBtn(btn)) return;
      openQv(e);
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const btn = (e.target as Element | null)?.closest(
        '[data-name="component.input.button"]'
      ) as HTMLElement | null;
      if (!isQuickViewBtn(btn)) return;
      openQv(e);
    };

    screen.addEventListener("click", onClick, true);
    screen.addEventListener("keydown", onKey);

    return () => {
      quickViewBtns.forEach((btn) => {
        delete btn.dataset.studioQuickView;
        btn.removeEventListener("click", openQv);
      });
      screen.removeEventListener("click", onClick, true);
      screen.removeEventListener("keydown", onKey);
    };
  }, [current, openQuickView]);

  // PLP (child 9) — all “Book now” CTAs → page 4 (PDP)
  useEffect(() => {
    if (SCREENS[current]?.childIndex !== 9) return;
    const screen = document.querySelector(
      ".studio-viewport > div > div:nth-child(9)"
    ) as HTMLElement | null;
    if (!screen) return;

    const goPdp = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      if ("stopImmediatePropagation" in e) {
        (e as Event).stopImmediatePropagation();
      }
      setCurrent(3); // PDP. Vaccine Details Page
    };

    const bookBtns = Array.from(
      screen.querySelectorAll<HTMLElement>('[data-name="component.input.button"]')
    ).filter((btn) => /^book now$/i.test((btn.textContent ?? "").trim()));

    bookBtns.forEach((btn) => {
      btn.setAttribute("role", "button");
      btn.tabIndex = 0;
      btn.style.cursor = "pointer";
      btn.addEventListener("click", goPdp);
    });

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const btn = (e.target as Element | null)?.closest(
        '[data-name="component.input.button"]'
      ) as HTMLElement | null;
      if (btn && bookBtns.includes(btn)) goPdp(e);
    };
    screen.addEventListener("keydown", onKey);

    return () => {
      bookBtns.forEach((btn) => btn.removeEventListener("click", goPdp));
      screen.removeEventListener("keydown", onKey);
    };
  }, [current]);

  // PLP (child 9) — tile titles → PDP
  useEffect(() => {
    if (SCREENS[current]?.childIndex !== 9) return;
    const screen = document.querySelector(
      ".studio-viewport > div > div:nth-child(9)"
    ) as HTMLElement | null;
    if (!screen) return;

    ensurePlpTileTitleLinks(screen);

    const goPdp = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      if ("stopImmediatePropagation" in e) {
        (e as Event).stopImmediatePropagation();
      }
      setCurrent(3); // PDP. Vaccine Details Page
    };

    const onClick = (e: MouseEvent) => {
      const link = (e.target as Element | null)?.closest(
        "a.proto-plp-tile-title-link"
      );
      if (!link || !screen.contains(link)) return;
      goPdp(e);
    };

    screen.addEventListener("click", onClick, true);
    return () => screen.removeEventListener("click", onClick, true);
  }, [current]);

  // Site Pilot Chat (child 10) — Frame337 microheader sticks below shared header.
  useEffect(() => {
    if (SCREENS[current]?.childIndex !== 10) return;

    const SCREEN2_CHILD = 10;
    let microHeader: HTMLElement | null = null;
    let raf = 0;

    const applySticky = () => {
      const screenDiv = document.querySelector(
        `.studio-viewport > div > div:nth-child(${SCREEN2_CHILD})`
      ) as HTMLElement | null;
      if (!screenDiv) return;

      // Frame337 is the second child (first is the native header, now hidden).
      microHeader = screenDiv.children[1] as HTMLElement;
      if (!microHeader) return;

      microHeader.dataset.studioStickyGroup = "true";
      Object.assign(microHeader.style, {
        position: "sticky",
        top: "var(--sticky-top, 64px)",
        zIndex: "40",
        width: "100%",
      });
    };

    raf = requestAnimationFrame(applySticky);

    return () => {
      cancelAnimationFrame(raf);
      if (!microHeader) return;
      delete microHeader.dataset.studioStickyGroup;
      microHeader.style.removeProperty("position");
      microHeader.style.removeProperty("top");
      microHeader.style.removeProperty("z-index");
      microHeader.style.removeProperty("width");
    };
  }, [current]);

  // Screen 5 (Book Appointment Step 1, child 7): search + “near me” — Make path only
  useEffect(() => {
    if (isBookStep1ReactMounted()) return;
    const screen = document.querySelector(
      ".studio-viewport > div > div:nth-child(7)"
    ) as HTMLElement | null;
    if (!screen) return;

    const searchBlock = Array.from(
      screen.querySelectorAll<HTMLElement>("[data-name='chosen location']")
    ).find(
      (el) =>
        !!el.querySelector("[data-name='component.input.field']") ||
        !!el.querySelector("[data-name='Text Field']")
    );

    const searchField =
      searchBlock?.querySelector<HTMLElement>("[data-name='component.input.field']") ??
      searchBlock?.querySelector<HTMLElement>("[data-name='Text Field']") ??
      screen.querySelector<HTMLElement>("[data-name='component.input.field']");

    const PAGE_SEARCH_PLACEHOLDER = "Search for City, Postcode, Location...";
    const searchLabel =
      searchField?.querySelector<HTMLElement>("[data-name='Text Field'] p") ??
      searchField?.querySelector<HTMLElement>("[data-name='wrapper'] p") ??
      null;
    // Initial scenario only — chosen-location slot hides this field
    if (searchLabel && !screen.querySelector(".proto-chosen-slot")) {
      searchLabel.textContent = PAGE_SEARCH_PLACEHOLDER;
      searchLabel.style.setProperty("font-weight", "400", "important");
      searchLabel.style.setProperty("color", "#5c5c5c", "important");
    }

    const nearMeBtn = Array.from(
      screen.querySelectorAll<HTMLElement>("[data-name='component.input.button']")
    ).find((b) => /available near me/i.test(b.textContent ?? ""));

    const openDefault = () => openPickLocations("list");
    const openNearMe = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      openPickLocations("nearMe");
    };

    if (searchField) {
      searchField.style.cursor = "pointer";
      searchField.addEventListener("click", openDefault);
    }
    if (nearMeBtn) {
      nearMeBtn.style.cursor = "pointer";
      nearMeBtn.addEventListener("click", openNearMe);
    }

    return () => {
      searchField?.removeEventListener("click", openDefault);
      nearMeBtn?.removeEventListener("click", openNearMe);
    };
  }, [current, chosenLocation]);

  // Footer on all screens with static Figma footers (replaces native DOM)
  useEffect(() => {
    setupFooters({
      onGoToPlp: () => goRef.current(INDEX_PLP),
    });
    wireIconHits();
  }, []);

  // My Account — Order → Appointment copy on Details + History pages
  useEffect(() => {
    for (const childIdx of [1, 2]) {
      const page = document.querySelector(
        `.studio-viewport > div > div:nth-child(${childIdx})`
      ) as HTMLElement | null;
      if (page) rewriteAccountAppointmentCopy(page);
    }
  }, [current]);

  // Tab 8 — Appointment History: realistic cards + title links → tab 9
  useEffect(() => {
    if (SCREENS[current]?.childIndex !== 2) return;
    const page = document.querySelector(
      ".studio-viewport > div > div:nth-child(2)"
    ) as HTMLElement | null;
    if (!page) return;

    let cleanup: (() => void) | undefined;
    const run = () => {
      cleanup?.();
      cleanup = syncAppointmentHistory(
        page,
        () => setCurrent(INDEX_APPOINTMENT_DETAILS),
        () => goSitePilotHome(APPOINTMENT_PILOT_QUERY),
        goSitePilotHome
      );
    };

    run();
    const raf = requestAnimationFrame(run);
    return () => {
      cancelAnimationFrame(raf);
      cleanup?.();
    };
  }, [current, goSitePilotHome]);

  // Tab 9 — Appointment Details: reflect selected list item
  useEffect(() => {
    if (SCREENS[current]?.childIndex !== 1) return;
    const page = document.querySelector(
      ".studio-viewport > div > div:nth-child(1)"
    ) as HTMLElement | null;
    if (!page) return;

    let cleanup: (() => void) | undefined;
    const run = () => {
      cleanup?.();
      const refundCleanup = syncAppointmentDetails(
        page,
        getSelectedAppointmentId(),
        goSitePilotHome
      );
      const breadcrumbCleanup = wireAppointmentDetailsBreadcrumbs(page, () =>
        setCurrent(INDEX_APPOINTMENT_HISTORY)
      );
      cleanup = () => {
        refundCleanup();
        breadcrumbCleanup();
      };
    };

    run();
    const raf = requestAnimationFrame(run);
    return () => {
      cancelAnimationFrame(raf);
      cleanup?.();
    };
  }, [current, goSitePilotHome]);

  // Location states on Book Appointment Step 1 (child 7) — Make path only.
  // React pilot owns chosen-location UI when mounted.
  useEffect(() => {
    if (isBookStep1ReactMounted()) return;
    const page5 = document.querySelector(
      ".studio-viewport > div > div:nth-child(7)"
    ) as HTMLElement | null;
    const page6 = document.querySelector(
      ".studio-viewport > div > div:nth-child(5)"
    ) as HTMLElement | null;
    if (!page5 || !page6) return;

    const searchBlock = Array.from(
      page5.querySelectorAll<HTMLElement>("[data-name='chosen location']")
    ).find(
      (el) =>
        !!el.querySelector("[data-name='component.input.field']") ||
        !!el.querySelector("[data-name='Text Field']")
    );
    const template = Array.from(
      page6.querySelectorAll<HTMLElement>("[data-name='chosen location']")
    ).find((el) => !!el.querySelector("[data-name='image 61']"));

    let slot = page5.querySelector<HTMLElement>(".proto-chosen-slot");

    type SlotWithMap = HTMLElement & { __protoChosenMapCleanup?: () => void };

    if (!chosenLocation || !searchBlock || !template) {
      if (searchBlock) {
        searchBlock.style.display = "";
        const label =
          searchBlock.querySelector<HTMLElement>("[data-name='Text Field'] p") ??
          searchBlock.querySelector<HTMLElement>("[data-name='wrapper'] p");
        if (label) {
          label.textContent = "Search for City, Postcode, Location...";
          label.style.setProperty("font-weight", "400", "important");
          label.style.setProperty("color", "#5c5c5c", "important");
        }
      }
      if (slot) {
        (slot as SlotWithMap).__protoChosenMapCleanup?.();
        slot.remove();
      }
      return;
    }

    searchBlock.style.display = "none";
    if (!slot) {
      slot = template.cloneNode(true) as HTMLElement;
      slot.classList.add("proto-chosen-slot");
      searchBlock.after(slot);
    }

    // Covent Garden map + SVG pin + clamped drag (same behavior as popup Map view)
    const mapWrap = slot.querySelector<HTMLElement>("[data-name='image 61']");
    const alt = `Map showing ${chosenLocation.name}`;

    const reopenPopup = () => {
      window.setTimeout(() => openPickLocations("list"), 0);
    };

    const pinReady = mapWrap?.querySelector(".proto-page-map-pin[role='button']");
    if (mapWrap && !pinReady) {
      (slot as SlotWithMap).__protoChosenMapCleanup?.();
      (slot as SlotWithMap).__protoChosenMapCleanup = setupChosenPageMap(
        mapWrap,
        locationsMapChosen,
        alt,
        { onPinClick: reopenPopup }
      );
    } else {
      const bg = mapWrap?.querySelector<HTMLImageElement>(".proto-chosen-map-bg");
      if (bg) bg.alt = alt;
    }

    // Hide the simple address + Change location row — replaced by full store card
    const legacyUnits = slot.querySelector<HTMLElement>(":scope > [data-name='units']");
    if (legacyUnits) legacyUnits.style.display = "none";

    // Full store card (same as popup) with Change location instead of Chosen CTA
    const popupOverlay = document.querySelector(
      ".studio-viewport > div > div:nth-child(6)"
    ) as HTMLElement | null;
    const popupStores = Array.from(
      popupOverlay?.querySelectorAll<HTMLElement>(
        "[data-name='boots-pharmacy.store']"
      ) ?? []
    ).filter(
      (s) =>
        s.dataset.studioOrphanStore !== "true" &&
        s.getAttribute("aria-hidden") !== "true"
    );
    // Prefer Covent Garden (non-demo) so we never clone an “Oxford Street” demo card
    const storeTemplate =
      popupStores.find(
        (s) =>
          !s.dataset.studioDemoStore &&
          /Covent Garden/i.test(extractStoreLocation(s).name)
      ) ??
      popupStores.find((s) => !s.dataset.studioDemoStore) ??
      popupStores[0] ??
      null;

    // Change location + edit icon — from Guide row, never Choose/Chosen Location
    const changeBtnTemplate =
      Array.from(
        (legacyUnits ?? slot).querySelectorAll<HTMLElement>(
          "[data-name='component.input.button']"
        )
      ).find((b) => /change location/i.test(b.textContent ?? "")) ??
      Array.from(
        page6.querySelectorAll<HTMLElement>("[data-name='component.input.button']")
      ).find((b) => /change location/i.test(b.textContent ?? "")) ??
      null;

    const editIconTemplate =
      changeBtnTemplate?.querySelector<HTMLElement>("[data-name='icon=edit']") ??
      page6.querySelector<HTMLElement>("[data-name='icon=edit']");

    const applyChangeLocationCta = (card: HTMLElement) => {
      const fromYou = Array.from(card.querySelectorAll("p")).find((p) =>
        /^from you$/i.test((p.textContent ?? "").trim())
      );
      // Frame165: parent of the From-you block (sits beside the CTA)
      const sideCol = fromYou?.parentElement?.parentElement ?? null;

      // Remove Choose / Chosen Location CTAs (keep Change location)
      card
        .querySelectorAll<HTMLElement>("[data-name='component.input.button']")
        .forEach((btn) => {
          if (
            btn.dataset.studioChangeLoc === "true" ||
            /change location/i.test(btn.textContent ?? "")
          ) {
            return;
          }
          if (/choos(e|en)\s*location/i.test(btn.textContent ?? "")) {
            btn.remove();
          }
        });

      let changeCta = card.querySelector<HTMLElement>(
        "[data-studio-change-loc='true']"
      );
      if (changeCta && /change location/i.test(changeCta.textContent ?? "")) {
        if (sideCol && changeCta.parentElement !== sideCol) {
          sideCol.appendChild(changeCta);
        }
        return changeCta;
      }
      changeCta?.remove();

      const mkChange = () => {
        if (changeBtnTemplate) {
          const btn = changeBtnTemplate.cloneNode(true) as HTMLElement;
          btn.dataset.studioChangeLoc = "true";
          btn.style.removeProperty("background");
          btn.className = btn.className.replace(/bg-\[[^\]]+\]/g, "");
          return btn;
        }
        const btn = document.createElement("div");
        btn.setAttribute("data-name", "component.input.button");
        btn.dataset.studioChangeLoc = "true";
        btn.className =
          "content-stretch flex gap-[8px] h-[32px] items-center justify-center px-[12px] py-[8px] relative rounded-[360px] shrink-0";
        if (editIconTemplate) {
          btn.appendChild(editIconTemplate.cloneNode(true));
        }
        const labelWrap = document.createElement("div");
        labelWrap.innerHTML =
          `<p class="leading-[16px]" style="color:#5c5c5c;font-family:Open Sans,sans-serif;font-size:12px;font-weight:600;">Change location</p>`;
        btn.appendChild(labelWrap);
        return btn;
      };

      changeCta = mkChange();
      if (sideCol) sideCol.appendChild(changeCta);
      else card.appendChild(changeCta);
      return changeCta;
    };

    // Single tile wraps map + store card (one border, no gap)
    let tile = slot.querySelector<HTMLElement>(":scope > .proto-chosen-tile");
    if (!tile && mapWrap) {
      tile = document.createElement("div");
      tile.className = "proto-chosen-tile";
      mapWrap.parentElement?.insertBefore(tile, mapWrap);
      tile.appendChild(mapWrap);
    }
    // Map may already exist but sit outside a tile from an older session
    if (tile && mapWrap && mapWrap.parentElement !== tile) {
      tile.insertBefore(mapWrap, tile.firstChild);
    }

    // Always rebuild the page store card — clears broken column layouts from prior runs
    tile?.querySelectorAll(".proto-chosen-store-card").forEach((el) => el.remove());
    slot
      .querySelectorAll(":scope > .proto-chosen-store-card")
      .forEach((el) => el.remove());
    let storeCard: HTMLElement | null = null;

    if (!storeCard && storeTemplate && tile) {
      storeCard = storeTemplate.cloneNode(true) as HTMLElement;
      storeCard.classList.add("proto-chosen-store-card");
      storeCard.dataset.studioChosenPageCard = "true";
      delete storeCard.dataset.studioSelected;
      delete storeCard.dataset.studioOrphanStore;
      delete storeCard.dataset.studioDemoStore;
      storeCard.removeAttribute("aria-hidden");
      storeCard.style.removeProperty("display");

      // White card — not the selected teal “Chosen” treatment
      storeCard.className = storeCard.className
        .replace(/bg-\[[^\]]+\]/g, "bg-white")
        .replace(/\bbg-\[#edf6f5\]\b/g, "bg-white");
      if (!/\bbg-white\b/.test(storeCard.className)) {
        storeCard.classList.add("bg-white");
      }
      storeCard.style.setProperty("background", "#ffffff", "important");

      tile.appendChild(storeCard);
    }

    if (storeCard) {
      applyChangeLocationCta(storeCard);

      // Store name = 18px title; never the distance figure (e.g. “0.6 km”)
      const title = Array.from(storeCard.querySelectorAll("p")).find((p) => {
        const t = (p.textContent ?? "").trim();
        if (/^\d+(\.\d+)?\s*(km|miles?)$/i.test(t)) return false;
        if (/from you|disabled access|location|contact/i.test(t)) return false;
        const parent = p.parentElement;
        return (
          parent?.className.includes("text-[18px]") ||
          (p.className.includes("leading-[28px]") &&
            parent?.className.includes("font-semibold"))
        );
      });
      if (title) title.textContent = chosenLocation.name;

      storeCard.querySelectorAll<HTMLElement>("[data-name='row']").forEach((row) => {
        const ps = Array.from(row.querySelectorAll("p"));
        if (ps[0] && /^Location$/i.test(ps[0].textContent?.trim() ?? "")) {
          if (ps[1]) ps[1].textContent = chosenLocation.address;
        }
      });

      wireStoreWorkingHours(slot);
      layoutStoreCardColumns(storeCard);
    }

    const changeBtn =
      storeCard?.querySelector<HTMLElement>(
        "[data-name='component.input.button'][data-studio-change-loc='true']"
      ) ??
      Array.from(
        slot.querySelectorAll<HTMLElement>("[data-name='component.input.button']")
      ).find((b) => /change location/i.test(b.textContent ?? ""));

    if (changeBtn) {
      changeBtn.style.cursor = "pointer";
      changeBtn.setAttribute("role", "button");
      changeBtn.tabIndex = 0;
    }

    const reopen = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      if ("stopImmediatePropagation" in e) {
        (e as Event).stopImmediatePropagation();
      }
      reopenPopup();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") reopen(e);
    };
    changeBtn?.addEventListener("click", reopen);
    changeBtn?.addEventListener("keydown", onKey);

    // Page card links: hours toggle only (no “Show on map” — map is embedded)
    const onCardLinks = (e: MouseEvent) => {
      const label = (e.target as Element | null)?.closest?.("p") as HTMLElement | null;
      if (!label || !storeCard?.contains(label)) return;
      const text = (label.textContent ?? "").trim();

      if (!/^(see|hide)\s+working\s+hours$/i.test(text)) return;
      e.preventDefault();
      e.stopPropagation();
      wireStoreWorkingHours(slot);
      const hours = findStoreHoursList(storeCard);
      const toggle = findStoreHoursToggle(storeCard) ?? label;
      if (!hours) return;
      const willOpen = storeCard.dataset.studioHoursOpen !== "true";
      storeCard.dataset.studioHoursOpen = willOpen ? "true" : "false";
      styleStoreHoursList(hours);
      setStoreHoursVisible(hours, willOpen);
      toggle.textContent = willOpen ? "Hide working hours" : "See working hours";
      styleStoreActionLink(toggle);
    };
    storeCard?.addEventListener("click", onCardLinks);

    // Drop any previously cloned checkbox duplicates under the location tile
    slot
      .querySelectorAll<HTMLElement>(":scope > .proto-chosen-checkbox")
      .forEach((el) => el.remove());

    return () => {
      changeBtn?.removeEventListener("click", reopen);
      changeBtn?.removeEventListener("keydown", onKey);
      storeCard?.removeEventListener("click", onCardLinks);
      // Keep map pan wired while slot remains; full cleanup when location cleared
    };
  }, [chosenLocation, current]);

  // Book Step 2 — date / time cells: hover + click selection (no Figma cursor demos)
  // Make path only — React pilot owns calendar interaction.
  useEffect(() => {
    if (SCREENS[current]?.childIndex !== 4) return;
    if (isBookStep2ReactMounted()) return;
    const screen = document.querySelector(
      ".studio-viewport > div > div:nth-child(4)"
    ) as HTMLElement | null;
    if (!screen) return;

    // Remove static “hand cursor” demo overlays from Figma
    screen
      .querySelectorAll<HTMLElement>('[data-name=".utility / cursor"]')
      .forEach((el) => el.remove());

    const monthRoots: { month: "June" | "July"; root: HTMLElement }[] = [];
    Array.from(screen.querySelectorAll("p")).forEach((p) => {
      const label = (p.textContent ?? "").trim();
      if (label !== "June" && label !== "July") return;
      const month = label as "June" | "July";
      let root: HTMLElement | null = p.parentElement;
      while (root && root !== screen) {
        const cells = root.querySelectorAll(
          '[data-name="calendar. date. cell"]'
        ).length;
        if (cells >= 20) {
          monthRoots.push({ month, root });
          break;
        }
        root = root.parentElement;
      }
    });

    const monthForCell = (cell: HTMLElement): "June" | "July" | null => {
      for (const { month, root } of monthRoots) {
        if (root.contains(cell)) return month;
      }
      return null;
    };

    const heading = Array.from(screen.querySelectorAll("p")).find((p) =>
      /^\w+,\s*\d{1,2}(st|nd|rd|th)\s+(June|July)\s+2026/i.test(
        (p.textContent ?? "").trim()
      )
    );

    const cells = Array.from(
      screen.querySelectorAll<HTMLElement>('[data-name="calendar. date. cell"]')
    );

    type CalMeta = {
      kind: "date" | "time";
      value: string;
      month?: "June" | "July";
    };
    const meta = new Map<HTMLElement, CalMeta>();

    cells.forEach((cell) => {
      const label = calCellLabel(cell);
      if (!label) return;
      stripCalCellChrome(cell);

      const isTime = /^\d{1,2}:\d{2}$/.test(label);
      const isDay = /^\d{1,2}$/.test(label);
      if (!isTime && !isDay) return;

      if (isDay) {
        const month = monthForCell(cell);
        if (month === "June" && label === "12") {
          cell.dataset.studioCalToday = "true";
          cell.setAttribute("title", TODAY_TOOLTIP);
          cell.setAttribute("aria-label", TODAY_TOOLTIP);
        }
      }

      if (calCellIsUnavailable(cell)) {
        cell.dataset.studioCalUnavailable = "true";
        delete cell.dataset.studioCalAvailable;
        cell.style.cursor = "default";
        cell.style.pointerEvents = "none";
        return;
      }

      cell.dataset.studioCalAvailable = "true";
      delete cell.dataset.studioCalUnavailable;
      cell.style.cursor = "pointer";
      cell.style.pointerEvents = "auto";
      cell.setAttribute("role", "button");
      cell.tabIndex = 0;

      if (isTime) {
        cell.dataset.studioCalKind = "time";
        cell.dataset.studioCalValue = label;
        meta.set(cell, { kind: "time", value: label });
        return;
      }

      const month = monthForCell(cell);
      if (!month) return;
      cell.dataset.studioCalKind = "date";
      cell.dataset.studioCalValue = label;
      cell.dataset.studioCalMonth = month;
      meta.set(cell, { kind: "date", value: label, month });
    });

    const clearSelected = (kind: "date" | "time") => {
      cells.forEach((cell) => {
        if (cell.dataset.studioCalKind !== kind) return;
        delete cell.dataset.studioCalSelected;
      });
    };

    const selectCell = (cell: HTMLElement) => {
      const m = meta.get(cell);
      if (!m || cell.dataset.studioCalUnavailable === "true") return;

      clearSelected(m.kind);
      cell.dataset.studioCalSelected = "true";

      if (m.kind === "date" && m.month) {
        const day = Number(m.value);
        if (Number.isFinite(day)) {
          if (heading) {
            heading.textContent = formatBookingDateHeading(m.month, day);
          }
          setChosenBookingSlot((prev) => ({ ...prev, month: m.month!, day }));
        }
        return;
      }

      if (m.kind === "time") {
        setChosenBookingSlot((prev) => ({ ...prev, time: m.value }));
      }
    };

    const onClick = (e: MouseEvent) => {
      const cell = (e.target as Element | null)?.closest(
        '[data-name="calendar. date. cell"]'
      ) as HTMLElement | null;
      if (!cell || !meta.has(cell)) return;
      if (cell.dataset.studioCalUnavailable === "true") return;
      e.preventDefault();
      e.stopPropagation();
      selectCell(cell);
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const cell = (e.target as Element | null)?.closest(
        '[data-name="calendar. date. cell"]'
      ) as HTMLElement | null;
      if (!cell || !meta.has(cell)) return;
      if (cell.dataset.studioCalUnavailable === "true") return;
      e.preventDefault();
      selectCell(cell);
    };

    screen.addEventListener("click", onClick);
    screen.addEventListener("keydown", onKey);

    return () => {
      screen.removeEventListener("click", onClick);
      screen.removeEventListener("keydown", onKey);
    };
  }, [current]);

  // Book Step 2 — Reserve Appointment → Step 3 Confirmation
  // Make path only — React pilot wires Reserve in-component.
  useEffect(() => {
    if (SCREENS[current]?.childIndex !== 4) return;
    if (isBookStep2ReactMounted()) return;
    const screen = document.querySelector(
      ".studio-viewport > div > div:nth-child(4)"
    ) as HTMLElement | null;
    if (!screen) return;

    const reserveBtns = Array.from(
      screen.querySelectorAll<HTMLElement>('[data-name="component.input.button"]')
    ).filter((btn) =>
      /^reserve appointment$/i.test(
        (btn.textContent ?? "").replace(/\s+/g, " ").trim()
      )
    );

    const goStep3 = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      if ("stopImmediatePropagation" in e) {
        (e as Event).stopImmediatePropagation();
      }
      const slot = readBookingSlotFromScreen(screen);
      if (slot) setChosenBookingSlot(slot);
      setCurrent(INDEX_BOOK_STEP3);
    };

    reserveBtns.forEach((btn) => {
      btn.setAttribute("role", "button");
      btn.tabIndex = 0;
      btn.style.cursor = "pointer";
      btn.addEventListener("click", goStep3);
    });

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const btn = (e.target as Element | null)?.closest(
        '[data-name="component.input.button"]'
      ) as HTMLElement | null;
      if (btn && reserveBtns.includes(btn)) goStep3(e);
    };
    screen.addEventListener("keydown", onKey);

    return () => {
      reserveBtns.forEach((btn) => btn.removeEventListener("click", goStep3));
      screen.removeEventListener("keydown", onKey);
    };
  }, [current]);

  // Book Step 3 — Advantage Card points block: rows left, card image right.
  // Make path only — React Step 3 owns Advantage layout in-component.
  useEffect(() => {
    if (SCREENS[current]?.childIndex !== 3) return;
    if (isBookStep3ReactMounted()) return;
    const screen = document.querySelector(
      ".studio-viewport > div > div:nth-child(3)"
    ) as HTMLElement | null;
    const summary = screen?.querySelector<HTMLElement>(
      '[data-name="component.appointment.summary"]'
    );
    if (!summary) return;

    const pointsLabel = Array.from(summary.querySelectorAll("p")).find((p) =>
      /^Points received$/i.test((p.textContent ?? "").trim())
    );
    if (!pointsLabel) return;

    let block = pointsLabel.parentElement as HTMLElement | null;
    while (block && block !== summary) {
      if (
        block.className.includes("c4dde3") &&
        block.className.includes("rounded-[16px]")
      ) {
        break;
      }
      block = block.parentElement as HTMLElement | null;
    }
    if (!block) return;

    const spendLabel = Array.from(summary.querySelectorAll("p")).find((p) =>
      /^Points to spend in store$/i.test((p.textContent ?? "").trim())
    );
    const receivedValue =
      pointsLabel.nextElementSibling?.textContent?.trim() ?? "450";
    const spendValue = spendLabel?.nextElementSibling?.textContent?.trim() ?? "1890";

    block.dataset.studioAdvantagePatched = "true";
    block.classList.add("proto-confirm-advantage");

    const inner = document.createElement("div");
    inner.className = "proto-confirm-advantage__inner";

    const rows = document.createElement("div");
    rows.className = "proto-confirm-advantage__rows";
    rows.innerHTML = `
      <span class="proto-confirm-advantage__label">Points received</span>
      <span class="proto-confirm-advantage__value">${receivedValue}</span>
      <span class="proto-confirm-advantage__label">Points to spend in store</span>
      <span class="proto-confirm-advantage__value">${spendValue}</span>
      <button type="button" class="proto-confirm-advantage__link proto-link">Open My Advantage Card details</button>
    `;

    const card = document.createElement("img");
    card.className = "proto-confirm-advantage__card";
    card.src = bootsAdvantageCard;
    card.alt = "My Advantage Card";
    card.decoding = "async";

    inner.append(rows, card);
    block.replaceChildren(inner);
  }, [current]);

  // Book Step 3 — Explore more vaccinations → PLP
  // Make path only — React Step 3 wires Explore in-component.
  useEffect(() => {
    if (SCREENS[current]?.childIndex !== 3) return;
    if (isBookStep3ReactMounted()) return;
    const screen = document.querySelector(
      ".studio-viewport > div > div:nth-child(3)"
    ) as HTMLElement | null;
    if (!screen) return;

    const exploreBtns = Array.from(
      screen.querySelectorAll<HTMLElement>('[data-name="component.input.button"]')
    ).filter((btn) =>
      /explore more/i.test((btn.textContent ?? "").replace(/\s+/g, " ").trim())
    );

    const goPlp = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      if ("stopImmediatePropagation" in e) {
        (e as Event).stopImmediatePropagation();
      }
      setCurrent(2); // PLP. Vaccinations
    };

    exploreBtns.forEach((btn) => {
      btn.setAttribute("role", "button");
      btn.tabIndex = 0;
      btn.style.cursor = "pointer";
      btn.addEventListener("click", goPlp);
    });

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const btn = (e.target as Element | null)?.closest(
        '[data-name="component.input.button"]'
      ) as HTMLElement | null;
      if (btn && exploreBtns.includes(btn)) goPlp(e);
    };
    screen.addEventListener("keydown", onKey);

    return () => {
      exploreBtns.forEach((btn) => btn.removeEventListener("click", goPlp));
      screen.removeEventListener("keydown", onKey);
    };
  }, [current]);

  // Book Step 3 — Open Appointments link → Appointment History (tab 8)
  // Make path only — React Step 3 owns `data-studio-open-appointment`.
  useEffect(() => {
    if (SCREENS[current]?.childIndex !== 3) return;
    if (isBookStep3ReactMounted()) return;
    const screen = document.querySelector(
      ".studio-viewport > div > div:nth-child(3)"
    ) as HTMLElement | null;
    const summary = screen?.querySelector<HTMLElement>(
      '[data-name="component.appointment.summary"]'
    );
    if (!summary) return;

    const exploreBtn = Array.from(
      summary.querySelectorAll<HTMLElement>('[data-name="component.input.button"]')
    ).find((btn) =>
      /explore more/i.test((btn.textContent ?? "").replace(/\s+/g, " ").trim())
    );
    const footer = exploreBtn?.parentElement?.parentElement;
    if (!footer) return;

    let openAppt = footer.querySelector<HTMLButtonElement>(
      '[data-studio-open-appointment="true"]'
    );
    if (!openAppt) {
      openAppt = document.createElement("button");
      openAppt.type = "button";
      openAppt.className = "proto-confirm-open-appointment";
      openAppt.dataset.studioOpenAppointment = "true";
      openAppt.setAttribute("aria-label", "Open Appointments");

      const icon = document.createElement("img");
      icon.className =
        "proto-secondary-cta-icon proto-confirm-open-appointment__icon";
      icon.src = iconArrowsSecondary;
      icon.alt = "";
      icon.width = 16;
      icon.height = 16;

      const label = document.createElement("span");
      label.textContent = "Open Appointments";

      openAppt.append(icon, label);
      footer.appendChild(openAppt);
    } else {
      openAppt.setAttribute("aria-label", "Open Appointments");
      const label = openAppt.querySelector("span");
      if (label) label.textContent = "Open Appointments";
    }

    const goHistory = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      setCurrent(studioTabToIndex(8));
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      if (e.target === openAppt) goHistory(e);
    };

    openAppt.addEventListener("click", goHistory);
    openAppt.addEventListener("keydown", onKey);

    return () => {
      openAppt?.removeEventListener("click", goHistory);
      openAppt?.removeEventListener("keydown", onKey);
    };
  }, [current]);

  // Book Step 2 (+ any screen with Location pill) — “Change” → location picker
  // Pill lives on Date/Time (child 4) in Frame191; Confirmation (child 3) has no Change.
  useEffect(() => {
    const childIndex = SCREENS[current]?.childIndex;
    if (childIndex !== 4 && childIndex !== 3) return;
    if (childIndex === 4 && isBookStep2ReactMounted()) return;
    const screen = document.querySelector(
      `.studio-viewport > div > div:nth-child(${childIndex})`
    ) as HTMLElement | null;
    if (!screen) return;

    const isLocationChangeBtn = (btn: HTMLElement | null): boolean => {
      if (!btn || btn.getAttribute("data-name") !== "component.input.button") {
        return false;
      }
      const label = (btn.textContent ?? "").replace(/\s+/g, " ").trim();
      // Pill CTA is “Change”; Step 1 card uses “Change location” (wired separately)
      if (!/^change$/i.test(label)) return false;
      // Scope to this pill card only — parent Frame191 also contains sibling pills
      const card =
        (btn.closest('[data-name="Week Schedule"]') as HTMLElement | null) ??
        btn.parentElement;
      if (!card) return false;
      return Array.from(card.querySelectorAll("p")).some((p) =>
        /^location$/i.test((p.textContent ?? "").trim())
      );
    };

    const openLocations = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      if ("stopImmediatePropagation" in e) {
        (e as Event).stopImmediatePropagation();
      }
      openPickLocations("list");
    };

    const locationChangeBtns = Array.from(
      screen.querySelectorAll<HTMLElement>('[data-name="component.input.button"]')
    ).filter((btn) => isLocationChangeBtn(btn));

    locationChangeBtns.forEach((btn) => {
      btn.setAttribute("role", "button");
      btn.tabIndex = 0;
      btn.style.cursor = "pointer";
      btn.dataset.studioLocChange = "true";
    });

    // Capture-phase so calendar / other screen handlers can’t swallow the click
    const onClick = (e: MouseEvent) => {
      const btn = (e.target as Element | null)?.closest(
        '[data-name="component.input.button"]'
      ) as HTMLElement | null;
      if (!isLocationChangeBtn(btn)) return;
      openLocations(e);
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const btn = (e.target as Element | null)?.closest(
        '[data-name="component.input.button"]'
      ) as HTMLElement | null;
      if (!isLocationChangeBtn(btn)) return;
      openLocations(e);
    };

    screen.addEventListener("click", onClick, true);
    screen.addEventListener("keydown", onKey);

    return () => {
      locationChangeBtns.forEach((btn) => delete btn.dataset.studioLocChange);
      screen.removeEventListener("click", onClick, true);
      screen.removeEventListener("keydown", onKey);
    };
  }, [current]);

  // Book Steps 1–3 — sync chosen vaccine label on summary rows
  useEffect(() => {
    const childIndices = [7, 4, 3];
    childIndices.forEach((childIndex) => {
      const screen = document.querySelector(
        `.studio-viewport > div > div:nth-child(${childIndex})`
      ) as HTMLElement | null;
      if (!screen) return;

      screen
        .querySelectorAll<HTMLElement>('[data-name="Week Schedule"]')
        .forEach((card) => {
          const label = Array.from(card.querySelectorAll("p")).find((p) =>
            /^vaccine$/i.test((p.textContent ?? "").trim())
          );
          if (!label) return;

          const row = label.parentElement;
          if (!row) return;

          Array.from(row.querySelectorAll("p")).forEach((p) => {
            if (p === label) return;
            if (/^change/i.test((p.textContent ?? "").trim())) return;
            if (
              /semibold|font-bold/.test(p.className) ||
              p.className.includes("Open_Sans:SemiBold")
            ) {
              p.textContent = chosenVaccine.name;
            }
          });
        });
    });
  }, [chosenVaccine, current]);

  // Book Steps 1–3 — sync chosen recipient label on summary rows
  useEffect(() => {
    const childIndices = [7, 4, 3];
    const label = recipientModeLabel(chosenRecipient);
    childIndices.forEach((childIndex) => {
      const screen = document.querySelector(
        `.studio-viewport > div > div:nth-child(${childIndex})`
      ) as HTMLElement | null;
      if (!screen) return;

      screen
        .querySelectorAll<HTMLElement>('[data-name="Week Schedule"]')
        .forEach((card) => {
          const rowLabel = Array.from(card.querySelectorAll("p")).find((p) =>
            /^recipient$/i.test((p.textContent ?? "").trim())
          );
          if (!rowLabel) return;

          const row = rowLabel.parentElement;
          if (!row) return;

          Array.from(row.querySelectorAll("p")).forEach((p) => {
            if (p === rowLabel) return;
            if (/^change/i.test((p.textContent ?? "").trim())) return;
            if (
              /semibold|font-bold/.test(p.className) ||
              p.className.includes("Open_Sans:SemiBold")
            ) {
              p.textContent = label;
            }
          });
        });
    });
  }, [chosenRecipient, current]);

  // Confirmation + Appointment pages — sync chosen date/time on summary rows
  useEffect(() => {
    const childIndices = [3, 2, 1];
    const value = formatBookingDateTimeLabel(chosenBookingSlot);
    childIndices.forEach((childIndex) => {
      const screen = document.querySelector(
        `.studio-viewport > div > div:nth-child(${childIndex})`
      ) as HTMLElement | null;
      if (!screen) return;

      screen
        .querySelectorAll<HTMLElement>('[data-name="Week Schedule"]')
        .forEach((card) => {
          const rowLabel = Array.from(card.querySelectorAll("p")).find((p) =>
            /^date$/i.test((p.textContent ?? "").trim())
          );
          if (!rowLabel) return;

          rowLabel.textContent = "Date and Time";

          const row = rowLabel.parentElement;
          if (!row) return;

          Array.from(row.querySelectorAll("p")).forEach((p) => {
            if (p === rowLabel) return;
            if (/^change/i.test((p.textContent ?? "").trim())) return;
            if (
              /semibold|font-bold/.test(p.className) ||
              p.className.includes("Open_Sans:SemiBold")
            ) {
              p.textContent = value;
            }
          });
        });

      screen.querySelectorAll<HTMLElement>('[data-name="row"]').forEach((row) => {
        const ps = Array.from(row.querySelectorAll("p"));
        const rowLabel = ps.find((p) =>
          /^appointment date$/i.test((p.textContent ?? "").trim())
        );
        if (!rowLabel) return;

        rowLabel.textContent = "Date and Time";
        const valueP = ps.find((p) => p !== rowLabel);
        if (valueP) valueP.textContent = value;
      });
    });
  }, [chosenBookingSlot, current]);

  // Book Steps 1–3 + Appointment Details — sync booster dose on summary rows
  useEffect(() => {
    const childIndices = [7, 4, 3, 1];
    const label = boosterDoseSummaryLabel(includeBoosterDose);
    childIndices.forEach((childIndex) => {
      const screen = document.querySelector(
        `.studio-viewport > div > div:nth-child(${childIndex})`
      ) as HTMLElement | null;
      if (!screen) return;

      screen
        .querySelectorAll<HTMLElement>('[data-name="Week Schedule"]')
        .forEach((card) => {
          const rowLabel = Array.from(card.querySelectorAll("p")).find((p) =>
            /^(booster dose|second dose)$/i.test((p.textContent ?? "").trim())
          );
          if (!rowLabel) return;

          const row = rowLabel.parentElement;
          if (!row) return;

          Array.from(row.querySelectorAll("p")).forEach((p) => {
            if (p === rowLabel) return;
            if (/^change/i.test((p.textContent ?? "").trim())) return;
            if (
              /semibold|font-bold/.test(p.className) ||
              p.className.includes("Open_Sans:SemiBold")
            ) {
              p.textContent = label;
            }
          });
        });
    });
  }, [includeBoosterDose, current]);

  // Confirmation + Appointment Details — order summary pricing from booster choice
  useEffect(() => {
    const pricingScreens: Array<{ childIndex: number; mode: "confirm" | "account" }> =
      [
        { childIndex: 3, mode: "confirm" },
        { childIndex: 1, mode: "account" },
      ];

    pricingScreens.forEach(({ childIndex, mode }) => {
      const screen = document.querySelector(
        `.studio-viewport > div > div:nth-child(${childIndex})`
      ) as HTMLElement | null;
      if (!screen) return;

      if (mode === "confirm") {
        if (isBookStep3ReactMounted()) return;
        const summary = screen.querySelector<HTMLElement>(
          '[data-name="component.co.order.summary"]'
        );
        if (summary) syncConfirmationOrderSummary(summary, includeBoosterDose);
        return;
      }

      const block = screen.querySelector<HTMLElement>(
        '[data-name="Info Blocks / Order Summary/NO"]'
      );
      if (block) syncAccountOrderSummary(block, includeBoosterDose);
    });
  }, [includeBoosterDose, current]);

  // Book Steps 1–2 — Vaccine row “Change” → vaccine picker popup
  useEffect(() => {
    const childIndex = SCREENS[current]?.childIndex;
    if (childIndex !== 7 && childIndex !== 4) return;
    // React Book Step 1 / Step 2 own Vaccine Change via props.
    if (childIndex === 7 && isBookStep1ReactMounted()) return;
    if (childIndex === 4 && isBookStep2ReactMounted()) return;

    const screen = document.querySelector(
      `.studio-viewport > div > div:nth-child(${childIndex})`
    ) as HTMLElement | null;
    if (!screen) return;

    const isVaccineChangeBtn = (btn: HTMLElement | null): boolean => {
      if (!btn || btn.getAttribute("data-name") !== "component.input.button") {
        return false;
      }
      if (!/^change$/i.test((btn.textContent ?? "").replace(/\s+/g, " ").trim())) {
        return false;
      }
      const card = btn.closest(
        '[data-name="Week Schedule"]'
      ) as HTMLElement | null;
      if (!card) return false;
      return Array.from(card.querySelectorAll("p")).some((p) =>
        /^vaccine$/i.test((p.textContent ?? "").trim())
      );
    };

    const openPicker = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      if ("stopImmediatePropagation" in e) {
        (e as Event).stopImmediatePropagation();
      }
      openVaccinePicker();
    };

    const changeBtns = Array.from(
      screen.querySelectorAll<HTMLElement>('[data-name="component.input.button"]')
    ).filter((btn) => isVaccineChangeBtn(btn));

    changeBtns.forEach((btn) => {
      btn.dataset.studioVaccineChange = "true";
      btn.style.cursor = "pointer";
      btn.setAttribute("role", "button");
      btn.tabIndex = 0;
      btn.addEventListener("click", openPicker);
    });

    const onClick = (e: MouseEvent) => {
      const btn = (e.target as Element | null)?.closest(
        '[data-name="component.input.button"]'
      ) as HTMLElement | null;
      if (!isVaccineChangeBtn(btn)) return;
      openPicker(e);
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const btn = (e.target as Element | null)?.closest(
        '[data-name="component.input.button"]'
      ) as HTMLElement | null;
      if (!isVaccineChangeBtn(btn)) return;
      openPicker(e);
    };

    screen.addEventListener("click", onClick, true);
    screen.addEventListener("keydown", onKey);

    return () => {
      changeBtns.forEach((btn) => {
        delete btn.dataset.studioVaccineChange;
        btn.removeEventListener("click", openPicker);
      });
      screen.removeEventListener("click", onClick, true);
      screen.removeEventListener("keydown", onKey);
    };
  }, [current]);

  // Book Steps 1–2 — Recipient row “Change” → recipient picker popup
  useEffect(() => {
    const childIndex = SCREENS[current]?.childIndex;
    if (childIndex !== 7 && childIndex !== 4) return;
    if (childIndex === 7 && isBookStep1ReactMounted()) return;
    if (childIndex === 4 && isBookStep2ReactMounted()) return;

    const screen = document.querySelector(
      `.studio-viewport > div > div:nth-child(${childIndex})`
    ) as HTMLElement | null;
    if (!screen) return;

    const isRecipientChangeBtn = (btn: HTMLElement | null): boolean => {
      if (!btn || btn.getAttribute("data-name") !== "component.input.button") {
        return false;
      }
      if (!/^change$/i.test((btn.textContent ?? "").replace(/\s+/g, " ").trim())) {
        return false;
      }
      const card = btn.closest(
        '[data-name="Week Schedule"]'
      ) as HTMLElement | null;
      if (!card) return false;
      return Array.from(card.querySelectorAll("p")).some((p) =>
        /^recipient$/i.test((p.textContent ?? "").trim())
      );
    };

    const openPicker = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      if ("stopImmediatePropagation" in e) {
        (e as Event).stopImmediatePropagation();
      }
      openRecipientPicker();
    };

    const changeBtns = Array.from(
      screen.querySelectorAll<HTMLElement>('[data-name="component.input.button"]')
    ).filter((btn) => isRecipientChangeBtn(btn));

    changeBtns.forEach((btn) => {
      btn.dataset.studioRecipientChange = "true";
      btn.style.cursor = "pointer";
      btn.setAttribute("role", "button");
      btn.tabIndex = 0;
      btn.addEventListener("click", openPicker);
    });

    const onClick = (e: MouseEvent) => {
      const btn = (e.target as Element | null)?.closest(
        '[data-name="component.input.button"]'
      ) as HTMLElement | null;
      if (!isRecipientChangeBtn(btn)) return;
      openPicker(e);
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const btn = (e.target as Element | null)?.closest(
        '[data-name="component.input.button"]'
      ) as HTMLElement | null;
      if (!isRecipientChangeBtn(btn)) return;
      openPicker(e);
    };

    screen.addEventListener("click", onClick, true);
    screen.addEventListener("keydown", onKey);

    return () => {
      changeBtns.forEach((btn) => {
        delete btn.dataset.studioRecipientChange;
        btn.removeEventListener("click", openPicker);
      });
      screen.removeEventListener("click", onClick, true);
      screen.removeEventListener("keydown", onKey);
    };
  }, [current]);

  // Book Step 2 — Step 1 progress column → back to Step 1 (Location)
  // Make path only — React Step 2 wires onBackToStep1 in-component.
  useEffect(() => {
    const childIndex = SCREENS[current]?.childIndex;

    // Confirmation — progress is read-only (no back-nav, all bars stay teal)
    // Make path only when React Step 3 owns progress.
    if (childIndex === 3) {
      if (isBookStep3ReactMounted()) return;
      const lockProgress = () => {
        const root = prototypeScrollElRef.current;
        const screen = root?.querySelector(
          ".studio-viewport > div > div:nth-child(3)"
        ) as HTMLElement | null;
        const progress = screen?.querySelector<HTMLElement>(
          '[data-name="component.book.appointment.progress"]'
        );
        if (!progress) return;

        Array.from(progress.children)
          .filter((n): n is HTMLElement => n instanceof HTMLElement)
          .forEach((col) => {
            delete col.dataset.studioBookStepBack;
            delete col.dataset.studioBookStepComplete;
            col.removeAttribute("role");
            col.removeAttribute("aria-label");
            col.tabIndex = -1;
            col.style.removeProperty("pointer-events");
            col.style.removeProperty("cursor");
            col.style.removeProperty("position");
            col.style.removeProperty("z-index");
            const bar = bookProgressBar(col);
            if (bar) markBookProgressCompleted(bar);
          });
        progress.style.pointerEvents = "none";
      };

      lockProgress();
      const raf = requestAnimationFrame(lockProgress);
      const t0 = window.setTimeout(lockProgress, 0);
      const t1 = window.setTimeout(lockProgress, 120);
      return () => {
        cancelAnimationFrame(raf);
        window.clearTimeout(t0);
        window.clearTimeout(t1);
      };
    }

    if (childIndex !== 4) return;
    if (isBookStep2ReactMounted()) return;

    let step1Col: HTMLElement | null = null;
    let progress: HTMLElement | null = null;

    const goBookStep1 = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      if ("stopImmediatePropagation" in e) {
        (e as Event).stopImmediatePropagation();
      }
      setCurrent(INDEX_BOOK_STEP1);
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      if (!step1Col) return;
      const target = e.target as Node | null;
      if (target && target !== step1Col && !step1Col.contains(target)) return;
      goBookStep1(e);
    };

    const onProgressClick = (e: MouseEvent) => {
      if (!step1Col) return;
      const target = e.target as Node | null;
      if (!target || !step1Col.contains(target)) return;
      goBookStep1(e);
    };

    const teardown = () => {
      if (step1Col) {
        delete step1Col.dataset.studioBookStepBack;
        delete step1Col.dataset.studioBookStepComplete;
        step1Col.removeAttribute("role");
        step1Col.removeAttribute("aria-label");
        step1Col.tabIndex = -1;
        step1Col.style.removeProperty("pointer-events");
        step1Col.style.removeProperty("cursor");
        step1Col.style.removeProperty("position");
        step1Col.style.removeProperty("z-index");
        step1Col.removeEventListener("keydown", onKey);
      }
      progress?.removeEventListener("click", onProgressClick, true);
    };

    const wire = () => {
      teardown();

      const root = prototypeScrollElRef.current;
      const screen = root?.querySelector(
        `.studio-viewport > div > div:nth-child(${childIndex})`
      ) as HTMLElement | null;
      if (!screen) return;

      progress = screen.querySelector<HTMLElement>(
        '[data-name="component.book.appointment.progress"]'
      );
      step1Col = findBookProgressCol(screen, /choose location/i);
      if (!step1Col || !progress) return;

      const step1Bar = bookProgressBar(step1Col);
      if (step1Bar) markBookProgressCompleted(step1Bar);

      step1Col.dataset.studioBookStepBack = "true";
      step1Col.setAttribute("role", "button");
      step1Col.setAttribute("aria-label", "Go back to Choose Location");
      step1Col.tabIndex = 0;
      step1Col.style.pointerEvents = "auto";
      step1Col.style.cursor = "pointer";
      step1Col.style.position = "relative";
      step1Col.style.zIndex = "2";
      progress.style.pointerEvents = "auto";

      step1Col.addEventListener("keydown", onKey);
      progress.addEventListener("click", onProgressClick, true);
    };

    wire();
    const raf = requestAnimationFrame(wire);
    const t0 = window.setTimeout(wire, 0);
    const t1 = window.setTimeout(wire, 120);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(t0);
      window.clearTimeout(t1);
      teardown();
    };
  }, [current]);

  // Book Step 1 — Continue (Make path only; React screen wires Continue in-component)
  useEffect(() => {
    if (SCREENS[current]?.childIndex !== 7) return;
    if (isBookStep1ReactMounted()) return;
    const screen = document.querySelector(
      ".studio-viewport > div > div:nth-child(7)"
    ) as HTMLElement | null;
    if (!screen) return;

    const continueBtns = Array.from(
      screen.querySelectorAll<HTMLElement>('[data-name="component.input.button"]')
    ).filter((btn) => /^continue$/i.test((btn.textContent ?? "").trim()));

    const onContinue = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      if ("stopImmediatePropagation" in e) {
        (e as Event).stopImmediatePropagation();
      }
      if (!chosenLocationRef.current) {
        openPickLocations("list", { locationRequired: true });
        return;
      }
      setCurrent(INDEX_BOOK_STEP2);
    };

    continueBtns.forEach((btn) => {
      btn.setAttribute("role", "button");
      btn.tabIndex = 0;
      btn.style.cursor = "pointer";
      btn.addEventListener("click", onContinue);
    });

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const btn = (e.target as Element | null)?.closest(
        '[data-name="component.input.button"]'
      ) as HTMLElement | null;
      if (btn && continueBtns.includes(btn)) onContinue(e);
    };
    screen.addEventListener("keydown", onKey);

    return () => {
      continueBtns.forEach((btn) => btn.removeEventListener("click", onContinue));
      screen.removeEventListener("keydown", onKey);
    };
  }, [current, chosenLocation]);

  // Book Appointment + PDP — wire shared booster checkbox (toggle → React state)
  useEffect(() => {
    const cleanups: Array<() => void> = [];

    const wireBoosterCheckbox = (
      screen: HTMLElement | null,
      options?: { isPdp?: boolean }
    ) => {
      if (!screen) return;

      const checkboxBlock = options?.isPdp
        ? (() => {
            const checkboxRow = screen.querySelector<HTMLElement>(
              "[data-name='component.input.checkbox']"
            );
            return checkboxRow?.closest<HTMLElement>("[data-name='units']") ?? null;
          })()
        : Array.from(
            screen.querySelectorAll<HTMLElement>("[data-name='units']")
          ).find((u) =>
            /Include booking (booster|second) dose/i.test(u.textContent ?? "")
          ) ?? null;

      if (!checkboxBlock) return;

      if (!options?.isPdp) {
        checkboxBlock.classList.add("proto-page-booster-checkbox");
        const labelP = checkboxBlock.querySelector<HTMLElement>(
          "[data-name='Label'] p"
        );
        if (labelP) labelP.textContent = PDP_CHECKBOX_LABEL;
      }

      const checkboxRow = checkboxBlock.querySelector<HTMLElement>(
        "[data-name='component.input.checkbox']"
      );
      if (!checkboxRow) return;

      markBoosterCheckboxRow(checkboxRow);
      ensureCheckboxRow(checkboxRow);
      checkboxRow.dataset.checkboxChecked = String(includeBoosterDose);

      const onToggle = () => {
        setIncludeBoosterDose((prev) => !prev);
      };
      checkboxRow.addEventListener("click", onToggle);
      cleanups.push(() => checkboxRow.removeEventListener("click", onToggle));
    };

    if (!isBookStep1ReactMounted()) {
      const page5 = document.querySelector(
        ".studio-viewport > div > div:nth-child(7)"
      ) as HTMLElement | null;
      page5
        ?.querySelectorAll<HTMLElement>(".proto-chosen-checkbox")
        .forEach((el) => el.remove());
      wireBoosterCheckbox(page5);
    }

    const pdpScreen = document.querySelector(
      ".studio-viewport > div > div:nth-child(8)"
    ) as HTMLElement | null;
    wireBoosterCheckbox(pdpScreen, { isPdp: true });

    return () => cleanups.forEach((fn) => fn());
  }, [current, chosenLocation]);

  // Book Appointment + PDP — reflect shared booster state in checkbox DOM
  useEffect(() => {
    const syncRow = (screen: HTMLElement | null, isPdp?: boolean) => {
      if (!screen) return;
      const checkboxRow = isPdp
        ? screen.querySelector<HTMLElement>("[data-name='component.input.checkbox']")
        : Array.from(screen.querySelectorAll<HTMLElement>("[data-name='units']"))
            .find((u) =>
              /Include booking (booster|second) dose/i.test(u.textContent ?? "")
            )
            ?.querySelector<HTMLElement>("[data-name='component.input.checkbox']") ?? null;
      if (checkboxRow) {
        checkboxRow.dataset.checkboxChecked = String(includeBoosterDose);
      }
    };

    syncRow(
      document.querySelector(
        ".studio-viewport > div > div:nth-child(7)"
      ) as HTMLElement | null
    );
    syncRow(
      document.querySelector(
        ".studio-viewport > div > div:nth-child(8)"
      ) as HTMLElement | null,
      true
    );
  }, [includeBoosterDose, current]);

  // PDP — keep checkbox section white; sync Book now price from shared booster state
  useEffect(() => {
    const screen = document.querySelector(
      ".studio-viewport > div > div:nth-child(8)"
    ) as HTMLElement | null;
    if (!screen) return;

    const checkboxRow = screen.querySelector<HTMLElement>(
      "[data-name='component.input.checkbox']"
    );
    if (checkboxRow) {
      checkboxRow.dataset.checkboxChecked = String(includeBoosterDose);

      const checkboxSection = checkboxRow.parentElement;
      if (checkboxSection) {
        checkboxSection.style.setProperty("background", "white", "important");
        checkboxSection.style.setProperty(
          "background-color",
          "white",
          "important"
        );
      }
      Array.from(checkboxSection?.children ?? []).forEach((child) => {
        if (child !== checkboxRow) {
          (child as HTMLElement).style?.setProperty(
            "background",
            "transparent",
            "important"
          );
        }
      });
    }

    const navyButton = screen.querySelector<HTMLElement>(
      "[data-name='component.input.button']"
    );
    const allSpans = navyButton
      ? Array.from(navyButton.querySelectorAll("span"))
      : [];
    const priceSpan = allSpans.length ? allSpans[allSpans.length - 1] : null;
    if (priceSpan) {
      priceSpan.textContent = String(
        includeBoosterDose ? PDP_PRICE_WITH_BOOSTER : PDP_PRICE_WITHOUT_BOOSTER
      );
    }
  }, [includeBoosterDose]);

  // Screen 4 (Deal Details, child 8): wire up the Myself / Someone else toggle.
  // We tag each tab with data-toggle-index so CSS can apply the correct 3-sided
  // border (no shared inner edge) to whichever tab is inactive.
  useEffect(() => {
    const screen = document.querySelector(
      ".studio-viewport > div > div:nth-child(8)"
    ) as HTMLElement | null;
    if (!screen) return;

    // Filter to only the two toggle pills (Units5 / Units6) — they are shrink-0
    // without w-full. Units7 (the checkbox container) has w-full and must be
    // excluded so it doesn't get data-toggle-index and interfere with bg rules.
    const tabs = Array.from(
      screen.querySelectorAll<HTMLElement>("[data-name='units']")
    ).filter((el) => !el.classList.contains("w-full"));
    if (tabs.length < 2) return;

    // Tag with stable index so CSS selectors can target each half independently
    tabs.forEach((tab, i) => {
      tab.dataset.toggleIndex = String(i);
      tab.style.cursor = "pointer";
      tab.style.transition = "background 0.18s ease, box-shadow 0.18s ease";
      tab.style.userSelect = "none";
    });

    const activate = (idx: number) => {
      tabs.forEach((t, i) => {
        if (i === idx) t.dataset.toggleActive = "true";
        else delete t.dataset.toggleActive;
      });
    };

    // Default: Myself (index 0) always active on mount/refresh.
    // rAF ensures the attribute is set after the browser's first paint so
    // the CSS transition fires cleanly and the state is never missed.
    activate(0);
    requestAnimationFrame(() => activate(0));

    const cleanup: (() => void)[] = [];
    tabs.forEach((tab, idx) => {
      const onClick = () => activate(idx);
      tab.addEventListener("click", onClick);
      cleanup.push(() => tab.removeEventListener("click", onClick));
    });

    return () => cleanup.forEach((fn) => fn());
  }, []);

  // Screen 4 (PDP): favourite heart — shared wishlist with Quick View + header flyout
  useEffect(() => {
    syncChickenpoxWishlistHearts();

    const screen = document.querySelector(
      ".studio-viewport > div > div:nth-child(8)"
    ) as HTMLElement | null;
    if (!screen) return;

    const favIcon = screen.querySelector<HTMLElement>("[data-name='icon=add to wishlist']");
    const favBtn = favIcon?.closest<HTMLElement>("[data-name='component.input.button']");
    if (!favBtn || !favIcon) return;

    applyWishlistHeartVisual(favIcon, isInWishlist(PDP_WISHLIST_ID));

    const toggle = () => {
      toggleWishlist(PDP_WISHLIST_ID);
    };

    favBtn.addEventListener("click", toggle);
    return () => favBtn.removeEventListener("click", toggle);
  }, [current, quickViewOpen]);

  const { label, childIndex } = SCREENS[current];
  const isScreen1 = childIndex === 11 && !hubOpen;
  const isScreenChat = childIndex === 10 && !hubOpen;
  // Agentic home only — chat scrolls in the prototype scroller; overflow:hidden breaks sticky Site Pilot bar.
  const isViewportLocked = isScreen1;
  const navLabel = hubOpen ? HUB_LABEL : label;
  const activeChildIndex = hubOpen ? null : childIndex;
  const popupOnScreen = (...allowed: number[]) =>
    activeChildIndex != null && allowed.includes(activeChildIndex);

  /**
   * Sticky footer: active screen is at least the scroll-area height; footers use
   * margin-top:auto so they sit on the viewport bottom when content is short.
   * Screen 1 (Agentic home) also uses height:100% so the body fills without a seam.
   */
  const dynamicCSS = `
    /* Flex column fill chain — footer sticks even when browser zoom changes */
    .studio-scroll--prototype:not(.hidden) {
      display: flex !important;
      flex-direction: column !important;
    }

    .studio-scroll--prototype > .studio-viewport {
      flex: 1 1 auto !important;
      display: flex !important;
      flex-direction: column !important;
      min-height: ${isViewportLocked ? "0" : "var(--studio-scroll-min-px, 100%)"} !important;
      ${isViewportLocked ? "height: 100% !important;" : ""}
    }

    /* Frame219 root — override size-full (height:100% breaks % chain when zoomed) */
    .studio-viewport > div {
      flex: 1 1 auto !important;
      display: flex !important;
      flex-direction: column !important;
      height: ${isViewportLocked ? "100%" : "auto"} !important;
      min-height: ${isViewportLocked ? "0" : "var(--studio-scroll-min-px, 100%)"} !important;
      width: 100% !important;
    }

    /* Hide all screens */
    .studio-viewport > div > div {
      display: none !important;
    }

    /* Active screen: pull into normal flow, full-width */
    .studio-viewport > div > div:nth-child(${childIndex}) {
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      position: static !important;
      width: 100% !important;
      min-width: 1200px !important;
      max-width: unset !important;
      left: auto !important;
      top: auto !important;
      height: ${isViewportLocked ? "100%" : "auto"} !important;
      min-height: ${isViewportLocked ? "0" : "var(--studio-scroll-min-px, 100%)"} !important;
      flex: 1 1 auto !important;
      overflow: ${isViewportLocked ? "hidden" : "visible"} !important;
      overflow-x: ${isViewportLocked ? "hidden" : "visible"} !important;
      overflow-y: ${isViewportLocked ? "hidden" : "visible"} !important;
    }

    ${
      isViewportLocked
        ? `
    .studio-scroll--prototype > .studio-viewport {
      min-height: 0 !important;
      height: 100% !important;
    }
    .studio-viewport > div {
      min-height: 0 !important;
      height: 100% !important;
    }
    `
        : ""
    }

    /* Push footer to the bottom when the page is shorter than the viewport */
    .studio-viewport > div > div:nth-child(${childIndex}) > .proto-footer-mount,
    .studio-viewport > div > div:nth-child(${childIndex}) > [data-name="boots.phm.module.footer"],
    .studio-viewport > div > div:nth-child(${childIndex}) > [data-name="boots-pharmacy.module.footer"],
    .studio-viewport > div > div:nth-child(${childIndex}) > [data-name="module.footer"] {
      margin-top: auto !important;
      flex-shrink: 0 !important;
    }

    /*
     * Some screens hardcode w-[1440px] on the header/footer instead of w-full.
     * Override all of them to stretch full-width for the active screen.
     */
    .studio-viewport > div > div:nth-child(${childIndex}) [data-name="boots-pharmacy.module.header"],
    .studio-viewport > div > div:nth-child(${childIndex}) [data-name="boots.phm.module.footer"],
    .studio-viewport > div > div:nth-child(${childIndex}) [data-name="boots-pharmacy.module.footer"],
    .studio-viewport > div > div:nth-child(${childIndex}) [data-name="module.footer"],
    .studio-viewport > div > div:nth-child(${childIndex}) [data-name="module.breadcrumbs"],
    .studio-viewport > div > div:nth-child(${childIndex}) [data-name="boots.phm.module.footer.copyright"],
    .studio-viewport > div > div:nth-child(${childIndex}) > .proto-footer-mount,
    .studio-viewport > div > div:nth-child(${childIndex}) .proto-footer {
      width: 100% !important;
      min-width: 1200px !important;
    }

    /*
     * Screen 1 height chain:
     * viewportRef (flex-1, computed height H)
     *   .studio-viewport (height: 100% = H)
     *     Frame219 root (height: 100% = H)
     *       screen-1 div (height: 100% = H)
     *         header (sticky, ~66px)
     *         body (flex: 1, fills remaining H - 66px)
     *           inner wrappers (height: 100% of body)
     *             gradient image (position: absolute, inset: 0, fills inner)
     *
     * No min-height: 100vh — that would exceed the viewport and add a scrollbar.
     * overflow-y: auto on viewportRef means a scrollbar only appears if the
     * viewport is shrunk until the content no longer fits.
     */
    .studio-viewport > div > div:nth-child(11) > [data-name="body"] {
      flex: 1 1 auto !important;
      width: 100% !important;
      min-height: 0 !important;
      height: auto !important;
      align-self: stretch !important;
    }
    .studio-viewport > div > div:nth-child(11) > [data-name="body"] > div {
      height: 100% !important;
      min-height: 100% !important;
      flex: 1 !important;
      overflow: hidden !important;
    }
    .studio-viewport > div > div:nth-child(11) > [data-name="body"] > div > div {
      height: 100% !important;
      min-height: 100% !important;
    }

    /*
     * Screen 7 (child 5, FrameForUx) has a doubly-nested absolute wrapper:
     *   FrameForUx (absolute, h-[1909px]) → GuideStep (absolute, left-0, overflow-clip)
     * The outer override above flattens FrameForUx; this flattens GuideStep too.
     */
    .studio-viewport > div > div:nth-child(5) > [data-name="Guide. Step 8"] {
      position: static !important;
      width: 100% !important;
      height: auto !important;
      left: auto !important;
      top: auto !important;
      overflow: visible !important;
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
    }

    /* Search field on screen 5 gets a hover ring so the click affordance is clear */
    .studio-viewport > div > div:nth-child(7) [data-name='component.input.field']:hover [data-name='Text Field'] > [aria-hidden],
    .studio-viewport > div > div:nth-child(7) [data-name='component.input.field']:focus-within [data-name='Text Field'] > [aria-hidden] {
      border-color: #012169 !important;
      box-shadow: inset 0 0 0 2px #012169 !important;
    }

    /* GPS button beside the search field — scope the ::before circle so it doesn't
       bleed outside the button bounds (it's already correct; this prevents z-index
       stacking issues with the search row). */
    .studio-viewport > div > div:nth-child(7) [data-name="component.input.button"] {
      overflow: visible !important;
    }
  `;

  const headerLoggedIn = loggedInFlag || isHeaderLoggedIn();

  const wirePristine =
    !availabilityOpen &&
    !vaccinePickerOpen &&
    !recipientPickerOpen &&
    !quickViewOpen &&
    chosenLocation === null &&
    !homeQueryDirty &&
    !chatComposerDirty &&
    !plpFiltersDirty;

  useLayoutEffect(() => {
    if (!apiRef) return;
    apiRef.current = {
      availabilityOpen,
      availActiveStep,
      availIntent,
      vaccinePickerOpen,
      recipientPickerOpen,
      loginPopupOpen,
      quickViewOpen,
      loggedInFlag,
      headerLoggedIn,
      chosenLocation,
      homeQueryDirty,
      chatComposerDirty,
      plpFiltersDirty,
      wirePristine,
      closeAllPopups,
      saveHubScroll,
      savePrototypeScroll,
      resetPrototypeScroll,
      resetPrototype,
      resetWireInteractionState,
      openAvailabilityTool,
      closeAvailabilityTool,
      applyDemoLocation,
      syncBookStep2RetreatDefault,
      handleAvailabilityBookNow,
      handleAvailabilityStepChange,
      activeChildIndex,
      popupOnScreen,
      childIndex,
      label,
      navLabel,
      isViewportLocked,
      isScreen1,
      isScreenChat,
      dynamicCSS,
    };
  });

  useEffect(() => {
    onWireApiChange?.();
  }, [
    onWireApiChange,
    headerLoggedIn,
    availabilityOpen,
    availActiveStep,
    availIntent,
    vaccinePickerOpen,
    recipientPickerOpen,
    loginPopupOpen,
    quickViewOpen,
    loggedInFlag,
    chosenLocation,
    homeQueryDirty,
    chatComposerDirty,
    plpFiltersDirty,
    wirePristine,
    childIndex,
    label,
    navLabel,
    isViewportLocked,
    isScreen1,
    isScreenChat,
    dynamicCSS,
  ]);

  return (
    <>
      <style>{dynamicCSS}</style>
      <div
        ref={appContentRef}
        className="studio-app-content flex flex-1 min-h-0 w-full flex-col overflow-hidden bg-white"
        style={{ isolation: "isolate" }}
      >
        <div
          ref={hubScrollElRef}
          className={`proto-scroll min-h-0 flex-1 overflow-y-auto overflow-x-hidden w-full${
            hubOpen ? "" : " hidden"
          }`}
          onScroll={saveHubScroll}
        >
          <HubViewport onGoToTab={go} />
        </div>
        <div
          ref={prototypeScrollElRef}
          className={`proto-scroll studio-scroll--prototype min-h-0 flex-1 overflow-y-auto overflow-x-hidden w-full${
            hubOpen ? " hidden" : ""
          }`}
          onScroll={savePrototypeScroll}
        >
          <div
            className="studio-viewport w-full"
            style={{
              minHeight: isViewportLocked ? "0" : "100%",
              height: isViewportLocked ? "100%" : "auto",
            }}
          >
            <ProjectFrame />
          </div>
        </div>
      </div>

      <AvailabilityTool
        open={availabilityOpen && activeChildIndex != null}
        openIntent={availIntent}
        onClose={closeAvailabilityTool}
        onActiveStepChange={handleAvailabilityStepChange}
        onChooseLocation={(store) => {
          setChosenLocation({
            name: store.name,
            address: store.address,
            storeId: store.id,
          });
          closeAvailabilityTool();
        }}
        onBookNow={handleAvailabilityBookNow}
        loggedIn={loggedInFlag || isHeaderLoggedIn()}
        onOpenLogin={() => {
          setLoginPopupTab("signin");
          setLoginPopupOpen(true);
        }}
      />

      <VaccinePickerPopup
        open={vaccinePickerOpen && popupOnScreen(7, 4)}
        selectedId={chosenVaccine.id}
        onClose={closeVaccinePicker}
        onSelect={(vaccine: VaccineItem) => {
          setChosenVaccine({ id: vaccine.id, name: vaccine.bookLabel });
        }}
      />

      <RecipientPickerPopup
        open={recipientPickerOpen && popupOnScreen(7, 4)}
        selected={chosenRecipient}
        onClose={closeRecipientPicker}
        onSelect={setChosenRecipient}
      />

      <LoginPopup
        open={loginPopupOpen && activeChildIndex != null}
        initialTab={loginPopupTab}
        onClose={() => setLoginPopupOpen(false)}
        onSignIn={() => {
          setHeaderLoggedIn(true);
          setLoggedInFlag(true);
          if (SCREENS[current]?.childIndex === 11) {
            syncAgenticHomeHeading(true);
          }
        }}
      />

      <QuickViewPopup
        open={quickViewOpen && popupOnScreen(9)}
        includeBoosterDose={includeBoosterDose}
        loggedIn={loggedInFlag || isHeaderLoggedIn()}
        onClose={closeQuickView}
        onBookNow={onQuickViewBookNow}
        onViewDetails={onQuickViewViewDetails}
        onToggleBooster={() => setIncludeBoosterDose((prev) => !prev)}
        onOpenLogin={onQuickViewOpenLogin}
      />
    </>
  );
}