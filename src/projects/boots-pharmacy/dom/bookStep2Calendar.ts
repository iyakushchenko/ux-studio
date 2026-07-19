/** Book Step 2 calendar — DOM helpers for journey retreat sync (playback ↔ wire). */

import {
  dispatchRetreatSync,
  type RetreatSyncDetail,
} from "@/app/scenario/retreatBridge";

export const BOOK_STEP2_RETREAT_DEFAULT_DATE = {
  month: "June",
  day: 24,
} as const;

export const BOOK_STEP2_RETREAT_DEFAULT_TIME = "16:30";

/** Default date/time baseline — Book Step 2 date/time beats on step-back. */
export const BOOK_STEP2_RETREAT_INTENT = "book-step2-default-date";

/** Full slot sync — updates wire React state (month/day/time). */
export const BOOK_STEP2_RETREAT_SLOT_INTENT = "book-step2-slot";

export type BookStep2CalendarSlot = {
  month: "June" | "July";
  day: number;
  time?: string;
};

export type BookStep2RetreatDefaultDetail = {
  month: "June" | "July";
  day: number;
  clearTime: boolean;
};

export type BookStep2RetreatSlotDetail = {
  month: "June" | "July";
  day: number;
  time?: string | null;
};

/** @deprecated Use RETREAT_SYNC_EVENT — kept for tests. */
export const BOOK_STEP2_RETREAT_DEFAULT_EVENT = "studio-retreat-sync";

const BOOKING_WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

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

export function formatBookStep2DateHeading(
  month: "June" | "July",
  day: number
): string {
  const monthIndex = month === "July" ? 6 : 5;
  const d = new Date(2026, monthIndex, day);
  return `${BOOKING_WEEKDAYS[d.getDay()]}, ${bookingDayOrdinal(day)} ${month} 2026`;
}

function findBookStep2DateHeading(screen: HTMLElement): HTMLElement | null {
  return (
    Array.from(screen.querySelectorAll("p")).find((p) =>
      /^\w+,\s*\d{1,2}(st|nd|rd|th)\s+(June|July)\s+2026/i.test(
        (p.textContent ?? "").trim()
      )
    ) ?? null
  );
}

export function bookStep2Screen(): HTMLElement | null {
  return document.querySelector<HTMLElement>(
    ".studio-viewport > div > div:nth-child(4)"
  );
}

function calCellLabel(cell: HTMLElement): string {
  return cell.querySelector("p")?.textContent?.trim() ?? "";
}

function findBookStep2MonthRoots(
  screen: HTMLElement
): { month: "June" | "July"; root: HTMLElement }[] {
  const monthRoots: { month: "June" | "July"; root: HTMLElement }[] = [];
  Array.from(screen.querySelectorAll("p")).forEach((p) => {
    const label = (p.textContent ?? "").trim();
    if (label !== "June" && label !== "July") return;
    const month = label as "June" | "July";
    let root: HTMLElement | null = p.parentElement;
    while (root && root !== screen) {
      const cells = root.querySelectorAll('[data-name="calendar. date. cell"]')
        .length;
      if (cells >= 20) {
        monthRoots.push({ month, root });
        break;
      }
      root = root.parentElement;
    }
  });
  return monthRoots;
}

function findBookStep2DateCell(
  screen: HTMLElement,
  month: "June" | "July",
  day: number
): HTMLElement | null {
  const byData = screen.querySelector<HTMLElement>(
    `[data-name="calendar. date. cell"][data-studio-cal-kind="date"][data-studio-cal-month="${month}"][data-studio-cal-value="${day}"]`
  );
  if (byData && byData.dataset.studioCalUnavailable !== "true") return byData;

  const monthRoots = findBookStep2MonthRoots(screen);
  for (const cell of screen.querySelectorAll<HTMLElement>(
    '[data-name="calendar. date. cell"]'
  )) {
    if (calCellLabel(cell) !== String(day)) continue;
    const monthRoot = monthRoots.find(({ root }) => root.contains(cell));
    if (monthRoot?.month === month) return cell;
  }
  return null;
}

function findBookStep2TimeCell(
  screen: HTMLElement,
  time: string
): HTMLElement | null {
  const byData = screen.querySelector<HTMLElement>(
    `[data-name="calendar. date. cell"][data-studio-cal-kind="time"][data-studio-cal-value="${time}"]`
  );
  if (byData && byData.dataset.studioCalUnavailable !== "true") return byData;

  for (const cell of screen.querySelectorAll<HTMLElement>(
    '[data-name="calendar. date. cell"]'
  )) {
    if (calCellLabel(cell) === time) return cell;
  }
  return null;
}

