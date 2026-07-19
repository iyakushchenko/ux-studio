import { describe, expect, it } from "vitest";
import {
  INDEX_PDP,
  PROJECT_SCREENS,
} from "@/projects/boots-pharmacy/screens/screens";
import {
  PDP_CHILD_INDEX,
  PDP_REACT_SCREEN_ID,
  PDP_SCREEN_SELECTOR,
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
});
