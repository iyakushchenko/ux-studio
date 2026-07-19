import { describe, expect, it } from "vitest";
import {
  INDEX_PDP,
  PROJECT_SCREENS,
} from "@/projects/boots-pharmacy/screens/screens";
import {
  PDP_ACCORDION_PANELS,
  PDP_CHILD_INDEX,
  PDP_INTRO_PARAGRAPHS,
  PDP_REACT_SCREEN_ID,
  PDP_SCREEN_SELECTOR,
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

  it("locks below-fold Make copy for L16 / L18 / L19 (static accordion)", () => {
    expect(PDP_INTRO_PARAGRAPHS).toHaveLength(2);
    expect(PDP_SPECS_ROWS.map((r) => r.label)).toEqual([
      "Vaccine",
      "Course",
      "Administration",
      "Eligibility",
      "Price",
      "Availability",
    ]);
    expect(PDP_ACCORDION_PANELS).toHaveLength(6);
    const expanded = PDP_ACCORDION_PANELS.filter((p) => p.expanded);
    expect(expanded).toHaveLength(1);
    expect(expanded[0]?.title).toBe("Who is at risk?");
    expect(expanded[0]?.body).toMatch(/weakened immune system/);
    expect(PDP_ACCORDION_PANELS.filter((p) => p.body).length).toBe(1);
  });
});
