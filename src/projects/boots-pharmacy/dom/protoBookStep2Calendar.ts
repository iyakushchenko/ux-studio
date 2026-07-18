/** Book Step 2 calendar — DOM helpers for journey retreat sync (playback ↔ wire). */

import {
  dispatchProtoRetreatSync,
  type ProtoRetreatSyncDetail,
} from "@/app/proto/protoRetreatBridge";

export const BOOK_STEP2_RETREAT_DEFAULT_DATE = {
  month: "June",
  day: 24,
} as const;

export const BOOK_STEP2_RETREAT_INTENT = "book-step2-default-date";

export type BookStep2RetreatDefaultDetail = {
  month: "June" | "July";
  day: number;
  clearTime: boolean;
};

/** @deprecated Use PROTO_RETREAT_SYNC_EVENT — kept for tests. */
export const PROTO_BOOK_STEP2_RETREAT_DEFAULT_EVENT = "proto-retreat-sync";

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
    ".proto-viewport > div > div:nth-child(4)"
  );
}

/** Direct DOM selection — does not rely on wire click handlers or meta maps. */
export function applyBookStep2CalendarRetreatDom(
  screen: HTMLElement,
  options?: { clearTime?: boolean }
): boolean {
  const { month, day } = BOOK_STEP2_RETREAT_DEFAULT_DATE;
  const clearTime = options?.clearTime !== false;

  screen
    .querySelectorAll<HTMLElement>('[data-name="calendar. date. cell"]')
    .forEach((cell) => {
      const kind = cell.dataset.protoCalKind;
      if (kind === "date" || (clearTime && kind === "time")) {
        delete cell.dataset.protoCalSelected;
      }
    });

  const dateCell = screen.querySelector<HTMLElement>(
    `[data-name="calendar. date. cell"][data-proto-cal-kind="date"][data-proto-cal-month="${month}"][data-proto-cal-value="${day}"]`
  );
  if (!dateCell || dateCell.dataset.protoCalUnavailable === "true") {
    return false;
  }

  dateCell.dataset.protoCalSelected = "true";

  const heading = findBookStep2DateHeading(screen);
  if (heading) {
    heading.textContent = formatBookStep2DateHeading(month, day);
  }

  return true;
}

export function dispatchBookStep2RetreatDefaultEvent(
  detail: BookStep2RetreatDefaultDetail = {
    month: BOOK_STEP2_RETREAT_DEFAULT_DATE.month,
    day: BOOK_STEP2_RETREAT_DEFAULT_DATE.day,
    clearTime: true,
  }
): void {
  const payload: ProtoRetreatSyncDetail = {
    beatId: "",
    channel: "book",
    intent: BOOK_STEP2_RETREAT_INTENT,
    data: { ...detail },
  };
  dispatchProtoRetreatSync(payload);
}

export function syncBookStep2RetreatDefaultDom(options?: {
  clearTime?: boolean;
}): boolean {
  const screen = bookStep2Screen();
  if (!screen) return false;
  const ok = applyBookStep2CalendarRetreatDom(screen, options);
  if (ok) {
    dispatchBookStep2RetreatDefaultEvent({
      month: BOOK_STEP2_RETREAT_DEFAULT_DATE.month,
      day: BOOK_STEP2_RETREAT_DEFAULT_DATE.day,
      clearTime: options?.clearTime !== false,
    });
  }
  return ok;
}

export function isBookStep2RetreatSyncDetail(
  detail: ProtoRetreatSyncDetail
): detail is ProtoRetreatSyncDetail & {
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
