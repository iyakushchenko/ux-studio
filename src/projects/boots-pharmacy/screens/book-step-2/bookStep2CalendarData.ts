/**
 * Book Step 2 calendar / time data.
 * Dates align with Availability Tool (CJM / retreat defaults).
 * Time availability matches Legacy Frame child 4 (grey = unavailable).
 */

export type BookStep2Month = "June" | "July";

export type BookStep2CalCell = {
  day: number;
  month: "May" | "June" | "July" | "August";
  available: boolean;
};

export type BookStep2TimeSlot = { t: string; ok: boolean };

/** June 2026 grid: leading May 31 + June 1–30 + trailing July 1–4 */
export const BOOK_STEP2_JUNE_CELLS: BookStep2CalCell[] = [
  { day: 31, month: "May", available: false },
  ...Array.from({ length: 11 }, (_, i) => ({
    day: i + 1,
    month: "June" as const,
    available: false,
  })),
  { day: 12, month: "June", available: true },
  ...Array.from({ length: 18 }, (_, i) => ({
    day: i + 13,
    month: "June" as const,
    available: true,
  })),
  ...Array.from({ length: 4 }, (_, i) => ({
    day: i + 1,
    month: "July" as const,
    available: false,
  })),
];

/** July 2026: leading Jun 28–30 + July 1–31 + trailing Aug 1 */
export const BOOK_STEP2_JULY_CELLS: BookStep2CalCell[] = [
  { day: 28, month: "June", available: false },
  { day: 29, month: "June", available: false },
  { day: 30, month: "June", available: false },
  ...Array.from({ length: 10 }, (_, i) => ({
    day: i + 1,
    month: "July" as const,
    available: true,
  })),
  ...Array.from({ length: 21 }, (_, i) => ({
    day: i + 11,
    month: "July" as const,
    available: false,
  })),
  { day: 1, month: "August", available: false },
];

export const BOOK_STEP2_WEEKDAYS = [
  "MO",
  "TU",
  "WE",
  "TH",
  "FR",
  "SA",
  "SU",
] as const;

/** Legacy Book Step 2 morning row — only 11:20 available. */
export const BOOK_STEP2_MORNING: BookStep2TimeSlot[] = [
  { t: "09:20", ok: false },
  { t: "09:35", ok: false },
  { t: "09:50", ok: false },
  { t: "10:05", ok: false },
  { t: "10:20", ok: false },
  { t: "10:35", ok: false },
  { t: "10:50", ok: false },
  { t: "11:05", ok: false },
  { t: "11:20", ok: true },
  { t: "11:35", ok: false },
];

/** Legacy afternoon — slots open from 15:15 (playback reserve uses 15:30). */
export const BOOK_STEP2_AFTERNOON: BookStep2TimeSlot[] = [
  { t: "12:15", ok: false },
  { t: "12:30", ok: false },
  { t: "12:45", ok: false },
  { t: "13:00", ok: false },
  { t: "13:15", ok: false },
  { t: "13:30", ok: false },
  { t: "13:45", ok: false },
  { t: "14:00", ok: false },
  { t: "14:15", ok: false },
  { t: "14:30", ok: false },
  { t: "14:45", ok: false },
  { t: "15:00", ok: false },
  { t: "15:15", ok: true },
  { t: "15:30", ok: true },
  { t: "15:45", ok: true },
  { t: "16:00", ok: true },
  { t: "16:15", ok: true },
  { t: "16:30", ok: true },
  { t: "16:45", ok: true },
];

export const BOOK_STEP2_EVENING: BookStep2TimeSlot[] = [
  { t: "17:00", ok: true },
  { t: "17:15", ok: true },
  { t: "17:30", ok: true },
  { t: "17:45", ok: true },
  { t: "18:00", ok: true },
  { t: "18:15", ok: true },
  { t: "18:30", ok: true },
  { t: "18:45", ok: true },
  { t: "19:00", ok: true },
  { t: "19:15", ok: false },
  { t: "19:30", ok: false },
  { t: "19:45", ok: true },
  { t: "20:00", ok: true },
  { t: "20:15", ok: true },
  { t: "20:30", ok: true },
  { t: "20:45", ok: true },
];

const BOOKING_WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

function dayOrdinal(n: number): string {
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

export function formatBookStep2Heading(
  month: BookStep2Month,
  day: number
): string {
  const monthIndex = month === "July" ? 6 : 5;
  const d = new Date(2026, monthIndex, day);
  return `${BOOKING_WEEKDAYS[d.getDay()]}, ${dayOrdinal(day)} ${month} 2026`;
}

export function chunkRows<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}
