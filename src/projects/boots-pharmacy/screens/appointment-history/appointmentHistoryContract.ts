/** Studio / CJM contract for Appointment History React migration. */

export const APPOINTMENT_HISTORY_CHILD_INDEX = 2;

export const APPOINTMENT_HISTORY_REACT_SCREEN_ID = "appointment-history";

export const APPOINTMENT_HISTORY_SCREEN_SELECTOR = `.studio-viewport > div > div:nth-child(${APPOINTMENT_HISTORY_CHILD_INDEX})`;

/** Left-nav labels — Legacy `module.ma.navigation` (active = Appointment history). */
export const APPOINTMENT_HISTORY_NAV_ITEMS = [
  "My Account",
  "My invoices",
  "Profile details",
  "Change password",
  "Appointment history",
  "My support cases",
  "My address book",
  "My payment methods",
  "My marketing preferences",
  "Wishlist",
] as const;

export const APPOINTMENT_HISTORY_NAV_ACTIVE = "Appointment history";

export const APPOINTMENT_HISTORY_TITLE = "Appointment History";

export const APPOINTMENT_HISTORY_HELP_PREFIX =
  "Can't see your appointment in the list? ";

export const APPOINTMENT_HISTORY_HELP_LINK = "Ask Site Pilot";

export const APPOINTMENT_HISTORY_SORT_DROPDOWN = "Show All";

export const APPOINTMENT_HISTORY_LOAD_MORE = "Load more";

export const APPOINTMENT_HISTORY_PROFILE_HELLO = "Hello";
export const APPOINTMENT_HISTORY_PROFILE_NAME = "Sarah";

/** Card info-row labels (Legacy hire/order chrome rewritten by wire). */
export const APPOINTMENT_HISTORY_ROW_LABELS = [
  "Appointment number",
  "Status",
  "Booked",
  "Vaccine",
  "Recipient",
  "Email",
  "Phone",
  "Location",
  "Appointment date",
  "Total",
] as const;

export function appointmentHistoryDisplayedLabel(count: number): string {
  return `${count} Appointments displayed`;
}

export function appointmentHistoryViewedLabel(count: number): string {
  return `You've viewed ${count} of ${count} appointments`;
}
