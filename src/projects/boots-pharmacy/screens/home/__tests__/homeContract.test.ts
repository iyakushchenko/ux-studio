import { describe, expect, it } from "vitest";

import { PROJECT_SCREENS } from "@/projects/boots-pharmacy/screens/screens";
import { AGENTIC_HOME_DEMO_QUERY } from "@/projects/boots-pharmacy/playback/sitePilotHome";
import {
  HOME_CHILD_INDEX,
  HOME_CHIP_LABELS,
  HOME_HEADING_DEFAULT,
  HOME_HEADING_LOGGED_IN,
  HOME_QUERY_DEFAULT,
  HOME_REACT_SCREEN_ID,
  HOME_SCREEN_SELECTOR,
  HOME_SUGGESTED_LABEL,
  homeChipActionId,
  homeChipSlug,
  resolveHomeHeading,
} from "../homeContract";

describe("homeContract", () => {
  it("matches Studio screen registry child index for Home", () => {
    const screen = PROJECT_SCREENS.find((s) =>
      /agentic\. site pilot\. home/i.test(s.label)
    );
    expect(screen?.childIndex).toBe(HOME_CHILD_INDEX);
    expect(screen?.screenId).toBe(HOME_REACT_SCREEN_ID);
    expect(HOME_SCREEN_SELECTOR).toContain(`nth-child(${HOME_CHILD_INDEX})`);
    expect(HOME_REACT_SCREEN_ID).toBe("site-pilot");
  });

  it("locks Legacy Body10 heading / chips / default query", () => {
    expect(HOME_HEADING_DEFAULT).toMatch(/what health services/i);
    expect(HOME_HEADING_LOGGED_IN).toMatch(/^Sarah,/);
    expect(resolveHomeHeading(false)).toBe(HOME_HEADING_DEFAULT);
    expect(resolveHomeHeading(true)).toBe(HOME_HEADING_LOGGED_IN);

    expect(HOME_CHIP_LABELS).toEqual([
      "Vaccine services",
      "Skin health services",
      "Other Health services",
    ]);
    expect(HOME_SUGGESTED_LABEL).toBe("Suggested dialog options:");
    expect(homeChipSlug("Vaccine services")).toBe("vaccine-services");
    expect(homeChipActionId("Vaccine services")).toBe(
      "agentic-home-chip-vaccine-services"
    );
    expect(homeChipActionId("Other Health services")).toBe(
      "agentic-home-chip-other-health-services"
    );

    expect(HOME_QUERY_DEFAULT).toBe(AGENTIC_HOME_DEMO_QUERY);
  });
});
