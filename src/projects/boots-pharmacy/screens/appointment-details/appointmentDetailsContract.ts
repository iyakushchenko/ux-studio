/** Studio / CJM contract for Appointment Details React migration. */

export const APPOINTMENT_DETAILS_CHILD_INDEX = 1;

export const APPOINTMENT_DETAILS_REACT_SCREEN_ID = "appointment-details";

export const APPOINTMENT_DETAILS_SCREEN_SELECTOR = `.studio-viewport > div > div:nth-child(${APPOINTMENT_DETAILS_CHILD_INDEX})`;

/** Left-nav labels — Legacy `module.ma.navigation` (active = Appointment history). */
export const APPOINTMENT_DETAILS_NAV_ITEMS = [
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

export const APPOINTMENT_DETAILS_NAV_ACTIVE = "Appointment history";

export const APPOINTMENT_DETAILS_TITLE = "Appointment Details";

export const APPOINTMENT_DETAILS_PROFILE_HELLO = "Hello";
export const APPOINTMENT_DETAILS_PROFILE_NAME = "Sarah";

export const APPOINTMENT_DETAILS_CRUMB_HOME = "Home";
export const APPOINTMENT_DETAILS_CRUMB_HISTORY = "Appointment history";
export const APPOINTMENT_DETAILS_CRUMB_CURRENT = "Appointment Details";

export const APPOINTMENT_DETAILS_VACCINATIONS_HEADER =
  "Vaccinations in this Appointment (1)";

/** UXDS Accordion item id — Vaccinations band (interactive kit, not dead header). */
export const APPOINTMENT_DETAILS_VACCINATIONS_ITEM_ID = "vaccinations";

export const APPOINTMENT_DETAILS_SUMMARY_TITLE = "Appointment Summary";
export const APPOINTMENT_DETAILS_SUMMARY_DISCOUNT = "Appointment Discount";

/** Card info-row labels — Details Legacy (≠ History short labels). */
export const APPOINTMENT_DETAILS_ROW_LABELS = [
  "Appointment number",
  "Status",
  "Booked",
  "Vaccine Service",
  "Recipient",
  "Email",
  "Phone Number",
  "Location",
  "Date and Time",
  "Total",
] as const;

/** Static Legacy hire chrome — do not invent new billing identity. */
export const APPOINTMENT_DETAILS_CONTACT_EMAIL = "s.jenkins@example.com";
export const APPOINTMENT_DETAILS_BILLING_NAME = "Sarah Jenkins";
export const APPOINTMENT_DETAILS_BILLING_LINES = [
  "Y Gilan Llangoed BEAUMARIS",
  "LL58 8SS",
  "United Kingdom",
] as const;
export const APPOINTMENT_DETAILS_BILLING_PHONE = "+447400123456";
export const APPOINTMENT_DETAILS_PAYMENT_MASK = "**** 8139  01/29";
