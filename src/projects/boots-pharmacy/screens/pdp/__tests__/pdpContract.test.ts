import { describe, expect, it } from "vitest";

import {
  INDEX_PDP,
  PROJECT_SCREENS,
} from "@/projects/boots-pharmacy/screens/screens";
import {
  PDP_ACCORDION_DEFAULT_OPEN,
  PDP_ACCORDION_PANELS,
  PDP_APPOINTMENT_STRIP,
  PDP_CHILD_INDEX,
  PDP_INTRO_PARAGRAPHS,
  PDP_REACT_SCREEN_ID,
  PDP_SCREEN_SELECTOR,
  PDP_SERVICE_BLURB,
  PDP_SPECS_ROWS,
} from "../pdpContract";

describe("pdpContract", () => {
  it("matches Studio screen registry child index for PDP", () => {
    const screen = PROJECT_SCREENS.find((s) =>
      /pdp\. vaccine details page/i.test(s.label)
    );
    expect(screen?.childIndex).toBe(PDP_CHILD_INDEX);
    expect(screen?.screenId).toBe(PDP_REACT_SCREEN_ID);
    expect(INDEX_PDP).toBe(
      PROJECT_SCREENS.findIndex((s) => s.childIndex === PDP_CHILD_INDEX)
    );
    expect(PDP_SCREEN_SELECTOR).toContain(`nth-child(${PDP_CHILD_INDEX})`);
    expect(PDP_REACT_SCREEN_ID).toBe("pdp");
  });

  it("locks below-fold Make + Bea FAQ bodies for L16 / L18 / L19", () => {
    expect(PDP_INTRO_PARAGRAPHS).toHaveLength(2);
    expect(PDP_SERVICE_BLURB).toMatch(/private Chickenpox Vaccination Service/i);
    expect(PDP_APPOINTMENT_STRIP).toMatch(/15 minutes/i);
    expect(PDP_SPECS_ROWS.map((r) => r.label)).toEqual([
      "Vaccine",
      "Course",
      "Administration",
      "Eligibility",
      "Price",
      "Availability",
    ]);
    expect(PDP_ACCORDION_PANELS).toHaveLength(6);
    expect([...PDP_ACCORDION_DEFAULT_OPEN]).toEqual(["who-is-at-risk"]);

    expect(PDP_ACCORDION_PANELS.every((p) => p.body && p.id && p.title)).toBe(
      true
    );
    expect(PDP_ACCORDION_PANELS.map((p) => p.id)).toEqual([
      "how-can-boots-help",
      "who-is-at-risk",
      "what-happens-at-appointment",
      "nhs-vaccination",
      "already-have-chickenpox",
      "personal-data",
    ]);

    const help = PDP_ACCORDION_PANELS.find((p) => p.id === "how-can-boots-help");
    expect(help?.body).toContain(PDP_SERVICE_BLURB);
    expect(help?.body).toMatch(/book online/i);
    expect(help?.source).toBe("make+bea");

    expect(
      PDP_ACCORDION_PANELS.find((p) => p.id === "who-is-at-risk")?.body
    ).toMatch(/weakened immune system/);

    const appt = PDP_ACCORDION_PANELS.find(
      (p) => p.id === "what-happens-at-appointment"
    );
    expect(appt?.body).toMatch(/15 minutes/);
    expect(appt?.body).toMatch(/upper arm or thigh/);
    expect(appt?.body).toMatch(/medical history/i);

    const beaOnly = PDP_ACCORDION_PANELS.filter((p) => p.source === "bea");
    expect(beaOnly.map((p) => p.id)).toEqual([
      "nhs-vaccination",
      "already-have-chickenpox",
      "personal-data",
    ]);
    expect(beaOnly.every((p) => (p.body?.split(/[.!?]/).length ?? 0) >= 3)).toBe(
      true
    );
    expect(
      PDP_ACCORDION_PANELS.find((p) => p.id === "nhs-vaccination")?.body
    ).toMatch(/not routinely offered on the NHS/i);
    expect(
      PDP_ACCORDION_PANELS.find((p) => p.id === "already-have-chickenpox")?.body
    ).toMatch(/natural immunity/i);
    expect(
      PDP_ACCORDION_PANELS.find((p) => p.id === "personal-data")?.body
    ).toMatch(/data protection/i);
  });
});
