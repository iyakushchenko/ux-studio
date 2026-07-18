import { describe, expect, it } from "vitest";
import { resolveStudioTouchpoint } from "@/app/nav/resolveStudioTouchpoint";

describe("resolveStudioTouchpoint", () => {
  it("uses short availability step labels", () => {
    expect(
      resolveStudioTouchpoint({
        availabilityOpen: true,
        availStep: "list",
        vaccinePickerOpen: false,
        recipientPickerOpen: false,
        loginPopupOpen: false,
        quickViewOpen: false,
      })
    ).toEqual({ label: "Choose pharmacy", key: "popup:availability:list" });
  });

  it("uses short popup labels", () => {
    expect(
      resolveStudioTouchpoint({
        availabilityOpen: false,
        vaccinePickerOpen: true,
        recipientPickerOpen: false,
        loginPopupOpen: false,
        quickViewOpen: false,
      })
    ).toEqual({ label: "Choose vaccine", key: "popup:vaccine" });
  });
});
