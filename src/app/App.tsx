import { useState, useRef, useEffect, useCallback } from "react";
import Frame219 from "@/imports/Frame1000007317/index";
import locationsMapChosen from "@/assets/locations-map-chosen.png";
import bootsAdvantageCard from "@/assets/boots-advantage-card.png";
import AvailabilityTool, {
  PROTO_TODAY_TOOLTIP,
  type AvailOpenIntent,
} from "@/app/AvailabilityTool";
import VaccinePickerPopup from "@/app/VaccinePickerPopup";
import RecipientPickerPopup, {
  recipientModeLabel,
  type RecipientMode,
} from "@/app/RecipientPickerPopup";
import ProtoNavChrome from "@/app/ProtoNavChrome";
import ProtoHubViewport from "@/app/ProtoHubViewport";
import { PROTO_HUB_LABEL, PROTO_SCREENS, protoTabToIndex } from "@/app/protoScreens";
import iconArrowsSecondary from "@/assets/avail/arrows-secondary.svg";
import type { VaccineItem } from "@/app/protoVaccineList";
import {
  setupChosenPageMap,
} from "@/app/protoMap";

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
const SCREENS = PROTO_SCREENS;

type ChosenLocation = { name: string; address: string; storeId?: string };

type ChosenVaccine = { id: string; name: string };

const DEFAULT_CHOSEN_VACCINE: ChosenVaccine = {
  id: "chickenpox",
  name: "Chickenpox / Varicella",
};

const DEFAULT_CHOSEN_RECIPIENT: RecipientMode = "myself";

/** Default Agentic home query — Reset hides while this is unchanged. */
const AGENTIC_HOME_QUERY_DEFAULT =
  "I need a full course of travel vaccinations for a three-week trip to Southeast Asia (Indonesia) starting next month, specifically looking to book and buy jabs as a bundle if possible.";

const AGENTIC_QUERY_LINE_PX = 24;
const AGENTIC_QUERY_MAX_LINES = 5;

/** Demo pharmacy for chat-driven availability shortcuts (Covent Garden). */
const AVAIL_DEMO_STORE = "covent";

const AVAIL_INTENT = {
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
  if (
    chosen.storeId === "covent" ||
    chosen.storeId === "strand" ||
    chosen.storeId === "piccadilly"
  ) {
    return chosen.storeId;
  }
  const name = chosen.name.toLowerCase();
  if (/covent|long acre/i.test(name)) return "covent";
  if (/strand/i.test(name)) return "strand";
  if (/piccadilly/i.test(name)) return "piccadilly";
  return AVAIL_DEMO_STORE;
}

/**
 * Location-gated availability intents:
 *   no location  → Find Pharmacy (start)
 *   has location → date / time (or no-slots) with chosen store
 */
function resolveAvailIntent(
  intent: AvailOpenIntent,
  chosen: ChosenLocation | null
): AvailOpenIntent {
  if (intent.pickLocation) return intent;
  if (intent.step === "start") return intent;

  if (!chosen) {
    if (
      intent.step === "date" ||
      intent.step === "time" ||
      intent.step === "list" ||
      intent.step === "map"
    ) {
      return AVAIL_INTENT.start;
    }
    return intent;
  }

  const storeId = mapChosenToAvailStoreId(chosen);

  if (intent.step === "date" || intent.step === "time") {
    return { ...intent, storeId };
  }

  if (intent.step === "list" || intent.step === "map") {
    return {
      step: "date",
      storeId,
      selectedDate: { month: "June", day: 24 },
    };
  }

  return intent;
}

/** Hug 1 line when empty; grow/shrink with wrapped lines; max 5 lines then scroll. */
function syncAgenticQueryHeight(ta: HTMLTextAreaElement) {
  const max = AGENTIC_QUERY_LINE_PX * AGENTIC_QUERY_MAX_LINES;
  // Collapse before measuring so height shrinks when lines are deleted.
  ta.style.setProperty("height", `${AGENTIC_QUERY_LINE_PX}px`, "important");
  ta.style.setProperty("min-height", `${AGENTIC_QUERY_LINE_PX}px`, "important");
  const next = Math.min(
    Math.max(ta.scrollHeight, AGENTIC_QUERY_LINE_PX),
    max
  );
  ta.style.setProperty("height", `${next}px`, "important");
  ta.style.setProperty(
    "overflow-y",
    next >= max ? "auto" : "hidden",
    "important"
  );
}

let protoStoreSeq = 0;

function ensureStoreId(store: HTMLElement): string {
  if (!store.dataset.protoStoreId) {
    store.dataset.protoStoreId = `loc-${++protoStoreSeq}`;
  }
  return store.dataset.protoStoreId;
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
  const marked = store.querySelector<HTMLElement>("[data-proto-hours-list='true']");
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
    ":scope > [data-name='component.input.button'], :scope > [data-proto-change-loc='true']"
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
    "[data-proto-change-loc='true']"
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
      template.dataset.protoHoursList = "true";
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
    hours.dataset.protoHoursList = "true";
    styleStoreHoursList(hours);
    // Re-assert hours stay in the address column after insert
    layoutStoreCardColumns(store);

    // Default collapsed on every card (including Figma’s pre-expanded one)
    if (store.dataset.protoHoursOpen == null) {
      store.dataset.protoHoursOpen = "false";
    }
    const open = store.dataset.protoHoursOpen === "true";
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
        store.dataset.protoChosenPageCard === "true"
      ) {
        mapLink.dataset.protoHideShowOnMap = "true";
        (mapLink as HTMLElement).style.display = "none";
      } else {
        styleStoreActionLink(mapLink as HTMLElement);
      }
    }
  });
}