function stripBookStep2CalCellChrome(cell: HTMLElement): void {
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
  cell.querySelectorAll<HTMLElement>("div, p").forEach((el) => {
    el.className = el.className
      .replace(/font-\['Inter:[^']+'\]/g, "font-['Open_Sans:Regular',sans-serif]")
      .replace(/\bfont-semibold\b/g, "font-normal")
      .replace(/\bfont-bold\b/g, "font-normal")
      .replace(/\btext-\[16px\]\b/g, "text-[13px]")
      .replace(/\bleading-\[16px\]\b/g, "leading-[24px]")
      .replace(/\s+/g, " ")
      .trim();
    el.style.removeProperty("font-weight");
    el.style.removeProperty("font-size");
    el.style.removeProperty("font-family");
  });
}

/** Apply date/time selection on Book Step 2 — works before wire metadata is attached. */
export function applyBookStep2CalendarFromSlot(
  screen: HTMLElement,
  slot: BookStep2CalendarSlot
): boolean {
  // React pilot owns selection via props — do not strip React cell chrome.
  if (screen.dataset.studioReactScreen === "book-step-2") {
    return true;
  }

  screen
    .querySelectorAll<HTMLElement>('[data-name="calendar. date. cell"]')
    .forEach((cell) => {
      delete cell.dataset.studioCalSelected;
      stripBookStep2CalCellChrome(cell);
    });

  const dateCell = findBookStep2DateCell(screen, slot.month, slot.day);
  if (!dateCell || dateCell.dataset.studioCalUnavailable === "true") {
    return false;
  }

  dateCell.dataset.studioCalSelected = "true";

  const heading = findBookStep2DateHeading(screen);
  if (heading) {
    heading.textContent = formatBookStep2DateHeading(slot.month, slot.day);
  }

  if (slot.time) {
    const timeCell = findBookStep2TimeCell(screen, slot.time);
    if (timeCell && timeCell.dataset.studioCalUnavailable !== "true") {
      timeCell.dataset.studioCalSelected = "true";
    }
  }

  return true;
}

/** Direct DOM selection — does not rely on wire click handlers or meta maps. */
export function applyBookStep2CalendarRetreatDom(
  screen: HTMLElement,
  options?: { clearTime?: boolean }
): boolean {
  const restoreDefaultTime = options?.clearTime !== false;
  return applyBookStep2CalendarFromSlot(screen, {
    month: BOOK_STEP2_RETREAT_DEFAULT_DATE.month,
    day: BOOK_STEP2_RETREAT_DEFAULT_DATE.day,
    time: restoreDefaultTime ? BOOK_STEP2_RETREAT_DEFAULT_TIME : undefined,
  });
}

export function dispatchBookStep2RetreatDefaultEvent(
  detail: BookStep2RetreatDefaultDetail = {
    month: BOOK_STEP2_RETREAT_DEFAULT_DATE.month,
    day: BOOK_STEP2_RETREAT_DEFAULT_DATE.day,
    clearTime: true,
  }
): void {
  syncBookStep2RetreatSlotDom(
    {
      month: detail.month,
      day: detail.day,
      time: detail.clearTime ? BOOK_STEP2_RETREAT_DEFAULT_TIME : undefined,
    },
    { intent: BOOK_STEP2_RETREAT_INTENT, legacyDefault: detail }
  );
}

export function dispatchBookStep2RetreatSlotEvent(
  slot: BookStep2CalendarSlot,
  options?: { intent?: string }
): void {
  syncBookStep2RetreatSlotDom(slot, {
    intent: options?.intent ?? BOOK_STEP2_RETREAT_SLOT_INTENT,
  });
}

/** Apply calendar DOM + notify wire React state — use for all book step 2 retreat baselines. */
export function syncBookStep2RetreatSlotDom(
  slot: BookStep2CalendarSlot,
  options?: {
    intent?: string;
    /** @deprecated Legacy payload for default-date intent tests. */
    legacyDefault?: BookStep2RetreatDefaultDetail;
  }
): boolean {
  const screen = bookStep2Screen();
  const ok = screen ? applyBookStep2CalendarFromSlot(screen, slot) : false;
  const intent = options?.intent ?? BOOK_STEP2_RETREAT_SLOT_INTENT;
  const data: Record<string, unknown> =
    options?.legacyDefault != null
      ? { ...options.legacyDefault }
      : {
          month: slot.month,
          day: slot.day,
          time: slot.time ?? null,
        };
  dispatchRetreatSync({
    beatId: "",
    channel: "book",
    intent,
    data,
  });
  return ok;
}

export function syncBookStep2RetreatDefaultDom(options?: {
  clearTime?: boolean;
}): boolean {
  const clearTime = options?.clearTime !== false;
  return syncBookStep2RetreatSlotDom(
    {
      month: BOOK_STEP2_RETREAT_DEFAULT_DATE.month,
      day: BOOK_STEP2_RETREAT_DEFAULT_DATE.day,
      time: clearTime ? BOOK_STEP2_RETREAT_DEFAULT_TIME : undefined,
    },
    {
      intent: BOOK_STEP2_RETREAT_INTENT,
      legacyDefault: {
        month: BOOK_STEP2_RETREAT_DEFAULT_DATE.month,
        day: BOOK_STEP2_RETREAT_DEFAULT_DATE.day,
        clearTime,
      },
    }
  );
}

export function isBookStep2RetreatSyncDetail(
  detail: RetreatSyncDetail
): detail is RetreatSyncDetail & {
  intent: typeof BOOK_STEP2_RETREAT_INTENT;
  data: BookStep2RetreatDefaultDetail;
} {
  return (
    detail.channel === "book" &&
    detail.intent === BOOK_STEP2_RETREAT_INTENT &&
    detail.data != null &&
    typeof detail.data.month === "string" &&
    typeof detail.data.day === "number"
  );
}

export function isBookStep2RetreatSlotDetail(
  detail: RetreatSyncDetail
): detail is RetreatSyncDetail & {
  intent: typeof BOOK_STEP2_RETREAT_SLOT_INTENT;
  data: BookStep2RetreatSlotDetail;
} {
  return (
    detail.channel === "book" &&
    detail.intent === BOOK_STEP2_RETREAT_SLOT_INTENT &&
    detail.data != null &&
    typeof detail.data.month === "string" &&
    typeof detail.data.day === "number"
  );
}
