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
  if (n % 10 === 1) return `${n}st`;
  if (n % 10 === 2) return `${n}nd`;
  if (n % 10 === 3) return `${n}rd`;
  return `${n}th`;
}

export function formatBookingDateHeading(
  month: "June" | "July",
  day: number
): string {
  const monthIndex = month === "July" ? 6 : 5;
  const date = new Date(2026, monthIndex, day);
  return `${BOOKING_WEEKDAYS[date.getDay()]}, ${bookingDayOrdinal(day)} ${month} 2026`;
}
