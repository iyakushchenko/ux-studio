import { describe, expect, it } from "vitest";

import { PROJECT_SCREENS } from "@/projects/boots-pharmacy/screens/screens";
import {
  APPOINTMENT_DETAILS_CHILD_INDEX,
  APPOINTMENT_DETAILS_CRUMB_HISTORY,
  APPOINTMENT_DETAILS_NAV_ACTIVE,
  APPOINTMENT_DETAILS_NAV_ITEMS,
  APPOINTMENT_DETAILS_REACT_SCREEN_ID,
  APPOINTMENT_DETAILS_ROW_LABELS,
  APPOINTMENT_DETAILS_SCREEN_SELECTOR,
  APPOINTMENT_DETAILS_TITLE,
} from "../appointmentDetailsContract";

describe("appointmentDetailsContract", () => {
  it("matches Studio screen registry child index for Appointment Details", () => {
    const screen = PROJECT_SCREENS.find(
      (s) => s.screenId === "appointment-details"
    );
    expect(screen?.childIndex).toBe(APPOINTMENT_DETAILS_CHILD_INDEX);
    expect(screen?.screenId).toBe(APPOINTMENT_DETAILS_REACT_SCREEN_ID);
    expect(APPOINTMENT_DETAILS_SCREEN_SELECTOR).toContain(
      `nth-child(${APPOINTMENT_DETAILS_CHILD_INDEX})`
    );
    expect(APPOINTMENT_DETAILS_CHILD_INDEX).toBe(1);
  });

  it("locks title / nav active / Details Legacy row labels", () => {
    expect(APPOINTMENT_DETAILS_TITLE).toBe("Appointment Details");
    expect(APPOINTMENT_DETAILS_NAV_ACTIVE).toBe("Appointment history");
    expect(APPOINTMENT_DETAILS_NAV_ITEMS).toContain(
      APPOINTMENT_DETAILS_NAV_ACTIVE
    );
    expect(APPOINTMENT_DETAILS_CRUMB_HISTORY).toBe("Appointment history");
    expect(APPOINTMENT_DETAILS_ROW_LABELS).toContain("Vaccine Service");
    expect(APPOINTMENT_DETAILS_ROW_LABELS).toContain("Phone Number");
    expect(APPOINTMENT_DETAILS_ROW_LABELS).toContain("Date and Time");
    expect(APPOINTMENT_DETAILS_ROW_LABELS).not.toContain("Appointment date");
  });
});