const PROTO_UI_LEGACY_KEYS = [
  "boots-vaccine-proto-ui",
  "boots-vaccine-proto-ui-v2",
  "boots-vaccine-proto-ui-v3",
];
/** Persist global nav tab across refresh / Reset. */
const PROTO_NAV_KEY = "boots-vaccine-proto-nav";

/** Screen interaction defaults. Nav index is separate. */
const DEFAULT_PROTO_UI = {
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
  // so only [data-proto-cal-selected] can look bold.
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
  PROTO_UI_LEGACY_KEYS.forEach((k) => sessionStorage.removeItem(k));
}

function readInitialNavIndex(): number {
  // Drop legacy interaction snapshots; nav is persisted separately.
  clearProtoUiStorage();
  try {
    const raw = sessionStorage.getItem(PROTO_NAV_KEY);
    if (raw == null) return 0;
    const i = Number(raw);
    if (!Number.isFinite(i)) return 0;
    return Math.max(0, Math.min(SCREENS.length - 1, i));
  } catch {
    return 0;
  }
}

export default function App() {
  const [current, setCurrent] = useState(readInitialNavIndex);
  const [availabilityOpen, setAvailabilityOpen] = useState(false);
  const [availIntent, setAvailIntent] = useState<AvailOpenIntent>(
    AVAIL_INTENT.start
  );
  const [chosenLocation, setChosenLocation] = useState<ChosenLocation | null>(
    DEFAULT_PROTO_UI.chosenLocation
  );
  const [chosenVaccine, setChosenVaccine] = useState<ChosenVaccine>(
    DEFAULT_CHOSEN_VACCINE
  );
  const [vaccinePickerOpen, setVaccinePickerOpen] = useState(false);
  const [chosenRecipient, setChosenRecipient] = useState<RecipientMode>(
    DEFAULT_CHOSEN_RECIPIENT
  );
  const [recipientPickerOpen, setRecipientPickerOpen] = useState(false);
  /** Logo hub — blank standalone page (content TBD). */
  const [hubOpen, setHubOpen] = useState(false);
  /** True once the Agentic home query differs from the seeded default. */
  const [homeQueryDirty, setHomeQueryDirty] = useState(false);
  /** True once the Chat composer has any input. */
  const [chatComposerDirty, setChatComposerDirty] = useState(false);
  const hubScrollElRef = useRef<HTMLDivElement>(null);
  const prototypeScrollElRef = useRef<HTMLDivElement>(null);
  const hubScrollPosRef = useRef(0);
  const prototypeScrollPosRef = useRef(0);
  const tabsScrollRef = useRef<HTMLDivElement>(null);
  const tabBtnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const chosenLocationRef = useRef(chosenLocation);
  chosenLocationRef.current = chosenLocation;

  const openAvailabilityTool = (intent: AvailOpenIntent = AVAIL_INTENT.start) => {
    const resolved = resolveAvailIntent(intent, chosenLocationRef.current);
    setAvailIntent(resolved);
    setAvailabilityOpen(true);
  };
  const closeAvailabilityTool = () => setAvailabilityOpen(false);
  const openVaccinePicker = () => setVaccinePickerOpen(true);
  const closeVaccinePicker = () => setVaccinePickerOpen(false);
  const openRecipientPicker = () => setRecipientPickerOpen(true);
  const closeRecipientPicker = () => setRecipientPickerOpen(false);

  /** All former Locations-popup entry points → Availability Tool location screens. */
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

  /** Hide Reset when page states are already pristine (nav position ignored). */
  const isProtoPristine =
    !availabilityOpen &&
    !vaccinePickerOpen &&
    !recipientPickerOpen &&
    chosenLocation === null &&
    !homeQueryDirty &&
    !chatComposerDirty;

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
    if (prototypeScrollElRef.current) {
      prototypeScrollElRef.current.scrollTop = 0;
    }
  }, []);

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
    // Stay on the current nav screen; only wipe interaction / DOM state.
    try {
      sessionStorage.setItem(PROTO_NAV_KEY, String(current));
    } catch {
      /* ignore */
    }
    clearProtoUiStorage();
    window.location.reload();
  };

  // Remember global nav tab so refresh stays on the same screen
  useEffect(() => {
    try {
      sessionStorage.setItem(PROTO_NAV_KEY, String(current));
    } catch {
      /* ignore */
    }
  }, [current]);

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

  // Boots Pharmacy logo + breadcrumb “Home” → page 1 (Agentic Site Pilot Home)
  useEffect(() => {
    const root = prototypeScrollElRef.current;
    if (!root) return;

    const goHome = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      if ("stopImmediatePropagation" in e) {
        (e as Event).stopImmediatePropagation();
      }
      setAvailabilityOpen(false);
      setHubOpen(false);
      resetPrototypeScroll();
      setCurrent(0);
    };

    const onClick = (e: MouseEvent) => {
      const t = e.target as Element | null;
      if (!t || !root.contains(t)) return;

      if (t.closest('[data-name="boots-pharmacy"]')) {
        goHome(e);
        return;
      }

      const crumb = t.closest(
        "[data-name='component.breadcrumbs'] p, [data-name='component.breadcrumbs'] span"
      ) as HTMLElement | null;
      if (crumb && /^home$/i.test((crumb.textContent ?? "").trim())) {
        goHome(e);
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const t = e.target as Element | null;
      if (!t || !root.contains(t)) return;
      if (t.closest('[data-name="boots-pharmacy"]')) {
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

    root.addEventListener("click", onClick);
    root.addEventListener("keydown", onKey);
    return () => {
      root.removeEventListener("click", onClick);
      root.removeEventListener("keydown", onKey);
    };
  }, []);

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

  // Measure the total sticky header height after each screen switch so breadcrumbs
  // can dock precisely below it. On screen 2 the sticky group wraps both the nav
  // and the Site Pilot bar, so we measure that wrapper instead.
  useEffect(() => {
    const measure = () => {
      const active = document.querySelector(
        `.proto-viewport > div > div:nth-child(${SCREENS[current]?.childIndex ?? 11})`
      ) as HTMLElement | null;
      const group = active?.querySelector("[data-proto-sticky-group]") as HTMLElement | null;
      const header = active?.querySelector(
        "[data-name='boots-pharmacy.module.header']"
      ) as HTMLElement | null;
      const el = group ?? header;
      const h = el ? el.getBoundingClientRect().height : 64;
      document.documentElement.style.setProperty("--sticky-top", `${h}px`);
    };
    requestAnimationFrame(measure);
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [current]);

  // Book – Step 1 (child 7): current breadcrumb crumb → “Book Appointment”
  useEffect(() => {
    if (SCREENS[current]?.childIndex !== 7) return;
    const screen = document.querySelector(
      ".proto-viewport > div > div:nth-child(7)"
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
      ".proto-viewport > div > div:nth-child(11)"
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
      ta.placeholder = "Ask about health services…";
      prompt.replaceWith(ta);
    }

    const syncQueryDirty = () => {
      setHomeQueryDirty(ta!.value.trim() !== AGENTIC_HOME_QUERY_DEFAULT.trim());
    };
    const onQueryInput = () => {
      syncAgenticQueryHeight(ta!);
      syncQueryDirty();
    };
    syncAgenticQueryHeight(ta);
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
      ta?.removeEventListener("input", onQueryInput);
      card.removeEventListener("click", onCardClick);
      sendBtn?.removeEventListener("keydown", onSendKey);
    };
  }, [current]);

  // Agentic chat (child 10): composer matches home — textarea, mic/send, chip dynamics
  useEffect(() => {
    if (SCREENS[current]?.childIndex !== 10) return;
    const screen = document.querySelector(
      ".proto-viewport > div > div:nth-child(10)"
    ) as HTMLElement | null;
    // Bottom composer card (contains “Ask Boots SitePilot” / Next dialog options)
    const cards = Array.from(
      screen?.querySelectorAll<HTMLElement>(
        '[data-name="component.co.order.summary"]'
      ) ?? []
    );
    const card =
      cards.find((c) =>
        /ask boots sitepilot|next dialog options/i.test(c.textContent ?? "")
      ) ?? null;
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
      ta.placeholder = "Ask Boots SitePilot";
      prompt.replaceWith(ta);
    }

    const syncComposerDirty = () => {
      setChatComposerDirty(ta!.value.trim().length > 0);
    };
    const onComposerInput = () => {
      syncAgenticQueryHeight(ta!);
      syncComposerDirty();
    };
    syncAgenticQueryHeight(ta);
    syncComposerDirty();
    ta.addEventListener("input", onComposerInput);

    const sendBtn = Array.from(
      subtotal.querySelectorAll<HTMLElement>('[data-name="component.input.button"]')
    ).find((btn) => btn.querySelector('[data-name="glyph"]'));

    if (sendBtn) {
      sendBtn.classList.add("proto-agentic-send");
      sendBtn.className = sendBtn.className
        .replace(/bg-\[[^\]]+\]/g, "bg-[#012169]")
        .replace(/\bbg-white\b/g, "bg-[#012169]");
      if (!/bg-\[#012169\]/.test(sendBtn.className)) {
        sendBtn.classList.add("bg-[#012169]");
      }
      sendBtn.style.setProperty("background", "#012169", "important");
      sendBtn.setAttribute("role", "button");
      sendBtn.setAttribute("aria-label", "Send message");
      sendBtn.tabIndex = 0;
      sendBtn.querySelectorAll("svg path").forEach((path) => {
        path.setAttribute("fill", "#ffffff");
      });
    }

    const onCardClick = (e: MouseEvent) => {
      const t = e.target as Element | null;
      if (!t || !ta) return;

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
    return () => {
      ta?.removeEventListener("input", onComposerInput);
      card.removeEventListener("click", onCardClick);
    };
  }, [current]);

  // Agentic chat — product links → PDP; “Go to vaccines catalog” → PLP
  useEffect(() => {
    if (SCREENS[current]?.childIndex !== 10) return;
    const screen = document.querySelector(
      ".proto-viewport > div > div:nth-child(10)"
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
      setAvailabilityOpen(false);
      openPickLocations("list");
    };
    const openAvailability = (intent: AvailOpenIntent) => (e: Event) => {
      stop(e);
      openAvailabilityTool(intent);
    };

    /** Chat CTAs → availability tool step (allowlist). */
    const AVAIL_BTN_INTENT: Array<{ re: RegExp; intent: AvailOpenIntent }> = [
      { re: /^open availability checker tool$/i, intent: AVAIL_INTENT.start },
      {
        re: /^find available slots this week$/i,
        intent: AVAIL_INTENT.dateWeek,
      },
      {
        re: /^find available slots this weekend$/i,
        intent: AVAIL_INTENT.dateWeekend,
      },
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
      ".proto-viewport > div > div:nth-child(8)"
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
      setCurrent(4); // Book - Step 1 - Location
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
  }, [current]);

  // Escape closes popups; lock page scroll while either is open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (recipientPickerOpen) closeRecipientPicker();
      else if (vaccinePickerOpen) closeVaccinePicker();
      else if (availabilityOpen) closeAvailabilityTool();
    };
    window.addEventListener("keydown", onKey);
    if (availabilityOpen || vaccinePickerOpen || recipientPickerOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        window.removeEventListener("keydown", onKey);
        document.body.style.overflow = prev;
      };
    }
    return () => window.removeEventListener("keydown", onKey);
  }, [availabilityOpen, vaccinePickerOpen, recipientPickerOpen]);

  // PLP (child 9) — all “Book now” CTAs → page 4 (PDP)
  useEffect(() => {
    if (SCREENS[current]?.childIndex !== 9) return;
    const screen = document.querySelector(
      ".proto-viewport > div > div:nth-child(9)"
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

  // Screen 2 (Account Overview, child 10) has a Site Pilot microheader (Frame337)
  // that must stick together with the main nav as one unit.
  // Two separate sticky elements with offset `top` values scroll independently, so
  // we physically wrap both in a single sticky container via the DOM.
  // React won't touch Frame219's internals (no vDOM change), so this is safe.
  useEffect(() => {
    const SCREEN2_CHILD = 10;
    const screenDiv = document.querySelector(
      `.proto-viewport > div > div:nth-child(${SCREEN2_CHILD})`
    ) as HTMLElement | null;
    if (!screenDiv) return;

    const header = screenDiv.children[0] as HTMLElement;
    const microHeader = screenDiv.children[1] as HTMLElement;
    if (!header || !microHeader) return;

    const wrapper = document.createElement("div");
    wrapper.dataset.protoStickyGroup = "true";
    Object.assign(wrapper.style, {
      position: "sticky",
      top: "0",
      zIndex: "50",
      width: "100%",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
    });

    screenDiv.insertBefore(wrapper, header);
    wrapper.appendChild(header);
    wrapper.appendChild(microHeader);

    return () => {
      if (wrapper.parentNode === screenDiv) {
        screenDiv.insertBefore(header, wrapper);
        screenDiv.insertBefore(microHeader, wrapper);
        wrapper.remove();
      }
    };
  }, []);

  // Screen 5 (Book Appointment Step 1, child 7): search + “near me” open Locations popup.
  useEffect(() => {
    const screen = document.querySelector(
      ".proto-viewport > div > div:nth-child(7)"
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


  // Book Step 1 — reuse Step 2 light footer (hide Hire Equipment dark footer)
  useEffect(() => {
    const step1 = document.querySelector(
      ".proto-viewport > div > div:nth-child(7)"
    ) as HTMLElement | null;
    const step2 = document.querySelector(
      ".proto-viewport > div > div:nth-child(4)"
    ) as HTMLElement | null;
    if (!step1 || !step2) return;

    const sourceFooter = step2.querySelector<HTMLElement>(
      ':scope > [data-name="boots.phm.module.footer"]'
    );
    if (!sourceFooter) return;

    const oldFooter = step1.querySelector<HTMLElement>(
      ':scope > [data-name="module.footer"]'
    );
    if (oldFooter) {
      oldFooter.style.display = "none";
      oldFooter.dataset.protoFooterHidden = "true";
    }

    let cloned = step1.querySelector<HTMLElement>(":scope > .proto-step2-footer");
    if (!cloned) {
      cloned = sourceFooter.cloneNode(true) as HTMLElement;
      cloned.classList.add("proto-step2-footer");
      step1.appendChild(cloned);
    }
  }, []);

  // Account pages (Order Details + Order History) — reuse PLP footer
  useEffect(() => {
    const plp = document.querySelector(
      ".proto-viewport > div > div:nth-child(9)"
    ) as HTMLElement | null;
    if (!plp) return;

    const sourceFooter = plp.querySelector<HTMLElement>(
      ':scope > [data-name="boots-pharmacy.module.footer"]'
    );
    if (!sourceFooter) return;

    for (const childIdx of [1, 2]) {
      const page = document.querySelector(
        `.proto-viewport > div > div:nth-child(${childIdx})`
      ) as HTMLElement | null;
      if (!page) continue;

      page
        .querySelectorAll<HTMLElement>(
          ':scope > [data-name="boots.phm.module.footer"], :scope > [data-name="boots-pharmacy.module.footer"], :scope > [data-name="module.footer"]'
        )
        .forEach((footer) => {
          if (footer.classList.contains("proto-plp-footer")) return;
          footer.style.display = "none";
          footer.dataset.protoFooterHidden = "true";
        });

      let cloned = page.querySelector<HTMLElement>(":scope > .proto-plp-footer");
      if (!cloned) {
        cloned = sourceFooter.cloneNode(true) as HTMLElement;
        cloned.classList.add("proto-plp-footer");
        page.appendChild(cloned);
      }
    }
  }, []);

  // My Account — Order → Appointment copy on Details + History pages
  useEffect(() => {
    for (const childIdx of [1, 2]) {
      const page = document.querySelector(
        `.proto-viewport > div > div:nth-child(${childIdx})`
      ) as HTMLElement | null;
      if (page) rewriteAccountAppointmentCopy(page);
    }
  }, [current]);

  // Location states on Book Appointment Step 1 (child 7) — per original CJM:
  //   chosenLocation === null  → INITIAL: search placeholder + near-me
  //   chosenLocation set       → SELECTED: clone Guide map UI (child 5 template)
  // “Change location” reopens the Locations popup (child 6). Child 5 is never nav.
  useEffect(() => {
    const page5 = document.querySelector(
      ".proto-viewport > div > div:nth-child(7)"
    ) as HTMLElement | null;
    const page6 = document.querySelector(
      ".proto-viewport > div > div:nth-child(5)"
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
      ".proto-viewport > div > div:nth-child(6)"
    ) as HTMLElement | null;
    const popupStores = Array.from(
      popupOverlay?.querySelectorAll<HTMLElement>(
        "[data-name='boots-pharmacy.store']"
      ) ?? []
    ).filter(
      (s) =>
        s.dataset.protoOrphanStore !== "true" &&
        s.getAttribute("aria-hidden") !== "true"
    );
    // Prefer Covent Garden (non-demo) so we never clone an “Oxford Street” demo card
    const storeTemplate =
      popupStores.find(
        (s) =>
          !s.dataset.protoDemoStore &&
          /Covent Garden/i.test(extractStoreLocation(s).name)
      ) ??
      popupStores.find((s) => !s.dataset.protoDemoStore) ??
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
            btn.dataset.protoChangeLoc === "true" ||
            /change location/i.test(btn.textContent ?? "")
          ) {
            return;
          }
          if (/choos(e|en)\s*location/i.test(btn.textContent ?? "")) {
            btn.remove();
          }
        });

      let changeCta = card.querySelector<HTMLElement>(
        "[data-proto-change-loc='true']"
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
          btn.dataset.protoChangeLoc = "true";
          btn.style.removeProperty("background");
          btn.className = btn.className.replace(/bg-\[[^\]]+\]/g, "");
          return btn;
        }
        const btn = document.createElement("div");
        btn.setAttribute("data-name", "component.input.button");
        btn.dataset.protoChangeLoc = "true";
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
      storeCard.dataset.protoChosenPageCard = "true";
      delete storeCard.dataset.protoSelected;
      delete storeCard.dataset.protoOrphanStore;
      delete storeCard.dataset.protoDemoStore;
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

      // Store name = 18px title; never the “0.4 Miles” figure
      const title = Array.from(storeCard.querySelectorAll("p")).find((p) => {
        const t = (p.textContent ?? "").trim();
        if (/^\d+(\.\d+)?\s*miles?$/i.test(t)) return false;
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
        "[data-name='component.input.button'][data-proto-change-loc='true']"
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
      const willOpen = storeCard.dataset.protoHoursOpen !== "true";
      storeCard.dataset.protoHoursOpen = willOpen ? "true" : "false";
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
  useEffect(() => {
    if (SCREENS[current]?.childIndex !== 4) return;
    const screen = document.querySelector(
      ".proto-viewport > div > div:nth-child(4)"
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
          cell.dataset.protoCalToday = "true";
          cell.setAttribute("title", PROTO_TODAY_TOOLTIP);
          cell.setAttribute("aria-label", PROTO_TODAY_TOOLTIP);
        }
      }

      if (calCellIsUnavailable(cell)) {
        cell.dataset.protoCalUnavailable = "true";
        delete cell.dataset.protoCalAvailable;
        cell.style.cursor = "default";
        cell.style.pointerEvents = "none";
        return;
      }

      cell.dataset.protoCalAvailable = "true";
      delete cell.dataset.protoCalUnavailable;
      cell.style.cursor = "pointer";
      cell.style.pointerEvents = "auto";
      cell.setAttribute("role", "button");
      cell.tabIndex = 0;

      if (isTime) {
        cell.dataset.protoCalKind = "time";
        cell.dataset.protoCalValue = label;
        meta.set(cell, { kind: "time", value: label });
        return;
      }

      const month = monthForCell(cell);
      if (!month) return;
      cell.dataset.protoCalKind = "date";
      cell.dataset.protoCalValue = label;
      cell.dataset.protoCalMonth = month;
      meta.set(cell, { kind: "date", value: label, month });
    });

    const clearSelected = (kind: "date" | "time") => {
      cells.forEach((cell) => {
        if (cell.dataset.protoCalKind !== kind) return;
        delete cell.dataset.protoCalSelected;
      });
    };

    const selectCell = (cell: HTMLElement) => {
      const m = meta.get(cell);
      if (!m || cell.dataset.protoCalUnavailable === "true") return;

      clearSelected(m.kind);
      cell.dataset.protoCalSelected = "true";

      if (m.kind === "date" && m.month && heading) {
        const day = Number(m.value);
        if (Number.isFinite(day)) {
          heading.textContent = formatBookingDateHeading(m.month, day);
        }
      }
    };

    // Defaults from Figma: 24 June chosen, 16:30 chosen
    const initialDate =
      cells.find(
        (c) =>
          c.dataset.protoCalKind === "date" &&
          c.dataset.protoCalMonth === "June" &&
          c.dataset.protoCalValue === "24"
      ) ?? null;
    const initialTime =
      cells.find(
        (c) =>
          c.dataset.protoCalKind === "time" &&
          c.dataset.protoCalValue === "16:30"
      ) ?? null;
    if (initialDate) selectCell(initialDate);
    if (initialTime) selectCell(initialTime);

    const onClick = (e: MouseEvent) => {
      const cell = (e.target as Element | null)?.closest(
        '[data-name="calendar. date. cell"]'
      ) as HTMLElement | null;
      if (!cell || !meta.has(cell)) return;
      if (cell.dataset.protoCalUnavailable === "true") return;
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
      if (cell.dataset.protoCalUnavailable === "true") return;
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
  useEffect(() => {
    if (SCREENS[current]?.childIndex !== 4) return;
    const screen = document.querySelector(
      ".proto-viewport > div > div:nth-child(4)"
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
      setCurrent(6); // Book - Step 3 - Confirmation
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
  useEffect(() => {
    if (SCREENS[current]?.childIndex !== 3) return;
    const screen = document.querySelector(
      ".proto-viewport > div > div:nth-child(3)"
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

    block.dataset.protoAdvantagePatched = "true";
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
  useEffect(() => {
    if (SCREENS[current]?.childIndex !== 3) return;
    const screen = document.querySelector(
      ".proto-viewport > div > div:nth-child(3)"
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

  // Book Step 3 — Open Appointment icon+link → tab 9 (Appointment Details)
  useEffect(() => {
    if (SCREENS[current]?.childIndex !== 3) return;
    const screen = document.querySelector(
      ".proto-viewport > div > div:nth-child(3)"
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
      '[data-proto-open-appointment="true"]'
    );
    if (!openAppt) {
      openAppt = document.createElement("button");
      openAppt.type = "button";
      openAppt.className = "proto-confirm-open-appointment";
      openAppt.dataset.protoOpenAppointment = "true";
      openAppt.setAttribute("aria-label", "Open Appointment");

      const icon = document.createElement("img");
      icon.className =
        "proto-secondary-cta-icon proto-confirm-open-appointment__icon";
      icon.src = iconArrowsSecondary;
      icon.alt = "";
      icon.width = 16;
      icon.height = 16;

      const label = document.createElement("span");
      label.textContent = "Open Appointment";

      openAppt.append(icon, label);
      footer.appendChild(openAppt);
    }

    const goDetails = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      setCurrent(protoTabToIndex(9));
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      if (e.target === openAppt) goDetails(e);
    };

    openAppt.addEventListener("click", goDetails);
    openAppt.addEventListener("keydown", onKey);

    return () => {
      openAppt?.removeEventListener("click", goDetails);
      openAppt?.removeEventListener("keydown", onKey);
    };
  }, [current]);

  // Book Step 2 (+ any screen with Location pill) — “Change” → location picker
  // Pill lives on Date/Time (child 4) in Frame191; Confirmation (child 3) has no Change.
  useEffect(() => {
    const childIndex = SCREENS[current]?.childIndex;
    if (childIndex !== 4 && childIndex !== 3) return;
    const screen = document.querySelector(
      `.proto-viewport > div > div:nth-child(${childIndex})`
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
      btn.dataset.protoLocChange = "true";
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
      locationChangeBtns.forEach((btn) => delete btn.dataset.protoLocChange);
      screen.removeEventListener("click", onClick, true);
      screen.removeEventListener("keydown", onKey);
    };
  }, [current]);

  // Book Steps 1–3 — sync chosen vaccine label on summary rows
  useEffect(() => {
    const childIndices = [7, 4, 3];
    childIndices.forEach((childIndex) => {
      const screen = document.querySelector(
        `.proto-viewport > div > div:nth-child(${childIndex})`
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
        `.proto-viewport > div > div:nth-child(${childIndex})`
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

  // Book Steps 1–2 — Vaccine row “Change” → vaccine picker popup
  useEffect(() => {
    const childIndex = SCREENS[current]?.childIndex;
    if (childIndex !== 7 && childIndex !== 4) return;

    const screen = document.querySelector(
      `.proto-viewport > div > div:nth-child(${childIndex})`
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
      btn.dataset.protoVaccineChange = "true";
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
        delete btn.dataset.protoVaccineChange;
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

    const screen = document.querySelector(
      `.proto-viewport > div > div:nth-child(${childIndex})`
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
      btn.dataset.protoRecipientChange = "true";
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
        delete btn.dataset.protoRecipientChange;
        btn.removeEventListener("click", openPicker);
      });
      screen.removeEventListener("click", onClick, true);
      screen.removeEventListener("keydown", onKey);
    };
  }, [current]);

  // Book Steps 2–3 — entire Step 1 progress column → back to Step 1 (Location)
  useEffect(() => {
    const childIndex = SCREENS[current]?.childIndex;
    if (childIndex !== 4 && childIndex !== 3) return;

    const screen = document.querySelector(
      `.proto-viewport > div > div:nth-child(${childIndex})`
    ) as HTMLElement | null;
    if (!screen) return;

    const progress = screen.querySelector<HTMLElement>(
      '[data-name="component.book.appointment.progress"]'
    );
    const step1Col = progress?.firstElementChild;
    if (!(step1Col instanceof HTMLElement)) return;

    const goBookStep1 = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      setCurrent(4); // Book - Step 1 - Location
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      goBookStep1(e);
    };

    step1Col.dataset.protoBookStepBack = "true";
    step1Col.setAttribute("role", "button");
    step1Col.setAttribute("aria-label", "Go back to Choose Location");
    step1Col.tabIndex = 0;
    step1Col.addEventListener("click", goBookStep1);
    step1Col.addEventListener("keydown", onKey);

    return () => {
      delete step1Col.dataset.protoBookStepBack;
      step1Col.removeAttribute("role");
      step1Col.removeAttribute("aria-label");
      step1Col.tabIndex = -1;
      step1Col.removeEventListener("click", goBookStep1);
      step1Col.removeEventListener("keydown", onKey);
    };
  }, [current]);

  // Book Step 1 — Continue: no location → location picker; else → Step 2
  useEffect(() => {
    if (SCREENS[current]?.childIndex !== 7) return;
    const screen = document.querySelector(
      ".proto-viewport > div > div:nth-child(7)"
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
      setCurrent(5); // Book - Step 2 - Date and Time
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

  // Book Appointment: single booster checkbox (page Units4) — PDP-style toggle, no clone
  useEffect(() => {
    const page5 = document.querySelector(
      ".proto-viewport > div > div:nth-child(7)"
    ) as HTMLElement | null;
    if (!page5) return;

    // Remove leftover clones from older sessions
    page5
      .querySelectorAll<HTMLElement>(".proto-chosen-checkbox")
      .forEach((el) => el.remove());

    const checkboxBlock = Array.from(
      page5.querySelectorAll<HTMLElement>("[data-name='units']")
    ).find((u) =>
      /Include booking (booster|second) dose/i.test(u.textContent ?? "")
    );
    if (!checkboxBlock) return;

    checkboxBlock.classList.add("proto-page-booster-checkbox");

    // Match PDP Deal Details label exactly (incl. + £75.00)
    const PDP_CHECKBOX_LABEL = "Include booking second dose at a future date + £75.00";
    const labelP = checkboxBlock.querySelector<HTMLElement>("[data-name='Label'] p");
    if (labelP) labelP.textContent = PDP_CHECKBOX_LABEL;

    const checkboxRow = checkboxBlock.querySelector<HTMLElement>(
      "[data-name='component.input.checkbox']"
    );
    if (!checkboxRow) return;

    checkboxRow.style.cursor = "pointer";
    if (checkboxRow.dataset.checkboxChecked == null) {
      checkboxRow.dataset.checkboxChecked = "true";
    }
    const onToggle = () => {
      const next = checkboxRow.dataset.checkboxChecked !== "true";
      checkboxRow.dataset.checkboxChecked = String(next);
    };
    checkboxRow.addEventListener("click", onToggle);
    return () => checkboxRow.removeEventListener("click", onToggle);
  }, [current, chosenLocation]);

  // Screen 4 (Deal Details, child 8): wire up the Myself / Someone else toggle.
  // We tag each tab with data-toggle-index so CSS can apply the correct 3-sided
  // border (no shared inner edge) to whichever tab is inactive.
  useEffect(() => {
    const screen = document.querySelector(
      ".proto-viewport > div > div:nth-child(8)"
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

  // Screen 4 (Deal Details, child 8): second dose checkbox.
  // Starts checked (£150 = £75 base + £75 addon). Unchecking drops price to £75.
  useEffect(() => {
    const screen = document.querySelector(
      ".proto-viewport > div > div:nth-child(8)"
    ) as HTMLElement | null;
    if (!screen) return;

    const checkboxRow = screen.querySelector<HTMLElement>(
      "[data-name='component.input.checkbox']"
    );
    if (!checkboxRow) return;

    // Forcibly strip teal background from the checkbox section (Units7) and
    // every ancestor up to component.pdp.rtb via inline style — CSS alone has
    // not been able to override the source of the teal.
    const checkboxSection = checkboxRow.parentElement;
    if (checkboxSection) {
      checkboxSection.style.setProperty("background", "white", "important");
      checkboxSection.style.setProperty("background-color", "white", "important");
    }
    // Clear bg on the description sibling only — leave checkboxRow unstyled
    // so CSS :hover can apply the teal tint freely.
    Array.from(checkboxSection?.children ?? []).forEach((child) => {
      if (child !== checkboxRow) {
        (child as HTMLElement).style?.setProperty("background", "transparent", "important");
      }
    });

    // The navy "Book now" button is the first component.input.button in the RTB.
    // Its price is the last <span> inside: "Book now - " | "£" | "150"
    const navyButton = screen.querySelector<HTMLElement>(
      "[data-name='component.input.button']"
    );
    const allSpans = navyButton ? Array.from(navyButton.querySelectorAll("span")) : [];
    const priceSpan = allSpans.length ? allSpans[allSpans.length - 1] : null;

    let checked = true;
    checkboxRow.dataset.checkboxChecked = "true";
    // Sync price to initial state immediately
    if (priceSpan) priceSpan.textContent = "150";

    const toggle = () => {
      checked = !checked;
      checkboxRow.dataset.checkboxChecked = String(checked);
      if (priceSpan) priceSpan.textContent = checked ? "150" : "75";
    };

    checkboxRow.addEventListener("click", toggle);
    return () => checkboxRow.removeEventListener("click", toggle);
  }, []);

  // Screen 4: favourite heart toggle
  useEffect(() => {
    const screen = document.querySelector(
      ".proto-viewport > div > div:nth-child(8)"
    ) as HTMLElement | null;
    if (!screen) return;

    const favIcon = screen.querySelector<HTMLElement>("[data-name='icon=add to wishlist']");
    const favBtn = favIcon?.closest<HTMLElement>("[data-name='component.input.button']");
    if (!favBtn || !favIcon) return;

    const path = favIcon.querySelector<SVGPathElement>("path");
    const originalD = path?.getAttribute("d") ?? "";

    // Solid filled heart for viewBox 0 0 16 14
    const filledHeartD =
      "M8 13.5C7.6 13.2 1 8.8 1 4.5C1 2.3 2.7 1 4.5 1C6 1 7.3 1.9 8 3C8.7 1.9 10 1 11.5 1C13.3 1 15 2.3 15 4.5C15 8.8 8.4 13.2 8 13.5Z";

    let active = false;
    const toggle = () => {
      active = !active;
      favIcon.dataset.favActive = String(active);
      if (path) {
        path.setAttribute("d", active ? filledHeartD : originalD);
        path.style.fill = active ? "#e91e8c" : "";
        path.style.stroke = "none";
      }
    };

    favBtn.addEventListener("click", toggle);
    return () => favBtn.removeEventListener("click", toggle);
  }, []);

  const go = (i: number) => {
    const wasHub = hubOpen;
    if (wasHub) saveHubScroll();
    const next = Math.max(0, Math.min(SCREENS.length - 1, i));
    setHubOpen(false);
    if (wasHub || next !== current) {
      resetPrototypeScroll();
    }
    setCurrent(next);
  };

  const openHub = () => {
    if (hubOpen) {
      saveHubScroll();
      setHubOpen(false);
      return;
    }

    savePrototypeScroll();
    setHubOpen(true);
  };

  const { label, childIndex } = SCREENS[current];
  const isScreen1 = childIndex === 11 && !hubOpen;
  const navLabel = hubOpen ? PROTO_HUB_LABEL : label;

  /**
   * Screen 1 uses a height:100% chain so the body fills exactly the available
   * viewport space without adding a scrollbar. Other screens use height:auto
   * so they scroll naturally when their content is taller than the viewport.
   */
  const dynamicCSS = `
    /* Frame219 root height depends on active screen */
    .proto-viewport > div {
      height: ${isScreen1 ? "100%" : "auto"} !important;
      width: 100% !important;
    }

    /* Hide all screens */
    .proto-viewport > div > div {
      display: none !important;
    }

    /* Active screen: pull into normal flow, full-width */
    .proto-viewport > div > div:nth-child(${childIndex}) {
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      position: static !important;
      width: 100% !important;
      min-width: 1200px !important;
      max-width: unset !important;
      left: auto !important;
      top: auto !important;
      height: ${isScreen1 ? "100%" : "auto"} !important;
      min-height: unset !important;
      overflow: visible !important;
      animation: proto-fade 0.25s ease;
    }

    /*
     * Some screens hardcode w-[1440px] on the header/footer instead of w-full.
     * Override all of them to stretch full-width for the active screen.
     */
    .proto-viewport > div > div:nth-child(${childIndex}) [data-name="boots-pharmacy.module.header"],
    .proto-viewport > div > div:nth-child(${childIndex}) [data-name="boots.phm.module.footer"],
    .proto-viewport > div > div:nth-child(${childIndex}) [data-name="boots-pharmacy.module.footer"],
    .proto-viewport > div > div:nth-child(${childIndex}) [data-name="module.footer"],
    .proto-viewport > div > div:nth-child(${childIndex}) [data-name="module.breadcrumbs"],
    .proto-viewport > div > div:nth-child(${childIndex}) [data-name="boots.phm.module.footer.copyright"] {
      width: 100% !important;
      min-width: 1200px !important;
    }

    /*
     * Screen 1 height chain:
     * viewportRef (flex-1, computed height H)
     *   .proto-viewport (height: 100% = H)
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
    .proto-viewport > div > div:nth-child(11) {
      min-height: 100% !important;
      height: 100% !important;
    }
    .proto-viewport > div > div:nth-child(11) > [data-name="body"] {
      flex: 1 1 auto !important;
      width: 100% !important;
      min-height: 0 !important;
      height: auto !important;
      align-self: stretch !important;
    }
    .proto-viewport > div > div:nth-child(11) > [data-name="body"] > div {
      height: 100% !important;
      min-height: 100% !important;
      flex: 1 !important;
      overflow: hidden !important;
    }
    .proto-viewport > div > div:nth-child(11) > [data-name="body"] > div > div {
      height: 100% !important;
      min-height: 100% !important;
    }

    /*
     * Screen 7 (child 5, FrameForUx) has a doubly-nested absolute wrapper:
     *   FrameForUx (absolute, h-[1909px]) → GuideStep (absolute, left-0, overflow-clip)
     * The outer override above flattens FrameForUx; this flattens GuideStep too.
     */
    .proto-viewport > div > div:nth-child(5) > [data-name="Guide. Step 8"] {
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
    .proto-viewport > div > div:nth-child(7) [data-name='component.input.field']:hover [data-name='Text Field'] {
      box-shadow: inset 0 0 0 2px #012169 !important;
    }

    /* GPS button beside the search field — scope the ::before circle so it doesn't
       bleed outside the button bounds (it's already correct; this prevents z-index
       stacking issues with the search row). */
    .proto-viewport > div > div:nth-child(7) [data-name="component.input.button"] {
      overflow: visible !important;
    }

    @keyframes proto-fade {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
  `;

  return (
    <div
      className="flex flex-col h-full max-h-[100dvh] overflow-hidden"
      style={{ fontFamily: "'Open Sans', sans-serif" }}
    >
      <style>{dynamicCSS}</style>

      <ProtoNavChrome
        current={current}
        hubOpen={hubOpen}
        navLabel={navLabel}
        isProtoPristine={isProtoPristine}
        tabsScrollRef={tabsScrollRef}
        tabBtnRefs={tabBtnRefs}
        onOpenHub={openHub}
        onGo={go}
        onReset={resetPrototype}
      />

      {/* Hub + prototype each keep their own scroll position (stay mounted). */}
      <div className="flex flex-1 min-h-0 w-full flex-col overflow-hidden bg-white">
        <div
          ref={hubScrollElRef}
          className={`proto-scroll min-h-0 flex-1 overflow-y-auto overflow-x-hidden w-full${
            hubOpen ? "" : " hidden"
          }`}
          onScroll={saveHubScroll}
        >
          <ProtoHubViewport onGoToTab={go} />
        </div>
        <div
          ref={prototypeScrollElRef}
          className={`proto-scroll min-h-0 flex-1 overflow-y-auto overflow-x-hidden w-full${
            hubOpen ? " hidden" : ""
          }`}
          onScroll={savePrototypeScroll}
        >
          <div
            className="proto-viewport w-full"
            style={{ height: isScreen1 ? "100%" : "auto" }}
          >
            <Frame219 />
          </div>
        </div>
      </div>

      <AvailabilityTool
        open={availabilityOpen}
        openIntent={availIntent}
        onClose={closeAvailabilityTool}
        onChooseLocation={(store) => {
          setChosenLocation({
            name: store.name,
            address: store.address,
            storeId: store.id,
          });
          closeAvailabilityTool();
        }}
        onBookNow={(store) => {
          setChosenLocation({
            name: store.name,
            address: store.address,
            storeId: store.id,
          });
          closeAvailabilityTool();
          // Defer nav so this click cannot ghost-hit Step 1 Continue → Step 2.
          window.setTimeout(() => setCurrent(4), 0);
        }}
      />

      <VaccinePickerPopup
        open={vaccinePickerOpen}
        selectedId={chosenVaccine.id}
        onClose={closeVaccinePicker}
        onSelect={(vaccine: VaccineItem) => {
          setChosenVaccine({ id: vaccine.id, name: vaccine.bookLabel });
        }}
      />

      <RecipientPickerPopup
        open={recipientPickerOpen}
        selected={chosenRecipient}
        onClose={closeRecipientPicker}
        onSelect={setChosenRecipient}
      />
    </div>
  );
}
